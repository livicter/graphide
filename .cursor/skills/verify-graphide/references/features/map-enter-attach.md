# Map enter-attach graphic

A stacked composition of this community’s review-relevant enter
members that participate in a painted enter hop versus members that
sit isolated — so a reviewer can read attached vs isolated mass, not
only MWC’s lit vs grey or MED’s hop-distance bands. Counts come from
the same `enterCanvasProps` / `enterEdgesAmong` hops the canvas
already paints (`data-mea-cut`). No peekSource, no enterRun, no
selectNode from the strip. Not a kind-mix, not a story-scrub, not a
walk-cut, not a distance-cut, and not a Slice halo-attach clone.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `mapEnterAttachOf` → `mapEnterAttachMetrics` →
  `mapEnterAttachGraphicHtml` → `syncMapEnterAttachGraphic` /
  `bindMapEnterAttachGraphic` → `applyMapEnterAttachPaint`.
  Focus is `mapEnterAttachFocus` (`attached` | `isolated`).
  Escape after MED clears graphic focus only (stay in the enter
  community).
- Strip `.mea-strip[data-mea="1"]` in `.enter-title-cuts` with
  MWC/MED, with `.mea-stat[data-mea-band]` counts (`[data-mea-n]`)
  for attached / isolated and a stacked `.mea-bar` of `.mea-seg`
  segments (omit a segment when its count is 0). Band totals equal
  painted enter vnode count (explorer 24). All painted enter vnodes
  stamp `data-mea-cut` (`attached` | `isolated`).
- Click a band highlights `#enterCanvas .vnode` whose `data-mea-cut`
  matches. Second click of the same measure, or Escape (after MED),
  clears graphic focus. Must not open Evidence / `peekSource` /
  `enterRun` / `selectNode` / the source pane.
- CSS in `extension/media/main.css`: `.mea-strip` / `.mea-stat` /
  `.mea-bar` / `.mea-seg` / `#enterCanvas .vnode.mea-hit`.
  Cluster stays absolute on `.stage` (column; pointer-events only
  on strips). Highlight ring only (do not override `.dim` / `.grey` /
  `.ego-dim` / `.mwc-hit` / `.med-hit`).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open **Map**, then enter the `b-render`
   community.
2. Under the walk-cut and distance-cut graphics, an enter-attach
   graphic shows how many of the painted members sit on a painted
   enter hop versus how many sit isolated (the same numbers as
   `data-mea-cut` on the vnodes).
3. Click Isolated to highlight those ten members; Escape clears the
   graphic focus without leaving the community.

The explorer fixture paints 24 b-render leaves and 10 hops: 14
attached, 10 isolated.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then stay on Map enter of `b-render` in the already-open explorer
document after MED (do not add a mid-suite `page.goto`). After MEA,
existing tests leave enter themselves.

Driver assertions (MEA1–MEA5):

- `.mea-strip[data-mea="1"]` present in `.enter-title-cuts` with
  MWC/MED; explorer is 14 attached / 10 isolated of 24, matching
  `data-mea-cut`; no source
- click Isolated highlights the 10 isolated vnodes; enter stays; no
  peekSource / enterRun
- Escape clears graphic focus; enter stays
- title-band cluster does not intercept `#enterCanvas` n0 clicks
- screenshot `verification/map-enter-attach.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent hop membership. Attached = the vnode id appears as
  `from` or `to` (or `hopFrom` / `hopTo`) of an `enterEdgesAmong`
  hop among the same 24-cap nodes the canvas paints. Isolated =
  otherwise.
- Do not treat this as MWC (lit vs grey), MED (distance bands),
  SHA (Slice halo hop attach), or a coverage / kind-mix cut.
- Title-band must stay absolute on `.stage`. Prefer a column cluster
  with MWC/MED so n0 stays clickable (MWC E1j / MCC G4b). Do not add
  in-flow Map chrome that shrinks the 720px grid.
- Do not `page.goto` mid-suite. Insert MEA tests after MED5c Escape
  and before the existing leave-enter back click.
- Do not Escape 3× to clear leftover MWC/MED — that can also clear a
  live CFT and break later FTR. Click the pressed bar, or have a
  later jump clear only this graphic.
