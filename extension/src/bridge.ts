/** Local HTTP bridge so any LLM client can connect to this review with an API key.
 *  Binds 127.0.0.1 by default. Never exposes stamp. */
import * as http from "http";
import * as crypto from "crypto";
import {
  askReview,
  groundedFallback,
  llmConfigured,
  LlmConfig,
  reviewBrief,
  systemPrompt,
} from "./llm";

export type BridgeOpts = {
  host: string;
  port: number;
  token: string;
  getSnapshot: () => any;
  getFlowName: () => string | undefined;
  getLlm: () => LlmConfig;
  fetchImpl?: typeof fetch;
};

export type BridgeHandle = {
  server: http.Server;
  url: string;
  host: string;
  port: number;
};

const MAX_BODY = 256 * 1024;

export function newBridgeToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function readToken(req: http.IncomingMessage): string {
  const auth = String(req.headers.authorization || "");
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (m) return m[1].trim();
  const alt = req.headers["x-graphide-key"] || req.headers["x-api-key"];
  return String(Array.isArray(alt) ? alt[0] : alt || "").trim();
}

function send(res: http.ServerResponse, status: number, body: any, extra?: Record<string, string>) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(json),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Graphide-Key, X-Api-Key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    ...(extra || {}),
  });
  res.end(json);
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let n = 0;
    req.on("data", (c) => {
      n += c.length;
      if (n > MAX_BODY) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function noStamp(url: string): boolean {
  return !/stamp|skip-flow|writeStamp/i.test(url);
}

export function startBridge(opts: BridgeOpts): Promise<BridgeHandle> {
  const host = opts.host || "127.0.0.1";
  const want = Math.max(1, Number(opts.port) || 8787);

  const handler = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const url = String(req.url || "/").split("?")[0];
    if (req.method === "OPTIONS") {
      send(res, 204, {});
      return;
    }
    if (!noStamp(url)) {
      send(res, 403, { error: "Agents never stamp. There is no stamp route." });
      return;
    }
    if (url === "/health" && req.method === "GET") {
      const llm = opts.getLlm();
      send(res, 200, {
        ok: true,
        app: "graphide",
        review: !!opts.getSnapshot(),
        llm: llmConfigured(llm),
        host: normalizeHost(host),
      });
      return;
    }
    const token = readToken(req);
    if (!opts.token || !safeEqual(token, opts.token)) {
      send(res, 401, { error: "Unauthorized. Use Authorization: Bearer <graphide.bridge key>." });
      return;
    }
    const snap = opts.getSnapshot();
    const flowName = opts.getFlowName();
    try {
      if (url === "/v1/review" && req.method === "GET") {
        send(res, 200, snap ? reviewBrief(snap, flowName) : { error: "No review yet" });
        return;
      }
      if (url === "/v1/path" && req.method === "GET") {
        const brief = snap ? reviewBrief(snap, flowName) : null;
        send(res, 200, { path: brief ? brief.path : [], hops: brief ? brief.hops : [] });
        return;
      }
      if (url === "/v1/coverage" && req.method === "GET") {
        send(res, 200, snap ? reviewBrief(snap, flowName).coverage : { changed: 0, uncovered: 0 });
        return;
      }
      if (url === "/v1/flows" && req.method === "GET") {
        send(res, 200, { flows: ((snap && snap.flows) || []).map((f: any) => f.name) });
        return;
      }
      if (url === "/v1/ask" && req.method === "POST") {
        const body = JSON.parse((await readBody(req)) || "{}");
        const prompt = String(body.prompt || body.question || "");
        if (!snap) {
          send(res, 409, { error: "Review a repo first." });
          return;
        }
        const result = await askReview(snap, prompt, opts.getLlm(), body.flow || flowName, {
          fetchImpl: opts.fetchImpl,
        });
        send(res, 200, result);
        return;
      }
      if (url === "/v1/chat/completions" && req.method === "POST") {
        const body = JSON.parse((await readBody(req)) || "{}");
        const messages = Array.isArray(body.messages) ? body.messages : [];
        const lastUser = [...messages].reverse().find((m: any) => m && m.role === "user");
        const question = lastUser ? String(lastUser.content || "") : "Tell the start → features → end path.";
        if (!snap) {
          send(res, 409, { error: "Review a repo first." });
          return;
        }
        const llm = opts.getLlm();
        const result = await askReview(snap, question, { ...llm, model: body.model || llm.model }, flowName, {
          fetchImpl: opts.fetchImpl,
        });
        send(res, 200, {
          id: "chatcmpl-graphide",
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: result.model || body.model || "graphide",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: result.text },
              finish_reason: "stop",
            },
          ],
        });
        return;
      }
      if (url === "/v1/models" && req.method === "GET") {
        send(res, 200, {
          object: "list",
          data: [{ id: "graphide-review", object: "model", owned_by: "graphide" }],
        });
        return;
      }
      send(res, 404, {
        error: "Not found",
        routes: ["/health", "/v1/review", "/v1/path", "/v1/coverage", "/v1/flows", "/v1/ask", "/v1/chat/completions"],
      });
    } catch (e: any) {
      send(res, 500, { error: e?.message || String(e) });
    }
  };

  return listenOn(host, want, handler);
}

function normalizeHost(host: string): string {
  return host === "0.0.0.0" || host === "::" ? "127.0.0.1" : host;
}

function listenOn(
  host: string,
  port: number,
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void
): Promise<BridgeHandle> {
  return new Promise((resolve, reject) => {
    const tryPort = (p: number, left: number) => {
      const server = http.createServer((req, res) => {
        void handler(req, res);
      });
      const fail = (err: NodeJS.ErrnoException) => {
        server.off("error", fail);
        if (err.code === "EADDRINUSE" && left > 0) {
          tryPort(p + 1, left - 1);
          return;
        }
        reject(err);
      };
      server.on("error", fail);
      server.listen(p, host, () => {
        server.off("error", fail);
        const addr = server.address();
        const got = typeof addr === "object" && addr ? addr.port : p;
        const shown = normalizeHost(host);
        resolve({ server, host: shown, port: got, url: "http://" + shown + ":" + got + "/v1" });
      });
    };
    tryPort(port, 12);
  });
}

export function stopBridge(handle?: BridgeHandle | null): Promise<void> {
  if (!handle || !handle.server) return Promise.resolve();
  return new Promise((resolve) => {
    handle.server.close(() => resolve());
    setTimeout(resolve, 400);
  });
}

/** Exported for tests that want the system prompt without starting HTTP. */
export function reviewSystemPrompt(snap: any, flowName?: string): string {
  return systemPrompt(snap, flowName);
}

export function graphAnswer(snap: any, question: string, flowName?: string): string {
  return groundedFallback(snap, question, flowName);
}
