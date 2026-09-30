# Map

Community cut of the reviewed program. Not a function dump and not a lone START card.

## Sub-features

- Workspace tab `#workspaces [data-ws="map"]` (key `1`).
- Community boxes `.bubble-card` with `.name`, `.meta`, optional `.role`, member peek `.bubble-card .members`.
- Story pin: first hop community gets `.bubble-card.start` (CSS outline); last gets `.bubble-card.end`. Off-path cards get `.bubble-card.off`.
- Enter a bubble: click `.bubble-card` → derived XYFlow on `#enterCanvas` (shaped Function / Type / Endpoint, cap 24 nodes / 80 edges). Lit = on the current flow Steiner tree (`[data-lit="1"]` / `.vnode.lit`); grey = siblings (`[data-lit="0"]` / `.vnode.grey`). The walk source in that community is `data-shape="start"`; the walk sink is `data-shape="end"`. Same `steinerOfWalk` rule as Slice. The source lives in the start card (`b-render` / `n0`). The sink lives in the end card (`.bubble-card.end`, explorer `b-ui` / `n7`). A community that has children shows those children as non-leaves (`data-leaf="0"`) with the registry Type shape (`data-shape="type"`, `data-kind="Type"`). A child with no grandchildren and one member is that derived node (`data-leaf="1"`, its IR kind), not a Type rect. Hops follow members: an edge whose other end sits inside a sibling community is drawn on that community node. The hop card names those member nodes, not the community id. A hop inside one child is not a self-edge. Multi-member children stay `data-shape="type"`. Click a non-leaf to enter its members. Not a vanilla `.inode` list and not the raw IR.
- Back: `#backBtn` / Map crumb pops one `{ kind: "bubble" }` frame (the same stack Slice `.run` pushes). Zoom-out past `k <= 0.42` pops that same frame. Deeper enter returns to the Type cut, then to community cards.
- Search: `#graphSearch` dims non-matches (`.bubble-card.dim`).
- Program chip: `#legend [data-prog]` — seed **bin main** (`programs: [{ kind: "bin", name: "main" }]`). Switch proof: [program-chips.md](program-chips.md). Union: [all-programs.md](all-programs.md).
- Story rail: `#storyRail` sits **outside** `.viewport` (Start → features → end).
- Layout: drag a card, `#reorgBtn` / `.reorg-btn` restores auto-layout.
- Fallback: `fallbackProgramBubbles()` emits one `{ id: "_program", label: programs[0].name }` card when clustering is empty **and** the graph still has nodes. Empty graph stays empty. That one-card paint is the degeneration this loop rejects.

## How to get to it (user POV)

1. Graphide → **Review**. Desk lands on Overview when a default run exists.
2. Click **Map** in the explorer workspaces (`#workspaces [data-ws="map"]`), or press `1`, or hit **Open map** (`.crumb-btn[data-ws="map"]` / `.stat-strip [data-ws="map"]`).
3. You should see a community flow titled along the lines of “Start → features → end — control-flow through communities…”, not a single START / `main` card.
4. Click a community to Enter. Members (or child bubbles) appear as shaped XYFlow nodes. Click a leaf for Evidence; click a non-leaf to enter deeper. Backspace / **Back** returns to the cards.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="map"]`.

`mode=explorer` posts `flowPayload()`: one root bubble `SolarSim` plus 12 children (`render`, `integration`, `origin`, …). `mapAltitudeBubbles()` returns those children when there is a single root — a real community map.

The self-review pass (`?live=1&probe=0&require=1`) repeats the Map click on **this
repo's** derived bubbles. Fail if that snap paints one START / `fallbackProgramBubbles()`
card. See [self-review.md](self-review.md). The explorer 17/17 gates stay on the
synthetic payload.

Assertions the driver owns:

- `document.querySelectorAll(".bubble-card").length >= 8`
- `document.querySelectorAll(".comm-node").length === 0` at map altitude
- `document.querySelectorAll(".react-flow__node").length === 0` at map altitude (`M2b` / `R5b`)
- not a lone `.bubble-card.start` (or a single card whose `.name` is `main` / `program`)
- `#legend` still names **bin main** after seed
- Story spine `b-integration → b-origin` is the derived Reads hop
  `n1 → n2` (`data-kind="Reads"`, `data-hop-from="n1"`,
  `data-hop-to="n2"`). Clicking it opens `#hopCard` naming
  `solarsim::ext` and `solarsim::as_str`, not the community ids
  (`M2d`, `verification/map-spine-hop.png`)
- screenshot of `#workspace` / Map is not a black frame
- After click `.bubble-card`: `#enterCanvas .react-flow__node` length `> 1` and `<= 24`, `#enterCanvas .vnode[data-shape]` present, the first community (`b-render`) has one lit `[data-shape="start"]` (`n0`) and no `[data-shape="end"]`. Off-tree members carry `data-slice-dist` (graph distance to that walk): `n12` is `1`, `n108` is `2`, `n1200` is `3`, and computed opacity falls as the distance rises (`E1p`, `verification/enter-distance.png`). Leaf click opens `#sourcePane`, screenshot `verification/enter-bubble.png` is not a black frame, no stamps written
- After click `.bubble-card[data-bubble="b-physics"]`: child communities `b-physics-a` / `b-physics-b` are `[data-shape="type"][data-leaf="0"]`. The one-member child `b-physics-c` is `n164` `[data-shape="endpoint"][data-leaf="1"]` (`E1l`). That Endpoint keeps at least one hop to `b-physics-a` or `b-physics-b`, and those communities stay `[data-shape="type"]` (`E1m`). The return hop stays inside `#enterCanvas` (a leftward step no longer clips above the host). Screenshot `verification/enter-back-hop.png`. Clicking the Reads hop drawn on `b-physics-a` → `n164` opens `#hopCard` for `n152` → `n164` (`SimulationData_152` → `SimulationScale_164`), not the community id (`E1n`, `verification/enter-member-hop.png`). Click `b-physics-a` shows member shapes (`data-leaf="1"`, a `fn`). Back returns to the Type cut, then to Map cards at `xy=0` / `data-lod="0"`. Screenshot `verification/enter-child-type.png` is not a black frame. Zoom-pop from that deeper enter lands on the same Type cut (`E1h`); Back from the same depth matches those ids, then Map `xy=0` / `data-lod="0"` (`E1i`). Screenshot `verification/enter-back-stack.png` is not a black frame
- After click `.bubble-card.end` (`b-ui`): one lit `[data-shape="end"]` on `n7` (`data-kind="Function"`, `data-leaf="1"`), no `[data-shape="start"]`. XYFlow stays inside `#enterCanvas`. Enter fit frames that community, so the lit end and the other members sit on the stage with no pan (`verification/enter-sink-end.png`, not a black frame). Back returns to Map cards at `xy=0` / `data-lod="0"` and posts no stamp (`E1j`, `E1k`)
- After Back: Map altitude is cards again and `xy=0`

Optional pins: `?mode=explorer&ws=map`, `?drill=1` (clicks the first `.bubble-card`).

## Gotchas

- Overview also embeds a CFG (`.vnode`). Map must be the **community** workspace, not that CFG.
- `.bubble-card.start` on a **populated** map is correct (walk start). Fail only when START is the *only* card.
- `check-map.js` asserts `renderBubbleMap` / `storyMapBubbles` strings exist. It cannot see a one-card paint. Drive the harness.
- The story spine is the derived tree hop that crosses those communities. Do not paint every step as Calls, and do not point the hop card at bubble ids. A second Map paint recycles `svg.comm-edges` and must keep those member ends (`RC1b`).
- Geometric zoom (`#zoomIn`) must not Enter a bubble (`J1` in the in-page suite). Click Enter is a different gesture. Zoom-out past `k <= 0.42` **pops one** enter frame (`popAltitudeFromZoom` → `goBack`). It does not clear a separate Map filter.
- Recycle: a second Map paint must keep `.stage` / `.viewport` when they already exist. See [canvas-recycle.md](canvas-recycle.md).
- Off-view: cards clearly outside `.stage` park (`data-offview`). See [map-offview.md](map-offview.md).
- Do not invent `data-testid` on cards. `[data-bubble]`, `.bubble-card`, `.bubble-card.start` already exist in `extension/media/src/graph/desk.js` (`renderBubbleMap`). React mounts `#canvas`; vanilla paint fills Map altitude. Map must stay `0` `.react-flow__node` (community LOD, cap 24). Enter-bubble XYFlow lives in `#enterCanvas` only — unmount when leaving enter / going back to Map. Slice / Overview CFG use `#sliceCanvas` XYFlow — that is not Map. Selectors: `#enterCanvas .react-flow__node`, `#enterCanvas .vnode[data-shape]`, `#enterCanvas .vnode.lit` / `[data-lit="1"]`, `#enterCanvas .vnode.grey` / `[data-lit="0"]`, `[data-leaf]`.
- Overlap is a fail: `#legend .leg` chips must not sit on each other or on `#workspaces`; `.bubble-card` boxes must not share screen rects; `.stage > .flow-title` must not cover a card. `#legend` and `#workspaces` are wrapping rows (`flex: 1 1 100%`). `.viewport` overflow stays `visible` — the camera world is larger than the pane; `.stage` clips. Opening Evidence must refit (ResizeObserver stays live). Narrow pane (720) must still show a grid (`spanX` of visible cards ≥ 160), not one stacked column.
