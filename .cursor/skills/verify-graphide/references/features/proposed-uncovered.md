# Proposed uncovered

A parent cut that leaves changed nodes off every sidecar/default
Steiner becomes a **proposed** flow on `#tabs`. The deriver builds
the tree from uncovered FQNs. Not a `flows.toml` write, not an
agent stamp, and not Timeline Copy draft.

## Sub-features

- Engine second pass after `coverage(&changed, &flows)`
  (`crates/graphide-engine/src/review.rs` `propose_uncovered_hints`):
  if `cov.uncovered` is non-empty, one `FlowHint` named
  `proposed-uncovered` with up to 8 derived FQNs. Single-hit still
  uses Steiner's entry/sink walk when the graph connects.
- Those hints are Steinered and appended as `FlowView`s with
  `proposed: true`. Coverage is recomputed so a covered hole
  shrinks. Leftover ids (cap, or unresolved) stay `UncoveredNode`.
  The sidecar is not written.
- Desk chips `#tabs .tab[data-proposed="1"]` from `renderTabs`
  (`extension/media/src/graph/desk.js`). Dashed outline; name stays
  `proposed-uncovered`. Selecting one calls `selectFlow` and drives
  Map / Slice / Sequence like any flow.
- In-tree proof: `fixtures/demo` vs `fixtures/demo-parent`. Parent
  cut adds `crate::bus::sneaky_helper`, which is not a
  `data-subscription` hit. Copy draft stays for humans who want to
  persist a `[[flow]]`. Stamp / skip stay human.

## How to get to it (user POV)

1. Review a folder whose parent cut has uncovered changes (demo vs
   demo-parent). The desk lands on Overview.
2. `#tabs` shows **proposed-uncovered** next to sidecar names. The
   chip is dashed — a proposal, not a committed hint.
3. Press the chip. Slice (or Sequence / Data-flow) is that Steiner
   cut. The ugly flow is on the desk without inventing hits.
4. Stamp and Skip are still the human attestation. **Copy draft**
   on Timeline Uncovered is how a human commits the hit list to
   `flows.toml`. The proposal never writes that file.

This PR proves under-hinting: an uncovered change reaches `#tabs`
on first Review. Coverage after the second pass is honest — the
hole shrinks when the proposal covers the node.

## Driving it with the harness

```
./target/debug/graphide review --root fixtures/demo --parent fixtures/demo-parent \
  --json --progress > extension/scripts/delta-snap.json
```

Then:

```
extension/scripts/webview-harness.html?delta=1&probe=0&require=1&ws=delta
```

`delta=1&require=1` fetches `delta-snap.json` and **fails closed**
if it is missing or not a ReviewSnapshot. Do not point this gate
at the synthetic explorer fixture.

```
// snap.flows has proposed-uncovered / proposed:true / sneaky_helper
const tab = document.querySelector('#tabs .tab[data-proposed="1"]');
tab.click();
// #workspaces [data-ws="slice"].on
// #tabs .tab.on[data-proposed="1"]
// #sliceCanvas Steiner paints; cut ≠ data-subscription
```

Driver assertions:

- snap has `proposed-uncovered` with `proposed: true`, hit
  `crate::bus::sneaky_helper`, and a non-empty Steiner
- `#tabs .tab[data-proposed="1"]` is on the desk (name is
  `proposed-uncovered`; distinct from `data-subscription`)
- selecting it pins Slice, lights the chip, and changes the cut
- screenshot `verification/proposed-uncovered.png` is not a
  black frame
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty
- `fixtures/demo/flows.toml` is unchanged (still
  `data-subscription` only)

## Gotchas

- Proposed flows are derived from coverage. Do not invent IR kinds
  or an agent-drawn flow JSON. The deriver builds the Steiner tree.
- Recomputed `coverage.uncovered` can be empty when the proposal
  covers every leftover hit. That is honest. Timeline Copy draft
  hides when there are no remaining FQNs. Explorer still proves
  the aggregate Uncovered row.
- Persisted hints stay sidecar-only. `load_hints` never writes.
  Do not harvest comments.
- Self-review of this checkout is `--no-parent` and has no
  proposed-uncovered chip. Drive the delta fixture.
- Isolated hits (demo `sneaky_helper`) may Steiner as a single
  node. Slice still paints that tree. `selectFlow` pins Slice when
  `tree.nodes.length >= 1`.
- Do not add `data-testid`. `#tabs .tab[data-proposed="1"]`,
  `#tabs .tab[data-flow="proposed-uncovered"]`, `#sliceCanvas`
  are the product hooks.
- Agents never stamp. Do not click `#stampBtn` to “cover” the
  proposal. Do not flip verify `runs-on` off `ubuntu-latest`.
