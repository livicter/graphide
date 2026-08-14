use crate::cluster::{cluster_with, sticky_match};
use crate::coverage::{changed_nodes_with_sources, coverage};
use crate::flowchart::build_flowchart;
use crate::hints::parse_flows_toml;
use crate::link::link;
use crate::steiner::steiner_tree;
use graphide_ir::{
    Extract, Finding, FindingKind, Flow, FlowView, Graph, HintFile, NodeId, ReviewSnapshot,
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

pub struct ReviewOptions<'a> {
    pub plugin: String,
    pub progress: Option<&'a (dyn Fn(&ProgressEvent) + Send + Sync)>,
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

    opts.report(ProgressEvent::new(
        "cluster",
        "Clustering…",
        0,
        graph.nodes.len(),
        75,
    ));
    let mut bubbles = cluster_with(
        &graph,
        Some(&|assigned, total| {
            opts.report(ProgressEvent::new(
                "cluster",
                format!("{assigned}/{total} nodes grouped"),
                assigned,
                total,
                progress_pct(75, 92, assigned, total),
            ));
        }),
    );
    if let Some(prev) = &input.previous_bubbles {
        sticky_match(prev, &mut bubbles);
    }
    opts.report(ProgressEvent::new(
        "cluster",
        format!("{} bubbles", bubbles.len()),
        graph.nodes.len(),
        graph.nodes.len(),
        92,
    ));

    let mut flows = Vec::new();
    let mut flow_views = Vec::new();
    let flow_total = input.hints.flows.len().max(1);

    for (i, hint) in input.hints.flows.iter().enumerate() {
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
        let flowchart = build_flowchart(&graph, &bubbles, &tree);
        let flow = Flow {
            name: hint.name.clone(),
            hits: resolved.clone(),
            tree: tree.clone(),
        };
        flow_views.push(FlowView {
            name: hint.name.clone(),
            hits: hint.hits.clone(),
            resolved_hits: resolved,
            tree,
            flowchart,
        });
        flows.push(flow);
        opts.report(ProgressEvent::new(
            "flows",
            format!("Flow {}", hint.name),
            i + 1,
            flow_total,
            progress_pct(92, 98, i + 1, flow_total),
        ));
    }

    let parent_graph = input
        .parent_extracts
        .as_ref()
        .map(|e| link(e).0)
        .unwrap_or_else(|| Graph {
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
    for id in &cov.uncovered {
        if let Some(n) = graph.nodes.iter().find(|n| n.id == *id) {
            findings.push(Finding {
                kind: FindingKind::UncoveredNode { fqn: n.fqn.clone() },
                span: Some(n.span.clone()),
            });
        }
    }

    opts.report(ProgressEvent::new("done", "Ready", 1, 1, 100));
    ReviewSnapshot {
        plugin: opts.plugin.clone(),
        graph,
        bubbles,
        flows: flow_views,
        coverage: cov,
        findings,
        stats: Default::default(),
    }
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
        return Some(hits[0].id);
    }
    hits = graph
        .nodes
        .iter()
        .filter(|n| last_seg(&n.fqn) == q)
        .collect();
    if hits.len() == 1 {
        Some(hits[0].id)
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
