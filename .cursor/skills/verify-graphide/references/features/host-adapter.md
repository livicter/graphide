# Host adapter

How the Review webview talks to VS Code / Cursor — and how the headless harness fakes that.

## Sub-features

- Product script starts with `const vscode = acquireVsCodeApi();` (`extension/media/main.js`).
- Real host injects the VS Code webview API. HTML chrome is built in `ReviewViewProvider.html()` (`extension/src/extension.ts`) — same ids as the harness document.
- Host ← webview messages (non-exhaustive): `review`, `selectFlow`, `selectProgram`, `enterRun`, `enterNode`, `peekSource`, `back`, `cancel`, `stamp`, `skip`, `llmAsk`, `llmSave`, `llmTest`, `llmStatus`, `setAppearance`.
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

Chrome parity to keep in the maps (ids must exist in **both** `extension.ts` `html()` and `webview-harness.html`): `#stampBtn`, `#skipBtn`, `#sourcePane`, `#ledgerPane`, `#workspaces [data-ws]`, `#llmPane`, `#themeSeg`, `#keysPane`. `check-map.js` already string-checks several of these.

## Gotchas

- The harness HTML is a **copy** of the extension chrome, not generated from `extension.ts`. If you add an id to one side, add it to the other or `check-map.js` / this loop will lie.
- CSP: the real webview sets `script-src 'nonce-…'`. The harness has no CSP. Do not treat harness-only `eval` as product-safe.
- `?live=1` without `require=1` still falls back to the synthetic payload (`loadLiveSnap` catch). That is not a live host and not a self-review.
- CI writes `extension/scripts/live-snap.json` via `graphide review` and opens `?live=1&probe=0&require=1`. `require=1` posts `{ type: "error" }` instead of the explorer fixture when the snap is missing or invalid. `window.__graphideLive` / `__graphideLiveError` are the hooks.
- Never point the driver at `file://` if a later suite needs `fetch("./live-snap.json")`. HTTP from `extension/` keeps relative URLs identical to a webview.
- Do not add a second language plugin, a desk restyle, or a SolarSim-only snap generator. Self-review derives **this** checkout. Synthetic explorer mode stays the chrome 17/17 floor.
