# Deriver endpoint honesty

A Review graph is honest when a Function stays a Function. The JS/TS
query captures every `variable_declarator` as a const, and
`endpoint_meta` used to scan the whole initializer for `file`,
`http`, or `channel`. Locals such as `const paint = graphNodePaint({
file })`, `createElementNS("http://www.w3.org/2000/svg")`, and
`ep.channel` became Endpoints. `link` stored nodes by FQN alone, so a
later false Endpoint dropped Function `paint`. Self-review then showed
71 KindMismatch Calls to that missing Function. Official
`BroadcastChannel` `events` desks stay Endpoints. No new plugin crate.
No new chrome row. Not a KindMismatch title-band.

## Sub-features

- `endpoint_meta` matches Channel on `broadcast` / `mpsc` (so
  `BroadcastChannel` still hits) and does not treat bare `.channel`,
  a generic `file` substring, or the URL scheme `http://` / `https://`
  as an endpoint. File channel still honors `OpenOptions` / rust
  `std::fs` types. Http still honors `axum` / `Router`.
- `link` prefers Function over Type over Endpoint when two kinds share
  an FQN, so a later Endpoint cannot drop `function paint`.
- Self-review (`?live=1`) snapshot: `extension.media.src.graph.desk.paint`
  is a Function, not an Endpoint, and KindMismatch findings targeting
  that FQN are 0. Registry no longer lists those 71 Calls rows.
- Official `?js=1` / `?ts=1` (and the other language desks) still
  paint `events` as Endpoint. Does **not** write `.graphide/stamps/`.
  Does **not** change `fixtures/demo` `sneaky_helper`.

## How to get to it (user POV)

1. Graphide → **Review** this checkout (`?live=1`). Open **Map**, then
   **Registry**.
2. `paint` is a Function on the derived graph. Registry does not list
   dozens of KindMismatch Calls to `paint`. Official JS/TS Review of
   `fixtures/js` still shows the `events` channel as an Endpoint.

## Driving it with the harness

```
./target/debug/graphide review --root . --json --progress --no-parent \
  > extension/scripts/live-snap.json
```

Then:

```
extension/scripts/webview-harness.html?live=1&probe=0&require=1
```

CI verify self-derives `live-snap.json` via `loadSelfReviewSnap` after
`cargo build` (same as language desks). Do not add a dedicated
workflow fixture step (OAuth token lacks `workflow` scope).

Driver assertions (ids `DEH0`…):

- snap node `extension.media.src.graph.desk.paint` is `Function`
- that FQN is not also an Endpoint
- no KindMismatch finding has `to` ending in `.desk.paint`
- Registry on `?live=1` lists 0 KindMismatch titles
- screenshot `verification/deriver-endpoint-honesty.png` is not a black frame
- `.graphide/stamps/` is still empty

## Gotchas

- Official language fixtures declare `const events = new
  BroadcastChannel()` (or rust `pub const events: BroadcastChannel`).
  Tightening must keep `broadcast` / `mpsc`. Do not match bare
  `ep.channel`.
- `nodes_by_fqn` is kind-blind; prefer Function when kinds collide.
  Do not invent a second chrome row or a KindMismatch filter strip.
- `fixtures/demo` `sneaky_helper` stays an isolated added Function
  (proposed-uncovered). This Feature does not rewrite that fixture.
- Self-review still requires `rust@`. Do not commit `live-snap.json`.
