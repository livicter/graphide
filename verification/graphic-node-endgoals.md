# Graphic-node end goals

Locked end goal: Map community drill. Enter always shows shaped derived XYFlow members on `#enterCanvas`. Map stays community LOD `xy=0` / `data-lod=0`.

## Pass 1 (2026-09-29)

Base: `origin/main` `2154999` (Sequoia Day icons, #106). Herdr #113–#116 stayed parked.

Gap vs #64: Map click and Slice `.run` click both reach `enterBubble` → `renderInner` → `#enterCanvas`. Caps, lit/grey, and Function / Type / Endpoint / store shapes already hold. The hole was the walk ends. `sliceCanvasProps` stamped `steiner` `start` / `end`. `enterCanvasProps` dropped that field, so `shapeOf` never emitted `data-shape="start"` or `"end"` on Enter. Slice `.run` enter and Map community enter shared that miss.

Choice: one `steinerOfWalk` rule, used by Slice and by Enter. `renderEnterCanvas` forwards `steiner`. No new IR kind. No new shape. Agents still never stamp.

Proof target: `SR2b` (Slice `b-render` enter, one lit start on `n0`, no end) and `E1c` (Map first community, same start, viewport `data-lod=0`, XYFlow only inside `#enterCanvas`).

## Ranked backlog (Pass 2+)

1. Nested communities. `enterBubble` labels child bubbles `kind: "Type"`, so a non-leaf reads as a TYPE pill. Give them a real derived shape without a new IR kind, and prove deeper enter / back on both the Map path (`graphFilter.bubble`) and the Slice stack path.
2. One enter navigation. Map sets `graphFilter.bubble`. Slice `.run` pushes `{ kind: "bubble" }`. Deeper enter from a Map community then uses the stack while the filter still names the parent. Collapse to one back stack so zoom-pop and Back cannot disagree.
3. Walk end on its own community. `n7` lives outside `b-render`. Pass 1 asserts the absence there. A later pass should enter the sink community and require one lit `data-shape="end"`.
4. Decision shape. `shapeOf` already returns `decision` for lifecycle waiting. Enter has no branch producer. Do not invent one until the IR has a decision.
5. Out of scope until the end goal is closed: Herdr chrome, Wasm, continuous Map LOD, Mermaid, Archify, elkjs, MiniMap, Whoop / Graphify.
