# Review IDE — Language-agnostic IR

Sketch. Product decisions live in [SPEC.md](SPEC.md). This file is the data those decisions imply.

Identity is `(kind, fqn)`. Spans are evidence. If it has no span, it is not in the IR.

Three layers:

1. **Extract** — per file, plugin output
2. **Linked** — whole-program graph, engine output
3. **Derived** — bubbles, flows, slices, stamps, coverage. Not plugin-authored.

---

## 0. Shared types

```
Pos        { line: u32, column: u32 }     // 1-based
Span       { file: string, start: Pos, end: Pos }
NodeKind   Function | Type | Endpoint
EdgeKind   Calls | Reads | Writes | Imports | TypeUses | Contains | Publishes | Subscribes
EndRole    Source | Sink
EndChannel Http | Queue | Table | Channel | File
NodeId     hash(kind, fqn)                // engine-assigned after extract
```

`file` is repo-relative, `/` separated, no `..`.

FQN is an opaque string. The plugin defines the scheme. Defs and refs of that plugin must use the same strings. The engine never parses them.

---

## 1. Extract IR

One document per file. Tree-sitter queries and wasm both serialize this.

```
Extract {
  plugin: string,          // e.g. "rust@1.2.0"
  file: string,
  nodes: NodeDef[],
  refs:  Ref[]
}

NodeDef {
  fqn: string,
  kind: NodeKind,
  span: Span,              // span.file must equal Extract.file
  endpoint: EndpointMeta?  // required iff kind == Endpoint, else absent
}

EndpointMeta {
  role: EndRole,
  channel: EndChannel
}

Ref {
  from: string,            // FQN of the enclosing NodeDef in this file
  to: string?,             // FQN if this file can resolve it; null = unresolved
  kind: EdgeKind,
  span: Span
}
```

Rules:

- Drop any `NodeDef` or `Ref` with a missing or cross-file span.
- Drop `NodeDef` with `kind == Endpoint` and no `endpoint`.
- Drop `Ref` with `to == null` at link time. Unresolved is not an edge.
- `Contains` is a `Ref` like any other (`from` parent, `to` child).
- Duplicate `(kind, fqn)` in one extract: plugin bug, drop extras as findings.

Wasm ABI is this document. Input: the file bytes plus path. Output: `Extract`. No other syscalls.

---

## 2. Linked IR

Engine hash-joins `Ref.to` to `NodeDef.fqn` where `EdgeKind` does not constrain kind (a `Calls` ref should land on a `Function`, a `TypeUses` on a `Type`, `Publishes`/`Subscribes` on an `Endpoint` or `Function`, `Contains` on any). Mismatched kind: not an edge, finding.

```
Graph {
  nodes: Node[],
  edges: Edge[]
}

Node {
  id: NodeId,
  fqn: string,
  kind: NodeKind,
  span: Span,
  endpoint: EndpointMeta?
}

Edge {
  from: NodeId,
  to: NodeId,
  kind: EdgeKind,
  span: Span
}
```

Weights are not stored. The engine applies them at cluster time:

| kind                         | cluster weight |
|------------------------------|----------------|
| Calls, Reads, Writes         | 1.0            |
| Publishes, Subscribes        | 1.0            |
| Imports, TypeUses            | 0.25           |
| Contains                     | 0 (hierarchy)  |

`0.25` is a sketch default for "weighs less", not a measured constant.

A **changed node** (coverage) is a `NodeId` whose span contents changed, or that gained/lost incident edges, between two `Graph`s. Match across revisions by `(kind, fqn)`.

---

## 3. Derived IR

Computed from `Graph`. Never written by a plugin or an agent.

### Bubbles

Recursive clustering on weighted edges. `Contains` builds a separate parent map, not cluster input.

```
Bubble {
  id: BubbleId,            // sticky: matched to previous cut by member overlap
  parent: BubbleId?,       // null at coarse level (first cut under the program)
  members: NodeId[],       // nodes at this altitude; children bubbles sit under parent
  label: string            // PageRank member FQN, or a landing hint name
}
```

Coarse communities = bubbles with `parent == null`.

### Hints (sidecar, engine-parsed)

Not graph nodes.

```
HintFile {
  flows: FlowHint[]
}

FlowHint {
  name: string,
  hits: string[]           // FQNs
}
```

`flows.toml`:

```toml
[[flow]]
name = "data-subscription"
hits = ["crate::sub::subscribe", "crate::bus::Bus"]
```

A hit that does not resolve to a `NodeId` is a finding.

### Flow and slice

```
HitSet  NodeId[]           // resolved hits; if len == 1, add nearest Entry and Sink
Entry   Endpoint where role == Source, else a Function with in-degree 0
Sink    Endpoint where role == Sink, else a Function with out-degree 0

Flow {
  name: string,
  hits: HitSet,
  tree: Steiner              // edges of the Steiner tree on Graph
}

Steiner {
  nodes: NodeId[],
  edges: Edge[]              // subset of Graph.edges
}
```

Slice lighting:

- outermost view: only `Steiner.nodes` / runs. Off-tree nodes absent.
- inner view (inside a bubble): children present; on-tree lit; others grey by graph distance to the tree.

### Flowchart (layout, per flow)

```
Run {
  id: RunId,
  bubble: BubbleId,          // coarse bubble this run stays inside
  nodes: NodeId[]            // consecutive Steiner nodes in that bubble
}

Flowchart {
  runs: Run[],
  spine: { from: RunId, to: RunId }[]   // tree of runs (Steiner may branch)
  positions: { run: RunId, x: f32, y: f32 }[]
}
```

A run is a maximal consecutive sequence of Steiner nodes that share a coarse bubble. Re-entering later = a new `Run` with a new id.

`positions` are stored on stamp so recheck can overlay scars.

### Stamp

```
Stamp {
  name: string,
  hits: string[],            // FQNs, not NodeIds, so rename is a broken hit
  tree: { from: string, to: string, kind: EdgeKind }[],  // FQN pairs
  positions: { run_key: string, x: f32, y: f32 }[]
  deriver: string            // recorded, not pinned; recheck uses latest
}
```

`run_key` sketch: `bubble_label + visit_index`.

Recheck: latest plugin → new `Graph` → resolve `hits` → new Steiner → diff against `Stamp.tree` by FQN pairs. Overlay new runs on `positions`.

### Coverage

```
Coverage {
  changed: NodeId[],
  uncovered: NodeId[]        // changed, not on any proposed Flow.tree
}
```

Incomplete iff `uncovered` is non-empty.

### Architecture Delta

Two `Graph`s. Pair by `(kind, fqn)` (the same identity Coverage uses). The
deriver still owns both sides — no authored Archify ids, no agent-drawn
topology.

```
DeltaFact {
  status: Added | Removed | Changed | Moved | Rerouted
  class:  Semantic | Topology | Presentation
  subject, fqn, from_fqn?, to_fqn?, edge_kind?, file?, detail
}

ArchitectureDelta {
  facts: DeltaFact[]
  added, removed, changed, moved, rerouted: u32
  parent: Graph?             // Before reading; absent when no parent
}
```

- **Added / removed** — identity only on one side (`semantic` for nodes,
  `topology` for hops).
- **Changed** — same identity, span text or incident edges differ (`semantic`).
- **Moved** — same identity, `span.file` differs (`presentation`).
- **Rerouted** — a hop kept `from`+kind (or `to`+kind) and changed the other
  end (`topology`).

Truth before spectacle: the list is exact facts. It does not infer blast
radius, merge safety, or risk.

---

## 4. Findings (not graph)

```
Finding {
  kind:
    | UnmatchedHint { flow, fqn }
    | DuplicateFqn { kind, fqn }
    | SpanlessDrop { plugin, file }
    | KindMismatch { from, to, edge }
    | UncoveredNode { fqn }
    | StampBroken { flow, added: Edge[], removed: Edge[] }
    | PluginBug { message }
  span: Span?
}
```

---

## 5. Mini example

Two files, one proposed flow. Linked graph, then Steiner.

`src/bus.rs` extract:

```json
{
  "plugin": "rust@0.1.0",
  "file": "src/bus.rs",
  "nodes": [
    {
      "fqn": "crate::bus::Bus",
      "kind": "Type",
      "span": { "file": "src/bus.rs", "start": { "line": 1, "column": 1 }, "end": { "line": 12, "column": 2 } }
    },
    {
      "fqn": "crate::bus::Bus::publish",
      "kind": "Function",
      "span": { "file": "src/bus.rs", "start": { "line": 4, "column": 5 }, "end": { "line": 8, "column": 6 } }
    },
    {
      "fqn": "crate::bus::events",
      "kind": "Endpoint",
      "span": { "file": "src/bus.rs", "start": { "line": 10, "column": 1 }, "end": { "line": 10, "column": 40 } },
      "endpoint": { "role": "Sink", "channel": "Channel" }
    }
  ],
  "refs": [
    { "from": "crate::bus::Bus", "to": "crate::bus::Bus::publish", "kind": "Contains",
      "span": { "file": "src/bus.rs", "start": { "line": 4, "column": 5 }, "end": { "line": 4, "column": 20 } } },
    { "from": "crate::bus::Bus::publish", "to": "crate::bus::events", "kind": "Publishes",
      "span": { "file": "src/bus.rs", "start": { "line": 6, "column": 9 }, "end": { "line": 6, "column": 28 } } }
  ]
}
```

`src/sub.rs` extract:

```json
{
  "plugin": "rust@0.1.0",
  "file": "src/sub.rs",
  "nodes": [
    {
      "fqn": "crate::sub::subscribe",
      "kind": "Function",
      "span": { "file": "src/sub.rs", "start": { "line": 3, "column": 1 }, "end": { "line": 20, "column": 2 } }
    }
  ],
  "refs": [
    { "from": "crate::sub::subscribe", "to": "crate::bus::events", "kind": "Subscribes",
      "span": { "file": "src/sub.rs", "start": { "line": 8, "column": 5 }, "end": { "line": 8, "column": 31 } } },
    { "from": "crate::sub::subscribe", "to": "crate::bus::Bus", "kind": "TypeUses",
      "span": { "file": "src/sub.rs", "start": { "line": 3, "column": 21 }, "end": { "line": 3, "column": 24 } } }
  ]
}
```

Sidecar:

```toml
[[flow]]
name = "data-subscription"
hits = ["crate::sub::subscribe", "crate::bus::events"]
```

Steiner of those two hits is the `Subscribes` edge (and the nodes it connects). `TypeUses` to `Bus` is off-tree: absent from the coarse flowchart, visible as a grey sibling if you enter the bubble that contains `subscribe`.

If an agent also changed `crate::bus::Bus::publish` and did not list it on any flow, coverage flags it uncovered. Adding it as a hit bends this Steiner or forces a second proposed flow.

---

## 6. What is not in the IR

- Source text (the pane reads the file)
- Layout of inner cluster views (recomputed on enter; only flowchart `positions` persist on stamp)
- Plugin query files / wasm bytes (installed artifacts, not repo IR)
- Git. The graph diffs two `Graph` values. VCS is a supplier of file bytes.
