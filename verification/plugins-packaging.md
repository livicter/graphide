# Plugins packaging

PASS check-activation · graphide.review → reviewFolder → packageRoot()

- Command `graphide.review` calls `reviewFolder`. No `graphide.reviewFolder` command.
- Explorer context `explorerResourceIsFolder` reuses `graphide.review`.
- `runReview` root is `this.reviewRoot || packageRoot()`.
- `reviewFolder` does not call `writeStamp`. Agents never stamp.
- `.cursor/rules/prefer-herd.mdc` is `alwaysApply: true` and prefers the herd and report over grep.
- `.cursor/skills/prefer-herd/SKILL.md` names `programs` / `findings` and forbids stamps.
- VSIX: `extension/graphide-0.1.37.vsix`
