# Graphide Review

Review any local repo as a flow graph. Live panel caps from SolarSim live in the repo-root `UIUX_sample/` folder. Live installer caps live in the repo-root `install_sample/` folder.

## Install (one click)

From the **Graphide source repo** (the folder that contains `crates/graphide-cli` — not the project you want to review):

| OS | What to run |
|---|---|
| Windows | Double-click `install.cmd` |
| macOS | Double-click `install.command` or `bash install.sh` |
| Ubuntu / Linux | `bash install.sh` (needs `build-essential`) |

Or in **Cursor** or VS Code: **Graphide: Install (one click)** and pick that Graphide source folder if asked. Same VSIX (`engines.vscode` ^1.85.0). Installers try `cursor` first, then `code`.

The CLI goes to `~/.graphide/` (Windows: `%USERPROFILE%\.graphide\`). Language plugins ship inside that binary — `graphide plugins --check` after install. Review targets (`SolarSim`, etc.) only need **Review** — never `cargo build -p graphide-cli` inside them. No `graphide.cliPath` needed.

## After install

Reload → Graphide view → **Review**. Optional prompt: `name=hit,hit`.

Review lands on Overview with a default control-flow run (derived entries, no sidecar required). Overview and Map show **start → features → end**: the communities the control-flow walk visits, in order. Cards lift on hover, hops glow when you aim at them, and the map stage follows the pointer. Drag a card, then **Reorganize** (`R`) to auto-layout. **Stamp** (`S`) and **Skip** (`X`) flash a toast. `/` focuses find; `?` opens the key sheet. **Play** (`P`) walks start → features → end; `[` `]` step. Other workspaces follow the Semantica / Graphify / git-DAG **page** shape (outcome badges, audit mutations, timeline scrub, PROV columns, object ledger) on Graphide objects — not those engines. Other workspaces: Map, Slice, Lineage, Decisions, Registry, Timeline. Search, filters, hop cards, and the inspect rail stay. Wheel or +/− is automatic LOD (overview → labels → hops → source). Zooming out past overview pops one clustering level. Click a bubble or run to Enter. Not a Graphify or Semantica embed — same workbench shape, Graphide objects. No force-directed network dump.

**Stamp** (`S`) writes `.graphide/stamps/<flow>.json`. **Skip** (`X`) is session-only. The next Review rechecks stamps and overlays scars when the tree changed. Git `HEAD^` is the default parent for coverage unless `graphide.parentRoot` is set.

**LLM** (`L`) connects any OpenAI-compatible host (local Ollama / LM Studio / llama.cpp, or a cloud API key) and opens a local bridge on `127.0.0.1:8787` so other LLM clients can read this review. The model explains the derived path. It never stamps.
