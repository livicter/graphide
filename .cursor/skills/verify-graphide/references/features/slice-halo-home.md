# Slice halo-home graphic

A stacked composition of this Slice’s halo members that attach to the
Steiner walk only inside their own Map community versus ones that
attach across communities — so a reviewer can read home vs away mass,
not only SHC’s hop same vs cross (which is a different mass), SWR’s
walk-role of all 29, or SHA’s hop bridge vs outer. Counts come from
the same `sliceCanvasProps` members the canvas already paints
(`data-shh-cut`). Community is the node’s Map altitude bubble
(`mapAltitudeBubbles()` members), not file stem and not `i % 12`.
The 8 walk members are not a band (that cut is SWR). No peekSource,
no showHop from the strip. Not a kind-mix, not a story-scrub, and
not a hop-community clone.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `sliceHaloHomeOf` → `sliceHaloHomeMetrics` →
  `sliceHaloHomeGraphicHtml` → `syncSliceHaloHomeGraphic` /
  `bindSliceHaloHomeGraphic` → `applySliceHaloHomePaint` /
  `scheduleSliceHaloHomePaint` (apply + double rAF). Focus is
  `sliceHaloHomeFocus` (`home` | `away`). Escape after SHC clears
  graphic focus only (stay on Slice).
- Strip `.shh-strip[data-shh="1"]` in `.slice-title-cuts` with
  SWR/STE/SWH/SHA/SRT/SBP/SHC, with `.shh-stat[data-shh-band]` counts
  (`[data-shh-n]`) for home / away and a stacked `.shh-bar` of
  `.shh-seg` segments (omit a segment when its count is 0). Band
  totals equal halo vnode count (explorer 21 of 29). All painted
  members stamp `data-shh-cut` (`home` | `away` | `walk`).
- Click a band highlights `#sliceCanvas .vnode` whose
  `data-shh-cut` matches. Second click of the same measure, or Escape
  (after SHC), clears graphic focus. Must not open Evidence /
  `peekSource` / `showHop` / `selectNode` / the source pane.
- CSS in `extension/media/main.css`: `.shh-strip` / `.shh-stat` /
  `.shh-bar` / `.shh-seg` / `#sliceCanvas .vnode.shh-hit`.
  Cluster stays absolute on `.stage` (column; pointer-events only on
  strips). Highlight ring only (do not override `.dim` / `.grey` /
  `.ego-dim` / existing `*-hit`).
- Stamp / skip attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder. Open **Slice** of the boot / control-flow walk.
2. Under the hop-community graphic, a halo-home graphic shows how
   many of the halo members attach to the walk only inside their own
   Map community versus how many attach across communities (the same
   numbers as `data-shh-cut` on the painted members).
3. Click Home to highlight those seven members; Escape clears the
   graphic focus without leaving Slice.

The explorer fixture paints 29 members: 8 walk (SWR), 21 halo. Of
the 21 halo, 7 are home and 14 are away (including one node with
both a home and a foreign walk-bridge, counted as away).

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then stay on `#workspaces [data-ws="slice"]` in the already-open
explorer document after SHC (do not add a mid-suite `page.goto`).
Later CPS tests click Overview themselves.

Driver assertions (SHH1–SHH5):

- `.shh-strip[data-shh="1"]` present in `.slice-title-cuts` with
  SWR/STE/SWH/SHA/SRT/SBP/SHC; explorer is 7 home / 14 away of 21
  halo, matching `data-shh-cut` (8 walk stamped, no walk band); no
  source
- click Home highlights the 7 home members; Slice stays; no
  peekSource
- Escape clears graphic focus; Slice stays
- title-band cluster does not intercept `#sliceCanvas` n0 clicks
- screenshot `verification/slice-halo-home.png` is not a black
  frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent membership. Home = every painted bridge from this
  halo vnode to a walk member stays inside the same Map altitude
  community; away = at least one such bridge is cross-community.
  Do not put a walk or both band on this strip. Do not hard-code
  `i % 12`.
- Do not treat this as SHC (hop same vs cross — 10/22 is a
  different mass), SWR, SHA, MCC, or a coverage / kind-mix cut.
- Title-band must stay absolute on `.stage`. Prefer a column cluster
  with SWR/STE/SWH/SHA/SRT/SBP/SHC so n0 stays clickable (MWC E1j /
  MCC G4b).
- Do not `page.goto` mid-suite. Insert SHH tests after SHC5c Escape
  and before CPS’s Overview click.
- Stamp `shhCut` in `sliceCanvasProps` and pass `data-shh-cut`
  through `derived-node.jsx` / the Slice path in `sequence-canvas.jsx`.
  `waitForFunction` for 29 `[data-shh-cut]` vnodes.
