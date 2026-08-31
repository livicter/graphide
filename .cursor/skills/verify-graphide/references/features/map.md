# Map

Community cut of the reviewed program. Not a function dump and not a lone START card.

## Sub-features

- Workspace tab `#workspaces [data-ws="map"]` (key `1`).
- Community boxes `.bubble-card` with `.name`, `.meta`, optional `.role`, member peek `.bubble-card .members`.
- Story pin: first hop community gets `.bubble-card.start` (CSS outline); last gets `.bubble-card.end`. Off-path cards get `.bubble-card.off`.
- Enter a bubble: click `.bubble-card` → labeled members `.comm-node` (capped, not a 160-node pile).
- Back: `#backBtn` pops Enter and returns to community cards.
- Search: `#graphSearch` dims non-matches (`.bubble-card.dim`).
- Program chip: `#legend [data-prog]` — seed **bin main** (`programs: [{ kind: "bin", name: "main" }]`).
- Story rail: `#storyRail` sits **outside** `.viewport` (Start → features → end).
- Layout: drag a card, `#reorgBtn` / `.reorg-btn` restores auto-layout.
- Fallback: `fallbackProgramBubbles()` emits one `{ id: "_program", label: programs[0].name }` card when clustering is empty. That is the degeneration this loop rejects.

## How to get to it (user POV)

1. Graphide → **Review**. Desk lands on Overview when a default run exists.
2. Click **Map** in the explorer workspaces (`#workspaces [data-ws="map"]`), or press `1`, or hit **Open map** (`.crumb-btn[data-ws="map"]` / `.stat-strip [data-ws="map"]`).
3. You should see a community flow titled along the lines of “Start → features → end — control-flow through communities…”, not a single START / `main` card.
4. Click a community to Enter. Backspace / **Back** returns to the cards.

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
- not a lone `.bubble-card.start` (or a single card whose `.name` is `main` / `program`)
- `#legend` still names **bin main** after seed
- screenshot of `#workspace` / Map is not a black frame

Optional pins: `?mode=explorer&ws=map`, `?drill=1` (clicks the first `.bubble-card`).

## Gotchas

- Overview also embeds a CFG (`.vnode`). Map must be the **community** workspace, not that CFG.
- `.bubble-card.start` on a **populated** map is correct (walk start). Fail only when START is the *only* card.
- `check-map.js` asserts `renderBubbleMap` / `storyMapBubbles` strings exist. It cannot see a one-card paint. Drive the harness.
- Geometric zoom (`#zoomIn`) must not Enter a bubble (`J1` in the in-page suite). Click Enter is a different gesture.
- Do not invent `data-testid` on cards. `[data-bubble]`, `.bubble-card`, `.bubble-card.start` already exist in `extension/media/src/graph/desk.js` (`renderBubbleMap`). React mounts `#canvas`; vanilla paint fills Map. Map must stay `0` `.react-flow__node` (community LOD, cap 24). Slice / Overview CFG use `#sliceCanvas` XYFlow — that is not Map.
