//! Runtime paths return values / findings instead of panicking on bad input.

use graphide_engine::{
    apply_saved_stamps, build_flowchart, cluster, derive_repo, enter_bubble, parse_flows_toml,
    recheck_stamp, resolve_fqn, steiner_tree, ReviewInput, ReviewOptions,
};
use graphide_ir::*;
use std::collections::HashMap;
use std::panic::{catch_unwind, AssertUnwindSafe};

fn span(file: &str) -> Span {
    Span {
        file: file.into(),
        start: Pos { line: 1, column: 1 },
        end: Pos { line: 2, column: 1 },
    }
}

fn node(fqn: &str, kind: NodeKind) -> Node {
    Node {
        id: NodeId::from_identity(kind, fqn),
        fqn: fqn.into(),
        kind,
        span: span("x.rs"),
        endpoint: None,
    }
}

fn opts() -> ReviewOptions<'static> {
    ReviewOptions {
        plugin: "test".into(),
        progress: None,
        preview: None,
    }
}

fn empty_input() -> ReviewInput {
    ReviewInput {
        head_extracts: vec![],
        parent_extracts: None,
        hints: HintFile { flows: vec![] },
        head_sources: HashMap::new(),
        parent_sources: HashMap::new(),
        previous_bubbles: None,
    }
}

#[test]
fn derive_empty_repo_does_not_panic() {
    let caught = catch_unwind(|| derive_repo(empty_input(), &opts()));
    assert!(caught.is_ok(), "derive empty panicked");
    let snap = caught.expect("derive");
    assert!(snap.graph.nodes.is_empty());
    assert!(snap.flows.is_empty() || snap.flows.iter().all(|f| f.tree.nodes.is_empty()));
}

#[test]
fn derive_dangling_refs_are_findings() {
    let extract = Extract {
        plugin: "rust@0.1.0".into(),
        file: "a.rs".into(),
        nodes: vec![],
        refs: vec![Ref {
            from: "missing".into(),
            to: Some("also".into()),
            kind: EdgeKind::Calls,
            span: span("a.rs"),
        }],
    };
    let input = ReviewInput {
        head_extracts: vec![extract],
        hints: HintFile {
            flows: vec![FlowHint {
                name: "ghost".into(),
                hits: vec!["nope::fn".into()],
            }],
        },
        ..empty_input()
    };
    let caught = catch_unwind(|| derive_repo(input, &opts()));
    assert!(caught.is_ok(), "derive dangling panicked");
    let snap = caught.expect("derive");
    assert!(snap.findings.iter().any(|f| matches!(
        f.kind,
        FindingKind::UnmatchedHint { .. } | FindingKind::PluginBug { .. }
    )));
}

#[test]
fn cluster_and_steiner_tolerate_empty_and_unknown_ids() {
    let empty = Graph {
        nodes: vec![],
        edges: vec![],
    };
    assert!(catch_unwind(|| cluster(&empty)).is_ok());
    assert!(catch_unwind(|| steiner_tree(&empty, &[])).is_ok());
    assert!(catch_unwind(|| build_flowchart(&empty, &[], &Steiner {
        nodes: vec![],
        edges: vec![],
    }))
    .is_ok());

    let a = node("crate::a", NodeKind::Function);
    let b = node("crate::b", NodeKind::Function);
    let c = node("crate::c", NodeKind::Function);
    let g = Graph {
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
    let unknown = NodeId(0xdead_beef);
    assert!(catch_unwind(|| cluster(&g)).is_ok());
    assert!(catch_unwind(|| steiner_tree(&g, &[unknown])).is_ok());
    let tree = steiner_tree(&g, &[a.id, c.id]);
    let bubbles = cluster(&g);
    assert!(catch_unwind(|| build_flowchart(&g, &bubbles, &tree)).is_ok());
}

#[test]
fn unmatched_hint_and_missing_enter_are_none_or_finding() {
    let a = node("crate::a", NodeKind::Function);
    let g = Graph {
        nodes: vec![a.clone()],
        edges: vec![],
    };
    assert!(resolve_fqn(&g, "nope").is_none());
    assert!(resolve_fqn(&g, "").is_none());
    let snap = ReviewSnapshot {
        plugin: "test".into(),
        graph: g,
        bubbles: vec![],
        flows: vec![],
        coverage: Coverage {
            changed: vec![],
            uncovered: vec![],
        },
        findings: vec![],
        stats: Default::default(),
        stamps: vec![],
        programs: vec![],
    };
    assert!(enter_bubble(&snap, "missing", 1).is_none());
}

#[test]
fn stamp_recheck_on_empty_graph_does_not_panic() {
    let stamp = Stamp {
        name: "f".into(),
        hits: vec!["crate::gone".into()],
        tree: vec![],
        positions: vec![],
        deriver: "test".into(),
    };
    let g = Graph {
        nodes: vec![],
        edges: vec![],
    };
    assert!(catch_unwind(|| recheck_stamp(&g, &stamp)).is_ok());
    let mut snap = ReviewSnapshot {
        plugin: "test".into(),
        graph: g,
        bubbles: vec![],
        flows: vec![],
        coverage: Coverage {
            changed: vec![],
            uncovered: vec![],
        },
        findings: vec![],
        stats: Default::default(),
        stamps: vec![],
        programs: vec![],
    };
    assert!(catch_unwind(AssertUnwindSafe(|| apply_saved_stamps(&mut snap, &[stamp]))).is_ok());
}

#[test]
fn bad_toml_is_error() {
    assert!(parse_flows_toml("[[flow").is_err());
}
