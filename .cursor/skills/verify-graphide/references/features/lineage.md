# Lineage

Directed ego of one derived symbol. Function focus is callers (left) and
callees (right) on `Calls`. Type / Endpoint focus is the data pipeline
(Writes / Publishes upstream, Reads / Subscribes downstream). Not a
force-directed dump of the raw IR and not an agent-drawn graph.

## Sub-features

- Workspace tab `#workspaces [data-ws="lineage"]` (key `3`). Same explorer
  nav row — not a second chrome row or a new workspace button.
- Focus node in the center of `#lineageCanvas`. Left = upstream, right =
  downstream. Depth is `#egoHops` (1 or 2). Ego auto-on.
- Function walk uses `Calls` only. Contains / TypeUses stay off.
- Type / Endpoint walk uses `Reads` / `Writes` / `Publishes` / `Subscribes`
  only. Reads / Subscribes are reversed so the hop is producer → consumer
  (same as Data-flow). Do not invent store nodes.
- Canvas `#lineageCanvas` mounts XYFlow (`.react-flow`, `.react-flow__node`,
  `.ego-node[data-side]`). Each `.vnode` carries `data-shape` (`fn` /
  `endpoint` / `store` when a Type has incident Reads/Writes / `type`).
  Cap 48 nodes / 80 hops, fail closed. Second createRoot on `#lineageCanvas`
  only — chrome stays on `#root`.
- Incident hop list `#lineageHops .expl-card.hop` (capped) and provenance
  buckets `.prov-col[data-prov]` stay HTML. They list the shown directed
  edges only.
- Click a node → `selectNode` + Evidence (`#sourcePane`). Click an edge or
  hop card → highlight that hop (`cursor` / `.on`).
- `coverage.changed` (and optional delta added/changed FQNs) mark `.changed`
  on nodes that sit on this ego. Empty: no selection, or no derived hops.

## How to get to it (user POV)

1. Review a folder that has a derived graph. The desk lands on Overview.
2. Click **Lineage** (`#workspaces [data-ws="lineage"]`) or press `3`, or
   click a node card on Overview / Map.
3. You should see the focus in the middle, callers or writers on the left,
   callees or readers on the right, and an incident hop list. Selecting a
   hop highlights that edge. Stamp / Skip stay human.

The in-tree proof is `fixtures/demo`: `crate::bus::encode` has caller
`publish` and callee `flush`. `crate::bus::events` has publisher `publish`
and subscriber `subscribe`.

## Driving it with the harness

```
./target/debug/graphide review --root fixtures/demo --json --progress --no-parent \
  > extension/scripts/sequence-snap.json
```

Change seed reuses the Architecture Delta snap (demo vs demo-parent):

```
./target/debug/graphide review --root fixtures/demo --parent fixtures/demo-parent \
  --json --progress > extension/scripts/delta-snap.json
```

Then:

```
extension/scripts/webview-harness.html?lineage=1&probe=0&require=1&ws=lineage
```

`lineage=1&require=1` fetches `sequence-snap.json` and **fails closed** if it
is missing or not a ReviewSnapshot (`window.__graphideLineage` after paint,
`window.__graphideSequence` on load). Do not point this gate at the
synthetic explorer fixture.

Driver assertions:

- `#workspaces [data-ws="lineage"]` is on
- Focus node is present (`.ego-node[data-side="focus"]` or
  `window.__graphideLineage.focus`)
- `#lineageCanvas .react-flow__node` length `> 1` and `<= 48` on a fixture
  that has Calls
- At least one upstream (`[data-side="up"]`) and one downstream
  (`[data-side="down"]`) when the fixture has both (demo: `encode` /
  `decode`). If a fixture cannot, use self-review of this checkout.
- Type / Endpoint focus shows Reads / Writes / Publishes / Subscribes, not
  Contains (demo: `events`)
- When `coverage.changed` is present (delta snap), a changed node is marked
  `.changed`
- Evidence still opens from a Lineage node click
- Map still `xy=0` (community LOD, cap 24)
- screenshot `verification/lineage.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- Hops are incident derived edges of the allowed kinds, not Archify
  authored ids. Do not fabricate edges when the walk is empty.
- Data-flow is a Steiner pipeline. Lineage is the directed ego of one
  symbol. Do not merge the two readings.
- Self-review stays `--no-parent` on this checkout. Lineage CI reuses
  `fixtures/demo` Sequence / Delta snaps so shallow Actions clones do not
  flake.
- `LIST_WORKSPACES` does not include `lineage` — the object rail stays.
- Do not add `data-component` / `data-testid`. `[data-ws="lineage"]`,
  `#lineageCanvas .react-flow__node`, `.ego-node[data-side]`,
  `#lineageHops .expl-card.hop` are the product hooks.
- Map stays vanilla community LOD (`renderBubbleMap` cap 24). Do not
  React-mount the raw IR. Lineage XYFlow lives in `#lineageCanvas`.
  Shape is `data-shape` on `.vnode` from `derived-node.jsx`.
- No MiniMap / Controls / Background. No elkjs (CSP Worker). CSP unchanged.
