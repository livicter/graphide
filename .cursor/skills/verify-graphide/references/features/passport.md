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
- Impact-row chrome (IR1–IR3): each structured row is
  `.passport-impact-row` with `.passport-impact-head` (chips + label) and
  sibling `.passport-impact-detail` collapsed by default via
  `data-impact-expanded="false"` / `aria-expanded="false"`; click or
  Enter/Space expands. Hover/focus-visible highlight. String items use
  `.passport-impact-row--static` (no expand). Screenshot
  `verification/passport-impact-rows.png`.
- Contract/risk → Trace traj mapping (CX1–CX3; ids avoid cancel CR1):
  optional fixture `traj` on contracts/risks; mapped rows carry
  `data-ade-traj` + `data-ade-contract-traj` / `data-ade-risk-traj` and
  reuse `data-ade-traj-hop` Open in Trace (`resolvePassportTrajId` /
  `hopAdeTraj`). Unmapped rows omit the hop. Screenshot
  `verification/passport-risk-traj-map.png`.
- Test-strategy → Trace traj mapping (TM1–TM3; ids avoid TS1/TS2 typescript desk):
  optional fixture `traj` on `testStrategy` rows; mapped rows carry
  `data-ade-traj` + `data-ade-test-traj` and reuse `data-ade-traj-hop`
  Open in Trace. Unmapped rows omit the hop. Screenshot
  `verification/passport-test-strategy-traj-map.png`.

- Empty-state (PE1–PE3): when the fixture has no plan rows
  (`targets/contracts/risks/testStrategy/gatedWrites` empty, or
  `?passportEmpty=1` / `PASSPORT_EMPTY_FIXTURE`), `#passportPage` shows
  `.passport-empty[data-passport-empty-chrome]` desk chrome (copy +
  Open Trace hop) instead of blank sections. Proof
  `verification/passport-empty-state.png`.
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

Empty chrome: `?passport=1&passportEmpty=1&ws=passport` (or
`PASSPORT_EMPTY_FIXTURE` / `window.__graphidePassport` with empty arrays).

Contract/risk traj map: `?trace=1&passport=1&gate=approved&ws=passport`
then click `[data-ade-contract-traj] [data-ade-traj-hop]` /
`[data-ade-risk-traj] [data-ade-traj-hop]` (CX1–CX3).

Test-strategy traj map: same harness; click
`[data-ade-test-traj] [data-ade-traj-hop]` (TM1–TM3).
Residual / incomplete-signoff cue: sticky `#passportSign .passport-residual` (PR1–PR3) shows blocked/open path count while scrolling.
Hop residual badge: each `#passportGate .passport-gate-path` carries `.passport-hop-residual` (HB1–HB3) per-hop incomplete/blocked/open cue.
Adjacent residual: when a Trace traj is focused, neighboring Passport gate paths that still have residual carry `.passport-adj-residual` / `data-passport-adj-residual` (AR1–AR3). Trace legend mirrors residual-adjacent node kinds via AL1–AL3 (`verification/trajectory-adj-residual-legend.png`).


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
- GS1–GS3: Sticky Decision Rail — `#passportGate` / `#passportSign` stay readable while scrolling; filled `data-gate-chip`; `.passport-gate-summary` + `.passport-sign-actions`; screenshot `verification/passport-gate-signoff.png`
- IR1–IR3: impact-row head/detail hierarchy + expand/hover; static string fallback; screenshot `verification/passport-impact-rows.png`
- PE1–PE3: empty fixture shows `.passport-empty` chrome + Open Trace hop; screenshot `verification/passport-empty-state.png`
- CX1–CX3: contract/risk `traj` → Open in Trace; screenshot `verification/passport-risk-traj-map.png`
- TM1–TM3: test-strategy `traj` → Open in Trace; screenshot `verification/passport-test-strategy-traj-map.png`
- PR1–PR3: sticky `#passportSign` residual / incomplete-signoff cue (`.passport-residual` / `data-passport-residual` / `data-residual-count`); screenshot `verification/passport-residual-chrome.png`
- HB1–HB3: per-hop residual badge on `#passportGate .passport-gate-path` (`.passport-hop-residual` / `data-passport-hop-residual` / `data-hop-residual-state`); screenshot `verification/passport-hop-residual-badge.png`
- AR1–AR3: traj-hop adjacent residual cue on residual neighbor gate paths (`.passport-adj-residual` / `data-passport-adj-residual` / `.passport-adj-residual-cue`) + Trace neighbor `data-traj-adj-residual`; screenshot `verification/passport-traj-adjacent-residual.png`
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
  `[data-impact-expanded]`, `.passport-impact-head`, `.passport-impact-detail`,
  `.passport-impact-row--static`, `[data-ade-contract-traj]`, `[data-ade-risk-traj]`,
  `[data-vocab-chip]`, `[data-impact-region]`, `[data-passport-adj-residual]`,
  `.passport-adj-residual-cue` are the product hooks. (Trace may use `data-testid="trajectory-dag"` — that
  is A1a, not Passport.)
- Digit keys stay 1–9 on the first nine workspaces. Passport is click-only.
- Semantic impact is a stub. Do not mount live Architecture Delta here.
- `#passportDeltaVocab` is vocabulary/copy only. Do not wire it to
  `architecture_delta`, `delta-snap.json`, or `#deltaCanvas`.
- Product hooks for the vocab stub: `#passportDeltaVocab`,
  `[data-vocab-chip]`, `[data-impact-region]`. Keep sibling Delta tab.
