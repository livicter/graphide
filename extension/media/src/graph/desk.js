/** Vanilla graph paint + host wiring. React mounts chrome; bootDesk binds the same ids. */
import { acquireHost } from "../host/adapter.js";
import { shapeOf } from "./derived-node.jsx";
import {
  renderSequenceCanvas,
  renderDeltaCanvas as mountDeltaCanvas,
  renderDataflowCanvas,
  renderLifecycleCanvas,
  renderSliceCanvas,
  renderLineageCanvas,
  renderEnterCanvas,
  unmountSequenceCanvas,
  unmountReviewCanvas,
} from "./sequence-canvas.jsx";
import { TRAJECTORY_FIXTURE } from "./trajectory-fixture.js";

export function bootDesk() {
  const vscode = acquireHost();
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
const egoHopsEl = document.getElementById("egoHops");
const reorgBtns = document.querySelectorAll(".reorg-btn");
const llmBtn = document.getElementById("llmBtn");
const llmPane = document.getElementById("llmPane");
const llmClose = document.getElementById("llmClose");
const llmStatusEl = document.getElementById("llmStatus");
const llmPreset = document.getElementById("llmPreset");
const llmBaseUrl = document.getElementById("llmBaseUrl");
const llmModel = document.getElementById("llmModel");
const llmKey = document.getElementById("llmKey");
const llmSave = document.getElementById("llmSave");
const llmTest = document.getElementById("llmTest");
const llmShowKey = document.getElementById("llmShowKey");
const llmBridge = document.getElementById("llmBridge");
const llmLog = document.getElementById("llmLog");
const llmAsk = document.getElementById("llmAsk");
const llmSend = document.getElementById("llmSend");
const toastEl = document.getElementById("toast");
const keysPane = document.getElementById("keysPane");
const keysBtn = document.getElementById("keysBtn");
const keysClose = document.getElementById("keysClose");
const exportBtn = document.getElementById("exportBtn");
const exportMenu = document.getElementById("exportMenu");
const exportClose = document.getElementById("exportClose");
const LLM_PRESETS = {
  ollama: { url: "http://127.0.0.1:11434/v1", model: "llama3.2" },
  lmstudio: { url: "http://127.0.0.1:1234/v1", model: "local-model" },
  llamacpp: { url: "http://127.0.0.1:8080/v1", model: "local-model" },
  openai: { url: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  custom: { url: "", model: "" },
};
let llmTok = 0;

const WORKSPACES = ["map", "slice", "lineage", "decisions", "registry", "overview", "timeline", "delta", "sequence", "dataflow", "lifecycle", "trace", "passport"];
const LIST_WORKSPACES = { decisions: 1, registry: 1, timeline: 1, delta: 1, sequence: 1, dataflow: 1, lifecycle: 1, trace: 1, passport: 1 };
const REVIEW_CANVAS_WS = { sequence: 1, delta: 1, dataflow: 1, lifecycle: 1, slice: 1, overview: 1, lineage: 1 };

function reviewCanvasWorkspace(ws) {
  return !!REVIEW_CANVAS_WS[ws || explorerWs];
}

function enterCanvasActive() {
  const top = stack[stack.length - 1];
  return !!(top && top.kind === "bubble");
}

function unmountAllReviewCanvases() {
  unmountReviewCanvas();
  unmountSequenceCanvas();
  seqBodyKey = "";
  deltaBodyKey = "";
  dfBodyKey = "";
  lcBodyKey = "";
  sliceBodyKey = "";
  enterBodyKey = "";
  lineageBodyKey = "";
  lineageHopCursor = -1;
  lineageEgoId = "";
}

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
let cancelling = false;
let previewTimer = 0;
let lastTreeKey = "";
let targetPct = 0;
let shownPct = 0;
let barRaf = 0;
let pendingProgress = null;
let progressRaf = 0;
let panelRaf = 0;
let offviewRaf = 0;
let navToken = 0;
let viewportEl = null;
let cam = { x: 0, y: 0, k: 1 };
let camTo = { x: 0, y: 0, k: 1 };
let camRaf = 0;
/** ScrollDrive velocity → camera lerp alpha (S1g). Idle desk keeps CAM_EASE_BASE. */
const CAM_EASE_BASE = 0.24;
const CAM_EASE_SNAP = 0.36;
const CAM_EASE_LOOSE = 0.12;
const SCROLL_VEL_LOOSE = 0.45;
let camEase = CAM_EASE_BASE;
let progFocus = 0;
let selectedNodeId = null;
let pathEnds = [];
let explorerWs = "map";
let explorerPinned = false;
let egoMode = false;
let egoHops = 1;
let selectedDecisionKey = "";
let timelineCursor = 0;
let deltaView = "delta";
let deltaCursor = -1;
let deltaWalk = { playing: false, timer: 0 };
let seqCursor = -1;
let seqWalk = { playing: false, timer: 0 };
let seqBodyKey = "";
/** ADE SSR — participant focus id; graph-only highlight (null clears). */
let seqPartFocusId = null;
let deltaBodyKey = "";
let dfCursor = -1;
let dfWalk = { playing: false, timer: 0 };
let dfBodyKey = "";
let dfRoleFilter = null; // ADE RDF — lane role filter (graph-only)
let lcCursor = -1;
let lcWalk = { playing: false, timer: 0 };
let lcBodyKey = "";
let sliceBodyKey = "";
let enterBodyKey = "";
let lineageBodyKey = "";
let lineageHopCursor = -1;
let lineageEgoId = "";
let lineageFanFilter = null; // ADE LFO: used|informed|generated
let decisionOutcomeFilter = "";
let decisionAttestFilter = null; // ADE DAM: stamp|skip|broken
let passportDeltaFilter = null; // ADE PTD: planned|residual|extra
let layoutPins = new Map();
let zoomPopReady = false;
let pathWalk = { i: -1, playing: false, timer: 0 };
let sourceId = null;
let graphFilter = { q: "", kinds: { Function: true, Type: true, Endpoint: true }, program: null, bubble: null };
/** ADE OMC — Overview kind/hop mix filter; graph-only (never peekSource). null | {axis:'kind'|'hop', value:string} */
let overviewMixFilter = null;
/** ADE CSC — Overview community-size filter; graph-only (never peekSource). null | bubbleId string */
let overviewCommunityFilter = null;
/** ADE MAC — Map-altitude kind/hop mix filter; graph-only (never peekSource). null | {axis:'kind'|'hop', value:string} */
let mapMixFilter = null;
/** ADE MCS — Map-altitude community-size filter; graph-only (never peekSource). null | bubbleId string */
let mapSizeFilter = null;
/** ADE MHS — Map-altitude community-hop-size filter; graph-only (never peekSource). null | bubbleId string */
let mapHopSizeFilter = null;
/** ADE CFT — Cross-desk focus trail pin; graph-only (never peekSource). null | { bubbleId, label } */
let focusTrail = null;
/** ADE SHM — Slice hop-kind mix filter; graph-only (never peekSource). null | {axis:'kind'|'hop', value:string} */
let sliceMixFilter = null;
/** ADE CPS — Call-path scrubber depth (0 = off). Directed Calls walk from selection. */
let callPathDepth = 0;
/** ADE RKM — Route hop-kind mix filter; graph-only (never peekSource). null | kind string */
let routeMixFilter = null;
const CAM_MIN = 0.35;
const CAM_MAX = 6.5;
const BUBBLE_COLORS = ["#007aff", "#34c759", "#ff9f0a", "#af52de", "#ff375f", "#5ac8fa", "#ffd60a", "#30d158", "#ff453a", "#8e8e93"];
const themeDayBtn = document.getElementById("themeDay");
const themeNightBtn = document.getElementById("themeNight");
const presetBtn = document.getElementById("presetBtn");
const presentBtn = document.getElementById("presentBtn");
const pathBtn = document.getElementById("pathBtn");
const lensBtn = document.getElementById("lensBtn");
const probeDock = document.getElementById("probeDock");
const routeReceipt = document.getElementById("routeReceipt");
const lensReceipt = document.getElementById("lensReceipt");
const PRESETS = ["classic", "signal-flow", "blueprint"];
const PRESET_LABEL = { classic: "Classic", "signal-flow": "Signal", blueprint: "Blueprint" };
const ROUTE_KINDS = { Calls: 1, Reads: 1, Writes: 1, Publishes: 1, Subscribes: 1 };
const LENS_KIND_ROLES = { Function: 1, Type: 1, Endpoint: 1 };
const LENS_END_ROLES = { Source: 1, Sink: 1 };
let routeOpen = false;
let lensOpen = false;
let routeCursor = -1;
let routeWalk = { playing: false, timer: 0 };
let lensRoles = ["Function", "Endpoint"];
let lastRoute = { nodes: [], hops: [], ok: false, reason: "" };

function hostThemeGuess() {
  try {
    const q = new URLSearchParams(location.search).get("theme");
    if (q === "night" || q === "day") return q;
  } catch (_) {}
  try {
    const st = vscode.getState && vscode.getState();
    if (st && (st.theme === "night" || st.theme === "day")) return st.theme;
  } catch (_) {}
  try {
    const saved = localStorage.getItem("graphide-theme");
    if (saved === "night" || saved === "day") return saved;
  } catch (_) {}
  if (document.body && (document.body.classList.contains("vscode-dark") || document.body.classList.contains("vscode-high-contrast"))) {
    return "night";
  }
  if (document.documentElement && document.documentElement.classList.contains("night")) return "night";
  return "day";
}

function applyTheme(mode, persist) {
  const night = mode === "night";
  if (document.documentElement) {
    document.documentElement.classList.add("bright");
    document.documentElement.classList.toggle("night", night);
  }
  if (document.body) {
    document.body.classList.add("bright");
    document.body.classList.toggle("night", night);
  }
  if (themeDayBtn) themeDayBtn.classList.toggle("on", !night);
  if (themeNightBtn) themeNightBtn.classList.toggle("on", night);
  if (!persist) return;
  try {
    const prev = (vscode.getState && vscode.getState()) || {};
    vscode.setState(Object.assign({}, prev, { theme: night ? "night" : "day" }));
  } catch (_) {}
  try {
    localStorage.setItem("graphide-theme", night ? "night" : "day");
  } catch (_) {}
  vscode.postMessage({ type: "setAppearance", appearance: night ? "night" : "day" });
}

function toggleTheme() {
  applyTheme(document.documentElement.classList.contains("night") ? "day" : "night", true);
}

function currentPreset() {
  const raw = (document.documentElement && document.documentElement.getAttribute("data-preset")) || "classic";
  return PRESETS.indexOf(raw) >= 0 ? raw : "classic";
}

function hostPresetGuess() {
  try {
    const q = new URLSearchParams(location.search).get("preset");
    if (q && PRESETS.indexOf(q) >= 0) return q;
  } catch (_) {}
  try {
    const st = vscode.getState && vscode.getState();
    if (st && PRESETS.indexOf(st.preset) >= 0) return st.preset;
  } catch (_) {}
  try {
    const saved = localStorage.getItem("graphide-preset");
    if (saved && PRESETS.indexOf(saved) >= 0) return saved;
  } catch (_) {}
  return "classic";
}

function applyPreset(name, persist) {
  const preset = PRESETS.indexOf(name) >= 0 ? name : "classic";
  if (document.documentElement) document.documentElement.setAttribute("data-preset", preset);
  if (document.body) document.body.setAttribute("data-preset", preset);
  if (presetBtn) {
    presetBtn.setAttribute("data-preset", preset);
    presetBtn.textContent = PRESET_LABEL[preset] || "Classic";
    presetBtn.title = "Style: " + (PRESET_LABEL[preset] || "Classic") + ". Cycles Classic / Signal / Blueprint";
  }
  if (!persist) return;
  try {
    const prev = (vscode.getState && vscode.getState()) || {};
    vscode.setState(Object.assign({}, prev, { preset: preset }));
  } catch (_) {}
  try {
    localStorage.setItem("graphide-preset", preset);
  } catch (_) {}
}

function cyclePreset() {
  const i = PRESETS.indexOf(currentPreset());
  applyPreset(PRESETS[(i + 1) % PRESETS.length], true);
}

function isPresenting() {
  return !!(document.body && document.body.classList.contains("present"));
}

function applyPresent(on) {
  const next = !!on;
  if (document.body) document.body.classList.toggle("present", next);
  if (document.documentElement) document.documentElement.classList.toggle("present", next);
  if (presentBtn) {
    presentBtn.classList.toggle("on", next);
    presentBtn.setAttribute("aria-pressed", next ? "true" : "false");
    presentBtn.textContent = next ? "Exit" : "Present";
    presentBtn.title = next ? "Exit Presentation Stage (Esc)" : "Presentation Stage (F)";
  }
  // S1m — exit: resume ScrollDrive cleanly (camEase base, presentPaused false).
  // S1ad — Present exit alone must not soft-restore / yank cam (resume clears justRestored only).
  if (!next) {
    if (typeof resumeScrollDriveAfterPresent === "function") resumeScrollDriveAfterPresent();
    return;
  }
  // S1ad — stash last-stay BEFORE exclusive chrome closes Evidence / pause wipes base
  // (same shape as Evidence close; sourceId + scrollDriveBase must still be live).
  if (typeof stashScrollDriveLastStay === "function") stashScrollDriveLastStay();
  if (typeof setKeysPane === "function") setKeysPane(false);
  if (typeof setExportMenu === "function") setExportMenu(false);
  if (llmPane && !llmPane.hidden && typeof setLlmPane === "function") setLlmPane(false);
  if (sourcePane && !sourcePane.hidden && typeof closeSourcePane === "function") closeSourcePane();
  if (typeof setLensOpen === "function") setLensOpen(false);
  if (typeof setRouteOpen === "function") setRouteOpen(false);
  if (toastEl) {
    toastEl.classList.remove("on");
    toastEl.hidden = true;
  }
  if (tip) tip.hidden = true;
  // S1m — stage owns the camera; pause ScrollDrive (clears residual macro timer / paint).
  // S1ad — pause publishes presentStayStashed / data-scroll-present-stay honesty cue.
  if (typeof pauseScrollDriveForPresent === "function") pauseScrollDriveForPresent();
}

function togglePresent() {
  applyPresent(!isPresenting());
}

applyTheme(hostThemeGuess(), false);
applyPreset(hostPresetGuess(), false);
if (themeDayBtn) themeDayBtn.onclick = () => applyTheme("day", true);
if (themeNightBtn) themeNightBtn.onclick = () => applyTheme("night", true);
if (presetBtn) presetBtn.onclick = () => cyclePreset();
if (presentBtn) presentBtn.onclick = () => togglePresent();

reviewBtn.onclick = () => startReview();
function requestCancel() {
  setBusy(true);
  cancelling = true;
  pendingProgress = null;
  if (progressLabel) progressLabel.textContent = "Cancelling…";
  vscode.postMessage({ type: "cancel" });
}
cancelBtn.onclick = () => requestCancel();
backBtn.onclick = () => goBack();
prompt.addEventListener("keydown", (e) => {
  // Enter that commits an IME candidate is not a submit.
  if (e.isComposing) return;
  if (e.key === "Enter") {
    e.preventDefault();
    startReview();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && busy) {
    e.preventDefault();
    requestCancel();
    return;
  }
  if (e.key === "Escape" && llmPane && !llmPane.hidden) {
    e.preventDefault();
    setLlmPane(false);
    return;
  }
  if (e.key === "Escape" && keysPane && !keysPane.hidden) {
    e.preventDefault();
    setKeysPane(false);
    return;
  }
  // Find / prompt own typing, but Escape must release focus so desk keys (S/X/…) work again. Query stays.
  // Do not return: if Evidence / Export / Route / Lens / Present is open, the handlers below still run.
  const findEsc = e.key === "Escape" && graphSearch && e.target === graphSearch;
  const promptEsc = e.key === "Escape" && prompt && e.target === prompt;
  if (findEsc || promptEsc) {
    e.preventDefault();
    if (findEsc) graphSearch.blur();
    if (promptEsc) prompt.blur();
  } else if (e.target && e.target.closest && e.target.closest("input:not([type=checkbox]), textarea, [contenteditable]")) {
    return;
  }
  if (e.key === "Escape" && sourcePane && !sourcePane.hidden) {
    e.preventDefault();
    closeSourcePane();
    return;
  }
  if (e.key === "Escape" && exportMenu && !exportMenu.hidden) {
    e.preventDefault();
    setExportMenu(false);
    return;
  }
  if (e.key === "Escape" && routeOpen) {
    e.preventDefault();
    // ADE RKM: Escape clears kind filter first; second Escape closes Route.
    if (routeMixFilter) {
      routeMixFilter = null;
      fillRouteReceipt();
      applyProbePaint();
      return;
    }
    setRouteOpen(false);
    return;
  }
  if (e.key === "Escape" && lensOpen) {
    e.preventDefault();
    setLensOpen(false);
    return;
  }
  if (e.key === "Escape" && isPresenting()) {
    e.preventDefault();
    applyPresent(false);
    return;
  }
  // ADE LFO: Escape clears Lineage fan-size mix filter when active.
  if (
    e.key === "Escape" &&
    !e.defaultPrevented &&
    explorerWs === "lineage" &&
    lineageFanFilter
  ) {
    e.preventDefault();
    lineageFanFilter = null;
    applyLineageFanPaint();
    syncLineageFanBars();
    return;
  }
  // ADE DAM: Escape clears Decisions attestation mix filter when active.
  if (
    e.key === "Escape" &&
    !e.defaultPrevented &&
    explorerWs === "decisions" &&
    decisionAttestFilter
  ) {
    e.preventDefault();
    decisionAttestFilter = null;
    applyDecisionListFilters();
    syncDecisionAttestBars();
    return;
  }
  // ADE CSC: Escape clears Overview community-size filter when active.
  if (
    e.key === "Escape" &&
    !e.defaultPrevented &&
    explorerWs === "overview" &&
    overviewCommunityFilter
  ) {
    e.preventDefault();
    overviewCommunityFilter = null;
    applyOverviewCommunityPaint();
    return;
  }
  // ADE CPS: Escape clears call-path scrubber depth when active.
  if (
    e.key === "Escape" &&
    !e.defaultPrevented &&
    (explorerWs === "overview" || explorerWs === "slice") &&
    callPathDepth > 0
  ) {
    e.preventDefault();
    callPathDepth = 0;
    applyCallPathPaint();
    syncCallPathStrip();
    return;
  }
  // ADE SHM: Escape clears Slice hop-kind mix filter when active.
  if (
    e.key === "Escape" &&
    !e.defaultPrevented &&
    explorerWs === "slice" &&
    sliceMixFilter
  ) {
    e.preventDefault();
    sliceMixFilter = null;
    applySliceMixPaint();
    return;
  }
  // ADE CFT: Escape clears cross-desk focus trail when active (Map/Slice/Sequence).
  if (
    e.key === "Escape" &&
    !e.defaultPrevented &&
    (explorerWs === "map" || explorerWs === "slice" || explorerWs === "sequence") &&
    focusTrail
  ) {
    e.preventDefault();
    focusTrail = null;
    applyFocusTrailPaint();
    syncFocusTrailChip();
    return;
  }
  // ADE MHS: Escape clears Map-altitude hop-size filter when active.
  if (
    e.key === "Escape" &&
    !e.defaultPrevented &&
    explorerWs === "map" &&
    mapHopSizeFilter
  ) {
    e.preventDefault();
    mapHopSizeFilter = null;
    applyMapHopSizePaint();
    return;
  }
  // ADE MCS: Escape clears Map-altitude community-size filter when active.
  if (
    e.key === "Escape" &&
    !e.defaultPrevented &&
    explorerWs === "map" &&
    mapSizeFilter
  ) {
    e.preventDefault();
    mapSizeFilter = null;
    applyMapSizePaint();
    return;
  }
  // ADE MAC: Escape clears Map-altitude mix filter when active.
  if (
    e.key === "Escape" &&
    !e.defaultPrevented &&
    explorerWs === "map" &&
    mapMixFilter
  ) {
    e.preventDefault();
    mapMixFilter = null;
    applyMapMixPaint();
    return;
  }
  // ADE OMC: Escape clears Overview mix filter when active (before residual Trace|Passport owner).
  if (
    e.key === "Escape" &&
    !e.defaultPrevented &&
    explorerWs === "overview" &&
    overviewMixFilter
  ) {
    e.preventDefault();
    overviewMixFilter = null;
    applyOverviewMixPaint();
    return;
  }
  // ADE RDF: Escape clears Data-flow lane filter when active.
  if (
    e.key === "Escape" &&
    !e.defaultPrevented &&
    explorerWs === "dataflow" &&
    dfRoleFilter
  ) {
    e.preventDefault();
    dfRoleFilter = null;
    paint({ animate: "none" });
    return;
  }
  // ADE PTD: Escape clears Passport↔Trajectory delta mix filter when active.
  if (
    e.key === "Escape" &&
    !e.defaultPrevented &&
    (explorerWs === "trace" || explorerWs === "passport") &&
    passportDeltaFilter
  ) {
    e.preventDefault();
    passportDeltaFilter = null;
    applyPassportDeltaPaint();
    syncPassportDeltaBars();
    return;
  }
  // ADE ESC: after chrome owners (Keys/Export/llm/source/route/lens/present), Escape clears residual filter on Trace/Passport.
  if (
    e.key === "Escape" &&
    !e.defaultPrevented &&
    (explorerWs === "trace" || explorerWs === "passport") &&
    trajResidualFilter
  ) {
    e.preventDefault();
    clearTrajResidualFilter();
    return;
  }
  // Cmd / Ctrl chords are VS Code's (save, cut, find, quick open): a reflex Cmd+S must not stamp. Ctrl+Alt is AltGr, so / [ ] still type.
  if (e.metaKey || (e.ctrlKey && !e.altKey)) return;
  // A focused <select> (Ego hops, Ask host) owns its typeahead: "2" picks 2-hop, not workspace 2. Escape above still backs out.
  if (e.target && e.target.closest && e.target.closest("select")) return;
  // Holding a key auto-repeats keydown: toggles and actions (S X D F E R L P Backspace…) fire once; zoom / step / arrows repeat.
  if (e.repeat && !/^(\+|=|-|_|\[|\]|j|J|k|K|Arrow(Up|Down|Left|Right))$/.test(e.key)) return;
  // Modal chrome owns the desk: S/X/R must not stamp / skip / PATH under Export, Keys, or Ask. Backspace still closes chrome below.
  // On Presentation Stage, Style / theme / zoom stay — let them through so Export/Keys do not steal stage chrome.
  // ? / F1 always toggle Keys (documented), even when Keys (or other chrome) is already open.
  if (
    e.key !== "Backspace" &&
    e.key !== "?" &&
    e.key !== "F1" &&
    !(
      isPresenting() &&
      (e.key === "s" ||
        e.key === "S" ||
        e.key === "d" ||
        e.key === "D" ||
        e.key === "+" ||
        e.key === "=" ||
        e.key === "-" ||
        e.key === "_" ||
        e.key === "0")
    ) &&
    ((exportMenu && !exportMenu.hidden) || (keysPane && !keysPane.hidden) || (llmPane && !llmPane.hidden))
  ) {
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
  // ADE Trace zoom chrome (ZC): +/=/−/0 drive trajScale before Map zoomBy/fitChart.
  if (explorerWs === "trace") {
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      trajZoomBy(TRAJ_SCALE_STEP);
      return;
    }
    if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      trajZoomBy(1 / TRAJ_SCALE_STEP);
      return;
    }
    if (e.key === "0") {
      e.preventDefault();
      trajZoomFit();
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
    fitChart();
    return;
  }
  // Backspace is navigate-back, but open chrome wins first (same stack as Escape).
  // While Review is busy, Backspace cancels (Escape already does).
  if (e.key === "Backspace") {
    e.preventDefault();
    if (busy) {
      requestCancel();
      return;
    }
    if (llmPane && !llmPane.hidden) {
      setLlmPane(false);
      return;
    }
    if (keysPane && !keysPane.hidden) {
      setKeysPane(false);
      return;
    }
    if (sourcePane && !sourcePane.hidden) {
      closeSourcePane();
      return;
    }
    if (exportMenu && !exportMenu.hidden) {
      setExportMenu(false);
      return;
    }
    if (routeOpen) {
      setRouteOpen(false);
      return;
    }
    if (lensOpen) {
      setLensOpen(false);
      return;
    }
    if (isPresenting()) {
      applyPresent(false);
      return;
    }
    goBack();
    return;
  }
  if (e.key === "s" || e.key === "S") {
    e.preventDefault();
    if (isPresenting()) cyclePreset();
    else requestStamp();
    return;
  }
  if (e.key === "f" || e.key === "F") {
    e.preventDefault();
    togglePresent();
    return;
  }
  if (e.key === "x" || e.key === "X") {
    e.preventDefault();
    // Present hides Skip — exit the stage first (same rule as Stamp; S remaps to Style).
    if (!isPresenting()) requestSkip();
    return;
  }
  if (e.key === "e" || e.key === "E") {
    e.preventDefault();
    setEgoMode(!egoMode);
    return;
  }
  // ADE Trace/Passport residual-filter key (RK/PM): R remaps on Trace+Passport (Map keeps PATH).
  if (
    (explorerWs === "trace" || explorerWs === "passport") &&
    (e.key === "r" || e.key === "R")
  ) {
    e.preventDefault();
    toggleTrajResidualFilter();
    return;
  }
  if (e.key === "r" || e.key === "R") {
    e.preventDefault();
    toggleRoute();
    return;
  }
  if (e.key === "l" || e.key === "L") {
    e.preventDefault();
    toggleLens();
    return;
  }
  if (e.key === "d" || e.key === "D") {
    e.preventDefault();
    toggleTheme();
    return;
  }
  if (e.key === "/" && graphSearch) {
    e.preventDefault();
    // Present hides #graphBar / Find — exit the stage first.
    if (isPresenting()) return;
    if (typeof hideTip === "function") hideTip();
    if (toastEl) {
      toastEl.classList.remove("on");
      toastEl.hidden = true;
    }
    graphSearch.focus();
    graphSearch.select();
    return;
  }
  if (e.key === "?" || e.key === "F1") {
    e.preventDefault();
    setKeysPane(!(keysPane && !keysPane.hidden));
    return;
  }
  if (e.key === "p" || e.key === "P") {
    e.preventDefault();
    if (explorerWs === "delta") toggleDeltaReview();
    else if (explorerWs === "sequence") toggleSeqReview();
    else if (explorerWs === "dataflow") toggleDfReview();
    else if (explorerWs === "lifecycle") toggleLcReview();
    else togglePathWalk();
    return;
  }
  // ADE Trace keyboard node-step (KS): arrows + j/k alias existing [ ] → stepTrajectory.
  // Programs-stack arrows return earlier; Map/path walks stay on their explorerWs branches.
  if (explorerWs === "trace") {
    if (e.key === "ArrowRight" || e.key === "j" || e.key === "J") {
      e.preventDefault();
      stepTrajectory(1);
      return;
    }
    if (e.key === "ArrowLeft" || e.key === "k" || e.key === "K") {
      e.preventDefault();
      stepTrajectory(-1);
      return;
    }
  }
  if (e.key === "[") {
    e.preventDefault();
    if (explorerWs === "delta") {
      stopDeltaWalk();
      stepDeltaWalk(deltaCursor < 0 ? 1 : -1);
    } else if (explorerWs === "sequence") {
      stopSeqWalk();
      stepSeqWalk(seqCursor < 0 ? 1 : -1);
    } else if (explorerWs === "dataflow") {
      stopDfWalk();
      stepDfWalk(dfCursor < 0 ? 1 : -1);
    } else if (explorerWs === "lifecycle") {
      stopLcWalk();
      stepLcWalk(lcCursor < 0 ? 1 : -1);
    } else if (explorerWs === "trace") {
      stepTrajectory(-1);
    } else {
      stopPathWalk();
      stepPathWalk(pathWalk.i < 0 ? 1 : -1);
    }
    return;
  }
  if (e.key === "]") {
    e.preventDefault();
    if (explorerWs === "delta") {
      stopDeltaWalk();
      stepDeltaWalk(1);
    } else if (explorerWs === "sequence") {
      stopSeqWalk();
      stepSeqWalk(1);
    } else if (explorerWs === "dataflow") {
      stopDfWalk();
      stepDfWalk(1);
    } else if (explorerWs === "lifecycle") {
      stopLcWalk();
      stepLcWalk(1);
    } else if (explorerWs === "trace") {
      stepTrajectory(1);
    } else {
      stopPathWalk();
      stepPathWalk(1);
    }
    return;
  }
  const wsIdx = "123456789".indexOf(e.key);
  if (wsIdx >= 0 && WORKSPACES[wsIdx]) {
    e.preventDefault();
    setWorkspace(WORKSPACES[wsIdx], true);
  }
});
if (zoomInBtn) zoomInBtn.onclick = () => zoomBy(1.2);
if (zoomOutBtn) zoomOutBtn.onclick = () => zoomBy(1 / 1.2);
if (zoomFitBtn) zoomFitBtn.onclick = () => fitChart();
if (srcClose) srcClose.onclick = () => closeSourcePane();
if (srcEditor)
  srcEditor.onclick = () => {
    if (!sourceId) return;
    const flow = currentFlow();
    vscode.postMessage({ type: "enterNode", flow: flow ? flow.name : "", id: sourceId, isLeaf: true });
  };

/** ScrollDrive — Evidence #srcBody scroll → camera lerp toward related node (S1a). */
let scrollDriveBase = null;
/** Last camera-lock target — soft-stay remap mid-scroll (S1t) / file hop (S1v); first lock still zoomToEl (S1h). */
let scrollDriveTargetLocked = "";
/** S1r — idle-settle absorbed soft camX into scrollDriveBase (harness flag). */
let scrollDriveCamXSettled = false;
/** S1s — idle-settle absorbed soft camY into scrollDriveBase (harness flag). */
let scrollDriveCamYSettled = false;
/** S1s — scrollRatio origin for Y nudge after absorb (0 until first settle). */
let scrollDriveYNudgeOrigin = 0;
/** S1u — prior-flush macroLod edge (enter/exit soft remap). */
let scrollDriveWasMacro = false;
/** S1w — in-memory last soft-stay snapshot for Present→Evidence reopen / pane close / Slice remount.
 *  S1aa also mirrors a tiny blob to sessionStorage so soft restore survives webview reload.
 *  S1ab scopes that blob by workspace folder key so a foreign folder cannot soft-restore. */
let scrollDriveLastStay = null;
/** S1w — soft-restore window after Present exit / Evidence close (ms) for in-memory snap. */
const SCROLL_DRIVE_LAST_STAY_MS = 60000;
/** S1aa/S1ab — sessionStorage key prefix for last-stay blob (no file contents / secrets).
 *  Scoped key = prefix + (ws ? "::" + encodeURIComponent(ws) : "") so folders do not share. */
const SCROLL_DRIVE_LAST_STAY_KEY = "graphide.scrollDrive.lastStay.v1";
/** S1aa — stored-blob freshness (ms). sessionStorage is already session-scoped; 24h caps stale tabs. */
const SCROLL_DRIVE_LAST_STAY_STORAGE_MS = 24 * 60 * 60 * 1000;
/** S1ab — workspace folder id / root hint for last-stay scope (from host workspaceFolder; harness may set).
 *  Empty when host has not published a folder yet — document gap; restore still works unscoped. */
let scrollDriveWorkspaceKey = "";
/** S1ab — last sourceId showSource actually rendered (not peekSource pre-assign).
 *  Distinguishes host re-post of the same Evidence from an S1v file hop. */
let scrollDriveLastShownSourceId = "";
/** S1w — next applyScrollDriveCamera soft-stays keeping restored base (no camTo reseed). */
let scrollDriveJustRestored = false;
/** S1ae — one-shot: soft stay just applied; next refitChartSoon rAF must not wipe it. */
let scrollDriveSuppressNextRefit = false;
/** S1af — short-lived honesty: Review restart / desk empty just cleared stay (not a restore). */
let scrollDriveReviewStayCleared = false;

function emptyScrollDrive() {
  return {
    scrollRatio: 0,
    activeLine: 0,
    targetNodeId: "",
    lineMapHit: false,
    lineMapPulse: false,
    activeLineMarked: false,
    camX: 0,
    camY: 0,
    camK: 1,
    cfgActiveId: "",
    cfgUnroll: 0,
    cfgVisible: 0,
    cfgSpanKind: "",
    cfgSpanCount: 0,
    cfgNestDepth: 0,
    cfgNestMax: 0,
    cfgNestExpanded: 0,
    scrollVel: 0,
    camEase: CAM_EASE_BASE,
    blendMs: 180,
    macroLod: false,
    anchorFocus: "",
    anchorCounts: { api: 0, db: 0, svc: 0, util: 0 },
    detailNear: false,
    reducedMotion: false,
    rafCoalesce: true,
    rafFlushes: 0,
    rafMerged: 0,
    presentPaused: false,
    presentStayStashed: false,
    reviewStayCleared: false,
    camXSettled: false,
    camYSettled: false,
  };
}

function publishScrollDrive(drive) {
  window.__graphideScrollDrive = drive || emptyScrollDrive();
}

function resetScrollDrive() {
  scrollDriveBase = null;
  scrollDriveTargetLocked = "";
  scrollDriveCamXSettled = false;
  scrollDriveCamYSettled = false;
  scrollDriveYNudgeOrigin = 0;
  scrollDriveWasMacro = false;
  scrollDriveJustRestored = false;
  scrollDriveSuppressNextRefit = false;
  // Keep scrollDriveLastStay — S1w Present/close reopen needs it across reset.
  scrollDriveVel = { t: 0, top: 0, vel: 0 };
  if (typeof scrollDriveMacroTimer !== "undefined" && scrollDriveMacroTimer) {
    clearTimeout(scrollDriveMacroTimer);
    scrollDriveMacroTimer = 0;
  }
  if (scrollDriveRaf) {
    cancelAnimationFrame(scrollDriveRaf);
    scrollDriveRaf = 0;
  }
  scrollDriveRafPending = 0;
  scrollDriveRafFlushes = 0;
  scrollDriveRafMerged = 0;
  if (scrollDriveEaseTimer) {
    clearTimeout(scrollDriveEaseTimer);
    scrollDriveEaseTimer = 0;
  }
  setCamEase(CAM_EASE_BASE);
  clearScrollDriveCfgPaint();
  clearScrollDriveLineMapPaint();
  clearScrollDriveActiveLinePaint();
  clearScrollDriveMacroPaint();
  clearScrollDriveAnchorPaint();
  clearScrollDriveDetailPaint();
  clearScrollDriveBlendPaint();
  const d = emptyScrollDrive();
  // S1m — closing Evidence under Present must keep presentPaused published.
  // S1ad — presentStayStashed honesty: warm last-stay still available for Evidence reopen.
  if (typeof isPresenting === "function" && isPresenting()) {
    d.presentPaused = true;
    d.presentStayStashed = !!(scrollDriveLastStay && scrollDriveLastStay.sourceId);
  }
  // S1af — keep Review-clear cue published until soft-stash / cold open clears it.
  d.reviewStayCleared = !!scrollDriveReviewStayCleared;
  publishScrollDrive(d);
}


/** S1v — Evidence file / sourceId hop while Slice soft-stay is live:
 *  seed scrollDriveBase from camTo (S1t/S1u style), clear CFG/lineMap/active-line
 *  paint for the old file, refresh settle flags, and let the next flush soft-follow
 *  the new vnode. First-ever open (no prior base) / Present: hard-reset path.
 *  Returns true when soft-stay applied. */
function softStayScrollDriveAcrossSourceHop() {
  if (typeof isPresenting === "function" && isPresenting()) return false;
  if (!scrollDriveBase) return false;
  scrollDriveBase = {
    x: Number.isFinite(camTo.x) ? camTo.x : scrollDriveBase.x,
    y: Number.isFinite(camTo.y) ? camTo.y : scrollDriveBase.y,
    k: Number.isFinite(camTo.k) && camTo.k > 0 ? camTo.k : scrollDriveBase.k || 1,
  };
  // Clear lock so applyScrollDriveCamera treats the new sourceId as a soft remap.
  scrollDriveTargetLocked = "";
  scrollDriveCamXSettled = false;
  scrollDriveCamYSettled = false;
  scrollDriveYNudgeOrigin = 0;
  scrollDriveWasMacro = false;
  scrollDriveJustRestored = false;
  scrollDriveSuppressNextRefit = false;
  // S1w/S1aa — live file hop replaces any Present/close snapshot (memory + storage).
  if (typeof clearScrollDriveLastStay === "function") clearScrollDriveLastStay();
  else scrollDriveLastStay = null;
  // Drop old-file paint; next flush rebuilds for the new #srcBody (S1l coalesce ok).
  clearScrollDriveCfgPaint();
  clearScrollDriveLineMapPaint();
  clearScrollDriveActiveLinePaint();
  clearScrollDriveMacroPaint();
  return true;
}

/** S1aa — pick sessionStorage (preferred) or localStorage fallback for last-stay blob. */
function scrollDriveLastStayStorage() {
  try {
    if (typeof sessionStorage !== "undefined" && sessionStorage) return sessionStorage;
  } catch (_) {}
  try {
    if (typeof localStorage !== "undefined" && localStorage) return localStorage;
  } catch (_) {}
  return null;
}

/** S1ab — storage key scoped by workspace folder (empty ws → unscoped S1aa key for harness/gap). */
function scrollDriveLastStayStorageKey(ws) {
  const scope = ws != null ? String(ws) : scrollDriveWorkspaceKey ? String(scrollDriveWorkspaceKey) : "";
  if (!scope) return SCROLL_DRIVE_LAST_STAY_KEY;
  return SCROLL_DRIVE_LAST_STAY_KEY + "::" + encodeURIComponent(scope);
}

/** S1ab — normalize workspace folder hint from host (uri / fsPath / name). No secrets. */
function normalizeScrollDriveWorkspaceKey(raw) {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s || s === "undefined" || s === "null") return "";
  // Cap length so storage keys stay small (folder URIs can be long).
  return s.length > 240 ? s.slice(0, 240) : s;
}

/** S1ab — set workspace scope. Clears in-memory stay on folder change so a foreign
 *  soft-restore cannot apply; leaves the prior folder's scoped sessionStorage blob
 *  intact (returning to that folder can still restore). Current folder cannot read it.
 *  S1ag — also clear S1af Review-clear honesty cue/attr so clear-happened cannot
 *  linger across folders (same-key no-op leaves cue alone). */
function setScrollDriveWorkspaceKey(next) {
  const key = normalizeScrollDriveWorkspaceKey(next);
  if (key === scrollDriveWorkspaceKey) {
    if (typeof window !== "undefined") {
      window.__graphideScrollDriveWorkspaceKey = scrollDriveWorkspaceKey;
      window.__graphideScrollDriveLastStayKey = scrollDriveLastStayStorageKey();
    }
    return false;
  }
  scrollDriveLastStay = null;
  scrollDriveJustRestored = false;
  scrollDriveSuppressNextRefit = false;
  // S1ag — folder hop ends Review-clear cue (honesty must not stick across folders).
  if (typeof clearScrollDriveReviewStayClearedCue === "function") {
    clearScrollDriveReviewStayClearedCue();
  } else {
    scrollDriveReviewStayCleared = false;
    const vp = viewportEl || (canvas && canvas.querySelector(".viewport"));
    if (vp && vp.hasAttribute("data-scroll-review-clear")) vp.removeAttribute("data-scroll-review-clear");
    const cur =
      typeof window !== "undefined" && window.__graphideScrollDrive
        ? window.__graphideScrollDrive
        : null;
    if (cur) cur.reviewStayCleared = false;
  }
  scrollDriveWorkspaceKey = key;
  if (typeof window !== "undefined") {
    window.__graphideScrollDriveWorkspaceKey = scrollDriveWorkspaceKey;
    window.__graphideScrollDriveLastStayKey = scrollDriveLastStayStorageKey();
  }
  return true;
}

/** S1aa/S1ab — validate tiny last-stay shape (no file contents / secrets). */
function normalizeScrollDriveLastStaySnap(raw) {
  if (!raw || typeof raw !== "object") return null;
  const sid = raw.sourceId != null ? String(raw.sourceId) : "";
  if (!sid) return null;
  const x = Number(raw.x);
  const y = Number(raw.y);
  const k = Number(raw.k);
  const t = Number(raw.t);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(k) || k <= 0) return null;
  if (!Number.isFinite(t) || t <= 0) return null;
  const out = {
    sourceId: sid,
    x,
    y,
    k,
    t,
  };
  const ws = normalizeScrollDriveWorkspaceKey(raw.ws != null ? raw.ws : raw.workspaceKey);
  if (ws) out.ws = ws;
  if (raw.targetNodeId != null && String(raw.targetNodeId)) {
    out.targetNodeId = String(raw.targetNodeId);
  }
  if (raw.scrollRatio != null && Number.isFinite(Number(raw.scrollRatio))) {
    out.scrollRatio = Number(raw.scrollRatio);
  }
  return out;
}

/** S1aa/S1ab — write last-stay blob to sessionStorage (or localStorage fallback), workspace-scoped. */
function persistScrollDriveLastStay(snap) {
  const clean = normalizeScrollDriveLastStaySnap(snap);
  if (!clean) return false;
  const ws = scrollDriveWorkspaceKey ? String(scrollDriveWorkspaceKey) : "";
  if (ws) clean.ws = ws;
  else delete clean.ws;
  const store = scrollDriveLastStayStorage();
  if (!store) return false;
  try {
    store.setItem(scrollDriveLastStayStorageKey(ws), JSON.stringify(clean));
    return true;
  } catch (_) {
    return false;
  }
}

/** S1aa/S1ab — drop stored last-stay blob for the current workspace scope (corrupt / harness cold-frame). */
function clearPersistedScrollDriveLastStay() {
  const store = scrollDriveLastStayStorage();
  if (!store) return;
  try {
    store.removeItem(scrollDriveLastStayStorageKey());
  } catch (_) {}
  // Also drop legacy unscoped S1aa key when scoped, so a foreign reopen cannot revive it.
  if (scrollDriveWorkspaceKey) {
    try {
      store.removeItem(SCROLL_DRIVE_LAST_STAY_KEY);
    } catch (_) {}
  }
}

/** S1aa/S1ab — load + validate stored last-stay; clear on stale / corrupt / workspace mismatch. */
function loadScrollDriveLastStayFromStorage(nextSourceId) {
  const store = scrollDriveLastStayStorage();
  if (!store) return null;
  const key = scrollDriveLastStayStorageKey();
  let raw = null;
  try {
    raw = store.getItem(key);
  } catch (_) {
    return null;
  }
  // Migrate: unscoped S1aa blob only when current workspace key is empty.
  if (!raw && !scrollDriveWorkspaceKey) {
    try {
      raw = store.getItem(SCROLL_DRIVE_LAST_STAY_KEY);
    } catch (_) {
      raw = null;
    }
  }
  if (!raw) return null;
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch (_) {
    clearPersistedScrollDriveLastStay();
    return null;
  }
  const snap = normalizeScrollDriveLastStaySnap(parsed);
  if (!snap) {
    clearPersistedScrollDriveLastStay();
    return null;
  }
  const age = Date.now() - snap.t;
  if (!Number.isFinite(age) || age < 0 || age > SCROLL_DRIVE_LAST_STAY_STORAGE_MS) {
    clearPersistedScrollDriveLastStay();
    return null;
  }
  // S1ab — blob ws must match current workspace key (both empty OK for unscoped gap path).
  const snapWs = snap.ws ? String(snap.ws) : "";
  const curWs = scrollDriveWorkspaceKey ? String(scrollDriveWorkspaceKey) : "";
  if (snapWs !== curWs) {
    // Foreign workspace blob under this key — ignore + clear so it cannot leak.
    clearPersistedScrollDriveLastStay();
    return null;
  }
  if (nextSourceId != null && String(nextSourceId) && String(snap.sourceId) !== String(nextSourceId)) {
    // Mismatched source — leave blob for a later matching reopen; caller decides clear.
    return null;
  }
  return snap;
}

/** S1w/S1aa/S1ab — resolve fresh last-stay: memory (60s) first, else sessionStorage (24h / same session).
 *  Memory must also match current workspace key (S1ab). */
function resolveScrollDriveLastStay(nextSourceId, opts) {
  const allowStorage = !opts || opts.allowStorage !== false;
  const sid = nextSourceId != null ? String(nextSourceId) : "";
  const curWs = scrollDriveWorkspaceKey ? String(scrollDriveWorkspaceKey) : "";
  const mem = scrollDriveLastStay;
  if (mem && mem.sourceId) {
    const memWs = mem.ws ? String(mem.ws) : "";
    if (memWs !== curWs) {
      // Foreign workspace memory — drop; try scoped storage.
      scrollDriveLastStay = null;
    } else if (sid && String(mem.sourceId) !== sid) {
      // Different source — drop memory; try storage for the requested id.
      scrollDriveLastStay = null;
    } else {
      const age = Date.now() - (Number(mem.t) || 0);
      if (Number.isFinite(age) && age >= 0 && age <= SCROLL_DRIVE_LAST_STAY_MS) {
        return { snap: mem, fromStorage: false };
      }
      // Memory stale — fall through to storage (S1aa reload path).
      scrollDriveLastStay = null;
    }
  }
  if (!allowStorage) return null;
  const stored = loadScrollDriveLastStayFromStorage(sid || null);
  if (!stored) return null;
  // Hydrate memory so subsequent remount / hop helpers see the same snap.
  scrollDriveLastStay = stored;
  return { snap: stored, fromStorage: true };
}

/** S1w/S1aa/S1ab — stash lightweight last-stay before Present pause / Evidence close / hop.
 *  Memory + sessionStorage mirror (tiny cam blob only — no file contents / secrets).
 *  Includes workspace key so a different folder cannot soft-restore the same sourceId. */
function stashScrollDriveLastStay() {
  if (!scrollDriveBase) return false;
  const sid = sourceId ? String(sourceId) : "";
  if (!sid) return false;
  const d = (typeof window !== "undefined" && window.__graphideScrollDrive) || {};
  const x = Number.isFinite(camTo.x) ? camTo.x : scrollDriveBase.x;
  const y = Number.isFinite(camTo.y) ? camTo.y : scrollDriveBase.y;
  const k =
    Number.isFinite(camTo.k) && camTo.k > 0
      ? camTo.k
      : Number.isFinite(scrollDriveBase.k) && scrollDriveBase.k > 0
        ? scrollDriveBase.k
        : 1;
  const ws = scrollDriveWorkspaceKey ? String(scrollDriveWorkspaceKey) : "";
  scrollDriveLastStay = {
    sourceId: sid,
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
    k: Number.isFinite(k) && k > 0 ? k : 1,
    scrollRatio: Number(d.scrollRatio) || 0,
    targetNodeId: d.targetNodeId ? String(d.targetNodeId) : sid,
    t: Date.now(),
  };
  if (ws) scrollDriveLastStay.ws = ws;
  persistScrollDriveLastStay(scrollDriveLastStay);
  // S1af/S1ai — building a new stay ends the Review-clear honesty cue
  // (Present pause also clears even when stash no-ops).
  if (typeof clearScrollDriveReviewStayClearedCue === "function") clearScrollDriveReviewStayClearedCue();
  return true;
}

/** S1w/S1aa/S1ab — drop stale Present/close snapshot (different sourceId / TTL / harness cold-frame / workspace change). */
function clearScrollDriveLastStay() {
  scrollDriveLastStay = null;
  scrollDriveJustRestored = false;
  scrollDriveSuppressNextRefit = false;
  clearPersistedScrollDriveLastStay();
}


/** S1af — publish / clear Review-restart stay-clear honesty cue (parity with S1ad
 *  presentStayStashed). Cue means clear ran — never implies soft-restore.
 *  Clear path mutates in place (no full republish) so mid-drive stash cannot
 *  snapshot-stomp a live ScrollDrive publish.
 *  S1an — Review clear wins over Present-stash: when turning cue on, drop
 *  presentStayStashed / data-scroll-present-stay (stay was wiped — S1ac). Mid-Present
 *  both cues must not stay true; Present pause flag itself is unchanged. */
function setScrollDriveReviewStayClearedCue(on) {
  scrollDriveReviewStayCleared = !!on;
  const vp = viewportEl || (canvas && canvas.querySelector(".viewport"));
  if (vp) {
    if (on) {
      vp.setAttribute("data-scroll-review-clear", "1");
      // S1an — mutually exclusive with Present-stash honesty cue.
      vp.removeAttribute("data-scroll-present-stay");
    } else {
      vp.removeAttribute("data-scroll-review-clear");
    }
  }
  const cur =
    typeof window !== "undefined" && window.__graphideScrollDrive
      ? window.__graphideScrollDrive
      : null;
  if (cur) {
    cur.reviewStayCleared = !!on;
    if (on) cur.presentStayStashed = false;
  } else if (on) {
    // No live publish yet — seed a tiny honesty publish for harness.
    const d = emptyScrollDrive();
    d.reviewStayCleared = true;
    d.presentStayStashed = false;
    publishScrollDrive(d);
  }
}

function clearScrollDriveReviewStayClearedCue() {
  if (!scrollDriveReviewStayCleared) {
    const vp = viewportEl || (canvas && canvas.querySelector(".viewport"));
    if (vp && vp.hasAttribute("data-scroll-review-clear")) vp.removeAttribute("data-scroll-review-clear");
    return;
  }
  setScrollDriveReviewStayClearedCue(false);
}

/** S1ac — Review restart / desk clear: wipe in-memory last-stay + current workspace
 *  scoped sessionStorage blob, and drop live base so closeSourcePane cannot re-stash
 *  the prior review cam. Soft-restore then finds nothing until the user builds a new
 *  stay. Leaves other folders' scoped keys alone (multi-folder polish).
 *  S1ao — same wipe mid-Present (S1an) must leave memory/sessionStorage empty so
 *  Evidence reopen takes the cold hard path (no soft-restore). */
function clearScrollDriveLastStayOnReviewRestart() {
  scrollDriveLastStay = null;
  scrollDriveJustRestored = false;
  scrollDriveSuppressNextRefit = false;
  // Kill live base so a subsequent closeSourcePane stash cannot revive prior cam.
  scrollDriveBase = null;
  scrollDriveTargetLocked = "";
  scrollDriveCamXSettled = false;
  scrollDriveCamYSettled = false;
  scrollDriveYNudgeOrigin = 0;
  scrollDriveWasMacro = false;
  scrollDriveLastShownSourceId = "";
  clearPersistedScrollDriveLastStay();
  // S1af — short-lived honesty cue (cleared on next soft-stash / cold open).
  if (typeof setScrollDriveReviewStayClearedCue === "function") {
    setScrollDriveReviewStayClearedCue(true);
  } else {
    scrollDriveReviewStayCleared = true;
  }
  return true;
}

/** S1ab — same-source host re-post of `source` after reload / peek reply:
 *  soft-restore from storage when base was wiped; else soft-stay without clearing last-stay
 *  (unlike S1v file-hop which drops the blob). Returns true when soft stay / restore applied. */
function softStayScrollDriveAcrossHostSourceRepost(nextSourceId) {
  if (typeof isPresenting === "function" && isPresenting()) return false;
  const sid = nextSourceId ? String(nextSourceId) : sourceId ? String(sourceId) : "";
  if (!sid) return false;
  if (scrollDriveBase) {
    scrollDriveBase = {
      x: Number.isFinite(camTo.x) ? camTo.x : scrollDriveBase.x,
      y: Number.isFinite(camTo.y) ? camTo.y : scrollDriveBase.y,
      k: Number.isFinite(camTo.k) && camTo.k > 0 ? camTo.k : scrollDriveBase.k || 1,
    };
    scrollDriveTargetLocked = "";
    scrollDriveCamXSettled = false;
    scrollDriveCamYSettled = false;
    scrollDriveWasMacro = false;
    scrollDriveJustRestored = true;
    // Keep last-stay warm — host re-post is not a file hop.
    clearScrollDriveCfgPaint();
    clearScrollDriveLineMapPaint();
    clearScrollDriveActiveLinePaint();
    clearScrollDriveMacroPaint();
    return true;
  }
  // Base empty (post-reload host message) — soft-restore from S1aa/S1ab storage.
  if (typeof softRestoreScrollDriveFromLastStay === "function") {
    return softRestoreScrollDriveFromLastStay(sid);
  }
  return false;
}

// Harness hook — S1q cold-frames after S1p Present without consuming S1w restore.
// S1aa: also clears sessionStorage so cold zoomToEl stays honest.
// S1ab: workspace key + scoped storage key published for harness.
if (typeof window !== "undefined") {
  window.__graphideClearScrollDriveLastStay = clearScrollDriveLastStay;
  window.__graphideClearScrollDriveLastStayOnReviewRestart = clearScrollDriveLastStayOnReviewRestart;
  // S1aq harness — stash a fresh stay after cold open so Present→Evidence round-trip is explicit.
  window.__graphideStashScrollDriveLastStay = stashScrollDriveLastStay;
  // S1ai harness — plant/clear Review-clear cue without wiping last-stay (mutual-exclusion probes).
  window.__graphideSetScrollDriveReviewStayClearedCue = setScrollDriveReviewStayClearedCue;
  window.__graphideScrollDriveLastStayKey = scrollDriveLastStayStorageKey();
  window.__graphideScrollDriveWorkspaceKey = scrollDriveWorkspaceKey;
  window.__graphideSetScrollDriveWorkspaceKey = setScrollDriveWorkspaceKey;
  // Harness — S1aa/S1ab probe: load/validate storage blob (null + clear on corrupt/stale / ws mismatch).
  window.__graphideProbeScrollDriveLastStayStorage = function (sid) {
    return loadScrollDriveLastStayFromStorage(sid != null ? sid : null);
  };
  window.__graphideSoftStayScrollDriveAcrossHostSourceRepost = softStayScrollDriveAcrossHostSourceRepost;
}

/** S1w/S1aa — soft-restore scrollDriveBase from last-stay when reopening the same sourceId
 *  shortly after Present exit / Evidence close / Slice remount wipe / webview reload.
 *  Prefer in-memory snap; else seed from sessionStorage blob (S1aa). Skip hard zoomToEl.
 *  Returns true when restore applied. */
function softRestoreScrollDriveFromLastStay(nextSourceId) {
  if (typeof isPresenting === "function" && isPresenting()) return false;
  if (scrollDriveBase) return false;
  const sid = nextSourceId ? String(nextSourceId) : "";
  if (!sid) return false;
  const resolved = resolveScrollDriveLastStay(sid);
  if (!resolved || !resolved.snap) {
    // Mismatched stored blob for another source — leave it; memory already cleared.
    const other = loadScrollDriveLastStayFromStorage(null);
    if (other && String(other.sourceId) !== sid) {
      // Keep other-source blob; do not soft-restore.
      return false;
    }
    if (scrollDriveLastStay && String(scrollDriveLastStay.sourceId) !== sid) {
      clearScrollDriveLastStay();
    }
    return false;
  }
  const snap = resolved.snap;
  if (String(snap.sourceId) !== sid) {
    clearScrollDriveLastStay();
    return false;
  }
  // Storage snaps use 24h TTL (already checked); memory used 60s. Both OK here.
  const age = Date.now() - (Number(snap.t) || 0);
  const maxAge = resolved.fromStorage ? SCROLL_DRIVE_LAST_STAY_STORAGE_MS : SCROLL_DRIVE_LAST_STAY_MS;
  if (!Number.isFinite(age) || age < 0 || age > maxAge) {
    clearScrollDriveLastStay();
    return false;
  }
  // Prefer live camTo when still close to the snapshot; else seed from snap.
  const close =
    Number.isFinite(camTo.x) &&
    Number.isFinite(camTo.y) &&
    Math.abs(camTo.x - snap.x) < 120 &&
    Math.abs(camTo.y - snap.y) < 160 &&
    Math.abs((Number.isFinite(camTo.k) ? camTo.k : 1) - (snap.k || 1)) < 0.4;
  if (close) {
    scrollDriveBase = {
      x: camTo.x,
      y: camTo.y,
      k: Number.isFinite(camTo.k) && camTo.k > 0 ? camTo.k : snap.k || 1,
    };
  } else {
    scrollDriveBase = {
      x: Number.isFinite(snap.x) ? snap.x : 0,
      y: Number.isFinite(snap.y) ? snap.y : 0,
      k: Number.isFinite(snap.k) && snap.k > 0 ? snap.k : 1,
    };
  }
  // Clear lock + mark just-restored so applyScrollDriveCamera soft-stays while
  // KEEPING the snapshot base (do not reseed from Present leftover camTo).
  scrollDriveTargetLocked = "";
  scrollDriveJustRestored = true;
  scrollDriveCamXSettled = false;
  scrollDriveCamYSettled = false;
  scrollDriveYNudgeOrigin = Number(snap.scrollRatio) || 0;
  scrollDriveWasMacro = false;
  clearScrollDriveCfgPaint();
  clearScrollDriveLineMapPaint();
  clearScrollDriveActiveLinePaint();
  clearScrollDriveMacroPaint();
  // Ease camera toward restored stay (one path: setCamTarget / tickCam) — no zoomToEl.
  if (typeof setCamTarget === "function") {
    setCamTarget(scrollDriveBase.x, scrollDriveBase.y, scrollDriveBase.k);
  }
  // S1af — soft-restore ends Review-clear cue (next open owns cam again).
  if (typeof clearScrollDriveReviewStayClearedCue === "function") clearScrollDriveReviewStayClearedCue();
  return true;
}

/** S1w/S1aa — true when a same-source last-stay snapshot is still fresh (selectNode soft skip).
 *  Checks memory then sessionStorage so reload soft-restore also skips hard zoomEl. */
if (typeof window !== "undefined") {
  window.__graphideSoftRestoreScrollDriveFromLastStay = softRestoreScrollDriveFromLastStay;
}

function scrollDriveLastStayMatches(nextSourceId) {
  const sid = nextSourceId ? String(nextSourceId) : "";
  if (!sid) return false;
  const resolved = resolveScrollDriveLastStay(sid);
  if (!resolved || !resolved.snap) return false;
  const snap = resolved.snap;
  if (String(snap.sourceId) !== sid) return false;
  const age = Date.now() - (Number(snap.t) || 0);
  const maxAge = resolved.fromStorage ? SCROLL_DRIVE_LAST_STAY_STORAGE_MS : SCROLL_DRIVE_LAST_STAY_MS;
  return Number.isFinite(age) && age >= 0 && age <= maxAge;
}

/** S1x — desk/Slice remount while Evidence stays open (same sourceId, no Present):
 *  re-seed ScrollDrive from live camTo + warm S1w last-stay; clear settle flags;
 *  drop paint on destroyed DOM and schedule flush so lineMap / active-line rebuild
 *  (S1l). No wipe-then-zoomToEl. Returns true when soft stay / restore applied. */
function softStayScrollDriveAcrossDeskRemount() {
  if (typeof isPresenting === "function" && isPresenting()) return false;
  if (!sourcePane || sourcePane.hidden || !srcBody) return false;
  const sid = sourceId ? String(sourceId) : "";
  if (!sid) return false;
  // Keep last-stay warm before any remount wipe (recycle or full rebuild).
  if (scrollDriveBase && typeof stashScrollDriveLastStay === "function") {
    stashScrollDriveLastStay();
  }
  if (scrollDriveBase) {
    scrollDriveBase = {
      x: Number.isFinite(camTo.x) ? camTo.x : scrollDriveBase.x,
      y: Number.isFinite(camTo.y) ? camTo.y : scrollDriveBase.y,
      k: Number.isFinite(camTo.k) && camTo.k > 0 ? camTo.k : scrollDriveBase.k || 1,
    };
    // Clear lock so next flush soft-remaps to the newly painted vnode (S1t style).
    scrollDriveTargetLocked = "";
    scrollDriveCamXSettled = false;
    scrollDriveCamYSettled = false;
    scrollDriveWasMacro = false;
    // Keep restored/seeded base — applyScrollDriveCamera soft-stays without zoomToEl.
    scrollDriveJustRestored = true;
    clearScrollDriveCfgPaint();
    clearScrollDriveLineMapPaint();
    clearScrollDriveActiveLinePaint();
    clearScrollDriveMacroPaint();
    // Skip flush while Lens/Route own dim paint — a late rAF must not override probe opacity.
    if (lensOpen || routeOpen) {
      if (typeof cancelScrollDriveRaf === "function") cancelScrollDriveRaf();
      return true;
    }
    if (typeof onSrcBodyScroll === "function") onSrcBodyScroll();
    return true;
  }
  // Base wiped mid-remount but same-source last-stay is warm — soft restore (S1w).
  if (
    typeof softRestoreScrollDriveFromLastStay === "function" &&
    softRestoreScrollDriveFromLastStay(sid)
  ) {
    if (lensOpen || routeOpen) {
      if (typeof cancelScrollDriveRaf === "function") cancelScrollDriveRaf();
      return true;
    }
    if (typeof onSrcBodyScroll === "function") onSrcBodyScroll();
    return true;
  }
  return false;
}
// Harness / desk glue — Slice remount soft stay (S1x).
if (typeof window !== "undefined") {
  window.__graphideSoftStayScrollDriveAcrossDeskRemount = softStayScrollDriveAcrossDeskRemount;


/** S1bq — Evidence open + warm stay (live base or matching last-stay): enter/exit remount soft-stays. */
function evidenceScrollDriveStayLive() {
  if (typeof isPresenting === "function" && isPresenting()) return false;
  if (!sourcePane || sourcePane.hidden || !sourceId) return false;
  return !!(
    scrollDriveBase ||
    (typeof scrollDriveLastStayMatches === "function" &&
      scrollDriveLastStayMatches(String(sourceId)))
  );
}

}

/** S1y/S1z — desk workspace hop remounts the canvas mid ScrollDrive while Evidence
 *  stays open (same sourceId, no Present). Covers Map↔Slice (S1y) and
 *  Lineage↔Slice / Overview↔Slice / Lineage↔Overview / Map↔Lineage|Overview (S1z).
 *  Prefer warm S1w last-stay when cam was wiped by bindStage reset / scheduleFit
 *  ResizeObserver; else re-seed from live camTo like S1x. Soft-follow mapped
 *  target on Slice / Lineage / Overview landing (S1q/S1t); skip hard zoomToEl.
 *  Map landing keeps stay warm without a flush soft-follow (no slice vnodes —
 *  avoids stacking ±80 camX). Returns true when soft stay applied. */
function softStayScrollDriveAcrossMapSliceHop() {
  if (typeof isPresenting === "function" && isPresenting()) return false;
  if (!sourcePane || sourcePane.hidden || !srcBody) return false;
  const sid = sourceId ? String(sourceId) : "";
  if (!sid) return false;
  // Drop lingering scheduleFit ResizeObserver — workspace resize on Map↔Slice must
  // not fitChart-yank the soft-stay camera mid-hop.
  if (typeof stageFitRo !== "undefined" && stageFitRo) {
    stageFitRo.disconnect();
    stageFitRo = null;
  }
  // S1aa — prefer warm memory; else hydrate from sessionStorage last-stay blob.
  const resolvedHop =
    typeof resolveScrollDriveLastStay === "function" ? resolveScrollDriveLastStay(sid) : null;
  const snap = (resolvedHop && resolvedHop.snap) || scrollDriveLastStay;
  const snapOk =
    snap &&
    String(snap.sourceId) === sid &&
    (() => {
      const age = Date.now() - (Number(snap.t) || 0);
      const maxAge =
        resolvedHop && resolvedHop.fromStorage
          ? SCROLL_DRIVE_LAST_STAY_STORAGE_MS
          : SCROLL_DRIVE_LAST_STAY_MS;
      return Number.isFinite(age) && age >= 0 && age <= maxAge;
    })();
  const seedFromSnap = () => {
    if (!snapOk) return false;
    scrollDriveBase = {
      x: Number.isFinite(snap.x) ? snap.x : 0,
      y: Number.isFinite(snap.y) ? snap.y : 0,
      k: Number.isFinite(snap.k) && snap.k > 0 ? snap.k : 1,
    };
    scrollDriveTargetLocked = "";
    scrollDriveCamXSettled = false;
    scrollDriveCamYSettled = false;
    scrollDriveYNudgeOrigin = Number(snap.scrollRatio) || 0;
    scrollDriveWasMacro = false;
    scrollDriveJustRestored = true;
    clearScrollDriveCfgPaint();
    clearScrollDriveLineMapPaint();
    clearScrollDriveActiveLinePaint();
    clearScrollDriveMacroPaint();
    if (typeof setCamTarget === "function") {
      setCamTarget(scrollDriveBase.x, scrollDriveBase.y, scrollDriveBase.k);
    }
    return true;
  };
  // Map landing — keep stay warm; do NOT flush soft-follow (would stack camX caps
  // with no slice vnode, and Map fit is deferred until Evidence closes / cold remount).
  if (explorerWs === "map") {
    if (typeof cancelScrollDriveRaf === "function") cancelScrollDriveRaf();
    if (seedFromSnap() || scrollDriveBase) {
      if (!snapOk && scrollDriveBase && typeof setCamTarget === "function") {
        setCamTarget(scrollDriveBase.x, scrollDriveBase.y, scrollDriveBase.k);
      }
      scrollDriveTargetLocked = "";
      scrollDriveCamXSettled = false;
      scrollDriveCamYSettled = false;
      scrollDriveWasMacro = false;
      scrollDriveJustRestored = true;
      clearScrollDriveCfgPaint();
      clearScrollDriveLineMapPaint();
      clearScrollDriveActiveLinePaint();
      clearScrollDriveMacroPaint();
      return true;
    }
    return false;
  }
  // Slice / Lineage / Overview landing — prefer snap when cam was yanked; else
  // desk-remount soft stay + flush (S1y Slice + S1z Lineage/Overview).
  if (snapOk) {
    const close =
      Number.isFinite(camTo.x) &&
      Number.isFinite(camTo.y) &&
      Math.abs(camTo.x - snap.x) < 120 &&
      Math.abs(camTo.y - snap.y) < 160 &&
      Math.abs((Number.isFinite(camTo.k) ? camTo.k : 1) - (snap.k || 1)) < 0.4;
    if (!close) {
      if (seedFromSnap()) {
        if (lensOpen || routeOpen) {
          if (typeof cancelScrollDriveRaf === "function") cancelScrollDriveRaf();
          return true;
        }
        if (typeof onSrcBodyScroll === "function") onSrcBodyScroll();
        return true;
      }
    } else {
      // Cam still near pre-hop stay — re-assert snap exactly (no stacked soft-follow).
      if (seedFromSnap()) {
        if (lensOpen || routeOpen) {
          if (typeof cancelScrollDriveRaf === "function") cancelScrollDriveRaf();
          return true;
        }
        // Flush rebuilds CFG / lineMap / active-line (S1l); justRestored soft-stays.
        if (typeof onSrcBodyScroll === "function") onSrcBodyScroll();
        return true;
      }
    }
  }
  let ok = false;
  if (typeof softStayScrollDriveAcrossDeskRemount === "function") {
    ok = softStayScrollDriveAcrossDeskRemount();
  }
  if (ok && scrollDriveBase && typeof setCamTarget === "function") {
    setCamTarget(scrollDriveBase.x, scrollDriveBase.y, scrollDriveBase.k);
  }
  return ok;
}
// Harness / desk glue — Map↔Slice (S1y) + Lineage/Overview desk hops (S1z).
// One soft-stay path — S1z reuses this helper (no third stay fork).
if (typeof window !== "undefined") {
  window.__graphideSoftStayScrollDriveAcrossMapSliceHop = softStayScrollDriveAcrossMapSliceHop;
  window.__graphideSoftStayScrollDriveAcrossLineageOverviewHop = softStayScrollDriveAcrossMapSliceHop;
}

/** S1m — Present stage owns the camera; freeze ScrollDrive + clear residual timers/paint.
 *  S1ad — stash before wipe (parity with Evidence close); publish presentStayStashed /
 *  data-scroll-present-stay so the restore path is honest when no prior stay exists. */
function pauseScrollDriveForPresent() {
  // S1w/S1ad — remember stay before wipe (applyPresent / closeSourcePane may already have stashed).
  if (typeof stashScrollDriveLastStay === "function") stashScrollDriveLastStay();
  // S1ai — Present-stash / Present-enter and Review-clear cues are mutually exclusive.
  // Clear lingering reviewStayCleared even when stash no-ops (no live base).
  if (typeof clearScrollDriveReviewStayClearedCue === "function") {
    clearScrollDriveReviewStayClearedCue();
  } else {
    scrollDriveReviewStayCleared = false;
  }
  const stayStashed = !!(scrollDriveLastStay && scrollDriveLastStay.sourceId);
  if (typeof scrollDriveMacroTimer !== "undefined" && scrollDriveMacroTimer) {
    clearTimeout(scrollDriveMacroTimer);
    scrollDriveMacroTimer = 0;
  }
  if (scrollDriveEaseTimer) {
    clearTimeout(scrollDriveEaseTimer);
    scrollDriveEaseTimer = 0;
  }
  if (typeof cancelScrollDriveRaf === "function") cancelScrollDriveRaf();
  scrollDriveBase = null;
  scrollDriveTargetLocked = "";
  scrollDriveCamXSettled = false;
  scrollDriveCamYSettled = false;
  scrollDriveYNudgeOrigin = 0;
  scrollDriveWasMacro = false;
  scrollDriveVel = { t: 0, top: 0, vel: 0 };
  // S1ad — do not mark justRestored on pause; Present exit must not half-apply restore.
  scrollDriveJustRestored = false;
  scrollDriveSuppressNextRefit = false;
  setCamEase(CAM_EASE_BASE);
  clearScrollDriveCfgPaint();
  clearScrollDriveLineMapPaint();
  clearScrollDriveActiveLinePaint();
  clearScrollDriveMacroPaint();
  clearScrollDriveAnchorPaint();
  clearScrollDriveDetailPaint();
  clearScrollDriveBlendPaint();
  const vp = viewportEl || (canvas && canvas.querySelector(".viewport"));
  if (vp) {
    vp.setAttribute("data-scroll-present-paused", "1");
    if (stayStashed) vp.setAttribute("data-scroll-present-stay", "1");
    else vp.removeAttribute("data-scroll-present-stay");
  }
  const d = emptyScrollDrive();
  d.presentPaused = true;
  d.presentStayStashed = !!stayStashed;
  // S1ai — never publish Review-clear alongside Present-stash honesty.
  d.reviewStayCleared = false;
  publishScrollDrive(d);
}

/** S1m — Present exit: drop pause flag, restore idle camEase; Evidence may reopen later.
 *  S1ad — exit alone must not soft-restore / yank cam; clear present-stay cue; keep
 *  lastStay warm in memory for showSource reopen (S1w).
 *  S1am — exit alone never implies Review clear: scrub reviewStayCleared memory +
 *  data-scroll-review-clear (do not re-publish a stale / mid-Present half-set cue). */
function resumeScrollDriveAfterPresent() {
  setCamEase(CAM_EASE_BASE);
  // S1ad — never half-apply restore on Present exit (wait for Evidence reopen).
  scrollDriveJustRestored = false;
  scrollDriveSuppressNextRefit = false;
  // S1am — Present exit ≠ Review clear; force-clear cue even if planted mid-Present.
  if (typeof clearScrollDriveReviewStayClearedCue === "function") {
    clearScrollDriveReviewStayClearedCue();
  } else {
    scrollDriveReviewStayCleared = false;
  }
  const vp = viewportEl || (canvas && canvas.querySelector(".viewport"));
  if (vp) {
    vp.removeAttribute("data-scroll-present-paused");
    vp.removeAttribute("data-scroll-present-stay");
    // Belt: cue clear may early-return when memory already false — still scrub DOM.
    vp.removeAttribute("data-scroll-review-clear");
  }
  const d = emptyScrollDrive();
  d.presentPaused = false;
  d.presentStayStashed = false;
  d.reviewStayCleared = false;
  publishScrollDrive(d);
}

function readSrcActiveLine() {
  if (!srcBody) return 0;
  // Use viewport rects — .src-line offsetParent is the desk root, not #srcBody,
  // so offsetTop is not scroll-local (S1h needs a reliable activeLine).
  const bodyRect = srcBody.getBoundingClientRect();
  const midY = bodyRect.top + srcBody.clientHeight / 2;
  const lines = srcBody.querySelectorAll(".src-line");
  for (let i = 0; i < lines.length; i++) {
    const el = lines[i];
    const r = el.getBoundingClientRect();
    if (r.top <= midY && midY < r.bottom + 0.5) {
      const ln = el.querySelector(".ln");
      const n = parseInt(ln && ln.textContent, 10);
      return Number.isFinite(n) ? n : 0;
    }
  }
  return 0;
}

function findScrollDriveTargetEl(id) {
  if (!id || !canvas) return null;
  const esc =
    typeof CSS !== "undefined" && CSS.escape
      ? CSS.escape(String(id))
      : String(id).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return (
    canvas.querySelector('.vnode[data-id="' + esc + '"]') ||
    canvas.querySelector('.ego-node[data-id="' + esc + '"]') ||
    canvas.querySelector('.comm-node[data-id="' + esc + '"]') ||
    canvas.querySelector('.bubble-card[data-bubble="' + esc + '"]') ||
    canvas.querySelector('[data-id="' + esc + '"]')
  );
}

/** S1n — clear lineMapHit glow/pulse paint (hit pulse vs quieter miss). */
function clearScrollDriveLineMapPaint() {
  if (!canvas) return;
  canvas
    .querySelectorAll(
      ".vnode.scroll-linemap-hit, .vnode.scroll-linemap-miss, .vnode[data-scroll-linemap]"
    )
    .forEach((el) => {
      el.classList.remove("scroll-linemap-hit", "scroll-linemap-miss");
      el.removeAttribute("data-scroll-linemap");
    });
}

/** S1n — when lineMapHit, pulse the mapped node (distinct from scroll-cfg-hot);
 *  miss/fallback keeps a quieter outline. Reduced-motion (S1k) → static glow,
 *  no pulse (`lineMapPulse` false). Present pause clears via reset/pause. */
function applyScrollDriveLineMapGlow(lineMapHit, targetNodeId) {
  clearScrollDriveLineMapPaint();
  if (!canvas) return { lineMapPulse: false };
  // Present owns the desk — never revive glow while stage is on.
  if (typeof isPresenting === "function" && isPresenting()) return { lineMapPulse: false };
  function vnodeFor(id) {
    if (!id) return null;
    const found = findScrollDriveTargetEl(id);
    if (!found) return null;
    if (found.classList && found.classList.contains("vnode")) return found;
    return found.closest ? found.closest(".vnode") : null;
  }
  // Prefer the mapped target; if that Steiner/IR node is not painted on this
  // canvas, fall back to the open Evidence sourceId so the focus cue stays visible.
  let el = vnodeFor(targetNodeId);
  if (!el && sourceId) el = vnodeFor(sourceId);
  if (!el) return { lineMapPulse: false };
  const reduced = typeof reduceMotion === "function" && reduceMotion();
  if (lineMapHit) {
    el.classList.add("scroll-linemap-hit");
    el.setAttribute("data-scroll-linemap", "hit");
    return { lineMapPulse: !reduced };
  }
  el.classList.add("scroll-linemap-miss");
  el.setAttribute("data-scroll-linemap", "miss");
  return { lineMapPulse: false };
}



/** S1p — clear Evidence mid-viewport active-line cue (dual-pane with S1n glow). */
function clearScrollDriveActiveLinePaint() {
  if (!srcBody) return;
  srcBody
    .querySelectorAll(".src-line.scroll-drive-active, .src-line[data-scroll-active]")
    .forEach((el) => {
      el.classList.remove("scroll-drive-active");
      el.removeAttribute("data-scroll-active");
    });
}

/** S1p — mark the mid-viewport Evidence `.src-line` that owns activeLine so the
 *  editor side shows which line drives the canvas (pairs with S1n lineMapHit glow).
 *  Present pause / Evidence close / reset clear via clearScrollDriveActiveLinePaint. */
function applyScrollDriveActiveLine(activeLine) {
  clearScrollDriveActiveLinePaint();
  if (!srcBody) return { activeLineMarked: false };
  if (typeof isPresenting === "function" && isPresenting()) return { activeLineMarked: false };
  const line = Number(activeLine) || 0;
  if (line <= 0) return { activeLineMarked: false };
  const bodyRect = srcBody.getBoundingClientRect();
  const midY = bodyRect.top + srcBody.clientHeight / 2;
  const lines = srcBody.querySelectorAll(".src-line");
  let marked = null;
  for (let i = 0; i < lines.length; i++) {
    const el = lines[i];
    const r = el.getBoundingClientRect();
    if (r.top <= midY && midY < r.bottom + 0.5) {
      marked = el;
      break;
    }
  }
  if (!marked) {
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i].querySelector(".ln");
      const n = parseInt(ln && ln.textContent, 10);
      if (n === line) {
        marked = lines[i];
        break;
      }
    }
  }
  if (!marked) return { activeLineMarked: false };
  marked.classList.add("scroll-drive-active");
  marked.setAttribute("data-scroll-active", "1");
  return { activeLineMarked: true };
}

/** S1q — soft ±px camX follow toward centering the mapped vnode (never yank). */
const SCROLL_CAMX_FOLLOW_CAP = 80;
/** S1u — lighter ±px soft follow when macro-hot remaps / macro enter soft-stay. */
const SCROLL_MACRO_CAM_FOLLOW_CAP = 48;
/** S1u — max |Δk| per macro setCamTarget so overview eases (skip under reduced-motion). */
const SCROLL_MACRO_K_DELTA_CAP = 0.35;

/** Content→screen math (same as zoomToEl): ideal camX to center el at scale k.
 *  Soft-clamped delta from baseX so dual-pane morph is not vertical-only. */
function scrollDriveSoftCamX(el, baseX, k, cap) {
  const stage = canvas && canvas.querySelector(".stage");
  if (!stage || !el) return baseX;
  const vr = stage.getBoundingClientRect();
  if (vr.width < 24) return baseX;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2 - vr.left;
  const liveK = cam && cam.k ? cam.k : k;
  if (!Number.isFinite(liveK) || Math.abs(liveK) < 1e-6) return baseX;
  const contentX = (cx - cam.x) / liveK;
  const nk = Number.isFinite(k) && k > 0 ? k : liveK;
  const idealX = vr.width / 2 - contentX * nk;
  let dx = idealX - baseX;
  const lim = Math.max(0, Number(cap));
  if (!Number.isFinite(lim)) return baseX;
  if (dx > lim) dx = lim;
  if (dx < -lim) dx = -lim;
  return baseX + dx;
}

/** S1r — fold S1q soft-followed camX into scrollDriveBase on idle settle.
 *  Uses camTo.x (already soft-clamped by applyScrollDriveCamera) so the base
 *  absorbs the correction without a second RAF loop or fighting S1c macro. */
function absorbScrollDriveSoftCamX() {
  if (typeof isPresenting === "function" && isPresenting()) return false;
  if (!scrollDriveBase || !canvas) return false;
  const d = window.__graphideScrollDrive;
  if (d && d.macroLod) return false;
  if (!Number.isFinite(camTo.x)) return false;
  if (Math.abs(camTo.x - scrollDriveBase.x) < 0.5) {
    scrollDriveCamXSettled = true;
    return false;
  }
  scrollDriveBase.x = camTo.x;
  scrollDriveCamXSettled = true;
  // S1w — keep last-stay warm while Evidence soft-stay is live (Slice remount).
  if (typeof stashScrollDriveLastStay === "function") stashScrollDriveLastStay();
  return true;
}

/** S1s — fold post-nudge soft camY into scrollDriveBase on idle settle.
 *  Rebases Y-nudge origin to the live scrollRatio so the next tiny scroll
 *  does not re-apply the full absolute nudge (parity with S1r camX absorb).
 *  No second RAF; Present pause / macro LOD no-op. */
function absorbScrollDriveSoftCamY() {
  if (typeof isPresenting === "function" && isPresenting()) return false;
  if (!scrollDriveBase || !canvas) return false;
  const d = window.__graphideScrollDrive;
  if (d && d.macroLod) return false;
  if (!Number.isFinite(camTo.y)) return false;
  let ratio = 0;
  if (srcBody) {
    const max = Math.max(1, srcBody.scrollHeight - srcBody.clientHeight);
    ratio = Math.max(0, Math.min(1, srcBody.scrollTop / max));
  } else if (d && Number.isFinite(d.scrollRatio)) {
    ratio = Number(d.scrollRatio);
  }
  // Already absorbed at this ratio — keep flag hot for harness.
  if (
    scrollDriveCamYSettled &&
    Math.abs(ratio - scrollDriveYNudgeOrigin) < 0.002 &&
    Math.abs(camTo.y - scrollDriveBase.y) < 0.5
  ) {
    return false;
  }
  scrollDriveBase.y = camTo.y;
  scrollDriveYNudgeOrigin = ratio;
  scrollDriveCamYSettled = true;
  // S1w — keep last-stay warm while Evidence soft-stay is live (Slice remount).
  if (typeof stashScrollDriveLastStay === "function") stashScrollDriveLastStay();
  return true;
}

function applyScrollDriveCamera(scrollRatio, targetNodeId) {
  // S1m — Present owns cam; never nudge while stage is on.
  if (typeof isPresenting === "function" && isPresenting()) return;
  if (!canvas) return;
  const lock = targetNodeId ? String(targetNodeId) : "";
  const el = findScrollDriveTargetEl(targetNodeId);
  // S1bv — when just-restored fires inside the lock block, skip soft camX on this apply.
  let keepRestoredCamX = false;
  if (!scrollDriveBase || scrollDriveTargetLocked !== lock) {
    // S1t — mid-scroll nest/line remap: seed base from current camTo and soft-follow
    // the new vnode (S1q cap). Avoid zoomToEl yank that discards S1r/S1s settle.
    // First lock (no prior base) still uses zoomToEl as today.
    // S1t — any mid-session lock change with an existing base soft-stays.
    // First lock (!scrollDriveBase) still zoomToEl below.
    const remapping = !!(scrollDriveBase && scrollDriveTargetLocked !== lock);
    // S1w — just-restored: soft-stay but KEEP snapshot base (no camTo reseed / no zoomToEl).
    const justRestored = !!scrollDriveJustRestored && !!scrollDriveBase;
    scrollDriveJustRestored = false;
    // S1bv — remember just-restored across this apply so soft camX cannot walk the
    // leave-stash / soft-restore base toward the vnode attractor on first flush.
    keepRestoredCamX = justRestored;
    const softStay = remapping || justRestored;
    scrollDriveTargetLocked = lock;
    if (softStay) {
      if (!justRestored) {
        scrollDriveBase = {
          x: Number.isFinite(camTo.x) ? camTo.x : 0,
          y: Number.isFinite(camTo.y) ? camTo.y : 0,
          k: Number.isFinite(camTo.k) && camTo.k > 0 ? camTo.k : 1,
        };
        // Rebase Y-nudge origin so seeding from live camTo does not re-apply absolute nudge.
        scrollDriveYNudgeOrigin = Number(scrollRatio) || 0;
      }
      // justRestored: keep snapshot base + Y origin from softRestore.
    } else {
      if (el) zoomToEl(el, Math.min(CAM_MAX, Math.max(1.35, camTo.k)));
      scrollDriveBase = { x: camTo.x, y: camTo.y, k: camTo.k };
      scrollDriveYNudgeOrigin = 0;
    }
    // Remap / first lock — idle settle may re-absorb soft cam into the new base.
    // S1bv — just-restored base is already the stay; mark X settled so harness / idle
    // do not soft-follow+absorb-walk it on the first flush.
    scrollDriveCamXSettled = !!justRestored;
    scrollDriveCamYSettled = false;
  }
  // scrollRatio 0 → base focus; deeper scroll nudges cam Y — proves scroll moves the camera.
  // S1s — after idle absorb, nudge is relative to settled origin so Y does not re-yank.
  const nudge = (scrollRatio - scrollDriveYNudgeOrigin) * 48;
  // S1q — soft camX follow toward mapped target (prefer lineMapHit el / sourceId vnode).
  // Cap so it eases, never yanks. Macro LOD keeps its own path (no fight).
  // S1r absorbs camTo.x into scrollDriveBase on idle settle so a missing-el /
  // base-only path cannot spring back to the pre-follow X.
  // S1bv — just-restored first flush keeps snapshot base X (no soft-follow walk).
  const camX =
    el && !keepRestoredCamX
      ? scrollDriveSoftCamX(el, scrollDriveBase.x, scrollDriveBase.k, SCROLL_CAMX_FOLLOW_CAP)
      : scrollDriveBase.x;
  // S1u — soft-cap k toward micro base so macro→micro eases (S1k snaps uncapped).
  let camK = scrollDriveBase.k;
  if (!(typeof reduceMotion === "function" && reduceMotion()) && Number.isFinite(camTo.k) && camTo.k > 0) {
    const dk = camK - camTo.k;
    if (dk > SCROLL_MACRO_K_DELTA_CAP) camK = camTo.k + SCROLL_MACRO_K_DELTA_CAP;
    else if (dk < -SCROLL_MACRO_K_DELTA_CAP) camK = camTo.k - SCROLL_MACRO_K_DELTA_CAP;
  }
  setCamTarget(camX, scrollDriveBase.y - nudge, camK);
  // Keep easing k toward micro base after macro exit when no further scroll arrives.
  if (
    !(typeof reduceMotion === "function" && reduceMotion()) &&
    Number.isFinite(scrollDriveBase.k) &&
    Math.abs(scrollDriveBase.k - camK) > 0.02
  ) {
    if (scrollDriveMacroTimer) clearTimeout(scrollDriveMacroTimer);
    scrollDriveMacroTimer = setTimeout(() => {
      scrollDriveMacroTimer = 0;
      if (srcBody && sourcePane && !sourcePane.hidden) onSrcBodyScroll();
    }, 120);
  }
  // S1r / S1s / S1k — reduced-motion skips settle timers; snap-absorb soft cam into base.
  if (typeof reduceMotion === "function" && reduceMotion()) {
    if (Number.isFinite(camX) && Math.abs(camX - scrollDriveBase.x) >= 0.5) {
      scrollDriveBase.x = camX;
    }
    scrollDriveCamXSettled = true;
    if (Number.isFinite(camTo.y)) {
      scrollDriveBase.y = camTo.y;
      scrollDriveYNudgeOrigin = scrollRatio;
    }
    scrollDriveCamYSettled = true;
  }
}

/** Scroll velocity (px/ms EMA) + age decay — fast flick → macro Map LOD (S1c). */
let scrollDriveVel = { t: 0, top: 0, vel: 0 };
const SCROLL_MACRO_RATIO = 0.18;
const SCROLL_MACRO_VEL = 0.55;

function noteScrollDriveVelocity(scrollTop) {
  const now = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  if (!scrollDriveVel.t) {
    scrollDriveVel = { t: now, top: scrollTop, vel: 0 };
    return 0;
  }
  const dt = Math.max(1, now - scrollDriveVel.t);
  const dTop = Math.abs(scrollTop - scrollDriveVel.top);
  const instant = dTop / dt;
  scrollDriveVel.vel = scrollDriveVel.vel * 0.35 + instant * 0.65;
  scrollDriveVel.t = now;
  scrollDriveVel.top = scrollTop;
  return scrollDriveVel.vel;
}

function readScrollDriveVelocity() {
  if (!scrollDriveVel.t) return 0;
  const now = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  const age = now - scrollDriveVel.t;
  if (age <= 120) return scrollDriveVel.vel;
  return scrollDriveVel.vel * Math.exp(-(age - 120) / 180);
}

function scrollDriveEaseFromVel(vel) {
  // High velocity → loose lerp (less fight with scroll); low → snappy settle.
  const v = Math.max(0, Number(vel) || 0);
  const t = Math.min(1, v / SCROLL_VEL_LOOSE);
  return CAM_EASE_SNAP + (CAM_EASE_LOOSE - CAM_EASE_SNAP) * t;
}

function setCamEase(e) {
  const n = Number(e);
  camEase = Number.isFinite(n) ? Math.max(0.08, Math.min(0.45, n)) : CAM_EASE_BASE;
}

/** S1j — map camEase → CSS blend duration (loose → longer; snappy → shorter).
 * S1k — prefers-reduced-motion → 0ms (snap; setCamTarget already jumps). */
function scrollDriveBlendMsFromEase(ease) {
  if (typeof reduceMotion === "function" && reduceMotion()) return 0;
  const a = Number(ease);
  const e = Number.isFinite(a) ? Math.max(0.08, Math.min(0.45, a)) : CAM_EASE_BASE;
  const span = CAM_EASE_SNAP - CAM_EASE_LOOSE;
  const t = span > 0 ? Math.max(0, Math.min(1, (e - CAM_EASE_LOOSE) / span)) : 0.5;
  // 0.12 → 280ms, 0.36 → 120ms (still eases; never 0 unless reduced-motion).
  return Math.round(280 + (120 - 280) * t);
}

function clearScrollDriveBlendPaint() {
  // Clear every .viewport — shared/singleton cam must not leave blend on Lineage etc.
  const seen = new Set();
  function wipe(vp) {
    if (!vp || seen.has(vp)) return;
    seen.add(vp);
    vp.removeAttribute("data-scroll-blend");
    if (vp.style) vp.style.removeProperty("--scroll-blend-ms");
  }
  wipe(viewportEl);
  if (canvas) canvas.querySelectorAll(".viewport").forEach(wipe);
  document.querySelectorAll(".viewport[data-scroll-blend]").forEach(wipe);
}

/** S1j — publish camEase-tied blend on .viewport for nest/macro CSS transitions. */
function applyScrollDriveBlendPaint(ease) {
  const ms = scrollDriveBlendMsFromEase(ease);
  const vp = viewportEl || (canvas && canvas.querySelector(".viewport"));
  if (vp) {
    if (vp.getAttribute("data-scroll-blend") !== "1") vp.setAttribute("data-scroll-blend", "1");
    if (vp.style) vp.style.setProperty("--scroll-blend-ms", ms + "ms");
  }
  return { blendMs: ms };
}

function wantScrollDriveMacro(scrollRatio, vel, canScroll) {
  if (!canScroll) return false;
  // File top (low ratio) or a fast flick — short / unscrollable Evidence stays micro.
  return scrollRatio <= SCROLL_MACRO_RATIO || vel >= SCROLL_MACRO_VEL;
}

function clearScrollDriveMacroPaint() {
  if (!canvas) return;
  canvas.querySelectorAll(".vnode.scroll-macro-hot, .vnode.scroll-macro-dim, .vnode[data-macro-hot]").forEach((el) => {
    el.classList.remove("scroll-macro-hot", "scroll-macro-dim");
    el.removeAttribute("data-macro-hot");
  });
  const vp = viewportEl || canvas.querySelector(".viewport");
  if (vp) {
    vp.removeAttribute("data-scroll-macro");
    // Restore LOD from live camera — applyCam will keep it in sync.
    if (!mapStageMounted()) {
      const lod = String(lodOf(cam && cam.k != null ? cam.k : 1));
      if (vp.getAttribute("data-lod") !== lod) vp.setAttribute("data-lod", lod);
    }
  }
}

/** S1c — high scroll velocity or file-top → Map overview LOD + focus module, dim rest.
 *  S1u — soft-stay on macro enter / macro-hot remap: seed from camTo, capped soft
 *  follow + capped k delta via setCamTarget (no zoomToEl yank mid soft-stay). */
function applyScrollDriveMacro(scrollRatio, targetNodeId, opts) {
  // S1m — Present owns cam; skip macro LOD camera/paint on stage.
  if (typeof isPresenting === "function" && isPresenting()) return { macroLod: false };
  if (!canvas) return { macroLod: false };
  const lock = targetNodeId ? String(targetNodeId) : "";
  const el = findScrollDriveTargetEl(targetNodeId);
  const entering = !!(opts && opts.entering);
  const remapping = !!(scrollDriveBase && scrollDriveTargetLocked !== lock);
  // Soft-stay when mid dual-pane soft-stay enters macro, or macro-hot remaps.
  // First lock with no prior base still zoomToEl (S1c cold start).
  const softStay = !!(scrollDriveBase && (remapping || entering));
  if (!scrollDriveBase || remapping || entering) {
    scrollDriveTargetLocked = lock;
    if (softStay) {
      // Keep micro base.k so exit can ease back to focus scale (do not adopt overview camTo.k).
      const keepK =
        Number.isFinite(scrollDriveBase.k) && scrollDriveBase.k > 0
          ? scrollDriveBase.k
          : Number.isFinite(camTo.k) && camTo.k > 0
            ? camTo.k
            : 1;
      scrollDriveBase = {
        x: Number.isFinite(camTo.x) ? camTo.x : 0,
        y: Number.isFinite(camTo.y) ? camTo.y : 0,
        k: keepK,
      };
      scrollDriveYNudgeOrigin = Number(scrollRatio) || 0;
    } else {
      if (el) zoomToEl(el, Math.min(CAM_MAX, Math.max(1.35, camTo.k)));
      scrollDriveBase = { x: camTo.x, y: camTo.y, k: camTo.k };
      scrollDriveYNudgeOrigin = 0;
    }
    scrollDriveCamXSettled = false;
    scrollDriveCamYSettled = false;
  }
  // Pull toward overview so lodOf(k) → 0; gentler Y nudge than micro focus.
  const kIdeal = Math.min(0.68, Math.max(0.42, scrollDriveBase.k * 0.45));
  let kMacro = kIdeal;
  const reduced = typeof reduceMotion === "function" && reduceMotion();
  // S1u — cap k delta from live camTo every macro flush so overview eases; S1k snaps.
  if (!reduced && Number.isFinite(camTo.k) && camTo.k > 0) {
    const dk = kMacro - camTo.k;
    if (dk > SCROLL_MACRO_K_DELTA_CAP) kMacro = camTo.k + SCROLL_MACRO_K_DELTA_CAP;
    else if (dk < -SCROLL_MACRO_K_DELTA_CAP) kMacro = camTo.k - SCROLL_MACRO_K_DELTA_CAP;
  }
  const nudge = (scrollRatio - scrollDriveYNudgeOrigin) * 24;
  // S1u — soft X toward new/enter hot vnode (lighter cap than S1q micro).
  let camX = scrollDriveBase.x;
  if (el && softStay) {
    camX = scrollDriveSoftCamX(el, scrollDriveBase.x, kMacro, SCROLL_MACRO_CAM_FOLLOW_CAP);
  }
  setCamTarget(camX, scrollDriveBase.y - nudge, kMacro);
  // Keep easing k toward overview while still capped (no more scroll needed).
  if (!reduced && Math.abs(kIdeal - kMacro) > 0.02) {
    if (scrollDriveMacroTimer) clearTimeout(scrollDriveMacroTimer);
    scrollDriveMacroTimer = setTimeout(() => {
      scrollDriveMacroTimer = 0;
      if (srcBody && sourcePane && !sourcePane.hidden) onSrcBodyScroll();
    }, 120);
  }
  const vp = viewportEl || canvas.querySelector(".viewport");
  if (vp) {
    if (vp.getAttribute("data-lod") !== "0") vp.setAttribute("data-lod", "0");
    vp.setAttribute("data-scroll-macro", "1");
  }
  const hotId = targetNodeId ? String(targetNodeId) : "";
  canvas.querySelectorAll(".vnode[data-id]").forEach((node) => {
    const id = node.getAttribute("data-id");
    const hot = !!(hotId && id === hotId);
    node.classList.toggle("scroll-macro-hot", hot);
    node.classList.toggle("scroll-macro-dim", !hot);
    if (hot) node.setAttribute("data-macro-hot", "1");
    else node.removeAttribute("data-macro-hot");
  });
  return { macroLod: true };
}

function lineOfScrollDriveNode(id) {
  const n = nodeById.get(idVal(id));
  if (!n || !n.span) return 0;
  if (n.span.start && n.span.start.line) return Number(n.span.start.line) || 0;
  return Number(n.span.line) || 0;
}

/** IR / fixture span line range — start/end or flat line/endLine (S1h). */
function spanLinesOfScrollDriveNode(id) {
  const n = nodeById.get(idVal(id));
  if (!n || !n.span) return null;
  const sp = n.span;
  const start = Number((sp.start && sp.start.line) || sp.line) || 0;
  if (!start) return null;
  const endRaw = Number((sp.end && sp.end.line) || sp.endLine) || start;
  return {
    start: start,
    end: Math.max(start, endRaw),
    file: sp.file || "",
  };
}

function evidenceScrollDriveFile() {
  if (!sourceId) return "";
  const n = nodeById.get(idVal(sourceId));
  return (n && n.span && n.span.file) || "";
}

/**
 * Map Evidence activeLine → graph node via IR/fixture line spans (S1h).
 * Prefer same-file tightest containing span; else nearest within 48 lines;
 * else fall back to inspected Evidence node (sourceId).
 */
function resolveScrollDriveTargetNode(activeLine) {
  const fallback = sourceId ? String(sourceId) : "";
  const line = Number(activeLine) || 0;
  if (!line || !nodeById || typeof nodeById.forEach !== "function") {
    return { targetNodeId: fallback, lineMapHit: false };
  }
  const file = evidenceScrollDriveFile();
  const walk = new Set(scrollDriveCfgWalk());
  let bestContain = null;
  let bestNear = null;
  nodeById.forEach((_n, rawId) => {
    const id = String(idVal(rawId));
    const span = spanLinesOfScrollDriveNode(id);
    if (!span) return;
    const sameFile = !file || !span.file || span.file === file;
    if (!sameFile) return;
    let score = 0;
    if (walk.has(id)) score += 2;
    if (id === fallback) score += 1;
    if (findScrollDriveTargetEl(id)) score += 1;
    if (line >= span.start && line <= span.end) {
      const width = span.end - span.start;
      const cand = { id: id, width: width, score: score };
      if (
        !bestContain ||
        cand.width < bestContain.width ||
        (cand.width === bestContain.width && cand.score > bestContain.score)
      ) {
        bestContain = cand;
      }
      return;
    }
    const dist = line < span.start ? span.start - line : line - span.end;
    const cand = { id: id, dist: dist, score: score };
    if (
      !bestNear ||
      cand.dist < bestNear.dist ||
      (cand.dist === bestNear.dist && cand.score > bestNear.score)
    ) {
      bestNear = cand;
    }
  });
  if (bestContain) return { targetNodeId: bestContain.id, lineMapHit: true };
  // Loose nearest — harness pad lines often sit far from fixture spans.
  if (bestNear && bestNear.dist <= 48) {
    return { targetNodeId: bestNear.id, lineMapHit: true };
  }
  return { targetNodeId: fallback, lineMapHit: false };
}

/** Current flow Steiner walk — fixture CFG for micro unroll (S1b). */
function scrollDriveCfgWalk() {
  const flow = (typeof currentFlow === "function" && currentFlow()) || (typeof storyFlow === "function" && storyFlow()) || null;
  if (!flow || typeof flowWalk !== "function") return [];
  return flowWalk(flow).map((id) => String(idVal(id))).filter(Boolean);
}

function pickScrollDriveCfgActive(walk, activeLine, scrollRatio) {
  if (!walk.length) return "";
  if (activeLine > 0) {
    let best = "";
    let bestDist = Infinity;
    for (let i = 0; i < walk.length; i++) {
      const ln = lineOfScrollDriveNode(walk[i]);
      if (!ln) continue;
      const d = Math.abs(ln - activeLine);
      if (d < bestDist) {
        bestDist = d;
        best = walk[i];
      }
    }
    // Loose match — harness pad lines often sit far from fixture spans.
    if (best && bestDist <= 48) return best;
  }
  const idx = Math.min(walk.length - 1, Math.max(0, Math.round(scrollRatio * (walk.length - 1))));
  return walk[idx] || "";
}

function clearScrollDriveCfgPaint() {
  if (!canvas) return;
  canvas
    .querySelectorAll(
      ".vnode.scroll-cfg-hot, .vnode.scroll-cfg-dim, .vnode.scroll-cfg-ahead, .vnode.scroll-cfg-sib, .vnode.scroll-cfg-if, .vnode.scroll-cfg-loop, .vnode.scroll-cfg-try, .vnode.scroll-cfg-nest-hot, .vnode.scroll-cfg-nest-anc, .vnode.scroll-cfg-nest-sib, .vnode[data-cfg-active], .vnode[data-cfg-span], .vnode[data-cfg-depth]"
    )
    .forEach((el) => {
      el.classList.remove(
        "scroll-cfg-hot",
        "scroll-cfg-dim",
        "scroll-cfg-ahead",
        "scroll-cfg-sib",
        "scroll-cfg-if",
        "scroll-cfg-loop",
        "scroll-cfg-try",
        "scroll-cfg-nest-hot",
        "scroll-cfg-nest-anc",
        "scroll-cfg-nest-sib"
      );
      el.removeAttribute("data-cfg-active");
      el.removeAttribute("data-cfg-span");
      el.removeAttribute("data-cfg-depth");
    });
}

/** Classify Evidence source text into if / loop / try (no Tree-sitter — S1d/S1i).
 *  Strip line/block comments so pad text like "loop body" is not a false hit. */
function classifyScrollDriveCfgSpanText(tx) {
  let s = String(tx || "");
  s = s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/.*$/, "");
  if (/\btry\b|\bcatch\b|\bfinally\b|\bexcept\b/.test(s)) return "try";
  if (/\bfor\b|\bwhile\b|\bloop\b/.test(s)) return "loop";
  if (/\belse\s+if\b|\bif\b|\belse\b/.test(s)) return "if";
  return "";
}

function scanScrollDriveCfgSpans() {
  if (!srcBody) return [];
  const lines = srcBody.querySelectorAll(".src-line");
  const hits = [];
  const stack = [];
  let depth = 0;
  let lastLn = 0;
  for (let i = 0; i < lines.length; i++) {
    const el = lines[i];
    const lnEl = el.querySelector(".ln");
    const txEl = el.querySelector(".tx");
    const ln = parseInt(lnEl && lnEl.textContent, 10);
    if (!Number.isFinite(ln)) continue;
    lastLn = ln;
    const tx = (txEl && txEl.textContent) || "";
    const kind = classifyScrollDriveCfgSpanText(tx);
    if (kind) {
      const sp = {
        kind: kind,
        line: ln,
        startLine: ln,
        endLine: ln,
        depth: depth,
        entered: false,
        brace: false,
      };
      hits.push(sp);
      stack.push(sp);
    }
    // Walk braces left→right so same-line bodies close correctly (S1i).
    let quote = "";
    for (let c = 0; c < tx.length; c++) {
      const ch = tx[c];
      if (quote) {
        if (ch === "\\") {
          c++;
          continue;
        }
        if (ch === quote) quote = "";
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        quote = ch;
        continue;
      }
      if (ch === "{") {
        depth++;
        if (stack.length && stack[stack.length - 1].depth === depth - 1) {
          stack[stack.length - 1].entered = true;
          stack[stack.length - 1].brace = true;
        }
      } else if (ch === "}") {
        depth = Math.max(0, depth - 1);
        while (stack.length && stack[stack.length - 1].entered && stack[stack.length - 1].depth === depth) {
          const done = stack.pop();
          done.endLine = ln;
        }
      }
    }
  }
  // Unclosed / brace-less spans: next keyword sibling, else short pad (S1d flat).
  for (let i = 0; i < hits.length; i++) {
    const sp = hits[i];
    if (sp.brace && sp.entered && sp.endLine >= sp.startLine && stack.indexOf(sp) < 0) continue;
    const next = hits[i + 1];
    if (next && next.depth <= sp.depth) {
      sp.endLine = Math.max(sp.startLine, next.startLine - 1);
    } else if (!sp.brace) {
      sp.endLine = sp.startLine + 8;
    } else {
      sp.endLine = Math.max(sp.endLine, lastLn || sp.startLine);
    }
  }
  while (stack.length) {
    const sp = stack.pop();
    sp.endLine = Math.max(sp.endLine, lastLn || sp.startLine);
  }
  assignScrollDriveCfgNestDepth(hits);
  return hits;
}

/** Nest depth from containment (brace depth preferred when present) — S1i. */
function assignScrollDriveCfgNestDepth(spans) {
  if (!spans || !spans.length) return spans;
  // Prefer brace-open depth when any span used braces; else containment.
  let anyBrace = false;
  for (let i = 0; i < spans.length; i++) {
    if (spans[i].brace) anyBrace = true;
  }
  if (anyBrace) {
    for (let i = 0; i < spans.length; i++) {
      spans[i].depth = Math.max(0, Number(spans[i].depth) || 0);
    }
  } else {
    for (let i = 0; i < spans.length; i++) spans[i].depth = 0;
  }
  // Containment refine — child strictly inside parent gets parent.depth+1 (IR/flat pads).
  const order = spans.slice().sort((a, b) => {
    const wa = a.endLine - a.startLine;
    const wb = b.endLine - b.startLine;
    if (wa !== wb) return wb - wa;
    return a.startLine - b.startLine;
  });
  for (let i = 0; i < order.length; i++) {
    const child = order[i];
    let best = anyBrace ? Number(child.depth) || 0 : 0;
    for (let j = 0; j < order.length; j++) {
      if (i === j) continue;
      const par = order[j];
      if (par.startLine <= child.startLine && par.endLine >= child.endLine) {
        const wider =
          par.startLine < child.startLine || par.endLine > child.endLine;
        if (!wider) continue;
        best = Math.max(best, (Number(par.depth) || 0) + 1);
      }
    }
    child.depth = best;
  }
  return spans;
}

/** Deepest span containing activeLine (S1i nest focus). */
function pickScrollDriveCfgNestFocus(spans, activeLine) {
  const line = Number(activeLine) || 0;
  if (!line || !spans || !spans.length) return null;
  let best = null;
  for (let i = 0; i < spans.length; i++) {
    const sp = spans[i];
    if (line < sp.startLine || line > sp.endLine) continue;
    if (
      !best ||
      (Number(sp.depth) || 0) > (Number(best.depth) || 0) ||
      ((Number(sp.depth) || 0) === (Number(best.depth) || 0) &&
        sp.endLine - sp.startLine < best.endLine - best.startLine)
    ) {
      best = sp;
    }
  }
  return best;
}

/** IR/fixture walk nesting — count containing sibling spans (S1i fallback). */
function irNestDepthScrollDriveWalk(walk) {
  const out = Object.create(null);
  if (!walk || !walk.length) return out;
  const spans = [];
  for (let i = 0; i < walk.length; i++) {
    const id = walk[i];
    const sp = spanLinesOfScrollDriveNode(id);
    if (!sp) continue;
    spans.push({ id: id, start: sp.start, end: sp.end });
  }
  for (let i = 0; i < spans.length; i++) {
    let d = 0;
    for (let j = 0; j < spans.length; j++) {
      if (i === j) continue;
      const a = spans[i];
      const b = spans[j];
      if (b.start <= a.start && b.end >= a.end && (b.start < a.start || b.end > a.end)) d++;
    }
    out[spans[i].id] = d;
  }
  return out;
}

function pickScrollDriveCfgSpanKind(spans, activeLine, activeId, kindById) {
  if (activeLine > 0 && spans.length) {
    for (let i = 0; i < spans.length; i++) {
      const sp = spans[i];
      if (activeLine >= sp.startLine && activeLine <= sp.endLine) return sp.kind;
    }
    let best = "";
    let bestDist = Infinity;
    for (let i = 0; i < spans.length; i++) {
      const sp = spans[i];
      const d = Math.abs(sp.line - activeLine);
      if (d < bestDist) {
        bestDist = d;
        best = sp.kind;
      }
    }
    if (best && bestDist <= 48) return best;
  }
  if (activeId && kindById && kindById[activeId]) return kindById[activeId];
  return (spans[0] && spans[0].kind) || "";
}

/** Map Steiner walk nodes → if/loop/try using Evidence spans (line match, else partition). */
function assignScrollDriveCfgSpanKinds(walk, spans) {
  const out = Object.create(null);
  if (!walk.length) return out;
  const kinds = [];
  const seen = Object.create(null);
  for (let i = 0; i < spans.length; i++) {
    const k = spans[i].kind;
    if (!seen[k]) {
      seen[k] = 1;
      kinds.push(k);
    }
  }
  if (!kinds.length) return out;
  for (let i = 0; i < walk.length; i++) {
    const id = walk[i];
    const ln = lineOfScrollDriveNode(id);
    let kind = "";
    if (ln > 0) {
      let best = "";
      let bestDist = Infinity;
      for (let j = 0; j < spans.length; j++) {
        const sp = spans[j];
        if (ln >= sp.startLine && ln <= sp.endLine) {
          kind = sp.kind;
          break;
        }
        const d = Math.abs(sp.line - ln);
        if (d < bestDist) {
          bestDist = d;
          best = sp.kind;
        }
      }
      if (!kind && best && bestDist <= 48) kind = best;
    }
    if (!kind) {
      // Stable partition when fixture spans sit far from padded Evidence lines.
      const bucket = Math.min(kinds.length - 1, Math.floor((i * kinds.length) / walk.length));
      kind = kinds[bucket];
    }
    out[id] = kind;
  }
  return out;
}

/** S1b + S1d + S1i — unroll Steiner CFG; glow active; if/loop/try; nest expand on activeLine.
 *  Idle Evidence (scrollRatio 0) must not dim CFG — Slice ego / select opacity
 *  gates (EG3d etc.) open Evidence without scrolling. */
function applyScrollDriveCfg(scrollRatio, activeLine) {
  const walk = scrollDriveCfgWalk();
  const unroll = Math.max(0, Math.min(1, Number(scrollRatio) || 0));
  const emptyCfg = {
    cfgActiveId: "",
    cfgUnroll: 0,
    cfgVisible: 0,
    cfgSpanKind: "",
    cfgSpanCount: 0,
    cfgNestDepth: 0,
    cfgNestMax: 0,
    cfgNestExpanded: 0,
  };
  if (unroll <= 0 || !walk.length) {
    clearScrollDriveCfgPaint();
    return emptyCfg;
  }
  const spans = scanScrollDriveCfgSpans();
  const kindById = assignScrollDriveCfgSpanKinds(walk, spans);
  const irNest = irNestDepthScrollDriveWalk(walk);
  const visible = 1 + Math.round(unroll * (walk.length - 1));
  const visibleWalk = walk.slice(0, Math.max(1, visible));
  const activeId = pickScrollDriveCfgActive(visibleWalk, activeLine, unroll);
  const nestFocus = pickScrollDriveCfgNestFocus(spans, activeLine);
  const cfgSpanKind =
    (nestFocus && nestFocus.kind) || pickScrollDriveCfgSpanKind(spans, activeLine, activeId, kindById);
  let cfgNestMax = 0;
  for (let i = 0; i < spans.length; i++) {
    cfgNestMax = Math.max(cfgNestMax, Number(spans[i].depth) || 0);
  }
  for (const id of walk) {
    cfgNestMax = Math.max(cfgNestMax, Number(irNest[id]) || 0);
  }
  const cfgNestDepth = nestFocus ? Number(nestFocus.depth) || 0 : 0;
  // Ancestors of nest focus stay expanded; same-depth siblings collapse (S1i).
  const expandedSpans = [];
  if (nestFocus) {
    for (let i = 0; i < spans.length; i++) {
      const sp = spans[i];
      if (sp.startLine <= nestFocus.startLine && sp.endLine >= nestFocus.endLine) {
        expandedSpans.push(sp);
      }
    }
  }
  const expandedSet = new Set(expandedSpans);
  const cfgNestExpanded = expandedSpans.length;
  const walkSet = new Set(walk);
  const visibleSet = new Set(visibleWalk);
  // Map walk node → nest role via its assigned Evidence span (kind+line) or IR depth.
  function nestRoleForId(id) {
    if (!nestFocus) return { role: "", depth: Number(irNest[id]) || 0 };
    const ln = lineOfScrollDriveNode(id);
    let hit = null;
    if (ln > 0) {
      for (let i = 0; i < spans.length; i++) {
        const sp = spans[i];
        if (ln >= sp.startLine && ln <= sp.endLine) {
          if (
            !hit ||
            (Number(sp.depth) || 0) > (Number(hit.depth) || 0) ||
            ((Number(sp.depth) || 0) === (Number(hit.depth) || 0) &&
              sp.endLine - sp.startLine < hit.endLine - hit.startLine)
          ) {
            hit = sp;
          }
        }
      }
    }
    // Fall back: kind partition match against nest focus / ancestors / siblings.
    if (!hit) {
      const kind = kindById[id] || "";
      for (let i = 0; i < spans.length; i++) {
        if (spans[i].kind === kind) {
          hit = spans[i];
          break;
        }
      }
    }
    const depth = hit ? Number(hit.depth) || 0 : Number(irNest[id]) || 0;
    if (hit && hit === nestFocus) return { role: "hot", depth: depth };
    if (hit && expandedSet.has(hit)) return { role: "anc", depth: depth };
    if (hit && nestFocus && (Number(hit.depth) || 0) === (Number(nestFocus.depth) || 0) && hit !== nestFocus) {
      return { role: "sib", depth: depth };
    }
    // Deeper than focus but not containing activeLine → collapse as sib.
    if (hit && nestFocus && (Number(hit.depth) || 0) > (Number(nestFocus.depth) || 0) && !expandedSet.has(hit)) {
      return { role: "sib", depth: depth };
    }
    return { role: "", depth: depth };
  }
  if (canvas) {
    canvas.querySelectorAll(".vnode").forEach((el) => {
      const id = el.getAttribute("data-id");
      if (!id || !walkSet.has(id)) {
        el.classList.remove(
          "scroll-cfg-hot",
          "scroll-cfg-dim",
          "scroll-cfg-ahead",
          "scroll-cfg-sib",
          "scroll-cfg-if",
          "scroll-cfg-loop",
          "scroll-cfg-try",
          "scroll-cfg-nest-hot",
          "scroll-cfg-nest-anc",
          "scroll-cfg-nest-sib"
        );
        el.removeAttribute("data-cfg-active");
        el.removeAttribute("data-cfg-span");
        el.removeAttribute("data-cfg-depth");
        return;
      }
      const spanKind = kindById[id] || "";
      const ahead = !visibleSet.has(id);
      const nest = nestRoleForId(id);
      const kindSib = !!(cfgSpanKind && spanKind && spanKind !== cfgSpanKind && nest.role !== "hot" && nest.role !== "anc");
      const nestSib = nest.role === "sib";
      const sib = kindSib || nestSib;
      const nestHot = nest.role === "hot";
      const nestAnc = nest.role === "anc";
      const hot = !!(activeId && id === activeId && !sib) || (nestHot && !ahead);
      el.classList.toggle("scroll-cfg-hot", hot);
      el.classList.toggle("scroll-cfg-ahead", ahead && !sib && !nestAnc);
      el.classList.toggle("scroll-cfg-sib", sib && !ahead);
      el.classList.toggle("scroll-cfg-dim", !hot && !ahead && !sib && !nestAnc);
      el.classList.toggle("scroll-cfg-if", spanKind === "if");
      el.classList.toggle("scroll-cfg-loop", spanKind === "loop");
      el.classList.toggle("scroll-cfg-try", spanKind === "try");
      el.classList.toggle("scroll-cfg-nest-hot", nestHot && !ahead);
      el.classList.toggle("scroll-cfg-nest-anc", nestAnc && !ahead && !nestHot);
      el.classList.toggle("scroll-cfg-nest-sib", nestSib && !ahead);
      if (spanKind) el.setAttribute("data-cfg-span", spanKind);
      else el.removeAttribute("data-cfg-span");
      el.setAttribute("data-cfg-depth", String(nest.depth || 0));
      if (hot) el.setAttribute("data-cfg-active", "1");
      else el.removeAttribute("data-cfg-active");
    });
  }
  return {
    cfgActiveId: activeId || "",
    cfgUnroll: unroll,
    cfgVisible: visible,
    cfgSpanKind: cfgSpanKind || "",
    cfgSpanCount: spans.length,
    cfgNestDepth: cfgNestDepth,
    cfgNestMax: cfgNestMax,
    cfgNestExpanded: cfgNestExpanded,
  };
}


/** S1e — map IR kind + EndpointMeta onto API / Database / Service / Utility anchors. */
function scrollDriveAnchorFromMeta(kind, ep, fqn) {
  const k = String(kind || "");
  const ch = ep && ep.channel ? String(ep.channel) : "";
  const role = ep && ep.role ? String(ep.role) : "";
  const name = String(fqn || "");
  // Endpoint channel is the richest signal (Http/Table/Queue/Channel/File).
  if (k === "Endpoint" || ep) {
    if (ch === "Http") return "api";
    if (ch === "Table" || ch === "File") return "db";
    if (ch === "Queue" || ch === "Channel") return "svc";
    if (role === "Source") return "api";
    if (role === "Sink") return "db";
    return "api";
  }
  if (k === "Type") return "svc";
  // Function (default Utility) — light FQN heuristics only when names are obvious.
  if (/\b(db|store|repo|sql|persist|cache)\b/i.test(name)) return "db";
  if (/\b(api|http|rpc|handler|route)\b/i.test(name)) return "api";
  if (/\b(service|svc|client|adapter)\b/i.test(name)) return "svc";
  return "util";
}

function scrollDriveAnchorOf(id, el) {
  const nid = idVal(id);
  const kind =
    (el && el.getAttribute && el.getAttribute("data-kind")) ||
    (typeof kindOf === "function" ? kindOf(snapshot && snapshot.graph, nid) : "") ||
    "Function";
  const ep = typeof endpointOf === "function" ? endpointOf(nid) : null;
  const fqn = typeof fqnOf === "function" ? fqnOf(snapshot && snapshot.graph, nid) : "";
  return scrollDriveAnchorFromMeta(kind, ep, fqn);
}

function clearScrollDriveAnchorPaint() {
  if (!canvas) return;
  canvas
    .querySelectorAll(
      ".vnode[data-scroll-anchor], .vnode.scroll-anchor-api, .vnode.scroll-anchor-db, .vnode.scroll-anchor-svc, .vnode.scroll-anchor-util"
    )
    .forEach((el) => {
      el.classList.remove("scroll-anchor-api", "scroll-anchor-db", "scroll-anchor-svc", "scroll-anchor-util");
      el.removeAttribute("data-scroll-anchor");
    });
}

/** S1e — stamp color-coded kind anchors on painted nodes (no extra labels / clutter). */
function applyScrollDriveAnchors(targetNodeId) {
  const counts = { api: 0, db: 0, svc: 0, util: 0 };
  let focus = "";
  if (!canvas) return { anchorFocus: "", anchorCounts: counts };
  canvas.querySelectorAll(".vnode[data-id]").forEach((el) => {
    const id = el.getAttribute("data-id");
    if (!id) return;
    const bucket = scrollDriveAnchorOf(id, el);
    el.classList.remove("scroll-anchor-api", "scroll-anchor-db", "scroll-anchor-svc", "scroll-anchor-util");
    if (bucket && counts[bucket] != null) {
      counts[bucket] += 1;
      el.setAttribute("data-scroll-anchor", bucket);
      el.classList.add("scroll-anchor-" + bucket);
      if (targetNodeId && id === String(targetNodeId)) focus = bucket;
    } else {
      el.removeAttribute("data-scroll-anchor");
    }
  });
  if (!focus && targetNodeId) focus = scrollDriveAnchorOf(targetNodeId, findScrollDriveTargetEl(targetNodeId)) || "";
  return { anchorFocus: focus || "", anchorCounts: counts };
}


/** S1f — hide deep clutter until scroll/mouse focus approaches the block.
 *  Macro LOD or far from focus → detailNear false (overview clean).
 *  Near focus (cfg unroll / activeLine / anchorFocus) → reveal with CSS opacity. */
function wantScrollDriveDetailNear(macro, scrollRatio, activeLine, cfg, anchors) {
  if (macro) return false;
  const unroll = Number(cfg && cfg.cfgUnroll) || 0;
  const visible = Number(cfg && cfg.cfgVisible) || 0;
  const ratio = Number(scrollRatio) || 0;
  const line = Number(activeLine) || 0;
  const focus = !!(anchors && anchors.anchorFocus);
  // Mid-file micro focus — unroll / visible CFG / active line / kind-anchor focus.
  if (visible >= 2 || unroll > 0.35) return true;
  if (ratio > 0.25 && (line > 0 || focus)) return true;
  return false;
}

function clearScrollDriveDetailPaint() {
  const vp = viewportEl || (canvas && canvas.querySelector(".viewport"));
  if (vp) vp.removeAttribute("data-scroll-detail");
}

/** S1f — gate viewport data-scroll-detail from ScrollDrive proximity. */
function applyScrollDriveDetailGate(macro, scrollRatio, activeLine, cfg, anchors) {
  const near = wantScrollDriveDetailNear(macro, scrollRatio, activeLine, cfg, anchors);
  const vp = viewportEl || (canvas && canvas.querySelector(".viewport"));
  if (vp) {
    const v = near ? "1" : "0";
    if (vp.getAttribute("data-scroll-detail") !== v) vp.setAttribute("data-scroll-detail", v);
  }
  return { detailNear: near };
}

let scrollDriveMacroTimer = 0;
let scrollDriveEaseTimer = 0;
/** S1l — coalesce #srcBody scroll into one rAF flush per frame. */
let scrollDriveRaf = 0;
let scrollDriveRafPending = 0;
let scrollDriveRafFlushes = 0;
let scrollDriveRafMerged = 0;

function refreshScrollDriveCamEase() {
  if (!srcBody || !sourcePane || sourcePane.hidden || !scrollDriveBase) {
    setCamEase(CAM_EASE_BASE);
    return camEase;
  }
  const v = readScrollDriveVelocity();
  const reduced = typeof reduceMotion === "function" && reduceMotion();
  if (reduced) setCamEase(CAM_EASE_SNAP);
  else setCamEase(scrollDriveEaseFromVel(v));
  const blend = applyScrollDriveBlendPaint(camEase);
  if (window.__graphideScrollDrive) {
    window.__graphideScrollDrive.camEase = camEase;
    window.__graphideScrollDrive.scrollVel = v;
    window.__graphideScrollDrive.blendMs = blend.blendMs;
    window.__graphideScrollDrive.reducedMotion = !!reduced;
  }
  return camEase;
}

function scheduleScrollDriveEaseSettle() {
  // S1k — no velocity settle loop when the user asked for reduced motion.
  if (typeof reduceMotion === "function" && reduceMotion()) return;
  if (scrollDriveEaseTimer) clearTimeout(scrollDriveEaseTimer);
  scrollDriveEaseTimer = setTimeout(() => {
    scrollDriveEaseTimer = 0;
    if (!srcBody || !sourcePane || sourcePane.hidden) return;
    refreshScrollDriveCamEase();
    // Keep settling until velocity ages out (snappy camEase).
    if (readScrollDriveVelocity() > 0.08) {
      scheduleScrollDriveEaseSettle();
    } else {
      // S1r / S1s — idle settle: fold soft camX/camY into scrollDriveBase (no second RAF).
      absorbScrollDriveSoftCamX();
      absorbScrollDriveSoftCamY();
      if (window.__graphideScrollDrive) {
        window.__graphideScrollDrive.camXSettled = !!scrollDriveCamXSettled;
        window.__graphideScrollDrive.camYSettled = !!scrollDriveCamYSettled;
        window.__graphideScrollDrive.camX = camTo.x;
        window.__graphideScrollDrive.camY = camTo.y;
      }
    }
  }, 160);
}

function cancelScrollDriveRaf() {
  if (scrollDriveRaf) {
    cancelAnimationFrame(scrollDriveRaf);
    scrollDriveRaf = 0;
  }
  scrollDriveRafPending = 0;
}

/** S1l — one paint/publish per animation frame; burst scrolls merge into rafMerged. */
function scheduleScrollDriveFlush() {
  scrollDriveRafPending += 1;
  if (scrollDriveRaf) return;
  scrollDriveRaf = requestAnimationFrame(() => {
    scrollDriveRaf = 0;
    const pending = scrollDriveRafPending;
    scrollDriveRafPending = 0;
    const merged = Math.max(0, pending - 1);
    scrollDriveRafMerged += merged;
    scrollDriveRafFlushes += 1;
    flushScrollDrive();
  });
}

function flushScrollDrive() {
  // S1m — Presentation Stage owns the camera; do not paint or setCamTarget.
  if (typeof isPresenting === "function" && isPresenting()) {
    if (scrollDriveMacroTimer) {
      clearTimeout(scrollDriveMacroTimer);
      scrollDriveMacroTimer = 0;
    }
    if (scrollDriveEaseTimer) {
      clearTimeout(scrollDriveEaseTimer);
      scrollDriveEaseTimer = 0;
    }
    cancelScrollDriveRaf();
    // S1w/S1ad — stash before Present flush wipe when Evidence stay was still live.
    if (typeof stashScrollDriveLastStay === "function") stashScrollDriveLastStay();
    // S1ai — Present-stash and Review-clear cues mutually exclusive.
    if (typeof clearScrollDriveReviewStayClearedCue === "function") {
      clearScrollDriveReviewStayClearedCue();
    } else {
      scrollDriveReviewStayCleared = false;
    }
    const stayStashed = !!(scrollDriveLastStay && scrollDriveLastStay.sourceId);
    scrollDriveBase = null;
    scrollDriveTargetLocked = "";
    scrollDriveCamXSettled = false;
    scrollDriveCamYSettled = false;
    scrollDriveYNudgeOrigin = 0;
    scrollDriveWasMacro = false;
    scrollDriveVel = { t: 0, top: 0, vel: 0 };
    scrollDriveJustRestored = false;
  scrollDriveSuppressNextRefit = false;
    setCamEase(CAM_EASE_BASE);
    clearScrollDriveCfgPaint();
    clearScrollDriveLineMapPaint();
    clearScrollDriveActiveLinePaint();
    clearScrollDriveMacroPaint();
    clearScrollDriveAnchorPaint();
    clearScrollDriveDetailPaint();
    clearScrollDriveBlendPaint();
    const vp = viewportEl || (canvas && canvas.querySelector(".viewport"));
    if (vp) {
      vp.setAttribute("data-scroll-present-paused", "1");
      if (stayStashed) vp.setAttribute("data-scroll-present-stay", "1");
      else vp.removeAttribute("data-scroll-present-stay");
    }
    const paused = emptyScrollDrive();
    paused.presentPaused = true;
    paused.presentStayStashed = !!stayStashed;
    // S1ai — never publish Review-clear alongside Present-stash honesty.
    paused.reviewStayCleared = false;
    publishScrollDrive(paused);
    return;
  }
  if (!srcBody || !sourcePane || sourcePane.hidden) {
    if (scrollDriveMacroTimer) {
      clearTimeout(scrollDriveMacroTimer);
      scrollDriveMacroTimer = 0;
    }
    if (scrollDriveEaseTimer) {
      clearTimeout(scrollDriveEaseTimer);
      scrollDriveEaseTimer = 0;
    }
    cancelScrollDriveRaf();
    resetScrollDrive();
    return;
  }
  const maxScroll = srcBody.scrollHeight - srcBody.clientHeight;
  const canScroll = maxScroll > 8;
  const max = Math.max(1, maxScroll);
  const scrollRatio = Math.max(0, Math.min(1, srcBody.scrollTop / max));
  const activeLine = readSrcActiveLine();
  // S1h: map activeLine → IR/fixture span owner; fall back to Evidence sourceId.
  const lineMap = resolveScrollDriveTargetNode(activeLine);
  const targetNodeId = lineMap.targetNodeId || (sourceId ? String(sourceId) : "");
  const lineMapHit = !!lineMap.lineMapHit;
  noteScrollDriveVelocity(srcBody.scrollTop);
  const scrollVel = readScrollDriveVelocity();
  const reduced = typeof reduceMotion === "function" && reduceMotion();
  // S1k — reduced-motion: snap camEase; skip velocity settle timers (setCamTarget already jumps).
  if (reduced) {
    setCamEase(CAM_EASE_SNAP);
  } else {
    setCamEase(scrollDriveEaseFromVel(scrollVel));
    if (scrollVel > 0.05) {
      // Active scroll — settle flags clear until S1r/S1s absorb on idle.
      scrollDriveCamXSettled = false;
      scrollDriveCamYSettled = false;
      scheduleScrollDriveEaseSettle();
    }
  }
  const macro = wantScrollDriveMacro(scrollRatio, scrollVel, canScroll);
  const enteringMacro = !!(macro && !scrollDriveWasMacro);
  const exitingMacro = !!(!macro && scrollDriveWasMacro);
  let cfg = { cfgActiveId: "", cfgUnroll: 0, cfgVisible: 0, cfgSpanKind: "", cfgSpanCount: 0, cfgNestDepth: 0, cfgNestMax: 0, cfgNestExpanded: 0 };
  if (macro) {
    // S1c — overview LOD; clear micro CFG so paint does not fight.
    // S1u — pass entering so mid soft-stay eases into overview (no zoomToEl yank).
    clearScrollDriveCfgPaint();
    applyScrollDriveMacro(scrollRatio, targetNodeId, { entering: enteringMacro });
    // Velocity-driven macro must re-enter when the flick ages out (mid-file → S1b).
    if (scrollRatio > SCROLL_MACRO_RATIO) {
      if (scrollDriveMacroTimer) clearTimeout(scrollDriveMacroTimer);
      scrollDriveMacroTimer = setTimeout(() => {
        scrollDriveMacroTimer = 0;
        if (srcBody && sourcePane && !sourcePane.hidden) onSrcBodyScroll();
      }, 220);
    }
  } else {
    if (scrollDriveMacroTimer) {
      clearTimeout(scrollDriveMacroTimer);
      scrollDriveMacroTimer = 0;
    }
    clearScrollDriveMacroPaint();
    // S1u — macro→micro: re-seed X/Y from live camTo then resume S1q soft follow
    // (S1t-style). Keep micro base.k so camK eases back (no overview stick / zoomToEl).
    if (exitingMacro && scrollDriveBase) {
      if (Number.isFinite(camTo.x)) scrollDriveBase.x = camTo.x;
      if (Number.isFinite(camTo.y)) scrollDriveBase.y = camTo.y;
      scrollDriveYNudgeOrigin = Number(scrollRatio) || 0;
      scrollDriveCamXSettled = false;
      scrollDriveCamYSettled = false;
    }
    applyScrollDriveCamera(scrollRatio, targetNodeId);
    cfg = applyScrollDriveCfg(scrollRatio, activeLine);
    // S1r / S1s — low scrollVel / idle path (no settle timer scheduled): absorb soft cam.
    if (!reduced && scrollVel <= 0.05) {
      absorbScrollDriveSoftCamX();
      absorbScrollDriveSoftCamY();
    }
  }
  scrollDriveWasMacro = !!macro;
  const anchors = applyScrollDriveAnchors(targetNodeId);
  const detail = applyScrollDriveDetailGate(macro, scrollRatio, activeLine, cfg, anchors);
  const blend = applyScrollDriveBlendPaint(camEase);
  const lineGlow = applyScrollDriveLineMapGlow(lineMapHit, targetNodeId);
  const lineCue = applyScrollDriveActiveLine(activeLine);
  publishScrollDrive({
    scrollRatio: scrollRatio,
    activeLine: activeLine,
    targetNodeId: targetNodeId,
    lineMapHit: lineMapHit,
    lineMapPulse: !!lineGlow.lineMapPulse,
    activeLineMarked: !!lineCue.activeLineMarked,
    camX: camTo.x,
    camY: camTo.y,
    camK: camTo.k,
    cfgActiveId: cfg.cfgActiveId,
    cfgUnroll: cfg.cfgUnroll,
    cfgVisible: cfg.cfgVisible,
    cfgSpanKind: cfg.cfgSpanKind || "",
    cfgSpanCount: Number(cfg.cfgSpanCount) || 0,
    cfgNestDepth: Number(cfg.cfgNestDepth) || 0,
    cfgNestMax: Number(cfg.cfgNestMax) || 0,
    cfgNestExpanded: Number(cfg.cfgNestExpanded) || 0,
    scrollVel: scrollVel,
    camEase: camEase,
    blendMs: blend.blendMs,
    macroLod: !!macro,
    anchorFocus: anchors.anchorFocus || "",
    anchorCounts: anchors.anchorCounts || { api: 0, db: 0, svc: 0, util: 0 },
    detailNear: !!detail.detailNear,
    reducedMotion: !!reduced,
    rafCoalesce: true,
    rafFlushes: scrollDriveRafFlushes,
    rafMerged: scrollDriveRafMerged,
    presentPaused: false,
    presentStayStashed: false,
    reviewStayCleared: !!scrollDriveReviewStayCleared,
    camXSettled: !!scrollDriveCamXSettled,
    camYSettled: !!scrollDriveCamYSettled,
  });
}

/** Scroll listener + direct callers — S1l schedules; closed pane resets sync. */
function onSrcBodyScroll() {
  if (!srcBody || !sourcePane || sourcePane.hidden) {
    if (scrollDriveMacroTimer) {
      clearTimeout(scrollDriveMacroTimer);
      scrollDriveMacroTimer = 0;
    }
    if (scrollDriveEaseTimer) {
      clearTimeout(scrollDriveEaseTimer);
      scrollDriveEaseTimer = 0;
    }
    cancelScrollDriveRaf();
    resetScrollDrive();
    return;
  }
  scheduleScrollDriveFlush();
}

if (srcBody) srcBody.addEventListener("scroll", onSrcBodyScroll, { passive: true });
publishScrollDrive(emptyScrollDrive());
if (graphSearch) {
  graphSearch.addEventListener("focus", () => {
    if (typeof hideTip === "function") hideTip();
    if (toastEl) {
      toastEl.classList.remove("on");
      toastEl.hidden = true;
    }
  });
  graphSearch.addEventListener("input", () => {
    graphFilter.q = graphSearch.value.trim();
    refreshExplorer();
  });
}
if (kindFilters)
  kindFilters.querySelectorAll("input").forEach((el) => {
    el.addEventListener("change", () => {
      graphFilter.kinds[el.getAttribute("data-kind")] = el.checked;
      syncKindPills();
      refreshExplorer();
    });
  });
syncKindPills();
if (keysBtn) keysBtn.onclick = () => setKeysPane(!(keysPane && !keysPane.hidden));
if (keysClose) keysClose.onclick = () => setKeysPane(false);
if (exportBtn) exportBtn.onclick = () => setExportMenu(!(exportMenu && !exportMenu.hidden));
if (exportClose) exportClose.onclick = () => setExportMenu(false);
const exportCopyPng = document.getElementById("exportCopyPng");
const exportPng = document.getElementById("exportPng");
const exportSvg = document.getElementById("exportSvg");
const exportCopyShare = document.getElementById("exportCopyShare");
const exportShare = document.getElementById("exportShare");
if (exportCopyPng) exportCopyPng.onclick = () => runExport("copy-png");
if (exportPng) exportPng.onclick = () => runExport("png");
if (exportSvg) exportSvg.onclick = () => runExport("svg");
if (exportCopyShare) exportCopyShare.onclick = () => runExport("copy-share");
if (exportShare) exportShare.onclick = () => runExport("share");
const exportRouteShare = document.getElementById("exportRouteShare");
if (exportRouteShare) exportRouteShare.onclick = () => runExport("route-share");
if (pathBtn) pathBtn.onclick = () => toggleRoute();
if (lensBtn) lensBtn.onclick = () => toggleLens();
if (workspacesEl) {
  workspacesEl.querySelectorAll("[data-ws]").forEach((el) => {
    el.onclick = () => {
      el.classList.add("press");
      window.setTimeout(() => el.classList.remove("press"), 160);
      setWorkspace(el.getAttribute("data-ws"), true);
    };
  });
}
if (egoBtn) egoBtn.onclick = () => setEgoMode(!egoMode);
reorgBtns.forEach((el) => {
  el.onclick = () => autoReorganize();
});
if (egoHopsEl)
  egoHopsEl.addEventListener("change", () => {
    const n = parseInt(egoHopsEl.value, 10);
    egoHops = n === 2 ? 2 : 1;
    if (explorerWs === "lineage" || explorerWs === "slice" || explorerWs === "overview" || enterCanvasActive()) {
      // S1bw — ego-hops remount while Evidence open: keepCam + soft-stay (no wipe-then-zoom).
      const evidenceStay =
        typeof evidenceScrollDriveStayLive === "function" && evidenceScrollDriveStayLive();
      if (evidenceStay && scrollDriveBase && typeof stashScrollDriveLastStay === "function") {
        stashScrollDriveLastStay();
      }
      if (evidenceStay && typeof stageFitRo !== "undefined" && stageFitRo) {
        stageFitRo.disconnect();
        stageFitRo = null;
      }
      paint({ animate: "none", keepCam: !!evidenceStay });
      if (evidenceStay && typeof softStayScrollDriveAcrossDeskRemount === "function") {
        softStayScrollDriveAcrossDeskRemount();
      }
      return;
    }
    applyEgoPaint();
  });
if (stampBtn) stampBtn.onclick = () => requestStamp();
if (skipBtn) skipBtn.onclick = () => requestSkip();
if (llmBtn) llmBtn.onclick = () => toggleLlmPane();
if (llmClose) llmClose.onclick = () => setLlmPane(false);
if (llmPreset)
  llmPreset.onchange = () => {
    const p = LLM_PRESETS[llmPreset.value] || LLM_PRESETS.custom;
    if (p.url && llmBaseUrl) llmBaseUrl.value = p.url;
    if (p.model && llmModel) llmModel.value = p.model;
  };
if (llmSave)
  llmSave.onclick = () => {
    vscode.postMessage({
      type: "llmSave",
      baseUrl: llmBaseUrl ? llmBaseUrl.value : "",
      model: llmModel ? llmModel.value : "",
      apiKey: llmKey ? llmKey.value : "",
    });
    appendLlmLog("Saved host " + ((llmBaseUrl && llmBaseUrl.value) || "(empty)") + " · " + ((llmModel && llmModel.value) || "graph-only"), "ok");
  };
if (llmTest) llmTest.onclick = () => vscode.postMessage({ type: "llmTest" });
if (llmShowKey) llmShowKey.onclick = () => vscode.postMessage({ type: "llmShowKey" });
if (llmSend) llmSend.onclick = () => sendLlmAsk();
if (llmAsk)
  llmAsk.addEventListener("keydown", (e) => {
    if (e.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendLlmAsk();
    }
  });
if (llmBaseUrl && !llmBaseUrl.value) llmBaseUrl.value = "http://127.0.0.1:11434/v1";

function startReview() {
  // S1ac — new Review drops stale last-stay (memory + scoped storage) so the next
  // Evidence open does not soft-restore a previous review's cam.
  if (typeof clearScrollDriveLastStayOnReviewRestart === "function") {
    clearScrollDriveLastStayOnReviewRestart();
  }
  cancelling = false;
  pendingProgress = null;
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
  if (msg.type === "appearance") {
    applyTheme(msg.mode === "night" ? "night" : "day", false);
    return;
  }
  if (msg.type === "empty") {
    // S1ac — desk clear: close Evidence first (may attempt stash), then wipe stay so
    // a prior review cam cannot soft-restore. Leaves other folders' scoped keys alone.
    if (sourcePane && !sourcePane.hidden && typeof closeSourcePane === "function") closeSourcePane();
    if (typeof clearScrollDriveLastStayOnReviewRestart === "function") clearScrollDriveLastStayOnReviewRestart();
    else if (typeof clearScrollDriveLastStay === "function") clearScrollDriveLastStay();
    // S1ab — leaving analysis / no folder: drop workspace scope after stay wipe.
    if (typeof setScrollDriveWorkspaceKey === "function") setScrollDriveWorkspaceKey("");
    stopPathWalk();
    snapshot = null;
    finishWork();
    backBtn.disabled = true;
    canvas.className = "";
    unmountSequenceCanvas();
    canvas.innerHTML =
      '<div class="empty desk-empty"><b>Review any repo.</b><div>Open a workspace, optionally type <code>name=hit,hit</code>, then Review.</div><div class="desk-keys"><kbd>S</kbd> stamp · <kbd>X</kbd> skip · <kbd>P</kbd> play · <kbd>/</kbd> find</div></div>';
    setDeskMode(false);
    refreshNowPill();
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
    unmountSequenceCanvas();
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
  if (msg.type === "patch") {
    applyPatch(msg);
    return;
  }
  if (msg.type === "cancelled") {
    clearTimeout(previewTimer);
    finishWork();
    // S1bz — cancelled remount while Evidence open: keepCam + soft-stay (no wipe-then-zoom).
    if (snapshot) {
      const evidenceStay =
        typeof evidenceScrollDriveStayLive === "function" && evidenceScrollDriveStayLive();
      if (evidenceStay && scrollDriveBase && typeof stashScrollDriveLastStay === "function") {
        stashScrollDriveLastStay();
      }
      if (evidenceStay && typeof stageFitRo !== "undefined" && stageFitRo) {
        stageFitRo.disconnect();
        stageFitRo = null;
      }
      paint({ animate: "none", keepCam: !!evidenceStay });
      if (evidenceStay && typeof softStayScrollDriveAcrossDeskRemount === "function") {
        softStayScrollDriveAcrossDeskRemount();
      }
    }
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
    unmountSequenceCanvas();
    canvas.innerHTML = '<div class="empty error">' + esc(msg.text) + "</div>";
    status.textContent = "failed";
    setZoomUi(false);
    hideTip();
    return;
  }
  if (msg.type === "source") {
    showSource(msg, { fromHost: true });
    return;
  }
  if (msg.type === "programs") {
    if (msg.workspaceFolder != null || msg.workspaceRoot != null || msg.ws != null) {
      if (typeof setScrollDriveWorkspaceKey === "function") {
        setScrollDriveWorkspaceKey(
          msg.workspaceFolder != null ? msg.workspaceFolder : msg.workspaceRoot != null ? msg.workspaceRoot : msg.ws
        );
      }
    }
    clearTimeout(previewTimer);
    applyPrograms(msg);
    return;
  }
  if (msg.type === "flowchart" || msg.type === "inner") {
    if (msg.workspaceFolder != null || msg.workspaceRoot != null || msg.ws != null) {
      if (typeof setScrollDriveWorkspaceKey === "function") {
        setScrollDriveWorkspaceKey(
          msg.workspaceFolder != null ? msg.workspaceFolder : msg.workspaceRoot != null ? msg.workspaceRoot : msg.ws
        );
      }
    }
    clearTimeout(previewTimer);
    applySnapshot(msg, msg.type === "inner");
  }
  if (msg.type === "llmStatus") {
    applyLlmStatus(msg);
    return;
  }
  if (msg.type === "llmReply") {
    llmTok++;
    const text = String(msg.text || "").trim() || localAsk(msg.prompt || "");
    if (text) appendLlmLog(text, msg.via === "graph" || !String(msg.text || "").trim() ? "graph" : "llm");
    return;
  }
  if (msg.type === "llmError") {
    llmTok++;
    appendLlmLog(msg.text || "LLM error", "err");
  }
});

function mapStageMounted() {
  if (!canvas || !canvas.classList.contains("programs-view")) return false;
  const stage = canvas.querySelector(".stage");
  const viewport = stage && stage.querySelector(".viewport");
  return !!(viewport && viewport.querySelector(".comm-wrap"));
}

function sliceStageMounted() {
  if (!canvas || !canvas.classList.contains("has-stage")) return false;
  const stage = canvas.querySelector(".stage");
  const viewport = stage && stage.querySelector(".viewport");
  return !!(viewport && document.getElementById("sliceCanvas"));
}

function enterStageMounted() {
  if (!canvas || !canvas.classList.contains("has-stage")) return false;
  const stage = canvas.querySelector(".stage");
  const viewport = stage && stage.querySelector(".viewport");
  return !!(viewport && document.getElementById("enterCanvas"));
}

function patchSnapshotFields(msg, opts) {
  opts = opts || {};
  if (!snapshot) return false;
  if (msg.flows && msg.flows.length) {
    snapshot.flows = msg.flows;
    snapshot.flow =
      msg.flow ||
      snapshot.flows.find((f) => f.name === flowName) ||
      snapshot.flows[0] ||
      snapshot.flow;
  } else if (msg.flow) {
    snapshot.flow = msg.flow;
  }
  if (msg.graph && (msg.graph.nodes || []).length) snapshot.graph = msg.graph;
  if (msg.bubbles && msg.bubbles.length) snapshot.bubbles = msg.bubbles;
  if (msg.coverage) snapshot.coverage = msg.coverage;
  if (msg.findings) snapshot.findings = msg.findings;
  if (msg.plugin) snapshot.plugin = msg.plugin;
  if (msg.stats) snapshot.stats = Object.assign({}, snapshot.stats, msg.stats);
  if (msg.nodes != null || msg.edges != null || msg.elapsed_ms != null) {
    snapshot.stats = Object.assign({}, snapshot.stats, {
      nodes: msg.nodes != null ? msg.nodes : snapshot.stats && snapshot.stats.nodes,
      edges: msg.edges != null ? msg.edges : snapshot.stats && snapshot.stats.edges,
      elapsed_ms: msg.elapsed_ms != null ? msg.elapsed_ms : snapshot.stats && snapshot.stats.elapsed_ms,
    });
  }
  if (msg.stamps) snapshot.stamps = msg.stamps;
  if (msg.skipped) snapshot.skipped = msg.skipped;
  if (msg.programs) snapshot.programs = msg.programs;
  if (msg.delta) snapshot.delta = msg.delta;
  if (msg.program) snapshot.program = msg.program;
  if (msg.snippets) snapshot.snippets = msg.snippets;
  if (opts.preview != null) snapshot.preview = !!opts.preview;
  if (msg.flow && msg.flow.name) flowName = msg.flow.name;
  else if (!flowName && snapshot.flows && snapshot.flows[0]) flowName = snapshot.flows[0].name;
  if (opts.reindex !== false) indexGraph(snapshot.graph);
  return true;
}

function panelOnlyPatch(msg) {
  if (!msg) return false;
  if (msg.graph && (msg.graph.nodes || []).length) return false;
  if (msg.bubbles && msg.bubbles.length) return false;
  if (msg.flows && msg.flows.length) return false;
  if (msg.flow) return false;
  if (msg.programs && msg.programs.length) return false;
  if (msg.delta) return false;
  if (msg.snippets) return false;
  if (msg.inner) return false;
  if (msg.program) return false;
  return !!(
    msg.coverage ||
    msg.findings ||
    msg.stats ||
    msg.stamps ||
    msg.skipped ||
    msg.plugin ||
    msg.nodes != null ||
    msg.edges != null ||
    msg.elapsed_ms != null
  );
}

const PANEL_BUDGET_MS = 8;
const PANEL_FAT_FINDINGS = 48;

function panelNow() {
  return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
}

function panelOverBudget(opts) {
  return !!(opts && opts.budgetMs != null && panelNow() - opts.startedAt > opts.budgetMs);
}

function markPanelShed(on) {
  if (!coverage) return;
  if (on) coverage.setAttribute("data-panel", "shed");
  else coverage.removeAttribute("data-panel");
}

function queuePanelRefresh() {
  if (panelRaf) return;
  panelRaf = requestAnimationFrame(flushPanelRefresh);
}

function queueOffviewSync() {
  if (offviewRaf) return;
  offviewRaf = requestAnimationFrame(syncOffviewCards);
}

function syncOffviewCards() {
  offviewRaf = 0;
  if (!mapStageMounted()) return;
  const stage = canvas.querySelector(".stage");
  const wrap = canvas.querySelector(".comm-wrap");
  if (!stage || !wrap) return;
  const stageBox = stage.getBoundingClientRect();
  if (stageBox.width < 8 || stageBox.height < 8) return;
  const wrapBox = wrap.getBoundingClientRect();
  const wrapW = wrap.offsetWidth || parseFloat(wrap.style.width) || 1;
  const wrapH = wrap.offsetHeight || parseFloat(wrap.style.height) || 1;
  const sx = wrapBox.width / wrapW;
  const sy = wrapBox.height / wrapH;
  if (!Number.isFinite(sx) || !Number.isFinite(sy) || sx <= 0 || sy <= 0) return;
  const slack = 48;
  const hw = 110 * sx;
  const hh = 45 * sy;
  const left = stageBox.left - slack;
  const right = stageBox.right + slack;
  const top = stageBox.top - slack;
  const bottom = stageBox.bottom + slack;
  wrap.querySelectorAll(".bubble-card[data-bubble]").forEach((el) => {
    const cx = wrapBox.left + (parseFloat(el.style.left) || 0) * sx;
    const cy = wrapBox.top + (parseFloat(el.style.top) || 0) * sy;
    const off = cx + hw < left || cx - hw > right || cy + hh < top || cy - hh > bottom;
    if (off) {
      if (el.getAttribute("data-offview") !== "1") el.setAttribute("data-offview", "1");
    } else if (el.hasAttribute("data-offview")) {
      el.removeAttribute("data-offview");
    }
  });
}

function flushPanelRefresh() {
  panelRaf = 0;
  if (!snapshot) return;
  const startedAt = panelNow();
  renderStats(snapshot);
  renderCoverage(snapshot.coverage, snapshot.findings, snapshot.graph, {
    budgetMs: PANEL_BUDGET_MS,
    startedAt,
  });
}

function applyPatch(msg) {
  if (!snapshot) return;
  const panelOnly = panelOnlyPatch(msg);
  patchSnapshotFields(msg, { reindex: !panelOnly });
  if (msg.stamps) stampRows = snapshot.stamps || stampRows;
  if (msg.skipped) skippedFlows = snapshot.skipped || skippedFlows;
  if (panelOnly && mapStageMounted()) {
    queuePanelRefresh();
    consumeHarnessActions();
    return;
  }
  // S1by — host patch remount while Evidence open: keepCam + soft-stay (vnode rebuild).
  const evidenceStay =
    typeof evidenceScrollDriveStayLive === "function" && evidenceScrollDriveStayLive();
  if (evidenceStay && scrollDriveBase && typeof stashScrollDriveLastStay === "function") {
    stashScrollDriveLastStay();
  }
  if (evidenceStay && typeof stageFitRo !== "undefined" && stageFitRo) {
    stageFitRo.disconnect();
    stageFitRo = null;
  }
  paint({
    animate: "none",
    keepCam: evidenceStay || mapStageMounted() || !!canvas.querySelector(".stage"),
  });
  if (evidenceStay && typeof softStayScrollDriveAcrossDeskRemount === "function") {
    softStayScrollDriveAcrossDeskRemount();
  }
}

function applyPreview(msg) {
  if (!busy) return;
  const keep = mapStageMounted() && snapshot;
  const flows = (msg.flows || []).map((f) => ({
    ...f,
    flowchart: { runs: [], spine: [], positions: [] },
  }));
  if (keep) {
    if (msg.graph && (msg.graph.nodes || []).length) snapshot.graph = msg.graph;
    if (msg.plugin) snapshot.plugin = msg.plugin;
    snapshot.stats = Object.assign({}, snapshot.stats, {
      elapsed_ms: msg.elapsed_ms,
      nodes: msg.nodes,
      edges: msg.edges,
    });
    snapshot.preview = true;
    if (flows.length && !(snapshot.flows || []).length) {
      snapshot.flows = flows;
      snapshot.flow = flows.find((f) => f.name === flowName) || flows[0];
    }
    if (!flowName && flows[0]) flowName = flows[0].name;
    indexGraph(snapshot.graph);
    paint({ animate: "none", preview: true, keepCam: true });
    return;
  }
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
  const keep = mapStageMounted() && snapshot;
  if (keep) {
    if (msg.flows) snapshot.flows = msg.flows;
    if (msg.graph) snapshot.graph = msg.graph;
    if (msg.bubbles) snapshot.bubbles = msg.bubbles;
    if (msg.coverage) snapshot.coverage = msg.coverage;
    if (msg.findings) snapshot.findings = msg.findings;
    if (msg.plugin) snapshot.plugin = msg.plugin;
    if (msg.stats) snapshot.stats = msg.stats;
    snapshot.stamps = msg.stamps || snapshot.stamps || [];
    snapshot.skipped = msg.skipped || snapshot.skipped || [];
    if (msg.programs) snapshot.programs = msg.programs;
    if (msg.delta) snapshot.delta = msg.delta;
    snapshot.program = null;
    snapshot.preview = false;
    snapshot.inner = null;
    indexGraph(snapshot.graph);
    stampRows = snapshot.stamps || [];
    skippedFlows = snapshot.skipped || [];
    applyExplorerLanding();
    finishWork();
    paint({ animate: "none", keepCam: true });
    return;
  }
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
    delta: msg.delta || { facts: [] },
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
  if (!inner && mapStageMounted() && snapshot) {
    patchSnapshotFields(msg, { preview: false });
    stampRows = snapshot.stamps || stampRows;
    skippedFlows = snapshot.skipped || skippedFlows;
    finishWork();
    paint({ animate: "none", keepCam: true });
    return;
  }
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
    delta: msg.delta || snapshot?.delta || { facts: [] },
    program: msg.program || null,
    snippets: msg.snippets || {},
    preview: false,
    inner: inner ? msg.inner : null,
    depth: msg.depth || 0,
  };
  if (msg.flow?.name) flowName = msg.flow.name;
  else if (!flowName && snapshot.flows[0]) flowName = snapshot.flows[0].name;
  if (inner && msg.inner) {
    const frame = {
      kind: "bubble",
      flow: msg.inner.flow,
      bubble: String(msg.inner.bubble),
    };
    const top = stack[stack.length - 1];
    const same = top && top.kind === "bubble" && String(top.bubble) === frame.bubble;
    if (!same) {
      let at = -1;
      for (let i = 0; i < stack.length; i++) {
        if (stack[i] && stack[i].kind === "bubble" && String(stack[i].bubble) === frame.bubble) at = i;
      }
      if (at >= 0) stack.length = at + 1;
      else {
        if (!stack.length) stack.push({ kind: "programs" });
        stack.push(frame);
      }
    }
  } else if (!inner) {
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

function flashToast(text, kind) {
  if (!toastEl) return;
  toastEl.hidden = false;
  toastEl.className = kind ? "on " + kind : "on";
  toastEl.textContent = text;
  clearTimeout(flashToast._t);
  flashToast._t = setTimeout(() => {
    toastEl.classList.remove("on");
    toastEl.hidden = true;
  }, 1600);
}

function flashBtn(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 720);
}

function flashCanvas() {
  if (!canvas || reduceMotion()) return;
  canvas.classList.remove("swap");
  void canvas.offsetWidth;
  canvas.classList.add("swap");
}

/** ADE Keys Trace/Passport section header (KA1–KA3): show/hide #keysAdeSection by workspace. */
function syncKeysAdeSection(ws) {
  if (!keysPane) return;
  const el = keysPane.querySelector("#keysAdeSection") || document.getElementById("keysAdeSection");
  if (!el) return;
  const titleEl = el.querySelector("[data-keys-section-title]") || el.querySelector(".keys-section-title");
  const on = ws === "trace" || ws === "passport";
  el.hidden = !on;
  if (!on) {
    el.removeAttribute("data-keys-ws");
    if (titleEl) titleEl.textContent = "";
    return;
  }
  el.setAttribute("data-keys-ws", ws);
  if (titleEl) {
    titleEl.textContent =
      ws === "trace" ? "Trace · residual bindings" : "Passport · residual bindings";
  }
}

/** ADE Keys Trace zoom pct keyboard hint (KZH1–KZH3): show Trace-only Keys row for ↑/↓/Home on #trajZoomPct. */
function syncKeysTrajZoomHint(ws) {
  if (!keysPane) return;
  const row = keysPane.querySelector('[data-keys-row="traj-zoom"]');
  if (!row) return;
  const on = ws === "trace";
  row.hidden = !on;
  row.setAttribute("data-keys-traj-zoom-hint", on ? "1" : "0");
  if (on) row.setAttribute("data-keys-workspace", "trace");
  else row.removeAttribute("data-keys-workspace");
}

/** ADE Keys residual-filter hint (KH1–KH3) + pressed-state (KP1–KP3) + ADE section (KA1–KA3): workspace-aware R row on #keysPane. */
function syncKeysRRow(ws) {
  if (!keysPane) return;
  if (typeof syncKeysAdeSection === "function") syncKeysAdeSection(ws);
  if (typeof syncKeysTrajZoomHint === "function") syncKeysTrajZoomHint(ws);
  const row = keysPane.querySelector('[data-keys-row="r"]');
  if (!row) return;
  const textEl = row.querySelector("[data-keys-r-binding-text]");
  const residual = ws === "trace" || ws === "passport";
  row.setAttribute("data-keys-r-binding", residual ? "residual-filter" : "path");
  row.setAttribute("data-keys-residual-hint", residual ? "1" : "0");
  if (textEl) textEl.textContent = residual ? "residual filter" : "PATH";
  // ADE KP: mirror trajResidualFilter as pressed/on when Trace/Passport; clear on Map/leave or filter OFF.
  const pressed = residual && !!trajResidualFilter;
  row.setAttribute("aria-pressed", pressed ? "true" : "false");
  row.setAttribute("data-keys-r-pressed", pressed ? "1" : "0");
  row.classList.toggle("on", pressed);
  row.classList.toggle("pressed", pressed);
}

function setKeysPane(on) {
  if (!keysPane) return;
  if (on) {
    setExportMenu(false);
    if (llmPane && !llmPane.hidden && typeof setLlmPane === "function") setLlmPane(false);
    if (sourcePane && !sourcePane.hidden && typeof closeSourcePane === "function") closeSourcePane();
    if (typeof setLensOpen === "function") setLensOpen(false);
    if (typeof setRouteOpen === "function") setRouteOpen(false);
    if (typeof hideTip === "function") hideTip();
    if (toastEl) {
      toastEl.classList.remove("on");
      toastEl.hidden = true;
    }
  }
  keysPane.hidden = !on;
  keysPane.classList.toggle("open", !!on);
  if (keysBtn) keysBtn.classList.toggle("on", !!on);
  if (on && typeof syncKeysRRow === "function") syncKeysRRow(explorerWs);
}

function setExportMenu(on) {
  if (!exportMenu) return;
  if (on) {
    setKeysPane(false);
    if (llmPane && !llmPane.hidden) setLlmPane(false);
    if (sourcePane && !sourcePane.hidden && typeof closeSourcePane === "function") closeSourcePane();
    if (typeof setLensOpen === "function") setLensOpen(false);
    if (typeof setRouteOpen === "function") setRouteOpen(false);
    if (typeof hideTip === "function") hideTip();
    if (toastEl) {
      toastEl.classList.remove("on");
      toastEl.hidden = true;
    }
  }
  exportMenu.hidden = !on;
  exportMenu.classList.toggle("open", !!on);
  if (exportBtn) exportBtn.classList.toggle("on", !!on);
}

const EXPORT_STRIP = ["on", "dim", "hit", "focus", "selected", "ego-dim", "ego", "press", "flash-holds", "flash-skip", "present", "route-dim", "on-route", "on-route-hot", "rkm-hit", "rkm-dim", "lens-dim", "lens-on", "away", "hot", "flowing", "on-path", "now", "past", "ahead", "here", "walk", "dragging", "panning", "scroll-cfg-hot", "scroll-cfg-dim", "scroll-cfg-ahead", "scroll-macro-hot", "scroll-macro-dim", "scroll-anchor-api", "scroll-anchor-db", "scroll-anchor-svc", "scroll-anchor-util", "scroll-linemap-hit", "scroll-linemap-miss"];

function exportDiagramRoot() {
  return (
    document.getElementById("seqCanvas") ||
    document.getElementById("dfCanvas") ||
    document.getElementById("lcCanvas") ||
    document.getElementById("deltaCanvas") ||
    document.getElementById("sliceCanvas") ||
    document.getElementById("lineageCanvas") ||
    document.querySelector("#canvas .stage") ||
    document.getElementById("canvas")
  );
}

function stripExportViewerState(root) {
  if (!root) return root;
  const nodes = [root];
  if (root.querySelectorAll) nodes.push.apply(nodes, root.querySelectorAll("*"));
  nodes.forEach((el) => {
    EXPORT_STRIP.forEach((c) => el.classList.remove(c));
    el.removeAttribute("data-delta-review-current");
    // Pan/zoom parks off-stage Map cards; camera reset must un-hide them in the clone.
    el.removeAttribute("data-offview");
    el.removeAttribute("data-scroll-anchor");
    el.removeAttribute("data-scroll-detail");
    if (el.getAttribute && el.getAttribute("aria-pressed") === "true") el.setAttribute("aria-pressed", "false");
  });
  const vp = root.querySelector && root.querySelector(".viewport");
  if (vp) vp.style.transform = "none";
  return root;
}

function exportSlug(s) {
  return String(s || "diagram").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "diagram";
}

function exportFileBase() {
  const flow = currentFlow();
  return "graphide-" + exportSlug((flow && flow.name) || explorerWs || "diagram");
}

function exportTitle() {
  const flow = currentFlow();
  return "Graphide · " + ((flow && flow.name) || explorerWs || "Review");
}

function collectExportCss() {
  let css = "";
  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];
    try {
      const rules = sheet.cssRules;
      for (let r = 0; r < rules.length; r++) css += rules[r].cssText + "\n";
    } catch (_) {}
  }
  const cs = getComputedStyle(document.documentElement);
  const vars = [];
  for (let i = 0; i < cs.length; i++) {
    const k = cs[i];
    if (k.indexOf("--") === 0) vars.push(k + ":" + cs.getPropertyValue(k));
  }
  const bg = getComputedStyle(document.body).backgroundColor || "#f2f2f7";
  const fg = getComputedStyle(document.body).color || "#1d1d1f";
  return (
    ":root,html,.bright{" +
    vars.join(";") +
    "}" +
    ".export-root{background:" +
    bg +
    ";color:" +
    fg +
    ";font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',system-ui,sans-serif;}" +
    css
  );
}

function measureExportBox(el) {
  const vp = el.querySelector && el.querySelector(".viewport");
  const w = Math.max(el.scrollWidth || 0, el.clientWidth || 0, vp ? vp.scrollWidth : 0, vp ? vp.offsetWidth : 0, 320);
  const h = Math.max(el.scrollHeight || 0, el.clientHeight || 0, vp ? vp.scrollHeight : 0, vp ? vp.offsetHeight : 0, 200);
  return { w: Math.ceil(w), h: Math.ceil(h) };
}

function buildCanonicalSvg() {
  const src = exportDiagramRoot();
  if (!src) throw new Error("nothing to export");
  const box = measureExportBox(src);
  const clone = src.cloneNode(true);
  stripExportViewerState(clone);
  clone.style.width = box.w + "px";
  clone.style.height = box.h + "px";
  clone.style.transform = "none";
  clone.style.position = "relative";
  clone.style.overflow = "visible";
  const night = document.documentElement.classList.contains("night");
  const preset = currentPreset();
  const css = collectExportCss()
    .replace(/<\//g, "<\\/")
    .replace(/]]>/g, "]]\\>");
  let markup = "";
  try {
    markup = new XMLSerializer().serializeToString(clone);
  } catch (_) {
    markup = clone.outerHTML;
  }
  const inner =
    '<div xmlns="http://www.w3.org/1999/xhtml" class="export-root bright' +
    (night ? " night" : "") +
    '" data-preset="' +
    preset +
    '" style="width:' +
    box.w +
    "px;height:" +
    box.h +
    'px"><style>' +
    css +
    "</style>" +
    markup +
    "</div>";
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    box.w +
    '" height="' +
    box.h +
    '" viewBox="0 0 ' +
    box.w +
    " " +
    box.h +
    '"><foreignObject width="100%" height="100%">' +
    inner +
    "</foreignObject></svg>";
  return { svg: svg, w: box.w, h: box.h, night: night, preset: preset, title: exportTitle(), name: exportFileBase() };
}

function loadBlobImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };
    img.src = url;
  });
}

function canvasPngBlob(c) {
  return new Promise((resolve, reject) => {
    c.toBlob((b) => {
      if (!b) reject(new Error("png blob failed"));
      else resolve(b);
    }, "image/png");
  });
}

function loadDataImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const t = setTimeout(() => {
      img.onload = img.onerror = null;
      reject(new Error("image timeout"));
    }, 2200);
    img.onload = () => {
      clearTimeout(t);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(t);
      reject(new Error("image load failed"));
    };
    img.src = url;
  });
}

async function rasterizeSvg(svg, w, h) {
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  const img = await loadDataImage(url);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.fillStyle = getComputedStyle(document.body).backgroundColor || "#f2f2f7";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvasPngBlob(c);
}

function exportRoundRect(ctx, x, y, w, h, r) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  if (!rad) {
    ctx.rect(x, y, w, h);
    return;
  }
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function directExportText(el) {
  let t = "";
  const kids = el.childNodes || [];
  for (let i = 0; i < kids.length; i++) {
    if (kids[i].nodeType === 3) t += kids[i].textContent || "";
  }
  return t.replace(/\s+/g, " ").trim();
}

function paintCloneToCanvas(src, w, h) {
  const bg = getComputedStyle(document.body).backgroundColor || "#f2f2f7";
  const host = document.createElement("div");
  host.setAttribute("data-export-stage", "1");
  host.style.cssText =
    "position:fixed;left:-12000px;top:0;width:" +
    w +
    "px;height:" +
    h +
    "px;overflow:visible;background:" +
    bg +
    ";pointer-events:none;z-index:-1;";
  const clone = src.cloneNode(true);
  stripExportViewerState(clone);
  clone.style.width = w + "px";
  clone.style.height = h + "px";
  clone.style.transform = "none";
  clone.style.position = "relative";
  host.appendChild(clone);
  document.body.appendChild(host);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const origin = clone.getBoundingClientRect();
  const els = [clone];
  if (clone.querySelectorAll) els.push.apply(els, clone.querySelectorAll("*"));
  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    if (el.tagName === "svg" || el.tagName === "path" || el.tagName === "line") continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    const x = r.left - origin.left;
    const y = r.top - origin.top;
    if (r.width < 1 || r.height < 1) continue;
    if (x + r.width < 0 || y + r.height < 0 || x > w || y > h) continue;
    const bgc = cs.backgroundColor;
    if (bgc && bgc !== "rgba(0, 0, 0, 0)" && bgc !== "transparent") {
      ctx.fillStyle = bgc;
      exportRoundRect(ctx, x, y, r.width, r.height, parseFloat(cs.borderRadius) || 0);
      ctx.fill();
    }
    const bw = parseFloat(cs.borderTopWidth) || 0;
    if (bw > 0) {
      const bc = cs.borderTopColor;
      if (bc && bc !== "rgba(0, 0, 0, 0)") {
        ctx.strokeStyle = bc;
        ctx.lineWidth = bw;
        exportRoundRect(ctx, x, y, r.width, r.height, parseFloat(cs.borderRadius) || 0);
        ctx.stroke();
      }
    }
    const text = directExportText(el);
    if (text) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, r.width, r.height);
      ctx.clip();
      ctx.fillStyle = cs.color || "#1d1d1f";
      ctx.font = cs.font || "13px system-ui";
      ctx.textBaseline = "middle";
      ctx.fillText(text, x + 6, y + r.height / 2, Math.max(8, r.width - 10));
      ctx.restore();
    }
  }
  host.remove();
  return c;
}

async function rasterizeCanonical(art) {
  try {
    return await rasterizeSvg(art.svg, art.w, art.h);
  } catch (_) {
    const src = exportDiagramRoot();
    if (!src) throw new Error("nothing to export");
    return canvasPngBlob(paintCloneToCanvas(src, art.w, art.h));
  }
}

function paintShareCard(img, diagW, diagH) {
  const W = 1200;
  const H = 630;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const body = getComputedStyle(document.body);
  ctx.fillStyle = body.backgroundColor || "#f2f2f7";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = body.color || "#1d1d1f";
  ctx.font = "600 22px -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(exportTitle(), 40, 28);
  const top = 72;
  const pad = 40;
  const availW = W - pad * 2;
  const availH = H - top - pad;
  const scale = Math.min(availW / Math.max(1, diagW), availH / Math.max(1, diagH));
  const dw = diagW * scale;
  const dh = diagH * scale;
  const x = pad + (availW - dw) / 2;
  const y = top + (availH - dh) / 2;
  ctx.drawImage(img, 0, 0, diagW, diagH, x, y, dw, dh);
  return c;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

async function blobToBase64(blob) {
  const url = await blobToDataUrl(blob);
  const i = url.indexOf(",");
  return i >= 0 ? url.slice(i + 1) : "";
}

function rememberExport(kind, rec) {
  window.__graphideLastExport = window.__graphideLastExport || {};
  window.__graphideLastExport[kind] = rec;
}

function downloadBlob(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2500);
}

function postExportFile(name, mime, data) {
  vscode.postMessage({ type: "exportFile", name: name, mime: mime, data: data });
}

async function copyPngBlob(blob) {
  if (navigator.clipboard && window.ClipboardItem) {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  }
  return false;
}

async function runExport(kind) {
  setExportMenu(false);
  try {
    const art = buildCanonicalSvg();
    const base = art.name;
    if (kind === "svg") {
      const blob = new Blob([art.svg], { type: "image/svg+xml;charset=utf-8" });
      const name = base + ".svg";
      const dataUrl = await blobToDataUrl(blob);
      rememberExport("svg", {
        name: name,
        mime: "image/svg+xml",
        dataUrl: dataUrl,
        w: art.w,
        h: art.h,
        canonical: true,
        theme: art.night ? "night" : "day",
        preset: art.preset || currentPreset(),
      });
      downloadBlob(blob, name);
      postExportFile(name, "image/svg+xml", await blobToBase64(blob));
      flashToast(name, "ok");
      return;
    }
    const png = await rasterizeCanonical(art);
    if (kind === "png" || kind === "copy-png") {
      const name = base + ".png";
      const dataUrl = await blobToDataUrl(png);
      rememberExport("png", {
        name: name,
        mime: "image/png",
        dataUrl: dataUrl,
        w: art.w,
        h: art.h,
        canonical: true,
        theme: art.night ? "night" : "day",
        preset: art.preset || currentPreset(),
      });
      if (kind === "copy-png") {
        const ok = await copyPngBlob(png).catch(() => false);
        flashToast(ok ? "Copied PNG" : "Clipboard unavailable", ok ? "ok" : "");
        return;
      }
      downloadBlob(png, name);
      postExportFile(name, "image/png", await blobToBase64(png));
      flashToast(name, "ok");
      return;
    }
    if (kind === "route-share") {
      const route = resolveRoute();
      if (!route.ok || route.hops.length < 1) {
        flashToast("No route", "skip");
        return;
      }
      const rimg = await loadBlobImage(png);
      const rcard = paintShareCard(rimg, art.w, art.h);
      const rshare = await canvasPngBlob(rcard);
      const rname = base + "-route.png";
      const rurl = await blobToDataUrl(rshare);
      rememberExport("route", {
        name: rname,
        mime: "image/png",
        dataUrl: rurl,
        w: 1200,
        h: 630,
        canonical: false,
        variant: "route",
        hops: route.hops.length,
        theme: art.night ? "night" : "day",
        preset: art.preset || currentPreset(),
      });
      downloadBlob(rshare, rname);
      postExportFile(rname, "image/png", await blobToBase64(rshare));
      flashToast(rname, "ok");
      return;
    }
    const img = await loadBlobImage(png);
    const card = paintShareCard(img, art.w, art.h);
    const share = await canvasPngBlob(card);
    const name = base + "-share.png";
    const dataUrl = await blobToDataUrl(share);
    rememberExport("share", {
      name: name,
      mime: "image/png",
      dataUrl: dataUrl,
      w: 1200,
      h: 630,
      canonical: true,
      theme: art.night ? "night" : "day",
      preset: art.preset || currentPreset(),
    });
    if (kind === "copy-share") {
      const ok = await copyPngBlob(share).catch(() => false);
      flashToast(ok ? "Copied Share Card" : "Clipboard unavailable", ok ? "ok" : "");
      return;
    }
    downloadBlob(share, name);
    postExportFile(name, "image/png", await blobToBase64(share));
    flashToast(name, "ok");
  } catch (e) {
    window.__graphideExportError = String(e && e.message ? e.message : e);
    flashToast("Export failed", "");
  }
}

function syncKindPills() {
  if (!kindFilters) return;
  kindFilters.querySelectorAll("label").forEach((lab) => {
    const box = lab.querySelector("input");
    lab.classList.toggle("off", !!(box && !box.checked));
  });
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function setZoomUi(on) {
  if (zoomBar) zoomBar.hidden = !on;
  if (on) updateZoomPct();
}

function reviewMarks() {
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
  return { names, holds, broken, skipped, pending };
}

function reviewAltitude() {
  if (enterCanvasActive()) return "inside";
  if (explorerWs === "slice") return "slice";
  if (explorerWs === "map") return "map";
  if (explorerWs === "overview") return "overview";
  if (explorerWs === "lineage") return "lineage";
  return explorerWs || "review";
}

function nowStripHtml() {
  if (!snapshot) return "";
  const m = reviewMarks();
  const ws = explorerWs || "overview";
  const alt = reviewAltitude();
  const walk = pathWalk.i >= 0 ? pathWalkStops()[pathWalk.i] : null;
  const here = walk ? shortOf(walk.label) || "" : "";
  const place = ws === alt ? ws : ws + " · " + alt;
  return (
    '<span class="now-pill" id="nowPill">' +
    esc(place) +
    (here ? " · " + esc(here) : "") +
    (m.names.length ? " · " + (m.pending ? m.pending + " left" : "queue clear") : "") +
    "</span>"
  );
}

function refreshNowPill() {
  const el = document.getElementById("nowPill");
  if (!el) return;
  const html = nowStripHtml();
  if (!html) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  const box = document.createElement("div");
  box.innerHTML = html;
  const next = box.firstElementChild;
  if (next) {
    next.hidden = false;
    el.replaceWith(next);
  }
}

function setMeta(html) {
  if (!meta) return;
  meta.innerHTML = html || "";
  refreshNowPill();
}

function setDeskMode(on) {
  document.body.classList.toggle("desk", !!on);
  document.body.classList.toggle("reviewed", !!(on && snapshot));
}

function setGraphChrome(on) {
  setDeskMode(!!on);
  if (graphBar) graphBar.hidden = !on;
  const list = !!LIST_WORKSPACES[explorerWs];
  if (ledgerPane) ledgerPane.hidden = !on || list;
  if (workspace) workspace.classList.toggle("has-ledger", !!(on && !list));
  if (kindFilters) kindFilters.hidden = list;
  if (egoBtn) {
    egoBtn.hidden = !on;
    egoBtn.classList.toggle("on", !!egoMode);
  }
  if (egoHopsEl) {
    egoHopsEl.disabled = !on;
    egoHopsEl.value = String(egoHops);
    const wrap = egoHopsEl.closest(".ego-hops");
    if (wrap) wrap.hidden = !on || !egoMode;
  }
  reorgBtns.forEach((el) => {
    el.hidden = !on;
  });
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
      if (card) enterMapBubble(card.getAttribute("data-bubble"));
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
  try {
    const pr = q.get("preset");
    if (pr && PRESETS.indexOf(pr) >= 0) applyPreset(pr, false);
    if (q.get("present") === "1" && !consumeHarnessActions._present) {
      consumeHarnessActions._present = true;
      applyPresent(true);
    }
    if (q.get("route") === "1" && !consumeHarnessActions._route) {
      consumeHarnessActions._route = true;
      setRouteOpen(true);
    }
    if (q.get("lens") === "1" && !consumeHarnessActions._lens) {
      consumeHarnessActions._lens = true;
      setLensOpen(true);
    }
  } catch (_) {}
}

function popEnterFrames() {
  let n = 0;
  while (stack.length && stack[stack.length - 1] && stack[stack.length - 1].kind === "bubble") {
    stack.pop();
    n += 1;
  }
  if (n) graphFilter.bubble = null;
  return n;
}

function setWorkspace(name, pin) {
  if (WORKSPACES.indexOf(name) < 0) return;
  const prevWs = explorerWs;
  if (name !== explorerWs) {
    const n = popEnterFrames();
    for (let i = 0; i < n; i++) vscode.postMessage({ type: "back" });
  }
  if (explorerWs === "lineage" && name !== "lineage") {
    lineageEgoId = "";
    lineageHopCursor = -1;
    lineageBodyKey = "";
  }
  if (name === "lineage") {
    const selected = selectedNodeId ? idVal(selectedNodeId) : "";
    if (selected && hasLineageHops(selected)) lineageEgoId = selected;
  }
  // S1y/S1z — desk canvas hop remount mid-drive: stash stay + keepCam while Evidence
  // open (same sourceId). Map↔Slice (S1y); Lineage/Overview↔Slice and peer hops (S1z).
  // S1br — list↔canvas: stash on leave-canvas; soft-stay on return-to-canvas while Evidence open.
  // Closed Evidence / sourceId change falls through to S1v/S1w.
  const DESK_SCROLL_STAY_WS = { map: 1, slice: 1, lineage: 1, overview: 1 };
  const fromCanvas = !!DESK_SCROLL_STAY_WS[prevWs];
  const toCanvas = !!DESK_SCROLL_STAY_WS[name];
  const deskCanvasHop = prevWs !== name && fromCanvas && toCanvas;
  const evidenceOpen =
    !!(sourcePane && !sourcePane.hidden && sourceId) &&
    !(typeof isPresenting === "function" && isPresenting());
  const stayWarm =
    !!scrollDriveBase ||
    (typeof scrollDriveLastStayMatches === "function" &&
      scrollDriveLastStayMatches(String(sourceId)));
  const listLeaveStash =
    prevWs !== name && fromCanvas && !toCanvas && evidenceOpen && !!scrollDriveBase;
  const listReturnStay =
    prevWs !== name && !fromCanvas && toCanvas && evidenceOpen && stayWarm;
  const evidenceStay = (deskCanvasHop || listReturnStay) && evidenceOpen && stayWarm;
  if (
    (evidenceStay || listLeaveStash) &&
    scrollDriveBase &&
    typeof stashScrollDriveLastStay === "function"
  ) {
    stashScrollDriveLastStay();
  }
  // S1y/S1z/S1br — disconnect scheduleFit RO before remount so workspace resize cannot fit-yank.
  if (evidenceStay && typeof stageFitRo !== "undefined" && stageFitRo) {
    stageFitRo.disconnect();
    stageFitRo = null;
  }
  // ADE residual-filter clear-on-ws-leave (WL1–WL3) — don't leak filter into Map/Slice/etc.
  // Trace↔Passport keep shared trajResidualFilter (both in ADE_RESIDUAL_WS).
  const ADE_RESIDUAL_WS = { trace: 1, passport: 1 };
  if (
    prevWs !== name &&
    ADE_RESIDUAL_WS[prevWs] &&
    !ADE_RESIDUAL_WS[name]
  ) {
    if (trajResidualFilter) {
      trajResidualFilter = false;
      if (typeof syncResidualFilterLive === "function") syncResidualFilterLive(false);
    }
    if (passportDeltaFilter) {
      passportDeltaFilter = null;
    }
  }
  explorerWs = name;
  // Keep #keysPane R row in sync even while closed (RK1 keysDoc + KH workspace-aware).
  if (typeof syncKeysRRow === "function") syncKeysRRow(name);
  if (pin) explorerPinned = true;
  if (name === "lineage" && !egoMode) egoMode = true;
  paint({ animate: "none", keepCam: !!evidenceStay });
  if (evidenceStay && typeof softStayScrollDriveAcrossMapSliceHop === "function") {
    softStayScrollDriveAcrossMapSliceHop();
  }
  flashCanvas();
}

function setEgoMode(on) {
  egoMode = !!on;
  if (egoBtn) egoBtn.classList.toggle("on", egoMode);
  if (egoHopsEl) {
    const wrap = egoHopsEl.closest(".ego-hops");
    if (wrap) wrap.hidden = !egoMode;
  }
  if (explorerWs === "lineage" || explorerWs === "slice" || explorerWs === "overview" || enterCanvasActive()) {
    // S1bs — ego remount while Evidence open: keepCam + soft-stay (no wipe-then-zoom).
    const evidenceStay =
      typeof evidenceScrollDriveStayLive === "function" && evidenceScrollDriveStayLive();
    if (evidenceStay && scrollDriveBase && typeof stashScrollDriveLastStay === "function") {
      stashScrollDriveLastStay();
    }
    if (evidenceStay && typeof stageFitRo !== "undefined" && stageFitRo) {
      stageFitRo.disconnect();
      stageFitRo = null;
    }
    paint({ animate: "none", keepCam: !!evidenceStay });
    if (evidenceStay && typeof softStayScrollDriveAcrossDeskRemount === "function") {
      softStayScrollDriveAcrossDeskRemount();
    }
    return;
  }
  applyEgoPaint();
}

function refreshExplorer() {
  if (!snapshot) return;
  if (enterCanvasActive() || isListWorkspace(explorerWs) || explorerWs === "lineage" || explorerWs === "overview" || explorerWs === "slice") {
    // S1bu — search / kind-filter remount while Evidence open: keepCam + soft-stay.
    const evidenceStay =
      typeof evidenceScrollDriveStayLive === "function" && evidenceScrollDriveStayLive();
    if (evidenceStay && scrollDriveBase && typeof stashScrollDriveLastStay === "function") {
      stashScrollDriveLastStay();
    }
    if (evidenceStay && typeof stageFitRo !== "undefined" && stageFitRo) {
      stageFitRo.disconnect();
      stageFitRo = null;
    }
    paint({ animate: "none", keepCam: !!evidenceStay });
    if (evidenceStay && typeof softStayScrollDriveAcrossDeskRemount === "function") {
      softStayScrollDriveAcrossDeskRemount();
    }
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
  if (!el) return;
  const raw = String(label || "Slice");
  el.textContent = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
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
  return enterCanvasActive();
}

function popAltitudeFromZoom() {
  if (!enterCanvasActive()) return;
  resetCam();
  zoomPopReady = false;
  goBack();
}

function pinMapCommunityLod(vp) {
  const el = vp || viewportEl || (canvas && canvas.querySelector(".viewport"));
  if (!el) return;
  if (el.getAttribute("data-lod") !== "0") el.setAttribute("data-lod", "0");
}

function applyCam() {
  if (viewportEl) {
    viewportEl.style.transform = "translate(" + cam.x + "px," + cam.y + "px) scale(" + cam.k + ")";
    viewportEl.style.setProperty("--cam-k", String(cam.k));
    const lod = mapStageMounted() ? "0" : String(lodOf(cam.k));
    if (viewportEl.getAttribute("data-lod") !== lod) {
      viewportEl.setAttribute("data-lod", lod);
      const wrap = viewportEl.querySelector(".comm-wrap");
      if (wrap && wrap.querySelector(".bubble-card, .comm-node")) {
        requestAnimationFrame(() => {
          separatePaintedCards(wrap, wrap.querySelector(".bubble-card") ? ".bubble-card" : ".comm-node");
        });
      }
    }
  }
  updateZoomPct();
  const popK = camTo && camTo.k != null ? camTo.k : cam.k;
  if (popK > 0.8) zoomPopReady = true;
  if (zoomPopReady && popK <= 0.42 && canPopAltitude()) {
    zoomPopReady = false;
    popAltitudeFromZoom();
  }
  if (mapStageMounted()) queueOffviewSync();
}

function tickCam() {
  if (scrollDriveBase) refreshScrollDriveCamEase();
  const a = camEase;
  cam.x += (camTo.x - cam.x) * a;
  cam.y += (camTo.y - cam.y) * a;
  cam.k += (camTo.k - cam.k) * a;
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

let stageFitRo = null;

function fitChart() {
  const stage = canvas.querySelector(".stage");
  const wrap =
    (stage && stage.querySelector(".comm-wrap, .steiner-wrap, #sliceCanvas, #lineageCanvas, #enterCanvas")) ||
    canvas.querySelector(".comm-wrap, .steiner-wrap, #sliceCanvas, #lineageCanvas, #enterCanvas");
  if (!stage || !wrap) {
    setCamTarget(0, 0, 1);
    return false;
  }
  const sr = stage.getBoundingClientRect();
  if (sr.width < 24 || sr.height < 24) return false;
  let W = Math.max(1, parseFloat(wrap.style.width) || wrap.scrollWidth || wrap.offsetWidth || 1);
  let H = Math.max(1, parseFloat(wrap.style.height) || wrap.scrollHeight || wrap.offsetHeight || 1);
  const chart = stage.querySelector(".chart");
  if (chart && chart.querySelector(".run")) {
    // Subsystem runs sit under the Steiner. Framing only the canvas clips them.
    H = Math.max(H + (wrap.offsetTop || 0), chart.offsetTop + chart.offsetHeight);
    W = Math.max(W, chart.offsetLeft + chart.offsetWidth);
  }
  const pad = 36;
  let k = Math.min((sr.width - pad) / W, (sr.height - pad) / H, 1.05);
  if (!Number.isFinite(k) || k <= 0) return false;
  k = clamp(k, CAM_MIN, CAM_MAX);
  // Fit is not a zoom-out. A tall enter chart may sit under the old 0.78 hold,
  // including just under the 0.42 pop line. Pop stays a later zoom-out after k > 0.8.
  zoomPopReady = false;
  setCamTarget((sr.width - W * k) / 2, (sr.height - H * k) / 2, k);
  zoomPopReady = k > 0.8;
  return true;
}

function scheduleFit(stage) {
  if (!stage) return;
  const run = () => fitChart();
  if (stageFitRo) {
    stageFitRo.disconnect();
    stageFitRo = null;
  }
  requestAnimationFrame(run);
  stageFitRo = new ResizeObserver(run);
  stageFitRo.observe(stage);
  const ws = document.getElementById("workspace");
  if (ws) stageFitRo.observe(ws);
}

/** S1ae — Present→Evidence / soft-stay reopen must not wipe cam with hard fit.
 *  showSource sets `scrollDriveSuppressNextRefit` + disconnects scheduleFit RO when
 *  soft-restore / soft-hop applies; refitChartSoon honors that one-shot. Probe also
 *  reports true for warm last-stay (next reopen will soft-stay). Cold open still
 *  hard-fits. closeSourcePane always fits. Present exit alone does not half-restore
 *  (S1w). User Fit unchanged. */
function shouldSkipRefitForScrollDriveStay() {
  if (scrollDriveSuppressNextRefit) return true;
  if (scrollDriveJustRestored) return true;
  return !!(scrollDriveLastStay && scrollDriveLastStay.sourceId);
}

function refitChartSoon() {
  requestAnimationFrame(() => {
    // One-shot from soft stay this open — do not wipe restore / hop cam.
    if (scrollDriveSuppressNextRefit) {
      scrollDriveSuppressNextRefit = false;
      return;
    }
    if (scrollDriveJustRestored) return;
    fitChart();
  });
}

// S1ae — harness probe (call-time) for skip-refit honesty.
if (typeof window !== "undefined") {
  window.__graphideShouldSkipRefitForScrollDriveStay = function () {
    return typeof shouldSkipRefitForScrollDriveStay === "function" && !!shouldSkipRefitForScrollDriveStay();
  };
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
  if (!stage) return;
  viewportEl = stage.querySelector(".viewport");
  if (!opts || opts.reset) {
    resetCam();
    scheduleFit(stage);
  } else applyCam();
  if (stage.dataset.uiBound) return;
  stage.dataset.uiBound = "1";
  stage.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    stage.style.setProperty("--mx", e.clientX - r.left + "px");
    stage.style.setProperty("--my", e.clientY - r.top + "px");
  });
  stage.addEventListener("pointerleave", () => {
    stage.style.setProperty("--mx", "50%");
    stage.style.setProperty("--my", "40%");
  });
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
    if (e.target.closest("button, .run, .inode, a, input, .vnode, .react-flow__node, .react-flow__edge")) return;
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
    fitChart();
  });
}

function bindGraphFx() {
  const wrap = canvas.querySelector(".steiner-wrap");
  const svg = canvas.querySelector("svg.steiner");
  const xyHost = document.getElementById("sliceCanvas");
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
  } else if (xyHost) {
    stampXyFlowAttrs();
    xyHost.querySelectorAll(".vnode").forEach((g) => {
      const fqn = g.getAttribute("data-fqn") || "";
      g.addEventListener("pointerenter", (ev) => showTip(fqn, ev));
      g.addEventListener("pointermove", (ev) => showTip(fqn, ev));
      g.addEventListener("pointerleave", hideTip);
    });
    // Desk camera used to steal pointerdown (vanilla bindDraggable stopped it).
    // Host click keeps Evidence / select on Slice Steiner after the XYFlow port.
    if (!xyHost.dataset.fxBound) {
      xyHost.dataset.fxBound = "1";
      xyHost.addEventListener("click", (e) => {
        const n = e.target.closest(".vnode");
        if (n && n.dataset.id) selectNode(n.dataset.id);
      });
      xyHost.addEventListener("dblclick", (e) => {
        const n = e.target.closest(".vnode");
        if (!n || !n.dataset.id) return;
        const id = n.dataset.id;
        const run = [...canvas.querySelectorAll(".run")].find((el) =>
          (el.getAttribute("data-nodes") || "").split(",").includes(id)
        );
        if (run) {
          enterRun(run.getAttribute("data-flow"), run.getAttribute("data-bubble"), run);
          return;
        }
        peekSource(id);
      });
    }
  }
  if (!xyHost) {
    bindDraggable(canvas.querySelector(".steiner-wrap"), ".vnode", {
      onClick: (id, el) => selectNode(id, { zoomEl: el }),
    });
  }
  bindDraggable(canvas.querySelector(".chart"), ".run", {
    idAttr: "data-run",
    onClick: (_id, el) => enterRun(el.getAttribute("data-flow"), el.getAttribute("data-bubble"), el),
  });
}

function selectFlow(name) {
  if (name) flowName = name;
  vscode.postMessage({ type: "selectFlow", flow: name });
  const flow = currentFlow();
  if (flow && ((flow.tree && flow.tree.edges && flow.tree.edges.length) || (flow.tree && flow.tree.nodes && flow.tree.nodes.length))) {
    // selectFlow already replaced the host stack. Pop the desk frames only.
    popEnterFrames();
    explorerWs = "slice";
    // S1bt — flow-tab remount while Evidence open: keepCam + soft-stay (no wipe-then-zoom).
    const evidenceStay =
      typeof evidenceScrollDriveStayLive === "function" && evidenceScrollDriveStayLive();
    if (evidenceStay && scrollDriveBase && typeof stashScrollDriveLastStay === "function") {
      stashScrollDriveLastStay();
    }
    if (evidenceStay && typeof stageFitRo !== "undefined" && stageFitRo) {
      stageFitRo.disconnect();
      stageFitRo = null;
    }
    paint({ animate: "none", keepCam: !!evidenceStay });
    if (evidenceStay && typeof softStayScrollDriveAcrossDeskRemount === "function") {
      softStayScrollDriveAcrossDeskRemount();
    }
  }
}

function enterMapBubble(id) {
  if (!id) return;
  const flow = currentFlow() || defaultRunFlow();
  enterRun(flow && flow.name, id);
}

function enterRun(flow, bubble, fromEl) {
  graphFilter.bubble = null;
  vscode.postMessage({ type: "enterRun", flow, bubble });
  const token = ++navToken;
  // S1bq — Evidence soft-stay live: stash + skip zoomToEl yank into the community
  // (parity with selectNode softHop); enter remount keepCam + soft-restore.
  const evidenceStay =
    typeof evidenceScrollDriveStayLive === "function" && evidenceScrollDriveStayLive();
  if (evidenceStay && scrollDriveBase && typeof stashScrollDriveLastStay === "function") {
    stashScrollDriveLastStay();
  }
  if (evidenceStay && typeof stageFitRo !== "undefined" && stageFitRo) {
    stageFitRo.disconnect();
    stageFitRo = null;
  }
  const go = () => {
    if (token !== navToken) return;
    const top = stack[stack.length - 1];
    const same =
      top &&
      top.kind === "bubble" &&
      String(top.bubble) === String(bubble) &&
      String(top.flow || "") === String(flow || "");
    if (!same) stack.push({ kind: "bubble", flow, bubble: String(bubble) });
    paint({ animate: "list", keepCam: !!evidenceStay });
  };
  if (fromEl && !reduceMotion() && !evidenceStay) {
    fromEl.classList.add("zoom-in");
    canvas.classList.add("leaving");
    zoomToEl(fromEl, 1.9);
    setTimeout(go, 200);
  } else {
    go();
  }
}

function syncBackBtn() {
  if (!backBtn) return;
  backBtn.disabled = !enterCanvasActive() && stack.length <= 1;
}

function goBack() {
  if (stack[stack.length - 1]?.kind === "bubble") {
    const token = ++navToken;
    // S1bq — leave enter while Evidence open: keepCam + soft-stay (no fromInner hard cam reset).
    const evidenceStay =
      typeof evidenceScrollDriveStayLive === "function" && evidenceScrollDriveStayLive();
    if (evidenceStay && scrollDriveBase && typeof stashScrollDriveLastStay === "function") {
      stashScrollDriveLastStay();
    }
    if (evidenceStay && typeof stageFitRo !== "undefined" && stageFitRo) {
      stageFitRo.disconnect();
      stageFitRo = null;
    }
    const go = () => {
      if (token !== navToken) return;
      stack.pop();
      graphFilter.bubble = null;
      vscode.postMessage({ type: "back" });
      paint({
        animate: "tree",
        fromInner: !evidenceStay,
        keepCam: !!evidenceStay,
      });
      if (evidenceStay && typeof softStayScrollDriveAcrossDeskRemount === "function") {
        softStayScrollDriveAcrossDeskRemount();
      }
    };
    if (!reduceMotion() && !evidenceStay) {
      canvas.classList.add("leaving");
      setTimeout(go, 150);
    } else {
      go();
    }
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
  clearDistCache();
  if (!reviewCanvasWorkspace(explorerWs) && !(explorerWs === "map" && enterCanvasActive())) {
    unmountAllReviewCanvases();
  }
  const top = stack[stack.length - 1];
  syncBackBtn();
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
      animate,
      { keepCam: !!(opts && opts.keepCam) }
    );
    applyEgoPaint();
    consumeHarnessActions();
    return;
  }
  if (isListWorkspace(explorerWs) || explorerWs === "overview") {
    renderExplorerList(explorerWs, { keepCam: !!(opts && opts.keepCam) });
    consumeHarnessActions();
    return;
  }
  if (explorerWs === "lineage") {
    renderLineage({ keepCam: !!(opts && opts.keepCam) });
    consumeHarnessActions();
    return;
  }
  if (explorerWs === "map") {
    renderProgramOverview({ keepCam: !!(opts && opts.keepCam) });
    consumeHarnessActions();
    return;
  }
  if (explorerWs === "slice") {
    let flow = currentFlow();
    const story = storyFlow();
    if (story && (flow?.tree?.nodes || []).length < 2 && (story.tree?.nodes || []).length >= 2) {
      flowName = story.name;
      flow = story;
    }
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
    renderProgramOverview({ keepCam: !!(opts && opts.keepCam) });
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
    animate,
    { keepCam: !!(opts && opts.keepCam) }
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
  // Once cancel is requested, keep Cancelling… — queued progress must not flash the old phase.
  if (cancelling) return;
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
      unmountAllReviewCanvases();
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
  cancelling = false;
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
      const from = el.getAttribute("data-hop-from") || el.getAttribute("data-from");
      const to = el.getAttribute("data-hop-to") || el.getAttribute("data-to");
      showHop(from, to, el.getAttribute("data-kind"));
    };
    el.addEventListener("click", go);
    el.addEventListener("pointerdown", (ev) => ev.stopPropagation());
  });
}
function orthoPath(a, b) {
  const mx = Math.round((a.x + b.x) / 2);
  return "M" + a.x + "," + a.y + " H" + mx + " V" + b.y + " H" + b.x;
}

function layoutViewKey() {
  const top = stack[stack.length - 1];
  const bubble = top && top.kind === "bubble" ? String(top.bubble) : "";
  return [
    explorerWs || "map",
    bubble,
    (currentFlow() && currentFlow().name) || "",
    (graphFilter.program && graphFilter.program.name) || "",
  ].join("/");
}

function pinsForCurrent() {
  const prefix = layoutViewKey() + ":";
  const m = new Map();
  for (const [k, v] of layoutPins) {
    if (k.startsWith(prefix)) m.set(k.slice(prefix.length), { x: v.x, y: v.y });
  }
  return m;
}

function pinNode(id, x, y) {
  layoutPins.set(layoutViewKey() + ":" + String(id), { x: x, y: y });
}

function clearCurrentPins() {
  const prefix = layoutViewKey() + ":";
  for (const k of [...layoutPins.keys()]) if (k.startsWith(prefix)) layoutPins.delete(k);
}

function autoReorganize() {
  clearCurrentPins();
  if (!snapshot) return;
  paint({ animate: "none", keepCam: true });
  flashToast("Reorganized", "ok");
}

function kindWeight(kind) {
  if (kind === "Calls" || kind === "Publishes" || kind === "Subscribes") return 3;
  if (kind === "Reads" || kind === "Writes") return 2;
  return 1;
}

function baryOf(id, neighborIdx, edges) {
  let sum = 0,
    n = 0;
  for (const e of edges) {
    const other = e.from === id ? e.to : e.to === id ? e.from : null;
    if (other == null || !neighborIdx.has(other)) continue;
    sum += neighborIdx.get(other);
    n++;
  }
  return n ? sum / n : 0;
}

function separateBoxes(pos, nodeW, nodeH, gap) {
  const ids = [...pos.keys()];
  const minX = nodeW + gap;
  const minY = nodeH + gap;
  for (let t = 0; t < 36; t++) {
    let moved = false;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = pos.get(ids[i]),
          b = pos.get(ids[j]);
        const dx = a.x - b.x,
          dy = a.y - b.y;
        const ox = minX - Math.abs(dx);
        const oy = minY - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        if (ox < oy) {
          const s = (dx < 0 ? -1 : 1) * (ox / 2 + 0.5);
          a.x += s;
          b.x -= s;
        } else {
          const s = (dy === 0 ? (i % 2 ? 1 : -1) : dy < 0 ? -1 : 1) * (oy / 2 + 0.5);
          a.y += s;
          b.y -= s;
        }
      }
    }
    if (!moved) break;
  }
}

function separatePaintedCards(wrap, selector) {
  if (!wrap) return;
  const els = [...wrap.querySelectorAll(selector)];
  if (els.length < 2) return;
  const boxes = els.map((el) => ({
    el,
    x: parseFloat(el.style.left) || 0,
    y: parseFloat(el.style.top) || 0,
    w: Math.max(el.offsetWidth || 0, 48),
    h: Math.max(el.offsetHeight || 0, 32),
  }));
  for (let t = 0; t < 24; t++) {
    let moved = false;
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i],
          b = boxes[j];
        const dx = a.x - b.x,
          dy = a.y - b.y;
        const ox = (a.w + b.w) / 2 + 16 - Math.abs(dx);
        const oy = (a.h + b.h) / 2 + 12 - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        if (ox < oy) {
          const s = (dx < 0 ? -1 : 1) * (ox / 2 + 0.5);
          a.x += s;
          b.x -= s;
        } else {
          const s = (dy === 0 ? (i % 2 ? 1 : -1) : dy < 0 ? -1 : 1) * (oy / 2 + 0.5);
          a.y += s;
          b.y -= s;
        }
      }
    }
    if (!moved) break;
  }
  let maxX = 0,
    maxY = 0;
  for (const box of boxes) {
    box.el.style.left = box.x + "px";
    box.el.style.top = box.y + "px";
    maxX = Math.max(maxX, box.x + box.w / 2);
    maxY = Math.max(maxY, box.y + box.h / 2);
  }
  const pad = 48;
  const W = Math.max(parseFloat(wrap.style.width) || 0, maxX + pad);
  const H = Math.max(parseFloat(wrap.style.height) || 0, maxY + pad);
  wrap.style.width = Math.round(W) + "px";
  wrap.style.height = Math.round(H) + "px";
  syncGraphEdges(wrap);
}

/** Sugiyama-lite: ranks by hop depth, barycenter order, boxes that never sit on each other. */
function layeredPositions(ids, rawEdges, opts) {
  opts = opts || {};
  const nodeW = opts.nodeW || 196;
  const nodeH = opts.nodeH || 72;
  const gapX = opts.gapX || 80;
  const gapY = opts.gapY || 40;
  const pad = opts.pad || 48;
  const list = (ids || []).map((id) => String(idVal(id)));
  const idSet = new Set(list);
  const edges = [];
  for (const e of rawEdges || []) {
    const a = String(idVal(e.from)),
      b = String(idVal(e.to));
    if (!idSet.has(a) || !idSet.has(b) || a === b) continue;
    edges.push({ from: a, to: b, kind: e.kind || "Calls" });
  }
  const incoming = new Map(list.map((id) => [id, 0]));
  const outs = new Map(list.map((id) => [id, []]));
  for (const e of edges) {
    incoming.set(e.to, (incoming.get(e.to) || 0) + 1);
    (outs.get(e.from) || []).push(e.to);
  }
  let sources = list.filter((id) => incoming.get(id) === 0);
  if (!sources.length && list.length) sources = [list[0]];
  const rank = new Map();
  const q = sources.map((id) => [id, 0]);
  const seen = new Set();
  while (q.length) {
    const [id, d] = q.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    rank.set(id, d);
    for (const n of outs.get(id) || []) q.push([n, d + 1]);
  }
  for (const id of list) if (!rank.has(id)) rank.set(id, 0);
  const buckets = [];
  for (const id of list) {
    const r = rank.get(id);
    while (buckets.length <= r) buckets.push([]);
    buckets[r].push(id);
  }
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 1; i < buckets.length; i++) {
      const prevIdx = new Map(buckets[i - 1].map((id, j) => [id, j]));
      buckets[i].sort((a, b) => baryOf(a, prevIdx, edges) - baryOf(b, prevIdx, edges) || a.localeCompare(b));
    }
    for (let i = buckets.length - 2; i >= 0; i--) {
      const nextIdx = new Map(buckets[i + 1].map((id, j) => [id, j]));
      buckets[i].sort((a, b) => baryOf(a, nextIdx, edges) - baryOf(b, nextIdx, edges) || a.localeCompare(b));
    }
  }
  const colW = nodeW + gapX;
  const rowH = nodeH + gapY;
  const maxCols = Math.max(1, opts.maxCols || 7);
  const maxRows = buckets.reduce((m, c) => Math.max(m, c.length), 1);
  const pack = maxRows > 4 || buckets.length > maxCols;
  const pos = new Map();
  if (!pack) {
    const H0 = Math.max(opts.minH || 280, pad * 2 + maxRows * rowH);
    buckets.forEach((col, i) => {
      const colH = col.length * rowH;
      const y0 = (H0 - colH) / 2 + rowH / 2;
      col.forEach((id, j) => {
        pos.set(id, { x: pad + colW * i + nodeW / 2, y: y0 + j * rowH });
      });
    });
  } else {
    const order = [];
    buckets.forEach((col) => col.forEach((id) => order.push(id)));
    const cols = Math.min(maxCols, Math.max(1, order.length));
    order.forEach((id, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      pos.set(id, { x: pad + colW * c + nodeW / 2, y: pad + rowH * r + nodeH / 2 });
    });
  }
  const pins = opts.pins || pinsForCurrent();
  for (const [id, p] of pos) {
    const pin = pins.get(id);
    if (pin) {
      p.x = pin.x;
      p.y = pin.y;
    }
  }
  separateBoxes(pos, nodeW, nodeH, 18);
  let minX = Infinity,
    minY = Infinity,
    maxX = 0,
    maxY = 0;
  for (const p of pos.values()) {
    minX = Math.min(minX, p.x - nodeW / 2);
    minY = Math.min(minY, p.y - nodeH / 2);
    maxX = Math.max(maxX, p.x + nodeW / 2);
    maxY = Math.max(maxY, p.y + nodeH / 2);
  }
  if (!pos.size) {
    minX = 0;
    minY = 0;
  }
  const dx = pad - minX,
    dy = pad - minY;
  if (dx || dy) for (const p of pos.values()) {
    p.x += dx;
    p.y += dy;
  }
  const W = Math.max(opts.minW || 720, maxX + dx + pad);
  const H = Math.max(opts.minH || 280, maxY + dy + pad);
  return { W: Math.round(W), H: Math.round(H), pos, rank };
}

function communityEdgeList(clusters) {
  const memberTo = new Map();
  for (const b of clusters || []) {
    const bid = idVal(b.id);
    for (const m of b.members || []) memberTo.set(idVal(m), bid);
  }
  const counts = new Map();
  for (const e of (snapshot && snapshot.graph && snapshot.graph.edges) || []) {
    const a = memberTo.get(idVal(e.from)),
      b = memberTo.get(idVal(e.to));
    if (!a || !b || a === b) continue;
    const kind = e.kind || "Calls";
    const k = a + "\t" + b;
    const cur = counts.get(k);
    const w = kindWeight(kind);
    if (!cur || w > cur.w || (w === cur.w && (cur.count || 0) < 1)) {
      counts.set(k, { from: a, to: b, kind, w, count: (cur && cur.count) + 1 || 1 });
    } else {
      cur.count += 1;
      if (w > cur.w) {
        cur.kind = kind;
        cur.w = w;
      }
    }
  }
  const byFrom = new Map();
  for (const e of counts.values()) {
    if (!byFrom.has(e.from)) byFrom.set(e.from, []);
    byFrom.get(e.from).push(e);
  }
  const out = [];
  for (const list of byFrom.values()) {
    list.sort((a, b) => b.count - a.count || b.w - a.w);
    out.push(...list.slice(0, 2));
  }
  return out;
}

function hopEndAttrs(e) {
  if (!e || e.hopFrom == null || e.hopTo == null) return "";
  const a = idVal(e.hopFrom);
  const b = idVal(e.hopTo);
  if (!a || !b) return "";
  return ' data-hop-from="' + a + '" data-hop-to="' + b + '"';
}

function stampHopEnds(el, e) {
  if (!el) return;
  const a = e && e.hopFrom != null ? idVal(e.hopFrom) : "";
  const b = e && e.hopTo != null ? idVal(e.hopTo) : "";
  if (a && b) {
    el.setAttribute("data-hop-from", a);
    el.setAttribute("data-hop-to", b);
  } else {
    el.removeAttribute("data-hop-from");
    el.removeAttribute("data-hop-to");
  }
}

/** Story steps are the derived tree hops that cross communities, not a Calls label on bubble ids. */
function storySpineEdges(pathIds) {
  const flow = storyFlow();
  const walk = flowWalk(flow);
  const treeEdges = (flow && flow.tree && flow.tree.edges) || [];
  const shown = mapAltitudeBubbles();
  const bubbleOfId = (id) => {
    const b = shown.find((bub) => (bub.members || []).some((m) => idVal(m) === idVal(id)));
    return b ? idVal(b.id) : "";
  };
  const want = new Set(pathIds || []);
  const out = [];
  const seen = new Set();
  const push = (a, b, kind, hopFrom, hopTo) => {
    if (!a || !b || a === b || !want.has(a) || !want.has(b) || !kind || !hopFrom || !hopTo) return;
    const key = a + "\t" + b + "\t" + kind + "\t" + hopFrom + "\t" + hopTo;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ from: a, to: b, kind, hopFrom, hopTo });
  };
  for (let i = 0; i < walk.length - 1; i++) {
    const aNode = idVal(walk[i]);
    const bNode = idVal(walk[i + 1]);
    let kind = "";
    let hopFrom = aNode;
    let hopTo = bNode;
    for (const e of treeEdges) {
      const ef = idVal(e.from);
      const et = idVal(e.to);
      if (ef === aNode && et === bNode) {
        kind = e.kind || "Calls";
        break;
      }
      if (ef === bNode && et === aNode) {
        kind = e.kind || "Calls";
        hopFrom = ef;
        hopTo = et;
        break;
      }
    }
    push(bubbleOfId(aNode), bubbleOfId(bNode), kind, hopFrom, hopTo);
  }
  for (const e of treeEdges) {
    const ef = idVal(e.from);
    const et = idVal(e.to);
    push(bubbleOfId(ef), bubbleOfId(et), e.kind || "Calls", ef, et);
  }
  return out;
}

function edgeSvg(cls, edges, pos, W, H) {
  let svg =
    '<svg class="' +
    cls +
    '" viewBox="0 0 ' +
    W +
    " " +
    H +
    '" width="' +
    W +
    '" height="' +
    H +
    '">';
  for (const e of edges || []) {
    const a = pos.get ? pos.get(idVal(e.from)) : pos[idVal(e.from)];
    const b = pos.get ? pos.get(idVal(e.to)) : pos[idVal(e.to)];
    if (!a || !b) continue;
    const kind = e.kind || "Calls";
    const hop = hopEndAttrs(e);
    const d = orthoPath(a, b);
    const mx = Math.round((a.x + b.x) / 2),
      my = Math.round((a.y + b.y) / 2) - 10;
    svg +=
      '<path class="edge-hit" data-from="' +
      idVal(e.from) +
      '" data-to="' +
      idVal(e.to) +
      '" data-kind="' +
      esc(kind) +
      '"' +
      hop +
      ' d="' +
      d +
      '" />';
    svg +=
      '<path data-from="' +
      idVal(e.from) +
      '" data-to="' +
      idVal(e.to) +
      '" data-kind="' +
      esc(kind) +
      '"' +
      hop +
      ' d="' +
      d +
      '" />';
    svg +=
      '<text class="ekind" x="' +
      mx +
      '" y="' +
      my +
      '" text-anchor="middle" data-from="' +
      idVal(e.from) +
      '" data-to="' +
      idVal(e.to) +
      '" data-kind="' +
      esc(kind) +
      '"' +
      hop +
      '>' +
      esc(kind) +
      (e.count > 1 ? " · " + e.count : "") +
      "</text>";
  }
  svg += "</svg>";
  return svg;
}

function syncGraphEdges(wrap) {
  if (!wrap) return;
  const posOf = (id) => {
    const escId =
      typeof CSS !== "undefined" && CSS.escape ? CSS.escape(String(id)) : String(id).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const el =
      wrap.querySelector('[data-id="' + escId + '"]') || wrap.querySelector('[data-bubble="' + escId + '"]');
    if (!el) return null;
    return { x: parseFloat(el.style.left), y: parseFloat(el.style.top) };
  };
  wrap.querySelectorAll("path[data-from][data-to]").forEach((p) => {
    const a = posOf(p.getAttribute("data-from"));
    const b = posOf(p.getAttribute("data-to"));
    if (!a || !b) return;
    p.setAttribute("d", orthoPath(a, b));
  });
  wrap.querySelectorAll("text.ekind").forEach((t) => {
    const a = posOf(t.getAttribute("data-from"));
    const b = posOf(t.getAttribute("data-to"));
    if (!a || !b) return;
    t.setAttribute("x", String(Math.round((a.x + b.x) / 2)));
    t.setAttribute("y", String(Math.round((a.y + b.y) / 2) - 10));
  });
  wrap.querySelectorAll("animateMotion").forEach((m) => {
    const path = m.getAttribute("path");
    const parent = m.closest("g");
    const from = parent && parent.previousElementSibling;
    // keep packet on the last matching path if present
    if (path && m.parentNode) {
      const hit = wrap.querySelector('path.edge[data-from], path[data-from]');
      if (hit) m.setAttribute("path", hit.getAttribute("d") || path);
    }
  });
}

function bindDraggable(root, selector, opts) {
  opts = opts || {};
  if (!root) return;
  root.querySelectorAll(selector).forEach((el) => {
    if (el.dataset.dragBound) return;
    el.dataset.dragBound = "1";
    el.title = (el.title ? el.title + " · " : "") + "Drag to move · click to open";
    let start = null;
    const moveTo = (ev) => {
      if (!start) return;
      const k = cam && cam.k ? cam.k : 1;
      const dx = (ev.clientX - start.x) / k;
      const dy = (ev.clientY - start.y) / k;
      if (!start.moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 4) return;
      start.moved = true;
      el.dataset.didDrag = "1";
      const nx = start.left + dx,
        ny = start.top + dy;
      el.style.left = nx + "px";
      el.style.top = ny + "px";
      if (start.id) pinNode(start.id, nx, ny);
      syncGraphEdges(root);
    };
    const end = () => {
      if (!start) return;
      el.classList.remove("dragging");
      start = null;
      window.removeEventListener("pointermove", moveTo, true);
      window.removeEventListener("pointerup", end, true);
      window.removeEventListener("pointercancel", end, true);
    };
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const id = el.getAttribute(opts.idAttr || "data-id") || el.getAttribute("data-bubble");
      start = {
        x: e.clientX,
        y: e.clientY,
        left: parseFloat(el.style.left) || 0,
        top: parseFloat(el.style.top) || 0,
        id,
        moved: false,
      };
      try {
        el.setPointerCapture(e.pointerId);
      } catch (err) {}
      el.classList.add("dragging");
      window.addEventListener("pointermove", moveTo, true);
      window.addEventListener("pointerup", end, true);
      window.addEventListener("pointercancel", end, true);
    });
    el.addEventListener(
      "click",
      (e) => {
        if (el.dataset.didDrag === "1") {
          e.preventDefault();
          e.stopPropagation();
          el.dataset.didDrag = "";
          return;
        }
        const id = el.getAttribute(opts.idAttr || "data-id") || el.getAttribute("data-bubble");
        if (opts.onClick) opts.onClick(id, el, e);
      },
      true
    );
  });
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
  flashToast("Stamped " + flow + " · holds", "holds");
  flashBtn(stampBtn, "flash-holds");
  // S1bx — stamp/skip remount while Evidence open: keepCam + soft-stay (no wipe-then-zoom).
  const evidenceStay =
    typeof evidenceScrollDriveStayLive === "function" && evidenceScrollDriveStayLive();
  if (evidenceStay && scrollDriveBase && typeof stashScrollDriveLastStay === "function") {
    stashScrollDriveLastStay();
  }
  if (evidenceStay && typeof stageFitRo !== "undefined" && stageFitRo) {
    stageFitRo.disconnect();
    stageFitRo = null;
  }
  paint({ animate: "none", keepCam: !!evidenceStay });
  if (evidenceStay && typeof softStayScrollDriveAcrossDeskRemount === "function") {
    softStayScrollDriveAcrossDeskRemount();
  }
}

function requestSkip(name) {
  const flow = name || (currentFlow() && currentFlow().name);
  if (!flow) return;
  if (skippedFlows.indexOf(flow) < 0) skippedFlows.push(flow);
  if (snapshot && (snapshot.skipped || []).indexOf(flow) < 0) {
    snapshot.skipped = (snapshot.skipped || []).concat([flow]);
  }
  vscode.postMessage({ type: "skip", flow });
  flashToast("Skipped " + flow, "skip");
  flashBtn(skipBtn, "flash-skip");
  // S1bx — stamp/skip remount while Evidence open: keepCam + soft-stay (no wipe-then-zoom).
  const evidenceStay =
    typeof evidenceScrollDriveStayLive === "function" && evidenceScrollDriveStayLive();
  if (evidenceStay && scrollDriveBase && typeof stashScrollDriveLastStay === "function") {
    stashScrollDriveLastStay();
  }
  if (evidenceStay && typeof stageFitRo !== "undefined" && stageFitRo) {
    stageFitRo.disconnect();
    stageFitRo = null;
  }
  paint({ animate: "none", keepCam: !!evidenceStay });
  if (evidenceStay && typeof softStayScrollDriveAcrossDeskRemount === "function") {
    softStayScrollDriveAcrossDeskRemount();
  }
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

function changedIdSet() {
  const out = new Set();
  const cov = (snapshot && snapshot.coverage) || {};
  for (const id of cov.changed || []) out.add(idVal(id));
  const facts = (snapshot && snapshot.delta && snapshot.delta.facts) || [];
  if (facts.length) {
    const byFqn = new Map();
    for (const n of (snapshot.graph && snapshot.graph.nodes) || []) {
      if (n && n.fqn) byFqn.set(n.fqn, idVal(n.id));
    }
    for (const f of facts) {
      if (f.status !== "added" && f.status !== "changed") continue;
      if (f.id) out.add(idVal(f.id));
      if (f.fqn && byFqn.has(f.fqn)) out.add(byFqn.get(f.fqn));
    }
  }
  return out;
}

function nodeFlags(id) {
  const sid = idVal(id);
  const cov = (snapshot && snapshot.coverage) || {};
  const uncovered = (cov.uncovered || []).some((x) => idVal(x) === sid);
  const changed = changedIdSet().has(sid);
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
  const sid = idVal(id);
  sourceId = sid;
  const node = nodeById.get(sid);
  const bag = (snapshot && snapshot.snippets) || {};
  const local = bag[sid] || bag[id];
  const span = (node && node.span) || {};
  const line = (span.start && span.start.line) || span.line;
  const file = span.file || "";
  if (local) {
    showSource({
      id: sid,
      fqn: (node && node.fqn) || sid,
      kind: node && node.kind,
      file,
      line,
      ...(typeof local === "string" ? { text: local, preview: local } : local),
    });
  } else if (node) {
    showSource({
      id: sid,
      fqn: node.fqn || sid,
      kind: node.kind,
      file,
      line,
      endLine: (span.end && span.end.line) || span.endLine,
      text: "",
      preview: "",
    });
  }
  vscode.postMessage({ type: "peekSource", id: sid });
}

function revealSourcePane() {
  if (!sourcePane) return;
  if (llmPane && !llmPane.hidden && typeof setLlmPane === "function") setLlmPane(false);
  if (keysPane && !keysPane.hidden && typeof setKeysPane === "function") setKeysPane(false);
  if (exportMenu && !exportMenu.hidden && typeof setExportMenu === "function") setExportMenu(false);
  if (lensOpen && typeof setLensOpen === "function") setLensOpen(false);
  if (routeOpen && typeof setRouteOpen === "function") setRouteOpen(false);
  if (typeof applyPresent === "function") applyPresent(false);
  if (typeof hideTip === "function") hideTip();
  if (toastEl) {
    toastEl.classList.remove("on");
    toastEl.hidden = true;
  }
  sourcePane.hidden = false;
  if (workspace) workspace.classList.add("has-source");
  // S1ae — always schedule; soft stay in showSource one-shot-suppresses the rAF
  // fit (+ disconnects RO) so Present→Evidence restore is not wiped. Cold open fits.
  refitChartSoon();
}

function showSource(msg, opts) {
  if (!sourcePane) return;
  // S1ab — host may stamp workspaceFolder on source / flowchart posts.
  if (msg && (msg.workspaceFolder != null || msg.workspaceRoot != null || msg.ws != null)) {
    if (typeof setScrollDriveWorkspaceKey === "function") {
      setScrollDriveWorkspaceKey(msg.workspaceFolder != null ? msg.workspaceFolder : msg.workspaceRoot != null ? msg.workspaceRoot : msg.ws);
    }
  }
  if (msg.missing) {
    revealSourcePane();
    if (srcTitle) srcTitle.textContent = "No span for this node";
    if (srcBody) srcBody.textContent = "";
    return;
  }
  // peekSource assigns sourceId before calling showSource — track last *rendered*
  // id separately so local file hops stay on the S1v path.
  const nextSid = msg.id != null && String(msg.id) ? String(msg.id) : sourceId ? String(sourceId) : "";
  const prevShown = scrollDriveLastShownSourceId ? String(scrollDriveLastShownSourceId) : "";
  const sameSourceRepost = !!(prevShown && nextSid && prevShown === nextSid);
  // Only the extension-host message path uses the S1ab host-repost helper; peekSource
  // local opens keep S1v/S1w behavior unchanged.
  const fromHost = !!(opts && opts.fromHost);
  sourceId = nextSid || sourceId;
  revealSourcePane();
  const where = msg.file ? shortFile(msg.file) + (msg.line ? ":" + msg.line : "") : "";
  if (srcTitle) srcTitle.textContent = (shortOf(msg.fqn) || "source") + (where ? " · " + where : "");
  fillInspect(msg);
  if (srcBody) srcBody.innerHTML = renderSourceLines(msg);
  const hot = srcBody && srcBody.querySelector(".src-line.hot");
  if (hot && typeof hot.scrollIntoView === "function") hot.scrollIntoView({ block: "center" });
  // S1v — soft stay across Evidence file switch when a prior ScrollDrive session
  // was active; S1w/S1aa — same-source soft restore after Present/close/reload;
  // S1ab — host re-post of `source` (post-reload peek reply) soft-restores from
  // scoped storage even when in-memory snap is empty, without an S1v file-hop clear.
  // First-ever open (no base / no snapshot) still clears so flush may zoomToEl.
  // Present is already exited by revealSourcePane.
  let softStayed = false;
  // Prefer S1w/S1aa/S1ab same-source restore when no live base (Present/close/reload).
  if (
    !scrollDriveBase &&
    typeof softRestoreScrollDriveFromLastStay === "function" &&
    softRestoreScrollDriveFromLastStay(sourceId)
  ) {
    softStayed = true;
  } else if (
    fromHost &&
    sameSourceRepost &&
    typeof softStayScrollDriveAcrossHostSourceRepost === "function" &&
    softStayScrollDriveAcrossHostSourceRepost(nextSid)
  ) {
    softStayed = true;
  } else if (
    typeof softStayScrollDriveAcrossSourceHop === "function" &&
    softStayScrollDriveAcrossSourceHop()
  ) {
    softStayed = true;
  }
  // S1ao — harness-visible: Evidence reopen after Review-during-Present wipe
  // must report softStayed false (cold hard path; lastStay empty).
  if (typeof window !== "undefined") {
    window.__graphideScrollDriveShowSourceSoftStayed = !!softStayed;
  }
  if (softStayed) {
    // S1ae — suppress revealSourcePane rAF fit + drop scheduleFit RO so soft
    // restore / hop is not wipe-then-fit (same RO disconnect pattern as S1y).
    scrollDriveSuppressNextRefit = true;
    if (typeof stageFitRo !== "undefined" && stageFitRo) {
      stageFitRo.disconnect();
      stageFitRo = null;
    }
    if (typeof onSrcBodyScroll === "function") onSrcBodyScroll();
  } else if (typeof resetScrollDrive === "function") {
    // S1af — cold open ends Review-clear honesty cue.
    if (typeof clearScrollDriveReviewStayClearedCue === "function") clearScrollDriveReviewStayClearedCue();
    scrollDriveBase = null;
    scrollDriveTargetLocked = "";
    scrollDriveCamXSettled = false;
    scrollDriveCamYSettled = false;
    if (typeof onSrcBodyScroll === "function") onSrcBodyScroll();
  }
  // S1ab — record what we rendered so a later host re-post of the same id is detected.
  if (nextSid) scrollDriveLastShownSourceId = nextSid;
}

function showHop(from, to, kind, opts) {
  const a = idVal(from),
    b = idVal(to);
  const edge = graphEdge(a, b, kind);
  const k = (edge && edge.kind) || kind || "Calls";
  const span = (edge && edge.span) || {};
  const where = span.file
    ? shortFile(span.file) + (span.start && span.start.line ? ":" + span.start.line : span.line ? ":" + span.line : "")
    : "";
  revealSourcePane();
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
  if (!opts || opts.select !== false) selectNode(b, { peek: true });
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

/** BFS walk of a Steiner tree from its sources — the control-flow path of a run. */
function flowWalk(flow) {
  const nodes = (flow && flow.tree && flow.tree.nodes) || [];
  const edges = (flow && flow.tree && flow.tree.edges) || [];
  if (!nodes.length) return [];
  const kids = new Map();
  for (const e of edges) {
    const a = idVal(e.from),
      b = idVal(e.to);
    if (!kids.has(a)) kids.set(a, []);
    kids.get(a).push(b);
  }
  const ids = new Set(nodes.map((n) => idVal(n)));
  const incoming = new Set(edges.map((e) => idVal(e.to)));
  const sources = nodes.map((n) => idVal(n)).filter((id) => !incoming.has(id));
  const start = sources.length ? sources : [idVal(nodes[0])];
  const seen = new Set();
  const walk = [];
  const q = start.slice();
  while (q.length) {
    const id = q.shift();
    if (!ids.has(id) || seen.has(id)) continue;
    seen.add(id);
    walk.push(id);
    for (const t of kids.get(id) || []) q.push(t);
  }
  for (const n of nodes) {
    const id = idVal(n);
    if (!seen.has(id)) walk.push(id);
  }
  return walk;
}

function steinerOfWalk(walk, id) {
  if (!walk || !walk.length) return "";
  const nid = String(id);
  if (nid === String(walk[0])) return "start";
  if (walk.length > 1 && nid === String(walk[walk.length - 1])) return "end";
  return "";
}

function storyFlow() {
  return defaultRunFlow() || currentFlow();
}

/** Unique communities along the control-flow walk — start → features → end. */
function featurePath(flow) {
  const f = flow || storyFlow();
  const seen = new Set();
  const path = [];
  for (const id of flowWalk(f)) {
    const b = bubbleOf(id);
    if (!b) continue;
    const bid = idVal(b.id);
    if (seen.has(bid)) continue;
    seen.add(bid);
    path.push(b);
  }
  return path;
}

function featureRole(step, last) {
  if (step === 0) return "START";
  if (last > 0 && step === last) return "END";
  if (step >= 0) return "STEP " + (step + 1);
  return "";
}

function bindStoryRail() {
  canvas.querySelectorAll(".story-rail [data-feature]").forEach((el) => {
    el.onclick = () => {
      stopPathWalk();
      selectedNodeId = null;
      explorerWs = "map";
      explorerPinned = true;
      enterMapBubble(el.getAttribute("data-feature"));
    };
  });
  canvas.querySelectorAll(".story-rail [data-hop]").forEach((el) => {
    el.onclick = () => {
      stopPathWalk();
      const id = el.getAttribute("data-hop");
      selectedNodeId = id;
      const story = storyFlow();
      if (story && story.name) flowName = story.name;
      explorerWs = "slice";
      explorerPinned = true;
      paint({ animate: "none" });
      selectNode(id);
    };
  });
}

/** Communities on the Map cut that contain the control-flow walk. */
function storyMapBubbles() {
  const shown = mapAltitudeBubbles();
  if (!shown.length) return featurePath(storyFlow());
  const seen = new Set();
  const path = [];
  for (const id of flowWalk(storyFlow())) {
    const b = shown.find((bub) => (bub.members || []).some((m) => idVal(m) === idVal(id)));
    if (!b) continue;
    const bid = idVal(b.id);
    if (seen.has(bid)) continue;
    seen.add(bid);
    path.push(b);
  }
  return path.length ? path : featurePath(storyFlow());
}

function storyRailPath() {
  if (explorerWs === "map" && !enterCanvasActive()) return storyMapBubbles();
  return featurePath(storyFlow());
}


/** ADE SBC — primary ROUTE_KINDS verb between two nodes (tree then graph; from→to then reverse). */
function primaryIncidentVerb(fromId, toId) {
  const a = idVal(fromId),
    b = idVal(toId);
  if (!a || !b || a === b) return "";
  const flow = storyFlow();
  const lists = [
    (flow && flow.tree && flow.tree.edges) || [],
    (snapshot && snapshot.graph && snapshot.graph.edges) || [],
  ];
  for (const edges of lists) {
    for (const e of edges) {
      if (!e || !ROUTE_KINDS[e.kind]) continue;
      if (idVal(e.from) === a && idVal(e.to) === b) return String(e.kind);
    }
  }
  for (const edges of lists) {
    for (const e of edges) {
      if (!e || !ROUTE_KINDS[e.kind]) continue;
      if (idVal(e.from) === b && idVal(e.to) === a) return String(e.kind);
    }
  }
  return "";
}

/** ADE SBC — derived behavior caption from IR only (kind · role/channel · verb toward next). */
function storyBehaviorCaption(nodeId, nextNodeId) {
  const sid = idVal(nodeId);
  if (!sid) return "";
  const node = nodeById.get(sid);
  if (!node) return "";
  const parts = [];
  if (node.kind) parts.push(String(node.kind));
  const ep = endpointOf(sid);
  if (ep) {
    if (ep.role) parts.push(String(ep.role));
    if (ep.channel) parts.push(String(ep.channel));
  }
  if (nextNodeId) {
    const verb = primaryIncidentVerb(sid, nextNodeId);
    if (verb) parts.push(verb);
  }
  return parts.join(" · ");
}

function storyHopStops() {
  const hops = [];
  const seen = new Set();
  for (const id of flowWalk(storyFlow())) {
    const sid = idVal(id);
    if (seen.has(sid)) continue;
    seen.add(sid);
    const n = nodeById.get(sid);
    hops.push({
      id: sid,
      label: n ? shortOf(n.fqn) || n.fqn || sid : sid,
      kind: "hop",
      caption: "",
    });
  }
  for (let i = 0; i < hops.length; i++) {
    const next = hops[i + 1];
    hops[i].caption = storyBehaviorCaption(hops[i].id, next ? next.id : "");
  }
  return hops;
}

function storyRailStops() {
  const comm = storyRailPath();
  const featureStops = (list) => {
    const stops = list.map((b) => ({
      id: idVal(b.id),
      label: b.label,
      kind: "feature",
      caption: "",
      members: b.members || [],
    }));
    for (let i = 0; i < stops.length; i++) {
      const mems = stops[i].members || [];
      const from = mems.length ? idVal(mems[0]) : "";
      let to = "";
      for (let j = i + 1; j < stops.length; j++) {
        const nm = stops[j].members || [];
        if (nm.length) {
          to = idVal(nm[0]);
          break;
        }
      }
      // Prefer a walk member that sits on this bubble when walk is available.
      let walkFrom = from;
      let walkTo = to;
      const walk = flowWalk(storyFlow());
      if (walk.length) {
        const inBubble = (bid, nid) => {
          const bub = findBubble(bid);
          return !!(bub && (bub.members || []).some((m) => idVal(m) === idVal(nid)));
        };
        for (const wid of walk) {
          if (inBubble(stops[i].id, wid)) {
            walkFrom = idVal(wid);
            break;
          }
        }
        if (to) {
          for (let j = i + 1; j < stops.length; j++) {
            for (const wid of walk) {
              if (inBubble(stops[j].id, wid)) {
                walkTo = idVal(wid);
                break;
              }
            }
            if (walkTo) break;
          }
        }
      }
      stops[i].caption = storyBehaviorCaption(walkFrom || from, walkTo || to);
    }
    return stops;
  };
  if (comm.length >= 2) return featureStops(comm);
  const hops = storyHopStops();
  if (hops.length >= 2) return hops;
  return featureStops(comm);
}

function pinStoryClusters(clusters) {
  const path = storyMapBubbles();
  const byId = new Map();
  for (const b of path) byId.set(idVal(b.id), b);
  for (const b of clusters || []) byId.set(idVal(b.id), b);
  return [...byId.values()];
}


/** ADE SBC — feat-chip inner HTML with optional derived behavior caption. */
function storyChipInnerHtml(stop, i, pathLen) {
  const name = shortOf(stop.label) || "feature";
  const label = i === 0 ? "START · " + name : i === pathLen - 1 ? "END · " + name : name;
  const caption = stop.caption ? String(stop.caption) : "";
  const title = caption ? label + " · " + caption : label;
  const capHtml = caption
    ? '<span class="feat-chip-caption">' + esc(caption) + "</span>"
    : "";
  return { label, title, caption, capHtml };
}

function renderStoryRailHtml() {
  const path = storyRailStops();
  if (!path.length) return "";
  const chips = path
    .map((stop, i) => {
      const role = i === 0 ? "start" : i === path.length - 1 ? "end" : "";
      const hop = stop.kind === "hop";
      const here = hop
        ? selectedNodeId && idVal(selectedNodeId) === idVal(stop.id)
          ? " here"
          : ""
        : graphFilter.bubble && idVal(stop.id) === idVal(graphFilter.bubble)
          ? " here"
          : "";
      const inner = storyChipInnerHtml(stop, i, path.length);
      return (
        (i ? '<span class="path-arrow">→</span>' : "") +
        '<button type="button" class="feat-chip' +
        (role ? " " + role : "") +
        here +
        '" title="' +
        esc(inner.title) +
        '" ' +
        (inner.caption ? 'data-sbc-caption="1" ' : "") +
        (hop ? "data-hop" : "data-feature") +
        '="' +
        esc(idVal(stop.id)) +
        '"><span class="feat-chip-name">' +
        esc(inner.label) +
        "</span>" +
        inner.capHtml +
        "</button>"
      );
    })
    .join("");
  return (
    '<div class="story-rail" id="storyRail">' +
    '<div class="story-rail-label">Start → features → end</div>' +
    '<div class="story-rail-row">' +
    chips +
    "</div></div>"
  );
}

function renderFeaturePathHtml() {
  const path = storyRailStops();
  if (!path.length) return "";
  const chips = path
    .map((stop, i) => {
      const role = i === 0 ? "start" : i === path.length - 1 ? "end" : "";
      const hop = stop.kind === "hop";
      const here = hop
        ? selectedNodeId && idVal(selectedNodeId) === idVal(stop.id)
          ? " here"
          : ""
        : graphFilter.bubble && idVal(stop.id) === idVal(graphFilter.bubble)
          ? " here"
          : "";
      const inner = storyChipInnerHtml(stop, i, path.length);
      return (
        (i ? '<span class="path-arrow">→</span>' : "") +
        '<button type="button" class="feat-chip' +
        (role ? " " + role : "") +
        here +
        '" style="--i:' +
        i +
        '" title="' +
        esc(inner.title) +
        '" ' +
        (inner.caption ? 'data-sbc-caption="1" ' : "") +
        (hop ? "data-hop" : "data-feature") +
        '="' +
        esc(idVal(stop.id)) +
        '"><span class="feat-chip-name">' +
        esc(inner.label) +
        "</span>" +
        inner.capHtml +
        "</button>"
      );
    })
    .join("");
  return (
    '<div class="feature-path">' +
    '<div class="feature-path-head">' +
    '<div class="feature-path-label">Start → features → end</div>' +
    '<div class="path-walk" role="group" aria-label="Walk the feature path">' +
    '<button type="button" id="pathWalkPrev" title="Previous feature ([)">Prev</button>' +
    '<button type="button" id="pathWalkBtn" title="Play start → features → end (P)">Play</button>' +
    '<button type="button" id="pathWalkNext" title="Next feature (])">Next</button>' +
    '<span id="pathWalkMeta"></span>' +
    "</div></div>" +
    '<div class="feature-path-row">' +
    chips +
    "</div></div>"
  );
}

function pathWalkStops() {
  return storyRailStops();
}

function focusWalkStop(stop) {
  if (!stop) return;
  // ADE SBC — Start→features→end walk stays graph-only (no Evidence / peekSource).
  // Mirror prior hop path (selectedNodeId only) without peekSource / selectNode side effects.
  if (stop.kind === "hop") {
    selectedNodeId = idVal(stop.id);
    return;
  }
  const bub = findBubble(stop.id);
  const mem = bub && (bub.members || [])[0];
  if (mem) selectedNodeId = idVal(mem);
}

function stopPathWalk() {
  pathWalk.playing = false;
  if (pathWalk.timer) {
    clearInterval(pathWalk.timer);
    pathWalk.timer = 0;
  }
  applyPathWalkPaint();
}

/** ADE SBC / harness — clear walk index + .walk/.here paint (does not open Evidence). */
function resetPathWalk() {
  pathWalk.playing = false;
  if (pathWalk.timer) {
    clearInterval(pathWalk.timer);
    pathWalk.timer = 0;
  }
  pathWalk.i = -1;
  applyPathWalkPaint();
  document.querySelectorAll(".walk").forEach((el) => el.classList.remove("walk"));
  // Drop selection-driven .here on story chips only when walk is idle.
  document.querySelectorAll(".feat-chip.here").forEach((el) => el.classList.remove("here"));
  selectedNodeId = null;
  const meta = document.getElementById("pathWalkMeta");
  if (meta) meta.textContent = "";
  const play = document.getElementById("pathWalkBtn");
  if (play) {
    play.classList.remove("on");
    play.textContent = "Play";
  }
}
if (typeof window !== "undefined") window.__graphideResetPathWalk = resetPathWalk;


function stepPathWalk(delta) {
  const stops = pathWalkStops();
  if (!stops.length) return;
  let i = pathWalk.i + delta;
  if (i < 0) i = 0;
  if (i >= stops.length) {
    i = stops.length - 1;
    stopPathWalk();
  }
  pathWalk.i = i;
  applyPathWalkPaint();
  focusWalkStop(stops[i]);
}

function togglePathWalk() {
  if (pathWalk.playing) {
    const stops = pathWalkStops();
    stopPathWalk();
    if (pathWalk.i >= 0) {
      flashToast("Paused · " + (pathWalk.i + 1) + "/" + stops.length, "ok");
    }
    return;
  }
  const stops = pathWalkStops();
  if (!stops.length) {
    flashToast("No start → features → end path yet", "skip");
    return;
  }
  const replay = pathWalk.i >= stops.length - 1;
  if (pathWalk.i < 0 || replay) pathWalk.i = -1;
  if (reduceMotion()) {
    stepPathWalk(1);
    return;
  }
  pathWalk.playing = true;
  flashToast(replay ? "Replaying start → features → end" : "Walking start → features → end", "ok");
  stepPathWalk(1);
  pathWalk.timer = setInterval(() => {
    const next = pathWalkStops();
    if (pathWalk.i >= next.length - 1) {
      stopPathWalk();
      flashToast("End · start → features → end", "ok");
      return;
    }
    stepPathWalk(1);
  }, 720);
}

function applyPathWalkPaint() {
  const stops = pathWalkStops();
  const cur = pathWalk.i >= 0 ? stops[pathWalk.i] : null;
  const bid = cur ? idVal(cur.id) : "";
  document.querySelectorAll(".feat-chip").forEach((el) => {
    const on =
      !!bid &&
      (el.getAttribute("data-feature") === bid || el.getAttribute("data-hop") === bid);
    el.classList.toggle("walk", on);
    if (on) el.classList.add("here");
  });
  document.querySelectorAll(".bubble-card").forEach((el) => {
    const bub = el.getAttribute("data-bubble");
    const own = bubbleOf(bid);
    el.classList.toggle(
      "walk",
      !!bid && (bub === bid || !!(own && idVal(own.id) === bub))
    );
  });
  document.querySelectorAll(".vnode, .comm-node").forEach((el) => {
    const id = el.getAttribute("data-id");
    const b = id ? bubbleOf(id) : null;
    el.classList.toggle("walk", !!(bid && (id === bid || (b && idVal(b.id) === bid))));
  });
  stampXyFlowAttrs();
  document.querySelectorAll(".comm-edges path, svg.steiner .edge, .react-flow__edge").forEach((p) => {
    if (!bid) {
      p.classList.remove("walk");
      return;
    }
    const a = p.getAttribute("data-from");
    const t = p.getAttribute("data-to");
    const ba = a && bubbleOf(a);
    const bt = t && bubbleOf(t);
    const hot = !!(
      (ba && idVal(ba.id) === bid) ||
      (bt && idVal(bt.id) === bid) ||
      p.getAttribute("data-from") === bid ||
      p.getAttribute("data-to") === bid
    );
    p.classList.toggle("walk", hot);
    if (hot) p.classList.add("hot");
  });
  const play = document.getElementById("pathWalkBtn");
  if (play) {
    play.classList.toggle("on", !!pathWalk.playing);
    play.textContent = pathWalk.playing ? "Pause" : "Play";
  }
  const metaEl = document.getElementById("pathWalkMeta");
  if (metaEl) {
    if (!cur) {
      metaEl.textContent = "";
    } else {
      const short = shortOf(cur.label) || "feature";
      metaEl.textContent = cur.caption
        ? pathWalk.i + 1 + "/" + stops.length + " · " + short + " · " + cur.caption
        : pathWalk.i + 1 + "/" + stops.length + " · " + short;
    }
  }
  refreshNowPill();
}

function bindPathWalk() {
  const play = document.getElementById("pathWalkBtn");
  const prev = document.getElementById("pathWalkPrev");
  const next = document.getElementById("pathWalkNext");
  if (play) play.onclick = () => togglePathWalk();
  if (prev)
    prev.onclick = () => {
      stopPathWalk();
      stepPathWalk(pathWalk.i < 0 ? 1 : -1);
    };
  if (next)
    next.onclick = () => {
      stopPathWalk();
      stepPathWalk(1);
    };
  applyPathWalkPaint();
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
  if (!text) {
    const span = msg.file
      ? shortFile(msg.file) + (msg.line ? ":" + msg.line : "")
      : "";
    return (
      '<div class="src-line"><span class="ln">—</span><span class="tx">' +
      esc(span ? "Span " + span + " · open Editor for the file" : "No snippet on this snapshot — inspect rows still hold") +
      "</span></div>"
    );
  }
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
  refitChartSoon();
  if (srcBody) srcBody.innerHTML = "";
  if (inspMeta) inspMeta.innerHTML = "";
  if (inspEdges) inspEdges.innerHTML = "";
  if (hopCard) {
    hopCard.hidden = true;
    hopCard.innerHTML = "";
  }
  // S1w — stash last soft-stay before wipe so Present→Evidence / reopen can restore.
  if (typeof stashScrollDriveLastStay === "function") stashScrollDriveLastStay();
  sourceId = null;
  scrollDriveLastShownSourceId = "";
  if (typeof resetScrollDrive === "function") resetScrollDrive();
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
  if (typeof applyCallPathPaint === "function") applyCallPathPaint();
  if (typeof syncCallPathStrip === "function") syncCallPathStrip();
  // S1v — while Evidence ScrollDrive has a live base on Slice, skip hard zoomToEl
  // so peekSource → showSource can soft-follow the new vnode (one camera path).
  // S1w — also skip when a same-source last-stay snapshot is fresh (Present→reopen
  // / Evidence close→reopen) even if the pane is still hidden mid-peek.
  if (opts && opts.zoomEl) {
    const presenting = typeof isPresenting === "function" && isPresenting();
    const lastStayMatch =
      typeof scrollDriveLastStayMatches === "function" && scrollDriveLastStayMatches(sid);
    const softHop =
      !presenting &&
      ((!!scrollDriveBase && sourcePane && !sourcePane.hidden) || lastStayMatch);
    if (!softHop) zoomToEl(opts.zoomEl, Math.min(CAM_MAX, Math.max(2.6, camTo.k * 1.45)));
    // showSource owns S1w softRestore (do not seed base here — that would make
    // softStayScrollDriveAcrossSourceHop treat Present→reopen as a file hop).
  }
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

function neighborhood(id, hops) {
  const start = id ? String(idVal(id)) : "";
  const seen = new Set();
  if (!start) return seen;
  seen.add(start);
  let frontier = [start];
  const depth = hops === 2 ? 2 : 1;
  for (let h = 0; h < depth; h++) {
    const next = [];
    for (const cur of frontier) {
      incidentEdges(cur).forEach((e) => {
        const other = e.from === cur ? e.to : e.from;
        if (seen.has(other)) return;
        seen.add(other);
        next.push(other);
      });
    }
    frontier = next;
  }
  return seen;
}

/** Graph distance from each node to the current Steiner tree (0 = on-tree). */
function treeDistanceMap(flow, hops) {
  const depth = hops == null ? 1 : hops;
  const dist = new Map();
  const q = [];
  for (const raw of (flow && flow.tree && flow.tree.nodes) || []) {
    const id = String(idVal(raw));
    if (!id || dist.has(id)) continue;
    dist.set(id, 0);
    q.push(id);
  }
  for (let i = 0; i < q.length; i++) {
    const cur = q[i];
    const d = dist.get(cur);
    if (d >= depth) continue;
    incidentEdges(cur).forEach((e) => {
      const other = e.from === cur ? e.to : e.from;
      if (!other || dist.has(other)) return;
      dist.set(other, d + 1);
      q.push(other);
    });
  }
  return dist;
}

function hopDistance(from, to) {
  const a = String(idVal(from)),
    b = String(idVal(to));
  if (!a || !b) return 99;
  if (a === b) return 0;
  const seen = new Set([a]);
  const q = [[a, 0]];
  for (let i = 0; i < q.length; i++) {
    const cur = q[i][0],
      d = q[i][1];
    if (cur === b) return d;
    incidentEdges(cur).forEach((e) => {
      const other = e.from === cur ? e.to : e.from;
      if (seen.has(other)) return;
      seen.add(other);
      q.push([other, d + 1]);
    });
  }
  return 99;
}

function stampXyFlowAttrs() {
  document.querySelectorAll(".react-flow__edge").forEach((el) => {
    const raw = el.getAttribute("data-id") || el.id || "";
    const id = raw.indexOf("xy:") === 0 ? raw : (raw.split("xy:")[1] ? "xy:" + raw.split("xy:")[1] : raw);
    if (id.indexOf("xy:") !== 0) return;
    const parts = id.slice(3).split(":");
    if (parts.length < 2) return;
    el.setAttribute("data-from", parts[0]);
    el.setAttribute("data-to", parts[1]);
    if (parts[2]) el.setAttribute("data-kind", parts[2]);
  });
}

/** Child community id → member node ids. Hops are on members; the card id is not. */
let shownMemberOf = new Map();

function noteShownMembers(nodes) {
  const next = new Map();
  for (const n of nodes || []) {
    const id = String(idVal(n.id));
    const members = [];
    for (const m of n.members || []) {
      const mid = String(idVal(m));
      if (!mid || mid === id) continue;
      members.push(mid);
    }
    if (id && members.length) next.set(id, members);
  }
  shownMemberOf = next;
}

function expandShown(id) {
  if (id == null || id === "") return [];
  const sid = String(id);
  const members = shownMemberOf.get(sid);
  if (!members || !members.length) return [sid];
  return [sid].concat(members);
}

function shownInSet(set, id) {
  return expandShown(id).some((x) => set.has(x));
}

let distCacheFrom = "";
let distCache = null;

function clearDistCache() {
  distCacheFrom = "";
  distCache = null;
}

function distFrom(from) {
  const key = String(from || "");
  if (distCache && distCacheFrom === key) return distCache;
  const dist = new Map();
  distCacheFrom = key;
  distCache = dist;
  if (!key) return dist;
  dist.set(key, 0);
  const q = [key];
  for (let i = 0; i < q.length; i++) {
    const cur = q[i];
    const d = dist.get(cur);
    incidentEdges(cur).forEach((e) => {
      const other = e.from === cur ? e.to : e.from;
      if (!other || dist.has(other)) return;
      dist.set(other, d + 1);
      q.push(other);
    });
  }
  return dist;
}

function shownDist(from, id) {
  const dist = distFrom(from);
  let best = 99;
  for (const x of expandShown(id)) {
    if (dist.has(x)) best = Math.min(best, dist.get(x));
  }
  return best;
}

function applyEgoPaint() {
  clearDistCache();
  stampXyFlowAttrs();
  const sid = selectedNodeId ? String(selectedNodeId) : "";
  const neighbors = sid ? neighborhood(sid, egoHops) : new Set();
  const path = pathEnds.length === 2 ? shortestPath(pathEnds[0], pathEnds[1]) : [];
  const pathSet = new Set(path);
  canvas.querySelectorAll(".vnode, .comm-node, .ego-node").forEach((el) => {
    const id = el.getAttribute("data-id");
    const onEgo = shownInSet(neighbors, id);
    if (sid && id) el.setAttribute("data-dist", String(shownDist(sid, id)));
    const onPath = pathSet.has(id);
    el.classList.toggle("selected", id === sid);
    el.classList.toggle("ego", !!(egoMode && onEgo));
    el.classList.toggle("on-path", onPath);
    el.classList.toggle("ego-dim", !!(egoMode && sid && !onEgo && !onPath));
  });
  canvas.querySelectorAll("[data-from][data-to]").forEach((el) => {
    const a = el.getAttribute("data-from"),
      b = el.getAttribute("data-to");
    const incident = !!(sid && shownInSet(neighbors, a) && shownInSet(neighbors, b));
    const onPath = path.length > 1 && consecutiveOnPath(path, a, b);
    el.classList.toggle("ego", !!(egoMode && incident));
    el.classList.toggle("on-path", onPath);
    el.classList.toggle("ego-dim", !!(egoMode && sid && !incident && !onPath));
  });
  applyProbePaint();
}

function hopKindsOf(id) {
  return incidentEdges(id)
    .map((e) => e.kind)
    .filter(Boolean)
    .join(" ");
}

function graphNodePaint(id, extra) {
  extra = extra || {};
  const nid = String(idVal(id));
  const sid = selectedNodeId ? String(selectedNodeId) : "";
  const neighbors = sid ? neighborhood(sid, egoHops) : new Set();
  const path = pathEnds.length === 2 ? shortestPath(pathEnds[0], pathEnds[1]) : [];
  const onEgo = shownInSet(neighbors, nid);
  const onPath = path.indexOf(nid) >= 0;
  const node = nodeById.get(nid);
  const file = extra.file != null ? extra.file : (node && node.span && node.span.file) || "";
  const fqn = extra.fqn != null ? extra.fqn : (node && node.fqn) || "";
  const kind = extra.kind != null ? extra.kind : (node && node.kind) || "";
  const flow = extra.flow || "";
  const hops = extra.hops != null ? extra.hops : hopKindsOf(nid);
  const match =
    graphFilter.kinds[kind] !== false &&
    (matchesExplorerQuery([fqn, file, flow, kind, hops].join(" ")) || !!(extra.community && bubbleMembersMatchQuery(nid)));
  return {
    file,
    hops,
    dim: !match,
    hit: !!(graphFilter.q && match),
    selected: nid === sid,
    ego: !!(egoMode && onEgo),
    egoDim: !!(egoMode && sid && !onEgo && !onPath),
    dist: sid ? shownDist(sid, nid) : undefined,
  };
}

function isRouteKind(kind) {
  return !!ROUTE_KINDS[String(kind || "")];
}

function routeEdges() {
  const out = [];
  const seen = new Set();
  const push = (e) => {
    if (!e || !isRouteKind(e.kind)) return;
    const a = idVal(e.from);
    const b = idVal(e.to);
    if (!a || !b || a === b) return;
    const k = a + "\t" + b + "\t" + e.kind;
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ from: a, to: b, kind: e.kind });
  };
  const flow = typeof currentFlow === "function" ? currentFlow() : null;
  if (flow && flow.tree && flow.tree.edges) flow.tree.edges.forEach(push);
  if (snapshot && snapshot.graph && snapshot.graph.edges) snapshot.graph.edges.forEach(push);
  return out;
}

function directedRoute(from, to) {
  const a = idVal(from);
  const b = idVal(to);
  if (!a || !b) return { nodes: [], hops: [], ok: false, reason: "need two nodes", from: a, to: b };
  if (a === b) return { nodes: [a], hops: [], ok: false, reason: "same node", from: a, to: b };
  const adj = new Map();
  const edgeOf = new Map();
  routeEdges().forEach((e) => {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from).push(e.to);
    const k = e.from + "\t" + e.to;
    if (!edgeOf.has(k)) edgeOf.set(k, e);
  });
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
  if (!prev.has(b)) return { nodes: [], hops: [], ok: false, reason: "unreachable", from: a, to: b };
  const nodes = [b];
  while (nodes[0] !== a) {
    const p = prev.get(nodes[0]);
    if (p == null) return { nodes: [], hops: [], ok: false, reason: "unreachable", from: a, to: b };
    nodes.unshift(p);
  }
  const hops = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const e = edgeOf.get(nodes[i] + "\t" + nodes[i + 1]);
    if (!e) return { nodes: [], hops: [], ok: false, reason: "unreachable", from: a, to: b };
    hops.push(e);
  }
  return { nodes: nodes, hops: hops, ok: hops.length >= 1, reason: "", from: a, to: b };
}

function routeEndpoints() {
  if (pathEnds.length === 2) return [idVal(pathEnds[0]), idVal(pathEnds[1])];
  if (explorerWs === "sequence" && typeof seqHops === "function") {
    const hops = seqHops();
    const h = seqCursor >= 0 ? hops[seqCursor] : hops[0];
    if (h) return [idVal(h.from), idVal(h.to)];
  }
  if (explorerWs === "dataflow" && typeof dfHops === "function") {
    const hops = dfHops();
    const h = dfCursor >= 0 ? hops[dfCursor] : hops[0];
    if (h) return [idVal(h.from), idVal(h.to)];
  }
  const flow = typeof currentFlow === "function" ? currentFlow() : null;
  const edges = (flow && flow.tree && flow.tree.edges) || [];
  const e = edges.find((x) => isRouteKind(x.kind));
  if (e) return [idVal(e.from), idVal(e.to)];
  return [];
}

function resolveRoute() {
  const ends = routeEndpoints();
  if (ends.length < 2) {
    lastRoute = { nodes: [], hops: [], ok: false, reason: "need two nodes", from: "", to: "" };
    return lastRoute;
  }
  lastRoute = directedRoute(ends[0], ends[1]);
  return lastRoute;
}

function stopRouteWalk() {
  routeWalk.playing = false;
  if (routeWalk.timer) {
    clearInterval(routeWalk.timer);
    routeWalk.timer = 0;
  }
  const play = document.getElementById("routePlay");
  if (play) {
    play.classList.remove("on");
    play.setAttribute("aria-pressed", "false");
  }
}

function stepRouteWalk(dir) {
  const route = resolveRoute();
  if (!route.ok || !route.hops.length) {
    stopRouteWalk();
    return;
  }
  let i = routeCursor + dir;
  if (i < 0) i = 0;
  if (i >= route.hops.length) {
    i = route.hops.length - 1;
    stopRouteWalk();
  }
  routeCursor = i;
  fillRouteReceipt();
  applyProbePaint();
}

function toggleRouteWalk() {
  if (routeWalk.playing) {
    stopRouteWalk();
    flashToast("Paused · " + Math.max(routeCursor, 0) + "/" + (lastRoute.hops || []).length, "ok");
    return;
  }
  const route = resolveRoute();
  if (!route.ok || !route.hops.length) {
    flashToast("Unreachable", "skip");
    return;
  }
  if (routeCursor >= route.hops.length - 1) routeCursor = -1;
  routeWalk.playing = true;
  stepRouteWalk(1);
  if (reduceMotion()) {
    stopRouteWalk();
    return;
  }
  routeWalk.timer = setInterval(() => {
    const next = resolveRoute();
    if (routeCursor >= next.hops.length - 1) {
      stopRouteWalk();
      flashToast("End · " + next.hops.length, "ok");
      fillRouteReceipt();
      return;
    }
    stepRouteWalk(1);
  }, 720);
}

function syncProbeDock() {
  if (!probeDock) return;
  const on = !!(routeOpen || lensOpen);
  probeDock.hidden = !on;
  if (routeReceipt) routeReceipt.hidden = !routeOpen;
  if (lensReceipt) lensReceipt.hidden = !lensOpen;
  if (pathBtn) {
    pathBtn.classList.toggle("on", !!routeOpen);
    pathBtn.setAttribute("aria-pressed", routeOpen ? "true" : "false");
  }
  if (lensBtn) {
    lensBtn.classList.toggle("on", !!lensOpen);
    lensBtn.setAttribute("aria-pressed", lensOpen ? "true" : "false");
  }
}


function routeMixCounts(hops) {
  const map = Object.create(null);
  for (const h of hops || []) {
    const k = String((h && h.kind) || "");
    if (!k || !ROUTE_KINDS[k]) continue;
    map[k] = (map[k] || 0) + 1;
  }
  return map;
}

function routeMixChartHtml(map) {
  const entries = Object.keys(ROUTE_KINDS)
    .filter((k) => map[k])
    .map((k) => [k, map[k]]);
  if (!entries.length) return "";
  const max = Math.max(...entries.map((e) => e[1]));
  const bars = entries
    .map((e) => {
      const on =
        routeMixFilter && String(routeMixFilter) === String(e[0]) ? " on" : "";
      const pct = max > 0 ? Math.round((e[1] / max) * 100) : 0;
      return (
        '<button type="button" class="rkm-bar' +
        on +
        '" data-rkm-kind="' +
        esc(e[0]) +
        '" aria-pressed="' +
        (on ? "true" : "false") +
        '" title="' +
        esc(e[0] + " · " + e[1]) +
        '" style="--rkm-pct:' +
        pct +
        '%"><span class="rkm-fill" aria-hidden="true"></span><span class="rkm-label"><b>' +
        esc(e[0]) +
        "</b><i>" +
        e[1] +
        "</i></span></button>"
      );
    })
    .join("");
  return (
    '<div class="rkm-chart" role="group" aria-label="Route hop-kind mix bars" data-rkm-axis-group="kind">' +
    bars +
    "</div>"
  );
}

function toggleRouteMixFilter(kind) {
  const k = String(kind || "");
  if (!k || !ROUTE_KINDS[k]) return;
  if (routeMixFilter && String(routeMixFilter) === k) routeMixFilter = null;
  else routeMixFilter = k;
  fillRouteReceipt();
  applyProbePaint();
}

function bindRouteMixChart() {
  if (!routeReceipt) return;
  routeReceipt.querySelectorAll(".rkm-bar[data-rkm-kind]").forEach((el) => {
    el.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      toggleRouteMixFilter(el.getAttribute("data-rkm-kind"));
    };
  });
}

function fillRouteReceipt() {
  if (!routeReceipt) return;
  const route = lastRoute && lastRoute.nodes ? lastRoute : resolveRoute();
  lastRoute = route;
  const fromN = route.from ? nodeById.get(route.from) : null;
  const toN = route.to ? nodeById.get(route.to) : null;
  const fromL = shortOf((fromN && fromN.fqn) || route.from || "?");
  const toL = shortOf((toN && toN.fqn) || route.to || "?");
  const hops = route.hops || [];
  if (routeCursor >= hops.length) routeCursor = hops.length - 1;
  const hot = routeCursor >= 0 ? hops[routeCursor] : null;
  const status = !route.ok
    ? route.reason === "unreachable"
      ? "Unreachable"
      : "Pick two nodes"
    : hot
      ? routeCursor + 1 + "/" + hops.length + " · " + (hot.kind || "") + " " + shortOf(fqnOf(snapshot.graph, hot.from)) + " → " + shortOf(fqnOf(snapshot.graph, hot.to))
      : hops.length + " hops · " + fromL + " → " + toL;
  const mixMap = routeMixCounts(hops);
  const mixKeys = Object.keys(mixMap);
  const list = hops
    .map((h, i) => {
      const kind = String(h.kind || "");
      const mixCls =
        routeMixFilter
          ? kind === String(routeMixFilter)
            ? " rkm-hit"
            : " rkm-dim"
          : "";
      return (
        '<button type="button" class="route-hop' +
        (i === routeCursor ? " on" : "") +
        mixCls +
        '" data-route-i="' +
        i +
        '" data-from="' +
        esc(h.from) +
        '" data-to="' +
        esc(h.to) +
        '" data-kind="' +
        esc(kind) +
        '">' +
        esc((kind || "") + " " + shortOf(fqnOf(snapshot.graph, h.from)) + " → " + shortOf(fqnOf(snapshot.graph, h.to))) +
        "</button>"
      );
    })
    .join("");
  const mixStrip =
    route.ok && mixKeys.length
      ? '<div class="rkm-strip" data-rkm="1" role="group" aria-label="Route hop-kind mix">' +
        '<span class="rkm-stat"><i class="k">Kinds</i> <b class="n">' +
        mixKeys.length +
        "</b></span>" +
        routeMixChartHtml(mixMap) +
        "</div>"
      : "";
  routeReceipt.innerHTML =
    '<div class="review-strip" id="routeReview">' +
    '<span class="probe-k">PATH</span>' +
    '<button type="button" class="review-step" id="routeOverview">Overview</button>' +
    '<button type="button" class="review-step" id="routePrev">Prev</button>' +
    '<button type="button" class="review-step' +
    (routeWalk.playing ? " on" : "") +
    '" id="routePlay" aria-pressed="' +
    (routeWalk.playing ? "true" : "false") +
    '">Play</button>' +
    '<button type="button" class="review-step" id="routeNext">Next</button>' +
    '<span id="routeStatus">' +
    esc(status) +
    "</span></div>" +
    mixStrip +
    '<div id="routeHops" class="route-hops">' +
    (list || '<span class="empty">No derived directed hops.</span>') +
    "</div>";
  const overview = document.getElementById("routeOverview");
  const prev = document.getElementById("routePrev");
  const next = document.getElementById("routeNext");
  const play = document.getElementById("routePlay");
  if (overview)
    overview.onclick = () => {
      stopRouteWalk();
      routeCursor = -1;
      fillRouteReceipt();
      applyProbePaint();
    };
  if (prev)
    prev.onclick = () => {
      stopRouteWalk();
      stepRouteWalk(routeCursor < 0 ? 1 : -1);
    };
  if (next)
    next.onclick = () => {
      stopRouteWalk();
      stepRouteWalk(1);
    };
  if (play) play.onclick = () => toggleRouteWalk();
  routeReceipt.querySelectorAll("[data-route-i]").forEach((el) => {
    el.onclick = () => {
      const i = parseInt(el.getAttribute("data-route-i"), 10);
      if (!Number.isFinite(i)) return;
      stopRouteWalk();
      routeCursor = i;
      fillRouteReceipt();
      applyProbePaint();
    };
  });
  bindRouteMixChart();
  if (routeReceipt) routeReceipt.classList.toggle("rkm-filtering", !!routeMixFilter);
}

function fillLensReceipt() {
  if (!lensReceipt) return;
  const roles = lensRoles.slice(0, 2);
  const chips = ["Function", "Type", "Endpoint", "Source", "Sink"]
    .map((r) => {
      const on = roles.indexOf(r) >= 0;
      const cls = LENS_KIND_ROLES[r] ? "kind-" + r : "kind-Endpoint";
      return (
        '<button type="button" class="kind-pill ' +
        cls +
        (on ? "" : " off") +
        '" data-lens-role="' +
        r +
        '" aria-pressed="' +
        (on ? "true" : "false") +
        '">' +
        r +
        "</button>"
      );
    })
    .join("");
  const compare = roles.length === 2 ? roles[0] + " · " + roles[1] : roles[0] || "pick a role";
  lensReceipt.innerHTML =
    '<div class="review-strip" id="lensReview">' +
    '<span class="probe-k">LENS</span>' +
    '<span id="lensCompare" class="lens-compare">' +
    esc(compare) +
    "</span></div>" +
    '<div id="lensRoles" class="lens-roles">' +
    chips +
    "</div>";
  lensReceipt.querySelectorAll("[data-lens-role]").forEach((el) => {
    el.onclick = () => toggleLensRole(el.getAttribute("data-lens-role"));
  });
}

function setRouteOpen(on) {
  routeOpen = !!on;
  if (!routeOpen) {
    stopRouteWalk();
    routeCursor = -1;
    routeMixFilter = null;
  } else {
    if (llmPane && !llmPane.hidden && typeof setLlmPane === "function") setLlmPane(false);
    if (keysPane && !keysPane.hidden && typeof setKeysPane === "function") setKeysPane(false);
    if (exportMenu && !exportMenu.hidden && typeof setExportMenu === "function") setExportMenu(false);
    if (lensOpen && typeof setLensOpen === "function") setLensOpen(false);
    if (typeof hideTip === "function") hideTip();
    if (toastEl) {
      toastEl.classList.remove("on");
      toastEl.hidden = true;
    }
    resolveRoute();
    if (!lastRoute.ok) flashToast(lastRoute.reason === "unreachable" ? "Unreachable" : "Pick two nodes", "skip");
    // S1x — drop pending ScrollDrive graph paint so lineMap/CFG opacity cannot beat route-dim.
    if (typeof cancelScrollDriveRaf === "function") cancelScrollDriveRaf();
    if (typeof clearScrollDriveLineMapPaint === "function") clearScrollDriveLineMapPaint();
    if (typeof clearScrollDriveCfgPaint === "function") clearScrollDriveCfgPaint();
    if (typeof clearScrollDriveMacroPaint === "function") clearScrollDriveMacroPaint();
  }
  syncProbeDock();
  if (routeOpen) fillRouteReceipt();
  applyProbePaint();
}

function setLensOpen(on) {
  lensOpen = !!on;
  if (lensOpen) {
    if (llmPane && !llmPane.hidden && typeof setLlmPane === "function") setLlmPane(false);
    if (keysPane && !keysPane.hidden && typeof setKeysPane === "function") setKeysPane(false);
    if (exportMenu && !exportMenu.hidden && typeof setExportMenu === "function") setExportMenu(false);
    if (routeOpen && typeof setRouteOpen === "function") setRouteOpen(false);
    if (typeof hideTip === "function") hideTip();
    if (toastEl) {
      toastEl.classList.remove("on");
      toastEl.hidden = true;
    }
    if (!lensRoles.length || lensRoles.length > 2) lensRoles = ["Function", "Endpoint"];
    // S1x — drop pending ScrollDrive graph paint so lineMap/CFG opacity cannot beat lens-dim.
    if (typeof cancelScrollDriveRaf === "function") cancelScrollDriveRaf();
    if (typeof clearScrollDriveLineMapPaint === "function") clearScrollDriveLineMapPaint();
    if (typeof clearScrollDriveCfgPaint === "function") clearScrollDriveCfgPaint();
    if (typeof clearScrollDriveMacroPaint === "function") clearScrollDriveMacroPaint();
  }
  syncProbeDock();
  if (lensOpen) fillLensReceipt();
  applyProbePaint();
}

function toggleRoute() {
  setRouteOpen(!routeOpen);
}

function toggleLens() {
  setLensOpen(!lensOpen);
}

function toggleLensRole(role) {
  const r = String(role || "");
  if (!LENS_KIND_ROLES[r] && !LENS_END_ROLES[r]) return;
  const isEnd = !!LENS_END_ROLES[r];
  let next = lensRoles.filter((x) => (isEnd ? LENS_END_ROLES[x] : LENS_KIND_ROLES[x]));
  const i = next.indexOf(r);
  if (i >= 0) next.splice(i, 1);
  else {
    if (next.length >= 2) next = next.slice(1);
    next.push(r);
  }
  lensRoles = next.slice(0, 2);
  fillLensReceipt();
  applyProbePaint();
}

function nodeLensHit(id) {
  if (!id || !lensRoles.length) return false;
  const n = nodeById.get(idVal(id));
  if (!n) return false;
  const kind = n.kind || "Function";
  const ep = n.endpoint && n.endpoint.role;
  for (let i = 0; i < lensRoles.length; i++) {
    const r = lensRoles[i];
    if (LENS_KIND_ROLES[r] && kind === r) return true;
    if (LENS_END_ROLES[r] && ep === r) return true;
  }
  return false;
}

/** Map community card is on the PATH when any member node is. */
function bubbleOnProbePath(bubbleId, pathSet) {
  if (!bubbleId || !pathSet || !pathSet.size) return false;
  const b = findBubble(bubbleId);
  return ((b && b.members) || []).some((m) => pathSet.has(idVal(m)));
}

/** Map community card matches Lens when any member matches the roles. */
function bubbleLensHit(bubbleId) {
  if (!bubbleId || !lensRoles.length) return false;
  const b = findBubble(bubbleId);
  return ((b && b.members) || []).some((m) => nodeLensHit(idVal(m)));
}

function applyProbePaint() {
  const route = routeOpen ? resolveRoute() : { nodes: [], hops: [], ok: false };
  if (routeOpen) lastRoute = route;
  const pathSet = new Set(route.ok ? route.nodes : []);
  const hopSet = new Set((route.ok ? route.hops : []).map((h) => h.from + "\t" + h.to));
  const hot = routeOpen && routeCursor >= 0 && route.hops[routeCursor] ? route.hops[routeCursor] : null;
  const mixKind = routeOpen && routeMixFilter ? String(routeMixFilter) : "";
  const mixNodeSet = new Set();
  if (mixKind && route.ok) {
    for (const h of route.hops || []) {
      if (String(h.kind || "") !== mixKind) continue;
      if (h.from) mixNodeSet.add(h.from);
      if (h.to) mixNodeSet.add(h.to);
    }
  }
  let extra = 0;
  let hits = 0;
  canvas.querySelectorAll(".vnode, .comm-node, .ego-node, .seq-part, .df-node, .bubble-card, .lc-end").forEach((el) => {
    const id = el.getAttribute("data-id");
    const bub = el.getAttribute("data-bubble");
    const onRoute = !!(id && pathSet.has(id)) || !!(bub && bubbleOnProbePath(bub, pathSet));
    el.classList.toggle("on-route", onRoute);
    if (el.classList.contains("on-route") && id && !pathSet.has(id)) extra++;
    el.classList.toggle(
      "on-route-hot",
      !!(hot && ((id && (id === hot.from || id === hot.to)) || (bub && bubbleOnProbePath(bub, new Set([hot.from, hot.to])))))
    );
    el.classList.toggle("route-dim", !!(routeOpen && route.ok && (id || bub) && !onRoute));
    const rkmHit = !!(mixKind && onRoute && id && mixNodeSet.has(id));
    const rkmDim = !!(mixKind && onRoute && id && !mixNodeSet.has(id));
    el.classList.toggle("rkm-hit", rkmHit);
    el.classList.toggle("rkm-dim", rkmDim);
    if (!mixKind) {
      el.classList.remove("rkm-hit", "rkm-dim");
    }
    const lensHit = !!(lensOpen && ((id && nodeLensHit(id)) || (bub && bubbleLensHit(bub))));
    if (lensHit) hits++;
    el.classList.toggle("lens-on", lensHit);
    el.classList.toggle("lens-dim", !!(lensOpen && (id || bub) && !lensHit));
  });
  canvas.querySelectorAll("[data-from][data-to]").forEach((el) => {
    const a = el.getAttribute("data-from");
    const b = el.getAttribute("data-to");
    const onRoute = !!(a && b && hopSet.has(a + "\t" + b));
    el.classList.toggle("on-route", onRoute);
    if (el.classList.contains("on-route") && a && b && !hopSet.has(a + "\t" + b)) extra++;
    el.classList.toggle("on-route-hot", !!(hot && a === hot.from && b === hot.to));
    el.classList.toggle("route-dim", !!(routeOpen && route.ok && !onRoute));
    let edgeKind = "";
    if (onRoute && mixKind && route.ok) {
      const hop = (route.hops || []).find((h) => h.from === a && h.to === b);
      edgeKind = hop ? String(hop.kind || "") : "";
    }
    el.classList.toggle("rkm-hit", !!(mixKind && onRoute && edgeKind === mixKind));
    el.classList.toggle("rkm-dim", !!(mixKind && onRoute && edgeKind && edgeKind !== mixKind));
    if (!mixKind) el.classList.remove("rkm-hit", "rkm-dim");
  });
  if (kindFilters && lensOpen) {
    kindFilters.querySelectorAll("label").forEach((lab) => {
      const box = lab.querySelector("input");
      const k = box && box.getAttribute("data-kind");
      lab.classList.toggle("lens", !!(k && lensRoles.indexOf(k) >= 0));
    });
  } else if (kindFilters) {
    kindFilters.querySelectorAll("label").forEach((lab) => lab.classList.remove("lens"));
  }
  window.__graphideRoute = {
    open: !!routeOpen,
    ok: !!route.ok,
    reason: route.reason || "",
    nodes: route.nodes || [],
    hops: (route.hops || []).map((h) => ({ from: h.from, to: h.to, kind: h.kind })),
    extra: extra,
    cursor: routeCursor,
    mix: routeMixFilter || null,
  };
  window.__graphideLens = {
    open: !!lensOpen,
    roles: lensRoles.slice(),
    hits: hits,
  };
}

function defaultFocusId() {
  const sid = selectedNodeId ? idVal(selectedNodeId) : "";
  if (sid && incidentEdges(sid).length) return sid;
  const story = storyFlow();
  const storyTree = (story && story.tree && story.tree.nodes) || [];
  if (storyTree.length >= 2) return idVal(storyTree[0]);
  if (sid) return sid;
  const flow = currentFlow();
  const tree = (flow && flow.tree && flow.tree.nodes) || [];
  if (tree[0]) return idVal(tree[0]);
  const unc = (snapshot && snapshot.coverage && snapshot.coverage.uncovered) || [];
  if (unc[0]) return idVal(unc[0]);
  const n = snapshot && snapshot.graph && snapshot.graph.nodes && snapshot.graph.nodes[0];
  return n ? idVal(n.id) : "";
}

const LINEAGE_CALL = { Calls: 1 };
const LINEAGE_DATA = { Reads: 1, Writes: 1, Publishes: 1, Subscribes: 1 };

function lineageKindsFor(id) {
  const kind = kindOf(snapshot && snapshot.graph, id);
  if (kind === "Type" || kind === "Endpoint") return LINEAGE_DATA;
  return LINEAGE_CALL;
}

function lineageReverses(kind) {
  return kind === "Reads" || kind === "Subscribes";
}

function lineageStep(e, cur, direction) {
  const kind = e.kind || "";
  const from = idVal(e.from);
  const to = idVal(e.to);
  if (!from || !to || from === to) return null;
  if (kind === "Calls") {
    if (direction === "up" && to === cur) return { other: from, from, to: cur, kind };
    if (direction === "down" && from === cur) return { other: to, from: cur, to, kind };
    return null;
  }
  if (kind === "Writes" || kind === "Publishes") {
    if (direction === "up" && to === cur) return { other: from, from, to: cur, kind };
    if (direction === "down" && from === cur) return { other: to, from: cur, to, kind };
    return null;
  }
  if (lineageReverses(kind)) {
    if (direction === "up" && from === cur) return { other: to, from: to, to: cur, kind };
    if (direction === "down" && to === cur) return { other: from, from: cur, to: from, kind };
    return null;
  }
  return null;
}

function hasLineageHops(id) {
  const sid = idVal(id);
  if (!sid) return false;
  const kinds = lineageKindsFor(sid);
  for (const e of incidentEdges(sid)) {
    if (kinds[e.kind]) return true;
  }
  return false;
}

function lineageFocusId() {
  const selected = selectedNodeId ? idVal(selectedNodeId) : "";
  if (selected && hasLineageHops(selected)) return selected;
  const changed = [...changedIdSet()];
  const def = defaultFocusId();
  if (changed.length) {
    if (def && changed.indexOf(def) >= 0 && hasLineageHops(def)) return def;
    for (const id of changed) {
      if (hasLineageHops(id)) return id;
    }
    if (changed[0]) return changed[0];
  }
  return def || selected || "";
}

function walkDirectedLineage(focus, depth) {
  const sid = idVal(focus);
  const kinds = lineageKindsFor(sid);
  const items = new Map();
  if (sid) items.set(sid, { id: sid, side: "focus", hop: 0 });
  const hops = [];
  const seenHop = new Set();
  const walk = (direction) => {
    let frontier = sid ? [sid] : [];
    const max = depth === 2 ? 2 : 1;
    for (let d = 0; d < max; d++) {
      const next = [];
      for (const cur of frontier) {
        for (const e of incidentEdges(cur)) {
          if (!kinds[e.kind]) continue;
          const raw = { kind: e.kind, from: e.from, to: e.to };
          const step = lineageStep(raw, cur, direction);
          if (!step || step.other === sid) continue;
          const key = step.from + ">" + step.to + ">" + step.kind + ">" + direction;
          if (!seenHop.has(key)) {
            seenHop.add(key);
            hops.push({
              from: step.from,
              to: step.to,
              kind: step.kind,
              side: direction,
              dir: direction === "up" ? "in" : "out",
            });
          }
          if (!items.has(step.other)) {
            items.set(step.other, { id: step.other, side: direction, hop: d + 1 });
            next.push(step.other);
          }
        }
      }
      frontier = next;
    }
  };
  walk("up");
  walk("down");
  const ranked = [];
  const band = (n) => {
    if (n.side === "focus") return 0;
    if (n.side === "up" && n.hop === 1) return 1;
    if (n.side === "down" && n.hop === 1) return 2;
    if (n.side === "up") return 3;
    return 4;
  };
  [...items.values()]
    .sort((a, b) => band(a) - band(b))
    .forEach((n) => ranked.push(n));
  const kept = ranked.slice(0, 48);
  const ids = new Set(kept.map((n) => n.id));
  const keptHops = hops.filter((h) => ids.has(h.from) && ids.has(h.to)).slice(0, 80);
  return { nodes: kept, hops: keptHops, kinds };
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
      outcome: s.holds ? "approved" : "rejected",
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
      (snapshot.plugin ? " · " + snapshot.plugin : "") +
      (s.elapsed_ms != null ? " · " + s.elapsed_ms + "ms" : ""),
  });
  decisionRecords().forEach((d) => ev.push({ kind: d.kind, title: d.title, body: d.body, flow: d.flow, verdict: d.verdict }));
  const findings = ((snapshot && snapshot.findings) || []).filter((f) => {
    const k = findingKindOf(f);
    return k && k !== "UncoveredNode" && k !== "StampBroken" && k !== "UnmatchedHint";
  });
  findings.forEach((f) => {
    const hop =
      f.from && f.to ? shortOf(f.from) + " → " + shortOf(f.to) : "";
    ev.push({
      kind: "finding",
      title: findingTitle(f),
      body: f.message || f.fqn || hop || f.plugin || (f.span && f.span.file) || "",
      flow: f.flow || "",
    });
  });
  return ev;
}

function uncoveredHintFqns() {
  const uncovered = ((snapshot && snapshot.coverage) || {}).uncovered || [];
  const hits = [];
  for (const raw of uncovered.slice(0, 8)) {
    const n = nodeById.get(idVal(raw));
    if (n && n.fqn) hits.push(String(n.fqn));
  }
  return hits;
}

function draftHintToml(hits) {
  const list = (hits || []).map((h) => JSON.stringify(h)).join(", ");
  return '[[flow]]\nname = "uncovered"\nhits = [' + list + "]\n";
}

function copyDraftHint() {
  const pre = document.getElementById("draftHint");
  const text = ((pre && pre.textContent) || draftHintToml(uncoveredHintFqns())).trim();
  if (!text || !/\[\[flow\]\]/.test(text) || !/hits\s*=/.test(text)) {
    flashToast("No uncovered FQNs", "skip");
    return;
  }
  const write =
    navigator.clipboard && navigator.clipboard.writeText
      ? navigator.clipboard.writeText(text).then(() => true).catch(() => false)
      : Promise.resolve(false);
  write.then((ok) => flashToast(ok ? "Copied draft hint" : "Draft hint ready", ok ? "ok" : ""));
}

function renderUncoveredDraft(e) {
  if (!e || e.kind !== "coverage" || e.title !== "Uncovered") return "";
  const hits = uncoveredHintFqns();
  if (!hits.length) return "";
  return (
    '<button type="button" class="crumb-btn" id="draftHintBtn">Copy draft</button>' +
    '<pre id="draftHint">' +
    esc(draftHintToml(hits)) +
    "</pre>"
  );
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

function decisionKey(r) {
  return (r.verdict || r.kind || "") + ":" + (r.flow || "") + ":" + (r.title || "");
}

function provBucket(kind) {
  if (kind === "Reads") return "used";
  if (kind === "Writes" || kind === "Publishes") return "generated";
  return "informed";
}

function causalChainFor(rec) {
  const steps = [];
  if (!rec) return steps;
  const flow =
    ((snapshot && snapshot.flows) || []).find((f) => f.name === rec.flow) ||
    (rec.flow && rec.flow === (currentFlow() && currentFlow().name) ? currentFlow() : null) ||
    ((snapshot && snapshot.flows) || []).find((f) => f.name === rec.flow);
  const tree = (flow && flow.tree) || { nodes: [], edges: [] };
  (tree.edges || []).forEach((e) => {
    steps.push({
      from: idVal(e.from),
      to: idVal(e.to),
      relationship: e.kind || "Calls",
      content: shortOf(fqnOf(snapshot.graph, e.to)),
      type: kindOf(snapshot.graph, e.to),
      scar: "",
    });
  });
  if (!steps.length && (tree.nodes || []).length) {
    const id = idVal(tree.nodes[0]);
    steps.push({
      from: "",
      to: id,
      relationship: "hit",
      content: shortOf(fqnOf(snapshot.graph, id)),
      type: kindOf(snapshot.graph, id),
      scar: "",
    });
  }
  const scars = (snapshot.findings || []).filter(
    (f) => findingKindOf(f) === "StampBroken" && (!rec.flow || f.flow === rec.flow)
  );
  scars.forEach((f) => {
    (f.added || []).forEach((e) => {
      steps.push({
        from: idVal(e.from),
        to: idVal(e.to),
        relationship: e.kind || "Calls",
        content: shortOf(fqnOf(snapshot.graph, e.to)) || shortToken(idVal(e.to)),
        type: kindOf(snapshot.graph, e.to),
        scar: "added",
      });
    });
    (f.removed || []).forEach((e) => {
      steps.push({
        from: idVal(e.from),
        to: idVal(e.to),
        relationship: e.kind || "Calls",
        content: shortOf(fqnOf(snapshot.graph, e.to)) || shortToken(idVal(e.to)),
        type: kindOf(snapshot.graph, e.to),
        scar: "removed",
      });
    });
  });
  return steps;
}

function renderChain(steps) {
  if (!steps.length) return '<div class="empty">No derived hops for this decision. Open a flow tab after Review.</div>';
  return (
    '<div class="chain">' +
    steps
      .map((s, i) => {
        return (
          (i ? '<div class="chain-rel">' + esc(s.relationship) + (s.scar ? " · " + s.scar : "") + "</div>" : "") +
          '<button type="button" class="chain-step ' +
          esc(s.scar || "") +
          '" data-from="' +
          esc(s.from) +
          '" data-to="' +
          esc(s.to) +
          '" data-kind="' +
          esc(s.relationship) +
          '"><div class="k">' +
          esc(s.type || "node") +
          (s.scar ? " · " + s.scar : "") +
          '</div><div class="t">' +
          esc(s.content || shortToken(s.to)) +
          "</div></button>"
        );
      })
      .join("") +
    "</div>"
  );
}


/** ADE DAM — stamp | skip | broken bucket for a decision record. */
function attestationBucket(r) {
  if (!r) return "";
  if (r.kind === "skip") return "skip";
  if (r.verdict === "broken") return "broken";
  if (r.kind === "stamp" && r.verdict === "holds") return "stamp";
  if (r.kind === "stamp") return "broken";
  return "";
}

/** ADE DAM — counts for interactive stamp/skip/broken bars. */
function decisionAttestCounts(rows) {
  const map = new Map();
  for (const r of rows || []) {
    const b = attestationBucket(r);
    if (!b) continue;
    map.set(b, (map.get(b) || 0) + 1);
  }
  return map;
}

/** ADE DAM — CSS bar mix for Decisions; max-scaled (OMC/SHM/RKM parity). */
function decisionAttestChartHtml(map) {
  const order = ["stamp", "skip", "broken"];
  const entries = order.filter((k) => (map.get(k) || 0) > 0).map((k) => [k, map.get(k)]);
  if (!entries.length) {
    // still show zeros when ledger has hint-only rows? prefer empty — no strip
    return "";
  }
  const max = Math.max(1, ...entries.map((e) => e[1]));
  const labels = { stamp: "Stamp", skip: "Skip", broken: "Broken" };
  const bars = entries
    .map((e) => {
      const pct = Math.round((e[1] / max) * 100);
      const on = !!(decisionAttestFilter && String(decisionAttestFilter) === String(e[0]));
      return (
        '<button type="button" class="dam-bar' +
        (on ? " on" : "") +
        '" data-dam-kind="' +
        esc(e[0]) +
        '" aria-pressed="' +
        (on ? "true" : "false") +
        '" title="' +
        esc(labels[e[0]] || e[0]) +
        " · " +
        e[1] +
        '" style="--dam-pct:' +
        pct +
        '%"><span class="dam-fill" aria-hidden="true"></span><span class="dam-label"><b>' +
        esc(labels[e[0]] || e[0]) +
        "</b> " +
        e[1] +
        "</span></button>"
      );
    })
    .join("");
  return (
    '<div class="dam-chart" role="group" aria-label="Decisions attestation mix bars" data-dam-axis-group="attest">' +
    bars +
    "</div>"
  );
}

function decisionAttestStripHtml(rows) {
  const map = decisionAttestCounts(rows);
  const chart = decisionAttestChartHtml(map);
  if (!chart) return "";
  const total = [...map.values()].reduce((a, b) => a + b, 0);
  return (
    '<div class="dam-strip" data-dam="1" role="group" aria-label="Decisions attestation mix">' +
    '<span class="dam-stat"><i class="k">Attest</i> <b class="n">' +
    total +
    "</b> " +
    chart +
    "</span></div>"
  );
}

function toggleDecisionAttestFilter(kind) {
  if (!kind) return;
  if (decisionAttestFilter && String(decisionAttestFilter) === String(kind)) decisionAttestFilter = null;
  else decisionAttestFilter = String(kind);
  applyDecisionListFilters();
  syncDecisionAttestBars();
}

function syncDecisionAttestBars() {
  if (!canvas) return;
  canvas.querySelectorAll(".dam-bar[data-dam-kind]").forEach((el) => {
    const k = el.getAttribute("data-dam-kind") || "";
    const on = !!(decisionAttestFilter && String(decisionAttestFilter) === k);
    el.classList.toggle("on", on);
    el.setAttribute("aria-pressed", on ? "true" : "false");
  });
  const strip = canvas.querySelector(".dam-strip");
  if (strip) strip.classList.toggle("dam-filtering", !!decisionAttestFilter);
  const list = canvas.querySelector(".ws-list");
  if (list) list.classList.toggle("dam-filtering", !!decisionAttestFilter);
}

function bindDecisionAttestChart() {
  if (!canvas) return;
  canvas.querySelectorAll(".dam-bar[data-dam-kind]").forEach((el) => {
    el.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      toggleDecisionAttestFilter(el.getAttribute("data-dam-kind"));
    };
    el.onkeydown = (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      ev.stopPropagation();
      toggleDecisionAttestFilter(el.getAttribute("data-dam-kind"));
    };
  });
}

function renderDecisionBody() {
  const rows = decisionRecords().filter((r) =>
    matchesExplorerQuery([r.title, r.body, r.flow, r.verdict, r.kind].join(" "))
  );
  if (!rows.length) {
    if (graphFilter.q) {
      return (
        '<div class="empty">No decisions match “' +
        esc(graphFilter.q) +
        '”. Clear find to see stamps and skips.</div>'
      );
    }
    return '<div class="empty">No stamps, skips, or stamp scars yet. Stamp (S) or Skip (X) a flow.</div>';
  }
  if (!selectedDecisionKey || !rows.some((r) => decisionKey(r) === selectedDecisionKey)) {
    selectedDecisionKey = decisionKey(rows[0]);
  }
  const selected = rows.find((r) => decisionKey(r) === selectedDecisionKey) || rows[0];
  const chain = causalChainFor(selected);
  const list = rows
    .map((r) => {
      const key = decisionKey(r);
      return (
        '<article class="expl-card ' +
        esc(r.verdict || r.kind) +
        (key === selectedDecisionKey ? " on" : "") +
        '" data-decision="' +
        esc(key) +
        '" data-outcome="' +
        esc(r.outcome || r.verdict || "") +
        '" data-attest="' +
        esc(attestationBucket(r)) +
        '"><div class="k">' +
        esc(r.outcome || r.verdict || r.kind) +
        '</div><div class="t">' +
        esc(r.title) +
        '</div><div class="b">' +
        esc(r.body) +
        "</div></article>"
      );
    })
    .join("");
  const outcomes = [
    ["", "All"],
    ["approved", "Approved"],
    ["rejected", "Rejected"],
    ["deferred", "Deferred"],
    ["pending", "Pending"],
  ];
  const strip =
    '<div class="outcome-strip" role="tablist" aria-label="Decision outcomes"><span class="outcome-k">Outcomes</span>' +
    outcomes
      .map((pair) => {
        const on = decisionOutcomeFilter === pair[0] ? " on" : "";
        return (
          '<button type="button" class="outcome-filter' +
          on +
          '" data-outcome-filter="' +
          esc(pair[0]) +
          '">' +
          esc(pair[1]) +
          "</button>"
        );
      })
      .join("") +
    "</div>";
  const damStrip = decisionAttestStripHtml(rows);
  return (
    '<div class="ws-split">' +
    '<div class="ws-list">' +
    damStrip +
    strip +
    list +
    "</div>" +
    '<div class="ws-detail">' +
    '<div class="k">Decision record</div>' +
    '<div class="t">' +
    esc(selected.title) +
    "</div>" +
    '<div class="outcome ' +
    esc(selected.verdict || "") +
    '">' +
    esc(selected.outcome || selected.verdict || "") +
    "</div>" +
    (selected.flow
      ? '<button type="button" class="crumb-btn" data-open-slice="' + esc(selected.flow) + '">Open slice</button>'
      : "") +
    '<div class="flow-title">Causal chain · ' +
    chain.length +
    " step" +
    (chain.length === 1 ? "" : "s") +
    " on the derived graph</div>" +
    renderChain(chain) +
    "</div></div>"
  );
}

function renderRegistryBody() {
  const ev = registryEvents().filter((r) =>
    matchesExplorerQuery([r.title, r.body, r.flow, r.verdict, r.kind].join(" "))
  );
  if (!ev.length) {
    if (graphFilter.q) {
      return (
        '<div class="empty">No registry rows match “' +
        esc(graphFilter.q) +
        '”. Clear find to see the audit log.</div>'
      );
    }
    return '<div class="empty">Review first — the registry is this snapshot’s audit log.</div>';
  }
  return (
    '<table class="audit"><thead><tr><th>Kind</th><th>Subject</th><th>Detail</th></tr></thead><tbody>' +
    ev
      .map((e) => {
        return (
          "<tr class=\"" +
          esc(e.verdict || e.kind) +
          '"' +
          (e.flow ? ' data-flow="' + esc(e.flow) + '"' : "") +
          "><td><span class=\"mut mut-" +
          esc(e.verdict || e.kind) +
          '">' +
          esc(e.verdict || e.kind) +
          "</span></td><td>" +
          esc(e.title) +
          "</td><td>" +
          esc(e.body) +
          "</td></tr>"
        );
      })
      .join("") +
    "</tbody></table>"
  );
}

function renderTimelineBody() {
  const ev = timelineEvents().filter((r) =>
    matchesExplorerQuery([r.title, r.body, r.flow, r.verdict, r.kind].join(" "))
  );
  if (!ev.length) {
    if (graphFilter.q) {
      return (
        '<div class="empty">No timeline events match “' +
        esc(graphFilter.q) +
        '”. Clear find to see the parent cut.</div>'
      );
    }
    return '<div class="empty">No parent cut or stamp events yet.</div>';
  }
  if (timelineCursor >= ev.length) timelineCursor = ev.length - 1;
  if (timelineCursor < 0) timelineCursor = 0;
  const cur = ev[timelineCursor];
  return (
    '<div class="tl-page">' +
    '<div class="tl-scrub">' +
    '<label>Watch this review <input id="tlScrub" type="range" min="0" max="' +
    (ev.length - 1) +
    '" value="' +
    timelineCursor +
    '" /></label>' +
    '<span id="tlScrubMeta">t' +
    timelineCursor +
    " · " +
    esc((cur && cur.title) || "event") +
    "</span></div>" +
    '<div class="tl-rail">' +
    ev
      .map((e, i) => {
        return (
          '<article class="tl-item ' +
          esc(e.kind || e.verdict || "") +
          (i === timelineCursor ? " now" : i < timelineCursor ? " past" : " ahead") +
          '" data-t="' +
          i +
          '"' +
          (e.flow ? ' data-flow="' + esc(e.flow) + '"' : "") +
          '><i class="tl-dot"></i><div class="tl-when">t' +
          i +
          '</div><div class="k">' +
          esc(e.kind || e.verdict || "") +
          '</div><div class="t">' +
          esc(e.title) +
          '</div><div class="b">' +
          esc(e.body) +
          "</div>" +
          renderUncoveredDraft(e) +
          "</article>"
        );
      })
      .join("") +
    "</div></div>"
  );
}

function clusterFacts() {
  return ((snapshot && snapshot.delta && snapshot.delta.cluster_facts) || []).map((c) => ({
    status: c.kind,
    class: "community",
    subject: "community",
    fqn: c.label || "",
    bubble: c.bubble != null ? String(c.bubble) : "",
    detail: c.detail || "",
    previous_label: c.previous_label,
    from_fqn: null,
    to_fqn: null,
  }));
}

function deltaFacts() {
  const facts = clusterFacts().concat(((snapshot && snapshot.delta && snapshot.delta.facts) || []).slice());
  if (!graphFilter.q) return facts;
  return facts.filter((f) =>
    matchesExplorerQuery(
      [f.status, f.subject, f.fqn, f.detail, f.class, f.from_fqn, f.to_fqn, f.bubble, f.file, f.from_file, f.to_file].join(" ")
    )
  );
}

function deltaMarker(status) {
  if (status === "added") return "+";
  if (status === "removed") return "−";
  if (status === "changed") return "~";
  if (status === "moved") return "↔";
  if (status === "rerouted") return "↝";
  if (status === "stable") return "=";
  if (status === "split") return "∕";
  if (status === "merge") return "∪";
  if (status === "relabel") return "~";
  return "·";
}

function applyDeltaFactView(fact) {
  if (!fact) return;
  if (fact.class === "community") {
    if (fact.status === "removed") deltaView = "before";
    else if (fact.status === "added") deltaView = "after";
    else deltaView = "delta";
    return;
  }
  if (fact.status === "added") deltaView = "after";
  else if (fact.status === "removed") deltaView = "before";
  else deltaView = "delta";
}

function stopDeltaWalk() {
  deltaWalk.playing = false;
  if (deltaWalk.timer) {
    clearInterval(deltaWalk.timer);
    deltaWalk.timer = 0;
  }
  const play = document.getElementById("deltaPlay");
  if (play) {
    play.classList.remove("on");
    play.setAttribute("aria-pressed", "false");
  }
}

function stepDeltaWalk(dir) {
  const facts = deltaFacts();
  if (!facts.length) return;
  let i = deltaCursor + dir;
  if (i < 0) i = 0;
  if (i >= facts.length) {
    i = facts.length - 1;
    stopDeltaWalk();
  }
  deltaCursor = i;
  applyDeltaFactView(facts[i]);
  paint({ animate: "none" });
}

function toggleDeltaReview() {
  if (deltaWalk.playing) {
    stopDeltaWalk();
    const facts = deltaFacts();
    flashToast("Paused · " + Math.max(deltaCursor, 0) + "/" + facts.length, "ok");
    return;
  }
  const facts = deltaFacts();
  if (!facts.length) {
    flashToast("No delta facts", "skip");
    return;
  }
  if (deltaCursor >= facts.length - 1) deltaCursor = -1;
  deltaWalk.playing = true;
  flashToast("Review · " + facts.length + " facts", "ok");
  stepDeltaWalk(1);
  if (reduceMotion()) {
    stopDeltaWalk();
    return;
  }
  deltaWalk.timer = setInterval(() => {
    const next = deltaFacts();
    if (deltaCursor >= next.length - 1) {
      stopDeltaWalk();
      flashToast("End · " + next.length + " facts", "ok");
      return;
    }
    stepDeltaWalk(1);
  }, 720);
}

function resetDeltaOverview() {
  stopDeltaWalk();
  deltaCursor = -1;
  deltaView = "delta";
  paint({ animate: "none" });
}

function deltaGraphPair() {
  const head = (snapshot && snapshot.graph) || { nodes: [], edges: [] };
  const parent =
    (snapshot && snapshot.delta && snapshot.delta.parent) || { nodes: [], edges: [] };
  return { head, parent };
}

function deltaNodeState(fqn) {
  const facts = ((snapshot && snapshot.delta && snapshot.delta.facts) || []).filter((f) => f.fqn === fqn && !f.from_fqn);
  if (facts.some((f) => f.status === "added")) return "added";
  if (facts.some((f) => f.status === "removed")) return "removed";
  if (facts.some((f) => f.status === "moved")) return "moved";
  if (facts.some((f) => f.status === "changed")) return "changed";
  return "same";
}

function deltaHopState(fromFqn, toFqn, kind) {
  const facts = (snapshot && snapshot.delta && snapshot.delta.facts) || [];
  for (const f of facts) {
    if (f.from_fqn === fromFqn && f.to_fqn === toFqn && (!kind || !f.edge_kind || f.edge_kind === kind)) {
      if (f.status === "added" || f.status === "removed" || f.status === "rerouted") return f.status;
    }
  }
  const { head, parent } = deltaGraphPair();
  const inHead = (head.edges || []).some(
    (e) => fqnOf(head, e.from) === fromFqn && fqnOf(head, e.to) === toFqn
  );
  const inParent = (parent.edges || []).some(
    (e) => fqnOf(parent, e.from) === fromFqn && fqnOf(parent, e.to) === toFqn
  );
  if (inHead && !inParent) return "added";
  if (inParent && !inHead) return "removed";
  return "same";
}

function parentBubbles() {
  return ((snapshot && snapshot.delta && snapshot.delta.parent_bubbles) || []).filter(
    (b) => b && b.parent == null
  );
}

function bubbleMemberIdSet(bubbles, bubbleId) {
  const want = idVal(bubbleId);
  const found = (bubbles || []).find((b) => b && idVal(b.id) === want && b.parent == null);
  return new Set(((found && found.members) || []).map(idVal));
}

/** ADE CFT — resolve bubble label for trail chip. */
function focusTrailBubbleLabel(bubbleId) {
  const want = String(idVal(bubbleId) || "");
  if (!want) return "";
  const pools = [];
  try {
    if (typeof mapAltitudeBubbles === "function") pools.push(mapAltitudeBubbles() || []);
  } catch (_) {}
  try {
    if (typeof allBubbles === "function") pools.push(allBubbles() || []);
  } catch (_) {}
  for (const list of pools) {
    const hit = (list || []).find((b) => b && idVal(b.id) === want);
    if (hit) return shortOf(hit.label) || want;
  }
  return want;
}

/** ADE CFT — pin a Map community into the cross-desk focus trail (always set). */
function setFocusTrail(bubbleId) {
  const id = String(idVal(bubbleId) || "");
  if (!id) return;
  focusTrail = { bubbleId: id, label: focusTrailBubbleLabel(id) };
  applyFocusTrailPaint();
  syncFocusTrailChip();
}

/** ADE CFT — Shift+click toggles pin for the same bubble. */
function toggleFocusTrail(bubbleId) {
  const id = String(idVal(bubbleId) || "");
  if (!id) return;
  if (focusTrail && String(focusTrail.bubbleId) === id) {
    clearFocusTrail();
    return;
  }
  setFocusTrail(id);
}

function clearFocusTrail() {
  if (!focusTrail) return;
  focusTrail = null;
  applyFocusTrailPaint();
  syncFocusTrailChip();
}

/** ADE FTR — chip click returns to Map with pinned community lit (graph-only). */
function returnToFocusTrailMap() {
  if (!focusTrail || !focusTrail.bubbleId) return false;
  const id = String(focusTrail.bubbleId);
  if (typeof setWorkspace === "function") setWorkspace("map", true);
  // Remount chip + paint after Map paint settles.
  if (typeof ensureFocusTrailChip === "function") ensureFocusTrailChip();
  if (typeof applyFocusTrailPaint === "function") applyFocusTrailPaint();
  const card =
    (canvas && canvas.querySelector('.bubble-card[data-bubble="' + id + '"]')) ||
    document.querySelector('.bubble-card[data-bubble="' + id + '"]');
  if (card && typeof card.scrollIntoView === "function") {
    try {
      card.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    } catch (_) {
      try { card.scrollIntoView(); } catch (__) {}
    }
  }
  return true;
}

function focusTrailMemberIds() {
  if (!focusTrail || !focusTrail.bubbleId) return new Set();
  const want = String(focusTrail.bubbleId);
  const pools = [];
  try {
    if (typeof mapAltitudeBubbles === "function") pools.push(mapAltitudeBubbles() || []);
  } catch (_) {}
  try {
    if (typeof allBubbles === "function") pools.push(allBubbles() || []);
  } catch (_) {}
  for (const list of pools) {
    const hit = (list || []).find((b) => b && idVal(b.id) === want);
    if (hit && hit.members && hit.members.length) {
      return new Set(hit.members.map(idVal));
    }
  }
  return bubbleMemberIdSet(typeof allBubbles === "function" ? allBubbles() : [], want);
}

/** ADE CFT — trail chip HTML (Map / Slice / Sequence). */
function focusTrailChipHtml() {
  if (!focusTrail || !focusTrail.bubbleId) return "";
  const n = focusTrailMemberIds().size;
  const sparkPct = Math.max(8, Math.min(100, n * 8));
  return (
    '<div class="cft-trail" data-cft="1" role="group" aria-label="Cross-desk focus trail">' +
    '<button type="button" class="cft-chip on" data-cft-chip="1" aria-pressed="true" title="Return to Map community · Escape to clear">' +
    '<span class="cft-k">Trail</span> <b class="cft-label">' +
    esc(focusTrail.label || focusTrail.bubbleId) +
    '</b> <i class="cft-n">' +
    n +
    '</i><span class="cft-spark" aria-hidden="true" style="--cft-spark:' +
    sparkPct +
    '%"></span></button>' +
    '<button type="button" class="cft-clear" data-cft-clear="1" title="Clear focus trail">Clear</button>' +
    "</div>"
  );
}

function ensureFocusTrailChip() {
  if (!canvas) return;
  const html = focusTrailChipHtml();
  const stage = canvas.querySelector(".stage");
  const host = stage || canvas;
  let el = canvas.querySelector(".cft-trail[data-cft='1']");
  if (!html) {
    if (el) el.remove();
    return;
  }
  if (el) {
    el.outerHTML = html;
  } else {
    const anchor =
      host.querySelector(".mhs-strip, .mcs-strip, .mac-strip, .shm-strip, .cps-strip, .flow-title") ||
      null;
    if (anchor) anchor.insertAdjacentHTML("beforebegin", html);
    else if (stage) stage.insertAdjacentHTML("afterbegin", html);
    else {
      const seq = canvas.querySelector("#seqHops, .ws-list");
      if (seq) seq.insertAdjacentHTML("beforebegin", html);
    }
  }
  bindFocusTrailChip();
}

function syncFocusTrailChip() {
  ensureFocusTrailChip();
}

function bindFocusTrailChip() {
  if (!canvas) return;
  canvas.querySelectorAll("[data-cft-clear]").forEach((el) => {
    el.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      clearFocusTrail();
    };
  });
  canvas.querySelectorAll("[data-cft-chip]").forEach((el) => {
    el.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      // ADE FTR — chip returns to Map pin; Clear still clears.
      if (explorerWs === "map") {
        // Already on Map: re-scroll/highlight the pinned card.
        returnToFocusTrailMap();
        return;
      }
      returnToFocusTrailMap();
    };
  });
}

function applyFocusTrailPaint() {
  if (!canvas) return;
  const members = focusTrailMemberIds();
  const active = !!(focusTrail && focusTrail.bubbleId && members.size);
  canvas.classList.toggle("cft-filtering", active);
  const sliceHost = document.getElementById("sliceCanvas");
  if (sliceHost) sliceHost.classList.toggle("cft-filtering", active);
  canvas.querySelectorAll(".bubble-card[data-bubble]").forEach((el) => {
    el.classList.remove("cft-hit", "cft-dim");
    if (!active) return;
    const match = String(el.getAttribute("data-bubble")) === String(focusTrail.bubbleId);
    el.classList.toggle("cft-hit", match);
    el.classList.toggle("cft-dim", !match);
  });
  const nodeRoots = [];
  if (sliceHost) nodeRoots.push(sliceHost);
  nodeRoots.push(canvas);
  for (const root of nodeRoots) {
    root.querySelectorAll(".vnode[data-id]").forEach((el) => {
      el.classList.remove("cft-hit", "cft-dim");
      if (!active) return;
      const id = idVal(el.getAttribute("data-id"));
      const hit = members.has(id);
      el.classList.toggle("cft-hit", hit);
      el.classList.toggle("cft-dim", !hit);
    });
  }
  canvas.querySelectorAll("#seqHops .seq-hop").forEach((el) => {
    el.classList.remove("cft-hit", "cft-dim");
    if (!active) return;
    let hit = false;
    const i = parseInt(el.getAttribute("data-seq-i"), 10);
    if (Number.isFinite(i) && typeof seqHops === "function") {
      const hops = seqHops() || [];
      const h = hops[i];
      if (h) hit = members.has(idVal(h.from)) || members.has(idVal(h.to));
    }
    el.classList.toggle("cft-hit", !!hit);
    el.classList.toggle("cft-dim", !hit);
  });
}

function communityWantFqns(view, bubbleId) {
  const { head, parent } = deltaGraphPair();
  const headIds = bubbleMemberIdSet(allBubbles(), bubbleId);
  const parentIds = bubbleMemberIdSet(parentBubbles(), bubbleId);
  const fqns = new Set();
  const take = (graph, ids) => {
    (graph.nodes || []).forEach((n) => {
      if (ids.has(idVal(n.id))) fqns.add(n.fqn);
    });
  };
  if (view === "before") take(parent, parentIds);
  else if (view === "after") take(head, headIds);
  else {
    take(parent, parentIds);
    take(head, headIds);
  }
  return fqns;
}

function deltaReading(view, hot) {
  const { head, parent } = deltaGraphPair();
  const src = view === "before" ? parent : view === "after" ? head : null;
  const nodesById = new Map();
  const pushNode = (n) => {
    if (!n) return;
    nodesById.set(idVal(n.id), n);
  };
  if (src) {
    (src.nodes || []).forEach(pushNode);
  } else {
    (parent.nodes || []).forEach(pushNode);
    (head.nodes || []).forEach(pushNode);
  }
  const community = !!(hot && hot.class === "community" && hot.bubble);
  const want = new Set();
  if (community) {
    communityWantFqns(view, hot.bubble).forEach((fqn) => want.add(fqn));
  } else {
    deltaFacts().forEach((f) => {
      if (f.class === "community") return;
      if (f.from_fqn) want.add(f.from_fqn);
      if (f.to_fqn) want.add(f.to_fqn);
      if (f.fqn && !f.from_fqn) want.add(f.fqn);
    });
  }
  let nodes = [...nodesById.values()].filter((n) => !want.size || want.has(n.fqn));
  if (nodes.length < 2 && !community) nodes = [...nodesById.values()].slice(0, 16);
  if (nodes.length > 24) nodes = nodes.slice(0, 24);
  const ids = nodes.map((n) => idVal(n.id));
  const idSet = new Set(ids);
  const edgeSrc =
    view === "before"
      ? parent.edges || []
      : view === "after"
        ? head.edges || []
        : [].concat(parent.edges || [], head.edges || []);
  const seenE = new Set();
  const hops = [];
  edgeSrc.forEach((e, i) => {
    const a = idVal(e.from);
    const b = idVal(e.to);
    if (!idSet.has(a) || !idSet.has(b)) return;
    const k = a + "\t" + b + "\t" + (e.kind || "");
    if (seenE.has(k)) return;
    seenE.add(k);
    const fromN = nodesById.get(a);
    const toN = nodesById.get(b);
    const state = deltaHopState((fromN && fromN.fqn) || "", (toN && toN.fqn) || "", e.kind);
    const hotHop = !!(
      hot &&
      hot.from_fqn &&
      fromN &&
      toN &&
      hot.from_fqn === fromN.fqn &&
      hot.to_fqn === toN.fqn
    );
    hops.push({
      i,
      from: a,
      to: b,
      kind: e.kind || "",
      state,
      hot: hotHop,
    });
  });
  const items = nodes.map((n) => {
    const hotNode = community
      ? true
      : !!(hot && !hot.from_fqn && hot.fqn === n.fqn);
    return {
      id: idVal(n.id),
      fqn: n.fqn || "",
      kind: n.kind || "Function",
      kindClass: kindClass(n.kind),
      state: deltaNodeState(n.fqn),
      label: shortOf(n.fqn),
      hot: hotNode,
      bubble: community ? String(hot.bubble) : "",
    };
  });
  const hotIds = items.filter((n) => n.hot).map((n) => n.id);
  hops.forEach((h) => {
    if (h.hot) {
      hotIds.push(h.from);
      hotIds.push(h.to);
    }
  });
  return { nodes: items, hops, hotIds };
}

function renderDeltaCanvas(view) {
  return (
    '<div id="deltaCanvas" class="delta-canvas seq-canvas" data-delta-view="' +
    esc(view) +
    '"></div>'
  );
}

function deltaWorkspaceKey() {
  const facts = deltaFacts();
  return [facts.length, graphFilter.q || "", facts[0] && facts[0].fqn].join("\0");
}

function deltaCanvasProps() {
  const facts = deltaFacts();
  const hot = deltaCursor >= 0 ? facts[deltaCursor] : null;
  const reading = deltaReading(deltaView, hot);
  return {
    nodes: reading.nodes,
    hops: reading.hops,
    cursor: deltaCursor,
    hotIds: reading.hotIds,
    onNodeClick: (id) => {
      if (!id) return;
      selectedNodeId = id;
      peekSource(id);
    },
    onHopClick: (iOrHop) => {
      const hops = reading.hops;
      const hop = typeof iOrHop === "number" ? hops[iOrHop] : iOrHop;
      if (!hop) return;
      const facts = deltaFacts();
      const idx = facts.findIndex(
        (f) =>
          (f.from_fqn &&
            reading.nodes.some((n) => n.id === hop.from && n.fqn === f.from_fqn) &&
            reading.nodes.some((n) => n.id === hop.to && n.fqn === f.to_fqn)) ||
          (!f.from_fqn && reading.nodes.some((n) => n.id === hop.from && n.fqn === f.fqn))
      );
      if (idx >= 0) {
        deltaCursor = idx;
        applyDeltaFactView(facts[idx]);
        paint({ animate: "none" });
      }
    },
  };
}

function patchDeltaChrome() {
  const facts = deltaFacts();
  const hot = deltaCursor >= 0 ? facts[deltaCursor] : null;
  canvas.querySelectorAll("#deltaFacts .delta-fact").forEach((el) => {
    const i = parseInt(el.getAttribute("data-delta-i"), 10);
    el.classList.toggle("on", i === deltaCursor);
  });
  canvas.querySelectorAll("#deltaView [data-delta-view]").forEach((el) => {
    if (el.id === "deltaCanvas") return;
    const on = el.getAttribute("data-delta-view") === deltaView;
    el.classList.toggle("on", on);
    el.setAttribute("aria-selected", on ? "true" : "false");
  });
  const host = document.getElementById("deltaCanvas");
  if (host) host.setAttribute("data-delta-view", deltaView);
  const status = document.getElementById("deltaStatus");
  if (status) {
    status.textContent = hot
      ? deltaCursor + 1 + "/" + facts.length + " · " + deltaMarker(hot.status) + " " + (hot.fqn || "")
      : facts.length
        ? facts.length + " facts"
        : "identical pair";
  }
  const play = document.getElementById("deltaPlay");
  if (play) {
    play.classList.toggle("on", !!deltaWalk.playing);
    play.setAttribute("aria-pressed", deltaWalk.playing ? "true" : "false");
  }
}

function paintDeltaWorkspace(title) {
  canvas.className = "play explorer-list";
  const html = renderDeltaBody();
  const key = deltaWorkspaceKey();
  const keep = !!(
    canvas.querySelector(".delta-page") &&
    document.getElementById("deltaCanvas") &&
    key === deltaBodyKey &&
    html.indexOf('id="deltaCanvas"') >= 0
  );
  if (keep) {
    patchDeltaChrome();
  } else {
    unmountReviewCanvas();
    canvas.innerHTML = '<div class="expl-wrap"><div class="flow-title">' + esc(title) + "</div>" + html + "</div>";
    deltaBodyKey = html.indexOf('id="deltaCanvas"') >= 0 ? key : "";
  }
  const host = document.getElementById("deltaCanvas");
  if (host && !host.classList.contains("empty")) mountDeltaCanvas(host, deltaCanvasProps());
  else if (!host) unmountReviewCanvas();
}

function renderDeltaBody() {
  const facts = deltaFacts();
  const raw = (snapshot && snapshot.delta) || {};
  const hasParent = !!(raw.parent && (raw.parent.nodes || []).length);
  if (!facts.length && !hasParent) {
    if (graphFilter.q) {
      return (
        '<div class="empty">No delta facts match “' +
        esc(graphFilter.q) +
        '”.</div>'
      );
    }
    return '<div class="empty">No parent cut. Review with a parent root (fixtures/demo vs demo-parent, or git HEAD^) to read Architecture Delta.</div>';
  }
  if (deltaCursor >= facts.length) deltaCursor = facts.length - 1;
  const hot = deltaCursor >= 0 ? facts[deltaCursor] : null;
  const views = [
    ["before", "Before"],
    ["delta", "Delta"],
    ["after", "After"],
  ];
  const switcher =
    '<div class="outcome-strip" id="deltaView" role="tablist" aria-label="Delta view">' +
    views
      .map((pair) => {
        const on = deltaView === pair[0] ? " on" : "";
        return (
          '<button type="button" class="outcome-filter' +
          on +
          '" data-delta-view="' +
          pair[0] +
          '" aria-selected="' +
          (deltaView === pair[0] ? "true" : "false") +
          '">' +
          pair[1] +
          "</button>"
        );
      })
      .join("") +
    '<span class="outcome-k">' +
    (raw.added || 0) +
    " + · " +
    (raw.removed || 0) +
    " − · " +
    (raw.changed || 0) +
    " ~ · " +
    (raw.moved || 0) +
    " ↔ · " +
    (raw.rerouted || 0) +
    " ↝</span></div>";
  const review =
    '<div class="review-strip" id="deltaReview">' +
    '<button type="button" class="review-step" id="deltaOverview">Overview</button>' +
    '<button type="button" class="review-step" id="deltaPrev">Previous</button>' +
    '<button type="button" class="review-step' +
    (deltaWalk.playing ? " on" : "") +
    '" id="deltaPlay" aria-pressed="' +
    (deltaWalk.playing ? "true" : "false") +
    '">Review</button>' +
    '<button type="button" class="review-step" id="deltaNext">Next</button>' +
    '<span id="deltaStatus">' +
    (hot
      ? deltaCursor + 1 + "/" + facts.length + " · " + deltaMarker(hot.status) + " " + (hot.fqn || "")
      : facts.length
        ? facts.length + " facts"
        : "identical pair") +
    "</span></div>";
  const list = facts
    .map((f, i) => {
      const community = f.class === "community";
      const title = community
        ? "community · bubble " + (f.bubble || "?") + (f.fqn ? " · " + f.fqn : "")
        : (f.subject || "") + " · " + (f.fqn || "");
      return (
        '<article class="delta-fact expl-card ' +
        esc(f.status || "") +
        (community ? " community" : "") +
        (i === deltaCursor ? " on" : "") +
        '" data-delta-kind="' +
        esc(f.status || "") +
        '" data-delta-class="' +
        esc(f.class || "") +
        '" data-fqn="' +
        esc(f.fqn || "") +
        '"' +
        (f.file ? ' data-file="' + esc(f.file) + '"' : "") +
        (f.bubble ? ' data-bubble="' + esc(f.bubble) + '"' : "") +
        ' data-delta-i="' +
        i +
        '"><div class="k">' +
        esc(deltaMarker(f.status) + " " + (f.status || "")) +
        '</div><div class="t">' +
        esc(title) +
        '</div><div class="b">' +
        esc(f.detail || f.class || "") +
        "</div></article>"
      );
    })
    .join("");
  return (
    '<div class="delta-page">' +
    switcher +
    review +
    '<div class="ws-split">' +
    '<div class="ws-list" id="deltaFacts">' +
    (list || '<div class="empty">No added, removed, changed, moved, or rerouted facts.</div>') +
    "</div>" +
    '<div class="ws-detail">' +
    '<div class="k">' +
    esc(deltaView) +
    " · derived</div>" +
    renderDeltaCanvas(deltaView, hot) +
    "</div></div></div>"
  );
}

function bindDeltaPage() {
  canvas.querySelectorAll("[data-delta-view]").forEach((el) => {
    if (el.id === "deltaCanvas") return;
    el.onclick = (ev) => {
      ev.stopPropagation();
      const v = el.getAttribute("data-delta-view");
      if (v === "before" || v === "delta" || v === "after") {
        deltaView = v;
        paint({ animate: "none" });
      }
    };
  });
  canvas.querySelectorAll("#deltaFacts .delta-fact").forEach((el) => {
    el.onclick = (ev) => {
      ev.stopPropagation();
      const i = parseInt(el.getAttribute("data-delta-i"), 10);
      if (!Number.isFinite(i)) return;
      deltaCursor = i;
      applyDeltaFactView(deltaFacts()[i]);
      paint({ animate: "none" });
    };
  });
  const overview = document.getElementById("deltaOverview");
  const prev = document.getElementById("deltaPrev");
  const next = document.getElementById("deltaNext");
  const play = document.getElementById("deltaPlay");
  if (overview) overview.onclick = () => resetDeltaOverview();
  if (prev)
    prev.onclick = () => {
      stopDeltaWalk();
      stepDeltaWalk(deltaCursor < 0 ? 1 : -1);
    };
  if (next)
    next.onclick = () => {
      stopDeltaWalk();
      stepDeltaWalk(1);
    };
  if (play) play.onclick = () => toggleDeltaReview();
}

function isInteractionKind(kind) {
  return (
    kind === "Calls" ||
    kind === "Publishes" ||
    kind === "Subscribes" ||
    kind === "Reads" ||
    kind === "Writes"
  );
}

/** Current flow's Steiner as participants × ordered hops. Engine `sequence` when present; else derive from the tree (explorer fixture). */
function sequenceFlow() {
  const cur = currentFlow();
  if (cur && sequenceOf(cur).hops.length) return cur;
  const story = storyFlow();
  if (story && sequenceOf(story).hops.length) return story;
  for (const f of (snapshot && snapshot.flows) || []) {
    if (sequenceOf(f).hops.length) return f;
  }
  return cur || story || null;
}


/** ADE SSR — kind · role/channel (endpoint) from IR; never file:line. */
function seqNodeCaption(id) {
  const sid = idVal(id);
  if (!sid) return "";
  const node = nodeById.get(sid);
  if (!node) return "";
  const parts = [];
  if (node.kind) parts.push(String(node.kind));
  const ep = endpointOf(sid);
  if (ep) {
    if (ep.role) parts.push(String(ep.role));
    if (ep.channel) parts.push(String(ep.channel));
  }
  return parts.join(" · ");
}

/** ADE SSR — hop caption: verb (+ return) · from/to kind·role/channel; not file:line. */
function seqHopCaption(h) {
  if (!h) return "";
  const verb = h.kind
    ? h.variant === "return"
      ? String(h.kind) + " return"
      : String(h.kind)
    : "";
  const fromCap = seqNodeCaption(h.from);
  const toCap = seqNodeCaption(h.to);
  const parts = [];
  if (verb) parts.push(verb);
  if (fromCap) parts.push(fromCap);
  if (toCap && toCap !== fromCap) parts.push(toCap);
  if (parts.length) return parts.join(" · ");
  // Fall back to SBC-style derived caption toward peer.
  const cap = storyBehaviorCaption(h.from, h.to);
  return cap || "";
}

/** ADE SSR — participant caption: kind · role/channel · outgoing Calls/Publishes/Subscribes. */
function seqPartCaption(p, hops) {
  const base = seqNodeCaption(p && p.id);
  const pid = idVal(p && p.id);
  const out = (hops || []).find(
    (h) => idVal(h.from) === pid && h.variant !== "return" && (h.kind === "Calls" || h.kind === "Publishes" || h.kind === "Subscribes")
  );
  if (out && out.kind) {
    return base ? base + " · " + out.kind : String(out.kind);
  }
  return base || String((p && p.kind) || "");
}

function withSequenceCaptions(reading) {
  const hopsIn = (reading && reading.hops) || [];
  const hops = hopsIn.map((h) => {
    const caption = h.caption || seqHopCaption(h);
    return Object.assign({}, h, { caption: caption });
  });
  const participants = ((reading && reading.participants) || []).map((p) => {
    const caption = p.caption || seqPartCaption(p, hops);
    return Object.assign({}, p, { caption: caption });
  });
  return { participants: participants, hops: hops };
}

function sequenceOf(flow) {
  const ready = flow && flow.sequence;
  if (ready && (ready.participants || []).length && (ready.hops || []).length) {
    return withSequenceCaptions({
      participants: ready.participants.slice(),
      hops: ready.hops.slice(),
    });
  }
  return withSequenceCaptions(deriveSequence(flow));
}

function deriveSequence(flow) {
  const tree = (flow && flow.tree) || { nodes: [], edges: [] };
  const edges = (tree.edges || []).filter((e) => isInteractionKind(e.kind));
  if (!edges.length) return { participants: [], hops: [] };
  const walk = flowWalk(flow);
  const rank = new Map(walk.map((id, i) => [idVal(id), i]));
  const ordered = edges.slice().sort((a, b) => {
    const af = rank.has(idVal(a.from)) ? rank.get(idVal(a.from)) : 1e9;
    const bf = rank.has(idVal(b.from)) ? rank.get(idVal(b.from)) : 1e9;
    if (af !== bf) return af - bf;
    const at = rank.has(idVal(a.to)) ? rank.get(idVal(a.to)) : 1e9;
    const bt = rank.has(idVal(b.to)) ? rank.get(idVal(b.to)) : 1e9;
    return at - bt;
  });
  const hops = [];
  const seen = new Set();
  for (const e of ordered) {
    const key = idVal(e.from) + "\0" + idVal(e.to) + "\0" + (e.kind || "");
    if (seen.has(key)) continue;
    seen.add(key);
    const fromN = nodeById.get(idVal(e.from));
    const toN = nodeById.get(idVal(e.to));
    const fromFqn = (fromN && fromN.fqn) || idVal(e.from);
    const toFqn = (toN && toN.fqn) || idVal(e.to);
    const variant = e.kind === "Calls" ? "call" : "default";
    hops.push({
      from: idVal(e.from),
      to: idVal(e.to),
      from_fqn: fromFqn,
      to_fqn: toFqn,
      kind: e.kind,
      variant,
      file: (e.span && e.span.file) || (fromN && fromN.span && fromN.span.file) || "",
    });
    if (e.kind === "Calls") {
      hops.push({
        from: idVal(e.to),
        to: idVal(e.from),
        from_fqn: toFqn,
        to_fqn: fromFqn,
        kind: e.kind,
        variant: "return",
        file: (e.span && e.span.file) || (toN && toN.span && toN.span.file) || "",
      });
    }
  }
  const participants = [];
  const seenP = new Set();
  for (const h of hops) {
    for (const id of [idVal(h.from), idVal(h.to)]) {
      if (seenP.has(id)) continue;
      seenP.add(id);
      const n = nodeById.get(id);
      participants.push({
        id,
        fqn: (n && n.fqn) || id,
        kind: (n && n.kind) || "Function",
        file: n && n.span ? n.span.file : "",
      });
    }
  }
  return { participants, hops };
}

function seqHops() {
  return sequenceOf(sequenceFlow()).hops;
}

function seqParts() {
  return sequenceOf(sequenceFlow()).participants;
}

function stopSeqWalk() {
  seqWalk.playing = false;
  if (seqWalk.timer) {
    clearInterval(seqWalk.timer);
    seqWalk.timer = 0;
  }
  const play = document.getElementById("seqPlay");
  if (play) {
    play.classList.remove("on");
    play.setAttribute("aria-pressed", "false");
    play.textContent = "Play";
  }
}

function stepSeqWalk(dir) {
  const hops = seqHops();
  if (!hops.length) return;
  let i = seqCursor + dir;
  if (i < 0) i = 0;
  if (i >= hops.length) {
    i = hops.length - 1;
    stopSeqWalk();
  }
  seqCursor = i;
  paint({ animate: "none" });
  focusSeqHop(hops[i]);
}

function toggleSeqReview() {
  if (seqWalk.playing) {
    stopSeqWalk();
    const hops = seqHops();
    flashToast("Paused · " + Math.max(seqCursor, 0) + "/" + hops.length, "ok");
    return;
  }
  const hops = seqHops();
  if (!hops.length) {
    flashToast("No derived call hops on this flow", "skip");
    return;
  }
  if (seqCursor >= hops.length - 1) seqCursor = -1;
  seqWalk.playing = true;
  flashToast("Walking callers → callees", "ok");
  stepSeqWalk(1);
  if (reduceMotion()) {
    stopSeqWalk();
    return;
  }
  seqWalk.timer = setInterval(() => {
    const next = seqHops();
    if (seqCursor >= next.length - 1) {
      stopSeqWalk();
      flashToast("End · sequence", "ok");
      return;
    }
    stepSeqWalk(1);
  }, 720);
}

function resetSeqOverview() {
  stopSeqWalk();
  seqCursor = -1;
  seqPartFocusId = null;
  selectedNodeId = null;
  paint({ animate: "none" });
}

function focusSeqHop(hop) {
  if (!hop) return;
  // ADE SSR — Play / hop focus stays graph-only (no Evidence / peekSource / showHop).
  const id = hop.variant === "return" ? hop.to : hop.from;
  if (id) selectedNodeId = idVal(id);
  seqPartFocusId = null;
}

function seqVariantMark(v) {
  if (v === "return") return "←";
  if (v === "call") return "→";
  return "·";
}


function toggleSeqPartFocus(id) {
  const sid = idVal(id);
  if (!sid) return;
  if (seqPartFocusId && idVal(seqPartFocusId) === sid) {
    seqPartFocusId = null;
    selectedNodeId = null;
  } else {
    seqPartFocusId = sid;
    selectedNodeId = sid;
  }
  paint({ animate: "none" });
}

function seqPartRelated(h, partId) {
  const pid = idVal(partId);
  return !!(pid && (idVal(h.from) === pid || idVal(h.to) === pid));
}

function renderSequenceBody() {
  const flow = sequenceFlow();
  const reading = sequenceOf(flow);
  const parts = reading.participants;
  const hops = reading.hops;
  const seqQ = (graphFilter.q || "").toLowerCase();
  const seqHit = (s) => String(s || "").toLowerCase().indexOf(seqQ) >= 0;
  const seqPartMatch = (p) => !seqQ || seqHit(p.fqn) || seqHit(p.kind) || seqHit(p.file);
  const seqHopMatch = (h) => {
    if (!seqQ) return true;
    const fromP = parts.find((p) => idVal(p.id) === idVal(h.from));
    const toP = parts.find((p) => idVal(p.id) === idVal(h.to));
    return (
      seqHit(h.from_fqn) ||
      seqHit(h.to_fqn) ||
      seqHit(h.kind) ||
      seqHit(h.variant) ||
      seqHit(h.file) ||
      seqHit(fromP && fromP.file) ||
      seqHit(toP && toP.file)
    );
  };
  if (seqQ) {
    const keepP = parts.filter(seqPartMatch);
    const keepH = hops.filter(seqHopMatch);
    if (!keepP.length && !keepH.length) {
      return '<div class="empty">No sequence hops match “' + esc(graphFilter.q) + '”.</div>';
    }
  }
  if (!parts.length || !hops.length) {
    return (
      '<div class="empty seq-empty" data-ssr-empty="1">' +
      "No Steiner Calls / Publishes / Subscribes on this flow. " +
      "Sequence shows derived interaction only — try " +
      '<button type="button" class="crumb-btn" data-ws="overview">Overview Play</button>' +
      " or " +
      '<button type="button" class="crumb-btn" data-ws="dataflow">Data-flow</button>' +
      " for behavior graphs." +
      "</div>"
    );
  }
  if (seqCursor >= hops.length) seqCursor = hops.length - 1;
  const hot = seqCursor >= 0 ? hops[seqCursor] : null;
  const hopCards = hops.map((h, i) => ({ h, i })).filter(({ h }) => seqHopMatch(h));
  const review =
    '<div class="review-strip" id="seqReview">' +
    '<button type="button" class="review-step" id="seqOverview">Overview</button>' +
    '<button type="button" class="review-step" id="seqPrev">Prev</button>' +
    '<button type="button" class="review-step' +
    (seqWalk.playing ? " on" : "") +
    '" id="seqPlay" aria-pressed="' +
    (seqWalk.playing ? "true" : "false") +
    '">Play</button>' +
    '<button type="button" class="review-step" id="seqNext">Next</button>' +
    '<span id="seqStatus">' +
    (hot
      ? seqCursor + 1 + "/" + hops.length + " · " + (hot.kind || "") + " " + shortOf(hot.from_fqn) + " → " + shortOf(hot.to_fqn)
      : hops.length + " hops · " + (flow && flow.name ? flow.name : "flow")) +
    "</span></div>";
  const focusId = seqPartFocusId ? idVal(seqPartFocusId) : "";
  const heads = parts
    .map((p) => {
      const pid = idVal(p.id);
      const on =
        (hot && (idVal(hot.from) === pid || idVal(hot.to) === pid)) ||
        (focusId && focusId === pid);
      const match = seqPartMatch(p);
      const caption = p.caption || seqPartCaption(p, hops);
      const focusDim = !!(focusId && focusId !== pid);
      return (
        '<button type="button" class="seq-part vnode kind-' +
        esc(p.kind || "Function") +
        (on ? " on" : "") +
        (focusId && focusId === pid ? " ssr-hit" : "") +
        (focusDim ? " ssr-dim" : "") +
        (seqQ && match ? " hit" : "") +
        (seqQ && !match ? " dim" : "") +
        '" data-id="' +
        esc(pid) +
        '" data-fqn="' +
        esc(p.fqn) +
        '" data-kind="' +
        esc(p.kind || "") +
        '"' +
        (caption ? ' data-ssr-caption="1" data-caption="' + esc(caption) + '"' : "") +
        (p.file ? ' data-file="' + esc(p.file) + '"' : "") +
        ' aria-pressed="' +
        (focusId && focusId === pid ? "true" : "false") +
        '"><span class="name">' +
        esc(shortOf(p.fqn)) +
        '</span> <span class="meta">' +
        esc(p.kind || "") +
        "</span>" +
        (caption
          ? '<span class="seq-part-caption">' + esc(caption) + "</span>"
          : "") +
        "</button>"
      );
    })
    .join("");
  const list = hopCards
    .map(({ h, i }) => {
      const caption = h.caption || seqHopCaption(h);
      const related = focusId ? seqPartRelated(h, focusId) : true;
      return (
        '<article class="seq-hop expl-card' +
        (i === seqCursor ? " on" : "") +
        (focusId && related ? " ssr-hit" : "") +
        (focusId && !related ? " ssr-dim" : "") +
        '" data-seq-i="' +
        i +
        '" data-kind="' +
        esc(h.kind || "") +
        '" data-seq-variant="' +
        esc(h.variant || "default") +
        '" data-from="' +
        esc(idVal(h.from)) +
        '" data-to="' +
        esc(idVal(h.to)) +
        '" data-fqn="' +
        esc(h.from_fqn) +
        '"' +
        (caption ? ' data-ssr-caption="1" data-caption="' + esc(caption) + '"' : "") +
        '"><div class="k">' +
        esc(seqVariantMark(h.variant) + " " + (h.kind || "") + (h.variant === "return" ? " return" : "")) +
        '</div><div class="t">' +
        esc(shortOf(h.from_fqn) + " → " + shortOf(h.to_fqn)) +
        '</div><div class="b seq-hop-caption">' +
        esc(caption || shortOf(h.from_fqn) + " → " + shortOf(h.to_fqn)) +
        "</div></article>"
      );
    })
    .join("");
  return (
    '<div class="seq-page" data-ssr="1">' +
    review +
    '<div class="seq-parts" id="seqParts" style="--seq-n:' +
    parts.length +
    '">' +
    heads +
    "</div>" +
    '<div class="ws-split">' +
    '<div class="ws-list" id="seqHops">' +
    list +
    "</div>" +
    '<div class="ws-detail">' +
    '<div class="k">' +
    esc((flow && flow.name) || "flow") +
    " · Steiner</div>" +
    '<div id="seqCanvas" class="seq-canvas" style="--seq-n:' +
    parts.length +
    '"></div></div></div></div>'
  );
}

function sequenceBodyKey() {
  const flow = sequenceFlow();
  const reading = sequenceOf(flow);
  return [flow && flow.name, reading.participants.length, reading.hops.length, graphFilter.q || ""].join("\0");
}

function sequenceCanvasProps() {
  const reading = sequenceOf(sequenceFlow());
  const focusId = seqPartFocusId ? idVal(seqPartFocusId) : "";
  return {
    participants: reading.participants.map((p) => {
      const paint = graphNodePaint(p.id, { fqn: p.fqn, kind: p.kind || "Function", file: p.file || "" });
      const pid = idVal(p.id);
      const caption = p.caption || seqPartCaption(p, reading.hops);
      const focusDim = !!(focusId && focusId !== pid);
      return {
        id: pid,
        fqn: p.fqn,
        kind: p.kind || "Function",
        label: shortOf(p.fqn),
        caption: caption,
        file: paint.file || p.file || "",
        dim: paint.dim || focusDim,
        hit: paint.hit || (!!focusId && focusId === pid),
      };
    }),
    hops: reading.hops.map((h, i) => ({
      i,
      from: idVal(h.from),
      to: idVal(h.to),
      kind: h.kind || "",
      variant: h.variant || "default",
      fromLabel: shortOf(h.from_fqn),
      toLabel: shortOf(h.to_fqn),
      caption: h.caption || seqHopCaption(h),
      dim: !!(focusId && !seqPartRelated(h, focusId)),
      hit: !!(focusId && seqPartRelated(h, focusId)),
    })),
    cursor: seqCursor,
    onNodeClick: (id) => {
      if (!id) return;
      // ADE SSR — graph-only highlight (no peekSource / Evidence).
      toggleSeqPartFocus(id);
    },
    onHopClick: (i) => {
      if (!Number.isFinite(i)) return;
      stopSeqWalk();
      seqCursor = i;
      paint({ animate: "none" });
      focusSeqHop(seqHops()[i]);
    },
  };
}

function patchSequenceChrome() {
  const hops = seqHops();
  const hot = seqCursor >= 0 ? hops[seqCursor] : null;
  canvas.querySelectorAll("#seqHops .seq-hop").forEach((el) => {
    const i = parseInt(el.getAttribute("data-seq-i"), 10);
    el.classList.toggle("on", i === seqCursor);
  });
  const focusId = seqPartFocusId ? idVal(seqPartFocusId) : "";
  canvas.querySelectorAll("#seqParts .seq-part").forEach((el) => {
    const id = el.getAttribute("data-id");
    const on = !!(
      (hot && (idVal(hot.from) === id || idVal(hot.to) === id)) ||
      (focusId && focusId === id)
    );
    el.classList.toggle("on", on);
    el.classList.toggle("ssr-hit", !!(focusId && focusId === id));
    el.classList.toggle("ssr-dim", !!(focusId && focusId !== id));
    el.setAttribute("aria-pressed", focusId && focusId === id ? "true" : "false");
  });
  canvas.querySelectorAll("#seqHops .seq-hop").forEach((el) => {
    const from = el.getAttribute("data-from");
    const to = el.getAttribute("data-to");
    const related = !!(focusId && (from === focusId || to === focusId));
    el.classList.toggle("ssr-hit", !!(focusId && related));
    el.classList.toggle("ssr-dim", !!(focusId && !related));
  });
  const status = document.getElementById("seqStatus");
  const flow = sequenceFlow();
  if (status) {
    status.textContent = hot
      ? seqCursor + 1 + "/" + hops.length + " · " + (hot.kind || "") + " " + shortOf(hot.from_fqn) + " → " + shortOf(hot.to_fqn)
      : hops.length + " hops · " + (flow && flow.name ? flow.name : "flow");
  }
  const play = document.getElementById("seqPlay");
  if (play) {
    play.classList.toggle("on", !!seqWalk.playing);
    play.setAttribute("aria-pressed", seqWalk.playing ? "true" : "false");
  }
}

function paintSequenceWorkspace(title) {
  canvas.className = "play explorer-list";
  const html = renderSequenceBody();
  const key = sequenceBodyKey();
  const keep = !!(
    canvas.querySelector(".seq-page") &&
    document.getElementById("seqCanvas") &&
    key === seqBodyKey &&
    html.indexOf('id="seqCanvas"') >= 0
  );
  if (keep) {
    patchSequenceChrome();
  } else {
    unmountSequenceCanvas();
    canvas.innerHTML = '<div class="expl-wrap"><div class="flow-title">' + esc(title) + "</div>" + html + "</div>";
    seqBodyKey = html.indexOf('id="seqCanvas"') >= 0 ? key : "";
  }
  const host = document.getElementById("seqCanvas");
  if (host) renderSequenceCanvas(host, sequenceCanvasProps());
  else unmountSequenceCanvas();
  applyGraphFilter();
  if (typeof ensureFocusTrailChip === "function") ensureFocusTrailChip();
  if (typeof applyFocusTrailPaint === "function") applyFocusTrailPaint();
}

function bindSequencePage() {
  canvas.querySelectorAll("#seqHops .seq-hop").forEach((el) => {
    el.onclick = (ev) => {
      ev.stopPropagation();
      const i = parseInt(el.getAttribute("data-seq-i"), 10);
      if (!Number.isFinite(i)) return;
      stopSeqWalk();
      seqCursor = i;
      paint({ animate: "none" });
      focusSeqHop(seqHops()[i]);
    };
  });
  canvas.querySelectorAll("#seqParts .seq-part").forEach((el) => {
    el.onclick = (ev) => {
      ev.stopPropagation();
      const id = el.getAttribute("data-id");
      if (!id) return;
      // ADE SSR — graph-only highlight (no peekSource / Evidence).
      toggleSeqPartFocus(id);
    };
  });
  canvas.querySelectorAll(".seq-empty [data-ws]").forEach((el) => {
    el.onclick = (ev) => {
      ev.stopPropagation();
      setWorkspace(el.getAttribute("data-ws"), true);
    };
  });
  const overview = document.getElementById("seqOverview");
  const prev = document.getElementById("seqPrev");
  const next = document.getElementById("seqNext");
  const play = document.getElementById("seqPlay");
  if (overview) overview.onclick = () => resetSeqOverview();
  if (prev)
    prev.onclick = () => {
      stopSeqWalk();
      stepSeqWalk(seqCursor < 0 ? 1 : -1);
    };
  if (next)
    next.onclick = () => {
      stopSeqWalk();
      stepSeqWalk(1);
    };
  if (play) play.onclick = () => toggleSeqReview();
}

function isDataKind(kind) {
  return kind === "Reads" || kind === "Writes" || kind === "Publishes" || kind === "Subscribes";
}

function dataReverses(kind) {
  return kind === "Reads" || kind === "Subscribes";
}

/** Current flow's Steiner as sources → stores → sinks. Engine `dataflow` when present. */
function dataflowFlow() {
  const cur = currentFlow();
  if (cur && dataflowOf(cur).hops.length) return cur;
  const named = ((snapshot && snapshot.flows) || []).find((f) => f && f.name === "data-subscription");
  if (named && dataflowOf(named).hops.length) return named;
  const story = storyFlow();
  if (story && dataflowOf(story).hops.length) return story;
  for (const f of (snapshot && snapshot.flows) || []) {
    if (dataflowOf(f).hops.length) return f;
  }
  return cur || story || named || null;
}

function dataflowOf(flow) {
  const ready = flow && flow.dataflow;
  if (ready && (ready.nodes || []).length && (ready.hops || []).length) {
    return {
      nodes: ready.nodes.slice(),
      hops: ready.hops.slice(),
    };
  }
  return deriveDataflow(flow);
}

const DATA_EDGE_ORD = {
  Calls: 0,
  Reads: 1,
  Writes: 2,
  Imports: 3,
  TypeUses: 4,
  Contains: 5,
  Publishes: 6,
  Subscribes: 7,
};

function cmpDataId(a, b) {
  if (a === b) return 0;
  try {
    const d = BigInt(a) - BigInt(b);
    if (d < 0n) return -1;
    if (d > 0n) return 1;
    return 0;
  } catch (err) {
    return a < b ? -1 : 1;
  }
}

function dataEndsOf(e) {
  const rev = dataReverses(e.kind);
  return rev ? [idVal(e.to), idVal(e.from)] : [idVal(e.from), idVal(e.to)];
}

/** Producer → consumer. Steiner rank only breaks ties. */
function orderDataHops(edges, rank) {
  if (!edges || edges.length <= 1) return (edges || []).slice();
  const rankOf = (id) => (rank.has(id) ? rank.get(id) : 1e15);
  const indeg = new Map();
  const outs = new Map();
  edges.forEach((e, i) => {
    const ends = dataEndsOf(e);
    const prod = ends[0];
    const cons = ends[1];
    if (!indeg.has(prod)) indeg.set(prod, 0);
    indeg.set(cons, (indeg.get(cons) || 0) + 1);
    if (!outs.has(prod)) outs.set(prod, []);
    outs.get(prod).push(i);
  });
  const byRank = (a, b) => rankOf(a) - rankOf(b) || cmpDataId(a, b);
  const ready = [...indeg.keys()].filter((id) => indeg.get(id) === 0);
  ready.sort(byRank);
  const used = edges.map(() => false);
  const ordered = [];
  let i = 0;
  while (i < ready.length) {
    const prod = ready[i];
    i += 1;
    const idxs = (outs.get(prod) || []).slice().sort((a, b) => {
      const ea = dataEndsOf(edges[a]);
      const eb = dataEndsOf(edges[b]);
      const ra = rankOf(ea[1]);
      const rb = rankOf(eb[1]);
      if (ra !== rb) return ra - rb;
      const ka = DATA_EDGE_ORD[edges[a].kind] == null ? 99 : DATA_EDGE_ORD[edges[a].kind];
      const kb = DATA_EDGE_ORD[edges[b].kind] == null ? 99 : DATA_EDGE_ORD[edges[b].kind];
      if (ka !== kb) return ka - kb;
      return cmpDataId(ea[1], eb[1]);
    });
    for (const ix of idxs) {
      if (used[ix]) continue;
      used[ix] = true;
      ordered.push(edges[ix]);
      const cons = dataEndsOf(edges[ix])[1];
      if (cons === prod) continue;
      indeg.set(cons, (indeg.get(cons) || 1) - 1);
      if (indeg.get(cons) === 0) {
        ready.push(cons);
        const tail = ready.slice(i).sort(byRank);
        ready.splice(i, ready.length - i, ...tail);
      }
    }
  }
  if (ordered.length !== edges.length) {
    const rest = edges.filter((_, ix) => !used[ix]);
    rest.sort((a, b) => {
      const ea = dataEndsOf(a);
      const eb = dataEndsOf(b);
      return rankOf(ea[0]) - rankOf(eb[0]) || rankOf(ea[1]) - rankOf(eb[1]) || (DATA_EDGE_ORD[a.kind] || 0) - (DATA_EDGE_ORD[b.kind] || 0);
    });
    ordered.push(...rest);
  }
  return ordered;
}

function deriveDataflow(flow) {
  const tree = (flow && flow.tree) || { nodes: [], edges: [] };
  const treeIds = new Set((tree.nodes || []).map(idVal));
  const graphEdges = ((snapshot && snapshot.graph && snapshot.graph.edges) || []).concat(tree.edges || []);
  const endpoints = new Set();
  treeIds.forEach((id) => {
    const n = nodeById.get(id);
    if (n && n.kind === "Endpoint") endpoints.add(id);
  });
  const seen = new Set();
  const edges = [];
  const consider = (e) => {
    if (!e || !isDataKind(e.kind)) return;
    const key = idVal(e.from) + "\0" + idVal(e.to) + "\0" + e.kind;
    if (seen.has(key)) return;
    const onTree = (tree.edges || []).some(
      (t) => idVal(t.from) === idVal(e.from) && idVal(t.to) === idVal(e.to) && t.kind === e.kind
    );
    const bus = endpoints.has(idVal(e.from)) || endpoints.has(idVal(e.to));
    if (!onTree && !bus) return;
    seen.add(key);
    edges.push(e);
  };
  (tree.edges || []).forEach(consider);
  graphEdges.forEach(consider);
  if (!edges.length) return { nodes: [], hops: [] };
  const walk = flowWalk(flow);
  const rank = new Map(walk.map((id, i) => [idVal(id), i]));
  const ordered = orderDataHops(edges, rank);
  const hops = [];
  for (const e of ordered) {
    const rev = dataReverses(e.kind);
    const from = idVal(rev ? e.to : e.from);
    const to = idVal(rev ? e.from : e.to);
    const fromN = nodeById.get(from);
    const toN = nodeById.get(to);
    hops.push({
      from,
      to,
      from_fqn: (fromN && fromN.fqn) || from,
      to_fqn: (toN && toN.fqn) || to,
      kind: e.kind,
      file: (e.span && e.span.file) || (fromN && fromN.span && fromN.span.file) || "",
    });
  }
  const incoming = new Map();
  const outgoing = new Map();
  const order = [];
  const seenN = new Set();
  for (const h of hops) {
    outgoing.set(h.from, (outgoing.get(h.from) || 0) + 1);
    incoming.set(h.to, (incoming.get(h.to) || 0) + 1);
    for (const id of [h.from, h.to]) {
      if (seenN.has(id)) continue;
      seenN.add(id);
      order.push(id);
    }
  }
  const nodes = order.map((id) => {
    const n = nodeById.get(id);
    const ep = n && n.endpoint ? n.endpoint : null;
    const inn = incoming.get(id) || 0;
    const out = outgoing.get(id) || 0;
    return {
      id,
      fqn: (n && n.fqn) || id,
      kind: (n && n.kind) || "Function",
      role: classifyDfRole((n && n.kind) || "Function", ep, inn, out),
      end_role: ep && ep.role ? ep.role : "",
      channel: ep && ep.channel ? ep.channel : "",
      file: n && n.span ? n.span.file : "",
    };
  });
  return { nodes, hops };
}

function classifyDfRole(kind, ep, incoming, outgoing) {
  const channel = ep && ep.channel ? ep.channel : "";
  const endRole = ep && ep.role ? ep.role : "";
  if (incoming > 0 && outgoing > 0) {
    if (kind === "Endpoint" || channel === "Queue" || channel === "Table" || channel === "Channel") {
      return "store";
    }
    return "transform";
  }
  if (outgoing > 0 && incoming === 0) return "source";
  if (incoming > 0 && outgoing === 0) return "sink";
  if (endRole === "Source") return "source";
  if (endRole === "Sink") return "sink";
  return kind === "Endpoint" ? "store" : "transform";
}

function dfHops() {
  return dataflowOf(dataflowFlow()).hops;
}

function dfNodes() {
  return dataflowOf(dataflowFlow()).nodes;
}

function stopDfWalk() {
  dfWalk.playing = false;
  if (dfWalk.timer) {
    clearInterval(dfWalk.timer);
    dfWalk.timer = 0;
  }
  const play = document.getElementById("dfPlay");
  if (play) {
    play.classList.remove("on");
    play.setAttribute("aria-pressed", "false");
    play.textContent = "Play";
  }
}

function stepDfWalk(dir) {
  const hops = dfHops();
  if (!hops.length) return;
  let i = dfCursor + dir;
  if (i < 0) i = 0;
  if (i >= hops.length) {
    i = hops.length - 1;
    stopDfWalk();
  }
  dfCursor = i;
  paint({ animate: "none" });
  focusDfHop(hops[i]);
}

function toggleDfReview() {
  if (dfWalk.playing) {
    stopDfWalk();
    const hops = dfHops();
    flashToast("Paused · " + Math.max(dfCursor, 0) + "/" + hops.length, "ok");
    return;
  }
  const hops = dfHops();
  if (!hops.length) {
    flashToast("No derived data hops on this flow", "skip");
    return;
  }
  if (dfCursor >= hops.length - 1) dfCursor = -1;
  dfWalk.playing = true;
  flashToast("Walking sources → sinks", "ok");
  stepDfWalk(1);
  if (reduceMotion()) {
    stopDfWalk();
    return;
  }
  dfWalk.timer = setInterval(() => {
    const next = dfHops();
    if (dfCursor >= next.length - 1) {
      stopDfWalk();
      flashToast("End · data-flow", "ok");
      return;
    }
    stepDfWalk(1);
  }, 720);
}

function resetDfOverview() {
  stopDfWalk();
  dfCursor = -1;
  dfRoleFilter = null;
  paint({ animate: "none" });
}

function focusDfHop(hop) {
  if (!hop) return;
  // ADE RDF — Play / hop focus stays graph-only (no Evidence / peekSource / showHop).
  if (hop.from) selectedNodeId = idVal(hop.from);
}

function dfRoleLabel(role) {
  if (role === "source") return "Sources";
  if (role === "transform") return "Transforms";
  if (role === "store") return "Stores";
  return "Sinks";
}

function dfRoleWord(role) {
  if (role === "source") return "Source";
  if (role === "transform") return "Transform";
  if (role === "store") return "Store";
  return "Sink";
}

/** ADE RDF — role · channel (when endpoint) · short label; never file:line. */
function dfNodeMeta(n) {
  const parts = [dfRoleWord(n.role || "transform")];
  if (n.channel) parts.push(String(n.channel));
  else if (n.end_role) parts.push(String(n.end_role));
  return parts.join(" · ");
}

function toggleDfRoleFilter(role) {
  const next = role && dfRoleFilter === role ? null : role || null;
  dfRoleFilter = next;
  paint({ animate: "none" });
}

function dfNodeLaneDim(n) {
  return !!(dfRoleFilter && n && n.role !== dfRoleFilter);
}

function renderDataflowBody() {
  const flow = dataflowFlow();
  const reading = dataflowOf(flow);
  const nodes = reading.nodes;
  const hops = reading.hops;
  const dfQ = (graphFilter.q || "").toLowerCase();
  const dfHit = (s) => String(s || "").toLowerCase().indexOf(dfQ) >= 0;
  const dfNodeMatch = (n) =>
    !dfQ || dfHit(n.fqn) || dfHit(n.kind) || dfHit(n.role) || dfHit(n.end_role) || dfHit(n.channel) || dfHit(n.file);
  const dfHopMatch = (h) => {
    if (!dfQ) return true;
    const fromN = nodes.find((n) => idVal(n.id) === idVal(h.from));
    const toN = nodes.find((n) => idVal(n.id) === idVal(h.to));
    return (
      dfHit(h.from_fqn) ||
      dfHit(h.to_fqn) ||
      dfHit(h.kind) ||
      dfHit(h.file) ||
      dfHit(fromN && fromN.file) ||
      dfHit(toN && toN.file)
    );
  };
  if (dfQ) {
    const keepN = nodes.filter(dfNodeMatch);
    const keepH = hops.filter(dfHopMatch);
    if (!keepN.length && !keepH.length) {
      return '<div class="empty">No data-flow hops match “' + esc(graphFilter.q) + '”.</div>';
    }
  }
  if (!nodes.length || !hops.length) {
    return (
      '<div class="empty df-empty" data-df-empty="1">' +
      "No Steiner Reads / Writes / Publishes / Subscribes on this flow. " +
      "Data-flow shows derived movement only — try " +
      '<button type="button" class="crumb-btn" data-ws="overview">Overview Play</button>' +
      " or " +
      '<button type="button" class="crumb-btn" data-ws="sequence">Sequence</button>' +
      " for control-flow behavior." +
      "</div>"
    );
  }
  if (dfCursor >= hops.length) dfCursor = hops.length - 1;
  const hot = dfCursor >= 0 ? hops[dfCursor] : null;
  const hopCards = hops.map((h, i) => ({ h, i })).filter(({ h }) => dfHopMatch(h));
  const review =
    '<div class="review-strip" id="dfReview">' +
    '<button type="button" class="review-step" id="dfOverview">Overview</button>' +
    '<button type="button" class="review-step" id="dfPrev">Prev</button>' +
    '<button type="button" class="review-step' +
    (dfWalk.playing ? " on" : "") +
    '" id="dfPlay" aria-pressed="' +
    (dfWalk.playing ? "true" : "false") +
    '">Play</button>' +
    '<button type="button" class="review-step" id="dfNext">Next</button>' +
    '<span id="dfStatus">' +
    (hot
      ? dfCursor + 1 + "/" + hops.length + " · " + (hot.kind || "") + " " + shortOf(hot.from_fqn) + " → " + shortOf(hot.to_fqn)
      : hops.length + " hops · " + (flow && flow.name ? flow.name : "flow")) +
    "</span></div>";
  // ADE RDF — always show all four lanes with counts (empty lanes stay visible).
  const stages = ["source", "transform", "store", "sink"];
  const stageCols = stages
    .map((role) => {
      const col = nodes.filter((n) => n.role === role);
      const laneOn = dfRoleFilter === role;
      const laneDim = !!(dfRoleFilter && dfRoleFilter !== role);
      const cards = col
        .map((n) => {
          const on =
            (hot && (idVal(hot.from) === idVal(n.id) || idVal(hot.to) === idVal(n.id))) ||
            (selectedNodeId && idVal(selectedNodeId) === idVal(n.id));
          const match = dfNodeMatch(n);
          const roleDim = dfNodeLaneDim(n);
          const meta = dfNodeMeta(n);
          return (
            '<button type="button" class="df-node vnode kind-' +
            esc(n.kind || "Function") +
            (on ? " on" : "") +
            (dfQ && match ? " hit" : "") +
            ((dfQ && !match) || roleDim ? " dim" : "") +
            (roleDim ? " df-lane-dim" : "") +
            (!roleDim && dfRoleFilter ? " df-lane-hit" : "") +
            '" data-id="' +
            esc(idVal(n.id)) +
            '" data-fqn="' +
            esc(n.fqn) +
            '" data-kind="' +
            esc(n.kind || "") +
            '" data-df-role="' +
            esc(n.role) +
            '" data-rdf-meta="1"' +
            (n.end_role ? ' data-end-role="' + esc(n.end_role) + '"' : "") +
            (n.channel ? ' data-channel="' + esc(n.channel) + '"' : "") +
            (n.file ? ' data-file="' + esc(n.file) + '"' : "") +
            '><span class="name">' +
            esc(shortOf(n.fqn)) +
            '</span> <span class="meta">' +
            esc(meta) +
            "</span></button>"
          );
        })
        .join("");
      return (
        '<div class="df-stage' +
        (laneOn ? " on" : "") +
        (laneDim ? " dim" : "") +
        '" data-df-role="' +
        role +
        '"><button type="button" class="df-lane-head' +
        (laneOn ? " on" : "") +
        '" data-df-lane="' +
        role +
        '" aria-pressed="' +
        (laneOn ? "true" : "false") +
        '"><span class="k">' +
        esc(dfRoleLabel(role)) +
        '</span><span class="df-lane-count" data-df-count="' +
        col.length +
        '">' +
        col.length +
        "</span></button>" +
        (cards || '<div class="df-lane-empty">none</div>') +
        "</div>"
      );
    })
    .join("");
  const list = hopCards
    .map(({ h, i }) => {
      const fromN = nodes.find((n) => idVal(n.id) === idVal(h.from));
      const toN = nodes.find((n) => idVal(n.id) === idVal(h.to));
      const hopDim =
        !!(dfRoleFilter && fromN && toN && fromN.role !== dfRoleFilter && toN.role !== dfRoleFilter);
      return (
        '<article class="df-hop expl-card' +
        (i === dfCursor ? " on" : "") +
        (hopDim ? " dim" : "") +
        '" data-df-i="' +
        i +
        '" data-kind="' +
        esc(h.kind || "") +
        '" data-from="' +
        esc(idVal(h.from)) +
        '" data-to="' +
        esc(idVal(h.to)) +
        '" data-fqn="' +
        esc(h.from_fqn) +
        '"><div class="k">' +
        esc(h.kind || "") +
        '</div><div class="t">' +
        esc(shortOf(h.from_fqn) + " → " + shortOf(h.to_fqn)) +
        '</div><div class="b">' +
        esc((fromN ? dfNodeMeta(fromN) : "Source") + " → " + (toN ? dfNodeMeta(toN) : "Sink")) +
        "</div></article>"
      );
    })
    .join("");
  return (
    '<div class="df-page" data-rdf="1">' +
    review +
    '<div class="df-stages" id="dfStages" style="--df-n:' +
    stages.length +
    '">' +
    stageCols +
    "</div>" +
    '<div class="ws-split">' +
    '<div class="ws-list" id="dfHops">' +
    list +
    "</div>" +
    '<div class="ws-detail">' +
    '<div class="k">' +
    esc((flow && flow.name) || "flow") +
    " · pipeline</div>" +
    '<div id="dfCanvas" class="df-canvas seq-canvas"></div></div></div></div>'
  );
}

function dataflowWorkspaceKey() {
  const flow = dataflowFlow();
  const reading = dataflowOf(flow);
  return [flow && flow.name, reading.nodes.length, reading.hops.length, graphFilter.q || "", dfRoleFilter || ""].join("\0");
}

function dataflowCanvasProps() {
  const reading = dataflowOf(dataflowFlow());
  return {
    nodes: reading.nodes.map((n) => {
      const meta = dfNodeMeta(n);
      const paint = graphNodePaint(n.id, { fqn: n.fqn, kind: n.kind || "Function", file: n.file || "" });
      const roleDim = dfNodeLaneDim(n);
      return {
        id: idVal(n.id),
        fqn: n.fqn,
        kind: n.kind || "Function",
        label: shortOf(n.fqn),
        role: n.role,
        endRole: n.end_role || "",
        channel: n.channel || "",
        file: paint.file || n.file || "",
        dim: paint.dim || roleDim,
        hit: paint.hit || (!!dfRoleFilter && !roleDim),
        ep: meta,
      };
    }),
    hops: reading.hops.map((h, i) => ({
      i,
      from: idVal(h.from),
      to: idVal(h.to),
      kind: h.kind || "",
    })),
    cursor: dfCursor,
    onNodeClick: (id) => {
      if (!id) return;
      // ADE RDF — graph-only highlight (no peekSource / Evidence).
      selectedNodeId = id;
      paint({ animate: "none" });
    },
    onHopClick: (i) => {
      if (!Number.isFinite(i)) return;
      stopDfWalk();
      dfCursor = i;
      paint({ animate: "none" });
      focusDfHop(dfHops()[i]);
    },
  };
}

function patchDataflowChrome() {
  const hops = dfHops();
  const hot = dfCursor >= 0 ? hops[dfCursor] : null;
  canvas.querySelectorAll("#dfHops .df-hop").forEach((el) => {
    const i = parseInt(el.getAttribute("data-df-i"), 10);
    el.classList.toggle("on", i === dfCursor);
  });
  canvas.querySelectorAll("#dfStages .df-node").forEach((el) => {
    const id = el.getAttribute("data-id");
    const role = el.getAttribute("data-df-role");
    const on = !!(
      (hot && (idVal(hot.from) === id || idVal(hot.to) === id)) ||
      (selectedNodeId && idVal(selectedNodeId) === id)
    );
    el.classList.toggle("on", on);
    const roleDim = !!(dfRoleFilter && role !== dfRoleFilter);
    el.classList.toggle("dim", roleDim);
    el.classList.toggle("df-lane-dim", roleDim);
    el.classList.toggle("df-lane-hit", !!(dfRoleFilter && !roleDim));
  });
  canvas.querySelectorAll("#dfStages .df-stage").forEach((el) => {
    const role = el.getAttribute("data-df-role");
    el.classList.toggle("on", dfRoleFilter === role);
    el.classList.toggle("dim", !!(dfRoleFilter && dfRoleFilter !== role));
  });
  canvas.querySelectorAll("#dfStages .df-lane-head").forEach((el) => {
    const role = el.getAttribute("data-df-lane");
    const on = dfRoleFilter === role;
    el.classList.toggle("on", on);
    el.setAttribute("aria-pressed", on ? "true" : "false");
  });
  const status = document.getElementById("dfStatus");
  const flow = dataflowFlow();
  if (status) {
    status.textContent = hot
      ? dfCursor + 1 + "/" + hops.length + " · " + (hot.kind || "") + " " + shortOf(hot.from_fqn) + " → " + shortOf(hot.to_fqn)
      : hops.length + " hops · " + (flow && flow.name ? flow.name : "flow");
  }
  const play = document.getElementById("dfPlay");
  if (play) {
    play.classList.toggle("on", !!dfWalk.playing);
    play.setAttribute("aria-pressed", dfWalk.playing ? "true" : "false");
  }
}

function paintDataflowWorkspace(title) {
  canvas.className = "play explorer-list";
  const html = renderDataflowBody();
  const key = dataflowWorkspaceKey();
  const keep = !!(
    canvas.querySelector(".df-page") &&
    document.getElementById("dfCanvas") &&
    key === dfBodyKey &&
    html.indexOf('id="dfCanvas"') >= 0
  );
  if (keep) {
    patchDataflowChrome();
  } else {
    unmountReviewCanvas();
    canvas.innerHTML = '<div class="expl-wrap"><div class="flow-title">' + esc(title) + "</div>" + html + "</div>";
    dfBodyKey = html.indexOf('id="dfCanvas"') >= 0 ? key : "";
  }
  const host = document.getElementById("dfCanvas");
  if (host) renderDataflowCanvas(host, dataflowCanvasProps());
  else unmountReviewCanvas();
  applyGraphFilter();
}

function bindDataflowPage() {
  canvas.querySelectorAll("#dfHops .df-hop").forEach((el) => {
    el.onclick = (ev) => {
      ev.stopPropagation();
      const i = parseInt(el.getAttribute("data-df-i"), 10);
      if (!Number.isFinite(i)) return;
      stopDfWalk();
      dfCursor = i;
      paint({ animate: "none" });
      focusDfHop(dfHops()[i]);
    };
  });
  canvas.querySelectorAll("#dfStages .df-lane-head").forEach((el) => {
    el.onclick = (ev) => {
      ev.stopPropagation();
      toggleDfRoleFilter(el.getAttribute("data-df-lane"));
    };
  });
  canvas.querySelectorAll("#dfStages .df-node, #dfCanvas .df-node").forEach((el) => {
    el.onclick = (ev) => {
      ev.stopPropagation();
      const id = el.getAttribute("data-id");
      if (!id) return;
      // ADE RDF — graph-only highlight (no peekSource / Evidence).
      selectedNodeId = id;
      paint({ animate: "none" });
    };
  });
  canvas.querySelectorAll(".df-empty [data-ws]").forEach((el) => {
    el.onclick = (ev) => {
      ev.stopPropagation();
      setWorkspace(el.getAttribute("data-ws"), true);
    };
  });
  const overview = document.getElementById("dfOverview");
  const prev = document.getElementById("dfPrev");
  const next = document.getElementById("dfNext");
  const play = document.getElementById("dfPlay");
  if (overview) overview.onclick = () => resetDfOverview();
  if (prev)
    prev.onclick = () => {
      stopDfWalk();
      stepDfWalk(dfCursor < 0 ? 1 : -1);
    };
  if (next)
    next.onclick = () => {
      stopDfWalk();
      stepDfWalk(1);
    };
  if (play) play.onclick = () => toggleDfReview();
}

/** Current flow's review machine. Engine `lifecycle` when present; else derive. */
function lifecycleFlow() {
  const cur = currentFlow();
  if (cur && lifecycleOf(cur).transitions.length) return cur;
  const named = ((snapshot && snapshot.flows) || []).find((f) => f && f.name === "data-subscription");
  if (named && lifecycleOf(named).transitions.length) return named;
  const story = storyFlow();
  if (story && lifecycleOf(story).transitions.length) return story;
  for (const f of (snapshot && snapshot.flows) || []) {
    if (lifecycleOf(f).transitions.length) return f;
  }
  return cur || story || named || null;
}

function lifecycleOf(flow) {
  const ready = flow && flow.lifecycle;
  if (ready && (ready.states || []).length && (ready.transitions || []).length) {
    return {
      lanes: (ready.lanes || []).slice(),
      states: ready.states.slice(),
      transitions: ready.transitions.slice(),
      endpoints: (ready.endpoints || []).slice(),
    };
  }
  return deriveLifecycle(flow);
}

function deriveLifecycle(flow) {
  if (!flow) return { lanes: [], states: [], transitions: [], endpoints: [] };
  const tree = flow.tree || { nodes: [], edges: [] };
  const hops = (tree.edges || []).length;
  const walkingSub = hops === 0 ? "" : hops === 1 ? "1 hop" : hops + " hops";
  const ends = [];
  const seen = new Set();
  for (const id of tree.nodes || []) {
    const key = idVal(id);
    if (seen.has(key)) continue;
    seen.add(key);
    const n = nodeById.get(key);
    if (!n || (n.kind !== "Type" && n.kind !== "Endpoint")) continue;
    ends.push({
      id: key,
      fqn: n.fqn || key,
      kind: n.kind,
      file: n.span ? n.span.file : "",
    });
  }
  ends.sort((a, b) => String(a.fqn).localeCompare(String(b.fqn)));
  return {
    lanes: [
      { id: "main", label: "Review" },
      { id: "events", label: "Wait / retry" },
      { id: "terminal", label: "Outcomes" },
    ],
    states: [
      { id: "proposed", type: "start", label: "Proposed", lane: "main", col: 0 },
      { id: "walking", type: "active", label: "Walking", sublabel: walkingSub, lane: "main", col: 1 },
      { id: "waiting", type: "waiting", label: "Waiting", sublabel: "stamp / skip", lane: "events", col: 0 },
      { id: "stamped", type: "success", label: "Stamped", lane: "terminal", col: 0 },
      { id: "skipped", type: "neutral", label: "Skipped", lane: "terminal", col: 1 },
      { id: "broken", type: "failure", label: "Broken", lane: "events", col: 1 },
    ],
    transitions: [
      { from: "proposed", to: "walking", label: "play" },
      { from: "walking", to: "waiting", label: "wait" },
      { from: "waiting", to: "stamped", label: "stamp" },
      { from: "waiting", to: "skipped", label: "skip" },
      { from: "stamped", to: "broken", label: "break" },
      { from: "broken", to: "walking", label: "recover" },
    ],
    endpoints: ends,
  };
}

function lcTrans() {
  return lifecycleOf(lifecycleFlow()).transitions;
}

function lcStates() {
  return lifecycleOf(lifecycleFlow()).states;
}

function lcCurrentId(flow) {
  const mark = flowMark(flow && flow.name);
  if (mark === "holds") return "stamped";
  if (mark === "skipped") return "skipped";
  if (mark === "broken") return "broken";
  return "proposed";
}

function stopLcWalk() {
  lcWalk.playing = false;
  if (lcWalk.timer) {
    clearInterval(lcWalk.timer);
    lcWalk.timer = 0;
  }
  const play = document.getElementById("lcPlay");
  if (play) {
    play.classList.remove("on");
    play.setAttribute("aria-pressed", "false");
    play.textContent = "Play";
  }
}

function stepLcWalk(dir) {
  const hops = lcTrans();
  if (!hops.length) return;
  let i = lcCursor + dir;
  if (i < 0) i = 0;
  if (i >= hops.length) {
    i = hops.length - 1;
    stopLcWalk();
  }
  lcCursor = i;
  paint({ animate: "none" });
  focusLcTrans(hops[i]);
}

function toggleLcReview() {
  if (lcWalk.playing) {
    stopLcWalk();
    const hops = lcTrans();
    flashToast("Paused · " + Math.max(lcCursor, 0) + "/" + hops.length, "ok");
    return;
  }
  const hops = lcTrans();
  if (!hops.length) {
    flashToast("No derived review machine on this flow", "skip");
    return;
  }
  if (lcCursor >= hops.length - 1) lcCursor = -1;
  lcWalk.playing = true;
  flashToast("Walking review states", "ok");
  stepLcWalk(1);
  if (reduceMotion()) {
    stopLcWalk();
    return;
  }
  lcWalk.timer = setInterval(() => {
    const next = lcTrans();
    if (lcCursor >= next.length - 1) {
      stopLcWalk();
      flashToast("End · lifecycle", "ok");
      return;
    }
    stepLcWalk(1);
  }, 720);
}

function resetLcOverview() {
  stopLcWalk();
  lcCursor = -1;
  paint({ animate: "none" });
}

function focusLcTrans(hop) {
  if (!hop) return;
  const status = document.getElementById("lcStatus");
  if (status) {
    status.textContent =
      lcCursor + 1 + "/" + lcTrans().length + " · " + (hop.label || "") + " " + hop.from + " → " + hop.to;
  }
}

function lcStateKind(s) {
  return s.type || s.kind || "neutral";
}

function renderLifecycleBody() {
  const flow = lifecycleFlow();
  const reading = lifecycleOf(flow);
  const states = reading.states;
  const hops = reading.transitions;
  const ends = reading.endpoints;
  const lanes = reading.lanes;
  const lcQ = (graphFilter.q || "").toLowerCase();
  const lcHit = (s) => String(s || "").toLowerCase().indexOf(lcQ) >= 0;
  const lcStateMatch = (s) => !lcQ || lcHit(s.id) || lcHit(s.label) || lcHit(lcStateKind(s)) || lcHit(s.lane);
  const lcHopMatch = (h) => !lcQ || lcHit(h.from) || lcHit(h.to) || lcHit(h.label);
  const lcEndMatch = (e) => !lcQ || lcHit(e.fqn) || lcHit(e.kind) || lcHit(e.file);
  if (lcQ) {
    const keepS = states.filter(lcStateMatch);
    const keepT = hops.filter(lcHopMatch);
    const keepE = ends.filter(lcEndMatch);
    if (!keepS.length && !keepT.length && !keepE.length) {
      return '<div class="empty">No lifecycle states match “' + esc(graphFilter.q) + '”.</div>';
    }
  }
  if (!states.length || !hops.length) {
    return '<div class="empty">No derived review machine on this flow. Lifecycle does not invent AST match/enum states.</div>';
  }
  if (lcCursor >= hops.length) lcCursor = hops.length - 1;
  const hot = lcCursor >= 0 ? hops[lcCursor] : null;
  const now = hot ? hot.to : lcCurrentId(flow);
  const review =
    '<div class="review-strip" id="lcReview">' +
    '<button type="button" class="review-step" id="lcOverview">Overview</button>' +
    '<button type="button" class="review-step" id="lcPrev">Prev</button>' +
    '<button type="button" class="review-step' +
    (lcWalk.playing ? " on" : "") +
    '" id="lcPlay" aria-pressed="' +
    (lcWalk.playing ? "true" : "false") +
    '">Play</button>' +
    '<button type="button" class="review-step" id="lcNext">Next</button>' +
    '<span id="lcStatus">' +
    (hot
      ? lcCursor + 1 + "/" + hops.length + " · " + (hot.label || "") + " " + hot.from + " → " + hot.to
      : hops.length + " events · " + (flow && flow.name ? flow.name : "flow") + " · " + now) +
    "</span></div>";
  const laneCols = lanes
    .map((lane) => {
      const col = states
        .filter((s) => s.lane === lane.id)
        .slice()
        .sort((a, b) => (a.col || 0) - (b.col || 0));
      const cards = col
        .map((s) => {
          const kind = lcStateKind(s);
          const on = now === s.id || (hot && (hot.from === s.id || hot.to === s.id));
          const match = lcStateMatch(s);
          return (
            '<button type="button" class="lc-state vnode' +
            (on ? " on" : "") +
            (lcQ && match ? " hit" : "") +
            (lcQ && !match ? " dim" : "") +
            '" data-lc-id="' +
            esc(s.id) +
            '" data-lc-type="' +
            esc(kind) +
            '" data-lc-lane="' +
            esc(s.lane) +
            '" data-lc-col="' +
            esc(String(s.col == null ? 0 : s.col)) +
            '"><span class="name">' +
            esc(s.label || s.id) +
            '</span> <span class="meta">' +
            esc(kind + (s.sublabel ? " · " + s.sublabel : "")) +
            "</span></button>"
          );
        })
        .join("");
      return (
        '<div class="lc-lane" data-lc-lane="' +
        esc(lane.id) +
        '"><div class="k">' +
        esc(lane.label || lane.id) +
        "</div>" +
        cards +
        "</div>"
      );
    })
    .join("");
  const list = hops
    .map((h, i) => {
      return (
        '<article class="lc-trans expl-card' +
        (i === lcCursor ? " on" : "") +
        '" data-lc-i="' +
        i +
        '" data-from="' +
        esc(h.from) +
        '" data-to="' +
        esc(h.to) +
        '" data-lc-event="' +
        esc(h.label || "") +
        '"><div class="k">' +
        esc(h.label || "event") +
        '</div><div class="t">' +
        esc(h.from + " → " + h.to) +
        "</div></article>"
      );
    })
    .join("");
  const endCards = ends
    .map((e) => {
      const match = lcEndMatch(e);
      return (
        '<button type="button" class="lc-end vnode kind-' +
        esc(e.kind || "Type") +
        (lcQ && match ? " hit" : "") +
        (lcQ && !match ? " dim" : "") +
        '" data-id="' +
        esc(idVal(e.id)) +
        '" data-fqn="' +
        esc(e.fqn) +
        '" data-kind="' +
        esc(e.kind || "") +
        '"' +
        (e.file ? ' data-file="' + esc(e.file) + '"' : "") +
        '"><span class="name">' +
        esc(shortOf(e.fqn)) +
        '</span> <span class="meta">' +
        esc(e.kind || "") +
        "</span></button>"
      );
    })
    .join("");
  const endsBlock = ends.length
    ? '<div class="k">plugin Type / Endpoint</div><div id="lcEnds" class="lc-ends">' + endCards + "</div>"
    : "";
  return (
    '<div class="lc-page">' +
    review +
    '<div class="lc-lanes" id="lcLanes" style="--lc-n:' +
    lanes.length +
    '">' +
    laneCols +
    "</div>" +
    '<div class="ws-split">' +
    '<div class="ws-list" id="lcTrans">' +
    list +
    "</div>" +
    '<div class="ws-detail">' +
    '<div class="k">' +
    esc((flow && flow.name) || "flow") +
    " · review machine</div>" +
    '<div id="lcCanvas" class="lc-canvas seq-canvas"></div>' +
    endsBlock +
    "</div></div></div>"
  );
}

function lifecycleWorkspaceKey() {
  const flow = lifecycleFlow();
  const reading = lifecycleOf(flow);
  return [flow && flow.name, reading.states.length, reading.transitions.length, graphFilter.q || ""].join("\0");
}

function lifecycleCanvasProps() {
  const flow = lifecycleFlow();
  const reading = lifecycleOf(flow);
  const hops = reading.transitions;
  const hot = lcCursor >= 0 ? hops[lcCursor] : null;
  const now = hot ? hot.to : lcCurrentId(flow);
  return {
    nodes: reading.states.map((s) => ({
      id: s.id,
      label: s.label || s.id,
      type: lcStateKind(s),
      lane: s.lane || "",
      col: s.col,
      sublabel: s.sublabel || "",
    })),
    hops: hops.map((h, i) => ({
      i,
      from: h.from,
      to: h.to,
      kind: h.label || "",
      label: h.label || "",
    })),
    cursor: lcCursor,
    nowId: now,
    onNodeClick: (id) => {
      const i = hops.findIndex((h) => h.to === id || h.from === id);
      if (i >= 0) {
        stopLcWalk();
        lcCursor = i;
        paint({ animate: "none" });
        focusLcTrans(hops[i]);
      }
    },
    onHopClick: (i) => {
      if (!Number.isFinite(i)) return;
      stopLcWalk();
      lcCursor = i;
      paint({ animate: "none" });
      focusLcTrans(hops[i]);
    },
  };
}

function patchLifecycleChrome() {
  const hops = lcTrans();
  const hot = lcCursor >= 0 ? hops[lcCursor] : null;
  const flow = lifecycleFlow();
  const now = hot ? hot.to : lcCurrentId(flow);
  canvas.querySelectorAll("#lcTrans .lc-trans").forEach((el) => {
    const i = parseInt(el.getAttribute("data-lc-i"), 10);
    el.classList.toggle("on", i === lcCursor);
  });
  canvas.querySelectorAll("#lcLanes .lc-state").forEach((el) => {
    const id = el.getAttribute("data-lc-id");
    el.classList.toggle("on", now === id || !!(hot && (hot.from === id || hot.to === id)));
  });
  const status = document.getElementById("lcStatus");
  if (status) {
    status.textContent = hot
      ? lcCursor + 1 + "/" + hops.length + " · " + (hot.label || "") + " " + hot.from + " → " + hot.to
      : hops.length + " events · " + (flow && flow.name ? flow.name : "flow") + " · " + now;
  }
  const play = document.getElementById("lcPlay");
  if (play) {
    play.classList.toggle("on", !!lcWalk.playing);
    play.setAttribute("aria-pressed", lcWalk.playing ? "true" : "false");
  }
}

function paintLifecycleWorkspace(title) {
  canvas.className = "play explorer-list";
  const html = renderLifecycleBody();
  const key = lifecycleWorkspaceKey();
  const keep = !!(
    canvas.querySelector(".lc-page") &&
    document.getElementById("lcCanvas") &&
    key === lcBodyKey &&
    html.indexOf('id="lcCanvas"') >= 0
  );
  if (keep) {
    patchLifecycleChrome();
  } else {
    unmountReviewCanvas();
    canvas.innerHTML = '<div class="expl-wrap"><div class="flow-title">' + esc(title) + "</div>" + html + "</div>";
    lcBodyKey = html.indexOf('id="lcCanvas"') >= 0 ? key : "";
  }
  const host = document.getElementById("lcCanvas");
  if (host) renderLifecycleCanvas(host, lifecycleCanvasProps());
  else unmountReviewCanvas();
  applyGraphFilter();
}

function bindLifecyclePage() {
  canvas.querySelectorAll("#lcTrans .lc-trans").forEach((el) => {
    el.onclick = (ev) => {
      ev.stopPropagation();
      const i = parseInt(el.getAttribute("data-lc-i"), 10);
      if (!Number.isFinite(i)) return;
      stopLcWalk();
      lcCursor = i;
      paint({ animate: "none" });
      focusLcTrans(lcTrans()[i]);
    };
  });
  canvas.querySelectorAll("#lcCanvas .lc-state").forEach((el) => {
    el.onclick = (ev) => {
      ev.stopPropagation();
      const id = el.getAttribute("data-lc-id");
      const hops = lcTrans();
      const i = hops.findIndex((h) => h.to === id || h.from === id);
      if (i >= 0) {
        stopLcWalk();
        lcCursor = i;
        paint({ animate: "none" });
        focusLcTrans(hops[i]);
      }
    };
  });
  canvas.querySelectorAll("#lcEnds .lc-end").forEach((el) => {
    el.onclick = (ev) => {
      ev.stopPropagation();
      const id = el.getAttribute("data-id");
      if (id) {
        selectedNodeId = id;
        peekSource(id);
      }
    };
  });
  const overview = document.getElementById("lcOverview");
  const prev = document.getElementById("lcPrev");
  const next = document.getElementById("lcNext");
  const play = document.getElementById("lcPlay");
  if (overview) overview.onclick = () => resetLcOverview();
  if (prev)
    prev.onclick = () => {
      stopLcWalk();
      stepLcWalk(lcCursor < 0 ? 1 : -1);
    };
  if (next)
    next.onclick = () => {
      stopLcWalk();
      stepLcWalk(1);
    };
  if (play) play.onclick = () => toggleLcReview();
}


function isTrajectoryFixture(v) {
  if (
    !(
      v &&
      typeof v === "object" &&
      typeof v.id === "string" &&
      Array.isArray(v.nodes) &&
      Array.isArray(v.edges)
    )
  ) {
    return false;
  }
  // Empty fixture (ES): no nodes and no edges — blank DAG shows empty-state chrome.
  if (v.nodes.length === 0) return v.edges.length === 0;
  return (
    v.nodes.length >= 3 &&
    v.edges.length >= 2 &&
    v.nodes.every((n) => n && typeof n.id === "string")
  );
}

const TRAJECTORY_EMPTY_FIXTURE = Object.freeze({
  version: 2,
  id: "ade-empty-fixture",
  title: "Execution trajectory",
  subtitle: "No subtasks yet — empty fixture",
  nodes: Object.freeze([]),
  edges: Object.freeze([]),
});

function wantTrajectoryEmpty() {
  if (typeof window === "undefined" || typeof location === "undefined") return false;
  try {
    return new URLSearchParams(location.search || "").get("traceEmpty") === "1";
  } catch (_err) {
    return false;
  }
}

function getTrajectory() {
  if (wantTrajectoryEmpty()) return TRAJECTORY_EMPTY_FIXTURE;
  const o = typeof window !== "undefined" ? window.__graphideTrajectory : null;
  return isTrajectoryFixture(o) ? o : TRAJECTORY_FIXTURE;
}

function trajectoryFixture() {
  return getTrajectory();
}

let trajSelectedId = "";
let trajPinFocus = "";
let trajFocusSeeded = false;
let trajScale = 1;
let trajResidualFilter = false;

/** ADE residual-filter dedicated aria-live (ALR1–ALR3) — persistent AT region; does not replace flashToast. */
function residualFilterMatchingCount() {
  try {
    if (typeof passportResidualTrajIds === "function") return passportResidualTrajIds().size;
  } catch (e) {}
  return 0;
}

function syncResidualFilterLive(on) {
  const el = document.getElementById("residualFilterLive");
  if (!el) return;
  const active = !!on;
  const n = active ? residualFilterMatchingCount() : 0;
  const text = active
    ? "Residual filter on, " + n + " matching"
    : "Residual filter off";
  el.setAttribute("data-residual-filter-live", "1");
  el.setAttribute("data-residual-filter-live-state", active ? "on" : "off");
  if (active) el.setAttribute("data-filter-residual-count", String(n));
  else el.removeAttribute("data-filter-residual-count");
  if (el.textContent !== text) el.textContent = text;
}

/** Flip Trace/Passport residual filter; shared by legend/Passport toggles + R key. */
function toggleTrajResidualFilter() {
  trajResidualFilter = !trajResidualFilter;
  if (typeof syncKeysRRow === "function") syncKeysRRow(explorerWs);
  if (typeof flashToast === "function") {
    flashToast(
      trajResidualFilter ? "Residuals on" : "Residuals off",
      trajResidualFilter ? "ok" : "skip"
    );
  }
  if (typeof syncResidualFilterLive === "function") syncResidualFilterLive(trajResidualFilter);
  paint({ animate: "none" });
}

/** ADE CFR: after clear-chip removes itself from the DOM, restore keyboard focus to the
 *  always-present residual-filter toggle on the same Trace/Passport surface (Escape unchanged). */
function focusResidualToggleAfterClear() {
  let target = null;
  if (explorerWs === "passport") {
    target =
      document.querySelector('#passportSign [data-passport-residual-filter-toggle="1"]') ||
      document.querySelector("#passportSign .passport-residual");
  } else if (explorerWs === "trace") {
    target =
      document.querySelector('#trajEdgeLegend [data-residual-filter-toggle="1"]') ||
      document.getElementById("trajEdgeLegend");
  }
  if (target && typeof target.focus === "function") {
    try {
      target.focus({ preventScroll: true });
    } catch (_) {
      /* ignore */
    }
  }
}

/** Clear residual filter (empty-chrome / Escape / clear-chip); no-op when already off.
 *  ADE CLT: source "clear-chip" toasts "Residual filter cleared" (ok); Escape/default keep "Residuals off" (skip).
 *  ADE CFR: source "clear-chip" restores focus to residual-filter toggle after paint (Escape unchanged). */
function clearTrajResidualFilter(source) {
  if (!trajResidualFilter) return;
  trajResidualFilter = false;
  if (typeof syncKeysRRow === "function") syncKeysRRow(explorerWs);
  if (typeof flashToast === "function") {
    if (source === "clear-chip") flashToast("Residual filter cleared", "ok");
    else flashToast("Residuals off", "skip");
  }
  if (typeof syncResidualFilterLive === "function") syncResidualFilterLive(false);
  paint({ animate: "none" });
  if (source === "clear-chip" && typeof focusResidualToggleAfterClear === "function") {
    focusResidualToggleAfterClear();
  }
}


/** ADE count-chip Enter/Space/click toast hint (CCT1–CCT3) — informational; never clears. */
const RESIDUAL_FILTER_COUNT_CHIP_TOAST =
  "Residual filter stays ON — use Clear, R, or Escape to clear";

function hintResidualFilterCountChip(ev) {
  if (ev) {
    if (typeof ev.preventDefault === "function") ev.preventDefault();
    if (typeof ev.stopPropagation === "function") ev.stopPropagation();
  }
  if (typeof flashToast === "function") {
    flashToast(RESIDUAL_FILTER_COUNT_CHIP_TOAST, "skip");
  }
}

function bindResidualFilterCountChipHints() {
  document
    .querySelectorAll(
      '.residual-filter-count[data-residual-filter-count="1"], .passport-residual-filter-count[data-residual-filter-count="1"]'
    )
    .forEach((chip) => {
      const onActivate = (ev) => {
        if (ev.type === "keydown" && ev.key !== "Enter" && ev.key !== " ") return;
        hintResidualFilterCountChip(ev);
      };
      chip.onclick = onActivate;
      chip.onkeydown = onActivate;
    });
}

/** Empty chrome when filter ON and zero residual-bearing trajs (e.g. gate approved). */
function renderResidualFilterEmptyChrome(surface) {
  if (!trajResidualFilter) return "";
  const bearingN = passportResidualTrajIds().size;
  if (bearingN > 0) return "";
  const isTrace = surface === "trace";
  const hostClass = isTrace
    ? "traj-empty residual-filter-empty desk-empty"
    : "passport-empty passport-residual-filter-empty desk-empty";
  const hostAttr = isTrace
    ? ' data-traj-residual-filter-empty="1" data-residual-filter-empty="1"'
    : ' data-passport-residual-filter-empty="1" data-residual-filter-empty="1"';
  const title = isTrace ? "No residual-bearing nodes" : "No residual paths match";
  const copy = isTrace
    ? "Residual filter is on, but no trajectory nodes bear residual gated writes. Clear the filter to show the full DAG."
    : "Residual filter is on, but no gate paths bear residual writes (gate may be approved). Clear the filter to show all paths.";
  return (
    '<div class="' +
    hostClass +
    '"' +
    hostAttr +
    ' role="status">' +
    '<b class="' +
    (isTrace ? "traj-empty-title" : "passport-empty-title") +
    '">' +
    esc(title) +
    "</b>" +
    '<div class="' +
    (isTrace ? "traj-empty-copy" : "passport-empty-copy") +
    '">' +
    esc(copy) +
    "</div>" +
    '<div class="' +
    (isTrace ? "traj-empty-action" : "passport-empty-action") +
    ' residual-filter-empty-action">' +
    '<button type="button" class="residual-filter-clear" data-residual-filter-clear="1" title="Clear residual filter" aria-label="Clear residual filter">Clear residual filter</button>' +
    "</div>" +
    // ADE EKH: residual empty desk-keys hint (R toggle · Esc clear); Clear button remains
    '<div class="desk-keys residual-filter-empty-keys" data-residual-filter-empty-keys="1">' +
    "<kbd>R</kbd> toggle · <kbd>Esc</kbd> clear" +
    "</div>" +
    "</div>"
  );
}

const TRAJ_SCALE_MIN = 0.35;
const TRAJ_SCALE_MAX = 3;
const TRAJ_SCALE_STEP = 1.25;

function seedTrajectoryFocus() {
  if (trajFocusSeeded) return;
  trajFocusSeeded = true;
  const want =
    (typeof window !== "undefined" && window.__graphideTrajectoryFocus) || "";
  if (!want) return;
  const nodes = trajectoryFixture().nodes || [];
  if (nodes.some((n) => n.id === want)) trajSelectedId = want;
}

function trajStatusLabel(status) {
  if (status === "done") return "done";
  if (status === "running") return "running";
  return "pending";
}

function trajNeighborIds(fix, selectedId) {
  const near = new Set();
  if (!selectedId) return near;
  near.add(selectedId);
  for (const e of fix.edges || []) {
    if (e.from === selectedId) near.add(e.to);
    if (e.to === selectedId) near.add(e.from);
  }
  return near;
}

/** Directed successors along fixture edges (order preserved; HA hop-affordance). */
function trajOutgoingIds(fix, id) {
  const src = String(id || "");
  if (!src) return [];
  const out = [];
  const seen = new Set();
  for (const e of fix.edges || []) {
    if (e.from !== src) continue;
    const to = e.to;
    if (!to || seen.has(to)) continue;
    seen.add(to);
    out.push(to);
  }
  return out;
}


/** TNI: accessible hover/focus name for traj DAG node (id · kind · status · residual). */
function trajNodeInfoLabel(n, fix) {
  const id = String((n && n.id) || "");
  const kind = String((n && n.kind) || "").trim();
  const status = trajStatusLabel(n && n.status);
  const nodes = (fix && fix.nodes) || [];
  const byId = new Map(nodes.map((x) => [x.id, x]));
  const depIds =
    n && Array.isArray(n.deps) ? n.deps : trajNodeDeps(fix, n || {});
  let unmetDeps = 0;
  for (const d of depIds) {
    const dep = byId.get(d);
    const st = (dep && dep.status) || "pending";
    if (st !== "done") unmetDeps += 1;
  }
  const hops = trajOutgoingIds(fix, id).length;
  const artPath = (n && n.artifact) || "";
  const sealHint = !!(
    (n && n.kind === "harness") ||
    /seal|immutable/i.test(String(id) + " " + artPath)
  );
  const residualCopy =
    unmetDeps +
    " dep" +
    (unmetDeps === 1 ? "" : "s") +
    " left · " +
    hops +
    " hop" +
    (hops === 1 ? "" : "s") +
    (sealHint ? " · seal" : "");
  const parts = [id];
  if (kind) parts.push(kind);
  parts.push(status);
  parts.push(residualCopy);
  return parts.filter(Boolean).join(" · ");
}

function renderTrajectoryEdges(nodes, edges, nodeW, nodeH, selectedId) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const focusOn = !!selectedId;
  return edges
    .map((e) => {
      const a = byId.get(e.from);
      const b = byId.get(e.to);
      if (!a || !b) return "";
      const x1 = a.x + nodeW;
      const y1 = a.y + nodeH / 2;
      const x2 = b.x;
      const y2 = b.y + nodeH / 2;
      const mx = (x1 + x2) / 2;
      const kind = e.kind || "seq";
      const onPath = focusOn && (e.from === selectedId || e.to === selectedId);
      const dim = focusOn && !onPath;
      const d =
        "M" +
        x1 +
        " " +
        y1 +
        " C" +
        mx +
        " " +
        y1 +
        ", " +
        mx +
        " " +
        y2 +
        ", " +
        x2 +
        " " +
        y2;
      return (
        '<path class="traj-edge kind-' +
        esc(kind) +
        (onPath ? " on-path" : "") +
        (dim ? " dim" : "") +
        '" data-edge-id="' +
        esc(e.id) +
        '" data-from="' +
        esc(e.from) +
        '" data-to="' +
        esc(e.to) +
        '" data-kind="' +
        esc(kind) +
        '"' +
        (e.label ? ' data-label="' + esc(e.label) + '"' : "") +
        (Number.isFinite(Number(e.latencyMs)) && Number(e.latencyMs) > 0
          ? ' data-latency="' + esc(String(e.latencyMs)) + '"'
          : "") +
        (onPath ? ' data-on-path="1"' : "") +
        ' d="' +
        d +
        '" />'
      );
    })
    .join("");
}

function trajNodeDeps(fix, n) {
  if (Array.isArray(n.deps) && n.deps.length) return n.deps.slice();
  const id = n.id;
  return (fix.edges || []).filter((e) => e.to === id).map((e) => e.from);
}

function trajDurationLabel(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n < 1000) return n + "ms";
  return (Math.round(n / 100) / 10) + "s";
}

function renderTrajectoryDetail(fix, selectedId) {
  const n = (fix.nodes || []).find((x) => x.id === selectedId);
  if (!n) {
    return (
      '<aside id="trajDetail" class="traj-detail" data-empty="1">' +
      '<div class="traj-detail-empty">Select a subtask to inspect deps, next hops, artifact-diff pins, phase, and role. Use [ ] / ← → / j k to step · next → to hop.</div>' +
      "</aside>"
    );
  }
  const pin = trajPinFocus === "artifact" || trajPinFocus === "diff" ? trajPinFocus : "";
  const artCls = pin === "artifact" ? " pin-focus" : "";
  const diffCls = pin === "diff" ? " pin-focus" : "";
  const deps = trajNodeDeps(fix, n);
  const adds = Number(n.adds);
  const dels = Number(n.dels);
  const hasDiffMeta = Number.isFinite(adds) || Number.isFinite(dels);
  const depHtml = deps.length
    ? '<ul class="traj-dep-list" data-traj-deps="1">' +
      deps
        .map(
          (d) =>
            '<li class="traj-dep" role="button" tabindex="0" data-traj-dep="' +
            esc(d) +
            '" data-ade-dep-focus="1" title="Focus dependency ' +
            esc(d) +
            '"><code>' +
            esc(d) +
            "</code></li>"
        )
        .join("") +
      "</ul>"
    : '<span class="traj-dep-empty" data-traj-deps="0">none</span>';
  const nextHops = trajOutgoingIds(fix, n.id).slice(0, 3);
  const nextHopHtml = nextHops.length
    ? '<ul class="traj-next-list" data-traj-nexts="1">' +
      nextHops
        .map((to) => {
          const tgt = (fix.nodes || []).find((x) => x.id === to);
          const label = (tgt && (tgt.label || tgt.id)) || to;
          return (
            '<li class="traj-next" role="button" tabindex="0" data-traj-next="' +
            esc(to) +
            '" data-ade-hop-next="1" title="Hop to ' +
            esc(label) +
            '"><span class="traj-next-arrow" aria-hidden="true">→</span><code>' +
            esc(to) +
            "</code></li>"
          );
        })
        .join("") +
      "</ul>"
    : '<span class="traj-next-empty" data-traj-nexts="0">none</span>';
  return (
    '<aside id="trajDetail" class="traj-detail" data-selected="' +
    esc(n.id) +
    '"' +
    (pin ? ' data-pin-focus="' + esc(pin) + '"' : "") +
    (n.phase ? ' data-phase="' + esc(n.phase) + '"' : "") +
    (n.agent ? ' data-agent="' + esc(n.agent) + '"' : "") +
    (Number.isFinite(Number(n.durationMs))
      ? ' data-duration="' + esc(String(n.durationMs)) + '"'
      : "") +
    ">" +
    '<div class="traj-detail-head">' +
    '<span class="traj-status-chip status-' +
    esc(n.status || "pending") +
    '">' +
    esc(trajStatusLabel(n.status)) +
    "</span>" +
    (n.phase
      ? '<span class="traj-phase-chip" data-traj-phase-chip="' +
        esc(n.phase) +
        '">' +
        esc(n.phase) +
        "</span>"
      : "") +
    "<strong>" +
    esc(n.label || n.id) +
    "</strong>" +
    '<code class="traj-detail-id">' +
    esc(n.id) +
    "</code></div>" +
    '<dl class="traj-detail-grid">' +
    "<dt>Kind</dt><dd>" +
    esc(n.kind || "—") +
    "</dd>" +
    "<dt>Role</dt><dd>" +
    esc(n.role || "—") +
    "</dd>" +
    '<dt>Phase</dt><dd data-traj-phase="' +
    esc(n.phase || "") +
    '">' +
    esc(n.phase || "—") +
    "</dd>" +
    '<dt>Agent</dt><dd data-traj-agent="' +
    esc(n.agent || "") +
    '">' +
    esc(n.agent || "—") +
    "</dd>" +
    '<dt>Duration</dt><dd data-traj-duration="' +
    esc(String(Number.isFinite(Number(n.durationMs)) ? n.durationMs : "")) +
    '">' +
    esc(trajDurationLabel(n.durationMs)) +
    "</dd>" +
    "<dt>Deps</dt><dd>" +
    depHtml +
    "</dd>" +
    '<dt>Next hops</dt><dd data-traj-next-block="1">' +
    nextHopHtml +
    "</dd>" +
    '<dt class="' +
    (pin === "artifact" ? "on" : "") +
    '">Artifact</dt><dd class="' +
    (pin === "artifact" ? "on" : "") +
    '">' +
    (n.artifact
      ? '<code data-traj-artifact="1" class="traj-pin-target' +
        artCls +
        '">' +
        esc(n.artifact) +
        "</code>"
      : "—") +
    "</dd>" +
    '<dt class="' +
    (pin === "diff" ? "on" : "") +
    '">Diff pin</dt><dd class="' +
    (pin === "diff" ? "on" : "") +
    '">' +
    (n.diff
      ? '<code class="traj-diff traj-pin-target' +
        diffCls +
        '" data-traj-diff="1">' +
        esc(n.diff) +
        "</code>"
      : "—") +
    "</dd>" +
    '<dt>Artifact diff</dt><dd class="traj-artifact-diff" data-artifact-diff="1"' +
    (Number.isFinite(adds) ? ' data-adds="' + esc(String(adds)) + '"' : "") +
    (Number.isFinite(dels) ? ' data-dels="' + esc(String(dels)) + '"' : "") +
    ">" +
    (hasDiffMeta
      ? '<span class="traj-diff-adds">+' +
        esc(String(Number.isFinite(adds) ? adds : 0)) +
        '</span> <span class="traj-diff-dels">−' +
        esc(String(Number.isFinite(dels) ? dels : 0)) +
        "</span>"
      : "—") +
    "</dd>" +
    "<dt>Note</dt><dd>" +
    esc(n.note || "—") +
    "</dd></dl>" +
    '<div class="traj-detail-hint">Neighbors stay lit · off-path deps dim · click a dep or next → hop to focus it</div>' +
    '<div class="traj-detail-ade-hop">' +
    '<button type="button" class="ade-hop ade-passport-hl-hop" data-ade-passport-hl-hop="' +
    esc(n.id) +
    '" title="Show matching Passport rows for this Trace node">Show in Passport</button>' +
    "</div>" +
    "</aside>"
  );
}

function announceTrajZoom(isFit) {
  // ADE ZAL: polite live-region outside paint-replaced #trajZoomPct so SR hears keyboard zoom.
  const live = document.getElementById("trajZoomLive");
  if (!live) return;
  const pctEl = document.getElementById("trajZoomPct");
  const now =
    (pctEl && pctEl.getAttribute("aria-valuenow")) ||
    String(Math.round((Number(trajScale) || 1) * 100));
  const text = isFit
    ? "Trajectory zoom fit, " + now + "%"
    : "Trajectory zoom " + now + "%";
  live.setAttribute("data-traj-zoom-live", "1");
  live.setAttribute("data-traj-zoom-live-pct", now);
  if (isFit) live.setAttribute("data-traj-zoom-live-fit", "1");
  else live.removeAttribute("data-traj-zoom-live-fit");
  // Clear then set on next frame so polite live re-announces even when pct repeats.
  live.textContent = "";
  requestAnimationFrame(() => {
    const el = document.getElementById("trajZoomLive");
    if (el) el.textContent = text;
  });
}

function trajZoomPctLabel(scale) {
  return Math.round((Number(scale) || 1) * 100) + "%";
}

function trajZoomBy(factor) {
  const nodes = trajectoryFixture().nodes || [];
  if (!nodes.length) return;
  const next = Math.min(
    TRAJ_SCALE_MAX,
    Math.max(TRAJ_SCALE_MIN, (Number(trajScale) || 1) * (Number(factor) || 1))
  );
  if (Math.abs(next - trajScale) < 1e-6) return;
  trajScale = next;
  paint({ animate: "none" });
}

function trajZoomFit() {
  const nodes = trajectoryFixture().nodes || [];
  if (!nodes.length) {
    trajScale = 1;
    return;
  }
  if (Math.abs((Number(trajScale) || 1) - 1) < 1e-6) return;
  trajScale = 1;
  paint({ animate: "none" });
}

function renderTrajZoomBar() {
  const scale = Number(trajScale) || 1;
  const pct = trajZoomPctLabel(scale);
  const now = Math.round(scale * 100);
  const vmin = Math.round(TRAJ_SCALE_MIN * 100);
  const vmax = Math.round(TRAJ_SCALE_MAX * 100);
  // ADE ZPK: pct readout is a keyboard slider (ArrowUp/Down step, Home fit); buttons stay click.
  return (
    '<span id="trajZoomBar" class="traj-zoom-bar" data-traj-zoom-chrome="1" role="group" aria-label="Trajectory zoom">' +
    '<button type="button" id="trajZoomOut" class="traj-zoom-btn" title="Zoom out (−)" aria-label="Zoom out">−</button>' +
    '<span id="trajZoomPct" class="traj-zoom-pct" data-traj-zoom-pct="1" tabindex="0" role="slider" aria-label="Trajectory zoom percentage" aria-valuemin="' +
    esc(String(vmin)) +
    '" aria-valuemax="' +
    esc(String(vmax)) +
    '" aria-valuenow="' +
    esc(String(now)) +
    '" aria-valuetext="' +
    esc(pct) +
    '" aria-keyshortcuts="ArrowUp ArrowDown Home" title="Arrow keys zoom · Home fits">' +
    pct +
    "</span>" +
    '<button type="button" id="trajZoomIn" class="traj-zoom-btn" title="Zoom in (+)" aria-label="Zoom in">+</button>' +
    '<button type="button" id="trajZoomFit" class="traj-zoom-btn traj-zoom-fit" title="Fit (0)" aria-label="Fit">Fit</button>' +
    "</span>"
  );
}

function renderTrajectoryEmptyBody(fix) {
  const title = fix.title || "Execution trajectory";
  const sub = fix.subtitle || "No subtasks yet";
  return (
    '<div class="traj-page traj-page--empty" data-traj-empty="1">' +
    '<div class="traj-strip">' +
    '<span class="traj-strip-title">' +
    esc(title) +
    "</span>" +
    '<span class="traj-strip-sub">' +
    esc(sub) +
    "</span>" +
    '<span class="traj-strip-stats">' +
    '<span class="traj-stat" data-stat="done"><b>0</b> done</span>' +
    '<span class="traj-stat" data-stat="running"><b>0</b> running</span>' +
    '<span class="traj-stat" data-stat="pending"><b>0</b> pending</span>' +
    '<span class="traj-stat" data-stat="deps"><b>0</b> deps</span>' +
    "</span>" +
    renderSealStatusChip() +
    renderAdeHop("passport", "Open Passport →") +
    "</div>" +
    '<div class="traj-layout">' +
    '<div id="trajCanvas" class="traj-canvas traj-canvas--empty" data-testid="trajectory-dag" data-fixture="' +
    esc(fix.id || "ade-empty-fixture") +
    '" data-empty="1" tabindex="0">' +
    '<div class="traj-empty desk-empty" data-traj-empty-chrome="1" role="status">' +
    '<b class="traj-empty-title">No trajectory nodes</b>' +
    '<div class="traj-empty-copy">This trace has no DAG subtasks yet. Open Passport to inspect the gate, or load a trajectory fixture.</div>' +
    '<div class="traj-empty-action">' +
    renderAdeHop("passport", "Open Passport →") +
    "</div>" +
    "</div>" +
    "</div>" +
    renderTrajectoryDetail(fix, "") +
    "</div>" +
    '<div class="traj-meta" data-fixture-version="' +
    esc(String(fix.version || 1)) +
    '" data-empty="1">0 subtasks · 0 deps · empty fixture ' +
    esc(fix.id || "ade-empty-fixture") +
    (fix.version ? " v" + esc(String(fix.version)) : "") +
    " · Open Passport to continue</div>" +
    "</div>"
  );
}

function renderTrajectoryBody() {
  seedTrajectoryFocus();
  seedPassportGate();
  seedSealStatus();
  const fix = trajectoryFixture();
  const nodes = fix.nodes || [];
  const edges = fix.edges || [];
  if (!nodes.length) {
    trajSelectedId = "";
    trajPinFocus = "";
    return renderTrajectoryEmptyBody(fix);
  }
  const nodeW = 188;
  const nodeH = 96;
  const selectedId =
    trajSelectedId && nodes.some((n) => n.id === trajSelectedId) ? trajSelectedId : "";
  if (!selectedId) trajPinFocus = "";
  const near = trajNeighborIds(fix, selectedId);
  const residualTrajs = passportResidualTrajIds();
  const focusOn = !!selectedId;
  const edgeLines = renderTrajectoryEdges(nodes, edges, nodeW, nodeH, selectedId);
  const nodeHtml = nodes
    .map((n) => {
      const art = n.artifact || "";
      const diff = n.diff || "";
      const on = selectedId === n.id ? " on" : "";
      const neighbor = focusOn && near.has(n.id) && selectedId !== n.id ? " neighbor" : "";
      const adjResidual =
        focusOn && near.has(n.id) && selectedId !== n.id && residualTrajs.has(n.id)
          ? " traj-adj-residual"
          : "";
      const adjResidualAttr =
        focusOn && near.has(n.id) && selectedId !== n.id && residualTrajs.has(n.id)
          ? ' data-traj-adj-residual="1"'
          : "";
      const residualBearing = residualTrajs.has(n.id);
      const residualBearingAttr = residualBearing
        ? ' data-residual-bearing="1"'
        : "";
      const residualFiltered = trajResidualFilter && !residualBearing;
      const residualFilteredClass = residualFiltered ? " residual-filtered" : "";
      const residualFilteredAttr = residualFiltered
        ? ' data-residual-filtered="1"'
        : "";
      const ptdKind = passportDeltaKind(n.id);
      const ptdKindAttr = ptdKind ? ' data-ptd-kind="' + esc(ptdKind) + '"' : "";
      const ptdHit = !!(passportDeltaFilter && ptdKind === passportDeltaFilter);
      const ptdDim = !!(passportDeltaFilter && ptdKind && ptdKind !== passportDeltaFilter);
      const ptdClass = (ptdHit ? " ptd-hit" : "") + (ptdDim ? " ptd-dim" : "");
      const dim = focusOn && !near.has(n.id) ? " dim" : "";
      const pinArt =
        selectedId === n.id && trajPinFocus === "artifact" ? " pin-focus" : "";
      const pinDiff = selectedId === n.id && trajPinFocus === "diff" ? " pin-focus" : "";
      const deps = Array.isArray(n.deps) ? n.deps : trajNodeDeps(fix, n);
      const depAttr = deps.join(",");
      const adds = Number(n.adds);
      const dels = Number(n.dels);
      const diffMeta =
        (Number.isFinite(adds) ? " +" + adds : "") +
        (Number.isFinite(dels) ? " −" + dels : "");
      const nodeInfo = trajNodeInfoLabel(n, fix);
      return (
        '<button type="button" class="traj-node status-' +
        esc(n.status || "pending") +
        on +
        neighbor +
        adjResidual +
        residualFilteredClass +
        ptdClass +
        dim +
        '" data-id="' +
        esc(n.id) +
        '"' +
        adjResidualAttr +
        residualBearingAttr +
        residualFilteredAttr +
        ptdKindAttr +
        ' data-artifact="' +
        esc(art) +
        '" data-diff="' +
        esc(diff) +
        '" data-kind="' +
        esc(n.kind || "") +
        '" data-role="' +
        esc(n.role || "") +
        '" data-phase="' +
        esc(n.phase || "") +
        '" data-agent="' +
        esc(n.agent || "") +
        '" data-duration="' +
        esc(Number.isFinite(Number(n.durationMs)) ? String(n.durationMs) : "") +
        '" data-deps="' +
        esc(depAttr) +
        '"' +
        (Number.isFinite(adds) ? ' data-adds="' + esc(String(adds)) + '"' : "") +
        (Number.isFinite(dels) ? ' data-dels="' + esc(String(dels)) + '"' : "") +
        ' style="left:' +
        n.x +
        "px;top:" +
        n.y +
        'px" title="' +
        esc(nodeInfo) +
        '" aria-label="' +
        esc(nodeInfo) +
        '" data-traj-node-info="1" aria-pressed="' +
        (on ? "true" : "false") +
        '" tabindex="0">' +
        '<div class="traj-node-top">' +
        '<span class="traj-status-chip status-' +
        esc(n.status || "pending") +
        '">' +
        esc(trajStatusLabel(n.status)) +
        "</span>" +
        (n.phase
          ? '<span class="traj-phase-chip" data-traj-phase-chip="' +
            esc(n.phase) +
            '">' +
            esc(n.phase) +
            "</span>"
          : "") +
        (n.kind ? '<span class="traj-kind">' + esc(n.kind) + "</span>" : "") +
        "</div>" +
        '<div class="traj-label">' +
        esc(n.label || n.id) +
        "</div>" +
        '<div class="traj-node-meta">' +
        (n.role
          ? '<span class="traj-role-chip" data-traj-role-chip="' +
            esc(n.role) +
            '">' +
            esc(n.role) +
            "</span>"
          : "") +
        (deps.length
          ? '<span class="traj-dep-badge" data-dep-count="' +
            deps.length +
            '">' +
            deps.length +
            " dep" +
            (deps.length === 1 ? "" : "s") +
            "</span>"
          : "") +
        (n.agent
          ? '<span class="traj-agent-chip" data-traj-agent-chip="' +
            esc(n.agent) +
            '">' +
            esc(n.agent) +
            "</span>"
          : "") +
        "</div>" +
        (art
          ? '<div class="traj-pin artifact' +
            pinArt +
            '" data-traj-pin="artifact" data-tip-ready="1" aria-label="' +
            esc("artifact · " + art) +
            '">' +
            esc(art) +
            "</div>"
          : "") +
        (diff || diffMeta
          ? '<div class="traj-pin diff' +
            pinDiff +
            '" data-traj-pin="diff" data-tip-ready="1"' +
            (Number.isFinite(adds) ? ' data-adds="' + esc(String(adds)) + '"' : "") +
            (Number.isFinite(dels) ? ' data-dels="' + esc(String(dels)) + '"' : "") +
            ' aria-label="' +
            esc(
              "diff" +
                (diff ? " " + diff : "") +
                (Number.isFinite(adds) ? " +" + adds : "") +
                (Number.isFinite(dels) ? " −" + dels : "")
            ) +
            '">' +
            esc((diff || "Δ") + diffMeta) +
            "</div>"
          : "") +
        "</button>"
      );
    })
    .join("");
  const selectedNode = selectedId ? nodes.find((n) => n.id === selectedId) : null;
  const nextOut = selectedNode ? trajOutgoingIds(fix, selectedId).slice(0, 3) : [];
  const hopChipHtml = nextOut
    .map((to, i) => {
      const tgt = nodes.find((n) => n.id === to);
      const label = (tgt && (tgt.label || tgt.id)) || to;
      const left = selectedNode.x + nodeW - 6;
      const top = selectedNode.y + 10 + i * 24;
      return (
        '<button type="button" class="traj-hop-next" data-traj-next="' +
        esc(to) +
        '" data-ade-hop-next="1" data-from="' +
        esc(selectedId) +
        '" title="Hop to ' +
        esc(label) +
        '" aria-label="Next hop ' +
        esc(label) +
        '" style="left:' +
        left +
        "px;top:" +
        top +
        'px"><span class="traj-next-arrow" aria-hidden="true">→</span><span class="traj-hop-next-label">' +
        esc(to) +
        "</span></button>"
      );
    })
    .join("");
  const maxX = Math.max(...nodes.map((n) => n.x + nodeW), 320) + 48;
  const maxY = Math.max(...nodes.map((n) => n.y + nodeH), 120) + 48;
  const done = nodes.filter((n) => n.status === "done").length;
  const running = nodes.filter((n) => n.status === "running").length;
  const pending = nodes.filter((n) => n.status === "pending").length;
  const edgeKinds = ["seq", "fork", "join"].filter((k) =>
    edges.some((e) => (e.kind || "seq") === k)
  );
  const onPathKinds = new Set();
  if (focusOn) {
    for (const e of edges) {
      if (e.from === selectedId || e.to === selectedId) {
        onPathKinds.add(e.kind || "seq");
      }
    }
  }
  // AL: residual-adjacent node kinds on Trace legend (after #403 node attrs)
  const adjResidualKinds = new Set();
  let adjResidualCount = 0;
  if (focusOn) {
    for (const n of nodes) {
      if (!near.has(n.id) || selectedId === n.id) continue;
      if (!residualTrajs.has(n.id)) continue;
      adjResidualCount += 1;
      adjResidualKinds.add(n.kind || "task");
    }
  }
  const hasAdjResidualLegend = focusOn && adjResidualCount > 0;
  const adjResidualAttr = hasAdjResidualLegend
    ? ' data-adj-residual-count="' + String(adjResidualCount) + '"'
    : "";
  const adjResidualChips = hasAdjResidualLegend
    ? Array.from(adjResidualKinds)
        .sort()
        .map((k) => {
          return (
            '<span class="traj-legend-chip adj-residual kind-' +
            esc(k) +
            '" data-node-kind="' +
            esc(k) +
            '" data-adj-residual="1" title="Adjacent residual ' +
            esc(k) +
            '">' +
            '<svg class="traj-legend-stroke" width="22" height="10" viewBox="0 0 22 10" aria-hidden="true">' +
            '<line x1="1" y1="5" x2="21" y2="5" stroke-dasharray="2 2"></line>' +
            "</svg>" +
            '<span class="traj-legend-label">adj ' +
            esc(k) +
            "</span></span>"
          );
        })
        .join("")
    : "";
  // LC: focus-scoped residual count chip on Trace legend (pairs with Passport FC #405)
  const passportFx = getPassport();
  const passportWrites = Array.isArray(passportFx && passportFx.gatedWrites)
    ? passportFx.gatedWrites
    : [];
  const focusResidualN = focusOn
    ? passportWrites.filter((w) => {
        const tid = resolvePassportTrajId(w);
        return !!(tid && near.has(tid));
      }).length
    : 0;
  const hasFocusResidualLegend = focusOn && focusResidualN > 0;
  const focusResidualScopeAttr = hasFocusResidualLegend
    ? ' data-residual-scope="focus" data-residual-focus="' +
      esc(selectedId) +
      '" data-focus-residual-count="' +
      esc(String(focusResidualN)) +
      '"'
    : ' data-residual-scope="global"';
  const focusResidualGate = passportGateState();
  const focusResidualLabel =
    focusResidualGate === "approved"
      ? "focus open · " + focusResidualN
      : "focus residual · " + focusResidualN;
  const focusResidualChip = hasFocusResidualLegend
    ? '<span class="traj-legend-chip focus-residual" data-focus-residual="1" data-residual-scope="focus" data-residual-focus="' +
      esc(selectedId) +
      '" data-focus-residual-count="' +
      esc(String(focusResidualN)) +
      '" data-residual-state="' +
      esc(focusResidualGate) +
      '" title="' +
      esc(focusResidualLabel) +
      '">' +
      '<span class="traj-legend-focus-residual-badge">' +
      esc(String(focusResidualN)) +
      "</span>" +
      '<span class="traj-legend-label">' +
      esc(focusResidualLabel) +
      "</span></span>"
    : "";
  const residualFilterAttr = trajResidualFilter
    ? ' data-residual-filter="on"'
    : "";
  const residualFilterToggle =
    '<button type="button" class="traj-legend-chip residual-filter-toggle" data-residual-filter-toggle="1" aria-pressed="' +
    (trajResidualFilter ? "true" : "false") +
    '" title="Show residual-bearing nodes only" aria-label="Toggle residual-bearing filter">' +
    '<span class="traj-legend-label">' +
    (trajResidualFilter ? "residuals on" : "residuals") +
    "</span></button>";
  // ADE Trace legend clear-filter cue (CC1–CC3) — ON + non-empty only; distinct from FE empty chrome
  const legendClearFilterCue =
    trajResidualFilter && residualTrajs.size > 0
      ? '<button type="button" class="traj-legend-chip legend-clear-filter" data-legend-clear-filter="1" title="Clear residual filter" aria-label="Clear residual filter">Clear filter</button>'
      : "";
  // ADE Trace legend residual-filter count chip (RFC1–RFC3) — ON + bearings; pairs with Passport sticky RC
  const filterResidualN = residualTrajs.size;
  const hasResidualFilterCount = trajResidualFilter && filterResidualN > 0;
  const residualFilterCountAttr = hasResidualFilterCount
    ? ' data-residual-filter-count="1" data-filter-residual-count="' +
      esc(String(filterResidualN)) +
      '"'
    : "";
  const residualFilterCountChip = hasResidualFilterCount
    ? '<span class="traj-legend-chip residual-filter-count" data-residual-filter-count="1" data-filter-residual-count="' +
      esc(String(filterResidualN)) +
      '" tabindex="0" role="status" title="Residual filter matches ' +
      esc(String(filterResidualN)) +
      '. Clear filter or Escape to clear" aria-label="Residual filter matches ' +
      esc(String(filterResidualN)) +
      '. Clear filter or Escape to clear">' +
      '<span class="traj-legend-filter-residual-badge">' +
      esc(String(filterResidualN)) +
      "</span>" +
      '<span class="traj-legend-label">filter · ' +
      esc(String(filterResidualN)) +
      "</span></span>"
    : "";
  const edgeLegend =
    edgeKinds.length === 0 && !hasAdjResidualLegend && !hasFocusResidualLegend
      ? ""
      : '<div id="trajEdgeLegend" class="traj-edge-legend" aria-label="Trajectory edge kinds"' +
        adjResidualAttr +
        focusResidualScopeAttr +
        residualFilterAttr +
        residualFilterCountAttr +
        ">" +
        edgeKinds
          .map((k) => {
            const chipFocus = focusOn
              ? onPathKinds.has(k)
                ? " on-path"
                : " dim"
              : "";
            return (
              '<span class="traj-legend-chip kind-' +
              esc(k) +
              chipFocus +
              '" data-kind="' +
              esc(k) +
              '"' +
              (focusOn && onPathKinds.has(k) ? ' data-on-path="1"' : "") +
              (focusOn && !onPathKinds.has(k) ? ' data-dim="1"' : "") +
              ">" +
              '<svg class="traj-legend-stroke" width="22" height="10" viewBox="0 0 22 10" aria-hidden="true">' +
              '<line x1="1" y1="5" x2="21" y2="5"></line>' +
              "</svg>" +
              '<span class="traj-legend-label">' +
              esc(k) +
              "</span></span>"
            );
          })
          .join("") +
        adjResidualChips +
        focusResidualChip +
        residualFilterToggle +
        residualFilterCountChip +
        legendClearFilterCue +
        "</div>";
  return (
    '<div class="traj-page' +
    (focusOn ? " has-focus" : "") +
    '">' +
    '<div class="traj-strip">' +
    '<span class="traj-strip-title">' +
    esc(fix.title || "Execution trajectory") +
    "</span>" +
    '<span class="traj-strip-sub">' +
    esc(fix.subtitle || "") +
    "</span>" +
    '<span class="traj-strip-stats">' +
    '<span class="traj-stat" data-stat="done"><b>' +
    done +
    "</b> done</span>" +
    '<span class="traj-stat" data-stat="running"><b>' +
    running +
    "</b> running</span>" +
    '<span class="traj-stat" data-stat="pending"><b>' +
    pending +
    "</b> pending</span>" +
    '<span class="traj-stat" data-stat="deps"><b>' +
    edges.length +
    "</b> deps</span>" +
    "</span>" +
    edgeLegend +
    passportDeltaStripHtml() +
    renderTrajZoomBar() +
    renderSealStatusChip() +
    renderAdeHop("passport", "Open Passport →") +
    "</div>" +
    '<div class="traj-layout">' +
    '<div id="trajCanvas" class="traj-canvas" data-testid="trajectory-dag" data-fixture="' +
    esc(fix.id) +
    '" data-traj-scale="' +
    esc(String(Number(trajScale) || 1)) +
    '"' +
    (selectedId ? ' data-focus="' + esc(selectedId) + '"' : "") +
    (trajResidualFilter && residualTrajs.size === 0
      ? ' data-residual-filter-empty="1"'
      : "") +
    ' tabindex="0" style="min-width:' +
    Math.ceil(maxX * (Number(trajScale) || 1)) +
    "px;min-height:" +
    Math.ceil(maxY * (Number(trajScale) || 1)) +
    'px">' +
    '<div id="trajScaleLayer" class="traj-scale-layer" data-traj-scale-layer="1" style="width:' +
    maxX +
    "px;height:" +
    maxY +
    "px;transform:scale(" +
    (Number(trajScale) || 1) +
    ');transform-origin:0 0">' +
    '<svg class="traj-edges" width="' +
    maxX +
    '" height="' +
    maxY +
    '" aria-hidden="true">' +
    "<defs>" +
    '<marker id="trajArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
    '<path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"></path></marker>' +
    '<marker id="trajArrowHot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
    '<path d="M 0 0 L 10 5 L 0 10 z" fill="var(--vscode-focusBorder, #2f81f7)"></path></marker>' +
    "</defs>" +
    edgeLines +
    "</svg>" +
    nodeHtml +
    hopChipHtml +
    "</div>" +
    renderResidualFilterEmptyChrome("trace") +
    "</div>" +
    renderTrajectoryDetail(fix, selectedId) +
    "</div>" +
    '<div class="traj-meta" data-fixture-version="' +
    esc(String(fix.version || 1)) +
    '">' +
    nodes.length +
    " subtasks · " +
    edges.length +
    " deps · fixture " +
    esc(fix.id) +
    (fix.version ? " v" + esc(String(fix.version)) : "") +
    " · click node / pin · next → hop · [ ] / ←→ / jk step · +/−/0 zoom</div>" +
    "</div>"
  );
}

function paintTrajectoryWorkspace(title) {
  unmountAllReviewCanvases();
  const html = renderTrajectoryBody();
  canvas.className = "play explorer-list traj";
  canvas.innerHTML =
    '<div class="expl-wrap"><div class="flow-title">' + esc(title || "Trace") + "</div>" + html + "</div>";
  setZoomUi(false);
  // ADE LRP: while residual filter stays ON, refresh live-region N on paint (Approve/focus/fixture) without toast.
  if (trajResidualFilter && typeof syncResidualFilterLive === "function") syncResidualFilterLive(true);
}

function stepTrajectory(dir) {
  const nodes = trajectoryFixture().nodes || [];
  if (!nodes.length) return;
  let i = nodes.findIndex((n) => n.id === trajSelectedId);
  if (i < 0) i = dir > 0 ? -1 : 0;
  i = (i + dir + nodes.length) % nodes.length;
  trajSelectedId = nodes[i].id;
  trajPinFocus = "";
  syncAdeDeepLink("trace");
  paint({ animate: "none" });
}

function trajPinTipEl() {
  let el = document.getElementById("trajPinTip");
  if (!el) {
    el = document.createElement("div");
    el.id = "trajPinTip";
    el.hidden = true;
    el.setAttribute("data-traj-pin-tip", "1");
    el.setAttribute("role", "tooltip");
    document.body.appendChild(el);
  }
  return el;
}

function hideTrajPinTip() {
  if (typeof hideTrajEdgeTip === "function") hideTrajEdgeTip();
  const el = document.getElementById("trajPinTip");
  if (!el) return;
  el.hidden = true;
  el.removeAttribute("data-pin-kind");
  el.removeAttribute("data-node-id");
  el.removeAttribute("data-adds");
  el.removeAttribute("data-dels");
  el.removeAttribute("data-tip-place");
  el.removeAttribute("data-tip-residual");
  el.removeAttribute("data-residual-status");
  el.removeAttribute("data-residual-deps");
  el.removeAttribute("data-residual-hops");
  el.removeAttribute("data-residual-seal");
  el.innerHTML = "";
}

function positionTrajPinTip(el, ev, pin) {
  const margin = 10;
  const tipW = el.offsetWidth || 180;
  const tipH = el.offsetHeight || 64;
  let x;
  let y;
  if (pin && typeof pin.getBoundingClientRect === "function") {
    const r = pin.getBoundingClientRect();
    x = r.left + r.width / 2 - tipW / 2;
    y = r.bottom + 8;
    if (y + tipH > window.innerHeight - margin) {
      y = r.top - tipH - 8;
      el.setAttribute("data-tip-place", "above");
    } else {
      el.setAttribute("data-tip-place", "below");
    }
  } else {
    x = (ev && ev.clientX != null ? ev.clientX : 0) + 12;
    y = (ev && ev.clientY != null ? ev.clientY : 0) + 14;
    el.setAttribute("data-tip-place", "cursor");
  }
  x = Math.max(margin, Math.min(x, window.innerWidth - margin - tipW));
  y = Math.max(margin, Math.min(y, window.innerHeight - margin - tipH));
  el.style.left = x + "px";
  el.style.top = y + "px";
}

function showTrajPinTip(pin, node, ev) {
  if (!pin || !node || !ev) return;
  if (typeof hideTrajEdgeTip === "function") hideTrajEdgeTip();
  const el = trajPinTipEl();
  const kind = pin.getAttribute("data-traj-pin") || "";
  const id = node.getAttribute("data-id") || "";
  const art = node.getAttribute("data-artifact") || "";
  const diff = node.getAttribute("data-diff") || "";
  const addsRaw = pin.getAttribute("data-adds");
  const delsRaw = pin.getAttribute("data-dels");
  const addsAttr =
    addsRaw !== null && addsRaw !== ""
      ? addsRaw
      : node.getAttribute("data-adds") || "";
  const delsAttr =
    delsRaw !== null && delsRaw !== ""
      ? delsRaw
      : node.getAttribute("data-dels") || "";
  const adds = Number(addsAttr);
  const dels = Number(delsAttr);
  const hasCounts = Number.isFinite(adds) || Number.isFinite(dels);
  el.setAttribute("data-pin-kind", kind);
  el.setAttribute("data-node-id", id);
  if (Number.isFinite(adds)) el.setAttribute("data-adds", String(adds));
  else el.removeAttribute("data-adds");
  if (Number.isFinite(dels)) el.setAttribute("data-dels", String(dels));
  else el.removeAttribute("data-dels");
  let html =
    '<div class="traj-pin-tip-head"><span class="traj-pin-tip-kind">' +
    esc(kind || "pin") +
    "</span>";
  if (kind === "diff" && diff) {
    html +=
      '<code class="traj-pin-tip-diff-label" data-tip-diff="' +
      esc(diff) +
      '">' +
      esc(diff) +
      "</code>";
  }
  html += "</div>";
  if (kind === "diff" || hasCounts) {
    html +=
      '<div class="traj-pin-tip-counts" data-tip-counts="1">' +
      '<span class="traj-pin-tip-chip traj-pin-tip-chip-add traj-diff-adds" data-tip-adds="1">+' +
      esc(String(Number.isFinite(adds) ? adds : 0)) +
      '</span><span class="traj-pin-tip-chip traj-pin-tip-chip-del traj-diff-dels" data-tip-dels="1">−' +
      esc(String(Number.isFinite(dels) ? dels : 0)) +
      "</span></div>";
  }
  if (art) {
    const slash = art.lastIndexOf("/");
    const dir = slash >= 0 ? art.slice(0, slash + 1) : "";
    const base = slash >= 0 ? art.slice(slash + 1) : art;
    html +=
      '<code class="traj-pin-tip-art" data-tip-artifact="1" title="' +
      esc(art) +
      '">';
    if (dir) {
      html +=
        '<span class="traj-pin-tip-art-dir" data-tip-art-dir="1">' +
        esc(dir) +
        "</span>";
    }
    html +=
      '<span class="traj-pin-tip-art-base" data-tip-art-base="1">' +
      esc(base) +
      "</span></code>";
  }
  // TP: residual/status cue — unmet deps, hop residual, optional seal hint
  const fix = trajectoryFixture();
  const nodes = fix.nodes || [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const fxNode = byId.get(id) || null;
  const status = (fxNode && fxNode.status) || "pending";
  const depIds = fxNode && Array.isArray(fxNode.deps) ? fxNode.deps : [];
  let unmetDeps = 0;
  for (const d of depIds) {
    const dep = byId.get(d);
    const st = (dep && dep.status) || "pending";
    if (st !== "done") unmetDeps += 1;
  }
  const hops = trajOutgoingIds(fix, id).length;
  const artPath = (fxNode && fxNode.artifact) || art || "";
  const sealHint = !!(
    (fxNode && fxNode.kind === "harness") ||
    /seal|immutable/i.test(String(id) + " " + artPath)
  );
  el.setAttribute("data-tip-residual", "1");
  el.setAttribute("data-residual-status", status);
  el.setAttribute("data-residual-deps", String(unmetDeps));
  el.setAttribute("data-residual-hops", String(hops));
  if (sealHint) el.setAttribute("data-residual-seal", "1");
  else el.removeAttribute("data-residual-seal");
  const residualCopy =
    unmetDeps +
    " dep" +
    (unmetDeps === 1 ? "" : "s") +
    " left · " +
    hops +
    " hop" +
    (hops === 1 ? "" : "s") +
    (sealHint ? " · seal" : "");
  html +=
    '<div class="traj-pin-tip-residual" data-tip-residual="1" data-residual-status="' +
    esc(status) +
    '" data-residual-deps="' +
    esc(String(unmetDeps)) +
    '" data-residual-hops="' +
    esc(String(hops)) +
    '"' +
    (sealHint ? ' data-residual-seal="1"' : "") +
    '><span class="traj-pin-tip-residual-badge">' +
    esc(status) +
    '</span><span class="traj-pin-tip-residual-copy">' +
    esc(residualCopy) +
    "</span></div>";
  el.innerHTML = html;
  el.hidden = false;
  positionTrajPinTip(el, ev, pin);
}




/** TEH: floating traj-edge hover tip (kind · label · from→to); mirror trajPinTip; no SVG <title>. */
function trajEdgeTipEl() {
  let el = document.getElementById("trajEdgeTip");
  if (!el) {
    el = document.createElement("div");
    el.id = "trajEdgeTip";
    el.hidden = true;
    el.setAttribute("data-traj-edge-tip", "1");
    el.setAttribute("role", "tooltip");
    document.body.appendChild(el);
  }
  return el;
}

function hideTrajEdgeTip() {
  const el = document.getElementById("trajEdgeTip");
  if (!el) return;
  el.hidden = true;
  el.removeAttribute("data-edge-id");
  el.removeAttribute("data-from");
  el.removeAttribute("data-to");
  el.removeAttribute("data-kind");
  el.removeAttribute("data-label");
  el.removeAttribute("data-latency");
  el.removeAttribute("data-tip-place");
  el.innerHTML = "";
}

function positionTrajEdgeTip(el, ev, edge) {
  const margin = 10;
  const tipW = el.offsetWidth || 160;
  const tipH = el.offsetHeight || 48;
  let x;
  let y;
  if (edge && typeof edge.getBoundingClientRect === "function") {
    const r = edge.getBoundingClientRect();
    x = r.left + r.width / 2 - tipW / 2;
    y = r.bottom + 8;
    if (y + tipH > window.innerHeight - margin) {
      y = r.top - tipH - 8;
      el.setAttribute("data-tip-place", "above");
    } else {
      el.setAttribute("data-tip-place", "below");
    }
  } else {
    x = (ev && ev.clientX != null ? ev.clientX : 0) + 12;
    y = (ev && ev.clientY != null ? ev.clientY : 0) + 14;
    el.setAttribute("data-tip-place", "cursor");
  }
  x = Math.max(margin, Math.min(x, window.innerWidth - margin - tipW));
  y = Math.max(margin, Math.min(y, window.innerHeight - margin - tipH));
  el.style.left = x + "px";
  el.style.top = y + "px";
}

function showTrajEdgeTip(edge, ev) {
  if (!edge || !ev) return;
  // Mutual exclusion with pin tip
  const pin = document.getElementById("trajPinTip");
  if (pin && !pin.hidden) {
    pin.hidden = true;
    pin.innerHTML = "";
  }
  const el = trajEdgeTipEl();
  const id = edge.getAttribute("data-edge-id") || "";
  const from = edge.getAttribute("data-from") || "";
  const to = edge.getAttribute("data-to") || "";
  const kind = edge.getAttribute("data-kind") || "";
  const label = edge.getAttribute("data-label") || "";
  el.setAttribute("data-edge-id", id);
  el.setAttribute("data-from", from);
  el.setAttribute("data-to", to);
  el.setAttribute("data-kind", kind);
  if (label) el.setAttribute("data-label", label);
  else el.removeAttribute("data-label");
  let latencyRaw = edge.getAttribute("data-latency") || "";
  if (!latencyRaw) {
    const fix = typeof trajectoryFixture === "function" ? trajectoryFixture() : null;
    const fxEdge = ((fix && fix.edges) || []).find((x) => x && x.id === id);
    if (fxEdge && Number.isFinite(Number(fxEdge.latencyMs)) && Number(fxEdge.latencyMs) > 0) {
      latencyRaw = String(fxEdge.latencyMs);
    }
  }
  const latencyMs = Number(latencyRaw);
  const hasLatency = Number.isFinite(latencyMs) && latencyMs > 0;
  if (hasLatency) el.setAttribute("data-latency", String(latencyMs));
  else el.removeAttribute("data-latency");
  const headBits = [];
  if (kind) headBits.push(kind);
  if (label) headBits.push(label);
  const head = headBits.join(" · ") || "edge";
  const hop = from && to ? from + " → " + to : from || to || "";
  let html =
    '<div class="traj-edge-tip-head"><span class="traj-edge-tip-kind" data-tip-edge-kind="1">' +
    esc(kind || "edge") +
    "</span>";
  if (label) {
    html +=
      '<span class="traj-edge-tip-label" data-tip-edge-label="1">' +
      esc(label) +
      "</span>";
  }
  html += "</div>";
  if (hop) {
    html +=
      '<div class="traj-edge-tip-hop" data-tip-edge-hop="1"><code data-tip-from="1">' +
      esc(from) +
      '</code><span class="traj-edge-tip-arrow" aria-hidden="true">→</span><code data-tip-to="1">' +
      esc(to) +
      "</code></div>";
  }
  if (hasLatency) {
    html +=
      '<div class="traj-edge-tip-meta" data-tip-edge-meta="1">' +
      '<span class="traj-edge-tip-chip traj-edge-tip-chip--latency" data-tip-edge-latency="1">' +
      esc(String(latencyMs)) +
      "ms</span></div>";
  }
  el.setAttribute(
    "data-tip-copy",
    head + (hop ? " · " + hop : "") + (hasLatency ? " · " + latencyMs + "ms" : "")
  );
  el.innerHTML = html;
  el.hidden = false;
  positionTrajEdgeTip(el, ev, edge);
}

/** CF: clear Trace/Passport traj focus and restore global residual chrome. */
function clearTrajFocus() {
  trajSelectedId = "";
  trajPinFocus = "";
  hideTrajPinTip();
  if (typeof hideTrajEdgeTip === "function") hideTrajEdgeTip();
  if (typeof window !== "undefined") window.__graphideTrajectoryFocus = "";
  syncAdeDeepLink(explorerWs === "passport" ? "passport" : "trace");
  paint({ animate: "none" });
}

function focusTrajectoryDep(depId) {
  const id = String(depId || "");
  if (!id) return false;
  const nodes = trajectoryFixture().nodes || [];
  if (!nodes.some((n) => n.id === id)) return false;
  trajSelectedId = id;
  trajPinFocus = "";
  syncAdeDeepLink("trace");
  paint({ animate: "none" });
  return true;
}

/** HA: hop to a directed successor (same focus path as dep-list). */
function hopTrajectoryNext(nextId) {
  return focusTrajectoryDep(nextId);
}

function bindTrajectoryPage() {
  const host = document.getElementById("trajCanvas");
  if (!host) return;
  hideTrajPinTip();
  if (typeof hideTrajEdgeTip === "function") hideTrajEdgeTip();
  host.querySelectorAll(".traj-node").forEach((el) => {
    el.onclick = (ev) => {
      ev.stopPropagation();
      const pin = ev.target && ev.target.closest ? ev.target.closest("[data-traj-pin]") : null;
      const id = el.getAttribute("data-id") || "";
      if (pin) {
        const kind = pin.getAttribute("data-traj-pin") || "";
        if (trajSelectedId === id && trajPinFocus === kind) {
          trajPinFocus = "";
        } else {
          trajSelectedId = id;
          trajPinFocus = kind === "artifact" || kind === "diff" ? kind : "";
        }
      } else if (trajSelectedId === id) {
        trajSelectedId = "";
        trajPinFocus = "";
      } else {
        trajSelectedId = id;
        trajPinFocus = "";
      }
      hideTrajPinTip();
      syncAdeDeepLink("trace");
      paint({ animate: "none" });
    };
  });
  host.querySelectorAll(".traj-pin[data-tip-ready]").forEach((pin) => {
    const node = pin.closest(".traj-node");
    if (!node) return;
    pin.onpointerenter = (ev) => {
      ev.stopPropagation();
      showTrajPinTip(pin, node, ev);
    };
    pin.onpointermove = (ev) => {
      const tipEl = document.getElementById("trajPinTip");
      if (tipEl && !tipEl.hidden) positionTrajPinTip(tipEl, ev, pin);
    };
    pin.onpointerleave = () => hideTrajPinTip();
  });
  // ADE TEH1–TEH3: traj-edge hover tip (pointer-events:stroke on path; parent svg still none)
  host.querySelectorAll("svg.traj-edges path.traj-edge[data-edge-id]").forEach((edge) => {
    edge.onpointerenter = (ev) => {
      ev.stopPropagation();
      showTrajEdgeTip(edge, ev);
    };
    edge.onpointermove = (ev) => {
      const tipEl = document.getElementById("trajEdgeTip");
      if (tipEl && !tipEl.hidden) positionTrajEdgeTip(tipEl, ev, edge);
    };
    edge.onpointerleave = () => hideTrajEdgeTip();
  });
  host.onclick = () => {
    if (document.activeElement !== host) host.focus({ preventScroll: true });
  };
  const zin = document.getElementById("trajZoomIn");
  const zout = document.getElementById("trajZoomOut");
  const zfit = document.getElementById("trajZoomFit");
  if (zin) zin.onclick = (ev) => { ev.preventDefault(); trajZoomBy(TRAJ_SCALE_STEP); };
  if (zout) zout.onclick = (ev) => { ev.preventDefault(); trajZoomBy(1 / TRAJ_SCALE_STEP); };
  if (zfit) zfit.onclick = (ev) => { ev.preventDefault(); trajZoomFit(); };
  // ADE ZPK1–ZPK3: keyboard cue on zoom percentage slider (restore focus after paint)
  const zpct = document.getElementById("trajZoomPct");
  if (zpct) {
    zpct.onkeydown = (ev) => {
      let acted = false;
      if (ev.key === "ArrowUp" || ev.key === "ArrowRight") {
        ev.preventDefault();
        ev.stopPropagation();
        trajZoomBy(TRAJ_SCALE_STEP);
        acted = true;
      } else if (ev.key === "ArrowDown" || ev.key === "ArrowLeft") {
        ev.preventDefault();
        ev.stopPropagation();
        trajZoomBy(1 / TRAJ_SCALE_STEP);
        acted = true;
      } else if (ev.key === "Home") {
        ev.preventDefault();
        ev.stopPropagation();
        trajZoomFit();
        acted = true;
      }
      if (!acted) return;
      const el = document.getElementById("trajZoomPct");
      if (el && typeof el.focus === "function") {
        try {
          el.focus({ preventScroll: true });
        } catch (_err) {
          /* ignore */
        }
      }
      // ADE ZAL1–ZAL3: announce pct via persistent #trajZoomLive after paint/focus restore
      if (typeof announceTrajZoom === "function") {
        announceTrajZoom(ev.key === "Home");
      }
    };
  }
  const residualFilterBtn = document.querySelector(
    '#trajEdgeLegend [data-residual-filter-toggle="1"]'
  );
  if (residualFilterBtn) {
    residualFilterBtn.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      toggleTrajResidualFilter();
    };
  }
  document.querySelectorAll('[data-residual-filter-clear="1"]').forEach((btn) => {
    btn.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      clearTrajResidualFilter("clear-chip");
    };
  });
  document.querySelectorAll('#trajEdgeLegend [data-legend-clear-filter="1"]').forEach((btn) => {
    btn.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      clearTrajResidualFilter("clear-chip");
    };
  });
  if (typeof bindResidualFilterCountChipHints === "function") bindResidualFilterCountChipHints();
  if (typeof bindPassportDeltaChart === "function") bindPassportDeltaChart();
  if (typeof applyPassportDeltaPaint === "function") applyPassportDeltaPaint();
  bindAdeHopButtons();
  bindAdePassportHlHops();
  const detail = document.getElementById("trajDetail");
  if (detail) {
    const onDepActivate = (ev) => {
      const chip =
        ev.target && ev.target.closest ? ev.target.closest("[data-traj-dep]") : null;
      if (!chip || !detail.contains(chip)) return;
      const id = chip.getAttribute("data-traj-dep") || "";
      if (!id) return;
      ev.preventDefault();
      ev.stopPropagation();
      focusTrajectoryDep(id);
    };
    detail.querySelectorAll("[data-traj-dep]").forEach((chip) => {
      chip.onclick = onDepActivate;
      chip.onkeydown = (ev) => {
        if (ev.key !== "Enter" && ev.key !== " ") return;
        onDepActivate(ev);
      };
    });
  }
  const onNextActivate = (ev) => {
    const chip =
      ev.target && ev.target.closest ? ev.target.closest("[data-traj-next]") : null;
    if (!chip) return;
    const id = chip.getAttribute("data-traj-next") || "";
    if (!id) return;
    ev.preventDefault();
    ev.stopPropagation();
    hopTrajectoryNext(id);
  };
  document.querySelectorAll("[data-traj-next]").forEach((chip) => {
    chip.onclick = onNextActivate;
    chip.onkeydown = (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      onNextActivate(ev);
    };
  });
}


const PASSPORT_STATES = { pending: 1, approved: 1, rejected: 1 };
const PASSPORT_FIXTURE = Object.freeze({
  version: 2,
  id: "passport-ade-phase-1.2-fixtures",
  title: "Plan Passport \u2014 ADE Phase 1.2 richer fixtures",
  status: "pending",
  summary: "Architecture / API / risk / test rows with Delta-vocab impact chips for upstream sign-off before agent writes.",
  targets: [
    {
      id: "t1",
      label: "Passport paint + bind",
      path: "extension/media/src/graph/desk.js",
      traj: "sub-edit",
      layer: "architecture",
      deltaStatus: "Changed",
      impact: "Richer row chrome + impact cards"
    },
    {
      id: "t2",
      label: "Explorer Passport tab",
      path: "extension/media/src/chrome/GraphBar.jsx",
      layer: "chrome",
      impact: "Sibling tab order unchanged",
      clusterKind: "Stable"
    },
    {
      id: "t3",
      label: "Harness + verify gate",
      path: "scripts/verify-graphide.js",
      traj: "sub-verify",
      layer: "harness",
      deltaStatus: "Added",
      impact: "PF1\u2013PF5 fixture drivers"
    },
    {
      id: "t4",
      label: "Trace DAG polish",
      path: "extension/media/src/graph/trajectory-fixture.js",
      traj: "sub-fixture",
      layer: "trace",
      impact: "A1a semantics preserved",
      clusterKind: "Stable"
    },
    {
      id: "t5",
      label: "Passport fixture JSON",
      path: "extension/scripts/passport-fixture.json",
      traj: "sub-passport",
      layer: "harness",
      deltaStatus: "Changed",
      impact: "Sim rows for architecture/API/risk/test"
    }
  ],
  contracts: [
    {
      id: "c1",
      kind: "function",
      name: "paintPassportWorkspace",
      sig: "(title) => void",
      stability: "draft",
      deltaClass: "Presentation",
      breaking: false,
      change: "Renders enriched fixture rows",
      traj: "sub-passport"
    },
    {
      id: "c2",
      kind: "function",
      name: "getPassport",
      sig: "() => PassportFixture",
      stability: "draft",
      deltaClass: "Semantic",
      breaking: false,
      change: "Accepts version-2 richer fields"
    },
    {
      id: "c3",
      kind: "function",
      name: "setPassportGate",
      sig: "(state) => void",
      stability: "draft",
      deltaClass: "Topology",
      breaking: false,
      change: "Gate state fixture-only",
      traj: "sub-edit"
    },
    {
      id: "c4",
      kind: "function",
      name: "bindTrajectoryPage",
      sig: "() => void",
      stability: "draft",
      deltaClass: "Topology",
      breaking: false,
      change: "Trace bind unchanged (A1a)",
      traj: "sub-fixture"
    },
    {
      id: "c5",
      kind: "function",
      name: "renderPassportImpact",
      sig: "(fx) => string",
      stability: "draft",
      deltaClass: "Presentation",
      breaking: false,
      change: "Structured impact rows + Delta chips",
      traj: "sub-passport"
    }
  ],
  risks: [
    {
      id: "r1",
      level: "high",
      area: "gate-state writes",
      note: "must never touch .graphide/stamps/",
      mitigation: "setPassportGate is in-memory only",
      blast: ".graphide/stamps/",
      traj: "sub-passport"
    },
    {
      id: "r2",
      level: "med",
      area: "agent write ordering",
      note: "file writes stay blocked until Approve",
      mitigation: "gatedWrites stay data-blocked until approved",
      blast: "extension/media/**",
      traj: "sub-edit"
    },
    {
      id: "r3",
      level: "low",
      area: "explorer tab ordering",
      note: "Passport remains click-only",
      mitigation: "no digit-key binding",
      blast: "#workspaces"
    },
    {
      id: "r4",
      level: "med",
      area: "A1a semantics",
      note: "Trace polish must keep trajectory-dag host + pin attrs",
      mitigation: "This slice does not edit Trace paint/bind",
      blast: "#trajCanvas",
      traj: "sub-fixture"
    },
    {
      id: "r5",
      level: "med",
      area: "live Delta mount",
      note: "Impact must stay vocabulary stub",
      mitigation: "No #deltaCanvas under #passportPage",
      blast: "#passportImpact",
      traj: "sub-passport"
    }
  ],
  testStrategy: [
    {
      id: "p1",
      kind: "assert",
      desc: "tab present, click-only (no digit key)",
      fixture: "?passport=1&ws=passport",
      covers: "chrome",
      traj: "sub-passport"
    },
    {
      id: "p2",
      kind: "assert",
      desc: "gate banner starts pending with blocked paths",
      fixture: "P3",
      covers: "gate"
    },
    {
      id: "p3",
      kind: "e2e",
      desc: "Approve unlocks gate fixture state; Reject re-blocks",
      fixture: "P6",
      covers: "gate",
      traj: "sub-verify"
    },
    {
      id: "p4",
      kind: "assert",
      desc: "impact stub keeps Architecture Delta vocabulary text",
      fixture: "P5",
      covers: "impact"
    },
    {
      id: "p5",
      kind: "assert",
      desc: "#passportDeltaVocab names statuses/classes/clusters + impact regions; no live Delta mount",
      fixture: "P5b",
      covers: "impact",
      traj: "sub-edit"
    },
    {
      id: "p6",
      kind: "assert",
      desc: "architecture/API/risk/test rows expose layer\u00b7delta\u00b7mitigation\u00b7fixture fields",
      fixture: "PF1\u2013PF5",
      covers: "targets,contracts,risks,tests,impact",
      traj: "sub-fixture"
    }
  ],
  gatedWrites: [
    {
      path: "extension/media/src/graph/desk.js",
      traj: "sub-edit",
      reason: "agent would edit paint/bind"
    },
    {
      path: "extension/media/src/chrome/GraphBar.jsx",
      reason: "agent would add chrome"
    },
    {
      path: "extension/media/main.css",
      reason: "agent would restyle passport"
    },
    {
      path: "extension/media/src/graph/trajectory-fixture.js",
      traj: "sub-fixture",
      reason: "agent would reshape Trace fixture"
    },
    {
      path: "extension/scripts/passport-fixture.json",
      traj: "sub-passport",
      reason: "agent would reshape Passport sim"
    }
  ],
  impact: {
    callGraphs: [
      {
        id: "cg1",
        traj: "sub-edit",
        label: "paintPassportWorkspace \u2190 renderExplorerList(ws)",
        detail: "Explorer list paint owns Passport page mount",
        deltaStatus: "Changed",
        deltaClass: "Topology"
      },
      {
        id: "cg2",
        label: "setPassportGate \u2190 #passportSign Approve/Reject",
        detail: "Sign-off flips gate without disk writes",
        deltaClass: "Semantic",
        clusterKind: "Stable"
      },
      {
        id: "cg3",
        label: "bindTrajectoryPage \u2190 renderExplorerList(trace)",
        detail: "Trace bind stays on A1a path",
        deltaClass: "Topology",
        clusterKind: "Stable"
      },
      {
        id: "cg4",
        label: "renderPassportImpact \u2190 renderPassportBody",
        detail: "Structured rows + Delta vocab chips",
        deltaStatus: "Added",
        deltaClass: "Presentation"
      },
      "legacy string impact row (static chrome)"
    ],
    apiContracts: [
      {
        id: "ac1",
        traj: "sub-verify",
        label: "getPassport() \u2192 PASSPORT_FIXTURE | window.__graphidePassport",
        detail: "Harness ?passport=1 may override embedded fixture",
        deltaStatus: "Changed",
        deltaClass: "Semantic"
      },
      {
        id: "ac2",
        label: "PASSPORT_GATE \u2208 pending|approved|rejected",
        detail: "URL ?gate= seeds + replaceState sync",
        deltaClass: "Semantic",
        clusterKind: "Stable"
      },
      {
        id: "ac3",
        label: "TRAJECTORY_FIXTURE.nodes[].artifact|diff pins on Trace",
        detail: "A1a pin attrs untouched by Passport enrich",
        deltaClass: "Topology",
        clusterKind: "Stable"
      }
    ],
    invariants: [
      {
        id: "inv1",
        label: "no digit-key binding for passport",
        detail: "Click-only workspace tab",
        deltaClass: "Presentation",
        clusterKind: "Stable"
      },
      {
        id: "inv2",
        label: "gate state fixture-only (no .graphide/stamps/)",
        detail: "Approve never posts stamps",
        deltaClass: "Semantic",
        clusterKind: "Stable"
      },
      {
        id: "inv3",
        label: "Architecture Delta vocabulary in #passportDeltaVocab stub only",
        detail: "No live #deltaCanvas mount on Passport",
        deltaClass: "Presentation",
        clusterKind: "Stable"
      },
      {
        id: "inv4",
        label: "Trace keeps #trajCanvas[data-testid=trajectory-dag]",
        detail: "A1a host preserved",
        deltaClass: "Topology",
        clusterKind: "Stable"
      },
      {
        id: "inv5",
        label: "no live #deltaCanvas mount on Passport",
        detail: "Impact readability uses vocabulary chips only",
        deltaClass: "Presentation",
        clusterKind: "Stable"
      }
    ],
    deltaVocab: {
      statuses: ["Added", "Removed", "Changed", "Moved", "Rerouted"],
      classes: ["Semantic", "Topology", "Presentation"],
      clusterKinds: ["Stable", "Split", "Merge", "Relabel", "Added", "Removed"],
      regions: [
        {
          id: "structural",
          label: "Structural delta",
          detail: "Pair by (kind, fqn). Exact facts only \u2014 no blast radius or merge safety."
        },
        {
          id: "impact",
          label: "Impact regions",
          detail: "Plan-projected call graphs, API contracts, and invariants before agent writes."
        },
        {
          id: "community",
          label: "Cluster continuity",
          detail: "sticky_match BubbleId kinds: Stable / Split / Merge / Relabel."
        }
      ]
    }
  }
});

const DELTA_VOCAB_DEFAULT = Object.freeze({
  statuses: ["Added", "Removed", "Changed", "Moved", "Rerouted"],
  classes: ["Semantic", "Topology", "Presentation"],
  clusterKinds: ["Stable", "Split", "Merge", "Relabel", "Added", "Removed"],
  regions: [
    {
      id: "structural",
      label: "Structural delta",
      detail: "Pair by (kind, fqn). Exact facts only — no blast radius or merge safety.",
    },
    {
      id: "impact",
      label: "Impact regions",
      detail: "Plan-projected call graphs, API contracts, and invariants before agent writes.",
    },
    {
      id: "community",
      label: "Cluster continuity",
      detail: "sticky_match BubbleId kinds: Stable / Split / Merge / Relabel.",
    },
  ],
});
let passportGate = "pending";
let passportGateSeeded = false;

/** Mirror classifyWrite vocabulary (display-only stub; not live FS). */
const SEAL_STATES = { sealed: 1, open: 1, unlock: 1 };
let sealStatus = "sealed";
let sealStatusSeeded = false;

function normalizeSealStatus(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (s === "agent") return "open";
  if (SEAL_STATES[s]) return s;
  return "";
}

function seedSealStatus() {
  // Prefer live window override so verify / harness flips re-paint without
  // calling setSealStatus. URL ?seal= seeds only on first pass.
  let want =
    (typeof window !== "undefined" && window.__graphideSealStatus) || "";
  if (!want && !sealStatusSeeded && typeof location !== "undefined") {
    try {
      want = new URLSearchParams(location.search || "").get("seal") || "";
    } catch (_err) {
      want = "";
    }
  }
  const norm = normalizeSealStatus(want);
  if (norm) sealStatus = norm;
  sealStatusSeeded = true;
}

function sealStatusState() {
  return SEAL_STATES[sealStatus] ? sealStatus : "sealed";
}

function sealStatusLabel(state) {
  if (state === "open") return "OPEN · agent";
  if (state === "unlock") return "UNLOCK · ADE_ALLOW";
  return "SEALED";
}

/** Matching title / aria-label / data-seal-info for seal-chip hover cue (SCH). */
function sealStatusInfoLabel(state) {
  return "Immutable seal / write-gate stub (fixture): " + sealStatusLabel(state);
}

function renderSealStatusChip() {
  seedSealStatus();
  const state = sealStatusState();
  const label = sealStatusLabel(state);
  const info = sealStatusInfoLabel(state);
  return (
    '<span id="adeSealChip" class="ade-seal-chip traj-status-chip" data-seal-state="' +
    esc(state) +
    '" data-seal-info="' +
    esc(info) +
    '" role="status" title="' +
    esc(info) +
    '" aria-label="' +
    esc(info) +
    '">' +
    esc(label) +
    "</span>"
  );
}

function setSealStatus(state) {
  // Fixture-only display. Never write disk / stamps / Docker.
  const norm = normalizeSealStatus(state) || "sealed";
  sealStatus = norm;
  sealStatusSeeded = true;
  if (typeof window !== "undefined") window.__graphideSealStatus = norm;
  syncAdeDeepLink(explorerWs === "passport" ? "passport" : "trace");
  paint({ animate: "none" });
}

function seedPassportGate() {
  if (passportGateSeeded) return;
  passportGateSeeded = true;
  let want =
    (typeof window !== "undefined" && window.__graphidePassportGate) || "";
  if (!want && typeof location !== "undefined") {
    try {
      want = new URLSearchParams(location.search || "").get("gate") || "";
    } catch (_err) {
      want = "";
    }
  }
  if (PASSPORT_STATES[want]) passportGate = want;
}

function renderAdeHop(target, label) {
  return (
    '<button type="button" class="ade-hop" data-ade-hop="' +
    esc(target) +
    '" title="Hop Trace↔Passport with traj/gate context">' +
    esc(label) +
    "</button>"
  );
}

function syncAdeDeepLink(wsOverride) {
  seedPassportGate();
  seedSealStatus();
  if (typeof history === "undefined" || !history.replaceState) return;
  if (typeof location === "undefined") return;
  let cur;
  try {
    cur = new URLSearchParams(location.search || "");
  } catch (_err) {
    return;
  }
  const onAde =
    cur.get("trace") === "1" ||
    cur.get("passport") === "1" ||
    explorerWs === "trace" ||
    explorerWs === "passport";
  if (!onAde) return;
  const q = new URLSearchParams(location.search || "");
  q.set("trace", "1");
  q.set("passport", "1");
  const ws = wsOverride || explorerWs;
  if (ws === "trace" || ws === "passport") q.set("ws", ws);
  if (trajSelectedId) q.set("traj", trajSelectedId);
  else q.delete("traj");
  q.set("gate", passportGateState());
  q.set("seal", sealStatusState());
  const next = location.pathname + "?" + q.toString() + (location.hash || "");
  const prev = location.pathname + location.search + (location.hash || "");
  if (next !== prev) history.replaceState(null, "", next);
  if (typeof window !== "undefined") {
    window.__graphideTrajectoryFocus = trajSelectedId || "";
    window.__graphidePassportGate = passportGateState();
    window.__graphideSealStatus = sealStatusState();
  }
}

function hopAdeWorkspace(target) {
  if (target !== "trace" && target !== "passport") return;
  syncAdeDeepLink(target);
  setWorkspace(target);
}

function bindAdeHopButtons() {
  document.querySelectorAll("[data-ade-hop]").forEach((btn) => {
    btn.onclick = (ev) => {
      ev.stopPropagation();
      hopAdeWorkspace(btn.getAttribute("data-ade-hop") || "");
    };
  });
}


function trajIdExists(id) {
  if (!id) return false;
  const nodes = (trajectoryFixture().nodes || []);
  return nodes.some((n) => n && n.id === id);
}

function resolvePassportTrajId(row) {
  if (!row || typeof row !== "object") return "";
  if (row.traj && trajIdExists(row.traj)) return row.traj;
  const path = row.path || "";
  if (!path) return "";
  const nodes = trajectoryFixture().nodes || [];
  const hit = nodes.find((n) => n && n.artifact === path);
  return hit && hit.id ? hit.id : "";
}



/** Traj ids mapped from still-residual Passport gatedWrites (AR adjacent residual). */
function passportResidualTrajIds() {
  const ids = new Set();
  if (passportGateState() === "approved") return ids;
  const fx = getPassport();
  for (const w of fx.gatedWrites || []) {
    const tid = resolvePassportTrajId(w);
    if (tid) ids.add(tid);
  }
  return ids;
}

/** ADE PTD — all traj ids linked from Passport plan surfaces. */
function passportLinkedTrajIds() {
  const ids = new Set();
  const fx = getPassport();
  const collect = (rows) => {
    for (const row of rows || []) {
      const tid = resolvePassportTrajId(row);
      if (tid) ids.add(tid);
    }
  };
  collect(fx.targets);
  collect(fx.contracts);
  collect(fx.risks);
  collect(fx.testStrategy);
  collect(fx.gatedWrites);
  const impact = fx.impact || {};
  collect(impact.callGraphs);
  collect(impact.apiContracts);
  return ids;
}

/** ADE PTD — planned | residual | extra for a traj id (plan vs walked). */
function passportDeltaKind(trajId) {
  if (!trajId || !trajIdExists(trajId)) return "";
  if (passportResidualTrajIds().has(trajId)) return "residual";
  if (passportLinkedTrajIds().has(trajId)) return "planned";
  return "extra";
}

/** ADE PTD — counts over Trace fixture nodes. */
function passportDeltaCounts() {
  const map = new Map();
  for (const n of trajectoryFixture().nodes || []) {
    const k = passportDeltaKind(n.id);
    if (!k) continue;
    map.set(k, (map.get(k) || 0) + 1);
  }
  return map;
}

/** ADE PTD — interactive planned/residual/extra bars. */
function passportDeltaChartHtml(map) {
  const order = ["planned", "residual", "extra"];
  const labels = { planned: "Planned", residual: "Residual", extra: "Extra" };
  const entries = order.filter((k) => (map.get(k) || 0) > 0).map((k) => [k, map.get(k)]);
  if (!entries.length) return "";
  const max = Math.max(1, ...entries.map((e) => e[1]));
  const bars = entries
    .map((e) => {
      const pct = Math.round((e[1] / max) * 100);
      const on = !!(passportDeltaFilter && String(passportDeltaFilter) === String(e[0]));
      return (
        '<button type="button" class="ptd-bar' +
        (on ? " on" : "") +
        '" data-ptd-kind="' +
        esc(e[0]) +
        '" aria-pressed="' +
        (on ? "true" : "false") +
        '" title="' +
        esc(labels[e[0]] || e[0]) +
        " · " +
        e[1] +
        '" style="--ptd-pct:' +
        pct +
        '%"><span class="ptd-fill" aria-hidden="true"></span><span class="ptd-label"><b>' +
        esc(labels[e[0]] || e[0]) +
        "</b> " +
        e[1] +
        "</span></button>"
      );
    })
    .join("");
  return (
    '<div class="ptd-chart" role="group" aria-label="Passport trajectory delta mix bars" data-ptd-axis-group="delta">' +
    bars +
    "</div>"
  );
}

function passportDeltaStripHtml() {
  const map = passportDeltaCounts();
  const chart = passportDeltaChartHtml(map);
  if (!chart) return "";
  const total = [...map.values()].reduce((a, b) => a + b, 0);
  return (
    '<div class="ptd-strip" data-ptd="1" role="group" aria-label="Passport trajectory delta mix">' +
    '<span class="ptd-stat"><i class="k">Delta</i> <b class="n">' +
    total +
    "</b> " +
    chart +
    "</span></div>"
  );
}

function togglePassportDeltaFilter(kind) {
  if (!kind) return;
  if (passportDeltaFilter && String(passportDeltaFilter) === String(kind)) passportDeltaFilter = null;
  else passportDeltaFilter = String(kind);
  applyPassportDeltaPaint();
  syncPassportDeltaBars();
}

function syncPassportDeltaBars() {
  if (!canvas) return;
  canvas.querySelectorAll(".ptd-bar[data-ptd-kind]").forEach((el) => {
    const k = el.getAttribute("data-ptd-kind") || "";
    const on = !!(passportDeltaFilter && String(passportDeltaFilter) === k);
    el.classList.toggle("on", on);
    el.setAttribute("aria-pressed", on ? "true" : "false");
  });
  const strip = canvas.querySelector(".ptd-strip");
  if (strip) strip.classList.toggle("ptd-filtering", !!passportDeltaFilter);
  const page = canvas.querySelector(".traj-page, .passport-page, #passportPage, .traj-canvas, #trajCanvas");
  if (page) page.classList.toggle("ptd-filtering", !!passportDeltaFilter);
  const canvasHost = document.getElementById("trajCanvas");
  if (canvasHost) canvasHost.classList.toggle("ptd-filtering", !!passportDeltaFilter);
  const gate = document.getElementById("passportGate");
  if (gate) gate.classList.toggle("ptd-filtering", !!passportDeltaFilter);
}

function bindPassportDeltaChart() {
  if (!canvas) return;
  canvas.querySelectorAll(".ptd-bar[data-ptd-kind]").forEach((el) => {
    el.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      togglePassportDeltaFilter(el.getAttribute("data-ptd-kind"));
    };
    el.onkeydown = (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      ev.stopPropagation();
      togglePassportDeltaFilter(el.getAttribute("data-ptd-kind"));
    };
  });
}

function applyPassportDeltaPaint() {
  if (!canvas) return;
  const filter = passportDeltaFilter ? String(passportDeltaFilter) : "";
  canvas.querySelectorAll("[data-ptd-kind]").forEach((el) => {
    // skip the bars themselves
    if (el.classList.contains("ptd-bar")) return;
    const k = el.getAttribute("data-ptd-kind") || "";
    const hit = !!(filter && k === filter);
    const dim = !!(filter && k && k !== filter);
    el.classList.toggle("ptd-hit", hit);
    el.classList.toggle("ptd-dim", dim);
  });
  syncPassportDeltaBars();
}


function passportRowActiveAttr(trajId) {
  return trajId && trajSelectedId && trajId === trajSelectedId
    ? ' data-ade-traj-active="1"'
    : "";
}

function passportRowActiveClass(trajId) {
  return trajId && trajSelectedId && trajId === trajSelectedId
    ? " ade-traj-active"
    : "";
}

function renderAdeTrajHop(trajId) {
  if (!trajIdExists(trajId)) return "";
  return (
    '<button type="button" class="ade-hop ade-traj-hop" data-ade-traj-hop="' +
    esc(trajId) +
    '" title="Open matching Trace node from Passport row">' +
    "Open in Trace" +
    "</button>"
  );
}

function hopAdeTraj(trajId) {
  if (!trajIdExists(trajId)) return;
  trajSelectedId = trajId;
  trajPinFocus = "";
  if (typeof window !== "undefined") window.__graphideTrajectoryFocus = trajId;
  syncAdeDeepLink("trace");
  hopAdeWorkspace("trace");
}


function hopAdePassportHighlight(trajId) {
  if (trajId && trajIdExists(trajId)) {
    trajSelectedId = trajId;
    trajPinFocus = "";
    if (typeof window !== "undefined") window.__graphideTrajectoryFocus = trajId;
  }
  syncAdeDeepLink("passport");
  hopAdeWorkspace("passport");
}

function bindAdePassportHlHops() {
  document.querySelectorAll("[data-ade-passport-hl-hop]").forEach((btn) => {
    btn.onclick = (ev) => {
      ev.stopPropagation();
      hopAdePassportHighlight(btn.getAttribute("data-ade-passport-hl-hop") || "");
    };
  });
}

function bindAdeTrajHops() {
  document.querySelectorAll("[data-ade-traj-hop]").forEach((btn) => {
    btn.onclick = (ev) => {
      ev.stopPropagation();
      hopAdeTraj(btn.getAttribute("data-ade-traj-hop") || "");
    };
  });
}


function isPassport(v) {
  return !!(
    v &&
    typeof v === "object" &&
    typeof v.id === "string" &&
    Array.isArray(v.targets) &&
    Array.isArray(v.contracts) &&
    Array.isArray(v.risks) &&
    Array.isArray(v.testStrategy) &&
    Array.isArray(v.gatedWrites) &&
    v.impact &&
    typeof v.impact === "object"
  );
}

const PASSPORT_EMPTY_FIXTURE = Object.freeze({
  version: 2,
  id: "passport-ade-empty-fixture",
  title: "Plan Passport",
  status: "pending",
  summary: "No plan rows yet — empty fixture",
  targets: Object.freeze([]),
  contracts: Object.freeze([]),
  risks: Object.freeze([]),
  testStrategy: Object.freeze([]),
  gatedWrites: Object.freeze([]),
  impact: Object.freeze({
    callGraphs: Object.freeze([]),
    apiContracts: Object.freeze([]),
    invariants: Object.freeze([]),
    deltaVocab: DELTA_VOCAB_DEFAULT,
  }),
});

function wantPassportEmpty() {
  if (typeof window === "undefined" || typeof location === "undefined") return false;
  try {
    return new URLSearchParams(location.search || "").get("passportEmpty") === "1";
  } catch (_err) {
    return false;
  }
}

function hasPassportPlanRows(fx) {
  if (!fx || typeof fx !== "object") return false;
  const impact = fx.impact || {};
  const impactRows =
    (impact.callGraphs || []).length +
    (impact.apiContracts || []).length +
    (impact.invariants || []).length;
  return (
    (fx.targets || []).length +
      (fx.contracts || []).length +
      (fx.risks || []).length +
      (fx.testStrategy || []).length +
      (fx.gatedWrites || []).length +
      impactRows >
    0
  );
}

function getPassport() {
  if (wantPassportEmpty()) return PASSPORT_EMPTY_FIXTURE;
  const o = typeof window !== "undefined" ? window.__graphidePassport : null;
  return isPassport(o) ? o : PASSPORT_FIXTURE;
}

function passportGateState() {
  return PASSPORT_STATES[passportGate] ? passportGate : "pending";
}



function passportImpactRowCount(fx) {
  const impact = (fx && fx.impact) || {};
  return (
    (impact.callGraphs || []).length +
    (impact.apiContracts || []).length +
    (impact.invariants || []).length
  );
}

function renderPassportStickySummary(fx, state) {
  const gate = PASSPORT_STATES[state] ? state : "pending";
  const contracts = (fx && fx.contracts) || [];
  const risks = (fx && fx.risks) || [];
  const tests = (fx && fx.testStrategy) || [];
  const impactN = passportImpactRowCount(fx);
  // ADE PSE: sticky present with all summary counts zero (e.g. targets/gatedWrites only).
  const zeroCounts =
    contracts.length + risks.length + tests.length + impactN === 0;
  const emptyAttr = zeroCounts
    ? ' data-passport-summary-empty="1"'
    : ' data-passport-summary-empty="0"';
  const emptyClass = zeroCounts ? " passport-sticky-summary--zero" : "";
  const zeroCue = zeroCounts
    ? '<span class="passport-sticky-zero-cue" data-passport-summary-zero-cue="1">No contracts, risks, tests, or impact yet.</span>'
    : "";
  return (
    '<div class="passport-sticky-summary' +
    emptyClass +
    '" data-passport-summary="1"' +
    emptyAttr +
    ' role="status" aria-label="Passport plan summary">' +
    '<span class="passport-sticky-gate" data-passport-gate="' +
    esc(gate) +
    '">' +
    esc(gate) +
    "</span>" +
    '<span class="passport-sticky-counts">' +
    '<span class="passport-sticky-count"><b data-passport-count="contracts">' +
    esc(String(contracts.length)) +
    "</b> contracts</span>" +
    '<span class="passport-sticky-count"><b data-passport-count="risks">' +
    esc(String(risks.length)) +
    "</b> risks</span>" +
    '<span class="passport-sticky-count"><b data-passport-count="tests">' +
    esc(String(tests.length)) +
    "</b> tests</span>" +
    '<span class="passport-sticky-count"><b data-passport-count="impact">' +
    esc(String(impactN)) +
    "</b> impact</span>" +
    "</span>" +
    zeroCue +
    "</div>"
  );
}

function renderPassportResidual(fx, state) {
  const writes = Array.isArray(fx && fx.gatedWrites) ? fx.gatedWrites : [];
  const globalN = writes.length;
  const residualState = PASSPORT_STATES[state] ? state : "pending";
  const trajFix = trajectoryFixture();
  const focusId =
    trajSelectedId && (trajFix.nodes || []).some((n) => n.id === trajSelectedId)
      ? trajSelectedId
      : "";
  const focusIds = focusId ? trajNeighborIds(trajFix, focusId) : null;
  const focusN = focusIds
    ? writes.filter((w) => {
        const tid = resolvePassportTrajId(w);
        return !!(tid && focusIds.has(tid));
      }).length
    : 0;
  const scoped = !!focusId;
  const n = scoped ? focusN : globalN;
  const copy = scoped
    ? residualState === "approved"
      ? "Focus path · " + n + " path" + (n === 1 ? "" : "s") + " open"
      : "Focus path · " + n + " path" + (n === 1 ? "" : "s") + " blocked"
    : residualState === "approved"
      ? "Writes unlocked · " + n + " path" + (n === 1 ? "" : "s") + " open"
      : "Sign-off incomplete · " + n + " path" + (n === 1 ? "" : "s") + " blocked";
  const scopeAttrs = scoped
    ? ' data-residual-scope="focus" data-residual-focus="' +
      esc(focusId) +
      '" data-focus-residual-count="' +
      esc(String(focusN)) +
      '"'
    : ' data-residual-scope="global"';
  const clearCue = scoped
    ? '<button type="button" class="passport-clear-focus" data-passport-clear-focus="1" title="Clear focus and show all residual paths" aria-label="Clear focus and show all residual paths">Clear focus</button>'
    : "";
  const residualFilterAttr = trajResidualFilter
    ? ' data-residual-filter="on"'
    : "";
  const residualFilterToggle =
    '<button type="button" class="passport-residual-filter-toggle" data-passport-residual-filter-toggle="1" aria-pressed="' +
    (trajResidualFilter ? "true" : "false") +
    '" title="Show residual-bearing gate paths only" aria-label="Toggle residual-bearing filter">' +
    (trajResidualFilter ? "residuals on" : "residuals") +
    "</button>";
  // ADE Passport sticky clear-filter cue (PCF1–PCF3) — ON + non-empty; mirror Trace legend CC
  const stickyClearFilterCue =
    trajResidualFilter && passportResidualTrajIds().size > 0
      ? '<button type="button" class="passport-sticky-clear-filter" data-passport-clear-filter="1" title="Clear residual filter" aria-label="Clear residual filter">Clear filter</button>'
      : "";
  // ADE Passport sticky residual-filter count (RFC1–RFC3) — ON + bearings; pairs with Trace legend RC
  const filterBearingN = passportResidualTrajIds().size;
  const hasPassportFilterCount = trajResidualFilter && filterBearingN > 0;
  const residualFilterCountAttr = hasPassportFilterCount
    ? ' data-residual-filter-count="1" data-filter-residual-count="' +
      esc(String(filterBearingN)) +
      '"'
    : "";
  const residualFilterCountChip = hasPassportFilterCount
    ? '<span class="passport-residual-filter-count" data-residual-filter-count="1" data-filter-residual-count="' +
      esc(String(filterBearingN)) +
      '" tabindex="0" role="status" title="Residual filter matches ' +
      esc(String(filterBearingN)) +
      '. Clear filter or Escape to clear" aria-label="Residual filter matches ' +
      esc(String(filterBearingN)) +
      '. Clear filter or Escape to clear">filter · ' +
      esc(String(filterBearingN)) +
      "</span>"
    : "";
  return (
    '<div class="passport-residual" data-passport-residual="1" data-residual-state="' +
    esc(residualState) +
    '" data-residual-count="' +
    esc(String(globalN)) +
    '"' +
    scopeAttrs +
    residualFilterAttr +
    residualFilterCountAttr +
    '><span class="passport-residual-badge">' +
    esc(String(n)) +
    '</span><span class="passport-residual-copy">' +
    esc(copy) +
    "</span>" +
    passportDeltaStripHtml() +
    residualFilterToggle +
    residualFilterCountChip +
    stickyClearFilterCue +
    clearCue +
    "</div>"
  );
}

function renderPassportGate(fx, state) {
  const unlocked = state === "approved";
  const label = unlocked
    ? "Writes unlocked — agent-style file writes may proceed (fixture)"
    : state === "rejected"
      ? "Rejected — gated write paths stay blocked"
      : "Gated write paths blocked until approved";
  const chip =
    state === "approved" ? "approved" : state === "rejected" ? "rejected" : "pending";
  const trajFix = trajectoryFixture();
  const focusId =
    trajSelectedId && (trajFix.nodes || []).some((n) => n.id === trajSelectedId)
      ? trajSelectedId
      : "";
  const near = trajNeighborIds(trajFix, focusId);
  const residualTrajs = passportResidualTrajIds();
  const paths = (fx.gatedWrites || [])
    .map((w) => {
      const blocked = unlocked ? "" : ' data-blocked="1"';
      const trajId = resolvePassportTrajId(w);
      const residualBearing = !!(trajId && residualTrajs.has(trajId));
      const residualBearingAttr = residualBearing
        ? ' data-residual-bearing="1"'
        : "";
      const residualFiltered = trajResidualFilter && !residualBearing;
      const residualFilteredClass = residualFiltered ? " residual-filtered" : "";
      const residualFilteredAttr = residualFiltered
        ? ' data-residual-filtered="1"'
        : "";
      const ptdKind = trajId ? passportDeltaKind(trajId) : "";
      const ptdKindAttr = ptdKind ? ' data-ptd-kind="' + esc(ptdKind) + '"' : "";
      const ptdHit = !!(passportDeltaFilter && ptdKind === passportDeltaFilter);
      const ptdDim = !!(passportDeltaFilter && ptdKind && ptdKind !== passportDeltaFilter);
      const ptdClass = (ptdHit ? " ptd-hit" : "") + (ptdDim ? " ptd-dim" : "");
      const hopState = unlocked ? "approved" : state === "rejected" ? "rejected" : "pending";
      const hopBadge = unlocked ? "open" : state === "rejected" ? "blocked" : "incomplete";
      const hopResidual =
        '<span class="passport-hop-residual" data-passport-hop-residual="1" data-hop-residual-state="' +
        esc(hopState) +
        '" data-hop-path="' +
        esc(w.path || "") +
        '"><span class="passport-hop-residual-badge">' +
        esc(hopBadge) +
        "</span></span>";
      const isAdj =
        !!focusId &&
        !unlocked &&
        !!trajId &&
        trajId !== focusId &&
        near.has(trajId);
      const adjClass = isAdj ? " passport-adj-residual" : "";
      const adjAttr = isAdj ? ' data-passport-adj-residual="1"' : "";
      const adjCue = isAdj
        ? '<span class="passport-adj-residual-cue" aria-hidden="true">adj residual</span>'
        : "";
      return (
        '<li class="passport-gate-path' +
        passportRowActiveClass(trajId) +
        adjClass +
        residualFilteredClass +
        ptdClass +
        '" data-passport-path="' +
        esc(w.path || "") +
        '"' +
        (trajId ? ' data-ade-traj="' + esc(trajId) + '"' : "") +
        passportRowActiveAttr(trajId) +
        adjAttr +
        residualBearingAttr +
        residualFilteredAttr +
        ptdKindAttr +
        blocked +
        '><span class="passport-path-state">' +
        (unlocked ? "open" : "blocked") +
        "</span>" +
        hopResidual +
        adjCue +
        "<code>" +
        esc(w.path || "") +
        "</code>" +
        (w.reason ? '<span class="passport-path-reason">' + esc(w.reason) + "</span>" : "") +
        renderAdeTrajHop(trajId) +
        "</li>"
      );
    })
    .join("");
  return (
    '<div id="passportGate" class="passport-gate" data-passport-state="' +
    esc(state) +
    '"' +
    (trajResidualFilter && residualTrajs.size === 0
      ? ' data-residual-filter-empty="1"'
      : "") +
    '><div class="passport-gate-head"><div class="passport-gate-summary"><span class="passport-gate-chip" data-gate-chip="' +
    esc(chip) +
    '">' +
    esc(chip) +
    '</span><div class="passport-gate-state">' +
    esc(label) +
    '</div></div></div><ul class="passport-gate-paths">' +
    paths +
    "</ul>" +
    renderResidualFilterEmptyChrome("passport") +
    "</div>"
  );
}

function renderPassportSection(key, title, body, count) {
  const countHtml =
    typeof count === "number"
      ? '<span class="passport-section-count">' + count + "</span>"
      : "";
  return (
    '<section class="passport-section" data-passport="' +
    esc(key) +
    '"><h3>' +
    esc(title) +
    countHtml +
    "</h3>" +
    body +
    "</section>"
  );
}

function renderDeltaVocabStub(impact) {
  const vocab =
    impact && impact.deltaVocab && typeof impact.deltaVocab === "object"
      ? impact.deltaVocab
      : DELTA_VOCAB_DEFAULT;
  const chipRow = (kind, items) =>
    '<div class="passport-vocab-row" data-vocab="' +
    esc(kind) +
    '"><span class="passport-vocab-label">' +
    esc(kind) +
    '</span><div class="passport-vocab-chips">' +
    (items || [])
      .map(
        (s) =>
          '<span class="passport-vocab-chip" data-vocab-chip="' +
          esc(kind) +
          '" data-vocab-value="' +
          esc(s) +
          '">' +
          esc(s) +
          "</span>"
      )
      .join("") +
    "</div></div>";
  const regions = (vocab.regions || [])
    .map(
      (r) =>
        '<li class="passport-vocab-region" data-impact-region="' +
        esc(r.id || "") +
        '"><strong>' +
        esc(r.label || r.id || "") +
        "</strong><span>" +
        esc(r.detail || "") +
        "</span></li>"
    )
    .join("");
  return (
    '<div id="passportDeltaVocab" class="passport-delta-vocab" data-delta-stub="1">' +
    '<div class="passport-delta-vocab-head">' +
    '<span class="passport-delta-vocab-k">Architecture Delta</span>' +
    '<span class="passport-delta-vocab-stub">vocabulary stub · no live Delta mount</span>' +
    "</div>" +
    chipRow("status", vocab.statuses) +
    chipRow("class", vocab.classes) +
    chipRow("cluster", vocab.clusterKinds) +
    '<ul class="passport-vocab-regions">' +
    regions +
    "</ul></div>"
  );
}

function renderPassportDeltaChip(kind, value) {
  if (!value) return "";
  return (
    '<span class="passport-vocab-chip" data-vocab-chip="' +
    esc(kind) +
    '" data-vocab-value="' +
    esc(value) +
    '">' +
    esc(value) +
    "</span>"
  );
}

function renderPassportImpactItem(item) {
  if (item == null) return "";
  if (typeof item === "string") {
    return (
      '<li class="passport-impact-row passport-impact-row--static" data-impact-row="">' +
      '<div class="passport-impact-head">' +
      '<span class="passport-impact-label"><code>' +
      esc(item) +
      "</code></span></div></li>"
    );
  }
  const status = item.deltaStatus || "";
  const klass = item.deltaClass || "";
  const cluster = item.clusterKind || "";
  const id = item.id || "";
  const hasDetail = !!item.detail;
  const staticClass = hasDetail ? "" : " passport-impact-row--static";
  const expandAttrs = hasDetail
    ? ' data-impact-expanded="false" aria-expanded="false" tabindex="0"'
    : "";
  const trajId = resolvePassportTrajId(item);
  return (
    '<li class="passport-impact-row' +
    staticClass +
    passportRowActiveClass(trajId) +
    '" data-impact-row="' +
    esc(id) +
    '"' +
    (trajId ? ' data-ade-traj="' + esc(trajId) + '"' : "") +
    passportRowActiveAttr(trajId) +
    (status ? ' data-delta-status="' + esc(status) + '"' : "") +
    (klass ? ' data-delta-class="' + esc(klass) + '"' : "") +
    (cluster ? ' data-cluster-kind="' + esc(cluster) + '"' : "") +
    expandAttrs +
    ">" +
    '<div class="passport-impact-head">' +
    renderPassportDeltaChip("status", status) +
    renderPassportDeltaChip("class", klass) +
    renderPassportDeltaChip("cluster", cluster) +
    '<strong class="passport-impact-label">' +
    esc(item.label || id) +
    "</strong>" +
    renderAdeTrajHop(trajId) +
    "</div>" +
    (hasDetail
      ? '<div class="passport-impact-detail">' + esc(item.detail) + "</div>"
      : "") +
    "</li>"
  );
}

function renderPassportImpact(fx) {
  const impact = fx.impact || {};
  const card = (key, title, items) =>
    '<div class="passport-impact-card" data-impact="' +
    esc(key) +
    '"><h4>' +
    esc(title) +
    "</h4><ul>" +
    (items || []).map((s) => renderPassportImpactItem(s)).join("") +
    "</ul></div>";
  return (
    '<section class="passport-section passport-impact" data-passport="impact" id="passportImpact">' +
    "<h3>Semantic impact</h3>" +
    '<p class="passport-impact-summary">' +
    esc(fx.summary || "") +
    " — Architecture Delta vocabulary (structural delta / impact regions / call graphs / API contracts / invariants):</p>" +
    renderDeltaVocabStub(impact) +
    '<div class="passport-impact-grid">' +
    card("callGraphs", "Call graphs", impact.callGraphs) +
    card("apiContracts", "API contracts", impact.apiContracts) +
    card("invariants", "Invariants", impact.invariants) +
    "</div></section>"
  );
}

function renderPassportEmptyBody(fx) {
  seedPassportGate();
  seedSealStatus();
  const title = fx.title || "Plan Passport";
  return (
    '<div id="passportPage" class="passport-page passport-page--empty" data-passport-empty="1">' +
    '<div class="ade-hop-row">' +
    renderAdeHop("trace", "← Open Trace") +
    renderSealStatusChip() +
    '<span class="ade-hop-hint">empty fixture · hop Trace · no live Delta</span>' +
    "</div>" +
    '<div class="outcome-strip passport-outcome"><span class="outcome-k">' +
    esc(title) +
    " · " +
    esc(fx.id || "passport-ade-empty-fixture") +
    ' · empty fixture</span><span class="passport-outcome-counts">0 targets · 0 contracts · 0 risks · 0 tests</span></div>' +
    '<div class="passport-empty desk-empty" data-passport-empty-chrome="1" role="status">' +
    '<b class="passport-empty-title">No plan rows</b>' +
    '<div class="passport-empty-copy">Passport is empty — no targets, contracts, risks, tests, or gated writes yet. Open Trace to inspect the trajectory, or load a Passport fixture.</div>' +
    '<div class="passport-empty-action">' +
    renderAdeHop("trace", "← Open Trace") +
    "</div>" +
    "</div>" +
    "</div>"
  );
}

function renderPassportBody() {
  seedPassportGate();
  seedSealStatus();
  const fx = getPassport();
  if (!hasPassportPlanRows(fx)) {
    return renderPassportEmptyBody(fx);
  }
  const state = passportGateState();
  const targets = (fx.targets || [])
    .map((t) => {
      const layer = t.layer || "";
      const status = t.deltaStatus || "";
      const cluster = t.clusterKind || "";
      return (
        (() => {
          const trajId = resolvePassportTrajId(t);
          return (
        '<li class="passport-row' +
        passportRowActiveClass(trajId) +
        '" data-passport-target="' +
        esc(t.id || "") +
        '"' +
        (trajId ? ' data-ade-traj="' + esc(trajId) + '"' : "") +
        passportRowActiveAttr(trajId) +
        (layer ? ' data-passport-layer="' + esc(layer) + '"' : "") +
        (status ? ' data-passport-delta="' + esc(status) + '"' : "") +
        (cluster ? ' data-cluster-kind="' + esc(cluster) + '"' : "") +
        '><div class="passport-row-head">' +
        (layer
          ? '<span class="passport-layer-chip" data-passport-layer-chip="' +
            esc(layer) +
            '">' +
            esc(layer) +
            "</span>"
          : "") +
        renderPassportDeltaChip("status", status) +
        renderPassportDeltaChip("cluster", cluster) +
        '<span class="passport-target-label">' +
        esc(t.label || t.id || "") +
        "</span> <code>" +
        esc(t.path || "") +
        "</code>" +
        renderAdeTrajHop(trajId) +
        "</div>" +
        (t.impact
          ? '<div class="passport-row-impact" data-passport-impact="' +
            esc(t.id || "") +
            '">' +
            esc(t.impact) +
            "</div>"
          : "") +
        "</li>"
          );
        })()
      );
    })
    .join("");
  const contracts = (fx.contracts || [])
    .map((c) => {
      const klass = c.deltaClass || "";
      const breaking = !!c.breaking;
      const trajId = resolvePassportTrajId(c);
      return (
        '<li class="passport-row' +
        passportRowActiveClass(trajId) +
        '" data-passport-contract="' +
        esc(c.id || "") +
        '"' +
        (trajId ? ' data-ade-traj="' + esc(trajId) + '" data-ade-contract-traj="1"' : "") +
        passportRowActiveAttr(trajId) +
        (klass ? ' data-passport-delta-class="' + esc(klass) + '"' : "") +
        (breaking ? ' data-passport-breaking="1"' : ' data-passport-breaking="0"') +
        '><div class="passport-row-head">' +
        '<code class="passport-kind">' +
        esc(c.kind || "") +
        "</code> <strong>" +
        esc(c.name || "") +
        '</strong> <code class="passport-sig">' +
        esc(c.sig || "") +
        "</code>" +
        renderPassportDeltaChip("class", klass) +
        (breaking
          ? '<span class="passport-breaking-pill" data-passport-breaking-pill="1">breaking</span>'
          : '<span class="passport-breaking-pill" data-passport-breaking-pill="0">compat</span>') +
        ' <em data-stability="' +
        esc(c.stability || "") +
        '">' +
        esc(c.stability || "") +
        "</em>" +
        renderAdeTrajHop(trajId) +
        "</div>" +
        (c.change
          ? '<div class="passport-row-impact">' + esc(c.change) + "</div>"
          : "") +
        "</li>"
      );
    })
    .join("");
  const risks = (fx.risks || [])
    .map((r) => {
      const trajId = resolvePassportTrajId(r);
      return (
        '<li class="passport-row' +
        passportRowActiveClass(trajId) +
        '" data-passport-risk="' +
        esc(r.id || "") +
        '"' +
        (trajId ? ' data-ade-traj="' + esc(trajId) + '" data-ade-risk-traj="1"' : "") +
        passportRowActiveAttr(trajId) +
        ' data-level="' +
        esc(r.level || "") +
        '"><div class="passport-row-head"><span class="passport-risk-pill" data-level="' +
        esc(r.level || "") +
        '">' +
        esc(r.level || "") +
        "</span> <b>" +
        esc(r.area || "") +
        "</b>" +
        (r.note ? " — " + esc(r.note) : "") +
        renderAdeTrajHop(trajId) +
        "</div>" +
        (r.mitigation
          ? '<div class="passport-row-meta" data-passport-mitigation="' +
            esc(r.id || "") +
            '"><span class="passport-meta-k">mitigation</span> ' +
            esc(r.mitigation) +
            "</div>"
          : "") +
        (r.blast
          ? '<div class="passport-row-meta" data-passport-blast="' +
            esc(r.id || "") +
            '"><span class="passport-meta-k">blast</span> <code>' +
            esc(r.blast) +
            "</code></div>"
          : "") +
        "</li>"
      );
    })
    .join("");
  const tests = (fx.testStrategy || [])
    .map((x) => {
      const trajId = resolvePassportTrajId(x);
      return (
        '<li class="passport-row' +
        passportRowActiveClass(trajId) +
        '" data-passport-test="' +
        esc(x.id || "") +
        '"' +
        (trajId ? ' data-ade-traj="' + esc(trajId) + '" data-ade-test-traj="1"' : "") +
        passportRowActiveAttr(trajId) +
        '><div class="passport-row-head"><code class="passport-test-kind">' +
        esc(x.kind || "") +
        "</code> " +
        esc(x.desc || "") +
        renderAdeTrajHop(trajId) +
        "</div>" +
        (x.fixture
          ? '<div class="passport-row-meta" data-passport-fixture="' +
            esc(x.id || "") +
            '"><span class="passport-meta-k">fixture</span> <code>' +
            esc(x.fixture) +
            "</code></div>"
          : "") +
        (x.covers
          ? '<div class="passport-row-meta" data-passport-covers="' +
            esc(x.id || "") +
            '"><span class="passport-meta-k">covers</span> ' +
            esc(x.covers) +
            "</div>"
          : "") +
        "</li>"
      );
    })
    .join("");
  return (
    '<div id="passportPage" class="passport-page">' +
    '<div class="ade-hop-row">' +
    renderAdeHop("trace", "← Open Trace") +
    renderSealStatusChip() +
    '<span class="ade-hop-hint">preserves traj focus · gate · contract/risk/test Open in Trace · seal stub · no live Delta</span>' +
    "</div>" +
    '<div class="outcome-strip passport-outcome"><span class="outcome-k">' +
    esc(fx.title || "Plan Passport") +
    " · " +
    esc(fx.id || "") +
    ' · fixture</span><span class="passport-outcome-counts">' +
    (fx.targets || []).length +
    " targets · " +
    (fx.contracts || []).length +
    " contracts · " +
    (fx.risks || []).length +
    " risks · " +
    (fx.testStrategy || []).length +
    " tests</span></div>" +
    renderPassportGate(fx, state) +
    renderPassportSection(
      "targets",
      "Architecture targets",
      "<ul>" + targets + "</ul>",
      (fx.targets || []).length
    ) +
    renderPassportSection(
      "contracts",
      "Interfaces / API contracts",
      "<ul>" + contracts + "</ul>",
      (fx.contracts || []).length
    ) +
    renderPassportSection(
      "risks",
      "Breaking-change risk",
      "<ul>" + risks + "</ul>",
      (fx.risks || []).length
    ) +
    renderPassportSection(
      "tests",
      "Test strategy",
      "<ul>" + tests + "</ul>",
      (fx.testStrategy || []).length
    ) +
    renderPassportImpact(fx) +
    '<div id="passportSign" class="passport-sign" data-passport-sign-state="' +
    esc(state) +
    '">' +
    renderPassportStickySummary(fx, state) +
    renderPassportResidual(fx, state) +
    '<div class="passport-sign-actions">' +
    '<button type="button" data-passport-action="approve">Approve</button>' +
    '<button type="button" data-passport-action="reject">Reject</button>' +
    "</div>" +
    '<span class="passport-sign-hint">Fixture gate only — never writes .graphide/stamps/</span>' +
    "</div></div>"
  );
}

function paintPassportWorkspace(title) {
  unmountAllReviewCanvases();
  canvas.className = "play explorer-list passport";
  canvas.innerHTML =
    '<div class="expl-wrap"><div class="flow-title">' + esc(title) + "</div>" + renderPassportBody() + "</div>";
  setZoomUi(false);
  // ADE LRP: while residual filter stays ON, refresh live-region N on paint (Approve/focus/fixture) without toast.
  if (trajResidualFilter && typeof syncResidualFilterLive === "function") syncResidualFilterLive(true);
}

function syncPassportStickyGate() {
  // ADE SGR: live-refresh sticky summary gate chip from passportGateState (Approve/Reject),
  // even if a future paint path skips full #passportSign remount.
  const gate = passportGateState();
  const sign = document.getElementById("passportSign");
  if (!sign) return;
  if (sign.getAttribute("data-passport-sign-state") !== gate) {
    sign.setAttribute("data-passport-sign-state", gate);
  }
  const chip =
    sign.querySelector("[data-passport-summary] [data-passport-gate]") ||
    sign.querySelector(".passport-sticky-gate[data-passport-gate]");
  if (!chip) return;
  if (chip.getAttribute("data-passport-gate") !== gate) {
    chip.setAttribute("data-passport-gate", gate);
  }
  if ((chip.textContent || "").trim() !== gate) chip.textContent = gate;
}

function setPassportGate(state) {
  // Fixture-only gate. Never write .graphide/stamps/. Never touch disk.
  passportGate = PASSPORT_STATES[state] ? state : "pending";
  syncAdeDeepLink("passport");
  paint({ animate: "none" });
  // ADE SGR: patch sticky gate chip after paint so Approve/Reject refresh without desk hop.
  if (typeof syncPassportStickyGate === "function") syncPassportStickyGate();
}
if (typeof window !== "undefined") {
  window.__graphideSetPassportGate = setPassportGate;
  window.__graphideSyncPassportStickyGate = syncPassportStickyGate;
}

function togglePassportImpactRow(row) {
  if (!row || !row.hasAttribute("data-impact-expanded")) return;
  const next = row.getAttribute("data-impact-expanded") !== "true";
  row.setAttribute("data-impact-expanded", next ? "true" : "false");
  row.setAttribute("aria-expanded", next ? "true" : "false");
}

function bindPassportImpactRows() {
  const root = document.getElementById("passportImpact");
  if (!root) return;
  root.addEventListener("click", (ev) => {
    if (ev.target.closest("a, button")) return;
    const row = ev.target.closest("[data-impact-row][data-impact-expanded]");
    if (!row || !root.contains(row)) return;
    ev.preventDefault();
    togglePassportImpactRow(row);
  });
  root.addEventListener("keydown", (ev) => {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    if (ev.target.closest("a, button")) return;
    const row = ev.target.closest("[data-impact-row][data-impact-expanded]");
    if (!row || !root.contains(row)) return;
    ev.preventDefault();
    togglePassportImpactRow(row);
  });
}

function bindPassportPage() {
  const sign = document.getElementById("passportSign");
  if (sign) {
    const approve = sign.querySelector('[data-passport-action="approve"]');
    const reject = sign.querySelector('[data-passport-action="reject"]');
    if (approve)
      approve.onclick = (ev) => {
        ev.stopPropagation();
        setPassportGate("approved");
      };
    if (reject)
      reject.onclick = (ev) => {
        ev.stopPropagation();
        setPassportGate("rejected");
      };
    const clearFocus = sign.querySelector('[data-passport-clear-focus="1"]');
    if (clearFocus)
      clearFocus.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        clearTrajFocus();
      };
    const residualFilterBtn = sign.querySelector(
      '[data-passport-residual-filter-toggle="1"]'
    );
    if (residualFilterBtn)
      residualFilterBtn.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        toggleTrajResidualFilter();
      };
    const stickyClearFilter = sign.querySelector(
      '[data-passport-clear-filter="1"]'
    );
    if (stickyClearFilter)
      stickyClearFilter.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        clearTrajResidualFilter("clear-chip");
      };
  }
  document.querySelectorAll('[data-residual-filter-clear="1"]').forEach((btn) => {
    btn.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      clearTrajResidualFilter("clear-chip");
    };
  });
  if (typeof bindResidualFilterCountChipHints === "function") bindResidualFilterCountChipHints();
  if (typeof bindPassportDeltaChart === "function") bindPassportDeltaChart();
  if (typeof applyPassportDeltaPaint === "function") applyPassportDeltaPaint();
  bindPassportImpactRows();
  bindAdeHopButtons();
  bindAdeTrajHops();
}



function countMap(items, keyFn) {
  const m = new Map();
  for (const x of items || []) {
    const k = keyFn(x) || "—";
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

function statChips(map, axis) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map((e) => {
      if (!axis) {
        return '<span class="stat-chip"><b>' + esc(e[0]) + "</b> " + e[1] + "</span>";
      }
      const on = !!(
        overviewMixFilter &&
        overviewMixFilter.axis === axis &&
        overviewMixFilter.value === e[0]
      );
      return (
        '<button type="button" class="stat-chip omc-chip' +
        (on ? " on" : "") +
        '" data-omc-axis="' +
        esc(axis) +
        '" data-omc-value="' +
        esc(e[0]) +
        '" aria-pressed="' +
        (on ? "true" : "false") +
        '" title="' +
        esc(e[0]) +
        " · " +
        e[1] +
        '"><b>' +
        esc(e[0]) +
        "</b> " +
        e[1] +
        "</button>"
      );
    })
    .join("");
}

/** ADE OMC — CSS bar mix from countMap; max-scaled so top kind fills the track. */
function mixChartHtml(axis, map) {
  const entries = [...map.entries()].sort((a, b) => b[1] - a[1]);
  if (!entries.length) return "";
  const max = Math.max(1, ...entries.map((e) => e[1]));
  const bars = entries
    .map((e) => {
      const pct = Math.round((e[1] / max) * 100);
      const on = !!(
        overviewMixFilter &&
        overviewMixFilter.axis === axis &&
        overviewMixFilter.value === e[0]
      );
      return (
        '<button type="button" class="omc-bar' +
        (on ? " on" : "") +
        '" data-omc-axis="' +
        esc(axis) +
        '" data-omc-value="' +
        esc(e[0]) +
        '" aria-pressed="' +
        (on ? "true" : "false") +
        '" title="' +
        esc(e[0]) +
        " · " +
        e[1] +
        '" style="--omc-pct:' +
        pct +
        '%"><span class="omc-fill" aria-hidden="true"></span><span class="omc-label"><b>' +
        esc(e[0]) +
        "</b> " +
        e[1] +
        "</span></button>"
      );
    })
    .join("");
  return (
    '<div class="omc-chart omc-chart--' +
    esc(axis) +
    '" role="group" aria-label="' +
    (axis === "kind" ? "Node kind mix" : "Hop kind mix") +
    '">' +
    bars +
    "</div>"
  );
}

function toggleOverviewMixFilter(axis, value) {
  if (!axis || value == null || value === "") return;
  if (
    overviewMixFilter &&
    overviewMixFilter.axis === axis &&
    overviewMixFilter.value === value
  ) {
    overviewMixFilter = null;
  } else {
    overviewMixFilter = { axis: String(axis), value: String(value) };
    if (overviewCommunityFilter) {
      overviewCommunityFilter = null;
      applyOverviewCommunityPaint();
    }
  }
  applyOverviewMixPaint();
}

function applyOverviewMixPaint() {
  const host = document.getElementById("sliceCanvas");
  const filter = overviewMixFilter;
  if (canvas) {
    canvas.querySelectorAll("[data-omc-axis][data-omc-value]").forEach((el) => {
      const on = !!(
        filter &&
        el.getAttribute("data-omc-axis") === filter.axis &&
        el.getAttribute("data-omc-value") === filter.value
      );
      el.classList.toggle("on", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  if (!host) return;
  host.classList.toggle("omc-filtering", !!filter);
  const nodes = host.querySelectorAll(".vnode");
  const edges = host.querySelectorAll(".react-flow__edge");
  nodes.forEach((el) => el.classList.remove("omc-hit", "omc-dim"));
  edges.forEach((el) => el.classList.remove("omc-hit", "omc-dim"));
  if (!filter) return;
  if (filter.axis === "kind") {
    const hot = new Set();
    nodes.forEach((el) => {
      const match = (el.getAttribute("data-kind") || "") === filter.value;
      el.classList.toggle("omc-hit", match);
      el.classList.toggle("omc-dim", !match);
      if (match) hot.add(el.getAttribute("data-id") || "");
    });
    edges.forEach((el) => {
      const a = el.getAttribute("data-from") || "";
      const b = el.getAttribute("data-to") || "";
      const match = !!(hot.has(a) || hot.has(b));
      el.classList.toggle("omc-hit", match);
      el.classList.toggle("omc-dim", !match);
    });
  } else if (filter.axis === "hop") {
    const incident = new Set();
    edges.forEach((el) => {
      const match = (el.getAttribute("data-kind") || "") === filter.value;
      el.classList.toggle("omc-hit", match);
      el.classList.toggle("omc-dim", !match);
      if (match) {
        const a = el.getAttribute("data-from");
        const b = el.getAttribute("data-to");
        if (a) incident.add(a);
        if (b) incident.add(b);
      }
    });
    nodes.forEach((el) => {
      const match = incident.has(el.getAttribute("data-id") || "");
      el.classList.toggle("omc-hit", match);
      el.classList.toggle("omc-dim", !match);
    });
  }
}

function bindOverviewMixChart() {
  if (!canvas) return;
  canvas.querySelectorAll("[data-omc-axis][data-omc-value]").forEach((el) => {
    el.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      toggleOverviewMixFilter(el.getAttribute("data-omc-axis"), el.getAttribute("data-omc-value"));
    };
    el.onkeydown = (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      ev.stopPropagation();
      toggleOverviewMixFilter(el.getAttribute("data-omc-axis"), el.getAttribute("data-omc-value"));
    };
  });
}


/** ADE SHM — CSS bar mix for Slice; max-scaled (OMC/MAC parity). */
function sliceMixChartHtml(axis, map) {
  const entries = [...map.entries()].sort((a, b) => b[1] - a[1]);
  if (!entries.length) return "";
  const max = Math.max(1, ...entries.map((e) => e[1]));
  const bars = entries
    .map((e) => {
      const pct = Math.round((e[1] / max) * 100);
      const on = !!(
        sliceMixFilter &&
        sliceMixFilter.axis === axis &&
        sliceMixFilter.value === e[0]
      );
      return (
        '<button type="button" class="shm-bar' +
        (on ? " on" : "") +
        '" data-shm-axis="' +
        esc(axis) +
        '" data-shm-value="' +
        esc(e[0]) +
        '" aria-pressed="' +
        (on ? "true" : "false") +
        '" title="' +
        esc(e[0]) +
        " · " +
        e[1] +
        '" style="--shm-pct:' +
        pct +
        '%"><span class="shm-fill" aria-hidden="true"></span><span class="shm-label"><b>' +
        esc(e[0]) +
        "</b> " +
        e[1] +
        "</span></button>"
      );
    })
    .join("");
  return (
    '<div class="shm-chart shm-chart--' +
    esc(axis) +
    '" role="group" aria-label="Slice ' +
    esc(axis) +
    ' mix" data-shm-axis-group="' +
    esc(axis) +
    '">' +
    bars +
    "</div>"
  );
}

/** ADE SHM — kind+hop strip above Slice Steiner canvas. */
function sliceMixStripHtml(flow, graph) {
  const treeNodes = (flow && flow.tree && flow.tree.nodes) || [];
  const nodes = [];
  for (const raw of treeNodes) {
    const n = nodeById.get(idVal(raw)) || { id: raw, kind: kindOf(graph, raw) };
    if (n) nodes.push(n);
  }
  const treeEdges = (flow && flow.tree && flow.tree.edges) || [];
  const kinds = countMap(nodes, (n) => n.kind);
  const hops = countMap(treeEdges, (e) => e.kind || "Calls");
  if (!kinds.size && !hops.size) return "";
  return (
    '<div class="shm-strip" data-shm="1" role="group" aria-label="Slice hop-kind mix">' +
    (kinds.size
      ? '<span class="shm-stat"><i class="k">Kinds</i> <b class="n">' +
        nodes.length +
        "</b> " +
        sliceMixChartHtml("kind", kinds) +
        "</span>"
      : "") +
    (hops.size
      ? '<span class="shm-stat"><i class="k">Hops</i> <b class="n">' +
        treeEdges.length +
        "</b> " +
        sliceMixChartHtml("hop", hops) +
        "</span>"
      : "") +
    "</div>"
  );
}

function toggleSliceMixFilter(axis, value) {
  if (!axis || value == null || value === "") return;
  if (
    sliceMixFilter &&
    sliceMixFilter.axis === axis &&
    sliceMixFilter.value === value
  ) {
    sliceMixFilter = null;
  } else {
    sliceMixFilter = { axis: String(axis), value: String(value) };
  }
  applySliceMixPaint();
}

function applySliceMixPaint() {
  const filter = sliceMixFilter;
  if (canvas) {
    canvas.querySelectorAll(".shm-bar[data-shm-axis][data-shm-value]").forEach((el) => {
      const on = !!(
        filter &&
        filter.axis === el.getAttribute("data-shm-axis") &&
        filter.value === el.getAttribute("data-shm-value")
      );
      el.classList.toggle("on", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  const host = document.getElementById("sliceCanvas");
  if (!host) return;
  host.classList.toggle("shm-filtering", !!filter);
  const nodes = host.querySelectorAll(".vnode");
  const edges = host.querySelectorAll(".react-flow__edge");
  nodes.forEach((el) => el.classList.remove("shm-hit", "shm-dim"));
  edges.forEach((el) => el.classList.remove("shm-hit", "shm-dim"));
  if (!filter) return;
  if (filter.axis === "kind") {
    const hot = new Set();
    nodes.forEach((el) => {
      const match = (el.getAttribute("data-kind") || "") === filter.value;
      el.classList.toggle("shm-hit", match);
      el.classList.toggle("shm-dim", !match);
      if (match) hot.add(el.getAttribute("data-id") || "");
    });
    edges.forEach((el) => {
      const a = el.getAttribute("data-from") || "";
      const b = el.getAttribute("data-to") || "";
      const match = !!(hot.has(a) || hot.has(b));
      el.classList.toggle("shm-hit", match);
      el.classList.toggle("shm-dim", !match);
    });
  } else if (filter.axis === "hop") {
    const incident = new Set();
    edges.forEach((el) => {
      const match = (el.getAttribute("data-kind") || "") === filter.value;
      el.classList.toggle("shm-hit", match);
      el.classList.toggle("shm-dim", !match);
      if (match) {
        const a = el.getAttribute("data-from");
        const b = el.getAttribute("data-to");
        if (a) incident.add(a);
        if (b) incident.add(b);
      }
    });
    nodes.forEach((el) => {
      const match = incident.has(el.getAttribute("data-id") || "");
      el.classList.toggle("shm-hit", match);
      el.classList.toggle("shm-dim", !match);
    });
  }
}

function bindSliceMixChart() {
  if (!canvas) return;
  canvas.querySelectorAll("[data-shm-axis][data-shm-value]").forEach((el) => {
    el.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      toggleSliceMixFilter(el.getAttribute("data-shm-axis"), el.getAttribute("data-shm-value"));
    };
    el.onkeydown = (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      ev.stopPropagation();
      toggleSliceMixFilter(el.getAttribute("data-shm-axis"), el.getAttribute("data-shm-value"));
    };
  });
}


/** ADE CPS — directed Calls (and Publishes/Subscribes) outbound reach within depth. */
function callPathReach(id, depth) {
  const start = id ? String(idVal(id)) : "";
  const hot = new Set();
  const edgeHot = new Set();
  if (!start || !(depth > 0)) return { nodes: hot, edges: edgeHot };
  hot.add(start);
  let frontier = [start];
  const CALLISH = { Calls: 1, Publishes: 1, Subscribes: 1 };
  for (let h = 0; h < depth; h++) {
    const next = [];
    for (const cur of frontier) {
      for (const e of incidentEdges(cur)) {
        if (e.dir !== "out") continue;
        if (!CALLISH[String(e.kind || "")]) continue;
        const other = e.to;
        if (!other) continue;
        edgeHot.add(cur + "\0" + other + "\0" + String(e.kind || "Calls"));
        edgeHot.add(cur + "\0" + other);
        if (hot.has(other)) continue;
        hot.add(other);
        next.push(other);
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }
  return { nodes: hot, edges: edgeHot };
}

function callPathMaxDepth(id) {
  const start = id ? String(idVal(id)) : "";
  if (!start) return 0;
  let max = 0;
  const seen = new Set([start]);
  let frontier = [start];
  const CALLISH = { Calls: 1, Publishes: 1, Subscribes: 1 };
  for (let h = 0; h < 12; h++) {
    const next = [];
    for (const cur of frontier) {
      for (const e of incidentEdges(cur)) {
        if (e.dir !== "out") continue;
        if (!CALLISH[String(e.kind || "")]) continue;
        const other = e.to;
        if (!other || seen.has(other)) continue;
        seen.add(other);
        next.push(other);
      }
    }
    if (!next.length) break;
    max = h + 1;
    frontier = next;
  }
  return max;
}

function callPathStripHtml() {
  const sid = selectedNodeId ? idVal(selectedNodeId) : "";
  const max = sid ? Math.max(1, callPathMaxDepth(sid)) : 1;
  const depth = callPathDepth > 0 ? Math.min(callPathDepth, max) : 0;
  const label = sid ? shortToken(sid) : "select a node";
  return (
    '<div class="cps-strip" data-cps="1" role="group" aria-label="Call-path scrubber">' +
    '<span class="cps-stat"><i class="k">Call path</i> <b class="n" data-cps-focus="1">' +
    esc(label) +
    "</b></span>" +
    '<label class="cps-slider-wrap">' +
    '<span class="cps-depth-label">depth <b data-cps-depth-val="1">' +
    depth +
    "</b></span>" +
    '<input type="range" id="cpsDepth" class="cps-depth" min="0" max="' +
    max +
    '" value="' +
    depth +
    '" step="1" aria-label="Call-path hop depth" ' +
    (sid ? "" : "disabled ") +
    "/>" +
    "</label>" +
    '<span class="cps-hint">lights Calls path · branches fade</span>' +
    "</div>"
  );
}

function syncCallPathStrip() {
  if (!canvas) return;
  const strip = canvas.querySelector(".cps-strip[data-cps='1']");
  if (!strip) return;
  const sid = selectedNodeId ? idVal(selectedNodeId) : "";
  const max = sid ? Math.max(1, callPathMaxDepth(sid)) : 1;
  if (callPathDepth > max) callPathDepth = max;
  const depth = callPathDepth > 0 ? callPathDepth : 0;
  const focus = strip.querySelector("[data-cps-focus='1']");
  if (focus) focus.textContent = sid ? shortToken(sid) : "select a node";
  const val = strip.querySelector("[data-cps-depth-val='1']");
  if (val) val.textContent = String(depth);
  const input = strip.querySelector("#cpsDepth");
  if (input) {
    input.max = String(max);
    input.value = String(depth);
    input.disabled = !sid;
  }
}

function bindCallPathStrip() {
  if (!canvas) return;
  const input = canvas.querySelector("#cpsDepth");
  if (!input || input.dataset.cpsBound === "1") return;
  input.dataset.cpsBound = "1";
  input.addEventListener("input", () => {
    const n = parseInt(input.value, 10);
    callPathDepth = Number.isFinite(n) && n > 0 ? n : 0;
    if (callPathDepth > 0) {
      if (overviewMixFilter) {
        overviewMixFilter = null;
        applyOverviewMixPaint();
      }
      if (sliceMixFilter) {
        sliceMixFilter = null;
        applySliceMixPaint();
      }
    }
    const val = canvas.querySelector("[data-cps-depth-val='1']");
    if (val) val.textContent = String(callPathDepth);
    applyCallPathPaint();
  });
}

function applyCallPathPaint() {
  const host = document.getElementById("sliceCanvas");
  if (!host) return;
  const depth = callPathDepth > 0 ? callPathDepth : 0;
  const sid = selectedNodeId ? idVal(selectedNodeId) : "";
  const active = !!(depth && sid);
  host.classList.toggle("cps-filtering", active);
  const nodes = host.querySelectorAll(".vnode");
  const edges = host.querySelectorAll(".react-flow__edge");
  nodes.forEach((el) => el.classList.remove("cps-hit", "cps-dim", "cps-branch"));
  edges.forEach((el) => el.classList.remove("cps-hit", "cps-dim", "cps-branch"));
  if (!active) return;
  const reach = callPathReach(sid, depth);
  nodes.forEach((el) => {
    const id = el.getAttribute("data-id") || "";
    const hit = reach.nodes.has(id);
    el.classList.toggle("cps-hit", hit);
    el.classList.toggle("cps-dim", !hit);
  });
  edges.forEach((el) => {
    const a = el.getAttribute("data-from") || "";
    const b = el.getAttribute("data-to") || "";
    const kind = el.getAttribute("data-kind") || "Calls";
    const hit =
      reach.edges.has(a + "\0" + b + "\0" + kind) ||
      reach.edges.has(a + "\0" + b) ||
      (reach.nodes.has(a) && reach.nodes.has(b));
    // Branch fade: edge leaves a hit node but target not in reach → dim harder via cps-branch
    const branch = reach.nodes.has(a) && !reach.nodes.has(b);
    el.classList.toggle("cps-hit", hit && !branch);
    el.classList.toggle("cps-branch", branch);
    el.classList.toggle("cps-dim", !hit || branch);
  });
}

function refreshSliceMixStrip(flow, graph) {
  if (!canvas) return;
  const stage = canvas.querySelector(".stage");
  if (!stage) return;
  const html = sliceMixStripHtml(flow, graph);
  let strip = stage.querySelector(".shm-strip");
  if (!html) {
    if (strip) strip.remove();
    return;
  }
  if (strip) {
    strip.outerHTML = html;
  } else {
    const title = stage.querySelector(".flow-title");
    const host = document.getElementById("sliceCanvas");
    if (title) title.insertAdjacentHTML("afterend", html);
    else if (host) host.insertAdjacentHTML("beforebegin", html);
    else {
      const vp = stage.querySelector(".viewport");
      if (vp) vp.insertAdjacentHTML("afterbegin", html);
    }
  }
}


/** ADE MAC — members of Map-altitude bubbles (deduped). */
function mapAltitudeMemberNodes(bubbles) {
  const out = [];
  const seen = new Set();
  for (const b of bubbles || []) {
    for (const m of b.members || []) {
      const id = idVal(m);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const n = nodeById.get(id);
      if (n) out.push(n);
    }
  }
  return out;
}

/** ADE MAC — graph edges incident to Map-altitude members. */
function mapAltitudeMemberEdges(memberIds) {
  const want = new Set(memberIds || []);
  if (!want.size) return [];
  const edges = (snapshot && snapshot.graph && snapshot.graph.edges) || [];
  return edges.filter((e) => want.has(idVal(e.from)) || want.has(idVal(e.to)));
}

/** ADE MAC — CSS bar mix for Map altitude; max-scaled. */
function mapMixChartHtml(axis, map) {
  const entries = [...map.entries()].sort((a, b) => b[1] - a[1]);
  if (!entries.length) return "";
  const max = Math.max(1, ...entries.map((e) => e[1]));
  const bars = entries
    .map((e) => {
      const pct = Math.round((e[1] / max) * 100);
      const on = !!(
        mapMixFilter &&
        mapMixFilter.axis === axis &&
        mapMixFilter.value === e[0]
      );
      return (
        '<button type="button" class="mac-bar' +
        (on ? " on" : "") +
        '" data-mac-axis="' +
        esc(axis) +
        '" data-mac-value="' +
        esc(e[0]) +
        '" aria-pressed="' +
        (on ? "true" : "false") +
        '" title="' +
        esc(e[0]) +
        " · " +
        e[1] +
        '" style="--mac-pct:' +
        pct +
        '%"><span class="mac-fill" aria-hidden="true"></span><span class="mac-label"><b>' +
        esc(e[0]) +
        "</b> " +
        e[1] +
        "</span></button>"
      );
    })
    .join("");
  return (
    '<div class="mac-chart mac-chart--' +
    esc(axis) +
    '" role="group" aria-label="Map ' +
    esc(axis) +
    ' mix" data-mac-axis-group="' +
    esc(axis) +
    '">' +
    bars +
    "</div>"
  );
}

/** ADE MAC — strip above Map community cards. */
function mapMixStripHtml(bubbles) {
  const members = mapAltitudeMemberNodes(bubbles);
  const memberIds = members.map((n) => idVal(n.id));
  const kinds = countMap(members, (n) => n.kind);
  const hopEdges = mapAltitudeMemberEdges(memberIds);
  const hops = countMap(hopEdges, (e) => e.kind);
  if (!kinds.size && !hops.size) return "";
  return (
    '<div class="mac-strip" data-mac="1" role="group" aria-label="Map altitude community mix">' +
    (kinds.size
      ? '<span class="mac-stat"><i class="k">Kinds</i> <b class="n">' +
        members.length +
        "</b> " +
        mapMixChartHtml("kind", kinds) +
        "</span>"
      : "") +
    (hops.size
      ? '<span class="mac-stat"><i class="k">Hops</i> <b class="n">' +
        hopEdges.length +
        "</b> " +
        mapMixChartHtml("hop", hops) +
        "</span>"
      : "") +
    "</div>"
  );
}

function bubbleDominantKind(b) {
  const counts = new Map();
  for (const m of b.members || []) {
    const n = nodeById.get(idVal(m));
    if (!n) continue;
    const k = String(n.kind || "—");
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  let best = null;
  let bestN = -1;
  for (const [k, n] of counts) {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  return best;
}

function bubbleMatchesMapMix(b, filter) {
  if (!filter) return true;
  const members = (b.members || []).map((m) => idVal(m)).filter(Boolean);
  if (!members.length) return false;
  // Kind axis: dominant member kind (any-member match is universal on SolarSim).
  if (filter.axis === "kind") {
    return bubbleDominantKind(b) === String(filter.value);
  }
  if (filter.axis === "hop") {
    const want = new Set(members);
    const edges = (snapshot && snapshot.graph && snapshot.graph.edges) || [];
    return edges.some(
      (e) =>
        String(e.kind || "—") === String(filter.value) &&
        (want.has(idVal(e.from)) || want.has(idVal(e.to)))
    );
  }
  return true;
}

function toggleMapMixFilter(axis, value) {
  if (!axis || value == null || value === "") return;
  if (
    mapMixFilter &&
    mapMixFilter.axis === axis &&
    mapMixFilter.value === value
  ) {
    mapMixFilter = null;
  } else {
    mapMixFilter = { axis: String(axis), value: String(value) };
    if (mapSizeFilter) {
      mapSizeFilter = null;
      applyMapSizePaint();
    }
    if (mapHopSizeFilter) {
      mapHopSizeFilter = null;
      applyMapHopSizePaint();
    }
  }
  applyMapMixPaint();
}

function applyMapMixPaint() {
  const filter = mapMixFilter;
  if (!canvas) return;
  canvas.querySelectorAll(".mac-bar[data-mac-axis][data-mac-value]").forEach((el) => {
    const on = !!(
      filter &&
      filter.axis === el.getAttribute("data-mac-axis") &&
      filter.value === el.getAttribute("data-mac-value")
    );
    el.classList.toggle("on", on);
    el.setAttribute("aria-pressed", on ? "true" : "false");
  });
  const host = canvas.querySelector(".comm-wrap") || canvas;
  host.classList.toggle("mac-filtering", !!filter);
  canvas.querySelectorAll(".bubble-card[data-bubble]").forEach((el) => {
    el.classList.remove("mac-hit", "mac-dim");
    if (!filter) return;
    const id = el.getAttribute("data-bubble");
    const bub = (mapAltitudeBubbles() || []).find((b) => idVal(b.id) === String(id));
    const match = !!(bub && bubbleMatchesMapMix(bub, filter));
    el.classList.toggle("mac-hit", match);
    el.classList.toggle("mac-dim", !match);
  });
}

function bindMapMixChart() {
  if (!canvas) return;
  canvas.querySelectorAll("[data-mac-axis][data-mac-value]").forEach((el) => {
    el.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      toggleMapMixFilter(el.getAttribute("data-mac-axis"), el.getAttribute("data-mac-value"));
    };
    el.onkeydown = (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      ev.stopPropagation();
      toggleMapMixFilter(el.getAttribute("data-mac-axis"), el.getAttribute("data-mac-value"));
    };
  });
}

function refreshMapMixStrip(bubbles) {
  if (!canvas) return;
  const stage = canvas.querySelector(".stage");
  if (!stage) return;
  const title = stage.querySelector(".flow-title");
  const html = mapMixStripHtml(bubbles);
  let strip = stage.querySelector(".mac-strip");
  if (!html) {
    if (strip) strip.remove();
    return;
  }
  if (strip) {
    strip.outerHTML = html;
  } else if (title) {
    title.insertAdjacentHTML("afterend", html);
  } else {
    stage.insertAdjacentHTML("afterbegin", html);
  }
}


/** ADE MCS — compact size bars for Map altitude bubbles (CSC parity; member counts). */
function mapSizeChartHtml(bubbles) {
  const entries = (bubbles || [])
    .map((b) => ({ id: idVal(b.id), label: shortOf(b.label) || "bubble", n: (b.members || []).length }))
    .filter((e) => e.id && e.n > 0)
    .sort((a, b) => b.n - a.n || String(a.label).localeCompare(String(b.label)))
    .slice(0, 12);
  if (!entries.length) return "";
  const max = Math.max(1, ...entries.map((e) => e.n));
  const bars = entries
    .map((e) => {
      const pct = Math.round((e.n / max) * 100);
      const on = !!(mapSizeFilter && String(mapSizeFilter) === String(e.id));
      return (
        '<button type="button" class="mcs-bar' +
        (on ? " on" : "") +
        '" data-mcs-bubble="' +
        esc(e.id) +
        '" aria-pressed="' +
        (on ? "true" : "false") +
        '" title="' +
        esc(e.label) +
        " · " +
        e.n +
        ' nodes" style="--mcs-pct:' +
        pct +
        '%"><span class="mcs-fill" aria-hidden="true"></span><span class="mcs-label"><b>' +
        esc(e.label) +
        "</b> " +
        e.n +
        "</span></button>"
      );
    })
    .join("");
  return (
    '<div class="mcs-chart" role="group" aria-label="Map community sizes" data-mcs-chart="1">' +
    bars +
    "</div>"
  );
}

/** ADE MCS — strip under MAC mix; Map-altitude community-size chart. */
function mapSizeStripHtml(bubbles) {
  const chart = mapSizeChartHtml(bubbles);
  if (!chart) return "";
  const n = (bubbles || []).filter((b) => (b.members || []).length > 0).length;
  return (
    '<div class="mcs-strip" data-mcs="1" role="group" aria-label="Map altitude community sizes">' +
    '<span class="mcs-stat"><i class="k">Sizes</i> <b class="n">' +
    n +
    "</b> " +
    chart +
    "</span></div>"
  );
}

function toggleMapSizeFilter(bubbleId) {
  if (!bubbleId) return;
  if (mapSizeFilter && String(mapSizeFilter) === String(bubbleId)) {
    mapSizeFilter = null;
  } else {
    mapSizeFilter = String(bubbleId);
    if (mapMixFilter) {
      mapMixFilter = null;
      applyMapMixPaint();
    }
    if (mapHopSizeFilter) {
      mapHopSizeFilter = null;
      applyMapHopSizePaint();
    }
  }
  applyMapSizePaint();
}

function applyMapSizePaint() {
  const filter = mapSizeFilter;
  if (!canvas) return;
  canvas.querySelectorAll(".mcs-bar[data-mcs-bubble]").forEach((el) => {
    const on = !!(filter && String(el.getAttribute("data-mcs-bubble")) === String(filter));
    el.classList.toggle("on", on);
    el.setAttribute("aria-pressed", on ? "true" : "false");
  });
  const host = canvas.querySelector(".comm-wrap") || canvas;
  host.classList.toggle("mcs-filtering", !!filter);
  canvas.querySelectorAll(".bubble-card[data-bubble]").forEach((el) => {
    el.classList.remove("mcs-hit", "mcs-dim");
    if (!filter) return;
    const match = String(el.getAttribute("data-bubble")) === String(filter);
    el.classList.toggle("mcs-hit", match);
    el.classList.toggle("mcs-dim", !match);
  });
}

function bindMapSizeChart() {
  if (!canvas) return;
  canvas.querySelectorAll("[data-mcs-bubble]").forEach((el) => {
    el.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      toggleMapSizeFilter(el.getAttribute("data-mcs-bubble"));
    };
    el.onkeydown = (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      ev.stopPropagation();
      toggleMapSizeFilter(el.getAttribute("data-mcs-bubble"));
    };
  });
}

function refreshMapSizeStrip(bubbles) {
  if (!canvas) return;
  const stage = canvas.querySelector(".stage");
  if (!stage) return;
  const html = mapSizeStripHtml(bubbles);
  let strip = stage.querySelector(".mcs-strip");
  if (!html) {
    if (strip) strip.remove();
    return;
  }
  if (strip) {
    strip.outerHTML = html;
  } else {
    const mac = stage.querySelector(".mac-strip");
    const title = stage.querySelector(".flow-title");
    if (mac) mac.insertAdjacentHTML("afterend", html);
    else if (title) title.insertAdjacentHTML("afterend", html);
    else stage.insertAdjacentHTML("afterbegin", html);
  }
}


/** ADE MHS — incident hop count for one Map-altitude bubble (member endpoints). */
function bubbleHopCount(b) {
  const members = (b && b.members) || [];
  const want = new Set(members.map((m) => idVal(m)).filter(Boolean));
  if (!want.size) return 0;
  const edges = (snapshot && snapshot.graph && snapshot.graph.edges) || [];
  let n = 0;
  for (const e of edges) {
    if (want.has(idVal(e.from)) || want.has(idVal(e.to))) n += 1;
  }
  return n;
}

/** ADE MHS — hop×size score bars (score = hops * members); answers large AND high-hop. */
function mapHopSizeChartHtml(bubbles) {
  const entries = (bubbles || [])
    .map((b) => {
      const id = idVal(b.id);
      const size = (b.members || []).length;
      const hops = bubbleHopCount(b);
      return {
        id,
        label: shortOf(b.label) || "bubble",
        size,
        hops,
        score: hops * size,
      };
    })
    .filter((e) => e.id && e.size > 0 && e.hops > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.hops - a.hops ||
        b.size - a.size ||
        String(a.label).localeCompare(String(b.label))
    )
    .slice(0, 12);
  if (!entries.length) return "";
  const max = Math.max(1, ...entries.map((e) => e.score));
  const bars = entries
    .map((e) => {
      const pct = Math.round((e.score / max) * 100);
      const on = !!(mapHopSizeFilter && String(mapHopSizeFilter) === String(e.id));
      return (
        '<button type="button" class="mhs-bar' +
        (on ? " on" : "") +
        '" data-mhs-bubble="' +
        esc(e.id) +
        '" aria-pressed="' +
        (on ? "true" : "false") +
        '" title="' +
        esc(e.label) +
        " · " +
        e.hops +
        " hops · " +
        e.size +
        ' nodes" style="--mhs-pct:' +
        pct +
        '%"><span class="mhs-fill" aria-hidden="true"></span><span class="mhs-label"><b>' +
        esc(e.label) +
        "</b> " +
        e.hops +
        "h·" +
        e.size +
        "n</span></button>"
      );
    })
    .join("");
  return (
    '<div class="mhs-chart" role="group" aria-label="Map community hop-size" data-mhs-chart="1">' +
    bars +
    "</div>"
  );
}

/** ADE MHS — strip under MCS; Map-altitude community hop×size chart. */
function mapHopSizeStripHtml(bubbles) {
  const chart = mapHopSizeChartHtml(bubbles);
  if (!chart) return "";
  const n = (bubbles || []).filter((b) => (b.members || []).length > 0 && bubbleHopCount(b) > 0).length;
  return (
    '<div class="mhs-strip" data-mhs="1" role="group" aria-label="Map altitude community hop-size">' +
    '<span class="mhs-stat"><i class="k">Hop×size</i> <b class="n">' +
    n +
    "</b> " +
    chart +
    "</span></div>"
  );
}

function toggleMapHopSizeFilter(bubbleId) {
  if (!bubbleId) return;
  if (mapHopSizeFilter && String(mapHopSizeFilter) === String(bubbleId)) {
    mapHopSizeFilter = null;
  } else {
    mapHopSizeFilter = String(bubbleId);
    if (mapMixFilter) {
      mapMixFilter = null;
      applyMapMixPaint();
    }
    if (mapSizeFilter) {
      mapSizeFilter = null;
      applyMapSizePaint();
    }
  }
  applyMapHopSizePaint();
}

function applyMapHopSizePaint() {
  const filter = mapHopSizeFilter;
  if (!canvas) return;
  canvas.querySelectorAll(".mhs-bar[data-mhs-bubble]").forEach((el) => {
    const on = !!(filter && String(el.getAttribute("data-mhs-bubble")) === String(filter));
    el.classList.toggle("on", on);
    el.setAttribute("aria-pressed", on ? "true" : "false");
  });
  const host = canvas.querySelector(".comm-wrap") || canvas;
  host.classList.toggle("mhs-filtering", !!filter);
  canvas.querySelectorAll(".bubble-card[data-bubble]").forEach((el) => {
    el.classList.remove("mhs-hit", "mhs-dim");
    if (!filter) return;
    const match = String(el.getAttribute("data-bubble")) === String(filter);
    el.classList.toggle("mhs-hit", match);
    el.classList.toggle("mhs-dim", !match);
  });
}

function bindMapHopSizeChart() {
  if (!canvas) return;
  canvas.querySelectorAll("[data-mhs-bubble]").forEach((el) => {
    el.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      toggleMapHopSizeFilter(el.getAttribute("data-mhs-bubble"));
    };
    el.onkeydown = (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      ev.stopPropagation();
      toggleMapHopSizeFilter(el.getAttribute("data-mhs-bubble"));
    };
  });
}

function refreshMapHopSizeStrip(bubbles) {
  if (!canvas) return;
  const stage = canvas.querySelector(".stage");
  if (!stage) return;
  const html = mapHopSizeStripHtml(bubbles);
  let strip = stage.querySelector(".mhs-strip");
  if (!html) {
    if (strip) strip.remove();
    return;
  }
  if (strip) {
    strip.outerHTML = html;
  } else {
    const mcs = stage.querySelector(".mcs-strip");
    const mac = stage.querySelector(".mac-strip");
    const title = stage.querySelector(".flow-title");
    if (mcs) mcs.insertAdjacentHTML("afterend", html);
    else if (mac) mac.insertAdjacentHTML("afterend", html);
    else if (title) title.insertAdjacentHTML("afterend", html);
    else stage.insertAdjacentHTML("afterbegin", html);
  }
}


/** ADE CSC — bar chart of community member counts (derived bubbles only). */
function communitySizeChartHtml(bubbles) {
  const entries = (bubbles || [])
    .map((b) => ({ id: idVal(b.id), label: shortOf(b.label) || "bubble", n: (b.members || []).length }))
    .filter((e) => e.id && e.n > 0)
    .sort((a, b) => b.n - a.n || String(a.label).localeCompare(String(b.label)))
    .slice(0, 12);
  if (!entries.length) return "";
  const max = Math.max(1, ...entries.map((e) => e.n));
  const bars = entries
    .map((e) => {
      const pct = Math.round((e.n / max) * 100);
      const on = !!(overviewCommunityFilter && String(overviewCommunityFilter) === String(e.id));
      return (
        '<button type="button" class="csc-bar' +
        (on ? " on" : "") +
        '" data-csc-bubble="' +
        esc(e.id) +
        '" aria-pressed="' +
        (on ? "true" : "false") +
        '" title="' +
        esc(e.label) +
        " · " +
        e.n +
        ' nodes" style="--csc-pct:' +
        pct +
        '%"><span class="csc-fill" aria-hidden="true"></span><span class="csc-label"><b>' +
        esc(e.label) +
        "</b> " +
        e.n +
        "</span></button>"
      );
    })
    .join("");
  return (
    '<div class="csc-chart" role="group" aria-label="Community sizes" data-csc="1">' +
    bars +
    "</div>"
  );
}

function toggleOverviewCommunityFilter(bubbleId) {
  if (!bubbleId) return;
  if (overviewCommunityFilter && String(overviewCommunityFilter) === String(bubbleId)) {
    overviewCommunityFilter = null;
  } else {
    overviewCommunityFilter = String(bubbleId);
    if (overviewMixFilter) {
      overviewMixFilter = null;
      applyOverviewMixPaint();
    }
  }
  applyOverviewCommunityPaint();
}

function applyOverviewCommunityPaint() {
  const host = document.getElementById("sliceCanvas");
  const filter = overviewCommunityFilter;
  if (canvas) {
    canvas.querySelectorAll("[data-csc-bubble]").forEach((el) => {
      const on = !!(filter && String(el.getAttribute("data-csc-bubble")) === String(filter));
      el.classList.toggle("on", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
    canvas.querySelectorAll(".expl-card[data-bubble][data-csc-card]").forEach((el) => {
      el.classList.remove("csc-hit", "csc-dim");
      if (!filter) return;
      const match = String(el.getAttribute("data-bubble")) === String(filter);
      el.classList.toggle("csc-hit", match);
      el.classList.toggle("csc-dim", !match);
    });
  }
  if (!host) return;
  host.classList.toggle("csc-filtering", !!filter);
  const nodes = host.querySelectorAll(".vnode");
  const edges = host.querySelectorAll(".react-flow__edge");
  nodes.forEach((el) => el.classList.remove("csc-hit", "csc-dim"));
  edges.forEach((el) => el.classList.remove("csc-hit", "csc-dim"));
  if (!filter) return;
  const bub = findBubble(filter);
  const members = new Set((bub && bub.members ? bub.members : []).map((m) => String(idVal(m))));
  const hot = new Set();
  nodes.forEach((el) => {
    const id = el.getAttribute("data-id") || "";
    const match = members.has(String(id));
    el.classList.toggle("csc-hit", match);
    el.classList.toggle("csc-dim", !match);
    if (match) hot.add(id);
  });
  edges.forEach((el) => {
    const a = el.getAttribute("data-from") || "";
    const b = el.getAttribute("data-to") || "";
    const match = !!(hot.has(a) || hot.has(b));
    el.classList.toggle("csc-hit", match);
    el.classList.toggle("csc-dim", !match);
  });
}

function bindOverviewCommunityChart() {
  if (!canvas) return;
  canvas.querySelectorAll("[data-csc-bubble]").forEach((el) => {
    el.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      toggleOverviewCommunityFilter(el.getAttribute("data-csc-bubble"));
    };
    el.onkeydown = (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      ev.stopPropagation();
      toggleOverviewCommunityFilter(el.getAttribute("data-csc-bubble"));
    };
  });
}

function renderExplorerList(ws, opts) {
  const keepCam = !!(opts && opts.keepCam);
  renderTabs(snapshot.flows || [], currentFlow() && currentFlow().name);
  renderStats(snapshot);
  if (ws === "overview") renderLegend();
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
    delta: "Delta — derived parent vs head",
    sequence: "Sequence — callers, callees, returns on this flow",
    dataflow: "Data-flow — sources, transforms, stores, sinks on this flow",
    lifecycle: "Lifecycle — review states, waits, terminals on this flow",
    trace: "Trace — read-only execution trajectory DAG",
    passport: "Passport — Plan Passport sign-off before agent writes",
  };
  setMeta(
    '<span class="crumb">Review</span> / <b>' +
    esc(ws) +
    "</b> · " +
    esc(titles[ws] || ws)
  );
  if (ws === "sequence") {
    paintSequenceWorkspace(titles.sequence);
    bindWorkbenchPages();
    bindSequencePage();
    applyProbePaint();
    return;
  }
  if (ws === "delta") {
    paintDeltaWorkspace(titles.delta);
    bindWorkbenchPages();
    bindDeltaPage();
    applyProbePaint();
    return;
  }
  if (ws === "dataflow") {
    paintDataflowWorkspace(titles.dataflow);
    bindWorkbenchPages();
    bindDataflowPage();
    applyProbePaint();
    return;
  }
  if (ws === "lifecycle") {
    paintLifecycleWorkspace(titles.lifecycle);
    bindWorkbenchPages();
    bindLifecyclePage();
    applyProbePaint();
    return;
  }
  if (ws === "trace") {
    paintTrajectoryWorkspace(titles.trace);
    bindWorkbenchPages();
    bindTrajectoryPage();
    applyProbePaint();
    return;
  }
  if (ws === "passport") {
    paintPassportWorkspace(titles.passport);
    bindWorkbenchPages();
    bindPassportPage();
    applyProbePaint();
    return;
  }
  if (ws !== "overview") {
    unmountAllReviewCanvases();
  }
  let html = "";
  if (ws === "overview") html = renderOverviewBody();
  else if (ws === "decisions") html = renderDecisionBody();
  else if (ws === "registry") html = renderRegistryBody();
  else html = renderTimelineBody();
  canvas.className = ws === "overview" ? "play has-stage explorer-list" : "play explorer-list";
  if (ws === "overview") {
    const key = sliceWorkspaceKey();
    const keep = !!(
      canvas.querySelector("#sliceCanvas") &&
      key === sliceBodyKey &&
      canvas.querySelector(".expl-wrap")
    );
    if (!keep) {
      unmountReviewCanvas();
      canvas.innerHTML = '<div class="expl-wrap"><div class="flow-title">' + esc(titles[ws] || ws) + "</div>" + html + "</div>";
      sliceBodyKey = document.getElementById("sliceCanvas") ? key : "";
    }
  } else {
    canvas.innerHTML = '<div class="expl-wrap"><div class="flow-title">' + esc(titles[ws] || ws) + "</div>" + html + "</div>";
  }
  if (ws === "overview") {
    const stage = canvas.querySelector(".stage");
    if (stage) {
      // S1z — keepCam on Evidence soft-stay hops (no bindStage cam wipe).
      bindStage(stage, { reset: !keepCam });
      setZoomUi(true);
    } else {
      setZoomUi(false);
    }
    const flow = defaultRunFlow();
    mountSliceCanvas(flow, snapshot.graph, scarSet(snapshot.findings, flow && flow.name));
    bindOverviewMixChart();
    applyOverviewMixPaint();
    bindOverviewCommunityChart();
    applyOverviewCommunityPaint();
    bindCallPathStrip();
    applyCallPathPaint();
    bindGraphFx();
    applyEgoPaint();
    const treeIds = ((flow && flow.tree && flow.tree.nodes) || []).map((id) => nodeById.get(idVal(id)) || { id, kind: kindOf(snapshot.graph, id), fqn: fqnOf(snapshot.graph, id) });
    if (treeIds.length) renderLedger(treeIds, { selected: selectedNodeId, onTree: new Set((flow.tree.nodes || []).map(idVal)) });
    setLedgerHead("RUN");
  }
  canvas.querySelectorAll("[data-decision]").forEach((el) => {
    el.onclick = () => {
      selectedDecisionKey = el.getAttribute("data-decision") || "";
      paint({ animate: "none" });
    };
  });
  canvas.querySelectorAll("[data-open-slice]").forEach((el) => {
    el.onclick = (ev) => {
      ev.stopPropagation();
      const name = el.getAttribute("data-open-slice");
      if (!name) return;
      explorerWs = "slice";
      explorerPinned = true;
      selectFlow(name);
    };
  });
  canvas.querySelectorAll(".chain-step[data-from][data-to]").forEach((el) => {
    el.onclick = (ev) => {
      ev.stopPropagation();
      showHop(el.getAttribute("data-from"), el.getAttribute("data-to"), el.getAttribute("data-kind"));
    };
  });
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
    if (el.closest("#sliceCanvas, #deltaCanvas, #dfCanvas, #lcCanvas, #seqCanvas, #lineageCanvas, #enterCanvas, #trajCanvas")) return;
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
  canvas.querySelectorAll("[data-feature]").forEach((el) => {
    el.onclick = () => {
      stopPathWalk();
      selectedNodeId = null;
      explorerWs = "map";
      explorerPinned = true;
      enterMapBubble(el.getAttribute("data-feature"));
    };
  });
  canvas.querySelectorAll(".feature-path [data-hop]").forEach((el) => {
    el.onclick = () => {
      stopPathWalk();
      const id = el.getAttribute("data-hop");
      const stops = pathWalkStops();
      const idx = stops.findIndex((s) => idVal(s.id) === idVal(id));
      if (idx >= 0) pathWalk.i = idx;
      applyPathWalkPaint();
      focusWalkStop(stops[idx] || { id: id, kind: "hop" });
    };
  });
  bindPathWalk();
  bindWorkbenchPages();
  if (ws === "delta") bindDeltaPage();
  if (ws === "dataflow") bindDataflowPage();
  if (ws === "lifecycle") bindLifecyclePage();
  applyProbePaint();
}

function applyDecisionOutcomeFilter() {
  applyDecisionListFilters();
}

/** ADE DAM + outcome strip — hide non-matching Decision cards. */
function applyDecisionListFilters() {
  if (!canvas) return;
  canvas.querySelectorAll(".expl-card[data-decision]").forEach((el) => {
    const out = el.getAttribute("data-outcome") || "";
    const bucket = el.getAttribute("data-attest") || "";
    const outcomeOff = !!(decisionOutcomeFilter && out !== decisionOutcomeFilter);
    const attestOff = !!(decisionAttestFilter && bucket !== decisionAttestFilter);
    el.classList.toggle("off", outcomeOff || attestOff);
    el.classList.toggle("dam-hit", !!(decisionAttestFilter && bucket === decisionAttestFilter));
    el.classList.toggle("dam-dim", !!(decisionAttestFilter && bucket !== decisionAttestFilter));
  });
  canvas.querySelectorAll("[data-outcome-filter]").forEach((el) => {
    el.classList.toggle("on", (el.getAttribute("data-outcome-filter") || "") === decisionOutcomeFilter);
  });
  syncDecisionAttestBars();
}

function applyTimelineScrub() {
  const items = [...canvas.querySelectorAll(".tl-item")];
  items.forEach((el, i) => {
    const t = parseInt(el.getAttribute("data-t"), 10);
    const idx = Number.isFinite(t) ? t : i;
    el.classList.toggle("now", idx === timelineCursor);
    el.classList.toggle("past", idx < timelineCursor);
    el.classList.toggle("ahead", idx > timelineCursor);
  });
  const scrub = document.getElementById("tlScrub");
  if (scrub) scrub.value = String(timelineCursor);
  const metaEl = document.getElementById("tlScrubMeta");
  const now = items[timelineCursor];
  if (metaEl && now) {
    const title = ((now.querySelector(".t") || {}).textContent || "event").trim();
    metaEl.textContent = "t" + timelineCursor + " · " + title;
  }
}

function bindWorkbenchPages() {
  applyDecisionListFilters();
  bindDecisionAttestChart();
  canvas.querySelectorAll("[data-outcome-filter]").forEach((el) => {
    el.onclick = (ev) => {
      ev.stopPropagation();
      decisionOutcomeFilter = el.getAttribute("data-outcome-filter") || "";
      applyDecisionListFilters();
    };
  });
  const scrub = document.getElementById("tlScrub");
  if (scrub) {
    scrub.oninput = () => {
      timelineCursor = parseInt(scrub.value, 10) || 0;
      applyTimelineScrub();
    };
  }
  canvas.querySelectorAll(".tl-item").forEach((el) => {
    el.addEventListener("click", () => {
      const t = parseInt(el.getAttribute("data-t"), 10);
      if (Number.isFinite(t)) timelineCursor = t;
      applyTimelineScrub();
    });
  });
  const draftBtn = document.getElementById("draftHintBtn");
  if (draftBtn) {
    draftBtn.onclick = (ev) => {
      ev.stopPropagation();
      copyDraftHint();
    };
  }
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
  const path = featurePath(storyFlow());
  const pathRank = new Map(path.map((b, i) => [idVal(b.id), i]));
  const comms = bubbles
    .filter((b) => !q || String(b.label || "").toLowerCase().includes(q))
    .sort((a, b) => {
      const pa = pathRank.has(idVal(a.id)) ? pathRank.get(idVal(a.id)) : 1000;
      const pb = pathRank.has(idVal(b.id)) ? pathRank.get(idVal(b.id)) : 1000;
      if (pa !== pb) return pa - pb;
      return (b.members || []).length - (a.members || []).length;
    })
    .slice(0, 8);
  return (
    renderFeaturePathHtml() +
    renderDefaultCfg() +
    '<div class="stat-strip">' +
    '<span class="omc-stat"><i class="k">Nodes</i> <b class="n">' +
    nodes.length +
    "</b> " +
    statChips(kinds, "kind") +
    mixChartHtml("kind", kinds) +
    "</span>" +
    '<span class="omc-stat"><i class="k">Hops</i> <b class="n">' +
    edges.length +
    "</b> " +
    statChips(hops, "hop") +
    mixChartHtml("hop", hops) +
    "</span>" +
    '<span class="csc-stat"><i class="k">Communities</i> <b class="n">' +
    bubbles.length +
    '</b> <button type="button" class="crumb-btn" data-ws="map">Open map</button> ' +
    communitySizeChartHtml(bubbles) +
    "</span>" +
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
    '<div class="flow-title">Communities</div>' +
    '<div class="expl-list compact">' +
    comms
      .map((b) => {
        const marks = bubbleMarks(b);
        const step = pathRank.has(idVal(b.id)) ? pathRank.get(idVal(b.id)) : -1;
        const role = featureRole(step, path.length - 1);
        return (
          '<article class="expl-card" data-ws="map" data-csc-card="1" data-bubble="' +
          esc(idVal(b.id)) +
          '"><div class="k">community' +
          (role ? " · " + esc(role) : "") +
          '</div><div class="t">' +
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
    callPathStripHtml() +
    treeHtml +
    (runHtml ? '<div class="flow-title">Subsystem runs — click to enter</div>' + runHtml : "") +
    "</div></div>"
  );
}

function lineageWorkspaceKey(id, reading) {
  return [
    id || "",
    egoHops,
    (reading && reading.nodes && reading.nodes.length) || 0,
    (reading && reading.hops && reading.hops.length) || 0,
    graphFilter.q || "",
  ].join("\0");
}

/** ADE LBC — derived behavior caption for Lineage ego nodes (kind · role/channel · verb). */
function lineageBehaviorCaption(nid, hops, focusId) {
  const sid = idVal(nid);
  if (!sid) return "";
  const focus = idVal(focusId);
  let next = "";
  const list = hops || [];
  // Prefer hop toward / from focus so captions teach Used/Informed/Generated roles.
  for (const h of list) {
    const a = idVal(h.from);
    const b = idVal(h.to);
    if (a === sid && (!focus || b === focus || sid === focus)) {
      next = b;
      break;
    }
    if (b === sid && (!focus || a === focus || sid === focus)) {
      next = a;
      break;
    }
  }
  if (!next) {
    for (const h of list) {
      const a = idVal(h.from);
      const b = idVal(h.to);
      if (a === sid) {
        next = b;
        break;
      }
      if (b === sid) {
        next = a;
        break;
      }
    }
  }
  let cap = storyBehaviorCaption(sid, next);
  if (cap) return cap;
  const parts = [];
  const kind = kindOf(snapshot && snapshot.graph, sid);
  if (kind) parts.push(String(kind));
  const ep = endpointOf(sid);
  if (ep) {
    if (ep.role) parts.push(String(ep.role));
    if (ep.channel) parts.push(String(ep.channel));
  }
  if (next) {
    const verb = primaryIncidentVerb(sid, next);
    if (verb) parts.push(verb);
    else {
      for (const h of list) {
        if (idVal(h.from) === sid || idVal(h.to) === sid) {
          if (h.kind) {
            parts.push(String(h.kind));
            break;
          }
        }
      }
    }
  }
  return parts.join(" · ");
}

function lineageCanvasProps(reading, focusId) {
  const hops = (reading && reading.hops) || [];
  const hot = lineageHopCursor >= 0 ? hops[lineageHopCursor] : null;
  const hotIds = new Set();
  if (hot) {
    hotIds.add(String(hot.from));
    hotIds.add(String(hot.to));
  }
  const focus = focusId || lineageEgoId || "";
  const items = ((reading && reading.nodes) || []).map((n) => {
    const nid = n.id;
    const kind = kindOf(snapshot.graph, nid) || "Function";
    const fqn = fqnOf(snapshot.graph, nid);
    const flags = nodeFlags(nid);
    // ADE LBC — behavior caption (not file:line) on ego members.
    const caption = lineageBehaviorCaption(nid, hops, focus);
    return {
      id: nid,
      fqn,
      kind,
      kindClass: kindClass(kind),
      label: shortOf(fqn),
      kindLine: kindLine(nid, kind),
      side: n.side || "",
      hop: n.hop,
      focus: n.side === "focus",
      uncovered: !!flags.uncovered,
      changed: !!flags.changed,
      ...graphNodePaint(nid, { fqn, kind }),
      meta: caption,
      caption,
      lbcCaption: !!caption,
    };
  });
  return {
    nodes: items,
    hops: hops.map((h, i) => ({
      i,
      from: h.from,
      to: h.to,
      kind: h.kind || "",
      caption: lineageBehaviorCaption(h.dir === "out" || h.side === "down" ? h.from : h.to, hops, focus) || storyBehaviorCaption(h.from, h.to),
    })),
    cursor: lineageHopCursor,
    hotIds,
    onNodeClick: (nid) => {
      if (!nid) return;
      lineageHopCursor = -1;
      lineageEgoId = nid;
      // ADE LBC — ego browse stays graph-only (no peekSource / Evidence).
      selectNode(nid, { peek: false });
      paint({ animate: "none" });
    },
    onHopClick: (iOrHop) => {
      const hop = typeof iOrHop === "number" ? hops[iOrHop] : iOrHop;
      if (!hop) return;
      lineageHopCursor = typeof iOrHop === "number" ? iOrHop : hops.findIndex((h) => h.from === hop.from && h.to === hop.to && h.kind === hop.kind);
      showHop(hop.from, hop.to, hop.kind, { select: false });
      paint({ animate: "none" });
    },
  };
}

function mountLineageCanvas(reading, focusId) {
  const host = document.getElementById("lineageCanvas");
  if (!host) {
    unmountReviewCanvas();
    return;
  }
  renderLineageCanvas(host, lineageCanvasProps(reading, focusId));
  stampXyFlowAttrs();
}


/** ADE LFO — Used/Informed/Generated fan-size mix bars (member counts). */
function lineageFanChartHtml(buckets) {
  const order = [
    ["used", "Used"],
    ["informed", "Informed"],
    ["generated", "Generated"],
  ];
  const entries = order
    .map(([k, label]) => [k, label, (buckets[k] || []).length])
    .filter((e) => e[2] > 0);
  if (!entries.length) return "";
  const max = Math.max(1, ...entries.map((e) => e[2]));
  const bars = entries
    .map(([k, label, n]) => {
      const pct = Math.round((n / max) * 100);
      const on = !!(lineageFanFilter && String(lineageFanFilter) === String(k));
      return (
        '<button type="button" class="lfo-bar' +
        (on ? " on" : "") +
        '" data-lfo-kind="' +
        esc(k) +
        '" aria-pressed="' +
        (on ? "true" : "false") +
        '" title="' +
        esc(label) +
        " · " +
        n +
        '" style="--lfo-pct:' +
        pct +
        '%"><span class="lfo-fill" aria-hidden="true"></span><span class="lfo-label"><b>' +
        esc(label) +
        "</b> " +
        n +
        "</span></button>"
      );
    })
    .join("");
  return (
    '<div class="lfo-chart" role="group" aria-label="Lineage fan size mix bars" data-lfo-axis-group="fan">' +
    bars +
    "</div>"
  );
}

function lineageFanStripHtml(buckets) {
  const chart = lineageFanChartHtml(buckets);
  if (!chart) return "";
  const total = ["used", "informed", "generated"].reduce(
    (a, k) => a + ((buckets[k] || []).length),
    0
  );
  return (
    '<div class="lfo-strip" data-lfo="1" role="group" aria-label="Lineage fan size mix">' +
    '<span class="lfo-stat"><i class="k">Fan</i> <b class="n">' +
    total +
    "</b> " +
    chart +
    "</span></div>"
  );
}

function toggleLineageFanFilter(kind) {
  if (!kind) return;
  if (lineageFanFilter && String(lineageFanFilter) === String(kind)) lineageFanFilter = null;
  else lineageFanFilter = String(kind);
  applyLineageFanPaint();
  syncLineageFanBars();
}

function syncLineageFanBars() {
  if (!canvas) return;
  canvas.querySelectorAll(".lfo-bar[data-lfo-kind]").forEach((el) => {
    const k = el.getAttribute("data-lfo-kind") || "";
    const on = !!(lineageFanFilter && String(lineageFanFilter) === k);
    el.classList.toggle("on", on);
    el.setAttribute("aria-pressed", on ? "true" : "false");
  });
  const strip = canvas.querySelector(".lfo-strip");
  if (strip) strip.classList.toggle("lfo-filtering", !!lineageFanFilter);
  const row = canvas.querySelector(".prov-row");
  if (row) row.classList.toggle("lfo-filtering", !!lineageFanFilter);
  const hops = document.getElementById("lineageHops");
  if (hops) hops.classList.toggle("lfo-filtering", !!lineageFanFilter);
  const host = document.getElementById("lineageCanvas");
  if (host) host.classList.toggle("lfo-filtering", !!lineageFanFilter);
}

function bindLineageFanChart() {
  if (!canvas) return;
  canvas.querySelectorAll(".lfo-bar[data-lfo-kind]").forEach((el) => {
    el.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      toggleLineageFanFilter(el.getAttribute("data-lfo-kind"));
    };
    el.onkeydown = (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      ev.stopPropagation();
      toggleLineageFanFilter(el.getAttribute("data-lfo-kind"));
    };
  });
}

/** ADE LFO — filter provenance cards + ego canvas by Used/Informed/Generated. */
function applyLineageFanPaint() {
  if (!canvas || explorerWs !== "lineage") return;
  const filter = lineageFanFilter ? String(lineageFanFilter) : "";
  canvas.querySelectorAll(".prov-col[data-prov]").forEach((col) => {
    const kind = col.getAttribute("data-prov") || "";
    const hit = !!(filter && kind === filter);
    const dim = !!(filter && kind !== filter);
    col.classList.toggle("lfo-hit", hit);
    col.classList.toggle("lfo-dim", dim);
    col.classList.toggle("off", dim);
  });
  canvas.querySelectorAll(".expl-card.hop[data-kind], #lineageHops .expl-card.hop[data-kind]").forEach((el) => {
    const bucket = provBucket(el.getAttribute("data-kind") || "");
    const hit = !!(filter && bucket === filter);
    const dim = !!(filter && bucket !== filter);
    el.classList.toggle("lfo-hit", hit);
    el.classList.toggle("lfo-dim", dim);
    el.classList.toggle("off", dim);
  });
  // Canvas ego members: keep focus lit; neighbors lit only if they appear in filtered hops.
  const host = document.getElementById("lineageCanvas");
  const focus = lineageEgoId || "";
  let keep = new Set();
  if (filter) {
    canvas.querySelectorAll(".expl-card.hop[data-kind]").forEach((el) => {
      if (el.classList.contains("off")) return;
      const from = el.getAttribute("data-from") || "";
      const to = el.getAttribute("data-to") || "";
      if (from) keep.add(from);
      if (to) keep.add(to);
    });
    if (focus) keep.add(focus);
  }
  if (host) {
    host.querySelectorAll(".vnode[data-id], .ego-node[data-id]").forEach((el) => {
      const id = el.getAttribute("data-id") || "";
      const hit = !!(filter && keep.has(id));
      const dim = !!(filter && !keep.has(id));
      el.classList.toggle("lfo-hit", hit);
      el.classList.toggle("lfo-dim", dim);
      if (!filter) el.classList.remove("lfo-hit", "lfo-dim");
    });
    host.querySelectorAll(".react-flow__edge").forEach((el) => {
      if (!filter) {
        el.classList.remove("lfo-hit", "lfo-dim");
        return;
      }
      // edges: dim unless both ends kept — best-effort via data attrs when present
      const sid = el.getAttribute("data-from") || el.getAttribute("data-source") || "";
      const tid = el.getAttribute("data-to") || el.getAttribute("data-target") || "";
      const hit = !!(sid && tid && keep.has(sid) && keep.has(tid));
      el.classList.toggle("lfo-hit", hit);
      el.classList.toggle("lfo-dim", !hit);
    });
  }
  syncLineageFanBars();
  window.__graphideLineage = Object.assign({}, window.__graphideLineage || {}, {
    fan: filter || null,
  });
}

function renderLineage(opts) {
  const keepCam = !!(opts && opts.keepCam);
  renderTabs(snapshot.flows || [], currentFlow() && currentFlow().name);
  renderStats(snapshot);
  renderCoverage(snapshot.coverage, snapshot.findings, snapshot.graph);
  setGraphChrome(true);
  hideTip();
  if (stampBtn) stampBtn.disabled = !currentFlow();
  if (skipBtn) skipBtn.disabled = !currentFlow();
  if (!lineageEgoId || !nodeById.get(lineageEgoId)) lineageEgoId = lineageFocusId();
  const id = lineageEgoId;
  if (id && id !== selectedNodeId) selectedNodeId = id;
  if (!id) {
    unmountReviewCanvas();
    lineageBodyKey = "";
    setMeta('<span class="crumb">Review</span> / <b>lineage</b>');
    canvas.className = "play";
    canvas.innerHTML = '<div class="empty">Select a node on the map or slice to see its incident hops.</div>';
    setZoomUi(false);
    lineageFanFilter = null;
    window.__graphideLineage = { focus: "", nodes: 0, hops: 0, up: 0, down: 0, kinds: [], fan: null };
    return;
  }
  const node = nodeById.get(id);
  const reading = walkDirectedLineage(id, egoHops);
  const hops = reading.hops;
  const path = pathEnds.length === 2 ? shortestPath(pathEnds[0], pathEnds[1]) : [id];
  setMeta(
    '<span class="crumb">Review</span> / <button type="button" class="crumb-btn" data-ws="map">map</button> / <b>lineage</b> · ' +
    esc(shortOf((node && node.fqn) || id)) +
    " · " +
    hops.length +
    " incident hops" +
    (path.length > 1 ? " · path " + path.length : "")
  );
  const up = meta.querySelector("[data-ws]");
  if (up) up.onclick = () => setWorkspace("map", true);

  if (lineageHopCursor >= hops.length) lineageHopCursor = hops.length ? hops.length - 1 : -1;

  const hopCards = hops
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => {
      const fromN = nodeById.get(idVal(e.from));
      const toN = nodeById.get(idVal(e.to));
      return matchesExplorerQuery(
        [
          e.kind,
          e.from,
          e.to,
          fqnOf(snapshot.graph, e.from),
          fqnOf(snapshot.graph, e.to),
          (fromN && fromN.span && fromN.span.file) || "",
          (toN && toN.span && toN.span.file) || "",
        ].join(" ")
      );
    })
    .slice(0, 24)
    .map(({ e, i }) => {
    return (
      '<button type="button" class="expl-card hop' +
      (i === lineageHopCursor ? " on" : "") +
      '" data-from="' +
      esc(e.from) +
      '" data-to="' +
      esc(e.to) +
      '" data-kind="' +
      esc(e.kind) +
      '" data-dir="' +
      esc(e.dir || "") +
      '" data-lineage-i="' +
      i +
      '" data-lbc-caption="1"><div class="k">' +
      esc(e.kind) +
      " " +
      (e.dir === "out" ? "→" : "←") +
      '</div><div class="t">' +
      esc(shortOf(fqnOf(snapshot.graph, e.dir === "out" ? e.to : e.from))) +
      '</div><div class="b">' +
      esc(
        lineageBehaviorCaption(e.dir === "out" ? e.from : e.to, hops, id) ||
          storyBehaviorCaption(e.from, e.to) ||
          shortToken(e.from) + " → " + shortToken(e.to)
      ) +
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

  const buckets = { used: [], informed: [], generated: [] };
  hops.forEach((e) => {
    buckets[provBucket(e.kind)].push(e);
  });
  const provCol = (name, label, items) => {
    return (
      '<div class="prov-col" data-prov="' +
      name +
      '"><div class="k">' +
      label +
      "</div>" +
      (items.length
        ? items
            .map((e) => {
              const other = e.dir === "out" ? e.to : e.from;
              const cap =
                lineageBehaviorCaption(other, hops, id) ||
                storyBehaviorCaption(e.from, e.to) ||
                e.kind;
              return (
                '<button type="button" class="expl-card hop" data-from="' +
                esc(e.from) +
                '" data-to="' +
                esc(e.to) +
                '" data-kind="' +
                esc(e.kind) +
                '" data-lbc-caption="1"><div class="t">' +
                esc(shortOf(fqnOf(snapshot.graph, other))) +
                '</div><div class="b">' +
                esc(cap) +
                "</div></button>"
              );
            })
            .join("")
        : '<div class="empty">—</div>') +
      "</div>"
    );
  };

  const key = lineageWorkspaceKey(id, reading);
  const keep = !!(
    canvas.classList.contains("explorer-lineage") &&
    document.getElementById("lineageCanvas") &&
    key === lineageBodyKey
  );
  canvas.className = "play has-stage explorer-lineage";
  if (!keep) {
    unmountReviewCanvas();
    canvas.innerHTML =
      '<div class="stage"><div class="viewport" data-lod="0">' +
      '<div class="flow-title">Lineage · ego of ' +
      esc(shortOf((node && node.fqn) || id)) +
      " · " +
      egoHops +
      "-hop</div>" +
      pathRow +
      '<div id="lineageCanvas" class="lineage-canvas lineage-wrap"></div>' +
      lineageFanStripHtml(buckets) +
      '<div class="flow-title">Provenance on derived edges</div>' +
      '<div class="prov-row xy">' +
      provCol("used", "Used · Reads", buckets.used) +
      provCol("informed", "Informed · Calls", buckets.informed) +
      provCol("generated", "Generated · Writes", buckets.generated) +
      "</div>" +
      '<div class="flow-title">Incident hops</div>' +
      '<div class="expl-list compact hops" id="lineageHops">' +
      (hopCards.join("") || '<div class="empty">No incident hops on the derived graph.</div>') +
      "</div></div></div>";
    lineageBodyKey = document.getElementById("lineageCanvas") ? key : "";
    // S1z — keepCam on Evidence soft-stay hops (no bindStage cam wipe on full rebuild).
    bindStage(canvas.querySelector(".stage"), { reset: !keepCam });
  } else {
    const title = canvas.querySelector(".flow-title");
    if (title) {
      title.textContent =
        "Lineage · ego of " + shortOf((node && node.fqn) || id) + " · " + egoHops + "-hop";
    }
    const hopsEl = document.getElementById("lineageHops");
    if (hopsEl) hopsEl.innerHTML = hopCards.join("") || '<div class="empty">No incident hops on the derived graph.</div>';
    const pathEl = canvas.querySelector(".path-row");
    if (pathEl) pathEl.outerHTML = pathRow;
    bindStage(canvas.querySelector(".stage"), { reset: false });
  }
  setZoomUi(true);
  mountLineageCanvas(reading, id);
  canvas.querySelectorAll(".path-chip").forEach((el) => {
    const nid = el.getAttribute("data-id");
    if (!nid) return;
    el.onclick = (ev) => {
      ev.stopPropagation();
      lineageHopCursor = -1;
      lineageEgoId = nid;
      // ADE LBC — path chips stay graph-only (Evidence via object rail).
      selectNode(nid, { peek: false });
      paint({ animate: "none" });
    };
  });
  canvas.querySelectorAll(".expl-card.hop").forEach((el) => {
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const i = parseInt(el.getAttribute("data-lineage-i"), 10);
      if (Number.isFinite(i)) lineageHopCursor = i;
      showHop(el.getAttribute("data-from"), el.getAttribute("data-to"), el.getAttribute("data-kind"), { select: false });
      paint({ animate: "none" });
    });
  });
  const focusNodes = reading.nodes.map((n) => nodeById.get(n.id) || { id: n.id, kind: kindOf(snapshot.graph, n.id), fqn: fqnOf(snapshot.graph, n.id) });
  renderLedger(focusNodes, { selected: id });
  setLedgerHead("EGO");
  applyEgoPaint();
  applyGraphFilter();
  // ADE LBC — Lineage paint stays graph-only; Evidence opens from object rail.
  const upN = reading.nodes.filter((n) => n.side === "up").length;
  const downN = reading.nodes.filter((n) => n.side === "down").length;
  bindLineageFanChart();
  applyLineageFanPaint();
  window.__graphideLineage = {
    focus: id,
    fqn: (node && node.fqn) || "",
    kind: (node && node.kind) || kindOf(snapshot.graph, id),
    nodes: reading.nodes.length,
    hops: hops.length,
    fan: lineageFanFilter || null,
    up: upN,
    down: downN,
    kinds: hops.map((h) => h.kind),
  };
}

function renderProgramOverview(opts) {
  const programs = snapshot.programs || [];
  hideTip();
  if (stampBtn) stampBtn.disabled = true;
  if (skipBtn) skipBtn.disabled = true;
  if (progFocus >= programs.length) progFocus = 0;
  const filt = graphFilter.program ? esc(graphFilter.program.name) : "all";
  const bub = graphFilter.bubble
    ? mapAltitudeBubbles().find((b) => idVal(b.id) === String(graphFilter.bubble))
    : null;
  setGraphChrome(true);
  syncBackBtn();
  setLedgerHead("MAP");
  renderCommunityGraph(opts);
  renderTabs(snapshot.flows || [], null);
  renderStats(snapshot);
  renderCoverage(snapshot.coverage, snapshot.findings, snapshot.graph);
  setMeta(
    '<span class="crumb">Review</span> / <button type="button" class="crumb-btn" data-up="map">map</button>' +
    (bub ? " / <b>" + esc(bub.label || "bubble") + "</b>" : "") +
    " · " +
    filt +
    (bub
      ? " · click a node to inspect"
      : " · communities only — click a bubble, then a flow tab")
  );
  const up = meta.querySelector("[data-up=map]");
  if (up)
    up.onclick = () => {
      graphFilter.bubble = null;
      renderProgramOverview(opts);
    };
  renderLegend();
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

function readableEdgesAmong(ids) {
  const picked = new Set((ids || []).map((id) => idVal(id)));
  const byFrom = new Map();
  for (const e of (snapshot && snapshot.graph && snapshot.graph.edges) || []) {
    const a = idVal(e.from),
      b = idVal(e.to);
    if (!picked.has(a) || !picked.has(b) || a === b) continue;
    if (!byFrom.has(a)) byFrom.set(a, []);
    byFrom.get(a).push(e);
  }
  const out = [];
  for (const list of byFrom.values()) {
    list.sort((a, b) => kindWeight(b.kind || "Calls") - kindWeight(a.kind || "Calls"));
    out.push(...list.slice(0, 2));
  }
  return out;
}

function layoutCommunity(nodes) {
  const ids = (nodes || []).map((n) => idVal(n.id));
  return layeredPositions(ids, readableEdgesAmong(ids), {
    nodeW: 176,
    nodeH: 64,
    gapX: 72,
    gapY: 36,
    pad: 48,
    minW: 720,
    minH: 280,
    maxCols: 6,
    pins: pinsForCurrent(),
  });
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
    el.onclick = () => enterMapBubble(el.getAttribute("data-bubble"));
  });
}

function renderCommunityGraph(opts) {
  graphFilter.bubble = null;
  unmountReviewCanvas();
  enterBodyKey = "";
  renderBubbleMap(mapAltitudeBubbles(), opts);
}

function mapFlowTitle(pathIds) {
  return pathIds && pathIds.length
    ? "Start → features → end — control-flow through communities. Drag to rearrange, Reorganize to auto-layout. zoom in to peek members, click to enter"
    : "Community flow — drag to rearrange, Reorganize to auto-layout. zoom in to peek members, click to enter";
}

function commEdgeKey(from, to, kind) {
  return idVal(from) + "\0" + idVal(to) + "\0" + (kind || "Calls");
}

function recycleStoryRail() {
  const html = renderStoryRailHtml();
  const existing = canvas.querySelector("#storyRail");
  if (!html) {
    if (existing) existing.remove();
    return;
  }
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const next = tmp.firstElementChild;
  if (!next) return;
  if (existing) existing.replaceWith(next);
  else {
    const stage = canvas.querySelector(".stage");
    if (stage) canvas.insertBefore(next, stage);
    else canvas.insertAdjacentElement("afterbegin", next);
  }
}

function bindBubbleCardHot(el) {
  if (!el || el.dataset.hotBound) return;
  el.dataset.hotBound = "1";
  el.addEventListener("pointerenter", () => {
    const id = el.getAttribute("data-bubble");
    canvas.querySelectorAll(".comm-edges path").forEach((p) => {
      p.classList.toggle("hot", p.getAttribute("data-from") === id || p.getAttribute("data-to") === id);
    });
  });
  el.addEventListener("pointerleave", () => {
    canvas.querySelectorAll(".comm-edges path.hot").forEach((p) => p.classList.remove("hot"));
  });
}

function tileKind(role, id) {
  if (role === "START") return "entry";
  if (role === "END") return "exit";
  if (role && String(role).indexOf("STEP") === 0) return "mid";
  let h = 0;
  const s = String(id || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return ["core", "shallow", "high", "mid"][Math.abs(h) % 4];
}

function tileSvg(kind) {
  const inner = {
    entry: '<path d="M1.6 12.6 5.6 6.6 8 9.4 11.2 5l3.2 7.6z"/>',
    exit: '<circle cx="8" cy="8" r="5.2"/><path d="M5.1 8.2 7.2 10.3 11 5.8"/>',
    mid: '<rect x="3" y="3.2" width="10" height="2.6" rx="0.7"/><rect x="3" y="6.7" width="10" height="2.6" rx="0.7"/><rect x="3" y="10.2" width="10" height="2.6" rx="0.7"/>',
    core: '<circle cx="8" cy="3.6" r="1.35"/><circle cx="3.6" cy="12.1" r="1.35"/><circle cx="12.4" cy="12.1" r="1.35"/><path d="M8 5v2.2L4.5 10.8M8 7.2l3.5 3.6"/>',
    shallow: '<path d="M2 6.6q2-2 4 0t4 0 4 0"/><path d="M2 9.6q2-2 4 0t4 0 4 0"/><path d="M2 12.6q2-2 4 0t4 0 4 0"/>',
    high: '<path d="M8 3.2v9.6"/><path d="M4.2 7 8 3.2 11.8 7"/>',
  }[kind] || '<circle cx="8" cy="8" r="3.2"/>';
  return (
    '<svg class="tile-ico" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    inner +
    "</svg>"
  );
}

function bubbleCardInnerHtml(b, role, n, marks) {
  const tile = tileKind(role, b && b.id);
  return (
    '<span class="tile" data-tile="' +
    tile +
    '" aria-hidden="true">' +
    tileSvg(tile) +
    "</span>" +
    '<span class="card-copy">' +
    (role ? '<span class="role">' + esc(role) + "</span>" : "") +
    '<span class="name">' +
    esc(shortOf(b.label) || "bubble") +
    '</span><span class="meta">' +
    (role ? role + " · " : "") +
    n +
    (n === 1 ? " node" : " nodes") +
    (marks.uncovered ? " · " + marks.uncovered + " unc." : "") +
    (marks.onTree ? " · " + marks.onTree + " on tree" : "") +
    "</span>" +
    bubbleMemberChips(b, 4) +
    "</span>" +
    '<span class="n">' +
    n +
    "</span>"
  );
}

function applyBubbleCardEl(el, b, id, p, pathRank, path, pathIds) {
  const n = (b.members || []).length;
  const marks = bubbleMarks(b);
  const step = pathRank.has(id) ? pathRank.get(id) : -1;
  const role = featureRole(step, path.length - 1) || (pathIds.length ? "off path" : "");
  const roleClass = step === 0 ? " start" : step === path.length - 1 && path.length > 1 ? " end" : role === "off path" ? " off" : "";
  const here = graphFilter.bubble && idVal(id) === idVal(graphFilter.bubble) ? " here" : "";
  const clusterKind = ((snapshot && snapshot.delta && snapshot.delta.cluster_facts) || []).find(
    (c) => String(c.bubble) === String(id)
  );
  el.className = "bubble-card" + roleClass + here;
  el.style.left = p.x + "px";
  el.style.top = p.y + "px";
  el.style.setProperty("--c", colorOfBubble(b));
  el.setAttribute("data-bubble", id);
  if (clusterKind) el.setAttribute("data-cluster", clusterKind.kind || "");
  else el.removeAttribute("data-cluster");
  el.innerHTML = bubbleCardInnerHtml(b, role, n, marks);
}

function recycleBubbleCards(wrap, clusters, pos, pathRank, path, pathIds) {
  const byId = new Map(clusters.map((b) => [idVal(b.id), b]));
  const want = new Set();
  const existing = new Map();
  wrap.querySelectorAll(".bubble-card[data-bubble]").forEach((el) => {
    existing.set(el.getAttribute("data-bubble"), el);
  });
  for (const id of clusters.map((b) => idVal(b.id))) {
    want.add(id);
    const b = byId.get(id);
    const p = pos.get(id);
    if (!b || !p) continue;
    let el = existing.get(id);
    if (!el) {
      el = document.createElement("button");
      el.type = "button";
      wrap.appendChild(el);
    }
    applyBubbleCardEl(el, b, id, p, pathRank, path, pathIds);
  }
  for (const [id, el] of existing) {
    if (!want.has(id)) el.remove();
  }
}

function recycleCommEdges(svg, edges, pos, W, H) {
  if (!svg) return;
  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  svg.setAttribute("width", String(W));
  svg.setAttribute("height", String(H));
  const want = [];
  for (const e of edges || []) {
    const a = pos.get ? pos.get(idVal(e.from)) : pos[idVal(e.from)];
    const b = pos.get ? pos.get(idVal(e.to)) : pos[idVal(e.to)];
    if (!a || !b) continue;
        want.push({
          from: idVal(e.from),
          to: idVal(e.to),
          kind: e.kind || "Calls",
          hopFrom: e.hopFrom,
          hopTo: e.hopTo,
          a,
          b,
          count: e.count,
        });
  }
  const wantKeys = new Set(want.map((e) => commEdgeKey(e.from, e.to, e.kind)));
  const groups = new Map();
  [...svg.children].forEach((el) => {
    const k = commEdgeKey(el.getAttribute("data-from"), el.getAttribute("data-to"), el.getAttribute("data-kind"));
    if (!wantKeys.has(k)) {
      el.remove();
      return;
    }
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(el);
  });
  for (const e of want) {
    const k = commEdgeKey(e.from, e.to, e.kind);
    const d = orthoPath(e.a, e.b);
    const mx = Math.round((e.a.x + e.b.x) / 2);
    const my = Math.round((e.a.y + e.b.y) / 2) - 10;
    const els = groups.get(k) || [];
    if (!els.length) {
      const hit = document.createElementNS("http://www.w3.org/2000/svg", "path");
      hit.setAttribute("class", "edge-hit");
      hit.setAttribute("data-from", e.from);
      hit.setAttribute("data-to", e.to);
      hit.setAttribute("data-kind", e.kind);
      stampHopEnds(hit, e);
      hit.setAttribute("d", d);
      const vis = document.createElementNS("http://www.w3.org/2000/svg", "path");
      vis.setAttribute("data-from", e.from);
      vis.setAttribute("data-to", e.to);
      vis.setAttribute("data-kind", e.kind);
      stampHopEnds(vis, e);
      vis.setAttribute("d", d);
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("class", "ekind");
      text.setAttribute("x", String(mx));
      text.setAttribute("y", String(my));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("data-from", e.from);
      text.setAttribute("data-to", e.to);
      text.setAttribute("data-kind", e.kind);
      stampHopEnds(text, e);
      text.textContent = e.kind + (e.count > 1 ? " · " + e.count : "");
      svg.appendChild(hit);
      svg.appendChild(vis);
      svg.appendChild(text);
      continue;
    }
    els.forEach((el) => {
      stampHopEnds(el, e);
      if (el.tagName === "path") el.setAttribute("d", d);
      if (el.tagName === "text") {
        el.setAttribute("x", String(mx));
        el.setAttribute("y", String(my));
        el.textContent = e.kind + (e.count > 1 ? " · " + e.count : "");
      }
    });
  }
}

function recycleBubbleMap(clusters, ids, pathIds, edges, laid, pathRank, path) {
  const { W, H, pos } = laid;
  recycleStoryRail();
  const stage = canvas.querySelector(".stage");
  const title = stage && stage.querySelector(".flow-title");
  if (title) title.textContent = mapFlowTitle(pathIds);
  const wrap = canvas.querySelector(".comm-wrap");
  if (!wrap) return;
  wrap.style.width = W + "px";
  wrap.style.height = H + "px";
  let svg = wrap.querySelector("svg.comm-edges");
  if (!svg) {
    wrap.insertAdjacentHTML("afterbegin", edgeSvg("comm-edges", edges, pos, W, H));
    svg = wrap.querySelector("svg.comm-edges");
  } else {
    recycleCommEdges(svg, edges, pos, W, H);
  }
  recycleBubbleCards(wrap, clusters, pos, pathRank, path, pathIds);
  const vp = stage && stage.querySelector(".viewport");
  pinMapCommunityLod(vp);
}

function renderBubbleMap(clusters, opts) {
  const path = storyMapBubbles();
  const pathRank = new Map(path.map((b, i) => [idVal(b.id), i]));
  const seenBubble = new Set();
  clusters = pinStoryClusters(clusters || [])
    .slice()
    .filter((b) => {
      const id = idVal(b.id);
      if (!id || seenBubble.has(id)) return false;
      seenBubble.add(id);
      return true;
    })
    .sort((a, b) => {
      const pa = pathRank.has(idVal(a.id)) ? pathRank.get(idVal(a.id)) : 1000;
      const pb = pathRank.has(idVal(b.id)) ? pathRank.get(idVal(b.id)) : 1000;
      if (pa !== pb) return pa - pb;
      return (b.members || []).length - (a.members || []).length;
    })
    .slice(0, 24);
  if (!clusters.length) {
    canvas.className = "play";
    canvas.innerHTML = '<div class="empty">No communities yet. Review again after clustering finishes.</div>';
    setZoomUi(false);
    return;
  }
  const ids = clusters.map((b) => idVal(b.id));
  const idSet = new Set(ids);
  const pathIds = path.map((b) => idVal(b.id)).filter((id) => idSet.has(id));
  const rest = ids.filter((id) => pathIds.indexOf(id) < 0);
  const pathEdges = [];
  for (let i = 0; i < pathIds.length - 1; i++) {
    pathEdges.push({ from: pathIds[i], to: pathIds[i + 1], kind: "Calls" });
  }
  const spine = storySpineEdges(pathIds);
  const layoutEdges = pathEdges.slice();
  if (pathIds.length && rest.length) {
    layoutEdges.push({ from: pathIds[pathIds.length - 1], to: rest[0], kind: "Contains" });
    for (let i = 0; i < rest.length - 1; i++) {
      layoutEdges.push({ from: rest[i], to: rest[i + 1], kind: "Contains" });
    }
  }
  const edges = pathIds.length >= 2 ? (spine.length ? spine : pathEdges) : communityEdgeList(clusters);
  const laid = layeredPositions(ids, pathIds.length >= 2 ? layoutEdges : edges, {
    nodeW: 220,
    nodeH: 160,
    gapX: 88,
    gapY: 72,
    pad: 64,
    minW: 640,
    minH: 340,
    maxCols: 6,
    pins: pinsForCurrent(),
  });
  const { W, H, pos } = laid;
  const recycle = mapStageMounted();
  canvas.className = "play has-stage programs-view";
  if (recycle) {
    recycleBubbleMap(clusters, ids, pathIds, edges, laid, pathRank, path);
    refreshMapMixStrip(clusters);
    refreshMapSizeStrip(clusters);
    refreshMapHopSizeStrip(clusters);
    bindStage(canvas.querySelector(".stage"), { reset: false });
  } else {
    const byId = new Map(clusters.map((b) => [idVal(b.id), b]));
    let html = "";
    for (const id of ids) {
      const b = byId.get(id);
      const p = pos.get(id);
      if (!b || !p) continue;
      const n = (b.members || []).length;
      const marks = bubbleMarks(b);
      const step = pathRank.has(id) ? pathRank.get(id) : -1;
      const role = featureRole(step, path.length - 1) || (pathIds.length ? "off path" : "");
      const roleClass = step === 0 ? " start" : step === path.length - 1 && path.length > 1 ? " end" : role === "off path" ? " off" : "";
      const here = graphFilter.bubble && idVal(id) === idVal(graphFilter.bubble) ? " here" : "";
      const clusterKind = ((snapshot && snapshot.delta && snapshot.delta.cluster_facts) || []).find(
        (c) => String(c.bubble) === String(id)
      );
      html +=
        '<button type="button" class="bubble-card' +
        roleClass +
        here +
        '" style="left:' +
        p.x +
        "px;top:" +
        p.y +
        "px;--c:" +
        colorOfBubble(b) +
        '" data-bubble="' +
        id +
        '"' +
        (clusterKind ? ' data-cluster="' + esc(clusterKind.kind || "") + '"' : "") +
        ">" +
        bubbleCardInnerHtml(b, role, n, marks) +
        "</button>";
    }
    canvas.innerHTML =
      renderStoryRailHtml() +
      '<div class="stage">' +
      '<div class="flow-title">' +
      mapFlowTitle(pathIds) +
      "</div>" +
      mapMixStripHtml(clusters) +
      mapSizeStripHtml(clusters) +
      mapHopSizeStripHtml(clusters) +
      '<div class="viewport" data-lod="0">' +
      '<div class="comm-wrap" style="width:' +
      W +
      "px;height:" +
      H +
      'px">' +
      edgeSvg("comm-edges", edges, pos, W, H) +
      html +
      "</div></div></div>";
    bindStage(canvas.querySelector(".stage"), { reset: !(opts && opts.keepCam) });
  }
  pinMapCommunityLod(canvas.querySelector(".viewport"));
  setZoomUi(true);
  const wrap = canvas.querySelector(".comm-wrap");
  separatePaintedCards(wrap, ".bubble-card");
  canvas.querySelectorAll(".bubble-card").forEach((el) => bindBubbleCardHot(el));
  bindMapMixChart();
  applyMapMixPaint();
  bindMapSizeChart();
  applyMapSizePaint();
  bindMapHopSizeChart();
  applyMapHopSizePaint();
  if (typeof ensureFocusTrailChip === "function") ensureFocusTrailChip();
  if (typeof applyFocusTrailPaint === "function") applyFocusTrailPaint();
  bindDraggable(wrap, ".bubble-card", {
    idAttr: "data-bubble",
    onClick: (id, el, ev) => {
      if (ev && ev.shiftKey) {
        toggleFocusTrail(id);
        return;
      }
      selectedNodeId = null;
      enterMapBubble(id);
    },
  });
  bindHopClicks(canvas.querySelector("svg.comm-edges"));
  applyGraphFilter();
  queueOffviewSync();
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
  bindStoryRail();
  applyPathWalkPaint();
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
  canvas.querySelectorAll(".comm-node, .vnode, .ego-node").forEach((el) => {
    const kind = el.getAttribute("data-kind") || "";
    const match =
      graphFilter.kinds[kind] !== false &&
      (matchesExplorerQuery(
        [
          el.getAttribute("data-fqn") || "",
          el.getAttribute("data-file") || "",
          el.getAttribute("data-flow") || "",
          el.getAttribute("data-kind") || "",
          el.getAttribute("data-hops") || "",
        ].join(" ")
      ) || (el.getAttribute("data-leaf") === "0" && bubbleMembersMatchQuery(el.getAttribute("data-id"))));
    el.classList.toggle("dim", !match);
    el.classList.toggle("hit", !!(graphFilter.q && match));
  });
  canvas.querySelectorAll(".bubble-card").forEach((el) => {
    const name = (el.querySelector(".name") && el.querySelector(".name").textContent) || "";
    const match = matchesExplorerQuery(name) || bubbleMembersMatchQuery(el.getAttribute("data-bubble"));
    el.classList.toggle("dim", !match);
    el.classList.toggle("hit", !!(graphFilter.q && match));
  });
}

/** A community (Map card or Enter Type node) matches when a member's FQN / file does, so Find does not dim the one that holds the hit. */
function bubbleMembersMatchQuery(id) {
  if (!graphFilter.q || !id) return false;
  const b = findBubble(id);
  return ((b && b.members) || []).some((m) => {
    const n = nodeById.get(idVal(m));
    if (!n || graphFilter.kinds[n.kind || ""] === false) return false;
    return matchesExplorerQuery((n.fqn || "") + " " + ((n.span && n.span.file) || ""));
  });
}

function isProposedFlow(f) {
  return !!(f && (f.proposed || String(f.name || "").indexOf("proposed-uncovered") === 0));
}

function renderTabs(flows, current) {
  const m = reviewMarks();
  const head = m.names.length
    ? '<span class="queue-left' +
      (m.pending ? "" : " done") +
      '">' +
      (m.pending ? m.pending + " left" : "queue clear") +
      "</span>"
    : "";
  tabs.innerHTML =
    head +
    (flows || [])
    .map((f) => {
      const mark = flowMark(f.name);
      const proposed = isProposedFlow(f);
      return (
        '<button class="tab' +
        (f.name === current ? " on" : "") +
        (mark ? " " + mark : "") +
        (proposed ? " proposed" : "") +
        '" data-flow="' +
        esc(f.name) +
        '"' +
        (proposed ? ' data-proposed="1"' : "") +
        ">" +
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
  const list = (nodes || [])
    .filter((n) => {
      const id = idVal(n.id || n);
      const kind = n.kind || kindOf(snapshot && snapshot.graph, id);
      return graphFilter.kinds[kind] !== false;
    })
    .slice(0, 64);
  ledgerGrid.innerHTML = list
    .map((n) => {
      const id = idVal(n.id || n);
      const kind = n.kind || kindOf(snapshot && snapshot.graph, id);
      const flags = nodeFlags(id);
      const on = selected === id || flags.uncovered || (onTree && onTree.has(id));
      const name = shortOf(n.fqn || fqnOf(snapshot && snapshot.graph, id)) || shortToken(id);
      return (
        '<button type="button" class="cell dag ' +
        kindClass(kind) +
        (on ? " on" : "") +
        (flags.uncovered ? " uncovered" : "") +
        '" data-id="' +
        id +
        '"><span class="dag-k">' +
        esc(kind === "Type" ? "ty" : kind === "Endpoint" ? "ep" : "fn") +
        '</span><span class="dag-id">' +
        esc(name) +
        "</span></button>"
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
    setMeta("No proposed flows. Type a prompt or add <code>flows.toml</code>.");
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
  setMeta(crumb);
  const backToPrograms = meta.querySelector("[data-go=programs]");
  if (backToPrograms) backToPrograms.onclick = () => goBack();

  const playTree = animate === "all" || animate === "tree";
  const playRuns = animate === "all" || animate === "runs";
  const keepCam = !!(opts && opts.keepCam) || animate === "runs";
  const treeHtml = renderSteiner(flow, msg.graph, playTree, scarSet(msg.findings, flow.name));
  const runHtml = renderRuns(flow, msg, playRuns);
  const key = sliceWorkspaceKey();
  const recycle = sliceStageMounted() && key === sliceBodyKey;
  canvas.className = "play has-stage";
  if (recycle) {
    refreshSliceMixStrip(flow, msg.graph);
    const stage = canvas.querySelector(".stage .viewport") || canvas.querySelector(".stage");
    if (stage && !stage.querySelector(".cps-strip")) {
      const shm = stage.querySelector(".shm-strip");
      const html = callPathStripHtml();
      if (shm) shm.insertAdjacentHTML("afterend", html);
      else stage.insertAdjacentHTML("afterbegin", html);
    } else {
      syncCallPathStrip();
    }
    bindStage(canvas.querySelector(".stage"), { reset: false });
  } else {
    unmountReviewCanvas();
    enterBodyKey = "";
    canvas.innerHTML =
      renderStoryRailHtml() +
      '<div class="stage"><div class="viewport" data-lod="' +
      lodOf(cam.k) +
      '">' +
      '<div class="flow-title">Flow · Steiner — zoom out for runs, in for hops and source</div>' +
      sliceMixStripHtml(flow, msg.graph) +
      callPathStripHtml() +
      treeHtml +
      (runHtml
        ? '<div class="flow-title" style="margin-top:18px">Subsystem runs — click to enter</div>' + runHtml
        : preview
          ? '<div class="hint-live">Runs appear when clustering finishes</div>'
          : "") +
      "</div></div>";
    sliceBodyKey = document.getElementById("sliceCanvas") ? key : "";
    bindStage(canvas.querySelector(".stage"), { reset: !keepCam });
  }
  mountSliceCanvas(flow, msg.graph, scarSet(msg.findings, flow.name));
  bindSliceMixChart();
  applySliceMixPaint();
  if (typeof ensureFocusTrailChip === "function") ensureFocusTrailChip();
  if (typeof applyFocusTrailPaint === "function") applyFocusTrailPaint();
  bindCallPathStrip();
  applyCallPathPaint();
  bindGraphFx();
  setZoomUi(true);
  applyGraphFilter();
  setLedgerHead("SLICE");
  const treeIds = (flow.tree?.nodes || []).map((id) => nodeById.get(idVal(id)) || { id, kind: kindOf(msg.graph, id), fqn: fqnOf(msg.graph, id) });
  renderLedger(treeIds, { selected: selectedNodeId, onTree: new Set((flow.tree?.nodes || []).map(idVal)) });
  applyEgoPaint();
  bindStoryRail();
  applyPathWalkPaint();
  // S1x — Slice remount / recycle rebuilds vnodes while Evidence may stay open.
  // Re-seed soft stay + settle honesty; next flush repaints lineMap / active-line.
  if (typeof softStayScrollDriveAcrossDeskRemount === "function") {
    softStayScrollDriveAcrossDeskRemount();
  }
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

function sliceWorkspaceKey() {
  const flow = currentFlow() || defaultRunFlow();
  const tree = (flow && flow.tree) || { nodes: [], edges: [] };
  return [explorerWs, flow && flow.name, (tree.nodes || []).length, (tree.edges || []).length, graphFilter.q || ""].join("\0");
}

function enterWorkspaceKey(inner) {
  const nodes = ((inner && inner.nodes) || []).map((n) => String(idVal(n.id)));
  const top = stack[stack.length - 1];
  const bubble = top && top.kind === "bubble" ? String(top.bubble) : "";
  return ["enter", (inner && inner.flow) || "", String(bubble), nodes.join(",")].join("\0");
}

function sliceCanvasProps(flow, graph, scars) {
  const treeNodes = (flow && flow.tree && flow.tree.nodes) || [];
  const treeEdges = (flow && flow.tree && flow.tree.edges) || [];
  const snippets = (snapshot && snapshot.snippets) || {};
  const walk = flowWalk(flow);
  const dist = treeDistanceMap(flow, 1);
  const seen = new Set();
  const ids = [];
  for (const raw of treeNodes) {
    const id = String(idVal(raw));
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  const neighbors = [...dist.keys()]
    .filter((id) => !seen.has(id))
    .sort((a, b) => dist.get(a) - dist.get(b) || String(a).localeCompare(String(b)));
  for (const id of neighbors) {
    if (ids.length >= 48) break;
    seen.add(id);
    ids.push(id);
  }
  const items = ids.slice(0, 48).map((nid) => {
    const kind = kindOf(graph, nid) || "Function";
    const fqn = fqnOf(graph, nid);
    const node = nodeById.get(nid);
    const file = node && node.span ? node.span.file : "";
    const line = node && node.span && node.span.start ? node.span.start.line : "";
    const flags = nodeFlags(nid);
    const at = walk.indexOf(nid);
    const sliceDist = dist.has(nid) ? dist.get(nid) : 99;
    const onTree = sliceDist === 0;
    const steiner = onTree ? steinerOfWalk(walk, nid) : "";
    const hopRole = steiner === "start" ? "START · " : steiner === "end" ? "END · " : "";
    return {
      id: nid,
      fqn,
      kind,
      kindClass: kindClass(kind),
      label: shortOf(fqn),
      kindLine: hopRole + kindLine(nid, kind),
      steiner,
      where: file ? shortFile(file) + (line ? ":" + line : "") : "",
      file: file || "",
      snip: snippetPreview(snippets[nid]),
      away: nodeAway(nid),
      uncovered: !!flags.uncovered,
      changed: !!flags.changed,
      depth: onTree ? (at < 0 ? 0 : at) : sliceDist,
      flow: flow && flow.name ? flow.name : "",
      ...graphNodePaint(nid, { fqn, kind, file, flow: flow && flow.name ? flow.name : "" }),
      lit: onTree,
      grey: !onTree,
      sliceDim: !onTree,
      sliceDist,
    };
  });
  const idSet = new Set(items.map((n) => n.id));
  const hops = [];
  const hopSeen = new Set();
  const pushHop = (from, to, kind, scar) => {
    if (!idSet.has(from) || !idSet.has(to) || from === to) return;
    const key = from + "\t" + to + "\t" + (kind || "Calls");
    if (hopSeen.has(key)) return;
    hopSeen.add(key);
    hops.push({
      i: hops.length,
      from,
      to,
      kind: kind || "Calls",
      scar: !!scar,
    });
  };
  (treeEdges || []).forEach((e) => {
    const from = idVal(e.from);
    const to = idVal(e.to);
    const scar =
      scars &&
      (scars.has(fqnOf(graph, e.from) + ">" + fqnOf(graph, e.to)) || scars.has(fqnOf(graph, from) + ">" + fqnOf(graph, to)));
    pushHop(from, to, e.kind || "Calls", scar);
  });
  for (const e of (graph && graph.edges) || []) {
    if (hops.length >= 80) break;
    pushHop(idVal(e.from), idVal(e.to), e.kind || "Calls", false);
  }
  return {
    nodes: items,
    hops,
    embed: true,
    onNodeClick: (id) => {
      if (!id) return;
      selectNode(id);
    },
    onHopClick: (iOrHop) => {
      const hop = typeof iOrHop === "number" ? hops[iOrHop] : iOrHop;
      if (hop) showHop(hop.from, hop.to, hop.kind);
    },
  };
}

function mountSliceCanvas(flow, graph, scars) {
  const host = document.getElementById("sliceCanvas");
  if (!host || !flow) {
    if (!host) unmountReviewCanvas();
    return;
  }
  renderSliceCanvas(host, sliceCanvasProps(flow, graph, scars));
  stampXyFlowAttrs();
}

function renderSteiner(flow, graph, animate, scars) {
  const nodes = flow.tree?.nodes || [];
  if (!nodes.length) return '<div class="empty">Empty tree.</div>';
  return (
    '<div id="sliceCanvas" class="slice-canvas steiner-wrap' +
    (animate ? " play" : "") +
    '"></div>'
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
  for (const p of fc.positions || []) pos[idVal(p.run)] = { x: p.x, y: p.y };
  const pins = pinsForCurrent();
  for (const run of fc.runs || []) {
    const pin = pins.get(String(idVal(run.id)));
    if (pin) pos[idVal(run.id)] = { x: pin.x, y: pin.y };
  }
  let maxX = 200,
    maxY = 120;
  for (const p of Object.values(pos)) {
    maxX = Math.max(maxX, p.x + 240);
    maxY = Math.max(maxY, p.y + 120);
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
      '" data-run="' +
      idVal(run.id) +
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

function enterEdgesAmong(nodes) {
  // Shown child ids are bubble ids. Graph hops use member ids.
  const shown = new Map();
  for (const n of nodes || []) {
    const id = String(idVal(n.id));
    shown.set(id, id);
    for (const m of n.members || []) shown.set(String(idVal(m)), id);
  }
  const hops = [];
  const seen = new Set();
  for (const e of (snapshot && snapshot.graph && snapshot.graph.edges) || []) {
    const from = shown.get(String(idVal(e.from)));
    const to = shown.get(String(idVal(e.to)));
    if (!from || !to || from === to) continue;
    const kind = e.kind || "Calls";
    const key = from + "\t" + to + "\t" + kind;
    if (seen.has(key)) continue;
    seen.add(key);
    hops.push({
      i: hops.length,
      from,
      to,
      kind,
      hopFrom: String(idVal(e.from)),
      hopTo: String(idVal(e.to)),
    });
    if (hops.length >= 80) break;
  }
  return hops;
}

/** ADE MBE — derived behavior caption for Map enter members (kind · role/channel · verb). */
function enterBehaviorCaption(nid, hops, kindHint) {
  const sid = idVal(nid);
  if (!sid) return "";
  let next = "";
  for (const h of hops || []) {
    if (idVal(h.from) === sid || idVal(h.hopFrom) === sid) {
      next = idVal(h.hopTo || h.to);
      break;
    }
  }
  if (!next) {
    for (const h of hops || []) {
      if (idVal(h.to) === sid || idVal(h.hopTo) === sid) {
        next = idVal(h.hopFrom || h.from);
        break;
      }
    }
  }
  let cap = storyBehaviorCaption(sid, next);
  if (cap) return cap;
  const parts = [];
  if (kindHint) parts.push(String(kindHint));
  const ep = endpointOf(sid);
  if (ep) {
    if (ep.role) parts.push(String(ep.role));
    if (ep.channel) parts.push(String(ep.channel));
  }
  if (next) {
    const verb = primaryIncidentVerb(sid, next);
    if (verb) parts.push(verb);
    else {
      for (const h of hops || []) {
        if (
          idVal(h.from) === sid ||
          idVal(h.hopFrom) === sid ||
          idVal(h.to) === sid ||
          idVal(h.hopTo) === sid
        ) {
          if (h.kind) {
            parts.push(String(h.kind));
            break;
          }
        }
      }
    }
  }
  return parts.join(" · ");
}

function enterCanvasProps(inner) {
  const nodes = (inner.nodes || []).slice(0, 24);
  noteShownMembers(nodes);
  const hops = enterEdgesAmong(nodes);
  const flow = ((snapshot && snapshot.flows) || []).find((f) => f.name === inner.flow);
  const walk = flowWalk(flow);
  const items = nodes.map((n) => {
    const nid = String(idVal(n.id));
    const flags = nodeFlags(nid);
    const leaf = !!n.is_leaf;
    const kind = leaf ? n.kind || "Function" : "Type";
    const fqn = n.fqn || "";
    const node = nodeById.get(nid);
    const file = node && node.span ? node.span.file : "";
    const steiner = leaf && n.lit ? steinerOfWalk(walk, nid) : "";
    const hopRole = steiner === "start" ? "START · " : steiner === "end" ? "END · " : "";
    // ADE MBE — behavior caption (not file:line) on enter members.
    // Paint first, then override meta so file:line from graphNodePaint cannot win.
    const caption = enterBehaviorCaption(nid, hops, kind);
    return {
      id: nid,
      fqn,
      kind,
      kindClass: kindClass(kind),
      label: shortOf(n.fqn),
      kindLine: hopRole + kind,
      steiner,
      lit: !!n.lit,
      grey: !n.lit,
      isLeaf: leaf,
      flow: inner.flow,
      uncovered: !!flags.uncovered,
      changed: !!flags.changed,
      surface: "enter-node",
      ...graphNodePaint(nid, { fqn, kind, file, flow: inner.flow || "", community: !leaf }),
      meta: caption,
      caption,
      mbeCaption: !!caption,
      shape: leaf ? "" : shapeOf({ id: nid, kind: "Type" }),
      sliceDist: n.distance == null ? undefined : n.distance,
    };
  });
  const hotIds = new Set(nodes.filter((n) => n.lit).map((n) => String(idVal(n.id))));
  return {
    nodes: items,
    hops,
    hotIds,
    onNodeClick: (id, data) => {
      if (!id) return;
      if (data && data.isLeaf === false) {
        enterRun(data.flow || inner.flow, id);
        return;
      }
      // ADE MBE — enter browse stays graph-only (no peekSource / Evidence).
      selectedNodeId = id;
      selectNode(id, { peek: false });
    },
    onHopClick: (iOrHop) => {
      const hop = typeof iOrHop === "number" ? hops[iOrHop] : iOrHop;
      if (!hop) return;
      const from = hop.hopFrom != null ? hop.hopFrom : hop.from;
      const to = hop.hopTo != null ? hop.hopTo : hop.to;
      showHop(from, to, hop.kind);
    },
  };
}

function mountEnterCanvas(inner) {
  const host = document.getElementById("enterCanvas");
  if (!host) {
    unmountReviewCanvas();
    return;
  }
  renderEnterCanvas(host, enterCanvasProps(inner));
  stampXyFlowAttrs();
}

function renderInner(msg, animate, opts) {
  const inner = msg.inner || { nodes: [] };
  renderTabs(msg.flow ? [msg.flow] : snapshot?.flows || [], inner.flow);
  renderStats(msg);
  renderCoverage(msg.coverage, msg.findings, null);
  setMeta(
    '<button type="button" class="crumb-btn" data-go="programs">Map</button> / ' +
    esc(inner.flow) +
    " / <b>enter</b> · walk lit, siblings grey"
  );
  const backToPrograms = meta.querySelector("[data-go=programs]");
  if (backToPrograms) backToPrograms.onclick = () => goBack();
  const nodes = inner.nodes || [];
  hideTip();
  if (!nodes.length) {
    unmountReviewCanvas();
    enterBodyKey = "";
    canvas.className = "play";
    canvas.innerHTML = '<div class="empty">No derived members in this community.</div>';
    setZoomUi(false);
    return;
  }
  const key = enterWorkspaceKey(inner);
  const recycle = enterStageMounted() && key === enterBodyKey;
  // S1bq — enter remount while Evidence open soft-stays (parity with S1x Slice remount).
  const keepCam = !!(opts && opts.keepCam);
  const evidenceLive =
    typeof evidenceScrollDriveStayLive === "function" && evidenceScrollDriveStayLive();
  const stay = keepCam || evidenceLive;
  canvas.className = "play has-stage programs-view" + (animate ? " play" : "");
  if (recycle) {
    const title = canvas.querySelector(".flow-title");
    if (title) {
      title.textContent =
        "Inside this community — walk lit, siblings grey · " + nodes.length + " review-relevant";
    }
    bindStage(canvas.querySelector(".stage"), { reset: false });
  } else {
    unmountReviewCanvas();
    canvas.innerHTML =
      '<div class="stage">' +
      '<div class="flow-title">Inside this community — walk lit, siblings grey · ' +
      nodes.length +
      " review-relevant</div>" +
      '<div class="viewport" data-lod="0">' +
      '<div id="enterCanvas" class="enter-canvas enter-wrap"></div>' +
      "</div></div>";
    enterBodyKey = document.getElementById("enterCanvas") ? key : "";
    bindStage(canvas.querySelector(".stage"), { reset: !stay });
  }
  setZoomUi(true);
  mountEnterCanvas(inner);
  applyGraphFilter();
  applyEgoPaint();
  const leafNodes = nodes
    .filter((n) => n.is_leaf)
    .map((n) => nodeById.get(String(idVal(n.id))))
    .filter(Boolean);
  renderLedger(leafNodes.length ? leafNodes : nodes.map((n) => ({ id: n.id, fqn: n.fqn, kind: n.kind })), {
    selected: selectedNodeId,
  });
  // S1bq — re-seed soft stay + settle honesty across enter remount / recycle.
  if (typeof softStayScrollDriveAcrossDeskRemount === "function") {
    softStayScrollDriveAcrossDeskRemount();
  }
}

function renderCoverage(cov, findings, graph, opts) {
  const uncovered = (cov && cov.uncovered) || [];
  const changed = (cov && cov.changed) || [];
  const rawFindings = findings || [];
  const budgeted = !!(opts && opts.budgetMs != null);
  let shed = budgeted && (panelOverBudget(opts) || rawFindings.length > PANEL_FAT_FINDINGS);
  const { names, holds, broken, skipped, pending } = reviewMarks();
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
  if (uncovered.length && graph && !shed) {
    if (budgeted && panelOverBudget(opts)) {
      shed = true;
    } else {
      const sample = uncovered
        .slice(0, 3)
        .map((id) => shortOf(fqnOf(graph, id)))
        .filter(Boolean);
      if (sample.length) html += " · e.g. " + sample.map(esc).join(", ");
      if (uncovered.length > 3) html += " +" + (uncovered.length - 3);
    }
  }
  const score =
    '<div class="score" id="scorecard">' +
    '<span class="score-chip pending">' +
    pending +
    " left</span>" +
    '<span class="score-chip holds">' +
    holds +
    " stamped</span>" +
    '<span class="score-chip skip">' +
    skipped +
    " skipped</span>" +
    '<span class="score-chip broken">' +
    broken +
    " broken</span>" +
    "</div>";
  html = score + '<span class="cov-chip">' + html + "</span>";
  let scars = [];
  if (!shed) {
    scars = rawFindings.filter((f) => f.kind === "StampBroken" || f.kind === "UnmatchedHint");
    if (budgeted && panelOverBudget(opts)) {
      shed = true;
      scars = [];
    }
  }
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
  markPanelShed(budgeted && shed);
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
  const parentIds = new Set(
    (snap.bubbles || []).filter((b) => b.parent != null).map((b) => String(idVal(b.parent)))
  );
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
      const id = members[0];
      // A one-member leaf is that derived node. A Type rect hides the IR kind.
      const member = !parentIds.has(String(idVal(b.id))) && members.length === 1 ? nodeById.get(id) : null;
      if (member) {
        const memberLit = tree.has(id);
        return {
          id,
          fqn: member.fqn || id,
          kind: member.kind || "Function",
          lit: memberLit,
          grey: !memberLit,
          is_leaf: true,
          distance: memberLit ? 0 : distTo(id),
        };
      }
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
        members,
      };
    });
  }
  nodes.sort(
    (a, b) => Number(b.lit) - Number(a.lit) || (a.distance ?? 99) - (b.distance ?? 99) || String(a.fqn).localeCompare(String(b.fqn))
  );
  if (!children.length && nodes.length > 24) nodes = nodes.slice(0, 24);
  return { flow: flowName, bubble: bubbleId, nodes };
}

function setLlmPane(on) {
  if (!llmPane) return;
  if (on) {
    setExportMenu(false);
    if (typeof setKeysPane === "function") setKeysPane(false);
    if (sourcePane && !sourcePane.hidden && typeof closeSourcePane === "function") closeSourcePane();
    if (typeof setLensOpen === "function") setLensOpen(false);
    if (typeof setRouteOpen === "function") setRouteOpen(false);
    if (typeof applyPresent === "function") applyPresent(false);
    if (typeof hideTip === "function") hideTip();
    if (toastEl) {
      toastEl.classList.remove("on");
      toastEl.hidden = true;
    }
  }
  llmPane.hidden = !on;
  llmPane.classList.toggle("open", !!on);
  document.body.classList.toggle("llm-open", !!on);
  if (on) {
    vscode.postMessage({ type: "llmStatus" });
    if (llmAsk) llmAsk.focus();
  } else if (llmAsk && document.activeElement === llmAsk) {
    llmAsk.blur();
  }
}

function toggleLlmPane() {
  setLlmPane(!(llmPane && !llmPane.hidden));
}

function applyLlmStatus(msg) {
  if (llmStatusEl) {
    llmStatusEl.textContent = msg.connected
      ? "Host " + (msg.baseUrl || "") + " · " + (msg.model || "")
      : "Graph-only until you save a host. Agents never stamp.";
  }
  if (llmBaseUrl && msg.baseUrl) llmBaseUrl.value = msg.baseUrl;
  if (llmModel && msg.model) llmModel.value = msg.model;
  if (llmBridge) {
    llmBridge.textContent = msg.bridge
      ? "Bridge " + msg.bridge.url + " — any OpenAI-compatible client, Bearer key."
      : "Bridge off. Enable graphide.bridge.enabled.";
  }
  if (msg.test) {
    appendLlmLog((msg.test.ok ? "Test ok: " : "Test failed: ") + (msg.test.detail || ""), msg.test.ok ? "ok" : "err");
  }
}

function appendLlmLog(text, kind) {
  if (!llmLog) return;
  const row = document.createElement("div");
  row.className = "llm-msg " + (kind || "llm");
  row.textContent = text;
  llmLog.appendChild(row);
  llmLog.scrollTop = llmLog.scrollHeight;
}

function localAsk(q) {
  const flow = (typeof defaultRunFlow === "function" ? defaultRunFlow() : null) || currentFlow();
  const nodes = (flow && flow.tree && flow.tree.nodes) || [];
  const names = nodes.slice(0, 12).map((id) => {
    const n = nodeById.get(idVal(id));
    return shortOf((n && n.fqn) || id);
  }).filter(Boolean);
  const path = [];
  const seen = new Set();
  for (const id of nodes) {
    const b = typeof bubbleOf === "function" ? bubbleOf(id) : null;
    const label = b && (b.label || b.id);
    if (!label || seen.has(String(label))) continue;
    seen.add(String(label));
    path.push(String(b.label || b.id));
  }
  const edges = (flow && flow.tree && flow.tree.edges) || [];
  const hopKinds = edges.slice(0, 8).map((e) => {
    const from = shortOf((nodeById.get(idVal(e.from)) || {}).fqn || e.from);
    const to = shortOf((nodeById.get(idVal(e.to)) || {}).fqn || e.to);
    return (e.kind || "Calls") + " " + from + " → " + to;
  });
  const lines = [
    "Start → features → end: " + (path.join(" → ") || "(review a repo first)"),
    names.length ? "Control-flow hops: " + names.join(" → ") : "",
    "This answer is from the derived review graph. An LLM is optional. Agents never stamp.",
  ];
  if (/uncover|coverage/i.test(q || "")) {
    const cov = (snapshot && snapshot.coverage) || {};
    lines.splice(2, 0, "Coverage: " + ((cov.changed || []).length) + " changed · " + ((cov.uncovered || []).length) + " uncovered");
  }
  if (/hop|edge|calls|reads|writes|publish|subscribe/i.test(q || "") && hopKinds.length) {
    lines.splice(2, 0, "Derived hops: " + hopKinds.join("; "));
  }
  return lines.filter(Boolean).join("\n").trim() ||
    "This answer is from the derived review graph. An LLM is optional. Agents never stamp.";
}

function sendLlmAsk() {
  if (!llmAsk) return;
  // Keep the caret in the field: the next question must not land on the Send button and fire desk keys (s = stamp).
  llmAsk.focus();
  const q = llmAsk.value.trim();
  if (!q) return;
  appendLlmLog(q, "user");
  llmAsk.value = "";
  const token = ++llmTok;
  vscode.postMessage({ type: "llmAsk", prompt: q });
  setTimeout(() => {
    if (token !== llmTok) return;
    appendLlmLog(localAsk(q), "graph");
  }, 160);
}


  if (typeof applyTheme === "function") window.applyTheme = applyTheme;
  if (typeof toggleTheme === "function") window.toggleTheme = toggleTheme;
  if (typeof applyPreset === "function") window.applyPreset = applyPreset;
  if (typeof cyclePreset === "function") window.cyclePreset = cyclePreset;
  if (typeof applyPresent === "function") window.applyPresent = applyPresent;
  if (typeof togglePresent === "function") window.togglePresent = togglePresent;
  if (typeof buildCanonicalSvg === "function") window.buildCanonicalSvg = buildCanonicalSvg;
  if (typeof stripExportViewerState === "function") window.stripExportViewerState = stripExportViewerState;
}
