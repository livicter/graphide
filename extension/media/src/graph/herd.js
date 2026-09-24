/** Herd cut states. Desk rail and the agent command both call this. */

export function programKeyOf(p) {
  return (p.kind || "") + "\0" + (p.name || "") + "\0" + (p.root || "");
}

function shortOf(fqn) {
  return String(fqn || "")
    .split(/::|\./)
    .pop();
}

function shortFile(file) {
  const f = String(file || "").replace(/\\/g, "/");
  const parts = f.split("/");
  return parts.length > 2 ? parts.slice(-2).join("/") : f;
}

export function findingKindOf(f) {
  if (!f) return "";
  if (typeof f.kind === "string") return f.kind;
  return (f.kind && f.kind.kind) || "";
}

export function findingTitle(f) {
  const k = findingKindOf(f);
  if (k === "StampBroken") return "StampBroken · " + (f.flow || "");
  if (k === "UnmatchedHint") return "UnmatchedHint · " + (f.flow || "") + " · " + shortOf(f.fqn || "");
  if (k === "UncoveredNode") return "UncoveredNode · " + shortOf(f.fqn || "");
  if (k === "DuplicateFqn") return "DuplicateFqn · " + shortOf(f.fqn || "");
  if (k === "KindMismatch") return "KindMismatch · " + (f.edge || "");
  if (k === "SpanlessDrop") return "SpanlessDrop · " + shortFile(f.file || "");
  if (k === "PluginBug") return "PluginBug";
  return k || "finding";
}

export function flowMark(name, session) {
  const skipped = (session && session.skipped) || [];
  const stamps = (session && session.stamps) || [];
  if (skipped.indexOf(name) >= 0) return "skipped";
  const row = stamps.find((s) => s.name === name);
  if (!row) return "";
  return row.holds ? "holds" : "broken";
}

export function decisionRecords(snapshot, session) {
  const skipped = (session && session.skipped) || [];
  const stamps = (session && session.stamps) || [];
  const rows = [];
  const seen = new Set();
  for (const s of stamps.concat((snapshot && snapshot.stamps) || [])) {
    const name = s.name || s.flow;
    if (!name || seen.has("stamp:" + name)) continue;
    seen.add("stamp:" + name);
    rows.push({
      kind: "stamp",
      flow: name,
      verdict: s.holds ? "holds" : "broken",
      title: name,
      body: s.holds ? "Human stamp still holds on this graph." : "Stamp no longer matches the derived tree.",
      outcome: s.holds ? "approved" : "rejected",
    });
  }
  for (const name of skipped.concat((snapshot && snapshot.skipped) || [])) {
    if (!name || seen.has("skip:" + name)) continue;
    seen.add("skip:" + name);
    rows.push({
      kind: "skip",
      flow: name,
      verdict: "skipped",
      title: name,
      body: "Skipped this session — no stamp written.",
      outcome: "deferred",
    });
  }
  for (const f of (snapshot && snapshot.findings) || []) {
    const k = findingKindOf(f);
    if (k !== "StampBroken" && k !== "UnmatchedHint") continue;
    rows.push({
      kind: "finding",
      flow: f.flow || "",
      verdict: k === "StampBroken" ? "broken" : "hint",
      title: findingTitle(f),
      body:
        k === "StampBroken"
          ? (f.added || []).length + " added · " + (f.removed || []).length + " removed hops"
          : String(f.fqn || "unmatched hit"),
      outcome: k === "StampBroken" ? "rejected" : "pending",
      added: f.added || [],
      removed: f.removed || [],
    });
  }
  return rows;
}

export function flowNeedsHuman(name, snapshot, session) {
  const mark = flowMark(name, session);
  const blocked = decisionRecords(snapshot, session).some(
    (r) =>
      r.flow === name &&
      (r.outcome === "pending" || r.outcome === "rejected" || r.verdict === "broken" || r.verdict === "hint")
  );
  return blocked || mark === "broken";
}

export function herdActiveFlowName(snapshot, session, flowName, defaultRunName) {
  const open = (name) =>
    !!name && flowMark(name, session) !== "holds" && flowMark(name, session) !== "skipped" && !flowNeedsHuman(name, snapshot, session);
  if (open(flowName)) return flowName;
  if (open(defaultRunName)) return defaultRunName;
  return "";
}

export function herdFlowState(name, active, snapshot, session) {
  const mark = flowMark(name, session);
  if (flowNeedsHuman(name, snapshot, session)) return "blocked";
  if (mark === "holds") return "done";
  if (mark === "skipped") return "idle";
  if (active && name === active) return "working";
  return "idle";
}

export function herdCuts(input) {
  const snapshot = input && input.snapshot;
  if (!snapshot) return [];
  const session = {
    skipped: input.skipped || [],
    stamps: input.stamps || [],
  };
  const programs = snapshot.programs || [];
  const seen = new Set();
  const names = [];
  for (const f of snapshot.flows || []) {
    if (!f.name || seen.has(f.name)) continue;
    seen.add(f.name);
    names.push(f.name);
  }
  for (const n of session.skipped.concat(snapshot.skipped || [])) {
    if (!n || seen.has(n)) continue;
    seen.add(n);
    names.push(n);
  }
  const active = herdActiveFlowName(snapshot, session, input.flowName || "", input.defaultRunName || "");
  const rank = { blocked: 0, working: 1, idle: 2, done: 3 };
  const cuts = names.map((name) => ({
    kind: "flow",
    flow: name,
    label: name,
    state: herdFlowState(name, active, snapshot, session),
  }));
  const program = input.program || null;
  programs.forEach((p, i) => {
    const on = program ? programKeyOf(program) === programKeyOf(p) : programs.length === 1;
    cuts.push({
      kind: "program",
      index: i,
      label: ((p.kind ? p.kind + " " : "") + (p.name || "program")).trim(),
      state: on ? "working" : "idle",
    });
  });
  cuts.sort((a, b) => rank[a.state] - rank[b.state] || a.label.localeCompare(b.label));
  return cuts;
}

export function defaultRunName(snapshot, flowName) {
  const flows = (snapshot && snapshot.flows) || [];
  const named = flows.find((f) => f.name === flowName);
  const pick =
    flows.find((f) => f.name === "control-flow") ||
    flows.find((f) => f.name === "overview") ||
    named ||
    flows[0] ||
    null;
  return (pick && pick.name) || "";
}

/** Flow the agent focused. `--focus` wins; otherwise the desk default run. */
export function focusedCut(cuts, focus) {
  const flows = (cuts || []).filter((c) => c.kind === "flow");
  if (focus) return flows.find((c) => c.flow === focus || c.label === focus) || null;
  return flows[0] || null;
}
