# Delta onAnalysis

Analysis updates that only change coverage / findings / stats
send and apply a `patch` delta. The mounted Map stage stays.
Camera stays put. Coverage panel is BEST_EFFORT. Not a second
Map altitude and not an XYFlow Map rewrite.

## Sub-features

- Host `pushState` posts `{ type: "patch", coverage, findings,
  stats, … }` when graph / bubbles / flows are the same object
  as the last full `programs` / `flowchart` (stamp, skip, and
  later analysis of the same IR). First snap after Review is
  still the full post.
- Desk `applyPatch` + `panelOnlyPatch`: no graph / bubbles /
  flows in the message → skip `paint()`. Same `.stage` /
  `.viewport` nodes. `--cam-k` / pan survive. `keepCam` is
  unused because the canvas is not rebuilt.
- `#coverage` / `#status` refresh on rAF (`queuePanelRefresh`).
  Panel work must not gate stamp / skip / click on the canvas.
- Map stays community LOD (`xy=0`, `.viewport` `data-lod="0"`).
  A zoomed `--cam-k` does not raise Map into geometric lod 1.
- Stamp / skip stay human. A coverage patch never posts
  `{ type: "stamp" }` / `{ type: "skip" }` and never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open **Map**. Community cards paint.
2. Zoom or pan. A later coverage / findings refresh must not
   rebuild the graph or jump the camera.
3. The coverage line updates. Cards that are still in the cut
   stay the same buttons.
4. Stamp and Skip are still the human attestation. The patch
   does not stamp.

The in-tree proof is the explorer desk (`?mode=explorer`). The
fixture already paints twelve community cards.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map paints community cards and zoom has moved the camera:

```
stage.dataset.deltaMark = "1"
viewport.dataset.deltaMark = "1"
window.postMessage({
  type: "patch",
  coverage: { changed: ["n0"], uncovered: ["n7", "n11", "n13"] },
  findings: [{ kind: "UnmatchedHint", flow: "boot", fqn: "graphide::OnAnalysisDelta" }],
  stats: { elapsed_ms: 77 },
}, "*")
```

Driver assertions:

- Map has more than one `.bubble-card` and `xy=0` before the patch
- Coverage-only `patch` keeps the same `.stage` and `.viewport` nodes
- Zoomed `--cam-k` survives; cards stay at `xy=0` / `data-lod="0"`
- `#coverage` reads `Coverage 1 changed · 3 uncovered` and
  `OnAnalysisDelta`
- screenshot `verification/delta-onanalysis.png` is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty

## Gotchas

- Do not call `paint()` for a panel-only patch when Map is
  mounted. Structural `graph` / `bubbles` / `flows` still paint
  (recycle + keepCam).
- Restore the explorer coverage counts after the prove so later
  Evidence / Timeline gates still see 1123 changed · uncovered.
- Do not add `data-testid`. `.stage`, `.viewport`, `.bubble-card`,
  `#coverage` are the hooks.
- Do not React-mount Map community LOD. Cards stay vanilla. `xy=0`.
- Agents never stamp. A coverage delta is paint, not an approval.
  Do not flip verify `runs-on` off `ubuntu-latest`.
