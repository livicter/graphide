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
- Inspector also shows phase / agent / duration, a deps list
  (`[data-traj-dep]` under `[data-traj-deps]`), and artifact-diff
  adds/dels (`[data-artifact-diff]`).
- Edges carry `data-from` / `data-to` / `data-kind` (`seq|fork|join`) and
  optional `data-label`. Focus dims off-path deps.
- Engine: embedded `TRAJECTORY_FIXTURE` (`trajectory-fixture.js`),
  overridable by `window.__graphideTrajectory` when
  `isTrajectoryFixture()` passes (harness `?trace=1` loads
  `trajectory-fixture.json`). `?traj=<id>` seeds focus via
  `window.__graphideTrajectoryFocus`.

## How to get to it (user POV)

1. Review a folder (or open the explorer harness). The desk lands on
   Overview.
2. Click **Trace** (`#workspaces [data-ws="trace"]`).
3. You should see the fixture Trajectory DAG: strip stats, subtask nodes
   with phase/role/agent chrome, artifact + diff pins (adds/dels), and an
   inspector that fills when you select a node.
4. Click a pin to focus it; use `[` / `]` to step subtasks. Neighbors stay
   lit; off-path deps dim.

The in-tree proof is the embedded fixture (`ade-a1a-fixture` v2).

## Driving it with the harness

```
extension/scripts/webview-harness.html?trace=1&probe=0&ws=trace
extension/scripts/webview-harness.html?trace=1&traj=sub-verify&probe=0
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
- screenshots `verification/trajectory-dag.png`,
  `verification/trajectory-focus.png`, and
  `verification/trajectory-fixtures.png` are not black frames
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
  `[data-traj-pin]`, `#trajDetail`, `[data-traj-dep]`,
  `[data-artifact-diff]`, `[data-phase]`, `[data-agent]`, `[data-deps]`.
- Digit keys stay 1–9 on the first nine workspaces. Trace is click-only
  beyond that (same as Passport).
