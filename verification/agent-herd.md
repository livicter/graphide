# Agent herd

Command: `node scripts/agent-herd.mjs`

Predicate: `extension/media/src/graph/herd.js` (same module the desk rail calls).

- AH1 blocked fixture `--focus boot --wait` exit 0
- AH2 settled fixture `--focus control-flow --wait` exit 2 (done)
- AH3 open cut on the blocked fixture exit 2 (working)
- AH6 `graphide review --root fixtures/demo --no-parent` exit 2 focus data-subscription working
- Stamp path: none. `.graphide/stamps/` absent.
