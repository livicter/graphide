#!/usr/bin/env node
/**
 * Static activation gate: contributed commands/views have handlers, CSP stays strict.
 * Does not launch an Extension Host.
 *
 *   node scripts/check-activation.js
 */
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

console.log("PASS check-activation · " + commands.length + " commands · CSP nonce · Review view");
