use crate::cluster::node_coarse_bubble;
use graphide_ir::{
    Bubble, BubbleId, Flowchart, Graph, NodeId, Run, RunId, RunPosition, RunSpine, Steiner,
};
use indexmap::IndexMap;
use std::collections::{HashMap, HashSet, VecDeque};

/// Collapse consecutive Steiner nodes that share a coarse bubble into runs.
pub fn build_flowchart(graph: &Graph, bubbles: &[Bubble], tree: &Steiner) -> Flowchart {
    if tree.nodes.is_empty() {
        return Flowchart {
            runs: vec![],
            spine: vec![],
            positions: vec![],
        };
    }

    let tree_set: HashSet<_> = tree.nodes.iter().copied().collect();
    let mut adj: HashMap<NodeId, Vec<NodeId>> = HashMap::new();
    for e in &tree.edges {
        adj.entry(e.from).or_default().push(e.to);
        adj.entry(e.to).or_default().push(e.from);
    }

    // Root: prefer node with fewest tree neighbors that looks like a source.
    let root = pick_root(graph, tree, &adj);

    // DFS order walk; when coarse bubble changes, start new run.
    let mut runs: Vec<Run> = Vec::new();
    let mut node_run: HashMap<NodeId, RunId> = HashMap::new();
    let mut next_run = 1u64;

    // Ordered traversal for consecutive sequences.
    let order = dfs_order(root, &adj, &tree_set);
    let mut current_bubble: Option<BubbleId> = None;
    let mut current_nodes: Vec<NodeId> = Vec::new();
    let mut current_run_id: Option<RunId> = None;

    for &n in &order {
        let b = node_coarse_bubble(bubbles, n);
        if b != current_bubble {
            if let (Some(bid), Some(rid)) = (current_bubble, current_run_id) {
                if !current_nodes.is_empty() {
                    runs.push(Run {
                        id: rid,
                        bubble: bid,
                        nodes: current_nodes.clone(),
                    });
                }
            }
            current_bubble = b;
            current_nodes = vec![n];
            let rid = RunId(next_run);
            next_run += 1;
            current_run_id = Some(rid);
            node_run.insert(n, rid);
        } else {
            current_nodes.push(n);
            if let Some(rid) = current_run_id {
                node_run.insert(n, rid);
            }
        }
    }
    if let (Some(bid), Some(rid)) = (current_bubble, current_run_id) {
        if !current_nodes.is_empty() {
            runs.push(Run {
                id: rid,
                bubble: bid,
                nodes: current_nodes,
            });
        }
    }

    // Spine: run transitions along tree edges.
    let mut spine = Vec::new();
    let mut spine_seen = HashSet::new();
    for e in &tree.edges {
        let (Some(&ra), Some(&rb)) = (node_run.get(&e.from), node_run.get(&e.to)) else {
            continue;
        };
        if ra == rb {
            continue;
        }
        let key = if ra.0 < rb.0 { (ra, rb) } else { (rb, ra) };
        if spine_seen.insert(key) {
            spine.push(RunSpine { from: ra, to: rb });
        }
    }

    let positions = layout_positions(&runs, &spine);

    Flowchart {
        runs,
        spine,
        positions,
    }
}

fn pick_root(graph: &Graph, tree: &Steiner, adj: &HashMap<NodeId, Vec<NodeId>>) -> NodeId {
    tree.nodes
        .iter()
        .copied()
        .min_by_key(|id| {
            let deg = adj.get(id).map(|v| v.len()).unwrap_or(0);
            let is_fn = graph
                .nodes
                .iter()
                .find(|n| n.id == *id)
                .map(|n| n.kind == graphide_ir::NodeKind::Function)
                .unwrap_or(false);
            (deg, !is_fn, id.0)
        })
        .unwrap_or(tree.nodes[0])
}

fn dfs_order(
    root: NodeId,
    adj: &HashMap<NodeId, Vec<NodeId>>,
    tree_set: &HashSet<NodeId>,
) -> Vec<NodeId> {
    let mut out = Vec::new();
    let mut seen = HashSet::new();
    let mut stack = vec![root];
    while let Some(n) = stack.pop() {
        if !tree_set.contains(&n) || !seen.insert(n) {
            continue;
        }
        out.push(n);
        if let Some(ns) = adj.get(&n) {
            for &m in ns.iter().rev() {
                if !seen.contains(&m) {
                    stack.push(m);
                }
            }
        }
    }
    // Orphans
    for &n in tree_set {
        if seen.insert(n) {
            out.push(n);
        }
    }
    out
}

fn layout_positions(runs: &[Run], spine: &[RunSpine]) -> Vec<RunPosition> {
    if runs.is_empty() {
        return vec![];
    }
    let mut children: HashMap<RunId, Vec<RunId>> = HashMap::new();
    let mut indeg: HashMap<RunId, usize> = runs.iter().map(|r| (r.id, 0)).collect();
    for s in spine {
        children.entry(s.from).or_default().push(s.to);
        *indeg.entry(s.to).or_default() += 1;
        children.entry(s.to).or_default();
    }
    let roots: Vec<RunId> = indeg
        .iter()
        .filter(|(_, d)| **d == 0)
        .map(|(id, _)| *id)
        .collect();
    let start = roots.first().copied().unwrap_or(runs[0].id);

    let mut depth: HashMap<RunId, i32> = HashMap::new();
    let mut q = VecDeque::from([start]);
    depth.insert(start, 0);
    while let Some(n) = q.pop_front() {
        let d = depth[&n];
        if let Some(cs) = children.get(&n) {
            for &c in cs {
                if !depth.contains_key(&c) {
                    depth.insert(c, d + 1);
                    q.push_back(c);
                }
            }
        }
    }
    for r in runs {
        depth.entry(r.id).or_insert(0);
    }

    let mut by_depth: IndexMap<i32, Vec<RunId>> = IndexMap::new();
    for r in runs {
        by_depth.entry(depth[&r.id]).or_default().push(r.id);
    }
    let mut positions = Vec::new();
    for (d, ids) in by_depth {
        for (i, id) in ids.iter().enumerate() {
            positions.push(RunPosition {
                run: *id,
                x: d as f32 * 260.0,
                y: i as f32 * 150.0,
            });
        }
    }
    positions
}

#[cfg(test)]
mod tests {
    use super::*;
    use graphide_ir::{Graph, Steiner};

    #[test]
    fn empty_tree_empty_flowchart() {
        let g = Graph {
            nodes: vec![],
            edges: vec![],
        };
        let fc = build_flowchart(
            &g,
            &[],
            &Steiner {
                nodes: vec![],
                edges: vec![],
            },
        );
        assert!(fc.runs.is_empty());
        assert!(fc.spine.is_empty());
    }
}
