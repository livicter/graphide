# Flow tabs

`#tabs .tab[data-flow]` switches the current Steiner story cut.
`desk.js` `selectFlow` posts to the host, sets `flowName`, and paints
Slice for that flow. Not a named `flows.toml` chip (that is
[flow-hints.md](flow-hints.md)), not Open slice, and not an agent stamp.

## Sub-features

- GraphBar `#tabs` chips from `renderTabs` (`desk.js`). Explorer
  fixture names `overview`, `control-flow`, and `boot`.
- Click calls `selectFlow(name)`: `{ type: "selectFlow", flow }` to
  the host, `flowName` updates, Slice pins when the named flow has
  tree nodes or edges. `#tabs .tab.on[data-flow]` moves. Slice
  `#meta` names that flow (`N on tree`).
- Visible cut: story-rail hops, start/end bubble ids, flow title
  (`#meta` / tab text), or Slice lit set. Explorer `control-flow`
  and `boot` share a tree — title / tab / crumb are the durable
  signals there.
- Stamp / skip stay human. Switching a tab never posts
  `{ type: "stamp" }` / `{ type: "skip" }` and never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder (or open the explorer fixture). The desk lands
   on Overview. Open **Map** — caption says click a bubble, then a
   flow tab.
2. Press a `#tabs` chip other than the one that is on. The chip
   lights. Slice shows that flow's Steiner cut.
3. Explorer already has two rich flows (`control-flow`, `boot`).
   Honest skip only if a second `data-flow` tab cannot exist on
   explorer **and** self-review.
4. Stamp and Skip are still the human attestation. A tab is a cut,
   not an approval.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map chrome (zoom / program-chip honest path):

```
const tabs = [...document.querySelectorAll("#tabs .tab[data-flow]")];
const first = tabs.find((el) => el.getAttribute("data-flow") === "control-flow")
  || tabs.find((el) => !el.classList.contains("on"));
first.click();
// #tabs .tab.on[data-flow] === control-flow; #meta names it
const second = tabs.find((el) => el.getAttribute("data-flow") === "boot");
second.click();
// .on moved; selectFlow posted; #meta / title names boot
```

Driver assertions:

- explorer `#tabs .tab[data-flow]` count is ≥ 2 (`FT0`)
- first click lands `.on` on that flow; Slice `#meta` names it
- second click moves `.on`; `window.__vscodePosts` has
  `{ type: "selectFlow", flow }` for the new name
- visible cut changed: `#meta` flow title (and hops / start·end /
  lit when those differ)
- screenshot `verification/flow-tabs.png` after the switch is not
  a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty
- return to Map keeps `xy=0` with more than one `.bubble-card`

## Gotchas

- Map `renderProgramOverview` calls `renderTabs(..., null)` — no
  chip is `.on` until a tab click. Overview / Slice pass
  `currentFlow().name`.
- `selectFlow` pins Slice. That is the product, not a second
  canvas. Return to Map after the drive so later Map shots stay
  community LOD.
- `storyFlow()` prefers `control-flow` for the Map rail. Slice
  `#meta` follows `currentFlow()`. Do not assert Map start/end
  moved unless the selected flow is also the default run.
- `overview` is a one-node stub. Slice paint may fall back to
  the story flow when `tree.nodes < 2`. Drive `control-flow` ↔
  `boot`, not overview.
- Flow hints proves a named `data-subscription` chip exists. This
  gate proves switching tabs changes the current cut.
- Do not add `data-testid`. `#tabs .tab[data-flow]`, `#meta`,
  `#storyRail .feat-chip` are the product hooks.
- Agents never stamp. Do not click `#stampBtn` to “cover” the
  flow. Do not flip verify `runs-on` off `ubuntu-latest`.
