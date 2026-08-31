/** Sequence graph cap + layered layout. Dagre (main thread) — ELK ships a Worker. */
import { Graph, layout } from "@dagrejs/dagre";

export const SEQ_NODE_CAP = 48;
export const SEQ_HOP_CAP = 80;

const NODE_W = 168;
const NODE_H = 58;

export function capSequence(participants, hops) {
  const parts = (participants || []).slice(0, SEQ_NODE_CAP);
  const ids = new Set(parts.map((p) => String(p.id)));
  const kept = (hops || []).filter((h) => ids.has(String(h.from)) && ids.has(String(h.to))).slice(0, SEQ_HOP_CAP);
  return { participants: parts, hops: kept };
}

function fallbackPositions(parts) {
  const gapX = 72;
  const gapY = 28;
  const pad = 24;
  return parts.map((p, i) => ({
    id: String(p.id),
    x: pad + i * (NODE_W + gapX),
    y: pad + (i % 2) * (NODE_H + gapY),
  }));
}

function dagrePositions(parts, hops) {
  const g = new Graph({ multigraph: true });
  g.setGraph({ rankdir: "LR", nodesep: 36, ranksep: 72, marginx: 24, marginy: 24 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const p of parts) {
    g.setNode(String(p.id), { width: NODE_W, height: NODE_H });
  }
  for (const h of hops) {
    if (!g.hasNode(String(h.from)) || !g.hasNode(String(h.to))) continue;
    g.setEdge(String(h.from), String(h.to), {}, "h" + h.i);
  }
  layout(g);
  return parts.map((p) => {
    const n = g.node(String(p.id));
    return {
      id: String(p.id),
      x: (n && n.x != null ? n.x : 0) - NODE_W / 2,
      y: (n && n.y != null ? n.y : 0) - NODE_H / 2,
    };
  });
}

export function layoutSequence(participants, hops) {
  const capped = capSequence(participants, hops);
  const parts = capped.participants;
  const hs = capped.hops;
  if (!parts.length) return { nodes: [], hops: hs, width: NODE_W, height: NODE_H };
  let nodes;
  try {
    nodes = dagrePositions(parts, hs);
  } catch (err) {
    nodes = fallbackPositions(parts);
  }
  return { nodes, hops: hs, width: NODE_W, height: NODE_H };
}
