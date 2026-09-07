# Flow hints

A present `flows.toml` sidecar lands on the Review desk as a **named
flow**. Hits are FQNs only. The deriver builds the Steiner tree.
Not an agent-drawn diagram, not a second hint UI, and not a default
`overview` / `control-flow` stand-in.

## Sub-features

- Sidecar `[[flow]] name` + `hits` via `parse_flows_toml` /
  `hints_from_toml` (`crates/graphide-engine/src/hints.rs`,
  `review.rs`). Empty hints fall back to `default_review_hints`.
  Present hints keep the TOML names.
- Desk chips `#tabs .tab[data-flow]` from `renderTabs` in
  `extension/media/src/graph/desk.js`. The demo name is
  `data-subscription`.
- In-tree proof: `fixtures/demo/flows.toml` hits
  `crate::sub::subscribe` and `crate::bus::events`. Sequence /
  Data-flow / Lifecycle already derive that slice.
- Stamp / skip stay human. Reading a named flow never posts
  `{ type: "stamp" }` and never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder that has `flows.toml` (demo: name
   `data-subscription`). The desk lands on Overview.
2. Open **Data-flow** (or Sequence). The flow chip in `#tabs`
   shows the sidecar name.
3. The stage is the derived Steiner (nodes / hops / XYFlow), not
   a hand-drawn picture of the hits.
4. Stamp and Skip are still the human attestation. A hint is a
   hit list, not an approval.

This PR proves the happy path: a **present** hint is visible.
Under-hint suggestion UX is out of scope.

## Driving it with the harness

```
./target/debug/graphide review --root fixtures/demo --json --progress --no-parent \
  > extension/scripts/dataflow-snap.json
```

Then:

```
extension/scripts/webview-harness.html?dataflow=1&probe=0&require=1&ws=dataflow
```

`dataflow=1&require=1` fetches `dataflow-snap.json` and **fails
closed** if it is missing or not a ReviewSnapshot. Do not point
this gate at the synthetic explorer fixture.

Driver assertions:

- snap has a flow named `data-subscription` whose `hits` are the
  TOML FQNs and whose `tree.nodes` / `tree.edges` are non-empty
- `#tabs .tab[data-flow="data-subscription"]` is on the desk
  (text is that name; the chip is `.on`)
- `#dfCanvas .df-node` and `#dfHops .df-hop` are present (Steiner
  pipeline, not an empty named stub)
- screenshot `verification/flow-hints.png` is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty
- Map is not raised (`xy=0`) if the drive touches Map — this
  gate stays on Data-flow

## Gotchas

- Hints are hit lists. Do not invent IR kinds or an agent-drawn
  flow JSON. The deriver builds the Steiner tree.
- When `input.hints` is empty, defaults apply (`overview` /
  `control-flow`). This gate requires the sidecar name.
- `load_hints` skips `fixtures/` / `tests/` sidecars unless the
  review root **is** that folder (`rel == "flows.toml"`). Drive
  `--root fixtures/demo`, not the repo root.
- Do not add `data-testid`. `#tabs .tab[data-flow]`,
  `#dfCanvas .df-node`, `#dfHops .df-hop` are the product hooks.
- Agents never stamp. Do not click `#stampBtn` to “cover” the
  hint. Do not flip verify `runs-on` off `ubuntu-latest`.
