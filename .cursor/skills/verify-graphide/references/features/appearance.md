# Appearance

Reader-controlled Day / Night on the Review desk. Header `#themeSeg`
pins it. `D` flips it. Night is `html.bright.night` / `body.bright.night`
(Apple dark grouped, system blue `#0A84FF`). Day drops `.night` and keeps
`.bright`. Not a visual preset and not a second Map altitude. Stamp /
skip stay human — appearance never writes `.graphide/stamps/`.

## Sub-features

- Header `#themeSeg` (`#themeDay` / `#themeNight`, `data-theme`). The
  pressed side gets `.on`. `D` calls `toggleTheme`. `graphide.appearance`
  (`auto` / `day` / `night`) is the host setting; Auto follows the Cursor
  / VS Code color theme.
- Night **adds** `.night` on `html` and `body`. It does **not** remove
  `.bright`. Tokens live under `html.bright.night` in `main.css`.
- Day restores the grouped light surface: `.night` off, `#themeDay.on`.
- Style (`#presetBtn` / `data-preset`) stays independent. Night does not
  change Classic / Signal / Blueprint. Presentation P3 already asserts
  that; this map owns the chrome being Night.
- Map stays community LOD (`xy=0`). Appearance is chrome, not a React IR
  dump and not a second drawing tool.
- Stamp / skip stay human. Switching Day / Night never posts
  `{ type: "stamp" }` and never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview or open Map (Day is the default
   harness look).
2. Click **Night** (`#themeNight`) or press `D`. The desk goes Apple
   dark. Community cards stay.
3. Click **Day** (`#themeDay`) or press `D` again. Light grouped chrome
   returns.
4. Stamp and Skip are still the human attestation. Appearance does not
   stamp.

The in-tree proof is the explorer desk (`?mode=explorer`). UIUX samples:
`UIUX_sample/map-communities-night.png`, `keys-sheet-night.png`.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map paints community cards (Day on; blur so `D` is not swallowed
by Find / prompt):

```
document.activeElement.blur();
document.getElementById("themeNight").click();   // or press D
// html.night + body.night + #themeNight.on — bright stays
document.getElementById("themeDay").click();     // or press D
```

Driver assertions:

- From Day, `#themeNight` (or `D`) adds `.night` on `html` / `body`
- `#themeNight` has `.on`; `#themeDay` does not
- `.bright` stays (do not assert it is removed)
- Map cards stay visible; altitude is still `xy=0`
- screenshot `verification/night.png` is not a black frame and is
  darker than day `map.png`
- Day restore (`#themeDay` or `D`) drops `.night` and puts `.on` back
  on `#themeDay` so later suites stay day-safe
- Day / Night still does not change `data-preset` (P3)
- `.graphide/stamps/` is still empty; no `{ type: "stamp" }` post

## Gotchas

- `D` is swallowed while Find / Ask / prompt (`input`, `textarea`) is
  focused. Blur first. That is the product rule, not a stolen binding.
- Do not invent a `data-theme` on `html`. The product marker is the
  `.night` class next to `.bright`.
- Do not add `data-component` / `data-testid`. `#themeSeg`, `#themeDay`,
  `#themeNight`, `.on` are the hooks.
- Do not treat Night as a fourth Style. Preset is `#presetBtn`.
- Do not raise Map into XYFlow. Community cards stay. No Mermaid.
- Agents never stamp. Appearance posts `{ type: "setAppearance" }` only.
