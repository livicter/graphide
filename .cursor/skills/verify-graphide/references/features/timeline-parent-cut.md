# Timeline parent-cut graphic

A split composition of this review’s parent cut — changed nodes vs
parent, how many of those sit uncovered, and how many remain on a
proposed tree — so a reviewer can read the cut’s mass on the Timeline
canvas, not only in the first two rail items’ text. Counts come from the
same `snapshot.coverage` arrays as the Parent cut and Uncovered rows
(not invented). No XYFlow, no peekSource. Not a kind-mix bar (TKM), not
a story-scrub, and not a chip/subject clone.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `timelineParentCutMetrics` → `timelineParentCutGraphicHtml` →
  `bindTimelineParentCutGraphic` → `applyTimelineParentCutPaint`.
  Focus is `timelineParentCutFocus` (`changed` | `uncovered` |
  `covered`). Escape clears after the TKM filter owner; the scrub cursor
  stays.
- Strip `.tpc-strip[data-tpc="1"]` below the TKM strip, with
  `.tpc-stat[data-tpc]` counts (`[data-tpc-n]`) for changed / uncovered /
  covered and a stacked `.tpc-bar` of `.tpc-seg` segments (covered +
  uncovered as portions of the changed total). Covered is the count of
  changed ids not in the uncovered set.
- Click Changed or Covered jumps the rail to the Parent cut item
  (`.tl-item[data-tpc-cut="changed"]`). Click Uncovered jumps to the
  Uncovered item. Second click of the same measure, or Escape, clears
  graphic focus. Must not open Evidence / `peekSource` / the source pane.
  `#canvas .react-flow__node` stays `0`.
- CSS in `extension/media/main.css`: `.tpc-strip` / `.tpc-stat` /
  `.tpc-bar` / `.tpc-seg`. Existing `.tkm-dim` and scrub
  `.now` / `.past` / `.ahead` stay.
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview.
2. Open **Timeline** (`#workspaces [data-ws="timeline"]` or press `7`).
3. Below the kind bars, a parent-cut graphic shows this snap’s changed,
   uncovered, and covered counts (same numbers as the Parent cut and
   Uncovered rail text). Click Uncovered to jump the rail there; Escape
   clears the graphic focus after any TKM filter (the scrub position
   stays).

The explorer fixture seeds 1123 changed nodes, all uncovered (covered is
0). Self-review `--no-parent` may show `0` changed — that is still an
honest empty cut, not invented history.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="timeline"]` (same document as TKM —
do not add a mid-suite `page.goto`).

Driver assertions (TPC1–TPC5):

- `.tpc-strip[data-tpc="1"]` present; changed / uncovered counts match
  the Parent cut and Uncovered rail text; covered + uncovered-in-cut
  equals changed
- click Uncovered jumps the rail to that item; Timeline stays; no source
- Escape clears graphic focus; Timeline stays; scrubber remains
- TKM bars stay; no XYFlow
- screenshot `verification/timeline-parent-cut.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent counts. Use `snapshot.coverage.changed` /
  `coverage.uncovered` — the same arrays as `timelineEvents()`.
- Do not treat this as a second TKM kind-mix or a second scrubber. The
  product is the cut’s mass as a stacked composition.
- A `0` changed parent cut (self-review `--no-parent`) is honest; show
  zeros and an empty bar, do not invent a history.
- Do not override `.tkm-dim` or scrub `.ahead` opacity.
- Rebuild `extension/media/main.js` with `npm run build:webview` using
  in-tree `node_modules` (no worktree symlink).
- Reseal the immutable lock *after* any edit to this feature map.
