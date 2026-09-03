#!/usr/bin/env node
/**
 * Inspect a packaged graphide-*.vsix. Does not replace npm run verify.
 *
 *   node scripts/check-package.js [path.vsix]
 */
"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");
const EXT = path.join(ROOT, "extension");

function readZip(file) {
  const buf = fs.readFileSync(file);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("not a zip: " + file);
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const entries = [];
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error("bad zip central directory: " + file);
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const size = buf.readUInt32LE(off + 24);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.slice(off + 46, off + 46 + nameLen).toString("utf8");
    entries.push({ name, size, method, compSize, localOff });
    off += 46 + nameLen + extraLen + commentLen;
  }
  function extract(name) {
    const hit = entries.find((e) => e.name === name);
    if (!hit) throw new Error("zip missing " + name);
    const nameLen = buf.readUInt16LE(hit.localOff + 26);
    const extraLen = buf.readUInt16LE(hit.localOff + 28);
    const start = hit.localOff + 30 + nameLen + extraLen;
    const slice = buf.slice(start, start + hit.compSize);
    if (hit.method === 0) return slice;
    if (hit.method === 8) return zlib.inflateRawSync(slice);
    throw new Error("unsupported zip method " + hit.method + " for " + name);
  }
  return { entries, extract };
}

function newestVsix() {
  const names = fs
    .readdirSync(EXT)
    .filter((n) => /^graphide-.*\.vsix$/.test(n))
    .map((n) => {
      const p = path.join(EXT, n);
      return { p, m: fs.statSync(p).mtimeMs };
    })
    .sort((a, b) => b.m - a.m);
  return names[0] && names[0].p;
}

function fail(msg) {
  console.error("FAIL check-package · " + msg);
  process.exit(1);
}

function findEntry(entries, rel) {
  return entries.find((e) => e.name === rel);
}

const vsix = path.resolve(process.argv[2] || newestVsix() || "");
if (!vsix || !fs.existsSync(vsix)) {
  fail("no graphide-*.vsix. Run npm run package.");
}

const zip = readZip(vsix);
const names = zip.entries.map((e) => e.name);
const bytes = fs.statSync(vsix).size;
console.log("vsix", path.relative(ROOT, vsix), "bytes=" + bytes, "entries=" + zip.entries.length);

const required = [
  ["extension/out/extension.js", 8_000],
  ["extension/out/bridge.js", 1_000],
  ["extension/out/llm.js", 1_000],
  ["extension/media/main.js", 50_000],
  ["extension/media/main.css", 10_000],
  ["extension/media/xyflow.css", 1_000],
  ["extension/media/icon.svg", 100],
  ["extension/package.json", 500],
];

for (const [rel, min] of required) {
  const hit = findEntry(zip.entries, rel);
  if (!hit) fail("missing " + rel);
  if (hit.size < min) fail(rel + " too small (" + hit.size + " < " + min + ")");
  console.log("ok  ", rel, hit.size);
}

const cli =
  findEntry(zip.entries, "extension/bin/graphide") ||
  findEntry(zip.entries, "extension/bin/graphide.exe");
if (!cli) fail("missing bundled CLI (extension/bin/graphide or graphide.exe)");
if (cli.size < 1_000_000) fail("bundled CLI too small (" + cli.size + ")");
console.log("ok  ", cli.name, cli.size);

const forbidden = names.filter(
  (n) =>
    n.startsWith("extension/src/") ||
    n.startsWith("extension/media/src/") ||
    n.startsWith("extension/scripts/") ||
    /\/out\/.*\.map$/.test(n)
);
if (forbidden.length) fail("source-only or harness paths in VSIX: " + forbidden.join(", "));

const pkg = JSON.parse(zip.extract("extension/package.json").toString("utf8"));
if (pkg.main !== "./out/extension.js") fail("package.json main is " + pkg.main);
const views = (((pkg.contributes || {}).views || {}).graphide || []).map((v) => v.id);
if (!views.includes("graphide.reviewView")) fail("package.json missing graphide.reviewView");

if (bytes < 100_000) fail("VSIX too small to hold the desk + CLI (" + bytes + ")");
console.log("PASS check-package · " + path.basename(vsix) + " · " + zip.entries.length + " entries · cli=" + cli.name);
