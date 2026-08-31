export function LlmPane() {
  return (
    <aside id="llmPane" hidden>
      <div className="llm-head">
        <b>Ask</b>
        <span id="llmStatus">No host yet — graph answers still work. Agents never stamp.</span>
        <button type="button" id="llmClose" title="Close Ask">
          Close
        </button>
      </div>
      <form id="llmConnect" className="llm-connect">
        <label>
          Host
          <select id="llmPreset">
            <option value="ollama">Local Ollama · 11434</option>
            <option value="lmstudio">Local LM Studio · 1234</option>
            <option value="llamacpp">Local llama.cpp · 8080</option>
            <option value="openai">OpenAI</option>
            <option value="custom">Custom URL</option>
          </select>
        </label>
        <label>
          Base URL
          <input id="llmBaseUrl" type="url" spellCheck={false} placeholder="http://127.0.0.1:11434/v1" />
        </label>
        <label>
          Model
          <input id="llmModel" type="text" spellCheck={false} placeholder="llama3.2" />
        </label>
        <label>
          API key
          <input id="llmKey" type="password" spellCheck={false} placeholder="empty for most local hosts" />
        </label>
        <div className="llm-actions">
          <button type="button" id="llmSave">
            Save host
          </button>
          <button type="button" id="llmTest">
            Test
          </button>
          <button type="button" id="llmShowKey">
            Copy bridge key
          </button>
        </div>
        <div id="llmBridge" className="llm-bridge">
          Bridge off until Review view loads.
        </div>
      </form>
      <div id="llmLog" className="llm-log" />
      <div className="llm-ask-row">
        <textarea id="llmAsk" rows={2} placeholder="Ask the start → features → end path, a hop, or coverage…" />
        <button type="button" id="llmSend">
          Ask
        </button>
      </div>
    </aside>
  );
}
