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

const ROOT = path.resolve(__dirname, "..");
const EXT = path.join(ROOT, "extension");
const OUT = path.join(ROOT, "verification");
const HARNESS = "/scripts/webview-harness.html?mode=explorer&probe=0";

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
    "Artifacts: `overview.png`, `map.png`, `evidence.png`, `stamp-host.png`, `report.md`.",
    "",
    "Stamp/skip clicks only prove `window.__vscodePosts`. They do not write `.graphide/stamps/`.",
    "",
  ];
  const dest = path.join(OUT, "report.md");
  fs.writeFileSync(dest, lines.join("\n"));
  return dest;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
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
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }

  const failed = checks.filter((c) => !c.pass);
  writeReport("Harness `" + HARNESS + "` served from `extension/`.");
  if (failed.length) {
    console.error("FAIL verify-graphide · " + failed.length + "/" + checks.length);
    failed.forEach((c) => console.error("  XX " + c.id + " " + c.title + (c.detail ? " — " + c.detail : "")));
    process.exit(1);
  }
  console.log("PASS verify-graphide · " + checks.length + "/" + checks.length + " · map community · evidence clipped · stamp posted");
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  try {
    writeReport("Driver crashed: " + String(err && err.message ? err.message : err));
  } catch (e) {}
  console.error("FAIL verify-graphide · driver crashed");
  process.exit(1);
});
