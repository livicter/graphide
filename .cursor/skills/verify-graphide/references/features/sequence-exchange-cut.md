# Sequence exchange-cut graphic

A stacked composition of this flow’s Sequence hops grouped into call
exchanges — so a reviewer can read which exchange carries mass, not
only SHV’s call / return / direct variant (across exchanges) or SMC’s
same- vs cross-module cut. An exchange starts at the first hop and at
every later `variant=call`, and includes the matching return plus any
trailing direct hops until the next call. Counts come from the same
`sequenceOf` hops the list already paints (`data-sxc-ex`). No second
XYFlow, no peekSource, no Play from the strip. Not a kind-mix, not a
story-scrub, not a hop-variant clone, and not a Slice walk-hop.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `sequenceExchangeIds` → `sequenceExchangeMetrics` →
  `sequenceExchangeGraphicHtml` → `bindSequenceExchangeGraphic` →
  `applySequenceExchangePaint`. Focus is `sequenceExchangeFocus`
  (exchange id `"1"` | `"2"` | …). Escape after SHV clears graphic
  focus only (`seqCursor` stays if the scrubber is live).
- Strip `.sxc-strip[data-sxc="1"]` in Sequence chrome after the
  hop-variant strip, with `.sxc-stat[data-sxc-band]` counts
  (`[data-sxc-n]`) per exchange and a stacked `.sxc-bar` of `.sxc-seg`
  segments (omit a segment when its count is 0). Band totals equal
  `#seqHops .seq-hop[data-sxc-ex]` length.
- Click a band highlights `#seqHops .seq-hop` whose `data-sxc-ex`
  matches. Second click of the same measure, or Escape (after SHV),
  clears graphic focus. Must not open Evidence / `peekSource` / the
  source pane, and must not start Play or change `seqCursor`. Existing
  `#seqCanvas` XYFlow stays; do not add another canvas.
- CSS in `extension/media/main.css`: `.sxc-strip` / `.sxc-stat` /
  `.sxc-bar` / `.sxc-seg` / `#seqHops .seq-hop.sxc-hit`. Highlight with
  a box-shadow only (do not override `.dim` / `.shk-dim` / `.smc-dim` /
  `.shv-dim` / `.sss-ahead` opacity).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview, then open **Sequence**.
2. Under the hop-variant graphic, an exchange-cut graphic shows how
   many hops sit in each call exchange (the same numbers as the painted
   hop cards and `data-sxc-ex`).
3. Click exchange 2 to highlight that exchange’s hops; Escape clears
   the graphic focus without leaving Sequence.

The explorer fixture’s boot / control-flow Steiner yields 9 hops in
three exchanges of 3 (call + return + trailing Reads or Writes). The
dedicated `?sequence=1` fixture is thinner (1 hop / 1 exchange) and is
not the proof document. A flow with one hop is an honest single
exchange, not invented history.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then stay on `#workspaces [data-ws="sequence"]` in the already-open
explorer document after SHV (do not add a mid-suite `page.goto`).
Later Slice tests (SHM) click Slice themselves.

Driver assertions (SXC1–SXC5):

- `.sxc-strip[data-sxc="1"]` present; band totals equal hop-card
  count; explorer is 3 / 3 / 3 of 9; existing `#seqCanvas` and SHV/SMC
  strips stay; no source
- click exchange 2 highlights `[data-sxc-ex="2"]` (3 hops); Sequence
  stays; no peekSource
- Escape clears graphic focus; Sequence stays
- screenshot `verification/sequence-exchange-cut.png` is not a black
  frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent hop membership. Use the same `sequenceOf` hops; an
  exchange starts at index 0 and at every later `variant=call`.
- Do not treat this as SHV (variant across exchanges), SMC (module
  same/cross), SHK (hop kind), or SSS (hop-index scrubber / cursor).
- Do not `page.goto` mid-suite; run after SHV5c, before the SHM Slice
  click, still on Sequence.
- Do not post `peekSource` / `showHop` / start Play from the strip.
- Do not add in-flow Map chrome or a title-band that intercepts canvas
  clicks (this strip lives in Sequence chrome only).
