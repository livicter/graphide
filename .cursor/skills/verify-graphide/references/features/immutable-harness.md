# Immutable Harness

ADE Phase 1.3 sealed specification gate. Core assert sources and feature
maps are SHA-256 locked so an agent make-green loop cannot silently
rewrite or disable them. Not a Docker/Wasm sandbox and not live
filesystem write interception.

## Sub-features

- Sealed lock `.cursor/skills/verify-graphide/references/immutable-specs.lock`
  (`# seal-sha256:` over sorted `hash  path` entries).
- Checker `extension/scripts/check-immutable-specs.js` — default verify-only.
- Human-only regeneration: `--write` requires `ADE_ALLOW_SPEC_MUTATION=1`
  or `--allow-spec-mutation`. Verify mode never soft-skips on that env.
- Protected core: `package.json`, `extension/scripts/check-map.js`,
  `extension/scripts/check-immutable-specs.js`, `scripts/verify-graphide.js`,
  this feature map, plus every `*.md` under
  `.cursor/skills/verify-graphide/references/features/`.
- Product agent surface `extension/media/**` is intentionally unlocked.
- `npm run verify` runs immutable verify + self-test + `check-map` before
  Playwright `scripts/verify-graphide.js`.
- Visible `#adeSealChip` / `.ade-seal-chip` status chrome on Trace `.traj-strip`
  and Passport `.ade-hop-row` mirrors `classifyWrite` vocabulary
  (`sealed` | `open`/`agent` | `unlock`) via `window.__graphideSealStatus` /
  `?seal=` — display-only fixture stub, not live Docker/Wasm FS. Dedicated
  `:hover` seal-tint lift + `cursor:help` and matching `title` /
  `aria-label` / `data-seal-info` with current seal state (SCH1–SCH3); proof
  `verification/seal-chip-hover-cue.png`.

## How to get to it (user POV)

1. From repo root run `npm run verify:immutable` (or `npm run verify`).
2. A clean tip prints `Immutable specs OK (N files).`
3. Inspect `.cursor/skills/verify-graphide/references/immutable-specs.lock`.
4. Intentional human spec update only:
   `ADE_ALLOW_SPEC_MUTATION=1 npm run immutable:write`

## Driving it with the harness

```
node extension/scripts/check-immutable-specs.js
node extension/scripts/check-immutable-specs.js --self-test
npm run verify
# Desk seal chip (fixture):
# /scripts/webview-harness.html?trace=1&passport=1&seal=sealed&probe=0&ws=trace
```

Driver / script assertions (I1–I5):

- I1: clean tree passes immutable verify
- I2: `--self-test` detects tamper on a temp copy of `check-map.js`
- I3: missing protected file fails verify
- I4: unlocked new feature map under `references/features/` fails verify
- I5: `package.json` `scripts.verify` invokes immutable check before
  `check-map` and `verify-graphide.js`

Desk seal status chip (SC1–SC3):

- SC1: Trace strip shows `#adeSealChip` with `data-seal-state` matching seed
  (`?seal=` / `window.__graphideSealStatus`)
- SC2: Passport hop row shows the same chip adjacent to gate chrome; passport
  approve/reject gate remains separate
- SC3: proof `verification/seal-status-chip.png` is non-black; flipping seed
  re-paints chip without stamps
- SCH1–SCH3: `#adeSealChip` / `.ade-seal-chip` gets seal-tinted `:hover` lift above
  resting 16% (`--ade-seal` 34% mix + border/box-shadow) with `cursor:help`
  across sealed/open/unlock; matching `title` + `aria-label` + `data-seal-info`
  include current state label (SEALED|OPEN|UNLOCK); role=status; no tabindex;
  display-only (no click→`setSealStatus`). Proof
  `verification/seal-chip-hover-cue.png`

## Gotchas

- Never use `--write` to make an agent change green — that is a human
  unlock for intentional spec edits.
- Lock entries are exact paths (no globs). New feature maps need a human
  `--write` after they land.
- Product-path write policy stub lives beside this seal: see
  [fs-sandbox.md](fs-sandbox.md) (`--gate-write`) and the agent
  [write-bus.md](write-bus.md) (`agent-write-bus.js`). Still not Docker/Wasm
  or an OS-level interceptor; required CI / branch protection deferred.
- Local shells can still invoke `node scripts/verify-graphide.js` alone;
  `npm run verify` is the agent make-green path that includes the seal.
- `#adeSealChip` is display-only chrome mirroring classifyWrite vocabulary;
  it does not call Node or mutate the lock from the webview.
