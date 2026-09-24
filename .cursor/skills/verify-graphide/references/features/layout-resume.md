# Layout resume

Review remembers the cut on this webview. Reload opens the same
workspace, program chip, Find text, focused node, and dragged card
positions. The blob is one `layout` field on `vscode.getState()`,
next to `theme` and `preset`.

## Sub-features

- `readDeskLayout(state)` in `bootDesk` (`extension/media/src/graph/desk.js`)
  returns `{ v, ws, pinned, q, program, focus, pins }` or null. `v`
  must be `1`. `ws` must be a known workspace. A bad pin, a non-object,
  or a bad program rejects the whole blob. It does not throw.
- `resumeDesk(snapshot)` runs once per document from
  `applyExplorerLanding`, before the default landing. It sets
  `explorerWs`, `explorerPinned`, `graphFilter.q`, `#graphSearch`
  (no input event), `graphFilter.program` via `programKeyOf` against
  `snapshot.programs`, `progFocus`, `selectedNodeId`, and `layoutPins`
  (replace). On Lineage, `lineageEgoId` is the focus id when that node
  exists. A missing program key leaves the chip at All and is not
  written back. A missing focus id becomes null. Then the gate goes
  live.
- `commitDesk()` no-ops while the gate is held or `snapshot` is null.
  It merges `{ layout }` onto the previous state so theme and preset
  stay. Pins are sorted by `k`. Unchanged JSON skips `setState`.
  `setState` errors are swallowed.
- `commitDesk` runs from `paint`'s `finally`, and from a program chip
  click, Find input, `selectNode`, and drag pointer-up. Pointer move
  does not commit.
- `?ws=` for a known workspace wins for the live cut. That URL choice
  is not written over a previously saved `ws` / `pinned`.
- `empty` holds the gate and clears `landingDone` before it clears the
  live cut. It does not commit. The stored layout stays for the next
  programs message.
- A later `applyExplorerLanding` returns immediately, so a second
  programs or flowchart message cannot replay storage over a newer edit.
- Pins use `layoutViewKey()+":"+id` for every view, not only the
  current one. Camera, kinds, bubble, flow name, ego hops, and panes
  are not stored.
- Map stays the community path (`data-lod=0`, no React Flow nodes).

## How to get to it (user POV)

1. Open Review. Move to Lineage, pick a program chip, focus a node,
   and type in Find.
2. Open Map and drag a community card.
3. Leave the cut on Lineage.
4. Reload the panel. Lineage, the chip, Find, and the focused node
   come back. Map still has the card where you dragged it.
5. Close the snapshot (`empty`). The saved cut stays for the next
   Review.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

The host stub stores `acquireVsCodeApi` state in `localStorage` under
`vscode:` plus `location.pathname` and `location.search`. One JSON
object. A parse failure returns null. Other URLs are left alone.

After the stamp-host step on that explorer desk, drive the real
controls, then `page.goto` the same URL without clearing storage.

```
#workspaces [data-ws="lineage"]
#legend [data-prog="0"]          // bin main, when the chip exists
#lineageCanvas .vnode[data-id]
#graphSearch                     // input value Toast
#tabs .tab[data-flow="boot"]
#workspaces [data-ws="map"]
.bubble-card                     // drag, then Lineage again
```

Driver assertions:

- LR1 restored workspace is lineage
- LR2 program chip `bin main` is `.on` when the first document had that chip
- LR3 `#graphSearch` value is `Toast`
- LR4 the same node is selected / the lineage ego
- screenshot `verification/layout-resume.png` of that Lineage desk
- LR5 after Map, the dragged card `left` / `top` match, `.react-flow__node`
  count is 0, `data-lod` is `0`, community `xy` is 0
- LR6 post `window.__graphideHarnessPayload` again. LR1 to LR4 still hold
- LR7 set that URL's stored `layout.ws` to `search` and `page.goto`
  again. Landing is overview or map, Find is empty, and the page does
  not throw
- LR8 no `{ type: "stamp" }` or `{ type: "skip" }` post
- LR8 `.graphide/stamps/` stays empty

## Gotchas

- `?ws=` is a view pin for this document. `commitDesk` keeps the
  previous `ws` and `pinned` when that query is present. Find, focus,
  pins, and the program chip still update.
- A program key that is not in `snapshot.programs` shows All. The saved
  key stays in the blob until a chip click.
- The second flowchart message must not call `resumeDesk` again.
  `landingDone` is that gate. `empty` is the only reset.
- Pin keys include the current flow name through `layoutViewKey`. The
  explorer payload's flow is `boot`. Drag on Map after that tab is
  selected, or the reloaded cut will look up a different key.
- Do not store the layout under a `localStorage` key from `desk.js`.
  The harness key stays in `webview-harness.html`.
- Agents never stamp. This step does not click `#stampBtn` or `#skipBtn`.
