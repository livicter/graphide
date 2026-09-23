/** Graph Report for the Map rail. Every number is recomputable from the snapshot. */

/**
 * @typedef {{ id: string, degree: number, in: number, out: number }} GodNode
 * @typedef {{ from: string, to: string, kind: string, a: string, b: string, support: number }} Bridge
 * @typedef {{ nodes: number, edges: number, god: GodNode[], bridges: Bridge[] }} GraphReport
 */

const KIND_WEIGHT = { Calls: 3, Publishes: 3, Subscribes: 3, Reads: 2, Writes: 2 };

function cmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** @returns {GraphReport} */
export function graphReport(graph, communities, inCut, limits) {
  const godCap = limits && limits.god != null ? limits.god : 6;
  const bridgeCap = limits && limits.bridges != null ? limits.bridges : 4;
  const edges = (graph && graph.edges) || [];

  const cut = new Map();
  for (const n of (graph && graph.nodes) || []) {
    if (inCut(n)) cut.set(String(n.id), n);
  }

  const community = new Map();
  for (const c of communities || []) {
    for (const m of c.members || []) {
      const id = String(m);
      if (!community.has(id)) community.set(id, c);
    }
  }

  const stats = new Map();
  for (const id of cut.keys()) stats.set(id, { id, degree: 0, in: 0, out: 0 });
  let cutEdges = 0;
  const pairs = new Map();
  for (const e of edges) {
    const from = String(e.from);
    const to = String(e.to);
    const sf = stats.get(from);
    const st = stats.get(to);
    if (from === to) {
      if (sf) sf.degree++;
    } else {
      if (sf) {
        sf.degree++;
        sf.out++;
      }
      if (st) {
        st.degree++;
        st.in++;
      }
    }
    if (!sf || !st) continue;
    cutEdges++;
    // Contains has cluster weight 0 (EdgeKind::cluster_weight), so a Contains edge across communities exists by construction.
    if (e.kind === "Contains" || from === to) continue;
    const ca = community.get(from);
    const cb = community.get(to);
    if (!ca || !cb || ca === cb) continue;
    const ia = String(ca.id);
    const ib = String(cb.id);
    const key = ia < ib ? ia + "\0" + ib : ib + "\0" + ia;
    const w = KIND_WEIGHT[e.kind] || 1;
    const pair = pairs.get(key);
    if (!pair) {
      const sa = (ca.members || []).length;
      const sb = (cb.members || []).length;
      pairs.set(key, {
        w,
        small: Math.min(sa, sb),
        large: Math.max(sa, sb),
        bridge: { from, to, kind: e.kind, a: ia, b: ib, support: 1 },
      });
      continue;
    }
    pair.bridge.support++;
    if (w > pair.w) {
      pair.w = w;
      pair.bridge = { from, to, kind: e.kind, a: ia, b: ib, support: pair.bridge.support };
    }
  }

  const god = [...stats.values()]
    .filter((s) => s.degree > 0)
    .sort((x, y) => y.degree - x.degree || cmp(String(cut.get(x.id).fqn || ""), String(cut.get(y.id).fqn || "")))
    .slice(0, godCap);

  const bridges = [...pairs.values()]
    .sort(
      (x, y) =>
        x.bridge.support - y.bridge.support ||
        y.small - x.small ||
        y.large - x.large ||
        cmp(x.bridge.from, y.bridge.from)
    )
    .slice(0, bridgeCap)
    .map((p) => p.bridge);

  return { nodes: cut.size, edges: cutEdges, god, bridges };
}
