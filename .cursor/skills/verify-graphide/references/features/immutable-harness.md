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
```

Driver / script assertions (I1–I5):

- I1: clean tree passes immutable verify
- I2: `--self-test` detects tamper on a temp copy of `check-map.js`
- I3: missing protected file fails verify
- I4: unlocked new feature map under `references/features/` fails verify
- I5: `package.json` `scripts.verify` invokes immutable check before
  `check-map` and `verify-graphide.js`

## Gotchas

- Never use `--write` to make an agent change green — that is a human
  unlock for intentional spec edits.
- Lock entries are exact paths (no globs). New feature maps need a human
  `--write` after they land.
- This slice does not provide Docker/Wasm isolation, live agent write
  interception, or required CI status / branch protection.
- Local shells can still invoke `node scripts/verify-graphide.js` alone;
  `npm run verify` is the agent make-green path that includes the seal.
