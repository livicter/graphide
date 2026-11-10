# Sequence hop-variant graphic

A stacked composition of this flow’s Sequence hops that are outgoing
calls, matching returns, or direct (non-call) hops — so a reviewer can
read call / return / direct mass, not only SHK hop-kind bars (which
lump call and return under Calls) or SMC’s same- vs cross-module cut.
Counts come from the same `sequenceOf` hops and `data-seq-variant` the
list already paints. No second XYFlow, no peekSource, no Play from the
strip. Not a kind-mix, not a story-scrub, not a subject-card clone, and
not a Slice walk-role or Map enter cut.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `sequenceHopVariantMetrics` → `sequenceHopVariantGraphicHtml` →
  `syncSequenceHopVariantChrome` / `bindSequenceHopVariantGraphic` →
  `applySequenceHopVariantPaint`. Focus is `sequenceHopVariantFocus`
  (`call` | `return` | `default`). Escape after SMC clears graphic
  focus only (`seqCursor` stays if the scrubber is live).
- Strip `.shv-strip[data-shv="1"]` in Sequence chrome after the
  module-cut strip, with `.shv-stat[data-shv-band]` counts
  (`[data-shv-n]`) for call / return / direct and a stacked `.shv-bar`
  of `.shv-seg` segments (omit a segment when its count is 0). Band
  totals equal `#seqHops .seq-hop[data-seq-variant]` length.
- Click a band highlights `#seqHops .seq-hop` whose `data-seq-variant`
  matches (`default` is labeled direct). Second click of the same
  measure, or Escape (after SMC), clears graphic focus. Must not open
  Evidence / `peekSource` / the source pane, and must not start Play or
  change `seqCursor`. Existing `#seqCanvas` XYFlow stays; do not add
  another canvas.
- CSS in `extension/media/main.css`: `.shv-strip` / `.shv-stat` /
  `.shv-bar` / `.shv-seg` / `#seqHops .seq-hop.shv-hit`. Highlight with
  a box-shadow only (do not override `.dim` / `.shk-dim` / `.smc-dim` /
  `.ssr-dim` / `.sss-ahead` opacity).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview, then open **Sequence**.
2. Under the module-cut graphic, a hop-variant graphic shows how many
   hops are outgoing calls, matching returns, or direct non-call hops
   (the same numbers as the painted hop cards and `data-seq-variant`).
3. Click Return to highlight return hops; Escape clears the graphic
   focus without leaving Sequence.

The explorer fixture’s boot / control-flow Steiner yields 9 hops:
3 call, 3 return, 3 direct (Reads / Writes). The dedicated
`?sequence=1` fixture is thinner (1 direct hop) and is not the proof
document. A flow with no returns is an honest empty return cut (0 / N),
not invented history.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="sequence"]` in the already-open
explorer document after Map MHS / SMC (do not add a mid-suite
`page.goto`). Later Slice tests click Slice themselves.

Driver assertions (SHV1–SHV5):

- `.shv-strip[data-shv="1"]` present; call + return + direct equals
  hop-card count; explorer is 3 / 3 / 3 of 9; existing `#seqCanvas`
  stays; SMC strip still present; no source
- click Return highlights `[data-seq-variant="return"]`; Sequence stays;
  no peekSource
- Escape clears graphic focus; Sequence stays
- screenshot `verification/sequence-hop-variant.png` is not a black
  frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent hop membership. Use the same `sequenceOf` hops and
  `data-seq-variant` (`call` / `return` / `default`) the list already
  paints.
- Do not treat this as SHK (hop kind — Calls lumps call and return),
  SMC (same vs cross module), SSS (story scrub), SWR, MED, or TPC.
  The product is call / return / direct hop mass as a stacked
  composition.
- A `0` band is honest; show zeros and omit empty bar segments.
- Do not override `.dim` / `.shk-dim` / `.smc-dim` / `.ssr-dim` /
  `.sss-ahead` opacity, and do not call `peekSource` / `showHop` / Play
  from the strip. Do not change `seqCursor` from the strip (SSS owns
  the cursor).
- Place the strip in Sequence chrome (after SMC), not as an enter
  in-flow row or a full-width overlay over `#seqCanvas` (MWC E1j /
  n0-click).
- Rebuild `extension/media/main.js` with `npm run build:webview` using
  in-tree `node_modules` (no worktree symlink).
- Reseal the immutable lock *after* any edit to this feature map.
