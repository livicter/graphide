import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";
import * as fs from "fs";
import { promisify } from "util";

const execFile = promisify(cp.execFile);

export function activate(context: vscode.ExtensionContext) {
  const provider = new ReviewViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ReviewViewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("graphide.review", () => provider.runReview())
  );
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

  constructor(private readonly extensionUri: vscode.Uri) {}

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
      }
    });
    if (this.snapshot) this.pushState();
  }

  async runReview(promptFlows?: string[]) {
    if (this.running) return;
    this.running = true;
    this.view?.webview.postMessage({ type: "loading", text: "Deriving graph…" });
    const started = Date.now();
    try {
      const root = packageRoot();
      const cli = resolveCli();
      const args = ["review", "--root", root, "--json"];
      const parent = parentRoot();
      if (parent) args.push("--parent", parent);
      const flows = promptFlows?.filter(Boolean) ?? configuredFlows();
      for (const f of flows) {
        args.push("--flow", f);
      }
      const { stdout } = await execFile(cli, args, {
        maxBuffer: 32 * 1024 * 1024,
        windowsHide: true,
      });
      this.snapshot = JSON.parse(stdout.slice(stdout.indexOf("{")));
      if (!this.snapshot.stats) this.snapshot.stats = {};
      this.snapshot.stats.ui_ms = Date.now() - started;
      this.flowName = this.snapshot.flows?.[0]?.name;
      this.stack = [{ kind: "flow" }];
      this.pushState();
    } catch (e: any) {
      this.view?.webview.postMessage({
        type: "error",
        text: e.message ?? String(e),
      });
    } finally {
      this.running = false;
    }
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
  </header>
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

function resolveCli(): string {
  const cfg = vscode.workspace.getConfiguration("graphide");
  const configured = cfg.get<string>("cliPath")?.trim();
  if (configured && fs.existsSync(configured)) return configured;
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const candidates = [
    folder && path.join(folder, "target", "debug", "graphide.exe"),
    folder && path.join(folder, "target", "debug", "graphide"),
    folder && path.join(folder, "target", "release", "graphide.exe"),
    folder && path.join(folder, "target", "release", "graphide"),
  ].filter(Boolean) as string[];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return "graphide";
}
