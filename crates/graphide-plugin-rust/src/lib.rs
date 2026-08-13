//! Rust deriver plugin: tree-sitter extract -> Extract IR.
//! Plugin version string is trusted like a compiler.

mod queries;

use graphide_ir::{
    EdgeKind, EndChannel, EndRole, EndpointMeta, Extract, Finding, FindingKind, NodeDef,
    NodeKind, Pos, Ref, Span,
};
use std::collections::HashMap;
use thiserror::Error;
use tree_sitter::{Node, Parser};

pub const PLUGIN_ID: &str = "rust@0.1.0";

#[derive(Debug, Error)]
pub enum PluginError {
    #[error("tree-sitter language init failed")]
    Language,
    #[error("parse failed for {0}")]
    Parse(String),
}

pub struct ExtractResult {
    pub extract: Extract,
    pub findings: Vec<Finding>,
}

pub fn extract_file(repo_relative: &str, source: &str) -> Result<ExtractResult, PluginError> {
    let mut parser = Parser::new();
    let language = tree_sitter_rust::LANGUAGE;
    parser
        .set_language(&language.into())
        .map_err(|_| PluginError::Language)?;
    let tree = parser
        .parse(source, None)
        .ok_or_else(|| PluginError::Parse(repo_relative.to_string()))?;

    let mut findings = Vec::new();
    let mut nodes = Vec::new();
    let mut refs = Vec::new();
    let bytes = source.as_bytes();

    let module_fqn = module_fqn_from_path(repo_relative);
    walk_defs(
        tree.root_node(),
        bytes,
        repo_relative,
        &module_fqn,
        None,
        &mut nodes,
        &mut refs,
        &mut findings,
    );
    walk_refs(
        tree.root_node(),
        bytes,
        repo_relative,
        &nodes,
        &mut refs,
    );

    // Dedup duplicate (kind,fqn) as findings
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

    Ok(ExtractResult {
        extract: Extract {
            plugin: PLUGIN_ID.into(),
            file: normalize_path(repo_relative),
            nodes: deduped,
            refs,
        },
        findings,
    })
}

fn normalize_path(p: &str) -> String {
    p.replace('\\', "/")
}

fn module_fqn_from_path(path: &str) -> String {
    let p = normalize_path(path);
    let p = p.strip_prefix("./").unwrap_or(&p);
    // src/bus.rs -> crate::bus ; src/foo/mod.rs -> crate::foo ; src/foo/bar.rs -> crate::foo::bar
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

fn walk_defs(
    node: Node,
    bytes: &[u8],
    file: &str,
    module_fqn: &str,
    enclosing: Option<&str>,
    nodes: &mut Vec<NodeDef>,
    refs: &mut Vec<Ref>,
    findings: &mut Vec<Finding>,
) {
    let kind = node.kind();
    match kind {
        "function_item" => {
            if let Some(name) = child_named(node, "name") {
                let name_txt = text_of(name, bytes);
                let fqn = match enclosing {
                    Some(parent) => format!("{parent}::{name_txt}"),
                    None => format!("{module_fqn}::{name_txt}"),
                };
                nodes.push(NodeDef {
                    fqn: fqn.clone(),
                    kind: NodeKind::Function,
                    span: span_of(file, node),
                    endpoint: None,
                });
                if let Some(parent) = enclosing {
                    refs.push(Ref {
                        from: parent.to_string(),
                        to: Some(fqn.clone()),
                        kind: EdgeKind::Contains,
                        span: span_of(file, name),
                    });
                }
                // Recurse into body with this fn as enclosing for nested items (rare).
                let mut cursor = node.walk();
                for child in node.children(&mut cursor) {
                    walk_defs(child, bytes, file, module_fqn, Some(&fqn), nodes, refs, findings);
                }
                return;
            }
        }
        "impl_item" => {
            let type_name = node
                .child_by_field_name("type")
                .map(|n| text_of(n, bytes).to_string());
            let impl_fqn = type_name
                .as_deref()
                .map(|t| qualify_type(module_fqn, t))
                .unwrap_or_else(|| format!("{module_fqn}::_impl"));
            // Ensure type node exists if we can name it.
            if let Some(t) = type_name {
                let tfqn = qualify_type(module_fqn, &t);
                if !nodes.iter().any(|n| n.fqn == tfqn && n.kind == NodeKind::Type) {
                    if let Some(ty_node) = node.child_by_field_name("type") {
                        nodes.push(NodeDef {
                            fqn: tfqn.clone(),
                            kind: NodeKind::Type,
                            span: span_of(file, ty_node),
                            endpoint: None,
                        });
                    }
                }
                let _ = impl_fqn;
                let mut cursor = node.walk();
                for child in node.children(&mut cursor) {
                    if child.kind() == "declaration_list" {
                        let mut c2 = child.walk();
                        for m in child.children(&mut c2) {
                            if m.kind() == "function_item" {
                                if let Some(name) = child_named(m, "name") {
                                    let name_txt = text_of(name, bytes);
                                    let fqn = format!("{tfqn}::{name_txt}");
                                    nodes.push(NodeDef {
                                        fqn: fqn.clone(),
                                        kind: NodeKind::Function,
                                        span: span_of(file, m),
                                        endpoint: None,
                                    });
                                    refs.push(Ref {
                                        from: tfqn.clone(),
                                        to: Some(fqn),
                                        kind: EdgeKind::Contains,
                                        span: span_of(file, name),
                                    });
                                }
                            }
                        }
                    }
                }
                return;
            }
        }
        "struct_item" | "enum_item" | "trait_item" | "type_item" | "union_item" => {
            if let Some(name) = child_named(node, "name") {
                let name_txt = text_of(name, bytes);
                let fqn = format!("{module_fqn}::{name_txt}");
                nodes.push(NodeDef {
                    fqn,
                    kind: NodeKind::Type,
                    span: span_of(file, node),
                    endpoint: None,
                });
            }
        }
        "let_declaration" => {
            // Heuristic endpoints: let x = ...channel... / broadcast / mpsc
            if let Some(endpoint) = detect_endpoint_let(node, bytes, file, module_fqn) {
                let fqn = endpoint.0.clone();
                let sp = endpoint.1.clone();
                nodes.push(NodeDef {
                    fqn: fqn.clone(),
                    kind: NodeKind::Endpoint,
                    span: sp.clone(),
                    endpoint: Some(endpoint.2),
                });
                if let Some(parent) = enclosing {
                    refs.push(Ref {
                        from: parent.to_string(),
                        to: Some(fqn),
                        kind: EdgeKind::Contains,
                        span: sp,
                    });
                }
            }
        }
        "const_item" | "static_item" => {
            if let Some(endpoint) = detect_endpoint_const(node, bytes, file, module_fqn) {
                nodes.push(NodeDef {
                    fqn: endpoint.0,
                    kind: NodeKind::Endpoint,
                    span: endpoint.1,
                    endpoint: Some(endpoint.2),
                });
            }
        }
        _ => {}
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        walk_defs(child, bytes, file, module_fqn, enclosing, nodes, refs, findings);
    }
}

fn qualify_type(module_fqn: &str, ty: &str) -> String {
    let ty = ty.trim();
    if ty.starts_with("crate::") || ty.contains("::") {
        // simple path — take last ident for local types written as Bus
        if !ty.contains("::") {
            return format!("{module_fqn}::{ty}");
        }
        if ty.starts_with("crate::") {
            return ty.to_string();
        }
    }
    // Strip generics: Bus<T> -> Bus
    let base = ty.split('<').next().unwrap_or(ty).trim();
    let base = base.split("::").last().unwrap_or(base);
    format!("{module_fqn}::{base}")
}

fn detect_endpoint_let(
    node: Node,
    bytes: &[u8],
    file: &str,
    module_fqn: &str,
) -> Option<(String, Span, EndpointMeta)> {
    let txt = text_of(node, bytes);
    let lower = txt.to_ascii_lowercase();
    let channel = if lower.contains("broadcast") || lower.contains("channel") || lower.contains("mpsc") {
        Some(EndChannel::Channel)
    } else if lower.contains("file") || txt.contains("OpenOptions") {
        Some(EndChannel::File)
    } else if lower.contains("http") || txt.contains("Router") || lower.contains("axum") {
        Some(EndChannel::Http)
    } else {
        None
    }?;
    let name = child_named(node, "pattern")
        .map(|n| text_of(n, bytes).trim().to_string())
        .filter(|s| !s.is_empty())?;
    // Skip tuple patterns etc.
    if !name.chars().all(|c| c.is_alphanumeric() || c == '_') {
        return None;
    }
    let role = if name.contains("tx") || name.contains("pub") || txt.contains("sender") {
        EndRole::Sink
    } else if name.contains("rx") || name.contains("sub") || txt.contains("receiver") {
        EndRole::Source
    } else {
        EndRole::Sink
    };
    Some((
        format!("{module_fqn}::{name}"),
        span_of(file, node),
        EndpointMeta { role, channel },
    ))
}

fn detect_endpoint_const(
    node: Node,
    bytes: &[u8],
    file: &str,
    module_fqn: &str,
) -> Option<(String, Span, EndpointMeta)> {
    let txt = text_of(node, bytes);
    let lower = txt.to_ascii_lowercase();
    if !(lower.contains("channel") || lower.contains("broadcast") || lower.contains("queue") || lower.contains("topic")) {
        return None;
    }
    let name = child_named(node, "name").map(|n| text_of(n, bytes).to_string())?;
    Some((
        format!("{module_fqn}::{name}"),
        span_of(file, node),
        EndpointMeta {
            role: EndRole::Sink,
            channel: EndChannel::Channel,
        },
    ))
}

fn walk_refs(node: Node, bytes: &[u8], file: &str, defs: &[NodeDef], refs: &mut Vec<Ref>) {
    let mut imports: HashMap<String, String> = HashMap::new();
    collect_imports(node, bytes, &mut imports);

    let by_short: HashMap<String, Vec<&NodeDef>> = {
        let mut m: HashMap<String, Vec<&NodeDef>> = HashMap::new();
        for d in defs {
            let short = d.fqn.split("::").last().unwrap_or(&d.fqn).to_string();
            m.entry(short).or_default().push(d);
        }
        m
    };

    walk_refs_with_stack(node, bytes, file, defs, &by_short, &imports, None, refs);
    refs.retain(|r| r.to.as_deref() != Some(r.from.as_str()));
}

fn collect_imports(node: Node, bytes: &[u8], imports: &mut HashMap<String, String>) {
    if node.kind() == "use_declaration" {
        let txt = text_of(node, bytes);
        // very small parser: use crate::bus::Bus; / use crate::bus::{Bus, events};
        let cleaned = txt
            .trim()
            .trim_start_matches("pub")
            .trim()
            .trim_start_matches("use")
            .trim()
            .trim_end_matches(';')
            .trim();
        if let Some((prefix, brace)) = cleaned.split_once('{') {
            let prefix = prefix.trim().trim_end_matches(':').trim_end_matches(':').trim();
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
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        collect_imports(child, bytes, imports);
    }
}

fn resolve_name(
    name: &str,
    _defs: &[NodeDef],
    by_short: &HashMap<String, Vec<&NodeDef>>,
    imports: &HashMap<String, String>,
    prefer: Option<NodeKind>,
) -> Option<String> {
    if name.starts_with("crate::") {
        return Some(name.to_string());
    }
    let short = name.split("::").last().unwrap_or(name);
    if let Some(targets) = by_short.get(short) {
        if let Some(pref) = prefer {
            if let Some(t) = targets.iter().find(|d| d.kind == pref) {
                return Some(t.fqn.clone());
            }
        }
        return Some(targets[0].fqn.clone());
    }
    imports.get(short).cloned()
}

fn walk_refs_with_stack(
    node: Node,
    bytes: &[u8],
    file: &str,
    defs: &[NodeDef],
    by_short: &HashMap<String, Vec<&NodeDef>>,
    imports: &HashMap<String, String>,
    enclosing: Option<String>,
    refs: &mut Vec<Ref>,
) {
    let mut next_enclosing = enclosing.clone();
    if node.kind() == "function_item" {
        if let Some(name) = child_named(node, "name") {
            let name_txt = text_of(name, bytes);
            let sp = span_of(file, node);
            if let Some(exact) = defs
                .iter()
                .find(|d| d.kind == NodeKind::Function && d.span == sp)
            {
                next_enclosing = Some(exact.fqn.clone());
            } else if let Some(d) = defs.iter().find(|d| {
                d.kind == NodeKind::Function && d.fqn.ends_with(&format!("::{name_txt}"))
            }) {
                next_enclosing = Some(d.fqn.clone());
            }
        }
    }

    match node.kind() {
        "call_expression" => {
            if let Some(from) = next_enclosing.clone() {
                let callee = node.child_by_field_name("function").unwrap_or(node);
                let callee_txt = text_of(callee, bytes);
                let short = callee_txt
                    .split("::")
                    .last()
                    .unwrap_or(callee_txt)
                    .split('.')
                    .last()
                    .unwrap_or(callee_txt)
                    .trim();
                if let Some(to) =
                    resolve_name(short, defs, by_short, imports, Some(NodeKind::Function))
                {
                    let kind = if short.contains("publish") || short == "send" {
                        EdgeKind::Publishes
                    } else if short.contains("subscribe") || short == "recv" {
                        EdgeKind::Subscribes
                    } else {
                        EdgeKind::Calls
                    };
                    refs.push(Ref {
                        from,
                        to: Some(to),
                        kind,
                        span: span_of(file, node),
                    });
                }
            }
        }
        "type_identity" | "scoped_type_identifier" | "type_identifier" => {
            if let Some(from) = next_enclosing.clone() {
                let name = text_of(node, bytes);
                if let Some(to) =
                    resolve_name(name, defs, by_short, imports, Some(NodeKind::Type))
                {
                    refs.push(Ref {
                        from,
                        to: Some(to),
                        kind: EdgeKind::TypeUses,
                        span: span_of(file, node),
                    });
                }
            }
        }
        "identifier" | "scoped_identifier" => {
            if let Some(from) = next_enclosing.clone() {
                let name = text_of(node, bytes);
                // Skip the function's own name ident
                if from.ends_with(&format!("::{name}")) || from.rsplit("::").next() == Some(name) {
                    // still allow endpoint/type refs with same short name rarely
                }
                if let Some(to) =
                    resolve_name(name, defs, by_short, imports, Some(NodeKind::Endpoint))
                {
                    // Only emit if it looks like endpoint path or imported/known endpoint
                    let is_ep = defs.iter().any(|d| d.fqn == to && d.kind == NodeKind::Endpoint)
                        || name.contains("events")
                        || imports
                            .get(name.split("::").last().unwrap_or(name))
                            .is_some_and(|f| f.contains("events"))
                        || name.starts_with("crate::") && name.contains("events");
                    let short = name.split("::").last().unwrap_or(name);
                    let imported_ep = imports.get(short).map(|s| s.as_str());
                    let looks_endpoint = is_ep
                        || imported_ep.is_some_and(|s| s.ends_with("::events") || s.contains("events"))
                        || to.ends_with("::events")
                        || name.ends_with("::events");
                    if looks_endpoint || to.contains("events") {
                        let kind = if from.contains("publish") || from.contains("send") {
                            EdgeKind::Publishes
                        } else if from.contains("subscribe") || from.contains("recv") {
                            EdgeKind::Subscribes
                        } else {
                            EdgeKind::Reads
                        };
                        refs.push(Ref {
                            from,
                            to: Some(if name.starts_with("crate::") {
                                name.to_string()
                            } else {
                                to
                            }),
                            kind,
                            span: span_of(file, node),
                        });
                    }
                } else if name.starts_with("crate::") {
                    let kind = if from.contains("publish") || from.contains("send") {
                        EdgeKind::Publishes
                    } else if from.contains("subscribe") || from.contains("recv") {
                        EdgeKind::Subscribes
                    } else {
                        EdgeKind::Reads
                    };
                    refs.push(Ref {
                        from,
                        to: Some(name.to_string()),
                        kind,
                        span: span_of(file, node),
                    });
                }
            }
        }
        "field_expression" => {
            if let Some(from) = next_enclosing.clone() {
                if let Some(field) = node.child_by_field_name("field").map(|n| text_of(n, bytes)) {
                    if let Some(to) =
                        resolve_name(field, defs, by_short, imports, Some(NodeKind::Endpoint))
                    {
                        refs.push(Ref {
                            from,
                            to: Some(to),
                            kind: EdgeKind::Publishes,
                            span: span_of(file, node),
                        });
                    }
                }
            }
        }
        "use_declaration" => {
            // Imports edge optional; skip to reduce noise for first slice.
        }
        _ => {}
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        walk_refs_with_stack(
            child,
            bytes,
            file,
            defs,
            by_short,
            imports,
            next_enclosing.clone(),
            refs,
        );
    }
}


fn child_named<'a>(node: Node<'a>, field: &str) -> Option<Node<'a>> {
    node.child_by_field_name(field)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_fn_and_struct() {
        let src = r#"
pub struct Bus;
impl Bus {
    pub fn publish(&self) {}
}
pub fn subscribe() {}
"#;
        let r = extract_file("src/lib.rs", src).unwrap();
        assert!(r.extract.nodes.iter().any(|n| n.fqn.contains("Bus") && n.kind == NodeKind::Type));
        assert!(r.extract.nodes.iter().any(|n| n.kind == NodeKind::Function));
    }
}
