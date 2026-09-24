# Herd rail

Fleet list of review cuts (flows / runs and programs) with live states
working, blocked, idle, and done. A blocked row opens the pending
decision. Not a terminal, not a worktree list, and not a second stamp.

## Sub-features

- `#herd` / `#herdList` / `.herd-cut[data-herd-state]` in
  `extension/media/src/chrome/Workspace.jsx` and `renderHerd` in
  `extension/media/src/graph/desk.js`. States come from `flowMark` and
  `decisionRecords` (same scars as Decisions and `#coverage`).
- **blocked** — pending or rejected decision, or a broken stamp, on that
  flow. Explorer: `boot` (UnmatchedHint).
- **working** — the active run (`flowName` or `defaultRunFlow`) when it
  is not blocked, done, or skipped. A selected program chip is working;
  the sole program is working. Other programs are idle.
- **idle** — skipped, or a run that is not the active cut.
- **done** — `flowMark` is `holds`. Explorer `boot` is broken, so this
  desk has no done row.
- Click a blocked flow sets `selectedDecisionKey` to the pending record
  and opens `#workspaces [data-ws="decisions"]`. Program rows call the
  same program filter as `#legend [data-prog]` and return to Map.
- Map stays community LOD (`xy=0` / `data-lod=0`). Stamp / skip stay
  human. The jump posts neither `{ type: "stamp" }` nor `{ type: "skip" }`.

## How to get to it (user POV)

1. Review a folder. The herd rail sits on the left of the desk. Under
   860px it hides so the map grid keeps its stage.
2. Blocked cuts sort first. Press the blocked row.
3. Decisions opens on the pending card for that flow (UnmatchedHint on
   the explorer fixture).
4. Stamp and Skip stay the human attestation. The rail does not answer
   for the agent.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map paints (same explorer desk as the community map):

```
document.querySelector('#herd .herd-cut[data-herd-state="blocked"]').click();
// #workspaces [data-ws="decisions"].on
// #canvas .expl-card.on[data-decision] outcome pending
```

Self-review (`?live=1`) lists one `#herd [data-herd-kind="program"]` per
crate chip.

Driver assertions:

- Map `#herd` shows working, blocked, and idle; blocked flow is `boot`
- Map stays `xy=0` and `data-lod=0` with more than one `.bubble-card`
- blocked click lands Decisions on the pending UnmatchedHint card
- screenshot `verification/herd-rail.png` is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty
- self-review herd program rows `>= 2`

## Gotchas

- Do not add a second findings pane or a Provide-answer control. The
  pending text is the existing Decisions card.
- `#coverage li.finding` stays the unmatched-hint hook. Herd only reads
  those records.
- Done is a holds stamp. Do not relabel skipped or broken as done to
  force four rows on the explorer fixture.
- Agents never stamp. Do not click `#stampBtn` from this step.
- Presentation hides `#herd` with the other chrome. Do not leave it up
  on the stage.
