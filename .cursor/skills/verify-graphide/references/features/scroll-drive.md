# Scroll-drive camera + micro CFG (S1a / S1b)

Evidence `#srcBody` scroll smoothly tracks the graph camera toward the
related node (S1a) and unrolls a localized Steiner CFG on Slice with a
glow on the active block (S1b). Macro LOD / fast-scroll overview stays
out of scope for this map.

## Sub-features

- Data shape `window.__graphideScrollDrive`:
  `{ scrollRatio, activeLine, targetNodeId, camX, camY, camK, cfgActiveId, cfgUnroll, cfgVisible }`.
- `#srcBody` `scroll` listener publishes the shape and calls
  `setCamTarget` (existing lerp via `tickCam`).
- `targetNodeId` is the inspected Evidence node (`sourceId`). No AST
  line→node mapping yet — later tips may refine that.
- First scroll (or `showSource`) captures a cam base after optional
  `zoomToEl` on the painted node; deeper scroll nudges cam Y.
- **S1b micro CFG:** `applyScrollDriveCfg` walks the current flow’s
  Steiner tree (`flowWalk`). Scroll down raises `cfgUnroll` /
  `cfgVisible` (more of the walk stays full-opacity); scroll up
  collapses deeper nodes (`.scroll-cfg-ahead`). The active block
  (span-nearest `activeLine`, else unroll index) gets
  `.scroll-cfg-hot` / `data-cfg-active="1"`.
- Idle Evidence (`scrollRatio` 0) does **not** dim CFG nodes — open
  Evidence without scrolling must leave Slice opacities alone.
- Closing Evidence (`closeSourcePane`) resets the drive and clears CFG
  paint.

## How to get to it (user POV)

1. Review a folder. Open **Slice**.
2. Click a boxed hop (`.vnode`) so Evidence opens.
3. Scroll the Evidence source body. The canvas camera eases toward the
   related node; the CFG unrolls and the active block glows.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

1. Open Slice; click `#ledgerGrid .cell` or `.vnode[data-id]` so
   `#sourcePane` is visible and `#sliceCanvas .vnode` exist.
2. Pad `#srcBody` so it can scroll (explorer snippets are short).
3. Set `scrollTop` high and wait for `__graphideScrollDrive.scrollRatio`
   / `cfgUnroll` to rise, `camY` to move, and a `.vnode.scroll-cfg-hot`
   (or `[data-cfg-active="1"]`) to appear.

Driver assertions: **S1a** (camera) · **S1b** (CFG unroll + glow).

## Gotchas

- Do not invent multi-PR Tree-sitter CFG rewrite or fast-scroll macro
  map here — fixture Steiner walk is enough for S1b.
- Do not add `data-testid`. Hooks are `#srcBody`,
  `window.__graphideScrollDrive`, `.vnode.scroll-cfg-hot`,
  `[data-cfg-active]`.
- Camera still uses the existing lerp (`tickCam` / `setCamTarget`); do
  not add a second animation loop.
