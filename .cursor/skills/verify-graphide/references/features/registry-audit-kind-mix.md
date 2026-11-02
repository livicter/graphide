# Registry audit kind-mix

Interactive audit kind bars on Registry. Review / Stamp / Skip / Broken /
Finding light as an overlay filter on `table.audit` — graphs-only walk of
which snapshot rows matter. No XYFlow on this list.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `registryAuditCounts` → `registryAuditChartHtml` →
  `registryAuditStripHtml` → `toggleRegistryAuditFilter` →
  `syncRegistryAuditBars` → `bindRegistryAuditChart` →
  `applyRegistryAuditPaint`. Filter state `registryAuditFilter`. Bucket via
  `registryAuditBucket` (review / stamp / skip / broken / finding) from
  `registryEvents()` only.
- Strip `.rak-strip[data-rak="1"]` with `.rak-chart` / `.rak-bar[data-rak-kind]`
  above `table.audit` inside `.ws-list`. Bars ordered review → stamp → skip →
  broken → finding; only kinds with count > 0 render.
- Click a bar: matching `table.audit tbody tr[data-rak-kind]` take `.rak-hit`;
  others `.rak-dim`. Hosts toggle `.rak-filtering`. Second click clears.
  Escape clears without leaving Registry.
- CSS in `extension/media/main.css`: `.rak-strip` / `.rak-chart` / `.rak-bar` /
  `.rak-fill` / `.rak-label` plus `.rak-hit` / `.rak-dim` under
  `.ws-list.rak-filtering` and `table.audit.rak-filtering`.
- No `peekSource` on Overview from this Feature. Stamp / skip attestation
  unchanged. Registry never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview.
2. Open **Registry** (`#workspaces [data-ws="registry"]`) or press `5`.
3. Above the audit table, click a **Audit** kind bar (e.g. Broken). Matching
   rows light; the rest dim.
4. Escape clears the overlay. Find still filters the list.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0&ws=registry
```

Driver assertions (RAK1–RAK5):

- `.rak-strip .rak-chart .rak-bar[data-rak-kind]` present with ≥1 bar
- click a kind → rows get `rak-hit` / `rak-dim`; `.rak-filtering` on
- Escape clears filter; Registry workspace stays open
- screenshot `verification/registry-audit-kind-mix.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Bars count `registryAuditBucket` values only (review…finding).
- Do not XYFlow Registry. Do not duplicate DAM on Decisions.
- StampBroken decision rows bucket to `broken`, not `finding`.
- Rebuild `extension/media/main.js` with `npm run build:webview` — never
  hand-edit the bundle.
