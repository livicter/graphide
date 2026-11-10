# Decisions hop-scar graphic

A stacked composition of this review’s decision hop mass — unique
derived Steiner hops on stamped or skipped flows, plus unique
StampBroken added and removed edges — so a reviewer can read why a
stamp no longer matches the tree on the Decisions list, not only in
the StampBroken card body or the selected record’s causal graph.
Counts come from the same flow trees and StampBroken findings
`causalChainFor` already reads (not invented, not double-counted
across the boot stamp and its StampBroken card). No XYFlow, no
peekSource. Not a kind-mix bar (DAM), not a second causal SVG (DCG),
and not a subject-card clone (RAS).

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `decisionHopScarMetrics` → `decisionHopScarGraphicHtml` →
  `bindDecisionHopScarGraphic` → `applyDecisionHopScarPaint`.
  Focus is `decisionHopScarFocus` (`derived` | `added` | `removed`).
  Escape clears after the DCG focus owner; the selected card stays.
- Strip `.dhs-strip[data-dhs="1"]` below the DAM strip, with
  `.dhs-stat[data-dhs]` counts (`[data-dhs-n]`) for derived / added /
  removed and a stacked `.dhs-bar` of `.dhs-seg` segments (omit a
  segment when its count is 0; show the zero on the stat). Derived
  counts unique tree edges once per stamped/skipped flow; added and
  removed count unique StampBroken edges once.
- Click Derived highlights `.expl-card[data-dhs-cut~="derived"]`
  (stamp/skip cards whose flow tree has edges) and selects the first.
  Click Added or Removed highlights the StampBroken cards that carry
  those scars and selects the first. Second click of the same measure,
  or Escape, clears graphic focus. Must not open Evidence /
  `peekSource` / the source pane / Open slice. `#canvas
  .react-flow__node` stays `0`. Highlight only — do not hide cards
  (DAM and the outcome strip stay in charge of filtering).
- CSS in `extension/media/main.css`: `.dhs-strip` / `.dhs-stat` /
  `.dhs-bar` / `.dhs-seg`. Existing `.dam-dim` and DCG scar colors
  stay.
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview.
2. Open **Decisions** (`#workspaces [data-ws="decisions"]` or press `4`).
3. Below the attestation mix, a hop-scar graphic shows this snap’s
   unique derived hops versus StampBroken added and removed edges
   (the same numbers as the boot tree and the StampBroken card body).
   Click Added to highlight the scar card; Escape clears the graphic
   focus after any DCG node/edge focus (the selected record stays).

The explorer fixture seeds a boot stamp (holds: false) whose flow tree
has 7 Steiner edges, a StampBroken finding with 1 added hop (`n0→n3`)
and 0 removed, a skipped `legacy` flow with no tree, and an
UnmatchedHint. Derived is 7, added is 1, removed is 0 — the bar has no
removed sliver. Self-review with no stamps is an honest empty cut (all
zeros), not invented history.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="decisions"]` (same document as DAM
and DCG — do not add a mid-suite `page.goto`).

Driver assertions (DHS1–DHS5):

- `.dhs-strip[data-dhs="1"]` present; derived / added / removed
  counts are 7 / 1 / 0; added and removed match the StampBroken card
  body; derived + added equals the selected boot DCG edge count;
  DAM + DCG + outcome strip stay; no XYFlow; no source
- click Added highlights the StampBroken card and selects it
- Escape clears graphic focus; Decisions stays; selection may stay
- compose with DAM/DCG; click Derived highlights the boot stamp
- screenshot `verification/decisions-hop-scar.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent or double-count. Unique tree edges once per
  stamped/skipped flow; unique StampBroken added/removed edges once.
  Do not sum `causalChainFor` across every card (boot stamp, StampBroken,
  and UnmatchedHint share the boot flow).
- Do not treat this as a second DAM kind-mix, a second DCG SVG, or a
  RAS subject grouping. The product is the ledger’s hop/scar mass as a
  stacked composition.
- A `0` removed (explorer) or an empty self-review ledger is honest;
  show zeros and omit empty bar segments, do not invent scars.
- Do not override `.dam-dim` or hide cards from this graphic.
- Rebuild `extension/media/main.js` with `npm run build:webview` using
  in-tree `node_modules` (no worktree symlink).
- Reseal the immutable lock *after* any edit to this feature map.
