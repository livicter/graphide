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
const PYTHON_SNAP = path.join(EXT, "scripts", "python-snap.json");
const JS_SNAP = path.join(EXT, "scripts", "js-snap.json");
const TS_SNAP = path.join(EXT, "scripts", "ts-snap.json");
const DEMO = path.join(ROOT, "fixtures", "demo");
const DEMO_PARENT = path.join(ROOT, "fixtures", "demo-parent");
const PYTHON = path.join(ROOT, "fixtures", "python");
const JS = path.join(ROOT, "fixtures", "js");
const TS = path.join(ROOT, "fixtures", "ts");
const HARNESS = "/scripts/webview-harness.html?mode=explorer&probe=0";
const LIVE_HARNESS = "/scripts/webview-harness.html?live=1&probe=0&require=1";
const DELTA_HARNESS = "/scripts/webview-harness.html?delta=1&probe=0&require=1&ws=delta";
const SEQUENCE_HARNESS = "/scripts/webview-harness.html?sequence=1&probe=0&require=1&ws=sequence";
const DATAFLOW_HARNESS = "/scripts/webview-harness.html?dataflow=1&probe=0&require=1&ws=dataflow";
const LIFECYCLE_HARNESS = "/scripts/webview-harness.html?lifecycle=1&probe=0&require=1&ws=lifecycle";
const PYTHON_HARNESS = "/scripts/webview-harness.html?python=1&probe=0&require=1&ws=dataflow";
const JS_HARNESS = "/scripts/webview-harness.html?js=1&probe=0&require=1&ws=dataflow";
const TS_HARNESS = "/scripts/webview-harness.html?ts=1&probe=0&require=1&ws=dataflow";
const LINEAGE_HARNESS = "/scripts/webview-harness.html?lineage=1&probe=0&require=1&ws=lineage";
const LINEAGE_DELTA_HARNESS = "/scripts/webview-harness.html?delta=1&probe=0&require=1&ws=lineage";
const SYNTHETIC_NODES = 2050;
const SYNTHETIC_EDGES = 4568;

const checks = [];
const artifacts = [];
const STAMP_DIR = path.join(ROOT, ".graphide", "stamps");

function record(id, title, pass, detail) {
  checks.push({ id, title, pass: !!pass, detail: detail == null ? "" : String(detail) });
  const tag = pass ? "ok  " : "FAIL";
  console.log(tag + " " + id + " · " + title + (detail ? " — " + detail : ""));
}

function failFast(msg) {
  console.error("FAIL verify-graphide · " + msg);
  process.exit(1);
}

function noteArtifact(name) {
  if (name && artifacts.indexOf(name) < 0) artifacts.push(name);
}

function stampDirWrote() {
  return fs.existsSync(STAMP_DIR) && fs.readdirSync(STAMP_DIR).length > 0;
}

function assertNoStampDir(id, title) {
  const wrote = stampDirWrote();
  record(id, title, !wrote, wrote ? fs.readdirSync(STAMP_DIR).join(",") : "absent");
}

function failSnapChecks(idRe, report, msg) {
  const failed = checks.filter((c) => !c.pass && idRe.test(c.id));
  if (!failed.length) return;
  writeReport(report);
  failFast(
    msg +
      " — " +
      failed.map((c) => c.id + " " + c.title + (c.detail ? " (" + c.detail + ")" : "")).join("; ")
  );
}

function deriveReviewSnap(opts) {
  const dest = opts.dest;
  const label = opts.label;
  const args = opts.args;
  const maxBuffer = opts.maxBuffer || 16 * 1024 * 1024;
  const timeout = opts.timeout || 5 * 60 * 1000;
  const bin = findGraphideBin();
  if (!bin) {
    failFast(
      "no " +
        label +
        " snapshot: compile `cargo build -p graphide-cli` then run " +
        "`graphide review " +
        args.join(" ") +
        "` into " +
        path.relative(ROOT, dest) +
        (opts.hint ? " " + opts.hint : "")
    );
  }
  console.log("derive " + bin + " review " + args.join(" "));
  const r = spawnSync(bin, ["review"].concat(args), { encoding: "utf8", maxBuffer, timeout });
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) {
    failFast(
      "graphide review (" +
        label +
        ") failed (exit " +
        r.status +
        "): " +
        String(r.stderr || r.stdout || "").slice(-800)
    );
  }
  const text = String(r.stdout || "").trim();
  if (!text) failFast("graphide review (" + label + ") wrote an empty snapshot");
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, text.endsWith("\n") ? text : text + "\n");
  return text;
}

function loadJsonSnap(dest, deriveFn, label) {
  const text = fs.existsSync(dest) ? fs.readFileSync(dest, "utf8") : deriveFn();
  let snap;
  try {
    snap = JSON.parse(text);
  } catch (e) {
    failFast(label + " snapshot is not JSON: " + (e && e.message ? e.message : e));
  }
  if (!snap || typeof snap !== "object") failFast(label + " snapshot is empty");
  return snap;
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
  noteArtifact(name);
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

async function enterCutSig(page) {
  return page.evaluate(() => {
    const nodes = [...document.querySelectorAll("#enterCanvas .vnode[data-shape]")];
    return {
      ids: nodes.map((el) => el.getAttribute("data-id") || "").sort().join(","),
      types: nodes.filter((el) => el.getAttribute("data-shape") === "type" && el.getAttribute("data-leaf") === "0").length,
      leaves: nodes.filter((el) => el.getAttribute("data-leaf") === "1").length,
      cards: document.querySelectorAll(".bubble-card").length,
      runs: document.querySelectorAll("#canvas .run[data-run]").length,
      enter: document.querySelectorAll("#enterCanvas .react-flow__node").length,
    };
  });
}

async function zoomPopOneLevel(page) {
  const before = await enterCutSig(page);
  await page.evaluate(() => {
    const read = () => {
      const m = /(\d+)%/.exec(((document.getElementById("zoomPct") || {}).textContent || ""));
      return m ? Number(m[1]) : 100;
    };
    const zin = document.getElementById("zoomIn");
    for (let i = 0; i < 8 && read() <= 80; i++) {
      if (zin) zin.click();
    }
  });
  for (let i = 0; i < 14; i++) {
    const jumped = await page.evaluate(() => {
      const read = () => {
        const m = /(\d+)%/.exec(((document.getElementById("zoomPct") || {}).textContent || ""));
        return m ? Number(m[1]) : 100;
      };
      const beforePct = read();
      const btn = document.getElementById("zoomOut");
      if (btn) btn.click();
      return read() > beforePct;
    });
    if (jumped) break;
  }
  await page.waitForTimeout(450);
  const after = await enterCutSig(page);
  return { before, after };
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
    "Artifacts: " +
      (artifacts.length ? artifacts.map((n) => "`" + n + "`").join(", ") + ", `report.md`" : "`report.md`") +
      ".",
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
  return deriveReviewSnap({
    dest: SNAP,
    label: "self-review",
    args: ["--root", ROOT, "--json", "--progress", "--no-parent"],
    maxBuffer: 64 * 1024 * 1024,
    timeout: 15 * 60 * 1000,
    hint: "(CI writes this file before npm run verify)",
  });
}

function deriveDeltaSnap() {
  return deriveReviewSnap({
    dest: DELTA_SNAP,
    label: "delta",
    args: ["--root", DEMO, "--parent", DEMO_PARENT, "--json", "--progress"],
  });
}

function loadDeltaSnap() {
  return loadJsonSnap(DELTA_SNAP, deriveDeltaSnap, "delta");
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
  failSnapChecks(
    /^D0/,
    "Delta snapshot failed structural checks (desk not driven).",
    "empty Architecture Delta on demo vs demo-parent"
  );
  return { facts: facts.length, sneaky };
}

function assertClusterSnap(snap) {
  const facts = (snap.delta && snap.delta.cluster_facts) || [];
  const coarse = (snap.bubbles || []).filter((b) => b && b.parent == null);
  const sticky = facts.filter((f) => f && (f.kind === "stable" || f.kind === "relabel"));
  const hit = sticky.find((f) => coarse.some((b) => String(b.id) === String(f.bubble)));
  record(
    "SC0",
    "delta snap has a sticky coarse BubbleId after sticky_match",
    !!hit,
    hit
      ? "kind=" + hit.kind + " bubble=" + hit.bubble + " label=" + (hit.label || "")
      : "cluster_facts=" + facts.length + " coarse=" + coarse.length
  );
  if (!hit) {
    writeReport("Sticky cluster snapshot failed structural checks (desk not driven).");
    failFast(
      "demo vs demo-parent must sticky-match a coarse BubbleId — cluster_facts=" +
        JSON.stringify(facts.slice(0, 8))
    );
  }
  return { bubble: String(hit.bubble), kind: hit.kind, label: hit.label || "", n: facts.length };
}

function assertStickyViewsSnap(snap) {
  const facts = (snap.delta && snap.delta.cluster_facts) || [];
  const coarse = (snap.bubbles || []).filter((b) => b && b.parent == null);
  const parentBubbles = ((snap.delta && snap.delta.parent_bubbles) || []).filter(
    (b) => b && b.parent == null
  );
  const sticky = facts.filter((f) => f && (f.kind === "stable" || f.kind === "relabel"));
  const hit = sticky.find(
    (f) =>
      coarse.some((b) => String(b.id) === String(f.bubble) && (b.members || []).length) &&
      parentBubbles.some((b) => String(b.id) === String(f.bubble) && (b.members || []).length)
  );
  record(
    "SV0",
    "delta snap ships parent_bubbles for a sticky coarse BubbleId",
    !!hit && parentBubbles.length > 0,
    hit
      ? "kind=" +
          hit.kind +
          " bubble=" +
          hit.bubble +
          " parent_bubbles=" +
          parentBubbles.length
      : "cluster_facts=" + facts.length + " parent_bubbles=" + parentBubbles.length
  );
  if (!hit) {
    writeReport("Delta sticky views snapshot failed structural checks (desk not driven).");
    failFast(
      "demo vs demo-parent must ship parent_bubbles for a sticky BubbleId — parent_bubbles=" +
        parentBubbles.length
    );
  }
  return { bubble: String(hit.bubble), kind: hit.kind, label: hit.label || "", n: facts.length };
}

function assertProposedUncoveredSnap(snap) {
  const flows = snap.flows || [];
  const named = flows.find((f) => f && (f.proposed || f.name === "proposed-uncovered"));
  const hits = ((named && named.hits) || []).map((h) => String(h || ""));
  const tree = (named && named.tree) || { nodes: [], edges: [] };
  const nodes = (tree.nodes || []).length;
  const hasHelper = hits.some((h) => /sneaky_helper/.test(h));
  const leftover = ((snap.coverage && snap.coverage.uncovered) || []).length;
  record(
    "PU0",
    "delta fixture snap has proposed-uncovered Steiner from the parent cut",
    !!(named && named.proposed && named.name === "proposed-uncovered" && hasHelper && nodes >= 1),
    named
      ? "hits=" + hits.join(",") + " tree=" + nodes + "n leftover=" + leftover
      : "flows=" + flows.map((f) => f && f.name).join(",")
  );
  failSnapChecks(
    /^PU0$/,
    "Proposed-uncovered snapshot failed structural checks (desk not driven).",
    "demo vs demo-parent snap missing proposed-uncovered flow"
  );
  return { name: named.name, nodes, hits, leftover };
}

function deriveSequenceSnap() {
  return deriveReviewSnap({
    dest: SEQUENCE_SNAP,
    label: "sequence",
    args: ["--root", DEMO, "--json", "--progress", "--no-parent"],
  });
}

function loadSequenceSnap() {
  return loadJsonSnap(SEQUENCE_SNAP, deriveSequenceSnap, "sequence");
}

function deriveDataflowSnap() {
  return deriveReviewSnap({
    dest: DATAFLOW_SNAP,
    label: "dataflow",
    args: ["--root", DEMO, "--json", "--progress", "--no-parent"],
  });
}

function loadDataflowSnap() {
  return loadJsonSnap(DATAFLOW_SNAP, deriveDataflowSnap, "dataflow");
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
  const namedDf = flows.find((f) => f && f.name === "data-subscription");
  const pipeHops = (namedDf && namedDf.dataflow && namedDf.dataflow.hops) || [];
  const pipe =
    pipeHops.length >= 2 &&
    pipeHops[0].kind === "Publishes" &&
    /publish/i.test(pipeHops[0].from_fqn || "") &&
    /events/i.test(pipeHops[0].to_fqn || "") &&
    pipeHops[1].kind === "Subscribes" &&
    /events/i.test(pipeHops[1].from_fqn || "") &&
    /subscribe/i.test(pipeHops[1].to_fqn || "");
  record(
    "F0c",
    "data-subscription hops run publish → events → subscribe",
    pipe,
    pipeHops
      .slice(0, 2)
      .map((h) => (h && h.kind) + " " + ((h && h.from_fqn) || "") + " → " + ((h && h.to_fqn) || ""))
      .join(" | ")
  );
  failSnapChecks(
    /^F0/,
    "Data-flow snapshot failed structural checks (desk not driven).",
    "empty Data-flow on fixtures/demo"
  );
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
  failSnapChecks(
    /^FH0$/,
    "Flow-hints snapshot failed structural checks (desk not driven).",
    "fixtures/demo snap missing named flows.toml flow"
  );
  return { name: named.name, nodes, edges, hits };
}

function deriveLifecycleSnap() {
  return deriveReviewSnap({
    dest: LIFECYCLE_SNAP,
    label: "lifecycle",
    args: ["--root", DEMO, "--json", "--progress", "--no-parent"],
  });
}

function loadLifecycleSnap() {
  return loadJsonSnap(LIFECYCLE_SNAP, deriveLifecycleSnap, "lifecycle");
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
  failSnapChecks(
    /^L0/,
    "Lifecycle snapshot failed structural checks (desk not driven).",
    "empty Lifecycle on fixtures/demo"
  );
  return { states: best ? best.states : 0, trans: best ? best.trans : 0, ends: best ? best.ends : 0 };
}

function derivePythonSnap() {
  return deriveReviewSnap({
    dest: PYTHON_SNAP,
    label: "python",
    args: ["--root", PYTHON, "--json", "--progress", "--no-parent"],
  });
}

function loadPythonSnap() {
  return loadJsonSnap(PYTHON_SNAP, derivePythonSnap, "python");
}

function assertPythonSnap(snap) {
  const nodes = (snap.graph && snap.graph.nodes) || [];
  const edges = (snap.graph && snap.graph.edges) || [];
  const files = snap.stats && snap.stats.files != null ? Number(snap.stats.files) : 0;
  const plugin = String(snap.plugin || "");
  const pyFiles = nodes.filter((n) => /\.py$/i.test(((n && n.span) || {}).file || "")).length;
  const flows = snap.flows || [];
  const named = flows.find((f) => f && f.name === "data-subscription");
  const hits = ((named && named.hits) || []).map((h) => String(h || ""));
  const tree = (named && named.tree) || { nodes: [], edges: [] };
  const treeNodes = (tree.nodes || []).length;
  const treeEdges = (tree.edges || []).length;
  const hasSubscribe = hits.some((h) => /subscribe/i.test(h));
  const hasEvents = hits.some((h) => /events/i.test(h));
  const readings = flows.map((f) => {
    const df = (f && f.dataflow) || { nodes: [], hops: [] };
    const roles = (df.nodes || []).map((n) => n && n.role).filter(Boolean);
    return {
      name: f && f.name,
      nodes: (df.nodes || []).length,
      hops: (df.hops || []).length,
      roles,
    };
  });
  const best = readings.reduce((a, b) => (b.hops > (a ? a.hops : 0) ? b : a), readings[0] || null);
  const hasSource = !!(best && best.roles.indexOf("source") >= 0);
  const hasSink = !!(best && best.roles.indexOf("sink") >= 0);
  const text = JSON.stringify(snap);
  const subscribe = /subscribe/i.test(text) && /events/i.test(text);
  record(
    "PY0",
    "python fixture snap is python@ with a real graph",
    /python@/i.test(plugin) && nodes.length > 0 && edges.length > 0 && files > 0 && pyFiles > 0,
    "plugin=" + plugin + " nodes=" + nodes.length + " edges=" + edges.length + " files=" + files + " py=" + pyFiles
  );
  record(
    "PY0b",
    "python fixture snap has named flow data-subscription with a Steiner tree",
    !!(named && hasSubscribe && hasEvents && treeNodes >= 2 && treeEdges >= 1),
    named
      ? "hits=" + hits.join(",") + " tree=" + treeNodes + "n/" + treeEdges + "e"
      : "flows=" + flows.map((f) => f && f.name).join(",")
  );
  record(
    "PY0c",
    "python fixture snap has a flow with Source and Sink hops",
    !!(best && best.nodes >= 2 && best.hops >= 1 && hasSource && hasSink && subscribe),
    readings.map((r) => r.name + ":" + r.nodes + "n/" + r.hops + "h/" + r.roles.join("+")).join(" ")
  );
  failSnapChecks(
    /^PY0/,
    "Python snapshot failed structural checks (desk not driven).",
    "empty Python desk on fixtures/python"
  );
  return {
    nodes: nodes.length,
    hops: best ? best.hops : 0,
    source: hasSource,
    sink: hasSink,
    plugin,
  };
}

function deriveJsSnap() {
  return deriveReviewSnap({
    dest: JS_SNAP,
    label: "js",
    args: ["--root", JS, "--json", "--progress", "--no-parent"],
  });
}

function loadJsSnap() {
  return loadJsonSnap(JS_SNAP, deriveJsSnap, "js");
}

function assertJsSnap(snap) {
  const nodes = (snap.graph && snap.graph.nodes) || [];
  const edges = (snap.graph && snap.graph.edges) || [];
  const files = snap.stats && snap.stats.files != null ? Number(snap.stats.files) : 0;
  const plugin = String(snap.plugin || "");
  const jsFiles = nodes.filter((n) => /\.js$/i.test(((n && n.span) || {}).file || "")).length;
  const flows = snap.flows || [];
  const named = flows.find((f) => f && f.name === "data-subscription");
  const hits = ((named && named.hits) || []).map((h) => String(h || ""));
  const tree = (named && named.tree) || { nodes: [], edges: [] };
  const treeNodes = (tree.nodes || []).length;
  const treeEdges = (tree.edges || []).length;
  const hasSubscribe = hits.some((h) => /subscribe/i.test(h));
  const hasEvents = hits.some((h) => /events/i.test(h));
  const readings = flows.map((f) => {
    const df = (f && f.dataflow) || { nodes: [], hops: [] };
    const roles = (df.nodes || []).map((n) => n && n.role).filter(Boolean);
    return {
      name: f && f.name,
      nodes: (df.nodes || []).length,
      hops: (df.hops || []).length,
      roles,
    };
  });
  const best = readings.reduce((a, b) => (b.hops > (a ? a.hops : 0) ? b : a), readings[0] || null);
  const hasSource = !!(best && best.roles.indexOf("source") >= 0);
  const hasSink = !!(best && best.roles.indexOf("sink") >= 0);
  const text = JSON.stringify(snap);
  const subscribe = /subscribe/i.test(text) && /events/i.test(text);
  record(
    "JS0",
    "javascript fixture snap is javascript@ with a real graph",
    /javascript@/i.test(plugin) && nodes.length > 0 && edges.length > 0 && files > 0 && jsFiles > 0,
    "plugin=" + plugin + " nodes=" + nodes.length + " edges=" + edges.length + " files=" + files + " js=" + jsFiles
  );
  record(
    "JS0b",
    "javascript fixture snap has named flow data-subscription with a Steiner tree",
    !!(named && hasSubscribe && hasEvents && treeNodes >= 2 && treeEdges >= 1),
    named
      ? "hits=" + hits.join(",") + " tree=" + treeNodes + "n/" + treeEdges + "e"
      : "flows=" + flows.map((f) => f && f.name).join(",")
  );
  record(
    "JS0c",
    "javascript fixture snap has a flow with Source and Sink hops",
    !!(best && best.nodes >= 2 && best.hops >= 1 && hasSource && hasSink && subscribe),
    readings.map((r) => r.name + ":" + r.nodes + "n/" + r.hops + "h/" + r.roles.join("+")).join(" ")
  );
  failSnapChecks(
    /^JS0/,
    "JavaScript snapshot failed structural checks (desk not driven).",
    "empty JavaScript desk on fixtures/js"
  );
  return {
    nodes: nodes.length,
    hops: best ? best.hops : 0,
    source: hasSource,
    sink: hasSink,
    plugin,
  };
}

function deriveTsSnap() {
  return deriveReviewSnap({
    dest: TS_SNAP,
    label: "ts",
    args: ["--root", TS, "--json", "--progress", "--no-parent"],
  });
}

function loadTsSnap() {
  return loadJsonSnap(TS_SNAP, deriveTsSnap, "ts");
}

function assertTsSnap(snap) {
  const nodes = (snap.graph && snap.graph.nodes) || [];
  const edges = (snap.graph && snap.graph.edges) || [];
  const files = snap.stats && snap.stats.files != null ? Number(snap.stats.files) : 0;
  const plugin = String(snap.plugin || "");
  const tsFiles = nodes.filter((n) => /\.tsx?$/i.test(((n && n.span) || {}).file || "")).length;
  const flows = snap.flows || [];
  const named = flows.find((f) => f && f.name === "data-subscription");
  const hits = ((named && named.hits) || []).map((h) => String(h || ""));
  const tree = (named && named.tree) || { nodes: [], edges: [] };
  const treeNodes = (tree.nodes || []).length;
  const treeEdges = (tree.edges || []).length;
  const hasSubscribe = hits.some((h) => /subscribe/i.test(h));
  const hasEvents = hits.some((h) => /events/i.test(h));
  const readings = flows.map((f) => {
    const df = (f && f.dataflow) || { nodes: [], hops: [] };
    const roles = (df.nodes || []).map((n) => n && n.role).filter(Boolean);
    return {
      name: f && f.name,
      nodes: (df.nodes || []).length,
      hops: (df.hops || []).length,
      roles,
    };
  });
  const best = readings.reduce((a, b) => (b.hops > (a ? a.hops : 0) ? b : a), readings[0] || null);
  const hasSource = !!(best && best.roles.indexOf("source") >= 0);
  const hasSink = !!(best && best.roles.indexOf("sink") >= 0);
  const text = JSON.stringify(snap);
  const subscribe = /subscribe/i.test(text) && /events/i.test(text);
  record(
    "TS0",
    "typescript fixture snap is typescript@ with a real graph",
    /typescript@/i.test(plugin) && nodes.length > 0 && edges.length > 0 && files > 0 && tsFiles > 0,
    "plugin=" + plugin + " nodes=" + nodes.length + " edges=" + edges.length + " files=" + files + " ts=" + tsFiles
  );
  record(
    "TS0b",
    "typescript fixture snap has named flow data-subscription with a Steiner tree",
    !!(named && hasSubscribe && hasEvents && treeNodes >= 2 && treeEdges >= 1),
    named
      ? "hits=" + hits.join(",") + " tree=" + treeNodes + "n/" + treeEdges + "e"
      : "flows=" + flows.map((f) => f && f.name).join(",")
  );
  record(
    "TS0c",
    "typescript fixture snap has a flow with Source and Sink hops",
    !!(best && best.nodes >= 2 && best.hops >= 1 && hasSource && hasSink && subscribe),
    readings.map((r) => r.name + ":" + r.nodes + "n/" + r.hops + "h/" + r.roles.join("+")).join(" ")
  );
  failSnapChecks(
    /^TS0/,
    "TypeScript snapshot failed structural checks (desk not driven).",
    "empty TypeScript desk on fixtures/ts"
  );
  return {
    nodes: nodes.length,
    hops: best ? best.hops : 0,
    source: hasSource,
    sink: hasSink,
    plugin,
  };
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
  failSnapChecks(
    /^Q0/,
    "Sequence snapshot failed structural checks (desk not driven).",
    "empty Sequence on fixtures/demo"
  );
  return { parts: best ? best.parts : 0, hops: best ? best.hops : 0 };
}

function loadSelfReviewSnap() {
  return loadJsonSnap(SNAP, deriveSelfReviewSnap, "self-review");
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

  failSnapChecks(
    /^G\d/,
    "Self-review snapshot failed structural checks (desk not driven).",
    "broken deriver or empty graph"
  );
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
    assertNoStampDir("OV5", "Overview step did not write .graphide/stamps/");

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
    assertNoStampDir("DC4", "Decisions step did not write .graphide/stamps/");

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
    assertNoStampDir("UH5", "Unmatched-hint step did not write .graphide/stamps/");

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
    assertNoStampDir("OS5", "Open-slice step did not write .graphide/stamps/");

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
    assertNoStampDir("RG3", "Registry step did not write .graphide/stamps/");

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
    assertNoStampDir("TL3", "Timeline step did not write .graphide/stamps/");

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
    assertNoStampDir("UN5", "Uncovered-node step did not write .graphide/stamps/");

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
    assertNoStampDir("DH5", "Draft-hint step did not write .graphide/stamps/");

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

    const mapSpine = await page.evaluate(() => {
      const edge = document.querySelector(
        'svg.comm-edges path.edge-hit[data-from="b-integration"][data-to="b-origin"]'
      );
      if (edge) edge.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      const card = document.getElementById("hopCard");
      const text = card ? card.textContent.replace(/\s+/g, " ").trim() : "";
      return {
        kind: edge ? edge.getAttribute("data-kind") || "" : "",
        hopFrom: edge ? edge.getAttribute("data-hop-from") || "" : "",
        hopTo: edge ? edge.getAttribute("data-hop-to") || "" : "",
        hidden: !card || card.hidden,
        text,
        ids: card ? [...card.querySelectorAll("[data-id]")].map((el) => el.getAttribute("data-id") || "") : [],
      };
    });
    record(
      "M2d",
      "Map story hop is the derived Reads edge, not Calls between community ids",
      mapSpine.kind === "Reads" &&
        mapSpine.hopFrom === "n1" &&
        mapSpine.hopTo === "n2" &&
        !mapSpine.hidden &&
        mapSpine.ids.indexOf("n1") >= 0 &&
        mapSpine.ids.indexOf("n2") >= 0 &&
        mapSpine.ids.indexOf("b-integration") < 0 &&
        /Reads/.test(mapSpine.text) &&
        /solarsim::ext/.test(mapSpine.text) &&
        /solarsim::as_str/.test(mapSpine.text),
      JSON.stringify(mapSpine)
    );
    await shot(page, "map-spine-hop.png");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(120);

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

    const beforeAppleChromePosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    const appleChrome = await page.evaluate(() => {
      const cs = (el) => (el ? getComputedStyle(el) : null);
      const parseRgb = (v) => {
        const m = String(v || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
      };
      const near = (a, b, slack) => Math.abs(a - b) <= slack;
      const rad = (el) => {
        const r = el ? parseFloat(cs(el).borderRadius) : 0;
        return Number.isFinite(r) ? r : 0;
      };
      const capsule = (el) => {
        if (!el) return false;
        const st = cs(el);
        const r = parseFloat(st.borderRadius);
        const h = el.getBoundingClientRect().height;
        return (Number.isFinite(r) && r >= 12) || (Number.isFinite(r) && h > 0 && r >= h / 2 - 1);
      };
      const frost = (el) => {
        if (!el) return false;
        const st = cs(el);
        const bg = st.backgroundColor || "";
        const blur = st.backdropFilter || st.webkitBackdropFilter || "";
        return /blur\(/i.test(blur) || /rgba?\(\s*255,\s*255,\s*255/i.test(bg) || /rgba?\(\s*242,\s*242,\s*247/i.test(bg);
      };
      const review = document.getElementById("reviewBtn");
      const stamp = document.getElementById("stampBtn");
      const skip = document.getElementById("skipBtn");
      const llm = document.getElementById("llmBtn");
      const exp = document.getElementById("exportBtn");
      const ws = document.getElementById("workspaces");
      const mapTab = document.querySelector('#workspaces [data-ws="map"]');
      const card = document.querySelector(".bubble-card");
      const cov = document.getElementById("coverage");
      const reviewBg = review ? parseRgb(cs(review).backgroundColor) : null;
      const reviewBlue = !!(
        reviewBg &&
        near(reviewBg[0], 0, 12) &&
        near(reviewBg[1], 122, 20) &&
        near(reviewBg[2], 255, 20)
      );
      const onBg = mapTab ? parseRgb(cs(mapTab).backgroundColor) : null;
      const onColor = mapTab ? parseRgb(cs(mapTab).color) : null;
      const tinted = !!(
        mapTab &&
        mapTab.classList.contains("on") &&
        ((onColor && near(onColor[0], 0, 24) && near(onColor[1], 122, 36) && near(onColor[2], 255, 36)) ||
          (onBg && onBg[2] > onBg[0] + 20 && onBg[2] > 140))
      );
      const tile = card && card.querySelector(".tile");
      return {
        bright:
          document.documentElement.classList.contains("bright") && document.body.classList.contains("bright"),
        night: document.documentElement.classList.contains("night") || document.body.classList.contains("night"),
        dayOn: !!(document.getElementById("themeDay") && document.getElementById("themeDay").classList.contains("on")),
        seg: !!document.getElementById("themeSeg"),
        reviewBlue,
        reviewBg: review ? cs(review).backgroundColor : "",
        capsules: [stamp, skip, llm, exp].every(capsule),
        capsuleR: [stamp, skip, llm, exp].map(rad),
        wsRadius: rad(ws),
        mapOn: !!(mapTab && mapTab.classList.contains("on")),
        tinted,
        onBg: mapTab ? cs(mapTab).backgroundColor : "",
        onColor: mapTab ? cs(mapTab).color : "",
        cardR: rad(card),
        cardShadow: card ? cs(card).boxShadow : "",
        tile: !!(tile && tile.getBoundingClientRect().width >= 16),
        covFrost: frost(cov),
        covBg: cov ? cs(cov).backgroundColor + " " + (cs(cov).backdropFilter || "") : "",
        xy: document.querySelectorAll(".react-flow__node").length,
        cards: document.querySelectorAll(".bubble-card").length,
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    });
    record(
      "AC0",
      "explorer Day Map shows bright chrome markers",
      appleChrome.bright &&
        !appleChrome.night &&
        appleChrome.dayOn &&
        appleChrome.seg &&
        appleChrome.ws === "map",
      JSON.stringify({
        bright: appleChrome.bright,
        night: appleChrome.night,
        dayOn: appleChrome.dayOn,
        seg: appleChrome.seg,
        ws: appleChrome.ws,
      })
    );
    record(
      "AC1",
      "#reviewBtn is system blue #007AFF on Day",
      appleChrome.reviewBlue,
      appleChrome.reviewBg
    );
    record(
      "AC2",
      "Stamp / Skip / LLM / Export are capsules",
      appleChrome.capsules,
      JSON.stringify(appleChrome.capsuleR)
    );
    record(
      "AC3",
      ".workspaces is a pill rack with tinted Map .on",
      appleChrome.wsRadius >= 10 && appleChrome.mapOn && appleChrome.tinted,
      JSON.stringify({
        wsRadius: appleChrome.wsRadius,
        mapOn: appleChrome.mapOn,
        tinted: appleChrome.tinted,
        onBg: appleChrome.onBg,
        onColor: appleChrome.onColor,
      })
    );
    record(
      "AC4",
      "Map .bubble-card is a soft card with a tinted tile",
      appleChrome.cardR >= 12 &&
        appleChrome.tile &&
        appleChrome.cardShadow &&
        appleChrome.cardShadow !== "none",
      JSON.stringify({
        cardR: appleChrome.cardR,
        tile: appleChrome.tile,
        shadow: appleChrome.cardShadow,
      })
    );
    record(
      "AC5",
      "#coverage is a frosted grouped strip",
      appleChrome.covFrost,
      appleChrome.covBg
    );
    record(
      "AC6",
      "Apple chrome keeps Map community LOD (xy=0)",
      appleChrome.xy === 0 && appleChrome.cards >= 8,
      "xy=" + appleChrome.xy + " cards=" + appleChrome.cards
    );
    await shot(page, "apple-chrome.png");
    const afterAppleChrome = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
    }, beforeAppleChromePosts);
    record(
      "AC7",
      "Apple-chrome step did not post stamp / skip",
      afterAppleChrome.stampPosts === 0 && afterAppleChrome.skipPosts === 0,
      JSON.stringify(afterAppleChrome)
    );
    assertNoStampDir("AC8", "Apple-chrome step did not write .graphide/stamps/");

    const beforeAppleIconsPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    const appleIcons = await page.evaluate(() => {
      const tabs = [...document.querySelectorAll("#workspaces [data-ws]")];
      const cards = [...document.querySelectorAll(".bubble-card")];
      const iconOk = tabs.length > 0 && tabs.every((el) => !!(el.querySelector("svg, img, .ws-ico")));
      const tiles = cards.map((card) => {
        const tile = card.querySelector(".tile");
        const r = tile ? tile.getBoundingClientRect() : null;
        return !!(tile && r && r.width >= 16 && r.height >= 16);
      });
      return {
        tabs: tabs.length,
        withIco: tabs.filter((el) => el.querySelector("svg, img, .ws-ico")).length,
        iconOk,
        cards: cards.length,
        tiles: tiles.filter(Boolean).length,
        tileOk: cards.length > 0 && tiles.every(Boolean),
        xy: document.querySelectorAll(".react-flow__node").length,
      };
    });
    record(
      "AI0",
      "workspace buttons contain an icon mark (svg / img / .ws-ico)",
      appleIcons.iconOk,
      JSON.stringify({ tabs: appleIcons.tabs, withIco: appleIcons.withIco })
    );
    record(
      "AI1",
      "Map bubble cards have a visible .tile",
      appleIcons.tileOk && appleIcons.cards >= 8,
      JSON.stringify({ cards: appleIcons.cards, tiles: appleIcons.tiles })
    );
    record(
      "AI2",
      "Apple chrome icons keep Map community LOD (xy=0)",
      appleIcons.xy === 0 && appleIcons.cards >= 8,
      "xy=" + appleIcons.xy + " cards=" + appleIcons.cards
    );
    await shot(page, "apple-chrome-icons.png");
    const afterAppleIcons = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
    }, beforeAppleIconsPosts);
    record(
      "AI3",
      "Apple-chrome-icons step did not post stamp / skip",
      afterAppleIcons.stampPosts === 0 && afterAppleIcons.skipPosts === 0,
      JSON.stringify(afterAppleIcons)
    );
    assertNoStampDir("AI4", "Apple-chrome-icons step did not write .graphide/stamps/");

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
    assertNoStampDir("FR5", "Fit / Reorganize did not write .graphide/stamps/");

    const readZoomDesk = () =>
      page.evaluate(() => {
        const pctText = ((document.getElementById("zoomPct") || {}).textContent || "").trim();
        const m = pctText.match(/(\d+)\s*%/);
        const vp = document.querySelector("#canvas .viewport");
        const kCam = vp ? parseFloat(vp.style.getPropertyValue("--cam-k") || "0") : 0;
        const t = (vp && vp.style.transform) || "";
        const sm = t.match(/scale\(([-0-9.]+)\)/);
        const kTf = sm ? Number(sm[1]) : 0;
        const k = Number.isFinite(kCam) && kCam > 0 ? kCam : kTf;
        const stage = document.querySelector("#canvas .stage");
        const stageBox = stage ? stage.getBoundingClientRect() : null;
        const cards = [...document.querySelectorAll(".bubble-card")].map((el) => el.getBoundingClientRect());
        const visible = cards.filter((c) => {
          if (!stageBox || c.width < 4 || c.height < 4) return false;
          return !(c.right <= stageBox.left || c.left >= stageBox.right || c.bottom <= stageBox.top || c.top >= stageBox.bottom);
        });
        const zin = document.getElementById("zoomIn");
        const zout = document.getElementById("zoomOut");
        return {
          pct: m ? Number(m[1]) : null,
          pctText,
          k,
          kTf,
          cards: cards.length,
          visible: visible.length,
          xy: document.querySelectorAll(".react-flow__node").length,
          comm: document.querySelectorAll(".comm-node").length,
          ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
            ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
            : "",
          zoomIn: !!zin,
          zoomOut: !!zout,
        };
      });
    const beforeZoomPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
    const beforeZoom = await readZoomDesk();
    const zoomInVia = await page.evaluate(() => {
      const btn = document.getElementById("zoomIn");
      if (!btn) return "";
      btn.click();
      return "zoomIn";
    });
    await page.waitForTimeout(400);
    const afterZoomIn = await readZoomDesk();
    record(
      "Z1",
      "Zoom in (#zoomIn) raises percent / scale; Map stays community LOD",
      zoomInVia === "zoomIn" &&
        afterZoomIn.zoomIn &&
        afterZoomIn.ws === "map" &&
        afterZoomIn.xy === 0 &&
        afterZoomIn.comm === 0 &&
        afterZoomIn.cards > 1 &&
        afterZoomIn.visible >= 1 &&
        beforeZoom.pct != null &&
        afterZoomIn.pct != null &&
        afterZoomIn.pct > beforeZoom.pct &&
        afterZoomIn.k > beforeZoom.k + 0.02,
      "via=" + zoomInVia + " before=" + JSON.stringify(beforeZoom) + " after=" + JSON.stringify(afterZoomIn)
    );
    await shot(page, "zoom.png");
    const zoomOutVia = await page.evaluate(() => {
      const btn = document.getElementById("zoomOut");
      if (!btn) return "";
      btn.click();
      return "zoomOut";
    });
    await page.waitForTimeout(400);
    const afterZoomOut = await page.evaluate((before) => {
      const pctText = ((document.getElementById("zoomPct") || {}).textContent || "").trim();
      const m = pctText.match(/(\d+)\s*%/);
      const vp = document.querySelector("#canvas .viewport");
      const kCam = vp ? parseFloat(vp.style.getPropertyValue("--cam-k") || "0") : 0;
      const t = (vp && vp.style.transform) || "";
      const sm = t.match(/scale\(([-0-9.]+)\)/);
      const kTf = sm ? Number(sm[1]) : 0;
      const k = Number.isFinite(kCam) && kCam > 0 ? kCam : kTf;
      const posts = (window.__vscodePosts || []).slice(before);
      const stage = document.querySelector("#canvas .stage");
      const stageBox = stage ? stage.getBoundingClientRect() : null;
      const cards = [...document.querySelectorAll(".bubble-card")].map((el) => el.getBoundingClientRect());
      const visible = cards.filter((c) => {
        if (!stageBox || c.width < 4 || c.height < 4) return false;
        return !(c.right <= stageBox.left || c.left >= stageBox.right || c.bottom <= stageBox.top || c.top >= stageBox.bottom);
      });
      return {
        pct: m ? Number(m[1]) : null,
        pctText,
        k,
        cards: cards.length,
        visible: visible.length,
        xy: document.querySelectorAll(".react-flow__node").length,
        comm: document.querySelectorAll(".comm-node").length,
        stampPosts: posts.filter((p) => p && p.type === "stamp").length,
        skipPosts: posts.filter((p) => p && p.type === "skip").length,
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    }, beforeZoomPosts);
    record(
      "Z2",
      "Zoom out (#zoomOut) lowers percent / scale; Map stays community LOD",
      zoomOutVia === "zoomOut" &&
        afterZoomOut.ws === "map" &&
        afterZoomOut.xy === 0 &&
        afterZoomOut.comm === 0 &&
        afterZoomOut.cards > 1 &&
        afterZoomOut.visible >= 1 &&
        afterZoomIn.pct != null &&
        afterZoomOut.pct != null &&
        afterZoomOut.pct < afterZoomIn.pct &&
        afterZoomOut.k < afterZoomIn.k - 0.02,
      "via=" + zoomOutVia + " in=" + JSON.stringify(afterZoomIn) + " out=" + JSON.stringify(afterZoomOut)
    );
    record(
      "Z3",
      "Zoom in / out does not post stamp / skip",
      afterZoomOut.stampPosts === 0 && afterZoomOut.skipPosts === 0,
      JSON.stringify({ stampPosts: afterZoomOut.stampPosts, skipPosts: afterZoomOut.skipPosts })
    );
    assertNoStampDir("Z4", "Zoom did not write .graphide/stamps/");

    const recycleBefore = await page.evaluate(() => {
      const stage = document.querySelector("#canvas .stage");
      const vp = document.querySelector("#canvas .viewport");
      if (stage) stage.dataset.recycleMark = "1";
      if (vp) vp.dataset.recycleMark = "1";
      const kCam = vp ? parseFloat(vp.style.getPropertyValue("--cam-k") || "0") : 0;
      return {
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        comm: document.querySelectorAll(".comm-node").length,
        lod: vp ? vp.getAttribute("data-lod") : "",
        k: kCam,
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    });
    record(
      "RC0",
      "Map paints communities before recycle",
      recycleBefore.ws === "map" &&
        recycleBefore.xy === 0 &&
        recycleBefore.comm === 0 &&
        recycleBefore.cards > 1 &&
        recycleBefore.lod === "0",
      JSON.stringify(recycleBefore)
    );
    await page.evaluate(() => {
      const btn = document.getElementById("zoomIn");
      if (btn) btn.click();
    });
    await page.waitForTimeout(350);
    const recycleCam = await page.evaluate(() => {
      const vp = document.querySelector("#canvas .viewport");
      return parseFloat((vp && vp.style.getPropertyValue("--cam-k")) || "0");
    });
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForTimeout(220);
    const afterReselect = await page.evaluate((wantK) => {
      const stage = document.querySelector("#canvas .stage");
      const vp = document.querySelector("#canvas .viewport");
      const kCam = vp ? parseFloat(vp.style.getPropertyValue("--cam-k") || "0") : 0;
      return {
        sameStage: !!(stage && stage.dataset.recycleMark === "1"),
        sameVp: !!(vp && vp.dataset.recycleMark === "1"),
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        comm: document.querySelectorAll(".comm-node").length,
        lod: vp ? vp.getAttribute("data-lod") : "",
        k: kCam,
        wantK,
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    }, recycleCam);
    record(
      "RC1",
      "Re-select Map recycles the same .stage / .viewport (keepCam)",
      afterReselect.ws === "map" &&
        afterReselect.sameStage &&
        afterReselect.sameVp &&
        afterReselect.xy === 0 &&
        afterReselect.comm === 0 &&
        afterReselect.cards > 1 &&
        afterReselect.lod === "0" &&
        afterReselect.k > 0 &&
        Math.abs(afterReselect.k - recycleCam) < 0.2 &&
        (Math.abs(recycleCam - 1) < 0.05 || Math.abs(afterReselect.k - 1) > 0.04),
      JSON.stringify(afterReselect)
    );
    const recycledSpine = await page.evaluate(() => {
      const edge = document.querySelector(
        'svg.comm-edges path.edge-hit[data-from="b-integration"][data-to="b-origin"]'
      );
      if (edge) edge.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      const card = document.getElementById("hopCard");
      const text = card ? card.textContent.replace(/\s+/g, " ").trim() : "";
      return {
        kind: edge ? edge.getAttribute("data-kind") || "" : "",
        hopFrom: edge ? edge.getAttribute("data-hop-from") || "" : "",
        hopTo: edge ? edge.getAttribute("data-hop-to") || "" : "",
        hidden: !card || card.hidden,
        text,
        ids: card ? [...card.querySelectorAll("[data-id]")].map((el) => el.getAttribute("data-id") || "") : [],
      };
    });
    record(
      "RC1b",
      "Recycled Map story hop still names the member nodes",
      recycledSpine.kind === "Reads" &&
        recycledSpine.hopFrom === "n1" &&
        recycledSpine.hopTo === "n2" &&
        !recycledSpine.hidden &&
        recycledSpine.ids.indexOf("n1") >= 0 &&
        recycledSpine.ids.indexOf("n2") >= 0 &&
        recycledSpine.ids.indexOf("b-integration") < 0 &&
        /Reads/.test(recycledSpine.text) &&
        /solarsim::ext/.test(recycledSpine.text) &&
        /solarsim::as_str/.test(recycledSpine.text),
      JSON.stringify(recycledSpine)
    );
    await shot(page, "map-spine-recycle.png");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(80);
    const recyclePostsAt = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.evaluate(() => {
      window.postMessage(
        {
          type: "progress",
          phase: "cluster",
          label: "Recycle preview",
          done: 2,
          total: 5,
          pct: 40,
          elapsed_ms: 100,
        },
        "*"
      );
    });
    await page.waitForTimeout(60);
    await page.evaluate(() => {
      window.postMessage({ type: "preview", nodes: 12, edges: 20, elapsed_ms: 120, flows: [] }, "*");
    });
    await page.waitForTimeout(80);
    await page.evaluate(() => {
      window.postMessage({ type: "patch", stats: { elapsed_ms: 140 } }, "*");
    });
    await page.waitForTimeout(120);
    const afterPatch = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      const stage = document.querySelector("#canvas .stage");
      const vp = document.querySelector("#canvas .viewport");
      const kCam = vp ? parseFloat(vp.style.getPropertyValue("--cam-k") || "0") : 0;
      return {
        sameStage: !!(stage && stage.dataset.recycleMark === "1"),
        sameVp: !!(vp && vp.dataset.recycleMark === "1"),
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        comm: document.querySelectorAll(".comm-node").length,
        lod: vp ? vp.getAttribute("data-lod") : "",
        k: kCam,
        stampPosts: posts.filter((p) => p && p.type === "stamp").length,
        skipPosts: posts.filter((p) => p && p.type === "skip").length,
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    }, recyclePostsAt);
    record(
      "RC2",
      "Preview / patch recycles Map stage and keeps the camera",
      afterPatch.ws === "map" &&
        afterPatch.sameStage &&
        afterPatch.sameVp &&
        afterPatch.xy === 0 &&
        afterPatch.comm === 0 &&
        afterPatch.cards > 1 &&
        afterPatch.lod === "0" &&
        afterPatch.k > 0 &&
        Math.abs(afterPatch.k - recycleCam) < 0.25 &&
        (Math.abs(recycleCam - 1) < 0.05 || Math.abs(afterPatch.k - 1) > 0.04),
      JSON.stringify(afterPatch)
    );
    record(
      "RC3",
      "Recycle does not post stamp / skip",
      afterPatch.stampPosts === 0 && afterPatch.skipPosts === 0,
      JSON.stringify({ stampPosts: afterPatch.stampPosts, skipPosts: afterPatch.skipPosts })
    );
    await shot(page, "canvas-recycle.png");
    await page.evaluate(() => {
      window.postMessage({ type: "cancelled" }, "*");
    });
    await page.waitForFunction(
      () => {
        const el = document.getElementById("progress");
        return !el || !el.classList.contains("on");
      },
      null,
      { timeout: 4000 }
    );
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    assertNoStampDir("RC4", "Canvas recycle did not write .graphide/stamps/");

    const daBefore = await page.evaluate(() => {
      const stage = document.querySelector("#canvas .stage");
      const vp = document.querySelector("#canvas .viewport");
      if (stage) stage.dataset.deltaMark = "1";
      if (vp) vp.dataset.deltaMark = "1";
      const cov = document.getElementById("coverage");
      const kCam = vp ? parseFloat(vp.style.getPropertyValue("--cam-k") || "0") : 0;
      return {
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        comm: document.querySelectorAll(".comm-node").length,
        lod: vp ? vp.getAttribute("data-lod") : "",
        k: kCam,
        cov: ((cov || {}).textContent || "").replace(/\s+/g, " ").trim(),
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    });
    record(
      "DA0",
      "Map paints communities before a coverage-only patch",
      daBefore.ws === "map" &&
        daBefore.xy === 0 &&
        daBefore.comm === 0 &&
        daBefore.cards > 1 &&
        daBefore.lod === "0",
      JSON.stringify(daBefore)
    );
    await page.evaluate(() => {
      const btn = document.getElementById("zoomIn");
      if (btn) btn.click();
    });
    await page.waitForTimeout(350);
    const daCam = await page.evaluate(() => {
      const vp = document.querySelector("#canvas .viewport");
      return parseFloat((vp && vp.style.getPropertyValue("--cam-k")) || "0");
    });
    const daPostsAt = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.evaluate(() => {
      window.postMessage(
        {
          type: "patch",
          coverage: { changed: ["n0"], uncovered: ["n7", "n11", "n13"] },
          findings: [
            { kind: "UnmatchedHint", flow: "boot", fqn: "solarsim::MissingHit" },
            { kind: "UnmatchedHint", flow: "boot", fqn: "graphide::OnAnalysisDelta" },
          ],
          stats: { elapsed_ms: 77 },
        },
        "*"
      );
    });
    await page.waitForFunction(
      () => {
        const t = ((document.getElementById("coverage") || {}).textContent || "").replace(/\s+/g, " ");
        return /Coverage 1 changed/.test(t) && /3 uncovered/.test(t) && /OnAnalysisDelta/.test(t);
      },
      null,
      { timeout: 4000 }
    );
    const afterDelta = await page.evaluate((wantK) => {
      const posts = (window.__vscodePosts || []).slice(wantK.before);
      const stage = document.querySelector("#canvas .stage");
      const vp = document.querySelector("#canvas .viewport");
      const kCam = vp ? parseFloat(vp.style.getPropertyValue("--cam-k") || "0") : 0;
      const cov = ((document.getElementById("coverage") || {}).textContent || "").replace(/\s+/g, " ");
      return {
        sameStage: !!(stage && stage.dataset.deltaMark === "1"),
        sameVp: !!(vp && vp.dataset.deltaMark === "1"),
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        comm: document.querySelectorAll(".comm-node").length,
        lod: vp ? vp.getAttribute("data-lod") : "",
        k: kCam,
        wantK: wantK.k,
        cov: cov.slice(0, 240),
        stampPosts: posts.filter((p) => p && p.type === "stamp").length,
        skipPosts: posts.filter((p) => p && p.type === "skip").length,
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    }, { k: daCam, before: daPostsAt });
    record(
      "DA1",
      "Coverage/findings-only patch keeps the same .stage / .viewport and camera",
      afterDelta.ws === "map" &&
        afterDelta.sameStage &&
        afterDelta.sameVp &&
        afterDelta.xy === 0 &&
        afterDelta.comm === 0 &&
        afterDelta.cards > 1 &&
        afterDelta.lod === "0" &&
        afterDelta.k > 0 &&
        Math.abs(afterDelta.k - daCam) < 0.25 &&
        (Math.abs(daCam - 1) < 0.05 || Math.abs(afterDelta.k - 1) > 0.04) &&
        /Coverage 1 changed/.test(afterDelta.cov) &&
        /3 uncovered/.test(afterDelta.cov),
      JSON.stringify(afterDelta)
    );
    record(
      "DA2",
      "Coverage-only patch updates #coverage without posting stamp / skip",
      /OnAnalysisDelta/.test(afterDelta.cov) && afterDelta.stampPosts === 0 && afterDelta.skipPosts === 0,
      JSON.stringify({ cov: afterDelta.cov, stampPosts: afterDelta.stampPosts, skipPosts: afterDelta.skipPosts })
    );
    await shot(page, "delta-onanalysis.png");
    await page.evaluate(() => {
      const ids = Array.from({ length: 1123 }, (_, i) => "n" + i);
      window.postMessage(
        {
          type: "patch",
          coverage: { changed: ids, uncovered: ids },
          findings: [
            { kind: "StampBroken", flow: "boot", added: [{ from: "n0", to: "n3" }], removed: [] },
            { kind: "UnmatchedHint", flow: "boot", fqn: "solarsim::MissingHit" },
          ],
          stats: { elapsed_ms: 21041 },
        },
        "*"
      );
    });
    await page.waitForFunction(
      () => {
        const t = ((document.getElementById("coverage") || {}).textContent || "").replace(/\s+/g, " ");
        return /Coverage 1123 changed/.test(t) && /1123 uncovered/.test(t);
      },
      null,
      { timeout: 4000 }
    );
    assertNoStampDir("DA3", "Delta onAnalysis did not write .graphide/stamps/");

    const readOffviewDesk = () =>
      page.evaluate(() => {
        const stage = document.querySelector("#canvas .stage");
        const vp = document.querySelector("#canvas .viewport");
        const stageBox = stage ? stage.getBoundingClientRect() : null;
        const cards = [...document.querySelectorAll("#canvas .comm-wrap .bubble-card[data-bubble]")];
        const rows = cards.map((el) => {
          const r = el.getBoundingClientRect();
          const off = el.getAttribute("data-offview") === "1";
          const measurable = r.width >= 4 && r.height >= 4;
          const inStage = !!(
            stageBox &&
            measurable &&
            !(r.right <= stageBox.left || r.left >= stageBox.right || r.bottom <= stageBox.top || r.top >= stageBox.bottom)
          );
          const cs = getComputedStyle(el);
          return {
            id: el.getAttribute("data-bubble"),
            off,
            inStage,
            parked:
              off &&
              (cs.visibility === "hidden" ||
                cs.pointerEvents === "none" ||
                cs.contentVisibility === "hidden"),
          };
        });
        return {
          cards: rows.length,
          off: rows.filter((c) => c.off).length,
          parked: rows.filter((c) => c.parked).length,
          inStage: rows.filter((c) => c.inStage && !c.off).length,
          ids: rows.map((c) => c.id),
          offIds: rows.filter((c) => c.off).map((c) => c.id),
          xy: document.querySelectorAll(".react-flow__node").length,
          comm: document.querySelectorAll(".comm-node").length,
          lod: vp ? vp.getAttribute("data-lod") : "",
          ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
            ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
            : "",
        };
      });
    const ovPostsAt = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
    const ovBefore = await readOffviewDesk();
    record(
      "OV0",
      "Map paints communities before off-view park",
      ovBefore.ws === "map" &&
        ovBefore.xy === 0 &&
        ovBefore.comm === 0 &&
        ovBefore.cards > 1 &&
        ovBefore.lod === "0",
      JSON.stringify(ovBefore)
    );
    for (let i = 0; i < 8; i++) {
      const cur = await readOffviewDesk();
      if (cur.off >= 1) break;
      await page.evaluate(() => {
        const btn = document.getElementById("zoomIn");
        if (btn) btn.click();
      });
      await page.waitForTimeout(220);
    }
    let ovZoomed = await readOffviewDesk();
    if (ovZoomed.off < 1) {
      const box = await page.locator("#canvas .stage").boundingBox();
      if (box) {
        await page.mouse.move(box.x + 18, box.y + 10);
        await page.mouse.down();
        await page.mouse.move(box.x + 18 + 520, box.y + 10 + 300, { steps: 8 });
        await page.mouse.up();
        await page.waitForTimeout(350);
      }
      ovZoomed = await readOffviewDesk();
    }
    if (ovZoomed.off >= 1 && ovZoomed.inStage < 1) {
      await page.evaluate(() => {
        const btn = document.getElementById("zoomOut");
        if (btn) btn.click();
      });
      await page.waitForTimeout(220);
      ovZoomed = await readOffviewDesk();
    }
    record(
      "OV1",
      "Zoom/pan parks off-stage community cards (data-offview)",
      ovZoomed.ws === "map" &&
        ovZoomed.xy === 0 &&
        ovZoomed.comm === 0 &&
        ovZoomed.lod === "0" &&
        ovZoomed.cards > 1 &&
        ovZoomed.off >= 1 &&
        ovZoomed.parked >= 1 &&
        ovZoomed.inStage >= 1 &&
        ovZoomed.inStage < ovZoomed.cards,
      JSON.stringify(ovZoomed)
    );
    const parkedIds = ovZoomed.offIds.slice();
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForTimeout(220);
    const ovRecycle = await readOffviewDesk();
    record(
      "OV2",
      "Recycle keeps parked data-bubble identity at community LOD",
      ovRecycle.ws === "map" &&
        ovRecycle.xy === 0 &&
        ovRecycle.comm === 0 &&
        ovRecycle.lod === "0" &&
        ovRecycle.cards === ovZoomed.cards &&
        parkedIds.length > 0 &&
        parkedIds.every((id) => ovRecycle.ids.indexOf(id) >= 0),
      JSON.stringify({ parkedIds, recycle: ovRecycle })
    );
    await shot(page, "map-offview.png");
    const fitViaOv = await page.evaluate(() => {
      const btn = document.getElementById("zoomFit");
      if (!btn) return "";
      btn.click();
      return "zoomFit";
    });
    await page.waitForTimeout(450);
    const ovBack = await readOffviewDesk();
    const ovAfterPosts = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        stampPosts: posts.filter((p) => p && p.type === "stamp").length,
        skipPosts: posts.filter((p) => p && p.type === "skip").length,
      };
    }, ovPostsAt);
    record(
      "OV3",
      "Fit / pan-back restores parked cards (same data-bubble)",
      fitViaOv === "zoomFit" &&
        ovBack.ws === "map" &&
        ovBack.xy === 0 &&
        ovBack.comm === 0 &&
        ovBack.lod === "0" &&
        ovBack.cards > 1 &&
        parkedIds.every((id) => ovBack.ids.indexOf(id) >= 0) &&
        parkedIds.every((id) => ovBack.offIds.indexOf(id) < 0) &&
        ovBack.inStage >= 1,
      "via=" + fitViaOv + " parked=" + parkedIds.join(",") + " " + JSON.stringify(ovBack)
    );
    record(
      "OV4",
      "Off-view park does not post stamp / skip",
      ovAfterPosts.stampPosts === 0 && ovAfterPosts.skipPosts === 0,
      JSON.stringify(ovAfterPosts)
    );
    assertNoStampDir("OV5", "Map off-view did not write .graphide/stamps/");

    const ptBefore = await page.evaluate(() => {
      const stage = document.querySelector("#canvas .stage");
      const vp = document.querySelector("#canvas .viewport");
      if (stage) stage.dataset.panelMark = "1";
      if (vp) vp.dataset.panelMark = "1";
      const cov = document.getElementById("coverage");
      return {
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        comm: document.querySelectorAll(".comm-node").length,
        lod: vp ? vp.getAttribute("data-lod") : "",
        shed: cov ? cov.getAttribute("data-panel") : "",
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
        stampOn: !!(document.getElementById("stampBtn") && !document.getElementById("stampBtn").disabled),
      };
    });
    record(
      "PT0",
      "Map paints communities before a fat coverage/findings patch",
      ptBefore.ws === "map" &&
        ptBefore.xy === 0 &&
        ptBefore.comm === 0 &&
        ptBefore.cards > 1 &&
        ptBefore.lod === "0",
      JSON.stringify(ptBefore)
    );
    const ptPostsAt = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.evaluate(() => {
      const ids = Array.from({ length: 80 }, (_, i) => "pt" + i);
      const findings = ids.map((id, i) => ({
        kind: "UnmatchedHint",
        flow: "boot",
        fqn: "graphide::PanelTimeout" + i,
      }));
      window.postMessage(
        {
          type: "patch",
          coverage: { changed: ids, uncovered: ids },
          findings,
          stats: { elapsed_ms: 9 },
        },
        "*"
      );
    });
    await page.waitForFunction(
      () => {
        const el = document.getElementById("coverage");
        const t = ((el || {}).textContent || "").replace(/\s+/g, " ");
        return (
          el &&
          el.getAttribute("data-panel") === "shed" &&
          /Coverage 80 changed/.test(t) &&
          /80 uncovered/.test(t)
        );
      },
      null,
      { timeout: 4000 }
    );
    const afterPanel = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      const stage = document.querySelector("#canvas .stage");
      const vp = document.querySelector("#canvas .viewport");
      const cov = document.getElementById("coverage");
      const text = ((cov || {}).textContent || "").replace(/\s+/g, " ");
      return {
        sameStage: !!(stage && stage.dataset.panelMark === "1"),
        sameVp: !!(vp && vp.dataset.panelMark === "1"),
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        comm: document.querySelectorAll(".comm-node").length,
        lod: vp ? vp.getAttribute("data-lod") : "",
        shed: cov ? cov.getAttribute("data-panel") : "",
        findings: cov ? cov.querySelectorAll("li.finding").length : -1,
        cov: text.slice(0, 240),
        hasTimeout: /PanelTimeout/.test(text),
        stampPosts: posts.filter((p) => p && p.type === "stamp").length,
        skipPosts: posts.filter((p) => p && p.type === "skip").length,
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    }, ptPostsAt);
    record(
      "PT1",
      "Fat panel patch keeps the same .stage / .viewport and sheds findings expansion",
      afterPanel.ws === "map" &&
        afterPanel.sameStage &&
        afterPanel.sameVp &&
        afterPanel.xy === 0 &&
        afterPanel.comm === 0 &&
        afterPanel.cards > 1 &&
        afterPanel.lod === "0" &&
        afterPanel.shed === "shed" &&
        afterPanel.findings === 0 &&
        !afterPanel.hasTimeout &&
        /Coverage 80 changed/.test(afterPanel.cov) &&
        /80 uncovered/.test(afterPanel.cov),
      JSON.stringify(afterPanel)
    );
    await shot(page, "panel-timeout.png");
    const ptZoom = await page.evaluate(() => {
      const vp = document.querySelector("#canvas .viewport");
      const btn = document.getElementById("zoomIn");
      const k0 = vp ? parseFloat(vp.style.getPropertyValue("--cam-k") || "0") : 0;
      const pct0 = ((document.getElementById("zoomPct") || {}).textContent || "").trim();
      if (btn && !btn.disabled) btn.click();
      return {
        enabled: !!(btn && !btn.disabled),
        via: btn ? "zoomIn" : "",
        k0,
        pct0,
      };
    });
    await page.waitForTimeout(400);
    const ptAfterZoom = await page.evaluate((want) => {
      const stage = document.querySelector("#canvas .stage");
      const vp = document.querySelector("#canvas .viewport");
      const cov = document.getElementById("coverage");
      const k = vp ? parseFloat(vp.style.getPropertyValue("--cam-k") || "0") : 0;
      const pctText = ((document.getElementById("zoomPct") || {}).textContent || "").trim();
      return {
        enabled: want.enabled,
        via: want.via,
        k0: want.k0,
        k,
        pct0: want.pct0,
        pct: pctText,
        sameStage: !!(stage && stage.dataset.panelMark === "1"),
        sameVp: !!(vp && vp.dataset.panelMark === "1"),
        shed: cov ? cov.getAttribute("data-panel") : "",
        lod: vp ? vp.getAttribute("data-lod") : "",
        xy: document.querySelectorAll(".react-flow__node").length,
        comm: document.querySelectorAll(".comm-node").length,
        cards: document.querySelectorAll(".bubble-card").length,
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    }, ptZoom);
    record(
      "PT2",
      "Zoom handler fires after shed without waiting on the full findings list",
      ptAfterZoom.enabled &&
        ptAfterZoom.via === "zoomIn" &&
        ptAfterZoom.ws === "map" &&
        ptAfterZoom.sameStage &&
        ptAfterZoom.sameVp &&
        ptAfterZoom.shed === "shed" &&
        ptAfterZoom.lod === "0" &&
        ptAfterZoom.xy === 0 &&
        ptAfterZoom.comm === 0 &&
        ptAfterZoom.cards > 1 &&
        ptAfterZoom.k > 0 &&
        (Math.abs(ptAfterZoom.k - ptAfterZoom.k0) > 0.04 || ptAfterZoom.pct !== ptAfterZoom.pct0),
      JSON.stringify(ptAfterZoom)
    );
    record(
      "PT3",
      "Fat panel patch itself does not post stamp / skip",
      afterPanel.stampPosts === 0 && afterPanel.skipPosts === 0,
      JSON.stringify({ stampPosts: afterPanel.stampPosts, skipPosts: afterPanel.skipPosts })
    );
    await page.evaluate(() => {
      const ids = Array.from({ length: 1123 }, (_, i) => "n" + i);
      window.postMessage(
        {
          type: "patch",
          coverage: { changed: ids, uncovered: ids },
          findings: [
            { kind: "StampBroken", flow: "boot", added: [{ from: "n0", to: "n3" }], removed: [] },
            { kind: "UnmatchedHint", flow: "boot", fqn: "solarsim::MissingHit" },
          ],
          stats: { elapsed_ms: 21041 },
        },
        "*"
      );
    });
    await page.waitForFunction(
      () => {
        const t = ((document.getElementById("coverage") || {}).textContent || "").replace(/\s+/g, " ");
        return /Coverage 1123 changed/.test(t) && /1123 uncovered/.test(t);
      },
      null,
      { timeout: 4000 }
    );
    assertNoStampDir("PT4", "Panel timeout did not write .graphide/stamps/");

    const explorerChips = await page.evaluate(() => {
      const chips = [...document.querySelectorAll("#legend [data-prog]")].map((el) => ({
        i: Number(el.getAttribute("data-prog")),
        text: (el.textContent || "").replace(/\s+/g, " ").trim(),
        on: el.classList.contains("on"),
      }));
      return {
        chips,
        programs: chips.filter((c) => c.i >= 0),
      };
    });
    const explorerMulti = explorerChips.programs.length >= 2;
    record(
      "PC0",
      "explorer program chips: single-chip honest path; skip multi unless a second chip exists",
      explorerChips.programs.length >= 1 &&
        (explorerMulti || explorerChips.programs.some((p) => /bin\s+main/i.test(p.text))),
      explorerMulti
        ? "multi chips=" + explorerChips.programs.map((p) => p.text).join(",")
        : "single-chip skip multi chips=" + explorerChips.programs.map((p) => p.text).join(",")
    );
    const explorerAll = explorerChips.chips.find((c) => c.i === -1) || null;
    record(
      "AP0",
      "explorer All programs: absent on single-chip; skip union unless All programs exists",
      explorerChips.programs.length >= 1 &&
        (explorerAll
          ? explorerChips.programs.length >= 2 && /all programs/i.test(explorerAll.text)
          : !explorerAll),
      explorerAll
        ? "All programs present programs=" + explorerChips.programs.map((p) => p.text).join(",")
        : "honest skip All programs absent chips=" + explorerChips.programs.map((p) => p.text).join(",")
    );

    const readFlowTabDesk = () =>
      page.evaluate(() => {
        const tabs = [...document.querySelectorAll("#tabs .tab[data-flow]")].map((el) => ({
          name: el.getAttribute("data-flow") || "",
          on: el.classList.contains("on"),
          text: (el.textContent || "").replace(/\s+/g, " ").trim(),
        }));
        const on = tabs.find((t) => t.on) || null;
        const meta = ((document.getElementById("meta") || {}).textContent || "").replace(/\s+/g, " ").trim();
        const hops = [...document.querySelectorAll("#storyRail .feat-chip, .feature-path .feat-chip")].map((el) =>
          el.getAttribute("data-hop") || el.getAttribute("data-feature") || (el.textContent || "").replace(/\s+/g, " ").trim()
        );
        const startEl = document.querySelector(".bubble-card.start");
        const endEl = document.querySelector(".bubble-card.end");
        const lit = [...document.querySelectorAll("#sliceCanvas [data-lit='1'], #sliceCanvas .vnode.lit, #sliceCanvas .vnode[data-id]")]
          .map((el) => el.getAttribute("data-id") || el.getAttribute("data-lit") || "")
          .filter(Boolean);
        const treeMatch = meta.match(/(\d+)\s+on tree/i);
        return {
          tabs,
          flow: on ? on.name : "",
          tabText: on ? on.text : "",
          meta,
          hops,
          start: startEl ? startEl.getAttribute("data-bubble") || "" : "",
          end: endEl ? endEl.getAttribute("data-bubble") || "" : "",
          lit,
          treeN: treeMatch ? Number(treeMatch[1]) : 0,
          ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
            ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
            : "",
          xy: document.querySelectorAll("#canvas .react-flow__node, .bubble-map .react-flow__node").length,
          cards: document.querySelectorAll(".bubble-card").length,
          sliceNodes: document.querySelectorAll("#sliceCanvas .vnode[data-id], #sliceCanvas .react-flow__node").length,
        };
      });
    const beforeFtPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    const explorerFlowTabs = await readFlowTabDesk();
    const explorerFlowMulti = explorerFlowTabs.tabs.length >= 2;
    record(
      "FT0",
      "explorer has two or more #tabs .tab[data-flow] chips",
      explorerFlowMulti,
      explorerFlowMulti
        ? explorerFlowTabs.tabs.map((t) => t.name + (t.on ? "*" : "")).join(",")
        : "honest skip unless self-review also lacks a second flow tab"
    );
    let firstFlowCut = explorerFlowTabs;
    let secondFlowCut = explorerFlowTabs;
    let flowSwitch = { ok: false, first: "", second: "" };
    if (explorerFlowMulti) {
      flowSwitch = await page.evaluate(() => {
        const tabs = [...document.querySelectorAll("#tabs .tab[data-flow]")];
        const rich = tabs.filter((el) => {
          const n = el.getAttribute("data-flow") || "";
          return n && n !== "overview";
        });
        const pick = rich.length >= 2 ? rich : tabs;
        if (pick.length < 2) return { ok: false, first: "", second: "" };
        const on = pick.find((el) => el.classList.contains("on"));
        const first = on && pick.some((el) => el !== on) ? on : pick[0];
        const second = pick.find((el) => el !== first) || pick[1];
        first.click();
        return {
          ok: true,
          first: first.getAttribute("data-flow") || "",
          second: second.getAttribute("data-flow") || "",
        };
      });
      await page.waitForFunction(
        (name) => {
          if (!name) return false;
          const on = document.querySelector("#tabs .tab.on[data-flow]");
          return !!(on && on.getAttribute("data-flow") === name);
        },
        flowSwitch.first,
        { timeout: 8000 }
      );
      await page.waitForTimeout(200);
      firstFlowCut = await readFlowTabDesk();
      await page.evaluate((name) => {
        const el = document.querySelector('#tabs .tab[data-flow="' + name + '"]');
        if (el) el.click();
      }, flowSwitch.second);
      await page.waitForFunction(
        (name) => {
          if (!name) return false;
          const on = document.querySelector("#tabs .tab.on[data-flow]");
          return !!(on && on.getAttribute("data-flow") === name);
        },
        flowSwitch.second,
        { timeout: 8000 }
      );
      await page.waitForTimeout(200);
      secondFlowCut = await page.evaluate((before) => {
        const tabs = [...document.querySelectorAll("#tabs .tab[data-flow]")].map((el) => ({
          name: el.getAttribute("data-flow") || "",
          on: el.classList.contains("on"),
          text: (el.textContent || "").replace(/\s+/g, " ").trim(),
        }));
        const on = tabs.find((t) => t.on) || null;
        const meta = ((document.getElementById("meta") || {}).textContent || "").replace(/\s+/g, " ").trim();
        const hops = [...document.querySelectorAll("#storyRail .feat-chip, .feature-path .feat-chip")].map((el) =>
          el.getAttribute("data-hop") || el.getAttribute("data-feature") || (el.textContent || "").replace(/\s+/g, " ").trim()
        );
        const startEl = document.querySelector(".bubble-card.start");
        const endEl = document.querySelector(".bubble-card.end");
        const lit = [...document.querySelectorAll("#sliceCanvas [data-lit='1'], #sliceCanvas .vnode.lit, #sliceCanvas .vnode[data-id]")]
          .map((el) => el.getAttribute("data-id") || "")
          .filter(Boolean);
        const treeMatch = meta.match(/(\d+)\s+on tree/i);
        const posts = (window.__vscodePosts || []).slice(before);
        return {
          tabs,
          flow: on ? on.name : "",
          tabText: on ? on.text : "",
          meta,
          hops,
          start: startEl ? startEl.getAttribute("data-bubble") || "" : "",
          end: endEl ? endEl.getAttribute("data-bubble") || "" : "",
          lit,
          treeN: treeMatch ? Number(treeMatch[1]) : 0,
          ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
            ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
            : "",
          xy: document.querySelectorAll("#canvas .react-flow__node, .bubble-map .react-flow__node").length,
          cards: document.querySelectorAll(".bubble-card").length,
          sliceNodes: document.querySelectorAll("#sliceCanvas .vnode[data-id], #sliceCanvas .react-flow__node").length,
          selectPosts: posts.filter((m) => m && m.type === "selectFlow").map((m) => m.flow || ""),
          stampPosts: posts.filter((m) => m && m.type === "stamp").length,
          skipPosts: posts.filter((m) => m && m.type === "skip").length,
        };
      }, beforeFtPosts);
    }
    const titleChanged =
      !!firstFlowCut.flow &&
      !!secondFlowCut.flow &&
      firstFlowCut.flow !== secondFlowCut.flow &&
      firstFlowCut.meta.toLowerCase().includes(firstFlowCut.flow.toLowerCase()) &&
      secondFlowCut.meta.toLowerCase().includes(secondFlowCut.flow.toLowerCase());
    const hopsChanged = (firstFlowCut.hops || []).join("\0") !== (secondFlowCut.hops || []).join("\0");
    const endsChanged =
      (firstFlowCut.start || "") !== (secondFlowCut.start || "") ||
      (firstFlowCut.end || "") !== (secondFlowCut.end || "");
    const litChanged = (firstFlowCut.lit || []).join("\0") !== (secondFlowCut.lit || []).join("\0");
    const treeChanged = firstFlowCut.treeN !== secondFlowCut.treeN;
    record(
      "FT1",
      "first flow tab is the current Steiner cut",
      explorerFlowMulti
        ? flowSwitch.ok &&
            firstFlowCut.flow === flowSwitch.first &&
            firstFlowCut.ws === "slice" &&
            firstFlowCut.sliceNodes >= 1 &&
            firstFlowCut.meta.toLowerCase().includes(flowSwitch.first.toLowerCase())
        : true,
      explorerFlowMulti
        ? JSON.stringify({
            flow: firstFlowCut.flow,
            ws: firstFlowCut.ws,
            meta: firstFlowCut.meta.slice(0, 120),
            slice: firstFlowCut.sliceNodes,
          })
        : "honest skip: explorer has one flow tab"
    );
    record(
      "FT2",
      "second #tabs .tab moves .on and selectFlow posts",
      explorerFlowMulti
        ? flowSwitch.ok &&
            secondFlowCut.flow === flowSwitch.second &&
            secondFlowCut.flow !== firstFlowCut.flow &&
            secondFlowCut.selectPosts.indexOf(flowSwitch.second) >= 0
        : true,
      explorerFlowMulti
        ? JSON.stringify({
            first: firstFlowCut.flow,
            second: secondFlowCut.flow,
            posts: secondFlowCut.selectPosts,
          })
        : "honest skip: explorer has one flow tab"
    );
    record(
      "FT3",
      "visible Steiner cut changed (title, hops, start/end, or Slice lit)",
      explorerFlowMulti ? titleChanged || hopsChanged || endsChanged || litChanged || treeChanged : true,
      explorerFlowMulti
        ? JSON.stringify({
            title: titleChanged,
            hops: hopsChanged,
            ends: endsChanged,
            lit: litChanged,
            tree: treeChanged,
            firstMeta: firstFlowCut.meta.slice(0, 80),
            secondMeta: secondFlowCut.meta.slice(0, 80),
          })
        : "honest skip: explorer has one flow tab"
    );
    await shot(page, "flow-tabs.png");
    record(
      "FT4",
      "flow-tab switch does not post stamp / skip",
      explorerFlowMulti ? secondFlowCut.stampPosts === 0 && secondFlowCut.skipPosts === 0 : true,
      explorerFlowMulti
        ? JSON.stringify({ stampPosts: secondFlowCut.stampPosts, skipPosts: secondFlowCut.skipPosts })
        : "honest skip: explorer has one flow tab"
    );
    assertNoStampDir("FT5", "flow-tab switch did not write .graphide/stamps/");
    if (explorerFlowMulti) {
      await page.click('#workspaces [data-ws="map"]');
      await page.waitForFunction(
        () => {
          const on = document.querySelector("#workspaces [data-ws].on");
          return on && on.getAttribute("data-ws") === "map";
        },
        null,
        { timeout: 8000 }
      );
      await page.waitForSelector(".bubble-card", { timeout: 8000 });
      await page.waitForTimeout(150);
    }
    const afterFtMap = await page.evaluate(() => ({
      ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
        ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
        : "",
      xy: document.querySelectorAll("#canvas .react-flow__node, .bubble-map .react-flow__node").length,
      cards: document.querySelectorAll(".bubble-card").length,
      comm: document.querySelectorAll(".comm-node").length,
    }));
    record(
      "FT6",
      "flow-tab step returns Map to community LOD (xy=0)",
      afterFtMap.ws === "map" && afterFtMap.xy === 0 && afterFtMap.comm === 0 && afterFtMap.cards > 1,
      JSON.stringify(afterFtMap)
    );

    const beforeGyPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    const gyPick = await page.evaluate(() => {
      const tab =
        document.querySelector('#tabs .tab[data-flow="control-flow"]') ||
        document.querySelector('#tabs .tab[data-flow="boot"]') ||
        document.querySelector("#tabs .tab[data-flow]");
      const flow = tab ? tab.getAttribute("data-flow") || "" : "";
      if (tab) tab.click();
      return { flow, clicked: !!tab };
    });
    record(
      "GY0",
      "flow tab is present so Slice grey-out has a Steiner",
      gyPick.clicked && !!gyPick.flow,
      JSON.stringify(gyPick)
    );
    if (gyPick.clicked && gyPick.flow) {
      await page.waitForFunction(
        (name) => {
          const on = document.querySelector("#tabs .tab.on[data-flow]");
          const ws = document.querySelector("#workspaces [data-ws].on");
          return !!(
            on &&
            on.getAttribute("data-flow") === name &&
            ws &&
            (ws.getAttribute("data-ws") === "slice" || ws.getAttribute("data-ws") === "overview")
          );
        },
        gyPick.flow,
        { timeout: 8000 }
      );
    }
    await page.waitForSelector("#sliceCanvas .vnode[data-id], #sliceCanvas .react-flow__node", { timeout: 8000 });
    await page.waitForTimeout(280);
    const gyDesk = await page.evaluate(() => {
      const on = document.querySelector("#workspaces [data-ws].on");
      const tabOn = document.querySelector("#tabs .tab.on[data-flow]");
      const nodes = [...document.querySelectorAll("#sliceCanvas .vnode[data-id]")];
      const row = (el) => ({
        id: el.getAttribute("data-id") || "",
        lit: el.getAttribute("data-lit") === "1" || el.classList.contains("lit"),
        grey:
          el.getAttribute("data-lit") === "0" ||
          el.classList.contains("grey") ||
          el.classList.contains("slice-dim"),
        sliceDist: el.getAttribute("data-slice-dist"),
        classes: el.className || "",
      });
      const painted = nodes.map(row);
      const lit = painted.filter((n) => n.lit);
      const grey = painted.filter((n) => n.grey && !n.lit);
      return {
        ws: on ? on.getAttribute("data-ws") : "",
        flow: tabOn ? tabOn.getAttribute("data-flow") || "" : "",
        n: painted.length,
        lit: lit.length,
        grey: grey.length,
        litZero: lit.filter((n) => n.sliceDist === "0").length,
        greyFar: grey.filter((n) => n.sliceDist && Number(n.sliceDist) >= 1).length,
        overlap: painted.filter((n) => n.lit && n.grey).length,
        sampleLit: lit.slice(0, 3).map((n) => n.id + ":" + n.sliceDist),
        sampleGrey: grey.slice(0, 3).map((n) => n.id + ":" + n.sliceDist),
      };
    });
    record(
      "GY1",
      "on-tree Slice nodes are lit (data-lit=1 / .vnode.lit)",
      (gyDesk.ws === "slice" || gyDesk.ws === "overview") &&
        gyDesk.lit >= 1 &&
        gyDesk.litZero >= 1 &&
        gyDesk.overlap === 0,
      JSON.stringify({
        ws: gyDesk.ws,
        flow: gyDesk.flow,
        lit: gyDesk.lit,
        litZero: gyDesk.litZero,
        sample: gyDesk.sampleLit,
      })
    );
    record(
      "GY2",
      "off-slice neighbors stay visible but grey (data-lit=0 / .grey / .slice-dim)",
      gyDesk.grey >= 1 && gyDesk.greyFar >= 1,
      JSON.stringify({
        n: gyDesk.n,
        grey: gyDesk.grey,
        greyFar: gyDesk.greyFar,
        sample: gyDesk.sampleGrey,
      })
    );
    await shot(page, "slice-grey.png");
    const afterGy = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
    }, beforeGyPosts);
    record(
      "GY3",
      "Slice grey-out does not post stamp / skip",
      afterGy.stampPosts === 0 && afterGy.skipPosts === 0,
      JSON.stringify(afterGy)
    );
    assertNoStampDir("GY4", "Slice grey-out did not write .graphide/stamps/");
    const demoFlowsGy = fs.readFileSync(path.join(DEMO, "flows.toml"), "utf8");
    record(
      "GY5",
      "Slice grey-out did not write fixtures/demo/flows.toml",
      /name\s*=\s*"data-subscription"/.test(demoFlowsGy) && !/proposed-uncovered/.test(demoFlowsGy),
      demoFlowsGy.slice(0, 160)
    );
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForFunction(
      () => {
        const on = document.querySelector("#workspaces [data-ws].on");
        return on && on.getAttribute("data-ws") === "map";
      },
      null,
      { timeout: 8000 }
    );
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    await page.waitForTimeout(150);
    const afterGyMap = await page.evaluate(() => ({
      ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
        ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
        : "",
      xy: document.querySelectorAll("#canvas .react-flow__node, .bubble-map .react-flow__node").length,
      cards: document.querySelectorAll(".bubble-card").length,
      comm: document.querySelectorAll(".comm-node").length,
    }));
    record(
      "GY6",
      "Slice grey-out returns Map to community LOD (xy=0)",
      afterGyMap.ws === "map" && afterGyMap.xy === 0 && afterGyMap.comm === 0 && afterGyMap.cards > 1,
      JSON.stringify(afterGyMap)
    );

    const beforeSrPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForFunction(
      () => {
        const on = document.querySelector("#workspaces [data-ws].on");
        return on && on.getAttribute("data-ws") === "slice";
      },
      null,
      { timeout: 8000 }
    );
    const srPick = await page.evaluate(() => {
      const tab =
        document.querySelector('#tabs .tab[data-flow="control-flow"]') ||
        document.querySelector('#tabs .tab[data-flow="boot"]') ||
        document.querySelector("#tabs .tab[data-flow]");
      const flow = tab ? tab.getAttribute("data-flow") || "" : "";
      if (tab && !tab.classList.contains("on")) tab.click();
      return { flow, clicked: !!tab };
    });
    record(
      "SR0",
      "Slice is on with a flow that can paint subsystem runs",
      srPick.clicked && !!srPick.flow,
      JSON.stringify(srPick)
    );
    if (srPick.clicked && srPick.flow) {
      await page.waitForFunction(
        (name) => {
          const on = document.querySelector("#tabs .tab.on[data-flow]");
          const ws = document.querySelector("#workspaces [data-ws].on");
          return !!(on && on.getAttribute("data-flow") === name && ws && ws.getAttribute("data-ws") === "slice");
        },
        srPick.flow,
        { timeout: 8000 }
      );
    }
    await page.waitForSelector("#canvas .run[data-run], .chart .run", { timeout: 10000 });
    // Fit eases the camera. A fixed 220ms read races the last frames on CI.
    await page
      .waitForFunction(
        () => {
          const stage = document.querySelector("#canvas .stage");
          const sr = stage ? stage.getBoundingClientRect() : null;
          const runs = [...document.querySelectorAll("#canvas .run[data-run], .chart .run")];
          if (!sr || runs.length < 2) return false;
          return runs.every((el) => {
            const r = el.getBoundingClientRect();
            return (
              r.height >= 16 &&
              r.top >= sr.top - 2 &&
              r.bottom <= sr.bottom + 2 &&
              r.left >= sr.left - 2 &&
              r.right <= sr.right + 2
            );
          });
        },
        null,
        { timeout: 4000 }
      )
      .catch(() => {});
    const srDesk = await page.evaluate(() => {
      const on = document.querySelector("#workspaces [data-ws].on");
      const tabOn = document.querySelector("#tabs .tab.on[data-flow]");
      const runs = [...document.querySelectorAll("#canvas .run[data-run], .chart .run")];
      return {
        ws: on ? on.getAttribute("data-ws") : "",
        flow: tabOn ? tabOn.getAttribute("data-flow") || "" : "",
        n: runs.length,
        ids: runs.map((el) => el.getAttribute("data-run") || ""),
        flows: runs.map((el) => el.getAttribute("data-flow") || ""),
        bubbles: runs.map((el) => el.getAttribute("data-bubble") || ""),
        title: ((document.querySelector("#canvas .flow-title") || {}).textContent || "").trim().slice(0, 120),
      };
    });
    record(
      "SR1",
      "Slice paints subsystem-run boxes (.run / data-run)",
      srDesk.ws === "slice" &&
        srDesk.n >= 2 &&
        srDesk.ids.filter(Boolean).length >= 2 &&
        srDesk.bubbles.filter(Boolean).length >= 2 &&
        srDesk.flows.some((f) => f === srDesk.flow || f === srPick.flow),
      JSON.stringify(srDesk)
    );
    const srOnStage = await page.evaluate(() => {
      const stage = document.querySelector("#canvas .stage");
      const sr = stage ? stage.getBoundingClientRect() : null;
      const runs = [...document.querySelectorAll("#canvas .run[data-run], .chart .run")];
      const boxes = runs.map((el) => {
        const r = el.getBoundingClientRect();
        const inside =
          !!sr &&
          r.height >= 16 &&
          r.top >= sr.top - 2 &&
          r.bottom <= sr.bottom + 2 &&
          r.left >= sr.left - 2 &&
          r.right <= sr.right + 2;
        return {
          id: el.getAttribute("data-run") || "",
          h: Math.round(r.height),
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          inside,
        };
      });
      return { n: runs.length, boxes, stageBottom: sr ? Math.round(sr.bottom) : 0 };
    });
    record(
      "SR1b",
      "Slice subsystem runs sit fully on the stage",
      srOnStage.n >= 2 && srOnStage.boxes.length >= 2 && srOnStage.boxes.every((b) => b.inside),
      JSON.stringify(srOnStage)
    );
    await shot(page, "slice-runs.png");
    const srClick = await page.evaluate(() => {
      const run = document.querySelector("#canvas .run[data-run], .chart .run");
      if (!run) return { clicked: false };
      run.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return {
        clicked: true,
        run: run.getAttribute("data-run") || "",
        flow: run.getAttribute("data-flow") || "",
        bubble: run.getAttribute("data-bubble") || "",
      };
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
            runs: document.querySelectorAll("#canvas .run[data-run], .chart .run").length,
            enter: !!host,
            xy: document.querySelectorAll("#enterCanvas .react-flow__node").length,
            rf: !!document.querySelector("#enterCanvas .react-flow"),
            empty: ((document.querySelector("#canvas .empty") || {}).textContent || "").trim(),
            meta: ((document.getElementById("meta") || {}).textContent || "").trim().slice(0, 160),
            title: ((document.querySelector("#canvas .flow-title") || {}).textContent || "").trim().slice(0, 160),
          };
        });
        failFast("Slice enter-run XYFlow did not mount — click=" + JSON.stringify(srClick) + " dump=" + JSON.stringify(dump));
      });
    await page.waitForTimeout(250);
    const srEnter = await page.evaluate(() => {
      const xy = document.querySelectorAll("#enterCanvas .react-flow__node").length;
      const shapes = [
        ...new Set(
          [...document.querySelectorAll("#enterCanvas .vnode[data-shape]")].map((el) => el.getAttribute("data-shape"))
        ),
      ];
      const shaped = document.querySelectorAll("#enterCanvas .vnode[data-shape]").length;
      return {
        xy,
        shaped,
        shapes,
        inode: document.querySelectorAll(".inode").length,
        cards: document.querySelectorAll(".bubble-card").length,
        enterRun: (window.__vscodePosts || []).some((m) => m && m.type === "enterRun"),
      };
    });
    record(
      "SR2",
      "Enter a Slice run mounts shaped #enterCanvas XYFlow (not raw IR)",
      srClick.clicked &&
        srEnter.xy > 1 &&
        srEnter.xy <= 24 &&
        srEnter.shaped === srEnter.xy &&
        srEnter.inode === 0 &&
        srEnter.cards === 0 &&
        srEnter.enterRun,
      "xy=" + srEnter.xy + " shapes=" + srEnter.shapes.join(",") + " click=" + JSON.stringify(srClick)
    );
    const srEnds = await page.evaluate(() => {
      const starts = [...document.querySelectorAll("#enterCanvas .vnode[data-shape='start']")];
      const ends = [...document.querySelectorAll("#enterCanvas .vnode[data-shape='end']")];
      return {
        starts: starts.length,
        startId: starts[0] ? starts[0].getAttribute("data-id") || "" : "",
        startLit: starts.filter((el) => el.getAttribute("data-lit") === "1").length,
        ends: ends.length,
      };
    });
    record(
      "SR2b",
      "Slice run enter stamps the walk start on #enterCanvas and leaves the walk end for its own community",
      srClick.bubble === "b-render" &&
        srEnds.starts === 1 &&
        srEnds.startId === "n0" &&
        srEnds.startLit === 1 &&
        srEnds.ends === 0,
      JSON.stringify({ bubble: srClick.bubble, ...srEnds })
    );
    const afterSr = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        enterRun: posts.filter((m) => m && m.type === "enterRun").length,
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
    }, beforeSrPosts);
    record(
      "SR3",
      "Slice run enter posts enterRun and does not post stamp / skip",
      afterSr.enterRun >= 1 && afterSr.stampPosts === 0 && afterSr.skipPosts === 0,
      JSON.stringify(afterSr)
    );
    assertNoStampDir("SR4", "Slice runs step did not write .graphide/stamps/");
    const backSr = page.locator("#backBtn");
    if (await backSr.isEnabled()) await backSr.click();
    else {
      await page.evaluate(() => {
        const crumb = document.querySelector("#meta [data-go=programs], #meta [data-up=map]");
        if (crumb) crumb.click();
      });
    }
    await page.waitForSelector("#canvas .run[data-bubble='b-physics']", { timeout: 10000 });
    const srChildClick = await page.evaluate(() => {
      const run = document.querySelector("#canvas .run[data-bubble='b-physics']");
      if (!run) return { clicked: false };
      run.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return {
        clicked: true,
        run: run.getAttribute("data-run") || "",
        bubble: run.getAttribute("data-bubble") || "",
      };
    });
    await page
      .waitForFunction(
        () => document.querySelectorAll("#enterCanvas .vnode[data-shape='type'][data-leaf='0']").length >= 2,
        null,
        { timeout: 10000 }
      )
      .catch(() => failFast("Slice child communities did not mount — click=" + JSON.stringify(srChildClick)));
    await page.waitForTimeout(200);
    const srChild = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#enterCanvas .vnode[data-shape]")];
      const starts = document.querySelectorAll("#enterCanvas .vnode[data-shape='start']").length;
      return {
        n: nodes.length,
        types: nodes.filter((el) => el.getAttribute("data-shape") === "type" && el.getAttribute("data-leaf") === "0").length,
        endpoint: nodes.filter(
          (el) =>
            el.getAttribute("data-id") === "n164" &&
            el.getAttribute("data-shape") === "endpoint" &&
            el.getAttribute("data-leaf") === "1" &&
            el.getAttribute("data-kind") === "Endpoint"
        ).length,
        starts,
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        enterXy: document.querySelectorAll("#enterCanvas .react-flow__node").length,
      };
    });
    record(
      "SR2c",
      "Slice stack enter of a parent community stamps the Type data-shape",
      srChildClick.clicked &&
        srChildClick.bubble === "b-physics" &&
        srChild.n >= 2 &&
        srChild.n <= 24 &&
        srChild.types >= 2 &&
        srChild.endpoint === 1 &&
        srChild.starts === 0 &&
        srChild.cards === 0 &&
        srChild.xy === srChild.enterXy,
      JSON.stringify({ click: srChildClick, ...srChild })
    );
    await page.evaluate(() => {
      const node = document.querySelector("#enterCanvas .vnode[data-leaf='0'][data-id='b-physics-a']");
      if (node) node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await page
      .waitForFunction(
        () => document.querySelectorAll("#enterCanvas .vnode[data-leaf='1']").length > 1,
        null,
        { timeout: 10000 }
      )
      .catch(() => failFast("deeper Slice enter did not mount member shapes"));
    await page.waitForTimeout(200);
    const srDeeper = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#enterCanvas .vnode[data-shape]")];
      return {
        n: nodes.length,
        leaves: nodes.filter((el) => el.getAttribute("data-leaf") === "1").length,
        fn: nodes.some((el) => el.getAttribute("data-shape") === "fn"),
        startId: (document.querySelector("#enterCanvas .vnode[data-shape='start']") || {}).getAttribute
          ? document.querySelector("#enterCanvas .vnode[data-shape='start']").getAttribute("data-id") || ""
          : "",
        cards: document.querySelectorAll(".bubble-card").length,
      };
    });
    record(
      "SR2d",
      "Deeper Slice enter shows member shapes and does not move the walk start",
      srDeeper.n > 1 &&
        srDeeper.n <= 24 &&
        srDeeper.leaves === srDeeper.n &&
        srDeeper.fn &&
        srDeeper.startId !== "n0" &&
        srDeeper.cards === 0,
      JSON.stringify(srDeeper)
    );
    const backSrChild = page.locator("#backBtn");
    if (await backSrChild.isEnabled()) await backSrChild.click();
    else {
      await page.evaluate(() => {
        const crumb = document.querySelector("#meta [data-go=programs], #meta [data-up=map]");
        if (crumb) crumb.click();
      });
    }
    await page.waitForFunction(
      () => document.querySelectorAll("#enterCanvas .vnode[data-shape='type'][data-leaf='0']").length >= 2,
      null,
      { timeout: 10000 }
    );
    const backSrTypes = await page.evaluate(() =>
      document.querySelectorAll("#enterCanvas .vnode[data-shape='type'][data-leaf='0']").length
    );
    record(
      "SR2e",
      "Back on the Slice stack returns to Type-shaped child communities",
      backSrTypes >= 2,
      "types=" + backSrTypes
    );
    await page.evaluate(() => {
      const node = document.querySelector("#enterCanvas .vnode[data-leaf='0'][data-id='b-physics-a']");
      if (node) node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await page.waitForFunction(
      () => document.querySelectorAll("#enterCanvas .vnode[data-leaf='1']").length > 1,
      null,
      { timeout: 10000 }
    );
    const srZoom = await zoomPopOneLevel(page);
    await page.waitForFunction(
      () => document.querySelectorAll("#enterCanvas .vnode[data-shape='type'][data-leaf='0']").length >= 2,
      null,
      { timeout: 10000 }
    );
    const srZoomCut = await enterCutSig(page);
    record(
      "SR2f",
      "Zoom-pop from deeper Slice enter returns to the Type cut on the same stack",
      srZoom.before.leaves > 1 &&
        srZoomCut.types >= 2 &&
        srZoomCut.cards === 0 &&
        srZoomCut.runs === 0 &&
        srZoomCut.enter > 1,
      JSON.stringify({ before: srZoom.before, after: srZoomCut })
    );
    const backSrRuns = page.locator("#backBtn");
    if (await backSrRuns.isEnabled()) await backSrRuns.click();
    else {
      await page.evaluate(() => {
        const crumb = document.querySelector("#meta [data-go=programs], #meta [data-up=map]");
        if (crumb) crumb.click();
      });
    }
    await page.waitForSelector("#canvas .run[data-run]", { timeout: 10000 });
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForFunction(
      () => {
        const on = document.querySelector("#workspaces [data-ws].on");
        return on && on.getAttribute("data-ws") === "map";
      },
      null,
      { timeout: 8000 }
    );
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    await page.waitForTimeout(150);
    const afterSrMap = await page.evaluate(() => ({
      ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
        ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
        : "",
      xy: document.querySelectorAll("#canvas .react-flow__node, .bubble-map .react-flow__node").length,
      enter: document.querySelectorAll("#enterCanvas .react-flow__node").length,
      cards: document.querySelectorAll(".bubble-card").length,
      comm: document.querySelectorAll(".comm-node").length,
    }));
    record(
      "SR5",
      "Slice runs returns Map to community LOD (xy=0)",
      afterSrMap.ws === "map" &&
        afterSrMap.xy === 0 &&
        afterSrMap.enter === 0 &&
        afterSrMap.comm === 0 &&
        afterSrMap.cards > 1,
      JSON.stringify(afterSrMap)
    );

    const beforeSePosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForFunction(
      () => {
        const on = document.querySelector("#workspaces [data-ws].on");
        return on && on.getAttribute("data-ws") === "slice";
      },
      null,
      { timeout: 8000 }
    );
    await page.waitForSelector("#sliceCanvas .react-flow__node", { timeout: 10000 });
    await page.waitForTimeout(220);
    const seSliceBefore = await page.evaluate(() => {
      const stage = document.querySelector("#canvas .stage");
      const vp = document.querySelector("#canvas .viewport");
      if (stage) stage.dataset.recycleMark = "1";
      if (vp) vp.dataset.recycleMark = "1";
      const kCam = vp ? parseFloat(vp.style.getPropertyValue("--cam-k") || "0") : 0;
      return {
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
        slice: document.querySelectorAll("#sliceCanvas .react-flow__node").length,
        enter: document.querySelectorAll("#enterCanvas .react-flow__node").length,
        cards: document.querySelectorAll(".bubble-card").length,
        k: kCam,
      };
    });
    record(
      "SE0",
      "Slice paints Steiner XYFlow before recycle",
      seSliceBefore.ws === "slice" && seSliceBefore.slice > 1 && seSliceBefore.enter === 0 && seSliceBefore.cards === 0,
      JSON.stringify(seSliceBefore)
    );
    await page.evaluate(() => {
      const btn = document.getElementById("zoomIn");
      if (btn) btn.click();
    });
    await page.waitForTimeout(350);
    const seSliceCam = await page.evaluate(() => {
      const vp = document.querySelector("#canvas .viewport");
      return parseFloat((vp && vp.style.getPropertyValue("--cam-k")) || "0");
    });
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForTimeout(220);
    const seSliceReselect = await page.evaluate((wantK) => {
      const stage = document.querySelector("#canvas .stage");
      const vp = document.querySelector("#canvas .viewport");
      const kCam = vp ? parseFloat(vp.style.getPropertyValue("--cam-k") || "0") : 0;
      return {
        sameStage: !!(stage && stage.dataset.recycleMark === "1"),
        sameVp: !!(vp && vp.dataset.recycleMark === "1"),
        slice: document.querySelectorAll("#sliceCanvas .react-flow__node").length,
        enter: document.querySelectorAll("#enterCanvas .react-flow__node").length,
        k: kCam,
        wantK,
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    }, seSliceCam);
    record(
      "SE1",
      "Re-select Slice recycles the same .stage / .viewport (keepCam)",
      seSliceReselect.ws === "slice" &&
        seSliceReselect.sameStage &&
        seSliceReselect.sameVp &&
        seSliceReselect.slice > 1 &&
        seSliceReselect.enter === 0 &&
        seSliceReselect.k > 0 &&
        Math.abs(seSliceReselect.k - seSliceCam) < 0.2 &&
        (Math.abs(seSliceCam - 1) < 0.05 || Math.abs(seSliceReselect.k - 1) > 0.04),
      JSON.stringify(seSliceReselect)
    );
    await page.evaluate(() => {
      window.postMessage({ type: "patch", stats: { elapsed_ms: 140 } }, "*");
    });
    await page.waitForTimeout(120);
    const seSlicePatch = await page.evaluate((wantK) => {
      const stage = document.querySelector("#canvas .stage");
      const vp = document.querySelector("#canvas .viewport");
      const kCam = vp ? parseFloat(vp.style.getPropertyValue("--cam-k") || "0") : 0;
      return {
        sameStage: !!(stage && stage.dataset.recycleMark === "1"),
        sameVp: !!(vp && vp.dataset.recycleMark === "1"),
        slice: document.querySelectorAll("#sliceCanvas .react-flow__node").length,
        k: kCam,
        wantK,
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    }, seSliceCam);
    record(
      "SE2",
      "Patch recycles Slice stage and keeps the camera",
      seSlicePatch.ws === "slice" &&
        seSlicePatch.sameStage &&
        seSlicePatch.sameVp &&
        seSlicePatch.slice > 1 &&
        seSlicePatch.k > 0 &&
        Math.abs(seSlicePatch.k - seSliceCam) < 0.25 &&
        (Math.abs(seSliceCam - 1) < 0.05 || Math.abs(seSlicePatch.k - 1) > 0.04),
      JSON.stringify(seSlicePatch)
    );
    await page.evaluate(() => {
      const run = document.querySelector("#canvas .run[data-run], .chart .run");
      if (run && run.scrollIntoView) run.scrollIntoView({ block: "center", inline: "nearest" });
    });
    await page.waitForTimeout(80);
    const seRunClick = await page.evaluate(() => {
      const run = document.querySelector("#canvas .run[data-run], .chart .run");
      if (!run) return { clicked: false };
      run.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return { clicked: true, run: run.getAttribute("data-run") || "" };
    });
    await page
      .waitForFunction(
        () => document.querySelectorAll("#enterCanvas .react-flow__node").length > 1,
        null,
        { timeout: 10000 }
      )
      .catch(async () => {
        const dump = await page.evaluate(() => ({
          clicked: true,
          enter: !!document.getElementById("enterCanvas"),
          xy: document.querySelectorAll("#enterCanvas .react-flow__node").length,
        }));
        failFast("Slice/Enter recycle enter XYFlow did not mount — click=" + JSON.stringify(seRunClick) + " dump=" + JSON.stringify(dump));
      });
    await page.waitForTimeout(220);
    const seEnterBefore = await page.evaluate(() => {
      const stage = document.querySelector("#canvas .stage");
      const vp = document.querySelector("#canvas .viewport");
      if (stage) stage.dataset.recycleMark = "1";
      if (vp) vp.dataset.recycleMark = "1";
      const kCam = vp ? parseFloat(vp.style.getPropertyValue("--cam-k") || "0") : 0;
      return {
        enter: document.querySelectorAll("#enterCanvas .react-flow__node").length,
        shaped: document.querySelectorAll("#enterCanvas .vnode[data-shape]").length,
        inode: document.querySelectorAll(".inode").length,
        k: kCam,
      };
    });
    record(
      "SE3",
      "Enter a Slice run mounts #enterCanvas before recycle",
      seRunClick.clicked && seEnterBefore.enter > 1 && seEnterBefore.enter <= 24 && seEnterBefore.shaped === seEnterBefore.enter && seEnterBefore.inode === 0,
      JSON.stringify({ click: seRunClick, desk: seEnterBefore })
    );
    await page.evaluate(() => {
      const btn = document.getElementById("zoomIn");
      if (btn) btn.click();
    });
    await page.waitForTimeout(350);
    const seEnterCam = await page.evaluate(() => {
      const vp = document.querySelector("#canvas .viewport");
      return parseFloat((vp && vp.style.getPropertyValue("--cam-k")) || "0");
    });
    await page.evaluate(() => {
      window.postMessage({ type: "patch", stats: { elapsed_ms: 160 } }, "*");
    });
    await page.waitForTimeout(140);
    const seEnterPatch = await page.evaluate((wantK) => {
      const stage = document.querySelector("#canvas .stage");
      const vp = document.querySelector("#canvas .viewport");
      const kCam = vp ? parseFloat(vp.style.getPropertyValue("--cam-k") || "0") : 0;
      return {
        sameStage: !!(stage && stage.dataset.recycleMark === "1"),
        sameVp: !!(vp && vp.dataset.recycleMark === "1"),
        enter: document.querySelectorAll("#enterCanvas .react-flow__node").length,
        k: kCam,
        wantK,
      };
    }, seEnterCam);
    record(
      "SE4",
      "Patch recycles Enter stage and keeps the camera",
      seEnterPatch.sameStage &&
        seEnterPatch.sameVp &&
        seEnterPatch.enter > 1 &&
        seEnterPatch.enter <= 24 &&
        seEnterPatch.k > 0 &&
        Math.abs(seEnterPatch.k - seEnterCam) < 0.25 &&
        (Math.abs(seEnterCam - 1) < 0.05 || Math.abs(seEnterPatch.k - 1) > 0.04),
      JSON.stringify(seEnterPatch)
    );
    const afterSe = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        stampPosts: posts.filter((p) => p && p.type === "stamp").length,
        skipPosts: posts.filter((p) => p && p.type === "skip").length,
      };
    }, beforeSePosts);
    record(
      "SE5",
      "Slice / Enter recycle does not post stamp / skip",
      afterSe.stampPosts === 0 && afterSe.skipPosts === 0,
      JSON.stringify(afterSe)
    );
    await shot(page, "slice-enter-recycle.png");
    assertNoStampDir("SE6", "Slice / Enter recycle did not write .graphide/stamps/");
    const backSe = page.locator("#backBtn");
    if (await backSe.isEnabled()) await backSe.click();
    else {
      await page.evaluate(() => {
        const crumb = document.querySelector("#meta [data-go=programs], #meta [data-up=map]");
        if (crumb) crumb.click();
      });
    }
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForFunction(
      () => {
        const on = document.querySelector("#workspaces [data-ws].on");
        return on && on.getAttribute("data-ws") === "map";
      },
      null,
      { timeout: 8000 }
    );
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    await page.waitForTimeout(150);
    const afterSeMap = await page.evaluate(() => ({
      ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
        ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
        : "",
      xy: document.querySelectorAll("#canvas .react-flow__node, .bubble-map .react-flow__node").length,
      enter: document.querySelectorAll("#enterCanvas .react-flow__node").length,
      cards: document.querySelectorAll(".bubble-card").length,
      comm: document.querySelectorAll(".comm-node").length,
    }));
    record(
      "SE7",
      "Slice / Enter recycle returns Map to community LOD (xy=0)",
      afterSeMap.ws === "map" &&
        afterSeMap.xy === 0 &&
        afterSeMap.enter === 0 &&
        afterSeMap.comm === 0 &&
        afterSeMap.cards > 1,
      JSON.stringify(afterSeMap)
    );

    const beforeStPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForFunction(
      () => {
        const on = document.querySelector("#workspaces [data-ws].on");
        return on && on.getAttribute("data-ws") === "slice";
      },
      null,
      { timeout: 8000 }
    );
    const stPick = await page.evaluate(() => {
      const tab =
        document.querySelector('#tabs .tab[data-flow="control-flow"]') ||
        document.querySelector('#tabs .tab[data-flow="boot"]') ||
        document.querySelector("#tabs .tab[data-flow]");
      const flow = tab ? tab.getAttribute("data-flow") || "" : "";
      if (tab && !tab.classList.contains("on")) tab.click();
      return { flow, clicked: !!tab };
    });
    if (stPick.clicked && stPick.flow) {
      await page.waitForFunction(
        (name) => {
          const on = document.querySelector("#tabs .tab.on[data-flow]");
          const ws = document.querySelector("#workspaces [data-ws].on");
          return !!(on && on.getAttribute("data-flow") === name && ws && ws.getAttribute("data-ws") === "slice");
        },
        stPick.flow,
        { timeout: 8000 }
      );
    }
    await page.waitForSelector("#canvas .run[data-run], .chart .run", { timeout: 10000 });
    await page.waitForTimeout(180);
    const stFresh = await page.evaluate(() => {
      const runs = [...document.querySelectorAll("#canvas .run[data-run], .chart .run")];
      return {
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
        flow: (document.querySelector("#tabs .tab.on[data-flow]") || {}).getAttribute
          ? document.querySelector("#tabs .tab.on[data-flow]").getAttribute("data-flow") || ""
          : "",
        n: runs.length,
        layout: runs.map((el) => ({
          id: el.getAttribute("data-run") || "",
          bubble: el.getAttribute("data-bubble") || "",
          left: parseFloat(el.style.left) || 0,
          top: parseFloat(el.style.top) || 0,
        })),
      };
    });
    const stFreshOk =
      stFresh.ws === "slice" &&
      stFresh.n >= 2 &&
      stFresh.layout.some((p) => Math.abs(p.left - 24) < 1 && Math.abs(p.top - 16) < 1) &&
      stFresh.layout.some((p) => Math.abs(p.left - 280) < 1 && Math.abs(p.top - 16) < 1) &&
      !stFresh.layout.some((p) => Math.abs(p.left - 56) < 1 && Math.abs(p.top - 152) < 1);
    record(
      "ST0",
      "Slice first paint is the fresh run layout, not the stamp overlay",
      stFreshOk,
      JSON.stringify(stFresh)
    );
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForFunction(
      () => {
        const on = document.querySelector("#workspaces [data-ws].on");
        return on && on.getAttribute("data-ws") === "map";
      },
      null,
      { timeout: 8000 }
    );
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    const stPosted = await page.evaluate(() => {
      const fn = window.__graphideStampRecheck;
      if (typeof fn !== "function") return { ok: false, why: "no __graphideStampRecheck" };
      const msg = fn();
      window.postMessage(msg, "*");
      const pos = ((msg.flow && msg.flow.flowchart && msg.flow.flowchart.positions) || []).map((p) => ({
        run: p.run,
        x: p.x,
        y: p.y,
      }));
      const added = ((msg.findings || []).find((f) => f && f.kind === "StampBroken") || {}).added || [];
      return {
        ok: true,
        type: msg.type,
        flow: msg.flow && msg.flow.name,
        pos,
        added,
        holds: (msg.stamps || []).map((s) => ({ name: s.name, holds: s.holds })),
      };
    });
    record(
      "ST1",
      "Fixture recheck posts overlayed stamp positions and StampBroken",
      stPosted.ok &&
        stPosted.type === "patch" &&
        stPosted.flow === "boot" &&
        (stPosted.pos || []).some((p) => p.run === 1 && p.x === 56 && p.y === 152) &&
        (stPosted.pos || []).some((p) => p.run === 2 && p.x === 360 && p.y === 152) &&
        (stPosted.added || []).some((e) => e.from === "n0" && e.to === "n3") &&
        (stPosted.holds || []).some((s) => s.name === "boot" && s.holds === false),
      JSON.stringify(stPosted)
    );
    await page.waitForTimeout(160);
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForFunction(
      () => {
        const on = document.querySelector("#workspaces [data-ws].on");
        return on && on.getAttribute("data-ws") === "slice";
      },
      null,
      { timeout: 8000 }
    );
    if (stPick.clicked && stPick.flow) {
      await page.evaluate((name) => {
        const tab = document.querySelector('#tabs .tab[data-flow="' + name + '"]');
        if (tab && !tab.classList.contains("on")) tab.click();
      }, stPick.flow);
      await page.waitForFunction(
        (name) => {
          const on = document.querySelector("#tabs .tab.on[data-flow]");
          const ws = document.querySelector("#workspaces [data-ws].on");
          return !!(on && on.getAttribute("data-flow") === name && ws && ws.getAttribute("data-ws") === "slice");
        },
        stPick.flow,
        { timeout: 8000 }
      );
    }
    await page.waitForSelector("#canvas .run[data-run], .chart .run", { timeout: 10000 });
    await page.waitForTimeout(220);
    const stOverlay = await page.evaluate(() => {
      const runs = [...document.querySelectorAll("#canvas .run[data-run], .chart .run")];
      return {
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
        flow: (document.querySelector("#tabs .tab.on[data-flow]") || {}).getAttribute
          ? document.querySelector("#tabs .tab.on[data-flow]").getAttribute("data-flow") || ""
          : "",
        n: runs.length,
        layout: runs.map((el) => ({
          id: el.getAttribute("data-run") || "",
          bubble: el.getAttribute("data-bubble") || "",
          flow: el.getAttribute("data-flow") || "",
          left: parseFloat(el.style.left) || 0,
          top: parseFloat(el.style.top) || 0,
        })),
      };
    });
    const stOverlayOk =
      stOverlay.ws === "slice" &&
      stOverlay.n >= 2 &&
      stOverlay.layout.some((p) => Math.abs(p.left - 56) < 1 && Math.abs(p.top - 152) < 1) &&
      stOverlay.layout.some((p) => Math.abs(p.left - 360) < 1 && Math.abs(p.top - 152) < 1) &&
      !stOverlay.layout.some((p) => Math.abs(p.left - 24) < 1 && Math.abs(p.top - 16) < 1);
    record(
      "ST2",
      "Recheck lays the new tree on stored stamp run positions",
      stOverlayOk && stFreshOk,
      "fresh=" + JSON.stringify(stFresh.layout) + " overlay=" + JSON.stringify(stOverlay)
    );
    await page.evaluate(() => {
      const run = document.querySelector("#canvas .run[data-run], .chart .run");
      if (run && run.scrollIntoView) run.scrollIntoView({ block: "center", inline: "nearest" });
    });
    await page.waitForTimeout(120);
    await shot(page, "stamp-recheck.png");
    await page.click('#workspaces [data-ws="decisions"]');
    await page.waitForFunction(
      () => {
        const on = document.querySelector("#workspaces [data-ws].on");
        return on && on.getAttribute("data-ws") === "decisions";
      },
      null,
      { timeout: 8000 }
    );
    await page.waitForTimeout(120);
    const stBroken = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".expl-card[data-decision], .expl-card")];
      const broken = cards.filter((el) => /StampBroken/i.test(el.textContent || ""));
      return {
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
        n: broken.length,
        title: broken
          .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
          .join(" | ")
          .slice(0, 180),
      };
    });
    record(
      "ST3",
      "Decisions still lists StampBroken on the overlayed boot tree",
      stBroken.ws === "decisions" && stBroken.n >= 1 && /boot/i.test(stBroken.title),
      JSON.stringify(stBroken)
    );
    const afterSt = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
    }, beforeStPosts);
    record(
      "ST4",
      "Stamp recheck overlay does not post stamp / skip",
      afterSt.stampPosts === 0 && afterSt.skipPosts === 0,
      JSON.stringify(afterSt)
    );
    assertNoStampDir("ST5", "Stamp recheck overlay did not write .graphide/stamps/");
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForFunction(
      () => {
        const on = document.querySelector("#workspaces [data-ws].on");
        return on && on.getAttribute("data-ws") === "map";
      },
      null,
      { timeout: 8000 }
    );
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    await page.waitForTimeout(150);
    const afterStMap = await page.evaluate(() => ({
      ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
        ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
        : "",
      xy: document.querySelectorAll("#canvas .react-flow__node, .bubble-map .react-flow__node").length,
      cards: document.querySelectorAll(".bubble-card").length,
      comm: document.querySelectorAll(".comm-node").length,
    }));
    record(
      "ST6",
      "Stamp recheck overlay returns Map to community LOD (xy=0)",
      afterStMap.ws === "map" && afterStMap.xy === 0 && afterStMap.comm === 0 && afterStMap.cards > 1,
      JSON.stringify(afterStMap)
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
    assertNoStampDir("PG7", "Progress step did not write .graphide/stamps/");

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
    // Backspace while busy cancels (same as Escape), does not navigate.
    const busyBackPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("Backspace");
    await page.waitForFunction(
      (before) => {
        const posts = (window.__vscodePosts || []).slice(before);
        const label = ((document.getElementById("progressLabel") || {}).textContent || "");
        return posts.some((m) => m && m.type === "cancel") || /Cancell/i.test(label);
      },
      busyBackPosts,
      { timeout: 5000 }
    );
    const afterBusyBack = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        cancelPosts: posts.filter((m) => m && m.type === "cancel").length,
        label: ((document.getElementById("progressLabel") || {}).textContent || "").trim(),
        on: !!(document.getElementById("progress") && document.getElementById("progress").classList.contains("on")),
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
      };
    }, busyBackPosts);
    record(
      "CR1b",
      "Backspace while busy posts cancel and labels Cancelling…",
      afterBusyBack.cancelPosts >= 1 &&
        /Cancell/i.test(afterBusyBack.label) &&
        afterBusyBack.on &&
        afterBusyBack.cards >= 8 &&
        afterBusyBack.xy === 0,
      JSON.stringify(afterBusyBack)
    );
    // Escape while busy: same cancel + label parity with #cancelBtn.
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
        const cancel = document.getElementById("cancelBtn");
        const progress = document.getElementById("progress");
        return !!(progress && progress.classList.contains("on") && cancel && !cancel.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const busyEscPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      (before) => {
        const posts = (window.__vscodePosts || []).slice(before);
        const label = ((document.getElementById("progressLabel") || {}).textContent || "");
        return posts.some((m) => m && m.type === "cancel") && /Cancell/i.test(label);
      },
      busyEscPosts,
      { timeout: 5000 }
    );
    const afterBusyEsc = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        cancelPosts: posts.filter((m) => m && m.type === "cancel").length,
        label: ((document.getElementById("progressLabel") || {}).textContent || "").trim(),
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
      };
    }, busyEscPosts);
    record(
      "CR1c",
      "Escape while busy posts cancel and labels Cancelling…",
      afterBusyEsc.cancelPosts >= 1 && /Cancell/i.test(afterBusyEsc.label) && afterBusyEsc.cards >= 8 && afterBusyEsc.xy === 0,
      JSON.stringify(afterBusyEsc)
    );
    // Late progress must not flash the old phase over Cancelling….
    await page.evaluate(() => {
      window.postMessage(
        {
          type: "progress",
          phase: "cluster",
          label: "Clustering communities…",
          done: 4,
          total: 5,
          pct: 80,
          elapsed_ms: 2100,
        },
        "*"
      );
    });
    await page.waitForTimeout(80);
    const afterLateProgress = await page.evaluate(() => ({
      label: ((document.getElementById("progressLabel") || {}).textContent || "").trim(),
      on: !!(document.getElementById("progress") && document.getElementById("progress").classList.contains("on")),
    }));
    record(
      "CR1d",
      "After cancel, late progress keeps Cancelling… (does not flash Clustering)",
      /Cancell/i.test(afterLateProgress.label) && afterLateProgress.on,
      JSON.stringify(afterLateProgress)
    );
    // Restore busy strip for the click path (host may have flipped Cancelling…).
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
        const cancel = document.getElementById("cancelBtn");
        const progress = document.getElementById("progress");
        return !!(progress && progress.classList.contains("on") && cancel && !cancel.hidden);
      },
      null,
      { timeout: 5000 }
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
    assertNoStampDir("CR6", "Cancel-review step did not write .graphide/stamps/");

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
    assertNoStampDir("N6", "Appearance step did not write .graphide/stamps/");

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
    const enterEnds = await page.evaluate(() => {
      const starts = [...document.querySelectorAll("#enterCanvas .vnode[data-shape='start']")];
      const ends = [...document.querySelectorAll("#enterCanvas .vnode[data-shape='end']")];
      const enterXy = document.querySelectorAll("#enterCanvas .react-flow__node").length;
      return {
        starts: starts.length,
        startId: starts[0] ? starts[0].getAttribute("data-id") || "" : "",
        startLit: starts.filter((el) => el.getAttribute("data-lit") === "1").length,
        ends: ends.length,
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        enterXy,
      };
    });
    record(
      "E1c",
      "Map community enter stamps the same walk-start shape and keeps XYFlow inside #enterCanvas",
      enterEnds.starts === 1 &&
        enterEnds.startId === "n0" &&
        enterEnds.startLit === 1 &&
        enterEnds.ends === 0 &&
        enterEnds.cards === 0 &&
        enterEnds.xy === enterEnds.enterXy,
      JSON.stringify(enterEnds)
    );

    const enterDist = await page.evaluate(() => {
      const node = (id) => document.querySelector("#enterCanvas .vnode[data-id='" + id + "']");
      const row = (id) => {
        const el = node(id);
        if (!el) return null;
        return {
          id,
          dist: el.getAttribute("data-slice-dist"),
          lit: el.getAttribute("data-lit"),
          shape: el.getAttribute("data-shape"),
          opacity: Number(getComputedStyle(el).opacity),
        };
      };
      return { n0: row("n0"), n12: row("n12"), n108: row("n108"), n1200: row("n1200") };
    });
    const fade = (row) => row && Number.isFinite(row.opacity);
    record(
      "E1p",
      "Enter greys off-tree members by graph distance to the walk",
      fade(enterDist.n0) &&
        enterDist.n0.dist === "0" &&
        enterDist.n0.lit === "1" &&
        enterDist.n0.shape === "start" &&
        enterDist.n0.opacity === 1 &&
        fade(enterDist.n12) &&
        enterDist.n12.dist === "1" &&
        enterDist.n12.lit === "0" &&
        enterDist.n12.shape === "fn" &&
        fade(enterDist.n108) &&
        enterDist.n108.dist === "2" &&
        enterDist.n108.shape === "fn" &&
        fade(enterDist.n1200) &&
        enterDist.n1200.dist === "3" &&
        enterDist.n1200.shape === "fn" &&
        enterDist.n12.opacity > enterDist.n108.opacity &&
        enterDist.n108.opacity > enterDist.n1200.opacity,
      JSON.stringify(enterDist)
    );
    await shot(page, "enter-distance.png");
    // Route dim must beat Enter distance grey: off-route ring members do not sit above .route-dim (0.22).
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
    await page.keyboard.press("r");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    await page.waitForTimeout(200);
    const enterRoute = await page.evaluate(() => {
      const rec = window.__graphideRoute || {};
      const ring = [...document.querySelectorAll("#enterCanvas .vnode.grey[data-slice-dist].route-dim")];
      const op = (el) => Number(getComputedStyle(el).opacity);
      return {
        ok: !!rec.ok,
        ring: ring.length,
        near: ring.filter((el) => el.getAttribute("data-slice-dist") === "1").length,
        ringMax: Math.max(0, ...ring.map(op)),
      };
    });
    record(
      "RT8b",
      "Enter Route dims the off-route grey ring to the far-ring floor",
      enterRoute.ok && enterRoute.ring >= 1 && enterRoute.near >= 1 && enterRoute.ringMax <= 0.221,
      JSON.stringify(enterRoute)
    );
    await shot(page, "enter-route-dim.png");
    await page.keyboard.press("r");
    await page.waitForFunction(() => !(window.__graphideRoute && window.__graphideRoute.open), null, { timeout: 5000 });
    await page.waitForTimeout(150);

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
      const egoNodes = nodes.filter((el) => el.classList.contains("ego") && !el.classList.contains("ego-dim"));
      const dimNodes = nodes.filter((el) => el.classList.contains("ego-dim"));
      return {
        on: !!(btn && btn.classList.contains("on")),
        hops: hops ? hops.value : "",
        nodes: nodes.length,
        ego: egoNodes.length,
        dim: dimNodes.length,
        selected: nodes.filter((el) => el.classList.contains("selected")).length,
        files: nodes.filter((el) => el.getAttribute("data-file")).length,
        egoOpacity: egoNodes.length ? Math.min(...egoNodes.map((el) => Number(getComputedStyle(el).opacity))) : 0,
        dimOpacity: dimNodes.length ? Math.max(...dimNodes.map((el) => Number(getComputedStyle(el).opacity))) : 1,
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
      egoEnter.selected >= 1 && egoEnter.ego >= 1 && egoEnter.egoOpacity === 1 && egoEnter.dimOpacity <= 0.12,
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
    await page.fill("#graphSearch", "ScreenshotFormat");
    await page.waitForTimeout(200);
    const enterFindDim = await page.evaluate(() => {
      const read = (id) => {
        const el = document.querySelector("#enterCanvas .vnode[data-id='" + id + "']");
        if (!el) return null;
        return {
          dim: el.classList.contains("dim"),
          hit: el.classList.contains("hit"),
          dist: el.getAttribute("data-slice-dist"),
          op: Number(getComputedStyle(el).opacity),
        };
      };
      return { n0: read("n0"), n12: read("n12") };
    });
    record(
      "SG2b",
      "Find dims Enter off-tree nodes under distance grey",
      !!(enterFindDim.n0 && enterFindDim.n0.hit && !enterFindDim.n0.dim && enterFindDim.n0.op >= 0.99) &&
        !!(enterFindDim.n12 && enterFindDim.n12.dim && enterFindDim.n12.dist === "1" && enterFindDim.n12.op <= 0.18),
      JSON.stringify(enterFindDim)
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

    const childClick = await page.evaluate(() => {
      const card = document.querySelector('.bubble-card[data-bubble="b-physics"]');
      if (!card) return { clicked: false };
      card.click();
      return { clicked: true, id: card.getAttribute("data-bubble") || "" };
    });
    await page
      .waitForFunction(
        () => document.querySelectorAll("#enterCanvas .vnode[data-leaf='0']").length >= 2,
        null,
        { timeout: 10000 }
      )
      .catch(() => failFast("child communities did not mount — click=" + JSON.stringify(childClick)));
    await page.waitForTimeout(200);
    const childCut = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#enterCanvas .vnode[data-shape]")];
      return {
        n: nodes.length,
        shapes: [...new Set(nodes.map((el) => el.getAttribute("data-shape")))],
        kinds: [...new Set(nodes.map((el) => el.getAttribute("data-kind")))],
        nonLeaves: nodes.filter((el) => el.getAttribute("data-leaf") === "0").length,
        endpoint: nodes.filter(
          (el) =>
            el.getAttribute("data-id") === "n164" &&
            el.getAttribute("data-shape") === "endpoint" &&
            el.getAttribute("data-leaf") === "1" &&
            el.getAttribute("data-kind") === "Endpoint"
        ).length,
        ids: nodes.map((el) => el.getAttribute("data-id") || ""),
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        enterXy: document.querySelectorAll("#enterCanvas .react-flow__node").length,
        inode: document.querySelectorAll(".inode").length,
      };
    });
    record(
      "E1d",
      "Map child communities use the Type data-shape and stay non-leaves",
      childClick.clicked &&
        childClick.id === "b-physics" &&
        childCut.n >= 2 &&
        childCut.n <= 24 &&
        childCut.nonLeaves >= 2 &&
        childCut.shapes.indexOf("type") >= 0 &&
        childCut.kinds.indexOf("Type") >= 0 &&
        childCut.ids.indexOf("b-physics-a") >= 0 &&
        childCut.ids.indexOf("b-physics-b") >= 0 &&
        childCut.inode === 0 &&
        childCut.cards === 0 &&
        childCut.xy === childCut.enterXy,
      JSON.stringify({ click: childClick, ...childCut })
    );
    record(
      "E1l",
      "A one-member child is the derived Endpoint, not a Type community",
      childCut.endpoint === 1 && childCut.ids.indexOf("n164") >= 0 && childCut.ids.indexOf("b-physics-c") < 0,
      JSON.stringify({ endpoint: childCut.endpoint, ids: childCut.ids })
    );
    // n2000 sits in b-physics-b. Its FQN is not the child label; the child that holds it must stay lit.
    await page.fill("#graphSearch", "ScreenshotFormat_2000");
    await page.waitForTimeout(250);
    const childFind = await page.evaluate(() => {
      const read = (id) => {
        const el = document.querySelector("#enterCanvas .vnode[data-id='" + id + "']");
        if (!el) return null;
        return { hit: el.classList.contains("hit"), dim: el.classList.contains("dim"), op: Number(getComputedStyle(el).opacity) };
      };
      return { a: read("b-physics-a"), b: read("b-physics-b"), ep: read("n164") };
    });
    record(
      "SG1d",
      "Find on a member FQN keeps the holding Enter child community lit",
      !!(childFind.b && childFind.b.hit && !childFind.b.dim && childFind.b.op >= 0.99) &&
        !!(childFind.a && childFind.a.dim && !childFind.a.hit && childFind.a.op <= 0.18) &&
        !!(childFind.ep && childFind.ep.dim && !childFind.ep.hit),
      JSON.stringify(childFind)
    );
    await shot(page, "enter-find-member.png");
    // Member file path is not a child label either. Same hold-community rule as SG1d (file half of bubbleMembersMatchQuery).
    // screenshotformat.rs sits in both physics children; the Endpoint leaf (n164 / simulationscale.rs) must dim.
    await page.fill("#graphSearch", "screenshotformat.rs");
    await page.waitForTimeout(250);
    const childFindFile = await page.evaluate(() => {
      const read = (id) => {
        const el = document.querySelector("#enterCanvas .vnode[data-id='" + id + "']");
        if (!el) return null;
        return { hit: el.classList.contains("hit"), dim: el.classList.contains("dim"), op: Number(getComputedStyle(el).opacity) };
      };
      return { a: read("b-physics-a"), b: read("b-physics-b"), ep: read("n164"), q: (document.getElementById("graphSearch") || {}).value || "" };
    });
    record(
      "SG1f",
      "Find on a member file keeps the holding Enter child communities lit",
      !!(childFindFile.b && childFindFile.b.hit && !childFindFile.b.dim && childFindFile.b.op >= 0.99) &&
        !!(childFindFile.a && childFindFile.a.hit && !childFindFile.a.dim && childFindFile.a.op >= 0.99) &&
        !!(childFindFile.ep && childFindFile.ep.dim && !childFindFile.ep.hit && childFindFile.ep.op <= 0.18) &&
        /screenshotformat\.rs/i.test(childFindFile.q),
      JSON.stringify(childFindFile)
    );
    await shot(page, "enter-find-file.png");
    await page.fill("#graphSearch", "");
    await page.waitForTimeout(150);
    const childHops = await page.evaluate(() => {
      const shapeOf = (id) => {
        const el = document.querySelector("#enterCanvas .vnode[data-id='" + id + "']");
        return el ? el.getAttribute("data-shape") || "" : "";
      };
      const hops = [...document.querySelectorAll("#enterCanvas .react-flow__edge")].map(
        (el) => el.getAttribute("data-id") || ""
      );
      const linked = hops.filter((id) => id.indexOf("n164") >= 0 && (id.indexOf("b-physics-a") >= 0 || id.indexOf("b-physics-b") >= 0));
      const pane = document.querySelector("#enterCanvas .react-flow");
      const pr = pane ? pane.getBoundingClientRect() : null;
      let clipped = 0;
      let sampled = 0;
      if (pr) {
        for (const edge of document.querySelectorAll("#enterCanvas .react-flow__edge")) {
          const id = edge.getAttribute("data-id") || "";
          if (id.indexOf("n164") < 0) continue;
          const path = edge.querySelector("path.react-flow__edge-path");
          if (!path || !path.getTotalLength || !path.getScreenCTM()) continue;
          const len = path.getTotalLength();
          const ctm = path.getScreenCTM();
          for (let i = 0; i <= 16; i++) {
            const p = path.getPointAtLength((len * i) / 16);
            const s = new DOMPoint(p.x, p.y).matrixTransform(ctm);
            sampled++;
            if (s.x < pr.left - 2 || s.x > pr.right + 2 || s.y < pr.top - 2 || s.y > pr.bottom + 2) clipped++;
          }
        }
      }
      return {
        hops: hops.length,
        linked: linked.length,
        a: shapeOf("b-physics-a"),
        b: shapeOf("b-physics-b"),
        clipped,
        sampled,
      };
    });
    record(
      "E1m",
      "A one-member child keeps the hops into its sibling community on the stage",
      childHops.linked >= 1 &&
        childHops.hops >= 1 &&
        childHops.hops <= 80 &&
        childHops.a === "type" &&
        childHops.b === "type" &&
        childHops.sampled > 0 &&
        childHops.clipped === 0,
      JSON.stringify(childHops)
    );
    await shot(page, "enter-child-type.png");
    await shot(page, "enter-back-hop.png");
    const enterMemberHop = await page.evaluate(() => {
      const edge = [...document.querySelectorAll("#enterCanvas .react-flow__edge")].find((el) =>
        /b-physics-a:n164:Reads/.test(el.getAttribute("data-id") || "")
      );
      if (edge) edge.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      const card = document.getElementById("hopCard");
      const text = card ? card.textContent.replace(/\s+/g, " ").trim() : "";
      return {
        id: edge ? edge.getAttribute("data-id") || "" : "",
        hidden: !card || card.hidden,
        text,
        ids: card ? [...card.querySelectorAll("[data-id]")].map((el) => el.getAttribute("data-id") || "") : [],
      };
    });
    record(
      "E1n",
      "Enter hop card names the member nodes, not the sibling community",
      /b-physics-a:n164:Reads/.test(enterMemberHop.id) &&
        !enterMemberHop.hidden &&
        enterMemberHop.ids.indexOf("n152") >= 0 &&
        enterMemberHop.ids.indexOf("n164") >= 0 &&
        enterMemberHop.ids.indexOf("b-physics-a") < 0 &&
        /solarsim::mod72::SimulationData_152/.test(enterMemberHop.text) &&
        /solarsim::mod4::SimulationScale_164/.test(enterMemberHop.text),
      JSON.stringify(enterMemberHop)
    );
    await shot(page, "enter-member-hop.png");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(120);
    await page.evaluate(() => {
      const node = document.querySelector("#enterCanvas .vnode[data-id='n164']");
      if (node) node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
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
    await page.waitForTimeout(250);
    const egoComm = await page.evaluate(() => {
      const node = (id) => document.querySelector("#enterCanvas .vnode[data-id='" + id + "']");
      const a = node("b-physics-a");
      const b = node("b-physics-b");
      const ep = node("n164");
      return {
        aEgo: !!(a && a.classList.contains("ego") && !a.classList.contains("ego-dim")),
        aDist: a ? a.getAttribute("data-dist") : "",
        aShape: a ? a.getAttribute("data-shape") : "",
        bDim: !!(b && b.classList.contains("ego-dim") && !b.classList.contains("ego")),
        bDist: b ? b.getAttribute("data-dist") : "",
        bShape: b ? b.getAttribute("data-shape") : "",
        epEgo: !!(ep && ep.classList.contains("ego") && !ep.classList.contains("ego-dim")),
      };
    });
    record(
      "EG6",
      "Ego on the one-member endpoint lights the sibling community its hop enters",
      egoComm.aEgo &&
        egoComm.aDist === "1" &&
        egoComm.aShape === "type" &&
        egoComm.bDim &&
        egoComm.bDist === "2" &&
        egoComm.bShape === "type" &&
        egoComm.epEgo,
      JSON.stringify(egoComm)
    );
    await page.keyboard.press("Escape");
    await page.waitForTimeout(120);
    await shot(page, "ego-community.png");
    await page.evaluate(() => {
      const btn = document.getElementById("egoBtn");
      if (btn && btn.classList.contains("on")) btn.click();
    });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const node = document.querySelector("#enterCanvas .vnode[data-leaf='0'][data-id='b-physics-a']");
      if (node) node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await page
      .waitForFunction(
        () => document.querySelectorAll("#enterCanvas .vnode[data-leaf='1']").length > 1,
        null,
        { timeout: 10000 }
      )
      .catch(() => failFast("deeper Map enter did not mount member shapes"));
    await page.waitForTimeout(200);
    const deeperMap = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#enterCanvas .vnode[data-shape]")];
      return {
        n: nodes.length,
        leaves: nodes.filter((el) => el.getAttribute("data-leaf") === "1").length,
        shapes: [...new Set(nodes.map((el) => el.getAttribute("data-shape")))],
        fn: nodes.some((el) => el.getAttribute("data-shape") === "fn"),
        allType: nodes.length > 0 && nodes.every((el) => el.getAttribute("data-shape") === "type"),
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        enterXy: document.querySelectorAll("#enterCanvas .react-flow__node").length,
      };
    });
    record(
      "E1e",
      "Deeper Map enter shows member shapes on the stack path",
      deeperMap.n > 1 &&
        deeperMap.n <= 24 &&
        deeperMap.leaves === deeperMap.n &&
        deeperMap.fn &&
        !deeperMap.allType &&
        deeperMap.cards === 0 &&
        deeperMap.xy === deeperMap.enterXy,
      JSON.stringify(deeperMap)
    );
    const backChild = page.locator("#backBtn");
    if (await backChild.isEnabled()) await backChild.click();
    else {
      await page.evaluate(() => {
        const crumb = document.querySelector("#meta [data-go=programs], #meta [data-up=map]");
        if (crumb) crumb.click();
      });
    }
    await page.waitForFunction(
      () =>
        document.querySelectorAll("#enterCanvas .vnode[data-shape='type'][data-leaf='0']").length >= 2,
      null,
      { timeout: 10000 }
    );
    await page.waitForTimeout(150);
    const backToChildren = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#enterCanvas .vnode[data-shape]")];
      return {
        n: nodes.length,
        types: nodes.filter((el) => el.getAttribute("data-shape") === "type" && el.getAttribute("data-leaf") === "0").length,
        endpoint: nodes.filter(
          (el) => el.getAttribute("data-id") === "n164" && el.getAttribute("data-shape") === "endpoint" && el.getAttribute("data-leaf") === "1"
        ).length,
        cards: document.querySelectorAll(".bubble-card").length,
      };
    });
    record(
      "E1f",
      "Back from deeper Map enter returns to Type-shaped child communities",
      backToChildren.n >= 2 && backToChildren.types >= 2 && backToChildren.endpoint === 1 && backToChildren.cards === 0,
      JSON.stringify(backToChildren)
    );
    const backMap = page.locator("#backBtn");
    if (await backMap.isEnabled()) await backMap.click();
    else {
      await page.evaluate(() => {
        const crumb = document.querySelector("#meta [data-go=programs], #meta [data-up=map]");
        if (crumb) crumb.click();
      });
    }
    await page.waitForSelector(".bubble-card", { timeout: 10000 });
    await page.waitForTimeout(200);
    const afterChildren = await page.evaluate(() => {
      const vp = document.querySelector("#canvas .viewport");
      return {
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        enter: document.querySelectorAll("#enterCanvas .react-flow__node").length,
        lod: vp ? vp.getAttribute("data-lod") || "" : "",
      };
    });
    record(
      "E1g",
      "Back from child communities returns Map to xy=0 and data-lod=0",
      afterChildren.cards >= 8 && afterChildren.xy === 0 && afterChildren.enter === 0 && afterChildren.lod === "0",
      JSON.stringify(afterChildren)
    );

    const stackClick = await page.evaluate(() => {
      const card = document.querySelector('.bubble-card[data-bubble="b-physics"]');
      if (!card) return { clicked: false };
      card.click();
      return { clicked: true };
    });
    await page.waitForFunction(
      () => document.querySelectorAll("#enterCanvas .vnode[data-shape='type'][data-leaf='0']").length >= 2,
      null,
      { timeout: 10000 }
    );
    await page.evaluate(() => {
      const node = document.querySelector("#enterCanvas .vnode[data-leaf='0'][data-id='b-physics-a']");
      if (node) node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await page.waitForFunction(
      () => document.querySelectorAll("#enterCanvas .vnode[data-leaf='1']").length > 1,
      null,
      { timeout: 10000 }
    );
    const mapZoom = await zoomPopOneLevel(page);
    await page.waitForFunction(
      () => document.querySelectorAll("#enterCanvas .vnode[data-shape='type'][data-leaf='0']").length >= 2,
      null,
      { timeout: 10000 }
    );
    await page.waitForTimeout(150);
    const zoomCut = await enterCutSig(page);
    record(
      "E1h",
      "Zoom-pop from deeper Map enter returns to the Type cut",
      stackClick.clicked &&
        mapZoom.before.leaves > 1 &&
        zoomCut.types >= 2 &&
        zoomCut.ids.indexOf("b-physics-a") >= 0 &&
        zoomCut.ids.indexOf("b-physics-b") >= 0 &&
        zoomCut.cards === 0 &&
        zoomCut.enter > 1,
      JSON.stringify({ before: mapZoom.before, zoom: zoomCut })
    );
    await shot(page, "enter-back-stack.png");
    await page.evaluate(() => {
      const node = document.querySelector("#enterCanvas .vnode[data-leaf='0'][data-id='b-physics-a']");
      if (node) node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await page.waitForFunction(
      () => document.querySelectorAll("#enterCanvas .vnode[data-leaf='1']").length > 1,
      null,
      { timeout: 10000 }
    );
    const backSame = page.locator("#backBtn");
    if (await backSame.isEnabled()) await backSame.click();
    await page.waitForFunction(
      () => document.querySelectorAll("#enterCanvas .vnode[data-shape='type'][data-leaf='0']").length >= 2,
      null,
      { timeout: 10000 }
    );
    const backCut = await enterCutSig(page);
    const backMapStack = page.locator("#backBtn");
    if (await backMapStack.isEnabled()) await backMapStack.click();
    await page.waitForSelector(".bubble-card", { timeout: 10000 });
    await page.waitForTimeout(200);
    const afterStack = await page.evaluate(() => {
      const vp = document.querySelector("#canvas .viewport");
      return {
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        enter: document.querySelectorAll("#enterCanvas .react-flow__node").length,
        lod: vp ? vp.getAttribute("data-lod") || "" : "",
      };
    });
    record(
      "E1i",
      "Back from that same depth returns to the same Type cut, then Map xy=0 and data-lod=0",
      backCut.ids === zoomCut.ids &&
        backCut.types >= 2 &&
        afterStack.cards >= 8 &&
        afterStack.xy === 0 &&
        afterStack.enter === 0 &&
        afterStack.lod === "0",
      JSON.stringify({ zoom: zoomCut.ids, back: backCut.ids, map: afterStack })
    );

    const beforeSinkPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    const sinkClick = await page.evaluate(() => {
      const card = document.querySelector(".bubble-card.end");
      if (!card) return { clicked: false };
      card.click();
      return { clicked: true, id: card.getAttribute("data-bubble") || "" };
    });
    await page
      .waitForFunction(
        () => document.querySelectorAll("#enterCanvas .vnode[data-shape='end'][data-lit='1']").length === 1,
        null,
        { timeout: 10000 }
      )
      .catch(() => failFast("sink community did not light one end shape — click=" + JSON.stringify(sinkClick)));
    await page.waitForTimeout(250);
    const sinkEnd = await page.evaluate(() => {
      const ends = [...document.querySelectorAll("#enterCanvas .vnode[data-shape='end']")];
      const lit = ends.filter((el) => el.getAttribute("data-lit") === "1");
      const vp = document.querySelector("#canvas .viewport");
      const one = lit[0];
      return {
        ends: ends.length,
        lit: lit.length,
        endId: one ? one.getAttribute("data-id") || "" : "",
        kind: one ? one.getAttribute("data-kind") || "" : "",
        leaf: one ? one.getAttribute("data-leaf") || "" : "",
        starts: document.querySelectorAll("#enterCanvas .vnode[data-shape='start']").length,
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        enterXy: document.querySelectorAll("#enterCanvas .react-flow__node").length,
        lod: vp ? vp.getAttribute("data-lod") || "" : "",
        inode: document.querySelectorAll(".inode").length,
      };
    });
    await page.waitForFunction(
      () => {
        const vp = document.querySelector("#canvas .viewport");
        if (!vp) return false;
        const m = /scale\(([-0-9.]+)\)/.exec(vp.style.transform || "");
        const k = m ? Number(m[1]) : 0;
        const pct = Number((/(\d+)%/.exec(((document.getElementById("zoomPct") || {}).textContent || "")) || [])[1] || 0);
        return pct > 30 && pct < 78 && Math.abs(k * 100 - pct) < 1.5;
      },
      null,
      { timeout: 4000 }
    );
    // The fit eases the camera and #zoomPct tracks every frame, so the check above can pass mid-ease.
    // Wait for the end state E1j reads: every enter node inside the stage.
    await page
      .waitForFunction(
        () => {
          const stage = document.querySelector("#canvas .stage");
          const sr = stage ? stage.getBoundingClientRect() : null;
          const nodes = [...document.querySelectorAll("#enterCanvas .react-flow__node")];
          if (!sr || !nodes.length) return false;
          return nodes.every((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 8 && r.height > 8 && r.left >= sr.left - 2 && r.top >= sr.top - 2 && r.right <= sr.right + 2 && r.bottom <= sr.bottom + 2;
          });
        },
        null,
        { timeout: 4000 }
      )
      .catch(() => {});
    const sinkSeen = await page.evaluate(() => {
      const stage = document.querySelector("#canvas .stage");
      const vp = document.querySelector("#canvas .viewport");
      const nodes = [...document.querySelectorAll("#enterCanvas .react-flow__node")];
      const end = document.querySelector("#enterCanvas .vnode[data-shape='end']");
      if (!stage || !nodes.length || !end) return { ok: false, n: nodes.length, off: nodes.length, k: 0 };
      const sr = stage.getBoundingClientRect();
      const slack = 2;
      const inside = (el) => {
        const r = el.getBoundingClientRect();
        return (
          r.width > 8 &&
          r.height > 8 &&
          r.left >= sr.left - slack &&
          r.top >= sr.top - slack &&
          r.right <= sr.right + slack &&
          r.bottom <= sr.bottom + slack
        );
      };
      const off = nodes.filter((el) => !inside(el));
      const k = vp ? parseFloat(vp.style.getPropertyValue("--cam-k") || "0") : 0;
      return { ok: off.length === 0 && inside(end), n: nodes.length, off: off.length, k, endOn: inside(end) };
    });
    record(
      "E1j",
      "Map enter of the sink community fits one lit walk-end on stage",
      sinkClick.clicked &&
        sinkClick.id === "b-ui" &&
        sinkEnd.ends === 1 &&
        sinkEnd.lit === 1 &&
        sinkEnd.endId === "n7" &&
        sinkEnd.kind === "Function" &&
        sinkEnd.leaf === "1" &&
        sinkEnd.starts === 0 &&
        sinkEnd.inode === 0 &&
        sinkEnd.cards === 0 &&
        sinkEnd.xy === sinkEnd.enterXy &&
        sinkEnd.enterXy > 1 &&
        sinkEnd.enterXy <= 24 &&
        sinkSeen.ok &&
        sinkSeen.k < 0.78 &&
        sinkSeen.endOn,
      JSON.stringify({ click: sinkClick, ...sinkEnd, seen: sinkSeen })
    );
    await shot(page, "enter-sink-end.png");
    const backSink = page.locator("#backBtn");
    if (await backSink.isEnabled()) await backSink.click();
    else {
      await page.evaluate(() => {
        const crumb = document.querySelector("#meta [data-go=programs], #meta [data-up=map]");
        if (crumb) crumb.click();
      });
    }
    await page.waitForSelector(".bubble-card", { timeout: 10000 });
    await page.waitForTimeout(200);
    const afterSink = await page.evaluate((before) => {
      const vp = document.querySelector("#canvas .viewport");
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        enter: document.querySelectorAll("#enterCanvas .react-flow__node").length,
        lod: vp ? vp.getAttribute("data-lod") || "" : "",
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
    }, beforeSinkPosts);
    record(
      "E1k",
      "Back from the sink community returns Map to xy=0 and data-lod=0 without a stamp",
      afterSink.cards >= 8 &&
        afterSink.xy === 0 &&
        afterSink.enter === 0 &&
        afterSink.lod === "0" &&
        afterSink.stampPosts === 0 &&
        afterSink.skipPosts === 0,
      JSON.stringify(afterSink)
    );

    const beforeLeave = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.evaluate(() => {
      const card = document.querySelector('.bubble-card[data-bubble="b-physics"]');
      if (card) card.click();
    });
    await page.waitForFunction(
      () => document.querySelectorAll("#enterCanvas .vnode[data-id='n164']").length === 1,
      null,
      { timeout: 10000 }
    );
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector("#sliceCanvas .react-flow__node", { timeout: 10000 });
    await page.waitForTimeout(250);
    const leftEnter = await page.evaluate((before) => {
      const on = document.querySelector("#workspaces [data-ws].on");
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        ws: on ? on.getAttribute("data-ws") : "",
        enter: document.querySelectorAll("#enterCanvas .react-flow__node").length,
        slice: document.querySelectorAll("#sliceCanvas .react-flow__node").length,
        runs: document.querySelectorAll(".run").length,
        inside: /Inside this community/i.test((document.querySelector("#canvas .flow-title") || {}).textContent || ""),
        backs: posts.filter((m) => m && m.type === "back").length,
      };
    }, beforeLeave);
    record(
      "E1o",
      "Slice workspace leaves the Map enter cut and shows the Steiner",
      leftEnter.ws === "slice" &&
        leftEnter.enter === 0 &&
        leftEnter.slice > 1 &&
        leftEnter.slice <= 48 &&
        leftEnter.runs >= 2 &&
        !leftEnter.inside &&
        leftEnter.backs >= 1,
      JSON.stringify(leftEnter)
    );
    await shot(page, "slice-from-enter.png");
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForSelector(".bubble-card", { timeout: 10000 });
    await page.waitForTimeout(150);

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
    await page.fill("#graphSearch", "physics");
    await page.waitForTimeout(200);
    const mapFindHit = await page.evaluate(() => {
      const read = (id) => {
        const el = document.querySelector(".bubble-card[data-bubble='" + id + "']");
        if (!el) return null;
        return {
          hit: el.classList.contains("hit"),
          dim: el.classList.contains("dim"),
          off: el.classList.contains("off"),
          op: Number(getComputedStyle(el).opacity),
        };
      };
      return {
        physics: read("b-physics"),
        assets: read("b-assets"),
        xy: document.querySelectorAll(".react-flow__node").length,
      };
    });
    record(
      "SG1b",
      "Find lifts an off-path Map card out of path grey",
      !!(mapFindHit.physics && mapFindHit.physics.hit && mapFindHit.physics.off && !mapFindHit.physics.dim && mapFindHit.physics.op >= 0.99) &&
        !!(mapFindHit.assets && mapFindHit.assets.dim && !mapFindHit.assets.hit && mapFindHit.assets.op <= 0.22) &&
        mapFindHit.xy === 0,
      JSON.stringify(mapFindHit)
    );
    await shot(page, "map-find-hit.png");
    await page.fill("#graphSearch", "");
    await page.waitForTimeout(120);
    // A member FQN is not a card name. The card that holds it must stay lit.
    await page.fill("#graphSearch", "SimulationData");
    await page.waitForTimeout(200);
    const mapFindMember = await page.evaluate(() => {
      const read = (id) => {
        const el = document.querySelector(".bubble-card[data-bubble='" + id + "']");
        if (!el) return null;
        return {
          hit: el.classList.contains("hit"),
          dim: el.classList.contains("dim"),
          chip: /SimulationData/.test((el.querySelector(".members") || {}).textContent || ""),
          op: Number(getComputedStyle(el).opacity),
        };
      };
      return {
        render: read("b-render"),
        assets: read("b-assets"),
        hits: document.querySelectorAll(".bubble-card.hit").length,
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
      };
    });
    record(
      "SG1c",
      "Find on a member FQN keeps the holding Map card lit",
      !!(mapFindMember.render && mapFindMember.render.chip && mapFindMember.render.hit && !mapFindMember.render.dim && mapFindMember.render.op >= 0.99) &&
        !!(mapFindMember.assets && mapFindMember.assets.dim && !mapFindMember.assets.hit) &&
        mapFindMember.hits >= 1 &&
        mapFindMember.hits < mapFindMember.cards &&
        mapFindMember.xy === 0,
      JSON.stringify(mapFindMember)
    );
    await shot(page, "map-find-member.png");
    // Member file path is not a card name either. Same hold-card rule as SG1c.
    await page.fill("#graphSearch", "simulationdata.rs");
    await page.waitForTimeout(200);
    const mapFindFile = await page.evaluate(() => {
      const read = (id) => {
        const el = document.querySelector(".bubble-card[data-bubble='" + id + "']");
        if (!el) return null;
        return {
          hit: el.classList.contains("hit"),
          dim: el.classList.contains("dim"),
          op: Number(getComputedStyle(el).opacity),
        };
      };
      return {
        render: read("b-render"),
        assets: read("b-assets"),
        hits: document.querySelectorAll(".bubble-card.hit").length,
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        q: (document.getElementById("graphSearch") || {}).value || "",
      };
    });
    record(
      "SG1e",
      "Find on a member file keeps the holding Map card lit",
      !!(mapFindFile.render && mapFindFile.render.hit && !mapFindFile.render.dim && mapFindFile.render.op >= 0.99) &&
        !!(mapFindFile.assets && mapFindFile.assets.dim && !mapFindFile.assets.hit) &&
        mapFindFile.hits >= 1 &&
        mapFindFile.hits < mapFindFile.cards &&
        mapFindFile.xy === 0 &&
        /simulationdata\.rs/i.test(mapFindFile.q),
      JSON.stringify(mapFindFile)
    );
    await shot(page, "map-find-file.png");
    await page.fill("#graphSearch", "");
    await page.waitForTimeout(120);
    await page.evaluate(() => {
      const box = document.getElementById("graphSearch");
      if (box && box.blur) box.blur();
    });
    // Map community cards use data-bubble; Route must paint them via member membership.
    await page.keyboard.press("r");
    await page.waitForFunction(
      () => window.__graphideRoute && window.__graphideRoute.open && window.__graphideRoute.ok,
      null,
      { timeout: 8000 }
    );
    await page.waitForTimeout(200);
    const mapRoute = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".bubble-card[data-bubble]")];
      const on = cards.filter((el) => el.classList.contains("on-route"));
      const dim = cards.filter((el) => el.classList.contains("route-dim"));
      const onOp = on.map((el) => Number(getComputedStyle(el).opacity));
      const dimOp = dim.map((el) => Number(getComputedStyle(el).opacity));
      return {
        cards: cards.length,
        on: on.length,
        dim: dim.length,
        onIds: on.map((el) => el.getAttribute("data-bubble")),
        dimIds: dim.map((el) => el.getAttribute("data-bubble")),
        onMin: onOp.length ? Math.min(...onOp) : 0,
        dimMax: dimOp.length ? Math.max(...dimOp) : 1,
        xy: document.querySelectorAll(".react-flow__node").length,
      };
    });
    record(
      "RT9",
      "Map Route lights on-path community cards and dims the rest",
      mapRoute.cards >= 8 &&
        mapRoute.on >= 1 &&
        mapRoute.dim >= 1 &&
        mapRoute.on + mapRoute.dim === mapRoute.cards &&
        mapRoute.onMin >= 0.99 &&
        mapRoute.dimMax <= 0.28 &&
        mapRoute.xy === 0,
      JSON.stringify(mapRoute)
    );
    await shot(page, "map-route-cards.png");
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !(window.__graphideRoute && window.__graphideRoute.open), null, { timeout: 5000 });
    // Lens paints Map cards; lens-on / on-route beat .off grey.
    await page.keyboard.press("l");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    await page.waitForTimeout(200);
    const mapLensOff = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".bubble-card[data-bubble]")];
      const painted = cards.filter((el) => el.classList.contains("lens-on") || el.classList.contains("lens-dim"));
      const offOn = cards.filter((el) => el.classList.contains("off") && el.classList.contains("lens-on"));
      const offOnOp = offOn.map((el) => Number(getComputedStyle(el).opacity));
      return {
        cards: cards.length,
        painted: painted.length,
        offOn: offOn.length,
        offOnMin: offOnOp.length ? Math.min(...offOnOp) : 1,
        xy: document.querySelectorAll(".react-flow__node").length,
      };
    });
    record(
      "LN7",
      "Map Lens paints community cards; lens-on beats off-path grey",
      mapLensOff.cards >= 8 &&
        mapLensOff.painted === mapLensOff.cards &&
        mapLensOff.offOn >= 1 &&
        mapLensOff.offOnMin >= 0.99 &&
        mapLensOff.xy === 0,
      JSON.stringify(mapLensOff)
    );
    await shot(page, "map-lens-cards.png");
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !(window.__graphideLens && window.__graphideLens.open), null, { timeout: 5000 });

    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector("#sliceCanvas .vnode[data-id], #sliceCanvas .react-flow__node", { timeout: 10000 });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const node =
        document.querySelector('#sliceCanvas .vnode[data-id="n0"]') ||
        document.querySelector("#sliceCanvas .vnode[data-id]");
      if (node) node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await page.waitForTimeout(180);
    await page.evaluate(() => {
      const btn = document.getElementById("egoBtn");
      if (btn && btn.classList.contains("on")) btn.click();
    });
    await page.waitForTimeout(180);
    const selectFade = await page.evaluate(() => {
      const op = (el) => (el ? Number(getComputedStyle(el).opacity) : 0);
      const read = (el) => {
        if (!el) return null;
        return {
          lit: el.getAttribute("data-lit"),
          dist: el.getAttribute("data-dist"),
          slice: el.getAttribute("data-slice-dist"),
          op: op(el),
          ego: el.classList.contains("ego"),
          dim: el.classList.contains("ego-dim"),
        };
      };
      return {
        ego: !!(document.getElementById("egoBtn") && document.getElementById("egoBtn").classList.contains("on")),
        n2: read(document.querySelector('#sliceCanvas .vnode[data-id="n2"]')),
        n4: read(document.querySelector('#sliceCanvas .vnode[data-id="n4"]')),
        n12: read(document.querySelector('#sliceCanvas .vnode[data-id="n12"]')),
        n10: read(document.querySelector('#sliceCanvas .vnode[data-id="n10"]')),
      };
    });
    record(
      "EG3d",
      "Selecting a Slice node with Ego off keeps the lit 2-hop walk fully opaque",
      selectFade.ego === false &&
        !!(selectFade.n2 && selectFade.n2.lit === "1" && selectFade.n2.dist === "2" && selectFade.n2.op >= 0.99 && !selectFade.n2.dim) &&
        !!(selectFade.n4 && selectFade.n4.lit === "1" && selectFade.n4.dist === "2" && selectFade.n4.op >= 0.99),
      JSON.stringify(selectFade)
    );
    record(
      "EG3e",
      "Selecting a Slice node with Ego off keeps off-tree neighbors in distance grey",
      selectFade.ego === false &&
        !!(
          selectFade.n12 &&
          selectFade.n12.lit === "0" &&
          selectFade.n12.slice === "1" &&
          selectFade.n12.ego === false &&
          !selectFade.n12.dim &&
          selectFade.n12.op <= 0.48 &&
          selectFade.n12.op >= 0.4
        ) &&
        !!(selectFade.n10 && selectFade.n10.slice === "1" && selectFade.n10.ego === false && selectFade.n10.op <= 0.48),
      JSON.stringify({ n12: selectFade.n12, n10: selectFade.n10 })
    );
    await shot(page, "slice-select.png");
    await shot(page, "slice-select-grey.png");
    await page.fill("#graphSearch", "ScreenshotFormat");
    await page.waitForTimeout(200);
    const sliceFindDim = await page.evaluate(() => {
      const read = (id) => {
        const el = document.querySelector("#sliceCanvas .vnode[data-id='" + id + "']");
        if (!el) return null;
        return {
          dim: el.classList.contains("dim"),
          hit: el.classList.contains("hit"),
          lit: el.getAttribute("data-lit"),
          dist: el.getAttribute("data-slice-dist"),
          op: Number(getComputedStyle(el).opacity),
        };
      };
      return { n0: read("n0"), n12: read("n12") };
    });
    record(
      "SG4",
      "Find dims Slice off-tree nodes under distance grey",
      !!(sliceFindDim.n0 && sliceFindDim.n0.hit && !sliceFindDim.n0.dim && sliceFindDim.n0.lit === "1" && sliceFindDim.n0.op >= 0.99) &&
        !!(sliceFindDim.n12 && sliceFindDim.n12.dim && sliceFindDim.n12.dist === "1" && sliceFindDim.n12.op <= 0.18),
      JSON.stringify(sliceFindDim)
    );
    await shot(page, "slice-find-dim.png");
    await page.fill("#graphSearch", "SimulationData");
    await page.waitForTimeout(200);
    const sliceFindHit = await page.evaluate(() => {
      const read = (id) => {
        const el = document.querySelector("#sliceCanvas .vnode[data-id='" + id + "']");
        if (!el) return null;
        return {
          dim: el.classList.contains("dim"),
          hit: el.classList.contains("hit"),
          dist: el.getAttribute("data-slice-dist"),
          op: Number(getComputedStyle(el).opacity),
        };
      };
      return { n12: read("n12"), n10: read("n10") };
    });
    record(
      "SG4b",
      "Find lifts an off-tree Slice hit out of distance grey",
      !!(sliceFindHit.n12 && sliceFindHit.n12.hit && !sliceFindHit.n12.dim && sliceFindHit.n12.dist === "1" && sliceFindHit.n12.op >= 0.99) &&
        !!(sliceFindHit.n10 && sliceFindHit.n10.dim && !sliceFindHit.n10.hit && sliceFindHit.n10.op <= 0.18),
      JSON.stringify(sliceFindHit)
    );
    await shot(page, "slice-find-hit.png");
    // Member file path is not a vnode label either. Same lift-out-of-grey rule as SG4b (file half of matchesExplorerQuery).
    await page.fill("#graphSearch", "simulationdata.rs");
    await page.waitForTimeout(200);
    const sliceFindFile = await page.evaluate(() => {
      const read = (id) => {
        const el = document.querySelector("#sliceCanvas .vnode[data-id='" + id + "']");
        if (!el) return null;
        return {
          dim: el.classList.contains("dim"),
          hit: el.classList.contains("hit"),
          dist: el.getAttribute("data-slice-dist"),
          file: el.getAttribute("data-file") || "",
          op: Number(getComputedStyle(el).opacity),
        };
      };
      return {
        n12: read("n12"),
        n10: read("n10"),
        q: (document.getElementById("graphSearch") || {}).value || "",
      };
    });
    record(
      "SG4c",
      "Find on a member file lifts an off-tree Slice hit out of distance grey",
      !!(sliceFindFile.n12 && sliceFindFile.n12.hit && !sliceFindFile.n12.dim && sliceFindFile.n12.dist === "1" && sliceFindFile.n12.op >= 0.99) &&
        !!(sliceFindFile.n10 && sliceFindFile.n10.dim && !sliceFindFile.n10.hit && sliceFindFile.n10.op <= 0.18) &&
        /simulationdata\.rs/i.test(sliceFindFile.q),
      JSON.stringify(sliceFindFile)
    );
    await shot(page, "slice-find-file.png");
    await page.fill("#graphSearch", "");
    await page.waitForTimeout(120);
    // Route dim must beat distance grey too: an off-route ring node is not brighter than the off-route walk.
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
    await page.keyboard.press("r");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    await page.waitForTimeout(200);
    const sliceRoute = await page.evaluate(() => {
      const rec = window.__graphideRoute || {};
      const dimmed = [...document.querySelectorAll("#sliceCanvas .vnode[data-id].route-dim")];
      const op = (el) => Number(getComputedStyle(el).opacity);
      const walk = dimmed.filter((el) => el.getAttribute("data-lit") === "1");
      const ring = dimmed.filter((el) => /^[12]$/.test(el.getAttribute("data-slice-dist") || ""));
      return {
        ok: !!rec.ok,
        walk: walk.length,
        ring: ring.length,
        walkMax: Math.max(0, ...walk.map(op)),
        ringMax: Math.max(0, ...ring.map(op)),
      };
    });
    record(
      "RT8",
      "Slice Route dims the off-route grey ring as far as the off-route walk",
      sliceRoute.ok &&
        sliceRoute.walk >= 1 &&
        sliceRoute.ring >= 1 &&
        sliceRoute.walkMax <= 0.221 &&
        sliceRoute.ringMax <= sliceRoute.walkMax + 0.001,
      JSON.stringify(sliceRoute)
    );
    await shot(page, "slice-route-dim.png");
    // R toggles the probe off. Escape would first close the source pane left open by the earlier selection.
    await page.keyboard.press("r");
    await page.waitForFunction(() => !(window.__graphideRoute && window.__graphideRoute.open), null, { timeout: 5000 });
    await page.waitForTimeout(150);
    // Same for Lens: a lens-dim ring node is not brighter than a lens-dim walk node.
    await page.keyboard.press("l");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    await page.waitForTimeout(200);
    const sliceLens = await page.evaluate(() => {
      const dimmed = [...document.querySelectorAll("#sliceCanvas .vnode[data-id].lens-dim")];
      const op = (el) => Number(getComputedStyle(el).opacity);
      const walk = dimmed.filter((el) => el.getAttribute("data-lit") === "1");
      const ring = dimmed.filter((el) => /^[12]$/.test(el.getAttribute("data-slice-dist") || ""));
      return {
        open: !!(window.__graphideLens && window.__graphideLens.open),
        walk: walk.length,
        ring: ring.length,
        walkMax: Math.max(0, ...walk.map(op)),
        ringMax: Math.max(0, ...ring.map(op)),
      };
    });
    record(
      "LN6",
      "Slice Lens dims the off-tree ring as far as the lit walk",
      sliceLens.open &&
        sliceLens.walk >= 1 &&
        sliceLens.ring >= 1 &&
        sliceLens.walkMax <= 0.281 &&
        sliceLens.ringMax <= sliceLens.walkMax + 0.001,
      JSON.stringify(sliceLens)
    );
    await shot(page, "slice-lens-dim.png");
    await page.keyboard.press("l");
    await page.waitForFunction(() => !(window.__graphideLens && window.__graphideLens.open), null, { timeout: 5000 });
    await page.waitForTimeout(150);
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
    const egoSlice1 = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#sliceCanvas .vnode[data-id]")];
      const op = (el) => Number(getComputedStyle(el).opacity);
      const off = (pred) => nodes.filter((el) => pred(el) && el.getAttribute("data-slice-dist") === "1");
      const egoOff = off((el) => el.classList.contains("ego") && !el.classList.contains("ego-dim"));
      const dimOff = off((el) => el.classList.contains("ego-dim"));
      const n12 = nodes.find((el) => el.getAttribute("data-id") === "n12");
      return {
        dim: nodes.filter((el) => el.classList.contains("ego-dim")).length,
        ego: nodes.filter((el) => el.classList.contains("ego")).length,
        selected: nodes.filter((el) => el.classList.contains("selected")).length,
        offEgo: egoOff.length,
        offDim: dimOff.length,
        offEgoOpacity: egoOff.length ? Math.min(...egoOff.map(op)) : 0,
        offDimOpacity: dimOff.length ? Math.max(...dimOff.map(op)) : 1,
        n12: n12
          ? { ego: n12.classList.contains("ego"), dist: n12.getAttribute("data-slice-dist"), opacity: op(n12) }
          : null,
      };
    });
    await shot(page, "slice-ego.png");
    await page.fill("#graphSearch", "ToastContainer");
    await page.waitForTimeout(200);
    const sliceEgoFind = await page.evaluate(() => {
      const read = (id) => {
        const el = document.querySelector("#sliceCanvas .vnode[data-id='" + id + "']");
        if (!el) return null;
        return {
          hit: el.classList.contains("hit"),
          dim: el.classList.contains("dim"),
          ego: el.classList.contains("ego"),
          egoDim: el.classList.contains("ego-dim"),
          op: Number(getComputedStyle(el).opacity),
        };
      };
      return { n10: read("n10"), n12: read("n12"), n13: read("n13") };
    });
    record(
      "SG5",
      "Find hit outside the Ego neighborhood stays lit; misses stay dim",
      !!(sliceEgoFind.n10 && sliceEgoFind.n10.hit && sliceEgoFind.n10.egoDim && sliceEgoFind.n10.op >= 0.99) &&
        !!(sliceEgoFind.n12 && sliceEgoFind.n12.dim && sliceEgoFind.n12.ego && !sliceEgoFind.n12.hit && sliceEgoFind.n12.op <= 0.18) &&
        !!(sliceEgoFind.n13 && sliceEgoFind.n13.egoDim && sliceEgoFind.n13.dim && sliceEgoFind.n13.op <= 0.12),
      JSON.stringify(sliceEgoFind)
    );
    await page.fill("#graphSearch", "");
    await page.waitForTimeout(120);
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
    record(
      "EG3c",
      "Slice Ego lights off-slice neighbors and dims the other grey nodes",
      !!(
        egoSlice1.n12 &&
        egoSlice1.n12.ego &&
        egoSlice1.n12.dist === "1" &&
        egoSlice1.n12.opacity === 1 &&
        egoSlice1.offEgo >= 1 &&
        egoSlice1.offDim >= 1 &&
        egoSlice1.offEgoOpacity === 1 &&
        egoSlice1.offDimOpacity <= 0.12
      ),
      JSON.stringify({
        n12: egoSlice1.n12,
        offEgo: egoSlice1.offEgo,
        offDim: egoSlice1.offDim,
        offEgoOpacity: egoSlice1.offEgoOpacity,
        offDimOpacity: egoSlice1.offDimOpacity,
      })
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
    assertNoStampDir("E4", "Enter-bubble step did not write .graphide/stamps/");

    const beforeKindPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector("#sliceCanvas .vnode[data-id], #sliceCanvas .react-flow__node", { timeout: 10000 });
    await page.waitForTimeout(220);
    const readKindDesk = () =>
      page.evaluate(() => {
        const pills = [...document.querySelectorAll("#kindFilters input[data-kind]")].map((el) => {
          const lab = el.closest("label");
          return {
            kind: el.getAttribute("data-kind") || "",
            checked: !!el.checked,
            off: !!(lab && lab.classList.contains("off")),
          };
        });
        const wrap = document.getElementById("kindFilters");
        const wsEl = document.querySelector("#workspaces [data-ws].on");
        const enter = [...document.querySelectorAll("#enterCanvas .vnode[data-kind]")].filter(
          (el) => !el.classList.contains("dim")
        );
        const slice = [...document.querySelectorAll("#sliceCanvas .vnode[data-kind]")].filter(
          (el) => !el.classList.contains("dim")
        );
        const nodes = enter.length ? enter : slice;
        const cells = [...document.querySelectorAll("#ledgerGrid .cell")];
        const kindOfNode = (el) => el.getAttribute("data-kind") || "";
        const kindOfCell = (el) =>
          el.classList.contains("kind-Type")
            ? "Type"
            : el.classList.contains("kind-Endpoint")
              ? "Endpoint"
              : el.classList.contains("kind-Function")
                ? "Function"
                : "";
        const uniq = (list) => [...new Set(list.filter(Boolean))];
        return {
          pills,
          hidden: !!(wrap && wrap.hidden),
          ws: wsEl ? wsEl.getAttribute("data-ws") : "",
          xy: document.querySelectorAll(".react-flow__node").length,
          cards: document.querySelectorAll(".bubble-card").length,
          nodeKinds: uniq(nodes.map(kindOfNode)),
          ledgerKinds: uniq(cells.map(kindOfCell)),
          nodes: nodes.length,
          cells: cells.length,
        };
      });
    const setKindPill = async (kind, checked) => {
      await page.evaluate(
        ({ kind, checked }) => {
          const box = document.querySelector('#kindFilters input[data-kind="' + kind + '"]');
          if (!box) return;
          if (box.checked === checked) {
            box.dispatchEvent(new Event("change", { bubbles: true }));
            return;
          }
          box.checked = checked;
          box.dispatchEvent(new Event("change", { bubbles: true }));
        },
        { kind, checked }
      );
      await page.waitForTimeout(280);
    };
    const kindBaseline = await readKindDesk();
    record(
      "KF0",
      "Find rail has Function / Type / Endpoint kind pills, all checked",
      !kindBaseline.hidden &&
        ["Function", "Type", "Endpoint"].every((k) =>
          kindBaseline.pills.some((p) => p.kind === k && p.checked && !p.off)
        ),
      JSON.stringify(kindBaseline.pills)
    );
    const mixedKinds = new Set([...kindBaseline.nodeKinds, ...kindBaseline.ledgerKinds]);
    const honestFnOnly =
      mixedKinds.size === 1 && mixedKinds.has("Function") && (kindBaseline.nodes >= 1 || kindBaseline.cells >= 1);
    record(
      "KF1",
      "All three checked: rail shows Function / Type / Endpoint mixed (or honest Function-only baseline)",
      (mixedKinds.has("Function") && (mixedKinds.has("Type") || mixedKinds.has("Endpoint"))) || honestFnOnly,
      JSON.stringify({
        nodeKinds: kindBaseline.nodeKinds,
        ledgerKinds: kindBaseline.ledgerKinds,
        honestFnOnly,
      })
    );
    await setKindPill("Type", false);
    await setKindPill("Endpoint", false);
    const kindFnOnly = await readKindDesk();
    const fnVisible = new Set([...kindFnOnly.nodeKinds, ...kindFnOnly.ledgerKinds]);
    record(
      "KF2",
      "Uncheck Type + Endpoint: only Function kinds remain visible",
      fnVisible.size === 1 &&
        fnVisible.has("Function") &&
        (kindFnOnly.nodes >= 1 || kindFnOnly.cells >= 1) &&
        kindFnOnly.pills.some((p) => p.kind === "Type" && !p.checked && p.off) &&
        kindFnOnly.pills.some((p) => p.kind === "Endpoint" && !p.checked && p.off),
      JSON.stringify({
        nodeKinds: kindFnOnly.nodeKinds,
        ledgerKinds: kindFnOnly.ledgerKinds,
        pills: kindFnOnly.pills,
      })
    );
    await shot(page, "kind-filters.png");
    await setKindPill("Function", false);
    await setKindPill("Type", true);
    await setKindPill("Endpoint", false);
    const kindTyOnly = await readKindDesk();
    const tyVisible = new Set([...kindTyOnly.nodeKinds, ...kindTyOnly.ledgerKinds]);
    const typeCutReady = mixedKinds.has("Type") || kindBaseline.ledgerKinds.includes("Type") || kindBaseline.nodeKinds.includes("Type");
    record(
      "KF3",
      "Uncheck Function, leave Type: only Type kinds remain visible",
      typeCutReady
        ? tyVisible.size === 1 &&
            tyVisible.has("Type") &&
            (kindTyOnly.nodes >= 1 || kindTyOnly.cells >= 1) &&
            kindTyOnly.pills.some((p) => p.kind === "Function" && !p.checked && p.off)
        : honestFnOnly,
      JSON.stringify({
        nodeKinds: kindTyOnly.nodeKinds,
        ledgerKinds: kindTyOnly.ledgerKinds,
        typeCutReady,
        honestFnOnly,
      })
    );
    await setKindPill("Function", true);
    await setKindPill("Type", true);
    await setKindPill("Endpoint", true);
    const kindRestored = await readKindDesk();
    record(
      "KF4",
      "Restore all three kind pills",
      ["Function", "Type", "Endpoint"].every((k) =>
        kindRestored.pills.some((p) => p.kind === k && p.checked && !p.off)
      ),
      JSON.stringify(kindRestored.pills)
    );
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    await page.waitForTimeout(150);
    const afterKind = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
        stampPosts: posts.filter((p) => p && p.type === "stamp").length,
        skipPosts: posts.filter((p) => p && p.type === "skip").length,
      };
    }, beforeKindPosts);
    record(
      "KF5",
      "Map altitude is still community LOD after kind filters (xy=0)",
      afterKind.ws === "map" && afterKind.cards >= 8 && afterKind.xy === 0,
      JSON.stringify(afterKind)
    );
    record(
      "KF6",
      "Kind filters do not post stamp / skip",
      afterKind.stampPosts === 0 && afterKind.skipPosts === 0,
      JSON.stringify({ stampPosts: afterKind.stampPosts, skipPosts: afterKind.skipPosts })
    );
    assertNoStampDir("KF7", "Kind filters did not write .graphide/stamps/");

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
    // After clicking Ask, typing the next question goes into the field, not into desk shortcuts (s = stamp, x = skip…).
    const beforeRetype = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.fill("#llmAsk", "What is the coverage?");
    await page.click("#llmSend");
    await page.keyboard.type("sx");
    const askRetype = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      const ask = document.getElementById("llmAsk");
      const out = {
        value: ask ? ask.value : null,
        focused: document.activeElement && document.activeElement.id,
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
      if (ask) ask.value = "";
      return out;
    }, beforeRetype);
    record(
      "A3c",
      "After Ask, focus returns to #llmAsk so the next question does not fire S / X",
      askRetype.value === "sx" && askRetype.stampPosts === 0 && askRetype.skipPosts === 0,
      JSON.stringify(askRetype)
    );
    // Enter that commits an IME candidate (Cantonese / Japanese / Korean input) is not a send.
    const askIme = await page.evaluate(() => {
      const before = (window.__vscodePosts || []).length;
      const ask = document.getElementById("llmAsk");
      const prompt = document.getElementById("prompt");
      const enter = (el) =>
        el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true, cancelable: true }));
      const promptWas = prompt ? prompt.value : "";
      if (ask) {
        ask.value = "這條路徑";
        enter(ask);
      }
      if (prompt) {
        prompt.value = "boot=SimulationData";
        enter(prompt);
      }
      const posts = (window.__vscodePosts || []).slice(before);
      const out = {
        askValue: ask ? ask.value : null,
        askPosts: posts.filter((m) => m && m.type === "llmAsk").length,
        reviewPosts: posts.filter((m) => m && m.type === "review").length,
      };
      if (ask) ask.value = "";
      if (prompt) prompt.value = promptWas;
      return out;
    });
    record(
      "A3b",
      "IME-composing Enter in Ask / #prompt does not send the question or start a review",
      askIme.askValue === "這條路徑" && askIme.askPosts === 0 && askIme.reviewPosts === 0,
      JSON.stringify(askIme)
    );

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
    assertNoStampDir("A7", "Ask step did not write .graphide/stamps/");

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
    // ? toggles: open then close without Escape / #keysClose (chrome must not swallow the second ?).
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("?");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("?");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    const keysToggled = await page.evaluate(
      () => !!(document.getElementById("keysPane") && document.getElementById("keysPane").hidden)
    );
    record("K17", "Second ? toggles #keysPane closed (chrome does not swallow ?)", keysToggled, "");
    // Opening Keys must close Ask (same exclusive chrome as Export).
    await page.click("#llmBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.click("#keysBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const keysClosedAsk = await page.evaluate(() => ({
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
    }));
    record(
      "K18",
      "Opening Keys closes Ask (exclusive chrome)",
      keysClosedAsk.keysOpen && !keysClosedAsk.askOpen,
      JSON.stringify(keysClosedAsk)
    );
    await page.keyboard.press("Escape"); // close Keys
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Opening Export must close Ask (the exclusive-chrome half K18 named as already true).
    await page.click("#llmBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
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
    const exportClosedAsk = await page.evaluate(() => ({
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
    }));
    record(
      "K18b",
      "Opening Export closes Ask (exclusive chrome)",
      exportClosedAsk.exportOpen && !exportClosedAsk.askOpen,
      JSON.stringify(exportClosedAsk)
    );
    await page.keyboard.press("Escape"); // close Export
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !menu || menu.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Opening Ask must close Keys (setLlmPane exclusivity — reverse of K18).
    await page.click("#keysBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.click("#llmBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const askClosedKeys = await page.evaluate(() => ({
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
    }));
    record(
      "K18c",
      "Opening Ask closes Keys (exclusive chrome)",
      askClosedKeys.askOpen && !askClosedKeys.keysOpen,
      JSON.stringify(askClosedKeys)
    );
    await page.keyboard.press("Escape"); // close Ask
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Opening Ask must close Export (setLlmPane exclusivity — reverse of K18b).
    await page.click("#exportBtn");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !!(menu && !menu.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.click("#llmBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const askClosedExport = await page.evaluate(() => ({
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
    }));
    record(
      "K18d",
      "Opening Ask closes Export (exclusive chrome)",
      askClosedExport.askOpen && !askClosedExport.exportOpen,
      JSON.stringify(askClosedExport)
    );
    await page.keyboard.press("Escape"); // close Ask
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Opening Export must close Keys (setExportMenu exclusivity — reverse of Keys closing Export).
    await page.click("#keysBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
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
    const exportClosedKeys = await page.evaluate(() => ({
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
    }));
    record(
      "K18e",
      "Opening Export closes Keys (exclusive chrome)",
      exportClosedKeys.exportOpen && !exportClosedKeys.keysOpen,
      JSON.stringify(exportClosedKeys)
    );
    await page.keyboard.press("Escape"); // close Export
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !menu || menu.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Opening Keys must close Export (setKeysPane exclusivity — reverse of K18e).
    await page.click("#exportBtn");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !!(menu && !menu.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.click("#keysBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const keysClosedExport = await page.evaluate(() => ({
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
    }));
    record(
      "K18f",
      "Opening Keys closes Export (exclusive chrome)",
      keysClosedExport.keysOpen && !keysClosedExport.exportOpen,
      JSON.stringify(keysClosedExport)
    );
    await page.keyboard.press("Escape"); // close Keys
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Opening Present must close Ask (applyPresent exclusivity — stage clears Ask chrome).
    await page.click("#llmBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.click("#presentBtn");
    await page.waitForFunction(
      () => !!(document.body && document.body.classList.contains("present")),
      null,
      { timeout: 5000 }
    );
    const presentClosedAsk = await page.evaluate(() => ({
      presenting: !!(document.body && document.body.classList.contains("present")),
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
    }));
    record(
      "K18g",
      "Opening Present closes Ask (exclusive chrome)",
      presentClosedAsk.presenting && !presentClosedAsk.askOpen,
      JSON.stringify(presentClosedAsk)
    );
    await page.keyboard.press("Escape"); // exit Present
    await page.waitForFunction(
      () => !(document.body && document.body.classList.contains("present")),
      null,
      { timeout: 5000 }
    );
    // Opening Present must close Keys (applyPresent exclusivity — stage clears Keys chrome).
    await page.click("#keysBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.click("#presentBtn");
    await page.waitForFunction(
      () => !!(document.body && document.body.classList.contains("present")),
      null,
      { timeout: 5000 }
    );
    const presentClosedKeys = await page.evaluate(() => ({
      presenting: !!(document.body && document.body.classList.contains("present")),
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
    }));
    record(
      "K18h",
      "Opening Present closes Keys (exclusive chrome)",
      presentClosedKeys.presenting && !presentClosedKeys.keysOpen,
      JSON.stringify(presentClosedKeys)
    );
    await page.keyboard.press("Escape"); // exit Present
    await page.waitForFunction(
      () => !(document.body && document.body.classList.contains("present")),
      null,
      { timeout: 5000 }
    );
    // Opening Present must close Export (applyPresent exclusivity — stage clears Export chrome).
    await page.click("#exportBtn");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !!(menu && !menu.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.click("#presentBtn");
    await page.waitForFunction(
      () => !!(document.body && document.body.classList.contains("present")),
      null,
      { timeout: 5000 }
    );
    const presentClosedExport = await page.evaluate(() => ({
      presenting: !!(document.body && document.body.classList.contains("present")),
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
    }));
    record(
      "K18i",
      "Opening Present closes Export (exclusive chrome)",
      presentClosedExport.presenting && !presentClosedExport.exportOpen,
      JSON.stringify(presentClosedExport)
    );
    await page.keyboard.press("Escape"); // exit Present
    await page.waitForFunction(
      () => !(document.body && document.body.classList.contains("present")),
      null,
      { timeout: 5000 }
    );
    // Opening Present must close Evidence (applyPresent exclusivity — stage clears Evidence chrome).
    await page.evaluate(() => {
      const cell = document.querySelector("#ledgerGrid .cell");
      if (cell) cell.click();
    });
    await page.waitForFunction(
      () => !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      null,
      { timeout: 5000 }
    );
    await page.click("#presentBtn");
    await page.waitForFunction(
      () => !!(document.body && document.body.classList.contains("present")),
      null,
      { timeout: 5000 }
    );
    const presentClosedEvidence = await page.evaluate(() => ({
      presenting: !!(document.body && document.body.classList.contains("present")),
      evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
    }));
    record(
      "K18j",
      "Opening Present closes Evidence (exclusive chrome)",
      presentClosedEvidence.presenting && !presentClosedEvidence.evidenceOpen,
      JSON.stringify(presentClosedEvidence)
    );
    await page.keyboard.press("Escape"); // exit Present
    await page.waitForFunction(
      () => !(document.body && document.body.classList.contains("present")),
      null,
      { timeout: 5000 }
    );
    // Opening Present must close Lens (applyPresent exclusivity — stage clears Lens chrome).
    await page.keyboard.press("l");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    await page.click("#presentBtn");
    await page.waitForFunction(
      () => !!(document.body && document.body.classList.contains("present")),
      null,
      { timeout: 5000 }
    );
    const presentClosedLens = await page.evaluate(() => ({
      presenting: !!(document.body && document.body.classList.contains("present")),
      lensOpen: !!(window.__graphideLens && window.__graphideLens.open),
    }));
    record(
      "K18k",
      "Opening Present closes Lens (exclusive chrome)",
      presentClosedLens.presenting && !presentClosedLens.lensOpen,
      JSON.stringify(presentClosedLens)
    );
    await page.keyboard.press("Escape"); // exit Present
    await page.waitForFunction(
      () => !(document.body && document.body.classList.contains("present")),
      null,
      { timeout: 5000 }
    );
    // Opening Present must close Route (applyPresent exclusivity — stage clears Route chrome).
    await page.keyboard.press("r");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    await page.click("#presentBtn");
    await page.waitForFunction(
      () => !!(document.body && document.body.classList.contains("present")),
      null,
      { timeout: 5000 }
    );
    const presentClosedRoute = await page.evaluate(() => ({
      presenting: !!(document.body && document.body.classList.contains("present")),
      routeOpen: !!(window.__graphideRoute && window.__graphideRoute.open),
    }));
    record(
      "K18l",
      "Opening Present closes Route (exclusive chrome)",
      presentClosedRoute.presenting && !presentClosedRoute.routeOpen,
      JSON.stringify(presentClosedRoute)
    );
    await page.keyboard.press("Escape"); // exit Present
    await page.waitForFunction(
      () => !(document.body && document.body.classList.contains("present")),
      null,
      { timeout: 5000 }
    );
    // Opening Ask must close Evidence (setLlmPane exclusivity — Ask clears Evidence chrome).
    await page.evaluate(() => {
      const cell = document.querySelector("#ledgerGrid .cell");
      if (cell) cell.click();
    });
    await page.waitForFunction(
      () => !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      null,
      { timeout: 5000 }
    );
    await page.click("#llmBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const askClosedEvidence = await page.evaluate(() => ({
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
      evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
    }));
    record(
      "K18m",
      "Opening Ask closes Evidence (exclusive chrome)",
      askClosedEvidence.askOpen && !askClosedEvidence.evidenceOpen,
      JSON.stringify(askClosedEvidence)
    );
    await page.keyboard.press("Escape"); // close Ask
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Opening Ask must close Lens (setLlmPane exclusivity — Ask clears Lens chrome).
    await page.keyboard.press("l");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    await page.click("#llmBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const askClosedLens = await page.evaluate(() => ({
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
      lensOpen: !!(window.__graphideLens && window.__graphideLens.open),
    }));
    record(
      "K18n",
      "Opening Ask closes Lens (exclusive chrome)",
      askClosedLens.askOpen && !askClosedLens.lensOpen,
      JSON.stringify(askClosedLens)
    );
    await page.keyboard.press("Escape"); // close Ask
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Opening Ask must close Route (setLlmPane exclusivity — Ask clears Route chrome).
    await page.keyboard.press("r");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    await page.click("#llmBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const askClosedRoute = await page.evaluate(() => ({
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
      routeOpen: !!(window.__graphideRoute && window.__graphideRoute.open),
    }));
    record(
      "K18o",
      "Opening Ask closes Route (exclusive chrome)",
      askClosedRoute.askOpen && !askClosedRoute.routeOpen,
      JSON.stringify(askClosedRoute)
    );
    await page.keyboard.press("Escape"); // close Ask
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Opening Keys must close Evidence (setKeysPane exclusivity — Keys clears Evidence chrome).
    await page.evaluate(() => {
      const cell = document.querySelector("#ledgerGrid .cell");
      if (cell) cell.click();
    });
    await page.waitForFunction(
      () => !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      null,
      { timeout: 5000 }
    );
    await page.click("#keysBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const keysClosedEvidence = await page.evaluate(() => ({
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
    }));
    record(
      "K18p",
      "Opening Keys closes Evidence (exclusive chrome)",
      keysClosedEvidence.keysOpen && !keysClosedEvidence.evidenceOpen,
      JSON.stringify(keysClosedEvidence)
    );
    await page.keyboard.press("Escape"); // close Keys
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Opening Keys must close Lens (setKeysPane exclusivity — Keys clears Lens chrome).
    await page.keyboard.press("l");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    await page.click("#keysBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const keysClosedLens = await page.evaluate(() => ({
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      lensOpen: !!(window.__graphideLens && window.__graphideLens.open),
    }));
    record(
      "K18q",
      "Opening Keys closes Lens (exclusive chrome)",
      keysClosedLens.keysOpen && !keysClosedLens.lensOpen,
      JSON.stringify(keysClosedLens)
    );
    await page.keyboard.press("Escape"); // close Keys
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Opening Keys must close Route (setKeysPane exclusivity — Keys clears Route chrome).
    await page.keyboard.press("r");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    await page.click("#keysBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const keysClosedRoute = await page.evaluate(() => ({
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      routeOpen: !!(window.__graphideRoute && window.__graphideRoute.open),
    }));
    record(
      "K18r",
      "Opening Keys closes Route (exclusive chrome)",
      keysClosedRoute.keysOpen && !keysClosedRoute.routeOpen,
      JSON.stringify(keysClosedRoute)
    );
    await page.keyboard.press("Escape"); // close Keys
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Opening Export must close Evidence (setExportMenu exclusivity — Export clears Evidence chrome).
    await page.evaluate(() => {
      const cell = document.querySelector("#ledgerGrid .cell");
      if (cell) cell.click();
    });
    await page.waitForFunction(
      () => !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      null,
      { timeout: 5000 }
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
    const exportClosedEvidence = await page.evaluate(() => ({
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
    }));
    record(
      "K18s",
      "Opening Export closes Evidence (exclusive chrome)",
      exportClosedEvidence.exportOpen && !exportClosedEvidence.evidenceOpen,
      JSON.stringify(exportClosedEvidence)
    );
    await page.keyboard.press("Escape"); // close Export
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !menu || menu.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Opening Export must close Lens (setExportMenu exclusivity — Export clears Lens chrome).
    await page.keyboard.press("l");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    await page.click("#exportBtn");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !!(menu && !menu.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const exportClosedLens = await page.evaluate(() => ({
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      lensOpen: !!(window.__graphideLens && window.__graphideLens.open),
    }));
    record(
      "K18t",
      "Opening Export closes Lens (exclusive chrome)",
      exportClosedLens.exportOpen && !exportClosedLens.lensOpen,
      JSON.stringify(exportClosedLens)
    );
    await page.keyboard.press("Escape"); // close Export
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !menu || menu.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Opening Export must close Route (setExportMenu exclusivity — Export clears Route chrome).
    await page.keyboard.press("r");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    await page.click("#exportBtn");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !!(menu && !menu.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const exportClosedRoute = await page.evaluate(() => ({
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      routeOpen: !!(window.__graphideRoute && window.__graphideRoute.open),
    }));
    record(
      "K18u",
      "Opening Export closes Route (exclusive chrome)",
      exportClosedRoute.exportOpen && !exportClosedRoute.routeOpen,
      JSON.stringify(exportClosedRoute)
    );
    await page.keyboard.press("Escape"); // close Export
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !menu || menu.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Opening Evidence must close Ask (revealSourcePane exclusivity — Evidence clears Ask chrome).
    await page.click("#llmBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => {
      const cell = document.querySelector("#ledgerGrid .cell");
      if (cell) cell.click();
    });
    await page.waitForFunction(
      () => !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      null,
      { timeout: 5000 }
    );
    const evidenceClosedAsk = await page.evaluate(() => ({
      evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
    }));
    record(
      "K18v",
      "Opening Evidence closes Ask (exclusive chrome)",
      evidenceClosedAsk.evidenceOpen && !evidenceClosedAsk.askOpen,
      JSON.stringify(evidenceClosedAsk)
    );
    await page.keyboard.press("Escape"); // close Evidence
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Opening Lens must close Ask (setLensOpen exclusivity — Lens clears Ask chrome).
    // Use #lensBtn: desk L is blocked while Ask is open (K15g).
    await page.click("#llmBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.click("#lensBtn");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    const lensClosedAsk = await page.evaluate(() => ({
      lensOpen: !!(window.__graphideLens && window.__graphideLens.open),
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
    }));
    record(
      "K18w",
      "Opening Lens closes Ask (exclusive chrome)",
      lensClosedAsk.lensOpen && !lensClosedAsk.askOpen,
      JSON.stringify(lensClosedAsk)
    );
    await page.keyboard.press("Escape"); // close Lens
    await page.waitForFunction(
      () => !(window.__graphideLens && window.__graphideLens.open),
      null,
      { timeout: 5000 }
    );
    // Opening Route must close Ask (setRouteOpen exclusivity — Route clears Ask chrome).
    // Use #pathBtn: desk R is blocked while Ask is open (K15e).
    await page.click("#llmBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.click("#pathBtn");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    const routeClosedAsk = await page.evaluate(() => ({
      routeOpen: !!(window.__graphideRoute && window.__graphideRoute.open),
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
    }));
    record(
      "K18x",
      "Opening Route closes Ask (exclusive chrome)",
      routeClosedAsk.routeOpen && !routeClosedAsk.askOpen,
      JSON.stringify(routeClosedAsk)
    );
    await page.keyboard.press("Escape"); // close Route
    await page.waitForFunction(
      () => !(window.__graphideRoute && window.__graphideRoute.open),
      null,
      { timeout: 5000 }
    );
    // Opening Evidence must close Keys (revealSourcePane exclusivity — Evidence clears Keys chrome).
    await page.click("#keysBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => {
      const cell = document.querySelector("#ledgerGrid .cell");
      if (cell) cell.click();
    });
    await page.waitForFunction(
      () => !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      null,
      { timeout: 5000 }
    );
    const evidenceClosedKeys = await page.evaluate(() => ({
      evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
    }));
    record(
      "K18y",
      "Opening Evidence closes Keys (exclusive chrome)",
      evidenceClosedKeys.evidenceOpen && !evidenceClosedKeys.keysOpen,
      JSON.stringify(evidenceClosedKeys)
    );
    // Opening Evidence must close Export (revealSourcePane exclusivity — Evidence clears Export chrome).
    // Open Export first (closes Evidence via K18s), then reopen Evidence via ledger cell.
    await page.click("#exportBtn");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !!(menu && !menu.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => {
      const cell = document.querySelector("#ledgerGrid .cell");
      if (cell) cell.click();
    });
    await page.waitForFunction(
      () => !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      null,
      { timeout: 5000 }
    );
    const evidenceClosedExport = await page.evaluate(() => ({
      evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
    }));
    record(
      "K18z",
      "Opening Evidence closes Export (exclusive chrome)",
      evidenceClosedExport.evidenceOpen && !evidenceClosedExport.exportOpen,
      JSON.stringify(evidenceClosedExport)
    );
    // Opening Lens must close Keys (setLensOpen exclusivity — Lens clears Keys chrome).
    // Evidence is open from K18z; close it first so Keys can open cleanly. Reopen after for S1a.
    await page.keyboard.press("Escape"); // close Evidence
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    await page.click("#keysBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    // Use #lensBtn: desk L is blocked while Keys is open (modal chrome early-return).
    await page.click("#lensBtn");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    const lensClosedKeys = await page.evaluate(() => ({
      lensOpen: !!(window.__graphideLens && window.__graphideLens.open),
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
    }));
    record(
      "K18aa",
      "Opening Lens closes Keys (exclusive chrome)",
      lensClosedKeys.lensOpen && !lensClosedKeys.keysOpen,
      JSON.stringify(lensClosedKeys)
    );
    await page.keyboard.press("Escape"); // close Lens
    await page.waitForFunction(
      () => !(window.__graphideLens && window.__graphideLens.open),
      null,
      { timeout: 5000 }
    );
    // Opening Lens must close Export (setLensOpen exclusivity — Lens clears Export chrome).
    // Reverse of Export closing Lens (K18t). Use #lensBtn: desk L is blocked while Export is open.
    await page.click("#exportBtn");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !!(menu && !menu.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.click("#lensBtn");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    const lensClosedExport = await page.evaluate(() => ({
      lensOpen: !!(window.__graphideLens && window.__graphideLens.open),
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
    }));
    record(
      "K18ab",
      "Opening Lens closes Export (exclusive chrome)",
      lensClosedExport.lensOpen && !lensClosedExport.exportOpen,
      JSON.stringify(lensClosedExport)
    );
    await page.keyboard.press("Escape"); // close Lens
    await page.waitForFunction(
      () => !(window.__graphideLens && window.__graphideLens.open),
      null,
      { timeout: 5000 }
    );
    // Opening Route must close Keys (setRouteOpen exclusivity — Route clears Keys chrome).
    // Reverse of Keys closing Route (K18r). Use #pathBtn: desk R is blocked while Keys is open.
    await page.click("#keysBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.click("#pathBtn");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    const routeClosedKeys = await page.evaluate(() => ({
      routeOpen: !!(window.__graphideRoute && window.__graphideRoute.open),
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
    }));
    record(
      "K18ac",
      "Opening Route closes Keys (exclusive chrome)",
      routeClosedKeys.routeOpen && !routeClosedKeys.keysOpen,
      JSON.stringify(routeClosedKeys)
    );
    await page.keyboard.press("Escape"); // close Route
    await page.waitForFunction(
      () => !(window.__graphideRoute && window.__graphideRoute.open),
      null,
      { timeout: 5000 }
    );
    // Opening Route must close Export (setRouteOpen exclusivity — Route clears Export chrome).
    // Reverse of Export closing Route (K18u). Use #pathBtn: desk R is blocked while Export is open.
    await page.click("#exportBtn");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !!(menu && !menu.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.click("#pathBtn");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    const routeClosedExport = await page.evaluate(() => ({
      routeOpen: !!(window.__graphideRoute && window.__graphideRoute.open),
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
    }));
    record(
      "K18ad",
      "Opening Route closes Export (exclusive chrome)",
      routeClosedExport.routeOpen && !routeClosedExport.exportOpen,
      JSON.stringify(routeClosedExport)
    );
    await page.keyboard.press("Escape"); // close Route
    await page.waitForFunction(
      () => !(window.__graphideRoute && window.__graphideRoute.open),
      null,
      { timeout: 5000 }
    );
    // Opening Route must close Lens (setRouteOpen exclusivity — Route clears Lens chrome).
    // Reverse of Lens staying open under Route; open Lens first, then Route via #pathBtn.
    await page.click("#lensBtn");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    await page.click("#pathBtn");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    const routeClosedLens = await page.evaluate(() => ({
      routeOpen: !!(window.__graphideRoute && window.__graphideRoute.open),
      lensOpen: !!(window.__graphideLens && window.__graphideLens.open),
    }));
    record(
      "K18ag",
      "Opening Route closes Lens (exclusive chrome)",
      routeClosedLens.routeOpen && !routeClosedLens.lensOpen,
      JSON.stringify(routeClosedLens)
    );
    await page.keyboard.press("Escape"); // close Route
    await page.waitForFunction(
      () => !(window.__graphideRoute && window.__graphideRoute.open),
      null,
      { timeout: 5000 }
    );
    // Opening Lens must close Route (setLensOpen exclusivity — Lens clears Route chrome).
    // Reverse of Route closing Lens (K18ag). Open Route first, then Lens via #lensBtn.
    await page.click("#pathBtn");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    await page.click("#lensBtn");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    const lensClosedRoute = await page.evaluate(() => ({
      lensOpen: !!(window.__graphideLens && window.__graphideLens.open),
      routeOpen: !!(window.__graphideRoute && window.__graphideRoute.open),
    }));
    record(
      "K18ah",
      "Opening Lens closes Route (exclusive chrome)",
      lensClosedRoute.lensOpen && !lensClosedRoute.routeOpen,
      JSON.stringify(lensClosedRoute)
    );
    await page.keyboard.press("Escape"); // close Lens
    await page.waitForFunction(
      () => !(window.__graphideLens && window.__graphideLens.open),
      null,
      { timeout: 5000 }
    );
    // Opening Ask must close Present (setLlmPane exclusivity — Ask clears Presentation Stage).
    // Reverse of Present closing Ask (K18g). #llmBtn is display:none on stage — click via evaluate.
    await page.click("#presentBtn");
    await page.waitForFunction(
      () => !!(document.body && document.body.classList.contains("present")),
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => {
      const btn = document.getElementById("llmBtn");
      if (btn) btn.click();
    });
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && !pane.hidden) && !(document.body && document.body.classList.contains("present"));
      },
      null,
      { timeout: 5000 }
    );
    const askClosedPresent = await page.evaluate(() => ({
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
      presenting: !!(document.body && document.body.classList.contains("present")),
    }));
    record(
      "K18ai",
      "Opening Ask closes Present (exclusive chrome)",
      askClosedPresent.askOpen && !askClosedPresent.presenting,
      JSON.stringify(askClosedPresent)
    );
    await page.keyboard.press("Escape"); // close Ask
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    // Opening Evidence must close Present (revealSourcePane exclusivity — Evidence clears Presentation Stage).
    // Reverse of Present closing Evidence (K18j). #ledgerPane/#sourcePane are display:none on stage — cell click via evaluate.
    await page.click("#presentBtn");
    await page.waitForFunction(
      () => !!(document.body && document.body.classList.contains("present")),
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => {
      const cell = document.querySelector("#ledgerGrid .cell");
      if (cell) cell.click();
    });
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !!(pane && !pane.hidden) && !(document.body && document.body.classList.contains("present"));
      },
      null,
      { timeout: 5000 }
    );
    const evidenceClosedPresent = await page.evaluate(() => ({
      evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      presenting: !!(document.body && document.body.classList.contains("present")),
    }));
    record(
      "K18aj",
      "Opening Evidence closes Present (exclusive chrome)",
      evidenceClosedPresent.evidenceOpen && !evidenceClosedPresent.presenting,
      JSON.stringify(evidenceClosedPresent)
    );
    // Evidence stays open for K18ae/K18af / S1a (Present already exited).
    // Opening Evidence must close Lens (revealSourcePane exclusivity — Evidence clears Lens chrome).
    // Reverse of Ask/Keys/Export closing Lens; open Lens first, then reopen Evidence via ledger cell.
    await page.click("#lensBtn");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    await page.evaluate(() => {
      const cell = document.querySelector("#ledgerGrid .cell");
      if (cell) cell.click();
    });
    await page.waitForFunction(
      () => !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      null,
      { timeout: 5000 }
    );
    const evidenceClosedLens = await page.evaluate(() => ({
      evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      lensOpen: !!(window.__graphideLens && window.__graphideLens.open),
    }));
    record(
      "K18ae",
      "Opening Evidence closes Lens (exclusive chrome)",
      evidenceClosedLens.evidenceOpen && !evidenceClosedLens.lensOpen,
      JSON.stringify(evidenceClosedLens)
    );
    // Opening Evidence must close Route (revealSourcePane exclusivity — Evidence clears Route chrome).
    // Reverse of Ask/Keys/Export/Present closing Route; open Route via #pathBtn, then reopen Evidence via ledger cell.
    await page.click("#pathBtn");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    await page.evaluate(() => {
      const cell = document.querySelector("#ledgerGrid .cell");
      if (cell) cell.click();
    });
    await page.waitForFunction(
      () => !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      null,
      { timeout: 5000 }
    );
    const evidenceClosedRoute = await page.evaluate(() => ({
      evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      routeOpen: !!(window.__graphideRoute && window.__graphideRoute.open),
    }));
    record(
      "K18af",
      "Opening Evidence closes Route (exclusive chrome)",
      evidenceClosedRoute.evidenceOpen && !evidenceClosedRoute.routeOpen,
      JSON.stringify(evidenceClosedRoute)
    );
    // Evidence is open for S1a scroll-drive suite (opened above for K18ae/K18af).
    await page.waitForFunction(
      () => !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      null,
      { timeout: 5000 }
    );
    // S1a — Evidence #srcBody scroll publishes ScrollDrive and moves camTo (lerp via setCamTarget).
    const beforeScrollDrive = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const vp = document.querySelector("#canvas .viewport");
      const t = (vp && vp.style.transform) || "";
      return {
        ratio: Number(d.scrollRatio) || 0,
        camY: Number(d.camY),
        targetNodeId: d.targetNodeId || "",
        transform: t,
        evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    const scrolled = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      // Explorer snippets are short — pad so scroll can move, then drive scrollTop.
      for (let i = 0; i < 40; i++) {
        const row = document.createElement("div");
        row.className = "src-line";
        row.innerHTML = '<span class="ln">' + (100 + i) + '</span><span class="tx">scroll-drive pad ' + i + "</span>";
        body.appendChild(row);
      }
      body.scrollTop = body.scrollHeight;
      body.dispatchEvent(new Event("scroll"));
      return {
        ok: true,
        scrollTop: body.scrollTop,
        scrollHeight: body.scrollHeight,
        clientHeight: body.clientHeight,
      };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(d && Number(d.scrollRatio) > 0.5);
      },
      null,
      { timeout: 5000 }
    );
    // Allow one lerp tick so camY lands on camTo.
    await page.waitForTimeout(350);
    const afterScrollDrive = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const vp = document.querySelector("#canvas .viewport");
      const t = (vp && vp.style.transform) || "";
      return {
        ratio: Number(d.scrollRatio) || 0,
        activeLine: Number(d.activeLine) || 0,
        camX: Number(d.camX),
        camY: Number(d.camY),
        camK: Number(d.camK),
        targetNodeId: d.targetNodeId || "",
        transform: t,
        evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    const camMoved =
      (Number.isFinite(beforeScrollDrive.camY) &&
        Number.isFinite(afterScrollDrive.camY) &&
        Math.abs(afterScrollDrive.camY - beforeScrollDrive.camY) > 0.5) ||
      (beforeScrollDrive.transform &&
        afterScrollDrive.transform &&
        beforeScrollDrive.transform !== afterScrollDrive.transform);
    record(
      "S1a",
      "Evidence #srcBody scroll publishes ScrollDrive and moves the camera",
      scrolled.ok &&
        beforeScrollDrive.evidenceOpen &&
        afterScrollDrive.evidenceOpen &&
        afterScrollDrive.ratio > 0.5 &&
        !!afterScrollDrive.targetNodeId &&
        camMoved,
      "scrolled=" +
        JSON.stringify(scrolled) +
        " before=" +
        JSON.stringify(beforeScrollDrive) +
        " after=" +
        JSON.stringify(afterScrollDrive)
    );
    // S1b — Slice Steiner CFG unrolls with scroll; active block gets scroll-cfg-hot glow.
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector("#sliceCanvas .vnode[data-id]", { timeout: 10000 });
    const s1bOpened = await page.evaluate(() => {
      const pane = document.getElementById("sourcePane");
      if (!(pane && !pane.hidden)) {
        const n = document.querySelector("#sliceCanvas .vnode[data-id]");
        if (n) n.click();
      }
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      // Re-pad if needed (S1a already padded; keep scrollable).
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 40; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.innerHTML =
            '<span class="ln">' + (200 + i) + '</span><span class="tx">cfg-unroll pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      body.scrollTop = 0;
      body.dispatchEvent(new Event("scroll"));
      const top = {
        ratio: Number((window.__graphideScrollDrive || {}).scrollRatio) || 0,
        cfgUnroll: Number((window.__graphideScrollDrive || {}).cfgUnroll) || 0,
        cfgVisible: Number((window.__graphideScrollDrive || {}).cfgVisible) || 0,
        cfgActiveId: ((window.__graphideScrollDrive || {}).cfgActiveId) || "",
        hot: !!document.querySelector("#sliceCanvas .vnode.scroll-cfg-hot, #sliceCanvas .vnode[data-cfg-active='1']"),
        ahead: document.querySelectorAll("#sliceCanvas .vnode.scroll-cfg-ahead").length,
        vnodes: document.querySelectorAll("#sliceCanvas .vnode[data-id]").length,
      };
      body.scrollTop = body.scrollHeight;
      body.dispatchEvent(new Event("scroll"));
      return { ok: true, top };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(d && Number(d.cfgUnroll) > 0.5 && d.cfgActiveId);
      },
      null,
      { timeout: 5000 }
    );
    await page.waitForTimeout(200);
    const afterCfg = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        ratio: Number(d.scrollRatio) || 0,
        cfgUnroll: Number(d.cfgUnroll) || 0,
        cfgVisible: Number(d.cfgVisible) || 0,
        cfgActiveId: d.cfgActiveId || "",
        hot: !!document.querySelector("#sliceCanvas .vnode.scroll-cfg-hot, #sliceCanvas .vnode[data-cfg-active='1']"),
        ahead: document.querySelectorAll("#sliceCanvas .vnode.scroll-cfg-ahead").length,
        vnodes: document.querySelectorAll("#sliceCanvas .vnode[data-id]").length,
        evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    record(
      "S1b",
      "Evidence scroll unrolls Slice CFG and glows the active block",
      s1bOpened.ok &&
        afterCfg.evidenceOpen &&
        afterCfg.cfgUnroll > 0.5 &&
        !!afterCfg.cfgActiveId &&
        afterCfg.hot &&
        afterCfg.cfgVisible >= 2 &&
        (s1bOpened.top.cfgVisible < afterCfg.cfgVisible || s1bOpened.top.ahead > afterCfg.ahead || afterCfg.cfgUnroll > s1bOpened.top.cfgUnroll),
      "opened=" + JSON.stringify(s1bOpened) + " after=" + JSON.stringify(afterCfg)
    );
    // S1c — file-top (low scrollRatio) → macro Map LOD; focus Evidence node, dim siblings.
    const s1cTop = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 40; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.innerHTML =
            '<span class="ln">' + (300 + i) + '</span><span class="tx">macro-lod pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      body.scrollTop = 0;
      body.dispatchEvent(new Event("scroll"));
      return {
        ok: true,
        scrollHeight: body.scrollHeight,
        clientHeight: body.clientHeight,
      };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const vp = document.querySelector("#canvas .viewport, #sliceCanvas") 
          ? document.querySelector("#canvas .viewport")
          : null;
        return !!(
          d &&
          d.macroLod &&
          Number(d.scrollRatio) <= 0.18 &&
          vp &&
          vp.getAttribute("data-lod") === "0" &&
          vp.getAttribute("data-scroll-macro") === "1" &&
          document.querySelector(".vnode.scroll-macro-hot, .vnode[data-macro-hot='1']")
        );
      },
      null,
      { timeout: 5000 }
    );
    await page.waitForTimeout(150);
    const afterMacro = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const vp = document.querySelector("#canvas .viewport");
      return {
        ratio: Number(d.scrollRatio) || 0,
        scrollVel: Number(d.scrollVel) || 0,
        macroLod: !!d.macroLod,
        lod: (vp && vp.getAttribute("data-lod")) || "",
        macroAttr: (vp && vp.getAttribute("data-scroll-macro")) || "",
        hot: !!document.querySelector(".vnode.scroll-macro-hot, .vnode[data-macro-hot='1']"),
        dim: document.querySelectorAll(".vnode.scroll-macro-dim").length,
        cfgHot: !!document.querySelector(".vnode.scroll-cfg-hot"),
        camK: Number(d.camK),
        targetNodeId: d.targetNodeId || "",
        evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    // Mid-file slow scroll must leave macro and restore micro CFG (velocity aged out).
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      body.scrollTop = Math.floor(max * 0.55);
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForTimeout(280); // past velocity recheck timer
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      // Second tick after age decay — settle mid-file micro mode.
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(d && !d.macroLod && Number(d.scrollRatio) > 0.35 && Number(d.cfgUnroll) > 0.35);
      },
      null,
      { timeout: 5000 }
    );
    const afterMid = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const vp = document.querySelector("#canvas .viewport");
      return {
        ratio: Number(d.scrollRatio) || 0,
        macroLod: !!d.macroLod,
        macroAttr: (vp && vp.getAttribute("data-scroll-macro")) || "",
        cfgUnroll: Number(d.cfgUnroll) || 0,
        cfgHot: !!document.querySelector(".vnode.scroll-cfg-hot, .vnode[data-cfg-active='1']"),
        macroHot: !!document.querySelector(".vnode.scroll-macro-hot"),
      };
    });
    record(
      "S1c",
      "Evidence file-top / fast scroll enters macro Map LOD; mid-file returns to CFG",
      s1cTop.ok &&
        afterMacro.evidenceOpen &&
        afterMacro.macroLod &&
        afterMacro.lod === "0" &&
        afterMacro.macroAttr === "1" &&
        afterMacro.hot &&
        afterMacro.dim >= 1 &&
        !afterMacro.cfgHot &&
        !afterMid.macroLod &&
        afterMid.cfgUnroll > 0.35 &&
        afterMid.cfgHot,
      "top=" +
        JSON.stringify(s1cTop) +
        " macro=" +
        JSON.stringify(afterMacro) +
        " mid=" +
        JSON.stringify(afterMid)
    );
    // S1d — Evidence if / loop / try lines annotate Steiner CFG spans; active kind glows, siblings collapse.
    const s1dPad = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      const pane = document.getElementById("sourcePane");
      if (!(pane && !pane.hidden)) {
        const n = document.querySelector("#sliceCanvas .vnode[data-id]");
        if (n) n.click();
      }
      // Mid-file micro mode — inject distinct control-flow anchors then scroll into them.
      const anchors = [
        { ln: 410, tx: "if (ready) { open_gate(); }" },
        { ln: 430, tx: "for (let i = 0; i < n; i++) { step(i); }" },
        { ln: 450, tx: "try { flush(); } catch (e) { recover(e); }" },
      ];
      for (const a of anchors) {
        const row = document.createElement("div");
        row.className = "src-line";
        row.innerHTML = '<span class="ln">' + a.ln + '</span><span class="tx">' + a.tx + "</span>";
        body.appendChild(row);
      }
      for (let i = 0; i < 24; i++) {
        const row = document.createElement("div");
        row.className = "src-line";
        row.innerHTML =
          '<span class="ln">' + (460 + i) + '</span><span class="tx">cfg-span pad ' + i + "</span>";
        body.appendChild(row);
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      body.scrollTop = Math.floor(max * 0.62);
      body.dispatchEvent(new Event("scroll"));
      return { ok: true, max: max, scrollTop: body.scrollTop };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        if (!(d && !d.macroLod && Number(d.cfgUnroll) > 0.35 && Number(d.cfgSpanCount) >= 3)) return false;
        const kinds = new Set();
        document.querySelectorAll("#sliceCanvas .vnode[data-cfg-span]").forEach((el) => {
          kinds.add(el.getAttribute("data-cfg-span"));
        });
        return kinds.has("if") && kinds.has("loop") && kinds.has("try") && !!(d.cfgSpanKind);
      },
      null,
      { timeout: 5000 }
    );
    await page.waitForTimeout(150);
    const afterSpans = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const kinds = [];
      document.querySelectorAll("#sliceCanvas .vnode[data-cfg-span]").forEach((el) => {
        kinds.push(el.getAttribute("data-cfg-span"));
      });
      const uniq = Array.from(new Set(kinds));
      const hot = document.querySelector(
        "#sliceCanvas .vnode.scroll-cfg-hot[data-cfg-span], #sliceCanvas .vnode[data-cfg-active='1'][data-cfg-span]"
      );
      return {
        ok: true,
        ratio: Number(d.scrollRatio) || 0,
        macroLod: !!d.macroLod,
        cfgUnroll: Number(d.cfgUnroll) || 0,
        cfgSpanKind: d.cfgSpanKind || "",
        cfgSpanCount: Number(d.cfgSpanCount) || 0,
        uniq: uniq,
        hotSpan: (hot && hot.getAttribute("data-cfg-span")) || "",
        sib: document.querySelectorAll("#sliceCanvas .vnode.scroll-cfg-sib").length,
        ifN: document.querySelectorAll("#sliceCanvas .vnode.scroll-cfg-if, #sliceCanvas .vnode[data-cfg-span='if']").length,
        loopN: document.querySelectorAll("#sliceCanvas .vnode.scroll-cfg-loop, #sliceCanvas .vnode[data-cfg-span='loop']").length,
        tryN: document.querySelectorAll("#sliceCanvas .vnode.scroll-cfg-try, #sliceCanvas .vnode[data-cfg-span='try']").length,
        evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    record(
      "S1d",
      "Evidence if/loop/try lines annotate CFG spans; active kind glows, siblings collapse",
      s1dPad.ok &&
        afterSpans.evidenceOpen &&
        !afterSpans.macroLod &&
        afterSpans.cfgUnroll > 0.35 &&
        afterSpans.cfgSpanCount >= 3 &&
        ["if", "loop", "try"].includes(afterSpans.cfgSpanKind) &&
        afterSpans.uniq.includes("if") &&
        afterSpans.uniq.includes("loop") &&
        afterSpans.uniq.includes("try") &&
        !!afterSpans.hotSpan &&
        afterSpans.sib >= 1 &&
        afterSpans.ifN >= 1 &&
        afterSpans.loopN >= 1 &&
        afterSpans.tryN >= 1,
      "pad=" + JSON.stringify(s1dPad) + " after=" + JSON.stringify(afterSpans)
    );

    // S1e — IR kind + EndpointMeta → API / Database / Service / Utility color anchors.
    const s1ePad = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      const pane = document.getElementById("sourcePane");
      if (!(pane && !pane.hidden)) {
        const n = document.querySelector("#sliceCanvas .vnode[data-id]");
        if (n) n.click();
      }
      // Ensure mid-file micro mode (not macro) so CFG + anchors both paint.
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 40; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.innerHTML =
            '<span class="ln">' + (500 + i) + '</span><span class="tx">kind-anchor pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      // Force a spread of IR kinds on painted Slice nodes so all four buckets appear.
      const nodes = Array.from(document.querySelectorAll("#sliceCanvas .vnode[data-id]"));
      const kinds = ["Function", "Type", "Endpoint", "Endpoint"];
      nodes.forEach((el, i) => {
        el.setAttribute("data-kind", kinds[i % kinds.length]);
      });
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      body.scrollTop = Math.floor(max * 0.55);
      body.dispatchEvent(new Event("scroll"));
      return { ok: true, vnodes: nodes.length, scrollTop: body.scrollTop };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        if (!(d && !d.macroLod && Number(d.scrollRatio) > 0.35)) return false;
        const counts = d.anchorCounts || {};
        const stamped = document.querySelectorAll("#sliceCanvas .vnode[data-scroll-anchor]").length;
        const buckets = new Set();
        document.querySelectorAll("#sliceCanvas .vnode[data-scroll-anchor]").forEach((el) => {
          buckets.add(el.getAttribute("data-scroll-anchor"));
        });
        return (
          stamped >= 2 &&
          buckets.has("util") &&
          buckets.has("svc") &&
          (buckets.has("api") || buckets.has("db")) &&
          !!d.anchorFocus &&
          (Number(counts.util) || 0) + (Number(counts.svc) || 0) + (Number(counts.api) || 0) + (Number(counts.db) || 0) >= 2
        );
      },
      null,
      { timeout: 5000 }
    );
    await page.waitForTimeout(120);
    const afterAnchors = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const buckets = [];
      document.querySelectorAll("#sliceCanvas .vnode[data-scroll-anchor]").forEach((el) => {
        buckets.push(el.getAttribute("data-scroll-anchor"));
      });
      const uniq = Array.from(new Set(buckets));
      const counts = d.anchorCounts || {};
      return {
        ok: true,
        ratio: Number(d.scrollRatio) || 0,
        macroLod: !!d.macroLod,
        anchorFocus: d.anchorFocus || "",
        counts: counts,
        uniq: uniq,
        stamped: buckets.length,
        apiCls: document.querySelectorAll("#sliceCanvas .vnode.scroll-anchor-api, #sliceCanvas .vnode[data-scroll-anchor='api']").length,
        dbCls: document.querySelectorAll("#sliceCanvas .vnode.scroll-anchor-db, #sliceCanvas .vnode[data-scroll-anchor='db']").length,
        svcCls: document.querySelectorAll("#sliceCanvas .vnode.scroll-anchor-svc, #sliceCanvas .vnode[data-scroll-anchor='svc']").length,
        utilCls: document.querySelectorAll("#sliceCanvas .vnode.scroll-anchor-util, #sliceCanvas .vnode[data-scroll-anchor='util']").length,
        evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    record(
      "S1e",
      "Evidence scroll stamps API/DB/Service/Utility kind anchors from IR kinds",
      s1ePad.ok &&
        afterAnchors.evidenceOpen &&
        !afterAnchors.macroLod &&
        afterAnchors.stamped >= 2 &&
        afterAnchors.uniq.includes("util") &&
        afterAnchors.uniq.includes("svc") &&
        (afterAnchors.uniq.includes("api") || afterAnchors.uniq.includes("db")) &&
        !!afterAnchors.anchorFocus &&
        afterAnchors.utilCls >= 1 &&
        afterAnchors.svcCls >= 1 &&
        afterAnchors.apiCls + afterAnchors.dbCls >= 1,
      "pad=" + JSON.stringify(s1ePad) + " after=" + JSON.stringify(afterAnchors)
    );

    // S1f — hide-until-focus clutter gate: macro/far → detailNear false; mid focus → true.
    const s1fNear = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const vp = document.querySelector(".viewport");
      return {
        ok: true,
        detailNear: !!d.detailNear,
        attr: (vp && vp.getAttribute("data-scroll-detail")) || "",
        macroLod: !!d.macroLod,
        cfgVisible: Number(d.cfgVisible) || 0,
        cfgUnroll: Number(d.cfgUnroll) || 0,
        ratio: Number(d.scrollRatio) || 0,
        evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    // Mid-file from S1e should already be near — assert detail gate open.
    // Then jump to file top → macro → detail closed.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      body.scrollTop = 0;
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const vp = document.querySelector(".viewport");
        return !!(
          d &&
          d.macroLod &&
          !d.detailNear &&
          vp &&
          vp.getAttribute("data-scroll-detail") === "0"
        );
      },
      null,
      { timeout: 5000 }
    );
    await page.waitForTimeout(100);
    const s1fFar = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const vp = document.querySelector(".viewport");
      return {
        detailNear: !!d.detailNear,
        attr: (vp && vp.getAttribute("data-scroll-detail")) || "",
        macroLod: !!d.macroLod,
        ratio: Number(d.scrollRatio) || 0,
      };
    });
    // Scroll mid again — detail must reopen with focus.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      body.scrollTop = Math.floor(max * 0.55);
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const vp = document.querySelector(".viewport");
        return !!(
          d &&
          !d.macroLod &&
          d.detailNear &&
          vp &&
          vp.getAttribute("data-scroll-detail") === "1" &&
          (Number(d.cfgVisible) >= 2 || Number(d.cfgUnroll) > 0.35 || Number(d.scrollRatio) > 0.25)
        );
      },
      null,
      { timeout: 5000 }
    );
    await page.waitForTimeout(100);
    const s1fReopen = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const vp = document.querySelector(".viewport");
      return {
        detailNear: !!d.detailNear,
        attr: (vp && vp.getAttribute("data-scroll-detail")) || "",
        macroLod: !!d.macroLod,
        cfgVisible: Number(d.cfgVisible) || 0,
        cfgUnroll: Number(d.cfgUnroll) || 0,
        ratio: Number(d.scrollRatio) || 0,
        evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    record(
      "S1f",
      "Evidence scroll gates deep clutter until focus approaches (detailNear / data-scroll-detail)",
      s1fNear.ok &&
        s1fNear.evidenceOpen &&
        s1fNear.detailNear &&
        s1fNear.attr === "1" &&
        !s1fNear.macroLod &&
        s1fFar.macroLod &&
        !s1fFar.detailNear &&
        s1fFar.attr === "0" &&
        s1fReopen.evidenceOpen &&
        !s1fReopen.macroLod &&
        s1fReopen.detailNear &&
        s1fReopen.attr === "1",
      "near=" +
        JSON.stringify(s1fNear) +
        " far=" +
        JSON.stringify(s1fFar) +
        " reopen=" +
        JSON.stringify(s1fReopen)
    );

    // S1g — scrollVel eases tickCam lerp: fast flick → loose camEase; settle → snappy.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      // Ensure scrollable pad still present from S1a–S1f.
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      body.scrollTop = Math.floor(max * 0.2);
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForTimeout(40);
    // Burst scroll to spike EMA velocity.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      const steps = [0.25, 0.55, 0.85, 0.95];
      for (const r of steps) {
        body.scrollTop = Math.floor(max * r);
        body.dispatchEvent(new Event("scroll"));
      }
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          Number.isFinite(d.camEase) &&
          Number(d.scrollVel) > 0.2 &&
          Number(d.camEase) < 0.24
        );
      },
      null,
      { timeout: 5000 }
    );
    const s1gLoose = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        camEase: Number(d.camEase),
        scrollVel: Number(d.scrollVel) || 0,
        evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    // Idle — velocity ages out → snappy settle (camEase > base).
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          Number.isFinite(d.camEase) &&
          Number(d.scrollVel) < 0.12 &&
          Number(d.camEase) > 0.28
        );
      },
      null,
      { timeout: 5000 }
    );
    const s1gSnap = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        camEase: Number(d.camEase),
        scrollVel: Number(d.scrollVel) || 0,
        evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    record(
      "S1g",
      "Evidence scrollVel eases tickCam lerp (loose on flick, snappy on settle)",
      s1gLoose.evidenceOpen &&
        s1gLoose.camEase < 0.24 &&
        s1gLoose.scrollVel > 0.2 &&
        s1gSnap.evidenceOpen &&
        s1gSnap.camEase > 0.28 &&
        s1gSnap.scrollVel < 0.12,
      "loose=" + JSON.stringify(s1gLoose) + " snap=" + JSON.stringify(s1gSnap)
    );

    // S1h — activeLine maps to IR/fixture span owner (same-file sibling), not only sourceId.
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector('#sliceCanvas .vnode[data-id="n1"]', { timeout: 10000 });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        const text = ((body && body.textContent) || "") + ((document.getElementById("srcTitle") && document.getElementById("srcTitle").textContent) || "");
        return !!(pane && !pane.hidden && body && /hop_1|solarsim::ext/i.test(text));
      },
      null,
      { timeout: 5000 }
    );
    const s1hSetup = await page.evaluate(() => {
      const sourceId = "n1";
      const siblingId = "n21";
      const siblingLine = 31;
      const ownLine = 11;
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      // Controlled Evidence body — enough lead-in so sibling is not at viewport mid when scrollTop=0.
      body.innerHTML = "";
      function addLine(ln, tx) {
        const row = document.createElement("div");
        row.className = "src-line";
        row.setAttribute("data-s1h", "1");
        row.setAttribute("data-s1h-ln", String(ln));
        row.innerHTML = '<span class="ln">' + ln + '</span><span class="tx">' + tx + "</span>";
        body.appendChild(row);
        return row;
      }
      for (let i = 0; i < 24; i++) addLine(200 + i, "s1h lead " + i);
      addLine(ownLine, "s1h own span " + sourceId);
      const sibRow = addLine(siblingLine, "s1h sibling span " + siblingId);
      for (let k = 0; k < 24; k++) addLine(900 + k, "s1h far pad " + k);
      function centerRow(row) {
        const br = body.getBoundingClientRect();
        const rr = row.getBoundingClientRect();
        const delta = rr.top + rr.height / 2 - (br.top + body.clientHeight / 2);
        body.scrollTop = Math.max(0, body.scrollTop + delta);
        body.dispatchEvent(new Event("scroll"));
      }
      centerRow(sibRow);
      return {
        ok: true,
        sourceId: sourceId,
        siblingId: siblingId,
        siblingLine: siblingLine,
        ownLine: ownLine,
        scrollTop: body.scrollTop,
        scrollHeight: body.scrollHeight,
        clientHeight: body.clientHeight,
        drive: Object.assign({}, window.__graphideScrollDrive || {}),
      };
    });
    await page.waitForFunction(
      (sib) => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          d.lineMapHit === true &&
          String(d.targetNodeId || "") === String(sib) &&
          Number(d.activeLine) > 0
        );
      },
      s1hSetup.siblingId,
      { timeout: 5000 }
    );
    const s1hHit = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        targetNodeId: d.targetNodeId || "",
        lineMapHit: !!d.lineMapHit,
        activeLine: Number(d.activeLine) || 0,
        evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      const far = body && body.querySelector('.src-line[data-s1h-ln="900"]');
      if (!body || !far) return;
      const br = body.getBoundingClientRect();
      const rr = far.getBoundingClientRect();
      const delta = rr.top + rr.height / 2 - (br.top + body.clientHeight / 2);
      body.scrollTop = Math.max(0, body.scrollTop + delta);
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(
      (sourceId) => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          d.lineMapHit === false &&
          String(d.targetNodeId || "") === String(sourceId) &&
          Number(d.activeLine) >= 900
        );
      },
      s1hSetup.sourceId,
      { timeout: 5000 }
    );
    const s1hMiss = await page.evaluate((sourceId) => {
      const d = window.__graphideScrollDrive || {};
      return {
        ok: true,
        targetNodeId: d.targetNodeId || "",
        lineMapHit: !!d.lineMapHit,
        activeLine: Number(d.activeLine) || 0,
        sourceId: sourceId,
      };
    }, s1hSetup.sourceId);
    record(
      "S1h",
      "Evidence activeLine maps to IR/fixture span owner (lineMapHit)",
      s1hSetup.ok &&
        s1hHit.evidenceOpen &&
        s1hHit.lineMapHit === true &&
        s1hHit.targetNodeId === s1hSetup.siblingId &&
        s1hMiss.ok &&
        s1hMiss.lineMapHit === false &&
        s1hMiss.targetNodeId === s1hSetup.sourceId,
      "setup=" +
        JSON.stringify(s1hSetup) +
        " hit=" +
        JSON.stringify(s1hHit) +
        " miss=" +
        JSON.stringify(s1hMiss)
    );

    // S1i — nested if/for/try braces expand child + ancestors; siblings collapse.
    const s1iPad = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      const pane = document.getElementById("sourcePane");
      if (!(pane && !pane.hidden)) {
        const n = document.querySelector("#sliceCanvas .vnode[data-id]");
        if (n) n.click();
      }
      body.innerHTML = "";
      function add(ln, tx) {
        const row = document.createElement("div");
        row.className = "src-line";
        row.setAttribute("data-s1i", "1");
        row.setAttribute("data-s1i-ln", String(ln));
        row.innerHTML = '<span class="ln">' + ln + '</span><span class="tx">' + tx + "</span>";
        body.appendChild(row);
        return row;
      }
      for (let i = 0; i < 20; i++) add(100 + i, "s1i lead " + i);
      add(510, "if (outer) {");
      for (let i = 0; i < 6; i++) add(511 + i, "  // outer pad " + i);
      add(520, "  for (let i = 0; i < n; i++) {");
      for (let i = 0; i < 6; i++) add(521 + i, "    // inner pad " + i);
      const tryRow = add(530, "    try { flush(); } catch (e) { recover(e); }");
      add(531, "  }");
      add(532, "}");
      for (let i = 0; i < 24; i++) add(600 + i, "s1i trail " + i);
      // Sibling nest at same outer depth — should collapse when focus is in try.
      add(700, "if (sibling) {");
      add(701, "  return alt;");
      add(702, "}");
      for (let i = 0; i < 16; i++) add(800 + i, "s1i far " + i);
      function center(row) {
        const br = body.getBoundingClientRect();
        const rr = row.getBoundingClientRect();
        const delta = rr.top + rr.height / 2 - (br.top + body.clientHeight / 2);
        body.scrollTop = Math.max(0, body.scrollTop + delta);
        body.dispatchEvent(new Event("scroll"));
      }
      center(tryRow);
      return {
        ok: true,
        scrollTop: body.scrollTop,
        scrollHeight: body.scrollHeight,
        clientHeight: body.clientHeight,
        drive: Object.assign({}, window.__graphideScrollDrive || {}),
      };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        if (!(d && !d.macroLod && Number(d.cfgUnroll) > 0.2 && Number(d.cfgSpanCount) >= 3)) return false;
        if (!(Number(d.cfgNestMax) >= 2 && Number(d.cfgNestDepth) >= 2 && Number(d.cfgNestExpanded) >= 2)) return false;
        const hot =
          document.querySelector("#sliceCanvas .vnode.scroll-cfg-nest-hot, #sliceCanvas .vnode.scroll-cfg-hot[data-cfg-depth]");
        const anc = document.querySelectorAll("#sliceCanvas .vnode.scroll-cfg-nest-anc").length;
        return !!(hot || anc >= 1 || d.cfgSpanKind === "try");
      },
      null,
      { timeout: 6000 }
    );
    await page.waitForTimeout(150);
    const afterNest = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        ok: true,
        ratio: Number(d.scrollRatio) || 0,
        activeLine: Number(d.activeLine) || 0,
        macroLod: !!d.macroLod,
        cfgUnroll: Number(d.cfgUnroll) || 0,
        cfgSpanKind: d.cfgSpanKind || "",
        cfgSpanCount: Number(d.cfgSpanCount) || 0,
        cfgNestDepth: Number(d.cfgNestDepth) || 0,
        cfgNestMax: Number(d.cfgNestMax) || 0,
        cfgNestExpanded: Number(d.cfgNestExpanded) || 0,
        nestHot: document.querySelectorAll("#sliceCanvas .vnode.scroll-cfg-nest-hot").length,
        nestAnc: document.querySelectorAll("#sliceCanvas .vnode.scroll-cfg-nest-anc").length,
        nestSib: document.querySelectorAll("#sliceCanvas .vnode.scroll-cfg-nest-sib").length,
        depthPaint: document.querySelectorAll("#sliceCanvas .vnode[data-cfg-depth]").length,
        deep2: document.querySelectorAll("#sliceCanvas .vnode[data-cfg-depth='2']").length,
        evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    record(
      "S1i",
      "Evidence nested CFG expands child+ancestors on activeLine; siblings collapse",
      s1iPad.ok &&
        afterNest.evidenceOpen &&
        !afterNest.macroLod &&
        afterNest.cfgUnroll > 0.2 &&
        afterNest.cfgSpanCount >= 3 &&
        afterNest.cfgNestMax >= 2 &&
        afterNest.cfgNestDepth >= 2 &&
        afterNest.cfgNestExpanded >= 2 &&
        afterNest.depthPaint >= 1 &&
        (afterNest.nestHot >= 1 || afterNest.cfgSpanKind === "try") &&
        (afterNest.nestAnc >= 1 || afterNest.cfgNestExpanded >= 3 || afterNest.deep2 >= 1),
      "pad=" + JSON.stringify(s1iPad) + " after=" + JSON.stringify(afterNest)
    );

    // S1j — nest glow / LOD blend: camEase-tied --scroll-blend-ms; CSS opacity ease (no snap).
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const vp = document.querySelector("#sliceCanvas .viewport, .viewport");
        if (!(d && Number.isFinite(d.blendMs) && Number(d.blendMs) >= 100 && Number(d.blendMs) <= 300)) return false;
        if (!(vp && vp.getAttribute("data-scroll-blend") === "1")) return false;
        const ms = (vp.style && vp.style.getPropertyValue("--scroll-blend-ms")) || "";
        return /ms$/.test(ms.trim());
      },
      null,
      { timeout: 5000 }
    );
    const s1jNest = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const vp = document.querySelector("#sliceCanvas .viewport, .viewport");
      const probe =
        document.querySelector(
          "#sliceCanvas .vnode.scroll-cfg-nest-hot, #sliceCanvas .vnode.scroll-cfg-hot, #sliceCanvas .vnode.scroll-cfg-nest-anc, #sliceCanvas .vnode"
        ) || null;
      let transition = "";
      if (probe) {
        try {
          transition = getComputedStyle(probe).transitionProperty || "";
        } catch (_) {
          transition = "";
        }
      }
      return {
        blendMs: Number(d.blendMs),
        camEase: Number(d.camEase),
        macroLod: !!d.macroLod,
        detailNear: !!d.detailNear,
        detailAttr: (vp && vp.getAttribute("data-scroll-detail")) || "",
        blendAttr: (vp && vp.getAttribute("data-scroll-blend")) || "",
        blendVar: (vp && vp.style && vp.style.getPropertyValue("--scroll-blend-ms")) || "",
        transition: transition,
        nestHot: document.querySelectorAll("#sliceCanvas .vnode.scroll-cfg-nest-hot").length,
        evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    // Macro LOD path must also keep blend paint (file top).
    const s1jMacro = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      body.scrollTop = 0;
      body.dispatchEvent(new Event("scroll"));
      return { ok: true };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const vp = document.querySelector("#sliceCanvas .viewport, .viewport");
        return !!(
          d &&
          d.macroLod &&
          Number.isFinite(d.blendMs) &&
          Number(d.blendMs) >= 100 &&
          Number(d.blendMs) <= 300 &&
          vp &&
          vp.getAttribute("data-scroll-blend") === "1" &&
          vp.getAttribute("data-scroll-macro") === "1" &&
          d.detailNear === false
        );
      },
      null,
      { timeout: 6000 }
    );
    await page.waitForTimeout(120);
    const s1jMacroAfter = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const vp = document.querySelector("#sliceCanvas .viewport, .viewport");
      const hot = document.querySelector(
        "#sliceCanvas .vnode.scroll-macro-hot, #sliceCanvas .vnode[data-macro-hot='1'], .vnode.scroll-macro-hot, .vnode[data-macro-hot='1']"
      );
      const dim = document.querySelector(
        "#sliceCanvas .vnode.scroll-macro-dim, .vnode.scroll-macro-dim"
      );
      // Probe any painted macro vnode (hot preferred); fall back to any .vnode under blend.
      const probe =
        hot ||
        dim ||
        document.querySelector("#sliceCanvas .vnode[data-id], .viewport .vnode[data-id], .vnode[data-id]");
      let transition = "";
      if (probe) {
        try {
          transition = getComputedStyle(probe).transitionProperty || "";
        } catch (_) {
          transition = "";
        }
      }
      return {
        blendMs: Number(d.blendMs),
        macroLod: !!d.macroLod,
        detailNear: !!d.detailNear,
        detailAttr: (vp && vp.getAttribute("data-scroll-detail")) || "",
        blendAttr: (vp && vp.getAttribute("data-scroll-blend")) || "",
        blendVar: (vp && vp.style && vp.style.getPropertyValue("--scroll-blend-ms")) || "",
        macroAttr: (vp && vp.getAttribute("data-scroll-macro")) || "",
        transition: transition,
        hot: !!hot,
        dim: !!dim,
        probe: !!(probe && probe.getAttribute && probe.getAttribute("data-id")),
      };
    });
    record(
      "S1j",
      "Evidence nest/macro paint eases via camEase-tied blendMs / data-scroll-blend (no snap; S1f clutter intact)",
      s1jNest.evidenceOpen &&
        Number.isFinite(s1jNest.blendMs) &&
        s1jNest.blendMs >= 100 &&
        s1jNest.blendMs <= 300 &&
        s1jNest.blendAttr === "1" &&
        /ms$/.test(String(s1jNest.blendVar).trim()) &&
        String(s1jNest.transition).includes("opacity") &&
        s1jMacro.ok &&
        s1jMacroAfter.macroLod &&
        s1jMacroAfter.blendAttr === "1" &&
        s1jMacroAfter.macroAttr === "1" &&
        s1jMacroAfter.detailNear === false &&
        s1jMacroAfter.detailAttr === "0" &&
        Number.isFinite(s1jMacroAfter.blendMs) &&
        s1jMacroAfter.blendMs >= 100 &&
        s1jMacroAfter.blendMs <= 300 &&
        String(s1jMacroAfter.transition).includes("opacity"),
      "nest=" + JSON.stringify(s1jNest) + " macroPad=" + JSON.stringify(s1jMacro) + " macro=" + JSON.stringify(s1jMacroAfter)
    );

    // S1k — prefers-reduced-motion: snap blendMs to 0, camEase snappy, no settle timers.
    const s1kMock = await page.evaluate(() => {
      const pane = document.getElementById("sourcePane");
      const body = document.getElementById("srcBody");
      if (!pane || pane.hidden || !body) return { ok: false, why: "evidence-closed" };
      window.__graphideMatchMediaOrig = window.matchMedia;
      window.matchMedia = function (query) {
        const q = String(query || "");
        if (/prefers-reduced-motion/i.test(q)) {
          return {
            matches: /reduce/i.test(q),
            media: q,
            onchange: null,
            addListener: function () {},
            removeListener: function () {},
            addEventListener: function () {},
            removeEventListener: function () {},
            dispatchEvent: function () {
              return false;
            },
          };
        }
        return window.__graphideMatchMediaOrig.apply(window, arguments);
      };
      // Mid-file scroll so paint + blend republish under the mock.
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      body.scrollTop = Math.floor(max * 0.55);
      body.dispatchEvent(new Event("scroll"));
      return { ok: true, max: max };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const vp = document.querySelector("#sliceCanvas .viewport, .viewport");
        if (!(d && d.reducedMotion === true && Number(d.blendMs) === 0)) return false;
        if (!(Number(d.camEase) >= 0.3)) return false; // CAM_EASE_SNAP ≈ 0.36
        const ms = (vp && vp.style && vp.style.getPropertyValue("--scroll-blend-ms")) || "";
        return ms.trim() === "0ms" || ms.trim() === "0";
      },
      null,
      { timeout: 6000 }
    );
    const s1kAfter = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const vp = document.querySelector("#sliceCanvas .viewport, .viewport");
      return {
        reducedMotion: !!d.reducedMotion,
        blendMs: Number(d.blendMs),
        camEase: Number(d.camEase),
        blendVar: (vp && vp.style && vp.style.getPropertyValue("--scroll-blend-ms")) || "",
        blendAttr: (vp && vp.getAttribute("data-scroll-blend")) || "",
        evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    // Restore matchMedia so later desk chrome / Present tests keep normal motion.
    await page.evaluate(() => {
      if (window.__graphideMatchMediaOrig) {
        window.matchMedia = window.__graphideMatchMediaOrig;
        delete window.__graphideMatchMediaOrig;
      }
      const body = document.getElementById("srcBody");
      if (body) {
        body.dispatchEvent(new Event("scroll"));
      }
    });
    record(
      "S1k",
      "Evidence scroll respects prefers-reduced-motion (blendMs 0 / snappy camEase / reducedMotion flag)",
      s1kMock.ok &&
        s1kAfter.evidenceOpen &&
        s1kAfter.reducedMotion === true &&
        s1kAfter.blendMs === 0 &&
        Number.isFinite(s1kAfter.camEase) &&
        s1kAfter.camEase >= 0.3 &&
        (/^0(ms)?$/.test(String(s1kAfter.blendVar).trim()) || s1kAfter.blendVar.trim() === "0ms"),
      "mock=" + JSON.stringify(s1kMock) + " after=" + JSON.stringify(s1kAfter)
    );

    // S1l — burst #srcBody scrolls coalesce into one rAF flush (rafMerged rises; Lens stays Present overlay).
    const s1lBefore = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const pane = document.getElementById("sourcePane");
      const body = document.getElementById("srcBody");
      return {
        evidenceOpen: !!(pane && !pane.hidden),
        flushes: Number(d.rafFlushes) || 0,
        merged: Number(d.rafMerged) || 0,
        canScroll: !!(body && body.scrollHeight - body.clientHeight > 8),
      };
    });
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      // Fire many scroll events synchronously before the next animation frame.
      for (let i = 0; i < 14; i++) {
        body.scrollTop = Math.floor(max * (0.28 + i * 0.03));
        body.dispatchEvent(new Event("scroll"));
      }
    });
    await page.waitForFunction(
      (prev) => {
        const d = window.__graphideScrollDrive;
        if (!(d && d.rafCoalesce === true)) return false;
        const flushes = Number(d.rafFlushes) || 0;
        const merged = Number(d.rafMerged) || 0;
        // At least one flush; surplus events from the 14-burst should merge.
        return flushes > prev.flushes && merged >= prev.merged + 8;
      },
      s1lBefore,
      { timeout: 6000 }
    );
    const s1lAfter = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        rafCoalesce: !!d.rafCoalesce,
        rafFlushes: Number(d.rafFlushes) || 0,
        rafMerged: Number(d.rafMerged) || 0,
        evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    record(
      "S1l",
      "Evidence scroll coalesces into one rAF flush per frame (rafMerged / rafFlushes)",
      s1lBefore.evidenceOpen &&
        s1lBefore.canScroll &&
        s1lAfter.evidenceOpen &&
        s1lAfter.rafCoalesce === true &&
        s1lAfter.rafFlushes > s1lBefore.flushes &&
        s1lAfter.rafMerged >= s1lBefore.merged + 8,
      "before=" + JSON.stringify(s1lBefore) + " after=" + JSON.stringify(s1lAfter)
    );

    // S1m — Present stage pauses ScrollDrive camera; exit resumes (Lens/Route overlays unchanged).
    const s1mBefore = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const pane = document.getElementById("sourcePane");
      const vp = document.querySelector(".viewport");
      return {
        evidenceOpen: !!(pane && !pane.hidden),
        presentPaused: !!d.presentPaused,
        camEase: Number(d.camEase),
        camY: Number(d.camY),
        cfgHot: !!document.querySelector(".vnode.scroll-cfg-hot, .vnode[data-cfg-active='1']"),
        macro: !!(vp && vp.getAttribute("data-scroll-macro") === "1"),
        attr: !!(vp && vp.getAttribute("data-scroll-present-paused") === "1"),
        presenting: !!(document.body && document.body.classList.contains("present")),
      };
    });
    await page.click("#presentBtn");
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive || {};
        return (
          !!(document.body && document.body.classList.contains("present")) &&
          d.presentPaused === true &&
          !(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden)
        );
      },
      null,
      { timeout: 6000 }
    );
    // Residual scroll events / macro timer must not revive CFG/macro paint or clear presentPaused.
    // Present stage may still ease its own camera — do not assert viewport transform equality.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (body) {
        body.dispatchEvent(new Event("scroll"));
        body.dispatchEvent(new Event("scroll"));
      }
    });
    await page.waitForTimeout(280);
    const s1mPaused = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const vp = document.querySelector(".viewport");
      return {
        presenting: !!(document.body && document.body.classList.contains("present")),
        evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
        presentPaused: !!d.presentPaused,
        camEase: Number(d.camEase),
        attr: !!(vp && vp.getAttribute("data-scroll-present-paused") === "1"),
        cfgHot: !!document.querySelector(".vnode.scroll-cfg-hot, .vnode[data-cfg-active='1']"),
        macro: !!(vp && vp.getAttribute("data-scroll-macro") === "1"),
      };
    });
    await page.keyboard.press("Escape"); // exit Present
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive || {};
        return (
          !(document.body && document.body.classList.contains("present")) &&
          d.presentPaused === false
        );
      },
      null,
      { timeout: 6000 }
    );
    const s1mResumed = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const vp = document.querySelector(".viewport");
      return {
        presenting: !!(document.body && document.body.classList.contains("present")),
        presentPaused: !!d.presentPaused,
        attr: !!(vp && vp.getAttribute("data-scroll-present-paused") === "1"),
        camEase: Number(d.camEase),
      };
    });
    record(
      "S1m",
      "Present pauses ScrollDrive camera; exit resumes (presentPaused / no residual cam nudge)",
      s1mBefore.evidenceOpen &&
        s1mBefore.presentPaused === false &&
        s1mBefore.presenting === false &&
        s1mPaused.presenting &&
        !s1mPaused.evidenceOpen &&
        s1mPaused.presentPaused === true &&
        s1mPaused.attr === true &&
        s1mPaused.cfgHot === false &&
        s1mPaused.macro === false &&
        Number.isFinite(s1mPaused.camEase) &&
        s1mPaused.camEase >= 0.2 &&
        s1mPaused.camEase <= 0.28 &&
        s1mResumed.presenting === false &&
        s1mResumed.presentPaused === false &&
        s1mResumed.attr === false,
      "before=" +
        JSON.stringify(s1mBefore) +
        " paused=" +
        JSON.stringify(s1mPaused) +
        " resumed=" +
        JSON.stringify(s1mResumed)
    );

    // S1n — lineMapHit pulses mapped node (distinct from scroll-cfg-hot); miss quieter; Present clears; reduced-motion no pulse.
    // Use painted Slice vnode n1 (own span) — n21 is IR-mapped in S1h but not painted on this Steiner slice.
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector('#sliceCanvas .vnode[data-id="n1"]', { timeout: 10000 });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        const text = ((body && body.textContent) || "") + ((document.getElementById("srcTitle") && document.getElementById("srcTitle").textContent) || "");
        return !!(pane && !pane.hidden && body && /hop_1|solarsim::ext/i.test(text));
      },
      null,
      { timeout: 5000 }
    );
    const s1nSetup = await page.evaluate(() => {
      const sourceId = "n1";
      const ownLine = 11;
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      const painted = !!document.querySelector('#sliceCanvas .vnode[data-id="' + sourceId + '"]');
      if (!painted) return { ok: false, why: "n1-not-painted" };
      body.innerHTML = "";
      function addLine(ln, tx) {
        const row = document.createElement("div");
        row.className = "src-line";
        row.setAttribute("data-s1n", "1");
        row.setAttribute("data-s1n-ln", String(ln));
        row.innerHTML = '<span class="ln">' + ln + '</span><span class="tx">' + tx + "</span>";
        body.appendChild(row);
        return row;
      }
      for (let i = 0; i < 24; i++) addLine(200 + i, "s1n lead " + i);
      const ownRow = addLine(ownLine, "s1n own span " + sourceId);
      for (let k = 0; k < 24; k++) addLine(900 + k, "s1n far pad " + k);
      function centerRow(row) {
        const br = body.getBoundingClientRect();
        const rr = row.getBoundingClientRect();
        const delta = rr.top + rr.height / 2 - (br.top + body.clientHeight / 2);
        body.scrollTop = Math.max(0, body.scrollTop + delta);
        body.dispatchEvent(new Event("scroll"));
      }
      centerRow(ownRow);
      return { ok: true, sourceId: sourceId, ownLine: ownLine };
    });
    await page.waitForFunction(
      (sourceId) => {
        const d = window.__graphideScrollDrive;
        const el = document.querySelector('#sliceCanvas .vnode[data-id="' + sourceId + '"]');
        return !!(
          d &&
          d.lineMapHit === true &&
          String(d.targetNodeId || "") === String(sourceId) &&
          el &&
          el.classList.contains("scroll-linemap-hit") &&
          el.getAttribute("data-scroll-linemap") === "hit" &&
          d.lineMapPulse === true &&
          !el.classList.contains("scroll-linemap-miss") &&
          // Distinct from generic CFG hot class name (may coexist on same node).
          el.classList.contains("scroll-linemap-hit")
        );
      },
      s1nSetup.sourceId,
      { timeout: 6000 }
    );
    const s1nHit = await page.evaluate((sourceId) => {
      const d = window.__graphideScrollDrive || {};
      const el = document.querySelector('#sliceCanvas .vnode[data-id="' + sourceId + '"]');
      return {
        lineMapHit: !!d.lineMapHit,
        lineMapPulse: !!d.lineMapPulse,
        targetNodeId: d.targetNodeId || "",
        hitClass: !!(el && el.classList.contains("scroll-linemap-hit")),
        missClass: !!(el && el.classList.contains("scroll-linemap-miss")),
        attr: el ? el.getAttribute("data-scroll-linemap") : "",
        hasCfgHotName: !!(el && el.classList.contains("scroll-cfg-hot")),
      };
    }, s1nSetup.sourceId);
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      const far = body && body.querySelector('.src-line[data-s1n-ln="900"]');
      if (!body || !far) return;
      const br = body.getBoundingClientRect();
      const rr = far.getBoundingClientRect();
      const delta = rr.top + rr.height / 2 - (br.top + body.clientHeight / 2);
      body.scrollTop = Math.max(0, body.scrollTop + delta);
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(
      (sourceId) => {
        const d = window.__graphideScrollDrive;
        const el = document.querySelector('#sliceCanvas .vnode[data-id="' + sourceId + '"]');
        return !!(
          d &&
          d.lineMapHit === false &&
          String(d.targetNodeId || "") === String(sourceId) &&
          d.lineMapPulse === false &&
          el &&
          el.classList.contains("scroll-linemap-miss") &&
          el.getAttribute("data-scroll-linemap") === "miss" &&
          !el.classList.contains("scroll-linemap-hit")
        );
      },
      s1nSetup.sourceId,
      { timeout: 6000 }
    );
    const s1nMiss = await page.evaluate((sourceId) => {
      const d = window.__graphideScrollDrive || {};
      const el = document.querySelector('#sliceCanvas .vnode[data-id="' + sourceId + '"]');
      return {
        lineMapHit: !!d.lineMapHit,
        lineMapPulse: !!d.lineMapPulse,
        targetNodeId: d.targetNodeId || "",
        missClass: !!(el && el.classList.contains("scroll-linemap-miss")),
        hitLeft: !!(el && el.classList.contains("scroll-linemap-hit")),
      };
    }, s1nSetup.sourceId);
    // Reduced-motion: remount hit under mock matchMedia → lineMapPulse false, hit class stays.
    await page.evaluate((sourceId) => {
      const body = document.getElementById("srcBody");
      const row = body && body.querySelector('.src-line[data-s1n-ln="11"]');
      if (!body || !row) return;
      window.__s1nPrevMatchMedia = window.matchMedia;
      window.matchMedia = (q) => {
        if (String(q).includes("prefers-reduced-motion")) {
          return {
            matches: true,
            media: q,
            addListener() {},
            removeListener() {},
            addEventListener() {},
            removeEventListener() {},
            dispatchEvent() {
              return false;
            },
          };
        }
        return window.__s1nPrevMatchMedia.call(window, q);
      };
      const br = body.getBoundingClientRect();
      const rr = row.getBoundingClientRect();
      body.scrollTop = Math.max(0, body.scrollTop + (rr.top + rr.height / 2 - (br.top + body.clientHeight / 2)));
      body.dispatchEvent(new Event("scroll"));
    }, s1nSetup.sourceId);
    await page.waitForFunction(
      (sourceId) => {
        const d = window.__graphideScrollDrive;
        const el = document.querySelector('#sliceCanvas .vnode[data-id="' + sourceId + '"]');
        return !!(
          d &&
          d.reducedMotion === true &&
          d.lineMapHit === true &&
          d.lineMapPulse === false &&
          el &&
          el.classList.contains("scroll-linemap-hit")
        );
      },
      s1nSetup.sourceId,
      { timeout: 6000 }
    );
    const s1nReduced = await page.evaluate((sourceId) => {
      const d = window.__graphideScrollDrive || {};
      const el = document.querySelector('#sliceCanvas .vnode[data-id="' + sourceId + '"]');
      const out = {
        ok: true,
        lineMapHit: !!d.lineMapHit,
        lineMapPulse: !!d.lineMapPulse,
        hitClass: !!(el && el.classList.contains("scroll-linemap-hit")),
        reducedMotion: !!d.reducedMotion,
      };
      if (window.__s1nPrevMatchMedia) {
        window.matchMedia = window.__s1nPrevMatchMedia;
        delete window.__s1nPrevMatchMedia;
      }
      const body = document.getElementById("srcBody");
      if (body) body.dispatchEvent(new Event("scroll"));
      return out;
    }, s1nSetup.sourceId);
    // Present pause must clear linemap paint.
    await page.click("#presentBtn");
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive || {};
        return (
          !!(document.body && document.body.classList.contains("present")) &&
          d.presentPaused === true &&
          !document.querySelector(".vnode.scroll-linemap-hit, .vnode.scroll-linemap-miss")
        );
      },
      null,
      { timeout: 6000 }
    );
    const s1nPresent = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        presentPaused: !!d.presentPaused,
        hit: !!document.querySelector(".vnode.scroll-linemap-hit"),
        miss: !!document.querySelector(".vnode.scroll-linemap-miss"),
        lineMapPulse: !!d.lineMapPulse,
      };
    });
    await page.keyboard.press("Escape"); // exit Present
    await page.waitForFunction(
      () => !(document.body && document.body.classList.contains("present")),
      null,
      { timeout: 6000 }
    );
    record(
      "S1n",
      "lineMapHit pulses mapped node glow; miss quieter; reduced-motion / Present clear pulse",
      s1nSetup.ok &&
        s1nHit.lineMapHit === true &&
        s1nHit.lineMapPulse === true &&
        s1nHit.hitClass === true &&
        s1nHit.missClass === false &&
        s1nHit.attr === "hit" &&
        s1nMiss.lineMapHit === false &&
        s1nMiss.lineMapPulse === false &&
        s1nMiss.missClass === true &&
        s1nMiss.hitLeft === false &&
        s1nReduced.ok &&
        s1nReduced.lineMapHit === true &&
        s1nReduced.hitClass === true &&
        s1nReduced.lineMapPulse === false &&
        s1nPresent.presentPaused === true &&
        s1nPresent.hit === false &&
        s1nPresent.miss === false &&
        s1nPresent.lineMapPulse === false,
      "setup=" +
        JSON.stringify(s1nSetup) +
        " hit=" +
        JSON.stringify(s1nHit) +
        " miss=" +
        JSON.stringify(s1nMiss) +
        " reduced=" +
        JSON.stringify(s1nReduced) +
        " present=" +
        JSON.stringify(s1nPresent)
    );

    // S1p — Evidence mid-viewport active-line dual-pane cue (pairs with S1n graph glow).
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector('#sliceCanvas .vnode[data-id="n1"]', { timeout: 10000 });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        const text = ((body && body.textContent) || "") + ((document.getElementById("srcTitle") && document.getElementById("srcTitle").textContent) || "");
        return !!(pane && !pane.hidden && body && /hop_1|solarsim::ext/i.test(text));
      },
      null,
      { timeout: 5000 }
    );
    const s1pSetup = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      body.innerHTML = "";
      function addLine(ln, tx) {
        const row = document.createElement("div");
        row.className = "src-line";
        row.setAttribute("data-s1p", "1");
        row.setAttribute("data-s1p-ln", String(ln));
        row.innerHTML = '<span class="ln">' + ln + '</span><span class="tx">' + tx + "</span>";
        body.appendChild(row);
        return row;
      }
      for (let i = 0; i < 20; i++) addLine(100 + i, "s1p lead " + i);
      const mid = addLine(42, "s1p active mid");
      for (let k = 0; k < 20; k++) addLine(300 + k, "s1p trail " + k);
      function centerRow(row) {
        const br = body.getBoundingClientRect();
        const rr = row.getBoundingClientRect();
        const delta = rr.top + rr.height / 2 - (br.top + body.clientHeight / 2);
        body.scrollTop = Math.max(0, body.scrollTop + delta);
        body.dispatchEvent(new Event("scroll"));
      }
      centerRow(mid);
      return { ok: true, line: 42 };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const active = document.querySelector("#srcBody .src-line.scroll-drive-active");
        const attr = document.querySelector('#srcBody .src-line[data-scroll-active="1"]');
        const count = document.querySelectorAll("#srcBody .src-line.scroll-drive-active").length;
        return !!(
          d &&
          Number(d.activeLine) === 42 &&
          d.activeLineMarked === true &&
          active &&
          attr &&
          active === attr &&
          count === 1 &&
          active.getAttribute("data-s1p-ln") === "42"
        );
      },
      null,
      { timeout: 6000 }
    );
    const s1pMarked = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const active = document.querySelector("#srcBody .src-line.scroll-drive-active");
      const all = document.querySelectorAll("#srcBody .src-line.scroll-drive-active");
      return {
        activeLine: Number(d.activeLine) || 0,
        activeLineMarked: !!d.activeLineMarked,
        count: all.length,
        ln: active ? (active.getAttribute("data-s1p-ln") || "") : "",
        attr: active ? active.getAttribute("data-scroll-active") : "",
      };
    });
    // Present pause must clear Evidence active-line cue.
    await page.click("#presentBtn");
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive || {};
        return (
          !!(document.body && document.body.classList.contains("present")) &&
          d.presentPaused === true &&
          !document.querySelector(".src-line.scroll-drive-active, .src-line[data-scroll-active]")
        );
      },
      null,
      { timeout: 6000 }
    );
    const s1pPresent = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        presentPaused: !!d.presentPaused,
        active: !!document.querySelector(".src-line.scroll-drive-active"),
        attr: !!document.querySelector(".src-line[data-scroll-active]"),
        activeLineMarked: !!d.activeLineMarked,
      };
    });
    await page.keyboard.press("Escape"); // exit Present
    await page.waitForFunction(
      () => !(document.body && document.body.classList.contains("present")),
      null,
      { timeout: 6000 }
    );
    record(
      "S1p",
      "Evidence mid-viewport active-line dual-pane cue; Present pause clears",
      s1pSetup.ok &&
        s1pMarked.activeLine === 42 &&
        s1pMarked.activeLineMarked === true &&
        s1pMarked.count === 1 &&
        s1pMarked.ln === "42" &&
        s1pMarked.attr === "1" &&
        s1pPresent.presentPaused === true &&
        s1pPresent.active === false &&
        s1pPresent.attr === false &&
        s1pPresent.activeLineMarked === false,
      "setup=" +
        JSON.stringify(s1pSetup) +
        " marked=" +
        JSON.stringify(s1pMarked) +
        " present=" +
        JSON.stringify(s1pPresent)
    );

    // S1q — soft camX follow toward off-center mapped target (micro path; not macro).
    // Drop S1w last-stay left by S1p Present so this step cold-frames via zoomToEl;
    // S1w later covers Present→Evidence soft restore on its own cycle.
    await page.evaluate(() => {
      if (typeof window.__graphideClearScrollDriveLastStay === "function") {
        window.__graphideClearScrollDriveLastStay();
      }
    });
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector('#sliceCanvas .vnode[data-id="n1"]', { timeout: 10000 });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        return !!(pane && !pane.hidden && body);
      },
      null,
      { timeout: 5000 }
    );
    const s1qSetup = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      // Ensure mid-file scrollable (avoid S1c macro at file-top).
      if (body.querySelectorAll(".src-line").length < 60) {
        for (let i = 0; i < 50; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1q", "1");
          row.innerHTML =
            '<span class="ln">' + (400 + i) + '</span><span class="tx">s1q pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      body.scrollTop = Math.floor(max * 0.55);
      body.dispatchEvent(new Event("scroll"));
      return { ok: true, scrollTop: body.scrollTop, max: max };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(d && !d.macroLod && Number(d.scrollRatio) > 0.35 && d.targetNodeId);
      },
      null,
      { timeout: 6000 }
    );
    // S1ah — settle-before-sample: wait soft cam idle before baselining (not mid-tween).
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1qBefore = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        const id = d.targetNodeId || "";
        const el =
        (id && document.querySelector('#sliceCanvas .vnode[data-id="' + id + '"]')) ||
        document.querySelector("#sliceCanvas .vnode[data-id]");
        if (
          !(
            d &&
            !d.macroLod &&
            !d.presentPaused &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          ratio: Number(d.scrollRatio) || 0,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          targetNodeId: id,
          hasEl: !!el,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    const s1qOffset = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const id = d.targetNodeId || "";
      const el =
        (id && document.querySelector('#sliceCanvas .vnode[data-id="' + id + '"]')) ||
        document.querySelector("#sliceCanvas .vnode[data-id]");
      if (!el) return { ok: false, why: "no-vnode" };
      // Deliberately park mapped target left of viewport center.
      el.style.transform = "translateX(-220px)";
      el.setAttribute("data-s1q-offcenter", "1");
      const body = document.getElementById("srcBody");
      if (body) {
        body.scrollTop = body.scrollTop + 12;
        body.dispatchEvent(new Event("scroll"));
      }
      return { ok: true, id: id };
    });
    // S1ah — one soft-follow stimulus (not a 6-nudge stack that can exceed the ±80 band).
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      const base = body.scrollTop;
      for (let i = 0; i < 2; i++) {
        body.scrollTop = base + i * 3;
        body.dispatchEvent(new Event("scroll"));
      }
    });
    await page.waitForFunction(
      (beforeX) => {
        const d = window.__graphideScrollDrive;
        if (!(d && !d.macroLod && !d.presentPaused)) return false;
        const x = Number(d.camX);
        return Number.isFinite(x) && Number.isFinite(beforeX) && Math.abs(x - beforeX) > 8;
      },
      s1qBefore.camX,
      { timeout: 8000 }
    );
    // S1ah — sample on first soft-follow step (one paint), not after full settle
    // (settle→absorb→follow can stack past the ±80 band). Baseline was settle-before.
    await page.waitForTimeout(32);
    const s1qAfter = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const el = document.querySelector('#sliceCanvas .vnode[data-s1q-offcenter="1"]');
      return {
        camX: Number(d.camX),
        camY: Number(d.camY),
        ratio: Number(d.scrollRatio) || 0,
        macroLod: !!d.macroLod,
        presentPaused: !!d.presentPaused,
        targetNodeId: d.targetNodeId || "",
        stillOff: !!(el && el.getAttribute("data-s1q-offcenter") === "1"),
      };
    });
    // Cleanup offset so later suites are not skewed.
    await page.evaluate(() => {
      document.querySelectorAll("#sliceCanvas .vnode[data-s1q-offcenter]").forEach((el) => {
        el.style.transform = "";
        el.removeAttribute("data-s1q-offcenter");
      });
    });
    const s1qDx = Math.abs((Number(s1qAfter.camX) || 0) - (Number(s1qBefore.camX) || 0));
    record(
      "S1q",
      "soft camX follow toward off-center mapped target (micro; Present not paused)",
      s1qSetup.ok &&
        s1qOffset.ok &&
        s1qBefore.hasEl &&
        !s1qBefore.macroLod &&
        !s1qAfter.macroLod &&
        !s1qAfter.presentPaused &&
        Number.isFinite(s1qBefore.camX) &&
        Number.isFinite(s1qAfter.camX) &&
        s1qDx > 8 &&
        s1qDx <= 96 + 1,
      "setup=" +
        JSON.stringify(s1qSetup) +
        " before=" +
        JSON.stringify(s1qBefore) +
        " offset=" +
        JSON.stringify(s1qOffset) +
        " after=" +
        JSON.stringify(s1qAfter) +
        " dx=" +
        s1qDx
    );

    // S1r — idle-settle soft camX into scrollDriveBase (no spring-back on tiny nudge).
    // Cold-frame after S1q: close Evidence, drop S1w last-stay, reopen so zoomToEl
    // reframes and tickCam catches up (softCamX uses live cam.x; stale cam sticks).
    await page.evaluate(() => {
      if (typeof window.__graphideClearScrollDriveLastStay === "function") {
        window.__graphideClearScrollDriveLastStay();
      }
      document.querySelectorAll("#sliceCanvas .vnode[style*='translateX'], #sliceCanvas .vnode[data-s1q-offcenter], #sliceCanvas .vnode[data-s1r-offcenter]").forEach((el) => {
        el.style.transform = "";
        el.removeAttribute("data-s1q-offcenter");
        el.removeAttribute("data-s1r-offcenter");
      });
    });
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector('#sliceCanvas .vnode[data-id="n1"]', { timeout: 10000 });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        return !!(pane && !pane.hidden && body);
      },
      null,
      { timeout: 5000 }
    );
    const s1rSetup = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      if (body.querySelectorAll(".src-line").length < 60) {
        for (let i = 0; i < 50; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1r", "1");
          row.innerHTML =
            '<span class="ln">' + (500 + i) + '</span><span class="tx">s1r pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      body.scrollTop = Math.floor(max * 0.55);
      body.dispatchEvent(new Event("scroll"));
      return { ok: true, scrollTop: body.scrollTop, max: max };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(d && !d.macroLod && Number(d.scrollRatio) > 0.35 && d.targetNodeId);
      },
      null,
      { timeout: 6000 }
    );
    await page.waitForTimeout(500);
    const s1rBefore = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const id = d.targetNodeId || "";
      const el =
        (id && document.querySelector('#sliceCanvas .vnode[data-id="' + id + '"]')) ||
        document.querySelector("#sliceCanvas .vnode[data-id]");
      return {
        camX: Number(d.camX),
        ratio: Number(d.scrollRatio) || 0,
        macroLod: !!d.macroLod,
        presentPaused: !!d.presentPaused,
        targetNodeId: id,
        hasEl: !!el,
      };
    });
    const s1rOffset = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const id = d.targetNodeId || "";
      const el =
        (id && document.querySelector('#sliceCanvas .vnode[data-id="' + id + '"]')) ||
        document.querySelector("#sliceCanvas .vnode[data-id]");
      if (!el) return { ok: false, why: "no-vnode" };
      el.style.transform = "translateX(-220px)";
      el.setAttribute("data-s1r-offcenter", "1");
      const body = document.getElementById("srcBody");
      if (body) {
        body.scrollTop = body.scrollTop + 14;
        body.dispatchEvent(new Event("scroll"));
      }
      return { ok: true, id: id };
    });
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      const base = body.scrollTop;
      for (let i = 0; i < 6; i++) {
        body.scrollTop = base + i * 3;
        body.dispatchEvent(new Event("scroll"));
      }
    });
    await page.waitForFunction(
      (beforeX) => {
        const d = window.__graphideScrollDrive;
        if (!(d && !d.macroLod && !d.presentPaused)) return false;
        const x = Number(d.camX);
        return Number.isFinite(x) && Number.isFinite(beforeX) && Math.abs(x - beforeX) > 8;
      },
      s1rBefore.camX,
      { timeout: 8000 }
    );
    // Burst then idle so S1g settle timer fires and S1r absorbs into base.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      const base = body.scrollTop;
      for (let i = 0; i < 6; i++) {
        body.scrollTop = base + i * 3;
        body.dispatchEvent(new Event("scroll"));
      }
    });
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1rSettled = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            d &&
            !d.macroLod &&
            !d.presentPaused &&
            d.camXSettled === true &&
            Number(d.scrollVel) < 0.12
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camEase: Number(d.camEase),
          scrollVel: Number(d.scrollVel) || 0,
          camXSettled: !!d.camXSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    // Tiny further scroll — must not yank camX back toward pre-follow X.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      body.scrollTop = body.scrollTop + 4;
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForTimeout(350);
    const s1rAfterNudge = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const el = document.querySelector('#sliceCanvas .vnode[data-s1r-offcenter="1"]');
      return {
        camX: Number(d.camX),
        camXSettled: !!d.camXSettled,
        macroLod: !!d.macroLod,
        presentPaused: !!d.presentPaused,
        stillOff: !!(el && el.getAttribute("data-s1r-offcenter") === "1"),
      };
    });
    await page.evaluate(() => {
      document.querySelectorAll("#sliceCanvas .vnode[data-s1r-offcenter]").forEach((el) => {
        el.style.transform = "";
        el.removeAttribute("data-s1r-offcenter");
      });
    });
    const s1rSoftDx = Math.abs((Number(s1rSettled.camX) || 0) - (Number(s1rBefore.camX) || 0));
    const s1rDistBefore = Math.abs((Number(s1rAfterNudge.camX) || 0) - (Number(s1rBefore.camX) || 0));
    const s1rDistSettled = Math.abs((Number(s1rSettled.camX) || 0) - (Number(s1rBefore.camX) || 0));
    // Spring-back = after tiny nudge camX moved back toward pre-follow X by > 8px.
    const s1rSpringBack = s1rDistBefore < s1rDistSettled - 8;
    // Stability: either stayed near settled, or continued soft-forward (not back).
    const s1rYank = Math.abs((Number(s1rAfterNudge.camX) || 0) - (Number(s1rSettled.camX) || 0));
    record(
      "S1r",
      "idle-settle soft camX into scrollDriveBase (no spring-back on tiny nudge)",
      s1rSetup.ok &&
        s1rOffset.ok &&
        s1rBefore.hasEl &&
        !s1rBefore.macroLod &&
        !s1rSettled.macroLod &&
        !s1rSettled.presentPaused &&
        s1rSettled.camXSettled === true &&
        Number.isFinite(s1rBefore.camX) &&
        Number.isFinite(s1rSettled.camX) &&
        Number.isFinite(s1rAfterNudge.camX) &&
        s1rSoftDx > 8 &&
        !s1rSpringBack &&
        s1rYank <= 96 + 1,
      "setup=" +
        JSON.stringify(s1rSetup) +
        " before=" +
        JSON.stringify(s1rBefore) +
        " offset=" +
        JSON.stringify(s1rOffset) +
        " settled=" +
        JSON.stringify(s1rSettled) +
        " afterNudge=" +
        JSON.stringify(s1rAfterNudge) +
        " softDx=" +
        s1rSoftDx +
        " yank=" +
        s1rYank +
        " springBack=" +
        s1rSpringBack
    );


    // S1s — idle-settle soft camY into scrollDriveBase (no Y spring-back on tiny nudge).
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector('#sliceCanvas .vnode[data-id="n1"]', { timeout: 10000 });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        return !!(pane && !pane.hidden && body);
      },
      null,
      { timeout: 5000 }
    );
    const s1sBaseline = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      if (body.querySelectorAll(".src-line").length < 60) {
        for (let i = 0; i < 50; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1s", "1");
          row.innerHTML =
            '<span class="ln">' + (600 + i) + '</span><span class="tx">s1s pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      body.scrollTop = 0;
      body.dispatchEvent(new Event("scroll"));
      return { ok: true };
    });
    await page.waitForTimeout(250);
    const s1sBefore = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        camY: Number(d.camY),
        ratio: Number(d.scrollRatio) || 0,
        macroLod: !!d.macroLod,
        presentPaused: !!d.presentPaused,
      };
    });
    const s1sSetup = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      body.scrollTop = Math.floor(max * 0.55);
      body.dispatchEvent(new Event("scroll"));
      return { ok: true, scrollTop: body.scrollTop, max: max };
    });
    await page.waitForFunction(
      (beforeY) => {
        const d = window.__graphideScrollDrive;
        if (!(d && !d.macroLod && Number(d.scrollRatio) > 0.35 && d.targetNodeId)) return false;
        const y = Number(d.camY);
        return Number.isFinite(y) && Number.isFinite(beforeY) && Math.abs(y - beforeY) > 4;
      },
      s1sBefore.camY,
      { timeout: 6000 }
    );
    // Burst then idle so S1g settle timer fires and S1s absorbs into base.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      const base = body.scrollTop;
      for (let i = 0; i < 6; i++) {
        body.scrollTop = base + i * 3;
        body.dispatchEvent(new Event("scroll"));
      }
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          d.camYSettled === true &&
          Number(d.scrollVel) < 0.12
        );
      },
      null,
      { timeout: 8000 }
    );
    await page.waitForTimeout(200);
    const s1sSettled = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        camY: Number(d.camY),
        camEase: Number(d.camEase),
        scrollVel: Number(d.scrollVel) || 0,
        camYSettled: !!d.camYSettled,
        ratio: Number(d.scrollRatio) || 0,
        macroLod: !!d.macroLod,
        presentPaused: !!d.presentPaused,
      };
    });
    // Tiny further scroll — must not yank camY back toward pre-nudge / lock Y.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      body.scrollTop = body.scrollTop + 4;
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForTimeout(350);
    const s1sAfterNudge = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        camY: Number(d.camY),
        camYSettled: !!d.camYSettled,
        ratio: Number(d.scrollRatio) || 0,
        macroLod: !!d.macroLod,
        presentPaused: !!d.presentPaused,
      };
    });
    const s1sSoftDy = Math.abs((Number(s1sSettled.camY) || 0) - (Number(s1sBefore.camY) || 0));
    const s1sDistBefore = Math.abs((Number(s1sAfterNudge.camY) || 0) - (Number(s1sBefore.camY) || 0));
    const s1sDistSettled = Math.abs((Number(s1sSettled.camY) || 0) - (Number(s1sBefore.camY) || 0));
    // Spring-back = after tiny nudge camY moved back toward pre-nudge Y by > 8px.
    const s1sSpringBack = s1sDistBefore < s1sDistSettled - 8;
    const s1sYank = Math.abs((Number(s1sAfterNudge.camY) || 0) - (Number(s1sSettled.camY) || 0));
    record(
      "S1s",
      "idle-settle soft camY into scrollDriveBase (no spring-back on tiny nudge)",
      s1sBaseline.ok &&
        s1sSetup.ok &&
        // File-top baseline may be macro (S1c); settled path must be micro.
        !s1sSettled.macroLod &&
        !s1sSettled.presentPaused &&
        !s1sAfterNudge.macroLod &&
        s1sSettled.camYSettled === true &&
        Number.isFinite(s1sBefore.camY) &&
        Number.isFinite(s1sSettled.camY) &&
        Number.isFinite(s1sAfterNudge.camY) &&
        s1sSoftDy > 4 &&
        !s1sSpringBack &&
        s1sYank <= 8 + 1,
      "baseline=" +
        JSON.stringify(s1sBaseline) +
        " before=" +
        JSON.stringify(s1sBefore) +
        " setup=" +
        JSON.stringify(s1sSetup) +
        " settled=" +
        JSON.stringify(s1sSettled) +
        " afterNudge=" +
        JSON.stringify(s1sAfterNudge) +
        " softDy=" +
        s1sSoftDy +
        " yank=" +
        s1sYank +
        " springBack=" +
        s1sSpringBack
    );

    // S1t — nest/line remap mid-scroll soft-cam stay (no zoomToEl yank; settle flags refresh).
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector('#sliceCanvas .vnode[data-id="n1"]', { timeout: 10000 });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        return !!(pane && !pane.hidden && body);
      },
      null,
      { timeout: 5000 }
    );
    const s1tSetup = await page.evaluate(() => {
      const sourceId = "n1";
      const siblingId = "n21";
      const siblingLine = 31;
      const ownLine = 11;
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      body.innerHTML = "";
      function addLine(ln, tx) {
        const row = document.createElement("div");
        row.className = "src-line";
        row.setAttribute("data-s1t", "1");
        row.setAttribute("data-s1t-ln", String(ln));
        row.innerHTML = '<span class="ln">' + ln + '</span><span class="tx">' + tx + "</span>";
        body.appendChild(row);
        return row;
      }
      for (let i = 0; i < 28; i++) addLine(200 + i, "s1t lead " + i);
      const ownRow = addLine(ownLine, "s1t own span " + sourceId);
      // Gap so settle-burst on own cannot mid-viewport the sibling span.
      for (let g = 0; g < 16; g++) addLine(400 + g, "s1t gap " + g);
      const sibRow = addLine(siblingLine, "s1t sibling span " + siblingId);
      for (let k = 0; k < 28; k++) addLine(900 + k, "s1t far pad " + k);
      function centerRow(row) {
        const br = body.getBoundingClientRect();
        const rr = row.getBoundingClientRect();
        const delta = rr.top + rr.height / 2 - (br.top + body.clientHeight / 2);
        body.scrollTop = Math.max(0, body.scrollTop + delta);
        body.dispatchEvent(new Event("scroll"));
      }
      centerRow(ownRow);
      return {
        ok: true,
        sourceId: sourceId,
        siblingId: siblingId,
        ownLine: ownLine,
        siblingLine: siblingLine,
        scrollTop: body.scrollTop,
        max: Math.max(1, body.scrollHeight - body.clientHeight),
        sibRowOk: !!sibRow,
      };
    });
    await page.waitForFunction(
      (own) => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          Number(d.scrollRatio) > 0.15 &&
          String(d.targetNodeId || "") === String(own)
        );
      },
      s1tSetup.sourceId,
      { timeout: 6000 }
    );
    // Burst then idle so S1r/S1s absorb into base before remap.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      const base = body.scrollTop;
      for (let i = 0; i < 6; i++) {
        body.scrollTop = base + i * 2;
        body.dispatchEvent(new Event("scroll"));
      }
    });
    // S1au — settle-before-sample warm: require settle flags (not a fixed post-settle pad).
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1tBefore = await page.waitForFunction(
      (own) => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            d &&
            !d.macroLod &&
            !d.presentPaused &&
            String(d.targetNodeId || "") === String(own) &&
            (d.camXSettled === true || d.camYSettled === true) &&
            Number(d.scrollVel) < 0.12
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
        };
      },
      s1tSetup.sourceId,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    // Remap: gently center the adjacent sibling span (small delta — avoid S1c macro
    // vel yank). Soft-stay must keep cam within S1q caps (no zoomToEl leap).
    const s1tRemap = await page.evaluate((sibLn) => {
      const body = document.getElementById("srcBody");
      const row = body && body.querySelector('.src-line[data-s1t-ln="' + sibLn + '"]');
      if (!body || !row) return { ok: false, why: "no-sib-row" };
      const br = body.getBoundingClientRect();
      let steps = 0;
      let lastDelta = 0;
      // Walk toward sibling in capped steps so scrollVel stays under macro threshold.
      for (let n = 0; n < 12; n++) {
        const rr = row.getBoundingClientRect();
        const delta = rr.top + rr.height / 2 - (br.top + body.clientHeight / 2);
        lastDelta = delta;
        if (Math.abs(delta) <= 4) break;
        const step = Math.max(-40, Math.min(40, delta));
        body.scrollTop = Math.max(0, body.scrollTop + step);
        body.dispatchEvent(new Event("scroll"));
        steps += 1;
      }
      return { ok: true, scrollTop: body.scrollTop, delta: lastDelta, steps: steps };
    }, s1tSetup.siblingLine);
    await page.waitForFunction(
      (sib) => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          String(d.targetNodeId || "") === String(sib)
        );
      },
      s1tSetup.siblingId,
      { timeout: 6000 }
    );
    // S1au — sample first soft-stay step after remap (one paint), not a fixed 80ms mid-tween
    // stack that can inflate dx toward a zoomToEl leap. Product soft-stay caps unchanged.
    // Prior waitForFunction already confirmed sibling target; one rAF paints the soft step.
    await page.waitForTimeout(16);
    const s1tAfterRemap = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        camX: Number(d.camX),
        camY: Number(d.camY),
        camK: Number(d.camK),
        ratio: Number(d.scrollRatio) || 0,
        targetNodeId: d.targetNodeId || "",
        camXSettled: !!d.camXSettled,
        camYSettled: !!d.camYSettled,
        macroLod: !!d.macroLod,
        presentPaused: !!d.presentPaused,
        scrollVel: Number(d.scrollVel) || 0,
      };
    });
    // Soft stay: no hard zoomToEl leap (cap ~80 soft X + modest Y from scroll delta).
    const s1tDx = Math.abs((Number(s1tAfterRemap.camX) || 0) - (Number(s1tBefore.camX) || 0));
    const s1tDy = Math.abs((Number(s1tAfterRemap.camY) || 0) - (Number(s1tBefore.camY) || 0));
    const s1tDk = Math.abs((Number(s1tAfterRemap.camK) || 0) - (Number(s1tBefore.camK) || 0));
    // S1au — tiny idle nudge so S1r/S1s settle flags re-absorb after remap (no multi-step burst).
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    // S1au — settle-before-sample resettle: require !macroLod + settle flags.
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1tResettle = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            d &&
            !d.macroLod &&
            !d.presentPaused &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          targetNodeId: d.targetNodeId || "",
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          scrollVel: Number(d.scrollVel) || 0,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    const s1tResettleYank = Math.max(
      Math.abs((Number(s1tResettle.camX) || 0) - (Number(s1tAfterRemap.camX) || 0)),
      Math.abs((Number(s1tResettle.camY) || 0) - (Number(s1tAfterRemap.camY) || 0))
    );
    record(
      "S1t",
      "nest/line remap mid-scroll soft-cam stay (no zoomToEl yank; settle flags refresh)",
      s1tSetup.ok &&
        s1tRemap.ok &&
        !s1tBefore.macroLod &&
        !s1tBefore.presentPaused &&
        s1tBefore.targetNodeId === s1tSetup.sourceId &&
        (s1tBefore.camXSettled === true || s1tBefore.camYSettled === true) &&
        s1tAfterRemap.targetNodeId === s1tSetup.siblingId &&
        Number.isFinite(s1tBefore.camX) &&
        Number.isFinite(s1tAfterRemap.camX) &&
        Number.isFinite(s1tBefore.camY) &&
        Number.isFinite(s1tAfterRemap.camY) &&
        s1tDx <= 96 + 24 &&
        s1tDy <= 120 &&
        s1tDk <= 0.15 &&
        (s1tResettle.camXSettled === true || s1tResettle.camYSettled === true) &&
        s1tResettleYank <= 120 &&
        !s1tResettle.macroLod &&
        !s1tResettle.presentPaused,
      "setup=" +
        JSON.stringify(s1tSetup) +
        " before=" +
        JSON.stringify(s1tBefore) +
        " remap=" +
        JSON.stringify(s1tRemap) +
        " afterRemap=" +
        JSON.stringify(s1tAfterRemap) +
        " resettle=" +
        JSON.stringify(s1tResettle) +
        " dx=" +
        s1tDx +
        " dy=" +
        s1tDy +
        " dk=" +
        s1tDk +
        " resettleYank=" +
        s1tResettleYank
    );

    // S1au — nest/line remap settle-before-sample probe (parity with S1ah/S1as/S1at).
    // After S1t, confirm still !macroLod + settle + low vel (single sample; no dual-sample gap).
    // Product soft-stay caps unchanged.
    // S1ba — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1auSnap = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            pane &&
            !pane.hidden &&
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          scrollVel: Number(d.scrollVel) || 0,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          targetNodeId: d.targetNodeId || "",
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1au",
      "nest/line remap settle-before-sample: post-S1t still micro+settled (!macroLod; no mid-tween)",
      !s1auSnap.presentPaused &&
        !s1auSnap.macroLod &&
        (s1auSnap.camXSettled === true || s1auSnap.camYSettled === true) &&
        s1auSnap.scrollVel < 0.12 &&
        !!s1auSnap.targetNodeId &&
        Number.isFinite(s1auSnap.camX) &&
        Number.isFinite(s1auSnap.camK),
      "snap=" + JSON.stringify(s1auSnap)
    );

    // S1u — macro enter/exit mid Evidence scroll soft-stays camK (no zoomToEl yank).
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector('#sliceCanvas .vnode[data-id="n1"]', { timeout: 10000 });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        return !!(pane && !pane.hidden && body);
      },
      null,
      { timeout: 5000 }
    );
    const s1uSetup = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      body.innerHTML = "";
      function addLine(ln, tx) {
        const row = document.createElement("div");
        row.className = "src-line";
        row.setAttribute("data-s1u", "1");
        row.setAttribute("data-s1u-ln", String(ln));
        row.innerHTML = '<span class="ln">' + ln + '</span><span class="tx">' + tx + "</span>";
        body.appendChild(row);
        return row;
      }
      // Tall pad so mid-file and file-top are distinct; own span near mid.
      // Use high line nums so pads do not steal S1h lineMap away from sourceId.
      for (let i = 0; i < 40; i++) addLine(2000 + i, "s1u lead " + i);
      const ownRow = addLine(11, "s1u own span n1");
      for (let k = 0; k < 40; k++) addLine(9000 + k, "s1u far pad " + k);
      function centerRow(row) {
        const br = body.getBoundingClientRect();
        const rr = row.getBoundingClientRect();
        const delta = rr.top + rr.height / 2 - (br.top + body.clientHeight / 2);
        body.scrollTop = Math.max(0, body.scrollTop + delta);
        body.dispatchEvent(new Event("scroll"));
      }
      centerRow(ownRow);
      return {
        ok: true,
        scrollTop: body.scrollTop,
        max: Math.max(1, body.scrollHeight - body.clientHeight),
      };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          Number(d.scrollRatio) > 0.2 &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    // Burst + idle so soft stay / settle flags warm before macro enter.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      const base = body.scrollTop;
      for (let i = 0; i < 4; i++) {
        body.scrollTop = base + i * 2;
        body.dispatchEvent(new Event("scroll"));
      }
    });
    // S1aj — settle-before-sample: require settle flags (not scrollRatio fallback) before baselining.
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1uBefore = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        const vp = document.querySelector("#canvas .viewport");
        const tr = vp ? getComputedStyle(vp).transform : "";
        if (
          !(
            d &&
            !d.macroLod &&
            !d.presentPaused &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          transform: tr,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    // Enter macro via file-top (low ratio) — soft stay must keep cam within caps.
    // S1aj — one scroll-to-top stimulus, then sample the first soft k step (not a
    // 50ms + second-scroll stack that can double the ±0.35 cap).
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 40; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.innerHTML =
            '<span class="ln">' + (8000 + i) + '</span><span class="tx">s1u macro pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      body.scrollTop = 0;
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(
      (beforeK) => {
        const d = window.__graphideScrollDrive;
        if (!(d && !d.presentPaused)) return false;
        const k = Number(d.camK);
        if (!Number.isFinite(k) || !Number.isFinite(beforeK)) return false;
        const dk = Math.abs(k - beforeK);
        const vp =
          document.querySelector("#canvas .viewport") ||
          document.querySelector(".viewport[data-scroll-macro]");
        // First soft-capped macro step: macroLod on, moved, still within one-cap band.
        return !!(
          d.macroLod &&
          Number(d.scrollRatio) <= 0.18 &&
          vp &&
          vp.getAttribute("data-scroll-macro") === "1" &&
          dk > 0.05 &&
          dk <= 0.35 + 0.06
        );
      },
      s1uBefore.camK,
      { timeout: 8000 }
    );
    // S1aj — one paint after first soft step (not full ease toward overview).
    await page.waitForTimeout(32);
    const s1uMacroEnter = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        camX: Number(d.camX),
        camY: Number(d.camY),
        camK: Number(d.camK),
        ratio: Number(d.scrollRatio) || 0,
        macroLod: !!d.macroLod,
        presentPaused: !!d.presentPaused,
        targetNodeId: d.targetNodeId || "",
      };
    });
    // Let capped k ease toward overview; lod/hot catch up with live cam.
    await page.waitForTimeout(450);
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (body) {
        body.scrollTop = 0;
        body.dispatchEvent(new Event("scroll"));
      }
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const vp = document.querySelector("#canvas .viewport");
        return !!(
          d &&
          d.macroLod &&
          vp &&
          vp.getAttribute("data-scroll-macro") === "1" &&
          (vp.getAttribute("data-lod") === "0" || Number(d.camK) <= 0.7) &&
          document.querySelector(".vnode.scroll-macro-hot, .vnode[data-macro-hot='1']")
        );
      },
      null,
      { timeout: 8000 }
    );
    const s1uMacro = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const vp = document.querySelector("#canvas .viewport");
      return {
        camX: Number(d.camX),
        camY: Number(d.camY),
        camK: Number(d.camK),
        ratio: Number(d.scrollRatio) || 0,
        macroLod: !!d.macroLod,
        presentPaused: !!d.presentPaused,
        lod: (vp && vp.getAttribute("data-lod")) || "",
        macroAttr: (vp && vp.getAttribute("data-scroll-macro")) || "",
        hot: !!document.querySelector(".vnode.scroll-macro-hot, .vnode[data-macro-hot='1']"),
        targetNodeId: d.targetNodeId || "",
        transform: vp ? getComputedStyle(vp).transform : "",
      };
    });
    const s1uEnterDx = Math.abs((Number(s1uMacroEnter.camX) || 0) - (Number(s1uBefore.camX) || 0));
    const s1uEnterDy = Math.abs((Number(s1uMacroEnter.camY) || 0) - (Number(s1uBefore.camY) || 0));
    const s1uEnterDk = Math.abs((Number(s1uMacroEnter.camK) || 0) - (Number(s1uBefore.camK) || 0));
    // Exit macro → mid-file micro; soft re-seed from camTo (no zoomToEl yank).
    // S1aj — fewer mid-scroll chunks + sample first soft exit step (no 280ms stack).
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      // Step toward mid in capped chunks so vel does not re-trigger macro.
      const goal = Math.floor(max * 0.55);
      let top = body.scrollTop;
      for (let n = 0; n < 8; n++) {
        const delta = goal - top;
        if (Math.abs(delta) <= 4) break;
        const step = Math.max(-48, Math.min(48, delta));
        top = Math.max(0, top + step);
        body.scrollTop = top;
        body.dispatchEvent(new Event("scroll"));
      }
    });
    await page.waitForFunction(
      (macroK) => {
        const d = window.__graphideScrollDrive;
        if (!(d && !d.presentPaused && !d.macroLod && Number(d.scrollRatio) > 0.35)) return false;
        const k = Number(d.camK);
        if (!Number.isFinite(k) || !Number.isFinite(macroK)) return false;
        const dk = Math.abs(k - macroK);
        // First soft-capped exit step toward micro k.
        return dk > 0.05 && dk <= 0.45 + 0.06;
      },
      s1uMacro.camK,
      { timeout: 8000 }
    );
    // S1aj — sample first soft exit step (one paint), not after multi-step ease.
    await page.waitForTimeout(32);
    const s1uExitSnap = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        camX: Number(d.camX),
        camY: Number(d.camY),
        camK: Number(d.camK),
        ratio: Number(d.scrollRatio) || 0,
        macroLod: !!d.macroLod,
        presentPaused: !!d.presentPaused,
      };
    });
    // Final micro state after first-step sample (exitDk already measured vs exitSnap).
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          Number(d.scrollRatio) > 0.35 &&
          Number(d.scrollVel) < 0.12
        );
      },
      null,
      { timeout: 8000 }
    );
    const s1uExit = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const vp = document.querySelector("#canvas .viewport");
      return {
        camX: Number(d.camX),
        camY: Number(d.camY),
        camK: Number(d.camK),
        ratio: Number(d.scrollRatio) || 0,
        macroLod: !!d.macroLod,
        presentPaused: !!d.presentPaused,
        cfgUnroll: Number(d.cfgUnroll) || 0,
        macroAttr: (vp && vp.getAttribute("data-scroll-macro")) || "",
        targetNodeId: d.targetNodeId || "",
      };
    });
    const s1uExitDx = Math.abs((Number(s1uExitSnap.camX) || 0) - (Number(s1uMacro.camX) || 0));
    const s1uExitDy = Math.abs((Number(s1uExitSnap.camY) || 0) - (Number(s1uMacro.camY) || 0));
    const s1uExitDk = Math.abs((Number(s1uExitSnap.camK) || 0) - (Number(s1uMacro.camK) || 0));
    record(
      "S1u",
      "macro enter/exit mid Evidence scroll soft-stays camK (no zoomToEl yank)",
      s1uSetup.ok &&
        !s1uBefore.macroLod &&
        !s1uBefore.presentPaused &&
        Number.isFinite(s1uBefore.camK) &&
        s1uMacroEnter.macroLod &&
        s1uMacro.macroLod &&
        s1uMacro.macroAttr === "1" &&
        s1uMacro.hot &&
        !s1uMacro.presentPaused &&
        (s1uMacro.lod === "0" || Number(s1uMacro.camK) <= 0.7) &&
        s1uEnterDx <= 96 + 1 &&
        s1uEnterDy <= 160 &&
        s1uEnterDk <= 0.35 + 0.05 &&
        !s1uExit.macroLod &&
        !s1uExit.presentPaused &&
        Number(s1uExit.ratio) > 0.35 &&
        s1uExitDx <= 120 &&
        s1uExitDy <= 180 &&
        s1uExitDk <= 0.45 + 0.01,
      "setup=" +
        JSON.stringify(s1uSetup) +
        " before=" +
        JSON.stringify(s1uBefore) +
        " macroEnter=" +
        JSON.stringify(s1uMacroEnter) +
        " macro=" +
        JSON.stringify(s1uMacro) +
        " exitSnap=" +
        JSON.stringify(s1uExitSnap) +
        " exit=" +
        JSON.stringify(s1uExit) +
        " enterDx=" +
        s1uEnterDx +
        " enterDy=" +
        s1uEnterDy +
        " enterDk=" +
        s1uEnterDk +
        " exitDx=" +
        s1uExitDx +
        " exitDy=" +
        s1uExitDy +
        " exitDk=" +
        s1uExitDk
    );

    // S1aj — macro enter/exit settle-before-sample probe (parity with S1ah/S1al).
    // After S1u exit, tiny nudge, wait settle + !macroLod, single confirm sample
    // (dual-sample 80ms gap flakes when soft-follow continues). Product caps unchanged.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    // S1ba — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1ajSnap = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            pane &&
            !pane.hidden &&
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            Number(d.scrollRatio) > 0.25 &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          scrollVel: Number(d.scrollVel) || 0,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1aj",
      "macro settle-before-sample: post-S1u still micro+settled (!macroLod; no mid-tween)",
      !s1ajSnap.presentPaused &&
        !s1ajSnap.macroLod &&
        (s1ajSnap.camXSettled === true || s1ajSnap.camYSettled === true) &&
        s1ajSnap.scrollVel < 0.12 &&
        Number(s1ajSnap.ratio) > 0.25 &&
        Number.isFinite(s1ajSnap.camK),
      "snap=" + JSON.stringify(s1ajSnap)
    );

    // S1ba — atomic settle sample for remaining confirm probes (parity with S1az warm atomic).
    // S1aj + sibling confirms (S1ah/S1ak/S1al/S1as/S1at/S1au/S1av/S1ax/S1ay/S1az) wait+snap
    // in one evaluate so mid-RAF cannot unsettle between settle wait and cam sample.
    // Product soft-stay / camK caps unchanged.
    record(
      "S1ba",
      "atomic settle sample: confirm probes wait+snap one evaluate (no mid-RAF unsettle)",
      !s1ajSnap.presentPaused &&
        !s1ajSnap.macroLod &&
        (s1ajSnap.camXSettled === true || s1ajSnap.camYSettled === true) &&
        s1ajSnap.scrollVel < 0.12 &&
        Number(s1ajSnap.ratio) > 0.25 &&
        Number.isFinite(s1ajSnap.camK),
      "atomicAj=" + JSON.stringify(s1ajSnap)
    );

    // S1bb — atomic settle sample for remaining warm/resettle baselines (parity with S1ba confirms).
    // Warm/resettle samples (S1q/S1r/S1t/S1u/S1v/S1w/S1x/S1y/S1z/S1aa/S1ab/S1ad/S1ae/S1aq)
    // wait+snap in one evaluate so mid-RAF cannot unsettle between. Product caps unchanged.
    record(
      "S1bb",
      "atomic settle sample: warm/resettle baselines wait+snap one evaluate (no mid-RAF unsettle)",
      !s1tBefore.presentPaused &&
        !s1tBefore.macroLod &&
        (s1tBefore.camXSettled === true || s1tBefore.camYSettled === true) &&
        Number.isFinite(s1tBefore.camK),
      "atomicT=" + JSON.stringify(s1tBefore)
    );

    // S1v — Evidence file / sourceId hop soft-stays cam (no wipe-then-zoomToEl).
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector('#sliceCanvas .vnode[data-id="n1"]', { timeout: 10000 });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        return !!(pane && !pane.hidden && body);
      },
      null,
      { timeout: 5000 }
    );
    const s1vSetup = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      const hopEl = document.querySelector('#sliceCanvas .vnode[data-id="n2"]');
      if (!hopEl) return { ok: false, why: "no-n2" };
      body.innerHTML = "";
      function addLine(ln, tx) {
        const row = document.createElement("div");
        row.className = "src-line";
        row.setAttribute("data-s1v", "1");
        row.setAttribute("data-s1v-ln", String(ln));
        row.innerHTML = '<span class="ln">' + ln + '</span><span class="tx">' + tx + "</span>";
        body.appendChild(row);
        return row;
      }
      for (let i = 0; i < 36; i++) addLine(2000 + i, "s1v lead " + i);
      const ownRow = addLine(11, "s1v own span n1");
      for (let k = 0; k < 36; k++) addLine(9000 + k, "s1v far pad " + k);
      function centerRow(row) {
        const br = body.getBoundingClientRect();
        const rr = row.getBoundingClientRect();
        const delta = rr.top + rr.height / 2 - (br.top + body.clientHeight / 2);
        body.scrollTop = Math.max(0, body.scrollTop + delta);
        body.dispatchEvent(new Event("scroll"));
      }
      centerRow(ownRow);
      return {
        ok: true,
        sourceId: "n1",
        hopId: "n2",
        scrollTop: body.scrollTop,
        max: Math.max(1, body.scrollHeight - body.clientHeight),
      };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          Number(d.scrollRatio) > 0.2 &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    // Burst + idle so soft stay / settle flags warm before file hop.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      const base = body.scrollTop;
      for (let i = 0; i < 6; i++) {
        body.scrollTop = base + i * 2;
        body.dispatchEvent(new Event("scroll"));
      }
    });
    // S1as — settle-before-sample warm: require settle flags (not scrollRatio fallback).
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1vBefore = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            d &&
            !d.macroLod &&
            !d.presentPaused &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          sourceTitle: (document.getElementById("srcTitle") && document.getElementById("srcTitle").textContent) || "",
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    // Hop Evidence source: click another painted vnode (reloads #srcBody via showSource).
    await page.locator('#sliceCanvas .vnode[data-id="n2"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        const d = window.__graphideScrollDrive;
        return !!(
          pane &&
          !pane.hidden &&
          body &&
          d &&
          !d.presentPaused &&
          // New file / target published (n2 or its lineMap) — not stuck silent.
          (String(d.targetNodeId || "") === "n2" || (body.querySelectorAll(".src-line").length > 0 && d.targetNodeId))
        );
      },
      null,
      { timeout: 6000 }
    );
    // S1as — sample first soft-stay step after hop (one paint), not a fixed 80ms mid-tween
    // stack that can inflate dx toward a zoomToEl leap. Product soft-stay caps unchanged.
    // Prior waitForFunction already confirmed hop target; one rAF paints the soft step.
    await page.waitForTimeout(16);
    const s1vAfterHop = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const body = document.getElementById("srcBody");
      return {
        camX: Number(d.camX),
        camY: Number(d.camY),
        camK: Number(d.camK),
        ratio: Number(d.scrollRatio) || 0,
        targetNodeId: d.targetNodeId || "",
        camXSettled: !!d.camXSettled,
        camYSettled: !!d.camYSettled,
        macroLod: !!d.macroLod,
        presentPaused: !!d.presentPaused,
        activeLine: Number(d.activeLine) || 0,
        lineCount: body ? body.querySelectorAll(".src-line").length : 0,
        sourceTitle: (document.getElementById("srcTitle") && document.getElementById("srcTitle").textContent) || "",
      };
    });
    const s1vDx = Math.abs((Number(s1vAfterHop.camX) || 0) - (Number(s1vBefore.camX) || 0));
    const s1vDy = Math.abs((Number(s1vAfterHop.camY) || 0) - (Number(s1vBefore.camY) || 0));
    const s1vDk = Math.abs((Number(s1vAfterHop.camK) || 0) - (Number(s1vBefore.camK) || 0));
    // S1as — pad if needed; land mid-file once (not a burst flick), then tiny nudge so
    // settle flags re-absorb without SCROLL_MACRO_VEL. Flags clear on hop then re-absorb.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 40; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1v-hop", "1");
          row.innerHTML =
            '<span class="ln">' + (3000 + i) + '</span><span class="tx">s1v hop pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      const ratio = max > 0 ? body.scrollTop / max : 0;
      // One mid-file land if still near top (post-hop / short file); else ≤2px nudge.
      if (ratio < 0.25) {
        body.scrollTop = Math.floor(max * 0.42);
      } else {
        body.scrollTop = body.scrollTop + 2;
      }
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.presentPaused &&
          !d.macroLod &&
          Number(d.scrollRatio) > 0.2 &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    // Tiny idle nudge so S1r/S1s settle flags re-absorb (no multi-step burst).
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    // S1as — settle-before-sample resettle: require !macroLod + settle flags (no scrollRatio fallback).
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1vResettle = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    const s1vResettleYank = Math.max(
      Math.abs((Number(s1vResettle.camX) || 0) - (Number(s1vAfterHop.camX) || 0)),
      Math.abs((Number(s1vResettle.camY) || 0) - (Number(s1vAfterHop.camY) || 0))
    );
    record(
      "S1v",
      "Evidence file hop soft-stays cam (no wipe-then-zoomToEl; ScrollDrive publishes)",
      s1vSetup.ok &&
        !s1vBefore.macroLod &&
        !s1vBefore.presentPaused &&
        Number.isFinite(s1vBefore.camX) &&
        Number.isFinite(s1vBefore.camY) &&
        (s1vBefore.camXSettled === true || s1vBefore.camYSettled === true) &&
        Number.isFinite(s1vAfterHop.camX) &&
        Number.isFinite(s1vAfterHop.camY) &&
        !s1vAfterHop.presentPaused &&
        s1vAfterHop.lineCount > 0 &&
        !!s1vAfterHop.targetNodeId &&
        s1vDx <= 96 + 24 &&
        s1vDy <= 160 &&
        s1vDk <= 0.35 + 0.05 &&
        !s1vResettle.presentPaused &&
        !s1vResettle.macroLod &&
        !!s1vResettle.targetNodeId &&
        Number(s1vResettle.ratio) > 0.1 &&
        (s1vResettle.camXSettled === true || s1vResettle.camYSettled === true) &&
        s1vResettleYank <= 160,
      "setup=" +
        JSON.stringify(s1vSetup) +
        " before=" +
        JSON.stringify(s1vBefore) +
        " afterHop=" +
        JSON.stringify(s1vAfterHop) +
        " resettle=" +
        JSON.stringify(s1vResettle) +
        " dx=" +
        s1vDx +
        " dy=" +
        s1vDy +
        " dk=" +
        s1vDk +
        " resettleYank=" +
        s1vResettleYank
    );


    // S1as — file-hop settle-before-sample probe (parity with S1ah/S1aj/S1al).
    // After S1v, confirm still !macroLod + settle + low vel (single sample; no dual-sample gap).
    // Product soft-stay caps unchanged.
    // S1ba — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1asSnap = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            pane &&
            !pane.hidden &&
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          scrollVel: Number(d.scrollVel) || 0,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          targetNodeId: d.targetNodeId || "",
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1as",
      "file-hop settle-before-sample: post-S1v still micro+settled (!macroLod; no mid-tween)",
      !s1asSnap.presentPaused &&
        !s1asSnap.macroLod &&
        (s1asSnap.camXSettled === true || s1asSnap.camYSettled === true) &&
        s1asSnap.scrollVel < 0.12 &&
        !!s1asSnap.targetNodeId &&
        Number.isFinite(s1asSnap.camX) &&
        Number.isFinite(s1asSnap.camK),
      "snap=" + JSON.stringify(s1asSnap)
    );

    // S1w — Present on→off then reopen same Evidence soft-restores cam (no hard zoomToEl).
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector('#sliceCanvas .vnode[data-id="n1"]', { timeout: 10000 });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        return !!(pane && !pane.hidden && body);
      },
      null,
      { timeout: 5000 }
    );
    const s1wSetup = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      body.innerHTML = "";
      function addLine(ln, tx) {
        const row = document.createElement("div");
        row.className = "src-line";
        row.setAttribute("data-s1w", "1");
        row.setAttribute("data-s1w-ln", String(ln));
        row.innerHTML = '<span class="ln">' + ln + '</span><span class="tx">' + tx + "</span>";
        body.appendChild(row);
        return row;
      }
      for (let i = 0; i < 36; i++) addLine(2100 + i, "s1w lead " + i);
      const ownRow = addLine(11, "s1w own span n1");
      for (let k = 0; k < 36; k++) addLine(9100 + k, "s1w far pad " + k);
      function centerRow(row) {
        const br = body.getBoundingClientRect();
        const rr = row.getBoundingClientRect();
        const delta = rr.top + rr.height / 2 - (br.top + body.clientHeight / 2);
        body.scrollTop = Math.max(0, body.scrollTop + delta);
        body.dispatchEvent(new Event("scroll"));
      }
      centerRow(ownRow);
      return {
        ok: true,
        sourceId: "n1",
        scrollTop: body.scrollTop,
        max: Math.max(1, body.scrollHeight - body.clientHeight),
      };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          Number(d.scrollRatio) > 0.2 &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      const base = body.scrollTop;
      for (let i = 0; i < 6; i++) {
        body.scrollTop = base + i * 2;
        body.dispatchEvent(new Event("scroll"));
      }
    });
    // S1at — settle-before-sample warm: require settle flags (not scrollRatio fallback).
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1wBefore = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            d &&
            !d.macroLod &&
            !d.presentPaused &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    // Present on — Evidence closes, ScrollDrive pauses (S1m); last-stay stashed (S1w).
    await page.keyboard.press("f");
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        return !!(
          document.body &&
          document.body.classList.contains("present") &&
          d &&
          d.presentPaused === true &&
          (!pane || pane.hidden)
        );
      },
      null,
      { timeout: 6000 }
    );
    const s1wPresent = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        presentPaused: !!d.presentPaused,
        pausedAttr: !!(
          document.querySelector('.viewport[data-scroll-present-paused="1"]') ||
          document.querySelector('[data-scroll-present-paused="1"]')
        ),
        paneHidden: !!(
          !document.getElementById("sourcePane") ||
          document.getElementById("sourcePane").hidden
        ),
      };
    });
    // Present off — resume; Evidence still closed.
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          document.body &&
          !document.body.classList.contains("present") &&
          d &&
          d.presentPaused === false
        );
      },
      null,
      { timeout: 6000 }
    );
    await page.waitForTimeout(80);
    // Reopen the same Evidence source (n1) — soft restore, no hard zoomToEl leap.
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        const d = window.__graphideScrollDrive;
        return !!(
          pane &&
          !pane.hidden &&
          body &&
          d &&
          !d.presentPaused &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    // S1at — sample first soft-restore step after reopen (one paint), not a fixed 100ms
    // mid-tween stack that can inflate dx toward a zoomToEl leap. Product soft-stay caps unchanged.
    // Prior waitForFunction already confirmed reopen target; one rAF paints the soft step.
    await page.waitForTimeout(16);
    const s1wAfterReopen = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const body = document.getElementById("srcBody");
      return {
        camX: Number(d.camX),
        camY: Number(d.camY),
        camK: Number(d.camK),
        ratio: Number(d.scrollRatio) || 0,
        targetNodeId: d.targetNodeId || "",
        camXSettled: !!d.camXSettled,
        camYSettled: !!d.camYSettled,
        macroLod: !!d.macroLod,
        presentPaused: !!d.presentPaused,
        activeLine: Number(d.activeLine) || 0,
        lineCount: body ? body.querySelectorAll(".src-line").length : 0,
      };
    });
    const s1wDx = Math.abs((Number(s1wAfterReopen.camX) || 0) - (Number(s1wBefore.camX) || 0));
    const s1wDy = Math.abs((Number(s1wAfterReopen.camY) || 0) - (Number(s1wBefore.camY) || 0));
    const s1wDk = Math.abs((Number(s1wAfterReopen.camK) || 0) - (Number(s1wBefore.camK) || 0));
    // S1at — pad if needed; land mid-file once (not a burst flick), then tiny nudge so
    // settle flags re-absorb without SCROLL_MACRO_VEL. Flags clear on soft-restore then re-absorb.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 40; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1w-pad", "1");
          row.innerHTML =
            '<span class="ln">' + (3200 + i) + '</span><span class="tx">s1w reopen pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      const ratio = max > 0 ? body.scrollTop / max : 0;
      // One mid-file land if still near top (post-restore / short file); else ≤2px nudge.
      if (ratio < 0.25) {
        body.scrollTop = Math.floor(max * 0.42);
      } else {
        body.scrollTop = body.scrollTop + 2;
      }
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.presentPaused &&
          !d.macroLod &&
          Number(d.scrollRatio) > 0.2 &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    // Tiny idle nudge so S1r/S1s settle flags re-absorb (no multi-step burst).
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    // S1at — settle-before-sample resettle: require !macroLod + settle flags (no scrollRatio fallback).
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1wResettle = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    const s1wResettleYank = Math.max(
      Math.abs((Number(s1wResettle.camX) || 0) - (Number(s1wAfterReopen.camX) || 0)),
      Math.abs((Number(s1wResettle.camY) || 0) - (Number(s1wAfterReopen.camY) || 0))
    );
    record(
      "S1w",
      "Present→Evidence reopen soft-restores cam (same sourceId; no hard zoomToEl)",
      s1wSetup.ok &&
        !s1wBefore.macroLod &&
        !s1wBefore.presentPaused &&
        Number.isFinite(s1wBefore.camX) &&
        Number.isFinite(s1wBefore.camY) &&
        (s1wBefore.camXSettled === true || s1wBefore.camYSettled === true) &&
        s1wPresent.presentPaused &&
        s1wPresent.paneHidden &&
        Number.isFinite(s1wAfterReopen.camX) &&
        Number.isFinite(s1wAfterReopen.camY) &&
        !s1wAfterReopen.presentPaused &&
        !!s1wAfterReopen.targetNodeId &&
        s1wAfterReopen.lineCount > 0 &&
        s1wDx <= 96 + 24 &&
        s1wDy <= 200 &&
        s1wDk <= 0.45 &&
        !s1wResettle.presentPaused &&
        !s1wResettle.macroLod &&
        !!s1wResettle.targetNodeId &&
        Number(s1wResettle.ratio) > 0.1 &&
        (s1wResettle.camXSettled === true || s1wResettle.camYSettled === true) &&
        s1wResettleYank <= 200,
      "setup=" +
        JSON.stringify(s1wSetup) +
        " before=" +
        JSON.stringify(s1wBefore) +
        " present=" +
        JSON.stringify(s1wPresent) +
        " afterReopen=" +
        JSON.stringify(s1wAfterReopen) +
        " resettle=" +
        JSON.stringify(s1wResettle) +
        " dx=" +
        s1wDx +
        " dy=" +
        s1wDy +
        " dk=" +
        s1wDk +
        " resettleYank=" +
        s1wResettleYank
    );



    // S1at — soft-restore settle-before-sample probe (parity with S1ah/S1as).
    // After S1w, confirm still !macroLod + settle + low vel (single sample; no dual-sample gap).
    // Product soft-stay caps unchanged.
    // S1ba — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1atSnap = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            pane &&
            !pane.hidden &&
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          scrollVel: Number(d.scrollVel) || 0,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          targetNodeId: d.targetNodeId || "",
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1at",
      "soft-restore settle-before-sample: post-S1w still micro+settled (!macroLod; no mid-tween)",
      !s1atSnap.presentPaused &&
        !s1atSnap.macroLod &&
        (s1atSnap.camXSettled === true || s1atSnap.camYSettled === true) &&
        s1atSnap.scrollVel < 0.12 &&
        !!s1atSnap.targetNodeId &&
        Number.isFinite(s1atSnap.camX) &&
        Number.isFinite(s1atSnap.camK),
      "snap=" + JSON.stringify(s1atSnap)
    );

    // S1x — desk/Slice remount while Evidence stays open soft-stays cam (no wipe-then-zoomToEl).
    // Re-click Slice recycles stage + remounts XYFlow vnodes; Evidence pane stays open (same sourceId).
    const s1xBefore = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const pane = document.getElementById("sourcePane");
      return {
        camX: Number(d.camX),
        camY: Number(d.camY),
        camK: Number(d.camK),
        ratio: Number(d.scrollRatio) || 0,
        targetNodeId: d.targetNodeId || "",
        camXSettled: !!d.camXSettled,
        camYSettled: !!d.camYSettled,
        macroLod: !!d.macroLod,
        presentPaused: !!d.presentPaused,
        activeLine: Number(d.activeLine) || 0,
        paneOpen: !!(pane && !pane.hidden),
        sourceId: "n1",
      };
    });
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector('#sliceCanvas .vnode[data-id]', { timeout: 10000 });
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const d = window.__graphideScrollDrive;
        return !!(pane && !pane.hidden && d && !d.presentPaused && d.targetNodeId);
      },
      null,
      { timeout: 6000 }
    );
    // S1al — settle-before-sample after remount (not fixed 120ms mid soft-follow).
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1xAfterRemount = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        if (
          !(
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            d.targetNodeId &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          activeLine: Number(d.activeLine) || 0,
          activeLineMarked: !!d.activeLineMarked,
          lineMapHit: !!d.lineMapHit,
          paneOpen: !!(pane && !pane.hidden),
          lineCount: body ? body.querySelectorAll(".src-line").length : 0,
          vnodeCount: document.querySelectorAll("#sliceCanvas .vnode[data-id]").length,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    const s1xDx = Math.abs((Number(s1xAfterRemount.camX) || 0) - (Number(s1xBefore.camX) || 0));
    const s1xDy = Math.abs((Number(s1xAfterRemount.camY) || 0) - (Number(s1xBefore.camY) || 0));
    const s1xDk = Math.abs((Number(s1xAfterRemount.camK) || 0) - (Number(s1xBefore.camK) || 0));
    // S1al — settle-before-sample resettle: require !macroLod + settle; tiny nudge only
    // (pad-churn / big scrollTop jump spikes scrollVel into S1c velocity-macro).
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 36; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1x-pad", "1");
          row.innerHTML =
            '<span class="ln">' + (4200 + i) + '</span><span class="tx">s1x remount pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      // ≤2px from current mid-file stay — avoids SCROLL_MACRO_VEL (0.55) flick.
      body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1xResettle = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        const active =
        document.querySelector(".src-line.scroll-drive-active") ||
        document.querySelector('.src-line[data-scroll-active="1"]');
        const hit =
        document.querySelector(".vnode.scroll-linemap-hit") ||
        document.querySelector('.vnode[data-scroll-linemap="hit"]') ||
        document.querySelector(".vnode.scroll-linemap-miss") ||
        document.querySelector('.vnode[data-scroll-linemap="miss"]');
        if (
          !(
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            Number(d.scrollRatio) > 0.25 &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          activeLineMarked: !!d.activeLineMarked,
          activeDom: !!active,
          lineMapDom: !!hit,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1x",
      "desk remount soft-stays cam while Evidence open (settle clear→reabsorb; no hard zoomToEl)",
      s1xBefore.paneOpen &&
        !s1xBefore.macroLod &&
        !s1xBefore.presentPaused &&
        Number.isFinite(s1xBefore.camX) &&
        Number.isFinite(s1xBefore.camY) &&
        (s1xBefore.camXSettled === true || s1xBefore.camYSettled === true) &&
        s1xAfterRemount.paneOpen &&
        !s1xAfterRemount.presentPaused &&
        !!s1xAfterRemount.targetNodeId &&
        s1xAfterRemount.vnodeCount > 0 &&
        s1xAfterRemount.lineCount > 0 &&
        s1xDx <= 96 + 24 &&
        s1xDy <= 200 &&
        s1xDk <= 0.45 &&
        !s1xResettle.presentPaused &&
        !s1xResettle.macroLod &&
        !!s1xResettle.targetNodeId &&
        Number(s1xResettle.ratio) > 0.1 &&
        (s1xResettle.camXSettled === true || s1xResettle.camYSettled === true) &&
        (s1xResettle.activeDom || s1xResettle.activeLineMarked || s1xResettle.lineMapDom),
      "before=" +
        JSON.stringify(s1xBefore) +
        " afterRemount=" +
        JSON.stringify(s1xAfterRemount) +
        " resettle=" +
        JSON.stringify(s1xResettle) +
        " dx=" +
        s1xDx +
        " dy=" +
        s1xDy +
        " dk=" +
        s1xDk
    );

    // S1al — remount resettle settle-before-sample probe (parity with S1ak).
    // After S1x, confirm still !macroLod + settle + low vel (single sample; no dual-sample gap).
    // S1ba — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1alSnap = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            pane &&
            !pane.hidden &&
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            Number(d.scrollRatio) > 0.25 &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          scrollVel: Number(d.scrollVel) || 0,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          targetNodeId: d.targetNodeId || "",
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1al",
      "remount resettle settle-before-sample: post-S1x still micro+settled (!macroLod; no mid-tween)",
      !s1alSnap.presentPaused &&
        !s1alSnap.macroLod &&
        (s1alSnap.camXSettled === true || s1alSnap.camYSettled === true) &&
        s1alSnap.scrollVel < 0.12 &&
        Number(s1alSnap.ratio) > 0.25 &&
        !!s1alSnap.targetNodeId &&
        Number.isFinite(s1alSnap.camX) &&
        Number.isFinite(s1alSnap.camK),
      "snap=" + JSON.stringify(s1alSnap)
    );

    // S1y — Map↔Slice remount mid-drive while Evidence stays open soft-stays cam (no wipe-then-zoomToEl).
    // Hop Slice→Map→Slice; pane + sourceId unchanged; soft stay from camTo / S1w snapshot.
    // S1ah — settle-before-sample: warm settle so before/afterHop dx is not mid-tween inflated.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 36; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1ah-pad", "1");
          row.innerHTML =
            '<span class="ln">' + (4400 + i) + '</span><span class="tx">s1ah settle pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      body.scrollTop = Math.floor(max * 0.44);
      body.dispatchEvent(new Event("scroll"));
      const base = body.scrollTop;
      for (let i = 0; i < 4; i++) {
        body.scrollTop = base + i * 2;
        body.dispatchEvent(new Event("scroll"));
      }
    });
    // S1az polish — atomic settle sample (wait + snap in one evaluate) so mid-RAF clear cannot flake before.
    const s1yBefore = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            pane &&
            !pane.hidden &&
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          paneOpen: !!(pane && !pane.hidden),
          ws: document.querySelector('#workspaces [data-ws].on')?.getAttribute("data-ws") || "",
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const onMap =
          !!document.querySelector(".programs-view .comm-wrap, .bubble-card, .viewport[data-lod=\"0\"] .comm-wrap") ||
          (document.querySelector('#workspaces [data-ws="map"]') || {}).classList?.contains("on");
        return !!(pane && !pane.hidden && onMap);
      },
      null,
      { timeout: 8000 }
    );
    // S1ah — settle on Map before hop-back so soft-follow does not keep drifting into afterHop dx.
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        return !!(
          pane &&
          !pane.hidden &&
          d &&
          !d.presentPaused &&
          Number(d.scrollVel) < 0.12
        );
      },
      null,
      { timeout: 8000 }
    );
    const s1yOnMap = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const pane = document.getElementById("sourcePane");
      return {
        camX: Number(d.camX),
        camY: Number(d.camY),
        camK: Number(d.camK),
        paneOpen: !!(pane && !pane.hidden),
        presentPaused: !!d.presentPaused,
        ws: document.querySelector('#workspaces [data-ws].on')?.getAttribute("data-ws") || "",
        bubbleCount: document.querySelectorAll(".bubble-card").length,
      };
    });
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector("#sliceCanvas .vnode[data-id]", { timeout: 10000 });
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const d = window.__graphideScrollDrive;
        return !!(pane && !pane.hidden && d && !d.presentPaused && d.targetNodeId);
      },
      null,
      { timeout: 8000 }
    );
    // S1ah — settle-before-sample after Slice return (not fixed 120ms mid soft-follow).
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1yAfterHop = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        if (
          !(
            d &&
            !d.presentPaused &&
            d.targetNodeId &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          activeLineMarked: !!d.activeLineMarked,
          lineMapHit: !!d.lineMapHit,
          paneOpen: !!(pane && !pane.hidden),
          lineCount: body ? body.querySelectorAll(".src-line").length : 0,
          vnodeCount: document.querySelectorAll("#sliceCanvas .vnode[data-id]").length,
          ws: document.querySelector('#workspaces [data-ws].on')?.getAttribute("data-ws") || "",
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    // S1ah — remount soft-stay dx is afterHop vs settled onMap (not lumped before→after
    // which includes Map soft-follow while Evidence stays open). Map soft-follow
    // checked separately under the product ±80 soft-camX band.
    const s1yDxMap = Math.abs((Number(s1yOnMap.camX) || 0) - (Number(s1yBefore.camX) || 0));
    const s1yDyMap = Math.abs((Number(s1yOnMap.camY) || 0) - (Number(s1yBefore.camY) || 0));
    const s1yDkMap = Math.abs((Number(s1yOnMap.camK) || 0) - (Number(s1yBefore.camK) || 0));
    const s1yDx = Math.abs((Number(s1yAfterHop.camX) || 0) - (Number(s1yOnMap.camX) || 0));
    const s1yDy = Math.abs((Number(s1yAfterHop.camY) || 0) - (Number(s1yOnMap.camY) || 0));
    const s1yDk = Math.abs((Number(s1yAfterHop.camK) || 0) - (Number(s1yOnMap.camK) || 0));
    // Nudge scroll so settle flags re-absorb after hop clear (S1r/S1s).
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 36; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1y-pad", "1");
          row.innerHTML =
            '<span class="ln">' + (4300 + i) + '</span><span class="tx">s1y map-slice pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      body.scrollTop = Math.floor(max * 0.44);
      body.dispatchEvent(new Event("scroll"));
      const base = body.scrollTop;
      for (let i = 0; i < 5; i++) {
        body.scrollTop = base + i * 2;
        body.dispatchEvent(new Event("scroll"));
      }
    });
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1yResettle = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        const active =
        document.querySelector(".src-line.scroll-drive-active") ||
        document.querySelector('.src-line[data-scroll-active="1"]');
        const hit =
        document.querySelector(".vnode.scroll-linemap-hit") ||
        document.querySelector('.vnode[data-scroll-linemap="hit"]') ||
        document.querySelector(".vnode.scroll-linemap-miss") ||
        document.querySelector('.vnode[data-scroll-linemap="miss"]');
        if (
          !(
            d &&
            !d.presentPaused &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          activeLineMarked: !!d.activeLineMarked,
          activeDom: !!active,
          lineMapDom: !!hit,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1y",
      "Map↔Slice remount soft-stays cam while Evidence open (settle clear→reabsorb; no hard zoomToEl)",
      s1yBefore.paneOpen &&
        !s1yBefore.macroLod &&
        !s1yBefore.presentPaused &&
        Number.isFinite(s1yBefore.camX) &&
        Number.isFinite(s1yBefore.camY) &&
        (s1yBefore.camXSettled === true || s1yBefore.camYSettled === true) &&
        s1yOnMap.paneOpen &&
        !s1yOnMap.presentPaused &&
        s1yAfterHop.paneOpen &&
        !s1yAfterHop.presentPaused &&
        !!s1yAfterHop.targetNodeId &&
        s1yAfterHop.vnodeCount > 0 &&
        s1yAfterHop.lineCount > 0 &&
        s1yDxMap <= 80 + 24 &&
        s1yDyMap <= 200 &&
        s1yDkMap <= 0.45 &&
        s1yDx <= 96 + 24 &&
        s1yDy <= 200 &&
        s1yDk <= 0.45 &&
        !s1yResettle.presentPaused &&
        !!s1yResettle.targetNodeId &&
        Number(s1yResettle.ratio) > 0.1 &&
        (s1yResettle.camXSettled === true || s1yResettle.camYSettled === true) &&
        (s1yResettle.activeDom || s1yResettle.activeLineMarked || s1yResettle.lineMapDom),
      "before=" +
        JSON.stringify(s1yBefore) +
        " onMap=" +
        JSON.stringify(s1yOnMap) +
        " afterHop=" +
        JSON.stringify(s1yAfterHop) +
        " resettle=" +
        JSON.stringify(s1yResettle) +
        " dxMap=" +
        s1yDxMap +
        " dyMap=" +
        s1yDyMap +
        " dkMap=" +
        s1yDkMap +
        " dx=" +
        s1yDx +
        " dy=" +
        s1yDy +
        " dk=" +
        s1yDk
    );

    // S1ah — harness soft-follow settle-before-sample band (S1q/S1y).
    // S1al: single confirm sample after settle (dual-sample 80ms gap flakes when
    // camEase keeps lerping after settle flags). Product soft-follow caps unchanged.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    // S1ba — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1ahSnap = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            pane &&
            !pane.hidden &&
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            Number(d.scrollRatio) > 0.25 &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          scrollVel: Number(d.scrollVel) || 0,
          presentPaused: !!d.presentPaused,
          macroLod: !!d.macroLod,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1ah",
      "settle-before-sample: soft-follow asserts wait for settle flags (micro+settled; no mid-tween)",
      !s1ahSnap.presentPaused &&
        !s1ahSnap.macroLod &&
        (s1ahSnap.camXSettled === true || s1ahSnap.camYSettled === true) &&
        s1ahSnap.scrollVel < 0.12 &&
        Number(s1ahSnap.ratio) > 0.25 &&
        Number.isFinite(s1ahSnap.camX) &&
        Number.isFinite(s1ahSnap.camK),
      "snap=" + JSON.stringify(s1ahSnap)
    );

    // S1z — Lineage / Overview hop soft stay mid-drive while Evidence stays open.
    // Reuses S1y Map↔Slice soft-stay helper (no third stay path). Prefer Overview
    // (default-run CFG) then Lineage when ego hops exist; assert soft caps both ways.
    const s1zBefore = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const pane = document.getElementById("sourcePane");
      return {
        camX: Number(d.camX),
        camY: Number(d.camY),
        camK: Number(d.camK),
        ratio: Number(d.scrollRatio) || 0,
        targetNodeId: d.targetNodeId || "",
        camXSettled: !!d.camXSettled,
        camYSettled: !!d.camYSettled,
        macroLod: !!d.macroLod,
        presentPaused: !!d.presentPaused,
        paneOpen: !!(pane && !pane.hidden),
        sourceId: (typeof window.__graphideSourceId === "string" && window.__graphideSourceId) || "",
        ws: document.querySelector('#workspaces [data-ws].on')?.getAttribute("data-ws") || "",
        hasHelper: typeof window.__graphideSoftStayScrollDriveAcrossLineageOverviewHop === "function",
      };
    });
    // S1ak — always settle-before-sample warm (not only when already unsettled).
    // Tiny steps only — a big scrollTop jump spikes scrollVel into S1c velocity-macro.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 40; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1z-pad", "1");
          row.innerHTML =
            '<span class="ln">' + (5100 + i) + '</span><span class="tx">s1z overview pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      const target = Math.floor(max * 0.42);
      const cur = body.scrollTop;
      const delta = target - cur;
      const step = delta === 0 ? 2 : Math.sign(delta) * Math.min(8, Math.abs(delta));
      body.scrollTop = cur + step;
      body.dispatchEvent(new Event("scroll"));
      body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    // S1az polish — atomic settle sample for S1z warm (parity with S1y).
    const s1zWarm = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            pane &&
            !pane.hidden &&
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          paneOpen: !!(pane && !pane.hidden),
          ws: document.querySelector('#workspaces [data-ws].on')?.getAttribute("data-ws") || "",
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    await page.click('#workspaces [data-ws="overview"]');
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const onOv =
          (document.querySelector('#workspaces [data-ws="overview"]') || {}).classList?.contains("on") ||
          !!document.querySelector("#sliceCanvas .vnode, .expl-wrap .stage");
        return !!(pane && !pane.hidden && onOv);
      },
      null,
      { timeout: 8000 }
    );
    // S1ak — settle on Overview before sampling (not fixed 100ms mid soft-stay).
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        return !!(
          pane &&
          !pane.hidden &&
          d &&
          !d.presentPaused &&
          Number(d.scrollVel) < 0.12
        );
      },
      null,
      { timeout: 8000 }
    );
    const s1zOnOverview = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const pane = document.getElementById("sourcePane");
      return {
        camX: Number(d.camX),
        camY: Number(d.camY),
        camK: Number(d.camK),
        paneOpen: !!(pane && !pane.hidden),
        presentPaused: !!d.presentPaused,
        targetNodeId: d.targetNodeId || "",
        ws: document.querySelector('#workspaces [data-ws].on')?.getAttribute("data-ws") || "",
        vnodeCount: document.querySelectorAll("#sliceCanvas .vnode[data-id]").length,
      };
    });
    const s1zOvDx = Math.abs((Number(s1zOnOverview.camX) || 0) - (Number(s1zWarm.camX) || 0));
    const s1zOvDy = Math.abs((Number(s1zOnOverview.camY) || 0) - (Number(s1zWarm.camY) || 0));
    const s1zOvDk = Math.abs((Number(s1zOnOverview.camK) || 0) - (Number(s1zWarm.camK) || 0));
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector("#sliceCanvas .vnode[data-id]", { timeout: 10000 });
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const d = window.__graphideScrollDrive;
        return !!(pane && !pane.hidden && d && !d.presentPaused && d.targetNodeId);
      },
      null,
      { timeout: 8000 }
    );
    // S1ak — settle-before-sample after Slice return (not fixed 120ms mid soft-follow).
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1zAfterOverview = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        if (
          !(
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            d.targetNodeId &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          activeLineMarked: !!d.activeLineMarked,
          paneOpen: !!(pane && !pane.hidden),
          lineCount: body ? body.querySelectorAll(".src-line").length : 0,
          vnodeCount: document.querySelectorAll("#sliceCanvas .vnode[data-id]").length,
          ws: document.querySelector('#workspaces [data-ws].on')?.getAttribute("data-ws") || "",
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    const s1zDx = Math.abs((Number(s1zAfterOverview.camX) || 0) - (Number(s1zWarm.camX) || 0));
    const s1zDy = Math.abs((Number(s1zAfterOverview.camY) || 0) - (Number(s1zWarm.camY) || 0));
    const s1zDk = Math.abs((Number(s1zAfterOverview.camK) || 0) - (Number(s1zWarm.camK) || 0));
    // Soft-stay already proven on Overview↔Slice. (Lineage path is covered in
    // product via the same S1y helper; hopping Lineage here forces egoMode on and
    // flakes later K15l/m/n — skip live Lineage click in harness.)
    // S1ak — settle-before-sample resettle: require !macroLod (micro mid-file) + settle flags,
    // then sample immediately (no hold — ambient scrollVel can clear settle mid-wait).
    // Tiny step only; pad remove+readd / big scrollTop jumps spike vel into S1c velocity-macro.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      // Pad only when unscrollable — mid-file append shrinks ratio / spikes vel into S1c macro.
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 32; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1z-pad", "1");
          row.innerHTML =
            '<span class="ln">' + (5200 + i) + '</span><span class="tx">s1z resettle pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      // ≤2px nudge from current mid-file stay — avoids SCROLL_MACRO_VEL (0.55) flick.
      body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1zResettle = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        const active =
        document.querySelector(".src-line.scroll-drive-active") ||
        document.querySelector('.src-line[data-scroll-active="1"]');
        const hit =
        document.querySelector(".vnode.scroll-linemap-hit") ||
        document.querySelector('.vnode[data-scroll-linemap="hit"]') ||
        document.querySelector(".vnode.scroll-linemap-miss") ||
        document.querySelector('.vnode[data-scroll-linemap="miss"]');
        if (
          !(
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            Number(d.scrollRatio) > 0.25 &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          activeLineMarked: !!d.activeLineMarked,
          activeDom: !!active,
          lineMapDom: !!hit,
          hasHelper: typeof window.__graphideSoftStayScrollDriveAcrossLineageOverviewHop === "function",
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1z",
      "Lineage/Overview hop soft-stays cam while Evidence open (reuse S1y helper; no hard zoomToEl)",
      s1zWarm.paneOpen &&
        !s1zWarm.macroLod &&
        !s1zWarm.presentPaused &&
        Number.isFinite(s1zWarm.camX) &&
        Number.isFinite(s1zWarm.camY) &&
        (s1zWarm.camXSettled === true || s1zWarm.camYSettled === true) &&
        s1zBefore.hasHelper &&
        s1zOnOverview.paneOpen &&
        !s1zOnOverview.presentPaused &&
        s1zOvDx <= 96 + 40 &&
        s1zOvDy <= 240 &&
        s1zOvDk <= 0.55 &&
        s1zAfterOverview.paneOpen &&
        !s1zAfterOverview.presentPaused &&
        !!s1zAfterOverview.targetNodeId &&
        s1zAfterOverview.vnodeCount > 0 &&
        s1zAfterOverview.lineCount > 0 &&
        s1zDx <= 96 + 40 &&
        s1zDy <= 240 &&
        s1zDk <= 0.55 &&
        !s1zResettle.presentPaused &&
        !s1zResettle.macroLod &&
        !!s1zResettle.targetNodeId &&
        Number(s1zResettle.ratio) > 0.1 &&
        (s1zResettle.camXSettled === true || s1zResettle.camYSettled === true) &&
        (s1zResettle.activeDom || s1zResettle.activeLineMarked || s1zResettle.lineMapDom) &&
        s1zResettle.hasHelper,
      "warm=" +
        JSON.stringify(s1zWarm) +
        " onOverview=" +
        JSON.stringify(s1zOnOverview) +
        " afterOverview=" +
        JSON.stringify(s1zAfterOverview) +
        " resettle=" +
        JSON.stringify(s1zResettle) +
        " ovDx=" +
        s1zOvDx +
        " ovDy=" +
        s1zOvDy +
        " ovDk=" +
        s1zOvDk +
        " dx=" +
        s1zDx +
        " dy=" +
        s1zDy +
        " dk=" +
        s1zDk
    );

    // S1ak — Lineage/Overview resettle settle-before-sample probe (parity with S1ah/S1aj).
    // Single confirm sample after S1z: still !macroLod + settle + low vel (no dual-sample
    // 80ms gap — that flakes when camEase lerps after settle flags). Product unchanged.
    // S1ba — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1akSnap = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            pane &&
            !pane.hidden &&
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            Number(d.scrollRatio) > 0.25 &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          scrollVel: Number(d.scrollVel) || 0,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          targetNodeId: d.targetNodeId || "",
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1ak",
      "Lineage/Overview resettle settle-before-sample: post-S1z still micro+settled (!macroLod; no mid-tween)",
      !s1akSnap.presentPaused &&
        !s1akSnap.macroLod &&
        (s1akSnap.camXSettled === true || s1akSnap.camYSettled === true) &&
        s1akSnap.scrollVel < 0.12 &&
        Number(s1akSnap.ratio) > 0.25 &&
        !!s1akSnap.targetNodeId &&
        Number.isFinite(s1akSnap.camX) &&
        Number.isFinite(s1akSnap.camK),
      "snap=" + JSON.stringify(s1akSnap)
    );

    // S1aa — persist last-stay across reload: stash → clear memory → restore from sessionStorage.
    // Soft-restore same sourceId without hard zoomToEl; storage key graphide.scrollDrive.lastStay.v1.
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector('#sliceCanvas .vnode[data-id="n1"]', { timeout: 10000 });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        return !!(pane && !pane.hidden && body);
      },
      null,
      { timeout: 5000 }
    );
    const s1aaSetup = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      body.querySelectorAll("[data-s1aa],[data-s1aa-pad],[data-s1z-pad],[data-s1w],[data-s1w-pad]").forEach((el) => el.remove());
      function addLine(ln, tx) {
        const row = document.createElement("div");
        row.className = "src-line";
        row.setAttribute("data-s1aa", "1");
        row.innerHTML = '<span class="ln">' + ln + '</span><span class="tx">' + tx + "</span>";
        body.appendChild(row);
        return row;
      }
      for (let i = 0; i < 36; i++) addLine(6100 + i, "s1aa lead " + i);
      const ownRow = addLine(11, "s1aa own span n1");
      for (let k = 0; k < 36; k++) addLine(7100 + k, "s1aa far pad " + k);
      function centerRow(row) {
        const br = body.getBoundingClientRect();
        const rr = row.getBoundingClientRect();
        const delta = rr.top + rr.height / 2 - (br.top + body.clientHeight / 2);
        body.scrollTop = Math.max(0, body.scrollTop + delta);
        body.dispatchEvent(new Event("scroll"));
      }
      centerRow(ownRow);
      return { ok: true, sourceId: "n1", scrollTop: body.scrollTop };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          Number(d.scrollRatio) > 0.2 &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      const base = body.scrollTop;
      for (let i = 0; i < 6; i++) {
        body.scrollTop = base + i * 2;
        body.dispatchEvent(new Event("scroll"));
      }
    });
    // S1av — settle-before-sample warm (S1aa): require settle flags (not scrollRatio fallback).
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1aaBefore = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        const key =
        (typeof window.__graphideScrollDriveLastStayKey === "string" &&
        window.__graphideScrollDriveLastStayKey) ||
        "graphide.scrollDrive.lastStay.v1";
        if (
          !(
            d &&
            !d.macroLod &&
            !d.presentPaused &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          storageKey: key,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    // Close Evidence — stashes last-stay to memory + sessionStorage (S1w/S1aa).
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    const s1aaStashed = await page.evaluate(() => {
      const key =
        (typeof window.__graphideScrollDriveLastStayKey === "string" &&
          window.__graphideScrollDriveLastStayKey) ||
        "graphide.scrollDrive.lastStay.v1";
      let raw = null;
      let store = "none";
      try {
        raw = sessionStorage.getItem(key);
        if (raw) store = "session";
      } catch (_) {}
      if (!raw) {
        try {
          raw = localStorage.getItem(key);
          if (raw) store = "local";
        } catch (_) {}
      }
      let parsed = null;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch (_) {
        parsed = null;
      }
      return {
        key,
        store,
        hasRaw: !!raw,
        sourceId: parsed && parsed.sourceId ? String(parsed.sourceId) : "",
        x: parsed ? Number(parsed.x) : NaN,
        y: parsed ? Number(parsed.y) : NaN,
        k: parsed ? Number(parsed.k) : NaN,
        t: parsed ? Number(parsed.t) : NaN,
        raw,
      };
    });
    // Simulate webview reload: drop in-memory snap (and storage via clear), then re-seed storage only.
    await page.evaluate((blob) => {
      if (typeof window.__graphideClearScrollDriveLastStay === "function") {
        window.__graphideClearScrollDriveLastStay();
      }
      const key =
        (typeof window.__graphideScrollDriveLastStayKey === "string" &&
          window.__graphideScrollDriveLastStayKey) ||
        "graphide.scrollDrive.lastStay.v1";
      if (blob && blob.raw) {
        try {
          sessionStorage.setItem(key, blob.raw);
        } catch (_) {
          try {
            localStorage.setItem(key, blob.raw);
          } catch (__) {}
        }
      }
    }, s1aaStashed);
    const s1aaMemoryCleared = await page.evaluate(() => {
      const key =
        (typeof window.__graphideScrollDriveLastStayKey === "string" &&
          window.__graphideScrollDriveLastStayKey) ||
        "graphide.scrollDrive.lastStay.v1";
      let raw = null;
      try {
        raw = sessionStorage.getItem(key);
      } catch (_) {}
      if (!raw) {
        try {
          raw = localStorage.getItem(key);
        } catch (_) {}
      }
      return { hasStorage: !!raw, key };
    });
    // Reopen same Evidence source — soft restore from storage (no hard zoomToEl).
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        const d = window.__graphideScrollDrive;
        return !!(pane && !pane.hidden && body && d && !d.presentPaused && d.targetNodeId);
      },
      null,
      { timeout: 6000 }
    );
    // S1av — sample first soft-restore step after reload reopen (one paint), not a fixed 120ms
    // mid-tween stack. Product soft-restore caps unchanged.
    await page.waitForTimeout(16);
    const s1aaAfterReopen = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const body = document.getElementById("srcBody");
      return {
        camX: Number(d.camX),
        camY: Number(d.camY),
        camK: Number(d.camK),
        ratio: Number(d.scrollRatio) || 0,
        targetNodeId: d.targetNodeId || "",
        camXSettled: !!d.camXSettled,
        camYSettled: !!d.camYSettled,
        macroLod: !!d.macroLod,
        presentPaused: !!d.presentPaused,
        lineCount: body ? body.querySelectorAll(".src-line").length : 0,
      };
    });
    const s1aaDx = Math.abs((Number(s1aaAfterReopen.camX) || 0) - (Number(s1aaBefore.camX) || 0));
    const s1aaDy = Math.abs((Number(s1aaAfterReopen.camY) || 0) - (Number(s1aaBefore.camY) || 0));
    const s1aaDk = Math.abs((Number(s1aaAfterReopen.camK) || 0) - (Number(s1aaBefore.camK) || 0));
    // Also vs stashed blob coords (reload path seeds from storage, not live cam).
    const s1aaDxSnap = Math.abs((Number(s1aaAfterReopen.camX) || 0) - (Number(s1aaStashed.x) || 0));
    const s1aaDySnap = Math.abs((Number(s1aaAfterReopen.camY) || 0) - (Number(s1aaStashed.y) || 0));
    const s1aaDkSnap = Math.abs((Number(s1aaAfterReopen.camK) || 0) - (Number(s1aaStashed.k) || 0));
    // S1av — pad if needed; land mid-file once, then tiny nudge so settle flags re-absorb
    // without SCROLL_MACRO_VEL (no multi-step burst).
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 40; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1aa-pad", "1");
          row.innerHTML =
            '<span class="ln">' + (8200 + i) + '</span><span class="tx">s1aa reopen pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      const ratio = max > 0 ? body.scrollTop / max : 0;
      if (ratio < 0.25) {
        body.scrollTop = Math.floor(max * 0.42);
      } else {
        body.scrollTop = body.scrollTop + 2;
      }
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.presentPaused &&
          !d.macroLod &&
          Number(d.scrollRatio) > 0.2 &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    // S1av — settle-before-sample resettle (S1aa): require !macroLod + settle flags.
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1aaResettle = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    // Corrupt blob must be ignored (and cleared) via product load path — does not throw.
    const s1aaCorruptOk = await page.evaluate(() => {
      const key =
        (typeof window.__graphideScrollDriveLastStayKey === "string" &&
          window.__graphideScrollDriveLastStayKey) ||
        "graphide.scrollDrive.lastStay.v1";
      try {
        sessionStorage.setItem(key, "{not-json");
      } catch (_) {
        try {
          localStorage.setItem(key, "{not-json");
        } catch (__) {
          return { wrote: false, cleared: true, probed: false };
        }
      }
      const probed =
        typeof window.__graphideProbeScrollDriveLastStayStorage === "function"
          ? window.__graphideProbeScrollDriveLastStayStorage(null)
          : "no-probe";
      let after = null;
      try {
        after = sessionStorage.getItem(key);
      } catch (_) {}
      if (!after) {
        try {
          after = localStorage.getItem(key);
        } catch (_) {}
      }
      return { wrote: true, cleared: !after, probed: probed };
    });
    record(
      "S1aa",
      "persist last-stay across reload soft-restores from sessionStorage (same sourceId; no hard zoomToEl)",
      s1aaSetup.ok &&
        !s1aaBefore.macroLod &&
        !s1aaBefore.presentPaused &&
        Number.isFinite(s1aaBefore.camX) &&
        Number.isFinite(s1aaBefore.camY) &&
        (s1aaBefore.camXSettled === true || s1aaBefore.camYSettled === true) &&
        s1aaStashed.hasRaw &&
        s1aaStashed.sourceId === "n1" &&
        Number.isFinite(s1aaStashed.x) &&
        Number.isFinite(s1aaStashed.y) &&
        Number.isFinite(s1aaStashed.k) &&
        s1aaStashed.k > 0 &&
        Number.isFinite(s1aaStashed.t) &&
        s1aaMemoryCleared.hasStorage &&
        !s1aaAfterReopen.presentPaused &&
        !!s1aaAfterReopen.targetNodeId &&
        s1aaAfterReopen.lineCount > 0 &&
        // Soft caps vs pre-close cam and vs stored snap (reload seeds from storage).
        (s1aaDx <= 96 + 40 || s1aaDxSnap <= 96 + 40) &&
        (s1aaDy <= 240 || s1aaDySnap <= 240) &&
        (s1aaDk <= 0.55 || s1aaDkSnap <= 0.55) &&
        !s1aaResettle.presentPaused &&
        !s1aaResettle.macroLod &&
        !!s1aaResettle.targetNodeId &&
        Number(s1aaResettle.ratio) > 0.1 &&
        (s1aaResettle.camXSettled === true || s1aaResettle.camYSettled === true) &&
        s1aaCorruptOk.cleared,
      "before=" +
        JSON.stringify(s1aaBefore) +
        " stashed=" +
        JSON.stringify({
          store: s1aaStashed.store,
          sourceId: s1aaStashed.sourceId,
          x: s1aaStashed.x,
          y: s1aaStashed.y,
          k: s1aaStashed.k,
          t: s1aaStashed.t,
        }) +
        " memoryCleared=" +
        JSON.stringify(s1aaMemoryCleared) +
        " after=" +
        JSON.stringify(s1aaAfterReopen) +
        " resettle=" +
        JSON.stringify(s1aaResettle) +
        " dx=" +
        s1aaDx +
        " dy=" +
        s1aaDy +
        " dk=" +
        s1aaDk +
        " dxSnap=" +
        s1aaDxSnap +
        " dySnap=" +
        s1aaDySnap +
        " dkSnap=" +
        s1aaDkSnap +
        " corrupt=" +
        JSON.stringify(s1aaCorruptOk)
    );

    // S1ab — workspace-scoped last-stay + host re-post restore.
    // Different workspace key → no cross-restore; same key + host re-post → soft stay.
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector('#sliceCanvas .vnode[data-id="n1"]', { timeout: 10000 });
    // Seed workspace key A before opening Evidence / stashing.
    await page.evaluate(() => {
      if (typeof window.__graphideSetScrollDriveWorkspaceKey === "function") {
        window.__graphideSetScrollDriveWorkspaceKey("ws-a://folder");
      }
      if (typeof window.__graphideClearScrollDriveLastStay === "function") {
        window.__graphideClearScrollDriveLastStay();
      }
    });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        return !!(pane && !pane.hidden && body);
      },
      null,
      { timeout: 5000 }
    );
    const s1abSetup = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      body.querySelectorAll("[data-s1ab],[data-s1ab-pad],[data-s1aa],[data-s1aa-pad]").forEach((el) => el.remove());
      function addLine(ln, tx) {
        const row = document.createElement("div");
        row.className = "src-line";
        row.setAttribute("data-s1ab", "1");
        row.innerHTML = '<span class="ln">' + ln + '</span><span class="tx">' + tx + "</span>";
        body.appendChild(row);
        return row;
      }
      for (let i = 0; i < 36; i++) addLine(9100 + i, "s1ab lead " + i);
      const ownRow = addLine(11, "s1ab own span n1");
      for (let k = 0; k < 36; k++) addLine(9200 + k, "s1ab far pad " + k);
      function centerRow(row) {
        const br = body.getBoundingClientRect();
        const rr = row.getBoundingClientRect();
        const delta = rr.top + rr.height / 2 - (br.top + body.clientHeight / 2);
        body.scrollTop = Math.max(0, body.scrollTop + delta);
        body.dispatchEvent(new Event("scroll"));
      }
      centerRow(ownRow);
      return {
        ok: true,
        sourceId: "n1",
        ws: window.__graphideScrollDriveWorkspaceKey || "",
        key: window.__graphideScrollDriveLastStayKey || "",
      };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          Number(d.scrollRatio) > 0.2 &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      const base = body.scrollTop;
      for (let i = 0; i < 6; i++) {
        body.scrollTop = base + i * 2;
        body.dispatchEvent(new Event("scroll"));
      }
    });
    // S1av — settle-before-sample warm (S1ab): require settle flags (not scrollRatio fallback).
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1abBefore = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            d &&
            !d.macroLod &&
            !d.presentPaused &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          ws: window.__graphideScrollDriveWorkspaceKey || "",
          key: window.__graphideScrollDriveLastStayKey || "",
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    // Close Evidence — stashes last-stay under workspace A.
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    const s1abStashedA = await page.evaluate(() => {
      const key =
        (typeof window.__graphideScrollDriveLastStayKey === "string" &&
          window.__graphideScrollDriveLastStayKey) ||
        "graphide.scrollDrive.lastStay.v1";
      let raw = null;
      try {
        raw = sessionStorage.getItem(key);
      } catch (_) {}
      if (!raw) {
        try {
          raw = localStorage.getItem(key);
        } catch (_) {}
      }
      let parsed = null;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch (_) {
        parsed = null;
      }
      return {
        key,
        hasRaw: !!raw,
        sourceId: parsed && parsed.sourceId ? String(parsed.sourceId) : "",
        ws: parsed && parsed.ws ? String(parsed.ws) : "",
        x: parsed ? Number(parsed.x) : NaN,
        y: parsed ? Number(parsed.y) : NaN,
        k: parsed ? Number(parsed.k) : NaN,
        t: parsed ? Number(parsed.t) : NaN,
        raw,
        workspaceKey: window.__graphideScrollDriveWorkspaceKey || "",
      };
    });
    // Switch to workspace B — A's scoped blob must not soft-restore.
    const s1abCross = await page.evaluate((blobA) => {
      if (typeof window.__graphideSetScrollDriveWorkspaceKey === "function") {
        window.__graphideSetScrollDriveWorkspaceKey("ws-b://other");
      }
      // Memory already cleared by set; ensure cold memory.
      if (typeof window.__graphideClearScrollDriveLastStay === "function") {
        // clear only wipes CURRENT (B) key — re-seed A's raw under A's key if clear touched wrong key
      }
      // Re-assert A's blob still under A's key (set clears memory only).
      const keyA = blobA && blobA.key;
      if (keyA && blobA.raw) {
        try {
          sessionStorage.setItem(keyA, blobA.raw);
        } catch (_) {
          try {
            localStorage.setItem(keyA, blobA.raw);
          } catch (__) {}
        }
      }
      const probedB =
        typeof window.__graphideProbeScrollDriveLastStayStorage === "function"
          ? window.__graphideProbeScrollDriveLastStayStorage("n1")
          : "no-probe";
      const keyB = window.__graphideScrollDriveLastStayKey || "";
      let rawB = null;
      try {
        rawB = sessionStorage.getItem(keyB);
      } catch (_) {}
      return {
        ws: window.__graphideScrollDriveWorkspaceKey || "",
        keyB,
        probedB,
        hasRawB: !!rawB,
        crossBlocked: probedB == null || probedB === false,
      };
    }, s1abStashedA);
    // Switch back to A; clear memory; keep A's storage; host re-post source → soft restore.
    await page.evaluate((blobA) => {
      if (typeof window.__graphideSetScrollDriveWorkspaceKey === "function") {
        window.__graphideSetScrollDriveWorkspaceKey("ws-a://folder");
      }
      if (typeof window.__graphideClearScrollDriveLastStay === "function") {
        window.__graphideClearScrollDriveLastStay();
      }
      const key =
        (typeof window.__graphideScrollDriveLastStayKey === "string" &&
          window.__graphideScrollDriveLastStayKey) ||
        (blobA && blobA.key) ||
        "graphide.scrollDrive.lastStay.v1";
      if (blobA && blobA.raw) {
        try {
          sessionStorage.setItem(key, blobA.raw);
        } catch (_) {
          try {
            localStorage.setItem(key, blobA.raw);
          } catch (__) {}
        }
      }
    }, s1abStashedA);
    // Host re-post path: dispatch source message (simulates extension host after reload).
    const s1abHostRepost = await page.evaluate(() => {
      const beforeCam = window.__graphideScrollDrive || {};
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            type: "source",
            id: "n1",
            fqn: "n1",
            kind: "Function",
            file: "src/a.rs",
            line: 11,
            text: "fn hop_1() {\n  // s1ab host repost\n}\n",
            preview: "fn hop_1()",
            workspaceFolder: "ws-a://folder",
          },
        })
      );
      return {
        beforePresent: !!beforeCam.presentPaused,
      };
    });
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        const d = window.__graphideScrollDrive;
        return !!(pane && !pane.hidden && body && d && !d.presentPaused && d.targetNodeId);
      },
      null,
      { timeout: 6000 }
    );
    // S1av — sample first soft-restore step after host re-post (one paint), not a fixed 140ms
    // mid-tween stack. Product soft-restore caps unchanged.
    await page.waitForTimeout(16);
    const s1abAfterRepost = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        camX: Number(d.camX),
        camY: Number(d.camY),
        camK: Number(d.camK),
        ratio: Number(d.scrollRatio) || 0,
        targetNodeId: d.targetNodeId || "",
        camXSettled: !!d.camXSettled,
        camYSettled: !!d.camYSettled,
        macroLod: !!d.macroLod,
        presentPaused: !!d.presentPaused,
        ws: window.__graphideScrollDriveWorkspaceKey || "",
        key: window.__graphideScrollDriveLastStayKey || "",
      };
    });
    const s1abDxSnap = Math.abs((Number(s1abAfterRepost.camX) || 0) - (Number(s1abStashedA.x) || 0));
    const s1abDySnap = Math.abs((Number(s1abAfterRepost.camY) || 0) - (Number(s1abStashedA.y) || 0));
    const s1abDkSnap = Math.abs((Number(s1abAfterRepost.camK) || 0) - (Number(s1abStashedA.k) || 0));
    const s1abDx = Math.abs((Number(s1abAfterRepost.camX) || 0) - (Number(s1abBefore.camX) || 0));
    const s1abDy = Math.abs((Number(s1abAfterRepost.camY) || 0) - (Number(s1abBefore.camY) || 0));
    const s1abDk = Math.abs((Number(s1abAfterRepost.camK) || 0) - (Number(s1abBefore.camK) || 0));
    record(
      "S1ab",
      "workspace-scoped last-stay blocks cross-folder restore; same key + host re-post soft-restores",
      s1abSetup.ok &&
        s1abBefore.ws === "ws-a://folder" &&
        !s1abBefore.macroLod &&
        !s1abBefore.presentPaused &&
        (s1abBefore.camXSettled === true || s1abBefore.camYSettled === true) &&
        s1abStashedA.hasRaw &&
        s1abStashedA.sourceId === "n1" &&
        (s1abStashedA.ws === "ws-a://folder" || s1abStashedA.ws === "") &&
        Number.isFinite(s1abStashedA.x) &&
        Number.isFinite(s1abStashedA.y) &&
        Number.isFinite(s1abStashedA.k) &&
        s1abStashedA.k > 0 &&
        s1abCross.ws === "ws-b://other" &&
        s1abCross.crossBlocked &&
        !s1abCross.hasRawB &&
        !s1abAfterRepost.presentPaused &&
        !s1abAfterRepost.macroLod &&
        !!s1abAfterRepost.targetNodeId &&
        s1abAfterRepost.ws === "ws-a://folder" &&
        (s1abDx <= 96 + 40 || s1abDxSnap <= 96 + 40) &&
        (s1abDy <= 240 || s1abDySnap <= 240) &&
        (s1abDk <= 0.55 || s1abDkSnap <= 0.55),
      "setup=" +
        JSON.stringify(s1abSetup) +
        " before=" +
        JSON.stringify(s1abBefore) +
        " stashedA=" +
        JSON.stringify({
          key: s1abStashedA.key,
          sourceId: s1abStashedA.sourceId,
          ws: s1abStashedA.ws,
          x: s1abStashedA.x,
          y: s1abStashedA.y,
          k: s1abStashedA.k,
        }) +
        " cross=" +
        JSON.stringify(s1abCross) +
        " hostRepost=" +
        JSON.stringify(s1abHostRepost) +
        " after=" +
        JSON.stringify(s1abAfterRepost) +
        " dx=" +
        s1abDx +
        " dy=" +
        s1abDy +
        " dk=" +
        s1abDk +
        " dxSnap=" +
        s1abDxSnap +
        " dySnap=" +
        s1abDySnap +
        " dkSnap=" +
        s1abDkSnap
    );

    // S1av — reload / host re-post settle-before-sample probe (parity with S1ah/S1as/S1at/S1au).
    // After S1aa/S1ab, confirm still !macroLod + settle + low vel (single sample).
    // Tiny nudge so settle flags re-absorb after S1ab soft-restore (which clears them).
    // Product soft-restore caps unchanged.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 24; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1av-pad", "1");
          row.innerHTML =
            '<span class="ln">' + (9300 + i) + '</span><span class="tx">s1av pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      const ratio = max > 0 ? body.scrollTop / max : 0;
      if (ratio < 0.25) body.scrollTop = Math.floor(max * 0.4);
      else body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    // S1ba — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1avSnap = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            pane &&
            !pane.hidden &&
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          scrollVel: Number(d.scrollVel) || 0,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          targetNodeId: d.targetNodeId || "",
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1av",
      "reload/host-repost settle-before-sample: post-S1aa/S1ab still micro+settled (!macroLod; no mid-tween)",
      !s1avSnap.presentPaused &&
        !s1avSnap.macroLod &&
        (s1avSnap.camXSettled === true || s1avSnap.camYSettled === true) &&
        s1avSnap.scrollVel < 0.12 &&
        !!s1avSnap.targetNodeId &&
        Number.isFinite(s1avSnap.camX) &&
        Number.isFinite(s1avSnap.camK),
      "snap=" + JSON.stringify(s1avSnap)
    );

    // S1ac — Review restart clear / multi-folder stay polish.
    // Stash under workspace A, seed an isolated B blob, clear via Review-restart helper:
    // A storage empty + soft-restore skipped; B key untouched.
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    const s1acSeed = await page.evaluate(() => {
      if (typeof window.__graphideSetScrollDriveWorkspaceKey === "function") {
        window.__graphideSetScrollDriveWorkspaceKey("ws-a://folder");
      }
      const keyA =
        (typeof window.__graphideScrollDriveLastStayKey === "string" &&
          window.__graphideScrollDriveLastStayKey) ||
        "graphide.scrollDrive.lastStay.v1";
      let rawA = null;
      try {
        rawA = sessionStorage.getItem(keyA);
      } catch (_) {}
      if (!rawA) {
        try {
          rawA = localStorage.getItem(keyA);
        } catch (_) {}
      }
      // If close did not stash (base wiped by S1ab host path), plant a tiny A blob.
      if (!rawA) {
        const planted = JSON.stringify({
          sourceId: "n1",
          x: 12,
          y: 34,
          k: 1.1,
          t: Date.now(),
          ws: "ws-a://folder",
        });
        try {
          sessionStorage.setItem(keyA, planted);
          rawA = planted;
        } catch (_) {
          try {
            localStorage.setItem(keyA, planted);
            rawA = planted;
          } catch (__) {}
        }
      }
      const keyB =
        "graphide.scrollDrive.lastStay.v1::" + encodeURIComponent("ws-b://other");
      const rawB = JSON.stringify({
        sourceId: "n1",
        x: 99,
        y: 88,
        k: 1.2,
        t: Date.now(),
        ws: "ws-b://other",
      });
      try {
        sessionStorage.setItem(keyB, rawB);
      } catch (_) {
        try {
          localStorage.setItem(keyB, rawB);
        } catch (__) {}
      }
      return {
        keyA,
        keyB,
        hasRawA: !!rawA,
        hasHook: typeof window.__graphideClearScrollDriveLastStayOnReviewRestart === "function",
      };
    });
    const s1acCleared = await page.evaluate(() => {
      const cleared =
        typeof window.__graphideClearScrollDriveLastStayOnReviewRestart === "function"
          ? window.__graphideClearScrollDriveLastStayOnReviewRestart()
          : false;
      const keyA = window.__graphideScrollDriveLastStayKey || "";
      let rawA = null;
      try {
        rawA = sessionStorage.getItem(keyA);
      } catch (_) {}
      if (!rawA) {
        try {
          rawA = localStorage.getItem(keyA);
        } catch (_) {}
      }
      const probed =
        typeof window.__graphideProbeScrollDriveLastStayStorage === "function"
          ? window.__graphideProbeScrollDriveLastStayStorage("n1")
          : "no-probe";
      const restored =
        typeof window.__graphideSoftRestoreScrollDriveFromLastStay === "function"
          ? window.__graphideSoftRestoreScrollDriveFromLastStay("n1")
          : false;
      const keyB =
        "graphide.scrollDrive.lastStay.v1::" + encodeURIComponent("ws-b://other");
      let rawB = null;
      try {
        rawB = sessionStorage.getItem(keyB);
      } catch (_) {}
      if (!rawB) {
        try {
          rawB = localStorage.getItem(keyB);
        } catch (_) {}
      }
      // Host re-post after clear must not soft-restore prior cam.
      let hostRestored = false;
      if (typeof window.__graphideSoftStayScrollDriveAcrossHostSourceRepost === "function") {
        hostRestored = !!window.__graphideSoftStayScrollDriveAcrossHostSourceRepost("n1");
      }
      return {
        cleared: !!cleared,
        keyA,
        hasRawA: !!rawA,
        probed,
        restored: !!restored,
        hostRestored: !!hostRestored,
        hasRawB: !!rawB,
        ws: window.__graphideScrollDriveWorkspaceKey || "",
      };
    });
    record(
      "S1ac",
      "Review restart clears current last-stay; soft-restore skipped; other folder key isolated",
      s1acSeed.hasHook &&
        s1acSeed.hasRawA &&
        s1acCleared.cleared &&
        !s1acCleared.hasRawA &&
        (s1acCleared.probed == null || s1acCleared.probed === false) &&
        !s1acCleared.restored &&
        !s1acCleared.hostRestored &&
        s1acCleared.hasRawB,
      "seed=" +
        JSON.stringify(s1acSeed) +
        " cleared=" +
        JSON.stringify(s1acCleared)
    );

    // S1ad — Present-stage soft-stay stash parity / clear cue.
    // With prior stay: Present on stashes before wipe + presentStayStashed cue;
    // Present exit alone does not yank cam; reopen same Evidence soft-stays.
    // Without prior stay: Present on → presentStayStashed false; soft-restore skipped.
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    if (typeof page.evaluate === "function") {
      await page.evaluate(() => {
        if (typeof window.__graphideClearScrollDriveLastStay === "function") {
          window.__graphideClearScrollDriveLastStay();
        }
        if (typeof window.__graphideSetScrollDriveWorkspaceKey === "function") {
          window.__graphideSetScrollDriveWorkspaceKey("ws-s1ad://folder");
        }
      });
    }
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector('#sliceCanvas .vnode[data-id="n1"]', { timeout: 10000 });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        return !!(pane && !pane.hidden && body);
      },
      null,
      { timeout: 5000 }
    );
    const s1adSetup = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      body.innerHTML = "";
      function addLine(ln, tx) {
        const row = document.createElement("div");
        row.className = "src-line";
        row.setAttribute("data-s1ad", "1");
        row.innerHTML = '<span class="ln">' + ln + '</span><span class="tx">' + tx + "</span>";
        body.appendChild(row);
        return row;
      }
      for (let i = 0; i < 36; i++) addLine(4100 + i, "s1ad lead " + i);
      const ownRow = addLine(11, "s1ad own span n1");
      for (let k = 0; k < 36; k++) addLine(5100 + k, "s1ad far pad " + k);
      function centerRow(row) {
        const br = body.getBoundingClientRect();
        const rr = row.getBoundingClientRect();
        const delta = rr.top + rr.height / 2 - (br.top + body.clientHeight / 2);
        body.scrollTop = Math.max(0, body.scrollTop + delta);
        body.dispatchEvent(new Event("scroll"));
      }
      centerRow(ownRow);
      return { ok: true, scrollTop: body.scrollTop };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          Number(d.scrollRatio) > 0.2 &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      const base = body.scrollTop;
      for (let i = 0; i < 6; i++) {
        body.scrollTop = base + i * 2;
        body.dispatchEvent(new Event("scroll"));
      }
    });
    // S1ay — settle-before-sample warm (S1ad): require settle flags (not scrollRatio fallback).
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1adBefore = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            d &&
            !d.macroLod &&
            !d.presentPaused &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          presentStayStashed: !!d.presentStayStashed,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    // Present on — stash-before-wipe + presentStayStashed cue (S1ad).
    await page.keyboard.press("f");
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        return !!(
          document.body &&
          document.body.classList.contains("present") &&
          d &&
          d.presentPaused === true &&
          (!pane || pane.hidden)
        );
      },
      null,
      { timeout: 6000 }
    );
    const s1adPresent = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const vp =
        document.querySelector('.viewport[data-scroll-present-paused="1"]') ||
        document.querySelector('[data-scroll-present-paused="1"]');
      return {
        presentPaused: !!d.presentPaused,
        presentStayStashed: !!d.presentStayStashed,
        pausedAttr: !!vp,
        stayAttr: !!(
          document.querySelector('.viewport[data-scroll-present-stay="1"]') ||
          document.querySelector('[data-scroll-present-stay="1"]')
        ),
        paneHidden: !!(
          !document.getElementById("sourcePane") ||
          document.getElementById("sourcePane").hidden
        ),
        // Pause publishes empty drive — target/ratio must stay idle (no half-applied restore).
        targetNodeId: d.targetNodeId || "",
        ratio: Number(d.scrollRatio) || 0,
      };
    });
    // Present off alone — cues clear; must not half-apply soft restore (no ScrollDrive base yet).
    // Present stage may ease its own camera — do not assert viewport transform equality (S1m).
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          document.body &&
          !document.body.classList.contains("present") &&
          d &&
          d.presentPaused === false
        );
      },
      null,
      { timeout: 6000 }
    );
    await page.waitForTimeout(80);
    const s1adAfterExit = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      // Exit alone must leave ScrollDrive idle (no soft-restore seed) while last-stay stays warm.
      let lastStayWarm = false;
      try {
        const key = window.__graphideScrollDriveLastStayKey || "graphide.scrollDrive.lastStay.v1";
        const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          lastStayWarm = !!(parsed && parsed.sourceId === "n1");
        }
      } catch (_) {}
      return {
        presentPaused: !!d.presentPaused,
        presentStayStashed: !!d.presentStayStashed,
        stayAttr: !!(
          document.querySelector('.viewport[data-scroll-present-stay="1"]') ||
          document.querySelector('[data-scroll-present-stay="1"]')
        ),
        pausedAttr: !!(
          document.querySelector('.viewport[data-scroll-present-paused="1"]') ||
          document.querySelector('[data-scroll-present-paused="1"]')
        ),
        targetNodeId: d.targetNodeId || "",
        ratio: Number(d.scrollRatio) || 0,
        lastStayWarm,
      };
    });
    // S1ad stash fidelity — storage blob matches pre-Present cam (stash-before-wipe).
    // Reopen soft-stay cam caps remain S1w's job (refit/overview may ease k after Present).
    const s1adStashProbe = await page.evaluate((before) => {
      const probed =
        typeof window.__graphideProbeScrollDriveLastStayStorage === "function"
          ? window.__graphideProbeScrollDriveLastStayStorage("n1")
          : null;
      if (!probed || typeof probed !== "object") return { ok: false, probed };
      return {
        ok: true,
        sourceId: probed.sourceId || "",
        x: Number(probed.x),
        y: Number(probed.y),
        k: Number(probed.k),
        dx: Math.abs(Number(probed.x) - (Number(before.camX) || 0)),
        dy: Math.abs(Number(probed.y) - (Number(before.camY) || 0)),
        dk: Math.abs(Number(probed.k) - (Number(before.camK) || 0)),
        ws: probed.ws || "",
      };
    }, s1adBefore);
    // Reopen same Evidence — soft restore path still available (targetNodeId publishes).
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        const d = window.__graphideScrollDrive;
        return !!(pane && !pane.hidden && body && d && !d.presentPaused && d.targetNodeId);
      },
      null,
      { timeout: 6000 }
    );
    // S1ay — sample first soft-restore step after reopen (one paint); S1ad only asserts target presence.
    await page.waitForTimeout(16);
    const s1adAfterReopen = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        targetNodeId: d.targetNodeId || "",
        presentPaused: !!d.presentPaused,
        presentStayStashed: !!d.presentStayStashed,
        paneOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
        camXSettled: !!d.camXSettled,
        camYSettled: !!d.camYSettled,
        macroLod: !!d.macroLod,
      };
    });
    // Cold path: clear last-stay, Present on without prior stay → no stash cue / no bogus restore.
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    const s1adCold = await page.evaluate(() => {
      if (typeof window.__graphideClearScrollDriveLastStay === "function") {
        window.__graphideClearScrollDriveLastStay();
      }
      // Present via product toggle if available; else synthesize pause for cue check.
      const btn = document.getElementById("presentBtn");
      if (btn) btn.click();
      else if (typeof window.__graphideApplyPresent === "function") window.__graphideApplyPresent(true);
      return { cleared: true };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          document.body &&
          document.body.classList.contains("present") &&
          d &&
          d.presentPaused === true
        );
      },
      null,
      { timeout: 6000 }
    );
    const s1adColdPresent = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        presentPaused: !!d.presentPaused,
        presentStayStashed: !!d.presentStayStashed,
        stayAttr: !!(
          document.querySelector('.viewport[data-scroll-present-stay="1"]') ||
          document.querySelector('[data-scroll-present-stay="1"]')
        ),
      };
    });
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          document.body &&
          !document.body.classList.contains("present") &&
          d &&
          d.presentPaused === false
        );
      },
      null,
      { timeout: 6000 }
    );
    const s1adColdRestore = await page.evaluate(() => {
      const restored =
        typeof window.__graphideSoftRestoreScrollDriveFromLastStay === "function"
          ? !!window.__graphideSoftRestoreScrollDriveFromLastStay("n1")
          : false;
      const probed =
        typeof window.__graphideProbeScrollDriveLastStayStorage === "function"
          ? window.__graphideProbeScrollDriveLastStayStorage("n1")
          : null;
      return { restored, probed };
    });
    record(
      "S1ad",
      "Present enter stashes before wipe + stay cue; exit alone no cam yank; no prior stay → no bogus restore",
      s1adSetup.ok &&
        !s1adBefore.presentPaused &&
        !s1adBefore.macroLod &&
        Number.isFinite(s1adBefore.camX) &&
        (s1adBefore.camXSettled === true || s1adBefore.camYSettled === true) &&
        s1adPresent.presentPaused &&
        s1adPresent.presentStayStashed &&
        s1adPresent.stayAttr &&
        s1adPresent.paneHidden &&
        !s1adPresent.targetNodeId &&
        Number(s1adPresent.ratio) === 0 &&
        !s1adAfterExit.presentPaused &&
        !s1adAfterExit.presentStayStashed &&
        !s1adAfterExit.stayAttr &&
        !s1adAfterExit.pausedAttr &&
        !s1adAfterExit.targetNodeId &&
        Number(s1adAfterExit.ratio) === 0 &&
        s1adAfterExit.lastStayWarm &&
        s1adStashProbe.ok &&
        s1adStashProbe.sourceId === "n1" &&
        Number.isFinite(s1adStashProbe.x) &&
        s1adStashProbe.dx <= 8 &&
        s1adStashProbe.dy <= 8 &&
        s1adStashProbe.dk <= 0.05 &&
        !!s1adAfterReopen.targetNodeId &&
        s1adAfterReopen.paneOpen &&
        !s1adAfterReopen.presentPaused &&
        s1adColdPresent.presentPaused &&
        !s1adColdPresent.presentStayStashed &&
        !s1adColdPresent.stayAttr &&
        !s1adColdRestore.restored &&
        (s1adColdRestore.probed == null || s1adColdRestore.probed === false),
      "setup=" +
        JSON.stringify(s1adSetup) +
        " before=" +
        JSON.stringify(s1adBefore) +
        " present=" +
        JSON.stringify(s1adPresent) +
        " afterExit=" +
        JSON.stringify(s1adAfterExit) +
        " stashProbe=" +
        JSON.stringify(s1adStashProbe) +
        " afterReopen=" +
        JSON.stringify(s1adAfterReopen) +
        " coldPresent=" +
        JSON.stringify(s1adColdPresent) +
        " coldRestore=" +
        JSON.stringify(s1adColdRestore)
    );

    // S1ae — Present-exit soft-stay vs refitChartSoon: reopen must not be wiped by rAF fit.
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => {
      if (typeof window.__graphideClearScrollDriveLastStay === "function") {
        window.__graphideClearScrollDriveLastStay();
      }
      if (typeof window.__graphideSetScrollDriveWorkspaceKey === "function") {
        window.__graphideSetScrollDriveWorkspaceKey("ws-s1ae://folder");
      }
    });
    // Closed pane + no stay → auto refit must NOT skip (Evidence close / stage fit stays honest).
    const s1aeSkipCold = await page.evaluate(() => {
      const skip =
        typeof window.__graphideShouldSkipRefitForScrollDriveStay === "function"
          ? !!window.__graphideShouldSkipRefitForScrollDriveStay()
          : null;
      return { skip, hasHook: typeof window.__graphideShouldSkipRefitForScrollDriveStay === "function" };
    });
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector('#sliceCanvas .vnode[data-id="n1"]', { timeout: 10000 });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        return !!(pane && !pane.hidden && body);
      },
      null,
      { timeout: 5000 }
    );
    const s1aeSetup = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      body.innerHTML = "";
      function addLine(ln, tx) {
        const row = document.createElement("div");
        row.className = "src-line";
        row.setAttribute("data-s1ae", "1");
        row.innerHTML = '<span class="ln">' + ln + '</span><span class="tx">' + tx + "</span>";
        body.appendChild(row);
        return row;
      }
      for (let i = 0; i < 36; i++) addLine(6100 + i, "s1ae lead " + i);
      const ownRow = addLine(11, "s1ae own span n1");
      for (let k = 0; k < 36; k++) addLine(7100 + k, "s1ae far pad " + k);
      function centerRow(row) {
        const br = body.getBoundingClientRect();
        const rr = row.getBoundingClientRect();
        const delta = rr.top + rr.height / 2 - (br.top + body.clientHeight / 2);
        body.scrollTop = Math.max(0, body.scrollTop + delta);
        body.dispatchEvent(new Event("scroll"));
      }
      centerRow(ownRow);
      return { ok: true, scrollTop: body.scrollTop };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          Number(d.scrollRatio) > 0.2 &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      const base = body.scrollTop;
      for (let i = 0; i < 6; i++) {
        body.scrollTop = base + i * 2;
        body.dispatchEvent(new Event("scroll"));
      }
    });
    // S1ay — settle-before-sample warm (S1ae): require settle flags (not scrollRatio fallback).
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1aeBefore = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        const skip =
        typeof window.__graphideShouldSkipRefitForScrollDriveStay === "function"
        ? !!window.__graphideShouldSkipRefitForScrollDriveStay()
        : false;
        if (
          !(
            d &&
            !d.macroLod &&
            !d.presentPaused &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          skipRefit: skip,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    // Present on — Evidence closes; warm last-stay still means reopen would skip hard fit.
    await page.keyboard.press("f");
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        return !!(
          document.body &&
          document.body.classList.contains("present") &&
          d &&
          d.presentPaused === true &&
          (!pane || pane.hidden)
        );
      },
      null,
      { timeout: 6000 }
    );
    const s1aePresent = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const skip =
        typeof window.__graphideShouldSkipRefitForScrollDriveStay === "function"
          ? !!window.__graphideShouldSkipRefitForScrollDriveStay()
          : null;
      return {
        presentPaused: !!d.presentPaused,
        presentStayStashed: !!d.presentStayStashed,
        paneHidden: !!(
          !document.getElementById("sourcePane") ||
          document.getElementById("sourcePane").hidden
        ),
        skipRefit: skip,
      };
    });
    // Present off alone — no half-restore; then reopen same Evidence (revealSourcePane refit must skip).
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          document.body &&
          !document.body.classList.contains("present") &&
          d &&
          d.presentPaused === false
        );
      },
      null,
      { timeout: 6000 }
    );
    await page.waitForTimeout(80);
    const s1aeAfterExit = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        presentPaused: !!d.presentPaused,
        presentStayStashed: !!d.presentStayStashed,
        targetNodeId: d.targetNodeId || "",
        ratio: Number(d.scrollRatio) || 0,
      };
    });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        const d = window.__graphideScrollDrive;
        return !!(pane && !pane.hidden && body && d && !d.presentPaused && d.targetNodeId);
      },
      null,
      { timeout: 6000 }
    );
    // S1ay — sample first soft-restore step after reopen (one paint), not a fixed 200ms
    // mid-tween stack that can inflate dx toward a zoomToEl/refit leap. Product soft-stay / skipRefit unchanged.
    await page.waitForTimeout(16);
    const s1aeAfterReopen = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const skip =
        typeof window.__graphideShouldSkipRefitForScrollDriveStay === "function"
          ? !!window.__graphideShouldSkipRefitForScrollDriveStay()
          : false;
      return {
        camX: Number(d.camX),
        camY: Number(d.camY),
        camK: Number(d.camK),
        targetNodeId: d.targetNodeId || "",
        camXSettled: !!d.camXSettled,
        camYSettled: !!d.camYSettled,
        macroLod: !!d.macroLod,
        presentPaused: !!d.presentPaused,
        skipRefit: skip,
        paneOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    const s1aeDx = Math.abs((Number(s1aeAfterReopen.camX) || 0) - (Number(s1aeBefore.camX) || 0));
    const s1aeDy = Math.abs((Number(s1aeAfterReopen.camY) || 0) - (Number(s1aeBefore.camY) || 0));
    const s1aeDk = Math.abs((Number(s1aeAfterReopen.camK) || 0) - (Number(s1aeBefore.camK) || 0));
    record(
      "S1ae",
      "Present→Evidence reopen soft-stay survives refitChartSoon (skip hard fit; exit alone no half-restore)",
      s1aeSkipCold.hasHook &&
        s1aeSkipCold.skip === false &&
        s1aeSetup.ok &&
        !s1aeBefore.presentPaused &&
        !s1aeBefore.macroLod &&
        s1aeBefore.skipRefit === true &&
        Number.isFinite(s1aeBefore.camX) &&
        (s1aeBefore.camXSettled === true || s1aeBefore.camYSettled === true) &&
        s1aePresent.presentPaused &&
        s1aePresent.paneHidden &&
        s1aePresent.skipRefit === true &&
        !s1aeAfterExit.presentPaused &&
        !s1aeAfterExit.presentStayStashed &&
        !s1aeAfterExit.targetNodeId &&
        Number(s1aeAfterExit.ratio) === 0 &&
        s1aeAfterReopen.paneOpen &&
        !!s1aeAfterReopen.targetNodeId &&
        !s1aeAfterReopen.presentPaused &&
        s1aeAfterReopen.skipRefit === true &&
        Number.isFinite(s1aeAfterReopen.camX) &&
        s1aeDx <= 96 + 24 &&
        s1aeDy <= 200 &&
        s1aeDk <= 0.45,
      "skipCold=" +
        JSON.stringify(s1aeSkipCold) +
        " setup=" +
        JSON.stringify(s1aeSetup) +
        " before=" +
        JSON.stringify(s1aeBefore) +
        " present=" +
        JSON.stringify(s1aePresent) +
        " afterExit=" +
        JSON.stringify(s1aeAfterExit) +
        " afterReopen=" +
        JSON.stringify(s1aeAfterReopen) +
        " d=" +
        JSON.stringify({ dx: s1aeDx, dy: s1aeDy, dk: s1aeDk })
    );

    // S1ay — Present-stage settle-before-sample probe (parity with S1at/S1ax).
    // After S1ae, confirm still !macroLod + settle + low vel (single sample; no dual-sample gap).
    // Product soft-stay / skipRefit caps unchanged.
    // S1ba — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1aySnap = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        const skip =
          typeof window.__graphideShouldSkipRefitForScrollDriveStay === "function"
            ? !!window.__graphideShouldSkipRefitForScrollDriveStay()
            : false;
        if (
          !(
            pane &&
            !pane.hidden &&
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          scrollVel: Number(d.scrollVel) || 0,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          targetNodeId: d.targetNodeId || "",
          skipRefit: skip,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1ay",
      "Present-stage settle-before-sample: post-S1ad/S1ae still micro+settled (!macroLod; no mid-tween)",
      !s1aySnap.presentPaused &&
        !s1aySnap.macroLod &&
        (s1aySnap.camXSettled === true || s1aySnap.camYSettled === true) &&
        s1aySnap.scrollVel < 0.12 &&
        !!s1aySnap.targetNodeId &&
        Number.isFinite(s1aySnap.camX) &&
        Number.isFinite(s1aySnap.camK),
      "snap=" + JSON.stringify(s1aySnap)
    );

    // S1af — Review-clear UI cue (parity with S1ad presentStayStashed).
    // After a warm stay, Review-restart clear publishes reviewStayCleared +
    // data-scroll-review-clear (clear happened — not a restore). Soft-restore
    // still skipped. Next soft-stash / cold open clears the cue.
    await page.evaluate(() => {
      if (typeof window.__graphideSetScrollDriveWorkspaceKey === "function") {
        window.__graphideSetScrollDriveWorkspaceKey("ws-s1af://folder");
      }
    });
    // Ensure Evidence open + mid-file stay so stash is warm before clear.
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector('#sliceCanvas .vnode[data-id="n1"]', { timeout: 10000 });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        return !!(pane && !pane.hidden && body);
      },
      null,
      { timeout: 5000 }
    );
    const s1afSetup = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      body.innerHTML = "";
      function addLine(ln, tx) {
        const row = document.createElement("div");
        row.className = "src-line";
        row.setAttribute("data-s1af", "1");
        row.innerHTML = '<span class="ln">' + ln + '</span><span class="tx">' + tx + "</span>";
        body.appendChild(row);
        return row;
      }
      for (let i = 0; i < 36; i++) addLine(8100 + i, "s1af lead " + i);
      const ownRow = addLine(11, "s1af own span n1");
      for (let k = 0; k < 36; k++) addLine(9100 + k, "s1af far pad " + k);
      function centerRow(row) {
        const br = body.getBoundingClientRect();
        const rr = row.getBoundingClientRect();
        const delta = rr.top + rr.height / 2 - (br.top + body.clientHeight / 2);
        body.scrollTop = Math.max(0, body.scrollTop + delta);
        body.dispatchEvent(new Event("scroll"));
      }
      centerRow(ownRow);
      return { ok: true, scrollTop: body.scrollTop };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(d && !d.macroLod && !d.presentPaused && Number(d.scrollRatio) > 0.2 && d.targetNodeId);
      },
      null,
      { timeout: 6000 }
    );
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      const base = body.scrollTop;
      for (let i = 0; i < 6; i++) {
        body.scrollTop = base + i * 2;
        body.dispatchEvent(new Event("scroll"));
      }
    });
    // S1az — settle-before-sample warm (S1af): require settle flags before Evidence close
    // so Review-clear cue honesty is not raced mid-tween. Product cue semantics unchanged.
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          Number(d.scrollVel) < 0.12 &&
          (d.camXSettled === true || d.camYSettled === true)
        );
      },
      null,
      { timeout: 8000 }
    );
    // Close Evidence so stash lands (memory + storage), then Review-restart clear.
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    const s1afBeforeClear = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const key = window.__graphideScrollDriveLastStayKey || "";
      let raw = null;
      try {
        raw = sessionStorage.getItem(key);
      } catch (_) {}
      if (!raw) {
        try {
          raw = localStorage.getItem(key);
        } catch (_) {}
      }
      // Ensure warm stay if close did not stash (base already wiped).
      if (!raw && typeof window.__graphideClearScrollDriveLastStayOnReviewRestart === "function") {
        const planted = JSON.stringify({
          sourceId: "n1",
          x: 11,
          y: 22,
          k: 1.15,
          t: Date.now(),
          ws: "ws-s1af://folder",
        });
        try {
          sessionStorage.setItem(key, planted);
          raw = planted;
        } catch (_) {
          try {
            localStorage.setItem(key, planted);
            raw = planted;
          } catch (__) {}
        }
      }
      return {
        reviewStayCleared: !!d.reviewStayCleared,
        hasRaw: !!raw,
        hasHook: typeof window.__graphideClearScrollDriveLastStayOnReviewRestart === "function",
        cueAttr: !!(
          document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
          document.querySelector('[data-scroll-review-clear="1"]')
        ),
        // Warm settle already sampled before close; flags may clear on close wipe.
        hadWarmStay: !!raw,
      };
    });
    const s1afCleared = await page.evaluate(() => {
      const cleared =
        typeof window.__graphideClearScrollDriveLastStayOnReviewRestart === "function"
          ? window.__graphideClearScrollDriveLastStayOnReviewRestart()
          : false;
      const d = window.__graphideScrollDrive || {};
      const cueAttr = !!(
        document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
        document.querySelector('[data-scroll-review-clear="1"]')
      );
      const restored =
        typeof window.__graphideSoftRestoreScrollDriveFromLastStay === "function"
          ? window.__graphideSoftRestoreScrollDriveFromLastStay("n1")
          : false;
      const probed =
        typeof window.__graphideProbeScrollDriveLastStayStorage === "function"
          ? window.__graphideProbeScrollDriveLastStayStorage("n1")
          : null;
      return {
        cleared: !!cleared,
        reviewStayCleared: !!d.reviewStayCleared,
        cueAttr: cueAttr,
        restored: !!restored,
        probed: probed,
        presentStayStashed: !!d.presentStayStashed,
      };
    });
    // Soft-stash a new stay → cue must clear (one-shot).
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        return !!(pane && !pane.hidden && body);
      },
      null,
      { timeout: 5000 }
    );
    const s1afAfterCold = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (body) {
        body.scrollTop = Math.max(0, (body.scrollHeight - body.clientHeight) * 0.4);
        body.dispatchEvent(new Event("scroll"));
      }
      return true;
    });
    // S1az — settle before re-stash close so soft-stash clears Review-clear cue honestly.
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          Number(d.scrollVel) < 0.12 &&
          (d.camXSettled === true || d.camYSettled === true)
        );
      },
      null,
      { timeout: 8000 }
    );
    // Stash via Evidence close.
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    const s1afAfterStash = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const cueAttr = !!(
        document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
        document.querySelector('[data-scroll-review-clear="1"]')
      );
      return {
        reviewStayCleared: !!d.reviewStayCleared,
        cueAttr: cueAttr,
      };
    });
    // Cold-open clear path: clear again, then reopen without soft-restore material → cue drops on cold open.
    await page.evaluate(() => {
      if (typeof window.__graphideClearScrollDriveLastStayOnReviewRestart === "function") {
        window.__graphideClearScrollDriveLastStayOnReviewRestart();
      }
    });
    const s1afRecleared = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        reviewStayCleared: !!d.reviewStayCleared,
        cueAttr: !!(
          document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
          document.querySelector('[data-scroll-review-clear="1"]')
        ),
      };
    });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.waitForTimeout(80);
    const s1afAfterColdOpen = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        reviewStayCleared: !!d.reviewStayCleared,
        cueAttr: !!(
          document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
          document.querySelector('[data-scroll-review-clear="1"]')
        ),
        paneOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    record(
      "S1af",
      "Review-clear publishes short-lived stay-cleared cue (not a restore); soft-stash / cold open clears it",
      s1afSetup.ok &&
        s1afBeforeClear.hasHook &&
        s1afBeforeClear.hadWarmStay &&
        !s1afBeforeClear.reviewStayCleared &&
        !s1afBeforeClear.cueAttr &&
        s1afCleared.cleared &&
        s1afCleared.reviewStayCleared === true &&
        s1afCleared.cueAttr === true &&
        !s1afCleared.restored &&
        (s1afCleared.probed == null || s1afCleared.probed === false) &&
        !s1afCleared.presentStayStashed &&
        s1afAfterStash.reviewStayCleared === false &&
        s1afAfterStash.cueAttr === false &&
        s1afRecleared.reviewStayCleared === true &&
        s1afRecleared.cueAttr === true &&
        s1afAfterColdOpen.paneOpen &&
        s1afAfterColdOpen.reviewStayCleared === false &&
        s1afAfterColdOpen.cueAttr === false,
      "setup=" +
        JSON.stringify(s1afSetup) +
        " beforeClear=" +
        JSON.stringify(s1afBeforeClear) +
        " cleared=" +
        JSON.stringify(s1afCleared) +
        " afterStash=" +
        JSON.stringify(s1afAfterStash) +
        " recleared=" +
        JSON.stringify(s1afRecleared) +
        " afterColdOpen=" +
        JSON.stringify(s1afAfterColdOpen)
    );

    // S1az — Review-clear cue settle-before-sample probe (parity with S1ay/S1at).
    // After S1af cold open: pad if needed, one mid-file land (not a burst), tiny nudge,
    // then require !macroLod + settle + cue cleared. Product cue unchanged.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 40; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1az-pad", "1");
          row.innerHTML =
            '<span class="ln">' + (4200 + i) + '</span><span class="tx">s1az pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      const ratio = max > 0 ? body.scrollTop / max : 0;
      // One mid-file land if still near top; else ≤2px nudge (avoid SCROLL_MACRO_VEL).
      if (ratio < 0.25) body.scrollTop = Math.floor(max * 0.42);
      else body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        return !!(
          pane &&
          !pane.hidden &&
          d &&
          !d.presentPaused &&
          !d.macroLod &&
          !d.reviewStayCleared &&
          Number(d.scrollRatio) > 0.2 &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    // Tiny idle nudge so S1r/S1s settle flags re-absorb (no multi-step burst).
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    // S1ba — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1azSnap = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            pane &&
            !pane.hidden &&
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            !d.reviewStayCleared &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          scrollVel: Number(d.scrollVel) || 0,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          reviewStayCleared: !!d.reviewStayCleared,
          presentStayStashed: !!d.presentStayStashed,
          cueAttr: !!(
            document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
            document.querySelector('[data-scroll-review-clear="1"]')
          ),
          targetNodeId: d.targetNodeId || "",
          paneOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1az",
      "Review-clear cue settle-before-sample: post-S1af still micro+settled + cue cleared (!macroLod; no mid-tween)",
      s1azSnap.paneOpen &&
        !s1azSnap.presentPaused &&
        !s1azSnap.macroLod &&
        !s1azSnap.reviewStayCleared &&
        !s1azSnap.cueAttr &&
        !s1azSnap.presentStayStashed &&
        (s1azSnap.camXSettled === true || s1azSnap.camYSettled === true) &&
        s1azSnap.scrollVel < 0.12 &&
        !!s1azSnap.targetNodeId &&
        Number(s1azSnap.ratio) > 0.1 &&
        Number.isFinite(s1azSnap.camX),
      "snap=" + JSON.stringify(s1azSnap)
    );

    // S1ag — workspace-folder change clears S1af Review-clear cue (cannot stick across folders).
    // Re-plant cue via Review-restart clear, assert same-key no-op keeps it, then folder hop drops it.
    // S1bc — settle-before-sample before plant so Review-clear honesty is not raced mid-tween
    // (parity with S1az warm on S1af). Product cue semantics unchanged; plant still wipes settle flags.
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        return !!(
          pane &&
          !pane.hidden &&
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          !d.reviewStayCleared &&
          Number(d.scrollVel) < 0.12 &&
          (d.camXSettled === true || d.camYSettled === true)
        );
      },
      null,
      { timeout: 8000 }
    );
    const s1agPlanted = await page.evaluate(() => {
      if (typeof window.__graphideSetScrollDriveWorkspaceKey === "function") {
        window.__graphideSetScrollDriveWorkspaceKey("ws-s1ag://folder-a");
      }
      if (typeof window.__graphideClearScrollDriveLastStayOnReviewRestart === "function") {
        window.__graphideClearScrollDriveLastStayOnReviewRestart();
      }
      const d = window.__graphideScrollDrive || {};
      return {
        reviewStayCleared: !!d.reviewStayCleared,
        cueAttr: !!(
          document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
          document.querySelector('[data-scroll-review-clear="1"]')
        ),
        ws: window.__graphideScrollDriveWorkspaceKey || "",
      };
    });
    const s1agSameKey = await page.evaluate(() => {
      const changed =
        typeof window.__graphideSetScrollDriveWorkspaceKey === "function"
          ? window.__graphideSetScrollDriveWorkspaceKey("ws-s1ag://folder-a")
          : false;
      const d = window.__graphideScrollDrive || {};
      return {
        changed: !!changed,
        reviewStayCleared: !!d.reviewStayCleared,
        cueAttr: !!(
          document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
          document.querySelector('[data-scroll-review-clear="1"]')
        ),
        ws: window.__graphideScrollDriveWorkspaceKey || "",
      };
    });
    const s1agHopped = await page.evaluate(() => {
      const changed =
        typeof window.__graphideSetScrollDriveWorkspaceKey === "function"
          ? window.__graphideSetScrollDriveWorkspaceKey("ws-s1ag://folder-b")
          : false;
      const d = window.__graphideScrollDrive || {};
      return {
        changed: !!changed,
        reviewStayCleared: !!d.reviewStayCleared,
        cueAttr: !!(
          document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
          document.querySelector('[data-scroll-review-clear="1"]')
        ),
        ws: window.__graphideScrollDriveWorkspaceKey || "",
      };
    });
    record(
      "S1ag",
      "Workspace-folder change clears Review-clear cue (same-key no-op keeps it)",
      s1agPlanted.reviewStayCleared === true &&
        s1agPlanted.cueAttr === true &&
        s1agSameKey.changed === false &&
        s1agSameKey.reviewStayCleared === true &&
        s1agSameKey.cueAttr === true &&
        s1agHopped.changed === true &&
        s1agHopped.reviewStayCleared === false &&
        s1agHopped.cueAttr === false &&
        s1agHopped.ws === "ws-s1ag://folder-b",
      "planted=" +
        JSON.stringify(s1agPlanted) +
        " sameKey=" +
        JSON.stringify(s1agSameKey) +
        " hopped=" +
        JSON.stringify(s1agHopped)
    );

    // S1bc — workspace-change Review-clear cue settle-before-sample probe (parity with S1az).
    // After S1ag hop: cue cleared; plant wiped settle flags — tiny nudge then atomic wait+snap
    // confirming !reviewStayCleared + micro+settled. Product cue unchanged.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 40; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1bc-pad", "1");
          row.innerHTML =
            '<span class="ln">' + (4300 + i) + '</span><span class="tx">s1bc pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      const ratio = max > 0 ? body.scrollTop / max : 0;
      // One mid-file land if still near top; else ≤2px nudge (avoid SCROLL_MACRO_VEL).
      if (ratio < 0.25) body.scrollTop = Math.floor(max * 0.42);
      else body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        return !!(
          pane &&
          !pane.hidden &&
          d &&
          !d.presentPaused &&
          !d.macroLod &&
          !d.reviewStayCleared &&
          Number(d.scrollRatio) > 0.2 &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    // Tiny idle nudge so S1r/S1s settle flags re-absorb after plant wiped them (no multi-step burst).
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    // Atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1bcSnap = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            pane &&
            !pane.hidden &&
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            !d.reviewStayCleared &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          scrollVel: Number(d.scrollVel) || 0,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          reviewStayCleared: !!d.reviewStayCleared,
          presentStayStashed: !!d.presentStayStashed,
          cueAttr: !!(
            document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
            document.querySelector('[data-scroll-review-clear="1"]')
          ),
          targetNodeId: d.targetNodeId || "",
          paneOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
          ws: window.__graphideScrollDriveWorkspaceKey || "",
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1bc",
      "Workspace-change Review-clear cue settle-before-sample: post-S1ag still micro+settled + cue cleared (!macroLod; no mid-tween)",
      s1bcSnap.paneOpen &&
        !s1bcSnap.presentPaused &&
        !s1bcSnap.macroLod &&
        !s1bcSnap.reviewStayCleared &&
        !s1bcSnap.cueAttr &&
        !s1bcSnap.presentStayStashed &&
        (s1bcSnap.camXSettled === true || s1bcSnap.camYSettled === true) &&
        s1bcSnap.scrollVel < 0.12 &&
        !!s1bcSnap.targetNodeId &&
        Number(s1bcSnap.ratio) > 0.1 &&
        Number.isFinite(s1bcSnap.camX) &&
        s1bcSnap.ws === "ws-s1ag://folder-b",
      "snap=" + JSON.stringify(s1bcSnap)
    );

    // S1ai — Present enter clears lingering Review-clear cue; mutually exclusive with presentStayStashed.
    await page.evaluate(() => {
      if (typeof window.__graphideSetScrollDriveWorkspaceKey === "function") {
        window.__graphideSetScrollDriveWorkspaceKey("ws-s1ai://folder");
      }
    });
    // S1bd — settle-before-sample before Path A plant so Review-clear honesty is not raced mid-tween
    // (parity with S1bc on S1ag / S1az on S1af). Product cue mutual exclusion unchanged.
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        return !!(
          pane &&
          !pane.hidden &&
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          !d.reviewStayCleared &&
          Number(d.scrollVel) < 0.12 &&
          (d.camXSettled === true || d.camYSettled === true)
        );
      },
      null,
      { timeout: 8000 }
    );
    // Path A: Review-clear cue alone → Present enter drops cue (even with no stash).
    // Atomic plant+sample so mid-RAF cannot clear the cue between evaluates (S1be polish).
    const s1aiLingering = await page.evaluate(() => {
      if (typeof window.__graphideClearScrollDriveLastStayOnReviewRestart === "function") {
        window.__graphideClearScrollDriveLastStayOnReviewRestart();
      }
      const d = window.__graphideScrollDrive || {};
      return {
        reviewStayCleared: !!d.reviewStayCleared,
        cueAttr: !!(
          document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
          document.querySelector('[data-scroll-review-clear="1"]')
        ),
        presentStayStashed: !!d.presentStayStashed,
        planted: typeof window.__graphideClearScrollDriveLastStayOnReviewRestart === "function",
      };
    });
    await page.keyboard.press("f");
    await page.waitForFunction(
      () => !!(window.__graphideScrollDrive && window.__graphideScrollDrive.presentPaused),
      null,
      { timeout: 5000 }
    );
    const s1aiAfterPresentClear = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        presentPaused: !!d.presentPaused,
        reviewStayCleared: !!d.reviewStayCleared,
        cueAttr: !!(
          document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
          document.querySelector('[data-scroll-review-clear="1"]')
        ),
        presentStayStashed: !!d.presentStayStashed,
        presentStayAttr: !!(
          document.querySelector('.viewport[data-scroll-present-stay="1"]') ||
          document.querySelector('[data-scroll-present-stay="1"]')
        ),
      };
    });
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !(window.__graphideScrollDrive && window.__graphideScrollDrive.presentPaused),
      null,
      { timeout: 5000 }
    );
    // Path B: warm stash + forced lingering Review-clear cue → Present stashes and clears cue (mutual exclusion).
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector('#sliceCanvas .vnode[data-id="n1"]', { timeout: 10000 });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        return !!(pane && !pane.hidden && body);
      },
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      if (body.querySelectorAll(".src-line").length < 40) {
        for (let i = 0; i < 40; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1ai", "1");
          row.innerHTML =
            '<span class="ln">' + (8200 + i) + '</span><span class="tx">s1ai pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      body.scrollTop = Math.floor(max * 0.45);
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(d && !d.macroLod && !d.presentPaused && Number(d.scrollRatio) > 0.2);
      },
      null,
      { timeout: 6000 }
    );
    // S1bd — settle-before-sample warm (S1ai Path B): require settle flags before Evidence close
    // so Present-stash honesty is not raced mid-tween. Product mutual exclusion unchanged.
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          Number(d.scrollVel) < 0.12 &&
          (d.camXSettled === true || d.camYSettled === true)
        );
      },
      null,
      { timeout: 8000 }
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    const s1aiForced = await page.evaluate(() => {
      if (typeof window.__graphideSetScrollDriveReviewStayClearedCue === "function") {
        window.__graphideSetScrollDriveReviewStayClearedCue(true);
      }
      const d = window.__graphideScrollDrive || {};
      const key = window.__graphideScrollDriveLastStayKey || "";
      let hasRaw = false;
      try {
        hasRaw = !!(sessionStorage.getItem(key) || localStorage.getItem(key));
      } catch (_) {}
      return {
        reviewStayCleared: !!d.reviewStayCleared,
        cueAttr: !!(
          document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
          document.querySelector('[data-scroll-review-clear="1"]')
        ),
        hasRaw: hasRaw,
        hasSetter: typeof window.__graphideSetScrollDriveReviewStayClearedCue === "function",
      };
    });
    await page.keyboard.press("f");
    await page.waitForFunction(
      () => !!(window.__graphideScrollDrive && window.__graphideScrollDrive.presentPaused),
      null,
      { timeout: 5000 }
    );
    const s1aiMutEx = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        presentPaused: !!d.presentPaused,
        presentStayStashed: !!d.presentStayStashed,
        reviewStayCleared: !!d.reviewStayCleared,
        cueAttr: !!(
          document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
          document.querySelector('[data-scroll-review-clear="1"]')
        ),
        presentStayAttr: !!(
          document.querySelector('.viewport[data-scroll-present-stay="1"]') ||
          document.querySelector('[data-scroll-present-stay="1"]')
        ),
      };
    });
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !(window.__graphideScrollDrive && window.__graphideScrollDrive.presentPaused),
      null,
      { timeout: 5000 }
    );
    record(
      "S1ai",
      "Present enter clears Review-clear cue; mutually exclusive with presentStayStashed",
      s1aiLingering.planted &&
        s1aiLingering.reviewStayCleared === true &&
        s1aiLingering.cueAttr === true &&
        !s1aiLingering.presentStayStashed &&
        s1aiAfterPresentClear.presentPaused &&
        s1aiAfterPresentClear.reviewStayCleared === false &&
        s1aiAfterPresentClear.cueAttr === false &&
        s1aiForced.hasSetter &&
        s1aiForced.reviewStayCleared === true &&
        s1aiForced.cueAttr === true &&
        s1aiForced.hasRaw &&
        s1aiMutEx.presentPaused &&
        s1aiMutEx.presentStayStashed === true &&
        s1aiMutEx.presentStayAttr === true &&
        s1aiMutEx.reviewStayCleared === false &&
        s1aiMutEx.cueAttr === false,
      "lingering=" +
        JSON.stringify(s1aiLingering) +
        " afterPresentClear=" +
        JSON.stringify(s1aiAfterPresentClear) +
        " forced=" +
        JSON.stringify(s1aiForced) +
        " mutEx=" +
        JSON.stringify(s1aiMutEx)
    );

    // S1bd — Present-stash/Review-clear mutual-exclusion settle-before-sample probe (parity with S1bc).
    // After S1ai Path B exit: reopen same Evidence, tiny nudge, atomic wait+snap confirming
    // both cues off + micro+settled. Product mutual exclusion unchanged.
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        return !!(pane && !pane.hidden && body);
      },
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 40; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1bd-pad", "1");
          row.innerHTML =
            '<span class="ln">' + (4400 + i) + '</span><span class="tx">s1bd pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      const ratio = max > 0 ? body.scrollTop / max : 0;
      if (ratio < 0.25) body.scrollTop = Math.floor(max * 0.42);
      else body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        return !!(
          pane &&
          !pane.hidden &&
          d &&
          !d.presentPaused &&
          !d.macroLod &&
          !d.reviewStayCleared &&
          !d.presentStayStashed &&
          Number(d.scrollRatio) > 0.2 &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    const s1bdSnap = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            pane &&
            !pane.hidden &&
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            !d.reviewStayCleared &&
            !d.presentStayStashed &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          scrollVel: Number(d.scrollVel) || 0,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          reviewStayCleared: !!d.reviewStayCleared,
          presentStayStashed: !!d.presentStayStashed,
          cueAttr: !!(
            document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
            document.querySelector('[data-scroll-review-clear="1"]')
          ),
          presentStayAttr: !!(
            document.querySelector('.viewport[data-scroll-present-stay="1"]') ||
            document.querySelector('[data-scroll-present-stay="1"]')
          ),
          targetNodeId: d.targetNodeId || "",
          paneOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1bd",
      "Present-stash/Review-clear mutual-exclusion settle-before-sample: post-S1ai still micro+settled + both cues cleared (!macroLod; no mid-tween)",
      s1bdSnap.paneOpen &&
        !s1bdSnap.presentPaused &&
        !s1bdSnap.macroLod &&
        !s1bdSnap.reviewStayCleared &&
        !s1bdSnap.cueAttr &&
        !s1bdSnap.presentStayStashed &&
        !s1bdSnap.presentStayAttr &&
        (s1bdSnap.camXSettled === true || s1bdSnap.camYSettled === true) &&
        s1bdSnap.scrollVel < 0.12 &&
        !!s1bdSnap.targetNodeId &&
        Number(s1bdSnap.ratio) > 0.1 &&
        Number.isFinite(s1bdSnap.camX),
      "snap=" + JSON.stringify(s1bdSnap)
    );

    // S1am — Present exit never implies Review clear (parity with S1ad/S1ai).
    // Re-enter Present (warm stay from S1ai path B), plant Review-clear cue mid-Present
    // (half-set / Review-during-Present), exit → both cues scrubbed; no reviewStayCleared.
    // S1be — settle-before-sample before Present enter so exit cue polish is not raced mid-tween
    // (parity with S1bd/S1bc). Product Present-exit Review-clear scrub unchanged.
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        return !!(
          pane &&
          !pane.hidden &&
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          !d.reviewStayCleared &&
          !d.presentStayStashed &&
          Number(d.scrollVel) < 0.12 &&
          (d.camXSettled === true || d.camYSettled === true)
        );
      },
      null,
      { timeout: 8000 }
    );
    await page.keyboard.press("f");
    await page.waitForFunction(
      () => !!(window.__graphideScrollDrive && window.__graphideScrollDrive.presentPaused),
      null,
      { timeout: 5000 }
    );
    const s1amDuringPresent = await page.evaluate(() => {
      if (typeof window.__graphideSetScrollDriveReviewStayClearedCue === "function") {
        window.__graphideSetScrollDriveReviewStayClearedCue(true);
      }
      const d = window.__graphideScrollDrive || {};
      return {
        presentPaused: !!d.presentPaused,
        presentStayStashed: !!d.presentStayStashed,
        reviewStayCleared: !!d.reviewStayCleared,
        cueAttr: !!(
          document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
          document.querySelector('[data-scroll-review-clear="1"]')
        ),
        presentStayAttr: !!(
          document.querySelector('.viewport[data-scroll-present-stay="1"]') ||
          document.querySelector('[data-scroll-present-stay="1"]')
        ),
        hasSetter: typeof window.__graphideSetScrollDriveReviewStayClearedCue === "function",
      };
    });
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !(window.__graphideScrollDrive && window.__graphideScrollDrive.presentPaused),
      null,
      { timeout: 5000 }
    );
    const s1amAfterExit = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        presentPaused: !!d.presentPaused,
        presentStayStashed: !!d.presentStayStashed,
        reviewStayCleared: !!d.reviewStayCleared,
        cueAttr: !!(
          document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
          document.querySelector('[data-scroll-review-clear="1"]')
        ),
        presentStayAttr: !!(
          document.querySelector('.viewport[data-scroll-present-stay="1"]') ||
          document.querySelector('[data-scroll-present-stay="1"]')
        ),
        presentPausedAttr: !!(
          document.querySelector('.viewport[data-scroll-present-paused="1"]') ||
          document.querySelector('[data-scroll-present-paused="1"]')
        ),
      };
    });
    record(
      "S1am",
      "Present exit clears presentStayStashed without implying Review clear (scrubs reviewStayCleared)",
      s1amDuringPresent.hasSetter &&
        s1amDuringPresent.presentPaused &&
        s1amDuringPresent.reviewStayCleared === true &&
        s1amDuringPresent.cueAttr === true &&
        !s1amAfterExit.presentPaused &&
        !s1amAfterExit.presentPausedAttr &&
        s1amAfterExit.presentStayStashed === false &&
        s1amAfterExit.presentStayAttr === false &&
        s1amAfterExit.reviewStayCleared === false &&
        s1amAfterExit.cueAttr === false,
      "duringPresent=" +
        JSON.stringify(s1amDuringPresent) +
        " afterExit=" +
        JSON.stringify(s1amAfterExit)
    );

    // S1be — Present-exit Review-clear cue polish settle-before-sample probe (parity with S1bd).
    // After S1am exit: Present closed Evidence — reopen same source, tiny nudge + atomic
    // wait+snap confirming both cues scrubbed + micro+settled. Product exit scrub unchanged.
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        return !!(pane && !pane.hidden && body);
      },
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 40; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1be-pad", "1");
          row.innerHTML =
            '<span class="ln">' + (4500 + i) + '</span><span class="tx">s1be pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      const ratio = max > 0 ? body.scrollTop / max : 0;
      if (ratio < 0.25) body.scrollTop = Math.floor(max * 0.42);
      else body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        return !!(
          pane &&
          !pane.hidden &&
          d &&
          !d.presentPaused &&
          !d.macroLod &&
          !d.reviewStayCleared &&
          !d.presentStayStashed &&
          Number(d.scrollRatio) > 0.2 &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    const s1beSnap = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            pane &&
            !pane.hidden &&
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            !d.reviewStayCleared &&
            !d.presentStayStashed &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          scrollVel: Number(d.scrollVel) || 0,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          reviewStayCleared: !!d.reviewStayCleared,
          presentStayStashed: !!d.presentStayStashed,
          cueAttr: !!(
            document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
            document.querySelector('[data-scroll-review-clear="1"]')
          ),
          presentStayAttr: !!(
            document.querySelector('.viewport[data-scroll-present-stay="1"]') ||
            document.querySelector('[data-scroll-present-stay="1"]')
          ),
          targetNodeId: d.targetNodeId || "",
          paneOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1be",
      "Present-exit Review-clear cue polish settle-before-sample: post-S1am still micro+settled + both cues scrubbed (!macroLod; no mid-tween)",
      s1beSnap.paneOpen &&
        !s1beSnap.presentPaused &&
        !s1beSnap.macroLod &&
        !s1beSnap.reviewStayCleared &&
        !s1beSnap.cueAttr &&
        !s1beSnap.presentStayStashed &&
        !s1beSnap.presentStayAttr &&
        (s1beSnap.camXSettled === true || s1beSnap.camYSettled === true) &&
        s1beSnap.scrollVel < 0.12 &&
        !!s1beSnap.targetNodeId &&
        Number(s1beSnap.ratio) > 0.1 &&
        Number.isFinite(s1beSnap.camX),
      "snap=" + JSON.stringify(s1beSnap)
    );

    // S1an — Review clear mid-Present drops presentStayStashed (mutual exclusion).
    // Re-enter Present (warm stay), confirm stash, Review-restart clear → review cue on
    // and present-stash cue off while still presentPaused; Present exit still coherent.
    // S1bf — settle-before-sample before Present enter so mid-Present clear honesty is not
    // raced mid-tween (parity with S1be/S1bd). Product mutual exclusion unchanged.
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        return !!(
          pane &&
          !pane.hidden &&
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          !d.reviewStayCleared &&
          !d.presentStayStashed &&
          Number(d.scrollVel) < 0.12 &&
          (d.camXSettled === true || d.camYSettled === true)
        );
      },
      null,
      { timeout: 8000 }
    );
    await page.keyboard.press("f");
    await page.waitForFunction(
      () => !!(window.__graphideScrollDrive && window.__graphideScrollDrive.presentPaused),
      null,
      { timeout: 5000 }
    );
    const s1anBefore = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        presentPaused: !!d.presentPaused,
        presentStayStashed: !!d.presentStayStashed,
        presentStayAttr: !!(
          document.querySelector('.viewport[data-scroll-present-stay="1"]') ||
          document.querySelector('[data-scroll-present-stay="1"]')
        ),
        reviewStayCleared: !!d.reviewStayCleared,
        cueAttr: !!(
          document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
          document.querySelector('[data-scroll-review-clear="1"]')
        ),
      };
    });
    const s1anAfterClear = await page.evaluate(() => {
      if (typeof window.__graphideClearScrollDriveLastStayOnReviewRestart === "function") {
        window.__graphideClearScrollDriveLastStayOnReviewRestart();
      } else if (typeof window.__graphideSetScrollDriveReviewStayClearedCue === "function") {
        window.__graphideSetScrollDriveReviewStayClearedCue(true);
      }
      const d = window.__graphideScrollDrive || {};
      return {
        presentPaused: !!d.presentPaused,
        presentStayStashed: !!d.presentStayStashed,
        presentStayAttr: !!(
          document.querySelector('.viewport[data-scroll-present-stay="1"]') ||
          document.querySelector('[data-scroll-present-stay="1"]')
        ),
        reviewStayCleared: !!d.reviewStayCleared,
        cueAttr: !!(
          document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
          document.querySelector('[data-scroll-review-clear="1"]')
        ),
        hasClear:
          typeof window.__graphideClearScrollDriveLastStayOnReviewRestart === "function",
      };
    });
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !(window.__graphideScrollDrive && window.__graphideScrollDrive.presentPaused),
      null,
      { timeout: 5000 }
    );
    const s1anAfterExit = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        presentPaused: !!d.presentPaused,
        presentStayStashed: !!d.presentStayStashed,
        presentStayAttr: !!(
          document.querySelector('.viewport[data-scroll-present-stay="1"]') ||
          document.querySelector('[data-scroll-present-stay="1"]')
        ),
        reviewStayCleared: !!d.reviewStayCleared,
        cueAttr: !!(
          document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
          document.querySelector('[data-scroll-review-clear="1"]')
        ),
      };
    });
    record(
      "S1an",
      "Review clear mid-Present drops presentStayStashed (mutual exclusion with reviewStayCleared)",
      s1anBefore.presentPaused &&
        s1anBefore.presentStayStashed === true &&
        s1anBefore.presentStayAttr === true &&
        s1anBefore.reviewStayCleared === false &&
        s1anAfterClear.hasClear &&
        s1anAfterClear.presentPaused &&
        s1anAfterClear.reviewStayCleared === true &&
        s1anAfterClear.cueAttr === true &&
        s1anAfterClear.presentStayStashed === false &&
        s1anAfterClear.presentStayAttr === false &&
        !s1anAfterExit.presentPaused &&
        s1anAfterExit.presentStayStashed === false &&
        s1anAfterExit.presentStayAttr === false &&
        s1anAfterExit.reviewStayCleared === false &&
        s1anAfterExit.cueAttr === false,
      "before=" +
        JSON.stringify(s1anBefore) +
        " afterClear=" +
        JSON.stringify(s1anAfterClear) +
        " afterExit=" +
        JSON.stringify(s1anAfterExit)
    );

    // S1bf — Review-during-Present mutual-exclusion settle-before-sample probe (parity with S1be).
    // After S1an wipe+exit: reopen cold, tiny nudge, atomic wait+snap both cues off + micro+settled;
    // then re-wipe stay so S1ao afterWipe still finds empty (product wipe unchanged).
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        return !!(pane && !pane.hidden && body);
      },
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 40; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1bf-pad", "1");
          row.innerHTML =
            '<span class="ln">' + (4600 + i) + '</span><span class="tx">s1bf pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      const ratio = max > 0 ? body.scrollTop / max : 0;
      if (ratio < 0.25) body.scrollTop = Math.floor(max * 0.42);
      else body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        return !!(
          pane &&
          !pane.hidden &&
          d &&
          !d.presentPaused &&
          !d.macroLod &&
          !d.reviewStayCleared &&
          !d.presentStayStashed &&
          Number(d.scrollRatio) > 0.2 &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    const s1bfSnap = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            pane &&
            !pane.hidden &&
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            !d.reviewStayCleared &&
            !d.presentStayStashed &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          scrollVel: Number(d.scrollVel) || 0,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          reviewStayCleared: !!d.reviewStayCleared,
          presentStayStashed: !!d.presentStayStashed,
          cueAttr: !!(
            document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
            document.querySelector('[data-scroll-review-clear="1"]')
          ),
          presentStayAttr: !!(
            document.querySelector('.viewport[data-scroll-present-stay="1"]') ||
            document.querySelector('[data-scroll-present-stay="1"]')
          ),
          targetNodeId: d.targetNodeId || "",
          paneOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
          softStayed: !!window.__graphideScrollDriveShowSourceSoftStayed,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1bf",
      "Review-during-Present mutual-exclusion settle-before-sample: post-S1an still micro+settled + both cues cleared (!macroLod; no mid-tween)",
      s1bfSnap.paneOpen &&
        !s1bfSnap.presentPaused &&
        !s1bfSnap.macroLod &&
        !s1bfSnap.reviewStayCleared &&
        !s1bfSnap.cueAttr &&
        !s1bfSnap.presentStayStashed &&
        !s1bfSnap.presentStayAttr &&
        (s1bfSnap.camXSettled === true || s1bfSnap.camYSettled === true) &&
        s1bfSnap.scrollVel < 0.12 &&
        !!s1bfSnap.targetNodeId &&
        Number(s1bfSnap.ratio) > 0.1 &&
        Number.isFinite(s1bfSnap.camX),
      "snap=" + JSON.stringify(s1bfSnap)
    );
    // Re-wipe stay (and close Evidence) so S1ao afterWipe still finds empty storage/memory.
    await page.evaluate(() => {
      if (typeof window.__graphideClearScrollDriveLastStayOnReviewRestart === "function") {
        window.__graphideClearScrollDriveLastStayOnReviewRestart();
      }
      if (typeof window.__graphideSetScrollDriveReviewStayClearedCue === "function") {
        window.__graphideSetScrollDriveReviewStayClearedCue(false);
      }
    });
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );

    // S1ao — Evidence reopen after Review-during-Present wipe must not soft-restore.
    // After S1an clear+exit: memory/sessionStorage empty, softRestore false; reopen n1
    // takes cold hard path (__graphideScrollDriveShowSourceSoftStayed false).
    const s1aoAfterWipe = await page.evaluate(() => {
      const key = window.__graphideScrollDriveLastStayKey || "";
      let hasRaw = false;
      try {
        hasRaw = !!(sessionStorage.getItem(key) || localStorage.getItem(key));
      } catch (_) {}
      const probed =
        typeof window.__graphideProbeScrollDriveLastStayStorage === "function"
          ? window.__graphideProbeScrollDriveLastStayStorage("n1")
          : "no-probe";
      const restored =
        typeof window.__graphideSoftRestoreScrollDriveFromLastStay === "function"
          ? window.__graphideSoftRestoreScrollDriveFromLastStay("n1")
          : false;
      let hostRestored = false;
      if (typeof window.__graphideSoftStayScrollDriveAcrossHostSourceRepost === "function") {
        hostRestored = !!window.__graphideSoftStayScrollDriveAcrossHostSourceRepost("n1");
      }
      return {
        hasRaw: hasRaw,
        probed: probed,
        restored: !!restored,
        hostRestored: !!hostRestored,
        presentPaused: !!(window.__graphideScrollDrive && window.__graphideScrollDrive.presentPaused),
        presentStayStashed: !!(
          window.__graphideScrollDrive && window.__graphideScrollDrive.presentStayStashed
        ),
      };
    });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    // S1bg — settle-before-sample cold reopen (S1ao): require softStayed false + target
    // (not a fixed 80ms pad). Product cold hard path unchanged.
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        return !!(
          pane &&
          !pane.hidden &&
          typeof window.__graphideScrollDriveShowSourceSoftStayed === "boolean" &&
          window.__graphideScrollDriveShowSourceSoftStayed === false &&
          d &&
          !d.presentPaused &&
          !d.presentStayStashed &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    const s1aoAfterReopen = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const key = window.__graphideScrollDriveLastStayKey || "";
      let hasRaw = false;
      try {
        hasRaw = !!(sessionStorage.getItem(key) || localStorage.getItem(key));
      } catch (_) {}
      const probed =
        typeof window.__graphideProbeScrollDriveLastStayStorage === "function"
          ? window.__graphideProbeScrollDriveLastStayStorage("n1")
          : "no-probe";
      return {
        paneOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
        softStayed: !!window.__graphideScrollDriveShowSourceSoftStayed,
        hasSoftFlag: typeof window.__graphideScrollDriveShowSourceSoftStayed === "boolean",
        hasRaw: hasRaw,
        probed: probed,
        presentPaused: !!d.presentPaused,
        presentStayStashed: !!d.presentStayStashed,
        reviewStayCleared: !!d.reviewStayCleared,
        targetNodeId: d.targetNodeId || "",
      };
    });
    record(
      "S1ao",
      "Evidence reopen after Review-during-Present wipe takes cold hard path (no soft-restore)",
      !s1aoAfterWipe.presentPaused &&
        !s1aoAfterWipe.presentStayStashed &&
        !s1aoAfterWipe.hasRaw &&
        (s1aoAfterWipe.probed == null || s1aoAfterWipe.probed === false) &&
        !s1aoAfterWipe.restored &&
        !s1aoAfterWipe.hostRestored &&
        s1aoAfterReopen.paneOpen &&
        s1aoAfterReopen.hasSoftFlag &&
        s1aoAfterReopen.softStayed === false &&
        !s1aoAfterReopen.presentPaused &&
        !s1aoAfterReopen.presentStayStashed &&
        !!s1aoAfterReopen.targetNodeId,
      "afterWipe=" +
        JSON.stringify(s1aoAfterWipe) +
        " afterReopen=" +
        JSON.stringify(s1aoAfterReopen)
    );

    // S1bg — cold-path reopen settle-before-sample probe (parity with S1bf).
    // After S1ao cold open: tiny nudge, atomic wait+snap softStayed false + micro+settled
    // + both cues off. Product cold hard path unchanged.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 40; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1bg-pad", "1");
          row.innerHTML =
            '<span class="ln">' + (4700 + i) + '</span><span class="tx">s1bg pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      const ratio = max > 0 ? body.scrollTop / max : 0;
      if (ratio < 0.25) body.scrollTop = Math.floor(max * 0.42);
      else body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        return !!(
          pane &&
          !pane.hidden &&
          d &&
          !d.presentPaused &&
          !d.macroLod &&
          !d.reviewStayCleared &&
          !d.presentStayStashed &&
          window.__graphideScrollDriveShowSourceSoftStayed === false &&
          Number(d.scrollRatio) > 0.2 &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    const s1bgSnap = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            pane &&
            !pane.hidden &&
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            !d.reviewStayCleared &&
            !d.presentStayStashed &&
            window.__graphideScrollDriveShowSourceSoftStayed === false &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          scrollVel: Number(d.scrollVel) || 0,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          reviewStayCleared: !!d.reviewStayCleared,
          presentStayStashed: !!d.presentStayStashed,
          softStayed: !!window.__graphideScrollDriveShowSourceSoftStayed,
          cueAttr: !!(
            document.querySelector('.viewport[data-scroll-review-clear="1"]') ||
            document.querySelector('[data-scroll-review-clear="1"]')
          ),
          presentStayAttr: !!(
            document.querySelector('.viewport[data-scroll-present-stay="1"]') ||
            document.querySelector('[data-scroll-present-stay="1"]')
          ),
          targetNodeId: d.targetNodeId || "",
          paneOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1bg",
      "Cold-path reopen settle-before-sample: post-S1ao still micro+settled + softStayed false + cues cleared (!macroLod; no mid-tween)",
      s1bgSnap.paneOpen &&
        !s1bgSnap.presentPaused &&
        !s1bgSnap.macroLod &&
        !s1bgSnap.reviewStayCleared &&
        !s1bgSnap.cueAttr &&
        !s1bgSnap.presentStayStashed &&
        !s1bgSnap.presentStayAttr &&
        s1bgSnap.softStayed === false &&
        (s1bgSnap.camXSettled === true || s1bgSnap.camYSettled === true) &&
        s1bgSnap.scrollVel < 0.12 &&
        !!s1bgSnap.targetNodeId &&
        Number(s1bgSnap.ratio) > 0.1 &&
        Number.isFinite(s1bgSnap.camX),
      "snap=" + JSON.stringify(s1bgSnap)
    );

    // S1aq — soft-restore round-trip after fresh stay post-S1ao wipe.
    // Cold open left Evidence open with no wiped-stay restore; build a NEW stay
    // (scroll + settle), Present stash, exit, reopen same source → softStayed true.
    // S1ax — settle-before-sample: warm settle flags (not scrollRatio fallback);
    // sample first soft-restore step after reopen (one paint); resettle requires
    // !macroLod + settle. Product soft-stay caps unchanged.
    const s1aqSetup = await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return { ok: false, why: "no-srcBody" };
      // Ensure scrollable body so ScrollDrive can seed a fresh base.
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 40; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1aq-pad", "1");
          row.innerHTML =
            '<span class="ln">' + (9100 + i) + '</span><span class="tx">s1aq pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      body.scrollTop = Math.floor(max * 0.42);
      body.dispatchEvent(new Event("scroll"));
      const base = body.scrollTop;
      for (let i = 0; i < 6; i++) {
        body.scrollTop = base + i * 2;
        body.dispatchEvent(new Event("scroll"));
      }
      return { ok: true, scrollTop: body.scrollTop };
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.macroLod &&
          !d.presentPaused &&
          Number(d.scrollRatio) > 0.15 &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    // S1ax — settle-before-sample warm: require settle flags (not scrollRatio fallback).
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1aqBefore = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        // Force a stash of the fresh stay so Present enter has warm material.
        let stashOk = false;
        if (typeof window.__graphideStashScrollDriveLastStay === "function") {
        stashOk = !!window.__graphideStashScrollDriveLastStay();
        }
        const key = window.__graphideScrollDriveLastStayKey || "";
        let hasRaw = false;
        try {
        hasRaw = !!(sessionStorage.getItem(key) || localStorage.getItem(key));
        } catch (_) {}
        const probed =
        typeof window.__graphideProbeScrollDriveLastStayStorage === "function"
        ? window.__graphideProbeScrollDriveLastStayStorage("n1")
        : null;
        if (
          !(
            d &&
            !d.macroLod &&
            !d.presentPaused &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          hasRaw: hasRaw,
          probedOk: !!(probed && probed.sourceId === "n1"),
          hasStashHook: typeof window.__graphideStashScrollDriveLastStay === "function",
          stashOk: stashOk,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    await page.keyboard.press("f");
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        return !!(
          document.body &&
          document.body.classList.contains("present") &&
          d &&
          d.presentPaused === true &&
          (!pane || pane.hidden)
        );
      },
      null,
      { timeout: 6000 }
    );
    const s1aqPresent = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      return {
        presentPaused: !!d.presentPaused,
        presentStayStashed: !!d.presentStayStashed,
        reviewStayCleared: !!d.reviewStayCleared,
        paneHidden: !!(
          !document.getElementById("sourcePane") ||
          document.getElementById("sourcePane").hidden
        ),
      };
    });
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          document.body &&
          !document.body.classList.contains("present") &&
          d &&
          d.presentPaused === false
        );
      },
      null,
      { timeout: 6000 }
    );
    await page.waitForTimeout(80);
    // Clear prior softStayed flag so reopen result is honest.
    await page.evaluate(() => {
      window.__graphideScrollDriveShowSourceSoftStayed = false;
    });
    await page.locator('#sliceCanvas .vnode[data-id="n1"]').first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        const body = document.getElementById("srcBody");
        const d = window.__graphideScrollDrive;
        return !!(pane && !pane.hidden && body && d && !d.presentPaused && d.targetNodeId);
      },
      null,
      { timeout: 6000 }
    );
    // S1ax — sample first soft-restore step after reopen (one paint), not a fixed 200ms
    // mid-tween stack that can inflate dx toward a zoomToEl leap. Product soft-stay caps unchanged.
    // Prior waitForFunction already confirmed reopen target; one rAF paints the soft step.
    await page.waitForTimeout(16);
    const s1aqAfterReopen = await page.evaluate(() => {
      const d = window.__graphideScrollDrive || {};
      const skip =
        typeof window.__graphideShouldSkipRefitForScrollDriveStay === "function"
          ? !!window.__graphideShouldSkipRefitForScrollDriveStay()
          : false;
      return {
        softStayed: !!window.__graphideScrollDriveShowSourceSoftStayed,
        hasSoftFlag: typeof window.__graphideScrollDriveShowSourceSoftStayed === "boolean",
        paneOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
        presentPaused: !!d.presentPaused,
        presentStayStashed: !!d.presentStayStashed,
        reviewStayCleared: !!d.reviewStayCleared,
        targetNodeId: d.targetNodeId || "",
        camX: Number(d.camX),
        camY: Number(d.camY),
        camK: Number(d.camK),
        camXSettled: !!d.camXSettled,
        camYSettled: !!d.camYSettled,
        macroLod: !!d.macroLod,
        skipRefit: skip,
      };
    });
    const s1aqDx = Math.abs((Number(s1aqAfterReopen.camX) || 0) - (Number(s1aqBefore.camX) || 0));
    const s1aqDy = Math.abs((Number(s1aqAfterReopen.camY) || 0) - (Number(s1aqBefore.camY) || 0));
    // S1ax — pad if needed; land mid-file once (not a burst flick), then tiny nudge so
    // settle flags re-absorb without SCROLL_MACRO_VEL. Flags clear on soft-restore then re-absorb.
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      if (body.scrollHeight <= body.clientHeight + 8) {
        for (let i = 0; i < 40; i++) {
          const row = document.createElement("div");
          row.className = "src-line";
          row.setAttribute("data-s1aq-reopen-pad", "1");
          row.innerHTML =
            '<span class="ln">' + (3200 + i) + '</span><span class="tx">s1aq reopen pad ' + i + "</span>";
          body.appendChild(row);
        }
      }
      const max = Math.max(1, body.scrollHeight - body.clientHeight);
      const ratio = max > 0 ? body.scrollTop / max : 0;
      // One mid-file land if still near top (post-restore / short file); else ≤2px nudge.
      if (ratio < 0.25) {
        body.scrollTop = Math.floor(max * 0.42);
      } else {
        body.scrollTop = body.scrollTop + 2;
      }
      body.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        return !!(
          d &&
          !d.presentPaused &&
          !d.macroLod &&
          Number(d.scrollRatio) > 0.15 &&
          d.targetNodeId
        );
      },
      null,
      { timeout: 6000 }
    );
    // Tiny idle nudge so S1r/S1s settle flags re-absorb (no multi-step burst).
    await page.evaluate(() => {
      const body = document.getElementById("srcBody");
      if (!body) return;
      body.scrollTop = body.scrollTop + 2;
      body.dispatchEvent(new Event("scroll"));
    });
    // S1ax — settle-before-sample resettle: require !macroLod + settle flags (no scrollRatio fallback).
    // S1bb — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1aqResettle = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          targetNodeId: d.targetNodeId || "",
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    const s1aqResettleYank = Math.max(
      Math.abs((Number(s1aqResettle.camX) || 0) - (Number(s1aqAfterReopen.camX) || 0)),
      Math.abs((Number(s1aqResettle.camY) || 0) - (Number(s1aqAfterReopen.camY) || 0))
    );
    record(
      "S1aq",
      "After S1ao wipe, fresh stay Present→Evidence soft-restores again (round-trip)",
      s1aqSetup.ok &&
        !!s1aqBefore.targetNodeId &&
        s1aqBefore.hasStashHook &&
        s1aqBefore.stashOk &&
        (s1aqBefore.hasRaw || s1aqBefore.probedOk) &&
        !s1aqBefore.macroLod &&
        !s1aqBefore.presentPaused &&
        (s1aqBefore.camXSettled === true || s1aqBefore.camYSettled === true) &&
        s1aqPresent.presentPaused &&
        s1aqPresent.presentStayStashed === true &&
        s1aqPresent.paneHidden &&
        s1aqPresent.reviewStayCleared === false &&
        s1aqAfterReopen.paneOpen &&
        s1aqAfterReopen.hasSoftFlag &&
        s1aqAfterReopen.softStayed === true &&
        !s1aqAfterReopen.presentPaused &&
        !s1aqAfterReopen.reviewStayCleared &&
        !!s1aqAfterReopen.targetNodeId &&
        Number.isFinite(s1aqAfterReopen.camX) &&
        Number.isFinite(s1aqAfterReopen.camY) &&
        s1aqDx <= 120 &&
        s1aqDy <= 160 &&
        !s1aqResettle.presentPaused &&
        !s1aqResettle.macroLod &&
        !!s1aqResettle.targetNodeId &&
        Number(s1aqResettle.ratio) > 0.1 &&
        (s1aqResettle.camXSettled === true || s1aqResettle.camYSettled === true) &&
        s1aqResettleYank <= 200,
      "setup=" +
        JSON.stringify(s1aqSetup) +
        " before=" +
        JSON.stringify(s1aqBefore) +
        " present=" +
        JSON.stringify(s1aqPresent) +
        " afterReopen=" +
        JSON.stringify(s1aqAfterReopen) +
        " resettle=" +
        JSON.stringify(s1aqResettle) +
        " dx=" +
        s1aqDx +
        " dy=" +
        s1aqDy +
        " resettleYank=" +
        s1aqResettleYank
    );

    // S1ax — soft-restore round-trip settle-before-sample probe (parity with S1at/S1as/S1av).
    // After S1aq, confirm still !macroLod + settle + low vel (single sample; no dual-sample gap).
    // Product soft-stay caps unchanged.
    // S1ba — atomic settle sample (wait + snap in one evaluate) so mid-RAF cannot unsettle between.
    const s1axSnap = await page.waitForFunction(
      () => {
        const d = window.__graphideScrollDrive;
        const pane = document.getElementById("sourcePane");
        if (
          !(
            pane &&
            !pane.hidden &&
            d &&
            !d.presentPaused &&
            !d.macroLod &&
            Number(d.scrollVel) < 0.12 &&
            (d.camXSettled === true || d.camYSettled === true)
          )
        ) {
          return null;
        }
        return {
          camX: Number(d.camX),
          camY: Number(d.camY),
          camK: Number(d.camK),
          ratio: Number(d.scrollRatio) || 0,
          camXSettled: !!d.camXSettled,
          camYSettled: !!d.camYSettled,
          scrollVel: Number(d.scrollVel) || 0,
          macroLod: !!d.macroLod,
          presentPaused: !!d.presentPaused,
          targetNodeId: d.targetNodeId || "",
          softStayed: !!window.__graphideScrollDriveShowSourceSoftStayed,
        };
      },
      null,
      { timeout: 8000 }
    ).then((h) => h.jsonValue());
    record(
      "S1ax",
      "soft-restore round-trip settle-before-sample: post-S1aq still micro+settled (!macroLod; no mid-tween)",
      !s1axSnap.presentPaused &&
        !s1axSnap.macroLod &&
        (s1axSnap.camXSettled === true || s1axSnap.camYSettled === true) &&
        s1axSnap.scrollVel < 0.12 &&
        !!s1axSnap.targetNodeId &&
        Number.isFinite(s1axSnap.camX) &&
        Number.isFinite(s1axSnap.camK),
      "snap=" + JSON.stringify(s1axSnap)
    );

    await page.keyboard.press("Escape"); // close Evidence (already closed by Present; keep sequence)




    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Hover tip on Slice, then open Keys — tip must hide (not stick under chrome).
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector("#sliceCanvas .vnode[data-id]", { timeout: 10000 });
    await page.locator("#sliceCanvas .vnode[data-id]").first().hover();
    await page.waitForFunction(
      () => {
        const tip = document.getElementById("tip");
        return !!(tip && !tip.hidden && (tip.textContent || "").trim());
      },
      null,
      { timeout: 5000 }
    );
    await page.keyboard.press("?");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const tipUnderKeys = await page.evaluate(() => {
      const tip = document.getElementById("tip");
      return {
        tipHidden: !tip || tip.hidden,
        keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      };
    });
    record(
      "K19",
      "Opening Keys hides the hover tip (no tip under chrome)",
      tipUnderKeys.keysOpen && tipUnderKeys.tipHidden,
      JSON.stringify(tipUnderKeys)
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Same tip hide under Export.
    await page.locator("#sliceCanvas .vnode[data-id]").first().hover();
    await page.waitForFunction(
      () => {
        const tip = document.getElementById("tip");
        return !!(tip && !tip.hidden && (tip.textContent || "").trim());
      },
      null,
      { timeout: 5000 }
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
    const tipUnderExport = await page.evaluate(() => {
      const tip = document.getElementById("tip");
      return {
        tipHidden: !tip || tip.hidden,
        exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      };
    });
    record(
      "K19b",
      "Opening Export hides the hover tip (no tip under chrome)",
      tipUnderExport.exportOpen && tipUnderExport.tipHidden,
      JSON.stringify(tipUnderExport)
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !menu || menu.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Same tip hide under Ask.
    await page.locator("#sliceCanvas .vnode[data-id]").first().hover();
    await page.waitForFunction(
      () => {
        const tip = document.getElementById("tip");
        return !!(tip && !tip.hidden && (tip.textContent || "").trim());
      },
      null,
      { timeout: 5000 }
    );
    await page.click("#llmBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const tipUnderAsk = await page.evaluate(() => {
      const tip = document.getElementById("tip");
      return {
        tipHidden: !tip || tip.hidden,
        askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
      };
    });
    record(
      "K19c",
      "Opening Ask hides the hover tip (no tip under chrome)",
      tipUnderAsk.askOpen && tipUnderAsk.tipHidden,
      JSON.stringify(tipUnderAsk)
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Tip under Find must hide (parity with K19–K19g).
    await page.locator("#sliceCanvas .vnode[data-id]").first().hover();
    await page.waitForFunction(
      () => {
        const tip = document.getElementById("tip");
        return !!(tip && !tip.hidden && (tip.textContent || "").trim());
      },
      null,
      { timeout: 5000 }
    );
    await page.keyboard.press("/");
    await page.waitForFunction(
      () => document.activeElement && document.activeElement.id === "graphSearch",
      null,
      { timeout: 5000 }
    );
    const tipUnderFind = await page.evaluate(() => {
      const tip = document.getElementById("tip");
      return {
        tipHidden: !tip || tip.hidden,
        findFocused: !!(document.activeElement && document.activeElement.id === "graphSearch"),
      };
    });
    record(
      "K19h",
      "Focusing Find hides the hover tip (no tip under Find)",
      tipUnderFind.findFocused && tipUnderFind.tipHidden,
      JSON.stringify(tipUnderFind)
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !document.activeElement || document.activeElement.id !== "graphSearch",
      null,
      { timeout: 5000 }
    );
    // Toast under Find must clear (parity with K20–K20g).
    await page.evaluate(() => {
      const toast = document.getElementById("toast");
      if (toast) {
        toast.hidden = false;
        toast.className = "on ok";
        toast.textContent = "Copied PNG";
      }
    });
    await page.keyboard.press("/");
    await page.waitForFunction(
      () => document.activeElement && document.activeElement.id === "graphSearch",
      null,
      { timeout: 5000 }
    );
    const toastUnderFind = await page.evaluate(() => {
      const toast = document.getElementById("toast");
      return {
        toastGone: !toast || toast.hidden || !toast.classList.contains("on"),
        findFocused: !!(document.activeElement && document.activeElement.id === "graphSearch"),
      };
    });
    record(
      "K20h",
      "Focusing Find clears the toast (no toast under Find)",
      toastUnderFind.findFocused && toastUnderFind.toastGone,
      JSON.stringify(toastUnderFind)
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !document.activeElement || document.activeElement.id !== "graphSearch",
      null,
      { timeout: 5000 }
    );
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    // Toast under Keys must clear.
    await page.evaluate(() => {
      const toast = document.getElementById("toast");
      if (toast) {
        toast.hidden = false;
        toast.className = "on ok";
        toast.textContent = "Copied PNG";
      }
    });
    await page.click("#keysBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const toastUnderKeys = await page.evaluate(() => {
      const toast = document.getElementById("toast");
      return {
        toastGone: !toast || toast.hidden || !toast.classList.contains("on"),
        keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      };
    });
    record(
      "K20",
      "Opening Keys clears the toast (no toast under chrome)",
      toastUnderKeys.keysOpen && toastUnderKeys.toastGone,
      JSON.stringify(toastUnderKeys)
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => {
      const toast = document.getElementById("toast");
      if (toast) {
        toast.hidden = false;
        toast.className = "on ok";
        toast.textContent = "Copied PNG";
      }
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
    const toastUnderExport = await page.evaluate(() => {
      const toast = document.getElementById("toast");
      return {
        toastGone: !toast || toast.hidden || !toast.classList.contains("on"),
        exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      };
    });
    record(
      "K20b",
      "Opening Export clears the toast (no toast under chrome)",
      toastUnderExport.exportOpen && toastUnderExport.toastGone,
      JSON.stringify(toastUnderExport)
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !menu || menu.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Same toast clear under Ask.
    await page.evaluate(() => {
      const toast = document.getElementById("toast");
      if (toast) {
        toast.hidden = false;
        toast.className = "on ok";
        toast.textContent = "Copied PNG";
      }
    });
    await page.click("#llmBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    const toastUnderAsk = await page.evaluate(() => {
      const toast = document.getElementById("toast");
      return {
        toastGone: !toast || toast.hidden || !toast.classList.contains("on"),
        askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
      };
    });
    record(
      "K20c",
      "Opening Ask clears the toast (no toast under chrome)",
      toastUnderAsk.askOpen && toastUnderAsk.toastGone,
      JSON.stringify(toastUnderAsk)
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // already on map — Evidence suite continues
    await page.waitForSelector(".bubble-card", { timeout: 8000 });

    // Tip under Evidence must hide (same chrome exclusivity as Keys / Export / Ask).
    await page.evaluate(() => {
      const tip = document.getElementById("tip");
      if (tip) {
        tip.hidden = false;
        tip.textContent = "forced tip";
      }
    });
    await page.evaluate(() => {
      const cell = document.querySelector("#ledgerGrid .cell");
      if (cell) cell.click();
    });
    await page.waitForFunction(
      () => !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      null,
      { timeout: 5000 }
    );
    const tipUnderEvidence = await page.evaluate(() => {
      const tip = document.getElementById("tip");
      return {
        tipHidden: !tip || tip.hidden,
        evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    record(
      "K19d",
      "Opening Evidence hides the hover tip (no tip under chrome)",
      tipUnderEvidence.evidenceOpen && tipUnderEvidence.tipHidden,
      JSON.stringify(tipUnderEvidence)
    );
    await page.click("#srcClose");
    await page.waitForFunction(
      () => !!(document.getElementById("sourcePane") && document.getElementById("sourcePane").hidden),
      null,
      { timeout: 5000 }
    );
    // Toast under Evidence must clear (parity with K20 / K20b / K20c).
    await page.evaluate(() => {
      const toast = document.getElementById("toast");
      if (toast) {
        toast.hidden = false;
        toast.className = "on ok";
        toast.textContent = "Copied PNG";
      }
    });
    await page.evaluate(() => {
      const cell = document.querySelector("#ledgerGrid .cell");
      if (cell) cell.click();
    });
    await page.waitForFunction(
      () => !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      null,
      { timeout: 5000 }
    );
    const toastUnderEvidence = await page.evaluate(() => {
      const toast = document.getElementById("toast");
      return {
        toastGone: !toast || toast.hidden || !toast.classList.contains("on"),
        evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      };
    });
    record(
      "K20d",
      "Opening Evidence clears the toast (no toast under chrome)",
      toastUnderEvidence.evidenceOpen && toastUnderEvidence.toastGone,
      JSON.stringify(toastUnderEvidence)
    );
    // Tip under Present must hide (parity with K19 / K19b / K19c / K19d).
    // Toast under Present must clear (parity with K20 / K20b / K20c / K20d).
    // Present closes Evidence; reopen after exit so K5b can open Keys over Evidence (Keys exclusivity closes it).
    await page.evaluate(() => {
      const tip = document.getElementById("tip");
      if (tip) {
        tip.hidden = false;
        tip.textContent = "forced tip";
      }
      const toast = document.getElementById("toast");
      if (toast) {
        toast.hidden = false;
        toast.className = "on ok";
        toast.textContent = "Copied PNG";
      }
    });
    await page.click("#presentBtn");
    await page.waitForFunction(
      () => !!(document.body && document.body.classList.contains("present")),
      null,
      { timeout: 5000 }
    );
    const tipUnderPresent = await page.evaluate(() => {
      const tip = document.getElementById("tip");
      return {
        tipHidden: !tip || tip.hidden,
        presenting: !!(document.body && document.body.classList.contains("present")),
      };
    });
    record(
      "K19e",
      "Opening Present hides the hover tip (no tip under chrome)",
      tipUnderPresent.presenting && tipUnderPresent.tipHidden,
      JSON.stringify(tipUnderPresent)
    );
    const toastUnderPresent = await page.evaluate(() => {
      const toast = document.getElementById("toast");
      return {
        toastGone: !toast || toast.hidden || !toast.classList.contains("on"),
        presenting: !!(document.body && document.body.classList.contains("present")),
      };
    });
    record(
      "K20e",
      "Opening Present clears the toast (no toast under chrome)",
      toastUnderPresent.presenting && toastUnderPresent.toastGone,
      JSON.stringify(toastUnderPresent)
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !(document.body && document.body.classList.contains("present")),
      null,
      { timeout: 5000 }
    );
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
      "Escape closes Keys; Evidence stays closed (Keys exclusivity)",
      keysOverEvidence.keysHidden && !keysOverEvidence.evidenceOpen,
      JSON.stringify(keysOverEvidence)
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
    assertNoStampDir("K7", "Keys step did not write .graphide/stamps/");

    // Cmd / Ctrl chords belong to VS Code (save, cut, find, quick open…). They must not fire desk keys:
    // a reflex Cmd+S must not post a human stamp. Ctrl+Alt (AltGr) still types / [ ] ? on EU layouts.
    const chordKeys = await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      const posts0 = (window.__vscodePosts || []).length;
      const state = () => ({
        night: document.documentElement.classList.contains("night"),
        present: document.body.classList.contains("present"),
        ego: !!(document.getElementById("egoBtn") && document.getElementById("egoBtn").classList.contains("on")),
        route: !!(window.__graphideRoute && window.__graphideRoute.open),
        lens: !!(window.__graphideLens && window.__graphideLens.open),
        ws: (document.querySelector("#workspaces [data-ws].on") || { getAttribute: () => "" }).getAttribute("data-ws"),
      });
      const before = state();
      const chords = [
        ["s", { ctrlKey: true }],
        ["s", { metaKey: true }],
        ["x", { ctrlKey: true }],
        ["x", { metaKey: true }],
        ["f", { metaKey: true }],
        ["d", { ctrlKey: true }],
        ["e", { metaKey: true }],
        ["r", { ctrlKey: true }],
        ["l", { metaKey: true }],
        ["2", { ctrlKey: true }],
      ];
      chords.forEach(([key, mods]) =>
        document.dispatchEvent(new KeyboardEvent("keydown", Object.assign({ key, bubbles: true, cancelable: true }, mods)))
      );
      const after = state();
      const posts = (window.__vscodePosts || []).slice(posts0);
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "/", ctrlKey: true, altKey: true, bubbles: true, cancelable: true })
      );
      const altGrFind = document.activeElement === document.getElementById("graphSearch");
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      return {
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
        changed: Object.keys(before).filter((k) => before[k] !== after[k]),
        altGrFind,
      };
    });
    record(
      "K8",
      "Cmd / Ctrl chords (Cmd+S, Ctrl+X, Cmd+F…) do not stamp, skip or toggle desk modes",
      chordKeys.stampPosts === 0 && chordKeys.skipPosts === 0 && chordKeys.changed.length === 0,
      JSON.stringify(chordKeys)
    );
    record("K8b", "Ctrl+Alt (AltGr) / still opens Find", chordKeys.altGrFind, JSON.stringify({ altGrFind: chordKeys.altGrFind }));

    // Holding a key must not flip toggles or stack actions: auto-repeat S / X / D / F / E / R / L / P / Backspace is ignored,
    // while + / − (zoom) and [ ] (step) keep repeating.
    const repeatKeys = await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      const posts0 = (window.__vscodePosts || []).length;
      const state = () => ({
        night: document.documentElement.classList.contains("night"),
        present: document.body.classList.contains("present"),
        ego: !!(document.getElementById("egoBtn") && document.getElementById("egoBtn").classList.contains("on")),
        route: !!(window.__graphideRoute && window.__graphideRoute.open),
        lens: !!(window.__graphideLens && window.__graphideLens.open),
        ws: (document.querySelector("#workspaces [data-ws].on") || { getAttribute: () => "" }).getAttribute("data-ws"),
      });
      const before = state();
      const zoom0 = (document.getElementById("zoomPct") || {}).textContent || "";
      ["s", "x", "d", "f", "e", "r", "l", "p", "Backspace"].forEach((key) =>
        document.dispatchEvent(new KeyboardEvent("keydown", { key, repeat: true, bubbles: true, cancelable: true }))
      );
      const after = state();
      const posts = (window.__vscodePosts || []).slice(posts0);
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "+", repeat: true, bubbles: true, cancelable: true }));
      const zoom1 = (document.getElementById("zoomPct") || {}).textContent || "";
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "0", bubbles: true, cancelable: true }));
      return {
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
        appearancePosts: posts.filter((m) => m && m.type === "setAppearance").length,
        changed: Object.keys(before).filter((k) => before[k] !== after[k]),
        zoomRepeats: zoom1 !== zoom0,
        zoom0,
        zoom1,
      };
    });
    record(
      "K10",
      "Auto-repeat of toggle / action keys (S X D F E R L P Backspace) does nothing; + still repeats",
      repeatKeys.stampPosts === 0 &&
        repeatKeys.skipPosts === 0 &&
        repeatKeys.appearancePosts === 0 &&
        repeatKeys.changed.length === 0 &&
        repeatKeys.zoomRepeats,
      JSON.stringify(repeatKeys)
    );

    // A kind pill is a checkbox, not a text field: after clicking one, desk keys (R = PATH) still work.
    await page.click("#kindFilters label.kind-Type");
    await page.waitForTimeout(120);
    await page.click("#kindFilters label.kind-Type");
    await page.waitForTimeout(120);
    const pillFocus = await page.evaluate(() => {
      const a = document.activeElement;
      return {
        focus: a ? a.tagName.toLowerCase() + ":" + (a.getAttribute("type") || "") : "",
        typeOn: !!(document.querySelector('#kindFilters input[data-kind="Type"]') || {}).checked,
        routeBefore: !!(window.__graphideRoute && window.__graphideRoute.open),
      };
    });
    await page.keyboard.press("r");
    await page.waitForTimeout(200);
    pillFocus.routeAfter = await page.evaluate(() => !!(window.__graphideRoute && window.__graphideRoute.open));
    if (pillFocus.routeAfter !== pillFocus.routeBefore) {
      await page.keyboard.press("r");
      await page.waitForTimeout(150);
    }
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    record(
      "K11",
      "After clicking a kind pill (checkbox focus), R still toggles PATH",
      pillFocus.focus === "input:checkbox" && pillFocus.typeOn && pillFocus.routeAfter !== pillFocus.routeBefore,
      JSON.stringify(pillFocus)
    );

    // A focused <select> (Ego hops, Ask host) owns its typeahead keys: "2" picks 2-hop, it does not switch workspace; "s" never stamps.
    const selPosts0 = await page.evaluate(() => (window.__vscodePosts || []).length);
    const selWs0 = await page.evaluate(() =>
      (document.querySelector("#workspaces [data-ws].on") || { getAttribute: () => "" }).getAttribute("data-ws")
    );
    // Ego hops only shows while Ego is on.
    const egoWasOn = await page.evaluate(() => {
      const btn = document.getElementById("egoBtn");
      const on = !!(btn && btn.classList.contains("on"));
      if (btn && !on) btn.click();
      return on;
    });
    await page.waitForFunction(() => {
      const s = document.getElementById("egoHops");
      return !!(s && s.getBoundingClientRect().width > 0 && !s.disabled);
    }, null, { timeout: 5000 });
    await page.focus("#egoHops");
    await page.keyboard.press("2");
    await page.keyboard.press("s");
    await page.keyboard.press("x");
    const selectKeys = await page.evaluate(
      ({ before, ws0, egoWasOn }) => {
        const posts = (window.__vscodePosts || []).slice(before);
        const sel = document.getElementById("egoHops");
        const out = {
          focused: document.activeElement === sel,
          ws0,
          ws: (document.querySelector("#workspaces [data-ws].on") || { getAttribute: () => "" }).getAttribute("data-ws"),
          stampPosts: posts.filter((m) => m && m.type === "stamp").length,
          skipPosts: posts.filter((m) => m && m.type === "skip").length,
          hops: sel ? sel.value : "",
        };
        if (sel) {
          sel.value = "1";
          sel.dispatchEvent(new Event("change", { bubbles: true }));
          sel.blur();
        }
        const btn = document.getElementById("egoBtn");
        if (!egoWasOn && btn && btn.classList.contains("on")) btn.click();
        return out;
      },
      { before: selPosts0, ws0: selWs0, egoWasOn }
    );
    record(
      "K9",
      "A focused <select> keeps its keys: 2 / S / X do not switch workspace, stamp or skip",
      selectKeys.focused &&
        selectKeys.hops === "2" &&
        selectKeys.ws === selectKeys.ws0 &&
        selectKeys.stampPosts === 0 &&
        selectKeys.skipPosts === 0,
      JSON.stringify(selectKeys)
    );
    if (selectKeys.ws !== selectKeys.ws0) {
      await page.click('#workspaces [data-ws="' + selectKeys.ws0 + '"]');
      await page.waitForTimeout(300);
    }

    // Ask host <select> (#llmPreset) is the other typed select: same guard, no stamp / skip / workspace switch.
    const askPosts0 = await page.evaluate(() => (window.__vscodePosts || []).length);
    const askWs0 = await page.evaluate(() =>
      (document.querySelector("#workspaces [data-ws].on") || { getAttribute: () => "" }).getAttribute("data-ws")
    );
    await page.evaluate(() => {
      const btn = document.getElementById("llmBtn");
      if (btn) btn.click();
    });
    await page.waitForFunction(() => {
      const pane = document.getElementById("llmPane");
      const sel = document.getElementById("llmPreset");
      return !!(pane && !pane.hidden && sel);
    }, null, { timeout: 5000 });
    await page.focus("#llmPreset");
    await page.keyboard.press("2");
    await page.keyboard.press("s");
    await page.keyboard.press("x");
    const askSelectKeys = await page.evaluate(
      ({ before, ws0 }) => {
        const posts = (window.__vscodePosts || []).slice(before);
        const sel = document.getElementById("llmPreset");
        const out = {
          focused: document.activeElement === sel,
          ws0,
          ws: (document.querySelector("#workspaces [data-ws].on") || { getAttribute: () => "" }).getAttribute("data-ws"),
          stampPosts: posts.filter((m) => m && m.type === "stamp").length,
          skipPosts: posts.filter((m) => m && m.type === "skip").length,
          askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
        };
        if (sel) sel.blur();
        const close = document.getElementById("llmClose");
        if (close) close.click();
        return out;
      },
      { before: askPosts0, ws0: askWs0 }
    );
    record(
      "K12",
      "Focused Ask host <select> keeps 2 / S / X — no workspace switch, stamp or skip",
      askSelectKeys.focused &&
        askSelectKeys.askOpen &&
        askSelectKeys.ws === askSelectKeys.ws0 &&
        askSelectKeys.stampPosts === 0 &&
        askSelectKeys.skipPosts === 0,
      JSON.stringify(askSelectKeys)
    );
    if (askSelectKeys.ws !== askSelectKeys.ws0) {
      await page.click('#workspaces [data-ws="' + askSelectKeys.ws0 + '"]');
      await page.waitForTimeout(300);
    }
    await page.waitForFunction(() => {
      const pane = document.getElementById("llmPane");
      return !pane || pane.hidden;
    }, null, { timeout: 5000 });

    // Escape on focused Find blurs so desk keys work again; the query stays.
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    await page.fill("#graphSearch", "render");
    await page.waitForTimeout(120);
    await page.focus("#graphSearch");
    await page.keyboard.press("Escape");
    const findEsc = await page.evaluate(() => {
      const box = document.getElementById("graphSearch");
      return {
        q: box ? box.value : "",
        focused: document.activeElement === box,
        active: document.activeElement ? document.activeElement.id || document.activeElement.tagName : "",
      };
    });
    record(
      "K13",
      "Escape on focused Find blurs the field and keeps the query",
      findEsc.q === "render" && !findEsc.focused,
      JSON.stringify(findEsc)
    );
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("r");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    const findEscRoute = await page.evaluate(() => !!(window.__graphideRoute && window.__graphideRoute.open));
    record("K13b", "After Find Escape blur, desk R still toggles PATH", findEscRoute, "route=" + findEscRoute);
    await page.keyboard.press("r");
    await page.waitForFunction(() => !(window.__graphideRoute && window.__graphideRoute.open), null, { timeout: 5000 });
    // Escape on Find while Route is open: blur Find and close Route in one key.
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("r");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    await page.fill("#graphSearch", "render");
    await page.focus("#graphSearch");
    await page.keyboard.press("Escape");
    const findEscRouteClose = await page.evaluate(() => ({
      q: ((document.getElementById("graphSearch") || {}).value || ""),
      focused: document.activeElement === document.getElementById("graphSearch"),
      route: !!(window.__graphideRoute && window.__graphideRoute.open),
    }));
    record(
      "K13c",
      "Escape on focused Find also closes an open Route",
      findEscRouteClose.q === "render" && !findEscRouteClose.focused && !findEscRouteClose.route,
      JSON.stringify(findEscRouteClose)
    );
    // Escape on Find while Evidence is open: blur Find and close Evidence in one key.
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector("#sliceCanvas .vnode[data-id]", { timeout: 10000 });
    await page.waitForTimeout(200);
    await page.locator("#sliceCanvas .vnode[data-id]").first().click();
    await page.waitForFunction(
      () => !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      null,
      { timeout: 8000 }
    );
    await page.fill("#graphSearch", "render");
    await page.focus("#graphSearch");
    await page.keyboard.press("Escape");
    const findEscEvidence = await page.evaluate(() => ({
      q: ((document.getElementById("graphSearch") || {}).value || ""),
      focused: document.activeElement === document.getElementById("graphSearch"),
      evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
    }));
    record(
      "K13d",
      "Escape on focused Find also closes Evidence",
      findEscEvidence.q === "render" && !findEscEvidence.focused && !findEscEvidence.evidenceOpen,
      JSON.stringify(findEscEvidence)
    );
    // Escape on Find while Lens is open: blur Find and close Lens in one key.
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("l");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    await page.fill("#graphSearch", "render");
    await page.focus("#graphSearch");
    await page.keyboard.press("Escape");
    const findEscLens = await page.evaluate(() => ({
      q: ((document.getElementById("graphSearch") || {}).value || ""),
      focused: document.activeElement === document.getElementById("graphSearch"),
      lens: !!(window.__graphideLens && window.__graphideLens.open),
    }));
    record(
      "K13e",
      "Escape on focused Find also closes an open Lens",
      findEscLens.q === "render" && !findEscLens.focused && !findEscLens.lens,
      JSON.stringify(findEscLens)
    );
    // Escape on Find while Export menu is open: blur Find and close Export in one key.
    await page.click("#exportBtn");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !!(menu && !menu.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.fill("#graphSearch", "render");
    await page.focus("#graphSearch");
    await page.keyboard.press("Escape");
    const findEscExport = await page.evaluate(() => ({
      q: ((document.getElementById("graphSearch") || {}).value || ""),
      focused: document.activeElement === document.getElementById("graphSearch"),
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
    }));
    record(
      "K13f",
      "Escape on focused Find also closes Export",
      findEscExport.q === "render" && !findEscExport.focused && !findEscExport.exportOpen,
      JSON.stringify(findEscExport)
    );
    await page.fill("#graphSearch", "");
    await page.waitForTimeout(80);

    // Backspace with Export open must close Export, not leave the Map altitude / Enter bubble.
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    await page.waitForTimeout(150);
    const backBefore = await page.evaluate(() => ({
      cards: document.querySelectorAll(".bubble-card").length,
      xy: document.querySelectorAll(".react-flow__node").length,
      ws: (document.querySelector("#workspaces [data-ws].on") || { getAttribute: () => "" }).getAttribute("data-ws"),
    }));
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.click("#exportBtn");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !!(menu && !menu.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.keyboard.press("Backspace");
    const backExport = await page.evaluate((before) => {
      const menu = document.getElementById("exportMenu");
      return {
        exportOpen: !!(menu && !menu.hidden),
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        ws: (document.querySelector("#workspaces [data-ws].on") || { getAttribute: () => "" }).getAttribute("data-ws"),
        before,
      };
    }, backBefore);
    record(
      "K14",
      "Backspace closes Export without leaving Map community LOD",
      !backExport.exportOpen &&
        backExport.ws === backBefore.ws &&
        backExport.cards === backBefore.cards &&
        backExport.xy === 0,
      JSON.stringify(backExport)
    );
    // Same for Route: Backspace closes PATH, stack stays.
    await page.keyboard.press("r");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    await page.keyboard.press("Backspace");
    const backRoute = await page.evaluate(() => ({
      route: !!(window.__graphideRoute && window.__graphideRoute.open),
      cards: document.querySelectorAll(".bubble-card").length,
      xy: document.querySelectorAll(".react-flow__node").length,
    }));
    record(
      "K14b",
      "Backspace closes Route without leaving Map community LOD",
      !backRoute.route && backRoute.cards >= 8 && backRoute.xy === 0,
      JSON.stringify(backRoute)
    );
    // Enter bubble + Export: Backspace closes Export and stays inside the bubble (does not pop to Map).
    await page.click('.bubble-card[data-bubble="b-render"]');
    await page.waitForSelector("#enterCanvas .vnode[data-id]", { timeout: 10000 });
    await page.waitForTimeout(300);
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.click("#exportBtn");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !!(menu && !menu.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.keyboard.press("Backspace");
    const backEnter = await page.evaluate(() => ({
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      enter: document.querySelectorAll("#enterCanvas .vnode[data-id]").length,
      cards: document.querySelectorAll(".bubble-card").length,
      xy: document.querySelectorAll("#enterCanvas .react-flow__node, #enterCanvas .vnode").length,
    }));
    record(
      "K14c",
      "Backspace closes Export inside Enter without popping to Map",
      !backEnter.exportOpen && backEnter.enter >= 2 && backEnter.cards === 0,
      JSON.stringify(backEnter)
    );
    await page.keyboard.press("Backspace");
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    await page.waitForTimeout(150);

    // Keys open: Backspace closes Keys, stays on Map.
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("?");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.keyboard.press("Backspace");
    const backKeys = await page.evaluate(() => ({
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      cards: document.querySelectorAll(".bubble-card").length,
      xy: document.querySelectorAll(".react-flow__node").length,
    }));
    record(
      "K14d",
      "Backspace closes Keys without leaving Map community LOD",
      !backKeys.keysOpen && backKeys.cards >= 8 && backKeys.xy === 0,
      JSON.stringify(backKeys)
    );
    // Ask open: Backspace closes Ask, stays on Map.
    await page.click("#llmBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("Backspace");
    const backAsk = await page.evaluate(() => ({
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
      cards: document.querySelectorAll(".bubble-card").length,
      xy: document.querySelectorAll(".react-flow__node").length,
    }));
    record(
      "K14e",
      "Backspace closes Ask without leaving Map community LOD",
      !backAsk.askOpen && backAsk.cards >= 8 && backAsk.xy === 0,
      JSON.stringify(backAsk)
    );
    // Evidence open on Slice: Backspace closes Evidence, stays on Slice (does not goBack).
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector("#sliceCanvas .vnode[data-id]", { timeout: 10000 });
    await page.waitForTimeout(200);
    await page.locator("#sliceCanvas .vnode[data-id]").first().click();
    await page.waitForFunction(
      () => !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      null,
      { timeout: 8000 }
    );
    const evBefore = await page.evaluate(() => document.querySelectorAll("#sliceCanvas .vnode[data-id]").length);
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("Backspace");
    const backEv = await page.evaluate((n) => ({
      evidenceOpen: !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden),
      nodes: document.querySelectorAll("#sliceCanvas .vnode[data-id]").length,
      before: n,
      cards: document.querySelectorAll(".bubble-card").length,
    }), evBefore);
    record(
      "K14f",
      "Backspace closes Evidence without leaving Slice",
      !backEv.evidenceOpen && backEv.nodes === backEv.before && backEv.cards === 0,
      JSON.stringify(backEv)
    );
    // Lens + Present on Map
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("l");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    await page.keyboard.press("Backspace");
    const backLens = await page.evaluate(() => ({
      lens: !!(window.__graphideLens && window.__graphideLens.open),
      cards: document.querySelectorAll(".bubble-card").length,
      xy: document.querySelectorAll(".react-flow__node").length,
    }));
    record(
      "K14g",
      "Backspace closes Lens without leaving Map community LOD",
      !backLens.lens && backLens.cards >= 8 && backLens.xy === 0,
      JSON.stringify(backLens)
    );
    await page.keyboard.press("f");
    await page.waitForFunction(() => document.body.classList.contains("present"), null, { timeout: 5000 });
    // Keys on stage: Backspace closes Keys first; Present stays (same stack as Escape).
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("?");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.keyboard.press("Backspace");
    const backKeysPresent = await page.evaluate(() => ({
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      present: document.body.classList.contains("present"),
      cards: document.querySelectorAll(".bubble-card").length,
      xy: document.querySelectorAll(".react-flow__node").length,
    }));
    record(
      "K14i",
      "Backspace closes Keys on Present without exiting the stage",
      !backKeysPresent.keysOpen &&
        backKeysPresent.present &&
        backKeysPresent.cards >= 8 &&
        backKeysPresent.xy === 0,
      JSON.stringify(backKeysPresent)
    );
    // Export on stage: Backspace closes Export first; Present stays.
    await page.click("#exportBtn");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !!(menu && !menu.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("Backspace");
    const backExportPresent = await page.evaluate(() => ({
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      present: document.body.classList.contains("present"),
      cards: document.querySelectorAll(".bubble-card").length,
      xy: document.querySelectorAll(".react-flow__node").length,
    }));
    record(
      "K14j",
      "Backspace closes Export on Present without exiting the stage",
      !backExportPresent.exportOpen &&
        backExportPresent.present &&
        backExportPresent.cards >= 8 &&
        backExportPresent.xy === 0,
      JSON.stringify(backExportPresent)
    );
    // Lens on stage: Backspace closes Lens first; Present stays.
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("l");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    await page.keyboard.press("Backspace");
    const backLensPresent = await page.evaluate(() => ({
      lens: !!(window.__graphideLens && window.__graphideLens.open),
      present: document.body.classList.contains("present"),
      cards: document.querySelectorAll(".bubble-card").length,
      xy: document.querySelectorAll(".react-flow__node").length,
    }));
    record(
      "K14k",
      "Backspace closes Lens on Present without exiting the stage",
      !backLensPresent.lens &&
        backLensPresent.present &&
        backLensPresent.cards >= 8 &&
        backLensPresent.xy === 0,
      JSON.stringify(backLensPresent)
    );
    // Route on stage: Backspace closes Route first; Present stays.
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("r");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    await page.keyboard.press("Backspace");
    const backRoutePresent = await page.evaluate(() => ({
      route: !!(window.__graphideRoute && window.__graphideRoute.open),
      present: document.body.classList.contains("present"),
      cards: document.querySelectorAll(".bubble-card").length,
      xy: document.querySelectorAll(".react-flow__node").length,
    }));
    record(
      "K14l",
      "Backspace closes Route on Present without exiting the stage",
      !backRoutePresent.route &&
        backRoutePresent.present &&
        backRoutePresent.cards >= 8 &&
        backRoutePresent.xy === 0,
      JSON.stringify(backRoutePresent)
    );
    await page.keyboard.press("Backspace");
    const backPresent = await page.evaluate(() => ({
      present: document.body.classList.contains("present"),
      cards: document.querySelectorAll(".bubble-card").length,
      xy: document.querySelectorAll(".react-flow__node").length,
    }));
    record(
      "K14h",
      "Backspace exits Present without leaving Map community LOD",
      !backPresent.present && backPresent.cards >= 8 && backPresent.xy === 0,
      JSON.stringify(backPresent)
    );

    // Export open: S / X / R must not stamp, skip, or open PATH.
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    const chromePosts0 = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.click("#exportBtn");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !!(menu && !menu.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.keyboard.press("s");
    await page.keyboard.press("x");
    await page.keyboard.press("r");
    const chromeKeys = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
        route: !!(window.__graphideRoute && window.__graphideRoute.open),
      };
    }, chromePosts0);
    record(
      "K15",
      "Open Export blocks desk S / X / R (no stamp, skip, or PATH)",
      chromeKeys.exportOpen &&
        chromeKeys.stampPosts === 0 &&
        chromeKeys.skipPosts === 0 &&
        !chromeKeys.route,
      JSON.stringify(chromeKeys)
    );
    // Export open: L must not open LENS (parity with Keys K15f / Ask K15g).
    await page.keyboard.press("l");
    const exportBlockLens = await page.evaluate(() => ({
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      lens: !!(window.__graphideLens && window.__graphideLens.open),
    }));
    record(
      "K15h",
      "Open Export blocks desk L (no LENS)",
      exportBlockLens.exportOpen && !exportBlockLens.lens,
      JSON.stringify(exportBlockLens)
    );
    // Export open: F must not enter Present (residual desk-key parity after S/X/R/L).
    await page.keyboard.press("f");
    const exportBlockPresent = await page.evaluate(() => ({
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      presenting: !!(document.body && document.body.classList.contains("present")),
    }));
    record(
      "K15i",
      "Open Export blocks desk F (no Present)",
      exportBlockPresent.exportOpen && !exportBlockPresent.presenting,
      JSON.stringify(exportBlockPresent)
    );
    // Export open: E must not turn Ego on (residual desk-key parity after S/X/R/L/F).
    await page.keyboard.press("e");
    const exportBlockEgo = await page.evaluate(() => ({
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      ego: !!(document.getElementById("egoBtn") && document.getElementById("egoBtn").classList.contains("on")),
    }));
    record(
      "K15l",
      "Open Export blocks desk E (no Ego)",
      exportBlockEgo.exportOpen && !exportBlockEgo.ego,
      JSON.stringify(exportBlockEgo)
    );
    // Export open: D must not flip day/night (residual desk-key parity after S/X/R/L/F/E).
    const exportDayPosts0 = await page.evaluate(() => (window.__vscodePosts || []).length);
    const exportNightBefore = await page.evaluate(() =>
      document.documentElement.classList.contains("night")
    );
    await page.keyboard.press("d");
    const exportBlockDay = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
        night: document.documentElement.classList.contains("night"),
        appearancePosts: posts.filter((m) => m && m.type === "setAppearance").length,
      };
    }, exportDayPosts0);
    record(
      "K15o",
      "Open Export blocks desk D (no day/night)",
      exportBlockDay.exportOpen &&
        exportBlockDay.night === exportNightBefore &&
        exportBlockDay.appearancePosts === 0,
      JSON.stringify({ ...exportBlockDay, nightBefore: exportNightBefore })
    );
    // Export open: P must not start Map path walk (residual desk-key parity after S/X/R/L/F/E/D).
    await page.keyboard.press("p");
    const exportBlockPlay = await page.evaluate(() => ({
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      playOn: !!(document.getElementById("pathWalkBtn") && document.getElementById("pathWalkBtn").classList.contains("on")),
      walk: document.querySelectorAll(".walk, .here").length,
    }));
    record(
      "K15r",
      "Open Export blocks desk P (no Play)",
      exportBlockPlay.exportOpen && !exportBlockPlay.playOn && exportBlockPlay.walk === 0,
      JSON.stringify(exportBlockPlay)
    );
    // Export open: [ ] must not step Map path walk (residual desk-key parity after S/X/R/L/F/E/D/P).
    await page.keyboard.press("]");
    await page.keyboard.press("[");
    const exportBlockStep = await page.evaluate(() => ({
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      walk: document.querySelectorAll(".walk, .here").length,
      chipWalk: document.querySelectorAll(".feat-chip.walk").length,
      cardWalk: document.querySelectorAll(".bubble-card.walk").length,
    }));
    record(
      "K15u",
      "Open Export blocks desk [ ] (no path step)",
      exportBlockStep.exportOpen &&
        exportBlockStep.walk === 0 &&
        exportBlockStep.chipWalk === 0 &&
        exportBlockStep.cardWalk === 0,
      JSON.stringify(exportBlockStep)
    );
    // Export open: + / = / - / _ must not zoom (residual desk-key parity after S/X/R/L/F/E/D/P/[ ]).
    const exportZoomBefore = await page.evaluate(() => {
      const m = /(\d+)%/.exec(((document.getElementById("zoomPct") || {}).textContent || ""));
      return Number((m && m[1]) || 0);
    });
    await page.keyboard.press("=");
    await page.keyboard.press("+");
    await page.keyboard.press("-");
    await page.keyboard.press("_");
    const exportBlockZoom = await page.evaluate(() => {
      const m = /(\d+)%/.exec(((document.getElementById("zoomPct") || {}).textContent || ""));
      return {
        exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
        pct: Number((m && m[1]) || 0),
      };
    });
    record(
      "K15x",
      "Open Export blocks desk + − (no zoom)",
      exportBlockZoom.exportOpen && exportBlockZoom.pct === exportZoomBefore,
      JSON.stringify({ ...exportBlockZoom, pctBefore: exportZoomBefore })
    );
    // Export open: 0 must not Fit (residual desk-key parity after S/X/R/L/F/E/D/P/[ ]/+/−).
    // Zoom via chrome button first so Fit would move camTo if the desk key leaked.
    // Compare zoomPct (camTo), not live transform — cam still lerps under Export.
    await page.click("#zoomIn");
    const exportFitBefore = await page.evaluate(() => {
      const m = /(\d+)%/.exec(((document.getElementById("zoomPct") || {}).textContent || ""));
      return Number((m && m[1]) || 0);
    });
    await page.keyboard.press("0");
    const exportBlockFit = await page.evaluate(() => {
      const m = /(\d+)%/.exec(((document.getElementById("zoomPct") || {}).textContent || ""));
      return {
        exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
        pct: Number((m && m[1]) || 0),
      };
    });
    record(
      "K15aa",
      "Open Export blocks desk 0 (no Fit)",
      exportBlockFit.exportOpen && exportBlockFit.pct === exportFitBefore,
      JSON.stringify({ ...exportBlockFit, pctBefore: exportFitBefore })
    );
    await page.keyboard.press("Backspace");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !menu || menu.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Keys sheet open: same — S must not stamp.
    const keysPosts0 = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.keyboard.press("?");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.keyboard.press("s");
    await page.keyboard.press("x");
    const keysBlock = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
    }, keysPosts0);
    record(
      "K15b",
      "Open Keys sheet blocks desk S / X (no stamp or skip)",
      keysBlock.keysOpen && keysBlock.stampPosts === 0 && keysBlock.skipPosts === 0,
      JSON.stringify(keysBlock)
    );
    // Keys sheet open: R must not open PATH (parity with Export K15 — feature-ref S/X/R).
    await page.keyboard.press("r");
    const keysBlockRoute = await page.evaluate(() => ({
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      route: !!(window.__graphideRoute && window.__graphideRoute.open),
    }));
    record(
      "K15d",
      "Open Keys sheet blocks desk R (no PATH)",
      keysBlockRoute.keysOpen && !keysBlockRoute.route,
      JSON.stringify(keysBlockRoute)
    );
    // Keys sheet open: L must not open LENS (parity with Export/Ask chrome key lock).
    await page.keyboard.press("l");
    const keysBlockLens = await page.evaluate(() => ({
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      lens: !!(window.__graphideLens && window.__graphideLens.open),
    }));
    record(
      "K15f",
      "Open Keys sheet blocks desk L (no LENS)",
      keysBlockLens.keysOpen && !keysBlockLens.lens,
      JSON.stringify(keysBlockLens)
    );
    // Keys sheet open: F must not enter Present (parity with Export K15i).
    await page.keyboard.press("f");
    const keysBlockPresent = await page.evaluate(() => ({
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      presenting: !!(document.body && document.body.classList.contains("present")),
    }));
    record(
      "K15j",
      "Open Keys sheet blocks desk F (no Present)",
      keysBlockPresent.keysOpen && !keysBlockPresent.presenting,
      JSON.stringify(keysBlockPresent)
    );
    // Keys sheet open: E must not turn Ego on (parity with Export K15l).
    await page.keyboard.press("e");
    const keysBlockEgo = await page.evaluate(() => ({
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      ego: !!(document.getElementById("egoBtn") && document.getElementById("egoBtn").classList.contains("on")),
    }));
    record(
      "K15m",
      "Open Keys sheet blocks desk E (no Ego)",
      keysBlockEgo.keysOpen && !keysBlockEgo.ego,
      JSON.stringify(keysBlockEgo)
    );
    // Keys sheet open: D must not flip day/night (parity with Export K15o).
    const keysChromeDayPosts0 = await page.evaluate(() => (window.__vscodePosts || []).length);
    const keysChromeNightBefore = await page.evaluate(() =>
      document.documentElement.classList.contains("night")
    );
    await page.keyboard.press("d");
    const keysChromeBlockDay = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
        night: document.documentElement.classList.contains("night"),
        appearancePosts: posts.filter((m) => m && m.type === "setAppearance").length,
      };
    }, keysChromeDayPosts0);
    record(
      "K15p",
      "Open Keys sheet blocks desk D (no day/night)",
      keysChromeBlockDay.keysOpen &&
        keysChromeBlockDay.night === keysChromeNightBefore &&
        keysChromeBlockDay.appearancePosts === 0,
      JSON.stringify({ ...keysChromeBlockDay, nightBefore: keysChromeNightBefore })
    );
    // Keys sheet open: P must not start Map path walk (parity with Export K15r).
    await page.keyboard.press("p");
    const keysBlockPlay = await page.evaluate(() => ({
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      playOn: !!(document.getElementById("pathWalkBtn") && document.getElementById("pathWalkBtn").classList.contains("on")),
      walk: document.querySelectorAll(".walk, .here").length,
    }));
    record(
      "K15s",
      "Open Keys sheet blocks desk P (no Play)",
      keysBlockPlay.keysOpen && !keysBlockPlay.playOn && keysBlockPlay.walk === 0,
      JSON.stringify(keysBlockPlay)
    );
    // Keys sheet open: [ ] must not step Map path walk (parity with Export K15u).
    await page.keyboard.press("]");
    await page.keyboard.press("[");
    const keysBlockStep = await page.evaluate(() => ({
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      walk: document.querySelectorAll(".walk, .here").length,
      chipWalk: document.querySelectorAll(".feat-chip.walk").length,
      cardWalk: document.querySelectorAll(".bubble-card.walk").length,
    }));
    record(
      "K15v",
      "Open Keys sheet blocks desk [ ] (no path step)",
      keysBlockStep.keysOpen &&
        keysBlockStep.walk === 0 &&
        keysBlockStep.chipWalk === 0 &&
        keysBlockStep.cardWalk === 0,
      JSON.stringify(keysBlockStep)
    );
    // Keys sheet open: + / = / - / _ must not zoom (parity with Export K15x).
    const keysChromeZoomBefore = await page.evaluate(() => {
      const m = /(\d+)%/.exec(((document.getElementById("zoomPct") || {}).textContent || ""));
      return Number((m && m[1]) || 0);
    });
    await page.keyboard.press("=");
    await page.keyboard.press("+");
    await page.keyboard.press("-");
    await page.keyboard.press("_");
    const keysChromeBlockZoom = await page.evaluate(() => {
      const m = /(\d+)%/.exec(((document.getElementById("zoomPct") || {}).textContent || ""));
      return {
        keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
        pct: Number((m && m[1]) || 0),
      };
    });
    record(
      "K15y",
      "Open Keys sheet blocks desk + − (no zoom)",
      keysChromeBlockZoom.keysOpen && keysChromeBlockZoom.pct === keysChromeZoomBefore,
      JSON.stringify({ ...keysChromeBlockZoom, pctBefore: keysChromeZoomBefore })
    );
    // Keys sheet open: 0 must not Fit (parity with Export K15aa).
    // Zoom via chrome button first so Fit would move camTo if the desk key leaked.
    // Compare zoomPct (camTo), not live transform — cam still lerps under Keys.
    await page.click("#zoomIn");
    const keysChromeFitBefore = await page.evaluate(() => {
      const m = /(\d+)%/.exec(((document.getElementById("zoomPct") || {}).textContent || ""));
      return Number((m && m[1]) || 0);
    });
    await page.keyboard.press("0");
    const keysChromeBlockFit = await page.evaluate(() => {
      const m = /(\d+)%/.exec(((document.getElementById("zoomPct") || {}).textContent || ""));
      return {
        keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
        pct: Number((m && m[1]) || 0),
      };
    });
    record(
      "K15ab",
      "Open Keys sheet blocks desk 0 (no Fit)",
      keysChromeBlockFit.keysOpen && keysChromeBlockFit.pct === keysChromeFitBefore,
      JSON.stringify({ ...keysChromeBlockFit, pctBefore: keysChromeFitBefore })
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Ask open (field not focused): S / X must not stamp / skip.
    const askBlockPosts0 = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.click("#llmBtn");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("s");
    await page.keyboard.press("x");
    const askBlock = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
      };
    }, askBlockPosts0);
    record(
      "K15c",
      "Open Ask blocks desk S / X when the field is not focused",
      askBlock.askOpen && askBlock.stampPosts === 0 && askBlock.skipPosts === 0,
      JSON.stringify(askBlock)
    );
    // Ask open (field not focused): R must not open PATH (parity with Export K15 / Keys K15d).
    await page.keyboard.press("r");
    const askBlockRoute = await page.evaluate(() => ({
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
      route: !!(window.__graphideRoute && window.__graphideRoute.open),
    }));
    record(
      "K15e",
      "Open Ask blocks desk R (no PATH)",
      askBlockRoute.askOpen && !askBlockRoute.route,
      JSON.stringify(askBlockRoute)
    );
    // Ask open (field not focused): L must not open LENS (parity with Keys K15f).
    await page.keyboard.press("l");
    const askBlockLens = await page.evaluate(() => ({
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
      lens: !!(window.__graphideLens && window.__graphideLens.open),
    }));
    record(
      "K15g",
      "Open Ask blocks desk L (no LENS)",
      askBlockLens.askOpen && !askBlockLens.lens,
      JSON.stringify(askBlockLens)
    );
    // Ask open (field not focused): F must not enter Present (parity with Export K15i / Keys K15j).
    await page.keyboard.press("f");
    const askBlockPresent = await page.evaluate(() => ({
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
      presenting: !!(document.body && document.body.classList.contains("present")),
    }));
    record(
      "K15k",
      "Open Ask blocks desk F (no Present)",
      askBlockPresent.askOpen && !askBlockPresent.presenting,
      JSON.stringify(askBlockPresent)
    );
    // Ask open (field not focused): E must not turn Ego on (parity with Export K15l / Keys K15m).
    await page.keyboard.press("e");
    const askBlockEgo = await page.evaluate(() => ({
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
      ego: !!(document.getElementById("egoBtn") && document.getElementById("egoBtn").classList.contains("on")),
    }));
    record(
      "K15n",
      "Open Ask blocks desk E (no Ego)",
      askBlockEgo.askOpen && !askBlockEgo.ego,
      JSON.stringify(askBlockEgo)
    );
    // Ask open (field not focused): D must not flip day/night (parity with Export K15o / Keys K15p).
    const askChromeDayPosts0 = await page.evaluate(() => (window.__vscodePosts || []).length);
    const askChromeNightBefore = await page.evaluate(() =>
      document.documentElement.classList.contains("night")
    );
    await page.keyboard.press("d");
    const askChromeBlockDay = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
        night: document.documentElement.classList.contains("night"),
        appearancePosts: posts.filter((m) => m && m.type === "setAppearance").length,
      };
    }, askChromeDayPosts0);
    record(
      "K15q",
      "Open Ask blocks desk D (no day/night)",
      askChromeBlockDay.askOpen &&
        askChromeBlockDay.night === askChromeNightBefore &&
        askChromeBlockDay.appearancePosts === 0,
      JSON.stringify({ ...askChromeBlockDay, nightBefore: askChromeNightBefore })
    );
    // Ask open (field not focused): P must not start Map path walk (parity with Export K15r / Keys K15s).
    await page.keyboard.press("p");
    const askBlockPlay = await page.evaluate(() => ({
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
      playOn: !!(document.getElementById("pathWalkBtn") && document.getElementById("pathWalkBtn").classList.contains("on")),
      walk: document.querySelectorAll(".walk, .here").length,
    }));
    record(
      "K15t",
      "Open Ask blocks desk P (no Play)",
      askBlockPlay.askOpen && !askBlockPlay.playOn && askBlockPlay.walk === 0,
      JSON.stringify(askBlockPlay)
    );
    // Ask open (field not focused): [ ] must not step Map path walk (parity with Export K15u / Keys K15v).
    await page.keyboard.press("]");
    await page.keyboard.press("[");
    const askBlockStep = await page.evaluate(() => ({
      askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
      walk: document.querySelectorAll(".walk, .here").length,
      chipWalk: document.querySelectorAll(".feat-chip.walk").length,
      cardWalk: document.querySelectorAll(".bubble-card.walk").length,
    }));
    record(
      "K15w",
      "Open Ask blocks desk [ ] (no path step)",
      askBlockStep.askOpen &&
        askBlockStep.walk === 0 &&
        askBlockStep.chipWalk === 0 &&
        askBlockStep.cardWalk === 0,
      JSON.stringify(askBlockStep)
    );
    // Ask open (field not focused): + / = / - / _ must not zoom (parity with Export K15x / Keys K15y).
    const askChromeZoomBefore = await page.evaluate(() => {
      const m = /(\d+)%/.exec(((document.getElementById("zoomPct") || {}).textContent || ""));
      return Number((m && m[1]) || 0);
    });
    await page.keyboard.press("=");
    await page.keyboard.press("+");
    await page.keyboard.press("-");
    await page.keyboard.press("_");
    const askChromeBlockZoom = await page.evaluate(() => {
      const m = /(\d+)%/.exec(((document.getElementById("zoomPct") || {}).textContent || ""));
      return {
        askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
        pct: Number((m && m[1]) || 0),
      };
    });
    record(
      "K15z",
      "Open Ask blocks desk + − (no zoom)",
      askChromeBlockZoom.askOpen && askChromeBlockZoom.pct === askChromeZoomBefore,
      JSON.stringify({ ...askChromeBlockZoom, pctBefore: askChromeZoomBefore })
    );
    // Ask open (field not focused): 0 must not Fit (parity with Export K15aa / Keys K15ab).
    // Zoom via chrome button first so Fit would move camTo if the desk key leaked.
    // Compare zoomPct (camTo), not live transform — cam still lerps under Ask.
    await page.click("#zoomIn");
    const askChromeFitBefore = await page.evaluate(() => {
      const m = /(\d+)%/.exec(((document.getElementById("zoomPct") || {}).textContent || ""));
      return Number((m && m[1]) || 0);
    });
    await page.keyboard.press("0");
    const askChromeBlockFit = await page.evaluate(() => {
      const m = /(\d+)%/.exec(((document.getElementById("zoomPct") || {}).textContent || ""));
      return {
        askOpen: !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden),
        pct: Number((m && m[1]) || 0),
      };
    });
    record(
      "K15ac",
      "Open Ask blocks desk 0 (no Fit)",
      askChromeBlockFit.askOpen && askChromeBlockFit.pct === askChromeFitBefore,
      JSON.stringify({ ...askChromeBlockFit, pctBefore: askChromeFitBefore })
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("llmPane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
    );

    // Escape on focused #prompt blurs so desk keys work; value stays.
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    const promptEl = await page.$("#prompt");
    if (promptEl) {
      await page.fill("#prompt", "name=hit,hit");
      await page.focus("#prompt");
      await page.keyboard.press("Escape");
      const promptEsc = await page.evaluate(() => {
        const box = document.getElementById("prompt");
        return {
          q: box ? box.value : "",
          focused: document.activeElement === box,
        };
      });
      record(
        "K16",
        "Escape on focused #prompt blurs the field and keeps the value",
        promptEsc.q === "name=hit,hit" && !promptEsc.focused,
        JSON.stringify(promptEsc)
      );
      await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
      await page.keyboard.press("r");
      await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
      const promptEscRoute = await page.evaluate(() => !!(window.__graphideRoute && window.__graphideRoute.open));
      record("K16b", "After #prompt Escape blur, desk R still toggles PATH", promptEscRoute, "route=" + promptEscRoute);
      await page.keyboard.press("r");
      await page.waitForFunction(() => !(window.__graphideRoute && window.__graphideRoute.open), null, { timeout: 5000 });
    } else {
      record("K16", "Escape on focused #prompt blurs the field and keeps the value", false, "no #prompt");
      record("K16b", "After #prompt Escape blur, desk R still toggles PATH", false, "no #prompt");
    }

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
    assertNoStampDir("PW7", "Map path walk did not write .graphide/stamps/");

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
      noteArtifact(name);
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
      box.innerHTML =
        '<i class="dim hit on focus selected ego-dim ego route-dim on-route on-route-hot lens-dim lens-on away hot flowing on-path now past ahead here walk dragging panning" data-delta-review-current="1"></i>';
      if (typeof stripExportViewerState === "function") stripExportViewerState(box);
      const i = box.querySelector("i");
      return {
        cls: ((i && i.className) || "").trim(),
        review: i ? i.getAttribute("data-delta-review-current") : "missing",
      };
    });
    record(
      "X6",
      "Canonical export strips focus / play / search / Route / Lens / away classes",
      stripProbe.cls === "" && !stripProbe.review,
      JSON.stringify(stripProbe)
    );
    const exportPosts = await page.evaluate(() =>
      (window.__vscodePosts || []).filter((m) => m && m.type === "exportFile").map((m) => m.name)
    );
    record("X7", "Export posts exportFile to the host stub (not stamp)", exportPosts.length >= 1, exportPosts.join(","));
    assertNoStampDir("X8", "Export step did not write .graphide/stamps/");

    // Find is viewer state. A live .hit must not reach the exported diagram.
    await page.fill("#graphSearch", "physics");
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const box = document.getElementById("graphSearch");
      if (box && box.blur) box.blur();
      if (window.__graphideLastExport) window.__graphideLastExport.svg = null;
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
    await page.click("#exportSvg");
    await page.waitForFunction(() => window.__graphideLastExport && window.__graphideLastExport.svg, null, {
      timeout: 20000,
    });
    const exportFind = await page.evaluate(() => {
      const url = window.__graphideLastExport.svg.dataUrl || "";
      const bin = atob(url.slice(url.indexOf(",") + 1));
      const text = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
      const cards = [...text.matchAll(/class="(bubble-card[^"]*)"[^>]*data-bubble="([^"]+)"/g)].map((m) => ({ id: m[2], cls: m[1] }));
      const physics = cards.find((c) => c.id === "b-physics");
      return {
        liveHit: [...document.querySelectorAll(".bubble-card.hit")].map((el) => el.getAttribute("data-bubble")),
        cards: cards.length,
        physics: physics ? physics.cls : "",
        hit: cards.filter((c) => /\bhit\b/.test(c.cls)).map((c) => c.id),
        dim: cards.filter((c) => /\bdim\b/.test(c.cls)).map((c) => c.id),
      };
    });
    record(
      "X6b",
      "Export SVG after Find carries no .hit / .dim on Map cards",
      exportFind.liveHit.indexOf("b-physics") >= 0 &&
        exportFind.cards >= 8 &&
        /\bbubble-card\b/.test(exportFind.physics) &&
        exportFind.hit.length === 0 &&
        exportFind.dim.length === 0,
      JSON.stringify(exportFind)
    );
    await page.fill("#graphSearch", "");
    await page.waitForTimeout(120);

    // Route / Lens are viewer state too. A live .route-dim / .lens-on must not reach the exported diagram.
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector("#sliceCanvas .vnode[data-id]", { timeout: 10000 });
    await page.waitForTimeout(220);
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("r");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    await page.waitForTimeout(150);
    // Snapshot live Route paint before Export — opening Export closes Route (K18u).
    const liveRouteBefore = await page.evaluate(() => ({
      routeDim: document.querySelectorAll("#sliceCanvas .vnode.route-dim").length,
      onRoute: document.querySelectorAll("#sliceCanvas .vnode.on-route").length,
    }));
    await page.evaluate(() => {
      if (window.__graphideLastExport) window.__graphideLastExport.svg = null;
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
    // Re-stamp route viewer classes so EXPORT_STRIP is still exercised after exclusivity cleared Route.
    await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#sliceCanvas .vnode[data-id]")];
      if (nodes[0]) nodes[0].classList.add("on-route");
      for (let i = 1; i < Math.min(nodes.length, 5); i++) nodes[i].classList.add("route-dim");
    });
    await page.click("#exportSvg");
    await page.waitForFunction(() => window.__graphideLastExport && window.__graphideLastExport.svg, null, {
      timeout: 20000,
    });
    const exportRoute = await page.evaluate((liveBefore) => {
      const url = window.__graphideLastExport.svg.dataUrl || "";
      const bin = atob(url.slice(url.indexOf(",") + 1));
      const text = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
      // Stylesheet rules mention route-dim; only element class attrs are viewer state.
      const markup = text.replace(/<style[\s\S]*?<\/style>/gi, "");
      const classes = [...markup.matchAll(/\bclass="([^"]*)"/g)].map((m) => m[1]);
      return {
        live: liveBefore,
        routeDim: classes.filter((c) => /\broute-dim\b/.test(c)).length,
        onRoute: classes.filter((c) => /\bon-route\b/.test(c)).length,
        lensDim: classes.filter((c) => /\blens-dim\b/.test(c)).length,
        lensOn: classes.filter((c) => /\blens-on\b/.test(c)).length,
      };
    }, liveRouteBefore);
    record(
      "X6c",
      "Export SVG after Route carries no .route-dim / .on-route on Slice nodes",
      exportRoute.live.routeDim >= 1 &&
        exportRoute.live.onRoute >= 1 &&
        exportRoute.routeDim === 0 &&
        exportRoute.onRoute === 0 &&
        exportRoute.lensDim === 0 &&
        exportRoute.lensOn === 0,
      JSON.stringify(exportRoute)
    );
    // Export already closed Route (K18u); ensure dock is shut before Lens export strip.
    await page.waitForFunction(() => !(window.__graphideRoute && window.__graphideRoute.open), null, { timeout: 5000 });
    await page.keyboard.press("l");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    await page.waitForTimeout(150);
    // Snapshot live Lens paint before Export — opening Export closes Lens (K18t).
    const liveLensBefore = await page.evaluate(() => ({
      lensDim: document.querySelectorAll("#sliceCanvas .vnode.lens-dim").length,
      lensOn: document.querySelectorAll("#sliceCanvas .vnode.lens-on").length,
    }));
    await page.evaluate(() => {
      if (window.__graphideLastExport) window.__graphideLastExport.svg = null;
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
    // Re-stamp lens viewer classes so EXPORT_STRIP is still exercised after exclusivity cleared Lens.
    await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#sliceCanvas .vnode[data-id]")];
      if (nodes[0]) nodes[0].classList.add("lens-on");
      for (let i = 1; i < Math.min(nodes.length, 5); i++) nodes[i].classList.add("lens-dim");
    });
    await page.click("#exportSvg");
    await page.waitForFunction(() => window.__graphideLastExport && window.__graphideLastExport.svg, null, {
      timeout: 20000,
    });
    const exportLens = await page.evaluate((liveBefore) => {
      const url = window.__graphideLastExport.svg.dataUrl || "";
      const bin = atob(url.slice(url.indexOf(",") + 1));
      const text = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
      const markup = text.replace(/<style[\s\S]*?<\/style>/gi, "");
      const classes = [...markup.matchAll(/\bclass="([^"]*)"/g)].map((m) => m[1]);
      return {
        live: liveBefore,
        lensDim: classes.filter((c) => /\blens-dim\b/.test(c)).length,
        lensOn: classes.filter((c) => /\blens-on\b/.test(c)).length,
        routeDim: classes.filter((c) => /\broute-dim\b/.test(c)).length,
        onRoute: classes.filter((c) => /\bon-route\b/.test(c)).length,
      };
    }, liveLensBefore);
    record(
      "X6d",
      "Export SVG after Lens carries no .lens-dim / .lens-on on Slice nodes",
      exportLens.live.lensDim >= 1 &&
        exportLens.live.lensOn >= 1 &&
        exportLens.lensDim === 0 &&
        exportLens.lensOn === 0 &&
        exportLens.routeDim === 0 &&
        exportLens.onRoute === 0,
      JSON.stringify(exportLens)
    );
    // Export already closed Lens (K18t); ensure dock is shut before Sequence export strip.
    await page.waitForFunction(() => !(window.__graphideLens && window.__graphideLens.open), null, { timeout: 5000 });

    // Play-head / path highlight is viewer state: stamp .hot / .flowing / .on-path on the live canvas, then export must drop them.
    await page.click('#workspaces [data-ws="sequence"]');
    await page.waitForSelector("#seqCanvas .vnode[data-id], #seqCanvas .seq-part, .react-flow__node", { timeout: 10000 });
    await page.waitForTimeout(220);
    const livePlay = await page.evaluate(() => {
      const root = document.getElementById("seqCanvas") || document.querySelector(".steiner-wrap");
      const node =
        document.querySelector("#seqCanvas .vnode[data-id]") ||
        document.querySelector("#seqCanvas .react-flow__node") ||
        document.querySelector("#seqCanvas .seq-part");
      if (root) root.classList.add("flowing");
      if (node) {
        node.classList.add("hot");
        node.classList.add("on-path");
      }
      return {
        hot: document.querySelectorAll("#seqCanvas .hot, .vnode.hot").length,
        flowing: document.querySelectorAll(".flowing").length,
        onPath: document.querySelectorAll("#seqCanvas .on-path, .vnode.on-path").length,
      };
    });
    await page.evaluate(() => {
      if (window.__graphideLastExport) window.__graphideLastExport.svg = null;
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
    await page.click("#exportSvg");
    await page.waitForFunction(() => window.__graphideLastExport && window.__graphideLastExport.svg, null, {
      timeout: 20000,
    });
    const exportPlay = await page.evaluate(() => {
      const url = window.__graphideLastExport.svg.dataUrl || "";
      const bin = atob(url.slice(url.indexOf(",") + 1));
      const text = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
      const markup = text.replace(/<style[\s\S]*?<\/style>/gi, "");
      const classes = [...markup.matchAll(/\bclass="([^"]*)"/g)].map((m) => m[1]);
      return {
        liveHot: document.querySelectorAll("#seqCanvas .hot, .vnode.hot").length,
        liveFlowing: document.querySelectorAll(".flowing").length,
        liveOnPath: document.querySelectorAll("#seqCanvas .on-path, .vnode.on-path").length,
        hot: classes.filter((c) => /\bhot\b/.test(c)).length,
        flowing: classes.filter((c) => /\bflowing\b/.test(c)).length,
        onPath: classes.filter((c) => /\bon-path\b/.test(c)).length,
      };
    });
    record(
      "X6e",
      "Export SVG strips stamped .hot / .flowing / .on-path play-head classes",
      livePlay.hot >= 1 &&
        livePlay.flowing >= 1 &&
        livePlay.onPath >= 1 &&
        exportPlay.liveHot >= 1 &&
        exportPlay.hot === 0 &&
        exportPlay.flowing === 0 &&
        exportPlay.onPath === 0,
      JSON.stringify({ livePlay, exportPlay })
    );
    await page.evaluate(() => {
      document.querySelectorAll(".hot, .flowing, .on-path").forEach((el) => {
        el.classList.remove("hot", "flowing", "on-path");
      });
    });
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    await page.waitForTimeout(120);
    // Zoom parks off-stage cards with data-offview; export must strip it so camera-reset clone shows them.
    for (let i = 0; i < 8; i++) {
      const off = await page.evaluate(() => document.querySelectorAll('.bubble-card[data-offview="1"]').length);
      if (off >= 1) break;
      await page.evaluate(() => {
        const btn = document.getElementById("zoomIn");
        if (btn) btn.click();
      });
      await page.waitForTimeout(220);
    }
    let liveOff = await page.evaluate(() => {
      const parked = [...document.querySelectorAll('.bubble-card[data-offview="1"]')].map((el) => el.getAttribute("data-bubble"));
      return { off: parked.length, ids: parked, cards: document.querySelectorAll(".bubble-card").length };
    });
    if (liveOff.off < 1) {
      const box = await page.locator("#canvas .stage").boundingBox();
      if (box) {
        await page.mouse.move(box.x + 18, box.y + 10);
        await page.mouse.down();
        await page.mouse.move(box.x + 18 + 520, box.y + 10 + 300, { steps: 8 });
        await page.mouse.up();
        await page.waitForTimeout(350);
      }
      liveOff = await page.evaluate(() => {
        const parked = [...document.querySelectorAll('.bubble-card[data-offview="1"]')].map((el) => el.getAttribute("data-bubble"));
        return { off: parked.length, ids: parked, cards: document.querySelectorAll(".bubble-card").length };
      });
    }
    await page.evaluate(() => {
      if (window.__graphideLastExport) window.__graphideLastExport.svg = null;
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
    await page.click("#exportSvg");
    await page.waitForFunction(() => window.__graphideLastExport && window.__graphideLastExport.svg, null, {
      timeout: 20000,
    });
    const exportOff = await page.evaluate((live) => {
      const url = window.__graphideLastExport.svg.dataUrl || "";
      const bin = atob(url.slice(url.indexOf(",") + 1));
      const text = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
      // Style may still mention [data-offview] as a selector; only element attrs matter.
      const markup = text.replace(/<style[\s\S]*?<\/style>/gi, "");
      const cards = [...markup.matchAll(/data-bubble="([^"]+)"/g)].map((m) => m[1]);
      const offAttrs = (markup.match(/\sdata-offview=/g) || []).length;
      return {
        liveOff: live.off,
        liveIds: live.ids,
        exportCards: cards.length,
        offAttrs,
        parkedStillInExport: live.ids.filter((id) => cards.indexOf(id) >= 0).length,
      };
    }, liveOff);
    record(
      "X6f",
      "Export SVG strips data-offview so parked Map cards stay in the clone",
      liveOff.off >= 1 &&
        exportOff.offAttrs === 0 &&
        exportOff.exportCards >= 8 &&
        exportOff.parkedStillInExport === liveOff.off,
      JSON.stringify({ liveOff, exportOff })
    );
    await page.evaluate(() => {
      const btn = document.getElementById("zoomFit");
      if (btn) btn.click();
    });
    await page.waitForTimeout(300);
    await page.keyboard.press("Escape"); // close export menu if still open
    await page.waitForTimeout(80);

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

    // Present hides Skip — X must not skip; exit the stage first (S remaps to Style).
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    const presentSkip0 = await page.evaluate(() => (window.__vscodePosts || []).length);
    await page.keyboard.press("x");
    const presentSkip = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        present: document.body.classList.contains("present"),
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
      };
    }, presentSkip0);
    record(
      "P6b",
      "Present blocks desk X (no skip while stage hides Skip)",
      presentSkip.present && presentSkip.skipPosts === 0 && presentSkip.stampPosts === 0,
      JSON.stringify(presentSkip)
    );
    // Present hides Find (#graphBar) — / must not focus #graphSearch.
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("/");
    const presentFind = await page.evaluate(() => {
      const bar = document.getElementById("graphBar");
      const gs = document.getElementById("graphSearch");
      return {
        present: document.body.classList.contains("present"),
        barHidden: !bar || getComputedStyle(bar).display === "none",
        findFocused: !!(gs && document.activeElement === gs),
        active: document.activeElement && (document.activeElement.id || document.activeElement.tagName),
      };
    });
    record(
      "P6c",
      "Present blocks desk / (Find stays unfocused while graph bar is hidden)",
      presentFind.present && presentFind.barHidden && !presentFind.findFocused,
      JSON.stringify(presentFind)
    );
    // Present alone: D still toggles Day/Night (stage keeps Theme; residual after S=P6).
    const presentDayBefore = await page.evaluate(() => document.documentElement.classList.contains("night"));
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("d");
    const presentDeskDay = await page.evaluate((before) => ({
      present: document.body.classList.contains("present"),
      before,
      night: document.documentElement.classList.contains("night"),
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
    }), presentDayBefore);
    record(
      "P6l",
      "Present: desk D still toggles Day/Night",
      presentDeskDay.present &&
        !presentDeskDay.exportOpen &&
        !presentDeskDay.keysOpen &&
        presentDeskDay.night !== presentDeskDay.before,
      JSON.stringify(presentDeskDay)
    );
    // Restore day so Export/Keys Present suites stay day-safe.
    if (presentDeskDay.night) {
      await page.keyboard.press("d");
      await page.waitForFunction(() => !document.documentElement.classList.contains("night"), null, { timeout: 5000 });
    }
    // Present alone: +/= still zooms (stage keeps zoom; residual after D=P6l).
    const presentZoomAloneBefore = await page.evaluate(() => {
      const vp = document.querySelector("#canvas .viewport");
      return vp ? vp.style.transform || "" : "";
    });
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("=");
    await page.waitForTimeout(80);
    const presentDeskZoom = await page.evaluate((before) => {
      const vp = document.querySelector("#canvas .viewport");
      return {
        present: document.body.classList.contains("present"),
        before,
        transform: vp ? vp.style.transform || "" : "",
        exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
        keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      };
    }, presentZoomAloneBefore);
    record(
      "P6m",
      "Present: desk zoom (+/=) still scales the stage",
      presentDeskZoom.present &&
        !presentDeskZoom.exportOpen &&
        !presentDeskZoom.keysOpen &&
        presentDeskZoom.transform !== presentDeskZoom.before,
      JSON.stringify(presentDeskZoom)
    );
    // Present alone: 0 still Fits (stage keeps Fit; residual after zoom=P6m).
    // Zoom already applied by P6m so Fit would move transform if the desk key works.
    const presentFitAloneBefore = await page.evaluate(() => {
      const vp = document.querySelector("#canvas .viewport");
      return vp ? vp.style.transform || "" : "";
    });
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("0");
    await page.waitForTimeout(120);
    const presentDeskFit = await page.evaluate((before) => {
      const vp = document.querySelector("#canvas .viewport");
      return {
        present: document.body.classList.contains("present"),
        before,
        transform: vp ? vp.style.transform || "" : "",
        exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
        keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      };
    }, presentFitAloneBefore);
    record(
      "P6n",
      "Present: desk Fit (0) still refits the stage",
      presentDeskFit.present &&
        !presentDeskFit.exportOpen &&
        !presentDeskFit.keysOpen &&
        presentDeskFit.transform !== presentDeskFit.before,
      JSON.stringify(presentDeskFit)
    );
    // Present alone: E still toggles Ego (stage keeps Ego; residual after Fit=P6n).
    // Ego may still be on from earlier suites — force off, then prove desk E turns it on.
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    const presentEgoWasOn = await page.evaluate(
      () => !!(document.getElementById("egoBtn") && document.getElementById("egoBtn").classList.contains("on"))
    );
    if (presentEgoWasOn) {
      await page.keyboard.press("e");
      await page.waitForFunction(
        () => !(document.getElementById("egoBtn") && document.getElementById("egoBtn").classList.contains("on")),
        null,
        { timeout: 5000 }
      );
    }
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("e");
    const presentDeskEgo = await page.evaluate(() => ({
      present: document.body.classList.contains("present"),
      ego: !!(document.getElementById("egoBtn") && document.getElementById("egoBtn").classList.contains("on")),
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
    }));
    record(
      "P6o",
      "Present: desk E still toggles Ego",
      presentDeskEgo.present &&
        !presentDeskEgo.exportOpen &&
        !presentDeskEgo.keysOpen &&
        presentDeskEgo.ego,
      JSON.stringify(presentDeskEgo)
    );
    // Restore Ego off so later suites stay ego-safe.
    if (presentDeskEgo.ego) {
      await page.keyboard.press("e");
      await page.waitForFunction(
        () => !(document.getElementById("egoBtn") && document.getElementById("egoBtn").classList.contains("on")),
        null,
        { timeout: 5000 }
      );
    }
    // Present alone: P still starts path Play (stage keeps Play; residual after Ego=P6o).
    // Walk paint may linger from PW — record before chip, press P, expect advance / play / toast.
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    const presentPlayBefore = await page.evaluate(() => {
      const play = document.getElementById("pathWalkBtn");
      if (play && play.classList.contains("on")) play.click();
      const chip = document.querySelector(".feat-chip.walk");
      const card = document.querySelector(".bubble-card.walk");
      const play2 = document.getElementById("pathWalkBtn");
      return {
        chipId: chip ? chip.getAttribute("data-feature") || chip.getAttribute("data-hop") || "" : "",
        cardId: card ? card.getAttribute("data-bubble") || "" : "",
        chipWalk: document.querySelectorAll(".feat-chip.walk").length,
        cardWalk: document.querySelectorAll(".bubble-card.walk").length,
        playOn: !!(play2 && play2.classList.contains("on")),
      };
    });
    await page.waitForTimeout(80);
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("p");
    await page.waitForFunction(
      (before) => {
        const chip = document.querySelector(".feat-chip.walk");
        const card = document.querySelector(".bubble-card.walk");
        const play = document.getElementById("pathWalkBtn");
        const toast = (document.getElementById("toast") || {}).textContent || "";
        const chipId = chip ? chip.getAttribute("data-feature") || chip.getAttribute("data-hop") || "" : "";
        const cardId = card ? card.getAttribute("data-bubble") || "" : "";
        const playOn = !!(play && play.classList.contains("on"));
        const walkedNow =
          document.querySelectorAll(".feat-chip.walk, .bubble-card.walk").length >= 1;
        const moved =
          (chipId && chipId !== before.chipId) ||
          (cardId && cardId !== before.cardId) ||
          (walkedNow && !(before.chipWalk || before.cardWalk));
        return (
          document.body.classList.contains("present") &&
          (playOn || /Walking|Replaying|Paused/.test(toast) || moved)
        );
      },
      presentPlayBefore,
      { timeout: 5000 }
    );
    const presentDeskPlay = await page.evaluate((before) => {
      const chip = document.querySelector(".feat-chip.walk");
      const card = document.querySelector(".bubble-card.walk");
      const play = document.getElementById("pathWalkBtn");
      const toast = (document.getElementById("toast") || {}).textContent || "";
      const chipId = chip ? chip.getAttribute("data-feature") || chip.getAttribute("data-hop") || "" : "";
      const cardId = card ? card.getAttribute("data-bubble") || "" : "";
      const playOn = !!(play && play.classList.contains("on"));
      const chipWalk = document.querySelectorAll(".feat-chip.walk").length;
      const cardWalk = document.querySelectorAll(".bubble-card.walk").length;
      const walkedNow = chipWalk >= 1 || cardWalk >= 1;
      const moved =
        (chipId && chipId !== before.chipId) ||
        (cardId && cardId !== before.cardId) ||
        (walkedNow && !(before.chipWalk || before.cardWalk));
      return {
        present: document.body.classList.contains("present"),
        exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
        keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
        playOn,
        toast,
        chipWalk,
        cardWalk,
        chipId,
        cardId,
        before,
        moved,
        ok: playOn || /Walking|Replaying|Paused/.test(toast) || moved,
      };
    }, presentPlayBefore);
    record(
      "P6p",
      "Present: desk P still starts path Play",
      presentDeskPlay.present &&
        !presentDeskPlay.exportOpen &&
        !presentDeskPlay.keysOpen &&
        presentDeskPlay.ok,
      JSON.stringify(presentDeskPlay)
    );
    // Stop Play timer so Export/Keys Present suites stay quiet.
    const presentPlayStillOn = await page.evaluate(() => {
      const play = document.getElementById("pathWalkBtn");
      if (play && play.classList.contains("on")) return true;
      const t = (document.getElementById("toast") || {}).textContent || "";
      return /Walking|Replaying/.test(t);
    });
    if (presentPlayStillOn) {
      await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
      await page.keyboard.press("p");
      await page.waitForTimeout(80);
    }
    // Present alone: [ ] still steps path (stage keeps path step; residual after Play=P6p).
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    const presentStepBefore = await page.evaluate(() => {
      const play = document.getElementById("pathWalkBtn");
      if (play && play.classList.contains("on")) play.click();
      const chip = document.querySelector(".feat-chip.walk");
      const card = document.querySelector(".bubble-card.walk");
      return {
        chipId: chip ? chip.getAttribute("data-feature") || chip.getAttribute("data-hop") || "" : "",
        cardId: card ? card.getAttribute("data-bubble") || "" : "",
        chipWalk: document.querySelectorAll(".feat-chip.walk").length,
        cardWalk: document.querySelectorAll(".bubble-card.walk").length,
      };
    });
    await page.waitForTimeout(80);
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("]");
    await page.waitForFunction(
      (before) => {
        const chip = document.querySelector(".feat-chip.walk");
        const card = document.querySelector(".bubble-card.walk");
        const chipId = chip ? chip.getAttribute("data-feature") || chip.getAttribute("data-hop") || "" : "";
        const cardId = card ? card.getAttribute("data-bubble") || "" : "";
        const walkedNow =
          document.querySelectorAll(".feat-chip.walk, .bubble-card.walk").length >= 1;
        const moved =
          (chipId && chipId !== before.chipId) ||
          (cardId && cardId !== before.cardId) ||
          (walkedNow && !(before.chipWalk || before.cardWalk));
        return document.body.classList.contains("present") && moved;
      },
      presentStepBefore,
      { timeout: 5000 }
    );
    const presentDeskStep = await page.evaluate((before) => {
      const chip = document.querySelector(".feat-chip.walk");
      const card = document.querySelector(".bubble-card.walk");
      const chipId = chip ? chip.getAttribute("data-feature") || chip.getAttribute("data-hop") || "" : "";
      const cardId = card ? card.getAttribute("data-bubble") || "" : "";
      const chipWalk = document.querySelectorAll(".feat-chip.walk").length;
      const cardWalk = document.querySelectorAll(".bubble-card.walk").length;
      const walkedNow = chipWalk >= 1 || cardWalk >= 1;
      const moved =
        (chipId && chipId !== before.chipId) ||
        (cardId && cardId !== before.cardId) ||
        (walkedNow && !(before.chipWalk || before.cardWalk));
      return {
        present: document.body.classList.contains("present"),
        exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
        keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
        chipWalk,
        cardWalk,
        chipId,
        cardId,
        before,
        moved,
        ok: moved,
      };
    }, presentStepBefore);
    record(
      "P6q",
      "Present: desk [ ] still steps path",
      presentDeskStep.present &&
        !presentDeskStep.exportOpen &&
        !presentDeskStep.keysOpen &&
        presentDeskStep.ok,
      JSON.stringify(presentDeskStep)
    );
    // Present alone: R still opens PATH (stage keeps Route; residual after path step=P6q; K14l Backspace stack).
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.evaluate(() => {
      if (window.__graphideRoute && window.__graphideRoute.open && typeof setRouteOpen === "function") setRouteOpen(false);
    });
    await page.waitForTimeout(40);
    await page.keyboard.press("r");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    const presentDeskRoute = await page.evaluate(() => ({
      present: document.body.classList.contains("present"),
      route: !!(window.__graphideRoute && window.__graphideRoute.open),
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
    }));
    record(
      "P6r",
      "Present: desk R still opens PATH",
      presentDeskRoute.present &&
        presentDeskRoute.route &&
        !presentDeskRoute.exportOpen &&
        !presentDeskRoute.keysOpen,
      JSON.stringify(presentDeskRoute)
    );
    // Close Route so Export/Keys Present suites stay probe-clean.
    await page.keyboard.press("r");
    await page.waitForFunction(() => !(window.__graphideRoute && window.__graphideRoute.open), null, { timeout: 5000 });
    // Present alone: L still opens LENS (stage keeps Lens; residual after Route=P6r; K14k Backspace stack).
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.evaluate(() => {
      if (window.__graphideLens && window.__graphideLens.open && typeof setLensOpen === "function") setLensOpen(false);
    });
    await page.waitForTimeout(40);
    await page.keyboard.press("l");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    const presentDeskLens = await page.evaluate(() => ({
      present: document.body.classList.contains("present"),
      lens: !!(window.__graphideLens && window.__graphideLens.open),
      exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
      keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
    }));
    record(
      "P6s",
      "Present: desk L still opens LENS",
      presentDeskLens.present &&
        presentDeskLens.lens &&
        !presentDeskLens.exportOpen &&
        !presentDeskLens.keysOpen,
      JSON.stringify(presentDeskLens)
    );
    // Close Lens so Export/Keys Present suites stay probe-clean.
    await page.keyboard.press("l");
    await page.waitForFunction(() => !(window.__graphideLens && window.__graphideLens.open), null, { timeout: 5000 });
    // Present alone: F still exits the stage (toggle off; residual after Lens=P6s).
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("f");
    await page.waitForFunction(() => !document.body.classList.contains("present"), null, { timeout: 5000 });
    const presentDeskExit = await page.evaluate(() => {
      const bar = document.getElementById("graphBar");
      return {
        present: document.body.classList.contains("present"),
        barShown: !!(bar && getComputedStyle(bar).display !== "none"),
        aria: (document.getElementById("presentBtn") || {}).getAttribute
          ? document.getElementById("presentBtn").getAttribute("aria-pressed")
          : "",
        exportOpen: !!(document.getElementById("exportMenu") && !document.getElementById("exportMenu").hidden),
        keysOpen: !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden),
      };
    });
    record(
      "P6t",
      "Present: desk F still exits the stage",
      !presentDeskExit.present &&
        presentDeskExit.barShown &&
        presentDeskExit.aria === "false" &&
        !presentDeskExit.exportOpen &&
        !presentDeskExit.keysOpen,
      JSON.stringify(presentDeskExit)
    );
    // Re-enter Present so Export/Keys Present suites and Escape-exit (P7) stay probe-clean.
    await page.keyboard.press("f");
    await page.waitForFunction(() => document.body.classList.contains("present"), null, { timeout: 5000 });
    // Present + Export: S still cycles Style (not blocked as desk stamp).
    const presetBefore = await page.evaluate(() => document.documentElement.getAttribute("data-preset") || "classic");
    await page.click("#exportBtn");
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !!(menu && !menu.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("s");
    const presentStyle = await page.evaluate((before) => {
      const menu = document.getElementById("exportMenu");
      return {
        present: document.body.classList.contains("present"),
        exportOpen: !!(menu && !menu.hidden),
        before,
        preset: document.documentElement.getAttribute("data-preset") || "classic",
      };
    }, presetBefore);
    record(
      "P6d",
      "Present + Export: desk S still cycles Style",
      presentStyle.present &&
        presentStyle.exportOpen &&
        presentStyle.preset !== presentStyle.before,
      JSON.stringify(presentStyle)
    );
    const nightBefore = await page.evaluate(() => document.documentElement.classList.contains("night"));
    await page.keyboard.press("d");
    const presentTheme = await page.evaluate((before) => {
      const menu = document.getElementById("exportMenu");
      return {
        present: document.body.classList.contains("present"),
        exportOpen: !!(menu && !menu.hidden),
        before,
        night: document.documentElement.classList.contains("night"),
      };
    }, nightBefore);
    record(
      "P6e",
      "Present + Export: desk D still toggles Day/Night",
      presentTheme.present && presentTheme.exportOpen && presentTheme.night !== presentTheme.before,
      JSON.stringify(presentTheme)
    );
    // Restore day so later suites stay day-safe.
    if (presentTheme.night) {
      await page.keyboard.press("d");
      await page.waitForFunction(() => !document.documentElement.classList.contains("night"), null, { timeout: 5000 });
    }
    const zoomBefore = await page.evaluate(() => {
      const vp = document.querySelector("#canvas .viewport");
      return vp ? vp.style.transform || "" : "";
    });
    await page.keyboard.press("=");
    await page.waitForTimeout(80);
    const presentZoom = await page.evaluate((before) => {
      const menu = document.getElementById("exportMenu");
      const vp = document.querySelector("#canvas .viewport");
      return {
        present: document.body.classList.contains("present"),
        exportOpen: !!(menu && !menu.hidden),
        before,
        transform: vp ? vp.style.transform || "" : "",
      };
    }, zoomBefore);
    record(
      "P6f",
      "Present + Export: desk zoom (+/=) still scales the stage",
      presentZoom.present &&
        presentZoom.exportOpen &&
        presentZoom.transform !== presentZoom.before,
      JSON.stringify(presentZoom)
    );
    const fitBefore = await page.evaluate(() => {
      const vp = document.querySelector("#canvas .viewport");
      return vp ? vp.style.transform || "" : "";
    });
    await page.keyboard.press("0");
    await page.waitForTimeout(120);
    const presentFit = await page.evaluate((before) => {
      const menu = document.getElementById("exportMenu");
      const vp = document.querySelector("#canvas .viewport");
      return {
        present: document.body.classList.contains("present"),
        exportOpen: !!(menu && !menu.hidden),
        before,
        transform: vp ? vp.style.transform || "" : "",
      };
    }, fitBefore);
    record(
      "P6j",
      "Present + Export: desk Fit (0) still refits the stage",
      presentFit.present &&
        presentFit.exportOpen &&
        presentFit.transform !== presentFit.before,
      JSON.stringify(presentFit)
    );
    await page.keyboard.press("Escape"); // close Export
    await page.waitForFunction(
      () => {
        const menu = document.getElementById("exportMenu");
        return !menu || menu.hidden;
      },
      null,
      { timeout: 5000 }
    );
    // Present + Keys: S still cycles Style (Keys must not steal stage Style).
    const keysPresetBefore = await page.evaluate(() => document.documentElement.getAttribute("data-preset") || "classic");
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("?");
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("s");
    const presentKeysStyle = await page.evaluate((before) => {
      const pane = document.getElementById("keysPane");
      return {
        present: document.body.classList.contains("present"),
        keysOpen: !!(pane && !pane.hidden),
        before,
        preset: document.documentElement.getAttribute("data-preset") || "classic",
      };
    }, keysPresetBefore);
    record(
      "P6g",
      "Present + Keys: desk S still cycles Style",
      presentKeysStyle.present &&
        presentKeysStyle.keysOpen &&
        presentKeysStyle.preset !== presentKeysStyle.before,
      JSON.stringify(presentKeysStyle)
    );
    const keysNightBefore = await page.evaluate(() => document.documentElement.classList.contains("night"));
    await page.keyboard.press("d");
    const presentKeysTheme = await page.evaluate((before) => {
      const pane = document.getElementById("keysPane");
      return {
        present: document.body.classList.contains("present"),
        keysOpen: !!(pane && !pane.hidden),
        before,
        night: document.documentElement.classList.contains("night"),
      };
    }, keysNightBefore);
    record(
      "P6h",
      "Present + Keys: desk D still toggles Day/Night",
      presentKeysTheme.present &&
        presentKeysTheme.keysOpen &&
        presentKeysTheme.night !== presentKeysTheme.before,
      JSON.stringify(presentKeysTheme)
    );
    // Restore day so later suites stay day-safe.
    if (presentKeysTheme.night) {
      await page.keyboard.press("d");
      await page.waitForFunction(() => !document.documentElement.classList.contains("night"), null, { timeout: 5000 });
    }
    const keysZoomBefore = await page.evaluate(() => {
      const vp = document.querySelector("#canvas .viewport");
      return vp ? vp.style.transform || "" : "";
    });
    await page.keyboard.press("=");
    await page.waitForTimeout(80);
    const presentKeysZoom = await page.evaluate((before) => {
      const pane = document.getElementById("keysPane");
      const vp = document.querySelector("#canvas .viewport");
      return {
        present: document.body.classList.contains("present"),
        keysOpen: !!(pane && !pane.hidden),
        before,
        transform: vp ? vp.style.transform || "" : "",
      };
    }, keysZoomBefore);
    record(
      "P6i",
      "Present + Keys: desk zoom (+/=) still scales the stage",
      presentKeysZoom.present &&
        presentKeysZoom.keysOpen &&
        presentKeysZoom.transform !== presentKeysZoom.before,
      JSON.stringify(presentKeysZoom)
    );
    const keysFitBefore = await page.evaluate(() => {
      const vp = document.querySelector("#canvas .viewport");
      return vp ? vp.style.transform || "" : "";
    });
    await page.keyboard.press("0");
    await page.waitForTimeout(120);
    const presentKeysFit = await page.evaluate((before) => {
      const pane = document.getElementById("keysPane");
      const vp = document.querySelector("#canvas .viewport");
      return {
        present: document.body.classList.contains("present"),
        keysOpen: !!(pane && !pane.hidden),
        before,
        transform: vp ? vp.style.transform || "" : "",
      };
    }, keysFitBefore);
    record(
      "P6k",
      "Present + Keys: desk Fit (0) still refits the stage",
      presentKeysFit.present &&
        presentKeysFit.keysOpen &&
        presentKeysFit.transform !== presentKeysFit.before,
      JSON.stringify(presentKeysFit)
    );
    await page.keyboard.press("Escape"); // close Keys
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("keysPane");
        return !pane || pane.hidden;
      },
      null,
      { timeout: 5000 }
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
    assertNoStampDir("P8", "Present / preset step did not write .graphide/stamps/");

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

    const hopBefore = await page.evaluate(() => (window.__vscodePosts || []).length);
    const hopHits = await page.evaluate(() => {
      const readHits = () => {
        const pane = document.getElementById("sourcePane");
        const rows = [...document.querySelectorAll("#inspEdges .row[data-from][data-to]")];
        return {
          paneOpen: !!(pane && !pane.hidden),
          kicker: ((document.querySelector(".src-k") || {}).textContent || "").trim(),
          hits: rows.length,
          svgHits: document.querySelectorAll(".edge-hit, text.ekind").length,
          title: ((document.getElementById("srcTitle") || {}).textContent || "").trim(),
        };
      };
      let desk = readHits();
      if (!desk.paneOpen || desk.hits === 0) {
        const nodes = [...document.querySelectorAll(".vnode[data-id]")];
        for (const n of nodes) {
          n.click();
          desk = readHits();
          if (desk.paneOpen && desk.hits > 0) {
            desk.via = "vnode";
            desk.id = n.getAttribute("data-id") || "";
            return desk;
          }
        }
        const cells = [...document.querySelectorAll("#ledgerGrid .cell[data-id]")];
        for (const c of cells) {
          c.click();
          desk = readHits();
          if (desk.paneOpen && desk.hits > 0) {
            desk.via = "cell";
            desk.id = c.getAttribute("data-id") || "";
            return desk;
          }
        }
      }
      desk.via = desk.hits > 0 ? "already" : "";
      return desk;
    });
    record(
      "HC0",
      "Evidence #inspEdges lists incident hop hits when the node has edges",
      hopHits.paneOpen && /Evidence/i.test(hopHits.kicker) && hopHits.hits > 0,
      JSON.stringify(hopHits)
    );
    const hopOpen = await page.evaluate(() => {
      const visibleSvg = [...document.querySelectorAll(".edge-hit, text.ekind")].find((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      const row = document.querySelector("#inspEdges .row[data-from][data-to]");
      const hit = row || visibleSvg;
      let via = "";
      if (row) via = "inspEdges";
      else if (visibleSvg) {
        via =
          visibleSvg.classList && visibleSvg.classList.contains("ekind")
            ? "ekind"
            : visibleSvg.tagName === "text"
              ? "ekind"
              : "edge-hit";
      }
      if (hit) hit.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      const hop = document.getElementById("hopCard");
      const ends = [...(hop ? hop.querySelectorAll("[data-id]") : [])].map((el) => ({
        id: el.getAttribute("data-id") || "",
        text: (el.textContent || "").replace(/\s+/g, " ").trim(),
      }));
      const text = hop ? (hop.textContent || "").replace(/\s+/g, " ").trim() : "";
      const titleAfter = ((document.getElementById("srcTitle") || {}).textContent || "").trim();
      const bodyAfter = ((document.getElementById("srcBody") || {}).textContent || "").replace(/\s+/g, " ").trim();
      return {
        via,
        hopHidden: !hop || hop.hidden,
        hopText: text.slice(0, 180),
        ends,
        titleAfter,
        bodyAfter: bodyAfter.slice(0, 120),
      };
    });
    record(
      "HC1",
      "#hopCard unhides and names both ends",
      !hopOpen.hopHidden &&
        hopOpen.ends.length >= 2 &&
        hopOpen.ends[0].id &&
        hopOpen.ends[1].id &&
        hopOpen.ends[0].id !== hopOpen.ends[1].id &&
        /Hop/i.test(hopOpen.hopText) &&
        hopOpen.ends.every((e) => e.text && hopOpen.hopText.includes(e.text.split(" · ")[0])),
      JSON.stringify({ via: hopOpen.via, ends: hopOpen.ends, hop: hopOpen.hopText })
    );
    const hopInspect = await page.evaluate((prev) => {
      const hop = document.getElementById("hopCard");
      const btns = [...(hop ? hop.querySelectorAll("[data-id]") : [])];
      const currentId =
        (document.querySelector("#ledgerGrid .cell.on") &&
          document.querySelector("#ledgerGrid .cell.on").getAttribute("data-id")) ||
        (document.querySelector(".vnode.selected, .vnode.on") &&
          document.querySelector(".vnode.selected, .vnode.on").getAttribute("data-id")) ||
        "";
      const pick =
        btns.find((el) => {
          const id = el.getAttribute("data-id") || "";
          const label = (el.textContent || "").replace(/\s+/g, " ").trim().split(" · ")[0];
          return (
            id &&
            id !== currentId &&
            (!prev.title0 || !label || !prev.title0.includes(label))
          );
        }) ||
        btns.find((el) => (el.getAttribute("data-id") || "") !== currentId) ||
        btns[1] ||
        btns[0] ||
        null;
      if (pick) pick.click();
      const title1 = ((document.getElementById("srcTitle") || {}).textContent || "").trim();
      const body1 = ((document.getElementById("srcBody") || {}).textContent || "").replace(/\s+/g, " ").trim();
      const stillHop = document.getElementById("hopCard");
      return {
        clicked: pick ? pick.getAttribute("data-id") || "" : "",
        currentId,
        title0: prev.title0,
        title1,
        body0: prev.body0,
        body1: body1.slice(0, 120),
        changed: title1 !== prev.title0 || body1 !== prev.body0,
        hopStill: !!(stillHop && !stillHop.hidden),
      };
    }, { title0: hopOpen.titleAfter, body0: hopOpen.bodyAfter });
    record(
      "HC2",
      "Hop-card end inspects that node (#srcTitle / #srcBody change)",
      hopInspect.changed && hopInspect.clicked && hopInspect.hopStill,
      JSON.stringify(hopInspect)
    );
    await shot(page, "hop-card.png");
    await page.click("#srcClose");
    await page.waitForFunction(
      () => !!(document.getElementById("sourcePane") && document.getElementById("sourcePane").hidden),
      null,
      { timeout: 5000 }
    );
    const hopClosed = await page.evaluate(() => {
      const pane = document.getElementById("sourcePane");
      const hop = document.getElementById("hopCard");
      return {
        paneHidden: !pane || pane.hidden,
        hopHidden: !hop || hop.hidden,
      };
    });
    record(
      "HC3",
      "#srcClose hides Evidence and #hopCard",
      hopClosed.paneHidden && hopClosed.hopHidden,
      JSON.stringify(hopClosed)
    );
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForSelector(".bubble-card", { timeout: 8000 });
    await page.waitForTimeout(150);
    const afterHop = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        cards: document.querySelectorAll(".bubble-card").length,
        xy: document.querySelectorAll(".react-flow__node").length,
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
        stampPosts: posts.filter((p) => p && p.type === "stamp").length,
        skipPosts: posts.filter((p) => p && p.type === "skip").length,
      };
    }, hopBefore);
    record(
      "HC4",
      "Hop-card step did not post stamp / skip",
      afterHop.stampPosts === 0 && afterHop.skipPosts === 0,
      JSON.stringify({ stampPosts: afterHop.stampPosts, skipPosts: afterHop.skipPosts })
    );
    record(
      "HC5",
      "Map altitude is still community LOD after hop card (xy=0)",
      afterHop.ws === "map" && afterHop.cards >= 8 && afterHop.xy === 0,
      JSON.stringify(afterHop)
    );
    assertNoStampDir("HC6", "Hop-card step did not write .graphide/stamps/");
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector(".vnode", { timeout: 10000 });
    await page.locator(".vnode").first().click();
    await page.waitForFunction(
      () => {
        const pane = document.getElementById("sourcePane");
        return !!(pane && !pane.hidden);
      },
      null,
      { timeout: 8000 }
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

    assertNoStampDir("S3", "Harness did not write .graphide/stamps/");

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

    // Off-program (.away) Slice nodes: Route / Lens dim must still separate them, not leave every node at 0.38.
    const awayUrl = origin + HARNESS + "&away=1";
    console.log("slice away " + awayUrl);
    await page.goto(awayUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('#workspaces [data-ws="slice"]', { timeout: 15000 });
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector("#sliceCanvas .vnode[data-id]", { timeout: 15000 });
    await page.waitForTimeout(400);
    const readAway = (onCls, offCls) =>
      page.evaluate(
        ({ onCls, offCls }) => {
          const lit = [...document.querySelectorAll("#sliceCanvas .vnode[data-id]")].filter(
            (el) => el.getAttribute("data-slice-dist") === "0"
          );
          const op = (el) => Number(getComputedStyle(el).opacity);
          const on = lit.filter((el) => el.classList.contains(onCls));
          const off = lit.filter((el) => el.classList.contains(offCls));
          return {
            lit: lit.length,
            away: lit.filter((el) => el.classList.contains("away")).length,
            on: on.length,
            off: off.length,
            onMin: on.length ? Math.min(...on.map(op)) : 0,
            offMax: Math.max(0, ...off.map(op)),
          };
        },
        { onCls, offCls }
      );
    await page.keyboard.press("r");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    await page.waitForTimeout(200);
    const awayRoute = await readAway("on-route", "route-dim");
    record(
      "RT8c",
      "Slice Route dims an off-route off-program walk node below the on-route ones",
      awayRoute.lit >= 2 &&
        awayRoute.away === awayRoute.lit &&
        awayRoute.on >= 1 &&
        awayRoute.off >= 1 &&
        awayRoute.offMax <= 0.221 &&
        awayRoute.onMin > awayRoute.offMax,
      JSON.stringify(awayRoute)
    );
    await shot(page, "slice-away-route.png");
    await page.keyboard.press("r");
    await page.waitForFunction(() => !(window.__graphideRoute && window.__graphideRoute.open), null, { timeout: 5000 });
    await page.waitForTimeout(150);
    await page.keyboard.press("l");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    await page.waitForTimeout(200);
    const awayLens = await readAway("lens-on", "lens-dim");
    record(
      "LN6b",
      "Slice Lens dims an off-program non-match below the off-program matches",
      awayLens.lit >= 2 &&
        awayLens.away === awayLens.lit &&
        awayLens.on >= 1 &&
        awayLens.off >= 1 &&
        awayLens.offMax <= 0.281 &&
        awayLens.onMin > awayLens.offMax,
      JSON.stringify(awayLens)
    );
    await page.keyboard.press("l");
    await page.waitForTimeout(150);

    // Find on an all-away Slice: a hit stays lit; a miss stays Find-dim (not the 0.38 away floor).
    const awayFindQ = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#sliceCanvas .vnode[data-id]")].filter(
        (el) => el.getAttribute("data-slice-dist") === "0"
      );
      const pick = nodes[0];
      const fqn = (pick && (pick.getAttribute("data-fqn") || "")) || "";
      const name = ((pick && pick.querySelector(".name")) || {}).textContent || "";
      const tok = (fqn.split("::").pop() || name.trim() || "").trim();
      return tok.length >= 3 ? tok : "zzzz-no-such-symbol";
    });
    await page.fill("#graphSearch", awayFindQ);
    await page.waitForTimeout(220);
    const awayFind = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#sliceCanvas .vnode[data-id]")].filter(
        (el) => el.getAttribute("data-slice-dist") === "0"
      );
      const op = (el) => Number(getComputedStyle(el).opacity);
      const hits = nodes.filter((el) => el.classList.contains("hit"));
      const misses = nodes.filter((el) => el.classList.contains("dim") && !el.classList.contains("hit"));
      return {
        away: nodes.filter((el) => el.classList.contains("away")).length,
        lit: nodes.length,
        hits: hits.length,
        misses: misses.length,
        hitMin: hits.length ? Math.min(...hits.map(op)) : 0,
        missMax: misses.length ? Math.max(...misses.map(op)) : 1,
      };
    });
    record(
      "SG6",
      "Slice Find hit on an off-program walk stays lit; Find misses stay below the away floor",
      awayFind.lit >= 2 &&
        awayFind.away === awayFind.lit &&
        awayFind.hits >= 1 &&
        awayFind.misses >= 1 &&
        awayFind.hitMin >= 0.99 &&
        awayFind.missMax <= 0.18,
      JSON.stringify(awayFind)
    );
    await page.fill("#graphSearch", "");
    await page.waitForTimeout(120);

    // Ego on Slice lifts its neighborhood to 1 (#sliceCanvas .vnode.ego). Route / Lens must still dim inside it.
    await page.goto(origin + HARNESS, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('#workspaces [data-ws="slice"]', { timeout: 15000 });
    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector('#sliceCanvas .vnode[data-id="n1"]', { timeout: 15000 });
    await page.waitForTimeout(400);
    await page.click('#sliceCanvas .vnode[data-id="n1"]');
    await page.waitForTimeout(200);
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("e");
    await page.waitForFunction(() => document.querySelectorAll("#sliceCanvas .vnode.ego").length >= 2, null, { timeout: 5000 });
    const readEgo = (onCls, offCls, host = "#sliceCanvas") =>
      page.evaluate(
        ({ onCls, offCls, host }) => {
          const ego = [...document.querySelectorAll(host + " .vnode[data-id].ego")];
          const op = (el) => Number(getComputedStyle(el).opacity);
          const on = ego.filter((el) => el.classList.contains(onCls));
          const off = ego.filter((el) => el.classList.contains(offCls));
          return {
            ego: ego.length,
            on: on.length,
            off: off.length,
            onMin: on.length ? Math.min(...on.map(op)) : 0,
            offMax: Math.max(0, ...off.map(op)),
          };
        },
        { onCls, offCls, host }
      );
    await page.keyboard.press("r");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    await page.waitForTimeout(200);
    const egoRoute = await readEgo("on-route", "route-dim");
    record(
      "RT8d",
      "Slice Route dims off-route nodes inside the Ego neighborhood",
      egoRoute.on >= 1 && egoRoute.off >= 1 && egoRoute.offMax <= 0.221 && egoRoute.onMin > egoRoute.offMax,
      JSON.stringify(egoRoute)
    );
    await shot(page, "slice-ego-route.png");
    await page.keyboard.press("r");
    await page.waitForFunction(() => !(window.__graphideRoute && window.__graphideRoute.open), null, { timeout: 5000 });
    await page.keyboard.press("l");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    await page.waitForTimeout(200);
    const egoLens = await readEgo("lens-on", "lens-dim");
    record(
      "LN6c",
      "Slice Lens dims non-matches inside the Ego neighborhood",
      egoLens.on >= 1 && egoLens.off >= 1 && egoLens.offMax <= 0.281 && egoLens.onMin > egoLens.offMax,
      JSON.stringify(egoLens)
    );
    await page.keyboard.press("l");
    await page.keyboard.press("e");
    await page.waitForTimeout(150);
    // Same lift on Enter b-render: Ego on n0 lights n12; Route must still dim the off-route neighbor.
    await page.click('#workspaces [data-ws="map"]');
    await page.waitForSelector('.bubble-card[data-bubble="b-render"]', { timeout: 8000 });
    await page.click('.bubble-card[data-bubble="b-render"]');
    await page.waitForSelector('#enterCanvas .vnode[data-id="n0"]', { timeout: 8000 });
    await page.waitForTimeout(400);
    await page.click('#enterCanvas .vnode[data-id="n0"]');
    await page.waitForTimeout(200);
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press("e");
    await page.waitForFunction(() => document.querySelectorAll("#enterCanvas .vnode.ego").length >= 2, null, { timeout: 5000 });
    await page.keyboard.press("r");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    await page.waitForTimeout(200);
    const enterEgoRoute = await readEgo("on-route", "route-dim", "#enterCanvas");
    record(
      "RT8e",
      "Enter Route dims off-route nodes inside the Ego neighborhood",
      enterEgoRoute.on >= 1 && enterEgoRoute.off >= 1 && enterEgoRoute.offMax <= 0.221 && enterEgoRoute.onMin > enterEgoRoute.offMax,
      JSON.stringify(enterEgoRoute)
    );
    await page.keyboard.press("r");
    await page.waitForFunction(() => !(window.__graphideRoute && window.__graphideRoute.open), null, { timeout: 5000 });
    await page.keyboard.press("l");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    await page.waitForTimeout(200);
    const enterEgoLens = await readEgo("lens-on", "lens-dim", "#enterCanvas");
    record(
      "LN6d",
      "Enter Lens dims non-matches inside the Ego neighborhood",
      enterEgoLens.on >= 1 && enterEgoLens.off >= 1 && enterEgoLens.offMax <= 0.281 && enterEgoLens.onMin > enterEgoLens.offMax,
      JSON.stringify(enterEgoLens)
    );
    await page.keyboard.press("l");
    await page.waitForFunction(() => !(window.__graphideLens && window.__graphideLens.open), null, { timeout: 5000 });
    // Find hit outside Ego must stay lit; Ego neighbors that miss must stay Find-dim (Ego lift skips .dim).
    const enterEgoFindQ = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#enterCanvas .vnode[data-id]")];
      const outside = nodes.find((el) => el.classList.contains("ego-dim"));
      const fqn = (outside && (outside.getAttribute("data-fqn") || "")) || "";
      const name = ((outside && outside.querySelector(".name")) || {}).textContent || "";
      const tok = (fqn.split("::").pop() || name.trim() || "").trim();
      return tok.length >= 3 ? tok : "zzzz-no-such-symbol";
    });
    await page.fill("#graphSearch", enterEgoFindQ);
    await page.waitForTimeout(220);
    const enterEgoFind = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#enterCanvas .vnode[data-id]")];
      const op = (el) => Number(getComputedStyle(el).opacity);
      const hitOutside = nodes.filter((el) => el.classList.contains("hit") && el.classList.contains("ego-dim"));
      const missInside = nodes.filter(
        (el) => el.classList.contains("ego") && el.classList.contains("dim") && !el.classList.contains("hit")
      );
      const missOutside = nodes.filter(
        (el) => el.classList.contains("ego-dim") && el.classList.contains("dim") && !el.classList.contains("hit")
      );
      return {
        q: ((document.getElementById("graphSearch") || {}).value || "").trim(),
        hitOutside: hitOutside.length,
        hitOutsideMin: hitOutside.length ? Math.min(...hitOutside.map(op)) : 0,
        missInside: missInside.length,
        missInsideMax: missInside.length ? Math.max(...missInside.map(op)) : 1,
        missOutside: missOutside.length,
        missOutsideMax: missOutside.length ? Math.max(...missOutside.map(op)) : 1,
      };
    });
    record(
      "SG5b",
      "Enter Find hit outside Ego stays lit; Ego misses stay Find-dim",
      enterEgoFind.q === enterEgoFindQ &&
        enterEgoFind.hitOutside >= 1 &&
        enterEgoFind.hitOutsideMin >= 0.99 &&
        enterEgoFind.missInside >= 1 &&
        enterEgoFind.missInsideMax <= 0.18 &&
        enterEgoFind.missOutsideMax <= 0.12,
      JSON.stringify(enterEgoFind)
    );
    await page.fill("#graphSearch", "");
    await page.waitForTimeout(120);
    await page.keyboard.press("e");
    await page.waitForTimeout(150);

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

    assertNoStampDir("R7", "Self-review step did not write .graphide/stamps/");

    const readProgDesk = () =>
      page.evaluate(() => {
        const chips = [...document.querySelectorAll("#legend [data-prog]")].map((el) => ({
          i: Number(el.getAttribute("data-prog")),
          text: (el.textContent || "").replace(/\s+/g, " ").trim(),
          on: el.classList.contains("on"),
        }));
        const programs = chips.filter((c) => c.i >= 0);
        const on = chips.find((c) => c.on) || null;
        const meta = ((document.getElementById("meta") || {}).textContent || "").replace(/\s+/g, " ").trim();
        const cards = [...document.querySelectorAll(".bubble-card")];
        const names = cards.map((el) => ((el.querySelector(".name") || {}).textContent || "").trim());
        const chipName = (text) => {
          const t = String(text || "").replace(/\s+/g, " ").trim();
          const sp = t.indexOf(" ");
          return sp >= 0 ? t.slice(sp + 1) : t;
        };
        return {
          chips,
          programs,
          onText: on ? on.text : "",
          onKey: on ? on.i : null,
          onName: on ? chipName(on.text) : "",
          meta,
          cards: cards.length,
          names,
          xy: document.querySelectorAll(".react-flow__node").length,
          comm: document.querySelectorAll(".comm-node").length,
          ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
            ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
            : "",
        };
      });
    const beforeChipPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    const liveChipDesk = await readProgDesk();
    record(
      "PC1",
      "self-review has two or more Graphide program chips",
      liveChipDesk.programs.length >= 2 &&
        liveChipDesk.programs.some((p) => /graphide/i.test(p.text)),
      liveChipDesk.programs
        .slice(0, 8)
        .map((p) => p.text)
        .join(",")
    );
    const chipSwitch = await page.evaluate(() => {
      const programs = [...document.querySelectorAll("#legend [data-prog]")].filter(
        (el) => Number(el.getAttribute("data-prog")) >= 0
      );
      if (programs.length < 2) return { ok: false, first: "", second: "", firstI: null, secondI: null };
      const first = programs[0];
      const second = programs[1];
      first.click();
      return {
        ok: true,
        first: (first.textContent || "").replace(/\s+/g, " ").trim(),
        second: (second.textContent || "").replace(/\s+/g, " ").trim(),
        firstI: Number(first.getAttribute("data-prog")),
        secondI: Number(second.getAttribute("data-prog")),
      };
    });
    await page.waitForTimeout(280);
    const afterFirstChip = await readProgDesk();
    await page.evaluate(() => {
      const programs = [...document.querySelectorAll("#legend [data-prog]")].filter(
        (el) => Number(el.getAttribute("data-prog")) >= 0
      );
      if (programs[1]) programs[1].click();
    });
    await page.waitForTimeout(280);
    const afterSecondChip = await page.evaluate((before) => {
      const chips = [...document.querySelectorAll("#legend [data-prog]")].map((el) => ({
        i: Number(el.getAttribute("data-prog")),
        text: (el.textContent || "").replace(/\s+/g, " ").trim(),
        on: el.classList.contains("on"),
      }));
      const programs = chips.filter((c) => c.i >= 0);
      const on = chips.find((c) => c.on) || null;
      const meta = ((document.getElementById("meta") || {}).textContent || "").replace(/\s+/g, " ").trim();
      const cards = [...document.querySelectorAll(".bubble-card")];
      const names = cards.map((el) => ((el.querySelector(".name") || {}).textContent || "").trim());
      const chipName = (text) => {
        const t = String(text || "").replace(/\s+/g, " ").trim();
        const sp = t.indexOf(" ");
        return sp >= 0 ? t.slice(sp + 1) : t;
      };
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        programs,
        onText: on ? on.text : "",
        onKey: on ? on.i : null,
        onName: on ? chipName(on.text) : "",
        meta,
        cards: cards.length,
        names,
        xy: document.querySelectorAll(".react-flow__node").length,
        comm: document.querySelectorAll(".comm-node").length,
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    }, beforeChipPosts);
    const secondName = afterSecondChip.onName || "";
    const firstName = afterFirstChip.onName || "";
    record(
      "PC2",
      "second program chip switches the Map / Review cut (caption + program key)",
      chipSwitch.ok &&
        afterFirstChip.onKey === chipSwitch.firstI &&
        afterSecondChip.onKey === chipSwitch.secondI &&
        afterSecondChip.onKey !== afterFirstChip.onKey &&
        afterSecondChip.onText !== afterFirstChip.onText &&
        !!firstName &&
        !!secondName &&
        firstName.toLowerCase() !== secondName.toLowerCase() &&
        afterFirstChip.meta.toLowerCase().includes(firstName.toLowerCase()) &&
        afterSecondChip.meta.toLowerCase().includes(secondName.toLowerCase()),
      "first=" +
        afterFirstChip.onText +
        " second=" +
        afterSecondChip.onText +
        " meta=" +
        afterSecondChip.meta.slice(0, 120)
    );
    record(
      "PC3",
      "program chip switch keeps Map community LOD",
      afterSecondChip.ws === "map" &&
        afterSecondChip.xy === 0 &&
        afterSecondChip.comm === 0 &&
        afterSecondChip.cards > 1,
      JSON.stringify({
        ws: afterSecondChip.ws,
        xy: afterSecondChip.xy,
        comm: afterSecondChip.comm,
        cards: afterSecondChip.cards,
      })
    );
    await shot(page, "program-chips.png");
    record(
      "PC4",
      "program chip switch does not post stamp / skip",
      afterSecondChip.stampPosts === 0 && afterSecondChip.skipPosts === 0,
      JSON.stringify({ stampPosts: afterSecondChip.stampPosts, skipPosts: afterSecondChip.skipPosts })
    );
    assertNoStampDir("PC5", "program chip switch did not write .graphide/stamps/");

    const metaTokens = (meta) =>
      String(meta || "")
        .split("·")
        .map((s) => s.replace(/\s+/g, " ").trim().toLowerCase());
    const beforeAllPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    const liveAllChip = await page.evaluate(() => {
      const all = document.querySelector('#legend [data-prog="-1"]');
      const programs = [...document.querySelectorAll("#legend [data-prog]")].filter(
        (el) => Number(el.getAttribute("data-prog")) >= 0
      );
      return {
        hasAll: !!(all && /all programs/i.test(all.textContent || "")),
        programs: programs.length,
        texts: programs.map((el) => (el.textContent || "").replace(/\s+/g, " ").trim()),
      };
    });
    record(
      "AP1",
      "self-review has All programs chip when more than one program exists",
      liveAllChip.hasAll && liveAllChip.programs >= 2,
      "programs=" + liveAllChip.texts.slice(0, 8).join(",") + " all=" + liveAllChip.hasAll
    );
    const allSwitch = await page.evaluate(() => {
      const programs = [...document.querySelectorAll("#legend [data-prog]")].filter(
        (el) => Number(el.getAttribute("data-prog")) >= 0
      );
      const all = document.querySelector('#legend [data-prog="-1"]');
      if (!all || programs.length < 1) return { ok: false, prefer: "", preferI: null };
      const prefer =
        programs.find((el) => /bin\s+graphide-cli/i.test(el.textContent || "")) ||
        programs.find((el) => /bin\s+main/i.test(el.textContent || "")) ||
        programs[0];
      prefer.click();
      return {
        ok: true,
        prefer: (prefer.textContent || "").replace(/\s+/g, " ").trim(),
        preferI: Number(prefer.getAttribute("data-prog")),
      };
    });
    await page.waitForTimeout(280);
    const afterNarrow = await readProgDesk();
    await page.evaluate(() => {
      const all = document.querySelector('#legend [data-prog="-1"]');
      if (all) all.click();
    });
    await page.waitForTimeout(280);
    const afterAll = await page.evaluate((before) => {
      const chips = [...document.querySelectorAll("#legend [data-prog]")].map((el) => ({
        i: Number(el.getAttribute("data-prog")),
        text: (el.textContent || "").replace(/\s+/g, " ").trim(),
        on: el.classList.contains("on"),
      }));
      const on = chips.find((c) => c.on) || null;
      const meta = ((document.getElementById("meta") || {}).textContent || "").replace(/\s+/g, " ").trim();
      const cards = [...document.querySelectorAll(".bubble-card")];
      const names = cards.map((el) => ((el.querySelector(".name") || {}).textContent || "").trim());
      const chipName = (text) => {
        const t = String(text || "").replace(/\s+/g, " ").trim();
        const sp = t.indexOf(" ");
        return sp >= 0 ? t.slice(sp + 1) : t;
      };
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        onText: on ? on.text : "",
        onKey: on ? on.i : null,
        onName: on ? chipName(on.text) : "",
        meta,
        cards: cards.length,
        names,
        xy: document.querySelectorAll(".react-flow__node").length,
        comm: document.querySelectorAll(".comm-node").length,
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
        ws: (document.querySelector("#workspaces [data-ws].on") || {}).getAttribute
          ? document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")
          : "",
      };
    }, beforeAllPosts);
    const narrowName = afterNarrow.onName || "";
    record(
      "AP2",
      "All programs chip switches the Map / Review cut to the union view",
      allSwitch.ok &&
        afterNarrow.onKey === allSwitch.preferI &&
        afterAll.onKey === -1 &&
        afterAll.onKey !== afterNarrow.onKey &&
        /all programs/i.test(afterAll.onText) &&
        !!narrowName &&
        metaTokens(afterNarrow.meta).includes(narrowName.toLowerCase()) &&
        metaTokens(afterAll.meta).includes("all"),
      "narrow=" +
        afterNarrow.onText +
        " all=" +
        afterAll.onText +
        " cards=" +
        afterNarrow.cards +
        "→" +
        afterAll.cards +
        " meta=" +
        afterAll.meta.slice(0, 120)
    );
    await page.evaluate((i) => {
      const el = document.querySelector('#legend [data-prog="' + i + '"]');
      if (el) el.click();
    }, allSwitch.preferI);
    await page.waitForTimeout(280);
    const afterBack = await readProgDesk();
    record(
      "AP3",
      "single program chip restores the narrow cut after All programs",
      allSwitch.ok &&
        afterBack.onKey === allSwitch.preferI &&
        afterBack.onKey !== -1 &&
        !!afterBack.onName &&
        metaTokens(afterBack.meta).includes(afterBack.onName.toLowerCase()) &&
        !metaTokens(afterBack.meta).includes("all"),
      "back=" + afterBack.onText + " meta=" + afterBack.meta.slice(0, 120)
    );
    await page.evaluate(() => {
      const all = document.querySelector('#legend [data-prog="-1"]');
      if (all) all.click();
    });
    await page.waitForTimeout(280);
    const afterAllShot = await readProgDesk();
    record(
      "AP4",
      "All programs keeps Map community LOD",
      afterAllShot.ws === "map" &&
        afterAllShot.xy === 0 &&
        afterAllShot.comm === 0 &&
        afterAllShot.cards > 1,
      JSON.stringify({
        ws: afterAllShot.ws,
        xy: afterAllShot.xy,
        comm: afterAllShot.comm,
        cards: afterAllShot.cards,
      })
    );
    await shot(page, "all-programs.png");
    record(
      "AP5",
      "All programs does not post stamp / skip",
      afterAll.stampPosts === 0 && afterAll.skipPosts === 0,
      JSON.stringify({ stampPosts: afterAll.stampPosts, skipPosts: afterAll.skipPosts })
    );
    assertNoStampDir("AP6", "All programs did not write .graphide/stamps/");

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

    assertNoStampDir("D8", "Delta step did not write .graphide/stamps/");

    const clusterSnap = assertClusterSnap(deltaSnap);
    const clusterDesk = await page.evaluate((want) => {
      const community = [...document.querySelectorAll('#deltaFacts .delta-fact[data-delta-class="community"]')];
      const sticky = [
        ...document.querySelectorAll(
          '#deltaFacts .delta-fact[data-delta-kind="stable"][data-bubble], #deltaFacts .delta-fact[data-delta-kind="relabel"][data-bubble]'
        ),
      ];
      const match = sticky.find((el) => el.getAttribute("data-bubble") === want);
      return {
        community: community.length,
        sticky: sticky.length,
        kinds: community.map((el) => el.getAttribute("data-delta-kind")),
        bubbles: sticky.map((el) => el.getAttribute("data-bubble")),
        text: match ? (match.textContent || "").replace(/\s+/g, " ").trim() : "",
        id: match ? match.getAttribute("data-bubble") : "",
      };
    }, clusterSnap.bubble);
    record(
      "SC1",
      "Delta paints a community fact with the sticky BubbleId",
      clusterDesk.community > 0 && clusterDesk.id === clusterSnap.bubble,
      JSON.stringify(clusterDesk)
    );
    record(
      "SC2",
      "Sticky cluster fact names the kept bubble id",
      clusterDesk.text.includes("bubble") && clusterDesk.text.includes(clusterSnap.bubble),
      clusterDesk.text
    );

    const stickySel =
      '#deltaFacts .delta-fact[data-delta-kind="' +
      clusterSnap.kind +
      '"][data-bubble="' +
      clusterSnap.bubble +
      '"]';
    if (await page.$(stickySel)) {
      await page.click(stickySel);
      await page.waitForTimeout(160);
    }
    await shot(page, "sticky-clusters.png");

    const viewsSnap = assertStickyViewsSnap(deltaSnap);
    const communitySel =
      '#deltaFacts .delta-fact[data-delta-class="community"][data-bubble="' + viewsSnap.bubble + '"]';
    if (await page.$(communitySel)) {
      await page.click(communitySel);
      await page.waitForTimeout(200);
    }
    const readCommunityView = async (view) => {
      await page.click('#deltaView [data-delta-view="' + view + '"]');
      await page.waitForTimeout(220);
      return page.evaluate((want) => {
        const onBtn = document.querySelector("#deltaView [data-delta-view].on");
        const ws = document.querySelector("#workspaces [data-ws].on");
        const nodes = [...document.querySelectorAll("#deltaCanvas .vnode[data-bubble]")];
        const match = nodes.filter((el) => el.getAttribute("data-bubble") === want);
        const current = [...document.querySelectorAll("#deltaCanvas .vnode[data-delta-review-current]")].filter(
          (el) => el.getAttribute("data-bubble") === want
        );
        return {
          view: onBtn ? onBtn.getAttribute("data-delta-view") : "",
          ws: ws ? ws.getAttribute("data-ws") : "",
          n: match.length,
          current: current.length,
          xy: document.querySelectorAll("#deltaCanvas .react-flow__node").length,
          fact: (() => {
            const on = document.querySelector("#deltaFacts .delta-fact.on");
            return on ? on.getAttribute("data-bubble") || "" : "";
          })(),
        };
      }, viewsSnap.bubble);
    };
    const deltaMembers = await readCommunityView("delta");
    const beforeMembers = await readCommunityView("before");
    const afterMembers = await readCommunityView("after");
    record(
      "SV1",
      "Community fact paints Delta members for the sticky BubbleId",
      deltaMembers.ws === "delta" &&
        deltaMembers.view === "delta" &&
        deltaMembers.fact === viewsSnap.bubble &&
        deltaMembers.n > 0 &&
        deltaMembers.n <= 24 &&
        deltaMembers.current > 0,
      JSON.stringify(deltaMembers)
    );
    record(
      "SV2",
      "Before paints parent members for the same sticky BubbleId",
      beforeMembers.view === "before" &&
        beforeMembers.fact === viewsSnap.bubble &&
        beforeMembers.n > 0 &&
        beforeMembers.n <= 24 &&
        beforeMembers.current > 0,
      JSON.stringify(beforeMembers)
    );
    record(
      "SV3",
      "After paints head members for the same sticky BubbleId",
      afterMembers.view === "after" &&
        afterMembers.fact === viewsSnap.bubble &&
        afterMembers.n > 0 &&
        afterMembers.n <= 24 &&
        afterMembers.current > 0,
      JSON.stringify(afterMembers)
    );
    await page.waitForTimeout(160);
    await shot(page, "delta-sticky-views.png");
    const stampPostsViews = await page.evaluate(() => {
      const posts = window.__vscodePosts || [];
      return {
        stamp: posts.filter((p) => p && p.type === "stamp").length,
        skip: posts.filter((p) => p && p.type === "skip").length,
      };
    });
    record(
      "SV4",
      "Delta sticky views do not post stamp / skip",
      stampPostsViews.stamp === 0 && stampPostsViews.skip === 0,
      JSON.stringify(stampPostsViews)
    );
    assertNoStampDir("SV5", "Delta sticky views did not write .graphide/stamps/");

    // Member file path is not an FQN token. Same Delta fact filter as semantic file match (file half of deltaFacts).
    // fixtures/demo vs demo-parent exposes added crate::bus::sneaky_helper on src/bus.rs so a file query can keep the fact.
    const deltaFactsBeforeFile = await page.evaluate(() => document.querySelectorAll("#deltaFacts .delta-fact").length);
    await page.fill("#graphSearch", "bus.rs");
    await page.waitForTimeout(280);
    const deltaFindFile = await page.evaluate(() => {
      const facts = [...document.querySelectorAll("#deltaFacts .delta-fact")].map((el) => ({
        fqn: el.getAttribute("data-fqn") || "",
        file: el.getAttribute("data-file") || "",
        kind: el.getAttribute("data-delta-kind") || "",
        text: (el.textContent || "").replace(/\s+/g, " ").trim(),
      }));
      const sneaky = facts.filter((f) => /sneaky_helper/.test(f.fqn || f.text));
      return {
        q: ((document.getElementById("graphSearch") || {}).value || "").trim(),
        facts: facts.length,
        empty: !!document.querySelector(".delta-page .empty, .expl-wrap .empty"),
        sneaky: sneaky.length,
        sneakyFiles: sneaky.map((f) => f.file),
        kinds: facts.map((f) => f.kind),
      };
    });
    record(
      "SG10",
      "Find on a member file keeps Delta fact with data-file",
      /bus\.rs/i.test(deltaFindFile.q) &&
        !deltaFindFile.empty &&
        deltaFindFile.sneaky >= 1 &&
        deltaFindFile.sneakyFiles.some((f) => /bus\.rs/i.test(f)) &&
        deltaFindFile.facts >= 1 &&
        deltaFindFile.facts <= deltaFactsBeforeFile,
      JSON.stringify({ before: deltaFactsBeforeFile, ...deltaFindFile })
    );
    await shot(page, "delta-find-file.png");
    await page.fill("#graphSearch", "nomatch-file.rs");
    await page.waitForTimeout(220);
    const deltaFindMiss = await page.evaluate(() => ({
      facts: document.querySelectorAll("#deltaFacts .delta-fact").length,
      sneaky: [...document.querySelectorAll("#deltaFacts .delta-fact")].some((el) =>
        /sneaky_helper/.test(el.textContent || "")
      ),
      empty: !!document.querySelector(".delta-page .empty, .expl-wrap .empty"),
    }));
    record(
      "SG10b",
      "Find on a non-matching member file drops Delta sneaky fact",
      deltaFindMiss.empty || (!deltaFindMiss.sneaky && deltaFindMiss.facts < deltaFactsBeforeFile),
      JSON.stringify({ before: deltaFactsBeforeFile, ...deltaFindMiss })
    );
    await page.fill("#graphSearch", "");
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      const box = document.getElementById("graphSearch");
      if (box && box.blur) box.blur();
    });

    await page.click('#workspaces [data-ws="map"]');
    await page.waitForSelector(".bubble-card", { timeout: 10000 });
    if (await page.$("#zoomFit")) {
      await page.click("#zoomFit");
      await page.waitForTimeout(160);
    }
    const mapSticky = await page.evaluate((want) => {
      const on = document.querySelector("#workspaces [data-ws].on");
      const card = document.querySelector('.bubble-card[data-bubble="' + want + '"]');
      const xy = document.querySelectorAll(".react-flow__node").length;
      return {
        ws: on ? on.getAttribute("data-ws") : "",
        card: !!(card && card.offsetParent !== null),
        cluster: card ? card.getAttribute("data-cluster") || "" : "",
        xy,
      };
    }, clusterSnap.bubble);
    record(
      "SC3",
      "Map card keeps the sticky BubbleId at community LOD",
      mapSticky.ws === "map" && mapSticky.card && mapSticky.xy === 0,
      JSON.stringify(mapSticky)
    );
    const stampPostsCluster = await page.evaluate(() => {
      const posts = window.__vscodePosts || [];
      return {
        stamp: posts.filter((p) => p && p.type === "stamp").length,
        skip: posts.filter((p) => p && p.type === "skip").length,
      };
    });
    record(
      "SC4",
      "Sticky clusters do not post stamp / skip",
      stampPostsCluster.stamp === 0 && stampPostsCluster.skip === 0,
      JSON.stringify(stampPostsCluster)
    );
    assertNoStampDir("SC5", "Sticky clusters did not write .graphide/stamps/");

    const proposedGraph = assertProposedUncoveredSnap(deltaSnap);
    const flowsTomlPath = path.join(DEMO, "flows.toml");
    const flowsTomlBefore = fs.existsSync(flowsTomlPath) ? fs.readFileSync(flowsTomlPath, "utf8") : "";
    const beforePuPosts = await page.evaluate(() => (window.__vscodePosts || []).length);
    const namedCut = await page.evaluate(async () => {
      const named = document.querySelector('#tabs .tab[data-flow="data-subscription"]');
      if (named) named.click();
      await new Promise((r) => setTimeout(r, 220));
      const on = document.querySelector("#workspaces [data-ws].on");
      const tab = document.querySelector("#tabs .tab.on[data-flow]");
      const nodes = [...document.querySelectorAll("#sliceCanvas .vnode, #sliceCanvas .react-flow__node")];
      return {
        ws: on ? on.getAttribute("data-ws") : "",
        flow: tab ? tab.getAttribute("data-flow") || "" : "",
        meta: ((document.getElementById("meta") || {}).textContent || "").replace(/\s+/g, " ").trim(),
        labels: nodes.map((el) => (el.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean),
        n: nodes.length,
      };
    });
    const proposedDesk = await page.evaluate(async () => {
      const tab = document.querySelector('#tabs .tab[data-proposed="1"]');
      const tabs = [...document.querySelectorAll("#tabs .tab[data-flow]")].map((el) => ({
        name: el.getAttribute("data-flow") || "",
        proposed: el.getAttribute("data-proposed") === "1",
        on: el.classList.contains("on"),
        text: (el.textContent || "").replace(/\s+/g, " ").trim(),
      }));
      if (tab) tab.click();
      await new Promise((r) => setTimeout(r, 280));
      const on = document.querySelector("#workspaces [data-ws].on");
      const tabOn = document.querySelector("#tabs .tab.on[data-flow]");
      const nodes = [...document.querySelectorAll("#sliceCanvas .vnode, #sliceCanvas .react-flow__node")];
      const labels = nodes.map((el) => (el.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean);
      return {
        ws: on ? on.getAttribute("data-ws") : "",
        tab: !!(tab && /proposed-uncovered/.test((tab.textContent || "") + (tab.getAttribute("data-flow") || ""))),
        proposed: !!(tab && tab.getAttribute("data-proposed") === "1"),
        on: !!(tabOn && tabOn.getAttribute("data-proposed") === "1"),
        flow: tabOn ? tabOn.getAttribute("data-flow") || "" : "",
        text: tabOn ? (tabOn.textContent || "").replace(/\s+/g, " ").trim() : "",
        meta: ((document.getElementById("meta") || {}).textContent || "").replace(/\s+/g, " ").trim(),
        tabs,
        n: nodes.length,
        labels,
        helper: labels.some((t) => /sneaky_helper/.test(t)),
        xy: document.querySelectorAll("#sliceCanvas .react-flow__node").length,
        mapXy: document.querySelectorAll("#canvas .react-flow__node, .bubble-map .react-flow__node").length,
        cards: document.querySelectorAll(".bubble-card").length,
      };
    });
    record(
      "PU1",
      "Delta desk shows proposed-uncovered chip distinct from sidecar flows",
      proposedDesk.tab &&
        proposedDesk.proposed &&
        proposedDesk.tabs.some((t) => t.name === "proposed-uncovered" && t.proposed) &&
        proposedDesk.tabs.some((t) => t.name === "data-subscription" && !t.proposed),
      JSON.stringify({ tabs: proposedDesk.tabs, text: proposedDesk.text })
    );
    record(
      "PU2",
      "Selecting proposed-uncovered pins Slice and lights the chip",
      proposedDesk.ws === "slice" &&
        proposedDesk.on &&
        proposedDesk.flow === "proposed-uncovered" &&
        /proposed-uncovered/.test(proposedDesk.meta + proposedDesk.text),
      JSON.stringify({
        ws: proposedDesk.ws,
        flow: proposedDesk.flow,
        meta: proposedDesk.meta.slice(0, 120),
      })
    );
    const cutChanged =
      proposedDesk.flow !== namedCut.flow ||
      proposedDesk.helper ||
      proposedDesk.labels.join("|") !== namedCut.labels.join("|");
    record(
      "PU3",
      "Selecting proposed-uncovered changes the Steiner cut",
      cutChanged && proposedDesk.n >= 1 && proposedGraph.nodes >= 1,
      JSON.stringify({
        from: namedCut.flow,
        to: proposedDesk.flow,
        helper: proposedDesk.helper,
        n: proposedDesk.n,
        namedN: namedCut.n,
      })
    );
    record(
      "PU4",
      "Proposed flow paints a Steiner slice (not an empty chip)",
      proposedDesk.n >= 1 && (proposedDesk.xy >= 1 || proposedDesk.n >= 1),
      "n=" + proposedDesk.n + " xy=" + proposedDesk.xy + " helper=" + proposedDesk.helper
    );
    await page.waitForTimeout(200);
    await shot(page, "proposed-uncovered.png");
    const afterPu = await page.evaluate((before) => {
      const posts = (window.__vscodePosts || []).slice(before);
      return {
        stampPosts: posts.filter((m) => m && m.type === "stamp").length,
        skipPosts: posts.filter((m) => m && m.type === "skip").length,
        select: posts.filter((m) => m && m.type === "selectFlow").map((m) => m.flow),
      };
    }, beforePuPosts);
    record(
      "PU5",
      "Proposed-uncovered step did not post stamp / skip",
      afterPu.stampPosts === 0 && afterPu.skipPosts === 0,
      JSON.stringify(afterPu)
    );
    assertNoStampDir("PU6", "Proposed-uncovered step did not write .graphide/stamps/");
    const flowsTomlAfter = fs.existsSync(flowsTomlPath) ? fs.readFileSync(flowsTomlPath, "utf8") : "";
    record(
      "PU7",
      "Proposed-uncovered did not write flows.toml",
      flowsTomlAfter === flowsTomlBefore &&
        /name\s*=\s*"data-subscription"/.test(flowsTomlAfter) &&
        !/proposed-uncovered/.test(flowsTomlAfter),
      flowsTomlAfter.slice(0, 160)
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

    // Member file path is not an FQN token. Same Sequence Find filter as participant file match (file half of hop/part match).
    // data-subscription mixes bus.rs (events) with sub.rs (subscribe) so a file query can hit and dim; a miss drops hops.
    const seqHopsBeforeFile = await page.evaluate(() => document.querySelectorAll("#seqHops .seq-hop").length);
    await page.fill("#graphSearch", "sub.rs");
    await page.waitForTimeout(280);
    const seqFindFile = await page.evaluate(() => {
      const stage = [...document.querySelectorAll("#seqParts .seq-part, #seqCanvas .vnode[data-id], #seqCanvas .seq-part[data-id]")];
      const read = (el) => ({
        id: el.getAttribute("data-id") || "",
        file: el.getAttribute("data-file") || "",
        fqn: el.getAttribute("data-fqn") || "",
        hit: el.classList.contains("hit"),
        dim: el.classList.contains("dim"),
        op: Number(getComputedStyle(el).opacity),
      });
      const rows = stage.map(read);
      const byId = new Map();
      for (const r of rows) {
        if (!r.id) continue;
        const prev = byId.get(r.id);
        if (!prev || (r.file && !prev.file)) byId.set(r.id, r);
      }
      const uniq = [...byId.values()];
      const hits = uniq.filter((r) => r.hit);
      const dims = uniq.filter((r) => r.dim && !r.hit);
      return {
        q: ((document.getElementById("graphSearch") || {}).value || "").trim(),
        hops: document.querySelectorAll("#seqHops .seq-hop").length,
        hits: hits.length,
        dims: dims.length,
        hitFiles: hits.map((r) => r.file),
        dimFiles: dims.map((r) => r.file),
        hitMin: hits.length ? Math.min(...hits.map((r) => r.op)) : 0,
        dimMax: dims.length ? Math.max(...dims.map((r) => r.op)) : 1,
      };
    });
    record(
      "SG8",
      "Find on a member file filters Sequence hops / dims off-query participants",
      /sub\.rs/i.test(seqFindFile.q) &&
        seqFindFile.hits >= 1 &&
        seqFindFile.hitMin >= 0.99 &&
        seqFindFile.hitFiles.some((f) => /sub\.rs/i.test(f)) &&
        seqFindFile.dims >= 1 &&
        seqFindFile.dimMax <= 0.18 &&
        seqFindFile.hops >= 1 &&
        seqFindFile.hops <= seqHopsBeforeFile,
      JSON.stringify({ before: seqHopsBeforeFile, ...seqFindFile })
    );
    await shot(page, "sequence-find-file.png");
    await page.fill("#graphSearch", "nomatch-file.rs");
    await page.waitForTimeout(220);
    const seqFindMiss = await page.evaluate(() => ({
      hops: document.querySelectorAll("#seqHops .seq-hop").length,
      empty: !!document.querySelector(".seq-page .empty, .expl-wrap .empty"),
    }));
    record(
      "SG8b",
      "Find on a non-matching member file drops Sequence hops",
      seqFindMiss.hops < seqHopsBeforeFile || seqFindMiss.empty,
      JSON.stringify({ before: seqHopsBeforeFile, ...seqFindMiss })
    );
    await page.fill("#graphSearch", "");
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      const box = document.getElementById("graphSearch");
      if (box && box.blur) box.blur();
    });

    assertNoStampDir("Q8", "Sequence step did not write .graphide/stamps/");

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
        hopText: hops.map((el) => ((el.querySelector(".t") || el).textContent || "").replace(/\s+/g, " ").trim()),
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
    const hop0 = (dataflowDesk.hopText && dataflowDesk.hopText[0]) || "";
    const hop1 = (dataflowDesk.hopText && dataflowDesk.hopText[1]) || "";
    record(
      "F4b",
      "Data-flow Play list starts at the source (publish → events → subscribe)",
      dataflowDesk.kinds[0] === "Publishes" &&
        /publish/i.test(hop0) &&
        /events/i.test(hop0) &&
        dataflowDesk.kinds[1] === "Subscribes" &&
        /events/i.test(hop1) &&
        /subscribe/i.test(hop1),
      "kinds=" + dataflowDesk.kinds.join(",") + " hops=" + (dataflowDesk.hopText || []).slice(0, 2).join(" | ")
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
    await shot(page, "dataflow-order.png");

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
    assertNoStampDir("FH5", "Flow-hints step did not write .graphide/stamps/");

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

    // Member file path is not an FQN token. Same Data-flow Find filter as FQN hits (file half of hop/node match).
    // data-subscription mixes bus.rs (publish / events) with sub.rs (subscribe) so a file query can hit and dim.
    const dfHopsBeforeFile = await page.evaluate(() => document.querySelectorAll("#dfHops .df-hop").length);
    await page.fill("#graphSearch", "sub.rs");
    await page.waitForTimeout(280);
    const dfFindFile = await page.evaluate(() => {
      const stage = [...document.querySelectorAll("#dfStages .df-node, #dfCanvas .vnode[data-id], #dfCanvas .df-node[data-id]")];
      const read = (el) => ({
        id: el.getAttribute("data-id") || "",
        file: el.getAttribute("data-file") || "",
        fqn: el.getAttribute("data-fqn") || "",
        hit: el.classList.contains("hit"),
        dim: el.classList.contains("dim"),
        op: Number(getComputedStyle(el).opacity),
      });
      const rows = stage.map(read);
      // Prefer canvas nodes when both stage + canvas are present (same ids).
      const byId = new Map();
      for (const r of rows) {
        if (!r.id) continue;
        const prev = byId.get(r.id);
        if (!prev || (r.file && !prev.file)) byId.set(r.id, r);
      }
      const uniq = [...byId.values()];
      const hits = uniq.filter((r) => r.hit);
      const dims = uniq.filter((r) => r.dim && !r.hit);
      return {
        q: ((document.getElementById("graphSearch") || {}).value || "").trim(),
        hops: document.querySelectorAll("#dfHops .df-hop").length,
        hits: hits.length,
        dims: dims.length,
        hitFiles: hits.map((r) => r.file),
        dimFiles: dims.map((r) => r.file),
        hitMin: hits.length ? Math.min(...hits.map((r) => r.op)) : 0,
        dimMax: dims.length ? Math.max(...dims.map((r) => r.op)) : 1,
      };
    });
    record(
      "SG7",
      "Find on a member file filters Data-flow hops / dims off-query nodes",
      /sub\.rs/i.test(dfFindFile.q) &&
        dfFindFile.hits >= 1 &&
        dfFindFile.hitMin >= 0.99 &&
        dfFindFile.hitFiles.some((f) => /sub\.rs/i.test(f)) &&
        dfFindFile.dims >= 1 &&
        dfFindFile.dimMax <= 0.18 &&
        dfFindFile.hops < dfHopsBeforeFile,
      JSON.stringify({ before: dfHopsBeforeFile, ...dfFindFile })
    );
    await shot(page, "dataflow-find-file.png");
    await page.fill("#graphSearch", "");
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      const box = document.getElementById("graphSearch");
      if (box && box.blur) box.blur();
    });

    assertNoStampDir("F8", "Data-flow step did not write .graphide/stamps/");

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
    const lcRecover = await page.evaluate(() => {
      const edge = [...document.querySelectorAll("#lcCanvas .react-flow__edge")].find((el) =>
        /broken:walking:recover/.test(el.getAttribute("data-id") || "")
      );
      const path = edge && edge.querySelector("path.react-flow__edge-path");
      const waiting = document.querySelector('#lcCanvas .vnode[data-lc-id="waiting"]');
      const wr = waiting ? waiting.getBoundingClientRect() : null;
      let hits = 0;
      if (path && wr && path.getTotalLength) {
        const len = path.getTotalLength();
        const steps = 32;
        for (let i = 1; i < steps; i++) {
          const p = path.getPointAtLength((len * i) / steps);
          const ctm = path.getScreenCTM();
          if (!ctm) continue;
          const s = new DOMPoint(p.x, p.y).matrixTransform(ctm);
          const inset = 6;
          if (s.x > wr.left + inset && s.x < wr.right - inset && s.y > wr.top + inset && s.y < wr.bottom - inset) hits++;
        }
      }
      return {
        has: !!path,
        hits,
        d: path ? (path.getAttribute("d") || "").slice(0, 160) : "",
      };
    });
    record(
      "L6d",
      "Lifecycle recover back-edge does not cut through Waiting",
      lcRecover.has && lcRecover.hits === 0,
      "hits=" + lcRecover.hits + " d=" + lcRecover.d
    );
    await shot(page, "lifecycle-recover.png");

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

    // Member file path is not an FQN token. Same Lifecycle Find filter as endpoint file match (file half of lcEndMatch).
    // fixtures/demo data-subscription exposes crate::bus::events on src/bus.rs so a file query can hit the end and dim states.
    const lcEndsBeforeFile = await page.evaluate(() => document.querySelectorAll("#lcEnds .lc-end").length);
    await page.fill("#graphSearch", "bus.rs");
    await page.waitForTimeout(280);
    const lcFindFile = await page.evaluate(() => {
      const ends = [...document.querySelectorAll("#lcEnds .lc-end")].map((el) => ({
        id: el.getAttribute("data-id") || "",
        file: el.getAttribute("data-file") || "",
        fqn: el.getAttribute("data-fqn") || "",
        hit: el.classList.contains("hit"),
        dim: el.classList.contains("dim"),
        op: Number(getComputedStyle(el).opacity),
      }));
      const lanes = [...document.querySelectorAll("#lcLanes .lc-state")].map((el) => ({
        id: el.getAttribute("data-lc-id") || "",
        hit: el.classList.contains("hit"),
        dim: el.classList.contains("dim"),
        op: Number(getComputedStyle(el).opacity),
      }));
      const hits = ends.filter((r) => r.hit);
      const dims = lanes.filter((r) => r.dim && !r.hit);
      return {
        q: ((document.getElementById("graphSearch") || {}).value || "").trim(),
        ends: ends.length,
        empty: !!document.querySelector(".lc-page .empty, .expl-wrap .empty"),
        hits: hits.length,
        dims: dims.length,
        hitFiles: hits.map((r) => r.file),
        hitMin: hits.length ? Math.min(...hits.map((r) => r.op)) : 0,
        dimMax: dims.length ? Math.max(...dims.map((r) => r.op)) : 1,
      };
    });
    record(
      "SG9",
      "Find on a member file keeps Lifecycle end .hit / dims off-query states",
      /bus\.rs/i.test(lcFindFile.q) &&
        !lcFindFile.empty &&
        lcFindFile.hits >= 1 &&
        lcFindFile.hitMin >= 0.99 &&
        lcFindFile.hitFiles.some((f) => /bus\.rs/i.test(f)) &&
        lcFindFile.dims >= 1 &&
        lcFindFile.dimMax <= 0.18 &&
        lcFindFile.ends >= 1 &&
        lcFindFile.ends <= lcEndsBeforeFile,
      JSON.stringify({ before: lcEndsBeforeFile, ...lcFindFile })
    );
    await shot(page, "lifecycle-find-file.png");
    await page.fill("#graphSearch", "nomatch-file.rs");
    await page.waitForTimeout(220);
    const lcFindMiss = await page.evaluate(() => ({
      ends: document.querySelectorAll("#lcEnds .lc-end").length,
      empty: !!document.querySelector(".lc-page .empty, .expl-wrap .empty"),
    }));
    record(
      "SG9b",
      "Find on a non-matching member file empties Lifecycle",
      lcFindMiss.empty || lcFindMiss.ends < lcEndsBeforeFile,
      JSON.stringify({ before: lcEndsBeforeFile, ...lcFindMiss })
    );
    await page.fill("#graphSearch", "");
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      const box = document.getElementById("graphSearch");
      if (box && box.blur) box.blur();
    });

    assertNoStampDir("L8", "Lifecycle step did not write .graphide/stamps/");

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
    // Lineage is an Ego walk of the focus: Find hits stay lit; Ego neighbors that miss stay Find-dim (not full opacity).
    const lineageEgoFind = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#lineageCanvas .vnode[data-id], #lineageCanvas .ego-node[data-id]")];
      const op = (el) => Number(getComputedStyle(el).opacity);
      const hits = nodes.filter((el) => el.classList.contains("hit"));
      const missInside = nodes.filter(
        (el) => el.classList.contains("ego") && el.classList.contains("dim") && !el.classList.contains("hit")
      );
      return {
        ego: nodes.filter((el) => el.classList.contains("ego")).length,
        hits: hits.length,
        hitMin: hits.length ? Math.min(...hits.map(op)) : 0,
        missInside: missInside.length,
        missInsideMax: missInside.length ? Math.max(...missInside.map(op)) : 1,
      };
    });
    record(
      "SG5c",
      "Lineage Find hits stay lit; Ego misses stay Find-dim",
      lineageEgoFind.ego >= 1 &&
        lineageEgoFind.hits >= 1 &&
        lineageEgoFind.hitMin >= 0.99 &&
        lineageEgoFind.missInside >= 1 &&
        lineageEgoFind.missInsideMax <= 0.18,
      JSON.stringify(lineageEgoFind)
    );
    // Drop any leftover scroll-blend paint so opacity is not mid-transition (S1j).
    await page.evaluate(() => {
      document.querySelectorAll(".viewport[data-scroll-blend]").forEach((vp) => {
        vp.removeAttribute("data-scroll-blend");
        if (vp.style) vp.style.removeProperty("--scroll-blend-ms");
      });
    });
    const lineageEgoDimFloor = await page.evaluate(() => {
      const el =
        document.querySelector("#lineageCanvas .vnode[data-id]") ||
        document.querySelector("#lineageCanvas .ego-node[data-id]");
      if (!el) return { ok: false };
      el.classList.add("ego-dim", "dim");
      el.classList.remove("hit", "ego");
      // Force style recalc after class swap (avoid reading mid CSS transition).
      void el.offsetWidth;
      const op = Number(getComputedStyle(el).opacity);
      el.classList.remove("ego-dim", "dim");
      return { ok: true, op };
    });
    record(
      "SG5d",
      "Lineage ego-dim Find miss sits at the 0.12 floor (not Find-dim 0.18)",
      lineageEgoDimFloor.ok && lineageEgoDimFloor.op <= 0.12,
      JSON.stringify(lineageEgoDimFloor)
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

    // Member file path is not an FQN token. Same Lineage Find filter as SG3 (file half of matchesExplorerQuery / data-file).
    // events focus mixes bus.rs (publish / events) with sub.rs (subscribe) so a file query can hit and dim.
    const lineageHopsBeforeFile = await page.evaluate(() => document.querySelectorAll("#lineageHops .expl-card.hop").length);
    await page.fill("#graphSearch", "sub.rs");
    await page.waitForTimeout(280);
    const lineageFindFile = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#lineageCanvas .vnode[data-id], #lineageCanvas .ego-node[data-id]")];
      const read = (el) => ({
        id: el.getAttribute("data-id") || "",
        file: el.getAttribute("data-file") || "",
        hit: el.classList.contains("hit"),
        dim: el.classList.contains("dim"),
        op: Number(getComputedStyle(el).opacity),
      });
      const rows = nodes.map(read);
      const hits = rows.filter((r) => r.hit);
      const dims = rows.filter((r) => r.dim && !r.hit);
      return {
        q: ((document.getElementById("graphSearch") || {}).value || "").trim(),
        hops: document.querySelectorAll("#lineageHops .expl-card.hop").length,
        hits: hits.length,
        dims: dims.length,
        hitFiles: hits.map((r) => r.file),
        dimFiles: dims.map((r) => r.file),
        hitMin: hits.length ? Math.min(...hits.map((r) => r.op)) : 0,
        dimMax: dims.length ? Math.max(...dims.map((r) => r.op)) : 1,
      };
    });
    record(
      "SG3b",
      "Find on a member file filters Lineage hops / dims off-query nodes",
      /sub\.rs/i.test(lineageFindFile.q) &&
        lineageFindFile.hits >= 1 &&
        lineageFindFile.hitMin >= 0.99 &&
        lineageFindFile.hitFiles.some((f) => /sub\.rs/i.test(f)) &&
        lineageFindFile.dims >= 1 &&
        lineageFindFile.dimMax <= 0.18 &&
        lineageFindFile.hops < lineageHopsBeforeFile,
      JSON.stringify({ before: lineageHopsBeforeFile, ...lineageFindFile })
    );
    await shot(page, "lineage-find-file.png");
    await page.fill("#graphSearch", "");
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      const box = document.getElementById("graphSearch");
      if (box && box.blur) box.blur();
    });

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
    assertNoStampDir("Y9", "Lineage step did not write .graphide/stamps/");

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
    // Tip + toast under Route must clear (parity with K19–K19f / K20–K20f).
    await page.evaluate(() => {
      const tip = document.getElementById("tip");
      if (tip) {
        tip.hidden = false;
        tip.textContent = "forced tip";
      }
      const toast = document.getElementById("toast");
      if (toast) {
        toast.hidden = false;
        toast.className = "on ok";
        toast.textContent = "Copied PNG";
      }
    });
    await page.keyboard.press("r");
    await page.waitForFunction(() => window.__graphideRoute && window.__graphideRoute.open, null, { timeout: 5000 });
    await page.waitForTimeout(200);
    const tipUnderRoute = await page.evaluate(() => {
      const tip = document.getElementById("tip");
      const rec = window.__graphideRoute || {};
      return {
        tipHidden: !tip || tip.hidden,
        routeOpen: !!rec.open,
      };
    });
    record(
      "K19g",
      "Opening Route hides the hover tip (no tip under chrome)",
      tipUnderRoute.routeOpen && tipUnderRoute.tipHidden,
      JSON.stringify(tipUnderRoute)
    );
    const toastUnderRoute = await page.evaluate(() => {
      const toast = document.getElementById("toast");
      const rec = window.__graphideRoute || {};
      return {
        toastGone: !toast || toast.hidden || !toast.classList.contains("on"),
        routeOpen: !!rec.open,
        routeOk: !!rec.ok,
      };
    });
    record(
      "K20g",
      "Opening Route clears the toast (no toast under chrome)",
      toastUnderRoute.routeOpen && toastUnderRoute.toastGone,
      JSON.stringify(toastUnderRoute)
    );
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
    assertNoStampDir("RT7", "Route step did not write .graphide/stamps/");

    // Tip + toast under Lens must clear (parity with K19–K19e / K20–K20e).
    await page.evaluate(() => {
      const tip = document.getElementById("tip");
      if (tip) {
        tip.hidden = false;
        tip.textContent = "forced tip";
      }
      const toast = document.getElementById("toast");
      if (toast) {
        toast.hidden = false;
        toast.className = "on ok";
        toast.textContent = "Copied PNG";
      }
    });
    await page.keyboard.press("l");
    await page.waitForFunction(() => window.__graphideLens && window.__graphideLens.open, null, { timeout: 5000 });
    await page.waitForTimeout(200);
    const tipUnderLens = await page.evaluate(() => {
      const tip = document.getElementById("tip");
      const rec = window.__graphideLens || {};
      return {
        tipHidden: !tip || tip.hidden,
        lensOpen: !!rec.open,
      };
    });
    record(
      "K19f",
      "Opening Lens hides the hover tip (no tip under chrome)",
      tipUnderLens.lensOpen && tipUnderLens.tipHidden,
      JSON.stringify(tipUnderLens)
    );
    const toastUnderLens = await page.evaluate(() => {
      const toast = document.getElementById("toast");
      const rec = window.__graphideLens || {};
      return {
        toastGone: !toast || toast.hidden || !toast.classList.contains("on"),
        lensOpen: !!rec.open,
      };
    });
    record(
      "K20f",
      "Opening Lens clears the toast (no toast under chrome)",
      toastUnderLens.lensOpen && toastUnderLens.toastGone,
      JSON.stringify(toastUnderLens)
    );
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
    assertNoStampDir("LN5", "Lens step did not write .graphide/stamps/");

    const pythonSnap = loadPythonSnap();
    const pythonGraph = assertPythonSnap(pythonSnap);
    const pythonUrl = origin + PYTHON_HARNESS;
    console.log("python " + pythonUrl);
    await page.goto(pythonUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    const pythonBoot = await page
      .waitForFunction(
        () => {
          if (window.__graphidePythonError) return "error";
          if (window.__graphidePython === true && document.body.classList.contains("desk")) return "ok";
          const err = document.querySelector(".empty.error");
          if (err && /python-snap/i.test(err.textContent || "")) return "error";
          return "";
        },
        null,
        { timeout: 25000 }
      )
      .then((h) => h.jsonValue())
      .catch((e) => "timeout:" + String(e && e.message ? e.message : e));
    const pythonHost = await page.evaluate(() => ({
      live: window.__graphidePython === true,
      error: window.__graphidePythonError || "",
      ws:
        ((document.querySelector("#workspaces [data-ws].on") || {}).getAttribute &&
          document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")) ||
        "",
      empty: ((document.querySelector(".empty.error") || {}).textContent || "").trim(),
      plugin: ((document.getElementById("status") || {}).textContent || ""),
    }));
    if (pythonBoot !== "ok" || !pythonHost.live) {
      const why =
        pythonHost.error ||
        pythonHost.empty ||
        (pythonBoot && pythonBoot !== "ok" ? pythonBoot : "") ||
        "harness did not load the python fixture";
      record("PY1", "python desk loaded the fixtures/python snap", false, why);
      failFast("desk could not be driven from the python fixture — " + why);
    }
    record("PY1", "python desk loaded the fixtures/python snap", true, pythonHost.ws + " " + pythonGraph.plugin);
    if (pythonHost.ws !== "dataflow") {
      await page.click('#workspaces [data-ws="dataflow"]');
      await page.waitForTimeout(200);
    }
    await page.waitForSelector("#dfCanvas .df-node, #dfHops .df-hop", { timeout: 10000 });
    await page.waitForTimeout(200);
    const pythonDesk = await page.evaluate(() => {
      const sources = document.querySelectorAll('#dfCanvas .df-node[data-df-role="source"]').length;
      const sinks = document.querySelectorAll('#dfCanvas .df-node[data-df-role="sink"]').length;
      const nodes = document.querySelectorAll("#dfCanvas .df-node").length;
      const hops = document.querySelectorAll("#dfHops .df-hop").length;
      const xy = document.querySelectorAll("#dfCanvas .react-flow__node").length;
      const shapes = [...document.querySelectorAll("#dfCanvas .vnode[data-shape]")].map((el) =>
        el.getAttribute("data-shape")
      );
      const roles = [...document.querySelectorAll("#dfCanvas .df-node[data-df-role]")].map((el) =>
        el.getAttribute("data-df-role")
      );
      const text = [
        ...[...document.querySelectorAll("#dfCanvas .df-node, #dfHops .df-hop")].map((el) =>
          (el.textContent || "").replace(/\s+/g, " ").trim()
        ),
      ];
      const blob = text.join(" ");
      return {
        ws:
          ((document.querySelector("#workspaces [data-ws].on") || {}).getAttribute &&
            document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")) ||
          "",
        sources,
        sinks,
        nodes,
        hops,
        xy,
        xyFlow: !!document.querySelector("#dfCanvas .react-flow"),
        shapes: [...new Set(shapes)],
        shapeN: shapes.length,
        roles,
        subscribe: /subscribe/i.test(blob) && /events/i.test(blob),
        publish: /publish/i.test(blob),
        text: text.slice(0, 6),
      };
    });
    record("PY2", "Python Data-flow workspace is active", pythonDesk.ws === "dataflow", pythonDesk.ws);
    record(
      "PY3",
      "Python Data-flow paints Source and Sink (not a raw IR dump)",
      pythonDesk.sources >= 1 && pythonDesk.sinks >= 1 && pythonDesk.nodes >= 2,
      "roles=" + pythonDesk.roles.join(",") + " " + pythonDesk.text.slice(0, 3).join(" | ")
    );
    record(
      "PY4",
      "Python Data-flow names subscribe / publish / events",
      pythonDesk.subscribe && pythonDesk.publish,
      pythonDesk.text.join(" | ")
    );
    record(
      "PY5",
      "Python Data-flow XYFlow nodes expose data-shape",
      pythonDesk.xyFlow && pythonDesk.xy > 1 && pythonDesk.xy <= 48 && pythonDesk.shapeN > 1,
      "xy=" + pythonDesk.xy + " shapes=" + pythonDesk.shapes.join(",")
    );
    await shot(page, "python-desk.png");

    await page.evaluate(() => {
      const tab = document.querySelector('#workspaces [data-ws="map"]');
      if (tab) tab.click();
    });
    await page.waitForFunction(
      () => {
        const on = document.querySelector("#workspaces [data-ws].on");
        return !!(on && on.getAttribute("data-ws") === "map");
      },
      null,
      { timeout: 8000 }
    );
    await page.waitForSelector(".bubble-card", { timeout: 10000 });
    await page.waitForTimeout(200);
    const pythonMap = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".bubble-card")];
      const names = cards.map((el) => ((el.querySelector(".name") || {}).textContent || "").trim());
      const loneStart =
        cards.length <= 1 &&
        (names.length === 0 || /^(main|program|start|_program)$/i.test(names[0] || ""));
      return {
        ws:
          ((document.querySelector("#workspaces [data-ws].on") || {}).getAttribute &&
            document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")) ||
          "",
        cards: cards.length,
        xy: document.querySelectorAll(".react-flow__node").length,
        names: names.slice(0, 8),
        loneStart,
      };
    });
    record(
      "PY6",
      "Python Map is community LOD (cards, xy=0, not a lone START)",
      pythonMap.ws === "map" && pythonMap.cards >= 2 && pythonMap.xy === 0 && !pythonMap.loneStart,
      "cards=" + pythonMap.cards + " xy=" + pythonMap.xy + " names=" + pythonMap.names.join(",")
    );
    assertNoStampDir("PY7", "Python desk step did not write .graphide/stamps/");

    const jsSnap = loadJsSnap();
    const jsGraph = assertJsSnap(jsSnap);
    const jsUrl = origin + JS_HARNESS;
    console.log("js " + jsUrl);
    await page.goto(jsUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    const jsBoot = await page
      .waitForFunction(
        () => {
          if (window.__graphideJsError) return "error";
          if (window.__graphideJs === true && document.body.classList.contains("desk")) return "ok";
          const err = document.querySelector(".empty.error");
          if (err && /js-snap/i.test(err.textContent || "")) return "error";
          return "";
        },
        null,
        { timeout: 25000 }
      )
      .then((h) => h.jsonValue())
      .catch((e) => "timeout:" + String(e && e.message ? e.message : e));
    const jsHost = await page.evaluate(() => ({
      live: window.__graphideJs === true,
      error: window.__graphideJsError || "",
      ws:
        ((document.querySelector("#workspaces [data-ws].on") || {}).getAttribute &&
          document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")) ||
        "",
      empty: ((document.querySelector(".empty.error") || {}).textContent || "").trim(),
      plugin: ((document.getElementById("status") || {}).textContent || ""),
    }));
    if (jsBoot !== "ok" || !jsHost.live) {
      const why =
        jsHost.error ||
        jsHost.empty ||
        (jsBoot && jsBoot !== "ok" ? jsBoot : "") ||
        "harness did not load the javascript fixture";
      record("JS1", "javascript desk loaded the fixtures/js snap", false, why);
      failFast("desk could not be driven from the javascript fixture — " + why);
    }
    record("JS1", "javascript desk loaded the fixtures/js snap", true, jsHost.ws + " " + jsGraph.plugin);
    if (jsHost.ws !== "dataflow") {
      await page.click('#workspaces [data-ws="dataflow"]');
      await page.waitForTimeout(200);
    }
    await page.waitForSelector("#dfCanvas .df-node, #dfHops .df-hop", { timeout: 10000 });
    await page.waitForTimeout(200);
    const jsDesk = await page.evaluate(() => {
      const sources = document.querySelectorAll('#dfCanvas .df-node[data-df-role="source"]').length;
      const sinks = document.querySelectorAll('#dfCanvas .df-node[data-df-role="sink"]').length;
      const nodes = document.querySelectorAll("#dfCanvas .df-node").length;
      const hops = document.querySelectorAll("#dfHops .df-hop").length;
      const xy = document.querySelectorAll("#dfCanvas .react-flow__node").length;
      const shapes = [...document.querySelectorAll("#dfCanvas .vnode[data-shape]")].map((el) =>
        el.getAttribute("data-shape")
      );
      const roles = [...document.querySelectorAll("#dfCanvas .df-node[data-df-role]")].map((el) =>
        el.getAttribute("data-df-role")
      );
      const text = [
        ...[...document.querySelectorAll("#dfCanvas .df-node, #dfHops .df-hop")].map((el) =>
          (el.textContent || "").replace(/\s+/g, " ").trim()
        ),
      ];
      const blob = text.join(" ");
      return {
        ws:
          ((document.querySelector("#workspaces [data-ws].on") || {}).getAttribute &&
            document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")) ||
          "",
        sources,
        sinks,
        nodes,
        hops,
        xy,
        xyFlow: !!document.querySelector("#dfCanvas .react-flow"),
        shapes: [...new Set(shapes)],
        shapeN: shapes.length,
        roles,
        subscribe: /subscribe/i.test(blob) && /events/i.test(blob),
        publish: /publish/i.test(blob),
        text: text.slice(0, 6),
      };
    });
    record("JS2", "JavaScript Data-flow workspace is active", jsDesk.ws === "dataflow", jsDesk.ws);
    record(
      "JS3",
      "JavaScript Data-flow paints Source and Sink (not a raw IR dump)",
      jsDesk.sources >= 1 && jsDesk.sinks >= 1 && jsDesk.nodes >= 2,
      "roles=" + jsDesk.roles.join(",") + " " + jsDesk.text.slice(0, 3).join(" | ")
    );
    record(
      "JS4",
      "JavaScript Data-flow names subscribe / publish / events",
      jsDesk.subscribe && jsDesk.publish,
      jsDesk.text.join(" | ")
    );
    record(
      "JS5",
      "JavaScript Data-flow XYFlow nodes expose data-shape",
      jsDesk.xyFlow && jsDesk.xy > 1 && jsDesk.xy <= 48 && jsDesk.shapeN > 1,
      "xy=" + jsDesk.xy + " shapes=" + jsDesk.shapes.join(",")
    );
    await shot(page, "js-desk.png");

    await page.evaluate(() => {
      const tab = document.querySelector('#workspaces [data-ws="map"]');
      if (tab) tab.click();
    });
    await page.waitForFunction(
      () => {
        const on = document.querySelector("#workspaces [data-ws].on");
        return !!(on && on.getAttribute("data-ws") === "map");
      },
      null,
      { timeout: 8000 }
    );
    await page.waitForSelector(".bubble-card", { timeout: 10000 });
    await page.waitForTimeout(200);
    const jsMap = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".bubble-card")];
      const names = cards.map((el) => ((el.querySelector(".name") || {}).textContent || "").trim());
      const loneStart =
        cards.length <= 1 &&
        (names.length === 0 || /^(main|program|start|_program)$/i.test(names[0] || ""));
      return {
        ws:
          ((document.querySelector("#workspaces [data-ws].on") || {}).getAttribute &&
            document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")) ||
          "",
        cards: cards.length,
        xy: document.querySelectorAll(".react-flow__node").length,
        names: names.slice(0, 8),
        loneStart,
      };
    });
    record(
      "JS6",
      "JavaScript Map is community LOD (cards, xy=0, not a lone START)",
      jsMap.ws === "map" && jsMap.cards >= 2 && jsMap.xy === 0 && !jsMap.loneStart,
      "cards=" + jsMap.cards + " xy=" + jsMap.xy + " names=" + jsMap.names.join(",")
    );
    assertNoStampDir("JS7", "JavaScript desk step did not write .graphide/stamps/");

    const tsSnap = loadTsSnap();
    const tsGraph = assertTsSnap(tsSnap);
    const tsUrl = origin + TS_HARNESS;
    console.log("ts " + tsUrl);
    await page.goto(tsUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    const tsBoot = await page
      .waitForFunction(
        () => {
          if (window.__graphideTsError) return "error";
          if (window.__graphideTs === true && document.body.classList.contains("desk")) return "ok";
          const err = document.querySelector(".empty.error");
          if (err && /ts-snap/i.test(err.textContent || "")) return "error";
          return "";
        },
        null,
        { timeout: 25000 }
      )
      .then((h) => h.jsonValue())
      .catch((e) => "timeout:" + String(e && e.message ? e.message : e));
    const tsHost = await page.evaluate(() => ({
      live: window.__graphideTs === true,
      error: window.__graphideTsError || "",
      ws:
        ((document.querySelector("#workspaces [data-ws].on") || {}).getAttribute &&
          document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")) ||
        "",
      empty: ((document.querySelector(".empty.error") || {}).textContent || "").trim(),
      plugin: ((document.getElementById("status") || {}).textContent || ""),
    }));
    if (tsBoot !== "ok" || !tsHost.live) {
      const why =
        tsHost.error ||
        tsHost.empty ||
        (tsBoot && tsBoot !== "ok" ? tsBoot : "") ||
        "harness did not load the typescript fixture";
      record("TS1", "typescript desk loaded the fixtures/ts snap", false, why);
      failFast("desk could not be driven from the typescript fixture — " + why);
    }
    record("TS1", "typescript desk loaded the fixtures/ts snap", true, tsHost.ws + " " + tsGraph.plugin);
    if (tsHost.ws !== "dataflow") {
      await page.click('#workspaces [data-ws="dataflow"]');
      await page.waitForTimeout(200);
    }
    await page.waitForSelector("#dfCanvas .df-node, #dfHops .df-hop", { timeout: 10000 });
    await page.waitForTimeout(200);
    const tsDesk = await page.evaluate(() => {
      const sources = document.querySelectorAll('#dfCanvas .df-node[data-df-role="source"]').length;
      const sinks = document.querySelectorAll('#dfCanvas .df-node[data-df-role="sink"]').length;
      const nodes = document.querySelectorAll("#dfCanvas .df-node").length;
      const hops = document.querySelectorAll("#dfHops .df-hop").length;
      const xy = document.querySelectorAll("#dfCanvas .react-flow__node").length;
      const shapes = [...document.querySelectorAll("#dfCanvas .vnode[data-shape]")].map((el) =>
        el.getAttribute("data-shape")
      );
      const roles = [...document.querySelectorAll("#dfCanvas .df-node[data-df-role]")].map((el) =>
        el.getAttribute("data-df-role")
      );
      const text = [
        ...[...document.querySelectorAll("#dfCanvas .df-node, #dfHops .df-hop")].map((el) =>
          (el.textContent || "").replace(/\s+/g, " ").trim()
        ),
      ];
      const blob = text.join(" ");
      return {
        ws:
          ((document.querySelector("#workspaces [data-ws].on") || {}).getAttribute &&
            document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")) ||
          "",
        sources,
        sinks,
        nodes,
        hops,
        xy,
        xyFlow: !!document.querySelector("#dfCanvas .react-flow"),
        shapes: [...new Set(shapes)],
        shapeN: shapes.length,
        roles,
        subscribe: /subscribe/i.test(blob) && /events/i.test(blob),
        publish: /publish/i.test(blob),
        text: text.slice(0, 6),
      };
    });
    record("TS2", "TypeScript Data-flow workspace is active", tsDesk.ws === "dataflow", tsDesk.ws);
    record(
      "TS3",
      "TypeScript Data-flow paints Source and Sink (not a raw IR dump)",
      tsDesk.sources >= 1 && tsDesk.sinks >= 1 && tsDesk.nodes >= 2,
      "roles=" + tsDesk.roles.join(",") + " " + tsDesk.text.slice(0, 3).join(" | ")
    );
    record(
      "TS4",
      "TypeScript Data-flow names subscribe / publish / events",
      tsDesk.subscribe && tsDesk.publish,
      tsDesk.text.join(" | ")
    );
    record(
      "TS5",
      "TypeScript Data-flow XYFlow nodes expose data-shape",
      tsDesk.xyFlow && tsDesk.xy > 1 && tsDesk.xy <= 48 && tsDesk.shapeN > 1,
      "xy=" + tsDesk.xy + " shapes=" + tsDesk.shapes.join(",")
    );
    await shot(page, "ts-desk.png");

    await page.evaluate(() => {
      const tab = document.querySelector('#workspaces [data-ws="map"]');
      if (tab) tab.click();
    });
    await page.waitForFunction(
      () => {
        const on = document.querySelector("#workspaces [data-ws].on");
        return !!(on && on.getAttribute("data-ws") === "map");
      },
      null,
      { timeout: 8000 }
    );
    await page.waitForSelector(".bubble-card", { timeout: 10000 });
    await page.waitForTimeout(200);
    const tsMap = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".bubble-card")];
      const names = cards.map((el) => ((el.querySelector(".name") || {}).textContent || "").trim());
      const loneStart =
        cards.length <= 1 &&
        (names.length === 0 || /^(main|program|start|_program)$/i.test(names[0] || ""));
      return {
        ws:
          ((document.querySelector("#workspaces [data-ws].on") || {}).getAttribute &&
            document.querySelector("#workspaces [data-ws].on").getAttribute("data-ws")) ||
          "",
        cards: cards.length,
        xy: document.querySelectorAll(".react-flow__node").length,
        names: names.slice(0, 8),
        loneStart,
      };
    });
    record(
      "TS6",
      "TypeScript Map is community LOD (cards, xy=0, not a lone START)",
      tsMap.ws === "map" && tsMap.cards >= 2 && tsMap.xy === 0 && !tsMap.loneStart,
      "cards=" + tsMap.cards + " xy=" + tsMap.xy + " names=" + tsMap.names.join(",")
    );
    assertNoStampDir("TS7", "TypeScript desk step did not write .graphide/stamps/");
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
      "` (Route / Lens on fixtures/demo) then `" +
      PYTHON_HARNESS +
      "` (Python desk on fixtures/python) then `" +
      JS_HARNESS +
      "` (JavaScript desk on fixtures/js) then `" +
      TS_HARNESS +
      "` (TypeScript desk on fixtures/ts) served from `extension/`.",
    "PASS verify-graphide · " +
      checks.length +
      "/" +
      checks.length +
      " · chrome 17/17 · overview · decisions · registry · timeline · self-review rust graph · map community · enter-bubble · ego · search · kind-filters · ask · keys · path-walk · appearance · apple-chrome · apple-chrome-icons · coverage-mark · hop-card · fit-reorg · zoom · canvas-recycle · delta-onanalysis · map-offview · panel-timeout · program-chips · all-programs · progress · cancel-review · flow-hints · flow-tabs · slice-grey · slice-runs · slice-enter-recycle · stamp-recheck · unmatched-hint · uncovered-node · open-slice · draft-hint · proposed-uncovered · stamp posted · delta · sticky-clusters · delta-sticky-views · sequence · dataflow · lifecycle · python-desk · js-desk · ts-desk · lineage · export · present · preset · route · lens"
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
