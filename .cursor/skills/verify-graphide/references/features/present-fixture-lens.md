# Present/fixture lens

A fixture-kind lens on the Trace Trajectory DAG, visible on Presentation
Stage, so a reviewer can isolate plan / edit / fixture / diff / verify /
harness / gate / ship nodes from the current fixture — not IR Lens (`L`),
not a kind-mix bar, and not a story-scrub. Counts come from the fixture
nodes (not invented). Graphs-only: no peekSource, no XYFlow.

## Sub-features

- Desk helpers in `extension/media/src/graph/desk.js`:
  `fixtureLensCounts` → `fixtureLensStripHtml` → `bindFixtureLens` →
  `applyFixtureLensPaint`. Focus is `fixtureLensKind` (a fixture node
  kind, or null). Escape clears the lens *before* exiting Present, so the
  stage stays up.
- Strip `.pfl-strip[data-pfl="1"]` under the Trace title strip, with one
  `.pfl-chip[data-pfl-kind]` per fixture node kind and a fixture-id
  caption (`[data-pfl-fixture]`). Chips, not max-scaled bars (the default
  fixture has one node per kind).
- Click a chip to isolate matching `.traj-node` (`.pfl-on` / `.pfl-dim`).
  Second click or Escape clears. Must not open Evidence / `peekSource` /
  the source pane. Must not steal `L` (IR Lens stays Function / Type /
  Endpoint). `#canvas .react-flow__node` stays `0` on this list desk.
- The strip lives in `#canvas`, so it remains visible while `body.present`.
- CSS in `extension/media/main.css`: `.pfl-strip` / `.pfl-chip` / `.pfl-on`.
  Existing `.dim`, `.residual-filtered`, `.tss-ahead`, and `.ptd-dim` keep
  their opacity.
- Stamp / skip attestation unchanged. The lens never writes
  `.graphide/stamps/`.

## How to get to it (user POV)

1. Review a folder (or open the explorer harness). Land on Overview.
2. Open **Trace**. Under the title strip, fixture-kind chips name the
   current fixture’s node kinds.
3. Click a kind (for example **fixture** or **verify**) to light those
   subtasks and dim the rest.
4. Press `F` (Present). The lens stays on the stage. Escape clears the
   lens first; a second Escape exits Present. `L` is still IR Lens.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

Then click `#workspaces [data-ws="trace"]` (same document as TSS —
do not add a mid-suite `page.goto`).

Driver assertions (PFL1–PFL5):

- `.pfl-strip[data-pfl="1"]` present; chip counts match `.traj-node[data-kind]`
- click isolates that kind; Trace stays; no source pane; no XYFlow
- Escape clears focus; Trace stays; Present is not exited
- on Presentation Stage the strip stays; Escape clears the lens and leaves `body.present`
- screenshot `verification/present-fixture-lens.png` is not a black frame
- `.graphide/stamps/` stays empty

## Gotchas

- Do not steal `L`. IR Lens remains Function / Type / Endpoint on
  `.vnode` / `.seq-part` / `.df-node`. This lens is fixture node kinds on
  `.traj-node`.
- Escape must clear `fixtureLensKind` *before* `applyPresent(false)`.
  Otherwise the first Escape would leave the stage with the lens still on.
- Do not ship this as a max-scaled kind-mix bar (RAK / SHM / edge-legend
  already cover mix charts). Chips plus on-canvas isolate is the product.
- Do not override TSS / residual / focus `.dim` opacity.
- Rebuild `extension/media/main.js` with `npm run build:webview` using
  in-tree `node_modules` (no worktree symlink).
- Reseal the immutable lock *after* any edit to this feature map.
