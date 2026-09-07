# Coverage mark

Evidence inspect names a derived node's coverage flag. `nodeFlags(id)`
reads `snapshot.coverage.uncovered` / `coverage.changed`. `fillInspect`
writes `#inspMeta` row `mark: uncovered` | `changed` | `—`. Not a Map
altitude, not a Lineage `.changed` class, and not an agent stamp.

## Sub-features

- `#inspMeta` row key `mark`. Value is `uncovered` when the selected id
  is in `coverage.uncovered`, else `changed` when it is in
  `coverage.changed` (or a delta added/changed FQN via `changedIdSet`),
  else `—`.
- Source: `fillInspect` / `nodeFlags` in `extension/media/src/graph/desk.js`.
  Same flags paint Map bubble UNC counts and ledger `.cell.uncovered`.
- Open Evidence on an uncovered or changed node (Slice `.vnode[data-id]`
  or `#ledgerGrid .cell.uncovered`). The mark row must not stay `—`.
- Explorer `flowPayload()` seeds both arrays (`n0`…`n1122`). Prefer that
  desk. Delta snap can prove `changed` when uncovered is empty.
- Stamp / skip stay human. Reading the mark never posts `{ type: "stamp" }`
  and never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. After **Review**, open **Slice** (or stay on Overview CFG).
2. Click a boxed hop that sits off every proposed tree, or a ledger cell
   marked uncovered. Evidence slides in on the right.
3. Inspect meta lists kind / span / slice, then **mark** as uncovered or
   changed. Close with **Close** or Esc.
4. Stamp and Skip are still the human attestation. The mark is a flag,
   not an approval.

The in-tree proof is the explorer desk (`?mode=explorer`). Synthetic
coverage is already on the fixture — do not invent arrays in the driver.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Slice paints Steiner nodes (same path as open-evidence):

```
document.querySelector('#workspaces [data-ws="slice"]').click();
document.querySelector(".vnode[data-id]").click();   // n0..n7 are uncovered
// #sourcePane open; #inspMeta .row key mark = uncovered
```

If the first vnode is clean, click `#ledgerGrid .cell.uncovered` instead.
Confirm `#coverage` already counts changed / uncovered (`> 0`) so the
snap actually has those arrays.

Driver assertions:

- `#coverage` text has a non-zero `changed` or `uncovered` count
- `#inspMeta` `.row` whose `.k` is `mark` is `uncovered` or `changed`
  (not only `—`)
- `#sourcePane` is open (`.src-k` still Evidence)
- screenshot `verification/coverage-mark.png` is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- Map stays `xy=0` if the drive touches Map (this gate stays on Slice)

`peekSource` still works from in-memory node + `snapshot.snippets`. Do
not post a fake `coverage` message.

## Gotchas

- Uncovered wins when both flags are set (`fillInspect` ternary). Explorer
  seeds both arrays on the same ids — expect `uncovered`, not `changed`.
- Lineage Y10 asserts `.changed` CSS on the Delta snap. That is not this
  mark row. Do not treat a class as `#inspMeta` text.
- Self-review of this checkout is `--no-parent` and may have empty
  coverage. Do not fail closed on live-snap emptiness; the explorer
  fixture is the prove path.
- Do not add `data-testid`. `#inspMeta`, `.row`, `.k`, `#coverage`,
  `#ledgerGrid .cell.uncovered` are the product hooks.
- Agents never stamp. Do not click `#stampBtn` to “cover” the node.
