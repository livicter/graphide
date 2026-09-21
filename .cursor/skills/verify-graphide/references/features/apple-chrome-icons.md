# Apple chrome icons

Sequoia Day chrome pass 2. Workspace tabs carry an SF-style icon
mark beside the existing Map / Slice / … labels. Map community cards
always show a tinted `.tile` (glyph + soft kind tint), title /
subtitle, and a count badge. Chrome only. Map stays community LOD.
Stamp / skip stay human — this pass never writes `.graphide/stamps/`.

## Sub-features

- `#workspaces [data-ws]` buttons include an icon mark
  (`svg.ws-ico`). Labels stay. No new workspace.
- Map `.bubble-card` paints a visible `.tile` with `data-tile` tint
  (entry / shallow / mid / core / high / exit) plus `.name` / `.meta`
  and a top-right count `.n`.
- `#reviewBtn` stays system blue. `#coverage` stays frosted. Header
  secondary capsules keep even spacing.
- Map stays community LOD (`xy=0`). No fake traffic lights. Agents
  never stamp.

## How to get to it (user POV)

1. Review a folder. Open **Map**. Day is the default harness look.
2. Workspace chips show a small line icon beside each label. **Map**
   stays the tinted selected chip.
3. Community cards show a tinted rounded-square tile, a title, a
   quieter subtitle, and a count pill at the top right.
4. Stamp and Skip are still the human attestation. This chrome does
   not stamp.

The in-tree proof is the explorer desk (`?mode=explorer`) on Day Map.

## Driving it with the harness

```
extension/scripts/webview-harness.html?mode=explorer&probe=0
```

After Map paints community cards (Day on; `#themeDay.on`):

```
// #workspaces [data-ws] each contain svg / img / .ws-ico
// .bubble-card .tile is painted and wide enough to see
// Map stays xy=0
```

Driver assertions (ids `AI0`…):

- every `#workspaces [data-ws]` contains `svg`, `img`, or `.ws-ico`
- every `.bubble-card` has a visible `.tile` (width ≥ 16)
- screenshot `verification/apple-chrome-icons.png` is not a black frame
- Map stays `xy=0`
- `.graphide/stamps/` is still empty; no `{ type: "stamp" }` post

## Gotchas

- Do not add fake macOS traffic lights inside the VS Code webview.
- Do not raise Map into XYFlow. Community cards stay. No Mermaid.
- Do not invent a workspace or a second chrome row.
- Do not weaken AC* / appearance / chrome 17/17 / RC* / DA* / SE*.
- Do not add `data-testid`. `#workspaces`, `.ws-ico`, `.bubble-card`,
  `.tile` are the hooks.
- Agents never stamp. Apple chrome icons post nothing.
