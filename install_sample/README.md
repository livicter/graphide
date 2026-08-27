# Installer samples

Live `bash install.sh` on this Linux VM. Windows (`install.cmd` → `install.ps1`) and macOS (`install.command` → `install.sh`) run the same pipeline: build the CLI, `graphide plugins --check`, package the VSIX, install into **Cursor** then VS Code.

Language plugins ship inside the CLI (not as separate editor extensions). The panel is one VSIX (`engines.vscode` ^1.85.0).

| File | What it shows |
|---|---|
| [01-scripts.png](01-scripts.png) | The four one-click installers in the Graphide source repo |
| [02-install-plugins.png](02-install-plugins.png) | CLI copy, every deriver `ok`, VSIX packaged, install into `cursor` then `code` |
| [03-vsix-cursor.png](03-vsix-cursor.png) | `graphide plugins --check` again, `graphide-0.1.29.vsix`, `~/.graphide/graphide` |
