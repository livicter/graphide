# Graphide

Review agent changes as flow graphs. Point the panel at any local repo.

## One-click install (Windows)

1. Double-click **`install.cmd`** in this folder (or right-click → Run).
2. Reload VS Code or Cursor.
3. Open the folder you want to review → **Graphide** in the activity bar → **Review**.

That builds the CLI, installs the extension, and puts the binary in `%USERPROFILE%\.graphide\`. You do not set `graphide.cliPath`.

Needs [Rust](https://rustup.rs) and [Node.js](https://nodejs.org) on PATH. If `code` / `cursor` is missing, use **Extensions → … → Install from VSIX…** and pick `extension\graphide-0.1.0.vsix`.

## One-click install (macOS / Linux)

```bash
./install.sh
```

Then reload the editor.

## Already have the extension?

Command Palette → **Graphide: Install (one click)**. Same build + copy. Then Review.

## Prompt

Optional: `name=hit,hit` (repeat flows with `;`). Hits are unique FQN suffixes. The slice is a Steiner tree on the derived graph — static extract, not a live debugger.
