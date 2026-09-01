/** Review graph cap + layered layout. Dagre (main thread) — ELK ships a Worker. */
import { Graph, layout } from "@dagrejs/dagre";

export const SEQ_NODE_CAP = 48;
export const SEQ_HOP_CAP = 80;
export const DELTA_NODE_CAP = 24;
export const DELTA_HOP_CAP = 80;
export const GRAPH_NODE_CAP = 48;
export const GRAPH_HOP_CAP = 80;
export const LINEAGE_NODE_CAP = 48;
export const LINEAGE_HOP_CAP = 80;

const DEFAULT_W = 168;
const DEFAULT_H = 58;

export function capGraph(nodes, hops, nodeCap, hopCap) {
  const capN = nodeCap == null ? GRAPH_NODE_CAP : nodeCap;
  const capH = hopCap == null ? GRAPH_HOP_CAP : hopCap;
  const parts = (nodes || []).slice(0, capN);
  const ids = new Set(parts.map((p) => String(p.id)));
  const kept = (hops || [])
    .filter((h) => ids.has(String(h.from)) && ids.has(String(h.to)))
    .slice(0, capH);
  return { nodes: parts, hops: kept };
}

export function capSequence(participants, hops) {
  const capped = capGraph(participants, hops, SEQ_NODE_CAP, SEQ_HOP_CAP);
  return { participants: capped.nodes, hops: capped.hops };
}

function fallbackPositions(parts, nodeW, nodeH) {
  const gapX = 72;
  const gapY = 28;
  const pad = 24;
  return parts.map((p, i) => ({
    id: String(p.id),
    x: pad + i * (nodeW + gapX),
    y: pad + (i % 2) * (nodeH + gapY),
  }));
}

function dagrePositions(parts, hops, opts) {
  const nodeW = opts.nodeW || DEFAULT_W;
  const nodeH = opts.nodeH || DEFAULT_H;
  const g = new Graph({ multigraph: true });
  g.setGraph({
    rankdir: opts.rankdir || "LR",
    nodesep: opts.nodesep == null ? 36 : opts.nodesep,
    ranksep: opts.ranksep == null ? 72 : opts.ranksep,
    marginx: opts.marginx == null ? 24 : opts.marginx,
    marginy: opts.marginy == null ? 24 : opts.marginy,
  });
  g.setDefaultEdgeLabel(() => ({}));
  for (const p of parts) {
    g.setNode(String(p.id), { width: nodeW, height: nodeH });
  }
  for (const h of hops) {
    if (!g.hasNode(String(h.from)) || !g.hasNode(String(h.to))) continue;
    const key = h.i != null ? "h" + h.i : String(h.from) + ">" + String(h.to) + ">" + (h.kind || "");
    g.setEdge(String(h.from), String(h.to), {}, key);
  }
  layout(g);
  return parts.map((p) => {
    const n = g.node(String(p.id));
    return {
      id: String(p.id),
      x: (n && n.x != null ? n.x : 0) - nodeW / 2,
      y: (n && n.y != null ? n.y : 0) - nodeH / 2,
    };
  });
}

export function layoutGraph(nodes, hops, opts) {
  opts = opts || {};
  const nodeW = opts.nodeW || DEFAULT_W;
  const nodeH = opts.nodeH || DEFAULT_H;
  const capped = capGraph(nodes, hops, opts.nodeCap, opts.hopCap);
  const parts = capped.nodes;
  const hs = capped.hops;
  if (!parts.length) return { nodes: [], hops: hs, width: nodeW, height: nodeH };
  let laid;
  try {
    laid = dagrePositions(parts, hs, { ...opts, nodeW, nodeH });
  } catch (err) {
    laid = fallbackPositions(parts, nodeW, nodeH);
  }
  return { nodes: laid, hops: hs, width: nodeW, height: nodeH };
}

export function layoutSequence(participants, hops) {
  const capped = capSequence(participants, hops);
  const laid = layoutGraph(capped.participants, capped.hops, {
    nodeCap: SEQ_NODE_CAP,
    hopCap: SEQ_HOP_CAP,
    nodeW: DEFAULT_W,
    nodeH: DEFAULT_H,
  });
  return laid;
}

/** Rank columns: upstream (left) | focus | downstream (right). Dagre nodesep. */
export function layoutLineage(nodes, hops, opts) {
  opts = opts || {};
  const nodeW = opts.nodeW || 176;
  const nodeH = opts.nodeH || 64;
  const nodesep = opts.nodesep == null ? 36 : opts.nodesep;
  const ranksep = opts.ranksep == null ? 96 : opts.ranksep;
  const ordered = rankLineageNodes(nodes);
  const laid = layoutGraph(ordered, hops, {
    nodeCap: LINEAGE_NODE_CAP,
    hopCap: LINEAGE_HOP_CAP,
    nodeW,
    nodeH,
    rankdir: "LR",
    nodesep,
    ranksep,
  });
  const byId = new Map((nodes || []).map((n) => [String(n.id), n]));
  const ranks = new Map();
  for (const n of laid.nodes) {
    ranks.set(n.id, lineageRank(byId.get(n.id)));
  }
  const unique = [...new Set([...ranks.values()])].sort((a, b) => a - b);
  const grouped = new Map();
  for (const n of laid.nodes) {
    const r = ranks.get(n.id) || 0;
    if (!grouped.has(r)) grouped.set(r, []);
    grouped.get(r).push(n);
  }
  const out = [];
  for (const r of unique) {
    const col = grouped.get(r) || [];
    col.sort((a, b) => (a.y || 0) - (b.y || 0));
    const x = unique.indexOf(r) * (nodeW + ranksep) + 24;
    col.forEach((n, i) => {
      out.push({ id: n.id, x, y: 24 + i * (nodeH + nodesep) });
    });
  }
  return { nodes: out, hops: laid.hops, width: nodeW, height: nodeH };
}

function lineageRank(n) {
  if (!n) return 0;
  const hop = n.hop == null ? 0 : n.hop;
  if (n.side === "up") return -hop;
  if (n.side === "down") return hop;
  return 0;
}

function rankLineageNodes(nodes) {
  const list = (nodes || []).slice();
  const band = (n) => {
    if (n.side === "focus") return 0;
    if (n.side === "up" && n.hop === 1) return 1;
    if (n.side === "down" && n.hop === 1) return 2;
    if (n.side === "up") return 3;
    if (n.side === "down") return 4;
    return 5;
  };
  list.sort((a, b) => band(a) - band(b));
  return list;
}
