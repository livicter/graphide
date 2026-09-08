# Canvas recycle

Map community paint recycles the mounted stage instead of
`canvas.innerHTML = rail + stage + svg + cards` on every pass.
Cards stay `.bubble-card`. Camera stays put. Not a second Map
altitude and not an XYFlow Map rewrite.

## Sub-features

- When `#canvas .stage` + `.viewport` + `.comm-wrap` already exist
  (`programs-view`), `renderBubbleMap` diffs `.bubble-card` by
  `data-bubble` and `svg.comm-edges` paths by from/to. Create /
  update / remove only. The `.stage` / `.viewport` nodes stay.
- First paint still writes the rail + stage HTML. Recycle calls
  `bindStage(..., { reset: false })` so pan/zoom (`keepCam`)
  survives preview → final, re-select Map, and `type: "patch"`.
- Preview / flowchart / programs patch snapshot fields when Map is
  mounted. Coverage / findings refresh after the canvas (BEST_EFFORT).
  Stamp / click stay CRITICAL and are not gated on panel refresh.
- Map stays community LOD (`xy=0`). No second altitude. Off-view
  skip is not a second LOD.
- Stamp / skip stay human. Recycle never posts `{ type: "stamp" }`
  / `{ type: "skip" }` and never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open **Map**. Community cards paint.
2. Zoom or pan. A later preview, flowchart, or clicking **Map**
   again must not jump the camera or flash a blank stage.
3. Cards that are still in the cut stay the same buttons. New
   communities appear; gone ones leave.
4. Stamp and Skip are still the human attestation. Recycle does
   not stamp.

The in-tree proof is the explorer desk (`?mode=explorer`). The
fixture already paints twelve community cards.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map paints community cards and zoom has moved the camera:

```
stage.dataset.recycleMark = "1"
viewport.dataset.recycleMark = "1"
document.getElementById("workspaces").querySelector('[data-ws="map"]').click()
// same .stage / .viewport nodes; cards still at xy=0
window.postMessage({ type: "progress", ... }, "*")
window.postMessage({ type: "preview", flows: [] }, "*")
window.postMessage({ type: "patch", stats: { elapsed_ms: 140 } }, "*")
```

Driver assertions:

- Map has more than one `.bubble-card` and `xy=0` before recycle
- Re-select Map keeps the same `.stage` and `.viewport` nodes
- Preview / patch keeps those nodes and the zoomed `--cam-k`
- Cards stay present at `xy=0` / `data-lod="0"`
- screenshot `verification/canvas-recycle.png` is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty

## Gotchas

- Do not wipe `#canvas` when a Map stage is already mounted. Slice
  / Enter still replace the canvas when leaving Map.
- `keepCam` is the recycle default. First paint (no `.comm-wrap`)
  still `bindStage(..., { reset: true })`.
- Do not add `data-testid`. `.stage`, `.viewport`, `.bubble-card`,
  `[data-bubble]`, `svg.comm-edges` are the hooks.
- Do not React-mount Map community LOD. Cards stay vanilla. `xy=0`.
- Agents never stamp. Recycle is paint, not an approval.
  Do not flip verify `runs-on` off `ubuntu-latest`.
