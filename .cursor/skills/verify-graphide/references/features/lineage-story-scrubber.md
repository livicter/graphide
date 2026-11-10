# Lineage story scrubber

Interactive story-prefix scrub on Lineage incident hops. A range control bound
to `lineageHopCursor` paints hop cards (and mappable canvas nodes) as past /
now / ahead so a human can freeze the provenance ego walk after N hops —
graphs-only. Lineage fan-size mix (LFO), behavior captions (LBC), and the
path row stay.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `lineageStoryScrubHtml` → `syncLineageStoryScrub` → `bindLineageStoryScrub` →
  `applyLineageStoryScrubPaint`. Active when `lineageHopCursor >= 0`. Escape
  clears to idle (`lineageHopCursor = -1`) after the LFO filter owner on Lineage.
- Strip `.lhs-strip[data-lhs="1"]` with `#lhsScrub` range above `#lineageHops`
  inside the Lineage stage. Meta shows `N/M` or idle.
- Hop cards take `.lhs-past` / `.lhs-now` / `.lhs-ahead`. Canvas nodes matching
  hop endpoints take the same classes (now wins over past over ahead). Hops
  carry `story` / `storyPrefix: "lhs"`.
- CSS in `extension/media/main.css`: `.lhs-strip` / `.lhs-scrub` plus
  scrubbing opacity under `.explorer-lineage.lhs-scrubbing`.
- No `peekSource`. Stamp / skip attestation unchanged. Lineage never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Land on Overview.
2. Open **Lineage** (`#workspaces [data-ws="lineage"]`), with an ego selected.
3. Drag the **Story** scrubber. Past hops stay readable; ahead fade; the
   current hop lights.
4. Escape clears the scrub to idle without leaving Lineage (after any LFO filter).

## Driving it with the harness

```
extension/scripts/webview-harness.html?lineage=1&probe=0&require=1&ws=lineage
```

Driver assertions (LHS1–LHS5):

- `.lhs-strip #lhsScrub` present; Lineage hops available
- scrub sets `lineageHopCursor`; hops get `lhs-past` / `lhs-now` / `lhs-ahead`
- Escape clears scrub paint; Lineage workspace stays open
- screenshot `verification/lineage-story-scrubber.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Idle is `lineageHopCursor === -1` (no past/now/ahead). Incident hop list
  order is the story order.
- Do not remove LFO, LBC captions, or the path row.
- Story-prefix opacity must not override Graph Find `.dim` / `.hit` or LFO
  `.lfo-dim` / `.lfo-hit`.
- Do not invent a second kind-mix or open Evidence / `peekSource` from the scrubber.
- Rebuild `extension/media/main.js` with `npm run build:webview` using in-tree
  `node_modules` (no worktree symlink — esbuild comments must match CI).
- Reseal the immutable lock *after* any edit to this feature map.
