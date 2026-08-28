# Graphide

Review agent changes as flow graphs. Point the panel at any local repo.

Needs [Rust](https://rustup.rs) and [Node.js](https://nodejs.org) on PATH. Ubuntu also needs a C compiler: `sudo apt install build-essential`. macOS needs Xcode CLT: `xcode-select --install`.

The same VSIX installs into **Cursor** and VS Code (`engines.vscode` ^1.85.0). One-click installers try the `cursor` CLI first, then `code`. Language plugins (Rust, Python, JavaScript, TypeScript, C, C++, Go) ship in the CLI. Query langs match the Rust deriver: **TypeUses**, an **import map**, **Imports** edges when a name resolves through that map (`from pkg import T` / `import { T }` / `import pkg`), and **Endpoint** / Publishes / Subscribes / Reads. `graphide plugins --check` verifies every deriver after copy.

## Install (live)

Caps from `bash install.sh` in this VM. Windows (`install.cmd`) and macOS (`install.command`) run the same steps. More in [`install_sample/`](install_sample/).

**1. One-click scripts** in the Graphide source repo (not the folder you Review):

![One-click installers](install_sample/01-scripts.png)

**2. CLI + plugins + VSIX** — every deriver must pass before the panel is installed into Cursor, then VS Code:

![Install plugins and Cursor](install_sample/02-install-plugins.png)

**3. Check again, then reload Cursor** → Graphide → **Review**:

![VSIX and plugin check](install_sample/03-vsix-cursor.png)

## Review panel

After **Review**, the panel lands on **Overview** with a default run (`overview` + `control-flow`). Play walks **Start → features → end**. Other workspaces: **Map**, **Slice**, **Lineage**, **Decisions**, **Registry**, **Timeline**. Caps below are a live SolarSim pass after the Imports plugin match (**349 nodes · 1222 edges · 57 files**, **457 Imports**, harness **PASS 57/57**). The desk has **Day** and **Night** appearance (header control, key `D`, or `graphide.appearance`: `auto` / `day` / `night`). Auto follows the Cursor / VS Code color theme. The object rail is a source list of names; the footer is one caption. Endpoint / pub-sub hops match Rust on the same derivers; SolarSim’s edge mix did not change from Endpoints. More in [`UIUX_sample/`](UIUX_sample/). To learn **every workspace on this Graphide repo**, skip to [Learn Graphide on this repo](#learn-graphide-on-this-repo).

![Live V1–V57](UIUX_sample/live-suite.png)

**Day** and **Night** on the same SolarSim snapshot:

![Overview day](UIUX_sample/overview-desk.png)

![Overview night](UIUX_sample/overview-desk-night.png)

**Overview** — scorecard, Play / Prev / Next, Evidence on the current hop:

![Overview desk](UIUX_sample/overview-desk.png)

**Map** — communities on the walk; click a bubble to Enter. **Slice** — Steiner control-flow:

![Map communities](UIUX_sample/map-communities.png)

![Slice control-flow](UIUX_sample/slice-control-flow.png)

**Lineage** — ego of the start hop, Used / Informed / Generated. **Registry** — snapshot audit:

![Lineage hops](UIUX_sample/lineage-hops.png)

![Registry audit](UIUX_sample/registry-audit.png)

**Decisions** — stamps, skips, broken attestations:

![Decisions stamps](UIUX_sample/decisions-stamps.png)

## Learn Graphide on this repo

Open **this** Graphide source folder (the tree that has `crates/graphide-cli`) and click **Review**. You do not need a prompt. The shots below are that live pass: **688 nodes · 3012 hops · 38 files** (576 Function · 63 Type · 49 Endpoint; 1695 Calls · 1216 Reads). Plugins: javascript, python, rust, typescript. Full catalog in [`self_sample/`](self_sample/).

### 1. Overview is the landing

After Review you land on **Overview** with two pending flows: `overview` and `control-flow`. The strip is the story Graphide will walk:

`START · main` → `review_roots` → `print_review` → `path_relative` → `END · default_stamp_path`

The graph is the same walk: `main` **Calls** those four helpers in `crates/graphide-cli/src/main.rs`. The Run rail on the right is a source list of those names. The footer is the scorecard (nodes, hops, communities, programs).

![Overview — default run on this repo](self_sample/01-overview.png)

### 2. Play walks Start → features → end

**Play** (`P`) steps the strip. **Prev** / **Next** (`[` `]`) step one hop. Evidence opens on the current hop (`review_roots` at `src/main.rs:309` here). Pause stops the walk.

![Play walks the strip](self_sample/02-overview-play.png)

### 3. Keys

`?` opens the sheet. `1`–`7` switch workspaces. `S` stamps, `X` skips, `L` asks, `P` plays, `R` reorganizes, `E` is ego, `D` flips Day / Night, `+` `−` zoom, `0` fits, Backspace goes back.

![Keys sheet](self_sample/04-keys.png)

### 4. Map — communities, not a hairball

**Map** lays the walk through communities. `START · main` sits on its own row. Everything else is **OFF PATH**. Drag a card; **Reorganize** (`R`) auto-lays the chart. **Zoom in to peek members. Click to Enter.** Geometric zoom is not Enter.

![Map communities](self_sample/05-map.png)

### 5. Enter is a world jump

Click the START bubble. You drop one clustering level into the members (`main`, `review_roots`, CALLS hops). **Back** pops back to communities.

![Enter START · main](self_sample/06-map-enter.png)

### 6. Evidence

Click a hop. The inspector is kind, file:line, program, degree, and Calls. Long source stays in that pane — it does not cover the object rail. **Editor** opens the span.

![Evidence on review_roots](self_sample/07-evidence.png)

**Ego** (`E`) isolates the selected node and its 1-hop (or 2-hop) neighborhood.

![Ego of the selected hop](self_sample/08-ego.png)

### 7. Find, kinds, programs, zoom

`/` finds an FQN, file, flow, or hop. Kind pills hide Function / Type / Endpoint. Program chips (`bin graphide-cli`, `lib graphide-engine`, …) are a **legend filter** — a file projection, not a new IR kind. Wheel or `+` `−` is automatic LOD: overview → labels → hops → source. Zooming out past overview pops one clustering level.

![Find review_roots](self_sample/10-find.png)

![Kind filters](self_sample/11-kinds.png)

### 8. Slice — the Steiner tree

**Slice** is the same walk as a control-flow tree. Each card has file:line (`main` at `src/main.rs:114`, then the four callees). Zoom out for runs, in for hops and source.

![Slice control-flow](self_sample/14-slice.png)

Click a hop for Evidence plus the source span.

![Slice hop Evidence](self_sample/15-slice-hop.png)

### 9. Lineage

**Lineage** is the 1-hop ego of the start hop (`main`). Used / Informed / Generated sit on derived edges. Evidence lists Calls and TypeUses.

![Lineage ego of main](self_sample/16-lineage.png)

### 10. Stamp, Skip, Decisions

**Stamp** (`S`) is a human attestation: this flow still holds. It writes `.graphide/stamps/<flow>.json`. The toast says *Stamped control-flow · holds*. **Skip** (`X`) leaves that flow unstamped for this session only.

![Stamp toast](self_sample/17-stamp.png)

**Decisions** is the ledger: stamps, skips, and broken attestations. A new hop on the next Review is a scar (`StampBroken`).

![Decisions HOLDS](self_sample/18-decisions.png)

![Skip is session-only](self_sample/19-skip.png)

### 11. Registry and Timeline

**Registry** audits this snapshot: node/edge/file counts, HOLDS, SKIPPED.

![Registry audit](self_sample/21-registry.png)

**Timeline** is the parent cut, coverage, and stamp scars. `HEAD^` is the default parent unless `graphide.parentRoot` is set. The scrubber watches this review (`t0` parent → coverage → holds → skipped).

![Timeline scars](self_sample/22-timeline.png)

### 12. Ask — the model never stamps

**LLM** (`L`) opens Ask. Without a host, answers still come from the derived graph (the same start → features → end path). Connect Ollama / LM Studio / llama.cpp / OpenAI if you want a model. **Agents never stamp.**

![Ask retells the path](self_sample/23-ask.png)

### 13. Night

Header **Night**, key `D`, or `graphide.appearance`: `night`. Same objects, Apple dark desk.

![Night Overview](self_sample/24-night-overview.png)

![Night Map](self_sample/25-night-map.png)

![Night Slice](self_sample/26-night-slice.png)

## Windows

1. Double-click **`install.cmd`**.
2. Reload **Cursor** or VS Code.
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

Then reload **Cursor** or VS Code. If neither `cursor` nor `code` is on PATH, use **Extensions → … → Install from VSIX…** and pick the newest `extension/graphide-*.vsix`.

## Already have the extension?

Command Palette → **Graphide: Install (one click)**. Same build + copy on Windows, macOS, and Linux. If it asks for a folder, pick the **Graphide source repo** (this tree — has `crates/graphide-cli`), not the project you are reviewing.

## Review another repo

Open that repo (e.g. SolarSim) and click **Review**. Do **not** run `cargo build -p graphide-cli` there — that package only exists in this Graphide source repo. Use `%USERPROFILE%\.graphide\graphide.exe` (or `~/.graphide/graphide`) instead.

After Review the panel lands on **Overview** with a **default run**: an `overview` flow from derived entries and a `control-flow` Steiner along Calls/Reads/Writes/Publishes/Subscribes. No `flows.toml` required. Other workspaces stay: **Map**, **Slice**, **Lineage**, **Decisions**, **Registry**, **Timeline**. Search, kind filters, hop cards, and the inspect rail stay on every graph workspace. Programs are a legend filter (file projection), not a new IR kind.

Geometric zoom is automatic LOD on this canvas: **overview → labels → hops → source**. Zooming out past overview pops one clustering level (members → communities, or inner world → parent). **Enter** (click a run or bubble) is still a world jump — the camera never dumps every function.

This is not [Graphify](https://github.com/Graphify-Labs/graphify) and not a [Semantica](https://github.com/semantica-agi/semantica) embed. No Sigma.js / ForceAtlas2 hairball, no SPARQL, no ontology authoring, no entity merge. Graphide keeps a closed review vocabulary (`Function|Type|Endpoint`, spanned edges, stamps, coverage) and projects those objects through explorer workspaces.

## LLM (any host, or a local port)

Graphide can **call** an OpenAI-compatible host and **listen** so any LLM client can call it.

1. Command Palette → **Graphide: Connect LLM**. Pick Local Ollama (`http://127.0.0.1:11434/v1`), LM Studio (`:1234`), llama.cpp (`:8080`), OpenAI, or a custom `/v1` URL. Paste an API key if the host needs one (Secret Storage). Local hosts can leave the key empty.
2. Or set `graphide.llm.baseUrl` + `graphide.llm.model`.
3. In the Review panel, **LLM** (or `L`) opens Ask. Questions are grounded on the current derived flow (start → features → end). The model **never stamps**.
4. A local bridge listens on `127.0.0.1:8787` (`graphide.bridge.port`). **Graphide: Copy Bridge API Key**, then point any client at `http://127.0.0.1:8787/v1` with `Authorization: Bearer <key>`. Routes: `/health`, `/v1/review`, `/v1/path`, `/v1/ask`, `/v1/chat/completions`.

Without a host, Ask still answers from the review graph. Reinstall the VSIX after this change.

## Prompt

Optional: `name=hit,hit` (repeat flows with `;`). Hits are unique FQN suffixes. The slice is a Steiner tree on the derived graph — static extract, not a live debugger.

## Stamp and coverage

After Review, **Stamp** (or `S`) writes a human attestation to `.graphide/stamps/<flow>.json`. **Skip** (or `X`) leaves that flow unstamped for this session. The next Review rechecks saved stamps: a new hop is a scar on the tree (`StampBroken`).

If the folder is a git repo, Review extracts `HEAD^` as the parent revision so coverage can flag changed nodes not on any proposed tree, and bubble ids stay sticky across that cut. Set `graphide.parentRoot` to override, or pass `--no-parent` on the CLI.
