# Ego

Isolate the selected derived node and its k-hop neighborhood on existing
edges. Blast-radius chrome already on the desk (`#egoBtn`, `#egoHops`,
`applyEgoPaint`). Not a second graph, not an agent-drawn radius, and not
a Map rewrite. Lineage is the directed reading of the same neighborhood.

## Sub-features

- Graph-bar `#egoBtn` (Ego). `E` toggles. `#egoHops` is 1 or 2 on derived
  edges (`neighborhood` / `incidentEdges`). Hop wrap `.ego-hops` shows
  only while Ego is on.
- With a selected node, `applyEgoPaint` lights neighbors (`.ego`) and dims
  the rest (`.ego-dim`) on existing `.vnode` / `.comm-node` / `.ego-node`.
  `data-dist` is the hop distance from the focus.
- Hosts: Map enter-bubble (`#enterCanvas`), Slice (`#sliceCanvas`), and
  Lineage (`#lineageCanvas`). Map altitude stays community LOD (`.bubble-card`,
  `xy=0`) — Ego paints after Enter or on Slice / Lineage, not by turning
  Map into XYFlow.
- Lineage auto-on (`setWorkspace("lineage")`). Depth is the same
  `#egoHops`. Changing hops rebuilds the directed walk.
- Stamp / skip stay human. Ego never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open Map and enter a community, or open Slice / Lineage.
2. Click a derived node (or a ledger cell) so it is selected.
3. Click **Ego** (`#egoBtn`) or press `E`. Neighbors stay lit; the rest
   dim. Switch `#egoHops` from 1 to 2 to widen the neighborhood.
4. Click **Ego** again to clear the dim. Lineage stays a directed ego of
   the focus even when the toggle is off.

The in-tree proof is the explorer Map enter-bubble plus `fixtures/demo`
Lineage (`encode` callers / callees).

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Enter a `.bubble-card`, click a `#enterCanvas .vnode`, then `#egoBtn`.
`#egoHops` 1 vs 2. Toggle off. Repeat on Slice. Then:

```
extension/scripts/webview-harness.html?lineage=1&probe=0&require=1&ws=lineage
```

Lineage lands with Ego on. Change `#egoHops` 1 → 2 (wider walk).

Driver assertions:

- `#egoBtn` toggles `.on`; `#egoHops` is `1` or `2`
- with a selected node, `.ego` ≥ 1 and `.ego-dim` ≥ 1 on enter or Slice
- Slice Ego on `n0`: off-slice `n12` is `.ego` at opacity 1; other
  `data-slice-dist="1"` nodes that are `.ego-dim` are at most 0.12
  (`EG3c`, `verification/slice-ego.png`)
- physics enter: Ego on `n164` lights `b-physics-a` (`.ego`, `data-dist` 1) and leaves `b-physics-b` dim (`data-dist` 2). Both stay `data-shape="type"`. Screenshot `verification/ego-community.png`
- 2-hop dims fewer (or equal) nodes than 1-hop
- Ego off removes `.ego-dim`
- Lineage keeps a focus `.ego` / `[data-side=focus]`; hops 1 vs 2 changes
  `#lineageCanvas` node count
- screenshot `verification/ego.png` is not a black frame
- Map altitude after Back is still `xy=0`
- `.graphide/stamps/` is still empty

## Gotchas

- `E` is Ego. Do not steal it for Export (that's `#exportBtn`).
- Neighborhood is undirected derived edges. Lineage is the directed
  Calls / data-hop reading of one symbol. Do not merge the two walks.
- A child community's shown id is the bubble id. Its graph neighbors
  are member ids. Ego lights that community when a member is inside
  the hop depth. `data-dist` is the nearest member, not 99. Do not
  turn the community into a store.
- `#enterCanvas .vnode.grey` is 0.48. Ego has to beat that: neighbors
  `#enterCanvas .vnode.ego` at full opacity, the rest
  `#enterCanvas .vnode.ego-dim` at 0.12.
- Slice distance grey (`data-slice-dist`) must not cover Ego. On the
  explorer Slice, Ego on `n0` lights off-slice `n12` at opacity 1 and
  dims the other distance-1 nodes to at most 0.12 (`EG3c`,
  `verification/slice-ego.png`).
- Do not add `data-component` / `data-testid`. `#egoBtn`, `#egoHops`,
  `.ego`, `.ego-dim`, `data-dist` are the hooks.
- `applyEgoPaint` must keep classes on XYFlow `.vnode` after remount
  (`stampXyFlowAttrs` + paint flags on enter / slice / lineage props).
- Do not React-mount Map community LOD. Enter / Slice / Lineage already
  host XYFlow.
