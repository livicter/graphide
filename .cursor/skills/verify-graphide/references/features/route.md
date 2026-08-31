# Route

Shortest derived directed path between two nodes already on the graph.
Not an agent-drawn route JSON and not blast radius. Pairing stays Graphide
IR: Function / Type / Endpoint, FQNs, spans. Hops are Calls / Reads /
Writes / Publishes / Subscribes only. Unreachable fails closed. The
journey is finite.

## Sub-features

- Graph-bar `#pathBtn` (PATH). `R` opens the probe. Reorganize stays the
  button — `R` is no longer layout.
- Endpoints: last two selected derived nodes, else the current Sequence /
  Data-flow hop, else the current flow's first Steiner interaction hop.
- Directed BFS on derived edges only. No TypeUses / Contains / Imports.
  No invented hops. Same node or a missing pair is not a route.
- Receipt `#routeReceipt` inside `#probeDock`: Overview / Prev / Play /
  Next plus `#routeHops .route-hop`. Play (`#routePlay`) walks hops and
  stops on the last. It does not loop.
- Canvas classes `.on-route` / `.route-dim` on existing `.vnode` /
  `.seq-part` / `.df-node`. Highlighted nodes ⊆ path nodes.
- Export may offer `#exportRouteShare` after a real route. Fail closed
  when unreachable. Canonical PNG/SVG still strip viewer state.
- Stamp / skip stay human. Route never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder that has a derived flow (`control-flow` or a sidecar
   such as `data-subscription`). Open Sequence or Map.
2. Press `R` or click **PATH**. Two hop endpoints (or the current hop)
   light the shortest directed path.
3. Play walks that path once. Unreachable stays empty — no extra cards.

The in-tree proof is `fixtures/demo`: `crate::sub::subscribe` Subscribes
`crate::bus::events`.

## Driving it with the harness

```
./target/debug/graphide review --root fixtures/demo --json --progress --no-parent \
  > extension/scripts/sequence-snap.json
```

Then:

```
extension/scripts/webview-harness.html?sequence=1&probe=0&require=1&ws=sequence
```

Press `R` (or `?route=1`). `window.__graphideRoute` holds the path.

Driver assertions:

- `#pathBtn` is on and `#routeReceipt` is visible
- `window.__graphideRoute.ok` and `hops.length >= 1`
- some hop is Subscribes subscribe → events
- highlighted `.on-route` nodes are only path nodes (`extra === 0`)
- `#routeNext` past the end stays on the last hop (no loop)
- screenshot `verification/route.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- Reach is authored/derived, not blast radius. Do not walk TypeUses.
- `R` is PATH. Reorganize is `#reorgBtn`. Do not steal `E` (Ego).
- Search stays `/` + `#graphSearch`. Do not rebuild Find.
- Do not add `data-component` / `data-testid`. `#pathBtn`, `#routeReceipt`,
  `#routeHops`, `.on-route`, `window.__graphideRoute` are the hooks.
- Do not vendor Archify's Node renderer. The path lights Graphide canvas.
