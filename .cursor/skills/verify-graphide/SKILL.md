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
7. **Sequence fixture** — derive the same control-flow / data-subscription
   slice `first_slice.rs` uses (no parent required):

   ```
   ./target/debug/graphide review --root fixtures/demo --json --progress --no-parent \
     > extension/scripts/sequence-snap.json
   ```

   A flow's `sequence.participants` must be `> 1` and `sequence.hops` must be
   non-empty (data-subscription: `subscribe` Subscribes `events`).
8. **Data-flow fixture** — same demo slice (no parent required):

   ```
   ./target/debug/graphide review --root fixtures/demo --json --progress --no-parent \
     > extension/scripts/dataflow-snap.json
   ```

   A flow's `dataflow.nodes` must include a Source and a Sink; `dataflow.hops`
   must be non-empty (data-subscription: publish → events → subscribe).
9. **Lifecycle fixture** — same demo slice (no parent required):

   ```
   ./target/debug/graphide review --root fixtures/demo --json --progress --no-parent \
     > extension/scripts/lifecycle-snap.json
   ```

   A flow's `lifecycle.states` must include proposed / walking / broken;
   `lifecycle.transitions` must include recover `broken → walking`. Plugin
   Type / Endpoint ends may appear (`crate::bus::events`). No invented
   match/enum-variant states.
10. **Static map gate** — `node extension/scripts/check-map.js`. This is a
   CSS/string check. It does **not** replace driving the running surface.
11. **Package** — `npm ci --prefix extension && npm run package` writes `extension/graphide-*.vsix` and must pass `npm run check:package` plus `npm run check:activation`. The VSIX holds compiled `out/extension.js`, `media/main.js`, `media/main.css`, `media/xyflow.css`, `media/icon.svg`, and `bin/graphide` (or `graphide.exe`) for this host. It must not contain `media/src/` or `extension/src/`. Core Review does not need an LLM key. This does **not** launch a VS Code Extension Host.
12. **Harness** — `npm install && npx playwright install --with-deps chromium && npm run verify`
   drives seven desks plus Export, Presentation, Style, Appearance, Route, and Lens:
   - chrome 17/17 on `webview-harness.html?mode=explorer&probe=0`
   - Overview / Decisions / Registry / Timeline lists on that explorer desk
   - Enter-bubble XYFlow from Map (`.bubble-card` → `#enterCanvas`)
   - self-review on `?live=1&probe=0&require=1` using the derived snap
   - Delta on `?delta=1&probe=0&require=1&ws=delta` using the demo fixture
   - Sequence on `?sequence=1&probe=0&require=1&ws=sequence` using fixtures/demo
   - Data-flow on `?dataflow=1&probe=0&require=1&ws=dataflow` using fixtures/demo
   - Lifecycle on `?lifecycle=1&probe=0&require=1&ws=lifecycle` using fixtures/demo
   - Lineage on `?lineage=1&probe=0&require=1&ws=lineage` using fixtures/demo
   - Export on the explorer Map: `#exportBtn` writes PNG / SVG / Share Card
   - Presentation / Style on the explorer Map: `#presetBtn` cycles, `F` /
     Escape enter and exit the stage
   - Route / Lens on the Sequence demo snap: `R` lights a derived path,
     `L` highlights Function / Endpoint
   - Enter-bubble on the explorer Map: click `.bubble-card` →
     `#enterCanvas .react-flow__node` (> 1, ≤24); Map altitude stays `xy=0`
   - Ego / Find: `#egoBtn` + `#egoHops` 1 vs 2 on enter / Slice / Lineage;
     `#graphSearch` dims cards and XYFlow nodes
   - Ask: `#llmBtn` opens `#llmPane`; graph-only `localAsk` answers a
     flow / hop / coverage without an LLM key; `#llmClose` / Escape close
   - Keys: `?` / `#keysBtn` opens `#keysPane`; sheet lists `/` find, `?`
     sheet, `S`/`X` stamp/skip, `E` ego, `F` present, `D` day/night;
     `#keysClose` / Escape close
   - Path walk: `P` / `#pathWalkBtn` walks Map start → features → end;
     `[` `]` step; `.walk` / `.here` on community chips/cards; not Route
     `#routePlay`
   - Appearance: `#themeNight` / `D` adds `.night` on `html`/`body`
     (`.bright` stays); `#themeNight.on`; Map stays `xy=0`; Day restore
     before later suites
   - Coverage mark: explorer Evidence on an uncovered/changed node;
     `#inspMeta` mark is `uncovered` or `changed` (not only `—`)
   - Fit / Reorganize: explorer Map `#zoomFit` (`0`) and `#reorgBtn`;
     Map stays `xy=0` with more than one card visible; no stamp posts
   - Progress: explorer desk posts synthetic `{ type: "progress" }`;
     `#progress.on`, a `#phases li` is `.on` / `.done`, fill / pct /
     label update; `verification/progress.png` while the strip is on
   - Flow hints: `?dataflow=1` demo snap; `#tabs` chip
     `data-subscription`; Steiner nodes/edges on that named flow;
     `verification/flow-hints.png`
13. **Evidence** — stdout prints a `PASS verify-graphide` line that **mentions
    overview**, **decisions**, **registry**, **timeline**, **self-review**,
    **delta**, **sequence**, **dataflow**, **lifecycle**,
    **lineage**, **export**, **present**, **preset**, **route**, **lens**,
    **enter-bubble**, **ego**, **search**, **ask**, **keys**,
    **path-walk**, **appearance**, **coverage-mark**, **fit-reorg**,
    **progress**, and **flow-hints**.
    `verification/` holds screenshots plus `report.md`, including
    `overview.png`, `decisions.png`, `registry.png`, `timeline.png`,
    `self-review.png`, `delta.png`, `sequence.png`, `dataflow.png`,
    `lifecycle.png`, `lineage.png`, `enter-bubble.png`, `ego.png`,
    `search.png`, `ask.png`, `keys.png`, `path-walk.png`, `night.png`,
    `coverage-mark.png`, `fit-reorg.png`, `progress.png`,
    `flow-hints.png`,
    `export-share.png` (1200×630),
    a desk PNG or SVG, `present.png`, `preset-blueprint.png`, `route.png`,
    and `lens.png`. PNGs are not a black frame (mean luma well above 0.15
    on the bright desk; Night is dark vs day `map.png`, not a flat black
    frame).
14. **CI** — the GitHub Actions job named `verify` is green on the PR. No merge
    on a written story. Mac mini self-hosted is blocked until a runner with
    labels `[self-hosted, macOS, ARM64]` is registered on `livicter/graphide`
    (or org); do not flip `runs-on` until then.

If the harness cannot boot the derived snap, say exactly what blocked (missing
binary, empty JSON, `__graphideLiveError`, paint timeout) and what you tried.
Do not paste a prose walkthrough as a substitute. Do not green the job on the
synthetic explorer fixture alone.

## What the job proves

PR #45 regressions that must fail CI (explorer chrome, 17/17):

- **Map is a community map.** Seed `bin main`. After Review, Map shows real
  community cards (`.bubble-card`), not a lone START / fallback program card.
  Map altitude stays `xy=0`. Enter a card → `#enterCanvas` shaped XYFlow
  (≤24 nodes), not a vanilla `.inode` list. Screenshot `enter-bubble.png`.
- **Evidence stays off the object rail.** `#sourcePane` clips (`overflow: hidden`,
  `max-width ≤ 380px`) and must not overlap `#ledgerPane`.

Explorer list workspaces (same `?mode=explorer` desk; not XYFlow canvases):

- **Overview** lands first. Default-run `#sliceCanvas` still has shaped
  XYFlow nodes. Open map / program chips when the product shows them.
  Screenshot `verification/overview.png`. No stamps written.
- **Decisions** lists fixture stamps / skips / broken attestations (or the
  honest empty). Stamp / Skip stay host-only. Screenshot `decisions.png`.
- **Registry** `table.audit` rows match the snap (nodes / edges / files /
  plugin). Screenshot `registry.png`.
- **Timeline** rail shows parent cut / uncovered / stamp scars from the
  snap. Screenshot `timeline.png`.

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

Sequence gate (fixtures/demo, same slice as `first_slice.rs`):

- `graphide review --root fixtures/demo --no-parent`
- a flow `sequence` has `> 1` participant and an ordered hop list
- Playwright paints `?sequence=1&ws=sequence` and screenshots `verification/sequence.png`
- Play walk is finite. Sequence does not write `.graphide/stamps/`.

Data-flow gate (fixtures/demo, same slice as `first_slice.rs`):

- `graphide review --root fixtures/demo --no-parent`
- a flow `dataflow` has a Source and a Sink on the path
- Playwright paints `?dataflow=1&ws=dataflow` and screenshots `verification/dataflow.png`
- Play walk is finite. Data-flow does not write `.graphide/stamps/`.

Lifecycle gate (fixtures/demo, same slice as `first_slice.rs`):

- `graphide review --root fixtures/demo --no-parent`
- a flow `lifecycle` has proposed / walking / broken and recover `broken → walking`
- Playwright paints `?lifecycle=1&ws=lifecycle` and screenshots `verification/lifecycle.png`
- Play walk is finite. Lifecycle does not write `.graphide/stamps/`.

Lineage gate (fixtures/demo, same slice as `first_slice.rs`):

- `graphide review --root fixtures/demo --no-parent` (reuses Sequence snap)
- directed ego: callers left / callees right on Calls; Type/Endpoint data hops
- Playwright paints `?lineage=1&ws=lineage` and screenshots `verification/lineage.png`
- `coverage.changed` on the Delta snap marks `.changed`. Map stays `xy=0`.
- Lineage does not write `.graphide/stamps/`.

Presentation / Style gate (explorer Map):

- `#presetBtn` cycles `data-preset`; card count and identity selectors stay
- `#presentBtn` / `F` fills the canvas; Escape restores graph-bar chrome
- Playwright screenshots `verification/present.png` and
  `verification/preset-blueprint.png`
- Present / preset do not write `.graphide/stamps/`

Route / Lens gate (fixtures/demo Sequence snap):

- `R` / `#pathBtn` resolves a directed Calls/Reads/Writes/Publishes/Subscribes
  path; subscribe → events is a real Subscribes hop
- highlighted nodes ⊆ path nodes; unreachable stays empty
- journey Play / Next is finite
- `L` / `#lensBtn` highlights Function / Endpoint (or Source|Sink)
- Playwright screenshots `verification/route.png` and `verification/lens.png`
- Route / Lens do not write `.graphide/stamps/`

Ego / Find gate (explorer enter / Slice + demo Lineage):

- `#egoBtn` toggles; `#egoHops` 1 vs 2 on a selected node
- neighbors get `.ego`; non-neighbors get `.ego-dim` on enter or Slice
- `#graphSearch` dims Map `.bubble-card` and enter / Lineage `.vnode`
- Playwright screenshots `verification/ego.png` and `verification/search.png`
- Map altitude stays `xy=0`. Ego / Find do not write `.graphide/stamps/`

Ask gate (explorer Map, graph-only):

- `#llmBtn` opens `#llmPane`; `#llmClose` / Escape hide it
- Without a configured LLM host, `localAsk` still answers a flow, hop, or
  coverage (`Start → features → end`, never stamp)
- Playwright screenshots `verification/ask.png`
- Ask does not write `.graphide/stamps/` and does not post `{ type: "stamp" }`
- Do not require an OpenAI key in CI

Keys gate (explorer Map, shortcut sheet):

- `?` / `#keysBtn` opens `#keysPane`; `#keysClose` / Escape hide it
  (Escape closes Keys even while Evidence is open)
- Sheet text lists `/` find, `?` this sheet, `S`/`X` stamp/skip, `E` ego,
  `F` present, `D` day/night — the bindings in `desk.js`
- Playwright screenshots `verification/keys.png`
- Keys does not write `.graphide/stamps/` and does not post `{ type: "stamp" }`
- Map altitude stays `xy=0`. Close the sheet before Evidence / ledger / Ask

Path walk gate (explorer Map, community Play):

- Explorer `control-flow` already crosses several Map communities
- `P` or `#pathWalkBtn` starts the walk; `.feat-chip` / `.bubble-card`
  get `.walk` / `.here`
- `[` `]` move the walk index; no stamp / skip posts
- Pause / stop leaves Map `xy=0`
- Playwright screenshots `verification/path-walk.png` on a mid-path
  community (not a black frame)
- Not Route `#pathBtn` / `#routePlay`. Path walk does not write
  `.graphide/stamps/`

Appearance gate (explorer Map, Day / Night):

- From Day, `#themeNight` or `D` adds `.night` on `html` / `body`
- `#themeNight` has `.on`; `#themeDay` does not
- `.bright` stays (`html.bright.night`). Do not assert it is removed
- Map cards stay visible; altitude stays `xy=0`
- Playwright screenshots `verification/night.png` (dark vs day
  `map.png`, not a black frame)
- Day restore (`#themeDay` or `D`) drops `.night` so later suites stay
  day-safe
- P3 stays: Day / Night does not change `data-preset`
- Appearance does not write `.graphide/stamps/`

Coverage mark gate (explorer Evidence, synthetic coverage):

- Explorer `flowPayload()` already seeds `coverage.uncovered` /
  `coverage.changed`. `#coverage` counts are `> 0`
- Open Evidence on a Slice vnode (or `#ledgerGrid .cell.uncovered`)
- `#inspMeta` row `mark` is `uncovered` or `changed`, not only `—`
- Playwright screenshots `verification/coverage-mark.png` with Evidence
  open showing the mark (not a black frame)
- Coverage mark does not write `.graphide/stamps/` and does not post
  `{ type: "stamp" }`. Map stays `xy=0` if the drive touches Map

Fit / Reorganize gate (explorer Map):

- `#zoomFit` or `0` calls `fitChart`. Map stays community LOD (`xy=0`)
  with more than one `.bubble-card` visible. No card-overlap regression
  vs G5
- `#reorgBtn` (GraphBar `.reorg-btn` is the same handler) runs
  `autoReorganize` without stamp / skip posts. Card count stays or is
  still `> 1`. Map stays `xy=0`
- Playwright screenshots `verification/fit-reorg.png` after Fit or
  Reorganize (not a black frame)
- Fit / Reorganize do not write `.graphide/stamps/` and do not invent
  nodes. `R` stays PATH

Progress strip gate (explorer desk, synthetic host message):

- After the desk is up, `window.postMessage({ type: "progress", ... })`
  matching `showProgress` (`phase`, `label`, `done`, `total`, `pct`,
  `elapsed_ms`)
- `#progress` has `.on`. A `#phases li[data-phase]` is `.on`; earlier
  phases are `.done`
- `#progressFill` width, `#progressPct`, and `#progressLabel` update
- Playwright screenshots `verification/progress.png` while the strip is
  visible (not a black frame)
- `{ type: "cancelled" }` or a programs / flowchart post hides the strip
  and restores the desk
- Progress does not write `.graphide/stamps/` and does not post
  `{ type: "stamp" }`. Map stays `xy=0` if the drive is on Map

Flow hints gate (fixtures/demo `flows.toml`, Data-flow snap):

- `graphide review --root fixtures/demo --no-parent` loads the
  sidecar; a flow is named `data-subscription` (not only defaults)
- Hits stay FQNs (`crate::sub::subscribe`, `crate::bus::events`).
  The deriver builds the Steiner tree (`tree.nodes` / `tree.edges`)
- Playwright paints `?dataflow=1&ws=dataflow`; `#tabs` shows
  `[data-flow="data-subscription"]`
- Playwright screenshots `verification/flow-hints.png` (not a
  black frame)
- Flow hints do not write `.graphide/stamps/` and do not post
  `{ type: "stamp" }`. Map stays `xy=0` if the drive touches Map

Stamp / skip is **human-only**. Agents never stamp. A harness may click
`#stampBtn` / `#skipBtn` only to prove the host message is posted
(`window.__vscodePosts`). It must not write `.graphide/stamps/` as if an agent
  approved a flow. The self-review, Overview, Decisions, Registry, Timeline, Delta, Sequence, Data-flow, Lifecycle, Lineage, Export, Presentation, Style, Route, Lens, Enter-bubble, Ego, Find, Ask, Keys, Path walk, Appearance, Coverage mark, Fit / Reorganize, Progress, and Flow hints steps do not stamp.

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
extension/scripts/webview-harness.html?sequence=1&probe=0&require=1&ws=sequence
extension/scripts/webview-harness.html?dataflow=1&probe=0&require=1&ws=dataflow
extension/scripts/webview-harness.html?lifecycle=1&probe=0&require=1&ws=lifecycle
extension/scripts/webview-harness.html?lineage=1&probe=0&require=1&ws=lineage
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
| `sequence=1` | fetch `sequence-snap.json` (fixtures/demo Sequence) |
| `dataflow=1` | fetch `dataflow-snap.json` (fixtures/demo Data-flow) |
| `lifecycle=1` | fetch `lifecycle-snap.json` (fixtures/demo Lifecycle) |
| `lineage=1` | fetch `sequence-snap.json` (fixtures/demo Lineage) |
| `require=1` | with `live=1`, `delta=1`, `sequence=1`, `dataflow=1`, `lifecycle=1`, or `lineage=1`, do **not** fall back to the synthetic payload |
| `present=1` | open Presentation Stage after first paint |
| `preset=classic` / `signal-flow` / `blueprint` | pin visual Style |
| `route=1` | open Route probe after first paint (same Sequence snap) |
| `lens=1` | open Lens after first paint (same Sequence snap) |
| `suite=live` | SolarSim in-page checklist — **not** the CI self-review gate |

## Driving it with the harness

```
cargo build -p graphide-cli
./target/debug/graphide review --root "$PWD" --json --progress --no-parent \
  > extension/scripts/live-snap.json
npm run verify
```

`scripts/verify-graphide.js` asserts the snapshot, serves `extension/` over HTTP,
launches Chromium, and asserts on the **running** Review HTML (same React desk
as `extension/media/src/`). `--assert-snap` is the CI fast-fail before Playwright. The
driver also derives `delta-snap.json` from fixtures/demo vs demo-parent when
that file is missing.

Selectors are copied from the product. Prefer existing `#id`, `[data-ws]`,
`.bubble-card.start`, ARIA. Do **not** invent `data-component` / `data-action-id`
/ `data-testid` unless you also land those attributes in the product in the
same PR because the harness truly cannot hook existing ones.

| Surface | Hook |
| --- | --- |
| Workspaces | `#workspaces [data-ws="map"]` (also slice, lineage, decisions, registry, overview, timeline, delta, sequence, dataflow, lifecycle) |
| Overview | `#workspaces [data-ws="overview"]`, `#sliceCanvas .react-flow__node`, `.stat-strip [data-ws="map"]`, `#legend [data-prog]` |
| Decisions | `#workspaces [data-ws="decisions"]`, `.expl-card[data-decision]`, `.outcome-strip`, `#stampBtn` / `#skipBtn` |
| Registry | `#workspaces [data-ws="registry"]`, `table.audit tbody tr` |
| Timeline | `#workspaces [data-ws="timeline"]`, `.tl-item[data-t]`, `#tlScrub` |
| Architecture Delta | `#workspaces [data-ws="delta"]`, `#deltaView [data-delta-view]`, `#deltaFacts .delta-fact`, `#deltaPlay`, `#deltaCanvas` |
| Sequence | `#workspaces [data-ws="sequence"]`, `#seqParts .seq-part`, `#seqHops .seq-hop`, `#seqPlay`, `#seqCanvas`, `#seqCanvas .react-flow__node` |
| Data-flow | `#workspaces [data-ws="dataflow"]`, `#dfStages .df-stage`, `#dfCanvas .df-node[data-df-role]`, `#dfHops .df-hop`, `#dfPlay` |
| Lifecycle | `#workspaces [data-ws="lifecycle"]`, `#lcLanes .lc-lane`, `#lcCanvas .lc-state[data-lc-type]`, `#lcTrans .lc-trans`, `#lcPlay` |
| Lineage | `#workspaces [data-ws="lineage"]`, `#lineageCanvas .react-flow__node`, `.ego-node[data-side]`, `#lineageHops .expl-card.hop` |
| Map cards | `.bubble-card`, `.bubble-card.start`, `.bubble-card .name`, `[data-bubble]` |
| Enter-bubble | `#enterCanvas .react-flow__node`, `#enterCanvas .vnode[data-shape]`, `[data-lit]`, `[data-leaf]` |
| Slice / CFG boxes | `.vnode[data-id]`, `.vnode[data-kind]` |
| Object rail | `#ledgerPane`, `#ledgerGrid .cell` |
| Evidence | `#sourcePane`, `.src-k`, `#srcTitle`, `#srcBody`, `#srcClose`, `#srcEditor` |
| Coverage mark | `#inspMeta` `.row` `.k` `mark`, `#coverage`, `#ledgerGrid .cell.uncovered` |
| Stamp / skip | `#stampBtn`, `#skipBtn`, `#toast` |
| Export | `#exportBtn`, `#exportMenu`, `#exportPng`, `#exportSvg`, `#exportShare`, `window.__graphideLastExport` |
| Presentation / Style | `#presentBtn`, `#presetBtn`, `body.present`, `html[data-preset]`, `?present=1`, `?preset=` |
| Route | `#pathBtn`, `#routeReceipt`, `#routeHops .route-hop`, `.on-route`, `window.__graphideRoute` |
| Lens | `#lensBtn`, `#lensReceipt`, `#lensCompare`, `[data-lens-role]`, `.lens-on`, `window.__graphideLens` |
| Ego | `#egoBtn`, `#egoHops`, `.ego`, `.ego-dim`, `data-dist` |
| Find | `#graphSearch`, `graphFilter.q`, `.dim`, `.hit`, `matchesExplorerQuery` |
| Ask | `#llmBtn`, `#llmPane`, `#llmClose`, `#llmAsk`, `#llmSend`, `#llmLog` |
| Keys | `#keysBtn`, `#keysPane`, `#keysClose`, `?` / F1 |
| Path walk | `#pathWalkBtn`, `#pathWalkPrev`, `#pathWalkNext`, `.feat-chip`, `.walk` / `.here`, `P` / `[` / `]` |
| Appearance | `#themeSeg`, `#themeDay`, `#themeNight`, `html.night` / `body.night`, `.on`, `D` |
| Fit / Reorganize | `#zoomFit`, `0`, `#reorgBtn`, `.reorg-btn`, `fitChart`, `autoReorganize` |
| Progress | `#progress`, `#phases li[data-phase]`, `#progressFill`, `#progressLabel`, `#progressCounts`, `#progressPct`, `#progressTime` |
| Flow hints | `#tabs .tab[data-flow="data-subscription"]`, `#dfCanvas .df-node`, `#dfHops .df-hop` |
| Host stub | `window.__vscodePosts`, `window.acquireVsCodeApi` |
| Live snap | `window.__graphideLive`, `window.__graphideLiveError` |
| Delta snap | `window.__graphideDelta`, `window.__graphideDeltaError` |
| Sequence snap | `window.__graphideSequence`, `window.__graphideSequenceError` |
| Data-flow snap | `window.__graphideDataflow`, `window.__graphideDataflowError` |
| Lifecycle snap | `window.__graphideLifecycle`, `window.__graphideLifecycleError` |
| Lineage | `#lineageCanvas`, `window.__graphideLineage` |

Feature maps (four headings each): [references/features/](references/features/README.md).

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
- `live-snap.json`, `delta-snap.json`, `sequence-snap.json`,
  `dataflow-snap.json`, and `lifecycle-snap.json` are gitignored. CI /
  `npm run verify` generate them. `?live=1` / `?delta=1` / `?sequence=1` /
  `?dataflow=1` / `?lifecycle=1` without `require=1` still falls back to the
  synthetic payload — that is not a proof. The driver uses `require=1`.
- Architecture Delta CI uses `fixtures/demo` vs `fixtures/demo-parent`, not
  git `HEAD^`. Sequence, Data-flow, Lifecycle, Route, and Lens CI use
  `fixtures/demo` with `--no-parent`. Route / Lens reuse `sequence-snap.json`.
  Self-review stays `--no-parent`.
- This repo's program chips are Graphide crates (`bin graphide-cli`, libs), not
  the explorer fixture's `bin main`.
- Panic-free tests live under `crates/graphide-engine/tests/panic_free.rs` and
  run as part of `cargo test`. Keep them.
- rustc 1.85 from `rust-toolchain.toml`. Do not add a wasm target unless the
  product actually needs one (it does not today).
