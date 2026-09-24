# Agent-native drive

An agent starts a Review derive, or reads a snapshot it already has, and learns which cuts are blocked. The command is the wait. It does not poll the desk.

## Sub-features

- `herd` in `extension/media/src/graph/herd.mjs` is the rail predicate. `desk.js` `herdRows` and `flowMark` call it.
- `node extension/scripts/herd.mjs --root <folder>` runs `graphide review` through `reviewArgv` and blocks until that process exits, then prints herd rows.
- `node extension/scripts/herd.mjs --snapshot <file>` reports the same rows now. `--focus` names the cut the exit code attends. `--skip` adds a host skip. It does not write a stamp.

## How to get to it (user POV)

1. From the repo, run `node extension/scripts/herd.mjs --root <folder> --no-parent`.
2. The process stays quiet on stdout until `graphide review` exits. Stderr carries progress when `--progress` is set.
3. Stdout is `{ rows, blocked, focus }`. Exit 0 means the focused cut is blocked, or any cut is blocked when `--focus` is omitted. Exit 3 means the herd settled and nothing attended is blocked.
4. To read a saved snapshot, pass `--snapshot` instead of `--root`. Stamp and Skip stay human.

## Driving it with the harness

```
node --test extension/scripts/herd-wait.test.mjs
```

The fixture `fixtures/herd/desk.json` is the explorer blocked desk: overview and control-flow idle, boot blocked, legacy done. `--focus boot` exits 0. `--focus overview` exits 3. `--root fixtures/demo --no-parent` runs the real CLI and exits 0 or 3 with a row list. Proof file `verification/herd-wait.txt`. `npm run verify` runs this test before the browser. No Extension Host. No `.graphide/stamps/` write.

## Gotchas

- `--flow` is a derive hint (`name=hit,hit`), not the focused cut. Focus is `--focus`.
- `--root` and `--snapshot` together are a usage error (exit 2).
- A finished derive has no `review · working` row. That row exists only while the desk progress strip is on.
- Session skips on a live desk are not in the Rust snapshot. Pass them with `--skip`.
