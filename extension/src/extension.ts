import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

const log = vscode.window.createOutputChannel("Graphide");

export function activate(context: vscode.ExtensionContext) {
  const provider = new ReviewViewProvider(context);
  context.subscriptions.push(log);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ReviewViewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("graphide.review", () => provider.runReview())
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("graphide.install", () => installGraphide(context, provider))
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("graphide.stamp", () => provider.writeStamp())
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("graphide.skip", () => provider.skipFlow())
  );
  setTimeout(() => {
    const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "";
    log.appendLine("activate");
    log.appendLine("workspace=" + folder);
    log.appendLine("extension=" + context.extensionPath);
    const cli = findCli(context);
    if (cli) {
      log.appendLine("cli=" + cli);
      pinCli(context, cli);
      warmCli(cli);
    } else {
      log.appendLine("ERROR CLI missing. Searched:");
      for (const p of cliCandidates(context)) log.appendLine("  " + p);
    }
  }, 0);
}

export function deactivate() {}

async function openSource(args: {
  file: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
}) {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) return;
  const uri = vscode.Uri.joinPath(folder.uri, args.file);
  const doc = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
  const start = new vscode.Position(Math.max(0, args.line - 1), Math.max(0, args.column - 1));
  const end = new vscode.Position(Math.max(0, args.endLine - 1), Math.max(0, args.endColumn - 1));
  editor.selection = new vscode.Selection(start, end);
  editor.revealRange(new vscode.Range(start, end), vscode.TextEditorRevealType.InCenter);
}

class ReviewViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "graphide.reviewView";
  private view?: vscode.WebviewView;
  private snapshot: any;
  private flowName?: string;
  private stack: Array<{ kind: "flow" } | { kind: "bubble"; flow: string; bubble: string }> = [
    { kind: "flow" },
  ];
  private running = false;
  private child?: cp.ChildProcess;
  private skipped: string[] = [];

  constructor(private readonly context: vscode.ExtensionContext) {}

  get extensionUri() {
    return this.context.extensionUri;
  }

  notifySetup() {
    if (findCli(this.context)) {
      if (!this.snapshot) this.view?.webview.postMessage({ type: "empty" });
      else this.pushState();
      return;
    }
    this.view?.webview.postMessage({
      type: "setup",
      text:
        "The CLI is missing. Install once — it is copied to ~/.graphide and then reviews any folder, including this one.",
    });
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")],
    };
    webviewView.webview.html = this.html(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === "review") await this.runReview(msg.flows);
      else if (msg.type === "selectFlow") {
        this.flowName = msg.flow;
        this.stack = [{ kind: "flow" }];
        this.pushState();
      } else if (msg.type === "enterRun") {
        this.stack.push({ kind: "bubble", flow: msg.flow, bubble: String(msg.bubble) });
        this.pushState();
      } else if (msg.type === "enterNode") await this.enterNode(msg);
      else if (msg.type === "back") {
        this.stack.pop();
        if (this.stack.length === 0) this.stack.push({ kind: "flow" });
        this.pushState();
      } else if (msg.type === "cancel") {
        this.cancelReview();
      } else if (msg.type === "install") {
        await installGraphide(this.context, this);
      } else if (msg.type === "stamp") {
        this.writeStamp(msg.flow);
      } else if (msg.type === "skip") {
        this.skipFlow(msg.flow);
      }
    });
    if (this.snapshot) this.pushState();
    else this.notifySetup();
  }

  cancelReview() {
    if (this.child && !this.child.killed) {
      this.child.kill();
    }
  }

  async runReview(promptFlows?: string[]) {
    if (this.running) return;
    this.running = true;
    const started = Date.now();
    this.view?.webview.postMessage({
      type: "progress",
      phase: "start",
      label: "Starting review…",
      done: 0,
      total: 0,
      pct: 0,
      elapsed_ms: 0,
    });
    const tick = setInterval(() => {
      this.view?.webview.postMessage({ type: "tick", elapsed_ms: Date.now() - started });
    }, 120);
    try {
      const root = packageRoot();
      let cli = findCli(this.context);
      if (cli) pinCli(this.context, cli);
      if (!cli) {
        const go = await vscode.window.showInformationMessage(
          "Graphide CLI is not installed yet.",
          "Install"
        );
        if (go === "Install") {
          await installGraphide(this.context, this);
          cli = findCli(this.context);
        }
        if (!cli) {
          throw new Error(
            "Graphide CLI not found. Click Install, or from the Graphide repo run install.cmd / install.sh. The binary goes to ~/.graphide and works in any workspace."
          );
        }
      }
      const args = ["review", "--root", root, "--json", "--progress"];
      const parent = parentRoot();
      if (parent) args.push("--parent", parent);
      const flows = promptFlows?.filter(Boolean) ?? configuredFlows();
      for (const f of flows) {
        args.push("--flow", f);
      }
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: "Graphide",
          cancellable: true,
        },
        async (vsProgress, token) => {
          let lastPct = 0;
          const snap = await this.spawnReview(cli, args, (ev) => {
            if (ev.kind === "preview") {
              this.view?.webview.postMessage({
                type: "preview",
                ...ev.data,
                elapsed_ms: Date.now() - started,
              });
              return;
            }
            const p = ev.data;
            const increment = Math.max(0, (p.pct ?? 0) - lastPct);
            lastPct = p.pct ?? lastPct;
            vsProgress.report({
              increment,
              message: `${p.pct}% ${p.label}`,
            });
            this.view?.webview.postMessage({
              type: "progress",
              ...p,
              elapsed_ms: Date.now() - started,
            });
          }, token);
          this.snapshot = snap;
          if (!this.snapshot.stats) this.snapshot.stats = {};
          this.snapshot.stats.ui_ms = Date.now() - started;
          this.flowName = this.snapshot.flows?.[0]?.name;
          this.stack = [{ kind: "flow" }];
          this.skipped = this.skipped.filter((n) =>
            (this.snapshot.flows || []).some((f: any) => f.name === n)
          );
          this.pushState();
        }
      );
    } catch (e: any) {
      const text = e?.message ?? String(e);
      if (/cancelled|SIGTERM|SIGINT|killed/i.test(text)) {
        this.view?.webview.postMessage({ type: "cancelled" });
      } else if (/ENOENT|not found|spawn/i.test(text)) {
        this.view?.webview.postMessage({
          type: "setup",
          text: text,
        });
      } else {
        this.view?.webview.postMessage({ type: "error", text });
      }
    } finally {
      clearInterval(tick);
      this.running = false;
      this.child = undefined;
    }
  }

  private spawnReview(
    cli: string,
    args: string[],
    onProgress: (ev: StreamEvent) => void,
    token: vscode.CancellationToken
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const child = cp.spawn(cli, args, { windowsHide: true });
      this.child = child;
      let stdout = "";
      let stderr = "";
      let errBuf = "";
      let cancelled = false;
      const cancel = token.onCancellationRequested(() => {
        cancelled = true;
        if (!child.killed) child.kill();
      });
      child.stdout?.on("data", (d: Buffer) => {
        stdout += d.toString("utf8");
      });
      child.stderr?.on("data", (d: Buffer) => {
        errBuf += d.toString("utf8");
        const lines = errBuf.split(/\r?\n/);
        errBuf = lines.pop() ?? "";
        for (const line of lines) {
          const ev = parseStreamLine(line);
          if (ev) onProgress(ev);
          else if (line.trim()) stderr += line + "\n";
        }
      });
      child.on("error", (err) => {
        cancel.dispose();
        reject(err);
      });
      child.on("close", (code, signal) => {
        cancel.dispose();
        if (cancelled || signal === "SIGTERM" || signal === "SIGINT") {
          reject(new Error("cancelled"));
          return;
        }
        if (code !== 0) {
          reject(new Error((stderr || stdout).trim() || `graphide exited ${code}`));
          return;
        }
        try {
          const start = stdout.indexOf("{");
          resolve(JSON.parse(start >= 0 ? stdout.slice(start) : stdout));
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  skipFlow(name?: string) {
    const flow = name || this.flowName;
    if (!flow) return;
    if (!this.skipped.includes(flow)) this.skipped.push(flow);
    this.pushMarks(`Skipped ${flow}`);
  }

  writeStamp(name?: string) {
    if (!this.snapshot) return;
    const flowName = name || this.flowName;
    const flow =
      this.snapshot.flows?.find((f: any) => f.name === flowName) || this.snapshot.flows?.[0];
    if (!flow) {
      vscode.window.showErrorMessage("No flow to stamp.");
      return;
    }
    const stamp = stampFromView(this.snapshot, flow);
    const dir = path.join(packageRoot(), ".graphide", "stamps");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, stampFilename(flow.name));
    fs.writeFileSync(file, JSON.stringify(stamp, null, 2));
    this.skipped = this.skipped.filter((n) => n !== flow.name);
    this.snapshot.stamps = this.snapshot.stamps || [];
    const row = this.snapshot.stamps.find((s: any) => s.name === flow.name);
    if (row) row.holds = true;
    else this.snapshot.stamps.push({ name: flow.name, holds: true });
    this.snapshot.findings = (this.snapshot.findings || []).filter(
      (f: any) => !(f.kind === "StampBroken" && f.flow === flow.name)
    );
    this.pushMarks(`Stamped ${flow.name}`);
  }

  private pushMarks(toast: string) {
    this.view?.webview.postMessage({
      type: "marks",
      stamps: this.snapshot?.stamps || [],
      skipped: this.skipped,
      findings: this.snapshot?.findings || [],
      toast,
    });
  }

  private async enterNode(msg: any) {
    if (!msg.isLeaf) {
      this.stack.push({ kind: "bubble", flow: msg.flow, bubble: msg.id });
      this.pushState();
      return;
    }
    const node = this.snapshot?.graph?.nodes?.find((n: any) => String(n.id) === String(msg.id));
    if (!node?.span) return;
    await openSource({
      file: node.span.file,
      line: node.span.start.line,
      column: node.span.start.column,
      endLine: node.span.end.line,
      endColumn: node.span.end.column,
    });
    this.view?.webview.postMessage({ type: "opened", id: String(node.id), file: node.span.file });
  }

  private pushState() {
    if (!this.view) return;
    const top = this.stack[this.stack.length - 1];
    if (!this.snapshot) {
      this.view.webview.postMessage({ type: "empty" });
      return;
    }
    const flow =
      this.snapshot.flows?.find((f: any) => f.name === this.flowName) || this.snapshot.flows?.[0];
    if (top.kind === "flow") {
      this.view.webview.postMessage({
        type: "flowchart",
        flows: this.snapshot.flows || [],
        flow,
        coverage: this.snapshot.coverage,
        findings: this.snapshot.findings,
        bubbles: this.snapshot.bubbles,
        graph: this.snapshot.graph,
        plugin: this.snapshot.plugin,
        stats: this.snapshot.stats,
        stamps: this.snapshot.stamps || [],
        skipped: this.skipped,
        depth: 0,
      });
      return;
    }
    const inner = enterBubble(this.snapshot, top.flow, top.bubble);
    this.view.webview.postMessage({
      type: "inner",
      inner,
      flow,
      coverage: this.snapshot.coverage,
      findings: this.snapshot.findings,
      plugin: this.snapshot.plugin,
      stats: this.snapshot.stats,
      stamps: this.snapshot.stamps || [],
      skipped: this.skipped,
      depth: this.stack.length - 1,
    });
  }

  private html(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", "main.js"));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", "main.css"));
    const nonce = String(Date.now());
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';" />
  <link href="${styleUri}" rel="stylesheet" />
</head>
<body>
  <header>
    <div class="brand">GRAPH<span>IDE</span></div>
    <div class="actions">
      <button id="backBtn" title="Pop one altitude (Backspace)" disabled>Back</button>
      <button id="stampBtn" title="This flow still holds (S)" disabled>Stamp</button>
      <button id="skipBtn" title="Skip this flow (X)" disabled>Skip</button>
      <button id="reviewBtn" title="Review workspace (Enter in prompt)">Review</button>
      <button id="cancelBtn" title="Cancel review (Esc)" hidden>Cancel</button>
      <div id="zoomBar" hidden>
        <button id="zoomOut" title="Zoom out (−)">−</button>
        <span id="zoomPct">100%</span>
        <button id="zoomIn" title="Zoom in (+)">+</button>
        <button id="zoomFit" title="Fit (0)">Fit</button>
      </div>
    </div>
  </header>
  <div id="toast" hidden></div>
  <div id="tip" hidden></div>
  <div id="progress">
    <div class="progress-inner">
      <ol id="phases">
        <li data-phase="walk">Scan</li>
        <li data-phase="extract">Extract</li>
        <li data-phase="parent">Parent</li>
        <li data-phase="link">Link</li>
        <li data-phase="cluster">Cluster</li>
        <li data-phase="flows">Flows</li>
      </ol>
      <div id="progressBar"><i id="progressFill"></i></div>
      <div id="progressMeta">
        <span id="progressLabel"></span>
        <span id="progressCounts"></span>
        <span id="progressPct"></span>
        <span id="progressTime"></span>
      </div>
    </div>
  </div>
  <div id="promptRow">
    <input id="prompt" type="text" spellcheck="false"
      placeholder="Optional prompt: name=hit,hit  (repeat with ; )" />
  </div>
  <nav id="tabs"></nav>
  <section id="meta"></section>
  <section id="canvas"></section>
  <section id="coverage"></section>
  <footer id="status"></footer>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function enterBubble(snap: any, flowName: string, bubbleId: string) {
  const flow = (snap.flows || []).find((f: any) => f.name === flowName);
  const bubble = (snap.bubbles || []).find((b: any) => String(b.id) === String(bubbleId));
  if (!flow || !bubble) return { flow: flowName, bubble: bubbleId, nodes: [] };
  const tree = new Set((flow.tree?.nodes || []).map((id: any) => String(id)));
  const children = (snap.bubbles || []).filter((b: any) => String(b.parent) === String(bubbleId));
  const adj = new Map<string, string[]>();
  for (const e of snap.graph?.edges || []) {
    const a = String(e.from),
      b = String(e.to);
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  }
  const distTo = (target: string): number => {
    if (tree.has(target)) return 0;
    const q = [...tree].map((id) => [id, 0] as [string, number]);
    const seen = new Set(tree);
    while (q.length) {
      const [n, d] = q.shift()!;
      if (n === target) return d;
      for (const m of adj.get(n) || []) {
        if (seen.has(m)) continue;
        seen.add(m);
        q.push([m, d + 1]);
      }
    }
    return 99;
  };
  let nodes: any[];
  if (!children.length) {
    nodes = (bubble.members || []).map((id: any) => {
      const n = (snap.graph?.nodes || []).find((x: any) => String(x.id) === String(id));
      const lit = tree.has(String(id));
      return {
        id,
        fqn: n?.fqn ?? String(id),
        kind: n?.kind ?? "Function",
        lit,
        grey: !lit,
        is_leaf: true,
        distance: lit ? 0 : distTo(String(id)),
      };
    });
  } else {
    nodes = children.map((b: any) => {
      const members = (b.members || []).map((m: any) => String(m));
      const lit = members.some((m: string) => tree.has(m));
      const distance = Math.min(...members.map((m: string) => distTo(m)), 99);
      return {
        id: b.id,
        fqn: b.label,
        kind: "Type",
        lit,
        grey: !lit,
        is_leaf: false,
        distance: lit ? 0 : distance,
      };
    });
  }
  nodes.sort(
    (a, b) => Number(b.lit) - Number(a.lit) || (a.distance ?? 99) - (b.distance ?? 99) || String(a.fqn).localeCompare(String(b.fqn))
  );
  return { flow: flowName, bubble: bubbleId, nodes };
}

function stampFilename(name: string) {
  const stem = Array.from(name, (c) =>
    /[A-Za-z0-9_-]/.test(c) ? c : "-"
  )
    .join("")
    .replace(/^-+|-+$/g, "");
  return (stem || "flow") + ".json";
}

function stampFromView(snap: any, flow: any) {
  const fqnOf = (id: any) => {
    const n = (snap.graph?.nodes || []).find((x: any) => String(x.id) === String(id));
    return n?.fqn ?? String(id);
  };
  const tree = (flow.tree?.edges || []).map((e: any) => ({
    from: fqnOf(e.from),
    to: fqnOf(e.to),
    kind: e.kind,
  }));
  const visit: Record<string, number> = {};
  const positions: any[] = [];
  const runs = flow.flowchart?.runs || [];
  const pos = flow.flowchart?.positions || [];
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const bubble = String(run.bubble ?? "");
    const idx = visit[bubble] || 0;
    visit[bubble] = idx + 1;
    const p = pos[i] || { x: 0, y: 0 };
    positions.push({ run_key: `${bubble}#${idx}`, x: p.x, y: p.y });
  }
  return {
    name: flow.name,
    hits: flow.hits || [],
    tree,
    positions,
    deriver: snap.plugin || "",
  };
}

function packageRoot(): string {
  const cfg = vscode.workspace.getConfiguration("graphide");
  const configured = cfg.get<string>("packageRoot")?.trim();
  if (configured) return configured;
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!folder) throw new Error("Open a workspace folder");
  return folder;
}

function parentRoot(): string | undefined {
  const cfg = vscode.workspace.getConfiguration("graphide");
  const configured = cfg.get<string>("parentRoot")?.trim();
  if (configured && fs.existsSync(configured)) return configured;
  return undefined;
}

function configuredFlows(): string[] {
  const cfg = vscode.workspace.getConfiguration("graphide");
  const raw = cfg.get<string[]>("promptFlows") ?? [];
  return raw.map((s) => s.trim()).filter(Boolean);
}

function exeName() {
  return process.platform === "win32" ? "graphide.exe" : "graphide";
}

function homeCliPath() {
  return path.join(os.homedir(), ".graphide", exeName());
}

function looksLikeRepo(dir: string) {
  return fs.existsSync(path.join(dir, "crates", "graphide-cli", "Cargo.toml"));
}

function fileIfExists(p?: string | null): string | undefined {
  if (!p) return undefined;
  try {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  } catch {
    /* ignore */
  }
  return undefined;
}

function builtCli(repo: string): string | undefined {
  return (
    fileIfExists(path.join(repo, "target", "release", exeName())) ||
    fileIfExists(path.join(repo, "extension", "bin", exeName())) ||
    fileIfExists(path.join(repo, "target", "debug", exeName()))
  );
}

function whichOnPath(): string | undefined {
  try {
    const cmd = process.platform === "win32" ? "where" : "which";
    const out = cp.execFileSync(cmd, [exeName()], {
      encoding: "utf8",
      timeout: 4000,
      windowsHide: true,
      env: { ...process.env, PATH: toolPath() },
    });
    for (const line of out.split(/\r?\n/)) {
      const hit = fileIfExists(line.trim());
      if (hit) return hit;
    }
  } catch {
    /* not on PATH */
  }
  return undefined;
}

function repoGuesses(context?: vscode.ExtensionContext): string[] {
  const out: string[] = [];
  const remembered = context?.globalState.get<string>("graphide.repo");
  if (remembered) out.push(remembered);
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    const root = folder.uri.fsPath;
    out.push(root, path.join(root, "..", "graphide"), path.join(root, "..", "Graphide"));
  }
  const home = os.homedir();
  out.push(
    path.join(home, "Documents", "Git", "graphide"),
    path.join(home, "Documents", "git", "graphide"),
    path.join(home, "Documents", "GitHub", "graphide"),
    path.join(home, "source", "graphide"),
    path.join(home, "src", "graphide"),
    path.join(home, "dev", "graphide"),
    path.join(home, "graphide")
  );
  if (context) {
    const ext = context.extensionPath;
    out.push(path.dirname(ext), path.resolve(ext, "..", ".."), path.resolve(ext, "..", "..", ".."));
  }
  return out.map((p) => path.resolve(p));
}

function findRepo(context?: vscode.ExtensionContext): string | undefined {
  const seen = new Set<string>();
  for (const dir of repoGuesses(context)) {
    const key = dir.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (looksLikeRepo(dir)) return dir;
  }
  return undefined;
}

function cliCandidates(context?: vscode.ExtensionContext): string[] {
  const cfg = vscode.workspace.getConfiguration("graphide");
  const configured = cfg.get<string>("cliPath")?.trim();
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const list = [
    configured,
    homeCliPath(),
    context && path.join(context.globalStorageUri.fsPath, exeName()),
    context && path.join(context.extensionPath, "bin", exeName()),
    context && path.join(context.extensionPath, exeName()),
    folder && path.join(folder, "target", "release", exeName()),
    folder && path.join(folder, "target", "debug", exeName()),
    path.join(os.homedir(), ".cargo", "bin", exeName()),
  ].filter(Boolean) as string[];
  for (const repo of repoGuesses(context)) {
    list.push(path.join(repo, "target", "release", exeName()));
    list.push(path.join(repo, "extension", "bin", exeName()));
    list.push(path.join(repo, "target", "debug", exeName()));
  }
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const p of list) {
    const key = path.normalize(p).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
  }
  return unique;
}

function findCli(context?: vscode.ExtensionContext): string | undefined {
  for (const c of cliCandidates(context)) {
    const hit = fileIfExists(c);
    if (hit) return hit;
  }
  return whichOnPath();
}

function copyCli(from: string, dest: string) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(from, dest);
  if (process.platform !== "win32") fs.chmodSync(dest, 0o755);
}

function pinCli(context: vscode.ExtensionContext, from: string) {
  const dests = [
    homeCliPath(),
    path.join(context.globalStorageUri.fsPath, exeName()),
    path.join(context.extensionPath, "bin", exeName()),
  ];
  for (const dest of dests) {
    if (path.resolve(dest) === path.resolve(from)) continue;
    try {
      copyCli(from, dest);
    } catch {
      /* extension folder may be read-only */
    }
  }
}

function toolPath(): string {
  const home = os.homedir();
  const extra = [
    path.join(home, ".cargo", "bin"),
    path.join(home, ".volta", "bin"),
    path.join(home, ".local", "bin"),
    "/opt/homebrew/bin",
    "/opt/homebrew/opt/node/bin",
    "/usr/local/bin",
    "/snap/bin",
  ];
  if (process.platform === "win32") {
    const la = process.env.LOCALAPPDATA || "";
    extra.push(
      path.join(la, "Programs", "Microsoft VS Code", "bin"),
      path.join(la, "Programs", "cursor", "resources", "app", "bin"),
      "C:\\Program Files\\nodejs"
    );
  }
  return extra.concat(process.env.PATH || "").join(path.delimiter);
}

function runCmd(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = cp.spawn(command, args, {
      cwd,
      windowsHide: true,
      shell: process.platform === "win32",
      env: { ...process.env, PATH: toolPath() },
    });
    let err = "";
    child.stderr?.on("data", (d: Buffer) => {
      err += d.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error((err || `${command} exited ${code}`).trim()));
    });
  });
}

async function installGraphide(context: vscode.ExtensionContext, provider?: ReviewViewProvider) {
  const existing = findCli(context);
  if (existing) {
    pinCli(context, existing);
    log.appendLine("cli=" + findCli(context));
    vscode.window.showInformationMessage("Graphide CLI is ready. Click Review.");
    provider?.notifySetup();
    return;
  }

  let repo = findRepo(context);
  if (!repo) {
    const picked = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      title: "Select the Graphide git repo (the folder that contains install.cmd)",
    });
    if (!picked?.[0]) return;
    repo = picked[0].fsPath;
    if (!looksLikeRepo(repo)) {
      vscode.window.showErrorMessage("That folder is not a Graphide repo (missing crates/graphide-cli).");
      return;
    }
  }
  await context.globalState.update("graphide.repo", repo);
  log.appendLine("repo=" + repo);
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: "Graphide: installing CLI" },
    async () => {
      let built = builtCli(repo);
      if (!built) {
        await runCmd("cargo", ["build", "-p", "graphide-cli", "--release"], repo);
        built = builtCli(repo);
      }
      if (!built) throw new Error(`Build did not produce ${exeName()} in ${repo}`);
      pinCli(context, built);
    }
  );
  const cli = findCli(context);
  if (!cli) {
    vscode.window.showErrorMessage("Install finished but the CLI is still missing.");
    return;
  }
  log.appendLine("cli=" + cli);
  vscode.window.showInformationMessage("Graphide is ready. Click Review — this workspace is fine.");
  provider?.notifySetup();
}

type StreamEvent = { kind: "progress" | "preview"; data: any };

function parseStreamLine(line: string): StreamEvent | undefined {
  const t = line.trim();
  if (!t.startsWith("{") || !t.includes('"graphide"')) return undefined;
  try {
    const ev = JSON.parse(t);
    if (ev && ev.graphide === "progress" && typeof ev.pct === "number") {
      return { kind: "progress", data: ev };
    }
    if (ev && ev.graphide === "preview") return { kind: "preview", data: ev };
  } catch {
    return undefined;
  }
  return undefined;
}

function warmCli(cli: string) {
  try {
    const child = cp.spawn(cli, ["--help"], { windowsHide: true, stdio: "ignore" });
    child.unref?.();
  } catch {
    /* first Review still works if the binary is missing */
  }
}
