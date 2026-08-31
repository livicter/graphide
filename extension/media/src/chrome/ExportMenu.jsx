export function ExportMenu() {
  return (
    <aside id="exportMenu" hidden>
      <div className="export-head">
        <b>Export</b>
        <button type="button" id="exportClose" title="Close export">
          Close
        </button>
      </div>
      <ul>
        <li>
          <button type="button" id="exportCopyPng">
            Copy PNG
          </button>
        </li>
        <li>
          <button type="button" id="exportPng">
            PNG
          </button>
        </li>
        <li>
          <button type="button" id="exportSvg">
            SVG
          </button>
        </li>
        <li>
          <button type="button" id="exportCopyShare">
            Copy Share Card
          </button>
        </li>
        <li>
          <button type="button" id="exportShare">
            Share Card
          </button>
        </li>
        <li>
          <button type="button" id="exportRouteShare">
            Route Share Card
          </button>
        </li>
      </ul>
    </aside>
  );
}
