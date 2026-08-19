/** Browser harness: posts the same `programs` message the extension sends after Review. */
(function () {
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode") || "broken";
  const search = params.get("search") || "";
  const clickProgram = params.get("program") === "1" || params.get("program") === "main";
  const drill = params.get("drill") === "1";

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
      stamps: [],
      skipped: [],
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
    const lines = [
      "mode=" + mode,
      "title=" + (title ? title.textContent.trim() : "(none)"),
      "bubble-cards=" + cards.length,
      "comm-nodes=" + dots.length,
      "vnodes=" + boxes.length,
      "ledger=" + ledger.length,
      "packets=" + pkts.length,
      "dim=" + dim.length,
      "uncovered-dots=" + uncovered.length,
      "crumb=" + (meta ? meta.textContent.replace(/\s+/g, " ").trim() : ""),
      "search=" + JSON.stringify(searchBox ? searchBox.value : ""),
      "coverage=" + (coverage ? coverage.textContent.replace(/\s+/g, " ").trim().slice(0, 120) : ""),
    ];
    const communityFirst = /Communities/i.test(title && title.textContent);
    const flowView = /Flow/i.test(title && title.textContent) && boxes.length > 0;
    const boxedMembers = dots.length > 0 && document.querySelector(".comm-node .meta");
    el.textContent = lines.join("\n");
    el.className =
      (communityFirst && cards.length >= 1) || flowView || boxedMembers ? "good" : "bad";
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
    const tree = {
      nodes: hits.map((n) => n.id),
      edges: hits.slice(1).map((n, i) => ({ from: hits[i].id, to: n.id, kind: "Calls" })),
    };
    const flow = { name: "boot", tree, flowchart: { runs: [], spine: [], positions: [] } };
    return {
      type: "flowchart",
      programs: base.programs,
      flows: [flow],
      graph: base.graph,
      bubbles: base.bubbles,
      coverage: base.coverage,
      findings: [],
      plugin: base.plugin,
      stats: base.stats,
      stamps: [],
      skipped: [],
      flow,
      snippets: {},
    };
  }

  const includeBubbles = mode === "fixed" || mode === "bubbles" || mode === "flow";
  const msg = mode === "flow" ? flowPayload() : solarsimPayload(includeBubbles);

  window.postMessage(msg, "*");
  setTimeout(function () {
    if (clickProgram) clickMainProgram();
    if (search) applySearch(search);
    if (drill) {
      const card = document.querySelector(".bubble-card");
      if (card) card.click();
    }
    setTimeout(probe, 120);
  }, 60);
})();
