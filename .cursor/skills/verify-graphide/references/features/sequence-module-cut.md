# Sequence module-cut graphic

A stacked composition of this flow’s Sequence hops that stay inside one
module versus hops that cross modules — so a reviewer can read same- vs
cross-module mass, not only CMS swimlanes and a `data-cms-cross` mark on
individual hop cards. Counts come from the same `sequenceOf` hops and
`seqModuleOf` / lane map the desk already paints (including CMS
`data-cms-cross`). No second XYFlow, no peekSource, no Play / enterRun
from the strip. Not a kind-mix (SHK), not a story-scrub (SSS), not a
subject-card clone, and not a lit/grey or changed/uncovered cut.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `sequenceModuleCutMetrics` → `sequenceModuleCutGraphicHtml` →
  `syncSequenceModuleCutChrome` / `bindSequenceModuleCutGraphic` →
  `applySequenceModuleCutPaint`. Focus is `sequenceModuleCutFocus`
  (`same` | `cross`). Escape after SHK clears graphic focus only
  (`seqCursor` stays if the scrubber is live; a second Escape still
  belongs to SSS when the cursor is active).
- Strip `.smc-strip[data-smc="1"]` in Sequence chrome after the hop-kind
  strip, with `.smc-stat[data-smc]` counts (`[data-smc-n]`) for same /
  cross and a stacked `.smc-bar` of `.smc-seg` segments (omit a segment
  when its count is 0). Same + cross equals `#seqHops .seq-hop` length
  when every hop has both lane modules.
- Click Cross highlights `#seqHops .seq-hop[data-cms-cross="1"]`; click
  Same highlights hops without that mark. Second click of the same
  measure, or Escape (after SHK), clears graphic focus. Must not
  open Evidence / `peekSource` / the source pane, and must not start
  Play. Existing `#seqCanvas` XYFlow stays; do not add another canvas.
- CSS in `extension/media/main.css`: `.smc-strip` / `.smc-stat` /
  `.smc-bar` / `.smc-seg` / `#seqHops .seq-hop.smc-hit`. Highlight with
  a box-shadow only (do not override `.dim` / `.shk-dim` / `.ssr-dim` /
  `.sss-ahead` opacity).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview, then open **Sequence**.
2. Under the hop-kind mix, a module-cut graphic shows how many hops stay
   inside one module versus how many cross modules (the same numbers as
   the painted hop cards and CMS `data-cms-cross`).
3. Click Cross to highlight cross-module hops; Escape clears the graphic
   focus without leaving Sequence.

The explorer fixture’s boot / control-flow Steiner yields 9 hops, all
cross-module (`src` and each `src/simulation/*` stem are distinct
modules): same=0, cross=9. A flow with no same-module hops is an honest
empty same cut (0 / N), not invented history. The dedicated
`?sequence=1` fixture is thinner (1 hop, all cross) and is not the
proof document.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="sequence"]` in the already-open
explorer document after Map MHS (do not add a mid-suite `page.goto`).
Later Slice tests click Slice themselves.

Driver assertions (SMC1–SMC5):

- `.smc-strip[data-smc="1"]` present; same + cross equals hop-card
  count; explorer is 0 / 9 / 9; existing `#seqCanvas` stays; no source
- click Cross highlights `[data-cms-cross="1"]` hops; Sequence stays;
  no peekSource
- Escape clears graphic focus; Sequence stays
- click Same is an honest 0-hit cut when same=0; screenshot
  `verification/sequence-module-cut.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent hop membership. Use the same `sequenceOf` hops and
  `seqModuleOf` / CMS lane map (`data-cms-cross`) the list already
  paints.
- Do not treat this as SHK (hop kind), SSS (story scrub), CMS (lanes
  only), TPC (snap-wide changed / uncovered), or MWC (enter lit / grey).
  The product is same- vs cross-module hop mass as a stacked
  composition.
- A `0` same (or `0` cross) cut is honest; show zeros and omit empty
  bar segments.
- Do not override `.dim` / `.shk-dim` / `.ssr-dim` / `.sss-ahead`
  opacity, and do not call `peekSource` / `showHop` / Play from the
  strip. Do not change `seqCursor` from the strip (SSS owns the cursor).
- Place the strip in Sequence chrome (after SHK), not as an enter
  in-flow row or a full-width overlay over `#seqCanvas` (MWC E1j /
  n0-click: do not shrink a fitted viewport or intercept canvas clicks).
- Rebuild `extension/media/main.js` with `npm run build:webview` using
  in-tree `node_modules` (no worktree symlink).
- Reseal the immutable lock *after* any edit to this feature map.
