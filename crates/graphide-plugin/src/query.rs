//! Language-agnostic extract: tree-sitter queries → Extract IR.
//! The engine hash-joins FQNs. This file only emits defs and same-file refs.

use crate::langs::Lang;
use graphide_ir::{EdgeKind, Extract, Finding, FindingKind, NodeDef, NodeKind, Pos, Ref, Span};
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
                    &module_fqn,
                    lang.sep,
                    &text_of(name, bytes),
                    NodeKind::Function,
                ) {
                    refs.push(Ref {
                        from,
                        to: Some(to),
                        kind: EdgeKind::Calls,
                        span: span_of(&file, call),
                    });
                }
            }
        }
        if let Some(ty) = cap("ty.use") {
            if let Some(from) = enclosing_fn(&nodes, ty) {
                if let Some(to) = resolve_name(
                    &nodes,
                    &module_fqn,
                    lang.sep,
                    &text_of(ty, bytes),
                    NodeKind::Type,
                ) {
                    refs.push(Ref {
                        from,
                        to: Some(to),
                        kind: EdgeKind::TypeUses,
                        span: span_of(&file, ty),
                    });
                }
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
    None
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
