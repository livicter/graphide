# Lens

Compare one or two semantic roles already in Graphide IR. Kinds are
Function / Type / Endpoint. Endpoint roles are Source | Sink. Do not
invent a third kind. Highlight matching nodes on the current map or
slice. Not an agent-drawn lens JSON.

## Sub-features

- Graph-bar `#lensBtn` (LENS). `L` opens the compare. Ask stays the LLM
  button — `L` is no longer Ask.
- Receipt `#lensReceipt` inside `#probeDock`. Chips `#lensRoles
  [data-lens-role]` for Function / Type / Endpoint / Source / Sink.
  Two-selection limit. Kind chips and Source|Sink do not mix.
- Compare chip `#lensCompare` names the one or two selected roles.
- Canvas classes `.lens-on` / `.lens-dim` on existing `.vnode` /
  `.seq-part` / `.df-node`. Existing `#kindFilters` pills take `.lens`
  when that kind is selected — they stay filters, not a second finder.
- Search stays `/` + `#graphSearch`. Do not rebuild Find.
- Stamp / skip stay human. Lens never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder that has a derived flow. Open Sequence or Map.
2. Press `L` or click **LENS**. Function and Endpoint light by default.
3. Click a chip to add or drop a role (max two). Source | Sink is the
   other pair — not a third kind.

The in-tree proof is `fixtures/demo`: Function `subscribe` next to
Endpoint `events`.

## Driving it with the harness

```
./target/debug/graphide review --root fixtures/demo --json --progress --no-parent \
  > extension/scripts/sequence-snap.json
```

Then:

```
extension/scripts/webview-harness.html?sequence=1&probe=0&require=1&ws=sequence
```

Press `L` (or `?lens=1`). `window.__graphideLens` holds the roles.

Driver assertions:

- `#lensBtn` is on and `#lensReceipt` is visible
- `#lensCompare` names Function · Endpoint
- `.lens-on` length `>= 1` and `window.__graphideLens.hits >= 1`
- every `.lens-on[data-kind]` is Function or Endpoint (no third kind)
- screenshot `verification/lens.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- Roles are Graphide IR only. Do not add backend / database / service.
- `L` is LENS. Ask is `#llmBtn`. Do not steal `/` (Find).
- Kind filters still show/hide. Lens highlights. Do not hide Type just
  because Function vs Endpoint is the compare.
- Do not add `data-component` / `data-testid`. `#lensBtn`, `#lensReceipt`,
  `#lensCompare`, `[data-lens-role]`, `.lens-on` are the hooks.
- Do not vendor Archify's Node renderer. The compare lights Graphide
  canvas.
