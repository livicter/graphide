# Scroll-drive camera (S1a)

Evidence `#srcBody` scroll smoothly tracks the graph camera toward the
related node. Macro LOD / fast-scroll overview and micro CFG unroll are
out of scope for this map.

## Sub-features

- Data shape `window.__graphideScrollDrive`:
  `{ scrollRatio, activeLine, targetNodeId, camX, camY, camK }`.
- `#srcBody` `scroll` listener publishes the shape and calls
  `setCamTarget` (existing lerp via `tickCam`).
- `targetNodeId` is the inspected Evidence node (`sourceId`). No AST
  line→node mapping yet — later tips may refine that.
- First scroll (or `showSource`) captures a cam base after optional
  `zoomToEl` on the painted node; deeper scroll nudges cam Y.
- Closing Evidence (`closeSourcePane`) resets the drive.

## How to get to it (user POV)

1. Review a folder. Open **Slice**.
2. Click a boxed hop (`.vnode`) so Evidence opens.
3. Scroll the Evidence source body. The canvas camera eases toward the
   related node and drifts slightly as you scroll deeper.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

1. Open Slice; click `#ledgerGrid .cell` or `.vnode[data-id]` so
   `#sourcePane` is visible.
2. Pad `#srcBody` so it can scroll (explorer snippets are short).
3. Set `scrollTop` high and wait for `__graphideScrollDrive.scrollRatio`
   to rise and `camY` / `camTo` to move vs the pre-scroll snapshot.

Driver assertion: **S1a** — Evidence `#srcBody` scroll updates
`__graphideScrollDrive` and moves the camera target.

## Gotchas

- Do not invent multi-PR CFG unroll or fast-scroll macro map here.
- Do not add `data-testid`. Hooks are `#srcBody` and
  `window.__graphideScrollDrive`.
- Camera still uses the existing lerp (`tickCam` / `setCamTarget`); do
  not add a second animation loop.
