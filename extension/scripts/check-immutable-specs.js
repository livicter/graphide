#!/usr/bin/env node
"use strict";

/**
 * ADE Phase 1.3 — Immutable specification seal + product-path FS sandbox stub.
 * Default: verify SHA-256 lock of protected assert / feature-map sources.
 * --write requires ADE_ALLOW_SPEC_MUTATION=1 or --allow-spec-mutation (human only).
 * --gate-write <path>: product-path write policy (sealed vs agent-writable).
 * Product surface extension/media/** is intentionally NOT protected.
 */

const assert = require("node:assert");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");
const MANIFEST_REL = ".cursor/skills/verify-graphide/references/immutable-specs.lock";
const MANIFEST_ABS = path.join(ROOT, MANIFEST_REL);
const FEATURE_MAP_DIR = ".cursor/skills/verify-graphide/references/features";
const ALLOW_ENV = "ADE_ALLOW_SPEC_MUTATION";
const ALLOW_ARG = "--allow-spec-mutation";
const AGENT_WRITABLE_PREFIX = "extension/media";

const PROTECTED = [
  "package.json",
  "extension/scripts/check-map.js",
  "extension/scripts/check-immutable-specs.js",
  "scripts/verify-graphide.js",
  ".cursor/skills/verify-graphide/references/features/immutable-harness.md",
];

const args = process.argv.slice(2);
const argSet = new Set(args);
const allow = process.env[ALLOW_ENV] === "1" || argSet.has(ALLOW_ARG);
const writeMode = argSet.has("--write");
const selfTest = argSet.has("--self-test");
const gateWriteIdx = args.indexOf("--gate-write");
const gateWritePath = gateWriteIdx >= 0 ? args[gateWriteIdx + 1] : null;

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function hashFile(absPath) {
  return sha256(fs.readFileSync(absPath));
}

function abs(relPath) {
  return path.join(ROOT, relPath);
}

function listFeatureMaps() {
  const dir = abs(FEATURE_MAP_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => FEATURE_MAP_DIR + "/" + f)
    .sort();
}

function protectedPaths() {
  return [...new Set(PROTECTED.concat(listFeatureMaps()))].sort();
}

function sealedSet() {
  const set = new Set(protectedPaths());
  set.add(MANIFEST_REL);
  return set;
}

/** Normalize an absolute or repo-relative path to a POSIX-ish repo-relative key. */
function normalizeRel(input) {
  if (input == null || String(input).trim() === "") {
    throw new Error("path required");
  }
  let raw = String(input).trim();
  if (path.isAbsolute(raw)) {
    raw = path.relative(ROOT, raw);
  }
  raw = raw.replace(/\\/g, "/");
  while (raw.startsWith("./")) raw = raw.slice(2);
  if (raw === "" || raw === ".") {
    throw new Error("refuses empty / root path");
  }
  if (raw.startsWith("../") || raw === "..") {
    throw new Error("path escapes repo root: " + input);
  }
  // Collapse // and trailing slash (except keep bare file paths).
  raw = raw.replace(/\/+/g, "/").replace(/\/$/, "");
  return raw;
}

function isAgentWritableRel(rel) {
  return rel === AGENT_WRITABLE_PREFIX || rel.startsWith(AGENT_WRITABLE_PREFIX + "/");
}

/**
 * Product-path write policy. Domain shape: one classify result, not scattered ifs.
 * @returns {{ class: 'agent'|'sealed'|'unlock', allowed: boolean, reason: string, rel: string }}
 */
function classifyWrite(inputPath, opts) {
  const optsAllow = opts && Object.prototype.hasOwnProperty.call(opts, "allow") ? !!opts.allow : allow;
  const rel = normalizeRel(inputPath);
  if (isAgentWritableRel(rel)) {
    return {
      class: "agent",
      allowed: true,
      reason: "product media surface (extension/media/**)",
      rel,
    };
  }
  if (sealedSet().has(rel)) {
    if (optsAllow) {
      return {
        class: "unlock",
        allowed: true,
        reason: "human unlock via " + ALLOW_ENV + "=1 / " + ALLOW_ARG,
        rel,
      };
    }
    return {
      class: "sealed",
      allowed: false,
      reason: "sealed spec; require " + ALLOW_ENV + "=1 (or " + ALLOW_ARG + ") to mutate",
      rel,
    };
  }
  return {
    class: "agent",
    allowed: true,
    reason: "outside sealed allowlist",
    rel,
  };
}

function parseManifest(text) {
  const entries = new Map();
  let seal = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    if (line.startsWith("#")) {
      const m = line.match(/^#\s*seal-sha256:\s*([a-f0-9]{64})\s*$/);
      if (m) seal = m[1];
      continue;
    }
    const m = line.match(/^([a-f0-9]{64})\s{2}(.+)$/);
    if (!m) throw new Error("bad manifest line: " + line);
    entries.set(m[2], m[1]);
  }
  return { seal, entries };
}

function canonical(entries) {
  return [...entries.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([p, h]) => h + "  " + p + "\n")
    .join("");
}

function sealOf(entries) {
  return sha256(canonical(entries));
}

function serialize(entries) {
  const body = canonical(entries);
  return [
    "# graphide immutable specs v1",
    "# seal-sha256: " + sealOf(entries),
    "# do not edit by hand; regenerate with:",
    "#   ADE_ALLOW_SPEC_MUTATION=1 node extension/scripts/check-immutable-specs.js --write --allow-spec-mutation",
    "",
    body,
  ].join("\n");
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function verify() {
  if (!fs.existsSync(MANIFEST_ABS)) fail("immutable manifest missing: " + MANIFEST_REL);

  const { seal, entries } = parseManifest(fs.readFileSync(MANIFEST_ABS, "utf8"));
  if (!seal) fail("immutable manifest seal missing");
  if (seal !== sealOf(entries)) fail("immutable manifest seal mismatch (lock file tampered)");

  const problems = [];

  for (const [relPath, expected] of entries) {
    const p = abs(relPath);
    if (!fs.existsSync(p)) {
      problems.push("missing protected file: " + relPath);
      continue;
    }
    const actual = hashFile(p);
    if (actual !== expected) {
      problems.push("hash drift: " + relPath + "\n  expected " + expected + "\n  actual   " + actual);
    }
  }

  const currentMaps = listFeatureMaps();
  for (const p of currentMaps) {
    if (!entries.has(p)) problems.push("unlocked feature map: " + p);
  }
  for (const p of entries.keys()) {
    if (p.startsWith(FEATURE_MAP_DIR + "/") && currentMaps.indexOf(p) < 0) {
      problems.push("locked feature map missing: " + p);
    }
  }

  for (const rel of PROTECTED) {
    if (!entries.has(rel)) problems.push("required protected path not locked: " + rel);
  }

  if (problems.length) {
    fail(
      [
        "Immutable spec check failed.",
        problems.join("\n"),
        "",
        "Agent / make-green path cannot rewrite protected specs.",
        "Regenerate only for intentional human changes:",
        "  ADE_ALLOW_SPEC_MUTATION=1 node extension/scripts/check-immutable-specs.js --write --allow-spec-mutation",
      ].join("\n")
    );
  }

  console.log("Immutable specs OK (" + entries.size + " files).");
}

function write() {
  if (!allow) {
    fail("--write requires ADE_ALLOW_SPEC_MUTATION=1 or --allow-spec-mutation");
  }

  const entries = new Map();
  for (const relPath of protectedPaths()) {
    const p = abs(relPath);
    if (!fs.existsSync(p)) fail("cannot lock missing file: " + relPath);
    entries.set(relPath, hashFile(p));
  }

  fs.mkdirSync(path.dirname(MANIFEST_ABS), { recursive: true });
  fs.writeFileSync(MANIFEST_ABS, serialize(entries));
  console.log("Wrote " + MANIFEST_REL + " (" + entries.size + " files).");
}

function runGateWrite() {
  if (!gateWritePath) fail("--gate-write requires a path argument");
  let decision;
  try {
    decision = classifyWrite(gateWritePath);
  } catch (err) {
    fail("gate-write: " + (err && err.message ? err.message : String(err)));
  }
  const line = JSON.stringify(decision);
  if (decision.allowed) {
    console.log(line);
    process.exit(0);
  }
  console.error(line);
  process.exit(1);
}

function runSelfTest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "graphide-immutable-"));
  try {
    const relPath = "extension/scripts/check-map.js";
    const src = abs(relPath);
    const copy = path.join(tmp, "check-map.js");

    fs.copyFileSync(src, copy);

    const entries = new Map([[relPath, hashFile(copy)]]);
    const manifestPath = path.join(tmp, "immutable-specs.lock");
    fs.writeFileSync(manifestPath, serialize(entries));

    const parsed = parseManifest(fs.readFileSync(manifestPath, "utf8"));
    assert.equal(parsed.seal, sealOf(parsed.entries), "self-test seal mismatch");
    assert.equal(hashFile(copy), parsed.entries.get(relPath), "self-test copy hash mismatch");

    fs.appendFileSync(copy, "\n// tamper\n");
    assert.notEqual(hashFile(copy), parsed.entries.get(relPath), "self-test failed to detect mutation");

    const missingEntries = new Map([["no-such-protected.js", "0".repeat(64)]]);
    const missingSeal = sealOf(missingEntries);
    assert.equal(missingSeal.length, 64, "self-test seal length");

    // FS sandbox stub policy
    const deny = classifyWrite(FEATURE_MAP_DIR + "/immutable-harness.md", { allow: false });
    assert.equal(deny.allowed, false, "self-test sealed path must deny without unlock");
    assert.equal(deny.class, "sealed", "self-test sealed class");

    const unlock = classifyWrite(FEATURE_MAP_DIR + "/immutable-harness.md", { allow: true });
    assert.equal(unlock.allowed, true, "self-test sealed path must allow with unlock");
    assert.equal(unlock.class, "unlock", "self-test unlock class");

    const media = classifyWrite("extension/media/main.js", { allow: false });
    assert.equal(media.allowed, true, "self-test media path must stay agent-writable");
    assert.equal(media.class, "agent", "self-test media class");

    const lockDeny = classifyWrite(MANIFEST_REL, { allow: false });
    assert.equal(lockDeny.allowed, false, "self-test lock file must be sealed");

    const other = classifyWrite("verification/report.md", { allow: false });
    assert.equal(other.allowed, true, "self-test non-sealed path allowed");

    console.log("Immutable specs self-test OK.");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function main() {
  if (selfTest && writeMode) fail("use --self-test OR --write, not both");
  if (selfTest && gateWriteIdx >= 0) fail("use --self-test OR --gate-write, not both");
  if (writeMode && gateWriteIdx >= 0) fail("use --write OR --gate-write, not both");
  if (selfTest) runSelfTest();
  else if (writeMode) write();
  else if (gateWriteIdx >= 0) runGateWrite();
  else verify();
}

module.exports = {
  ROOT,
  MANIFEST_REL,
  ALLOW_ENV,
  AGENT_WRITABLE_PREFIX,
  protectedPaths,
  sealedSet,
  normalizeRel,
  classifyWrite,
  isAgentWritableRel,
};

if (require.main === module) {
  main();
}
