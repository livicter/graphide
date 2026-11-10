# Deriver crate-root refs

A Review graph is honest when `use crate::steiner::steiner_tree`
joins the Function that lives in that crate's `src/steiner.rs`.
`module_fqn_from_path` prefixes workspace paths
(`crates/graphide-engine/src/stamp.rs` →
`crate::crates::graphide-engine::src::stamp`), but rust `crate::`
imports stay crate-root relative. `link` drops the unresolved ref.
Self-review of this checkout then showed graphide-engine with zero
cross-file edges: `stamp_from_graph` did not hop to `steiner_tree`,
`flow_dataflow`, or `build_flowchart`. Official single-crate desks
(`?dataflow=1` on `fixtures/demo`, paths already `src/…`) already
join `crate::bus::events`. This Feature rebases `crate::` refs at
extract time onto the file's crate `src/` prefix. Identity when the
review root is that crate. No new plugin crate. No new chrome row.
Not a title-band. Does not change `flows.toml` discovery.

## Sub-features

- `crate_root_fqn` / `rebase_crate_path` in the rust plugin: `src/bus.rs`
  stays `crate`; `crates/foo/src/stamp.rs` rebases `crate::steiner::steiner_tree`
  to `crate::crates::foo::src::steiner::steiner_tree`.
- `collect_use`, `resolve_name`, `qualify_type`, and `emit_endpoint_ref`
  apply that rebase so Calls, Imports, TypeUses, Publishes, and
  Subscribes join after `link`.
- Self-review (`?live=1`): `stamp_from_graph` Calls `steiner_tree`.
  Nested `fixtures/demo` regain Publishes / Subscribes on `events`.
- Official `?dataflow=1` still uses `crate::bus::events` and still
  paints publish / subscribe. Does **not** write `.graphide/stamps/`.

## How to get to it (user POV)

1. Graphide → **Review** this checkout (`?live=1`). Open **Map**, then
   the **graphide-engine** program chip.
2. `stamp_from_graph` hops to `steiner_tree`, `flow_dataflow`,
   `flow_sequence`, `flow_lifecycle`, and `build_flowchart`. Official
   Review of `fixtures/demo` is unchanged (`crate::bus::events`).

## Driving it with the harness

```
./target/debug/graphide review --root . --json --progress --no-parent \
  > extension/scripts/live-snap.json
```

Then:

```
extension/scripts/webview-harness.html?live=1&probe=0&require=1
```

CI verify self-derives `live-snap.json` via `loadSelfReviewSnap` after
`cargo build`. Do not add a dedicated workflow fixture step (OAuth
token lacks `workflow` scope).

Driver assertions (ids `DCR0`…):

- snap edge: `…stamp::stamp_from_graph` Calls `…steiner::steiner_tree`
- snap also keeps a live `fixtures/demo` Publishes to `…bus::events`
- program chip graphide-engine on `?live=1` Map is usable
- screenshot `verification/deriver-crate-root-refs.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- Official desks review a crate root whose paths start with `src/`.
  The rebase must be identity there (`crate::bus::events` stays).
- Do not invent package-name FQNs (`graphide_engine::…`) in this
  Feature; node FQNs stay repo-relative so multi-crate reviews do
  not collide.
- Nested `flows.toml` under `fixtures/` stays skipped when the
  Review root is the monorepo (intentional). This Feature only
  joins `crate::` refs.
- Self-review still requires `rust@`. Do not commit `live-snap.json`.
- Python `pkg.bus` vs `fixtures.python.pkg.bus` is a separate
  generic-lang follow-on, not this Feature.
