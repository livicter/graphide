# Fit / Reorganize

Camera Fit and auto-layout Reorganize on Map community LOD. Header
`#zoomFit` (Fit / `0`) frames the current chart. `#reorgBtn` clears
layout pins and paints again. GraphBar also has `.reorg-btn`; desk.js
binds every `.reorg-btn` to `autoReorganize`. Not a Map XYFlow rewrite,
not invented nodes, and not an agent stamp.

## Sub-features

- Header `#zoomFit` (Fit). `0` calls `fitChart`. Frames `.comm-wrap`
  (or the current stage wrap) in the stage. Does not Enter a bubble.
  Map stays community cards (`.bubble-card`, `xy=0`).
- Header `#reorgBtn` (Reorganize). GraphBar `.reorg-btn` is the same
  handler. `autoReorganize` clears pins for this view and `paint`s
  without keeping a dragged layout. `R` is PATH. Do not steal it.
- Existing G* layout: more than one card visible, no card overlap,
  caption off the cards. Fit / Reorganize must not regress those.
- Stamp / skip stay human. Fit / Reorganize never post
  `{ type: "stamp" }` / `{ type: "skip" }` and never write
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open **Map**.
2. Wheel or +/− to zoom. Press **Fit** (`#zoomFit` or `0`). Several
   community cards stay in the stage.
3. Drag a card if you want a pin. Press **Reorganize**. Auto-layout
   returns. Cards stay communities — no new nodes.
4. Stamp and Skip are still the human attestation. Fit / Reorganize
   do not stamp.

The in-tree proof is the explorer desk (`?mode=explorer`). The fixture
already paints twelve community cards.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map paints community cards (Evidence closed):

```
document.getElementById("zoomFit").click();   // or key 0
document.getElementById("reorgBtn").click();  // GraphBar .reorg-btn is the same fn
```

Driver assertions:

- `#zoomFit` or `0` leaves Map `xy=0` with more than one `.bubble-card`
  visible (cards ≥ 8, visible ≥ 3)
- After Fit, visible cards do not overlap (same G5 slack)
- `#reorgBtn` runs without a stamp / skip post
- After Reorganize, `xy=0` and card count is stable (or at least > 1)
- screenshot `verification/fit-reorg.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- `R` is PATH. Reorganize is `#reorgBtn` / `.reorg-btn`. Do not steal `R`.
- `0` is Fit. Do not treat Fit as Enter or as a 100%-only camera reset
  (`fitChart` frames the wrap).
- Do not add `data-testid`. `#zoomFit`, `#reorgBtn`, `.reorg-btn`,
  `.bubble-card` are the hooks.
- Do not React-mount Map community LOD. Cards stay vanilla. `xy=0`.
- Agents never stamp. Fit / Reorganize must not invent nodes or write
  `.graphide/stamps/`.
