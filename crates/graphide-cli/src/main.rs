use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use graphide_engine::{
    derive_repo, enter_bubble, hints_from_toml, make_stamp, recheck_stamp, ReviewInput,
    ReviewOptions,
};
use graphide_ir::{Extract, FlowHint, HintFile, ReviewSnapshot, Stamp};
use graphide_plugin::{extract_file, has_plugin, plugin_ids_for};
use rayon::prelude::*;
use serde::Serialize;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;
use walkdir::WalkDir;

const MAX_FILE_BYTES: u64 = 1_500_000;

#[derive(Parser, Debug)]
#[command(
    name = "graphide",
    about = "Review IDE deriver + flow engine. Point at any repo; plugins pick language by file extension."
)]
struct Cli {
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand, Debug)]
enum Cmd {
    /// Derive graph + proposed flows for any repo.
    Review {
        /// Workspace or package root
        #[arg(long)]
        root: PathBuf,
        /// Optional parent revision root for coverage
        #[arg(long)]
        parent: Option<PathBuf>,
        /// Prompt a flow without writing a sidecar: name=hit,hit
        #[arg(long)]
        flow: Vec<String>,
        #[arg(long)]
        json: bool,
    },
    /// Extract one file (debug).
    Extract {
        #[arg(long)]
        file: PathBuf,
        #[arg(long)]
        repo_root: PathBuf,
    },
    /// Inner bubble view for a flow + bubble.
    Enter {
        #[arg(long)]
        root: PathBuf,
        #[arg(long)]
        flow: String,
        #[arg(long)]
        bubble: u64,
        #[arg(long)]
        prompt: Vec<String>,
    },
    /// Write a human stamp for one proposed flow.
    Stamp {
        #[arg(long)]
        root: PathBuf,
        #[arg(long)]
        flow: String,
        #[arg(long)]
        out: PathBuf,
    },
    /// Recheck a stamp against the latest derived graph.
    Recheck {
        #[arg(long)]
        root: PathBuf,
        #[arg(long)]
        stamp: PathBuf,
        #[arg(long)]
        json: bool,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    match cli.cmd {
        Cmd::Review {
            root,
            parent,
            flow,
            json,
        } => {
            let snap = review_roots(&root, parent.as_deref(), &flow)?;
            if json {
                println!("{}", serde_json::to_string_pretty(&snap)?);
            } else {
                print_review(&snap);
            }
        }
        Cmd::Extract { file, repo_root } => {
            let rel = path_relative(&repo_root, &file)?;
            let src = fs::read_to_string(&file)?;
            match extract_file(&rel, &src)? {
                Some(r) => println!("{}", serde_json::to_string_pretty(&r.extract)?),
                None => anyhow::bail!("no plugin for {rel}"),
            }
        }
        Cmd::Enter {
            root,
            flow,
            bubble,
            prompt,
        } => {
            let snap = review_roots(&root, None, &prompt)?;
            let view = enter_bubble(&snap, &flow, bubble)
                .with_context(|| format!("flow/bubble not found: {flow} / {bubble}"))?;
            println!("{}", serde_json::to_string_pretty(&view)?);
        }
        Cmd::Stamp { root, flow, out } => {
            let snap = review_roots(&root, None, &[])?;
            let view = snap
                .flows
                .iter()
                .find(|f| f.name == flow)
                .with_context(|| format!("flow not found: {flow}"))?;
            let stamp = make_stamp(&snap.graph, view, &snap.plugin);
            if let Some(parent) = out.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::write(&out, serde_json::to_string_pretty(&stamp)?)?;
            eprintln!("wrote stamp {}", out.display());
        }
        Cmd::Recheck { root, stamp, json } => {
            let snap = review_roots(&root, None, &[])?;
            let text = fs::read_to_string(&stamp)?;
            let stamp: Stamp = serde_json::from_str(&text)?;
            let (view, finding) = recheck_stamp(&snap.graph, &stamp);
            let out = RecheckOut { view, finding };
            if json {
                println!("{}", serde_json::to_string_pretty(&out)?);
            } else {
                match &out.finding {
                    None => println!("stamp {} still holds", stamp.name),
                    Some(f) => println!("stamp broken: {}", serde_json::to_string_pretty(f)?),
                }
            }
        }
    }
    Ok(())
}

#[derive(Serialize)]
struct RecheckOut {
    view: graphide_ir::FlowView,
    finding: Option<graphide_ir::Finding>,
}

fn print_review(snap: &ReviewSnapshot) {
    println!("plugin {}", snap.plugin);
    println!(
        "graph {} nodes / {} edges / {} bubbles",
        snap.graph.nodes.len(),
        snap.graph.edges.len(),
        snap.bubbles.len()
    );
    for flow in &snap.flows {
        println!("flow {}", flow.name);
        println!("  hits {}", flow.hits.join(", "));
        for e in &flow.tree.edges {
            let from = snap
                .graph
                .nodes
                .iter()
                .find(|n| n.id == e.from)
                .map(|n| n.fqn.as_str())
                .unwrap_or("?");
            let to = snap
                .graph
                .nodes
                .iter()
                .find(|n| n.id == e.to)
                .map(|n| n.fqn.as_str())
                .unwrap_or("?");
            println!("  {} -{:?}-> {}", from, e.kind, to);
        }
        println!("  runs {}", flow.flowchart.runs.len());
    }
    println!(
        "timing {}ms extract / {}ms derive / {}ms total · {} files",
        snap.stats.extract_ms, snap.stats.derive_ms, snap.stats.elapsed_ms, snap.stats.files
    );
    println!(
        "coverage {} changed / {} uncovered",
        snap.coverage.changed.len(),
        snap.coverage.uncovered.len()
    );
    for id in &snap.coverage.uncovered {
        if let Some(n) = snap.graph.nodes.iter().find(|n| n.id == *id) {
            println!("  uncovered {}", n.fqn);
        }
    }
    for f in &snap.findings {
        println!("finding {:?}", f.kind);
    }
}

fn review_roots(
    root: &Path,
    parent: Option<&Path>,
    prompt_flows: &[String],
) -> Result<ReviewSnapshot> {
    let t0 = Instant::now();
    let (head_extracts, head_sources) = extract_repo(root)?;
    let files = head_extracts.len() as u32;
    let extract_ms = t0.elapsed().as_millis() as u64;
    let (parent_extracts, parent_sources) = match parent {
        Some(p) => {
            let (e, s) = extract_repo(p)?;
            (Some(e), s)
        }
        None => (None, HashMap::new()),
    };
    let mut hints = load_hints(root);
    hints.flows.extend(parse_prompt_flows(prompt_flows)?);
    let plugin = plugin_ids_for(&head_extracts);
    let t1 = Instant::now();
    let mut snap = derive_repo(
        ReviewInput {
            head_extracts,
            parent_extracts,
            hints,
            head_sources,
            parent_sources,
            previous_bubbles: None,
        },
        &ReviewOptions { plugin },
    );
    snap.stats.files = files;
    snap.stats.extract_ms = extract_ms;
    snap.stats.derive_ms = t1.elapsed().as_millis() as u64;
    snap.stats.elapsed_ms = t0.elapsed().as_millis() as u64;
    Ok(snap)
}

fn parse_prompt_flows(args: &[String]) -> Result<Vec<FlowHint>> {
    let mut out = Vec::new();
    for raw in args {
        let (name, hits) = raw
            .split_once('=')
            .with_context(|| format!("--flow expects name=hit,hit (got {raw})"))?;
        let hits: Vec<String> = hits
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
        if name.trim().is_empty() || hits.is_empty() {
            anyhow::bail!("--flow expects name=hit,hit (got {raw})");
        }
        out.push(FlowHint {
            name: name.trim().into(),
            hits,
        });
    }
    Ok(out)
}

fn load_hints(root: &Path) -> HintFile {
    let mut flows = Vec::new();
    for entry in WalkDir::new(root).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.file_name().and_then(|s| s.to_str()) != Some("flows.toml") {
            continue;
        }
        if skip_dir(path) {
            continue;
        }
        let rel = path_relative(root, path).unwrap_or_default();
        if rel != "flows.toml" && (rel.contains("fixtures/") || rel.contains("/tests/")) {
            continue;
        }
        if let Ok(text) = fs::read_to_string(path) {
            if let Ok(h) = hints_from_toml(&text) {
                flows.extend(h.flows);
            }
        }
    }
    HintFile { flows }
}

fn extract_repo(root: &Path) -> Result<(Vec<Extract>, HashMap<String, String>)> {
    let mut jobs = Vec::new();
    for entry in WalkDir::new(root).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if !path.is_file() || skip_dir(path) {
            continue;
        }
        let rel = path_relative(root, path)?;
        if !has_plugin(&rel) {
            continue;
        }
        let meta = match path.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };
        if meta.len() > MAX_FILE_BYTES {
            continue;
        }
        match fs::read_to_string(path) {
            Ok(src) => jobs.push((rel, src)),
            Err(_) => continue,
        }
    }
    let extracted: Vec<_> = jobs
        .par_iter()
        .filter_map(|(rel, src)| match extract_file(rel, src) {
            Ok(Some(r)) => Some((rel.clone(), src.clone(), r.extract)),
            Ok(None) => None,
            Err(e) => {
                eprintln!("warn: extract {rel}: {e}");
                None
            }
        })
        .collect();
    let mut extracts = Vec::with_capacity(extracted.len());
    let mut sources = HashMap::with_capacity(extracted.len());
    for (rel, src, extract) in extracted {
        sources.insert(rel, src);
        extracts.push(extract);
    }
    Ok((extracts, sources))
}

fn skip_dir(path: &Path) -> bool {
    path.components().any(|c| {
        matches!(
            c.as_os_str().to_str(),
            Some(
                "target"
                    | "node_modules"
                    | ".git"
                    | "out"
                    | "vendor"
                    | "dist"
                    | "build"
                    | "__pycache__"
                    | ".venv"
                    | "venv"
                    | ".next"
            )
        )
    })
}

fn path_relative(root: &Path, file: &Path) -> Result<String> {
    let rel = file.strip_prefix(root).unwrap_or(file);
    Ok(rel.to_string_lossy().replace('\\', "/"))
}
