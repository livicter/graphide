# Keys

Shortcut sheet for the Review desk. `?` (or header `#keysBtn`, or F1)
opens `#keysPane`. The list is the bindings already in `desk.js` — not a
second command palette and not an agent stamp.

## Sub-features

- Header `#keysBtn` (`?`). `?` / F1 toggle `#keysPane`. `#keysClose` and
  Escape hide it. `/` is Find. Do not steal it.
- Sheet lists the live desk keys: `1`–`9` workspaces, `/` find, `?` this
  sheet, `S` stamp, `X` skip, `P` play, `[` `]` step, `R` PATH, `L` LENS,
  `E` ego, `F` present, `D` day / night, `+` `−` zoom, `0` fit, Backspace
  back. Assert the text. Do not invent shortcuts.
- Stamp / skip stay human. Opening the sheet never posts `{ type: "stamp" }`
  and never writes `.graphide/stamps/`.
- Map altitude stays community LOD (`xy=0`). Keys is chrome, not a
  workspace and not a React IR dump.

## How to get to it (user POV)

1. Review a folder. Land on Overview or open Map.
2. Press `?` (or click the header `?`). The Keys sheet opens.
3. Read the bindings. Close with **Close** or Escape.
4. Stamp and Skip are still the human attestation. The sheet does not stamp.

The in-tree proof is the explorer desk (`?mode=explorer`). UIUX samples:
`UIUX_sample/keys-sheet.png` and `keys-sheet-night.png`.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map paints community cards (Ask closed so the sheet is not buried):

```
document.activeElement.blur();
document.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
// #keysPane.open — or document.getElementById("keysBtn").click()
document.getElementById("keysClose").click();        // hidden
// reopen, then Escape
```

Driver assertions:

- `?` (or `#keysBtn`) opens `#keysPane` (not hidden, `.open`)
- `#keysClose` exists; sheet text lists `/` find, `?` this sheet,
  `S` stamp, `X` skip, `E` ego, `F` present, `D` day
- `#keysClose` and Escape hide the pane
- Keys is not covered by Ask / export while open; close it before Evidence
  / ledger / Ask / Export suites so it does not stay on top of them
- screenshot `verification/keys.png` is not a black frame
- Map altitude stays `xy=0`
- `.graphide/stamps/` is still empty; no `{ type: "stamp" }` post

## Gotchas

- `/` is Find. Do not steal it for the sheet. `?` / F1 / `#keysBtn` are
  the product hooks.
- Escape closes Keys even while Evidence is open (the sheet is on top).
  Ask still wins first. Do not steal Evidence Escape when Keys is hidden.
- Do not add `data-component` / `data-testid`. `#keysBtn`, `#keysPane`,
  `#keysClose` are the hooks.
- Do not invent a second drawing tool or a Mermaid cheatsheet.
- `#keysPane` must stack above the desk (`z-index`) and start `hidden`.
- Agents never stamp. The sheet is a reminder that `S` / `X` are human.
