# Registry audit subjects

Interactive subject graphic of this review’s audit rows — unique
subjects (flow when present, otherwise the row title) with a kind-tick
spark of which RAK buckets attach to each subject. So a reviewer can see
that a flow like `boot` spans stamp + broken + finding, not only kind
totals (RAK) or snapshot mass (RSG). Counts and ticks come from the same
`registryEvents()` rows as the table (not invented). No XYFlow, no
peekSource. Highlight only — RAK still owns kind filtering.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `registryAuditSubject` → `registryAuditSubjectGraphicHtml` →
  `bindRegistryAuditSubjectGraphic` → `applyRegistryAuditSubjectPaint`.
  Focus is `registryAuditSubjectFocus`. Escape clears after the RAK
  filter owner and the RSG focus owner on Registry.
- Strip `.ras-strip[data-ras="1"]` below the RAK strip, with one
  `.ras-card[data-ras-subject]` per unique subject, a row count
  (`[data-ras-n]`), and `.ras-tick[data-ras-kind]` marks for each
  attached RAK bucket. Not max-scaled kind bars, not RSG composition
  tiles, not PFL chips.
- Click a card to focus matching `table.audit` rows
  (`tr[data-ras-subject].ras-row-now` / `.ras-row-dim`). Second click or
  Escape clears. Must not hide rows (RAK already filters by kind). Must
  not open Evidence / `peekSource` / the source pane.
  `#canvas .react-flow__node` stays `0`.
- CSS in `extension/media/main.css`: `.ras-strip` / `.ras-card` /
  `.ras-tick`. Existing `.rak-dim` keeps its opacity.
- Stamp / skip attestation unchanged. Registry never writes
  `.graphide/stamps/` from this graphic.

## How to get to it (user POV)

1. Review a folder. Land on Overview.
2. Open **Registry** (`#workspaces [data-ws="registry"]` or press `5`).
3. Below the audit kind bars, subject cards name the audit subjects.
   On the explorer fixture, **boot** shows 3 rows and ticks for broken and
   finding (the boot stamp is broken, so it shares the broken tick with
   StampBroken). Click a subject to emphasize those table rows.
   Escape clears after any RAK or RSG focus.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="registry"]` (same document as RAK / RSG —
do not add a mid-suite `page.goto`).

Driver assertions (RAS1–RAS5):

- `.ras-strip[data-ras="1"]` present; card counts match table row subjects
- the boot card (explorer fixture) has 3 rows and broken + finding ticks
- click focuses matching rows; Registry stays; no source pane; no XYFlow
- Escape clears focus; Registry stays open
- RAK and RSG remain
- screenshot `verification/registry-audit-subjects.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- This is an inline subject graphic in a list workspace, not an XYFlow
  canvas. RG2 still requires `#canvas .react-flow__node` length `0`.
- Do not invent subjects or counts. Keys come from `registryEvents()`
  (`flow` when present, else title; Review snapshot is the review row).
- Do not treat this as a second kind-mix (RAK) or a second snapshot
  composition (RSG) or a chip lens (PFL). Kind ticks are a spark on the
  subject, not a totals bar.
- Do not hide table rows on click. Highlight only.
- Do not override `.rak-dim` opacity when both are active.
- Rebuild `extension/media/main.js` with `npm run build:webview` using
  in-tree `node_modules` (no worktree symlink).
- Reseal the immutable lock *after* any edit to this feature map.
