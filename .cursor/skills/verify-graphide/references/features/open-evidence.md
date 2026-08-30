# Open (source / Evidence)

Inspect a node or hop without covering the object rail.

## Sub-features

- Pane `#sourcePane` (starts `hidden`). Kicker `.src-k` reads **Evidence**.
- Title `#srcTitle`, body `#srcBody` (`.src-line` / `.src-line.hot`), inspect meta `#inspMeta`, incident hops `#inspEdges`.
- Hop card `#hopCard` (also inside the pane). Click `.edge-hit` / `text.ekind` to open a hop.
- **Editor** `#srcEditor` posts `{ type: "enterNode" }` to the host (open the span in the editor).
- **Close** `#srcClose` or `Escape` hides the pane (`sourcePane.hidden = true`, `#workspace` drops `has-source`).
- Object rail `#ledgerPane` / `#ledgerGrid .cell` — source list of names on Map / Slice. Click a `.cell` inspects that node.
- Graph open: click `.vnode[data-id]` (Slice / Overview CFG) → `selectNode` → `peekSource`.
- Clip rules (PR #45 / `main.css`): `#sourcePane` has `overflow: hidden` and `max-width: 380px` (flex basis ~360px). Long source lines must not cover `#ledgerPane`.

## How to get to it (user POV)

1. After **Review**, stay on Overview or open **Slice**.
2. Click a boxed hop (`.vnode`) or a ledger cell. Evidence slides in on the right.
3. The pane names the FQN / file:line. Close with **Close** or Esc.
4. On a hop label (Calls / Reads), the hop card lists both ends; those buttons inspect the node.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

1. Click `#workspaces [data-ws="slice"]` so `#ledgerPane` is shown (`LIST_WORKSPACES` hides the rail on decisions / registry / timeline only; Map and Slice keep it).
2. Click `.vnode[data-id]` or `#ledgerGrid .cell`.
3. Wait for `#sourcePane` to be visible (`hidden` attribute gone, `.src-k` still says Evidence).

Driver assertions:

- `#sourcePane` computed `overflow` / `overflowX` is `hidden`
- computed `max-width` ≤ 380px and used width ≤ 380px
- `#sourcePane` and `#ledgerPane` bounding boxes do not overlap
- `#srcTitle` or `#srcBody` has content (snippet text from `flowPayload()` looks like `fn hop_N()` / `evidence`)
- screenshot of the desk with Evidence open is not black

`peekSource` always `vscode.postMessage({ type: "peekSource", id })`. The stub does not reply with `{ type: "source" }`. The webview still calls `showSource` from the in-memory node and `snapshot.snippets` — so Evidence works without a live VS Code host.

## Gotchas

- Overview is not a `LIST_WORKSPACES` key, but `renderExplorerList("overview")` still runs and **hides** the ledger via `setGraphChrome` only for `decisions|registry|timeline`. Overview keeps `#ledgerPane` unless `isListWorkspace`. Confirm on Slice if you need both rail and Evidence in one frame.
- `showSource({ missing: true })` still unhides the pane (“No span for this node”). Do not treat “pane visible” alone as a good inspect.
- `#srcBody` scrolls (`overflow: auto`); the **pane** clips (`#sourcePane { overflow: hidden }`). Assert the pane, not the body.
- Do not add `data-testid="source-pane"`. `#sourcePane` and `.src-k` are the product hooks.
- Live SolarSim snapshots may have empty snippets; `peekSource` still opens from the graph node (`No snippet on this snapshot`). Synthetic explorer mode includes snippets — prefer those for a first green job.
