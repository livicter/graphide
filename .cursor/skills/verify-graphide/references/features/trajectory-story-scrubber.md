# Trajectory story scrubber

Interactive story-prefix scrub on Trace Trajectory DAG. A range control bound to
`trajStoryCursor` paints nodes and edges as past / now / ahead so a human can
read the agent execution walk through the first N subtasks — graphs-only.
Residual filter, keyboard step, and hop-affordance stay.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `trajStoryScrubHtml` → `syncTrajStoryScrub` → `bindTrajStoryScrub` →
  `applyTrajStoryScrubPaint`. Active when `trajStoryCursor >= 0`. Escape clears
  to idle (`trajStoryCursor = -1`) after PTD filter owner and before residual
  filter clear on Trace.
- Strip `.tss-strip[data-tss="1"]` with `#tssScrub` range above the Trace strip
  inside `.traj-page`. Meta shows `N/M` or idle.
- Scrub sets `trajSelectedId` to the now-node. Nodes take
  `.tss-past` / `.tss-now` / `.tss-ahead`; edges take matching classes via
  `trajStoryEdgeClass` (now if either end is now; past if both past; else ahead).
- CSS in `extension/media/main.css`: `.tss-strip` / `.tss-scrub` plus
  scrubbing opacity under `.traj-page.tss-scrubbing`.
- No `peekSource`. Stamp / skip attestation unchanged. Trace never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview.
2. Open **Trace** (`#workspaces [data-ws="trace"]`).
3. Drag the **Story** scrubber. Past subtasks stay readable; ahead fade; the
   current subtask and its touching edges light.
4. Escape clears the scrub to idle without leaving Trace (after any PTD filter).

## Driving it with the harness

```
extension/scripts/webview-harness.html?trace=1&probe=0&ws=trace
```

Driver assertions (TSS1–TSS5):

- `.tss-strip #tssScrub` present; traj nodes available
- scrub sets `trajStoryCursor`; nodes get `tss-past` / `tss-now` / `tss-ahead`
- Escape clears scrub paint; Trace workspace stays open
- screenshot `verification/trajectory-story-scrubber.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Idle is `trajStoryCursor === -1` (no past/now/ahead). Fixture node array order
  is the story order (same as keyboard step).
- Do not remove residual filter, keyboard step, hop-affordance, or zoom chrome.
- Do not invent Trace phase/status/kind mix bars in this Feature.
- Rebuild `extension/media/main.js` with `npm run build:webview`.
