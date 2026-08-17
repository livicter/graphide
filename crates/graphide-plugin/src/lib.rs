//! Deriver front door. A language exists when it has a plugin (SPEC §3).
//! Default shape: tree-sitter grammar + declarative extract queries.
//! Rust keeps the richer first-slice plugin; other languages share the query runner.

mod langs;
mod query;

pub use graphide_plugin_rust::{
    extract_file as extract_rust, ExtractResult as RustExtract, PLUGIN_ID as RUST_PLUGIN,
};
pub use langs::{for_extension, Lang, ALL as LANGUAGES};
pub use query::{extract_with, ExtractResult, PluginError};

use graphide_ir::Extract;

/// Extract one file. `None` if the extension has no installed plugin.
pub fn extract_file(
    repo_relative: &str,
    source: &str,
) -> Result<Option<ExtractResult>, PluginError> {
    let ext = repo_relative.rsplit('.').next().unwrap_or("");
    if ext.eq_ignore_ascii_case("rs") {
        let r =
            extract_rust(repo_relative, source).map_err(|e| PluginError::Query(e.to_string()))?;
        return Ok(Some(ExtractResult {
            extract: r.extract,
            findings: r.findings,
        }));
    }
    match langs::for_extension(ext) {
        Some(lang) => extract_with(lang, repo_relative, source).map(Some),
        None => Ok(None),
    }
}

pub fn plugin_ids_for(extracts: &[Extract]) -> String {
    let mut ids: Vec<_> = extracts.iter().map(|e| e.plugin.as_str()).collect();
    ids.sort_unstable();
    ids.dedup();
    if ids.is_empty() {
        "none".into()
    } else {
        ids.join(",")
    }
}

pub fn known_extensions() -> Vec<&'static str> {
    let mut exts = vec!["rs"];
    for lang in langs::ALL {
        exts.extend_from_slice(lang.extensions);
    }
    exts.sort_unstable();
    exts.dedup();
    exts
}

pub fn has_plugin(path: &str) -> bool {
    let ext = path
        .rsplit('.')
        .next()
        .unwrap_or("")
        .trim_start_matches('.');
    ext.eq_ignore_ascii_case("rs") || langs::for_extension(ext).is_some()
}
