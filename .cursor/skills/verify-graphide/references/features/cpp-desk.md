# C++ desk

A language is real when the Review desk paints it, not when the deriver
only compiles in. This map proves the existing C++ query plugin
(`crates/graphide-plugin/src/langs.rs` `CPP`,
`crates/graphide-plugin/src/query.rs` Endpoint / Publishes / Subscribes)
on a tiny in-tree fixture. No new plugin crate. No new chrome row.

## Sub-features

- Fixture `fixtures/cpp`: `pkg/bus.cpp` publishes `pkg::bus::events`;
  `pkg/sub.cpp` subscribes that bus. Same data-subscription spirit as
  `fixtures/c`, C++ FQNs (separator `::`).
- Named flow `fixtures/cpp/flows.toml` `data-subscription` hits
  `pkg::sub::subscribe` and `pkg::bus::events`. Self-review of this
  checkout still skips `fixtures/` sidecars — do not stamp that file.
- CLI: `graphide review --root fixtures/cpp --json --progress --no-parent`
  writes a `ReviewSnapshot` whose `plugin` is `cpp@0.1.0`.
- Snapshot file: `extension/scripts/cpp-snap.json` (gitignored).
- Desk: `?cpp=1&probe=0&require=1`. `window.__graphideCpp === true`.
  Data-flow paints shaped Source / Store / Sink (`.df-node[data-df-role]`,
  `#dfCanvas .vnode[data-shape]`). Map stays community LOD (`.bubble-card`,
  `xy=0`) — not a raw IR dump and not the synthetic explorer fixture.
- Does **not** write `.graphide/stamps/`. Does **not** replace rust
  self-review, RC* / DA* / map-offview / panel-timeout, Python desk,
  JavaScript desk, TypeScript desk, Go desk, C desk, or chrome 17/17.

## How to get to it (user POV)

1. Graphide → **Review** on a C++ folder with a subscribe / publish
   bus (or this fixture). The CLI is the same compiled-in `cpp@0.1.0`
   deriver `plugins --check` already smokes.
2. **Data-flow** shows publish → events → subscribe. **Map** shows
   community cards, not a function list.

## Driving it with the harness

```
./target/debug/graphide review --root fixtures/cpp --json --progress --no-parent \
  > extension/scripts/cpp-snap.json
```

Then:

```
extension/scripts/webview-harness.html?cpp=1&probe=0&require=1&ws=dataflow
```

`cpp=1&require=1` fetches `cpp-snap.json` and **fails closed** if it is
missing or not a ReviewSnapshot (`window.__graphideCpp`). Do not
point this gate at `?live=1` (this checkout is Rust), `?c=1` (the C
desk), or the explorer fixture.

Driver assertions (ids `CPP0`…):

- snap `plugin` matches `cpp@`; nodes, edges, files all `> 0`; a node
  span ends in `.cpp`
- named flow `data-subscription` has a Steiner tree and subscribe / events
- a flow's `dataflow` has Source and Sink hops
- `#workspaces [data-ws="dataflow"]` is on
- `#dfCanvas .df-node[data-df-role="source"]` and `sink` length `>= 1`
- some hop or node text matches `subscribe` / `publish` / `events`
- `#dfCanvas .react-flow__node` / `.vnode[data-shape]` — shaped, not raw IR
- Map click: `.bubble-card` `>= 2`, `.react-flow__node` `=== 0`
- screenshot `verification/cpp-desk.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- Self-review stays `--no-parent` on this checkout and still requires
  `rust@`. This prove is `fixtures/cpp` only.
- Sequence on this slice may be empty (Steiner is the Imports /
  Subscribes join). Data-flow is the surface. Do not add Sequence /
  enterRun / Slice recycle unless they fall out of a later prove.
- C++ FQNs use `::` (`pkg::bus::events`, `pkg::sub::subscribe`), not
  `.`. `pkg/sub.cpp` uses `#include "./bus/events.cpp"` so the
  same-file extract can resolve `events` to `pkg::bus::events`
  (`query.rs` emits same-file refs only). Function names stay
  lowercase `publish` / `subscribe` because the pub/sub heuristic is
  case-sensitive (`contains("publish")`).
- `?cpp=1` is distinct from `?c=1` (the C desk). Without `require=1`
  the harness can still fall back to the synthetic payload. The
  driver always passes `require=1`.
- Plugin checks must use `cpp@`, not a bare `c@`.
- Do not add `data-testid`. `#dfCanvas`, `[data-df-role]`, `.bubble-card`,
  `[data-ws="dataflow"]` are the product hooks.
- Do not invent a second chrome row. Do not add a C++ plugin crate.
- CI verify self-derives `extension/scripts/cpp-snap.json` via
  `loadCppSnap` after `cargo build` (same helper as a missing local
  snap). Do not add a dedicated workflow fixture step (OAuth token
  lacks `workflow` scope).
