# Sequence hop-kind mix

Interactive hop-kind bars on Sequence. Calls / Reads / Writes / Publishes /
Subscribes / type light as an overlay filter on `#seqHops .seq-hop` and
participant endpoints — graphs-only walk of which hop verbs matter. SSR captions,
CMS swimlanes, and Play stay.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `seqHopKindCounts` → `seqHopKindChartHtml` →
  `seqHopKindStripHtml` → `toggleSeqHopKindFilter` →
  `syncSeqHopKindBars` → `bindSeqHopKindChart` →
  `applySeqHopKindPaint`. Filter state `seqHopKindFilter`. Bucket via
  `seqHopKindBucket` from hop `kind` only (unknown → `type`).
- Strip `.shk-strip[data-shk="1"]` with `.shk-chart` / `.shk-bar[data-shk-kind]`
  above `#seqParts` inside `.seq-page`. Bars ordered Calls → Reads → Writes →
  Publishes → Subscribes → type; only kinds with count > 0 render.
- Click a bar: matching `.seq-hop[data-kind]` take `.shk-hit`; others
  `.shk-dim`. Endpoint `.seq-part` paint the same. Hosts toggle `.shk-filtering`.
  Second click clears. Escape clears without leaving Sequence.
- CSS in `extension/media/main.css`: `.shk-strip` / `.shk-chart` / `.shk-bar` /
  `.shk-fill` / `.shk-label` plus `.shk-hit` / `.shk-dim` under
  `.seq-page.shk-filtering` and `#seqHops.shk-filtering`.
- No `peekSource` on Overview from this Feature. Stamp / skip attestation
  unchanged. Sequence never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview.
2. Open **Sequence** (`#workspaces [data-ws="sequence"]`) or press `9`.
3. Above the participants, click a **Kinds** bar (e.g. Calls). Matching hops
   light; the rest dim. Play / SSR / CMS still work.
4. Escape clears the overlay.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0&ws=sequence
```

Driver assertions (SHK1–SHK5):

- `.shk-strip .shk-chart .shk-bar[data-shk-kind]` present with ≥1 bar; `#seqPlay` intact
- click a kind → hops get `shk-hit` / `shk-dim`; `.shk-filtering` on
- Escape clears filter; Sequence workspace stays open
- screenshot `verification/sequence-hop-kind-mix.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Bars count `seqHopKindBucket` values only (Calls…type).
- Do not remove CMS swimlanes or SSR captions/participant focus.
- Do not XYFlow-redesign Sequence. Do not reopen RKM/SHM.
- Rebuild `extension/media/main.js` with `npm run build:webview` — never
  hand-edit the bundle.
