const vscode = acquireVsCodeApi();
const canvas = document.getElementById("canvas");
const meta = document.getElementById("meta");
const coverage = document.getElementById("coverage");
const tabs = document.getElementById("tabs");
const status = document.getElementById("status");
const prompt = document.getElementById("prompt");
const reviewBtn = document.getElementById("reviewBtn");
const cancelBtn = document.getElementById("cancelBtn");
const stampBtn = document.getElementById("stampBtn");
const skipBtn = document.getElementById("skipBtn");
const backBtn = document.getElementById("backBtn");
const progressEl = document.getElementById("progress");
const progressFill = document.getElementById("progressFill");
const progressBar = document.getElementById("progressBar");
const progressLabel = document.getElementById("progressLabel");
const progressCounts = document.getElementById("progressCounts");
const progressPct = document.getElementById("progressPct");
const progressTime = document.getElementById("progressTime");
const phasesEl = document.getElementById("phases");
const zoomBar = document.getElementById("zoomBar");
const zoomInBtn = document.getElementById("zoomIn");
const zoomOutBtn = document.getElementById("zoomOut");
const zoomFitBtn = document.getElementById("zoomFit");
const zoomPct = document.getElementById("zoomPct");
const tip = document.getElementById("tip");
const workspace = document.getElementById("workspace");
const sourcePane = document.getElementById("sourcePane");
const srcTitle = document.getElementById("srcTitle");
const srcBody = document.getElementById("srcBody");
const srcEditor = document.getElementById("srcEditor");
const srcClose = document.getElementById("srcClose");
const graphBar = document.getElementById("graphBar");
const graphSearch = document.getElementById("graphSearch");
const kindFilters = document.getElementById("kindFilters");
const legendEl = document.getElementById("legend");
const hopCard = document.getElementById("hopCard");
const inspMeta = document.getElementById("inspMeta");
const inspEdges = document.getElementById("inspEdges");
const ledgerPane = document.getElementById("ledgerPane");
const ledgerGrid = document.getElementById("ledgerGrid");
const ledgerMeta = document.getElementById("ledgerMeta");
const workspacesEl = document.getElementById("workspaces");
const egoBtn = document.getElementById("egoBtn");

const WORKSPACES = ["map", "slice", "lineage", "decisions", "registry", "overview", "timeline"];
const LIST_WORKSPACES = { decisions: 1, registry: 1, timeline: 1 };

const PHASE_ORDER = ["walk", "extract", "link", "cluster", "flows"];
const PHASE_ALIAS = {
  start: "walk",
  walk: "walk",
  extract: "extract",
  parent: "extract",
  link: "link",
  preview: "link",
  cluster: "cluster",
  flows: "flows",
  done: "flows",
};

let snapshot = null;
let flowName = null;
let stampRows = [];
let skippedFlows = [];
let stack = [{ kind: "flow" }];
let nodeById = new Map();
let busy = false;
let previewTimer = 0;
let lastTreeKey = "";
let targetPct = 0;
let shownPct = 0;
let barRaf = 0;
let pendingProgress = null;
let progressRaf = 0;
let navToken = 0;
let viewportEl = null;
let cam = { x: 0, y: 0, k: 1 };
let camTo = { x: 0, y: 0, k: 1 };
let camRaf = 0;
let progFocus = 0;
let selectedNodeId = null;
let pathEnds = [];
let explorerWs = "map";
let explorerPinned = false;
let egoMode = false;
let zoomPopReady = false;
let sourceId = null;
let graphFilter = { q: "", kinds: { Function: true, Type: true, Endpoint: true }, program: null, bubble: null };
const CAM_MIN = 0.35;
const CAM_MAX = 6.5;
const BUBBLE_COLORS = ["#4ec9b0", "#569cd6", "#c586c0", "#dcdcaa", "#ce9178", "#9cdcfe", "#d7ba7d", "#3fb950", "#f85149", "#8b949e"];

reviewBtn.onclick = () => startReview();
cancelBtn.onclick = () => {
  setBusy(true);
  progressLabel.textContent = "Cancelling…";
  vscode.postMessage({ type: "cancel" });
};
backBtn.onclick = () => goBack();
prompt.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    startReview();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && busy) {
    e.preventDefault();
    vscode.postMessage({ type: "cancel" });
    return;
  }
  if (e.target && e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
  if (e.key === "Escape" && sourcePane && !sourcePane.hidden) {
    e.preventDefault();
    closeSourcePane();
    return;
  }
  if (stack[stack.length - 1]?.kind === "programs") {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      moveProgFocus(1);
      return;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      moveProgFocus(-1);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      openFocusedProgram();
      return;
    }
    if (e.key === "a" || e.key === "A") {
      e.preventDefault();
      openAllPrograms();
      return;
    }
  }
  if (e.key === "+" || e.key === "=") {
    e.preventDefault();
    zoomBy(1.18);
    return;
  }
  if (e.key === "-" || e.key === "_") {
    e.preventDefault();
    zoomBy(1 / 1.18);
    return;
  }
  if (e.key === "0") {
    e.preventDefault();
    setCamTarget(0, 0, 1);
    return;
  }
  if (e.key === "Backspace") {
    e.preventDefault();
    goBack();
    return;
  }
  if (e.key === "s" || e.key === "S") {
    e.preventDefault();
    requestStamp();
    return;
  }
  if (e.key === "x" || e.key === "X") {
    e.preventDefault();
    requestSkip();
    return;
  }
  if (e.key === "e" || e.key === "E") {
    e.preventDefault();
    setEgoMode(!egoMode);
    return;
  }
  const wsIdx = "1234567".indexOf(e.key);
  if (wsIdx >= 0 && WORKSPACES[wsIdx]) {
    e.preventDefault();
    setWorkspace(WORKSPACES[wsIdx], true);
  }
});
if (zoomInBtn) zoomInBtn.onclick = () => zoomBy(1.2);
if (zoomOutBtn) zoomOutBtn.onclick = () => zoomBy(1 / 1.2);
if (zoomFitBtn) zoomFitBtn.onclick = () => setCamTarget(0, 0, 1);
if (srcClose) srcClose.onclick = () => closeSourcePane();
if (srcEditor)
  srcEditor.onclick = () => {
    if (!sourceId) return;
    const flow = currentFlow();
    vscode.postMessage({ type: "enterNode", flow: flow ? flow.name : "", id: sourceId, isLeaf: true });
  };
if (graphSearch)
  graphSearch.addEventListener("input", () => {
    graphFilter.q = graphSearch.value.trim();
    refreshExplorer();
  });
if (kindFilters)
  kindFilters.querySelectorAll("input").forEach((el) => {
    el.addEventListener("change", () => {
      graphFilter.kinds[el.getAttribute("data-kind")] = el.checked;
      refreshExplorer();
    });
  });
if (workspacesEl) {
  workspacesEl.querySelectorAll("[data-ws]").forEach((el) => {
    el.onclick = () => setWorkspace(el.getAttribute("data-ws"), true);
  });
}
if (egoBtn) egoBtn.onclick = () => setEgoMode(!egoMode);
if (stampBtn) stampBtn.onclick = () => requestStamp();
if (skipBtn) skipBtn.onclick = () => requestSkip();

function startReview() {
  targetPct = 0;
  shownPct = 0;
  lastTreeKey = "";
  showProgress({
    phase: "start",
    label: "Starting review…",
    done: 0,
    total: 0,
    pct: 2,
    elapsed_ms: 0,
  });
  const flows = prompt.value
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  vscode.postMessage({ type: "review", flows });
}

window.addEventListener("message", (event) => {
  const msg = event.data;
  if (msg.type === "empty") {
    snapshot = null;
    finishWork();
    backBtn.disabled = true;
    canvas.className = "";
    canvas.innerHTML =
      '<div class="empty"><b>Review any repo.</b><div>Open a workspace, optionally type <code>name=hit,hit</code>, then Review.</div></div>';
    meta.textContent = "";
    coverage.textContent = "";
    tabs.innerHTML = "";
    status.textContent = "";
    setZoomUi(false);
    hideTip();
    closeSourcePane();
    explorerPinned = false;
    explorerWs = "overview";
    pathEnds = [];
    selectedNodeId = null;
    setGraphChrome(false);
    return;
  }
  if (msg.type === "setup") {
    finishWork();
    setZoomUi(false);
    hideTip();
    canvas.className = "";
    canvas.innerHTML =
      '<div class="empty"><b>Install Graphide once.</b><div>' +
      esc(msg.text || "Builds the local CLI and is only needed the first time.") +
      '</div><button id="installBtn" class="primary">Install</button></div>';
    const btn = document.getElementById("installBtn");
    if (btn) btn.onclick = () => vscode.postMessage({ type: "install" });
    status.textContent = "needs install";
    setGraphChrome(false);
    return;
  }
  if (msg.type === "progress") {
    queueProgress(msg);
    return;
  }
  if (msg.type === "tick") {
    if (progressTime) progressTime.textContent = formatMs(msg.elapsed_ms);
    return;
  }
  if (msg.type === "preview") {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => applyPreview(msg), 40);
    return;
  }
  if (msg.type === "cancelled") {
    clearTimeout(previewTimer);
    finishWork();
    if (snapshot) paint({ animate: "none" });
    status.textContent = "cancelled";
    return;
  }
  if (msg.type === "loading") {
    queueProgress({
      phase: "start",
      label: msg.text || "Working…",
      done: 0,
      total: 0,
      pct: 2,
      elapsed_ms: 0,
    });
    return;
  }
  if (msg.type === "error") {
    clearTimeout(previewTimer);
    finishWork();
    canvas.className = "";
    canvas.innerHTML = '<div class="empty error">' + esc(msg.text) + "</div>";
    status.textContent = "failed";
    setZoomUi(false);
    hideTip();
    return;
  }
  if (msg.type === "source") {
    showSource(msg);
    return;
  }
  if (msg.type === "programs") {
    clearTimeout(previewTimer);
    applyPrograms(msg);
    return;
  }
  if (msg.type === "flowchart" || msg.type === "inner") {
    clearTimeout(previewTimer);
    applySnapshot(msg, msg.type === "inner");
  }
});

function applyPreview(msg) {
  if (!busy) return;
  const flows = (msg.flows || []).map((f) => ({
    ...f,
    flowchart: { runs: [], spine: [], positions: [] },
  }));
  snapshot = {
    flows,
    flow: flows.find((f) => f.name === flowName) || flows[0],
    graph: msg.graph || { nodes: [] },
    bubbles: [],
    coverage: { changed: [], uncovered: [] },
    findings: [],
    plugin: msg.plugin,
    stats: { files: 0, elapsed_ms: msg.elapsed_ms, nodes: msg.nodes, edges: msg.edges },
    preview: true,
  };
  if (!flowName && flows[0]) flowName = flows[0].name;
  stack = [{ kind: "flow" }];
  indexGraph(snapshot.graph);
  paint({ animate: "tree", preview: true, keepCam: !!canvas.querySelector(".stage") });
}

function applyPrograms(msg) {
  snapshot = {
    flows: msg.flows || snapshot?.flows || [],
    flow: snapshot?.flow,
    graph: msg.graph || snapshot?.graph,
    bubbles: msg.bubbles || snapshot?.bubbles || [],
    coverage: msg.coverage,
    findings: msg.findings,
    plugin: msg.plugin,
    stats: msg.stats,
    stamps: msg.stamps || [],
    skipped: msg.skipped || [],
    programs: msg.programs || [],
    program: null,
    snippets: {},
    preview: false,
    inner: null,
    depth: 0,
  };
  stack = [{ kind: "programs" }];
  indexGraph(snapshot.graph);
  stampRows = snapshot.stamps || [];
  skippedFlows = snapshot.skipped || [];
  applyExplorerLanding();
  finishWork();
  paint({ animate: "none" });
}

function applySnapshot(msg, inner) {
  snapshot = {
    flows: msg.flows || (msg.flow ? [msg.flow] : snapshot?.flows) || [],
    flow: msg.flow,
    graph: msg.graph || snapshot?.graph,
    bubbles: msg.bubbles || snapshot?.bubbles || [],
    coverage: msg.coverage,
    findings: msg.findings,
    plugin: msg.plugin,
    stats: msg.stats,
    stamps: msg.stamps || [],
    skipped: msg.skipped || [],
    programs: msg.programs || snapshot?.programs || [],
    program: msg.program || null,
    snippets: msg.snippets || {},
    preview: false,
    inner: inner ? msg.inner : null,
    depth: msg.depth || 0,
  };
  if (msg.flow?.name) flowName = msg.flow.name;
  else if (!flowName && snapshot.flows[0]) flowName = snapshot.flows[0].name;
  if (inner) {
    stack = [
      { kind: "programs" },
      { kind: "flow" },
      { kind: "bubble", flow: msg.inner.flow, bubble: String(msg.inner.bubble) },
    ];
  } else {
    stack = [{ kind: "programs" }, { kind: "flow" }];
  }
  indexGraph(snapshot.graph);
  stampRows = snapshot.stamps || [];
  skippedFlows = snapshot.skipped || [];
  applyExplorerLanding();
  finishWork();
  paint({ animate: lastTreeKey && treeKey(currentFlow()) === lastTreeKey ? "runs" : "all" });
}

function currentFlow() {
  if (!snapshot) return null;
  const named = (snapshot.flows || []).find((f) => f.name === flowName);
  const rich = snapshot.flow && (!flowName || snapshot.flow.name === flowName);
  if (rich && (snapshot.flow.tree?.edges || []).length) return snapshot.flow;
  if (named && (named.tree?.edges || []).length) return named;
  return named || snapshot.flow || snapshot.flows[0];
}

function treeKey(flow) {
  if (!flow?.tree) return "";
  return (flow.tree.nodes || []).map(idVal).join(",");
}

function indexGraph(graph) {
  nodeById = new Map();
  for (const n of graph?.nodes || []) nodeById.set(idVal(n.id), n);
}

function reduceMotion() {
  try {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  } catch (e) {
    return false;
  }
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function setZoomUi(on) {
  if (zoomBar) zoomBar.hidden = !on;
  if (on) updateZoomPct();
}

function setGraphChrome(on) {
  if (graphBar) graphBar.hidden = !on;
  const list = !!LIST_WORKSPACES[explorerWs];
  if (ledgerPane) ledgerPane.hidden = !on || list;
  if (workspace) workspace.classList.toggle("has-ledger", !!(on && !list));
  if (kindFilters) kindFilters.hidden = list;
  if (egoBtn) {
    egoBtn.hidden = !on;
    egoBtn.classList.toggle("on", !!egoMode);
  }
  syncWorkspaces();
}

function syncWorkspaces() {
  if (!workspacesEl) return;
  workspacesEl.querySelectorAll("[data-ws]").forEach((el) => {
    el.classList.toggle("on", el.getAttribute("data-ws") === explorerWs);
  });
}

function isListWorkspace(ws) {
  return !!LIST_WORKSPACES[ws];
}

function defaultRunFlow() {
  const flows = (snapshot && snapshot.flows) || [];
  return (
    flows.find((f) => f.name === "control-flow") ||
    flows.find((f) => f.name === "overview") ||
    currentFlow() ||
    flows[0] ||
    null
  );
}

function defaultLandingWorkspace() {
  return defaultRunFlow() ? "overview" : "map";
}

function applyExplorerLanding() {
  if (explorerPinned) return;
  try {
    const q = new URLSearchParams(location.search || "").get("ws");
    if (q && WORKSPACES.indexOf(q) >= 0) {
      explorerWs = q;
      explorerPinned = true;
      if (q === "lineage" && !egoMode) egoMode = true;
      return;
    }
  } catch (e) {}
  explorerWs = defaultLandingWorkspace();
}

let harnessConsumed = false;
function consumeHarnessActions() {
  let q;
  try {
    q = new URLSearchParams(location.search || "");
  } catch (e) {
    return;
  }
  const drill = q.get("drill") === "1";
  const hop = q.get("hop") === "1";
  const ego = q.get("ego") === "1";
  const zoomK = parseFloat(q.get("zoom") || "");
  if (!harnessConsumed && (drill || hop || ego)) {
    harnessConsumed = true;
    if (ego) {
      egoMode = true;
      if (egoBtn) egoBtn.classList.add("on");
    }
    if (drill) {
      if (explorerWs !== "map") {
        explorerWs = "map";
        explorerPinned = true;
        paint({ animate: "none" });
      }
      const card = document.querySelector(".bubble-card");
      if (card) {
        graphFilter.bubble = card.getAttribute("data-bubble");
        selectedNodeId = null;
        renderProgramOverview();
      }
    }
    if (hop) {
      if (!document.querySelector(".edge-hit, text.ekind")) {
        explorerWs = "slice";
        explorerPinned = true;
        paint({ animate: "none" });
      }
      const hit = document.querySelector(".edge-hit, text.ekind");
      if (hit) hit.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
  }
  if (Number.isFinite(zoomK) && zoomK > 0) {
    cam.k = zoomK;
    camTo.k = zoomK;
    applyCam();
  }
}

function setWorkspace(name, pin) {
  if (WORKSPACES.indexOf(name) < 0) return;
  explorerWs = name;
  if (pin) explorerPinned = true;
  if (name === "lineage" && !egoMode) egoMode = true;
  paint({ animate: "none" });
}

function setEgoMode(on) {
  egoMode = !!on;
  if (egoBtn) egoBtn.classList.toggle("on", egoMode);
  applyEgoPaint();
}

function refreshExplorer() {
  if (!snapshot) return;
  if (isListWorkspace(explorerWs) || explorerWs === "lineage" || explorerWs === "overview") {
    paint({ animate: "none" });
    return;
  }
  if (explorerWs === "map" || stack[stack.length - 1]?.kind === "programs") {
    renderProgramOverview();
    return;
  }
  applyGraphFilter();
  applyEgoPaint();
}

function setLedgerHead(label) {
  const el = document.querySelector("#ledgerPane .led-head");
  if (el) el.textContent = label || "SLICE";
}

function updateZoomPct() {
  if (!zoomPct) return;
  const k = camTo && camTo.k ? camTo.k : cam.k;
  zoomPct.textContent = Math.round(k * 100) + "% · " + lodName(lodOf(k));
}

function lodOf(k) {
  if (k < 0.75) return 0;
  if (k < 1.5) return 1;
  if (k < 2.6) return 2;
  return 3;
}

function lodName(lod) {
  return ["overview", "labels", "hops", "source"][lod] || "labels";
}

function canPopAltitude() {
  if (graphFilter.bubble) return true;
  const top = stack[stack.length - 1];
  return !!(top && top.kind === "bubble");
}

function popAltitudeFromZoom() {
  if (graphFilter.bubble) {
    graphFilter.bubble = null;
    selectedNodeId = null;
    resetCam();
    zoomPopReady = false;
    if (explorerWs === "map" || stack[stack.length - 1]?.kind === "programs") renderProgramOverview();
    else paint({ animate: "none" });
    return;
  }
  if (stack[stack.length - 1]?.kind === "bubble") {
    resetCam();
    zoomPopReady = false;
    goBack();
  }
}

function applyCam() {
  if (viewportEl) {
    viewportEl.style.transform = "translate(" + cam.x + "px," + cam.y + "px) scale(" + cam.k + ")";
    viewportEl.style.setProperty("--cam-k", String(cam.k));
    const lod = String(lodOf(cam.k));
    if (viewportEl.getAttribute("data-lod") !== lod) viewportEl.setAttribute("data-lod", lod);
  }
  updateZoomPct();
  const popK = camTo && camTo.k != null ? camTo.k : cam.k;
  if (popK > 0.8) zoomPopReady = true;
  if (zoomPopReady && popK <= 0.42 && canPopAltitude()) {
    zoomPopReady = false;
    popAltitudeFromZoom();
  }
}

function tickCam() {
  cam.x += (camTo.x - cam.x) * 0.24;
  cam.y += (camTo.y - cam.y) * 0.24;
  cam.k += (camTo.k - cam.k) * 0.24;
  if (Math.hypot(camTo.x - cam.x, camTo.y - cam.y) < 0.35 && Math.abs(camTo.k - cam.k) < 0.004) {
    cam.x = camTo.x;
    cam.y = camTo.y;
    cam.k = camTo.k;
    camRaf = 0;
  } else {
    camRaf = requestAnimationFrame(tickCam);
  }
  applyCam();
}

function setCamTarget(x, y, k) {
  camTo = { x: x, y: y, k: clamp(k, CAM_MIN, CAM_MAX) };
  updateZoomPct();
  if (camTo.k > 0.8) zoomPopReady = true;
  if (zoomPopReady && camTo.k <= 0.42 && canPopAltitude()) {
    zoomPopReady = false;
    popAltitudeFromZoom();
    return;
  }
  if (reduceMotion()) {
    cam = { x: camTo.x, y: camTo.y, k: camTo.k };
    applyCam();
    return;
  }
  if (!camRaf) camRaf = requestAnimationFrame(tickCam);
}

function resetCam() {
  cam = { x: 0, y: 0, k: 1 };
  camTo = { x: 0, y: 0, k: 1 };
  applyCam();
}

function zoomBy(factor) {
  const stage = canvas.querySelector(".stage");
  if (!stage) return;
  const r = stage.getBoundingClientRect();
  zoomAt(r.width / 2, r.height / 2, camTo.k * factor);
}

function zoomAt(px, py, nextK) {
  const k = camTo.k;
  const nk = clamp(nextK, CAM_MIN, CAM_MAX);
  setCamTarget(px - ((px - camTo.x) * nk) / k, py - ((py - camTo.y) * nk) / k, nk);
}

function zoomToEl(el, k) {
  const stage = canvas.querySelector(".stage");
  if (!stage || !el) return;
  const vr = stage.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2 - vr.left;
  const cy = r.top + r.height / 2 - vr.top;
  const contentX = (cx - cam.x) / cam.k;
  const contentY = (cy - cam.y) / cam.k;
  const nk = k || Math.min(CAM_MAX, Math.max(1.55, cam.k * 1.45));
  setCamTarget(vr.width / 2 - contentX * nk, vr.height / 2 - contentY * nk, nk);
}

function hideTip() {
  if (!tip) return;
  tip.hidden = true;
}

function showTip(text, ev) {
  if (!tip || !text) return;
  tip.textContent = text;
  tip.hidden = false;
  const x = Math.min(ev.clientX + 12, window.innerWidth - 16 - tip.offsetWidth);
  const y = Math.min(ev.clientY + 14, window.innerHeight - 16 - tip.offsetHeight);
  tip.style.left = x + "px";
  tip.style.top = y + "px";
}

function bindStage(stage, opts) {
  viewportEl = stage.querySelector(".viewport");
  if (!opts || opts.reset) resetCam();
  else applyCam();
  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const r = stage.getBoundingClientRect();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoomAt(e.clientX - r.left, e.clientY - r.top, camTo.k * factor);
    },
    { passive: false }
  );
  let drag = null;
  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    if (e.target.closest("button, .run, .inode, a, input")) return;
    drag = { x: e.clientX, y: e.clientY, cx: camTo.x, cy: camTo.y };
    stage.classList.add("panning");
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    setCamTarget(drag.cx + (e.clientX - drag.x), drag.cy + (e.clientY - drag.y), camTo.k);
  });
  const endDrag = () => {
    drag = null;
    stage.classList.remove("panning");
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  stage.addEventListener("dblclick", (e) => {
    if (e.target.closest(".vnode, .run")) return;
    setCamTarget(0, 0, 1);
  });
}

function bindGraphFx() {
  const wrap = canvas.querySelector(".steiner-wrap");
  const svg = canvas.querySelector("svg.steiner");
  if (svg) {
    const edges = [...svg.querySelectorAll(".edge")];
    const flows = [...svg.querySelectorAll(".edge-flow")];
    const nodes = [...(wrap || canvas).querySelectorAll(".vnode")];
    const clearHot = () => {
      svg.classList.remove("focus");
      if (wrap) wrap.classList.remove("focus");
      edges.forEach((el) => el.classList.remove("hot"));
      flows.forEach((el) => el.classList.remove("hot"));
      nodes.forEach((el) => el.classList.remove("hot"));
      hideTip();
    };
    nodes.forEach((g) => {
      const id = g.getAttribute("data-id");
      const fqn = g.getAttribute("data-fqn") || "";
      g.addEventListener("pointerenter", (ev) => {
        svg.classList.add("focus");
        if (wrap) wrap.classList.add("focus");
        g.classList.add("hot");
        edges.forEach((el) => {
          if (el.dataset.from === id || el.dataset.to === id) el.classList.add("hot");
        });
        flows.forEach((el) => {
          if (el.dataset.from === id || el.dataset.to === id) el.classList.add("hot");
        });
        showTip(fqn, ev);
      });
      g.addEventListener("pointermove", (ev) => showTip(fqn, ev));
      g.addEventListener("pointerleave", clearHot);
      g.addEventListener("click", (ev) => {
        ev.stopPropagation();
        selectNode(id, { zoomEl: g });
      });
      g.addEventListener("dblclick", (ev) => {
        ev.stopPropagation();
        const run = [...canvas.querySelectorAll(".run")].find((el) =>
          (el.getAttribute("data-nodes") || "").split(",").includes(id)
        );
        if (run) {
          enterRun(run.getAttribute("data-flow"), run.getAttribute("data-bubble"), run);
          return;
        }
        const flow = currentFlow();
        if (flow) peekSource(id);
      });
    });
    bindHopClicks(svg);
    if (!reduceMotion()) {
      setTimeout(() => {
        svg.classList.add("flowing");
        if (wrap) wrap.classList.add("flowing");
      }, 520);
    }
  }
  canvas.querySelectorAll(".run").forEach((el) => {
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      enterRun(el.getAttribute("data-flow"), el.getAttribute("data-bubble"), el);
    });
  });
}

function selectFlow(name) {
  if (name) flowName = name;
  vscode.postMessage({ type: "selectFlow", flow: name });
  const flow = currentFlow();
  if (flow && ((flow.tree && flow.tree.edges && flow.tree.edges.length) || (flow.tree && flow.tree.nodes && flow.tree.nodes.length))) {
    explorerWs = "slice";
    paint({ animate: "none" });
  }
}

function enterRun(flow, bubble, fromEl) {
  vscode.postMessage({ type: "enterRun", flow, bubble });
  const token = ++navToken;
  const go = () => {
    if (token !== navToken) return;
    stack.push({ kind: "bubble", flow, bubble: String(bubble) });
    paint({ animate: "list" });
  };
  if (fromEl && !reduceMotion()) {
    fromEl.classList.add("zoom-in");
    canvas.classList.add("leaving");
    zoomToEl(fromEl, 1.9);
    setTimeout(go, 200);
  } else {
    go();
  }
}

function goBack() {
  if (graphFilter.bubble && (explorerWs === "map" || stack[stack.length - 1]?.kind === "programs")) {
    graphFilter.bubble = null;
    selectedNodeId = null;
    renderProgramOverview();
    return;
  }
  if (stack.length <= 1) return;
  const top = stack[stack.length - 1];
  if (top.kind === "flow") {
    stack.pop();
    if (stack.length === 0) stack.push({ kind: "programs" });
    explorerWs = defaultLandingWorkspace();
    explorerPinned = false;
    vscode.postMessage({ type: "back" });
    paint({ animate: "none" });
    return;
  }
  const token = ++navToken;
  const fromInner = top.kind === "bubble";
  const go = () => {
    if (token !== navToken) return;
    stack.pop();
    paint({ animate: "tree", fromInner });
  };
  if (fromInner && !reduceMotion()) {
    canvas.classList.add("leaving");
    setTimeout(go, 150);
  } else {
    go();
  }
}

function paint(opts) {
  const animate = (opts && opts.animate) || "all";
  const preview = !!(opts && opts.preview) || !!(snapshot && snapshot.preview);
  if (!snapshot) return;
  const top = stack[stack.length - 1];
  backBtn.disabled = stack.length <= 1 && !graphFilter.bubble;
  syncWorkspaces();
  if (top && top.kind === "bubble") {
    const inner = enterBubble(snapshot, top.flow, top.bubble);
    renderInner(
      {
        inner,
        flow: currentFlow(),
        coverage: snapshot.coverage,
        findings: snapshot.findings,
        plugin: snapshot.plugin,
        stats: snapshot.stats,
      },
      animate
    );
    applyEgoPaint();
    consumeHarnessActions();
    return;
  }
  if (isListWorkspace(explorerWs) || explorerWs === "overview") {
    renderExplorerList(explorerWs);
    consumeHarnessActions();
    return;
  }
  if (explorerWs === "lineage") {
    renderLineage();
    consumeHarnessActions();
    return;
  }
  if (explorerWs === "map") {
    renderProgramOverview();
    consumeHarnessActions();
    return;
  }
  if (explorerWs === "slice") {
    const flow = currentFlow();
    renderFlowchart(
      {
        flows: snapshot.flows,
        flow,
        graph: snapshot.graph,
        bubbles: snapshot.bubbles,
        coverage: snapshot.coverage,
        findings: snapshot.findings,
        plugin: snapshot.plugin,
        stats: snapshot.stats,
      },
      { animate: animate === "all" ? "none" : animate, preview, keepCam: !!(opts && opts.keepCam) }
    );
    lastTreeKey = treeKey(flow);
    applyEgoPaint();
    consumeHarnessActions();
    return;
  }
  if (top.kind === "programs") {
    renderProgramOverview();
    consumeHarnessActions();
    return;
  }
  if (top.kind === "flow") {
    const flow = currentFlow();
    renderFlowchart(
      {
        flows: snapshot.flows,
        flow,
        graph: snapshot.graph,
        bubbles: snapshot.bubbles,
        coverage: snapshot.coverage,
        findings: snapshot.findings,
        plugin: snapshot.plugin,
        stats: snapshot.stats,
      },
      { animate, preview, keepCam: !!(opts && opts.keepCam), fromInner: !!(opts && opts.fromInner) }
    );
    lastTreeKey = treeKey(flow);
    if (opts && opts.fromInner) {
      cam = { x: 0, y: 0, k: 1.45 };
      camTo = { x: 0, y: 0, k: 1.45 };
      applyCam();
      setCamTarget(0, 0, 1);
    }
    consumeHarnessActions();
    return;
  }
  const inner = enterBubble(snapshot, top.flow, top.bubble);
  renderInner(
    {
      inner,
      flow: currentFlow(),
      coverage: snapshot.coverage,
      findings: snapshot.findings,
      plugin: snapshot.plugin,
      stats: snapshot.stats,
    },
    animate
  );
  consumeHarnessActions();
}

function queueProgress(msg) {
  pendingProgress = msg;
  if (!progressRaf) progressRaf = requestAnimationFrame(flushProgress);
}

function flushProgress() {
  progressRaf = 0;
  if (!pendingProgress) return;
  const msg = pendingProgress;
  pendingProgress = null;
  showProgress(msg);
}

function setBusy(on) {
  busy = on;
  reviewBtn.hidden = on;
  cancelBtn.hidden = !on;
  reviewBtn.disabled = on;
}

function showProgress(msg) {
  setBusy(true);
  progressEl.classList.add("on");
  const phase = PHASE_ALIAS[msg.phase] || msg.phase || "walk";
  setPhases(phase);
  progressBar.classList.toggle("work", phase === "cluster" || phase === "extract");
  targetPct = Math.max(targetPct, Math.max(0, Math.min(100, Number(msg.pct) || 0)));
  if (!barRaf) barRaf = requestAnimationFrame(tickBar);
  progressLabel.textContent = msg.label || msg.phase || "Working…";
  if (msg.total) progressCounts.textContent = (msg.done || 0) + "/" + msg.total;
  else progressCounts.textContent = phase;
  if (msg.elapsed_ms != null) progressTime.textContent = formatMs(msg.elapsed_ms);
  if (snapshot && snapshot.preview) canvas.classList.remove("stale");
  else if (canvas.childElementCount && snapshot) canvas.classList.add("stale");
  else if (!canvas.childElementCount || canvas.querySelector(".empty")) {
    canvas.classList.remove("stale");
    if (!canvas.querySelector(".skeleton")) {
      canvas.innerHTML =
        '<div class="skeleton" aria-hidden="true"><i></i><i></i><i></i></div><div class="empty pulse">' +
        esc(msg.label || "Working…") +
        "</div>";
    } else {
      const empty = canvas.querySelector(".empty");
      if (empty) empty.textContent = msg.label || "Working…";
    }
  }
  status.textContent = (msg.phase || "review") + " · " + Math.round(targetPct) + "%";
}

function tickBar() {
  shownPct += (targetPct - shownPct) * 0.22;
  if (Math.abs(targetPct - shownPct) < 0.15) shownPct = targetPct;
  progressFill.style.width = shownPct + "%";
  progressPct.textContent = Math.round(shownPct) + "%";
  if (shownPct !== targetPct) barRaf = requestAnimationFrame(tickBar);
  else barRaf = 0;
}

function setPhases(active) {
  const idx = PHASE_ORDER.indexOf(active);
  phasesEl.querySelectorAll("li").forEach((el) => {
    const i = PHASE_ORDER.indexOf(el.getAttribute("data-phase"));
    el.classList.toggle("done", i < idx);
    el.classList.toggle("on", i === idx);
  });
}

function hideProgress() {
  progressEl.classList.remove("on");
  progressBar.classList.remove("work");
  phasesEl.querySelectorAll("li").forEach((el) => el.classList.remove("on", "done"));
  targetPct = 0;
  shownPct = 0;
  progressFill.style.width = "0%";
}

function finishWork() {
  setBusy(false);
  hideProgress();
  canvas.classList.remove("stale");
}

function formatMs(ms) {
  const n = Number(ms) || 0;
  if (n < 1000) return n + "ms";
  return (n / 1000).toFixed(1) + "s";
}

function idVal(id) {
  if (id && typeof id === "object" && "0" in id) return String(id[0]);
  return String(id);
}
function sameId(a, b) {
  return idVal(a) === idVal(b);
}
function fqnOf(graph, id) {
  const n = nodeById.get(idVal(id)) || (graph.nodes || []).find((x) => sameId(x.id, id));
  return n ? n.fqn : String(id);
}
function kindOf(graph, id) {
  const n = nodeById.get(idVal(id)) || (graph.nodes || []).find((x) => sameId(x.id, id));
  return n ? n.kind : "";
}
function shortOf(fqn) {
  return String(fqn || "")
    .split(/::|\./)
    .pop();
}
function shortToken(id) {
  const s = String(idVal(id) || "").replace(/^n/i, "");
  return (s.slice(-4).toUpperCase() || "0").padStart(4, "0");
}
function kindClass(kind) {
  const k = String(kind || "Function");
  if (k === "Type") return "kind-Type";
  if (k === "Endpoint") return "kind-Endpoint";
  return "kind-Function";
}
function endpointOf(id) {
  const n = nodeById.get(idVal(id)) || ((snapshot && snapshot.graph && snapshot.graph.nodes) || []).find((x) => sameId(x.id, id));
  return n && n.endpoint ? n.endpoint : null;
}
function kindLine(id, kind) {
  const ep = endpointOf(id);
  if (ep && (ep.role || ep.channel)) {
    return String(ep.role || "Endpoint") + (ep.channel ? " · " + ep.channel : "");
  }
  return String(kind || "Function") + " · " + shortToken(id);
}
function graphEdge(from, to, kind) {
  const a = idVal(from),
    b = idVal(to);
  const pools = [];
  const flow = currentFlow();
  if (flow && flow.tree && flow.tree.edges) pools.push(flow.tree.edges);
  if (snapshot && snapshot.graph && snapshot.graph.edges) pools.push(snapshot.graph.edges);
  let found = null;
  for (const edges of pools) {
    for (const e of edges) {
      if (idVal(e.from) !== a || idVal(e.to) !== b) continue;
      if (kind && e.kind && e.kind !== kind) continue;
      found = e;
      break;
    }
    if (found) break;
  }
  return found;
}
function bindHopClicks(root) {
  if (!root) return;
  root.querySelectorAll("[data-from][data-to]").forEach((el) => {
    if (el.dataset.hopBound) return;
    el.dataset.hopBound = "1";
    const go = (ev) => {
      ev.stopPropagation();
      showHop(el.getAttribute("data-from"), el.getAttribute("data-to"), el.getAttribute("data-kind"));
    };
    el.addEventListener("click", go);
    el.addEventListener("pointerdown", (ev) => ev.stopPropagation());
  });
}
function orthoPath(a, b) {
  const mx = Math.round((a.x + b.x) / 2);
  return "M" + a.x + "," + a.y + " H" + mx + " V" + b.y + " H" + b.x;
}
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function flowMark(name) {
  if (skippedFlows.indexOf(name) >= 0) return "skipped";
  const row = stampRows.find((s) => s.name === name);
  if (!row) return "";
  return row.holds ? "holds" : "broken";
}

function requestStamp(name) {
  const flow = name || (currentFlow() && currentFlow().name);
  if (!flow) return;
  skippedFlows = skippedFlows.filter((n) => n !== flow);
  const row = stampRows.find((s) => s.name === flow);
  if (row) row.holds = true;
  else stampRows.push({ name: flow, holds: true });
  if (snapshot) {
    snapshot.skipped = (snapshot.skipped || []).filter((n) => n !== flow);
    snapshot.stamps = stampRows.slice();
    snapshot.findings = (snapshot.findings || []).filter(
      (f) => !(findingKindOf(f) === "StampBroken" && f.flow === flow)
    );
  }
  vscode.postMessage({ type: "stamp", flow });
  paint({ animate: "none" });
}

function requestSkip(name) {
  const flow = name || (currentFlow() && currentFlow().name);
  if (!flow) return;
  if (skippedFlows.indexOf(flow) < 0) skippedFlows.push(flow);
  if (snapshot && (snapshot.skipped || []).indexOf(flow) < 0) {
    snapshot.skipped = (snapshot.skipped || []).concat([flow]);
  }
  vscode.postMessage({ type: "skip", flow });
  paint({ animate: "none" });
}

function programKeyOf(p) {
  return (p.kind || "") + "\0" + (p.name || "") + "\0" + (p.root || "");
}

function detectHint(file) {
  const f = String(file || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");
  let i = f.indexOf("/src/bin/");
  if (i >= 0) {
    const rest = f.slice(i + 9);
    const name = (rest.split("/")[0] || "bin").replace(/\.rs$/, "").replace(/\.go$/, "");
    return { kind: "bin", name, root: f.slice(0, i) };
  }
  if (f.startsWith("src/bin/")) {
    const rest = f.slice(8);
    const name = (rest.split("/")[0] || "bin").replace(/\.rs$/, "").replace(/\.go$/, "");
    return { kind: "bin", name, root: "" };
  }
  if (f === "src/main.rs") return { kind: "bin", name: "main", root: "" };
  if (f.endsWith("/src/main.rs")) {
    const root = f.slice(0, -"/src/main.rs".length);
    return { kind: "bin", name: root.split("/").pop() || "main", root };
  }
  if (f === "src/lib.rs") return { kind: "lib", name: "lib", root: "" };
  if (f.endsWith("/src/lib.rs")) {
    const root = f.slice(0, -"/src/lib.rs".length);
    return { kind: "lib", name: root.split("/").pop() || "lib", root };
  }
  if (f.endsWith("/main.go") || f === "main.go") {
    const root = f.replace(/main\.go$/, "").replace(/\/$/, "");
    if (root.startsWith("cmd/")) {
      const name = root.slice(4).split("/")[0] || "main";
      return { kind: "bin", name, root: "cmd/" + name };
    }
    return { kind: "bin", name: root.split("/").filter(Boolean).pop() || "main", root };
  }
  if (f.endsWith("/__main__.py") || f.endsWith("/main.py")) {
    const root = f.replace(/__main__\.py$/, "").replace(/main\.py$/, "").replace(/\/$/, "");
    return { kind: "bin", name: root.split("/").filter(Boolean).pop() || "main", root };
  }
  return null;
}

function crateRootOf(file) {
  const f = String(file || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");
  const i = f.indexOf("/src/bin/");
  if (i >= 0) return f.slice(0, i);
  if (f.startsWith("src/bin/") || f === "src" || f.startsWith("src/")) return "";
  const s = f.indexOf("/src/");
  if (s >= 0) return f.slice(0, s);
  if (f === "main.go" || f === "main.py" || f === "__main__.py") return "";
  if (f.startsWith("cmd/")) return "cmd/" + (f.slice(4).split("/")[0] || "main");
  const slash = f.indexOf("/");
  return slash >= 0 ? f.slice(0, slash) : "";
}

function assignProgram(file, programs) {
  const hint = detectHint(file);
  if (hint) return hint;
  const root = crateRootOf(file);
  const at = (programs || []).filter((p) => (p.root || "") === root);
  const lib = at.find((p) => p.kind === "lib");
  if (lib) return lib;
  const pkgBin = root ? root.split("/").filter(Boolean).pop() : "main";
  const bin = at.find((p) => p.kind === "bin" && p.name === pkgBin);
  if (bin) return bin;
  const f = String(file || "").replace(/\\/g, "/");
  const slash = f.indexOf("/");
  if (slash >= 0) {
    const a = f.slice(0, slash);
    if (a === "src") return { kind: "pkg", name: "src", root: "" };
    return { kind: "pkg", name: a, root: a };
  }
  return { kind: "pkg", name: "root", root: "" };
}

function flowTouchesProgram(flow, program) {
  const want = programKeyOf(program);
  const graph = snapshot && snapshot.graph;
  const programs = (snapshot && snapshot.programs) || [];
  for (const id of flow?.tree?.nodes || []) {
    const n = nodeById.get(idVal(id)) || (graph?.nodes || []).find((x) => sameId(x.id, id));
    const file = n?.span?.file;
    if (file && programKeyOf(assignProgram(file, programs)) === want) return true;
  }
  return false;
}

function snippetPreview(raw) {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  return raw.preview || raw.text || "";
}

function nodeFlags(id) {
  const sid = idVal(id);
  const cov = (snapshot && snapshot.coverage) || {};
  const uncovered = (cov.uncovered || []).some((x) => idVal(x) === sid);
  const changed = (cov.changed || []).some((x) => idVal(x) === sid);
  return { uncovered, changed };
}

function nodeAway(id) {
  const prog = snapshot && snapshot.program;
  if (!prog) return false;
  const n = nodeById.get(idVal(id));
  const file = n?.span?.file;
  if (!file) return false;
  return programKeyOf(assignProgram(file, snapshot.programs || [])) !== programKeyOf(prog);
}

function peekSource(id) {
  if (!id) return;
  sourceId = id;
  const local = snapshot && snapshot.snippets && snapshot.snippets[id];
  if (local) {
    const node = nodeById.get(idVal(id));
    showSource({
      id,
      fqn: (node && node.fqn) || id,
      kind: node && node.kind,
      ...(typeof local === "string" ? { text: local, preview: local } : local),
    });
    return;
  }
  vscode.postMessage({ type: "peekSource", id });
}

function showSource(msg) {
  if (!sourcePane) return;
  if (msg.missing) {
    sourcePane.hidden = false;
    if (srcTitle) srcTitle.textContent = "No span for this node";
    if (srcBody) srcBody.textContent = "";
    return;
  }
  sourceId = msg.id || sourceId;
  sourcePane.hidden = false;
  if (workspace) workspace.classList.add("has-source");
  const where = msg.file ? shortFile(msg.file) + (msg.line ? ":" + msg.line : "") : "";
  if (srcTitle) srcTitle.textContent = (shortOf(msg.fqn) || "source") + (where ? " · " + where : "");
  fillInspect(msg);
  if (srcBody) srcBody.innerHTML = renderSourceLines(msg);
  const hot = srcBody && srcBody.querySelector(".src-line.hot");
  if (hot && typeof hot.scrollIntoView === "function") hot.scrollIntoView({ block: "center" });
}

function showHop(from, to, kind) {
  const a = idVal(from),
    b = idVal(to);
  const edge = graphEdge(a, b, kind);
  const k = (edge && edge.kind) || kind || "Calls";
  const span = (edge && edge.span) || {};
  const where = span.file
    ? shortFile(span.file) + (span.start && span.start.line ? ":" + span.start.line : span.line ? ":" + span.line : "")
    : "";
  if (sourcePane) {
    sourcePane.hidden = false;
    if (workspace) workspace.classList.add("has-source");
  }
  if (srcTitle) srcTitle.textContent = k + " · " + shortToken(a) + " → " + shortToken(b);
  if (hopCard) {
    hopCard.hidden = false;
    hopCard.innerHTML =
      '<div class="hop-k">Hop · ' +
      esc(k) +
      "</div><div class=\"hop-path\">" +
      '<button type="button" data-id="' +
      esc(a) +
      '" class="' +
      kindClass(kindOf(snapshot && snapshot.graph, a)) +
      '">' +
      esc(shortOf(fqnOf(snapshot && snapshot.graph, a))) +
      " · " +
      esc(shortToken(a)) +
      "</button><span class=\"arr\">→</span>" +
      '<button type="button" data-id="' +
      esc(b) +
      '" class="' +
      kindClass(kindOf(snapshot && snapshot.graph, b)) +
      '">' +
      esc(shortOf(fqnOf(snapshot && snapshot.graph, b))) +
      " · " +
      esc(shortToken(b)) +
      "</button></div>" +
      (where ? '<div class="hop-span">' + esc(where) + "</div>" : "") +
      '<div class="hop-fqn">' +
      esc(fqnOf(snapshot && snapshot.graph, a)) +
      "</div><div class=\"hop-fqn\">" +
      esc(fqnOf(snapshot && snapshot.graph, b)) +
      "</div>";
    hopCard.querySelectorAll("[data-id]").forEach((el) => {
      el.onclick = () => selectNode(el.getAttribute("data-id"));
    });
  }
  selectNode(b, { peek: true });
}

function fillInspect(msg) {
  const id = msg.id;
  const node = nodeById.get(idVal(id));
  const deg = incidentEdges(id).length;
  const bub = bubbleOf(id);
  const file = msg.file || node?.span?.file || "";
  const line = msg.line || node?.span?.start?.line || "";
  const prog = file ? assignProgram(file, (snapshot && snapshot.programs) || []) : null;
  const flags = nodeFlags(id);
  const ep = (node && node.endpoint) || endpointOf(id);
  const flow = currentFlow();
  const onTree = !!(flow && (flow.tree?.nodes || []).some((n) => idVal(n) === idVal(id)));
  if (inspMeta) {
    const rows = [
      ["kind", msg.kind || (node && node.kind) || ""],
      ["role", ep && ep.role ? ep.role : "—"],
      ["channel", ep && ep.channel ? ep.channel : "—"],
      ["span", file ? shortFile(file) + (line ? ":" + line : "") : "—"],
      ["slice", onTree ? "on tree" : "off tree"],
      ["community", bub ? bub.label || idVal(bub.id) : "—"],
      ["file", file ? shortFile(file) : "—"],
      ["program", prog ? prog.kind + " " + prog.name : "—"],
      ["degree", String(deg)],
      ["mark", flags.uncovered ? "uncovered" : flags.changed ? "changed" : "—"],
    ];
    inspMeta.innerHTML = rows
      .map((r) => '<div class="row"><span class="k">' + esc(r[0]) + '</span><span>' + esc(r[1]) + "</span></div>")
      .join("");
  }
  if (inspEdges) {
    const edges = incidentEdges(id).slice(0, 18);
    inspEdges.innerHTML = edges.length
      ? edges
          .map((e) => {
            const other = e.dir === "out" ? e.to : e.from;
            return (
              '<div class="row" data-from="' +
              esc(e.from) +
              '" data-to="' +
              esc(e.to) +
              '" data-kind="' +
              esc(e.kind) +
              '"><span class="k">' +
              esc(e.kind) +
              " " +
              (e.dir === "out" ? "→" : "←") +
              '</span><span>' +
              esc(shortOf(fqnOf(snapshot.graph, other))) +
              "</span></div>"
            );
          })
          .join("")
      : '<div class="row"><span class="k">edges</span><span>none on the derived graph</span></div>';
    bindHopClicks(inspEdges);
  }
  if (ledgerGrid) {
    ledgerGrid.querySelectorAll(".cell").forEach((el) => {
      el.classList.toggle("on", el.getAttribute("data-id") === String(id));
    });
    if (ledgerMeta) {
      const lit = ledgerGrid.querySelectorAll(".on").length;
      const n = ledgerGrid.querySelectorAll(".cell").length;
      ledgerMeta.textContent = "objects " + lit + "/" + n;
    }
  }
}

function incidentEdges(id) {
  const sid = idVal(id);
  const out = [];
  for (const e of (snapshot && snapshot.graph && snapshot.graph.edges) || []) {
    if (idVal(e.from) === sid) out.push({ dir: "out", kind: e.kind, from: sid, to: idVal(e.to) });
    else if (idVal(e.to) === sid) out.push({ dir: "in", kind: e.kind, from: idVal(e.from), to: sid });
  }
  return out;
}

function allBubbles() {
  return (snapshot && snapshot.bubbles) || [];
}

function coarseBubbles() {
  const bs = allBubbles();
  const top = bs.filter((b) => b.parent == null);
  return top.length ? top : bs;
}

/** First clustering cut under the program — not every function. */
function mapAltitudeBubbles() {
  const bs = allBubbles();
  const roots = bs.filter((b) => b.parent == null);
  if (roots.length === 1) {
    const kids = bs.filter((b) => b.parent != null && idVal(b.parent) === idVal(roots[0].id));
    if (kids.length) return kids;
  }
  if (roots.length) return roots;
  if (bs.length) return bs;
  return fallbackProgramBubbles();
}

function fallbackProgramBubbles() {
  const nodes = ((snapshot && snapshot.graph && snapshot.graph.nodes) || []).map((n) => idVal(n.id));
  if (!nodes.length) return [];
  const name =
    (snapshot.programs && snapshot.programs[0] && snapshot.programs[0].name) || "program";
  return [{ id: "_program", label: name, parent: null, members: nodes }];
}

function findBubble(id) {
  const sid = String(id);
  if (sid === "_program") return fallbackProgramBubbles()[0] || null;
  return allBubbles().find((b) => idVal(b.id) === sid) || null;
}

function bubbleOf(id) {
  const sid = idVal(id);
  const bs = allBubbles();
  let found = null;
  for (const b of bs) {
    if (!(b.members || []).some((m) => idVal(m) === sid)) continue;
    if (!found || (b.parent != null && found.parent == null)) found = b;
  }
  return found;
}

function colorOfBubble(b) {
  if (!b) return BUBBLE_COLORS[BUBBLE_COLORS.length - 1];
  let h = 0;
  const s = String(idVal(b.id));
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return BUBBLE_COLORS[Math.abs(h) % BUBBLE_COLORS.length];
}

function renderSourceLines(msg) {
  const text = msg.text || msg.preview || "";
  const lines = String(text).split("\n");
  const from = msg.from || msg.line || 1;
  const lo = msg.line || 0;
  const hi = msg.endLine || lo;
  return lines
    .map((line, i) => {
      const ln = from + i;
      const hot = lo && ln >= lo && ln <= hi;
      return (
        '<div class="src-line' +
        (hot ? " hot" : "") +
        '"><span class="ln">' +
        ln +
        '</span><span class="tx">' +
        esc(line) +
        "</span></div>"
      );
    })
    .join("");
}

function closeSourcePane() {
  if (!sourcePane || sourcePane.hidden) return false;
  sourcePane.hidden = true;
  if (workspace) workspace.classList.remove("has-source");
  if (srcBody) srcBody.innerHTML = "";
  if (inspMeta) inspMeta.innerHTML = "";
  if (inspEdges) inspEdges.innerHTML = "";
  if (hopCard) {
    hopCard.hidden = true;
    hopCard.innerHTML = "";
  }
  sourceId = null;
  return true;
}

function programMarks(p) {
  const key = programKeyOf(p);
  const programs = (snapshot && snapshot.programs) || [];
  let uncovered = 0;
  for (const id of (snapshot && snapshot.coverage && snapshot.coverage.uncovered) || []) {
    const n = nodeById.get(idVal(id));
    if (n?.span?.file && programKeyOf(assignProgram(n.span.file, programs)) === key) uncovered++;
  }
  const flows = ((snapshot && snapshot.flows) || []).filter((f) => flowTouchesProgram(f, p)).length;
  return { uncovered, flows };
}

function programLinks() {
  const programs = (snapshot && snapshot.programs) || [];
  const graph = snapshot && snapshot.graph;
  const counts = new Map();
  for (const e of graph?.edges || []) {
    const a = nodeById.get(idVal(e.from));
    const b = nodeById.get(idVal(e.to));
    if (!a?.span?.file || !b?.span?.file) continue;
    const ka = programKeyOf(assignProgram(a.span.file, programs));
    const kb = programKeyOf(assignProgram(b.span.file, programs));
    if (!ka || ka === kb) continue;
    const kind = e.kind || "Imports";
    const k = ka + "\t" + kb + "\t" + kind;
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const out = [];
  for (const [k, count] of counts) {
    const [from, to, kind] = k.split("\t");
    out.push({ from, to, kind, count });
  }
  return out;
}

function layoutPrograms(programs) {
  const n = programs.length;
  const W = Math.max(560, 200 + n * 70);
  const H = Math.max(300, 220 + n * 18);
  const cx = W / 2;
  const cy = H / 2;
  const r = Math.min(W, H) * 0.3 + Math.max(0, n - 2) * 8;
  return programs.map((p, i) => {
    const a = -Math.PI / 2 + (i / Math.max(n, 1)) * Math.PI * 2;
    return { p, i, x: n === 1 ? cx : cx + Math.cos(a) * r, y: n === 1 ? cy : cy + Math.sin(a) * r };
  });
}

function moveProgFocus(delta) {
  const n = (snapshot && snapshot.programs) || [];
  if (!n.length) return;
  progFocus = (progFocus + delta + n.length) % n.length;
  graphFilter.program = n[progFocus];
  renderProgramOverview();
}

function openAllPrograms() {
  const flows = (snapshot && snapshot.flows) || [];
  vscode.postMessage({ type: "selectProgram", all: true, flow: flows[0] && flows[0].name });
}

function openFocusedProgram() {
  const programs = (snapshot && snapshot.programs) || [];
  const p = programs[progFocus];
  if (!p) return;
  const el = canvas.querySelector('.prog-chip[data-i="' + progFocus + '"]');
  openProgram(p, el);
}

function openProgram(p, fromEl) {
  const flows = (snapshot && snapshot.flows) || [];
  const first = flows.find((f) => flowTouchesProgram(f, p));
  const go = () =>
    vscode.postMessage({
      type: "selectProgram",
      kind: p.kind,
      name: p.name,
      root: p.root || "",
      flow: first ? first.name : flows[0] && flows[0].name,
    });
  if (fromEl && !reduceMotion()) {
    fromEl.classList.add("zoom-in");
    canvas.classList.add("leaving");
    zoomToEl(fromEl, 2.1);
    setTimeout(go, 180);
  } else {
    go();
  }
}

function selectNode(id, opts) {
  const sid = id ? idVal(id) : "";
  if (!sid) return;
  if (selectedNodeId && selectedNodeId !== sid) pathEnds = [selectedNodeId, sid];
  else if (pathEnds.length < 2) pathEnds = [sid];
  selectedNodeId = sid;
  highlightCommunity(sid);
  applyEgoPaint();
  if (opts && opts.zoomEl) zoomToEl(opts.zoomEl, Math.min(CAM_MAX, Math.max(2.6, camTo.k * 1.45)));
  if (!opts || opts.peek !== false) peekSource(sid);
}

function shortestPath(from, to) {
  const a = idVal(from),
    b = idVal(to);
  if (!a || !b || a === b) return a ? [a] : [];
  const adj = new Map();
  const add = (x, y) => {
    if (!adj.has(x)) adj.set(x, []);
    adj.get(x).push(y);
  };
  for (const e of (snapshot && snapshot.graph && snapshot.graph.edges) || []) {
    const u = idVal(e.from),
      v = idVal(e.to);
    add(u, v);
    add(v, u);
  }
  const prev = new Map();
  const q = [a];
  prev.set(a, null);
  for (let i = 0; i < q.length; i++) {
    const cur = q[i];
    if (cur === b) break;
    for (const n of adj.get(cur) || []) {
      if (prev.has(n)) continue;
      prev.set(n, cur);
      q.push(n);
    }
  }
  if (!prev.has(b)) return [];
  const path = [b];
  while (path[0] !== a) {
    const p = prev.get(path[0]);
    if (p == null) return [];
    path.unshift(p);
  }
  return path;
}

function pathHops(path) {
  const hops = [];
  for (let i = 0; i < path.length - 1; i++) {
    const edge = graphEdge(path[i], path[i + 1]) || graphEdge(path[i + 1], path[i]);
    hops.push({
      from: path[i],
      to: path[i + 1],
      kind: (edge && edge.kind) || "Calls",
    });
  }
  return hops;
}

function consecutiveOnPath(path, a, b) {
  for (let i = 0; i < path.length - 1; i++) {
    if ((path[i] === a && path[i + 1] === b) || (path[i] === a && path[i + 1] === b) || (path[i] === b && path[i + 1] === a))
      return true;
  }
  return false;
}

function applyEgoPaint() {
  const sid = selectedNodeId ? String(selectedNodeId) : "";
  const neighbors = new Set();
  if (sid) {
    neighbors.add(sid);
    incidentEdges(sid).forEach((e) => {
      neighbors.add(e.from);
      neighbors.add(e.to);
    });
  }
  const path = pathEnds.length === 2 ? shortestPath(pathEnds[0], pathEnds[1]) : [];
  const pathSet = new Set(path);
  canvas.querySelectorAll(".vnode, .comm-node, .ego-node").forEach((el) => {
    const id = el.getAttribute("data-id");
    const onEgo = neighbors.has(id);
    const onPath = pathSet.has(id);
    el.classList.toggle("selected", id === sid);
    el.classList.toggle("ego", onEgo);
    el.classList.toggle("on-path", onPath);
    el.classList.toggle("ego-dim", !!(egoMode && sid && !onEgo && !onPath));
  });
  canvas.querySelectorAll("[data-from][data-to]").forEach((el) => {
    const a = el.getAttribute("data-from"),
      b = el.getAttribute("data-to");
    const incident = !!(sid && (a === sid || b === sid));
    const onPath = path.length > 1 && consecutiveOnPath(path, a, b);
    el.classList.toggle("ego", incident);
    el.classList.toggle("on-path", onPath);
    el.classList.toggle("ego-dim", !!(egoMode && sid && !incident && !onPath));
  });
}

function defaultFocusId() {
  if (selectedNodeId) return selectedNodeId;
  const flow = currentFlow();
  const tree = (flow && flow.tree && flow.tree.nodes) || [];
  if (tree[0]) return idVal(tree[0]);
  const unc = (snapshot && snapshot.coverage && snapshot.coverage.uncovered) || [];
  if (unc[0]) return idVal(unc[0]);
  const n = snapshot && snapshot.graph && snapshot.graph.nodes && snapshot.graph.nodes[0];
  return n ? idVal(n.id) : "";
}

function matchesExplorerQuery(text) {
  const q = (graphFilter.q || "").toLowerCase();
  if (!q) return true;
  return String(text || "")
    .toLowerCase()
    .includes(q);
}

function findingKindOf(f) {
  if (!f) return "";
  if (typeof f.kind === "string") return f.kind;
  return (f.kind && f.kind.kind) || "";
}

function findingTitle(f) {
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

function decisionRecords() {
  const rows = [];
  const seen = new Set();
  for (const s of stampRows.concat((snapshot && snapshot.stamps) || [])) {
    const name = s.name || s.flow;
    if (!name || seen.has("stamp:" + name)) continue;
    seen.add("stamp:" + name);
    rows.push({
      kind: "stamp",
      flow: name,
      verdict: s.holds ? "holds" : "broken",
      title: name,
      body: s.holds ? "Human stamp still holds on this graph." : "Stamp no longer matches the derived tree.",
    });
  }
  for (const name of skippedFlows.concat((snapshot && snapshot.skipped) || [])) {
    if (!name || seen.has("skip:" + name)) continue;
    seen.add("skip:" + name);
    rows.push({
      kind: "skip",
      flow: name,
      verdict: "skipped",
      title: name,
      body: "Skipped this session — no stamp written.",
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
    });
  }
  return rows;
}

function registryEvents() {
  const ev = [];
  const s = (snapshot && snapshot.stats) || {};
  ev.push({
    kind: "review",
    title: "Review snapshot",
    body:
      ((snapshot.graph && snapshot.graph.nodes) || []).length +
      " nodes · " +
      ((snapshot.graph && snapshot.graph.edges) || []).length +
      " edges · " +
      (s.files || 0) +
      " files" +
      (s.elapsed_ms != null ? " · " + s.elapsed_ms + "ms" : ""),
  });
  decisionRecords().forEach((d) => ev.push({ kind: d.kind, title: d.title, body: d.body, flow: d.flow, verdict: d.verdict }));
  const findings = ((snapshot && snapshot.findings) || []).filter((f) => {
    const k = findingKindOf(f);
    return k && k !== "UncoveredNode" && k !== "StampBroken" && k !== "UnmatchedHint";
  });
  findings.forEach((f) => {
    ev.push({ kind: "finding", title: findingTitle(f), body: f.message || f.fqn || f.plugin || "", flow: f.flow || "" });
  });
  return ev;
}

function timelineEvents() {
  const cov = (snapshot && snapshot.coverage) || {};
  const changed = cov.changed || [];
  const uncovered = cov.uncovered || [];
  const ev = [
    {
      kind: "parent",
      title: "Parent cut",
      body: changed.length + " nodes changed vs parent (HEAD^ unless overridden)",
    },
    {
      kind: "coverage",
      title: "Uncovered",
      body: uncovered.length + " changed nodes sit off every proposed tree",
      sample: uncovered.slice(0, 8).map((id) => idVal(id)),
    },
  ];
  decisionRecords().forEach((d) => ev.push({ kind: d.verdict || d.kind, title: d.title, body: d.body, flow: d.flow }));
  return ev;
}

function countMap(items, keyFn) {
  const m = new Map();
  for (const x of items || []) {
    const k = keyFn(x) || "—";
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

function statChips(map) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map((e) => '<span class="stat-chip"><b>' + esc(e[0]) + "</b> " + e[1] + "</span>")
    .join("");
}

function renderExplorerList(ws) {
  renderTabs(snapshot.flows || [], currentFlow() && currentFlow().name);
  renderStats(snapshot);
  renderCoverage(snapshot.coverage, snapshot.findings, snapshot.graph);
  setGraphChrome(true);
  setZoomUi(false);
  hideTip();
  setLedgerHead(ws.toUpperCase());
  if (stampBtn) stampBtn.disabled = !currentFlow();
  if (skipBtn) skipBtn.disabled = !currentFlow();
  const titles = {
    decisions: "Decisions — stamps, skips, and broken attestations",
    registry: "Registry — audit of this review snapshot",
    overview: "Overview — default run and control-flow graph",
    timeline: "Timeline — parent cut, coverage, stamp scars",
  };
  meta.innerHTML =
    '<span class="crumb">Review</span> / <b>' +
    esc(ws) +
    "</b> · " +
    esc(titles[ws] || ws);
  let html = "";
  if (ws === "overview") html = renderOverviewBody();
  else if (ws === "decisions") html = renderCardList(decisionRecords(), "No stamps, skips, or stamp scars yet. Stamp (S) or Skip (X) a flow.");
  else if (ws === "registry") html = renderCardList(registryEvents(), "Review first — the registry is this snapshot’s audit log.");
  else html = renderCardList(timelineEvents(), "No parent cut or stamp events yet.");
  canvas.className = ws === "overview" ? "play has-stage explorer-list" : "play explorer-list";
  canvas.innerHTML = '<div class="expl-wrap"><div class="flow-title">' + esc(titles[ws] || ws) + "</div>" + html + "</div>";
  if (ws === "overview") {
    const stage = canvas.querySelector(".stage");
    if (stage) {
      bindStage(stage, { reset: true });
      setZoomUi(true);
    } else {
      setZoomUi(false);
    }
    bindGraphFx();
    applyEgoPaint();
    const flow = defaultRunFlow();
    const treeIds = ((flow && flow.tree && flow.tree.nodes) || []).map((id) => nodeById.get(idVal(id)) || { id, kind: kindOf(snapshot.graph, id), fqn: fqnOf(snapshot.graph, id) });
    if (treeIds.length) renderLedger(treeIds, { selected: selectedNodeId, onTree: new Set((flow.tree.nodes || []).map(idVal)) });
    setLedgerHead("RUN");
  }
  canvas.querySelectorAll("[data-flow]").forEach((el) => {
    el.onclick = () => {
      const name = el.getAttribute("data-flow");
      if (!name) return;
      explorerWs = "slice";
      explorerPinned = true;
      selectFlow(name);
    };
  });
  canvas.querySelectorAll("[data-id]").forEach((el) => {
    el.onclick = () => {
      explorerWs = "lineage";
      explorerPinned = true;
      selectNode(el.getAttribute("data-id"));
      paint({ animate: "none" });
    };
  });
  canvas.querySelectorAll("[data-ws]").forEach((el) => {
    el.onclick = () => setWorkspace(el.getAttribute("data-ws"), true);
  });
}

function renderCardList(rows, empty) {
  const shown = (rows || []).filter((r) =>
    matchesExplorerQuery([r.title, r.body, r.flow, r.verdict, r.kind].join(" "))
  );
  if (!shown.length) return '<div class="empty">' + esc(empty) + "</div>";
  return (
    '<div class="expl-list">' +
    shown
      .map((r) => {
        const mark = r.verdict || r.kind || "";
        return (
          '<article class="expl-card ' +
          esc(mark) +
          '"' +
          (r.flow ? ' data-flow="' + esc(r.flow) + '"' : "") +
          "><div class=\"k\">" +
          esc(mark) +
          "</div><div class=\"t\">" +
          esc(r.title) +
          "</div><div class=\"b\">" +
          esc(r.body) +
          "</div></article>"
        );
      })
      .join("") +
    "</div>"
  );
}

function renderOverviewBody() {
  const nodes = (snapshot.graph && snapshot.graph.nodes) || [];
  const edges = (snapshot.graph && snapshot.graph.edges) || [];
  const bubbles = mapAltitudeBubbles();
  const programs = snapshot.programs || [];
  const flows = snapshot.flows || [];
  const cov = snapshot.coverage || {};
  const kinds = countMap(nodes, (n) => n.kind);
  const hops = countMap(edges, (e) => e.kind);
  const marks = countMap(
    flows.map((f) => ({ m: flowMark(f.name) || "open" })),
    (x) => x.m
  );
  const degrees = degreeMap();
  const topDeg = nodes
    .map((n) => ({ n, d: degrees.get(idVal(n.id)) || 0 }))
    .sort((a, b) => b.d - a.d)
    .slice(0, 8);
  const q = (graphFilter.q || "").toLowerCase();
  const comms = bubbles.filter((b) => !q || String(b.label || "").toLowerCase().includes(q)).slice(0, 8);
  return (
    '<div class="stat-strip">' +
    '<span><i class="k">Nodes</i> <b class="n">' +
    nodes.length +
    "</b> " +
    statChips(kinds) +
    "</span>" +
    '<span><i class="k">Hops</i> <b class="n">' +
    edges.length +
    "</b> " +
    statChips(hops) +
    "</span>" +
    '<span><i class="k">Communities</i> <b class="n">' +
    bubbles.length +
    '</b> <button type="button" class="crumb-btn" data-ws="map">Open map</button></span>' +
    '<span><i class="k">Programs</i> <b class="n">' +
    programs.length +
    "</b> " +
    statChips(countMap(programs, (p) => p.kind)) +
    "</span>" +
    '<span><i class="k">Uncovered</i> <b class="n">' +
    (cov.uncovered || []).length +
    "</b> of " +
    (cov.changed || []).length +
    " changed</span>" +
    '<span><i class="k">Flows</i> <b class="n">' +
    flows.length +
    "</b> " +
    statChips(marks) +
    "</span>" +
    "</div>" +
    renderDefaultCfg() +
    '<div class="flow-title">Communities</div>' +
    '<div class="expl-list compact">' +
    comms
      .map((b) => {
        const marks = bubbleMarks(b);
        return (
          '<article class="expl-card" data-ws="map"><div class="k">community</div><div class="t">' +
          esc(shortOf(b.label) || "bubble") +
          '</div><div class="b">' +
          (b.members || []).length +
          " nodes" +
          (marks.uncovered ? " · " + marks.uncovered + " unc." : "") +
          (marks.onTree ? " · " + marks.onTree + " on tree" : "") +
          "</div></article>"
        );
      })
      .join("") +
    "</div>" +
    '<div class="flow-title">Highest degree</div>' +
    '<div class="expl-list compact">' +
    topDeg
      .slice(0, 6)
      .map((x) => {
        const id = idVal(x.n.id);
        return (
          '<article class="expl-card" data-id="' +
          esc(id) +
          '"><div class="k">' +
          esc(x.n.kind) +
          '</div><div class="t">' +
          esc(shortOf(x.n.fqn)) +
          '</div><div class="b">degree ' +
          x.d +
          " · " +
          esc(shortToken(id)) +
          "</div></article>"
        );
      })
      .join("") +
    "</div>"
  );
}

function renderDefaultCfg() {
  const flow = defaultRunFlow();
  if (!flow || !(flow.tree && (flow.tree.nodes || []).length)) {
    return '<div class="flow-title">Default run</div><div class="empty">No control-flow yet. Review a repo — default run uses derived entries.</div>';
  }
  const treeHtml = renderSteiner(flow, snapshot.graph, false, scarSet(snapshot.findings, flow.name));
  const runHtml = renderRuns(flow, snapshot, false);
  return (
    '<div class="flow-title">Default run · ' +
    esc(flow.name) +
    " — control-flow graph</div>" +
    '<div class="stage"><div class="viewport" data-lod="' +
    lodOf(cam.k) +
    '">' +
    treeHtml +
    (runHtml ? '<div class="flow-title">Subsystem runs — click to enter</div>' + runHtml : "") +
    "</div></div>"
  );
}

function renderLineage() {
  renderTabs(snapshot.flows || [], currentFlow() && currentFlow().name);
  renderStats(snapshot);
  renderCoverage(snapshot.coverage, snapshot.findings, snapshot.graph);
  setGraphChrome(true);
  hideTip();
  if (stampBtn) stampBtn.disabled = !currentFlow();
  if (skipBtn) skipBtn.disabled = !currentFlow();
  const id = defaultFocusId();
  if (id && id !== selectedNodeId) selectedNodeId = id;
  if (!id) {
    meta.innerHTML = '<span class="crumb">Review</span> / <b>lineage</b>';
    canvas.className = "play";
    canvas.innerHTML = '<div class="empty">Select a node on the map or slice to see its incident hops.</div>';
    setZoomUi(false);
    return;
  }
  const node = nodeById.get(id);
  const hops = incidentEdges(id);
  const path = pathEnds.length === 2 ? shortestPath(pathEnds[0], pathEnds[1]) : [id];
  const pathSet = new Set(path);
  meta.innerHTML =
    '<span class="crumb">Review</span> / <button type="button" class="crumb-btn" data-ws="map">map</button> / <b>lineage</b> · ' +
    esc(shortOf((node && node.fqn) || id)) +
    " · " +
    hops.length +
    " incident hops" +
    (path.length > 1 ? " · path " + path.length : "");
  const up = meta.querySelector("[data-ws]");
  if (up) up.onclick = () => setWorkspace("map", true);

  const neighbors = [];
  const seen = new Set([id]);
  hops.forEach((e) => {
    const other = e.dir === "out" ? e.to : e.from;
    if (seen.has(other)) return;
    seen.add(other);
    const n = nodeById.get(other);
    neighbors.push({
      id: other,
      fqn: (n && n.fqn) || other,
      kind: (n && n.kind) || kindOf(snapshot.graph, other),
      dir: e.dir,
      hop: e.kind,
    });
  });
  const shown = neighbors.filter(
    (n) => graphFilter.kinds[n.kind] !== false && matchesExplorerQuery(n.fqn + " " + n.hop)
  );
  const W = 720,
    H = Math.max(280, 120 + shown.length * 28);
  const pos = new Map();
  pos.set(id, { x: W / 2, y: H / 2 });
  const ins = shown.filter((n) => n.dir === "in");
  const outs = shown.filter((n) => n.dir === "out");
  ins.forEach((n, i) => pos.set(n.id, { x: 110, y: 36 + ((i + 0.5) * (H - 48)) / Math.max(ins.length, 1) }));
  outs.forEach((n, i) => pos.set(n.id, { x: W - 110, y: 36 + ((i + 0.5) * (H - 48)) / Math.max(outs.length, 1) }));

  let svg = '<svg class="comm-edges lineage-edges" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '">';
  hops.forEach((e) => {
    const pa = pos.get(e.from),
      pb = pos.get(e.to);
    if (!pa || !pb) return;
    const d = orthoPath(pa, pb);
    svg +=
      '<path class="edge-hit" data-from="' +
      e.from +
      '" data-to="' +
      e.to +
      '" data-kind="' +
      esc(e.kind) +
      '" d="' +
      d +
      '" /><path data-from="' +
      e.from +
      '" data-to="' +
      e.to +
      '" data-kind="' +
      esc(e.kind) +
      '" d="' +
      d +
      '" />';
  });
  svg += "</svg>";

  const box = (nid, extra) => {
    const n = nodeById.get(nid) || { id: nid, fqn: fqnOf(snapshot.graph, nid), kind: kindOf(snapshot.graph, nid) };
    const p = pos.get(nid);
    if (!p) return "";
    const flags = nodeFlags(nid);
    return (
      '<button type="button" class="comm-node ego-node ' +
      kindClass(n.kind) +
      (nid === id ? " selected" : "") +
      (pathSet.has(nid) ? " on-path" : "") +
      (flags.uncovered ? " uncovered" : "") +
      (extra || "") +
      '" style="left:' +
      p.x +
      "px;top:" +
      p.y +
      'px" data-id="' +
      nid +
      '" data-fqn="' +
      esc(n.fqn) +
      '" data-kind="' +
      esc(n.kind) +
      '"><span class="name">' +
      esc(shortOf(n.fqn)) +
      '</span><span class="meta">' +
      esc(kindLine(nid, n.kind)) +
      "</span></button>"
    );
  };

  let dots = box(id, " ego");
  shown.forEach((n) => {
    dots += box(n.id, "");
  });

  const hopCards = hops.slice(0, 24).map((e) => {
    return (
      '<button type="button" class="expl-card hop" data-from="' +
      esc(e.from) +
      '" data-to="' +
      esc(e.to) +
      '" data-kind="' +
      esc(e.kind) +
      '"><div class="k">' +
      esc(e.kind) +
      " " +
      (e.dir === "out" ? "→" : "←") +
      '</div><div class="t">' +
      esc(shortOf(fqnOf(snapshot.graph, e.dir === "out" ? e.to : e.from))) +
      '</div><div class="b">' +
      esc(shortToken(e.from)) +
      " → " +
      esc(shortToken(e.to)) +
      "</div></button>"
    );
  });

  const pathRow =
    path.length > 1
      ? '<div class="path-row">' +
        path
          .map((pid) => {
            return (
              '<button type="button" class="path-chip ' +
              kindClass(kindOf(snapshot.graph, pid)) +
              '" data-id="' +
              esc(pid) +
              '">' +
              esc(shortOf(fqnOf(snapshot.graph, pid))) +
              "</button>"
            );
          })
          .join('<span class="arr">→</span>') +
        "</div>"
      : '<div class="path-row muted">Click a second node to draw the shortest path on the derived edges.</div>';

  canvas.className = "play has-stage explorer-lineage";
  canvas.innerHTML =
    '<div class="stage"><div class="viewport" data-lod="0">' +
    '<div class="flow-title">Lineage · ego of ' +
    esc(shortOf((node && node.fqn) || id)) +
    "</div>" +
    pathRow +
    '<div class="comm-wrap" style="width:' +
    W +
    "px;height:" +
    H +
    'px">' +
    svg +
    dots +
    "</div>" +
    '<div class="flow-title">Incident hops</div>' +
    '<div class="expl-list compact hops">' +
    (hopCards.join("") || '<div class="empty">No incident hops on the derived graph.</div>') +
    "</div></div></div>";
  bindStage(canvas.querySelector(".stage"), { reset: true });
  setZoomUi(true);
  canvas.querySelectorAll(".ego-node, .path-chip").forEach((el) => {
    const nid = el.getAttribute("data-id");
    if (!nid) return;
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      selectNode(nid, { peek: true });
      if (el.classList.contains("ego-node") || el.classList.contains("path-chip")) paint({ animate: "none" });
    });
  });
  bindHopClicks(canvas);
  canvas.querySelectorAll(".expl-card.hop").forEach((el) => {
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      showHop(el.getAttribute("data-from"), el.getAttribute("data-to"), el.getAttribute("data-kind"));
    });
  });
  const focusNodes = [nodeById.get(id) || { id, kind: kindOf(snapshot.graph, id), fqn: fqnOf(snapshot.graph, id) }].concat(
    shown.map((n) => nodeById.get(n.id) || n)
  );
  renderLedger(focusNodes, { selected: id });
  setLedgerHead("EGO");
  applyEgoPaint();
  if (id) peekSource(id);
}

function renderProgramOverview() {
  const programs = snapshot.programs || [];
  renderTabs(snapshot.flows || [], null);
  renderStats(snapshot);
  renderCoverage(snapshot.coverage, snapshot.findings, snapshot.graph);
  hideTip();
  if (stampBtn) stampBtn.disabled = true;
  if (skipBtn) skipBtn.disabled = true;
  if (progFocus >= programs.length) progFocus = 0;
  const filt = graphFilter.program ? esc(graphFilter.program.name) : "all";
  const bub = graphFilter.bubble
    ? mapAltitudeBubbles().find((b) => idVal(b.id) === String(graphFilter.bubble))
    : null;
  meta.innerHTML =
    '<span class="crumb">Review</span> / <button type="button" class="crumb-btn" data-up="map">map</button>' +
    (bub ? " / <b>" + esc(bub.label || "bubble") + "</b>" : "") +
    " · " +
    filt +
    (bub
      ? " · click a node to inspect"
      : " · communities only — click a bubble, then a flow tab");
  const up = meta.querySelector("[data-up=map]");
  if (up)
    up.onclick = () => {
      graphFilter.bubble = null;
      renderProgramOverview();
    };
  setGraphChrome(true);
  setLedgerHead("MAP");
  renderLegend();
  renderCommunityGraph();
  applyEgoPaint();
}

function degreeMap() {
  const m = new Map();
  for (const e of (snapshot && snapshot.graph && snapshot.graph.edges) || []) {
    m.set(idVal(e.from), (m.get(idVal(e.from)) || 0) + 1);
    m.set(idVal(e.to), (m.get(idVal(e.to)) || 0) + 1);
  }
  return m;
}

function pickCommunityNodes(degrees) {
  const must = new Set();
  for (const id of ((snapshot.coverage && snapshot.coverage.uncovered) || []).concat(
    (snapshot.coverage && snapshot.coverage.changed) || []
  )) {
    must.add(idVal(id));
  }
  for (const f of snapshot.flows || []) {
    for (const id of f.tree?.nodes || []) must.add(idVal(id));
  }
  let nodes = ((snapshot.graph && snapshot.graph.nodes) || []).slice();
  if (graphFilter.program) {
    const want = programKeyOf(graphFilter.program);
    nodes = nodes.filter(
      (n) => n.span?.file && programKeyOf(assignProgram(n.span.file, snapshot.programs || [])) === want
    );
  }
  if (graphFilter.bubble) {
    const bub = findBubble(graphFilter.bubble);
    const mem = new Set((bub?.members || []).map((m) => idVal(m)));
    nodes = nodes.filter((n) => mem.has(idVal(n.id)));
  }
  nodes = nodes.filter((n) => graphFilter.kinds[n.kind] !== false);
  const q = (graphFilter.q || "").toLowerCase();
  if (q) {
    nodes = nodes.filter(
      (n) =>
        String(n.fqn || "")
          .toLowerCase()
          .includes(q) ||
        String(n.span?.file || "")
          .toLowerCase()
          .includes(q)
    );
  }
  const scored = nodes.map((n) => ({ n, d: degrees.get(idVal(n.id)) || 0, must: must.has(idVal(n.id)) }));
  scored.sort((a, b) => Number(b.must) - Number(a.must) || b.d - a.d);
  const cap = graphFilter.bubble ? 24 : 48;
  return scored.slice(0, cap).map((x) => x.n);
}

function layoutCommunity(nodes) {
  if (graphFilter.bubble && nodes.length) {
    const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(nodes.length))));
    const cellW = 188;
    const cellH = 86;
    const W = Math.max(720, cols * cellW + 48);
    const H = Math.max(280, Math.ceil(nodes.length / cols) * cellH + 48);
    const pos = new Map();
    nodes.forEach((n, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      pos.set(idVal(n.id), { x: 28 + col * cellW + cellW / 2, y: 32 + row * cellH + cellH / 2 });
    });
    return { W, H, pos };
  }
  const W = 860,
    H = 560;
  const groups = new Map();
  for (const n of nodes) {
    const b = bubbleOf(n.id);
    const key = b ? idVal(b.id) : "_";
    if (!groups.has(key)) groups.set(key, { b, members: [] });
    groups.get(key).members.push(n);
  }
  const keys = [...groups.keys()];
  const cx = W / 2,
    cy = H / 2;
  const R = Math.min(W, H) * 0.32;
  const centers = new Map();
  keys.forEach((k, i) => {
    const a = -Math.PI / 2 + (i / Math.max(keys.length, 1)) * Math.PI * 2;
    centers.set(k, {
      x: keys.length === 1 ? cx : cx + Math.cos(a) * R,
      y: keys.length === 1 ? cy : cy + Math.sin(a) * R,
    });
  });
  const pos = new Map();
  for (const [k, g] of groups) {
    const c = centers.get(k);
    g.members.forEach((n, i) => {
      const a = (i / Math.max(g.members.length, 1)) * Math.PI * 2;
      const r = 36 + Math.min(110, g.members.length * 6);
      pos.set(idVal(n.id), { x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r });
    });
  }
  const ids = nodes.map((n) => idVal(n.id));
  for (let t = 0; t < 24; t++) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = pos.get(ids[i]),
          b = pos.get(ids[j]);
        const dx = a.x - b.x,
          dy = a.y - b.y;
        const dist = Math.hypot(dx, dy) || 0.1;
        if (dist < 78) {
          const f = ((78 - dist) / dist) * 0.35;
          a.x += dx * f;
          a.y += dy * f;
          b.x -= dx * f;
          b.y -= dy * f;
        }
      }
    }
    for (const n of nodes) {
      const p = pos.get(idVal(n.id));
      const b = bubbleOf(n.id);
      const c = centers.get(b ? idVal(b.id) : "_");
      p.x += (c.x - p.x) * 0.05;
      p.y += (c.y - p.y) * 0.05;
      p.x = clamp(p.x, 56, W - 56);
      p.y = clamp(p.y, 28, H - 28);
    }
  }
  return { W, H, pos };
}

function renderLegend() {
  if (!legendEl) return;
  const programs = snapshot.programs || [];
  let html = "";
  programs.forEach((p, i) => {
    const on = graphFilter.program && programKeyOf(graphFilter.program) === programKeyOf(p);
    html +=
      '<button type="button" class="leg' +
      (on ? " on" : "") +
      '" data-prog="' +
      i +
      '">' +
      esc(p.kind) +
      " " +
      esc(p.name) +
      "</button>";
  });
  if (programs.length > 1) {
    html +=
      '<button type="button" class="leg' +
      (!graphFilter.program ? " on" : "") +
      '" data-prog="-1">All programs</button>';
  }
  legendEl.innerHTML = html;
  legendEl.querySelectorAll("[data-prog]").forEach((el) => {
    el.onclick = () => {
      const i = Number(el.getAttribute("data-prog"));
      graphFilter.program = i >= 0 ? programs[i] : null;
      progFocus = i >= 0 ? i : 0;
      renderProgramOverview();
    };
  });
  legendEl.querySelectorAll("[data-bubble]").forEach((el) => {
    el.onclick = () => {
      const id = el.getAttribute("data-bubble");
      graphFilter.bubble = String(graphFilter.bubble) === id ? null : id;
      renderProgramOverview();
    };
  });
}

function renderCommunityGraph() {
  if (!graphFilter.bubble) {
    renderBubbleMap(mapAltitudeBubbles());
    return;
  }
  const degrees = degreeMap();
  const nodes = pickCommunityNodes(degrees);
  if (!nodes.length) {
    canvas.className = "play";
    canvas.innerHTML =
      '<div class="empty">No derived nodes match this filter. Clear the search, program chip, or kinds.</div>';
    setZoomUi(false);
    return;
  }
  const { W, H, pos } = layoutCommunity(nodes);
  const picked = new Set(nodes.map((n) => idVal(n.id)));
  let svg = '<svg class="comm-edges" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '">';
  let nEdge = 0;
  for (const e of snapshot.graph?.edges || []) {
    const a = idVal(e.from),
      b = idVal(e.to);
    if (!picked.has(a) || !picked.has(b)) continue;
    const pa = pos.get(a),
      pb = pos.get(b);
    if (!pa || !pb) continue;
    const kind = e.kind || "Calls";
    const d = orthoPath(pa, pb);
    svg +=
      '<path class="edge-hit" data-from="' +
      a +
      '" data-to="' +
      b +
      '" data-kind="' +
      esc(kind) +
      '" d="' +
      d +
      '" />';
    svg +=
      '<path data-from="' +
      a +
      '" data-to="' +
      b +
      '" data-kind="' +
      esc(kind) +
      '" d="' +
      d +
      '" />';
    if (++nEdge > 280) break;
  }
  svg += "</svg>";
  let dots = "";
  for (const n of nodes) {
    const id = idVal(n.id);
    const p = pos.get(id);
    if (!p) continue;
    const flags = nodeFlags(id);
    dots +=
      '<button type="button" class="comm-node ' +
      kindClass(n.kind) +
      (selectedNodeId === id ? " selected" : "") +
      (flags.uncovered ? " uncovered" : "") +
      '" style="left:' +
      p.x +
      "px;top:" +
      p.y +
      "px" +
      '" data-id="' +
      id +
      '" data-fqn="' +
      esc(n.fqn) +
      '" data-kind="' +
      esc(n.kind) +
      '" data-file="' +
      esc(n.span?.file || "") +
      '" title="' +
      esc(n.fqn) +
      '"><span class="name">' +
      esc(shortOf(n.fqn)) +
      '</span><span class="meta">' +
      esc(kindLine(id, n.kind)) +
      "</span></button>";
  }
  canvas.className = "play has-stage programs-view";
  canvas.innerHTML =
    '<div class="stage"><div class="viewport" data-lod="0">' +
    '<div class="flow-title">' +
    (graphFilter.q
      ? nodes.length + " matching “" + esc(graphFilter.q) + "” — click to inspect"
      : graphFilter.bubble
        ? "Inside this community — " +
          nodes.length +
          " review-relevant of " +
          ((findBubble(graphFilter.bubble) && findBubble(graphFilter.bubble).members) || []).length +
          " (uncovered / on-tree first). Search to narrow."
        : "Nodes — zoom in for kind lines, click to inspect") +
    "</div>" +
    '<div class="comm-wrap" style="width:' +
    W +
    "px;height:" +
    H +
    'px">' +
    svg +
    dots +
    "</div></div></div>";
  bindStage(canvas.querySelector(".stage"), { reset: true });
  setZoomUi(true);
  canvas.querySelectorAll(".comm-node").forEach((el) => {
    const id = el.getAttribute("data-id");
    el.addEventListener("pointerenter", (ev) => {
      highlightCommunity(id);
      showTip(el.getAttribute("data-fqn"), ev);
    });
    el.addEventListener("pointerleave", () => {
      highlightCommunity(selectedNodeId);
      hideTip();
    });
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      selectNode(id);
    });
    el.addEventListener("dblclick", (ev) => {
      ev.stopPropagation();
      const p = assignProgram(el.getAttribute("data-file") || "", snapshot.programs || []);
      if (p) openProgram(p, el);
    });
  });
  applyGraphFilter();
  bindHopClicks(canvas.querySelector("svg.comm-edges"));
  renderLedger(nodes, { selected: selectedNodeId });
  applyEgoPaint();
  if (selectedNodeId) peekSource(selectedNodeId);
}

function renderBubbleMap(clusters) {
  clusters = (clusters || [])
    .slice()
    .sort((a, b) => (b.members || []).length - (a.members || []).length)
    .slice(0, 24);
  if (!clusters.length) {
    canvas.className = "play";
    canvas.innerHTML = '<div class="empty">No communities yet. Review again after clustering finishes.</div>';
    setZoomUi(false);
    return;
  }
  const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(clusters.length))));
  const cell = 148;
  const W = Math.max(520, cols * cell + 24);
  const rows = Math.ceil(clusters.length / cols);
  const H = Math.max(280, rows * 92 + 24);
  let html = "";
  clusters.forEach((b, i) => {
    const n = (b.members || []).length;
    const x = 12 + (i % cols) * cell + cell / 2;
    const y = 18 + Math.floor(i / cols) * 92 + 36;
    const marks = bubbleMarks(b);
    html +=
      '<button type="button" class="bubble-card" style="left:' +
      x +
      "px;top:" +
      y +
      "px;--c:" +
      colorOfBubble(b) +
      '" data-bubble="' +
      idVal(b.id) +
      '"><span class="name">' +
      esc(shortOf(b.label) || "bubble") +
      '</span><span class="meta">' +
      n +
      (n === 1 ? " node" : " nodes") +
      (marks.uncovered ? " · " + marks.uncovered + " unc." : "") +
      (marks.onTree ? " · " + marks.onTree + " on tree" : "") +
      "</span>" +
      bubbleMemberChips(b, 6) +
      "</button>";
  });
  canvas.className = "play has-stage programs-view";
  canvas.innerHTML =
    '<div class="stage"><div class="viewport" data-lod="0">' +
    '<div class="flow-title">Communities — zoom in to peek members, click to enter</div>' +
    '<div class="comm-wrap" style="width:' +
    W +
    "px;height:" +
    H +
    'px">' +
    html +
    "</div></div></div>";
  bindStage(canvas.querySelector(".stage"), { reset: true });
  setZoomUi(true);
  canvas.querySelectorAll(".bubble-card").forEach((el) => {
    el.onclick = () => {
      graphFilter.bubble = el.getAttribute("data-bubble");
      selectedNodeId = null;
      renderProgramOverview();
    };
  });
  applyGraphFilter();
  const sample = [];
  const seen = new Set();
  for (const b of clusters) {
    for (const id of b.members || []) {
      const sid = idVal(id);
      if (seen.has(sid)) continue;
      seen.add(sid);
      const n = nodeById.get(sid);
      if (n) sample.push(n);
      if (sample.length >= 48) break;
    }
    if (sample.length >= 48) break;
  }
  renderLedger(sample, { selected: selectedNodeId });
}

function bubblePreviewMembers(b, max) {
  const scored = (b.members || []).map((id) => {
    const sid = idVal(id);
    const flags = nodeFlags(sid);
    return { id: sid, n: nodeById.get(sid), must: flags.uncovered || flags.changed };
  });
  scored.sort((a, b) => Number(b.must) - Number(a.must));
  return scored.slice(0, max);
}

function bubbleMemberChips(b, max) {
  const preview = bubblePreviewMembers(b, max);
  const extra = Math.max(0, (b.members || []).length - preview.length);
  return (
    '<span class="members">' +
    preview
      .map((x) => {
        const kind = (x.n && x.n.kind) || kindOf(snapshot && snapshot.graph, x.id);
        return (
          '<i class="' +
          kindClass(kind) +
          '">' +
          esc(shortOf((x.n && x.n.fqn) || x.id)) +
          "</i>"
        );
      })
      .join("") +
    (extra ? '<i class="more">+' + extra + "</i>" : "") +
    "</span>"
  );
}

function bubbleMarks(b) {
  const mem = new Set((b.members || []).map((m) => idVal(m)));
  let uncovered = 0;
  for (const id of (snapshot.coverage && snapshot.coverage.uncovered) || []) {
    if (mem.has(idVal(id))) uncovered++;
  }
  let onTree = 0;
  const flow = currentFlow();
  for (const id of (flow && flow.tree && flow.tree.nodes) || []) {
    if (mem.has(idVal(id))) onTree++;
  }
  return { uncovered, onTree };
}

function highlightCommunity(id) {
  const sid = id ? String(id) : "";
  canvas.querySelectorAll(".comm-node").forEach((el) => {
    el.classList.toggle("selected", el.getAttribute("data-id") === sid);
  });
  canvas.querySelectorAll(".comm-edges path").forEach((el) => {
    el.classList.toggle("hot", el.getAttribute("data-from") === sid || el.getAttribute("data-to") === sid);
  });
  if (ledgerGrid) {
    ledgerGrid.querySelectorAll(".cell").forEach((el) => {
      if (sid) el.classList.toggle("on", el.getAttribute("data-id") === sid || el.classList.contains("uncovered"));
    });
  }
}

function applyGraphFilter() {
  const q = (graphFilter.q || "").toLowerCase();
  canvas.querySelectorAll(".comm-node, .vnode").forEach((el) => {
    const fqn = (el.getAttribute("data-fqn") || "").toLowerCase();
    const file = (el.getAttribute("data-file") || "").toLowerCase();
    const kind = el.getAttribute("data-kind") || "";
    const match = (!q || fqn.includes(q) || file.includes(q)) && graphFilter.kinds[kind] !== false;
    el.classList.toggle("dim", !match);
    el.classList.toggle("hit", !!(q && match));
  });
  canvas.querySelectorAll(".bubble-card").forEach((el) => {
    const name = ((el.querySelector(".name") && el.querySelector(".name").textContent) || "").toLowerCase();
    const match = !q || name.includes(q);
    el.classList.toggle("dim", !match);
    el.classList.toggle("hit", !!(q && match));
  });
}

function renderTabs(flows, current) {
  tabs.innerHTML = (flows || [])
    .map((f) => {
      const mark = flowMark(f.name);
      return (
        '<button class="tab' +
        (f.name === current ? " on" : "") +
        (mark ? " " + mark : "") +
        '" data-flow="' +
        esc(f.name) +
        '">' +
        esc(f.name) +
        (mark ? '<span class="mark">' + mark + "</span>" : "") +
        "</button>"
      );
    })
    .join("");
  tabs.querySelectorAll(".tab").forEach((el) => {
    el.onclick = () => selectFlow(el.getAttribute("data-flow"));
  });
}

function renderLedger(nodes, opts) {
  if (!ledgerGrid) return;
  const selected = opts && opts.selected ? String(opts.selected) : "";
  const onTree = (opts && opts.onTree) || null;
  const list = (nodes || []).slice(0, 64);
  ledgerGrid.innerHTML = list
    .map((n) => {
      const id = idVal(n.id || n);
      const kind = n.kind || kindOf(snapshot && snapshot.graph, id);
      const flags = nodeFlags(id);
      const on = selected === id || flags.uncovered || (onTree && onTree.has(id));
      return (
        '<button type="button" class="cell ' +
        kindClass(kind) +
        (on ? " on" : "") +
        (flags.uncovered ? " uncovered" : "") +
        '" data-id="' +
        id +
        '"><span>' +
        esc(shortToken(id)) +
        '</span><span class="dots"><i></i><i></i><i></i></span></button>'
      );
    })
    .join("");
  if (ledgerMeta) {
    const lit = ledgerGrid.querySelectorAll(".on").length;
    ledgerMeta.textContent = "objects " + lit + "/" + list.length;
  }
  ledgerGrid.querySelectorAll("[data-id]").forEach((el) => {
    el.onclick = () => {
      selectNode(el.getAttribute("data-id"));
      renderLedger(list, { selected: selectedNodeId, onTree });
    };
  });
}

function renderStats(msg) {
  const g = msg.graph || {};
  const s = msg.stats || {};
  const bits = [];
  if (g.nodes && g.nodes.length) bits.push(g.nodes.length + " nodes");
  else if (s.nodes) bits.push(s.nodes + " nodes");
  if (g.edges && g.edges.length) bits.push(g.edges.length + " edges");
  else if (s.edges) bits.push(s.edges + " edges");
  if (s.files) bits.push(s.files + " files");
  if (s.elapsed_ms != null) bits.push(s.elapsed_ms + "ms");
  if (msg.plugin) bits.push(msg.plugin);
  status.textContent = bits.join(" · ");
}

function renderFlowchart(msg, opts) {
  const flow = msg.flow;
  const animate = (opts && opts.animate) || "all";
  const preview = !!(opts && opts.preview);
  if (stampBtn) stampBtn.disabled = !flow;
  if (skipBtn) skipBtn.disabled = !flow;
  renderTabs(msg.flows, flow && flow.name);
  renderStats(msg);
  renderCoverage(msg.coverage, msg.findings, msg.graph);
  if (!flow) {
    meta.innerHTML = "No proposed flows. Type a prompt or add <code>flows.toml</code>.";
    canvas.className = "play";
    canvas.innerHTML =
      '<div class="empty">Graph is ready (' +
      (msg.graph?.nodes?.length || msg.stats?.nodes || 0) +
      " nodes). Prompt a story to slice it.</div>";
    setZoomUi(false);
    return;
  }
  const prog = snapshot && snapshot.program;
  setGraphChrome(true);
  let crumb = '<button type="button" class="crumb-btn" data-go="programs">Map</button>';
  if (prog) crumb += " / <b>" + esc(prog.name) + "</b>";
  crumb +=
    " / <b>" +
    esc(flow.name) +
    "</b> · " +
    (flow.tree?.nodes || []).length +
    " on tree" +
    (preview ? ' <span class="live">live preview</span>' : "") +
    stampBadge(flow.name);
  meta.innerHTML = crumb;
  const backToPrograms = meta.querySelector("[data-go=programs]");
  if (backToPrograms) backToPrograms.onclick = () => goBack();

  const playTree = animate === "all" || animate === "tree";
  const playRuns = animate === "all" || animate === "runs";
  const keepCam = !!(opts && opts.keepCam) || animate === "runs";
  const treeHtml = renderSteiner(flow, msg.graph, playTree, scarSet(msg.findings, flow.name));
  const runHtml = renderRuns(flow, msg, playRuns);
  canvas.className = "play has-stage";
  canvas.innerHTML =
    '<div class="stage"><div class="viewport" data-lod="' +
    lodOf(cam.k) +
    '">' +
    '<div class="flow-title">Flow · Steiner — zoom out for runs, in for hops and source</div>' +
    treeHtml +
    (runHtml
      ? '<div class="flow-title" style="margin-top:18px">Subsystem runs — click to enter</div>' + runHtml
      : preview
        ? '<div class="hint-live">Runs appear when clustering finishes</div>'
        : "") +
    "</div></div>";
  bindStage(canvas.querySelector(".stage"), { reset: !keepCam });
  bindGraphFx();
  setZoomUi(true);
  applyGraphFilter();
  setLedgerHead("SLICE");
  const treeIds = (flow.tree?.nodes || []).map((id) => nodeById.get(idVal(id)) || { id, kind: kindOf(msg.graph, id), fqn: fqnOf(msg.graph, id) });
  renderLedger(treeIds, { selected: selectedNodeId, onTree: new Set((flow.tree?.nodes || []).map(idVal)) });
  applyEgoPaint();
}

function stampBadge(name) {
  const mark = flowMark(name);
  if (!mark) return "";
  return ' <span class="live ' + mark + '">' + mark + "</span>";
}

function scarSet(findings, flowName) {
  const keys = new Set();
  for (const f of findings || []) {
    if (f.kind !== "StampBroken" || f.flow !== flowName) continue;
    for (const e of f.added || []) keys.add(e.from + ">" + e.to);
  }
  return keys;
}

function renderSteiner(flow, graph, animate, scars) {
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
  const W = Math.max(720, buckets.length * 168),
    H = Math.max(280, buckets.reduce((m, c) => Math.max(m, c.length), 1) * 96 + 56);
  const colW = W / Math.max(buckets.length, 1);
  const pos = {};
  buckets.forEach((col, i) =>
    col.forEach((id, j) => {
      pos[id] = { x: colW * (i + 0.5), y: (H / (col.length + 1)) * (j + 1) };
    })
  );
  let svg =
    '<svg class="steiner steiner-edges' +
    (animate ? " play" : "") +
    '" viewBox="0 0 ' +
    W +
    " " +
    H +
    '" width="' +
    W +
    '" height="' +
    H +
    '"><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="currentColor" /></marker></defs>';
  for (const e of edges) {
    const a = pos[idVal(e.from)],
      b = pos[idVal(e.to)];
    if (!a || !b) continue;
    const mx = Math.round((a.x + b.x) / 2),
      my = Math.round((a.y + b.y) / 2) - 10;
    const d = orthoPath(a, b);
    const from = idVal(e.from),
      to = idVal(e.to);
    const scar =
      scars && (scars.has(fqnOf(graph, e.from) + ">" + fqnOf(graph, e.to)) || scars.has(fqnOf(graph, from) + ">" + fqnOf(graph, to)));
    const kind = e.kind || "Calls";
    svg +=
      '<path class="edge-hit" pathLength="1" data-from="' +
      from +
      '" data-to="' +
      to +
      '" data-kind="' +
      esc(kind) +
      '" d="' +
      d +
      '" />';
    svg +=
      '<path class="edge' +
      (scar ? " scar" : "") +
      '" pathLength="1" marker-end="url(#arr)" data-from="' +
      from +
      '" data-to="' +
      to +
      '" data-kind="' +
      esc(kind) +
      '" d="' +
      d +
      '" />';
    svg +=
      '<path class="edge-flow' +
      (scar ? " scar" : "") +
      '" pathLength="1" data-from="' +
      from +
      '" data-to="' +
      to +
      '" data-kind="' +
      esc(kind) +
      '" d="' +
      d +
      '" />';
    svg +=
      '<text class="ekind" x="' +
      mx +
      '" y="' +
      my +
      '" text-anchor="middle" data-from="' +
      from +
      '" data-to="' +
      to +
      '" data-kind="' +
      esc(kind) +
      '">' +
      esc(kind) +
      "</text>";
    const pkt = String(kind).toUpperCase().slice(0, 5) + " " + shortToken(to);
    svg +=
      '<g class="pkt"><rect x="-22" y="-7" width="44" height="14" rx="2" /><text x="0" y="3" text-anchor="middle">' +
      esc(pkt) +
      '</text><animateMotion dur="1.8s" repeatCount="indefinite" path="' +
      d +
      '" /></g>';
  }
  svg += "</svg>";
  const snippets = (snapshot && snapshot.snippets) || {};
  let cards = "";
  for (const id of nodes) {
    const p = pos[idVal(id)];
    if (!p) continue;
    const nid = idVal(id);
    const kind = kindOf(graph, id) || "Function";
    const fqn = fqnOf(graph, id);
    const label = shortOf(fqn);
    const d = level[nid] || 0;
    const node = nodeById.get(nid);
    const file = node?.span?.file || "";
    const line = node?.span?.start?.line || "";
    const where = file ? shortFile(file) + (line ? ":" + line : "") : "";
    const snip = snippetPreview(snippets[nid]);
    const flags = nodeFlags(nid);
    const away = nodeAway(nid);
    cards +=
      '<button type="button" class="vnode ' +
      kindClass(kind) +
      (away ? " away" : "") +
      (flags.uncovered ? " uncovered" : flags.changed ? " changed" : "") +
      (selectedNodeId === nid ? " selected" : "") +
      '" style="left:' +
      p.x +
      "px;top:" +
      p.y +
      "px;--d:" +
      d +
      '" data-id="' +
      nid +
      '" data-fqn="' +
      esc(fqn) +
      '" data-kind="' +
      esc(kind) +
      '" data-file="' +
      esc(file) +
      '">';
    cards += '<span class="kind">' + esc(kindLine(nid, kind)) + "</span>";
    cards += '<span class="name">' + esc(label) + "</span>";
    if (where) cards += '<span class="where">' + esc(where) + "</span>";
    cards += '<span class="fqn">' + esc(fqn) + "</span>";
    if (snip) cards += "<pre class=\"snip\">" + esc(snip) + "</pre>";
    cards += "</button>";
  }
  return (
    '<div class="steiner-wrap' +
    (animate ? " play" : "") +
    '" style="width:' +
    W +
    "px;height:" +
    H +
    'px">' +
    svg +
    cards +
    "</div>"
  );
}

function shortFile(file) {
  const f = String(file || "").replace(/\\/g, "/");
  const parts = f.split("/");
  return parts.length > 2 ? parts.slice(-2).join("/") : f;
}

function renderRuns(flow, msg, animate) {
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
  let html = '<div class="chart' + (animate ? " play" : "") + '" style="width:' + maxX + "px;height:" + maxY + 'px">';
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
      '<path class="spine" pathLength="1" d="M' +
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
    html +=
      '<path class="spine-flow" pathLength="1" d="M' +
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
  (fc.runs || []).forEach((run, i) => {
    const p = pos[idVal(run.id)] || { x: 0, y: 0 };
    const label = bubbleLabel[idVal(run.bubble)] || "run";
    const nodeIds = (run.nodes || []).map((n) => idVal(n)).join(",");
    const members = run.nodes || [];
    const chips = members
      .slice(0, 3)
      .map((n) => {
        const id = idVal(n);
        const k = kindOf(msg.graph, n);
        return (
          '<span class="chip ' +
          kindClass(k) +
          '">' +
          esc(shortOf(fqnOf(msg.graph, n))) +
          " · " +
          esc(shortToken(id)) +
          "</span>"
        );
      })
      .join("");
    html +=
      '<div class="run" style="left:' +
      p.x +
      "px;top:" +
      p.y +
      "px;--i:" +
      i +
      '" data-flow="' +
      esc(flow.name) +
      '" data-bubble="' +
      idVal(run.bubble) +
      '" data-nodes="' +
      nodeIds +
      '">';
    html += '<div class="label">' + esc(shortOf(label)) + "</div>";
    html +=
      '<div class="chips">' +
      chips +
      (members.length > 3 ? '<span class="chip">+' + (members.length - 3) + "</span>" : "") +
      "</div></div>";
  });
  html += "</div>";
  return html;
}

function renderInner(msg, animate) {
  const inner = msg.inner || { nodes: [] };
  renderTabs(msg.flow ? [msg.flow] : snapshot?.flows || [], inner.flow);
  renderStats(msg);
  renderCoverage(msg.coverage, msg.findings, null);
  meta.innerHTML =
    '<button type="button" class="crumb-btn" data-go="programs">Map</button> / ' +
    esc(inner.flow) +
    " / <b>enter</b> · walk lit, siblings grey";
  const backToPrograms = meta.querySelector("[data-go=programs]");
  if (backToPrograms) backToPrograms.onclick = () => goBack();
  let html = '<div class="inner-list' + (animate ? " play" : "") + '">';
  (inner.nodes || []).forEach((n, i) => {
    const cls = n.lit ? "lit" : "grey";
    html +=
      '<div class="inode ' +
      cls +
      '" style="--i:' +
      i +
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
  });
  html += "</div>";
  canvas.className = "play";
  canvas.innerHTML = html;
  setZoomUi(false);
  hideTip();
  canvas.querySelectorAll(".inode").forEach((el) => {
    el.addEventListener("click", () => {
      const isLeaf = el.getAttribute("data-leaf") === "1";
      if (!isLeaf) {
        enterRun(el.getAttribute("data-flow"), el.getAttribute("data-id"));
        return;
      }
      selectedNodeId = el.getAttribute("data-id");
      peekSource(selectedNodeId);
    });
  });
}

function renderCoverage(cov, findings, graph) {
  const uncovered = (cov && cov.uncovered) || [];
  const changed = (cov && cov.changed) || [];
  const names = (snapshot && snapshot.flows ? snapshot.flows : []).map((f) => f.name);
  let holds = 0,
    broken = 0,
    skipped = 0,
    pending = 0;
  for (const name of names) {
    const mark = flowMark(name);
    if (mark === "holds") holds++;
    else if (mark === "broken") broken++;
    else if (mark === "skipped") skipped++;
    else pending++;
  }
  skipped += skippedFlows.filter((n) => names.indexOf(n) < 0).length;
  let html =
    "Coverage " +
    changed.length +
    " changed · " +
    uncovered.length +
    " uncovered";
  if (names.length) {
    html +=
      " · Review " +
      holds +
      " stamped · " +
      skipped +
      " skipped · " +
      broken +
      " broken · " +
      pending +
      " pending";
    if (!pending && !broken && !uncovered.length) {
      html += ' <span class="live holds">complete</span>';
    }
  }
  if (uncovered.length && graph) {
    const sample = uncovered
      .slice(0, 3)
      .map((id) => shortOf(fqnOf(graph, id)))
      .filter(Boolean);
    if (sample.length) html += " · e.g. " + sample.map(esc).join(", ");
    if (uncovered.length > 3) html += " +" + (uncovered.length - 3);
  }
  const scars = (findings || []).filter((f) => f.kind === "StampBroken" || f.kind === "UnmatchedHint");
  if (scars.length) {
    html +=
      "<ul>" +
      scars
        .slice(0, 4)
        .map((f) => {
          if (f.kind === "UnmatchedHint")
            return '<li class="finding">unmatched ' + esc(f.fqn) + " in " + esc(f.flow) + "</li>";
          return (
            '<li class="finding">stamp broken ' +
            esc(f.flow) +
            " · +" +
            (f.added || []).length +
            " / −" +
            (f.removed || []).length +
            "</li>"
          );
        })
        .join("") +
      (scars.length > 4 ? "<li>…</li>" : "") +
      "</ul>";
  }
  coverage.innerHTML = html;
}

function enterBubble(snap, flowName, bubbleId) {
  const flow = (snap.flows || []).find((f) => f.name === flowName);
  const bubble = (snap.bubbles || []).find((b) => String(idVal(b.id)) === String(bubbleId));
  if (!flow || !bubble) return { flow: flowName, bubble: bubbleId, nodes: [] };
  const tree = new Set((flow.tree?.nodes || []).map((id) => String(idVal(id))));
  const children = (snap.bubbles || []).filter(
    (b) => b.parent != null && String(idVal(b.parent)) === String(bubbleId)
  );
  const adj = new Map();
  for (const e of snap.graph?.edges || []) {
    const a = String(idVal(e.from)),
      b = String(idVal(e.to));
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push(b);
    adj.get(b).push(a);
  }
  const distTo = (target) => {
    if (tree.has(target)) return 0;
    const q = [...tree].map((id) => [id, 0]);
    const seen = new Set(tree);
    while (q.length) {
      const [n, d] = q.shift();
      if (n === target) return d;
      for (const m of adj.get(n) || []) {
        if (seen.has(m)) continue;
        seen.add(m);
        q.push([m, d + 1]);
      }
    }
    return 99;
  };
  let nodes;
  if (!children.length) {
    nodes = (bubble.members || []).map((id) => {
      const n = nodeById.get(String(idVal(id)));
      const lit = tree.has(String(idVal(id)));
      return {
        id,
        fqn: n?.fqn ?? String(id),
        kind: n?.kind ?? "Function",
        lit,
        grey: !lit,
        is_leaf: true,
        distance: lit ? 0 : distTo(String(idVal(id))),
      };
    });
  } else {
    nodes = children.map((b) => {
      const members = (b.members || []).map((m) => String(idVal(m)));
      const lit = members.some((m) => tree.has(m));
      const distance = Math.min(...members.map((m) => distTo(m)), 99);
      return {
        id: b.id,
        fqn: b.label,
        kind: "Type",
        lit,
        grey: !lit,
        is_leaf: false,
        distance: lit ? 0 : distance,
      };
    });
  }
  nodes.sort(
    (a, b) => Number(b.lit) - Number(a.lit) || (a.distance ?? 99) - (b.distance ?? 99) || String(a.fqn).localeCompare(String(b.fqn))
  );
  if (!children.length && nodes.length > 24) nodes = nodes.slice(0, 24);
  return { flow: flowName, bubble: bubbleId, nodes };
}
