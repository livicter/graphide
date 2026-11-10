# Lifecycle story scrubber

Interactive story-prefix scrub on the derived Lifecycle review machine. A range
control bound to `lcCursor` paints transition events (and mappable states) as
past / now / ahead so a human can freeze the review walk after N events —
graphs-only. Lifecycle transition overlay bars, play/step, and lanes stay.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `lcStoryScrubHtml` → `syncLcStoryScrub` → `bindLcStoryScrub` →
  `applyLcStoryScrubPaint`. Active when `lcCursor >= 0`. Escape clears
  to idle (`lcCursor = -1`) after the LSC filter owner on Lifecycle.
- Strip `.lss-strip[data-lss="1"]` with `#lssScrub` range under the Lifecycle
  review strip inside `.lc-page`. Meta shows `N/M` or idle.
- Events take `.lss-past` / `.lss-now` / `.lss-ahead`. Lane/canvas states
  matching from/to ids take the same classes (now wins over past over ahead).
  Hops carry `story` / `storyPrefix: "lss"`.
- CSS in `extension/media/main.css`: `.lss-strip` / `.lss-scrub` plus
  scrubbing opacity under `.lc-page.lss-scrubbing`.
- No `peekSource`. Stamp / skip attestation unchanged. Lifecycle never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview.
2. Open **Lifecycle** (`#workspaces [data-ws="lifecycle"]`).
3. Drag the **Story** scrubber. Past events stay readable; ahead fade; the
   current event lights.
4. Escape clears the scrub to idle without leaving Lifecycle (after any LSC filter).

## Driving it with the harness

```
extension/scripts/webview-harness.html?lifecycle=1&probe=0&require=1&ws=lifecycle
```

Driver assertions (LSS1–LSS5):

- `.lss-strip #lssScrub` present; Lifecycle events available
- scrub sets `lcCursor`; events get `lss-past` / `lss-now` / `lss-ahead`
- Escape clears scrub paint; Lifecycle workspace stays open
- screenshot `verification/lifecycle-story-scrubber.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Idle is `lcCursor === -1` (no past/now/ahead). Transition list order is the
  story order (same as Play / Next).
- Do not remove Lifecycle transition overlay, play/step, or lanes.
- Do not invent a second kind-mix or open source from the scrubber.
- Story-prefix opacity must not override Graph Find `.dim` / `.hit` (SG9).
- Rebuild `extension/media/main.js` with `npm run build:webview` using in-tree
  `node_modules` (no worktree symlink — esbuild comments must match CI).
