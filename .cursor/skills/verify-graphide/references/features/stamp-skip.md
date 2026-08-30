# Stamp / skip

Human attestation that a proposed Steiner flow still holds — or an explicit skip. Agents never do this.

## Sub-features

- Header buttons `#stampBtn` (“Human stamp: this flow still holds (S)”) and `#skipBtn` (“Skip this flow without a stamp (X)”).
- Keys `S` / `X` when focus is not in an input.
- Enabled only when `currentFlow()` is set (`stampBtn.disabled = !currentFlow()`).
- Webview `requestStamp` / `requestSkip` update in-memory `stampRows` / `skippedFlows`, flash `#toast`, flash the button (`.flash-holds` / `.flash-skip`), then `vscode.postMessage({ type: "stamp"|"skip", flow })`.
- Decisions workspace (`#workspaces [data-ws="decisions"]`) lists holds / broken / skipped. Registry and Timeline also surface stamp scars.
- Real host (`extension.ts`): `onDidReceiveMessage` → `writeStamp(msg.flow)` / `skipFlow(msg.flow)`.
  - `writeStamp` mkdir-writes `packageRoot()/.graphide/stamps/<flow>.json` via `stampFromView`.
  - `skipFlow` only appends to `this.skipped` and `pushState()`.
- Coverage footer `#coverage` / `.score-chip` counts stamped / skipped / uncovered.

## How to get to it (user POV)

1. Review a folder. Pick a flow (Slice / flow tab `#tabs [data-flow]`).
2. A **human** presses **Stamp** if every changed derived node on that Steiner tree still holds, or **Skip** to record a skip without a stamp.
3. Decisions shows the outcome. The stamp file is the attestation — not a CI check, not an agent action.

## Driving it with the harness

The harness may click `#stampBtn` / `#skipBtn` **only** to prove the host message is posted.

```
const before = await page.evaluate(() => (window.__vscodePosts || []).length);
await page.click("#stampBtn");
const posts = await page.evaluate(() => window.__vscodePosts || []);
// expect posts.slice(before) to include { type: "stamp", flow }
```

Same for `#skipBtn` → `{ type: "skip", flow }`.

Do **not**:

- write `.graphide/stamps/` from the driver
- treat `window.__vscodePosts` as a human approval
- enable agent-stamping to “enforce” coverage

`mode=explorer` leaves a current flow (`overview` / `control-flow` / `boot`), so the buttons are enabled after first paint.

The self-review step (`graphide review` + `?live=1&require=1`) must **not** write `.graphide/stamps/`. It may leave Stamp/Skip enabled; it must not treat that as coverage.

## Gotchas

- **Coverage rule** (human, not agent-enforced): every changed derived node on a proposed Steiner flow must be stamped or skipped by a person. Document it; do not invent an agent that writes stamps.
- The stub `acquireVsCodeApi().postMessage` only pushes onto `window.__vscodePosts`. It never touches disk. A green stamp-message check is **not** a stamped repo.
- `requestStamp` paints “holds” in the webview immediately, without waiting on the host. That local paint is not an attestation.
- Ask / LLM (`#llmBtn`, `{ type: "llmSave" }`) must never post `{ type: "stamp" }`.
- Do not add `data-action-id="stamp"`. `#stampBtn` and `#skipBtn` are the product hooks.
