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
          name: "boot",
          tree: { nodes: ["n0", "n1", "n2"] },
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
    const flow = { name: "boot", tree, flowchart: { runs: [], spine: [], positions: [] } };
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

  window.postMessage(msg, "*");
  setTimeout(function () {
    if (clickProgram) clickMainProgram();
    if (search) applySearch(search);
    if (drill) {
      const card = document.querySelector(".bubble-card");
      if (card) card.click();
    }
    if (hop) {
      const hit = document.querySelector(".edge-hit, text.ekind");
      if (hit) hit.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
    if (ws) {
      const tab = document.querySelector('#workspaces [data-ws="' + ws + '"]');
      if (tab) tab.click();
    }
    if (ego) {
      const btn = document.getElementById("egoBtn");
      if (btn) btn.click();
    }
    setTimeout(probe, 200);
  }, 250);
})();
