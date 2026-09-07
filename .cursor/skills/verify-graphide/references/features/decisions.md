# Decisions

List of human stamps, skips, and broken attestations for this snapshot.
Not a graph canvas. Stamp / skip stay host-only.

## Sub-features

- Workspace tab `#workspaces [data-ws="decisions"]` (key `4`). Same explorer
  nav row — not a second chrome row.
- `decisionRecords()` reads in-memory `stampRows` plus `snapshot.stamps`,
  `skippedFlows` plus `snapshot.skipped`, and findings whose kind is
  `StampBroken` or `UnmatchedHint` only.
- Cards `.expl-card[data-decision][data-outcome]` (`approved` / `rejected` /
  `deferred` / `pending`). Outcome strip `.outcome-strip
  [data-outcome-filter]`.
- Detail pane `.ws-detail` plus causal chain `.chain .chain-step` from the
  derived Steiner hops (`causalChainFor`). **Open slice** is
  `[data-open-slice]` — proof lives in [open-slice.md](open-slice.md).
- Honest empty: “No stamps, skips, or stamp scars yet. Stamp (S) or Skip
  (X) a flow.” Find-miss: “No decisions match …”.
- Header `#stampBtn` / `#skipBtn` still post `{ type: "stamp"|"skip", flow }`
  to the host. Real host `writeStamp` / `skipFlow` lives in
  `extension.ts`. The harness stub only records `window.__vscodePosts`.
- `LIST_WORKSPACES` hides `#ledgerPane`. No XYFlow on this list.

## How to get to it (user POV)

1. Review a folder. Land on Overview.
2. Click **Decisions** (`#workspaces [data-ws="decisions"]`) or press `4`.
3. You should see holds / broken / skipped (or the honest empty). A
   **human** presses Stamp or Skip on a flow — the webview paints locally,
   then the host writes `.graphide/stamps/` or records the skip.
4. Agents never stamp. Coverage is a human rule.

The explorer fixture seeds `stamps: [{ name: "boot", holds: false }]`,
`skipped: ["legacy"]`, and a `StampBroken` finding on `boot`.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="decisions"]` (or pin `?ws=decisions`).

Driver assertions:

- `#workspaces [data-ws="decisions"]` is on
- Cards show stamps / skips / broken attestations from the snap (boot
  broken, legacy skipped, StampBroken) — or the honest empty copy
- `#stampBtn` / `#skipBtn` stay enabled on a current flow; clicks only
  append `{ type: "stamp"|"skip" }` to `window.__vscodePosts`
- `#canvas .react-flow__node` length is `0` (list, not a canvas)
- screenshot `verification/decisions.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- `requestStamp` paints “holds” in the webview immediately. That local
  paint is not an attestation. The stub never touches disk.
- Registry and Timeline also surface these scars. Do not invent a second
  stamp UI.
- Do not add `data-action-id` / `data-testid`. `#stampBtn`, `#skipBtn`,
  `[data-ws="decisions"]`, `[data-decision]` are the product hooks.
- Do not XYFlow this list. Do not write `.graphide/stamps/` from the
  driver. Self-review must not stamp.
