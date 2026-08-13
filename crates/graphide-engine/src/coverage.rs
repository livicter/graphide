use graphide_ir::{Coverage, Flow, Graph, NodeId};
use std::collections::HashSet;

/// Changed = span contents differ OR incident edges gained/lost. Match by (kind,fqn) via NodeId.
pub fn changed_nodes(parent: &Graph, head: &Graph) -> Vec<NodeId> {
    let parent_nodes: HashSet<_> = parent.nodes.iter().map(|n| n.id).collect();
    let head_by_id: std::collections::HashMap<_, _> =
        head.nodes.iter().map(|n| (n.id, n)).collect();
    let parent_by_id: std::collections::HashMap<_, _> =
        parent.nodes.iter().map(|n| (n.id, n)).collect();

    let parent_incident = incident_map(parent);
    let head_incident = incident_map(head);

    let mut changed = Vec::new();
    for n in &head.nodes {
        let Some(p) = parent_by_id.get(&n.id) else {
            changed.push(n.id);
            continue;
        };
        let span_changed = p.span != n.span; // without source bytes, span shift = change
        let edges_changed = parent_incident.get(&n.id) != head_incident.get(&n.id);
        if span_changed || edges_changed {
            changed.push(n.id);
        }
    }
    // Nodes removed from head also "changed" for coverage of head review? Spec: between two revisions being reviewed — uncovered on head's proposed trees. Focus head nodes.
    let _ = (parent_nodes, head_by_id);
    changed
}

/// Optional: when caller has file digests keyed by path, refine span_changed.
pub fn changed_nodes_with_files(
    parent: &Graph,
    head: &Graph,
    parent_files: &std::collections::HashMap<String, u64>,
    head_files: &std::collections::HashMap<String, u64>,
) -> Vec<NodeId> {
    let parent_by_id: std::collections::HashMap<_, _> =
        parent.nodes.iter().map(|n| (n.id, n)).collect();
    let parent_incident = incident_map(parent);
    let head_incident = incident_map(head);
    let mut changed = Vec::new();
    for n in &head.nodes {
        let Some(p) = parent_by_id.get(&n.id) else {
            changed.push(n.id);
            continue;
        };
        let file = &n.span.file;
        let content_changed = parent_files.get(file) != head_files.get(file);
        let edges_changed = parent_incident.get(&n.id) != head_incident.get(&n.id);
        if content_changed || edges_changed || p.span != n.span {
            changed.push(n.id);
        }
    }
    changed
}

fn incident_map(graph: &Graph) -> std::collections::HashMap<NodeId, HashSet<(NodeId, graphide_ir::EdgeKind, bool)>> {
    let mut m: std::collections::HashMap<NodeId, HashSet<_>> = std::collections::HashMap::new();
    for n in &graph.nodes {
        m.entry(n.id).or_default();
    }
    for e in &graph.edges {
        m.entry(e.from).or_default().insert((e.to, e.kind, true));
        m.entry(e.to).or_default().insert((e.from, e.kind, false));
    }
    m
}

pub fn coverage(changed: &[NodeId], flows: &[Flow]) -> Coverage {
    let mut on_tree: HashSet<NodeId> = HashSet::new();
    for f in flows {
        on_tree.extend(f.tree.nodes.iter().copied());
    }
    let uncovered: Vec<NodeId> = changed
        .iter()
        .copied()
        .filter(|id| !on_tree.contains(id))
        .collect();
    Coverage {
        changed: changed.to_vec(),
        uncovered,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use graphide_ir::*;

    fn empty_graph() -> Graph {
        Graph { nodes: vec![], edges: vec![] }
    }

    fn node(fqn: &str) -> Node {
        Node {
            id: NodeId::from_identity(NodeKind::Function, fqn),
            fqn: fqn.into(),
            kind: NodeKind::Function,
            span: Span {
                file: "a.rs".into(),
                start: Pos { line: 1, column: 1 },
                end: Pos { line: 2, column: 1 },
            },
            endpoint: None,
        }
    }

    #[test]
    fn uncovered_when_changed_not_on_any_tree() {
        let n = node("crate::helper");
        let flow = Flow {
            name: "f".into(),
            hits: vec![],
            tree: Steiner {
                nodes: vec![],
                edges: vec![],
            },
        };
        let cov = coverage(&[n.id], &[flow]);
        assert_eq!(cov.uncovered, vec![n.id]);
    }

    #[test]
    fn covered_when_on_tree() {
        let n = node("crate::helper");
        let flow = Flow {
            name: "f".into(),
            hits: vec![n.id],
            tree: Steiner {
                nodes: vec![n.id],
                edges: vec![],
            },
        };
        let cov = coverage(&[n.id], &[flow]);
        assert!(cov.uncovered.is_empty());
        let _ = empty_graph();
    }
}
