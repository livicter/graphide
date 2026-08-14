import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";
import * as fs from "fs";
import { promisify } from "util";

const execFile = promisify(cp.execFile);

export function activate(context: vscode.ExtensionContext) {
  const provider = new ReviewViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ReviewViewProvider.viewType, provider)
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
  private stack: Array<{ kind: "flow" } | { kind: "bubble"; flow: string; bubble: string }> = [
    { kind: "flow" },
  ];

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")],
    };
    webviewView.webview.html = this.html(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === "review") await this.runReview();
      else if (msg.type === "enterRun") {
        this.stack.push({ kind: "bubble", flow: msg.flow, bubble: String(msg.bubble) });
        this.pushState();
      } else if (msg.type === "enterNode") await this.enterNode(msg);
      else if (msg.type === "back") {
        this.stack.pop();
        if (this.stack.length === 0) this.stack.push({ kind: "flow" });
        this.pushState();
      }
    });
  }

  async runReview() {
    try {
      const root = packageRoot();
      const cli = resolveCli();
      const args = ["review", "--root", root, "--json"];
      const parent = parentRoot(root);
      if (parent) args.push("--parent", parent);
      const { stdout } = await execFile(cli, args, {
        maxBuffer: 32 * 1024 * 1024,
        windowsHide: true,
      });
      this.snapshot = JSON.parse(stdout.slice(stdout.indexOf("{")));
      this.stack = [{ kind: "flow" }];
      this.pushState();
      vscode.window.showInformationMessage(
        `Graphide: ${this.snapshot.flows?.length ?? 0} flow(s), ${this.snapshot.findings?.length ?? 0} finding(s)`
      );
    } catch (e: any) {
      vscode.window.showErrorMessage(`Graphide review failed: ${e.message ?? e}`);
    }
  }

  private async enterNode(msg: any) {
    if (!msg.isLeaf) {
      this.stack.push({ kind: "bubble", flow: msg.flow, bubble: msg.id });
      this.pushState();
      return;
    }
    const node = this.snapshot?.graph?.nodes?.find((n: any) => String(n.id) === String(msg.id));
    if (!node) return;
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
    if (top.kind === "flow") {
      this.view.webview.postMessage({
        type: "flowchart",
        flows: this.snapshot.flows || [],
        flow: this.snapshot.flows?.[0],
        coverage: this.snapshot.coverage,
        findings: this.snapshot.findings,
        bubbles: this.snapshot.bubbles,
        graph: this.snapshot.graph,
      });
      return;
    }
    void this.loadInner(top.flow, top.bubble);
  }

  private async loadInner(flow: string, bubble: string) {
    try {
      const { stdout } = await execFile(
        resolveCli(),
        ["enter", "--root", packageRoot(), "--flow", flow, "--bubble", String(bubble)],
        { maxBuffer: 16 * 1024 * 1024, windowsHide: true }
      );
      const inner = JSON.parse(stdout.slice(stdout.indexOf("{")));
      this.view?.webview.postMessage({
        type: "inner",
        inner,
        coverage: this.snapshot.coverage,
        findings: this.snapshot.findings,
      });
    } catch (e: any) {
      vscode.window.showErrorMessage(`Graphide enter failed: ${e.message ?? e}`);
    }
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
    <div class="brand">Graphide</div>
    <button id="reviewBtn">Review</button>
    <button id="backBtn">Back</button>
  </header>
  <section id="meta"></section>
  <section id="canvas"></section>
  <section id="coverage"></section>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function packageRoot(): string {
  const cfg = vscode.workspace.getConfiguration("graphide");
  const configured = cfg.get<string>("packageRoot")?.trim();
  if (configured) return configured;
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!folder) throw new Error("Open a workspace folder");
  const demo = path.join(folder, "fixtures", "demo");
  if (fs.existsSync(path.join(demo, "flows.toml"))) return demo;
  return folder;
}

function parentRoot(head: string): string | undefined {
  const cfg = vscode.workspace.getConfiguration("graphide");
  const configured = cfg.get<string>("parentRoot")?.trim();
  if (configured && fs.existsSync(configured)) return configured;
  const guess = path.join(path.dirname(head), "demo-parent");
  if (path.basename(head) === "demo" && fs.existsSync(path.join(guess, "src"))) return guess;
  return undefined;
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
