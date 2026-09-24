# Prefer herd

`graphide.review` opens Review on a folder. An always-on rule tells agents to read the herd and the report before grepping, once a Review graph is present. Not a second command, not a terminal, and not a stamp.

## Sub-features

- `reviewFolder` in `extension/src/extension.ts` is the handler for `graphide.review`. A folder Uri (explorer) or a file Uri (its parent) becomes `reviewRoot`. No argument uses `packageRoot()`.
- Explorer context menu reuses `graphide.review` when `explorerResourceIsFolder`. There is no `graphide.reviewFolder` command.
- The command focuses `graphide.reviewView`, then `runReview` passes `--root` as `this.reviewRoot || packageRoot()`.
- Always-on rule `.cursor/rules/prefer-herd.mdc` (`alwaysApply: true`) and skill `.cursor/skills/prefer-herd/SKILL.md`. When `live-snap.json`, a `graphide review --json` snapshot, or `#herd` is present, read `programs`, `flows`, `findings`, `coverage`, and `bubbles` before grep.
- Agents never stamp. This path does not call `writeStamp` and does not write `.graphide/stamps/`.

## How to get to it (user POV)

1. Install the VSIX. Open a workspace.
2. Command Palette → **Graphide: Review Workspace**, or right-click a folder in the explorer and choose the same command.
3. Flow Review focuses and derives that folder (`packageRoot` when the palette passes no folder).
4. An agent in Cursor loads the always-on rule and reads the review snapshot before searching the tree.

## Driving it with the harness

This surface is the extension manifest and the agent rule, not a webview control. The desk harness stays on Map.

```
node scripts/check-activation.js
```

That check writes `verification/plugins-packaging.md` and fails unless:

- `graphide.review` calls `reviewFolder`
- `runReview` uses `this.reviewRoot || packageRoot()`
- explorer context reuses `graphide.review` (`explorerResourceIsFolder`)
- no `graphide.reviewFolder` command
- `.cursor/rules/prefer-herd.mdc` is `alwaysApply: true` and names herd, report, and grep
- `.cursor/skills/prefer-herd/SKILL.md` says agents never stamp
- `reviewFolder` does not call `writeStamp`

`npm run package` still runs `check:package` and `check:activation`. The VSIX line in the proof is filled when `extension/graphide-*.vsix` is present.

## Gotchas

- Do not add a second review command. `packageRoot` remains the palette fallback.
- Do not rewrite the herd rail or layout resume. This path only chooses `--root` and focuses the existing view.
- Agents never stamp. Do not wire this command to `graphide.stamp`.
- Pass 4 (wait until blocked) is not this surface.
- Map stays community LOD. The rule does not change altitude.
