use anyhow::Result;
use graphide_ir::Extract;
use graphide_plugin_rust::{extract_file_with, ExtractOptions, SymbolIndex};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

const MAX_FILE_BYTES: u64 = 1_500_000;

#[derive(Clone)]
pub struct FileJob {
    pub rel: String,
    pub _abs: PathBuf,
    pub package: String,
    pub crate_root: String,
    pub source: String,
}

pub fn extract_jobs(jobs: Vec<FileJob>) -> Result<(Vec<Extract>, HashMap<String, String>)> {
    let mut sources = HashMap::new();
    let mut pass1 = Vec::new();
    for job in &jobs {
        sources.insert(job.rel.clone(), job.source.clone());
        let opts = ExtractOptions {
            package: job.package.clone(),
            crate_root: job.crate_root.clone(),
            symbols: None,
        };
        match extract_file_with(&job.rel, &job.source, &opts) {
            Ok(r) => pass1.push(r.extract),
            Err(e) => eprintln!("warn: extract {}: {e}", job.rel),
        }
    }
    let index = SymbolIndex::from_extracts(&pass1);
    let mut extracts = Vec::new();
    for job in &jobs {
        let opts = ExtractOptions {
            package: job.package.clone(),
            crate_root: job.crate_root.clone(),
            symbols: Some(&index),
        };
        match extract_file_with(&job.rel, &job.source, &opts) {
            Ok(r) => extracts.push(r.extract),
            Err(e) => eprintln!("warn: extract {}: {e}", job.rel),
        }
    }
    Ok((extracts, sources))
}

pub fn collect_jobs(root: &Path) -> Result<Vec<FileJob>> {
    let packages = find_packages(root);
    if packages.is_empty() {
        return collect_loose_rs(root, "crate", "");
    }
    let mut jobs = Vec::new();
    for pkg in packages {
        jobs.extend(collect_loose_rs(&pkg.dir, &pkg.name, &pkg.rel)?);
    }
    Ok(jobs)
}

pub fn jobs_from_sources(root: &Path, sources: &HashMap<String, String>) -> Result<Vec<FileJob>> {
    let packages = find_packages(root);
    let mut jobs = Vec::new();
    for (rel, source) in sources {
        if !rel.ends_with(".rs") {
            continue;
        }
        let (package, crate_root) = match_package(&packages, rel);
        jobs.push(FileJob {
            rel: rel.clone(),
            _abs: root.join(rel),
            package,
            crate_root,
            source: source.clone(),
        });
    }
    Ok(jobs)
}

struct Package {
    name: String,
    dir: PathBuf,
    rel: String,
}

fn find_packages(root: &Path) -> Vec<Package> {
    let members = workspace_members(root);
    let mut out = Vec::new();
    for entry in WalkDir::new(root).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.file_name().and_then(|s| s.to_str()) != Some("Cargo.toml") {
            continue;
        }
        if skip_dir(path) {
            continue;
        }
        let dir = path.parent().unwrap_or(root).to_path_buf();
        if !dir.join("src").is_dir() {
            continue;
        }
        let rel = path_relative(root, &dir);
        if let Some(members) = &members {
            let ok = members.iter().any(|m| {
                rel == *m || rel.starts_with(&format!("{m}/")) || (rel.is_empty() && m == ".")
            });
            if !ok {
                continue;
            }
        }
        let Some(name) = parse_package_name(&path) else {
            continue;
        };
        out.push(Package { name, dir, rel });
    }
    out
}

fn workspace_members(root: &Path) -> Option<Vec<String>> {
    let text = fs::read_to_string(root.join("Cargo.toml")).ok()?;
    if !text.contains("[workspace]") {
        return None;
    }
    let mut members = Vec::new();
    let mut in_members = false;
    for line in text.lines() {
        let t = line.trim();
        if t.starts_with("members") && t.contains('[') {
            in_members = true;
        }
        if in_members {
            for cap in t.split('"').skip(1).step_by(2) {
                if !cap.is_empty() && cap != "members" {
                    members.push(cap.trim_end_matches('/').to_string());
                }
            }
            if t.contains(']') {
                break;
            }
        }
    }
    if members.is_empty() {
        None
    } else {
        Some(members)
    }
}

fn parse_package_name(cargo_toml: &Path) -> Option<String> {
    let text = fs::read_to_string(cargo_toml).ok()?;
    let mut in_package = false;
    for line in text.lines() {
        let t = line.trim();
        if t.starts_with('[') {
            in_package = t == "[package]";
            continue;
        }
        if in_package && t.starts_with("name") {
            let val = t
                .split_once('=')?
                .1
                .trim()
                .trim_matches('"')
                .trim_matches('\'');
            if !val.is_empty() {
                return Some(val.replace('-', "_"));
            }
        }
    }
    None
}

fn match_package(packages: &[Package], rel: &str) -> (String, String) {
    let mut best: Option<&Package> = None;
    for p in packages {
        let prefix = if p.rel.is_empty() || p.rel == "." {
            ""
        } else {
            p.rel.as_str()
        };
        let matches = if prefix.is_empty() {
            rel.starts_with("src/")
        } else {
            rel == prefix || rel.starts_with(&format!("{prefix}/"))
        };
        if matches {
            if best.is_none_or(|b| p.rel.len() >= b.rel.len()) {
                best = Some(p);
            }
        }
    }
    match best {
        Some(p) => (p.name.clone(), p.rel.clone()),
        None => ("crate".into(), String::new()),
    }
}

fn collect_loose_rs(dir: &Path, package: &str, crate_root: &str) -> Result<Vec<FileJob>> {
    let root = if crate_root.is_empty() { dir } else { dir };
    let walk_root = if dir.join("src").is_dir() {
        dir.join("src")
    } else {
        dir.to_path_buf()
    };
    let mut jobs = Vec::new();
    for entry in WalkDir::new(&walk_root).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) != Some("rs") {
            continue;
        }
        if path.components().any(|c| c.as_os_str() == "tests") {
            continue;
        }
        if skip_dir(path) {
            continue;
        }
        let meta = match path.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };
        if meta.len() > MAX_FILE_BYTES {
            eprintln!("warn: skip large file {}", path.display());
            continue;
        }
        let rel = if crate_root.is_empty() {
            path_relative(dir, path)
        } else {
            let parent =
                dir.parent()
                    .and_then(|p| if crate_root.is_empty() { None } else { Some(p) });
            let _ = parent;
            // repo-relative: crate_root + path relative to package dir
            let inner = path_relative(dir, path);
            if crate_root == "." || crate_root.is_empty() {
                inner
            } else {
                format!("{crate_root}/{inner}")
            }
        };
        let source = match fs::read_to_string(path) {
            Ok(s) => s,
            Err(e) => {
                eprintln!("warn: read {}: {e}", path.display());
                continue;
            }
        };
        jobs.push(FileJob {
            rel,
            _abs: path.to_path_buf(),
            package: package.to_string(),
            crate_root: crate_root.to_string(),
            source,
        });
        let _ = root;
    }
    Ok(jobs)
}

fn skip_dir(path: &Path) -> bool {
    path.components().any(|c| {
        matches!(
            c.as_os_str().to_str(),
            Some("target" | "node_modules" | ".git" | "out" | "vendor")
        )
    })
}

pub fn path_relative(root: &Path, file: &Path) -> String {
    file.strip_prefix(root)
        .unwrap_or(file)
        .to_string_lossy()
        .replace('\\', "/")
}

pub fn load_hints(root: &Path) -> graphide_ir::HintFile {
    let mut flows = Vec::new();
    for entry in WalkDir::new(root).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.file_name().and_then(|s| s.to_str()) != Some("flows.toml") {
            continue;
        }
        if skip_dir(path) {
            continue;
        }
        let rel = path_relative(root, path);
        if rel.contains("fixtures/") || rel.contains("/tests/") {
            continue;
        }
        if let Ok(text) = fs::read_to_string(path) {
            if let Ok(h) = graphide_engine::hints_from_toml(&text) {
                flows.extend(h.flows);
            }
        }
    }
    graphide_ir::HintFile { flows }
}
