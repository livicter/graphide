# Structural diff overlay

Interactive status bars on Architecture Delta. Added / Removed / Changed /
Moved / Rerouted light as an overlay filter on the fact list and `#deltaCanvas`
graph — graphs-only walk of what changed. Community cluster rows stay listed
but are excluded from bar counts.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`: `structuralDiffCounts` →
  `structuralDiffChartHtml` → `structuralDiffStripHtml` →
  `toggleStructuralDiffFilter` → `syncStructuralDiffBars` →
  `bindStructuralDiffChart` → `applyStructuralDiffPaint`. Filter state
  `structuralDiffFilter`.
- Strip `.sdo-strip[data-sdo="1"]` with `.sdo-chart` / `.sdo-bar[data-sdo-kind]`
  above the Delta Review strip. Bars ordered added → removed → changed →
  moved → rerouted; only statuses with count > 0 render.
- Click a bar: matching `#deltaFacts .delta-fact[data-delta-kind]` and
  `#deltaCanvas .vnode[data-delta-state]` take `.sdo-hit`; others `.sdo-dim`.
  Hosts toggle `.sdo-filtering`. Second click clears. Escape clears without
  closing Delta.
- CSS in `extension/media/main.css`: `.sdo-strip` / `.sdo-chart` / `.sdo-bar` /
  `.sdo-fill` / `.sdo-label` plus `.sdo-hit` / `.sdo-dim` under
  `.delta-page.sdo-filtering` and `#deltaCanvas.sdo-filtering`.
- No `peekSource` on Overview from this Feature. Stamp / skip unchanged.
  Delta never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder with a parent (`graphide review --parent …`).
2. Open **Delta** (`#workspaces [data-ws="delta"]`) or press `8`.
3. Above Review, click a **Structural** status bar (e.g. Added). Matching
   facts and graph nodes light; the rest dim.
4. Escape clears the overlay. Stamp and Skip stay the human attestation.

## Driving it with the harness

```
./target/debug/graphide review --root fixtures/demo --parent fixtures/demo-parent \
  --json --progress > extension/scripts/delta-snap.json
```

Then:

```
extension/scripts/webview-harness.html?delta=1&probe=0&require=1&ws=delta
```

Driver assertions (SDO1–SDO5):

- `.sdo-strip .sdo-chart .sdo-bar[data-sdo-kind]` present with ≥1 bar
- click `added` → facts/nodes get `sdo-hit` / `sdo-dim`; `.sdo-filtering` on
- Escape clears filter; Delta workspace stays open
- screenshot `verification/structural-diff-overlay.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Bars count non-community facts only (`f.class !== "community"`).
- Do not make the outcome-strip `+ − ~ ↔ ↝` counters interactive.
- Rebuild `extension/media/main.js` with `npm run build:webview` — never
  hand-edit the bundle.
