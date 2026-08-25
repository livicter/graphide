#!/usr/bin/env node
/** Static checks for the LLM bridge. Run: node extension/scripts/check-llm.js */
const fs = require("fs");
const path = require("path");
const js = fs.readFileSync(path.join(__dirname, "../media/main.js"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "../media/main.css"), "utf8");
const ext = fs.readFileSync(path.join(__dirname, "../src/extension.ts"), "utf8");
const llm = fs.readFileSync(path.join(__dirname, "../src/llm.ts"), "utf8");
const bridge = fs.readFileSync(path.join(__dirname, "../src/bridge.ts"), "utf8");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

assert(js.includes("function sendLlmAsk"), "Ask send helper missing");
assert(js.includes("function localAsk"), "graph-only Ask fallback missing");
assert(js.includes("Agents never stamp"), "Ask must say agents never stamp");
assert(js.includes("Start → features → end"), "Ask must tell the feature path");
assert(css.includes("#llmPane"), "Ask panel styles missing");
assert(ext.includes("graphide.connectLlm"), "Connect LLM command missing");
assert(ext.includes("graphide.showBridgeKey"), "bridge key command missing");
assert(ext.includes("function startBridge") || ext.includes('from "./bridge"'), "bridge import missing");
assert(llm.includes("OpenAI-compatible") || llm.includes("/chat/completions"), "OpenAI-compatible client missing");
assert(llm.includes("http://127.0.0.1:11434/v1"), "Ollama preset missing");
assert(llm.includes("1234/v1"), "LM Studio preset missing");
assert(bridge.includes("/v1/chat/completions"), "inbound OpenAI route missing");
assert(bridge.includes("/v1/review"), "inbound review route missing");
assert(bridge.includes("Agents never stamp"), "bridge must refuse stamp");
assert(!/sigma|forceatlas|sparql|shacl/i.test(llm), "LLM module must not port Semantica engines");
assert(!/writeStamp\(/.test(bridge), "bridge must not call stamp");
console.log("ok llm static checks");
