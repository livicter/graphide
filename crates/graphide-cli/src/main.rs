mod extract;
mod git;

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use extract::{collect_jobs, extract_jobs, jobs_from_sources, load_hints, path_relative};
use graphide_engine::{derive_repo, make_stamp, recheck_stamp, ReviewInput, ReviewOptions};
use graphide_ir::{InnerViewNode, NodeId, ReviewSnapshot, Stamp};
use graphide_plugin_rust::{extract_file, PLUGIN_ID};
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Parser, Debug)]
#[command(name = "graphide", about = "Review IDE deriver + flow engine")]
struct Cli {
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand, Debug)]
enum Cmd {
    /// Derive graph + proposed flows for a repo.
    Review {
        /// Workspace or package root
        #[arg(long)]
        root: PathBuf,
        /// Optional parent checkout directory (overrides git)
        #[arg(long)]
        parent: Option<PathBuf>,
        /// Git ref to diff against (default: merge-base with main/master)
        #[arg(long)]
        base: Option<String>,
        /// Skip coverage parent (git or directory)
        #[arg(long)]
        no_parent: bool,
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
            base,
            no_parent,
            json,
        } => {
            let snap = review_roots(&root, parent.as_deref(), base.as_deref(), no_parent)?;
            if json {
                println!("{}", serde_json::to_string_pretty(&snap)?);
            } else {
                print_review(&snap);
            }
        }
        Cmd::Extract { file, repo_root } => {
            let rel = path_relative(&repo_root, &file);
            let src = fs::read_to_string(&file)?;
            let r = extract_file(&rel, &src)?;
            println!("{}", serde_json::to_string_pretty(&r.extract)?);
        }
        Cmd::Enter { root, flow, bubble } => {
            let snap = review_roots(&root, None, None, true)?;
            let view = inner_view(&snap, &flow, bubble)?;
            println!("{}", serde_json::to_string_pretty(&view)?);
        }
        Cmd::Stamp { root, flow, out } => {
            let snap = review_roots(&root, None, None, true)?;
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
            let snap = review_roots(&root, None, None, true)?;
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
    base: Option<&str>,
    no_parent: bool,
) -> Result<ReviewSnapshot> {
    let jobs = collect_jobs(root)?;
    let (head_extracts, head_sources) = extract_jobs(jobs)?;
    let (parent_extracts, parent_sources) = if no_parent {
        (None, HashMap::new())
    } else if let Some(p) = parent {
        let (e, s) = extract_jobs(collect_jobs(p)?)?;
        (Some(e), s)
    } else if let Some(git_root) = git::git_root(root) {
        match git::resolve_base_rev(&git_root, base) {
            Some(rev) => {
                eprintln!("coverage parent git {rev}");
                let parent_src = git::sources_at_rev(&git_root, root, &rev, head_sources.keys())?;
                let jobs = jobs_from_sources(root, &parent_src)?;
                let (e, s) = extract_jobs(jobs)?;
                (Some(e), s)
            }
            None => (None, HashMap::new()),
        }
    } else {
        (None, HashMap::new())
    };
    let hints = load_hints(root);
    Ok(derive_repo(
        ReviewInput {
            head_extracts,
            parent_extracts,
            hints,
            head_sources,
            parent_sources,
            previous_bubbles: None,
        },
        &ReviewOptions {
            plugin: PLUGIN_ID.into(),
        },
    ))
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
