# Slice walk-role graphic

A stacked composition of this flow’s Slice members that start the
Steiner walk, sit mid-walk, end it, or sit off the walk — so a reviewer
can read walk-role mass, not only SHM hop-kind bars, MWC’s binary
lit/grey cut, or MED’s hop-distance bands. Counts come from the same
`sliceCanvasProps` nodes the canvas already paints (on-tree walk plus
1-hop neighbors, 48-cap). No second XYFlow, no peekSource, no
selectNode / showHop from the strip (Slice node clicks otherwise open
Evidence). Not a kind-mix, not a scrub, not a subject-card clone, and
not a Sequence module-cut.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `sliceWalkRoleMetrics` → `sliceWalkRoleGraphicHtml` →
  `syncSliceWalkRoleGraphic` / `bindSliceWalkRoleGraphic` →
  `applySliceWalkRolePaint`. Focus is `sliceWalkRoleFocus`
  (`start` | `mid` | `end` | `off`). Escape after SHM clears graphic
  focus only (the Slice stay is unchanged; hop-kind and call-path
  owners stay in their order).
- Strip `.swr-strip[data-swr="1"]` in the Slice title band (absolute
  `top:6px; right:12px` on `.stage`), with `.swr-stat[data-swr-band]`
  counts (`[data-swr-n]`) for start / mid / end / off and a stacked
  `.swr-bar` of `.swr-seg` segments (omit a segment when its count is
  0). Band totals equal `#sliceCanvas .vnode[data-swr-role]` length.
- Click a band highlights `#sliceCanvas .vnode[data-swr-role]` of that
  role. Second click of the same measure, or Escape (after SHM),
  clears graphic focus. Must not open Evidence / `peekSource` /
  `showHop` / the source pane, and must not call `selectNode`. Existing
  Slice XYFlow stays; do not add another canvas.
- `sliceCanvasProps` stamps `walkRole` on each item; `derived-node.jsx`
  paints `data-swr-role`. CSS in `extension/media/main.css`:
  `.swr-strip` / `.swr-stat` / `.swr-bar` / `.swr-seg` /
  `#sliceCanvas .vnode.swr-hit`. Highlight with a box-shadow only (do
  not override `.vnode.grey` / `.slice-dim` / `.dim` / `.shm-dim` /
  `.ego-dim` opacity). The strip must not shrink `.viewport` or sit as
  a full-width overlay over vnodes (MWC E1j / n0-click).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview, then open **Slice**.
2. In the title band, a walk-role graphic shows how many of the painted
   Steiner members start the walk, sit mid-walk, end it, or sit off the
   walk (the same members as the canvas).
3. Click Off to highlight off-walk neighbors; Escape clears the graphic
   focus without leaving Slice or opening Evidence.

The explorer fixture’s control-flow Steiner paints 29 members: 1 start
(`n0`), 6 mid, 1 end (`n7`), and 21 off-walk 1-hop neighbors. A flow
with no off-walk neighbors is an honest empty off cut (0 / N), not
invented history.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="slice"]` in the already-open explorer
document after Map hop-size (SHM already does this; do not add a
mid-suite `page.goto`). Insert proof after SHM5 and before CPS (CPS
clicks Overview itself).

Driver assertions (SWR1–SWR5):

- `.swr-strip[data-swr="1"]` present; band totals equal vnode count;
  explorer is 1 / 6 / 1 / 21 of 29; `n0` is start, `n7` is end;
  existing `#sliceCanvas` XYFlow stays; no source
- click Off highlights `[data-swr-role="off"]`; Slice stays; no peekSource
- Escape clears graphic focus; Slice stays
- a `#sliceCanvas` vnode remains clickable under the title-band strip
- screenshot `verification/slice-walk-role.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent membership. Use the same `sliceCanvasProps` nodes the
  canvas already paints (tree walk + 1-hop neighbors, 48-cap).
- Do not treat this as SHM (hop kind), MWC (lit vs grey), MED (hop
  distance), TPC (snap-wide changed / uncovered), or SMC (sequence
  same vs cross module). The product is walk-role mass of the shown
  Slice members as a stacked composition.
- A `0` band is honest; show zeros and omit empty bar segments.
- Do not override `.vnode.grey` / `.slice-dim` / `.dim` / `.shm-dim` /
  `.ego-dim` opacity, and do not call `selectNode` / `peekSource` /
  `showHop` from the strip (Slice node clicks otherwise open Evidence).
- Place the strip in the Slice title band (absolute on `.stage`,
  pointer events only on controls). Do not put it in document flow
  between the title and `#sliceCanvas` (shrinks the fit box) or as a
  full-width overlay over vnodes (intercepts later clicks).
- Rebuild `extension/media/main.js` with `npm run build:webview` using
  in-tree `node_modules` (no worktree symlink).
- Reseal the immutable lock *after* any edit to this feature map.
