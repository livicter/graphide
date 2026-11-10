# Passport impact/layer graphic

A two-column plan-shape graphic on Passport: architecture **layers**
(from target rows) beside **impact families** (call graphs, API
contracts, invariants). So a reviewer can read the plan’s shape on the
canvas, not only in chips and lists. Counts and ticks come from the same
fixture lists as the sections (not invented). No XYFlow, no peekSource,
no live `#deltaCanvas`. Not a kind-mix bar, not RAS subject cards, and
not a PFL chip lens. Highlight only.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `passportLayerEntries` / `passportImpactFamilyEntries` →
  `passportImpactLayerGraphicHtml` → `bindPassportImpactLayerGraphic` →
  `applyPassportImpactLayerPaint`. Focus is `passportImpactLayerFocus`
  (`{axis:'layer'|'impact', value}`). Escape clears after the PTD filter
  owner on Passport.
- Strip `.pil-strip[data-pil="1"]` after the gate, with two columns
  (`.pil-col[data-pil-col="layer|impact"]`). Each `.pil-row[data-pil-axis][data-pil-key]`
  shows a label, a count (`[data-pil-n]`), an SVG magnitude bar scaled
  to the max *in that column*, and tick marks for delta statuses
  (layers) or delta classes (impact families).
- Click a layer row to focus matching
  `[data-passport="targets"] [data-passport-layer]` rows; click an
  impact family to focus that `.passport-impact-card[data-impact]`.
  Second click or Escape clears. Must not hide rows. Must not open
  Evidence / `peekSource` / the source pane. `#canvas .react-flow__node`
  stays `0`. No live `#deltaCanvas`.
- CSS in `extension/media/main.css`: `.pil-strip` / `.pil-row` /
  `.pil-bar` / `.pil-tick`. Existing `.ptd-dim` and `.residual-filtered`
  keep their opacity.
- Stamp / skip / Approve attestation unchanged. The graphic never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder (or open the explorer harness). Land on Overview.
2. Open **Passport**. After the gate, a two-column graphic shows target
   layers (architecture, chrome, harness, trace) and impact families.
   On the in-tree fixture, harness is 2 targets; call graphs are 5 rows.
3. Click a layer to emphasize those architecture targets, or a family to
   emphasize that impact card. Escape clears after any PTD filter.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="passport"]` (same document as PF1–PF5 —
do not add a mid-suite `page.goto`).

Driver assertions (PIL1–PIL5):

- `.pil-strip[data-pil="1"]` present; layer counts match
  `[data-passport-layer]` rows; impact counts match
  `.passport-impact-card[data-impact]` list lengths
- click a layer focuses matching targets; Passport stays; no source; no XYFlow
- Escape clears focus; Passport stays open
- click an impact family focuses that card; gate / vocab stay
- screenshot `verification/passport-impact-layer.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not invent a Sankey or edges from layers to impact families — the
  fixture does not map them. Two independent columns, each scaled to
  its own max.
- Do not treat this as a PTD / RAK kind-mix or a PFL / RAS chip strip.
  Proportional bars + ticks on a plan-shape graphic is the product.
- Do not mount `#deltaCanvas` on Passport (inv3 / inv5).
- Do not override `.ptd-dim` or residual-filter opacity.
- Rebuild `extension/media/main.js` with `npm run build:webview` using
  in-tree `node_modules` (no worktree symlink).
- Reseal the immutable lock *after* any edit to this feature map.
