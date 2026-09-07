# Kind filters

Find-rail `#kindFilters` pills keep Function / Type / Endpoint on the
current Review cut. `desk.js` writes `graphFilter.kinds` and
`refreshExplorer()` — canvas nodes dim, the object rail drops the
unchecked kind. Not a second finder, not Lens, and not an agent stamp.

## Sub-features

- GraphBar `#kindFilters` (class `.kind-pill`). Three checkboxes:
  `input[data-kind="Function"]` (blue), `Type` (orange), `Endpoint`
  (green). Default is all on. Unchecked pills take `.off`.
- Change (`desk.js`): `graphFilter.kinds[kind] = checked`, then
  `syncKindPills()` and `refreshExplorer()`. Search (`#graphSearch` /
  `graphFilter.q`) stays a separate query.
- Derived XYFlow (`#enterCanvas` / `#sliceCanvas` / `#lineageCanvas`
  `.vnode[data-kind]`) and community members (`.comm-node`) dim when
  the kind is off (`applyGraphFilter` / `graphNodePaint`). Hidden =
  `.dim` or absent after a remount.
- Object rail `#ledgerGrid .cell` is the same cut:
  `renderLedger` keeps only `graphFilter.kinds[kind] !== false`.
  Cells stay `.kind-Function` / `.kind-Type` / `.kind-Endpoint`.
- Map altitude stays community LOD (`xy=0`) when the drive is on Map.
  Kind pills do not Enter a bubble and do not mount XYFlow.
- Stamp / skip stay human. Kind filters never post `{ type: "stamp" }`
  / `{ type: "skip" }` and never write `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open **Map** or **Slice** (pills sit next to Find).
2. All three checked: Function, Type, and Endpoint share the rail
   (or the honest cut is Function-only).
3. Uncheck **Type** (and **Endpoint** if it is on). Only Function
   stays undimmed on the canvas and in `#ledgerGrid`.
4. Uncheck **Function**, leave **Type**. Only Type remains.
5. Check all three again. Stamp and Skip stay the human attestation.

The in-tree proof is the explorer desk (`?mode=explorer`) Slice /
object rail. The boot tree already mixes Function, Type (`n0`), and
Endpoint (`n2`). Search (`#graphSearch`) is [search.md](search.md).

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

On Slice (or Map with the object rail painted):

```
const box = (kind) => document.querySelector('#kindFilters input[data-kind="' + kind + '"]');
// all three checked → Function + Type + Endpoint on .vnode:not(.dim) / .cell
box("Type").checked = false;
box("Endpoint").checked = false;
box("Type").dispatchEvent(new Event("change", { bubbles: true }));
// visible kinds ⊆ {Function}
box("Function").checked = false;
box("Type").checked = true;
box("Type").dispatchEvent(new Event("change", { bubbles: true }));
// visible kinds ⊆ {Type}
// restore all three
```

Driver assertions:

- `#kindFilters input[data-kind]` Function / Type / Endpoint exist and
  start checked (KF0)
- all three on: rail shows FN/TY/EP mixed, or an honest Function-only
  baseline (KF1)
- Type + Endpoint off: visible `#sliceCanvas .vnode:not(.dim)` and
  `#ledgerGrid .cell` kinds are Function only (KF2)
- Function off, Type on: visible kinds are Type only (KF3)
- restore all three; pills lose `.off` (KF4)
- Map after Back / Map chip is still `xy=0` (KF5)
- screenshot `verification/kind-filters.png` (Function-only, Type /
  Endpoint pills `.off`) is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step (KF6)
- `.graphide/stamps/` is still empty (KF7)

## Gotchas

- Hooks are `#kindFilters input[data-kind]`, `.kind-pill`,
  `graphFilter.kinds`, `.vnode[data-kind]`, `#ledgerGrid .cell.kind-*`.
  Do not invent `data-testid`.
- Kind pills hide Function / Type / Endpoint. Find (`#graphSearch`)
  is the query. Lens (`#lensBtn`) is a compare, not this toggle.
- Map community cards have no kind. Prove the pills on Slice /
  enter / the object rail, then return to Map (`xy=0`).
- Unchecked kinds dim on XYFlow; the object rail drops the cell.
  Assert `:not(.dim)` and remaining `.cell` kinds — do not require
  the node to leave the DOM.
- Do not React-mount Map community LOD. Cards stay vanilla. `xy=0`.
- Agents never stamp. Kind filters are a cut, not an approval.
  Do not flip verify `runs-on` off `ubuntu-latest`.
