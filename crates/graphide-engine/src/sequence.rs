//! Sequence: callers, callees, returns/order on one flow's Steiner.
//!
//! Contract (Archify Sequence, Graphide identity): participants are
//! Function / Type / Endpoint with FQNs; hops are derived Steiner
//! interaction edges (Calls, Publishes, Subscribes, Reads, Writes).
//! No authored sequence JSON. No invented node pairs.
//!
//! A `return` hop is the same `Calls` edge read backward (callee → caller).
//! Other kinds stay one forward hop.

use graphide_ir::{
    Edge, EdgeKind, FlowSequence, Node, NodeId, SequenceHop, SequenceParticipant, SequenceVariant,
    Steiner,
};
use std::collections::{HashMap, HashSet};

pub fn is_interaction(kind: EdgeKind) -> bool {
    matches!(
        kind,
        EdgeKind::Calls
            | EdgeKind::Reads
            | EdgeKind::Writes
            | EdgeKind::Publishes
            | EdgeKind::Subscribes
    )
}

pub fn flow_sequence(graph: &graphide_ir::Graph, tree: &Steiner) -> FlowSequence {
    if tree.nodes.is_empty() || tree.edges.is_empty() {
        return FlowSequence::default();
    }
    let by_id: HashMap<NodeId, &Node> = graph.nodes.iter().map(|n| (n.id, n)).collect();
    let walk = steiner_walk(tree);
    let rank: HashMap<NodeId, usize> = walk.iter().enumerate().map(|(i, id)| (*id, i)).collect();
    let mut edges: Vec<&Edge> = tree
        .edges
        .iter()
        .filter(|e| is_interaction(e.kind))
        .collect();
    edges.sort_by_key(|e| {
        (
            rank.get(&e.from).copied().unwrap_or(usize::MAX),
            rank.get(&e.to).copied().unwrap_or(usize::MAX),
            e.kind as u8,
        )
    });

    let mut hops = Vec::new();
    let mut seen = HashSet::new();
    for e in edges {
        if !seen.insert((e.from, e.to, e.kind)) {
            continue;
        }
        let from_n = by_id.get(&e.from);
        let to_n = by_id.get(&e.to);
        let from_fqn = from_n
            .map(|n| n.fqn.clone())
            .unwrap_or_else(|| e.from.0.to_string());
        let to_fqn = to_n
            .map(|n| n.fqn.clone())
            .unwrap_or_else(|| e.to.0.to_string());
        let file = e.span.file.clone();
        let variant = if e.kind == EdgeKind::Calls {
            SequenceVariant::Call
        } else {
            SequenceVariant::Default
        };
        hops.push(SequenceHop {
            from: e.from,
            to: e.to,
            from_fqn: from_fqn.clone(),
            to_fqn: to_fqn.clone(),
            kind: e.kind,
            variant,
            file: Some(file.clone()),
        });
        if e.kind == EdgeKind::Calls {
            hops.push(SequenceHop {
                from: e.to,
                to: e.from,
                from_fqn: to_fqn,
                to_fqn: from_fqn,
                kind: e.kind,
                variant: SequenceVariant::Return,
                file: Some(file),
            });
        }
    }

    let mut participants = Vec::new();
    let mut seen_p = HashSet::new();
    for h in &hops {
        for (id, fqn) in [(h.from, h.from_fqn.as_str()), (h.to, h.to_fqn.as_str())] {
            if !seen_p.insert(id) {
                continue;
            }
            let n = by_id.get(&id);
            participants.push(SequenceParticipant {
                id,
                fqn: n.map(|n| n.fqn.clone()).unwrap_or_else(|| fqn.to_string()),
                kind: n.map(|n| n.kind).unwrap_or(graphide_ir::NodeKind::Function),
                file: n.map(|n| n.span.file.clone()),
            });
        }
    }

    FlowSequence {
        participants,
        hops,
    }
}

/// BFS from Steiner sources — same order the desk path walk uses.
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
    use graphide_ir::{Graph, NodeKind, Pos, Span};

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

    fn calls(a: &Node, b: &Node) -> Edge {
        Edge {
            from: a.id,
            to: b.id,
            kind: EdgeKind::Calls,
            span: span(),
        }
    }

    #[test]
    fn empty_tree_is_empty_sequence() {
        let g = Graph {
            nodes: vec![],
            edges: vec![],
        };
        let s = flow_sequence(
            &g,
            &Steiner {
                nodes: vec![],
                edges: vec![],
            },
        );
        assert!(s.participants.is_empty());
        assert!(s.hops.is_empty());
    }

    #[test]
    fn calls_chain_emits_call_and_return() {
        let a = n("crate::a");
        let b = n("crate::b");
        let c = n("crate::c");
        let g = Graph {
            nodes: vec![a.clone(), b.clone(), c.clone()],
            edges: vec![calls(&a, &b), calls(&b, &c)],
        };
        let tree = Steiner {
            nodes: vec![a.id, b.id, c.id],
            edges: g.edges.clone(),
        };
        let s = flow_sequence(&g, &tree);
        assert_eq!(s.participants.len(), 3);
        assert_eq!(s.hops.len(), 4);
        assert_eq!(s.hops[0].variant, SequenceVariant::Call);
        assert_eq!(s.hops[0].from_fqn, "crate::a");
        assert_eq!(s.hops[0].to_fqn, "crate::b");
        assert_eq!(s.hops[1].variant, SequenceVariant::Return);
        assert_eq!(s.hops[1].from_fqn, "crate::b");
        assert_eq!(s.hops[1].to_fqn, "crate::a");
        assert!(s.hops.iter().all(|h| h.kind == EdgeKind::Calls));
    }

    #[test]
    fn subscribes_is_one_forward_hop() {
        let a = n("crate::sub::subscribe");
        let ev = Node {
            id: NodeId::from_identity(NodeKind::Endpoint, "crate::bus::events"),
            fqn: "crate::bus::events".into(),
            kind: NodeKind::Endpoint,
            span: span(),
            endpoint: None,
        };
        let e = Edge {
            from: a.id,
            to: ev.id,
            kind: EdgeKind::Subscribes,
            span: span(),
        };
        let g = Graph {
            nodes: vec![a.clone(), ev.clone()],
            edges: vec![e.clone()],
        };
        let s = flow_sequence(
            &g,
            &Steiner {
                nodes: vec![a.id, ev.id],
                edges: vec![e],
            },
        );
        assert_eq!(s.participants.len(), 2);
        assert_eq!(s.hops.len(), 1);
        assert_eq!(s.hops[0].kind, EdgeKind::Subscribes);
        assert_eq!(s.hops[0].variant, SequenceVariant::Default);
    }
}
