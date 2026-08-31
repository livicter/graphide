# Graphide verification

Harness `/scripts/webview-harness.html?mode=explorer&probe=0` (chrome 17) then `/scripts/webview-harness.html?live=1&probe=0&require=1` (self-review of this checkout) then `/scripts/webview-harness.html?delta=1&probe=0&require=1&ws=delta` (Architecture Delta on fixtures/demo vs demo-parent) served from `extension/`.

**PASS** 42/42

| id | result | title | detail |
| --- | --- | --- | --- |
| G1 | PASS | self-review rust plugin is in play | javascript@0.1.0,python@0.1.0,rust@0.1.0,typescript@0.1.0 |
| G2 | PASS | self-review graph has nodes, edges, and files | nodes=737 edges=3371 files=40 |
| G3 | PASS | self-review graph includes Rust files | rs=332 |
| G4 | PASS | self-review Map altitude is a real community cut, not a lone START | bubbles=972 altitude=150 names=crate::crates::graphide-cli::src::main::ProgressSink::new,crate::crates::graphide-cli::src::main::Cli,crate::crates::graphide-cli::src::main::Cmd,crate::crates::graphide-cli::src::main::ProgressSink,crate::crates::graphide-engine::src::cluster::cluster_with,crate::crates::graphide-engine::src::cluster::coarse_bubbles,crate::crates::graphide-engine::src::cluster::node_coarse_bubble,crate::crates::graphide-engine::src::coverage::changed_nodes_with_sources |
| G5 | PASS | self-review snapshot is this checkout, not the synthetic explorer fixture | nodes=737 edges=3371 |
| H1 | PASS | harness stub acquireVsCodeApi is present |  |
| H2 | PASS | desk mode is on after synthetic programs | {"stub":true,"posts":0,"bright":true,"desk":true,"ws":"overview"} |
| shot:overview.png | PASS | screenshot overview.png is not a black frame | luma=0.960 1440x900 bytes=115639 |
| M1 | PASS | Map workspace is active | map |
| M2 | PASS | Map shows a community map, not a lone START card | cards=12 start=1 comm=0 names=render,integration,origin,lod,bodies,camera |
| M3 | PASS | Program chip seed includes bin main | bin main |
| shot:map.png | PASS | screenshot map.png is not a black frame | luma=0.960 1440x900 bytes=170508 |
| E1 | PASS | Evidence pane is open and labeled | Evidence ScreenshotFormat · src/main.rs:2 |
| E2 | PASS | Evidence clips (overflow hidden, max-width ≤ 380px) | overflow=hidden hidden hidden max-width=380 width=221 |
| E3 | PASS | Evidence does not overlap the object rail | {"overlap":false,"src":{"left":1219,"right":1440,"width":221},"rail":{"left":1019,"right":1219,"width":200,"hidden":false}} |
| E4 | PASS | Evidence has inspect content | 1// solarsim::ScreenshotFormat2fn hop_0() { /* evidence */ } |
| shot:evidence.png | PASS | screenshot evidence.png is not a black frame | luma=0.955 1440x900 bytes=174323 |
| S1 | PASS | Stamp/Skip are enabled on a flow |  |
| S2 | PASS | Stamp/Skip post host messages only (no disk stamp) | [{"type":"stamp","flow":"boot"},{"type":"skip","flow":"boot"}] |
| S3 | PASS | Harness did not write .graphide/stamps/ | absent |
| H3 | PASS | Editor button posts enterNode to the host stub | [{"type":"enterNode","flow":"boot","id":"n0","isLeaf":true}] |
| shot:stamp-host.png | PASS | screenshot stamp-host.png is not a black frame | luma=0.964 1440x900 bytes=169189 |
| R1 | PASS | self-review desk loaded the derived snapshot (not synthetic fallback) | 737 nodes · 3371 edges · 40 files · 2160ms · javascript@0.1.0,python@0.1.0,rust@0.1.0,typescript@0.1.0 |
| R2 | PASS | self-review desk mode is on after live snap | {"desk":true,"bright":true,"status":"737 nodes · 3371 edges · 40 files · 2160ms · javascript@0.1.0,python@0.1.0,rust@"} |
| R3 | PASS | self-review chrome shows this checkout's graph counts | 737 nodes · 3371 edges · 40 files · 2160ms · javascript@0.1.0,python@0.1.0,rust@0.1.0,typescript@0.1.0 |
| R4 | PASS | self-review Map workspace is active | map |
| R5 | PASS | self-review Map shows communities on this repo, not a lone START | cards=24 start=1 comm=0 names=new,idVal,resolveWebviewView,extract,extract_file,main,derive_repo,extract_with |
| R6 | PASS | self-review program chips name a Graphide crate | bin graphide-clilib demolib demo-parentlib extensionlib graphide-enginelib graphide-irlib graphide-pluginlib graphide-pl |
| shot:self-review.png | PASS | screenshot self-review.png is not a black frame | luma=0.967 1440x900 bytes=183633 |
| R7 | PASS | Self-review step did not write .graphide/stamps/ | absent |
| D0 | PASS | delta fixture snap has Architecture Delta facts | facts=1 |
| D0b | PASS | delta fixture includes added crate::bus::sneaky_helper | crate::bus::sneaky_helper |
| D0c | PASS | delta fixture snap carries a parent graph | parent.nodes=9 |
| D1 | PASS | delta desk loaded the demo vs demo-parent snap | delta |
| D2 | PASS | Delta workspace is active | delta |
| D3 | PASS | Delta fact list is not empty on demo vs demo-parent | facts=1 kinds=added |
| D4 | PASS | Delta lists added crate::bus::sneaky_helper | + addedFunction · crate::bus::sneaky_helpernew derived Function |
| D5 | PASS | Delta has Before / Delta / After plus Review walk controls | {"views":["before","delta","after"],"play":true,"canvas":true} |
| D6 | PASS | Delta canvas three-state lands on Delta after the switcher | delta |
| D7 | PASS | Delta Review walk is finite (stays on last fact, does not loop) | {"i":"0","n":1,"playing":false} |
| shot:delta.png | PASS | screenshot delta.png is not a black frame | luma=0.959 1440x900 bytes=88359 |
| D8 | PASS | Delta step did not write .graphide/stamps/ | absent |

Artifacts: `overview.png`, `map.png`, `evidence.png`, `stamp-host.png`, `self-review.png`, `delta.png`, `report.md`.

Stamp/skip clicks only prove `window.__vscodePosts`. They do not write `.graphide/stamps/`.
Self-review is `graphide review` of this checkout — not the synthetic explorer fixture.
