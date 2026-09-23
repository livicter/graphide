# WHOOP health chrome

Night Review desk chrome that tracks the locked WHOOP rings + Graphide
Night mock: cool near-black `#101518` surfaces, three equal coverage-strip
dials (Coverage / Health / Open), raised soft Map cards, UPPERCASE tracked
dial labels. Chrome only. Map stays community LOD. Stamp / skip stay
human — this pass never writes `.graphide/stamps/`. Day is unchanged.

## Sub-features

- Night page (`html.bright.night`) is cool near-black `#101518`. System
  blue `#0A84FF` stays the accent.
- `#coverage` leads with `.dials` (`order: -1`; last in the DOM so the
  caption text stays first): three equal `.dial[data-dial]` —
  `coverage`, `health`, `open`. Each is a `.ring` (`svg` `0 0 40 40`,
  `circle.track` + `circle.arc` `pathLength="100"`) around a big white
  `b` value, then an UPPERCASE tracked `.label`. Arcs are thick, round cap.
- Coverage = `(changed − uncovered) / changed`, slate `#7ba1bb`. `—` with
  no changed nodes; no arc at `0%`.
- Health = `(flows − broken) / flows`. `data-tone` green `#16ec06` ≥ 67,
  yellow `#ffde00` ≥ 34, else red `#ff0026`. `—` with no flows.
- Open = pending + broken flows still waiting on a human stamp / skip.
  Integer, no `%`. Ring = open / flows, strain blue `#0093e7`.
- Night hides `#coverage .score`; the `.cov-chip` caption stays and
  carries the same counts. Day hides `.dials` and keeps `.score`.
- Map `.bubble-card` is a raised soft neutral surface (near-black fill,
  radius ≥ 14, layered shadow). `.tile` stays tinted.
- Flow tabs, `.kind-pill`, `.leg`, `.feat-chip`, `#storyRail`, and the
  Map `.flow-title` stay dark on Night — no Day `#fff` leak.

## How to get to it (user POV)

1. Review a folder. Open **Map**.
2. Click **Night** (`#themeNight`) or press `D`. The desk goes WHOOP dark;
   community cards lift off the page.
3. The bottom strip shows Coverage / Health / Open rings. Hover a ring for
   its definition. The caption beside them keeps the raw counts.
4. Click **Day** or press `D` again. The rings hide; the score row returns.
5. Stamp and Skip are still the human attestation. The rings do not stamp.

The in-tree proof is the explorer desk (`?mode=explorer`) on Night Map.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Inside the Appearance step, after `#themeNight` lands and the chrome
transitions settle:

```
// #coverage > .dials > .dial[data-dial] × 3 (coverage, health, open)
// .dial .ring circle.arc stroke-dasharray "<p> 100", stroke-linecap round
// #coverage .cov-chip "Coverage <c> changed · <u> uncovered · Review …"
```

Driver assertions (ids `WH0`…`WH10`):

- `WH0` `html` / `body` `.bright.night`; `#themeNight.on`; Map on; page
  is cool near-black (luma < 0.12, blue > red — Apple `#000` fails)
- `WH1` exactly three `.dial`, order coverage / health / open, leftmost
  in `#coverage`; `.dials` shown; widths equal (±1px)
- `WH2` every `circle.arc` round cap, stroke-width ≥ 3.5; stroke is
  `#7ba1bb` / tone green · yellow · red / `#0093e7` (±6)
- `WH3` `.dial b` near white, ≥ 18px, weight ≥ 600
- `WH4` `.dial .label` Coverage / Health / Open, `uppercase`,
  letter-spacing ≥ 1px
- `WH5` values match the `.cov-chip` caption: coverage math (explorer
  `0%`, no arc); open = broken + pending; health inside the caption flow
  bounds; arc dasharray = value; tone band; `.score` hidden
- `WH6` `.bubble-card` radius ≥ 14, ≥ 2 shadow layers with a ≥ 16px blur,
  neutral dark fill, `.tile` visible, cards ≥ 8; tabs / pills / rail /
  flow title background luma < 0.5
- `WH7` Map stays `xy=0` with `#canvas .viewport[data-lod="0"]`
- screenshot `verification/whoop-health-night.png` is not a black frame
- `WH8` no `{ type: "stamp" }` / `{ type: "skip" }` post; `WH9`
  `.graphide/stamps/` is still empty
- `WH10` after `D` restores Day: `.dials` is `display: none`, `.score`
  is visible

## Gotchas

- Do not add a second chrome row or a new workspace. Dials live in
  `#coverage`, not on the canvas.
- Do not restyle `#coverage .score-chip` back into chips — V53 owns
  caption text. Night hides `.score`; the dials replace it.
- Health / Open are review-flow counts from `reviewMarks()`, not an
  invented code-health score. Caption `skipped` also counts skips outside
  `snapshot.flows` (explorer `legacy`), so flows ≠ stamped + skipped +
  broken + pending.
- Night chrome transitions. Wait ~400ms after `#themeNight` before
  measuring or shooting; `night.png` is mid-transition.
- Do not raise Map into XYFlow. Community cards stay. No Mermaid.
- Do not add `data-testid`. `#coverage .dials .dial[data-dial]`,
  `.dial .ring circle.arc`, `.dial .label`, `.bubble-card`, `#themeNight`
  are the hooks.
- Day Fitbit soft-card pass is a follow-up. This map owns Night only; Day
  stays [apple-chrome.md](apple-chrome.md).
- Agents never stamp. WHOOP chrome posts nothing.
