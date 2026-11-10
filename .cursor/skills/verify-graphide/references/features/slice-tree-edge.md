# Slice tree-edge graphic

A stacked composition of this Slice’s painted hops that sit on the
Steiner tree versus the extra graph hops the slice also shows — so a
reviewer can read tree / extra hop mass, not only SHM hop-kind bars or
SWR’s start/mid/end/off node roles. Counts come from the same
`sliceCanvasProps` hops the canvas already paints. A hop is tree when
it matches a current-flow tree edge (`from`, `to`, `kind`); otherwise
it is extra. No second XYFlow, no peekSource, no showHop, no selectNode
from the strip. Not a kind-mix, not a story-scrub, not a subject-card
clone, and not a walk-role, hop-variant, module-cut, or enter distance
cut.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `sliceTreeEdgeOf` / `sliceTreeEdgeKeySet` → `sliceTreeEdgeMetrics` →
  `sliceTreeEdgeGraphicHtml` → `syncSliceTreeEdgeGraphic` /
  `bindSliceTreeEdgeGraphic` → `applySliceTreeEdgePaint`. Focus is
  `sliceTreeEdgeFocus` (`tree` | `extra`). Escape after SWR clears
  graphic focus only (stay on Slice).
- SWR and STE share `.slice-title-cuts` (`position:absolute; top:6px;
  right:12px`; pointer-events only on the strips) so the Slice
  viewport does not shrink and later `#sliceCanvas` clicks (n0) are
  not intercepted. `syncSliceWalkRoleGraphic` places SWR in the same
  cluster. Leftover cluster / strips are removed off-Slice.
- Strip `.ste-strip[data-ste="1"]` with `.ste-stat[data-ste-band]`
  counts (`[data-ste-n]`) for tree / extra and a stacked `.ste-bar` of
  `.ste-seg` segments (omit a segment when its count is 0). Band
  totals equal `#sliceCanvas .react-flow__edge[data-ste-cut]` length.
- Click a band highlights `#sliceCanvas .react-flow__edge` whose
  `data-ste-cut` matches. Second click of the same measure, or Escape
  (after SWR), clears graphic focus. Must not open Evidence /
  `peekSource` / `showHop` / the source pane, and must not
  `selectNode`. Existing `#sliceCanvas` XYFlow stays; do not add
  another canvas.
- CSS in `extension/media/main.css`: `.slice-title-cuts` / `.ste-strip`
  / `.ste-stat` / `.ste-bar` / `.ste-seg` / `#sliceCanvas
  .react-flow__edge.ste-hit`. Highlight with a stroke / box-shadow
  only (do not override `.dim` / `.grey` / `.slice-dim` / `.shm-dim` /
  `.ego-dim` / `.swr-hit` opacity).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview, then open **Slice**.
2. In the title-band next to the walk-role graphic, a tree-edge
   graphic shows how many painted hops sit on the Steiner tree versus
   how many are extra graph hops the slice also shows (the same
   numbers as the canvas edges and `data-ste-cut`).
3. Click Extra to highlight those edges; Escape clears the graphic
   focus without leaving Slice.

The explorer fixture’s boot / control-flow Steiner yields 32 painted
hops in the 29-node window: 7 tree, 25 extra. A flow whose slice is
only the tree is an honest empty extra cut (0 / N), not invented
history.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="slice"]` in the already-open
explorer document after Sequence SHV / Slice SHM / SWR (do not add a
mid-suite `page.goto`). Later CPS tests click Overview themselves.

Driver assertions (STE1–STE5):

- `.ste-strip[data-ste="1"]` present in `.slice-title-cuts` with SWR;
  tree + extra equals painted edge count; explorer is 7 / 25 of 32;
  existing `#sliceCanvas` stays; no source
- click Extra highlights `[data-ste-cut="extra"]`; Slice stays; no
  peekSource / showHop
- Escape clears graphic focus; Slice stays
- the title-band cluster does not intercept `#sliceCanvas` n0 clicks
- screenshot `verification/slice-tree-edge.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent hop membership. Use the same `sliceCanvasProps` hops
  and classify tree vs extra from the current flow’s tree edges
  (`from`, `to`, `kind`). Off-tree hops between walk members (explorer
  `n0→n3` Reads) are extra, not tree.
- Do not treat this as SHM (hop kind), SWR (node walk-role), MWC
  (lit/grey nodes), MED (enter distance), SHV, SMC, or TPC. The
  product is tree / extra hop mass as a stacked composition.
- A `0` band is honest; show zeros and omit empty bar segments.
- Do not override `.dim` / `.grey` / `.slice-dim` / `.shm-dim` /
  `.ego-dim` / `.swr-hit` opacity, and do not call `peekSource` /
  `showHop` / `selectNode` from the strip.
- Place the strip in the Slice `.slice-title-cuts` title-band with
  SWR, not as an in-flow row between the title and `#sliceCanvas` and
  not as a full-width overlay over vnodes (MWC E1j / n0-click). Prove
  n0 stays clickable (`inNode`, `hitStrip=false`).
- Rebuild `extension/media/main.js` with `npm run build:webview` using
  in-tree `node_modules` (no worktree symlink).
- Reseal the immutable lock *after* any edit to this feature map.
