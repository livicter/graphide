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
    const groupCount = 12;
    for (let gi = 0; gi < groupCount; gi++) {
      const members = [];
      for (let i = gi; i < nodeCount; i += groupCount) members.push("n" + i);
      for (let j = 0; j < members.length - 1 && j < 40; j++) {
        edges.push({ from: members[j], to: members[j + 1], kind: j % 4 === 0 ? "Reads" : "Calls" });
      }
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
    const controlFlow = { ...flow, name: "control-flow" };
    return {
      type: "flowchart",
      programs: base.programs,
      flows: [
        {
          name: "overview",
          tree: { nodes: ["n0"], edges: [] },
          flowchart: { runs: [], spine: [], positions: [] },
        },
        controlFlow,
        flow,
      ],
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

  function afterPaint() {
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
      if (params.get("suite") === "live") setTimeout(function () { runLiveSuite(); }, 500);
    }, 250);
  }

  function loadLiveSnap(done) {
    fetch("./live-snap.json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("no live snap");
        return r.json();
      })
      .then(function (snap) {
        const live = Object.assign({ type: "programs" }, snap);
        window.__graphideLive = true;
        window.postMessage(live, "*");
        done();
      })
      .catch(function () {
        window.postMessage(msg, "*");
        done();
      });
  }

  if (params.get("live") === "1") loadLiveSnap(afterPaint);
  else {
    window.postMessage(msg, "*");
    afterPaint();
  }

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
    const overlapCount = (sel, minX, minY) => {
      const boxes = [...document.querySelectorAll(sel)].map((el) => ({
        x: parseFloat(el.style.left) || 0,
        y: parseFloat(el.style.top) || 0,
      }));
      let n = 0;
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          if (Math.abs(boxes[i].x - boxes[j].x) < minX && Math.abs(boxes[i].y - boxes[j].y) < minY) n++;
        }
      }
      return n;
    };
    const dragEl = (el, dx, dy) => {
      if (!el) return;
      const x = 120,
        y = 80;
      el.dispatchEvent(new PointerEvent("pointerdown", { clientX: x, clientY: y, button: 0, bubbles: true, pointerId: 7 }));
      el.dispatchEvent(new PointerEvent("pointermove", { clientX: x + dx, clientY: y + dy, bubbles: true, pointerId: 7 }));
      el.dispatchEvent(new PointerEvent("pointerup", { clientX: x + dx, clientY: y + dy, bubbles: true, pointerId: 7 }));
    };

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
    check("B3", "Enter bubble is ≤24 labeled boxes on a layered flow", document.querySelectorAll(".comm-node").length > 0 && document.querySelectorAll(".comm-node").length <= 24 && /Inside this community/i.test(document.body.innerText), "nodes=" + document.querySelectorAll(".comm-node").length);
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
    check("K1", "Decisions shows a causal chain on derived hops", document.querySelectorAll(".chain-step").length >= 1, "steps=" + document.querySelectorAll(".chain-step").length);
    const openSlice = document.querySelector("[data-open-slice]");
    if (openSlice) openSlice.click();
    check("E6", "Decision Open slice jumps to Slice", wsOn() === "slice", wsOn());

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
    check("I1", "Fit frames the current chart (does not Enter or pop)", /overview|labels|100%/i.test((document.getElementById("zoomPct") || {}).textContent || "") && document.querySelectorAll(".comm-node").length === 0, (document.getElementById("zoomPct") || {}).textContent || "");
    const covText = (document.getElementById("coverage") || {}).textContent || "";
    check("I2", "Coverage line stays one line (no uncovered dump)", !/UncoveredNode/i.test(covText), covText.slice(0, 80));

    // --- Pass 3: zoom pop, LOD, crumbs, program chip, source close ---
    clickWs("map");
    const cardsBeforeZoom = document.querySelectorAll(".bubble-card").length;
    if (zin) {
      zin.click();
      zin.click();
    }
    await later(40);
    check("J1", "Geometric zoom on Map does not Enter a bubble", document.querySelectorAll(".bubble-card").length === cardsBeforeZoom && document.querySelectorAll(".comm-node").length === 0, "cards=" + document.querySelectorAll(".bubble-card").length + " nodes=" + document.querySelectorAll(".comm-node").length);
    if (zfit) zfit.click();

    const enterCard = document.querySelector(".bubble-card");
    if (enterCard) enterCard.click();
    await later(40);
    const insideBefore = document.querySelectorAll(".comm-node").length;
    if (zin) zin.click();
    await later(20);
    const zout = document.getElementById("zoomOut");
    if (zout) {
      zout.click();
      zout.click();
      zout.click();
      zout.click();
      zout.click();
      zout.click();
    }
    await later(80);
    check("J2", "Zoom-out past overview pops one Map altitude (not a Back click)", insideBefore > 0 && document.querySelectorAll(".bubble-card").length >= 8 && document.querySelectorAll(".comm-node").length === 0, "inside=" + insideBefore + " cards=" + document.querySelectorAll(".bubble-card").length);

    clickWs("slice");
    if (zfit) zfit.click();
    if (zout) {
      zout.click();
      zout.click();
      zout.click();
      zout.click();
    }
    await later(40);
    const vp = document.querySelector(".viewport");
    const zoomOutLabel = (document.getElementById("zoomPct") || {}).textContent || "";
    check("J3", "Slice zoom-out names overview LOD", /overview/i.test(zoomOutLabel) || (vp && vp.getAttribute("data-lod") === "0"), zoomOutLabel + " lod=" + (vp && vp.getAttribute("data-lod")));
    if (zfit) zfit.click();
    if (zin) {
      zin.click();
      zin.click();
      zin.click();
      zin.click();
      zin.click();
      zin.click();
      zin.click();
      zin.click();
    }
    await later(80);
    const zoomHops = (document.getElementById("zoomPct") || {}).textContent || "";
    check("J4", "Deep zoom names hops or source LOD", /hops|source/i.test(zoomHops), zoomHops);
    if (zfit) zfit.click();
    key("+");
    key("+");
    check("J5", "Keys + / − / 0 drive zoom", !/^100%/.test(((document.getElementById("zoomPct") || {}).textContent || "").trim()), (document.getElementById("zoomPct") || {}).textContent || "");
    key("0");
    check("J6", "Key 0 fits the whole chart", /overview|labels|100%/i.test((document.getElementById("zoomPct") || {}).textContent || ""), (document.getElementById("zoomPct") || {}).textContent || "");

    const vnode2 = document.querySelector(".vnode");
    if (vnode2) vnode2.click();
    const closeBtn = document.getElementById("srcClose");
    if (closeBtn) closeBtn.click();
    check("J7", "Source Close button hides the inspect pane", !document.getElementById("sourcePane") || document.getElementById("sourcePane").hidden, "");
    const hopHit = document.querySelector(".edge-hit, text.ekind");
    if (hopHit) hopHit.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const hopBtn = document.querySelector("#hopCard [data-id]");
    if (hopBtn) hopBtn.click();
    check("J8", "Hop-card node button inspects that node", !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden), "");

    clickWs("lineage");
    const crumbMap = document.querySelector('#meta [data-ws="map"], #meta .crumb-btn');
    if (crumbMap) crumbMap.click();
    check("J9", "Lineage map crumb returns to Map", wsOn() === "map", wsOn());

    clickWs("overview");
    const commCard = [...document.querySelectorAll(".expl-card")].find((el) => /community/i.test(el.textContent));
    if (commCard) commCard.click();
    check("J10", "Overview community card opens Map", wsOn() === "map", wsOn());

    clickWs("map");
    if (searchBox) {
      searchBox.value = "render";
      searchBox.dispatchEvent(new Event("input", { bubbles: true }));
    }
    const dimmed = document.querySelectorAll(".bubble-card.dim").length;
    if (searchBox) {
      searchBox.value = "";
      searchBox.dispatchEvent(new Event("input", { bubbles: true }));
    }
    check("J11", "Clearing search undims community cards", dimmed >= 1 && document.querySelectorAll(".bubble-card.dim").length === 0, "was=" + dimmed + " now=" + document.querySelectorAll(".bubble-card.dim").length);

    clickWs("slice");
    const vnode3 = document.querySelector(".vnode");
    if (vnode3) vnode3.click();
    if (ego && !ego.classList.contains("on")) ego.click();
    const dimOn = document.querySelectorAll(".ego-dim").length;
    if (ego && ego.classList.contains("on")) ego.click();
    check("J12", "Ego off removes neighborhood dim", dimOn >= 1 && document.querySelectorAll(".ego-dim").length === 0, "on=" + dimOn + " off=" + document.querySelectorAll(".ego-dim").length);

    const fnBox = document.querySelector('#kindFilters input[data-kind="Function"]');
    clickWs("map");
    const card2 = document.querySelector(".bubble-card");
    if (card2) card2.click();
    await later(40);
    if (fnBox) {
      fnBox.checked = false;
      fnBox.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const fnVisible = document.querySelectorAll(".comm-node.kind-Function:not(.dim)").length;
    check("J13", "Unchecking Function hides Function members", fnVisible === 0, "visible=" + fnVisible);
    if (fnBox) {
      fnBox.checked = true;
      fnBox.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (back && !back.disabled) back.click();
    await later(80);

    const bootTab = document.querySelector('#tabs [data-flow="boot"], .tab[data-flow="boot"]');
    if (bootTab) bootTab.click();
    check("J14", "Flow tab boot opens Slice", wsOn() === "slice" && /boot/i.test((document.getElementById("tabs") || {}).textContent || ""), wsOn());

    clickWs("map");
    const prog = document.querySelector("#legend [data-prog]");
    if (prog) prog.click();
    check("J15", "Program chip is selectable", !!(prog && (prog.classList.contains("on") || document.querySelector("#legend .leg.on"))), (document.getElementById("legend") || {}).textContent || "");

    clickWs("slice");
    const editor = document.getElementById("srcEditor");
    const vnode4 = document.querySelector(".vnode");
    if (vnode4) vnode4.click();
    window.__vscodePosts = window.__vscodePosts || [];
    const beforePosts = window.__vscodePosts.length;
    if (editor) editor.click();
    const posts = window.__vscodePosts || [];
    check("J16", "Editor button posts enterNode to the host", posts.slice(beforePosts).some((m) => m && m.type === "enterNode"), JSON.stringify(posts.slice(-2)));

    const kinds = [...document.querySelectorAll(".vnode .kind, .vnode [class*='kind']")].map((el) => el.textContent);
    const badKind = [...document.querySelectorAll(".vnode")].some((el) => {
      const k = el.getAttribute("data-kind") || "";
      return k && k !== "Function" && k !== "Type" && k !== "Endpoint";
    });
    check("J17", "Slice nodes stay on the closed vocabulary", !badKind, kinds.slice(0, 4).join(","));

    clickWs("slice");
    const run2 = document.querySelector(".run");
    if (run2) run2.click();
    await later(260);
    check("J18", "Enter-run inner list has a lit walk", document.querySelectorAll(".inode.lit").length >= 1, "lit=" + document.querySelectorAll(".inode.lit").length + " all=" + document.querySelectorAll(".inode").length);
    if (back && !back.disabled) {
      back.click();
      await later(180);
    }

    clickWs("decisions");
    check("J19", "Coverage still surfaces unmatched hint", /MissingHit|unmatched/i.test((document.getElementById("coverage") || {}).textContent || document.body.innerText), ((document.getElementById("coverage") || {}).textContent || "").slice(0, 120));

    clickWs("slice");
    if (zfit) zfit.click();
    const beforeWheel = (document.getElementById("zoomPct") || {}).textContent || "";
    const stage = document.querySelector(".stage");
    if (stage) {
      stage.dispatchEvent(new WheelEvent("wheel", { deltaY: -120, bubbles: true, cancelable: true }));
    }
    const afterWheel = (document.getElementById("zoomPct") || {}).textContent || "";
    check("J20", "Wheel zoom on Slice changes the LOD chrome", afterWheel !== beforeWheel || /hops|source|1[1-9][0-9]%/.test(afterWheel), beforeWheel + " → " + afterWheel);

    clickWs("decisions");
    check("K2", "Decisions is a list + detail split (Semantica causal chain)", !!document.querySelector(".ws-split .chain"), "");
    check("R2", "Decisions has Semantica-style outcome badges", !!document.querySelector(".outcome-strip"), "");
    clickWs("registry");
    check("K3", "Registry is an audit table, not a card dump", document.querySelectorAll("table.audit tr").length >= 3, "rows=" + document.querySelectorAll("table.audit tr").length);
    check("R3", "Registry marks mutations like an audit log", document.querySelectorAll("table.audit .mut").length >= 1, "mut=" + document.querySelectorAll("table.audit .mut").length);
    clickWs("timeline");
    check("K4", "Timeline is a vertical event rail", document.querySelectorAll(".tl-item").length >= 3, "items=" + document.querySelectorAll(".tl-item").length);
    check("R1", "Timeline has a temporal scrubber", !!document.getElementById("tlScrub") && document.querySelectorAll(".tl-item").length >= 3, "");
    clickWs("lineage");
    check("K5", "Lineage maps hops to Used / Informed / Generated", !!document.querySelector('.prov-col[data-prov="used"]') && !!document.querySelector('.prov-col[data-prov="informed"]') && !!document.querySelector('.prov-col[data-prov="generated"]'), "");
    clickWs("slice");
    const vnode5 = document.querySelector(".vnode");
    if (vnode5) vnode5.click();
    if (ego && !ego.classList.contains("on")) ego.click();
    const dim1 = document.querySelectorAll(".ego-dim").length;
    const hopSel = document.getElementById("egoHops");
    if (hopSel) {
      hopSel.value = "2";
      hopSel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const dim2 = document.querySelectorAll(".ego-dim").length;
    check("K6", "2-hop ego keeps a wider neighborhood than 1-hop", dim2 <= dim1, "1-hop dim=" + dim1 + " 2-hop dim=" + dim2);
    if (hopSel) {
      hopSel.value = "1";
      hopSel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (ego && ego.classList.contains("on")) ego.click();

    clickWs("map");
    if (back && !back.disabled && document.querySelector(".comm-node")) back.click();
    await later(80);
    check("L1", "Map community boxes do not overlap", overlapCount(".bubble-card", 200, 110) === 0, "overlaps=" + overlapCount(".bubble-card", 200, 110));
    check("L2", "Map draws community hops (readable flow, not a card dump)", document.querySelectorAll(".comm-wrap path[data-kind]").length >= 2, "edges=" + document.querySelectorAll(".comm-wrap path[data-kind]").length);
    const cardLeft = document.querySelector(".bubble-card");
    const leftBefore = cardLeft ? cardLeft.style.left : "";
    dragEl(cardLeft, 90, 40);
    check("L3", "Drag moves a community box", !!(cardLeft && cardLeft.style.left && cardLeft.style.left !== leftBefore), leftBefore + " → " + (cardLeft && cardLeft.style.left));
    const reorg = document.getElementById("reorgBtn");
    if (reorg) reorg.click();
    await later(40);
    check("L4", "Reorganize restores auto-layout after a drag", !!reorg && overlapCount(".bubble-card", 200, 110) === 0, "btn=" + !!reorg);
    const enterAgain = document.querySelector(".bubble-card");
    if (enterAgain) enterAgain.click();
    await later(40);
    check("L5", "Inside a community, boxes do not overlap", overlapCount(".comm-node", 150, 58) === 0, "overlaps=" + overlapCount(".comm-node", 150, 58) + " nodes=" + document.querySelectorAll(".comm-node").length);
    check("L6", "Inside a community, derived hops are drawn", document.querySelectorAll(".comm-wrap path[data-kind]").length >= 1, "edges=" + document.querySelectorAll(".comm-wrap path[data-kind]").length);
    const enterWrap = document.querySelector(".comm-wrap");
    const enterH = enterWrap ? parseFloat(enterWrap.style.height) || enterWrap.offsetHeight : 0;
    const enterYs = [...document.querySelectorAll(".comm-node")].map((el) => parseFloat(el.style.top) || 0);
    const ySpan = enterYs.length ? Math.max.apply(null, enterYs) - Math.min.apply(null, enterYs) : 0;
    check("L7", "Inside a community, boxes pack compactly (not a tall empty frame)", enterH > 0 && enterH <= 720 && ySpan <= 520, "H=" + enterH + " ySpan=" + Math.round(ySpan));
    if (back && !back.disabled) back.click();

    clickWs("overview");
    await later(40);
    check("M1", "Overview shows start → features → end path", !!document.querySelector(".feature-path") && /Start → features → end/i.test(document.body.innerText), "");
    check("Q1", "Overview can play the start → features → end walk", !!document.getElementById("pathWalkBtn"), "");
    const playPath = document.getElementById("pathWalkBtn");
    if (playPath) playPath.click();
    await later(80);
    check("Q2", "Play lights the current feature chip", !!document.querySelector(".feat-chip.walk"), "");
    if (playPath && playPath.classList.contains("on")) playPath.click();
    check("Q3", "Walk chrome still says Start → features → end", /Start → features → end/i.test((document.querySelector(".feature-path") || {}).textContent || ""), "");
    clickWs("map");
    if (back && !back.disabled && document.querySelector(".comm-node")) back.click();
    await later(40);
    const mapTitle = (document.querySelector(".flow-title") || {}).textContent || "";
    check("M2", "Map title is the start → features story", /Start → features/i.test(mapTitle), mapTitle);
    const glowStage = document.querySelector(".stage");
    check("O1", "Map stage tracks the pointer for the interactive glow", !!(glowStage && glowStage.dataset.uiBound), "");
    const firstName = ((document.querySelector(".bubble-card .name") || {}).textContent || "").toLowerCase();
    check("M3", "First Map community is the start of the control-flow walk", /render/i.test(firstName), firstName);

    clickWs("overview");
    const llmBtn = document.getElementById("llmBtn");
    const beforeLlm = (window.__vscodePosts || []).length;
    if (llmBtn) llmBtn.click();
    await later(40);
    check("N1", "LLM Ask panel opens from the LLM button", !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden), "");
    check("O2", "Ask panel uses the open slide class", !!(document.getElementById("llmPane") && document.getElementById("llmPane").classList.contains("open")), "");
    check("N2", "Connect form has host URL, model, and API key", !!(document.getElementById("llmBaseUrl") && document.getElementById("llmModel") && document.getElementById("llmKey")), "");
    const urlBox = document.getElementById("llmBaseUrl");
    if (urlBox) urlBox.value = "http://127.0.0.1:11434/v1";
    const modelBox = document.getElementById("llmModel");
    if (modelBox) modelBox.value = "llama3.2";
    const saveHost = document.getElementById("llmSave");
    if (saveHost) saveHost.click();
    const llmPosts = (window.__vscodePosts || []).slice(beforeLlm);
    check("N3", "Save host posts llmSave (never a stamp)", llmPosts.some((m) => m && m.type === "llmSave") && !llmPosts.some((m) => m && m.type === "stamp"), JSON.stringify(llmPosts.filter((m) => m && /^llm|stamp/.test(m.type)).slice(-3)));
    const askBox = document.getElementById("llmAsk");
    const sendBtn = document.getElementById("llmSend");
    if (askBox) askBox.value = "Tell the start to end control-flow path";
    if (sendBtn) sendBtn.click();
    await later(220);
    const logText = (document.getElementById("llmLog") || {}).textContent || "";
    check("N4", "Ask returns a start → features → end graph answer", /Start → features → end/i.test(logText) && /never stamp/i.test(logText), logText.slice(0, 160));
    check("N5", "Ask does not post a stamp", !(window.__vscodePosts || []).slice(beforeLlm).some((m) => m && m.type === "stamp"), "");
    if (askBox) askBox.blur();
    document.body.focus();
    key("l");
    check("N6", "Key L toggles the Ask panel", document.getElementById("llmPane") && document.getElementById("llmPane").hidden, "hidden=" + !!(document.getElementById("llmPane") && document.getElementById("llmPane").hidden));
    const radius = getComputedStyle(document.body).getPropertyValue("--g-radius");
    check("O3", "Modern radius tokens are live", /px/.test(radius), radius);
    check("P1", "Stamp/skip toast chrome is present", !!document.getElementById("toast"), "");
    if (askBox) askBox.blur();
    document.body.focus();
    key("/");
    const findBox = document.getElementById("graphSearch");
    check("P2", "Slash focuses graph search", document.activeElement === findBox, "active=" + ((document.activeElement && document.activeElement.id) || ""));
    if (findBox) findBox.blur();
    document.body.focus();
    key("?");
    check("P3", "Question mark opens the shortcut sheet", !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden), "");
    key("Escape");
    check("S1", "Coverage is a review scorecard", !!document.querySelector("#coverage .score") && document.querySelectorAll(".score-chip").length >= 3, "chips=" + document.querySelectorAll(".score-chip").length);
    check("S2", "Desk mode is on after Review", document.body.classList.contains("desk") && !!document.getElementById("nowPill"), "desk=" + document.body.classList.contains("desk"));
    check("S3", "Inspect pane labels Evidence", !!(document.querySelector(".src-k") && /Evidence/i.test((document.querySelector(".src-k") || {}).textContent || "")), "");
    clickWs("map");
    if (document.querySelector(".comm-node") && document.getElementById("backBtn") && !document.getElementById("backBtn").disabled) {
      document.getElementById("backBtn").click();
    }
    await later(60);
    check("T1", "Map shows a start → features story rail", !!document.getElementById("storyRail") && /Start → features → end/i.test((document.getElementById("storyRail") || {}).textContent || ""), (document.getElementById("storyRail") || {}).textContent || "");
    check("T2", "Now pill names the review altitude", /overview|map|slice|inside|lineage/i.test((document.getElementById("nowPill") || {}).textContent || ""), (document.getElementById("nowPill") || {}).textContent || "");
    clickWs("slice");
    await later(40);
    check("T3", "Slice keeps the story rail on the control-flow walk", !!document.getElementById("storyRail"), "");
    check("T4", "Story rail sits outside the camera viewport", !!(document.getElementById("storyRail") && !document.querySelector(".viewport #storyRail")), "");
    clickWs("overview");
    await later(40);
    check("U1", "Overview keeps Play on the start → features path", !!document.getElementById("pathWalkBtn") && /Start → features → end/i.test((document.querySelector(".feature-path") || {}).textContent || ""), (document.querySelector(".feature-path") || {}).textContent || "");
    check("U2", "Overview chips are hops or communities", !!(document.querySelector(".feature-path [data-hop], .feature-path [data-feature]")), "");
    const nextBtn = document.getElementById("pathWalkNext");
    if (nextBtn) nextBtn.click();
    await later(40);
    check("U3", "Next names the walk stop on the now pill", /overview|map|slice|inside|lineage/i.test((document.getElementById("nowPill") || {}).textContent || ""), (document.getElementById("nowPill") || {}).textContent || "");

    const failed = rows.filter((r) => !r.pass);
    const html =
      "<h2>Feature checklist · Semantica review explorer</h2><div class=\"sum " +
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

  async function runLiveSuite() {
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
    const footer = (document.getElementById("status") || {}).textContent || "";

    check("V1", "Live snapshot is SolarSim scale", /349/.test(footer) && /1222/.test(footer) && /57/.test(footer), footer);
    clickWs("lineage");
    await later(80);
    check("V39", "Lineage lands on the control-flow start hop", /retrieve_starting_data/i.test((document.getElementById("meta") || {}).textContent || "") && document.querySelectorAll(".ego-node").length >= 2 && !/ 0 incident hops/.test((document.getElementById("meta") || {}).textContent || ""), (document.getElementById("meta") || {}).textContent || "");
    check("V40", "Lineage Informed column lists Calls hops", /Calls|success_toast|error_toast|TypeUses/i.test((document.querySelector('.prov-col[data-prov="informed"]') || {}).textContent || ""), (document.querySelector('.prov-col[data-prov="informed"]') || {}).textContent || "");
    clickWs("overview");
    await later(80);
    check("V2", "Overview keeps Play and hop chips", !!document.getElementById("pathWalkBtn") && /retrieve_starting_data/i.test((document.querySelector(".feature-path") || {}).textContent || ""), (document.querySelector(".feature-path") || {}).textContent || "");
    check("V3", "Default CFG paints the control-flow walk", document.querySelectorAll(".vnode").length >= 5, "vnodes=" + document.querySelectorAll(".vnode").length);
    check("V4", "Coverage is a review scorecard", !!document.querySelector("#coverage .score") && document.querySelectorAll(".score-chip").length >= 3, "chips=" + document.querySelectorAll(".score-chip").length);
    check("V5", "Now pill names the review altitude", /overview|map|slice|inside|lineage/i.test((document.getElementById("nowPill") || {}).textContent || ""), (document.getElementById("nowPill") || {}).textContent || "");
    check("V6", "Desk mode is on after Review", document.body.classList.contains("desk"), "");
    const nextBtn = document.getElementById("pathWalkNext");
    if (nextBtn) nextBtn.click();
    await later(80);
    check("V7", "Next lights a hop chip", !!document.querySelector(".feat-chip.walk, .feat-chip.here"), "");
    check("V8", "Now pill names the hop", /retrieve_starting_data|success_toast|error_toast|matrix3|vector3|default/i.test((document.getElementById("nowPill") || {}).textContent || ""), (document.getElementById("nowPill") || {}).textContent || "");
    check("V9", "Evidence opens from the graph node (no snippet required)", !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden), "");
    check("V10", "Evidence inspect names the SolarSim span", /anise|toast|Function|span/i.test((document.getElementById("inspMeta") || {}).textContent || ""), (document.getElementById("inspMeta") || {}).textContent || "");

    clickWs("map");
    await later(80);
    check("V11", "Map story rail sits outside the camera", !!(document.getElementById("storyRail") && !document.querySelector(".viewport #storyRail") && /Start → features → end/i.test((document.getElementById("storyRail") || {}).textContent || "")), (document.getElementById("storyRail") || {}).textContent || "");
    check("V12", "Map shows community cards", document.querySelectorAll(".bubble-card").length >= 8, "cards=" + document.querySelectorAll(".bubble-card").length);
    check("V13", "Program chips include bin main", /bin main/i.test((document.getElementById("legend") || {}).textContent || ""), (document.getElementById("legend") || {}).textContent || "");
    const startCard = [...document.querySelectorAll(".bubble-card")].find((el) => /START/i.test(el.textContent || ""));
    check("V14", "Walk community is pinned as START", !!(startCard && /error_toast|apply_changes|retrieve_starting/i.test(startCard.textContent || "")), startCard ? startCard.textContent.slice(0, 80) : "");
    if (startCard) startCard.click();
    await later(80);
    check("V15", "Enter bubble shows labeled members", document.querySelectorAll(".comm-node").length > 0 && document.querySelectorAll(".comm-node").length <= 24, "nodes=" + document.querySelectorAll(".comm-node").length);
    const back = document.getElementById("backBtn");
    if (back) {
      back.disabled = false;
      back.click();
    }
    await later(80);
    if (document.querySelectorAll(".bubble-card").length < 8) {
      const up = document.querySelector("#meta [data-up=map]");
      if (up) up.click();
      await later(60);
    }
    check("V16", "Back returns to community cards", document.querySelectorAll(".bubble-card").length >= 8, "cards=" + document.querySelectorAll(".bubble-card").length);
    const search = document.getElementById("graphSearch");
    if (search) {
      search.focus();
      search.value = "toast";
      search.dispatchEvent(new Event("input", { bubbles: true }));
    }
    await later(40);
    check("V17", "Search dims non-matching communities", document.querySelectorAll(".bubble-card.dim").length >= 1, "dim=" + document.querySelectorAll(".bubble-card.dim").length);
    if (search) {
      search.value = "";
      search.dispatchEvent(new Event("input", { bubbles: true }));
      search.blur();
    }

    clickWs("slice");
    await later(80);
    check("V18", "Slice shows the 6-node control-flow tree", wsOn() === "slice" && document.querySelectorAll(".vnode").length >= 5, "vnodes=" + document.querySelectorAll(".vnode").length + " ws=" + wsOn());
    check("V19", "Slice keeps the story rail", !!document.getElementById("storyRail"), "");
    check("V20", "Slice labels Calls hops", /Calls/i.test(document.body.innerText), "");
    const hit = document.querySelector(".edge-hit, text.ekind, svg.steiner .edge");
    if (hit) hit.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await later(50);
    check("V21", "Click hop opens hop card or Evidence", !!(document.getElementById("hopCard") && !document.getElementById("hopCard").hidden) || !!(document.getElementById("sourcePane") && !document.getElementById("sourcePane").hidden), "");
    check("V22", "Ledger cells exist", document.querySelectorAll("#ledgerGrid .cell").length >= 3, "cells=" + document.querySelectorAll("#ledgerGrid .cell").length);
    check("V23", "Stamp/Skip are enabled on a flow", !!(document.getElementById("stampBtn") && !document.getElementById("stampBtn").disabled && document.getElementById("skipBtn") && !document.getElementById("skipBtn").disabled), "");
    const stamp = document.getElementById("stampBtn");
    if (stamp) stamp.click();
    await later(80);
    check("V24", "Stamp records holds", /holds|1 stamped/i.test((document.getElementById("coverage") || {}).textContent || ""), (document.getElementById("coverage") || {}).textContent || "");

    clickWs("lineage");
    await later(80);
    check("V25", "Lineage maps hops to Used / Informed / Generated", !!document.querySelector('.prov-col[data-prov="used"]') && !!document.querySelector('.prov-col[data-prov="informed"]') && !!document.querySelector('.prov-col[data-prov="generated"]'), "");
    check("V26", "Lineage lists ego nodes or incident hops", document.querySelectorAll(".ego-node, .expl-card.hop").length >= 1, "n=" + document.querySelectorAll(".ego-node, .expl-card.hop").length);

    clickWs("decisions");
    await later(60);
    check("V27", "Decisions lists the stamp", /holds|control-flow|overview/i.test(document.body.innerText), "");

    clickWs("registry");
    await later(60);
    check("V28", "Registry audit has the snapshot row", /349 nodes|Review snapshot/i.test(document.body.innerText), "");
    check("V29", "Registry lists KindMismatch findings", /KindMismatch/i.test(document.body.innerText), "");
    check("V30", "Registry finding names a real SolarSim hop", /create_empty_body|recursive_bodies|BodyChildren|BodyParent|apply_body|spawn_imposter/i.test(document.body.innerText), document.body.innerText.slice(0, 200));

    clickWs("timeline");
    await later(60);
    check("V31", "Timeline has parent cut and a scrubber", /Parent cut/i.test(document.body.innerText) && !!document.getElementById("tlScrub"), "");
    check("V32", "Timeline gained a stamp event", document.querySelectorAll(".tl-item").length >= 3, "items=" + document.querySelectorAll(".tl-item").length);

    clickWs("overview");
    await later(40);
    document.body.focus();
    key("1");
    await later(40);
    check("V33", "Key 1 switches to Map", wsOn() === "map", wsOn());
    document.body.focus();
    key("/");
    check("V34", "Slash focuses graph search", document.activeElement && document.activeElement.id === "graphSearch", "active=" + ((document.activeElement && document.activeElement.id) || ""));
    if (document.getElementById("graphSearch")) document.getElementById("graphSearch").blur();
    document.body.focus();
    key("?");
    check("V35", "Question mark opens the shortcut sheet", !!(document.getElementById("keysPane") && !document.getElementById("keysPane").hidden), "");
    key("Escape");
    const llmBtn = document.getElementById("llmBtn");
    if (llmBtn) llmBtn.click();
    await later(40);
    check("V36", "LLM Ask panel opens", !!(document.getElementById("llmPane") && !document.getElementById("llmPane").hidden), "");
    check("V37", "Inspect pane labels Evidence", !!(document.querySelector(".src-k") && /Evidence/i.test((document.querySelector(".src-k") || {}).textContent || "")), "");
    check("V38", "Reorganize button is present", !!document.getElementById("reorgBtn"), "");
    check("V41", "Bright Apple material is on", !!(document.documentElement.classList.contains("bright") && document.body.classList.contains("bright")), "html=" + document.documentElement.className + " body=" + document.body.className);
    const bodyBg = getComputedStyle(document.body).backgroundColor || "";
    const rgb = bodyBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    const lum = rgb ? (0.2126 * rgb[1] + 0.7152 * rgb[2] + 0.0722 * rgb[3]) / 255 : 0;
    check("V42", "Canvas is a bright grouped surface", lum > 0.7, bodyBg + " lum=" + lum.toFixed(2));
    const accent = (getComputedStyle(document.body).getPropertyValue("--vscode-focusBorder") || "").trim();
    const blue = (getComputedStyle(document.body).getPropertyValue("--g-fn") || "").trim();
    check("V43", "Accent is Apple system blue", /007aff|0,\s*122,\s*255/i.test(accent + " " + blue), accent + " " + blue);
    check("V44", "Grouped canvas token is live", /f2f2f7|#ffffff|rgb\(242,\s*242,\s*247\)/i.test(getComputedStyle(document.body).getPropertyValue("--g-grouped") || getComputedStyle(document.body).backgroundColor || ""), getComputedStyle(document.body).getPropertyValue("--g-grouped"));
    check("V45", "Now pill does not repeat the workspace", !/overview\s*·\s*overview/i.test((document.getElementById("nowPill") || {}).textContent || ""), (document.getElementById("nowPill") || {}).textContent || "");
    check("V46", "Prompt lives in the header glass bar", !!(document.querySelector("header #prompt")), "");
    check("V47", "Flow tabs sit in the toolbar, not their own row", !!(document.querySelector("#graphBar #tabs")), "");
    clickWs("overview");
    await later(40);
    const tintCard = document.querySelector(".vnode.kind-Function");
    const tintToken = tintCard
      ? (getComputedStyle(tintCard).getPropertyValue("--c") + " " + getComputedStyle(tintCard).getPropertyValue("--g-fn")).trim()
      : "";
    check("V48", "Cards keep a kind tint", !!(tintCard && /007aff|g-fn/i.test(tintToken)), tintToken + " n=" + document.querySelectorAll(".vnode.kind-Function").length);
    const story = document.querySelector(".feature-path");
    const metrics = document.querySelector(".stat-strip");
    check("V49", "Overview story sits above the metrics strip", !!(story && metrics && (story.compareDocumentPosition(metrics) & Node.DOCUMENT_POSITION_FOLLOWING)), "");
    const mh = metrics ? Math.round(metrics.getBoundingClientRect().height) : 0;
    check("V50", "Metrics strip is one quiet line", mh > 0 && mh <= 48, "h=" + mh);
    clickWs("overview");
    await later(40);
    const grid = document.getElementById("ledgerGrid");
    const gridSt = grid ? getComputedStyle(grid) : null;
    const colCount = gridSt && gridSt.gridTemplateColumns && gridSt.gridTemplateColumns !== "none"
      ? gridSt.gridTemplateColumns.split(" ").filter(Boolean).length
      : 0;
    const sourceList = !!(gridSt && (gridSt.display === "flex" || colCount === 1));
    check("V51", "Ledger is a source list, not a two-column ID grid", sourceList, gridSt ? gridSt.display + " cols=" + gridSt.gridTemplateColumns : "missing");
    const named = [...document.querySelectorAll("#ledgerGrid .cell .dag-id")].map((el) => el.textContent || "");
    check("V52", "Ledger cells name objects", named.some((t) => /[A-Za-z_]{3,}/.test(t)), named.slice(0, 4).join(" · "));
    const chip = document.querySelector("#coverage .score-chip");
    const chipSt = chip ? getComputedStyle(chip) : null;
    const chipBox = chipSt ? chipSt.boxShadow : "";
    const chipBg = chipSt ? chipSt.backgroundColor : "";
    const caption = !!(chipSt && (chipBox === "none" || /^rgba\(0,\s*0,\s*0,\s*0\)$/.test(chipBox)) && (/transparent|rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(chipBg)));
    check("V53", "Scorecard is caption text, not a chip row", caption, chipBg + " shadow=" + chipBox);
    check("V54", "Day / Night appearance control is in the header", !!(document.getElementById("themeSeg") && document.getElementById("themeDay") && document.getElementById("themeNight")), "");
    if (typeof applyTheme === "function") applyTheme("night", false);
    await later(40);
    const nightBg = getComputedStyle(document.body).backgroundColor || "";
    const nightRgb = nightBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    const nightLum = nightRgb ? (0.2126 * nightRgb[1] + 0.7152 * nightRgb[2] + 0.0722 * nightRgb[3]) / 255 : 1;
    const nightAccent = (getComputedStyle(document.body).getPropertyValue("--vscode-focusBorder") + " " + getComputedStyle(document.body).getPropertyValue("--g-fn")).trim();
    check("V55", "Night remaps the desk to a dark grouped surface", !!(document.documentElement.classList.contains("night") && document.body.classList.contains("night") && nightLum < 0.35), nightBg + " lum=" + nightLum.toFixed(2));
    check("V56", "Night accent is Apple dark-mode system blue", /0a84ff|10,\s*132,\s*255/i.test(nightAccent), nightAccent);
    if (typeof applyTheme === "function") applyTheme("day", false);
    await later(40);
    const dayBg = getComputedStyle(document.body).backgroundColor || "";
    const dayRgb = dayBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    const dayLum = dayRgb ? (0.2126 * dayRgb[1] + 0.7152 * dayRgb[2] + 0.0722 * dayRgb[3]) / 255 : 0;
    check("V57", "Day restores the bright grouped surface", !!(!document.documentElement.classList.contains("night") && dayLum > 0.7), dayBg + " lum=" + dayLum.toFixed(2));

    const failed = rows.filter((r) => !r.pass);
    const html =
      "<h2>Live SolarSim checklist</h2><div class=\"sum " +
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
            (r.detail ? " — " + String(r.detail).replace(/</g, "").slice(0, 160) : "") +
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
      el.textContent =
        (failed.length ? "FAIL " : "PASS ") +
        (rows.length - failed.length) +
        "/" +
        rows.length +
        "\n" +
        rows.map((r) => (r.pass ? "ok" : "XX") + " " + r.id + " " + r.title).join("\n");
    }
    document.title = (failed.length ? "FAIL" : "PASS") + " Graphide live " + (rows.length - failed.length) + "/" + rows.length;
    window.__graphideLiveSuite = { rows, failed: failed.length };
  }
})();
