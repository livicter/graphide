# Learn Graphide on this repo

Live Review of **this** Graphide source tree (not SolarSim): **688 nodes · 3012 hops · 38 files**. Kinds: 576 Function · 63 Type · 49 Endpoint. Hops: 1695 Calls · 1216 Reads · 48 Contains · 38 TypeUses · 15 Imports. Plugins: `javascript` · `python` · `rust` · `typescript`. After Review the panel lands on **Overview** with two pending flows (`overview` + `control-flow`). The default walk is:

`START · main` → `review_roots` → `print_review` → `path_relative` → `END · default_stamp_path`

`main` **Calls** those four helpers in `crates/graphide-cli/src/main.rs`. Play walks that strip. Click a Map bubble to **Enter** (one clustering level down). Geometric zoom peeks members — it does not Enter. **Stamp** / **Skip** are human. Ask can retell the path; **agents never stamp**.

SolarSim caps stay in [`../UIUX_sample/`](../UIUX_sample/).

| File | Feature |
|---|---|
| [01-overview.png](01-overview.png) | **Overview** landing: scorecard, strip, `main` Calls four helpers, Run rail |
| [02-overview-play.png](02-overview-play.png) | **Play** (`P`) walks Start → features → end; Evidence on the current hop |
| [03-overview-step.png](03-overview-step.png) | **Next** (`]`) steps one hop |
| [04-keys.png](04-keys.png) | **Keys** (`?`): workspaces, stamp, skip, play, day/night, fit |
| [05-map.png](05-map.png) | **Map**: START · main on its own row; off-path communities below |
| [06-map-enter.png](06-map-enter.png) | **Enter** START: Evidence on the walk hop `main` (`src/main.rs:114`), not an interior cluster member |
| [07-evidence.png](07-evidence.png) | **Evidence**: kind, file:line, program, Calls — stays off the object rail |
| [08-ego.png](08-ego.png) | **Ego** (`E`): isolate the selected node and its 1-hop neighborhood |
| [09-map-back.png](09-map-back.png) | **Back**: pop one clustering level to communities |
| [10-find.png](10-find.png) | **Find** (`/`): FQN, file, flow, or hop (`review_roots`) |
| [11-kinds.png](11-kinds.png) | **Kind filters**: Function / Type / Endpoint |
| [12-program.png](12-program.png) | **Programs**: legend filter (file projection), not a new IR kind |
| [13-zoom.png](13-zoom.png) | **Zoom LOD**: overview → labels → hops → source |
| [14-slice.png](14-slice.png) | **Slice**: Steiner control-flow, file:line on each card |
| [15-slice-hop.png](15-slice-hop.png) | Click a hop: Evidence + source span |
| [16-lineage.png](16-lineage.png) | **Lineage**: 1-hop ego of `main` + Evidence |
| [17-stamp.png](17-stamp.png) | **Stamp** (`S`): human attestation, toast *Stamped control-flow · holds* |
| [18-decisions.png](18-decisions.png) | **Decisions**: HOLDS on the stamped walk |
| [19-skip.png](19-skip.png) | **Skip** (`X`): session-only, no stamp written |
| [20-decisions-skip.png](20-decisions-skip.png) | Decisions after Skip: approved + skipped records |
| [21-registry.png](21-registry.png) | **Registry**: snapshot audit (holds / skipped) |
| [22-timeline.png](22-timeline.png) | **Timeline**: parent cut, coverage, stamp scars |
| [23-ask.png](23-ask.png) | **Ask** (`L`): same hop strip as Overview (`main → review_roots → …`); agents never stamp |
| [24-night-overview.png](24-night-overview.png) | **Night** Overview (`D`) |
| [25-night-map.png](25-night-map.png) | Night Map |
| [26-night-slice.png](26-night-slice.png) | Night Slice |
