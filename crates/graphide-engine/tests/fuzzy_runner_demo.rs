//! livicter/fuzzy-runner as the real-repo demo (Bevy rooftop runner).

use graphide_engine::{derive_repo, ReviewInput, ReviewOptions};
use graphide_ir::*;
use graphide_plugin_rust::{extract_file_with, ExtractOptions, SymbolIndex};
use std::fs;
use std::path::PathBuf;

fn demo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../fixtures/fuzzy-runner")
}

fn extract_demo() -> (Vec<Extract>, std::collections::HashMap<String, String>) {
    let root = demo_root();
    let mut files = Vec::new();
    for ent in fs::read_dir(root.join("src")).unwrap() {
        let p = ent.unwrap().path();
        if p.extension().and_then(|s| s.to_str()) == Some("rs") {
            files.push(p);
        }
    }
    let mut sources = std::collections::HashMap::new();
    let mut pass1 = Vec::new();
    for p in &files {
        let rel = format!("src/{}", p.file_name().unwrap().to_string_lossy());
        let text = fs::read_to_string(p).unwrap();
        sources.insert(rel.clone(), text.clone());
        let opts = ExtractOptions {
            package: "fuzzy_runner".into(),
            crate_root: String::new(),
            symbols: None,
        };
        pass1.push(extract_file_with(&rel, &text, &opts).unwrap().extract);
    }
    let idx = SymbolIndex::from_extracts(&pass1);
    let mut extracts = Vec::new();
    for p in &files {
        let rel = format!("src/{}", p.file_name().unwrap().to_string_lossy());
        let text = sources.get(&rel).unwrap();
        let opts = ExtractOptions {
            package: "fuzzy_runner".into(),
            crate_root: String::new(),
            symbols: Some(&idx),
        };
        extracts.push(extract_file_with(&rel, text, &opts).unwrap().extract);
    }
    (extracts, sources)
}

fn hints() -> HintFile {
    let text = fs::read_to_string(demo_root().join("flows.toml")).unwrap();
    graphide_engine::hints_from_toml(&text).unwrap()
}

#[test]
fn fuzzy_runner_flows_resolve_and_connect() {
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
    assert_eq!(snap.flows.len(), 4);
    for flow in &snap.flows {
        assert!(
            !flow.tree.nodes.is_empty(),
            "flow {} produced an empty Steiner tree",
            flow.name
        );
    }
    let rooftop = snap.flows.iter().find(|f| f.name == "rooftop-gen").unwrap();
    assert!(
        rooftop.tree.edges.iter().any(|e| e.kind == EdgeKind::Calls),
        "rooftop-gen should include setup/manage -> spawn_platform: {:?}",
        rooftop.tree
    );
    assert!(snap.graph.nodes.len() > 40);
}
