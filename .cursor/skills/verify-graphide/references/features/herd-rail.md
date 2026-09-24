# Herd rail

Review cuts, open decisions, and skips share one status list on the
coverage rail. States are working, blocked, idle, and done. A blocked
row opens the pending decision. This is not a terminal pane and not a
second workspace.

## Sub-features

- `herdRows()` in `extension/media/src/graph/desk.js` derives one row
  per flow, stamp, skip, and `UnmatchedHint` / `StampBroken` flow.
- Blocked wins when the mark is broken or that flow has
  `UnmatchedHint` or `StampBroken`. While `#progress` is `.on`, a
  `review` row is working. Holds and skips are done. Everything else is idle.
- `#herd [data-herd][data-herd-state]` is painted by `renderCoverage`.
  `showProgress` / `hideProgress` call `syncHerd`.
- A blocked click calls `jumpHerd`, sets `selectedDecisionKey` to the
  pending record, and `setWorkspace("decisions")`.
- Explorer fixture rows: `overview` and `control-flow` idle, `boot`
  blocked, `legacy` done.

## How to get to it (user POV)

1. Open Review. The coverage strip lists each cut as
   `name · idle`, `name · blocked`, `name · done`, or `name · working`.
2. While a review is running, the current cut reads working. A cut
   that still needs a human stays blocked.
3. Click the blocked row. Decisions opens on the pending card
   (UnmatchedHint before a broken stamp).
4. Stamp and Skip stay human. The herd click does not stamp.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After the unmatched-hint step on the same explorer desk:

```
document.querySelectorAll("#herd [data-herd]")
// boot blocked, overview idle, control-flow idle, legacy done
window.postMessage({ type: "progress", phase: "walk", pct: 40 }, "*")
// #herd [data-herd="review"][data-herd-state="working"], boot stays blocked
window.postMessage({ type: "cancelled" }, "*")
document.querySelector('#herd [data-herd="boot"]').click()
// #workspaces decisions, .expl-card.on UnmatchedHint pending
```

Driver assertions:

- HD1 idle overview and control-flow, blocked boot, done legacy, Map `xy=0`
- HD2 progress adds `review` working and leaves boot blocked
- HD3 click opens Decisions on pending UnmatchedHint, Map `xy=0`
- screenshot `verification/herd-rail.png`
- HD4 no `{ type: "stamp" }` post
- HD5 `.graphide/stamps/` stays empty

## Gotchas

- A broken mark or an open finding stays blocked while `#progress` is on.
  The working row is `review`, not the blocked cut. The explorer
  payload stamps `boot` with `holds: false` and emits UnmatchedHint.
- Idle and done rows do not navigate. Only `data-herd-state="blocked"`
  jumps.
- Do not add a herd workspace. The list lives in `#coverage`.
- Agents never stamp. Do not click `#stampBtn` in this step.
