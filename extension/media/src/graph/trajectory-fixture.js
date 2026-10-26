/**
 * ADE A1a — fixture-backed read-only execution Trajectory DAG.
 * Subtask nodes + dependency edges + artifact/diff pins for the Trace workspace.
 * Not live agent state; harness-stable for verify A1a*.
 * Polish: richer branch + role/kind metadata for inspector.
 * Explorer: harness ?trace=1 may override via window.__graphideTrajectory;
 * ?traj=<id> seeds subtask focus (window.__graphideTrajectoryFocus).
 */
export const TRAJECTORY_FIXTURE = {
  id: "ade-a1a-fixture",
  title: "Execution trajectory",
  subtitle: "Phase 1 Trace — fixture DAG with deps, artifact pins, and diff pins",
  nodes: [
    {
      id: "sub-plan",
      label: "Plan slice",
      status: "done",
      kind: "plan",
      role: "upstream",
      artifact: "ADE-PLAN.md",
      diff: "",
      note: "Phase 1 scope locked before edits",
      x: 40,
      y: 56,
    },
    {
      id: "sub-edit",
      label: "Edit desk",
      status: "done",
      kind: "edit",
      role: "write",
      artifact: "extension/media/src/graph/desk.js",
      diff: "+traj",
      note: "Trajectory paint + bind on Review desk",
      x: 260,
      y: 56,
    },
    {
      id: "sub-fixture",
      label: "Load fixtures",
      status: "done",
      kind: "fixture",
      role: "sim",
      artifact: "extension/media/src/graph/trajectory-fixture.js",
      diff: "+nodes",
      note: "Parallel sim path: richer subtasks / deps",
      x: 260,
      y: 200,
    },
    {
      id: "sub-verify",
      label: "Verify A1a",
      status: "running",
      kind: "verify",
      role: "gate",
      artifact: "scripts/verify-graphide.js",
      diff: "+A1a",
      note: "Immutable seal + Trace/Passport drivers",
      x: 500,
      y: 56,
    },
    {
      id: "sub-seal",
      label: "Seal specs",
      status: "done",
      kind: "harness",
      role: "gate",
      artifact: ".cursor/skills/verify-graphide/references/immutable-specs.lock",
      diff: "+I0-I5",
      note: "SHA-256 lock on protected assert / feature maps",
      x: 500,
      y: 200,
    },
    {
      id: "sub-pr",
      label: "Draft PR",
      status: "pending",
      kind: "ship",
      role: "downstream",
      artifact: "pull-request",
      diff: "",
      note: "Draft only — no undraft / merge",
      x: 740,
      y: 120,
    },
  ],
  edges: [
    { id: "e-plan-edit", from: "sub-plan", to: "sub-edit", kind: "seq" },
    { id: "e-plan-fixture", from: "sub-plan", to: "sub-fixture", kind: "fork" },
    { id: "e-edit-verify", from: "sub-edit", to: "sub-verify", kind: "seq" },
    { id: "e-fixture-seal", from: "sub-fixture", to: "sub-seal", kind: "seq" },
    { id: "e-verify-pr", from: "sub-verify", to: "sub-pr", kind: "join" },
    { id: "e-seal-pr", from: "sub-seal", to: "sub-pr", kind: "join" },
  ],
};

export function trajectoryNodeById(id) {
  return TRAJECTORY_FIXTURE.nodes.find((n) => n.id === id) || null;
}
