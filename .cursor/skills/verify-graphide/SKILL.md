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
10. **Python desk fixture** — prove the compiled-in `python@` deriver on
    the Review desk (not `plugins --check` alone):

    ```
    ./target/debug/graphide review --root fixtures/python --json --progress --no-parent \
      > extension/scripts/python-snap.json
    ```

    Snap `plugin` matches `python@`; nodes / edges / files `> 0`; a flow
    has Source and Sink (data-subscription: publish → events → subscribe).
    Desk: `?python=1&probe=0&require=1`. Screenshot
    `verification/python-desk.png`. Self-review rust / RC* / DA* /
    map-offview / panel-timeout stay.
11. **Static map gate** — `node extension/scripts/check-map.js`. This is a
   CSS/string check. It does **not** replace driving the running surface.
12. **Package** — `npm ci --prefix extension && npm run package` writes `extension/graphide-*.vsix` and must pass `npm run check:package` plus `npm run check:activation`. The VSIX holds compiled `out/extension.js`, `media/main.js`, `media/main.css`, `media/xyflow.css`, `media/icon.svg`, and `bin/graphide` (or `graphide.exe`) for this host. It must not contain `media/src/` or `extension/src/`. Core Review does not need an LLM key. This does **not** launch a VS Code Extension Host.
13. **Harness** — `npm install && npx playwright install --with-deps chromium && npm run verify`
   drives seven desks plus Export, Presentation, Style, Appearance, Route, and Lens:
   - chrome 17/17 on `webview-harness.html?mode=explorer&probe=0`
   - Overview / Decisions / Registry / Timeline lists on that explorer desk
   - Enter-bubble XYFlow from Map (`.bubble-card` → `#enterCanvas`)
   - self-review on `?live=1&probe=0&require=1` using the derived snap
   - Delta on `?delta=1&probe=0&require=1&ws=delta` using the demo fixture
   - Sticky clusters on that same Delta snap: `#deltaFacts
     .delta-fact[data-delta-kind="stable"][data-bubble]` (or
     `relabel`); screenshot `verification/sticky-clusters.png`
   - Delta sticky views on that same snap: pick a community fact;
     Before / After `#deltaCanvas .vnode[data-bubble]` share the
     id; screenshot `verification/delta-sticky-views.png`
   - Sequence on `?sequence=1&probe=0&require=1&ws=sequence` using fixtures/demo
   - Data-flow on `?dataflow=1&probe=0&require=1&ws=dataflow` using fixtures/demo
   - Lifecycle on `?lifecycle=1&probe=0&require=1&ws=lifecycle` using fixtures/demo
   - Python desk on `?python=1&probe=0&require=1&ws=dataflow` using fixtures/python
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
   - Kind filters: explorer Slice `#kindFilters input[data-kind]`
     Function / Type / Endpoint; uncheck Type (+ Endpoint) leaves
     Function only on `.vnode:not(.dim)` / `#ledgerGrid .cell`;
     Type-only; restore; Map `xy=0`; `verification/kind-filters.png`
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
   - Hop card: explorer Evidence on a Slice vnode; `#inspEdges` hop
     hits; click `.edge-hit` / `text.ekind` / `#inspEdges .row`;
     `#hopCard` names both ends; end inspects the node;
     `verification/hop-card.png`
   - Fit / Reorganize: explorer Map `#zoomFit` (`0`) and `#reorgBtn`;
     Map stays `xy=0` with more than one card visible
   - Zoom: explorer Map `#zoomIn` / `#zoomOut`; `#zoomPct` / scale
     change; Map stays `xy=0` with cards visible
   - Canvas recycle: explorer Map second paint / preview / `patch`;
     same `.stage` / `.viewport` or keepCam; cards at `xy=0`;
     `verification/canvas-recycle.png`
   - Delta onAnalysis: explorer Map coverage/findings-only
     `{ type: "patch" }` after paint+zoom; same `.stage` /
     `.viewport` + keepCam + `lod=0`; `#coverage` updates;
     `verification/delta-onanalysis.png`
   - Map off-view: explorer Map zoom/pan so ≥1 card leaves
     `.stage`; `data-offview` / in-stage rects < total; pan
     back restores `data-bubble`; `xy=0`; `verification/map-offview.png`
   - Panel timeout: explorer Map fat coverage/findings-only
     `{ type: "patch" }` after paint; same `.stage` /
     `.viewport`; `#coverage[data-panel="shed"]`; `#zoomIn`
     click moves camera without waiting on the full findings
     list; `verification/panel-timeout.png`
   - Program chips: explorer `#legend [data-prog]` single-chip honest
     path (`bin main`); self-review (`?live=1`) clicks a second Graphide
     crate chip; `#meta` / `.on` / program key change; Map stays
     `xy=0`; `verification/program-chips.png`
   - All programs: explorer skips `#legend [data-prog="-1"]` when
     absent; self-review starts on a crate chip then clicks All
     programs; `#meta` token `all` / key `-1`; Map stays `xy=0`;
     `verification/all-programs.png`
   - Progress: explorer desk posts synthetic `{ type: "progress" }`;
     `#progress.on`, a `#phases li` is `.on` / `.done`, fill / pct /
     label update; `verification/progress.png` while the strip is on
   - Cancel review: explorer desk posts synthetic `{ type: "progress" }`;
     click `#cancelBtn` posts `{ type: "cancel" }`; host `{ type:
     "cancelled" }` hides the strip and restores `#reviewBtn`;
     `verification/cancel-review.png` of the restored desk
    - Flow hints: `?dataflow=1` demo snap; `#tabs` chip
      `data-subscription`; Steiner nodes/edges on that named flow;
      `verification/flow-hints.png`
    - Flow tabs: explorer `#tabs .tab[data-flow]`; click a second
      chip; `.on` / `selectFlow` / `#meta` title (or hops /
      start·end / Slice lit) change; Map returns `xy=0`;
      `verification/flow-tabs.png`
    - Slice grey: explorer `#tabs` select a flow; `#sliceCanvas`
      on-tree `data-lit="1"` / `.vnode.lit` and at least one
      off-slice `data-lit="0"` / `.vnode.grey` / `.slice-dim`;
      Map stays `xy=0`; `verification/slice-grey.png`
    - Unmatched hint: explorer desk; `#coverage li.finding`
      `unmatched solarsim::MissingHit in boot`; Decisions card
      `UnmatchedHint`; `verification/unmatched-hint.png`
    - Uncovered node: explorer desk; `#coverage` `Coverage N changed · N
      uncovered`; Timeline `.tl-item` Uncovered / off every proposed
      tree; `verification/uncovered-node.png`
    - Open slice: explorer Decisions; UnmatchedHint boot card;
      `button[data-open-slice]` lands Slice for that flow;
      `verification/open-slice.png`
    - Draft hint: explorer Timeline Uncovered; `#draftHintBtn` copies
      a `[[flow]]` hit list of uncovered FQNs; `verification/draft-hint.png`
    - Proposed uncovered: `?delta=1` demo vs demo-parent; `#tabs`
      `.tab[data-proposed="1"]` `proposed-uncovered`; Steiner paints;
      selecting it changes the cut; no `flows.toml` write;
      `verification/proposed-uncovered.png`
14. **Evidence** — stdout prints a `PASS verify-graphide` line that **mentions
    overview**, **decisions**, **registry**, **timeline**, **self-review**,
    **delta**, **sequence**, **dataflow**, **lifecycle**, **python-desk**,
    **lineage**, **export**, **present**, **preset**, **route**, **lens**,
    **enter-bubble**, **ego**, **search**, **kind-filters**, **ask**, **keys**,
    **path-walk**, **appearance**, **coverage-mark**, **hop-card**, **fit-reorg**,
    **zoom**, **canvas-recycle**, **delta-onanalysis**, **map-offview**, **panel-timeout**, **program-chips**, **all-programs**, **progress**, **flow-hints**, **flow-tabs**, **slice-grey**, **unmatched-hint**, **uncovered-node**,
    **open-slice**, **draft-hint**, **proposed-uncovered**, **sticky-clusters**,
    **delta-sticky-views**, and **cancel-review**.
    `verification/` holds the screenshots named in
    [references/features/](references/features/README.md) plus
    `report.md`. Share Card is 1200×630. PNGs are not a black frame
    (mean luma well above 0.15 on the bright desk; Night is dark vs
    day `map.png`, not a flat black frame). The driver lists the
    files it actually wrote — do not maintain a second dump here.
15. **CI** — the GitHub Actions job named `verify` is green on the PR. No merge
    on a written story. Mac mini self-hosted is blocked until a runner with
    labels `[self-hosted, macOS, ARM64]` is registered on `livicter/graphide`
    (or org); do not flip `runs-on` until then.

If the harness cannot boot the derived snap, say exactly what blocked (missing
binary, empty JSON, `__graphideLiveError`, paint timeout) and what you tried.
Do not paste a prose walkthrough as a substitute. Do not green the job on the
synthetic explorer fixture alone.

## What the job proves

Doctor items 1–15 plus the feature maps. Do not restate every desk
here. Unique regressions that must still fail CI:

- **Map is a community map.** Seed `bin main`. After Review, Map shows
  real community cards (`.bubble-card`), not a lone START / fallback
  program card. Map altitude stays `xy=0`. Enter a card → `#enterCanvas`
  shaped XYFlow (≤24 nodes), not a vanilla `.inode` list.
- **Evidence stays off the object rail.** `#sourcePane` clips
  (`overflow: hidden`, `max-width ≤ 380px`) and must not overlap
  `#ledgerPane`.
- **Stamp / skip is human-only.** Agents never stamp. The harness may
  click `#stampBtn` / `#skipBtn` only to prove `window.__vscodePosts`.
  No step writes `.graphide/stamps/`. The driver `assertNoStampDir`
  per step is the gate — do not duplicate that sentence on every
  feature map row.

**Coverage rule** (document here; do not try to enforce
agent-stamping): every changed derived node on a proposed Steiner
flow. Stamp / skip stays human.

Per-surface selectors and harness drive live in
[references/features/](references/features/README.md).

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
extension/scripts/webview-harness.html?python=1&probe=0&require=1&ws=dataflow
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
| `python=1` | fetch `python-snap.json` (fixtures/python Review desk) |
| `lineage=1` | fetch `sequence-snap.json` (fixtures/demo Lineage) |
| `require=1` | with `live=1`, `delta=1`, `sequence=1`, `dataflow=1`, `lifecycle=1`, `python=1`, or `lineage=1`, do **not** fall back to the synthetic payload |
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
| Sticky clusters | `#deltaFacts .delta-fact[data-delta-class="community"]`, `[data-delta-kind="stable"]`, `[data-bubble]`, `.bubble-card[data-cluster]` |
| Delta sticky views | `#deltaFacts .delta-fact[data-delta-class="community"][data-bubble]`, `#deltaView [data-delta-view]`, `#deltaCanvas .vnode[data-bubble]`, `[data-delta-review-current]` |
| Sequence | `#workspaces [data-ws="sequence"]`, `#seqParts .seq-part`, `#seqHops .seq-hop`, `#seqPlay`, `#seqCanvas`, `#seqCanvas .react-flow__node` |
| Data-flow | `#workspaces [data-ws="dataflow"]`, `#dfStages .df-stage`, `#dfCanvas .df-node[data-df-role]`, `#dfHops .df-hop`, `#dfPlay` |
| Lifecycle | `#workspaces [data-ws="lifecycle"]`, `#lcLanes .lc-lane`, `#lcCanvas .lc-state[data-lc-type]`, `#lcTrans .lc-trans`, `#lcPlay` |
| Lineage | `#workspaces [data-ws="lineage"]`, `#lineageCanvas .react-flow__node`, `.ego-node[data-side]`, `#lineageHops .expl-card.hop` |
| Map cards | `.bubble-card`, `.bubble-card.start`, `.bubble-card .name`, `[data-bubble]` |
| Enter-bubble | `#enterCanvas .react-flow__node`, `#enterCanvas .vnode[data-shape]`, `[data-lit]`, `[data-leaf]` |
| Slice / CFG boxes | `.vnode[data-id]`, `.vnode[data-kind]` |
| Object rail | `#ledgerPane`, `#ledgerGrid .cell` |
| Evidence | `#sourcePane`, `.src-k`, `#srcTitle`, `#srcBody`, `#srcClose`, `#srcEditor` |
| Hop card | `#hopCard`, `#inspEdges .row[data-from][data-to]`, `.edge-hit`, `text.ekind`, `#hopCard [data-id]` |
| Coverage mark | `#inspMeta` `.row` `.k` `mark`, `#coverage`, `#ledgerGrid .cell.uncovered` |
| Stamp / skip | `#stampBtn`, `#skipBtn`, `#toast` |
| Export | `#exportBtn`, `#exportMenu`, `#exportPng`, `#exportSvg`, `#exportShare`, `window.__graphideLastExport` |
| Presentation / Style | `#presentBtn`, `#presetBtn`, `body.present`, `html[data-preset]`, `?present=1`, `?preset=` |
| Route | `#pathBtn`, `#routeReceipt`, `#routeHops .route-hop`, `.on-route`, `window.__graphideRoute` |
| Lens | `#lensBtn`, `#lensReceipt`, `#lensCompare`, `[data-lens-role]`, `.lens-on`, `window.__graphideLens` |
| Ego | `#egoBtn`, `#egoHops`, `.ego`, `.ego-dim`, `data-dist` |
| Find | `#graphSearch`, `graphFilter.q`, `.dim`, `.hit`, `matchesExplorerQuery` |
| Kind filters | `#kindFilters input[data-kind]`, `.kind-pill`, `graphFilter.kinds`, `#ledgerGrid .cell.kind-*` |
| Ask | `#llmBtn`, `#llmPane`, `#llmClose`, `#llmAsk`, `#llmSend`, `#llmLog` |
| Keys | `#keysBtn`, `#keysPane`, `#keysClose`, `?` / F1 |
| Path walk | `#pathWalkBtn`, `#pathWalkPrev`, `#pathWalkNext`, `.feat-chip`, `.walk` / `.here`, `P` / `[` / `]` |
| Appearance | `#themeSeg`, `#themeDay`, `#themeNight`, `html.night` / `body.night`, `.on`, `D` |
| Fit / Reorganize | `#zoomFit`, `0`, `#reorgBtn`, `.reorg-btn`, `fitChart`, `autoReorganize` |
| Zoom | `#zoomIn`, `#zoomOut`, `#zoomPct`, `+` / `−`, `zoomBy` |
| Canvas recycle | `#canvas .stage`, `#canvas .viewport`, `.bubble-card`, `svg.comm-edges`, `{ type: "patch" }` |
| Delta onAnalysis | `#canvas .stage`, `#canvas .viewport`, `#coverage`, `{ type: "patch" }` coverage/findings/stats |
| Map off-view | `#canvas .stage`, `.bubble-card`, `[data-bubble]`, `[data-offview]`, `#zoomIn` / `#zoomFit` |
| Panel timeout | `#coverage[data-panel="shed"]`, `#canvas .stage`, `#zoomIn`, `{ type: "patch" }` coverage/findings |
| Program chips | `#legend [data-prog]`, `.leg`, `#meta`, `graphFilter.program` |
| All programs | `#legend [data-prog="-1"]`, `#meta` `all`, `graphFilter.program = null` |
| Progress | `#progress`, `#phases li[data-phase]`, `#progressFill`, `#progressLabel`, `#progressCounts`, `#progressPct`, `#progressTime` |
| Cancel review | `#cancelBtn`, `#reviewBtn`, `#progress`, `{ type: "cancel" }` / `{ type: "cancelled" }` |
| Flow hints | `#tabs .tab[data-flow="data-subscription"]`, `#dfCanvas .df-node`, `#dfHops .df-hop` |
| Flow tabs | `#tabs .tab[data-flow]`, `#tabs .tab.on`, `#meta`, `#storyRail .feat-chip`, `{ type: "selectFlow" }` |
| Slice grey | `#sliceCanvas .vnode[data-lit]`, `.vnode.lit`, `.vnode.grey`, `.slice-dim`, `data-slice-dist` |
| Unmatched hint | `#coverage li.finding`, `.expl-card[data-decision]` |
| Uncovered node | `#coverage`, `.cov-chip`, `#canvas .tl-item` Uncovered, `#tlScrubMeta` |
| Open slice | `button[data-open-slice]`, `#workspaces [data-ws="slice"]`, `#tabs .tab[data-flow]` |
| Draft hint | `#draftHintBtn`, `#draftHint`, `.tl-item.now` Uncovered |
| Proposed uncovered | `#tabs .tab[data-proposed="1"]`, `#tabs .tab[data-flow="proposed-uncovered"]`, `#sliceCanvas` |
| Host stub | `window.__vscodePosts`, `window.acquireVsCodeApi` |
| Live snap | `window.__graphideLive`, `window.__graphideLiveError` |
| Delta snap | `window.__graphideDelta`, `window.__graphideDeltaError` |
| Sequence snap | `window.__graphideSequence`, `window.__graphideSequenceError` |
| Data-flow snap | `window.__graphideDataflow`, `window.__graphideDataflowError` |
| Lifecycle snap | `window.__graphideLifecycle`, `window.__graphideLifecycleError` |
| Python snap | `window.__graphidePython`, `window.__graphidePythonError` |
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
  `dataflow-snap.json`, `lifecycle-snap.json`, and `python-snap.json` are
  gitignored. CI / `npm run verify` generate them. `?live=1` / `?delta=1` /
  `?sequence=1` / `?dataflow=1` / `?lifecycle=1` / `?python=1` without
  `require=1` still falls back to the synthetic payload — that is not a
  proof. The driver uses `require=1`.
- Architecture Delta CI uses `fixtures/demo` vs `fixtures/demo-parent`, not
  git `HEAD^`. Sequence, Data-flow, Lifecycle, Route, and Lens CI use
  `fixtures/demo` with `--no-parent`. Python desk CI uses `fixtures/python`
  with `--no-parent`. Route / Lens reuse `sequence-snap.json`.
  Self-review stays `--no-parent`.
- This repo's program chips are Graphide crates (`bin graphide-cli`, libs), not
  the explorer fixture's `bin main`.
- Panic-free tests live under `crates/graphide-engine/tests/panic_free.rs` and
  run as part of `cargo test`. Keep them.
- rustc 1.85 from `rust-toolchain.toml`. Do not add a wasm target unless the
  product actually needs one (it does not today).
