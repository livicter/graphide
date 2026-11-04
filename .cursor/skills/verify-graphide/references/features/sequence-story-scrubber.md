# Sequence story scrubber

Interactive story-prefix scrub on Sequence. A range control bound to
`seqCursor` paints hops and CMS swimlanes as past / now / ahead so a human
can read the conversation flowchart through the first N exchanges —
graphs-only. Play, SSR, CMS, SHK, and CFT stay.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `seqStoryScrubHtml` → `syncSeqStoryScrub` → `bindSeqStoryScrub` →
  `applySeqStoryScrubPaint`. Active when `seqCursor >= 0`. Escape clears to
  idle (`seqCursor = -1`) after SHK filter owner.
- Strip `.sss-strip[data-sss="1"]` with `#sssScrub` range beside the Play row
  inside `.seq-page`. Meta shows `N/M` or idle.
- Scrub / Prev / Next / Play / hop click share `seqCursor`. Hops take
  `.sss-past` / `.sss-now` / `.sss-ahead`; module lanes take
  `.sss-past-lane` / `.sss-now-lane` / `.sss-ahead-lane`. Canvas edges get
  matching `story` classes via `sequence-canvas.jsx`.
- CSS in `extension/media/main.css`: `.sss-strip` / `.sss-scrub` plus
  scrubbing opacity under `.seq-page.sss-scrubbing`.
- No `peekSource`. Stamp / skip attestation unchanged. Sequence never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview.
2. Open **Sequence** (`#workspaces [data-ws="sequence"]`) or press `9`.
3. Drag the **Story** scrubber (or press Play / Next). Past hops stay readable;
   ahead hops fade; the current hop and its swimlanes light.
4. Escape clears the scrub to idle without leaving Sequence (after any SHK
   filter).

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0&ws=sequence
```

Driver assertions (SSS1–SSS5):

- `.sss-strip #sssScrub` present; `#seqPlay` intact
- scrub / Next sets `seqCursor`; hops get `sss-past` / `sss-now` / `sss-ahead`
- Escape clears scrub paint; Sequence workspace stays open
- screenshot `verification/sequence-story-scrubber.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Idle is `seqCursor === -1` (no past/now/ahead). Timeline always has a cursor;
  Sequence scrub starts idle until Play / step / scrub.
- Do not remove CMS swimlanes, SSR captions, or SHK bars.
- Do not XYFlow-redesign Sequence. Rebuild `extension/media/main.js` with
  `npm run build:webview`.
