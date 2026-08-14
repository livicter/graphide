const vscode = acquireVsCodeApi();
const canvas = document.getElementById("canvas");
const meta = document.getElementById("meta");
const coverage = document.getElementById("coverage");
document.getElementById("reviewBtn").onclick = () => vscode.postMessage({ type: "review" });
document.getElementById("backBtn").onclick = () => vscode.postMessage({ type: "back" });

window.addEventListener("message", (event) => {
  const msg = event.data;
  if (msg.type === "empty") {
    canvas.innerHTML = '<div class="empty">Run Graphide: Review Workspace on a package with flows.toml.</div>';
    meta.textContent = "";
    coverage.textContent = "";
    return;
  }
  if (msg.type === "flowchart") renderFlowchart(msg);
  if (msg.type === "inner") renderInner(msg);
});

function idVal(id) {
  if (id && typeof id === "object" && "0" in id) return String(id[0]);
  return String(id);
}
function sameId(a, b) { return idVal(a) === idVal(b); }
function fqnOf(graph, id) {
  const n = (graph.nodes || []).find((x) => sameId(x.id, id));
  return n ? n.fqn : String(id);
}
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderFlowchart(msg) {
  const flows = msg.flows || (msg.flow ? [msg.flow] : []);
  const flow = msg.flow || flows[0];
  if (!flow) {
    canvas.innerHTML = '<div class="empty">No proposed flows in flows.toml.</div>';
    return;
  }
  let tabs = "";
  if (flows.length > 1) {
    tabs = '<div class="tabs">' + flows.map((f) =>
      '<button class="tab' + (f.name === flow.name ? " on" : "") + '" data-flow="' + esc(f.name) + '">' + esc(f.name) + "</button>"
    ).join("") + "</div>";
  }
  meta.innerHTML = tabs + "Flow <b>" + esc(flow.name) + "</b> · hits " + esc((flow.hits || []).join(", "));
  renderCoverage(msg.coverage, msg.findings, msg.graph);

  const fc = flow.flowchart || { runs: [], spine: [], positions: [] };
  const pos = {};
  for (const p of fc.positions || []) pos[idVal(p.run)] = p;
  let maxX = 200, maxY = 120;
  for (const p of fc.positions || []) {
    maxX = Math.max(maxX, p.x + 220);
    maxY = Math.max(maxY, p.y + 100);
  }
  const bubbleLabel = {};
  for (const b of msg.bubbles || []) bubbleLabel[idVal(b.id)] = b.label;

  let html = '<div class="flow-title">Outermost Steiner flowchart (subsystem runs)</div>';
  html += '<div class="chart" style="width:' + maxX + "px;height:" + maxY + 'px">';
  html += '<svg class="edges" viewBox="0 0 ' + maxX + " " + maxY + '">';
  for (const s of fc.spine || []) {
    const a = pos[idVal(s.from)];
    const b = pos[idVal(s.to)];
    if (!a || !b) continue;
    const x1 = a.x + 140, y1 = a.y + 28, x2 = b.x, y2 = b.y + 28;
    html += '<path d="M' + x1 + "," + y1 + " C" + (x1 + 40) + "," + y1 + " " + (x2 - 40) + "," + y2 + " " + x2 + "," + y2 + '" stroke="var(--vscode-foreground)" fill="none" opacity="0.55" />';
  }
  html += "</svg>";
  for (const run of fc.runs || []) {
    const p = pos[idVal(run.id)] || { x: 0, y: 0 };
    const label = bubbleLabel[idVal(run.bubble)] || ("bubble " + idVal(run.bubble));
    const nodes = (run.nodes || []).map((n) => fqnOf(msg.graph, n).split("::").pop()).join(" -> ");
    html += '<div class="run" style="left:' + p.x + "px;top:" + p.y + 'px" data-flow="' + esc(flow.name) + '" data-bubble="' + idVal(run.bubble) + '">';
    html += '<div class="label">' + esc(label) + "</div>";
    html += '<div class="meta">' + esc(nodes) + "</div></div>";
  }
  html += "</div>";
  canvas.innerHTML = html;
  meta.querySelectorAll(".tab").forEach((el) => {
    el.addEventListener("click", () => {
      vscode.postMessage({ type: "selectFlow", flow: el.getAttribute("data-flow") });
    });
  });
  canvas.querySelectorAll(".run").forEach((el) => {
    el.addEventListener("click", () => {
      vscode.postMessage({
        type: "enterRun",
        flow: el.getAttribute("data-flow"),
        bubble: el.getAttribute("data-bubble"),
      });
    });
  });
}

function renderInner(msg) {
  const inner = msg.inner;
  meta.innerHTML = "Inside bubble <b>" + inner.bubble + "</b> · flow " + esc(inner.flow);
  renderCoverage(msg.coverage, msg.findings, null);
  let html = '<div class="flow-title">Child altitude (walk lit, siblings grey)</div><div class="inner-list">';
  for (const n of inner.nodes || []) {
    const cls = n.lit ? "lit" : "grey";
    const short = (n.fqn || "").split("::").pop();
    html += '<div class="inode ' + cls + '" data-id="' + idVal(n.id) + '" data-leaf="' + (n.is_leaf ? 1 : 0) + '" data-flow="' + esc(inner.flow) + '">';
    html += "<div><b>" + esc(short) + "</b> <span class=\"meta\">" + esc(n.kind) + (n.is_leaf ? " · leaf" : " · bubble") + "</span></div>";
    html += '<div class="meta">' + esc(n.fqn) + "</div></div>";
  }
  html += "</div>";
  canvas.innerHTML = html;
  canvas.querySelectorAll(".inode").forEach((el) => {
    el.addEventListener("click", () => {
      vscode.postMessage({
        type: "enterNode",
        flow: el.getAttribute("data-flow"),
        id: el.getAttribute("data-id"),
        isLeaf: el.getAttribute("data-leaf") === "1",
      });
    });
  });
}

function renderCoverage(cov, findings, graph) {
  const uncovered = (cov && cov.uncovered) || [];
  const changed = (cov && cov.changed) || [];
  let html = "Coverage: " + changed.length + " changed · " + uncovered.length + " uncovered";
  if (uncovered.length && graph) {
    html += "<ul>" + uncovered.map((id) => '<li class="finding">' + esc(fqnOf(graph, id)) + "</li>").join("") + "</ul>";
  } else if (uncovered.length) {
    html += "<ul>" + uncovered.map((id) => '<li class="finding">' + esc(idVal(id)) + "</li>").join("") + "</ul>";
  }
  const interesting = (findings || []).filter((f) =>
    f.kind === "UnmatchedHint" || f.kind === "UncoveredNode" || f.kind === "StampBroken"
  );
  if (interesting.length) {
    html += "<div class='finding'>Findings:</div><ul>" + interesting.map((f) => {
      if (f.kind === "UncoveredNode") return '<li class="finding">uncovered ' + esc(f.fqn) + "</li>";
      if (f.kind === "UnmatchedHint") return '<li class="finding">unmatched ' + esc(f.fqn) + " in " + esc(f.flow) + "</li>";
      return '<li class="finding">' + esc(f.kind) + "</li>";
    }).join("") + "</ul>";
  }
  coverage.innerHTML = html;
}

