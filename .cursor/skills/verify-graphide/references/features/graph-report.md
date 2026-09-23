# Graph report

On the Map workspace, before you enter a bubble, the object rail
`#ledgerPane` is a Graph Report (the Graphify `GRAPH_REPORT`
analogue). `desk.js` `renderBubbleMap` calls `graphReport` from the pure
module `graph/report.js` and hands the result to `renderLedger`. The rail
has three sections: God nodes, Surprising connections, and Suggested
questions. Every number is recomputable from the snapshot. It is not a
new pane, not a Map XYFlow rewrite, and not an agent stamp.

## Sub-features

- **Cut.** A node is in the cut when `graphFilter.program` is `null`
  (All programs), or when `assignProgram(span.file)` has the program's
  key. `programCut()` owns that predicate and `pickCommunityNodes` uses
  the same one. `#ledgerMeta` reads `{scope} · {nodes} nodes · {edges}
  edges`. Scope is `all` or the program name. Nodes is the in-cut node
  count. Edges counts snapshot edges whose two ends are both in the cut.
- **God nodes.** `#ledgerPane > .led-head` reads `God nodes`. Each
  `#ledgerGrid .cell.dag[data-id]` carries `.dag-n` (degree) and
  `title="{fqn} · in {in} · out {out}"`. Degree is the count of
  snapshot edges of any kind, Contains included, whose `from` or `to`
  is the node. A self-loop counts once. This is `incidentEdges(id).length`,
  the Evidence `#inspMeta` row `degree`. `in` counts edges with
  `to === id && from !== id`. `out` counts edges with
  `from === id && to !== id`. The list is in-cut nodes with degree > 0,
  sorted by degree descending, then fqn ascending, top 6.
- **Surprising connections.**
  `#graphReport [data-rep="bridges"] .rep-row[data-from][data-to][data-kind][data-support]`.
  A node's community is the `mapAltitudeBubbles()` entry whose
  `members` contain it. A crossing edge is not Contains, not a
  self-loop, has both ends in the cut and in a community, and joins two
  different communities. Crossing edges group by unordered community
  pair. `data-support` is the number of crossing edges in the pair. The
  row shows the pair's highest-weight edge (Calls, Publishes, and
  Subscribes weigh 3. Reads and Writes weigh 2. Anything else weighs 1).
  Ties keep the first edge in snapshot order. Rows sort by support
  ascending, then the smaller community's `members.length` descending,
  then the larger one's descending, then `from` ascending. The rail
  shows the top 4. With no pair, the list shows `.rep-empty`. A click
  runs `showHop`, so `#hopCard` names both ends and the edge's
  file:line.
- **Suggested questions.**
  `#graphReport [data-rep="questions"] .rep-q[data-focus]`. The desk
  asks about god node 1, bridge 1, and god node 2, in that order. It
  drops a question whose focus fails `hasLineageHops`, and it dedupes
  by focus, so there are at most 3. A Function god node asks
  `What calls X?` when `in >= out`, else `What does X call?`. A Type or
  Endpoint god node asks `What reads or writes X?`. A bridge asks
  `Why does A reach B?`. Its focus is `from` when
  `lineageKindsFor(from)` has the edge kind, else `to` under the same
  test, else there is no question. A click sets `selectedNodeId` and
  opens Lineage on that focus.
- Every other ledger render passes no report. Slice, the Overview run,
  the Lineage ego, and an entered bubble keep the `objects lit/n` meta
  and `#graphReport[hidden]`. An entered bubble heads the rail `Map`.
- Map stays community LOD (`.react-flow__node` count 0,
  `.viewport[data-lod="0"]`). Stamp and skip stay human.

## How to get to it (user POV)

1. Review a folder. Open **Map** and do not enter a bubble.
2. The right rail heads **God nodes**. Each row shows its degree. Hover
   a row to see in and out counts.
3. Click a god node. Evidence opens, and its `degree` row shows the
   same number.
4. Click a row under **Surprising connections**. The hop card names
   both ends of the crossing edge.
5. Click a question under **Suggested questions**. Lineage opens on
   that node.
6. Press a program chip. The rail re-ranks inside that program, and the
   meta names the program.

## Driving it with the harness

```
extension/scripts/webview-harness.html?live=1&probe=0&require=1
```

Self-review Map, after the All programs steps (AP1 to AP6):

```
document.querySelector("#ledgerPane > .led-head").textContent; // God nodes
[...document.querySelectorAll("#ledgerGrid .cell[data-id] .dag-n")].map((el) => el.textContent);
document.querySelector('#graphReport [data-rep="bridges"] [data-from][data-to]').click(); // #hopCard
document.querySelector('#legend [data-prog="6"]').click(); // one program's cut
document.querySelector("#graphReport .rep-q[data-focus]").click(); // Lineage
```

The driver recounts every number in Node from the snap. It does not
import `report.js`. Driver assertions:

- GR1: the head is `God nodes`, `#ledgerPane.report` is set,
  `#graphReport` is visible, and there are at least 3 god cells
- GR2: each `.dag-n` equals the Node degree, the list does not
  increase, and the first cell is the max degree over all snap nodes
- GR3: `#ledgerMeta` is `all · {N} nodes · {E} edges`
- GR4: bridge row count is `min(4, pairs)`. Each row is a real
  non-Contains snap edge across two altitude communities with the Node
  pair support. The first row has the minimum support. With no pairs,
  `.rep-empty` shows instead
- GR5: the first god cell opens `#sourcePane` with the same `degree`
- GR6: the first bridge row opens `#hopCard` on its `from` and `to`
- GR7: the program that owns the first bridge's `from` (longest
  `root` prefix) re-ranks the rail. The meta names it, every god file is
  under its root with the Node degree, the list does not increase and
  differs from All, and Map stays `xy=0` with
  more than one `.bubble-card`. Screenshot `verification/graph-report.png`
- GR8: the first question opens Lineage with
  `window.__graphideLineage.focus === data-focus` and `hops > 0`
- GR9 and GR10: no `{ type: "stamp" }` or `{ type: "skip" }` post, and
  `.graphide/stamps/` is still empty

## Gotchas

- Degree counts every snapshot edge, Contains included, over the whole
  graph and not only the cut. That keeps the rail equal to the Evidence
  `degree` row. `fillInspect` leaves `#ledgerMeta` alone while
  `#ledgerPane.report` is set, so the cut counts survive Evidence.
- Bridges exclude Contains. The clusterer gives Contains weight 0
  (`EdgeKind::cluster_weight` in `crates/graphide-ir/src/lib.rs`), so a
  Contains edge across communities exists by construction and is not a
  surprise.
- On self-review All programs, the top god nodes are symbols of the
  committed bundle `extension/media/main.js` (for example
  `extension.media.c`) and `scripts.verify-graphide.main`. That is the
  honest derived graph. Do not filter the bundle out.
- Crossing pairs are rare at Map altitude on self-review. GR4 expects
  `min(4, pairs)` rows rather than a fixed count.
- The rail replaces the old unranked 48-object Map ledger sample. Cells
  keep `#ledgerGrid .cell[data-id]` and the `selectNode` click, so the
  explorer Map steps that click `#ledgerGrid .cell` still open Evidence.
- Do not React-mount Map community LOD. Cards stay vanilla. `xy=0`.
- Agents never stamp. The report is a reading of the graph, not an
  approval.
