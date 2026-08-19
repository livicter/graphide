# Graphide

Review agent changes as flow graphs. Point the panel at any local repo.

Needs [Rust](https://rustup.rs) and [Node.js](https://nodejs.org) on PATH. Ubuntu also needs a C compiler: `sudo apt install build-essential`. macOS needs Xcode CLT: `xcode-select --install`.

## Windows

1. Double-click **`install.cmd`**.
2. Reload VS Code or Cursor.
3. Open the folder to review → **Graphide** → **Review**.

The CLI is copied to `%USERPROFILE%\.graphide\graphide.exe`. You do not set `graphide.cliPath`.

## macOS

1. Double-click **`install.command`** (or run `bash install.sh` in Terminal).
2. If macOS blocks it: right-click → Open.
3. Reload the editor → **Graphide** → **Review**.

The CLI is copied to `~/.graphide/graphide`.

## Linux (Ubuntu)

```bash
sudo apt install build-essential
bash install.sh
```

Then reload the editor. If `code` is a Snap or not on PATH, use **Extensions → … → Install from VSIX…** and pick `extension/graphide-0.1.0.vsix`.

## Already have the extension?

Command Palette → **Graphide: Install (one click)**. Same build + copy on Windows, macOS, and Linux. If it asks for a folder, pick the **Graphide source repo** (this tree — has `crates/graphide-cli`), not the project you are reviewing.

## Review another repo

Open that repo (e.g. SolarSim) and click **Review**. Do **not** run `cargo build -p graphide-cli` there — that package only exists in this Graphide source repo. Use `%USERPROFILE%\.graphide\graphide.exe` (or `~/.graphide/graphide`) instead.

After Review the panel is a **review explorer** (Semantica-shaped workspaces, Graphide graph): **Map** (communities), **Slice** (Steiner boxed DAG), **Lineage** (ego + incident hops + shortest path on existing edges), **Decisions** (stamps / skips / stamp scars), **Registry** (audit of this snapshot), **Overview** (kinds, hops, coverage, degree), **Timeline** (parent cut → uncovered → stamp events). Search, kind filters, hop cards, and the inspect rail stay on every graph workspace. Programs are a legend filter (file projection), not a new IR kind. Zoom does not change clustering altitude. **Enter** (click a run) is still a world jump.

This is not [Graphify](https://github.com/Graphify-Labs/graphify) and not a [Semantica](https://github.com/semantica-agi/semantica) embed. No Sigma.js / ForceAtlas2 hairball, no SPARQL, no ontology authoring, no entity merge. Graphide keeps a closed review vocabulary (`Function|Type|Endpoint`, spanned edges, stamps, coverage) and projects those objects through explorer workspaces.

## Prompt

Optional: `name=hit,hit` (repeat flows with `;`). Hits are unique FQN suffixes. The slice is a Steiner tree on the derived graph — static extract, not a live debugger.

## Stamp and coverage

After Review, **Stamp** (or `S`) writes a human attestation to `.graphide/stamps/<flow>.json`. **Skip** (or `X`) leaves that flow unstamped for this session. The next Review rechecks saved stamps: a new hop is a scar on the tree (`StampBroken`).

If the folder is a git repo, Review extracts `HEAD^` as the parent revision so coverage can flag changed nodes not on any proposed tree, and bubble ids stay sticky across that cut. Set `graphide.parentRoot` to override, or pass `--no-parent` on the CLI.
