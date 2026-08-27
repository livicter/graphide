//! Language-agnostic IR matching IR.md.

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

use serde::{Deserialize, Deserializer, Serialize, Serializer};
use sha2::{Digest, Sha256};
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Pos {
    pub line: u32,
    pub column: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Span {
    pub file: String,
    pub start: Pos,
    pub end: Pos,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum NodeKind {
    Function,
    Type,
    Endpoint,
}

impl fmt::Display for NodeKind {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            NodeKind::Function => write!(f, "Function"),
            NodeKind::Type => write!(f, "Type"),
            NodeKind::Endpoint => write!(f, "Endpoint"),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum EdgeKind {
    Calls,
    Reads,
    Writes,
    Imports,
    TypeUses,
    Contains,
    Publishes,
    Subscribes,
}

impl EdgeKind {
    pub fn cluster_weight(self) -> f64 {
        match self {
            EdgeKind::Calls | EdgeKind::Reads | EdgeKind::Writes => 1.0,
            EdgeKind::Publishes | EdgeKind::Subscribes => 1.0,
            EdgeKind::Imports | EdgeKind::TypeUses => 0.25,
            EdgeKind::Contains => 0.0,
        }
    }

    pub fn expected_target_kind(self) -> Option<NodeKind> {
        match self {
            EdgeKind::Calls => Some(NodeKind::Function),
            EdgeKind::TypeUses => Some(NodeKind::Type),
            EdgeKind::Contains
            | EdgeKind::Reads
            | EdgeKind::Writes
            | EdgeKind::Imports
            | EdgeKind::Publishes
            | EdgeKind::Subscribes => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum EndRole {
    Source,
    Sink,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum EndChannel {
    Http,
    Queue,
    Table,
    Channel,
    File,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct EndpointMeta {
    pub role: EndRole,
    pub channel: EndChannel,
}

/// Engine-assigned after extract: hash(kind, fqn).
/// Serialized as a decimal string so JS JSON cannot mangle the u64.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct NodeId(pub u64);

impl NodeId {
    pub fn from_identity(kind: NodeKind, fqn: &str) -> Self {
        let mut hasher = Sha256::new();
        hasher.update(kind.to_string().as_bytes());
        hasher.update(b"\0");
        hasher.update(fqn.as_bytes());
        let digest = hasher.finalize();
        let mut bytes = [0u8; 8];
        if let Some(head) = digest.get(..8) {
            if let Ok(arr) = <[u8; 8]>::try_from(head) {
                bytes = arr;
            }
        }
        NodeId(u64::from_le_bytes(bytes))
    }
}

impl Serialize for NodeId {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.0.to_string())
    }
}

impl<'de> Deserialize<'de> for NodeId {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let s = String::deserialize(deserializer)?;
        s.parse().map(NodeId).map_err(serde::de::Error::custom)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct BubbleId(pub u64);

impl Serialize for BubbleId {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.0.to_string())
    }
}

impl<'de> Deserialize<'de> for BubbleId {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let s = String::deserialize(deserializer)?;
        s.parse().map(BubbleId).map_err(serde::de::Error::custom)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct RunId(pub u64);

impl Serialize for RunId {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.0.to_string())
    }
}

impl<'de> Deserialize<'de> for RunId {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let s = String::deserialize(deserializer)?;
        s.parse().map(RunId).map_err(serde::de::Error::custom)
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Extract {
    pub plugin: String,
    pub file: String,
    pub nodes: Vec<NodeDef>,
    pub refs: Vec<Ref>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct NodeDef {
    pub fqn: String,
    pub kind: NodeKind,
    pub span: Span,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub endpoint: Option<EndpointMeta>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Ref {
    pub from: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub to: Option<String>,
    pub kind: EdgeKind,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Graph {
    pub nodes: Vec<Node>,
    pub edges: Vec<Edge>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Node {
    pub id: NodeId,
    pub fqn: String,
    pub kind: NodeKind,
    pub span: Span,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub endpoint: Option<EndpointMeta>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Edge {
    pub from: NodeId,
    pub to: NodeId,
    pub kind: EdgeKind,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Bubble {
    pub id: BubbleId,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent: Option<BubbleId>,
    pub members: Vec<NodeId>,
    pub label: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct HintFile {
    pub flows: Vec<FlowHint>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct FlowHint {
    pub name: String,
    pub hits: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Steiner {
    pub nodes: Vec<NodeId>,
    pub edges: Vec<Edge>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Flow {
    pub name: String,
    pub hits: Vec<NodeId>,
    pub tree: Steiner,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Run {
    pub id: RunId,
    pub bubble: BubbleId,
    pub nodes: Vec<NodeId>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RunSpine {
    pub from: RunId,
    pub to: RunId,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RunPosition {
    pub run: RunId,
    pub x: f32,
    pub y: f32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Flowchart {
    pub runs: Vec<Run>,
    pub spine: Vec<RunSpine>,
    pub positions: Vec<RunPosition>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Stamp {
    pub name: String,
    pub hits: Vec<String>,
    pub tree: Vec<StampEdge>,
    pub positions: Vec<StampPosition>,
    pub deriver: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct StampEdge {
    pub from: String,
    pub to: String,
    pub kind: EdgeKind,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct StampPosition {
    pub run_key: String,
    pub x: f32,
    pub y: f32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Coverage {
    pub changed: Vec<NodeId>,
    pub uncovered: Vec<NodeId>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "PascalCase")]
pub enum FindingKind {
    UnmatchedHint {
        flow: String,
        fqn: String,
    },
    DuplicateFqn {
        node_kind: NodeKind,
        fqn: String,
    },
    SpanlessDrop {
        plugin: String,
        file: String,
    },
    KindMismatch {
        from: String,
        to: String,
        edge: EdgeKind,
    },
    UncoveredNode {
        fqn: String,
    },
    StampBroken {
        flow: String,
        added: Vec<StampEdge>,
        removed: Vec<StampEdge>,
    },
    PluginBug {
        message: String,
    },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Finding {
    #[serde(flatten)]
    pub kind: FindingKind,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub span: Option<Span>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct InnerViewNode {
    pub id: NodeId,
    pub fqn: String,
    pub kind: NodeKind,
    pub lit: bool,
    pub grey: bool,
    pub is_leaf: bool,
    pub distance: Option<u32>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct InnerView {
    pub flow: String,
    pub bubble: u64,
    pub nodes: Vec<InnerViewNode>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct ReviewStats {
    #[serde(default)]
    pub elapsed_ms: u64,
    #[serde(default)]
    pub extract_ms: u64,
    #[serde(default)]
    pub derive_ms: u64,
    #[serde(default)]
    pub files: u32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ReviewSnapshot {
    pub plugin: String,
    pub graph: Graph,
    pub bubbles: Vec<Bubble>,
    pub flows: Vec<FlowView>,
    pub coverage: Coverage,
    pub findings: Vec<Finding>,
    #[serde(default)]
    pub stats: ReviewStats,
    /// Human stamps loaded from `.graphide/stamps` and rechecked on this graph.
    #[serde(default)]
    pub stamps: Vec<StampCheck>,
    /// File-projection of binaries / libs in this graph (SPEC: files are a projection).
    #[serde(default)]
    pub programs: Vec<ProgramView>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ProgramView {
    pub name: String,
    /// `bin`, `lib`, or `pkg` — a file-layout projection, not a plugin kind.
    pub kind: String,
    pub root: String,
    pub entries: Vec<String>,
    pub nodes: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct StampCheck {
    pub name: String,
    pub holds: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct FlowView {
    pub name: String,
    pub hits: Vec<String>,
    pub resolved_hits: Vec<NodeId>,
    pub tree: Steiner,
    pub flowchart: Flowchart,
}

/// Source text covered by a 1-based span. Columns are byte offsets in the line.
pub fn span_snippet(source: &str, span: &Span) -> String {
    let start = pos_to_offset(source, span.start.line, span.start.column);
    let end = pos_to_offset(source, span.end.line, span.end.column);
    let start = source.floor_char_boundary(start.min(source.len()));
    let end = source.ceil_char_boundary(end.min(source.len())).max(start);
    source.get(start..end).unwrap_or("").to_string()
}

fn pos_to_offset(source: &str, line: u32, column: u32) -> usize {
    let mut cur_line = 1u32;
    let bytes = source.as_bytes();
    let mut i = 0usize;
    while i < bytes.len() && cur_line < line {
        if bytes.get(i) == Some(&b'\n') {
            cur_line += 1;
        }
        i += 1;
    }
    i.saturating_add(column.saturating_sub(1) as usize)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn span_snippet_survives_utf8_and_out_of_range() {
        let src = "fn 🦀x() {}";
        let mid = span_snippet(
            src,
            &Span {
                file: "a.rs".into(),
                start: Pos { line: 1, column: 4 },
                end: Pos { line: 1, column: 6 },
            },
        );
        assert!(src.contains(&mid) || mid.is_empty());
        let oob = span_snippet(
            src,
            &Span {
                file: "a.rs".into(),
                start: Pos {
                    line: 99,
                    column: 99,
                },
                end: Pos {
                    line: 200,
                    column: 1,
                },
            },
        );
        assert!(oob.is_empty());
        let empty = span_snippet(
            "",
            &Span {
                file: "a.rs".into(),
                start: Pos { line: 1, column: 1 },
                end: Pos {
                    line: 1,
                    column: 10,
                },
            },
        );
        assert!(empty.is_empty());
    }

    #[test]
    fn node_id_from_identity_is_stable() {
        let a = NodeId::from_identity(NodeKind::Function, "crate::a");
        let b = NodeId::from_identity(NodeKind::Function, "crate::a");
        assert_eq!(a, b);
        assert_ne!(a, NodeId::from_identity(NodeKind::Type, "crate::a"));
    }
}
