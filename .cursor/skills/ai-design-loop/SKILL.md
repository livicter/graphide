---
name: AI design loop
description: >-
  Use when designing or redesigning any visual surface with an agent (landing
  page, app, TUI, dialog, sidebar). Run this loop instead of prompting
  "make X more prominent" or iterating the first mock in the product.
---

# AI design loop

You are not a designer. You still own the constraints. Agents produce slop by default: same landing page, same app chrome, extra copy, extra icons, a patchwork of spot-fixes. Your job is to decide the constraints, generate variants off-product, subtract, then judge the result with real data.

This loop makes a design *good*. It does not prove it *works*. Pair it with the verification loop for correctness.

## When to run
- New surface, redesign, or "the UI looks like slop."
- Feedback arrived and the temptation is a one-line prompt fix.
- An agent just emitted a mock, HTML prototype, or frontend PR.

## The loop (do not skip rungs)

```
constraints → variants (off-product) → subtract → components → real-data preview → steal / taste
       ↑                                      │
       └──────── feedback changes a constraint ┘
```

### 1. Consider the whole
Lay out **all** constraints before a solution. Constraints are yours: type scale, density, workflows you must support, business-logic states, what must fit in one glance.

Then generate an **array** of solutions that satisfy those constraints. If a constraint must be added or one can be dropped, return to the list. This is Alexander's *Notes on the Synthesis of Form*: fit is the absence of misfit, and you only know that after you named the misfits.

Skip this and you play design wackamole. AI makes wackamole cheap: "make X more prominent", "add an affordance for Y". The result is a disjoint patchwork that randomly prioritizes some interactions.

When feedback arrives, ask first: **does this change a constraint?** If yes, reopen the list and redesign the affected whole. If no, log it. Obvious one-line bugs may ship now. Minor papercuts go on a list and get redesigned together. See `design-constraints`.

### 2. Remove stuff
Agents add. Your job is subtract. Extra copy, rules, icons, try/catch UI, belt-and-suspenders labels. For every element: **do I actually need that?** See `de-slop-ui`.

### 3. Iterate in a design tool
Do not iterate the first implementation in the product. Prototype gravity is the silent killer: the first agent build grafts onto the real tree, then every later option feels expensive.

Use a tool meant for design: Figma, Cursor Design Mode, Claude Design, or a throwaway HTML prototype. Have the agent generate **3–4 variants** of everything. Pick, then implement.

### 4. Components and libraries
Separate views from logic. Build the piece on a `/showcase` (or Storybook) page **before** wiring it to the app. One button, one density, one type scale. A reimplemented button on every screen is slop even when each screen "looks fine."

### 5. Preview with real data
Hold the design against the real backend. There will always be rework: even a perfect build of the spec can be wrong in the hand. Split frontend and backend PRs on large features. Backend proves itself with tests. Frontend needs a human on a preview URL.

### 6. Steal
Most UX problems are already solved. Before generating, gather 5–15 screenshots of products solving the same job. That board is agent context. Do not invent a pattern the industry already settled.

### 7. Taste
Taste is reflecting on your own reaction, then acting on it. Engineers are good at "this doesn't work" and weak on the fix library. Build the library by reps: throw the design in the middle and beat it until it feels right (threshing). Stop when you would ship it to someone you respect.

## Stop conditions
- You prompted a spot-fix without checking constraints → restart at 1.
- You refined the first in-repo mock instead of 3–4 off-product variants → restart at 3.
- Every element was not asked "do I need that?" → run `de-slop-ui`.
- No real-data preview and the change is user-facing → not done.
- You only have a story ("it's cleaner") and no artifact (mock, preview, screenshot) → not done.

## Out of scope
This is not a brand system, a full design-ops hire, or a license to restyle the whole app. Scope is the surface under change. Verification (does it work) stays in the verification loop.
