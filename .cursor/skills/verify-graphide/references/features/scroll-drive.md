# Scroll-drive camera + micro CFG + macro LOD + kind anchors + clutter gate + vel ease + line→node + nest depth (S1a–S1i)

Evidence `#srcBody` scroll smoothly tracks the graph camera toward the
related node (S1a), maps `activeLine` onto the IR/fixture span owner (S1h),
unrolls a localized Steiner CFG on Slice with a
glow on the active block (S1b), annotates `if` / loop / `try` spans as
distinct visual groups (S1d), and at file-top or high scroll velocity
transitions to a macro Map overview LOD focused on the Evidence module
(S1c), stamps color-coded API / Database / Service / Utility anchors
from IR kind + EndpointMeta (S1e), and hides deep implementation clutter
until scroll focus approaches the block (S1f), and eases camera lerp
by scroll velocity so fast flicks glide and idle settles snappy (S1g),
and expands nested control-flow blocks by brace/IR depth as `activeLine`
enters them (S1i — ancestors stay visible; siblings stay collapsed).

## Sub-features

- Data shape `window.__graphideScrollDrive`:
  `{ scrollRatio, activeLine, targetNodeId, lineMapHit, camX, camY, camK, cfgActiveId, cfgUnroll, cfgVisible, cfgSpanKind, cfgSpanCount, cfgNestDepth, cfgNestMax, cfgNestExpanded, scrollVel, camEase, macroLod, anchorFocus, anchorCounts, detailNear }`.
- `#srcBody` `scroll` listener publishes the shape and calls
  `setCamTarget` (existing lerp via `tickCam`).
- **S1h line→node:** `resolveScrollDriveTargetNode(activeLine)` walks
  IR/fixture node spans (`span.start/end` or flat `line`/`endLine`) on
  the Evidence file. Tightest containing span wins (Steiner-walk /
  painted bonus); else nearest within 48 lines; else fall back to
  inspected `sourceId`. `lineMapHit` is true on a span hit. No
  Tree-sitter — prefer existing spans. Camera re-bases when the mapped
  target changes.
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
- **S1i nested CFG depth:** `scanScrollDriveCfgSpans` closes spans with
  brace-depth matching (quote-aware) and assigns nest `depth` from brace
  open depth + containment refine; IR/fixture walk nesting
  (`irNestDepthScrollDriveWalk`) is the span-less fallback. Deepest span
  containing `activeLine` is nest focus — ancestors expand
  (`.scroll-cfg-nest-anc`), focus glows (`.scroll-cfg-nest-hot`),
  same-depth / deeper siblings collapse (`.scroll-cfg-nest-sib`).
  `data-cfg-depth`, `cfgNestDepth` / `cfgNestMax` / `cfgNestExpanded`
  publish on ScrollDrive. No Tree-sitter.
- Idle Evidence (`scrollRatio` 0) does **not** dim CFG nodes — open
  Evidence without scrolling must leave Slice opacities alone.
- **S1c macro Map LOD:** when Evidence can scroll and
  `scrollRatio <= 0.18` **or** scroll velocity is high, clear micro CFG
  paint, pin `.viewport` `data-lod="0"` / `data-scroll-macro="1"`, pull
  camera `k` toward overview, focus the Evidence node
  (`.scroll-macro-hot`) and dim siblings (`.scroll-macro-dim`). When the
  flick ages out mid-file, a short recheck returns to S1a/S1b/S1d.
- **S1e kind anchors:** map IR `Function` / `Type` / `Endpoint` (+
  `EndpointMeta.channel` Http→API, Table|File→Database, Queue|Channel→Service,
  Source→API, Sink→Database; Type→Service; Function→Utility with light FQN
  heuristics) onto `data-scroll-anchor` / `.scroll-anchor-*`. Hairline tint
  only — no labels. Deep CFG detail stays gated by S1b/S1d. `anchorFocus` /
  `anchorCounts` publish on ScrollDrive for the harness.
- **S1f clutter gate:** `applyScrollDriveDetailGate` sets
  `.viewport` `data-scroll-detail="0|1"` from ScrollDrive proximity.
  Macro LOD or far from focus → `detailNear` false (members, hop packets,
  edge kinds, dense labels stay opacity 0). As focus approaches
  (`cfgVisible` / `cfgUnroll` / `activeLine` / `anchorFocus` mid-file) →
  `detailNear` true and CSS reveals those layers with a 180ms opacity
  ease (no pop-in). Reuses `data-lod` / scroll-macro / scroll-cfg; does
  not invent a second LOD system.
- **S1g velocity polish:** `scrollDriveEaseFromVel(scrollVel)` maps EMA
  velocity onto `camEase` (lerp alpha for `tickCam`). High velocity →
  loose ease (~0.12, less fight with scroll); low velocity → snappy
  settle (~0.36). Idle desk / closed Evidence keeps `CAM_EASE_BASE`
  (0.24). Still one RAF loop via `tickCam` / `setCamTarget` — no second
  animation loop. `camEase` publishes on ScrollDrive for the harness.
- Closing Evidence (`closeSourcePane`) resets the drive and clears CFG
  + macro + kind-anchor + detail-gate paint.

## How to get to it (user POV)

1. Review a folder. Open **Slice**.
2. Click a boxed hop (`.vnode`) so Evidence opens.
3. Scroll the Evidence source body. The canvas camera eases toward the
   related node; the CFG unrolls and the active block glows; `if` /
   loop / `try` regions tint distinctly while sibling kinds stay dim;
   nested blocks expand only as the cursor line enters them.
   Jump to the top of the file (or flick fast) and the canvas eases to
   Map overview LOD with the module focused. Nodes keep a hairline
   kind-anchor tint (API / DB / Service / Utility). Deep member lists /
   packets / labels stay hidden until you scroll into the focused block.
   Fast flick loosens camera follow; when you stop, the camera settles
   snappier on the target.

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
   (or `[data-cfg-active="1"]`), `cfgSpanKind` / `[data-cfg-span]`, and
   `detailNear` / `data-scroll-detail="1"`.
4. Set `scrollTop` to 0 and wait for `macroLod` / `data-lod="0"` /
   `.vnode.scroll-macro-hot` and `detailNear === false` /
   `data-scroll-detail="0"`.
5. Burst-scroll then idle: wait for `scrollVel` high + `camEase` loose
   (< 0.24), then `scrollVel` low + `camEase` snappy (> 0.28).

Driver assertions (ids in `scripts/verify-graphide.js`):

- **S1a** — `#srcBody` scroll publishes `__graphideScrollDrive`
  (`scrollRatio`, `targetNodeId`, `camX`/`camY`/`camK`); camera moves
  (`camY` delta or `.viewport` transform change).
- **S1b** — mid-file scroll raises `cfgUnroll` / `cfgVisible`; a
  `.vnode.scroll-cfg-hot` or `[data-cfg-active="1"]` matches
  `cfgActiveId`; scroll-up collapses ahead (`.scroll-cfg-ahead`).
- **S1c** — file-top (`scrollRatio` low) or fast flick sets `macroLod`,
  `.viewport[data-lod="0"][data-scroll-macro="1"]`,
  `.vnode.scroll-macro-hot`; mid-file clears macro and restores CFG.
- **S1d** — Evidence lines with `if` / `for` / `try` yield
  `cfgSpanCount >= 3`, `cfgSpanKind`, `[data-cfg-span]`,
  `.scroll-cfg-if` / `.scroll-cfg-loop` / `.scroll-cfg-try`; inactive
  sibling kinds stay `.scroll-cfg-sib`.
- **S1e** — mid-file stamps `[data-scroll-anchor]` /
  `.scroll-anchor-api` (and db/svc/util); `anchorFocus` /
  `anchorCounts` publish on ScrollDrive.
- **S1f** — macro/far → `detailNear === false` /
  `.viewport[data-scroll-detail="0"]`; mid focus → `detailNear === true`
  / `data-scroll-detail="1"` (180ms opacity ease).
- **S1g** — burst scroll → `scrollVel` high and `camEase` < 0.24
  (loose); idle settle → `scrollVel` low and `camEase` > 0.28
  (snappy). Still one `tickCam` loop via `scrollDriveEaseFromVel`.
- **S1h** — mid-file `activeLine` inside a same-file IR/fixture span
  sets `targetNodeId` to that node with `lineMapHit === true` (not only
  the inspected `sourceId`). Unmatched pad lines fall back to
  `sourceId` with `lineMapHit === false`.
- **S1i** — nested `if { for { try } }` Evidence braces raise
  `cfgNestMax >= 2`; centering `activeLine` on the inner `try` sets
  `cfgNestDepth >= 2`, `cfgNestExpanded >= 2`, paints
  `.scroll-cfg-nest-hot` / `.scroll-cfg-nest-anc` and collapses
  `.scroll-cfg-nest-sib` (or kind sibs). Flat S1d pads stay depth 0.

## Gotchas

- Do not invent multi-PR Tree-sitter CFG rewrite here — fixture Steiner
  walk + Evidence line keyword / brace-depth scan is enough for S1b/S1d/S1i; S1c reuses
  `data-lod` / camera lerp; S1f reuses those proximity signals; S1h
  maps lines via existing IR/fixture spans only.
- Do not add `data-testid`. Hooks are `#srcBody`,
  `window.__graphideScrollDrive`, `.vnode.scroll-cfg-hot`,
  `[data-cfg-active]`, `[data-cfg-span]`, `.vnode.scroll-cfg-sib`,
  `.vnode.scroll-macro-hot`, `.viewport[data-scroll-macro]`,
  `[data-scroll-anchor]`, `.vnode.scroll-anchor-api`,
  `.viewport[data-scroll-detail]`, `detailNear`, `camEase`,
  `lineMapHit`, `resolveScrollDriveTargetNode`, `cfgNestDepth`,
  `data-cfg-depth`, `.scroll-cfg-nest-hot`, `.scroll-cfg-nest-anc`.
- Camera still uses the existing lerp (`tickCam` / `setCamTarget`); do
  not add a second animation loop. S1g only modulates `camEase` from
  `scrollVel` — never a parallel tween.
- Unscrollable Evidence (short snippet) must not enter macro LOD.
