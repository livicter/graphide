# Keys

Shortcut sheet for the Review desk. `?` (or header `#keysBtn`, or F1)
opens `#keysPane`. The list is the bindings already in `desk.js` — not a
second command palette and not an agent stamp.

## Sub-features

- Header `#keysBtn` (`?`). `?` / F1 toggle `#keysPane` even when the sheet
  is already open (`K17`) — modal chrome must not swallow the second `?`.
  Opening Keys closes Ask (`K18`), same exclusive chrome as Export (`K18b`). Opening Ask closes Keys (`K18c`) and Export (`K18d`). Opening Export closes Keys (`K18e`). Opening Keys closes Export (`K18f`). Opening Present closes Ask (`K18g`), Keys (`K18h`), Export (`K18i`), Evidence (`K18j`), Lens (`K18k`), and Route (`K18l`). Opening Ask closes Evidence (`K18m`). Opening Ask closes Lens (`K18n`). Opening Ask closes Route (`K18o`). Opening Keys closes Evidence (`K18p`). Opening Keys closes Lens (`K18q`). Opening Keys closes Route (`K18r`). Opening Export closes Evidence (`K18s`). Opening Export closes Lens (`K18t`). Opening Export closes Route (`K18u`). Opening Evidence closes Ask (`K18v`). Opening Lens closes Ask (`K18w`). Opening Route closes Ask (`K18x`). Opening Evidence closes Keys (`K18y`). Opening Evidence closes Export (`K18z`). Opening Lens closes Keys (`K18aa`). Opening Lens closes Export (`K18ab`). Opening Route closes Keys (`K18ac`). Opening Keys / Export / Ask / Evidence / Present / Lens / Route / Find hides the hover tip (`K19`, `K19b`, `K19c`, Evidence `K19d`, Present `K19e`, Lens `K19f`, Route `K19g`, Find `K19h`) and clears the toast (`K20`, Export `K20b`, Ask `K20c`, Evidence `K20d`, Present `K20e`, Lens `K20f`, Route `K20g`, Find `K20h`). `#keysClose` and Escape hide it. `/` is Find. Do not steal it.
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
- Open Keys sheet blocks desk R so PATH stays closed (`K15d`), same as Export (`K15`).
- Open Keys sheet blocks desk L so LENS stays closed (`K15f`), same as Export (`K15h`) / Ask (`K15g`).
- Open Export blocks desk F so Present stays off (`K15i`), residual chrome key lock after S / X / R / L.
- Open Keys sheet blocks desk F so Present stays off (`K15j`), same as Export (`K15i`).
- Open Ask blocks desk F so Present stays off (`K15k`), same as Export (`K15i`) / Keys (`K15j`).
- Open Export blocks desk E so Ego stays off (`K15l`), residual chrome key lock after S / X / R / L / F.
- Open Keys sheet blocks desk E so Ego stays off (`K15m`), same as Export (`K15l`).
- Open Ask blocks desk E so Ego stays off (`K15n`), same as Export (`K15l`) / Keys (`K15m`).
- Open Export blocks desk D so day/night stays put (`K15o`), residual chrome key lock after S / X / R / L / F / E.
- Open Keys sheet blocks desk D so day/night stays put (`K15p`), same as Export (`K15o`).
- Open Ask blocks desk D so day/night stays put (`K15q`), same as Export (`K15o`) / Keys (`K15p`).
- Open Export blocks desk P so Play stays off (`K15r`), residual chrome key lock after S / X / R / L / F / E / D.
- Open Keys sheet blocks desk P so Play stays off (`K15s`), same as Export (`K15r`).
- Open Ask blocks desk P so Play stays off (`K15t`), same as Export (`K15r`) / Keys (`K15s`).
- Open Export blocks desk `[` `]` so path step stays put (`K15u`), residual chrome key lock after S / X / R / L / F / E / D / P.
- Open Keys sheet blocks desk `[` `]` so path step stays put (`K15v`), same as Export (`K15u`).
- Open Ask blocks desk `[` `]` so path step stays put (`K15w`), same as Export (`K15u`) / Keys (`K15v`).
- Open Export blocks desk `+` `−` so zoom stays put (`K15x`), residual chrome key lock after S / X / R / L / F / E / D / P / `[` `]`.
- Open Keys sheet blocks desk `+` `−` so zoom stays put (`K15y`), same as Export (`K15x`).
- Open Ask blocks desk `+` `−` so zoom stays put (`K15z`), same as Export (`K15x`) / Keys (`K15y`).
- Open Export blocks desk `0` so Fit stays put (`K15aa`), residual chrome key lock after S / X / R / L / F / E / D / P / `[` `]` / `+` `−`.
- Open Keys sheet blocks desk `0` so Fit stays put (`K15ab`), same as Export (`K15aa`).
- Open Ask blocks desk `0` so Fit stays put (`K15ac`), same as Export (`K15aa`) / Keys (`K15ab`).
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
- `#keysClose` and Escape hide the pane; a second `?` also toggles closed (`K17`); opening Keys closes Ask (`K18`); opening Export closes Ask (`K18b`); opening Ask closes Keys (`K18c`); opening Ask closes Export (`K18d`); opening Export closes Keys (`K18e`); opening Keys closes Export (`K18f`); opening Present closes Ask (`K18g`); opening Present closes Keys (`K18h`); opening Present closes Export (`K18i`); opening Present closes Evidence (`K18j`); opening Present closes Lens (`K18k`); opening Present closes Route (`K18l`); opening Ask closes Evidence (`K18m`); opening Ask closes Lens (`K18n`); opening Ask closes Route (`K18o`); opening Keys closes Evidence (`K18p`); opening Keys closes Lens (`K18q`); opening Keys closes Route (`K18r`); opening Export closes Evidence (`K18s`); opening Export closes Lens (`K18t`); opening Export closes Route (`K18u`); opening Evidence closes Ask (`K18v`); opening Lens closes Ask (`K18w`); opening Route closes Ask (`K18x`); opening Evidence closes Keys (`K18y`); opening Evidence closes Export (`K18z`); opening Lens closes Keys (`K18aa`); opening Lens closes Export (`K18ab`); opening Route closes Keys (`K18ac`); opening Keys hides the tip (`K19`, Export `K19b`, Ask `K19c`, Evidence `K19d`, Present `K19e`, Lens `K19f`, Route `K19g`, Find `K19h`); opening Keys clears the toast (`K20`, Export `K20b`, Ask `K20c`, Evidence `K20d`, Present `K20e`, Lens `K20f`, Route `K20g`, Find `K20h`)
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
- open Export / Keys / Ask: S / X / R do not stamp, skip, or PATH (`K15`, `K15b`, `K15c`, `K15d`, `K15e`); Export / Keys / Ask also block L (`K15h`, `K15f`, `K15g`); Export / Keys / Ask also block F (`K15i`, `K15j`, `K15k`); Export / Keys / Ask also block E (`K15l`, `K15m`, `K15n`); Export / Keys / Ask also block D (`K15o`, `K15p`, `K15q`); Export / Keys / Ask also block P (`K15r`, `K15s`, `K15t`); Export / Keys / Ask also block `[` `]` (`K15u`, `K15v`, `K15w`); Export / Keys / Ask also block `+` `−` (`K15x`, `K15y`, `K15z`); Export / Keys / Ask also block `0` Fit (`K15aa`, `K15ab`, `K15ac`)
- auto-repeat `S` `X` `D` `F` `E` `R` `L` `P` Backspace: no stamp / skip
  / `setAppearance` post, no mode change; repeat `+` still zooms (`K10`)

## Gotchas

- `/` is Find. Do not steal it for the sheet. `?` / F1 / `#keysBtn` are
  the product hooks.
- Opening Keys closes Evidence (`K18p`). Escape then closes Keys; Evidence
  stays closed. Do not steal Evidence Escape when Keys is hidden.
- Opening Keys closes Route (`K18r`). Escape then closes Keys; Route
  stays closed.
- Opening Export closes Route (`K18u`). Escape then closes Export; Route
  stays closed.
- Do not add `data-component` / `data-testid`. `#keysBtn`, `#keysPane`,
  `#keysClose` are the hooks.
- Do not invent a second drawing tool or a Mermaid cheatsheet.
- `#keysPane` must stack above the desk (`z-index`) and start `hidden`.
- Agents never stamp. The sheet is a reminder that `S` / `X` are human.
