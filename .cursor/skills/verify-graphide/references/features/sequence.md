# Sequence

Callers, callees, returns, and order along one flow's derived Steiner
interaction (Calls, plus Publishes / Subscribes / Reads / Writes). Not an
agent-drawn sequence JSON. Pairing stays Graphide IR: Function / Type /
Endpoint, FQNs, spans.

## Sub-features

- Workspace tab `#workspaces [data-ws="sequence"]` (key `9`). Same explorer
  nav row as Delta — not a second chrome row.
- Participants `#seqParts .seq-part` with `data-fqn` / `data-kind` / `data-id`.
  More than one on a real call chain.
- Ordered hops `#seqHops .seq-hop` with `data-seq-i`, `data-kind`,
  `data-seq-variant` (`call` / `return` / `default`), `data-from`, `data-to`.
- Canvas `#seqCanvas .seq-row` repeats that hop list as participants × order.
- Play strip `#seqReview`: `#seqOverview` · `#seqPrev` · `#seqPlay` ·
  `#seqNext` · `#seqStatus`.
- Play (`#seqPlay` / `P` on this workspace) walks hops finitely. At the last
  hop it stops. It does not loop. `[` / `]` step. Same keys as path walk.
- Engine: `flow_sequence` reads the current flow's Steiner. A `return` hop is
  the same `Calls` edge backward — not a new pair of nodes.
- Stamp / skip stay human. Sequence never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder that has a derived flow (`control-flow` or a sidecar such
   as `data-subscription`). The desk lands on Overview.
2. Click **Sequence** (`#workspaces [data-ws="sequence"]`) or press `9`.
3. You should see participants across the top, an ordered hop list, and
   Play / Prev / Next. Selecting a hop highlights that caller → callee.
4. Play walks the list once. Stamp and Skip are still the human attestation
   for flows — they are not this walk.

The in-tree proof is `fixtures/demo`: the same `data-subscription` /
`control-flow` slice as `first_slice.rs`. `crate::sub::subscribe` Subscribes
`crate::bus::events`.

## Driving it with the harness

```
./target/debug/graphide review --root fixtures/demo --json --progress --no-parent \
  > extension/scripts/sequence-snap.json
```

Then:

```
extension/scripts/webview-harness.html?sequence=1&probe=0&require=1&ws=sequence
```

`sequence=1&require=1` fetches `sequence-snap.json` and **fails closed** if it
is missing or not a ReviewSnapshot (`window.__graphideSequence`). Do not point
this gate at the synthetic explorer fixture.

Driver assertions:

- `#workspaces [data-ws="sequence"]` is on
- `#seqParts .seq-part` length `> 1`
- `#seqHops .seq-hop` length `>= 1` and hops are ordered (`data-seq-i`)
- some hop or participant text matches `subscribe` / `events` / `Subscribes`
- `#seqPlay` / `#seqPrev` / `#seqNext` / `#seqOverview` / `#seqCanvas` exist
- stepping Next past the end stays on the last `data-seq-i` (no loop)
- screenshot `verification/sequence.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- Participants and hops are Steiner endpoints, not Archify authored ids. Do
  not invent hops that are not on the tree (`TypeUses` / `Contains` stay off).
- `return` is a reading of `Calls`, not a plugin kind. Subscribes / Publishes
  stay one forward hop.
- Self-review stays `--no-parent` on this checkout. Sequence CI uses
  `fixtures/demo` so shallow Actions clones do not flake.
- `P` on Sequence walks hops. `P` on Map / Overview still walks the story
  rail. `P` on Delta still walks facts.
- Do not add `data-component` / `data-testid`. `#seqHops`, `#seqParts`,
  `[data-ws="sequence"]`, `.seq-hop[data-seq-variant]` are the product hooks.
- Do not vendor Archify's Node renderer. This reading uses Graphide `.vnode`
  / explorer list chrome.
