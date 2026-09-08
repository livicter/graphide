# Panel timeout

BEST_EFFORT coverage / findings flush is time-boxed. A fat
panel `patch` must not starve CRITICAL canvas work (pan / zoom
/ stamp / click). Counts still update. Findings list expansion
may be shed. Not a second Map altitude and not new desk chrome.

## Sub-features

- `flushPanelRefresh` passes a time budget (`PANEL_BUDGET_MS`)
  into `renderCoverage`. Coverage chip counts (changed /
  uncovered) paint first. Stamp / click / pan / zoom stay
  CRITICAL and are not gated on the rest of the panel.
- Fat findings (`PANEL_FAT_FINDINGS`) or elapsed budget skip
  non-critical findings list expansion. `#coverage` gets
  `data-panel="shed"`. A small findings list still paints in
  full when it fits the budget.
- Map stays community LOD (`xy=0`, `.viewport` `data-lod="0"`).
  A coverage-only `patch` still skips `paint()` when Map is
  mounted. Same `.stage` / `.viewport` nodes.
- Stamp / skip stay human. A coverage patch never posts
  `{ type: "stamp" }` / `{ type: "skip" }` and never writes
  `.graphide/stamps/`. Map stamp stays disabled without a
  current flow — the harness proves CRITICAL work via
  `#zoomIn` while shed is active.

## How to get to it (user POV)

1. Review a folder. Open **Map**. Community cards paint.
2. A later coverage / findings refresh with a large findings
   list must not freeze pan, zoom, stamp, or click.
3. The coverage line still shows changed / uncovered counts.
   Extra findings may wait.
4. Stamp and Skip are still the human attestation. The patch
   does not stamp.

The in-tree proof is the explorer desk (`?mode=explorer`). The
fixture already paints twelve community cards.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map paints community cards:

```
stage.dataset.panelMark = "1"
viewport.dataset.panelMark = "1"
window.postMessage({
  type: "patch",
  coverage: { changed: ["pt0", …], uncovered: ["pt0", …] },
  findings: [{ kind: "UnmatchedHint", flow: "boot", fqn: "graphide::PanelTimeout0" }, …],
  stats: { elapsed_ms: 9 },
}, "*")
// #coverage[data-panel="shed"]; chip has the new counts; findings list not expanded
document.getElementById("zoomIn").click()
```

Driver assertions:

- Map has more than one `.bubble-card` and `xy=0` before the patch
- Fat coverage/findings-only `patch` keeps the same `.stage` and
  `.viewport` nodes; `data-lod="0"`
- `#coverage` reads the new changed / uncovered counts and
  `data-panel="shed"`; `#coverage li.finding` is not the full
  posted list; `PanelTimeout` is not expanded
- `#zoomIn` is enabled while shed is active and a click moves
  `--cam-k` / `#zoomPct` without waiting on the full findings
  list; Map stays `xy=0` / `data-lod="0"`
- screenshot `verification/panel-timeout.png` is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post from the patch
  itself
- `.graphide/stamps/` is still empty

## Gotchas

- Do not call `paint()` for a panel-only patch when Map is
  mounted. Structural `graph` / `bubbles` / `flows` still paint
  (recycle + keepCam).
- Restore the explorer coverage counts after the prove so later
  Evidence / Timeline gates still see 1123 changed · uncovered.
- Do not add `data-testid`. `#coverage[data-panel="shed"]`,
  `.stage`, `.viewport`, `#zoomIn` are the hooks. Map
  `#stampBtn` is disabled here (`!currentFlow()`).
- Do not React-mount Map community LOD. Cards stay vanilla. `xy=0`.
  Do not collide OV* / DA* / RC* harness ids — this slice is PT*.
- Agents never stamp. A coverage delta is paint, not an approval.
  Do not flip verify `runs-on` off `ubuntu-latest`.
