# Slice fan-degree graphic

A stacked composition of this Slice’s painted members that sit on
exactly one painted hop versus those that sit on two or more — so a
reviewer can read single vs multi fan-degree mass, not only SWR’s
walk-role of all 29, SHH’s halo home vs away, or SHA’s hop bridge vs
outer (which is a different mass). Counts come from the same
`sliceCanvasProps` members the canvas already paints (`data-sfd-cut`).
Degree is counted on the painted hops, not the full graph. The 8 walk
members are not a band (that cut is SWR; they are all multi here). No
peekSource, no showHop from the strip. Not a kind-mix, not a
story-scrub, and not a halo-file or halo-polarity cut.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `sliceFanDegreeOf` → `sliceFanDegreeMetrics` →
  `sliceFanDegreeGraphicHtml` → `syncSliceFanDegreeGraphic` /
  `bindSliceFanDegreeGraphic` → `applySliceFanDegreePaint` /
  `scheduleSliceFanDegreePaint` (apply + double rAF). Focus is
  `sliceFanDegreeFocus` (`single` | `multi`). Escape after SHH clears
  graphic focus only (stay on Slice).
- Strip `.sfd-strip[data-sfd="1"]` in `.slice-title-cuts` with
  SWR/STE/SWH/SHA/SRT/SBP/SHC/SHH, with `.sfd-stat[data-sfd-band]`
  counts (`[data-sfd-n]`) for single / multi and a stacked `.sfd-bar`
  of `.sfd-seg` segments (omit a segment when its count is 0). Band
  totals equal painted vnode count (explorer 29). All painted members
  stamp `data-sfd-cut` (`single` | `multi`).
- Click a band highlights `#sliceCanvas .vnode` whose `data-sfd-cut`
  matches. Second click of the same measure, or Escape (after SHH),
  clears graphic focus. Must not open Evidence / `peekSource` /
  `showHop` / `selectNode` / the source pane.
- CSS in `extension/media/main.css`: `.sfd-strip` / `.sfd-stat` /
  `.sfd-bar` / `.sfd-seg` / `#sliceCanvas .vnode.sfd-hit`. Cluster
  stays absolute on `.stage` (column; pointer-events only on strips).
  Highlight ring only (do not override `.dim` / `.grey` / `.ego-dim` /
  existing `*-hit`).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open **Slice** of the boot / control-flow walk.
2. Under the halo-home graphic, a fan-degree graphic shows how many
   of the painted members sit on exactly one painted hop versus how
   many sit on two or more (the same numbers as `data-sfd-cut` on the
   painted members).
3. Click Single to highlight those sixteen members; Escape clears the
   graphic focus without leaving Slice.

The explorer fixture paints 29 members and 32 hops. 16 are single and
13 are multi. All 8 walk members are multi. Of the 21 halo, 16 are
single and 5 are multi.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then stay on `#workspaces [data-ws="slice"]` in the already-open
explorer document after SHH (do not add a mid-suite `page.goto`).
Later CPS tests click Overview themselves.

Driver assertions (SFD1–SFD5):

- `.sfd-strip[data-sfd="1"]` present in `.slice-title-cuts` with
  SWR/STE/SWH/SHA/SRT/SBP/SHC/SHH; explorer is 16 single / 13 multi
  of 29, matching `data-sfd-cut`; no walk band; no source
- click Single highlights the 16 single members; Slice stays; no
  peekSource
- Escape clears graphic focus; Slice stays
- title-band cluster does not intercept `#sliceCanvas` n0 clicks
- screenshot `verification/slice-fan-degree.png` is not a black
  frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent membership. Single = exactly one incident painted
  hop; multi = two or more. Count `sliceCanvasProps` hops, not the
  full graph. Do not put a walk band on this strip.
- Do not treat this as SWR, SHH, SHA, a coverage / kind-mix cut,
  halo-file, or halo-polarity. Do not revive those dropped leftovers.
- Title-band must stay absolute on `.stage`. Prefer a column cluster
  with SWR/STE/SWH/SHA/SRT/SBP/SHC/SHH so n0 stays clickable (MWC E1j
  / MCC G4b). A ninth Slice strip is a layout risk; prove n0 before
  merge.
- Do not `page.goto` mid-suite. Insert SFD tests after SHH5c Escape
  and before CPS’s Overview click.
- Stamp `sfdCut` in `sliceCanvasProps` after hops are built and pass
  `data-sfd-cut` through `derived-node.jsx` / the Slice path in
  `sequence-canvas.jsx`. `waitForFunction` for 29 `[data-sfd-cut]`
  vnodes.
