# Map enter distance-cut graphic

A stacked composition of this community’s review-relevant members by
Steiner/graph hop distance from the current walk (0 / 1 / 2 / 3+) — so
a reviewer can read how far the shown members sit off the walk, not only
MWC’s binary lit vs grey cut or the fade already painted on
`data-slice-dist`. Counts come from the same `inner.nodes` the enter
canvas already paints (including the product’s 24-member enter cap —
not invented unsliced membership, and not Timeline’s snap-wide
changed/uncovered cut). No second XYFlow, no peekSource, no enterRun
from the strip. Not a kind-mix, not a scrub, not a subject-card clone,
and not a Sequence module-cut.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `mapEnterDistMetrics` → `mapEnterDistGraphicHtml` →
  `syncMapEnterDistGraphic` / `bindMapEnterDistGraphic` →
  `applyMapEnterDistPaint`. Focus is `mapEnterDistFocus`
  (`0` | `1` | `2` | `3`, where `3` means 3+). Escape after MWC clears
  graphic focus only (the community stay is unchanged; do not `goBack`).
- Strip `.med-strip[data-med="1"]` in the enter title-band cluster with
  MWC (`.enter-title-cuts`, absolute `top:6px; right:12px`), with
  `.med-stat[data-med-band]` counts (`[data-med-n]`) for 0 / 1 / 2 / 3+ and
  a stacked `.med-bar` of `.med-seg` segments (omit a segment when its
  count is 0). Band totals equal the title’s N and
  `#enterCanvas .vnode[data-slice-dist]` length.
- Click a band highlights `#enterCanvas .vnode` whose `data-slice-dist`
  falls in that band (`3` = distance ≥ 3). Second click of the same
  measure, or Escape (after MWC), clears graphic focus. Must not open
  Evidence / `peekSource` / the source pane, and must not post
  `enterRun`. Existing enter XYFlow stays; do not add another canvas.
- CSS in `extension/media/main.css`: `.enter-title-cuts` / `.med-strip`
  / `.med-stat` / `.med-bar` / `.med-seg` /
  `#enterCanvas .vnode.med-hit`. Highlight with a box-shadow only (do
  not override `.vnode.grey` / `.dim` / `.ego-dim` / `.mwc-hit`
  opacity). The cluster must not shrink `.viewport` or sit as a
  full-width overlay over vnodes (MWC E1j / n0-click).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview, then open **Map**.
2. Enter a leaf community (for example `b-render`).
3. In the title band, beside the walk-cut graphic, a distance-cut
   graphic shows how many of the review-relevant members sit at hop
   distance 0, 1, 2, or 3+ from the current walk (the same members as
   the title’s N and the painted vnodes). Click 3+ to highlight far
   siblings; Escape clears the graphic focus without leaving the
   community.

The explorer fixture’s `b-render` leaf is capped at 24 review-relevant
members: `n0` is on the walk (distance 0); `n12` is 1 hop off, `n108`
is 2, `n1200` is 3, and the other shown members fill those bands. A
community with no far members is an honest empty 3+ cut (0 / N), not
invented history.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="map"]` and enter
`.bubble-card[data-bubble="b-render"]` (do not add a mid-suite
`page.goto`). After Map walk-cut (MWC) has returned to Map, re-enter
`b-render` for this proof, then leave enter with Back so later Map
tests still see community LOD.

Driver assertions (MED1–MED5):

- `.med-strip[data-med="1"]` present; band totals equal the title N and
  vnode count; `n0` / `n12` / `n108` / `n1200` sit in 0 / 1 / 2 / 3+;
  existing enter XYFlow stays; MWC strip still present; no source
- click 3+ highlights `[data-slice-dist]` ≥ 3; enter stays; no peekSource
- Escape clears graphic focus; enter stays
- a vnode (`n0`) remains clickable under the title-band cluster
- screenshot `verification/map-enter-distance-cut.png` is not a black
  frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent unsliced membership. Use the same `inner.nodes` (24-cap)
  as `enterCanvasProps` / MWC / the flow-title N.
- Do not treat this as MWC (lit vs grey), Timeline TPC (changed vs
  uncovered of the whole snap), SMC (sequence same vs cross module), or
  a kind-mix / scrub / subject grouping. The product is hop-distance
  mass of the shown enter members as a stacked composition.
- A `0` band is honest; show zeros and omit empty bar segments.
- Do not override `.vnode.grey` / `.dim` / `.ego-dim` / `.mwc-hit`
  opacity, and do not call `selectNode` / `peekSource` / `enterRun`
  from the strip.
- Place the strip in the title-band cluster with MWC (absolute, pointer
  events only on controls). Do not put it in document flow between the
  title and `.viewport` (shrinks the fit box / breaks E1j) or as a
  full-width overlay over `#enterCanvas` vnodes (intercepts later
  clicks).
- Rebuild `extension/media/main.js` with `npm run build:webview` using
  in-tree `node_modules` (no worktree symlink).
- Reseal the immutable lock *after* any edit to this feature map.
