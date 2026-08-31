# Lifecycle

States, events, retries/waits, and terminal outcomes along one flow's
derived review machine. Not an agent-drawn lifecycle JSON. The rust plugin
does **not** emit match-arm / enum-variant edges (`enum_item` is a Type).
This reading does not invent those. Pairing stays Graphide IR: the review
machine plus plugin-visible Type / Endpoint nodes already on the Steiner.

**Derived:** proposed → walking hops → waiting → stamped | skipped, plus
broken with a real recover transition back to walking. Walking's hop count
comes from the Steiner. `#lcEnds` lists Type / Endpoint on that tree
(demo: `crate::bus::events`).

**Not derived:** AST state machines, enum variants, match arms. Do not fake
them.

## Sub-features

- Workspace tab `#workspaces [data-ws="lifecycle"]`. Same explorer nav row
  as Data-flow — not a second chrome row.
- Phase lanes `#lcLanes .lc-lane[data-lc-lane]` (`main` / `events` /
  `terminal`). States `#lcCanvas .lc-state` with `data-lc-id` /
  `data-lc-type` (`start` / `active` / `waiting` / `success` / `neutral` /
  `failure`) / `data-lc-lane` / `data-lc-col`.
- Canvas `#lcCanvas` mounts XYFlow (`#lcCanvas .react-flow`, `.react-flow__node`)
  for the review machine. Lane strip `#lcLanes` and event list `#lcTrans`
  stay HTML. Plugin ends `#lcEnds` stay a list.
- Ordered events `#lcTrans .lc-trans` with `data-lc-i`, `data-from`,
  `data-to`, `data-lc-event` (`play` / `wait` / `stamp` / `skip` / `break`
  / `recover`). Recover is `broken → walking`, not a card that says retry.
- Plugin ends `#lcEnds .lc-end` with `data-fqn` / `data-kind` / `data-id`.
- Play strip `#lcReview`: `#lcOverview` · `#lcPrev` · `#lcPlay` ·
  `#lcNext` · `#lcStatus`.
- Play (`#lcPlay` / `P` on this workspace) walks events finitely. At the
  last event it stops. It does not loop. `[` / `]` step.
- Engine: `flow_lifecycle` reads the current flow's Steiner. Stamp / skip
  stay human. Lifecycle never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder that has a derived flow (`control-flow` or a sidecar such
   as `data-subscription`). The desk lands on Overview.
2. Click **Lifecycle** (`#workspaces [data-ws="lifecycle"]`).
3. You should see Review / Wait / Outcomes columns, an ordered event list,
   and Play / Prev / Next. Selecting an event highlights that transition.
4. Play walks the list once. Stamp and Skip are still the human attestation
   for flows — they are not this walk.

The in-tree proof is `fixtures/demo`: the same `data-subscription` slice as
`first_slice.rs`. Recover is broken → walking. `crate::bus::events` is a
plugin-visible Endpoint.

## Driving it with the harness

```
./target/debug/graphide review --root fixtures/demo --json --progress --no-parent \
  > extension/scripts/lifecycle-snap.json
```

Then:

```
extension/scripts/webview-harness.html?lifecycle=1&probe=0&require=1&ws=lifecycle
```

`lifecycle=1&require=1` fetches `lifecycle-snap.json` and **fails closed** if
it is missing or not a ReviewSnapshot (`window.__graphideLifecycle`). Do not
point this gate at the synthetic explorer fixture.

Driver assertions:

- `#workspaces [data-ws="lifecycle"]` is on
- `#lcCanvas .lc-state` includes proposed / walking / broken
- `#lcTrans .lc-trans` length `>= 1` and events are ordered (`data-lc-i`)
- some transition is `broken → walking` (`data-lc-event="recover"`)
- `#lcPlay` / `#lcPrev` / `#lcNext` / `#lcOverview` / `#lcCanvas` exist
- `#lcCanvas .react-flow__node` length `> 1` and `<= 24`
- stepping Next past the end stays on the last `data-lc-i` (no loop)
- screenshot `verification/lifecycle.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- The machine is the review lifecycle, not Archify authored state ids. Do
  not invent match/enum topology the plugin does not emit.
- Stamp / skip stay human-only. Play walking `stamp` / `skip` events does
  not write `.graphide/stamps/`.
- Self-review stays `--no-parent` on this checkout. Lifecycle CI uses
  `fixtures/demo` so shallow Actions clones do not flake.
- `P` on Lifecycle walks events. `P` on Sequence still walks callers. `P`
  on Data-flow still walks hops. `P` on Delta still walks facts. `P` on
  Map / Overview still walks the story rail.
- Do not add `data-component` / `data-testid`. `#lcTrans`, `#lcCanvas`,
  `[data-ws="lifecycle"]`, `.lc-state[data-lc-type]`, `#lcCanvas .react-flow__node`
  are the product hooks.
- Do not vendor Archify's Node renderer. XYFlow nodes reuse `.lc-state.vnode`
  from `main.css`.
