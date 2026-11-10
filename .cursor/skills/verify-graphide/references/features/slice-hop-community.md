# Slice hop-community graphic

A stacked composition of this Slice’s painted hops that stay inside a
Map community versus hops that cross communities — so a reviewer can
read same vs cross mass, not only STE’s tree vs extra, SWH’s walk vs
halo, SHA’s bridge vs outer, SRT’s run-touch, or SBP’s out vs in.
Counts come from the same `sliceCanvasProps` hops the canvas already
paints (`data-shc-cut`). Community is the node’s Map altitude bubble
(`mapAltitudeBubbles()` members), not file stem (SMC) and not
`i % 12` hard-coded. No peekSource, no showHop from the strip. Not a
kind-mix, not a story-scrub, and not a Map community-cut clone (MCC
is on-tree vs off-tree of altitude cards).

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `sliceHopCommunityId` → `sliceHopCommunityOf` →
  `sliceHopCommunityMetrics` → `sliceHopCommunityGraphicHtml` →
  `syncSliceHopCommunityGraphic` / `bindSliceHopCommunityGraphic` →
  `applySliceHopCommunityPaint` / `scheduleSliceHopCommunityPaint`
  (apply + double rAF, STE/SWH/SHA/SRT/SBP parity). Focus is
  `sliceHopCommunityFocus` (`same` | `cross`). Escape after SBP
  clears graphic focus only (stay on Slice).
- Strip `.shc-strip[data-shc="1"]` in `.slice-title-cuts` with
  SWR/STE/SWH/SHA/SRT/SBP, with `.shc-stat[data-shc-band]` counts
  (`[data-shc-n]`) for same / cross and a stacked `.shc-bar` of
  `.shc-seg` segments (omit a segment when its count is 0). Band
  totals equal painted hop count (explorer 32). All painted edges
  stamp `data-shc-cut` (`same` | `cross`).
- Click a band highlights `#sliceCanvas .react-flow__edge` whose
  `data-shc-cut` matches. Second click of the same measure, or Escape
  (after SBP), clears graphic focus. Must not open Evidence /
  `peekSource` / `showHop` / `selectNode` / the source pane.
- CSS in `extension/media/main.css`: `.shc-strip` / `.shc-stat` /
  `.shc-bar` / `.shc-seg` / `#sliceCanvas .react-flow__edge.shc-hit`.
  Cluster stays absolute on `.stage` (column; pointer-events only on
  strips). Highlight stroke only (do not override `.dim` / `.grey` /
  `.ste-dim` / `.swh-dim` / `.sha-dim` / `.srt-dim` / `.sbp-dim`).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open **Slice** of the boot / control-flow walk.
2. Under the bridge-polarity graphic, a hop-community graphic shows
   how many of the painted hops stay inside a Map community versus
   how many cross communities (the same numbers as `data-shc-cut` on
   the painted edges).
3. Click Same to highlight those ten hops; Escape clears the graphic
   focus without leaving Slice.

The explorer fixture paints 32 hops: 10 same / 22 cross. The Steiner
walk’s 8 hops are all cross; both SHA outer hops are same.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then stay on `#workspaces [data-ws="slice"]` in the already-open
explorer document after SBP (do not add a mid-suite `page.goto`).
Later CPS tests click Overview themselves.

Driver assertions (SHC1–SHC5):

- `.shc-strip[data-shc="1"]` present in `.slice-title-cuts` with
  SWR/STE/SWH/SHA/SRT/SBP; explorer is 10 same / 22 cross of 32,
  matching `data-shc-cut`; no source
- click Same highlights the 10 same-community edges; Slice stays; no
  peekSource
- Escape clears graphic focus; Slice stays
- title-band cluster does not intercept `#sliceCanvas` n0 clicks
- screenshot `verification/slice-hop-community.png` is not a black
  frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent hop membership. Same = both ends share a Map
  altitude bubble id from `mapAltitudeBubbles()`; cross = they do
  not. Do not hard-code `i % 12`.
- Do not treat this as MCC (card on-tree vs off-tree), SMC (Sequence
  file-stem), STE, SWH, SHA, SRT, or SBP.
- Title-band must stay absolute on `.stage`. Prefer a column cluster
  with SWR/STE/SWH/SHA/SRT/SBP so n0 stays clickable (MWC E1j /
  MCC G4b).
- Do not `page.goto` mid-suite. Insert SHC tests after SBP5c Escape
  and before CPS’s Overview click.
- XYFlow edges may be absent at the first apply after
  `renderSliceCanvas`. Schedule apply + double rAF, and
  `waitForFunction` for 32 `[data-shc-cut]` edges.
