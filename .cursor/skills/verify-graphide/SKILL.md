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

`?suite=live` fetches `extension/scripts/live-snap.json`. That file is
**gitignored and not in the tree**. Do not block a first green job on generating
a SolarSim live-snap. Synthetic `?mode=explorer` is enough if it actually
paints the desk.

P-Stack (`/add-plugin pstack`) is local only. Cloud agents inherit **committed**
skills. Do not add P-Stack files.

## Doctor

Run from the repo root. Every line must succeed before you claim the desk works.

1. **Toolchain** — `rustc --version` is 1.85.x (`rust-toolchain.toml`). Node 20+
   is on PATH. No wasm target.
2. **Engine** — `cargo test --workspace` (includes
   `crates/graphide-engine/tests/panic_free.rs`). Panic-free stays a CI gate.
3. **Static map gate** — `node extension/scripts/check-map.js`. This is a
   CSS/string check. It does **not** replace driving the running surface.
4. **Harness** — `npm install && npx playwright install --with-deps chromium && npm run verify`
   opens Playwright Chromium against `extension/scripts/webview-harness.html?mode=explorer`.
5. **Evidence** — stdout prints a `PASS verify-graphide` line.
   `verification/` holds screenshots plus `report.md`. PNGs are not a black frame
   (mean luma well above 0.15 on the bright desk).
6. **CI** — the GitHub Actions job named `verify` is green on the PR. No merge
   on a written story.

If the harness cannot boot, say exactly what blocked and what you tried. Do not
paste a prose walkthrough as a substitute.

## What the job proves (first floor)

PR #45 regressions that must fail CI:

- **Map is a community map.** Seed `bin main`. After Review, Map shows real
  community cards (`.bubble-card`), not a lone START / fallback program card.
- **Evidence stays off the object rail.** `#sourcePane` clips (`overflow: hidden`,
  `max-width ≤ 380px`) and must not overlap `#ledgerPane`.

Stamp / skip is **human-only**. Agents never stamp. A harness may click
`#stampBtn` / `#skipBtn` only to prove the host message is posted
(`window.__vscodePosts`). It must not write `.graphide/stamps/` as if an agent
approved a flow.

**Coverage rule** (document here; do not try to enforce agent-stamping): every
changed derived node on a proposed Steiner flow. Stamp / skip stays human.

## How to get to the desk

In the product: install the VSIX → Graphide activity bar → **Review**. The
panel lands on **Overview** when a default run exists (`control-flow` or
`overview`).

In the harness (what CI drives):

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

`mode=explorer` posts the synthetic flowchart payload (bubbles + control-flow +
snippets). `probe=0` hides the debug overlay so screenshots are the desk.

Useful query pins already wired in `webview-harness.js` / `main.js`:

| Query | Effect |
| --- | --- |
| `mode=explorer` | flowchart payload with 12 community bubbles |
| `ws=map` / `ws=slice` / … | pin `#workspaces [data-ws]` on first paint |
| `probe=0` | hide `#probe` |
| `suite=1` | in-page synthetic checklist (optional; the Playwright driver does not need it) |
| `suite=live` | needs `live-snap.json` — **out of scope** for this loop |

## Driving it with the harness

```
npm run verify
```

`scripts/verify-graphide.js` serves `extension/` over HTTP, launches Chromium,
and asserts on the **running** Review HTML (same chrome as `extension.ts`).

Selectors are copied from the product. Prefer existing `#id`, `[data-ws]`,
`.bubble-card.start`, ARIA. Do **not** invent `data-component` / `data-action-id`
/ `data-testid` unless you also land those attributes in the product in the
same PR because the harness truly cannot hook existing ones.

| Surface | Hook |
| --- | --- |
| Workspaces | `#workspaces [data-ws="map"]` (also slice, lineage, decisions, registry, overview, timeline) |
| Map cards | `.bubble-card`, `.bubble-card.start`, `.bubble-card .name`, `[data-bubble]` |
| Slice / CFG boxes | `.vnode[data-id]`, `.vnode[data-kind]` |
| Object rail | `#ledgerPane`, `#ledgerGrid .cell` |
| Evidence | `#sourcePane`, `.src-k`, `#srcTitle`, `#srcBody`, `#srcClose`, `#srcEditor` |
| Stamp / skip | `#stampBtn`, `#skipBtn`, `#toast` |
| Host stub | `window.__vscodePosts`, `window.acquireVsCodeApi` |

Feature maps (four headings each): [references/features/](references/features/).

## Gotchas

- `check-map.js` can pass while the desk is blank. Always drive the harness.
- `fallbackProgramBubbles()` paints one card labeled `main` / `program` when
  clustering is empty. That is the START-only degeneration. Fail if Map has
  one card and no community cut.
- `peekSource` posts `{ type: "peekSource" }` to the host. The stub does not
  reply. Evidence still opens from the in-memory node / `snapshot.snippets`.
- Real `extension.ts` `writeStamp()` mkdir-writes `packageRoot()/.graphide/stamps/`.
  The harness stub only pushes to `__vscodePosts`. Do not treat a stub click as
  a human stamp.
- `live-snap.json` is gitignored. `?suite=live` without it falls back to the
  synthetic payload and is not a SolarSim proof.
- Panic-free tests live under `crates/graphide-engine/tests/panic_free.rs` and
  run as part of `cargo test`. Keep them.
- rustc 1.85 from `rust-toolchain.toml`. Do not add a wasm target unless the
  product actually needs one (it does not today).
