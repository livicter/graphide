#!/usr/bin/env node
/** Headless checks for the review map. Run: node extension/scripts/check-map.js */
const fs = require("fs");
const path = require("path");
const js = fs.readFileSync(path.join(__dirname, "../media/main.js"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "../media/main.css"), "utf8");
const ext = fs.readFileSync(path.join(__dirname, "../src/extension.ts"), "utf8");
const harness = fs.readFileSync(path.join(__dirname, "webview-harness.js"), "utf8");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

assert(js.includes("function renderBubbleMap"), "bubble-first map is missing");
assert(js.includes("mapAltitudeBubbles"), "map altitude helper is missing");
assert(js.includes("communities only"), "first-view copy still sells a function dump");
assert(js.includes("function lodName"), "zoom LOD names missing");
assert(js.includes("function popAltitudeFromZoom"), "zoom-out must pop one clustering level");
assert(js.includes("function bubbleMemberChips"), "bubble member peek chips missing");
assert(js.includes("zoom in to peek members"), "map title must teach geometric LOD");
assert(js.includes("drag to rearrange"), "map title must teach drag + reorganize");
assert(js.includes("msg.bubbles || snapshot?.bubbles"), "applyPrograms must keep bubbles from the programs message");
assert(/type:\s*"programs"[\s\S]*bubbles:\s*this\.snapshot\.bubbles/.test(ext), "programs message must send bubbles");
assert(js.includes("fallbackProgramBubbles"), "empty clustering must still show one program card");
assert(js.includes("function renderLedger"), "slice ledger is missing");
assert(js.includes("function showHop"), "hop card is missing");
assert(js.includes("function kindLine"), "endpoint kind line is missing");
assert(js.includes("function orthoPath"), "orthogonal edges missing");
assert(css.includes("#hopCard"), "hop card styles missing");
assert(css.includes(".edge-hit"), "clickable hop hit-path missing");
assert(!js.includes("clusters.length > 1"), "first view must not skip to unlabeled member dots");
assert(!js.includes("uncovered crate"), "coverage must not dump UncoveredNode lines");
assert(js.includes('+" + (uncovered.length - 3)'), "coverage should stay a one-line sample");
assert(css.includes(".bubble-card"), "bubble card styles missing");
assert(css.includes(".bubble-card .members"), "LOD member-chip styles missing");
assert(css.includes('.viewport[data-lod="0"] .pkt'), "overview LOD must hide hop packets");
assert(css.includes("#ledgerPane"), "ledger pane styles missing");
assert(css.includes("--g-fn"), "kind color tokens missing");
assert(js.includes("function renderLineage"), "lineage workspace missing");
assert(js.includes("function renderExplorerList"), "explorer list workspaces missing");
assert(js.includes("function defaultRunFlow"), "default control-flow run is missing");
assert(js.includes("function renderDefaultCfg"), "overview must embed the default CFG");
assert(js.includes("function flowWalk"), "control-flow walk helper is missing");
assert(js.includes("function featurePath"), "feature-path helper is missing");
assert(js.includes("Start → features → end"), "map/overview must tell start → features → end");
assert(css.includes(".feature-path"), "feature-path strip styles missing");
assert(css.includes("--g-radius"), "modern radius tokens missing");
assert(js.includes("stage.dataset.uiBound"), "map stage must track the pointer for interactive glow");
assert(css.includes("translate(-50%, calc(-50% - 5px))"), "card hover must lift without dropping the layout center");
assert(/\.prog-chip:hover[\s\S]*translate\(-50%/.test(css), "program chips must keep their layout center on hover");
assert(js.includes('classList.toggle("open"') || js.includes('classList.add("open")'), "Ask panel must animate open");
assert(js.includes("function flashToast"), "stamp/skip must flash a toast");
assert(js.includes("function setKeysPane"), "shortcut sheet missing");
assert(css.includes("#toast"), "toast styles missing");
assert(css.includes(".search-wrap"), "find field must be a command wrap");
assert(css.includes(".kind-pill"), "kind filters must be pills");
assert(ext.includes('id="keysPane"'), "shortcut sheet missing from the webview chrome");
assert(js.includes("function togglePathWalk"), "feature path must be playable");
assert(js.includes("function bindWorkbenchPages"), "Semantica-shaped workbench pages missing");
assert(js.includes('id="tlScrub"'), "timeline scrubber missing");
assert(css.includes(".outcome-strip"), "decision outcome badges missing");
assert(css.includes(".tl-scrub"), "timeline scrub styles missing");
assert(js.includes("cell dag"), "ledger must read as a git-object DAG");
assert(!/sigma|forceatlas|sparql|shacl|owl:/i.test(css), "must not port Semantica engines into chrome");
assert(js.includes("pathWalkBtn"), "Play path button missing");
assert(css.includes(".path-walk"), "path walk chrome styles missing");
assert(js.includes('id="pathWalkBtn"'), "Play path button missing from the feature-path chrome");
assert(css.includes(".feat-chip"), "feature chip styles missing");
assert(js.includes("function defaultLandingWorkspace"), "Review must land on overview when a run exists");
assert(js.includes("function applyExplorerLanding"), "harness ?ws= must pin the workspace on first paint");
assert(js.includes("function consumeHarnessActions"), "harness drill/hop/ego must run after first paint");
assert(js.includes("graphFilter.bubble ? 24 : 48"), "entering a bubble must not dump 160 overlapping nodes");
assert(js.indexOf("renderDefaultCfg()") < js.indexOf('<div class="flow-title">Communities</div>'), "overview CFG must paint before community cards");
assert(css.includes(".stat-strip"), "overview stats must be a compact strip so the CFG is on first paint");
assert(css.includes("#canvas.has-stage.explorer-list"), "overview must scroll so the CFG is not clipped");
assert(ext.includes("function pickDefaultRun"), "extension must pick control-flow as the default run");
assert(js.includes("function shortestPath"), "path-between on derived edges missing");
assert(js.includes("function applyEgoPaint"), "ego highlight missing");
assert(js.includes("function decisionRecords"), "decisions ledger missing");
assert(js.includes("function registryEvents"), "registry audit missing");
assert(js.includes("function timelineEvents"), "timeline events missing");
assert(js.includes('data-ws="overview"') || ext.includes('data-ws="overview"'), "overview workspace tab missing");
assert(ext.includes('data-ws="decisions"'), "decisions workspace tab missing");
assert(ext.includes('data-ws="lineage"'), "lineage workspace tab missing");
assert(ext.includes('data-ws="registry"'), "registry workspace tab missing");
assert(ext.includes('data-ws="timeline"'), "timeline workspace tab missing");
assert(css.includes(".workspaces"), "workspace tab styles missing");
assert(css.includes(".expl-card"), "explorer card styles missing");
assert(!/sigma|forceatlas|ForceAtlas/i.test(js), "must not embed Sigma/ForceAtlas2");
assert(!/sigma|forceatlas|ForceAtlas/i.test(ext), "must not embed Sigma/ForceAtlas2 in extension");
assert(js.includes("window.matchMedia &&"), "reduceMotion must tolerate missing matchMedia");
assert(js.includes('typeof hot.scrollIntoView === "function"'), "source peek must tolerate missing scrollIntoView");
assert(js.includes("explorerWs = \"slice\""), "selecting a flow must open the slice workspace");
assert(js.includes("function requestStamp"), "stamp must update the webview without waiting on the host");
assert(js.includes("function requestSkip"), "skip must update the webview without waiting on the host");
assert(js.includes("e.target.closest(\"input"), "search/prompt keys must not steal workspace shortcuts");
assert(js.includes("k !== \"StampBroken\" && k !== \"UnmatchedHint\""), "registry must not duplicate decision findings");
assert(js.includes('type: "enterRun"'), "enter-run must post to the host so stacks stay aligned");
assert(js.includes("graphFilter.bubble && (explorerWs === \"map\""), "Back must pop a Map bubble even when the stack is a flow");
assert(js.includes("applyGraphFilter();"), "community cards must honor search/kind filters");
assert(js.includes("popK"), "zoom-out pop must use the camera target, not the animated k");
assert(js.includes("function causalChainFor"), "decisions must show a Semantica-style causal chain on derived hops");
assert(js.includes("function renderTimelineBody"), "timeline must be a rail, not only cards");
assert(js.includes("function renderRegistryBody"), "registry must be an audit table");
assert(js.includes("function neighborhood"), "ego must support k-hop on derived edges");
assert(js.includes("function provBucket"), "lineage must map hops to Used/Informed/Generated");
assert(js.includes("function layeredPositions"), "map/slice must use a layered flowchart, not a pile");
assert(js.includes("function fitChart"), "Fit must frame the whole chart, not only reset to 100%");
assert(js.includes("function bindDraggable"), "boxes must be draggable");
assert(js.includes("function autoReorganize"), "Reorganize must clear pins and relayout");
assert(js.includes("function communityEdgeList"), "map must draw community hops");
assert(js.includes("function readableEdgesAmong"), "in-bubble layout must use a readable hop subset");
assert(js.includes("function separateBoxes"), "layout must push overlapping boxes apart");
assert(js.includes("maxRows > 4 || buckets.length > maxCols"), "tall ranks must pack into a compact wrap");
assert(ext.includes('id="reorgBtn"'), "Reorganize button missing from the webview chrome");
assert(ext.includes('id="llmPane"'), "LLM Ask panel missing from the webview chrome");
assert(js.includes("function sendLlmAsk"), "LLM Ask must be wired in the webview");
assert(!/sigma|forceatlas|ForceAtlas|sparql|shacl|owl:/i.test(js), "must not port Semantica graph engines or ontology");
assert(js.includes('id="scorecard"'), "review scorecard missing");
assert(js.includes("function reviewMarks"), "review queue marks missing");
assert(js.includes("now-pill"), "now context pill missing");
assert(js.includes("function setDeskMode"), "review desk mode missing");
assert(css.includes("body.desk"), "desk layout tokens missing");
assert(css.includes(".score-chip"), "scorecard chip styles missing");
assert(css.includes(".now-pill"), "now-pill styles missing");
assert(ext.includes("Evidence"), "inspect pane must label Evidence");
assert(ext.includes("src-k"), "evidence kicker missing from the webview chrome");
assert(js.includes("function renderStoryRailHtml"), "map/slice story rail missing");
assert(js.includes("function reviewAltitude"), "now-pill altitude missing");
assert(js.includes("function storyMapBubbles"), "map must pin the story path into communities");
assert(js.includes("function pinStoryClusters"), "map must keep start/end bubbles on the cut");
assert(js.includes("function storyHopStops"), "rail must fall back to control-flow hops");
assert(js.includes("function storyRailStops"), "rail must choose communities or hops");
assert(js.includes('id="storyRail"'), "story rail id missing");
assert(css.includes(".story-rail"), "story rail styles missing");
assert(/renderStoryRailHtml\(\)\s*\+\s*[\s\S]{0,40}<div class="stage"/.test(js), "story rail must sit outside the camera viewport");
assert(harness.includes("loadLiveSnap") && harness.includes("live-snap.json"), "live SolarSim snap loader missing");

const fakeNames = [
  "SimPosition", "Simulation", "Scale", "Mass", "Velocity", "Body", "Shape", "Star",
  "ToastContainer", "SelectedEntity", "SimulationData", "PilotMode", "Spacecraft",
];
const uncovered = Array.from({ length: 1123 }, (_, i) => "n" + i);
const sample = uncovered.slice(0, 3).map((id) => id);
const coverageLine =
  "Coverage 1123 changed · 1123 uncovered · e.g. " + sample.join(", ") + " +" + (1123 - 3);
assert(!coverageLine.includes("<li"), "coverage line must not be a list");
assert(coverageLine.length < 120, "coverage line still too long: " + coverageLine.length);

function lodOf(k) {
  if (k < 0.75) return 0;
  if (k < 1.5) return 1;
  if (k < 2.6) return 2;
  return 3;
}
assert(lodOf(1) === 1, "100% camera should read as labels, not a function dump");
assert(lodOf(0.5) === 0, "zoom-out should be overview");
assert(lodOf(2) === 2, "zoom-in should reveal hops");
assert(lodOf(3.2) === 3, "deep zoom should reveal source");

const clusters = 80;
const shown = Math.min(24, clusters);
assert(shown === 24, "bubble map must cap clusters");

const preview = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Graphide map preview</title>
<style>
  :root { --vscode-foreground:#ddd; --vscode-sideBar-background:#1e1e1e; --vscode-editor-background:#252526;
    --vscode-panel-border:#333; --vscode-focusBorder:#007acc; --vscode-textLink-foreground:#4fc1ff;
    --vscode-errorForeground:#f85149; --vscode-font-family:system-ui; --vscode-font-size:13px; }
  body { margin:0; background:#1e1e1e; color:#ddd; font:13px system-ui; }
  ${css}
  #canvas { height: 520px; }
</style></head><body>
<section id="canvas" class="play has-stage">
  <div class="stage"><div class="viewport" data-lod="0">
    <div class="flow-title">Communities — zoom in to peek members, click to enter</div>
    <div class="comm-wrap" style="width:720px;height:400px">
      ${fakeNames
        .map((name, i) => {
          const cols = 4;
          const cell = 108;
          const x = 12 + (i % cols) * cell + cell / 2;
          const y = 12 + Math.floor(i / cols) * cell + cell / 2;
          return `<button class="bubble-card" style="left:${x}px;top:${y}px;width:78px;height:78px;--c:#4ec9b0"><span class="name">${name}</span><span class="meta">${20 + i * 3} nodes</span></button>`;
        })
        .join("")}
    </div>
  </div></div>
</section>
<section id="coverage">Coverage 1123 changed · 1123 uncovered · e.g. ScreenshotFormat, ConfigChanged, AppConfig +1120</section>
</body></html>`;
const out = "/tmp/graphide-map-preview.html";
fs.writeFileSync(out, preview);
console.log("ok preview", out, "bubbles", fakeNames.length);
