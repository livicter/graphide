# Cancel review

Header **Cancel** (`#cancelBtn`) during a live Review strip posts
`{ type: "cancel" }` and the host replies `{ type: "cancelled" }`.
The strip hides and **Review** returns. Not a second chrome row, not a
Map altitude, and not an agent stamp.

## Sub-features

- `#cancelBtn` lives in `extension/media/src/chrome/Header.jsx`
  (`title="Cancel review (Esc)"`, hidden until busy). `setBusy(true)`
  in `desk.js` shows Cancel and hides `#reviewBtn`.
- Click (or Escape while busy) posts `{ type: "cancel" }` and sets the
  label to **Cancelling…**. Host `cancelReview()` (`extension.ts`)
  kills the child; the webview then gets `{ type: "cancelled" }`.
- `finishWork()` hides `#progress` and restores Review. Map stays
  community LOD (`xy=0`) if the drive is on Map.
- Stamp / skip stay human. Cancel never posts `{ type: "stamp" }` and
  never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Graphide → **Review**. Land on Overview or open Map.
2. Press **Review**. The progress strip opens; **Cancel** replaces
   Review in the header.
3. Press **Cancel**. The strip hides. Review is back. The desk that
   was there stays (community Map, not a blank stage).
4. Stamp and Skip stay human. Cancel is abort, not an approval.

The in-tree proof is the explorer desk (`?mode=explorer`). Post a
synthetic `progress` message, then click `#cancelBtn` — do not wait
on a real long review.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map paints community cards:

```
window.postMessage({
  type: "progress",
  phase: "cluster",
  label: "Clustering communities…",
  done: 3,
  total: 5,
  pct: 62,
  elapsed_ms: 1840,
}, "*");
// #progress.on; #cancelBtn visible; #reviewBtn hidden
document.getElementById("cancelBtn").click();
// __vscodePosts has { type: "cancel" }; label Cancelling…
window.postMessage({ type: "cancelled" }, "*");
// host reply — stub only records posts
```

Driver assertions:

- `#cancelBtn` is visible while `#progress` is `.on`; `#reviewBtn` is
  hidden
- click posts `{ type: "cancel" }`; `#progressLabel` is Cancelling…
- `{ type: "cancelled" }` hides the strip; Review is shown; Cancel is
  hidden
- screenshot `verification/cancel-review.png` of the restored desk
  (not a black frame)
- no `{ type: "stamp" }` / `{ type: "skip" }` post on this step
- `.graphide/stamps/` is still empty
- Map stays `xy=0` if the drive is on Map

## Gotchas

- Click `#cancelBtn`. Do not treat a lone `{ type: "cancelled" }` post
  as the Cancel UX — that path is [progress.md](progress.md).
- The harness stub records `{ type: "cancel" }` and does not reply.
  The driver posts `{ type: "cancelled" }` as the host would.
- Queue is `requestAnimationFrame`. Wait for `.on` / Cancel visible
  before the click; wait for the strip off after cancelled.
- Do not add `data-testid`. `#cancelBtn`, `#reviewBtn`, `#progress`
  are the product hooks.
- Do not invent a second Cancel. Do not raise Map into XYFlow.
- Agents never stamp. Cancel is abort, not an approval.
  Do not flip verify `runs-on` off `ubuntu-latest`.
