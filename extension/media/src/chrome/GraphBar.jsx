export function GraphBar() {
  return (
    <div id="graphBar" hidden>
      <nav id="workspaces" className="workspaces" aria-label="Explorer workspaces">
        <button type="button" data-ws="map">
          Map
        </button>
        <button type="button" data-ws="slice">
          Slice
        </button>
        <button type="button" data-ws="lineage">
          Lineage
        </button>
        <button type="button" data-ws="decisions">
          Decisions
        </button>
        <button type="button" data-ws="registry">
          Registry
        </button>
        <button type="button" data-ws="overview">
          Overview
        </button>
        <button type="button" data-ws="timeline">
          Timeline
        </button>
        <button type="button" data-ws="delta">
          Delta
        </button>
        <button type="button" data-ws="sequence">
          Sequence
        </button>
        <button type="button" data-ws="dataflow">
          Data-flow
        </button>
        <button type="button" data-ws="lifecycle">
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
