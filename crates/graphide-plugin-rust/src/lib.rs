//! Rust deriver plugin: tree-sitter queries -> Extract IR.
//! Trusted like a compiler. FQN scheme is crate::path::Item[::method].

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

mod queries;

use graphide_ir::{
    EdgeKind, EndChannel, EndRole, EndpointMeta, Extract, Finding, FindingKind, NodeDef, NodeKind,
    Pos, Ref, Span,
};
use queries::EXTRACT_QUERIES;
use std::cell::RefCell;
use std::collections::HashMap;
use std::sync::OnceLock;
use thiserror::Error;
use tree_sitter::{Node, Parser, Query, QueryCursor, StreamingIterator};

pub const PLUGIN_ID: &str = "rust@0.1.0";

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

fn rust_query() -> Result<&'static Query, PluginError> {
    static Q: OnceLock<Query> = OnceLock::new();
    if let Some(q) = Q.get() {
        return Ok(q);
    }
    let language = tree_sitter_rust::LANGUAGE.into();
    let compiled =
        Query::new(&language, EXTRACT_QUERIES).map_err(|e| PluginError::Query(e.to_string()))?;
    Ok(Q.get_or_init(|| compiled))
}

thread_local! {
    static PARSER: RefCell<Option<Parser>> = const { RefCell::new(None) };
}

pub fn extract_file(repo_relative: &str, source: &str) -> Result<ExtractResult, PluginError> {
    let query = rust_query()?;
    let tree = PARSER.with(|slot| {
        let mut cell = slot.try_borrow_mut().map_err(|_| PluginError::Reentered)?;
        if cell.is_none() {
            let mut parser = Parser::new();
            let language = tree_sitter_rust::LANGUAGE.into();
            parser
                .set_language(&language)
                .map_err(|_| PluginError::Language)?;
            *cell = Some(parser);
        }
        cell.as_mut()
            .ok_or(PluginError::Language)?
            .parse(source, None)
            .ok_or_else(|| PluginError::Parse(repo_relative.to_string()))
    })?;
    let mut cursor = QueryCursor::new();
    let bytes = source.as_bytes();
    let file = normalize_path(repo_relative);
    let module_fqn = module_fqn_from_path(&file);

    let mut nodes = Vec::new();
    let mut refs = Vec::new();
    let mut findings = Vec::new();
    let mut imports: HashMap<String, String> = HashMap::new();

    let idx = |name: &str| query.capture_index_for_name(name);

    let mut matches = cursor.matches(&query, tree.root_node(), bytes);
    while let Some(m) = matches.next() {
        let cap = |name: &str| -> Option<Node> {
            let i = idx(name)?;
            m.captures.iter().find(|c| c.index == i).map(|c| c.node)
        };

        if let Some(use_node) = cap("use") {
            collect_use(text_of(use_node, bytes), &mut imports);
        }

        if let (Some(name), Some(def)) = (cap("type.name"), cap("type.def")) {
            let fqn = format!("{module_fqn}::{}", text_of(name, bytes));
            push_type(&mut nodes, fqn, span_of(&file, def));
        }

        if let (Some(name), Some(def)) = (cap("fn.name"), cap("fn.def")) {
            if ancestor_kind(def, "impl_item") {
                continue;
            }
            let fqn = format!("{module_fqn}::{}", text_of(name, bytes));
            nodes.push(NodeDef {
                fqn,
                kind: NodeKind::Function,
                span: span_of(&file, def),
                endpoint: None,
            });
        }

        if let (Some(ty), Some(method), Some(def)) =
            (cap("impl.type"), cap("method.name"), cap("method.def"))
        {
            let tfqn = qualify_type(&module_fqn, text_of(ty, bytes));
            if !nodes
                .iter()
                .any(|n| n.fqn == tfqn && n.kind == NodeKind::Type)
            {
                push_type(&mut nodes, tfqn.clone(), span_of(&file, ty));
            }
            let fqn = format!("{tfqn}::{}", text_of(method, bytes));
            nodes.push(NodeDef {
                fqn: fqn.clone(),
                kind: NodeKind::Function,
                span: span_of(&file, def),
                endpoint: None,
            });
            refs.push(Ref {
                from: tfqn,
                to: Some(fqn),
                kind: EdgeKind::Contains,
                span: span_of(&file, method),
            });
        }

        if let (Some(name), Some(ty), Some(def)) =
            (cap("const.name"), cap("const.type"), cap("const.def"))
        {
            if let Some(meta) = endpoint_meta(
                text_of(name, bytes),
                text_of(ty, bytes),
                text_of(def, bytes),
            ) {
                nodes.push(NodeDef {
                    fqn: format!("{module_fqn}::{}", text_of(name, bytes)),
                    kind: NodeKind::Endpoint,
                    span: span_of(&file, def),
                    endpoint: Some(meta),
                });
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
                emit_call(
                    &mut refs,
                    &nodes,
                    &imports,
                    from,
                    text_of(name, bytes),
                    span_of(&file, call),
                );
            }
        }

        if let Some(ty) = cap("ty.use") {
            if ancestor_kind(ty, "scoped_type_identifier") && ty.kind() == "type_identifier" {
                continue;
            }
            if let Some(from) = enclosing_fn(&nodes, ty) {
                emit_type_use(
                    &mut refs,
                    &nodes,
                    &imports,
                    from,
                    text_of(ty, bytes),
                    span_of(&file, ty),
                );
            }
        }

        if let Some(ident) = cap("ident").or_else(|| cap("path")) {
            if cap("fn.name").is_some()
                || cap("method.name").is_some()
                || cap("const.name").is_some()
            {
                continue;
            }
            if cap("call.name").is_some() {
                continue;
            }
            if ident.kind() == "identifier"
                && (ancestor_kind(ident, "scoped_identifier")
                    || ancestor_kind(ident, "scoped_type_identifier"))
            {
                continue;
            }
            if let Some(from) = enclosing_fn(&nodes, ident) {
                emit_endpoint_ref(
                    &mut refs,
                    &nodes,
                    &imports,
                    from,
                    text_of(ident, bytes),
                    span_of(&file, ident),
                );
            }
        }
    }

    refs.retain(|r| r.to.as_deref() != Some(r.from.as_str()));
    dedup_refs(&mut refs);

    Ok(ExtractResult {
        extract: Extract {
            plugin: PLUGIN_ID.into(),
            file,
            nodes,
            refs,
        },
        findings,
    })
}

fn qualify_type(module_fqn: &str, ty: &str) -> String {
    let ty = ty.trim();
    if ty.starts_with("crate::") {
        return ty.split('<').next().unwrap_or(ty).trim().to_string();
    }
    let base = ty.split('<').next().unwrap_or(ty).trim();
    let base = base.split("::").last().unwrap_or(base);
    format!("{module_fqn}::{base}")
}

fn push_type(nodes: &mut Vec<NodeDef>, fqn: String, span: Span) {
    if nodes
        .iter()
        .any(|n| n.fqn == fqn && n.kind == NodeKind::Type)
    {
        return;
    }
    nodes.push(NodeDef {
        fqn,
        kind: NodeKind::Type,
        span,
        endpoint: None,
    });
}

fn enclosing_fn(defs: &[NodeDef], node: Node) -> Option<String> {
    let mut cur = Some(node);
    while let Some(n) = cur {
        if n.kind() == "function_item" {
            let start = n.start_position();
            let end = n.end_position();
            return defs
                .iter()
                .find(|d| {
                    d.kind == NodeKind::Function
                        && d.span.start.line == start.row as u32 + 1
                        && d.span.start.column == start.column as u32 + 1
                        && d.span.end.line == end.row as u32 + 1
                        && d.span.end.column == end.column as u32 + 1
                })
                .map(|d| d.fqn.clone());
        }
        cur = n.parent();
    }
    None
}

fn emit_call(
    refs: &mut Vec<Ref>,
    defs: &[NodeDef],
    imports: &HashMap<String, String>,
    from: String,
    callee: &str,
    span: Span,
) {
    let short = callee.split("::").last().unwrap_or(callee).trim();
    let Some(to) = resolve_name(short, defs, imports, Some(NodeKind::Function)) else {
        return;
    };
    push_resolved(
        refs,
        defs,
        imports,
        from,
        to,
        EdgeKind::Calls,
        Some(NodeKind::Function),
        span,
    );
}

fn emit_type_use(
    refs: &mut Vec<Ref>,
    defs: &[NodeDef],
    imports: &HashMap<String, String>,
    from: String,
    name: &str,
    span: Span,
) {
    let Some(to) = resolve_name(name, defs, imports, Some(NodeKind::Type)) else {
        return;
    };
    if defs.iter().any(|d| d.fqn == to && d.kind == NodeKind::Type)
        || imports.values().any(|v| v == &to)
    {
        push_resolved(
            refs,
            defs,
            imports,
            from,
            to,
            EdgeKind::TypeUses,
            Some(NodeKind::Type),
            span,
        );
    }
}

fn emit_endpoint_ref(
    refs: &mut Vec<Ref>,
    defs: &[NodeDef],
    imports: &HashMap<String, String>,
    from: String,
    name: &str,
    span: Span,
) {
    let to = if name.starts_with("crate::") {
        name.to_string()
    } else if let Some(resolved) = resolve_name(name, defs, imports, Some(NodeKind::Endpoint)) {
        resolved
    } else {
        return;
    };
    let is_endpoint = defs
        .iter()
        .any(|d| d.fqn == to && d.kind == NodeKind::Endpoint)
        || name.contains("events")
        || to.ends_with("::events")
        || imports
            .get(name.split("::").last().unwrap_or(name))
            .is_some_and(|s| s.contains("events"));
    if !is_endpoint {
        return;
    }
    let from_short = from.rsplit("::").next().unwrap_or(&from);
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
        Some(NodeKind::Endpoint),
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
    expect: Option<NodeKind>,
    span: Span,
) {
    let local = expect.is_some_and(|k| defs.iter().any(|d| d.fqn == to && d.kind == k));
    let via_import = imports.values().any(|v| v == &to) && !local;
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

fn resolve_name(
    name: &str,
    defs: &[NodeDef],
    imports: &HashMap<String, String>,
    prefer: Option<NodeKind>,
) -> Option<String> {
    if name.starts_with("crate::") {
        return Some(name.to_string());
    }
    let short = name.split("::").last().unwrap_or(name);
    let mut hits: Vec<&NodeDef> = defs
        .iter()
        .filter(|d| d.fqn.rsplit("::").next() == Some(short))
        .collect();
    if let Some(pref) = prefer {
        if let Some(t) = hits.iter().find(|d| d.kind == pref) {
            return Some(t.fqn.clone());
        }
        hits.retain(|d| d.kind == pref);
    }
    if let Some(d) = hits.first() {
        return Some(d.fqn.clone());
    }
    imports.get(short).cloned()
}

pub fn endpoint_meta(name: &str, ty: &str, whole: &str) -> Option<EndpointMeta> {
    let blob = format!("{name} {ty} {whole}").to_ascii_lowercase();
    let channel = if blob.contains("broadcast") || blob.contains("channel") || blob.contains("mpsc")
    {
        EndChannel::Channel
    } else if blob.contains("queue") || blob.contains("topic") {
        EndChannel::Queue
    } else if blob.contains("file") || whole.contains("OpenOptions") {
        EndChannel::File
    } else if blob.contains("http") || whole.contains("Router") || blob.contains("axum") {
        EndChannel::Http
    } else {
        return None;
    };
    let role = if name.contains("tx") || name.contains("pub") || blob.contains("sender") {
        EndRole::Sink
    } else if name.contains("rx") || name.contains("sub") || blob.contains("receiver") {
        EndRole::Source
    } else {
        EndRole::Sink
    };
    Some(EndpointMeta { role, channel })
}

fn collect_use(txt: &str, imports: &mut HashMap<String, String>) {
    let cleaned = txt
        .trim()
        .trim_start_matches("pub")
        .trim()
        .trim_start_matches("use")
        .trim()
        .trim_end_matches(';')
        .trim();
    if let Some((prefix, brace)) = cleaned.split_once('{') {
        let prefix = prefix.trim().trim_end_matches(':').trim();
        let inner = brace.trim_end_matches('}');
        for part in inner.split(',') {
            let name = part.trim();
            if name.is_empty() {
                continue;
            }
            let short = name.split(" as ").next().unwrap_or(name).trim();
            imports.insert(short.to_string(), format!("{prefix}::{short}"));
        }
    } else {
        let path = cleaned.split(" as ").next().unwrap_or(cleaned).trim();
        if let Some(short) = path.split("::").last() {
            imports.insert(short.to_string(), path.to_string());
        }
    }
}

fn ancestor_kind(mut node: Node, kind: &str) -> bool {
    while let Some(p) = node.parent() {
        if p.kind() == kind {
            return true;
        }
        node = p;
    }
    false
}

fn dedup_refs(refs: &mut Vec<Ref>) {
    let mut seen = std::collections::HashSet::new();
    refs.retain(|r| {
        seen.insert((
            r.from.clone(),
            r.to.clone(),
            r.kind,
            r.span.start.line,
            r.span.start.column,
        ))
    });
}

fn normalize_path(p: &str) -> String {
    p.replace('\\', "/")
}

fn module_fqn_from_path(path: &str) -> String {
    let p = normalize_path(path);
    let p = p.strip_prefix("./").unwrap_or(&p);
    let p = p.strip_prefix("src/").unwrap_or(p);
    let p = p.strip_suffix(".rs").unwrap_or(p);
    if p == "lib" || p == "main" {
        return "crate".into();
    }
    let p = p.strip_suffix("/mod").unwrap_or(p);
    let parts: Vec<_> = p.split('/').filter(|s| !s.is_empty()).collect();
    if parts.is_empty() {
        "crate".into()
    } else {
        format!("crate::{}", parts.join("::"))
    }
}

fn span_of(file: &str, node: Node) -> Span {
    let s = node.start_position();
    let e = node.end_position();
    Span {
        file: normalize_path(file),
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

fn text_of<'a>(node: Node<'a>, bytes: &'a [u8]) -> &'a str {
    node.utf8_text(bytes).unwrap_or("")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_ir_md_shape() {
        let bus = r#"
pub struct Bus;

impl Bus {
    pub fn publish(&self) {
        let _ = crate::bus::events;
    }
}

pub const events: BroadcastChannel = BroadcastChannel;

pub struct BroadcastChannel;
"#;
        let r = extract_file("src/bus.rs", bus).unwrap();
        assert!(r
            .extract
            .nodes
            .iter()
            .any(|n| n.fqn == "crate::bus::Bus" && n.kind == NodeKind::Type));
        assert!(r
            .extract
            .nodes
            .iter()
            .any(|n| n.fqn == "crate::bus::Bus::publish" && n.kind == NodeKind::Function));
        assert!(r.extract.nodes.iter().any(|n| {
            n.fqn == "crate::bus::events"
                && n.kind == NodeKind::Endpoint
                && n.endpoint.as_ref().is_some_and(|e| e.role == EndRole::Sink)
        }));
        assert!(r.extract.refs.iter().any(|e| {
            e.from == "crate::bus::Bus"
                && e.to.as_deref() == Some("crate::bus::Bus::publish")
                && e.kind == EdgeKind::Contains
        }));
        assert!(r.extract.refs.iter().any(|e| {
            e.from == "crate::bus::Bus::publish"
                && e.to.as_deref() == Some("crate::bus::events")
                && e.kind == EdgeKind::Publishes
        }));
        assert!(!r.extract.refs.iter().any(|e| {
            e.from == "crate::bus::Bus::publish"
                && e.kind == EdgeKind::Calls
                && e.to.as_deref() == Some("crate::bus::events")
        }));
    }

    #[test]
    fn subscribe_typeuses_and_subscribes() {
        let src = r#"
use crate::bus::Bus;

pub fn subscribe(_bus: Bus) {
    let _ = crate::bus::events;
}
"#;
        let r = extract_file("src/sub.rs", src).unwrap();
        assert!(r
            .extract
            .nodes
            .iter()
            .any(|n| n.fqn == "crate::sub::subscribe"));
        assert!(r.extract.refs.iter().any(|e| {
            e.from == "crate::sub::subscribe"
                && e.to.as_deref() == Some("crate::bus::events")
                && e.kind == EdgeKind::Subscribes
        }));
        assert!(r.extract.refs.iter().any(|e| {
            e.from == "crate::sub::subscribe"
                && e.to.as_deref() == Some("crate::bus::Bus")
                && e.kind == EdgeKind::TypeUses
        }));
        assert!(r.extract.refs.iter().any(|e| {
            e.from == "crate::sub::subscribe"
                && e.to.as_deref() == Some("crate::bus::Bus")
                && e.kind == EdgeKind::Imports
        }));
    }

    #[test]
    fn query_compiles() {
        let language = tree_sitter_rust::LANGUAGE.into();
        Query::new(&language, EXTRACT_QUERIES).expect("query must compile");
    }

    #[test]
    fn extract_junk_is_result_not_panic() {
        for src in ["", "fn", "fn {{{", "😊 pub fn x() {}", "use", "impl"] {
            let caught = std::panic::catch_unwind(|| extract_file("src/x.rs", src));
            assert!(caught.is_ok(), "panicked on {src:?}");
            assert!(
                caught.is_ok(),
                "extract {src:?} panicked instead of returning a Result"
            );
        }
    }
}
