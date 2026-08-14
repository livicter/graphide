use graphide_ir::{Extract, NodeKind};
use std::collections::{HashMap, HashSet};

/// Crate-wide defs the per-file plugin can resolve against (pass 2).
#[derive(Debug, Clone, Default)]
pub struct SymbolIndex {
    pub by_fqn: HashMap<String, NodeKind>,
    pub by_short: HashMap<String, Vec<(String, NodeKind)>>,
    pub endpoints: HashSet<String>,
    pub methods: HashMap<String, Vec<String>>,
}

impl SymbolIndex {
    pub fn from_extracts(extracts: &[Extract]) -> Self {
        let mut idx = Self::default();
        for ex in extracts {
            for n in &ex.nodes {
                idx.by_fqn.insert(n.fqn.clone(), n.kind);
                let short = n.fqn.rsplit("::").next().unwrap_or(&n.fqn).to_string();
                idx.by_short
                    .entry(short.clone())
                    .or_default()
                    .push((n.fqn.clone(), n.kind));
                if n.kind == NodeKind::Endpoint {
                    idx.endpoints.insert(n.fqn.clone());
                }
                if n.kind == NodeKind::Function && n.fqn.matches("::").count() >= 2 {
                    idx.methods.entry(short).or_default().push(n.fqn.clone());
                }
            }
        }
        idx
    }

    pub fn unique(&self, short: &str, prefer: Option<NodeKind>) -> Option<String> {
        // These names are almost always trait/std methods, not a unique crate fn.
        if matches!(
            short,
            "default" | "new" | "clone" | "from" | "into" | "fmt" | "drop" | "clone_from"
        ) {
            return None;
        }
        let hits = self.by_short.get(short)?;
        let filtered: Vec<&(String, NodeKind)> = match prefer {
            Some(k) => hits.iter().filter(|(_, kind)| *kind == k).collect(),
            None => hits.iter().collect(),
        };
        if filtered.len() == 1 {
            Some(filtered[0].0.clone())
        } else {
            None
        }
    }

    pub fn get(&self, fqn: &str) -> Option<NodeKind> {
        self.by_fqn.get(fqn).copied()
    }

    pub fn is_endpoint(&self, fqn: &str) -> bool {
        self.endpoints.contains(fqn) || self.get(fqn) == Some(NodeKind::Endpoint)
    }
}

pub fn rewrite_crate_prefix(path: &str, package: &str) -> String {
    if package != "crate" && path.starts_with("crate::") {
        format!("{package}::{}", &path["crate::".len()..])
    } else if path == "crate" && package != "crate" {
        package.to_string()
    } else {
        path.to_string()
    }
}
