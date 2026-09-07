# Uncovered node

A changed node that sits off every proposed Steiner tree becomes
`FindingKind::UncoveredNode` and lands on the Review desk as **aggregate
coverage**, not a per-node Decisions card. Distinct from `UnmatchedHint`
and `StampBroken`.

## Sub-features

- Engine: `review.rs` pushes `UncoveredNode { fqn }` for each id in
  `coverage.uncovered` (`crates/graphide-engine/src/review.rs`). Those
  are changed nodes off every proposed tree.
- Status strip `#coverage .cov-chip` from `renderCoverage` in
  `extension/media/src/graph/desk.js`: `Coverage {n} changed · {n}
  uncovered`. Explorer fixture already seeds both arrays (`n0`…`n1122`).
  The strip does **not** dump `UncoveredNode` finding lines.
- Timeline via `timelineEvents()`: item title `Uncovered`, body
  `{n} changed nodes sit off every proposed tree`, kind `coverage`.
  Same explorer snap — not a new list.
- Decisions `decisionRecords()` lists `StampBroken` and `UnmatchedHint`
  only. There is no per-node `UncoveredNode` card. Do not invent one.
- Stamp / skip stay human. Reading coverage never posts `{ type: "stamp" }`
  and never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder whose parent cut has changed nodes off every proposed
   tree (or open the explorer fixture). The desk lands on Overview.
2. The coverage strip reads **Coverage N changed · N uncovered**.
3. Open **Timeline**. The Uncovered row states how many changed nodes
   sit off every proposed tree. That is the finding surface — not a
   Decisions card.
4. Stamp and Skip are still the human attestation. An uncovered node is
   a coverage hole, not an approval.

This PR proves the failure path: an uncovered change is visible as the
coverage strip + Timeline item, not silent. Do not invent Decisions cards.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Timeline paints (same explorer desk as TL1):

```
// #coverage text matches Coverage N changed · N uncovered (N > 0)
document.querySelector('#workspaces [data-ws="timeline"]').click();
// .tl-item title Uncovered · body "N changed nodes sit off every proposed tree"
```

The explorer fixture already has `coverage.uncovered` — do not invent a
second snap or post a fake `findings` / `coverage` message.

Driver assertions:

- `#coverage` text matches `Coverage` + non-zero `changed` + `uncovered`
  (no `UncoveredNode` dump on the strip)
- Timeline `.tl-item` title is `Uncovered` and body matches
  `changed nodes sit off every proposed tree`
- screenshot `verification/uncovered-node.png` is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty
- Map is not raised (`xy=0`) if the drive touches Map — this gate
  stays on Timeline

## Gotchas

- Do not confuse this with `UnmatchedHint` (a missing `flows.toml` hit
  on `#coverage li.finding` + Decisions) or `StampBroken`. Coverage
  mark (`#inspMeta` mark) names one node's flag; this gate is the
  aggregate finding.
- Product does **not** list `UncoveredNode` on Decisions. Registry
  also skips it. Timeline owns the parent-cut / uncovered rows.
- Self-review of this checkout is `--no-parent` and may have empty
  coverage. Do not fail closed on live-snap emptiness; the explorer
  fixture is the prove path.
- Draft `[[flow]]` copy from this row is [draft-hint.md](draft-hint.md).
  This map stays the aggregate finding.
- Do not add `data-testid`. `#coverage`, `.cov-chip`,
  `.tl-item[data-t]`, `#tlScrubMeta` are the product hooks.
- Agents never stamp. Do not click `#stampBtn` to “cover” the node.
  Do not flip verify `runs-on` off `ubuntu-latest`.
