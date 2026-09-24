# Agent herd

One Node command starts a Review cut and waits until that cut is blocked. It calls the desk herd predicate. It does not stamp, and it does not add a terminal or a worktree list.

## Sub-features

- `scripts/agent-herd.mjs` spawns `graphide review --root <dir> --json --progress` (optional `--no-parent` / `--parent`), the same argv shape as `runReview` in `extension/src/extension.ts`.
- `--snap <file>` reads a snapshot instead of spawning, for the blocked and settled fixtures.
- Rows come from `herdCuts` in `extension/media/src/graph/herd.js`. The desk rail calls that module (`herdCuts` in `extension/media/src/graph/desk.js`). States stay working, blocked, idle, done.
- `--focus <flow>` is the cut under wait. Omitted, the focus is the default run (`control-flow`, else `overview`, else the first flow).
- `--wait` exits 0 when that cut is blocked and 2 when the review has settled and the cut is not blocked.
- `--stamp` is refused. The process never spawns `graphide stamp` and never writes `.graphide/stamps/`.

## How to get to it (user POV)

1. Build the CLI (`cargo build -p graphide-cli`).
2. `node scripts/agent-herd.mjs --root <folder> --wait`
3. Read the rows. Exit 0 means the focused cut needs a human. Exit 2 means the review settled and that cut is working, idle, or done.
4. Stamp stays on the desk, for a person.

## Driving it with the harness

`npm run verify` runs this before Chromium:

```
node scripts/agent-herd.mjs --snap fixtures/herd/blocked.json --focus boot --wait --json
node scripts/agent-herd.mjs --snap fixtures/herd/settled.json --focus control-flow --wait --json
node scripts/agent-herd.mjs --root fixtures/demo --no-parent --wait --json
```

Driver assertions:

- blocked fixture, focus `boot`: exit 0, status `blocked`
- settled fixture, focus `control-flow`: exit 2, state `done`
- focused open cut on the blocked fixture: exit 2, state `working`
- the two fixtures together emit working, blocked, idle, and done
- `--stamp` exits 1
- `fixtures/demo` goes through real `graphide review`; exit is 0 or 2 and matches the focused state
- proof file `verification/agent-herd.md`
- `.graphide/stamps/` stays absent

## Gotchas

- Exit 0 is the blocked wait, not "review failed". Exit 1 is a bad argument or a failed derive. Exit 2 is settled and not blocked.
- Do not reimplement the predicate in Rust. The desk and this command share `herd.js`.
- Program rows are working or idle. Only a flow cut can be blocked.
- Map LOD is unchanged. This command does not paint the desk.
