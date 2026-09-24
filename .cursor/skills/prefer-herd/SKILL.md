---
name: prefer-herd
description: >-
  Prefer the Graphide Review herd and report over raw grep when a Review
  graph is present. Agents never stamp.
---

# Prefer herd

When a Review graph is present, read it before grepping source.

## Graph present

Any of:

- `extension/scripts/live-snap.json`
- stdout of `graphide review --root <folder> --json`
- the open Review desk herd (`#herd`)

## Read first

From the snapshot: `programs`, `flows`, `findings`, `coverage`, `bubbles`. That is the herd and the report. Grep only a file or span the report already names.

`graphide.review` opens Review on a folder (`reviewFolder` → `packageRoot()` when no folder is passed). It does not stamp.

`node scripts/agent-herd.mjs --root <folder> --wait` starts that same review, prints herd rows, and exits 0 when the focused cut is blocked or 2 when it settled otherwise. No stamp flag.

## Never

- Write `.graphide/stamps/` or run `graphide stamp`. Agents never stamp.
- Treat the desk as a terminal or a worktree list.
- Drop Map below community LOD (`xy=0`).
