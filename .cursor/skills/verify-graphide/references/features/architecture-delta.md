# Architecture Delta

Derived parent vs head. Pair by `(kind, fqn)`. Before / Delta / After plus a
machine list of added, removed, changed, moved, and rerouted facts. Review
walks that list once and stops.

## Sub-features

- Workspace tab `#workspaces [data-ws="delta"]` (key `8`). Same explorer nav
  as Timeline — not a second chrome row.
- Three-state switch `#deltaView [data-delta-view="before"]` /
  `[data-delta-view="delta"]` / `[data-delta-view="after"]`. `#deltaCanvas`
  repeats the current `data-delta-view`.
- Fact list `#deltaFacts .delta-fact` with `data-delta-kind` (`added` /
  `removed` / `changed` / `moved` / `rerouted`) and `data-fqn`.
- Review strip `#deltaReview`: `#deltaOverview` · `#deltaPrev` · `#deltaPlay`
  (label Review) · `#deltaNext` · `#deltaStatus`.
- Play (`#deltaPlay` / `P` on this workspace) walks facts finitely. At the
  last fact it stops. It does not loop. `[` / `]` step.
- Exact identity highlight: current fact gets `.delta-fact.on` and the
  matching `.vnode[data-fqn]` / hop path gets `data-delta-review-current`.
- Engine: `architecture_delta` pairs two `Graph`s by `NodeId = hash(kind, fqn)`.
  Added hops paint on After; removed hops on Before. Classification is
  semantic / topology / presentation only — no blast radius, no merge safety.
- Stamp / skip stay human. Delta never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder that has a parent (`graphide review --parent …`, or git
   `HEAD^`). The desk lands on Overview.
2. Click **Delta** (`#workspaces [data-ws="delta"]`) or press `8`.
3. You should see Before / Delta / After, a fact list, and Review / Previous /
   Next. Selecting a fact highlights that `(kind, fqn)` on the canvas.
4. Review plays the list once. Stamp and Skip are still the human attestation
   for flows — they are not this walk.

The in-tree proof is `fixtures/demo` vs `fixtures/demo-parent`:
`crate::bus::sneaky_helper` is an added Function.

## Driving it with the harness

```
./target/debug/graphide review --root fixtures/demo --parent fixtures/demo-parent \
  --json --progress > extension/scripts/delta-snap.json
```

Then:

```
extension/scripts/webview-harness.html?delta=1&probe=0&require=1&ws=delta
```

`delta=1&require=1` fetches `delta-snap.json` and **fails closed** if it is
missing or not a ReviewSnapshot (`window.__graphideDelta`). Do not point this
gate at the self-review `--no-parent` snap — that checkout is shallow in
Actions and the Delta would be empty.

Driver assertions:

- `#workspaces [data-ws="delta"]` is on
- `#deltaFacts .delta-fact` length `> 0`
- some `.delta-fact` text matches `sneaky_helper`
- `#deltaView` has `before`, `delta`, `after`
- `#deltaPlay` / `#deltaPrev` / `#deltaNext` / `#deltaOverview` exist
- stepping Next past the end stays on the last `data-delta-i` (no loop)
- screenshot `verification/delta.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- Pairing is Graphide identity, not Archify authored component ids. Do not
  invent snapshot IDs or agent-drawn topology.
- Self-review stays `--no-parent`. Parent coverage for this repo is optional
  and must not flake on `fetch-depth: 1`. Delta CI uses the demo fixture.
- Timeline (`data-ws="timeline"`) is unchanged. Chrome 17/17 still clicks it.
- `P` on Delta walks facts. `P` on Map / Overview still walks the story rail.
- Do not add `data-component` / `data-testid`. `#deltaFacts`, `[data-ws="delta"]`,
  `[data-delta-view]`, `.delta-fact[data-delta-kind]` are the product hooks.
- Do not vendor Archify's Node renderer. This reading uses Graphide `.vnode`
  / explorer list chrome.
