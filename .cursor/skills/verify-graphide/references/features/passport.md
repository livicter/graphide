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
Focus residual count: when Trace/Passport focus is set, sticky `#passportSign .passport-residual` scopes the badge/copy to the active focused path (`data-residual-scope="focus"` / `data-residual-focus` / `data-focus-residual-count`) while `data-residual-count` stays global (FC1–FC3). Trace legend mirrors the same focusN via LC1–LC3 (`.focus-residual` / `verification/trajectory-legend-focus-residual.png`).
Clear-focus cue: when sticky residual is focus-scoped, `.passport-clear-focus` / `[data-passport-clear-focus="1"]` clears Trace/Passport focus and restores global residual count (CF1–CF3). Screenshot `verification/passport-clear-focus-cue.png`.
Residual-filter mirror: sticky `#passportSign .passport-residual` carries `.passport-residual-filter-toggle` / `[data-passport-residual-filter-toggle="1"]` sharing Trace `trajResidualFilter` / `toggleTrajResidualFilter` (PM1–PM3). Host `data-residual-filter="on"` when pressed; gate paths mark `data-residual-bearing` from `passportResidualTrajIds`; non-bearing get `.residual-filtered` / `data-residual-filtered`. Passport `R`/`r` flips the same filter. Screenshot `verification/passport-residual-filter-mirror.png`. Leaving Passport/Trace for another desk clears the shared filter (WL1–WL3); Trace↔Passport hops keep sync. When filter ON and zero residual-bearing gate paths (gate approved), Passport shows residual-filter empty chrome (`.passport-residual-filter-empty` / `data-passport-residual-filter-empty`) with Clear residual filter (`data-residual-filter-clear`) (FE1–FE3); empty Clear `:focus-visible` ring matches sticky/legend clear chips (CFV1–CFV3). Screenshot `verification/residual-filter-clear-focus-visible.png`. Sticky residual-filter toggle (`.passport-residual-filter-toggle` / `data-passport-residual-filter-toggle`) uses the same ADE chrome `:focus-visible` outline themed to warning residual (TFV1–TFV3). Screenshot `verification/residual-filter-toggle-focus-visible.png`. When filter ON and residual-bearing gate paths exist, sticky residual shows a Clear-filter cue (`.passport-sticky-clear-filter` / `data-passport-clear-filter`) mirroring Trace legend CC (PCF1–PCF3). Screenshot `verification/passport-sticky-clear-filter.png`. When filter ON and residual-bearing gate paths exist, sticky also shows a residual-filter count cue (`.passport-residual-filter-count` / `data-residual-filter-count` / `data-filter-residual-count`) matching Trace legend N (RFC1–RFC3). Screenshot `verification/passport-residual-filter-count.png`. Dedicated polite aria-live `#residualFilterLive` / `[data-residual-filter-live]` announces filter on+N / off via `syncResidualFilterLive` (ALR1–ALR3); does not replace toast. While filter stays ON, Passport/Trace paint refreshes live-region N when bearings change without toggle (e.g. Approve) with no toast (LRP1–LRP3). Screenshot `verification/residual-filter-live-paint-refresh.png`. Passport Keys pressed-state proof parity: when residual filter ON on Passport, Keys R row mirrors pressed chrome via shared `syncKeysRRow` (PKP1–PKP3). Screenshot `verification/passport-keys-residual-pressed.png`. Escape clears residual filter when ON on Passport after chrome owners (Keys/Export/…) via `clearTrajResidualFilter` (ESC1–ESC3). Screenshot `verification/residual-filter-escape-clear.png`. When filter ON + bearings, sticky residual-filter count chip is keyboard-reachable (`tabindex="0"` `role="status"`) with warning-themed `:focus-visible` (CCF1–CCF3); Enter/Space does not clear. Screenshot `verification/residual-filter-count-chip-focus.png`. When filter ON, sticky count chip uses pressed/ON chrome matching the residual-filter toggle inset/28% mix (FHP1–FHP3); sticky host `data-residual-filter="on"` uses the same warning outline cue as Trace legend (HOP1–HOP3; ON inset removed). Screenshot `verification/residual-filter-count-host-parity.png`. Host ON cue cross-parity proof `verification/residual-filter-host-on-cue-parity.png`. Clear-filter chips (sticky `.passport-sticky-clear-filter` / empty `.residual-filter-clear`) get themed `:active`/`.press` flash — darker hoverBackground mix + inset 1px — beyond global scale (CAF1–CAF3). Proof `verification/residual-filter-clear-active-flash.png`. Sticky residual-filter count chip toasts a non-clearing hint on Enter/Space/click (`flashToast` skip) without clearing (CCT1–CCT3). Proof `verification/residual-filter-count-chip-toast-hint.png`. Clear-filter chips (sticky `.passport-sticky-clear-filter` / empty `.residual-filter-clear`) toast `Residual filter cleared` (ok) on activate — distinct from Escape `Residuals off` (CLT1–CLT3). Proof `verification/residual-filter-clear-confirm-toast.png`. Sticky residual-filter toggle (`.passport-residual-filter-toggle` / `data-passport-residual-filter-toggle`) gets themed `:active`/`.press` flash — darker warning residual mix + inset 1px — beyond global scale (TAF1–TAF3). Proof `verification/residual-filter-toggle-active-flash.png`. After clear-chip activate (sticky `.passport-sticky-clear-filter` / empty `.residual-filter-clear`), focus returns to the Passport residual-filter toggle still present when OFF (CFR1–CFR3); Escape unchanged. Proof `verification/residual-filter-clear-focus-return.png`. Residual-filter count chips (`.residual-filter-count` / `.passport-residual-filter-count`) get themed `:active`/`.press` flash — darker warning residual mix + inset 1px, darker than FHP 28% resting — beyond global scale (CNA1–CNA3). Proof `verification/residual-filter-count-active-flash.png`. Keys R residual-bound row (`#keysPane li[data-keys-row="r"]`) gets themed `:active`/`.press` flash — darker warning mix + inset 1px — distinct from KP resting ON (KAF1–KAF3). Proof `verification/keys-r-active-flash.png`. Residual-filter count chips get a subtle warning `:hover` lift above FHP 28% with `cursor:help` — informational vs Clear (CHC1–CHC3). Proof `verification/residual-filter-count-hover-cue.png`. Sticky residual-filter toggle gets a warning `:hover` lift above ON 28% (42% mix) with `cursor:pointer` — activatable, distinct from CHC count help and Clear blue (THC1–THC3). Proof `verification/residual-filter-toggle-hover-cue.png`.


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
- FC1–FC3: focus-scoped residual count on sticky `#passportSign` (`.passport-residual` / `data-residual-scope="focus"` / `data-residual-focus` / `data-focus-residual-count`); screenshot `verification/passport-focus-residual-count.png`
- CF1–CF3: sticky clear-focus cue (`.passport-clear-focus` / `data-passport-clear-focus`) restores `data-residual-scope="global"` + global residual count; screenshot `verification/passport-clear-focus-cue.png`
- PM1–PM3: residual-filter mirror on sticky `#passportSign` (`.passport-residual-filter-toggle` / `data-passport-residual-filter-toggle` / shared `trajResidualFilter`); gate paths `data-residual-bearing` / `.residual-filtered`; Passport `R` flips same filter; screenshot `verification/passport-residual-filter-mirror.png`
- WL1–WL3: residual-filter clear-on-ws-leave — leave Passport/Trace for Map/Slice/etc. clears shared `trajResidualFilter`; Trace↔Passport hops keep it; screenshot `verification/residual-filter-ws-leave.png`
- FE1–FE3: residual-filter empty chrome — filter ON + zero residual-bearing paths shows `.passport-residual-filter-empty` / `data-passport-residual-filter-empty` + Clear affordance; screenshot `verification/residual-filter-empty.png`
- CFV1–CFV3: empty chrome Clear residual filter keyboard focus shows CC/PCF-matching `:focus-visible` outline; screenshot `verification/residual-filter-clear-focus-visible.png`
- TFV1–TFV3: sticky residual-filter toggle keyboard focus shows warning-themed `:focus-visible` outline (1px / offset 1px); Trace legend toggle mirrors; screenshot `verification/residual-filter-toggle-focus-visible.png`
- PCF1–PCF3: sticky clear-filter cue — filter ON + bearings shows `#passportSign .passport-residual` `.passport-sticky-clear-filter` / `data-passport-clear-filter="1"` (no empty chrome); click clears via `clearTrajResidualFilter`; screenshot `verification/passport-sticky-clear-filter.png`
- RFC1–RFC3: residual-filter count chip — filter ON + bearings shows sticky `.passport-residual-filter-count` / `data-residual-filter-count` / `data-filter-residual-count` paired with Trace legend; OFF/empty hides; screenshot `verification/passport-residual-filter-count.png`
- ALR1–ALR3: dedicated residual-filter aria-live — `#residualFilterLive[data-residual-filter-live]` announces on+N / off; toast unchanged; screenshot `verification/residual-filter-aria-live.png`
- LRP1–LRP3: residual-filter live count paint refresh — filter ON + Approve/paint updates live N without toast; OFF stays off across paint; screenshot `verification/residual-filter-live-paint-refresh.png`
- PKP1–PKP3: Passport Keys pressed-state proof — residual ON → Keys R `data-keys-r-pressed="1"` / `aria-pressed="true"` / `on`+`pressed` + residual-filter binding; OFF / Map leave clears; screenshot `verification/passport-keys-residual-pressed.png`
- ESC1–ESC3: Escape clears residual filter when ON on Passport (after Keys/Export/chrome owners); OFF no-op; screenshot `verification/residual-filter-escape-clear.png`
- CCF1–CCF3: sticky residual-filter count chip keyboard focus (`tabindex="0"` `role="status"` + warning `:focus-visible`); Trace legend mirrors; Enter/Space no clear; screenshot `verification/residual-filter-count-chip-focus.png`
- FHP1–FHP3: sticky residual-filter count chip pressed/ON visual parity with toggle (inset + 28% warning mix) when `.passport-residual[data-residual-filter=on]`; Trace legend mirrors; screenshot `verification/residual-filter-count-host-parity.png`
- HOP1–HOP3: Trace↔Passport residual-filter host ON cue cross-parity — shared warning outline 1px / offset 2px on `.passport-residual` + `#trajEdgeLegend` when `data-residual-filter=on` (Passport ON inset removed); screenshot `verification/residual-filter-host-on-cue-parity.png`
- CAF1–CAF3: clear-filter `:active`/`.press` flash parity — sticky clear + empty Clear themed darker hoverBackground mix + inset 1px beyond global scale; screenshot `verification/residual-filter-clear-active-flash.png`
- CCT1–CCT3: sticky residual-filter count chip Enter/Space/click non-clearing toast hint (filter stays ON); screenshot `verification/residual-filter-count-chip-toast-hint.png`
- CLT1–CLT3: clear-chip confirm toast — sticky/empty Clear → `Residual filter cleared` (ok); Escape keeps `Residuals off`; screenshot `verification/residual-filter-clear-confirm-toast.png`
- TAF1–TAF3: residual-filter toggle `:active`/`.press` flash parity — sticky toggle themed darker warning mix + inset 1px beyond global scale (OFF and ON); Trace legend mirrors; screenshot `verification/residual-filter-toggle-active-flash.png`
- CFR1–CFR3: clear-chip focus return — after sticky/empty Clear, focus moves to `#passportSign [data-passport-residual-filter-toggle]`; Trace legend mirrors; Escape unchanged; screenshot `verification/residual-filter-clear-focus-return.png`
- CNA1–CNA3: residual-filter count-chip `:active`/`.press` flash parity — sticky count chip themed darker warning mix + inset 1px beyond FHP resting; Trace legend mirrors; screenshot `verification/residual-filter-count-active-flash.png`
- KAF1–KAF3: Keys R residual-bound `:active`/`.press` flash parity — darker warning mix + inset 1px distinct from KP resting ON; Trace/Passport Keys mirror; screenshot `verification/keys-r-active-flash.png`
- CHC1–CHC3: residual-filter count-chip `:hover` cue — sticky warning lift above FHP 28% + `cursor:help` (Trace legend mirrors); screenshot `verification/residual-filter-count-hover-cue.png`
- THC1–THC3: residual-filter toggle `:hover` cue — sticky warning lift above ON 28% (42%) + `cursor:pointer` (Trace legend mirrors); screenshot `verification/residual-filter-toggle-hover-cue.png`
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
  `.passport-adj-residual-cue`, `[data-residual-scope]`, `[data-residual-focus]`,
  `[data-focus-residual-count]`, `[data-passport-clear-focus]`, `.passport-clear-focus`,
  `[data-passport-residual-filter-toggle]`, `.passport-residual-filter-toggle`,
  `[data-residual-bearing]`, `[data-residual-filtered]`, `.residual-filtered`,
  residual-filter clear-on-ws-leave (`ADE_RESIDUAL_WS` in `setWorkspace`), residual-filter empty chrome (`renderResidualFilterEmptyChrome` / `clearTrajResidualFilter`), sticky clear-filter cue (`data-passport-clear-filter` / `.passport-sticky-clear-filter` when ON + bearings) are the product hooks. (Trace may use `data-testid="trajectory-dag"` — that
  is A1a, not Passport.)
- Digit keys stay 1–9 on the first nine workspaces. Passport is click-only.
- Semantic impact is a stub. Do not mount live Architecture Delta here.
- `#passportDeltaVocab` is vocabulary/copy only. Do not wire it to
  `architecture_delta`, `delta-snap.json`, or `#deltaCanvas`.
- Product hooks for the vocab stub: `#passportDeltaVocab`,
  `[data-vocab-chip]`, `[data-impact-region]`. Keep sibling Delta tab.
