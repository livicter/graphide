export function Progress() {
  return (
    <div id="progress">
      <div className="progress-inner">
        <ol id="phases">
          <li data-phase="walk">Scan</li>
          <li data-phase="extract">Extract</li>
          <li data-phase="link">Link</li>
          <li data-phase="cluster">Cluster</li>
          <li data-phase="flows">Flows</li>
        </ol>
        <div id="progressBar">
          <i id="progressFill" />
        </div>
        <div id="progressMeta">
          <span id="progressLabel" />
          <span id="progressCounts" />
          <span id="progressPct" />
          <span id="progressTime" />
        </div>
      </div>
    </div>
  );
}
