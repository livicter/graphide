# Slice hop tip

## Sub-features

- SHT1 — Slice hops on `#sliceCanvas .react-flow__edge` carry `data-from` / `data-to` / `data-kind` (and stamped walk/tree/community cuts once painted). No SVG `<title>`. The hop tip host `#sliceHopTip[data-sht="1"]` exists after bind.
- SHT2 — pointerenter on the n0→n1 Calls hop shows `#sliceHopTip` (`role="tooltip"`, `pointer-events: none`) with kind Calls, ends n0 → n1, and chips for walk / tree / cross. Slice stays. No source pane.
- SHT3 — pointerleave hides the tip. Hovering a Slice vnode does not resurrect the hop tip (FQN `#tip` may still show).
- SHT4 — The tip does not intercept `#sliceCanvas` n0 clicks; Slice stays; no source.
- SHT5 / SHT5b / SHT5c — screenshot `slice-hop-tip.png` is not a black frame; no `.graphide/stamps/` write; hover does not post peekSource / showHop / selectNode.

## How to get to it (user POV)

Open the explorer review and go to Slice. The Steiner canvas paints 29 members and 32 hops. Each hop already shows its verb label. Hover a hop (for example the Calls edge from n0 to n1). A floating tip names the verb, both ends, and whether that hop is walk or halo, tree or extra, and same-community or cross — the same cuts the title-band filters already use. Move off the hop and the tip disappears. Clicking the hop still opens the hop card. The strip cluster is unchanged; this is not a tenth title-band.

## Driving it with the harness

Stay on the already-open Slice desk after SFD5c Escape. Do not `page.goto` mid-suite. `waitForFunction` until `#sliceCanvas .react-flow__edge[data-from][data-to]` exist. Dispatch `pointerenter` on the n0→n1 edge (TEH style; do not rely on Playwright hover of a thin stroke). Assert tip fields (SHT2), leave hides and vnode hover does not resurrect it (SHT3), n0 stays clickable (SHT4), shot `verification/slice-hop-tip.png` (SHT5). Escape is not required to dismiss the tip.

## Gotchas

- Not a tenth `.slice-title-cuts` strip. Do not shrink the viewport or intercept n0 (MWC E1j / MCC G4b). Tip `pointer-events: none`.
- XYFlow edges may not exist at first paint. Bind after `stampXyFlowAttrs` plus double rAF. Tests `waitForFunction` and dispatch PointerEvent, like TEH.
- Mutual exclusion with the vnode FQN `#tip`. Hover must not post peekSource / showHop / selectNode (click still may showHop). Do not steal Escape from Slice graphic focus.
- Chips use already-stamped `data-swh-cut` / `data-ste-cut` / `data-shc-cut` (or the same helpers those stamps use). Do not invent a new cut or a kind-mix bar.
- This is the TEH affordance on Slice, not a DCG hop-SVG and not a hop-card / Evidence rewrite.
