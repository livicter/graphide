# Deriver package refs

A Review graph is honest when `from pkg.bus import events` joins the
Endpoint that lives in that package. Official `?python=1` (root
`fixtures/python`, paths `pkg/sub.py`) already emits `pkg.bus.events`
Subscribes / Imports / TypeUses. Self-review module FQNs include the
repo prefix (`fixtures.python.pkg.sub`), but `import_target` kept
`pkg.bus.events`, so `link` dropped the cross-file hops. Live python
then had only same-file Publishes (7 edges vs official 11). JS/TS/Go/C/CPP
already join because they use relative `./bus` imports. This Feature
rebases a non-relative package import onto the file's workspace prefix
when the module FQN contains that package as a path segment. Identity
when the module is already rooted at the package (`pkg.sub`). Official
rust `src/…` desks stay `crate::bus::events`. No new plugin crate. No
new chrome row. Not a title-band. Does not change `flows.toml` discovery.

## Sub-features

- `package_workspace_prefix` / `rebase_package_path` in the generic
  query plugin: `pkg/sub.py` stays `pkg.bus.events`;
  `fixtures/python/pkg/sub.py` rebases to
  `fixtures.python.pkg.bus.events`. Stdlib names that are not a path
  segment of the module (`import os`) are not prefixed.
- `import_target` applies that rebase so Subscribes, Imports, and
  TypeUses join after `link`.
- Self-review (`?live=1`): `fixtures.python.pkg.sub.subscribe`
  Subscribes `fixtures.python.pkg.bus.events`. Official `?python=1`
  still uses `pkg.bus.events`. Does **not** write `.graphide/stamps/`.

## How to get to it (user POV)

1. Graphide → **Review** this checkout (`?live=1`). The nested Python
   fixture `subscribe` hops to `events`. Official Review of
   `fixtures/python` is unchanged (`pkg.bus.events`). Official rust
   `?dataflow=1` still paints `crate::bus::events`.

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

Driver assertions (ids `DPR0`…):

- snap edge: `fixtures.python.pkg.sub.subscribe` Subscribes
  `fixtures.python.pkg.bus.events`
- official `?python=1` still reports `pkg.bus.events` (existing PY0)
- screenshot `verification/deriver-package-refs.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- Official python desks use paths that already start with `pkg/`.
  The rebase must be identity there.
- Do not invent a new language plugin crate. Do not change the rust
  plugin or official `crate::bus::events` FQNs.
- Nested `flows.toml` under `fixtures/` stays skipped when the Review
  root is the monorepo. This Feature only joins package imports.
- Self-review still requires `rust@` plus the compiled-in language
  plugins. Do not commit `live-snap.json`.
