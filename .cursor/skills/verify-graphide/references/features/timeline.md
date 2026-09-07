# Timeline

Parent cut, coverage, and stamp scars for this snapshot as a scrubbed
rail. Not a graph canvas and not Architecture Delta.

## Sub-features

- Workspace tab `#workspaces [data-ws="timeline"]` (key `7`). Same explorer
  nav row — not a second chrome row. Delta (`data-ws="delta"`) is a
  different workspace.
- `timelineEvents()` always emits **Parent cut** (`coverage.changed`) and
  **Uncovered** (`coverage.uncovered`), then `decisionRecords()` as stamp
  scars (holds / broken / skipped / hints).
- Rail `.tl-page` / `.tl-rail` / `.tl-item[data-t]` with `.now` / `.past` /
  `.ahead`. Scrubber `#tlScrub` and `#tlScrubMeta` (`tN · title`).
- Items may carry `data-flow` to open Slice.
- Honest empty (only if find hides every row): “No timeline events match
  …”. No-event copy: “No parent cut or stamp events yet.” (unreachable
  while Parent cut + Uncovered are always pushed).
- `LIST_WORKSPACES` hides `#ledgerPane`. No XYFlow on this list.

## How to get to it (user POV)

1. Review a folder. Land on Overview.
2. Click **Timeline** (`#workspaces [data-ws="timeline"]`) or press `7`.
3. You should see the parent cut, uncovered count, and any stamp / skip
   scars from this snap. Scrub to watch the rail. Stamp and Skip stay
   human.

The explorer fixture seeds `coverage.changed` / `uncovered` plus a broken
`boot` stamp and `legacy` skip. Self-review `--no-parent` may show `0`
changed — that is still a parent-cut row, not an invented history.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="timeline"]` (or pin `?ws=timeline`).

Driver assertions:

- `#workspaces [data-ws="timeline"]` is on
- `.tl-item` includes Parent cut and Uncovered from `snapshot.coverage`
- Stamp scars from the snap are on the rail when present (boot broken,
  legacy skipped) — or the rail is only the two coverage rows
- `#tlScrub` exists; one `.tl-item.now`
- `#canvas .react-flow__node` length is `0`
- screenshot `verification/timeline.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- Timeline is the scar list. Architecture Delta is the derived parent vs
  head fact walk (`?delta=1`). Do not merge them.
- Self-review CI uses `--no-parent`. A `0` changed parent cut is honest.
- Do not add `data-testid`. `[data-ws="timeline"]`, `#tlScrub`,
  `.tl-item[data-t]` are the product hooks.
- Do not XYFlow this list. `P` on Timeline is not a Delta Review walk.
- Do not stamp.
