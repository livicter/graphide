#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EXT = path.join(ROOT, "extension");
const pkg = JSON.parse(fs.readFileSync(path.join(EXT, "package.json"), "utf8"));
const src = fs.readFileSync(path.join(EXT, "src", "extension.ts"), "utf8");

function fail(msg) {
  console.error("FAIL check-activation · " + msg);
  process.exit(1);
}

const commands = (pkg.contributes.commands || []).map((c) => c.command);
if (!commands.length) fail("package.json has no commands");
for (const id of commands) {
  const needle = 'registerCommand("' + id + '"';
  if (!src.includes(needle)) fail("no registerCommand for " + id);
  console.log("ok   handler", id);
}

const events = pkg.activationEvents || [];
for (const need of ["onView:graphide.reviewView", "onCommand:graphide.review"]) {
  if (!events.includes(need)) fail("activationEvents missing " + need);
}
console.log("ok   activationEvents view+review");

if (!src.includes('viewType = "graphide.reviewView"')) {
  fail("ReviewViewProvider.viewType is not graphide.reviewView");
}
if (!src.includes("registerWebviewViewProvider")) fail("no webview view provider");
console.log("ok   view graphide.reviewView");

const csp = src.match(/Content-Security-Policy" content="([^"]+)"/);
if (!csp) fail("webview HTML has no CSP meta");
const policy = csp[1];
if (!/default-src 'none'/.test(policy)) fail("CSP default-src is not none: " + policy);
if (/unsafe-inline|unsafe-eval/.test(policy)) fail("CSP allows unsafe script/style: " + policy);
if (!/script-src 'nonce-/.test(policy)) fail("CSP script-src is not nonce: " + policy);
console.log("ok   CSP", policy);

if (!src.includes('"media", "main.js"')) fail("webview HTML does not load media/main.js");
if (!src.includes('"media", "main.css"')) fail("webview HTML does not load media/main.css");
console.log("ok   webview loads main.js + main.css");

if (!/function findCli\(/.test(src) || !src.includes('extensionPath, "bin"')) {
  fail("findCli does not look in the packaged bin/");
}
if (!src.includes("missingCliHint")) fail("runReview has no missing-CLI setup path");
console.log("ok   CLI lookup includes extension bin/");

if (/llmConfigured\([^)]*\)\s*;\s*$/m.test(src.slice(src.indexOf("export function activate"), src.indexOf("export async function deactivate")))) {
  fail("activate() requires an LLM config");
}
const activate = src.slice(src.indexOf("export function activate"), src.indexOf("export async function deactivate"));
if (activate.includes("llmConfigured(") && activate.includes("throw")) {
  fail("activate() looks LLM-gated");
}
console.log("ok   activate does not require an LLM");

if (pkg.main !== "./out/extension.js") fail("main is " + pkg.main);

const reviewCmd = src.slice(src.indexOf('registerCommand("graphide.review"'));
if (!reviewCmd.startsWith('registerCommand("graphide.review"') || !reviewCmd.slice(0, 180).includes("runReview(")) {
  fail("graphide.review does not call runReview");
}
if (!src.includes("return reviewFolder(")) fail("packageRoot does not call reviewFolder");
console.log("ok   graphide.review → runReview → reviewFolder");

const compiled = path.join(EXT, "out", "review-folder.js");
if (!fs.existsSync(compiled)) fail("missing " + path.relative(ROOT, compiled) + " (compile the extension first)");
const { reviewFolder } = require(compiled);
const cases = [
  [reviewFolder("  /opt/pkg  ", "/ws"), "/opt/pkg"],
  [reviewFolder("", "/ws/app"), "/ws/app"],
  [reviewFolder(undefined, "/ws/app"), "/ws/app"],
];
for (const [got, want] of cases) {
  if (got !== want) fail("reviewFolder returned " + JSON.stringify(got) + " want " + JSON.stringify(want));
}
let threw = "";
try {
  reviewFolder("  ", undefined);
} catch (e) {
  threw = e && e.message ? e.message : String(e);
}
if (threw !== "Open a workspace folder") fail("empty folder threw " + JSON.stringify(threw));
console.log("ok   reviewFolder config then workspace");

const rulePath = path.join(ROOT, ".cursor", "rules", "prefer-herd.mdc");
const rule = fs.readFileSync(rulePath, "utf8");
if (!/^alwaysApply:\s*true\s*$/m.test(rule)) fail("prefer-herd.mdc is not alwaysApply");
if (!/herd/i.test(rule) || !/grep/.test(rule)) fail("prefer-herd.mdc does not prefer herd over grep");
const agents = fs.readFileSync(path.join(ROOT, "AGENTS.md"), "utf8");
if (!agents.includes(".cursor/rules/prefer-herd.mdc")) fail("AGENTS.md does not reference prefer-herd.mdc");
console.log("ok   prefer-herd always-on and referenced");

const proofDir = path.join(ROOT, "verification");
fs.mkdirSync(proofDir, { recursive: true });
const proof = [
  "PASS plugin-packaging",
  "command: graphide.review → runReview → packageRoot → reviewFolder",
  "reviewFolder(\"  /opt/pkg  \", \"/ws\") = /opt/pkg",
  "reviewFolder(\"\", \"/ws/app\") = /ws/app",
  "reviewFolder(undefined, \"/ws/app\") = /ws/app",
  "reviewFolder(\"  \", undefined) throws Open a workspace folder",
  "rule: .cursor/rules/prefer-herd.mdc alwaysApply true",
  "referenced: AGENTS.md",
  "activation: onCommand:graphide.review onView:graphide.reviewView",
  "extension host: not launched",
  "",
].join("\n");
fs.writeFileSync(path.join(proofDir, "plugin-packaging.txt"), proof);
console.log("ok   verification/plugin-packaging.txt");

console.log("PASS check-activation · " + commands.length + " commands · CSP nonce · Review view · open-folder · prefer-herd");
