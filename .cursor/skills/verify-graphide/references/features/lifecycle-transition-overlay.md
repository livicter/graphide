# Lifecycle transition overlay

Interactive event bars on Lifecycle. Play / Wait / Stamp / Skip / Break /
Recover light as an overlay filter on `#lcTrans` and the review-machine graph —
graphs-only walk of which transitions matter. The `#lcReview` play strip stays.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `lifecycleTransitionCounts` → `lifecycleTransitionChartHtml` →
  `lifecycleTransitionStripHtml` → `toggleLifecycleTransitionFilter` →
  `syncLifecycleTransitionBars` → `bindLifecycleTransitionChart` →
  `applyLifecycleTransitionPaint`. Filter state `lifecycleTransitionFilter`.
- Strip `.lsc-strip[data-lsc="1"]` with `.lsc-chart` / `.lsc-bar[data-lsc-kind]`
  above `#lcReview`. Bars ordered play → wait → stamp → skip → break →
  recover; only events with count > 0 render.
- Click a bar: matching `#lcTrans .lc-trans[data-lc-event]` and related
  `#lcLanes .lc-state` / `#lcCanvas` nodes take `.lsc-hit`; others `.lsc-dim`.
  Hosts toggle `.lsc-filtering`. Second click clears. Escape clears without
  leaving Lifecycle.
- CSS in `extension/media/main.css`: `.lsc-strip` / `.lsc-chart` / `.lsc-bar` /
  `.lsc-fill` / `.lsc-label` plus `.lsc-hit` / `.lsc-dim` under
  `.lc-page.lsc-filtering` and `#lcCanvas.lsc-filtering`.
- No `peekSource` on Overview from this Feature. Stamp / skip attestation
  unchanged. Lifecycle never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder with a derived flow (`fixtures/demo`).
2. Open **Lifecycle** (`#workspaces [data-ws="lifecycle"]`).
3. Above Review, click a **Transitions** event bar (e.g. Recover). Matching
   events and graph states light; the rest dim.
4. Escape clears the overlay. Play / Prev / Next still walk the machine.

## Driving it with the harness

```
./target/debug/graphide review --root fixtures/demo --json --progress --no-parent \
  > extension/scripts/lifecycle-snap.json
```

Then:

```
extension/scripts/webview-harness.html?lifecycle=1&probe=0&require=1&ws=lifecycle
```

Driver assertions (LSC1–LSC5):

- `.lsc-strip .lsc-chart .lsc-bar[data-lsc-kind]` present with ≥1 bar
- click `recover` → transitions/states get `lsc-hit` / `lsc-dim`; `.lsc-filtering` on
- Escape clears filter; Lifecycle workspace stays open
- screenshot `verification/lifecycle-transition-overlay.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Bars count transition `label` values only (`play`…`recover`).
- Do not replace `#lcReview` or invent AST match/enum states.
- Rebuild `extension/media/main.js` with `npm run build:webview` — never
  hand-edit the bundle.
