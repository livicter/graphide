/** Desk herd predicate. Names, marks, and blocked match herdRows / flowMark. */

export function findingKind(f) {
  if (!f) return "";
  if (typeof f.kind === "string") return f.kind;
  return (f.kind && f.kind.kind) || "";
}

export function flowMark(name, skipped, stamps) {
  const skips = skipped || [];
  const rows = stamps || [];
  if (skips.indexOf(name) >= 0) return "skipped";
  const row = rows.find((s) => s && s.name === name);
  if (!row) return "";
  return row.holds ? "holds" : "broken";
}

export function herd(desk) {
  const d = desk || {};
  const names = [];
  const seen = new Set();
  const add = (n) => {
    if (!n || seen.has(n)) return;
    seen.add(n);
    names.push(n);
  };
  (d.flows || []).forEach((f) => add(f && f.name));
  (d.stamps || []).concat(d.snapshotStamps || []).forEach((s) => add(s && (s.name || s.flow)));
  (d.skipped || []).concat(d.snapshotSkipped || []).forEach(add);
  (d.findings || []).forEach((f) => {
    const k = findingKind(f);
    if (k === "UnmatchedHint" || k === "StampBroken") add(f && f.flow);
  });
  const rows = names.map((name) => {
    const mark = flowMark(name, d.skipped, d.stamps);
    const needs =
      mark === "broken" ||
      (d.findings || []).some((f) => {
        if (!f || f.flow !== name) return false;
        const k = findingKind(f);
        return k === "UnmatchedHint" || k === "StampBroken";
      });
    let state = "idle";
    if (needs) state = "blocked";
    else if (mark === "holds" || mark === "skipped") state = "done";
    return { name, state };
  });
  if (d.progress) rows.unshift({ name: "review", state: "working" });
  return rows;
}
