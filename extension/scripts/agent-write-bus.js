#!/usr/bin/env node
"use strict";

/**
 * ADE Phase 1 — Agent write-bus stub.
 * Routes a purported agent write through classifyWrite (sealed allowlist).
 * Not an OS interceptor and not a Node fs monkey-patch.
 *
 * Usage:
 *   node extension/scripts/agent-write-bus.js --path <rel> [--content <str>|--stdin]
 *       [--out <abs-scratch>] [--apply] [--dry-run]
 *
 * Classify always uses --path (repo-relative). A write lands only when allowed
 * and either --out (scratch) or --apply (repo path) is set. Default is
 * consult-only (JSON decision, exit 0/1) like --gate-write.
 */

const fs = require("node:fs");
const path = require("node:path");
const {
  ROOT,
  ALLOW_ENV,
  classifyWrite,
  normalizeRel,
} = require("./check-immutable-specs");

const args = process.argv.slice(2);
const argSet = new Set(args);

function flagValue(name) {
  const i = args.indexOf(name);
  if (i < 0) return null;
  const v = args[i + 1];
  if (v == null || v.startsWith("--")) {
    fail(name + " requires a value");
  }
  return v;
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function readContent() {
  if (argSet.has("--stdin")) {
    return fs.readFileSync(0);
  }
  const c = flagValue("--content");
  if (c != null) return Buffer.from(String(c), "utf8");
  return null;
}

/**
 * Domain shape: one WriteIntent → one WriteResult.
 * @returns {{ ok: boolean, decision: object, wrote: boolean, dest: string|null, bytes: number }}
 */
function proposeWrite(intent) {
  const decision = classifyWrite(intent.path, { allow: intent.allow });
  const result = {
    ok: !!decision.allowed,
    decision,
    wrote: false,
    dest: null,
    bytes: 0,
  };
  if (!decision.allowed) return result;
  if (intent.dryRun || (!intent.out && !intent.apply)) return result;

  if (intent.content == null) {
    throw new Error("write requires --content or --stdin");
  }
  const buf = Buffer.isBuffer(intent.content)
    ? intent.content
    : Buffer.from(String(intent.content), "utf8");

  let dest;
  if (intent.out) {
    dest = path.resolve(intent.out);
  } else {
    dest = path.join(ROOT, normalizeRel(intent.path));
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  result.wrote = true;
  result.dest = dest;
  result.bytes = buf.length;
  return result;
}

function main() {
  const relPath = flagValue("--path");
  if (!relPath) fail("--path <repo-relative> is required");

  const out = flagValue("--out");
  const apply = argSet.has("--apply");
  const dryRun = argSet.has("--dry-run");
  if (out && apply) fail("use --out OR --apply, not both");
  if (dryRun && (out || apply)) fail("--dry-run cannot combine with --out/--apply");

  const allow =
    process.env[ALLOW_ENV] === "1" || argSet.has("--allow-spec-mutation");

  let content = null;
  try {
    content = readContent();
  } catch (err) {
    fail("content: " + (err && err.message ? err.message : String(err)));
  }

  let result;
  try {
    result = proposeWrite({
      path: relPath,
      content,
      out,
      apply,
      dryRun,
      allow,
    });
  } catch (err) {
    fail("write-bus: " + (err && err.message ? err.message : String(err)));
  }

  const line = JSON.stringify(result);
  if (!result.ok) {
    console.error(line);
    process.exit(1);
  }
  console.log(line);
  process.exit(0);
}

module.exports = {
  proposeWrite,
};

if (require.main === module) {
  main();
}
