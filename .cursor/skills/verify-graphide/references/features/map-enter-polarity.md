# Map enter-polarity graphic

A stacked composition of this enter’s attached leaves that only
leave a painted hop, only arrive at one, or do both — so a reviewer
can read out vs in vs both mass, not only MEA’s attached vs isolated
(which lumps those 14), MWC’s lit vs grey, or MED’s distance bands.
Counts come from the same `enterCanvasProps` members the canvas
already paints (`data-mep-cut`). The 10 isolated leaves are not a
band (that cut is MEA). No peekSource, no enterRun from the strip.
Not a kind-mix, not a story-scrub, not a coverage cut, and not a
Slice bridge-polarity clone (this is enter vnodes, with a both band
a hop cannot have).

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `mapEnterPolarityOf` → `mapEnterPolarityMetrics` →
  `mapEnterPolarityGraphicHtml` → `syncMapEnterPolarityGraphic` /
  `bindMapEnterPolarityGraphic` → `applyMapEnterPolarityPaint`.
  Focus is `mapEnterPolarityFocus` (`out` | `in` | `both`).
  Escape after MEA clears graphic focus only (stay in the community).
- Strip `.mep-strip[data-mep="1"]` in `.enter-title-cuts` with
  MWC/MED/MEA, with `.mep-stat[data-mep-band]` counts
  (`[data-mep-n]`) for out / in / both and a stacked `.mep-bar` of
  `.mep-seg` segments (omit a segment when its count is 0). Band
  totals equal attached leaf count (explorer 14 of 24). All
  painted members stamp `data-mep-cut` (`out` | `in` | `both` |
  `isolated`).
- Click a band highlights `#enterCanvas .vnode` whose
  `data-mep-cut` matches. Second click of the same measure, or Escape
  (after MEA), clears graphic focus. Must not open Evidence /
  `peekSource` / `enterRun` / `selectNode` / the source pane.
- CSS in `extension/media/main.css`: `.mep-strip` / `.mep-stat` /
  `.mep-bar` / `.mep-seg` / `#enterCanvas .vnode.mep-hit`.
  Cluster stays absolute on `.stage` (column; pointer-events only on
  strips). Highlight ring only (do not override `.dim` / `.grey` /
  `.ego-dim` / `.mwc-hit` / `.med-hit` / `.mea-hit`).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open **Map**, then enter a community (explorer:
   `b-render`).
2. Under the enter-attach graphic, an enter-polarity graphic shows
   how many of the attached leaves only leave a painted hop, only
   arrive at one, or do both (the same numbers as `data-mep-cut` on
   the painted members).
3. Click In to highlight those four members; Escape clears the
   graphic focus without leaving the community.

The explorer fixture paints 24 leaves: 14 attached (MEA), 10
isolated (MEA). Of the 14 attached, 4 are out, 4 are in, and 6 are
both.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then stay on Map enter of `b-render` in the already-open explorer
document after MEA (do not add a mid-suite `page.goto`). Later tests
leave enter themselves.

Driver assertions (MEP1–MEP5):

- `.mep-strip[data-mep="1"]` present in `.enter-title-cuts` with
  MWC/MED/MEA; explorer is 4 out / 4 in / 6 both of 14 attached
  leaves, matching `data-mep-cut`; no isolated band; no source
- click In highlights the 4 inbound-only members; enter stays; no
  peekSource
- Escape clears graphic focus; enter stays
- title-band cluster does not intercept `#enterCanvas` n0 clicks
- screenshot `verification/map-enter-polarity.png` is not a black
  frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent hop membership. Out = at least one painted enter
  hop with this id as `from` and none as `to`; in = the reverse;
  both = at least one of each. Do not put an isolated band on this
  strip (that mass is MEA).
- Do not treat this as MEA (attached vs isolated), MWC (lit vs
  grey), MED (distance), SBP (Slice hop polarity, no both band),
  or a coverage / kind-mix cut.
- Title-band must stay absolute on `.stage`. Prefer a column cluster
  with MWC/MED/MEA so n0 stays clickable (MWC E1j / MCC G4b).
- Do not `page.goto` mid-suite. Insert MEP tests after MEA5c Escape
  and before the existing leave-enter back click.
- Stamp `mepCut` in `enterCanvasProps` and pass `data-mep-cut`
  through `derived-node.jsx` / the enter path in `sequence-canvas.jsx`.
