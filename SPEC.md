# Review IDE — Model Spec

Status: locked from design conversation, 2026-08-13.
This document records decisions. It does not invent new ones.

The product is a review surface for agent-generated changes, sitting on a persistent map derived from source. The human is a reviewer, not a writer. Files and languages are projections. The map is what you review.

---

## 1. Thesis

Human reading is the bottleneck. Agents generate. This IDE speeds review by making the unit of navigation a flow, not a file.

You open a change as a graph diff: bubbles that grew, flows that bent, edges that appeared. You stamp stories. You drop into source when a node is guilty.

## 2. Objects

### Node

A derived thing. Kind is one of:

- `Function` — work
- `Type` — a shape that moves
- `Endpoint` — a source or a sink the plugin can see in AST

An `Endpoint` has:

- role: `Source` | `Sink`
- channel: `Http` | `Queue` | `Table` | `Channel` | `File`

A data endpoint is not every struct. It is a handler, a table, a queue, a channel, or a file resource.

Every node carries:

- kind
- qualified name (FQN), plugin-emitted
- file path
- source span

No span, the node does not exist.

Coverage counts all three kinds.

### Edge

A derived relation. Kind is one of:

- `Calls`
- `Reads`
- `Writes`
- `Imports`
- `TypeUses`
- `Contains`
- `Publishes`
- `Subscribes`

Every edge carries a source span of evidence. No span, it is not an edge.

The engine maps kinds to weights. Plugins do not set weights.

`Calls`, `Reads`, `Writes`, `Publishes`, `Subscribes` weigh more than `Imports` and `TypeUses`. `Contains` is hierarchy only. It is never a clustering edge.

### Bubble

A place. A nested community in the derived graph, cut by recursive clustering, not by folders. File layout can lie.

A bubble has sticky identity across revisions (matched by overlap with the previous cut). Outer bubbles are stickier than inner ones. Names are secondary: a PageRank symbol inside the clump, plus any hint that actually lands.

### Flow

A story. A Steiner tree of a hit set, painted across bubbles. A flow is not a container. Multiple flows may share nodes.

### Slice

The current lighting of one flow. Not a new graph.

### Hint

An agent proposal, never a drawing. Lives only in a sidecar file in the commit. A hint is a flow name plus hit FQNs.

Hits that do not match derived nodes are findings, not labels.

### Stamp

A human attestation that a flow still holds. Agents never stamp.

A stamp stores:

- the hit set (FQNs)
- the Steiner tree snapshot
- the flowchart positions for that flow

"Still holds" means: match the hits in the new graph, re-run Steiner, diff the trees. If the agent inserted a hop, the new tree is different, the stamp breaks. Existence of the old walk is not enough.

Recheck always uses the latest deriver plugin. A plugin bump that changes trees breaks stamps. You restamp. Stamps do not pin plugin version.

## 3. Deriver

The deriver is the only author of the graph. It reads source and AST. Not a binary. "One binary" in the product sense is the outermost bubble: the whole program.

Agent tags cannot draw nodes or edges. Dynamic wiring (DI, string-topic pub/sub, framework magic) is a plugin-pattern problem, not a reason to trust the agent.

A language exists in this IDE when it has a deriver plugin. You install the plugin. The agent that writes the code does not ship it. It is trusted like a compiler, not like a commit.

The engine owns IDs, weights, clustering, Steiner, stamps, coverage, and cross-file linking.

### Closed vocabulary

Plugins must map onto the node and edge kinds above. No open kinds. No plugin-defined weights.

### Plugin shapes

Default: a tree-sitter grammar plus declarative extract queries.

Fallback: a wasm module, source in, spanned nodes and edges out, for languages tree-sitter cannot eat.

Wasm rules: no network, no disk except the files the engine handed it, fuel cap. Both shapes emit the same spanned vocabulary.

### Extract and link

Extract is per file. A plugin returns:

- definitions (nodes with FQN, kind, span)
- raw references (FQN when the file can resolve it, kind, span)

The engine hash-joins FQNs. It does not implement language-specific name lookup. Unresolved references are not edges.

Duplicate FQNs of the same kind are a plugin bug. They are dropped as findings.

Rename breaks hits. That is a finding.

### Sidecar hints

Hints live in a sidecar only. Plugins do not harvest comments or attributes. The engine parses the sidecar, never wasm.

Default location: `flows.toml` at package roots, concatenated.

Default shape:

```toml
[[flow]]
name = "data-subscription"
hits = ["crate::sub::subscribe", "crate::bus::Bus"]
```

The filename and TOML shape are defaults for this spec, not a separate debate.

## 4. Clustering

One clustering on all derived edges, using engine weights. Nested by recursive clustering.

`Contains` edges build hierarchy. They do not vote in the clusterer.

Small edits can reshuffle communities. Identity is sticky-matched across revisions so graph diffs are not noise.

## 5. Flows, slices, coverage

A prompt or a sidecar hint becomes a hit set (FQNs, plus names that match derived FQNs).

The slice is the Steiner tree of those hits: one connecting story.

A single lonely hit also walks to the nearest program entry and a sink so the slice still has pipeline shape. Still paths. Not a blob.

Side hops stay off the tree. That is not a loss. They are caught by entering a bubble on the tree.

### Coverage gate

Every changed derived node must sit on at least one agent-proposed flow's Steiner tree, or the change is incomplete.

Silence is not a strategy. A sneaky helper cannot hide on the dark side of a clean story. It has to be a hit on some flow the reviewer actually sees.

Steiner and coverage do not fight. Steiner keeps one flow readable. Coverage forces extra proposed flows for extra changed nodes.

A changed node is a derived node whose source changed, or whose incident derived edges changed, between the two revisions being reviewed.

The agent proposes (sidecar). The deriver builds the trees. The human stamps or skips.

## 6. Zoom and layout

Layout belongs to the flow, not the repo. A sliced view relayouts around the current Steiner tree as a left-to-right flowchart.

A new prompt is a new flowchart. That jump is on purpose: you asked a different story.

A stamp stores that flowchart's positions. Recheck lays the new tree onto the old positions so an inserted hop is a scar, not a reshuffled city.

### Outermost sliced view

The flowchart is Steiner-only. Off-tree nodes leave this canvas.

A box on the flowchart is a run: consecutive Steiner nodes that share a bubble collapse to one box. If the tree leaves a bubble and comes back later, that is a second box (same place, second visit). Steiner can branch, so the chart is a tree of runs, not only a line.

Runs collapse at coarse communities: the first clustering cut under the program.

Pan and geometric scale stay on this canvas. They do not change altitude.

### Enter

Entering a box is a world jump, one clustering level down. It is not camera zoom.

Inside a bubble the Steiner-only rule dies. If it did not, off-tree siblings would still be gone. The inner world is that bubble's children at the next altitude, not a dump of every function. The walk that passed through is lit. Sibling child-bubbles stay, grey. Grey-by-distance lives here, not on the outermost flowchart.

Repeat until the cluster is functions, types, and endpoints.

### Leaf and source

Entering a leaf node opens source in a pane beside the cluster. The map stays. The node's source range is highlighted. Closing the pane returns full attention to the cluster.

Zoom-out pops one clustering level.

Files are a projection. The pane is that projection.

## 7. Review loop

1. Deriver builds the graph from source for parent and head.
2. Sidecar on head proposes flows (names + hit FQNs).
3. Engine builds a Steiner tree per proposed flow. Unmatched hits are findings.
4. Coverage: every changed node must sit on at least one of those trees. Uncovered nodes block completeness.
5. Reviewer opens each proposed flow as a coarse flowchart, enters bubbles, opens source panes, stamps or skips.
6. A stamp is the hit set, tree, and flowchart positions.
7. Later recheck: latest deriver, same hits, new Steiner, tree diff against the snapshot, overlay on stored positions.

The unit you approve is a flow. Not a bubble, not a git commit. Shipping policy on top of incomplete coverage is out of this spec.

## 8. What this spec is not

- An editor. Source is a pane for the guilty node.
- A binary/DWARF/wasm parser.
- A trust in agent-drawn architecture.
- A city map that stays put when you change prompts.
- An open plugin vocabulary.
- In-source `@flow` attributes.

## 9. First slice (when we build)

Not an editor. Point the deriver at one repo, one language plugin (Rust tree-sitter queries). Read `flows.toml`. Show one proposed flow as a coarse Steiner flowchart of subsystem runs. Enter a box to the next altitude (child bubbles, walk lit, siblings grey). Enter a leaf, source pane beside. Coverage list of changed nodes not on any proposed tree.

