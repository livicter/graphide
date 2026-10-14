# Keys

Shortcut sheet for the Review desk. `?` (or header `#keysBtn`, or F1)
opens `#keysPane`. The list is the bindings already in `desk.js` — not a
second command palette and not an agent stamp.

## Sub-features

- Header `#keysBtn` (`?`). `?` / F1 toggle `#keysPane` even when the sheet
  is already open (`K17`) — modal chrome must not swallow the second `?`.
  `#keysClose` and Escape hide it. `/` is Find. Do not steal it.
- Sheet lists the live desk keys: `1`–`9` workspaces, `/` find, `?` this
  sheet, `S` stamp, `X` skip, `P` play, `[` `]` step, `R` PATH, `L` LENS,
  `E` ego, `F` present, `D` day / night, `+` `−` zoom, `0` fit, Backspace
  back. Assert the text. Do not invent shortcuts.
- Desk keys are bare keys (Shift allowed). Cmd / Ctrl chords belong to
  VS Code (save, cut, find, quick open) and fall through: `Cmd+S` never
  stamps, `Ctrl+X` never skips. Ctrl+Alt is AltGr on EU layouts, so it
  still types `/` `[` `]` `?`.
- Text fields own their keys; a focused kind-pill checkbox does not, so
  after clicking `Function` / `Type` / `Endpoint` the desk keys still work.
- A focused `<select>` (`#egoHops`, `#llmPreset`) owns its typeahead:
  `2` picks 2-hop instead of switching workspace, `S` / `X` never stamp
  or skip. Escape still backs out of the desk layers.
- Backspace while Review is busy cancels (`CR1b`).
- Backspace closes open chrome first (Ask / Keys / Evidence / Export /
  Route / Lens / Present), then navigates back — it does not leave a
  bubble with Export still open.
- On Presentation Stage with Keys open, Backspace closes Keys and stays on the stage (`K14i`).
- On Presentation Stage with Export open, Backspace closes Export and stays on the stage (`K14j`).
- On Presentation Stage with Lens open, Backspace closes Lens and stays on the stage (`K14k`).
- On Presentation Stage with Route open, Backspace closes Route and stays on the stage (`K14l`).
- While Export, Keys, or Ask is open, desk action keys are ignored
  (S must not stamp under the Export menu).
- Holding a key fires its toggle / action once: auto-repeat (`e.repeat`)
  of `S` `X` `D` `F` `E` `R` `L` `P` Backspace is ignored (no stamp
  spam, no theme flicker writing the global `graphide.appearance`, no
  multi-level Back). `+` `−` zoom, `[` `]` step and arrows still repeat.
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
- Cmd / Ctrl chords (`Ctrl+S`, `Cmd+S`, `Ctrl+X`, `Cmd+X`, `Cmd+F`,
  `Ctrl+D`, `Cmd+E`, `Ctrl+R`, `Cmd+L`, `Ctrl+2`) post no stamp / skip
  and change no desk mode (`K8`); Ctrl+Alt `/` still focuses Find (`K8b`)
- click a kind pill twice (filter restored, checkbox focused), `R`
  still toggles PATH (`K11`)
- focused `#egoHops` + `2` / `S` / `X`: workspace unchanged, no stamp /
  skip post (`K9`)
- focused Ask `#llmPreset` + `2` / `S` / `X`: same — no stamp / skip /
  workspace switch (`K12`)
- Escape on focused `#graphSearch` blurs Find (query stays) so desk keys
  work again (`K13`, `K13b`); if Route was open it closes too (`K13c`); Evidence closes too (`K13d`); Lens closes too (`K13e`); Export closes too (`K13f`)
- Escape on focused `#prompt` blurs (value stays) so desk keys work (`K16`, `K16b`)
- Backspace with Export / Route open closes that layer and keeps Map
  community LOD (`K14`, `K14b`); inside Enter, Export closes without popping (`K14c`); Keys closes too (`K14d`); Ask closes too (`K14e`); Evidence (`K14f`); Lens (`K14g`); Present (`K14h`); Keys on Present closes without exiting (`K14i`); Export on Present too (`K14j`); Lens on Present too (`K14k`); Route on Present too (`K14l`)
- open Export / Keys: S / X / R do not stamp, skip, or PATH (`K15`, `K15b`, `K15c`)
- auto-repeat `S` `X` `D` `F` `E` `R` `L` `P` Backspace: no stamp / skip
  / `setAppearance` post, no mode change; repeat `+` still zooms (`K10`)

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
