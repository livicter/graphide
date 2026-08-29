/** Review-grounded LLM client. OpenAI-compatible (Ollama, LM Studio, llama.cpp, OpenAI, Groq).
 *  Does not stamp. Does not invent IR nodes or edges. */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
};

export type ChatResult = {
  text: string;
  model: string;
  via: "llm" | "graph";
};

const CLOSED_NODES = "Function | Type | Endpoint";
const CLOSED_EDGES = "Calls | Reads | Writes | Imports | TypeUses | Contains | Publishes | Subscribes";

export const LLM_PRESETS: { id: string; label: string; baseUrl: string; model: string }[] = [
  { id: "ollama", label: "Local Ollama", baseUrl: "http://127.0.0.1:11434/v1", model: "llama3.2" },
  { id: "lmstudio", label: "Local LM Studio", baseUrl: "http://127.0.0.1:1234/v1", model: "local-model" },
  { id: "llamacpp", label: "Local llama.cpp", baseUrl: "http://127.0.0.1:8080/v1", model: "local-model" },
  { id: "openai", label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  { id: "custom", label: "Custom OpenAI-compatible", baseUrl: "http://127.0.0.1:11434/v1", model: "" },
];

export function normalizeBaseUrl(raw: string): string {
  let u = String(raw || "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = "http://" + u;
  u = u.replace(/\/+$/, "");
  if (!/\/v1$/i.test(u) && !/\/v1\//i.test(u)) u = u + "/v1";
  return u;
}

export function llmConfigured(cfg: LlmConfig): boolean {
  return !!(normalizeBaseUrl(cfg.baseUrl) && String(cfg.model || "").trim());
}

function idVal(id: any): string {
  if (id && typeof id === "object" && "0" in id) return String(id[0]);
  return String(id);
}

function fqnOf(snap: any, id: any): string {
  const sid = idVal(id);
  const n = ((snap && snap.graph && snap.graph.nodes) || []).find((x: any) => idVal(x.id) === sid);
  return n && n.fqn ? String(n.fqn) : sid;
}

function shortOf(fqn: string): string {
  const s = String(fqn || "");
  const parts = s.split(/::|\./);
  return parts[parts.length - 1] || s;
}

function kindOf(snap: any, id: any): string {
  const sid = idVal(id);
  const n = ((snap && snap.graph && snap.graph.nodes) || []).find((x: any) => idVal(x.id) === sid);
  return n && n.kind ? String(n.kind) : "Function";
}

function pickDefaultFlow(snap: any): any {
  const flows = (snap && snap.flows) || [];
  return (
    flows.find((f: any) => f.name === "control-flow") ||
    flows.find((f: any) => f.name === "overview") ||
    flows[0] ||
    snap?.flow ||
    null
  );
}

function flowByName(snap: any, name?: string): any {
  if (name) {
    const hit = ((snap && snap.flows) || []).find((f: any) => f.name === name);
    if (hit) return hit;
  }
  return pickDefaultFlow(snap);
}

/** BFS walk of a Steiner tree from its sources. */
export function flowWalk(flow: any): string[] {
  const nodes = (flow && flow.tree && flow.tree.nodes) || [];
  const edges = (flow && flow.tree && flow.tree.edges) || [];
  if (!nodes.length) return [];
  const kids = new Map<string, string[]>();
  for (const e of edges) {
    const a = idVal(e.from),
      b = idVal(e.to);
    if (!kids.has(a)) kids.set(a, []);
    kids.get(a)!.push(b);
  }
  const ids = new Set(nodes.map((n: any) => idVal(n)));
  const incoming = new Set(edges.map((e: any) => idVal(e.to)));
  const sources = nodes.map((n: any) => idVal(n)).filter((id: string) => !incoming.has(id));
  const start = sources.length ? sources : [idVal(nodes[0])];
  const seen = new Set<string>();
  const walk: string[] = [];
  const q = start.slice();
  while (q.length) {
    const id = q.shift()!;
    if (!ids.has(id) || seen.has(id)) continue;
    seen.add(id);
    walk.push(id);
    for (const t of kids.get(id) || []) q.push(t);
  }
  for (const n of nodes) {
    const id = idVal(n);
    if (!seen.has(id)) walk.push(id);
  }
  return walk;
}

/** Unique hop names along the control-flow walk — same strip as Overview. */
export function featurePath(snap: any, flowName?: string): string[] {
  const flow = flowByName(snap, flowName);
  const seen = new Set<string>();
  const path: string[] = [];
  for (const id of flowWalk(flow)) {
    const label = shortOf(fqnOf(snap, id));
    if (!label || seen.has(label)) continue;
    seen.add(label);
    path.push(label);
  }
  return path;
}

export function reviewBrief(snap: any, flowName?: string) {
  const flow = flowByName(snap, flowName);
  const walk = flowWalk(flow);
  const hops = walk.slice(0, 12).map((id) => ({
    id,
    fqn: fqnOf(snap, id),
    kind: kindOf(snap, id),
  }));
  const edges = ((flow && flow.tree && flow.tree.edges) || []).slice(0, 16).map((e: any) => ({
    from: fqnOf(snap, e.from),
    to: fqnOf(snap, e.to),
    kind: e.kind || "Calls",
  }));
  const flows = ((snap && snap.flows) || []).slice(0, 8).map((f: any) => ({
    name: f.name,
    hops: ((f.tree && f.tree.nodes) || []).length,
  }));
  const uncovered = ((snap && snap.coverage && snap.coverage.uncovered) || []).slice(0, 8).map((id: any) => fqnOf(snap, id));
  return {
    plugin: (snap && snap.plugin) || "",
    stats: snap && snap.stats ? snap.stats : {},
    default_run: (flow && flow.name) || "",
    path: featurePath(snap, flow && flow.name),
    hops,
    edges,
    flows,
    coverage: {
      changed: ((snap && snap.coverage && snap.coverage.changed) || []).length,
      uncovered: ((snap && snap.coverage && snap.coverage.uncovered) || []).length,
      uncovered_sample: uncovered,
    },
    findings: ((snap && snap.findings) || []).slice(0, 8).map((f: any) => ({
      kind: f.kind,
      flow: f.flow,
      fqn: f.fqn,
    })),
    stamps: snap && snap.stamps ? snap.stamps : [],
    skipped: snap && snap.skipped ? snap.skipped : [],
    note: "Agents never stamp. Do not invent nodes or edges outside " + CLOSED_NODES + " / " + CLOSED_EDGES + ".",
  };
}

export function groundedFallback(snap: any, question: string, flowName?: string): string {
  const brief = reviewBrief(snap, flowName);
  const path = brief.path.length ? brief.path.join(" → ") : "(no control-flow walk yet — Review a repo)";
  const hops = brief.hops.map((h) => h.fqn.split(/::|\./).pop() || h.fqn).join(" → ");
  const q = String(question || "").toLowerCase();
  const lines = [
    "Start → features → end: " + path,
    hops ? "Control-flow hops: " + hops : "",
    brief.default_run ? "Default run: " + brief.default_run : "",
    "Coverage: " + brief.coverage.changed + " changed · " + brief.coverage.uncovered + " uncovered",
    "This answer is from the derived review graph. An LLM is optional. Agents never stamp.",
  ].filter(Boolean);
  if (/uncover|coverage|missing/.test(q) && brief.coverage.uncovered_sample.length) {
    lines.splice(3, 0, "Uncovered sample: " + brief.coverage.uncovered_sample.join(", "));
  }
  if (/finding|broken|stamp/.test(q) && brief.findings.length) {
    lines.splice(3, 0, "Findings: " + brief.findings.map((f: { kind?: string; flow?: string }) => f.kind + (f.flow ? " " + f.flow : "")).join(", "));
  }
  return lines.join("\n");
}

export function systemPrompt(snap: any, flowName?: string): string {
  const brief = reviewBrief(snap, flowName);
  return [
    "You are a Graphide review assistant. The human reviews agent-generated changes as flows, not files.",
    "Explain the derived control-flow path (start → features → end). Stay on the closed IR.",
    "Node kinds: " + CLOSED_NODES + ". Edge kinds: " + CLOSED_EDGES + ".",
    "Never stamp. Never invent nodes, edges, or flows. If it is not in the review snapshot, say so.",
    "Review snapshot (compact, not a dump):",
    JSON.stringify(brief),
  ].join("\n");
}

export function askMessages(snap: any, question: string, flowName?: string): ChatMessage[] {
  return [
    { role: "system", content: systemPrompt(snap, flowName) },
    { role: "user", content: String(question || "Tell the start → features → end control-flow of this review.") },
  ];
}

export async function chatCompletions(
  cfg: LlmConfig,
  messages: ChatMessage[],
  opts?: { fetchImpl?: typeof fetch; timeoutMs?: number }
): Promise<ChatResult> {
  const base = normalizeBaseUrl(cfg.baseUrl);
  const model = String(cfg.model || "").trim();
  if (!base || !model) {
    throw new Error("Set graphide.llm.baseUrl and graphide.llm.model (Ollama, LM Studio, or an API host).");
  }
  const fetchImpl = opts?.fetchImpl || fetch;
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const t = setTimeout(() => ctrl?.abort(), opts?.timeoutMs || 45000);
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (cfg.apiKey) headers.Authorization = "Bearer " + cfg.apiKey;
    const res = await fetchImpl(base + "/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({ model, messages, temperature: 0.2 }),
      signal: ctrl?.signal,
    } as RequestInit);
    const raw = await res.text();
    if (!res.ok) {
      throw new Error("LLM host " + res.status + ": " + raw.slice(0, 240));
    }
    const json = JSON.parse(raw || "{}");
    const text =
      (json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content) ||
      json.message?.content ||
      "";
    if (!String(text).trim()) throw new Error("LLM host returned an empty completion.");
    return { text: String(text).trim(), model: json.model || model, via: "llm" };
  } finally {
    clearTimeout(t);
  }
}

export async function testLlmConnection(
  cfg: LlmConfig,
  opts?: { fetchImpl?: typeof fetch; timeoutMs?: number }
): Promise<{ ok: boolean; detail: string; models?: string[] }> {
  const base = normalizeBaseUrl(cfg.baseUrl);
  if (!base) return { ok: false, detail: "No host URL. Example: http://127.0.0.1:11434/v1" };
  const fetchImpl = opts?.fetchImpl || fetch;
  const headers: Record<string, string> = {};
  if (cfg.apiKey) headers.Authorization = "Bearer " + cfg.apiKey;
  try {
    const res = await fetchImpl(base + "/models", { headers, signal: AbortSignal.timeout(opts?.timeoutMs || 8000) } as RequestInit);
    const raw = await res.text();
    if (res.ok) {
      const json = JSON.parse(raw || "{}");
      const models = (json.data || json.models || []).map((m: any) => m.id || m.name).filter(Boolean);
      return { ok: true, detail: "Reachable " + base + (models[0] ? " · " + models.slice(0, 4).join(", ") : ""), models };
    }
  } catch (e: any) {
    // fall through to a tiny chat probe
    if (!cfg.model) return { ok: false, detail: e?.message || String(e) };
  }
  if (!cfg.model) return { ok: false, detail: "Host did not list models. Set a model name and Test again." };
  try {
    const chat = await chatCompletions(
      cfg,
      [
        { role: "system", content: "Reply with the single word pong." },
        { role: "user", content: "ping" },
      ],
      { fetchImpl: opts?.fetchImpl, timeoutMs: opts?.timeoutMs || 20000 }
    );
    return { ok: true, detail: "Chat ok · " + chat.model };
  } catch (e: any) {
    return { ok: false, detail: e?.message || String(e) };
  }
}

export async function askReview(
  snap: any,
  question: string,
  cfg: LlmConfig,
  flowName?: string,
  opts?: { fetchImpl?: typeof fetch }
): Promise<ChatResult> {
  if (!snap) {
    return { text: "Review a repo first. There is no derived graph to ask about.", model: "", via: "graph" };
  }
  if (!llmConfigured(cfg)) {
    return { text: groundedFallback(snap, question, flowName), model: "", via: "graph" };
  }
  const chat = await chatCompletions(cfg, askMessages(snap, question, flowName), opts);
  return chat;
}
