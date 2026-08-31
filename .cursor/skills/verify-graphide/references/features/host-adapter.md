# Host adapter

How the Review webview talks to VS Code / Cursor — and how the headless harness fakes that.

## Sub-features

- Product bundle (`extension/media/main.js`) is esbuild of `extension/media/src/`. React 18 `flushSync` mounts the Apple desk on `#root`, then `bootDesk()` (`graph/desk.js`) binds the same ids and calls `acquireHost()` (`host/adapter.js` → `acquireVsCodeApi()` once).
- Real host injects the VS Code webview API. `ReviewViewProvider.html()` (`extension/src/extension.ts`) is a thin shell: appearance class on `html`/`body`, CSP nonce, `#root`, `main.css` (which `@import`s `xyflow.css`), `main.js`. Same shell as `webview-harness.html` (plus harness `#probe` / `#suite`). XYFlow CSS is an extension file on `webview.cspSource` — not `style-src 'unsafe-inline'`.
- Host ← webview messages (non-exhaustive): `review`, `selectFlow`, `selectProgram`, `enterRun`, `enterNode`, `peekSource`, `back`, `cancel`, `stamp`, `skip`, `llmAsk`, `llmSave`, `llmTest`, `llmStatus`, `setAppearance`, `exportFile`.
- Host → webview messages: `programs`, `flowchart`, `inner`, `source`, `llmStatus`, `llmReply`, `llmError`, progress / preview.
- `writeStamp` (host only) writes `.graphide/stamps/`. `peekSource` on the host reads a span and posts `{ type: "source", ... }`.
- Harness stub (in `webview-harness.html`, **before** `main.js`):

```js
window.acquireVsCodeApi = function () {
  return {
    postMessage: function (m) {
      window.__vscodePosts = window.__vscodePosts || [];
      window.__vscodePosts.push(m);
      console.log("vscode.postMessage", m);
    },
    getState: function () { return null; },
    setState: function () {},
  };
};
```

- Harness then `window.postMessage(payload, "*")` with a synthetic `programs` / `flowchart` object so `main.js` paints without a CLI review.

## How to get to it (user POV)

You do not “open” the adapter. In Cursor / VS Code the webview is the Graphide **Flow Review** view. In CI / doctor, you open the harness HTML in Chromium. Same `main.js` / `main.css`; different host.

## Driving it with the harness

Serve `extension/` and open:

```
/scripts/webview-harness.html?mode=explorer&probe=0
```

Prove the stub:

- `typeof window.acquireVsCodeApi === "function"`
- clicking `#srcEditor` after Evidence is open appends `{ type: "enterNode", ... }` to `window.__vscodePosts`
- clicking `#stampBtn` appends `{ type: "stamp", flow }` — and no files appear under `.graphide/stamps/`
- `html.bright` / `body.bright` match the product chrome (`themeClass` in `extension.ts`, hardcoded on the harness `<html>`)

Chrome parity to keep in the maps (ids must exist in `extension/media/src/chrome/` and in the running `#root`): `#stampBtn`, `#skipBtn`, `#sourcePane`, `#ledgerPane`, `#workspaces [data-ws]`, `#llmPane`, `#themeSeg`, `#keysPane`, `#exportBtn`, `#presentBtn`, `#presetBtn`, `#pathBtn`, `#lensBtn`. `check-map.js` string-checks the React chrome source.

## Gotchas

- Host and harness are `#root` shells. Desk markup lives in React (`extension/media/src/chrome/`). Add an id there, not in two HTML copies.
- CSP: the real webview sets `script-src 'nonce-…'` (no `unsafe-eval` / `unsafe-inline`). The harness has no CSP. Do not treat harness-only `eval` as product-safe. `bootDesk` must finish in the same tick as `main.js` (`flushSync`) so `webview-harness.js` can `postMessage` immediately after.
- `?live=1` without `require=1` still falls back to the synthetic payload (`loadLiveSnap` catch). That is not a live host and not a self-review.
- CI writes `extension/scripts/live-snap.json` via `graphide review` and opens `?live=1&probe=0&require=1`. `require=1` posts `{ type: "error" }` instead of the explorer fixture when the snap is missing or invalid. `window.__graphideLive` / `__graphideLiveError` are the hooks.
- Never point the driver at `file://` if a later suite needs `fetch("./live-snap.json")`. HTTP from `extension/` keeps relative URLs identical to a webview.
- Do not add a second language plugin, a desk restyle, or a SolarSim-only snap generator. Self-review derives **this** checkout. Synthetic explorer mode stays the chrome 17/17 floor.
