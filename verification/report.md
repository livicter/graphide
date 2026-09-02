# Graphide verification

Harness `/scripts/webview-harness.html?mode=explorer&probe=0` (chrome 17) then `/scripts/webview-harness.html?live=1&probe=0&require=1` (self-review of this checkout) then `/scripts/webview-harness.html?delta=1&probe=0&require=1&ws=delta` (Architecture Delta on fixtures/demo vs demo-parent) then `/scripts/webview-harness.html?sequence=1&probe=0&require=1&ws=sequence` (Sequence on fixtures/demo) then `/scripts/webview-harness.html?dataflow=1&probe=0&require=1&ws=dataflow` (Data-flow on fixtures/demo) then `/scripts/webview-harness.html?lifecycle=1&probe=0&require=1&ws=lifecycle` (Lifecycle on fixtures/demo) then `/scripts/webview-harness.html?lineage=1&probe=0&require=1&ws=lineage` (Lineage on fixtures/demo) then `/scripts/webview-harness.html?sequence=1&probe=0&require=1&ws=sequence` (Route / Lens on fixtures/demo) served from `extension/`.

**PASS** 136/136

| id | result | title | detail |
| --- | --- | --- | --- |
| G1 | PASS | self-review rust plugin is in play | javascript@0.1.0,python@0.1.0,rust@0.1.0,typescript@0.1.0 |
| G2 | PASS | self-review graph has nodes, edges, and files | nodes=2475 edges=13805 files=58 |
| G3 | PASS | self-review graph includes Rust files | rs=374 |
| G4 | PASS | self-review Map altitude is a real community cut, not a lone START | bubbles=3645 altitude=304 names=crate::crates::graphide-cli::src::main::ProgressSink::new,crate::crates::graphide-cli::src::main::Cli,crate::crates::graphide-cli::src::main::Cmd,crate::crates::graphide-cli::src::main::ProgressSink,crate::crates::graphide-engine::src::cluster::cluster_with,crate::crates::graphide-engine::src::cluster::coarse_bubbles,crate::crates::graphide-engine::src::cluster::node_coarse_bubble,crate::crates::graphide-engine::src::coverage::changed_nodes_with_sources |
| G5 | PASS | self-review snapshot is this checkout, not the synthetic explorer fixture | nodes=2475 edges=13805 |
| H1 | PASS | harness stub acquireVsCodeApi is present |  |
| H2 | PASS | desk mode is on after synthetic programs | {"stub":true,"posts":0,"bright":true,"desk":true,"ws":"overview"} |
| shot:overview.png | PASS | screenshot overview.png is not a black frame | luma=0.960 1440x900 bytes=92746 |
| M1 | PASS | Map workspace is active | map |
| M2 | PASS | Map shows a community map, not a lone START card | cards=12 start=1 comm=0 names=render,integration,origin,lod,bodies,camera |
| M2b | PASS | Map stays community LOD (no XYFlow / raw-IR React nodes) | xy=0 cards=12 |
| M3 | PASS | Program chip seed includes bin main | bin main |
| G1 | PASS | Graph bar controls do not overlap | {"barH":76,"wsEgo":false,"wsPath":false,"wsKinds":false,"egoKinds":false,"titleInStage":true,"titleHitsCard":false,"cards":12,"visible":12,"titleInsideViewport":false} |
| G2 | PASS | Map caption sits outside the camera and not on a community card | {"barH":76,"wsEgo":false,"wsPath":false,"wsKinds":false,"egoKinds":false,"titleInStage":true,"titleHitsCard":false,"cards":12,"visible":12,"titleInsideViewport":false} |
| G3 | PASS | Fit leaves more than one community card in the stage | visible=12/12 |
| G4 | PASS | Narrow desk (720) graph bar still does not overlap | {"barH":110,"wsEgo":false,"wsKinds":false,"egoKinds":false} |
| shot:map.png | PASS | screenshot map.png is not a black frame | luma=0.959 1440x900 bytes=139353 |
| X1 | PASS | Export menu opens from #exportBtn | {"btn":true,"menu":true,"png":true,"svg":true,"share":true} |
| X2 | PASS | Export PNG was saved and is not a black frame | luma=0.947 std=0.040 1928x563 bytes=75596 |
| X3 | PASS | Export SVG was saved | bytes=116375 |
| X4 | PASS | Share Card is 1200×630 | 1200x630 |
| X5 | PASS | Export filenames do not claim validation | graphide-boot.png graphide-boot.svg graphide-boot-share.png |
| X6 | PASS | Canonical export strips focus / play / search classes | {"cls":"","review":null} |
| X7 | PASS | Export posts exportFile to the host stub (not stamp) | graphide-boot.png,graphide-boot.svg,graphide-boot-share.png |
| X8 | PASS | Export step did not write .graphide/stamps/ | absent |
| P1 | PASS | Style cycle changes data-preset; topology is unchanged | classic → signal-flow cards=12 |
| P2 | PASS | Blueprint preset is on the same Map topology | blueprint cards=12 fn=#1e4d8c |
| P3 | PASS | Day / Night does not change the visual preset | {"before":"blueprint","night":"blueprint","after":"blueprint"} |
| P4 | PASS | Canonical export carries the current preset | {"ok":true,"preset":"blueprint","hasAttr":true} |
| shot:preset-blueprint.png | PASS | screenshot preset-blueprint.png is not a black frame | luma=0.922 1440x900 bytes=123246 |
| P5 | PASS | Presentation Stage fills the viewport and hides graph-bar chrome | {"present":true,"aria":"true","barHidden":true,"w":1440,"h":853,"top":47,"bottom":900,"vw":1440,"vh":900,"headerBottom":47,"fill":true} |
| shot:present.png | PASS | screenshot present.png is not a black frame | luma=0.926 1440x900 bytes=61193 |
| P6 | PASS | S on the stage cycles Style without moving nodes | classic cards=12 |
| P7 | PASS | Escape exits Presentation Stage and restores the desk | {"present":false,"barShown":true,"aria":"false"} |
| P8 | PASS | Present / preset step did not write .graphide/stamps/ | absent |
| M2c | PASS | Slice canvas mounts XYFlow Steiner nodes (capped, not the raw IR) | xy=8 |
| M2d | PASS | Slice XYFlow nodes expose data-shape | n=8 shapes=start,fn,endpoint,end |
| E1 | PASS | Evidence pane is open and labeled | Evidence ScreenshotFormat · src/main.rs:2 |
| E2 | PASS | Evidence clips (overflow hidden, max-width ≤ 380px) | overflow=hidden hidden hidden max-width=380 width=221 |
| E3 | PASS | Evidence does not overlap the object rail | {"overlap":false,"src":{"left":1219,"right":1440,"width":221},"rail":{"left":1019,"right":1219,"width":200,"hidden":false}} |
| E4 | PASS | Evidence has inspect content | 1// solarsim::ScreenshotFormat2fn hop_0() { /* evidence */ } |
| shot:evidence.png | PASS | screenshot evidence.png is not a black frame | luma=0.964 1440x900 bytes=116239 |
| S1 | PASS | Stamp/Skip are enabled on a flow |  |
| S2 | PASS | Stamp/Skip post host messages only (no disk stamp) | [{"type":"stamp","flow":"boot"},{"type":"skip","flow":"boot"}] |
| S3 | PASS | Harness did not write .graphide/stamps/ | absent |
| H3 | PASS | Editor button posts enterNode to the host stub | [{"type":"enterNode","flow":"boot","id":"n0","isLeaf":true}] |
| shot:stamp-host.png | PASS | screenshot stamp-host.png is not a black frame | luma=0.964 1440x900 bytes=122460 |
| R1 | PASS | self-review desk loaded the derived snapshot (not synthetic fallback) | 2475 nodes · 13805 edges · 58 files · 68356ms · javascript@0.1.0,python@0.1.0,rust@0.1.0,typescript@0.1.0 |
| R2 | PASS | self-review desk mode is on after live snap | {"desk":true,"bright":true,"status":"2475 nodes · 13805 edges · 58 files · 68356ms · javascript@0.1.0,python@0.1.0,ru"} |
| R3 | PASS | self-review chrome shows this checkout's graph counts | 2475 nodes · 13805 edges · 58 files · 68356ms · javascript@0.1.0,python@0.1.0,rust@0.1.0,typescript@0.1.0 |
| R4 | PASS | self-review Map workspace is active | map |
| R5 | PASS | self-review Map shows communities on this repo, not a lone START | cards=24 start=1 comm=0 names=new,c,idVal,resolveWebviewView,main,extract,extract_file,derive_repo |
| R5b | PASS | self-review Map stays community LOD (no XYFlow / 1650 React nodes) | xy=0 cards=24 |
| R5c | PASS | self-review Map caption and graph-bar do not overlap cards / Ego | {"wsEgo":false,"titleHitsCard":false,"titleInsideViewport":false,"visible":24,"cards":24} |
| R6 | PASS | self-review program chips name a Graphide crate | bin graphide-clilib demolib demo-parentlib extensionlib graphide-enginelib graphide-irlib graphide-pluginlib graphide-pl |
| shot:self-review.png | PASS | screenshot self-review.png is not a black frame | luma=0.961 1440x900 bytes=156933 |
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
| D6b | PASS | Delta canvas mounts XYFlow nodes (capped, not the raw IR) | xy=10 |
| D6c | PASS | Delta XYFlow nodes expose data-shape | n=10 shapes=type,fn,endpoint |
| D7 | PASS | Delta Review walk is finite (stays on last fact, does not loop) | {"i":"0","n":1,"playing":false} |
| shot:delta.png | PASS | screenshot delta.png is not a black frame | luma=0.968 1440x900 bytes=64563 |
| D8 | PASS | Delta step did not write .graphide/stamps/ | absent |
| Q0 | PASS | sequence fixture snap has a flow with >1 participant and hops | data-subscription:2p/1h |
| Q0b | PASS | sequence fixture includes subscribe / events (data-subscription) | data-subscription kinds=Subscribes |
| Q1 | PASS | sequence desk loaded the fixtures/demo snap | sequence |
| Q2 | PASS | Sequence workspace is active | sequence |
| Q3 | PASS | Sequence has more than one participant | parts=2 subscribe Function \| events Endpoint \| · Subscribessubscribe → eventscrate::sub::subscribe · src/sub.rs |
| Q4 | PASS | Sequence has an ordered hop list | hops=1 kinds=Subscribes |
| Q5 | PASS | Sequence lists subscribe / events on the demo slice | subscribe Function \| events Endpoint \| · Subscribessubscribe → eventscrate::sub::subscribe · src/sub.rs |
| Q6 | PASS | Sequence has Play / Prev / Next plus canvas | {"play":true,"canvas":true} |
| Q6b | PASS | Sequence canvas mounts XYFlow participant nodes (not the raw IR) | xy=2 parts=2 |
| Q6c | PASS | Sequence XYFlow nodes expose data-shape with fn + endpoint | n=2 shapes=fn,endpoint |
| Q7 | PASS | Sequence Play walk is finite (stays on last hop, does not loop) | {"i":"0","n":1,"playing":false} |
| shot:sequence.png | PASS | screenshot sequence.png is not a black frame | luma=0.965 1440x900 bytes=82814 |
| Q8 | PASS | Sequence step did not write .graphide/stamps/ | absent |
| F0 | PASS | dataflow fixture snap has a flow with Source and Sink hops | data-subscription:3n/2h/store+sink+source |
| F0b | PASS | dataflow fixture includes subscribe / events (data-subscription) | data-subscription kinds=Subscribes,Publishes |
| F1 | PASS | dataflow desk loaded the fixtures/demo snap | dataflow |
| F2 | PASS | Data-flow workspace is active | dataflow |
| F3 | PASS | Data-flow path has a Source and a Sink | roles=store,sink,source DBeventsSink · Channel \| subscribe \| publish |
| F4 | PASS | Data-flow has an ordered hop list | hops=2 kinds=Subscribes,Publishes |
| F5 | PASS | Data-flow lists subscribe / publish / events on the demo slice | DBeventsSink · Channel \| subscribe \| publish \| Subscribesevents → subscribecrate::bus::events · src/sub.rs |
| F6 | PASS | Data-flow has Play / Prev / Next plus canvas | {"play":true,"canvas":true} |
| F6b | PASS | Data-flow canvas mounts XYFlow nodes (capped, not the raw IR) | xy=3 nodes=3 |
| F6c | PASS | Data-flow XYFlow nodes expose data-shape and a store cylinder | n=3 shapes=store,end,start |
| F7 | PASS | Data-flow Play walk is finite (stays on last hop, does not loop) | {"i":"1","n":2,"playing":false} |
| shot:dataflow.png | PASS | screenshot dataflow.png is not a black frame | luma=0.964 1440x900 bytes=98103 |
| F8 | PASS | Data-flow step did not write .graphide/stamps/ | absent |
| L0 | PASS | lifecycle fixture snap has a review machine with recover | data-subscription:6s/6t |
| L0b | PASS | lifecycle fixture includes plugin-visible events Endpoint | data-subscription ends=1 ids=proposed,walking,waiting,stamped,skipped,broken |
| L1 | PASS | lifecycle desk loaded the fixtures/demo snap | lifecycle |
| L2 | PASS | Lifecycle workspace is active | lifecycle |
| L3 | PASS | Lifecycle has proposed / walking / broken states | types=start,active,waiting,success,neutral,failure Proposed \| FNWalking1 hop \| Waitingstamp / skip |
| L4 | PASS | Lifecycle has an ordered event list | events=6 |
| L5 | PASS | Lifecycle recover is broken → walking (and lists events) | Proposed \| FNWalking1 hop \| Waitingstamp / skip \| Stamped |
| L6 | PASS | Lifecycle has Play / Prev / Next plus canvas | {"play":true,"canvas":true} |
| L6b | PASS | Lifecycle canvas mounts XYFlow review-machine nodes | xy=6 states=6 |
| L6c | PASS | Lifecycle XYFlow nodes expose data-shape with start + decision | n=6 shapes=start,fn,decision,end |
| L7 | PASS | Lifecycle Play walk is finite (stays on last event, does not loop) | {"i":"5","n":6,"playing":false} |
| shot:lifecycle.png | PASS | screenshot lifecycle.png is not a black frame | luma=0.962 1440x900 bytes=89378 |
| L8 | PASS | Lifecycle step did not write .graphide/stamps/ | absent |
| Y1 | PASS | lineage desk loaded the fixtures/demo snap | lineage |
| Y2 | PASS | Lineage workspace is active | lineage |
| Y3 | PASS | Lineage focus node is present | crate::sub::decode |
| Y4 | PASS | Lineage XYFlow nodes > 1 on a Calls fixture (capped, not the raw IR) | xy=3 hops=2 |
| Y4b | PASS | Lineage XYFlow nodes expose data-shape | n=3 shapes=fn |
| Y5 | PASS | Lineage has upstream and downstream when the fixture has both | up=1 down=1 via=down fqn=crate::sub::decode |
| Y6 | PASS | Type/Endpoint lineage shows Reads/Writes/Publishes/Subscribes, not Contains | fqn=crate::bus::events kind=Endpoint kinds=Publishes,Subscribes |
| Y7 | PASS | Evidence still opens from a Lineage node click | Evidence publish · src/bus.rs:4 |
| Y8 | PASS | Map stays community LOD after Lineage (xy=0, cap 24) | xy=0 cards=5 |
| shot:lineage.png | PASS | screenshot lineage.png is not a black frame | luma=0.969 1440x900 bytes=111736 |
| Y9 | PASS | Lineage step did not write .graphide/stamps/ | absent |
| Y10 | PASS | When coverage.changed is present, a changed node is marked | marked=1 fqn=crate::bus::sneaky_helper |
| RT1 | PASS | Route probe opened from R | {"open":true,"btn":true} |
| RT2 | PASS | Route is a derived directed path with at least one hop | hops=1 nodes=2 kinds=Subscribes |
| RT3 | PASS | Route includes subscribe / events (Subscribes) | 1 hops · subscribe → events \| Subscribes subscribe → events |
| RT4 | PASS | Route lights only path nodes (no extra hops) | extra=0 extraLit=0 |
| RT5 | PASS | Route has Play / Next |  |
| RT6 | PASS | Route journey is finite (stays on last hop, does not loop) | {"i":0,"n":1,"playing":false} |
| shot:route.png | PASS | screenshot route.png is not a black frame | luma=0.962 1440x900 bytes=88405 |
| RT7 | PASS | Route step did not write .graphide/stamps/ | absent |
| LN1 | PASS | Lens opened from L | {"open":true,"btn":true} |
| LN2 | PASS | Lens compares Function and Endpoint | roles=Function,Endpoint compare=Function · Endpoint |
| LN3 | PASS | Lens highlights matching nodes | hits=4 lit=4 |
| LN4 | PASS | Lens does not invent a third kind | Function,Endpoint,Function,Endpoint |
| shot:lens.png | PASS | screenshot lens.png is not a black frame | luma=0.959 1440x900 bytes=90982 |
| LN5 | PASS | Lens step did not write .graphide/stamps/ | absent |

Artifacts: `overview.png`, `map.png`, `evidence.png`, `stamp-host.png`, `self-review.png`, `delta.png`, `sequence.png`, `dataflow.png`, `lifecycle.png`, `lineage.png`, `export-desk.png`, `export-desk.svg`, `export-share.png`, `present.png`, `preset-blueprint.png`, `route.png`, `lens.png`, `report.md`.

Stamp/skip clicks only prove `window.__vscodePosts`. They do not write `.graphide/stamps/`.
Self-review is `graphide review` of this checkout — not the synthetic explorer fixture.
