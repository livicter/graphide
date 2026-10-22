# Open (source / Evidence)

Inspect a node or hop without covering the object rail.

## Sub-features

- Pane `#sourcePane` (starts `hidden`). Kicker `.src-k` reads **Evidence**.
- Title `#srcTitle`, body `#srcBody` (`.src-line` / `.src-line.hot`), inspect meta `#inspMeta`, incident hops `#inspEdges`.
- Coverage mark row (`mark: uncovered` | `changed` | `—`) is owned by
  [coverage-mark.md](coverage-mark.md). This map stays pane open / clip.
- Hop card `#hopCard` / incident `#inspEdges` are owned by
  [hop-card.md](hop-card.md). This map stays pane open / clip.
  Click `.edge-hit` / `text.ekind` / `#inspEdges .row` to open a hop.
- **Editor** `#srcEditor` posts `{ type: "enterNode" }` to the host (open the span in the editor).
- **Close** `#srcClose` or `Escape` hides the pane (`sourcePane.hidden = true`, `#workspace` drops `has-source`).
  Escape on focused Find still closes Evidence after blurring Find (`K13d`).
- Opening Evidence hides the hover tip (`K19d`) and clears the toast (`K20d`), same chrome exclusivity as Keys / Export / Ask.
- Opening Present closes Evidence (`K18j`), same exclusive chrome as Present closing Ask / Keys / Export.
- Opening Ask closes Evidence (`K18m`), same exclusive chrome as Present closing Evidence (`K18j`).
- Opening Evidence closes Ask (`K18v`), same exclusive chrome as Keys / Export / Present closing Ask.
- Opening Evidence closes Keys (`K18y`), same exclusive chrome as Keys closing Evidence (`K18p`).
- Opening Evidence closes Export (`K18z`), same exclusive chrome as Export closing Evidence (`K18s`).
- Opening Evidence closes Lens (`K18ae`), same exclusive chrome as Ask / Keys / Export closing Lens.
- Opening Evidence closes Route (`K18af`), same exclusive chrome as Ask / Keys / Export / Present closing Route.
- Opening Keys closes Evidence (`K18p`), same exclusive chrome as Present closing Evidence (`K18j`).
- Opening Export closes Evidence (`K18s`), same exclusive chrome as Present closing Evidence (`K18j`).
- Object rail `#ledgerPane` / `#ledgerGrid .cell` — source list of names on Map / Slice. Click a `.cell` inspects that node.
- Graph open: click `.vnode[data-id]` (Slice / Overview CFG, including
  `#sliceCanvas .react-flow .vnode` and `#lineageCanvas .ego-node`) →
  `selectNode` → `peekSource`.
- Scroll-drive camera + micro CFG + macro LOD + kind anchors + clutter gate + camEase + line→node + nest depth + blend polish + reduced-motion + rAF coalesce + Present pause + lineMapHit glow + Evidence active-line cue + soft camX follow + idle-settle camX / camY + nest remap soft-cam stay + macro-path soft remap / camK soft stay + Evidence file-hop soft stay + Present→Evidence soft restore + desk remount soft stay + Map↔Slice remount soft stay + Lineage/Overview hop soft stay + persist last-stay across reload + workspace-scoped stay + host re-post restore + Review-restart clear + Present-stage soft-stay stash parity + Present-exit soft-stay vs refit + Review-clear cue + workspace-change clears Review-clear cue + soft-follow settle-before-sample (`S1a`–`S1ah`) is owned by [scroll-drive.md](scroll-drive.md). This map stays pane open / clip.
- Clip rules (PR #45 / `main.css`): `#sourcePane` has `overflow: hidden` and `max-width: 380px` (flex basis ~360px). Long source lines must not cover `#ledgerPane`.

## How to get to it (user POV)

1. After **Review**, stay on Overview or open **Slice**.
2. Click a boxed hop (`.vnode`) or a ledger cell. Evidence slides in on the right.
3. The pane names the FQN / file:line. Close with **Close** or Esc.
4. On a hop label (Calls / Reads), the hop card lists both ends; those
   buttons inspect the node. Prove that drive in [hop-card.md](hop-card.md).

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

1. Click `#workspaces [data-ws="slice"]` so `#ledgerPane` is shown (`LIST_WORKSPACES` hides the rail on decisions / registry / timeline / delta / sequence / dataflow / lifecycle; Map and Slice keep it).
2. Click `.vnode[data-id]` or `#ledgerGrid .cell`.
3. Wait for `#sourcePane` to be visible (`hidden` attribute gone, `.src-k` still says Evidence).

Driver assertions:

- `#sourcePane` computed `overflow` / `overflowX` is `hidden`
- computed `max-width` ≤ 380px and used width ≤ 380px
- `#sourcePane` and `#ledgerPane` bounding boxes do not overlap
- `#srcTitle` or `#srcBody` has content (snippet text from `flowPayload()` looks like `fn hop_N()` / `evidence`)
- opening Evidence hides `#tip` (`K19d`)
- opening Evidence clears `#toast` (`K20d`)
- opening Present closes Evidence (`K18j`)
- opening Ask closes Evidence (`K18m`)
- opening Evidence closes Ask (`K18v`)
- opening Evidence closes Keys (`K18y`)
- opening Evidence closes Export (`K18z`)
- opening Evidence closes Lens (`K18ae`)
- opening Evidence closes Route (`K18af`)
- Evidence `#srcBody` scroll updates `__graphideScrollDrive` / moves cam / CFG / macro / anchors / detail / camEase / line→node / nest / blend / reduced-motion / rAF / Present pause / lineMapHit glow / active-line cue / soft camX follow / idle-settle camX / camY / nest remap soft-cam stay / macro-path soft remap / file-hop soft stay / Present→Evidence soft restore + desk remount soft stay + Map↔Slice remount soft stay + Lineage/Overview hop soft stay + persist last-stay across reload + workspace-scoped stay + host re-post restore + Review-restart clear + Present-stage soft-stay stash parity + Present-exit soft-stay vs refit + Review-clear cue + workspace-change clears Review-clear cue + soft-follow settle-before-sample (`S1a`–`S1ah`) — see [scroll-drive.md](scroll-drive.md)
- opening Keys closes Evidence (`K18p`)
- opening Export closes Evidence (`K18s`)
- screenshot of the desk with Evidence open is not black

`peekSource` always `vscode.postMessage({ type: "peekSource", id })`. The stub does not reply with `{ type: "source" }`. The webview still calls `showSource` from the in-memory node and `snapshot.snippets` — so Evidence works without a live VS Code host.

## Gotchas

- Overview is not a `LIST_WORKSPACES` key. `setGraphChrome` hides `#ledgerPane` when `explorerWs` is in `LIST_WORKSPACES` (`decisions`, `registry`, `timeline`, `delta`, `sequence`, `dataflow`, `lifecycle` — `extension/media/src/graph/desk.js` `LIST_WORKSPACES`). Overview keeps the rail. Confirm on Slice if you need both rail and Evidence in one frame. React owns `#sourcePane` / `#ledgerPane` markup (`chrome/Workspace.jsx`); `#workspace` flex layout still owns canvas vs rail vs Evidence.
- `showSource({ missing: true })` still unhides the pane (“No span for this node”). Do not treat “pane visible” alone as a good inspect.
- `#srcBody` scrolls (`overflow: auto`); the **pane** clips (`#sourcePane { overflow: hidden }`). Assert the pane, not the body.
- Do not add `data-testid="source-pane"`. `#sourcePane` and `.src-k` are the product hooks.
- Live SolarSim snapshots may have empty snippets; `peekSource` still opens from the graph node (`No snippet on this snapshot`). Synthetic explorer mode includes snippets — prefer those for a first green job.
