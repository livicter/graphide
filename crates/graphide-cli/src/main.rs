use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use graphide_engine::{derive_repo, hints_from_toml, ReviewInput, ReviewOptions};
use graphide_ir::{Extract, InnerViewNode, NodeId, ReviewSnapshot};
use graphide_plugin_rust::{extract_file, PLUGIN_ID};
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Parser, Debug)]
#[command(name = "graphide", about = "Review IDE deriver + flow engine")]
struct Cli {
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand, Debug)]
enum Cmd {
    /// Derive graph + proposed flows for a repo (first slice).
    Review {
        /// Path to package root (contains flows.toml and src/)
        #[arg(long)]
        root: PathBuf,
        /// Optional parent revision root for coverage
        #[arg(long)]
        parent: Option<PathBuf>,
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
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    match cli.cmd {
        Cmd::Review { root, parent, json } => {
            let snap = review_roots(&root, parent.as_deref())?;
            if json || true {
                println!("{}", serde_json::to_string_pretty(&snap)?);
            }
        }
        Cmd::Extract { file, repo_root } => {
            let rel = path_relative(&repo_root, &file)?;
            let src = fs::read_to_string(&file)?;
            let r = extract_file(&rel, &src)?;
            println!("{}", serde_json::to_string_pretty(&r.extract)?);
        }
        Cmd::Enter { root, flow, bubble } => {
            let snap = review_roots(&root, None)?;
            let view = inner_view(&snap, &flow, bubble)?;
            println!("{}", serde_json::to_string_pretty(&view)?);
        }
    }
    Ok(())
}

fn review_roots(root: &Path, parent: Option<&Path>) -> Result<ReviewSnapshot> {
    let (head_extracts, head_hashes) = extract_repo(root)?;
    let parent_extracts = match parent {
        Some(p) => Some(extract_repo(p)?.0),
        None => None,
    };
    let parent_hashes = match parent {
        Some(p) => extract_repo(p)?.1,
        None => HashMap::new(),
    };
    let hints_path = root.join("flows.toml");
    let hints = if hints_path.exists() {
        let text = fs::read_to_string(&hints_path)?;
        hints_from_toml(&text).context("parse flows.toml")?
    } else {
        graphide_ir::HintFile { flows: vec![] }
    };
    Ok(derive_repo(
        ReviewInput {
            head_extracts,
            parent_extracts,
            hints,
            head_file_hashes: head_hashes,
            parent_file_hashes: parent_hashes,
            previous_bubbles: None,
        },
        &ReviewOptions {
            plugin: PLUGIN_ID.into(),
        },
    ))
}

fn extract_repo(root: &Path) -> Result<(Vec<Extract>, HashMap<String, u64>)> {
    let mut extracts = Vec::new();
    let mut hashes = HashMap::new();
    for entry in WalkDir::new(root).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) != Some("rs") {
            continue;
        }
        // skip target/
        if path.components().any(|c| c.as_os_str() == "target") {
            continue;
        }
        let rel = path_relative(root, path)?;
        let src = fs::read_to_string(path)?;
        hashes.insert(rel.clone(), hash_str(&src));
        match extract_file(&rel, &src) {
            Ok(r) => extracts.push(r.extract),
            Err(e) => eprintln!("warn: extract {rel}: {e}"),
        }
    }
    Ok((extracts, hashes))
}

fn path_relative(root: &Path, file: &Path) -> Result<String> {
    let rel = file.strip_prefix(root).unwrap_or(file);
    Ok(rel.to_string_lossy().replace('\\', "/"))
}

fn hash_str(s: &str) -> u64 {
    let mut h = std::collections::hash_map::DefaultHasher::new();
    s.hash(&mut h);
    h.finish()
}

#[derive(Serialize)]
struct InnerView {
    flow: String,
    bubble: u64,
    nodes: Vec<InnerViewNode>,
}

fn inner_view(snap: &ReviewSnapshot, flow_name: &str, bubble_id: u64) -> Result<InnerView> {
    let flow = snap
        .flows
        .iter()
        .find(|f| f.name == flow_name)
        .with_context(|| format!("flow not found: {flow_name}"))?;
    let bubble = snap
        .bubbles
        .iter()
        .find(|b| b.id.0 == bubble_id)
        .with_context(|| format!("bubble not found: {bubble_id}"))?;

    let tree_set: HashSet<NodeId> = flow.tree.nodes.iter().copied().collect();
    // Children bubbles of this bubble, or leaf members.
    let child_bubbles: Vec<_> = snap
        .bubbles
        .iter()
        .filter(|b| b.parent.map(|p| p.0) == Some(bubble_id))
        .collect();

    let mut nodes = Vec::new();
    if child_bubbles.is_empty() {
        for &id in &bubble.members {
            let Some(n) = snap.graph.nodes.iter().find(|n| n.id == id) else {
                continue;
            };
            let lit = tree_set.contains(&id);
            let distance = if lit {
                Some(0)
            } else {
                Some(graph_distance(&snap.graph, &tree_set, id).unwrap_or(99))
            };
            nodes.push(InnerViewNode {
                id,
                fqn: n.fqn.clone(),
                kind: n.kind,
                lit,
                grey: !lit,
                is_leaf: true,
                distance,
            });
        }
    } else {
        for b in child_bubbles {
            let lit = b.members.iter().any(|m| tree_set.contains(m));
            let dist = b
                .members
                .iter()
                .filter_map(|m| graph_distance(&snap.graph, &tree_set, *m))
                .min();
            nodes.push(InnerViewNode {
                id: NodeId(b.id.0),
                fqn: b.label.clone(),
                kind: graphide_ir::NodeKind::Type,
                lit,
                grey: !lit,
                is_leaf: false,
                distance: dist,
            });
        }
    }

    Ok(InnerView {
        flow: flow_name.into(),
        bubble: bubble_id,
        nodes,
    })
}

fn graph_distance(
    graph: &graphide_ir::Graph,
    tree: &HashSet<NodeId>,
    target: NodeId,
) -> Option<u32> {
    use std::collections::VecDeque;
    let mut adj: HashMap<NodeId, Vec<NodeId>> = HashMap::new();
    for e in &graph.edges {
        adj.entry(e.from).or_default().push(e.to);
        adj.entry(e.to).or_default().push(e.from);
    }
    let mut q: VecDeque<(NodeId, u32)> = tree.iter().map(|id| (*id, 0)).collect();
    let mut seen: HashSet<NodeId> = tree.clone();
    while let Some((n, d)) = q.pop_front() {
        if n == target {
            return Some(d);
        }
        if let Some(ns) = adj.get(&n) {
            for &m in ns {
                if seen.insert(m) {
                    q.push_back((m, d + 1));
                }
            }
        }
    }
    None
}
