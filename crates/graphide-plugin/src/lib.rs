//! Deriver front door. A language exists when it has a plugin (SPEC §3).
//! Default shape: tree-sitter grammar + declarative extract queries.
//! Rust keeps the richer first-slice plugin; other languages share the query runner
//! and now emit TypeUses the same way (same-file type names, plus an import map
//! like the Rust plugin, so `from pkg import T` / `import { T }` resolve).

#![cfg_attr(
    not(test),
    deny(
        clippy::unwrap_used,
        clippy::expect_used,
        clippy::panic,
        clippy::todo,
        clippy::unimplemented
    )
)]

mod langs;
mod query;

pub use graphide_plugin_rust::{
    extract_file as extract_rust, ExtractResult as RustExtract, PluginError as RustPluginError,
    PLUGIN_ID as RUST_PLUGIN,
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
        let r = extract_rust(repo_relative, source).map_err(|e| match e {
            RustPluginError::Language => PluginError::Language,
            RustPluginError::Parse(f) => PluginError::Parse(f),
            RustPluginError::Reentered => PluginError::Reentered,
            other => PluginError::Query(other.to_string()),
        })?;
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

/// Compiled-in derivers: rust plus the query-plugin languages.
pub fn plugin_manifest() -> Vec<(&'static str, &'static [&'static str])> {
    let mut out = Vec::with_capacity(1 + langs::ALL.len());
    out.push((RUST_PLUGIN, &["rs"] as &'static [&'static str]));
    for lang in langs::ALL {
        out.push((lang.id, lang.extensions));
    }
    out
}

/// Tiny snippets the installer runs so a missing grammar fails before Review.
pub fn smoke_plugins() -> Result<Vec<(String, usize)>, PluginError> {
    const SAMPLES: &[(&str, &str)] = &[
        (
            "src/lib.rs",
            "pub fn helper() {}\npub fn subscribe() { helper(); }\n",
        ),
        (
            "a.py",
            "def helper():\n    return 1\n\ndef subscribe():\n    helper()\n",
        ),
        (
            "a.js",
            "function helper() { return 1; }\nfunction subscribe() { helper(); }\n",
        ),
        (
            "a.ts",
            "function helper(): number { return 1; }\nfunction subscribe(): number { return helper(); }\n",
        ),
        (
            "a.go",
            "package p\nfunc helper() int { return 1 }\nfunc Subscribe() int { return helper() }\n",
        ),
        (
            "a.c",
            "int helper(void) { return 1; }\nint subscribe(void) { return helper(); }\n",
        ),
        (
            "a.cpp",
            "int helper() { return 1; }\nint subscribe() { return helper(); }\n",
        ),
    ];
    let mut out = Vec::new();
    for (file, src) in SAMPLES {
        let some = extract_file(file, src)?;
        let r = some.ok_or_else(|| PluginError::Query(format!("no plugin for {file}")))?;
        if r.extract.nodes.is_empty() {
            return Err(PluginError::Query(format!(
                "{file}: plugin returned no nodes"
            )));
        }
        out.push((r.extract.plugin.clone(), r.extract.nodes.len()));
    }
    Ok(out)
}
