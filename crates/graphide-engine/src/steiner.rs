use graphide_ir::{
    Edge, EndRole, Graph, NodeId, NodeKind, Steiner,
};
use indexmap::IndexSet;
use std::cmp::Ordering;
use std::collections::{BinaryHeap, HashMap};

#[derive(Copy, Clone, PartialEq)]
struct State {
    cost: f64,
    node: NodeId,
}

impl Eq for State {}

impl Ord for State {
    fn cmp(&self, other: &Self) -> Ordering {
        other
            .cost
            .partial_cmp(&self.cost)
            .unwrap_or(Ordering::Equal)
            .then_with(|| self.node.0.cmp(&other.node.0))
    }
}

impl PartialOrd for State {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

/// Approximate Steiner tree: grow by repeatedly attaching nearest terminal.
pub fn steiner_tree(graph: &Graph, hits: &[NodeId]) -> Steiner {
    let mut terminals: IndexSet<NodeId> = hits.iter().copied().collect();
    if terminals.is_empty() {
        return Steiner {
            nodes: vec![],
            edges: vec![],
        };
    }
    if terminals.len() == 1 {
        let only = *terminals.iter().next().unwrap();
        if let Some(entry) = nearest_entry(graph, only) {
            terminals.insert(entry);
        }
        if let Some(sink) = nearest_sink(graph, only) {
            terminals.insert(sink);
        }
    }

    let undirected = build_undirected(graph);
    let edge_lookup = edge_lookup(graph);

    let mut tree_nodes: IndexSet<NodeId> = IndexSet::new();
    let mut tree_edges: Vec<Edge> = Vec::new();

    let start = *terminals.iter().next().unwrap();
    tree_nodes.insert(start);
    let mut remaining: IndexSet<NodeId> = terminals.iter().copied().skip(1).collect();

    while !remaining.is_empty() {
        let mut best: Option<(f64, NodeId, Vec<NodeId>)> = None;
        for &t in &remaining {
            if let Some((cost, path)) = shortest_path(&undirected, &tree_nodes, t) {
                if best.as_ref().map(|(c, _, _)| cost < *c).unwrap_or(true) {
                    best = Some((cost, t, path));
                }
            }
        }
        let Some((_, term, path)) = best else {
            break;
        };
        remaining.swap_remove(&term);
        for w in path.windows(2) {
            let a = w[0];
            let b = w[1];
            tree_nodes.insert(a);
            tree_nodes.insert(b);
            if let Some(e) = edge_lookup.get(&(a, b)).or_else(|| edge_lookup.get(&(b, a))) {
                if !tree_edges
                    .iter()
                    .any(|x| (x.from == e.from && x.to == e.to) || (x.from == e.to && x.to == e.from))
                {
                    tree_edges.push(e.clone());
                }
            }
        }
    }

    Steiner {
        nodes: tree_nodes.into_iter().collect(),
        edges: tree_edges,
    }
}

fn build_undirected(graph: &Graph) -> HashMap<NodeId, Vec<(NodeId, f64)>> {
    let mut adj: HashMap<NodeId, Vec<(NodeId, f64)>> = HashMap::new();
    for n in &graph.nodes {
        adj.entry(n.id).or_default();
    }
    for e in &graph.edges {
        // Steiner walks all derived edges including Contains for connectivity,
        // but prefer semantic edges via lower cost for higher weight.
        let w = e.kind.cluster_weight();
        let cost = if w <= 0.0 { 2.0 } else { 1.0 / w };
        adj.entry(e.from).or_default().push((e.to, cost));
        adj.entry(e.to).or_default().push((e.from, cost));
    }
    adj
}

fn edge_lookup(graph: &Graph) -> HashMap<(NodeId, NodeId), Edge> {
    let mut m = HashMap::new();
    for e in &graph.edges {
        m.insert((e.from, e.to), e.clone());
    }
    m
}

fn shortest_path(
    adj: &HashMap<NodeId, Vec<(NodeId, f64)>>,
    sources: &IndexSet<NodeId>,
    target: NodeId,
) -> Option<(f64, Vec<NodeId>)> {
    let mut dist: HashMap<NodeId, f64> = HashMap::new();
    let mut prev: HashMap<NodeId, NodeId> = HashMap::new();
    let mut heap = BinaryHeap::new();
    for &s in sources {
        dist.insert(s, 0.0);
        heap.push(State { cost: 0.0, node: s });
    }
    while let Some(State { cost, node }) = heap.pop() {
        if node == target {
            break;
        }
        if dist.get(&node).is_some_and(|d| cost > *d) {
            continue;
        }
        if let Some(ns) = adj.get(&node) {
            for &(nxt, w) in ns {
                let nd = cost + w;
                if dist.get(&nxt).map(|d| nd < *d).unwrap_or(true) {
                    dist.insert(nxt, nd);
                    prev.insert(nxt, node);
                    heap.push(State {
                        cost: nd,
                        node: nxt,
                    });
                }
            }
        }
    }
    let total = *dist.get(&target)?;
    let mut path = vec![target];
    let mut cur = target;
    while !sources.contains(&cur) {
        cur = *prev.get(&cur)?;
        path.push(cur);
    }
    path.reverse();
    Some((total, path))
}

fn nearest_entry(graph: &Graph, from: NodeId) -> Option<NodeId> {
    let entries: Vec<NodeId> = graph
        .nodes
        .iter()
        .filter(|n| {
            n.endpoint
                .as_ref()
                .map(|e| e.role == EndRole::Source)
                .unwrap_or(false)
                || (n.kind == NodeKind::Function && in_degree(graph, n.id) == 0)
        })
        .map(|n| n.id)
        .filter(|id| *id != from)
        .collect();
    nearest_of(graph, from, &entries)
}

fn nearest_sink(graph: &Graph, from: NodeId) -> Option<NodeId> {
    let sinks: Vec<NodeId> = graph
        .nodes
        .iter()
        .filter(|n| {
            n.endpoint
                .as_ref()
                .map(|e| e.role == EndRole::Sink)
                .unwrap_or(false)
                || (n.kind == NodeKind::Function && out_degree(graph, n.id) == 0)
        })
        .map(|n| n.id)
        .filter(|id| *id != from)
        .collect();
    nearest_of(graph, from, &sinks)
}

fn nearest_of(graph: &Graph, from: NodeId, cands: &[NodeId]) -> Option<NodeId> {
    if cands.is_empty() {
        return None;
    }
    let adj = build_undirected(graph);
    let mut sources = IndexSet::new();
    sources.insert(from);
    cands
        .iter()
        .filter_map(|t| shortest_path(&adj, &sources, *t).map(|(c, _)| (c, *t)))
        .min_by(|a, b| a.0.partial_cmp(&b.0).unwrap_or(Ordering::Equal))
        .map(|(_, t)| t)
}

fn in_degree(graph: &Graph, id: NodeId) -> usize {
    graph.edges.iter().filter(|e| e.to == id).count()
}

fn out_degree(graph: &Graph, id: NodeId) -> usize {
    graph.edges.iter().filter(|e| e.from == id).count()
}

#[cfg(test)]
mod tests {
    use super::*;
    use graphide_ir::*;

    fn node(fqn: &str, kind: NodeKind) -> Node {
        Node {
            id: NodeId::from_identity(kind, fqn),
            fqn: fqn.into(),
            kind,
            span: Span {
                file: "x.rs".into(),
                start: Pos { line: 1, column: 1 },
                end: Pos { line: 1, column: 2 },
            },
            endpoint: None,
        }
    }

    fn edge(from: &Node, to: &Node, kind: EdgeKind) -> Edge {
        Edge {
            from: from.id,
            to: to.id,
            kind,
            span: from.span.clone(),
        }
    }

    #[test]
    fn steiner_connects_two_hits() {
        let a = node("crate::a", NodeKind::Function);
        let b = node("crate::b", NodeKind::Function);
        let c = node("crate::c", NodeKind::Function);
        let g = Graph {
            nodes: vec![a.clone(), b.clone(), c.clone()],
            edges: vec![
                edge(&a, &b, EdgeKind::Calls),
                edge(&b, &c, EdgeKind::Calls),
            ],
        };
        let tree = steiner_tree(&g, &[a.id, c.id]);
        assert!(tree.nodes.contains(&a.id));
        assert!(tree.nodes.contains(&c.id));
        assert!(tree.nodes.contains(&b.id));
        assert_eq!(tree.edges.len(), 2);
    }

    #[test]
    fn steiner_single_hit_still_builds_pipeline() {
        let a = node("crate::entry", NodeKind::Function);
        let b = node("crate::mid", NodeKind::Function);
        let c = node("crate::sink", NodeKind::Function);
        let g = Graph {
            nodes: vec![a.clone(), b.clone(), c.clone()],
            edges: vec![
                edge(&a, &b, EdgeKind::Calls),
                edge(&b, &c, EdgeKind::Calls),
            ],
        };
        let tree = steiner_tree(&g, &[b.id]);
        assert!(tree.nodes.len() >= 2);
    }
}
