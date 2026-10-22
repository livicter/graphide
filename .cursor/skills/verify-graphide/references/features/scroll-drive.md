# Scroll-drive camera + micro CFG + macro LOD + kind anchors + clutter gate + vel ease + line→node + nest depth + blend polish + reduced-motion + rAF coalesce + Present pause + lineMapHit glow + Evidence active-line cue + soft camX follow + idle-settle camX + idle-settle camY + nest-focus remap soft-cam stay + macro-path soft remap / camK soft stay + Evidence file-hop soft stay (S1a–S1v)

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
scrolls paint once (S1l — `rafMerged` / `rafFlushes` on ScrollDrive), and pauses the ScrollDrive camera while Presentation Stage is on so stage camera is never fought by residual Evidence scroll (S1m — `presentPaused`; resume on Present exit), and when `lineMapHit` is true pulses the mapped graph node with a glow distinct from generic `scroll-cfg-hot` (S1n — quieter outline on miss/fallback; no pulse under reduced-motion; cleared on Present pause), and paints the mid-viewport Evidence `.src-line` that owns `activeLine` with a dual-pane cue (S1p — `.scroll-drive-active` / `data-scroll-active`; cleared on Present pause / Evidence close / reset), and soft-follows **camX** toward centering the mapped vnode so the dual-pane morph is not vertical-only (S1q — capped ±80px on the micro path; macro LOD keeps its own camera; Present pause no-ops), and on idle settle folds that soft camX into `scrollDriveBase` so the next nudge does not spring back to the pre-follow X (S1r — reuses S1g ease-settle / low `scrollVel`; no second RAF), and likewise folds the post-nudge soft camY into `scrollDriveBase.y` (rebasing the Y-nudge origin) so dual-pane stay is not X-stable but Y-springy (S1s — same settle path), and when S1i nest-focus / S1h line→node remaps mid-scroll, seeds `scrollDriveBase` from the live `camTo` then soft-follows the new vnode instead of a hard `zoomToEl` yank (S1t — first lock still zooms; settle flags clear so idle can re-absorb), and softens macro enter/exit / macro-hot remaps the same way so `camK` (and X/Y) ease via camEase instead of yanking against dual-pane soft stay (S1u — capped k delta + lighter soft follow; cold first lock may still zoom), and when Evidence switches file / `sourceId` (or another vnode reloads `#srcBody`) while Slice soft-stay is live, seeds `scrollDriveBase` from live `camTo` and soft-follows the new vnode instead of wiping then `zoomToEl` (S1v — first-ever open may still zoom; settle flags clear for S1r/S1s re-absorb).

## Sub-features

- Data shape `window.__graphideScrollDrive`:
  `{ scrollRatio, activeLine, targetNodeId, lineMapHit, lineMapPulse, activeLineMarked, camX, camY, camK, cfgActiveId, cfgUnroll, cfgVisible, cfgSpanKind, cfgSpanCount, cfgNestDepth, cfgNestMax, cfgNestExpanded, scrollVel, camEase, blendMs, macroLod, anchorFocus, anchorCounts, detailNear, reducedMotion, rafCoalesce, rafFlushes, rafMerged, camXSettled, camYSettled }`.
- `#srcBody` `scroll` listener schedules `scheduleScrollDriveFlush`
  (S1l); one rAF runs `flushScrollDrive`, which publishes the shape and
  calls `setCamTarget` (existing lerp via `tickCam`).
- **S1h line→node:** `resolveScrollDriveTargetNode(activeLine)` walks
  IR/fixture node spans (`span.start/end` or flat `line`/`endLine`) on
  the Evidence file. Tightest containing span wins (Steiner-walk /
  painted bonus); else nearest within 48 lines; else fall back to
  inspected `sourceId`. `lineMapHit` is true on a span hit. No
  Tree-sitter — prefer existing spans. Camera soft-stays when the mapped
  target remaps mid-scroll (S1t); first lock may still `zoomToEl`.
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
  Enter/exit / hot remap soft-stay is S1u (still this LOD path).
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
- **S1r idle-settle soft camX into base:** after S1q soft-follows camX, the
  locked `scrollDriveBase.x` still held the pre-follow X. On idle settle
  (S1g `scheduleScrollDriveEaseSettle` when `scrollVel` ages out, or the
  low-`scrollVel` micro path in `flushScrollDrive`), `absorbScrollDriveSoftCamX`
  folds `camTo.x` (already soft-clamped) into `scrollDriveBase.x` so the next
  tiny nudge does not spring back. Still one camera path — no second RAF.
  S1k reduced-motion snap-absorbs inside `applyScrollDriveCamera` (settle
  timers skipped). S1m Present pause / S1c macro no-op. Publishes
  `camXSettled` on ScrollDrive for the harness.
- **S1s idle-settle soft camY into base:** Y still used a live
  `scrollRatio * 48` nudge off the lock-time `scrollDriveBase.y`. After
  idle settle, `absorbScrollDriveSoftCamY` folds `camTo.y` (post-nudge)
  into `scrollDriveBase.y` and rebases the Y-nudge origin to the live
  ratio so subsequent small scrolls apply only a delta — no full-ratio
  yank. Same settle path as S1r (no second RAF). Nest/lock remap clears
  settle flags (S1t soft-stays instead of hard re-base). S1k snap-absorbs;
  S1m / S1c no-op. Publishes `camYSettled`.
- **S1t nest-focus remap soft-cam stay:** when `scrollDriveTargetLocked`
  changes while Evidence ScrollDrive already has a base (mid-scroll nest
  focus / line→node remap), seed `scrollDriveBase` from current `camTo`
  (post S1r/S1s settle if any), rebase the Y-nudge origin, clear
  `camXSettled` / `camYSettled`, and apply S1q capped soft camX follow
  toward the new vnode — **no** `zoomToEl` yank. First lock (no prior
  base / Evidence just opened) still uses `zoomToEl` as today. Present
  pause (S1m) no-ops. Macro enter/exit / hot remap soft-stay is S1u.
  Still one camera path: `setCamTarget` + `tickCam` / camEase.
- **S1u macro-path soft remap / camK soft stay:** macro enter (file-top /
  high `scrollVel`) seeds `scrollDriveBase` from live `camTo` when a
  micro soft-stay base already exists, then `setCamTarget` toward
  overview `k` with a capped `|Δk|` (`SCROLL_MACRO_K_DELTA_CAP`) so
  camEase lerps instead of yanking; soft-follows the hot vnode with a
  lighter X cap (`SCROLL_MACRO_CAM_FOLLOW_CAP`). Macro exit re-seeds
  from `camTo` then resumes S1q soft follow + Y nudge (no `zoomToEl`).
  Macro-hot target changes while `macroLod` soft-follow the same way.
  Cold first lock (no prior base) may still `zoomToEl`. S1k reduced-
  motion snaps (no k cap); S1m Present pause no-ops; S1l rAF coalesce
  unchanged; settle flags clear on remap for S1r/S1s re-absorb. Still
  one camera path.
- **S1v Evidence file-hop soft stay:** when `showSource` reloads `#srcBody`
  for a new `sourceId` / file while a prior ScrollDrive session has a
  `scrollDriveBase` (Slice, not Present), `softStayScrollDriveAcrossSourceHop`
  seeds the base from live `camTo` (S1t/S1u style), clears
  `scrollDriveTargetLocked` + `camXSettled` / `camYSettled`, drops old-file
  CFG / lineMap / active-line / macro paint, and lets the next flush
  soft-follow the new mapped vnode with S1q caps — **no** wipe-then-
  `zoomToEl`. First-ever Evidence open (no prior base) still clears so
  flush may `zoomToEl`. `selectNode` also skips hard `zoomEl` while a
  live ScrollDrive base is open so SVG clicks share one camera path.
  S1k / S1m / S1c / S1l unchanged.
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
   into one paint per frame (`rafMerged` rises). Press **F** (Present) and ScrollDrive pauses (`presentPaused`); Exit / Esc resumes. When the active line maps to an IR span (`lineMapHit`), that node pulses; unmatched lines keep a quieter fallback outline. The mid-viewport Evidence line itself gets a left-gutter tint (`scroll-drive-active`) so both panes agree on the driving line. When the mapped node sits left/right of center, the camera eases a little in X (not only Y) toward it; after you stop scrolling, that X correction settles into the scroll-drive base so a tiny follow-up nudge stays framed, and the post-nudge Y likewise settles into the base so dual-pane stay is not Y-springy. When nest focus or the line→node target remaps mid-file, the camera soft-follows the new node from the current stay instead of jumping. Entering or leaving macro Map LOD (or changing the macro-hot module) likewise eases `camK` / focus instead of yanking against that stay. Opening a different Evidence file (or hopping to another vnode that reloads the source body) keeps that soft stay — the camera eases toward the new target instead of resetting hard.

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
- **S1r** — after mid-file soft camX follow with an off-center mapped
  target, wait for idle settle (`scrollVel` low / `camEase` snappy /
  `camXSettled === true`). Then a further tiny scroll must not spring
  `camX` back toward the pre-follow X (distance to pre-follow must not
  shrink by > 8px). One cam path; Present pause / macro no-op.
- **S1s** — after mid-file Evidence scroll moves `camY`, wait for idle
  settle (`scrollVel` low / `camYSettled === true`). Then a further tiny
  scroll must keep `camY` near the settled value (yank ≤ ~8px) — not
  spring back toward the pre-nudge / lock Y. One cam path; Present pause
  / macro no-op; nest remap soft-stays (S1t).
- **S1t** — mid-file (not macro / not Present) with ScrollDrive settled,
  force a nest/line target remap (center a different IR/fixture span so
  `targetNodeId` changes). Camera must not hard-jump (`camX`/`camY` yank
  within soft-follow caps, not a full `zoomToEl` leap); `camXSettled` /
  `camYSettled` clear on remap and can re-absorb on idle. One cam path.
- **S1u** — mid-file Evidence scroll (micro soft-stay, not Present), then
  enter macro (file-top): `macroLod` asserts as S1c; `camK` / `camX` /
  `camY` deltas stay within soft caps (no `zoomToEl` leap). Exit macro
  mid-file: `!macroLod` restores CFG; camera again soft-stays from live
  `camTo` (no hard jump). One cam path; Present pause no-ops.
- **S1v** — mid-file Evidence scroll (micro soft-stay settled, not Present),
  then switch Evidence source (click another painted `.vnode` / reload
  `#srcBody`). Camera eases toward the new target within soft-follow caps
  (no wipe-then-`zoomToEl` leap); `camXSettled` / `camYSettled` clear on
  hop and can re-absorb; `__graphideScrollDrive` still publishes for the
  new file (`targetNodeId` / `activeLine`). One cam path; first-ever open
  may still zoom.

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
  `scrollDriveSoftCamX`, `SCROLL_CAMX_FOLLOW_CAP`,
  `absorbScrollDriveSoftCamX`, `camXSettled`,
  `absorbScrollDriveSoftCamY`, `camYSettled`, `scrollDriveYNudgeOrigin`,
  soft remapping in `applyScrollDriveCamera` (S1t — no `zoomToEl` when
  base exists mid-scroll),
  `SCROLL_MACRO_CAM_FOLLOW_CAP`, `SCROLL_MACRO_K_DELTA_CAP`,
  `scrollDriveWasMacro`, soft remapping in `applyScrollDriveMacro` (S1u),
  `softStayScrollDriveAcrossSourceHop`, soft stay in `showSource` /
  `selectNode` zoomEl skip (S1v).
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
  S1r only folds soft camX into `scrollDriveBase` on idle settle / low
  `scrollVel` (reuses S1g settle timer) — never a parallel tween; S1k
  snap-absorbs; Present pause / macro no-op.
  S1s only folds soft camY into `scrollDriveBase` on the same settle /
  low-`scrollVel` path (rebases Y-nudge origin) — never a parallel tween;
  S1k snap-absorbs; Present pause / macro no-op.
  S1t only soft-stays on nest/line remap mid-scroll (seed from `camTo`,
  S1q soft follow, clear settle flags) — never a parallel tween; first
  lock may still `zoomToEl`; Present pause no-ops; macro soft-stay is S1u.
  S1u only soft-stays on macro enter/exit / macro-hot remap (seed from
  `camTo`, capped k delta, lighter soft follow) — never a parallel tween;
  cold first lock may still `zoomToEl`; S1k snaps; Present pause no-ops.
  S1v only soft-stays on Evidence file / sourceId hop (seed from `camTo`,
  clear lock + settle + old paint) — never a parallel tween; first-ever
  open may still `zoomToEl`; Present pause / no-base fall through to clear.
- Unscrollable Evidence (short snippet) must not enter macro LOD.
- **S1o feature-map sync:** `open-evidence.md` defers `S1a`–`S1n` ownership
  here (not just `S1a`–`S1g`); `presentation.md` points S1m Present-pause
  side-effect at this map. Index Live proof stays `S1a`–`S1v`.
- **S1p active-line cue:** Evidence editor tint pairs with S1n graph glow;
  `open-evidence.md` / index deferral extends to `S1a`–`S1p`. Clear on
  Present pause / close — do not leave a stale `.scroll-drive-active`.
- **S1q soft camX follow:** one cam path; Present pause; don't fight macro.
  `open-evidence.md` / index / presentation deferral extends to `S1a`–`S1q`.
- **S1r idle-settle camX into base:** absorb on S1g settle / low vel; no
  second RAF; don't fight macro. Deferral extends to `S1a`–`S1r`.
- **S1s idle-settle camY into base:** absorb on same settle path; rebase
  Y-nudge origin. Deferral extends to `S1a`–`S1s`.
- **S1t nest-focus remap soft-cam stay:** mid-scroll remaps soft-follow
  from live `camTo` (no `zoomToEl` yank); first lock may zoom; settle
  flags clear for re-absorb. Deferral extends to `S1a`–`S1t`.
- **S1u macro-path soft remap / camK soft stay:** macro enter/exit /
  hot remap seed from `camTo` + capped k / lighter soft follow; cold
  first lock may zoom; S1k snaps. Deferral extends to `S1a`–`S1u`.
- **S1v Evidence file-hop soft stay:** `showSource` seeds from `camTo`
  when prior base exists (no wipe-then-`zoomToEl`); `selectNode` skips
  hard `zoomEl` while ScrollDrive base is live; settle flags clear for
  re-absorb; first-ever open may zoom. Deferral extends to `S1a`–`S1v`.
