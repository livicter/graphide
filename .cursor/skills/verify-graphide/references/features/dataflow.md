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
  `store` / `sink`). Nodes `#dfCanvas .df-node` with `data-fqn` / `data-kind`
  / `data-id` / `data-df-role`. Endpoint role and channel stay on the node
  (`data-end-role`, `data-channel`).
- Ordered hops `#dfHops .df-hop` with `data-df-i`, `data-kind`, `data-from`,
  `data-to`. Reads / Subscribes are reversed so each hop is producer → consumer.
- Canvas `#dfCanvas` mounts XYFlow (`#dfCanvas .react-flow`, `.react-flow__node`)
  for the pipeline (cap 48). Stage strip `#dfStages` and hop list `#dfHops`
  stay HTML. Movement is the hop list.
- Play strip `#dfReview`: `#dfOverview` · `#dfPrev` · `#dfPlay` · `#dfNext` ·
  `#dfStatus`.
- Play (`#dfPlay` / `P` on this workspace) walks hops finitely. At the last
  hop it stops. It does not loop. `[` / `]` step. Same keys as Sequence.
- Engine: `flow_dataflow` reads the current flow's Steiner data edges, plus
  graph Publishes / Subscribes / Reads / Writes that touch a Steiner Endpoint
  (bus hops). No Calls. No TypeUses. No Contains.
- Stamp / skip stay human. Data-flow never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder that has a derived flow (`control-flow` or a sidecar such
   as `data-subscription`). The desk lands on Overview.
2. Click **Data-flow** (`#workspaces [data-ws="dataflow"]`).
3. You should see Sources / Transforms / Stores / Sinks left to right, an
   ordered hop list, and Play / Prev / Next. Selecting a hop highlights that
   producer → consumer.
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
- some hop or node text matches `subscribe` / `publish` / `events`
- `#dfPlay` / `#dfPrev` / `#dfNext` / `#dfOverview` / `#dfCanvas` exist
- `#dfCanvas .react-flow__node` length `> 1` and `<= 48`
- stepping Next past the end stays on the last `data-df-i` (no loop)
- screenshot `verification/dataflow.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- Nodes and hops are Steiner / bus-adjacent derived edges, not Archify
  authored ids. Do not invent hops that are not on the graph.
- Lineage (`data-ws="lineage"`) is still the ego of Used / Informed /
  Generated. Do not merge the two readings.
- Self-review stays `--no-parent` on this checkout. Data-flow CI uses
  `fixtures/demo` so shallow Actions clones do not flake.
- `P` on Data-flow walks hops. `P` on Sequence still walks callers. `P` on
  Delta still walks facts. `P` on Map / Overview still walks the story rail.
- Do not add `data-component` / `data-testid`. `#dfHops`, `#dfStages`,
  `[data-ws="dataflow"]`, `.df-node[data-df-role]`, `#dfCanvas .react-flow__node`
  are the product hooks.
- Do not vendor Archify's Node renderer. XYFlow nodes reuse `.df-node.vnode`
  / kind pills from `main.css`.
