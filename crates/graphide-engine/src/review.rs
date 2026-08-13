use crate::cluster::{cluster, sticky_match};
use crate::coverage::{changed_nodes_with_files, coverage};
use crate::flowchart::build_flowchart;
use crate::hints::parse_flows_toml;
use crate::link::link;
use crate::steiner::steiner_tree;
use graphide_ir::{
    Extract, Finding, FindingKind, Flow, FlowView, Graph, HintFile, NodeId, ReviewSnapshot,
};
use std::collections::HashMap;

pub struct ReviewOptions {
    pub plugin: String,
}

pub struct ReviewInput {
    pub head_extracts: Vec<Extract>,
    pub parent_extracts: Option<Vec<Extract>>,
    pub hints: HintFile,
    pub head_file_hashes: HashMap<String, u64>,
    pub parent_file_hashes: HashMap<String, u64>,
    pub previous_bubbles: Option<Vec<graphide_ir::Bubble>>,
}

pub fn derive_repo(input: ReviewInput, opts: &ReviewOptions) -> ReviewSnapshot {
    let (graph, mut findings) = link(&input.head_extracts);
    let mut bubbles = cluster(&graph);
    if let Some(prev) = &input.previous_bubbles {
        sticky_match(prev, &mut bubbles);
    }

    let mut flows = Vec::new();
    let mut flow_views = Vec::new();

    for hint in &input.hints.flows {
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
        changed_nodes_with_files(
            &parent_graph,
            &graph,
            &input.parent_file_hashes,
            &input.head_file_hashes,
        )
    } else {
        // No parent: treat nothing as changed for coverage gate, or all nodes.
        // First-slice demo: empty changed unless parent provided.
        vec![]
    };

    let cov = coverage(&changed, &flows);
    for id in &cov.uncovered {
        if let Some(n) = graph.nodes.iter().find(|n| n.id == *id) {
            findings.push(Finding {
                kind: FindingKind::UncoveredNode {
                    fqn: n.fqn.clone(),
                },
                span: Some(n.span.clone()),
            });
        }
    }

    let _ = opts;
    ReviewSnapshot {
        plugin: opts.plugin.clone(),
        graph,
        bubbles,
        flows: flow_views,
        coverage: cov,
        findings,
    }
}

fn resolve_fqn(graph: &Graph, fqn: &str) -> Option<NodeId> {
    graph.nodes.iter().find(|n| n.fqn == fqn).map(|n| n.id)
}

pub fn hints_from_toml(text: &str) -> Result<HintFile, crate::hints::HintError> {
    parse_flows_toml(text)
}
