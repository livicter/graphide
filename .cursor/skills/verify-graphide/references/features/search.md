# Search

Find on the current Review graph and lists. Existing `#graphSearch` /
`graphFilter.q` / `matchesExplorerQuery`. Not a second finder and not an
Ask / LLM pane. Query matches FQN, file, flow, and hop text already on
the desk.

## Sub-features

- Header `#graphSearch`. `/` focuses and selects. Input writes
  `graphFilter.q` and calls `refreshExplorer`. Focusing Find hides the
  hover tip (`K19h`) and clears the toast (`K20h`), same chrome exclusivity as Keys / Export / Ask.
- Map altitude: non-matching `.bubble-card` get `.dim`; matches get `.hit`.
  A card matches on its name or on a member's FQN / file
  (`bubbleMembersMatchQuery`). Hidden kinds do not count. Enter child
  communities (`.vnode[data-leaf="0"]`) match the same way.
- Derived XYFlow: `#enterCanvas` / `#sliceCanvas` / `#lineageCanvas`
  `.vnode` dim the same way (`data-fqn`, `data-file`, `data-flow`,
  `data-kind`, `data-hops`). Kind pills still hide Function / Type /
  Endpoint ([kind-filters.md](kind-filters.md)).
- List workspaces already filter cards / hops / facts with
  `matchesExplorerQuery` (Decisions, Registry, Timeline, Sequence,
  Data-flow, Lifecycle, Delta). Lineage incident hop cards do the same.
- Empty Find restores the full cut. Search is viewer state — Export
  already strips it.
- Stamp / skip stay human. Search never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview or open Map / Slice / Lineage.
2. Click the Find field or press `/`. Type an FQN token, a file stem,
   a flow name, or a hop kind (`Calls`, `subscribe`).
3. Off-query community cards and derived nodes dim. Matching cards /
   hops stay. Clear the field to see the full graph.

The in-tree proof is the explorer Map (`render` dims other communities)
plus enter-bubble FQN / file filter, plus `fixtures/demo` Lineage
(`encode` / `subscribe`).

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Type into `#graphSearch` (or `/` then type). Assert `.bubble-card.dim`
on Map. Enter a bubble and type an FQN / file stem; assert
`#enterCanvas .vnode.dim`. Clear. Then:

```
extension/scripts/webview-harness.html?lineage=1&probe=0&require=1&ws=lineage
```

Type a token that hits one Lineage node or hop; others dim / drop from
`#lineageHops`.

Driver assertions:

- `#graphSearch` is present; `/` focuses it
- focusing Find hides `#tip` (`K19h`) and clears `#toast` (`K20h`)
- Map: `.bubble-card.dim` ≥ 1 for a partial community name
- Map: a member FQN (`SimulationData`) keeps `b-render` `.hit`; `b-assets`
  dims (`SG1c`)
- Map: a member file (`simulationdata.rs`) keeps `b-render` `.hit`; `b-assets`
  dims (`SG1e`)
- Enter `b-physics`: `ScreenshotFormat_2000` keeps child `b-physics-b`
  `.hit`; `b-physics-a` dims (`SG1d`)
- Enter / Slice: matching `.vnode` stay undimmed; others get `.dim`
- Lineage: query filters `#lineageHops .expl-card.hop` and dims
  off-query `.vnode`
- screenshot `verification/search.png` is not a black frame
- Map altitude after Back is still `xy=0`
- `.graphide/stamps/` is still empty

## Gotchas

- `/` is Find. Do not steal it for Ask. Search stays one field.
- Escape on a focused `#graphSearch` blurs Find (keeps the query) so
  desk keys work again (`K13`).
- Do not add `data-component` / `data-testid`. `#graphSearch`,
  `graphFilter.q`, `.dim`, `.hit`, `matchesExplorerQuery` are the hooks.
- Enter / Lineage nodes must carry `data-fqn` / `data-file` so file Find
  works after the XYFlow remount (same paint-flag path as Ego).
- `#enterCanvas .vnode.dim` needs the dim opacity — Slice already has
  `.steiner-wrap .vnode.dim`; do not leave Enter unstyled.
- Distance grey (`data-slice-dist`) must skip `.dim`. A Find miss on an
  off-tree node is opacity 0.18, same as a miss on the lit walk.
- With Ego on, a Find hit outside the neighborhood stays lit and Ego
  misses stay Find-dim (Slice `SG5`, Enter `SG5b`; Lineage Find-dim inside Ego walk `SG5c` / `SG5d`). Ego lift skips `.dim`.
- Off-program `.away` (0.38) must skip `.dim` / `.hit` so Find still
  separates hits from misses on an all-away Slice (`SG6`).
- Off-path Map cards (`.bubble-card.off`) stay at 0.72. A `.hit` paints
  at opacity 1 (`SG1b`).
- Card name alone is not enough: an FQN Find used to dim every card,
  even the one whose member chip shows the hit (`SG1c`). A member file
  path must keep that card lit the same way (`SG1e`).
- Do not rebuild Find as a command palette or LLM box.
- Do not React-mount Map community LOD. Cards stay vanilla.
