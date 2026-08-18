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
const toastEl = document.getElementById("toast");

const PHASE_ORDER = ["walk", "extract", "parent", "link", "cluster", "flows"];
const PHASE_ALIAS = {
  start: "walk",
  walk: "walk",
  extract: "extract",
  parent: "parent",
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
let viewMode = "runs";
let openNodeId = null;
let innerCursor = 0;
let railOpen = "";
let toastTimer = 0;
const CAM_MIN = 0.35;
const CAM_MAX = 3.6;

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
  if (document.activeElement === prompt) return;
  if (busy) return;
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
  if (e.key === "[" || e.key === "PageUp") {
    e.preventDefault();
    cycleFlow(-1);
    return;
  }
  if (e.key === "]" || e.key === "PageDown") {
    e.preventDefault();
    cycleFlow(1);
    return;
  }
  if (stack[stack.length - 1]?.kind === "bubble" && (e.key === "j" || e.key === "k" || e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter")) {
    e.preventDefault();
    if (e.key === "Enter") activateInner();
    else moveInner(e.key === "j" || e.key === "ArrowDown" ? 1 : -1);
    return;
  }
  if (e.key === "Enter" && stack[stack.length - 1]?.kind === "flow") {
    const first = canvas.querySelector(".run");
    if (first) {
      e.preventDefault();
      enterRun(first.getAttribute("data-flow"), first.getAttribute("data-bubble"), first);
      return;
    }
    const flow = currentFlow();
    const run = flow?.flowchart?.runs?.[0];
    if (run) {
      e.preventDefault();
      enterRun(flow.name, idVal(run.bubble));
    }
    return;
  }
  if (e.key === "s" || e.key === "S") {
    e.preventDefault();
    const flow = currentFlow();
    if (flow) vscode.postMessage({ type: "stamp", flow: flow.name });
    return;
  }
  if (e.key === "x" || e.key === "X") {
    e.preventDefault();
    const flow = currentFlow();
    if (flow) vscode.postMessage({ type: "skip", flow: flow.name });
  }
});
if (zoomInBtn) zoomInBtn.onclick = () => zoomBy(1.2);
if (zoomOutBtn) zoomOutBtn.onclick = () => zoomBy(1 / 1.2);
if (zoomFitBtn) zoomFitBtn.onclick = () => setCamTarget(0, 0, 1);
if (stampBtn)
  stampBtn.onclick = () => {
    const flow = currentFlow();
    if (flow) vscode.postMessage({ type: "stamp", flow: flow.name });
  };
if (skipBtn)
  skipBtn.onclick = () => {
    const flow = currentFlow();
    if (flow) vscode.postMessage({ type: "skip", flow: flow.name });
  };

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
      '<div class="empty"><b>Review a change as flows.</b><div>Optional prompt <code>name=hit,hit</code>, then Review. Stamp or skip each proposed story.</div></div>';
    meta.textContent = "";
    coverage.textContent = "";
    coverage.hidden = true;
    tabs.innerHTML = "";
    status.textContent = "";
    setZoomUi(false);
    hideTip();
    setActionState();
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
  if (msg.type === "marks") {
    stampRows = msg.stamps || [];
    skippedFlows = msg.skipped || [];
    if (snapshot) {
      snapshot.stamps = stampRows;
      snapshot.skipped = skippedFlows;
      if (msg.findings) snapshot.findings = msg.findings;
    }
    if (msg.toast) showToast(msg.toast);
    if (snapshot) paint({ animate: "none", keepCam: true });
    return;
  }
  if (msg.type === "opened") {
    openNodeId = msg.id != null ? String(msg.id) : null;
    if (snapshot) paint({ animate: "none", keepCam: true });
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
  indexGraph(snapshot.graph);
  paint({ animate: "tree", preview: true, keepCam: !!canvas.querySelector(".stage") });
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
    preview: false,
    inner: inner ? msg.inner : null,
    depth: msg.depth || 0,
  };
  if (msg.flow?.name) flowName = msg.flow.name;
  else if (!flowName && snapshot.flows[0]) flowName = snapshot.flows[0].name;
  if (inner) stack = [{ kind: "flow" }, { kind: "bubble", flow: msg.inner.flow, bubble: String(msg.inner.bubble) }];
  else stack = [{ kind: "flow" }];
  indexGraph(snapshot.graph);
  stampRows = snapshot.stamps || [];
  skippedFlows = snapshot.skipped || [];
  finishWork();
  paint({ animate: lastTreeKey && treeKey(currentFlow()) === lastTreeKey ? "runs" : "all" });
}

function currentFlow() {
  if (!snapshot) return null;
  return snapshot.flows.find((f) => f.name === flowName) || snapshot.flow || snapshot.flows[0];
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
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function setZoomUi(on) {
  if (zoomBar) zoomBar.hidden = !on;
  if (on) updateZoomPct();
}

function updateZoomPct() {
  if (zoomPct) zoomPct.textContent = Math.round(cam.k * 100) + "%";
}

function applyCam() {
  if (viewportEl) {
    viewportEl.style.transform = "translate(" + cam.x + "px," + cam.y + "px) scale(" + cam.k + ")";
  }
  updateZoomPct();
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
  const svg = canvas.querySelector("svg.steiner");
  if (svg) {
    const edges = [...svg.querySelectorAll(".edge")];
    const flows = [...svg.querySelectorAll(".edge-flow")];
    const nodes = [...svg.querySelectorAll(".vnode")];
    const clearHot = () => {
      svg.classList.remove("focus");
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
        zoomToEl(g, Math.min(2.2, Math.max(1.6, camTo.k * 1.35)));
      });
      g.addEventListener("dblclick", (ev) => {
        ev.stopPropagation();
        const run = [...canvas.querySelectorAll(".run")].find((el) =>
          (el.getAttribute("data-nodes") || "").split(",").includes(id)
        );
        if (run) enterRun(run.getAttribute("data-flow"), run.getAttribute("data-bubble"), run);
      });
    });
    if (!reduceMotion()) {
      setTimeout(() => svg.classList.add("flowing"), 520);
    }
  }
  canvas.querySelectorAll(".run").forEach((el) => {
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      enterRun(el.getAttribute("data-flow"), el.getAttribute("data-bubble"), el);
    });
  });
  canvas.querySelectorAll(".walk-node").forEach((el) => {
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const id = el.getAttribute("data-id");
      const run = [...canvas.querySelectorAll(".run")].find((r) =>
        (r.getAttribute("data-nodes") || "").split(",").includes(id)
      );
      if (run) {
        zoomToEl(run, 1.55);
        run.classList.add("hot");
        setTimeout(() => run.classList.remove("hot"), 700);
        return;
      }
      const g = [...canvas.querySelectorAll(".vnode")].find((n) => n.getAttribute("data-id") === id);
      if (g) zoomToEl(g, 1.8);
    });
    el.addEventListener("dblclick", (ev) => {
      ev.stopPropagation();
      vscode.postMessage({
        type: "enterNode",
        flow: (currentFlow() || {}).name,
        id: el.getAttribute("data-id"),
        isLeaf: true,
      });
    });
  });
}

function selectFlow(name) {
  flowName = name;
  stack = [{ kind: "flow" }];
  paint({ animate: "tree" });
}

function enterRun(flow, bubble, fromEl) {
  const token = ++navToken;
  const go = () => {
    if (token !== navToken) return;
    const label = bubbleLabelOf(bubble);
    stack.push({ kind: "bubble", flow, bubble: String(bubble), label });
    innerCursor = 0;
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
  if (stack.length <= 1) return;
  const token = ++navToken;
  const fromInner = stack[stack.length - 1].kind === "bubble";
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
  setActionState();
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
  if (prompt) prompt.disabled = on;
  setActionState();
}

function setActionState() {
  const hasFlow = !!(snapshot && currentFlow() && !snapshot.preview);
  if (stampBtn) stampBtn.disabled = busy || !hasFlow;
  if (skipBtn) skipBtn.disabled = busy || !hasFlow;
  if (backBtn) backBtn.disabled = busy || stack.length <= 1;
}

function showToast(text) {
  if (!toastEl || !text) return;
  toastEl.textContent = text;
  toastEl.hidden = false;
  toastEl.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("on");
    toastEl.hidden = true;
  }, 2200);
}

function cycleFlow(dir) {
  const flows = snapshot?.flows || [];
  if (flows.length < 2) return;
  const i = Math.max(0, flows.findIndex((f) => f.name === (currentFlow() || {}).name));
  const next = flows[(i + dir + flows.length) % flows.length];
  selectFlow(next.name);
}

function moveInner(dir) {
  const items = [...canvas.querySelectorAll(".inode")];
  if (!items.length) return;
  innerCursor = (innerCursor + dir + items.length) % items.length;
  items.forEach((el, i) => el.classList.toggle("cursor", i === innerCursor));
  items[innerCursor].scrollIntoView({ block: "nearest" });
}

function activateInner() {
  const items = [...canvas.querySelectorAll(".inode")];
  const el = items[innerCursor] || items[0];
  if (!el) return;
  el.click();
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
  setActionState();
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
  renderTabs(msg.flows, flow && flow.name);
  renderStats(msg);
  renderCoverage(msg.coverage, msg.findings, msg.graph);
  if (!flow) {
    renderCrumbs([{ label: "Review" }]);
    canvas.className = "play";
    canvas.innerHTML =
      '<div class="empty">Graph is ready (' +
      (msg.graph?.nodes?.length || msg.stats?.nodes || 0) +
      " nodes). Prompt a story or add <code>flows.toml</code>.</div>";
    setZoomUi(false);
    return;
  }
  const scars = scarSet(msg.findings, flow.name);
  const runHtml = renderRuns(flow, msg, animate === "all" || animate === "runs", scars);
  const hasRuns = !!(flow.flowchart?.runs && flow.flowchart.runs.length >= 2);
  const showTree = !hasRuns || viewMode === "tree";
  const playTree = showTree && (animate === "all" || animate === "tree");
  const keepCam = !!(opts && opts.keepCam) || animate === "runs" || animate === "none";
  renderCrumbs(crumbTrail(flow.name), {
    extra:
      '<span class="hint-inline">' +
      (flow.tree?.nodes || []).length +
      " on tree</span>" +
      (preview ? ' <span class="live">live preview</span>' : "") +
      stampBadge(flow.name) +
      (hasRuns
        ? '<span class="view-toggle" role="group">' +
          '<button type="button" data-view="runs"' +
          (!showTree ? ' class="on"' : "") +
          ">Runs</button>" +
          '<button type="button" data-view="tree"' +
          (showTree ? ' class="on"' : "") +
          ">Walk</button></span>"
        : ""),
  });

  const treeHtml = showTree ? renderSteiner(flow, msg.graph, playTree, scars) : "";
  canvas.className = "play has-stage";
  canvas.innerHTML =
    '<div class="stage"><div class="viewport">' +
    renderWalk(flow, msg.graph, scars) +
    (showTree
      ? '<div class="flow-title">Steiner walk</div>' + treeHtml
      : '<div class="flow-title">Subsystem runs — click a box to enter</div>' + (runHtml || "")) +
    (!runHtml && preview && !showTree
      ? '<div class="hint-live">Runs appear when clustering finishes</div>'
      : "") +
    "</div></div>";
  bindStage(canvas.querySelector(".stage"), { reset: !keepCam });
  bindGraphFx();
  bindCrumbs();
  bindViewToggle(hasRuns);
  setZoomUi(true);
}

function crumbTrail(flowName) {
  const crumbs = [{ label: "Review", to: 0 }];
  if (flowName) crumbs.push({ label: flowName, to: 1 });
  for (let i = 1; i < stack.length; i++) {
    const step = stack[i];
    crumbs.push({
      label: step.label || bubbleLabelOf(step.bubble) || "enter",
      to: i + 1,
    });
  }
  return crumbs;
}

function renderCrumbs(crumbs, opts) {
  const extra = (opts && opts.extra) || "";
  meta.innerHTML =
    '<div class="crumbs">' +
    crumbs
      .map((c, i) => {
        const last = i === crumbs.length - 1;
        const body = last ? "<b>" + esc(c.label) + "</b>" : esc(c.label);
        if (c.to == null || last) return '<span class="crumb">' + body + "</span>";
        return (
          '<button type="button" class="crumb link" data-depth="' +
          c.to +
          '">' +
          body +
          "</button>"
        );
      })
      .join('<span class="sep">/</span>') +
    extra +
    "</div>";
}

function bindCrumbs() {
  meta.querySelectorAll(".crumb.link").forEach((el) => {
    el.onclick = () => {
      const depth = Number(el.getAttribute("data-depth"));
      if (!depth) {
        stack = [{ kind: "flow" }];
        paint({ animate: "tree" });
        return;
      }
      stack = stack.slice(0, depth);
      if (!stack.length) stack = [{ kind: "flow" }];
      paint({ animate: stack.length > 1 ? "list" : "tree" });
    };
  });
}

function bindViewToggle(hasRuns) {
  if (!hasRuns) return;
  meta.querySelectorAll(".view-toggle button").forEach((el) => {
    el.onclick = () => {
      viewMode = el.getAttribute("data-view") === "tree" ? "tree" : "runs";
      paint({ animate: "none", keepCam: true });
    };
  });
}

function bubbleLabelOf(id) {
  const b = (snapshot?.bubbles || []).find((x) => String(idVal(x.id)) === String(id));
  return b ? shortOf(b.label) : "";
}

function renderWalk(flow, graph, scars) {
  const nodes = flow.tree?.nodes || [];
  const edges = flow.tree?.edges || [];
  if (!nodes.length) return "";
  const byFrom = {};
  for (const e of edges) {
    const a = idVal(e.from);
    if (!byFrom[a]) byFrom[a] = [];
    byFrom[a].push(e);
  }
  const incoming = {};
  for (const id of nodes) incoming[idVal(id)] = 0;
  for (const e of edges) {
    const b = idVal(e.to);
    if (b in incoming) incoming[b] += 1;
  }
  let start = nodes.map(idVal).find((id) => incoming[id] === 0) || idVal(nodes[0]);
  const seen = new Set();
  const steps = [];
  let cur = start;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const nexts = byFrom[cur] || [];
    steps.push({ id: cur, edge: nexts[0] });
    cur = nexts[0] ? idVal(nexts[0].to) : null;
  }
  for (const id of nodes) {
    if (!seen.has(idVal(id))) steps.push({ id: idVal(id), edge: null });
  }
  return (
    '<div class="walk" title="Steiner walk">' +
    steps
      .map((step, i) => {
        const fqn = fqnOf(graph, step.id);
        const scar =
          step.edge &&
          scars &&
          scars.has(fqnOf(graph, step.edge.from) + ">" + fqnOf(graph, step.edge.to));
        const chip =
          '<button type="button" class="walk-node' +
          (String(step.id) === String(openNodeId) ? " open" : "") +
          '" data-id="' +
          esc(String(step.id)) +
          '" title="' +
          esc(fqn) +
          '">' +
          esc(shortOf(fqn)) +
          "</button>";
        const rel = step.edge
          ? '<span class="walk-rel' +
            (scar ? " scar" : "") +
            '">' +
            esc(step.edge.kind) +
            "</span>"
          : "";
        return chip + (i < steps.length - 1 || step.edge ? rel : "");
      })
      .join("") +
    "</div>"
  );
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
  const W = 640,
    H = Math.max(220, buckets.reduce((m, c) => Math.max(m, c.length), 1) * 72 + 40);
  const colW = W / Math.max(buckets.length, 1);
  const pos = {};
  buckets.forEach((col, i) =>
    col.forEach((id, j) => {
      pos[id] = { x: colW * (i + 0.5), y: (H / (col.length + 1)) * (j + 1) };
    })
  );
  let svg =
    '<svg class="steiner' +
    (animate ? " play" : "") +
    '" viewBox="0 0 ' +
    W +
    " " +
    H +
    '"><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="currentColor" /></marker></defs>';
  for (const e of edges) {
    const a = pos[idVal(e.from)],
      b = pos[idVal(e.to)];
    if (!a || !b) continue;
    const mx = (a.x + b.x) / 2,
      my = (a.y + b.y) / 2 - 8;
    const d =
      "M" + a.x + "," + a.y + " C" + mx + "," + a.y + " " + mx + "," + b.y + " " + b.x + "," + b.y;
    const from = idVal(e.from),
      to = idVal(e.to);
    const scar =
      scars && (scars.has(fqnOf(graph, e.from) + ">" + fqnOf(graph, e.to)) || scars.has(fqnOf(graph, from) + ">" + fqnOf(graph, to)));
    svg +=
      '<path class="edge' +
      (scar ? " scar" : "") +
      '" pathLength="1" marker-end="url(#arr)" data-from="' +
      from +
      '" data-to="' +
      to +
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
      '" d="' +
      d +
      '" />';
    svg += '<text class="ekind" x="' + mx + '" y="' + my + '" text-anchor="middle">' + esc(e.kind) + "</text>";
  }
  for (const id of nodes) {
    const p = pos[idVal(id)];
    if (!p) continue;
    const type = kindOf(graph, id) === "Type";
    const fqn = fqnOf(graph, id);
    const label = shortOf(fqn);
    const w = Math.max(120, Math.min(200, 8 * label.length + 24));
    const d = level[idVal(id)] || 0;
    svg +=
      '<g class="vnode" style="--d:' +
      d +
      '" data-id="' +
      idVal(id) +
      '" data-fqn="' +
      esc(fqn) +
      '">';
    svg +=
      '<rect class="node-box' +
      (type ? " type" : "") +
      '" x="' +
      (p.x - w / 2) +
      '" y="' +
      (p.y - 20) +
      '" width="' +
      w +
      '" height="40" rx="5" />';
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
      "</text></g>";
  }
  svg += "</svg>";
  return svg;
}

function renderRuns(flow, msg, animate, scars) {
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
    const nodes = (run.nodes || []).map((n) => shortOf(fqnOf(msg.graph, n))).join(" → ");
    const scar = runHasScar(run, msg.graph, scars);
    html +=
      '<div class="run' +
      (scar ? " scar" : "") +
      '" style="left:' +
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
    html += '<div class="meta">' + esc(nodes) + "</div></div>";
  });
  html += "</div>";
  return html;
}

function runHasScar(run, graph, scars) {
  if (!scars || !scars.size) return false;
  const ids = run.nodes || [];
  for (let i = 0; i < ids.length - 1; i++) {
    if (scars.has(fqnOf(graph, ids[i]) + ">" + fqnOf(graph, ids[i + 1]))) return true;
  }
  return ids.some((id) => {
    const fqn = fqnOf(graph, id);
    for (const key of scars) {
      if (key.startsWith(fqn + ">") || key.endsWith(">" + fqn)) return true;
    }
    return false;
  });
}

function renderInner(msg, animate) {
  const inner = msg.inner || { nodes: [] };
  renderTabs(snapshot?.flows || (msg.flow ? [msg.flow] : []), inner.flow);
  renderStats(msg);
  renderCoverage(msg.coverage, msg.findings, snapshot?.graph);
  renderCrumbs(crumbTrail(inner.flow), {
    extra: ' <span class="hint-inline">walk lit · siblings grey by hop</span>',
  });
  let html = '<div class="inner-list' + (animate && animate !== "none" ? " play" : "") + '">';
  (inner.nodes || []).forEach((n, i) => {
    const dist = n.lit ? 0 : Math.min(n.distance == null ? 3 : n.distance, 3);
    const cls =
      (n.lit ? "lit" : "grey d" + dist) +
      (String(idVal(n.id)) === String(openNodeId) ? " open" : "") +
      (i === innerCursor ? " cursor" : "");
    const hop =
      n.lit ? "on walk" : n.distance === 1 ? "1 hop" : (n.distance || 0) + " hops";
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
      (n.is_leaf ? " · source" : " · enter") +
      " · " +
      hop +
      "</span></div>";
    html += '<div class="meta">' + esc(n.fqn) + "</div></div>";
  });
  html += "</div>";
  canvas.className = "play";
  canvas.innerHTML = html;
  setZoomUi(false);
  hideTip();
  bindCrumbs();
  const items = [...canvas.querySelectorAll(".inode")];
  items.forEach((el, i) => {
    el.addEventListener("click", () => {
      innerCursor = i;
      const isLeaf = el.getAttribute("data-leaf") === "1";
      if (!isLeaf) {
        enterRun(el.getAttribute("data-flow"), el.getAttribute("data-id"));
        return;
      }
      vscode.postMessage({
        type: "enterNode",
        flow: el.getAttribute("data-flow"),
        id: el.getAttribute("data-id"),
        isLeaf: true,
      });
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
  const complete = names.length && !pending && !broken && !uncovered.length;
  const chips = [];
  chips.push(chip("changed", changed.length + " changed", "changed", false));
  chips.push(chip("uncovered", uncovered.length + " uncovered", "uncovered", !!uncovered.length));
  if (names.length) {
    chips.push(chip("pending", pending + " pending", "pending", !!pending));
    chips.push(chip("holds", holds + " stamped", "holds", false));
    if (skipped) chips.push(chip("skipped", skipped + " skipped", "skipped", false));
    if (broken) chips.push(chip("broken", broken + " broken", "broken", true));
  }
  let html = '<div class="rail-chips">' + chips.join("") + (complete ? '<span class="live holds">complete</span>' : "") + "</div>";
  const details = [];
  if (railOpen === "uncovered" && uncovered.length && graph) {
    details.push(
      "<ul>" +
        uncovered
          .slice(0, 12)
          .map((id) => {
            const fqn = fqnOf(graph, id);
            return (
              '<li><button type="button" class="finding jump" data-jump="node" data-id="' +
              esc(String(idVal(id))) +
              '">' +
              esc(fqn) +
              "</button></li>"
            );
          })
          .join("") +
        (uncovered.length > 12 ? "<li>…</li>" : "") +
        "</ul>"
    );
  }
  const interesting = (findings || []).filter(
    (f) => f.kind === "UnmatchedHint" || f.kind === "UncoveredNode" || f.kind === "StampBroken"
  );
  if ((railOpen === "broken" || railOpen === "uncovered") && interesting.length) {
    details.push(
      "<ul>" +
        interesting
          .filter((f) =>
            railOpen === "broken" ? f.kind === "StampBroken" : f.kind !== "StampBroken"
          )
          .slice(0, 8)
          .map((f) => {
            if (f.kind === "UnmatchedHint")
              return (
                '<li class="finding">unmatched ' +
                esc(f.fqn) +
                " in " +
                esc(f.flow) +
                "</li>"
              );
            if (f.kind === "UncoveredNode")
              return '<li class="finding">uncovered ' + esc(f.fqn) + "</li>";
            if (f.kind === "StampBroken")
              return (
                '<li><button type="button" class="finding jump" data-jump="flow" data-flow="' +
                esc(f.flow) +
                '">stamp broken ' +
                esc(f.flow) +
                " · +" +
                (f.added || []).length +
                " / −" +
                (f.removed || []).length +
                "</button></li>"
              );
            return '<li class="finding">' + esc(f.kind) + "</li>";
          })
          .join("") +
        "</ul>"
    );
  }
  if (details.length) html += '<div class="rail-detail">' + details.join("") + "</div>";
  coverage.innerHTML = html;
  coverage.hidden = !html;
  coverage.querySelectorAll(".chip").forEach((el) => {
    el.onclick = () => {
      const key = el.getAttribute("data-key");
      railOpen = railOpen === key ? "" : key;
      renderCoverage(cov, findings, graph);
    };
  });
  coverage.querySelectorAll(".jump").forEach((el) => {
    el.onclick = () => {
      if (el.getAttribute("data-jump") === "flow") {
        selectFlow(el.getAttribute("data-flow"));
        return;
      }
      jumpNode(el.getAttribute("data-id"));
    };
  });
}

function chip(key, label, cls, warn) {
  return (
    '<button type="button" class="chip ' +
    cls +
    (warn ? " warn" : "") +
    (railOpen === key ? " on" : "") +
    '" data-key="' +
    key +
    '">' +
    esc(label) +
    "</button>"
  );
}

function jumpNode(id) {
  const flows = snapshot?.flows || [];
  const hit = flows.find((f) => (f.tree?.nodes || []).some((n) => idVal(n) === idVal(id)));
  if (hit && hit.name !== (currentFlow() || {}).name) selectFlow(hit.name);
  vscode.postMessage({
    type: "enterNode",
    flow: (hit || currentFlow() || {}).name,
    id,
    isLeaf: true,
  });
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
  return { flow: flowName, bubble: bubbleId, nodes };
}
