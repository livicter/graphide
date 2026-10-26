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
  kinds stay readable; off-path kinds get `.dim` (FLD1–FLD3). When residual neighbors exist, adj-residual node-kind chips (`.adj-residual` / `data-adj-residual`) append after edge chips (AL1–AL3).
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
  `verification/trajectory-hop-affordance.png` are not black frames
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
  (`+` / `−` / `0`).
- Digit keys stay 1–9 on the first nine workspaces. Trace is click-only
  beyond that (same as Passport).
