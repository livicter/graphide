# Sticky clusters

Coarse community `BubbleId`s survive parent → head. The deriver
Jaccard-matches membership (`sticky_match`), then emits
`delta.cluster_facts`. Delta paints those rows on `#deltaFacts` so a
graph diff is not noise. Names stay PageRank / landing hints.

## Sub-features

- Engine: `sticky_match` then `cluster_delta` in
  `crates/graphide-engine/src/cluster.rs`, wired from `review.rs` when
  `previous_bubbles` or `parent_extracts` exist. Coarse only
  (`parent == null`). Kinds: stable / split / merge / relabel / added /
  removed. Not Archify authored ids.
- Snap field `delta.cluster_facts[]` with `kind`, `bubble`, `label`,
  `detail`. Node/hop `delta.facts` stay `(kind, fqn)` pairing.
- Desk `#deltaFacts .delta-fact[data-delta-class="community"]` from
  `clusterFacts` / `renderDeltaBody` in
  `extension/media/src/graph/desk.js`. Hooks: `data-delta-kind`
  (`stable` / `split` / `merge` / `relabel`) and `data-bubble`.
- Map cards already use `[data-bubble]`. On a parent snap they also get
  `data-cluster` when a cluster fact matches. Altitude stays `xy=0`.
- In-tree proof: `fixtures/demo` vs `fixtures/demo-parent`. Stamp /
  skip stay human.

## How to get to it (user POV)

1. Review a folder that has a parent (`graphide review --parent …`).
   The desk lands on Overview.
2. Open **Delta** (`#workspaces [data-ws="delta"]`) or press `8`.
3. The fact list starts with community rows: **community · bubble N ·
   label** and a detail such as `kept bubble N`. That N is the sticky
   id, not a hand-drawn component.
4. Map cards on the same snap keep the same `data-bubble`. Stamp and
   Skip are still the human attestation.

## Driving it with the harness

```
./target/debug/graphide review --root fixtures/demo --parent fixtures/demo-parent \
  --json --progress > extension/scripts/delta-snap.json
```

Then:

```
extension/scripts/webview-harness.html?delta=1&probe=0&require=1&ws=delta
```

Same Delta fixture path as Architecture Delta. `delta=1&require=1`
fails closed if `delta-snap.json` is missing.

Driver assertions:

- snap `delta.cluster_facts` has a `stable` or `relabel` whose
  `bubble` is a coarse id on `snap.bubbles`
- `#deltaFacts .delta-fact[data-delta-kind="stable"][data-bubble]`
  (or `relabel`) exists; text includes `bubble` and that id
- optional Map: `.bubble-card[data-bubble]` matches; altitude `xy=0`
- screenshot `verification/sticky-clusters.png` is not a black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post
- `.graphide/stamps/` is still empty

## Gotchas

- Pairing is member overlap on derived `NodeId`s. Do not invent
  Archify snapshot ids or vendor a second clustering tool.
- Nested bubbles (`parent != null`) do not steal coarse ids. Cluster
  facts are coarse-only — Map LOD.
- Node/hop facts stay on `delta.facts`. Do not count community rows
  as added `sneaky_helper`.
- Self-review stays `--no-parent` and has empty `cluster_facts`.
  Drive the demo fixture.
- Do not add `data-testid`. `#deltaFacts`,
  `.delta-fact[data-delta-kind][data-bubble]`, `.bubble-card[data-bubble]`
  are the product hooks.
- Agents never stamp. Do not flip verify `runs-on` off `ubuntu-latest`.
