# Map off-view

Map community cards that sit clearly outside the `.stage`
are parked (`data-offview="1"`) so pan/zoom does not pay full
layout/paint for every off-screen `.bubble-card`. Recycle
identity stays `data-bubble`. Not a second Map altitude and
not Slice / Enter XYFlow virtualization.

## Sub-features

- After community LOD is mounted, `applyCam` / recycle queue a
  BEST_EFFORT AABB vs `.stage` `getBoundingClientRect`. Cards
  clearly outside the stage get `data-offview="1"`
  (`content-visibility` / `visibility` / no pointer events).
  Transform / pan / zoom / stamp / click stay CRITICAL and are
  not gated on the park pass.
- Re-entering the stage clears `data-offview`. The same
  `data-bubble` button is clickable again. Recycle still diffs
  by `data-bubble`.
- Map stays community LOD (`xy=0`, `.viewport` `data-lod="0"`).
  Off-view skip is not a second LOD and does not mount
  `.react-flow__node` / `.comm-node` at map altitude.
- Stamp / skip stay human. Off-view never posts
  `{ type: "stamp" }` / `{ type: "skip" }` and never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open **Map**. Community cards paint.
2. Zoom or pan until a card leaves the stage. That card is no
   longer a visible interactive peer.
3. Pan back. The same community button returns.
4. Stamp and Skip are still the human attestation. Off-view
   does not stamp.

The in-tree proof is the explorer desk (`?mode=explorer`). The
fixture already paints twelve community cards.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map paints community cards:

```
document.getElementById("zoomIn").click() // repeat / pan until a card leaves
// .bubble-card[data-offview="1"] exists; in-stage rects < total
document.getElementById("zoomFit").click()
// parked data-bubble ids return without data-offview
```

Driver assertions:

- Map has more than one `.bubble-card` and `xy=0` before the move
- After zoom/pan, ≥1 card has `data-offview="1"` and in-stage
  measurable cards are fewer than total
- Panning / Fit back restores those `data-bubble` ids
- Map stays `xy=0` / `data-lod="0"` (no `.react-flow__node` /
  `.comm-node`)
- screenshot `verification/map-offview.png` is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty

## Gotchas

- Do not React-mount Map community LOD. Cards stay vanilla.
  `xy=0`. Off-view is park, not Enter.
- Do not add `data-testid`. `.bubble-card`, `[data-bubble]`,
  `[data-offview]`, `.stage` are the hooks.
- Recycle / keepCam / coverage-only `patch` stay as they are.
  Do not weaken RC* / DA* / zoom gates.
- Agents never stamp. Off-view is paint, not an approval.
  Do not flip verify `runs-on` off `ubuntu-latest`.
