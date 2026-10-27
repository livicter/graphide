# Graphide verification

Harness `/scripts/webview-harness.html?mode=explorer&probe=0` (chrome 17 + Overview / Decisions / Registry / Timeline) then `/scripts/webview-harness.html?live=1&probe=0&require=1` (self-review of this checkout) then `/scripts/webview-harness.html?delta=1&probe=0&require=1&ws=delta` (Architecture Delta on fixtures/demo vs demo-parent) then `/scripts/webview-harness.html?sequence=1&probe=0&require=1&ws=sequence` (Sequence on fixtures/demo) then `/scripts/webview-harness.html?dataflow=1&probe=0&require=1&ws=dataflow` (Data-flow on fixtures/demo) then `/scripts/webview-harness.html?lifecycle=1&probe=0&require=1&ws=lifecycle` (Lifecycle on fixtures/demo) then `/scripts/webview-harness.html?passport=1&probe=0&ws=passport` (Plan Passport fixture) then `/scripts/webview-harness.html?trace=1&passport=1&traj=sub-verify&gate=approved&probe=0&ws=trace` (Trace↔Passport deep-link + Passport→Trace row reverse + Trace→Passport row highlight + Trace dep-list focus + Passport contract/risk traj map + Passport test-strategy traj map + Trace hop-affordance + Passport residual chrome + Trace pin residual) then `/scripts/webview-harness.html?lineage=1&probe=0&require=1&ws=lineage` (Lineage on fixtures/demo) then `/scripts/webview-harness.html?sequence=1&probe=0&require=1&ws=sequence` (Route / Lens on fixtures/demo) then `/scripts/webview-harness.html?python=1&probe=0&require=1&ws=dataflow` (Python desk on fixtures/python) then `/scripts/webview-harness.html?js=1&probe=0&require=1&ws=dataflow` (JavaScript desk on fixtures/js) then `/scripts/webview-harness.html?ts=1&probe=0&require=1&ws=dataflow` (TypeScript desk on fixtures/ts) served from `extension/`.

**PASS** 1098/1098

| id | result | title | detail |
| --- | --- | --- | --- |
| I0 | PASS | Immutable lock file present | /workspace/graphide-ade-zoom-focus-visible/.cursor/skills/verify-graphide/references/immutable-specs.lock |
| I1 | PASS | Immutable specs seal verifies on tip | Immutable specs OK (67 files). |
| I2 | PASS | Immutable self-test detects check-map tamper on a temp copy | Immutable specs self-test OK. |
| I3 | PASS | Immutable check fails when a protected file is missing | Immutable spec check failed. \| missing protected file: .cursor/skills/verify-graphide/references/features/immutable-harness.md \| locked feature map missing: .cursor/skills/verify-graphide/references/features/immutable-harness.md \|  \| Agent / make-green path cannot rewrite protected specs. \| Regenerate only for intentional human changes: \|   ADE_ALLOW_SPEC_MUTATION=1 node extension/scripts/check-immutable-specs.js --write --allow-spec-mutation |
| I4 | PASS | Immutable check fails when a new feature map is unlocked | Immutable spec check failed. \| unlocked feature map: .cursor/skills/verify-graphide/references/features/_immutable-probe-unlocked.md \|  \| Agent / make-green path cannot rewrite protected specs. \| Regenerate only for intentional human changes: \|   ADE_ALLOW_SPEC_MUTATION=1 node extension/scripts/check-immutable-specs.js --write --allow-spec-mutation |
| I5 | PASS | npm verify wires immutable seal before check-map and Playwright | node extension/scripts/check-immutable-specs.js && node extension/scripts/check-immutable-specs.js --self-test && node extension/scripts/check-map.js && node scripts/verify-graphide.js |
| I6 | PASS | FS sandbox gate denies sealed feature map without unlock | {"class":"sealed","allowed":false,"reason":"sealed spec; require ADE_ALLOW_SPEC_MUTATION=1 (or --allow-spec-mutation) to mutate","rel":".cursor/skills/verify-graphide/references/features/immutable-harness.md"} |
| I7 | PASS | FS sandbox gate allows extension/media/** without unlock | {"class":"agent","allowed":true,"reason":"product media surface (extension/media/**)","rel":"extension/media/main.js"} |
| I8 | PASS | FS sandbox gate allows sealed path with ADE_ALLOW_SPEC_MUTATION=1 | {"class":"unlock","allowed":true,"reason":"human unlock via ADE_ALLOW_SPEC_MUTATION=1 / --allow-spec-mutation","rel":"package.json"} |
| I9 | PASS | write-bus denies sealed path and does not create --out | {"ok":false,"decision":{"class":"sealed","allowed":false,"reason":"sealed spec; require ADE_ALLOW_SPEC_MUTATION=1 (or --allow-spec-mutation) to mutate","rel":".cursor/skills/verify-graphide/references/features/immutable-harness.md"},"wrote" |
| I10 | PASS | write-bus allows extension/media/** into --out | {"ok":true,"decision":{"class":"agent","allowed":true,"reason":"product media surface (extension/media/**)","rel":"extension/media/main.js"},"wrote":true,"dest":"/tmp/graphide-write-bus-ooy33c/media-out","bytes":9} |
| I11 | PASS | write-bus allows sealed path with ADE_ALLOW_SPEC_MUTATION=1 into --out | {"ok":true,"decision":{"class":"unlock","allowed":true,"reason":"human unlock via ADE_ALLOW_SPEC_MUTATION=1 / --allow-spec-mutation","rel":"package.json"},"wrote":true,"dest":"/tmp/graphide-write-bus-ooy33c/unlock-out","bytes":10} |
| G1 | PASS | self-review rust plugin is in play | javascript@0.1.0,python@0.1.0,rust@0.1.0,typescript@0.1.0 |
| G2 | PASS | self-review graph has nodes, edges, and files | nodes=3168 edges=19628 files=71 |
| G3 | PASS | self-review graph includes Rust files | rs=397 |
| G4 | PASS | self-review Map altitude is a real community cut, not a lone START | bubbles=4782 altitude=371 names=fixtures.ts.pkg.bus.Bus.publish,fixtures.js.pkg.bus.BroadcastChannel,fixtures.js.pkg.bus.Bus.publish,fixtures.js.pkg.bus.Bus,fixtures.python.pkg.bus.BroadcastChannel,fixtures.python.pkg.bus.Bus.publish,fixtures.python.pkg.bus.Bus,fixtures.python.pkg.bus.publish |
| G5 | PASS | self-review snapshot is this checkout, not the synthetic explorer fixture | nodes=3168 edges=19628 |
| H1 | PASS | harness stub acquireVsCodeApi is present |  |
| H2 | PASS | desk mode is on after synthetic programs | {"stub":true,"posts":0,"bright":true,"desk":true,"ws":"overview"} |
| OV1 | PASS | Overview workspace is active on first paint | overview |
| OV2 | PASS | Overview shows the default-run / control-flow stage | Overview — default run and control-flow graph |
| OV3 | PASS | Overview CFG still mounts shaped XYFlow nodes (not a raw-IR dump) | xy=29 shaped=29 shapes=start,fn,endpoint,end,store |
| OV4 | PASS | Overview shows Open map and program chips when the product has them | openMap=true chips=bin main |
| shot:overview.png | PASS | screenshot overview.png is not a black frame | luma=0.964 1440x900 bytes=116890 |
| OV5 | PASS | Overview step did not write .graphide/stamps/ | absent |
| DC1 | PASS | Decisions workspace is active | decisions |
| DC2 | PASS | Decisions lists stamps / skips / broken attestations (or honest empty) | cards=4 rejectedbootStamp no longer matches the derived tree. \| deferredlegacySkipped this session — no stamp written. \| rejectedStampBroken · boot1 added · 0 removed h |
| DC3 | PASS | Decisions keeps Stamp/Skip host-only (enabled, no XYFlow list) | {"stamp":true,"skip":true,"xy":0,"strip":true} |
| shot:decisions.png | PASS | screenshot decisions.png is not a black frame | luma=0.955 1440x900 bytes=118358 |
| DC4 | PASS | Decisions step did not write .graphide/stamps/ | absent |
| UH1 | PASS | #coverage li.finding surfaces unmatched solarsim::MissingHit in boot | {"ws":"decisions","unmatched":"unmatched solarsim::MissingHit in boot","findings":["stamp broken boot · +1 / −0","unmatched solarsim::MissingHit in boot"]} |
| UH2 | PASS | Decisions lists UnmatchedHint (distinct from StampBroken) | {"hint":"UnmatchedHint · boot · MissingHit","body":"solarsim::MissingHit","outcome":"pending","broken":"StampBroken · boot"} |
| UH3 | PASS | Unmatched-hint step keeps Map community LOD (xy=0) | xy=0 cards=0 |
| shot:unmatched-hint.png | PASS | screenshot unmatched-hint.png is not a black frame | luma=0.958 1440x900 bytes=121598 |
| UH4 | PASS | Unmatched-hint step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| UH5 | PASS | Unmatched-hint step did not write .graphide/stamps/ | absent |
| OS1 | PASS | Decision record exposes Open slice for the selected flow | {"flow":"boot","label":"Open slice","ws":"decisions"} |
| OS2 | PASS | Open slice lands on Slice workspace | {"ws":"slice","sliceOn":true} |
| OS3 | PASS | Slice flow matches data-open-slice | {"target":"boot","flow":"boot","tab":"bootbroken","vnodes":58} |
| shot:open-slice.png | PASS | screenshot open-slice.png is not a black frame | luma=0.968 1440x900 bytes=129764 |
| OS4 | PASS | Open-slice step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| OS5 | PASS | Open-slice step did not write .graphide/stamps/ | absent |
| RG1 | PASS | Registry workspace is active | registry |
| RG2 | PASS | Registry audit rows come from the snapshot (nodes / edges / files / plugin) | rows=5 reviewReview snapshot2050 nodes · 5055 edges · 136 files · rust@0.1.0 · 21041ms xy=0 |
| shot:registry.png | PASS | screenshot registry.png is not a black frame | luma=0.947 1440x900 bytes=89704 |
| RG3 | PASS | Registry step did not write .graphide/stamps/ | absent |
| TL1 | PASS | Timeline workspace is active | timeline |
| TL2 | PASS | Timeline shows parent cut / coverage / stamp scars from the snapshot | items=6 t0parentParent cut1123 nodes changed vs parent (HEAD^ unless overridden) \| t1coverageUncovered1123 changed nodes sit off every proposed treeCopy draft[[flow]] name = "uncovered" hi |
| shot:timeline.png | PASS | screenshot timeline.png is not a black frame | luma=0.956 1440x900 bytes=99386 |
| TL3 | PASS | Timeline step did not write .graphide/stamps/ | absent |
| UN1 | PASS | #coverage surfaces Coverage N changed · N uncovered (no UncoveredNode dump) | {"ws":"timeline","chip":"Coverage 1123 changed · 1123 uncovered · Review 0 stamped · 1 skipped · 1 broken · 2 pending · e.g. ScreenshotFormat, ext, as_str +1120","changed":1123,"uncovered":1123} |
| UN2 | PASS | Timeline lists Uncovered (changed nodes off every proposed tree) | {"title":"Uncovered","body":"1123 changed nodes sit off every proposed tree","kind":"coverage","now":true,"scrub":"t1 · Uncovered"} |
| UN3 | PASS | Uncovered-node step keeps Map community LOD (xy=0) | xy=0 cards=0 |
| shot:uncovered-node.png | PASS | screenshot uncovered-node.png is not a black frame | luma=0.961 1440x900 bytes=105460 |
| UN4 | PASS | Uncovered-node step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| UN5 | PASS | Uncovered-node step did not write .graphide/stamps/ | absent |
| DH1 | PASS | Timeline Uncovered exposes Copy draft on the selected item | {"ws":"timeline","now":true,"btn":"Copy draft"} |
| DH2 | PASS | Draft hint is a [[flow]] hits list with an uncovered FQN | [[flow]] name = "uncovered" hits = ["solarsim::ScreenshotFormat", "solarsim::ext", "solarsim::as_str", "solarsim::SimPosition", "solarsim::SimulationScale", "solarsim::Mass", "solarsim::Velocity", "solarsim::Body"] |
| DH3 | PASS | Draft-hint step keeps Map community LOD (xy=0) | xy=0 cards=0 |
| shot:draft-hint.png | PASS | screenshot draft-hint.png is not a black frame | luma=0.961 1440x900 bytes=108746 |
| DH4 | PASS | Draft-hint step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| DH5 | PASS | Draft-hint step did not write .graphide/stamps/ | absent |
| A1a | PASS | Trace workspace is active with trajectory-dag host | {"ws":"trace","hostId":"trajCanvas"} |
| A1a1 | PASS | Trajectory DAG has ≥3 subtask nodes and ≥2 dependency edges | nodes=8 edges=12 labels=Plan slice,Edit desk,Load fixtures,Artifact diff,Verify A1a,Seal specs,Passport hop,Draft PR |
| A1a2 | PASS | Trajectory nodes expose artifact and diff pins | arts=8 diffs=5 ADE-PLAN.md\|extension/media/src/graph/desk.js\|extension/media/src/graph/trajectory-fixture.js · +traj\|+nodes\|+pins |
| A1a3 | PASS | Trace keeps Map community LOD idle (xy=0 on Trace) | xy=0 |
| shot:trajectory-dag.png | PASS | screenshot trajectory-dag.png is not a black frame | luma=0.942 1440x900 bytes=178563 |
| A1a4 | PASS | Trace step did not write .graphide/stamps/ | absent |
| TF1 | PASS | Trace nodes expose phase + agent + role | nodes=sub-plan:scope/planner/upstream,sub-edit:implement/desk/write,sub-fixture:implement/harness/sim,sub-diff:inspect/diff/review,sub-verify:prove/verify/gate,sub-seal:prove/immutable/gate,sub-passport:signoff/passport/downstream,sub-pr:ship/ship/downstream |
| TF2 | PASS | Trace nodes expose deps and edges cover seq/fork/join | kinds=seq,fork,join labeled=12 depsSample=sub-edit→sub-plan;sub-fixture→sub-plan;sub-diff→sub-edit,sub-fixture |
| TF3 | PASS | Trace nodes expose artifact-diff adds/dels | diff=sub-plan:+0/-0,sub-edit:+214/-18,sub-fixture:+96/-12,sub-diff:+4/-1,sub-verify:+88/-6,sub-seal:+2/-2,sub-passport:+0/-0,sub-pr:+0/-0 |
| TF4 | PASS | Trace inspector shows deps + duration + artifact-diff for selected subtask | {"selected":"sub-diff","empty":"","phase":"inspect","agent":"diff","duration":"510","depIds":["sub-edit","sub-fixture"],"hasDepsList":true,"adds":"4","dels":"1","hasDiff":true} |
| TF5 | PASS | Trace fixture v2 has ≥8 subtasks / ≥8 deps with edge labels | v=2 nodes=8 edges=12 labels=12 |
| shot:trajectory-fixtures.png | PASS | screenshot trajectory-fixtures.png is not a black frame | luma=0.931 1440x900 bytes=207032 |
| TF6 | PASS | Trace fixtures step did not write .graphide/stamps/ | absent |
| PH1 | PASS | Hovering Trace diff pin shows #trajPinTip with matching adds/dels | {"tip":true,"tipHidden":false,"kind":"diff","nodeId":"sub-diff","tipAdds":"4","tipDels":"1","pinAdds":"4","pinDels":"1","counts":true,"addsText":"+4","delsText":"−1","art":"verification/trajectory-fixtures.png"} |
| PH2 | PASS | Pin tip shows +adds/−dels chrome and artifact path | {"addsText":"+4","delsText":"−1","art":"verification/trajectory-fixtures.png","counts":true} |
| PTC1 | PASS | Pin tip add/del chips render as +N/−N pills | {"ok":true,"chipAdd":true,"chipDel":true,"artBase":"trajectory-fixtures.png","artDir":"verification/","place":"below","left":"439.5px","top":"534.812px","tipW":263,"tipH":127} |
| PTC2 | PASS | Pin tip path splits dir + basename for readability | {"artBase":"trajectory-fixtures.png","artDir":"verification/"} |
| PTC3 | PASS | Pin tip anchors to pin (below/above) with on-screen placement | {"place":"below","left":"439.5px","top":"534.812px","tipW":263,"tipH":127} |
| shot:trajectory-pin-hover.png | PASS | screenshot trajectory-pin-hover.png is not a black frame | luma=0.928 1440x900 bytes=216831 |
| shot:trajectory-pin-tip-chrome.png | PASS | screenshot trajectory-pin-tip-chrome.png is not a black frame | luma=0.928 1440x900 bytes=216850 |
| PH3 | PASS | Leaving Trace pin hides #trajPinTip | hidden=true |
| PH4 | PASS | Trace pin-hover step did not write .graphide/stamps/ | absent |
| TP1 | PASS | Pin tip residual cue shows status + unmet deps + hop residual for sub-diff | {"tip":true,"present":true,"tipResidual":"1","status":"done","tipStatus":"done","deps":"0","hops":"2","seal":"","badge":"done","copy":"0 deps left · 2 hops","nodeId":"sub-diff"} |
| TP2 | PASS | Pin tip residual on sub-seal shows seal hint with coherent status/deps/hops | {"tip":true,"present":true,"status":"done","deps":"0","hops":"1","seal":"1","tipSeal":"1","copy":"0 deps left · 1 hop · seal","nodeId":"sub-seal","kind":"diff"} |
| shot:trajectory-pin-residual.png | PASS | screenshot trajectory-pin-residual.png is not a black frame | luma=0.928 1440x900 bytes=217411 |
| TP3 | PASS | screenshot trajectory-pin-residual.png is not a black frame | luma=0.928 1440x900 bytes=217411 |
| TP4 | PASS | Trace pin residual step did not write .graphide/stamps/ | absent |
| EL1 | PASS | Trace edge legend mounts with seq / fork / join chips | {"kinds":"fork,join,seq","classOk":true,"labels":["seq","fork","join"]} |
| EL2 | PASS | Edge-legend chip strokes match .traj-edge.kind-* (solid / dasharray / join tint) | {"seq":{"kind":"seq","label":"seq","hasLine":true,"stroke":"rgba(60, 60, 67, 0.22)","dash":"","classKind":true},"fork":{"kind":"fork","label":"fork","hasLine":true,"stroke":"rgba(60, 60, 67, 0.22)","dash":"5 4","classKind":true},"join":{"kind":"join","label":"join","hasLine":true,"stroke":"color(srgb 0.0358381 0.441399 0.887707 / 0.648824)","dash":"","classKind":true},"edgeStyles":{"seq":{"stroke":"rgba(60, 60, 67, 0.22)","dash":"","onPath":false},"fork":{"stroke":"rgba(60, 60, 67, 0.22)","dash":"5 4","onPath":false},"join":{"stroke":"color(srgb 0.0358381 0.441399 0.887707 / 0.648824)","dash":"","onPath":false}}} |
| shot:trajectory-edge-legend.png | PASS | screenshot trajectory-edge-legend.png is not a black frame | luma=0.928 1440x900 bytes=219169 |
| EL3 | PASS | screenshot trajectory-edge-legend.png is not a black frame | luma=0.928 1440x900 bytes=219169 |
| EL4 | PASS | Trace edge-legend step did not write .graphide/stamps/ | absent |
| FLD1 | PASS | Focus sub-edit marks seq legend chip on-path; fork/join dim (matches on-path edge kinds) | {"focus":"sub-edit","onPathEdgeKinds":["seq"],"chips":[{"kind":"seq","onPath":true,"dim":false,"dataOnPath":true,"dataDim":false,"opacity":1},{"kind":"fork","onPath":false,"dim":true,"dataOnPath":false,"dataDim":true,"opacity":0.32},{"kind":"join","onPath":false,"dim":true,"dataOnPath":false,"dataDim":true,"opacity":0.32}]} |
| FLD2 | PASS | On-path legend chip stays readable; off-path chips dim (opacity) | {"seqOpacity":1,"forkOpacity":0.32,"joinOpacity":0.32} |
| shot:trajectory-legend-focus-dim.png | PASS | screenshot trajectory-legend-focus-dim.png is not a black frame | luma=0.933 1440x900 bytes=193776 |
| FLD3 | PASS | screenshot trajectory-legend-focus-dim.png is not a black frame | luma=0.933 1440x900 bytes=193776 |
| FLD4 | PASS | Trace legend focus-dim step did not write .graphide/stamps/ | absent |
| KS1 | PASS | ArrowRight from sub-edit → sub-fixture focus; legend on-path kinds match on-path edges | {"focus":"sub-fixture","hasFocus":true,"onId":"sub-fixture","onPathEdgeKinds":["fork","join","seq"],"onPathChipKinds":["fork","join","seq"],"dimChipKinds":[],"chips":[{"kind":"seq","onPath":true,"dim":false,"dataOnPath":true,"dataDim":false},{"kind":"fork","onPath":true,"dim":false,"dataOnPath":true,"dataDim":false},{"kind":"join","onPath":true,"dim":false,"dataOnPath":true,"dataDim":false}]} |
| KS2 | PASS | ] advances to sub-diff; focus / on-path / legend dim stay in sync | {"focus":"sub-diff","hasFocus":true,"onId":"sub-diff","onPathEdgeKinds":["join","seq"],"onPathChipKinds":["join","seq"],"chips":[{"kind":"seq","onPath":true,"dim":false},{"kind":"fork","onPath":false,"dim":true},{"kind":"join","onPath":true,"dim":false}]} |
| shot:trajectory-keyboard-step.png | PASS | screenshot trajectory-keyboard-step.png is not a black frame | luma=0.931 1440x900 bytes=205799 |
| KS3 | PASS | screenshot trajectory-keyboard-step.png is not a black frame | luma=0.931 1440x900 bytes=205799 |
| KS4 | PASS | Trace keyboard node-step did not write .graphide/stamps/ | absent |
| ES1 | PASS | Trace empty fixture shows empty-state chrome (copy + Open Passport); no DAG nodes/edges | {"pageEmpty":true,"hostEmpty":true,"fixture":"ade-empty-fixture","title":"No trajectory nodes","copy":"This trace has no DAG subtasks yet. Open Passport to inspect the gate, or load a trajectory fixture.","hasAction":true,"stripVisible":true,"nodeCount":0,"edgeCount":0,"emptyH":102.78125,"emptyW":420} |
| ES2 | PASS | Trace empty-state Open Passport affordance hops to Passport gate | {"ws":"passport","passport":true,"gate":true} |
| shot:trajectory-empty-state.png | PASS | screenshot trajectory-empty-state.png is not a black frame | luma=0.940 1440x900 bytes=102886 |
| ES3 | PASS | screenshot trajectory-empty-state.png is not a black frame | luma=0.940 1440x900 bytes=102886 |
| ES4 | PASS | Trace empty-state step did not write .graphide/stamps/ | absent |
| SC1 | PASS | Trace strip shows #adeSealChip sealed (immutable/write-gate stub) | {"state":"sealed","label":"SEALED","inStrip":true,"visible":true,"gateChip":false} |
| SC2 | PASS | Passport hop row shows #adeSealChip unlock; passport gate chip stays separate | {"state":"unlock","label":"UNLOCK · ADE_ALLOW","inHop":true,"visible":true,"gate":true,"gateChip":"pending","chipIsGate":false} |
| shot:seal-status-chip.png | PASS | screenshot seal-status-chip.png is not a black frame | luma=0.939 1440x900 bytes=177290 |
| SC3 | PASS | screenshot seal-status-chip.png is not a black frame; open flip single chip | {"probe":{"state":"open","count":1,"label":"OPEN · agent"},"shot":"luma=0.939 1440x900 bytes=177290"} |
| SC4 | PASS | Seal status chip step did not write .graphide/stamps/ | absent |
| PE1 | PASS | Passport empty fixture shows empty-state chrome (copy + Open Trace); no plan rows | {"pageEmpty":true,"fixture":"passport-ade-empty-fixture","title":"No plan rows","copy":"Passport is empty — no targets, contracts, risks, tests, or gated writes yet. Open Trace to inspect the trajectory, or load a Passport fixture.","hasAction":true,"seal":true,"rowCount":0,"impactRows":0,"impact":false,"sign":false,"targets":0,"contracts":0,"risks":0,"tests":0,"gated":0,"emptyH":102.78125,"emptyW":420} |
| PE2 | PASS | Passport empty-state Open Trace affordance hops to Trace | {"ws":"trace","traj":true} |
| shot:passport-empty-state.png | PASS | screenshot passport-empty-state.png is not a black frame | luma=0.946 1440x900 bytes=89651 |
| PE3 | PASS | screenshot passport-empty-state.png is not a black frame | luma=0.946 1440x900 bytes=89651 |
| PE4 | PASS | Passport empty-state step did not write .graphide/stamps/ | absent |
| ZC1 | PASS | Trace shows #trajZoomBar at 100% with scale layer; Map #zoomBar stays hidden | {"bar":true,"zin":true,"zout":true,"zfit":true,"pct":"100%","scaleAttr":"1","transform":"width:1136px;height:344px;transform:scale(1);transform-origin:0 0","mapZoomHidden":true,"nodes":8} |
| ZC2 | PASS | Trace zoom in/out/Fit + keyboard +/-/0 update data-traj-scale; Map zoom untouched | {"zc2a":{"scaleAttr":"1.5625","pct":"156%","transform":"width:1136px;height:344px;transform:scale(1.5625);transform-origin:0 0"},"zc2b":{"scaleAttr":"1.25"},"zc2c":{"scaleAttr":"1","pct":"100%","mapZoomHidden":true},"zc2k":{"scaleAttr":"1.25","pct":"125%"},"zc2aOk":true,"zc2bOk":true,"zc2cOk":true,"zc2kOk":true} |
| shot:trajectory-zoom-chrome.png | PASS | screenshot trajectory-zoom-chrome.png is not a black frame | luma=0.930 1440x900 bytes=196509 |
| ZC3 | PASS | screenshot trajectory-zoom-chrome.png is not a black frame | luma=0.930 1440x900 bytes=196509 |
| ZC4 | PASS | Trace zoom chrome step did not write .graphide/stamps/ | absent |
| P1 | PASS | Passport tab exists once on the explorer row | tabs=1 |
| P2 | PASS | Passport workspace is active | passport |
| P3 | PASS | Passport gate starts pending with blocked write paths | state=pending blocked=5 paths=5 |
| P4 | PASS | Passport sections render targets/contracts/risks/tests/impact |  |
| P5 | PASS | Passport impact stub uses Architecture Delta vocabulary | Semantic impactArchitecture / API / risk / test rows with Delta-vocab impact chips for upstream sign-off before agent writes. — Architecture Delta vocabulary (s |
| P5b | PASS | Passport Delta vocabulary stub names statuses/classes/impact regions (no live Delta mount) | statuses=Added,Removed,Changed,Moved,Rerouted classes=Semantic,Topology,Presentation regions=structural,impact,community live=false |
| P6 | PASS | Passport Approve unlocks gated write paths | state=approved blocked=0 |
| P7 | PASS | Passport page does not introduce data-testid / data-component |  |
| shot:passport.png | PASS | screenshot passport.png is not a black frame | luma=0.926 1440x900 bytes=159592 |
| shot:passport-delta-vocab.png | PASS | screenshot passport-delta-vocab.png is not a black frame | luma=0.926 1440x900 bytes=159596 |
| PF1 | PASS | Passport architecture target rows expose layer + delta/cluster chips | targets=t1:architecture/Changed,t2:chrome/Stable,t3:harness/Added,t4:trace/Stable,t5:harness/Changed |
| PF2 | PASS | Passport API contract rows expose deltaClass + breaking/compat | contracts=c1:Presentation/b0,c2:Semantic/b0,c3:Topology/b0,c4:Topology/b0,c5:Presentation/b0 |
| PF3 | PASS | Passport risk rows expose mitigation + blast | risks=r1:m1b1,r2:m1b1,r3:m1b1,r4:m1b1,r5:m1b1 |
| PF4 | PASS | Passport test rows expose fixture + covers | tests=p1:f1c1,p2:f1c1,p3:f1c1,p4:f1c1,p5:f1c1,p6:f1c1 |
| PF5 | PASS | Passport impact cards render structured rows with Delta chips (no live Delta) | rows=13 sample=cg1:Changed/Topology,cg2:Stable/Semantic,cg3:Stable/Topology |
| shot:passport-fixtures.png | PASS | screenshot passport-fixtures.png is not a black frame | luma=0.926 1440x900 bytes=159596 |
| P8 | PASS | Passport sign-off did not write .graphide/stamps/ | absent |
| GS1 | PASS | Passport gate stays sticky/visible while scrolling long sections; chip + blocked path hooks intact | {"ok":true,"position":"sticky","state":"rejected","chip":"rejected","chipBg":"color(srgb 0.427608 0.289255 0.28149)","summary":true,"blocked":5,"paths":5,"visible":true,"top":12} |
| GS2 | PASS | Passport sign rail stays sticky at canvas bottom; Approve primary, Reject secondary, hint muted | {"ok":true,"position":"sticky","visible":true,"nearBottom":true,"hasActions":true,"approveBg":"rgb(0, 122, 255)","rejectBorder":"color(srgb 0.64 0.217255 0.193529)","hintOpacity":"0.85","hintOrder":"2","hintMuted":true} |
| GS3 | PASS | approved/rejected gate chrome keeps filled chip + solid path border without hook loss | [{"state":"approved","chip":"approved","chipBg":"color(srgb 0.292078 0.378196 0.304078)","rowBorder":"rgb(63, 185, 80)","hooks":true},{"state":"rejected","chip":"rejected","chipBg":"color(srgb 0.427608 0.289255 0.28149)","rowBorder":"rgb(255, 59, 48)","hooks":true}] |
| shot:passport-gate-signoff.png | PASS | screenshot passport-gate-signoff.png is not a black frame | luma=0.923 1440x900 bytes=182184 |
| PR1 | PASS | Sticky #passportSign residual cue shows incomplete/blocked path count | {"present":true,"state":"rejected","count":"5","badge":"5","copy":"Sign-off incomplete · 5 paths blocked","paths":5,"signState":"rejected","hasApprove":true,"hasReject":true} |
| PR2 | PASS | Approve flips residual to unlocked/open; Reject restores incomplete/blocked cue | {"approve":{"present":true,"state":"approved","count":"5","copy":"Writes unlocked · 5 paths open","signState":"approved"},"reject":{"present":true,"state":"rejected","count":"5","copy":"Sign-off incomplete · 5 paths blocked"},"baseCount":"5"} |
| shot:passport-residual-chrome.png | PASS | screenshot passport-residual-chrome.png is not a black frame | luma=0.923 1440x900 bytes=182176 |
| PR3 | PASS | screenshot passport-residual-chrome.png is not a black frame | luma=0.923 1440x900 bytes=182176 |
| PR4 | PASS | Passport residual chrome did not write .graphide/stamps/ | absent |
| HB1 | PASS | Each Passport gate path row shows hop residual badge (incomplete/blocked) | {"pathCount":5,"hopCount":5,"everyPathHasHop":true,"states":["rejected","rejected","rejected","rejected","rejected"],"badges":["blocked","blocked","blocked","blocked","blocked"],"hopPaths":["extension/media/src/graph/desk.js","extension/media/src/chrome/GraphBar.jsx","extension/media/main.css","extension/media/src/graph/trajectory-fixture.js","extension/scripts/passport-fixture.json"],"pathAttrs":["extension/media/src/graph/desk.js","extension/media/src/chrome/GraphBar.jsx","extension/media/main.css","extension/media/src/graph/trajectory-fixture.js","extension/scripts/passport-fixture.json"],"sampleState":"rejected","sampleBadge":"blocked","samplePath":"extension/media/src/graph/desk.js"} |
| HB2 | PASS | Approve flips hop residual badges to open; Reject restores blocked/incomplete | {"approve":{"hopCount":5,"states":["approved","approved","approved","approved","approved"],"badges":["open","open","open","open","open"]},"reject":{"hopCount":5,"states":["rejected","rejected","rejected","rejected","rejected"],"badges":["blocked","blocked","blocked","blocked","blocked"]},"base":5} |
| shot:passport-hop-residual-badge.png | PASS | screenshot passport-hop-residual-badge.png is not a black frame | luma=0.923 1440x900 bytes=182176 |
| HB3 | PASS | screenshot passport-hop-residual-badge.png is not a black frame | luma=0.923 1440x900 bytes=182176 |
| HB4 | PASS | Passport hop residual badge did not write .graphide/stamps/ | absent |
| AR1 | PASS | Focused traj marks residual neighbor Passport gate paths + Trace neighbor residual attrs | {"ar1":{"adjCount":2,"rows":[{"traj":"sub-edit","path":"extension/media/src/graph/desk.js","cls":true,"cue":true,"cueText":"adj residual","hop":true},{"traj":"sub-fixture","path":"extension/media/src/graph/trajectory-fixture.js","cls":true,"cue":true,"cueText":"adj residual","hop":true}],"focusWin":"sub-diff","selectedAdj":false,"gate":"rejected","everyCue":true},"arTrace":{"adj":["sub-edit","sub-fixture"],"selected":"sub-diff","selectedHasAdj":false,"adjCount":2}} |
| AR2 | PASS | Approve clears Passport + Trace adjacent residual cues | {"passport":{"passportAdj":0,"cues":0,"gate":"approved"},"trace":{"trajAdj":0,"focus":"sub-diff"}} |
| shot:passport-traj-adjacent-residual.png | PASS | screenshot passport-traj-adjacent-residual.png is not a black frame | luma=0.924 1440x900 bytes=174133 |
| AR3 | PASS | screenshot passport-traj-adjacent-residual.png is not a black frame | luma=0.924 1440x900 bytes=174133 |
| AR4 | PASS | Passport traj-hop adjacent residual did not write .graphide/stamps/ | absent |
| AL1 | PASS | Focus sub-diff + residual gate shows adj-residual legend chips for neighbor node kinds (edit/fixture) | {"ok":true,"kinds":["edit","fixture"],"labels":["adj edit","adj fixture"],"count":2,"edgeChipCount":5,"focus":"sub-diff","selectedKind":"diff","adjCount":2} |
| AL2 | PASS | Approve clears adj-residual legend chips; Reject restores (edge focus-dim intact) | {"cleared":{"ok":true,"adj":0,"raw":null,"edgeFocusDim":true,"focus":"sub-diff"},"restored":{"ok":true,"adj":2,"count":2,"edgeChips":5,"edgeFocusDim":true}} |
| shot:trajectory-adj-residual-legend.png | PASS | screenshot trajectory-adj-residual-legend.png is not a black frame | luma=0.937 1440x900 bytes=198158 |
| AL3 | PASS | screenshot trajectory-adj-residual-legend.png is not a black frame | luma=0.937 1440x900 bytes=198158 |
| AL4 | PASS | Trace adj-residual legend step did not write .graphide/stamps/ | absent |
| FC1 | PASS | Focused traj scopes sticky Passport residual count to active focused path | {"present":true,"scope":"focus","focus":"sub-diff","focusCount":"2","globalCount":"5","badge":"2","copy":"Focus path · 2 paths blocked","state":"rejected","paths":5,"adj":2,"winFocus":"sub-diff"} |
| FC2 | PASS | Approve/Reject flips focus-scoped residual copy; scope + focus count persist | {"approve":{"present":true,"scope":"focus","focus":"sub-diff","focusCount":"2","globalCount":"5","badge":"2","copy":"Focus path · 2 paths open","state":"approved"},"reject":{"present":true,"scope":"focus","focus":"sub-diff","focusCount":"2","globalCount":"5","copy":"Focus path · 2 paths blocked","state":"rejected"},"base":{"present":true,"scope":"focus","focus":"sub-diff","focusCount":"2","globalCount":"5","badge":"2","copy":"Focus path · 2 paths blocked","state":"rejected","paths":5,"adj":2,"winFocus":"sub-diff"}} |
| shot:passport-focus-residual-count.png | PASS | screenshot passport-focus-residual-count.png is not a black frame | luma=0.924 1440x900 bytes=173856 |
| FC3 | PASS | screenshot passport-focus-residual-count.png is not a black frame | luma=0.924 1440x900 bytes=173856 |
| FC4 | PASS | Passport focus residual count did not write .graphide/stamps/ | absent |
| LC1 | PASS | Focused traj shows Trace legend focus-residual count chip matching Passport sticky focusN | {"present":true,"hostScope":"focus","hostFocus":"sub-diff","hostCount":"2","chipScope":"focus","chipFocus":"sub-diff","chipCount":"2","chipState":"rejected","hasKind":false,"isAdj":false,"isFocusClass":true,"badge":"2","label":"focus residual · 2","edgeKinds":3,"adj":2,"dagFocus":"sub-diff","passport":{"scope":"focus","focus":"sub-diff","focusCount":"2","globalCount":"5","state":"rejected"}} |
| LC2 | PASS | Clear-focus restores global legend residual; Approve/Reject flip focus-residual label; count persists | {"clear":{"focus":"","scope":"global","focusAttr":null,"countAttr":null,"chips":0},"approve":{"present":true,"scope":"focus","focus":"sub-diff","count":"2","chipCount":"2","state":"approved","label":"focus open · 2","badge":"2","adj":0},"reject":{"present":true,"scope":"focus","focus":"sub-diff","count":"2","state":"rejected","label":"focus residual · 2","adj":2},"passport":{"scope":"focus","focus":"sub-diff","focusCount":"2","globalCount":"5","state":"rejected"}} |
| shot:trajectory-legend-focus-residual.png | PASS | screenshot trajectory-legend-focus-residual.png is not a black frame | luma=0.937 1440x900 bytes=198157 |
| LC3 | PASS | screenshot trajectory-legend-focus-residual.png is not a black frame | luma=0.937 1440x900 bytes=198157 |
| LC4 | PASS | Trace legend focus-residual step did not write .graphide/stamps/ | absent |
| CF1 | PASS | Focus-scoped Passport sticky residual exposes clear-focus cue | {"present":true,"scope":"focus","focus":"sub-diff","focusCount":"2","globalCount":"5","badge":"2","copy":"Focus path · 2 paths blocked","cue":true,"cueLabel":"Clear focus","cueClass":true,"gateState":"rejected","winFocus":"sub-diff"} |
| shot:passport-clear-focus-cue.png | PASS | screenshot passport-clear-focus-cue.png is not a black frame | luma=0.935 1440x900 bytes=167310 |
| CF3 | PASS | screenshot passport-clear-focus-cue.png is not a black frame | luma=0.935 1440x900 bytes=167310 |
| CF2 | PASS | Clear-focus cue restores global Passport residual + clears Trace focus chrome | {"after":{"present":true,"scope":"global","focus":null,"focusCount":null,"globalCount":"5","badge":"5","copy":"Sign-off incomplete · 5 paths blocked","cue":false,"gateState":"rejected","winFocus":"","adj":0},"legend":{"focus":"","scope":"global","chips":0},"before":{"present":true,"scope":"focus","focus":"sub-diff","focusCount":"2","globalCount":"5","badge":"2","copy":"Focus path · 2 paths blocked","cue":true,"cueLabel":"Clear focus","cueClass":true,"gateState":"rejected","winFocus":"sub-diff"}} |
| CF4 | PASS | Passport clear-focus cue did not write .graphide/stamps/ | absent |
| RF1 | PASS | Trace legend residual filter toggle present; bearing nodes marked while filter off | {"legend":true,"filterAttr":"","toggle":true,"pressed":"false","label":"residuals","isChipClass":true,"bearingN":3,"filteredN":0,"nodeN":8,"kindChips":3,"focus":"","winFocus":""} |
| shot:trajectory-legend-residual-filter.png | PASS | screenshot trajectory-legend-residual-filter.png is not a black frame | luma=0.936 1440x900 bytes=173960 |
| RF3 | PASS | screenshot trajectory-legend-residual-filter.png is not a black frame | luma=0.936 1440x900 bytes=173960 |
| RF2 | PASS | Residual filter toggles on (dims non-bearing) then off without changing traj focus | {"on":{"filterAttr":"on","pressed":"true","label":"residuals on","bearingN":3,"filteredN":5,"filteredClassN":5,"bearingAlsoFiltered":0,"nonBearingUnfiltered":0,"winFocus":"","kindChips":3},"off":{"filterAttr":"","pressed":"false","label":"residuals","filteredN":0,"winFocus":""},"focusBefore":""} |
| RF4 | PASS | Trace legend residual filter step did not write .graphide/stamps/ | absent |
| RK1 | PASS | Trace R key turns residual filter ON (same chrome as click toggle) | {"filterAttr":"on","pressed":"true","label":"residuals on","bearingN":3,"filteredN":5,"filteredClassN":5,"bearingAlsoFiltered":0,"nonBearingUnfiltered":0,"keysDoc":true} |
| shot:trajectory-residual-filter-key.png | PASS | screenshot trajectory-residual-filter-key.png is not a black frame | luma=0.936 1440x900 bytes=173856 |
| RK3 | PASS | screenshot trajectory-residual-filter-key.png is not a black frame | luma=0.936 1440x900 bytes=173856 |
| RK2 | PASS | Trace R key again turns residual filter OFF (sync with click chrome) | {"filterAttr":"","pressed":"false","label":"residuals","filteredN":0} |
| RK4 | PASS | Trace residual-filter key step did not write .graphide/stamps/ | absent |
| PM1 | PASS | Passport sticky residual-filter toggle present; bearing gate paths marked while filter off | {"residual":true,"filterAttr":"","toggle":true,"pressed":"false","label":"residuals","isToggleClass":true,"bearingN":3,"filteredN":0,"pathN":5,"gateState":"rejected","paths":[{"path":"extension/media/src/graph/desk.js","traj":"sub-edit","bearing":true,"filtered":false,"filteredClass":false},{"path":"extension/media/src/chrome/GraphBar.jsx","traj":"","bearing":false,"filtered":false,"filteredClass":false},{"path":"extension/media/main.css","traj":"","bearing":false,"filtered":false,"filteredClass":false},{"path":"extension/media/src/graph/trajectory-fixture.js","traj":"sub-fixture","bearing":true,"filtered":false,"filteredClass":false},{"path":"extension/scripts/passport-fixture.json","traj":"sub-passport","bearing":true,"filtered":false,"filteredClass":false}]} |
| shot:passport-residual-filter-mirror.png | PASS | screenshot passport-residual-filter-mirror.png is not a black frame | luma=0.928 1440x900 bytes=166471 |
| PM3 | PASS | screenshot passport-residual-filter-mirror.png is not a black frame | luma=0.928 1440x900 bytes=166471 |
| PM2 | PASS | Passport residual filter toggles on (dims non-bearing paths, syncs Trace) then off | {"on":{"filterAttr":"on","pressed":"true","label":"residuals on","bearingN":3,"filteredN":2,"filteredClassN":2,"bearingAlsoFiltered":0,"nonBearingUnfiltered":0},"trace":{"filterAttr":"on","pressed":"true","filteredN":5},"off":{"filterAttr":"","pressed":"false","label":"residuals","filteredN":0}} |
| PM4 | PASS | Passport residual-filter mirror step did not write .graphide/stamps/ | absent |
| WL1 | PASS | Leaving Trace/Passport for Map clears residual filter (return Trace OFF) | {"onBefore":{"filterAttr":"on","pressed":"true","filteredN":5},"filterAttr":"","pressed":"false","label":"residuals","filteredN":0} |
| WL2 | PASS | Trace↔Passport hop keeps residual filter ON (shared sync intact) | {"passport":{"filterAttr":"on","pressed":"true","filteredN":2},"trace":{"filterAttr":"on","pressed":"true","filteredN":5}} |
| shot:residual-filter-ws-leave.png | PASS | screenshot residual-filter-ws-leave.png is not a black frame | luma=0.944 1440x900 bytes=171422 |
| WL3 | PASS | screenshot residual-filter-ws-leave.png is not a black frame | luma=0.944 1440x900 bytes=171422 |
| WL4 | PASS | Residual-filter ws-leave step did not write .graphide/stamps/ | absent |
| FE1 | PASS | Residual filter ON + gate approved shows Trace/Passport empty chrome + clear affordance | {"passport":{"filterAttr":"on","gateState":"approved","gateEmptyAttr":"1","empty":true,"clear":true,"title":"No residual paths match","bearingN":0,"filteredN":5,"pathN":5},"trace":{"filterAttr":"on","hostEmptyAttr":"1","empty":true,"clear":true,"title":"No residual-bearing nodes","bearingN":0,"filteredN":8,"nodeN":8,"emptyH":161.78125,"emptyW":454}} |
| shot:residual-filter-empty.png | PASS | screenshot residual-filter-empty.png is not a black frame | luma=0.904 1440x900 bytes=158064 |
| FE3 | PASS | screenshot residual-filter-empty.png is not a black frame | luma=0.904 1440x900 bytes=158064 |
| FE2 | PASS | Clear residual filter affordance turns filter OFF and hides empty chrome | {"filterAttr":"","pressed":"false","hostEmptyAttr":"","empty":false,"filteredN":0,"bearingN":0} |
| FE4 | PASS | Residual-filter empty chrome step did not write .graphide/stamps/ | absent |
| CC1 | PASS | Residual filter ON + bearings shows Trace legend Clear-filter cue (no empty chrome) | {"filterAttr":"on","cue":true,"cueText":"Clear filter","cueClass":"traj-legend-chip legend-clear-filter","empty":false,"emptyClear":false,"bearingN":3,"filteredN":5,"cueH":21,"cueW":73.9375} |
| shot:trajectory-legend-clear-filter.png | PASS | screenshot trajectory-legend-clear-filter.png is not a black frame | luma=0.936 1440x900 bytes=174154 |
| CC3 | PASS | screenshot trajectory-legend-clear-filter.png is not a black frame | luma=0.936 1440x900 bytes=174154 |
| CC2 | PASS | Legend Clear-filter cue turns filter OFF and hides cue | {"filterAttr":"","pressed":"false","cue":false,"filteredN":0,"bearingN":3} |
| CC4 | PASS | Trace legend clear-filter cue step did not write .graphide/stamps/ | absent |
| PCF1 | PASS | Residual filter ON + bearings shows Passport sticky Clear-filter cue (no empty chrome) | {"filterAttr":"on","cue":true,"cueText":"Clear filter","cueClass":"passport-sticky-clear-filter","empty":false,"emptyClear":false,"bearingN":3,"filteredN":2,"cueH":20.296875,"cueW":75.9375} |
| shot:passport-sticky-clear-filter.png | PASS | screenshot passport-sticky-clear-filter.png is not a black frame | luma=0.925 1440x900 bytes=165666 |
| PCF3 | PASS | screenshot passport-sticky-clear-filter.png is not a black frame | luma=0.925 1440x900 bytes=165666 |
| PCF2 | PASS | Passport sticky Clear-filter cue turns filter OFF and hides cue | {"filterAttr":"","pressed":"false","cue":false,"bearingN":3,"filteredN":0} |
| PCF4 | PASS | Passport sticky clear-filter cue step did not write .graphide/stamps/ | absent |
| shot:trajectory-legend-residual-filter-count.png | PASS | screenshot trajectory-legend-residual-filter-count.png is not a black frame | luma=0.936 1440x900 bytes=174170 |
| RFC1 | PASS | Residual filter ON + bearings shows Trace+Passport residual-filter count chips (paired N) | {"trace":{"filterAttr":"on","chip":true,"chipClass":"traj-legend-chip residual-filter-count","chipText":"3filter · 3","nAttr":"3","hostN":"3","clearCue":true,"empty":false,"bearingN":3,"chipH":22.296875,"chipW":86.640625},"passport":{"filterAttr":"on","chip":true,"chipClass":"passport-residual-filter-count","chipText":"filter · 3","nAttr":"3","hostN":"3","clearCue":true,"empty":false,"bearingN":3,"chipH":20.296875,"chipW":61.234375},"pairedN":3} |
| shot:passport-residual-filter-count.png | PASS | screenshot passport-residual-filter-count.png is not a black frame | luma=0.928 1440x900 bytes=166425 |
| RFC3 | PASS | screenshots trajectory-legend-residual-filter-count.png + passport-residual-filter-count.png are not black frames | {"trace":"luma=0.936 1440x900 bytes=174170","passport":"luma=0.928 1440x900 bytes=166425"} |
| RFC2 | PASS | Residual filter OFF hides residual-filter count chip (Trace + Passport) | {"filterAttr":"","legendChip":false,"anyChip":false,"hostN":null} |
| RFC4 | PASS | Residual-filter count chip step did not write .graphide/stamps/ | absent |
| KH1 | PASS | Trace Keys R row shows residual-filter binding (not PATH-only) | {"open":true,"binding":"residual-filter","hint":"1","bindingText":"residual filter","rowH":17,"rowW":319.328125} |
| shot:keys-residual-filter.png | PASS | screenshot keys-residual-filter.png is not a black frame | luma=0.938 1440x900 bytes=196120 |
| KH2 | PASS | Passport Keys R row shows residual-filter binding | {"open":true,"binding":"residual-filter","hint":"1","bindingText":"residual filter"} |
| KH3 | PASS | screenshot keys-residual-filter.png is not a black frame; Map Keys keeps PATH | {"shot":"luma=0.938 1440x900 bytes=196120","map":{"open":true,"binding":"path","hint":"0","bindingText":"PATH"}} |
| KH4 | PASS | Keys residual-filter hint step did not write .graphide/stamps/ | absent |
| KP1 | PASS | Trace residual ON → toast Residuals on (ok) + Keys R row pressed | {"toast":{"text":"Residuals on","on":true,"ok":true,"hidden":false},"row":{"open":true,"pressed":"1","aria":"true","onCls":true,"pressedCls":true,"binding":"residual-filter","rowH":17,"rowW":319.328125}} |
| shot:keys-residual-pressed.png | PASS | screenshot keys-residual-pressed.png is not a black frame | luma=0.935 1440x900 bytes=191289 |
| KP2 | PASS | Trace residual OFF → toast Residuals off (skip) + Keys R pressed cleared | {"toast":{"text":"Residuals off","on":true,"skip":true},"row":{"pressed":"0","aria":"false","onCls":false,"pressedCls":false}} |
| KP3 | PASS | Map leave clears Keys R pressed; no-op clear does not toast; pressed PNG ok | {"map":{"pressed":"0","aria":"false","binding":"path","onCls":false},"noop":{"text":"","on":false,"hidden":true},"noop2":{"before":{"text":"","on":false},"afterText":"","afterOn":false,"hadClear":false,"filterPressed":"false"},"shot":"luma=0.935 1440x900 bytes=191289"} |
| KP4 | PASS | Keys R pressed + residual toast step did not write .graphide/stamps/ | absent |
| KA1 | PASS | Trace Keys shows ADE section header (data-keys-ws=trace) | {"open":true,"section":"ade","ws":"trace","hidden":false,"title":"Trace · residual bindings","secH":25,"secW":319.328125,"rowBinding":"residual-filter"} |
| shot:keys-ade-section.png | PASS | screenshot keys-ade-section.png is not a black frame | luma=0.938 1440x900 bytes=196173 |
| KA2 | PASS | Passport Keys shows ADE section header (data-keys-ws=passport) | {"open":true,"section":"ade","ws":"passport","hidden":false,"title":"Passport · residual bindings"} |
| KA3 | PASS | Map Keys hides ADE section; keys-ade-section.png not a black frame | {"map":{"open":true,"hidden":true,"ws":null,"title":"","binding":"path"},"shot":"luma=0.938 1440x900 bytes=196173"} |
| KA4 | PASS | Keys ADE section header step did not write .graphide/stamps/ | absent |
| ALR1 | PASS | Trace residual ON → #residualFilterLive on+N (toast still Residuals on) | {"text":"Residual filter on, 3 matching","n":3,"chipN":3,"liveAttr":"1","state":"on","ariaLive":"polite","role":"status","atomic":"true","srOnly":true,"hidden":false,"toastOn":true,"toastText":"Residuals on"} |
| shot:residual-filter-aria-live.png | PASS | screenshot residual-filter-aria-live.png is not a black frame | luma=0.936 1440x900 bytes=174145 |
| ALR2 | PASS | Trace residual OFF → #residualFilterLive off (toast Residuals off) | {"text":"Residual filter off","state":"off","countAttr":null,"toastText":"Residuals off","toastSkip":true} |
| ALR3 | PASS | Clear-filter cue → live off; residual-filter-aria-live.png not a black frame | {"clear":{"text":"Residual filter off","state":"off"},"shot":"luma=0.936 1440x900 bytes=174145"} |
| ALR4 | PASS | Residual-filter aria-live step did not write .graphide/stamps/ | absent |
| PKP1 | PASS | Passport residual ON → Keys R row pressed (residual-filter binding) | {"open":true,"pressed":"1","aria":"true","onCls":true,"pressedCls":true,"binding":"residual-filter","hint":"1","ws":"passport","rowH":17,"rowW":319.328125} |
| shot:passport-keys-residual-pressed.png | PASS | screenshot passport-keys-residual-pressed.png is not a black frame | luma=0.926 1440x900 bytes=183282 |
| PKP2 | PASS | Passport residual OFF → Keys R pressed cleared (binding stays residual-filter) | {"pressed":"0","aria":"false","onCls":false,"pressedCls":false,"binding":"residual-filter"} |
| PKP3 | PASS | Map leave clears Passport Keys R pressed; passport-keys-residual-pressed.png ok | {"map":{"pressed":"0","aria":"false","binding":"path","onCls":false},"shot":"luma=0.926 1440x900 bytes=183282"} |
| PKP4 | PASS | Passport Keys pressed proof step did not write .graphide/stamps/ | absent |
| LRP1 | PASS | Trace filter ON + Approve → Trace paint refreshes #residualFilterLive to 0 matching (no toast) | {"before":{"text":"Residual filter on, 3 matching","n":3,"countAttr":"3"},"after":{"text":"Residual filter on, 0 matching","state":"on","countAttr":"0","toastOn":false,"toastText":"","empty":true}} |
| LRP2 | PASS | Passport filter ON + Approve paint refreshes live N to 0 (no toast; count chip hidden) | {"before":{"text":"Residual filter on, 3 matching","n":3},"after":{"text":"Residual filter on, 0 matching","state":"on","countAttr":"0","toastOn":false,"toastText":"","chipPresent":false,"empty":true}} |
| shot:residual-filter-live-paint-refresh.png | PASS | screenshot residual-filter-live-paint-refresh.png is not a black frame | luma=0.916 1440x900 bytes=156450 |
| LRP3 | PASS | Filter OFF stays off across Trace/Passport paint; ALR toggle intact; proof shot ok | {"offPaint":{"text":"Residual filter off","state":"off","countAttr":null},"shot":"luma=0.916 1440x900 bytes=156450"} |
| LRP4 | PASS | Residual-filter live paint refresh step did not write .graphide/stamps/ | absent |
| CFV1 | PASS | Trace empty Clear residual filter shows CC/PCF-matching :focus-visible outline ring | {"trace":{"present":true,"focused":true,"focusVisible":true,"outlineStyle":"solid","outlineWidth":"1px","outlineOffset":"1px","outlineColor":"color(srgb 0 0.478431 1 / 0.8)","cls":true,"label":"Clear residual filter"},"passport":{"present":true,"focused":true,"focusVisible":true,"outlineStyle":"solid","outlineWidth":"1px","outlineOffset":"1px","outlineColor":"color(srgb 0 0.478431 1 / 0.8)","cls":true,"label":"Clear residual filter"}} |
| CFV2 | PASS | Passport empty Clear residual filter shows CC/PCF-matching :focus-visible outline ring | {"passport":{"present":true,"focused":true,"focusVisible":true,"outlineStyle":"solid","outlineWidth":"1px","outlineOffset":"1px","outlineColor":"color(srgb 0 0.478431 1 / 0.8)","cls":true,"label":"Clear residual filter"},"trace":{"present":true,"focused":true,"focusVisible":true,"outlineStyle":"solid","outlineWidth":"1px","outlineOffset":"1px","outlineColor":"color(srgb 0 0.478431 1 / 0.8)","cls":true,"label":"Clear residual filter"}} |
| shot:residual-filter-clear-focus-visible.png | PASS | screenshot residual-filter-clear-focus-visible.png is not a black frame | luma=0.901 1440x900 bytes=159499 |
| CFV3 | PASS | screenshot residual-filter-clear-focus-visible.png is not a black frame | luma=0.901 1440x900 bytes=159499 |
| CFV4 | PASS | Residual-filter clear focus-visible step did not write .graphide/stamps/ | absent |
| TFV1 | PASS | Trace legend residual-filter toggle shows warning-themed :focus-visible outline ring | {"trace":{"present":true,"focused":true,"focusVisible":true,"outlineStyle":"solid","outlineWidth":"1px","outlineOffset":"1px","outlineColor":"color(srgb 0.8 0.654902 0 / 0.8)","cls":true,"pressedBefore":"false","pressedAfter":"false","label":"Toggle residual-bearing filter"},"passport":{"present":true,"focused":true,"focusVisible":true,"outlineStyle":"solid","outlineWidth":"1px","outlineOffset":"1px","outlineColor":"color(srgb 0.8 0.654902 0 / 0.8)","cls":true,"pressedBefore":"false","pressedAfter":"false","label":"Toggle residual-bearing filter"}} |
| TFV2 | PASS | Passport sticky residual-filter toggle shows warning-themed :focus-visible outline ring | {"passport":{"present":true,"focused":true,"focusVisible":true,"outlineStyle":"solid","outlineWidth":"1px","outlineOffset":"1px","outlineColor":"color(srgb 0.8 0.654902 0 / 0.8)","cls":true,"pressedBefore":"false","pressedAfter":"false","label":"Toggle residual-bearing filter"},"trace":{"present":true,"focused":true,"focusVisible":true,"outlineStyle":"solid","outlineWidth":"1px","outlineOffset":"1px","outlineColor":"color(srgb 0.8 0.654902 0 / 0.8)","cls":true,"pressedBefore":"false","pressedAfter":"false","label":"Toggle residual-bearing filter"}} |
| shot:residual-filter-toggle-focus-visible.png | PASS | screenshot residual-filter-toggle-focus-visible.png is not a black frame | luma=0.928 1440x900 bytes=165617 |
| TFV3 | PASS | screenshot residual-filter-toggle-focus-visible.png is not a black frame | luma=0.928 1440x900 bytes=165617 |
| TFV4 | PASS | Residual-filter toggle focus-visible step did not write .graphide/stamps/ | absent |
| ESC1 | PASS | Trace residual ON + Escape (no chrome) clears filter + live off | {"filterAttr":"","liveState":"off","liveText":"Residual filter off","pressed":"false","keysHidden":true} |
| ESC2 | PASS | Keys Escape closes pane first (filter stays ON); next Escape clears on Trace+Passport | {"mid":{"keysHidden":true,"filterOn":true,"liveState":"on"},"filterAttr":"","liveState":"off","keysHidden":true} |
| shot:residual-filter-escape-clear.png | PASS | screenshot residual-filter-escape-clear.png is not a black frame | luma=0.938 1440x900 bytes=179124 |
| ESC3 | PASS | Trace filter OFF Escape is no-op; residual-filter-escape-clear.png not a black frame | {"beforeOff":{"filterAttr":"","liveState":"off","liveText":"Residual filter off","pressed":"false","ws":"trace"},"afterOff":{"filterAttr":"","liveState":"off","liveText":"Residual filter off","pressed":"false"},"shot":"luma=0.938 1440x900 bytes=179124"} |
| ESC4 | PASS | Residual-filter Escape clear step did not write .graphide/stamps/ | absent |
| CCF1 | PASS | Trace legend residual-filter count chip is keyboard-reachable status with :focus-visible; Enter/Space does not clear | {"present":true,"focused":true,"focusVisible":true,"tabindex":"0","role":"status","outlineStyle":"solid","outlineWidth":"1px","outlineOffset":"1px","pointerEvents":"auto","nAttr":"3","name":"Residual filter matches 3. Clear filter or Escape to clear","filterBefore":"on","filterAfter":"on","cls":true} |
| CCF2 | PASS | Passport sticky residual-filter count chip is keyboard-reachable status with :focus-visible; Enter/Space does not clear | {"present":true,"focused":true,"focusVisible":true,"tabindex":"0","role":"status","outlineStyle":"solid","outlineWidth":"1px","outlineOffset":"1px","pointerEvents":"auto","nAttr":"3","name":"Residual filter matches 3. Clear filter or Escape to clear","filterBefore":"on","filterAfter":"on","cls":true} |
| shot:residual-filter-count-chip-focus.png | PASS | screenshot residual-filter-count-chip-focus.png is not a black frame | luma=0.927 1440x900 bytes=169634 |
| CCF3 | PASS | screenshot residual-filter-count-chip-focus.png is not a black frame | luma=0.927 1440x900 bytes=169634 |
| CCF4 | PASS | Residual-filter count-chip focus step did not write .graphide/stamps/ | absent |
| FHP1 | PASS | Trace legend residual-filter count chip has pressed/ON chrome parity with toggle (inset + matching bg) | {"present":true,"hostOn":true,"hostAttr":"on","chipInset":true,"toggleInset":true,"chipShadow":"color(srgb 0.8 0.654902 0 / 0.5) 0px 0px 0px 1px inset","toggleShadow":"color(srgb 0.8 0.654902 0 / 0.5) 0px 0px 0px 1px inset","chipBg":"color(srgb 0.308706 0.268078 0.0847059)","toggleBg":"color(srgb 0.308706 0.268078 0.0847059)","bgParity":true,"shadowParity":true,"tabindex":"0","role":"status","filterBefore":"on","filterAfter":"on","cls":true} |
| FHP2 | PASS | Passport sticky residual-filter count chip has pressed/ON chrome parity with toggle; host ON outline cue retained | {"present":true,"hostOn":true,"hostAttr":"on","chipInset":true,"toggleInset":true,"hostInset":false,"hostOutlineSolid":true,"hostOutline1px":true,"hostOutlineOffset2":true,"chipShadow":"color(srgb 0.8 0.654902 0 / 0.5) 0px 0px 0px 1px inset","toggleShadow":"color(srgb 0.8 0.654902 0 / 0.5) 0px 0px 0px 1px inset","chipBg":"color(srgb 0.308706 0.268078 0.0847059)","toggleBg":"color(srgb 0.308706 0.268078 0.0847059)","bgParity":true,"shadowParity":true,"tabindex":"0","role":"status","filterBefore":"on","filterAfter":"on","cls":true} |
| shot:residual-filter-count-host-parity.png | PASS | screenshot residual-filter-count-host-parity.png is not a black frame | luma=0.927 1440x900 bytes=168952 |
| FHP3 | PASS | screenshot residual-filter-count-host-parity.png is not a black frame | luma=0.927 1440x900 bytes=168952 |
| FHP4 | PASS | Residual-filter count host parity step did not write .graphide/stamps/ | absent |
| HOP1 | PASS | Trace + Passport residual-filter hosts share ON outline cue (1px solid / offset 2px); Passport has no ON inset | {"hopTrace":{"present":true,"hostOn":true,"outlineStyle":"solid","outlineWidth":"1px","outlineOffset":"2px","outlineColor":"color(srgb 0.8 0.654902 0 / 0.55)","boxShadow":"none","hostInset":false},"hopPass":{"present":true,"hostOn":true,"outlineStyle":"solid","outlineWidth":"1px","outlineOffset":"2px","outlineColor":"color(srgb 0.8 0.654902 0 / 0.55)","boxShadowOn":"none","boxShadowOff":"none","hostInsetOn":false,"shadowUnchanged":true},"hopPassOn":{"present":true,"hostOn":true,"outlineStyle":"solid","outlineWidth":"1px","outlineOffset":"2px","outlineColor":"color(srgb 0.8 0.654902 0 / 0.55)","boxShadow":"none","hostInset":false}} |
| shot:residual-filter-host-on-cue-parity.png | PASS | screenshot residual-filter-host-on-cue-parity.png is not a black frame | luma=0.933 1440x1800 bytes=359381 stitch=ok |
| HOP2 | PASS | screenshot residual-filter-host-on-cue-parity.png shows Trace+Passport hosts ON with shared outline; no stamps | {"hopShot":"luma=0.933 1440x1800 bytes=359381 stitch=ok","hopTraceVisible":{"visible":true,"hostOn":true,"outlineSolid":true,"stampNodes":0},"hopPassVisible":{"visible":true,"hostOn":true,"outlineSolid":true,"stampNodes":0},"stitchStatus":0} |
| HOP3 | PASS | Under shared host outline, FHP count-chip inset/28% pressed chrome remains; host has outline not inset | {"present":true,"hostOn":true,"chipInset":true,"toggleInset":true,"bgParity":true,"hostOutline":true,"hostNoInset":true} |
| HOP4 | PASS | Residual-filter host ON cue parity step did not write .graphide/stamps/ | absent |
| CAF1 | PASS | Trace legend clear-filter shows themed :active/.press flash (darker bg + inset) beyond resting chrome | {"present":true,"cls":true,"restBg":"rgb(0, 122, 255)","pressBg":"oklab(0.602745 -0.0473846 -0.212476)","restInset":false,"pressInset":true,"pressShadow":"color(srgb 0 0.22 0.461569) 0px 0px 0px 1px inset","bgChanged":true,"label":"Clear residual filter"} |
| CAF2 | PASS | Passport sticky clear + empty Clear show themed :active/.press flash (darker bg + inset) | {"passport":{"present":true,"cls":true,"restBg":"rgb(0, 122, 255)","pressBg":"oklab(0.602745 -0.0473846 -0.212476)","restInset":false,"pressInset":true,"pressShadow":"color(srgb 0 0.22 0.461569) 0px 0px 0px 1px inset","bgChanged":true,"label":"Clear residual filter"},"fe":{"present":true,"cls":true,"restBg":"rgb(0, 122, 255)","pressBg":"oklab(0.602745 -0.0473846 -0.212476)","restInset":false,"pressInset":true,"bgChanged":true,"label":"Clear residual filter"}} |
| shot:residual-filter-clear-active-flash.png | PASS | screenshot residual-filter-clear-active-flash.png is not a black frame | luma=0.915 1440x900 bytes=159084 |
| CAF3 | PASS | screenshot residual-filter-clear-active-flash.png is not a black frame | luma=0.915 1440x900 bytes=159084 |
| CAF4 | PASS | Clear-filter active flash step did not write .graphide/stamps/ | absent |
| CCT1 | PASS | Trace legend residual-filter count chip Enter/Space/click toasts non-clearing hint; filter stays ON | {"present":true,"focused":true,"role":"status","filterBefore":"on","filterAfterEnter":"on","filterAfter":"on","toastText":"Residual filter stays ON — use Clear, R, or Escape to clear","toastOn":true,"toastSkip":true,"spaceText":"Residual filter stays ON — use Clear, R, or Escape to clear","spaceOn":true,"clickText":"Residual filter stays ON — use Clear, R, or Escape to clear","clickOn":true,"staysOnCopy":true,"howToClear":true} |
| CCT2 | PASS | Passport sticky residual-filter count chip Enter toasts non-clearing hint; filter stays ON | {"present":true,"focused":true,"role":"status","cls":true,"filterBefore":"on","filterAfter":"on","toastText":"Residual filter stays ON — use Clear, R, or Escape to clear","toastOn":true,"toastSkip":true,"staysOnCopy":true,"howToClear":true} |
| shot:residual-filter-count-chip-toast-hint.png | PASS | screenshot residual-filter-count-chip-toast-hint.png is not a black frame | luma=0.927 1440x900 bytes=169641 |
| CCT3 | PASS | screenshot residual-filter-count-chip-toast-hint.png is not a black frame | luma=0.927 1440x900 bytes=169641 |
| CCT4 | PASS | Residual-filter count-chip toast hint step did not write .graphide/stamps/ | absent |
| CLT1 | PASS | Trace legend Clear filter → toast Residual filter cleared (ok); filter OFF; not Residuals off | {"present":true,"filterBefore":"on","filterAfter":"","toastText":"Residual filter cleared","toastOn":true,"toastOk":true,"clearedCopy":true,"notResidualsOff":true} |
| CLT2 | PASS | Passport sticky Clear + empty FE → Residual filter cleared (ok); Escape → Residuals off (skip) | {"sticky":{"present":true,"filterBefore":"on","filterAfter":"","toastText":"Residual filter cleared","toastOn":true,"toastOk":true,"clearedCopy":true,"notResidualsOff":true},"esc":{"filterAfter":"","toastText":"Residuals off","toastOn":true,"toastSkip":true,"residualsOff":true,"notClearedCopy":true,"liveOff":true},"fe":{"present":true,"toastText":"Residual filter cleared","toastOn":true,"toastOk":true,"clearedCopy":true,"notResidualsOff":true,"emptyGone":true}} |
| shot:residual-filter-clear-confirm-toast.png | PASS | screenshot residual-filter-clear-confirm-toast.png is not a black frame | luma=0.938 1440x900 bytes=179262 |
| CLT3 | PASS | screenshot residual-filter-clear-confirm-toast.png is not a black frame | luma=0.938 1440x900 bytes=179262 |
| CLT4 | PASS | Residual-filter clear-chip confirm toast step did not write .graphide/stamps/ | absent |
| TAF1 | PASS | Trace legend residual-filter toggle shows themed :active/.press flash (darker warning bg + inset) for OFF and ON beyond resting chrome | {"off":{"present":true,"cls":true,"pressedAttr":"false","restBg":"color(srgb 0.199529 0.182118 0.103529)","pressBg":"oklab(0.301856 -0.00419905 0.0333494)","restInset":false,"pressInset":true,"pressShadow":"color(srgb 0.304 0.248863 0) 0px 0px 0px 1px inset","bgChanged":true,"label":"Toggle residual-bearing filter"},"on":{"present":true,"pressedAttr":"true","restBg":"color(srgb 0.308706 0.268078 0.0847059)","pressBg":"oklab(0.38834 -0.00761537 0.0654539)","restInset":true,"pressInset":true,"bgChanged":true}} |
| TAF2 | PASS | Passport residual-filter toggle shows themed :active/.press flash (darker warning bg + inset) for ON and OFF | {"on":{"present":true,"cls":true,"pressedAttr":"true","restBg":"color(srgb 0.308706 0.268078 0.0847059)","pressBg":"oklab(0.38834 -0.00761537 0.0654539)","restInset":true,"pressInset":true,"bgChanged":true},"off":{"present":true,"cls":true,"pressedAttr":"false","restBg":"color(srgb 0.199529 0.182118 0.103529)","pressBg":"oklab(0.301856 -0.00419905 0.0333494)","restInset":false,"pressInset":true,"bgChanged":true,"label":"Toggle residual-bearing filter"}} |
| shot:residual-filter-toggle-active-flash.png | PASS | screenshot residual-filter-toggle-active-flash.png is not a black frame | luma=0.924 1440x900 bytes=164656 |
| TAF3 | PASS | screenshot residual-filter-toggle-active-flash.png is not a black frame | luma=0.924 1440x900 bytes=164656 |
| TAF4 | PASS | Residual-filter toggle active flash step did not write .graphide/stamps/ | absent |
| CFR1 | PASS | Trace legend Clear filter → focus returns to residual-filter toggle (not body) | {"present":true,"filterBefore":"on","filterAfter":"","clearGone":true,"togglePresent":true,"focusedToggle":true,"activeTag":"button","activeIsBody":false} |
| CFR2 | PASS | Passport sticky Clear + empty FE Clear → focus returns to residual-filter toggle | {"sticky":{"present":true,"filterBefore":"on","filterAfter":"","clearGone":true,"togglePresent":true,"focusedToggle":true,"activeIsBody":false},"fe":{"present":true,"emptyGone":true,"togglePresent":true,"focusedToggle":true,"activeIsBody":false}} |
| shot:residual-filter-clear-focus-return.png | PASS | screenshot residual-filter-clear-focus-return.png is not a black frame | luma=0.938 1440x900 bytes=179337 |
| CFR3 | PASS | screenshot residual-filter-clear-focus-return.png is not a black frame | luma=0.938 1440x900 bytes=179337 |
| CFR4 | PASS | Residual-filter clear-chip focus return step did not write .graphide/stamps/ | absent |
| CNA1 | PASS | Trace legend residual-filter count chip shows themed :active/.press flash (darker warning bg + inset) beyond FHP resting chrome | {"present":true,"cls":true,"role":"status","tabIndex":0,"restBg":"color(srgb 0.308706 0.268078 0.0847059)","pressBg":"color(srgb 0.464 0.379843 0)","restInset":true,"pressInset":true,"pressShadow":"color(srgb 0.304 0.248863 0) 0px 0px 0px 1px inset","bgChanged":true,"label":"Residual filter matches 3. Clear filter or Escape to clear"} |
| CNA2 | PASS | Passport sticky residual-filter count chip shows themed :active/.press flash (darker warning bg + inset) beyond FHP resting chrome | {"present":true,"cls":true,"role":"status","tabIndex":0,"restBg":"color(srgb 0.308706 0.268078 0.0847059)","pressBg":"color(srgb 0.464 0.379843 0)","restInset":true,"pressInset":true,"pressShadow":"color(srgb 0.304 0.248863 0) 0px 0px 0px 1px inset","bgChanged":true,"label":"Residual filter matches 3. Clear filter or Escape to clear"} |
| shot:residual-filter-count-active-flash.png | PASS | screenshot residual-filter-count-active-flash.png is not a black frame | luma=0.929 1440x900 bytes=166444 |
| CNA3 | PASS | screenshot residual-filter-count-active-flash.png is not a black frame | luma=0.929 1440x900 bytes=166444 |
| CNA4 | PASS | Residual-filter count-chip active flash step did not write .graphide/stamps/ | absent |
| KAF1 | PASS | Trace Keys R residual-bound row shows themed :active/.press flash (darker warning bg + inset) distinct from KP resting ON | {"present":true,"binding":"residual-filter","hint":"1","kpPressed":"1","kpCls":true,"restBg":"rgba(0, 0, 0, 0)","pressBg":"color(srgb 0.464 0.379843 0)","restInset":false,"pressInset":true,"pressShadow":"color(srgb 0.304 0.248863 0) 0px 0px 0px 1px inset","bgChanged":true,"aria":"true"} |
| KAF2 | PASS | Passport Keys R residual-bound row shows themed :active/.press flash; Map PATH binding does not | {"present":true,"binding":"residual-filter","kpPressed":"1","kpCls":true,"restBg":"rgba(0, 0, 0, 0)","pressBg":"color(srgb 0.464 0.379843 0)","restInset":false,"pressInset":true,"bgChanged":true,"mapProbe":{"unboundBg":"rgba(0, 0, 0, 0)","unboundInset":false,"unboundMatchesRest":true}} |
| shot:keys-r-active-flash.png | PASS | screenshot keys-r-active-flash.png is not a black frame | luma=0.929 1440x900 bytes=182986 |
| KAF3 | PASS | screenshot keys-r-active-flash.png is not a black frame | luma=0.929 1440x900 bytes=182986 |
| KAF4 | PASS | Keys R active flash step did not write .graphide/stamps/ | absent |
| CHC1 | PASS | Trace legend residual-filter count chip :hover lifts warning bg above FHP, cursor:help, not Clear blue; title/aria keep Clear/R/Escape | {"rest":{"present":true,"cls":true,"role":"status","tabIndex":0,"restBg":"color(srgb 0.308706 0.268078 0.0847059)","restBorder":"color(srgb 0.713989 0.590991 0.0400192 / 0.648824)","restCursor":"help","label":"Residual filter matches 3. Clear filter or Escape to clear","clearHoverBg":null},"hover":{"present":true,"hoverBg":"color(srgb 0.376941 0.321804 0.0729412)","hoverBorder":"color(srgb 0.751423 0.618807 0.0226017 / 0.765882)","hoverCursor":"help","clearRestBg":"rgb(0, 122, 255)"},"chcLabelOk":true} |
| CHC2 | PASS | Passport sticky residual-filter count chip :hover lifts warning bg above FHP, cursor:help, not Clear blue; title/aria keep Clear/R/Escape | {"rest":{"present":true,"cls":true,"role":"status","tabIndex":0,"restBg":"color(srgb 0.308706 0.268078 0.0847059)","restBorder":"color(srgb 0.713989 0.590991 0.0400192 / 0.648824)","restCursor":"help","label":"Residual filter matches 3. Clear filter or Escape to clear"},"hover":{"present":true,"hoverBg":"color(srgb 0.376941 0.321804 0.0729412)","hoverBorder":"color(srgb 0.751423 0.618807 0.0226017 / 0.765882)","hoverCursor":"help","clearRestBg":"rgb(0, 122, 255)"},"chcPassLabelOk":true} |
| shot:residual-filter-count-hover-cue.png | PASS | screenshot residual-filter-count-hover-cue.png is not a black frame | luma=0.925 1440x900 bytes=166067 |
| CHC3 | PASS | screenshot residual-filter-count-hover-cue.png is not a black frame | luma=0.925 1440x900 bytes=166067 |
| CHC4 | PASS | Residual-filter count-chip hover cue step did not write .graphide/stamps/ | absent |
| THC1 | PASS | Trace legend residual-filter toggle :hover lifts warning bg above ON 28%, cursor:pointer, not Clear blue | {"rest":{"present":true,"cls":true,"pressed":"true","restBg":"color(srgb 0.308706 0.268078 0.0847059)","restBorder":"color(srgb 0.713989 0.590991 0.0400192 / 0.648824)","restCursor":"pointer","clearRestBg":"rgb(0, 122, 255)"},"hover":{"present":true,"hoverBg":"oklab(0.411229 -0.00797246 0.0721446)","hoverBorder":"color(srgb 0.755567 0.621886 0.0206736 / 0.78149)","hoverCursor":"pointer"}} |
| THC2 | PASS | Passport sticky residual-filter toggle :hover lifts warning bg above ON 28%, cursor:pointer, not Clear blue | {"rest":{"present":true,"cls":true,"pressed":"true","restBg":"color(srgb 0.308706 0.268078 0.0847059)","restBorder":"color(srgb 0.713989 0.590991 0.0400192 / 0.648824)","restCursor":"pointer","clearRestBg":"rgb(0, 122, 255)"},"hover":{"present":true,"hoverBg":"oklab(0.411242 -0.00797266 0.0721483)","hoverBorder":"color(srgb 0.755567 0.621886 0.0206736 / 0.78149)","hoverCursor":"pointer"}} |
| shot:residual-filter-toggle-hover-cue.png | PASS | screenshot residual-filter-toggle-hover-cue.png is not a black frame | luma=0.926 1440x900 bytes=166612 |
| THC3 | PASS | screenshot residual-filter-toggle-hover-cue.png is not a black frame | luma=0.926 1440x900 bytes=166612 |
| THC4 | PASS | Residual-filter toggle hover cue step did not write .graphide/stamps/ | absent |
| CLC1 | PASS | Trace legend clear-filter :hover lifts blue bg above resting, cursor:pointer, not count-chip warning | {"rest":{"present":true,"cls":true,"restBg":"rgb(0, 122, 255)","restBorder":"color(srgb 0.0202404 0.457516 0.93658 / 0.765882)","restCursor":"pointer","countRestBg":"color(srgb 0.308706 0.268078 0.0847059)"},"hover":{"present":true,"hoverBg":"oklab(0.597173 -0.0466419 -0.196381)","hoverBorder":"color(srgb 0.28 0.568 0.884235)","hoverCursor":"pointer"}} |
| CLC2 | PASS | Passport sticky clear + empty Clear :hover lift blue bg above resting, cursor:pointer | {"passport":{"rest":{"present":true,"cls":true,"restBg":"rgb(0, 122, 255)","restBorder":"color(srgb 0.0202404 0.457516 0.93658 / 0.765882)","restCursor":"pointer"},"hover":{"present":true,"hoverBg":"oklab(0.597186 -0.0466437 -0.196419)","hoverBorder":"color(srgb 0.28 0.568 0.884235)","hoverCursor":"pointer"}},"fe":{"rest":{"present":true,"cls":true,"restBg":"rgb(0, 122, 255)","restBorder":"color(srgb 0 0.478431 1 / 0.7)","restCursor":"pointer"},"hover":{"present":true,"hoverBg":"oklab(0.597201 -0.0466456 -0.196459)","hoverBorder":"color(srgb 0.28 0.568 0.884235)","hoverCursor":"pointer"}}} |
| shot:residual-filter-clear-hover-cue.png | PASS | screenshot residual-filter-clear-hover-cue.png is not a black frame | luma=0.897 1440x900 bytes=147247 |
| CLC3 | PASS | screenshot residual-filter-clear-hover-cue.png is not a black frame | luma=0.897 1440x900 bytes=147247 |
| CLC4 | PASS | Clear-filter hover cue step did not write .graphide/stamps/ | absent |
| EKH2 | PASS | Passport residual-filter empty shows desk-keys R toggle · Esc clear; Clear button remains | {"host":true,"keys":true,"clear":true,"kbds":["R","Esc"],"text":"R toggle · Esc clear","hasDeskKeys":true,"fontSize":"12px","opacity":"0.72"} |
| EKH1 | PASS | Trace residual-filter empty shows desk-keys R toggle · Esc clear; Clear button remains | {"host":true,"keys":true,"clear":true,"kbds":["R","Esc"],"text":"R toggle · Esc clear","hasDeskKeys":true,"hostEmptyAttr":"1"} |
| shot:residual-filter-empty-kbd-hints.png | PASS | screenshot residual-filter-empty-kbd-hints.png is not a black frame | luma=0.915 1440x900 bytes=159440 |
| EKH3 | PASS | screenshot residual-filter-empty-kbd-hints.png not black; Esc clears empty; desk-keys language on both surfaces | {"shot":"luma=0.915 1440x900 bytes=159440","esc":{"emptyGone":true,"filterOff":true},"passDesk":true,"traceDesk":true} |
| EKH4 | PASS | Residual empty kbd hints step did not write .graphide/stamps/ | absent |
| TNI1 | PASS | Every Trace traj-node has matching title+aria-label (id · kind · status · residual) via data-traj-node-info; no SVG edge titles | {"count":8,"allHave":true,"idKindStatus":true,"svgNodeTitle":false,"sample":{"id":"sub-plan","kind":"plan","status":"done","title":"sub-plan · plan · done · 0 deps left · 2 hops","aria":"sub-plan · plan · done · 0 deps left · 2 hops","tipAttr":"1","pressed":"false","tab":"0"},"pressedOk":true,"tabOk":true} |
| TNI2 | PASS | Focused traj-node exposes richer info name; sub-diff omits seal, sub-seal includes seal; data-* / aria-pressed preserved | {"tni2":{"ok":true,"active":true,"title":"sub-diff · diff · done · 0 deps left · 2 hops","aria":"sub-diff · diff · done · 0 deps left · 2 hops","match":true,"hasId":true,"hasKind":true,"hasStatus":true,"hasDeps":true,"hasHops":true,"noSeal":true,"ariaPressed":"false","tipAttr":"1"},"tni2Seal":{"ok":true,"title":"sub-seal · harness · done · 0 deps left · 1 hop · seal","hasSeal":true,"hasId":true,"hasStatus":true}} |
| shot:trajectory-node-info.png | PASS | screenshot trajectory-node-info.png is not a black frame | luma=0.938 1440x900 bytes=178912 |
| TNI3 | PASS | screenshot trajectory-node-info.png not black; title/aria-label richer node info proven on Trace DAG | {"shot":"luma=0.938 1440x900 bytes=178912","tni1":true,"tni2":true} |
| TNI4 | PASS | Trace traj node info step did not write .graphide/stamps/ | absent |
| SCH1 | PASS | Trace #adeSealChip sealed :hover lifts seal-tint bg above resting 16%, cursor:help, matching title/aria/data-seal-info with SEALED, no tabindex | {"rest":{"present":true,"state":"sealed","role":"status","title":"Immutable seal / write-gate stub (fixture): SEALED","ariaLabel":"Immutable seal / write-gate stub (fixture): SEALED","sealInfo":"Immutable seal / write-gate stub (fixture): SEALED","tabIndex":-1,"label":"SEALED","restBg":"color(srgb 0.381647 0.358431 0.253647)","restBorder":"rgb(204, 167, 0)","restCursor":"auto","restShadow":"none"},"hover":{"present":true,"hoverBg":"color(srgb 0.471294 0.421961 0.199294)","hoverBorder":"color(srgb 0.767062 0.630427 0.0153253 / 0.828314)","hoverCursor":"help","hoverShadow":"color(srgb 0.8 0.654902 0 / 0.42) 0px 0px 0px 1px","title":"Immutable seal / write-gate stub (fixture): SEALED","ariaLabel":"Immutable seal / write-gate stub (fixture): SEALED","sealInfo":"Immutable seal / write-gate stub (fixture): SEALED","role":"status","label":"SEALED","tabIndex":-1}} |
| SCH2 | PASS | Passport hop-row unlock + Trace open :hover seal-tint follows --ade-seal; matching title/aria/data-seal-info with state; cursor:help | {"pass":{"rest":{"present":true,"state":"unlock","inHop":true,"role":"status","title":"Immutable seal / write-gate stub (fixture): UNLOCK · ADE_ALLOW","ariaLabel":"Immutable seal / write-gate stub (fixture): UNLOCK · ADE_ALLOW","sealInfo":"Immutable seal / write-gate stub (fixture): UNLOCK · ADE_ALLOW","tabIndex":-1,"label":"UNLOCK · ADE_ALLOW","restBg":"color(srgb 0.253647 0.330196 0.413647)","restCursor":"auto"},"hover":{"present":true,"hoverBg":"color(srgb 0.199294 0.361961 0.539294)","hoverCursor":"help","hoverShadow":"color(srgb 0 0.478431 1 / 0.42) 0px 0px 0px 1px","title":"Immutable seal / write-gate stub (fixture): UNLOCK · ADE_ALLOW","ariaLabel":"Immutable seal / write-gate stub (fixture): UNLOCK · ADE_ALLOW","sealInfo":"Immutable seal / write-gate stub (fixture): UNLOCK · ADE_ALLOW","label":"UNLOCK · ADE_ALLOW"}},"open":{"rest":{"present":true,"state":"open","restBg":"color(srgb 0.293176 0.369726 0.303843)","label":"OPEN · agent","title":"Immutable seal / write-gate stub (fixture): OPEN · agent","ariaLabel":"Immutable seal / write-gate stub (fixture): OPEN · agent","sealInfo":"Immutable seal / write-gate stub (fixture): OPEN · agent"},"hover":{"present":true,"hoverBg":"color(srgb 0.283294 0.445961 0.305961)","hoverCursor":"help","title":"Immutable seal / write-gate stub (fixture): OPEN · agent","ariaLabel":"Immutable seal / write-gate stub (fixture): OPEN · agent","sealInfo":"Immutable seal / write-gate stub (fixture): OPEN · agent"}}} |
| shot:seal-chip-hover-cue.png | PASS | screenshot seal-chip-hover-cue.png is not a black frame | luma=0.939 1440x900 bytes=179943 |
| SCH3 | PASS | screenshot seal-chip-hover-cue.png is not a black frame; SCH hover cue proven | {"shot":"luma=0.939 1440x900 bytes=179943","sch1":true,"sch2":true} |
| SCH4 | PASS | Seal-chip hover cue step did not write .graphide/stamps/ | absent |
| ZFV1 | PASS | Trace #trajZoomIn :focus-visible shows ADE 1px focusBorder ring + hover-matching bg (not global 2px) | {"zin":{"present":true,"id":"trajZoomIn","focused":true,"focusVisible":true,"clsBtn":true,"clsFit":false,"outlineStyle":"solid","outlineWidth":"1px","outlineOffset":"1px","outlineColor":"color(srgb 0 0.478431 1 / 0.8)","focusBg":"oklab(0 0 0 / 0)","restBg":"rgba(0, 0, 0, 0)","restOutline":"3px","label":"Zoom in"},"zout":{"present":true,"id":"trajZoomOut","focused":true,"focusVisible":true,"clsBtn":true,"clsFit":false,"outlineStyle":"solid","outlineWidth":"1px","outlineOffset":"1px","outlineColor":"color(srgb 0 0.478431 1 / 0.8)","focusBg":"oklab(0 0 0 / 0)","restBg":"rgba(0, 0, 0, 0)","restOutline":"3px","label":"Zoom out"}} |
| ZFV2 | PASS | Trace #trajZoomFit + #trajZoomOut :focus-visible show ADE 1px ring + hover-matching bg | {"zfit":{"present":true,"id":"trajZoomFit","focused":true,"focusVisible":true,"clsBtn":true,"clsFit":true,"outlineStyle":"solid","outlineWidth":"1px","outlineOffset":"1px","outlineColor":"color(srgb 0 0.478431 1 / 0.8)","focusBg":"oklab(0 0 0 / 0)","restBg":"rgba(0, 0, 0, 0)","restOutline":"3px","label":"Fit"},"zout":{"present":true,"id":"trajZoomOut","focused":true,"focusVisible":true,"clsBtn":true,"clsFit":false,"outlineStyle":"solid","outlineWidth":"1px","outlineOffset":"1px","outlineColor":"color(srgb 0 0.478431 1 / 0.8)","focusBg":"oklab(0 0 0 / 0)","restBg":"rgba(0, 0, 0, 0)","restOutline":"3px","label":"Zoom out"}} |
| shot:trajectory-zoom-focus-visible.png | PASS | screenshot trajectory-zoom-focus-visible.png is not a black frame | luma=0.941 1440x900 bytes=178123 |
| ZFV3 | PASS | screenshot trajectory-zoom-focus-visible.png is not a black frame; ZFV focus ring proven | luma=0.941 1440x900 bytes=178123 |
| ZFV4 | PASS | Traj zoom-bar focus-visible step did not write .graphide/stamps/ | absent |
| IR1 | PASS | Passport impact rows expose head/detail hierarchy + static string fallback | {"cards":3,"rows":13,"objectRows":12,"staticRows":1,"labelInHead":true,"chipInHead":true,"detailSibling":true,"staticOk":true,"defaultExpanded":"false","defaultAria":"false"} |
| IR2 | PASS | Passport impact-row expand/collapse + hover affordance; static rows inert | {"ir2":{"ok":true,"cs0":"none","cs1":"block","cs2":"none","expanded1":"true","aria1":"true","expanded2":"false","aria2":"false","afterEnter":"false","h1":119.5625,"cursor":"pointer","bg0":"color(srgb 1 1 1 / 0.88)","bgFocus":"color(srgb 1 1 1 / 0.88)","staticChanged":false,"finalExpanded":"true"},"hoverBg":{"before":"color(srgb 1 1 1 / 0.88)","after":"rgba(0, 122, 255, 0.08)"}} |
| shot:passport-impact-rows.png | PASS | screenshot passport-impact-rows.png is not a black frame | luma=0.925 1440x900 bytes=174196 |
| IR3 | PASS | screenshot passport-impact-rows.png is not a black frame | luma=0.925 1440x900 bytes=174196 |
| IR4 | PASS | Passport impact-row chrome did not write .graphide/stamps/ | absent |
| M1 | PASS | Map workspace is active | map |
| M2 | PASS | Map shows a community map, not a lone START card | cards=12 start=1 comm=0 names=render,integration,origin,lod,bodies,camera |
| M2b | PASS | Map stays community LOD (no XYFlow / raw-IR React nodes) | xy=0 cards=12 |
| M3 | PASS | Program chip seed includes bin main | bin main |
| M2d | PASS | Map story hop is the derived Reads edge, not Calls between community ids | {"kind":"Reads","hopFrom":"n1","hopTo":"n2","hidden":false,"text":"Hop · Readsext · 0001→as_str · 0002simulation/as_str.rs:13solarsim::extsolarsim::as_str","ids":["n1","n2"]} |
| shot:map-spine-hop.png | PASS | screenshot map-spine-hop.png is not a black frame | luma=0.962 1440x900 bytes=201349 |
| G1 | PASS | Graph bar controls do not overlap | {"barH":101,"wsEgo":false,"wsPath":false,"wsKinds":false,"egoKinds":false,"wsLegend":false,"kindsLegend":false,"chipHits":0,"cardHits":0,"chips":1,"titleInStage":true,"titleHitsCard":false,"cards":12,"visible":12,"titleInsideViewport":false} |
| G2 | PASS | Map caption sits outside the camera and not on a community card | {"barH":101,"wsEgo":false,"wsPath":false,"wsKinds":false,"egoKinds":false,"wsLegend":false,"kindsLegend":false,"chipHits":0,"cardHits":0,"chips":1,"titleInStage":true,"titleHitsCard":false,"cards":12,"visible":12,"titleInsideViewport":false} |
| G3 | PASS | Fit leaves more than one community card in the stage | visible=12/12 |
| G5 | PASS | Map community cards do not overlap | {"cardHits":0,"visible":12,"cards":12} |
| G6 | PASS | Program chips do not overlap each other or the workspace row | {"chipHits":0,"chips":1,"wsLegend":false,"kindsLegend":false} |
| G4 | PASS | Narrow desk (720) graph bar still does not overlap | {"barH":156,"wsEgo":false,"wsKinds":false,"egoKinds":false,"wsLegend":false,"chipHits":0,"cardHits":0,"visible":12,"cards":12,"spanX":550} |
| G4b | PASS | Narrow desk (720) Map is a grid, not one overlapping column | {"visible":12,"cards":12,"cardHits":0,"spanX":550} |
| G7 | PASS | Opening Evidence still fits more than one community card with no overlap | {"clicked":true,"open":true,"visible":12,"cards":12,"cardHits":0,"chipHits":0} |
| shot:map.png | PASS | screenshot map.png is not a black frame | luma=0.963 1440x900 bytes=170491 |
| AC0 | PASS | explorer Day Map shows bright chrome markers | {"bright":true,"night":false,"dayOn":true,"seg":true,"ws":"map"} |
| AC1 | PASS | #reviewBtn is system blue #007AFF on Day | rgb(0, 122, 255) |
| AC2 | PASS | Stamp / Skip / LLM / Export are capsules | [999,999,999,999] |
| AC3 | PASS | .workspaces is a pill rack with tinted Map .on | {"wsRadius":14,"mapOn":true,"tinted":true,"onBg":"rgba(0, 122, 255, 0.14)","onColor":"rgb(0, 122, 255)"} |
| AC4 | PASS | Map .bubble-card is a soft card with a tinted tile | {"cardR":16,"tile":true,"shadow":"rgba(0, 0, 0, 0.04) 0px 1px 2px 0px, rgba(0, 0, 0, 0.043) 0px 8px 20px 0px"} |
| AC5 | PASS | #coverage is a frosted grouped strip | rgba(255, 255, 255, 0.72) saturate(1.8) blur(20px) |
| AC6 | PASS | Apple chrome keeps Map community LOD (xy=0) | xy=0 cards=12 |
| shot:apple-chrome.png | PASS | screenshot apple-chrome.png is not a black frame | luma=0.963 1440x900 bytes=172337 |
| AC7 | PASS | Apple-chrome step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| AC8 | PASS | Apple-chrome step did not write .graphide/stamps/ | absent |
| AI0 | PASS | workspace buttons contain an icon mark (svg / img / .ws-ico) | {"tabs":13,"withIco":13} |
| AI1 | PASS | Map bubble cards have a visible .tile | {"cards":12,"tiles":12} |
| AI2 | PASS | Apple chrome icons keep Map community LOD (xy=0) | xy=0 cards=12 |
| shot:apple-chrome-icons.png | PASS | screenshot apple-chrome-icons.png is not a black frame | luma=0.963 1440x900 bytes=172337 |
| AI3 | PASS | Apple-chrome-icons step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| AI4 | PASS | Apple-chrome-icons step did not write .graphide/stamps/ | absent |
| FR1 | PASS | Fit (#zoomFit or 0) leaves Map community LOD with more than one card visible | via=zoomFit {"cards":12,"visible":12,"cardHits":0,"xy":0,"comm":0,"ws":"map","fitBtn":true,"reorgBtn":true} |
| FR2 | PASS | Fit does not regress Map card overlap (G5) | {"cardHits":0,"visible":12,"cards":12} |
| FR3 | PASS | Reorganize (#reorgBtn) runs without stamp / skip posts | via=reorgBtn {"cards":12,"visible":12,"cardHits":0,"xy":0,"comm":0,"stampPosts":0,"skipPosts":0,"toast":"Reorganized"} |
| FR4 | PASS | Reorganize keeps Map community LOD and cards (stable or >1) | before=12 {"cards":12,"visible":12,"cardHits":0,"xy":0,"comm":0,"stampPosts":0,"skipPosts":0,"toast":"Reorganized"} |
| shot:fit-reorg.png | PASS | screenshot fit-reorg.png is not a black frame | luma=0.963 1440x900 bytes=174779 |
| FR5 | PASS | Fit / Reorganize did not write .graphide/stamps/ | absent |
| Z1 | PASS | Zoom in (#zoomIn) raises percent / scale; Map stays community LOD | via=zoomIn before={"pct":63,"pctText":"63% · overview","k":0.6292372881355932,"kTf":0.629237,"cards":12,"visible":12,"xy":0,"comm":0,"ws":"map","zoomIn":true,"zoomOut":true} after={"pct":76,"pctText":"76% · labels","k":0.7550847457627118,"kTf":0.755085,"cards":12,"visible":12,"xy":0,"comm":0,"ws":"map","zoomIn":true,"zoomOut":true} |
| shot:zoom.png | PASS | screenshot zoom.png is not a black frame | luma=0.963 1440x900 bytes=177533 |
| Z2 | PASS | Zoom out (#zoomOut) lowers percent / scale; Map stays community LOD | via=zoomOut in={"pct":76,"pctText":"76% · labels","k":0.7550847457627118,"kTf":0.755085,"cards":12,"visible":12,"xy":0,"comm":0,"ws":"map","zoomIn":true,"zoomOut":true} out={"pct":63,"pctText":"63% · overview","k":0.6292372881355932,"cards":12,"visible":12,"xy":0,"comm":0,"stampPosts":0,"skipPosts":0,"ws":"map"} |
| Z3 | PASS | Zoom in / out does not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| Z4 | PASS | Zoom did not write .graphide/stamps/ | absent |
| RC0 | PASS | Map paints communities before recycle | {"cards":12,"xy":0,"comm":0,"lod":"0","k":0.6292372881355932,"ws":"map"} |
| RC1 | PASS | Re-select Map recycles the same .stage / .viewport (keepCam) | {"sameStage":true,"sameVp":true,"cards":12,"xy":0,"comm":0,"lod":"0","k":0.7550847457627118,"wantK":0.7550847457627118,"ws":"map"} |
| RC1b | PASS | Recycled Map story hop still names the member nodes | {"kind":"Reads","hopFrom":"n1","hopTo":"n2","hidden":false,"text":"Hop · Readsext · 0001→as_str · 0002simulation/as_str.rs:13solarsim::extsolarsim::as_str","ids":["n1","n2"]} |
| shot:map-spine-recycle.png | PASS | screenshot map-spine-recycle.png is not a black frame | luma=0.962 1440x900 bytes=202865 |
| RC2 | PASS | Preview / patch recycles Map stage and keeps the camera | {"sameStage":true,"sameVp":true,"cards":12,"xy":0,"comm":0,"lod":"0","k":0.6286289728105852,"stampPosts":0,"skipPosts":0,"ws":"map"} |
| RC3 | PASS | Recycle does not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| shot:canvas-recycle.png | PASS | screenshot canvas-recycle.png is not a black frame | luma=0.959 1440x900 bytes=170418 |
| RC4 | PASS | Canvas recycle did not write .graphide/stamps/ | absent |
| DA0 | PASS | Map paints communities before a coverage-only patch | {"cards":12,"xy":0,"comm":0,"lod":"0","k":0.6292372881355932,"cov":"2 left0 stamped1 skipped1 brokenCoverage 1123 changed · 1123 uncovered · Review 0 stamped · 1 skipped · 1 broken · 2 pending · e.g. ScreenshotFormat, ext, as_str +1120stamp broken boot · +1 / −0unmatched solarsim::MissingHit in boot","ws":"map"} |
| DA1 | PASS | Coverage/findings-only patch keeps the same .stage / .viewport and camera | {"sameStage":true,"sameVp":true,"cards":12,"xy":0,"comm":0,"lod":"0","k":0.6292372881355932,"wantK":0.6292372881355932,"cov":"2 left0 stamped1 skipped1 brokenCoverage 1 changed · 3 uncovered · Review 0 stamped · 1 skipped · 1 broken · 2 pending · e.g. Body, SelectedEntity, PilotModeunmatched solarsim::MissingHit in bootunmatched graphide::OnAnalysisDelta in boot","stampPosts":0,"skipPosts":0,"ws":"map"} |
| DA2 | PASS | Coverage-only patch updates #coverage without posting stamp / skip | {"cov":"2 left0 stamped1 skipped1 brokenCoverage 1 changed · 3 uncovered · Review 0 stamped · 1 skipped · 1 broken · 2 pending · e.g. Body, SelectedEntity, PilotModeunmatched solarsim::MissingHit in bootunmatched graphide::OnAnalysisDelta in boot","stampPosts":0,"skipPosts":0} |
| shot:delta-onanalysis.png | PASS | screenshot delta-onanalysis.png is not a black frame | luma=0.963 1440x900 bytes=172646 |
| DA3 | PASS | Delta onAnalysis did not write .graphide/stamps/ | absent |
| OV0 | PASS | Map paints communities before off-view park | {"cards":12,"off":0,"parked":0,"inStage":12,"ids":["b-render","b-integration","b-origin","b-lod","b-bodies","b-camera","b-config","b-ui","b-physics","b-assets","b-input","b-debug"],"offIds":[],"xy":0,"comm":0,"lod":"0","ws":"map"} |
| OV1 | PASS | Zoom/pan parks off-stage community cards (data-offview) | {"cards":12,"off":4,"parked":4,"inStage":8,"ids":["b-render","b-integration","b-origin","b-lod","b-bodies","b-camera","b-config","b-ui","b-physics","b-assets","b-input","b-debug"],"offIds":["b-render","b-camera","b-config","b-debug"],"xy":0,"comm":0,"lod":"0","ws":"map"} |
| OV2 | PASS | Recycle keeps parked data-bubble identity at community LOD | {"parkedIds":["b-render","b-camera","b-config","b-debug"],"recycle":{"cards":12,"off":4,"parked":4,"inStage":8,"ids":["b-render","b-integration","b-origin","b-lod","b-bodies","b-camera","b-config","b-ui","b-physics","b-assets","b-input","b-debug"],"offIds":["b-render","b-camera","b-config","b-debug"],"xy":0,"comm":0,"lod":"0","ws":"map"}} |
| shot:map-offview.png | PASS | screenshot map-offview.png is not a black frame | luma=0.962 1440x900 bytes=179367 |
| OV3 | PASS | Fit / pan-back restores parked cards (same data-bubble) | via=zoomFit parked=b-render,b-camera,b-config,b-debug {"cards":12,"off":0,"parked":0,"inStage":12,"ids":["b-render","b-integration","b-origin","b-lod","b-bodies","b-camera","b-config","b-ui","b-physics","b-assets","b-input","b-debug"],"offIds":[],"xy":0,"comm":0,"lod":"0","ws":"map"} |
| OV4 | PASS | Off-view park does not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| OV5 | PASS | Map off-view did not write .graphide/stamps/ | absent |
| PT0 | PASS | Map paints communities before a fat coverage/findings patch | {"cards":12,"xy":0,"comm":0,"lod":"0","shed":null,"ws":"map","stampOn":false} |
| PT1 | PASS | Fat panel patch keeps the same .stage / .viewport and sheds findings expansion | {"sameStage":true,"sameVp":true,"cards":12,"xy":0,"comm":0,"lod":"0","shed":"shed","findings":0,"cov":"2 left0 stamped1 skipped1 brokenCoverage 80 changed · 80 uncovered · Review 0 stamped · 1 skipped · 1 broken · 2 pending","hasTimeout":false,"stampPosts":0,"skipPosts":0,"ws":"map"} |
| shot:panel-timeout.png | PASS | screenshot panel-timeout.png is not a black frame | luma=0.963 1440x900 bytes=166335 |
| PT2 | PASS | Zoom handler fires after shed without waiting on the full findings list | {"enabled":true,"via":"zoomIn","k0":0.6292372881355932,"k":0.7550847457627118,"pct0":"63% · overview","pct":"76% · labels","sameStage":true,"sameVp":true,"shed":"shed","lod":"0","xy":0,"comm":0,"cards":12,"ws":"map"} |
| PT3 | PASS | Fat panel patch itself does not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| PT4 | PASS | Panel timeout did not write .graphide/stamps/ | absent |
| PC0 | PASS | explorer program chips: single-chip honest path; skip multi unless a second chip exists | single-chip skip multi chips=bin main |
| AP0 | PASS | explorer All programs: absent on single-chip; skip union unless All programs exists | honest skip All programs absent chips=bin main |
| FT0 | PASS | explorer has two or more #tabs .tab[data-flow] chips | overview,control-flow,boot |
| FT1 | PASS | first flow tab is the current Steiner cut | {"flow":"control-flow","ws":"slice","meta":"Map / control-flow · 8 on tree live preview","slice":58} |
| FT2 | PASS | second #tabs .tab moves .on and selectFlow posts | {"first":"control-flow","second":"boot","posts":["control-flow","boot"]} |
| FT3 | PASS | visible Steiner cut changed (title, hops, start/end, or Slice lit) | {"title":true,"hops":false,"ends":false,"lit":false,"tree":false,"firstMeta":"Map / control-flow · 8 on tree live preview","secondMeta":"Map / boot · 8 on tree live preview broken"} |
| shot:flow-tabs.png | PASS | screenshot flow-tabs.png is not a black frame | luma=0.967 1440x900 bytes=133019 |
| FT4 | PASS | flow-tab switch does not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| FT5 | PASS | flow-tab switch did not write .graphide/stamps/ | absent |
| FT6 | PASS | flow-tab step returns Map to community LOD (xy=0) | {"ws":"map","xy":0,"cards":12,"comm":0} |
| GY0 | PASS | flow tab is present so Slice grey-out has a Steiner | {"flow":"control-flow","clicked":true} |
| GY1 | PASS | on-tree Slice nodes are lit (data-lit=1 / .vnode.lit) | {"ws":"slice","flow":"control-flow","lit":8,"litZero":8,"sample":["n0:0","n1:0","n2:0"]} |
| GY2 | PASS | off-slice neighbors stay visible but grey (data-lit=0 / .grey / .slice-dim) | {"n":29,"grey":21,"greyFar":21,"sample":["n10:1","n1171:1","n1172:1"]} |
| shot:slice-grey.png | PASS | screenshot slice-grey.png is not a black frame | luma=0.968 1440x900 bytes=131211 |
| GY3 | PASS | Slice grey-out does not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| GY4 | PASS | Slice grey-out did not write .graphide/stamps/ | absent |
| GY5 | PASS | Slice grey-out did not write fixtures/demo/flows.toml | [[flow]] name = "data-subscription" hits = ["crate::sub::subscribe", "crate::bus::events"]  |
| GY6 | PASS | Slice grey-out returns Map to community LOD (xy=0) | {"ws":"map","xy":0,"cards":12,"comm":0} |
| SR0 | PASS | Slice is on with a flow that can paint subsystem runs | {"flow":"control-flow","clicked":true} |
| SR1 | PASS | Slice paints subsystem-run boxes (.run / data-run) | {"ws":"slice","flow":"control-flow","n":3,"ids":["1","2","3"],"flows":["control-flow","control-flow","control-flow"],"bubbles":["b-render","b-origin","b-physics"],"title":"Flow · Steiner — zoom out for runs, in for hops and source"} |
| SR1b | PASS | Slice subsystem runs sit fully on the stage | {"n":3,"boxes":[{"id":"1","h":25,"top":730,"bottom":755,"inside":true},{"id":"2","h":25,"top":730,"bottom":755,"inside":true},{"id":"3","h":32,"top":730,"bottom":763,"inside":true}],"stageBottom":769} |
| shot:slice-runs.png | PASS | screenshot slice-runs.png is not a black frame | luma=0.967 1440x900 bytes=131909 |
| SR2 | PASS | Enter a Slice run mounts shaped #enterCanvas XYFlow (not raw IR) | xy=24 shapes=start,fn,type,endpoint click={"clicked":true,"run":"1","flow":"control-flow","bubble":"b-render"} |
| SR2b | PASS | Slice run enter stamps the walk start on #enterCanvas and leaves the walk end for its own community | {"bubble":"b-render","starts":1,"startId":"n0","startLit":1,"ends":0} |
| SR3 | PASS | Slice run enter posts enterRun and does not post stamp / skip | {"enterRun":1,"stampPosts":0,"skipPosts":0} |
| SR4 | PASS | Slice runs step did not write .graphide/stamps/ | absent |
| SR2c | PASS | Slice stack enter of a parent community stamps the Type data-shape | {"click":{"clicked":true,"run":"3","bubble":"b-physics"},"n":3,"types":2,"endpoint":1,"starts":0,"cards":0,"xy":3,"enterXy":3} |
| SR2d | PASS | Deeper Slice enter shows member shapes and does not move the walk start | {"n":24,"leaves":24,"fn":true,"startId":"","cards":0} |
| SR2e | PASS | Back on the Slice stack returns to Type-shaped child communities | types=2 |
| SR2f | PASS | Zoom-pop from deeper Slice enter returns to the Type cut on the same stack | {"before":{"ids":"n1004,n176,n188,n20,n236,n272,n284,n296,n308,n32,n320,n332,n440,n596,n608,n620,n668,n80,n836,n884,n896,n908,n920,n968","types":0,"leaves":24,"cards":0,"runs":0,"enter":24},"after":{"ids":"b-physics-a,b-physics-b,n164","types":2,"leaves":1,"cards":0,"runs":0,"enter":3}} |
| SR5 | PASS | Slice runs returns Map to community LOD (xy=0) | {"ws":"map","xy":0,"enter":0,"cards":12,"comm":0} |
| SE0 | PASS | Slice paints Steiner XYFlow before recycle | {"ws":"slice","slice":29,"enter":0,"cards":0,"k":0.39336130623132576} |
| SE1 | PASS | Re-select Slice recycles the same .stage / .viewport (keepCam) | {"sameStage":true,"sameVp":true,"slice":29,"enter":0,"k":0.45607779578606156,"wantK":0.455880795353671,"ws":"slice"} |
| SE2 | PASS | Patch recycles Slice stage and keeps the camera | {"sameStage":true,"sameVp":true,"slice":29,"k":0.45607779578606156,"wantK":0.455880795353671,"ws":"slice"} |
| SE3 | PASS | Enter a Slice run mounts #enterCanvas before recycle | {"click":{"clicked":true,"run":"1"},"desk":{"enter":24,"shaped":24,"inode":0,"k":0.3824221142417099}} |
| SE4 | PASS | Patch recycles Enter stage and keeps the camera | {"sameStage":true,"sameVp":true,"enter":24,"k":0.44266304347826085,"wantK":0.44266304347826085} |
| SE5 | PASS | Slice / Enter recycle does not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| shot:slice-enter-recycle.png | PASS | screenshot slice-enter-recycle.png is not a black frame | luma=0.968 1440x900 bytes=143015 |
| SE6 | PASS | Slice / Enter recycle did not write .graphide/stamps/ | absent |
| SE7 | PASS | Slice / Enter recycle returns Map to community LOD (xy=0) | {"ws":"map","xy":0,"enter":0,"cards":12,"comm":0} |
| ST0 | PASS | Slice first paint is the fresh run layout, not the stamp overlay | {"ws":"slice","flow":"control-flow","n":3,"layout":[{"id":"1","bubble":"b-render","left":24,"top":16},{"id":"2","bubble":"b-origin","left":280,"top":16},{"id":"3","bubble":"b-physics","left":536,"top":16}]} |
| ST1 | PASS | Fixture recheck posts overlayed stamp positions and StampBroken | {"ok":true,"type":"patch","flow":"boot","pos":[{"run":1,"x":56,"y":152},{"run":2,"x":360,"y":152}],"added":[{"from":"n0","to":"n3"}],"holds":[{"name":"boot","holds":false}]} |
| ST2 | PASS | Recheck lays the new tree on stored stamp run positions | fresh=[{"id":"1","bubble":"b-render","left":24,"top":16},{"id":"2","bubble":"b-origin","left":280,"top":16},{"id":"3","bubble":"b-physics","left":536,"top":16}] overlay={"ws":"slice","flow":"control-flow","n":2,"layout":[{"id":"1","bubble":"b-render","flow":"control-flow","left":56,"top":152},{"id":"2","bubble":"b-origin","flow":"control-flow","left":360,"top":152}]} |
| shot:stamp-recheck.png | PASS | screenshot stamp-recheck.png is not a black frame | luma=0.969 1440x900 bytes=126105 |
| ST3 | PASS | Decisions still lists StampBroken on the overlayed boot tree | {"ws":"decisions","n":1,"title":"rejectedStampBroken · boot1 added · 0 removed hops"} |
| ST4 | PASS | Stamp recheck overlay does not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| ST5 | PASS | Stamp recheck overlay did not write .graphide/stamps/ | absent |
| ST6 | PASS | Stamp recheck overlay returns Map to community LOD (xy=0) | {"ws":"map","xy":0,"cards":12,"comm":0} |
| PG1 | PASS | #progress is on after a synthetic progress message | {"on":true,"ws":"map","cards":12} |
| PG2 | PASS | Cluster phase is .on; Scan / Extract / Link are .done | [{"phase":"walk","on":false,"done":true,"text":"Scan"},{"phase":"extract","on":false,"done":true,"text":"Extract"},{"phase":"link","on":false,"done":true,"text":"Link"},{"phase":"cluster","on":true,"done":false,"text":"Cluster"},{"phase":"flows","on":false,"done":false,"text":"Flows"}] |
| PG3 | PASS | #progressFill / #progressPct / #progressLabel update | {"label":"Clustering communities…","counts":"3/5","pct":"62%","fill":"62%","time":"1.8s"} |
| PG4 | PASS | Progress strip keeps Map community LOD (xy=0) | xy=0 cards=12 |
| shot:progress.png | PASS | screenshot progress.png is not a black frame | luma=0.959 1440x900 bytes=168684 |
| PG5 | PASS | Clearing progress hides the strip and restores the desk | {"on":false,"phasesOn":0,"fillW":"0%","xy":0,"cards":12,"reviewShown":true,"cancelHidden":true,"stampPosts":0,"skipPosts":0} |
| PG6 | PASS | Progress step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| PG7 | PASS | Progress step did not write .graphide/stamps/ | absent |
| CR1 | PASS | #cancelBtn is visible while the progress strip is on | {"on":true,"cancelShown":true,"reviewHidden":true,"ws":"map"} |
| CR1b | PASS | Backspace while busy posts cancel and labels Cancelling… | {"cancelPosts":1,"label":"Cancelling…","on":true,"cards":12,"xy":0} |
| CR1c | PASS | Escape while busy posts cancel and labels Cancelling… | {"cancelPosts":1,"label":"Cancelling…","cards":12,"xy":0} |
| CR1d | PASS | After cancel, late progress keeps Cancelling… (does not flash Clustering) | {"label":"Cancelling…","on":true} |
| CR2 | PASS | Click #cancelBtn posts { type: "cancel" } and labels Cancelling… | {"cancelPosts":3,"label":"Cancelling…","on":true,"stampPosts":0,"skipPosts":0} |
| CR3 | PASS | Cancelled reply hides the strip and restores Review | {"on":false,"reviewShown":true,"cancelHidden":true,"xy":0,"cards":12,"ws":"map","stampPosts":0,"skipPosts":0} |
| CR4 | PASS | Cancel review keeps Map community LOD (xy=0) | xy=0 cards=12 |
| shot:cancel-review.png | PASS | screenshot cancel-review.png is not a black frame | luma=0.962 1440x900 bytes=170406 |
| CR5 | PASS | Cancel-review step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| CR6 | PASS | Cancel-review step did not write .graphide/stamps/ | absent |
| N1 | PASS | Night adds .night on html/body and presses #themeNight | {"htmlNight":true,"bodyNight":true,"htmlBright":true,"bodyBright":true,"nightOn":true,"dayOn":false,"seg":true,"cards":12,"visible":12,"xy":0,"preset":"classic"} |
| N1b | PASS | Night keeps .bright (html.bright.night) | {"htmlBright":true,"bodyBright":true} |
| N2 | PASS | Map stays community LOD on Night (xy=0, cards visible) | cards=12 visible=12 xy=0 |
| shot:night.png | PASS | screenshot night.png is not a black frame | luma=0.225 std=0.243 1440x900 bytes=146385 |
| N3 | PASS | Night Map is dark vs day map.png | night=0.225 day=0.963 std=0.243 |
| N4 | PASS | Night does not post a stamp | {"stampPosts":0,"skipPosts":0,"appearance":1} |
| N5 | PASS | D restores Day markers so later suites stay day-safe | {"htmlNight":false,"bodyNight":false,"bright":true,"dayOn":true,"nightOn":false,"cards":12,"xy":0} |
| N6 | PASS | Appearance step did not write .graphide/stamps/ | absent |
| E1 | PASS | Enter-bubble mounts shaped XYFlow nodes (capped, not the raw IR) | xy=24 lit=1 grey=23 shapes=start,fn,type,endpoint |
| E1b | PASS | Enter-bubble XYFlow nodes each carry data-shape | xy=24 shapes=start,fn,type,endpoint |
| E1c | PASS | Map community enter stamps the same walk-start shape and keeps XYFlow inside #enterCanvas | {"starts":1,"startId":"n0","startLit":1,"ends":0,"cards":0,"xy":24,"enterXy":24} |
| E1p | PASS | Enter greys off-tree members by graph distance to the walk | {"n0":{"id":"n0","dist":"0","lit":"1","shape":"start","opacity":1},"n12":{"id":"n12","dist":"1","lit":"0","shape":"fn","opacity":0.56},"n108":{"id":"n108","dist":"2","lit":"0","shape":"fn","opacity":0.4},"n1200":{"id":"n1200","dist":"3","lit":"0","shape":"fn","opacity":0.28}} |
| shot:enter-distance.png | PASS | screenshot enter-distance.png is not a black frame | luma=0.969 1440x900 bytes=140462 |
| RT8b | PASS | Enter Route dims the off-route grey ring to the far-ring floor | {"ok":true,"ring":23,"near":3,"ringMax":0.18} |
| shot:enter-route-dim.png | PASS | screenshot enter-route-dim.png is not a black frame | luma=0.965 1440x900 bytes=143799 |
| shot:enter-bubble.png | PASS | screenshot enter-bubble.png is not a black frame | luma=0.968 1440x900 bytes=139614 |
| EG1 | PASS | Ego toggle is on and hop depth is 1 | {"on":true,"hops":"1"} |
| EG2 | PASS | Enter-bubble Ego lights neighbors (and dims non-neighbors when the cut has them) | {"on":true,"hops":"1","nodes":24,"ego":2,"dim":22,"selected":1,"files":24,"egoOpacity":1,"dimOpacity":0.12} |
| EG3 | PASS | 2-hop Ego keeps a wider neighborhood than 1-hop on enter-bubble | 1-hop dim=22 2-hop dim=20 |
| shot:ego.png | PASS | screenshot ego.png is not a black frame | luma=0.964 1440x900 bytes=173112 |
| EG4 | PASS | Ego off removes neighborhood dim | {"on":false,"dim":0} |
| SG2 | PASS | Find filters enter-bubble XYFlow nodes (FQN / file) | {"q":"ScreenshotFormat","nodes":24,"dim":19,"hit":5,"files":24} |
| SG2b | PASS | Find dims Enter off-tree nodes under distance grey | {"n0":{"dim":false,"hit":true,"dist":"0","op":1},"n12":{"dim":true,"hit":false,"dist":"1","op":0.18}} |
| shot:search.png | PASS | screenshot search.png is not a black frame | luma=0.964 1440x900 bytes=173698 |
| E2 | PASS | Leaf click on enter-bubble opens Evidence | ScreenshotFormat · src/main.rs:2 |
| E3 | PASS | Back from enter-bubble returns to Map community LOD (xy=0) | cards=12 xy=0 |
| E1d | PASS | Map child communities use the Type data-shape and stay non-leaves | {"click":{"clicked":true,"id":"b-physics"},"n":3,"shapes":["type","endpoint"],"kinds":["Type","Endpoint"],"nonLeaves":2,"endpoint":1,"ids":["b-physics-b","b-physics-a","n164"],"cards":0,"xy":3,"enterXy":3,"inode":0} |
| E1l | PASS | A one-member child is the derived Endpoint, not a Type community | {"endpoint":1,"ids":["b-physics-b","b-physics-a","n164"]} |
| SG1d | PASS | Find on a member FQN keeps the holding Enter child community lit | {"a":{"hit":false,"dim":true,"op":0.18},"b":{"hit":true,"dim":false,"op":1},"ep":{"hit":false,"dim":true,"op":0.18}} |
| shot:enter-find-member.png | PASS | screenshot enter-find-member.png is not a black frame | luma=0.973 1440x900 bytes=102760 |
| SG1f | PASS | Find on a member file keeps the holding Enter child communities lit | {"a":{"hit":true,"dim":false,"op":1},"b":{"hit":true,"dim":false,"op":1},"ep":{"hit":false,"dim":true,"op":0.18},"q":"screenshotformat.rs"} |
| shot:enter-find-file.png | PASS | screenshot enter-find-file.png is not a black frame | luma=0.972 1440x900 bytes=102175 |
| E1m | PASS | A one-member child keeps the hops into its sibling community on the stage | {"hops":2,"linked":2,"a":"type","b":"type","clipped":0,"sampled":34} |
| shot:enter-child-type.png | PASS | screenshot enter-child-type.png is not a black frame | luma=0.973 1440x900 bytes=100252 |
| shot:enter-back-hop.png | PASS | screenshot enter-back-hop.png is not a black frame | luma=0.973 1440x900 bytes=100254 |
| E1n | PASS | Enter hop card names the member nodes, not the sibling community | {"id":"xy:b-physics-a:n164:Reads:0","hidden":false,"text":"Hop · ReadsSimulationData_152 · 0152→SimulationScale_164 · 0164solarsim::mod72::SimulationData_152solarsim::mod4::SimulationScale_164","ids":["n152","n164"]} |
| shot:enter-member-hop.png | PASS | screenshot enter-member-hop.png is not a black frame | luma=0.967 1440x900 bytes=144499 |
| EG6 | PASS | Ego on the one-member endpoint lights the sibling community its hop enters | {"aEgo":true,"aDist":"1","aShape":"type","bDim":true,"bDist":"2","bShape":"type","epEgo":true} |
| shot:ego-community.png | PASS | screenshot ego-community.png is not a black frame | luma=0.972 1440x900 bytes=103455 |
| E1e | PASS | Deeper Map enter shows member shapes on the stack path | {"n":24,"leaves":24,"shapes":["fn","type"],"fn":true,"allType":false,"cards":0,"xy":24,"enterXy":24} |
| E1f | PASS | Back from deeper Map enter returns to Type-shaped child communities | {"n":3,"types":2,"endpoint":1,"cards":0} |
| E1g | PASS | Back from child communities returns Map to xy=0 and data-lod=0 | {"cards":12,"xy":0,"enter":0,"lod":"0"} |
| E1h | PASS | Zoom-pop from deeper Map enter returns to the Type cut | {"before":{"ids":"n1004,n176,n188,n20,n236,n272,n284,n296,n308,n32,n320,n332,n440,n596,n608,n620,n668,n80,n836,n884,n896,n908,n920,n968","types":0,"leaves":24,"cards":0,"runs":0,"enter":24},"zoom":{"ids":"b-physics-a,b-physics-b,n164","types":2,"leaves":1,"cards":0,"runs":0,"enter":3}} |
| shot:enter-back-stack.png | PASS | screenshot enter-back-stack.png is not a black frame | luma=0.973 1440x900 bytes=101707 |
| E1i | PASS | Back from that same depth returns to the same Type cut, then Map xy=0 and data-lod=0 | {"zoom":"b-physics-a,b-physics-b,n164","back":"b-physics-a,b-physics-b,n164","map":{"cards":12,"xy":0,"enter":0,"lod":"0"}} |
| E1j | PASS | Map enter of the sink community fits one lit walk-end on stage | {"click":{"clicked":true,"id":"b-ui"},"ends":1,"lit":1,"endId":"n7","kind":"Function","leaf":"1","starts":0,"cards":0,"xy":24,"enterXy":24,"lod":"0","inode":0,"seen":{"ok":true,"n":24,"off":0,"k":0.4014615365149492,"endOn":true}} |
| shot:enter-sink-end.png | PASS | screenshot enter-sink-end.png is not a black frame | luma=0.967 1440x900 bytes=141524 |
| E1k | PASS | Back from the sink community returns Map to xy=0 and data-lod=0 without a stamp | {"cards":12,"xy":0,"enter":0,"lod":"0","stampPosts":0,"skipPosts":0} |
| E1o | PASS | Slice workspace leaves the Map enter cut and shows the Steiner | {"ws":"slice","enter":0,"slice":29,"runs":2,"inside":false,"backs":1} |
| shot:slice-from-enter.png | PASS | screenshot slice-from-enter.png is not a black frame | luma=0.968 1440x900 bytes=127442 |
| SG1 | PASS | Find dims non-matching Map community cards (xy stays 0) | {"q":"render","cards":12,"dim":11,"xy":0} |
| SG1b | PASS | Find lifts an off-path Map card out of path grey | {"physics":{"hit":true,"dim":false,"off":true,"op":1},"assets":{"hit":false,"dim":true,"off":true,"op":0.22},"xy":0} |
| shot:map-find-hit.png | PASS | screenshot map-find-hit.png is not a black frame | luma=0.964 1440x900 bytes=165942 |
| SG1c | PASS | Find on a member FQN keeps the holding Map card lit | {"render":{"hit":true,"dim":false,"chip":true,"op":1},"assets":{"hit":false,"dim":true,"chip":false,"op":0.22},"hits":3,"cards":12,"xy":0} |
| shot:map-find-member.png | PASS | screenshot map-find-member.png is not a black frame | luma=0.964 1440x900 bytes=168978 |
| SG1e | PASS | Find on a member file keeps the holding Map card lit | {"render":{"hit":true,"dim":false,"op":1},"assets":{"hit":false,"dim":true,"op":0.22},"hits":3,"cards":12,"xy":0,"q":"simulationdata.rs"} |
| shot:map-find-file.png | PASS | screenshot map-find-file.png is not a black frame | luma=0.964 1440x900 bytes=169140 |
| RT9 | PASS | Map Route lights on-path community cards and dims the rest | {"cards":12,"on":3,"dim":9,"onIds":["b-render","b-integration","b-origin"],"dimIds":["b-lod","b-bodies","b-camera","b-config","b-ui","b-physics","b-assets","b-input","b-debug"],"onMin":1,"dimMax":0.22,"xy":0} |
| shot:map-route-cards.png | PASS | screenshot map-route-cards.png is not a black frame | luma=0.960 1440x900 bytes=171045 |
| LN7 | PASS | Map Lens paints community cards; lens-on beats off-path grey | {"cards":12,"painted":12,"offOn":4,"offOnMin":1,"xy":0} |
| shot:map-lens-cards.png | PASS | screenshot map-lens-cards.png is not a black frame | luma=0.961 1440x900 bytes=169663 |
| EG3d | PASS | Selecting a Slice node with Ego off keeps the lit 2-hop walk fully opaque | {"ego":false,"n2":{"lit":"1","dist":"2","slice":"0","op":1,"ego":false,"dim":false},"n4":{"lit":"1","dist":"2","slice":"0","op":1,"ego":false,"dim":false},"n12":{"lit":"0","dist":"1","slice":"1","op":0.48,"ego":false,"dim":false},"n10":{"lit":"0","dist":"2","slice":"1","op":0.48,"ego":false,"dim":false}} |
| EG3e | PASS | Selecting a Slice node with Ego off keeps off-tree neighbors in distance grey | {"n12":{"lit":"0","dist":"1","slice":"1","op":0.48,"ego":false,"dim":false},"n10":{"lit":"0","dist":"2","slice":"1","op":0.48,"ego":false,"dim":false}} |
| shot:slice-select.png | PASS | screenshot slice-select.png is not a black frame | luma=0.968 1440x900 bytes=153447 |
| shot:slice-select-grey.png | PASS | screenshot slice-select-grey.png is not a black frame | luma=0.968 1440x900 bytes=153448 |
| SG4 | PASS | Find dims Slice off-tree nodes under distance grey | {"n0":{"dim":false,"hit":true,"lit":"1","dist":"0","op":1},"n12":{"dim":true,"hit":false,"lit":"0","dist":"1","op":0.18}} |
| shot:slice-find-dim.png | PASS | screenshot slice-find-dim.png is not a black frame | luma=0.966 1440x900 bytes=155610 |
| SG4b | PASS | Find lifts an off-tree Slice hit out of distance grey | {"n12":{"dim":false,"hit":true,"dist":"1","op":1},"n10":{"dim":true,"hit":false,"dist":"1","op":0.18}} |
| shot:slice-find-hit.png | PASS | screenshot slice-find-hit.png is not a black frame | luma=0.966 1440x900 bytes=155025 |
| SG4c | PASS | Find on a member file lifts an off-tree Slice hit out of distance grey | {"n12":{"dim":false,"hit":true,"dist":"1","file":"src/simulation/simulationdata.rs","op":1},"n10":{"dim":true,"hit":false,"dist":"1","file":"src/simulation/toastcontainer.rs","op":0.18},"q":"simulationdata.rs"} |
| shot:slice-find-file.png | PASS | screenshot slice-find-file.png is not a black frame | luma=0.966 1440x900 bytes=155182 |
| RT8 | PASS | Slice Route dims the off-route grey ring as far as the off-route walk | {"ok":true,"walk":5,"ring":21,"walkMax":0.22,"ringMax":0.22} |
| shot:slice-route-dim.png | PASS | screenshot slice-route-dim.png is not a black frame | luma=0.963 1440x900 bytes=162163 |
| LN6 | PASS | Slice Lens dims the off-tree ring as far as the lit walk | {"open":true,"walk":1,"ring":1,"walkMax":0.28,"ringMax":0.28} |
| shot:slice-lens-dim.png | PASS | screenshot slice-lens-dim.png is not a black frame | luma=0.963 1440x900 bytes=157019 |
| shot:slice-ego.png | PASS | screenshot slice-ego.png is not a black frame | luma=0.966 1440x900 bytes=155470 |
| SG5 | PASS | Find hit outside the Ego neighborhood stays lit; misses stay dim | {"n10":{"hit":true,"dim":false,"ego":false,"egoDim":true,"op":1},"n12":{"hit":false,"dim":true,"ego":true,"egoDim":false,"op":0.18},"n13":{"hit":false,"dim":true,"ego":false,"egoDim":true,"op":0.12}} |
| EG3b | PASS | Slice Ego dims non-neighbors; 2-hop is at least as wide as 1-hop | 1-hop={"dim":23,"ego":5,"selected":1,"offEgo":2,"offDim":19,"offEgoOpacity":1,"offDimOpacity":0.12,"n12":{"ego":true,"dist":"1","opacity":1}} 2-hop={"dim":17,"ego":12} |
| EG3c | PASS | Slice Ego lights off-slice neighbors and dims the other grey nodes | {"n12":{"ego":true,"dist":"1","opacity":1},"offEgo":2,"offDim":19,"offEgoOpacity":1,"offDimOpacity":0.12} |
| EG7 | PASS | Map altitude is still community LOD after Ego / Find (xy=0) | cards=12 xy=0 |
| E4 | PASS | Enter-bubble step did not write .graphide/stamps/ | absent |
| KF0 | PASS | Find rail has Function / Type / Endpoint kind pills, all checked | [{"kind":"Function","checked":true,"off":false},{"kind":"Type","checked":true,"off":false},{"kind":"Endpoint","checked":true,"off":false}] |
| KF1 | PASS | All three checked: rail shows Function / Type / Endpoint mixed (or honest Function-only baseline) | {"nodeKinds":["Type","Function","Endpoint"],"ledgerKinds":["Type","Function","Endpoint"],"honestFnOnly":false} |
| KF2 | PASS | Uncheck Type + Endpoint: only Function kinds remain visible | {"nodeKinds":["Function"],"ledgerKinds":["Function"],"pills":[{"kind":"Function","checked":true,"off":false},{"kind":"Type","checked":false,"off":true},{"kind":"Endpoint","checked":false,"off":true}]} |
| shot:kind-filters.png | PASS | screenshot kind-filters.png is not a black frame | luma=0.967 1440x900 bytes=150749 |
| KF3 | PASS | Uncheck Function, leave Type: only Type kinds remain visible | {"nodeKinds":["Type"],"ledgerKinds":["Type"],"typeCutReady":true,"honestFnOnly":false} |
| KF4 | PASS | Restore all three kind pills | [{"kind":"Function","checked":true,"off":false},{"kind":"Type","checked":true,"off":false},{"kind":"Endpoint","checked":true,"off":false}] |
| KF5 | PASS | Map altitude is still community LOD after kind filters (xy=0) | {"cards":12,"xy":0,"ws":"map","stampPosts":0,"skipPosts":0} |
| KF6 | PASS | Kind filters do not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| KF7 | PASS | Kind filters did not write .graphide/stamps/ | absent |
| A1 | PASS | #llmBtn opens #llmPane (Ask) | {"btn":true,"pane":true,"open":true,"close":true,"ask":true,"send":true,"log":true,"overlap":false,"z":"24"} |
| A1b | PASS | Ask pane is not covered by Evidence / ledger / keys / export | {"btn":true,"pane":true,"open":true,"close":true,"ask":true,"send":true,"log":true,"overlap":false,"z":"24"} |
| A2 | PASS | Graph-only Ask answers a flow, hop, or coverage without an LLM host | Tell the start to end control-flow pathStart → features → end: render → integration → origin → lod → bodies → camera → config → ui Control-flow hops: ScreenshotFormat → ext → as_str → SimPosition → SimulationScale → Mass |
| A3 | PASS | Ask does not post a stamp | stampPosts=0 |
| A3c | PASS | After Ask, focus returns to #llmAsk so the next question does not fire S / X | {"value":"sx","focused":"llmAsk","stampPosts":0,"skipPosts":0} |
| A3b | PASS | IME-composing Enter in Ask / #prompt does not send the question or start a review | {"askValue":"這條路徑","askPosts":0,"reviewPosts":0} |
| shot:ask.png | PASS | screenshot ask.png is not a black frame | luma=0.954 1440x900 bytes=160637 |
| A4 | PASS | #llmClose hides #llmPane |  |
| A5 | PASS | Escape closes #llmPane |  |
| A6 | PASS | Map altitude is still community LOD after Ask (xy=0) | cards=12 xy=0 |
| A7 | PASS | Ask step did not write .graphide/stamps/ | absent |
| K1 | PASS | ? opens #keysPane (Keys) | {"btn":true,"pane":true,"open":true,"close":true,"z":"28"} |
| K1b | PASS | Keys pane is not covered by Evidence / Ask / export | {"overlap":false,"z":"28"} |
| K2 | PASS | Keys sheet lists / find, ? sheet, S/X stamp/skip, E ego, F present, D day | KeysClose1–9 workspaces/ find · ? this sheetS stamp · X skipP play path · [ ] / ← → / j k stepR PATH · L LENS · E egoF present · Style button cycles Classic / Signal / BlueprintD day / night+ − zoom · 0 fit · Backspace b |
| K3 | PASS | Keys does not post a stamp | {"stampPosts":0,"skipPosts":0} |
| shot:keys.png | PASS | screenshot keys.png is not a black frame | luma=0.965 1440x900 bytes=164456 |
| K4 | PASS | #keysClose hides #keysPane |  |
| K5 | PASS | Escape closes #keysPane |  |
| K17 | PASS | Second ? toggles #keysPane closed (chrome does not swallow ?) |  |
| K18 | PASS | Opening Keys closes Ask (exclusive chrome) | {"keysOpen":true,"askOpen":false} |
| K18b | PASS | Opening Export closes Ask (exclusive chrome) | {"exportOpen":true,"askOpen":false} |
| K18c | PASS | Opening Ask closes Keys (exclusive chrome) | {"askOpen":true,"keysOpen":false} |
| K18d | PASS | Opening Ask closes Export (exclusive chrome) | {"askOpen":true,"exportOpen":false} |
| K18e | PASS | Opening Export closes Keys (exclusive chrome) | {"exportOpen":true,"keysOpen":false} |
| K18f | PASS | Opening Keys closes Export (exclusive chrome) | {"keysOpen":true,"exportOpen":false} |
| K18g | PASS | Opening Present closes Ask (exclusive chrome) | {"presenting":true,"askOpen":false} |
| K18h | PASS | Opening Present closes Keys (exclusive chrome) | {"presenting":true,"keysOpen":false} |
| K18i | PASS | Opening Present closes Export (exclusive chrome) | {"presenting":true,"exportOpen":false} |
| K18j | PASS | Opening Present closes Evidence (exclusive chrome) | {"presenting":true,"evidenceOpen":false} |
| K18k | PASS | Opening Present closes Lens (exclusive chrome) | {"presenting":true,"lensOpen":false} |
| K18l | PASS | Opening Present closes Route (exclusive chrome) | {"presenting":true,"routeOpen":false} |
| K18m | PASS | Opening Ask closes Evidence (exclusive chrome) | {"askOpen":true,"evidenceOpen":false} |
| K18n | PASS | Opening Ask closes Lens (exclusive chrome) | {"askOpen":true,"lensOpen":false} |
| K18o | PASS | Opening Ask closes Route (exclusive chrome) | {"askOpen":true,"routeOpen":false} |
| K18p | PASS | Opening Keys closes Evidence (exclusive chrome) | {"keysOpen":true,"evidenceOpen":false} |
| K18q | PASS | Opening Keys closes Lens (exclusive chrome) | {"keysOpen":true,"lensOpen":false} |
| K18r | PASS | Opening Keys closes Route (exclusive chrome) | {"keysOpen":true,"routeOpen":false} |
| K18s | PASS | Opening Export closes Evidence (exclusive chrome) | {"exportOpen":true,"evidenceOpen":false} |
| K18t | PASS | Opening Export closes Lens (exclusive chrome) | {"exportOpen":true,"lensOpen":false} |
| K18u | PASS | Opening Export closes Route (exclusive chrome) | {"exportOpen":true,"routeOpen":false} |
| K18v | PASS | Opening Evidence closes Ask (exclusive chrome) | {"evidenceOpen":true,"askOpen":false} |
| K18w | PASS | Opening Lens closes Ask (exclusive chrome) | {"lensOpen":true,"askOpen":false} |
| K18x | PASS | Opening Route closes Ask (exclusive chrome) | {"routeOpen":true,"askOpen":false} |
| K18y | PASS | Opening Evidence closes Keys (exclusive chrome) | {"evidenceOpen":true,"keysOpen":false} |
| K18z | PASS | Opening Evidence closes Export (exclusive chrome) | {"evidenceOpen":true,"exportOpen":false} |
| K18aa | PASS | Opening Lens closes Keys (exclusive chrome) | {"lensOpen":true,"keysOpen":false} |
| K18ab | PASS | Opening Lens closes Export (exclusive chrome) | {"lensOpen":true,"exportOpen":false} |
| K18ac | PASS | Opening Route closes Keys (exclusive chrome) | {"routeOpen":true,"keysOpen":false} |
| K18ad | PASS | Opening Route closes Export (exclusive chrome) | {"routeOpen":true,"exportOpen":false} |
| K18ag | PASS | Opening Route closes Lens (exclusive chrome) | {"routeOpen":true,"lensOpen":false} |
| K18ah | PASS | Opening Lens closes Route (exclusive chrome) | {"lensOpen":true,"routeOpen":false} |
| K18ai | PASS | Opening Ask closes Present (exclusive chrome) | {"askOpen":true,"presenting":false} |
| K18aj | PASS | Opening Evidence closes Present (exclusive chrome) | {"evidenceOpen":true,"presenting":false} |
| K18ae | PASS | Opening Evidence closes Lens (exclusive chrome) | {"evidenceOpen":true,"lensOpen":false} |
| K18af | PASS | Opening Evidence closes Route (exclusive chrome) | {"evidenceOpen":true,"routeOpen":false} |
| S1a | PASS | Evidence #srcBody scroll publishes ScrollDrive and moves the camera | scrolled={"ok":true,"scrollTop":436,"scrollHeight":685,"clientHeight":249} before={"ratio":0,"camY":89.39830508474577,"targetNodeId":"n0","transform":"translate(18px, 89.3983px) scale(0.629237)","evidenceOpen":true} after={"ratio":1,"activeLine":132,"camX":18,"camY":89.39830508474577,"camK":0.42,"targetNodeId":"n0","transform":"translate(18px, 89.3983px) scale(0.604129)","evidenceOpen":true} |
| S1b | PASS | Evidence scroll unrolls Slice CFG and glows the active block | opened={"ok":true,"top":{"ratio":0.9977116704805492,"cfgUnroll":0,"cfgVisible":0,"cfgActiveId":"","hot":false,"ahead":0,"vnodes":29}} after={"ratio":1,"cfgUnroll":1,"cfgVisible":8,"cfgActiveId":"n7","hot":true,"ahead":0,"vnodes":29,"evidenceOpen":true} |
| S1c | PASS | Evidence file-top / fast scroll enters macro Map LOD; mid-file returns to CFG | top={"ok":true,"scrollHeight":685,"clientHeight":248} macro={"ratio":0,"scrollVel":7.69901034055072,"macroLod":true,"lod":"0","macroAttr":"1","hot":true,"dim":28,"cfgHot":false,"camK":0.42,"targetNodeId":"n0","evidenceOpen":true} mid={"ratio":0.5491990846681922,"macroLod":false,"macroAttr":"","cfgUnroll":0.5491990846681922,"cfgHot":true,"macroHot":false} |
| S1d | PASS | Evidence if/loop/try lines annotate CFG spans; active kind glows, siblings collapse | pad={"ok":true,"max":868,"scrollTop":538} after={"ok":true,"ratio":0.619815668202765,"macroLod":false,"cfgUnroll":0.619815668202765,"cfgSpanKind":"if","cfgSpanCount":3,"uniq":["if","loop","try"],"hotSpan":"if","sib":2,"ifN":3,"loopN":3,"tryN":2,"evidenceOpen":true} |
| S1e | PASS | Evidence scroll stamps API/DB/Service/Utility kind anchors from IR kinds | pad={"ok":true,"vnodes":29,"scrollTop":477} after={"ok":true,"ratio":0.5495391705069125,"macroLod":false,"anchorFocus":"util","counts":{"api":13,"db":0,"svc":8,"util":8},"uniq":["util","svc","api"],"stamped":29,"apiCls":13,"dbCls":0,"svcCls":8,"utilCls":8,"evidenceOpen":true} |
| S1f | PASS | Evidence scroll gates deep clutter until focus approaches (detailNear / data-scroll-detail) | near={"ok":true,"detailNear":true,"attr":"1","macroLod":false,"cfgVisible":5,"cfgUnroll":0.5495391705069125,"ratio":0.5495391705069125,"evidenceOpen":true} far={"detailNear":false,"attr":"0","macroLod":true,"ratio":0} reopen={"detailNear":true,"attr":"1","macroLod":false,"cfgVisible":5,"cfgUnroll":0.5495391705069125,"ratio":0.5495391705069125,"evidenceOpen":true} |
| S1g | PASS | Evidence scrollVel eases tickCam lerp (loose on flick, snappy on settle) | loose={"camEase":0.12,"scrollVel":1.036438748185096,"evidenceOpen":true} snap={"camEase":0.2964175636877646,"scrollVel":0.11921706808544139,"evidenceOpen":true} |
| S1h | PASS | Evidence activeLine maps to IR/fixture span owner (lineMapHit) | setup={"ok":true,"sourceId":"n1","siblingId":"n21","siblingLine":31,"ownLine":11,"scrollTop":297,"scrollHeight":813,"clientHeight":231,"drive":{"scrollRatio":0,"activeLine":0,"targetNodeId":"n1","lineMapHit":false,"lineMapPulse":false,"activeLineMarked":false,"camX":284.58001328444846,"camY":62.97366705207644,"camK":0.42,"cfgActiveId":"","cfgUnroll":0,"cfgVisible":0,"cfgSpanKind":"","cfgSpanCount":0,"cfgNestDepth":0,"cfgNestMax":0,"cfgNestExpanded":0,"scrollVel":1.781706205279709,"camEase":0.12,"blendMs":280,"macroLod":false,"anchorFocus":"svc","anchorCounts":{"api":13,"db":0,"svc":8,"util":8},"detailNear":false,"reducedMotion":false,"rafCoalesce":true,"rafFlushes":33,"rafMerged":19,"presentPaused":false,"presentStayStashed":false,"reviewStayCleared":false,"camXSettled":false,"camYSettled":false}} hit={"targetNodeId":"n21","lineMapHit":true,"activeLine":31,"evidenceOpen":true} miss={"ok":true,"targetNodeId":"n1","lineMapHit":false,"activeLine":900,"sourceId":"n1"} |
| S1i | PASS | Evidence nested CFG expands child+ancestors on activeLine; siblings collapse | pad={"ok":true,"scrollTop":440,"scrollHeight":1291,"clientHeight":231,"drive":{"scrollRatio":0.5378006872852233,"activeLine":900,"targetNodeId":"n1","lineMapHit":false,"lineMapPulse":false,"activeLineMarked":true,"camX":70.70000000000005,"camY":16.600000000000023,"camK":0.42,"cfgActiveId":"","cfgUnroll":0,"cfgVisible":0,"cfgSpanKind":"","cfgSpanCount":0,"cfgNestDepth":0,"cfgNestMax":0,"cfgNestExpanded":0,"scrollVel":2.466694925543875,"camEase":0.12,"blendMs":280,"macroLod":true,"anchorFocus":"svc","anchorCounts":{"api":13,"db":0,"svc":8,"util":8},"detailNear":false,"reducedMotion":false,"rafCoalesce":true,"rafFlushes":35,"rafMerged":21,"presentPaused":false,"presentStayStashed":false,"reviewStayCleared":false,"camXSettled":false,"camYSettled":false}} after={"ok":true,"ratio":0.41509433962264153,"activeLine":530,"macroLod":false,"cfgUnroll":0.41509433962264153,"cfgSpanKind":"try","cfgSpanCount":4,"cfgNestDepth":2,"cfgNestMax":2,"cfgNestExpanded":3,"nestHot":0,"nestAnc":4,"nestSib":0,"depthPaint":8,"deep2":2,"evidenceOpen":true} |
| S1j | PASS | Evidence nest/macro paint eases via camEase-tied blendMs / data-scroll-blend (no snap; S1f clutter intact) | nest={"blendMs":196,"camEase":0.24634561460295706,"macroLod":false,"detailNear":true,"detailAttr":"1","blendAttr":"1","blendVar":"196ms","transition":"opacity, outline-color, box-shadow","nestHot":0,"evidenceOpen":true} macroPad={"ok":true} macro={"blendMs":280,"macroLod":true,"detailNear":false,"detailAttr":"0","blendAttr":"1","blendVar":"280ms","macroAttr":"1","transition":"opacity, outline-color, box-shadow","hot":false,"dim":true,"probe":true} |
| S1bk | PASS | early wait-then-sample pad hunt: post-S1a–S1j still micro+settled (!macroLod; no mid-tween) | snap={"ratio":0.55,"scrollVel":0.04403865743745758,"camX":182.70000000000005,"camY":19.544952343901986,"camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"targetNodeId":"n1","paneOpen":true,"cfgUnroll":0.55} |
| S1k | PASS | Evidence scroll respects prefers-reduced-motion (blendMs 0 / snappy camEase / reducedMotion flag) | mock={"ok":true,"max":1060} after={"reducedMotion":true,"blendMs":0,"camEase":0.36,"blendVar":"0ms","blendAttr":"1","evidenceOpen":true} |
| S1l | PASS | Evidence scroll coalesces into one rAF flush per frame (rafMerged / rafFlushes) | before={"evidenceOpen":true,"flushes":46,"merged":24,"canScroll":true} after={"rafCoalesce":true,"rafFlushes":47,"rafMerged":39,"evidenceOpen":true} |
| S1m | PASS | Present pauses ScrollDrive camera; exit resumes (presentPaused / no residual cam nudge) | before={"evidenceOpen":true,"presentPaused":false,"camEase":0.12,"camY":19.544952343901986,"cfgHot":false,"macro":true,"attr":false,"presenting":false} paused={"presenting":true,"evidenceOpen":false,"presentPaused":true,"camEase":0.24,"attr":true,"cfgHot":false,"macro":false} resumed={"presenting":false,"presentPaused":false,"attr":false,"camEase":0.24} |
| S1n | PASS | lineMapHit pulses mapped node glow; miss quieter; reduced-motion / Present clear pulse | setup={"ok":true,"sourceId":"n1","ownLine":11} hit={"lineMapHit":true,"lineMapPulse":true,"targetNodeId":"n1","hitClass":true,"missClass":false,"attr":"hit","hasCfgHotName":false} miss={"lineMapHit":false,"lineMapPulse":false,"targetNodeId":"n1","missClass":true,"hitLeft":false} reduced={"ok":true,"lineMapHit":true,"lineMapPulse":false,"hitClass":true,"reducedMotion":true} present={"presentPaused":true,"hit":false,"miss":false,"lineMapPulse":false} |
| S1p | PASS | Evidence mid-viewport active-line dual-pane cue; Present pause clears | setup={"ok":true,"line":42} marked={"activeLine":42,"activeLineMarked":true,"count":1,"ln":"42","attr":"1"} present={"presentPaused":true,"active":false,"attr":false,"activeLineMarked":false} |
| S1q | PASS | soft camX follow toward off-center mapped target (micro; Present not paused) | setup={"ok":true,"scrollTop":337,"max":614} before={"camX":-57.299999999999955,"camY":16.600000000000023,"ratio":0.5488599348534202,"macroLod":false,"presentPaused":false,"targetNodeId":"n1","hasEl":true} offset={"ok":true,"id":"n1"} after={"camX":22.700000000000045,"camY":15.427361563517938,"ratio":0.5732899022801303,"macroLod":false,"presentPaused":false,"targetNodeId":"n1","stillOff":true} dx=80 |
| S1r | PASS | idle-settle soft camX into scrollDriveBase (no spring-back on tiny nudge) | setup={"ok":true,"scrollTop":337,"max":614} before={"camX":-57.299999999999955,"ratio":0.5488599348534202,"macroLod":false,"presentPaused":false,"targetNodeId":"n1","hasEl":true} offset={"ok":true,"id":"n1"} settled={"camX":-16.90003959834371,"camEase":0.3177528084411912,"scrollVel":0.07921348417276652,"camXSettled":true,"macroLod":false,"presentPaused":false} afterNudge={"camX":-16.90003959834371,"camXSettled":true,"macroLod":false,"presentPaused":false,"stillOff":true} softDx=40.399960401656244 yank=0 springBack=false |
| S1s | PASS | idle-settle soft camY into scrollDriveBase (no spring-back on tiny nudge) | baseline={"ok":true} before={"camY":13.707491856677557,"ratio":0,"macroLod":false,"presentPaused":false} setup={"ok":true,"scrollTop":337,"max":614} settled={"camY":16.600000000000023,"camEase":0.33929708528555635,"scrollVel":0.03881796508958184,"camYSettled":true,"ratio":0.5488599348534202,"macroLod":false,"presentPaused":false} afterNudge={"camY":16.600000000000023,"camYSettled":true,"ratio":0.5798045602605864,"macroLod":false,"presentPaused":false} softDy=2.892508143322466 yank=0 springBack=false camAlreadyMid=true |
| S1bj | PASS | soft-stay idle-settle pad hunt: post-S1r/S1s still micro+settled (!macroLod; no mid-tween) | snap={"camX":230.70000000000005,"camY":16.600000000000023,"camK":1.35,"ratio":0.5798045602605864,"camXSettled":true,"camYSettled":true,"scrollVel":0.03803689292874063,"macroLod":false,"presentPaused":false,"targetNodeId":"n1","paneOpen":true} |
| S1t | PASS | nest/line remap mid-scroll soft-cam stay (no zoomToEl yank; settle flags refresh) | setup={"ok":true,"sourceId":"n1","siblingId":"n21","ownLine":11,"siblingLine":31,"scrollTop":345,"max":964,"sibRowOk":true} before={"camX":102.70000000000005,"camY":16.1020746887967,"camK":1.35,"ratio":0.3682572614107884,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false} remap={"ok":true,"scrollTop":616,"delta":-0.34375,"steps":7} afterRemap={"camX":102.70000000000005,"camY":16.1020746887967,"camK":1.35,"ratio":0.6390041493775933,"targetNodeId":"n21","camXSettled":false,"camYSettled":false,"macroLod":false,"presentPaused":false,"scrollVel":0.34074432206235084} resettle={"camX":102.70000000000005,"camY":16.002489626556034,"camXSettled":true,"camYSettled":true,"targetNodeId":"n21","macroLod":false,"presentPaused":false,"scrollVel":0.04559971684694021} dx=0 dy=0 dk=0 resettleYank=0.0995850622406671 |
| S1au | PASS | nest/line remap settle-before-sample: post-S1t still micro+settled (!macroLod; no mid-tween) | snap={"camX":102.70000000000005,"camY":16.002489626556034,"camK":1.35,"ratio":0.6410788381742739,"camXSettled":true,"camYSettled":true,"scrollVel":0.04559971684694021,"macroLod":false,"presentPaused":false,"targetNodeId":"n21"} |
| S1u | PASS | macro enter/exit mid Evidence scroll soft-stays camK (no zoomToEl yank) | setup={"ok":true,"scrollTop":536,"max":1076} before={"camX":102.70000000000005,"camY":16.332342007434967,"camK":1.35,"ratio":0.5037174721189591,"targetNodeId":"n1","macroLod":false,"presentPaused":false,"transform":"matrix(1.34431, 0, 0, 1.34431, 102.373, 16.3341)"} macroEnter={"camX":150.70000000000005,"camY":16.332342007434967,"camK":1,"ratio":0,"macroLod":true,"presentPaused":false,"targetNodeId":"n1"} macro={"camX":102.70000000000005,"camY":16.332342007434967,"camK":0.65,"ratio":0,"macroLod":true,"presentPaused":false,"lod":"0","macroAttr":"1","hot":true,"targetNodeId":"n1","transform":"matrix(1.23852, 0, 0, 1.23852, 117.989, 16.3323)"} exitSnap={"camX":182.70000000000005,"camY":7.7672862453531835,"camK":0.9575,"ratio":0.35687732342007433,"macroLod":false,"presentPaused":false} exit={"camX":182.70000000000005,"camY":7.7672862453531835,"camK":1.3075,"ratio":0.35687732342007433,"macroLod":false,"presentPaused":false,"cfgUnroll":0.35687732342007433,"macroAttr":"","targetNodeId":"n1"} enterDx=48 enterDy=0 enterDk=0.3500000000000001 exitDx=80 exitDy=8.565055762081784 exitDk=0.3075 |
| S1aj | PASS | macro settle-before-sample: post-S1u still micro+settled (!macroLod; no mid-tween) | snap={"camX":182.70000000000005,"camY":7.678066914498165,"camK":1.35,"ratio":0.3587360594795539,"camXSettled":true,"camYSettled":true,"scrollVel":0.044556740781044844,"macroLod":false,"presentPaused":false} |
| S1ba | PASS | atomic settle sample: confirm probes wait+snap one evaluate (no mid-RAF unsettle) | atomicAj={"camX":182.70000000000005,"camY":7.678066914498165,"camK":1.35,"ratio":0.3587360594795539,"camXSettled":true,"camYSettled":true,"scrollVel":0.044556740781044844,"macroLod":false,"presentPaused":false} |
| S1bb | PASS | atomic settle sample: warm/resettle baselines wait+snap one evaluate (no mid-RAF unsettle) | atomicT={"camX":102.70000000000005,"camY":16.1020746887967,"camK":1.35,"ratio":0.3682572614107884,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false} |
| S1v | PASS | Evidence file hop soft-stays cam (no wipe-then-zoomToEl; ScrollDrive publishes) | setup={"ok":true,"sourceId":"n1","hopId":"n2","scrollTop":472,"max":948} before={"camX":102.70000000000005,"camY":16.093670886075973,"camK":1.35,"ratio":0.5084388185654009,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"sourceTitle":"ext · simulation/ext.rs:2"} afterHop={"camX":39.2999755859376,"camY":16.093670886075973,"camK":1.35,"ratio":0,"targetNodeId":"n2","camXSettled":false,"camYSettled":false,"macroLod":false,"presentPaused":false,"activeLine":0,"lineCount":2,"sourceTitle":"as_str · simulation/as_str.rs:2"} resettle={"camX":79.42662229737607,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"targetNodeId":"n2","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false} dx=63.40002441406244 dy=0 dk=0 resettleYank=40.12664671143847 |
| S1as | PASS | file-hop settle-before-sample: post-S1v still micro+settled (!macroLod; no mid-tween) | snap={"camX":79.42662229737607,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"camXSettled":true,"camYSettled":true,"scrollVel":0.04034162626868529,"macroLod":false,"presentPaused":false,"targetNodeId":"n2"} |
| S1w | PASS | Present→Evidence reopen soft-restores cam (same sourceId; no hard zoomToEl) | setup={"ok":true,"sourceId":"n1","scrollTop":472,"max":948} before={"camX":102.70000000000005,"camY":16.093670886075973,"camK":1.35,"ratio":0.5084388185654009,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false} present={"presentPaused":true,"pausedAttr":true,"paneHidden":true} afterReopen={"camX":22.700000000000045,"camY":16.093670886075973,"camK":1.35,"ratio":0,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"activeLine":0,"lineCount":2} resettle={"camX":-57.299999999999955,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false} dx=80 dy=0 dk=0 resettleYank=80 |
| S1at | PASS | soft-restore settle-before-sample: post-S1w still micro+settled (!macroLod; no mid-tween) | snap={"camX":-57.299999999999955,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"camXSettled":true,"camYSettled":true,"scrollVel":0.038291921151546456,"macroLod":false,"presentPaused":false,"targetNodeId":"n1"} |
| S1x | PASS | desk remount soft-stays cam while Evidence open (settle clear→reabsorb; no hard zoomToEl) | before={"camX":-57.299999999999955,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"activeLine":3216,"paneOpen":true,"sourceId":"n1"} afterRemount={"camX":-137.29999999999995,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"activeLine":3216,"activeLineMarked":true,"lineMapHit":false,"paneOpen":true,"lineCount":42,"vnodeCount":29} resettle={"camX":-137.29999999999995,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"activeLineMarked":true,"activeDom":true,"lineMapDom":true} dx=80 dy=0 dk=0 |
| S1al | PASS | remount resettle settle-before-sample: post-S1x still micro+settled (!macroLod; no mid-tween) | snap={"camX":-137.29999999999995,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"camXSettled":true,"camYSettled":true,"scrollVel":0.00469076034106444,"macroLod":false,"presentPaused":false,"targetNodeId":"n1"} |
| S1y | PASS | Map↔Slice remount soft-stays cam while Evidence open (settle clear→reabsorb; no hard zoomToEl) | before={"camX":-137.29999999999995,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"ws":"slice"} onMap={"camX":-217.29999999999995,"camY":15.01409691629958,"camK":1.35,"paneOpen":true,"presentPaused":false,"ws":"map","bubbleCount":12} afterHop={"camX":-297.29999999999995,"camY":15.01409691629958,"camK":1.35,"ratio":0.45154185022026433,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"activeLineMarked":true,"lineMapHit":false,"paneOpen":true,"lineCount":42,"vnodeCount":29,"ws":"slice"} resettle={"camX":-313.9000009128964,"camY":14.802643171806189,"camK":1.35,"ratio":0.45594713656387664,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"activeLineMarked":true,"activeDom":true,"lineMapDom":true} dxMap=80 dyMap=1.3744493392070485 dkMap=0 dx=80 dy=0 dk=0 |
| S1ah | PASS | settle-before-sample: soft-follow asserts wait for settle flags (micro+settled; no mid-tween) | snap={"camX":-313.9000009128964,"camY":14.802643171806189,"camK":1.35,"ratio":0.45594713656387664,"camXSettled":true,"camYSettled":true,"scrollVel":0.0355870099945744,"presentPaused":false,"macroLod":false} |
| S1z | PASS | Lineage/Overview hop soft-stays cam while Evidence open (reuse S1y helper; no hard zoomToEl) | warm={"camX":-313.9000161716855,"camY":14.591189427312795,"camK":1.35,"ratio":0.460352422907489,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"ws":"slice"} onOverview={"camX":-313.89998565410747,"camY":15.178171952037829,"camK":1.35,"paneOpen":true,"presentPaused":false,"targetNodeId":"n1","ws":"overview","vnodeCount":29} afterOverview={"camX":-313.89998565410747,"camY":15.225550660792972,"camK":1.35,"ratio":0.44713656387665196,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"activeLineMarked":true,"paneOpen":true,"lineCount":42,"vnodeCount":29,"ws":"slice"} resettle={"camX":-313.89998565410747,"camY":15.225550660792972,"camK":1.35,"ratio":0.44713656387665196,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"activeLineMarked":true,"activeDom":true,"lineMapDom":true,"hasHelper":true} ovDx=0.000030517578011313162 ovDy=0.586982524725034 ovDk=0 dx=0.000030517578011313162 dy=0.6343612334801776 dk=0 |
| S1ak | PASS | Lineage/Overview resettle settle-before-sample: post-S1z still micro+settled (!macroLod; no mid-tween) | snap={"camX":-313.89998565410747,"camY":15.225550660792972,"camK":1.35,"ratio":0.44713656387665196,"camXSettled":true,"camYSettled":true,"scrollVel":0.018487349761984136,"macroLod":false,"presentPaused":false,"targetNodeId":"n1"} |
| S1aa | PASS | persist last-stay across reload soft-restores from sessionStorage (same sourceId; no hard zoomToEl) | before={"camX":-57.299999999999955,"camY":16.110204081632673,"camK":1.35,"ratio":0.5244897959183673,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"storageKey":"graphide.scrollDrive.lastStay.v1"} stashed={"store":"session","sourceId":"n1","x":-57.299999999999955,"y":16.110204081632673,"k":1.35,"t":1793078476439} memoryCleared={"hasStorage":true,"key":"graphide.scrollDrive.lastStay.v1"} after={"camX":-137.29999999999995,"camY":16.110204081632673,"camK":1.35,"ratio":0,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"lineCount":2} resettle={"camX":-9.299999999999955,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false} dx=80 dy=0 dk=0 dxSnap=80 dySnap=0 dkSnap=0 corrupt={"wrote":true,"cleared":true,"probed":null} |
| S1ab | PASS | workspace-scoped last-stay blocks cross-folder restore; same key + host re-post soft-restores | setup={"ok":true,"sourceId":"n1","ws":"ws-a://folder","key":"graphide.scrollDrive.lastStay.v1::ws-a%3A%2F%2Ffolder"} before={"camX":-57.299999999999955,"camY":16.110204081632673,"camK":1.35,"ratio":0.5244897959183673,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"ws":"ws-a://folder","key":"graphide.scrollDrive.lastStay.v1::ws-a%3A%2F%2Ffolder","macroLod":false,"presentPaused":false} stashedA={"key":"graphide.scrollDrive.lastStay.v1::ws-a%3A%2F%2Ffolder","sourceId":"n1","ws":"ws-a://folder","x":-57.299999999999955,"y":16.110204081632673,"k":1.35} cross={"ws":"ws-b://other","keyB":"graphide.scrollDrive.lastStay.v1::ws-b%3A%2F%2Fother","probedB":null,"hasRawB":false,"crossBlocked":true} hostRepost={"beforePresent":false} after={"camX":-57.299999999999955,"camY":41.285714285714306,"camK":1.35,"ratio":0,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"ws":"ws-a://folder","key":"graphide.scrollDrive.lastStay.v1::ws-a%3A%2F%2Ffolder"} dx=0 dy=25.175510204081633 dk=0 dxSnap=0 dySnap=25.175510204081633 dkSnap=0 |
| S1av | PASS | reload/host-repost settle-before-sample: post-S1aa/S1ab still micro+settled (!macroLod; no mid-tween) | snap={"camX":-57.299999999999955,"camY":41.285714285714306,"camK":1.35,"ratio":0,"camXSettled":true,"camYSettled":true,"scrollVel":0,"macroLod":false,"presentPaused":false,"targetNodeId":"n1"} |
| S1ac | PASS | Review restart clears current last-stay; soft-restore skipped; other folder key isolated | seed={"keyA":"graphide.scrollDrive.lastStay.v1::ws-a%3A%2F%2Ffolder","keyB":"graphide.scrollDrive.lastStay.v1::ws-b%3A%2F%2Fother","hasRawA":true,"hasHook":true} cleared={"cleared":true,"keyA":"graphide.scrollDrive.lastStay.v1::ws-a%3A%2F%2Ffolder","hasRawA":false,"probed":null,"restored":false,"hostRestored":false,"hasRawB":true,"ws":"ws-a://folder"} |
| S1ad | PASS | Present enter stashes before wipe + stay cue; exit alone no cam yank; no prior stay → no bogus restore | setup={"ok":true,"scrollTop":472} before={"camX":-57.299999999999955,"camY":16.093670886075973,"camK":1.35,"ratio":0.5084388185654009,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"presentStayStashed":false} present={"presentPaused":true,"presentStayStashed":true,"pausedAttr":true,"stayAttr":true,"paneHidden":true,"targetNodeId":"","ratio":0} afterExit={"presentPaused":false,"presentStayStashed":false,"stayAttr":false,"pausedAttr":false,"targetNodeId":"","ratio":0,"lastStayWarm":true} stashProbe={"ok":true,"sourceId":"n1","x":-57.299999999999955,"y":16.093670886075973,"k":1.35,"dx":0,"dy":0,"dk":0,"ws":"ws-s1ad://folder"} afterReopen={"targetNodeId":"n1","presentPaused":false,"presentStayStashed":false,"paneOpen":true,"camXSettled":true,"camYSettled":true,"macroLod":false} coldPresent={"presentPaused":true,"presentStayStashed":false,"stayAttr":false} coldRestore={"restored":false,"probed":null} |
| S1ae | PASS | Present→Evidence reopen soft-stay survives refitChartSoon (skip hard fit; exit alone no half-restore) | skipCold={"skip":false,"hasHook":true} setup={"ok":true,"scrollTop":472} before={"camX":-57.299999999999955,"camY":16.093670886075973,"camK":1.35,"ratio":0.5084388185654009,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"skipRefit":true} present={"presentPaused":true,"presentStayStashed":true,"paneHidden":true,"skipRefit":true} afterExit={"presentPaused":false,"presentStayStashed":false,"targetNodeId":"","ratio":0} afterReopen={"camX":-137.29999999999995,"camY":16.093670886075973,"camK":1.35,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"skipRefit":true,"paneOpen":true} d={"dx":80,"dy":0,"dk":0} |
| S1ay | PASS | Present-stage settle-before-sample: post-S1ad/S1ae still micro+settled (!macroLod; no mid-tween) | snap={"camX":-137.29999999999995,"camY":16.093670886075973,"camK":1.35,"ratio":0,"camXSettled":true,"camYSettled":true,"scrollVel":0,"macroLod":false,"presentPaused":false,"targetNodeId":"n1","skipRefit":true} |
| S1bi | PASS | Present-exit settle-before-sample: post-S1ad/S1ae/S1w still micro+settled + stash cue cleared (!macroLod; no mid-tween) | snap={"camX":102.70000000000005,"camY":16.38854625550663,"camK":0.5080409356725146,"ratio":0.42290748898678415,"camXSettled":true,"camYSettled":true,"scrollVel":0.03426389435974084,"macroLod":false,"presentPaused":false,"reviewStayCleared":false,"presentStayStashed":false,"cueAttr":false,"presentStayAttr":false,"softStayed":true,"targetNodeId":"n1","paneOpen":true} |
| S1af | PASS | Review-clear publishes short-lived stay-cleared cue (not a restore); soft-stash / cold open clears it | setup={"ok":true,"scrollTop":472} beforeClear={"reviewStayCleared":false,"hasRaw":true,"hasHook":true,"cueAttr":false,"hadWarmStay":true} cleared={"cleared":true,"reviewStayCleared":true,"cueAttr":true,"restored":false,"probed":null,"presentStayStashed":false} afterStash={"reviewStayCleared":false,"cueAttr":false} recleared={"reviewStayCleared":true,"cueAttr":true} afterColdOpen={"reviewStayCleared":false,"cueAttr":false,"paneOpen":true,"presentStayStashed":false,"softStayed":false,"targetNodeId":"n1"} |
| S1az | PASS | Review-clear cue settle-before-sample: post-S1af still micro+settled + cue cleared (!macroLod; no mid-tween) | snap={"camX":-57.299999999999955,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"camXSettled":true,"camYSettled":true,"scrollVel":0.0467397948008099,"macroLod":false,"presentPaused":false,"reviewStayCleared":false,"presentStayStashed":false,"cueAttr":false,"targetNodeId":"n1","paneOpen":true} |
| S1bh | PASS | Review-clear cold-open settle-before-sample: post-S1af still micro+settled + cue cleared (!macroLod; no mid-tween) | snap={"camX":-57.299999999999955,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"camXSettled":true,"camYSettled":true,"scrollVel":0.0467397948008099,"macroLod":false,"presentPaused":false,"reviewStayCleared":false,"presentStayStashed":false,"cueAttr":false,"presentStayAttr":false,"targetNodeId":"n1","paneOpen":true} |
| S1ag | PASS | Workspace-folder change clears Review-clear cue (same-key no-op keeps it) | planted={"reviewStayCleared":true,"cueAttr":true,"ws":"ws-s1ag://folder-a"} sameKey={"changed":false,"reviewStayCleared":true,"cueAttr":true,"ws":"ws-s1ag://folder-a"} hopped={"changed":true,"reviewStayCleared":false,"cueAttr":false,"ws":"ws-s1ag://folder-b"} |
| S1bc | PASS | Workspace-change Review-clear cue settle-before-sample: post-S1ag still micro+settled + cue cleared (!macroLod; no mid-tween) | snap={"camX":-313.9000061035156,"camY":-609.2725193376583,"camK":1.35,"ratio":0.43171806167400884,"camXSettled":true,"camYSettled":true,"scrollVel":0.03478996788656941,"macroLod":false,"presentPaused":false,"reviewStayCleared":false,"presentStayStashed":false,"cueAttr":false,"targetNodeId":"n1","paneOpen":true,"ws":"ws-s1ag://folder-b"} |
| S1ai | PASS | Present enter clears Review-clear cue; mutually exclusive with presentStayStashed | lingering={"reviewStayCleared":true,"cueAttr":true,"presentStayStashed":false,"planted":true} afterPresentClear={"presentPaused":true,"reviewStayCleared":false,"cueAttr":false,"presentStayStashed":false,"presentStayAttr":false} forced={"reviewStayCleared":true,"cueAttr":true,"hasRaw":true,"hasSetter":true} mutEx={"presentPaused":true,"presentStayStashed":true,"reviewStayCleared":false,"cueAttr":false,"presentStayAttr":true} |
| S1bd | PASS | Present-stash/Review-clear mutual-exclusion settle-before-sample: post-S1ai still micro+settled + both cues cleared (!macroLod; no mid-tween) | snap={"camX":-57.299999999999955,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"camXSettled":true,"camYSettled":true,"scrollVel":0.06259712254454457,"macroLod":false,"presentPaused":false,"reviewStayCleared":false,"presentStayStashed":false,"cueAttr":false,"presentStayAttr":false,"targetNodeId":"n1","paneOpen":true} |
| S1am | PASS | Present exit clears presentStayStashed without implying Review clear (scrubs reviewStayCleared) | duringPresent={"presentPaused":true,"presentStayStashed":false,"reviewStayCleared":true,"cueAttr":true,"presentStayAttr":false,"hasSetter":true} afterExit={"presentPaused":false,"presentStayStashed":false,"reviewStayCleared":false,"cueAttr":false,"presentStayAttr":false,"presentPausedAttr":false} |
| S1be | PASS | Present-exit Review-clear cue polish settle-before-sample: post-S1am still micro+settled + both cues scrubbed (!macroLod; no mid-tween) | snap={"camX":-57.299999999999955,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"camXSettled":true,"camYSettled":true,"scrollVel":0.04568628173937507,"macroLod":false,"presentPaused":false,"reviewStayCleared":false,"presentStayStashed":false,"cueAttr":false,"presentStayAttr":false,"targetNodeId":"n1","paneOpen":true} |
| S1an | PASS | Review clear mid-Present drops presentStayStashed (mutual exclusion with reviewStayCleared) | before={"presentPaused":true,"presentStayStashed":true,"presentStayAttr":true,"reviewStayCleared":false,"cueAttr":false} afterClear={"presentPaused":true,"presentStayStashed":false,"presentStayAttr":false,"reviewStayCleared":true,"cueAttr":true,"hasClear":true} afterExit={"presentPaused":false,"presentStayStashed":false,"presentStayAttr":false,"reviewStayCleared":false,"cueAttr":false} |
| S1bf | PASS | Review-during-Present mutual-exclusion settle-before-sample: post-S1an still micro+settled + both cues cleared (!macroLod; no mid-tween) | snap={"camX":-57.299999999999955,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"camXSettled":true,"camYSettled":true,"scrollVel":0.057730751728421854,"macroLod":false,"presentPaused":false,"reviewStayCleared":false,"presentStayStashed":false,"cueAttr":false,"presentStayAttr":false,"targetNodeId":"n1","paneOpen":true,"softStayed":false} |
| S1ao | PASS | Evidence reopen after Review-during-Present wipe takes cold hard path (no soft-restore) | afterWipe={"hasRaw":false,"probed":null,"restored":false,"hostRestored":false,"presentPaused":false,"presentStayStashed":false} afterReopen={"paneOpen":true,"softStayed":false,"hasSoftFlag":true,"hasRaw":true,"probed":{"sourceId":"n1","x":-273.4000235421315,"y":-588.5499764578684,"k":1.35,"t":1793078501610,"ws":"ws-s1ai://folder","targetNodeId":"n1","scrollRatio":0},"presentPaused":false,"presentStayStashed":false,"reviewStayCleared":false,"targetNodeId":"n1"} |
| S1bg | PASS | Cold-path reopen settle-before-sample: post-S1ao still micro+settled + softStayed false + cues cleared (!macroLod; no mid-tween) | snap={"camX":-57.299999999999955,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"camXSettled":true,"camYSettled":true,"scrollVel":0.0643295821015844,"macroLod":false,"presentPaused":false,"reviewStayCleared":false,"presentStayStashed":false,"softStayed":false,"cueAttr":false,"presentStayAttr":false,"targetNodeId":"n1","paneOpen":true} |
| S1aq | PASS | After S1ao wipe, fresh stay Present→Evidence soft-restores again (round-trip) | setup={"ok":true,"scrollTop":200} before={"camX":-57.299999999999955,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"hasRaw":true,"probedOk":true,"hasStashHook":true,"stashOk":true} present={"presentPaused":true,"presentStayStashed":true,"reviewStayCleared":false,"paneHidden":true} afterReopen={"softStayed":true,"hasSoftFlag":true,"paneOpen":true,"presentPaused":false,"presentStayStashed":false,"reviewStayCleared":false,"targetNodeId":"n1","camX":-137.29999999999995,"camY":16.38854625550663,"camK":1.35,"camXSettled":true,"camYSettled":true,"macroLod":false,"skipRefit":true} resettle={"camX":-57.299999999999955,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false} dx=80 dy=0 resettleYank=80 |
| S1ax | PASS | soft-restore round-trip settle-before-sample: post-S1aq still micro+settled (!macroLod; no mid-tween) | snap={"camX":-57.299999999999955,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"camXSettled":true,"camYSettled":true,"scrollVel":0.038330613405134537,"macroLod":false,"presentPaused":false,"targetNodeId":"n1","softStayed":true} |
| S1bl | PASS | soft-step / macro catch-up pad hunt: post-S1u/S1aq still micro+settled (!macroLod; no mid-tween) | snap={"ratio":0.42290748898678415,"scrollVel":0.038330613405134537,"camX":-57.299999999999955,"camY":16.38854625550663,"camK":1.35,"camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"softStayed":true,"targetNodeId":"n1","paneOpen":true} |
| S1bm | PASS | S1s warm-publish pad hunt: post-S1r/S1s still micro+settled (!macroLod; no mid-tween) | snap={"ratio":0.42290748898678415,"scrollVel":0.038330613405134537,"camX":-57.299999999999955,"camY":16.38854625550663,"camK":1.35,"camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"targetNodeId":"n1","paneOpen":true} |
| S1bn | PASS | remount/hop warm-publish pad hunt: post-S1x/S1y/S1z still micro+settled (!macroLod; no mid-tween) | snap={"ratio":0.42290748898678415,"scrollVel":0.038330613405134537,"camX":-57.299999999999955,"camY":16.38854625550663,"camK":1.35,"camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"targetNodeId":"n1","paneOpen":true} |
| S1bo | PASS | velocity / Present-residual / S1g burst pad hunt: post-S1c/S1m/S1g still micro+settled (!macroLod; no mid-tween) | snap={"ratio":0.42290748898678415,"scrollVel":0.038330613405134537,"camX":-57.299999999999955,"camY":16.38854625550663,"camK":1.35,"camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"targetNodeId":"n1","paneOpen":true} |
| S1bp | PASS | one-paint double-rAF pad hunt: post-S1 soft-step samples still micro+settled (!macroLod; no mid-tween) | snap={"ratio":0.42290748898678415,"scrollVel":0.038330613405134537,"camX":-57.299999999999955,"camY":16.38854625550663,"camK":1.35,"camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"targetNodeId":"n1","paneOpen":true} |
| S1bq | PASS | enter-canvas remount soft-stays cam while Evidence open (enter+back; no wipe-then-zoomToEl) | click={"clicked":true,"run":"1","bubble":"b-render"} before={"camX":-57.299999999999955,"camY":16.38854625550663,"camK":1.35,"ratio":0.42290748898678415,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"runCount":2} afterEnter={"camX":-57.299999999999955,"camY":16.343734865945116,"camK":1.35,"ratio":0.423841059602649,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"enterXy":24} dx=0 dy=0.04481138956151298 dk=0 resettle={"camX":-57.299999999999955,"camY":16.13181433614379,"camK":1.35,"ratio":0.4282560706401766,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"enterXy":24} afterBack={"camX":-57.299999999999955,"camY":16.17709251101324,"camK":1.35,"ratio":0.42731277533039647,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"enterGone":true,"sliceNodes":29} backDx=0 backDy=0.045278174869448407 backDk=0 |
| S1br | PASS | list↔canvas soft-stay: Slice→Decisions→Slice while Evidence open (stash leave; soft-restore return) | before={"camX":-57.299999999999955,"camY":16.17709251101324,"camK":1.35,"ratio":0.42731277533039647,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"ws":""} onList={"paneOpen":true,"presentPaused":false,"hasSlice":false,"meta":"Review / decisions · Decisions — stamps, skips, and broken attestations"} after={"camX":-137.29999999999995,"camY":16.17709251101324,"camK":1.35,"ratio":0.42731277533039647,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"sliceNodes":29} dx=80 dy=0 dk=0 |
| S1bs | PASS | ego remount soft-stay while Evidence open (keepCam + desk remount soft-restore) | before={"camX":-137.29999999999995,"camY":16.17709251101324,"camK":1.35,"ratio":0.42731277533039647,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"egoOn":false} after={"camX":-137.29999999999995,"camY":16.17709251101324,"camK":1.35,"ratio":0.42731277533039647,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"egoOn":true,"sliceNodes":29} dx=0 dy=0 dk=0 |
| S1bt | PASS | flow-tab remount soft-stay while Evidence open (keepCam + desk remount soft-restore) | before={"camX":-217.29999999999995,"camY":16.17709251101324,"camK":1.35,"ratio":0.42731277533039647,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"flow":"control-flow","tabs":[{"name":"overview","on":false},{"name":"control-flow","on":true},{"name":"boot","on":false}]} after={"camX":-297.29999999999995,"camY":16.17709251101324,"camK":1.35,"ratio":0.42731277533039647,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"flow":"boot","sliceNodes":29} pick={"ok":true,"first":"control-flow","second":"boot"} dx=80 dy=0 dk=0 |
| S1bu | PASS | search/kind remount soft-stay while Evidence open (refreshExplorer keepCam + soft-restore) | before={"camX":-297.29999999999995,"camY":16.17709251101324,"camK":1.35,"ratio":0.42731277533039647,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true} after={"camX":-297.29999999999995,"camY":16.17709251101324,"camK":1.35,"ratio":0.42731277533039647,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"sliceNodes":29} wasChecked=true dx=0 dy=0 dk=0 |
| S1bv | PASS | just-restored first flush keeps soft-restore base X (no soft-follow walk; ego remount) | before={"camX":-297.29999999999995,"camY":16.17709251101324,"camK":1.35,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"egoOn":false} after={"camX":-297.29999999999995,"camY":16.17709251101324,"camK":1.35,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"egoOn":true,"sliceNodes":29} dx=0 dy=0 dk=0 |
| S1bw | PASS | ego-hops remount soft-stay while Evidence open (keepCam + desk remount soft-restore) | before={"camX":-297.29999999999995,"camY":16.17709251101324,"camK":1.35,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"hops":"1","egoOn":true} after={"camX":-313.9000061035156,"camY":16.17709251101324,"camK":1.35,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"hops":"2","egoOn":true,"sliceNodes":29} dx=16.600006103515625 dy=0 dk=0 |
| S1bx | PASS | stamp remount soft-stay while Evidence open (keepCam + desk remount soft-restore) | before={"camX":-313.9000061035156,"camY":16.17709251101324,"camK":1.35,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true} after={"camX":-313.9000061035156,"camY":16.17709251101324,"camK":1.35,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"sliceNodes":29} dx=0 dy=0 dk=0 |
| S1by | PASS | host patch remount soft-stay while Evidence open (keepCam + desk remount soft-restore) | before={"camX":-313.9000061035156,"camY":16.17709251101324,"camK":1.35,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"sliceNodes":29} after={"camX":-313.9000061035156,"camY":16.17709251101324,"camK":1.35,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"sliceNodes":29} dx=0 dy=0 dk=0 |
| S1bz | PASS | cancelled remount soft-stay while Evidence open (keepCam + desk remount soft-restore) | before={"camX":-313.9000061035156,"camY":16.17709251101324,"camK":1.35,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"sliceNodes":29} after={"camX":-313.90002136230464,"camY":16.17709251101324,"camK":1.35,"targetNodeId":"n1","camXSettled":true,"camYSettled":true,"macroLod":false,"presentPaused":false,"paneOpen":true,"sliceNodes":29,"status":"cancelled"} dx=0.0000152587890625 dy=0 dk=0 |
| K19 | PASS | Opening Keys hides the hover tip (no tip under chrome) | {"tipHidden":true,"keysOpen":true} |
| K19b | PASS | Opening Export hides the hover tip (no tip under chrome) | {"tipHidden":true,"exportOpen":true} |
| K19c | PASS | Opening Ask hides the hover tip (no tip under chrome) | {"tipHidden":true,"askOpen":true} |
| K19h | PASS | Focusing Find hides the hover tip (no tip under Find) | {"tipHidden":true,"findFocused":true} |
| K20h | PASS | Focusing Find clears the toast (no toast under Find) | {"toastGone":true,"findFocused":true} |
| K20 | PASS | Opening Keys clears the toast (no toast under chrome) | {"toastGone":true,"keysOpen":true} |
| K20b | PASS | Opening Export clears the toast (no toast under chrome) | {"toastGone":true,"exportOpen":true} |
| K20c | PASS | Opening Ask clears the toast (no toast under chrome) | {"toastGone":true,"askOpen":true} |
| K19d | PASS | Opening Evidence hides the hover tip (no tip under chrome) | {"tipHidden":true,"evidenceOpen":true} |
| K20d | PASS | Opening Evidence clears the toast (no toast under chrome) | {"toastGone":true,"evidenceOpen":true} |
| K19e | PASS | Opening Present hides the hover tip (no tip under chrome) | {"tipHidden":true,"presenting":true} |
| K20e | PASS | Opening Present clears the toast (no toast under chrome) | {"toastGone":true,"presenting":true} |
| K5b | PASS | Escape closes Keys; Evidence stays closed (Keys exclusivity) | {"keysHidden":true,"evidenceOpen":false} |
| K6 | PASS | Map altitude is still community LOD after Keys (xy=0) | cards=12 xy=0 |
| K6b | PASS | Keys is closed so it does not cover Evidence / ledger / Ask | hidden=true |
| K7 | PASS | Keys step did not write .graphide/stamps/ | absent |
| K8 | PASS | Cmd / Ctrl chords (Cmd+S, Ctrl+X, Cmd+F…) do not stamp, skip or toggle desk modes | {"stampPosts":0,"skipPosts":0,"changed":[],"altGrFind":true} |
| K8b | PASS | Ctrl+Alt (AltGr) / still opens Find | {"altGrFind":true} |
| K10 | PASS | Auto-repeat of toggle / action keys (S X D F E R L P Backspace) does nothing; + still repeats | {"stampPosts":0,"skipPosts":0,"appearancePosts":0,"changed":[],"zoomRepeats":true,"zoom0":"63% · overview","zoom1":"74% · overview"} |
| K11 | PASS | After clicking a kind pill (checkbox focus), R still toggles PATH | {"focus":"input:checkbox","typeOn":true,"routeBefore":false,"routeAfter":true} |
| K9 | PASS | A focused <select> keeps its keys: 2 / S / X do not switch workspace, stamp or skip | {"focused":true,"ws0":"map","ws":"map","stampPosts":0,"skipPosts":0,"hops":"2"} |
| K12 | PASS | Focused Ask host <select> keeps 2 / S / X — no workspace switch, stamp or skip | {"focused":true,"ws0":"map","ws":"map","stampPosts":0,"skipPosts":0,"askOpen":true} |
| K13 | PASS | Escape on focused Find blurs the field and keeps the query | {"q":"render","focused":false,"active":"BODY"} |
| K13b | PASS | After Find Escape blur, desk R still toggles PATH | route=true |
| K13c | PASS | Escape on focused Find also closes an open Route | {"q":"render","focused":false,"route":false} |
| K13d | PASS | Escape on focused Find also closes Evidence | {"q":"render","focused":false,"evidenceOpen":false} |
| K13e | PASS | Escape on focused Find also closes an open Lens | {"q":"render","focused":false,"lens":false} |
| K13f | PASS | Escape on focused Find also closes Export | {"q":"render","focused":false,"exportOpen":false} |
| K14 | PASS | Backspace closes Export without leaving Map community LOD | {"exportOpen":false,"cards":12,"xy":0,"ws":"map","before":{"cards":12,"xy":0,"ws":"map"}} |
| K14b | PASS | Backspace closes Route without leaving Map community LOD | {"route":false,"cards":12,"xy":0} |
| K14c | PASS | Backspace closes Export inside Enter without popping to Map | {"exportOpen":false,"enter":24,"cards":0,"xy":48} |
| K14d | PASS | Backspace closes Keys without leaving Map community LOD | {"keysOpen":false,"cards":12,"xy":0} |
| K14e | PASS | Backspace closes Ask without leaving Map community LOD | {"askOpen":false,"cards":12,"xy":0} |
| K14f | PASS | Backspace closes Evidence without leaving Slice | {"evidenceOpen":false,"nodes":29,"before":29,"cards":0} |
| K14g | PASS | Backspace closes Lens without leaving Map community LOD | {"lens":false,"cards":12,"xy":0} |
| K14i | PASS | Backspace closes Keys on Present without exiting the stage | {"keysOpen":false,"present":true,"cards":12,"xy":0} |
| K14j | PASS | Backspace closes Export on Present without exiting the stage | {"exportOpen":false,"present":true,"cards":12,"xy":0} |
| K14k | PASS | Backspace closes Lens on Present without exiting the stage | {"lens":false,"present":true,"cards":12,"xy":0} |
| K14l | PASS | Backspace closes Route on Present without exiting the stage | {"route":false,"present":true,"cards":12,"xy":0} |
| K14h | PASS | Backspace exits Present without leaving Map community LOD | {"present":false,"cards":12,"xy":0} |
| K15 | PASS | Open Export blocks desk S / X / R (no stamp, skip, or PATH) | {"exportOpen":true,"stampPosts":0,"skipPosts":0,"route":false} |
| K15h | PASS | Open Export blocks desk L (no LENS) | {"exportOpen":true,"lens":false} |
| K15i | PASS | Open Export blocks desk F (no Present) | {"exportOpen":true,"presenting":false} |
| K15l | PASS | Open Export blocks desk E (no Ego) | {"exportOpen":true,"ego":false} |
| K15o | PASS | Open Export blocks desk D (no day/night) | {"exportOpen":true,"night":false,"appearancePosts":0,"nightBefore":false} |
| K15r | PASS | Open Export blocks desk P (no Play) | {"exportOpen":true,"playOn":false,"walk":0} |
| K15u | PASS | Open Export blocks desk [ ] (no path step) | {"exportOpen":true,"walk":0,"chipWalk":0,"cardWalk":0} |
| K15x | PASS | Open Export blocks desk + − (no zoom) | {"exportOpen":true,"pct":63,"pctBefore":63} |
| K15aa | PASS | Open Export blocks desk 0 (no Fit) | {"exportOpen":true,"pct":76,"pctBefore":76} |
| K15b | PASS | Open Keys sheet blocks desk S / X (no stamp or skip) | {"keysOpen":true,"stampPosts":0,"skipPosts":0} |
| K15d | PASS | Open Keys sheet blocks desk R (no PATH) | {"keysOpen":true,"route":false} |
| K15f | PASS | Open Keys sheet blocks desk L (no LENS) | {"keysOpen":true,"lens":false} |
| K15j | PASS | Open Keys sheet blocks desk F (no Present) | {"keysOpen":true,"presenting":false} |
| K15m | PASS | Open Keys sheet blocks desk E (no Ego) | {"keysOpen":true,"ego":false} |
| K15p | PASS | Open Keys sheet blocks desk D (no day/night) | {"keysOpen":true,"night":false,"appearancePosts":0,"nightBefore":false} |
| K15s | PASS | Open Keys sheet blocks desk P (no Play) | {"keysOpen":true,"playOn":false,"walk":0} |
| K15v | PASS | Open Keys sheet blocks desk [ ] (no path step) | {"keysOpen":true,"walk":0,"chipWalk":0,"cardWalk":0} |
| K15y | PASS | Open Keys sheet blocks desk + − (no zoom) | {"keysOpen":true,"pct":76,"pctBefore":76} |
| K15ab | PASS | Open Keys sheet blocks desk 0 (no Fit) | {"keysOpen":true,"pct":91,"pctBefore":91} |
| K15c | PASS | Open Ask blocks desk S / X when the field is not focused | {"askOpen":true,"stampPosts":0,"skipPosts":0} |
| K15e | PASS | Open Ask blocks desk R (no PATH) | {"askOpen":true,"route":false} |
| K15g | PASS | Open Ask blocks desk L (no LENS) | {"askOpen":true,"lens":false} |
| K15k | PASS | Open Ask blocks desk F (no Present) | {"askOpen":true,"presenting":false} |
| K15n | PASS | Open Ask blocks desk E (no Ego) | {"askOpen":true,"ego":false} |
| K15q | PASS | Open Ask blocks desk D (no day/night) | {"askOpen":true,"night":false,"appearancePosts":0,"nightBefore":false} |
| K15t | PASS | Open Ask blocks desk P (no Play) | {"askOpen":true,"playOn":false,"walk":0} |
| K15w | PASS | Open Ask blocks desk [ ] (no path step) | {"askOpen":true,"walk":0,"chipWalk":0,"cardWalk":0} |
| K15z | PASS | Open Ask blocks desk + − (no zoom) | {"askOpen":true,"pct":35,"pctBefore":35} |
| K15ac | PASS | Open Ask blocks desk 0 (no Fit) | {"askOpen":true,"pct":42,"pctBefore":42} |
| K16 | PASS | Escape on focused #prompt blurs the field and keeps the value | {"q":"name=hit,hit","focused":false} |
| K16b | PASS | After #prompt Escape blur, desk R still toggles PATH | route=true |
| PW1 | PASS | Map has a start → features → end community path | {"chips":8,"cards":12,"startChip":true,"endChip":true,"startCard":true,"endCard":true,"play":false,"prev":false,"next":false,"pathBtnOn":false,"routePlay":false,"label":"Start → features → end","xy":0} |
| PW1b | PASS | Map path walk is not Route PATH / #routePlay | {"pathBtnOn":false,"routePlay":false} |
| PW2 | PASS | P or #pathWalkBtn starts Map path walk and paints .walk / .here | via=P {"chipWalk":1,"chipHere":1,"cardWalk":1,"playOn":false} |
| PW3 | PASS | ] steps Map path walk to a mid-path community (.walk, not START/END) | {"chipWalk":1,"chipHere":2,"cardWalk":1,"midChip":true,"midCard":true,"chipId":"b-integration","cardId":"b-integration","xy":0,"routeOn":false} |
| shot:path-walk.png | PASS | screenshot path-walk.png is not a black frame | luma=0.968 1440x900 bytes=165838 |
| PW4 | PASS | [ steps Map path walk without writing stamps | {"chipId":"b-render","cardId":"b-render","chipWalk":1,"cardWalk":1,"moved":true,"stampPosts":0,"skipPosts":0,"playOn":false,"xy":0,"cards":12} |
| PW5 | PASS | Pause / stop leaves Map at community LOD (xy=0) | {"playOn":false,"cards":12,"xy":0} |
| PW6 | PASS | Map path walk does not post a stamp or skip | {"stampPosts":0,"skipPosts":0} |
| PW7 | PASS | Map path walk did not write .graphide/stamps/ | absent |
| X1 | PASS | Export menu opens from #exportBtn | {"btn":true,"menu":true,"png":true,"svg":true,"share":true} |
| X2 | PASS | Export PNG was saved and is not a black frame | luma=0.945 std=0.054 1888x520 bytes=90565 |
| X3 | PASS | Export SVG was saved | bytes=202622 |
| X4 | PASS | Share Card is 1200×630 | 1200x630 |
| X5 | PASS | Export filenames do not claim validation | graphide-control-flow.png graphide-control-flow.svg graphide-control-flow-share.png |
| X6 | PASS | Canonical export strips focus / play / search / Route / Lens / away classes | {"cls":"","review":null} |
| X7 | PASS | Export posts exportFile to the host stub (not stamp) | graphide-control-flow.png,graphide-control-flow.svg,graphide-control-flow-share.png |
| X8 | PASS | Export step did not write .graphide/stamps/ | absent |
| X6b | PASS | Export SVG after Find carries no .hit / .dim on Map cards | {"liveHit":["b-physics"],"cards":12,"physics":"bubble-card off","hit":[],"dim":[]} |
| X6c | PASS | Export SVG after Route carries no .route-dim / .on-route on Slice nodes | {"live":{"routeDim":23,"onRoute":6},"routeDim":0,"onRoute":0,"lensDim":0,"lensOn":0} |
| X6d | PASS | Export SVG after Lens carries no .lens-dim / .lens-on on Slice nodes | {"live":{"lensDim":2,"lensOn":27},"lensDim":0,"lensOn":0,"routeDim":0,"onRoute":0} |
| X6e | PASS | Export SVG strips stamped .hot / .flowing / .on-path play-head classes | {"livePlay":{"hot":1,"flowing":1,"onPath":1},"exportPlay":{"liveHot":1,"liveFlowing":1,"liveOnPath":1,"hot":0,"flowing":0,"onPath":0}} |
| X6f | PASS | Export SVG strips data-offview so parked Map cards stay in the clone | {"liveOff":{"off":4,"ids":["b-render","b-camera","b-config","b-debug"],"cards":12},"exportOff":{"liveOff":4,"liveIds":["b-render","b-camera","b-config","b-debug"],"exportCards":12,"offAttrs":0,"parkedStillInExport":4}} |
| P1 | PASS | Style cycle changes data-preset; topology is unchanged | classic → signal-flow cards=12 |
| P2 | PASS | Blueprint preset is on the same Map topology | blueprint cards=12 fn=#1e4d8c |
| P3 | PASS | Day / Night does not change the visual preset | {"before":"blueprint","night":"blueprint","after":"blueprint"} |
| P4 | PASS | Canonical export carries the current preset | {"ok":true,"preset":"blueprint","hasAttr":true} |
| shot:preset-blueprint.png | PASS | screenshot preset-blueprint.png is not a black frame | luma=0.926 1440x900 bytes=167885 |
| P5 | PASS | Presentation Stage fills the viewport and hides graph-bar chrome | {"present":true,"aria":"true","barHidden":true,"w":1440,"h":853,"top":47,"bottom":900,"vw":1440,"vh":900,"headerBottom":47,"fill":true} |
| shot:present.png | PASS | screenshot present.png is not a black frame | luma=0.924 1440x900 bytes=83685 |
| P6 | PASS | S on the stage cycles Style without moving nodes | classic cards=12 |
| P6b | PASS | Present blocks desk X (no skip while stage hides Skip) | {"present":true,"skipPosts":0,"stampPosts":0} |
| P6c | PASS | Present blocks desk / (Find stays unfocused while graph bar is hidden) | {"present":true,"barHidden":true,"findFocused":false,"active":"BODY"} |
| P6l | PASS | Present: desk D still toggles Day/Night | {"present":true,"before":false,"night":true,"exportOpen":false,"keysOpen":false} |
| P6m | PASS | Present: desk zoom (+/=) still scales the stage | {"present":true,"before":"translate(18px, 185.637px) scale(0.731001)","transform":"translate(-75.3806px, 163.608px) scale(0.833823)","exportOpen":false,"keysOpen":false} |
| P6n | PASS | Present: desk Fit (0) still refits the stage | {"present":true,"before":"translate(-75.3806px, 163.608px) scale(0.833823)","transform":"translate(7.60642px, 187.578px) scale(0.747091)","exportOpen":false,"keysOpen":false} |
| P6o | PASS | Present: desk E still toggles Ego | {"present":true,"ego":true,"exportOpen":false,"keysOpen":false} |
| P6p | PASS | Present: desk P still starts path Play | {"present":true,"exportOpen":false,"keysOpen":false,"playOn":false,"toast":"Walking start → features → end","chipWalk":1,"cardWalk":1,"chipId":"b-integration","cardId":"b-integration","before":{"chipId":"b-render","cardId":"b-render","chipWalk":1,"cardWalk":1,"playOn":false},"moved":true,"ok":true} |
| P6q | PASS | Present: desk [ ] still steps path | {"present":true,"exportOpen":false,"keysOpen":false,"chipWalk":1,"cardWalk":1,"chipId":"b-lod","cardId":"b-lod","before":{"chipId":"b-integration","cardId":"b-integration","chipWalk":1,"cardWalk":1},"moved":true,"ok":true} |
| P6r | PASS | Present: desk R still opens PATH | {"present":true,"route":true,"exportOpen":false,"keysOpen":false} |
| P6s | PASS | Present: desk L still opens LENS | {"present":true,"lens":true,"exportOpen":false,"keysOpen":false} |
| P6t | PASS | Present: desk F still exits the stage | {"present":false,"barShown":true,"aria":"false","exportOpen":false,"keysOpen":false} |
| P6d | PASS | Present + Export: desk S still cycles Style | {"present":true,"exportOpen":true,"before":"classic","preset":"signal-flow"} |
| P6e | PASS | Present + Export: desk D still toggles Day/Night | {"present":true,"exportOpen":true,"before":false,"night":true} |
| P6f | PASS | Present + Export: desk zoom (+/=) still scales the stage | {"present":true,"exportOpen":true,"before":"translate(18px, 176.554px) scale(0.721397)","transform":"translate(-75.3806px, 161.305px) scale(0.831388)"} |
| P6j | PASS | Present + Export: desk Fit (0) still refits the stage | {"present":true,"exportOpen":true,"before":"translate(-75.3806px, 161.305px) scale(0.831388)","transform":"translate(7.60642px, 187.322px) scale(0.74682)"} |
| P6g | PASS | Present + Keys: desk S still cycles Style | {"present":true,"keysOpen":true,"before":"signal-flow","preset":"blueprint"} |
| P6h | PASS | Present + Keys: desk D still toggles Day/Night | {"present":true,"keysOpen":true,"before":false,"night":true} |
| P6i | PASS | Present + Keys: desk zoom (+/=) still scales the stage | {"present":true,"keysOpen":true,"before":"translate(11.9967px, 188.698px) scale(0.742347)","transform":"translate(-76.9027px, 164.384px) scale(0.8367)"} |
| P6k | PASS | Present + Keys: desk Fit (0) still refits the stage | {"present":true,"keysOpen":true,"before":"translate(-76.9027px, 164.384px) scale(0.8367)","transform":"translate(4.10131px, 186.744px) scale(0.750943)"} |
| P7 | PASS | Escape exits Presentation Stage and restores the desk | {"present":false,"barShown":true,"aria":"false"} |
| P8 | PASS | Present / preset step did not write .graphide/stamps/ | absent |
| M2c | PASS | Slice canvas mounts XYFlow Steiner nodes (capped, not the raw IR) | xy=29 |
| M2d | PASS | Slice XYFlow nodes expose data-shape | n=29 shapes=start,fn,endpoint,end,store |
| E1 | PASS | Evidence pane is open and labeled | Evidence ScreenshotFormat · src/main.rs:2 |
| E2 | PASS | Evidence clips (overflow hidden, max-width ≤ 380px) | overflow=hidden hidden hidden max-width=380 width=221 |
| E3 | PASS | Evidence does not overlap the object rail | {"overlap":false,"src":{"left":1219,"right":1440,"width":221},"rail":{"left":1019,"right":1219,"width":200,"hidden":false}} |
| E4 | PASS | Evidence has inspect content | 1// solarsim::ScreenshotFormat2fn hop_0() { /* evidence */ } |
| shot:evidence.png | PASS | screenshot evidence.png is not a black frame | luma=0.966 1440x900 bytes=156538 |
| CM1 | PASS | Explorer snap has coverage.uncovered or coverage.changed | unc=1123 changed=1123 1 left1 stamped1 skipped1 brokenCoverage 1123 changed · 1123 uncovered · Review 1 stamped · 1 skipped · 1 broken · 1 pending · e.g. ScreenshotFormat, ext, as_st |
| CM2 | PASS | #inspMeta mark is uncovered or changed (not only —) | mark=uncovered kindTyperole—channel—spansrc/main.rs:2sliceon treecommunityrenderfilesrc/main.rsprogrambin maindegree7markuncovered |
| shot:coverage-mark.png | PASS | screenshot coverage-mark.png is not a black frame | luma=0.967 1440x900 bytes=154246 |
| CM3 | PASS | Coverage-mark step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| HC0 | PASS | Evidence #inspEdges lists incident hop hits when the node has edges | {"paneOpen":true,"kicker":"Evidence","hits":7,"svgHits":0,"title":"ScreenshotFormat · src/main.rs:2","via":"already"} |
| HC1 | PASS | #hopCard unhides and names both ends | {"via":"inspEdges","ends":[{"id":"n0","text":"ScreenshotFormat · 0000"},{"id":"n1","text":"ext · 0001"}],"hop":"Hop · CallsScreenshotFormat · 0000→ext · 0001solarsim::ScreenshotFormatsolarsim::ext"} |
| HC2 | PASS | Hop-card end inspects that node (#srcTitle / #srcBody change) | {"clicked":"n0","currentId":"n1","title0":"ext · simulation/ext.rs:2","title1":"ScreenshotFormat · src/main.rs:2","body0":"1// solarsim::ext2fn hop_1() { /* evidence */ }","body1":"1// solarsim::ScreenshotFormat2fn hop_0() { /* evidence */ }","changed":true,"hopStill":true} |
| shot:hop-card.png | PASS | screenshot hop-card.png is not a black frame | luma=0.966 1440x900 bytes=160936 |
| HC3 | PASS | #srcClose hides Evidence and #hopCard | {"paneHidden":true,"hopHidden":true} |
| HC4 | PASS | Hop-card step did not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| HC5 | PASS | Map altitude is still community LOD after hop card (xy=0) | {"cards":12,"xy":0,"ws":"map","stampPosts":0,"skipPosts":0} |
| HC6 | PASS | Hop-card step did not write .graphide/stamps/ | absent |
| S1 | PASS | Stamp/Skip are enabled on a flow |  |
| S2 | PASS | Stamp/Skip post host messages only (no disk stamp) | [{"type":"stamp","flow":"control-flow"},{"type":"skip","flow":"control-flow"}] |
| S3 | PASS | Harness did not write .graphide/stamps/ | absent |
| H3 | PASS | Editor button posts enterNode to the host stub | [{"type":"enterNode","flow":"control-flow","id":"n0","isLeaf":true}] |
| shot:stamp-host.png | PASS | screenshot stamp-host.png is not a black frame | luma=0.965 1440x900 bytes=159931 |
| RT8c | PASS | Slice Route dims an off-route off-program walk node below the on-route ones | {"lit":8,"away":8,"on":2,"off":6,"onMin":0.38,"offMax":0.22} |
| shot:slice-away-route.png | PASS | screenshot slice-away-route.png is not a black frame | luma=0.935 1440x900 bytes=124281 |
| LN6b | PASS | Slice Lens dims an off-program non-match below the off-program matches | {"lit":8,"away":8,"on":7,"off":1,"onMin":0.38,"offMax":0.28} |
| SG6 | PASS | Slice Find hit on an off-program walk stays lit; Find misses stay below the away floor | {"away":8,"lit":8,"hits":1,"misses":7,"hitMin":1,"missMax":0.18} |
| RT8d | PASS | Slice Route dims off-route nodes inside the Ego neighborhood | {"ego":6,"on":2,"off":4,"onMin":1,"offMax":0.22} |
| shot:slice-ego-route.png | PASS | screenshot slice-ego-route.png is not a black frame | luma=0.940 1440x900 bytes=154876 |
| LN6c | PASS | Slice Lens dims non-matches inside the Ego neighborhood | {"ego":6,"on":5,"off":1,"onMin":1,"offMax":0.28} |
| RT8e | PASS | Enter Route dims off-route nodes inside the Ego neighborhood | {"ego":2,"on":1,"off":1,"onMin":1,"offMax":0.22} |
| LN6d | PASS | Enter Lens dims non-matches inside the Ego neighborhood | {"ego":2,"on":1,"off":1,"onMin":1,"offMax":0.28} |
| SG5b | PASS | Enter Find hit outside Ego stays lit; Ego misses stay Find-dim | {"q":"SimulationScale_1464","hitOutside":1,"hitOutsideMin":1,"missInside":2,"missInsideMax":0.18,"missOutside":21,"missOutsideMax":0.12} |
| R1 | PASS | self-review desk loaded the derived snapshot (not synthetic fallback) | 3168 nodes · 19628 edges · 71 files · 147665ms · javascript@0.1.0,python@0.1.0,rust@0.1.0,typescript@0.1.0 |
| R2 | PASS | self-review desk mode is on after live snap | {"desk":true,"bright":true,"status":"3168 nodes · 19628 edges · 71 files · 147665ms · javascript@0.1.0,python@0.1.0,r"} |
| R3 | PASS | self-review chrome shows this checkout's graph counts | 3168 nodes · 19628 edges · 71 files · 147665ms · javascript@0.1.0,python@0.1.0,rust@0.1.0,typescript@0.1.0 |
| R3b | PASS | self-review lands on Overview when a default run exists | overview |
| R4 | PASS | self-review Map workspace is active | map |
| R5 | PASS | self-review Map shows communities on this repo, not a lone START | cards=24 start=1 comm=0 names=new,c,idVal,resolveWebviewView,main,sticky_match,derive_repo,extract |
| R5b | PASS | self-review Map stays community LOD (no XYFlow / 1650 React nodes) | xy=0 cards=24 |
| R5c | PASS | self-review Map caption and graph-bar do not overlap cards / Ego | {"wsEgo":false,"wsLegend":false,"chipHits":0,"cardHits":0,"titleHitsCard":false,"titleInsideViewport":false,"visible":24,"cards":24,"chips":13} |
| R6 | PASS | self-review program chips name a Graphide crate | bin graphide-clilib demolib demo-parentlib extensionlib graphide-enginelib graphide-irlib graphide-pluginlib graphide-pl |
| shot:self-review.png | PASS | screenshot self-review.png is not a black frame | luma=0.928 1440x900 bytes=159757 |
| R7 | PASS | Self-review step did not write .graphide/stamps/ | absent |
| PC1 | PASS | self-review has two or more Graphide program chips | bin graphide-cli,lib demo,lib demo-parent,lib extension,lib graphide-engine,lib graphide-ir,lib graphide-plugin,lib graphide-plugin-rust |
| PC2 | PASS | second program chip switches the Map / Review cut (caption + program key) | first=bin graphide-cli second=lib demo meta=Review / map · demo · communities only — click a bubble, then a flow tab |
| PC3 | PASS | program chip switch keeps Map community LOD | {"ws":"map","xy":0,"comm":0,"cards":24} |
| shot:program-chips.png | PASS | screenshot program-chips.png is not a black frame | luma=0.928 1440x900 bytes=160063 |
| PC4 | PASS | program chip switch does not post stamp / skip | {"stampPosts":0,"skipPosts":0} |
| PC5 | PASS | program chip switch did not write .graphide/stamps/ | absent |
| AP1 | PASS | self-review has All programs chip when more than one program exists | programs=bin graphide-cli,lib demo,lib demo-parent,lib extension,lib graphide-engine,lib graphide-ir,lib graphide-plugin,lib graphide-plugin-rust all=true |
| AP2 | PASS | All programs chip switches the Map / Review cut to the union view | narrow=bin graphide-cli all=All programs cards=24→24 meta=Review / map · all · communities only — click a bubble, then a flow tab |
| AP3 | PASS | single program chip restores the narrow cut after All programs | back=bin graphide-cli meta=Review / map · graphide-cli · communities only — click a bubble, then a flow tab |
| AP4 | PASS | All programs keeps Map community LOD | {"ws":"map","xy":0,"comm":0,"cards":24} |
| shot:all-programs.png | PASS | screenshot all-programs.png is not a black frame | luma=0.928 1440x900 bytes=159761 |
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
| shot:delta.png | PASS | screenshot delta.png is not a black frame | luma=0.961 1440x900 bytes=119588 |
| D8 | PASS | Delta step did not write .graphide/stamps/ | absent |
| SC0 | PASS | delta snap has a sticky coarse BubbleId after sticky_match | kind=stable bubble=1 label=crate::sub::decode |
| SC1 | PASS | Delta paints a community fact with the sticky BubbleId | {"community":5,"sticky":4,"kinds":["stable","stable","stable","relabel","added"],"bubbles":["1","3","4","2"],"text":"= stablecommunity · bubble 1 · crate::sub::decodekept bubble 1","id":"1"} |
| SC2 | PASS | Sticky cluster fact names the kept bubble id | = stablecommunity · bubble 1 · crate::sub::decodekept bubble 1 |
| shot:sticky-clusters.png | PASS | screenshot sticky-clusters.png is not a black frame | luma=0.962 1440x900 bytes=110611 |
| SV0 | PASS | delta snap ships parent_bubbles for a sticky coarse BubbleId | kind=stable bubble=1 parent_bubbles=4 |
| SV1 | PASS | Community fact paints Delta members for the sticky BubbleId | {"view":"delta","ws":"delta","n":4,"current":4,"xy":4,"fact":"1"} |
| SV2 | PASS | Before paints parent members for the same sticky BubbleId | {"view":"before","ws":"delta","n":4,"current":4,"xy":4,"fact":"1"} |
| SV3 | PASS | After paints head members for the same sticky BubbleId | {"view":"after","ws":"delta","n":4,"current":4,"xy":4,"fact":"1"} |
| shot:delta-sticky-views.png | PASS | screenshot delta-sticky-views.png is not a black frame | luma=0.962 1440x900 bytes=110582 |
| SV4 | PASS | Delta sticky views do not post stamp / skip | {"stamp":0,"skip":0} |
| SV5 | PASS | Delta sticky views did not write .graphide/stamps/ | absent |
| SG10 | PASS | Find on a member file keeps Delta fact with data-file | {"before":6,"q":"bus.rs","facts":1,"empty":false,"sneaky":1,"sneakyFiles":["src/bus.rs"],"kinds":["added"]} |
| shot:delta-find-file.png | PASS | screenshot delta-find-file.png is not a black frame | luma=0.960 1440x900 bytes=92279 |
| SG10b | PASS | Find on a non-matching member file drops Delta sneaky fact | {"before":6,"facts":0,"sneaky":false,"empty":true} |
| SC3 | PASS | Map card keeps the sticky BubbleId at community LOD | {"ws":"map","card":true,"cluster":"stable","xy":0} |
| SC4 | PASS | Sticky clusters do not post stamp / skip | {"stamp":0,"skip":0} |
| SC5 | PASS | Sticky clusters did not write .graphide/stamps/ | absent |
| PU0 | PASS | delta fixture snap has proposed-uncovered Steiner from the parent cut | hits=crate::bus::sneaky_helper tree=1n leftover=0 |
| PU1 | PASS | Delta desk shows proposed-uncovered chip distinct from sidecar flows | {"tabs":[{"name":"data-subscription","proposed":false,"on":true,"text":"data-subscription"},{"name":"proposed-uncovered","proposed":true,"on":false,"text":"proposed-uncovered"}],"text":"proposed-uncovered"} |
| PU2 | PASS | Selecting proposed-uncovered pins Slice and lights the chip | {"ws":"slice","flow":"proposed-uncovered","meta":"Map / proposed-uncovered · 1 on tree"} |
| PU3 | PASS | Selecting proposed-uncovered changes the Steiner cut | {"from":"data-subscription","to":"proposed-uncovered","helper":true,"n":2,"namedN":10} |
| PU4 | PASS | Proposed flow paints a Steiner slice (not an empty chip) | n=2 xy=1 helper=true |
| shot:proposed-uncovered.png | PASS | screenshot proposed-uncovered.png is not a black frame | luma=0.933 1440x900 bytes=88919 |
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
| shot:sequence.png | PASS | screenshot sequence.png is not a black frame | luma=0.959 1440x900 bytes=113814 |
| SG8 | PASS | Find on a member file filters Sequence hops / dims off-query participants | {"before":1,"q":"sub.rs","hops":1,"hits":1,"dims":1,"hitFiles":["src/sub.rs"],"dimFiles":["src/bus.rs"],"hitMin":1,"dimMax":0.18} |
| shot:sequence-find-file.png | PASS | screenshot sequence-find-file.png is not a black frame | luma=0.959 1440x900 bytes=112425 |
| SG8b | PASS | Find on a non-matching member file drops Sequence hops | {"before":1,"hops":0,"empty":true} |
| Q8 | PASS | Sequence step did not write .graphide/stamps/ | absent |
| F0 | PASS | dataflow fixture snap has a flow with Source and Sink hops | data-subscription:3n/2h/source+store+sink |
| F0b | PASS | dataflow fixture includes subscribe / events (data-subscription) | data-subscription kinds=Publishes,Subscribes |
| F0c | PASS | data-subscription hops run publish → events → subscribe | Publishes crate::bus::Bus::publish → crate::bus::events \| Subscribes crate::bus::events → crate::sub::subscribe |
| FH0 | PASS | dataflow fixture snap has named flow data-subscription with a Steiner tree | hits=crate::sub::subscribe,crate::bus::events tree=2n/1e |
| F1 | PASS | dataflow desk loaded the fixtures/demo snap | dataflow |
| F2 | PASS | Data-flow workspace is active | dataflow |
| F3 | PASS | Data-flow path has a Source and a Sink | roles=source,store,sink publish \| DBeventsSink · Channel \| subscribe |
| F4 | PASS | Data-flow has an ordered hop list | hops=2 kinds=Publishes,Subscribes |
| F4b | PASS | Data-flow Play list starts at the source (publish → events → subscribe) | kinds=Publishes,Subscribes hops=publish → events \| events → subscribe |
| F5 | PASS | Data-flow lists subscribe / publish / events on the demo slice | publish \| DBeventsSink · Channel \| subscribe \| Publishespublish → eventscrate::bus::Bus::publish · src/bus.rs |
| F6 | PASS | Data-flow has Play / Prev / Next plus canvas | {"play":true,"canvas":true} |
| F6b | PASS | Data-flow canvas mounts XYFlow nodes (capped, not the raw IR) | xy=3 nodes=3 |
| F6c | PASS | Data-flow XYFlow nodes expose data-shape and a store cylinder | n=3 shapes=start,store,end |
| shot:dataflow-order.png | PASS | screenshot dataflow-order.png is not a black frame | luma=0.957 1440x900 bytes=97866 |
| FH1 | PASS | Data-flow desk shows flow chip data-subscription | {"ws":"dataflow","text":"data-subscription","tabs":[{"name":"data-subscription","on":true,"text":"data-subscription"}]} |
| FH2 | PASS | Named flow chip is the current selection | data-subscription |
| FH3 | PASS | Named flow is backed by a derived Steiner pipeline (not an empty chip) | desk=3n/2h xy=3 tree=2n/1e |
| shot:flow-hints.png | PASS | screenshot flow-hints.png is not a black frame | luma=0.957 1440x900 bytes=97862 |
| FH4 | PASS | Flow-hints step did not post stamp / skip | {"stampPosts":0,"skipPosts":0,"ws":"dataflow"} |
| FH5 | PASS | Flow-hints step did not write .graphide/stamps/ | absent |
| F7 | PASS | Data-flow Play walk is finite (stays on last hop, does not loop) | {"i":"1","n":2,"playing":false} |
| shot:dataflow.png | PASS | screenshot dataflow.png is not a black frame | luma=0.956 1440x900 bytes=129916 |
| SG7 | PASS | Find on a member file filters Data-flow hops / dims off-query nodes | {"before":2,"q":"sub.rs","hops":1,"hits":1,"dims":2,"hitFiles":["src/sub.rs"],"dimFiles":["src/bus.rs","src/bus.rs"],"hitMin":1,"dimMax":0.18} |
| shot:dataflow-find-file.png | PASS | screenshot dataflow-find-file.png is not a black frame | luma=0.957 1440x900 bytes=122580 |
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
| L6d | PASS | Lifecycle recover back-edge does not cut through Waiting | hits=0 d=M1155 82L 1175,82Q 1175,82 1175,82L 1175,240Q 1175,240 1175,240L 241,240Q 241,240 241,240L 241,82Q 241,82 241,82L261 82 |
| shot:lifecycle-recover.png | PASS | screenshot lifecycle-recover.png is not a black frame | luma=0.952 1440x900 bytes=123350 |
| L7 | PASS | Lifecycle Play walk is finite (stays on last event, does not loop) | {"i":"5","n":6,"playing":false} |
| shot:lifecycle.png | PASS | screenshot lifecycle.png is not a black frame | luma=0.951 1440x900 bytes=123441 |
| SG9 | PASS | Find on a member file keeps Lifecycle end .hit / dims off-query states | {"before":1,"q":"bus.rs","ends":1,"empty":false,"hits":1,"dims":6,"hitFiles":["src/bus.rs"],"hitMin":1,"dimMax":0.18} |
| shot:lifecycle-find-file.png | PASS | screenshot lifecycle-find-file.png is not a black frame | luma=0.953 1440x900 bytes=121509 |
| SG9b | PASS | Find on a non-matching member file empties Lifecycle | {"before":1,"ends":0,"empty":true} |
| L8 | PASS | Lifecycle step did not write .graphide/stamps/ | absent |
| Y1 | PASS | lineage desk loaded the fixtures/demo snap | lineage |
| Y2 | PASS | Lineage workspace is active | lineage |
| Y3 | PASS | Lineage focus node is present | crate::sub::decode |
| Y4 | PASS | Lineage XYFlow nodes > 1 on a Calls fixture (capped, not the raw IR) | xy=3 hops=2 |
| Y4b | PASS | Lineage XYFlow nodes expose data-shape | n=3 shapes=fn |
| Y5 | PASS | Lineage has upstream and downstream when the fixture has both | up=1 down=1 via=down fqn=crate::sub::decode |
| EG5 | PASS | Lineage Ego stays on; 2-hop walk is at least as wide as 1-hop | 1-hop={"on":true,"hops":"1","xy":3,"ego":3,"focus":1} 2-hop={"hops":"2","xy":3,"ego":3} seed={"on":true,"hops":"1"} |
| SG3 | PASS | Find filters Lineage hops / nodes | {"q":"decode","before":2,"hops":2,"dim":2,"hit":1,"nodes":3} |
| SG5c | PASS | Lineage Find hits stay lit; Ego misses stay Find-dim | {"ego":3,"hits":1,"hitMin":1,"missInside":2,"missInsideMax":0.18} |
| SG5d | PASS | Lineage ego-dim Find miss sits at the 0.12 floor (not Find-dim 0.18) | {"ok":true,"op":0.12} |
| Y6 | PASS | Type/Endpoint lineage shows Reads/Writes/Publishes/Subscribes, not Contains | fqn=crate::bus::events kind=Endpoint kinds=Publishes,Subscribes |
| SG3b | PASS | Find on a member file filters Lineage hops / dims off-query nodes | {"before":2,"q":"sub.rs","hops":1,"hits":1,"dims":2,"hitFiles":["src/sub.rs"],"dimFiles":["src/bus.rs","src/bus.rs"],"hitMin":1,"dimMax":0.18} |
| shot:lineage-find-file.png | PASS | screenshot lineage-find-file.png is not a black frame | luma=0.946 1440x900 bytes=117557 |
| Y7 | PASS | Evidence still opens from a Lineage node click | Evidence publish · src/bus.rs:4 |
| Y8 | PASS | Map stays community LOD after Lineage (xy=0, cap 24) | xy=0 cards=5 |
| shot:lineage.png | PASS | screenshot lineage.png is not a black frame | luma=0.945 1440x900 bytes=112381 |
| Y9 | PASS | Lineage step did not write .graphide/stamps/ | absent |
| Y10 | PASS | When coverage.changed is present, a changed node is marked | marked=1 fqn=crate::bus::sneaky_helper |
| K19g | PASS | Opening Route hides the hover tip (no tip under chrome) | {"tipHidden":true,"routeOpen":true} |
| K20g | PASS | Opening Route clears the toast (no toast under chrome) | {"toastGone":true,"routeOpen":true,"routeOk":true} |
| RT1 | PASS | Route probe opened from R | {"open":true,"btn":true} |
| RT2 | PASS | Route is a derived directed path with at least one hop | hops=1 nodes=2 kinds=Subscribes |
| RT3 | PASS | Route includes subscribe / events (Subscribes) | 1 hops · subscribe → events \| Subscribes subscribe → events |
| RT4 | PASS | Route lights only path nodes (no extra hops) | extra=0 extraLit=0 |
| RT5 | PASS | Route has Play / Next |  |
| RT6 | PASS | Route journey is finite (stays on last hop, does not loop) | {"i":0,"n":1,"playing":false} |
| shot:route.png | PASS | screenshot route.png is not a black frame | luma=0.957 1440x900 bytes=120865 |
| RT7 | PASS | Route step did not write .graphide/stamps/ | absent |
| K19f | PASS | Opening Lens hides the hover tip (no tip under chrome) | {"tipHidden":true,"lensOpen":true} |
| K20f | PASS | Opening Lens clears the toast (no toast under chrome) | {"toastGone":true,"lensOpen":true} |
| LN1 | PASS | Lens opened from L | {"open":true,"btn":true} |
| LN2 | PASS | Lens compares Function and Endpoint | roles=Function,Endpoint compare=Function · Endpoint |
| LN3 | PASS | Lens highlights matching nodes | hits=4 lit=4 |
| LN4 | PASS | Lens does not invent a third kind | Function,Endpoint,Function,Endpoint |
| shot:lens.png | PASS | screenshot lens.png is not a black frame | luma=0.956 1440x900 bytes=116630 |
| LN5 | PASS | Lens step did not write .graphide/stamps/ | absent |
| PY0 | PASS | python fixture snap is python@ with a real graph | plugin=python@0.1.0 nodes=10 edges=11 files=2 py=10 |
| PY0b | PASS | python fixture snap has named flow data-subscription with a Steiner tree | hits=pkg.sub.subscribe,pkg.bus.events tree=2n/1e |
| PY0c | PASS | python fixture snap has a flow with Source and Sink hops | data-subscription:3n/2h/source+store+sink |
| PY1 | PASS | python desk loaded the fixtures/python snap | dataflow python@0.1.0 |
| PY2 | PASS | Python Data-flow workspace is active | dataflow |
| PY3 | PASS | Python Data-flow paints Source and Sink (not a raw IR dump) | roles=source,store,sink Publishespublish → eventspkg.bus.Bus.publish · pkg/bus.py \| Subscribesevents → subscribepkg.bus.events · pkg/sub.py \| publish |
| PY4 | PASS | Python Data-flow names subscribe / publish / events | Publishespublish → eventspkg.bus.Bus.publish · pkg/bus.py \| Subscribesevents → subscribepkg.bus.events · pkg/sub.py \| publish \| DBeventsSink · Channel \| subscribe |
| PY5 | PASS | Python Data-flow XYFlow nodes expose data-shape | xy=3 shapes=start,store,end |
| shot:python-desk.png | PASS | screenshot python-desk.png is not a black frame | luma=0.957 1440x900 bytes=98489 |
| PY6 | PASS | Python Map is community LOD (cards, xy=0, not a lone START) | cards=5 xy=0 names=decode,events,encode,BroadcastChannel,publish |
| PY7 | PASS | Python desk step did not write .graphide/stamps/ | absent |
| JS0 | PASS | javascript fixture snap is javascript@ with a real graph | plugin=javascript@0.1.0 nodes=9 edges=9 files=2 js=9 |
| JS0b | PASS | javascript fixture snap has named flow data-subscription with a Steiner tree | hits=pkg.sub.subscribe,pkg.bus.events tree=2n/1e |
| JS0c | PASS | javascript fixture snap has a flow with Source and Sink hops | data-subscription:3n/2h/source+store+sink |
| JS1 | PASS | javascript desk loaded the fixtures/js snap | dataflow javascript@0.1.0 |
| JS2 | PASS | JavaScript Data-flow workspace is active | dataflow |
| JS3 | PASS | JavaScript Data-flow paints Source and Sink (not a raw IR dump) | roles=source,store,sink Publishespublish → eventspkg.bus.Bus.publish · pkg/bus.js \| Subscribesevents → subscribepkg.bus.events · pkg/sub.js \| publish |
| JS4 | PASS | JavaScript Data-flow names subscribe / publish / events | Publishespublish → eventspkg.bus.Bus.publish · pkg/bus.js \| Subscribesevents → subscribepkg.bus.events · pkg/sub.js \| publish \| DBeventsSink · Channel \| subscribe |
| JS5 | PASS | JavaScript Data-flow XYFlow nodes expose data-shape | xy=3 shapes=start,store,end |
| shot:js-desk.png | PASS | screenshot js-desk.png is not a black frame | luma=0.957 1440x900 bytes=98383 |
| JS6 | PASS | JavaScript Map is community LOD (cards, xy=0, not a lone START) | cards=5 xy=0 names=decode,events,flush,BroadcastChannel,Bus |
| JS7 | PASS | JavaScript desk step did not write .graphide/stamps/ | absent |
| TS0 | PASS | typescript fixture snap is typescript@ with a real graph | plugin=typescript@0.1.0 nodes=9 edges=12 files=2 ts=9 |
| TS0b | PASS | typescript fixture snap has named flow data-subscription with a Steiner tree | hits=pkg.sub.subscribe,pkg.bus.events tree=2n/1e |
| TS0c | PASS | typescript fixture snap has a flow with Source and Sink hops | data-subscription:3n/2h/source+store+sink |
| TS1 | PASS | typescript desk loaded the fixtures/ts snap | dataflow typescript@0.1.0 |
| TS2 | PASS | TypeScript Data-flow workspace is active | dataflow |
| TS3 | PASS | TypeScript Data-flow paints Source and Sink (not a raw IR dump) | roles=source,store,sink Publishespublish → eventspkg.bus.Bus.publish · pkg/bus.ts \| Subscribesevents → subscribepkg.bus.events · pkg/sub.ts \| publish |
| TS4 | PASS | TypeScript Data-flow names subscribe / publish / events | Publishespublish → eventspkg.bus.Bus.publish · pkg/bus.ts \| Subscribesevents → subscribepkg.bus.events · pkg/sub.ts \| publish \| DBeventsSink · Channel \| subscribe |
| TS5 | PASS | TypeScript Data-flow XYFlow nodes expose data-shape | xy=3 shapes=start,store,end |
| shot:ts-desk.png | PASS | screenshot ts-desk.png is not a black frame | luma=0.957 1440x900 bytes=98377 |
| TS6 | PASS | TypeScript Map is community LOD (cards, xy=0, not a lone START) | cards=3 xy=0 names=decode,events,publish |
| TS7 | PASS | TypeScript desk step did not write .graphide/stamps/ | absent |
| DL1 | PASS | Deep-link harness lands Trace with traj=sub-verify and both fixtures loaded | {"ws":"trace","focus":"sub-verify","hop":true,"trajParam":"sub-verify","gateParam":"approved","traceFlag":"1","passportFlag":"1","hasTrajFx":true,"hasPassFx":true,"gateSeed":"approved"} |
| DL2 | PASS | Deep-link seeds passport gate=approved from URL before hop | gateParam=approved seed=approved |
| shot:trajectory-deeplink.png | PASS | screenshot trajectory-deeplink.png is not a black frame | luma=0.921 1440x900 bytes=207473 |
| DL3 | PASS | Hop Trace→Passport keeps gate=approved and traj in URL (no live Delta) | {"ws":"passport","gateState":"approved","blocked":0,"hop":true,"trajParam":"sub-verify","gateParam":"approved","wsParam":"passport","liveDelta":false} |
| shot:passport-deeplink.png | PASS | screenshot passport-deeplink.png is not a black frame | luma=0.925 1440x900 bytes=169714 |
| DL4 | PASS | Hop Passport→Trace restores traj focus sub-verify with gate still in URL | {"ws":"trace","focus":"sub-verify","trajParam":"sub-verify","gateParam":"approved","wsParam":"trace"} |
| DL5 | PASS | Deep-link hop did not write .graphide/stamps/ | absent |
| DR1 | PASS | Passport row hop Open-in-Trace focuses Trace sub-verify and preserves gate | {"ws":"trace","focus":"sub-verify","trajParam":"sub-verify","gateParam":"approved","focusWin":"sub-verify","stripHop":true} |
| shot:passport-trace-deeplink.png | PASS | screenshot passport-trace-deeplink.png is not a black frame | luma=0.933 1440x900 bytes=200769 |
| DR1-shot | PASS | screenshot passport-trace-deeplink.png is not a black frame | luma=0.933 1440x900 bytes=200769 |
| DR2 | PASS | Passport row hop Open-in-Trace focuses Trace sub-edit; gate stays approved | {"ws":"trace","focus":"sub-edit","trajParam":"sub-edit","gateParam":"approved"} |
| DR3 | PASS | Empty Passport emits no data-ade-traj-hop; strip Open Trace remains | {"empty":true,"rowHops":0,"stripHop":true} |
| DR4 | PASS | Passport→Trace reverse deeplink did not write .graphide/stamps/ | absent |
| TH1 | PASS | Trace focus sub-verify highlights matching Passport rows; gate preserved | {"ws":"passport","trajParam":"sub-verify","gateParam":"approved","activeCount":3,"verifyRows":3,"verifyActive":3,"otherActive":0,"focusWin":"sub-verify"} |
| shot:trace-passport-row-highlight.png | PASS | screenshot trace-passport-row-highlight.png is not a black frame | luma=0.931 1440x900 bytes=163406 |
| TH1-shot | PASS | screenshot trace-passport-row-highlight.png is not a black frame | luma=0.931 1440x900 bytes=163406 |
| TH2 | PASS | Trace focus move to sub-edit moves Passport highlight; gate stays approved | {"ws":"passport","trajParam":"sub-edit","gateParam":"approved","editActive":6,"verifyActive":0,"activeCount":6} |
| TH3 | PASS | Passport with no traj focus emits zero data-ade-traj-active | {"ws":"passport","trajParam":"","activeCount":0,"mappedRows":21,"empty":false} |
| TH4 | PASS | Trace→Passport row highlight did not write .graphide/stamps/ | absent |
| DF1 | PASS | Click Trace detail dep-list chip focuses matching DAG node | {"before":{"focus":"sub-diff","selected":"sub-diff","deps":["sub-edit","sub-fixture"],"clickable":true},"after":{"focus":"sub-edit","selected":"sub-edit","trajParam":"sub-edit","pinFocus":"","onPath":3,"dimNodes":4,"legendOn":1,"legendDim":2,"winFocus":"sub-edit"},"firstDep":"sub-edit"} |
| DF2 | PASS | Second dep click moves focus; on-path edges + legend dim stay in sync | {"firstDep":"sub-edit","secondDep":"sub-fixture","df2click":{"ok":true,"focus":"sub-fixture","selected":"sub-fixture","trajParam":"sub-fixture","onCount":1,"winFocus":"sub-fixture"},"df2":{"focus":"sub-fixture","selected":"sub-fixture","trajParam":"sub-fixture","onCount":1,"onPath":3,"dimNodes":4,"legendOn":3,"legendDim":0,"winFocus":"sub-fixture"}} |
| shot:trajectory-dep-list-focus.png | PASS | screenshot trajectory-dep-list-focus.png is not a black frame | luma=0.920 1440x900 bytes=209834 |
| DF3 | PASS | screenshot trajectory-dep-list-focus.png is not a black frame | luma=0.920 1440x900 bytes=209834 |
| DF4 | PASS | Trace dep-list focus did not write .graphide/stamps/ | absent |
| CX1 | PASS | Passport contract Open-in-Trace focuses mapped Trace traj; gate preserved | {"cx1click":{"traj":"sub-passport","id":"c1"},"cx1":{"ws":"trace","focus":"sub-passport","trajParam":"sub-passport","gateParam":"approved","focusWin":"sub-passport","contractMapped":0,"riskMapped":0}} |
| CX2 | PASS | Passport risk Open-in-Trace focuses a different Trace traj; optional rows stay unmapped | {"cx1click":{"traj":"sub-passport","id":"c1"},"cx2click":{"traj":"sub-edit","id":"r2","contractMapped":4,"riskMapped":4,"unmappedContract":true,"unmappedRisk":true},"cx2":{"ws":"trace","focus":"sub-edit","trajParam":"sub-edit","gateParam":"approved"}} |
| shot:passport-risk-traj-map.png | PASS | screenshot passport-risk-traj-map.png is not a black frame | luma=0.933 1440x900 bytes=201778 |
| CX2-shot | PASS | screenshot passport-risk-traj-map.png is not a black frame | luma=0.933 1440x900 bytes=201778 |
| CX3 | PASS | Empty Passport emits no contract/risk traj hops; strip Open Trace remains | {"empty":true,"rowHops":0,"contractMapped":0,"riskMapped":0,"stripHop":true} |
| CX4 | PASS | Passport contract/risk traj map did not write .graphide/stamps/ | absent |
| TM1 | PASS | Passport test-strategy Open-in-Trace focuses mapped Trace traj; gate preserved | {"tm1click":{"traj":"sub-passport","id":"p1","mapped":4,"unmapped":true},"tm1":{"ws":"trace","focus":"sub-passport","trajParam":"sub-passport","gateParam":"approved","focusWin":"sub-passport"}} |
| TM2 | PASS | Passport test-strategy Open-in-Trace focuses a different Trace traj; optional rows stay unmapped | {"tm1click":{"traj":"sub-passport","id":"p1","mapped":4,"unmapped":true},"tm2click":{"traj":"sub-verify","id":"p3","mapped":4,"unmapped":true},"tm2":{"ws":"trace","focus":"sub-verify","trajParam":"sub-verify","gateParam":"approved"}} |
| shot:passport-test-strategy-traj-map.png | PASS | screenshot passport-test-strategy-traj-map.png is not a black frame | luma=0.930 1440x900 bytes=202942 |
| TM2-shot | PASS | screenshot passport-test-strategy-traj-map.png is not a black frame | luma=0.930 1440x900 bytes=202942 |
| TM3 | PASS | Empty Passport emits no test-strategy traj hops; strip Open Trace remains | {"empty":true,"rowHops":0,"testMapped":0,"stripHop":true} |
| TM4 | PASS | Passport test-strategy traj map did not write .graphide/stamps/ | absent |
| HA1 | PASS | Click Trace next-hop chip focuses directed successor; on-path / legend dim sync | {"before":{"focus":"sub-verify","selected":"sub-verify","nodeNexts":["sub-passport","sub-pr"],"detailNexts":["sub-passport","sub-pr"],"nodeHopCount":2,"detailHopCount":2},"after":{"focus":"sub-passport","selected":"sub-passport","trajParam":"sub-passport","pinFocus":"","onPath":2,"dimNodes":5,"legendOn":2,"legendDim":1,"winFocus":"sub-passport"},"firstNext":"sub-passport"} |
| HA2 | PASS | Detail Next-hops list hops to the other directed successor | {"firstNext":"sub-passport","secondNext":"sub-pr","after":{"focus":"sub-pr","selected":"sub-pr","trajParam":"sub-pr","onPath":3,"winFocus":"sub-pr"}} |
| shot:trajectory-hop-affordance.png | PASS | screenshot trajectory-hop-affordance.png is not a black frame | luma=0.920 1440x900 bytes=208447 |
| HA3 | PASS | screenshot trajectory-hop-affordance.png is not a black frame | luma=0.920 1440x900 bytes=208447 |
| HA4 | PASS | Trace hop-affordance did not write .graphide/stamps/ | absent |

Artifacts: `overview.png`, `decisions.png`, `unmatched-hint.png`, `open-slice.png`, `registry.png`, `timeline.png`, `uncovered-node.png`, `draft-hint.png`, `trajectory-dag.png`, `trajectory-fixtures.png`, `trajectory-pin-hover.png`, `trajectory-pin-tip-chrome.png`, `trajectory-pin-residual.png`, `trajectory-edge-legend.png`, `trajectory-legend-focus-dim.png`, `trajectory-keyboard-step.png`, `trajectory-empty-state.png`, `seal-status-chip.png`, `passport-empty-state.png`, `trajectory-zoom-chrome.png`, `passport.png`, `passport-delta-vocab.png`, `passport-fixtures.png`, `passport-gate-signoff.png`, `passport-residual-chrome.png`, `passport-hop-residual-badge.png`, `passport-traj-adjacent-residual.png`, `trajectory-adj-residual-legend.png`, `passport-focus-residual-count.png`, `trajectory-legend-focus-residual.png`, `passport-clear-focus-cue.png`, `trajectory-legend-residual-filter.png`, `trajectory-residual-filter-key.png`, `passport-residual-filter-mirror.png`, `residual-filter-ws-leave.png`, `residual-filter-empty.png`, `trajectory-legend-clear-filter.png`, `passport-sticky-clear-filter.png`, `trajectory-legend-residual-filter-count.png`, `passport-residual-filter-count.png`, `keys-residual-filter.png`, `keys-residual-pressed.png`, `keys-ade-section.png`, `residual-filter-aria-live.png`, `passport-keys-residual-pressed.png`, `residual-filter-live-paint-refresh.png`, `residual-filter-clear-focus-visible.png`, `residual-filter-toggle-focus-visible.png`, `residual-filter-escape-clear.png`, `residual-filter-count-chip-focus.png`, `residual-filter-count-host-parity.png`, `residual-filter-host-on-cue-parity.png`, `residual-filter-clear-active-flash.png`, `residual-filter-count-chip-toast-hint.png`, `residual-filter-clear-confirm-toast.png`, `residual-filter-toggle-active-flash.png`, `residual-filter-clear-focus-return.png`, `residual-filter-count-active-flash.png`, `keys-r-active-flash.png`, `residual-filter-count-hover-cue.png`, `residual-filter-toggle-hover-cue.png`, `residual-filter-clear-hover-cue.png`, `residual-filter-empty-kbd-hints.png`, `trajectory-node-info.png`, `seal-chip-hover-cue.png`, `trajectory-zoom-focus-visible.png`, `passport-impact-rows.png`, `map-spine-hop.png`, `map.png`, `apple-chrome.png`, `apple-chrome-icons.png`, `fit-reorg.png`, `zoom.png`, `map-spine-recycle.png`, `canvas-recycle.png`, `delta-onanalysis.png`, `map-offview.png`, `panel-timeout.png`, `flow-tabs.png`, `slice-grey.png`, `slice-runs.png`, `slice-enter-recycle.png`, `stamp-recheck.png`, `progress.png`, `cancel-review.png`, `night.png`, `enter-distance.png`, `enter-route-dim.png`, `enter-bubble.png`, `ego.png`, `search.png`, `enter-find-member.png`, `enter-find-file.png`, `enter-child-type.png`, `enter-back-hop.png`, `enter-member-hop.png`, `ego-community.png`, `enter-back-stack.png`, `enter-sink-end.png`, `slice-from-enter.png`, `map-find-hit.png`, `map-find-member.png`, `map-find-file.png`, `map-route-cards.png`, `map-lens-cards.png`, `slice-select.png`, `slice-select-grey.png`, `slice-find-dim.png`, `slice-find-hit.png`, `slice-find-file.png`, `slice-route-dim.png`, `slice-lens-dim.png`, `slice-ego.png`, `kind-filters.png`, `ask.png`, `keys.png`, `path-walk.png`, `export-desk.png`, `export-desk.svg`, `export-share.png`, `preset-blueprint.png`, `present.png`, `evidence.png`, `coverage-mark.png`, `hop-card.png`, `stamp-host.png`, `slice-away-route.png`, `slice-ego-route.png`, `self-review.png`, `program-chips.png`, `all-programs.png`, `delta.png`, `sticky-clusters.png`, `delta-sticky-views.png`, `delta-find-file.png`, `proposed-uncovered.png`, `sequence.png`, `sequence-find-file.png`, `dataflow-order.png`, `flow-hints.png`, `dataflow.png`, `dataflow-find-file.png`, `lifecycle-recover.png`, `lifecycle.png`, `lifecycle-find-file.png`, `lineage-find-file.png`, `lineage.png`, `route.png`, `lens.png`, `python-desk.png`, `js-desk.png`, `ts-desk.png`, `trajectory-deeplink.png`, `passport-deeplink.png`, `passport-trace-deeplink.png`, `trace-passport-row-highlight.png`, `trajectory-dep-list-focus.png`, `passport-risk-traj-map.png`, `passport-test-strategy-traj-map.png`, `trajectory-hop-affordance.png`, `report.md`.

Stamp/skip clicks only prove `window.__vscodePosts`. They do not write `.graphide/stamps/`.
Self-review is `graphide review` of this checkout — not the synthetic explorer fixture.
