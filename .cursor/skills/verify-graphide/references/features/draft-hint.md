# Draft hint

Timeline Uncovered copies a draft `[[flow]]` hit list from uncovered
FQNs. Not a second canvas, not an invented Steiner tree, and not a
stamp. The human pastes into `flows.toml`; the deriver builds the tree.

## Sub-features

- `uncoveredHintFqns()` reads `coverage.uncovered` (same sample of 8
  ids Timeline already keeps) and resolves each to a derived `node.fqn`.
  Missing nodes are skipped — no invented FQNs.
- Selected Uncovered item (`.tl-item.now`) paints `#draftHintBtn`
  **Copy draft** and `<pre id="draftHint">` in
  `extension/media/src/graph/desk.js`. Shape is
  `[[flow]]` / `name` / `hits = ["fqn", …]` — same as
  `fixtures/demo/flows.toml`.
- Click copies that text (`navigator.clipboard.writeText`) and toasts
  **Copied draft hint**. Clipboard failure still leaves the visible
  draft. No `{ type: "stamp" }` post. No `.graphide/stamps/` write.
- Explorer fixture already seeds `coverage.uncovered` (`n0`…
  `solarsim::ScreenshotFormat`). Prefer that desk.

## How to get to it (user POV)

1. Review a folder whose parent cut has uncovered changes (or open the
   explorer fixture). The desk lands on Overview.
2. Open **Timeline**. Select the **Uncovered** row.
3. The draft `[[flow]]` hit list is on that card. Press **Copy draft**
   and paste into `flows.toml`. Rename the flow if you want.
4. Stamp and Skip stay human. Copying a draft is not an approval and
   does not apply the hint.

This PR proves the under-hint copy path: uncovered FQNs can leave the
desk as a hit list. The deriver still builds the Steiner tree after
the human pastes. A first-Review flow on `#tabs` (no paste) is
[proposed-uncovered.md](proposed-uncovered.md).

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Timeline paints Uncovered (same explorer desk as UN2):

```
document.querySelector('#workspaces [data-ws="timeline"]').click();
// .tl-item title Uncovered → click so it is .now
document.querySelector("#draftHintBtn").click();
// #draftHint (or clipboard) has [[flow]] / hits / an uncovered FQN
```

The explorer fixture already has `coverage.uncovered` — do not invent a
second snap or post a fake coverage message.

Driver assertions:

- `#draftHintBtn` is on the selected Uncovered item
- click leaves `#draftHint` (or clipboard) with `[[flow]]`, `hits =`,
  and at least one uncovered FQN (`solarsim::ScreenshotFormat`)
- screenshot `verification/draft-hint.png` is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty
- Map is not raised (`xy=0`) — this gate stays on Timeline

## Gotchas

- Hits are FQNs only. Do not invent IR kinds or an agent-drawn flow
  JSON. The deriver builds the Steiner tree after the human pastes.
- Do not auto-apply the draft. Do not write `flows.toml` from the desk.
- Self-review of this checkout is `--no-parent` and may have empty
  coverage. Hide the control when there are no resolved FQNs. The
  explorer fixture is the prove path.
- Do not add `data-testid`. `#draftHintBtn`, `#draftHint`,
  `.tl-item.now` are the product hooks.
- Agents never stamp. Do not click `#stampBtn` to “cover” the draft.
  Do not flip verify `runs-on` off `ubuntu-latest`.
