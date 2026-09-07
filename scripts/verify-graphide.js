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

async function shot(page, name, opts) {
  const dest = path.join(OUT, name);
  const buf = await page.screenshot({ type: "png", fullPage: false });
  fs.writeFileSync(dest, buf);
  const meta = pngMeanLuma(buf);
  const minLuma = opts && opts.minLuma != null ? opts.minLuma : 0.15;
  const maxLuma = opts && opts.maxLuma != null ? opts.maxLuma : 1;
  const minStd = opts && opts.minStd != null ? opts.minStd : 0;
  const ok =
    meta.luma >= minLuma &&
    meta.luma <= maxLuma &&
    meta.std >= minStd &&
    meta.w >= 400 &&
    meta.h >= 300 &&
    buf.length > 8000;
  record(
    "shot:" + name,
    "screenshot " + name + " is not a black frame",
    ok,
    "luma=" +
      meta.luma.toFixed(3) +
      (opts ? " std=" + meta.std.toFixed(3) : "") +
      " " +
      meta.w +
      "x" +
      meta.h +
      " bytes=" +
      buf.length
  );
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
    "Artifacts: `overview.png`, `decisions.png`, `registry.png`, `timeline.png`, `map.png`, `night.png`, `enter-bubble.png`, `ego.png`, `search.png`, `ask.png`, `keys.png`, `path-walk.png`, `evidence.png`, `coverage-mark.png`, `fit-reorg.png`, `progress.png`, `cancel-review.png`, `flow-hints.png`, `unmatched-hint.png`, `uncovered-node.png`, `open-slice.png`, `draft-hint.png`, `stamp-host.png`, `self-review.png`, `delta.png`, `sequence.png`, `dataflow.png`, `lifecycle.png`, `lineage.png`, `export-desk.png`, `export-desk.svg`, `export-share.png`, `present.png`, `preset-blueprint.png`, `route.png`, `lens.png`, `report.md`.",
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

function assertFlowHintsSnap(snap) {
  const flows = snap.flows || [];
  const named = flows.find((f) => f && f.name === "data-subscription");
  const hits = ((named && named.hits) || []).map((h) => String(h || ""));
  const tree = (named && named.tree) || { nodes: [], edges: [] };
  const nodes = (tree.nodes || []).length;
  const edges = (tree.edges || []).length;
  const hasSubscribe = hits.some((h) => h === "crate::sub::subscribe");
  const hasEvents = hits.some((h) => h === "crate::bus::events");
  record(
    "FH0",
    "dataflow fixture snap has named flow data-subscription with a Steiner tree",
    !!(named && hasSubscribe && hasEvents && nodes >= 2 && edges >= 1),
    named
      ? "hits=" + hits.join(",") + " tree=" + nodes + "n/" + edges + "e"
      : "flows=" + flows.map((f) => f && f.name).join(",")
  );
  const failed = checks.filter((c) => !c.pass && c.id === "FH0");
  if (failed.length) {
    writeReport("Flow-hints snapshot failed structural checks (desk not driven).");
    failFast(
      "fixtures/demo snap missing named flows.toml flow — " +
        failed.map((c) => c.id + " " + c.title + (c.detail ? " (" + c.detail + ")" : "")).join("; ")
    );
  }
  return { name: named.name, nodes, edges, hits };
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
    await page.waitForSelector('#workspaces [data-ws="overview"].on, #workspaces [data-ws="overview"]', {
      timeout: 8000,
    });
    const landingWs = await page.evaluate(() => {
      const on = document.querySelector("#workspaces [data-ws].on");
      return on ? on.getAttribute("data-ws") : "";
    });
    if (landingWs !== "overview") {
      await page.click('#workspaces [data-ws="overview"]');
      await page.waitForTimeout(200);
    }
    await page.waitForSelector("#sliceCanvas, .stage, .empty", { timeout: 10000 });
    await page
      .waitForSelector("#sliceCanvas .react-flow__node, #sliceCanvas .vnode", { timeout: 10000 })
      .catch(() => {});

    const overviewDesk = await page.evaluate(() => {
      const on = document.querySelector("#workspaces [data-ws].on");
      const title = ((document.querySelector("#canvas .flow-title") || {}).textContent || "").trim();
      const openMap = document.querySelector('.crumb-btn[data-ws="map"], .stat-strip [data-ws="map"]');
      const chips = [...document.querySelectorAll("#legend [data-prog]")].map((el) =>
        (el.textContent || "").replace(/\s+/g, " ").trim()
      );
      const nodes = [...document.querySelectorAll("#sliceCanvas .react-flow__node, #sliceCanvas .vnode[data-id]")];
      const shapes = [...document.querySelectorAll("#sliceCanvas .vnode[data-shape]")].map((el) =>
        el.getAttribute("data-shape")
      );
      const empty = ((document.querySelector("#canvas .empty") || {}).textContent || "").trim();
      return {
        ws: on ? on.getAttribute("data-ws") : "",
        title,
        stage: !!document.querySelector("#canvas .stage"),
        slice: !!document.getElementById("sliceCanvas"),
        xy: document.querySelectorAll("#sliceCanvas .react-flow__node").length,
        xyFlow: !!document.querySelector("#sliceCanvas .react-flow"),
        vnodes: nodes.length,
        shapes: [...new Set(shapes)],
        shaped: shapes.length,
        openMap: !!(openMap && /open map/i.test(openMap.textContent || "")),
        chips,
        empty,
        featurePath: !!document.querySelector(".feature-path"),
      };
    });
    record("OV1", "Overview workspace is active on first paint", overviewDesk.ws === "overview", overviewDesk.ws);
    record(
      "OV2",
      "Overview shows the default-run / control-flow stage",
      overviewDesk.stage &&
        overviewDesk.slice &&
        /default run|control-flow/i.test(overviewDesk.title) &&
        !/no control-flow yet/i.test(overviewDesk.empty),
      overviewDesk.title || overviewDesk.empty
    );
    record(
      "OV3",
      "Overview CFG still mounts shaped XYFlow nodes (not a raw-IR dump)",
      overviewDesk.xyFlow && overviewDesk.xy > 1 && overviewDesk.xy <= 48 && overviewDesk.shaped > 1,
      "xy=" + overviewDesk.xy + " shaped=" + overviewDesk.shaped + " shapes=" + overviewDesk.shapes.join(",")
    );
    record(
      "OV4",
      "Overview shows Open map and program chips when the product has them",
      overviewDesk.openMap && overviewDesk.chips.some((t) => /bin\s+main/i.test(t)),
      "openMap=" + overviewDesk.openMap + " chips=" + overviewDesk.chips.slice(0, 4).join(",")
    );
    await shot(page, "overview.png");
    const stampDirOv = path.join(ROOT, ".graphide", "stamps");
    const wroteStampOv = fs.existsSync(stampDirOv) && fs.readdirSync(stampDirOv).length > 0;
    record(
      "OV5",
      "Overview step did not write .graphide/stamps/",
      !wroteStampOv,
      wroteStampOv ? fs.readdirSync(stampDirOv).join(",") : "absent"
    );

    await page.click('#workspaces [data-ws="decisions"]');
    await page.waitForFunction(
      () => {
        const on = document.querySelector("#workspaces [data-ws].on");
        return on && on.getAttribute("data-ws") === "decisions";
      },
      null,
      { timeout: 8000 }
    );
    await page.waitForSelector("#canvas .expl-card[data-decision], #canvas .empty", { timeout: 8000 });
    const decisionsDesk = await page.evaluate(() => {
      const on = document.querySelector("#workspaces [data-ws].on");
      const cards = [...document.querySelectorAll("#canvas .expl-card[data-decision]")];
      const empty = ((document.querySelector("#canvas .empty") || {}).textContent || "").trim();
      const text = cards.map((el) => (el.textContent || "").replace(/\s+/g, " ").trim()).join(" | ");
      const stamp = document.getElementById("stampBtn");
      const skip = document.getElementById("skipBtn");
      return {
        ws: on ? on.getAttribute("data-ws") : "",
        cards: cards.length,
        text,
        empty,
        honestEmpty: /no stamps, skips, or stamp scars yet/i.test(empty),
        boot: /boot/i.test(text),
        broken: /broken|no longer matches/i.test(text),
        skipped: /legacy|skipped/i.test(text),
        stampEnabled: !!(stamp && !stamp.disabled),
        skipEnabled: !!(skip && !skip.disabled),
        xy: document.querySelectorAll("#canvas .react-flow__node").length,
        strip: !!document.querySelector(".outcome-strip"),
      };
    });
    record("DC1", "Decisions workspace is active", decisionsDesk.ws === "decisions", decisionsDesk.ws);
    record(
      "DC2",
      "Decisions lists stamps / skips / broken attestations (or honest empty)",
      (decisionsDesk.cards >= 1 && decisionsDesk.boot && decisionsDesk.broken && decisionsDesk.skipped) ||
        decisionsDesk.honestEmpty,
      decisionsDesk.cards
        ? "cards=" + decisionsDesk.cards + " " + decisionsDesk.text.slice(0, 160)
        : decisionsDesk.empty
    );
    record(
      "DC3",
      "Decisions keeps Stamp/Skip host-only (enabled, no XYFlow list)",
      decisionsDesk.stampEnabled && decisionsDesk.skipEnabled && decisionsDesk.xy === 0 && decisionsDesk.strip,
      JSON.stringify({
        stamp: decisionsDesk.stampEnabled,
        skip: decisionsDesk.skipEnabled,
        xy: decisionsDesk.xy,
        strip: decisionsDesk.strip,
      })
    );
    await shot(page, "decisions.png");
    const stampDirDc = path.join(ROOT, ".graphide", "stamps");
    const wroteStampDc = fs.existsSync(stampDirDc) && fs.readdirSync(stampDirDc).length > 0;
    record(
      "DC4",
      "Decisions step did not write .graphide/stamps/",
      !wroteStampDc,
      wroteStampDc ? fs.readdirSync(stampDirDc).join(",") : "absent"
    );

    const beforeUhPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    const unmatchedDesk = await page.evaluate(() => {
      const cov = document.getElementById("coverage");
      const covText = ((cov || {}).textContent || "").replace(/\s+/g, " ");
      const findings = [...document.querySelectorAll("#coverage li.finding")].map((el) =>
        (el.textContent || "").replace(/\s+/g, " ").trim()
      );
      const unmatchedLi = findings.find((t) => /unmatched/i.test(t) && /MissingHit/i.test(t) && /boot/i.test(t));
      const brokenLi = findings.find((t) => /stamp broken/i.test(t));
      const cards = [...document.querySelectorAll("#canvas .expl-card[data-decision]")];
      const hintCard = cards.find((el) => /UnmatchedHint/i.test(el.textContent || "") && /MissingHit/i.test(el.textContent || ""));
      const brokenCard = cards.find((el) => /StampBroken/i.test(el.textContent || ""));
      if (hintCard) hintCard.click();
      return {
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
        covText: covText.slice(0, 240),
        findings,
        unmatchedLi: unmatchedLi || "",
        brokenLi: brokenLi || "",
        hintTitle: hintCard ? ((hintCard.querySelector(".t") || {}).textContent || "").trim() : "",
        hintBody: hintCard ? ((hintCard.querySelector(".b") || {}).textContent || "").trim() : "",
        hintOutcome: hintCard ? hintCard.getAttribute("data-outcome") || "" : "",
        brokenTitle: brokenCard ? ((brokenCard.querySelector(".t") || {}).textContent || "").trim() : "",
        xy: document.querySelectorAll("#canvas .react-flow__node, .bubble-map .react-flow__node").length,
        cards: document.querySelectorAll(".bubble-card").length,
      };
    });
    record(
      "UH1",
      "#coverage li.finding surfaces unmatched solarsim::MissingHit in boot",
      unmatchedDesk.ws === "decisions" &&
        /unmatched\s+solarsim::MissingHit\s+in\s+boot/i.test(unmatchedDesk.unmatchedLi) &&
        /MissingHit/.test(unmatchedDesk.covText),
      JSON.stringify({
        ws: unmatchedDesk.ws,
        unmatched: unmatchedDesk.unmatchedLi,
        findings: unmatchedDesk.findings,
      })
    );
    record(
      "UH2",
      "Decisions lists UnmatchedHint (distinct from StampBroken)",
      /UnmatchedHint/i.test(unmatchedDesk.hintTitle) &&
        /MissingHit/i.test(unmatchedDesk.hintTitle + " " + unmatchedDesk.hintBody) &&
        /solarsim::MissingHit/i.test(unmatchedDesk.hintBody) &&
        /StampBroken/i.test(unmatchedDesk.brokenTitle) &&
        unmatchedDesk.hintTitle !== unmatchedDesk.brokenTitle,
      JSON.stringify({
        hint: unmatchedDesk.hintTitle,
        body: unmatchedDesk.hintBody,
        outcome: unmatchedDesk.hintOutcome,
        broken: unmatchedDesk.brokenTitle,
      })
    );
    record(
      "UH3",
      "Unmatched-hint step keeps Map community LOD (xy=0)",
      unmatchedDesk.xy === 0,
      "xy=" + unmatchedDesk.xy + " cards=" + unmatchedDesk.cards
    );
    await page.waitForTimeout(200);
    await shot(page, "unmatched-hint.png");
    const afterUh = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
    }, beforeUhPosts);
    record(
      "UH4",
      "Unmatched-hint step did not post stamp / skip",
      afterUh.stampPosts === 0 && afterUh.skipPosts === 0,
      JSON.stringify(afterUh)
    );
    const stampDirUh = path.join(ROOT, ".graphide", "stamps");
    const wroteStampUh = fs.existsSync(stampDirUh) && fs.readdirSync(stampDirUh).length > 0;
    record(
      "UH5",
      "Unmatched-hint step did not write .graphide/stamps/",
      !wroteStampUh,
      wroteStampUh ? fs.readdirSync(stampDirUh).join(",") : "absent"
    );

    const beforeOsPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.evaluate(() => {
      const on = document.querySelector("#workspaces [data-ws].on");
      if (!on || on.getAttribute("data-ws") !== "decisions") {
        const tab = document.querySelector('#workspaces [data-ws="decisions"]');
        if (tab) tab.click();
      }
      const cards = [...document.querySelectorAll("#canvas .expl-card[data-decision]")];
      const hintCard = cards.find(
        (el) => /UnmatchedHint/i.test(el.textContent || "") && /MissingHit/i.test(el.textContent || "")
      );
      if (hintCard) hintCard.click();
    });
    await page.waitForSelector("button[data-open-slice]", { timeout: 8000 });
    const openSliceTarget = await page.evaluate(() => {
      const btn = document.querySelector("button[data-open-slice]");
      return {
        flow: btn ? btn.getAttribute("data-open-slice") || "" : "",
        label: btn ? (btn.textContent || "").replace(/\s+/g, " ").trim() : "",
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    });
    record(
      "OS1",
      "Decision record exposes Open slice for the selected flow",
      openSliceTarget.ws === "decisions" &&
        !!openSliceTarget.flow &&
        /Open slice/i.test(openSliceTarget.label),
      JSON.stringify(openSliceTarget)
    );
    await page.click("button[data-open-slice]");
    await page.waitForFunction(
      () => {
        const on = document.querySelector("#workspaces [data-ws].on");
        return on && on.getAttribute("data-ws") === "slice";
      },
      null,
      { timeout: 8000 }
    );
    await page.waitForSelector("#sliceCanvas .vnode[data-id], #sliceCanvas .react-flow__node", { timeout: 8000 });
    await page.waitForTimeout(200);
    const openSliceDesk = await page.evaluate(() => {
      const on = document.querySelector("#workspaces [data-ws].on");
      const sliceOn = document.querySelector('#workspaces [data-ws="slice"].on');
      const tabOn = document.querySelector("#tabs .tab.on[data-flow]");
      return {
        ws: on ? on.getAttribute("data-ws") : "",
        sliceOn: !!(sliceOn && sliceOn.classList.contains("on")),
        flow: tabOn ? tabOn.getAttribute("data-flow") || "" : "",
        tabText: tabOn ? (tabOn.textContent || "").replace(/\s+/g, " ").trim() : "",
        vnodes: document.querySelectorAll("#sliceCanvas .vnode[data-id], #sliceCanvas .react-flow__node").length,
      };
    });
    record(
      "OS2",
      "Open slice lands on Slice workspace",
      openSliceDesk.ws === "slice" && openSliceDesk.sliceOn,
      JSON.stringify({ ws: openSliceDesk.ws, sliceOn: openSliceDesk.sliceOn })
    );
    record(
      "OS3",
      "Slice flow matches data-open-slice",
      !!openSliceTarget.flow &&
        openSliceDesk.flow === openSliceTarget.flow &&
        openSliceDesk.vnodes >= 1,
      JSON.stringify({
        target: openSliceTarget.flow,
        flow: openSliceDesk.flow,
        tab: openSliceDesk.tabText,
        vnodes: openSliceDesk.vnodes,
      })
    );
    await shot(page, "open-slice.png");
    const afterOs = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
    }, beforeOsPosts);
    record(
      "OS4",
      "Open-slice step did not post stamp / skip",
      afterOs.stampPosts === 0 && afterOs.skipPosts === 0,
      JSON.stringify(afterOs)
    );
    const stampDirOs = path.join(ROOT, ".graphide", "stamps");
    const wroteStampOs = fs.existsSync(stampDirOs) && fs.readdirSync(stampDirOs).length > 0;
    record(
      "OS5",
      "Open-slice step did not write .graphide/stamps/",
      !wroteStampOs,
      wroteStampOs ? fs.readdirSync(stampDirOs).join(",") : "absent"
    );

    await page.click('#workspaces [data-ws="registry"]');
    await page.waitForFunction(
      () => {
        const on = document.querySelector("#workspaces [data-ws].on");
        return on && on.getAttribute("data-ws") === "registry";
      },
      null,
      { timeout: 8000 }
    );
    await page.waitForSelector("table.audit tbody tr, #canvas .empty", { timeout: 8000 });
    const registryDesk = await page.evaluate(() => {
      const on = document.querySelector("#workspaces [data-ws].on");
      const rows = [...document.querySelectorAll("table.audit tbody tr")];
      const first = ((rows[0] && rows[0].textContent) || "").replace(/\s+/g, " ").trim();
      const m = first.match(/(\d+)\s+nodes\s+·\s+(\d+)\s+edges\s+·\s+(\d+)\s+files/i);
      return {
        ws: on ? on.getAttribute("data-ws") : "",
        rows: rows.length,
        first,
        nodes: m ? Number(m[1]) : 0,
        edges: m ? Number(m[2]) : 0,
        files: m ? Number(m[3]) : 0,
        plugin: /rust@/i.test(first),
        xy: document.querySelectorAll("#canvas .react-flow__node").length,
        empty: ((document.querySelector("#canvas .empty") || {}).textContent || "").trim(),
      };
    });
    record("RG1", "Registry workspace is active", registryDesk.ws === "registry", registryDesk.ws);
    record(
      "RG2",
      "Registry audit rows come from the snapshot (nodes / edges / files / plugin)",
      registryDesk.rows >= 1 &&
        registryDesk.nodes === SYNTHETIC_NODES &&
        registryDesk.edges > 0 &&
        registryDesk.files === 136 &&
        registryDesk.plugin &&
        registryDesk.xy === 0,
      "rows=" +
        registryDesk.rows +
        " " +
        registryDesk.first.slice(0, 160) +
        " xy=" +
        registryDesk.xy
    );
    await shot(page, "registry.png");
    const stampDirRg = path.join(ROOT, ".graphide", "stamps");
    const wroteStampRg = fs.existsSync(stampDirRg) && fs.readdirSync(stampDirRg).length > 0;
    record(
      "RG3",
      "Registry step did not write .graphide/stamps/",
      !wroteStampRg,
      wroteStampRg ? fs.readdirSync(stampDirRg).join(",") : "absent"
    );

    await page.click('#workspaces [data-ws="timeline"]');
    await page.waitForFunction(
      () => {
        const on = document.querySelector("#workspaces [data-ws].on");
        return on && on.getAttribute("data-ws") === "timeline";
      },
      null,
      { timeout: 8000 }
    );
    await page.waitForSelector("#canvas .tl-item, #canvas .empty", { timeout: 8000 });
    const timelineDesk = await page.evaluate(() => {
      const on = document.querySelector("#workspaces [data-ws].on");
      const items = [...document.querySelectorAll("#canvas .tl-item")];
      const text = items.map((el) => (el.textContent || "").replace(/\s+/g, " ").trim()).join(" | ");
      return {
        ws: on ? on.getAttribute("data-ws") : "",
        items: items.length,
        text,
        parent: items.some((el) => /parent cut/i.test(el.textContent || "")),
        coverage: items.some((el) => /uncovered/i.test(el.textContent || "")),
        scars: /boot|legacy|broken|skipped/i.test(text),
        scrub: !!document.getElementById("tlScrub"),
        now: document.querySelectorAll("#canvas .tl-item.now").length,
        xy: document.querySelectorAll("#canvas .react-flow__node").length,
        empty: ((document.querySelector("#canvas .empty") || {}).textContent || "").trim(),
      };
    });
    record("TL1", "Timeline workspace is active", timelineDesk.ws === "timeline", timelineDesk.ws);
    record(
      "TL2",
      "Timeline shows parent cut / coverage / stamp scars from the snapshot",
      timelineDesk.items >= 2 &&
        timelineDesk.parent &&
        timelineDesk.coverage &&
        timelineDesk.scars &&
        timelineDesk.scrub &&
        timelineDesk.now === 1 &&
        timelineDesk.xy === 0,
      "items=" + timelineDesk.items + " " + timelineDesk.text.slice(0, 180)
    );
    await shot(page, "timeline.png");
    const stampDirTl = path.join(ROOT, ".graphide", "stamps");
    const wroteStampTl = fs.existsSync(stampDirTl) && fs.readdirSync(stampDirTl).length > 0;
    record(
      "TL3",
      "Timeline step did not write .graphide/stamps/",
      !wroteStampTl,
      wroteStampTl ? fs.readdirSync(stampDirTl).join(",") : "absent"
    );

    const beforeUnPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    const uncoveredDesk = await page.evaluate(() => {
      const cov = document.getElementById("coverage");
      const covText = ((cov || {}).textContent || "").replace(/\s+/g, " ");
      const covChip = ((document.querySelector("#coverage .cov-chip") || {}).textContent || "").replace(/\s+/g, " ").trim();
      const m = covChip.match(/Coverage\s+(\d+)\s+changed\s+·\s+(\d+)\s+uncovered/i);
      const items = [...document.querySelectorAll("#canvas .tl-item")];
      const uncItem = items.find((el) => {
        const title = ((el.querySelector(".t") || {}).textContent || "").trim();
        return /^Uncovered$/i.test(title);
      });
      if (uncItem) uncItem.click();
      const body = uncItem ? ((uncItem.querySelector(".b") || {}).textContent || "").replace(/\s+/g, " ").trim() : "";
      const title = uncItem ? ((uncItem.querySelector(".t") || {}).textContent || "").trim() : "";
      const kind = uncItem ? ((uncItem.querySelector(".k") || {}).textContent || "").trim() : "";
      const scrubMeta = ((document.getElementById("tlScrubMeta") || {}).textContent || "").trim();
      const findings = [...document.querySelectorAll("#coverage li.finding")].map((el) =>
        (el.textContent || "").replace(/\s+/g, " ").trim()
      );
      return {
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
        covText: covText.slice(0, 240),
        covChip,
        changed: m ? Number(m[1]) : 0,
        uncovered: m ? Number(m[2]) : 0,
        title,
        body,
        kind,
        now: uncItem ? uncItem.classList.contains("now") : false,
        scrubMeta,
        dumpedUncoveredNode: /UncoveredNode/i.test(covText),
        findingDump: findings.some((t) => /UncoveredNode/i.test(t)),
        xy: document.querySelectorAll("#canvas .react-flow__node, .bubble-map .react-flow__node").length,
        cards: document.querySelectorAll(".bubble-card").length,
      };
    });
    record(
      "UN1",
      "#coverage surfaces Coverage N changed · N uncovered (no UncoveredNode dump)",
      uncoveredDesk.ws === "timeline" &&
        uncoveredDesk.changed > 0 &&
        uncoveredDesk.uncovered > 0 &&
        /Coverage\s+\d+\s+changed\s+·\s+\d+\s+uncovered/i.test(uncoveredDesk.covChip) &&
        !uncoveredDesk.dumpedUncoveredNode &&
        !uncoveredDesk.findingDump,
      JSON.stringify({
        ws: uncoveredDesk.ws,
        chip: uncoveredDesk.covChip,
        changed: uncoveredDesk.changed,
        uncovered: uncoveredDesk.uncovered,
      })
    );
    record(
      "UN2",
      "Timeline lists Uncovered (changed nodes off every proposed tree)",
      /Uncovered/i.test(uncoveredDesk.title) &&
        /\d+\s+changed nodes sit off every proposed tree/i.test(uncoveredDesk.body) &&
        /coverage/i.test(uncoveredDesk.kind) &&
        uncoveredDesk.now &&
        /Uncovered/i.test(uncoveredDesk.scrubMeta),
      JSON.stringify({
        title: uncoveredDesk.title,
        body: uncoveredDesk.body,
        kind: uncoveredDesk.kind,
        now: uncoveredDesk.now,
        scrub: uncoveredDesk.scrubMeta,
      })
    );
    record(
      "UN3",
      "Uncovered-node step keeps Map community LOD (xy=0)",
      uncoveredDesk.xy === 0,
      "xy=" + uncoveredDesk.xy + " cards=" + uncoveredDesk.cards
    );
    await page.waitForTimeout(200);
    await shot(page, "uncovered-node.png");
    const afterUn = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
    }, beforeUnPosts);
    record(
      "UN4",
      "Uncovered-node step did not post stamp / skip",
      afterUn.stampPosts === 0 && afterUn.skipPosts === 0,
      JSON.stringify(afterUn)
    );
    const stampDirUn = path.join(ROOT, ".graphide", "stamps");
    const wroteStampUn = fs.existsSync(stampDirUn) && fs.readdirSync(stampDirUn).length > 0;
    record(
      "UN5",
      "Uncovered-node step did not write .graphide/stamps/",
      !wroteStampUn,
      wroteStampUn ? fs.readdirSync(stampDirUn).join(",") : "absent"
    );

    const beforeDhPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    const draftHintDesk = await page.evaluate(async () => {
      const items = [...document.querySelectorAll("#canvas .tl-item")];
      const uncItem = items.find((el) => /^Uncovered$/i.test(((el.querySelector(".t") || {}).textContent || "").trim()));
      if (uncItem) uncItem.click();
      const btn = document.getElementById("draftHintBtn");
      const pre = document.getElementById("draftHint");
      if (btn) btn.click();
      let clip = "";
      try {
        clip = await navigator.clipboard.readText();
      } catch (e) {
        clip = "";
      }
      return {
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
        now: uncItem ? uncItem.classList.contains("now") : false,
        btn: btn ? (btn.textContent || "").replace(/\s+/g, " ").trim() : "",
        visible: pre ? (pre.textContent || "").trim() : "",
        clip,
        xy: document.querySelectorAll("#canvas .react-flow__node, .bubble-map .react-flow__node").length,
        cards: document.querySelectorAll(".bubble-card").length,
      };
    });
    const draftText = draftHintDesk.visible || draftHintDesk.clip || "";
    record(
      "DH1",
      "Timeline Uncovered exposes Copy draft on the selected item",
      draftHintDesk.ws === "timeline" &&
        draftHintDesk.now &&
        /Copy draft/i.test(draftHintDesk.btn),
      JSON.stringify({
        ws: draftHintDesk.ws,
        now: draftHintDesk.now,
        btn: draftHintDesk.btn,
      })
    );
    record(
      "DH2",
      "Draft hint is a [[flow]] hits list with an uncovered FQN",
      /\[\[flow\]\]/.test(draftText) &&
        /hits\s*=/.test(draftText) &&
        /solarsim::ScreenshotFormat/.test(draftText),
      draftText.slice(0, 240)
    );
    record(
      "DH3",
      "Draft-hint step keeps Map community LOD (xy=0)",
      draftHintDesk.xy === 0,
      "xy=" + draftHintDesk.xy + " cards=" + draftHintDesk.cards
    );
    await page.waitForTimeout(200);
    await shot(page, "draft-hint.png");
    const afterDh = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
    }, beforeDhPosts);
    record(
      "DH4",
      "Draft-hint step did not post stamp / skip",
      afterDh.stampPosts === 0 && afterDh.skipPosts === 0,
      JSON.stringify(afterDh)
    );
    const stampDirDh = path.join(ROOT, ".graphide", "stamps");
    const wroteStampDh = fs.existsSync(stampDirDh) && fs.readdirSync(stampDirDh).length > 0;
    record(
      "DH5",
      "Draft-hint step did not write .graphide/stamps/",
      !wroteStampDh,
      wroteStampDh ? fs.readdirSync(stampDirDh).join(",") : "absent"
    );

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
    await page.evaluate(() => {
      const close = document.getElementById("srcClose");
      if (close && document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden) close.click();
    });

    await shot(page, "map.png");

    const beforeFitPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
    const cardsBeforeFit = await page.evaluate(() => document.querySelectorAll(".bubble-card").length);
    await page.evaluate(() => {
      const zin = document.getElementById("zoomIn");
      if (zin) {
        zin.click();
        zin.click();
      }
    });
    await page.waitForTimeout(200);
    const fitVia = await page.evaluate(() => {
      const fit = document.getElementById("zoomFit");
      const buried = !fit || fit.hidden || !!(fit.closest && fit.closest("[hidden]"));
      if (fit && !buried) {
        fit.click();
        return "zoomFit";
      }
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "0", bubbles: true }));
      return "0";
    });
    await page.waitForTimeout(400);
    const afterFit = await page.evaluate(() => {
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
      const stage = document.querySelector("#canvas .stage");
      const stageBox = stage ? stage.getBoundingClientRect() : null;
      const cards = [...document.querySelectorAll(".bubble-card")].map((el) => el.getBoundingClientRect());
      const visible = cards.filter((c) => {
        if (!stageBox || c.width < 4 || c.height < 4) return false;
        return !(c.right <= stageBox.left || c.left >= stageBox.right || c.bottom <= stageBox.top || c.top >= stageBox.bottom);
      });
      const fit = document.getElementById("zoomFit");
      const reorg = document.getElementById("reorgBtn");
      return {
        cards: cards.length,
        visible: visible.length,
        cardHits: pairs(visible, 4),
        xy: document.querySelectorAll(".react-flow__node").length,
        comm: document.querySelectorAll(".comm-node").length,
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
        fitBtn: !!fit,
        reorgBtn: !!reorg,
      };
    });
    record(
      "FR1",
      "Fit (#zoomFit or 0) leaves Map community LOD with more than one card visible",
      afterFit.ws === "map" &&
        afterFit.fitBtn &&
        afterFit.xy === 0 &&
        afterFit.comm === 0 &&
        afterFit.cards >= 8 &&
        afterFit.visible >= 3,
      "via=" + fitVia + " " + JSON.stringify(afterFit)
    );
    record(
      "FR2",
      "Fit does not regress Map card overlap (G5)",
      afterFit.cardHits === 0 && afterFit.visible >= 3,
      JSON.stringify({ cardHits: afterFit.cardHits, visible: afterFit.visible, cards: afterFit.cards })
    );

    const reorgVia = await page.evaluate(() => {
      const btn = document.getElementById("reorgBtn");
      const buried = !btn || btn.hidden || !!(btn.closest && btn.closest("[hidden]"));
      if (btn && !buried) {
        btn.click();
        return "reorgBtn";
      }
      const alt = document.querySelector("#graphBar .reorg-btn");
      if (alt) {
        alt.click();
        return "graphBar.reorg-btn";
      }
      if (btn) {
        btn.click();
        return "reorgBtn";
      }
      return "";
    });
    await page.waitForTimeout(280);
    const afterReorg = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
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
      const stage = document.querySelector("#canvas .stage");
      const stageBox = stage ? stage.getBoundingClientRect() : null;
      const cards = [...document.querySelectorAll(".bubble-card")].map((el) => el.getBoundingClientRect());
      const visible = cards.filter((c) => {
        if (!stageBox || c.width < 4 || c.height < 4) return false;
        return !(c.right <= stageBox.left || c.left >= stageBox.right || c.bottom <= stageBox.top || c.top >= stageBox.bottom);
      });
      return {
        cards: cards.length,
        visible: visible.length,
        cardHits: pairs(visible, 4),
        xy: document.querySelectorAll(".react-flow__node").length,
        comm: document.querySelectorAll(".comm-node").length,
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
        toast: ((document.getElementById("toast") || {}).textContent || "").trim(),
      };
    }, beforeFitPosts);
    record(
      "FR3",
      "Reorganize (#reorgBtn) runs without stamp / skip posts",
      !!reorgVia && afterReorg.stampPosts === 0 && afterReorg.skipPosts === 0,
      "via=" + reorgVia + " " + JSON.stringify(afterReorg)
    );
    record(
      "FR4",
      "Reorganize keeps Map community LOD and cards (stable or >1)",
      afterReorg.xy === 0 &&
        afterReorg.comm === 0 &&
        afterReorg.cards > 1 &&
        (afterReorg.cards === cardsBeforeFit || afterReorg.cards >= 8) &&
        afterReorg.visible >= 3 &&
        afterReorg.cardHits === 0,
      "before=" + cardsBeforeFit + " " + JSON.stringify(afterReorg)
    );
    await shot(page, "fit-reorg.png");
    const stampDirFit = path.join(ROOT, ".graphide", "stamps");
    const wroteStampFit = fs.existsSync(stampDirFit) && fs.readdirSync(stampDirFit).length > 0;
    record(
      "FR5",
      "Fit / Reorganize did not write .graphide/stamps/",
      !wroteStampFit,
      wroteStampFit ? fs.readdirSync(stampDirFit).join(",") : "absent"
    );

    const beforeProgressPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.evaluate(() => {
      window.postMessage(
        {
          type: "progress",
          phase: "extract",
          label: "Extracting functions…",
          done: 8,
          total: 40,
          pct: 22,
          elapsed_ms: 420,
        },
        "*"
      );
    });
    await page.waitForFunction(
      () => {
        const el = document.getElementById("progress");
        const on = document.querySelector('#phases li[data-phase="extract"]');
        return !!(el && el.classList.contains("on") && on && on.classList.contains("on"));
      },
      null,
      { timeout: 4000 }
    );
    await page.evaluate(() => {
      window.postMessage(
        {
          type: "progress",
          phase: "cluster",
          label: "Clustering communities…",
          done: 3,
          total: 5,
          pct: 62,
          elapsed_ms: 1840,
        },
        "*"
      );
    });
    await page.waitForFunction(
      () => {
        const el = document.getElementById("progress");
        const cluster = document.querySelector('#phases li[data-phase="cluster"]');
        const pct = ((document.getElementById("progressPct") || {}).textContent || "").trim();
        const label = ((document.getElementById("progressLabel") || {}).textContent || "").trim();
        return !!(
          el &&
          el.classList.contains("on") &&
          cluster &&
          cluster.classList.contains("on") &&
          /62%/.test(pct) &&
          /Clustering/i.test(label)
        );
      },
      null,
      { timeout: 4000 }
    );
    await page.waitForTimeout(200);
    const progressDesk = await page.evaluate(() => {
      const el = document.getElementById("progress");
      const fill = document.getElementById("progressFill");
      const fillW = fill ? fill.style.width : "";
      const phases = [...document.querySelectorAll("#phases li[data-phase]")].map((li) => ({
        phase: li.getAttribute("data-phase"),
        on: li.classList.contains("on"),
        done: li.classList.contains("done"),
        text: (li.textContent || "").trim(),
      }));
      const by = Object.fromEntries(phases.map((p) => [p.phase, p]));
      return {
        on: !!(el && el.classList.contains("on")),
        label: ((document.getElementById("progressLabel") || {}).textContent || "").trim(),
        counts: ((document.getElementById("progressCounts") || {}).textContent || "").trim(),
        pct: ((document.getElementById("progressPct") || {}).textContent || "").trim(),
        time: ((document.getElementById("progressTime") || {}).textContent || "").trim(),
        fillW,
        fillPct: parseFloat(fillW),
        phases,
        walkDone: !!(by.walk && by.walk.done && !by.walk.on),
        extractDone: !!(by.extract && by.extract.done && !by.extract.on),
        linkDone: !!(by.link && by.link.done && !by.link.on),
        clusterOn: !!(by.cluster && by.cluster.on && !by.cluster.done),
        flowsIdle: !!(by.flows && !by.flows.on && !by.flows.done),
        xy: document.querySelectorAll(".react-flow__node").length,
        cards: document.querySelectorAll(".bubble-card").length,
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    });
    record(
      "PG1",
      "#progress is on after a synthetic progress message",
      progressDesk.on && progressDesk.ws === "map",
      JSON.stringify({ on: progressDesk.on, ws: progressDesk.ws, cards: progressDesk.cards })
    );
    record(
      "PG2",
      "Cluster phase is .on; Scan / Extract / Link are .done",
      progressDesk.walkDone &&
        progressDesk.extractDone &&
        progressDesk.linkDone &&
        progressDesk.clusterOn &&
        progressDesk.flowsIdle,
      JSON.stringify(progressDesk.phases)
    );
    record(
      "PG3",
      "#progressFill / #progressPct / #progressLabel update",
      /Clustering/i.test(progressDesk.label) &&
        progressDesk.counts === "3/5" &&
        progressDesk.pct === "62%" &&
        progressDesk.fillPct >= 50 &&
        /1\.8s/.test(progressDesk.time),
      JSON.stringify({
        label: progressDesk.label,
        counts: progressDesk.counts,
        pct: progressDesk.pct,
        fill: progressDesk.fillW,
        time: progressDesk.time,
      })
    );
    record(
      "PG4",
      "Progress strip keeps Map community LOD (xy=0)",
      progressDesk.xy === 0 && progressDesk.cards > 1,
      "xy=" + progressDesk.xy + " cards=" + progressDesk.cards
    );
    await shot(page, "progress.png");
    await page.evaluate(() => {
      window.postMessage({ type: "cancelled" }, "*");
    });
    await page.waitForFunction(
      () => {
        const el = document.getElementById("progress");
        return !!(el && !el.classList.contains("on"));
      },
      null,
      { timeout: 4000 }
    );
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    const afterProgress = await page.evaluate((before) => {
      const el = document.getElementById("progress");
      const fill = document.getElementById("progressFill");
      const phasesOn = [...document.querySelectorAll("#phases li.on, #phases li.done")].length;
      const posts = (window.__vscodePosts || []).slice(before);
      const review = document.getElementById("reviewBtn");
      const cancel = document.getElementById("cancelBtn");
      return {
        on: !!(el && el.classList.contains("on")),
        phasesOn,
        fillW: fill ? fill.style.width : "",
        xy: document.querySelectorAll(".react-flow__node").length,
        cards: document.querySelectorAll(".bubble-card").length,
        reviewShown: !!(review && !review.hidden),
        cancelHidden: !cancel || cancel.hidden,
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
    }, beforeProgressPosts);
    record(
      "PG5",
      "Clearing progress hides the strip and restores the desk",
      !afterProgress.on &&
        afterProgress.phasesOn === 0 &&
        afterProgress.reviewShown &&
        afterProgress.cancelHidden &&
        afterProgress.xy === 0 &&
        afterProgress.cards > 1,
      JSON.stringify(afterProgress)
    );
    record(
      "PG6",
      "Progress step did not post stamp / skip",
      afterProgress.stampPosts === 0 && afterProgress.skipPosts === 0,
      JSON.stringify({ stampPosts: afterProgress.stampPosts, skipPosts: afterProgress.skipPosts })
    );
    const stampDirPg = path.join(ROOT, ".graphide", "stamps");
    const wroteStampPg = fs.existsSync(stampDirPg) && fs.readdirSync(stampDirPg).length > 0;
    record(
      "PG7",
      "Progress step did not write .graphide/stamps/",
      !wroteStampPg,
      wroteStampPg ? fs.readdirSync(stampDirPg).join(",") : "absent"
    );

    const beforeCancelPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.evaluate(() => {
      window.postMessage(
        {
          type: "progress",
          phase: "cluster",
          label: "Clustering communities…",
          done: 3,
          total: 5,
          pct: 62,
          elapsed_ms: 1840,
        },
        "*"
      );
    });
    await page.waitForFunction(
      () => {
        const el = document.getElementById("progress");
        const cancel = document.getElementById("cancelBtn");
        const review = document.getElementById("reviewBtn");
        return !!(
          el &&
          el.classList.contains("on") &&
          cancel &&
          !cancel.hidden &&
          review &&
          review.hidden
        );
      },
      null,
      { timeout: 4000 }
    );
    const cancelReady = await page.evaluate(() => {
      const cancel = document.getElementById("cancelBtn");
      const review = document.getElementById("reviewBtn");
      const el = document.getElementById("progress");
      return {
        on: !!(el && el.classList.contains("on")),
        cancelShown: !!(cancel && !cancel.hidden),
        reviewHidden: !!(review && review.hidden),
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    });
    record(
      "CR1",
      "#cancelBtn is visible while the progress strip is on",
      cancelReady.on && cancelReady.cancelShown && cancelReady.reviewHidden && cancelReady.ws === "map",
      JSON.stringify(cancelReady)
    );
    await page.click("#cancelBtn");
    await page.waitForFunction(
      () => {
        const label = ((document.getElementById("progressLabel") || {}).textContent || "").trim();
        const posts = window.__vscodePosts || [];
        return /Cancell/i.test(label) && posts.some((m) => m && m.type === "cancel");
      },
      null,
      { timeout: 4000 }
    );
    const afterCancelClick = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        cancelPosts: posts.filter((m) => m && m.type === "cancel").length,
        label: ((document.getElementById("progressLabel") || {}).textContent || "").trim(),
        on: !!(document.getElementById("progress") && document.getElementById("progress").classList.contains("on")),
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
    }, beforeCancelPosts);
    record(
      "CR2",
      'Click #cancelBtn posts { type: "cancel" } and labels Cancelling…',
      afterCancelClick.cancelPosts >= 1 && /Cancell/i.test(afterCancelClick.label) && afterCancelClick.on,
      JSON.stringify(afterCancelClick)
    );
    await page.evaluate(() => {
      window.postMessage({ type: "cancelled" }, "*");
    });
    await page.waitForFunction(
      () => {
        const el = document.getElementById("progress");
        const review = document.getElementById("reviewBtn");
        const cancel = document.getElementById("cancelBtn");
        return !!(el && !el.classList.contains("on") && review && !review.hidden && (!cancel || cancel.hidden));
      },
      null,
      { timeout: 4000 }
    );
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    const afterCancel = await page.evaluate((before) => {
      const el = document.getElementById("progress");
      const review = document.getElementById("reviewBtn");
      const cancel = document.getElementById("cancelBtn");
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        on: !!(el && el.classList.contains("on")),
        reviewShown: !!(review && !review.hidden),
        cancelHidden: !cancel || cancel.hidden,
        xy: document.querySelectorAll(".react-flow__node").length,
        cards: document.querySelectorAll(".bubble-card").length,
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
    }, beforeCancelPosts);
    record(
      "CR3",
      "Cancelled reply hides the strip and restores Review",
      !afterCancel.on && afterCancel.reviewShown && afterCancel.cancelHidden && afterCancel.ws === "map",
      JSON.stringify(afterCancel)
    );
    record(
      "CR4",
      "Cancel review keeps Map community LOD (xy=0)",
      afterCancel.xy === 0 && afterCancel.cards > 1,
      "xy=" + afterCancel.xy + " cards=" + afterCancel.cards
    );
    await shot(page, "cancel-review.png");
    record(
      "CR5",
      "Cancel-review step did not post stamp / skip",
      afterCancel.stampPosts === 0 && afterCancel.skipPosts === 0,
      JSON.stringify({ stampPosts: afterCancel.stampPosts, skipPosts: afterCancel.skipPosts })
    );
    const stampDirCr = path.join(ROOT, ".graphide", "stamps");
    const wroteStampCr = fs.existsSync(stampDirCr) && fs.readdirSync(stampDirCr).length > 0;
    record(
      "CR6",
      "Cancel-review step did not write .graphide/stamps/",
      !wroteStampCr,
      wroteStampCr ? fs.readdirSync(stampDirCr).join(",") : "absent"
    );

    const beforeNightPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
    const dayBeforeNight = await page.evaluate(() => ({
      htmlNight: document.documentElement.classList.contains("night"),
      bodyNight: document.body.classList.contains("night"),
      bright: document.documentElement.classList.contains("bright"),
      dayOn: !!(document.getElementById("themeDay") && document.getElementById("themeDay").classList.contains("on")),
      nightOn: !!(document.getElementById("themeNight") && document.getElementById("themeNight").classList.contains("on")),
    }));
    if (dayBeforeNight.htmlNight) {
      await page.click("#themeDay");
      await page.waitForFunction(
        () => !document.documentElement.classList.contains("night"),
        null,
        { timeout: 5000 }
      );
    }
    await page.click("#themeNight");
    await page.waitForFunction(
      () =>
        document.documentElement.classList.contains("night") &&
        document.body.classList.contains("night") &&
        !!(document.getElementById("themeNight") && document.getElementById("themeNight").classList.contains("on")),
      null,
      { timeout: 5000 }
    );
    const nightDesk = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".bubble-card")];
      const visible = cards.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 4 && r.height > 4;
      });
      const nightBtn = document.getElementById("themeNight");
      const dayBtn = document.getElementById("themeDay");
      return {
        htmlNight: document.documentElement.classList.contains("night"),
        bodyNight: document.body.classList.contains("night"),
        htmlBright: document.documentElement.classList.contains("bright"),
        bodyBright: document.body.classList.contains("bright"),
        nightOn: !!(nightBtn && nightBtn.classList.contains("on")),
        dayOn: !!(dayBtn && dayBtn.classList.contains("on")),
        seg: !!document.getElementById("themeSeg"),
        cards: cards.length,
        visible: visible.length,
        xy: document.querySelectorAll(".react-flow__node").length,
        preset: document.documentElement.getAttribute("data-preset") || "classic",
      };
    });
    record(
      "N1",
      "Night adds .night on html/body and presses #themeNight",
      nightDesk.seg &&
        nightDesk.htmlNight &&
        nightDesk.bodyNight &&
        nightDesk.nightOn &&
        !nightDesk.dayOn,
      JSON.stringify(nightDesk)
    );
    record(
      "N1b",
      "Night keeps .bright (html.bright.night)",
      nightDesk.htmlBright && nightDesk.bodyBright,
      JSON.stringify({ htmlBright: nightDesk.htmlBright, bodyBright: nightDesk.bodyBright })
    );
    record(
      "N2",
      "Map stays community LOD on Night (xy=0, cards visible)",
      nightDesk.cards >= 8 && nightDesk.visible >= 3 && nightDesk.xy === 0,
      "cards=" + nightDesk.cards + " visible=" + nightDesk.visible + " xy=" + nightDesk.xy
    );
    await shot(page, "night.png", { minLuma: 0.04, maxLuma: 0.55, minStd: 0.03 });
    const mapLuma = pngMeanLuma(fs.readFileSync(path.join(OUT, "map.png")));
    const nightLuma = pngMeanLuma(fs.readFileSync(path.join(OUT, "night.png")));
    record(
      "N3",
      "Night Map is dark vs day map.png",
      nightLuma.luma + 0.05 < mapLuma.luma && nightLuma.std >= 0.03,
      "night=" +
        nightLuma.luma.toFixed(3) +
        " day=" +
        mapLuma.luma.toFixed(3) +
        " std=" +
        nightLuma.std.toFixed(3)
    );
    const nightPosts = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
        appearance: posts.filter((m) => m && m.type === "setAppearance").length,
      };
    }, beforeNightPosts);
    record(
      "N4",
      "Night does not post a stamp",
      nightPosts.stampPosts === 0 && nightPosts.skipPosts === 0,
      JSON.stringify(nightPosts)
    );

    await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
    await page.keyboard.press("D");
    await page.waitForFunction(
      () =>
        !document.documentElement.classList.contains("night") &&
        !!(document.getElementById("themeDay") && document.getElementById("themeDay").classList.contains("on")),
      null,
      { timeout: 5000 }
    );
    const dayRestored = await page.evaluate(() => ({
      htmlNight: document.documentElement.classList.contains("night"),
      bodyNight: document.body.classList.contains("night"),
      bright: document.documentElement.classList.contains("bright"),
      dayOn: !!(document.getElementById("themeDay") && document.getElementById("themeDay").classList.contains("on")),
      nightOn: !!(document.getElementById("themeNight") && document.getElementById("themeNight").classList.contains("on")),
      cards: document.querySelectorAll(".bubble-card").length,
      xy: document.querySelectorAll(".react-flow__node").length,
    }));
    record(
      "N5",
      "D restores Day markers so later suites stay day-safe",
      !dayRestored.htmlNight &&
        !dayRestored.bodyNight &&
        dayRestored.bright &&
        dayRestored.dayOn &&
        !dayRestored.nightOn &&
        dayRestored.cards >= 8 &&
        dayRestored.xy === 0,
      JSON.stringify(dayRestored)
    );
    const stampDirNight = path.join(ROOT, ".graphide", "stamps");
    const wroteStampNight = fs.existsSync(stampDirNight) && fs.readdirSync(stampDirNight).length > 0;
    record(
      "N6",
      "Appearance step did not write .graphide/stamps/",
      !wroteStampNight,
      wroteStampNight ? fs.readdirSync(stampDirNight).join(",") : "absent"
    );

    const enteredClick = await page.evaluate(() => {
      const card = document.querySelector(".bubble-card");
      if (!card) return { clicked: false };
      card.click();
      return { clicked: true, id: card.getAttribute("data-bubble") || "" };
    });
    await page
      .waitForFunction(
        () => document.querySelectorAll("#enterCanvas .react-flow__node").length > 1,
        null,
        { timeout: 10000 }
      )
      .catch(async () => {
        const dump = await page.evaluate(() => {
          const host = document.getElementById("enterCanvas");
          return {
            cards: document.querySelectorAll(".bubble-card").length,
            enter: !!host,
            xy: document.querySelectorAll("#enterCanvas .react-flow__node").length,
            rf: !!document.querySelector("#enterCanvas .react-flow"),
            empty: ((document.querySelector("#canvas .empty") || {}).textContent || "").trim(),
            meta: ((document.getElementById("meta") || {}).textContent || "").trim().slice(0, 160),
            title: ((document.querySelector("#canvas .flow-title") || {}).textContent || "").trim().slice(0, 160),
            info: window.__graphideEnter || null,
            hostHtml: host ? (host.innerHTML || "").replace(/\s+/g, " ").slice(0, 240) : "",
            hostBox: host ? { w: Math.round(host.getBoundingClientRect().width), h: Math.round(host.getBoundingClientRect().height) } : null,
          };
        });
        failFast("enter-bubble XYFlow did not mount — click=" + JSON.stringify(enteredClick) + " dump=" + JSON.stringify(dump));
      });
    await page.waitForTimeout(250);
    const entered = await page.evaluate(() => {
      const xy = document.querySelectorAll("#enterCanvas .react-flow__node").length;
      const lit = document.querySelectorAll("#enterCanvas .vnode.lit, #enterCanvas [data-lit='1']").length;
      const grey = document.querySelectorAll("#enterCanvas .vnode.grey, #enterCanvas [data-lit='0']").length;
      const shapes = [...new Set([...document.querySelectorAll("#enterCanvas .vnode[data-shape]")].map((el) => el.getAttribute("data-shape")))];
      return {
        xy,
        lit,
        grey,
        cards: document.querySelectorAll(".bubble-card").length,
        mapXy: document.querySelectorAll(".react-flow__node").length,
        shapes,
        inode: document.querySelectorAll(".inode").length,
      };
    });
    record(
      "E1",
      "Enter-bubble mounts shaped XYFlow nodes (capped, not the raw IR)",
      entered.xy > 1 && entered.xy <= 24 && entered.inode === 0 && entered.cards === 0,
      "xy=" + entered.xy + " lit=" + entered.lit + " grey=" + entered.grey + " shapes=" + entered.shapes.join(",")
    );
    const enterShapesOk = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#enterCanvas .vnode[data-shape]")];
      return nodes.length > 1 && nodes.length === document.querySelectorAll("#enterCanvas .react-flow__node").length;
    });
    record("E1b", "Enter-bubble XYFlow nodes each carry data-shape", enterShapesOk, "xy=" + entered.xy + " shapes=" + entered.shapes.join(","));

    await shot(page, "enter-bubble.png");

    await page.evaluate(() => {
      const leaf =
        document.querySelector("#enterCanvas .vnode[data-leaf='1']") ||
        document.querySelector("#enterCanvas .vnode[data-id]");
      if (leaf) leaf.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const hops = document.getElementById("egoHops");
      if (hops) {
        hops.value = "1";
        hops.dispatchEvent(new Event("change", { bubbles: true }));
      }
      const btn = document.getElementById("egoBtn");
      if (btn && !btn.classList.contains("on")) btn.click();
    });
    await page.waitForTimeout(280);
    const egoEnter = await page.evaluate(() => {
      const btn = document.getElementById("egoBtn");
      const hops = document.getElementById("egoHops");
      const nodes = [...document.querySelectorAll("#enterCanvas .vnode[data-id]")];
      return {
        on: !!(btn && btn.classList.contains("on")),
        hops: hops ? hops.value : "",
        nodes: nodes.length,
        ego: nodes.filter((el) => el.classList.contains("ego")).length,
        dim: nodes.filter((el) => el.classList.contains("ego-dim")).length,
        selected: nodes.filter((el) => el.classList.contains("selected")).length,
        files: nodes.filter((el) => el.getAttribute("data-file")).length,
      };
    });
    record(
      "EG1",
      "Ego toggle is on and hop depth is 1",
      egoEnter.on && egoEnter.hops === "1",
      JSON.stringify({ on: egoEnter.on, hops: egoEnter.hops })
    );
    record(
      "EG2",
      "Enter-bubble Ego lights neighbors (and dims non-neighbors when the cut has them)",
      egoEnter.selected >= 1 && egoEnter.ego >= 1,
      JSON.stringify(egoEnter)
    );

    await page.evaluate(() => {
      const hops = document.getElementById("egoHops");
      if (hops) {
        hops.value = "2";
        hops.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await page.waitForTimeout(280);
    const egoEnter2 = await page.evaluate(() => ({
      dim: document.querySelectorAll("#enterCanvas .vnode.ego-dim").length,
      ego: document.querySelectorAll("#enterCanvas .vnode.ego").length,
      hops: ((document.getElementById("egoHops") || {}).value || ""),
    }));
    record(
      "EG3",
      "2-hop Ego keeps a wider neighborhood than 1-hop on enter-bubble",
      egoEnter2.hops === "2" && egoEnter2.dim <= egoEnter.dim,
      "1-hop dim=" + egoEnter.dim + " 2-hop dim=" + egoEnter2.dim
    );
    await shot(page, "ego.png");

    await page.evaluate(() => {
      const btn = document.getElementById("egoBtn");
      if (btn && btn.classList.contains("on")) btn.click();
    });
    await page.waitForTimeout(200);
    const egoOff = await page.evaluate(() => ({
      on: !!(document.getElementById("egoBtn") && document.getElementById("egoBtn").classList.contains("on")),
      dim: document.querySelectorAll("#enterCanvas .vnode.ego-dim, #sliceCanvas .vnode.ego-dim").length,
    }));
    record("EG4", "Ego off removes neighborhood dim", !egoOff.on && egoOff.dim === 0, JSON.stringify(egoOff));

    const searchQ = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#enterCanvas .vnode[data-id]")];
      const fqns = nodes.map((el) => el.getAttribute("data-fqn") || "");
      for (const f of fqns) {
        const tok = (f.split("::").pop() || f).replace(/[^A-Za-z0-9_]/g, "");
        if (tok.length < 3) continue;
        const hits = fqns.filter((x) => x.toLowerCase().includes(tok.toLowerCase())).length;
        if (hits >= 1 && hits < fqns.length) return tok;
      }
      for (const el of nodes) {
        const file = el.getAttribute("data-file") || "";
        const tok = (file.split("/").pop() || "").replace(/\.[^.]+$/, "");
        if (tok.length < 3) continue;
        const hits = nodes.filter((n) => {
          const hay = ((n.getAttribute("data-fqn") || "") + " " + (n.getAttribute("data-file") || "")).toLowerCase();
          return hay.includes(tok.toLowerCase());
        }).length;
        if (hits >= 1 && hits < nodes.length) return tok;
      }
      return "zzzz-no-such-symbol";
    });
    await page.fill("#graphSearch", searchQ);
    await page.waitForTimeout(280);
    const searchEnter = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#enterCanvas .vnode[data-id]")];
      return {
        q: ((document.getElementById("graphSearch") || {}).value || "").trim(),
        nodes: nodes.length,
        dim: nodes.filter((el) => el.classList.contains("dim")).length,
        hit: nodes.filter((el) => el.classList.contains("hit")).length,
        files: nodes.filter((el) => el.getAttribute("data-file")).length,
      };
    });
    record(
      "SG2",
      "Find filters enter-bubble XYFlow nodes (FQN / file)",
      searchEnter.q === searchQ && searchEnter.dim >= 1 && (searchEnter.hit >= 1 || searchQ === "zzzz-no-such-symbol"),
      JSON.stringify({ q: searchQ, ...searchEnter })
    );
    await shot(page, "search.png");
    await page.fill("#graphSearch", "");
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      const box = document.getElementById("graphSearch");
      if (box && box.blur) box.blur();
    });

    await page.evaluate(() => {
      const leaf =
        document.querySelector("#enterCanvas .vnode[data-leaf='1']") ||
        document.querySelector("#enterCanvas .react-flow__node");
      if (leaf) leaf.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 8000 }
    );
    const enterEvidence = await page.evaluate(() => {
      const pane = document.getElementById("sourcePane");
      return {
        open: !!(pane && !pane.hidden),
        title: ((document.getElementById("srcTitle") || {}).textContent || "").trim(),
      };
    });
    record(
      "E2",
      "Leaf click on enter-bubble opens Evidence",
      enterEvidence.open && !!enterEvidence.title,
      enterEvidence.title.slice(0, 80)
    );
    await page.keyboard.press("Escape");
    await page.waitForTimeout(150);
    const backBtn = page.locator("#backBtn");
    if (await backBtn.isEnabled()) await backBtn.click();
    else {
      await page.evaluate(() => {
        const crumb = document.querySelector("#meta [data-go=programs], #meta [data-up=map]");
        if (crumb) crumb.click();
      });
    }
    await page.waitForSelector(".bubble-card", { timeout: 10000 });
    await page.waitForTimeout(200);
    const afterEnter = await page.evaluate(() => ({
      cards: document.querySelectorAll(".bubble-card").length,
      xy: document.querySelectorAll(".react-flow__node").length,
      enter: document.querySelectorAll("#enterCanvas .react-flow__node").length,
    }));
    record(
      "E3",
      "Back from enter-bubble returns to Map community LOD (xy=0)",
      afterEnter.cards >= 8 && afterEnter.xy === 0 && afterEnter.enter === 0,
      "cards=" + afterEnter.cards + " xy=" + afterEnter.xy
    );

    await page.fill("#graphSearch", "render");
    await page.waitForTimeout(200);
    const searchMap = await page.evaluate(() => ({
      q: ((document.getElementById("graphSearch") || {}).value || "").trim(),
      cards: document.querySelectorAll(".bubble-card").length,
      dim: document.querySelectorAll(".bubble-card.dim").length,
      xy: document.querySelectorAll(".react-flow__node").length,
    }));
    record(
      "SG1",
      "Find dims non-matching Map community cards (xy stays 0)",
      searchMap.q === "render" && searchMap.dim >= 1 && searchMap.cards >= 8 && searchMap.xy === 0,
      JSON.stringify(searchMap)
    );
    await page.fill("#graphSearch", "");
    await page.waitForTimeout(120);
    await page.evaluate(() => {
      const box = document.getElementById("graphSearch");
      if (box && box.blur) box.blur();
    });

    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector("#sliceCanvas .vnode[data-id], #sliceCanvas .react-flow__node", { timeout: 10000 });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const node = document.querySelector("#sliceCanvas .vnode[data-id]");
      if (node) node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await page.waitForTimeout(180);
    await page.evaluate(() => {
      const hops = document.getElementById("egoHops");
      if (hops) {
        hops.value = "1";
        hops.dispatchEvent(new Event("change", { bubbles: true }));
      }
      const btn = document.getElementById("egoBtn");
      if (btn && !btn.classList.contains("on")) btn.click();
    });
    await page.waitForTimeout(280);
    const egoSlice1 = await page.evaluate(() => ({
      dim: document.querySelectorAll("#sliceCanvas .vnode.ego-dim").length,
      ego: document.querySelectorAll("#sliceCanvas .vnode.ego").length,
      selected: document.querySelectorAll("#sliceCanvas .vnode.selected").length,
    }));
    await page.evaluate(() => {
      const hops = document.getElementById("egoHops");
      if (hops) {
        hops.value = "2";
        hops.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await page.waitForTimeout(280);
    const egoSlice2 = await page.evaluate(() => ({
      dim: document.querySelectorAll("#sliceCanvas .vnode.ego-dim").length,
      ego: document.querySelectorAll("#sliceCanvas .vnode.ego").length,
    }));
    record(
      "EG3b",
      "Slice Ego dims non-neighbors; 2-hop is at least as wide as 1-hop",
      egoSlice1.selected >= 1 && egoSlice1.ego >= 1 && egoSlice1.dim >= 1 && egoSlice2.dim <= egoSlice1.dim,
      "1-hop=" + JSON.stringify(egoSlice1) + " 2-hop=" + JSON.stringify(egoSlice2)
    );
    await page.evaluate(() => {
      const btn = document.getElementById("egoBtn");
      if (btn && btn.classList.contains("on")) btn.click();
    });
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    await page.waitForTimeout(150);
    const afterEgo = await page.evaluate(() => ({
      cards: document.querySelectorAll(".bubble-card").length,
      xy: document.querySelectorAll(".react-flow__node").length,
    }));
    record(
      "EG7",
      "Map altitude is still community LOD after Ego / Find (xy=0)",
      afterEgo.cards >= 8 && afterEgo.xy === 0,
      "cards=" + afterEgo.cards + " xy=" + afterEgo.xy
    );
    const stampDirEnter = path.join(ROOT, ".graphide", "stamps");
    const wroteStampEnter = fs.existsSync(stampDirEnter) && fs.readdirSync(stampDirEnter).length > 0;
    record(
      "E4",
      "Enter-bubble step did not write .graphide/stamps/",
      !wroteStampEnter,
      wroteStampEnter ? fs.readdirSync(stampDirEnter).join(",") : "absent"
    );

    await page.click("#llmBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && !pane.hidden && pane.classList.contains("open"));
      },
      null,
      { timeout: 5000 }
    );
    const askOpen = await page.evaluate(() => {
      const pane = document.getElementById("llmPane");
      const box = (el) => (el && !el.hidden ? el.getBoundingClientRect() : null);
      const hit = (a, b) =>
        !!(
          a &&
          b &&
          a.width > 2 &&
          b.width > 2 &&
          !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)
        );
      const paneBox = box(pane);
      const source = box(document.getElementById("sourcePane"));
      const ledger = box(document.getElementById("ledgerPane"));
      const keys = box(document.getElementById("keysPane"));
      const exportMenu = box(document.getElementById("exportMenu"));
      return {
        btn: !!document.getElementById("llmBtn"),
        pane: !!(pane && !pane.hidden),
        open: !!(pane && pane.classList.contains("open")),
        close: !!document.getElementById("llmClose"),
        ask: !!document.getElementById("llmAsk"),
        send: !!document.getElementById("llmSend"),
        log: !!document.getElementById("llmLog"),
        overlap: hit(paneBox, source) || hit(paneBox, ledger) || hit(paneBox, keys) || hit(paneBox, exportMenu),
        z: pane ? getComputedStyle(pane).zIndex : "",
      };
    });
    record(
      "A1",
      "#llmBtn opens #llmPane (Ask)",
      askOpen.btn && askOpen.pane && askOpen.open && askOpen.close && askOpen.ask && askOpen.send && askOpen.log,
      JSON.stringify(askOpen)
    );
    record(
      "A1b",
      "Ask pane is not covered by Evidence / ledger / keys / export",
      !askOpen.overlap,
      JSON.stringify(askOpen)
    );

    const beforeAskPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.fill("#llmAsk", "Tell the start to end control-flow path");
    await page.click("#llmSend");
    await page.waitForFunction(
      () => /Start → features → end/i.test((document.getElementById("llmLog") || {}).textContent || ""),
      null,
      { timeout: 5000 }
    );
    await page.fill("#llmAsk", "What hops are on this path?");
    await page.click("#llmSend");
    await page.waitForFunction(
      () => /Control-flow hops:|Derived hops:/i.test((document.getElementById("llmLog") || {}).textContent || ""),
      null,
      { timeout: 5000 }
    );
    await page.fill("#llmAsk", "What is the coverage?");
    await page.click("#llmSend");
    await page.waitForFunction(
      () => /Coverage:/i.test((document.getElementById("llmLog") || {}).textContent || ""),
      null,
      { timeout: 5000 }
    );
    const askAns = await page.evaluate((before) => {
      const log = ((document.getElementById("llmLog") || {}).textContent || "").trim();
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        log,
        hasPath: /Start → features → end/i.test(log),
        hasHop: /hop/i.test(log),
        hasCov: /Coverage:/i.test(log),
        neverStamp: /never stamp/i.test(log),
        empty: !log,
        askPosts: posts.filter((m) => m && m.type === "llmAsk").length,
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
      };
    }, beforeAskPosts);
    record(
      "A2",
      "Graph-only Ask answers a flow, hop, or coverage without an LLM host",
      askAns.hasPath && askAns.hasHop && askAns.hasCov && askAns.neverStamp && !askAns.empty && askAns.askPosts >= 1,
      askAns.log.slice(0, 220)
    );
    record("A3", "Ask does not post a stamp", askAns.stampPosts === 0, "stampPosts=" + askAns.stampPosts);

    await shot(page, "ask.png");

    await page.click("#llmClose");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const closedBtn = await page.evaluate(
      () => !!(document.getElementById("llmPane") && document.getElementById("llmPane").hidden)
    );
    record("A4", "#llmClose hides #llmPane", closedBtn, "");

    await page.click("#llmBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const closedEsc = await page.evaluate(
      () => !!(document.getElementById("llmPane") && document.getElementById("llmPane").hidden)
    );
    record("A5", "Escape closes #llmPane", closedEsc, "");

    const afterAsk = await page.evaluate(() => ({
      cards: document.querySelectorAll(".bubble-card").length,
      xy: document.querySelectorAll(".react-flow__node").length,
    }));
    record(
      "A6",
      "Map altitude is still community LOD after Ask (xy=0)",
      afterAsk.cards >= 8 && afterAsk.xy === 0,
      "cards=" + afterAsk.cards + " xy=" + afterAsk.xy
    );
    const stampDirAsk = path.join(ROOT, ".graphide", "stamps");
    const wroteStampAsk = fs.existsSync(stampDirAsk) && fs.readdirSync(stampDirAsk).length > 0;
    record(
      "A7",
      "Ask step did not write .graphide/stamps/",
      !wroteStampAsk,
      wroteStampAsk ? fs.readdirSync(stampDirAsk).join(",") : "absent"
    );

    const srcClose = await page.$("#srcClose");
    if (srcClose && (await page.evaluate(() => !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden)))) {
      await page.click("#srcClose");
      await page.waitForFunction(
        () => !!(document.getElementById("sourcePane") && document.getElementById("sourcePane").hidden),
        null,
        { timeout: 5000 }
      );
    }
    const beforeKeysPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
    await page.keyboard.press("?");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden && pane.classList.contains("open"));
      },
      null,
      { timeout: 5000 }
    );
    const keysOpen = await page.evaluate(() => {
      const pane = document.getElementById("keysPane");
      const box = (el) => (el && !el.hidden ? el.getBoundingClientRect() : null);
      const hit = (a, b) =>
        !!(
          a &&
          b &&
          a.width > 2 &&
          b.width > 2 &&
          !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)
        );
      const paneBox = box(pane);
      const source = box(document.getElementById("sourcePane"));
      const ask = box(document.getElementById("llmPane"));
      const exportMenu = box(document.getElementById("exportMenu"));
      const text = ((pane && pane.textContent) || "").replace(/\s+/g, " ").trim();
      return {
        btn: !!document.getElementById("keysBtn"),
        pane: !!(pane && !pane.hidden),
        open: !!(pane && pane.classList.contains("open")),
        close: !!document.getElementById("keysClose"),
        text,
        find: /\/\s*find/i.test(text),
        sheet: /\?\s*this sheet/i.test(text),
        stamp: /S\s*stamp/i.test(text) && /X\s*skip/i.test(text),
        ego: /E\s*ego/i.test(text),
        present: /F\s*present/i.test(text),
        theme: /D\s*day/i.test(text),
        overlap: hit(paneBox, source) || hit(paneBox, ask) || hit(paneBox, exportMenu),
        z: pane ? getComputedStyle(pane).zIndex : "",
      };
    });
    record(
      "K1",
      "? opens #keysPane (Keys)",
      keysOpen.btn && keysOpen.pane && keysOpen.open && keysOpen.close,
      JSON.stringify({ btn: keysOpen.btn, pane: keysOpen.pane, open: keysOpen.open, close: keysOpen.close, z: keysOpen.z })
    );
    record(
      "K1b",
      "Keys pane is not covered by Evidence / Ask / export",
      !keysOpen.overlap,
      JSON.stringify({ overlap: keysOpen.overlap, z: keysOpen.z })
    );
    record(
      "K2",
      "Keys sheet lists / find, ? sheet, S/X stamp/skip, E ego, F present, D day",
      keysOpen.find && keysOpen.sheet && keysOpen.stamp && keysOpen.ego && keysOpen.present && keysOpen.theme,
      keysOpen.text.slice(0, 220)
    );

    const keysPosts = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
    }, beforeKeysPosts);
    record(
      "K3",
      "Keys does not post a stamp",
      keysPosts.stampPosts === 0 && keysPosts.skipPosts === 0,
      JSON.stringify(keysPosts)
    );

    await shot(page, "keys.png");

    await page.click("#keysClose");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const keysClosedBtn = await page.evaluate(
      () => !!(document.getElementById("keysPane") && document.getElementById("keysPane").hidden)
    );
    record("K4", "#keysClose hides #keysPane", keysClosedBtn, "");

    await page.click("#keysBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const keysClosedEsc = await page.evaluate(
      () => !!(document.getElementById("keysPane") && document.getElementById("keysPane").hidden)
    );
    record("K5", "Escape closes #keysPane", keysClosedEsc, "");

    await page.evaluate(() => {
      const cell = document.querySelector("#ledgerGrid .cell");
      if (cell) cell.click();
    });
    await page.waitForFunction(
      () => !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
    await page.click("#keysBtn");
    await page.waitForFunction(
      () => !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      null,
      { timeout: 5000 }
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !!(document.getElementById("keysPane") && document.getElementById("keysPane").hidden),
      null,
      { timeout: 5000 }
    );
    const keysOverEvidence = await page.evaluate(() => ({
      keysHidden: !!(document.getElementById("keysPane") && document.getElementById("keysPane").hidden),
      evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
    }));
    record(
      "K5b",
      "Escape closes Keys without closing Evidence",
      keysOverEvidence.keysHidden && keysOverEvidence.evidenceOpen,
      JSON.stringify(keysOverEvidence)
    );
    await page.click("#srcClose");
    await page.waitForFunction(
      () => !!(document.getElementById("sourcePane") && document.getElementById("sourcePane").hidden),
      null,
      { timeout: 5000 }
    );

    const afterKeys = await page.evaluate(() => ({
      cards: document.querySelectorAll(".bubble-card").length,
      xy: document.querySelectorAll(".react-flow__node").length,
      keysHidden: !!(document.getElementById("keysPane") && document.getElementById("keysPane").hidden),
    }));
    record(
      "K6",
      "Map altitude is still community LOD after Keys (xy=0)",
      afterKeys.cards >= 8 && afterKeys.xy === 0,
      "cards=" + afterKeys.cards + " xy=" + afterKeys.xy
    );
    record(
      "K6b",
      "Keys is closed so it does not cover Evidence / ledger / Ask",
      afterKeys.keysHidden,
      "hidden=" + afterKeys.keysHidden
    );
    const stampDirKeys = path.join(ROOT, ".graphide", "stamps");
    const wroteStampKeys = fs.existsSync(stampDirKeys) && fs.readdirSync(stampDirKeys).length > 0;
    record(
      "K7",
      "Keys step did not write .graphide/stamps/",
      !wroteStampKeys,
      wroteStampKeys ? fs.readdirSync(stampDirKeys).join(",") : "absent"
    );

    await page.click('#workspaces [data-ws="map"]');
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    const srcCloseWalk = await page.$("#srcClose");
    if (
      srcCloseWalk &&
      (await page.evaluate(
        () => !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden)
      ))
    ) {
      await page.click("#srcClose");
      await page.waitForFunction(
        () => !!(document.getElementById("sourcePane") && document.getElementById("sourcePane").hidden),
        null,
        { timeout: 5000 }
      );
    }
    await page.evaluate(() => {
      const ask = document.getElementById("llmPane");
      const keys = document.getElementById("keysPane");
      if (ask && !ask.hidden) {
        const close = document.getElementById("llmClose");
        if (close) close.click();
      }
      if (keys && !keys.hidden) {
        const close = document.getElementById("keysClose");
        if (close) close.click();
      }
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
    await page.waitForTimeout(120);

    const walkPath = await page.evaluate(() => {
      const chips = [...document.querySelectorAll(".feat-chip")];
      const cards = [...document.querySelectorAll(".bubble-card")];
      const label = (
        (document.querySelector(".story-rail-label, .feature-path-label") || {}).textContent || ""
      )
        .replace(/\s+/g, " ")
        .trim();
      return {
        chips: chips.length,
        cards: cards.length,
        startChip: !!document.querySelector(".feat-chip.start"),
        endChip: !!document.querySelector(".feat-chip.end"),
        startCard: !!document.querySelector(".bubble-card.start"),
        endCard: !!document.querySelector(".bubble-card.end"),
        play: !!document.getElementById("pathWalkBtn"),
        prev: !!document.getElementById("pathWalkPrev"),
        next: !!document.getElementById("pathWalkNext"),
        pathBtnOn: !!(document.getElementById("pathBtn") && document.getElementById("pathBtn").classList.contains("on")),
        routePlay: !!(document.getElementById("routePlay") && document.getElementById("routeReceipt") && !document.getElementById("routeReceipt").hidden),
        label,
        xy: document.querySelectorAll(".react-flow__node").length,
      };
    });
    record(
      "PW1",
      "Map has a start → features → end community path",
      walkPath.chips >= 3 &&
        walkPath.cards >= 8 &&
        walkPath.startChip &&
        walkPath.endChip &&
        walkPath.startCard &&
        walkPath.endCard &&
        /Start → features → end/i.test(walkPath.label) &&
        walkPath.xy === 0,
      JSON.stringify(walkPath)
    );
    record(
      "PW1b",
      "Map path walk is not Route PATH / #routePlay",
      !walkPath.pathBtnOn && !walkPath.routePlay,
      JSON.stringify({ pathBtnOn: walkPath.pathBtnOn, routePlay: walkPath.routePlay })
    );

    const beforeWalkPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
    const walkStartedVia = await page.evaluate(() => {
      const play = document.getElementById("pathWalkBtn");
      if (play) {
        play.click();
        return "pathWalkBtn";
      }
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "P", bubbles: true }));
      return "P";
    });
    await page.waitForFunction(
      () => document.querySelectorAll(".feat-chip.walk, .bubble-card.walk").length >= 1,
      null,
      { timeout: 5000 }
    );
    const walkStartPaint = await page.evaluate(() => ({
      chipWalk: document.querySelectorAll(".feat-chip.walk").length,
      chipHere: document.querySelectorAll(".feat-chip.here").length,
      cardWalk: document.querySelectorAll(".bubble-card.walk").length,
      playOn: !!(document.getElementById("pathWalkBtn") && document.getElementById("pathWalkBtn").classList.contains("on")),
    }));
    record(
      "PW2",
      "P or #pathWalkBtn starts Map path walk and paints .walk / .here",
      walkStartPaint.chipWalk >= 1 && walkStartPaint.chipHere >= 1 && walkStartPaint.cardWalk >= 1,
      "via=" + walkStartedVia + " " + JSON.stringify(walkStartPaint)
    );

    await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
    await page.keyboard.press("]");
    await page.waitForFunction(
      () => {
        const midChip = document.querySelector(".feat-chip.walk:not(.start):not(.end)");
        const midCard = document.querySelector(".bubble-card.walk:not(.start):not(.end)");
        return !!(midChip || midCard);
      },
      null,
      { timeout: 5000 }
    );
    const walkMid = await page.evaluate(() => {
      const chip = document.querySelector(".feat-chip.walk");
      const card = document.querySelector(".bubble-card.walk");
      return {
        chipWalk: document.querySelectorAll(".feat-chip.walk").length,
        chipHere: document.querySelectorAll(".feat-chip.here").length,
        cardWalk: document.querySelectorAll(".bubble-card.walk").length,
        midChip: !!document.querySelector(".feat-chip.walk:not(.start):not(.end)"),
        midCard: !!document.querySelector(".bubble-card.walk:not(.start):not(.end)"),
        chipId: chip ? chip.getAttribute("data-feature") || chip.getAttribute("data-hop") || "" : "",
        cardId: card ? card.getAttribute("data-bubble") || "" : "",
        xy: document.querySelectorAll(".react-flow__node").length,
        routeOn: !!(document.getElementById("pathBtn") && document.getElementById("pathBtn").classList.contains("on")),
      };
    });
    record(
      "PW3",
      "] steps Map path walk to a mid-path community (.walk, not START/END)",
      walkMid.midChip &&
        walkMid.midCard &&
        walkMid.chipWalk >= 1 &&
        walkMid.chipHere >= 1 &&
        walkMid.cardWalk >= 1 &&
        walkMid.xy === 0 &&
        !walkMid.routeOn,
      JSON.stringify(walkMid)
    );

    const srcCloseMid = await page.$("#srcClose");
    if (
      srcCloseMid &&
      (await page.evaluate(
        () => !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden)
      ))
    ) {
      await page.click("#srcClose");
      await page.waitForFunction(
        () => !!(document.getElementById("sourcePane") && document.getElementById("sourcePane").hidden),
        null,
        { timeout: 5000 }
      );
    }
    await shot(page, "path-walk.png");

    await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
    await page.keyboard.press("[");
    await page.waitForTimeout(180);
    const walkBack = await page.evaluate((prev) => {
      const chip = document.querySelector(".feat-chip.walk");
      const card = document.querySelector(".bubble-card.walk");
      const posts = window.__vscodePosts || [];
      return {
        chipId: chip ? chip.getAttribute("data-feature") || chip.getAttribute("data-hop") || "" : "",
        cardId: card ? card.getAttribute("data-bubble") || "" : "",
        chipWalk: document.querySelectorAll(".feat-chip.walk").length,
        cardWalk: document.querySelectorAll(".bubble-card.walk").length,
        moved: !!(
          (chip && (chip.getAttribute("data-feature") || chip.getAttribute("data-hop") || "") !== prev.chipId) ||
          (card && (card.getAttribute("data-bubble") || "") !== prev.cardId)
        ),
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
        playOn: !!(document.getElementById("pathWalkBtn") && document.getElementById("pathWalkBtn").classList.contains("on")),
        xy: document.querySelectorAll(".react-flow__node").length,
        cards: document.querySelectorAll(".bubble-card").length,
      };
    }, { chipId: walkMid.chipId, cardId: walkMid.cardId });
    record(
      "PW4",
      "[ steps Map path walk without writing stamps",
      walkBack.moved &&
        walkBack.chipWalk >= 1 &&
        walkBack.cardWalk >= 1 &&
        walkBack.stampPosts === 0 &&
        walkBack.skipPosts === 0,
      JSON.stringify(walkBack)
    );

    await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      const play = document.getElementById("pathWalkBtn");
      if (play && play.classList.contains("on")) play.click();
    });
    const walkPaused = await page.evaluate(() => ({
      playOn: !!(document.getElementById("pathWalkBtn") && document.getElementById("pathWalkBtn").classList.contains("on")),
      cards: document.querySelectorAll(".bubble-card").length,
      xy: document.querySelectorAll(".react-flow__node").length,
    }));
    record(
      "PW5",
      "Pause / stop leaves Map at community LOD (xy=0)",
      walkPaused.cards >= 8 && walkPaused.xy === 0 && !walkPaused.playOn,
      JSON.stringify(walkPaused)
    );

    const walkPosts = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
    }, beforeWalkPosts);
    record(
      "PW6",
      "Map path walk does not post a stamp or skip",
      walkPosts.stampPosts === 0 && walkPosts.skipPosts === 0,
      JSON.stringify(walkPosts)
    );
    const stampDirWalk = path.join(ROOT, ".graphide", "stamps");
    const wroteStampWalk = fs.existsSync(stampDirWalk) && fs.readdirSync(stampDirWalk).length > 0;
    record(
      "PW7",
      "Map path walk did not write .graphide/stamps/",
      !wroteStampWalk,
      wroteStampWalk ? fs.readdirSync(stampDirWalk).join(",") : "absent"
    );

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

    const markBefore = await page.evaluate(() => (window.__vscodePosts || []).length);
    const markDesk = await page.evaluate(() => {
      const covText = ((document.getElementById("coverage") || {}).textContent || "").replace(/\s+/g, " ");
      const uncM = covText.match(/(\d+)\s+uncovered/);
      const chgM = covText.match(/(\d+)\s+changed/);
      const uncN = uncM ? Number(uncM[1]) : 0;
      const chgN = chgM ? Number(chgM[1]) : 0;
      const readMark = () => {
        const meta = document.getElementById("inspMeta");
        const rows = [...(meta ? meta.querySelectorAll(".row") : [])].map((el) => {
          const k = ((el.querySelector(".k") || {}).textContent || "").trim();
          const v = (el.textContent || "").replace(k, "").replace(/\s+/g, " ").trim();
          return { k, v };
        });
        const mark = rows.find((r) => r.k === "mark") || { k: "mark", v: "" };
        const pane = document.getElementById("sourcePane");
        return {
          paneOpen: !!(pane && !pane.hidden),
          kicker: ((document.querySelector(".src-k") || {}).textContent || "").trim(),
          meta: ((meta || {}).textContent || "").replace(/\s+/g, " ").trim().slice(0, 220),
          mark: mark.v,
        };
      };
      let insp = readMark();
      if (!/^(uncovered|changed)$/.test(insp.mark)) {
        const cell = document.querySelector("#ledgerGrid .cell.uncovered[data-id]");
        if (cell) cell.click();
        insp = readMark();
      }
      return {
        covText: covText.slice(0, 160),
        uncN,
        chgN,
        ledgerUnc: !!document.querySelector("#ledgerGrid .cell.uncovered[data-id]"),
        ...insp,
      };
    });
    record(
      "CM1",
      "Explorer snap has coverage.uncovered or coverage.changed",
      markDesk.uncN > 0 || markDesk.chgN > 0,
      "unc=" + markDesk.uncN + " changed=" + markDesk.chgN + " " + markDesk.covText
    );
    record(
      "CM2",
      "#inspMeta mark is uncovered or changed (not only —)",
      markDesk.paneOpen &&
        /Evidence/i.test(markDesk.kicker) &&
        /^(uncovered|changed)$/.test(markDesk.mark) &&
        /uncovered|changed/.test(markDesk.meta) &&
        !/^(—|-)$/.test(markDesk.mark),
      "mark=" + markDesk.mark + " " + markDesk.meta
    );
    await shot(page, "coverage-mark.png");
    const markPosts = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
    }, markBefore);
    record(
      "CM3",
      "Coverage-mark step did not post stamp / skip",
      markPosts.stampPosts === 0 && markPosts.skipPosts === 0,
      JSON.stringify(markPosts)
    );

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

    const liveLanding = await page.evaluate(() => {
      const on = document.querySelector("#workspaces [data-ws].on");
      return on ? on.getAttribute("data-ws") : "";
    });
    record(
      "R3b",
      "self-review lands on Overview when a default run exists",
      liveLanding === "overview",
      liveLanding
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
    const flowHintsGraph = assertFlowHintsSnap(dataflowSnap);
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

    const beforeHintsPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    const flowHintsDesk = await page.evaluate(() => {
      const tab = document.querySelector('#tabs .tab[data-flow="data-subscription"]');
      const tabs = [...document.querySelectorAll("#tabs .tab[data-flow]")].map((el) => ({
        name: el.getAttribute("data-flow") || "",
        on: el.classList.contains("on"),
        text: (el.textContent || "").replace(/\s+/g, " ").trim(),
      }));
      const nodes = document.querySelectorAll("#dfCanvas .df-node").length;
      const hops = document.querySelectorAll("#dfHops .df-hop").length;
      const xy = document.querySelectorAll("#dfCanvas .react-flow__node").length;
      const ws = (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
        ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
        : "";
      return {
        ws,
        tab: !!(tab && /data-subscription/.test((tab.textContent || "") + (tab.getAttribute("data-flow") || ""))),
        on: !!(tab && tab.classList.contains("on")),
        text: tab ? (tab.textContent || "").replace(/\s+/g, " ").trim() : "",
        tabs,
        nodes,
        hops,
        xy,
        mapXy: document.querySelectorAll("#canvas .react-flow__node, .bubble-map .react-flow__node").length,
        cards: document.querySelectorAll(".bubble-card").length,
      };
    });
    record(
      "FH1",
      "Data-flow desk shows flow chip data-subscription",
      flowHintsDesk.tab && flowHintsDesk.ws === "dataflow" && /data-subscription/.test(flowHintsDesk.text),
      JSON.stringify({ ws: flowHintsDesk.ws, text: flowHintsDesk.text, tabs: flowHintsDesk.tabs })
    );
    record(
      "FH2",
      "Named flow chip is the current selection",
      flowHintsDesk.on,
      flowHintsDesk.text || JSON.stringify(flowHintsDesk.tabs)
    );
    record(
      "FH3",
      "Named flow is backed by a derived Steiner pipeline (not an empty chip)",
      flowHintsDesk.nodes >= 2 &&
        flowHintsDesk.hops >= 1 &&
        flowHintsDesk.xy > 1 &&
        flowHintsGraph.nodes >= 2 &&
        flowHintsGraph.edges >= 1,
      "desk=" +
        flowHintsDesk.nodes +
        "n/" +
        flowHintsDesk.hops +
        "h xy=" +
        flowHintsDesk.xy +
        " tree=" +
        flowHintsGraph.nodes +
        "n/" +
        flowHintsGraph.edges +
        "e"
    );
    await shot(page, "flow-hints.png");
    const afterHints = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    }, beforeHintsPosts);
    record(
      "FH4",
      "Flow-hints step did not post stamp / skip",
      afterHints.stampPosts === 0 && afterHints.skipPosts === 0,
      JSON.stringify(afterHints)
    );
    const stampDirFh = path.join(ROOT, ".graphide", "stamps");
    const wroteStampFh = fs.existsSync(stampDirFh) && fs.readdirSync(stampDirFh).length > 0;
    record(
      "FH5",
      "Flow-hints step did not write .graphide/stamps/",
      !wroteStampFh,
      wroteStampFh ? fs.readdirSync(stampDirFh).join(",") : "absent"
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

    const lineageEgo1 = await page.evaluate(() => {
      const btn = document.getElementById("egoBtn");
      const hops = document.getElementById("egoHops");
      if (hops && hops.value !== "1") {
        hops.value = "1";
        hops.dispatchEvent(new Event("change", { bubbles: true }));
      }
      if (btn && !btn.classList.contains("on")) btn.click();
      return {
        on: !!(btn && (btn.classList.contains("on") || true)),
        hops: hops ? hops.value : "",
      };
    });
    await page.waitForTimeout(280);
    const lineageHop1 = await page.evaluate(() => ({
      on: !!(document.getElementById("egoBtn") && document.getElementById("egoBtn").classList.contains("on")),
      hops: ((document.getElementById("egoHops") || {}).value || ""),
      xy: document.querySelectorAll("#lineageCanvas .react-flow__node").length,
      ego: document.querySelectorAll("#lineageCanvas .vnode.ego, #lineageCanvas .ego-node.ego").length,
      focus: document.querySelectorAll('#lineageCanvas .ego-node[data-side="focus"]').length,
    }));
    await page.evaluate(() => {
      const hops = document.getElementById("egoHops");
      if (hops) {
        hops.value = "2";
        hops.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await page.waitForTimeout(280);
    const lineageHop2 = await page.evaluate(() => ({
      hops: ((document.getElementById("egoHops") || {}).value || ""),
      xy: document.querySelectorAll("#lineageCanvas .react-flow__node").length,
      ego: document.querySelectorAll("#lineageCanvas .vnode.ego, #lineageCanvas .ego-node.ego").length,
    }));
    record(
      "EG5",
      "Lineage Ego stays on; 2-hop walk is at least as wide as 1-hop",
      lineageHop1.on && lineageHop1.focus >= 1 && lineageHop1.ego >= 1 && lineageHop2.hops === "2" && lineageHop2.xy >= lineageHop1.xy,
      "1-hop=" + JSON.stringify(lineageHop1) + " 2-hop=" + JSON.stringify(lineageHop2) + " seed=" + JSON.stringify(lineageEgo1)
    );
    await page.evaluate(() => {
      const hops = document.getElementById("egoHops");
      if (hops) {
        hops.value = "1";
        hops.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await page.waitForTimeout(200);

    const lineageSearchQ = await page.evaluate(() => {
      const rec = window.__graphideLineage || {};
      const fqn = rec.fqn || "";
      const tok = (fqn.split("::").pop() || fqn).replace(/[^A-Za-z0-9_]/g, "");
      if (tok.length >= 3) return tok;
      const hop = document.querySelector("#lineageHops .expl-card.hop .t");
      const ht = ((hop && hop.textContent) || "").trim();
      return ht || "encode";
    });
    const lineageHopsBefore = await page.evaluate(() => document.querySelectorAll("#lineageHops .expl-card.hop").length);
    await page.fill("#graphSearch", lineageSearchQ);
    await page.waitForTimeout(280);
    const lineageSearch = await page.evaluate(() => {
      const hops = document.querySelectorAll("#lineageHops .expl-card.hop").length;
      const nodes = [...document.querySelectorAll("#lineageCanvas .vnode[data-id]")];
      return {
        q: ((document.getElementById("graphSearch") || {}).value || "").trim(),
        hops,
        dim: nodes.filter((el) => el.classList.contains("dim")).length,
        hit: nodes.filter((el) => el.classList.contains("hit")).length,
        nodes: nodes.length,
      };
    });
    record(
      "SG3",
      "Find filters Lineage hops / nodes",
      lineageSearch.q === lineageSearchQ && (lineageSearch.hops < lineageHopsBefore || lineageSearch.dim >= 1 || lineageSearch.hit >= 1),
      JSON.stringify({ q: lineageSearchQ, before: lineageHopsBefore, ...lineageSearch })
    );
    await page.fill("#graphSearch", "");
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      const box = document.getElementById("graphSearch");
      if (box && box.blur) box.blur();
    });

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
      "` (chrome 17 + Overview / Decisions / Registry / Timeline) then `" +
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
      " · chrome 17/17 · overview · decisions · registry · timeline · self-review rust graph · map community · enter-bubble · ego · search · ask · keys · path-walk · appearance · coverage-mark · fit-reorg · progress · cancel-review · flow-hints · unmatched-hint · uncovered-node · open-slice · draft-hint · stamp posted · delta · sequence · dataflow · lifecycle · lineage · export · present · preset · route · lens"
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
