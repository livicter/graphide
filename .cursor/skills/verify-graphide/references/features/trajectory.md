# Trajectory

Fixture-backed agent execution Trajectory DAG (ADE Phase 1.1 Graph of
Trace v0). Nodes are Thought → Tool Call → Code Edit → Validation Step
with `necessitated_by` edges. Not a live agent wire and not Sequence /
Lifecycle / Architecture Delta.

## Sub-features

- Workspace tab `#workspaces [data-ws="trajectory"]`. Same explorer nav
  row as Lifecycle — not a second chrome row. Click-only (no digit key;
  keys 1–9 stay the first nine workspaces).
- Ordered steps `#trajSteps .traj-step` with `data-traj-i`, `data-traj-id`,
  `data-traj-kind` (`thought` / `tool` / `edit` / `validate`).
- Canvas `#trajCanvas` mounts XYFlow (`#trajCanvas .react-flow`,
  `.react-flow__node`) for the fixture DAG. Each `.vnode` carries
  `data-traj-id` and reuses DerivedNode shapes.
- Artifact pin `#trajPin` — clicking a step or canvas node shows that
  subtask's fixture artifact / diff stub (`data-traj-pin`).
- Engine: embedded `TRAJECTORY_FIXTURE` in desk.js, overridable by
  `window.__graphideTrajectory` when `isTrajectory()` passes (harness
  `?trajectory=1` loads `trajectory-fixture.json`). No live agent stream.
- Stamp / skip stay human. Trajectory never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder (or open the explorer harness). The desk lands on
   Overview.
2. Click **Trajectory** (`#workspaces [data-ws="trajectory"]`).
3. You should see a four-step fixture chain, an XYFlow DAG in
   `#trajCanvas`, and a pin panel. Selecting a step updates the pin to
   that subtask's artifact / diff stub.
4. Stamp and Skip remain human attestation for flows — they are not this
   walk.

The in-tree proof is the embedded fixture (`traj-fix-auth-null`): Thought
→ Tool → Edit → Validate for a null-token guard.

## Driving it with the harness

```
extension/scripts/webview-harness.html?trajectory=1&probe=0&ws=trajectory
```

`trajectory=1` fetches `trajectory-fixture.json` into
`window.__graphideTrajectory` (falls back to the embedded fixture if the
JSON is missing or invalid). It does **not** require a ReviewSnapshot snap
from rust.

Driver assertions:

- `#workspaces [data-ws="trajectory"]` is on
- `#trajSteps .traj-step` length `=== 4` and steps are ordered (`data-traj-i`)
- `#trajCanvas .react-flow__node` length `=== 4`
- default pin shows Thought artifact; clicking step `i` updates `#trajPin`
  to that node's `pin.artifact`
- screenshot `verification/trajectory.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- Trajectory is the ADE cognition DAG. Sequence is Steiner callers/callees.
  Lifecycle is the review machine. Delta is parent vs head. Do not merge them.
- Fixture-only in v0. Do not invent a live agent event bus here.
- Plan Passport and the immutable verification harness are later Phase 1
  slices — out of scope for this map.
- Do not add `data-testid` / `data-component`. `[data-ws="trajectory"]`,
  `#trajCanvas`, `#trajSteps`, `#trajPin`, `[data-traj-id]`, `[data-traj-i]`
  are the product hooks.
- Do not vendor a second graph library. XYFlow + DerivedNode only.
- Digit keys stay 1–9 on the first nine workspaces. Trajectory is click-only.
