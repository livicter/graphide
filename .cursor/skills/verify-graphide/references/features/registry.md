# Registry

Audit table of this review snapshot. Rows are derived from the snap — not
invented chrome and not a graph canvas.

## Sub-features

- Workspace tab `#workspaces [data-ws="registry"]` (key `5`). Same explorer
  nav row — not a second chrome row.
- `registryEvents()` always starts with one **Review snapshot** row:
  `graph.nodes` · `graph.edges` · `stats.files` · `snapshot.plugin` ·
  optional `stats.elapsed_ms`. Those numbers come from the snap.
- Then `decisionRecords()` (stamps / skips / StampBroken / UnmatchedHint).
- Then other `snapshot.findings` except `UncoveredNode`, `StampBroken`, and
  `UnmatchedHint` (those last two already sit on Decisions). Hop findings
  name `from → to`.
- Table `table.audit` (`Kind` / `Subject` / `Detail`). Rows may carry
  `data-flow` to open Slice.
- Honest empty (only if find hides every row): “No registry rows match …”.
  No-snap copy: “Review first — the registry is this snapshot’s audit log.”
- `LIST_WORKSPACES` hides `#ledgerPane`. No XYFlow on this list.

## How to get to it (user POV)

1. Review a folder. Land on Overview.
2. Click **Registry** (`#workspaces [data-ws="registry"]`) or press `5`.
3. The first row is this snapshot’s node / edge / file / plugin counts.
   Later rows are stamps, skips, and non-decision findings. Stamp and Skip
   stay human.

The explorer fixture uses `plugin: rust@0.1.0` and `stats.files: 136` on
the synthetic graph (2050 nodes). Self-review shows this checkout’s
derived counts.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="registry"]` (or pin `?ws=registry`).

Driver assertions:

- `#workspaces [data-ws="registry"]` is on
- `table.audit tbody tr` length `>= 1`
- The Review snapshot row text matches the snap’s nodes / edges / files
  (and plugin when the product shows it) — not invented numbers
- `#canvas .react-flow__node` length is `0`
- screenshot `verification/registry.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- Do not duplicate StampBroken / UnmatchedHint as a second findings pass.
  They already ride in via `decisionRecords()`.
- Coverage `UncoveredNode` stays off this table. Timeline owns the parent
  cut / uncovered scars.
- Do not add `data-testid`. `[data-ws="registry"]`, `table.audit` are the
  product hooks.
- Do not XYFlow this list. Do not invent extra audit columns. Do not
  stamp.
