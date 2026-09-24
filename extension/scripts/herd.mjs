#!/usr/bin/env node
/**
 * Start a Review derive, or report herd state from a snapshot.
 * Exit 0 when the attended row is blocked. Exit 3 when the herd settled otherwise.
 * Agents never stamp.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { herd } from "../media/src/graph/herd.mjs";

export function reviewArgv(root, opts) {
  const args = ["review", "--root", root, "--json", "--progress"];
  if (opts && opts.noParent && opts.parent) {
    throw new Error("pass only one of --parent and --no-parent");
  }
  if (opts && opts.noParent) args.push("--no-parent");
  else if (opts && opts.parent) args.push("--parent", opts.parent);
  for (const f of (opts && opts.flows) || []) {
    if (f) args.push("--flow", f);
  }
  return args;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");

function parse(argv) {
  const o = { skip: [], flow: [], snapshot: "", root: "", focus: "", parent: "", noParent: false, cli: "", progress: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error("missing value for " + a);
      return v;
    };
    if (a === "--snapshot") o.snapshot = next();
    else if (a === "--root") o.root = next();
    else if (a === "--focus" || a === "--cut") o.focus = next();
    else if (a === "--skip" || a === "--skipped") o.skip.push(next());
    else if (a === "--flow") o.flow.push(next());
    else if (a === "--parent") o.parent = next();
    else if (a === "--no-parent") o.noParent = true;
    else if (a === "--cli") o.cli = next();
    else if (a === "--progress") o.progress = true;
    else if (a === "--help" || a === "-h") o.help = true;
    else throw new Error("unknown argument " + a);
  }
  return o;
}

function deskFromSnap(snap, skip) {
  const stamps = (snap && snap.stamps) || [];
  const skipped = (snap && snap.skipped) || [];
  const hostSkip = skip.concat(skipped);
  return {
    flows: (snap && snap.flows) || [],
    stamps,
    snapshotStamps: stamps,
    skipped: hostSkip,
    snapshotSkipped: skipped,
    findings: (snap && snap.findings) || [],
    progress: false,
  };
}

function report(rows, focus) {
  const blocked = rows.filter((r) => r.state === "blocked" && r.name !== "review").map((r) => r.name);
  let attended = focus || null;
  if (!attended) attended = blocked[0] || null;
  return { rows, blocked, focus: attended };
}

function exitFor(rep, focus) {
  if (focus) {
    const row = rep.rows.find((r) => r.name === focus);
    if (!row) return 2;
    return row.state === "blocked" ? 0 : 3;
  }
  return rep.blocked.length ? 0 : 3;
}

function findCli(flag) {
  if (flag) return flag;
  if (process.env.GRAPHIDE_BIN) return process.env.GRAPHIDE_BIN;
  const debug = path.join(repo, "target", "debug", "graphide");
  const release = path.join(repo, "target", "release", "graphide");
  if (existsSync(debug)) return debug;
  if (existsSync(release)) return release;
  return "graphide";
}

function derive(cli, args, mirror) {
  return new Promise((resolve, reject) => {
    const child = spawn(cli, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (b) => {
      out += b;
    });
    child.stderr.on("data", (b) => {
      err += b;
      if (mirror) process.stderr.write(b);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(err.trim() || "graphide review exited " + code));
        return;
      }
      const start = out.indexOf("{");
      if (start < 0) {
        reject(new Error("graphide review wrote no snapshot"));
        return;
      }
      try {
        resolve(JSON.parse(out.slice(start)));
      } catch (e) {
        reject(e);
      }
    });
  });
}

export async function runHerd(argv, io = {}) {
  const stdout = io.stdout || process.stdout;
  let opt;
  try {
    opt = parse(argv);
  } catch (e) {
    process.stderr.write(String(e.message || e) + "\n");
    return 2;
  }
  if (opt.help || (!opt.snapshot && !opt.root) || (opt.snapshot && opt.root)) {
    process.stderr.write(
      "usage: node extension/scripts/herd.mjs (--snapshot <file> | --root <dir>) [--focus <name>] [--skip <name>]... [--flow <hint>]... [--parent <dir>] [--no-parent] [--progress] [--cli <path>]\n"
    );
    return 2;
  }
  if (opt.parent && opt.noParent) {
    process.stderr.write("pass only one of --parent and --no-parent\n");
    return 2;
  }
  let snap;
  try {
    if (opt.snapshot) {
      snap = JSON.parse(readFileSync(opt.snapshot, "utf8"));
    } else {
      const root = String(opt.root || "").trim();
      if (!root) {
        process.stderr.write("Open a workspace folder\n");
        return 2;
      }
      const args = reviewArgv(root, {
        parent: opt.parent || undefined,
        noParent: opt.noParent,
        flows: opt.flow,
      });
      snap = await derive(opt.cli || findCli(""), args, opt.progress);
    }
  } catch (e) {
    process.stderr.write(String(e.message || e) + "\n");
    return opt.snapshot ? 2 : 1;
  }
  const rows = herd(deskFromSnap(snap, opt.skip));
  const rep = report(rows, opt.focus);
  const code = exitFor(rep, opt.focus);
  if (code === 2) {
    process.stderr.write("focus is not a herd row: " + opt.focus + "\n");
    return 2;
  }
  stdout.write(JSON.stringify(rep) + "\n");
  return code;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runHerd(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      process.stderr.write(String(e && e.stack ? e.stack : e) + "\n");
      process.exit(1);
    }
  );
}
