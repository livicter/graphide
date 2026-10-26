# FS Sandbox Stub

ADE Phase 1 product-path write interception stub. Agents consult the same
sealed allowlist as the immutable checker before mutating specs. Not
Docker/Wasm isolation and not a live OS filesystem interceptor.

## Sub-features

- `--gate-write <path>` on `extension/scripts/check-immutable-specs.js`
  classifies a repo-relative (or absolute-in-repo) path and exits 0/1.
- Policy classes: `agent` (allowed), `sealed` (denied), `unlock` (allowed
  only with `ADE_ALLOW_SPEC_MUTATION=1` / `--allow-spec-mutation`).
- Sealed set = immutable protected core + every feature map under
  `.cursor/skills/verify-graphide/references/features/` + the lock file
  `.cursor/skills/verify-graphide/references/immutable-specs.lock`.
- Agent-writable product surface: `extension/media/**` stays editable
  without unlock (ADE product UI).
- Paths outside the sealed set (fixtures, `verification/**`, etc.) classify
  as `agent` for this stub.
- Human unlock for intentional sealed mutation remains
  `ADE_ALLOW_SPEC_MUTATION=1 … --write --allow-spec-mutation`.

## How to get to it (user POV)

1. From repo root, ask whether a path is writable under the agent policy:
   `node extension/scripts/check-immutable-specs.js --gate-write path/to/file`
2. Denied sealed writes print a JSON decision on stderr and exit 1.
3. Allowed writes print JSON on stdout and exit 0.
4. Product UI edits under `extension/media/` stay green without unlock.

## Driving it with the harness

```
node extension/scripts/check-immutable-specs.js --gate-write \
  .cursor/skills/verify-graphide/references/features/immutable-harness.md
node extension/scripts/check-immutable-specs.js --gate-write \
  extension/media/main.js
ADE_ALLOW_SPEC_MUTATION=1 node extension/scripts/check-immutable-specs.js \
  --gate-write package.json
npm run verify
```

Driver / script assertions (I6–I8):

- I6: `--gate-write` denies a sealed feature map without unlock
- I7: `--gate-write` allows `extension/media/main.js` without unlock
- I8: `--gate-write` allows a sealed path when `ADE_ALLOW_SPEC_MUTATION=1`

## Gotchas

- This is a consultable stub (CLI / `require` classifyWrite), not an
  in-process `fs.writeFile` monkey-patch or container sandbox.
- Make-green agents must call the gate (or hit the post-hoc seal) rather
  than rewrite sealed specs; `--write` is still human-only.
- New feature maps join the sealed set automatically once present on disk
  and locked via human `--write`.
- Docker/Wasm isolation and required CI branch protection stay deferred.
- Agent writes that need a consultable apply path use
  [write-bus.md](write-bus.md) (`proposeWrite` / `--out` / `--apply`).
