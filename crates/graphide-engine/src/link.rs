use graphide_ir::{Edge, EdgeKind, Extract, Finding, FindingKind, Graph, Node, NodeId, NodeKind};
use indexmap::IndexMap;
use std::collections::HashSet;

/// Hash-join extracts into a linked graph. Engine owns IDs.
pub fn link(extracts: &[Extract]) -> (Graph, Vec<Finding>) {
    let mut findings = Vec::new();
    let mut nodes_by_fqn: IndexMap<String, Node> = IndexMap::new();
    let mut seen_identity: HashSet<(NodeKind, String)> = HashSet::new();

    for extract in extracts {
        for def in &extract.nodes {
            if def.span.file != extract.file {
                findings.push(Finding {
                    kind: FindingKind::SpanlessDrop {
                        plugin: extract.plugin.clone(),
                        file: extract.file.clone(),
                    },
                    span: Some(def.span.clone()),
                });
                continue;
            }
            if def.kind == NodeKind::Endpoint && def.endpoint.is_none() {
                findings.push(Finding {
                    kind: FindingKind::PluginBug {
                        message: format!("Endpoint {} missing endpoint meta", def.fqn),
                    },
                    span: Some(def.span.clone()),
                });
                continue;
            }
            let key = (def.kind, def.fqn.clone());
            if !seen_identity.insert(key.clone()) {
                findings.push(Finding {
                    kind: FindingKind::DuplicateFqn {
                        node_kind: def.kind,
                        fqn: def.fqn.clone(),
                    },
                    span: Some(def.span.clone()),
                });
                continue;
            }
            let id = NodeId::from_identity(def.kind, &def.fqn);
            nodes_by_fqn.insert(
                def.fqn.clone(),
                Node {
                    id,
                    fqn: def.fqn.clone(),
                    kind: def.kind,
                    span: def.span.clone(),
                    endpoint: def.endpoint.clone(),
                },
            );
        }
    }

    // Index by FQN alone for join; kind checked when resolving.
    let mut fqn_index: IndexMap<String, Vec<NodeId>> = IndexMap::new();
    for n in nodes_by_fqn.values() {
        fqn_index.entry(n.fqn.clone()).or_default().push(n.id);
    }
    let id_to_node: IndexMap<NodeId, Node> =
        nodes_by_fqn.values().map(|n| (n.id, n.clone())).collect();

    let mut edges = Vec::new();
    for extract in extracts {
        for r in &extract.refs {
            if r.span.file != extract.file {
                findings.push(Finding {
                    kind: FindingKind::SpanlessDrop {
                        plugin: extract.plugin.clone(),
                        file: extract.file.clone(),
                    },
                    span: Some(r.span.clone()),
                });
                continue;
            }
            let Some(to_fqn) = r.to.as_ref() else {
                continue; // unresolved is not an edge
            };
            let Some(from_node) = nodes_by_fqn.get(&r.from) else {
                findings.push(Finding {
                    kind: FindingKind::PluginBug {
                        message: format!("ref from unknown {}", r.from),
                    },
                    span: Some(r.span.clone()),
                });
                continue;
            };
            let Some(candidates) = fqn_index.get(to_fqn) else {
                continue;
            };
            let mut matched = None;
            for &cand in candidates {
                let target = &id_to_node[&cand];
                if let Some(expected) = r.kind.expected_target_kind() {
                    if target.kind != expected {
                        findings.push(Finding {
                            kind: FindingKind::KindMismatch {
                                from: r.from.clone(),
                                to: to_fqn.clone(),
                                edge: r.kind,
                            },
                            span: Some(r.span.clone()),
                        });
                        continue;
                    }
                }
                // Publishes/Subscribes prefer Endpoint else Function (IR sketch).
                if matches!(r.kind, EdgeKind::Publishes | EdgeKind::Subscribes) {
                    if !matches!(target.kind, NodeKind::Endpoint | NodeKind::Function) {
                        findings.push(Finding {
                            kind: FindingKind::KindMismatch {
                                from: r.from.clone(),
                                to: to_fqn.clone(),
                                edge: r.kind,
                            },
                            span: Some(r.span.clone()),
                        });
                        continue;
                    }
                }
                matched = Some(cand);
                break;
            }
            if let Some(to_id) = matched {
                edges.push(Edge {
                    from: from_node.id,
                    to: to_id,
                    kind: r.kind,
                    span: r.span.clone(),
                });
            }
        }
    }

    (
        Graph {
            nodes: nodes_by_fqn.into_values().collect(),
            edges,
        },
        findings,
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use graphide_ir::*;

    fn span(file: &str) -> Span {
        Span {
            file: file.into(),
            start: Pos { line: 1, column: 1 },
            end: Pos { line: 2, column: 1 },
        }
    }

    #[test]
    fn links_resolved_refs_and_drops_unresolved() {
        let extracts = vec![Extract {
            plugin: "rust@0.1.0".into(),
            file: "a.rs".into(),
            nodes: vec![
                NodeDef {
                    fqn: "crate::a".into(),
                    kind: NodeKind::Function,
                    span: span("a.rs"),
                    endpoint: None,
                },
                NodeDef {
                    fqn: "crate::b".into(),
                    kind: NodeKind::Function,
                    span: Span {
                        file: "a.rs".into(),
                        start: Pos { line: 3, column: 1 },
                        end: Pos { line: 4, column: 1 },
                    },
                    endpoint: None,
                },
            ],
            refs: vec![
                Ref {
                    from: "crate::a".into(),
                    to: Some("crate::b".into()),
                    kind: EdgeKind::Calls,
                    span: span("a.rs"),
                },
                Ref {
                    from: "crate::a".into(),
                    to: None,
                    kind: EdgeKind::Calls,
                    span: span("a.rs"),
                },
            ],
        }];
        let (g, findings) = link(&extracts);
        assert_eq!(g.nodes.len(), 2);
        assert_eq!(g.edges.len(), 1);
        assert!(findings.is_empty());
    }

    #[test]
    fn duplicate_fqn_is_finding() {
        let extracts = vec![Extract {
            plugin: "rust@0.1.0".into(),
            file: "a.rs".into(),
            nodes: vec![
                NodeDef {
                    fqn: "crate::a".into(),
                    kind: NodeKind::Function,
                    span: span("a.rs"),
                    endpoint: None,
                },
                NodeDef {
                    fqn: "crate::a".into(),
                    kind: NodeKind::Function,
                    span: Span {
                        file: "a.rs".into(),
                        start: Pos { line: 5, column: 1 },
                        end: Pos { line: 6, column: 1 },
                    },
                    endpoint: None,
                },
            ],
            refs: vec![],
        }];
        let (g, findings) = link(&extracts);
        assert_eq!(g.nodes.len(), 1);
        assert!(matches!(findings[0].kind, FindingKind::DuplicateFqn { .. }));
    }

    #[test]
    fn kind_mismatch_calls_to_type_is_finding_not_edge() {
        let extracts = vec![Extract {
            plugin: "rust@0.1.0".into(),
            file: "a.rs".into(),
            nodes: vec![
                NodeDef {
                    fqn: "crate::a".into(),
                    kind: NodeKind::Function,
                    span: span("a.rs"),
                    endpoint: None,
                },
                NodeDef {
                    fqn: "crate::T".into(),
                    kind: NodeKind::Type,
                    span: Span {
                        file: "a.rs".into(),
                        start: Pos { line: 3, column: 1 },
                        end: Pos { line: 4, column: 1 },
                    },
                    endpoint: None,
                },
            ],
            refs: vec![Ref {
                from: "crate::a".into(),
                to: Some("crate::T".into()),
                kind: EdgeKind::Calls,
                span: span("a.rs"),
            }],
        }];
        let (g, findings) = link(&extracts);
        assert!(g.edges.is_empty());
        assert!(matches!(findings[0].kind, FindingKind::KindMismatch { .. }));
    }
}
