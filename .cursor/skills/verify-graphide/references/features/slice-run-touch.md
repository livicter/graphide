# Slice run-touch graphic

A stacked composition of this Slice’s painted hops that touch a named
flowchart run versus hops that stay among off-run members — so a
reviewer can read run-touch vs off mass, not only SWH’s walk vs halo,
STE’s tree vs extra, SHA’s halo bridge vs outer, or MRC’s Map-card
run vs off. Counts come from the same `sliceCanvasProps` hops the
canvas already paints (`data-srt-cut`). No peekSource, no showHop
from the strip. Not a kind-mix, not a story-scrub, not a walk-hop
clone, and not a Map run-cut clone.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `sliceRunTouchNodeSet` → `sliceRunTouchOf` →
  `sliceRunTouchMetrics` → `sliceRunTouchGraphicHtml` →
  `syncSliceRunTouchGraphic` / `bindSliceRunTouchGraphic` →
  `applySliceRunTouchPaint` / `scheduleSliceRunTouchPaint` (apply +
  double rAF, STE/SWH/SHA parity). Focus is `sliceRunTouchFocus`
  (`touch` | `off`). Escape after SHA clears graphic focus only
  (stay on Slice).
- Strip `.srt-strip[data-srt="1"]` in `.slice-title-cuts` with
  SWR/STE/SWH/SHA, with `.srt-stat[data-srt-band]` counts
  (`[data-srt-n]`) for touch / off and a stacked `.srt-bar` of
  `.srt-seg` segments (omit a segment when its count is 0). Band
  totals equal painted hop count (explorer 32). All painted edges
  stamp `data-srt-cut` (`touch` | `off`).
- Click a band highlights `#sliceCanvas .react-flow__edge` whose
  `data-srt-cut` matches. Second click of the same measure, or Escape
  (after SHA), clears graphic focus. Must not open Evidence /
  `peekSource` / `showHop` / `selectNode` / the source pane.
- CSS in `extension/media/main.css`: `.srt-strip` / `.srt-stat` /
  `.srt-bar` / `.srt-seg` / `#sliceCanvas .react-flow__edge.srt-hit`.
  Cluster stays absolute on `.stage` (column; pointer-events only on
  strips). Highlight stroke only (do not override `.dim` / `.grey` /
  `.ste-dim` / `.swh-dim` / `.sha-dim`).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open **Slice** of the boot / control-flow walk.
2. Under the halo-attach graphic, a run-touch graphic shows how many
   of the painted hops touch a named flowchart run versus how many
   stay off-run (the same numbers as `data-srt-cut` on the painted
   edges).
3. Click Off to highlight those seventeen hops; Escape clears the
   graphic focus without leaving Slice.

The explorer fixture paints 32 hops: 15 touch / 17 off. Touch uses
the same `flowchart.runs[].nodes` lists as MRC (b-render n0,n1;
b-origin n2,n3; b-physics n8,n20 — the last two are not on this
Slice). Walk hops n4→n5 / n5→n6 / n6→n7 are off-run; many SHA
bridge hops are touch.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then stay on `#workspaces [data-ws="slice"]` in the already-open
explorer document after SHA (do not add a mid-suite `page.goto`).
Later CPS tests click Overview themselves.

Driver assertions (SRT1–SRT5):

- `.srt-strip[data-srt="1"]` present in `.slice-title-cuts` with
  SWR/STE/SWH/SHA; explorer is 15 touch / 17 off of 32, matching
  `data-srt-cut`; no source
- click Off highlights the 17 off-run edges; Slice stays; no
  peekSource
- Escape clears graphic focus; Slice stays
- title-band cluster does not intercept `#sliceCanvas` n0 clicks
- screenshot `verification/slice-run-touch.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent hop membership. Touch = at least one end in
  `flowchart.runs[].nodes` of the current flow (fallback storyFlow,
  same source as MRC). Off = neither end. Do not use MRC’s
  `mapRunIdSet` (that set is bubble ids, not node ids).
- Do not treat this as SWH (walk vs halo), STE (tree-edge key), SHA
  (halo bridge vs outer), SWR (node roles), or MRC (Map card is a
  run). Do not ship a 4-band same/cross/bridge/off split; same-run
  and cross-run are only 2+2 on this fixture.
- Title-band must stay absolute on `.stage`. Prefer a column cluster
  with SWR/STE/SWH/SHA so n0 stays clickable (MWC E1j / MCC G4b).
- Do not `page.goto` mid-suite. Insert SRT tests after SHA5c Escape
  and before CPS’s Overview click.
- XYFlow edges may be absent at the first apply after
  `renderSliceCanvas`. Schedule apply + double rAF, and
  `waitForFunction` for 32 `[data-srt-cut]` edges.
