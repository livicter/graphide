# Plugin packaging

The installed extension opens Review on a folder through the existing
`graphide.review` command. `packageRoot()` calls `reviewFolder`: a
configured `graphide.packageRoot` wins, otherwise the first workspace
folder. There is no second chrome and no Extension Host in CI.

## Sub-features

- `reviewFolder` in `extension/src/review-folder.ts` is the folder
  decision. `packageRoot()` in `extension/src/extension.ts` is the only
  caller. `graphide.review` runs `runReview()`, which derives
  `graphide review --root <that folder>`.
- Activation stays `onCommand:graphide.review` and
  `onView:graphide.reviewView`. Core Review does not need an LLM key.
- Always-on agent rule `.cursor/rules/prefer-herd.mdc`
  (`alwaysApply: true`), referenced from `AGENTS.md`. Prefer the herd
  rail and the Review graph over raw grep when they are present.
  Agents never stamp.

## How to get to it (user POV)

1. Install the VSIX (Graphide activity bar, or **Graphide: Install
   (one click)** from the Graphide source repo).
2. Open the folder to review.
3. Run **Graphide: Review Workspace** (`graphide.review`). The desk
   derives that folder. Empty `graphide.packageRoot` means the open
   workspace. A set package root reviews that path instead.
4. An agent in the folder reads `AGENTS.md` and `prefer-herd`. It
   uses the herd rail and the Review graph before grep.

## Driving it with the harness

`npm run package` compiles the extension, writes the VSIX, then
`scripts/check-activation.js`. That script loads
`extension/out/review-folder.js` and checks:

```
reviewFolder("  /opt/pkg  ", "/ws") === "/opt/pkg"
reviewFolder("", "/ws/app") === "/ws/app"
reviewFolder(undefined, "/ws/app") === "/ws/app"
reviewFolder("  ", undefined) throws "Open a workspace folder"
```

It also requires `prefer-herd.mdc` (`alwaysApply: true`, herd, grep)
and an `AGENTS.md` link to that file. Proof file:
`verification/plugin-packaging.txt`. This does not launch a VS Code
Extension Host.

## Gotchas

- `graphide.install` builds the CLI. It does not derive the folder.
  The open-on-folder command is `graphide.review`.
- Opening the Flow Review view shows the last snapshot or an empty
  desk. Derive still starts from the command or the in-desk Review
  button.
- The checker fails if `out/review-folder.js` is missing. `npm run
  package` compiles before the check.
