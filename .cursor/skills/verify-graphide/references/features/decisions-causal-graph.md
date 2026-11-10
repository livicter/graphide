# Decisions causal graph

Interactive SVG of the derived Steiner hops (and StampBroken scars) for the
selected Decisions record. A reviewer can read the causal shape of a stamp
or skip on the Review IDE canvas — graphs-only, no XYFlow, no peekSource.
The linear `.chain` list, DAM bars, outcome strip, and Open slice stay.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `decisionCausalLayout` → `decisionCausalGraphHtml` →
  `bindDecisionCausalGraph` → `applyDecisionCausalGraphPaint`. Focus is
  `decisionChainFocus` (node or edge). Escape clears to idle after the DAM
  filter owner on Decisions.
- Strip `.dcg-strip[data-dcg="1"]` with `.dcg-svg` in the Decisions detail
  pane, above the existing `.chain` list. Click a node or edge to focus;
  second click or Escape clears. Must not call `showHop` / `peekSource` or
  open the source pane. `#canvas .react-flow__node` stays `0`.
- CSS in `extension/media/main.css`: `.dcg-strip` / `.dcg-svg` plus
  `.dcg-now` / `.dcg-dim` under `.dcg-strip.dcg-focusing`. Added / removed
  scars take `.dcg-scar-added` / `.dcg-scar-removed`.
- Stamp / skip attestation unchanged. Decisions never writes
  `.graphide/stamps/` from this graphic.

## How to get to it (user POV)

1. Review a folder. Land on Overview.
2. Open **Decisions** (`#workspaces [data-ws="decisions"]`).
3. Select a stamp or skip. The detail pane draws the derived causal hops as
   a graph. Click a node or edge to focus it. Escape clears the focus
   without leaving Decisions (after any DAM filter).
4. Open slice and the linear chain list remain. The graph does not invent
   hops that are not on the derived tree or StampBroken scars.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="decisions"]` (same document as DAM —
do not add a mid-suite `page.goto`).

Driver assertions (DCG1–DCG5):

- `.dcg-strip[data-dcg="1"] .dcg-svg` present with nodes and edges
- click focuses `.dcg-now`; Decisions stays; no source pane; no XYFlow
- Escape clears focus; Decisions stays open
- screenshot `verification/decisions-causal-graph.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- This is an inline SVG in a list workspace, not an XYFlow canvas. DC3
  still requires `#canvas .react-flow__node` length `0`.
- Do not remove DAM, the outcome strip, Open slice, or `.chain-step` list.
  Existing list clicks may still call `showHop`; the new graph must not.
- Rebuild `extension/media/main.js` with `npm run build:webview` using
  in-tree `node_modules` (no worktree symlink).
- Reseal the immutable lock *after* any edit to this feature map.
