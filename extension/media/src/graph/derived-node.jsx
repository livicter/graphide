/**
 * One derived-node registry for Review XYFlow graphs.
 * Shape is the type signal (diagram-design grammar, not that kit).
 * IR stays Function | Type | Endpoint. Agents never stamp.
 */
import { Handle, Position } from "@xyflow/react";

const STORE_HOPS = { Reads: true, Writes: true };

export function storeIdsFromHops(items, hops) {
  const byId = new Map();
  for (const n of items || []) byId.set(String(n.id), n);
  const ids = new Set();
  for (const h of hops || []) {
    if (!STORE_HOPS[h.kind]) continue;
    for (const raw of [h.from, h.to]) {
      const n = byId.get(String(raw));
      if (n && (n.kind === "Type" || n.kindClass === "kind-Type")) ids.add(String(n.id));
    }
  }
  return ids;
}

export function shapeOf(item, opts) {
  const n = item || {};
  const lc = String(n.lcType || n.type || "").toLowerCase();
  if (lc === "start") return "start";
  if (lc === "waiting" || lc === "decision") return "decision";
  if (lc === "success" || lc === "failure") return "end";
  if (lc === "neutral" && (n.lane === "terminal" || n.id === "skipped")) return "end";
  if (lc === "active" || lc === "neutral" || lc === "external") return "fn";

  const role = String(n.role || "").toLowerCase();
  if (role === "source" || n.steiner === "start") return "start";
  if (role === "sink" || n.steiner === "end") return "end";
  if (role === "store") return "store";

  const kind = n.kind || "";
  if (kind === "Endpoint") return "endpoint";
  if (kind === "Type") {
    const stores = opts && opts.stores;
    if (stores && stores.has(String(n.id))) return "store";
    return "type";
  }
  return "fn";
}

export function decorateDerived(items, hops, extra) {
  const stores = storeIdsFromHops(items, hops);
  return (items || []).map((it) => Object.assign({}, it, extra || {}, { shape: it.shape || shapeOf(it, { stores }) }));
}

function tagOf(shape) {
  if (shape === "fn") return "FN";
  if (shape === "type") return "TYPE";
  if (shape === "endpoint") return "EP";
  if (shape === "store") return "DB";
  return "";
}

function StoreIcon() {
  return (
    <svg className="shape-ico" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <ellipse cx="8" cy="3.6" rx="5.5" ry="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 3.6v8.2c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2V3.6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 7.6c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function PlugIcon() {
  return (
    <svg className="shape-ico" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <rect x="2.5" y="5.5" width="8" height="6.5" rx="3.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 5.5V3M9 5.5V3M10.5 8.2h3M10.5 10.2h3" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function classOf(data) {
  const kind = data.kind || "";
  const kindClass = data.kindClass || (kind ? "kind-" + kind : "");
  const surface = data.surface || "";
  return [
    surface,
    "vnode",
    kindClass,
    data.on ? "on" : "",
    data.hot && data.state ? "walk" : "",
    data.focus ? "ego" : "",
    data.selected ? "selected" : "",
    data.uncovered ? "uncovered" : "",
    data.changed ? "changed" : "",
    data.away ? "away" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function DerivedNode({ data }) {
  const d = data || {};
  const shape = d.shape || "fn";
  const tag = tagOf(shape);
  const meta = d.meta || "";
  const attrs = {
    className: classOf(d),
    "data-shape": shape,
    "data-id": d.id,
    "data-fqn": d.fqn || "",
    "data-kind": d.kind || "",
  };
  if (d.state) attrs["data-delta-state"] = d.state;
  if (d.hot && d.state) attrs["data-delta-review-current"] = "1";
  if (d.role != null && d.role !== "") attrs["data-df-role"] = d.role;
  if (d.endRole) attrs["data-end-role"] = d.endRole;
  if (d.channel) attrs["data-channel"] = d.channel;
  if (d.lcType) {
    attrs["data-lc-id"] = d.id;
    attrs["data-lc-type"] = d.lcType;
    attrs["data-lc-lane"] = d.lane || "";
    attrs["data-lc-col"] = d.col == null ? "0" : String(d.col);
    delete attrs["data-id"];
    delete attrs["data-fqn"];
    delete attrs["data-kind"];
  }
  if (d.side) attrs["data-side"] = d.side;
  if (d.file) attrs["data-file"] = d.file;
  const style = d.depth != null ? { "--d": d.depth } : undefined;

  return (
    <div {...attrs} style={style}>
      <Handle type="target" position={Position.Left} />
      <span className="shape-mark">
        {shape === "store" ? <StoreIcon /> : null}
        {shape === "endpoint" ? <PlugIcon /> : null}
        {tag ? <span className="shape-tag">{tag}</span> : null}
        {!tag && d.kindLine ? <span className="kind">{d.kindLine}</span> : null}
      </span>
      {tag && d.kindLine && d.kindLine !== d.kind ? <span className="kind">{d.kindLine}</span> : null}
      <span className="name">{d.label}</span>
      {meta ? <span className="meta">{meta}</span> : null}
      {d.where ? <span className="where">{d.where}</span> : null}
      {d.showFqn && d.fqn ? <span className="fqn">{d.fqn}</span> : null}
      {d.snip ? <pre className="snip">{d.snip}</pre> : null}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
