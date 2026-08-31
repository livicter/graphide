---
name: verify-graphide
description: >-
  Prove Graphide Review-desk changes on the running webview harness, not on a
  written story. Load for correctness after any Review UI, engine, or extension
  change. Doctor checklist lives here — there is no separate verify binary.
---

# Verify Graphide

This skill is **correctness** (does it work). The design-loop pack is **goodness**
(would you ship the surface). Load both when a change is user-facing. Do not
substitute a walkthrough for a green `verify` job.

Graphide is a VS Code / Cursor webview (`extension/`), not a `cargo run` GUI
and not a wasm app. The headless path is already in-tree:

- `extension/scripts/webview-harness.html` + `webview-harness.js`
- host stub `acquireVsCodeApi` records `window.__vscodePosts`
- static CSS/string gate: `node extension/scripts/check-map.js`

CI **compiles** `graphide-cli` and runs **`graphide review --root <this checkout>`**.
The JSON snapshot is written to `extension/scripts/live-snap.json` (gitignored).
The driver asserts a real graph, then paints the Review desk from that snap
(`?live=1&probe=0&require=1`). A missing or empty snap **fails the job**. Do not
treat a prose dump as a green verify.

`?suite=live` is the older SolarSim checklist. It is not the self-review gate.
`require=1` must **not** fall back to the synthetic explorer fixture.

P-Stack (`/add-plugin pstack`) is local only. Cloud agents inherit **committed**
skills. Do not add P-Stack files.

## Doctor

Run from the repo root. Every line must succeed before you claim the desk works.

1. **Toolchain** — `rustc --version` is 1.85.x (`rust-toolchain.toml`). Node 20+
   is on PATH. No wasm target.
2. **Engine** — `cargo test --workspace` (includes
   `crates/graphide-engine/tests/panic_free.rs`). Panic-free stays a CI gate.
3. **Compile Graphide** — `cargo build -p graphide-cli`. The `verify` job must
   produce `./target/debug/graphide`.
4. **Plugins** — `./target/debug/graphide plugins --check`. A broken compiled-in
   deriver fails here.
5. **Self-review** — derive this checkout (not SolarSim, not the explorer
   fixture):

   ```
   ./target/debug/graphide review --root "$PWD" --json --progress --no-parent \
     > extension/scripts/live-snap.json
   node scripts/verify-graphide.js --assert-snap
   ```

   `--no-parent` is the reliable Actions option: the default checkout is shallow
   and often lacks `HEAD^`. The CLI would skip a missing parent anyway; being
   explicit avoids flake. Parent coverage is optional and not this gate.
   `--assert-snap` must fail on a broken deriver or empty graph (nodes, edges,
   files all `> 0`; `rust@` in `plugin`; Map altitude is not a lone START).
6. **Architecture Delta fixture** — derive a parent pair that is known to
   differ (not git `HEAD^`):

   ```
   ./target/debug/graphide review --root fixtures/demo --parent fixtures/demo-parent \
     --json --progress > extension/scripts/delta-snap.json
   ```

   The snap's `delta.facts` must be non-empty and include added
   `crate::bus::sneaky_helper`. Prefer this fixture so shallow Actions clones
   do not flake.
7. **Static map gate** — `node extension/scripts/check-map.js`. This is a
   CSS/string check. It does **not** replace driving the running surface.
8. **Harness** — `npm install && npx playwright install --with-deps chromium && npm run verify`
   drives three desks:
   - chrome 17/17 on `webview-harness.html?mode=explorer&probe=0`
   - self-review on `?live=1&probe=0&require=1` using the derived snap
   - Delta on `?delta=1&probe=0&require=1&ws=delta` using the demo fixture
9. **Evidence** — stdout prints a `PASS verify-graphide` line that **mentions
   self-review** and **delta**. `verification/` holds screenshots plus
   `report.md`, including `self-review.png` and `delta.png`. PNGs are not a
   black frame (mean luma well above 0.15 on the bright desk).
10. **CI** — the GitHub Actions job named `verify` is green on the PR. No merge
    on a written story.

If the harness cannot boot the derived snap, say exactly what blocked (missing
binary, empty JSON, `__graphideLiveError`, paint timeout) and what you tried.
Do not paste a prose walkthrough as a substitute. Do not green the job on the
synthetic explorer fixture alone.

## What the job proves

PR #45 regressions that must fail CI (explorer chrome, 17/17):

- **Map is a community map.** Seed `bin main`. After Review, Map shows real
  community cards (`.bubble-card`), not a lone START / fallback program card.
- **Evidence stays off the object rail.** `#sourcePane` clips (`overflow: hidden`,
  `max-width ≤ 380px`) and must not overlap `#ledgerPane`.

Self-review gate (this checkout, not the fixture):

- `cargo build -p graphide-cli` then `graphide review --root <checkout>`
- snapshot: nodes + edges + files `> 0`, rust plugin in play, Map is not a
  lone START
- Playwright paints that snap on the Review desk and screenshots
  `verification/self-review.png`

Architecture Delta gate (fixtures/demo vs fixtures/demo-parent):

- `graphide review --root fixtures/demo --parent fixtures/demo-parent`
- `delta.facts` is not empty; includes added `crate::bus::sneaky_helper`
- Playwright paints `?delta=1&ws=delta` and screenshots `verification/delta.png`
- Review walk is finite. Delta does not write `.graphide/stamps/`.

Stamp / skip is **human-only**. Agents never stamp. A harness may click
`#stampBtn` / `#skipBtn` only to prove the host message is posted
(`window.__vscodePosts`). It must not write `.graphide/stamps/` as if an agent
approved a flow. The self-review and Delta steps do not stamp.

**Coverage rule** (document here; do not try to enforce agent-stamping): every
changed derived node on a proposed Steiner flow. Stamp / skip stays human.

## How to get to the desk

In the product: install the VSIX → Graphide activity bar → **Review**. The
panel lands on **Overview** when a default run exists (`control-flow` or
`overview`).

In the harness (what CI drives):

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
extension/scripts/webview-harness.html?live=1&probe=0&require=1
extension/scripts/webview-harness.html?delta=1&probe=0&require=1&ws=delta
```

`mode=explorer` posts the synthetic flowchart payload (bubbles + control-flow +
snippets). `probe=0` hides the debug overlay so screenshots are the desk.
`live=1&require=1` fetches `live-snap.json` and **fails closed** if it is
missing or not a ReviewSnapshot.

Useful query pins already wired in `webview-harness.js` / `main.js`:

| Query | Effect |
| --- | --- |
| `mode=explorer` | flowchart payload with 12 community bubbles |
| `ws=map` / `ws=slice` / … | pin `#workspaces [data-ws]` on first paint |
| `probe=0` | hide `#probe` |
| `suite=1` | in-page synthetic checklist (optional; the Playwright driver does not need it) |
| `live=1` | fetch `live-snap.json` as `{ type: "programs" }` |
| `delta=1` | fetch `delta-snap.json` (demo vs demo-parent Architecture Delta) |
| `require=1` | with `live=1` or `delta=1`, do **not** fall back to the synthetic payload |
| `suite=live` | SolarSim in-page checklist — **not** the CI self-review gate |

## Driving it with the harness

```
cargo build -p graphide-cli
./target/debug/graphide review --root "$PWD" --json --progress --no-parent \
  > extension/scripts/live-snap.json
npm run verify
```

`scripts/verify-graphide.js` asserts the snapshot, serves `extension/` over HTTP,
launches Chromium, and asserts on the **running** Review HTML (same chrome as
`extension.ts`). `--assert-snap` is the CI fast-fail before Playwright. The
driver also derives `delta-snap.json` from fixtures/demo vs demo-parent when
that file is missing.

Selectors are copied from the product. Prefer existing `#id`, `[data-ws]`,
`.bubble-card.start`, ARIA. Do **not** invent `data-component` / `data-action-id`
/ `data-testid` unless you also land those attributes in the product in the
same PR because the harness truly cannot hook existing ones.

| Surface | Hook |
| --- | --- |
| Workspaces | `#workspaces [data-ws="map"]` (also slice, lineage, decisions, registry, overview, timeline, delta) |
| Architecture Delta | `#workspaces [data-ws="delta"]`, `#deltaView [data-delta-view]`, `#deltaFacts .delta-fact`, `#deltaPlay`, `#deltaCanvas` |
| Map cards | `.bubble-card`, `.bubble-card.start`, `.bubble-card .name`, `[data-bubble]` |
| Slice / CFG boxes | `.vnode[data-id]`, `.vnode[data-kind]` |
| Object rail | `#ledgerPane`, `#ledgerGrid .cell` |
| Evidence | `#sourcePane`, `.src-k`, `#srcTitle`, `#srcBody`, `#srcClose`, `#srcEditor` |
| Stamp / skip | `#stampBtn`, `#skipBtn`, `#toast` |
| Host stub | `window.__vscodePosts`, `window.acquireVsCodeApi` |
| Live snap | `window.__graphideLive`, `window.__graphideLiveError` |
| Delta snap | `window.__graphideDelta`, `window.__graphideDeltaError` |

Feature maps (four headings each): [references/features/](references/features/).

## Gotchas

- `check-map.js` can pass while the desk is blank. Always drive the harness.
- `fallbackProgramBubbles()` paints one card labeled `main` / `program` when
  clustering is empty. That is the START-only degeneration. Fail if Map has
  one card and no community cut — including on the **self-review** snap.
- `peekSource` posts `{ type: "peekSource" }` to the host. The stub does not
  reply. Evidence still opens from the in-memory node / `snapshot.snippets`.
- Real `extension.ts` `writeStamp()` mkdir-writes `packageRoot()/.graphide/stamps/`.
  The harness stub only pushes to `__vscodePosts`. Do not treat a stub click as
  a human stamp. Self-review must not write that directory.
- `live-snap.json` and `delta-snap.json` are gitignored. CI / `npm run verify`
  generate them. `?live=1` / `?delta=1` without `require=1` still falls back
  to the synthetic payload — that is not a proof. The driver uses `require=1`.
- Architecture Delta CI uses `fixtures/demo` vs `fixtures/demo-parent`, not
  git `HEAD^`. Self-review stays `--no-parent`.
- This repo's program chips are Graphide crates (`bin graphide-cli`, libs), not
  the explorer fixture's `bin main`.
- Panic-free tests live under `crates/graphide-engine/tests/panic_free.rs` and
  run as part of `cargo test`. Keep them.
- rustc 1.85 from `rust-toolchain.toml`. Do not add a wasm target unless the
  product actually needs one (it does not today).
