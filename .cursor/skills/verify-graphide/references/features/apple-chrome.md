# Apple chrome

Day Review desk chrome that tracks the locked Sequoia grouped mock:
`#F2F2F7` canvas, SF Pro stack, capsule secondary actions, system-blue
`#reviewBtn`, pill workspace rack, softer Map cards, frosted coverage
strip. Chrome only. Map stays community LOD. Stamp / skip stay human —
this pass never writes `.graphide/stamps/`.

## Sub-features

- Header secondary actions (`#stampBtn` / `#skipBtn` / `#llmBtn` /
  `#exportBtn`, plus Keys / Style / Present) are white capsules. `#reviewBtn`
  stays system blue `#007AFF`. `#themeSeg` Day / Night is unchanged.
- `#workspaces` is a rounded pill rack. The selected tab (`.on`) is
  blue-tinted, not a white iOS segment. Existing `[data-ws]` labels stay.
- Map `.bubble-card` is a soft white card (radius ~16, light shadow) with
  a tinted `.tile`, `.name` / `.meta`, and a count `.n`. No new altitude
  and no React IR dump.
- `#coverage` / `#status` share one frosted grouped strip. Score chips
  stay caption text (V53).
- Typography stays `-apple-system` / SF Pro under `html.bright`.
- Map stays community LOD (`xy=0`). No fake traffic lights. No new
  workspace. Agents never stamp.

## How to get to it (user POV)

1. Review a folder. Open **Map**. Day is the default harness look.
2. Header shows capsule Stamp / Skip / LLM / Export beside blue Review.
   Workspace tabs sit in a pill rack; **Map** is the tinted selected chip.
3. Community cards are soft white bubbles with a tinted tile and a count.
   Coverage sits on a frosted strip at the bottom of the desk.
4. Stamp and Skip are still the human attestation. This chrome does not
   stamp.

The in-tree proof is the explorer desk (`?mode=explorer`) on Day Map.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map paints community cards (Day on; `#themeDay.on`):

```
// html.bright, not .night
// #reviewBtn computed background is system blue
// #stampBtn / #skipBtn / #llmBtn / #exportBtn capsule radius
// #workspaces radius; [data-ws=map].on is blue-tinted
// .bubble-card radius + .tile; #coverage frost
```

Driver assertions (ids `AC0`…):

- `html.bright` / `body.bright`; `.night` is off; `#themeDay.on`
- `#themeSeg` is present
- `#reviewBtn` background is `#007AFF` (or rgb 0,122,255)
- `#stampBtn` / `#skipBtn` / `#llmBtn` / `#exportBtn` are capsules
- `#workspaces` is a rounded rack; `[data-ws="map"].on` is blue-tinted
- `.bubble-card` radius ≥ 12; `.tile` is visible; cards ≥ 8
- `#coverage` is frosted (`backdrop-filter` or white/grouped fill)
- Map stays `xy=0`
- screenshot `verification/apple-chrome.png` is not a black frame
- `.graphide/stamps/` is still empty; no `{ type: "stamp" }` post

## Gotchas

- Do not add fake macOS traffic lights inside the VS Code webview.
- Do not raise Map into XYFlow. Community cards stay. No Mermaid.
- Do not invent a workspace or a second chrome row.
- Do not restyle `#coverage .score-chip` back into chips — V53 owns
  caption text.
- Do not add `data-testid`. `#themeSeg`, `#reviewBtn`, `#workspaces`,
  `.bubble-card`, `#coverage` are the hooks.
- Agents never stamp. Apple chrome posts nothing.
