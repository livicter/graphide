//! Rust deriver plugin: tree-sitter queries -> Extract IR.
//! FQN scheme: `{package}::{modules}::{Item}[::{method}]`.
//! `crate::` in source is rewritten to the package name when it is not `"crate"`.

mod index;
mod queries;

pub use index::{rewrite_crate_prefix, SymbolIndex};

use graphide_ir::{
    EdgeKind, EndChannel, EndRole, EndpointMeta, Extract, Finding, FindingKind, NodeDef, NodeKind,
    Pos, Ref, Span,
};
use index::rewrite_crate_prefix as rewrite;
use queries::EXTRACT_QUERIES;
use std::collections::HashMap;
use std::sync::OnceLock;
use thiserror::Error;
use tree_sitter::{Language, Node, Parser, Query, QueryCursor, StreamingIterator};

pub const PLUGIN_ID: &str = "rust@0.1.0";

#[derive(Debug, Error)]
pub enum PluginError {
    #[error("tree-sitter language init failed")]
    Language,
    #[error("parse failed for {0}")]
    Parse(String),
    #[error("extract query: {0}")]
    Query(String),
}

#[derive(Debug, Clone)]
pub struct ExtractOptions<'a> {
    /// Cargo package name with `-` mapped to `_`. `"crate"` keeps demo FQNs.
    pub package: String,
    /// Repo-relative crate root (`crates/foo` or `.`).
    pub crate_root: String,
    pub symbols: Option<&'a SymbolIndex>,
}

impl Default for ExtractOptions<'_> {
    fn default() -> Self {
        Self {
            package: "crate".into(),
            crate_root: String::new(),
            symbols: None,
        }
    }
}

pub struct ExtractResult {
    pub extract: Extract,
    pub findings: Vec<Finding>,
}

pub fn extract_file(repo_relative: &str, source: &str) -> Result<ExtractResult, PluginError> {
    extract_file_with(repo_relative, source, &ExtractOptions::default())
}

pub fn extract_file_with(
    repo_relative: &str,
    source: &str,
    opts: &ExtractOptions<'_>,
) -> Result<ExtractResult, PluginError> {
    let mut parser = Parser::new();
    parser
        .set_language(&rust_language())
        .map_err(|_| PluginError::Language)?;
    let tree = parser
        .parse(source, None)
        .ok_or_else(|| PluginError::Parse(repo_relative.to_string()))?;

    let query = rust_query()?;
    let mut cursor = QueryCursor::new();
    let bytes = source.as_bytes();
    let file = normalize_path(repo_relative);
    let file_module = module_fqn_from_path(&opts.package, &opts.crate_root, &file);

    let mut nodes = Vec::new();
    let mut refs = Vec::new();
    let mut findings = Vec::new();
    let mut imports: HashMap<String, String> = HashMap::new();
    let mut attrs: Vec<(u32, String)> = Vec::new();

    let idx = |name: &str| query.capture_index_for_name(name);

    let mut matches = cursor.matches(query, tree.root_node(), bytes);
    while let Some(m) = matches.next() {
        let cap = |name: &str| -> Option<Node> {
            let i = idx(name)?;
            m.captures.iter().find(|c| c.index == i).map(|c| c.node)
        };

        if let Some(use_node) = cap("use") {
            collect_use(text_of(use_node, bytes), &opts.package, &mut imports);
        }
        if let Some(attr) = cap("attr") {
            attrs.push((
                attr.end_position().row as u32,
                text_of(attr, bytes).to_string(),
            ));
        }

        if let (Some(name), Some(def)) = (cap("type.name"), cap("type.def")) {
            let module = module_of(def, bytes, &file_module);
            let fqn = format!("{module}::{}", text_of(name, bytes));
            push_type(&mut nodes, fqn, span_of(&file, def));
        }

        if let (Some(name), Some(def)) = (cap("fn.name"), cap("fn.def")) {
            if ancestor_kind(def, "impl_item") || in_tests_mod(def, bytes) {
                continue;
            }
            let module = module_of(def, bytes, &file_module);
            let fqn = format!("{module}::{}", text_of(name, bytes));
            let attr_txt = attr_just_above(&attrs, def.start_position().row as u32);
            if let Some(meta) = handler_endpoint_meta(&attr_txt, text_of(def, bytes)) {
                nodes.push(NodeDef {
                    fqn: format!("{fqn}#endpoint"),
                    kind: NodeKind::Endpoint,
                    span: span_of(&file, def),
                    endpoint: Some(meta),
                });
            }
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
            if in_tests_mod(def, bytes) {
                continue;
            }
            let module = module_of(def, bytes, &file_module);
            let tfqn = qualify_type(&module, &opts.package, text_of(ty, bytes));
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
                let module = module_of(def, bytes, &file_module);
                nodes.push(NodeDef {
                    fqn: format!("{module}::{}", text_of(name, bytes)),
                    kind: NodeKind::Endpoint,
                    span: span_of(&file, def),
                    endpoint: Some(meta),
                });
            }
        }

        if let Some(letn) = cap("let") {
            if let Some((fqn, sp, meta)) =
                detect_let_endpoint(letn, bytes, &file, &file_module, &opts.package)
            {
                nodes.push(NodeDef {
                    fqn,
                    kind: NodeKind::Endpoint,
                    span: sp,
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
    let mut matches = cursor.matches(query, tree.root_node(), bytes);
    while let Some(m) = matches.next() {
        let cap = |name: &str| -> Option<Node> {
            let i = idx(name)?;
            m.captures.iter().find(|c| c.index == i).map(|c| c.node)
        };

        if let (Some(name), Some(call)) = (cap("call.name"), cap("call")) {
            if let Some(from) = enclosing_fn(&nodes, call) {
                let impl_ty = enclosing_impl_type(call, bytes, &file_module, &opts.package);
                emit_call(
                    &mut refs,
                    &nodes,
                    &imports,
                    opts.symbols,
                    &opts.package,
                    from,
                    text_of(name, bytes),
                    text_of(call, bytes),
                    impl_ty.as_deref(),
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
                    opts.symbols,
                    &opts.package,
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
                    opts.symbols,
                    &opts.package,
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

fn rust_language() -> Language {
    tree_sitter_rust::LANGUAGE.into()
}

fn rust_query() -> Result<&'static Query, PluginError> {
    static Q: OnceLock<Result<Query, String>> = OnceLock::new();
    match Q.get_or_init(|| Query::new(&rust_language(), EXTRACT_QUERIES).map_err(|e| e.to_string()))
    {
        Ok(q) => Ok(q),
        Err(e) => Err(PluginError::Query(e.clone())),
    }
}

fn in_tests_mod(node: Node, bytes: &[u8]) -> bool {
    let mut cur = node.parent();
    while let Some(n) = cur {
        if n.kind() == "mod_item" {
            if let Some(name) = n.child_by_field_name("name") {
                if text_of(name, bytes) == "tests" {
                    return true;
                }
            }
        }
        cur = n.parent();
    }
    false
}

fn module_of(node: Node, bytes: &[u8], file_module: &str) -> String {
    let mut mods = Vec::new();
    let mut cur = node.parent();
    while let Some(n) = cur {
        if n.kind() == "mod_item" {
            if n.child_by_field_name("body").is_some() {
                if let Some(name) = n.child_by_field_name("name") {
                    mods.push(text_of(name, bytes).to_string());
                }
            }
        }
        cur = n.parent();
    }
    mods.reverse();
    if mods.is_empty() {
        file_module.to_string()
    } else {
        format!("{file_module}::{}", mods.join("::"))
    }
}

fn enclosing_impl_type(
    node: Node,
    bytes: &[u8],
    file_module: &str,
    package: &str,
) -> Option<String> {
    let mut cur = Some(node);
    while let Some(n) = cur {
        if n.kind() == "impl_item" {
            let ty = n.child_by_field_name("type")?;
            let module = module_of(n, bytes, file_module);
            return Some(qualify_type(&module, package, text_of(ty, bytes)));
        }
        cur = n.parent();
    }
    None
}

fn qualify_type(module_fqn: &str, package: &str, ty: &str) -> String {
    let ty = rewrite(
        &ty.split('<').next().unwrap_or(ty).trim().replace(' ', ""),
        package,
    );
    if ty.starts_with("crate::") || ty.contains("::") && !ty.starts_with("self::") {
        if ty.starts_with("crate::") {
            return rewrite(&ty, package);
        }
        if ty.starts_with("self::") {
            return format!("{module_fqn}::{}", ty.trim_start_matches("self::"));
        }
        return ty;
    }
    let base = ty.split("::").last().unwrap_or(&ty);
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
    symbols: Option<&SymbolIndex>,
    package: &str,
    from: String,
    callee: &str,
    call_txt: &str,
    impl_ty: Option<&str>,
    span: Span,
) {
    let short = callee
        .split("::")
        .last()
        .unwrap_or(callee)
        .split('.')
        .last()
        .unwrap_or(callee)
        .trim();
    let to = resolve_fn(
        callee, short, defs, imports, symbols, package, impl_ty, call_txt,
    );
    let Some(to) = to else { return };
    if lookup(defs, symbols, &to, Some(NodeKind::Type)).is_some()
        && lookup(defs, symbols, &to, Some(NodeKind::Function)).is_none()
    {
        return;
    }
    let kind = if is_endpoint_name(defs, symbols, &to) {
        pubsub_kind(&from, short)
    } else {
        EdgeKind::Calls
    };
    refs.push(Ref {
        from,
        to: Some(to),
        kind,
        span,
    });
}

fn resolve_fn(
    callee: &str,
    short: &str,
    defs: &[NodeDef],
    imports: &HashMap<String, String>,
    symbols: Option<&SymbolIndex>,
    package: &str,
    impl_ty: Option<&str>,
    call_txt: &str,
) -> Option<String> {
    let rewritten = rewrite(callee, package);
    if rewritten.contains("::") {
        if let Some(hit) = lookup(defs, symbols, &rewritten, Some(NodeKind::Function)) {
            return Some(hit);
        }
        if let Some(imp) = imports.get(callee.split("::").next().unwrap_or(callee)) {
            let rest = callee.split_once("::").map(|(_, r)| r).unwrap_or("");
            let cand = if rest.is_empty() {
                imp.clone()
            } else {
                format!("{imp}::{rest}")
            };
            if let Some(hit) = lookup(defs, symbols, &cand, Some(NodeKind::Function)) {
                return Some(hit);
            }
        }
    }
    if call_txt.contains("self.") || callee.starts_with("self.") {
        if let Some(ty) = impl_ty {
            let cand = format!("{ty}::{short}");
            if let Some(hit) = lookup(defs, symbols, &cand, Some(NodeKind::Function)) {
                return Some(hit);
            }
        }
    }
    if let Some(to) = resolve_name(
        short,
        defs,
        imports,
        symbols,
        package,
        Some(NodeKind::Function),
    ) {
        return Some(to);
    }
    if let Some(ty) = impl_ty {
        let cand = format!("{ty}::{short}");
        if lookup(defs, symbols, &cand, Some(NodeKind::Function)).is_some() {
            return Some(cand);
        }
    }
    None
}

fn emit_type_use(
    refs: &mut Vec<Ref>,
    defs: &[NodeDef],
    imports: &HashMap<String, String>,
    symbols: Option<&SymbolIndex>,
    package: &str,
    from: String,
    name: &str,
    span: Span,
) {
    if is_prelude_type(name) {
        return;
    }
    let Some(to) = resolve_name(name, defs, imports, symbols, package, Some(NodeKind::Type)) else {
        return;
    };
    if lookup(defs, symbols, &to, Some(NodeKind::Type)).is_some()
        || imports.values().any(|v| v == &to)
    {
        refs.push(Ref {
            from,
            to: Some(to),
            kind: EdgeKind::TypeUses,
            span,
        });
    }
}

fn emit_endpoint_ref(
    refs: &mut Vec<Ref>,
    defs: &[NodeDef],
    imports: &HashMap<String, String>,
    symbols: Option<&SymbolIndex>,
    package: &str,
    from: String,
    name: &str,
    span: Span,
) {
    let rewritten = rewrite(name, package);
    let to = if rewritten.contains("::") {
        lookup(defs, symbols, &rewritten, Some(NodeKind::Endpoint)).or_else(|| {
            if is_endpoint_name(defs, symbols, &rewritten) || looks_like_endpoint(&rewritten) {
                Some(rewritten.clone())
            } else {
                None
            }
        })
    } else {
        resolve_name(
            name,
            defs,
            imports,
            symbols,
            package,
            Some(NodeKind::Endpoint),
        )
    };
    let Some(to) = to else { return };
    if !is_endpoint_name(defs, symbols, &to) && !looks_like_endpoint(&to) {
        return;
    }
    refs.push(Ref {
        from: from.clone(),
        to: Some(to),
        kind: pubsub_kind(&from, ""),
        span,
    });
}

fn pubsub_kind(from: &str, callee: &str) -> EdgeKind {
    let blob = format!("{from} {callee}").to_ascii_lowercase();
    if blob.contains("publish") || blob.contains("send") || blob.contains("emit") {
        EdgeKind::Publishes
    } else if blob.contains("subscribe") || blob.contains("recv") || blob.contains("listen") {
        EdgeKind::Subscribes
    } else {
        EdgeKind::Reads
    }
}

fn is_endpoint_name(defs: &[NodeDef], symbols: Option<&SymbolIndex>, fqn: &str) -> bool {
    defs.iter()
        .any(|d| d.fqn == fqn && d.kind == NodeKind::Endpoint)
        || symbols.is_some_and(|s| s.is_endpoint(fqn))
}

fn is_prelude_type(name: &str) -> bool {
    matches!(
        name.split("::").last().unwrap_or(name),
        "u8" | "u16"
            | "u32"
            | "u64"
            | "i8"
            | "i16"
            | "i32"
            | "i64"
            | "isize"
            | "usize"
            | "f32"
            | "f64"
            | "bool"
            | "char"
            | "str"
            | "String"
            | "Vec"
            | "Option"
            | "Result"
            | "Box"
            | "Rc"
            | "Arc"
            | "Cell"
            | "RefCell"
            | "Mutex"
            | "RwLock"
            | "HashMap"
            | "HashSet"
            | "BTreeMap"
            | "BTreeSet"
            | "VecDeque"
            | "BinaryHeap"
            | "Path"
            | "PathBuf"
            | "OsStr"
            | "OsString"
            | "Some"
            | "None"
            | "Ok"
            | "Err"
            | "Self"
            | "Iterator"
            | "IntoIterator"
            | "From"
            | "Into"
            | "Default"
            | "Debug"
            | "Clone"
            | "Copy"
            | "Eq"
            | "PartialEq"
            | "Ord"
            | "PartialOrd"
            | "Display"
            | "Error"
            | "Send"
            | "Sync"
    )
}

fn looks_like_endpoint(fqn: &str) -> bool {
    let short = fqn.rsplit("::").next().unwrap_or(fqn);
    short.contains("events")
        || short.ends_with("_tx")
        || short.ends_with("_rx")
        || short.contains("queue")
        || short.contains("topic")
}

fn lookup(
    defs: &[NodeDef],
    symbols: Option<&SymbolIndex>,
    fqn: &str,
    prefer: Option<NodeKind>,
) -> Option<String> {
    if let Some(d) = defs
        .iter()
        .find(|d| d.fqn == fqn && prefer.map(|k| d.kind == k).unwrap_or(true))
    {
        return Some(d.fqn.clone());
    }
    if prefer.is_none() {
        if let Some(d) = defs.iter().find(|d| d.fqn == fqn) {
            return Some(d.fqn.clone());
        }
    }
    if let Some(s) = symbols {
        match prefer {
            Some(k) if s.get(fqn) == Some(k) => return Some(fqn.to_string()),
            None if s.get(fqn).is_some() => return Some(fqn.to_string()),
            _ => {}
        }
    }
    None
}

fn resolve_name(
    name: &str,
    defs: &[NodeDef],
    imports: &HashMap<String, String>,
    symbols: Option<&SymbolIndex>,
    package: &str,
    prefer: Option<NodeKind>,
) -> Option<String> {
    let name = rewrite(name, package);
    if name.contains("::") {
        return lookup(defs, symbols, &name, prefer).or_else(|| {
            let short = name.rsplit("::").next()?.to_string();
            imports.get(&short).cloned().or_else(|| Some(name.clone()))
        });
    }
    let short = name.as_str();
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
    if hits.len() == 1 {
        return Some(hits[0].fqn.clone());
    }
    if let Some(imp) = imports.get(short) {
        let imp = rewrite(imp, package);
        if lookup(defs, symbols, &imp, prefer).is_some() {
            return Some(imp);
        }
        if prefer.is_none() {
            return Some(imp);
        }
        if prefer == Some(NodeKind::Type) {
            return Some(imp);
        }
    }
    if let Some(s) = symbols {
        if let Some(u) = s.unique(short, prefer) {
            return Some(u);
        }
    }
    hits.first().map(|d| d.fqn.clone())
}

fn endpoint_meta(name: &str, ty: &str, whole: &str) -> Option<EndpointMeta> {
    // Type/value decide the channel. A name like MAX_FILE_BYTES is not an endpoint.
    let typed = format!("{ty} {whole}").to_ascii_lowercase();
    let channel = channel_from_typed(&typed, whole)?;
    let blob = format!("{name} {typed}");
    let role = if name.contains("tx")
        || name.contains("pub")
        || blob.contains("sender")
        || blob.contains("sink")
    {
        EndRole::Sink
    } else if name.contains("rx")
        || name.contains("sub")
        || blob.contains("receiver")
        || blob.contains("source")
    {
        EndRole::Source
    } else {
        EndRole::Sink
    };
    Some(EndpointMeta { role, channel })
}

fn channel_from_typed(typed: &str, whole: &str) -> Option<EndChannel> {
    if typed.contains("broadcast")
        || typed.contains("channel")
        || typed.contains("mpsc")
        || typed.contains("watch")
        || typed.contains("oneshot")
    {
        Some(EndChannel::Channel)
    } else if typed.contains("queue") || typed.contains("topic") || typed.contains("kafka") {
        Some(EndChannel::Queue)
    } else if typed.contains("sqlx") || typed.contains("diesel") || typed.contains("sea_orm") {
        Some(EndChannel::Table)
    } else if whole.contains("OpenOptions")
        || typed.contains("std::fs")
        || typed.contains("tokio::fs")
    {
        Some(EndChannel::File)
    } else if typed.contains("router")
        || typed.contains("axum")
        || typed.contains("actix")
        || typed.contains("warp")
        || whole.contains("Router")
    {
        Some(EndChannel::Http)
    } else {
        None
    }
}

fn handler_endpoint_meta(attr: &str, fn_txt: &str) -> Option<EndpointMeta> {
    let blob = format!("{attr} {fn_txt}").to_ascii_lowercase();
    if attr.contains("get")
        || attr.contains("post")
        || attr.contains("put")
        || attr.contains("delete")
        || attr.contains("patch")
        || attr.contains("route")
        || blob.contains("axum::")
    {
        return Some(EndpointMeta {
            role: EndRole::Source,
            channel: EndChannel::Http,
        });
    }
    None
}

fn attr_just_above(attrs: &[(u32, String)], fn_row: u32) -> String {
    attrs
        .iter()
        .rev()
        .find(|(end_row, _)| *end_row + 1 >= fn_row && *end_row <= fn_row)
        .map(|(_, t)| t.clone())
        .unwrap_or_default()
}

fn detect_let_endpoint(
    node: Node,
    bytes: &[u8],
    file: &str,
    module_fqn: &str,
    package: &str,
) -> Option<(String, Span, EndpointMeta)> {
    let txt = text_of(node, bytes);
    let meta = endpoint_meta("", "", txt)?;
    let name = node
        .child_by_field_name("pattern")
        .map(|n| text_of(n, bytes).trim().to_string())
        .filter(|s| s.chars().all(|c| c.is_ascii_alphanumeric() || c == '_'))?;
    let module = module_of(node, bytes, module_fqn);
    let _ = package;
    Some((format!("{module}::{name}"), span_of(file, node), meta))
}

fn collect_use(txt: &str, package: &str, imports: &mut HashMap<String, String>) {
    let cleaned = txt
        .trim()
        .trim_start_matches("pub")
        .trim()
        .trim_start_matches("use")
        .trim()
        .trim_end_matches(';')
        .trim();
    expand_use(cleaned, package, imports);
}

fn expand_use(cleaned: &str, package: &str, imports: &mut HashMap<String, String>) {
    if let Some((prefix, brace)) = cleaned.split_once('{') {
        let prefix = prefix.trim().trim_end_matches(':').trim();
        let inner = brace.rsplit_once('}').map(|(a, _)| a).unwrap_or(brace);
        for part in split_top_commas(inner) {
            let part = part.trim();
            if part.is_empty() || part == "self" {
                if part == "self" {
                    let path = rewrite(prefix, package);
                    if let Some(short) = path.rsplit("::").next() {
                        imports.insert(short.to_string(), path);
                    }
                }
                continue;
            }
            if part.contains('{') {
                expand_use(&format!("{prefix}::{part}"), package, imports);
                continue;
            }
            let (name, alias) = split_as(part);
            let path = rewrite(&format!("{prefix}::{name}"), package);
            let short =
                alias.unwrap_or_else(|| name.rsplit("::").next().unwrap_or(name).to_string());
            imports.insert(short, path);
        }
    } else {
        let (path, alias) = split_as(cleaned);
        let path = rewrite(path, package);
        let short = alias.unwrap_or_else(|| path.rsplit("::").next().unwrap_or(&path).to_string());
        imports.insert(short, path);
    }
}

fn split_as(s: &str) -> (&str, Option<String>) {
    if let Some((a, b)) = s.split_once(" as ") {
        (a.trim(), Some(b.trim().to_string()))
    } else {
        (s.trim(), None)
    }
}

fn split_top_commas(s: &str) -> Vec<&str> {
    let mut out = Vec::new();
    let mut start = 0;
    let mut depth = 0;
    for (i, c) in s.char_indices() {
        match c {
            '{' => depth += 1,
            '}' => depth -= 1,
            ',' if depth == 0 => {
                out.push(&s[start..i]);
                start = i + 1;
            }
            _ => {}
        }
    }
    out.push(&s[start..]);
    out
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

pub fn module_fqn_from_path(package: &str, crate_root: &str, repo_file: &str) -> String {
    let file = normalize_path(repo_file);
    let root = normalize_path(crate_root);
    let rel = if root.is_empty() || root == "." {
        file.as_str()
    } else {
        file.strip_prefix(&format!("{root}/"))
            .or_else(|| file.strip_prefix(&root))
            .unwrap_or(&file)
    };
    let rel = rel.strip_prefix("./").unwrap_or(rel);
    let rel = rel.strip_prefix("src/").unwrap_or(rel);
    let rel = rel.strip_suffix(".rs").unwrap_or(rel);
    if rel == "lib" || rel == "main" || rel.is_empty() {
        return package.to_string();
    }
    let rel = rel.strip_suffix("/mod").unwrap_or(rel);
    let parts: Vec<_> = rel.split('/').filter(|s| !s.is_empty()).collect();
    if parts.is_empty() {
        package.to_string()
    } else {
        format!("{package}::{}", parts.join("::"))
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
    }

    #[test]
    fn two_pass_resolves_cross_file_call() {
        let a = extract_file("src/a.rs", "pub fn helper() {}\n")
            .unwrap()
            .extract;
        let idx = SymbolIndex::from_extracts(&[a]);
        let opts = ExtractOptions {
            package: "crate".into(),
            crate_root: String::new(),
            symbols: Some(&idx),
        };
        let b = extract_file_with("src/b.rs", "pub fn run() { helper(); }\n", &opts).unwrap();
        assert!(b.extract.refs.iter().any(|r| {
            r.from == "crate::b::run"
                && r.to.as_deref() == Some("crate::a::helper")
                && r.kind == EdgeKind::Calls
        }));
    }

    #[test]
    fn self_method_call_resolves() {
        let src = r#"
pub struct T;
impl T {
    fn inner(&self) {}
    pub fn outer(&self) { self.inner(); }
}
"#;
        let r = extract_file("src/lib.rs", src).unwrap();
        assert!(r.extract.refs.iter().any(|e| {
            e.from == "crate::T::outer"
                && e.to.as_deref() == Some("crate::T::inner")
                && e.kind == EdgeKind::Calls
        }));
    }

    #[test]
    fn package_fqn_rewrites_crate_prefix() {
        let opts = ExtractOptions {
            package: "demo".into(),
            crate_root: String::new(),
            symbols: None,
        };
        let r = extract_file_with("src/bus.rs", "pub fn publish() {}\n", &opts).unwrap();
        assert!(r
            .extract
            .nodes
            .iter()
            .any(|n| n.fqn == "demo::bus::publish"));
    }

    #[test]
    fn query_compiles() {
        rust_query().unwrap();
    }
}
