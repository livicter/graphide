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

Scorecard, Play, and interactive mix and community-size charts. Call-path scrubber grows directed Calls depth from the selected focus (path lights, branches fade). Click a function for an inline CFG expand (callers → focus → callees) with IR edge-kind labels; Escape clears. Story captions name behavior (kind · role · verb), not file:line.

![Live suite](UIUX_sample/live-suite.png)

![Overview desk](UIUX_sample/overview-desk.png)

![Overview mix chart](UIUX_sample/overview-mix-chart.png)

![Overview community-size chart](UIUX_sample/overview-community-size.png)

![Story behavior captions](UIUX_sample/story-behavior-captions.png)

![Call-path scrubber](UIUX_sample/call-path-scrubber.png)

![CFG expand-on-click](UIUX_sample/cfg-expand-onclick.png)

### Map

Communities on the walk. Altitude mix chart filters communities by kind or hop. Community-size chart filters the same cards by member count. Hop×size chart ranks communities that are both large and high-hop. A community-cut graphic shows how many of those altitude cards intersect the current Steiner walk versus how many sit off it — the same “on tree” marks as the cards, not an enter lit/grey vnode cut and not a kind or size mix. A run-cut graphic shows how many of the same cards host a flowchart run versus how many do not — a different cut from on-tree (b-physics is off-tree but hosts a run). Shift+click a community to pin a cross-desk focus trail (chip + spark); the same members stay lit on Slice and Sequence. Click the trail chip to return to the pinned Map community. Enter a bubble for behavior captions. Leaf browse stays graph-only.

![Map communities](UIUX_sample/map-communities.png)

![Map altitude mix](UIUX_sample/map-altitude-mix.png)

![Map altitude community size](UIUX_sample/map-altitude-community-size.png)

![Map altitude community hop-size](UIUX_sample/map-altitude-community-hop-size.png)

![Map community-cut](UIUX_sample/map-community-cut.png)

![Map run-cut](UIUX_sample/map-run-cut.png)

![Map enter behavior](UIUX_sample/map-enter-behavior.png)

A walk-cut graphic shows how many of this community’s review-relevant members sit on the current Steiner walk (lit) versus grey siblings — the same numbers as the enter title and the painted vnodes, not Timeline’s snap-wide parent cut.

![Map walk-cut](UIUX_sample/map-walk-cut.png)

A distance-cut graphic, in the same title band, shows how many of those members sit at hop distance 0, 1, 2, or 3+ from the walk — the same `data-slice-dist` the enter canvas already paints, not a second lit/grey cut. An enter-attach graphic splits those members into ones that sit on a painted enter hop versus ones that sit isolated — a different cut from lit vs grey and from hop distance (the 24 leaves are 14 attached / 10 isolated). An enter-polarity graphic splits the 14 attached leaves into ones that only leave a painted hop, only arrive at one, or do both — a different cut from MEA’s attached vs isolated (those 14 are 4 out / 4 in / 6 both). A verb-span graphic splits the same 24 leaves into ones whose incident graph uses more than one verb versus those that use only one — a different cut from MEA’s attached vs isolated (those 24 are 15 mix / 9 mono). A hop-distance graphic splits the 10 painted enter hops into ones that walk farther from the Steiner tree versus ones that walk closer or stay level — a different cut from MED’s vnode distance buckets and from MEP’s attach polarity (those 10 hops are 5 out / 5 in).

![Map enter distance-cut](UIUX_sample/map-enter-distance-cut.png)

![Map enter-attach](UIUX_sample/map-enter-attach.png)

![Map enter-polarity](UIUX_sample/map-enter-polarity.png)

![Map enter verb-span](UIUX_sample/map-enter-verb-span.png)

![Map enter hop-distance](UIUX_sample/map-enter-hop-distance.png)

![Cross-desk focus trail](UIUX_sample/cross-desk-focus-trail.png)

![Focus trail return](UIUX_sample/focus-trail-return.png)

### Slice

Steiner control-flow along Calls, Reads, Writes, Publishes, and Subscribes. A walk-role graphic shows how many of the painted members start the Steiner walk, sit mid-walk, end it, or sit off the walk — the same nodes as the canvas, not a hop-kind mix or a lit/grey or distance cut. A tree-edge graphic shows how many of the painted hops sit on that Steiner tree versus how many are extra graph hops the slice also shows — the same edges as the canvas, not a hop-kind mix or a walk-role cut. A walk-hop graphic shows how many of those hops stay among walk members versus how many reach a 1-hop neighbor — a different cut from tree vs extra (the off-tree n0→n3 Reads is walk, not halo). A halo-attach graphic splits those neighbor hops into ones that attach to the walk versus ones that stay among neighbors — a different cut from walk vs halo (the 24 halo hops are 22 bridge / 2 outer). A run-touch graphic splits the same painted hops into ones that touch a named flowchart run versus ones that stay off-run — a different cut from walk vs halo, tree vs extra, and halo attach (the 32 hops are 15 touch / 17 off). A bridge-polarity graphic splits the 22 halo-bridge hops into ones that leave the walk versus ones that arrive at it — a different cut from SHA’s bridge vs outer (those 22 are 15 out / 7 in). A hop-community graphic splits the same painted hops into ones that stay inside a Map community versus ones that cross communities — a different cut from tree vs extra, walk vs halo, and halo attach (the 32 hops are 10 same / 22 cross). A halo-home graphic splits the 21 halo members into ones that attach to the walk only inside their own Map community versus ones that attach across communities — a different cut from hop same vs cross (those 21 are 7 home / 14 away). A fan-degree graphic splits the same 29 painted members into ones that sit on exactly one painted hop versus ones that sit on two or more — a different cut from walk-role and halo-home (those 29 are 16 single / 13 multi). Hop-kind mix chart filters lit nodes and hops by kind or edge verb. Same call-path scrubber as Overview on the Steiner canvas. A Map-pinned focus trail chip carries here and lights the same community members. Click the chip to jump back to that Map community.

![Slice control-flow](UIUX_sample/slice-control-flow.png)

![Slice hop-kind mix](UIUX_sample/slice-hop-kind-mix.png)

![Slice walk-role](UIUX_sample/slice-walk-role.png)

![Slice tree-edge](UIUX_sample/slice-tree-edge.png)

![Slice walk-hop](UIUX_sample/slice-walk-hop.png)

![Slice halo-attach](UIUX_sample/slice-halo-attach.png)

![Slice run-touch](UIUX_sample/slice-run-touch.png)

![Slice bridge-polarity](UIUX_sample/slice-bridge-polarity.png)

![Slice hop-community](UIUX_sample/slice-hop-community.png)

![Slice halo-home](UIUX_sample/slice-halo-home.png)

![Slice fan-degree](UIUX_sample/slice-fan-degree.png)

### Route

PATH between two nodes. Play walks the directed hops. Hop-kind mix chart filters which path hops stay lit (Calls / Reads / Writes / Publishes / Subscribes).

![Route hop-kind mix](UIUX_sample/route-hop-kind-mix.png)

### Sequence

Story-rich hops with participant highlight. Participants group into module swimlanes; cross-module hops light both lanes as Play walks. A module-cut graphic shows how many hops stay inside one module versus how many cross modules — the same numbers as the painted hop cards, not a hop-kind mix or a story scrub. A hop-variant graphic shows how many of those hops are outgoing calls, matching returns, or direct non-call hops — the same `data-seq-variant` as the cards, not a hop-kind mix (Calls lumps call and return) or a module cut. An exchange-cut graphic groups those hops into call exchanges — each outgoing call plus its return and any trailing direct hops — so you can see which exchange carries mass, not only the variant mix across exchanges. Hop-kind mix chart filters which hops stay lit (Calls / Reads / Writes / Publishes / Subscribes). Story scrubber paints past / now / ahead on hops and swimlanes so you can freeze the conversation after N exchanges. Map focus trail chip carries here and dims non-member hops. Click the chip to jump back to the pinned Map community.

![Sequence story richness](UIUX_sample/sequence-story-richness.png)

![Cross-module sequence swimlane](UIUX_sample/sequence-module-swimlane.png)

![Sequence module-cut](UIUX_sample/sequence-module-cut.png)

![Sequence hop-variant](UIUX_sample/sequence-hop-variant.png)

![Sequence exchange-cut](UIUX_sample/sequence-exchange-cut.png)

![Sequence hop-kind mix](UIUX_sample/sequence-hop-kind-mix.png)

![Sequence story scrubber](UIUX_sample/sequence-story-scrubber.png)

### Delta

Parent vs head Architecture Delta. Structural status bars filter Added / Removed / Changed / Moved / Rerouted on the fact list and graph. Architecture-delta story scrubber paints past / now / ahead on facts (and mappable canvas nodes) so you can freeze the review walk after N changes.

![Structural diff overlay](UIUX_sample/structural-diff-overlay.png)

![Delta story scrubber](UIUX_sample/delta-story-scrubber.png)

### Lifecycle

Derived review machine. Transition event bars filter Play / Wait / Stamp / Skip / Break / Recover on the event list and graph. Lifecycle story scrubber paints past / now / ahead on events (and mappable states) so you can freeze the review walk after N events.

![Lifecycle transition overlay](UIUX_sample/lifecycle-transition-overlay.png)

![Lifecycle story scrubber](UIUX_sample/lifecycle-story-scrubber.png)

### Data-flow

Richer lanes on the same graph-only walk. Click a node for its value-trail Sankey (producers → focus → consumers); Escape clears. Pipeline story scrubber paints past / now / ahead on hops and RDF stages so you can freeze the value walk after N hops.

![Data-flow richer lanes](UIUX_sample/dataflow-richer-lanes.png)

![Value-trail Sankey](UIUX_sample/value-trail-sankey.png)

![Data-flow story scrubber](UIUX_sample/dataflow-story-scrubber.png)

### Trace and Passport

Trajectory story scrubber paints past / now / ahead on Trace subtasks and edges so you can freeze the agent walk after N steps.

![Trajectory story scrubber](UIUX_sample/trajectory-story-scrubber.png)

A Present/fixture lens isolates Trace fixture node kinds (plan, edit, fixture, and the rest of the current fixture) on the DAG. The chips stay on Presentation Stage; Escape clears the lens before exiting Present.

![Present/fixture lens](UIUX_sample/present-fixture-lens.png)


Trajectory DAG and Upstream Plan Passport (ADE Phase 1). Passport↔Trajectory delta mix chart filters plan-vs-walked hops by Planned, Residual, or Extra.

![Trajectory DAG](UIUX_sample/trajectory-dag.png)

![Passport](UIUX_sample/passport.png)

![Passport↔Trajectory delta mix](UIUX_sample/passport-traj-delta-mix.png)

A Passport impact/layer graphic shows the plan’s shape: architecture layers beside impact families (call graphs, API contracts, invariants), with counts from the same fixture lists as the sections.

![Passport impact/layer](UIUX_sample/passport-impact-layer.png)

### Lineage

Ego of the start hop. Used, Informed, and Generated with behavior captions. Fan size mix chart filters provenance neighbors by Used / Informed / Generated member count. Lineage story scrubber paints past / now / ahead on incident hops (and mappable canvas nodes) so you can freeze the provenance walk after N hops.

![Lineage behavior captions](UIUX_sample/lineage-behavior-captions.png)

![Lineage fan size mix](UIUX_sample/lineage-fan-size-mix.png)

![Lineage story scrubber](UIUX_sample/lineage-story-scrubber.png)

### Registry

Snapshot audit of the derived graph. An interactive snapshot graphic shows this review’s node, edge, and file counts (same numbers as the first audit row). Audit kind bars filter Review / Stamp / Skip / Broken / Finding on the table.

![Registry audit](UIUX_sample/registry-audit.png)

![Registry audit kind-mix](UIUX_sample/registry-audit-kind-mix.png)

![Registry snapshot graphic](UIUX_sample/registry-snapshot-graphic.png)

An audit-subject graphic groups table rows by subject (flow when present) and shows which audit kinds attach to each one — so a flow like boot is visible across the audit kinds that attach to it, not only as kind totals.

![Registry audit subjects](UIUX_sample/registry-audit-subjects.png)

### Timeline

Parent cut, coverage, and stamp scars. Kind bars filter Parent / Uncovered / Stamp / Skip / Broken / Hint on the rail; scrubber stays.

![Timeline scrub](UIUX_sample/timeline-scrub.png)

![Timeline kind-mix](UIUX_sample/timeline-kind-mix.png)

A parent-cut graphic shows how many nodes changed vs parent, how many of those sit uncovered, and how many remain on a proposed tree — the same numbers as the first two rail items.

![Timeline parent-cut](UIUX_sample/timeline-parent-cut.png)

### Decisions

Stamps, skips, and broken attestations. Attestation mix chart filters the ledger by stamp, skip, or broken. The selected record draws its derived Steiner hops (and StampBroken scars) as an interactive causal graph in the detail pane; click a node or edge to focus, Escape clears.

![Decisions stamps](UIUX_sample/decisions-stamps.png)

![Decisions attestation mix](UIUX_sample/decisions-attestation-mix.png)

![Decisions causal graph](UIUX_sample/decisions-causal-graph.png)

A hop-scar graphic shows unique derived Steiner hops on stamped or skipped flows versus StampBroken added and removed edges — the same numbers as the boot tree and the StampBroken card body, not a second causal SVG.

![Decisions hop-scar](UIUX_sample/decisions-hop-scar.png)

## Progress

On `main` now: ADE Phase 1 Trajectory, Passport, and Immutable Verification. Behavior charts landed: Overview mix and community size (OMC), story captions (SBC), data-flow richer lanes (RDF), sequence story richness (SSR), community-size chart (CSC), Map enter captions (MBE), Lineage captions (LBC), Map-altitude community mix (MAC), Map-altitude community-size mix (MCS), Map-altitude community-hop-size mix (MHS), Slice hop-kind mix (SHM), Call-path scrubber (CPS), Route hop-kind mix (RKM), Decisions attestation mix (DAM), Lineage fan size mix (LFO), Passport↔Trajectory delta mix (PTD), Cross-desk focus trail (CFT), Focus Trail Return (FTR), Value-trail Sankey (VTS), CFG expand-on-click (CFE), Cross-module sequence swimlane (CMS), Structural diff overlay (SDO), Lifecycle transition overlay (LSC), Registry audit kind-mix (RAK), Timeline kind-mix (TKM), Sequence hop-kind mix (SHK), Sequence story scrubber (SSS), Dataflow story scrubber (DSS), Trajectory story scrubber (TSS), Delta story scrubber (DDS), Lifecycle story scrubber (LSS), Lineage story scrubber (LHS), Decisions causal graph (DCG), Registry snapshot graphic (RSG), Present/fixture lens (PFL), Registry audit subjects (RAS), Passport impact/layer graphic (PIL), Timeline parent-cut graphic (TPC), Decisions hop-scar graphic (DHS), Map walk-cut graphic (MWC), Sequence module-cut graphic (SMC), Map enter distance-cut graphic (MED), Slice walk-role graphic (SWR), Sequence hop-variant graphic (SHV), Slice tree-edge graphic (STE), Map community-cut graphic (MCC), Slice walk-hop graphic (SWH), Sequence exchange-cut graphic (SXC), Map run-cut graphic (MRC), Slice halo-attach graphic (SHA), Map enter-attach graphic (MEA), Map enter-polarity graphic (MEP), Slice run-touch graphic (SRT), Slice bridge-polarity graphic (SBP), Slice hop-community graphic (SHC), Slice halo-home graphic (SHH), Map enter verb-span graphic (MEV), Slice fan-degree graphic (SFD), Map enter hop-distance graphic (EHD), Slice hop tip (SHT), Dataflow hop tip (DHT).

Parked next: none (DHT shipped).
