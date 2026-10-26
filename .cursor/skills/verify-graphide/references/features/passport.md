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
- Architecture Delta vocabulary stub `#passportDeltaVocab[data-delta-stub="1"]`
  inside `#passportImpact`. Names closed IR labels:
  status chips (`Added|Removed|Changed|Moved|Rerouted`),
  class chips (`Semantic|Topology|Presentation`),
  cluster chips (`Stable|Split|Merge|Relabel|Added|Removed`),
  and impact regions (`[data-impact-region="structural|impact|community"]`).
  Fixture-only copy — never mounts `#deltaCanvas` / live Delta workspace.
- Richer simulation rows (v2 fixture): architecture targets carry
  `[data-passport-layer]` + optional `[data-passport-delta]` /
  `[data-cluster-kind]` chips and a `.passport-row-impact` note;
  API contracts carry `[data-passport-delta-class]` +
  `[data-passport-breaking]`; risks expose
  `[data-passport-mitigation]` / `[data-passport-blast]`; tests expose
  `[data-passport-fixture]` / `[data-passport-covers]`. Impact cards
  render structured `[data-impact-row]` entries with Delta status/class
  chips (strings still accepted).
- Engine: embedded `PASSPORT_FIXTURE` in desk.js, overridable by
  `window.__graphidePassport` when `isPassport()` passes (harness
  `?passport=1` loads `passport-fixture.json`). Impact may carry
  `impact.deltaVocab`; desk falls back to `DELTA_VOCAB_DEFAULT`.

## How to get to it (user POV)

1. Review a folder (or open the explorer harness). The desk lands on
   Overview.
2. Click **Passport** (`#workspaces [data-ws="passport"]`).
3. You should see the fixture Plan Passport: gate banner (pending /
   blocked paths), architecture targets (layer + delta chips),
   contracts (class + breaking), risks (mitigation/blast), test
   strategy (fixture/covers), a semantic impact stub with structured
   rows, and the Architecture Delta vocabulary strip.
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
- `#passportDeltaVocab[data-delta-stub="1"]` shows status/class/cluster
  chips and `[data-impact-region]` rows; no `#deltaCanvas` under Passport
- `#passportGate[data-passport-state="pending"]` shows blocked paths
- Approve flips state to `approved` and clears `data-blocked`
- screenshots `verification/passport.png`,
  `verification/passport-delta-vocab.png`, and
  `verification/passport-fixtures.png` are not black frames
- PF1–PF5: richer architecture/API/risk/test/impact row hooks
- `.graphide/stamps/` is still empty

## Gotchas
- Trace↔Passport context hops: see [trace-passport-deeplink.md](trace-passport-deeplink.md) (`?traj=` / `?gate=` / `data-ade-hop`).


- Passport is the ADE upstream sign-off gate. Trace (A1a) is the cognition
  DAG. Delta is parent vs head. Do not merge them.
- Fixture-only in v0. Do not invent a live agent write bus on Passport; the consultable stub lives in [write-bus.md](write-bus.md).
- Immutable verification harness is a later Phase 1 slice — out of scope.
- Do not add `data-testid` / `data-component` on the Passport page.
  `[data-ws="passport"]`, `#passportPage`, `#passportGate`, `#passportSign`,
  `#passportImpact`, `#passportDeltaVocab`, `[data-passport-action]`,
  `[data-passport-path]`, `[data-passport-layer]`, `[data-passport-delta]`,
  `[data-passport-delta-class]`, `[data-passport-breaking]`,
  `[data-passport-mitigation]`, `[data-passport-blast]`,
  `[data-passport-fixture]`, `[data-passport-covers]`, `[data-impact-row]`,
  `[data-vocab-chip]`, `[data-impact-region]` are the product hooks. (Trace may use `data-testid="trajectory-dag"` — that
  is A1a, not Passport.)
- Digit keys stay 1–9 on the first nine workspaces. Passport is click-only.
- Semantic impact is a stub. Do not mount live Architecture Delta here.
- `#passportDeltaVocab` is vocabulary/copy only. Do not wire it to
  `architecture_delta`, `delta-snap.json`, or `#deltaCanvas`.
- Product hooks for the vocab stub: `#passportDeltaVocab`,
  `[data-vocab-chip]`, `[data-impact-region]`. Keep sibling Delta tab.
