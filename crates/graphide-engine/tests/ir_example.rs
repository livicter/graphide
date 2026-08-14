use graphide_engine::{derive_repo, ReviewInput, ReviewOptions};
use graphide_ir::*;

fn bus_extract() -> Extract {
    Extract {
        plugin: "rust@0.1.0".into(),
        file: "src/bus.rs".into(),
        nodes: vec![
            NodeDef {
                fqn: "crate::bus::Bus".into(),
                kind: NodeKind::Type,
                span: span("src/bus.rs", 1, 1, 12, 2),
                endpoint: None,
            },
            NodeDef {
                fqn: "crate::bus::Bus::publish".into(),
                kind: NodeKind::Function,
                span: span("src/bus.rs", 4, 5, 8, 6),
                endpoint: None,
            },
            NodeDef {
                fqn: "crate::bus::events".into(),
                kind: NodeKind::Endpoint,
                span: span("src/bus.rs", 10, 1, 10, 40),
                endpoint: Some(EndpointMeta {
                    role: EndRole::Sink,
                    channel: EndChannel::Channel,
                }),
            },
        ],
        refs: vec![
            Ref {
                from: "crate::bus::Bus".into(),
                to: Some("crate::bus::Bus::publish".into()),
                kind: EdgeKind::Contains,
                span: span("src/bus.rs", 4, 5, 4, 20),
            },
            Ref {
                from: "crate::bus::Bus::publish".into(),
                to: Some("crate::bus::events".into()),
                kind: EdgeKind::Publishes,
                span: span("src/bus.rs", 6, 9, 6, 28),
            },
        ],
    }
}

fn sub_extract() -> Extract {
    Extract {
        plugin: "rust@0.1.0".into(),
        file: "src/sub.rs".into(),
        nodes: vec![NodeDef {
            fqn: "crate::sub::subscribe".into(),
            kind: NodeKind::Function,
            span: span("src/sub.rs", 3, 1, 20, 2),
            endpoint: None,
        }],
        refs: vec![
            Ref {
                from: "crate::sub::subscribe".into(),
                to: Some("crate::bus::events".into()),
                kind: EdgeKind::Subscribes,
                span: span("src/sub.rs", 8, 5, 8, 31),
            },
            Ref {
                from: "crate::sub::subscribe".into(),
                to: Some("crate::bus::Bus".into()),
                kind: EdgeKind::TypeUses,
                span: span("src/sub.rs", 3, 21, 3, 24),
            },
        ],
    }
}

fn span(file: &str, sl: u32, sc: u32, el: u32, ec: u32) -> Span {
    Span {
        file: file.into(),
        start: Pos {
            line: sl,
            column: sc,
        },
        end: Pos {
            line: el,
            column: ec,
        },
    }
}

#[test]
fn ir_md_steiner_is_subscribes_edge() {
    let snap = derive_repo(
        ReviewInput {
            head_extracts: vec![bus_extract(), sub_extract()],
            parent_extracts: None,
            hints: HintFile {
                flows: vec![FlowHint {
                    name: "data-subscription".into(),
                    hits: vec!["crate::sub::subscribe".into(), "crate::bus::events".into()],
                }],
            },
            head_sources: Default::default(),
            parent_sources: Default::default(),
            previous_bubbles: None,
        },
        &ReviewOptions {
            plugin: "rust@0.1.0".into(),
        },
    );
    assert!(snap.findings.is_empty(), "{:?}", snap.findings);
    let flow = &snap.flows[0];
    assert_eq!(flow.tree.edges.len(), 1);
    assert_eq!(flow.tree.edges[0].kind, EdgeKind::Subscribes);
    // TypeUses to Bus is off-tree
    assert_eq!(flow.tree.nodes.len(), 2);
}
