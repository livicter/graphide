const vscode = acquireVsCodeApi();
const canvas = document.getElementById("canvas");
const meta = document.getElementById("meta");
const coverage = document.getElementById("coverage");
const tabs = document.getElementById("tabs");
const status = document.getElementById("status");
const prompt = document.getElementById("prompt");
const reviewBtn = document.getElementById("reviewBtn");
const backBtn = document.getElementById("backBtn");

reviewBtn.onclick = () => startReview();
backBtn.onclick = () => vscode.postMessage({ type: "back" });
prompt.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    startReview();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Backspace" && document.activeElement !== prompt) {
    e.preventDefault();
    vscode.postMessage({ type: "back" });
  }
});

function startReview() {
  const flows = prompt.value
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  vscode.postMessage({ type: "review", flows });
}

window.addEventListener("message", (event) => {
  const msg = event.data;
  if (msg.type === "empty") {
    setBusy(false);
    backBtn.disabled = true;
    canvas.innerHTML =
      '<div class="empty"><b>Review any repo.</b><div>Open a workspace, optionally type <code>name=hit,hit</code>, then Review. A language exists when a plugin can extract it.</div></div>';
    meta.textContent = "";
    coverage.textContent = "";
    tabs.innerHTML = "";
    status.textContent = "";
    return;
  }
  if (msg.type === "loading") {
    setBusy(true);
    canvas.innerHTML = '<div class="empty pulse">' + esc(msg.text || "Working…") + "</div>";
    status.textContent = "extracting…";
    return;
  }
  if (msg.type === "error") {
    setBusy(false);
    canvas.innerHTML = '<div class="empty error">' + esc(msg.text) + "</div>";
    status.textContent = "failed";
    return;
  }
  setBusy(false);
  backBtn.disabled = !msg.depth;
  if (msg.type === "flowchart") renderFlowchart(msg);
  if (msg.type === "inner") renderInner(msg);
});

function setBusy(on) {
  reviewBtn.disabled = on;
  prompt.disabled = on;
}

function idVal(id) {
  if (id && typeof id === "object" && "0" in id) return String(id[0]);
  return String(id);
}
function sameId(a, b) {
  return idVal(a) === idVal(b);
}
function fqnOf(graph, id) {
  const n = (graph.nodes || []).find((x) => sameId(x.id, id));
  return n ? n.fqn : String(id);
}
function kindOf(graph, id) {
  const n = (graph.nodes || []).find((x) => sameId(x.id, id));
  return n ? n.kind : "";
}
function shortOf(fqn) {
  return String(fqn || "")
    .split(/::|\./)
    .pop();
}
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTabs(flows, current) {
  tabs.innerHTML = (flows || [])
    .map(
      (f) =>
        '<button class="tab' +
        (f.name === current ? " on" : "") +
        '" data-flow="' +
        esc(f.name) +
        '">' +
        esc(f.name) +
        "</button>"
    )
    .join("");
  tabs.querySelectorAll(".tab").forEach((el) => {
    el.onclick = () => vscode.postMessage({ type: "selectFlow", flow: el.getAttribute("data-flow") });
  });
}

function renderStats(msg) {
  const g = msg.graph || {};
  const s = msg.stats || {};
  const bits = [];
  if (g.nodes) bits.push(g.nodes.length + " nodes");
  if (g.edges) bits.push(g.edges.length + " edges");
  if (s.files) bits.push(s.files + " files");
  if (s.elapsed_ms != null) bits.push(s.elapsed_ms + "ms");
  if (msg.plugin) bits.push(msg.plugin);
  status.textContent = bits.join(" · ");
}

function renderFlowchart(msg) {
  const flow = msg.flow;
  renderTabs(msg.flows, flow && flow.name);
  renderStats(msg);
  renderCoverage(msg.coverage, msg.findings, msg.graph);
  if (!flow) {
    meta.innerHTML = "No proposed flows. Type a prompt or add <code>flows.toml</code>.";
    canvas.innerHTML =
      '<div class="empty">Graph is ready (' +
      (msg.graph?.nodes?.length || 0) +
      " nodes). Prompt a story to slice it.</div>";
    return;
  }
  meta.innerHTML =
    '<span class="crumb">Review</span> / <b>' +
    esc(flow.name) +
    "</b> · " +
    (flow.tree?.nodes || []).length +
    " on tree";

  const treeHtml = renderSteiner(flow, msg.graph);
  const runHtml = renderRuns(flow, msg);
  canvas.innerHTML =
    '<div class="flow-title">Steiner slice</div>' +
    treeHtml +
    (runHtml ? '<div class="flow-title" style="margin-top:18px">Subsystem runs — click to enter</div>' + runHtml : "");
}

function renderSteiner(flow, graph) {
  const nodes = flow.tree?.nodes || [];
  const edges = flow.tree?.edges || [];
  if (!nodes.length) return '<div class="empty">Empty tree.</div>';
  const ids = nodes.map(idVal);
  const incoming = Object.fromEntries(ids.map((id) => [id, 0]));
  const outs = Object.fromEntries(ids.map((id) => [id, []]));
  for (const e of edges) {
    const a = idVal(e.from),
      b = idVal(e.to);
    if (!(a in incoming) || !(b in incoming)) continue;
    incoming[b] += 1;
    outs[a].push(b);
  }
  let frontier = ids.filter((id) => incoming[id] === 0);
  if (!frontier.length) frontier = [ids[0]];
  const level = {},
    seen = new Set(),
    q = frontier.map((id) => [id, 0]);
  while (q.length) {
    const [id, d] = q.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    level[id] = d;
    for (const n of outs[id] || []) q.push([n, d + 1]);
  }
  for (const id of ids) if (!(id in level)) level[id] = 0;
  const buckets = [];
  for (const id of ids) {
    const d = level[id];
    while (buckets.length <= d) buckets.push([]);
    buckets[d].push(id);
  }
  const W = 640,
    H = Math.max(220, buckets.reduce((m, c) => Math.max(m, c.length), 1) * 72 + 40);
  const colW = W / Math.max(buckets.length, 1);
  const pos = {};
  buckets.forEach((col, i) =>
    col.forEach((id, j) => {
      pos[id] = { x: colW * (i + 0.5), y: (H / (col.length + 1)) * (j + 1) };
    })
  );
  let svg = '<svg class="steiner" viewBox="0 0 ' + W + " " + H + '">';
  for (const e of edges) {
    const a = pos[idVal(e.from)],
      b = pos[idVal(e.to)];
    if (!a || !b) continue;
    const mx = (a.x + b.x) / 2,
      my = (a.y + b.y) / 2 - 8;
    svg +=
      '<path class="edge" d="M' +
      a.x +
      "," +
      a.y +
      " C" +
      mx +
      "," +
      a.y +
      " " +
      mx +
      "," +
      b.y +
      " " +
      b.x +
      "," +
      b.y +
      '" />';
    svg += '<text class="ekind" x="' + mx + '" y="' + my + '" text-anchor="middle">' + esc(e.kind) + "</text>";
  }
  for (const id of nodes) {
    const p = pos[idVal(id)];
    if (!p) continue;
    const type = kindOf(graph, id) === "Type";
    const label = shortOf(fqnOf(graph, id));
    const w = Math.max(120, Math.min(200, 8 * label.length + 24));
    svg +=
      '<rect class="node-box' +
      (type ? " type" : "") +
      '" x="' +
      (p.x - w / 2) +
      '" y="' +
      (p.y - 20) +
      '" width="' +
      w +
      '" height="40" rx="5" data-id="' +
      idVal(id) +
      '" />';
    svg += '<text class="kind" x="' + p.x + '" y="' + (p.y - 6) + '" text-anchor="middle">' + esc(kindOf(graph, id)) + "</text>";
    svg +=
      '<text class="label' +
      (type ? " type" : "") +
      '" x="' +
      p.x +
      '" y="' +
      (p.y + 10) +
      '" text-anchor="middle">' +
      esc(label) +
      "</text>";
  }
  svg += "</svg>";
  return svg;
}

function renderRuns(flow, msg) {
  const fc = flow.flowchart || { runs: [], spine: [], positions: [] };
  if (!fc.runs || fc.runs.length < 2) return "";
  const pos = {};
  for (const p of fc.positions || []) pos[idVal(p.run)] = p;
  let maxX = 200,
    maxY = 120;
  for (const p of fc.positions || []) {
    maxX = Math.max(maxX, p.x + 220);
    maxY = Math.max(maxY, p.y + 100);
  }
  const bubbleLabel = {};
  for (const b of msg.bubbles || []) bubbleLabel[idVal(b.id)] = b.label;
  let html = '<div class="chart" style="width:' + maxX + "px;height:" + maxY + 'px">';
  html += '<svg class="edges" viewBox="0 0 ' + maxX + " " + maxY + '">';
  for (const s of fc.spine || []) {
    const a = pos[idVal(s.from)];
    const b = pos[idVal(s.to)];
    if (!a || !b) continue;
    const x1 = a.x + 140,
      y1 = a.y + 28,
      x2 = b.x,
      y2 = b.y + 28;
    html +=
      '<path d="M' +
      x1 +
      "," +
      y1 +
      " C" +
      (x1 + 40) +
      "," +
      y1 +
      " " +
      (x2 - 40) +
      "," +
      y2 +
      " " +
      x2 +
      "," +
      y2 +
      '" />';
  }
  html += "</svg>";
  for (const run of fc.runs || []) {
    const p = pos[idVal(run.id)] || { x: 0, y: 0 };
    const label = bubbleLabel[idVal(run.bubble)] || "run";
    const nodes = (run.nodes || []).map((n) => shortOf(fqnOf(msg.graph, n))).join(" → ");
    html +=
      '<div class="run" style="left:' +
      p.x +
      "px;top:" +
      p.y +
      'px" data-flow="' +
      esc(flow.name) +
      '" data-bubble="' +
      idVal(run.bubble) +
      '">';
    html += '<div class="label">' + esc(shortOf(label)) + "</div>";
    html += '<div class="meta">' + esc(nodes) + "</div></div>";
  }
  html += "</div>";
  queueMicrotask(() => {
    canvas.querySelectorAll(".run").forEach((el) => {
      el.addEventListener("click", () => {
        vscode.postMessage({
          type: "enterRun",
          flow: el.getAttribute("data-flow"),
          bubble: el.getAttribute("data-bubble"),
        });
      });
    });
  });
  return html;
}

function renderInner(msg) {
  const inner = msg.inner || { nodes: [] };
  renderTabs(msg.flow ? [msg.flow] : [], inner.flow);
  renderStats(msg);
  renderCoverage(msg.coverage, msg.findings, null);
  meta.innerHTML =
    '<span class="crumb">Review</span> / ' +
    esc(inner.flow) +
    " / <b>enter</b> · walk lit, siblings grey";
  let html = '<div class="inner-list">';
  for (const n of inner.nodes || []) {
    const cls = n.lit ? "lit" : "grey";
    html +=
      '<div class="inode ' +
      cls +
      '" data-id="' +
      idVal(n.id) +
      '" data-leaf="' +
      (n.is_leaf ? 1 : 0) +
      '" data-flow="' +
      esc(inner.flow) +
      '">';
    html +=
      "<div><b>" +
      esc(shortOf(n.fqn)) +
      '</b> <span class="meta">' +
      esc(n.kind) +
      (n.is_leaf ? " · leaf · source" : " · bubble") +
      (n.distance != null && !n.lit ? " · d" + n.distance : "") +
      "</span></div>";
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
  let html = "Coverage " + changed.length + " changed · " + uncovered.length + " uncovered";
  if (uncovered.length && graph) {
    html +=
      "<ul>" +
      uncovered
        .slice(0, 12)
        .map((id) => '<li class="finding">' + esc(fqnOf(graph, id)) + "</li>")
        .join("") +
      (uncovered.length > 12 ? "<li>…</li>" : "") +
      "</ul>";
  }
  const interesting = (findings || []).filter(
    (f) => f.kind === "UnmatchedHint" || f.kind === "UncoveredNode" || f.kind === "StampBroken"
  );
  if (interesting.length) {
    html +=
      "<ul>" +
      interesting
        .slice(0, 8)
        .map((f) => {
          if (f.kind === "UnmatchedHint")
            return '<li class="finding">unmatched ' + esc(f.fqn) + " in " + esc(f.flow) + "</li>";
          if (f.kind === "UncoveredNode") return '<li class="finding">uncovered ' + esc(f.fqn) + "</li>";
          return '<li class="finding">' + esc(f.kind) + "</li>";
        })
        .join("") +
      "</ul>";
  }
  coverage.innerHTML = html;
}
