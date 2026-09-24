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

if (commands.includes("graphide.reviewFolder")) {
  fail("graphide.reviewFolder is a second command; reuse graphide.review");
}
if (!src.includes("async reviewFolder(")) fail("reviewFolder is missing");
if (!src.includes("provider.reviewFolder(target)")) {
  fail("graphide.review does not call reviewFolder");
}
if (!src.includes("this.reviewRoot || packageRoot()")) {
  fail("runReview does not fall back to packageRoot()");
}
if (!src.includes("function resolveReviewFolder(")) fail("resolveReviewFolder is missing");
if (!src.includes("function packageRoot(")) fail("packageRoot is missing");
const reviewBody = src.slice(src.indexOf("async reviewFolder("), src.indexOf("async runReview("));
if (reviewBody.includes("writeStamp")) fail("reviewFolder calls writeStamp");
console.log("ok   graphide.review → reviewFolder → packageRoot");

const menus = ((((pkg.contributes || {}).menus || {})["explorer/context"]) || []);
const folderMenu = menus.find(
  (m) => m.command === "graphide.review" && m.when === "explorerResourceIsFolder"
);
if (!folderMenu) fail("explorer/context does not reuse graphide.review for folders");
console.log("ok   explorer folder menu reuses graphide.review");

const rulePath = path.join(ROOT, ".cursor", "rules", "prefer-herd.mdc");
const skillPath = path.join(ROOT, ".cursor", "skills", "prefer-herd", "SKILL.md");
const agentsPath = path.join(ROOT, "AGENTS.md");
if (!fs.existsSync(rulePath)) fail("missing .cursor/rules/prefer-herd.mdc");
if (!fs.existsSync(skillPath)) fail("missing prefer-herd skill");
const rule = fs.readFileSync(rulePath, "utf8");
const skill = fs.readFileSync(skillPath, "utf8");
const agents = fs.readFileSync(agentsPath, "utf8");
if (!/alwaysApply:\s*true/.test(rule)) fail("prefer-herd rule is not alwaysApply");
for (const needle of ["herd", "report", "grep"]) {
  if (!rule.toLowerCase().includes(needle)) fail("prefer-herd rule missing " + needle);
}
if (!/never stamp/i.test(rule) || !rule.includes(".graphide/stamps/")) {
  fail("prefer-herd rule does not forbid stamps");
}
if (!/never stamp/i.test(skill)) fail("prefer-herd skill does not forbid stamps");
if (!skill.includes("programs") || !skill.includes("findings")) {
  fail("prefer-herd skill does not name the report fields");
}
if (!agents.includes("prefer-herd") || !/never stamp/i.test(agents)) {
  fail("AGENTS.md does not point at prefer-herd");
}
console.log("ok   always-on prefer-herd rule + skill");

const vsixDir = fs.readdirSync(path.join(ROOT, "extension")).filter((n) => /^graphide-.*\.vsix$/.test(n));
const vsixLine = vsixDir.length
  ? vsixDir.sort().map((n) => "`extension/" + n + "`").join(", ")
  : "(no VSIX in tree yet — `npm run package` writes it and `check:package` gates it)";

const proof = [
  "# Plugins packaging",
  "",
  "PASS check-activation · graphide.review → reviewFolder → packageRoot()",
  "",
  "- Command `graphide.review` calls `reviewFolder`. No `graphide.reviewFolder` command.",
  "- Explorer context `explorerResourceIsFolder` reuses `graphide.review`.",
  "- `runReview` root is `this.reviewRoot || packageRoot()`.",
  "- `reviewFolder` does not call `writeStamp`. Agents never stamp.",
  "- `.cursor/rules/prefer-herd.mdc` is `alwaysApply: true` and prefers the herd and report over grep.",
  "- `.cursor/skills/prefer-herd/SKILL.md` names `programs` / `findings` and forbids stamps.",
  "- VSIX: " + vsixLine,
  "",
].join("\n");
const proofPath = path.join(ROOT, "verification", "plugins-packaging.md");
fs.mkdirSync(path.dirname(proofPath), { recursive: true });
fs.writeFileSync(proofPath, proof);
console.log("ok   wrote", path.relative(ROOT, proofPath));

console.log("PASS check-activation · " + commands.length + " commands · CSP nonce · Review view · reviewFolder · prefer-herd");
