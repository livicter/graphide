# Delta story scrubber

Interactive story-prefix scrub on Architecture Delta facts. A range control bound
to `deltaCursor` paints facts (and mappable canvas nodes) as past / now / ahead
so a human can freeze the review walk after N architecture-change facts —
graphs-only. Structural diff overlay bars, play/step, and view switcher stay.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `deltaStoryScrubHtml` → `syncDeltaStoryScrub` → `bindDeltaStoryScrub` →
  `applyDeltaStoryScrubPaint`. Active when `deltaCursor >= 0`. Escape clears
  to idle (`deltaCursor = -1`) after the SDO filter owner on Delta.
- Strip `.dds-strip[data-dds="1"]` with `#ddsScrub` range under the Delta review
  strip inside `.delta-page`. Meta shows `N/M` or idle.
- Facts take `.dds-past` / `.dds-now` / `.dds-ahead`. Canvas nodes matching the
  fact FQNs take the same classes (now wins over past over ahead). Hops carry
  `story` / `storyPrefix: "dds"`.
- CSS in `extension/media/main.css`: `.dds-strip` / `.dds-scrub` plus
  scrubbing opacity under `.delta-page.dds-scrubbing`.
- No `peekSource`. Stamp / skip attestation unchanged. Delta never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview.
2. Open **Delta** (`#workspaces [data-ws="delta"]`).
3. Drag the **Story** scrubber. Past facts stay readable; ahead fade; the
   current fact lights.
4. Escape clears the scrub to idle without leaving Delta (after any SDO filter).

## Driving it with the harness

```
extension/scripts/webview-harness.html?delta=1&probe=0&require=1&ws=delta
```

Driver assertions (DDS1–DDS5):

- `.dds-strip #ddsScrub` present; Delta facts available
- scrub sets `deltaCursor`; facts get `dds-past` / `dds-now` / `dds-ahead`
- Escape clears scrub paint; Delta workspace stays open
- screenshot `verification/delta-story-scrubber.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Idle is `deltaCursor === -1` (no past/now/ahead). Fact list order is the
  story order (same as Play / Next).
- Do not remove Structural diff overlay, play/step, or before/after/delta views.
- Do not invent a second kind-mix or open source from the scrubber.
- Rebuild `extension/media/main.js` with `npm run build:webview`.
