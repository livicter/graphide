# Stamp recheck overlay

A later Review lays the new Steiner on stored stamp flowchart
positions. Engine `recheck_stamp` / `overlay_positions` and
`apply_saved_stamps` already do that. This map proves the running
Review desk paints that overlay — an inserted hop is a scar, not a
reshuffled city. Not a new workspace. Agents never stamp.

## Sub-features

- Engine: `Stamp.positions` are `run_key` (`bubble#visit`) coords.
  `recheck_stamp` builds a new tree from the same hits, then
  `overlay_positions` copies stored x/y onto matching runs.
  `apply_saved_stamps` writes those positions onto the snap flow.
- Explorer fixture: first paint is the fresh layout
  (`24,16` / `280,16`) plus Decisions `StampBroken` on `boot`.
  `stampRecheckOverlay()` is the fixture recheck: same two runs
  (`b-render`, `b-origin`), new hop `n0→n3`, positions
  `56,152` / `360,152` (`b-render#0` / `b-origin#0`).
- Desk: `renderRuns` places `.run[data-run]` at
  `flowchart.positions`. After the overlay patch, those boxes sit
  on the stored stamp coords, not the fresh row.
- Stamp / skip stay human. Overlay never posts `{ type: "stamp" }`
  / `{ type: "skip" }` and never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. A human stamped a flow. The stamp file holds the hit set, tree,
   and flowchart positions.
2. The next Review rechecks that stamp: latest deriver, same hits,
   new Steiner. Decisions may show `StampBroken` when hops differ.
3. Open **Slice**. Subsystem-run boxes stay where the stamp put
   them. The new hop is a scar on that layout, not a new city.

The in-tree proof is the explorer desk (`?mode=explorer`) plus the
existing StampBroken fixture. It does not write a stamp.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Slice / Enter recycle (same explorer desk):

```
document.querySelector('#workspaces [data-ws="slice"]').click();
// measure .run left/top — fresh 24,16 / 280,16
document.querySelector('#workspaces [data-ws="map"]').click();
window.postMessage(window.__graphideStampRecheck(), "*");
document.querySelector('#workspaces [data-ws="slice"]').click();
// .run left/top === 56,152 / 360,152
document.querySelector('#workspaces [data-ws="decisions"]').click();
// StampBroken · boot
```

Driver assertions (ids `ST0`…):

- Slice first paint has `>= 2` `.run[data-run]` at the fresh
  layout (not the stamp overlay)
- after `stampRecheckOverlay()` the same runs sit at stored stamp
  positions `56,152` / `360,152` and those coords differ from fresh
- Decisions still lists `StampBroken` on `boot`
- screenshot `verification/stamp-recheck.png` is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty
- return to Map keeps `xy=0` with more than one `.bubble-card`

## Gotchas

- `#sliceCanvas` is the Steiner. Overlay is proved on `.chart .run`
  left/top, not on XYFlow node coords.
- `sliceWorkspaceKey` ignores positions. Post the overlay from Map
  so Slice first-paints; a same-tree patch while Slice is mounted
  recycles Steiner and would keep the old run HTML.
- Do not write `.graphide/stamps/`. The overlay is the fixture
  path (`__graphideStampRecheck`), not a host `writeStamp`.
- Do not add `data-testid`. `.run`, `[data-run]`, `[data-ws="slice"]`,
  `[data-decision]` are the product hooks.
- Do not invent overlay chrome or a second Decisions card.
  Agents never stamp. Do not flip verify `runs-on` off `ubuntu-latest`.
