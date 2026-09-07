# Path walk

Community start → features → end Play on Map. `P` (or Overview
`#pathWalkBtn`) walks the story-rail hops. `[` `]` step. Not Route PATH
(`#pathBtn` / `#routePlay` / `#probeDock`) and not an agent stamp.

## Sub-features

- Story rail `#storyRail` on Map (Start → features → end). Overview
  `.feature-path` hosts `#pathWalkBtn` / `#pathWalkPrev` / `#pathWalkNext`.
  Same `pathWalkStops()` as the rail. One walk, not a second chrome row.
- `P` toggles Play / Pause on Map / Overview / Slice. `[` `]` step and
  stop autoplay. Delta / Sequence / Data-flow / Lifecycle keep their own
  Play — do not steal those.
- Paint `.walk` / `.here` on `.feat-chip`, `.walk` on `.bubble-card` /
  `.vnode`. Mid-path is a community that is neither START nor END.
- Pause / stop leaves Map at community LOD (`xy=0`). Do not Enter a
  bubble. Do not dump full IR as React.
- Stamp / skip stay human. Walking never posts `{ type: "stamp" }` /
  `{ type: "skip" }` and never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open **Map**.
2. Press `P` (or Overview **Play**). The walk lights START, then each
   feature community, then END.
3. Press `]` / `[` to step. Pause leaves the cards in place.
4. Stamp and Skip are still the human attestation. Play does not stamp.

The in-tree proof is the explorer desk (`?mode=explorer`). The fixture
`control-flow` walk already crosses several Map communities.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map paints community cards (Ask / Keys closed so they do not bury
the rail):

```
document.activeElement.blur();
document.dispatchEvent(new KeyboardEvent("keydown", { key: "P", bubbles: true }));
// or document.getElementById("pathWalkBtn").click() on Overview
document.dispatchEvent(new KeyboardEvent("keydown", { key: "]", bubbles: true }));
document.dispatchEvent(new KeyboardEvent("keydown", { key: "[", bubbles: true }));
```

Driver assertions:

- `#storyRail` / `.feat-chip` has START → mid → END (`chips >= 3`)
- `P` (or `#pathWalkBtn`) paints `.feat-chip.walk` / `.here` and a
  `.bubble-card.walk`
- `]` / `[` move the painted community without a stamp / skip post
- mid-path screenshot `verification/path-walk.png` is not a black frame
- pause / stop leaves Map `xy=0` (no `.react-flow__node` on Map)
- `#pathBtn` / `#routePlay` stay off — this is not Route
- `.graphide/stamps/` is still empty

## Gotchas

- Route is `R` / `#pathBtn` / `#routePlay`. Do not drive that probe here.
- `#pathWalkBtn` lives on Overview `.feature-path`. Map’s hook is `P`
  plus the story-rail chips. Do not invent a second Play row.
- `P` is swallowed while Find / Ask (`input`, `textarea`) is focused.
  Blur first. Keys is chrome, not a typing field.
- Do not add `data-component` / `data-testid`. `#pathWalkBtn`,
  `#pathWalkPrev`, `#pathWalkNext`, `.feat-chip`, `.bubble-card.walk`
  are the hooks.
- Do not stamp. Agents never stamp. Do not add Mermaid or a second
  drawing tool.
