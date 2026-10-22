# Scroll-drive camera + micro CFG + macro LOD (S1a / S1b / S1c / S1d)

Evidence `#srcBody` scroll smoothly tracks the graph camera toward the
related node (S1a), unrolls a localized Steiner CFG on Slice with a
glow on the active block (S1b), annotates `if` / loop / `try` spans as
distinct visual groups (S1d), and at file-top or high scroll velocity
transitions to a macro Map overview LOD focused on the Evidence module
(S1c).

## Sub-features

- Data shape `window.__graphideScrollDrive`:
  `{ scrollRatio, activeLine, targetNodeId, camX, camY, camK, cfgActiveId, cfgUnroll, cfgVisible, cfgSpanKind, cfgSpanCount, scrollVel, macroLod }`.
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
- **S1d CFG spans:** scan Evidence `.src-line` text for `if` / `else`,
  `for` / `while` / `loop`, and `try` / `catch` / `finally` / `except`
  (no Tree-sitter). Spans annotate Steiner walk nodes
  (`data-cfg-span`, `.scroll-cfg-if` / `.scroll-cfg-loop` /
  `.scroll-cfg-try`). Active span kind follows `activeLine` (else the
  hot node); inactive sibling kinds stay `.scroll-cfg-sib` (collapsed /
  dimmed). `cfgSpanKind` / `cfgSpanCount` publish on ScrollDrive.
- Idle Evidence (`scrollRatio` 0) does **not** dim CFG nodes — open
  Evidence without scrolling must leave Slice opacities alone.
- **S1c macro Map LOD:** when Evidence can scroll and
  `scrollRatio <= 0.18` **or** scroll velocity is high, clear micro CFG
  paint, pin `.viewport` `data-lod="0"` / `data-scroll-macro="1"`, pull
  camera `k` toward overview, focus the Evidence node
  (`.scroll-macro-hot`) and dim siblings (`.scroll-macro-dim`). When the
  flick ages out mid-file, a short recheck returns to S1a/S1b/S1d.
- Closing Evidence (`closeSourcePane`) resets the drive and clears CFG
  + macro paint.

## How to get to it (user POV)

1. Review a folder. Open **Slice**.
2. Click a boxed hop (`.vnode`) so Evidence opens.
3. Scroll the Evidence source body. The canvas camera eases toward the
   related node; the CFG unrolls and the active block glows; `if` /
   loop / `try` regions tint distinctly while sibling kinds stay dim.
   Jump to the top of the file (or flick fast) and the canvas eases to
   Map overview LOD with the module focused.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

1. Open Slice; click `#ledgerGrid .cell` or `.vnode[data-id]` so
   `#sourcePane` is visible and `#sliceCanvas .vnode` exist.
2. Pad `#srcBody` so it can scroll (explorer snippets are short) and
   include `if` / `for` / `try` lines for S1d.
3. Set `scrollTop` high and wait for `__graphideScrollDrive.scrollRatio`
   / `cfgUnroll` to rise, `camY` to move, a `.vnode.scroll-cfg-hot`
   (or `[data-cfg-active="1"]`), and `cfgSpanKind` / `[data-cfg-span]`.
4. Set `scrollTop` to 0 and wait for `macroLod` / `data-lod="0"` /
   `.vnode.scroll-macro-hot`.

Driver assertions: **S1a** (camera) · **S1b** (CFG unroll + glow) ·
**S1c** (macro LOD on file top / fast scroll) · **S1d** (if/loop/try
span kinds + sibling collapse).

## Gotchas

- Do not invent multi-PR Tree-sitter CFG rewrite here — fixture Steiner
  walk + Evidence line keyword scan is enough for S1b/S1d; S1c reuses
  `data-lod` / camera lerp.
- Do not add `data-testid`. Hooks are `#srcBody`,
  `window.__graphideScrollDrive`, `.vnode.scroll-cfg-hot`,
  `[data-cfg-active]`, `[data-cfg-span]`, `.vnode.scroll-cfg-sib`,
  `.vnode.scroll-macro-hot`, `.viewport[data-scroll-macro]`.
- Camera still uses the existing lerp (`tickCam` / `setCamTarget`); do
  not add a second animation loop.
- Unscrollable Evidence (short snippet) must not enter macro LOD.
