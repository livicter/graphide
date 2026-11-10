# Map enter verb-span graphic

A stacked composition of this Map-enter’s painted leaves whose incident
graph uses more than one verb versus those that use only one — so a
reviewer can read mix vs mono mass, not only MEA’s attached vs isolated
(which is a different mass), MEP’s polarity of the attached set, MED’s
distance cut, or MWC’s lit vs grey. Counts come from the same
`enterCanvasProps` members the canvas already paints (`data-mev-cut`).
Incident verbs are taken from the full graph (`incidentEdges`), not only
`enterEdgesAmong`, which is why an isolated enter leaf can still be mix.
The graphic is a two-band verb-span, not a per-kind mix chart. No
peekSource, no showHop, no enterRun from the strip. Not a kind-mix, not
a story-scrub, and not an attach/polarity clone.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `mapEnterVerbSpanOf` → `mapEnterVerbSpanMetrics` →
  `mapEnterVerbSpanGraphicHtml` → `syncMapEnterVerbSpanGraphic` /
  `bindMapEnterVerbSpanGraphic` → `applyMapEnterVerbSpanPaint`. Focus is
  `mapEnterVerbSpanFocus` (`mix` | `mono`). Escape after MEP clears
  graphic focus only (stay on enter).
- Strip `.mev-strip[data-mev="1"]` in `.enter-title-cuts` with
  MWC/MED/MEA/MEP, with `.mev-stat[data-mev-band]` counts
  (`[data-mev-n]`) for mix / mono and a stacked `.mev-bar` of
  `.mev-seg` segments (omit a segment when its count is 0). Band
  totals equal painted enter vnode count (explorer 24). All painted
  members stamp `data-mev-cut` (`mix` | `mono`).
- Click a band highlights `#enterCanvas .vnode` whose `data-mev-cut`
  matches. Second click of the same measure, or Escape (after MEP),
  clears graphic focus. Must not open Evidence / `peekSource` /
  `showHop` / `selectNode` / `enterRun` / the source pane.
- CSS in `extension/media/main.css`: `.mev-strip` / `.mev-stat` /
  `.mev-bar` / `.mev-seg` / `#enterCanvas .vnode.mev-hit`. Cluster
  stays absolute on `.stage` (column; pointer-events only on strips).
  Highlight ring only (do not override `.dim` / `.grey` / `.ego-dim` /
  existing `*-hit`).
- First-paint enter HTML injects the strip into `.enter-title-cuts`
  and binds it after MEP (not only the recycle `sync` path).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open **Map**, then enter the `b-render` community.
2. Under the enter-polarity graphic, a verb-span graphic shows how
   many of the painted leaves speak more than one incident verb versus
   how many speak only one (the same numbers as `data-mev-cut` on the
   painted members).
3. Click Mix to highlight those fifteen members; Escape clears the
   graphic focus without leaving enter.

The explorer fixture paints 24 leaves of `b-render`. 15 are mix and 9
are mono. This disagrees with MEA’s 14 attached / 10 isolated (four
attached leaves are mono; five isolated leaves are mix).

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then stay on Map-enter of `b-render` in the already-open explorer
document after MEP (do not add a mid-suite `page.goto`). The existing
leave-enter back click stays after MEV5c.

Driver assertions (MEV1–MEV5):

- `.mev-strip[data-mev="1"]` present in `.enter-title-cuts` with
  MWC/MED/MEA/MEP; explorer is 15 mix / 9 mono of 24, matching
  `data-mev-cut`; no source
- click Mix highlights the 15 mix members; enter stays; no peekSource
- Escape clears graphic focus; enter stays
- title-band cluster does not intercept `#enterCanvas` n0 clicks
- screenshot `verification/map-enter-verb-span.png` is not a black
  frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent membership. Mix = two or more distinct incident verbs
  on the full graph; mono = exactly one. Do not count only enter hops
  (that would collapse toward MEA). Do not add per-kind filter bars.
- Do not treat this as MEA, MEP, MED, MWC, coverage / TPC, or a
  kind-mix chip chart.
- Title-band must stay absolute on `.stage`. Prefer a column cluster
  with MWC/MED/MEA/MEP so n0 stays clickable (MWC E1j / MCC G4b).
  A fifth enter strip is a layout risk; prove n0 before merge.
- First-paint must inject and bind the strip (MEP lesson).
- Do not `page.goto` mid-suite. Insert MEV tests after MEP5c Escape
  and before the leave-enter back click.
- Stamp `mevCut` in `enterCanvasProps` and pass `data-mev-cut` through
  `derived-node.jsx` / the enter path in `sequence-canvas.jsx`.
  `waitForFunction` for 24 `[data-mev-cut]` vnodes.
