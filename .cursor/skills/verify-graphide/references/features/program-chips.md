# Program chips

GraphBar `#legend [data-prog]` switches the Map / Review cut to another
program. `desk.js` `renderLegend` paints `{kind} {name}` buttons.
Click sets `graphFilter.program` and `renderProgramOverview()` — caption
`#meta` names that program. Not a Map XYFlow rewrite, not `.prog-chip`
canvas leftovers, and not an agent stamp.

## Sub-features

- GraphBar `#legend [data-prog]` (class `.leg`). Text is `bin main` on
  the explorer seed, Graphide crates (`bin graphide-cli`, libs) on
  self-review. `programs.length > 1` also paints `data-prog="-1"` All
  programs.
- Click (`desk.js` `renderLegend`): `graphFilter.program` becomes that
  program (or `null` for All). `renderProgramOverview()` rewrites
  `#meta` (`all` or the program `name`) and repaints Map communities.
- Map stays community LOD (`xy=0`). Cards stay `.bubble-card`. Chips
  do not Enter a bubble and do not mount `#enterCanvas`.
- Stamp / skip stay human. Program chips never post `{ type: "stamp" }`
  / `{ type: "skip" }` and never write `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open **Map** (or stay on Overview — chips sit in
   the graph bar).
2. Press a program chip other than the one that is on. The caption
   names that program. Community cards stay.
3. Explorer `bin main` is a single chip — there is no second program
   to switch to. Self-review of this checkout has several crate chips.
4. Stamp and Skip are still the human attestation. Chips do not stamp.

The in-tree switch proof is the self-review desk (`?live=1`). Explorer
proves the single-chip honest path and skips multi unless a second
`data-prog >= 0` chip exists.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
extension/scripts/webview-harness.html?live=1&probe=0&require=1
```

Explorer (`#legend [data-prog]`, usually one `bin main`):

```
const programs = [...document.querySelectorAll("#legend [data-prog]")]
  .filter((el) => Number(el.getAttribute("data-prog")) >= 0);
// programs.length === 1 → honest skip of multi
```

Self-review Map (`require=1` snap; Graphide crates):

```
const programs = [...document.querySelectorAll("#legend [data-prog]")]
  .filter((el) => Number(el.getAttribute("data-prog")) >= 0);
programs[0].click();
programs[1].click();
// #legend [data-prog].on and #meta name the second chip; xy still 0
```

Driver assertions:

- explorer: ≥ 1 program chip; skip multi when `data-prog >= 0` count
  is 1 (`bin main`)
- self-review: ≥ 2 Graphide crate chips
- second chip click moves `.on`, changes the program key
  (`data-prog`), and `#meta` includes the new program name
- Map stays `xy=0` with more than one `.bubble-card`
- screenshot `verification/program-chips.png` after the switch is not
  a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty

## Gotchas

- Hooks are `#legend [data-prog]` / `.leg`. `.prog-chip` is unused
  canvas CSS (`openFocusedProgram` queries it). Do not invent
  `#programs .chip` or `data-testid`.
- Legend clicks filter locally. They do not post `{ type:
  "selectProgram" }` — that is `openProgram` / the host stack.
- Explorer `flowPayload()` seeds one program. Multi-switch lives on
  `?live=1`. Do not paper a missing second chip by weakening the live
  drive.
- Do not React-mount Map community LOD. Cards stay vanilla. `xy=0`.
- Agents never stamp. Program chips are a cut, not an approval.
  Do not flip verify `runs-on` off `ubuntu-latest`.
