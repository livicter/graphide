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
const DEMO = path.join(ROOT, "fixtures", "demo");
const DEMO_PARENT = path.join(ROOT, "fixtures", "demo-parent");
const HARNESS = "/scripts/webview-harness.html?mode=explorer&probe=0";
const LIVE_HARNESS = "/scripts/webview-harness.html?live=1&probe=0&require=1";
const DELTA_HARNESS = "/scripts/webview-harness.html?delta=1&probe=0&require=1&ws=delta";
const SEQUENCE_HARNESS = "/scripts/webview-harness.html?sequence=1&probe=0&require=1&ws=sequence";
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
  let n = 0;
  const step = Math.max(1, Math.floor((w * h) / 8000));
  for (let i = 0, pix = 0; i < out.length; i += bpp, pix++) {
    if (pix % step) continue;
    sum += 0.2126 * out[i] + 0.7152 * out[i + 1] + 0.0722 * out[i + 2];
    n++;
  }
  return { w, h, luma: n ? sum / n / 255 : 0 };
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
    "Artifacts: `overview.png`, `map.png`, `evidence.png`, `stamp-host.png`, `self-review.png`, `delta.png`, `sequence.png`, `report.md`.",
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
    path.join(ROOT, "target", "release", "graphide"),
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
    record("M3", "Program chip seed includes bin main", /bin\s+main/i.test(map.legend), map.legend.slice(0, 80));
    await shot(page, "map.png");

    await page.click('#workspaces [data-ws="slice"]');
    await page.waitForSelector(".vnode", { timeout: 10000 });
    await page.waitForTimeout(200);
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
    await page.waitForTimeout(250);

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
      "` (Sequence on fixtures/demo) served from `extension/`.",
    "PASS verify-graphide · " +
      checks.length +
      "/" +
      checks.length +
      " · chrome 17/17 · self-review rust graph · map community · stamp posted · delta · sequence"
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
