# Delta sticky views

Selecting a community `#deltaFacts` row focuses that sticky `BubbleId`
across Before / Delta / After. Parent members come from
`delta.parent_bubbles`; head members from `bubbles`. Node/hop facts
stay `(kind, fqn)`.

## Sub-features

- Engine ships coarse `delta.parent_bubbles` (the `previous_bubbles`
  cut used for `sticky_match` / `cluster_delta`) from
  `crates/graphide-engine/src/review.rs`. Helper `bubble_members`
  resolves a coarse id. Not Archify authored ids.
- Desk `communityWantFqns` / `deltaReading` in
  `extension/media/src/graph/desk.js`. A community fact
  (`data-delta-class="community"` + `data-bubble`) is the want-set:
  Before = parent members, After = head members, Delta = union /
  diff, cap 24. Auto-view: `removed` → Before, `added` → After,
  else Delta.
- Matching `#deltaCanvas .vnode` carry `data-bubble` and
  `data-delta-review-current` so flipping Before ↔ After stays the
  same community. XYFlow reuses Graphide `.vnode`.
- In-tree proof: `fixtures/demo` vs `fixtures/demo-parent`. Stamp /
  skip stay human. Map LOD stays `xy=0` if visited.

## How to get to it (user POV)

1. Review a folder that has a parent (`graphide review --parent …`).
   The desk lands on Overview.
2. Open **Delta** (`#workspaces [data-ws="delta"]`) or press `8`.
3. Click a community row (`stable` / `relabel` / `split` / `merge`).
   The canvas shows that community's members — not the node/hop
   want-set. Before is the parent cut; After is head; Delta is both.
4. Flip Before ↔ After. The same `data-bubble` stays on the nodes.
   Stamp and Skip are still the human attestation.

## Driving it with the harness

```
./target/debug/graphide review --root fixtures/demo --parent fixtures/demo-parent \
  --json --progress > extension/scripts/delta-snap.json
```

Then:

```
extension/scripts/webview-harness.html?delta=1&probe=0&require=1&ws=delta
```

Same Delta fixture path as Architecture Delta and sticky clusters.
`delta=1&require=1` fails closed if `delta-snap.json` is missing.

Driver assertions:

- snap `delta.parent_bubbles` has a coarse bubble whose id matches a
  `stable` or `relabel` cluster fact and a head coarse bubble
- click that `#deltaFacts .delta-fact[data-delta-class="community"][data-bubble]`
- `#deltaCanvas .vnode[data-bubble]` members exist on Before and After
  for the same id; Delta shows the union (cap 24)
- screenshot `verification/delta-sticky-views.png` is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post
- `.graphide/stamps/` is still empty
- Map, if visited, stays `xy=0`

## Gotchas

- Pairing is sticky `BubbleId` membership. Do not invent Archify
  snapshot ids or re-cluster on the desk.
- Without `parent_bubbles`, Before cannot resolve a sticky id to
  parent members. Do not derive them from `delta.parent` Graph.
- Community rows stay on `cluster_facts`. Node/hop facts stay
  `(kind, fqn)` on `delta.facts`.
- Self-review stays `--no-parent` and has empty `parent_bubbles`.
  Drive the demo fixture.
- Do not add `data-testid`. `#deltaFacts`,
  `.delta-fact[data-delta-class="community"][data-bubble]`,
  `#deltaCanvas .vnode[data-bubble]`, `#deltaView [data-delta-view]`
  are the product hooks.
- Agents never stamp. Do not flip verify `runs-on` off `ubuntu-latest`.
