//! Language-agnostic extract: tree-sitter queries → Extract IR.
//! The engine hash-joins FQNs. This file only emits defs and same-file refs.

use crate::langs::Lang;
use graphide_ir::{EdgeKind, Extract, Finding, FindingKind, NodeDef, NodeKind, Pos, Ref, Span};
use graphide_plugin_rust::endpoint_meta;
use std::cell::RefCell;
use std::collections::HashMap;
use std::sync::OnceLock;
use thiserror::Error;
use tree_sitter::{Node, Parser, Query, QueryCursor, StreamingIterator};

#[derive(Debug, Error)]
pub enum PluginError {
    #[error("tree-sitter language init failed")]
    Language,
    #[error("parse failed for {0}")]
    Parse(String),
    #[error("extract query: {0}")]
    Query(String),
    #[error("parser re-entered on the same thread")]
    Reentered,
}

pub struct ExtractResult {
    pub extract: Extract,
    pub findings: Vec<Finding>,
}

fn cached_query(lang: &Lang) -> Result<&'static Query, PluginError> {
    static MAP: OnceLock<HashMap<&'static str, Query>> = OnceLock::new();
    let map = MAP.get_or_init(|| {
        let mut m = HashMap::new();
        for lang in crate::langs::ALL {
            if let Ok(q) = Query::new(&(lang.language)(), lang.queries) {
                m.insert(lang.id, q);
            }
        }
        m
    });
    map.get(lang.id)
        .ok_or_else(|| PluginError::Query(format!("no compiled query for {}", lang.id)))
}

thread_local! {
    static PARSERS: RefCell<HashMap<&'static str, Parser>> = RefCell::new(HashMap::new());
}

pub fn extract_with(
    lang: &Lang,
    repo_relative: &str,
    source: &str,
) -> Result<ExtractResult, PluginError> {
    let query = cached_query(lang)?;
    let tree = PARSERS.with(|slot| {
        let mut map = slot.try_borrow_mut().map_err(|_| PluginError::Reentered)?;
        if !map.contains_key(lang.id) {
            let mut parser = Parser::new();
            parser
                .set_language(&(lang.language)())
                .map_err(|_| PluginError::Language)?;
            map.insert(lang.id, parser);
        }
        map.get_mut(lang.id)
            .ok_or(PluginError::Language)?
            .parse(source, None)
            .ok_or_else(|| PluginError::Parse(repo_relative.to_string()))
    })?;
    let bytes = source.as_bytes();
    let file = normalize_path(repo_relative);
    let module_fqn = module_fqn_from_path(&file, lang.sep);

    let mut nodes = Vec::new();
    let mut refs = Vec::new();
    let mut findings = Vec::new();
    let mut imports: HashMap<String, String> = HashMap::new();
    let idx = |name: &str| query.capture_index_for_name(name);

    let mut cursor = QueryCursor::new();
    let mut matches = cursor.matches(&query, tree.root_node(), bytes);
    while let Some(m) = matches.next() {
        let cap = |name: &str| -> Option<Node> {
            let i = idx(name)?;
            m.captures.iter().find(|c| c.index == i).map(|c| c.node)
        };

        if let (Some(name), Some(def)) = (cap("type.name"), cap("type.def")) {
            push_node(
                &mut nodes,
                qualify(&module_fqn, lang.sep, &text_of(name, bytes)),
                NodeKind::Type,
                span_of(&file, def),
            );
        }

        if let (Some(name), Some(def)) = (cap("fn.name"), cap("fn.def")) {
            if cap("method.name").is_some() {
                continue;
            }
            push_node(
                &mut nodes,
                qualify(&module_fqn, lang.sep, &text_of(name, bytes)),
                NodeKind::Function,
                span_of(&file, def),
            );
        }

        if let (Some(method), Some(def)) = (cap("method.name"), cap("method.def")) {
            if cap("impl.type").is_none() && ancestor_kind(def, CLASS_KINDS) {
                continue;
            }
            let ty = cap("impl.type").map(|n| text_of(n, bytes));
            let fqn = match ty.as_deref() {
                Some(t) => format!(
                    "{}{}{}{}{}",
                    module_fqn,
                    lang.sep,
                    last_seg(t, lang.sep),
                    lang.sep,
                    text_of(method, bytes)
                ),
                None => qualify(&module_fqn, lang.sep, &text_of(method, bytes)),
            };
            if let Some(t) = ty.as_deref() {
                let tfqn = qualify(&module_fqn, lang.sep, last_seg(t, lang.sep));
                push_node(
                    &mut nodes,
                    tfqn.clone(),
                    NodeKind::Type,
                    span_of(&file, method),
                );
                refs.push(Ref {
                    from: tfqn,
                    to: Some(fqn.clone()),
                    kind: EdgeKind::Contains,
                    span: span_of(&file, method),
                });
            }
            push_node(&mut nodes, fqn, NodeKind::Function, span_of(&file, def));
        }

        if let Some(name) = cap("const.name") {
            let ty = cap("const.type")
                .map(|n| text_of(n, bytes))
                .unwrap_or_default();
            let def = cap("const.def").unwrap_or(name);
            if let Some(meta) = endpoint_meta(&text_of(name, bytes), &ty, &text_of(def, bytes)) {
                let fqn = qualify(&module_fqn, lang.sep, &text_of(name, bytes));
                if !nodes
                    .iter()
                    .any(|n| n.fqn == fqn && n.kind == NodeKind::Endpoint)
                {
                    nodes.push(NodeDef {
                        fqn,
                        kind: NodeKind::Endpoint,
                        span: span_of(&file, def),
                        endpoint: Some(meta),
                    });
                }
            }
        }

        if let Some(modn) = cap("import.mod") {
            let spec = text_of(modn, bytes);
            let name = cap("import.name")
                .map(|n| text_of(n, bytes))
                .unwrap_or_else(|| last_path_seg(&spec));
            if !name.is_empty() {
                imports.insert(name.clone(), import_target(&file, lang.sep, &spec, &name));
            }
        }
    }

    let mut seen = HashMap::new();
    let mut deduped = Vec::new();
    for n in nodes {
        let key = (n.kind, n.fqn.clone());
        if seen.insert(key.clone(), ()).is_some() {
            findings.push(Finding {
                kind: FindingKind::DuplicateFqn {
                    node_kind: key.0,
                    fqn: key.1,
                },
                span: Some(n.span.clone()),
            });
            continue;
        }
        deduped.push(n);
    }
    let nodes = deduped;

    let mut cursor = QueryCursor::new();
    let mut matches = cursor.matches(&query, tree.root_node(), bytes);
    while let Some(m) = matches.next() {
        let cap = |name: &str| -> Option<Node> {
            let i = idx(name)?;
            m.captures.iter().find(|c| c.index == i).map(|c| c.node)
        };
        if let (Some(name), Some(call)) = (cap("call.name"), cap("call")) {
            if let Some(from) = enclosing_fn(&nodes, call) {
                if let Some(to) = resolve_name(
                    &nodes,
                    &imports,
                    &module_fqn,
                    lang.sep,
                    &text_of(name, bytes),
                    NodeKind::Function,
                ) {
                    push_resolved(
                        &mut refs,
                        &nodes,
                        &imports,
                        from,
                        to,
                        EdgeKind::Calls,
                        NodeKind::Function,
                        span_of(&file, call),
                    );
                }
            }
        }
        if let Some(ty) = cap("ty.use") {
            if let Some(from) = enclosing_fn(&nodes, ty) {
                if let Some(to) = resolve_name(
                    &nodes,
                    &imports,
                    &module_fqn,
                    lang.sep,
                    &text_of(ty, bytes),
                    NodeKind::Type,
                ) {
                    push_resolved(
                        &mut refs,
                        &nodes,
                        &imports,
                        from,
                        to,
                        EdgeKind::TypeUses,
                        NodeKind::Type,
                        span_of(&file, ty),
                    );
                }
            }
        }
        if let Some(ident) = cap("ident") {
            if cap("fn.name").is_some()
                || cap("method.name").is_some()
                || cap("const.name").is_some()
                || cap("call.name").is_some()
                || cap("type.name").is_some()
                || cap("import.name").is_some()
                || cap("ty.use").is_some()
            {
                continue;
            }
            if let Some(from) = enclosing_fn(&nodes, ident) {
                emit_endpoint_ref(
                    &mut refs,
                    &nodes,
                    &imports,
                    from,
                    &text_of(ident, bytes),
                    span_of(&file, ident),
                    lang.sep,
                );
            }
        }
    }

    refs.retain(|r| r.to.as_deref() != Some(r.from.as_str()));
    dedup_refs(&mut refs);

    Ok(ExtractResult {
        extract: Extract {
            plugin: lang.id.into(),
            file,
            nodes,
            refs,
        },
        findings,
    })
}

fn push_node(nodes: &mut Vec<NodeDef>, fqn: String, kind: NodeKind, span: Span) {
    if nodes.iter().any(|n| n.fqn == fqn && n.kind == kind) {
        return;
    }
    nodes.push(NodeDef {
        fqn,
        kind,
        span,
        endpoint: None,
    });
}

fn qualify(module: &str, sep: &str, name: &str) -> String {
    let name = last_seg(name.trim(), sep);
    if module.is_empty() {
        name.to_string()
    } else {
        format!("{module}{sep}{name}")
    }
}

fn last_seg<'a>(name: &'a str, sep: &str) -> &'a str {
    name.rsplit(sep).next().unwrap_or(name)
}

fn resolve_name(
    nodes: &[NodeDef],
    imports: &HashMap<String, String>,
    module: &str,
    sep: &str,
    raw: &str,
    kind: NodeKind,
) -> Option<String> {
    let raw = last_seg(raw.trim(), sep);
    if raw.is_empty() {
        return None;
    }
    let candidates: Vec<_> = nodes
        .iter()
        .filter(|n| n.kind == kind)
        .filter(|n| n.fqn == raw || n.fqn.ends_with(&format!("{sep}{raw}")) || n.fqn.ends_with(raw))
        .map(|n| n.fqn.clone())
        .collect();
    if candidates.len() == 1 {
        return candidates.first().cloned();
    }
    let local = qualify(module, sep, raw);
    if nodes.iter().any(|n| n.fqn == local && n.kind == kind) {
        return Some(local);
    }
    imports.get(raw).cloned()
}

fn emit_endpoint_ref(
    refs: &mut Vec<Ref>,
    defs: &[NodeDef],
    imports: &HashMap<String, String>,
    from: String,
    name: &str,
    span: Span,
    sep: &str,
) {
    let short = last_seg(name.trim(), sep);
    let to = if let Some(resolved) = resolve_name(defs, imports, "", sep, short, NodeKind::Endpoint)
    {
        resolved
    } else {
        return;
    };
    let is_endpoint = defs
        .iter()
        .any(|d| d.fqn == to && d.kind == NodeKind::Endpoint)
        || short.contains("events")
        || to.ends_with("events")
        || imports.get(short).is_some_and(|s| s.contains("events"));
    if !is_endpoint {
        return;
    }
    let from_short = last_seg(&from, sep);
    let kind = if from_short.contains("publish") || from_short.contains("send") {
        EdgeKind::Publishes
    } else if from_short.contains("subscribe") || from_short.contains("recv") {
        EdgeKind::Subscribes
    } else {
        EdgeKind::Reads
    };
    push_resolved(
        refs,
        defs,
        imports,
        from,
        to,
        kind,
        NodeKind::Endpoint,
        span,
    );
}

fn push_resolved(
    refs: &mut Vec<Ref>,
    defs: &[NodeDef],
    imports: &HashMap<String, String>,
    from: String,
    to: String,
    kind: EdgeKind,
    expect: NodeKind,
    span: Span,
) {
    let via_import =
        imports.values().any(|v| v == &to) && !defs.iter().any(|d| d.fqn == to && d.kind == expect);
    refs.push(Ref {
        from: from.clone(),
        to: Some(to.clone()),
        kind,
        span: span.clone(),
    });
    if via_import {
        refs.push(Ref {
            from,
            to: Some(to),
            kind: EdgeKind::Imports,
            span,
        });
    }
}

fn strip_src_ext(p: &str) -> &str {
    let p = p.trim().trim_matches(['<', '>', '"', '\'', '`']);
    match p.rsplit_once('.') {
        Some((base, ext))
            if matches!(
                ext,
                "js" | "jsx"
                    | "mjs"
                    | "cjs"
                    | "ts"
                    | "tsx"
                    | "py"
                    | "go"
                    | "c"
                    | "h"
                    | "cc"
                    | "cpp"
                    | "cxx"
                    | "hpp"
                    | "hh"
                    | "hxx"
            ) =>
        {
            base
        }
        _ => p,
    }
}

fn last_path_seg(spec: &str) -> String {
    let spec = strip_src_ext(spec).trim_end_matches('/');
    spec.rsplit(['/', '.', ':'])
        .find(|s| !s.is_empty() && *s != "." && *s != "..")
        .unwrap_or("")
        .to_string()
}

fn import_target(file: &str, sep: &str, spec: &str, name: &str) -> String {
    let spec = strip_src_ext(spec);
    let module = if spec.starts_with('.') {
        let dir = file.rsplit_once('/').map(|(d, _)| d).unwrap_or("");
        let joined = if spec.starts_with("./") {
            format!("{dir}/{}", spec.trim_start_matches("./"))
        } else if spec == "." {
            dir.to_string()
        } else {
            let mut parts: Vec<&str> = dir.split('/').filter(|s| !s.is_empty()).collect();
            let mut rest = spec;
            while rest.starts_with("../") {
                if !parts.is_empty() {
                    parts.pop();
                }
                rest = rest.trim_start_matches("../");
            }
            rest = rest.trim_start_matches("./");
            if rest.is_empty() {
                parts.join("/")
            } else if parts.is_empty() {
                rest.to_string()
            } else {
                format!("{}/{rest}", parts.join("/"))
            }
        };
        module_fqn_from_path(&joined, sep)
    } else {
        spec.replace('/', sep)
    };
    if name == last_seg(&module, sep) {
        return if module.is_empty() {
            name.to_string()
        } else {
            module
        };
    }
    qualify(&module, sep, name)
}

const CLASS_KINDS: &[&str] = &["class_declaration", "class_definition", "class_specifier"];

fn ancestor_kind(mut node: Node, kinds: &[&str]) -> bool {
    while let Some(p) = node.parent() {
        if kinds.contains(&p.kind()) {
            return true;
        }
        node = p;
    }
    false
}

fn enclosing_fn(defs: &[NodeDef], node: Node) -> Option<String> {
    let line = node.start_position().row as u32 + 1;
    let col = node.start_position().column as u32 + 1;
    defs.iter()
        .filter(|d| d.kind == NodeKind::Function && span_contains(&d.span, line, col))
        .min_by_key(|d| span_area(&d.span))
        .map(|d| d.fqn.clone())
}

fn span_contains(span: &Span, line: u32, col: u32) -> bool {
    if line < span.start.line || line > span.end.line {
        return false;
    }
    if line == span.start.line && col < span.start.column {
        return false;
    }
    if line == span.end.line && col > span.end.column {
        return false;
    }
    true
}

fn span_area(span: &Span) -> u32 {
    let lines = span
        .end
        .line
        .saturating_sub(span.start.line)
        .saturating_add(1);
    lines.saturating_mul(80)
}

fn text_of(node: Node, src: &[u8]) -> String {
    node.utf8_text(src).unwrap_or("").to_string()
}

fn span_of(file: &str, node: Node) -> Span {
    let s = node.start_position();
    let e = node.end_position();
    Span {
        file: file.to_string(),
        start: Pos {
            line: s.row as u32 + 1,
            column: s.column as u32 + 1,
        },
        end: Pos {
            line: e.row as u32 + 1,
            column: e.column as u32 + 1,
        },
    }
}

fn normalize_path(p: &str) -> String {
    p.replace('\\', "/")
}

fn module_fqn_from_path(path: &str, sep: &str) -> String {
    let p = normalize_path(path);
    let p = p.strip_prefix("./").unwrap_or(&p);
    let p = p
        .strip_prefix("src/")
        .or_else(|| p.strip_prefix("lib/"))
        .or_else(|| p.strip_prefix("include/"))
        .unwrap_or(p);
    let p = match p.rfind('.') {
        Some(i) => &p[..i],
        None => p,
    };
    let p = p
        .strip_suffix("/mod")
        .or_else(|| p.strip_suffix("/__init__"))
        .or_else(|| p.strip_suffix("/index"))
        .or_else(|| p.strip_suffix("/main"))
        .unwrap_or(p);
    if p == "mod" || p == "main" || p == "__init__" || p == "index" || p.is_empty() {
        return String::new();
    }
    p.split('/')
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join(sep)
}

fn dedup_refs(refs: &mut Vec<Ref>) {
    let mut seen = HashMap::new();
    refs.retain(|r| {
        seen.insert((r.from.clone(), r.to.clone(), r.kind, r.span.clone()), ())
            .is_none()
    });
}
