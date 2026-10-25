# Plan Passport

Fixture-backed upstream Plan Passport (ADE Phase 1.2). High-level
architecture targets, interfaces, breaking-change risk, and test strategy
must be signable before agent-style file writes. Not a live agent wire,
not Trace (A1a Trajectory DAG), and not Architecture Delta (impact panel
is a stub that reuses Delta vocabulary only).

## Sub-features

- Workspace tab `#workspaces [data-ws="passport"]`. Same explorer nav
  row as Trace — not a second chrome row. Click-only (no digit key;
  keys 1–9 stay the first nine workspaces).
- Page `#passportPage` with sections `data-passport="targets|contracts|risks|tests|impact"`.
- Gate banner `#passportGate[data-passport-state]` (`pending` / `approved` /
  `rejected`) listing `#passportGate [data-passport-path]` (blocked via
  `data-blocked="1"` until Approve).
- Sign-off `#passportSign` with `[data-passport-action="approve"]` /
  `[data-passport-action="reject"]`. Gate state is in-memory only —
  never writes `.graphide/stamps/`.
- Semantic impact stub `#passportImpact` — fixture call graphs / API
  contracts / invariants text. Does not mount Architecture Delta.
- Engine: embedded `PASSPORT_FIXTURE` in desk.js, overridable by
  `window.__graphidePassport` when `isPassport()` passes (harness
  `?passport=1` loads `passport-fixture.json`).

## How to get to it (user POV)

1. Review a folder (or open the explorer harness). The desk lands on
   Overview.
2. Click **Passport** (`#workspaces [data-ws="passport"]`).
3. You should see the fixture Plan Passport: gate banner (pending /
   blocked paths), architecture targets, contracts, risks, test
   strategy, and a semantic impact stub.
4. Click **Approve** to unlock gated write paths (fixture only), or
   **Reject** to keep them blocked. Stamp / Skip remain human
   attestation for flows — they are not this gate.

The in-tree proof is the embedded fixture (`passport-ade-phase-1.2`).

## Driving it with the harness

```
extension/scripts/webview-harness.html?passport=1&probe=0&ws=passport
```

`passport=1` fetches `passport-fixture.json` into
`window.__graphidePassport` (falls back to the embedded fixture if the
JSON is missing or invalid). It does **not** require a ReviewSnapshot snap
from rust. The default explorer harness also works: click
`[data-ws="passport"]` after boot.

Driver assertions:

- `#workspaces [data-ws="passport"]` is on
- `#passportPage` mounts with targets / contracts / risks / tests /
  `#passportImpact`
- `#passportGate[data-passport-state="pending"]` shows blocked paths
- Approve flips state to `approved` and clears `data-blocked`
- screenshot `verification/passport.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- Passport is the ADE upstream sign-off gate. Trace (A1a) is the cognition
  DAG. Delta is parent vs head. Do not merge them.
- Fixture-only in v0. Do not invent a live agent write bus here.
- Immutable verification harness is a later Phase 1 slice — out of scope.
- Do not add `data-testid` / `data-component` on the Passport page.
  `[data-ws="passport"]`, `#passportPage`, `#passportGate`, `#passportSign`,
  `#passportImpact`, `[data-passport-action]`, `[data-passport-path]` are
  the product hooks. (Trace may use `data-testid="trajectory-dag"` — that
  is A1a, not Passport.)
- Digit keys stay 1–9 on the first nine workspaces. Passport is click-only.
- Semantic impact is a stub. Do not mount live Architecture Delta here.
