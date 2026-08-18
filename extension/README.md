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

The CLI goes to `~/.graphide/` (Windows: `%USERPROFILE%\.graphide\`). After one install, Review works in any workspace — the folder you review does not need to be the Graphide repo.

## After install

Reload → Graphide view → **Review**. Optional prompt: `name=hit,hit`.

**Stamp** (`S`) writes `.graphide/stamps/<flow>.json`. **Skip** (`X`) is session-only. `[` / `]` switch flows. Click a run to enter; crumbs pop altitude. Coverage chips list uncovered nodes — click one to open source. Git `HEAD^` is the default parent unless `graphide.parentRoot` is set.
