#!/usr/bin/env node
"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EXT = path.join(ROOT, "extension");

function fail(msg) {
  console.error("FAIL package · " + msg);
  process.exit(1);
}

function run(cmd, args, cwd) {
  console.log("+", cmd, args.join(" "), "(in " + path.relative(ROOT, cwd) + ")");
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", env: process.env });
  if (r.status !== 0) fail(cmd + " " + args.join(" ") + " exited " + r.status);
}

function exists(p) {
  return fs.existsSync(p);
}

function exeName() {
  return process.platform === "win32" ? "graphide.exe" : "graphide";
}

function findBuiltCli() {
  const name = exeName();
  const release = path.join(ROOT, "target", "release", name);
  const debug = path.join(ROOT, "target", "debug", name);
  if (exists(release)) return release;
  if (exists(debug)) return debug;
  return null;
}

if (!exists(path.join(EXT, "package-lock.json"))) fail("extension/package-lock.json missing");
if (!exists(path.join(EXT, "node_modules"))) {
  run("npm", ["ci"], EXT);
}

const esbuild = path.join(ROOT, "node_modules", "esbuild", "bin", "esbuild");
if (exists(esbuild)) {
  run(process.execPath, [path.join(EXT, "scripts", "build-webview.mjs")], ROOT);
} else {
  const mainJs = path.join(EXT, "media", "main.js");
  if (!exists(mainJs)) fail("extension/media/main.js missing and root node_modules/esbuild is not installed");
  console.log("skip webview rebuild (no root esbuild); using committed", path.relative(ROOT, mainJs));
}

for (const rel of ["media/main.js", "media/main.css", "media/xyflow.css", "media/icon.svg"]) {
  const p = path.join(EXT, rel);
  if (!exists(p)) fail("missing " + rel);
}

if (!findBuiltCli()) {
  run("cargo", ["build", "-p", "graphide-cli", "--release"], ROOT);
}
if (!findBuiltCli()) fail("cargo did not write target/release/" + exeName());

run(process.execPath, [path.join(EXT, "scripts", "bundle-cli.js")], ROOT);
const bundled = path.join(EXT, "bin", exeName());
if (!exists(bundled)) fail("bundle-cli did not write " + path.relative(ROOT, bundled));

run("npm", ["run", "compile"], EXT);
if (!exists(path.join(EXT, "out", "extension.js"))) fail("tsc did not write extension/out/extension.js");

run(
  path.join(EXT, "node_modules", ".bin", process.platform === "win32" ? "vsce.cmd" : "vsce"),
  ["package", "--no-dependencies", "--allow-missing-repository"],
  EXT
);

run(process.execPath, [path.join(ROOT, "scripts", "check-package.js")], ROOT);
run(process.execPath, [path.join(ROOT, "scripts", "check-activation.js")], ROOT);
console.log("PASS package · VSIX ready in extension/");
