//! Production check: two-pass extract of this workspace's engine crate
//! resolves the review-loop calls SPEC says the deriver must see.

use graphide_engine::{derive_repo, ReviewInput, ReviewOptions};
use graphide_ir::*;
use graphide_plugin_rust::{extract_file_with, ExtractOptions, SymbolIndex};
use std::fs;
use std::path::PathBuf;

fn crate_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

fn extract_engine() -> Vec<Extract> {
    let src = crate_root().join("src");
    let mut files = Vec::new();
    for ent in fs::read_dir(&src).unwrap() {
        let p = ent.unwrap().path();
        if p.extension().and_then(|s| s.to_str()) == Some("rs") {
            files.push(p);
        }
    }
    let mut pass1 = Vec::new();
    for p in &files {
        let rel = format!(
            "crates/graphide-engine/src/{}",
            p.file_name().unwrap().to_string_lossy()
        );
        let text = fs::read_to_string(p).unwrap();
        let opts = ExtractOptions {
            package: "graphide_engine".into(),
            crate_root: "crates/graphide-engine".into(),
            symbols: None,
        };
        pass1.push(extract_file_with(&rel, &text, &opts).unwrap().extract);
    }
    let idx = SymbolIndex::from_extracts(&pass1);
    let mut out = Vec::new();
    for p in &files {
        let rel = format!(
            "crates/graphide-engine/src/{}",
            p.file_name().unwrap().to_string_lossy()
        );
        let text = fs::read_to_string(p).unwrap();
        let opts = ExtractOptions {
            package: "graphide_engine".into(),
            crate_root: "crates/graphide-engine".into(),
            symbols: Some(&idx),
        };
        out.push(extract_file_with(&rel, &text, &opts).unwrap().extract);
    }
    out
}

#[test]
fn derive_repo_calls_engine_pipeline() {
    let extracts = extract_engine();
    let snap = derive_repo(
        ReviewInput {
            head_extracts: extracts,
            parent_extracts: None,
            hints: HintFile {
                flows: vec![FlowHint {
                    name: "review-derive".into(),
                    hits: vec![
                        "graphide_engine::review::derive_repo".into(),
                        "graphide_engine::link::link".into(),
                        "graphide_engine::steiner::steiner_tree".into(),
                    ],
                }],
            },
            head_sources: Default::default(),
            parent_sources: Default::default(),
            previous_bubbles: None,
        },
        &ReviewOptions {
            plugin: "rust@0.1.0".into(),
        },
    );
    assert!(
        snap.findings
            .iter()
            .all(|f| !matches!(f.kind, FindingKind::UnmatchedHint { .. })),
        "{:?}",
        snap.findings
    );
    let kinds: Vec<_> = snap.flows[0].tree.edges.iter().map(|e| e.kind).collect();
    assert!(kinds.contains(&EdgeKind::Calls), "{:?}", snap.flows[0].tree);
    assert!(snap.graph.nodes.len() > 20);
    assert!(snap.graph.edges.iter().any(|e| e.kind == EdgeKind::Calls));
}
