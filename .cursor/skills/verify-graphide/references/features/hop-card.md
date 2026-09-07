# Hop card

Evidence names both ends of an incident hop. Click a graph `.edge-hit` /
`text.ekind`, or the equivalent `#inspEdges .row[data-from][data-to]`,
and `#hopCard` lists the two nodes. Those buttons inspect the node.
Not pane open/clip ([open-evidence.md](open-evidence.md)), not the
coverage mark ([coverage-mark.md](coverage-mark.md)), and not a stamp.

## Sub-features

- `#inspEdges` (inside `#sourcePane`). `fillInspect` writes up to 18
  incident rows from `incidentEdges(id)`: `.row[data-from][data-to][data-kind]`.
  `bindHopClicks` opens the hop. Empty graph text is
  `none on the derived graph`.
- Graph hop hits: `.edge-hit` / `text.ekind` (`edgeSvg` on vanilla
  Steiner / Map community edges). Slice / Overview CFG after the XYFlow
  port may not paint those SVG hits — `#inspEdges .row` is the product
  hook on that desk.
- `#hopCard` starts `hidden`. `showHop` unhides it and writes
  `Hop · {kind}`, two `[data-id]` end buttons, and both FQNs.
  Clicking an end calls `selectNode` → `#srcTitle` / `#srcBody` change.
- Close `#srcClose` or Escape hides the pane and the card
  (`hopCard.hidden = true`). Stamp / skip stay human.

## How to get to it (user POV)

1. After **Review**, open **Slice** (or stay on Overview CFG).
2. Click a boxed hop (`.vnode`). Evidence slides in. Incident hops
   list under inspect meta.
3. Click a hop row (or a Calls / Reads label on the graph). The hop
   card names both ends. Press an end to inspect that node.
4. Close with **Close** or Esc. Stamp and Skip stay the human
   attestation.

The in-tree proof is the explorer desk (`?mode=explorer`). Synthetic
edges are already on the fixture — do not invent a second snap.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Slice paints Steiner nodes (same path as open-evidence):

```
document.querySelector('#workspaces [data-ws="slice"]').click();
document.querySelector(".vnode[data-id]").click();
// #sourcePane open; #inspEdges .row[data-from][data-to] when the node has edges
const hit = document.querySelector(".edge-hit, text.ekind, #inspEdges .row[data-from][data-to]");
hit.dispatchEvent(new MouseEvent("click", { bubbles: true }));
// #hopCard visible; two [data-id] buttons
document.querySelector("#hopCard [data-id]").click();
document.getElementById("srcClose").click();
```

If the first vnode has no incident rows, click the next `.vnode` or a
`#ledgerGrid .cell`. Prefer `.edge-hit` / `text.ekind` when the graph
paints them; otherwise `#inspEdges .row` is the Slice hook.

Driver assertions:

- `#sourcePane` is open (`.src-k` still Evidence) and `#inspEdges`
  has `.row[data-from][data-to]` (HC0)
- click `.edge-hit` / `text.ekind` / `#inspEdges .row` unhides
  `#hopCard` with two `[data-id]` ends (HC1)
- click an end changes `#srcTitle` or `#srcBody` (HC2)
- screenshot `verification/hop-card.png` is not a black frame
- `#srcClose` hides the pane and `#hopCard` (HC3)
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step (HC4)
- Map stays `xy=0` if the drive touches Map (HC5)
- `.graphide/stamps/` is still empty (HC6)

`peekSource` still works from in-memory node + `snapshot.snippets`.
Do not post a fake hop message.

## Gotchas

- Slice CFG is XYFlow. Do not fail closed when `.edge-hit` is absent
  on `#sliceCanvas` — `#inspEdges .row` is the same `showHop` path.
- `showHop` then `selectNode(to)` rewrites `#srcTitle` to the **to**
  node. Click the **from** `#hopCard [data-id]` so the title changes.
- `#hopCard` lives inside `#sourcePane` (`chrome/Workspace.jsx`).
  Close clears both. Do not treat “pane visible” as a hop.
- Lineage `.expl-card.hop` is a different list. This gate is Evidence
  `#hopCard` / `#inspEdges`.
- Do not add `data-testid`. `#inspEdges`, `.row`, `.edge-hit`,
  `text.ekind`, `#hopCard`, `#hopCard [data-id]` are the product hooks.
- Agents never stamp. Do not click `#stampBtn` to “cover” the hop.
