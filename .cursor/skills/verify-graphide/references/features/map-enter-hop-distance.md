# Map enter hop-distance graphic

## Sub-features

- EHD1 — Enter of b-render shows a hop-distance graphic in the enter title-band cluster with 5 out / 5 in of 10 painted hops, matching `data-ehd-cut` on `#enterCanvas .react-flow__edge`. MWC/MED/MEA/MEP/MEV strips stay. No level band. No source pane.
- EHD2 — Click Out highlights the 5 outbound hops and idles the 5 inbound; enter community stays; no source.
- EHD3 — Escape clears hop-distance graphic focus; enter stays; no source.
- EHD4 — The sixth title-band strip does not intercept `#enterCanvas` n0 clicks; enter stays; no source.
- EHD5 / EHD5b / EHD5c — screenshot `map-enter-hop-distance.png` is not a black frame; no `.graphide/stamps/` write; strip clicks do not post peekSource / showHop / enterRun / selectNode.

## How to get to it (user POV)

Open the explorer review, go to Map, enter the render community (b-render). The enter canvas shows 24 leaves and 10 hops. A "Hop distance" strip sits in the top-right title-band cluster with the walk-cut, distance-cut, attach, polarity, and verb-span graphics. Out counts hops that walk farther from the Steiner tree; in counts hops that walk closer or stay level. Click Out or In to highlight those hops. Escape clears the highlight and stays inside the community. The strip never opens source or jumps a hop.

## Driving it with the harness

Stay on the already-open enter desk after MEV5c Escape. Do not `page.goto` mid-suite. `waitForFunction` until 10 `#enterCanvas .react-flow__edge[data-ehd-cut]` exist, then assert 5 `out` / 5 `in`, prior enter strips present, no level band (EHD1). Click `.ehd-stat[data-ehd-band="out"]` (EHD2). Escape (EHD3). Prove n0 is clickable via `elementFromPoint` with `hitStrip` including `.ehd-strip` (EHD4). Shot `verification/map-enter-hop-distance.png` (EHD5). Escape before the existing leave-enter back click.

## Gotchas

- Sixth enter title-band strip is a layout risk (MWC E1j / MCC G4b). Cluster in `.enter-title-cuts` (absolute, column, pointer-events only on strips). Do not add in-flow chrome that shrinks the viewport. Prove n0 clickable before merge; broaden existing enter n0 hitStrip lists with `.ehd-strip`.
- First-paint `innerHTML` must include `mapEnterHopDistanceGraphicHtml` in `.enter-title-cuts` and bind after the MEV bind; also sync on recycle. Missing first-paint inject is the MEP/MEV lesson.
- XYFlow edges may not exist at the first apply after `mountEnterCanvas`. Use `scheduleMapEnterHopDistancePaint` (apply + double rAF). Tests must `waitForFunction` for 10 stamped `[data-ehd-cut]`, not `waitForSelector(..., visible)`.
- Distances come from enter `data-slice-dist` (same as MED), not a new field. Predicate: `from < to` → out, else in. Do not add a level band for the one same-distance hop (`n12→n24`).
- This is a hop-edge graphic, not a vnode graphic and not MEP (node attach direction). Do not post peekSource / showHop / enterRun / selectNode from the strip. Highlight stroke on edges only; do not override `.dim` or existing `*-hit`.
- Do not treat this as an SFD fan-degree clone or a kind-mix.
