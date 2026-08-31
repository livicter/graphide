/**
 * Sequence graph inside #seqCanvas. Second createRoot — App still owns chrome
 * on #root; bootDesk still paints Map / Slice / other workspaces in vanilla.
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
import { layoutSequence } from "./sequence-layout.js";

const NODE_TYPES = { seqPart: SeqParticipantNode };

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

function FitOnce({ graphKey }) {
  const rf = useReactFlow();
  const last = useRef("");
  useEffect(() => {
    if (!graphKey || graphKey === last.current) return;
    last.current = graphKey;
    const id = requestAnimationFrame(() => {
      rf.fitView({ padding: 0.18 });
    });
    return () => cancelAnimationFrame(id);
  }, [graphKey, rf]);
  return null;
}

function SequenceCanvas({ participants, hops, cursor, onNodeClick, onHopClick }) {
  const laid = useMemo(() => layoutSequence(participants, hops), [participants, hops]);
  const graphKey = useMemo(
    () =>
      laid.nodes.map((n) => n.id).join("|") +
      ":" +
      laid.hops.map((h) => h.i + ":" + h.from + ":" + h.to + ":" + h.kind).join(","),
    [laid]
  );
  const hot = cursor >= 0 ? laid.hops.find((h) => h.i === cursor) : null;
  const nodes = useMemo(
    () =>
      laid.nodes.map((n) => {
        const p = (participants || []).find((x) => String(x.id) === n.id) || { id: n.id };
        const on = !!(hot && (String(hot.from) === n.id || String(hot.to) === n.id));
        return {
          id: n.id,
          type: "seqPart",
          position: { x: n.x, y: n.y },
          width: laid.width,
          height: laid.height,
          data: {
            id: n.id,
            fqn: p.fqn || "",
            kind: p.kind || "Function",
            label: p.label || n.id,
            on,
          },
          draggable: false,
          connectable: false,
        };
      }),
    [laid, participants, hot]
  );
  const edges = useMemo(
    () =>
      laid.hops.map((h) => {
        const on = h.i === cursor;
        const ret = h.variant === "return";
        return {
          id: "seq-h-" + h.i,
          source: String(h.from),
          target: String(h.to),
          type: "smoothstep",
          label: (h.kind || "") + (ret ? " return" : ""),
          className: (on ? "on" : "") + (ret ? " ret" : ""),
          data: { i: h.i, from: String(h.from), to: String(h.to), kind: h.kind, variant: h.variant },
          markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
          style: ret ? { strokeDasharray: "5 4" } : undefined,
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
        fitView
        fitViewOptions={{ padding: 0.18 }}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesReconnectable={false}
        elementsSelectable
        deleteKeyCode={null}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
        zoomOnScroll={false}
        preventScrolling={false}
        panOnDrag
        onNodeClick={(_, node) => {
          if (onNodeClick) onNodeClick(node.id);
        }}
        onEdgeClick={(_, edge) => {
          const i = edge.data && edge.data.i;
          if (Number.isFinite(i) && onHopClick) onHopClick(i);
        }}
      >
        <FitOnce graphKey={graphKey} />
      </ReactFlow>
    </ReactFlowProvider>
  );
}

let seqRoot = null;
let seqHost = null;

export function unmountSequenceCanvas() {
  if (!seqRoot) return;
  seqRoot.unmount();
  seqRoot = null;
  seqHost = null;
}

export function renderSequenceCanvas(host, props) {
  if (!host) {
    unmountSequenceCanvas();
    return;
  }
  if (seqRoot && seqHost !== host) unmountSequenceCanvas();
  if (!seqRoot) {
    seqRoot = createRoot(host);
    seqHost = host;
  }
  flushSync(() => {
    seqRoot.render(
      <SequenceCanvas
        participants={props.participants}
        hops={props.hops}
        cursor={props.cursor}
        onNodeClick={props.onNodeClick}
        onHopClick={props.onHopClick}
      />
    );
  });
}
