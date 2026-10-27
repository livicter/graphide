# Agent Write-Bus Stub

ADE Phase 1 consultable write path. Agents route purported writes through
`classifyWrite` (same sealed allowlist as `--gate-write`) before any bytes
land. Not Docker/Wasm and not a Node `fs` monkey-patch.

## Sub-features

- CLI `extension/scripts/agent-write-bus.js --path <rel>` classifies via
  `classifyWrite` and exits 0/1 with a JSON `WriteResult`.
- Optional apply: `--out <abs-scratch>` writes allowed content to a scratch
  file; `--apply` writes to the repo path. Default is consult-only.
- Content via `--content <str>` or `--stdin`. Denied paths never create
  `--out` / `--apply` targets.
- Reuses FS sandbox policy classes: `agent`, `sealed`, `unlock`
  (`ADE_ALLOW_SPEC_MUTATION=1` / `--allow-spec-mutation`).
- `extension/media/**` stays agent-writable without unlock.
- Exported `proposeWrite({ path, content, out, apply, dryRun, allow })`
  for require()-based callers.

## How to get to it (user POV)

1. Classify a purported write without touching disk:
   `node extension/scripts/agent-write-bus.js --path path/to/file --dry-run`
2. Prove an allowed write into a scratch file:
   `node extension/scripts/agent-write-bus.js --path extension/media/main.js \
     --content 'ok' --out /tmp/graphide-write-bus-out`
3. Denied sealed writes print JSON on stderr, exit 1, and leave `--out`
   absent.

## Driving it with the harness

```
node extension/scripts/agent-write-bus.js --path \
  .cursor/skills/verify-graphide/references/features/immutable-harness.md \
  --content x --out "$TMP/deny-out"
node extension/scripts/agent-write-bus.js --path extension/media/main.js \
  --content x --out "$TMP/media-out"
ADE_ALLOW_SPEC_MUTATION=1 node extension/scripts/agent-write-bus.js \
  --path package.json --content x --out "$TMP/unlock-out"
npm run verify
```

Driver / script assertions (I9–I11):

- I9: write-bus denies sealed path; `--out` file is not created
- I10: write-bus allows `extension/media/**`; `--out` receives content
- I11: write-bus allows sealed path with `ADE_ALLOW_SPEC_MUTATION=1`;
  `--out` receives content

## Gotchas

- This is a consultable bus, not a live OS interceptor or in-process
  `fs.writeFile` patch. Callers must use the bus (or `--gate-write`).
- Prefer `--out` in verify drivers so the repo tree stays untouched.
- `--apply` is for deliberate agent product writes; sealed paths still
  need human unlock.
- Docker/Wasm isolation and required CI branch protection stay deferred.
