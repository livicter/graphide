//! jan-tennert/SolarSim as a complex-repo demo (Bevy n-body sandbox).

use graphide_engine::{derive_repo, ReviewInput, ReviewOptions};
use graphide_ir::*;
use graphide_plugin_rust::extract_file;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

fn demo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../fixtures/solarsim")
}

fn collect_rs(dir: &Path, out: &mut Vec<PathBuf>) {
    for ent in fs::read_dir(dir).unwrap() {
        let p = ent.unwrap().path();
        if p.is_dir() {
            collect_rs(&p, out);
        } else if p.extension().and_then(|s| s.to_str()) == Some("rs") {
            out.push(p);
        }
    }
}

fn extract_demo() -> (Vec<Extract>, HashMap<String, String>) {
    let root = demo_root();
    let mut files = Vec::new();
    collect_rs(&root.join("src"), &mut files);
    files.sort();
    let mut extracts = Vec::new();
    let mut sources = HashMap::new();
    for p in files {
        let rel = p
            .strip_prefix(&root)
            .unwrap()
            .to_string_lossy()
            .replace('\\', "/");
        let text = fs::read_to_string(&p).unwrap();
        sources.insert(rel.clone(), text.clone());
        extracts.push(extract_file(&rel, &text).unwrap().extract);
    }
    (extracts, sources)
}

fn hints() -> HintFile {
    let text = fs::read_to_string(demo_root().join("flows.toml")).unwrap();
    graphide_engine::hints_from_toml(&text).unwrap()
}

#[test]
fn solarsim_flows_resolve_and_connect() {
    let (extracts, sources) = extract_demo();
    let snap = derive_repo(
        ReviewInput {
            head_extracts: extracts,
            parent_extracts: None,
            hints: hints(),
            head_sources: sources,
            parent_sources: Default::default(),
            previous_bubbles: None,
        },
        &ReviewOptions {
            plugin: "rust@0.1.0".into(),
        },
    );
    let unmatched: Vec<_> = snap
        .findings
        .iter()
        .filter(|f| matches!(f.kind, FindingKind::UnmatchedHint { .. }))
        .collect();
    assert!(unmatched.is_empty(), "{unmatched:?}");
    assert_eq!(snap.flows.len(), 5);
    assert!(
        snap.graph.nodes.len() > 300,
        "expected a large graph, got {} nodes",
        snap.graph.nodes.len()
    );
    for flow in &snap.flows {
        assert!(
            !flow.tree.nodes.is_empty(),
            "flow {} produced an empty Steiner tree",
            flow.name
        );
        assert!(
            !flow.tree.edges.is_empty(),
            "flow {} produced no connecting edges",
            flow.name
        );
    }
    let verlet = snap
        .flows
        .iter()
        .find(|f| f.name == "nbody-verlet")
        .unwrap();
    assert!(
        verlet.tree.edges.iter().any(|e| e.kind == EdgeKind::Calls),
        "nbody-verlet should be a Calls chain: {:?}",
        verlet.tree
    );
    let load = snap
        .flows
        .iter()
        .find(|f| f.name == "load-scenario")
        .unwrap();
    assert_eq!(load.tree.edges.len(), 3);
    assert!(load.tree.edges.iter().all(|e| e.kind == EdgeKind::Calls));
}
