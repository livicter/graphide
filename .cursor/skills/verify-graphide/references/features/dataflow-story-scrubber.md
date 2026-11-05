# Dataflow story scrubber

Interactive pipeline-prefix scrub on Data-flow. A range control bound to
`dfCursor` paints hops and RDF stages as past / now / ahead so a human can
read the value pipeline through the first N hops — graphs-only. Play, RDF
lane filter, and VTS stay.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `dfStoryScrubHtml` → `syncDfStoryScrub` → `bindDfStoryScrub` →
  `applyDfStoryScrubPaint`. Active when `dfCursor >= 0`. Escape clears to
  idle (`dfCursor = -1`) after VTS focus owner and before RDF lane filter.
- Strip `.dss-strip[data-dss="1"]` with `#dssScrub` range beside the Play row
  inside `.df-page`. Meta shows `N/M` or idle.
- Scrub / Prev / Next / Play / hop click share `dfCursor`. Hops take
  `.dss-past` / `.dss-now` / `.dss-ahead`; stage columns take
  `.dss-past-lane` / `.dss-now-lane` / `.dss-ahead-lane`. Canvas edges get
  matching `story` classes via `sequence-canvas.jsx` (`storyPrefix: "dss"`).
- CSS in `extension/media/main.css`: `.dss-strip` / `.dss-scrub` plus
  scrubbing opacity under `.df-page.dss-scrubbing`.
- No `peekSource`. Stamp / skip attestation unchanged. Data-flow never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview.
2. Open **Data-flow** (`#workspaces [data-ws="dataflow"]`).
3. Drag the **Pipeline** scrubber (or press Play / Next). Past hops stay
   readable; ahead hops fade; the current hop and its RDF stages light.
4. Escape clears the scrub to idle without leaving Data-flow (after any VTS
   focus).

## Driving it with the harness

```
extension/scripts/webview-harness.html?dataflow=1&probe=0&require=1&ws=dataflow
```

Driver assertions (DSS1–DSS5):

- `.dss-strip #dssScrub` present; `#dfPlay` intact
- scrub / Next sets `dfCursor`; hops get `dss-past` / `dss-now` / `dss-ahead`
- Escape clears scrub paint; Data-flow workspace stays open
- screenshot `verification/dataflow-story-scrubber.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Idle is `dfCursor === -1` (no past/now/ahead). Timeline always has a cursor;
  Data-flow scrub starts idle until Play / step / scrub.
- Do not remove RDF lanes, VTS strip, or Play.
- Do not XYFlow-redesign Data-flow. Rebuild `extension/media/main.js` with
  `npm run build:webview`.
