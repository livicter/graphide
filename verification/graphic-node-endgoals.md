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

Proved on this Mac mini: `npm run verify` → `PASS verify-graphide · 457/457`, including `E1h`, `E1i`, `SR2f`, `E1f`, `E1g`, and `SR2e`. `verification/enter-back-stack.png` luma 0.972 at 1440×900. Two Type rects (`physics-a`, `physics-b`) after zoom-pop, not a black frame. No `.graphide/stamps/` write.

## Pass 4 (2026-09-30)

Base: Pass 3 tip `f049a05` (`cursor/enter-back-stack-e009`, #119). Herdr #113–#116 stayed parked.

Gap: Pass 1 proved the walk start on `b-render` (`n0`) and the absence of `data-shape="end"` there. The walk sink is `n7`, in the story end card `b-ui`, outside that community. Enter never drove that card.

Choice: click `.bubble-card.end`. The leaf is already lit on the Steiner tree, so the existing `steinerOfWalk` mark becomes `end` and `shapeOf` on the DerivedNode registry emits `data-shape="end"`. Kind stays Function. No new IR kind. No new shape. Agents still never stamp. Map community LOD stays `xy=0` / `data-lod="0"`.

Proof target: `E1j` (one lit end on `n7`, no start, XYFlow only inside `#enterCanvas`) and `E1k` (Back to Map `xy=0` / `data-lod="0"`, no stamp). Enter follows the camera lod. `E1c` still holds on `b-render`.

Proved on this Mac mini: `npm run verify` → `PASS verify-graphide · 460/460`, including `E1j`, `E1k`, and `E1c`. `verification/enter-sink-end.png` luma 0.966 at 1440×900. One lit end pill (`END · Function` / `Body` on `n7`), not a black frame. No `.graphide/stamps/` write. That shot panned the pill into the stage: enter fit held zoom at 78% and the community was taller than the stage.

## Pass 5 (2026-09-30)

Base: Pass 4 tip `4436cdd` (`cursor/enter-sink-end-d0cf`, #120). Herdr #113–#116 stayed parked.

Gap: `fitChart` forced `k >= 0.78` while enter was open. The `b-ui` chart is taller than the stage at that hold, so `n7` and other members painted off stage until the camera panned. The 0.78 hold was there so one zoom-in would arm zoom-pop. Fit is not that gesture.

Choice: subtract the hold. The existing fit frames `.comm-wrap` / `#enterCanvas`. A tall community uses that scale, including when it sits under 0.78 and just under the 0.42 pop line. `zoomPopReady` stays false across the fit, so landing there does not pop. Pop is still a later zoom-out after `k > 0.8`. No new IR kind. No new shape. No new camera. Agents still never stamp. Map community LOD stays `xy=0` / `data-lod="0"`. Decision shape stays parked.

Proof target: `E1j` (one lit end on `n7`, every entered member inside the stage, zoom under 78%, no pan). `E1k` and `E1c` still hold. Zoom-pop (`E1h`, `SR2f`) zooms in until the arm, then out.

Proved on this Mac mini: `npm run verify` → `PASS verify-graphide · 460/460`, including `E1j`, `E1k`, `E1c`, `E1h`, and `SR2f`. `E1j` fit is `k=0.414` with all 24 members inside the stage and the lit end on `n7`. `verification/enter-sink-end.png` luma 0.966 at 1440×900. Not a black frame. No pan. No `.graphide/stamps/` write.

## Pass 6 (2026-09-30)

Base: Pass 5 tip `ee188f6` (`cursor/enter-fit-on-stage-8115`, #121). Herdr #113–#116 stayed parked.

Gap: a child bubble with no grandchildren and one member was still `kind: "Type"` / `data-shape="type"`. The live control-flow card's sibling of the walk is `MAX_FILE_BYTES`, an Endpoint. Enter painted a Type rect. The IR kind showed only after another click. 1861 singleton leaves in this checkout's review sat behind that rect. Multi-member children (`b-physics-a` / `b-physics-b`) were already the Type cut.

Choice: that one-member leaf is the derived node (`is_leaf`, real kind, `steinerOfWalk` if it is lit). Communities with more members stay Type. No new IR kind. No new shape. No new camera. Agents still never stamp. Map community LOD stays `xy=0` / `data-lod="0"`. Decision shape stays parked.

Proof target: `E1l` (`b-physics-c` enters as `n164` `[data-shape="endpoint"][data-leaf="1"]`, not as a Type id). `E1d` / `SR2c` / `E1f` still keep the two Type communities.

Proved on this Mac mini: `npm run verify` → `PASS verify-graphide · 461/461`, including `E1l`, `E1d`, `E1f`, and `SR2c`. `verification/enter-child-type.png` luma 0.972 at 1440×900. Two Type rects (`physics-a`, `physics-b`) and one Endpoint stadium (`SimulationScale_164`), not a black frame. No `.graphide/stamps/` write.

## Ranked backlog (Pass 7+)

1. Decision shape. `shapeOf` already returns `decision` for lifecycle waiting. Enter has no branch producer. Do not invent one until the IR has a decision.
2. Out of scope until the end goal is closed: Herdr chrome, Wasm, continuous Map LOD, Mermaid, Archify, elkjs, MiniMap, Whoop / Graphify.
