# Slice bridge-polarity graphic

A stacked composition of this Slice’s halo-bridge hops that leave the
Steiner walk versus hops that arrive at it — so a reviewer can read
out vs in mass, not only SHA’s bridge vs outer (which lumps those
22), SWH’s walk vs halo, STE’s tree vs extra, or SRT’s run-touch.
Counts come from the same `sliceCanvasProps` hops the canvas already
paints (`data-sbp-cut`). The 8 walk hops and 2 outer hops are not
bands (those cuts are SWH and SHA). No peekSource, no showHop from
the strip. Not a kind-mix, not a story-scrub, and not a halo-attach
clone.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `sliceBridgePolarityOf` → `sliceBridgePolarityMetrics` →
  `sliceBridgePolarityGraphicHtml` → `syncSliceBridgePolarityGraphic` /
  `bindSliceBridgePolarityGraphic` → `applySliceBridgePolarityPaint` /
  `scheduleSliceBridgePolarityPaint` (apply + double rAF, STE/SWH/SHA/SRT
  parity). Focus is `sliceBridgePolarityFocus` (`out` | `in`).
  Escape after SRT clears graphic focus only (stay on Slice).
- Strip `.sbp-strip[data-sbp="1"]` in `.slice-title-cuts` with
  SWR/STE/SWH/SHA/SRT, with `.sbp-stat[data-sbp-band]` counts
  (`[data-sbp-n]`) for out / in and a stacked `.sbp-bar` of
  `.sbp-seg` segments (omit a segment when its count is 0). Band
  totals equal halo-bridge hop count (explorer 22 of 32). All
  painted edges stamp `data-sbp-cut` (`walk` | `out` | `in` | `outer`).
- Click a band highlights `#sliceCanvas .react-flow__edge` whose
  `data-sbp-cut` matches. Second click of the same measure, or Escape
  (after SRT), clears graphic focus. Must not open Evidence /
  `peekSource` / `showHop` / `selectNode` / the source pane.
- CSS in `extension/media/main.css`: `.sbp-strip` / `.sbp-stat` /
  `.sbp-bar` / `.sbp-seg` / `#sliceCanvas .react-flow__edge.sbp-hit`.
  Cluster stays absolute on `.stage` (column; pointer-events only on
  strips). Highlight stroke only (do not override `.dim` / `.grey` /
  `.ste-dim` / `.swh-dim` / `.sha-dim` / `.srt-dim`).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open **Slice** of the boot / control-flow walk.
2. Under the run-touch graphic, a bridge-polarity graphic shows how
   many of the halo-bridge hops leave the walk versus how many arrive
   at it (the same numbers as `data-sbp-cut` on the painted edges).
3. Click In to highlight those seven hops; Escape clears the graphic
   focus without leaving Slice.

The explorer fixture paints 32 hops: 8 walk (SWH), 22 bridge, 2
outer (SHA). Of the 22 bridge hops, 15 are out and 7 are in.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then stay on `#workspaces [data-ws="slice"]` in the already-open
explorer document after SRT (do not add a mid-suite `page.goto`).
Later CPS tests click Overview themselves.

Driver assertions (SBP1–SBP5):

- `.sbp-strip[data-sbp="1"]` present in `.slice-title-cuts` with
  SWR/STE/SWH/SHA/SRT; explorer is 15 out / 7 in of 22 bridge hops,
  matching `data-sbp-cut`; no walk or outer band; no source
- click In highlights the 7 inbound edges; Slice stays; no peekSource
- Escape clears graphic focus; Slice stays
- title-band cluster does not intercept `#sliceCanvas` n0 clicks
- screenshot `verification/slice-bridge-polarity.png` is not a black
  frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent hop membership. Out = `from` in `flow.tree.nodes`
  and `to` not; in = `to` in the walk and `from` not. Do not put a
  walk or outer band on this strip (those masses are SWH and SHA).
- Do not treat this as SHA (bridge vs outer), SWH (walk vs halo),
  STE (tree-edge key), SRT (run-touch), or SHM (kind).
- Title-band must stay absolute on `.stage`. Prefer a column cluster
  with SWR/STE/SWH/SHA/SRT so n0 stays clickable (MWC E1j / MCC G4b).
- Do not `page.goto` mid-suite. Insert SBP tests after SRT5c Escape
  and before CPS’s Overview click.
- XYFlow edges may be absent at the first apply after
  `renderSliceCanvas`. Schedule apply + double rAF, and
  `waitForFunction` for 32 `[data-sbp-cut]` edges.
