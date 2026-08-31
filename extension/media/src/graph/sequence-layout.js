/** Review graph cap + layered layout. Dagre (main thread) — ELK ships a Worker. */
import { Graph, layout } from "@dagrejs/dagre";

export const SEQ_NODE_CAP = 48;
export const SEQ_HOP_CAP = 80;
export const DELTA_NODE_CAP = 24;
export const DELTA_HOP_CAP = 80;
export const GRAPH_NODE_CAP = 48;
export const GRAPH_HOP_CAP = 80;

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
