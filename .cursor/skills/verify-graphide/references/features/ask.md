# Ask

Graph-only answers about the current Review path, hop, or coverage. Header
`#llmBtn` opens `#llmPane`. An LLM host is optional — `localAsk` answers
from the derived snapshot when no host is configured. Not a second
workspace and not an agent stamp.

## Sub-features

- Header `#llmBtn` (LLM). Opens `#llmPane` (Ask). `#llmClose` and Escape
  hide it. `L` is Lens. `/` is Find. Do not steal either.
- Connect form (`#llmBaseUrl`, `#llmModel`, `#llmKey`, `#llmSave`) posts
  `{ type: "llmSave" }` to the host. CI never needs a real OpenAI key.
- `#llmAsk` + `#llmSend` post `{ type: "llmAsk" }`. Without a configured
  host the harness stub does not reply; after a short wait `localAsk`
  writes a graph answer into `#llmLog`.
- Graph-only text names the start → features → end path, control-flow
  hops, and coverage counts when asked. It always says agents never stamp.
- Host `llmReply` / `llmError` increment the in-flight token. Empty host
  text falls back to `localAsk`. `askReview` in `extension/src/llm.ts`
  uses `groundedFallback` when `llmConfigured` is false.
- Stamp / skip stay human. Ask never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview or open Map.
2. Click **LLM** (`#llmBtn`). The Ask pane slides open. Status says
   graph-only until a host is saved.
3. Type a question about the start → features → end path, a hop, or
   coverage. Press **Ask** (or Enter). The log shows a graph answer
   without a key.
4. Close with **Close** or Escape. Stamp and Skip are still the human
   attestation. Ask does not stamp.

The in-tree proof is the explorer desk (`?mode=explorer`) plus the same
`localAsk` path on a derived snap. No OpenAI key.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map paints community cards:

```
document.getElementById("llmBtn").click();          // #llmPane.open
document.getElementById("llmAsk").value = "Tell the start to end path";
document.getElementById("llmSend").click();         // localAsk → #llmLog
document.getElementById("llmClose").click();        // hidden
// reopen, then Escape
```

Driver assertions:

- `#llmBtn` opens `#llmPane` (not hidden, `.open`)
- `#llmClose`, `#llmAsk`, `#llmSend`, `#llmLog` exist
- graph-only answer matches `/Start → features → end/` and `/never stamp/`
- hop or coverage questions still produce a non-empty `#llmLog`
- `#llmClose` and Escape hide the pane
- Ask pane is not covered by Evidence / ledger / keys / export
- screenshot `verification/ask.png` is not a black frame
- Map altitude stays `xy=0`
- `.graphide/stamps/` is still empty; no `{ type: "stamp" }` post

## Gotchas

- `L` is Lens. Do not steal it for Ask. `#llmBtn` is the product hook.
- `/` is Find. Do not turn Ask into a second search box.
- Escape must close Ask even while `#llmAsk` is focused (`setLlmPane`
  focuses the textarea on open).
- Do not add `data-component` / `data-testid`. `#llmBtn`, `#llmPane`,
  `#llmClose`, `#llmAsk`, `#llmSend`, `#llmLog` are the hooks.
- Do not require `graphide.llm.*` or an API key in CI. Graph-only is
  the prove path.
- Host `llmAsk` / `llmSave` / `llmStatus` never call `writeStamp`.
- `#llmPane` must stack above the desk (`z-index`) and not shrink to
  an empty strip in the flex column.
