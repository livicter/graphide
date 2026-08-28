---
name: Design constraints
description: >-
  Use when UI feedback arrives, a papercut is filed, or you are about to
  spot-fix a screen. Decide whether the feedback changes a constraint before
  jumping to a solution.
---

# Design constraints

The common failure is skipping the constraint pass and playing wackamole. A user is confused, so you (or the agent) jump to a solution. Sidebars and dense chrome are the usual nerd-snipe: too much in a small space, so every complaint gets a local patch. That road leads to ruin.

## The Alexander cycle
1. Write every constraint you are designing for.
2. Consider an **array** of solutions that satisfy them. One idea is not an array.
3. If a constraint must be added or one can be removed, go to 1.

Fit is the absence of misfit. You cannot judge fit until the misfits are named.

## What counts as a constraint
Write them as testable sentences, not vibes.

- **Type and size:** one scale, max weights, min tap/click target.
- **Workflows:** jobs that must be possible without leaving the surface.
- **States:** empty, loading, error, permission, first-run, dense-data.
- **Density:** what must be visible at a glance vs on demand.
- **Platform:** web, TUI, desktop; what the host already owns (tabs, theme).
- **Non-goals:** what this surface will not do.

The human decides the constraints. The agent proposes candidates. If the agent invents a constraint ("we should also add onboarding"), treat it as a proposal, not a fact.

## When feedback arrives
Ask, in this order:

1. Is this an **obvious defect** (broken hit target, clipped text, wrong state)? Fix it now. Do not open a redesign.
2. Does this **change a named constraint** (a workflow is missing, a state was ignored, density is wrong)? Reopen the constraint list. Redesign the affected whole. Do not patch the one control.
3. Is this a **papercut** (wording, extra line, icon that bothers one person)? Log it. Do not prompt "make X more prominent."

## Papercut list
Keep one document (issue, Notion page, or `design/papercuts.md`) with:

| id | surface | note | constraint change? | status |
|----|---------|------|--------------------|--------|
| P12 | left sidebar | "Share" buried | maybe density | open |

Rules:
- Move fast on obvious defects.
- Batch papercuts into the next cohesive pass of that surface.
- Never let a papercut silently become a new constraint. Mark the column.
- When you redesign, pull the open rows for that surface and close them against the new whole.

## Agent prompts that are banned
Do not send these until step 1 of the Alexander cycle is done:

- "Make X more prominent"
- "Add an affordance to do Y"
- "Add a tooltip / badge / extra button so it's clearer"
- "Just tweak the sidebar"

Replace with: the constraint list, the jobs, the states, and "give me 3–4 variants that satisfy these."

## Stop conditions
- You cannot point at a written constraint list → you are guessing. Write it.
- You applied a local patch to a constraint-level complaint → revert the patch, reopen the whole.
- The papercut list is empty but people keep complaining about the same surface → you are throwing the list away. Start one.
