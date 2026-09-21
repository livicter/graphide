function WsIco({ children }) {
  return (
    <svg className="ws-ico" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

export function GraphBar() {
  return (
    <div id="graphBar" hidden>
      <nav id="workspaces" className="workspaces" aria-label="Explorer workspaces">
        <button type="button" data-ws="map">
          <WsIco>
            <path d="M2.5 4.2 6 3.2 10 4.8 13.5 3.6v8.2L10 13l-4-1.6-3.5 1.2z" />
            <path d="M6 3.2v8.2M10 4.8v8.2" />
          </WsIco>
          Map
        </button>
        <button type="button" data-ws="slice">
          <WsIco>
            <circle cx="8" cy="8" r="5.2" />
            <path d="M8 2.8v5.2l3.6 2.2" />
          </WsIco>
          Slice
        </button>
        <button type="button" data-ws="lineage">
          <WsIco>
            <circle cx="8" cy="3.4" r="1.35" />
            <circle cx="3.6" cy="12.2" r="1.35" />
            <circle cx="12.4" cy="12.2" r="1.35" />
            <path d="M8 4.8v2.4L4.4 11m3.6-3.8 3.6 3.8" />
          </WsIco>
          Lineage
        </button>
        <button type="button" data-ws="decisions">
          <WsIco>
            <rect x="3" y="3" width="7.2" height="7.2" rx="1.3" />
            <rect x="5.8" y="5.8" width="7.2" height="7.2" rx="1.3" />
          </WsIco>
          Decisions
        </button>
        <button type="button" data-ws="registry">
          <WsIco>
            <path d="M3 4.2h10M3 8h10M3 11.8h7" />
          </WsIco>
          Registry
        </button>
        <button type="button" data-ws="overview">
          <WsIco>
            <rect x="2.8" y="2.8" width="4.4" height="4.4" rx="0.9" />
            <rect x="8.8" y="2.8" width="4.4" height="4.4" rx="0.9" />
            <rect x="2.8" y="8.8" width="4.4" height="4.4" rx="0.9" />
            <rect x="8.8" y="8.8" width="4.4" height="4.4" rx="0.9" />
          </WsIco>
          Overview
        </button>
        <button type="button" data-ws="timeline">
          <WsIco>
            <circle cx="8" cy="8" r="5.2" />
            <path d="M8 5v3.2l2.2 1.4" />
          </WsIco>
          Timeline
        </button>
        <button type="button" data-ws="delta">
          <WsIco>
            <path d="M8 3.2 13.4 13H2.6z" />
          </WsIco>
          Delta
        </button>
        <button type="button" data-ws="sequence">
          <WsIco>
            <circle cx="3.2" cy="8" r="1.3" />
            <circle cx="8" cy="8" r="1.3" />
            <circle cx="12.8" cy="8" r="1.3" />
            <path d="M4.5 8h2.2M9.3 8h2.2" />
          </WsIco>
          Sequence
        </button>
        <button type="button" data-ws="dataflow">
          <WsIco>
            <circle cx="3.4" cy="8" r="1.3" />
            <circle cx="12.4" cy="4.2" r="1.3" />
            <circle cx="12.4" cy="11.8" r="1.3" />
            <path d="M4.8 8h2.4L11 4.8M7.2 8 11 11.2" />
          </WsIco>
          Data-flow
        </button>
        <button type="button" data-ws="lifecycle">
          <WsIco>
            <path d="M12.2 6.2A4.6 4.6 0 1 0 12 11" />
            <path d="M10.4 6.2h1.8V4.4" />
          </WsIco>
          Lifecycle
        </button>
      </nav>
      <nav id="tabs" />
      <button id="egoBtn" type="button" title="Ego: isolate the selected node and its k-hop neighborhood">
        Ego
      </button>
      <label className="ego-hops" title="Ego hop depth on the derived graph">
        <select id="egoHops">
          <option value="1">1-hop</option>
          <option value="2">2-hop</option>
        </select>
      </label>
      <button id="pathBtn" type="button" title="Route probe: shortest derived directed path (R)">
        PATH
      </button>
      <button id="lensBtn" type="button" title="Lens: compare Function / Type / Endpoint or Source|Sink (L)">
        LENS
      </button>
      <button
        type="button"
        className="reorg-btn"
        title="Auto-reorganize this chart. Drag any box to pin a new place."
      >
        Reorganize
      </button>
      <label className="search-wrap">
        <span className="search-ico" aria-hidden="true">
          ⌕
        </span>
        <input
          id="graphSearch"
          type="search"
          spellCheck={false}
          placeholder="Find FQN, file, flow, or hop…"
        />
        <kbd>/</kbd>
      </label>
      <div id="kindFilters">
        <label className="kind-pill kind-Function">
          <input type="checkbox" data-kind="Function" defaultChecked /> Function
        </label>
        <label className="kind-pill kind-Type">
          <input type="checkbox" data-kind="Type" defaultChecked /> Type
        </label>
        <label className="kind-pill kind-Endpoint">
          <input type="checkbox" data-kind="Endpoint" defaultChecked /> Endpoint
        </label>
      </div>
      <div id="legend" />
    </div>
  );
}
