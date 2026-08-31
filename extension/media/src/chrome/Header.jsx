export function Header() {
  return (
    <header>
      <div className="brand">
        Graph<span>ide</span>
      </div>
      <span className="now-pill" id="nowPill" hidden />
      <input
        id="prompt"
        type="text"
        spellCheck={false}
        placeholder="name=hit,hit"
        title="Optional prompt: name=hit,hit  (repeat with ; )"
      />
      <button id="backBtn" title="Back (Backspace)" disabled>
        Back
      </button>
      <button id="reviewBtn" title="Review workspace">
        Review
      </button>
      <button id="cancelBtn" title="Cancel review (Esc)" hidden>
        Cancel
      </button>
      <button id="stampBtn" title="Human stamp: this flow still holds (S)">
        Stamp
      </button>
      <button id="skipBtn" title="Skip this flow without a stamp (X)">
        Skip
      </button>
      <button id="llmBtn" type="button" title="Connect an LLM or ask about this review path">
        LLM
      </button>
      <button id="keysBtn" type="button" title="Keyboard shortcuts (?)">
        ?
      </button>
      <button id="exportBtn" type="button" title="Export PNG, SVG, or Share Card">
        Export
      </button>
      <div id="themeSeg" className="theme-seg" role="group" aria-label="Appearance">
        <button type="button" id="themeDay" data-theme="day" title="Day appearance (D)">
          Day
        </button>
        <button type="button" id="themeNight" data-theme="night" title="Night appearance (D)">
          Night
        </button>
      </div>
      <button
        id="presetBtn"
        type="button"
        data-preset="classic"
        title="Style: Classic. Cycles Classic / Signal / Blueprint"
      >
        Classic
      </button>
      <button id="presentBtn" type="button" title="Presentation Stage (F)" aria-pressed="false">
        Present
      </button>
      <div id="zoomBar" hidden>
        <button id="zoomOut" title="Zoom out (−)">
          −
        </button>
        <span id="zoomPct">100%</span>
        <button id="zoomIn" title="Zoom in (+)">
          +
        </button>
        <button id="zoomFit" title="Fit (0)">
          Fit
        </button>
        <button
          type="button"
          className="reorg-btn"
          id="reorgBtn"
          title="Auto-reorganize this chart. Drag any box to pin a new place."
        >
          Reorganize
        </button>
      </div>
    </header>
  );
}
