# All programs

GraphBar `#legend [data-prog="-1"]` switches the Map / Review cut from
one program to the union. `desk.js` `renderLegend` paints **All
programs** when `programs.length > 1`. Click sets
`graphFilter.program = null` and `renderProgramOverview()` — `#meta`
names `all`. Not a Map XYFlow rewrite, not a second altitude, and not
an agent stamp.

## Sub-features

- GraphBar `#legend [data-prog="-1"]` (class `.leg`). Painted only
  when more than one program exists. `.on` when
  `graphFilter.program` is `null` (the default cut is already union).
- Click (`desk.js` `renderLegend`): `graphFilter.program` becomes
  `null`. `renderProgramOverview()` rewrites `#meta` to `all` (not a
  crate name) and `pickCommunityNodes` stops filtering by
  `programKeyOf`. Map community cards stay the derived clustering
  (`mapAltitudeBubbles` is not re-cut per program).
- Map stays community LOD (`xy=0`). Cards stay `.bubble-card`. The
  chip does not Enter a bubble and does not mount `#enterCanvas`.
- Stamp / skip stay human. All programs never posts `{ type: "stamp" }`
  / `{ type: "skip" }` and never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder with more than one program. Open **Map**.
2. Press a concrete program chip (`bin graphide-cli`, a lib, …). The
   caption names that program.
3. Press **All programs**. The caption says `all`. Community cards
   stay. Press a single program again and the narrow caption returns.
4. Explorer `bin main` is one program — All programs is not painted.
   Self-review of this checkout has several crate chips plus All
   programs.
5. Stamp and Skip are still the human attestation. The chip does not
   stamp.

The in-tree union proof is the self-review desk (`?live=1`). Explorer
proves the honest skip when `#legend [data-prog="-1"]` is absent.
Single-program switch is [program-chips.md](program-chips.md).

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
extension/scripts/webview-harness.html?live=1&probe=0&require=1
```

Explorer (`#legend [data-prog]`, usually one `bin main`):

```
const all = document.querySelector('#legend [data-prog="-1"]');
// all == null → honest skip of union
```

Self-review Map (`require=1` snap; Graphide crates + All programs):

```
const prefer = [...document.querySelectorAll("#legend [data-prog]")]
  .filter((el) => Number(el.getAttribute("data-prog")) >= 0)
  .find((el) => /bin\s+graphide-cli/i.test(el.textContent || ""))
  || document.querySelector("#legend [data-prog]");
prefer.click();
// #meta names that program; data-prog >= 0 is .on
document.querySelector('#legend [data-prog="-1"]').click();
// #legend [data-prog="-1"].on and #meta token all; xy still 0
```

Driver assertions:

- explorer: All programs absent on a single chip (`bin main`); skip
  union unless `[data-prog="-1"]` exists
- self-review: `[data-prog="-1"]` All programs plus ≥ 2 crate chips
- start on a concrete `data-prog >= 0` chip; All programs click
  moves `.on` to `-1` and `#meta` includes the `all` token
- optional: click the same single program again; `#meta` names it
  and the key is no longer `-1`
- Map stays `xy=0` with more than one `.bubble-card`
- screenshot `verification/all-programs.png` after the union is not
  a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty

## Gotchas

- Hook is `#legend [data-prog="-1"]`. Do not invent `#allPrograms`
  or `data-testid`. `data-prog >= 0` chips stay
  [program-chips.md](program-chips.md).
- Legend clicks filter locally. They do not post `{ type:
  "selectProgram", all: true }` — that is `openAllPrograms` / the
  host stack.
- `#meta` uses the token `all` next to `·`. Do not match the
  substring inside `communities`.
- Map cards are the snapshot clustering, not a per-program re-cut.
  The union proof is caption + program key, not a required card-count
  bump.
- Explorer `flowPayload()` seeds one program. Union lives on
  `?live=1`. Do not paper a missing All programs chip by weakening
  the live drive.
- Do not React-mount Map community LOD. Cards stay vanilla. `xy=0`.
- Agents never stamp. All programs is a cut, not an approval.
  Do not flip verify `runs-on` off `ubuntu-latest`.
