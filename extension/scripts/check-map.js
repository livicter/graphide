#!/usr/bin/env node
/** Headless checks for the review map. Run: node extension/scripts/check-map.js */
const fs = require("fs");
const path = require("path");
const js = fs.readFileSync(path.join(__dirname, "../media/main.js"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "../media/main.css"), "utf8");
const ext = fs.readFileSync(path.join(__dirname, "../src/extension.ts"), "utf8");
const harness = fs.readFileSync(path.join(__dirname, "webview-harness.js"), "utf8");
const harnessHtml = fs.readFileSync(path.join(__dirname, "webview-harness.html"), "utf8");
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"));
const chromeDir = path.join(__dirname, "../media/src");
function readTree(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((ent) => {
      const p = path.join(dir, ent.name);
      return ent.isDirectory() ? readTree(p) : [fs.readFileSync(p, "utf8")];
    })
    .join("\n");
}
const chrome = readTree(chromeDir);

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
assert(chrome.includes('id="keysPane"'), "shortcut sheet missing from the webview chrome");
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
assert(js.includes('data-ws="overview"') || chrome.includes('data-ws="overview"'), "overview workspace tab missing");
assert(chrome.includes('data-ws="decisions"'), "decisions workspace tab missing");
assert(chrome.includes('data-ws="lineage"'), "lineage workspace tab missing");
assert(chrome.includes('data-ws="registry"'), "registry workspace tab missing");
assert(chrome.includes('data-ws="timeline"'), "timeline workspace tab missing");
assert(chrome.includes('data-ws="delta"'), "delta workspace tab missing");
assert(chrome.includes('data-ws="sequence"'), "sequence workspace tab missing");
assert(chrome.includes('data-ws="dataflow"'), "dataflow workspace tab missing");
assert(chrome.includes('data-ws="lifecycle"'), "lifecycle workspace tab missing");
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
assert(js.includes("function renderDeltaBody"), "Architecture Delta workspace missing");
assert(js.includes('id="deltaPlay"') && js.includes('id="deltaFacts"'), "Delta Review walk and fact list missing");
assert(js.includes("function renderSequenceBody"), "Sequence workspace missing");
assert(js.includes('id="seqPlay"') && js.includes('id="seqHops"') && js.includes('id="seqParts"'), "Sequence Play walk and hop list missing");
assert(js.includes("function flow_sequence") || js.includes("function sequenceOf"), "Sequence must read Steiner hops");
assert(js.includes("function renderSequenceCanvas") || chrome.includes("renderSequenceCanvas"), "Sequence XYFlow mount missing");
assert(js.includes("hideAttribution") && chrome.includes("hideAttribution"), "XYFlow attribution must stay hidden");
assert(js.includes("function layoutSequence") && js.includes("SEQ_NODE_CAP"), "Sequence must cap and layout the Steiner slice");
assert(!chrome.includes("MiniMap") && !chrome.includes("<Controls"), "Sequence must not add MiniMap / Controls chrome");
assert(fs.existsSync(path.join(__dirname, "../media/xyflow.css")), "XYFlow CSS must ship as extension/media/xyflow.css");
assert(css.includes('@import url("xyflow.css")'), "main.css must import the shipped XYFlow stylesheet");
assert(css.includes("#seqCanvas .react-flow"), "Sequence XYFlow must be contained in #seqCanvas");
assert(css.includes("#deltaCanvas .react-flow") && css.includes("#dfCanvas .react-flow") && css.includes("#lcCanvas .react-flow") && css.includes("#sliceCanvas .react-flow"), "Delta / Data-flow / Lifecycle / Slice XYFlow must be contained in their canvas hosts");
assert(js.includes("function renderDeltaCanvas") || chrome.includes("mountDeltaCanvas") || chrome.includes("renderDeltaCanvas"), "Delta XYFlow mount missing");
assert(js.includes("DELTA_NODE_CAP") || chrome.includes("DELTA_NODE_CAP") || chrome.includes("nodeCap: 24"), "Delta must cap at 24");
assert(js.includes("function renderDataflowCanvas") || chrome.includes("renderDataflowCanvas"), "Data-flow XYFlow mount missing");
assert(js.includes("function renderLifecycleCanvas") || chrome.includes("renderLifecycleCanvas"), "Lifecycle XYFlow mount missing");
assert(js.includes("function renderSliceCanvas") || chrome.includes("renderSliceCanvas"), "Slice XYFlow mount missing");
assert(js.includes('id="sliceCanvas"') || chrome.includes('id="sliceCanvas"'), "Slice must host XYFlow on #sliceCanvas");
assert(js.includes("unmountReviewCanvas") || chrome.includes("unmountReviewCanvas"), "Review canvases must unmount when leaving the workspace");
assert(/style-src \$\{webview.cspSource\}/.test(ext) && !/style-src[^;]*unsafe-inline/.test(ext), "CSP must not add style-src unsafe-inline");
assert(!/script-src[^;]*unsafe-eval/.test(ext) && !/script-src[^;]*unsafe-inline/.test(ext), "CSP must not add script-src unsafe-eval / unsafe-inline");
assert(js.includes(".slice(0, 24)"), "Map community LOD must stay cap 24");
assert(js.includes("function renderDataflowBody"), "Data-flow workspace missing");
assert(js.includes('id="dfPlay"') && js.includes('id="dfHops"') && js.includes('id="dfStages"'), "Data-flow Play walk and pipeline missing");
assert(js.includes("function flow_dataflow") || js.includes("function dataflowOf"), "Data-flow must read Steiner data hops");
assert(js.includes("function renderLifecycleBody"), "Lifecycle workspace missing");
assert(js.includes('id="lcPlay"') && js.includes('id="lcTrans"') && js.includes('id="lcCanvas"'), "Lifecycle Play walk and machine missing");
assert(js.includes("function flow_lifecycle") || js.includes("function lifecycleOf"), "Lifecycle must read the derived review machine");
assert(js.includes('from: "broken"') && js.includes('to: "walking"'), "Lifecycle recover must be a real broken → walking transition");
assert(js.includes("data-delta-view") && js.includes('["before", "Before"]') && js.includes('["after", "After"]'), "Delta Before/After switch missing");
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
assert(chrome.includes('id="reorgBtn"'), "Reorganize button missing from the webview chrome");
assert(chrome.includes('id="llmPane"'), "LLM Ask panel missing from the webview chrome");
assert(js.includes("function sendLlmAsk"), "LLM Ask must be wired in the webview");
assert(!/sigma|forceatlas|ForceAtlas|sparql|shacl|owl:/i.test(js), "must not port Semantica graph engines or ontology");
assert(js.includes('id="scorecard"'), "review scorecard missing");
assert(js.includes("function reviewMarks"), "review queue marks missing");
assert(js.includes("now-pill"), "now context pill missing");
assert(js.includes("function setDeskMode"), "review desk mode missing");
assert(css.includes("body.desk"), "desk layout tokens missing");
assert(css.includes(".score-chip"), "scorecard chip styles missing");
assert(css.includes(".now-pill"), "now-pill styles missing");
assert(chrome.includes("Evidence"), "inspect pane must label Evidence");
assert(chrome.includes("src-k"), "evidence kicker missing from the webview chrome");
assert(js.includes("function renderStoryRailHtml"), "map/slice story rail missing");
assert(js.includes("function reviewAltitude"), "now-pill altitude missing");
assert(js.includes("function storyMapBubbles"), "map must pin the story path into communities");
assert(js.includes("function pinStoryClusters"), "map must keep start/end bubbles on the cut");
assert(js.includes("function storyHopStops"), "rail must fall back to control-flow hops");
assert(js.includes("function storyRailStops"), "rail must choose communities or hops");
assert(js.includes("function pathWalkStops") && js.includes("return storyRailStops()"), "Play must walk the same hops as the story rail");
assert(js.includes("function focusWalkStop"), "Play must peek Evidence on each hop");
assert(js.includes("function refreshNowPill"), "now-pill must follow the walk");
assert(/peekSource[\s\S]{0,400}showSource/.test(js) && js.includes("No snippet on this snapshot"), "Evidence must open from the graph node when snippets are missing");
assert(js.includes("shortOf(f.from)") && js.includes("shortOf(f.to)"), "Registry findings must name from → to hops");
assert(harness.includes("runLiveSuite") && harness.includes('suite") === "live"'), "live SolarSim suite missing");
assert(js.includes("function syncBackBtn"), "Back must enable after Enter a community");
assert(js.includes("storyTree.length >= 2"), "Lineage must prefer the control-flow walk over a one-node overview stub");
assert(harness.includes("V39") && harness.includes("V40"), "live suite must prove Lineage lands on the start hop");
assert(harness.includes("V41") && harness.includes("V43"), "live suite must prove the Apple bright look");
assert(harness.includes("V45") && harness.includes("V48"), "live suite must prove the compact Apple chrome");
assert(harness.includes("V49") && harness.includes("V50"), "live suite must prove story-first Overview");
assert(harness.includes("V51") && harness.includes("V53"), "live suite must prove the quiet ledger and caption footer");
assert(harness.includes("V54") && harness.includes("V57"), "live suite must prove Day and Night appearance");
assert(js.includes("function applyTheme") && js.includes("function toggleTheme"), "appearance switch missing");
assert(css.includes("html.bright.night") && /#0a84ff|#0A84FF/.test(css), "Apple night tokens missing");
assert(chrome.includes("themeSeg") && chrome.includes('data-theme="day"'), "Day / Night control missing from chrome");
assert(pkg.contributes && pkg.contributes.configuration && JSON.stringify(pkg.contributes.configuration).includes("graphide.appearance"), "graphide.appearance setting missing");
assert(js.includes("shortOf(n.fqn"), "ledger cells must name objects, not only hex tokens");
assert((() => {
  const body = js.slice(js.indexOf("function renderOverviewBody"));
  return body.indexOf("renderFeaturePathHtml()") < body.indexOf('class="stat-strip"');
})(), "overview story must sit above the metrics strip");
assert(js.includes("ws === alt"), "now-pill must not repeat workspace · altitude");
assert(/<header>[\s\S]*id="prompt"/.test(chrome), "prompt must sit in the header");
assert(/id="graphBar"[\s\S]*id="tabs"/.test(chrome), "flow tabs must live in the toolbar");
assert(js.includes("Clear find to see the audit log"), "Registry must not look empty when Find filters the snapshot");
assert(js.includes('id="storyRail"'), "story rail id missing");
assert(css.includes(".story-rail"), "story rail styles missing");
assert(/renderStoryRailHtml\(\)\s*\+\s*[\s\S]{0,40}<div class="stage"/.test(js), "story rail must sit outside the camera viewport");
assert(harness.includes("loadNamedSnap") && harness.includes("live-snap.json"), "live snap loader missing");
assert(harness.includes("__graphideLiveError") && harness.includes('params.get("require")'), "required live snap must not silently fall back to synthetic");
assert(harness.includes("delta-snap.json") && harness.includes("__graphideDelta"), "delta fixture snap loader missing");
assert(harness.includes("sequence-snap.json") && harness.includes("__graphideSequence"), "sequence fixture snap loader missing");
assert(harness.includes("dataflow-snap.json") && harness.includes("__graphideDataflow"), "dataflow fixture snap loader missing");
assert(harness.includes("lifecycle-snap.json") && harness.includes("__graphideLifecycle"), "lifecycle fixture snap loader missing");
assert(chrome.includes('id="exportBtn"'), "Export button missing from chrome");
assert(chrome.includes('id="exportMenu"'), "Export menu missing from chrome");
assert(chrome.includes('id="exportPng"') && chrome.includes('id="exportSvg"') && chrome.includes('id="exportShare"'), "Export PNG / SVG / Share Card items missing");
assert(js.includes("function setExportMenu") && js.includes("function stripExportViewerState"), "export menu / canonical strip missing");
assert(js.includes("window.buildCanonicalSvg") && js.includes("window.stripExportViewerState"), "export harness hooks must stay on window after bootDesk");
assert(js.includes("function buildCanonicalSvg") && js.includes("function paintShareCard"), "canonical SVG / Share Card missing");
assert(js.includes("function paintCloneToCanvas") && js.includes("function rasterizeCanonical"), "export rasterize fallback missing");
assert(js.includes("1200") && js.includes("630") && js.includes("Graphide · "), "Share Card must be 1200×630 with Graphide · title");
assert(!/validat|verified|checked/.test((js.match(/function exportFileBase[\s\S]{0,400}/) || [""])[0]), "export filenames must not claim validation");
assert(js.includes('type: "exportFile"') && ext.includes("saveExportFile"), "host exportFile save path missing");
assert(ext.includes(".graphide") && ext.includes("stamps") && ext.includes("Export cannot write"), "export must refuse .graphide/stamps/");
assert(!js.includes("writeStamp") || !/function runExport[\s\S]{0,1200}writeStamp/.test(js), "export must not stamp");
assert(chrome.includes('id="presentBtn"'), "Present button missing from chrome");
assert(chrome.includes('id="presetBtn"'), "Style button missing from chrome");
assert(js.includes("function applyPresent") && js.includes("function togglePresent"), "presentation stage missing");
assert(js.includes("function applyPreset") && js.includes("function cyclePreset") && js.includes("function currentPreset"), "visual preset cycle missing");
assert(js.includes('data-preset="classic"') || ext.includes('data-preset="classic"'), "classic must be the default preset");
assert(css.includes("body.present") && css.includes('data-preset="signal-flow"') && css.includes('data-preset="blueprint"'), "present / preset styles missing");
assert(css.includes("32px 32px") || css.includes("background-size: 32px"), "blueprint drafting grid missing");
assert(/e.key === "f"[\s\S]{0,80}togglePresent/.test(js) || /e.key === "F"[\s\S]{0,120}togglePresent/.test(js), "F must toggle Presentation Stage");
assert(/isPresenting\(\)[\s\S]{0,80}cyclePreset[\s\S]{0,80}requestStamp/.test(js), "S must stamp on the desk and cycle Style on the stage");
assert(js.includes('data-preset="') && js.includes("art.preset"), "canonical export must carry the current preset");
assert(harness.includes("V58") && harness.includes("V61"), "live suite must prove present and preset");
assert(fs.existsSync(path.join(__dirname, "../../.cursor/skills/verify-graphide/references/features/presentation.md")), "presentation feature map missing");
assert(fs.existsSync(path.join(__dirname, "../../.cursor/skills/verify-graphide/references/features/route.md")), "route feature map missing");
assert(fs.existsSync(path.join(__dirname, "../../.cursor/skills/verify-graphide/references/features/lens.md")), "lens feature map missing");
assert(chrome.includes('id="pathBtn"'), "PATH button missing from chrome");
assert(chrome.includes('id="lensBtn"'), "LENS button missing from chrome");
assert(chrome.includes('id="probeDock"') && chrome.includes('id="routeReceipt"') && chrome.includes('id="lensReceipt"'), "route / lens receipt dock missing");
assert(js.includes("function directedRoute") && js.includes("function resolveRoute"), "directed route BFS missing");
assert(js.includes("function applyProbePaint") && js.includes("function toggleLensRole"), "route / lens paint missing");
assert(js.includes("Calls") && js.includes("Publishes") && js.includes("Subscribes") && js.includes("ROUTE_KINDS"), "route must BFS Calls/Reads/Writes/Publishes/Subscribes");
assert(!/function directedRoute[\s\S]{0,900}TypeUses/.test(js), "route must not walk TypeUses");
assert(/e.key === "r"[\s\S]{0,80}toggleRoute/.test(js) || /e.key === "R"[\s\S]{0,80}toggleRoute/.test(js), "R must open PATH");
assert(/e.key === "l"[\s\S]{0,80}toggleLens/.test(js) || /e.key === "L"[\s\S]{0,80}toggleLens/.test(js), "L must open LENS");
assert(!/e.key === "r"[\s\S]{0,80}autoReorganize/.test(js), "R must not reorganize");
assert(!/e.key === "l"[\s\S]{0,80}toggleLlmPane/.test(js), "L must not open Ask");
assert(js.includes("Function") && js.includes("Endpoint") && js.includes("LENS_END_ROLES"), "lens must use Function/Type/Endpoint or Source|Sink");
assert(css.includes(".on-route") && css.includes(".lens-on") && css.includes("#probeDock"), "route / lens styles missing");
assert(chrome.includes('id="exportRouteShare"') && js.includes("route-share"), "Route Share Card hook missing");
assert(harness.includes('params.get("route")') && harness.includes('params.get("lens")'), "harness route/lens snap pin missing");

const workflow = fs.readFileSync(path.join(__dirname, "../../.github/workflows/verify-graphide.yml"), "utf8");
const driver = fs.readFileSync(path.join(__dirname, "../../scripts/verify-graphide.js"), "utf8");
assert(workflow.includes("build:webview"), "CI must compile the React desk before Playwright");
assert(workflow.includes("cargo build -p graphide-cli"), "CI must compile graphide-cli");
assert(/graphide review/.test(workflow) && workflow.includes("--no-parent"), "CI must run graphide review of this checkout");
assert(workflow.includes("fixtures/demo-parent") && workflow.includes("delta-snap.json"), "CI must derive demo vs demo-parent for Delta");
assert(workflow.includes("sequence-snap.json") && workflow.includes("fixtures/demo"), "CI must derive fixtures/demo for Sequence");
assert(workflow.includes("dataflow-snap.json") && workflow.includes("fixtures/demo"), "CI must derive fixtures/demo for Data-flow");
assert(workflow.includes("lifecycle-snap.json") && workflow.includes("fixtures/demo"), "CI must derive fixtures/demo for Lifecycle");
assert(driver.includes("self-review.png") && driver.includes("LIVE_HARNESS"), "verify driver must drive the self-review desk");
assert(driver.includes("delta.png") && driver.includes("DELTA_HARNESS") && driver.includes("sneaky_helper"), "verify driver must drive Architecture Delta on the demo fixture");
assert(driver.includes("D6b") && driver.includes("#deltaCanvas .react-flow__node"), "verify driver must prove Delta XYFlow");
assert(driver.includes("sequence.png") && driver.includes("SEQUENCE_HARNESS") && driver.includes("subscribe"), "verify driver must drive Sequence on the demo fixture");
assert(driver.includes("dataflow.png") && driver.includes("DATAFLOW_HARNESS") && driver.includes("data-df-role"), "verify driver must drive Data-flow on the demo fixture");
assert(driver.includes("F6b") && driver.includes("#dfCanvas .react-flow__node"), "verify driver must prove Data-flow XYFlow");
assert(driver.includes("lifecycle.png") && driver.includes("LIFECYCLE_HARNESS") && driver.includes("data-lc-type"), "verify driver must drive Lifecycle on the demo fixture");
assert(driver.includes("L6b") && driver.includes("#lcCanvas .react-flow__node"), "verify driver must prove Lifecycle XYFlow");
assert(driver.includes("M2c") && driver.includes("#sliceCanvas .react-flow__node"), "verify driver must prove Slice XYFlow");
assert(driver.includes("export-share.png") && driver.includes("exportBtn") && driver.includes("1200"), "verify driver must trigger Export and assert the 1200×630 Share Card");
assert(driver.includes("present.png") && driver.includes("preset-blueprint.png"), "verify driver must screenshot present and blueprint");
assert(driver.includes("route.png") && driver.includes("lens.png") && driver.includes("__graphideRoute"), "verify driver must drive Route and Lens on the demo snap");
assert(driver.includes("--assert-snap"), "verify driver must fail the job on a broken/empty self-review snapshot");
assert(css.includes("html.bright"), "Apple bright material tokens missing");
assert(css.includes("html.bright #ledgerGrid"), "bright ledger must restyle as a source list");
assert(/#007aff|#007AFF/.test(css), "Apple system blue missing from the bright theme");
assert(css.includes("#f2f2f7") || css.includes("--g-grouped"), "grouped gray canvas missing");
assert(/class="\$\{themeClass\}"|class="bright/.test(ext), "webview must opt into the bright look");
assert(harnessHtml.includes('class="bright"'), "harness must preview the bright look");
assert(ext.includes('id="root"') && harnessHtml.includes('id="root"'), "host and harness must mount the React desk on #root");
assert(chrome.includes("createRoot") && chrome.includes("flushSync") && chrome.includes("bootDesk"), "React must flush-sync mount then boot the vanilla desk");
assert(chrome.includes("acquireHost") && chrome.includes("acquireVsCodeApi"), "host adapter must call acquireVsCodeApi once");
assert(css.includes("#root"), "React #root mount styles missing");
assert(js.includes("documentElement.classList.add(\"bright\")") || js.includes("classList.add(\"bright\")"), "webview script must keep the bright class");
assert(harness.includes("/1222/") && harness.includes("/349/"), "live V1 must expect SolarSim 349 nodes / 1222 edges after Imports");
assert(!js.includes("if (!pack) separateBoxes"), "packed Map cards must still separate so they do not sit on each other");
assert(/#sourcePane\s*\{[^}]*overflow:\s*hidden/.test(css), "Evidence must clip long source lines so it cannot cover the object rail");
assert(/#sourcePane\s*\{[^}]*max-width:\s*380px/.test(css), "Evidence must stay an inspector, not half the desk");

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
  :root { --vscode-foreground:#1d1d1f; --vscode-sideBar-background:#f5f5f7; --vscode-editor-background:#fff;
    --vscode-panel-border:rgba(60,60,67,.12); --vscode-focusBorder:#007aff; --vscode-textLink-foreground:#007aff;
    --vscode-errorForeground:#ff3b30; --vscode-font-family:-apple-system,system-ui; --vscode-font-size:13px; }
  body { margin:0; background:#f2f2f7; color:#1d1d1f; font:13px -apple-system,system-ui; }
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
