//! Architecture Delta: pair two derived Graphs by `(kind, fqn)`.
//!
//! Contract (Archify compare, Graphide identity): validate both sides as
//! Graphs, pair by NodeId = hash(kind, fqn), classify semantic / topology /
//! presentation, emit added · removed · changed · moved · rerouted. No
//! authored snapshot ids. No blast-radius or merge-safety claims.

use graphide_ir::{
    span_snippet, ArchitectureDelta, DeltaClass, DeltaFact, DeltaStatus, EdgeKind, Graph, Node,
    NodeId,
};
use std::collections::{HashMap, HashSet};

pub fn architecture_delta(
    parent: &Graph,
    head: &Graph,
    parent_sources: &HashMap<String, String>,
    head_sources: &HashMap<String, String>,
) -> ArchitectureDelta {
    if parent.nodes.is_empty() && parent.edges.is_empty() {
        return ArchitectureDelta::default();
    }

    let parent_by_id: HashMap<NodeId, &Node> = parent.nodes.iter().map(|n| (n.id, n)).collect();
    let head_by_id: HashMap<NodeId, &Node> = head.nodes.iter().map(|n| (n.id, n)).collect();
    let parent_incident = incident_map(parent);
    let head_incident = incident_map(head);
    let fqn_of = |graph: &Graph, id: NodeId| -> String {
        graph
            .nodes
            .iter()
            .find(|n| n.id == id)
            .map(|n| n.fqn.clone())
            .unwrap_or_else(|| id.0.to_string())
    };

    let mut facts: Vec<DeltaFact> = Vec::new();

    for n in &head.nodes {
        if !parent_by_id.contains_key(&n.id) {
            facts.push(DeltaFact {
                status: DeltaStatus::Added,
                class: DeltaClass::Semantic,
                subject: n.kind.to_string(),
                fqn: n.fqn.clone(),
                from_fqn: None,
                to_fqn: None,
                edge_kind: None,
                file: Some(n.span.file.clone()),
                detail: format!("new derived {}", n.kind),
            });
        }
    }
    for n in &parent.nodes {
        if !head_by_id.contains_key(&n.id) {
            facts.push(DeltaFact {
                status: DeltaStatus::Removed,
                class: DeltaClass::Semantic,
                subject: n.kind.to_string(),
                fqn: n.fqn.clone(),
                from_fqn: None,
                to_fqn: None,
                edge_kind: None,
                file: Some(n.span.file.clone()),
                detail: format!("gone derived {}", n.kind),
            });
        }
    }
    for n in &head.nodes {
        let Some(p) = parent_by_id.get(&n.id) else {
            continue;
        };
        if p.span.file != n.span.file {
            facts.push(DeltaFact {
                status: DeltaStatus::Moved,
                class: DeltaClass::Presentation,
                subject: n.kind.to_string(),
                fqn: n.fqn.clone(),
                from_fqn: None,
                to_fqn: None,
                edge_kind: None,
                file: Some(n.span.file.clone()),
                detail: format!("{} → {}", p.span.file, n.span.file),
            });
        }
        let snippet_changed = match (
            parent_sources.get(&p.span.file),
            head_sources.get(&n.span.file),
        ) {
            (Some(ps), Some(hs)) => span_snippet(ps, &p.span) != span_snippet(hs, &n.span),
            _ => p.span != n.span,
        };
        let edges_changed = parent_incident.get(&n.id) != head_incident.get(&n.id);
        if snippet_changed || edges_changed {
            let why = match (snippet_changed, edges_changed) {
                (true, true) => "span text and incident hops changed",
                (true, false) => "span text changed",
                (false, true) => "incident hops changed",
                (false, false) => "changed",
            };
            facts.push(DeltaFact {
                status: DeltaStatus::Changed,
                class: DeltaClass::Semantic,
                subject: n.kind.to_string(),
                fqn: n.fqn.clone(),
                from_fqn: None,
                to_fqn: None,
                edge_kind: None,
                file: Some(n.span.file.clone()),
                detail: why.into(),
            });
        }
    }

    let parent_hops: HashSet<(NodeId, NodeId, EdgeKind)> = parent
        .edges
        .iter()
        .map(|e| (e.from, e.to, e.kind))
        .collect();
    let head_hops: HashSet<(NodeId, NodeId, EdgeKind)> =
        head.edges.iter().map(|e| (e.from, e.to, e.kind)).collect();

    let mut added_hops: Vec<(NodeId, NodeId, EdgeKind)> = head_hops
        .difference(&parent_hops)
        .copied()
        .collect();
    let mut removed_hops: Vec<(NodeId, NodeId, EdgeKind)> = parent_hops
        .difference(&head_hops)
        .copied()
        .collect();
    added_hops.sort_by_key(|h| (h.0 .0, h.1 .0, format!("{:?}", h.2)));
    removed_hops.sort_by_key(|h| (h.0 .0, h.1 .0, format!("{:?}", h.2)));

    let mut used_added = HashSet::new();
    let mut used_removed = HashSet::new();
    for (i, &(rf, rt, rk)) in removed_hops.iter().enumerate() {
        if used_removed.contains(&i) {
            continue;
        }
        let pair = added_hops.iter().enumerate().find(|(j, &(af, at, ak))| {
            !used_added.contains(j) && ak == rk && af == rf && at != rt
        });
        let pair = pair.or_else(|| {
            added_hops.iter().enumerate().find(|(j, &(af, at, ak))| {
                !used_added.contains(j) && ak == rk && at == rt && af != rf
            })
        });
        if let Some((j, &(af, at, ak))) = pair {
            used_removed.insert(i);
            used_added.insert(j);
            facts.push(DeltaFact {
                status: DeltaStatus::Rerouted,
                class: DeltaClass::Topology,
                subject: format!("{rk:?}"),
                fqn: format!("{} → {}", fqn_of(head, af), fqn_of(head, at)),
                from_fqn: Some(fqn_of(head, af)),
                to_fqn: Some(fqn_of(head, at)),
                edge_kind: Some(ak),
                file: None,
                detail: format!(
                    "{} → {} became {} → {}",
                    fqn_of(parent, rf),
                    fqn_of(parent, rt),
                    fqn_of(head, af),
                    fqn_of(head, at)
                ),
            });
        }
    }
    for (i, &(f, t, k)) in added_hops.iter().enumerate() {
        if used_added.contains(&i) {
            continue;
        }
        facts.push(DeltaFact {
            status: DeltaStatus::Added,
            class: DeltaClass::Topology,
            subject: format!("{k:?}"),
            fqn: format!("{} → {}", fqn_of(head, f), fqn_of(head, t)),
            from_fqn: Some(fqn_of(head, f)),
            to_fqn: Some(fqn_of(head, t)),
            edge_kind: Some(k),
            file: None,
            detail: format!("new {k:?} hop"),
        });
    }
    for (i, &(f, t, k)) in removed_hops.iter().enumerate() {
        if used_removed.contains(&i) {
            continue;
        }
        facts.push(DeltaFact {
            status: DeltaStatus::Removed,
            class: DeltaClass::Topology,
            subject: format!("{k:?}"),
            fqn: format!("{} → {}", fqn_of(parent, f), fqn_of(parent, t)),
            from_fqn: Some(fqn_of(parent, f)),
            to_fqn: Some(fqn_of(parent, t)),
            edge_kind: Some(k),
            file: None,
            detail: format!("gone {k:?} hop"),
        });
    }

    facts.sort_by(|a, b| {
        status_ord(a.status)
            .cmp(&status_ord(b.status))
            .then(a.fqn.cmp(&b.fqn))
            .then(a.subject.cmp(&b.subject))
    });

    let mut out = ArchitectureDelta {
        facts: facts.clone(),
        added: 0,
        removed: 0,
        changed: 0,
        moved: 0,
        rerouted: 0,
        parent: Some(parent.clone()),
    };
    for f in &facts {
        match f.status {
            DeltaStatus::Added => out.added += 1,
            DeltaStatus::Removed => out.removed += 1,
            DeltaStatus::Changed => out.changed += 1,
            DeltaStatus::Moved => out.moved += 1,
            DeltaStatus::Rerouted => out.rerouted += 1,
        }
    }
    out
}

fn status_ord(s: DeltaStatus) -> u8 {
    match s {
        DeltaStatus::Added => 0,
        DeltaStatus::Removed => 1,
        DeltaStatus::Changed => 2,
        DeltaStatus::Moved => 3,
        DeltaStatus::Rerouted => 4,
    }
}

fn incident_map(graph: &Graph) -> HashMap<NodeId, HashSet<(NodeId, EdgeKind, bool)>> {
    let mut m: HashMap<NodeId, HashSet<_>> = HashMap::new();
    for n in &graph.nodes {
        m.entry(n.id).or_default();
    }
    for e in &graph.edges {
        m.entry(e.from).or_default().insert((e.to, e.kind, true));
        m.entry(e.to).or_default().insert((e.from, e.kind, false));
    }
    m
}

#[cfg(test)]
mod tests {
    use super::*;
    use graphide_ir::*;

    fn n(kind: NodeKind, fqn: &str, file: &str) -> Node {
        Node {
            id: NodeId::from_identity(kind, fqn),
            fqn: fqn.into(),
            kind,
            span: Span {
                file: file.into(),
                start: Pos { line: 1, column: 1 },
                end: Pos { line: 2, column: 1 },
            },
            endpoint: None,
        }
    }

    fn calls(from: &Node, to: &Node) -> graphide_ir::Edge {
        graphide_ir::Edge {
            from: from.id,
            to: to.id,
            kind: EdgeKind::Calls,
            span: from.span.clone(),
        }
    }

    #[test]
    fn empty_parent_is_silent() {
        let head = Graph {
            nodes: vec![n(NodeKind::Function, "a", "a.rs")],
            edges: vec![],
        };
        let d = architecture_delta(&Graph { nodes: vec![], edges: vec![] }, &head, &HashMap::new(), &HashMap::new());
        assert!(d.facts.is_empty());
        assert!(d.parent.is_none());
    }

    #[test]
    fn added_removed_changed_moved_rerouted() {
        let keep = n(NodeKind::Function, "crate::keep", "a.rs");
        let gone = n(NodeKind::Function, "crate::gone", "a.rs");
        let old_dst = n(NodeKind::Function, "crate::old_dst", "a.rs");
        let parent = Graph {
            nodes: vec![keep.clone(), gone.clone(), old_dst.clone()],
            edges: vec![calls(&keep, &old_dst)],
        };

        let mut moved = n(NodeKind::Function, "crate::keep", "b.rs");
        moved.id = keep.id;
        let added = n(NodeKind::Function, "crate::new", "b.rs");
        let new_dst = n(NodeKind::Function, "crate::new_dst", "b.rs");
        let head = Graph {
            nodes: vec![moved.clone(), added.clone(), new_dst.clone()],
            edges: vec![calls(&moved, &new_dst)],
        };

        let d = architecture_delta(&parent, &head, &HashMap::new(), &HashMap::new());
        let statuses: Vec<_> = d.facts.iter().map(|f| (f.status, f.fqn.as_str())).collect();
        assert!(
            statuses
                .iter()
                .any(|(s, fqn)| *s == DeltaStatus::Added && *fqn == "crate::new"),
            "{statuses:?}"
        );
        assert!(statuses
            .iter()
            .any(|(s, fqn)| *s == DeltaStatus::Removed && *fqn == "crate::gone"));
        assert!(statuses
            .iter()
            .any(|(s, fqn)| *s == DeltaStatus::Moved && *fqn == "crate::keep"));
        assert!(
            d.facts.iter().any(|f| f.status == DeltaStatus::Rerouted
                && f.from_fqn.as_deref() == Some("crate::keep")
                && f.to_fqn.as_deref() == Some("crate::new_dst")),
            "{:#?}",
            d.facts
        );
        assert!(d.parent.is_some());
        assert!(d.added >= 1 && d.removed >= 1 && d.moved >= 1 && d.rerouted >= 1);
    }
}
