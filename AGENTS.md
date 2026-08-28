# Agent instructions

Cloud and local Cursor agents must load these three skills when the task is UI, a mock, a frontend change, or design feedback:

- [AI design loop](.cursor/skills/ai-design-loop/SKILL.md)
- [Design constraints](.cursor/skills/design-constraints/SKILL.md)
- [De-slop UI](.cursor/skills/de-slop-ui/SKILL.md)

This pack is **goodness / de-slop** (would you ship the surface). It is separate from the existing **agent-verification-loop**, which is **correctness** (does it work). Load both when a change is user-facing; do not substitute one for the other. Do not add a verify-* skill here.
