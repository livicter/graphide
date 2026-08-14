use graphide_ir::{span_snippet, Coverage, Flow, Graph, NodeId};
use std::collections::{HashMap, HashSet};

/// Changed = span contents differ OR incident edges gained/lost. Match by (kind,fqn) via NodeId.
pub fn changed_nodes(parent: &Graph, head: &Graph) -> Vec<NodeId> {
    changed_nodes_with_sources(parent, head, &HashMap::new(), &HashMap::new())
}

/// Compare the source text inside each node's span when file bytes are available.
pub fn changed_nodes_with_sources(
    parent: &Graph,
    head: &Graph,
    parent_sources: &HashMap<String, String>,
    head_sources: &HashMap<String, String>,
) -> Vec<NodeId> {
    let parent_by_id: HashMap<_, _> = parent.nodes.iter().map(|n| (n.id, n)).collect();
    let parent_incident = incident_map(parent);
    let head_incident = incident_map(head);
    let mut changed = Vec::new();
    for n in &head.nodes {
        let Some(p) = parent_by_id.get(&n.id) else {
            changed.push(n.id);
            continue;
        };
        let snippet_changed = match (
            parent_sources.get(&p.span.file),
            head_sources.get(&n.span.file),
        ) {
            (Some(ps), Some(hs)) => span_snippet(ps, &p.span) != span_snippet(hs, &n.span),
            _ => p.span != n.span,
        };
        let edges_changed = parent_incident.get(&n.id) != head_incident.get(&n.id);
        if snippet_changed || edges_changed {
            changed.push(n.id);
        }
    }
    changed
}

fn incident_map(graph: &Graph) -> HashMap<NodeId, HashSet<(NodeId, graphide_ir::EdgeKind, bool)>> {
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
        Graph {
            nodes: vec![],
            edges: vec![],
        }
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

    #[test]
    fn span_text_change_marks_node_not_file_siblings() {
        let helper = Node {
            id: NodeId::from_identity(NodeKind::Function, "crate::helper"),
            fqn: "crate::helper".into(),
            kind: NodeKind::Function,
            span: Span {
                file: "a.rs".into(),
                start: Pos { line: 2, column: 1 },
                end: Pos {
                    line: 2,
                    column: 15,
                },
            },
            endpoint: None,
        };
        let keep = Node {
            id: NodeId::from_identity(NodeKind::Function, "crate::keep"),
            fqn: "crate::keep".into(),
            kind: NodeKind::Function,
            span: Span {
                file: "a.rs".into(),
                start: Pos { line: 1, column: 1 },
                end: Pos {
                    line: 1,
                    column: 13,
                },
            },
            endpoint: None,
        };
        let parent = Graph {
            nodes: vec![keep.clone()],
            edges: vec![],
        };
        let head = Graph {
            nodes: vec![keep.clone(), helper.clone()],
            edges: vec![],
        };
        let parent_src = HashMap::from([("a.rs".into(), "fn keep() {}\n".into())]);
        let head_src = HashMap::from([("a.rs".into(), "fn keep() {}\nfn helper() {}\n".into())]);
        let changed = changed_nodes_with_sources(&parent, &head, &parent_src, &head_src);
        assert_eq!(changed, vec![helper.id]);
    }
}
