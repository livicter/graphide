# Export

Canonical PNG, SVG, and one 1200×630 Share Card of the current Review
canvas. Theme (day / night) and the current visual preset are kept.
Temporary viewer state is stripped.
Not Archify's Node renderer. Stamp / skip stay human — export never writes
`.graphide/stamps/`.

## Sub-features

- Header control `#exportBtn`. Opens `#exportMenu` (same popover chrome as
  `#keysPane`). `E` stays Ego (`#egoBtn`).
- Opening Export hides the hover tip (`K19b`).
- Opening Export closes Ask (`K18b`), same exclusive chrome as Keys (`K18`).
- Opening Ask closes Export (`K18d`), same exclusive chrome as Export closing Ask (`K18b`).
- Opening Export closes Keys (`K18e`), same exclusive chrome as Keys closing Export.
- Opening Keys closes Export (`K18f`), same exclusive chrome as Export closing Keys (`K18e`).
- Opening Present closes Export (`K18i`), same exclusive chrome as Present closing Ask / Keys.
- Opening Export closes Evidence (`K18s`), same exclusive chrome as Keys closing Evidence (`K18p`).
- Opening Export closes Lens (`K18t`), same exclusive chrome as Keys closing Lens (`K18q`).
- Opening Export closes Route (`K18u`), same exclusive chrome as Keys closing Route (`K18r`).
- Open Export blocks desk L so LENS stays closed (`K15h`), same as Keys (`K15f`) / Ask (`K15g`).
- Open Export blocks desk F so Present stays off (`K15i`), same chrome key lock as S / X / R / L under Export.
- Open Export blocks desk E so Ego stays off (`K15l`), residual chrome key lock after S / X / R / L / F.
- Menu: `#exportCopyPng` · `#exportPng` · `#exportSvg` ·
  `#exportCopyShare` · `#exportShare` · `#exportRouteShare`. No WebM. No
  JPEG / WebP. Route Share Card fails closed when no directed route is
  resolved.
- Canonical clone of `#seqCanvas` / `#dfCanvas` / `#lcCanvas` /
  `#deltaCanvas` / `#canvas .stage` / `#canvas`. `stripExportViewerState`
  removes focus, play head, search dim / hit, Ego, Route, Lens, and away
  (`.on` `.dim` `.hit` `.focus` `.selected` `.ego` `.ego-dim` `.route-dim`
  `.on-route` `.on-route-hot` `.lens-dim` `.lens-on` `.away` `.hot`
  `.flowing` `.on-path` `.now` `.past` `.ahead` `.here` `.walk` `.dragging` `.panning`, and `data-offview`). Camera
  transform is reset so the full diagram is contain-fitted, not cropped.
- Filenames `graphide-<flow>.png` / `.svg` / `-share.png`. No
  valid / verified / checked claim.
- Share Card is 1200×630, title `Graphide · <flow>`, diagram contain-fitted.
- Host `exportFile` may offer a save dialog. It refuses
  `packageRoot()/.graphide/stamps/`. The harness stub only records
  `window.__vscodePosts`. Last bytes land on `window.__graphideLastExport`.

## How to get to it (user POV)

1. Review a folder. Land on Overview or open Map / Sequence / Data-flow /
   Lifecycle / Delta.
2. Click **Export** (`#exportBtn`).
3. PNG or SVG downloads the full current-theme diagram. **Share Card** is
   the 1200×630 README image. Copy writes PNG to the clipboard when the
   host allows it.
4. Stamp and Skip are still the human attestation. Export does not stamp.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map paints community cards:

```
await page.click("#exportBtn");
await page.click("#exportPng");   // window.__graphideLastExport.png
await page.click("#exportBtn");
await page.click("#exportSvg");   // window.__graphideLastExport.svg
await page.click("#exportBtn");
await page.click("#exportShare"); // window.__graphideLastExport.share 1200×630
```

Driver assertions:

- `#exportBtn` opens `#exportMenu`
- opening Export closes Ask (`K18b`)
- opening Ask closes Export (`K18d`)
- opening Export closes Keys (`K18e`)
- opening Keys closes Export (`K18f`)
- opening Present closes Export (`K18i`)
- opening Export closes Evidence (`K18s`)
- opening Export closes Lens (`K18t`)
- opening Export closes Route (`K18u`)
- open Export: L does not open LENS (`K15h`)
- open Export: F does not enter Present (`K15i`)
- open Export: E does not turn Ego on (`K15l`)
- saved `verification/export-desk.png` (or `.svg`) exists
- PNG is not a black frame
- `verification/export-share.png` is 1200×630
- filenames do not contain valid / verified / checked
- `.graphide/stamps/` is still empty
- Find `physics` on Map, then Export SVG: no Map card in the SVG keeps
  `.hit` or `.dim` (`X6b`); after Route / Lens, no `.route-dim` /
  `.on-route` / `.lens-dim` / `.lens-on` (`X6c`, `X6d`); after Play, no
  `.hot` / `.flowing` / `.on-path` (`X6e`); after zoom/pan parks, no `data-offview` and parked cards remain (`X6f`)

## Gotchas

- `E` is Ego. Do not steal it for Export. `#exportBtn` is the product hook.
- Route Share Card (`#exportRouteShare`) reuses the Share Card seam after
  a real PATH. Reach share cards wait. Sequence / Data-flow selection is
  not a second export format.
- Do not add `data-component` / `data-testid`. `#exportBtn`, `#exportMenu`,
  `#exportPng`, `#exportSvg`, `#exportShare` are the hooks.
- Do not vendor Archify's Node renderer. The clone is Graphide DOM.
- Theme stays. The current visual preset (`data-preset`) stays. Play head,
  search query, focus, and Presentation Stage do not.
- `data-offview` is viewer pan state too. Parked Map cards are `visibility: hidden`; leaving the attribute on the clone would drop them after camera reset (`X6f`).
- `.hit` is viewer state too. Since a hit paints at opacity 1 over path /
  distance grey, a leftover `.hit` lifts that card or node in the export.
