---
name: harness-engineering
description: >-
  Agent = Model + Harness. Kill zero-value tokens. GitHub verify is the SWE
  bench. The writer does not grade own homework. P-Stack stays local.
---

# Harness engineering

The model is the weights. The harness is everything else: skills, tools, CI,
the Review desk driver, and what we refuse to let the writer mark as PASS.

This skill is **how we prove work**. It is not a substitute for
[verify-graphide](../verify-graphide/SKILL.md) (desk correctness) or the
design-loop pack (would you ship the surface). Load this with verify-graphide
after any Review UI, engine, or extension change.

## Rules

1. **Agent = Model + Harness.** A clever walkthrough is the model talking.
   The harness is the job, the selectors, the snap, the screenshot that is
   not a black frame. If only one of those exists, the work is not done.
2. **Kill zero-value tokens.** A skill line, comment, or chrome caption that
   does not change a decision or a gate is litter. Delete it. Do not add
   `data-testid` / `data-component` / `data-action-id` unless the harness
   cannot hook an existing `#id` or `[data-ws]`.
3. **GitHub `verify` is the SWE bench.** The job named `verify` on the PR
   must be green. A written story, a local anecdote, or `check-map.js` alone
   is not a pass. No merge on story.
4. **Writer does not grade own homework.** The agent that implemented the
   change does not get to declare PASS from prose. Drive the harness. Read
   the job log. The doctor checklist lives in verify-graphide — there is no
   separate verify binary.
5. **P-Stack stays local.** `/add-plugin pstack` is a local install. Cloud
   agents inherit **committed** skills only. Do not add P-Stack files.

## Graphide

- Headless path: `extension/scripts/webview-harness.html` + the Playwright
  driver `scripts/verify-graphide.js`.
- Self-review snap: `graphide review --root <checkout> --json --progress --no-parent`.
- Architecture Delta snap (parent diff): `graphide review --root fixtures/demo --parent fixtures/demo-parent --json`. Prefer the in-tree fixture so shallow Actions clones do not flake.
- Stamp / skip is human-only. The harness may click `#stampBtn` / `#skipBtn`
  only to prove `window.__vscodePosts`. It must not write `.graphide/stamps/`.

## Stop conditions

- You claimed the desk works and `verify` is not green → not done.
- You graded the change by reading your own walkthrough → not done.
- You added tokens the harness does not assert → delete them.
- You committed P-Stack → revert it.
