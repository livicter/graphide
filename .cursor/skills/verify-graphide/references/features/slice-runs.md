# Slice runs

A named flow’s coarse `flowchart.runs` is a first-class Slice path: subsystem
boxes on the same stage as the Steiner, then Enter mounts shaped XYFlow.
Engine `flowchart.runs` and desk `renderRuns` / `enterRun` already exist.
This map proves them on the running Review surface. Not a new workspace,
not Map enter-bubble, and not an agent stamp.

## Sub-features

- Engine: a flow’s `flowchart.runs` (≥ 2), `spine`, and `positions`. Explorer
  `flowPayload()` already ships `boot` / `control-flow` with two runs
  (`b-render`, `b-origin`). `first_slice.rs` asserts the same on
  `fixtures/demo`. `renderRuns` paints nothing when `runs.length < 2`.
- Desk: `desk.js` `renderRuns` writes `.run[data-run]` with `data-flow`,
  `data-bubble`, `data-nodes` under `.chart` (sibling of `#sliceCanvas`,
  not inside it). Title: **Subsystem runs — click to enter**. Overview
  default-run CFG can show the same boxes; this gate drives **Slice**.
- Click / drag-click: `bindDraggable(..., ".run")` → `enterRun(flow, bubble)`.
  Posts `{ type: "enterRun", flow, bubble }`. Stack `{ kind: "bubble" }`
  then `enterBubble` + `renderInner` mounts `#enterCanvas` shaped XYFlow
  (`.vnode[data-shape]`, cap 24), not a vanilla `.inode` list.
- Stamp / skip stay human. Entering a run never posts `{ type: "stamp" }`
  / `{ type: "skip" }` and never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder (or open the explorer fixture). The desk lands on
   Overview. Open **Slice**, or press a `#tabs` chip that has subsystem
   runs (`control-flow` / `boot` on the explorer snap).
2. Below the Steiner, **Subsystem runs** boxes appear. Click a run.
3. You are inside that community: shaped nodes on `#enterCanvas`. Back
   returns to Slice. Map stays community cards (`xy=0`).

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map / flow-tab chrome (same explorer desk as Slice grey):

```
document.querySelector('#workspaces [data-ws="slice"]').click();
const tab = document.querySelector('#tabs .tab[data-flow="control-flow"]')
  || document.querySelector('#tabs .tab[data-flow="boot"]');
tab.click();
// .run[data-run] >= 2
document.querySelector(".run[data-run]").click();
// #enterCanvas .react-flow__node / .vnode[data-shape]
```

Driver assertions (ids `SR0`…):

- `#workspaces [data-ws="slice"]` is on and a flow with runs is selected
- `#canvas .run[data-run]` length `>= 2` with `data-flow` / `data-bubble`
- click a `.run` posts `{ type: "enterRun" }` and mounts
  `#enterCanvas .react-flow__node` (`> 1`, `≤ 24`) with `data-shape`
  (no `.inode`)
- screenshot `verification/slice-runs.png` is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty
- return to Map keeps `xy=0` with more than one `.bubble-card`

## Gotchas

- `#sliceCanvas` is the Steiner. Run boxes live in `.chart .run`, not
  `#sliceCanvas .run`. Do not treat Map `.bubble-card` → `#enterCanvas`
  as this gate — that is enter-bubble.
- `renderRuns` is silent when `flowchart.runs.length < 2`. Do not weaken
  the fixture to one run and call the gate green.
- Host `enterRun` only aligns stacks. The desk paints `enterBubble` from
  the in-memory snap. The stub records `__vscodePosts`.
- Do not add `data-testid`. `.run`, `[data-run]`, `[data-flow]`,
  `[data-bubble]`, `#enterCanvas .vnode[data-shape]` are the product hooks.
- Do not invent a Slice-runs workspace or recycle OPTIMIZE here.
  Agents never stamp. Do not flip verify `runs-on` off `ubuntu-latest`.
