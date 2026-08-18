# Graphide Review

Review any local repo as a flow graph.

## Install (one click)

From the **repo root**:

| OS | What to run |
|---|---|
| Windows | Double-click `install.cmd` |
| macOS | Double-click `install.command` or `bash install.sh` |
| Ubuntu / Linux | `bash install.sh` (needs `build-essential`) |

Or in the editor: **Graphide: Install (one click)**.

The CLI goes to `~/.graphide/` (Windows: `%USERPROFILE%\.graphide\`). No `graphide.cliPath` needed.

## After install

Reload → Graphide view → **Review**. Optional prompt: `name=hit,hit`.

**Stamp** (`S`) writes `.graphide/stamps/<flow>.json`. **Skip** (`X`) is session-only. The next Review rechecks stamps and overlays scars when the tree changed. Git `HEAD^` is the default parent for coverage unless `graphide.parentRoot` is set.
