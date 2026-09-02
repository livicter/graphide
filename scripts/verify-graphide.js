#!/usr/bin/env node
/**
 * Drive the running Review webview harness in Chromium.
 * Static check-map.js does not replace this.
 *
 *   npm run verify
 */
"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");
const zlib = require("zlib");

const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const EXT = path.join(ROOT, "extension");
const OUT = path.join(ROOT, "verification");
const SNAP = path.join(EXT, "scripts", "live-snap.json");
const DELTA_SNAP = path.join(EXT, "scripts", "delta-snap.json");
const SEQUENCE_SNAP = path.join(EXT, "scripts", "sequence-snap.json");
const DATAFLOW_SNAP = path.join(EXT, "scripts", "dataflow-snap.json");
const LIFECYCLE_SNAP = path.join(EXT, "scripts", "lifecycle-snap.json");
const DEMO = path.join(ROOT, "fixtures", "demo");
const DEMO_PARENT = path.join(ROOT, "fixtures", "demo-parent");
const HARNESS = "/scripts/webview-harness.html?mode=explorer&probe=0";
const LIVE_HARNESS = "/scripts/webview-harness.html?live=1&probe=0&require=1";
const DELTA_HARNESS = "/scripts/webview-harness.html?delta=1&probe=0&require=1&ws=delta";
const SEQUENCE_HARNESS = "/scripts/webview-harness.html?sequence=1&probe=0&require=1&ws=sequence";
const DATAFLOW_HARNESS = "/scripts/webview-harness.html?dataflow=1&probe=0&require=1&ws=dataflow";
const LIFECYCLE_HARNESS = "/scripts/webview-harness.html?lifecycle=1&probe=0&require=1&ws=lifecycle";
const LINEAGE_HARNESS = "/scripts/webview-harness.html?lineage=1&probe=0&require=1&ws=lineage";
const LINEAGE_DELTA_HARNESS = "/scripts/webview-harness.html?delta=1&probe=0&require=1&ws=lineage";
const SYNTHETIC_NODES = 2050;
const SYNTHETIC_EDGES = 4568;

const checks = [];

function record(id, title, pass, detail) {
  checks.push({ id, title, pass: !!pass, detail: detail == null ? "" : String(detail) });
  const tag = pass ? "ok  " : "FAIL";
  console.log(tag + " " + id + " · " + title + (detail ? " — " + detail : ""));
}

function failFast(msg) {
  console.error("FAIL verify-graphide · " + msg);
  process.exit(1);
}

function pngMeanLuma(buf) {
  if (!buf || buf.length < 24 || buf[0] !== 0x89 || buf.toString("ascii", 1, 4) !== "PNG") {
    throw new Error("not a PNG");
  }
  let p = 8;
  let w = 0;
  let h = 0;
  let depth = 8;
  let ctype = 6;
  const parts = [];
  while (p + 8 <= buf.length) {
    const len = buf.readUInt32BE(p);
    const typ = buf.toString("ascii", p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (typ === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      depth = data[8];
      ctype = data[9];
    } else if (typ === "IDAT") {
      parts.push(data);
    } else if (typ === "IEND") {
      break;
    }
    p += 12 + len;
  }
  if (depth !== 8 || (ctype !== 2 && ctype !== 6)) {
    throw new Error("unsupported png " + depth + "/" + ctype);
  }
  const bpp = ctype === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(parts));
  const stride = w * bpp;
  const out = Buffer.alloc(stride * h);
  let src = 0;
  let dst = 0;
  const paeth = (a, b, c) => {
    const pr = a + b - c;
    const pa = Math.abs(pr - a);
    const pb = Math.abs(pr - b);
    const pc = Math.abs(pr - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < h; y++) {
    const f = raw[src++];
    for (let x = 0; x < stride; x++) {
      const filt = raw[src++];
      const a = x >= bpp ? out[dst + x - bpp] : 0;
      const b = y > 0 ? out[dst + x - stride] : 0;
      const c = y > 0 && x >= bpp ? out[dst + x - stride - bpp] : 0;
      let v = filt;
      if (f === 1) v = (filt + a) & 255;
      else if (f === 2) v = (filt + b) & 255;
      else if (f === 3) v = (filt + ((a + b) >> 1)) & 255;
      else if (f === 4) v = (filt + paeth(a, b, c)) & 255;
      else if (f !== 0) throw new Error("png filter " + f);
      out[dst + x] = v;
    }
    dst += stride;
  }
  let sum = 0;
  let sum2 = 0;
  let n = 0;
  const step = Math.max(1, Math.floor((w * h) / 8000));
  for (let i = 0, pix = 0; i < out.length; i += bpp, pix++) {
    if (pix % step) continue;
    const y = (0.2126 * out[i] + 0.7152 * out[i + 1] + 0.0722 * out[i + 2]) / 255;
    sum += y;
    sum2 += y * y;
    n++;
  }
  const luma = n ? sum / n : 0;
  const std = n ? Math.sqrt(Math.max(0, sum2 / n - luma * luma)) : 0;
  return { w, h, luma, std };
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
};

function startServer(root) {
  const resolved = path.resolve(root);
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://127.0.0.1");
      let rel = decodeURIComponent(url.pathname);
      if (rel === "/") rel = "/scripts/webview-harness.html";
      const file = path.normalize(path.join(resolved, rel));
      if (!file.startsWith(resolved + path.sep) && file !== resolved) {
        res.writeHead(403);
        res.end();
        return;
      }
      fs.readFile(file, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("not found");
          return;
        }
        res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
        res.end(data);
      });
    });
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, port });
    });
    server.on("error", reject);
  });
}

async function shot(page, name) {
  const dest = path.join(OUT, name);
  const buf = await page.screenshot({ type: "png", fullPage: false });
  fs.writeFileSync(dest, buf);
  const meta = pngMeanLuma(buf);
  const ok = meta.luma >= 0.15 && meta.w >= 400 && meta.h >= 300 && buf.length > 8000;
  record("shot:" + name, "screenshot " + name + " is not a black frame", ok, "luma=" + meta.luma.toFixed(3) + " " + meta.w + "x" + meta.h + " bytes=" + buf.length);
  return dest;
}

function writeReport(extra) {
  fs.mkdirSync(OUT, { recursive: true });
  const failed = checks.filter((c) => !c.pass);
  const lines = [
    "# Graphide verification",
    "",
    extra,
    "",
    failed.length ? "**FAIL** " + failed.length + "/" + checks.length : "**PASS** " + checks.length + "/" + checks.length,
    "",
    "| id | result | title | detail |",
    "| --- | --- | --- | --- |",
    ...checks.map((c) => {
      const d = String(c.detail || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
      return "| " + c.id + " | " + (c.pass ? "PASS" : "FAIL") + " | " + c.title + " | " + d + " |";
    }),
    "",
    "Artifacts: `overview.png`, `map.png`, `evidence.png`, `stamp-host.png`, `self-review.png`, `delta.png`, `sequence.png`, `dataflow.png`, `lifecycle.png`, `lineage.png`, `export-desk.png`, `export-desk.svg`, `export-share.png`, `present.png`, `preset-blueprint.png`, `route.png`, `lens.png`, `report.md`.",
    "",
    "Stamp/skip clicks only prove `window.__vscodePosts`. They do not write `.graphide/stamps/`.",
    "Self-review is `graphide review` of this checkout — not the synthetic explorer fixture.",
    "",
  ];
  const dest = path.join(OUT, "report.md");
  fs.writeFileSync(dest, lines.join("\n"));
  return dest;
}

function mapAltitudeBubbles(bubbles) {
  const bs = Array.isArray(bubbles) ? bubbles : [];
  const idOf = (v) => String(v == null ? "" : v);
  const roots = bs.filter((b) => b && b.parent == null);
  if (roots.length === 1) {
    const rid = idOf(roots[0].id);
    const kids = bs.filter((b) => b && b.parent != null && idOf(b.parent) === rid);
    if (kids.length) return kids;
  }
  if (roots.length) return roots;
  return bs;
}

function findGraphideBin() {
  const env = process.env.GRAPHIDE_BIN;
  if (env && fs.existsSync(env)) return env;
  const candidates = [
    path.join(ROOT, "target", "debug", "graphide"),
    path.join(ROOT, "target", "debug", "graphide.exe"),
    path.join(ROOT, "target", "release", "graphide"),
    path.join(ROOT, "target", "release", "graphide.exe"),
  ];
  return candidates.find((p) => fs.existsSync(p)) || "";
}

function deriveSelfReviewSnap() {
  const bin = findGraphideBin();
  if (!bin) {
    failFast(
      "no self-review snapshot: compile `cargo build -p graphide-cli` then run " +
        "`graphide review --root <this checkout> --json --progress --no-parent` into " +
        "extension/scripts/live-snap.json (CI writes this file before npm run verify)"
    );
  }
  console.log("derive " + bin + " review --root " + ROOT + " --json --progress --no-parent");
  const r = spawnSync(
    bin,
    ["review", "--root", ROOT, "--json", "--progress", "--no-parent"],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 15 * 60 * 1000 }
  );
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) {
    failFast("graphide review failed (exit " + r.status + "): " + String(r.stderr || r.stdout || "").slice(-800));
  }
  const text = String(r.stdout || "").trim();
  if (!text) failFast("graphide review wrote an empty snapshot");
  fs.mkdirSync(path.dirname(SNAP), { recursive: true });
  fs.writeFileSync(SNAP, text.endsWith("\n") ? text : text + "\n");
  return text;
}

function deriveDeltaSnap() {
  const bin = findGraphideBin();
  if (!bin) {
    failFast(
      "no delta snapshot: compile `cargo build -p graphide-cli` then run " +
        "`graphide review --root fixtures/demo --parent fixtures/demo-parent --json` into " +
        "extension/scripts/delta-snap.json"
    );
  }
  console.log("derive " + bin + " review --root " + DEMO + " --parent " + DEMO_PARENT + " --json --progress");
  const r = spawnSync(
    bin,
    ["review", "--root", DEMO, "--parent", DEMO_PARENT, "--json", "--progress"],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: 5 * 60 * 1000 }
  );
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) {
    failFast("graphide review (delta fixture) failed (exit " + r.status + "): " + String(r.stderr || r.stdout || "").slice(-800));
  }
  const text = String(r.stdout || "").trim();
  if (!text) failFast("graphide review (delta fixture) wrote an empty snapshot");
  fs.mkdirSync(path.dirname(DELTA_SNAP), { recursive: true });
  fs.writeFileSync(DELTA_SNAP, text.endsWith("\n") ? text : text + "\n");
  return text;
}

function loadDeltaSnap() {
  let text = "";
  if (fs.existsSync(DELTA_SNAP)) {
    text = fs.readFileSync(DELTA_SNAP, "utf8");
  } else {
    text = deriveDeltaSnap();
  }
  let snap;
  try {
    snap = JSON.parse(text);
  } catch (e) {
    failFast("delta snapshot is not JSON: " + (e && e.message ? e.message : e));
  }
  if (!snap || typeof snap !== "object") failFast("delta snapshot is empty");
  return snap;
}

function assertDeltaSnap(snap) {
  const facts = (snap.delta && snap.delta.facts) || [];
  const added = facts.filter((f) => f && f.status === "added");
  const sneaky = facts.some((f) => f && f.status === "added" && /sneaky_helper/.test(String(f.fqn || "")));
  const parentNodes = ((((snap.delta || {}).parent || {}).nodes) || []).length;
  record("D0", "delta fixture snap has Architecture Delta facts", facts.length > 0, "facts=" + facts.length);
  record(
    "D0b",
    "delta fixture includes added crate::bus::sneaky_helper",
    sneaky,
    added.map((f) => f.fqn).slice(0, 6).join(",")
  );
  record("D0c", "delta fixture snap carries a parent graph", parentNodes > 0, "parent.nodes=" + parentNodes);
  const failed = checks.filter((c) => !c.pass && /^D0/.test(c.id));
  if (failed.length) {
    writeReport("Delta snapshot failed structural checks (desk not driven).");
    failFast(
      "empty Architecture Delta on demo vs demo-parent — " +
        failed.map((c) => c.id + " " + c.title + (c.detail ? " (" + c.detail + ")" : "")).join("; ")
    );
  }
  return { facts: facts.length, sneaky };
}

function deriveSequenceSnap() {
  const bin = findGraphideBin();
  if (!bin) {
    failFast(
      "no sequence snapshot: compile `cargo build -p graphide-cli` then run " +
        "`graphide review --root fixtures/demo --json --no-parent` into " +
        "extension/scripts/sequence-snap.json"
    );
  }
  console.log("derive " + bin + " review --root " + DEMO + " --json --progress --no-parent");
  const r = spawnSync(
    bin,
    ["review", "--root", DEMO, "--json", "--progress", "--no-parent"],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: 5 * 60 * 1000 }
  );
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) {
    failFast("graphide review (sequence fixture) failed (exit " + r.status + "): " + String(r.stderr || r.stdout || "").slice(-800));
  }
  const text = String(r.stdout || "").trim();
  if (!text) failFast("graphide review (sequence fixture) wrote an empty snapshot");
  fs.mkdirSync(path.dirname(SEQUENCE_SNAP), { recursive: true });
  fs.writeFileSync(SEQUENCE_SNAP, text.endsWith("\n") ? text : text + "\n");
  return text;
}

function loadSequenceSnap() {
  let text = "";
  if (fs.existsSync(SEQUENCE_SNAP)) {
    text = fs.readFileSync(SEQUENCE_SNAP, "utf8");
  } else {
    text = deriveSequenceSnap();
  }
  let snap;
  try {
    snap = JSON.parse(text);
  } catch (e) {
    failFast("sequence snapshot is not JSON: " + (e && e.message ? e.message : e));
  }
  if (!snap || typeof snap !== "object") failFast("sequence snapshot is empty");
  return snap;
}

function deriveDataflowSnap() {
  const bin = findGraphideBin();
  if (!bin) {
    failFast(
      "no dataflow snapshot: compile `cargo build -p graphide-cli` then run " +
        "`graphide review --root fixtures/demo --json --no-parent` into " +
        "extension/scripts/dataflow-snap.json"
    );
  }
  console.log("derive " + bin + " review --root " + DEMO + " --json --progress --no-parent");
  const r = spawnSync(
    bin,
    ["review", "--root", DEMO, "--json", "--progress", "--no-parent"],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: 5 * 60 * 1000 }
  );
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) {
    failFast("graphide review (dataflow fixture) failed (exit " + r.status + "): " + String(r.stderr || r.stdout || "").slice(-800));
  }
  const text = String(r.stdout || "").trim();
  if (!text) failFast("graphide review (dataflow fixture) wrote an empty snapshot");
  fs.mkdirSync(path.dirname(DATAFLOW_SNAP), { recursive: true });
  fs.writeFileSync(DATAFLOW_SNAP, text.endsWith("\n") ? text : text + "\n");
  return text;
}

function loadDataflowSnap() {
  let text = "";
  if (fs.existsSync(DATAFLOW_SNAP)) {
    text = fs.readFileSync(DATAFLOW_SNAP, "utf8");
  } else {
    text = deriveDataflowSnap();
  }
  let snap;
  try {
    snap = JSON.parse(text);
  } catch (e) {
    failFast("dataflow snapshot is not JSON: " + (e && e.message ? e.message : e));
  }
  if (!snap || typeof snap !== "object") failFast("dataflow snapshot is empty");
  return snap;
}

function assertDataflowSnap(snap) {
  const flows = snap.flows || [];
  const readings = flows.map((f) => {
    const df = (f && f.dataflow) || { nodes: [], hops: [] };
    const roles = (df.nodes || []).map((n) => n && n.role).filter(Boolean);
    return {
      name: f && f.name,
      nodes: (df.nodes || []).length,
      hops: (df.hops || []).length,
      roles,
      kinds: (df.hops || []).map((h) => h && h.kind).filter(Boolean),
    };
  });
  const best = readings.reduce((a, b) => (b.hops > (a ? a.hops : 0) ? b : a), readings[0] || null);
  const text = JSON.stringify(snap);
  const subscribe = /subscribe/i.test(text) && /events/i.test(text);
  const hasSource = !!(best && best.roles.indexOf("source") >= 0);
  const hasSink = !!(best && best.roles.indexOf("sink") >= 0);
  record(
    "F0",
    "dataflow fixture snap has a flow with Source and Sink hops",
    !!(best && best.nodes >= 2 && best.hops >= 1 && hasSource && hasSink),
    readings.map((r) => r.name + ":" + r.nodes + "n/" + r.hops + "h/" + r.roles.join("+")).join(" ")
  );
  record(
    "F0b",
    "dataflow fixture includes subscribe / events (data-subscription)",
    subscribe,
    best ? best.name + " kinds=" + (best.kinds || []).join(",") : "no flow"
  );
  const failed = checks.filter((c) => !c.pass && /^F0/.test(c.id));
  if (failed.length) {
    writeReport("Data-flow snapshot failed structural checks (desk not driven).");
    failFast(
      "empty Data-flow on fixtures/demo — " +
        failed.map((c) => c.id + " " + c.title + (c.detail ? " (" + c.detail + ")" : "")).join("; ")
    );
  }
  return { hops: best ? best.hops : 0, nodes: best ? best.nodes : 0, source: hasSource, sink: hasSink };
}

function deriveLifecycleSnap() {
  const bin = findGraphideBin();
  if (!bin) {
    failFast(
      "no lifecycle snapshot: compile `cargo build -p graphide-cli` then run " +
        "`graphide review --root fixtures/demo --json --no-parent` into " +
        "extension/scripts/lifecycle-snap.json"
    );
  }
  console.log("derive " + bin + " review --root " + DEMO + " --json --progress --no-parent");
  const r = spawnSync(
    bin,
    ["review", "--root", DEMO, "--json", "--progress", "--no-parent"],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: 5 * 60 * 1000 }
  );
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) {
    failFast("graphide review (lifecycle fixture) failed (exit " + r.status + "): " + String(r.stderr || r.stdout || "").slice(-800));
  }
  const text = String(r.stdout || "").trim();
  if (!text) failFast("graphide review (lifecycle fixture) wrote an empty snapshot");
  fs.mkdirSync(path.dirname(LIFECYCLE_SNAP), { recursive: true });
  fs.writeFileSync(LIFECYCLE_SNAP, text.endsWith("\n") ? text : text + "\n");
  return text;
}

function loadLifecycleSnap() {
  let text = "";
  if (fs.existsSync(LIFECYCLE_SNAP)) {
    text = fs.readFileSync(LIFECYCLE_SNAP, "utf8");
  } else {
    text = deriveLifecycleSnap();
  }
  let snap;
  try {
    snap = JSON.parse(text);
  } catch (e) {
    failFast("lifecycle snapshot is not JSON: " + (e && e.message ? e.message : e));
  }
  if (!snap || typeof snap !== "object") failFast("lifecycle snapshot is empty");
  return snap;
}

function assertLifecycleSnap(snap) {
  const flows = snap.flows || [];
  const readings = flows.map((f) => {
    const lc = (f && f.lifecycle) || { states: [], transitions: [], endpoints: [] };
    const types = (lc.states || []).map((s) => s && (s.type || s.kind)).filter(Boolean);
    const recover = (lc.transitions || []).some((t) => t && t.from === "broken" && t.to === "walking");
    return {
      name: f && f.name,
      states: (lc.states || []).length,
      trans: (lc.transitions || []).length,
      ends: (lc.endpoints || []).length,
      types,
      recover,
      ids: (lc.states || []).map((s) => s && s.id).filter(Boolean),
    };
  });
  const best = readings.reduce((a, b) => (b.trans > (a ? a.trans : 0) ? b : a), readings[0] || null);
  const text = JSON.stringify(snap);
  const events = /events/i.test(text);
  record(
    "L0",
    "lifecycle fixture snap has a review machine with recover",
    !!(best && best.states >= 6 && best.trans >= 1 && best.recover),
    readings.map((r) => r.name + ":" + r.states + "s/" + r.trans + "t").join(" ")
  );
  record(
    "L0b",
    "lifecycle fixture includes plugin-visible events Endpoint",
    events && !!(best && best.ends >= 1),
    best ? best.name + " ends=" + best.ends + " ids=" + (best.ids || []).join(",") : "no flow"
  );
  const failed = checks.filter((c) => !c.pass && /^L0/.test(c.id));
  if (failed.length) {
    writeReport("Lifecycle snapshot failed structural checks (desk not driven).");
    failFast(
      "empty Lifecycle on fixtures/demo — " +
        failed.map((c) => c.id + " " + c.title + (c.detail ? " (" + c.detail + ")" : "")).join("; ")
    );
  }
  return { states: best ? best.states : 0, trans: best ? best.trans : 0, ends: best ? best.ends : 0 };
}

function assertSequenceSnap(snap) {
  const flows = snap.flows || [];
  const readings = flows.map((f) => {
    const seq = (f && f.sequence) || { participants: [], hops: [] };
    return {
      name: f && f.name,
      parts: (seq.participants || []).length,
      hops: (seq.hops || []).length,
      kinds: (seq.hops || []).map((h) => h && h.kind).filter(Boolean),
    };
  });
  const best = readings.reduce((a, b) => (b.hops > (a ? a.hops : 0) ? b : a), readings[0] || null);
  const text = JSON.stringify(snap);
  const subscribe = /subscribe/i.test(text) && /events/i.test(text);
  record(
    "Q0",
    "sequence fixture snap has a flow with >1 participant and hops",
    !!(best && best.parts > 1 && best.hops >= 1),
    readings.map((r) => r.name + ":" + r.parts + "p/" + r.hops + "h").join(" ")
  );
  record(
    "Q0b",
    "sequence fixture includes subscribe / events (data-subscription)",
    subscribe,
    best ? best.name + " kinds=" + (best.kinds || []).join(",") : "no flow"
  );
  const failed = checks.filter((c) => !c.pass && /^Q0/.test(c.id));
  if (failed.length) {
    writeReport("Sequence snapshot failed structural checks (desk not driven).");
    failFast(
      "empty Sequence on fixtures/demo — " +
        failed.map((c) => c.id + " " + c.title + (c.detail ? " (" + c.detail + ")" : "")).join("; ")
    );
  }
  return { parts: best ? best.parts : 0, hops: best ? best.hops : 0 };
}

function loadSelfReviewSnap() {
  let text = "";
  if (fs.existsSync(SNAP)) {
    text = fs.readFileSync(SNAP, "utf8");
  } else {
    text = deriveSelfReviewSnap();
  }
  let snap;
  try {
    snap = JSON.parse(text);
  } catch (e) {
    failFast("self-review snapshot is not JSON: " + (e && e.message ? e.message : e));
  }
  if (!snap || typeof snap !== "object") failFast("self-review snapshot is empty");
  return snap;
}

function assertSelfReviewSnap(snap) {
  const nodes = (snap.graph && snap.graph.nodes) || [];
  const edges = (snap.graph && snap.graph.edges) || [];
  const files = snap.stats && snap.stats.files != null ? Number(snap.stats.files) : 0;
  const plugin = String(snap.plugin || "");
  const rustFiles = nodes.filter((n) => /\.rs$/i.test(((n && n.span) || {}).file || "")).length;
  const altitude = mapAltitudeBubbles(snap.bubbles);
  const labels = altitude.map((b) => String((b && b.label) || "")).filter(Boolean);
  const loneStart =
    altitude.length <= 1 &&
    (labels.length === 0 || /^(main|program|start|_program)$/i.test(labels[0] || ""));
  const synthetic =
    nodes.length === SYNTHETIC_NODES &&
    edges.length === SYNTHETIC_EDGES &&
    labels.includes("render") &&
    labels.includes("integration");

  record("G1", "self-review rust plugin is in play", /rust@/i.test(plugin), plugin || "(none)");
  record(
    "G2",
    "self-review graph has nodes, edges, and files",
    nodes.length > 0 && edges.length > 0 && files > 0,
    "nodes=" + nodes.length + " edges=" + edges.length + " files=" + files
  );
  record("G3", "self-review graph includes Rust files", rustFiles > 0, "rs=" + rustFiles);
  record(
    "G4",
    "self-review Map altitude is a real community cut, not a lone START",
    altitude.length >= 2 && !loneStart,
    "bubbles=" + ((snap.bubbles || []).length) + " altitude=" + altitude.length + " names=" + labels.slice(0, 8).join(",")
  );
  record(
    "G5",
    "self-review snapshot is this checkout, not the synthetic explorer fixture",
    !synthetic && nodes.length > 0,
    "nodes=" + nodes.length + " edges=" + edges.length
  );

  const failed = checks.filter((c) => !c.pass && /^G\d/.test(c.id));
  if (failed.length) {
    writeReport("Self-review snapshot failed structural checks (desk not driven).");
    failFast(
      "broken deriver or empty graph — " +
        failed.map((c) => c.id + " " + c.title + (c.detail ? " (" + c.detail + ")" : "")).join("; ")
    );
  }
  return { nodes: nodes.length, edges: edges.length, files, plugin, altitude: altitude.length, labels };
}

function finish(extra, passLine) {
  const failed = checks.filter((c) => !c.pass);
  writeReport(extra);
  if (failed.length) {
    console.error("FAIL verify-graphide · " + failed.length + "/" + checks.length);
    failed.forEach((c) => console.error("  XX " + c.id + " " + c.title + (c.detail ? " — " + c.detail : "")));
    process.exit(1);
  }
  console.log(passLine || "PASS verify-graphide · " + checks.length + "/" + checks.length);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const assertOnly = process.argv.includes("--assert-snap");

  const snap = loadSelfReviewSnap();
  const graph = assertSelfReviewSnap(snap);
  if (assertOnly) {
    finish(
      "Self-review snapshot `" + path.relative(ROOT, SNAP) + "` (assert-snap, desk not driven).",
      "PASS verify-graphide · self-review snapshot · nodes=" +
        graph.nodes +
        " edges=" +
        graph.edges +
        " files=" +
        graph.files +
        " · rust plugin"
    );
    return;
  }

  if (!fs.existsSync(path.join(EXT, "scripts", "webview-harness.html"))) {
    failFast("missing extension/scripts/webview-harness.html");
  }
  if (!fs.existsSync(path.join(EXT, "media", "main.js"))) {
    failFast("missing extension/media/main.js");
  }

  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch (e) {
    failFast("playwright is not installed (npm install)");
  }

  const { server, port } = await startServer(EXT);
  const origin = "http://127.0.0.1:" + port;
  const url = origin + HARNESS;
  console.log("harness " + url);

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    acceptDownloads: true,
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForFunction(
      () => {
        const ws = document.getElementById("workspaces");
        return !!(ws && !ws.hidden && document.body.classList.contains("desk"));
      },
      null,
      { timeout: 20000 }
    );

    const host = await page.evaluate(() => {
      const posts = window.__vscodePosts || [];
      return {
        stub: typeof window.acquireVsCodeApi === "function",
        posts: posts.length,
        bright: document.documentElement.classList.contains("bright"),
        desk: document.body.classList.contains("desk"),
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    });
    record("H1", "harness stub acquireVsCodeApi is present", host.stub, "");
    record("H2", "desk mode is on after synthetic programs", host.desk && host.bright, JSON.stringify(host));

    await page.waitForTimeout(400);
    await shot(page, "overview.png");

    await page.click('#workspaces [data-ws="map"]');
    await page.waitForSelector(".bubble-card", { timeout: 10000 });
    await page.waitForTimeout(250);

    const map = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".bubble-card")];
      const start = [...document.querySelectorAll(".bubble-card.start")];
      const names = cards.map((el) => ((el.querySelector(".name") || {}).textContent || "").trim());
      const legend = (document.getElementById("legend") || {}).textContent || "";
      const ws = (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
        ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
        : "";
      return {
        ws,
        cards: cards.length,
        start: start.length,
        comm: document.querySelectorAll(".comm-node").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        names,
        legend,
        loneStart: cards.length === 1 && (start.length === 1 || /^(main|program|start)$/i.test(names[0] || "")),
      };
    });
    record("M1", "Map workspace is active", map.ws === "map", map.ws);
    record(
      "M2",
      "Map shows a community map, not a lone START card",
      map.cards >= 8 && map.comm === 0 && !map.loneStart,
      "cards=" + map.cards + " start=" + map.start + " comm=" + map.comm + " names=" + map.names.slice(0, 6).join(",")
    );
    record(
      "M2b",
      "Map stays community LOD (no XYFlow / raw-IR React nodes)",
      map.xy === 0 && map.cards <= 24,
      "xy=" + map.xy + " cards=" + map.cards
    );
    record("M3", "Program chip seed includes bin main", /bin\s+main/i.test(map.legend), map.legend.slice(0, 80));

    const layoutBugs = await page.evaluate(() => {
      const hit = (a, b, slack) => {
        slack = slack || 0;
        return !!(
          a &&
          b &&
          a.width > 2 &&
          b.width > 2 &&
          !(a.right - slack <= b.left || a.left + slack >= b.right || a.bottom - slack <= b.top || a.top + slack >= b.bottom)
        );
      };
      const box = (el) => (el && !el.hidden ? el.getBoundingClientRect() : null);
      const pairs = (rects, slack) => {
        let n = 0;
        for (let i = 0; i < rects.length; i++) {
          for (let j = i + 1; j < rects.length; j++) if (hit(rects[i], rects[j], slack)) n++;
        }
        return n;
      };
      const ws = box(document.getElementById("workspaces"));
      const ego = box(document.getElementById("egoBtn"));
      const path = box(document.getElementById("pathBtn"));
      const kinds = box(document.getElementById("kindFilters"));
      const bar = box(document.getElementById("graphBar"));
      const legend = box(document.getElementById("legend"));
      const stage = box(document.querySelector("#canvas .stage"));
      const title = box(document.querySelector("#canvas .stage > .flow-title"));
      const chips = [...document.querySelectorAll("#legend .leg")]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 2 && r.height > 2);
      const cards = [...document.querySelectorAll(".bubble-card")].map((el) => el.getBoundingClientRect());
      const visible = cards.filter((c) => {
        if (!stage || c.width < 4 || c.height < 4) return false;
        return !(c.right <= stage.left || c.left >= stage.right || c.bottom <= stage.top || c.top >= stage.bottom);
      });
      const titleHitsCard = !!(title && visible.some((c) => hit(title, c)));
      return {
        barH: bar ? Math.round(bar.height) : 0,
        wsEgo: hit(ws, ego),
        wsPath: hit(ws, path),
        wsKinds: hit(ws, kinds),
        egoKinds: hit(ego, kinds),
        wsLegend: hit(ws, legend),
        kindsLegend: hit(kinds, legend),
        chipHits: pairs(chips, 1),
        cardHits: pairs(visible, 4),
        chips: chips.length,
        titleInStage: !!(title && stage && title.top >= stage.top - 1 && title.bottom <= stage.bottom + 1),
        titleHitsCard,
        cards: cards.length,
        visible: visible.length,
        titleInsideViewport: !!document.querySelector(".viewport > .flow-title"),
      };
    });
    record(
      "G1",
      "Graph bar controls do not overlap",
      !layoutBugs.wsEgo &&
        !layoutBugs.wsPath &&
        !layoutBugs.wsKinds &&
        !layoutBugs.egoKinds &&
        !layoutBugs.wsLegend &&
        layoutBugs.chipHits === 0 &&
        layoutBugs.barH > 0 &&
        layoutBugs.barH <= 168,
      JSON.stringify(layoutBugs)
    );
    record(
      "G2",
      "Map caption sits outside the camera and not on a community card",
      layoutBugs.titleInStage && !layoutBugs.titleHitsCard && !layoutBugs.titleInsideViewport,
      JSON.stringify(layoutBugs)
    );
    record(
      "G3",
      "Fit leaves more than one community card in the stage",
      layoutBugs.visible >= 3 && layoutBugs.cards >= 8,
      "visible=" + layoutBugs.visible + "/" + layoutBugs.cards
    );
    record(
      "G5",
      "Map community cards do not overlap",
      layoutBugs.cardHits === 0 && layoutBugs.visible >= 3,
      JSON.stringify({ cardHits: layoutBugs.cardHits, visible: layoutBugs.visible, cards: layoutBugs.cards })
    );
    record(
      "G6",
      "Program chips do not overlap each other or the workspace row",
      layoutBugs.chipHits === 0 && !layoutBugs.wsLegend && !layoutBugs.kindsLegend,
      JSON.stringify({ chipHits: layoutBugs.chipHits, chips: layoutBugs.chips, wsLegend: layoutBugs.wsLegend, kindsLegend: layoutBugs.kindsLegend })
    );

    await page.setViewportSize({ width: 720, height: 900 });
    await page.waitForTimeout(350);
    const narrow = await page.evaluate(() => {
      const hit = (a, b, slack) => {
        slack = slack || 0;
        return !!(
          a &&
          b &&
          a.width > 2 &&
          b.width > 2 &&
          !(a.right - slack <= b.left || a.left + slack >= b.right || a.bottom - slack <= b.top || a.top + slack >= b.bottom)
        );
      };
      const box = (el) => (el && !el.hidden ? el.getBoundingClientRect() : null);
      const pairs = (rects, slack) => {
        let n = 0;
        for (let i = 0; i < rects.length; i++) {
          for (let j = i + 1; j < rects.length; j++) if (hit(rects[i], rects[j], slack)) n++;
        }
        return n;
      };
      const ws = box(document.getElementById("workspaces"));
      const ego = box(document.getElementById("egoBtn"));
      const kinds = box(document.getElementById("kindFilters"));
      const legend = box(document.getElementById("legend"));
      const bar = box(document.getElementById("graphBar"));
      const chips = [...document.querySelectorAll("#legend .leg")]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 2 && r.height > 2);
      const stage = box(document.querySelector("#canvas .stage"));
      const cards = [...document.querySelectorAll(".bubble-card")].map((el) => el.getBoundingClientRect());
      const visible = cards.filter((c) => {
        if (!stage || c.width < 4 || c.height < 4) return false;
        return !(c.right <= stage.left || c.left >= stage.right || c.bottom <= stage.top || c.top >= stage.bottom);
      });
      const xs = visible.map((c) => c.left);
      const spanX = xs.length ? Math.max.apply(null, xs) - Math.min.apply(null, xs) : 0;
      return {
        barH: bar ? Math.round(bar.height) : 0,
        wsEgo: hit(ws, ego),
        wsKinds: hit(ws, kinds),
        egoKinds: hit(ego, kinds),
        wsLegend: hit(ws, legend),
        chipHits: pairs(chips, 1),
        cardHits: pairs(visible, 4),
        visible: visible.length,
        cards: cards.length,
        spanX: Math.round(spanX),
      };
    });
    record(
      "G4",
      "Narrow desk (720) graph bar still does not overlap",
      !narrow.wsEgo && !narrow.wsKinds && !narrow.egoKinds && !narrow.wsLegend && narrow.chipHits === 0 && narrow.barH > 0 && narrow.barH <= 220,
      JSON.stringify(narrow)
    );
    record(
      "G4b",
      "Narrow desk (720) Map is a grid, not one overlapping column",
      narrow.visible >= 8 && narrow.cardHits === 0 && narrow.spanX >= 160,
      JSON.stringify({ visible: narrow.visible, cards: narrow.cards, cardHits: narrow.cardHits, spanX: narrow.spanX })
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(200);

    const evidenceFit = await page.evaluate(() => {
      const cell = document.querySelector("#ledgerGrid .cell");
      if (cell) cell.click();
      return !!cell;
    });
    await page.waitForTimeout(450);
    const afterEvidence = await page.evaluate(() => {
      const hit = (a, b, slack) => {
        slack = slack || 0;
        return !!(
          a &&
          b &&
          a.width > 2 &&
          b.width > 2 &&
          !(a.right - slack <= b.left || a.left + slack >= b.right || a.bottom - slack <= b.top || a.top + slack >= b.bottom)
        );
      };
      const pairs = (rects, slack) => {
        let n = 0;
        for (let i = 0; i < rects.length; i++) {
          for (let j = i + 1; j < rects.length; j++) if (hit(rects[i], rects[j], slack)) n++;
        }
        return n;
      };
      const stage = (document.querySelector("#canvas .stage") || {}).getBoundingClientRect
        ? document.querySelector("#canvas .stage").getBoundingClientRect()
        : null;
      const pane = document.getElementById("sourcePane");
      const cards = [...document.querySelectorAll(".bubble-card")].map((el) => el.getBoundingClientRect());
      const visible = cards.filter((c) => {
        if (!stage || c.width < 4 || c.height < 4) return false;
        return !(c.right <= stage.left || c.left >= stage.right || c.bottom <= stage.top || c.top >= stage.bottom);
      });
      const chips = [...document.querySelectorAll("#legend .leg")]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 2 && r.height > 2);
      return {
        open: !!(pane && !pane.hidden),
        visible: visible.length,
        cards: cards.length,
        cardHits: pairs(visible, 4),
        chipHits: pairs(chips, 1),
      };
    });
    record(
      "G7",
      "Opening Evidence still fits more than one community card with no overlap",
      evidenceFit && afterEvidence.open && afterEvidence.visible >= 3 && afterEvidence.cardHits === 0 && afterEvidence.chipHits === 0,
      JSON.stringify({ clicked: evidenceFit, ...afterEvidence })
    );
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    await shot(page, "map.png");

    await page.click("#exportBtn");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !!(menu && !menu.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const exportUi = await page.evaluate(() => ({
      btn: !!document.getElementById("exportBtn"),
      menu: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      png: !!document.getElementById("exportPng"),
      svg: !!document.getElementById("exportSvg"),
      share: !!document.getElementById("exportShare"),
    }));
    record(
      "X1",
      "Export menu opens from #exportBtn",
      exportUi.btn && exportUi.menu && exportUi.png && exportUi.svg && exportUi.share,
      JSON.stringify(exportUi)
    );

    page.once("dialog", (d) => d.dismiss().catch(() => {}));
    await page.click("#exportPng");
    const pngWait = await page
      .waitForFunction(() => window.__graphideLastExport && window.__graphideLastExport.png, null, {
        timeout: 20000,
      })
      .then(() => "ok")
      .catch(async () => {
        const err = await page.evaluate(() => window.__graphideExportError || "");
        return "timeout:" + err;
      });
    if (pngWait !== "ok") failFast("export PNG did not finish — " + pngWait);
    await page.click("#exportBtn");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !!(menu && !menu.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.click("#exportSvg");
    await page.waitForFunction(() => window.__graphideLastExport && window.__graphideLastExport.svg, null, {
      timeout: 20000,
    });
    await page.click("#exportBtn");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !!(menu && !menu.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.click("#exportShare");
    await page.waitForFunction(() => window.__graphideLastExport && window.__graphideLastExport.share, null, {
      timeout: 20000,
    });

    const harvested = await page.evaluate(() => window.__graphideLastExport || {});
    function writeDataUrl(name, dataUrl) {
      if (!dataUrl || typeof dataUrl !== "string") return "";
      const i = dataUrl.indexOf(",");
      const dest = path.join(OUT, name);
      fs.writeFileSync(dest, Buffer.from(dataUrl.slice(i + 1), "base64"));
      return dest;
    }
    writeDataUrl("export-desk.png", harvested.png && harvested.png.dataUrl);
    writeDataUrl("export-desk.svg", harvested.svg && harvested.svg.dataUrl);
    writeDataUrl("export-share.png", harvested.share && harvested.share.dataUrl);

    const deskPng = path.join(OUT, "export-desk.png");
    const deskSvg = path.join(OUT, "export-desk.svg");
    const sharePng = path.join(OUT, "export-share.png");
    const deskBuf = fs.existsSync(deskPng) ? fs.readFileSync(deskPng) : Buffer.alloc(0);
    const svgText = fs.existsSync(deskSvg) ? fs.readFileSync(deskSvg, "utf8") : "";
    let deskMeta = { w: 0, h: 0, luma: 0 };
    try {
      deskMeta = pngMeanLuma(deskBuf);
    } catch (e) {
      deskMeta = { w: 0, h: 0, luma: 0 };
    }
    let shareMeta = { w: 0, h: 0, luma: 0 };
    try {
      shareMeta = pngMeanLuma(fs.readFileSync(sharePng));
    } catch (e) {
      shareMeta = { w: 0, h: 0, luma: 0 };
    }
    const names = [harvested.png && harvested.png.name, harvested.svg && harvested.svg.name, harvested.share && harvested.share.name]
      .filter(Boolean)
      .join(" ");
    record(
      "X2",
      "Export PNG was saved and is not a black frame",
      fs.existsSync(deskPng) &&
        deskBuf.length > 8000 &&
        deskMeta.luma >= 0.15 &&
        (deskMeta.std || 0) >= 0.03 &&
        deskMeta.w >= 200 &&
        deskMeta.h >= 160,
      "luma=" +
        deskMeta.luma.toFixed(3) +
        " std=" +
        (deskMeta.std || 0).toFixed(3) +
        " " +
        deskMeta.w +
        "x" +
        deskMeta.h +
        " bytes=" +
        deskBuf.length
    );
    record(
      "X3",
      "Export SVG was saved",
      /<svg[\s>]/i.test(svgText) && /foreignObject/i.test(svgText) && svgText.length > 400,
      "bytes=" + svgText.length
    );
    record(
      "X4",
      "Share Card is 1200×630",
      shareMeta.w === 1200 && shareMeta.h === 630 && fs.existsSync(sharePng),
      shareMeta.w + "x" + shareMeta.h
    );
    record(
      "X5",
      "Export filenames do not claim validation",
      names.length > 0 && !/validat|verified|checked/i.test(names),
      names
    );
    const stripProbe = await page.evaluate(() => {
      const box = document.createElement("div");
      box.innerHTML = '<i class="dim on focus selected ego-dim" data-delta-review-current="1"></i>';
      if (typeof stripExportViewerState === "function") stripExportViewerState(box);
      const i = box.querySelector("i");
      return {
        cls: ((i && i.className) || "").trim(),
        review: i ? i.getAttribute("data-delta-review-current") : "missing",
      };
    });
    record(
      "X6",
      "Canonical export strips focus / play / search classes",
      stripProbe.cls === "" && !stripProbe.review,
      JSON.stringify(stripProbe)
    );
    const exportPosts = await page.evaluate(() =>
      (window.__vscodePosts || []).filter((m) => m && m.type === "exportFile").map((m) => m.name)
    );
    record("X7", "Export posts exportFile to the host stub (not stamp)", exportPosts.length >= 1, exportPosts.join(","));
    const stampDirExport = path.join(ROOT, ".graphide", "stamps");
    const wroteStampExport = fs.existsSync(stampDirExport) && fs.readdirSync(stampDirExport).length > 0;
    record(
      "X8",
      "Export step did not write .graphide/stamps/",
      !wroteStampExport,
      wroteStampExport ? fs.readdirSync(stampDirExport).join(",") : "absent"
    );

    const topoBefore = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".bubble-card")];
      return {
        n: cards.length,
        ids: cards
          .map((el) => el.getAttribute("data-bubble") || ((el.querySelector(".name") || {}).textContent || "").trim())
          .join("|"),
        preset: document.documentElement.getAttribute("data-preset") || "classic",
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    });
    await page.click("#presetBtn");
    await page.waitForTimeout(80);
    const afterSignal = await page.evaluate(() => ({
      preset: document.documentElement.getAttribute("data-preset") || "",
      n: document.querySelectorAll(".bubble-card").length,
      ids: [...document.querySelectorAll(".bubble-card")]
        .map((el) => el.getAttribute("data-bubble") || ((el.querySelector(".name") || {}).textContent || "").trim())
        .join("|"),
    }));
    record(
      "P1",
      "Style cycle changes data-preset; topology is unchanged",
      afterSignal.preset &&
        afterSignal.preset !== topoBefore.preset &&
        afterSignal.n === topoBefore.n &&
        afterSignal.ids === topoBefore.ids &&
        afterSignal.n >= 8,
      topoBefore.preset + " → " + afterSignal.preset + " cards=" + afterSignal.n
    );
    await page.click("#presetBtn");
    await page.waitForTimeout(80);
    const afterBlue = await page.evaluate(() => {
      const fn = (getComputedStyle(document.documentElement).getPropertyValue("--g-fn") || "").trim();
      return {
        preset: document.documentElement.getAttribute("data-preset") || "",
        n: document.querySelectorAll(".bubble-card").length,
        ids: [...document.querySelectorAll(".bubble-card")]
          .map((el) => el.getAttribute("data-bubble") || ((el.querySelector(".name") || {}).textContent || "").trim())
          .join("|"),
        fn,
      };
    });
    record(
      "P2",
      "Blueprint preset is on the same Map topology",
      afterBlue.preset === "blueprint" && afterBlue.n === topoBefore.n && afterBlue.ids === topoBefore.ids,
      afterBlue.preset + " cards=" + afterBlue.n + " fn=" + afterBlue.fn
    );
    const themeIndep = await page.evaluate(() => {
      const before = document.documentElement.getAttribute("data-preset");
      if (typeof applyTheme === "function") applyTheme("night", false);
      const night = document.documentElement.getAttribute("data-preset");
      if (typeof applyTheme === "function") applyTheme("day", false);
      return { before, night, after: document.documentElement.getAttribute("data-preset") };
    });
    record(
      "P3",
      "Day / Night does not change the visual preset",
      themeIndep.before === "blueprint" && themeIndep.night === "blueprint" && themeIndep.after === "blueprint",
      JSON.stringify(themeIndep)
    );
    const exportHonor = await page.evaluate(() => {
      if (typeof buildCanonicalSvg !== "function") return { ok: false, why: "no buildCanonicalSvg" };
      const art = buildCanonicalSvg();
      return {
        ok: !!(art && art.svg && /data-preset="blueprint"/.test(art.svg) && art.preset === "blueprint"),
        preset: art && art.preset,
        hasAttr: !!(art && art.svg && /data-preset="blueprint"/.test(art.svg)),
      };
    });
    record(
      "P4",
      "Canonical export carries the current preset",
      exportHonor.ok,
      JSON.stringify(exportHonor)
    );
    await shot(page, "preset-blueprint.png");

    await page.keyboard.press("F");
    await page.waitForFunction(() => document.body.classList.contains("present"), null, { timeout: 5000 });
    const stage = await page.evaluate(() => {
      const canvas = document.getElementById("canvas");
      const bar = document.getElementById("graphBar");
      const r = canvas ? canvas.getBoundingClientRect() : { width: 0, height: 0, bottom: 0, top: 0 };
      const header = document.querySelector("header");
      const hb = header ? header.getBoundingClientRect().bottom : 0;
      return {
        present: document.body.classList.contains("present"),
        aria: (document.getElementById("presentBtn") || {}).getAttribute
          ? document.getElementById("presentBtn").getAttribute("aria-pressed")
          : "",
        barHidden: !bar || getComputedStyle(bar).display === "none",
        w: r.width,
        h: r.height,
        top: r.top,
        bottom: r.bottom,
        vw: window.innerWidth,
        vh: window.innerHeight,
        headerBottom: hb,
        fill:
          r.width >= window.innerWidth * 0.92 &&
          r.height >= window.innerHeight * 0.7 &&
          r.bottom >= window.innerHeight - 20 &&
          r.top <= hb + 12,
      };
    });
    record(
      "P5",
      "Presentation Stage fills the viewport and hides graph-bar chrome",
      stage.present && stage.barHidden && stage.fill && stage.aria === "true",
      JSON.stringify(stage)
    );
    await shot(page, "present.png");

    await page.keyboard.press("S");
    await page.waitForTimeout(80);
    const stageStyle = await page.evaluate(() => ({
      preset: document.documentElement.getAttribute("data-preset") || "",
      n: document.querySelectorAll(".bubble-card").length,
      ids: [...document.querySelectorAll(".bubble-card")]
        .map((el) => el.getAttribute("data-bubble") || ((el.querySelector(".name") || {}).textContent || "").trim())
        .join("|"),
      present: document.body.classList.contains("present"),
    }));
    record(
      "P6",
      "S on the stage cycles Style without moving nodes",
      stageStyle.present &&
        stageStyle.preset &&
        stageStyle.preset !== "blueprint" &&
        stageStyle.n === topoBefore.n &&
        stageStyle.ids === topoBefore.ids,
      stageStyle.preset + " cards=" + stageStyle.n
    );

    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.body.classList.contains("present"), null, { timeout: 5000 });
    const restored = await page.evaluate(() => {
      const bar = document.getElementById("graphBar");
      return {
        present: document.body.classList.contains("present"),
        barShown: !!(bar && getComputedStyle(bar).display !== "none"),
        aria: (document.getElementById("presentBtn") || {}).getAttribute
          ? document.getElementById("presentBtn").getAttribute("aria-pressed")
          : "",
      };
    });
    record(
      "P7",
      "Escape exits Presentation Stage and restores the desk",
      !restored.present && restored.barShown && restored.aria === "false",
      JSON.stringify(restored)
    );
    await page.evaluate(() => {
      if (typeof applyPreset === "function") applyPreset("classic", false);
    });
    const stampDirPresent = path.join(ROOT, ".graphide", "stamps");
    const wroteStampPresent = fs.existsSync(stampDirPresent) && fs.readdirSync(stampDirPresent).length > 0;
    record(
      "P8",
      "Present / preset step did not write .graphide/stamps/",
      !wroteStampPresent,
      wroteStampPresent ? fs.readdirSync(stampDirPresent).join(",") : "absent"
    );

    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector(".vnode", { timeout: 10000 });
    await page.waitForSelector("#sliceCanvas .react-flow__node", { timeout: 10000 });
    await page.waitForTimeout(200);
    const sliceXy = await page.evaluate(() => ({
      xy: document.querySelectorAll("#sliceCanvas .react-flow__node").length,
      xyFlow: !!document.querySelector("#sliceCanvas .react-flow"),
      mapXy: document.querySelectorAll(".react-flow__node").length,
    }));
    record(
      "M2c",
      "Slice canvas mounts XYFlow Steiner nodes (capped, not the raw IR)",
      sliceXy.xyFlow && sliceXy.xy > 1 && sliceXy.xy <= 48,
      "xy=" + sliceXy.xy
    );
    const sliceShapes = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#sliceCanvas .vnode[data-shape]")];
      return { n: nodes.length, shapes: [...new Set(nodes.map((el) => el.getAttribute("data-shape")))] };
    });
    record(
      "M2d",
      "Slice XYFlow nodes expose data-shape",
      sliceShapes.n > 1 && sliceShapes.n === sliceXy.xy,
      "n=" + sliceShapes.n + " shapes=" + sliceShapes.shapes.join(",")
    );
    await page.locator(".vnode").first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 8000 }
    );

    const evidence = await page.evaluate(() => {
      const pane = document.getElementById("sourcePane");
      const rail = document.getElementById("ledgerPane");
      const cs = getComputedStyle(pane);
      const a = pane.getBoundingClientRect();
      const b = rail ? rail.getBoundingClientRect() : null;
      const overlap =
        !!(b && !rail.hidden && a.width > 0 && b.width > 0) &&
        !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
      const maxW = parseFloat(cs.maxWidth);
      const overflow = cs.overflow + " " + cs.overflowX + " " + cs.overflowY;
      return {
        hidden: pane.hidden,
        kicker: ((document.querySelector(".src-k") || {}).textContent || "").trim(),
        title: ((document.getElementById("srcTitle") || {}).textContent || "").trim(),
        body: ((document.getElementById("srcBody") || {}).textContent || "").replace(/\s+/g, " ").trim().slice(0, 120),
        overflow,
        overflowHidden: /hidden/.test(cs.overflow) || /hidden/.test(cs.overflowX),
        maxWidth: maxW,
        width: a.width,
        railHidden: !rail || rail.hidden,
        overlap,
        src: { left: a.left, right: a.right, width: a.width },
        rail: b ? { left: b.left, right: b.right, width: b.width, hidden: rail.hidden } : null,
      };
    });
    record("E1", "Evidence pane is open and labeled", !evidence.hidden && /Evidence/i.test(evidence.kicker), evidence.kicker + " " + evidence.title);
    record(
      "E2",
      "Evidence clips (overflow hidden, max-width ≤ 380px)",
      evidence.overflowHidden && evidence.maxWidth <= 380 && evidence.width <= 380,
      "overflow=" + evidence.overflow + " max-width=" + evidence.maxWidth + " width=" + Math.round(evidence.width)
    );
    record(
      "E3",
      "Evidence does not overlap the object rail",
      !evidence.overlap,
      JSON.stringify({ overlap: evidence.overlap, src: evidence.src, rail: evidence.rail })
    );
    record("E4", "Evidence has inspect content", !!(evidence.title || /hop_|evidence|fn /i.test(evidence.body)), evidence.body);
    await shot(page, "evidence.png");

    const stampSkip = await page.evaluate(async () => {
      const stamp = document.getElementById("stampBtn");
      const skip = document.getElementById("skipBtn");
      window.__vscodePosts = window.__vscodePosts || [];
      const before = window.__vscodePosts.length;
      if (stamp && !stamp.disabled) stamp.click();
      if (skip && !skip.disabled) skip.click();
      const posts = window.__vscodePosts.slice(before);
      return {
        stampEnabled: !!(stamp && !stamp.disabled),
        skipEnabled: !!(skip && !skip.disabled),
        posts,
        stamped: posts.some((m) => m && m.type === "stamp"),
        skipped: posts.some((m) => m && m.type === "skip"),
      };
    });
    record("S1", "Stamp/Skip are enabled on a flow", stampSkip.stampEnabled && stampSkip.skipEnabled, "");
    record(
      "S2",
      "Stamp/Skip post host messages only (no disk stamp)",
      stampSkip.stamped && stampSkip.skipped,
      JSON.stringify(stampSkip.posts.filter((m) => m && (m.type === "stamp" || m.type === "skip")))
    );

    const stampDir = path.join(ROOT, ".graphide", "stamps");
    const wroteStamp = fs.existsSync(stampDir) && fs.readdirSync(stampDir).length > 0;
    record("S3", "Harness did not write .graphide/stamps/", !wroteStamp, wroteStamp ? fs.readdirSync(stampDir).join(",") : "absent");

    const editor = await page.evaluate(() => {
      const btn = document.getElementById("srcEditor");
      window.__vscodePosts = window.__vscodePosts || [];
      const before = window.__vscodePosts.length;
      if (btn) btn.click();
      const posts = window.__vscodePosts.slice(before);
      return {
        posted: posts.some((m) => m && m.type === "enterNode"),
        posts,
      };
    });
    record("H3", "Editor button posts enterNode to the host stub", editor.posted, JSON.stringify(editor.posts.slice(-2)));

    await shot(page, "stamp-host.png");

    const liveUrl = origin + LIVE_HARNESS;
    console.log("self-review " + liveUrl);
    await page.goto(liveUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    const liveBoot = await page
      .waitForFunction(
        () => {
          if (window.__graphideLiveError) return "error";
          if (window.__graphideLive === true && document.body.classList.contains("desk")) return "ok";
          const err = document.querySelector(".empty.error");
          if (err && /live-snap/i.test(err.textContent || "")) return "error";
          return "";
        },
        null,
        { timeout: 25000 }
      )
      .then((h) => h.jsonValue())
      .catch((e) => {
        return "timeout:" + String(e && e.message ? e.message : e);
      });

    const liveHost = await page.evaluate(() => {
      const status = (document.getElementById("status") || {}).textContent || "";
      const legend = (document.getElementById("legend") || {}).textContent || "";
      return {
        live: window.__graphideLive === true,
        error: window.__graphideLiveError || "",
        desk: document.body.classList.contains("desk"),
        bright: document.documentElement.classList.contains("bright"),
        status,
        legend,
        empty: ((document.querySelector(".empty.error") || {}).textContent || "").trim(),
      };
    });

    if (liveBoot !== "ok" || !liveHost.live) {
      const why =
        liveHost.error ||
        liveHost.empty ||
        (liveBoot && liveBoot !== "ok" ? liveBoot : "") ||
        "harness did not set window.__graphideLive (silent synthetic fallback is not a self-review)";
      record(
        "R1",
        "self-review desk loaded the derived snapshot (not synthetic fallback)",
        false,
        why
      );
      writeReport(
        "Harness `" + HARNESS + "` then `" + LIVE_HARNESS + "`. Desk could not be driven: " + why
      );
      failFast("desk could not be driven from the self-review snapshot — " + why);
    }
    record(
      "R1",
      "self-review desk loaded the derived snapshot (not synthetic fallback)",
      true,
      liveHost.status.slice(0, 120)
    );
    record(
      "R2",
      "self-review desk mode is on after live snap",
      liveHost.desk && liveHost.bright,
      JSON.stringify({ desk: liveHost.desk, bright: liveHost.bright, status: liveHost.status.slice(0, 80) })
    );

    const statusHits =
      liveHost.status.includes(String(graph.nodes)) && liveHost.status.includes(String(graph.edges));
    record(
      "R3",
      "self-review chrome shows this checkout's graph counts",
      statusHits || /node/i.test(liveHost.status),
      liveHost.status.slice(0, 160)
    );

    await page.click('#workspaces [data-ws="map"]');
    await page.waitForSelector(".bubble-card", { timeout: 15000 });
    await page.waitForTimeout(500);

    const liveMap = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".bubble-card")];
      const start = [...document.querySelectorAll(".bubble-card.start")];
      const names = cards.map((el) => ((el.querySelector(".name") || {}).textContent || "").trim());
      const legend = (document.getElementById("legend") || {}).textContent || "";
      const ws = (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
        ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
        : "";
      return {
        ws,
        cards: cards.length,
        start: start.length,
        comm: document.querySelectorAll(".comm-node").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        names,
        legend,
        loneStart: cards.length === 1 && (start.length === 1 || /^(main|program|start)$/i.test(names[0] || "")),
      };
    });
    record("R4", "self-review Map workspace is active", liveMap.ws === "map", liveMap.ws);
    record(
      "R5",
      "self-review Map shows communities on this repo, not a lone START",
      liveMap.cards >= 2 && liveMap.comm === 0 && !liveMap.loneStart && liveMap.cards >= Math.min(2, graph.altitude),
      "cards=" + liveMap.cards + " start=" + liveMap.start + " comm=" + liveMap.comm + " names=" + liveMap.names.slice(0, 8).join(",")
    );
    record(
      "R5b",
      "self-review Map stays community LOD (no XYFlow / 1650 React nodes)",
      liveMap.xy === 0 && liveMap.cards <= 24,
      "xy=" + liveMap.xy + " cards=" + liveMap.cards
    );
    const liveLayout = await page.evaluate(() => {
      const hit = (a, b, slack) => {
        slack = slack || 0;
        return !!(
          a &&
          b &&
          a.width > 2 &&
          b.width > 2 &&
          !(a.right - slack <= b.left || a.left + slack >= b.right || a.bottom - slack <= b.top || a.top + slack >= b.bottom)
        );
      };
      const box = (el) => (el && !el.hidden ? el.getBoundingClientRect() : null);
      const pairs = (rects, slack) => {
        let n = 0;
        for (let i = 0; i < rects.length; i++) {
          for (let j = i + 1; j < rects.length; j++) if (hit(rects[i], rects[j], slack)) n++;
        }
        return n;
      };
      const ws = box(document.getElementById("workspaces"));
      const ego = box(document.getElementById("egoBtn"));
      const legend = box(document.getElementById("legend"));
      const stage = box(document.querySelector("#canvas .stage"));
      const title = box(document.querySelector("#canvas .stage > .flow-title"));
      const chips = [...document.querySelectorAll("#legend .leg")]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 2 && r.height > 2);
      const cards = [...document.querySelectorAll(".bubble-card")].map((el) => el.getBoundingClientRect());
      const visible = cards.filter((c) => {
        if (!stage || c.width < 4 || c.height < 4) return false;
        return !(c.right <= stage.left || c.left >= stage.right || c.bottom <= stage.top || c.top >= stage.bottom);
      });
      return {
        wsEgo: hit(ws, ego),
        wsLegend: hit(ws, legend),
        chipHits: pairs(chips, 1),
        cardHits: pairs(visible, 4),
        titleHitsCard: !!(title && visible.some((c) => hit(title, c))),
        titleInsideViewport: !!document.querySelector(".viewport > .flow-title"),
        visible: visible.length,
        cards: cards.length,
        chips: chips.length,
      };
    });
    record(
      "R5c",
      "self-review Map caption and graph-bar do not overlap cards / Ego",
      !liveLayout.wsEgo &&
        !liveLayout.wsLegend &&
        !liveLayout.titleHitsCard &&
        !liveLayout.titleInsideViewport &&
        liveLayout.visible >= 2 &&
        liveLayout.chipHits === 0 &&
        liveLayout.cardHits === 0,
      JSON.stringify(liveLayout)
    );
    record(
      "R6",
      "self-review program chips name a Graphide crate",
      /graphide/i.test(liveMap.legend),
      liveMap.legend.slice(0, 120)
    );
    await shot(page, "self-review.png");

    const stampDirAfter = path.join(ROOT, ".graphide", "stamps");
    const wroteStampAfter = fs.existsSync(stampDirAfter) && fs.readdirSync(stampDirAfter).length > 0;
    record("R7", "Self-review step did not write .graphide/stamps/", !wroteStampAfter, wroteStampAfter ? fs.readdirSync(stampDirAfter).join(",") : "absent");

    const deltaSnap = loadDeltaSnap();
    const deltaGraph = assertDeltaSnap(deltaSnap);
    const deltaUrl = origin + DELTA_HARNESS;
    console.log("delta " + deltaUrl);
    await page.goto(deltaUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    const deltaBoot = await page
      .waitForFunction(
        () => {
          if (window.__graphideDeltaError) return "error";
          if (window.__graphideDelta === true && document.body.classList.contains("desk")) return "ok";
          const err = document.querySelector(".empty.error");
          if (err && /delta-snap/i.test(err.textContent || "")) return "error";
          return "";
        },
        null,
        { timeout: 25000 }
      )
      .then((h) => h.jsonValue())
      .catch((e) => "timeout:" + String(e && e.message ? e.message : e));

    const deltaHost = await page.evaluate(() => {
      const on = document.querySelector("#workspaces [data-ws].on");
      return {
        live: window.__graphideDelta === true,
        error: window.__graphideDeltaError || "",
        desk: document.body.classList.contains("desk"),
        ws: on ? on.getAttribute("data-ws") : "",
        empty: ((document.querySelector(".empty.error") || {}).textContent || "").trim(),
      };
    });
    if (deltaBoot !== "ok" || !deltaHost.live) {
      const why =
        deltaHost.error ||
        deltaHost.empty ||
        (deltaBoot && deltaBoot !== "ok" ? deltaBoot : "") ||
        "harness did not set window.__graphideDelta";
      record("D1", "delta desk loaded the demo vs demo-parent snap", false, why);
      failFast("desk could not be driven from the delta fixture — " + why);
    }
    record("D1", "delta desk loaded the demo vs demo-parent snap", true, deltaHost.ws);

    if (deltaHost.ws !== "delta") {
      await page.click('#workspaces [data-ws="delta"]');
      await page.waitForTimeout(200);
    }
    await page.waitForSelector("#deltaFacts .delta-fact", { timeout: 10000 });
    await page.waitForSelector("#deltaCanvas .react-flow__node", { timeout: 10000 });

    const deltaDesk = await page.evaluate(() => {
      const facts = [...document.querySelectorAll("#deltaFacts .delta-fact")];
      const views = [...document.querySelectorAll("#deltaView [data-delta-view]")].map((el) =>
        el.getAttribute("data-delta-view")
      );
      return {
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
        facts: facts.length,
        kinds: facts.map((el) => el.getAttribute("data-delta-kind")),
        text: facts.map((el) => (el.textContent || "").replace(/\s+/g, " ").trim()),
        sneaky: facts.some((el) => /sneaky_helper/.test(el.textContent || "")),
        views,
        play: !!document.getElementById("deltaPlay"),
        prev: !!document.getElementById("deltaPrev"),
        next: !!document.getElementById("deltaNext"),
        overview: !!document.getElementById("deltaOverview"),
        canvas: !!document.getElementById("deltaCanvas"),
        xy: document.querySelectorAll("#deltaCanvas .react-flow__node").length,
        xyFlow: !!document.querySelector("#deltaCanvas .react-flow"),
      };
    });
    record("D2", "Delta workspace is active", deltaDesk.ws === "delta", deltaDesk.ws);
    record(
      "D3",
      "Delta fact list is not empty on demo vs demo-parent",
      deltaDesk.facts > 0 && deltaDesk.facts >= Math.min(1, deltaGraph.facts),
      "facts=" + deltaDesk.facts + " kinds=" + deltaDesk.kinds.join(",")
    );
    record("D4", "Delta lists added crate::bus::sneaky_helper", deltaDesk.sneaky, deltaDesk.text.slice(0, 4).join(" | "));
    record(
      "D5",
      "Delta has Before / Delta / After plus Review walk controls",
      ["before", "delta", "after"].every((v) => deltaDesk.views.indexOf(v) >= 0) &&
        deltaDesk.play &&
        deltaDesk.prev &&
        deltaDesk.next &&
        deltaDesk.overview &&
        deltaDesk.canvas,
      JSON.stringify({ views: deltaDesk.views, play: deltaDesk.play, canvas: deltaDesk.canvas })
    );

    await page.click('#deltaView [data-delta-view="before"]');
    await page.waitForTimeout(150);
    await page.click('#deltaView [data-delta-view="after"]');
    await page.waitForTimeout(150);
    await page.click('#deltaView [data-delta-view="delta"]');
    await page.waitForTimeout(150);
    const viewAfter = await page.evaluate(() => {
      const canvas = document.getElementById("deltaCanvas");
      return canvas ? canvas.getAttribute("data-delta-view") : "";
    });
    record("D6", "Delta canvas three-state lands on Delta after the switcher", viewAfter === "delta", viewAfter);
    record(
      "D6b",
      "Delta canvas mounts XYFlow nodes (capped, not the raw IR)",
      deltaDesk.xyFlow && deltaDesk.xy > 1 && deltaDesk.xy <= 24,
      "xy=" + deltaDesk.xy
    );
    const deltaShapes = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#deltaCanvas .vnode[data-shape]")];
      return { n: nodes.length, shapes: [...new Set(nodes.map((el) => el.getAttribute("data-shape")))] };
    });
    record(
      "D6c",
      "Delta XYFlow nodes expose data-shape",
      deltaShapes.n > 1 && deltaShapes.n === deltaDesk.xy,
      "n=" + deltaShapes.n + " shapes=" + deltaShapes.shapes.join(",")
    );

    if (deltaDesk.overview) await page.click("#deltaOverview");
    await page.waitForTimeout(120);
    for (let i = 0; i < deltaDesk.facts + 2; i++) {
      await page.click("#deltaNext");
      await page.waitForTimeout(40);
    }
    const walked = await page.evaluate(() => {
      const on = document.querySelector("#deltaFacts .delta-fact.on");
      const play = document.getElementById("deltaPlay");
      const n = document.querySelectorAll("#deltaFacts .delta-fact").length;
      return {
        i: on ? on.getAttribute("data-delta-i") : "",
        n,
        playing: !!(play && play.getAttribute("aria-pressed") === "true"),
      };
    });
    record(
      "D7",
      "Delta Review walk is finite (stays on last fact, does not loop)",
      String(walked.i) === String(Math.max(0, walked.n - 1)) && !walked.playing,
      JSON.stringify(walked)
    );

    await shot(page, "delta.png");

    const stampDirDelta = path.join(ROOT, ".graphide", "stamps");
    const wroteStampDelta = fs.existsSync(stampDirDelta) && fs.readdirSync(stampDirDelta).length > 0;
    record(
      "D8",
      "Delta step did not write .graphide/stamps/",
      !wroteStampDelta,
      wroteStampDelta ? fs.readdirSync(stampDirDelta).join(",") : "absent"
    );

    const sequenceSnap = loadSequenceSnap();
    const sequenceGraph = assertSequenceSnap(sequenceSnap);
    const sequenceUrl = origin + SEQUENCE_HARNESS;
    console.log("sequence " + sequenceUrl);
    await page.goto(sequenceUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    const sequenceBoot = await page
      .waitForFunction(
        () => {
          if (window.__graphideSequenceError) return "error";
          if (window.__graphideSequence === true && document.body.classList.contains("desk")) return "ok";
          const err = document.querySelector(".empty.error");
          if (err && /sequence-snap/i.test(err.textContent || "")) return "error";
          return "";
        },
        null,
        { timeout: 25000 }
      )
      .then((h) => h.jsonValue())
      .catch((e) => "timeout:" + String(e && e.message ? e.message : e));

    const sequenceHost = await page.evaluate(() => {
      const on = document.querySelector("#workspaces [data-ws].on");
      return {
        live: window.__graphideSequence === true,
        error: window.__graphideSequenceError || "",
        desk: document.body.classList.contains("desk"),
        ws: on ? on.getAttribute("data-ws") : "",
        empty: ((document.querySelector(".empty.error") || {}).textContent || "").trim(),
      };
    });
    if (sequenceBoot !== "ok" || !sequenceHost.live) {
      const why =
        sequenceHost.error ||
        sequenceHost.empty ||
        (sequenceBoot && sequenceBoot !== "ok" ? sequenceBoot : "") ||
        "harness did not set window.__graphideSequence";
      record("Q1", "sequence desk loaded the fixtures/demo snap", false, why);
      failFast("desk could not be driven from the sequence fixture — " + why);
    }
    record("Q1", "sequence desk loaded the fixtures/demo snap", true, sequenceHost.ws);

    if (sequenceHost.ws !== "sequence") {
      await page.click('#workspaces [data-ws="sequence"]');
      await page.waitForTimeout(200);
    }
    await page.waitForSelector("#seqParts .seq-part", { timeout: 10000 });
    await page.waitForSelector("#seqHops .seq-hop", { timeout: 10000 });
    await page.waitForSelector("#seqCanvas .react-flow__node", { timeout: 10000 });

    const sequenceDesk = await page.evaluate(() => {
      const parts = [...document.querySelectorAll("#seqParts .seq-part")];
      const hops = [...document.querySelectorAll("#seqHops .seq-hop")];
      const idxs = hops.map((el) => el.getAttribute("data-seq-i"));
      const ordered = idxs.every((v, i) => String(v) === String(i));
      const text = [...parts, ...hops].map((el) => (el.textContent || "").replace(/\s+/g, " ").trim());
      return {
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
        parts: parts.length,
        hops: hops.length,
        ordered,
        kinds: hops.map((el) => el.getAttribute("data-kind")),
        text,
        subscribe: text.some((t) => /subscribe|events|Subscribes/i.test(t)),
        play: !!document.getElementById("seqPlay"),
        prev: !!document.getElementById("seqPrev"),
        next: !!document.getElementById("seqNext"),
        overview: !!document.getElementById("seqOverview"),
        canvas: !!document.getElementById("seqCanvas"),
        xy: document.querySelectorAll("#seqCanvas .react-flow__node").length,
        xyFlow: !!document.querySelector("#seqCanvas .react-flow"),
      };
    });
    record("Q2", "Sequence workspace is active", sequenceDesk.ws === "sequence", sequenceDesk.ws);
    record(
      "Q3",
      "Sequence has more than one participant",
      sequenceDesk.parts > 1 && sequenceDesk.parts >= Math.min(2, sequenceGraph.parts),
      "parts=" + sequenceDesk.parts + " " + sequenceDesk.text.slice(0, 3).join(" | ")
    );
    record(
      "Q4",
      "Sequence has an ordered hop list",
      sequenceDesk.hops >= 1 && sequenceDesk.ordered,
      "hops=" + sequenceDesk.hops + " kinds=" + sequenceDesk.kinds.join(",")
    );
    record(
      "Q5",
      "Sequence lists subscribe / events on the demo slice",
      sequenceDesk.subscribe,
      sequenceDesk.text.slice(0, 4).join(" | ")
    );
    record(
      "Q6",
      "Sequence has Play / Prev / Next plus canvas",
      sequenceDesk.play && sequenceDesk.prev && sequenceDesk.next && sequenceDesk.overview && sequenceDesk.canvas,
      JSON.stringify({ play: sequenceDesk.play, canvas: sequenceDesk.canvas })
    );
    record(
      "Q6b",
      "Sequence canvas mounts XYFlow participant nodes (not the raw IR)",
      sequenceDesk.xyFlow && sequenceDesk.xy > 1 && sequenceDesk.xy <= 48,
      "xy=" + sequenceDesk.xy + " parts=" + sequenceDesk.parts
    );
    const seqShapes = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#seqCanvas .vnode[data-shape]")];
      const shapes = [...new Set(nodes.map((el) => el.getAttribute("data-shape")))];
      return {
        n: nodes.length,
        shapes,
        fn: nodes.some((el) => el.getAttribute("data-shape") === "fn"),
        endpoint: nodes.some((el) => el.getAttribute("data-shape") === "endpoint"),
      };
    });
    record(
      "Q6c",
      "Sequence XYFlow nodes expose data-shape with fn + endpoint",
      seqShapes.n > 1 && seqShapes.fn && seqShapes.endpoint,
      "n=" + seqShapes.n + " shapes=" + seqShapes.shapes.join(",")
    );

    if (sequenceDesk.overview) await page.click("#seqOverview");
    await page.waitForTimeout(120);
    for (let i = 0; i < sequenceDesk.hops + 2; i++) {
      await page.click("#seqNext");
      await page.waitForTimeout(40);
    }
    const seqWalked = await page.evaluate(() => {
      const on = document.querySelector("#seqHops .seq-hop.on");
      const play = document.getElementById("seqPlay");
      const n = document.querySelectorAll("#seqHops .seq-hop").length;
      return {
        i: on ? on.getAttribute("data-seq-i") : "",
        n,
        playing: !!(play && play.getAttribute("aria-pressed") === "true"),
      };
    });
    record(
      "Q7",
      "Sequence Play walk is finite (stays on last hop, does not loop)",
      String(seqWalked.i) === String(Math.max(0, seqWalked.n - 1)) && !seqWalked.playing,
      JSON.stringify(seqWalked)
    );

    await shot(page, "sequence.png");

    const stampDirSeq = path.join(ROOT, ".graphide", "stamps");
    const wroteStampSeq = fs.existsSync(stampDirSeq) && fs.readdirSync(stampDirSeq).length > 0;
    record(
      "Q8",
      "Sequence step did not write .graphide/stamps/",
      !wroteStampSeq,
      wroteStampSeq ? fs.readdirSync(stampDirSeq).join(",") : "absent"
    );

    const dataflowSnap = loadDataflowSnap();
    const dataflowGraph = assertDataflowSnap(dataflowSnap);
    const dataflowUrl = origin + DATAFLOW_HARNESS;
    console.log("dataflow " + dataflowUrl);
    await page.goto(dataflowUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    const dataflowBoot = await page
      .waitForFunction(
        () => {
          if (window.__graphideDataflowError) return "error";
          if (window.__graphideDataflow === true && document.body.classList.contains("desk")) return "ok";
          const err = document.querySelector(".empty.error");
          if (err && /dataflow-snap/i.test(err.textContent || "")) return "error";
          return "";
        },
        null,
        { timeout: 25000 }
      )
      .then((h) => h.jsonValue())
      .catch((e) => "timeout:" + String(e && e.message ? e.message : e));

    const dataflowHost = await page.evaluate(() => {
      const on = document.querySelector("#workspaces [data-ws].on");
      return {
        live: window.__graphideDataflow === true,
        error: window.__graphideDataflowError || "",
        desk: document.body.classList.contains("desk"),
        ws: on ? on.getAttribute("data-ws") : "",
        empty: ((document.querySelector(".empty.error") || {}).textContent || "").trim(),
      };
    });
    if (dataflowBoot !== "ok" || !dataflowHost.live) {
      const why =
        dataflowHost.error ||
        dataflowHost.empty ||
        (dataflowBoot && dataflowBoot !== "ok" ? dataflowBoot : "") ||
        "harness did not set window.__graphideDataflow";
      record("F1", "dataflow desk loaded the fixtures/demo snap", false, why);
      failFast("desk could not be driven from the dataflow fixture — " + why);
    }
    record("F1", "dataflow desk loaded the fixtures/demo snap", true, dataflowHost.ws);

    if (dataflowHost.ws !== "dataflow") {
      await page.click('#workspaces [data-ws="dataflow"]');
      await page.waitForTimeout(200);
    }
    await page.waitForSelector("#dfCanvas .df-node", { timeout: 10000 });
    await page.waitForSelector("#dfHops .df-hop", { timeout: 10000 });
    await page.waitForSelector("#dfCanvas .react-flow__node", { timeout: 10000 });

    const dataflowDesk = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#dfCanvas .df-node")];
      const hops = [...document.querySelectorAll("#dfHops .df-hop")];
      const idxs = hops.map((el) => el.getAttribute("data-df-i"));
      const ordered = idxs.every((v, i) => String(v) === String(i));
      const text = [...nodes, ...hops].map((el) => (el.textContent || "").replace(/\s+/g, " ").trim());
      const sources = nodes.filter((el) => el.getAttribute("data-df-role") === "source");
      const sinks = nodes.filter((el) => el.getAttribute("data-df-role") === "sink");
      return {
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
        nodes: nodes.length,
        hops: hops.length,
        ordered,
        sources: sources.length,
        sinks: sinks.length,
        roles: nodes.map((el) => el.getAttribute("data-df-role")),
        kinds: hops.map((el) => el.getAttribute("data-kind")),
        text,
        subscribe: text.some((t) => /subscribe|publish|events|Subscribes|Publishes/i.test(t)),
        play: !!document.getElementById("dfPlay"),
        prev: !!document.getElementById("dfPrev"),
        next: !!document.getElementById("dfNext"),
        overview: !!document.getElementById("dfOverview"),
        canvas: !!document.getElementById("dfCanvas"),
        xy: document.querySelectorAll("#dfCanvas .react-flow__node").length,
        xyFlow: !!document.querySelector("#dfCanvas .react-flow"),
      };
    });
    record("F2", "Data-flow workspace is active", dataflowDesk.ws === "dataflow", dataflowDesk.ws);
    record(
      "F3",
      "Data-flow path has a Source and a Sink",
      dataflowDesk.sources >= 1 && dataflowDesk.sinks >= 1 && dataflowDesk.nodes >= Math.min(2, dataflowGraph.nodes),
      "roles=" + dataflowDesk.roles.join(",") + " " + dataflowDesk.text.slice(0, 3).join(" | ")
    );
    record(
      "F4",
      "Data-flow has an ordered hop list",
      dataflowDesk.hops >= 1 && dataflowDesk.ordered,
      "hops=" + dataflowDesk.hops + " kinds=" + dataflowDesk.kinds.join(",")
    );
    record(
      "F5",
      "Data-flow lists subscribe / publish / events on the demo slice",
      dataflowDesk.subscribe,
      dataflowDesk.text.slice(0, 4).join(" | ")
    );
    record(
      "F6",
      "Data-flow has Play / Prev / Next plus canvas",
      dataflowDesk.play && dataflowDesk.prev && dataflowDesk.next && dataflowDesk.overview && dataflowDesk.canvas,
      JSON.stringify({ play: dataflowDesk.play, canvas: dataflowDesk.canvas })
    );
    record(
      "F6b",
      "Data-flow canvas mounts XYFlow nodes (capped, not the raw IR)",
      dataflowDesk.xyFlow && dataflowDesk.xy > 1 && dataflowDesk.xy <= 48,
      "xy=" + dataflowDesk.xy + " nodes=" + dataflowDesk.nodes
    );
    const dfShapes = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#dfCanvas .vnode[data-shape]")];
      const shapes = [...new Set(nodes.map((el) => el.getAttribute("data-shape")))];
      return {
        n: nodes.length,
        shapes,
        store: nodes.some((el) => el.getAttribute("data-shape") === "store"),
      };
    });
    record(
      "F6c",
      "Data-flow XYFlow nodes expose data-shape and a store cylinder",
      dfShapes.n > 1 && dfShapes.store,
      "n=" + dfShapes.n + " shapes=" + dfShapes.shapes.join(",")
    );

    if (dataflowDesk.overview) await page.click("#dfOverview");
    await page.waitForTimeout(120);
    for (let i = 0; i < dataflowDesk.hops + 2; i++) {
      await page.click("#dfNext");
      await page.waitForTimeout(40);
    }
    const dfWalked = await page.evaluate(() => {
      const on = document.querySelector("#dfHops .df-hop.on");
      const play = document.getElementById("dfPlay");
      const n = document.querySelectorAll("#dfHops .df-hop").length;
      return {
        i: on ? on.getAttribute("data-df-i") : "",
        n,
        playing: !!(play && play.getAttribute("aria-pressed") === "true"),
      };
    });
    record(
      "F7",
      "Data-flow Play walk is finite (stays on last hop, does not loop)",
      String(dfWalked.i) === String(Math.max(0, dfWalked.n - 1)) && !dfWalked.playing,
      JSON.stringify(dfWalked)
    );

    await shot(page, "dataflow.png");

    const stampDirDf = path.join(ROOT, ".graphide", "stamps");
    const wroteStampDf = fs.existsSync(stampDirDf) && fs.readdirSync(stampDirDf).length > 0;
    record(
      "F8",
      "Data-flow step did not write .graphide/stamps/",
      !wroteStampDf,
      wroteStampDf ? fs.readdirSync(stampDirDf).join(",") : "absent"
    );

    const lifecycleSnap = loadLifecycleSnap();
    const lifecycleGraph = assertLifecycleSnap(lifecycleSnap);
    const lifecycleUrl = origin + LIFECYCLE_HARNESS;
    console.log("lifecycle " + lifecycleUrl);
    await page.goto(lifecycleUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    const lifecycleBoot = await page
      .waitForFunction(
        () => {
          if (window.__graphideLifecycleError) return "error";
          if (window.__graphideLifecycle === true && document.body.classList.contains("desk")) return "ok";
          const err = document.querySelector(".empty.error");
          if (err && /lifecycle-snap/i.test(err.textContent || "")) return "error";
          return "";
        },
        null,
        { timeout: 25000 }
      )
      .then((h) => h.jsonValue())
      .catch((e) => "timeout:" + String(e && e.message ? e.message : e));

    const lifecycleHost = await page.evaluate(() => {
      const on = document.querySelector("#workspaces [data-ws].on");
      return {
        live: window.__graphideLifecycle === true,
        error: window.__graphideLifecycleError || "",
        desk: document.body.classList.contains("desk"),
        ws: on ? on.getAttribute("data-ws") : "",
        empty: ((document.querySelector(".empty.error") || {}).textContent || "").trim(),
      };
    });
    if (lifecycleBoot !== "ok" || !lifecycleHost.live) {
      const why =
        lifecycleHost.error ||
        lifecycleHost.empty ||
        (lifecycleBoot && lifecycleBoot !== "ok" ? lifecycleBoot : "") ||
        "harness did not set window.__graphideLifecycle";
      record("L1", "lifecycle desk loaded the fixtures/demo snap", false, why);
      failFast("desk could not be driven from the lifecycle fixture — " + why);
    }
    record("L1", "lifecycle desk loaded the fixtures/demo snap", true, lifecycleHost.ws);

    if (lifecycleHost.ws !== "lifecycle") {
      await page.click('#workspaces [data-ws="lifecycle"]');
      await page.waitForTimeout(200);
    }
    await page.waitForSelector("#lcCanvas .lc-state", { timeout: 10000 });
    await page.waitForSelector("#lcTrans .lc-trans", { timeout: 10000 });
    await page.waitForSelector("#lcCanvas .react-flow__node", { timeout: 10000 });

    const lifecycleDesk = await page.evaluate(() => {
      const states = [...document.querySelectorAll("#lcCanvas .lc-state")];
      const hops = [...document.querySelectorAll("#lcTrans .lc-trans")];
      const idxs = hops.map((el) => el.getAttribute("data-lc-i"));
      const ordered = idxs.every((v, i) => String(v) === String(i));
      const text = [
        ...states,
        ...hops,
        ...document.querySelectorAll("#lcEnds .lc-end"),
      ].map((el) => (el.textContent || "").replace(/\s+/g, " ").trim());
      const types = states.map((el) => el.getAttribute("data-lc-type"));
      const recover = hops.some(
        (el) => el.getAttribute("data-from") === "broken" && el.getAttribute("data-to") === "walking"
      );
      return {
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
        states: states.length,
        hops: hops.length,
        ordered,
        types,
        recover,
        proposed: states.some((el) => el.getAttribute("data-lc-id") === "proposed"),
        walking: states.some((el) => el.getAttribute("data-lc-id") === "walking"),
        broken: states.some((el) => el.getAttribute("data-lc-id") === "broken"),
        events: text.some((t) => /events|Endpoint|Proposed|Walking|Broken|recover/i.test(t)),
        play: !!document.getElementById("lcPlay"),
        prev: !!document.getElementById("lcPrev"),
        next: !!document.getElementById("lcNext"),
        overview: !!document.getElementById("lcOverview"),
        canvas: !!document.getElementById("lcCanvas"),
        xy: document.querySelectorAll("#lcCanvas .react-flow__node").length,
        xyFlow: !!document.querySelector("#lcCanvas .react-flow"),
        text,
      };
    });
    record("L2", "Lifecycle workspace is active", lifecycleDesk.ws === "lifecycle", lifecycleDesk.ws);
    record(
      "L3",
      "Lifecycle has proposed / walking / broken states",
      lifecycleDesk.states >= Math.min(6, lifecycleGraph.states) &&
        lifecycleDesk.proposed &&
        lifecycleDesk.walking &&
        lifecycleDesk.broken,
      "types=" + lifecycleDesk.types.join(",") + " " + lifecycleDesk.text.slice(0, 3).join(" | ")
    );
    record(
      "L4",
      "Lifecycle has an ordered event list",
      lifecycleDesk.hops >= 1 && lifecycleDesk.ordered,
      "events=" + lifecycleDesk.hops
    );
    record(
      "L5",
      "Lifecycle recover is broken → walking (and lists events)",
      lifecycleDesk.recover && lifecycleDesk.events,
      lifecycleDesk.text.slice(0, 4).join(" | ")
    );
    record(
      "L6",
      "Lifecycle has Play / Prev / Next plus canvas",
      lifecycleDesk.play && lifecycleDesk.prev && lifecycleDesk.next && lifecycleDesk.overview && lifecycleDesk.canvas,
      JSON.stringify({ play: lifecycleDesk.play, canvas: lifecycleDesk.canvas })
    );
    record(
      "L6b",
      "Lifecycle canvas mounts XYFlow review-machine nodes",
      lifecycleDesk.xyFlow && lifecycleDesk.xy > 1 && lifecycleDesk.xy <= 24,
      "xy=" + lifecycleDesk.xy + " states=" + lifecycleDesk.states
    );
    const lcShapes = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#lcCanvas .vnode[data-shape]")];
      const shapes = [...new Set(nodes.map((el) => el.getAttribute("data-shape")))];
      return {
        n: nodes.length,
        shapes,
        start: nodes.some((el) => el.getAttribute("data-shape") === "start"),
        decision: nodes.some((el) => el.getAttribute("data-shape") === "decision"),
      };
    });
    record(
      "L6c",
      "Lifecycle XYFlow nodes expose data-shape with start + decision",
      lcShapes.n > 1 && lcShapes.start && lcShapes.decision,
      "n=" + lcShapes.n + " shapes=" + lcShapes.shapes.join(",")
    );

    if (lifecycleDesk.overview) await page.click("#lcOverview");
    await page.waitForTimeout(120);
    for (let i = 0; i < lifecycleDesk.hops + 2; i++) {
      await page.click("#lcNext");
      await page.waitForTimeout(40);
    }
    const lcWalked = await page.evaluate(() => {
      const on = document.querySelector("#lcTrans .lc-trans.on");
      const play = document.getElementById("lcPlay");
      const n = document.querySelectorAll("#lcTrans .lc-trans").length;
      return {
        i: on ? on.getAttribute("data-lc-i") : "",
        n,
        playing: !!(play && play.getAttribute("aria-pressed") === "true"),
      };
    });
    record(
      "L7",
      "Lifecycle Play walk is finite (stays on last event, does not loop)",
      String(lcWalked.i) === String(Math.max(0, lcWalked.n - 1)) && !lcWalked.playing,
      JSON.stringify(lcWalked)
    );

    await shot(page, "lifecycle.png");

    const stampDirLc = path.join(ROOT, ".graphide", "stamps");
    const wroteStampLc = fs.existsSync(stampDirLc) && fs.readdirSync(stampDirLc).length > 0;
    record(
      "L8",
      "Lifecycle step did not write .graphide/stamps/",
      !wroteStampLc,
      wroteStampLc ? fs.readdirSync(stampDirLc).join(",") : "absent"
    );

    const lineageUrl = origin + LINEAGE_HARNESS;
    console.log("lineage " + lineageUrl);
    await page.goto(lineageUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    const lineageBoot = await page
      .waitForFunction(
        () => {
          if (window.__graphideLineageError) return "error";
          if (window.__graphideLineage && document.body.classList.contains("desk")) return "ok";
          const err = document.querySelector(".empty.error");
          if (err && /sequence-snap|lineage/i.test(err.textContent || "")) return "error";
          return "";
        },
        null,
        { timeout: 25000 }
      )
      .then((h) => h.jsonValue())
      .catch((e) => "timeout:" + String(e && e.message ? e.message : e));
    const lineageHost = await page.evaluate(() => ({
      live: !!window.__graphideLineage,
      error: window.__graphideLineageError || "",
      ws: ((document.querySelector("#workspaces [data-ws].on") || {}).getAttribute &&
        document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")) ||
        "",
      empty: ((document.querySelector(".empty.error") || {}).textContent || "").trim(),
    }));
    if (lineageBoot !== "ok" || !lineageHost.live) {
      const why =
        lineageHost.error ||
        lineageHost.empty ||
        (lineageBoot && lineageBoot !== "ok" ? lineageBoot : "") ||
        "harness did not load the lineage fixture";
      record("Y1", "lineage desk loaded the fixtures/demo snap", false, why);
      failFast("desk could not be driven from the lineage fixture — " + why);
    }
    record("Y1", "lineage desk loaded the fixtures/demo snap", true, lineageHost.ws);
    if (lineageHost.ws !== "lineage") {
      await page.click('#workspaces [data-ws="lineage"]');
      await page.waitForTimeout(200);
    }
    await page.waitForSelector("#lineageCanvas .react-flow__node, .ego-node", { timeout: 10000 });
    await page.waitForTimeout(200);

    const pickBothSides = await page.evaluate(() => {
      const rec = window.__graphideLineage || {};
      if (rec.up >= 1 && rec.down >= 1) return { ok: true, via: "seed" };
      const down = document.querySelector('#lineageCanvas .ego-node[data-side="down"]');
      if (down) {
        down.click();
        return { ok: true, via: "down" };
      }
      const hop = [...document.querySelectorAll("#lineageHops .expl-card.hop, .expl-card.hop")].find((el) =>
        /encode|decode/i.test(el.textContent || "")
      );
      if (hop) {
        hop.click();
        return { ok: true, via: "hop" };
      }
      return { ok: false, via: "" };
    });
    if (pickBothSides.via === "down" || pickBothSides.via === "hop") {
      await page.waitForTimeout(250);
    }

    const lineageDesk = await page.evaluate(() => {
      const rec = window.__graphideLineage || {};
      const xy = document.querySelectorAll("#lineageCanvas .react-flow__node").length;
      const focus = document.querySelectorAll('#lineageCanvas .ego-node[data-side="focus"], .ego-node.ego').length;
      const up = document.querySelectorAll('#lineageCanvas .ego-node[data-side="up"]').length;
      const down = document.querySelectorAll('#lineageCanvas .ego-node[data-side="down"]').length;
      const hops = document.querySelectorAll("#lineageHops .expl-card.hop, .expl-list.hops .expl-card.hop").length;
      const kinds = rec.kinds || [];
      const pane = document.getElementById("sourcePane");
      return {
        ws: ((document.querySelector("#workspaces [data-ws].on") || {}).getAttribute &&
          document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")) ||
          "",
        xy,
        xyFlow: !!document.querySelector("#lineageCanvas .react-flow"),
        focus: focus >= 1 || !!rec.focus,
        up: Math.max(up, rec.up || 0),
        down: Math.max(down, rec.down || 0),
        hops,
        kinds,
        fqn: rec.fqn || "",
        evidence: !!(pane && !pane.hidden),
      };
    });
    record("Y2", "Lineage workspace is active", lineageDesk.ws === "lineage", lineageDesk.ws);
    record("Y3", "Lineage focus node is present", lineageDesk.focus, lineageDesk.fqn);
    record(
      "Y4",
      "Lineage XYFlow nodes > 1 on a Calls fixture (capped, not the raw IR)",
      lineageDesk.xyFlow && lineageDesk.xy > 1 && lineageDesk.xy <= 48,
      "xy=" + lineageDesk.xy + " hops=" + lineageDesk.hops
    );
    const lineageShapes = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#lineageCanvas .vnode[data-shape]")];
      return { n: nodes.length, shapes: [...new Set(nodes.map((el) => el.getAttribute("data-shape")))] };
    });
    record(
      "Y4b",
      "Lineage XYFlow nodes expose data-shape",
      lineageShapes.n > 1 && lineageShapes.n === lineageDesk.xy,
      "n=" + lineageShapes.n + " shapes=" + lineageShapes.shapes.join(",")
    );
    record(
      "Y5",
      "Lineage has upstream and downstream when the fixture has both",
      lineageDesk.up >= 1 && lineageDesk.down >= 1,
      "up=" + lineageDesk.up + " down=" + lineageDesk.down + " via=" + pickBothSides.via + " fqn=" + lineageDesk.fqn
    );

    await page.click('#workspaces [data-ws="dataflow"]');
    await page.waitForSelector("#dfCanvas .df-node, #dfHops .df-hop", { timeout: 10000 });
    await page.evaluate(() => {
      const ev = [...document.querySelectorAll("#dfCanvas .df-node, .df-node")].find((el) =>
        /events/i.test((el.getAttribute("data-fqn") || "") + (el.textContent || ""))
      );
      if (ev) ev.click();
    });
    await page.waitForTimeout(150);
    await page.click('#workspaces [data-ws="lineage"]');
    await page.waitForSelector("#lineageCanvas .react-flow__node, .ego-node", { timeout: 10000 });
    await page.waitForTimeout(200);
    const lineageData = await page.evaluate(() => {
      const rec = window.__graphideLineage || {};
      const kinds = rec.kinds || [];
      const text = [
        rec.fqn || "",
        rec.kind || "",
        ...kinds,
        ...[...document.querySelectorAll("#lineageHops .expl-card.hop, .prov-col .expl-card.hop")].map((el) =>
          (el.textContent || "").trim()
        ),
      ].join(" ");
      return {
        fqn: rec.fqn || "",
        kind: rec.kind || "",
        kinds,
        data:
          kinds.some((k) => /Reads|Writes|Publishes|Subscribes/.test(k)) ||
          /Reads|Writes|Publishes|Subscribes/.test(text),
        contains: kinds.some((k) => k === "Contains") || /(^|\s)Contains(\s|$)/.test(text),
        events: /events/i.test(rec.fqn || "") || /Endpoint/i.test(rec.kind || ""),
      };
    });
    record(
      "Y6",
      "Type/Endpoint lineage shows Reads/Writes/Publishes/Subscribes, not Contains",
      lineageData.data && !lineageData.contains && lineageData.events,
      "fqn=" + lineageData.fqn + " kind=" + lineageData.kind + " kinds=" + lineageData.kinds.join(",")
    );

    const evClick = await page.evaluate(() => {
      const node = document.querySelector("#lineageCanvas .ego-node[data-id]");
      if (node) node.click();
      const pane = document.getElementById("sourcePane");
      return {
        clicked: !!node,
        open: !!(pane && !pane.hidden),
        kicker: ((document.querySelector(".src-k") || {}).textContent || "").trim(),
        title: ((document.getElementById("srcTitle") || {}).textContent || "").trim(),
      };
    });
    record(
      "Y7",
      "Evidence still opens from a Lineage node click",
      evClick.open && /Evidence/i.test(evClick.kicker),
      evClick.kicker + " " + evClick.title
    );

    await page.click('#workspaces [data-ws="map"]');
    await page.waitForTimeout(200);
    const lineageMap = await page.evaluate(() => ({
      xy: document.querySelectorAll(".react-flow__node").length,
      cards: document.querySelectorAll(".bubble-card").length,
    }));
    record(
      "Y8",
      "Map stays community LOD after Lineage (xy=0, cap 24)",
      lineageMap.xy === 0 && lineageMap.cards <= 24,
      "xy=" + lineageMap.xy + " cards=" + lineageMap.cards
    );

    await page.click('#workspaces [data-ws="lineage"]');
    await page.waitForTimeout(200);
    await shot(page, "lineage.png");
    const stampDirLnEgo = path.join(ROOT, ".graphide", "stamps");
    const wroteStampLnEgo = fs.existsSync(stampDirLnEgo) && fs.readdirSync(stampDirLnEgo).length > 0;
    record(
      "Y9",
      "Lineage step did not write .graphide/stamps/",
      !wroteStampLnEgo,
      wroteStampLnEgo ? fs.readdirSync(stampDirLnEgo).join(",") : "absent"
    );

    const lineageDeltaUrl = origin + LINEAGE_DELTA_HARNESS;
    console.log("lineage-delta " + lineageDeltaUrl);
    await page.goto(lineageDeltaUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    const lineageDeltaBoot = await page
      .waitForFunction(
        () => {
          if (window.__graphideDeltaError) return "error";
          if (window.__graphideDelta === true && document.body.classList.contains("desk")) return "ok";
          const err = document.querySelector(".empty.error");
          if (err && /delta-snap/i.test(err.textContent || "")) return "error";
          return "";
        },
        null,
        { timeout: 25000 }
      )
      .then((h) => h.jsonValue())
      .catch((e) => "timeout:" + String(e && e.message ? e.message : e));
    if (lineageDeltaBoot !== "ok") failFast("lineage change-seed could not load the delta fixture — " + lineageDeltaBoot);
    if ((await page.evaluate(() => ((document.querySelector("#workspaces [data-ws].on") || {}).getAttribute && document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")) || "")) !== "lineage") {
      await page.click('#workspaces [data-ws="lineage"]');
    }
    await page.waitForSelector("#lineageCanvas .react-flow__node, .ego-node, .empty", { timeout: 10000 });
    await page.waitForTimeout(200);
    const lineageChanged = await page.evaluate(() => {
      const marked = document.querySelectorAll("#lineageCanvas .changed, .ego-node.changed, .vnode.changed").length;
      const rec = window.__graphideLineage || {};
      return { marked, focus: rec.focus || "", fqn: rec.fqn || "" };
    });
    record(
      "Y10",
      "When coverage.changed is present, a changed node is marked",
      lineageChanged.marked >= 1,
      "marked=" + lineageChanged.marked + " fqn=" + lineageChanged.fqn
    );

    const routeUrl = origin + SEQUENCE_HARNESS;
    console.log("route " + routeUrl);
    await page.goto(routeUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    const routeBoot = await page
      .waitForFunction(
        () => {
          if (window.__graphideSequenceError) return "error";
          if (window.__graphideSequence === true && document.body.classList.contains("desk")) return "ok";
          const err = document.querySelector(".empty.error");
          if (err && /sequence-snap/i.test(err.textContent || "")) return "error";
          return "";
        },
        null,
        { timeout: 25000 }
      )
      .then((h) => h.jsonValue())
      .catch((e) => "timeout:" + String(e && e.message ? e.message : e));
    if (routeBoot !== "ok") failFast("route desk could not load the sequence fixture — " + routeBoot);
    await page.waitForSelector("#seqParts .seq-part", { timeout: 10000 });
    await page.waitForSelector("#pathBtn", { timeout: 5000 });
    await page.evaluate(() => {
      const hop = [...document.querySelectorAll("#seqHops .seq-hop")].find((el) =>
        /subscribe|events|Subscribes/i.test(el.textContent || "")
      );
      if (hop) hop.click();
    });
    await page.waitForTimeout(120);
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
    await page.keyboard.press("r");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    await page.waitForTimeout(200);
    const routeDesk = await page.evaluate(() => {
      const rec = window.__graphideRoute || {};
      const hops = rec.hops || [];
      const nodes = rec.nodes || [];
      const lit = [...document.querySelectorAll(".on-route[data-id]")].map((el) => el.getAttribute("data-id"));
      const extraLit = lit.filter((id) => nodes.indexOf(id) < 0);
      const text = [
        (document.getElementById("routeStatus") || {}).textContent || "",
        ...[...document.querySelectorAll("#routeHops .route-hop")].map((el) => (el.textContent || "").trim()),
      ];
      return {
        open: !!rec.open,
        ok: !!rec.ok,
        hops: hops.length,
        nodes: nodes.length,
        extra: rec.extra,
        extraLit: extraLit.length,
        kinds: hops.map((h) => h.kind),
        subscribe: hops.some((h) => /Subscribes/i.test(h.kind || "")) || text.some((t) => /subscribe|events|Subscribes/i.test(t)),
        btn: !!(document.getElementById("pathBtn") && document.getElementById("pathBtn").classList.contains("on")),
        receipt: !!(document.getElementById("routeReceipt") && !document.getElementById("routeReceipt").hidden),
        play: !!document.getElementById("routePlay"),
        next: !!document.getElementById("routeNext"),
        text,
      };
    });
    record("RT1", "Route probe opened from R", routeDesk.open && routeDesk.btn && routeDesk.receipt, JSON.stringify({ open: routeDesk.open, btn: routeDesk.btn }));
    record(
      "RT2",
      "Route is a derived directed path with at least one hop",
      routeDesk.ok && routeDesk.hops >= 1 && routeDesk.nodes >= 2,
      "hops=" + routeDesk.hops + " nodes=" + routeDesk.nodes + " kinds=" + routeDesk.kinds.join(",")
    );
    record(
      "RT3",
      "Route includes subscribe / events (Subscribes)",
      routeDesk.subscribe,
      routeDesk.text.slice(0, 3).join(" | ")
    );
    record(
      "RT4",
      "Route lights only path nodes (no extra hops)",
      routeDesk.extra === 0 && routeDesk.extraLit === 0,
      "extra=" + routeDesk.extra + " extraLit=" + routeDesk.extraLit
    );
    record("RT5", "Route has Play / Next", routeDesk.play && routeDesk.next, "");
    if (routeDesk.next) {
      for (let i = 0; i < routeDesk.hops + 2; i++) {
        await page.click("#routeNext");
        await page.waitForTimeout(40);
      }
    }
    const routeWalked = await page.evaluate(() => {
      const rec = window.__graphideRoute || {};
      const play = document.getElementById("routePlay");
      return {
        i: rec.cursor,
        n: (rec.hops || []).length,
        playing: !!(play && play.getAttribute("aria-pressed") === "true"),
      };
    });
    record(
      "RT6",
      "Route journey is finite (stays on last hop, does not loop)",
      routeWalked.n >= 1 && String(routeWalked.i) === String(Math.max(0, routeWalked.n - 1)) && !routeWalked.playing,
      JSON.stringify(routeWalked)
    );
    await shot(page, "route.png");
    const stampDirRt = path.join(ROOT, ".graphide", "stamps");
    const wroteStampRt = fs.existsSync(stampDirRt) && fs.readdirSync(stampDirRt).length > 0;
    record("RT7", "Route step did not write .graphide/stamps/", !wroteStampRt, wroteStampRt ? fs.readdirSync(stampDirRt).join(",") : "absent");

    await page.keyboard.press("l");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    await page.waitForTimeout(200);
    const lensDesk = await page.evaluate(() => {
      const rec = window.__graphideLens || {};
      const roles = rec.roles || [];
      const lit = [...document.querySelectorAll(".lens-on")];
      const kinds = lit.map((el) => el.getAttribute("data-kind") || "").filter(Boolean);
      const compare = ((document.getElementById("lensCompare") || {}).textContent || "").trim();
      const third = kinds.filter((k) => k && k !== "Function" && k !== "Type" && k !== "Endpoint");
      return {
        open: !!rec.open,
        roles: roles,
        hits: rec.hits || lit.length,
        lit: lit.length,
        compare: compare,
        btn: !!(document.getElementById("lensBtn") && document.getElementById("lensBtn").classList.contains("on")),
        receipt: !!(document.getElementById("lensReceipt") && !document.getElementById("lensReceipt").hidden),
        fn: roles.indexOf("Function") >= 0 || /Function/i.test(compare),
        ep: roles.indexOf("Endpoint") >= 0 || /Endpoint/i.test(compare),
        third: third.length,
        kinds: kinds,
      };
    });
    record("LN1", "Lens opened from L", lensDesk.open && lensDesk.btn && lensDesk.receipt, JSON.stringify({ open: lensDesk.open, btn: lensDesk.btn }));
    record(
      "LN2",
      "Lens compares Function and Endpoint",
      lensDesk.fn && lensDesk.ep && lensDesk.roles.length >= 1 && lensDesk.roles.length <= 2,
      "roles=" + lensDesk.roles.join(",") + " compare=" + lensDesk.compare
    );
    record(
      "LN3",
      "Lens highlights matching nodes",
      lensDesk.hits >= 1 && lensDesk.lit >= 1,
      "hits=" + lensDesk.hits + " lit=" + lensDesk.lit
    );
    record(
      "LN4",
      "Lens does not invent a third kind",
      lensDesk.third === 0,
      lensDesk.kinds.join(",")
    );
    await shot(page, "lens.png");
    const stampDirLn = path.join(ROOT, ".graphide", "stamps");
    const wroteStampLn = fs.existsSync(stampDirLn) && fs.readdirSync(stampDirLn).length > 0;
    record("LN5", "Lens step did not write .graphide/stamps/", !wroteStampLn, wroteStampLn ? fs.readdirSync(stampDirLn).join(",") : "absent");
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }

  finish(
    "Harness `" +
      HARNESS +
      "` (chrome 17) then `" +
      LIVE_HARNESS +
      "` (self-review of this checkout) then `" +
      DELTA_HARNESS +
      "` (Architecture Delta on fixtures/demo vs demo-parent) then `" +
      SEQUENCE_HARNESS +
      "` (Sequence on fixtures/demo) then `" +
      DATAFLOW_HARNESS +
      "` (Data-flow on fixtures/demo) then `" +
      LIFECYCLE_HARNESS +
      "` (Lifecycle on fixtures/demo) then `" +
      LINEAGE_HARNESS +
      "` (Lineage on fixtures/demo) then `" +
      SEQUENCE_HARNESS +
      "` (Route / Lens on fixtures/demo) served from `extension/`.",
    "PASS verify-graphide · " +
      checks.length +
      "/" +
      checks.length +
      " · chrome 17/17 · self-review rust graph · map community · stamp posted · delta · sequence · dataflow · lifecycle · lineage · export · present · preset · route · lens"
  );
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  try {
    writeReport("Driver crashed: " + String(err && err.message ? err.message : err));
  } catch (e) {}
  console.error("FAIL verify-graphide · driver crashed");
  process.exit(1);
});
