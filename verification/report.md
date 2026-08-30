# Graphide verification

Harness `/scripts/webview-harness.html?mode=explorer&probe=0` (chrome 17) then `/scripts/webview-harness.html?live=1&probe=0&require=1` (self-review of this checkout) served from `extension/`.

**PASS** 30/30

| id | result | title | detail |
| --- | --- | --- | --- |
| G1 | PASS | self-review rust plugin is in play | javascript@0.1.0,python@0.1.0,rust@0.1.0,typescript@0.1.0 |
| G2 | PASS | self-review graph has nodes, edges, and files | nodes=710 edges=3129 files=39 |
| G3 | PASS | self-review graph includes Rust files | rs=321 |
| G4 | PASS | self-review Map altitude is a real community cut, not a lone START | bubbles=915 altitude=145 names=crate::crates::graphide-cli::src::main::ProgressSink::new,crate::crates::graphide-cli::src::main::Cli,crate::crates::graphide-cli::src::main::Cmd,crate::crates::graphide-cli::src::main::ProgressSink,crate::crates::graphide-engine::src::cluster::cluster_with,crate::crates::graphide-engine::src::cluster::coarse_bubbles,crate::crates::graphide-engine::src::cluster::node_coarse_bubble,crate::crates::graphide-engine::src::coverage::changed_nodes_with_sources |
| G5 | PASS | self-review snapshot is this checkout, not the synthetic explorer fixture | nodes=710 edges=3129 |
| H1 | PASS | harness stub acquireVsCodeApi is present |  |
| H2 | PASS | desk mode is on after synthetic programs | {"stub":true,"posts":0,"bright":true,"desk":true,"ws":"overview"} |
| shot:overview.png | PASS | screenshot overview.png is not a black frame | luma=0.960 1440x900 bytes=115369 |
| M1 | PASS | Map workspace is active | map |
| M2 | PASS | Map shows a community map, not a lone START card | cards=12 start=1 comm=0 names=render,integration,origin,lod,bodies,camera |
| M3 | PASS | Program chip seed includes bin main | bin main |
| shot:map.png | PASS | screenshot map.png is not a black frame | luma=0.960 1440x900 bytes=170275 |
| E1 | PASS | Evidence pane is open and labeled | Evidence ScreenshotFormat · src/main.rs:2 |
| E2 | PASS | Evidence clips (overflow hidden, max-width ≤ 380px) | overflow=hidden hidden hidden max-width=380 width=221 |
| E3 | PASS | Evidence does not overlap the object rail | {"overlap":false,"src":{"left":1219,"right":1440,"width":221},"rail":{"left":1019,"right":1219,"width":200,"hidden":false}} |
| E4 | PASS | Evidence has inspect content | 1// solarsim::ScreenshotFormat2fn hop_0() { /* evidence */ } |
| shot:evidence.png | PASS | screenshot evidence.png is not a black frame | luma=0.956 1440x900 bytes=174094 |
| S1 | PASS | Stamp/Skip are enabled on a flow |  |
| S2 | PASS | Stamp/Skip post host messages only (no disk stamp) | [{"type":"stamp","flow":"boot"},{"type":"skip","flow":"boot"}] |
| S3 | PASS | Harness did not write .graphide/stamps/ | absent |
| H3 | PASS | Editor button posts enterNode to the host stub | [{"type":"enterNode","flow":"boot","id":"n0","isLeaf":true}] |
| shot:stamp-host.png | PASS | screenshot stamp-host.png is not a black frame | luma=0.964 1440x900 bytes=168879 |
| R1 | PASS | self-review desk loaded the derived snapshot (not synthetic fallback) | 710 nodes · 3129 edges · 39 files · 1920ms · javascript@0.1.0,python@0.1.0,rust@0.1.0,typescript@0.1.0 |
| R2 | PASS | self-review desk mode is on after live snap | {"desk":true,"bright":true,"status":"710 nodes · 3129 edges · 39 files · 1920ms · javascript@0.1.0,python@0.1.0,rust@"} |
| R3 | PASS | self-review chrome shows this checkout's graph counts | 710 nodes · 3129 edges · 39 files · 1920ms · javascript@0.1.0,python@0.1.0,rust@0.1.0,typescript@0.1.0 |
| R4 | PASS | self-review Map workspace is active | map |
| R5 | PASS | self-review Map shows communities on this repo, not a lone START | cards=24 start=1 comm=0 names=new,idVal,resolveWebviewView,extract,extract_file,derive_repo,main,extract_with |
| R6 | PASS | self-review program chips name a Graphide crate | bin graphide-clilib demolib demo-parentlib extensionlib graphide-enginelib graphide-irlib graphide-pluginlib graphide-pl |
| shot:self-review.png | PASS | screenshot self-review.png is not a black frame | luma=0.967 1440x900 bytes=184090 |
| R7 | PASS | Self-review step did not write .graphide/stamps/ | absent |

Artifacts: `overview.png`, `map.png`, `evidence.png`, `stamp-host.png`, `self-review.png`, `report.md`.

Stamp/skip clicks only prove `window.__vscodePosts`. They do not write `.graphide/stamps/`.
Self-review is `graphide review` of this checkout — not the synthetic explorer fixture.
