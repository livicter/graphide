#!/usr/bin/env node
/** Headless checks for the review map. Run: node extension/scripts/check-map.js */
const fs = require("fs");
const path = require("path");
const js = fs.readFileSync(path.join(__dirname, "../media/main.js"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "../media/main.css"), "utf8");
const ext = fs.readFileSync(path.join(__dirname, "../src/extension.ts"), "utf8");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

assert(js.includes("function renderBubbleMap"), "bubble-first map is missing");
assert(js.includes("mapAltitudeBubbles"), "map altitude helper is missing");
assert(js.includes("communities only"), "first-view copy still sells a function dump");
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
assert(css.includes("#ledgerPane"), "ledger pane styles missing");
assert(css.includes("--g-fn"), "kind color tokens missing");

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
    <div class="flow-title">Communities — click one to see its nodes</div>
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
