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

Scorecard, Play, and interactive mix and community-size charts. Story captions name behavior (kind · role · verb), not file:line.

![Live suite](UIUX_sample/live-suite.png)

![Overview desk](UIUX_sample/overview-desk.png)

![Overview mix chart](UIUX_sample/overview-mix-chart.png)

![Overview community-size chart](UIUX_sample/overview-community-size.png)

![Story behavior captions](UIUX_sample/story-behavior-captions.png)

### Map

Communities on the walk. Enter a bubble for behavior captions. Leaf browse stays graph-only.

![Map communities](UIUX_sample/map-communities.png)

![Map enter behavior](UIUX_sample/map-enter-behavior.png)

### Slice

Steiner control-flow along Calls, Reads, Writes, Publishes, and Subscribes.

![Slice control-flow](UIUX_sample/slice-control-flow.png)

### Sequence

Story-rich hops with participant highlight.

![Sequence story richness](UIUX_sample/sequence-story-richness.png)

### Data-flow

Richer lanes on the same graph-only walk.

![Data-flow richer lanes](UIUX_sample/dataflow-richer-lanes.png)

### Trace and Passport

Trajectory DAG and Upstream Plan Passport (ADE Phase 1).

![Trajectory DAG](UIUX_sample/trajectory-dag.png)

![Passport](UIUX_sample/passport.png)

### Lineage

Ego of the start hop. Used, Informed, and Generated with behavior captions.

![Lineage behavior captions](UIUX_sample/lineage-behavior-captions.png)

### Registry

Snapshot audit of the derived graph.

![Registry audit](UIUX_sample/registry-audit.png)

### Decisions

Stamps, skips, and broken attestations.

![Decisions stamps](UIUX_sample/decisions-stamps.png)

## Progress

On `main` now: ADE Phase 1 Trajectory, Passport, and Immutable Verification. Behavior charts landed: Overview mix and community size (OMC), story captions (SBC), data-flow richer lanes (RDF), sequence story richness (SSR), community-size chart (CSC), Map enter captions (MBE), Lineage captions (LBC).

Parked next: Map-altitude community mix.
