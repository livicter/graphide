# Progress

Review derive strip. Host posts `{ type: "progress" }` while Scan →
Extract → Link → Cluster → Flows runs. `#progress` is the existing
chrome (`Progress.jsx` + `desk.js` `flushProgress` / `showProgress`).
Not a second bar, not a Map altitude, and not an agent stamp.

## Sub-features

- `#progress` gains `.on` for a live derive. `#phases li[data-phase]`
  are Scan / Extract / Link / Cluster / Flows (`walk` / `extract` /
  `link` / `cluster` / `flows`). Active phase is `.on`; earlier phases
  are `.done`.
- `#progressFill` width, `#progressPct`, `#progressLabel`,
  `#progressCounts` (`done/total` when `total` is set), `#progressTime`
  (`elapsed_ms`) follow the last flushed message.
- Source: `showProgress` / `setPhases` / `hideProgress` in
  `extension/media/src/graph/desk.js`. Host `runReview` posts the same
  schema (`phase`, `label`, `done`, `total`, `pct`, `elapsed_ms`).
- Completing the snap (`programs` / `flowchart`) or `{ type: "cancelled" }`
  calls `finishWork` and hides the strip. Header **Cancel** (`#cancelBtn`)
  is the click path — [cancel-review.md](cancel-review.md).
- Stamp / skip stay human. Progress never posts `{ type: "stamp" }` and
  never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Graphide → **Review**. Land on Overview or open Map.
2. Press **Review**. The strip opens: phases light Scan → Flows, the
   bar and percent move, the label names the current step.
3. When the snap lands, the strip hides and the desk paints.
4. Stamp and Skip are still the human attestation. Progress does not
   stamp.

The in-tree proof is the explorer desk (`?mode=explorer`). Post a
synthetic `progress` message — do not wait on a real long review.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After the desk is up (Map community cards painted):

```
window.postMessage({
  type: "progress",
  phase: "cluster",
  label: "Clustering communities…",
  done: 3,
  total: 5,
  pct: 62,
  elapsed_ms: 1840,
}, "*");
// #progress.on; cluster li.on; walk/extract/link li.done
window.postMessage({ type: "cancelled" }, "*");
```

Driver assertions:

- `#progress` has `.on`
- `#phases li[data-phase="cluster"]` is `.on`; earlier phases `.done`
- `#progressFill` width, `#progressPct`, `#progressLabel` update
- screenshot `verification/progress.png` while the strip is visible
  (not a black frame)
- `{ type: "cancelled" }` (or a programs / flowchart post) hides the
  strip and restores the desk
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- Map stays `xy=0` if the drive is on Map

## Gotchas

- Queue is `requestAnimationFrame` (`queueProgress` → `flushProgress`).
  Wait for `.on` / percent; do not assert on the same tick as the post.
- `PHASE_ALIAS` maps `start` → `walk`, `parent` → `extract`,
  `preview` → `link`, `done` → `flows`. Drive a real phase name
  (`extract` / `cluster`) so `.on` / `.done` are unambiguous.
- Do not add `data-testid`. `#progress`, `#phases`, `#progressFill`,
  `#progressPct`, `#progressLabel` are the product hooks.
- Do not invent a second progress UI. Do not raise Map into XYFlow.
- Agents never stamp. Progress is chrome, not an approval.
