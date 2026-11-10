# Dataflow hop tip

## Sub-features

- DHT1 — Data-flow hops on `#dfCanvas .react-flow__edge` carry `data-from` / `data-to` / `data-kind`. No SVG `<title>`. Cursor is help. The hop tip host `#dataflowHopTip[data-dht="1"]` exists after bind.
- DHT2 — pointerenter on the Publishes hop (publish → events) shows `#dataflowHopTip` (`role="tooltip"`, `pointer-events: none`) with kind Publishes, those ends, and role chips source → store. Data-flow stays. No source pane.
- DHT3 — pointerleave hides the tip. Hovering a Data-flow vnode does not resurrect the hop tip (FQN `#tip` may still show).
- DHT4 — The tip does not intercept `#dfCanvas` vnode clicks; Data-flow stays; no source.
- DHT5 / DHT5b / DHT5c — screenshot `dataflow-hop-tip.png` is not a black frame; no `.graphide/stamps/` write; hover does not post peekSource / showHop / selectNode / enterRun.

## How to get to it (user POV)

Open Review on a folder with a data-subscription flow (or the fixtures/demo dataflow desk). Open **Data-flow**. The canvas paints source → store → sink: publish Publishes events, events Subscribes (reversed) into subscribe. Hover a hop. A floating tip names the verb, both ends, and each end’s already-computed data-flow role. Move off the hop and the tip disappears. Clicking the hop still steps the graph-only walk. This is not a new lane filter and not a title-band.

## Driving it with the harness

Stay on the already-open fixtures/demo dataflow desk after DSS5b Escape. Do not `page.goto` mid-block. `waitForFunction` until `#dfCanvas .react-flow__edge[data-kind="Publishes"]` exists. Dispatch `pointerenter` on that edge (TEH / SHT style). Assert tip fields (DHT2), leave hides (DHT3), a vnode stays clickable under the tip (DHT4), shot `verification/dataflow-hop-tip.png` (DHT5). Escape is not required to dismiss the tip.

## Gotchas

- Not a title-band and not an RDF role-mix clone. Chips use existing `data-df-role` / `classifyDfRole` values. Do not invent a walk/bus band.
- Not an enter or Map hop-tip sequel, and not a second Slice tip. This lives on `#dfCanvas`.
- XYFlow edges may be late. Bind after `stampXyFlowAttrs` plus double rAF. Tests `waitForFunction` and dispatch PointerEvent.
- Mutual exclusion with the vnode FQN `#tip`. Hover must not post peekSource / showHop / selectNode / enterRun and must not advance `dfCursor`. Tip `pointer-events: none`.
- Fixture node ids are numeric hashes, not `n0`. Select the Publishes hop by `data-kind`.
- This is the TEH affordance on Data-flow, not a DCG hop-SVG and not a hop-card / Evidence rewrite.
