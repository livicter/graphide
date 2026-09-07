# Open slice

A decision record with a flow jumps to **Slice** for that flow.
Not a second canvas, not a stamp, and not a rewrite of UnmatchedHint.

## Sub-features

- Decision detail `.ws-detail` paints **Open slice** when the selected
  record has a flow (`desk.js` `renderDecisionsBody`):
  `button.crumb-btn[data-open-slice="{flow}"]`.
- Click calls `selectFlow(name)` and pins `explorerWs = "slice"`.
  `#workspaces [data-ws="slice"]` gains `.on`. `#tabs .tab[data-flow]`
  for that name is `.on`.
- Explorer fixture: UnmatchedHint · boot · MissingHit (and StampBroken
  on `boot`) already have a flow. Prefer that desk — same snap as
  [unmatched-hint.md](unmatched-hint.md).
- Stamp / skip stay human. Opening Slice never posts `{ type: "stamp" }`
  and never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder (or open the explorer fixture). The desk lands on
   Overview.
2. Open **Decisions**. Select a card that names a flow (UnmatchedHint
   · boot · MissingHit is fine).
3. Press **Open slice**. The workspace switches to Slice for that flow.
4. Stamp and Skip are still the human attestation. The jump is
   navigation, not an approval.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After UnmatchedHint selects the boot card (same explorer desk as UH2):

```
// button[data-open-slice="boot"] is on the decision record
document.querySelector("button[data-open-slice]").click();
// #workspaces [data-ws="slice"].on
// #tabs .tab.on[data-flow] === data-open-slice
```

The explorer fixture already has the UnmatchedHint card — do not invent
a second snap or post a fake decision.

Driver assertions:

- selected decision shows `button[data-open-slice]` (UnmatchedHint boot)
- click lands on `#workspaces [data-ws="slice"].on`
- `#tabs .tab.on[data-flow]` matches the button's `data-open-slice`
- screenshot `verification/open-slice.png` is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty
- Map is not raised (`xy=0`) if the drive returns to Map — this gate
  lands on Slice

## Gotchas

- `selectFlow` posts `{ type: "selectFlow", flow }` to the host. That is
  not a stamp. The stub only records `window.__vscodePosts`.
- `selectFlow` paints Slice only when the named flow has tree nodes or
  edges. Explorer `boot` already has both.
- Do not confuse this with UnmatchedHint (finding visible) or
  Decisions list paint. This gate is the jump.
- Do not add `data-testid`. `button[data-open-slice]`,
  `#workspaces [data-ws="slice"]`, `#tabs .tab[data-flow]` are the
  product hooks.
- Agents never stamp. Do not click `#stampBtn` to “cover” the flow.
  Do not flip verify `runs-on` off `ubuntu-latest`.
