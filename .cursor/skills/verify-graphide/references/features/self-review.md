# Self-review

Compile Graphide and Review **this** checkout. The `verify` job gates on that
derived snapshot, then paints the Review desk from it.

## Sub-features

- CLI: `cargo build -p graphide-cli` → `./target/debug/graphide`.
- `graphide plugins --check` smokes compiled-in derivers.
- `graphide review --root <checkout> --json --progress --no-parent` writes a
  `ReviewSnapshot` (plugin, graph, bubbles, flows, programs, stats).
- Snapshot file: `extension/scripts/live-snap.json` (gitignored). The harness
  fetches `./live-snap.json` and posts `{ type: "programs", ...snap }`.
- Structural gate (`node scripts/verify-graphide.js --assert-snap`):
  - `graph.nodes`, `graph.edges`, `stats.files` all `> 0`
  - `plugin` matches `rust@`
  - at least one node span ends in `.rs`
  - Map altitude (children of the single root, else roots) has ≥ 2 communities
  - snapshot is not the synthetic explorer fixture (2050 / 4568 + SolarSim names)
- Desk drive: `?live=1&probe=0&require=1`. `window.__graphideLive === true`.
  Screenshot `verification/self-review.png` (not a black frame).
- Does **not** write `.graphide/stamps/`. Does **not** replace the explorer
  17/17 chrome gates.

## How to get to it (user POV)

1. In the product: Graphide → **Review** on the `livicter/graphide` folder.
   The CLI is the same binary CI builds.
2. In CI / doctor: compile, review this checkout, then open the harness on the
   written snap. Map should show Graphide crate communities, not one START card
   and not the explorer names (`render`, `integration`, `origin`, …).

## Driving it with the harness

```
cargo build -p graphide-cli
./target/debug/graphide review --root "$PWD" --json --progress --no-parent \
  > extension/scripts/live-snap.json
npm run verify
```

The driver:

1. Loads the snap (or derives it if `target/debug/graphide` exists and the file
   is missing).
2. Fails immediately on a broken / empty graph (`--assert-snap` is that gate
   without Playwright).
3. Keeps the explorer 17/17 pass on `?mode=explorer`.
4. Opens `?live=1&probe=0&require=1`, waits for `window.__graphideLive`, clicks
   `#workspaces [data-ws="map"]`, asserts community cards on **this** repo,
   screenshots `self-review.png`.

If the desk cannot be driven, the job fails and the report says why
(`__graphideLiveError`, missing file, paint timeout). It must not pass on a
synthetic fallback.

## Gotchas

- Default Actions `checkout` is `fetch-depth: 1`. `HEAD^` is often missing.
  Use `--no-parent` so coverage does not flake. Parent extract is optional;
  derive still runs.
- `?live=1` without `require=1` still swallows a missing snap and posts the
  explorer fixture. That is not a self-review. The driver always passes
  `require=1`.
- `?suite=live` asserts SolarSim-scale numbers (349 / 1222 / 57). Do not point
  CI at that suite for this repo.
- Program chips here are `graphide-cli` / crate libs, not explorer `bin main`.
- Do not stamp. `graphide stamp` and `writeStamp()` are human-only.
- Do not commit `live-snap.json`. Commit `verification/self-review.png` when
  the desk was actually driven.
