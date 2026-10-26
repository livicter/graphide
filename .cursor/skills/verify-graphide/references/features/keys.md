# Keys

Shortcut sheet for the Review desk. `?` (or header `#keysBtn`, or F1)
opens `#keysPane`. The list is the bindings already in `desk.js` — not a
second command palette and not an agent stamp.

## Sub-features

- Header `#keysBtn` (`?`). `?` / F1 toggle `#keysPane` even when the sheet
  is already open (`K17`) — modal chrome must not swallow the second `?`.
  Opening Keys closes Ask (`K18`), same exclusive chrome as Export (`K18b`). Opening Ask closes Keys (`K18c`) and Export (`K18d`). Opening Export closes Keys (`K18e`). Opening Keys closes Export (`K18f`). Opening Present closes Ask (`K18g`), Keys (`K18h`), Export (`K18i`), Evidence (`K18j`), Lens (`K18k`), and Route (`K18l`). Opening Ask closes Evidence (`K18m`). Opening Ask closes Lens (`K18n`). Opening Ask closes Route (`K18o`). Opening Keys closes Evidence (`K18p`). Opening Keys closes Lens (`K18q`). Opening Keys closes Route (`K18r`). Opening Export closes Evidence (`K18s`). Opening Export closes Lens (`K18t`). Opening Export closes Route (`K18u`). Opening Evidence closes Ask (`K18v`). Opening Lens closes Ask (`K18w`). Opening Route closes Ask (`K18x`). Opening Evidence closes Keys (`K18y`). Opening Evidence closes Export (`K18z`). Opening Lens closes Keys (`K18aa`). Opening Lens closes Export (`K18ab`). Opening Route closes Keys (`K18ac`). Opening Route closes Export (`K18ad`). Opening Evidence closes Lens (`K18ae`). Opening Evidence closes Route (`K18af`). Opening Keys / Export / Ask / Evidence / Present / Lens / Route / Find hides the hover tip (`K19`, `K19b`, `K19c`, Evidence `K19d`, Present `K19e`, Lens `K19f`, Route `K19g`, Find `K19h`) and clears the toast (`K20`, Export `K20b`, Ask `K20c`, Evidence `K20d`, Present `K20e`, Lens `K20f`, Route `K20g`, Find `K20h`). `#keysClose` and Escape hide it. `/` is Find. Do not steal it.
- Sheet lists the live desk keys: `1`–`9` workspaces, `/` find, `?` this
  sheet, `S` stamp, `X` skip, `P` play, `[` `]` step, `R` PATH on Map (and other desks); on Trace/Passport `R` residual filter (`data-keys-r-binding` / `data-keys-residual-hint`, KH1–KH3; pressed + toast KP1–KP3; Passport pressed proof PKP1–PKP3), `L` LENS,
  `E` ego, `F` present, `D` day / night, `+` `−` zoom, `0` fit, Backspace
  back. Assert the text. Do not invent shortcuts.
- ADE Keys residual-filter hint (KH1–KH3): `#keysPane` R row is workspace-aware via
  `syncKeysRRow` in `desk.js`. Trace/Passport open Keys → `data-keys-row="r"` with
  `data-keys-r-binding="residual-filter"` / `data-keys-residual-hint="1"` and binding
  text `residual filter` (not PATH-only). Map (and other desks) keep
  `data-keys-r-binding="path"` / `data-keys-residual-hint="0"` and text `PATH`.
  Proof: `verification/keys-residual-filter.png` (Trace Keys). Existing `keys.png`
  stays the Map Review snap. Opening Keys / switching workspace while Keys is open
  refreshes the R row; no second sheet.
- ADE Keys R pressed-state + residual-filter toast (KP1–KP3): when Trace/Passport and
  `trajResidualFilter===true`, `[data-keys-row="r"]` mirrors ON via `aria-pressed="true"`,
  `data-keys-r-pressed="1"`, and classes `on` / `pressed` (clears when filter OFF or leaving
  Trace/Passport). `toggleTrajResidualFilter` / `clearTrajResidualFilter` call `flashToast`
  with `Residuals on` (`ok`) / `Residuals off` (`skip`); no-op clear when already off does
  not toast. Covers R key, legend toggle, Passport sticky toggle, and clear affordances.
  Proof: `verification/keys-residual-pressed.png` (Trace Keys + filter ON).
- ADE Passport Keys pressed-state proof (PKP1–PKP3): Passport path parity for the same
  `syncKeysRRow` pressed chrome. Open Passport, residual filter ON (R / sticky toggle),
  open Keys → `[data-keys-row="r"]` has `aria-pressed="true"` / `data-keys-r-pressed="1"` /
  classes `on` / `pressed` and residual-filter binding; OFF clears pressed; leave to Map
  clears pressed + binding → PATH. Does **not** re-assert Trace KP. Prefer PKP — KP is
  Trace pressed+toast.
  Proof: `verification/passport-keys-residual-pressed.png` (Passport Keys + filter ON).
- ADE Keys Trace/Passport section header (KA1–KA3): when Trace/Passport (and Keys open /
  sync path), `#keysPane` shows `#keysAdeSection` (`.keys-section` / `data-keys-section="ade"` /
  `data-keys-ws="trace|passport"`) labeled **Trace · residual bindings** / **Passport · residual
  bindings** immediately above the R residual row via `syncKeysAdeSection` (called from
  `syncKeysRRow`). Map and other desks hide/clear the section (`hidden`, no `data-keys-ws`).
  Proof: `verification/keys-ade-section.png` (Trace Keys). Prefer KA ids — KS is Trace keyboard
  node-step.
- ADE residual-filter dedicated aria-live (ALR1–ALR3): `#residualFilterLive`
  (`[data-residual-filter-live]` / `role="status"` / `aria-live="polite"` / `.sr-only`) is a
  persistent AT live region updated by `syncResidualFilterLive` from
  `toggleTrajResidualFilter` / `clearTrajResidualFilter` (and ws-leave clear). Copy:
  `Residual filter on, N matching` / `Residual filter off` (N from
  `passportResidualTrajIds().size`). Does **not** replace `#toast` / `flashToast` Residuals
  on/off. Proof: `verification/residual-filter-aria-live.png` (Trace + filter ON). Prefer ALR —
  AL is Trace adj-residual legend.
- ADE residual-filter live count paint refresh (LRP1–LRP3): while `trajResidualFilter` stays ON,
  Trace/Passport paint paths (`paintTrajectoryWorkspace` / `paintPassportWorkspace`) call
  `syncResidualFilterLive(true)` so `#residualFilterLive` `data-filter-residual-count` + text
  stay current when bearings change without a toggle (Approve / focus / fixture). No toast on
  paint refresh. Proof: `verification/residual-filter-live-paint-refresh.png`. Prefer LRP. Empty chrome Clear residual filter `:focus-visible` ring matches CC/PCF (CFV1–CFV3); proof `verification/residual-filter-clear-focus-visible.png`. Prefer CFV. Trace legend / Passport sticky residual-filter toggles get the same ADE chrome `:focus-visible` outline themed to warning residual (TFV1–TFV3); proof `verification/residual-filter-toggle-focus-visible.png`. Prefer TFV. Escape clears residual filter when ON on Trace/Passport after chrome owners (Keys/Export/llm/source/route/lens/present) via `clearTrajResidualFilter` (ESC1–ESC3); proof `verification/residual-filter-escape-clear.png`. Prefer ESC. Residual-filter count chips (`.residual-filter-count` / `.passport-residual-filter-count`) are keyboard-reachable `role="status"` with `tabindex="0"` + warning-themed `:focus-visible` when filter ON (CCF1–CCF3); Enter/Space does not clear (Clear filter / Escape remain). Proof `verification/residual-filter-count-chip-focus.png`. Prefer CCF. When filter ON, Trace/Passport count chips get pressed/ON visual parity with the residual-filter toggle (inset shadow + stronger warning mix) while hosts keep ON cues (FHP1–FHP3). Proof `verification/residual-filter-count-host-parity.png`. Prefer FHP. Trace `#trajEdgeLegend` and Passport `.passport-residual` hosts share one residual-filter ON cue language — warning `outline` 1px / offset 2px (HOP1–HOP3); Passport no longer uses a distinct ON inset. Proof `verification/residual-filter-host-on-cue-parity.png`. Prefer HOP. Clear-filter chips (legend CC / sticky PCF / empty FE) get themed `:active`/`.press` flash — darker hoverBackground mix + inset 1px — beyond global `button:active` scale (CAF1–CAF3). Proof `verification/residual-filter-clear-active-flash.png`. Prefer CAF. Residual-filter count chips toast a non-clearing hint on Enter/Space/click (`flashToast` skip: filter stays ON — use Clear, R, or Escape) without clearing (CCT1–CCT3). Proof `verification/residual-filter-count-chip-toast-hint.png`. Prefer CCT. Clear-filter chips (legend CC / sticky PCF / empty FE) toast **Residual filter cleared** (ok) on activate via `clearTrajResidualFilter("clear-chip")` — distinct from Escape/Keys-R-off **Residuals off** (skip) (CLT1–CLT3). Proof `verification/residual-filter-clear-confirm-toast.png`. Prefer CLT.
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
- `#keysClose` and Escape hide the pane; a second `?` also toggles closed (`K17`); opening Keys closes Ask (`K18`); opening Export closes Ask (`K18b`); opening Ask closes Keys (`K18c`); opening Ask closes Export (`K18d`); opening Export closes Keys (`K18e`); opening Keys closes Export (`K18f`); opening Present closes Ask (`K18g`); opening Present closes Keys (`K18h`); opening Present closes Export (`K18i`); opening Present closes Evidence (`K18j`); opening Present closes Lens (`K18k`); opening Present closes Route (`K18l`); opening Ask closes Evidence (`K18m`); opening Ask closes Lens (`K18n`); opening Ask closes Route (`K18o`); opening Keys closes Evidence (`K18p`); opening Keys closes Lens (`K18q`); opening Keys closes Route (`K18r`); opening Export closes Evidence (`K18s`); opening Export closes Lens (`K18t`); opening Export closes Route (`K18u`); opening Evidence closes Ask (`K18v`); opening Lens closes Ask (`K18w`); opening Route closes Ask (`K18x`); opening Evidence closes Keys (`K18y`); opening Evidence closes Export (`K18z`); opening Lens closes Keys (`K18aa`); opening Lens closes Export (`K18ab`); opening Route closes Keys (`K18ac`); opening Route closes Export (`K18ad`); opening Evidence closes Lens (`K18ae`); opening Evidence closes Route (`K18af`); opening Keys hides the tip (`K19`, Export `K19b`, Ask `K19c`, Evidence `K19d`, Present `K19e`, Lens `K19f`, Route `K19g`, Find `K19h`); opening Keys clears the toast (`K20`, Export `K20b`, Ask `K20c`, Evidence `K20d`, Present `K20e`, Lens `K20f`, Route `K20g`, Find `K20h`)
- Keys is not covered by Ask / export while open; close it before Evidence
  / ledger / Ask / Export suites so it does not stay on top of them
- screenshot `verification/keys.png` is not a black frame
- ADE KH1–KH3: Trace Keys open → `[data-keys-row="r"]` has `data-keys-r-binding="residual-filter"` / `data-keys-residual-hint="1"` and text includes `residual filter` (not sole PATH); Passport same; Map Keys → `path` / `0` / `PATH`. Screenshot `verification/keys-residual-filter.png` is not a black frame. No stamps.
- ADE KP1–KP3: Trace residual ON → Keys R row pressed (`aria-pressed="true"` / `data-keys-r-pressed="1"` / `on`+`pressed`) and `#toast` shows `Residuals on` (`ok`); toggle OFF → pressed cleared + `Residuals off` (`skip`); Map / leave clears pressed; no-op clear does not toast. Screenshot `verification/keys-residual-pressed.png` is not a black frame. No stamps.
- ADE PKP1–PKP3: Passport residual ON → Keys R row pressed (`aria-pressed="true"` / `data-keys-r-pressed="1"` / `on`+`pressed` / residual-filter binding); OFF clears pressed; Map leave clears pressed + binding → PATH. Screenshot `verification/passport-keys-residual-pressed.png` is not a black frame. No stamps. Prefer PKP (KP is Trace).
- ADE ALR1–ALR3: Trace residual ON → `#residualFilterLive[data-residual-filter-live]` (`aria-live="polite"` / `role="status"`) text matches `Residual filter on, N matching` (N = bearing count); OFF / clear → `Residual filter off`; `#toast` Residuals on/off still works separately. Screenshot `verification/residual-filter-aria-live.png` is not a black frame. No stamps. Prefer ALR (AL is adj-residual).
- ADE LRP1–LRP3: residual filter ON → Approve/paint changes bearing N without toggle → `#residualFilterLive` text/`data-filter-residual-count` refresh to new N (no Residuals toast); filter OFF across Trace/Passport paint stays off; ALR toggle path still works. Screenshot `verification/residual-filter-live-paint-refresh.png` is not a black frame. No stamps. Prefer LRP.
- ADE CFV1–CFV3: empty chrome Clear residual filter keyboard `:focus-visible` outline matches CC/PCF; screenshot `verification/residual-filter-clear-focus-visible.png`. Prefer CFV.
- ADE TFV1–TFV3: Trace legend / Passport sticky residual-filter toggle keyboard `:focus-visible` outline themed to warning residual (1px / offset 1px); screenshot `verification/residual-filter-toggle-focus-visible.png`. Prefer TFV.
- ADE ESC1–ESC3: Trace/Passport residual ON + Escape (no Keys/Export/etc. chrome) → `clearTrajResidualFilter` OFF; Keys/Export Escape still closes chrome first and leaves filter ON; OFF Escape is no-op. Screenshot `verification/residual-filter-escape-clear.png` is not a black frame. No stamps. Prefer ESC.
- ADE CCF1–CCF3: Trace legend / Passport sticky residual-filter count chip keyboard-reachable (`tabindex="0"` `role="status"`) with warning-themed `:focus-visible` (1px / offset 1px); Enter/Space does not clear. Screenshot `verification/residual-filter-count-chip-focus.png`. Prefer CCF.
- ADE FHP1–FHP3: Trace legend / Passport sticky residual-filter count chip pressed/ON visual parity with toggle (`background` ~28% warning mix + `inset` box-shadow) when host `data-residual-filter="on"`; hosts keep ON cues. Screenshot `verification/residual-filter-count-host-parity.png`. Prefer FHP.
- ADE HOP1–HOP3: Trace↔Passport residual-filter host ON cue cross-parity — `#trajEdgeLegend[data-residual-filter=on]` and `.passport-residual[data-residual-filter=on]` share warning `outline` 1px / offset 2px (Passport ON inset removed). Screenshot `verification/residual-filter-host-on-cue-parity.png`. Prefer HOP.
- ADE CAF1–CAF3: clear-filter `:active`/`.press` flash parity for legend CC / sticky PCF / empty FE — darker button-hoverBackground mix + inset 1px beyond global scale. Screenshot `verification/residual-filter-clear-active-flash.png`. Prefer CAF.
- ADE CCT1–CCT3: residual-filter count chip Enter/Space/click non-clearing toast hint (filter stays ON — Clear / R / Escape); does not clear. Screenshot `verification/residual-filter-count-chip-toast-hint.png`. Prefer CCT.
- ADE CLT1–CLT3: clear-chip confirm toast — legend/sticky/empty Clear activate → `Residual filter cleared` (ok); Escape/Keys-R-off keep `Residuals off` (skip). Screenshot `verification/residual-filter-clear-confirm-toast.png`. Prefer CLT.
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
- Residual-filter AT live region is `#residualFilterLive` / `[data-residual-filter-live]`
  (`syncResidualFilterLive`); do not overload `#toast` for persistent filter state (ALR1–ALR3).
  Paint refresh while filter ON must update live count without toast spam (LRP1–LRP3).
- Do not invent a second drawing tool or a Mermaid cheatsheet.
- `#keysPane` must stack above the desk (`z-index`) and start `hidden`.
- Agents never stamp. The sheet is a reminder that `S` / `X` are human.
