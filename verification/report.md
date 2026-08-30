# Graphide verification

Harness `/scripts/webview-harness.html?mode=explorer&probe=0` served from `extension/`.

**PASS** 17/17

| id | result | title | detail |
| --- | --- | --- | --- |
| H1 | PASS | harness stub acquireVsCodeApi is present |  |
| H2 | PASS | desk mode is on after synthetic programs | {"stub":true,"posts":0,"bright":true,"desk":true,"ws":"overview"} |
| shot:overview.png | PASS | screenshot overview.png is not a black frame | luma=0.960 1440x900 bytes=115367 |
| M1 | PASS | Map workspace is active | map |
| M2 | PASS | Map shows a community map, not a lone START card | cards=12 start=1 comm=0 names=render,integration,origin,lod,bodies,camera |
| M3 | PASS | Program chip seed includes bin main | bin main |
| shot:map.png | PASS | screenshot map.png is not a black frame | luma=0.960 1440x900 bytes=170274 |
| E1 | PASS | Evidence pane is open and labeled | Evidence ScreenshotFormat · src/main.rs:2 |
| E2 | PASS | Evidence clips (overflow hidden, max-width ≤ 380px) | overflow=hidden hidden hidden max-width=380 width=221 |
| E3 | PASS | Evidence does not overlap the object rail | {"overlap":false,"src":{"left":1219,"right":1440,"width":221},"rail":{"left":1019,"right":1219,"width":200,"hidden":false}} |
| E4 | PASS | Evidence has inspect content | 1// solarsim::ScreenshotFormat2fn hop_0() { /* evidence */ } |
| shot:evidence.png | PASS | screenshot evidence.png is not a black frame | luma=0.956 1440x900 bytes=174117 |
| S1 | PASS | Stamp/Skip are enabled on a flow |  |
| S2 | PASS | Stamp/Skip post host messages only (no disk stamp) | [{"type":"stamp","flow":"boot"},{"type":"skip","flow":"boot"}] |
| S3 | PASS | Harness did not write .graphide/stamps/ | absent |
| H3 | PASS | Editor button posts enterNode to the host stub | [{"type":"enterNode","flow":"boot","id":"n0","isLeaf":true}] |
| shot:stamp-host.png | PASS | screenshot stamp-host.png is not a black frame | luma=0.964 1440x900 bytes=168873 |

Artifacts: `overview.png`, `map.png`, `evidence.png`, `stamp-host.png`, `report.md`.

Stamp/skip clicks only prove `window.__vscodePosts`. They do not write `.graphide/stamps/`.
