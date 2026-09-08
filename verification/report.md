# Graphide verification

Harness `/scripts/webview-harness.html?mode=explorer&probe=0` (chrome 17 + Overview / Decisions / Registry / Timeline) then `/scripts/webview-harness.html?live=1&probe=0&require=1` (self-review of this checkout) then `/scripts/webview-harness.html?delta=1&probe=0&require=1&ws=delta` (Architecture Delta on fixtures/demo vs demo-parent) then `/scripts/webview-harness.html?sequence=1&probe=0&require=1&ws=sequence` (Sequence on fixtures/demo) then `/scripts/webview-harness.html?dataflow=1&probe=0&require=1&ws=dataflow` (Data-flow on fixtures/demo) then `/scripts/webview-harness.html?lifecycle=1&probe=0&require=1&ws=lifecycle` (Lifecycle on fixtures/demo) then `/scripts/webview-harness.html?lineage=1&probe=0&require=1&ws=lineage` (Lineage on fixtures/demo) then `/scripts/webview-harness.html?sequence=1&probe=0&require=1&ws=sequence` (Route / Lens on fixtures/demo) then `/scripts/webview-harness.html?python=1&probe=0&require=1&ws=dataflow` (Python desk on fixtures/python) served from `extension/`.

**PASS** 381/381

| id | result | title | detail |
| --- | --- | --- | --- |
| G1 | PASS | self-review rust plugin is in play | javascript@0.1.0,python@0.1.0,rust@0.1.0,typescript@0.1.0 |
| G2 | PASS | self-review graph has nodes, edges, and files | nodes=2686 edges=15862 files=64 |
| G3 | PASS | self-review graph includes Rust files | rs=395 |
| G4 | PASS | self-review Map altitude is a real community cut, not a lone START | bubbles=3987 altitude=333 names=fixtures.python.pkg.bus.BroadcastChannel,fixtures.python.pkg.bus.Bus.publish,fixtures.python.pkg.bus.Bus,fixtures.python.pkg.bus.publish,fixtures.python.pkg.sub.decode,crate::fixtures::demo-parent::src::sub::decode,crate::fixtures::demo-parent::src::bus::Bus,crate::fixtures::demo-parent::src::bus::encode |
| G5 | PASS | self-review snapshot is this checkout, not the synthetic explorer fixture | nodes=2686 edges=15862 |
| H1 | PASS | harness stub acquireVsCodeApi is present |  |
| H2 | PASS | desk mode is on after synthetic programs | {"stub":true,"posts":0,"bright":true,"desk":true,"ws":"overview"} |
| OV1 | PASS | Overview workspace is active on first paint | overview |
| OV2 | PASS | Overview shows the default-run / control-flow stage | Overview — default run and control-flow graph |
| OV3 | PASS | Overview CFG still mounts shaped XYFlow nodes (not a raw-IR dump) | xy=29 shaped=29 shapes=start,fn,endpoint,end,store |
| OV4 | PASS | Overview shows Open map and program chips when the product has them | openMap=true chips=bin main |
| shot:overview.png | PASS | screenshot overview.png is not a black frame | luma=0.957 1440x900 bytes=128508 |
| OV5 | PASS | Overview step did not write .graphide/stamps/ | absent |
| DC1 | PASS | Decisions workspace is active | decisions |
| DC2 | PASS | Decisions lists stamps / skips / broken attestations (or honest empty) | cards=4 rejectedbootStamp no longer matches the derived tree. \| deferredlegacySkipped this session — no stamp written. \| rejectedStampBroken · boot1 added · 0 removed h |
| DC3 | PASS | Decisions keeps Stamp/Skip host-only (enabled, no XYFlow list) | {"stamp":true,"skip":true,"xy":0,"strip":true} |
| shot:decisions.png | PASS | screenshot decisions.png is not a black frame | luma=0.951 1440x900 bytes=118898 |
| DC4 | PASS | Decisions step did not write .graphide/stamps/ | absent |
| UH1 | PASS | #coverage li.finding surfaces unmatched solarsim::MissingHit in boot | {"ws":"decisions","unmatched":"unmatched solarsim::MissingHit in boot","findings":["stamp broken boot · +1 / −0","unmatched solarsim::MissingHit in boot"]} |
| UH2 | PASS | Decisions lists UnmatchedHint (distinct from StampBroken) | {"hint":"UnmatchedHint · boot · MissingHit","body":"solarsim::MissingHit","outcome":"pending","broken":"StampBroken · boot"} |
| UH3 | PASS | Unmatched-hint step keeps Map community LOD (xy=0) | xy=0 cards=0 |
| shot:unmatched-hint.png | PASS | screenshot unmatched-hint.png is not a black frame | luma=0.954 1440x900 bytes=124127 |
| UH4 | PASS | Unmatched-hint step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| UH5 | PASS | Unmatched-hint step did not write .graphide/stamps/ | absent |
| OS1 | PASS | Decision record exposes Open slice for the selected flow | {"flow":"boot","label":"Open slice","ws":"decisions"} |
| OS2 | PASS | Open slice lands on Slice workspace | {"ws":"slice","sliceOn":true} |
| OS3 | PASS | Slice flow matches data-open-slice | {"target":"boot","flow":"boot","tab":"bootbroken","vnodes":58} |
| shot:open-slice.png | PASS | screenshot open-slice.png is not a black frame | luma=0.963 1440x900 bytes=130710 |
| OS4 | PASS | Open-slice step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| OS5 | PASS | Open-slice step did not write .graphide/stamps/ | absent |
| RG1 | PASS | Registry workspace is active | registry |
| RG2 | PASS | Registry audit rows come from the snapshot (nodes / edges / files / plugin) | rows=5 reviewReview snapshot2050 nodes · 5055 edges · 136 files · rust@0.1.0 · 21041ms xy=0 |
| shot:registry.png | PASS | screenshot registry.png is not a black frame | luma=0.943 1440x900 bytes=91327 |
| RG3 | PASS | Registry step did not write .graphide/stamps/ | absent |
| TL1 | PASS | Timeline workspace is active | timeline |
| TL2 | PASS | Timeline shows parent cut / coverage / stamp scars from the snapshot | items=6 t0parentParent cut1123 nodes changed vs parent (HEAD^ unless overridden) \| t1coverageUncovered1123 changed nodes sit off every proposed treeCopy draft[[flow]] name = "uncovered" hi |
| shot:timeline.png | PASS | screenshot timeline.png is not a black frame | luma=0.949 1440x900 bytes=104604 |
| TL3 | PASS | Timeline step did not write .graphide/stamps/ | absent |
| UN1 | PASS | #coverage surfaces Coverage N changed · N uncovered (no UncoveredNode dump) | {"ws":"timeline","chip":"Coverage 1123 changed · 1123 uncovered · Review 0 stamped · 1 skipped · 1 broken · 2 pending · e.g. ScreenshotFormat, ext, as_str +1120","changed":1123,"uncovered":1123} |
| UN2 | PASS | Timeline lists Uncovered (changed nodes off every proposed tree) | {"title":"Uncovered","body":"1123 changed nodes sit off every proposed tree","kind":"coverage","now":true,"scrub":"t1 · Uncovered"} |
| UN3 | PASS | Uncovered-node step keeps Map community LOD (xy=0) | xy=0 cards=0 |
| shot:uncovered-node.png | PASS | screenshot uncovered-node.png is not a black frame | luma=0.956 1440x900 bytes=109813 |
| UN4 | PASS | Uncovered-node step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| UN5 | PASS | Uncovered-node step did not write .graphide/stamps/ | absent |
| DH1 | PASS | Timeline Uncovered exposes Copy draft on the selected item | {"ws":"timeline","now":true,"btn":"Copy draft"} |
| DH2 | PASS | Draft hint is a [[flow]] hits list with an uncovered FQN | [[flow]] name = "uncovered" hits = ["solarsim::ScreenshotFormat", "solarsim::ext", "solarsim::as_str", "solarsim::SimPosition", "solarsim::SimulationScale", "solarsim::Mass", "solarsim::Velocity", "solarsim::Body"] |
| DH3 | PASS | Draft-hint step keeps Map community LOD (xy=0) | xy=0 cards=0 |
| shot:draft-hint.png | PASS | screenshot draft-hint.png is not a black frame | luma=0.956 1440x900 bytes=112647 |
| DH4 | PASS | Draft-hint step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| DH5 | PASS | Draft-hint step did not write .graphide/stamps/ | absent |
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
| shot:map.png | PASS | screenshot map.png is not a black frame | luma=0.957 1440x900 bytes=175015 |
| FR1 | PASS | Fit (#zoomFit or 0) leaves Map community LOD with more than one card visible | via=zoomFit {"cards":12,"visible":12,"cardHits":0,"xy":0,"comm":0,"ws":"map","fitBtn":true,"reorgBtn":true} |
| FR2 | PASS | Fit does not regress Map card overlap (G5) | {"cardHits":0,"visible":12,"cards":12} |
| FR3 | PASS | Reorganize (#reorgBtn) runs without stamp / skip posts | via=reorgBtn {"cards":12,"visible":12,"cardHits":0,"xy":0,"comm":0,"stampPosts":0,"skipPosts":0,"toast":"Reorganized"} |
| FR4 | PASS | Reorganize keeps Map community LOD and cards (stable or >1) | before=12 {"cards":12,"visible":12,"cardHits":0,"xy":0,"comm":0,"stampPosts":0,"skipPosts":0,"toast":"Reorganized"} |
| shot:fit-reorg.png | PASS | screenshot fit-reorg.png is not a black frame | luma=0.957 1440x900 bytes=177851 |
| FR5 | PASS | Fit / Reorganize did not write .graphide/stamps/ | absent |
| Z1 | PASS | Zoom in (#zoomIn) raises percent / scale; Map stays community LOD | via=zoomIn before={"pct":63,"pctText":"63% · overview","k":0.6292372881355932,"kTf":0.629237,"cards":12,"visible":12,"xy":0,"comm":0,"ws":"map","zoomIn":true,"zoomOut":true} after={"pct":76,"pctText":"76% · labels","k":0.7550847457627118,"kTf":0.755085,"cards":12,"visible":12,"xy":0,"comm":0,"ws":"map","zoomIn":true,"zoomOut":true} |
| shot:zoom.png | PASS | screenshot zoom.png is not a black frame | luma=0.956 1440x900 bytes=182849 |
| Z2 | PASS | Zoom out (#zoomOut) lowers percent / scale; Map stays community LOD | via=zoomOut in={"pct":76,"pctText":"76% · labels","k":0.7550847457627118,"kTf":0.755085,"cards":12,"visible":12,"xy":0,"comm":0,"ws":"map","zoomIn":true,"zoomOut":true} out={"pct":63,"pctText":"63% · overview","k":0.6292372881355932,"cards":12,"visible":12,"xy":0,"comm":0,"stampPosts":0,"skipPosts":0,"ws":"map"} |
| Z3 | PASS | Zoom in / out does not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| Z4 | PASS | Zoom did not write .graphide/stamps/ | absent |
| RC0 | PASS | Map paints communities before recycle | {"cards":12,"xy":0,"comm":0,"lod":"0","k":0.6292372881355932,"ws":"map"} |
| RC1 | PASS | Re-select Map recycles the same .stage / .viewport (keepCam) | {"sameStage":true,"sameVp":true,"cards":12,"xy":0,"comm":0,"lod":"0","k":0.7550847457627118,"wantK":0.7550847457627118,"ws":"map"} |
| RC2 | PASS | Preview / patch recycles Map stage and keeps the camera | {"sameStage":true,"sameVp":true,"cards":12,"xy":0,"comm":0,"lod":"0","k":0.6312886785911643,"stampPosts":0,"skipPosts":0,"ws":"map"} |
| RC3 | PASS | Recycle does not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| shot:canvas-recycle.png | PASS | screenshot canvas-recycle.png is not a black frame | luma=0.953 1440x900 bytes=175612 |
| RC4 | PASS | Canvas recycle did not write .graphide/stamps/ | absent |
| DA0 | PASS | Map paints communities before a coverage-only patch | {"cards":12,"xy":0,"comm":0,"lod":"0","k":0.6292372881355932,"cov":"2 left0 stamped1 skipped1 brokenCoverage 1123 changed · 1123 uncovered · Review 0 stamped · 1 skipped · 1 broken · 2 pending · e.g. ScreenshotFormat, ext, as_str +1120stamp broken boot · +1 / −0unmatched solarsim::MissingHit in boot","ws":"map"} |
| DA1 | PASS | Coverage/findings-only patch keeps the same .stage / .viewport and camera | {"sameStage":true,"sameVp":true,"cards":12,"xy":0,"comm":0,"lod":"0","k":0.6292372881355932,"wantK":0.6292372881355932,"cov":"2 left0 stamped1 skipped1 brokenCoverage 1 changed · 3 uncovered · Review 0 stamped · 1 skipped · 1 broken · 2 pending · e.g. Body, SelectedEntity, PilotModeunmatched solarsim::MissingHit in bootunmatched graphide::OnAnalysisDelta in boot","stampPosts":0,"skipPosts":0,"ws":"map"} |
| DA2 | PASS | Coverage-only patch updates #coverage without posting stamp / skip | {"cov":"2 left0 stamped1 skipped1 brokenCoverage 1 changed · 3 uncovered · Review 0 stamped · 1 skipped · 1 broken · 2 pending · e.g. Body, SelectedEntity, PilotModeunmatched solarsim::MissingHit in bootunmatched graphide::OnAnalysisDelta in boot","stampPosts":0,"skipPosts":0} |
| shot:delta-onanalysis.png | PASS | screenshot delta-onanalysis.png is not a black frame | luma=0.957 1440x900 bytes=176117 |
| DA3 | PASS | Delta onAnalysis did not write .graphide/stamps/ | absent |
| OV0 | PASS | Map paints communities before off-view park | {"cards":12,"off":0,"parked":0,"inStage":12,"ids":["b-render","b-integration","b-origin","b-lod","b-bodies","b-camera","b-config","b-ui","b-physics","b-assets","b-input","b-debug"],"offIds":[],"xy":0,"comm":0,"lod":"0","ws":"map"} |
| OV1 | PASS | Zoom/pan parks off-stage community cards (data-offview) | {"cards":12,"off":4,"parked":4,"inStage":8,"ids":["b-render","b-integration","b-origin","b-lod","b-bodies","b-camera","b-config","b-ui","b-physics","b-assets","b-input","b-debug"],"offIds":["b-render","b-camera","b-config","b-debug"],"xy":0,"comm":0,"lod":"0","ws":"map"} |
| OV2 | PASS | Recycle keeps parked data-bubble identity at community LOD | {"parkedIds":["b-render","b-camera","b-config","b-debug"],"recycle":{"cards":12,"off":4,"parked":4,"inStage":8,"ids":["b-render","b-integration","b-origin","b-lod","b-bodies","b-camera","b-config","b-ui","b-physics","b-assets","b-input","b-debug"],"offIds":["b-render","b-camera","b-config","b-debug"],"xy":0,"comm":0,"lod":"0","ws":"map"}} |
| shot:map-offview.png | PASS | screenshot map-offview.png is not a black frame | luma=0.954 1440x900 bytes=187554 |
| OV3 | PASS | Fit / pan-back restores parked cards (same data-bubble) | via=zoomFit parked=b-render,b-camera,b-config,b-debug {"cards":12,"off":0,"parked":0,"inStage":12,"ids":["b-render","b-integration","b-origin","b-lod","b-bodies","b-camera","b-config","b-ui","b-physics","b-assets","b-input","b-debug"],"offIds":[],"xy":0,"comm":0,"lod":"0","ws":"map"} |
| OV4 | PASS | Off-view park does not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| OV5 | PASS | Map off-view did not write .graphide/stamps/ | absent |
| PT0 | PASS | Map paints communities before a fat coverage/findings patch | {"cards":12,"xy":0,"comm":0,"lod":"0","shed":null,"ws":"map","stampOn":false} |
| PT1 | PASS | Fat panel patch keeps the same .stage / .viewport and sheds findings expansion | {"sameStage":true,"sameVp":true,"cards":12,"xy":0,"comm":0,"lod":"0","shed":"shed","findings":0,"cov":"2 left0 stamped1 skipped1 brokenCoverage 80 changed · 80 uncovered · Review 0 stamped · 1 skipped · 1 broken · 2 pending","hasTimeout":false,"stampPosts":0,"skipPosts":0,"ws":"map"} |
| shot:panel-timeout.png | PASS | screenshot panel-timeout.png is not a black frame | luma=0.959 1440x900 bytes=172130 |
| PT2 | PASS | Zoom handler fires after shed without waiting on the full findings list | {"enabled":true,"via":"zoomIn","k0":0.6292372881355932,"k":0.7550847457627118,"pct0":"63% · overview","pct":"76% · labels","sameStage":true,"sameVp":true,"shed":"shed","lod":"0","xy":0,"comm":0,"cards":12,"ws":"map"} |
| PT3 | PASS | Fat panel patch itself does not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| PT4 | PASS | Panel timeout did not write .graphide/stamps/ | absent |
| PC0 | PASS | explorer program chips: single-chip honest path; skip multi unless a second chip exists | single-chip skip multi chips=bin main |
| AP0 | PASS | explorer All programs: absent on single-chip; skip union unless All programs exists | honest skip All programs absent chips=bin main |
| FT0 | PASS | explorer has two or more #tabs .tab[data-flow] chips | overview,control-flow,boot |
| FT1 | PASS | first flow tab is the current Steiner cut | {"flow":"control-flow","ws":"slice","meta":"Map / control-flow · 8 on tree live preview","slice":58} |
| FT2 | PASS | second #tabs .tab moves .on and selectFlow posts | {"first":"control-flow","second":"boot","posts":["control-flow","boot"]} |
| FT3 | PASS | visible Steiner cut changed (title, hops, start/end, or Slice lit) | {"title":true,"hops":false,"ends":false,"lit":false,"tree":false,"firstMeta":"Map / control-flow · 8 on tree live preview","secondMeta":"Map / boot · 8 on tree live preview broken"} |
| shot:flow-tabs.png | PASS | screenshot flow-tabs.png is not a black frame | luma=0.963 1440x900 bytes=132674 |
| FT4 | PASS | flow-tab switch does not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| FT5 | PASS | flow-tab switch did not write .graphide/stamps/ | absent |
| FT6 | PASS | flow-tab step returns Map to community LOD (xy=0) | {"ws":"map","xy":0,"cards":12,"comm":0} |
| GY0 | PASS | flow tab is present so Slice grey-out has a Steiner | {"flow":"control-flow","clicked":true} |
| GY1 | PASS | on-tree Slice nodes are lit (data-lit=1 / .vnode.lit) | {"ws":"slice","flow":"control-flow","lit":8,"litZero":8,"sample":["n0:0","n1:0","n2:0"]} |
| GY2 | PASS | off-slice neighbors stay visible but grey (data-lit=0 / .grey / .slice-dim) | {"n":29,"grey":21,"greyFar":21,"sample":["n10:1","n1171:1","n1172:1"]} |
| shot:slice-grey.png | PASS | screenshot slice-grey.png is not a black frame | luma=0.963 1440x900 bytes=131268 |
| GY3 | PASS | Slice grey-out does not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| GY4 | PASS | Slice grey-out did not write .graphide/stamps/ | absent |
| GY5 | PASS | Slice grey-out did not write fixtures/demo/flows.toml | [[flow]] name = "data-subscription" hits = ["crate::sub::subscribe", "crate::bus::events"]  |
| GY6 | PASS | Slice grey-out returns Map to community LOD (xy=0) | {"ws":"map","xy":0,"cards":12,"comm":0} |
| PG1 | PASS | #progress is on after a synthetic progress message | {"on":true,"ws":"map","cards":12} |
| PG2 | PASS | Cluster phase is .on; Scan / Extract / Link are .done | [{"phase":"walk","on":false,"done":true,"text":"Scan"},{"phase":"extract","on":false,"done":true,"text":"Extract"},{"phase":"link","on":false,"done":true,"text":"Link"},{"phase":"cluster","on":true,"done":false,"text":"Cluster"},{"phase":"flows","on":false,"done":false,"text":"Flows"}] |
| PG3 | PASS | #progressFill / #progressPct / #progressLabel update | {"label":"Clustering communities…","counts":"3/5","pct":"62%","fill":"62%","time":"1.8s"} |
| PG4 | PASS | Progress strip keeps Map community LOD (xy=0) | xy=0 cards=12 |
| shot:progress.png | PASS | screenshot progress.png is not a black frame | luma=0.953 1440x900 bytes=173334 |
| PG5 | PASS | Clearing progress hides the strip and restores the desk | {"on":false,"phasesOn":0,"fillW":"0%","xy":0,"cards":12,"reviewShown":true,"cancelHidden":true,"stampPosts":0,"skipPosts":0} |
| PG6 | PASS | Progress step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| PG7 | PASS | Progress step did not write .graphide/stamps/ | absent |
| CR1 | PASS | #cancelBtn is visible while the progress strip is on | {"on":true,"cancelShown":true,"reviewHidden":true,"ws":"map"} |
| CR2 | PASS | Click #cancelBtn posts { type: "cancel" } and labels Cancelling… | {"cancelPosts":1,"label":"Cancelling…","on":true,"stampPosts":0,"skipPosts":0} |
| CR3 | PASS | Cancelled reply hides the strip and restores Review | {"on":false,"reviewShown":true,"cancelHidden":true,"xy":0,"cards":12,"ws":"map","stampPosts":0,"skipPosts":0} |
| CR4 | PASS | Cancel review keeps Map community LOD (xy=0) | xy=0 cards=12 |
| shot:cancel-review.png | PASS | screenshot cancel-review.png is not a black frame | luma=0.955 1440x900 bytes=175609 |
| CR5 | PASS | Cancel-review step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| CR6 | PASS | Cancel-review step did not write .graphide/stamps/ | absent |
| N1 | PASS | Night adds .night on html/body and presses #themeNight | {"htmlNight":true,"bodyNight":true,"htmlBright":true,"bodyBright":true,"nightOn":true,"dayOn":false,"seg":true,"cards":12,"visible":12,"xy":0,"preset":"classic"} |
| N1b | PASS | Night keeps .bright (html.bright.night) | {"htmlBright":true,"bodyBright":true} |
| N2 | PASS | Map stays community LOD on Night (xy=0, cards visible) | cards=12 visible=12 xy=0 |
| shot:night.png | PASS | screenshot night.png is not a black frame | luma=0.217 std=0.242 1440x900 bytes=147217 |
| N3 | PASS | Night Map is dark vs day map.png | night=0.217 day=0.957 std=0.242 |
| N4 | PASS | Night does not post a stamp | {"stampPosts":0,"skipPosts":0,"appearance":1} |
| N5 | PASS | D restores Day markers so later suites stay day-safe | {"htmlNight":false,"bodyNight":false,"bright":true,"dayOn":true,"nightOn":false,"cards":12,"xy":0} |
| N6 | PASS | Appearance step did not write .graphide/stamps/ | absent |
| E1 | PASS | Enter-bubble mounts shaped XYFlow nodes (capped, not the raw IR) | xy=24 lit=1 grey=23 shapes=store,fn,type,endpoint |
| E1b | PASS | Enter-bubble XYFlow nodes each carry data-shape | xy=24 shapes=store,fn,type,endpoint |
| shot:enter-bubble.png | PASS | screenshot enter-bubble.png is not a black frame | luma=0.963 1440x900 bytes=149295 |
| EG1 | PASS | Ego toggle is on and hop depth is 1 | {"on":true,"hops":"1"} |
| EG2 | PASS | Enter-bubble Ego lights neighbors (and dims non-neighbors when the cut has them) | {"on":true,"hops":"1","nodes":24,"ego":2,"dim":22,"selected":1,"files":24} |
| EG3 | PASS | 2-hop Ego keeps a wider neighborhood than 1-hop on enter-bubble | 1-hop dim=22 2-hop dim=20 |
| shot:ego.png | PASS | screenshot ego.png is not a black frame | luma=0.958 1440x900 bytes=186939 |
| EG4 | PASS | Ego off removes neighborhood dim | {"on":false,"dim":0} |
| SG2 | PASS | Find filters enter-bubble XYFlow nodes (FQN / file) | {"q":"ScreenshotFormat","nodes":24,"dim":19,"hit":5,"files":24} |
| shot:search.png | PASS | screenshot search.png is not a black frame | luma=0.959 1440x900 bytes=186441 |
| E2 | PASS | Leaf click on enter-bubble opens Evidence | ScreenshotFormat · src/main.rs:2 |
| E3 | PASS | Back from enter-bubble returns to Map community LOD (xy=0) | cards=12 xy=0 |
| SG1 | PASS | Find dims non-matching Map community cards (xy stays 0) | {"q":"render","cards":12,"dim":11,"xy":0} |
| EG3b | PASS | Slice Ego dims non-neighbors; 2-hop is at least as wide as 1-hop | 1-hop={"dim":24,"ego":5,"selected":1} 2-hop={"dim":17,"ego":12} |
| EG7 | PASS | Map altitude is still community LOD after Ego / Find (xy=0) | cards=12 xy=0 |
| E4 | PASS | Enter-bubble step did not write .graphide/stamps/ | absent |
| KF0 | PASS | Find rail has Function / Type / Endpoint kind pills, all checked | [{"kind":"Function","checked":true,"off":false},{"kind":"Type","checked":true,"off":false},{"kind":"Endpoint","checked":true,"off":false}] |
| KF1 | PASS | All three checked: rail shows Function / Type / Endpoint mixed (or honest Function-only baseline) | {"nodeKinds":["Type","Function","Endpoint"],"ledgerKinds":["Type","Function","Endpoint"],"honestFnOnly":false} |
| KF2 | PASS | Uncheck Type + Endpoint: only Function kinds remain visible | {"nodeKinds":["Function"],"ledgerKinds":["Function"],"pills":[{"kind":"Function","checked":true,"off":false},{"kind":"Type","checked":false,"off":true},{"kind":"Endpoint","checked":false,"off":true}]} |
| shot:kind-filters.png | PASS | screenshot kind-filters.png is not a black frame | luma=0.962 1440x900 bytes=151629 |
| KF3 | PASS | Uncheck Function, leave Type: only Type kinds remain visible | {"nodeKinds":["Type"],"ledgerKinds":["Type"],"typeCutReady":true,"honestFnOnly":false} |
| KF4 | PASS | Restore all three kind pills | [{"kind":"Function","checked":true,"off":false},{"kind":"Type","checked":true,"off":false},{"kind":"Endpoint","checked":true,"off":false}] |
| KF5 | PASS | Map altitude is still community LOD after kind filters (xy=0) | {"cards":12,"xy":0,"ws":"map","stampPosts":0,"skipPosts":0} |
| KF6 | PASS | Kind filters do not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| KF7 | PASS | Kind filters did not write .graphide/stamps/ | absent |
| A1 | PASS | #llmBtn opens #llmPane (Ask) | {"btn":true,"pane":true,"open":true,"close":true,"ask":true,"send":true,"log":true,"overlap":false,"z":"24"} |
| A1b | PASS | Ask pane is not covered by Evidence / ledger / keys / export | {"btn":true,"pane":true,"open":true,"close":true,"ask":true,"send":true,"log":true,"overlap":false,"z":"24"} |
| A2 | PASS | Graph-only Ask answers a flow, hop, or coverage without an LLM host | Tell the start to end control-flow pathStart → features → end: render → integration → origin → lod → bodies → camera → config → ui Control-flow hops: ScreenshotFormat → ext → as_str → SimPosition → SimulationScale → Mass |
| A3 | PASS | Ask does not post a stamp | stampPosts=0 |
| shot:ask.png | PASS | screenshot ask.png is not a black frame | luma=0.948 1440x900 bytes=186734 |
| A4 | PASS | #llmClose hides #llmPane |  |
| A5 | PASS | Escape closes #llmPane |  |
| A6 | PASS | Map altitude is still community LOD after Ask (xy=0) | cards=12 xy=0 |
| A7 | PASS | Ask step did not write .graphide/stamps/ | absent |
| K1 | PASS | ? opens #keysPane (Keys) | {"btn":true,"pane":true,"open":true,"close":true,"z":"28"} |
| K1b | PASS | Keys pane is not covered by Evidence / Ask / export | {"overlap":false,"z":"28"} |
| K2 | PASS | Keys sheet lists / find, ? sheet, S/X stamp/skip, E ego, F present, D day | KeysClose1–9 workspaces/ find · ? this sheetS stamp · X skipP play path · [ ] stepR PATH · L LENS · E egoF present · Style button cycles Classic / Signal / BlueprintD day / night+ − zoom · 0 fit · Backspace back |
| K3 | PASS | Keys does not post a stamp | {"stampPosts":0,"skipPosts":0} |
| shot:keys.png | PASS | screenshot keys.png is not a black frame | luma=0.961 1440x900 bytes=176219 |
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
| shot:path-walk.png | PASS | screenshot path-walk.png is not a black frame | luma=0.962 1440x900 bytes=172757 |
| PW4 | PASS | [ steps Map path walk without writing stamps | {"chipId":"b-render","cardId":"b-render","chipWalk":1,"cardWalk":1,"moved":true,"stampPosts":0,"skipPosts":0,"playOn":false,"xy":0,"cards":12} |
| PW5 | PASS | Pause / stop leaves Map at community LOD (xy=0) | {"playOn":false,"cards":12,"xy":0} |
| PW6 | PASS | Map path walk does not post a stamp or skip | {"stampPosts":0,"skipPosts":0} |
| PW7 | PASS | Map path walk did not write .graphide/stamps/ | absent |
| X1 | PASS | Export menu opens from #exportBtn | {"btn":true,"menu":true,"png":true,"svg":true,"share":true} |
| X2 | PASS | Export PNG was saved and is not a black frame | luma=0.946 std=0.045 1888x533 bytes=83923 |
| X3 | PASS | Export SVG was saved | bytes=120087 |
| X4 | PASS | Share Card is 1200×630 | 1200x630 |
| X5 | PASS | Export filenames do not claim validation | graphide-control-flow.png graphide-control-flow.svg graphide-control-flow-share.png |
| X6 | PASS | Canonical export strips focus / play / search classes | {"cls":"","review":null} |
| X7 | PASS | Export posts exportFile to the host stub (not stamp) | graphide-control-flow.png,graphide-control-flow.svg,graphide-control-flow-share.png |
| X8 | PASS | Export step did not write .graphide/stamps/ | absent |
| P1 | PASS | Style cycle changes data-preset; topology is unchanged | classic → signal-flow cards=12 |
| P2 | PASS | Blueprint preset is on the same Map topology | blueprint cards=12 fn=#1e4d8c |
| P3 | PASS | Day / Night does not change the visual preset | {"before":"blueprint","night":"blueprint","after":"blueprint"} |
| P4 | PASS | Canonical export carries the current preset | {"ok":true,"preset":"blueprint","hasAttr":true} |
| shot:preset-blueprint.png | PASS | screenshot preset-blueprint.png is not a black frame | luma=0.935 1440x900 bytes=175566 |
| P5 | PASS | Presentation Stage fills the viewport and hides graph-bar chrome | {"present":true,"aria":"true","barHidden":true,"w":1440,"h":853,"top":47,"bottom":900,"vw":1440,"vh":900,"headerBottom":47,"fill":true} |
| shot:present.png | PASS | screenshot present.png is not a black frame | luma=0.926 1440x900 bytes=69869 |
| P6 | PASS | S on the stage cycles Style without moving nodes | classic cards=12 |
| P7 | PASS | Escape exits Presentation Stage and restores the desk | {"present":false,"barShown":true,"aria":"false"} |
| P8 | PASS | Present / preset step did not write .graphide/stamps/ | absent |
| M2c | PASS | Slice canvas mounts XYFlow Steiner nodes (capped, not the raw IR) | xy=29 |
| M2d | PASS | Slice XYFlow nodes expose data-shape | n=29 shapes=start,fn,endpoint,end,store |
| E1 | PASS | Evidence pane is open and labeled | Evidence ScreenshotFormat · src/main.rs:2 |
| E2 | PASS | Evidence clips (overflow hidden, max-width ≤ 380px) | overflow=hidden hidden hidden max-width=380 width=221 |
| E3 | PASS | Evidence does not overlap the object rail | {"overlap":false,"src":{"left":1219,"right":1440,"width":221},"rail":{"left":1019,"right":1219,"width":200,"hidden":false}} |
| E4 | PASS | Evidence has inspect content | 1// solarsim::ScreenshotFormat2fn hop_0() { /* evidence */ } |
| shot:evidence.png | PASS | screenshot evidence.png is not a black frame | luma=0.961 1440x900 bytes=158853 |
| CM1 | PASS | Explorer snap has coverage.uncovered or coverage.changed | unc=1123 changed=1123 2 left0 stamped1 skipped1 brokenCoverage 1123 changed · 1123 uncovered · Review 0 stamped · 1 skipped · 1 broken · 2 pending · e.g. ScreenshotFormat, ext, as_st |
| CM2 | PASS | #inspMeta mark is uncovered or changed (not only —) | mark=uncovered kindTyperole—channel—spansrc/main.rs:2sliceon treecommunityrenderfilesrc/main.rsprogrambin maindegree7markuncovered |
| shot:coverage-mark.png | PASS | screenshot coverage-mark.png is not a black frame | luma=0.963 1440x900 bytes=155161 |
| CM3 | PASS | Coverage-mark step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| HC0 | PASS | Evidence #inspEdges lists incident hop hits when the node has edges | {"paneOpen":true,"kicker":"Evidence","hits":7,"svgHits":0,"title":"ScreenshotFormat · src/main.rs:2","via":"already"} |
| HC1 | PASS | #hopCard unhides and names both ends | {"via":"inspEdges","ends":[{"id":"n0","text":"ScreenshotFormat · 0000"},{"id":"n1","text":"ext · 0001"}],"hop":"Hop · CallsScreenshotFormat · 0000→ext · 0001simulation/ext.rs:12solarsim::ScreenshotFormatsolarsim::ext"} |
| HC2 | PASS | Hop-card end inspects that node (#srcTitle / #srcBody change) | {"clicked":"n0","currentId":"n1","title0":"ext · simulation/ext.rs:2","title1":"ScreenshotFormat · src/main.rs:2","body0":"1// solarsim::ext2fn hop_1() { /* evidence */ }","body1":"1// solarsim::ScreenshotFormat2fn hop_0() { /* evidence */ }","changed":true,"hopStill":true} |
| shot:hop-card.png | PASS | screenshot hop-card.png is not a black frame | luma=0.962 1440x900 bytes=162964 |
| HC3 | PASS | #srcClose hides Evidence and #hopCard | {"paneHidden":true,"hopHidden":true} |
| HC4 | PASS | Hop-card step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| HC5 | PASS | Map altitude is still community LOD after hop card (xy=0) | {"cards":12,"xy":0,"ws":"map","stampPosts":0,"skipPosts":0} |
| HC6 | PASS | Hop-card step did not write .graphide/stamps/ | absent |
| S1 | PASS | Stamp/Skip are enabled on a flow |  |
| S2 | PASS | Stamp/Skip post host messages only (no disk stamp) | [{"type":"stamp","flow":"control-flow"},{"type":"skip","flow":"control-flow"}] |
| S3 | PASS | Harness did not write .graphide/stamps/ | absent |
| H3 | PASS | Editor button posts enterNode to the host stub | [{"type":"enterNode","flow":"control-flow","id":"n0","isLeaf":true}] |
| shot:stamp-host.png | PASS | screenshot stamp-host.png is not a black frame | luma=0.960 1440x900 bytes=169472 |
| R1 | PASS | self-review desk loaded the derived snapshot (not synthetic fallback) | 2686 nodes · 15862 edges · 64 files · 90059ms · javascript@0.1.0,python@0.1.0,rust@0.1.0,typescript@0.1.0 |
| R2 | PASS | self-review desk mode is on after live snap | {"desk":true,"bright":true,"status":"2686 nodes · 15862 edges · 64 files · 90059ms · javascript@0.1.0,python@0.1.0,ru"} |
| R3 | PASS | self-review chrome shows this checkout's graph counts | 2686 nodes · 15862 edges · 64 files · 90059ms · javascript@0.1.0,python@0.1.0,rust@0.1.0,typescript@0.1.0 |
| R3b | PASS | self-review lands on Overview when a default run exists | overview |
| R4 | PASS | self-review Map workspace is active | map |
| R5 | PASS | self-review Map shows communities on this repo, not a lone START | cards=24 start=1 comm=0 names=new,c,idVal,resolveWebviewView,main,sticky_match,derive_repo,extract |
| R5b | PASS | self-review Map stays community LOD (no XYFlow / 1650 React nodes) | xy=0 cards=24 |
| R5c | PASS | self-review Map caption and graph-bar do not overlap cards / Ego | {"wsEgo":false,"wsLegend":false,"chipHits":0,"cardHits":0,"titleHitsCard":false,"titleInsideViewport":false,"visible":24,"cards":24,"chips":13} |
| R6 | PASS | self-review program chips name a Graphide crate | bin graphide-clilib demolib demo-parentlib extensionlib graphide-enginelib graphide-irlib graphide-pluginlib graphide-pl |
| shot:self-review.png | PASS | screenshot self-review.png is not a black frame | luma=0.964 1440x900 bytes=176373 |
| R7 | PASS | Self-review step did not write .graphide/stamps/ | absent |
| PC1 | PASS | self-review has two or more Graphide program chips | bin graphide-cli,lib demo,lib demo-parent,lib extension,lib graphide-engine,lib graphide-ir,lib graphide-plugin,lib graphide-plugin-rust |
| PC2 | PASS | second program chip switches the Map / Review cut (caption + program key) | first=bin graphide-cli second=lib demo meta=Review / map · demo · communities only — click a bubble, then a flow tab |
| PC3 | PASS | program chip switch keeps Map community LOD | {"ws":"map","xy":0,"comm":0,"cards":24} |
| shot:program-chips.png | PASS | screenshot program-chips.png is not a black frame | luma=0.964 1440x900 bytes=176767 |
| PC4 | PASS | program chip switch does not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| PC5 | PASS | program chip switch did not write .graphide/stamps/ | absent |
| AP1 | PASS | self-review has All programs chip when more than one program exists | programs=bin graphide-cli,lib demo,lib demo-parent,lib extension,lib graphide-engine,lib graphide-ir,lib graphide-plugin,lib graphide-plugin-rust all=true |
| AP2 | PASS | All programs chip switches the Map / Review cut to the union view | narrow=bin graphide-cli all=All programs cards=24→24 meta=Review / map · all · communities only — click a bubble, then a flow tab |
| AP3 | PASS | single program chip restores the narrow cut after All programs | back=bin graphide-cli meta=Review / map · graphide-cli · communities only — click a bubble, then a flow tab |
| AP4 | PASS | All programs keeps Map community LOD | {"ws":"map","xy":0,"comm":0,"cards":24} |
| shot:all-programs.png | PASS | screenshot all-programs.png is not a black frame | luma=0.964 1440x900 bytes=176370 |
| AP5 | PASS | All programs does not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| AP6 | PASS | All programs did not write .graphide/stamps/ | absent |
| D0 | PASS | delta fixture snap has Architecture Delta facts | facts=1 |
| D0b | PASS | delta fixture includes added crate::bus::sneaky_helper | crate::bus::sneaky_helper |
| D0c | PASS | delta fixture snap carries a parent graph | parent.nodes=9 |
| D1 | PASS | delta desk loaded the demo vs demo-parent snap | delta |
| D2 | PASS | Delta workspace is active | delta |
| D3 | PASS | Delta fact list is not empty on demo vs demo-parent | facts=6 kinds=stable,stable,stable,relabel,added,added |
| D4 | PASS | Delta lists added crate::bus::sneaky_helper | = stablecommunity · bubble 1 · crate::sub::decodekept bubble 1 \| = stablecommunity · bubble 3 · crate::bus::BroadcastChannelkept bubble 3 \| = stablecommunity · bubble 4 · crate::bus::eventskept bubble 4 \| ~ relabelcommunity · bubble 2 · crate::bus::encodebubble 2 · crate::bus::flush → crate::bus::encode |
| D5 | PASS | Delta has Before / Delta / After plus Review walk controls | {"views":["before","delta","after"],"play":true,"canvas":true} |
| D6 | PASS | Delta canvas three-state lands on Delta after the switcher | delta |
| D6b | PASS | Delta canvas mounts XYFlow nodes (capped, not the raw IR) | xy=10 |
| D6c | PASS | Delta XYFlow nodes expose data-shape | n=10 shapes=fn,type,endpoint |
| D7 | PASS | Delta Review walk is finite (stays on last fact, does not loop) | {"i":"5","n":6,"playing":false} |
| shot:delta.png | PASS | screenshot delta.png is not a black frame | luma=0.965 1440x900 bytes=115163 |
| D8 | PASS | Delta step did not write .graphide/stamps/ | absent |
| SC0 | PASS | delta snap has a sticky coarse BubbleId after sticky_match | kind=stable bubble=1 label=crate::sub::decode |
| SC1 | PASS | Delta paints a community fact with the sticky BubbleId | {"community":5,"sticky":4,"kinds":["stable","stable","stable","relabel","added"],"bubbles":["1","3","4","2"],"text":"= stablecommunity · bubble 1 · crate::sub::decodekept bubble 1","id":"1"} |
| SC2 | PASS | Sticky cluster fact names the kept bubble id | = stablecommunity · bubble 1 · crate::sub::decodekept bubble 1 |
| shot:sticky-clusters.png | PASS | screenshot sticky-clusters.png is not a black frame | luma=0.966 1440x900 bytes=105034 |
| SV0 | PASS | delta snap ships parent_bubbles for a sticky coarse BubbleId | kind=stable bubble=1 parent_bubbles=4 |
| SV1 | PASS | Community fact paints Delta members for the sticky BubbleId | {"view":"delta","ws":"delta","n":4,"current":4,"xy":4,"fact":"1"} |
| SV2 | PASS | Before paints parent members for the same sticky BubbleId | {"view":"before","ws":"delta","n":4,"current":4,"xy":4,"fact":"1"} |
| SV3 | PASS | After paints head members for the same sticky BubbleId | {"view":"after","ws":"delta","n":4,"current":4,"xy":4,"fact":"1"} |
| shot:delta-sticky-views.png | PASS | screenshot delta-sticky-views.png is not a black frame | luma=0.966 1440x900 bytes=105076 |
| SV4 | PASS | Delta sticky views do not post stamp / skip | {"stamp":0,"skip":0} |
| SV5 | PASS | Delta sticky views did not write .graphide/stamps/ | absent |
| SC3 | PASS | Map card keeps the sticky BubbleId at community LOD | {"ws":"map","card":true,"cluster":"stable","xy":0} |
| SC4 | PASS | Sticky clusters do not post stamp / skip | {"stamp":0,"skip":0} |
| SC5 | PASS | Sticky clusters did not write .graphide/stamps/ | absent |
| PU0 | PASS | delta fixture snap has proposed-uncovered Steiner from the parent cut | hits=crate::bus::sneaky_helper tree=1n leftover=0 |
| PU1 | PASS | Delta desk shows proposed-uncovered chip distinct from sidecar flows | {"tabs":[{"name":"data-subscription","proposed":false,"on":true,"text":"data-subscription"},{"name":"proposed-uncovered","proposed":true,"on":false,"text":"proposed-uncovered"}],"text":"proposed-uncovered"} |
| PU2 | PASS | Selecting proposed-uncovered pins Slice and lights the chip | {"ws":"slice","flow":"proposed-uncovered","meta":"Map / proposed-uncovered · 1 on tree"} |
| PU3 | PASS | Selecting proposed-uncovered changes the Steiner cut | {"from":"data-subscription","to":"proposed-uncovered","helper":true,"n":2,"namedN":10} |
| PU4 | PASS | Proposed flow paints a Steiner slice (not an empty chip) | n=2 xy=1 helper=true |
| shot:proposed-uncovered.png | PASS | screenshot proposed-uncovered.png is not a black frame | luma=0.970 1440x900 bytes=100038 |
| PU5 | PASS | Proposed-uncovered step did not post stamp / skip | {"stampPosts":0,"skipPosts":0,"select":["data-subscription","proposed-uncovered"]} |
| PU6 | PASS | Proposed-uncovered step did not write .graphide/stamps/ | absent |
| PU7 | PASS | Proposed-uncovered did not write flows.toml | [[flow]] name = "data-subscription" hits = ["crate::sub::subscribe", "crate::bus::events"]  |
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
| shot:sequence.png | PASS | screenshot sequence.png is not a black frame | luma=0.962 1440x900 bytes=105310 |
| Q8 | PASS | Sequence step did not write .graphide/stamps/ | absent |
| F0 | PASS | dataflow fixture snap has a flow with Source and Sink hops | data-subscription:3n/2h/store+sink+source |
| F0b | PASS | dataflow fixture includes subscribe / events (data-subscription) | data-subscription kinds=Subscribes,Publishes |
| FH0 | PASS | dataflow fixture snap has named flow data-subscription with a Steiner tree | hits=crate::sub::subscribe,crate::bus::events tree=2n/1e |
| F1 | PASS | dataflow desk loaded the fixtures/demo snap | dataflow |
| F2 | PASS | Data-flow workspace is active | dataflow |
| F3 | PASS | Data-flow path has a Source and a Sink | roles=store,sink,source DBeventsSink · Channel \| subscribe \| publish |
| F4 | PASS | Data-flow has an ordered hop list | hops=2 kinds=Subscribes,Publishes |
| F5 | PASS | Data-flow lists subscribe / publish / events on the demo slice | DBeventsSink · Channel \| subscribe \| publish \| Subscribesevents → subscribecrate::bus::events · src/sub.rs |
| F6 | PASS | Data-flow has Play / Prev / Next plus canvas | {"play":true,"canvas":true} |
| F6b | PASS | Data-flow canvas mounts XYFlow nodes (capped, not the raw IR) | xy=3 nodes=3 |
| F6c | PASS | Data-flow XYFlow nodes expose data-shape and a store cylinder | n=3 shapes=store,end,start |
| FH1 | PASS | Data-flow desk shows flow chip data-subscription | {"ws":"dataflow","text":"data-subscription","tabs":[{"name":"data-subscription","on":true,"text":"data-subscription"}]} |
| FH2 | PASS | Named flow chip is the current selection | data-subscription |
| FH3 | PASS | Named flow is backed by a derived Steiner pipeline (not an empty chip) | desk=3n/2h xy=3 tree=2n/1e |
| shot:flow-hints.png | PASS | screenshot flow-hints.png is not a black frame | luma=0.965 1440x900 bytes=93700 |
| FH4 | PASS | Flow-hints step did not post stamp / skip | {"stampPosts":0,"skipPosts":0,"ws":"dataflow"} |
| FH5 | PASS | Flow-hints step did not write .graphide/stamps/ | absent |
| F7 | PASS | Data-flow Play walk is finite (stays on last hop, does not loop) | {"i":"1","n":2,"playing":false} |
| shot:dataflow.png | PASS | screenshot dataflow.png is not a black frame | luma=0.961 1440x900 bytes=123791 |
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
| shot:lifecycle.png | PASS | screenshot lifecycle.png is not a black frame | luma=0.959 1440x900 bytes=120169 |
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
| shot:lineage.png | PASS | screenshot lineage.png is not a black frame | luma=0.967 1440x900 bytes=130890 |
| Y9 | PASS | Lineage step did not write .graphide/stamps/ | absent |
| Y10 | PASS | When coverage.changed is present, a changed node is marked | marked=1 fqn=crate::bus::sneaky_helper |
| RT1 | PASS | Route probe opened from R | {"open":true,"btn":true} |
| RT2 | PASS | Route is a derived directed path with at least one hop | hops=1 nodes=2 kinds=Subscribes |
| RT3 | PASS | Route includes subscribe / events (Subscribes) | 1 hops · subscribe → events \| Subscribes subscribe → events |
| RT4 | PASS | Route lights only path nodes (no extra hops) | extra=0 extraLit=0 |
| RT5 | PASS | Route has Play / Next |  |
| RT6 | PASS | Route journey is finite (stays on last hop, does not loop) | {"i":0,"n":1,"playing":false} |
| shot:route.png | PASS | screenshot route.png is not a black frame | luma=0.959 1440x900 bytes=113223 |
| RT7 | PASS | Route step did not write .graphide/stamps/ | absent |
| LN1 | PASS | Lens opened from L | {"open":true,"btn":true} |
| LN2 | PASS | Lens compares Function and Endpoint | roles=Function,Endpoint compare=Function · Endpoint |
| LN3 | PASS | Lens highlights matching nodes | hits=4 lit=4 |
| LN4 | PASS | Lens does not invent a third kind | Function,Endpoint,Function,Endpoint |
| shot:lens.png | PASS | screenshot lens.png is not a black frame | luma=0.956 1440x900 bytes=115920 |
| LN5 | PASS | Lens step did not write .graphide/stamps/ | absent |
| PY0 | PASS | python fixture snap is python@ with a real graph | plugin=python@0.1.0 nodes=10 edges=11 files=2 py=10 |
| PY0b | PASS | python fixture snap has named flow data-subscription with a Steiner tree | hits=pkg.sub.subscribe,pkg.bus.events tree=2n/1e |
| PY0c | PASS | python fixture snap has a flow with Source and Sink hops | data-subscription:3n/2h/store+sink+source |
| PY1 | PASS | python desk loaded the fixtures/python snap | dataflow python@0.1.0 |
| PY2 | PASS | Python Data-flow workspace is active | dataflow |
| PY3 | PASS | Python Data-flow paints Source and Sink (not a raw IR dump) | roles=store,sink,source Subscribesevents → subscribepkg.bus.events · pkg/sub.py \| Publishespublish → eventspkg.bus.Bus.publish · pkg/bus.py \| DBeventsSink · Channel |
| PY4 | PASS | Python Data-flow names subscribe / publish / events | Subscribesevents → subscribepkg.bus.events · pkg/sub.py \| Publishespublish → eventspkg.bus.Bus.publish · pkg/bus.py \| DBeventsSink · Channel \| subscribe \| publish |
| PY5 | PASS | Python Data-flow XYFlow nodes expose data-shape | xy=3 shapes=store,end,start |
| shot:python-desk.png | PASS | screenshot python-desk.png is not a black frame | luma=0.965 1440x900 bytes=94157 |
| PY6 | PASS | Python Map is community LOD (cards, xy=0, not a lone START) | cards=5 xy=0 names=decode,events,encode,BroadcastChannel,publish |
| PY7 | PASS | Python desk step did not write .graphide/stamps/ | absent |

Artifacts: `overview.png`, `decisions.png`, `unmatched-hint.png`, `open-slice.png`, `registry.png`, `timeline.png`, `uncovered-node.png`, `draft-hint.png`, `map.png`, `fit-reorg.png`, `zoom.png`, `canvas-recycle.png`, `delta-onanalysis.png`, `map-offview.png`, `panel-timeout.png`, `flow-tabs.png`, `slice-grey.png`, `progress.png`, `cancel-review.png`, `night.png`, `enter-bubble.png`, `ego.png`, `search.png`, `kind-filters.png`, `ask.png`, `keys.png`, `path-walk.png`, `export-desk.png`, `export-desk.svg`, `export-share.png`, `preset-blueprint.png`, `present.png`, `evidence.png`, `coverage-mark.png`, `hop-card.png`, `stamp-host.png`, `self-review.png`, `program-chips.png`, `all-programs.png`, `delta.png`, `sticky-clusters.png`, `delta-sticky-views.png`, `proposed-uncovered.png`, `sequence.png`, `flow-hints.png`, `dataflow.png`, `lifecycle.png`, `lineage.png`, `route.png`, `lens.png`, `python-desk.png`, `report.md`.

Stamp/skip clicks only prove `window.__vscodePosts`. They do not write `.graphide/stamps/`.
Self-review is `graphide review` of this checkout — not the synthetic explorer fixture.
