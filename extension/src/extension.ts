import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

export function activate(context: vscode.ExtensionContext) {
  const provider = new ReviewViewProvider(context);
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
    const cli = findCli(context);
    if (cli) warmCli(cli);
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
  private stack: Array<
    | { kind: "programs" }
    | { kind: "flow" }
    | { kind: "bubble"; flow: string; bubble: string }
  > = [{ kind: "flow" }];
  private running = false;
  private child?: cp.ChildProcess;
  private skipped: string[] = [];
  /** File-projection key `kind\\0name\\0root`. Empty = all programs. */
  private programKey?: string;

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
      text: "One-click install builds the local CLI and is only needed once.",
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
        this.stack = this.stack[0]?.kind === "programs" || (this.snapshot?.programs || []).length > 1
          ? [{ kind: "programs" }, { kind: "flow" }]
          : [{ kind: "flow" }];
        this.pushState();
      } else if (msg.type === "selectProgram") {
        this.programKey = msg.all ? undefined : programKeyOf(msg.kind, msg.name, msg.root);
        this.stack = [{ kind: "programs" }, { kind: "flow" }];
        this.flowName = msg.flow || this.pickFlowForProgram();
        this.pushState();
      } else if (msg.type === "enterRun") {
        this.stack.push({ kind: "bubble", flow: msg.flow, bubble: String(msg.bubble) });
        this.pushState();
      } else if (msg.type === "enterNode") await this.enterNode(msg);
      else if (msg.type === "peekSource") this.peekSource(msg.id);
      else if (msg.type === "back") {
        this.stack.pop();
        if (this.stack.length === 0) {
          this.stack.push({ kind: "programs" });
        }
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
            "Graphide CLI not found (expected %USERPROFILE%\\.graphide\\graphide.exe). " +
              "Run Graphide: Install (one click), or from the Graphide source repo (not the folder under review) run: cargo build -p graphide-cli --release && install.cmd"
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
          this.programKey = undefined;
          this.stack = [{ kind: "programs" }];
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
    this.pushState();
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
    vscode.window.showInformationMessage(`Stamped ${flow.name}`);
    this.pushState();
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
  }

  private peekSource(id: any) {
    if (!this.view) return;
    const node = this.snapshot?.graph?.nodes?.find((n: any) => String(n.id) === String(id));
    if (!node?.span) {
      this.view.webview.postMessage({ type: "source", id, missing: true });
      return;
    }
    this.view.webview.postMessage({
      type: "source",
      id: String(node.id),
      fqn: node.fqn,
      kind: node.kind,
      ...snippetAt(node),
    });
  }

  private filteredFlows(): any[] {
    const all = this.snapshot?.flows || [];
    if (!this.programKey) return all;
    return all.filter((f: any) =>
      flowTouchesProgram(f, this.snapshot.graph, this.programKey!, this.snapshot.programs || [])
    );
  }

  private pickFlowForProgram(): string | undefined {
    const flows = this.filteredFlows();
    if (this.flowName && flows.some((f: any) => f.name === this.flowName)) return this.flowName;
    return flows[0]?.name || this.snapshot?.flows?.[0]?.name;
  }

  private selectedProgram(): { kind: string; name: string; root: string } | undefined {
    if (!this.programKey) return undefined;
    return (this.snapshot?.programs || []).find(
      (p: any) => programKeyOf(p.kind, p.name, p.root) === this.programKey
    );
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
    if (top.kind === "programs") {
      this.view.webview.postMessage({
        type: "programs",
        programs: this.snapshot.programs || [],
        flows: this.snapshot.flows || [],
        graph: this.snapshot.graph,
        coverage: this.snapshot.coverage,
        findings: this.snapshot.findings,
        plugin: this.snapshot.plugin,
        stats: this.snapshot.stats,
        stamps: this.snapshot.stamps || [],
        skipped: this.skipped,
      });
      return;
    }
    if (top.kind === "flow") {
      const flows = this.filteredFlows();
      const shown =
        flows.find((f: any) => f.name === this.flowName) || flows[0] || flow;
      this.view.webview.postMessage({
        type: "flowchart",
        flows,
        flow: shown,
        coverage: this.snapshot.coverage,
        findings: this.snapshot.findings,
        bubbles: this.snapshot.bubbles,
        graph: this.snapshot.graph,
        plugin: this.snapshot.plugin,
        stats: this.snapshot.stats,
        stamps: this.snapshot.stamps || [],
        skipped: this.skipped,
        programs: this.snapshot.programs || [],
        program: this.selectedProgram(),
        snippets: snippetsFor(this.snapshot, shown),
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
    <button id="backBtn" title="Back (Backspace)" disabled>Back</button>
    <button id="reviewBtn" title="Review workspace">Review</button>
    <button id="cancelBtn" title="Cancel review (Esc)" hidden>Cancel</button>
    <button id="stampBtn" title="Human stamp: this flow still holds (S)">Stamp</button>
    <button id="skipBtn" title="Skip this flow without a stamp (X)">Skip</button>
    <div id="zoomBar" hidden>
      <button id="zoomOut" title="Zoom out (−)">−</button>
      <span id="zoomPct">100%</span>
      <button id="zoomIn" title="Zoom in (+)">+</button>
      <button id="zoomFit" title="Fit (0)">Fit</button>
    </div>
  </header>
  <div id="tip" hidden></div>
  <div id="progress">
    <div class="progress-inner">
      <ol id="phases">
        <li data-phase="walk">Scan</li>
        <li data-phase="extract">Extract</li>
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
  <div id="graphBar" hidden>
    <input id="graphSearch" type="search" spellcheck="false" placeholder="Find FQN or file…" />
    <div id="kindFilters">
      <label><input type="checkbox" data-kind="Function" checked /> Function</label>
      <label><input type="checkbox" data-kind="Type" checked /> Type</label>
      <label><input type="checkbox" data-kind="Endpoint" checked /> Endpoint</label>
    </div>
    <div id="legend"></div>
  </div>
  <section id="workspace">
    <section id="canvas"></section>
    <aside id="sourcePane" hidden>
      <div class="src-bar">
        <span id="srcTitle"></span>
        <button id="srcEditor" title="Open this span in the editor">Editor</button>
        <button id="srcClose" title="Close inspect (Esc)">Close</button>
      </div>
      <div id="inspMeta"></div>
      <div id="inspEdges"></div>
      <div id="srcBody"></div>
    </aside>
  </section>
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

function findCli(context?: vscode.ExtensionContext): string | undefined {
  const cfg = vscode.workspace.getConfiguration("graphide");
  const configured = cfg.get<string>("cliPath")?.trim();
  if (configured && fs.existsSync(configured)) return configured;
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const candidates = [
    homeCliPath(),
    context && path.join(context.globalStorageUri.fsPath, exeName()),
    context && path.join(context.extensionPath, "bin", exeName()),
    folder && path.join(folder, "target", "release", exeName()),
    folder && path.join(folder, "target", "debug", exeName()),
  ].filter(Boolean) as string[];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return undefined;
}

function findRepo(context: vscode.ExtensionContext): string | undefined {
  const remembered = context.globalState.get<string>("graphide.repo");
  if (remembered && looksLikeRepo(remembered)) return remembered;
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    if (looksLikeRepo(folder.uri.fsPath)) return folder.uri.fsPath;
  }
  const ext = context.extensionPath;
  for (const dir of [path.dirname(ext), path.join(ext, "..", "..")]) {
    const resolved = path.resolve(dir);
    if (looksLikeRepo(resolved)) return resolved;
  }
  return undefined;
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
  let repo = findRepo(context);
  if (!repo) {
    const picked = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      title: "Select the Graphide git repo (folder with install.cmd / install.sh)",
    });
    if (!picked?.[0]) return;
    repo = picked[0].fsPath;
    if (!looksLikeRepo(repo)) {
      vscode.window.showErrorMessage("That folder is not a Graphide repo (missing crates/graphide-cli).");
      return;
    }
  }
  await context.globalState.update("graphide.repo", repo);
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: "Graphide: installing CLI" },
    async () => {
      await runCmd("cargo", ["build", "-p", "graphide-cli", "--release"], repo);
      const built = path.join(repo, "target", "release", exeName());
      if (!fs.existsSync(built)) throw new Error(`Build did not produce ${built}`);
      const dests = [
        homeCliPath(),
        path.join(context.globalStorageUri.fsPath, exeName()),
        path.join(context.extensionPath, "bin", exeName()),
      ];
      for (const dest of dests) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        try {
          fs.copyFileSync(built, dest);
          if (process.platform !== "win32") fs.chmodSync(dest, 0o755);
        } catch {
          /* extension folder may be read-only */
        }
      }
    }
  );
  const cli = findCli(context);
  if (!cli) {
    vscode.window.showErrorMessage("Install finished but the CLI is still missing.");
    return;
  }
  vscode.window.showInformationMessage("Graphide is ready. Open the Graphide view and click Review.");
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

function programKeyOf(kind?: string, name?: string, root?: string) {
  return `${kind || ""}\0${name || ""}\0${root || ""}`;
}

function nodeId(id: any): string {
  if (id && typeof id === "object" && "0" in id) return String(id[0]);
  return String(id);
}

/** Mirror of engine `assign_file` — files are a projection, not a plugin kind. */
function assignProgram(file: string, programs: any[]): { kind: string; name: string; root: string } {
  const hint = detectHint(file);
  if (hint) return hint;
  const root = crateRootOf(file);
  const at = (programs || []).filter((p: any) => (p.root || "") === root);
  const lib = at.find((p: any) => p.kind === "lib");
  if (lib) return { kind: lib.kind, name: lib.name, root: lib.root || "" };
  const pkgBin = pkgName(root, "main");
  const bin = at.find((p: any) => p.kind === "bin" && p.name === pkgBin);
  if (bin) return { kind: bin.kind, name: bin.name, root: bin.root || "" };
  return fallbackPkg(file);
}

function detectHint(file: string): { kind: string; name: string; root: string } | undefined {
  const f = String(file || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");
  const bin = splitSrcBin(f);
  if (bin) {
    const name = (bin.rest.split("/")[0] || "bin").replace(/\.rs$/, "").replace(/\.go$/, "");
    return { kind: "bin", name, root: bin.root };
  }
  const mainRs = stripSrcFile(f, "main.rs");
  if (mainRs !== undefined) return { kind: "bin", name: pkgName(mainRs, "main"), root: mainRs };
  const libRs = stripSrcFile(f, "lib.rs");
  if (libRs !== undefined) return { kind: "lib", name: pkgName(libRs, "lib"), root: libRs };
  if (f.endsWith("/main.go") || f === "main.go") {
    const root = f.replace(/main\.go$/, "").replace(/\/$/, "");
    if (root.startsWith("cmd/")) {
      const name = root.slice(4).split("/")[0] || "main";
      return { kind: "bin", name, root: `cmd/${name}` };
    }
    return { kind: "bin", name: pkgName(root, "main"), root };
  }
  if (f.endsWith("/__main__.py") || f.endsWith("/main.py")) {
    const root = f
      .replace(/__main__\.py$/, "")
      .replace(/main\.py$/, "")
      .replace(/\/$/, "");
    return { kind: "bin", name: pkgName(root, "main"), root };
  }
  return undefined;
}

function fallbackPkg(file: string): { kind: string; name: string; root: string } {
  const f = String(file || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");
  const slash = f.indexOf("/");
  if (slash >= 0) {
    const a = f.slice(0, slash);
    if (a === "src") return { kind: "pkg", name: "src", root: "" };
    return { kind: "pkg", name: a, root: a };
  }
  return { kind: "pkg", name: "root", root: "" };
}

function crateRootOf(file: string): string {
  const f = String(file || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");
  const bin = splitSrcBin(f);
  if (bin) return bin.root;
  if (f === "src" || f.startsWith("src/")) return "";
  const i = f.indexOf("/src/");
  if (i >= 0) return f.slice(0, i);
  if (f === "main.go" || f === "main.py" || f === "__main__.py") return "";
  if (f.startsWith("cmd/")) {
    const name = f.slice(4).split("/")[0] || "main";
    return `cmd/${name}`;
  }
  const slash = f.indexOf("/");
  if (slash >= 0) return f.slice(0, slash);
  return "";
}

function splitSrcBin(f: string): { root: string; rest: string } | undefined {
  const i = f.indexOf("/src/bin/");
  if (i >= 0) return { root: f.slice(0, i), rest: f.slice(i + 9) };
  if (f.startsWith("src/bin/")) return { root: "", rest: f.slice(8) };
  return undefined;
}

function stripSrcFile(f: string, name: string): string | undefined {
  if (f === `src/${name}`) return "";
  const suf = `/src/${name}`;
  if (f.endsWith(suf)) return f.slice(0, f.length - suf.length);
  return undefined;
}

function pkgName(root: string, fallback: string) {
  if (!root) return fallback;
  return root.split("/").filter(Boolean).pop() || fallback;
}

function flowTouchesProgram(flow: any, graph: any, key: string, programs: any[]): boolean {
  const byId = new Map<string, any>((graph?.nodes || []).map((n: any) => [nodeId(n.id), n]));
  for (const id of flow?.tree?.nodes || []) {
    const n = byId.get(nodeId(id));
    const file = n?.span?.file;
    if (!file) continue;
    const p = assignProgram(file, programs);
    if (programKeyOf(p.kind, p.name, p.root) === key) return true;
  }
  return false;
}

function snippetsFor(snap: any, flow: any): Record<string, any> {
  const out: Record<string, any> = {};
  if (!snap || !flow?.tree) return out;
  const byId = new Map<string, any>((snap.graph?.nodes || []).map((n: any) => [nodeId(n.id), n]));
  for (const id of flow.tree.nodes || []) {
    const n = byId.get(nodeId(id));
    const snip = snippetAt(n);
    if (snip) out[nodeId(id)] = snip;
  }
  return out;
}

function snippetAt(n: any): {
  text: string;
  preview: string;
  file: string;
  line: number;
  endLine: number;
  from: number;
} | undefined {
  if (!n?.span?.file || n.span.start == null) return undefined;
  let root: string;
  try {
    root = packageRoot();
  } catch {
    return undefined;
  }
  try {
    const file = n.span.file;
    const abs = path.isAbsolute(file) ? file : path.join(root, file);
    if (!fs.existsSync(abs)) return undefined;
    const lines = fs.readFileSync(abs, "utf8").split(/\r?\n/);
    const line = Math.max(1, (n.span.start.line as number) | 0);
    const endLine = Math.max(line, (n.span.end.line as number) | 0);
    const from = Math.max(1, line - 2);
    const to = Math.min(lines.length, Math.max(endLine + 6, line + 18));
    const text = lines.slice(from - 1, to).join("\n");
    const preview = lines.slice(line - 1, line + 7).join("\n").trimEnd().slice(0, 900);
    if (!text && !preview) return undefined;
    return { text: text.slice(0, 4000), preview, file, line, endLine, from };
  } catch {
    return undefined;
  }
}

function warmCli(cli: string) {
  try {
    const child = cp.spawn(cli, ["--help"], { windowsHide: true, stdio: "ignore" });
    child.unref?.();
  } catch {
    /* first Review still works if the binary is missing */
  }
}
