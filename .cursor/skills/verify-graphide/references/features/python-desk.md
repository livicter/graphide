# Python desk

A language is real when the Review desk paints it, not when the deriver
only compiles in. This map proves the existing Python query plugin
(`crates/graphide-plugin/src/langs.rs` `PYTHON`,
`crates/graphide-plugin/src/query.rs` Endpoint / Publishes / Subscribes)
on a tiny in-tree fixture. No new plugin crate. No new chrome row.

## Sub-features

- Fixture `fixtures/python`: `pkg/bus.py` publishes `pkg.bus.events`;
  `pkg/sub.py` subscribes that bus. Same data-subscription spirit as
  `fixtures/demo`, Python FQNs.
- Named flow `fixtures/python/flows.toml` `data-subscription` hits
  `pkg.sub.subscribe` and `pkg.bus.events`. Self-review of this checkout
  still skips `fixtures/` sidecars — do not stamp that file.
- CLI: `graphide review --root fixtures/python --json --progress --no-parent`
  writes a `ReviewSnapshot` whose `plugin` is `python@0.1.0`.
- Snapshot file: `extension/scripts/python-snap.json` (gitignored).
- Desk: `?python=1&probe=0&require=1`. `window.__graphidePython === true`.
  Data-flow paints shaped Source / Store / Sink (`.df-node[data-df-role]`,
  `#dfCanvas .vnode[data-shape]`). Map stays community LOD (`.bubble-card`,
  `xy=0`) — not a raw IR dump and not the synthetic explorer fixture.
- Does **not** write `.graphide/stamps/`. Does **not** replace rust
  self-review, RC* / DA* / map-offview / panel-timeout, or chrome 17/17.

## How to get to it (user POV)

1. Graphide → **Review** on a Python folder with a subscribe / publish
   bus (or this fixture). The CLI is the same compiled-in `python@0.1.0`
   deriver `plugins --check` already smokes.
2. **Data-flow** shows publish → events → subscribe. **Map** shows
   community cards, not a function list.

## Driving it with the harness

```
./target/debug/graphide review --root fixtures/python --json --progress --no-parent \
  > extension/scripts/python-snap.json
```

Then:

```
extension/scripts/webview-harness.html?python=1&probe=0&require=1&ws=dataflow
```

`python=1&require=1` fetches `python-snap.json` and **fails closed** if it
is missing or not a ReviewSnapshot (`window.__graphidePython`). Do not
point this gate at `?live=1` (this checkout is Rust) or the explorer
fixture.

Driver assertions (ids `PY0`…):

- snap `plugin` matches `python@`; nodes, edges, files all `> 0`; a node
  span ends in `.py`
- named flow `data-subscription` has a Steiner tree and subscribe / events
- a flow's `dataflow` has Source and Sink hops
- `#workspaces [data-ws="dataflow"]` is on
- `#dfCanvas .df-node[data-df-role="source"]` and `sink` length `>= 1`
- some hop or node text matches `subscribe` / `publish` / `events`
- `#dfCanvas .react-flow__node` / `.vnode[data-shape]` — shaped, not raw IR
- Map click: `.bubble-card` `>= 2`, `.react-flow__node` `=== 0`
- screenshot `verification/python-desk.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- Self-review stays `--no-parent` on this checkout and still requires
  `rust@`. This prove is `fixtures/python` only.
- Sequence on this slice may be empty (Steiner is the Imports /
  Subscribes join). Data-flow is the surface. Do not add Sequence /
  enterRun / Slice recycle unless they fall out of a later prove.
- `?python=1` without `require=1` can still fall back to the synthetic
  payload. The driver always passes `require=1`.
- Do not add `data-testid`. `#dfCanvas`, `[data-df-role]`, `.bubble-card`,
  `[data-ws="dataflow"]` are the product hooks.
- Do not invent a second chrome row. Do not add a Python plugin crate.
