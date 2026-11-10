# Map community-cut graphic

A stacked composition of this Map’s altitude community cards that
intersect the current Steiner walk versus those that sit off it — so a
reviewer can read on-tree / off-tree community mass, not only MAC kind
bars, MCS size bars, MHS hop×size bars, or MWC’s enter lit/grey vnode
cut. Counts come from the same `mapAltitudeBubbles()` cards and
`bubbleMarks(b).onTree` the Map already paints. A card is on when it
has at least one current-flow tree member; otherwise it is off. No
second XYFlow, no peekSource, no enterRun / enterMapBubble from the
strip. Not a kind-mix, not a story-scrub, not a subject-card clone,
and not a walk-role, hop-variant, module-cut, enter distance, or
Slice tree-edge cut.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `mapCommunityCutOf` → `mapCommunityCutMetrics` →
  `mapCommunityCutGraphicHtml` → `refreshMapCommunityCutStrip` /
  `bindMapCommunityCutGraphic` → `applyMapCommunityCutPaint`. Focus is
  `mapCommunityCutFocus` (`on` | `off`). Escape after MHS clears
  graphic focus only (stay on Map). Clicking a band also clears a live
  MAC / MCS / MHS filter so card highlight stays honest.
- Strip `.mcc-strip[data-mcc="1"]` as an absolute title-band on Map
  `.stage` (`top:6px; right:12px`; pointer-events on the strip only) so
  the community viewport does not shrink (G4b), with `.mcc-stat[data-mcc-band]` counts (`[data-mcc-n]`) for
  on / off and a stacked `.mcc-bar` of `.mcc-seg` segments (omit a
  segment when its count is 0). Band totals equal
  `.bubble-card[data-mcc-cut]` length. `applyBubbleCardEl` (and the
  first-paint card HTML) stamps `data-mcc-cut`.
- Click a band highlights `.bubble-card` whose `data-mcc-cut` matches
  (`on` = at least one tree member). Second click of the same measure,
  or Escape (after MHS), clears graphic focus. Must not open Evidence
  / `peekSource` / the source pane, and must not `enterMapBubble` /
  `enterRun`. Existing community XY / card Map stays; do not add
  another canvas.
- CSS in `extension/media/main.css`: `.mcc-strip` / `.mcc-stat` /
  `.mcc-bar` / `.mcc-seg` / `.bubble-card.mcc-hit`. Highlight with a
  box-shadow / outline only (do not override `.dim` / `.mac-dim` /
  `.mcs-dim` / `.mhs-dim` opacity).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview, then open **Map**.
2. In the Map title band, a community-cut graphic shows how many
   altitude cards intersect the current Steiner walk versus how many
   sit off it (the same numbers as the cards’ “on tree” marks and
   `data-mcc-cut`).
3. Click Off to highlight communities that do not carry the walk;
   Escape clears the graphic focus without leaving Map or entering a
   community.

The explorer fixture’s 12 altitude communities split 8 on (render,
integration, origin, lod, bodies, camera, config, ui — n0–n7) and 4
off (physics, assets, input, debug). A Map whose every community
touches the walk is an honest empty off cut (0 / N), not invented
history.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="map"]` in the already-open explorer
document after MHS (do not add a mid-suite `page.goto`). Clear any
live MHS/MCS/MAC filter first. Later SMC tests click Sequence
themselves.

Driver assertions (MCC1–MCC5):

- `.mcc-strip[data-mcc="1"]` present after MHS; on + off equals
  community-card count; explorer is 8 / 4 of 12; `data-mcc-cut`
  matches; Map stays (no enter); no source
- click Off highlights the 4 off-tree cards (including
  `b-physics`); Map stays; no enter / peekSource
- Escape clears graphic focus; Map stays
- screenshot `verification/map-community-cut.png` is not a black
  frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent card membership. Use the same `mapAltitudeBubbles()`
  cards and `bubbleMarks(b).onTree` (current flow’s tree nodes) the
  Map already paints. Root `b-root` is not an altitude card.
- Do not treat this as MAC (kind), MCS (size), MHS (hop×size), or MWC
  (enter lit/grey vnodes of one community). The product is on-tree /
  off-tree community-card mass as a stacked composition.
- A `0` band is honest; show zeros and omit empty bar segments.
- Do not override `.dim` / `.mac-dim` / `.mcs-dim` / `.mhs-dim`
  opacity, and do not call `peekSource` / `enterMapBubble` / `enterRun`
  from the strip. Card clicks still enter a community as they do
  today.
- Place the strip as a Map `.stage` title-band, not as an in-flow row
  between the hop×size strip and `.viewport` (that shrinks the narrow
  desk and breaks G4b) and not as a full-width overlay over community
  cards (MWC E1j / n0-click).
- Rebuild `extension/media/main.js` with `npm run build:webview` using
  in-tree `node_modules` (no worktree symlink).
- Reseal the immutable lock *after* any edit to this feature map.
