# Search

Find on the current Review graph and lists. Existing `#graphSearch` /
`graphFilter.q` / `matchesExplorerQuery`. Not a second finder and not an
Ask / LLM pane. Query matches FQN, file, flow, and hop text already on
the desk.

## Sub-features

- Header `#graphSearch`. `/` focuses and selects. Input writes
  `graphFilter.q` and calls `refreshExplorer`.
- Map altitude: non-matching `.bubble-card` get `.dim`; matches get `.hit`.
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
- Map: `.bubble-card.dim` ≥ 1 for a partial community name
- Enter / Slice: matching `.vnode` stay undimmed; others get `.dim`
- Lineage: query filters `#lineageHops .expl-card.hop` and dims
  off-query `.vnode`
- screenshot `verification/search.png` is not a black frame
- Map altitude after Back is still `xy=0`
- `.graphide/stamps/` is still empty

## Gotchas

- `/` is Find. Do not steal it for Ask. Search stays one field.
- Do not add `data-component` / `data-testid`. `#graphSearch`,
  `graphFilter.q`, `.dim`, `.hit`, `matchesExplorerQuery` are the hooks.
- Enter / Lineage nodes must carry `data-fqn` / `data-file` so file Find
  works after the XYFlow remount (same paint-flag path as Ego).
- `#enterCanvas .vnode.dim` needs the dim opacity — Slice already has
  `.steiner-wrap .vnode.dim`; do not leave Enter unstyled.
- Do not rebuild Find as a command palette or LLM box.
- Do not React-mount Map community LOD. Cards stay vanilla.
