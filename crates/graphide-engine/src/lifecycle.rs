//! Lifecycle: review-machine states, events, terminals on one flow.
//!
//! Contract (Archify Lifecycle, Graphide identity): states are the current
//! flow's review machine (proposed → walking hops → stamped | skipped |
//! broken) plus plugin-visible Type / Endpoint nodes already on the Steiner.
//! No authored lifecycle JSON. No invented match/enum-variant edges — the
//! rust plugin extracts `enum_item` as Type, not arms.
//!
//! A recoverable failure is `broken → walking` (real transition back to an
//! active state). A card that says "retry" is not topology.

use graphide_ir::{
    FlowLifecycle, LifecycleEndpoint, LifecycleLane, LifecycleState, LifecycleTransition,
    LifecycleType, Node, NodeId, NodeKind, Steiner,
};
use std::collections::{HashMap, HashSet};

pub fn flow_lifecycle(graph: &graphide_ir::Graph, tree: &Steiner) -> FlowLifecycle {
    let by_id: HashMap<NodeId, &Node> = graph.nodes.iter().map(|n| (n.id, n)).collect();
    let hops = tree.edges.len();
    let walking_sub = if hops == 0 {
        None
    } else if hops == 1 {
        Some("1 hop".into())
    } else {
        Some(format!("{hops} hops"))
    };

    let lanes = vec![
        LifecycleLane {
            id: "main".into(),
            label: "Review".into(),
        },
        LifecycleLane {
            id: "events".into(),
            label: "Wait / retry".into(),
        },
        LifecycleLane {
            id: "terminal".into(),
            label: "Outcomes".into(),
        },
    ];

    let states = vec![
        LifecycleState {
            id: "proposed".into(),
            kind: LifecycleType::Start,
            label: "Proposed".into(),
            sublabel: None,
            lane: "main".into(),
            col: 0,
        },
        LifecycleState {
            id: "walking".into(),
            kind: LifecycleType::Active,
            label: "Walking".into(),
            sublabel: walking_sub,
            lane: "main".into(),
            col: 1,
        },
        LifecycleState {
            id: "waiting".into(),
            kind: LifecycleType::Waiting,
            label: "Waiting".into(),
            sublabel: Some("stamp / skip".into()),
            lane: "events".into(),
            col: 0,
        },
        LifecycleState {
            id: "stamped".into(),
            kind: LifecycleType::Success,
            label: "Stamped".into(),
            sublabel: None,
            lane: "terminal".into(),
            col: 0,
        },
        LifecycleState {
            id: "skipped".into(),
            kind: LifecycleType::Neutral,
            label: "Skipped".into(),
            sublabel: None,
            lane: "terminal".into(),
            col: 1,
        },
        LifecycleState {
            id: "broken".into(),
            kind: LifecycleType::Failure,
            label: "Broken".into(),
            sublabel: None,
            lane: "events".into(),
            col: 1,
        },
    ];

    let transitions = vec![
        LifecycleTransition {
            from: "proposed".into(),
            to: "walking".into(),
            label: "play".into(),
        },
        LifecycleTransition {
            from: "walking".into(),
            to: "waiting".into(),
            label: "wait".into(),
        },
        LifecycleTransition {
            from: "waiting".into(),
            to: "stamped".into(),
            label: "stamp".into(),
        },
        LifecycleTransition {
            from: "waiting".into(),
            to: "skipped".into(),
            label: "skip".into(),
        },
        LifecycleTransition {
            from: "stamped".into(),
            to: "broken".into(),
            label: "break".into(),
        },
        LifecycleTransition {
            from: "broken".into(),
            to: "walking".into(),
            label: "recover".into(),
        },
    ];

    let endpoints = plugin_ends(&by_id, tree);

    FlowLifecycle {
        lanes,
        states,
        transitions,
        endpoints,
    }
}

fn plugin_ends(by_id: &HashMap<NodeId, &Node>, tree: &Steiner) -> Vec<LifecycleEndpoint> {
    let mut seen = HashSet::new();
    let mut ends = Vec::new();
    for id in &tree.nodes {
        if !seen.insert(*id) {
            continue;
        }
        let Some(n) = by_id.get(id) else {
            continue;
        };
        if n.kind != NodeKind::Type && n.kind != NodeKind::Endpoint {
            continue;
        }
        ends.push(LifecycleEndpoint {
            id: n.id,
            fqn: n.fqn.clone(),
            kind: n.kind,
            file: Some(n.span.file.clone()),
        });
    }
    ends.sort_by(|a, b| a.fqn.cmp(&b.fqn));
    ends
}

#[cfg(test)]
mod tests {
    use super::*;
    use graphide_ir::{Edge, EdgeKind, Graph, Pos, Span};

    fn span() -> Span {
        Span {
            file: "a.rs".into(),
            start: Pos { line: 1, column: 1 },
            end: Pos { line: 2, column: 1 },
        }
    }

    fn n(fqn: &str, kind: NodeKind) -> Node {
        Node {
            id: NodeId::from_identity(kind, fqn),
            fqn: fqn.into(),
            kind,
            span: span(),
            endpoint: None,
        }
    }

    #[test]
    fn empty_tree_still_emits_review_machine() {
        let g = Graph {
            nodes: vec![],
            edges: vec![],
        };
        let lc = flow_lifecycle(
            &g,
            &Steiner {
                nodes: vec![],
                edges: vec![],
            },
        );
        assert_eq!(lc.states.len(), 6);
        assert!(lc.endpoints.is_empty());
        assert!(lc
            .transitions
            .iter()
            .any(|t| t.from == "broken" && t.to == "walking" && t.label == "recover"));
    }

    #[test]
    fn endpoint_on_tree_is_plugin_visible_not_a_fake_arm() {
        let sub = n("crate::sub::subscribe", NodeKind::Function);
        let ev = n("crate::bus::events", NodeKind::Endpoint);
        let e = Edge {
            from: sub.id,
            to: ev.id,
            kind: EdgeKind::Subscribes,
            span: span(),
        };
        let g = Graph {
            nodes: vec![sub.clone(), ev.clone()],
            edges: vec![e.clone()],
        };
        let lc = flow_lifecycle(
            &g,
            &Steiner {
                nodes: vec![sub.id, ev.id],
                edges: vec![e],
            },
        );
        assert_eq!(lc.endpoints.len(), 1);
        assert_eq!(lc.endpoints[0].fqn, "crate::bus::events");
        assert_eq!(lc.endpoints[0].kind, NodeKind::Endpoint);
        assert!(!lc.states.iter().any(|s| s.kind == LifecycleType::Decision));
        assert_eq!(
            lc.states
                .iter()
                .find(|s| s.id == "walking")
                .and_then(|s| s.sublabel.as_deref()),
            Some("1 hop")
        );
    }
}
