# Graphide verification

Harness `/scripts/webview-harness.html?mode=explorer&probe=0` (chrome 17 + Overview / Decisions / Registry / Timeline) then `/scripts/webview-harness.html?live=1&probe=0&require=1` (self-review of this checkout) then `/scripts/webview-harness.html?delta=1&probe=0&require=1&ws=delta` (Architecture Delta on fixtures/demo vs demo-parent) then `/scripts/webview-harness.html?sequence=1&probe=0&require=1&ws=sequence` (Sequence on fixtures/demo) then `/scripts/webview-harness.html?dataflow=1&probe=0&require=1&ws=dataflow` (Data-flow on fixtures/demo) then `/scripts/webview-harness.html?lifecycle=1&probe=0&require=1&ws=lifecycle` (Lifecycle on fixtures/demo) then `/scripts/webview-harness.html?lineage=1&probe=0&require=1&ws=lineage` (Lineage on fixtures/demo) then `/scripts/webview-harness.html?sequence=1&probe=0&require=1&ws=sequence` (Route / Lens on fixtures/demo) served from `extension/`.

**PASS** 218/218

| id | result | title | detail |
| --- | --- | --- | --- |
| G1 | PASS | self-review rust plugin is in play | javascript@0.1.0,python@0.1.0,rust@0.1.0,typescript@0.1.0 |
| G2 | PASS | self-review graph has nodes, edges, and files | nodes=2552 edges=14866 files=62 |
| G3 | PASS | self-review graph includes Rust files | rs=374 |
| G4 | PASS | self-review Map altitude is a real community cut, not a lone START | bubbles=3764 altitude=308 names=crate::fixtures::demo-parent::src::sub::decode,crate::fixtures::demo-parent::src::bus::Bus,crate::fixtures::demo-parent::src::bus::encode,crate::fixtures::demo-parent::src::bus::events,crate::fixtures::demo-parent::src::bus::BroadcastChannel,crate::fixtures::demo::src::sub::decode,crate::fixtures::demo::src::bus::Bus,crate::fixtures::demo::src::bus::flush |
| G5 | PASS | self-review snapshot is this checkout, not the synthetic explorer fixture | nodes=2552 edges=14866 |
| H1 | PASS | harness stub acquireVsCodeApi is present |  |
| H2 | PASS | desk mode is on after synthetic programs | {"stub":true,"posts":0,"bright":true,"desk":true,"ws":"overview"} |
| OV1 | PASS | Overview workspace is active on first paint | overview |
| OV2 | PASS | Overview shows the default-run / control-flow stage | Overview — default run and control-flow graph |
| OV3 | PASS | Overview CFG still mounts shaped XYFlow nodes (not a raw-IR dump) | xy=8 shaped=8 shapes=start,fn,endpoint,end |
| OV4 | PASS | Overview shows Open map and program chips when the product has them | openMap=true chips=bin main |
| shot:overview.png | PASS | screenshot overview.png is not a black frame | luma=0.958 1440x900 bytes=121201 |
| OV5 | PASS | Overview step did not write .graphide/stamps/ | absent |
| DC1 | PASS | Decisions workspace is active | decisions |
| DC2 | PASS | Decisions lists stamps / skips / broken attestations (or honest empty) | cards=4 rejectedbootStamp no longer matches the derived tree. \| deferredlegacySkipped this session — no stamp written. \| rejectedStampBroken · boot1 added · 0 removed h |
| DC3 | PASS | Decisions keeps Stamp/Skip host-only (enabled, no XYFlow list) | {"stamp":true,"skip":true,"xy":0,"strip":true} |
| shot:decisions.png | PASS | screenshot decisions.png is not a black frame | luma=0.951 1440x900 bytes=118902 |
| DC4 | PASS | Decisions step did not write .graphide/stamps/ | absent |
| RG1 | PASS | Registry workspace is active | registry |
| RG2 | PASS | Registry audit rows come from the snapshot (nodes / edges / files / plugin) | rows=5 reviewReview snapshot2050 nodes · 5055 edges · 136 files · rust@0.1.0 · 21041ms xy=0 |
| shot:registry.png | PASS | screenshot registry.png is not a black frame | luma=0.943 1440x900 bytes=91379 |
| RG3 | PASS | Registry step did not write .graphide/stamps/ | absent |
| TL1 | PASS | Timeline workspace is active | timeline |
| TL2 | PASS | Timeline shows parent cut / coverage / stamp scars from the snapshot | items=6 t0parentParent cut1123 nodes changed vs parent (HEAD^ unless overridden) \| t1coverageUncovered1123 changed nodes sit off every proposed tree \| t2brokenbootStamp no longer matches t |
| shot:timeline.png | PASS | screenshot timeline.png is not a black frame | luma=0.950 1440x900 bytes=105042 |
| TL3 | PASS | Timeline step did not write .graphide/stamps/ | absent |
| M1 | PASS | Map workspace is active | map |
| M2 | PASS | Map shows a community map, not a lone START card | cards=12 start=1 comm=0 names=render,integration,origin,lod,bodies,camera |
| M2b | PASS | Map stays community LOD (no XYFlow / raw-IR React nodes) | xy=0 cards=12 |
| M3 | PASS | Program chip seed includes bin main | bin main |
| G1 | PASS | Graph bar controls do not overlap | {"barH":101,"wsEgo":false,"wsPath":false,"wsKinds":false,"egoKinds":false,"wsLegend":false,"kindsLegend":false,"chipHits":0,"cardHits":0,"chips":1,"titleInStage":true,"titleHitsCard":false,"cards":12,"visible":12,"titleInsideViewport":false} |
| G2 | PASS | Map caption sits outside the camera and not on a community card | {"barH":101,"wsEgo":false,"wsPath":false,"wsKinds":false,"egoKinds":false,"wsLegend":false,"kindsLegend":false,"chipHits":0,"cardHits":0,"chips":1,"titleInStage":true,"titleHitsCard":false,"cards":12,"visible":12,"titleInsideViewport":false} |
| G3 | PASS | Fit leaves more than one community card in the stage | visible=12/12 |
| G5 | PASS | Map community cards do not overlap | {"cardHits":0,"visible":12,"cards":12} |
| G6 | PASS | Program chips do not overlap each other or the workspace row | {"chipHits":0,"chips":1,"wsLegend":false,"kindsLegend":false} |
| G4 | PASS | Narrow desk (720) graph bar still does not overlap | {"barH":134,"wsEgo":false,"wsKinds":false,"egoKinds":false,"wsLegend":false,"chipHits":0,"cardHits":0,"visible":12,"cards":12,"spanX":545} |
| G4b | PASS | Narrow desk (720) Map is a grid, not one overlapping column | {"visible":12,"cards":12,"cardHits":0,"spanX":545} |
| G7 | PASS | Opening Evidence still fits more than one community card with no overlap | {"clicked":true,"open":true,"visible":12,"cards":12,"cardHits":0,"chipHits":0} |
| shot:map.png | PASS | screenshot map.png is not a black frame | luma=0.957 1440x900 bytes=175690 |
| N1 | PASS | Night adds .night on html/body and presses #themeNight | {"htmlNight":true,"bodyNight":true,"htmlBright":true,"bodyBright":true,"nightOn":true,"dayOn":false,"seg":true,"cards":12,"visible":12,"xy":0,"preset":"classic"} |
| N1b | PASS | Night keeps .bright (html.bright.night) | {"htmlBright":true,"bodyBright":true} |
| N2 | PASS | Map stays community LOD on Night (xy=0, cards visible) | cards=12 visible=12 xy=0 |
| shot:night.png | PASS | screenshot night.png is not a black frame | luma=0.217 std=0.241 1440x900 bytes=151326 |
| N3 | PASS | Night Map is dark vs day map.png | night=0.217 day=0.957 std=0.241 |
| N4 | PASS | Night does not post a stamp | {"stampPosts":0,"skipPosts":0,"appearance":1} |
| N5 | PASS | D restores Day markers so later suites stay day-safe | {"htmlNight":false,"bodyNight":false,"bright":true,"dayOn":true,"nightOn":false,"cards":12,"xy":0} |
| N6 | PASS | Appearance step did not write .graphide/stamps/ | absent |
| E1 | PASS | Enter-bubble mounts shaped XYFlow nodes (capped, not the raw IR) | xy=24 lit=1 grey=23 shapes=store,fn,type,endpoint |
| E1b | PASS | Enter-bubble XYFlow nodes each carry data-shape | xy=24 shapes=store,fn,type,endpoint |
| shot:enter-bubble.png | PASS | screenshot enter-bubble.png is not a black frame | luma=0.963 1440x900 bytes=146448 |
| EG1 | PASS | Ego toggle is on and hop depth is 1 | {"on":true,"hops":"1"} |
| EG2 | PASS | Enter-bubble Ego lights neighbors (and dims non-neighbors when the cut has them) | {"on":true,"hops":"1","nodes":24,"ego":2,"dim":22,"selected":1,"files":24} |
| EG3 | PASS | 2-hop Ego keeps a wider neighborhood than 1-hop on enter-bubble | 1-hop dim=22 2-hop dim=20 |
| shot:ego.png | PASS | screenshot ego.png is not a black frame | luma=0.958 1440x900 bytes=183475 |
| EG4 | PASS | Ego off removes neighborhood dim | {"on":false,"dim":0} |
| SG2 | PASS | Find filters enter-bubble XYFlow nodes (FQN / file) | {"q":"ScreenshotFormat","nodes":24,"dim":19,"hit":5,"files":24} |
| shot:search.png | PASS | screenshot search.png is not a black frame | luma=0.959 1440x900 bytes=183403 |
| E2 | PASS | Leaf click on enter-bubble opens Evidence | ScreenshotFormat · src/main.rs:2 |
| E3 | PASS | Back from enter-bubble returns to Map community LOD (xy=0) | cards=12 xy=0 |
| SG1 | PASS | Find dims non-matching Map community cards (xy stays 0) | {"q":"render","cards":12,"dim":11,"xy":0} |
| EG3b | PASS | Slice Ego dims non-neighbors; 2-hop is at least as wide as 1-hop | 1-hop={"dim":5,"ego":3,"selected":1} 2-hop={"dim":3,"ego":5} |
| EG7 | PASS | Map altitude is still community LOD after Ego / Find (xy=0) | cards=12 xy=0 |
| E4 | PASS | Enter-bubble step did not write .graphide/stamps/ | absent |
| A1 | PASS | #llmBtn opens #llmPane (Ask) | {"btn":true,"pane":true,"open":true,"close":true,"ask":true,"send":true,"log":true,"overlap":false,"z":"24"} |
| A1b | PASS | Ask pane is not covered by Evidence / ledger / keys / export | {"btn":true,"pane":true,"open":true,"close":true,"ask":true,"send":true,"log":true,"overlap":false,"z":"24"} |
| A2 | PASS | Graph-only Ask answers a flow, hop, or coverage without an LLM host | Tell the start to end control-flow pathStart → features → end: render → integration → origin → lod → bodies → camera → config → ui Control-flow hops: ScreenshotFormat → ext → as_str → SimPosition → SimulationScale → Mass |
| A3 | PASS | Ask does not post a stamp | stampPosts=0 |
| shot:ask.png | PASS | screenshot ask.png is not a black frame | luma=0.948 1440x900 bytes=186965 |
| A4 | PASS | #llmClose hides #llmPane |  |
| A5 | PASS | Escape closes #llmPane |  |
| A6 | PASS | Map altitude is still community LOD after Ask (xy=0) | cards=12 xy=0 |
| A7 | PASS | Ask step did not write .graphide/stamps/ | absent |
| K1 | PASS | ? opens #keysPane (Keys) | {"btn":true,"pane":true,"open":true,"close":true,"z":"28"} |
| K1b | PASS | Keys pane is not covered by Evidence / Ask / export | {"overlap":false,"z":"28"} |
| K2 | PASS | Keys sheet lists / find, ? sheet, S/X stamp/skip, E ego, F present, D day | KeysClose1–9 workspaces/ find · ? this sheetS stamp · X skipP play path · [ ] stepR PATH · L LENS · E egoF present · Style button cycles Classic / Signal / BlueprintD day / night+ − zoom · 0 fit · Backspace back |
| K3 | PASS | Keys does not post a stamp | {"stampPosts":0,"skipPosts":0} |
| shot:keys.png | PASS | screenshot keys.png is not a black frame | luma=0.961 1440x900 bytes=175949 |
| K4 | PASS | #keysClose hides #keysPane |  |
| K5 | PASS | Escape closes #keysPane |  |
| K5b | PASS | Escape closes Keys without closing Evidence | {"keysHidden":true,"evidenceOpen":true} |
| K6 | PASS | Map altitude is still community LOD after Keys (xy=0) | cards=12 xy=0 |
| K6b | PASS | Keys is closed so it does not cover Evidence / ledger / Ask | hidden=true |
| K7 | PASS | Keys step did not write .graphide/stamps/ | absent |
| PW1 | PASS | Map has a start → features → end community path | {"chips":8,"cards":12,"startChip":true,"endChip":true,"startCard":true,"endCard":true,"play":false,"prev":false,"next":false,"pathBtnOn":false,"routePlay":false,"label":"Start → features → end","xy":0} |
| PW1b | PASS | Map path walk is not Route PATH / #routePlay | {"pathBtnOn":false,"routePlay":false} |
| PW2 | PASS | P or #pathWalkBtn starts Map path walk and paints .walk / .here | via=P {"chipWalk":1,"chipHere":1,"cardWalk":1,"playOn":false} |
| PW3 | PASS | ] steps Map path walk to a mid-path community (.walk, not START/END) | {"chipWalk":1,"chipHere":2,"cardWalk":1,"midChip":true,"midCard":true,"chipId":"b-integration","cardId":"b-integration","xy":0,"routeOn":false} |
| shot:path-walk.png | PASS | screenshot path-walk.png is not a black frame | luma=0.959 1440x900 bytes=175033 |
| PW4 | PASS | [ steps Map path walk without writing stamps | {"chipId":"b-render","cardId":"b-render","chipWalk":1,"cardWalk":1,"moved":true,"stampPosts":0,"skipPosts":0,"playOn":false,"xy":0,"cards":12} |
| PW5 | PASS | Pause / stop leaves Map at community LOD (xy=0) | {"playOn":false,"cards":12,"xy":0} |
| PW6 | PASS | Map path walk does not post a stamp or skip | {"stampPosts":0,"skipPosts":0} |
| PW7 | PASS | Map path walk did not write .graphide/stamps/ | absent |
| X1 | PASS | Export menu opens from #exportBtn | {"btn":true,"menu":true,"png":true,"svg":true,"share":true} |
| X2 | PASS | Export PNG was saved and is not a black frame | luma=0.946 std=0.045 1888x533 bytes=83923 |
| X3 | PASS | Export SVG was saved | bytes=117859 |
| X4 | PASS | Share Card is 1200×630 | 1200x630 |
| X5 | PASS | Export filenames do not claim validation | graphide-boot.png graphide-boot.svg graphide-boot-share.png |
| X6 | PASS | Canonical export strips focus / play / search classes | {"cls":"","review":null} |
| X7 | PASS | Export posts exportFile to the host stub (not stamp) | graphide-boot.png,graphide-boot.svg,graphide-boot-share.png |
| X8 | PASS | Export step did not write .graphide/stamps/ | absent |
| P1 | PASS | Style cycle changes data-preset; topology is unchanged | classic → signal-flow cards=12 |
| P2 | PASS | Blueprint preset is on the same Map topology | blueprint cards=12 fn=#1e4d8c |
| P3 | PASS | Day / Night does not change the visual preset | {"before":"blueprint","night":"blueprint","after":"blueprint"} |
| P4 | PASS | Canonical export carries the current preset | {"ok":true,"preset":"blueprint","hasAttr":true} |
| shot:preset-blueprint.png | PASS | screenshot preset-blueprint.png is not a black frame | luma=0.935 1440x900 bytes=176347 |
| P5 | PASS | Presentation Stage fills the viewport and hides graph-bar chrome | {"present":true,"aria":"true","barHidden":true,"w":1440,"h":853,"top":47,"bottom":900,"vw":1440,"vh":900,"headerBottom":47,"fill":true} |
| shot:present.png | PASS | screenshot present.png is not a black frame | luma=0.926 1440x900 bytes=69870 |
| P6 | PASS | S on the stage cycles Style without moving nodes | classic cards=12 |
| P7 | PASS | Escape exits Presentation Stage and restores the desk | {"present":false,"barShown":true,"aria":"false"} |
| P8 | PASS | Present / preset step did not write .graphide/stamps/ | absent |
| M2c | PASS | Slice canvas mounts XYFlow Steiner nodes (capped, not the raw IR) | xy=8 |
| M2d | PASS | Slice XYFlow nodes expose data-shape | n=8 shapes=start,fn,endpoint,end |
| E1 | PASS | Evidence pane is open and labeled | Evidence ScreenshotFormat · src/main.rs:2 |
| E2 | PASS | Evidence clips (overflow hidden, max-width ≤ 380px) | overflow=hidden hidden hidden max-width=380 width=221 |
| E3 | PASS | Evidence does not overlap the object rail | {"overlap":false,"src":{"left":1219,"right":1440,"width":221},"rail":{"left":1019,"right":1219,"width":200,"hidden":false}} |
| E4 | PASS | Evidence has inspect content | 1// solarsim::ScreenshotFormat2fn hop_0() { /* evidence */ } |
| shot:evidence.png | PASS | screenshot evidence.png is not a black frame | luma=0.962 1440x900 bytes=145744 |
| CM1 | PASS | Explorer snap has coverage.uncovered or coverage.changed | unc=1123 changed=1123 2 left0 stamped1 skipped1 brokenCoverage 1123 changed · 1123 uncovered · Review 0 stamped · 1 skipped · 1 broken · 2 pending · e.g. ScreenshotFormat, ext, as_st |
| CM2 | PASS | #inspMeta mark is uncovered or changed (not only —) | mark=uncovered kindTyperole—channel—spansrc/main.rs:2sliceon treecommunityrenderfilesrc/main.rsprogrambin maindegree7markuncovered |
| shot:coverage-mark.png | PASS | screenshot coverage-mark.png is not a black frame | luma=0.963 1440x900 bytes=142450 |
| CM3 | PASS | Coverage-mark step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| S1 | PASS | Stamp/Skip are enabled on a flow |  |
| S2 | PASS | Stamp/Skip post host messages only (no disk stamp) | [{"type":"stamp","flow":"boot"},{"type":"skip","flow":"boot"}] |
| S3 | PASS | Harness did not write .graphide/stamps/ | absent |
| H3 | PASS | Editor button posts enterNode to the host stub | [{"type":"enterNode","flow":"boot","id":"n0","isLeaf":true}] |
| shot:stamp-host.png | PASS | screenshot stamp-host.png is not a black frame | luma=0.962 1440x900 bytes=149394 |
| R1 | PASS | self-review desk loaded the derived snapshot (not synthetic fallback) | 2552 nodes · 14866 edges · 62 files · 84231ms · javascript@0.1.0,python@0.1.0,rust@0.1.0,typescript@0.1.0 |
| R2 | PASS | self-review desk mode is on after live snap | {"desk":true,"bright":true,"status":"2552 nodes · 14866 edges · 62 files · 84231ms · javascript@0.1.0,python@0.1.0,ru"} |
| R3 | PASS | self-review chrome shows this checkout's graph counts | 2552 nodes · 14866 edges · 62 files · 84231ms · javascript@0.1.0,python@0.1.0,rust@0.1.0,typescript@0.1.0 |
| R3b | PASS | self-review lands on Overview when a default run exists | overview |
| R4 | PASS | self-review Map workspace is active | map |
| R5 | PASS | self-review Map shows communities on this repo, not a lone START | cards=24 start=1 comm=0 names=new,c,idVal,resolveWebviewView,main,extract,extract_file,derive_repo |
| R5b | PASS | self-review Map stays community LOD (no XYFlow / 1650 React nodes) | xy=0 cards=24 |
| R5c | PASS | self-review Map caption and graph-bar do not overlap cards / Ego | {"wsEgo":false,"wsLegend":false,"chipHits":0,"cardHits":0,"titleHitsCard":false,"titleInsideViewport":false,"visible":24,"cards":24,"chips":12} |
| R6 | PASS | self-review program chips name a Graphide crate | bin graphide-clilib demolib demo-parentlib extensionlib graphide-enginelib graphide-irlib graphide-pluginlib graphide-pl |
| shot:self-review.png | PASS | screenshot self-review.png is not a black frame | luma=0.963 1440x900 bytes=174912 |
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
| D6c | PASS | Delta XYFlow nodes expose data-shape | n=10 shapes=fn,type,endpoint |
| D7 | PASS | Delta Review walk is finite (stays on last fact, does not loop) | {"i":"0","n":1,"playing":false} |
| shot:delta.png | PASS | screenshot delta.png is not a black frame | luma=0.965 1440x900 bytes=85205 |
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
| shot:sequence.png | PASS | screenshot sequence.png is not a black frame | luma=0.962 1440x900 bytes=105295 |
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
| shot:dataflow.png | PASS | screenshot dataflow.png is not a black frame | luma=0.961 1440x900 bytes=123779 |
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
| shot:lifecycle.png | PASS | screenshot lifecycle.png is not a black frame | luma=0.959 1440x900 bytes=120155 |
| L8 | PASS | Lifecycle step did not write .graphide/stamps/ | absent |
| Y1 | PASS | lineage desk loaded the fixtures/demo snap | lineage |
| Y2 | PASS | Lineage workspace is active | lineage |
| Y3 | PASS | Lineage focus node is present | crate::sub::decode |
| Y4 | PASS | Lineage XYFlow nodes > 1 on a Calls fixture (capped, not the raw IR) | xy=3 hops=2 |
| Y4b | PASS | Lineage XYFlow nodes expose data-shape | n=3 shapes=fn |
| Y5 | PASS | Lineage has upstream and downstream when the fixture has both | up=1 down=1 via=down fqn=crate::sub::decode |
| EG5 | PASS | Lineage Ego stays on; 2-hop walk is at least as wide as 1-hop | 1-hop={"on":true,"hops":"1","xy":3,"ego":3,"focus":1} 2-hop={"hops":"2","xy":3,"ego":3} seed={"on":true,"hops":"1"} |
| SG3 | PASS | Find filters Lineage hops / nodes | {"q":"decode","before":2,"hops":2,"dim":2,"hit":1,"nodes":3} |
| Y6 | PASS | Type/Endpoint lineage shows Reads/Writes/Publishes/Subscribes, not Contains | fqn=crate::bus::events kind=Endpoint kinds=Publishes,Subscribes |
| Y7 | PASS | Evidence still opens from a Lineage node click | Evidence publish · src/bus.rs:4 |
| Y8 | PASS | Map stays community LOD after Lineage (xy=0, cap 24) | xy=0 cards=5 |
| shot:lineage.png | PASS | screenshot lineage.png is not a black frame | luma=0.967 1440x900 bytes=130949 |
| Y9 | PASS | Lineage step did not write .graphide/stamps/ | absent |
| Y10 | PASS | When coverage.changed is present, a changed node is marked | marked=1 fqn=crate::bus::sneaky_helper |
| RT1 | PASS | Route probe opened from R | {"open":true,"btn":true} |
| RT2 | PASS | Route is a derived directed path with at least one hop | hops=1 nodes=2 kinds=Subscribes |
| RT3 | PASS | Route includes subscribe / events (Subscribes) | 1 hops · subscribe → events \| Subscribes subscribe → events |
| RT4 | PASS | Route lights only path nodes (no extra hops) | extra=0 extraLit=0 |
| RT5 | PASS | Route has Play / Next |  |
| RT6 | PASS | Route journey is finite (stays on last hop, does not loop) | {"i":0,"n":1,"playing":false} |
| shot:route.png | PASS | screenshot route.png is not a black frame | luma=0.959 1440x900 bytes=113210 |
| RT7 | PASS | Route step did not write .graphide/stamps/ | absent |
| LN1 | PASS | Lens opened from L | {"open":true,"btn":true} |
| LN2 | PASS | Lens compares Function and Endpoint | roles=Function,Endpoint compare=Function · Endpoint |
| LN3 | PASS | Lens highlights matching nodes | hits=4 lit=4 |
| LN4 | PASS | Lens does not invent a third kind | Function,Endpoint,Function,Endpoint |
| shot:lens.png | PASS | screenshot lens.png is not a black frame | luma=0.956 1440x900 bytes=115842 |
| LN5 | PASS | Lens step did not write .graphide/stamps/ | absent |

Artifacts: `overview.png`, `decisions.png`, `registry.png`, `timeline.png`, `map.png`, `night.png`, `enter-bubble.png`, `ego.png`, `search.png`, `ask.png`, `keys.png`, `path-walk.png`, `evidence.png`, `coverage-mark.png`, `stamp-host.png`, `self-review.png`, `delta.png`, `sequence.png`, `dataflow.png`, `lifecycle.png`, `lineage.png`, `export-desk.png`, `export-desk.svg`, `export-share.png`, `present.png`, `preset-blueprint.png`, `route.png`, `lens.png`, `report.md`.

Stamp/skip clicks only prove `window.__vscodePosts`. They do not write `.graphide/stamps/`.
Self-review is `graphide review` of this checkout — not the synthetic explorer fixture.
