# Graphic-node end goals

Locked end goal: Map community drill. Enter always shows shaped derived XYFlow members on `#enterCanvas`. Map stays community LOD `xy=0` / `data-lod=0`.

## Pass 1 (2026-09-29)

Base: `origin/main` `2154999` (Sequoia Day icons, #106). Herdr #113–#116 stayed parked.

Gap vs #64: Map click and Slice `.run` click both reach `enterBubble` → `renderInner` → `#enterCanvas`. Caps, lit/grey, and Function / Type / Endpoint / store shapes already hold. The hole was the walk ends. `sliceCanvasProps` stamped `steiner` `start` / `end`. `enterCanvasProps` dropped that field, so `shapeOf` never emitted `data-shape="start"` or `"end"` on Enter. Slice `.run` enter and Map community enter shared that miss.

Choice: one `steinerOfWalk` rule, used by Slice and by Enter. `renderEnterCanvas` forwards `steiner`. No new IR kind. No new shape. Agents still never stamp.

Proof target: `SR2b` (Slice `b-render` enter, one lit start on `n0`, no end) and `E1c` (Map first community, same start, XYFlow only inside `#enterCanvas`). Map community LOD stays `xy=0` / `data-lod=0` on the card altitude. Enter follows the camera lod.

Proved on this Mac mini: `npm run verify` → `PASS verify-graphide · 445/445`, including `SR2b` and `E1c`. `verification/enter-bubble.png` luma 0.964 at 1440×900. Not a black frame. No `.graphide/stamps/` write.

## Pass 2 (2026-09-29)

Base: Pass 1 tip `10dff51` (`cursor/enter-walk-shapes-0171`, #117). Herdr #113–#116 stayed parked.

Gap vs #60 / #64: leaf enter already used the shape registry (Function / Type / Endpoint / store, plus Pass 1 `start` / `end`). A community with children never did. `enterBubble` stamped every child `kind: "Type"` and `enterCanvasProps` still ran `steinerOfWalk` on that bubble id, so a non-leaf could leave the Type rect. The explorer cut had no grandchildren, so the desk never showed the case.

Choice: non-leaves ask `shapeOf({ kind: "Type" })` and do not take walk start / end. That is the existing Type row (`data-shape="type"`). No new IR kind. No new shape. The extra `bubble` kind line is gone, so the node is the registry Type rect. Leaves keep Pass 1 `steinerOfWalk`. `b-physics` in the explorer fixture has `b-physics-a` and `b-physics-b`. Map click uses `graphFilter.bubble`. Slice `.run` uses the stack. Deeper enter still pushes `{ kind: "bubble" }`.

Proof target: `E1d`–`E1g` (Map Type cut, deeper member shapes, Back to the Type cut, Back to Map `xy=0` / `data-lod="0"`) and `SR2c`–`SR2e` (same Type cut on the Slice stack, deeper members, Back). `E1c` and `SR2b` still hold on `b-render`.

Proved on this Mac mini: `npm run verify` → `PASS verify-graphide · 453/453`, including `E1d`, `E1e`, `E1f`, `E1g`, `SR2c`, `SR2d`, `SR2e`, `E1c`, and `SR2b`. `verification/enter-child-type.png` luma 0.972 at 1440×900. Two Type rects (`physics-a`, `physics-b`), not a black frame. No `.graphide/stamps/` write.

## Pass 3 (2026-09-30)

Base: Pass 2 tip `2b9a79d` (`cursor/child-community-type-shape-45ae`, #118). Herdr #113–#116 stayed parked.

Gap: Map enter wrote `graphFilter.bubble`. Slice `.run` pushed `{ kind: "bubble" }`. Deeper enter from a Map community pushed the child on the stack while the filter still named the parent. Zoom-pop cleared the filter and jumped to Map. Back popped the stack and returned to the Type cut.

Choice: one back stack. Map click (`enterMapBubble`), story chips, and Slice `.run` all call `enterRun`, which pushes `{ kind: "bubble" }`. `renderCommunityGraph` no longer paints a second enter from the filter. `popAltitudeFromZoom` calls `goBack`. Each pop returns one frame: Type cut, then Map `xy=0` / `data-lod="0"` (Slice: the runs). No new IR kind. No new shape. Agents still never stamp. Map community LOD stays `xy=0`.

Proof target: `E1h` (zoom-pop from deeper Map enter lands on the Type cut, not Map) and `E1i` (Back from that depth lands on the same Type ids, then Map `xy=0` / `data-lod="0"`). `SR2f` is the same zoom-pop on the Slice stack. `E1f`, `E1g`, and `SR2e` still hold.

## Ranked backlog (Pass 4+)

1. Walk end on its own community. `n7` lives outside `b-render`. Pass 1 asserts the absence there. Enter the sink community and require one lit `data-shape="end"`.
2. Decision shape. `shapeOf` already returns `decision` for lifecycle waiting. Enter has no branch producer. Do not invent one until the IR has a decision.
3. Out of scope until the end goal is closed: Herdr chrome, Wasm, continuous Map LOD, Mermaid, Archify, elkjs, MiniMap, Whoop / Graphify.
