//! Programs are a file projection of the derived graph (SPEC: files are a
//! projection; "one binary" is the outermost program). Not plugin-authored.

use graphide_ir::{EndRole, Graph, Node, NodeKind, ProgramView};

pub fn programs_from_graph(graph: &Graph) -> Vec<ProgramView> {
    use std::collections::BTreeMap;
    let mut hints: BTreeMap<(String, String, String), ()> = BTreeMap::new();
    for n in &graph.nodes {
        if let Some(h) = detect_hint(&n.span.file) {
            hints.insert(h, ());
        }
    }
    // lib.rs is often only `mod` lines, so it may have no nodes. A crate with
    // src/*.rs and no src/main.rs is still a lib projection.
    let mut by_root: BTreeMap<String, Vec<String>> = BTreeMap::new();
    for n in &graph.nodes {
        let f = norm(&n.span.file);
        by_root.entry(crate_root_of(&f)).or_default().push(f);
    }
    for (root, files) in &by_root {
        let has_main = files.iter().any(|f| strip_src_file(f, "main.rs").is_some());
        let has_lib_file = files.iter().any(|f| strip_src_file(f, "lib.rs").is_some());
        let has_src_mod = files.iter().any(|f| is_crate_src_module(f));
        if has_lib_file || (has_src_mod && !has_main) {
            hints.insert(("lib".into(), pkg_name(root, "lib"), root.clone()), ());
        }
    }
    let hint_list: Vec<ProgramView> = hints
        .into_keys()
        .map(|(kind, name, root)| ProgramView {
            name,
            kind,
            root,
            entries: vec![],
            nodes: 0,
        })
        .collect();

    let mut groups: BTreeMap<(String, String, String), Vec<&Node>> = BTreeMap::new();
    for n in &graph.nodes {
        let key = assign_file(&n.span.file, &hint_list);
        groups.entry(key).or_default().push(n);
    }
    let mut out: Vec<ProgramView> = groups
        .into_iter()
        .map(|((kind, name, root), nodes)| {
            let mut entries: Vec<String> = nodes
                .iter()
                .filter(|n| is_entry(n))
                .map(|n| n.fqn.clone())
                .collect();
            entries.sort();
            entries.dedup();
            if entries.is_empty() {
                entries = nodes
                    .iter()
                    .filter(|n| n.kind == graphide_ir::NodeKind::Function)
                    .take(3)
                    .map(|n| n.fqn.clone())
                    .collect();
            }
            ProgramView {
                name,
                kind,
                root,
                entries,
                nodes: nodes.len() as u32,
            }
        })
        .collect();
    out.sort_by(|a, b| {
        kind_rank(&a.kind)
            .cmp(&kind_rank(&b.kind))
            .then(a.name.cmp(&b.name))
            .then(a.root.cmp(&b.root))
    });
    out
}

fn kind_rank(kind: &str) -> u8 {
    match kind {
        "bin" => 0,
        "lib" => 1,
        _ => 2,
    }
}

fn last_seg(fqn: &str) -> &str {
    fqn.rsplit([':', '.', '/', '#'])
        .find(|s| !s.is_empty())
        .unwrap_or(fqn)
}

/// Program entries are Endpoint sources and functions named `main`.
/// Being *in* `main.rs` is not enough — Types and helpers there starve
/// the default control-flow walk (alphabetized seeds never reach `fn main`).
pub fn is_entry(n: &Node) -> bool {
    if n.endpoint
        .as_ref()
        .is_some_and(|e| e.role == EndRole::Source)
    {
        return true;
    }
    n.kind == NodeKind::Function && last_seg(&n.fqn) == "main"
}

/// Map a single file with no sibling context (entry files only; else pkg).
pub fn package_of(file: &str) -> (String, String, String) {
    detect_hint(file).unwrap_or_else(|| fallback_pkg(file))
}

/// Assign a file to a program using the derived program list as crate context.
pub fn assign_file(file: &str, programs: &[ProgramView]) -> (String, String, String) {
    if let Some(h) = detect_hint(file) {
        return h;
    }
    let root = crate_root_of(&norm(file));
    let at: Vec<&ProgramView> = programs.iter().filter(|p| p.root == root).collect();
    if let Some(lib) = at.iter().find(|p| p.kind == "lib") {
        return (lib.kind.clone(), lib.name.clone(), lib.root.clone());
    }
    let pkg_bin = pkg_name(&root, "main");
    if let Some(bin) = at
        .iter()
        .find(|p| p.kind == "bin" && p.name == pkg_bin)
    {
        return (bin.kind.clone(), bin.name.clone(), bin.root.clone());
    }
    fallback_pkg(file)
}

fn detect_hint(file: &str) -> Option<(String, String, String)> {
    let f = norm(file);
    if let Some((root, rest)) = split_src_bin(&f) {
        let name = rest
            .split('/')
            .next()
            .unwrap_or("bin")
            .trim_end_matches(".rs")
            .trim_end_matches(".go")
            .to_string();
        return Some(("bin".into(), name, root));
    }
    if let Some(root) = strip_src_file(&f, "main.rs") {
        let name = pkg_name(&root, "main");
        return Some(("bin".into(), name, root));
    }
    if let Some(root) = strip_src_file(&f, "lib.rs") {
        let name = pkg_name(&root, "lib");
        return Some(("lib".into(), name, root));
    }
    if f.ends_with("/main.go") || f == "main.go" {
        let root = f.trim_end_matches("main.go").trim_end_matches('/');
        if let Some(rest) = root.strip_prefix("cmd/") {
            let name = rest.split('/').next().unwrap_or("main").to_string();
            return Some(("bin".into(), name.clone(), format!("cmd/{name}")));
        }
        let name = pkg_name(root, "main");
        return Some(("bin".into(), name, root.to_string()));
    }
    if f.ends_with("/__main__.py") || f.ends_with("/main.py") {
        let root = f
            .trim_end_matches("__main__.py")
            .trim_end_matches("main.py")
            .trim_end_matches('/');
        let name = pkg_name(root, "main");
        return Some(("bin".into(), name, root.to_string()));
    }
    None
}

fn fallback_pkg(file: &str) -> (String, String, String) {
    let f = norm(file);
    if let Some((a, _)) = f.split_once('/') {
        if a == "src" {
            return ("pkg".into(), "src".into(), String::new());
        }
        return ("pkg".into(), a.into(), a.into());
    }
    ("pkg".into(), "root".into(), String::new())
}

fn is_crate_src_module(f: &str) -> bool {
    if strip_src_file(f, "main.rs").is_some() || split_src_bin(f).is_some() {
        return false;
    }
    f == "src" || f.starts_with("src/") || f.contains("/src/")
}

fn crate_root_of(f: &str) -> String {
    if let Some((root, _)) = split_src_bin(f) {
        return root;
    }
    if f.starts_with("src/") || f == "src" {
        return String::new();
    }
    if let Some(i) = f.find("/src/") {
        return f[..i].to_string();
    }
    if f == "main.go" || f == "main.py" || f == "__main__.py" {
        return String::new();
    }
    if let Some(rest) = f.strip_prefix("cmd/") {
        let name = rest.split('/').next().unwrap_or("main");
        return format!("cmd/{name}");
    }
    if let Some((a, _)) = f.split_once('/') {
        return a.to_string();
    }
    String::new()
}

fn norm(file: &str) -> String {
    let f = file.replace('\\', "/");
    f.strip_prefix("./").unwrap_or(&f).to_string()
}

fn split_src_bin(f: &str) -> Option<(String, String)> {
    if let Some(i) = f.find("/src/bin/") {
        return Some((f[..i].to_string(), f[i + 9..].to_string()));
    }
    if let Some(rest) = f.strip_prefix("src/bin/") {
        return Some((String::new(), rest.to_string()));
    }
    None
}

fn strip_src_file(f: &str, name: &str) -> Option<String> {
    if f == format!("src/{name}") {
        return Some(String::new());
    }
    f.strip_suffix(&format!("/src/{name}"))
        .map(|r| r.to_string())
}

fn pkg_name(root: &str, fallback: &str) -> String {
    if root.is_empty() {
        return fallback.into();
    }
    root.rsplit('/').next().unwrap_or(fallback).into()
}

#[cfg(test)]
mod tests {
    use super::*;
    use graphide_ir::*;

    fn node(fqn: &str, file: &str) -> Node {
        Node {
            id: NodeId::from_identity(NodeKind::Function, fqn),
            fqn: fqn.into(),
            kind: NodeKind::Function,
            span: Span {
                file: file.into(),
                start: Pos { line: 1, column: 1 },
                end: Pos { line: 2, column: 1 },
            },
            endpoint: None,
        }
    }

    #[test]
    fn cargo_workspace_bins_are_separate_programs() {
        let graph = Graph {
            nodes: vec![
                node("crate::main", "src/main.rs"),
                node("sim::run", "src/bin/sim.rs"),
                node("lib::help", "src/lib.rs"),
                node("crate::util", "src/util.rs"),
                node("cli::main", "crates/cli/src/main.rs"),
            ],
            edges: vec![],
        };
        let ps = programs_from_graph(&graph);
        let names: Vec<_> = ps.iter().map(|p| (p.kind.as_str(), p.name.as_str())).collect();
        assert!(names.contains(&("bin", "main")), "{names:?}");
        assert!(names.contains(&("bin", "sim")), "{names:?}");
        assert!(names.contains(&("bin", "cli")), "{names:?}");
        assert!(names.contains(&("lib", "lib")), "{names:?}");
        let lib = ps.iter().find(|p| p.kind == "lib").unwrap();
        assert_eq!(lib.nodes, 2, "lib.rs + util.rs belong to the lib, got {ps:?}");
    }

    #[test]
    fn src_modules_without_lib_rs_node_are_still_one_lib() {
        let graph = Graph {
            nodes: vec![
                node("crate::bus", "src/bus.rs"),
                node("crate::sub", "src/sub.rs"),
            ],
            edges: vec![],
        };
        let ps = programs_from_graph(&graph);
        assert_eq!(ps.len(), 1, "{ps:?}");
        assert_eq!(ps[0].kind, "lib");
        assert_eq!(ps[0].nodes, 2);
    }

    #[test]
    fn lib_crate_is_one_program() {
        let graph = Graph {
            nodes: vec![
                node("crate::lib", "src/lib.rs"),
                node("crate::bus", "src/bus.rs"),
                node("crate::sub", "src/sub.rs"),
            ],
            edges: vec![],
        };
        let ps = programs_from_graph(&graph);
        assert_eq!(ps.len(), 1, "{ps:?}");
        assert_eq!(ps[0].kind, "lib");
        assert_eq!(ps[0].nodes, 3);
    }

    fn typed(fqn: &str, file: &str) -> Node {
        Node {
            id: NodeId::from_identity(NodeKind::Type, fqn),
            fqn: fqn.into(),
            kind: NodeKind::Type,
            span: Span {
                file: file.into(),
                start: Pos { line: 1, column: 1 },
                end: Pos { line: 2, column: 1 },
            },
            endpoint: None,
        }
    }

    #[test]
    fn types_in_main_rs_are_not_entries() {
        assert!(is_entry(&node("main", "src/main.rs")));
        assert!(is_entry(&node("crate::main", "crates/cli/src/main.rs")));
        assert!(is_entry(&node("pkg.main", "cmd/pkg/main.go")));
        assert!(!is_entry(&typed("Cli", "src/main.rs")));
        assert!(!is_entry(&typed("Cmd", "src/main.rs")));
        assert!(!is_entry(&node("review_roots", "src/main.rs")));
        assert!(!is_entry(&node("ProgressSink::new", "src/main.rs")));
        assert!(!is_entry(&node("default_stamp_path", "src/main.rs")));
    }

    #[test]
    fn package_of_src_bin() {
        assert_eq!(
            package_of("src/bin/solar.rs"),
            ("bin".into(), "solar".into(), "".into())
        );
        assert_eq!(
            package_of("crates/app/src/main.rs"),
            ("bin".into(), "app".into(), "crates/app".into())
        );
    }
}
