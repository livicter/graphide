import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { herd } from "../media/src/graph/herd.mjs";
import { reviewArgv } from "./herd.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const snapPath = path.join(repo, "fixtures", "herd", "desk.json");
const cli = path.join(here, "herd.mjs");

function deskOf(snap, extra = {}) {
  return {
    flows: snap.flows,
    stamps: snap.stamps,
    snapshotStamps: snap.stamps,
    skipped: (extra.skip || []).concat(snap.skipped || []),
    snapshotSkipped: snap.skipped || [],
    findings: snap.findings,
    progress: !!extra.progress,
  };
}

test("review argv matches the extension helper", () => {
  const ts = readFileSync(path.join(repo, "extension", "src", "review-argv.ts"), "utf8");
  assert.match(ts, /\["review", "--root", root, "--json", "--progress"\]/);
  assert.deepEqual(reviewArgv("/ws", { noParent: true, flows: ["boot=a"] }), [
    "review",
    "--root",
    "/ws",
    "--json",
    "--progress",
    "--no-parent",
    "--flow",
    "boot=a",
  ]);
});

test("explorer desk fixture is boot blocked and legacy done", () => {
  const snap = JSON.parse(readFileSync(snapPath, "utf8"));
  const rows = herd(deskOf(snap));
  assert.deepEqual(
    rows.map((r) => r.name + " " + r.state),
    ["overview idle", "control-flow idle", "boot blocked", "legacy done"]
  );
  const live = herd(deskOf(snap, { progress: true }));
  assert.equal(live[0].name, "review");
  assert.equal(live[0].state, "working");
  assert.equal(live.find((r) => r.name === "boot").state, "blocked");
});

test("unmatched hint blocks a holding stamp; skip does not hide that finding", () => {
  const rows = herd({
    flows: [{ name: "boot" }],
    stamps: [{ name: "boot", holds: true }],
    skipped: ["boot"],
    findings: [{ kind: { kind: "UnmatchedHint" }, flow: "boot", fqn: "x" }],
  });
  assert.equal(rows[0].state, "blocked");
});

test("herd command reports the fixture and refuses a missing focus", () => {
  const ok = spawnSync(process.execPath, [cli, "--snapshot", snapPath, "--focus", "boot"], {
    encoding: "utf8",
  });
  assert.equal(ok.status, 0, ok.stderr);
  const rep = JSON.parse(ok.stdout);
  assert.deepEqual(rep.blocked, ["boot"]);
  assert.equal(rep.focus, "boot");
  const idle = spawnSync(process.execPath, [cli, "--snapshot", snapPath, "--focus", "overview"], {
    encoding: "utf8",
  });
  assert.equal(idle.status, 3, idle.stderr);
  const missing = spawnSync(process.execPath, [cli, "--snapshot", snapPath, "--focus", "nope"], {
    encoding: "utf8",
  });
  assert.equal(missing.status, 2);
  const both = spawnSync(process.execPath, [cli, "--snapshot", snapPath, "--root", repo], { encoding: "utf8" });
  assert.equal(both.status, 2);
});

test("herd --root waits on graphide review and does not stamp", () => {
  const bin = [path.join(repo, "target", "debug", "graphide"), path.join(repo, "target", "release", "graphide")].find(
    (p) => existsSync(p)
  );
  assert.ok(bin, "graphide binary missing; cargo build -p graphide-cli");
  const stampDir = path.join(repo, "fixtures", "demo", ".graphide", "stamps");
  assert.equal(existsSync(stampDir), false);
  const run = spawnSync(
    process.execPath,
    [cli, "--root", path.join(repo, "fixtures", "demo"), "--no-parent", "--cli", bin],
    { encoding: "utf8" }
  );
  assert.ok(run.status === 0 || run.status === 3, run.stderr);
  const rep = JSON.parse(run.stdout);
  assert.ok(Array.isArray(rep.rows) && rep.rows.length > 0, run.stdout);
  assert.equal(existsSync(stampDir), false);
  const proof = [
    "PASS herd-wait",
    "snapshot: " + path.relative(repo, snapPath),
    "fixture: overview idle, control-flow idle, boot blocked, legacy done",
    "command: node extension/scripts/herd.mjs --snapshot fixtures/herd/desk.json --focus boot",
    "exit: 0 blocked, 3 settled, 2 usage",
    "root: " + path.relative(repo, path.join(repo, "fixtures", "demo")) + " exit " + run.status,
    "rows: " + rep.rows.map((r) => r.name + ":" + r.state).join(", "),
    "stamps: not written",
    "",
  ].join("\n");
  const out = path.join(repo, "verification");
  mkdirSync(out, { recursive: true });
  writeFileSync(path.join(out, "herd-wait.txt"), proof);
});
