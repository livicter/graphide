# Export

Canonical PNG, SVG, and one 1200×630 Share Card of the current Review
canvas. Theme (day / night) is kept. Temporary viewer state is stripped.
Not Archify's Node renderer. Stamp / skip stay human — export never writes
`.graphide/stamps/`.

## Sub-features

- Header control `#exportBtn`. Opens `#exportMenu` (same popover chrome as
  `#keysPane`). `E` stays Ego (`#egoBtn`).
- Menu: `#exportCopyPng` · `#exportPng` · `#exportSvg` ·
  `#exportCopyShare` · `#exportShare`. No WebM. No JPEG / WebP.
- Canonical clone of `#seqCanvas` / `#dfCanvas` / `#lcCanvas` /
  `#deltaCanvas` / `#canvas .stage` / `#canvas`. `stripExportViewerState`
  removes focus, play head, search dim (`.on` `.dim` `.focus` `.selected`
  `.ego-dim`). Camera transform is reset so the full diagram is contain-
  fitted, not cropped.
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
- saved `verification/export-desk.png` (or `.svg`) exists
- PNG is not a black frame
- `verification/export-share.png` is 1200×630
- filenames do not contain valid / verified / checked
- `.graphide/stamps/` is still empty

## Gotchas

- `E` is Ego. Do not steal it for Export. `#exportBtn` is the product hook.
- Route / Reach share cards wait. Sequence / Data-flow selection is not a
  second export format in this slice.
- Do not add `data-component` / `data-testid`. `#exportBtn`, `#exportMenu`,
  `#exportPng`, `#exportSvg`, `#exportShare` are the hooks.
- Do not vendor Archify's Node renderer. The clone is Graphide DOM.
- Theme stays. Play head, search query, and focus do not.
