---
name: De-slop UI
description: >-
  Use after an agent produces a mock, HTML prototype, or frontend change.
  Subtract copy, chrome, and duplicate components; require variants,
  references, and a real-data preview before calling it done.
---

# De-slop UI

Agents love to add, in UI the same way they do in code: extra copy, rules, icons, wrappers, a second way to do the same thing. The first pass often looks better than a typical engineer hand-design and is still bad.

You are done when you would ship the surface to someone whose taste you respect, on real data, with nothing left you cannot defend.

## Subtract pass (mandatory)
Walk every element. For each, answer **do I actually need that?** If no, delete it.

Typical litter:

- Protocol strings, internal names, "shown once", helper captions that repeat the title
- Dividers that do not group anything
- Icons that do not change the decision
- Duplicate actions (two ways to cancel, two primary buttons)
- Belt-and-suspenders labels ("Click the button below to continue")
- Reimplemented buttons, inputs, or type styles that already exist in the library

The before/after test: if removing it does not change a decision or a state, it was litter.

## Variants, not the first graft
Do not refine the first in-repo implementation. That is prototype gravity.

1. Gather 5–15 screenshots of products solving the same job. Attach them as context.
2. In a design tool or throwaway HTML, generate **3–4 variants** that satisfy the written constraints.
3. Pick one. Only then implement in the product, using existing components.
4. If the implementation drifts, update the mock. Do not let the repo become the source of design truth mid-pass.

## Components first
- Separate views from logic.
- Build the piece on `/showcase` (or Storybook) and play with it there before wiring data.
- If you need a new primitive, add it to the library in the same change. Do not one-off a button on the feature branch.

## Real data
A correct build of a wrong design is still wrong. Open a preview deploy (or the running app with production-shaped fixtures) and use it.

- Large feature: split backend PR (tests) from frontend PR (preview URL + human).
- Record what broke with real data (overflow, empty, permission, density) and treat those as new constraints if they stick.

## Thresh
Put the candidate in front of yourself or the team and beat it until the reaction is "ship it."

Thresh notes are reactions, not solutions:

- "I don't know where to look first"
- "This feels like a settings page pretending to be a workspace"
- "I would not show this to X"

Then route each note through `design-constraints` (defect / constraint change / papercut). Do not turn a vibe into a new button.

## Evidence required
A pass is not done without:

1. Constraint list (even short)
2. 3–4 variants or an explicit reason you reused a settled pattern
3. Subtract pass (what you removed)
4. Preview or screenshot on real/fixture data
5. Component reuse check (no new one-off primitives)

No evidence = still slop, even if the agent says it is cleaner.

## Stop conditions
- First mock was implemented in-repo and "iterated" there → not done.
- New copy or chrome was added to answer a papercut → run constraints first.
- Preview never opened → not done for user-facing UI.
- Taste pass produced only praise from the same agent that designed it → get a second pair of eyes or wait and look again tomorrow.
