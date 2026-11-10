# Slice walk-hop graphic

A stacked composition of this Slice’s painted hops whose both ends sit
on the Steiner walk versus hops that reach a 1-hop halo neighbor — so
a reviewer can read walk / halo hop mass, not only STE’s tree vs extra
cut or SWR’s start/mid/end/off node roles. Counts come from the same
`sliceCanvasProps` hops the canvas already paints. A hop is walk when
both `from` and `to` are current-flow tree nodes; otherwise it is halo.
The explorer’s off-tree `n0→n3` Reads is walk (both ends on the walk)
and extra (not a tree edge) — STE and SWH disagree on that hop, which
is the point. No second XYFlow, no peekSource, no showHop, no
selectNode from the strip. Not a kind-mix, not a story-scrub, not a
subject-card clone, and not a walk-role, hop-variant, module-cut,
enter distance, tree-edge, or Map community-cut.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `sliceWalkHopNodeSet` / `sliceWalkHopOf` → `sliceWalkHopMetrics` →
  `sliceWalkHopGraphicHtml` → `syncSliceWalkHopGraphic` /
  `bindSliceWalkHopGraphic` → `applySliceWalkHopPaint`. Focus is
  `sliceWalkHopFocus` (`walk` | `halo`). Escape after STE clears
  graphic focus only (stay on Slice).
- SWR, STE, and SWH share `.slice-title-cuts` (`position:absolute;
  top:6px; right:12px`; column, pointer-events only on the strips) so
  the Slice viewport does not shrink and later `#sliceCanvas` clicks
  (n0) are not intercepted. Leftover cluster / strips are removed
  off-Slice.
- Strip `.swh-strip[data-swh="1"]` with `.swh-stat[data-swh-band]`
  counts (`[data-swh-n]`) for walk / halo and a stacked `.swh-bar` of
  `.swh-seg` segments (omit a segment when its count is 0). Band
  totals equal `#sliceCanvas .react-flow__edge[data-swh-cut]` length.
  `sliceCanvasProps` stamps `walkHop` on each hop; apply paints
  `data-swh-cut` after XYFlow mount (same rAF schedule as STE).
- Click a band highlights `#sliceCanvas .react-flow__edge` whose
  `data-swh-cut` matches. Second click of the same measure, or Escape
  (after STE), clears graphic focus. Must not open Evidence /
  `peekSource` / `showHop` / the source pane, and must not
  `selectNode`. Existing `#sliceCanvas` XYFlow stays; do not add
  another canvas.
- CSS in `extension/media/main.css`: `.swh-strip` / `.swh-stat` /
  `.swh-bar` / `.swh-seg` / `#sliceCanvas .react-flow__edge.swh-hit`.
  Highlight with a stroke only (do not override `.dim` / `.grey` /
  `.slice-dim` / `.shm-dim` / `.ego-dim` / `.ste-hit` / `.swr-hit`
  opacity).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview, then open **Slice**.
2. In the title-band with the walk-role and tree-edge graphics, a
   walk-hop graphic shows how many painted hops stay among walk
   members versus how many reach a 1-hop neighbor (the same numbers
   as the canvas edges and `data-swh-cut`).
3. Click Halo to highlight those edges; Escape clears the graphic
   focus without leaving Slice.

The explorer fixture’s boot / control-flow Steiner yields 32 painted
hops in the 29-node window: 8 walk, 24 halo. The 8 include the 7 tree
edges plus `n0→n3` Reads. A flow whose slice is only the tree is an
honest empty halo cut (0 / N), not invented history.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="slice"]` in the already-open
explorer document after Sequence SHV / Slice SHM / SWR / STE (do not
add a mid-suite `page.goto`). Later CPS tests click Overview
themselves.

Driver assertions (SWH1–SWH5):

- `.swh-strip[data-swh="1"]` present in `.slice-title-cuts` with SWR
  and STE; walk + halo equals painted edge count; explorer is 8 / 24
  of 32; existing `#sliceCanvas` stays; no source
- click Halo highlights `[data-swh-cut="halo"]`; Slice stays; no
  peekSource / showHop
- Escape clears graphic focus; Slice stays
- the title-band cluster does not intercept `#sliceCanvas` n0 clicks
- screenshot `verification/slice-walk-hop.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent hop membership. Use the same `sliceCanvasProps` hops
  and classify walk vs halo from the current flow’s tree *nodes*
  (both ends on the walk). Off-tree hops between walk members
  (explorer `n0→n3` Reads) are walk, not halo — that is the
  difference from STE’s tree vs extra cut.
- Do not treat this as STE (tree vs extra edges), SWR (node
  walk-role), SHM (hop kind), MWC, MED, SHV, SMC, MCC, or TPC. The
  product is walk / halo hop mass as a stacked composition.
- A `0` band is honest; show zeros and omit empty bar segments.
- Do not override `.dim` / `.grey` / `.slice-dim` / `.shm-dim` /
  `.ego-dim` / `.ste-hit` / `.swr-hit` opacity, and do not call
  `peekSource` / `showHop` / `selectNode` from the strip.
- Place the strip in the Slice `.slice-title-cuts` title-band with
  SWR/STE, not as an in-flow row between the title and `#sliceCanvas`
  and not as a full-width overlay over vnodes (MWC E1j / n0-click /
  MCC G4b). Stack the cluster in a column so it stays narrow. Prove
  n0 stays clickable (`inNode`, `hitStrip=false`).
- Rebuild `extension/media/main.js` with `npm run build:webview` using
  in-tree `node_modules` (no worktree symlink).
- Reseal the immutable lock *after* any edit to this feature map.
