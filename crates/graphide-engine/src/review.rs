use crate::cluster::{cluster, cluster_with, sticky_match};
use crate::coverage::{changed_nodes_with_sources, coverage};
use crate::delta::architecture_delta;
use crate::flowchart::build_flowchart;
use crate::hints::parse_flows_toml;
use crate::link::link;
use crate::programs::{is_entry, programs_from_graph};
use crate::dataflow::flow_dataflow;
use crate::lifecycle::flow_lifecycle;
use crate::sequence::flow_sequence;
use crate::steiner::steiner_tree;
use graphide_ir::{
    EdgeKind, EndRole, Extract, Finding, FindingKind, Flow, FlowHint, FlowView, Graph, HintFile,
    NodeId, NodeKind, ReviewSnapshot, Steiner,
};
use serde::Serialize;
use std::collections::HashMap;

/// One JSON line on stderr when `graphide review --progress` is on.
#[derive(Clone, Debug, Serialize)]
pub struct ProgressEvent {
    pub graphide: &'static str,
    pub phase: &'static str,
    pub label: String,
    pub done: usize,
    pub total: usize,
    pub pct: u8,
}

impl ProgressEvent {
    pub fn new(
        phase: &'static str,
        label: impl Into<String>,
        done: usize,
        total: usize,
        pct: u8,
    ) -> Self {
        Self {
            graphide: "progress",
            phase,
            label: label.into(),
            done,
            total,
            pct,
        }
    }
}

/// Map `done/total` into `[lo, hi]`.
pub fn progress_pct(lo: u8, hi: u8, done: usize, total: usize) -> u8 {
    if hi <= lo {
        return lo;
    }
    if total == 0 {
        return lo;
    }
    let t = (done as f64 / total as f64).clamp(0.0, 1.0);
    lo + ((f64::from(hi - lo) * t).round() as u8)
}

/// Compact Steiner-ready graph, emitted on stderr before clustering finishes.
#[derive(Clone, Debug, Serialize)]
pub struct ReviewPreview {
    pub graphide: &'static str,
    pub plugin: String,
    pub nodes: usize,
    pub edges: usize,
    pub graph: PreviewGraph,
    pub flows: Vec<PreviewFlow>,
}

#[derive(Clone, Debug, Serialize)]
pub struct PreviewGraph {
    pub nodes: Vec<PreviewNode>,
}

#[derive(Clone, Debug, Serialize)]
pub struct PreviewNode {
    pub id: NodeId,
    pub fqn: String,
    pub kind: NodeKind,
}

#[derive(Clone, Debug, Serialize)]
pub struct PreviewFlow {
    pub name: String,
    pub hits: Vec<String>,
    pub tree: Steiner,
}

pub struct ReviewOptions<'a> {
    pub plugin: String,
    pub progress: Option<&'a (dyn Fn(&ProgressEvent) + Send + Sync)>,
    pub preview: Option<&'a (dyn Fn(&ReviewPreview) + Send + Sync)>,
}

impl ReviewOptions<'_> {
    fn report(&self, ev: ProgressEvent) {
        if let Some(p) = self.progress {
            p(&ev);
        }
    }
}

pub struct ReviewInput {
    pub head_extracts: Vec<Extract>,
    pub parent_extracts: Option<Vec<Extract>>,
    pub hints: HintFile,
    pub head_sources: HashMap<String, String>,
    pub parent_sources: HashMap<String, String>,
    pub previous_bubbles: Option<Vec<graphide_ir::Bubble>>,
}

pub fn derive_repo(input: ReviewInput, opts: &ReviewOptions) -> ReviewSnapshot {
    opts.report(ProgressEvent::new("link", "Linking FQNs…", 0, 1, 70));
    let (graph, mut findings) = link(&input.head_extracts);
    opts.report(ProgressEvent::new(
        "link",
        format!("{} nodes", graph.nodes.len()),
        1,
        1,
        74,
    ));

    // Steiner is cheap and enough to paint the story. Cluster after so the UI
    // can show the tree while the slow grouping still runs.
    let hint_flows = if input.hints.flows.is_empty() {
        default_review_hints(&graph)
    } else {
        input.hints.flows.clone()
    };
    let mut flows = Vec::new();
    let mut partials: Vec<(String, Vec<String>, Vec<NodeId>, Steiner)> = Vec::new();
    let flow_total = hint_flows.len().max(1);
    for hint in &hint_flows {
        let mut resolved = Vec::new();
        for fqn in &hint.hits {
            match resolve_fqn(&graph, fqn) {
                Some(id) => resolved.push(id),
                None => findings.push(Finding {
                    kind: FindingKind::UnmatchedHint {
                        flow: hint.name.clone(),
                        fqn: fqn.clone(),
                    },
                    span: None,
                }),
            }
        }
        let tree = steiner_tree(&graph, &resolved);
        flows.push(Flow {
            name: hint.name.clone(),
            hits: resolved.clone(),
            tree: tree.clone(),
        });
        partials.push((hint.name.clone(), hint.hits.clone(), resolved, tree));
    }
    if let Some(cb) = opts.preview {
        cb(&build_preview(&opts.plugin, &graph, &partials));
    }
    opts.report(ProgressEvent::new(
        "preview",
        if partials.is_empty() {
            "Graph linked".into()
        } else {
            format!("{} Steiner ready — clustering…", partials.len())
        },
        graph.nodes.len(),
        graph.nodes.len(),
        75,
    ));

    opts.report(ProgressEvent::new(
        "cluster",
        "Clustering…",
        0,
        graph.nodes.len(),
        76,
    ));
    let mut bubbles = cluster_with(
        &graph,
        Some(&|assigned, total| {
            opts.report(ProgressEvent::new(
                "cluster",
                format!("{assigned}/{total} nodes grouped"),
                assigned,
                total,
                progress_pct(76, 92, assigned, total),
            ));
        }),
    );
    let parent_linked = input.parent_extracts.as_ref().map(|e| link(e).0);
    if let Some(prev) = &input.previous_bubbles {
        sticky_match(prev, &mut bubbles);
    } else if let Some(parent_graph) = &parent_linked {
        let prev = cluster(parent_graph);
        sticky_match(&prev, &mut bubbles);
    }
    opts.report(ProgressEvent::new(
        "cluster",
        format!("{} bubbles", bubbles.len()),
        graph.nodes.len(),
        graph.nodes.len(),
        92,
    ));

    let mut flow_views = Vec::new();
    for (i, (name, hits, resolved, tree)) in partials.into_iter().enumerate() {
        let flowchart = build_flowchart(&graph, &bubbles, &tree);
        let sequence = flow_sequence(&graph, &tree);
        let dataflow = flow_dataflow(&graph, &tree);
        let lifecycle = flow_lifecycle(&graph, &tree);
        flow_views.push(FlowView {
            name: name.clone(),
            hits,
            resolved_hits: resolved,
            tree,
            flowchart,
            sequence,
            dataflow,
            lifecycle,
        });
        opts.report(ProgressEvent::new(
            "flows",
            format!("Flow {name}"),
            i + 1,
            flow_total,
            progress_pct(92, 98, i + 1, flow_total),
        ));
    }

    let parent_graph = parent_linked.unwrap_or_else(|| Graph {
        nodes: vec![],
        edges: vec![],
    });

    let changed = if input.parent_extracts.is_some() {
        changed_nodes_with_sources(
            &parent_graph,
            &graph,
            &input.parent_sources,
            &input.head_sources,
        )
    } else {
        // No parent: coverage gate is silent. Parent revision supplies changed nodes.
        vec![]
    };

    let cov = coverage(&changed, &flows);
    let delta = if input.parent_extracts.is_some() {
        architecture_delta(
            &parent_graph,
            &graph,
            &input.parent_sources,
            &input.head_sources,
        )
    } else {
        graphide_ir::ArchitectureDelta::default()
    };
    for id in &cov.uncovered {
        if let Some(n) = graph.nodes.iter().find(|n| n.id == *id) {
            findings.push(Finding {
                kind: FindingKind::UncoveredNode { fqn: n.fqn.clone() },
                span: Some(n.span.clone()),
            });
        }
    }

    let programs = programs_from_graph(&graph);
    opts.report(ProgressEvent::new("done", "Ready", 1, 1, 100));
    ReviewSnapshot {
        plugin: opts.plugin.clone(),
        graph,
        bubbles,
        flows: flow_views,
        coverage: cov,
        findings,
        stats: Default::default(),
        stamps: vec![],
        programs,
        delta,
    }
}

/// When the sidecar is empty, Review still has a default run: an `overview`
/// flow from derived entries, and a `control-flow` Steiner along call/data hops.
/// Hits are derived FQNs only — not agent-drawn kinds.
pub fn default_review_hints(graph: &Graph) -> Vec<FlowHint> {
    let mut entries: Vec<String> = graph
        .nodes
        .iter()
        .filter(|n| is_entry(n))
        .map(|n| n.fqn.clone())
        .collect();
    entries.sort();
    entries.dedup();
    if entries.is_empty() {
        entries = graph
            .nodes
            .iter()
            .filter(|n| n.kind == NodeKind::Function)
            .take(4)
            .map(|n| n.fqn.clone())
            .collect();
    }
    let overview: Vec<String> = entries.into_iter().take(8).collect();
    let mut cfg = control_flow_hits(graph, &overview);
    if cfg.len() < 2 || !hits_have_walkable_hops(graph, &cfg) {
        let spine = calls_spine(graph);
        if spine.len() >= 2 {
            cfg = spine;
        }
    }
    let mut out = Vec::new();
    if !overview.is_empty() {
        out.push(FlowHint {
            name: "overview".into(),
            hits: overview.clone(),
        });
    }
    if cfg.len() >= 2 {
        out.push(FlowHint {
            name: "control-flow".into(),
            hits: cfg,
        });
    } else if overview.len() >= 2 {
        out.push(FlowHint {
            name: "control-flow".into(),
            hits: overview,
        });
    }
    out
}

/// Isolated Types/consts as seeds never grow a Steiner path. Fall back
/// when none of the hits leave on a walkable hop.
fn hits_have_walkable_hops(graph: &Graph, hits: &[String]) -> bool {
    let ids: std::collections::HashSet<NodeId> = hits
        .iter()
        .filter_map(|fqn| resolve_fqn(graph, fqn))
        .collect();
    if ids.len() < 2 {
        return false;
    }
    graph.edges.iter().any(|e| {
        matches!(
            e.kind,
            EdgeKind::Calls
                | EdgeKind::Reads
                | EdgeKind::Writes
                | EdgeKind::Publishes
                | EdgeKind::Subscribes
        ) && ids.contains(&e.from)
    })
}

fn control_flow_hits(graph: &Graph, seeds: &[String]) -> Vec<String> {
    let id_of = |fqn: &str| graph.nodes.iter().find(|n| n.fqn == *fqn).map(|n| n.id);
    let mut start = Vec::new();
    for fqn in seeds {
        if let Some(id) = id_of(fqn) {
            start.push(id);
        }
    }
    if start.is_empty() {
        return seeds.to_vec();
    }
    let mut adj: HashMap<NodeId, Vec<NodeId>> = HashMap::new();
    for e in &graph.edges {
        if !matches!(
            e.kind,
            EdgeKind::Calls
                | EdgeKind::Reads
                | EdgeKind::Writes
                | EdgeKind::Publishes
                | EdgeKind::Subscribes
        ) {
            continue;
        }
        adj.entry(e.from).or_default().push(e.to);
    }
    let mut seen = std::collections::HashSet::new();
    let mut q = start.clone();
    for id in &start {
        seen.insert(*id);
    }
    let mut i = 0;
    while i < q.len() && q.len() < 48 {
        let Some(cur) = q.get(i).copied() else {
            break;
        };
        i += 1;
        for nxt in adj.get(&cur).into_iter().flatten() {
            if seen.insert(*nxt) {
                q.push(*nxt);
            }
        }
    }
    let fqn = |id: NodeId| {
        graph
            .nodes
            .iter()
            .find(|n| n.id == id)
            .map(|n| n.fqn.clone())
    };
    let mut hits = Vec::new();
    for id in &start {
        if let Some(s) = fqn(*id) {
            hits.push(s);
        }
    }
    for id in &q {
        let Some(n) = graph.nodes.iter().find(|n| n.id == *id) else {
            continue;
        };
        let sink = n
            .endpoint
            .as_ref()
            .is_some_and(|e| e.role == EndRole::Sink);
        if n.kind == NodeKind::Endpoint || sink || n.kind == NodeKind::Function {
            if !hits.iter().any(|h| h == &n.fqn) {
                hits.push(n.fqn.clone());
            }
        }
        if hits.len() >= 10 {
            break;
        }
    }
    hits
}

/// Bevy-style entries often have no extracted Calls from `main`. The default
/// control-flow is then the derived Calls spine — still closed vocabulary.
fn calls_spine(graph: &Graph) -> Vec<String> {
    let mut out_deg: HashMap<NodeId, usize> = HashMap::new();
    let mut adj: HashMap<NodeId, Vec<NodeId>> = HashMap::new();
    for e in &graph.edges {
        if e.kind != EdgeKind::Calls {
            continue;
        }
        adj.entry(e.from).or_default().push(e.to);
        *out_deg.entry(e.from).or_default() += 1;
        out_deg.entry(e.to).or_default();
    }
    let start = out_deg
        .iter()
        .max_by_key(|(id, d)| {
            let fn_bonus = graph
                .nodes
                .iter()
                .find(|n| n.id == **id)
                .is_some_and(|n| n.kind == NodeKind::Function);
            (*d, fn_bonus as usize)
        })
        .map(|(id, _)| *id);
    let Some(start) = start else {
        return Vec::new();
    };
    let mut seen = std::collections::HashSet::new();
    let mut q = vec![start];
    seen.insert(start);
    let mut i = 0;
    while i < q.len() && q.len() < 24 {
        let Some(cur) = q.get(i).copied() else {
            break;
        };
        i += 1;
        for nxt in adj.get(&cur).into_iter().flatten() {
            if seen.insert(*nxt) {
                q.push(*nxt);
            }
        }
    }
    let mut hits = Vec::new();
    for id in q {
        if let Some(n) = graph.nodes.iter().find(|n| n.id == id) {
            if n.kind == NodeKind::Function || n.kind == NodeKind::Endpoint {
                hits.push(n.fqn.clone());
            }
        }
        if hits.len() >= 10 {
            break;
        }
    }
    hits
}

/// Exact FQN, else a unique suffix / last-segment match.
/// Names that match derived FQNs are hits (SPEC §5). Language-agnostic.
pub fn resolve_fqn(graph: &Graph, fqn: &str) -> Option<NodeId> {
    if let Some(n) = graph.nodes.iter().find(|n| n.fqn == fqn) {
        return Some(n.id);
    }
    let q = fqn.trim();
    if q.is_empty() {
        return None;
    }
    let mut hits: Vec<_> = graph
        .nodes
        .iter()
        .filter(|n| {
            n.fqn.ends_with(&format!("::{q}"))
                || n.fqn.ends_with(&format!(".{q}"))
                || n.fqn.ends_with(&format!("/{q}"))
        })
        .collect();
    if hits.len() == 1 {
        return hits.first().map(|n| n.id);
    }
    hits = graph
        .nodes
        .iter()
        .filter(|n| last_seg(&n.fqn) == q)
        .collect();
    if hits.len() == 1 {
        hits.first().map(|n| n.id)
    } else {
        None
    }
}

fn last_seg(fqn: &str) -> &str {
    fqn.rsplit([':', '.', '/', '#'])
        .find(|s| !s.is_empty())
        .unwrap_or(fqn)
}

pub fn hints_from_toml(text: &str) -> Result<HintFile, crate::hints::HintError> {
    parse_flows_toml(text)
}

fn build_preview(
    plugin: &str,
    graph: &Graph,
    partials: &[(String, Vec<String>, Vec<NodeId>, Steiner)],
) -> ReviewPreview {
    let mut want = std::collections::HashSet::new();
    for (_, _, _, tree) in partials {
        want.extend(tree.nodes.iter().copied());
    }
    ReviewPreview {
        graphide: "preview",
        plugin: plugin.to_string(),
        nodes: graph.nodes.len(),
        edges: graph.edges.len(),
        graph: PreviewGraph {
            nodes: graph
                .nodes
                .iter()
                .filter(|n| want.contains(&n.id))
                .map(|n| PreviewNode {
                    id: n.id,
                    fqn: n.fqn.clone(),
                    kind: n.kind,
                })
                .collect(),
        },
        flows: partials
            .iter()
            .map(|(name, hits, _, tree)| PreviewFlow {
                name: name.clone(),
                hits: hits.clone(),
                tree: tree.clone(),
            })
            .collect(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use graphide_ir::*;

    fn span(file: &str) -> Span {
        Span {
            file: file.into(),
            start: Pos { line: 1, column: 1 },
            end: Pos { line: 2, column: 1 },
        }
    }

    fn n(kind: NodeKind, fqn: &str, file: &str) -> Node {
        Node {
            id: NodeId::from_identity(kind, fqn),
            fqn: fqn.into(),
            kind,
            span: span(file),
            endpoint: None,
        }
    }

    fn calls(from: &Node, to: &Node) -> Edge {
        Edge {
            from: from.id,
            to: to.id,
            kind: EdgeKind::Calls,
            span: from.span.clone(),
        }
    }

    #[test]
    fn default_run_seeds_main_not_types_in_main_rs() {
        let main = n(NodeKind::Function, "main", "src/main.rs");
        let cli = n(NodeKind::Type, "Cli", "src/main.rs");
        let cmd = n(NodeKind::Type, "Cmd", "src/main.rs");
        let roots = n(NodeKind::Function, "review_roots", "src/main.rs");
        let print = n(NodeKind::Function, "print_review", "src/main.rs");
        let graph = Graph {
            nodes: vec![
                cli,
                cmd,
                n(NodeKind::Type, "MAX_FILE_BYTES", "src/main.rs"),
                n(NodeKind::Function, "ProgressSink::new", "src/main.rs"),
                main.clone(),
                roots.clone(),
                print.clone(),
            ],
            edges: vec![calls(&main, &roots), calls(&roots, &print)],
        };
        let hints = default_review_hints(&graph);
        let overview = hints.iter().find(|h| h.name == "overview").expect("overview");
        assert_eq!(overview.hits, vec!["main".to_string()], "{:?}", overview.hits);
        let cfg = hints
            .iter()
            .find(|h| h.name == "control-flow")
            .expect("control-flow");
        assert!(
            cfg.hits.iter().any(|h| h == "main" || h == "review_roots"),
            "{:?}",
            cfg.hits
        );
        assert!(cfg.hits.len() >= 2, "{:?}", cfg.hits);
        let ids: Vec<_> = cfg.hits.iter().filter_map(|h| resolve_fqn(&graph, h)).collect();
        let tree = crate::steiner::steiner_tree(&graph, &ids);
        assert!(
            !tree.edges.is_empty(),
            "control-flow Steiner should walk main → callees, got {tree:?}"
        );
    }
}
