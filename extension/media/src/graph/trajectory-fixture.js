/**
 * ADE A1a — fixture-backed read-only execution Trajectory DAG.
 * Subtask nodes + dependency edges + artifact/diff pins for the Trace workspace.
 * Not live agent state; harness-stable for verify A1a*.
 */
export const TRAJECTORY_FIXTURE = {
  id: "ade-a1a-fixture",
  title: "Execution trajectory",
  nodes: [
    {
      id: "sub-plan",
      label: "Plan slice",
      status: "done",
      artifact: "ADE-PLAN.md",
      diff: "",
      x: 40,
      y: 48,
    },
    {
      id: "sub-edit",
      label: "Edit desk",
      status: "done",
      artifact: "extension/media/src/graph/desk.js",
      diff: "+traj",
      x: 260,
      y: 48,
    },
    {
      id: "sub-verify",
      label: "Verify A1a",
      status: "running",
      artifact: "scripts/verify-graphide.js",
      diff: "+A1a",
      x: 480,
      y: 48,
    },
    {
      id: "sub-pr",
      label: "Draft PR",
      status: "pending",
      artifact: "pull-request",
      diff: "",
      x: 700,
      y: 48,
    },
  ],
  edges: [
    { id: "e-plan-edit", from: "sub-plan", to: "sub-edit" },
    { id: "e-edit-verify", from: "sub-edit", to: "sub-verify" },
    { id: "e-verify-pr", from: "sub-verify", to: "sub-pr" },
  ],
};

export function trajectoryNodeById(id) {
  return TRAJECTORY_FIXTURE.nodes.find((n) => n.id === id) || null;
}
