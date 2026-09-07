# Zoom

Header `+` / `−` (`#zoomIn` / `#zoomOut`) scale the Map camera.
`#zoomPct` reads the percent and LOD name. Geometric zoom must not
Enter a bubble and must not raise Map into XYFlow. Fit (`#zoomFit`)
is already [fit-reorg.md](fit-reorg.md). This map is in / out only.

## Sub-features

- Header `#zoomIn` (`+`). `zoomBy(1.2)` around the stage center.
  Keyboard `+` / `=` is the same gesture (`1.18`). `#zoomPct` updates
  from `camTo.k` (`N% ·` overview / labels / hops / source).
- Header `#zoomOut` (`−`). `zoomBy(1/1.2)`. Keyboard `-` / `_` is the
  same gesture. Deep zoom-out past `k <= 0.42` pops Enter
  (`popAltitudeFromZoom`) — do not start this proof inside a bubble.
- Map stays community LOD (`xy=0`). Cards stay `.bubble-card`. Zoom
  does not click Enter and does not mount `#enterCanvas`.
- Stamp / skip stay human. Zoom never posts `{ type: "stamp" }` /
  `{ type: "skip" }` and never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open **Map**.
2. Press **+** (`#zoomIn`). The percent readout moves off the fitted
   scale. Community cards stay.
3. Press **−** (`#zoomOut`). The percent moves back down. Still cards.
4. Stamp and Skip are still the human attestation. Zoom does not stamp.

The in-tree proof is the explorer desk (`?mode=explorer`). The fixture
already paints twelve community cards. Keys sheet lists `+` `−` zoom;
this proof clicks the header buttons.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map paints community cards (Evidence closed):

```
const before = document.getElementById("zoomPct").textContent;
document.getElementById("zoomIn").click();
// #zoomPct / --cam-k moved up; xy still 0
document.getElementById("zoomOut").click();
// percent / scale moved down vs the zoomed-in camera
```

Driver assertions:

- `#zoomIn` raises `#zoomPct` (parsed `N%`) and viewport `--cam-k`
- `#zoomOut` lowers percent / scale vs the zoomed-in camera
- Map stays `xy=0` with more than one `.bubble-card` visible
- screenshot `verification/zoom.png` after zoom-in is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty

## Gotchas

- Do not treat this as Fit. `#zoomFit` / `0` stay in
  [fit-reorg.md](fit-reorg.md).
- Geometric zoom must not Enter. Click a card is a different gesture
  (`J1` in the in-page suite).
- Do not add `data-testid`. `#zoomIn`, `#zoomOut`, `#zoomPct`,
  `.bubble-card` are the hooks.
- Do not React-mount Map community LOD. Cards stay vanilla. `xy=0`.
- Agents never stamp. Zoom is camera, not an approval.
  Do not flip verify `runs-on` off `ubuntu-latest`.
