#!/usr/bin/env node
/** Live mock-LLM + inbound bridge checks. Run after compile. */
const http = require("http");
const path = require("path");
const { chatCompletions, groundedFallback, reviewBrief, normalizeBaseUrl, askReview } = require("../out/llm");
const { startBridge, stopBridge, newBridgeToken } = require("../out/bridge");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

const snap = {
  plugin: "rust@0.1.0",
  stats: { nodes: 8, edges: 7 },
  flows: [
    {
      name: "control-flow",
      tree: {
        nodes: ["n0", "n1", "n2"],
        edges: [
          { from: "n0", to: "n1", kind: "Calls" },
          { from: "n1", to: "n2", kind: "Calls" },
        ],
      },
    },
  ],
  graph: {
    nodes: [
      { id: "n0", kind: "Function", fqn: "app::main" },
      { id: "n1", kind: "Function", fqn: "app::boot" },
      { id: "n2", kind: "Endpoint", fqn: "app::sink" },
    ],
    edges: [],
  },
  bubbles: [
    { id: "b-start", label: "render", parent: "root", members: ["n0"] },
    { id: "b-mid", label: "integration", parent: "root", members: ["n1"] },
    { id: "b-end", label: "ui", parent: "root", members: ["n2"] },
    { id: "root", label: "app", parent: null, members: ["n0", "n1", "n2"] },
  ],
  coverage: { changed: ["n0", "n1"], uncovered: ["n1"] },
  findings: [{ kind: "StampBroken", flow: "boot" }],
};

const brief = reviewBrief(snap, "control-flow");
assert(brief.path[0] === "main" && brief.path[brief.path.length - 1] === "sink", "feature path should be hop names: " + brief.path);
assert(normalizeBaseUrl("127.0.0.1:11434") === "http://127.0.0.1:11434/v1", "normalize should add http and /v1");
const graph = groundedFallback(snap, "path");
assert(/Start → features → end: main → boot → sink/.test(graph), graph);
assert(/never stamp/i.test(graph), "fallback must refuse stamp");

const noLlm = askReview(snap, "tell the path", { baseUrl: "", model: "", apiKey: "" });
noLlm.then((r) => {
  assert(r.via === "graph", "empty host must use graph");
});

function startMockLlm() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = req.url || "";
      if (url === "/v1/models") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ data: [{ id: "test-model" }] }));
        return;
      }
      if (url === "/v1/chat/completions") {
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", () => {
          const json = JSON.parse(body || "{}");
          const sys = (json.messages || []).map((m) => m.content).join("\n");
          assert(!/writeStamp|type":"stamp"/.test(sys), "outbound prompt must not stamp");
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              id: "chatcmpl-test",
              model: json.model,
              choices: [{ message: { role: "assistant", content: "START render → END ui. Agents never stamp." } }],
            })
          );
        });
        return;
      }
      res.writeHead(404);
      res.end();
    });
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      resolve({ server, url: "http://127.0.0.1:" + port + "/v1" });
    });
  });
}

async function jsonReq(url, opts) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let body = {};
  try {
    body = JSON.parse(text || "{}");
  } catch (e) {
    body = { raw: text };
  }
  return { status: res.status, body };
}

(async () => {
  const mock = await startMockLlm();
  const chat = await chatCompletions(
    { baseUrl: mock.url, model: "test-model", apiKey: "sk-test" },
    [{ role: "user", content: "path" }]
  );
  assert(chat.via === "llm" && /START render/.test(chat.text), chat.text);

  const asked = await askReview(snap, "path please", { baseUrl: mock.url, model: "test-model", apiKey: "sk-test" });
  assert(asked.via === "llm", "askReview should hit the mock host");

  const token = newBridgeToken();
  const handle = await startBridge({
    host: "127.0.0.1",
    port: 18787,
    token,
    getSnapshot: () => snap,
    getFlowName: () => "control-flow",
    getLlm: () => ({ baseUrl: mock.url, model: "test-model", apiKey: "sk-test" }),
  });
  const root = "http://127.0.0.1:" + handle.port;
  const denied = await jsonReq(root + "/v1/review");
  assert(denied.status === 401, "bridge must require a key: " + denied.status);
  const headers = { Authorization: "Bearer " + token };
  const health = await jsonReq(root + "/health");
  assert(health.status === 200 && health.body.ok && health.body.llm, JSON.stringify(health.body));
  const review = await jsonReq(root + "/v1/review", { headers });
  assert(review.status === 200 && review.body.path && review.body.path[0] === "main", JSON.stringify(review.body.path));
  const ask = await jsonReq(root + "/v1/ask", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "tell the path" }),
  });
  assert(ask.status === 200 && /never stamp/i.test(ask.body.text), JSON.stringify(ask.body));
  const oai = await jsonReq(root + "/v1/chat/completions", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "graphide-review", messages: [{ role: "user", content: "path" }] }),
  });
  assert(oai.status === 200 && oai.body.choices[0].message.content, JSON.stringify(oai.body));
  const stamp = await jsonReq(root + "/v1/stamp", { method: "POST", headers });
  assert(stamp.status === 403, "no stamp route: " + stamp.status);

  await stopBridge(handle);
  mock.server.close();
  await noLlm;
  console.log("ok llm bridge", handle.url, path.basename(__filename));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
