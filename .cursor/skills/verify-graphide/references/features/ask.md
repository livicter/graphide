# Ask

Graph-only answers about the current Review path, hop, or coverage. Header
`#llmBtn` opens `#llmPane`. An LLM host is optional — `localAsk` answers
from the derived snapshot when no host is configured. Not a second
workspace and not an agent stamp.

## Sub-features

- Header `#llmBtn` (LLM). Opens `#llmPane` (Ask). `#llmClose` and Escape
  hide it. `L` is Lens. `/` is Find. Do not steal either.
- Opening Ask hides the hover tip (`K19c`).
- Opening Ask clears the toast (`K20c`).
- Keys / Export / Present close Ask when they open (`K18` / `K18b` / `K18g`) — exclusive chrome.
- Opening Ask closes Keys (`K18c`), same exclusive chrome as Keys closing Ask (`K18`).
- Opening Ask closes Export (`K18d`), same exclusive chrome as Export closing Ask (`K18b`).
- Opening Ask closes Evidence (`K18m`), same exclusive chrome as Present closing Evidence (`K18j`).
- Opening Ask closes Lens (`K18n`), same exclusive chrome as Present closing Lens (`K18k`).
- Opening Ask closes Route (`K18o`), same exclusive chrome as Present closing Route (`K18l`).
- Connect form (`#llmBaseUrl`, `#llmModel`, `#llmKey`, `#llmSave`) posts
  `{ type: "llmSave" }` to the host. CI never needs a real OpenAI key.
- `#llmAsk` + `#llmSend` post `{ type: "llmAsk" }`. Without a configured
  host the harness stub does not reply; after a short wait `localAsk`
  writes a graph answer into `#llmLog`.
- Enter sends (Shift+Enter is a newline). An Enter that commits an IME
  candidate (`isComposing`, e.g. Cantonese / Japanese input) never sends;
  same for the header `#prompt`, which never starts a review mid-compose.
- Ask (`#llmSend`) returns focus to `#llmAsk`, so typing the next
  question never lands on the button and fires desk keys (`S` stamp,
  `X` skip…).
- Graph-only text names the start → features → end path, control-flow
  hops, and coverage counts when asked. It always says agents never stamp.
- Host `llmReply` / `llmError` increment the in-flight token. Empty host
  text falls back to `localAsk`. `askReview` in `extension/src/llm.ts`
  uses `groundedFallback` when `llmConfigured` is false.
- Stamp / skip stay human. Ask never writes `.graphide/stamps/`.
- While Ask is open, desk S / X are ignored even if `#llmAsk` is blurred (`K15c`).
- Open Ask blocks desk R so PATH stays closed (`K15e`), same as Export (`K15`) / Keys (`K15d`).
- Open Ask blocks desk L so LENS stays closed (`K15g`), same as Keys (`K15f`) / Export (`K15h`).
- Open Ask blocks desk F so Present stays off (`K15k`), same as Export (`K15i`) / Keys (`K15j`).

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
- IME-composing Enter in `#llmAsk` / `#prompt` keeps the text and posts
  no `llmAsk` / `review` (`A3b`)
- click `#llmSend`, type `sx`: text lands in `#llmAsk`, no stamp / skip
  post (`A3c`)
- opening Present closes Ask (`K18g`)
- opening Ask closes Evidence (`K18m`)
- opening Ask closes Lens (`K18n`)
- opening Ask closes Route (`K18o`)
- open Ask (field blurred): R does not open PATH (`K15e`)
- open Ask (field blurred): L does not open LENS (`K15g`)
- open Ask (field blurred): F does not enter Present (`K15k`)
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
