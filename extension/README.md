# Graphide Review

Review any local repo as a flow graph.

## Install (one click)

From the **Graphide source repo** (the folder that contains `crates/graphide-cli` — not the project you want to review):

| OS | What to run |
|---|---|
| Windows | Double-click `install.cmd` |
| macOS | Double-click `install.command` or `bash install.sh` |
| Ubuntu / Linux | `bash install.sh` (needs `build-essential`) |

Or in the editor: **Graphide: Install (one click)** and pick that Graphide source folder if asked.

The CLI goes to `~/.graphide/` (Windows: `%USERPROFILE%\.graphide\`). Review targets (`SolarSim`, etc.) only need **Review** — never `cargo build -p graphide-cli` inside them. No `graphide.cliPath` needed.

## After install

Reload → Graphide view → **Review**. Optional prompt: `name=hit,hit`.

If the repo has more than one binary or crate, Review opens a program overview first. Pick a bin, then zoom the flowchart for file:line and source on each node.

**Stamp** (`S`) writes `.graphide/stamps/<flow>.json`. **Skip** (`X`) is session-only. The next Review rechecks stamps and overlays scars when the tree changed. Git `HEAD^` is the default parent for coverage unless `graphide.parentRoot` is set.
