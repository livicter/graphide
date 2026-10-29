# Graphide

Review agent changes as flow graphs. Point the panel at any local repo.

Needs [Rust](https://rustup.rs) and [Node.js](https://nodejs.org). The same VSIX installs into **Cursor** and VS Code. Goal: learn what a program does from graphs and interactive charts alone. No source pane required for the walk.

## Install

From this source repo (not the folder you Review):

```bash
bash install.sh
```

Windows: `install.cmd`. macOS: `install.command`. The installer tries the `cursor` CLI, then `code`. Caps: [`install_sample/`](install_sample/).

## Features

Graphs-only Review surfaces on `main`.

### Overview

Scorecard, Play, and interactive mix and community-size charts. Call-path scrubber grows directed Calls depth from the selected focus (path lights, branches fade). Story captions name behavior (kind · role · verb), not file:line.

![Live suite](UIUX_sample/live-suite.png)

![Overview desk](UIUX_sample/overview-desk.png)

![Overview mix chart](UIUX_sample/overview-mix-chart.png)

![Overview community-size chart](UIUX_sample/overview-community-size.png)

![Story behavior captions](UIUX_sample/story-behavior-captions.png)

![Call-path scrubber](UIUX_sample/call-path-scrubber.png)

### Map

Communities on the walk. Altitude mix chart filters communities by kind or hop. Community-size chart filters the same cards by member count. Hop×size chart ranks communities that are both large and high-hop. Shift+click a community to pin a cross-desk focus trail (chip + spark); the same members stay lit on Slice and Sequence. Click the trail chip to return to the pinned Map community. Enter a bubble for behavior captions. Leaf browse stays graph-only.

![Map communities](UIUX_sample/map-communities.png)

![Map altitude mix](UIUX_sample/map-altitude-mix.png)

![Map altitude community size](UIUX_sample/map-altitude-community-size.png)

![Map altitude community hop-size](UIUX_sample/map-altitude-community-hop-size.png)

![Map enter behavior](UIUX_sample/map-enter-behavior.png)

![Cross-desk focus trail](UIUX_sample/cross-desk-focus-trail.png)

![Focus trail return](UIUX_sample/focus-trail-return.png)

### Slice

Steiner control-flow along Calls, Reads, Writes, Publishes, and Subscribes. Hop-kind mix chart filters lit nodes and hops by kind or edge verb. Same call-path scrubber as Overview on the Steiner canvas. A Map-pinned focus trail chip carries here and lights the same community members. Click the chip to jump back to that Map community.

![Slice control-flow](UIUX_sample/slice-control-flow.png)

![Slice hop-kind mix](UIUX_sample/slice-hop-kind-mix.png)

### Route

PATH between two nodes. Play walks the directed hops. Hop-kind mix chart filters which path hops stay lit (Calls / Reads / Writes / Publishes / Subscribes).

![Route hop-kind mix](UIUX_sample/route-hop-kind-mix.png)

### Sequence

Story-rich hops with participant highlight. Map focus trail chip carries here and dims non-member hops. Click the chip to jump back to the pinned Map community.

![Sequence story richness](UIUX_sample/sequence-story-richness.png)

### Data-flow

Richer lanes on the same graph-only walk. Click a node for its value-trail Sankey (producers → focus → consumers); Escape clears.

![Data-flow richer lanes](UIUX_sample/dataflow-richer-lanes.png)

![Value-trail Sankey](UIUX_sample/value-trail-sankey.png)

### Trace and Passport

Trajectory DAG and Upstream Plan Passport (ADE Phase 1). Passport↔Trajectory delta mix chart filters plan-vs-walked hops by Planned, Residual, or Extra.

![Trajectory DAG](UIUX_sample/trajectory-dag.png)

![Passport](UIUX_sample/passport.png)

![Passport↔Trajectory delta mix](UIUX_sample/passport-traj-delta-mix.png)

### Lineage

Ego of the start hop. Used, Informed, and Generated with behavior captions. Fan size mix chart filters provenance neighbors by Used / Informed / Generated member count.

![Lineage behavior captions](UIUX_sample/lineage-behavior-captions.png)

![Lineage fan size mix](UIUX_sample/lineage-fan-size-mix.png)

### Registry

Snapshot audit of the derived graph.

![Registry audit](UIUX_sample/registry-audit.png)

### Decisions

Stamps, skips, and broken attestations. Attestation mix chart filters the ledger by stamp, skip, or broken.

![Decisions stamps](UIUX_sample/decisions-stamps.png)

![Decisions attestation mix](UIUX_sample/decisions-attestation-mix.png)

## Progress

On `main` now: ADE Phase 1 Trajectory, Passport, and Immutable Verification. Behavior charts landed: Overview mix and community size (OMC), story captions (SBC), data-flow richer lanes (RDF), sequence story richness (SSR), community-size chart (CSC), Map enter captions (MBE), Lineage captions (LBC), Map-altitude community mix (MAC), Map-altitude community-size mix (MCS), Map-altitude community-hop-size mix (MHS), Slice hop-kind mix (SHM), Call-path scrubber (CPS), Route hop-kind mix (RKM), Decisions attestation mix (DAM), Lineage fan size mix (LFO), Passport↔Trajectory delta mix (PTD), Cross-desk focus trail (CFT), Focus Trail Return (FTR), Value-trail Sankey (VTS).

Parked next: CFG expand-on-click (CEO) or cross-module sequence / structural diff.
