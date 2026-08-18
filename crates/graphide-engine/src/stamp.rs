use crate::cluster::cluster;
use crate::flowchart::build_flowchart;
use crate::review::resolve_fqn;
use crate::steiner::steiner_tree;
use graphide_ir::{Bubble, Finding, FindingKind, FlowView, Graph, Stamp, StampEdge, StampPosition};
use std::collections::HashSet;

pub fn make_stamp(graph: &Graph, view: &FlowView, deriver: &str) -> Stamp {
    let fqn = |id| {
        graph
            .nodes
            .iter()
            .find(|n| n.id == id)
            .map(|n| n.fqn.clone())
            .unwrap_or_default()
    };
    let tree = view
        .tree
        .edges
        .iter()
        .map(|e| StampEdge {
            from: fqn(e.from),
            to: fqn(e.to),
            kind: e.kind,
        })
        .collect();
    let bubble_label = |id: graphide_ir::BubbleId| format!("{}", id.0);
    let mut visit: std::collections::HashMap<u64, usize> = std::collections::HashMap::new();
    let positions = view
        .flowchart
        .runs
        .iter()
        .zip(view.flowchart.positions.iter())
        .map(|(run, pos)| {
            let idx = visit.entry(run.bubble.0).or_insert(0);
            let key = format!("{}#{}", bubble_label(run.bubble), *idx);
            *idx += 1;
            StampPosition {
                run_key: key,
                x: pos.x,
                y: pos.y,
            }
        })
        .collect();
    Stamp {
        name: view.name.clone(),
        hits: view.hits.clone(),
        tree,
        positions,
        deriver: deriver.into(),
    }
}

pub fn stamp_from_graph(
    graph: &Graph,
    bubbles: &[Bubble],
    name: &str,
    hits: &[String],
    deriver: &str,
) -> (FlowView, Stamp) {
    let resolved: Vec<_> = hits
        .iter()
        .filter_map(|fqn| resolve_fqn(graph, fqn))
        .collect();
    let tree = steiner_tree(graph, &resolved);
    let flowchart = build_flowchart(graph, bubbles, &tree);
    let view = FlowView {
        name: name.into(),
        hits: hits.to_vec(),
        resolved_hits: resolved,
        tree,
        flowchart,
    };
    let stamp = make_stamp(graph, &view, deriver);
    (view, stamp)
}

pub fn stamp_filename(name: &str) -> String {
    let stem: String = name
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '-' || c == '_' {
                c
            } else {
                '-'
            }
        })
        .collect();
    let stem = stem.trim_matches('-');
    format!("{}.json", if stem.is_empty() { "flow" } else { stem })
}

/// Recheck: latest graph, same hits, new Steiner, FQN-pair diff, overlay positions.
pub fn recheck_stamp(graph: &Graph, stamp: &Stamp) -> (FlowView, Option<Finding>) {
    let bubbles = cluster(graph);
    recheck_stamp_on(graph, &bubbles, stamp)
}

pub fn recheck_stamp_on(
    graph: &Graph,
    bubbles: &[graphide_ir::Bubble],
    stamp: &Stamp,
) -> (FlowView, Option<Finding>) {
    let (mut view, _) = stamp_from_graph(graph, bubbles, &stamp.name, &stamp.hits, &stamp.deriver);
    overlay_positions(&mut view, stamp);

    let old: HashSet<(String, String, graphide_ir::EdgeKind)> = stamp
        .tree
        .iter()
        .map(|e| (e.from.clone(), e.to.clone(), e.kind))
        .collect();
    let fqn = |id| {
        graph
            .nodes
            .iter()
            .find(|n| n.id == id)
            .map(|n| n.fqn.clone())
            .unwrap_or_default()
    };
    let new_edges: Vec<StampEdge> = view
        .tree
        .edges
        .iter()
        .map(|e| StampEdge {
            from: fqn(e.from),
            to: fqn(e.to),
            kind: e.kind,
        })
        .collect();
    let new_set: HashSet<(String, String, graphide_ir::EdgeKind)> = new_edges
        .iter()
        .map(|e| (e.from.clone(), e.to.clone(), e.kind))
        .collect();
    let added: Vec<StampEdge> = new_edges
        .iter()
        .filter(|e| !old.contains(&(e.from.clone(), e.to.clone(), e.kind)))
        .cloned()
        .collect();
    let removed: Vec<StampEdge> = stamp
        .tree
        .iter()
        .filter(|e| !new_set.contains(&(e.from.clone(), e.to.clone(), e.kind)))
        .cloned()
        .collect();
    let finding = if added.is_empty() && removed.is_empty() {
        None
    } else {
        Some(Finding {
            kind: FindingKind::StampBroken {
                flow: stamp.name.clone(),
                added,
                removed,
            },
            span: None,
        })
    };
    (view, finding)
}

/// Overlay stored flowchart positions and record hold/break on the snapshot.
pub fn apply_saved_stamps(snap: &mut graphide_ir::ReviewSnapshot, stamps: &[Stamp]) {
    for stamp in stamps {
        let (view, finding) = recheck_stamp_on(&snap.graph, &snap.bubbles, stamp);
        if let Some(flow) = snap.flows.iter_mut().find(|f| f.name == stamp.name) {
            flow.flowchart.positions = view.flowchart.positions;
        }
        let holds = finding.is_none();
        if let Some(f) = finding {
            snap.findings.push(f);
        }
        if let Some(row) = snap.stamps.iter_mut().find(|s| s.name == stamp.name) {
            row.holds = holds;
        } else {
            snap.stamps.push(graphide_ir::StampCheck {
                name: stamp.name.clone(),
                holds,
            });
        }
    }
}

fn overlay_positions(view: &mut FlowView, stamp: &Stamp) {
    let stored: std::collections::HashMap<_, _> = stamp
        .positions
        .iter()
        .map(|p| (p.run_key.clone(), (p.x, p.y)))
        .collect();
    let mut visit: std::collections::HashMap<u64, usize> = std::collections::HashMap::new();
    for (run, pos) in view
        .flowchart
        .runs
        .iter()
        .zip(view.flowchart.positions.iter_mut())
    {
        let idx = visit.entry(run.bubble.0).or_insert(0);
        let key = format!("{}#{}", run.bubble.0, *idx);
        *idx += 1;
        if let Some((x, y)) = stored.get(&key) {
            pos.x = *x;
            pos.y = *y;
        }
    }
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

    #[test]
    fn inserted_hop_breaks_stamp() {
        let a = node("crate::a", NodeKind::Function);
        let b = node("crate::b", NodeKind::Function);
        let c = node("crate::c", NodeKind::Function);
        let old = Graph {
            nodes: vec![a.clone(), c.clone()],
            edges: vec![Edge {
                from: a.id,
                to: c.id,
                kind: EdgeKind::Calls,
                span: a.span.clone(),
            }],
        };
        let bubbles = cluster(&old);
        let (_, stamp) = stamp_from_graph(
            &old,
            &bubbles,
            "f",
            &["crate::a".into(), "crate::c".into()],
            "rust@0.1.0",
        );
        let new = Graph {
            nodes: vec![a.clone(), b.clone(), c.clone()],
            edges: vec![
                Edge {
                    from: a.id,
                    to: b.id,
                    kind: EdgeKind::Calls,
                    span: a.span.clone(),
                },
                Edge {
                    from: b.id,
                    to: c.id,
                    kind: EdgeKind::Calls,
                    span: b.span.clone(),
                },
            ],
        };
        let (_, finding) = recheck_stamp(&new, &stamp);
        assert!(matches!(
            finding.unwrap().kind,
            FindingKind::StampBroken { .. }
        ));
    }

    #[test]
    fn stamp_filename_sanitizes() {
        assert_eq!(
            stamp_filename("data-subscription"),
            "data-subscription.json"
        );
        assert_eq!(stamp_filename("a/b c"), "a-b-c.json");
    }

    fn snapshot_for(graph: Graph, name: &str, hits: &[String]) -> ReviewSnapshot {
        let bubbles = cluster(&graph);
        let (view, _) = stamp_from_graph(&graph, &bubbles, name, hits, "rust@0.1.0");
        ReviewSnapshot {
            plugin: "rust@0.1.0".into(),
            graph,
            bubbles,
            flows: vec![view],
            coverage: Coverage {
                changed: vec![],
                uncovered: vec![],
            },
            findings: vec![],
            stats: Default::default(),
            stamps: vec![],
        }
    }

    #[test]
    fn apply_saved_stamps_records_hold() {
        let a = node("crate::a", NodeKind::Function);
        let c = node("crate::c", NodeKind::Function);
        let graph = Graph {
            nodes: vec![a.clone(), c.clone()],
            edges: vec![Edge {
                from: a.id,
                to: c.id,
                kind: EdgeKind::Calls,
                span: a.span.clone(),
            }],
        };
        let hits = vec!["crate::a".into(), "crate::c".into()];
        let bubbles = cluster(&graph);
        let (_, stamp) = stamp_from_graph(&graph, &bubbles, "login", &hits, "rust@0.1.0");
        let mut snap = snapshot_for(graph, "login", &hits);
        apply_saved_stamps(&mut snap, &[stamp]);
        assert_eq!(snap.stamps.len(), 1);
        assert!(snap.stamps[0].holds);
        assert!(!snap
            .findings
            .iter()
            .any(|f| matches!(f.kind, FindingKind::StampBroken { .. })));
    }

    #[test]
    fn apply_saved_stamps_records_break() {
        let a = node("crate::a", NodeKind::Function);
        let b = node("crate::b", NodeKind::Function);
        let c = node("crate::c", NodeKind::Function);
        let old = Graph {
            nodes: vec![a.clone(), c.clone()],
            edges: vec![Edge {
                from: a.id,
                to: c.id,
                kind: EdgeKind::Calls,
                span: a.span.clone(),
            }],
        };
        let hits = vec!["crate::a".into(), "crate::c".into()];
        let (_, stamp) = stamp_from_graph(&old, &cluster(&old), "login", &hits, "rust@0.1.0");
        let new = Graph {
            nodes: vec![a.clone(), b.clone(), c.clone()],
            edges: vec![
                Edge {
                    from: a.id,
                    to: b.id,
                    kind: EdgeKind::Calls,
                    span: a.span.clone(),
                },
                Edge {
                    from: b.id,
                    to: c.id,
                    kind: EdgeKind::Calls,
                    span: b.span.clone(),
                },
            ],
        };
        let mut snap = snapshot_for(new, "login", &hits);
        apply_saved_stamps(&mut snap, &[stamp]);
        assert_eq!(snap.stamps.len(), 1);
        assert!(!snap.stamps[0].holds);
        assert!(snap
            .findings
            .iter()
            .any(|f| matches!(f.kind, FindingKind::StampBroken { .. })));
    }
}
