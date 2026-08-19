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

Review opens explorer workspaces over the derived graph: Map, Slice, Lineage, Decisions, Registry, Overview, Timeline. Search, filters, hop cards, and the inspect rail stay. Wheel or +/− is automatic LOD (overview → labels → hops → source). Zooming out past overview pops one clustering level. Click a bubble or run to Enter. Not a Graphify or Semantica embed — same workbench shape, Graphide objects. No force-directed network dump.

**Stamp** (`S`) writes `.graphide/stamps/<flow>.json`. **Skip** (`X`) is session-only. The next Review rechecks stamps and overlays scars when the tree changed. Git `HEAD^` is the default parent for coverage unless `graphide.parentRoot` is set.
