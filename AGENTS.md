# Agent instructions

Cloud and local Cursor agents must load these three skills when the task is UI, a mock, a frontend change, or design feedback:

- [AI design loop](.cursor/skills/ai-design-loop/SKILL.md)
- [Design constraints](.cursor/skills/design-constraints/SKILL.md)
- [De-slop UI](.cursor/skills/de-slop-ui/SKILL.md)

This pack is **goodness / de-slop** (would you ship the surface). It is separate from **verify-graphide**, which is **correctness** (does it work). Load both when a change is user-facing; do not substitute one for the other.

For Review-desk correctness, load:

- [Verify Graphide](.cursor/skills/verify-graphide/SKILL.md)
- [Harness engineering](.cursor/skills/harness-engineering/SKILL.md)

When a Review graph is present (`live-snap.json`, `graphide review --json`, or `#herd`), read that herd and report before grepping the tree. See [prefer-herd](.cursor/skills/prefer-herd/SKILL.md). Agents never stamp.
