//! Language-agnostic IR matching IR.md.

use serde::{Deserialize, Serialize};
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
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct NodeId(pub u64);

impl NodeId {
    pub fn from_identity(kind: NodeKind, fqn: &str) -> Self {
        let mut hasher = Sha256::new();
        hasher.update(kind.to_string().as_bytes());
        hasher.update(b"\0");
        hasher.update(fqn.as_bytes());
        let digest = hasher.finalize();
        let mut bytes = [0u8; 8];
        bytes.copy_from_slice(&digest[..8]);
        NodeId(u64::from_le_bytes(bytes))
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct BubbleId(pub u64);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct RunId(pub u64);

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
    UnmatchedHint { flow: String, fqn: String },
    DuplicateFqn { node_kind: NodeKind, fqn: String },
    SpanlessDrop { plugin: String, file: String },
    KindMismatch { from: String, to: String, edge: EdgeKind },
    UncoveredNode { fqn: String },
    StampBroken {
        flow: String,
        added: Vec<StampEdge>,
        removed: Vec<StampEdge>,
    },
    PluginBug { message: String },
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
pub struct ReviewSnapshot {
    pub plugin: String,
    pub graph: Graph,
    pub bubbles: Vec<Bubble>,
    pub flows: Vec<FlowView>,
    pub coverage: Coverage,
    pub findings: Vec<Finding>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct FlowView {
    pub name: String,
    pub hits: Vec<String>,
    pub resolved_hits: Vec<NodeId>,
    pub tree: Steiner,
    pub flowchart: Flowchart,
}
