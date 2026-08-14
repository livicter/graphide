//! Inner bubble view from an already-derived snapshot. No re-extract.

use graphide_ir::{InnerView, InnerViewNode, NodeId, NodeKind, ReviewSnapshot};
use std::collections::{HashMap, HashSet, VecDeque};

pub fn enter_bubble(snap: &ReviewSnapshot, flow_name: &str, bubble_id: u64) -> Option<InnerView> {
    let flow = snap.flows.iter().find(|f| f.name == flow_name)?;
    let bubble = snap.bubbles.iter().find(|b| b.id.0 == bubble_id)?;
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
                kind: NodeKind::Type,
                lit,
                grey: !lit,
                is_leaf: false,
                distance: dist,
            });
        }
    }
    nodes.sort_by(|a, b| {
        b.lit
            .cmp(&a.lit)
            .then(a.distance.unwrap_or(99).cmp(&b.distance.unwrap_or(99)))
            .then(a.fqn.cmp(&b.fqn))
    });
    Some(InnerView {
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
