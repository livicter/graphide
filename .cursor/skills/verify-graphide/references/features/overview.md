# Overview

Default Review landing. A list/stage surface: the default-run control-flow
graph plus snapshot stats. Not a community Map and not a second XYFlow
product. Stamp / skip stay human.

## Sub-features

- Workspace tab `#workspaces [data-ws="overview"]` (key `6`). Review lands
  here when `defaultRunFlow()` finds `control-flow` or `overview` (else Map).
- Feature path `.feature-path` (“Start → features → end”) with Play / Prev /
  Next (`#pathWalkBtn`). Same story rail as Map, not a new chrome row.
- Default run stage: `renderDefaultCfg()` titles **Default run ·
  `flow.name` — control-flow graph**. `#sliceCanvas` mounts the Steiner
  tree as XYFlow (`.react-flow__node`, `.vnode[data-shape]`). Empty copy:
  “No control-flow yet. Review a repo — default run uses derived entries.”
- Stat strip `.stat-strip`: nodes, hops, communities, programs, uncovered /
  changed, flows. **Open map** is `.crumb-btn[data-ws="map"]` (also
  `.stat-strip [data-ws="map"]`).
- Community cards `.expl-card[data-ws="map"]` and highest-degree
  `.expl-card[data-id]` sit **below** the CFG (`renderDefaultCfg()` before
  the Communities heading).
- Overview is **not** a `LIST_WORKSPACES` key. `#ledgerPane` stays. Map
  stays vanilla community LOD (`xy=0`).

## How to get to it (user POV)

1. Graphide → **Review**. The desk lands on Overview when a default run
   exists.
2. You should see the control-flow stage, Open map, and program chips — not
   a lone START card and not a raw-IR dump.
3. **Open map** / community cards open Map. A highest-degree card opens
   Lineage. Stamp and Skip stay the human attestation.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

`mode=explorer` posts `flowPayload()` with `control-flow` (8-node Steiner)
and `overview`. First paint lands on Overview (`defaultLandingWorkspace`).
Optional pin: `?ws=overview`.

Self-review (`?live=1&probe=0&require=1`) also lands on Overview when this
checkout’s snap has `control-flow`. The dedicated screenshot is the
explorer desk.

Driver assertions:

- `#workspaces [data-ws="overview"]` is on
- Default-run stage is present (`.stage`, `#sliceCanvas`)
- `#sliceCanvas .react-flow__node` length `> 1` with `data-shape` (do not
  regress the CFG mount)
- **Open map** (`.crumb-btn[data-ws="map"]` / `.stat-strip [data-ws="map"]`)
  and `#legend [data-prog]` when the product shows them
- screenshot `verification/overview.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- Overview embeds Slice’s `#sliceCanvas`. That is not Map. After leaving
  Overview, `unmountAllReviewCanvases()` runs. Map must stay `xy=0`.
- `LIST_WORKSPACES` hides the object rail on decisions / registry /
  timeline / delta / sequence / dataflow / lifecycle — not on Overview.
- Do not add `data-testid`. `[data-ws="overview"]`, `#sliceCanvas`,
  `.stat-strip`, `.crumb-btn[data-ws="map"]` are the product hooks.
- Do not XYFlow the list workspaces. Do not React-mount Map raw IR.
- Do not stamp. Overview never writes `.graphide/stamps/`.
