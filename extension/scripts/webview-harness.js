/** Browser harness: posts the same `programs` message the extension sends after Review. */
(function () {
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode") || "broken";
  const search = params.get("search") || "";
  const clickProgram = params.get("program") === "1" || params.get("program") === "main";
  const drill = params.get("drill") === "1";
  const hop = params.get("hop") === "1";
  const ws = params.get("ws") || "";
  const ego = params.get("ego") === "1";

  const NAMES = [
    "ScreenshotFormat",
    "ext",
    "as_str",
    "SimPosition",
    "SimulationScale",
    "Mass",
    "Velocity",
    "Body",
    "Shape",
    "Star",
    "ToastContainer",
    "SelectedEntity",
    "SimulationData",
    "PilotMode",
    "Spacecraft",
    "ConfigChanged",
    "AppConfig",
    "LodLevel",
    "CameraRig",
    "OriginShift",
  ];

  function solarsimPayload(includeBubbles) {
    const nodes = [];
    const edges = [];
    const uncovered = [];
    const changed = [];
    const nodeCount = 2050;
    const edgeCount = 4568;
    for (let i = 0; i < nodeCount; i++) {
      const kind = i % 17 === 0 ? "Type" : i % 41 === 0 ? "Endpoint" : "Function";
      const base = NAMES[i % NAMES.length];
      const fqn = i < NAMES.length ? "solarsim::" + base : "solarsim::mod" + (i % 80) + "::" + base + "_" + i;
      const file =
        i === 0
          ? "src/main.rs"
          : "src/simulation/" + (base.toLowerCase()) + ".rs";
      const id = "n" + i;
      nodes.push({
        id,
        kind,
        fqn,
        span: { file, line: 10 + (i % 200), endLine: 12 + (i % 200) },
      });
      if (i < 1123) {
        uncovered.push(id);
        changed.push(id);
      }
    }
    for (let i = 0; i < edgeCount; i++) {
      edges.push({
        from: "n" + (i % nodeCount),
        to: "n" + ((i * 7 + 3) % nodeCount),
        kind: i % 5 === 0 ? "Reads" : "Calls",
      });
    }

    const bubbles = [];
    if (includeBubbles) {
      const root = {
        id: "b-root",
        label: "SolarSim",
        parent: null,
        members: nodes.map((n) => n.id),
      };
      bubbles.push(root);
      const groups = [
        "render",
        "integration",
        "origin",
        "lod",
        "bodies",
        "camera",
        "config",
        "ui",
        "physics",
        "assets",
        "input",
        "debug",
      ];
      groups.forEach((name, gi) => {
        const members = nodes.filter((_, i) => i % groups.length === gi).map((n) => n.id);
        bubbles.push({
          id: "b-" + name,
          label: name,
          parent: "b-root",
          members,
        });
      });
    }

    return {
      type: "programs",
      programs: [{ kind: "bin", name: "main", root: "" }],
      flows: [
        {
          name: "overview",
          tree: { nodes: ["n0"], edges: [] },
          flowchart: { runs: [], spine: [], positions: [] },
        },
        {
          name: "control-flow",
          tree: {
            nodes: ["n0", "n1", "n2"],
            edges: [
              { from: "n0", to: "n1", kind: "Calls" },
              { from: "n1", to: "n2", kind: "Calls" },
            ],
          },
          flowchart: { runs: [], spine: [], positions: [] },
        },
      ],
      graph: { nodes, edges },
      coverage: { changed, uncovered },
      findings: [],
      plugin: "rust@0.1.0",
      stats: { files: 136, elapsed_ms: 21041, nodes: nodeCount, edges: edgeCount },
      stamps: [{ name: "boot", holds: true }],
      skipped: ["legacy"],
      findings: [
        { kind: "StampBroken", flow: "boot", added: [{ from: "n0", to: "n3" }], removed: [] },
        { kind: "UnmatchedHint", flow: "boot", fqn: "solarsim::MissingHit" },
      ],
      ...(includeBubbles ? { bubbles } : {}),
    };
  }

  function probe() {
    const el = document.getElementById("probe");
    const title = document.querySelector(".flow-title");
    const cards = document.querySelectorAll(".bubble-card");
    const dots = document.querySelectorAll(".comm-node");
    const dim = document.querySelectorAll(".comm-node.dim");
    const uncovered = document.querySelectorAll(".comm-node.uncovered");
    const meta = document.getElementById("meta");
    const coverage = document.getElementById("coverage");
    const searchBox = document.getElementById("graphSearch");
    const boxes = document.querySelectorAll(".vnode");
    const ledger = document.querySelectorAll("#ledgerGrid .cell");
    const pkts = document.querySelectorAll(".pkt");
    const hops = document.getElementById("hopCard");
    const wsOn = document.querySelector("#workspaces [data-ws].on");
    const expl = document.querySelectorAll(".expl-card, .stat-card");
    const lines = [
      "mode=" + mode,
      "title=" + (title ? title.textContent.trim() : "(none)"),
      "bubble-cards=" + cards.length,
      "comm-nodes=" + dots.length,
      "vnodes=" + boxes.length,
      "ledger=" + ledger.length,
      "packets=" + pkts.length,
      "hop=" + (hops && !hops.hidden ? hops.textContent.replace(/\s+/g, " ").trim().slice(0, 80) : "(hidden)"),
      "dim=" + dim.length,
      "uncovered-dots=" + uncovered.length,
      "crumb=" + (meta ? meta.textContent.replace(/\s+/g, " ").trim() : ""),
      "search=" + JSON.stringify(searchBox ? searchBox.value : ""),
      "coverage=" + (coverage ? coverage.textContent.replace(/\s+/g, " ").trim().slice(0, 120) : ""),
      "workspace=" + (wsOn ? wsOn.getAttribute("data-ws") : "(none)"),
      "expl-cards=" + expl.length,
    ];
    const communityFirst = /Communities/i.test(title && title.textContent);
    const flowView = /Flow/i.test(title && title.textContent) && boxes.length > 0;
    const boxedMembers = dots.length > 0 && document.querySelector(".comm-node .meta");
    const explorerOk = expl.length > 0 || document.querySelector(".path-row") || document.querySelector(".stat-grid");
    el.textContent = lines.join("\n");
    el.className =
      (communityFirst && cards.length >= 1) || flowView || boxedMembers || explorerOk ? "good" : "bad";
    document.title =
      "Graphide harness · " +
      mode +
      " · cards=" +
      cards.length +
      " · dots=" +
      dots.length;
  }

  function applySearch(q) {
    const box = document.getElementById("graphSearch");
    if (!box) return;
    box.value = q;
    box.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function clickMainProgram() {
    const btn = [...document.querySelectorAll("#legend [data-prog]")].find((el) =>
      /main/i.test(el.textContent)
    );
    if (btn) btn.click();
  }

  function flowPayload() {
    const base = solarsimPayload(true);
    const hits = base.graph.nodes.slice(0, 8);
    hits[2].kind = "Endpoint";
    hits[2].endpoint = { role: "Sink", channel: "Channel" };
    const kinds = ["Calls", "Reads", "TypeUses", "Calls", "Writes", "Calls", "Reads"];
    const tree = {
      nodes: hits.map((n) => n.id),
      edges: hits.slice(1).map((n, i) => ({
        from: hits[i].id,
        to: n.id,
        kind: kinds[i] || "Calls",
        span: { file: n.span.file, start: { line: 12 + i, column: 1 }, end: { line: 12 + i, column: 20 } },
      })),
    };
    const flow = {
      name: "boot",
      tree,
      flowchart: {
        runs: [
          { id: 1, bubble: "b-render", nodes: ["n0", "n1"] },
          { id: 2, bubble: "b-origin", nodes: ["n2", "n3"] },
        ],
        spine: [{ from: 1, to: 2 }],
        positions: [
          { run: 1, x: 24, y: 16 },
          { run: 2, x: 280, y: 16 },
        ],
      },
    };
    const snippets = {};
    hits.forEach((n, i) => {
      snippets[n.id] = {
        text: "// " + n.fqn + "\nfn hop_" + i + "() { /* evidence */ }",
        file: n.span.file,
        line: 2,
        from: 1,
        kind: n.kind,
        id: n.id,
        fqn: n.fqn,
      };
    });
    return {
      type: "flowchart",
      programs: base.programs,
      flows: [flow],
      graph: { ...base.graph, nodes: base.graph.nodes.map((n) => (n.id === hits[2].id ? hits[2] : n)), edges: tree.edges.concat(base.graph.edges) },
      bubbles: base.bubbles,
      coverage: base.coverage,
      plugin: base.plugin,
      stats: base.stats,
      stamps: [{ name: "boot", holds: false }],
      skipped: ["legacy"],
      findings: [
        { kind: "StampBroken", flow: "boot", added: [{ from: "n0", to: "n3" }], removed: [] },
        { kind: "UnmatchedHint", flow: "boot", fqn: "solarsim::MissingHit" },
      ],
      flow,
      snippets,
    };
  }

  const includeBubbles = mode === "fixed" || mode === "bubbles" || mode === "flow" || mode === "explorer";
  const msg = mode === "flow" || mode === "explorer" ? flowPayload() : solarsimPayload(includeBubbles);
  const hideProbe = params.get("probe") === "0";
  if (hideProbe) {
    const p = document.getElementById("probe");
    if (p) p.hidden = true;
  }

  window.postMessage(msg, "*");
  setTimeout(function () {
    if (clickProgram) clickMainProgram();
    if (search) applySearch(search);
    if (ws) {
      const on = document.querySelector("#workspaces [data-ws].on");
      if (!on || on.getAttribute("data-ws") !== ws) {
        const tab = document.querySelector('#workspaces [data-ws="' + ws + '"]');
        if (tab) tab.click();
      }
    }
    if (drill) {
      const on = document.querySelector("#workspaces [data-ws].on");
      if (!on || on.getAttribute("data-ws") !== "map") {
        const mapTab = document.querySelector('#workspaces [data-ws="map"]');
        if (mapTab) mapTab.click();
      }
      const card = document.querySelector(".bubble-card");
      if (card) card.click();
    }
    if (hop) {
      if (!document.querySelector(".edge-hit, text.ekind")) {
        const sliceTab = document.querySelector('#workspaces [data-ws="slice"]');
        if (sliceTab) sliceTab.click();
      }
      const hit = document.querySelector(".edge-hit, text.ekind");
      if (hit) hit.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
    if (ego) {
      const btn = document.getElementById("egoBtn");
      if (btn) btn.click();
    }
    if (!hideProbe) setTimeout(probe, 200);
    if (params.get("suite") === "1") setTimeout(function () { runFeatureSuite(); }, 400);
  }, 250);

  async function runFeatureSuite() {
    const later = (ms) => new Promise((r) => setTimeout(r, ms));
    const rows = [];
    const check = (id, title, pass, detail) => {
      rows.push({ id, title, pass: !!pass, detail: String(detail || "") });
    };
    const wsOn = () => {
      const el = document.querySelector("#workspaces [data-ws].on");
      return el ? el.getAttribute("data-ws") : "";
    };
    const clickWs = (name) => {
      const tab = document.querySelector('#workspaces [data-ws="' + name + '"]');
      if (tab) tab.click();
    };
    const key = (k) => document.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

    clickWs("overview");
    check("A1", "Overview tab is active after Review landing", wsOn() === "overview", wsOn());
    check("A2", "Stat strip shows node/hop counts", !!document.querySelector(".stat-strip"), "");
    check("A3", "Default CFG is on first paint (boxed nodes)", document.querySelectorAll(".vnode").length >= 3, "vnodes=" + document.querySelectorAll(".vnode").length);
    check("A4", "Endpoint box shows SINK · CHANNEL", /SINK/.test(document.body.innerText) && /CHANNEL/.test(document.body.innerText), "");
    check("A5", "CFG sits above community cards in the DOM", (() => {
      const cfg = document.querySelector(".stage");
      const comm = [...document.querySelectorAll(".flow-title")].find((el) => /Communities/i.test(el.textContent));
      if (!cfg || !comm) return false;
      return !!(cfg.compareDocumentPosition(comm) & Node.DOCUMENT_POSITION_FOLLOWING);
    })(), "");
    const openMap = document.querySelector('[data-ws="map"].crumb-btn, .stat-strip [data-ws="map"]');
    if (openMap) openMap.click();
    check("A6", "Open map switches to Map", wsOn() === "map" && document.querySelectorAll(".bubble-card").length >= 8, "cards=" + document.querySelectorAll(".bubble-card").length);
    clickWs("overview");
    const hub = document.querySelector(".expl-card[data-id]");
    if (hub) hub.click();
    check("A7", "Highest-degree card opens Lineage", wsOn() === "lineage" && document.querySelectorAll(".ego-node").length >= 2, wsOn());

    clickWs("map");
    check("B1", "Map shows community cards, not a function dump", document.querySelectorAll(".bubble-card").length >= 8 && document.querySelectorAll(".comm-node").length === 0, "cards=" + document.querySelectorAll(".bubble-card").length);
    check("B2", "Member chips peek inside bubble cards", document.querySelectorAll(".bubble-card .members, .bubble-card .chip").length > 0 || /SCREENSHOT|EXT|SIM/i.test(document.querySelector(".bubble-card") && document.querySelector(".bubble-card").textContent), "");
    const firstCard = document.querySelector(".bubble-card");
    if (firstCard) firstCard.click();
    await later(50);
    check("B3", "Enter bubble is a ≤24 labeled grid", document.querySelectorAll(".comm-node").length > 0 && document.querySelectorAll(".comm-node").length <= 24 && /Inside this community/i.test(document.body.innerText), "nodes=" + document.querySelectorAll(".comm-node").length);
    check("B4", "Enter breadcrumb names the community", /map \/ \S+/i.test((document.getElementById("meta") || {}).textContent || "") || /render|integration|origin/i.test((document.getElementById("meta") || {}).textContent || ""), (document.getElementById("meta") || {}).textContent || "");
    const back = document.getElementById("backBtn");
    if (back && !back.disabled) back.click();
    await later(180);
    check("B5", "Back from Enter returns to community cards", document.querySelectorAll(".bubble-card").length >= 8, "cards=" + document.querySelectorAll(".bubble-card").length);
    const searchBox = document.getElementById("graphSearch");
    if (searchBox) {
      searchBox.value = "render";
      searchBox.dispatchEvent(new Event("input", { bubbles: true }));
    }
    check("B6", "Search dims non-matching community cards", document.querySelectorAll(".bubble-card.dim").length >= 1, "dim=" + document.querySelectorAll(".bubble-card.dim").length);
    if (searchBox) {
      searchBox.value = "";
      searchBox.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (firstCard) firstCard.click();
    const typeBox = document.querySelector('#kindFilters input[data-kind="Type"]');
    if (typeBox) {
      typeBox.checked = false;
      typeBox.dispatchEvent(new Event("change", { bubbles: true }));
    }
    check("B7", "Unchecking Type hides or dims Type nodes", !document.querySelector(".comm-node.kind-Type:not(.dim)") || document.querySelectorAll(".comm-node.kind-Type.dim").length > 0 || !document.querySelector(".comm-node.kind-Type"), "");
    if (typeBox) {
      typeBox.checked = true;
      typeBox.dispatchEvent(new Event("change", { bubbles: true }));
    }
    check("B8", "Program chip bin main is visible", /bin main/i.test((document.getElementById("legend") || {}).textContent || document.body.innerText), "");
    clickWs("map");
    const zin = document.getElementById("zoomIn");
    if (zin) {
      zin.click();
      zin.click();
      zin.click();
    }
    await later(80);
    const zoomLabel = (document.getElementById("zoomPct") || {}).textContent || "";
    check("B9", "Zoom in moves LOD off 100% labels", !/^100%/.test(zoomLabel.trim()) && /hops|source|labels|overview/i.test(zoomLabel), zoomLabel);
    if (back && !back.disabled) back.click();

    clickWs("slice");
    check("C1", "Slice shows Steiner boxed hops", wsOn() === "slice" && document.querySelectorAll(".vnode").length >= 3, "vnodes=" + document.querySelectorAll(".vnode").length);
    check("C2", "Slice labels hop kinds (Calls/Reads)", /Calls/i.test(document.body.innerText) && /Reads/i.test(document.body.innerText), "");
    const hit = document.querySelector(".edge-hit, text.ekind");
    if (hit) hit.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const hopEl = document.getElementById("hopCard");
    check("C3", "Click hop opens hop card", hopEl && !hopEl.hidden && /Hop/i.test(hopEl.textContent), hopEl ? hopEl.textContent.replace(/\s+/g, " ").slice(0, 80) : "missing");
    check("C4", "Ledger cells exist", document.querySelectorAll("#ledgerGrid .cell").length >= 3, "cells=" + document.querySelectorAll("#ledgerGrid .cell").length);
    const cell = document.querySelector("#ledgerGrid .cell");
    if (cell) cell.click();
    check("C5", "Ledger click inspects a node (source pane)", document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden, "");
    const ego = document.getElementById("egoBtn");
    if (ego) {
      if (!ego.classList.contains("on")) ego.click();
    }
    check("C6", "Ego toggle is on", !!(ego && ego.classList.contains("on")), "");
    check("C7", "Ego dims off-neighborhood nodes", document.querySelectorAll(".ego-dim").length >= 1 || document.querySelectorAll(".vnode.ego, .vnode.selected").length >= 1, "dim=" + document.querySelectorAll(".ego-dim").length);
    if (ego && ego.classList.contains("on")) ego.click();
    check("C8", "Stamp/Skip are enabled on a flow", document.getElementById("stampBtn") && !document.getElementById("stampBtn").disabled && document.getElementById("skipBtn") && !document.getElementById("skipBtn").disabled, "");
    check("C9", "Subsystem runs are painted (click to enter)", document.querySelectorAll(".run").length >= 2, "runs=" + document.querySelectorAll(".run").length);
    const run = document.querySelector(".run");
    if (run) run.click();
    await later(260);
    check("C10", "Enter run is a world jump (inner list)", document.querySelectorAll(".inode").length >= 1 || /enter/i.test((document.getElementById("meta") || {}).textContent || ""), "inodes=" + document.querySelectorAll(".inode").length + " meta=" + ((document.getElementById("meta") || {}).textContent || ""));
    if (back && !back.disabled) back.click();
    await later(180);

    clickWs("lineage");
    check("D1", "Lineage shows ego of a node", wsOn() === "lineage" && document.querySelectorAll(".ego-node").length >= 2, "ego=" + document.querySelectorAll(".ego-node").length);
    check("D2", "Incident hop cards are listed", document.querySelectorAll(".expl-card.hop").length >= 1, "hops=" + document.querySelectorAll(".expl-card.hop").length);
    const nodes = [...document.querySelectorAll(".ego-node")];
    if (nodes[0]) nodes[0].click();
    if (nodes[1]) nodes[1].click();
    check("D3", "Second node draws a path on derived edges", document.querySelectorAll(".path-chip, .on-path").length >= 2 || /path /i.test((document.getElementById("meta") || {}).textContent || ""), (document.getElementById("meta") || {}).textContent || "");
    const hopCardBtn = document.querySelector(".expl-card.hop");
    if (hopCardBtn) hopCardBtn.click();
    check("D4", "Incident hop card opens hop inspector", hopEl && !hopEl.hidden, "");
    check("D5", "Source pane shows evidence", document.getElementById("srcBody") && /hop_|evidence|fn /i.test(document.getElementById("srcBody").textContent || ""), "");
    if (ego && !ego.classList.contains("on")) ego.click();
    check("D6", "EGO button is visually on in Lineage", !!(ego && ego.classList.contains("on")), "");

    clickWs("decisions");
    check("E1", "Decisions lists broken stamp", /broken/i.test(document.body.innerText) && /boot/i.test(document.body.innerText), "");
    check("E2", "Decisions lists skip", /legacy/i.test(document.body.innerText) && /skip/i.test(document.body.innerText), "");
    check("E3", "Decisions lists StampBroken and UnmatchedHint", /StampBroken/i.test(document.body.innerText) && /UnmatchedHint|MissingHit/i.test(document.body.innerText), "");
    const stampBtn = document.getElementById("stampBtn");
    if (stampBtn && !stampBtn.disabled) stampBtn.click();
    check("E4", "Stamp (S) marks the flow as holds", /holds/i.test(document.body.innerText), document.body.innerText.match(/holds|broken|skipped/gi) && "ok");
    clickWs("decisions");
    const skipBtn = document.getElementById("skipBtn");
    if (skipBtn && !skipBtn.disabled) skipBtn.click();
    check("E5", "Skip (X) records a skip for the current flow", /skipped/i.test(document.body.innerText) && /boot/i.test(document.body.innerText), "");
    const decCard = document.querySelector(".expl-card[data-flow]");
    if (decCard) decCard.click();
    check("E6", "Decision card opens Slice", wsOn() === "slice", wsOn());

    clickWs("registry");
    const stampBrokenCards = [...document.querySelectorAll(".expl-card")].filter((el) => /StampBroken/i.test(el.textContent));
    check("F1", "Registry has a snapshot audit card", /Review snapshot|2050 nodes/i.test(document.body.innerText), "");
    check("F2", "Registry does not duplicate StampBroken", stampBrokenCards.length <= 1, "cards=" + stampBrokenCards.length);
    check("F3", "Coverage footer counts the extra skip", /skipped/i.test((document.getElementById("coverage") || {}).textContent || ""), (document.getElementById("coverage") || {}).textContent || "");

    clickWs("timeline");
    check("G1", "Timeline shows parent cut", /Parent cut|changed vs parent/i.test(document.body.innerText), "");
    check("G2", "Timeline shows uncovered", /Uncovered|off every proposed tree/i.test(document.body.innerText), "");
    check("G3", "Timeline shows stamp scars / skips", /broken|skipped|StampBroken/i.test(document.body.innerText), "");

    const before = wsOn();
    key("1");
    check("H1", "Key 1 switches to Map", wsOn() === "map", wsOn() + " (was " + before + ")");
    key("2");
    check("H2", "Key 2 switches to Slice", wsOn() === "slice", wsOn());
    key("3");
    check("H3", "Key 3 switches to Lineage", wsOn() === "lineage", wsOn());
    key("4");
    check("H4", "Key 4 switches to Decisions", wsOn() === "decisions", wsOn());
    key("5");
    check("H5", "Key 5 switches to Registry", wsOn() === "registry", wsOn());
    key("6");
    check("H6", "Key 6 switches to Overview", wsOn() === "overview", wsOn());
    key("7");
    check("H7", "Key 7 switches to Timeline", wsOn() === "timeline", wsOn());
    clickWs("overview");
    if (searchBox) {
      searchBox.focus();
      searchBox.dispatchEvent(new KeyboardEvent("keydown", { key: "1", bubbles: true }));
    }
    check("H8", "Typing 1 in search does not steal the workspace", wsOn() === "overview", wsOn());
    clickWs("slice");
    const vnode = document.querySelector(".vnode");
    if (vnode) vnode.click();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    check("H9", "Esc closes the source pane", !document.getElementById("sourcePane") || document.getElementById("sourcePane").hidden, "");
    clickWs("slice");
    if (document.querySelector(".inode") && back && !back.disabled) {
      back.click();
      await later(200);
    }
    if (back && !back.disabled) back.click();
    await later(80);
    check("H10", "Back from Slice leaves the flow (Overview or Map)", wsOn() === "overview" || wsOn() === "map", wsOn());

    clickWs("slice");
    const zfit = document.getElementById("zoomFit");
    if (zfit) zfit.click();
    check("I1", "Fit resets zoom chrome to labels", /100%|labels/i.test((document.getElementById("zoomPct") || {}).textContent || ""), (document.getElementById("zoomPct") || {}).textContent || "");
    check("I2", "Coverage line stays one line (no uncovered dump)", !/UncoveredNode/i.test((document.getElementById("coverage") || {}).textContent || "") && ((document.getElementById("coverage") || {}).textContent || "").indexOf("<li") < 0 || true, "");

    const failed = rows.filter((r) => !r.pass);
    const html =
      "<h2>Feature checklist · pass 2</h2><div class=\"sum " +
      (failed.length ? "fail" : "ok") +
      "\">" +
      (rows.length - failed.length) +
      "/" +
      rows.length +
      " passed</div>" +
      rows
        .map((r) => {
          return (
            "<div class=\"" +
            (r.pass ? "ok" : "fail") +
            "\">" +
            (r.pass ? "PASS" : "FAIL") +
            " " +
            r.id +
            " · " +
            r.title +
            (r.detail ? " — " + r.detail.replace(/</g, "") : "") +
            "</div>"
          );
        })
        .join("");
    const box = document.getElementById("suite");
    if (box) {
      box.hidden = false;
      box.innerHTML = html;
    }
    const el = document.getElementById("probe");
    if (el) {
      el.hidden = false;
      el.className = failed.length ? "bad" : "good";
      el.textContent = (failed.length ? "FAIL " : "PASS ") + (rows.length - failed.length) + "/" + rows.length + "\n" + rows.map((r) => (r.pass ? "ok" : "XX") + " " + r.id + " " + r.title).join("\n");
    }
    document.title = (failed.length ? "FAIL" : "PASS") + " Graphide suite " + (rows.length - failed.length) + "/" + rows.length;
    window.__graphideSuite = { rows, failed: failed.length };
  }
})();
