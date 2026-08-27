#![cfg_attr(
    not(test),
    deny(
        clippy::unwrap_used,
        clippy::expect_used,
        clippy::panic,
        clippy::todo,
        clippy::unimplemented
    )
)]

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use graphide_engine::{
    apply_saved_stamps, derive_repo, enter_bubble, hints_from_toml, make_stamp, progress_pct,
    recheck_stamp, stamp_filename, ProgressEvent, ReviewInput, ReviewOptions, ReviewPreview,
};
use graphide_ir::{Extract, FlowHint, HintFile, ReviewSnapshot, Stamp};
use graphide_plugin::{extract_file, has_plugin, plugin_ids_for, plugin_manifest, smoke_plugins};
use rayon::prelude::*;
use serde::Serialize;
use std::collections::HashMap;
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Mutex;
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
        /// JSON progress lines on stderr (stdout stays the snapshot).
        #[arg(long)]
        progress: bool,
        /// Do not extract a git parent even when HEAD^ exists.
        #[arg(long)]
        no_parent: bool,
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
        /// Default: `<root>/.graphide/stamps/<flow>.json`
        #[arg(long)]
        out: Option<PathBuf>,
        /// Prompt a flow without a sidecar: name=hit,hit
        #[arg(long)]
        prompt: Vec<String>,
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
    /// List compiled-in language plugins (the derivers, not editor extensions).
    Plugins {
        /// Extract a tiny snippet per language and exit non-zero if one fails.
        #[arg(long)]
        check: bool,
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
            progress,
            no_parent,
        } => {
            let snap = review_roots(&root, parent.as_deref(), &flow, progress, !no_parent)?;
            if json {
                // Compact when the UI is streaming — faster parse, same snapshot.
                if progress {
                    println!("{}", serde_json::to_string(&snap)?);
                } else {
                    println!("{}", serde_json::to_string_pretty(&snap)?);
                }
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
            let snap = review_roots(&root, None, &prompt, false, false)?;
            let view = enter_bubble(&snap, &flow, bubble)
                .with_context(|| format!("flow/bubble not found: {flow} / {bubble}"))?;
            println!("{}", serde_json::to_string_pretty(&view)?);
        }
        Cmd::Stamp {
            root,
            flow,
            out,
            prompt,
        } => {
            let snap = review_roots(&root, None, &prompt, false, false)?;
            let view = snap
                .flows
                .iter()
                .find(|f| f.name == flow)
                .with_context(|| format!("flow not found: {flow}"))?;
            let stamp = make_stamp(&snap.graph, view, &snap.plugin);
            let out = out.unwrap_or_else(|| default_stamp_path(&root, &flow));
            if let Some(parent) = out.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::write(&out, serde_json::to_string_pretty(&stamp)?)?;
            eprintln!("wrote stamp {}", out.display());
        }
        Cmd::Plugins { check } => {
            for (id, exts) in plugin_manifest() {
                println!("{id}\t{}", exts.join(","));
            }
            if check {
                let rows = smoke_plugins()?;
                for (id, nodes) in rows {
                    println!("ok {id} ({nodes} nodes)");
                }
            }
        }
        Cmd::Recheck { root, stamp, json } => {
            let snap = review_roots(&root, None, &[], false, false)?;
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
    if !snap.stamps.is_empty() {
        println!("stamps {}", snap.stamps.len());
        for s in &snap.stamps {
            println!("  {} {}", s.name, if s.holds { "holds" } else { "broken" });
        }
    }
}

fn recover_lock<T>(m: &Mutex<T>) -> std::sync::MutexGuard<'_, T> {
    m.lock().unwrap_or_else(|e| e.into_inner())
}

struct ProgressSink {
    enabled: bool,
    last: Mutex<Instant>,
    last_phase: Mutex<String>,
}

impl ProgressSink {
    fn new(enabled: bool) -> Self {
        Self {
            enabled,
            last: Mutex::new(Instant::now() - std::time::Duration::from_secs(1)),
            last_phase: Mutex::new(String::new()),
        }
    }

    fn emit(&self, ev: &ProgressEvent) {
        if !self.enabled {
            return;
        }
        let now = Instant::now();
        {
            let mut last = recover_lock(&self.last);
            let mut phase = recover_lock(&self.last_phase);
            let force = ev.phase != *phase || ev.done == ev.total || ev.pct >= 100;
            if !force && now.saturating_duration_since(*last).as_millis() < 40 {
                return;
            }
            *last = now;
            *phase = ev.phase.to_string();
        }
        if let Ok(line) = serde_json::to_string(ev) {
            let mut err = io::stderr();
            let _ = writeln!(err, "{line}");
            let _ = err.flush();
        }
    }
}

fn review_roots(
    root: &Path,
    parent: Option<&Path>,
    prompt_flows: &[String],
    emit_progress: bool,
    auto_parent: bool,
) -> Result<ReviewSnapshot> {
    let sink = ProgressSink::new(emit_progress);
    let report = |ev: &ProgressEvent| sink.emit(ev);
    let report_preview = |preview: &ReviewPreview| {
        if !emit_progress {
            return;
        }
        if let Ok(line) = serde_json::to_string(preview) {
            let mut err = io::stderr();
            let _ = writeln!(err, "{line}");
            let _ = err.flush();
        }
    };
    let t0 = Instant::now();
    report(&ProgressEvent::new("walk", "Scanning workspace…", 0, 0, 1));
    let (head_extracts, head_sources) = extract_repo(root, Some(&report), "extract", 5, 60)?;
    let files = head_extracts.len() as u32;
    let extract_ms = t0.elapsed().as_millis() as u64;
    let (parent_extracts, parent_sources) = match parent {
        Some(p) => {
            report(&ProgressEvent::new(
                "parent",
                "Extracting parent revision…",
                0,
                0,
                60,
            ));
            let (e, s) = extract_repo(p, Some(&report), "parent", 60, 70)?;
            (Some(e), s)
        }
        None if auto_parent => match git_parent_sources(root, &head_sources, &report) {
            Some((e, s)) if !e.is_empty() => (Some(e), s),
            _ => (None, HashMap::new()),
        },
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
        &ReviewOptions {
            plugin,
            progress: Some(&report),
            preview: Some(&report_preview),
        },
    );
    snap.stats.files = files;
    snap.stats.extract_ms = extract_ms;
    snap.stats.derive_ms = t1.elapsed().as_millis() as u64;
    snap.stats.elapsed_ms = t0.elapsed().as_millis() as u64;
    let saved = load_stamps(root);
    if !saved.is_empty() {
        report(&ProgressEvent::new(
            "flows",
            format!("Rechecking {} stamps", saved.len()),
            saved.len(),
            saved.len(),
            99,
        ));
        apply_saved_stamps(&mut snap, &saved);
    }
    Ok(snap)
}

fn default_stamp_path(root: &Path, flow: &str) -> PathBuf {
    root.join(".graphide")
        .join("stamps")
        .join(stamp_filename(flow))
}

fn load_stamps(root: &Path) -> Vec<Stamp> {
    let dir = root.join(".graphide").join("stamps");
    let mut out = Vec::new();
    let entries = match fs::read_dir(&dir) {
        Ok(e) => e,
        Err(_) => return out,
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) != Some("json") {
            continue;
        }
        if let Ok(text) = fs::read_to_string(&path) {
            if let Ok(stamp) = serde_json::from_str::<Stamp>(&text) {
                out.push(stamp);
            }
        }
    }
    out
}

fn git_stdout(root: &Path, args: &[&str]) -> Option<String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(root)
        .args(args)
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
    if s.is_empty() {
        None
    } else {
        Some(s)
    }
}

/// Like `git show`, but keeps empty files (stdout may be empty).
fn git_show(root: &Path, spec: &str) -> Option<String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(root)
        .args(["show", spec])
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    String::from_utf8(out.stdout).ok()
}

fn git_rel_prefix(root: &Path) -> Option<String> {
    let inside = git_stdout(root, &["rev-parse", "--is-inside-work-tree"])?;
    if inside != "true" {
        return None;
    }
    let toplevel = git_stdout(root, &["rev-parse", "--show-toplevel"])?;
    let rel = path_relative(Path::new(&toplevel), root).ok()?;
    if rel.is_empty() || rel == "." {
        Some(String::new())
    } else {
        Some(format!("{}/", rel.trim_end_matches('/')))
    }
}

fn git_parent_sources(
    root: &Path,
    head_sources: &HashMap<String, String>,
    report: &(dyn Fn(&ProgressEvent) + Send + Sync),
) -> Option<(Vec<Extract>, HashMap<String, String>)> {
    let prefix = git_rel_prefix(root)?;
    let rev = git_stdout(root, &["rev-parse", "--verify", "HEAD^"])?;
    report(&ProgressEvent::new(
        "parent",
        format!("Extracting git parent {rev:.7}…"),
        0,
        head_sources.len(),
        60,
    ));
    let mut sources = HashMap::new();
    for rel in head_sources.keys() {
        let spec = format!("{rev}:{prefix}{rel}");
        if let Some(src) = git_show(root, &spec) {
            sources.insert(rel.clone(), src);
        }
    }
    if sources.is_empty() {
        return None;
    }
    let mut extracts = Vec::new();
    let total = sources.len();
    for (i, (rel, src)) in sources.iter().enumerate() {
        report(&ProgressEvent::new(
            "parent",
            rel.clone(),
            i + 1,
            total,
            progress_pct(60, 70, i + 1, total),
        ));
        if let Ok(Some(r)) = extract_file(rel, src) {
            extracts.push(r.extract);
        }
    }
    Some((extracts, sources))
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

fn extract_repo(
    root: &Path,
    progress: Option<&(dyn Fn(&ProgressEvent) + Send + Sync)>,
    phase: &'static str,
    lo: u8,
    hi: u8,
) -> Result<(Vec<Extract>, HashMap<String, String>)> {
    let mut jobs = Vec::new();
    let mut seen = 0usize;
    for entry in WalkDir::new(root).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if !path.is_file() || skip_dir(path) {
            continue;
        }
        seen += 1;
        if seen % 80 == 0 {
            if let Some(p) = progress {
                p(&ProgressEvent::new(
                    "walk",
                    format!("Scanning… {seen} files"),
                    seen,
                    0,
                    lo.saturating_sub(2).max(1),
                ));
            }
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
    let total = jobs.len();
    if let Some(p) = progress {
        p(&ProgressEvent::new(
            phase,
            format!("Extracting 0/{total}"),
            0,
            total,
            lo,
        ));
    }
    let done = AtomicUsize::new(0);
    let extracted: Vec<_> = jobs
        .par_iter()
        .filter_map(|(rel, src)| {
            if let Some(p) = progress {
                let n = done.fetch_add(1, Ordering::Relaxed) + 1;
                p(&ProgressEvent::new(
                    phase,
                    rel.clone(),
                    n,
                    total,
                    progress_pct(lo, hi, n, total),
                ));
            }
            match extract_file(rel, src) {
                Ok(Some(r)) => Some((rel.clone(), src.clone(), r.extract)),
                Ok(None) => None,
                Err(e) => {
                    eprintln!("warn: extract {rel}: {e}");
                    None
                }
            }
        })
        .collect();
    if let Some(p) = progress {
        p(&ProgressEvent::new(
            phase,
            format!("Extracted {total} files"),
            total,
            total,
            hi,
        ));
    }
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
                    | ".graphide"
            )
        )
    })
}

fn path_relative(root: &Path, file: &Path) -> Result<String> {
    let rel = file.strip_prefix(root).unwrap_or(file);
    Ok(rel.to_string_lossy().replace('\\', "/"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use std::thread;

    #[test]
    fn recover_lock_survives_poison() {
        let m = Arc::new(Mutex::new(1u32));
        let m2 = m.clone();
        let _ = thread::spawn(move || {
            let _g = recover_lock(&m2);
            panic!("poison the mutex");
        })
        .join();
        let g = recover_lock(&m);
        assert_eq!(*g, 1);
    }
}
