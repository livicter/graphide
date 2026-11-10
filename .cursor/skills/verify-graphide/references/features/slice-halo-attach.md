# Slice halo-attach graphic

A stacked composition of this Slice’s halo hops that attach a 1-hop
neighbor to the Steiner walk versus hops that stay among halo
neighbors — so a reviewer can read bridge vs outer mass, not only
SWH’s walk vs halo (which lumps those 24) or STE’s tree vs extra.
Counts come from the same `sliceCanvasProps` hops the canvas already
paints (`data-sha-cut`). The 8 walk hops are not a band (that cut is
SWH). No peekSource, no showHop from the strip. Not a kind-mix, not a
story-scrub, not a walk-hop clone, and not a tree-edge cut.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `sliceHaloAttachOf` → `sliceHaloAttachMetrics` →
  `sliceHaloAttachGraphicHtml` → `syncSliceHaloAttachGraphic` /
  `bindSliceHaloAttachGraphic` → `applySliceHaloAttachPaint` /
  `scheduleSliceHaloAttachPaint` (apply + double rAF, STE/SWH
  parity). Focus is `sliceHaloAttachFocus` (`bridge` | `outer`).
  Escape after SWH clears graphic focus only (stay on Slice).
- Strip `.sha-strip[data-sha="1"]` in `.slice-title-cuts` with
  SWR/STE/SWH, with `.sha-stat[data-sha-band]` counts (`[data-sha-n]`)
  for bridge / outer and a stacked `.sha-bar` of `.sha-seg` segments
  (omit a segment when its count is 0). Band totals equal halo hop
  count (explorer 24 of 32). All painted edges stamp `data-sha-cut`
  (`walk` | `bridge` | `outer`).
- Click a band highlights `#sliceCanvas .react-flow__edge` whose
  `data-sha-cut` matches. Second click of the same measure, or Escape
  (after SWH), clears graphic focus. Must not open Evidence /
  `peekSource` / `showHop` / `selectNode` / the source pane.
- CSS in `extension/media/main.css`: `.sha-strip` / `.sha-stat` /
  `.sha-bar` / `.sha-seg` / `#sliceCanvas .react-flow__edge.sha-hit`.
  Cluster stays absolute on `.stage` (column; pointer-events only on
  strips). Highlight stroke only (do not override `.dim` / `.grey` /
  `.ste-dim` / `.swh-dim`).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open **Slice** of the boot / control-flow walk.
2. Under the walk-hop graphic, a halo-attach graphic shows how many
   of the halo hops attach a neighbor to the walk versus how many stay
   among neighbors (the same numbers as `data-sha-cut` on the painted
   edges).
3. Click Outer to highlight those two hops; Escape clears the graphic
   focus without leaving Slice.

The explorer fixture paints 32 hops: 8 walk (SWH), 22 bridge, 2 outer
(`n12→n24` and `n19→n31` Calls). The strip shows 22 / 2 of 24 halo
hops.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then stay on `#workspaces [data-ws="slice"]` in the already-open
explorer document after SWH (do not add a mid-suite `page.goto`).
Later CPS tests click Overview themselves.

Driver assertions (SHA1–SHA5):

- `.sha-strip[data-sha="1"]` present in `.slice-title-cuts` with
  SWR/STE/SWH; explorer is 22 bridge / 2 outer of 24 halo hops,
  matching `data-sha-cut`; no source
- click Outer highlights the 2 outer edges; Slice stays; no peekSource
- Escape clears graphic focus; Slice stays
- title-band cluster does not intercept `#sliceCanvas` n0 clicks
- screenshot `verification/slice-halo-attach.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent hop membership. Bridge = exactly one end in
  `flow.tree.nodes`; outer = neither end in the walk. Do not put a
  walk band on this strip (that mass is SWH).
- Do not treat this as SWH (walk vs halo), STE (tree-edge key), SWR
  (node roles), or SHM (kind).
- Do not `page.goto` mid-suite; run after SWH5c, before the CPS
  Overview click, still on Slice.
- Schedule paint with the same double-rAF as STE/SWH; tests should
  `waitForFunction` for 32 `[data-sha-cut]` edges, not a visible SVG
  wait.
- Do not post `peekSource` / `showHop` / `selectNode` from the strip.
- Do not shrink the Slice viewport or intercept n0 (fourth strip in
  the column cluster; pointer-events only on the strips).
