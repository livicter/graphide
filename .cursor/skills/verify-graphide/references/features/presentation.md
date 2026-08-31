# Presentation

Reader-controlled Presentation Stage and visual presets over the current
Review workspace. F enters a near-fullscreen canvas. Escape exits. Style
cycles Classic / Signal Flow / Blueprint over the **same derived topology**.
Day / Night stays independent. Not Archify's Node renderer. Stamp / skip
stay human — present and preset never write `.graphide/stamps/`.

## Sub-features

- Header `#presentBtn`. `F` toggles the stage. Escape exits after panes
  close. `?present=1` opens on the stage. Supporting chrome (prompt, stamp /
  skip, Ask, graph bar, meta, coverage, footer, ledger, Evidence) hides.
  Theme, Style, Export, keys, and zoom stay. The current workspace canvas
  fills the remaining viewport.
- Header `#presetBtn` cycles Classic → Signal Flow → Blueprint. Default is
  Classic (the current Apple desk). `data-preset` on `html` / `body`. Archify
  binds Style to `S`; Graphide keeps `S` as stamp on the desk. On the stage,
  `S` cycles Style because stamp chrome is hidden.
- Signal Flow saturates Function / Type / Endpoint colors. Blueprint uses
  hairline frames and a 32px drafting grid on the stage. Neither moves a
  node nor invents an edge.
- Motion is finite and optional. Static meaning is complete with motion
  off. `prefers-reduced-motion` is respected (existing desk rule).
- Export keeps the current theme **and** preset. Presentation chrome is
  viewer state and does not enter the canonical clone.
- Stamp / skip stay human. Present / preset never write `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview or open Map / Sequence / Data-flow /
   Lifecycle / Delta.
2. Click **Classic** (`#presetBtn`) to cycle Style. Day / Night still
   switches appearance without changing the preset.
3. Click **Present** (`#presentBtn`) or press `F`. The canvas fills the
   viewport. Escape or **Exit** restores the desk.
4. Stamp and Skip are still the human attestation. They are hidden on the
   stage — exit first.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map paints community cards:

```
const before = document.querySelectorAll(".bubble-card").length;
document.getElementById("presetBtn").click();   // data-preset changes
document.getElementById("presentBtn").click();  // or press F
// canvas fills viewport; Escape restores
```

`?present=1` and `?preset=blueprint` pin the stage / Style on first paint.

Driver assertions:

- `#presetBtn` cycles `data-preset` Classic / Signal Flow / Blueprint
- node / card count and identity selectors are unchanged
- Day / Night does not change `data-preset`
- `#presentBtn` / `F` adds `body.present`; canvas is near-fullscreen
- Escape removes `body.present` and restores graph-bar chrome
- screenshots `verification/present.png` and
  `verification/preset-blueprint.png` are not black frames
- `.graphide/stamps/` is still empty

## Gotchas

- `S` on the desk is still stamp. Do not steal it for Style except while
  `body.present` is on.
- `E` stays Ego. `D` stays Day / Night. Preset is independent of theme.
- Do not add `data-component` / `data-testid`. `#presentBtn`, `#presetBtn`,
  `data-preset`, `body.present` are the product hooks.
- Do not vendor Archify's Node renderer. Presets remap Graphide kind
  tokens (`--g-fn` / `--g-ty` / `--g-ep`) and stage chrome.
- Do not restyle the grouped glass header. Preset radius / grid apply to
  the canvas, not Day / Night or workspace tabs.
- Export already strips focus / play / search. Presentation class is
  viewer chrome — the clone is `#canvas` / a workspace stage.
- No WebM. No brand-mark marketplace. No editorial fourth preset.
