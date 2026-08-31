//! Data-flow: sources, transforms, stores, sinks on one flow's Steiner.
//!
//! Contract (Archify Data Flow, Graphide identity): nodes stay Function /
//! Type / Endpoint with FQNs and Endpoint role / channel. Hops are derived
//! Reads / Writes / Publishes / Subscribes. No authored dataflow JSON.
//! No invented node pairs.
//!
//! Reads and Subscribes are reversed so each hop is producer → consumer.
//! Publishes / Subscribes that touch a Steiner Endpoint are bus hops even
//! when the publisher sits just off the tree.

use graphide_ir::{
    DataflowHop, DataflowNode, DataflowRole, Edge, EdgeKind, EndChannel, EndRole, FlowDataflow,
    Node, NodeId, NodeKind, Steiner,
};
use std::collections::{HashMap, HashSet};

pub fn is_data(kind: EdgeKind) -> bool {
    matches!(
        kind,
        EdgeKind::Reads | EdgeKind::Writes | EdgeKind::Publishes | EdgeKind::Subscribes
    )
}

/// True when the IR edge points at the store / type and data moves the
/// other way (function reads or subscribes).
fn data_reverses(kind: EdgeKind) -> bool {
    matches!(kind, EdgeKind::Reads | EdgeKind::Subscribes)
}

pub fn flow_dataflow(graph: &graphide_ir::Graph, tree: &Steiner) -> FlowDataflow {
    if tree.nodes.is_empty() {
        return FlowDataflow::default();
    }
    let by_id: HashMap<NodeId, &Node> = graph.nodes.iter().map(|n| (n.id, n)).collect();
    let tree_ids: HashSet<NodeId> = tree.nodes.iter().copied().collect();
    let endpoints: HashSet<NodeId> = tree
        .nodes
        .iter()
        .copied()
        .filter(|id| by_id.get(id).is_some_and(|n| n.kind == NodeKind::Endpoint))
        .collect();

    let mut seen = HashSet::new();
    let mut edges: Vec<&Edge> = Vec::new();
    for e in tree.edges.iter().filter(|e| is_data(e.kind)) {
        if seen.insert((e.from, e.to, e.kind)) {
            edges.push(e);
        }
    }
    for e in graph.edges.iter().filter(|e| is_data(e.kind)) {
        let bus = endpoints.contains(&e.from) || endpoints.contains(&e.to);
        if !bus {
            continue;
        }
        if seen.insert((e.from, e.to, e.kind)) {
            edges.push(e);
        }
    }
    if edges.is_empty() {
        return FlowDataflow::default();
    }

    let walk = steiner_walk(tree);
    let rank: HashMap<NodeId, usize> = walk.iter().enumerate().map(|(i, id)| (*id, i)).collect();
    edges.sort_by_key(|e| {
        let (prod, cons) = data_ends(e);
        (
            rank.get(&prod).copied().unwrap_or(usize::MAX),
            rank.get(&cons).copied().unwrap_or(usize::MAX),
            e.kind as u8,
        )
    });

    let mut hops = Vec::new();
    for e in edges {
        let (from, to) = data_ends(e);
        let from_n = by_id.get(&from);
        let to_n = by_id.get(&to);
        hops.push(DataflowHop {
            from,
            to,
            from_fqn: from_n
                .map(|n| n.fqn.clone())
                .unwrap_or_else(|| from.0.to_string()),
            to_fqn: to_n
                .map(|n| n.fqn.clone())
                .unwrap_or_else(|| to.0.to_string()),
            kind: e.kind,
            file: Some(e.span.file.clone()),
        });
    }

    let mut incoming: HashMap<NodeId, usize> = HashMap::new();
    let mut outgoing: HashMap<NodeId, usize> = HashMap::new();
    let mut order = Vec::new();
    let mut seen_n = HashSet::new();
    for h in &hops {
        *outgoing.entry(h.from).or_default() += 1;
        *incoming.entry(h.to).or_default() += 1;
        for id in [h.from, h.to] {
            if seen_n.insert(id) {
                order.push(id);
            }
        }
    }

    let mut nodes = Vec::new();
    for id in order {
        if !tree_ids.contains(&id) && !by_id.contains_key(&id) {
            continue;
        }
        let n = by_id.get(&id);
        let ep = n.and_then(|n| n.endpoint.as_ref());
        let inn = incoming.get(&id).copied().unwrap_or(0);
        let out = outgoing.get(&id).copied().unwrap_or(0);
        let kind = n.map(|n| n.kind).unwrap_or(NodeKind::Function);
        nodes.push(DataflowNode {
            id,
            fqn: n
                .map(|n| n.fqn.clone())
                .unwrap_or_else(|| id.0.to_string()),
            kind,
            role: classify(kind, ep.map(|e| e.role), ep.map(|e| e.channel), inn, out),
            end_role: ep.map(|e| e.role),
            channel: ep.map(|e| e.channel),
            file: n.map(|n| n.span.file.clone()),
        });
    }

    FlowDataflow { nodes, hops }
}

fn data_ends(e: &Edge) -> (NodeId, NodeId) {
    if data_reverses(e.kind) {
        (e.to, e.from)
    } else {
        (e.from, e.to)
    }
}

fn classify(
    kind: NodeKind,
    end_role: Option<EndRole>,
    channel: Option<EndChannel>,
    incoming: usize,
    outgoing: usize,
) -> DataflowRole {
    if incoming > 0 && outgoing > 0 {
        if kind == NodeKind::Endpoint
            || matches!(
                channel,
                Some(EndChannel::Queue | EndChannel::Table | EndChannel::Channel)
            )
        {
            return DataflowRole::Store;
        }
        return DataflowRole::Transform;
    }
    if outgoing > 0 && incoming == 0 {
        return DataflowRole::Source;
    }
    if incoming > 0 && outgoing == 0 {
        return DataflowRole::Sink;
    }
    match end_role {
        Some(EndRole::Source) => DataflowRole::Source,
        Some(EndRole::Sink) => DataflowRole::Sink,
        None => {
            if kind == NodeKind::Endpoint {
                DataflowRole::Store
            } else {
                DataflowRole::Transform
            }
        }
    }
}

/// BFS from Steiner sources — same order Sequence uses.
fn steiner_walk(tree: &Steiner) -> Vec<NodeId> {
    let mut kids: HashMap<NodeId, Vec<NodeId>> = HashMap::new();
    let incoming: HashSet<NodeId> = tree.edges.iter().map(|e| e.to).collect();
    for e in &tree.edges {
        kids.entry(e.from).or_default().push(e.to);
    }
    let ids: HashSet<NodeId> = tree.nodes.iter().copied().collect();
    let mut start: Vec<NodeId> = tree
        .nodes
        .iter()
        .copied()
        .filter(|id| !incoming.contains(id))
        .collect();
    if start.is_empty() {
        if let Some(first) = tree.nodes.first() {
            start.push(*first);
        }
    }
    let mut seen = HashSet::new();
    let mut walk = Vec::new();
    let mut q = start;
    let mut i = 0;
    while i < q.len() {
        let id = q[i];
        i += 1;
        if !ids.contains(&id) || !seen.insert(id) {
            continue;
        }
        walk.push(id);
        if let Some(ts) = kids.get(&id) {
            q.extend(ts.iter().copied());
        }
    }
    for id in &tree.nodes {
        if seen.insert(*id) {
            walk.push(*id);
        }
    }
    walk
}

#[cfg(test)]
mod tests {
    use super::*;
    use graphide_ir::{EndpointMeta, Graph, Pos, Span};

    fn span() -> Span {
        Span {
            file: "a.rs".into(),
            start: Pos { line: 1, column: 1 },
            end: Pos { line: 2, column: 1 },
        }
    }

    fn n(fqn: &str) -> Node {
        Node {
            id: NodeId::from_identity(NodeKind::Function, fqn),
            fqn: fqn.into(),
            kind: NodeKind::Function,
            span: span(),
            endpoint: None,
        }
    }

    fn endpoint(fqn: &str, role: EndRole) -> Node {
        Node {
            id: NodeId::from_identity(NodeKind::Endpoint, fqn),
            fqn: fqn.into(),
            kind: NodeKind::Endpoint,
            span: span(),
            endpoint: Some(EndpointMeta {
                role,
                channel: EndChannel::Channel,
            }),
        }
    }

    fn e(a: &Node, b: &Node, kind: EdgeKind) -> Edge {
        Edge {
            from: a.id,
            to: b.id,
            kind,
            span: span(),
        }
    }

    #[test]
    fn empty_tree_is_empty_dataflow() {
        let g = Graph {
            nodes: vec![],
            edges: vec![],
        };
        let d = flow_dataflow(
            &g,
            &Steiner {
                nodes: vec![],
                edges: vec![],
            },
        );
        assert!(d.nodes.is_empty());
        assert!(d.hops.is_empty());
    }

    #[test]
    fn subscribes_plus_bus_publish_is_source_store_sink() {
        let pubn = n("crate::bus::Bus::publish");
        let sub = n("crate::sub::subscribe");
        let ev = endpoint("crate::bus::events", EndRole::Sink);
        let publishes = e(&pubn, &ev, EdgeKind::Publishes);
        let subscribes = e(&sub, &ev, EdgeKind::Subscribes);
        let g = Graph {
            nodes: vec![pubn.clone(), sub.clone(), ev.clone()],
            edges: vec![publishes.clone(), subscribes.clone()],
        };
        let d = flow_dataflow(
            &g,
            &Steiner {
                nodes: vec![sub.id, ev.id],
                edges: vec![subscribes],
            },
        );
        assert_eq!(d.hops.len(), 2, "{:?}", d.hops);
        assert!(d.hops.iter().any(|h| {
            h.kind == EdgeKind::Publishes && h.from_fqn.contains("publish") && h.to_fqn.contains("events")
        }));
        assert!(d.hops.iter().any(|h| {
            h.kind == EdgeKind::Subscribes
                && h.from_fqn.contains("events")
                && h.to_fqn.contains("subscribe")
        }));
        let role = |needle: &str| {
            d.nodes
                .iter()
                .find(|n| n.fqn.contains(needle))
                .map(|n| n.role)
        };
        assert_eq!(role("publish"), Some(DataflowRole::Source));
        assert_eq!(role("events"), Some(DataflowRole::Store));
        assert_eq!(role("subscribe"), Some(DataflowRole::Sink));
        assert!(d.nodes.iter().any(|n| n.end_role == Some(EndRole::Sink)));
    }

    #[test]
    fn reads_then_writes_is_source_transform_sink() {
        let src = n("crate::src");
        let mid = n("crate::xform");
        let dst = n("crate::dst");
        let reads = e(&mid, &src, EdgeKind::Reads);
        let writes = e(&mid, &dst, EdgeKind::Writes);
        let g = Graph {
            nodes: vec![src.clone(), mid.clone(), dst.clone()],
            edges: vec![reads.clone(), writes.clone()],
        };
        let d = flow_dataflow(
            &g,
            &Steiner {
                nodes: vec![src.id, mid.id, dst.id],
                edges: vec![reads, writes],
            },
        );
        assert_eq!(d.hops.len(), 2);
        assert!(d.hops.iter().any(|h| {
            h.kind == EdgeKind::Reads && h.from_fqn == "crate::src" && h.to_fqn == "crate::xform"
        }));
        assert!(d.hops.iter().any(|h| {
            h.kind == EdgeKind::Writes && h.from_fqn == "crate::xform" && h.to_fqn == "crate::dst"
        }));
        let role = |fqn: &str| d.nodes.iter().find(|n| n.fqn == fqn).map(|n| n.role);
        assert_eq!(role("crate::src"), Some(DataflowRole::Source));
        assert_eq!(role("crate::xform"), Some(DataflowRole::Transform));
        assert_eq!(role("crate::dst"), Some(DataflowRole::Sink));
    }
}
