# Lifecycle hop tip

## Sub-features

- LHT1 — Lifecycle transitions on `#lcCanvas .react-flow__edge` carry `data-from` / `data-to` / `data-kind`. No SVG `<title>`. Cursor is help. The hop tip host `#lifecycleHopTip[data-lht="1"]` exists after bind.
- LHT2 — pointerenter on the recover hop (broken → walking) shows `#lifecycleHopTip` (`role="tooltip"`, `pointer-events: none`) with event recover, those state names, and lane chips for Wait / retry (events) and Review (main). Lifecycle stays. No source pane.
- LHT3 — pointerleave hides the tip. Hovering a Lifecycle vnode does not resurrect the hop tip (FQN `#tip` may still show).
- LHT4 — The tip does not intercept `#lcCanvas` vnode clicks; Lifecycle stays; no source.
- LHT5 / LHT5b / LHT5c — screenshot `lifecycle-hop-tip.png` is not a black frame; no `.graphide/stamps/` write; hover does not post peekSource / showHop / selectNode / enterRun and does not advance `lcCursor`.

## How to get to it (user POV)

Open Review on a folder with a review machine (or the lifecycle-snap desk). Open **Lifecycle**. The canvas paints Proposed → Walking → Waiting, then stamp / skip / break / recover across the Review, Wait / retry, and Outcomes lanes. Hover a transition (for example recover, Broken → Walking). A floating tip names the event, both states, and each end’s already-computed phase lane. Move off the hop and the tip disappears. Clicking the hop still steps the graph-only walk. This is not a new event filter and not a title-band.

## Driving it with the harness

Stay on the already-open lifecycle-snap desk after LSS5b Escape. Do not `page.goto` mid-block. `waitForFunction` until `#lcCanvas .react-flow__edge[data-kind="recover"]` exists. Dispatch `pointerenter` on that edge (TEH / SHT / DHT style). Assert tip fields (LHT2), leave hides (LHT3), a vnode stays clickable under the tip (LHT4), shot `verification/lifecycle-hop-tip.png` (LHT5). Escape is not required to dismiss the tip.

## Gotchas

- Not a title-band and not an LSC event-mix clone. Do not invent a same-lane 1/5 band. Chips use existing `data-lc-lane` and lane labels from `deriveLifecycle`.
- Not an enter, Map, Slice, or Data-flow hop-tip sequel. This lives on `#lcCanvas`.
- Lifecycle vnodes often use `data-lc-id` (derived-node drops `data-id` when `lcType` is set). Look up ends by `data-lc-id`.
- XYFlow edges may be late. Bind after `stampXyFlowAttrs` plus double rAF. Call `scheduleLifecycleHopTipBind` after every `renderLifecycleCanvas` remount (LSS scrub input remounts directly — DHT / MEP lesson). Tests `waitForFunction` and dispatch PointerEvent.
- Mutual exclusion with the vnode FQN `#tip`. Hover must not post peekSource / showHop / selectNode / enterRun and must not advance `lcCursor`. Tip `pointer-events: none`.
- Select the recover hop by `data-kind`.
- This is the TEH affordance on Lifecycle, not a DCG hop-SVG and not a hop-card / Evidence rewrite.
