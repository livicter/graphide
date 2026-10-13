# Layout resume

When the Review webview is recreated, the last desk layout comes back:
workspace cut, program chip, Find query, focused node, and Map card
pins. Stored on the existing `vscode.getState()` / `setState()` blob
(`desk`), same merge theme and preset already use. Not a new file, not
a terminal layout, and not a worktree restore.

## Sub-features

- `restoreDeskLayout` / `rememberDeskLayout` in
  `extension/media/src/graph/desk.js`. The blob is `{ ws, program, q,
  focus, pins }`. Pins are the existing `layoutPins` keys
  (`layoutViewKey` + card id) with x/y.
- Workspace writes from `setWorkspace` and the herd jump. Program writes
  from `#legend [data-prog]` and a herd program row. Find writes from
  `#graphSearch`. Focus writes from `selectNode`. Pins write from
  `pinNode` (drag) and clear on Reorganize.
- A `?ws=` query still wins, so Delta / Sequence / Data-flow / Lifecycle
  harness pins are unchanged. The blob also stores the snap key
  (plugin, node count, flow names) and the flow name the pins were
  laid out under. A different snap does not inherit the layout. A
  saved program that is not in the new snap is ignored.
- The harness stub keeps that blob in `sessionStorage`
  (`graphide-vscode-state`) so a second `page.goto` behaves like a
  webview recreate. VS Code already persists `setState` on the host.
- Map stays community LOD (`xy=0` / `data-lod=0`). Stamp / skip stay
  human. Resume posts neither `{ type: "stamp" }` nor `{ type: "skip" }`.

## How to get to it (user POV)

1. Review a folder. Open Map, pick a program chip, type in Find, focus
   a ledger node, drag a community card.
2. Close the Review view and open it again (the webview HTML reloads).
3. The same cut, chip, query, focused node, and card positions are back.
   Herd rail is unchanged.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

On the explorer Map, set the layout, then `page.goto` the same URL
(sessionStorage survives). Assert:

```
#workspaces [data-ws="map"].on
#legend [data-prog="0"].on
#graphSearch value
#ledgerGrid .cell[data-id].on
.bubble-card style.left / style.top
```

Driver assertions:

- second load is Map, not the default Overview landing
- program chip `data-prog="0"` stays `.on`
- Find value matches the token typed before reload
- the focused ledger id is `.on`
- the dragged card stays off its pre-drag left and within 36px of the
  pinned left/top
- Map stays `xy=0` and `data-lod=0` with more than one `.bubble-card`
- `#herd .herd-cut` is still present
- screenshot `verification/layout-resume.png` is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty

## Gotchas

- Do not add a second store (`localStorage`, a JSON file, extension
  globalState). `getState` is the store. Theme and preset already share
  the object.
- Do not persist camera zoom. Map altitude stays `data-lod=0`.
- `?ws=` beats the saved cut. Clear `graphide-vscode-state` after this
  step so later desks do not inherit the explorer layout.
- Drag writes the pin. Do not invent a pin button.
- Agents never stamp. Do not click `#stampBtn` from this step.
- Herd rail behavior stays in [herd-rail.md](herd-rail.md). This step
  only reads the same workspace and program writes.
