# Scroll-drive camera + micro CFG + macro LOD + kind anchors + clutter gate + vel ease + line→node + nest depth + blend polish + reduced-motion + rAF coalesce + Present pause + lineMapHit glow + Evidence active-line cue + soft camX follow (S1a–S1q)

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
enters them (S1i — ancestors stay visible; siblings stay collapsed),
and eases nest-glow / macro↔micro LOD class changes with a camEase-tied
CSS blend so opacity and glow morph instead of snapping (S1j), and under
`prefers-reduced-motion` snaps camera + blend (0ms) with no velocity settle
timers (S1k — `setCamTarget` already jumps), and coalesces `#srcBody`
scroll into one `requestAnimationFrame` flush per frame so burst
scrolls paint once (S1l — `rafMerged` / `rafFlushes` on ScrollDrive), and pauses the ScrollDrive camera while Presentation Stage is on so stage camera is never fought by residual Evidence scroll (S1m — `presentPaused`; resume on Present exit), and when `lineMapHit` is true pulses the mapped graph node with a glow distinct from generic `scroll-cfg-hot` (S1n — quieter outline on miss/fallback; no pulse under reduced-motion; cleared on Present pause), and paints the mid-viewport Evidence `.src-line` that owns `activeLine` with a dual-pane cue (S1p — `.scroll-drive-active` / `data-scroll-active`; cleared on Present pause / Evidence close / reset), and soft-follows **camX** toward centering the mapped vnode so the dual-pane morph is not vertical-only (S1q — capped ±80px on the micro path; macro LOD keeps its own camera; Present pause no-ops).

## Sub-features

- Data shape `window.__graphideScrollDrive`:
  `{ scrollRatio, activeLine, targetNodeId, lineMapHit, lineMapPulse, activeLineMarked, camX, camY, camK, cfgActiveId, cfgUnroll, cfgVisible, cfgSpanKind, cfgSpanCount, cfgNestDepth, cfgNestMax, cfgNestExpanded, scrollVel, camEase, blendMs, macroLod, anchorFocus, anchorCounts, detailNear, reducedMotion, rafCoalesce, rafFlushes, rafMerged }`.
- `#srcBody` `scroll` listener schedules `scheduleScrollDriveFlush`
  (S1l); one rAF runs `flushScrollDrive`, which publishes the shape and
  calls `setCamTarget` (existing lerp via `tickCam`).
- **S1h line→node:** `resolveScrollDriveTargetNode(activeLine)` walks
  IR/fixture node spans (`span.start/end` or flat `line`/`endLine`) on
  the Evidence file. Tightest containing span wins (Steiner-walk /
  painted bonus); else nearest within 48 lines; else fall back to
  inspected `sourceId`. `lineMapHit` is true on a span hit. No
  Tree-sitter — prefer existing spans. Camera re-bases when the mapped
  target changes.
- First scroll (or `showSource`) captures a cam base after optional
  `zoomToEl` on the painted node; deeper scroll nudges cam Y and soft-follows
  camX toward the mapped vnode (S1q).
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
  `detailNear` true and CSS reveals those layers with an opacity ease
  (`var(--scroll-blend-ms, 180ms)` — S1j). Reuses `data-lod` /
  scroll-macro / scroll-cfg; does not invent a second LOD system.
- **S1g velocity polish:** `scrollDriveEaseFromVel(scrollVel)` maps EMA
  velocity onto `camEase` (lerp alpha for `tickCam`). High velocity →
  loose ease (~0.12, less fight with scroll); low velocity → snappy
  settle (~0.36). Idle desk / closed Evidence keeps `CAM_EASE_BASE`
  (0.24). Still one RAF loop via `tickCam` / `setCamTarget` — no second
  animation loop. `camEase` publishes on ScrollDrive for the harness.
- **S1j nest glow / LOD blend:** `scrollDriveBlendMsFromEase(camEase)`
  maps loose→~280ms / snappy→~120ms onto `.viewport` `--scroll-blend-ms`
  and `data-scroll-blend="1"`. CSS transitions ease `.scroll-cfg-*`
  (incl. nest-hot/anc/sib) and `.scroll-macro-*` opacity / outline /
  box-shadow; S1f clutter gate reuses the same var (180ms fallback).
  `blendMs` publishes on ScrollDrive. No second animation loop — still
  class toggles + CSS ease + existing cam lerp.
- **S1k reduced-motion:** when `reduceMotion()` / `prefers-reduced-motion:
  reduce` is on, ScrollDrive publishes `reducedMotion: true`, forces
  `camEase` to `CAM_EASE_SNAP`, returns `blendMs: 0` / `--scroll-blend-ms:
  0ms`, and skips `scheduleScrollDriveEaseSettle`. Camera still snaps via
  existing `setCamTarget` reduceMotion path — no second animation loop.
  Motion preference off keeps S1g/S1j ease behavior.
- **S1l rAF coalesce:** `onSrcBodyScroll` only schedules
  `scheduleScrollDriveFlush`. Multiple scroll events in one frame merge
  into a single `flushScrollDrive` via `requestAnimationFrame`.
  `rafCoalesce: true`, `rafFlushes` (flush count), and `rafMerged`
  (events beyond the first per flush) publish on ScrollDrive. Closed
  Evidence still resets sync (cancel pending rAF). Not a second cam
  loop — still `tickCam` / `setCamTarget`. Lens stays a Present stage
  overlay (`P6s` / `K14k`); this batch does not make Lens exit Present.
- **S1m Present pause:** `applyPresent(true)` closes Evidence (exclusive
  chrome) then `pauseScrollDriveForPresent` — cancels macro / ease / rAF
  timers, clears CFG / macro / anchor / detail / blend paint, forces
  `camEase` to `CAM_EASE_BASE`, stamps `.viewport[data-scroll-present-paused="1"]`,
  and publishes `presentPaused: true`. `flushScrollDrive` /
  `applyScrollDriveCamera` / `applyScrollDriveMacro` no-op camera while
  `isPresenting()`. `applyPresent(false)` calls
  `resumeScrollDriveAfterPresent` (drop pause flag + attribute; idle
  camEase). Does **not** change Lens/Route Present-overlay rules
  (`P6s` / `K14k`). `resetScrollDrive` also clears the residual macro
  timer and keeps `presentPaused` when stage is on.
- **S1n lineMapHit glow:** `applyScrollDriveLineMapGlow(lineMapHit, targetNodeId)`
  paints the mapped `.vnode` — `.scroll-linemap-hit` / `data-scroll-linemap="hit"`
  with a CSS pulse when `lineMapHit` is true (link-color glow, distinct from
  `.scroll-cfg-hot`); miss/fallback gets `.scroll-linemap-miss` (quieter
  focusBorder outline, no pulse). If the mapped IR id is not painted on this
  Steiner canvas, fall back to the open Evidence `sourceId` vnode so the cue
  stays visible. Under `reduceMotion()` / S1k, `lineMapPulse` stays false
  (global reduced-motion kills animation; hit still gets the static outline).
  Present pause / reset clears via `clearScrollDriveLineMapPaint`.
  `lineMapPulse` publishes on ScrollDrive. Still one cam path — class
  toggles + CSS only.
- **S1p Evidence active-line cue:** `applyScrollDriveActiveLine(activeLine)`
  marks the mid-viewport Evidence `.src-line` that owns `activeLine` with
  `.scroll-drive-active` / `data-scroll-active="1"` (siblings cleared) so
  the editor side shows which line drives the canvas — pairs with S1n
  lineMapHit glow on the graph. Static left gutter + link-token tint
  (no pulse; prefers-reduced-motion safe). Present pause / Evidence close
  / `resetScrollDrive` clear via `clearScrollDriveActiveLinePaint`.
  `activeLineMarked` publishes on ScrollDrive; harness prefers the DOM
  hooks. Still one cam path — class toggles + CSS only.
- **S1q soft camX follow:** `applyScrollDriveCamera` still locks a base via
  `zoomToEl` and nudges **cam Y** by `scrollRatio * 48`, and now also applies
  a soft **camX** correction toward centering the mapped vnode
  (`scrollDriveSoftCamX` — same content→screen math as `zoomToEl`). Cap
  `SCROLL_CAMX_FOLLOW_CAP` (±80px) so it eases, never yanks. Prefer the
  `lineMapHit` / `sourceId` target el. Still one camera path:
  `setCamTarget` + `tickCam` / S1g camEase / S1k snap. S1m Present pause
  no-ops. Macro LOD (S1c) keeps its own `setCamTarget` — no X-follow there
  so overview is not fought. No new ScrollDrive fields; harness asserts
  `camX` moves when a deliberately off-center target is mapped.
- Closing Evidence (`closeSourcePane`) resets the drive and clears CFG
  + macro + kind-anchor + detail-gate + blend + lineMap + active-line paint.

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
   snappier on the target. Nest glow and macro↔micro LOD fade with the
   same ease instead of popping. With reduced motion, camera and
   nest/macro paint snap with no settle timers. Burst scrolls coalesce
   into one paint per frame (`rafMerged` rises). Press **F** (Present) and ScrollDrive pauses (`presentPaused`); Exit / Esc resumes. When the active line maps to an IR span (`lineMapHit`), that node pulses; unmatched lines keep a quieter fallback outline. The mid-viewport Evidence line itself gets a left-gutter tint (`scroll-drive-active`) so both panes agree on the driving line. When the mapped node sits left/right of center, the camera eases a little in X (not only Y) toward it.

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
- **S1j** — while Evidence scrolls, `.viewport[data-scroll-blend="1"]`
  and `--scroll-blend-ms` track `camEase`; `blendMs` is finite
  (120–280). Nest / macro vnode `transition-property` includes
  opacity. S1f `detailNear` / `data-scroll-detail` still gate clutter.
- **S1k** — mock `matchMedia('(prefers-reduced-motion: reduce)')` →
  `reducedMotion === true`, `blendMs === 0`, `--scroll-blend-ms: 0ms`,
  `camEase` snappy (`CAM_EASE_SNAP`). Restore matchMedia after.
- **S1l** — fire many `#srcBody` scroll events in one turn → after one
  frame, `rafCoalesce === true`, `rafFlushes` rose by 1 (or small N),
  `rafMerged` rose by ≥ the surplus events. Still one cam path.
- **S1m** — with Evidence scrolled (ScrollDrive active), open Present →
  Evidence closes, `presentPaused === true`,
  `.viewport[data-scroll-present-paused="1"]`, `camEase === CAM_EASE_BASE`,
  no `.scroll-cfg-hot` / `data-scroll-macro`. Exit Present →
  `presentPaused === false` and the attribute clears. Lens/Route stay
  Present overlays (`P6s` / `K14k`) — unchanged.
- **S1n** — painted own-span hit (e.g. `n1` line 11) → `lineMapHit === true`,
  `.vnode.scroll-linemap-hit` / `[data-scroll-linemap="hit"]` on the
  mapped painted node, `lineMapPulse === true` (unless reduced-motion).
  Unmatched pad → `lineMapHit === false`, `.scroll-linemap-miss` on
  fallback `sourceId`, `lineMapPulse === false`. Present pause clears
  both classes. Not the same as `.scroll-cfg-hot`.
- **S1p** — mid-viewport Evidence scroll marks exactly one
  `.src-line.scroll-drive-active` / `[data-scroll-active="1"]` matching
  `activeLine`; siblings lack the class. `activeLineMarked === true`
  while marked. Present pause / Evidence close clears the class/attr.
  Static tint only (no pulse). Does not change Lens/Route/Keys/Export
  Present-overlay rules.
- **S1q** — mid-file (not macro) Evidence scroll with a deliberately
  off-center mapped `.vnode` (e.g. `translateX(-220px)` pad) moves
  `camX` toward centering by a soft amount (delta > 8px, ≤ ~80–96px
  cap). Still `!macroLod` / `!presentPaused`. One cam path only.

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
  `data-cfg-depth`, `.scroll-cfg-nest-hot`, `.scroll-cfg-nest-anc`,
  `blendMs`, `.viewport[data-scroll-blend]`, `--scroll-blend-ms`,
  `reducedMotion`, `reduceMotion()`, `rafCoalesce`, `rafFlushes`,
  `rafMerged`, `scheduleScrollDriveFlush`, `flushScrollDrive`,
  `presentPaused`, `pauseScrollDriveForPresent`,
  `resumeScrollDriveAfterPresent`, `data-scroll-present-paused`,
  `lineMapPulse`, `applyScrollDriveLineMapGlow`,
  `.scroll-linemap-hit`, `.scroll-linemap-miss`, `data-scroll-linemap`,
  `activeLineMarked`, `applyScrollDriveActiveLine`,
  `.src-line.scroll-drive-active`, `data-scroll-active`,
  `scrollDriveSoftCamX`, `SCROLL_CAMX_FOLLOW_CAP`.
- Camera still uses the existing lerp (`tickCam` / `setCamTarget`); do
  not add a second animation loop. S1g only modulates `camEase` from
  `scrollVel` — never a parallel tween. S1j only sets CSS transition
  duration from `camEase` — never a parallel tween. S1k only zeros
  blend + skips settle timers under `reduceMotion` — still one cam path.
  S1l only coalesces scroll → flush via rAF — never a parallel tween.
  S1m only pauses / resumes on Present — never a parallel tween; does
  not change Lens/Route Present-overlay rules.
  S1n only toggles lineMap glow classes + CSS pulse — never a parallel
  tween; respects S1k reduced-motion and S1m Present pause.
  S1p only toggles Evidence `.src-line` active-line cue classes — never
  a parallel tween; clears on Present pause / Evidence close / reset.
  S1q only soft-clamps camX toward the mapped vnode on the micro path —
  never a parallel tween; still `setCamTarget` / `tickCam`; Present pause
  no-ops; do not fight macro overview (skip X-follow under S1c).
- Unscrollable Evidence (short snippet) must not enter macro LOD.
- **S1o feature-map sync:** `open-evidence.md` defers `S1a`–`S1n` ownership
  here (not just `S1a`–`S1g`); `presentation.md` points S1m Present-pause
  side-effect at this map. Index Live proof stays `S1a`–`S1n`.
- **S1p active-line cue:** Evidence editor tint pairs with S1n graph glow;
  `open-evidence.md` / index deferral extends to `S1a`–`S1p`. Clear on
  Present pause / close — do not leave a stale `.scroll-drive-active`.
- **S1q soft camX follow:** one cam path; Present pause; don't fight macro.
  `open-evidence.md` / index / presentation deferral extends to `S1a`–`S1q`.
