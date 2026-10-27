# Trace Trajectory DAG

Fixture-backed read-only execution Trajectory DAG (ADE Phase 1 / A1a).
Subtask nodes, dependency edges, and artifact/diff pins for Review explorer
Trace. Not a live agent wire and not Plan Passport (sign-off gate).

## Sub-features

- Workspace tab `#workspaces [data-ws="trace"]`. Sibling of Passport —
  same explorer nav row. Click-only beyond digit keys 1–9.
- Host `#trajCanvas[data-testid="trajectory-dag"]` with `.traj-node` /
  `.traj-edge` for the DAG.
- Nodes expose `data-id`, `data-artifact`, `data-diff`, `data-kind`,
  `data-role`, and richer v2 hooks: `data-phase`, `data-agent`,
  `data-duration`, `data-deps`, optional `data-adds` / `data-dels`.
- Pins `.traj-pin[data-traj-pin="artifact|diff"]` on nodes; inspector
  `#trajDetail` mirrors focus via `data-pin-focus` and
  `[data-traj-artifact]` / `[data-traj-diff]`.
- Diff pins carry `data-adds` / `data-dels`. Hover shows `#trajPinTip`
  (`data-traj-pin-tip`) with matching counts (`[data-tip-counts]`,
  `[data-tip-adds]` / `[data-tip-dels]`) and artifact path — no native
  `title` double-tip. Pin-tip chrome: add/del chips
  (`.traj-pin-tip-chip-add` / `.traj-pin-tip-chip-del`), path dir +
  basename (`[data-tip-art-dir]` / `[data-tip-art-base]`), and pin-anchored
  placement (`data-tip-place=below|above`). Pin residual cue
  (`.traj-pin-tip-residual` / `data-tip-residual`): status badge,
  unmet deps left, hop residual (`data-residual-status` /
  `data-residual-deps` / `data-residual-hops`), and optional seal hint
  (`data-residual-seal`) for harness/immutable nodes (TP1–TP3).
- Inspector also shows phase / agent / duration, a deps list
  (`[data-traj-dep]` under `[data-traj-deps]`), and artifact-diff
  adds/dels (`[data-artifact-diff]`).
- Edges carry `data-from` / `data-to` / `data-kind` (`seq|fork|join`) and
  optional `data-label`. Focus dims off-path deps. Edge-legend chips
  (`#trajEdgeLegend` / `.traj-legend-chip`) mirror that focus: on-path
  kinds stay readable; off-path kinds get `.dim` (FLD1–FLD3). When residual neighbors exist, adj-residual node-kind chips (`.adj-residual` / `data-adj-residual`) append after edge chips (AL1–AL3). When traj focus scopes residual gatedWrites (same N as Passport FC), a focus-residual count chip (`.focus-residual` / `data-focus-residual` / `data-focus-residual-count`) appends and the legend host mirrors `data-residual-scope` (LC1–LC3); clear-focus restores `data-residual-scope="global"`. A residual filter toggle (`.residual-filter-toggle` / `data-residual-filter-toggle`) on the legend dims non-residual-bearing nodes when `data-residual-filter="on"` (RF1–RF3); Trace `R` / `r` flips the same filter via `toggleTrajResidualFilter` (RK1–RK3; Map keeps PATH). Passport mirrors the same shared `trajResidualFilter` on sticky residual chrome (PM1–PM3). Leaving Trace/Passport for another desk clears the filter so it does not leak (WL1–WL3); Trace↔Passport hops keep shared sync. When the filter is ON and zero nodes bear residual gated writes (e.g. Passport gate approved), Trace shows residual-filter empty chrome (`.traj-empty.residual-filter-empty` / `data-traj-residual-filter-empty`) with a Clear residual filter affordance (`data-residual-filter-clear`) (FE1–FE3); empty Clear uses the same `:focus-visible` outline ring as Trace legend / Passport sticky clear chips (CFV1–CFV3). Screenshot `verification/residual-filter-clear-focus-visible.png`. Residual-filter toggles (`.residual-filter-toggle` / `data-residual-filter-toggle`) use the same ADE chrome `:focus-visible` outline themed to warning residual (TFV1–TFV3). Screenshot `verification/residual-filter-toggle-focus-visible.png`. When the filter is ON and residual-bearing nodes exist, Trace legend shows a Clear-filter cue (`.legend-clear-filter` / `data-legend-clear-filter`) distinct from empty chrome (CC1–CC3). When the filter is ON and residual-bearing nodes exist, Trace legend also appends a residual-filter count chip (`.residual-filter-count` / `data-residual-filter-count` / `data-filter-residual-count`) showing N (RFC1–RFC3); Passport sticky mirrors the same N. A dedicated polite aria-live region `#residualFilterLive` / `[data-residual-filter-live]` announces `Residual filter on, N matching` / `Residual filter off` via `syncResidualFilterLive` without replacing `#toast` (ALR1–ALR3). While the filter stays ON, Trace/Passport paint refreshes the live-region count when residual bearings change without a toggle (Approve / focus / fixture) — no toast on paint (LRP1–LRP3). Escape clears the residual filter when ON on Trace/Passport after chrome owners (Keys/Export/…) via `clearTrajResidualFilter` (ESC1–ESC3). Screenshot `verification/residual-filter-escape-clear.png`. When filter ON + bearings, residual-filter count chips are keyboard-reachable (`tabindex="0"` `role="status"`) with warning-themed `:focus-visible` (CCF1–CCF3); Enter/Space does not clear. Screenshot `verification/residual-filter-count-chip-focus.png`. When filter ON, count chips use pressed/ON chrome matching the residual-filter toggle inset/28% mix (FHP1–FHP3); legend host `data-residual-filter="on"` outline is shared with Passport sticky (HOP1–HOP3). Screenshot `verification/residual-filter-count-host-parity.png`. Host ON cue cross-parity proof `verification/residual-filter-host-on-cue-parity.png`. Clear-filter chips (legend `.legend-clear-filter` / empty `.residual-filter-clear`) get themed `:active`/`.press` flash — darker hoverBackground mix + inset 1px — beyond global scale (CAF1–CAF3). Proof `verification/residual-filter-clear-active-flash.png`. Residual-filter count chips toast a non-clearing hint on Enter/Space/click (`flashToast` skip) without clearing (CCT1–CCT3). Proof `verification/residual-filter-count-chip-toast-hint.png`. Clear-filter chips (legend `.legend-clear-filter` / empty `.residual-filter-clear`) toast `Residual filter cleared` (ok) on activate — distinct from Escape `Residuals off` (CLT1–CLT3). Proof `verification/residual-filter-clear-confirm-toast.png`. Residual-filter toggles (`.residual-filter-toggle` / `data-residual-filter-toggle`) get themed `:active`/`.press` flash — darker warning residual mix + inset 1px — beyond global scale (TAF1–TAF3). Proof `verification/residual-filter-toggle-active-flash.png`. After clear-chip activate (legend `.legend-clear-filter` / empty `.residual-filter-clear`), focus returns to the Trace residual-filter toggle still present when OFF (CFR1–CFR3); Escape unchanged. Proof `verification/residual-filter-clear-focus-return.png`.
- Keyboard node-step: `[` / `]` / `←` / `→` / `j` / `k` call the same
  `stepTrajectory` so focus / on-path edges / legend dim stay in sync with
  click-focus (KS1–KS3), dep-list click→focus (DF1–DF3), and directed hop-affordance next → chips (HA1–HA3).
- Empty-state (ES1–ES3): when the fixture has no nodes (`nodes: []` or
  harness `?traceEmpty=1` / `TRAJECTORY_EMPTY_FIXTURE`), `#trajCanvas`
  shows `.traj-empty` chrome (copy + Open Passport `data-ade-hop`) instead
  of a blank DAG. Proof `verification/trajectory-empty-state.png`.
- Engine: embedded `TRAJECTORY_FIXTURE` (`trajectory-fixture.js`),
  overridable by `window.__graphideTrajectory` when
  `isTrajectoryFixture()` passes (harness `?trace=1` loads
  `trajectory-fixture.json`; `?traceEmpty=1` forces the empty fixture).
  `?traj=<id>` seeds focus via `window.__graphideTrajectoryFocus`.

## How to get to it (user POV)

1. Review a folder (or open the explorer harness). The desk lands on
   Overview.
2. Click **Trace** (`#workspaces [data-ws="trace"]`).
3. You should see the fixture Trajectory DAG: strip stats, subtask nodes
   with phase/role/agent chrome, artifact + diff pins (adds/dels), and an
   inspector that fills when you select a node.
4. Hover a diff pin to read +adds/−dels and the artifact path in the tip.
5. Click a pin to focus it; use `[` / `]` / `←` / `→` / `j` / `k` to step
   subtasks. Neighbors stay lit; off-path deps dim (same as click-focus).
   Selected nodes show → next-hop chips; click one (or a detail Next hop) to
   follow a directed edge (HA1–HA3).
6. Use the Trace zoom chrome (`+` / `−` / Fit) or keys `+` / `=` / `−` / `0`
   to scale the DAG; Fit returns to 100%.

The in-tree proof is the embedded fixture (`ade-a1a-fixture` v2).

## Driving it with the harness

```
extension/scripts/webview-harness.html?trace=1&probe=0&ws=trace
extension/scripts/webview-harness.html?trace=1&traj=sub-verify&probe=0
extension/scripts/webview-harness.html?trace=1&traceEmpty=1&probe=0&ws=trace
```

`trace=1` fetches `trajectory-fixture.json` into
`window.__graphideTrajectory` (falls back to the embedded fixture if the
JSON is missing or invalid). It does **not** require a ReviewSnapshot snap
from rust. The default explorer harness also works: click
`[data-ws="trace"]` after boot.

Driver assertions:

- `#workspaces [data-ws="trace"]` is on
- `#trajCanvas[data-testid="trajectory-dag"]` mounts with ≥3 nodes / ≥2 edges
- A1a–A1a3: host + pins; Map LOD idle (`xy=0`)
- TF1–TF5: richer phase/agent/deps/artifact-diff inspector hooks
- PH1–PH3: diff pin hover tip (`#trajPinTip`) with matching adds/dels
- PTC1–PTC3: pin-tip chrome chips, path basename split, pin-anchored place
- TP1–TP3: pin residual / status cue on `#trajPinTip` (unmet deps, hop residual, seal hint); screenshot `verification/trajectory-pin-residual.png`
- EL1–EL3: `#trajEdgeLegend` / `.traj-edge-legend` seq/fork/join chips; stroke styles mirror `.traj-edge.kind-*`; screenshot `verification/trajectory-edge-legend.png`
- FLD1–FLD3: legend focus-dim — selected node dims off-path `.traj-legend-chip` (keeps on-path chips readable); screenshot `verification/trajectory-legend-focus-dim.png`
- KS1–KS3: keyboard node-step (ArrowRight / `]`) advances focus; on-path edges + legend chips stay in sync with click-focus; screenshot `verification/trajectory-keyboard-step.png`
- DF1–DF3: Trace detail dep-list click→focus — `[data-traj-dep]` / `data-ade-dep-focus` sets `trajSelectedId` via `focusTrajectoryDep`; on-path / legend dim / keyboard step stay in sync; screenshot `verification/trajectory-dep-list-focus.png`
- HA1–HA3: Trace hop-affordance — selected-node `.traj-hop-next` / detail Next hops `[data-traj-next]` / `data-ade-hop-next` hop along directed edges via `hopTrajectoryNext` / `trajOutgoingIds` (does not change `stepTrajectory` array-order); screenshot `verification/trajectory-hop-affordance.png`
- AR1–AR3 (shared with Passport): focused-traj neighbor nodes mapped to residual Passport gatedWrites carry `data-traj-adj-residual` / `.traj-adj-residual`; proof `verification/passport-traj-adjacent-residual.png`
- AL1–AL3: Trace adj-residual legend chips — when focus has residual neighbors, `#trajEdgeLegend` appends `.traj-legend-chip.adj-residual` / `data-adj-residual="1"` / `data-node-kind` for those node kinds (`data-adj-residual-count`); Approve clears; proof `verification/trajectory-adj-residual-legend.png`
- LC1–LC3: Trace legend focus-residual count chip — `#trajEdgeLegend` host + `.traj-legend-chip.focus-residual` / `data-focus-residual` / `data-residual-scope="focus"` / `data-focus-residual-count` matching Passport sticky focusN; clear-focus restores global; proof `verification/trajectory-legend-focus-residual.png`
- RF1–RF3: Trace legend residual filter/toggle — `#trajEdgeLegend` `[data-residual-filter-toggle]` dims non-`[data-residual-bearing]` nodes when host `data-residual-filter="on"`; proof `verification/trajectory-legend-residual-filter.png`
- RK1–RK3: Trace residual-filter key — on Trace, `R` / `r` calls `toggleTrajResidualFilter` (same chrome as click); Map keeps `R` PATH; proof `verification/trajectory-residual-filter-key.png`
- WL1–WL3: residual-filter clear-on-ws-leave — leaving Trace/Passport for Map/Slice/etc. clears `trajResidualFilter`; Trace↔Passport hops keep it; proof `verification/residual-filter-ws-leave.png`
- FE1–FE3: residual-filter empty chrome — filter ON + zero residual-bearing nodes shows `.traj-empty.residual-filter-empty` / `data-traj-residual-filter-empty` + Clear affordance; proof `verification/residual-filter-empty.png`
- CFV1–CFV3: empty chrome Clear residual filter keyboard focus shows CC/PCF-matching `:focus-visible` outline; screenshot `verification/residual-filter-clear-focus-visible.png`
- TFV1–TFV3: Trace legend residual-filter toggle keyboard focus shows warning-themed `:focus-visible` outline (1px / offset 1px); Passport sticky toggle mirrors; screenshot `verification/residual-filter-toggle-focus-visible.png`
- CC1–CC3: Trace legend clear-filter cue — filter ON + bearings shows `#trajEdgeLegend` `.legend-clear-filter` / `data-legend-clear-filter="1"` (no empty chrome); click clears via `clearTrajResidualFilter`; proof `verification/trajectory-legend-clear-filter.png`
- RFC1–RFC3: Trace legend residual-filter count chip — filter ON + bearings shows `#trajEdgeLegend` `.residual-filter-count` / `data-residual-filter-count` / `data-filter-residual-count` (N=bearing count); OFF/empty hides; Passport sticky mirrors; proof `verification/trajectory-legend-residual-filter-count.png`
- ALR1–ALR3: dedicated residual-filter aria-live — `#residualFilterLive[data-residual-filter-live]` (`aria-live="polite"` / `role="status"` / `.sr-only`) text `Residual filter on, N matching` / `Residual filter off`; toast Residuals on/off unchanged; proof `verification/residual-filter-aria-live.png`
- LRP1–LRP3: residual-filter live count paint refresh — filter ON + Trace/Passport paint after bearing change (e.g. Approve) updates `#residualFilterLive` N without toast; OFF stays off across paint; proof `verification/residual-filter-live-paint-refresh.png`
- ESC1–ESC3: Escape clears residual filter when ON on Trace (after Keys/Export/chrome owners); OFF no-op; proof `verification/residual-filter-escape-clear.png`
- CCF1–CCF3: Trace legend residual-filter count chip keyboard focus (`tabindex="0"` `role="status"` + warning `:focus-visible`); Passport sticky mirrors; Enter/Space no clear; proof `verification/residual-filter-count-chip-focus.png`
- FHP1–FHP3: Trace legend residual-filter count chip pressed/ON visual parity with toggle (inset + 28% warning mix) when `#trajEdgeLegend[data-residual-filter=on]`; Passport sticky mirrors; proof `verification/residual-filter-count-host-parity.png`
- HOP1–HOP3: Trace↔Passport residual-filter host ON cue cross-parity — shared warning outline 1px / offset 2px on `#trajEdgeLegend` + `.passport-residual` when `data-residual-filter=on` (Passport ON inset removed); proof `verification/residual-filter-host-on-cue-parity.png`
- CAF1–CAF3: clear-filter `:active`/`.press` flash parity — legend clear + empty Clear themed darker hoverBackground mix + inset 1px beyond global scale; proof `verification/residual-filter-clear-active-flash.png`
- CCT1–CCT3: residual-filter count chip Enter/Space/click non-clearing toast hint (filter stays ON); proof `verification/residual-filter-count-chip-toast-hint.png`
- CLT1–CLT3: clear-chip confirm toast — legend/empty Clear → `Residual filter cleared` (ok); Escape keeps `Residuals off`; proof `verification/residual-filter-clear-confirm-toast.png`
- TAF1–TAF3: residual-filter toggle `:active`/`.press` flash parity — Trace legend toggle themed darker warning mix + inset 1px beyond global scale (OFF and ON); Passport sticky mirrors; proof `verification/residual-filter-toggle-active-flash.png`
- CFR1–CFR3: clear-chip focus return — after legend/empty Clear, focus moves to `#trajEdgeLegend [data-residual-filter-toggle]`; Passport sticky mirrors; Escape unchanged; proof `verification/residual-filter-clear-focus-return.png`
- screenshots `verification/trajectory-dag.png`,
  `verification/trajectory-focus.png`,
  `verification/trajectory-fixtures.png`,
  `verification/trajectory-pin-hover.png`, and
  `verification/trajectory-pin-tip-chrome.png`, and
  `verification/trajectory-pin-residual.png`, and
  `verification/trajectory-edge-legend.png`, and
  `verification/trajectory-legend-focus-dim.png`, and
  `verification/trajectory-keyboard-step.png`, and
  `verification/trajectory-empty-state.png`, and
  `verification/trajectory-zoom-chrome.png`, and
  `verification/trajectory-hop-affordance.png`, and
  `verification/trajectory-legend-residual-filter.png`, and
  `verification/trajectory-residual-filter-key.png`, and
  `verification/residual-filter-ws-leave.png` are not black frames
- ZC1–ZC3: `#trajZoomBar` visible; zoom in changes `data-traj-scale` / `#trajZoomPct` off 100%; Fit resets to 1 / 100%; screenshot `verification/trajectory-zoom-chrome.png`
- `.graphide/stamps/` is still empty

## Gotchas

- Trace↔Passport context hops: see [trace-passport-deeplink.md](trace-passport-deeplink.md)
  (`?traj=` / `?gate=` / `data-ade-hop`).
- Trace is the cognition DAG. Passport is the upstream sign-off gate.
  Delta is parent vs head. Do not merge them.
- Fixture-only in v0. Do not invent a live agent write bus on Trace.
- Keep existing A1a node ids used by deep-link (`sub-verify`, etc.).
- Product hooks: `[data-ws="trace"]`, `#trajCanvas`,
  `data-testid="trajectory-dag"`, `.traj-node`, `.traj-edge`,
  `[data-traj-pin]`, `#trajDetail`, `[data-traj-dep]` / `data-ade-dep-focus` / `focusTrajectoryDep`,
  `.traj-hop-next` / `[data-traj-next]` / `data-ade-hop-next` / `hopTrajectoryNext` / `trajOutgoingIds`,
  `[data-artifact-diff]`, `[data-phase]`, `[data-agent]`, `[data-deps]`,
  `#trajPinTip` / `[data-traj-pin-tip]`, `.traj-pin-tip-chip`,
  `[data-tip-art-base]`, `data-tip-place`, `.traj-pin-tip-residual` /
  `data-tip-residual` / `data-residual-status` / `data-residual-deps` /
  `data-residual-hops` / `data-residual-seal`, keyboard step via `stepTrajectory`
  (`[` / `]` / arrows / `j` `k`), `.traj-empty` /
  `[data-traj-empty-chrome]` / `?traceEmpty=1` empty-state,
  `#trajZoomBar` / `#trajScaleLayer` / `data-traj-scale` zoom chrome
  (`+` / `−` / `0`), residual filter toggle + Trace `R`/`r` → `toggleTrajResidualFilter`,
  residual-filter clear-on-ws-leave via `setWorkspace` / `ADE_RESIDUAL_WS`,
  residual-filter empty chrome via `renderResidualFilterEmptyChrome` / `clearTrajResidualFilter`; legend clear-filter cue via `legendClearFilterCue` / `data-legend-clear-filter` when ON + bearings.
- Digit keys stay 1–9 on the first nine workspaces. Trace is click-only
  beyond that (same as Passport).
