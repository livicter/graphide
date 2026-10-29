# Data-flow

Sources, transforms, stores, and sinks along one flow's derived Steiner
(Reads / Writes / Publishes / Subscribes). Not an agent-drawn dataflow JSON.
Pairing stays Graphide IR: Function / Type / Endpoint with role Source|Sink
and channel. Lineage stays the ego of Used / Informed / Generated — this
workspace is the left-to-right pipeline, not a second ego tab.

## Sub-features

- Workspace tab `#workspaces [data-ws="dataflow"]`. Same explorer nav row as
  Sequence — not a second chrome row.
- Stage columns `#dfStages .df-stage[data-df-role]` (`source` / `transform` /
  `store` / `sink`). ADE RDF always paints all four lanes with clickable
  `.df-lane-head[data-df-lane]` headers and `.df-lane-count[data-df-count]`
  badges (empty lanes stay visible as `none`). Clicking a lane toggles
  `dfRoleFilter` and dims sibling lanes/nodes (`.df-lane-dim` / `.df-stage.dim`);
  Escape or Overview clears. Nodes `#dfStages .df-node` / `#dfCanvas .df-node`
  carry `data-fqn` / `data-kind` / `data-id` / `data-df-role` / `data-rdf-meta`
  and show **role · channel · short label** in `.meta` (never file:line).
  Endpoint role/channel stay on attrs (`data-end-role`, `data-channel`).
- Ordered hops `#dfHops .df-hop` with `data-df-i`, `data-kind`, `data-from`,
  `data-to`. Reads / Subscribes are reversed so each hop is producer → consumer.
  The list is that pipeline, sources first. An off-tree publisher is not
  sorted after the hop it feeds. Demo: Publishes `publish → events`, then
  Subscribes `events → subscribe`.
- Canvas `#dfCanvas` mounts XYFlow (`#dfCanvas .react-flow`, `.react-flow__node`)
  for the pipeline (cap 48). Each `.vnode` carries `data-shape` (`start`
  source oval, `store` cylinder when `role==="store"`, `end` sink stadium,
  `fn` / `endpoint` / `type` on transforms). Stage strip `#dfStages` and hop
  list `#dfHops` stay HTML. Movement is the hop list.
- Play strip `#dfReview`: `#dfOverview` · `#dfPrev` · `#dfPlay` · `#dfNext` ·
  `#dfStatus`.
- Play (`#dfPlay` / `P` on this workspace) walks hops finitely. At the last
  hop it stops. It does not loop. `[` / `]` step. Same keys as Sequence.
  ADE RDF: Play / Prev / Next / hop / node clicks stay **graph-only** —
  `focusDfHop` sets `selectedNodeId` only and must not call `peekSource` /
  `showHop` / open Evidence. Screenshot `verification/dataflow-richer-lanes.png`.
  Asserts RDF1–RDF3.

- ADE VTS — Value-trail Sankey: click a `.df-node` to set `valueTrailFocus`.
  `.vts-strip[data-vts="1"]` shows Producers | Focus | Consumers (`.vts-sankey`,
  `.vts-chip`, hop-kind `.vts-flow`). Trail members get `.vts-hit`; others
  `.vts-dim` under `.df-page.vts-filtering`. Clear / Escape clears (graph-only;
  never `peekSource`). Screenshot `verification/value-trail-sankey.png`.
  Asserts VTS1–VTS5.
- Honest empty (`.df-empty[data-df-empty="1"]`) when the flow has no Steiner
  Reads / Writes / Publishes / Subscribes: points to Overview Play and
  Sequence (no invented edges).
- Engine: `flow_dataflow` reads the current flow's Steiner data edges, plus
  graph Publishes / Subscribes / Reads / Writes that touch a Steiner Endpoint
  (bus hops). No Calls. No TypeUses. No Contains.
- Stamp / skip stay human. Data-flow never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder that has a derived flow (`control-flow` or a sidecar such
   as `data-subscription`). The desk lands on Overview.
2. Click **Data-flow** (`#workspaces [data-ws="dataflow"]`).
3. You should see all four Source / Transform / Store / Sink lane headers
   with counts (empty lanes say `none`), an ordered hop list, and Play /
   Prev / Next. Lane headers filter/dim siblings. Selecting a hop or node
   highlights on the graph without opening Evidence. The demo slice is
   Source → Store → Sink.
4. Play walks the list once. Stamp and Skip are still the human attestation
   for flows — they are not this walk.

The in-tree proof is `fixtures/demo`: the same `data-subscription` slice as
`first_slice.rs`. `crate::bus::Bus::publish` Publishes `crate::bus::events`;
`crate::sub::subscribe` Subscribes that bus. Pipeline: Source → Store → Sink.

## Driving it with the harness

```
./target/debug/graphide review --root fixtures/demo --json --progress --no-parent \
  > extension/scripts/dataflow-snap.json
```

Then:

```
extension/scripts/webview-harness.html?dataflow=1&probe=0&require=1&ws=dataflow
```

`dataflow=1&require=1` fetches `dataflow-snap.json` and **fails closed** if it
is missing or not a ReviewSnapshot (`window.__graphideDataflow`). Do not point
this gate at the synthetic explorer fixture.

Driver assertions:

- `#workspaces [data-ws="dataflow"]` is on
- `#dfCanvas .df-node[data-df-role="source"]` length `>= 1`
- `#dfCanvas .df-node[data-df-role="sink"]` length `>= 1`
- `#dfHops .df-hop` length `>= 1` and hops are ordered (`data-df-i`)
- data-subscription hop 0 is Publishes `publish → events`; hop 1 is
  Subscribes `events → subscribe` (`verification/dataflow-order.png`)
- Find on a member file (`sub.rs`) filters `#dfHops` and dims bus.rs nodes (`SG7`, `verification/dataflow-find-file.png`)
- some hop or node text matches `subscribe` / `publish` / `events`
- `#dfStages .df-lane-head[data-df-lane]` length `4` with counts; node `.meta`
  is role·channel (RDF1); lane + Next stay graph-only (RDF2); screenshot
  `verification/dataflow-richer-lanes.png` (RDF3)
- click a `#dfStages .df-node` → `.vts-strip .vts-sankey` producers|focus|consumers; Escape clears (VTS1–VTS3); screenshot `verification/value-trail-sankey.png` (VTS4)
- `#dfPlay` / `#dfPrev` / `#dfNext` / `#dfOverview` / `#dfCanvas` exist
- `#dfCanvas .react-flow__node` length `> 1` and `<= 48`
- stepping Next past the end stays on the last `data-df-i` (no loop)
- screenshot `verification/dataflow.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- Nodes and hops are Steiner / bus-adjacent derived edges, not Archify
  authored ids. Do not invent hops that are not on the graph.
- Lineage (`data-ws="lineage"`) is the directed ego of one symbol (Calls
  for Function; Reads / Writes / Publishes / Subscribes for Type /
  Endpoint). Data-flow is the Steiner pipeline. Do not merge the two readings.
- Self-review stays `--no-parent` on this checkout. Data-flow CI uses
  `fixtures/demo` so shallow Actions clones do not flake.
- `P` on Data-flow walks hops. `P` on Sequence still walks callers. `P` on
  Delta still walks facts. `P` on Map / Overview still walks the story rail.
- Do not add `data-component` / `data-testid`. `#dfHops`, `#dfStages`,
  `[data-ws="dataflow"]`, `.df-node[data-df-role]`, `#dfCanvas .react-flow__node`
  are the product hooks.
- Do not vendor Archify's Node renderer. XYFlow nodes reuse `.df-node.vnode`
  / kind pills from `main.css`. Shape is `data-shape` on `.vnode` from
  `derived-node.jsx`. Do not invent SQL columns.
