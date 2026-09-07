# Unmatched hint

A `flows.toml` hit FQN that does not resolve becomes
`FindingKind::UnmatchedHint` and lands on the Review desk. Not a matching
named-flow chip (that is flow-hints), not `StampBroken`, and not a second
findings UI.

## Sub-features

- Engine: `review.rs` pushes `UnmatchedHint { flow, fqn }` when
  `resolve_fqn` misses a hint hit (`crates/graphide-engine/src/review.rs`).
- Status strip `#coverage li.finding` from `renderCoverage` in
  `extension/media/src/graph/desk.js`: `unmatched {fqn} in {flow}`.
  Explorer fixture text is `unmatched solarsim::MissingHit in boot`.
- Decisions cards via `decisionRecords()` / `findingTitle`: title
  `UnmatchedHint · {flow} · {short fqn}`, body the unmatched FQN,
  outcome `pending`. Same explorer snap — not a new list.
- Explorer `flowPayload()` already seeds the finding
  (`extension/scripts/webview-harness.js`). Prefer that desk.
- Stamp / skip stay human. Reading the finding never posts
  `{ type: "stamp" }` and never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder whose `flows.toml` names a hit that is not on the
   graph (or open the explorer fixture). The desk lands on Overview.
2. The coverage strip lists **unmatched {fqn} in {flow}** in red.
3. Open **Decisions**. The same finding is a pending card, next to any
   stamp / skip / StampBroken rows — do not read it as a broken stamp.
4. Stamp and Skip are still the human attestation. An unmatched hit is
   a coverage hole, not an approval.

This PR proves the failure path: a **missing** hit is visible as a
finding, not silent. Under-hint suggestion UX is out of scope.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Overview / Decisions paint (same explorer desk as DC1):

```
// #coverage li.finding includes unmatched solarsim::MissingHit in boot
document.querySelector('#workspaces [data-ws="decisions"]').click();
// .expl-card[data-decision] title UnmatchedHint · boot · MissingHit
```

The explorer fixture already has the finding — do not invent a second
snap or post a fake `findings` message.

Driver assertions:

- `#coverage li.finding` text matches unmatched + `MissingHit` + `boot`
- Decisions `.expl-card[data-decision]` lists `UnmatchedHint` (body
  `solarsim::MissingHit`) and is distinct from any `StampBroken` card
- screenshot `verification/unmatched-hint.png` is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty
- Map is not raised (`xy=0`) if the drive touches Map — this gate
  stays on Decisions

## Gotchas

- Do not confuse `UnmatchedHint` with `StampBroken`. Timeline / Decisions
  already mention broken stamps. This gate requires the unmatched FQN.
- Flow-hints (`?dataflow=1`) proves a *matching* `data-subscription`
  hit. Do not point this gate at the demo sidecar.
- Hints are hit lists. Do not invent a second findings pane or
  `data-testid`. `#coverage li.finding` and
  `.expl-card[data-decision]` are the product hooks.
- Agents never stamp. Do not click `#stampBtn` to “cover” the miss.
  Do not flip verify `runs-on` off `ubuntu-latest`.
