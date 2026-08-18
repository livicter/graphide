#!/usr/bin/env python3
"""Validate pilot JSON outputs. Used by pilot.cmd (no PowerShell execution policy)."""
from __future__ import annotations

import json
import sys
from pathlib import Path


def load(path: str) -> dict:
    text = Path(path).read_text(encoding="utf-8")
    start = text.find("{")
    if start < 0:
        raise SystemExit(f"no JSON object in {path}")
    return json.loads(text[start:])


def cmd_review(path: str) -> None:
    snap = load(path)
    flows = snap.get("flows") or []
    if not flows:
        raise SystemExit("no flows")
    flow = flows[0]
    if flow.get("name") != "data-subscription":
        raise SystemExit(f"unexpected flow name {flow.get('name')!r}")
    tree_nodes = (flow.get("tree") or {}).get("nodes") or []
    if len(tree_nodes) < 2:
        raise SystemExit(f"steiner too small: {len(tree_nodes)}")
    runs = (flow.get("flowchart") or {}).get("runs") or []
    if not runs:
        raise SystemExit("no runs")
    unmatched = [
        f
        for f in (snap.get("findings") or [])
        if f.get("kind") == "UnmatchedHint"
    ]
    if unmatched:
        raise SystemExit(f"unmatched hits: {unmatched}")


def cmd_bubble(path: str) -> None:
    snap = load(path)
    runs = ((snap.get("flows") or [{}])[0].get("flowchart") or {}).get("runs") or []
    if not runs:
        raise SystemExit("no runs")
    print(runs[0]["bubble"])


def cmd_enter(path: str) -> None:
    view = load(path)
    nodes = view.get("nodes") or []
    if not nodes:
        raise SystemExit("enter returned no nodes")


def cmd_summary(review_path: str, enter_path: str) -> None:
    snap = load(review_path)
    view = load(enter_path)
    flow = snap["flows"][0]
    print(
        "PILOT OK: "
        f"flows={len(snap['flows'])} "
        f"tree={len(flow['tree']['nodes'])} "
        f"runs={len(flow['flowchart']['runs'])} "
        f"enter={len(view['nodes'])} "
        f"findings={len(snap.get('findings') or [])}"
    )


def main(argv: list[str]) -> None:
    if len(argv) < 2:
        raise SystemExit("usage: pilot_check.py <review|bubble|enter|summary> ...")
    op = argv[1]
    if op == "review":
        cmd_review(argv[2])
    elif op == "bubble":
        cmd_bubble(argv[2])
    elif op == "enter":
        cmd_enter(argv[2])
    elif op == "summary":
        cmd_summary(argv[2], argv[3])
    else:
        raise SystemExit(f"unknown op {op}")


if __name__ == "__main__":
    main(sys.argv)
