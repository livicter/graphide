# Registry snapshot graphic

Interactive composition graphic of this review snapshot’s mass — nodes,
edges, and files — so a reviewer can read the snap’s shape on the Registry
canvas, not only in the first audit-row’s text. Counts come from the same
snap as the Review snapshot row (not invented). No XYFlow, no peekSource.
RAK kind-mix bars and the audit table stay.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `registrySnapshotMetrics` → `registrySnapshotGraphicHtml` →
  `bindRegistrySnapshotGraphic` → `applyRegistrySnapshotGraphicPaint`.
  Focus is `registrySnapshotFocus` (`nodes` | `edges` | `files`). Escape
  clears to idle after the RAK filter owner on Registry.
- Strip `.rsg-strip[data-rsg="1"]` above the RAK strip, with three
  `.rsg-tile[data-rsg-metric]` buttons (Nodes / Edges / Files) and SVG
  magnitude bars scaled to the max of those three counts. Plugin / elapsed
  caption uses `snapshot.plugin` and `stats.elapsed_ms`.
- Click a tile to focus it (`.rsg-now` / `.rsg-dim`) and emphasize the
  Review snapshot table row (`tr[data-rsg-row="snapshot"].rsg-row-now`).
  Second click or Escape clears. Must not open Evidence / `peekSource` /
  the source pane. `#canvas .react-flow__node` stays `0`.
- CSS in `extension/media/main.css`: `.rsg-strip` / `.rsg-tile` / `.rsg-bar`.
- Stamp / skip attestation unchanged. Registry never writes
  `.graphide/stamps/` from this graphic.

## How to get to it (user POV)

1. Review a folder. Land on Overview.
2. Open **Registry** (`#workspaces [data-ws="registry"]` or press `5`).
3. Above the audit kind bars, three tiles show this snap’s node, edge, and
   file counts (same numbers as the first table row). Click a measure to
   focus it. Escape clears without leaving Registry (after any RAK filter).

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="registry"]` (same document as RAK —
do not add a mid-suite `page.goto`).

Driver assertions (RSG1–RSG5):

- `.rsg-strip[data-rsg="1"]` present; tile counts match the snapshot row
- click focuses a tile; Registry stays; no source pane; no XYFlow
- Escape clears focus; Registry stays open
- screenshot `verification/registry-snapshot-graphic.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- This is an inline composition graphic in a list workspace, not an XYFlow
  canvas. RG2 still requires `#canvas .react-flow__node` length `0`.
- Do not invent counts. Nodes / edges / files must match `snapshot.graph`
  and `stats.files`, and the first audit row’s text.
- Do not remove RAK or the audit table. Do not treat this as a second
  kind-mix (RAK already owns review/stamp/skip/broken/finding).
- Rebuild `extension/media/main.js` with `npm run build:webview` using
  in-tree `node_modules` (no worktree symlink).
- Reseal the immutable lock *after* any edit to this feature map.
