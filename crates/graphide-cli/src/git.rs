use anyhow::Result;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Command;

pub fn git_root(start: &Path) -> Option<PathBuf> {
    let out = Command::new("git")
        .args(["rev-parse", "--show-toplevel"])
        .current_dir(start)
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    let p = String::from_utf8_lossy(&out.stdout).trim().to_string();
    if p.is_empty() {
        None
    } else {
        Some(PathBuf::from(p))
    }
}

pub fn resolve_base_rev(git_root: &Path, base: Option<&str>) -> Option<String> {
    if let Some(b) = base {
        return merge_base(git_root, "HEAD", b).or_else(|| rev_parse(git_root, b));
    }
    for cand in ["main", "master", "origin/main", "origin/master"] {
        if let Some(rev) = merge_base(git_root, "HEAD", cand) {
            return Some(rev);
        }
    }
    rev_parse(git_root, "HEAD^")
}

fn rev_parse(git_root: &Path, rev: &str) -> Option<String> {
    let out = Command::new("git")
        .args(["rev-parse", "--verify", rev])
        .current_dir(git_root)
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    Some(String::from_utf8_lossy(&out.stdout).trim().to_string())
}

fn merge_base(git_root: &Path, a: &str, b: &str) -> Option<String> {
    let out = Command::new("git")
        .args(["merge-base", a, b])
        .current_dir(git_root)
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
    if s.is_empty() {
        None
    } else {
        Some(s)
    }
}

pub fn sources_at_rev(
    git_root: &Path,
    review_root: &Path,
    rev: &str,
    head_rels: impl Iterator<Item = impl AsRef<str>>,
) -> Result<HashMap<String, String>> {
    let mut out = HashMap::new();
    for rel in head_rels {
        let rel = rel.as_ref();
        let abs = review_root.join(rel);
        let git_rel = crate::extract::path_relative(git_root, &abs);
        if let Some(text) = git_show(git_root, rev, &git_rel) {
            out.insert(rel.to_string(), text);
        }
    }
    Ok(out)
}

fn git_show(git_root: &Path, rev: &str, path: &str) -> Option<String> {
    let spec = format!("{rev}:{path}");
    let out = Command::new("git")
        .args(["show", &spec])
        .current_dir(git_root)
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    String::from_utf8(out.stdout).ok()
}
