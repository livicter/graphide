# Timeline kind-mix

Interactive kind bars on Timeline. Parent / Uncovered / Stamp / Skip / Broken /
Hint light as an overlay filter on `.tl-item` — graphs-only walk of which review
scars matter. Scrubber `#tlScrub` stays.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `timelineKindCounts` → `timelineKindChartHtml` →
  `timelineKindStripHtml` → `toggleTimelineKindFilter` →
  `syncTimelineKindBars` → `bindTimelineKindChart` →
  `applyTimelineKindPaint`. Filter state `timelineKindFilter`. Bucket via
  `timelineKindBucket` from `timelineEvents()` only.
- Strip `.tkm-strip[data-tkm="1"]` with `.tkm-chart` / `.tkm-bar[data-tkm-kind]`
  above `#tlScrub` inside `.tl-page`. Bars ordered parent → coverage → stamp →
  skip → broken → hint; only kinds with count > 0 render.
- Click a bar: matching `.tl-item[data-tkm-kind]` take `.tkm-hit`; others
  `.tkm-dim`. Hosts toggle `.tkm-filtering`. Second click clears. Escape clears
  without leaving Timeline.
- CSS in `extension/media/main.css`: `.tkm-strip` / `.tkm-chart` / `.tkm-bar` /
  `.tkm-fill` / `.tkm-label` plus `.tkm-hit` / `.tkm-dim` under
  `.tl-page.tkm-filtering` and `.tl-rail.tkm-filtering`.
- No `peekSource` on Overview from this Feature. Stamp / skip attestation
  unchanged. Timeline never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview.
2. Open **Timeline** (`#workspaces [data-ws="timeline"]`) or press `7`.
3. Above the scrubber, click a **Kinds** bar (e.g. Broken). Matching rail
   items light; the rest dim. Scrub still walks the rail.
4. Escape clears the overlay.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0&ws=timeline
```

Driver assertions (TKM1–TKM5):

- `.tkm-strip .tkm-chart .tkm-bar[data-tkm-kind]` present with ≥1 bar; `#tlScrub` intact
- click a kind → items get `tkm-hit` / `tkm-dim`; `.tkm-filtering` on
- Escape clears filter; Timeline workspace stays open
- screenshot `verification/timeline-kind-mix.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Bars count `timelineKindBucket` values only (parent…hint).
- Do not remove the scrubber. Do not XYFlow Timeline. Do not change Registry/RAK.
- StampBroken decision scars bucket to `broken`; UnmatchedHint to `hint`.
- Rebuild `extension/media/main.js` with `npm run build:webview` — never
  hand-edit the bundle.
