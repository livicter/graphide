/**
 * Review graphs inside a canvas child host (#seqCanvas / #deltaCanvas /
 * #dfCanvas / #lcCanvas / #sliceCanvas / #lineageCanvas). Second createRoot —
 * App still owns chrome on #root; Map community LOD stays vanilla.
 */
import { useEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import {
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import { layoutGraph, layoutLineage, layoutSequence } from "./sequence-layout.js";

function SeqParticipantNode({ data }) {
  return (
    <div
      className={"seq-part vnode kind-" + (data.kind || "Function") + (data.on ? " on" : "")}
      data-id={data.id}
      data-fqn={data.fqn}
      data-kind={data.kind || ""}
    >
      <Handle type="target" position={Position.Left} />
      <span className="name">{data.label}</span>
      <span className="meta">{data.kind}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function DeltaVnode({ data }) {
  return (
    <div
      className={"vnode " + (data.kindClass || "kind-Function") + (data.hot ? " walk" : "")}
      data-id={data.id}
      data-fqn={data.fqn}
      data-kind={data.kind || ""}
      data-delta-state={data.state || "same"}
      {...(data.hot ? { "data-delta-review-current": "1" } : {})}
    >
      <Handle type="target" position={Position.Left} />
      <span className="kind">{data.kind || "node"}</span>
      <span className="name">{data.label}</span>
      <span className="fqn">{data.fqn}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function DfNode({ data }) {
  return (
    <div
      className={"df-node vnode kind-" + (data.kind || "Function") + (data.on ? " on" : "")}
      data-id={data.id}
      data-fqn={data.fqn}
      data-kind={data.kind || ""}
      data-df-role={data.role || ""}
      {...(data.endRole ? { "data-end-role": data.endRole } : {})}
      {...(data.channel ? { "data-channel": data.channel } : {})}
    >
      <Handle type="target" position={Position.Left} />
      <span className="name">{data.label}</span>
      <span className="meta">
        {data.kind}
        {data.ep ? " · " + data.ep : ""}
      </span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function LcStateNode({ data }) {
  return (
    <div
      className={"lc-state vnode" + (data.on ? " on" : "")}
      data-lc-id={data.id}
      data-lc-type={data.lcType || "neutral"}
      data-lc-lane={data.lane || ""}
      data-lc-col={data.col == null ? "0" : String(data.col)}
    >
      <Handle type="target" position={Position.Left} />
      <span className="name">{data.label}</span>
      <span className="meta">
        {data.lcType}
        {data.sublabel ? " · " + data.sublabel : ""}
      </span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function LineageVnode({ data }) {
  return (
    <div
      className={
        "comm-node ego-node vnode " +
        (data.kindClass || "kind-Function") +
        (data.focus ? " ego" : "") +
        (data.selected ? " selected" : "") +
        (data.uncovered ? " uncovered" : "") +
        (data.changed ? " changed" : "") +
        (data.on ? " on" : "")
      }
      data-id={data.id}
      data-fqn={data.fqn}
      data-kind={data.kind || ""}
      data-side={data.side || ""}
    >
      <Handle type="target" position={Position.Left} />
      <span className="name">{data.label}</span>
      <span className="meta">{data.kindLine}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function SliceVnode({ data }) {
  return (
    <div
      className={
        "vnode " +
        (data.kindClass || "kind-Function") +
        (data.away ? " away" : "") +
        (data.uncovered ? " uncovered" : data.changed ? " changed" : "") +
        (data.selected ? " selected" : "")
      }
      data-id={data.id}
      data-fqn={data.fqn}
      data-kind={data.kind || ""}
      data-file={data.file || ""}
      style={data.depth != null ? { "--d": data.depth } : undefined}
    >
      <Handle type="target" position={Position.Left} />
      <span className="kind">{data.kindLine}</span>
      <span className="name">{data.label}</span>
      {data.where ? <span className="where">{data.where}</span> : null}
      <span className="fqn">{data.fqn}</span>
      {data.snip ? <pre className="snip">{data.snip}</pre> : null}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const NODE_TYPES = {
  seqPart: SeqParticipantNode,
  deltaVnode: DeltaVnode,
  dfNode: DfNode,
  lcState: LcStateNode,
  sliceVnode: SliceVnode,
  lineageVnode: LineageVnode,
};

function FitWhenReady({ graphKey }) {
  const rf = useReactFlow();
  const fitted = useRef("");
  useEffect(() => {
    fitted.current = "";
    let ro = null;
    const paneOf = () =>
      document.querySelector(
        "#deltaCanvas .react-flow, #seqCanvas .react-flow, #dfCanvas .react-flow, #lcCanvas .react-flow, #sliceCanvas .react-flow, #lineageCanvas .react-flow"
      );
    const fit = () => {
      const pane = paneOf();
      if (!pane || !graphKey) return;
      const r = pane.getBoundingClientRect();
      if (r.width < 24 || r.height < 24) return;
      const key = graphKey + "@" + Math.round(r.width) + "x" + Math.round(r.height);
      if (fitted.current === key) return;
      fitted.current = key;
      rf.fitView({ padding: 0.16 });
    };
    const pane = paneOf();
    if (pane) {
      ro = new ResizeObserver(fit);
      ro.observe(pane);
    }
    const id = requestAnimationFrame(fit);
    const t = setTimeout(fit, 80);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
      if (ro) ro.disconnect();
    };
  }, [graphKey, rf]);
  return null;
}

function ReviewCanvas({
  nodeType,
  laid,
  items,
  hops,
  cursor,
  hotIds,
  onNodeClick,
  onHopClick,
  embed,
}) {
  const graphKey = useMemo(
    () =>
      laid.nodes.map((n) => n.id).join("|") +
      ":" +
      laid.hops.map((h) => h.i + ":" + h.from + ":" + h.to + ":" + (h.kind || "")).join(","),
    [laid]
  );
  const nodes = useMemo(
    () =>
      laid.nodes.map((n) => {
        const item = (items || []).find((x) => String(x.id) === n.id) || { id: n.id };
        const on = !!(hotIds && (hotIds.has(n.id) || hotIds.has(String(n.id))));
        return {
          id: n.id,
          type: nodeType,
          position: { x: n.x, y: n.y },
          width: laid.width,
          height: laid.height,
          data: { ...item, on, hot: on },
          draggable: false,
          connectable: false,
        };
      }),
    [laid, items, hotIds, nodeType]
  );
  const edges = useMemo(
    () =>
      laid.hops.map((h) => {
        const on = h.i === cursor || !!(h.hot);
        const ret = h.variant === "return";
        const state = h.state || "";
        return {
          id: "xy:" + String(h.from) + ":" + String(h.to) + ":" + (h.kind || "") + ":" + (h.i != null ? h.i : 0),
          source: String(h.from),
          target: String(h.to),
          type: "smoothstep",
          label: (h.kind || h.label || "") + (ret ? " return" : ""),
          className:
            (on ? "on" : "") +
            (ret ? " ret" : "") +
            (h.scar ? " scar" : "") +
            (state ? " delta-" + state : ""),
          data: {
            i: h.i,
            from: String(h.from),
            to: String(h.to),
            kind: h.kind,
            variant: h.variant,
            state,
          },
          markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
          style: ret || state === "removed" ? { strokeDasharray: "5 4" } : undefined,
        };
      }),
    [laid, cursor]
  );

  return (
    <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        proOptions={{ hideAttribution: true }}
        fitView={!embed}
        fitViewOptions={{ padding: 0.16 }}
        onInit={(inst) => {
          if (!embed) inst.fitView({ padding: 0.16 });
        }}
        minZoom={embed ? 1 : 0.2}
        maxZoom={embed ? 1 : 2}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesReconnectable={false}
        elementsSelectable
        deleteKeyCode={null}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
        zoomOnScroll={false}
        zoomOnPinch={!embed}
        zoomOnDoubleClick={!embed}
        preventScrolling={false}
        panOnDrag={!embed}
        panOnScroll={false}
        onNodeClick={(_, node) => {
          if (onNodeClick) onNodeClick(node.id, node.data);
        }}
        onEdgeClick={(_, edge) => {
          const i = edge.data && edge.data.i;
          if (Number.isFinite(i) && onHopClick) onHopClick(i);
          else if (onHopClick && edge.data) onHopClick(edge.data);
        }}
      >
        {embed ? null : <FitWhenReady graphKey={graphKey} />}
      </ReactFlow>
    </ReactFlowProvider>
  );
}

function layoutBounds(laid) {
  let maxX = laid.width || 176;
  let maxY = laid.height || 72;
  for (const n of laid.nodes || []) {
    maxX = Math.max(maxX, (n.x || 0) + (laid.width || 176));
    maxY = Math.max(maxY, (n.y || 0) + (laid.height || 72));
  }
  return { W: Math.max(720, Math.ceil(maxX + 56)), H: Math.max(300, Math.ceil(maxY + 56)) };
}

let graphRoot = null;
let graphHost = null;

export function unmountReviewCanvas() {
  if (!graphRoot) return;
  graphRoot.unmount();
  graphRoot = null;
  graphHost = null;
}

export function unmountSequenceCanvas() {
  unmountReviewCanvas();
}

function mountReviewCanvas(host, element) {
  if (!host) {
    unmountReviewCanvas();
    return;
  }
  if (graphRoot && graphHost !== host) unmountReviewCanvas();
  if (!graphRoot) {
    graphRoot = createRoot(host);
    graphHost = host;
  }
  flushSync(() => {
    graphRoot.render(element);
  });
}

export function renderSequenceCanvas(host, props) {
  const participants = props.participants || [];
  const hops = props.hops || [];
  const laid = layoutSequence(participants, hops);
  const cursor = props.cursor;
  const hot = cursor >= 0 ? laid.hops.find((h) => h.i === cursor) : null;
  const hotIds = new Set();
  if (hot) {
    hotIds.add(String(hot.from));
    hotIds.add(String(hot.to));
  }
  const items = participants.map((p) => ({
    id: String(p.id),
    fqn: p.fqn || "",
    kind: p.kind || "Function",
    label: p.label || String(p.id),
  }));
  mountReviewCanvas(
    host,
    <ReviewCanvas
      nodeType="seqPart"
      laid={laid}
      items={items}
      hops={hops}
      cursor={cursor}
      hotIds={hotIds}
      onNodeClick={props.onNodeClick}
      onHopClick={props.onHopClick}
    />
  );
}

export function renderDeltaCanvas(host, props) {
  const nodes = props.nodes || [];
  const hops = props.hops || [];
  const laid = layoutGraph(nodes, hops, {
    nodeCap: 24,
    hopCap: 80,
    nodeW: 176,
    nodeH: 64,
  });
  const hotIds = new Set((props.hotIds || []).map(String));
  const items = nodes.map((n) => ({
    id: String(n.id),
    fqn: n.fqn || "",
    kind: n.kind || "Function",
    kindClass: n.kindClass || "kind-Function",
    state: n.state || "same",
    label: n.label || n.fqn || String(n.id),
    hot: hotIds.has(String(n.id)),
  }));
  mountReviewCanvas(
    host,
    <ReviewCanvas
      nodeType="deltaVnode"
      laid={laid}
      items={items}
      hops={hops}
      cursor={props.cursor}
      hotIds={hotIds}
      onNodeClick={props.onNodeClick}
      onHopClick={props.onHopClick}
    />
  );
}

export function renderDataflowCanvas(host, props) {
  const nodes = props.nodes || [];
  const hops = props.hops || [];
  const laid = layoutGraph(nodes, hops, {
    nodeCap: 48,
    hopCap: 80,
    nodeW: 168,
    nodeH: 58,
  });
  const cursor = props.cursor;
  const hot = cursor >= 0 ? laid.hops.find((h) => h.i === cursor) : null;
  const hotIds = new Set();
  if (hot) {
    hotIds.add(String(hot.from));
    hotIds.add(String(hot.to));
  }
  const items = nodes.map((n) => ({
    id: String(n.id),
    fqn: n.fqn || "",
    kind: n.kind || "Function",
    label: n.label || n.fqn || String(n.id),
    role: n.role || "",
    endRole: n.endRole || n.end_role || "",
    channel: n.channel || "",
    ep: n.ep || "",
  }));
  mountReviewCanvas(
    host,
    <ReviewCanvas
      nodeType="dfNode"
      laid={laid}
      items={items}
      hops={hops}
      cursor={cursor}
      hotIds={hotIds}
      onNodeClick={props.onNodeClick}
      onHopClick={props.onHopClick}
    />
  );
}

export function renderLifecycleCanvas(host, props) {
  const nodes = props.nodes || [];
  const hops = props.hops || [];
  const laid = layoutGraph(nodes, hops, {
    nodeCap: 24,
    hopCap: 40,
    nodeW: 168,
    nodeH: 58,
  });
  const cursor = props.cursor;
  const hot = cursor >= 0 ? laid.hops.find((h) => h.i === cursor) : null;
  const hotIds = new Set();
  if (hot) {
    hotIds.add(String(hot.from));
    hotIds.add(String(hot.to));
  }
  if (props.nowId) hotIds.add(String(props.nowId));
  const items = nodes.map((n) => ({
    id: String(n.id),
    label: n.label || n.id,
    lcType: n.type || n.kind || "neutral",
    lane: n.lane || "",
    col: n.col,
    sublabel: n.sublabel || "",
  }));
  mountReviewCanvas(
    host,
    <ReviewCanvas
      nodeType="lcState"
      laid={laid}
      items={items}
      hops={hops}
      cursor={cursor}
      hotIds={hotIds}
      onNodeClick={props.onNodeClick}
      onHopClick={props.onHopClick}
    />
  );
}

export function renderSliceCanvas(host, props) {
  const nodes = props.nodes || [];
  const hops = props.hops || [];
  const laid = layoutGraph(nodes, hops, {
    nodeCap: 48,
    hopCap: 80,
    nodeW: 176,
    nodeH: 72,
  });
  const hotIds = new Set((props.hotIds || []).map(String));
  const items = nodes.map((n) => ({
    id: String(n.id),
    fqn: n.fqn || "",
    kind: n.kind || "Function",
    kindClass: n.kindClass || "kind-Function",
    label: n.label || n.fqn || String(n.id),
    kindLine: n.kindLine || n.kind || "Function",
    where: n.where || "",
    file: n.file || "",
    snip: n.snip || "",
    away: !!n.away,
    uncovered: !!n.uncovered,
    changed: !!n.changed,
    selected: !!n.selected,
    depth: n.depth,
  }));
  const box = layoutBounds(laid);
  host.style.width = box.W + "px";
  host.style.height = box.H + "px";
  host.classList.add("steiner-wrap");
  mountReviewCanvas(
    host,
    <ReviewCanvas
      nodeType="sliceVnode"
      laid={laid}
      items={items}
      hops={hops}
      cursor={props.cursor}
      hotIds={hotIds}
      embed
      onNodeClick={props.onNodeClick}
      onHopClick={props.onHopClick}
    />
  );
}

export function renderLineageCanvas(host, props) {
  const nodes = props.nodes || [];
  const hops = props.hops || [];
  const laid = layoutLineage(nodes, hops, {
    nodeCap: 48,
    hopCap: 80,
    nodeW: 176,
    nodeH: 64,
    nodesep: 36,
    ranksep: 96,
  });
  const hotIds = new Set([...(props.hotIds || [])].map(String));
  const items = nodes.map((n) => ({
    id: String(n.id),
    fqn: n.fqn || "",
    kind: n.kind || "Function",
    kindClass: n.kindClass || "kind-Function",
    label: n.label || n.fqn || String(n.id),
    kindLine: n.kindLine || n.kind || "Function",
    side: n.side || "",
    hop: n.hop,
    focus: !!n.focus,
    uncovered: !!n.uncovered,
    changed: !!n.changed,
    selected: !!n.selected,
  }));
  const box = layoutBounds(laid);
  host.style.width = box.W + "px";
  host.style.height = box.H + "px";
  host.classList.add("lineage-wrap");
  mountReviewCanvas(
    host,
    <ReviewCanvas
      nodeType="lineageVnode"
      laid={laid}
      items={items}
      hops={hops}
      cursor={props.cursor}
      hotIds={hotIds}
      embed
      onNodeClick={props.onNodeClick}
      onHopClick={props.onHopClick}
    />
  );
}
