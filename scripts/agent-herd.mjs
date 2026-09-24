#!/usr/bin/env node
/**
 * Agent drive for one Review cut.
 * Starts `graphide review` (same argv as the extension), prints herd rows,
 * and with --wait exits 0 when the focused cut is blocked or 2 when the
 * review settled and that cut is not blocked.
 * Agents never stamp. This file does not spawn `graphide stamp`.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultRunName, focusedCut, herdCuts } from "../extension/media/src/graph/herd.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function usage() {
  return [
    "usage: node scripts/agent-herd.mjs --root <dir> [--focus <flow>] [--wait] [--json] [--no-parent] [--parent <dir>] [--snap <file>] [--program <index>]",
    "  --wait  exit 0 when the focused cut is blocked; exit 2 when review settled and it is not",
    "  --snap  read a snapshot instead of spawning graphide review (fixture proof)",
  ].join("\n");
}

function parseArgs(argv) {
  const out = { wait: false, json: false, noParent: false, focus: "", root: "", parent: "", snap: "", program: "" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--wait") out.wait = true;
    else if (a === "--json") out.json = true;
    else if (a === "--no-parent") out.noParent = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--root") out.root = argv[++i] || "";
    else if (a === "--parent") out.parent = argv[++i] || "";
    else if (a === "--focus") out.focus = argv[++i] || "";
    else if (a === "--snap") out.snap = argv[++i] || "";
    else if (a === "--program") out.program = argv[++i] || "";
    else if (a === "--stamp" || a === "stamp") {
      throw new Error("agents never stamp");
    } else {
      throw new Error("unknown arg " + a);
    }
  }
  return out;
}

function findGraphide() {
  const env = process.env.GRAPHIDE;
  if (env && fs.existsSync(env)) return env;
  const debug = path.join(ROOT, "target", "debug", "graphide");
  if (fs.existsSync(debug)) return debug;
  const release = path.join(ROOT, "target", "release", "graphide");
  if (fs.existsSync(release)) return release;
  return "graphide";
}

function reviewSnapshot(opts) {
  if (opts.snap) {
    const text = fs.readFileSync(opts.snap, "utf8");
    return JSON.parse(text);
  }
  if (!opts.root) throw new Error("pass --root or --snap");
  const bin = findGraphide();
  const args = ["review", "--root", opts.root, "--json", "--progress"];
  if (opts.noParent) args.push("--no-parent");
  if (opts.parent) args.push("--parent", opts.parent);
  const r = spawnSync(bin, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: 5 * 60 * 1000,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    throw new Error("graphide review failed (" + r.status + "): " + String(r.stderr || r.stdout || "").slice(-600));
  }
  const text = String(r.stdout || "").trim();
  if (!text) throw new Error("graphide review wrote an empty snapshot");
  return JSON.parse(text);
}

function report(snapshot, opts) {
  const programs = snapshot.programs || [];
  let program = null;
  if (opts.program !== "") {
    const i = Number(opts.program);
    if (!Number.isInteger(i) || !programs[i]) throw new Error("program index out of range");
    program = programs[i];
  }
  const focusName = opts.focus || defaultRunName(snapshot, "");
  const cuts = herdCuts({
    snapshot,
    skipped: snapshot.skipped || [],
    stamps: snapshot.stamps || [],
    flowName: opts.focus || "",
    defaultRunName: defaultRunName(snapshot, opts.focus || ""),
    program,
  });
  const cut = focusedCut(cuts, focusName);
  if (!cut) throw new Error("focused cut not in herd: " + (focusName || "(default)"));
  const status = cut.state === "blocked" ? "blocked" : "settled";
  return { focus: cut.flow || cut.label, state: cut.state, status, cuts };
}

function printReport(rep, asJson) {
  if (asJson) {
    process.stdout.write(JSON.stringify(rep) + "\n");
    return;
  }
  process.stdout.write("focus\t" + rep.focus + "\t" + rep.state + "\n");
  for (const c of rep.cuts) {
    process.stdout.write([c.label, c.kind, c.state].join("\t") + "\n");
  }
  process.stdout.write("status\t" + rep.status + "\n");
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    process.stderr.write(String(e.message || e) + "\n" + usage() + "\n");
    process.exit(1);
  }
  if (opts.help) {
    process.stdout.write(usage() + "\n");
    process.exit(0);
  }
  let rep;
  try {
    rep = report(reviewSnapshot(opts), opts);
  } catch (e) {
    process.stderr.write(String(e.message || e) + "\n");
    process.exit(1);
  }
  printReport(rep, opts.json);
  if (!opts.wait) process.exit(0);
  process.exit(rep.status === "blocked" ? 0 : 2);
}

main();
