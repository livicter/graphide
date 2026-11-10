# Map walk-cut graphic

A stacked composition of this community’s review-relevant members that
sit on the current flow’s Steiner walk (lit) versus siblings off that
walk (grey) — so a reviewer can read the enter cut’s mass, not only the
title “walk lit, siblings grey · N review-relevant.” Counts come from
the same `inner.nodes` the enter canvas already paints (including the
product’s 24-member enter cap — not invented unsliced membership, and
not Timeline’s snap-wide changed/uncovered cut). No second XYFlow, no
peekSource, no enterRun from the strip. Not a kind-mix, not a scrub,
and not a subject-card clone.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `mapWalkCutMetrics` → `mapWalkCutGraphicHtml` →
  `syncMapWalkCutGraphic` / `bindMapWalkCutGraphic` →
  `applyMapWalkCutPaint`. Focus is `mapWalkCutFocus` (`lit` | `grey`).
  Escape clears when `#enterCanvas` is open; the community stay is
  unchanged (do not `goBack`).
- Strip `.mwc-strip[data-mwc="1"]` under the enter flow-title, with
  `.mwc-stat[data-mwc]` counts (`[data-mwc-n]`) for lit / grey and a
  stacked `.mwc-bar` of `.mwc-seg` segments (omit a segment when its
  count is 0). Lit + grey equals the title’s N and
  `#enterCanvas .vnode[data-lit]` length.
- Click Lit highlights `#enterCanvas .vnode[data-lit="1"]`; click Grey
  highlights `[data-lit="0"]`. Second click of the same measure, or
  Escape, clears graphic focus. Must not open Evidence / `peekSource` /
  the source pane, and must not post `enterRun`. Existing enter XYFlow
  stays; do not add another canvas.
- CSS in `extension/media/main.css`: `.mwc-strip` / `.mwc-stat` /
  `.mwc-bar` / `.mwc-seg` / `#enterCanvas .vnode.mwc-hit`. Existing
  `.vnode.grey` opacity stays (do not override `.dim` / `.ego-dim` /
  `.hit`).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview, then open **Map**.
2. Enter a leaf community (for example `b-render`).
3. Under the “walk lit, siblings grey” title, a walk-cut graphic shows
   how many of the review-relevant members are on the current walk
   versus grey siblings (the same numbers as the painted vnodes and the
   title’s N). Click Grey to highlight off-walk members; Escape clears
   the graphic focus without leaving the community.

The explorer fixture’s `b-render` leaf is capped at 24 review-relevant
members: `n0` is lit on the walk, the other 23 shown members are grey
(lit=1, grey=23). A community with no lit members is an honest empty
walk cut (0 / N), not invented history.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="map"]` and enter
`.bubble-card[data-bubble="b-render"]` (do not add a mid-suite
`page.goto`). After proof, leave enter with Back so later Map tests
still see community LOD.

Driver assertions (MWC1–MWC5):

- `.mwc-strip[data-mwc="1"]` present; lit + grey equals the title N and
  vnode count; explorer `b-render` is 1 / 23 / 24; existing enter
  XYFlow stays; no source
- click Grey highlights `[data-lit="0"]` vnodes; enter stays; no peekSource
- Escape clears graphic focus; enter stays
- click Lit highlights `[data-lit="1"]`; MBE captions stay; no peekSource
- screenshot `verification/map-walk-cut.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent unsliced membership. Use the same `inner.nodes` (24-cap)
  as `enterCanvasProps` / the flow-title N.
- Do not treat this as Timeline TPC (changed vs uncovered of the whole
  snap) or as a kind-mix / scrub / subject grouping. The product is
  this community’s walk vs siblings as a stacked composition.
- A `0` lit community is honest; show zeros and omit empty bar
  segments.
- Do not override `.vnode.grey` / `.dim` / `.ego-dim` opacity, and do
  not call `selectNode` / `peekSource` / `enterRun` from the strip.
- Rebuild `extension/media/main.js` with `npm run build:webview` using
  in-tree `node_modules` (no worktree symlink).
- Reseal the immutable lock *after* any edit to this feature map.
