# Slice grey

A current-flow Steiner is a lighting mask over the same Overview /
Slice layout. On-tree nodes stay lit; 1-hop off-slice neighbors stay
visible but grey. Not a second canvas, not invented IR, and not an
agent stamp.

## Sub-features

- `desk.js` `treeDistanceMap` BFS from the current flow's
  `tree.nodes` on derived edges (`incidentEdges`). Distance 0 is
  on-tree; 1 is the first off-slice ring.
- `sliceCanvasProps` still lays out the Steiner walk first (cap 48)
  and then fills remaining slots with those neighbors. Overview
  default-run CFG and Slice share `#sliceCanvas`.
- On-tree: `data-lit="1"` / `.vnode.lit`. Off-tree: `data-lit="0"`
  / `.vnode.grey` / `.slice-dim` / `data-slice-dist`.
  `sequence-canvas.jsx` forwards those flags through `DerivedNode`.
- `#prompt` stays `name=hit,hit` (optional). `#tabs` selection
  (including `proposed-uncovered`) drives the same mask via
  `currentFlow()`. Prompt hits become a Steiner only after Review.
- Stamp / skip stay human. Grey-out never posts `{ type: "stamp" }`
  / `{ type: "skip" }`, never writes `.graphide/stamps/`, and never
  writes `flows.toml`.

## How to get to it (user POV)

1. Review a folder (or open the explorer fixture). The desk lands
   on Overview. The default-run CFG already lights the Steiner and
   greys nearby nodes that remain on the desk.
2. Press a `#tabs` chip (`control-flow`, `boot`, or a proposed
   flow). Slice is that cut: walk nodes full, neighbors grey.
3. Stamp and Skip are still the human attestation. A slice is a
   lighting mask, not an approval.

Enter-bubble already does walk lit / siblings grey inside a
community. This gate is the outermost Overview / Slice mask.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map / flow-tab chrome:

```
const tab = document.querySelector('#tabs .tab[data-flow="control-flow"]')
  || document.querySelector('#tabs .tab[data-flow="boot"]');
tab.click();
// #workspaces [data-ws="slice"].on
const nodes = [...document.querySelectorAll("#sliceCanvas .vnode[data-id]")];
// lit: data-lit="1" / .vnode.lit / data-slice-dist="0"
// grey: data-lit="0" / .vnode.grey / .slice-dim / data-slice-dist>0
```

Driver assertions:

- a `#tabs .tab[data-flow]` selection pins Slice (or Overview CFG
  already has a Steiner)
- `#sliceCanvas .vnode[data-lit="1"]` / `.vnode.lit` ≥ 1 and those
  nodes have `data-slice-dist="0"`
- at least one off-slice grey node:
  `#sliceCanvas .vnode[data-lit="0"]` / `.vnode.grey` / `.slice-dim`
  with `data-slice-dist` ≥ 1
- screenshot `verification/slice-grey.png` is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty
- `fixtures/demo/flows.toml` is unchanged
- return to Map keeps `xy=0` with more than one `.bubble-card`

## Gotchas

- Slice layout stays Steiner-first. Neighbors are a lighting ring,
  not a raw-IR dump. Total still caps at 48 (`OV3` / `M2c`).
- Ego `data-dist` is hop distance from the selected node. Slice
  lighting uses `data-slice-dist` so the two do not overwrite.
- `#prompt` does not invent a client-side Steiner. Type
  `name=hit,hit`, Review, then the derived tree drives the mask.
- S/X on a proposed-uncovered chip already posts
  `{ type: "stamp"|"skip", flow }` to the host (no disk write in
  the harness). This gate does not rebuild that.
- Do not add `data-testid`. `#sliceCanvas .vnode[data-lit]`,
  `.vnode.lit`, `.vnode.grey`, `.slice-dim`, `data-slice-dist`,
  `#tabs .tab[data-flow]` are the product hooks.
- Agents never stamp. Do not click `#stampBtn` to “cover” the
  slice. Do not flip verify `runs-on` off `ubuntu-latest`.
