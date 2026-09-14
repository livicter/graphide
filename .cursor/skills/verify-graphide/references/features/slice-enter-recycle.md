# Slice / Enter recycle

Slice Steiner and Enter-bubble XYFlow recycle the mounted stage
when the body key / tree is unchanged, the same way Map recycles
community cards. Camera stays put (`keepCam`). Not a second
workspace, not Map community LOD, and not an agent stamp.

## Sub-features

- When `#sliceCanvas` already lives under `#canvas .stage` /
  `.viewport` and `sliceWorkspaceKey()` matches `sliceBodyKey`,
  `renderFlowchart` keeps those nodes and
  `bindStage(..., { reset: false })`. React remounts into the
  same host. First paint still writes the rail + stage HTML.
- When `#enterCanvas` is already mounted and
  `enterWorkspaceKey()` matches `enterBodyKey` (same flow /
  bubble / member ids), `renderInner` keeps `.stage` /
  `.viewport` and keepCam. First Enter still `innerHTML` +
  remount.
- Re-select Slice, preview / `type: "patch"` on a mounted Slice
  or Enter, and ego / filter paints that keep the same tree
  must not flash a blank stage or jump `--cam-k`.
- Leaving Map for Slice / Enter still replaces the canvas.
  Map community LOD stays vanilla cards (`xy=0`). Recycle here
  does not raise Map into geometric lod 1.
- Stamp / skip stay human. Recycle never posts `{ type: "stamp" }`
  / `{ type: "skip" }` and never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open **Slice**. Steiner XYFlow paints.
2. Zoom or pan. Click **Slice** again, or let a preview / patch
   land. The camera must not jump.
3. Enter a community (Map card or a Slice run). Zoom. A later
   same-tree paint (re-select Slice while inside, ego, or patch)
   must keep that Enter stage.
4. Stamp and Skip are still the human attestation. Recycle does
   not stamp.

The in-tree proof is the explorer desk (`?mode=explorer`).

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map / Slice chrome:

```
document.querySelector('#workspaces [data-ws="slice"]').click();
// #sliceCanvas .react-flow__node
stage.dataset.recycleMark = "1"
viewport.dataset.recycleMark = "1"
document.getElementById("zoomIn").click()
document.querySelector('#workspaces [data-ws="slice"]').click()
// same .stage / .viewport; --cam-k survives
window.postMessage({ type: "patch", stats: { elapsed_ms: 140 } }, "*")
document.querySelector(".run[data-run]").click()
// #enterCanvas .react-flow__node
stage.dataset.recycleMark = "1"
viewport.dataset.recycleMark = "1"
document.getElementById("zoomIn").click()
window.postMessage({ type: "patch", stats: { elapsed_ms: 160 } }, "*")
```

Driver assertions (ids `SE0`…):

- Slice paints `#sliceCanvas .react-flow__node` before recycle
- Re-select Slice keeps the same `.stage` / `.viewport` and the
  zoomed `--cam-k`
- Preview / patch on Slice keeps those nodes and keepCam
- Enter a run / bubble mounts `#enterCanvas`; a same-tree patch
  keeps that `.stage` / `.viewport` and keepCam
- screenshot `verification/slice-enter-recycle.png` is not a
  black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty
- return to Map keeps `xy=0` with more than one `.bubble-card`

## Gotchas

- Map recycle is [canvas-recycle.md](canvas-recycle.md). Do not
  React-mount Map community LOD. `xy=0`.
- `sliceBodyKey` / `enterBodyKey` are the recycle gates. A new
  flow, bubble, or member set still wipes. First paint
  `bindStage(..., { reset: true })`.
- Do not add `data-testid`. `#sliceCanvas`, `#enterCanvas`,
  `.stage`, `.viewport`, `.run`, `.bubble-card` are the hooks.
- Agents never stamp. Recycle is paint, not an approval.
  Do not flip verify `runs-on` off `ubuntu-latest`.
