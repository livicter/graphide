# Trace↔Passport Deep-Link Harness

ADE Phase 1 polish. Review harness hops between Trace (`data-ws="trace"`)
and Plan Passport (`data-ws="passport"`) while preserving traj focus and
passport gate state via URL params. No live Architecture Delta mount.

## Sub-features

- Combined harness load: `?trace=1` and/or `?passport=1` fetch both
  `trajectory-fixture.json` and `passport-fixture.json`.
- Context params: `?traj=<nodeId>` seeds Trace focus;
  `?gate=pending|approved|rejected` seeds Passport gate.
- Hop chrome: `[data-ade-hop="passport"]` on Trace,
  `[data-ade-hop="trace"]` on Passport. Sibling tabs stay intact.
- `history.replaceState` keeps `trace=1`, `passport=1`, `traj`, `gate`,
  and `ws` in sync as the operator selects nodes or signs the gate.

## How to get to it (user POV)

1. Open Review harness with both flags, e.g.
   `webview-harness.html?trace=1&passport=1&traj=sub-verify&gate=approved&ws=trace`.
2. Trace lands focused on the named subtask; click **Open Passport →**.
3. Passport shows the seeded gate; click **← Open Trace** to return with
   the same traj focus.

## Driving it with the harness

```
/scripts/webview-harness.html?trace=1&passport=1&traj=sub-verify&gate=approved&probe=0&ws=trace
```

Driver assertions (DL1–DL5):

- DL1: lands Trace with `data-focus=sub-verify` and both fixtures loaded
- DL2: URL `gate=approved` seeds `__graphidePassportGate`
- DL3: hop to Passport keeps gate approved + traj in URL; no live Delta
- DL4: hop back restores traj focus; gate remains in URL
- DL5: no `.graphide/stamps/` writes

Screenshots: `verification/trajectory-deeplink.png`,
`verification/passport-deeplink.png`.

## Gotchas

- Deep-link is harness URL + in-memory state only. It does not mount live
  Architecture Delta or write stamps.
- A1a Trace host (`data-testid="trajectory-dag"`) and Passport product
  hooks stay unchanged; hop buttons are additive chrome.
- Prefer `ws=trace` or `ws=passport` with both fixture flags so either
  tab can paint immediately after boot.
