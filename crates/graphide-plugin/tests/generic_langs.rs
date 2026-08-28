//! Query plugins emit the closed IR vocabulary for any language, not one project.

use graphide_engine::{derive_repo, ReviewInput, ReviewOptions};
use graphide_ir::*;
use graphide_plugin::extract_file;

fn extract(rel: &str, src: &str) -> Extract {
    extract_file(rel, src)
        .unwrap()
        .expect("plugin for extension")
        .extract
}

#[test]
fn python_call_and_class_method() {
    let src = r#"
class Bus:
    def publish(self, ev):
        pass

def subscribe(bus):
    bus.publish("x")
    helper()

def helper():
    return 1
"#;
    let e = extract("pkg/bus.py", src);
    assert!(e
        .nodes
        .iter()
        .any(|n| n.fqn == "pkg.bus.Bus" && n.kind == NodeKind::Type));
    assert!(e
        .nodes
        .iter()
        .any(|n| n.fqn == "pkg.bus.Bus.publish" && n.kind == NodeKind::Function));
    assert!(e.refs.iter().any(|r| {
        r.from == "pkg.bus.subscribe"
            && r.to.as_deref() == Some("pkg.bus.helper")
            && r.kind == EdgeKind::Calls
    }));
}

#[test]
fn javascript_call() {
    let src = r#"
function helper() { return 1; }
function subscribe() { helper(); }
"#;
    let e = extract("src/sub.js", src);
    assert!(e.refs.iter().any(|r| {
        r.from.ends_with("subscribe")
            && r.to.as_deref().is_some_and(|t| t.ends_with("helper"))
            && r.kind == EdgeKind::Calls
    }));
}

#[test]
fn typescript_call() {
    let src = r#"
function helper(): number { return 1; }
function subscribe(): number { return helper(); }
"#;
    let e = extract("src/sub.ts", src);
    assert!(e.refs.iter().any(|r| r.kind == EdgeKind::Calls));
}

#[test]
fn c_call() {
    let src = r#"
int helper(void) { return 1; }
int subscribe(void) { return helper(); }
"#;
    let e = extract("sim/core.c", src);
    assert_eq!(e.plugin, "c@0.1.0");
    assert!(e
        .nodes
        .iter()
        .any(|n| n.fqn.ends_with("helper") && n.kind == NodeKind::Function));
    assert!(e.refs.iter().any(
        |r| r.kind == EdgeKind::Calls && r.to.as_deref().is_some_and(|t| t.ends_with("helper"))
    ));
}

#[test]
fn cpp_call() {
    let src = r#"
int helper() { return 1; }
int subscribe() { return helper(); }
"#;
    let e = extract("sim/core.cpp", src);
    assert!(e
        .nodes
        .iter()
        .any(|n| n.fqn.ends_with("helper") && n.kind == NodeKind::Function));
    assert!(e.refs.iter().any(
        |r| r.kind == EdgeKind::Calls && r.to.as_deref().is_some_and(|t| t.ends_with("helper"))
    ));
}

#[test]
fn go_call() {
    let src = r#"
package p
func helper() int { return 1 }
func Subscribe() int { return helper() }
"#;
    let e = extract("p/sub.go", src);
    assert!(e.refs.iter().any(|r| r.kind == EdgeKind::Calls));
}

#[test]
fn python_type_uses() {
    let src = r#"
class Bus:
    pass

def subscribe(b: Bus):
    return b
"#;
    let e = extract("pkg/bus.py", src);
    assert!(e.refs.iter().any(|r| {
        r.kind == EdgeKind::TypeUses
            && r.from.ends_with("subscribe")
            && r.to.as_deref().is_some_and(|t| t.ends_with("Bus"))
    }));
}

#[test]
fn javascript_type_uses() {
    let src = r#"
class Bus {}
function subscribe() { return new Bus(); }
"#;
    let e = extract("src/bus.js", src);
    assert!(e.refs.iter().any(|r| {
        r.kind == EdgeKind::TypeUses
            && r.from.ends_with("subscribe")
            && r.to.as_deref().is_some_and(|t| t.ends_with("Bus"))
    }));
}

#[test]
fn typescript_type_uses() {
    let src = r#"
class Bus {}
function subscribe(b: Bus): Bus { return b; }
"#;
    let e = extract("src/bus.ts", src);
    assert!(e.refs.iter().any(|r| {
        r.kind == EdgeKind::TypeUses
            && r.from.ends_with("subscribe")
            && r.to.as_deref().is_some_and(|t| t.ends_with("Bus"))
    }));
}

#[test]
fn c_type_uses() {
    let src = r#"
struct Bus { int x; };
int subscribe(struct Bus b) { return b.x; }
"#;
    let e = extract("sim/bus.c", src);
    assert!(e.refs.iter().any(|r| r.kind == EdgeKind::TypeUses));
}

#[test]
fn go_type_uses() {
    let src = r#"
package p
type Bus struct{}
func subscribe(b Bus) Bus { return b }
"#;
    let e = extract("p/bus.go", src);
    assert!(e
        .refs
        .iter()
        .any(|r| { r.kind == EdgeKind::TypeUses && r.from.ends_with("subscribe") }));
}

#[test]
fn python_import_typeuses() {
    let src = r#"
from pkg.bus import Bus

def subscribe(b: Bus):
    return b
"#;
    let e = extract("pkg/sub.py", src);
    assert!(e.refs.iter().any(|r| {
        r.kind == EdgeKind::TypeUses
            && r.from.ends_with("subscribe")
            && r.to.as_deref() == Some("pkg.bus.Bus")
    }));
    assert!(e.refs.iter().any(|r| {
        r.kind == EdgeKind::Imports
            && r.from.ends_with("subscribe")
            && r.to.as_deref() == Some("pkg.bus.Bus")
    }));
}

#[test]
fn javascript_import_typeuses() {
    let src = r#"
import { Bus } from './bus.js';
function subscribe() { return new Bus(); }
"#;
    let e = extract("src/sub.js", src);
    assert!(e.refs.iter().any(|r| {
        r.kind == EdgeKind::TypeUses
            && r.from.ends_with("subscribe")
            && r.to.as_deref() == Some("bus.Bus")
    }));
    assert!(e.refs.iter().any(|r| {
        r.kind == EdgeKind::Imports
            && r.from.ends_with("subscribe")
            && r.to.as_deref() == Some("bus.Bus")
    }));
}

#[test]
fn typescript_import_typeuses() {
    let src = r#"
import { Bus } from './bus';
function subscribe(b: Bus): Bus { return b; }
"#;
    let e = extract("src/sub.ts", src);
    assert!(
        e.refs.iter().any(|r| {
            r.kind == EdgeKind::TypeUses
                && r.from.ends_with("subscribe")
                && r.to.as_deref() == Some("bus.Bus")
        }),
        "refs={:?}",
        e.refs
            .iter()
            .map(|r| format!("{:?} {} -> {:?}", r.kind, r.from, r.to))
            .collect::<Vec<_>>()
    );
    assert!(e.refs.iter().any(|r| {
        r.kind == EdgeKind::Imports
            && r.from.ends_with("subscribe")
            && r.to.as_deref() == Some("bus.Bus")
    }));
}

#[test]
fn python_import_calls_join() {
    let bus = extract(
        "pkg/bus.py",
        "class Bus:\n    pass\ndef helper():\n    return 1\n",
    );
    let sub = extract(
        "pkg/sub.py",
        "from pkg.bus import helper\ndef subscribe():\n    helper()\n",
    );
    assert!(sub
        .refs
        .iter()
        .any(|r| { r.kind == EdgeKind::Calls && r.to.as_deref() == Some("pkg.bus.helper") }));
    assert!(sub
        .refs
        .iter()
        .any(|r| { r.kind == EdgeKind::Imports && r.to.as_deref() == Some("pkg.bus.helper") }));
    let snap = derive_repo(
        ReviewInput {
            head_extracts: vec![bus, sub],
            parent_extracts: None,
            hints: HintFile { flows: vec![] },
            head_sources: Default::default(),
            parent_sources: Default::default(),
            previous_bubbles: None,
        },
        &ReviewOptions {
            plugin: "python@0.1.0".into(),
            progress: None,
            preview: None,
        },
    );
    assert!(snap.graph.edges.iter().any(|e| e.kind == EdgeKind::Calls));
}

#[test]
fn python_plain_import_map() {
    let src = r#"
import pkg.bus as bus

def subscribe(b: bus):
    return b
"#;
    let e = extract("pkg/sub.py", src);
    assert!(
        e.refs.iter().any(|r| {
            r.kind == EdgeKind::Imports
                && r.from.ends_with("subscribe")
                && r.to.as_deref() == Some("pkg.bus")
        }),
        "refs={:?}",
        e.refs
            .iter()
            .map(|r| format!("{:?} {} -> {:?}", r.kind, r.from, r.to))
            .collect::<Vec<_>>()
    );
}

#[test]
fn javascript_object_method_kept() {
    let src = r#"
const audio = {
  construct(target, args) { return new target(...args); }
};
function subscribe() { return audio.construct; }
"#;
    let e = extract("wasm/restart-audio-context.js", src);
    assert!(
        e.nodes
            .iter()
            .any(|n| n.fqn.ends_with("construct") && n.kind == NodeKind::Function),
        "nodes={:?}",
        e.nodes.iter().map(|n| n.fqn.as_str()).collect::<Vec<_>>()
    );
}

#[test]
fn javascript_class_method_contains() {
    let src = r#"
class Bus {
  publish() { return 1; }
}
function subscribe() { return new Bus(); }
"#;
    let e = extract("src/bus.js", src);
    assert!(e
        .nodes
        .iter()
        .any(|n| n.fqn == "bus.Bus.publish" && n.kind == NodeKind::Function));
    assert!(e.refs.iter().any(|r| {
        r.from == "bus.Bus"
            && r.to.as_deref() == Some("bus.Bus.publish")
            && r.kind == EdgeKind::Contains
    }));
}

#[test]
fn c_include_imports() {
    let src = r#"
#include "Bus.h"
int subscribe(Bus b) { return b.x; }
"#;
    let e = extract("sim/sub.c", src);
    assert!(
        e.refs.iter().any(|r| {
            r.kind == EdgeKind::Imports
                && r.from.ends_with("subscribe")
                && r.to.as_deref().is_some_and(|t| t.ends_with("Bus"))
        }),
        "refs={:?}",
        e.refs
            .iter()
            .map(|r| format!("{:?} {} -> {:?}", r.kind, r.from, r.to))
            .collect::<Vec<_>>()
    );
}

#[test]
fn python_endpoint_subscribes() {
    let src = r#"
events = BroadcastChannel()

def subscribe():
    return events
"#;
    let e = extract("pkg/bus.py", src);
    assert!(e
        .nodes
        .iter()
        .any(|n| n.kind == NodeKind::Endpoint && n.fqn.ends_with("events")));
    assert!(e.refs.iter().any(|r| {
        r.kind == EdgeKind::Subscribes
            && r.from.ends_with("subscribe")
            && r.to.as_deref().is_some_and(|t| t.ends_with("events"))
    }));
}

#[test]
fn javascript_endpoint_subscribes() {
    let src = r#"
const events = new BroadcastChannel();
function subscribe() { return events; }
"#;
    let e = extract("src/bus.js", src);
    assert!(e
        .nodes
        .iter()
        .any(|n| n.kind == NodeKind::Endpoint && n.fqn.ends_with("events")));
    assert!(e.refs.iter().any(|r| r.kind == EdgeKind::Subscribes));
}

#[test]
fn rust_still_routed() {
    let src = r#"
pub fn helper() {}
pub fn subscribe() { helper(); }
"#;
    let e = extract("src/lib.rs", src);
    assert_eq!(e.plugin, "rust@0.1.0");
    assert!(e.refs.iter().any(|r| r.kind == EdgeKind::Calls));
}

#[test]
fn every_language_query_compiles() {
    for lang in graphide_plugin::LANGUAGES {
        let q = tree_sitter::Query::new(&(lang.language)(), lang.queries);
        assert!(
            q.is_ok(),
            "{} query does not compile: {:?}",
            lang.id,
            q.err()
        );
    }
}

#[test]
fn smoke_covers_every_compiled_plugin() {
    let out = graphide_plugin::smoke_plugins().expect("smoke plugins");
    let ids: Vec<_> = out.iter().map(|(id, _)| id.as_str()).collect();
    for (id, _) in graphide_plugin::plugin_manifest() {
        assert!(
            ids.contains(&id),
            "installer smoke skipped compiled plugin {id}"
        );
    }
}

#[test]
fn unknown_extension_is_none() {
    assert!(extract_file("notes.md", "# hi").unwrap().is_none());
}

#[test]
fn extract_junk_is_result_not_panic() {
    for (file, src) in [
        ("a.py", "def ("),
        ("a.js", "function {"),
        ("a.ts", "const x:"),
        ("a.go", "func {"),
        ("a.c", "int main("),
        ("src/x.rs", "fn {{{"),
    ] {
        let caught = std::panic::catch_unwind(|| extract_file(file, src));
        assert!(caught.is_ok(), "panicked on {file}");
        assert!(
            caught.is_ok(),
            "{file} panicked instead of returning a Result"
        );
    }
}

#[test]
fn prompt_suffix_hits_are_language_agnostic() {
    let py = extract(
        "a.py",
        "def helper():\n    return 1\ndef subscribe():\n    helper()\n",
    );
    let snap = derive_repo(
        ReviewInput {
            head_extracts: vec![py],
            parent_extracts: None,
            hints: HintFile {
                flows: vec![FlowHint {
                    name: "sub".into(),
                    hits: vec!["subscribe".into(), "helper".into()],
                }],
            },
            head_sources: Default::default(),
            parent_sources: Default::default(),
            previous_bubbles: None,
        },
        &ReviewOptions {
            plugin: "python@0.1.0".into(),
            progress: None,
            preview: None,
        },
    );
    assert!(snap
        .findings
        .iter()
        .all(|f| !matches!(f.kind, FindingKind::UnmatchedHint { .. })));
    assert!(!snap.flows[0].tree.edges.is_empty());
}
