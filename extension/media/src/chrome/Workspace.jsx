export function Workspace() {
  return (
    <section id="workspace">
      <section id="canvas" />
      <aside id="ledgerPane" hidden>
        <div className="led-head">SLICE</div>
        <div id="ledgerGrid" />
        <div id="ledgerMeta" />
      </aside>
      <aside id="sourcePane" hidden>
        <div className="src-bar">
          <span className="src-k">Evidence</span>
          <span id="srcTitle" />
          <button id="srcEditor" title="Open this span in the editor">
            Editor
          </button>
          <button id="srcClose" title="Close inspect (Esc)">
            Close
          </button>
        </div>
        <div id="hopCard" hidden />
        <div id="inspMeta" />
        <div id="inspEdges" />
        <div id="srcBody" />
      </aside>
    </section>
  );
}
