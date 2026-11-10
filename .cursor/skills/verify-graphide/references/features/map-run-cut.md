# Map run-cut graphic

A stacked composition of this flow’s Map altitude community cards that
host a flowchart run versus cards that do not — so a reviewer can
read run-bearing mass, not only MCC’s on-tree vs off-tree cut (which
disagrees on b-physics: off-tree, but it hosts a run). Counts come
from the same 12 altitude cards the grid already paints and the
current flow’s `flowchart.runs`. No peekSource, no enter from the
strip. Not a kind-mix, not a story-scrub, not a community-cut clone,
and not a Slice walk-role or Map enter cut.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `mapRunIdSet` → `mapRunCutOf` → `mapRunCutMetrics` →
  `mapRunCutGraphicHtml` → `refreshMapRunCutStrip` /
  `bindMapRunCutGraphic` → `applyMapRunCutPaint`. Focus is
  `mapRunCutFocus` (`run` | `off`). Escape after MCC clears graphic
  focus only (stay on Map).
- Strip `.mrc-strip[data-mrc="1"]` in `.map-title-cuts` with MCC,
  with `.mrc-stat[data-mrc-band]` counts (`[data-mrc-n]`) for run /
  off and a stacked `.mrc-bar` of `.mrc-seg` segments (omit a
  segment when its count is 0). Band totals equal painted
  `.bubble-card[data-mrc-cut]` length (explorer 12).
- Click a band highlights `.bubble-card` whose `data-mrc-cut`
  matches. Second click of the same measure, or Escape (after MCC),
  clears graphic focus. Must not open Evidence / `peekSource` /
  `enterMapBubble` / `enterRun` / the source pane. Jumping a band
  also clears live MAC / MCS / MHS / MCC filters.
- CSS in `extension/media/main.css`: `.map-title-cuts` cluster
  (absolute on `.stage`; pointer-events only on strips) plus
  `.mrc-strip` / `.mrc-stat` / `.mrc-bar` / `.mrc-seg` /
  `.bubble-card.mrc-hit`. Do not shrink `.viewport` (G4b). Highlight
  with a box-shadow / outline only (do not override `.dim` /
  `.mac-dim` / `.mcs-dim` / `.mhs-dim` / `.mcc-dim`).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on **Map** (altitude community cards).
2. Beside the community-cut graphic, a run-cut graphic shows how many
   cards host a flowchart run versus how many do not (the same
   numbers as `data-mrc-cut` on the painted cards).
3. Click Run to highlight the run-bearing communities; Escape clears
   the graphic focus without leaving Map or entering a community.

The explorer fixture’s boot flowchart has three runs (b-render,
b-origin, b-physics). Of the 12 altitude cards that is 3 run / 9 off.
b-physics is off-tree under MCC and on-run here.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then stay on `#workspaces [data-ws="map"]` in the already-open
explorer document after MCC (do not add a mid-suite `page.goto`).
Later Sequence tests (SMC) click Sequence themselves.

Driver assertions (MRC1–MRC5):

- `.mrc-strip[data-mrc="1"]` present in `.map-title-cuts` with MCC;
  explorer is 3 run / 9 off of 12, matching `data-mrc-cut`; no source
- click Run highlights the 3 run cards including b-physics; Map stays;
  no enter; no peekSource
- Escape clears graphic focus; Map stays
- title-band cluster does not intercept a Map card click (hit test)
- screenshot `verification/map-run-cut.png` is not a black frame
- `.graphide/stamps/` stays empty
- G4b stays a 12-card grid on a 720-wide desk (no in-flow Map chrome)

## Gotchas

- Do not invent card membership. A card is `run` when the current
  (or story) flow’s `flowchart.runs` names that bubble; otherwise
  `off`.
- Do not treat this as MCC (on-tree vs off-tree), MAC/MCS/MHS (in-flow
  mix / size filters), or a Slice run-cut.
- Do not `page.goto` mid-suite; run after MCC5c, before the SMC
  Sequence click, still on Map.
- Do not post `peekSource` / `enterMapBubble` / `enterRun` from the
  strip. Do not Escape 3× to clear leftover MAC/MCS/MHS (that would
  clear a live CFT); jumping the band clears those filters.
- Do not inject the strip in-flow between MHS and `.viewport` (G4b:
  in-flow chrome hid a row of cards). Cluster with MCC as an absolute
  title-band; prove visible 12/12 and a card remains clickable.
