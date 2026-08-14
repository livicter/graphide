//! First slice from SPEC.md §9 + IR.md mini example, from real plugin extract.

use graphide_engine::{derive_repo, ReviewInput, ReviewOptions};
use graphide_ir::*;
use graphide_plugin_rust::extract_file;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

fn fixture_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../fixtures/demo")
}

fn parent_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../fixtures/demo-parent")
}

fn extract_dir(root: &std::path::Path) -> (Vec<Extract>, HashMap<String, String>) {
    let mut extracts = Vec::new();
    let mut sources = HashMap::new();
    for rel in ["src/lib.rs", "src/bus.rs", "src/sub.rs"] {
        let text = fs::read_to_string(root.join(rel)).unwrap();
        sources.insert(rel.to_string(), text.clone());
        extracts.push(extract_file(rel, &text).unwrap().extract);
    }
    (extracts, sources)
}

fn hints() -> HintFile {
    HintFile {
        flows: vec![FlowHint {
            name: "data-subscription".into(),
            hits: vec!["crate::sub::subscribe".into(), "crate::bus::events".into()],
        }],
    }
}

#[test]
fn plugin_extract_matches_ir_md_edges() {
    let root = fixture_root();
    let (extracts, _) = extract_dir(&root);
    let bus = extracts.iter().find(|e| e.file == "src/bus.rs").unwrap();
    let sub = extracts.iter().find(|e| e.file == "src/sub.rs").unwrap();

    assert!(bus
        .nodes
        .iter()
        .any(|n| n.fqn == "crate::bus::Bus" && n.kind == NodeKind::Type));
    assert!(bus
        .nodes
        .iter()
        .any(|n| n.fqn == "crate::bus::Bus::publish" && n.kind == NodeKind::Function));
    assert!(bus.nodes.iter().any(|n| {
        n.fqn == "crate::bus::events"
            && n.kind == NodeKind::Endpoint
            && n.endpoint.as_ref().is_some_and(|e| e.role == EndRole::Sink)
    }));
    assert!(bus.refs.iter().any(|r| {
        r.from == "crate::bus::Bus::publish"
            && r.to.as_deref() == Some("crate::bus::events")
            && r.kind == EdgeKind::Publishes
    }));
    assert!(sub.refs.iter().any(|r| {
        r.from == "crate::sub::subscribe"
            && r.to.as_deref() == Some("crate::bus::events")
            && r.kind == EdgeKind::Subscribes
    }));
    assert!(sub.refs.iter().any(|r| {
        r.from == "crate::sub::subscribe"
            && r.to.as_deref() == Some("crate::bus::Bus")
            && r.kind == EdgeKind::TypeUses
    }));
}

#[test]
fn steiner_of_hits_is_subscribes_edge() {
    let (extracts, sources) = extract_dir(&fixture_root());
    let snap = derive_repo(
        ReviewInput {
            head_extracts: extracts,
            parent_extracts: None,
            hints: hints(),
            head_sources: sources,
            parent_sources: HashMap::new(),
            previous_bubbles: None,
        },
        &ReviewOptions {
            plugin: "rust@0.1.0".into(),
        },
    );
    assert!(
        !snap
            .findings
            .iter()
            .any(|f| matches!(f.kind, FindingKind::UnmatchedHint { .. })),
        "{:?}",
        snap.findings
    );
    let flow = &snap.flows[0];
    assert_eq!(flow.tree.edges.len(), 1, "{:?}", flow.tree);
    assert_eq!(flow.tree.edges[0].kind, EdgeKind::Subscribes);
    assert_eq!(flow.tree.nodes.len(), 2);
    let bus = snap
        .graph
        .nodes
        .iter()
        .find(|n| n.fqn == "crate::bus::Bus")
        .unwrap();
    assert!(!flow.tree.nodes.contains(&bus.id));
    assert!(
        flow.flowchart.runs.len() >= 2,
        "coarse flowchart should be subsystem runs, got {:?}",
        flow.flowchart.runs
    );
}

#[test]
fn coverage_flags_sneaky_helper_only() {
    let (head, head_src) = extract_dir(&fixture_root());
    let (parent, parent_src) = extract_dir(&parent_root());
    let snap = derive_repo(
        ReviewInput {
            head_extracts: head,
            parent_extracts: Some(parent),
            hints: hints(),
            head_sources: head_src,
            parent_sources: parent_src,
            previous_bubbles: None,
        },
        &ReviewOptions {
            plugin: "rust@0.1.0".into(),
        },
    );
    let uncovered: Vec<_> = snap
        .coverage
        .uncovered
        .iter()
        .filter_map(|id| {
            snap.graph
                .nodes
                .iter()
                .find(|n| n.id == *id)
                .map(|n| n.fqn.as_str())
        })
        .collect();
    assert_eq!(
        uncovered,
        vec!["crate::bus::sneaky_helper"],
        "{uncovered:?} findings={:?}",
        snap.findings
    );
    assert!(snap
        .findings
        .iter()
        .any(|f| matches!(&f.kind, FindingKind::UncoveredNode { fqn } if fqn == "crate::bus::sneaky_helper")));
}
