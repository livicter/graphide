# Feature maps

One file per Review-desk feature. Four headings each: Sub-features, How to
get to it (user POV), Driving it with the harness, Gotchas.

Do not add a map without a concrete source path (`extension/media/src/`,
`extension/media/main.js`, `extension.ts`, or an engine crate). Do not paper
a product bug by weakening a map. P-Stack `/maintain-verification-skill`
owns this folder.

| File | Surface | Live proof |
| --- | --- | --- |
| [architecture-delta.md](architecture-delta.md) | Delta workspace | `?delta=1` · `verification/delta.png` |
| [sticky-clusters.md](sticky-clusters.md) | Sticky community ids | `?delta=1` · `verification/sticky-clusters.png` |
| [sequence.md](sequence.md) | Sequence workspace | `?sequence=1` · `verification/sequence.png` |
| [dataflow.md](dataflow.md) | Data-flow workspace | `?dataflow=1` · `verification/dataflow.png` |
| [lifecycle.md](lifecycle.md) | Lifecycle workspace | `?lifecycle=1` · `verification/lifecycle.png` |
| [lineage.md](lineage.md) | Lineage workspace | `?lineage=1` · `verification/lineage.png` |
| [export.md](export.md) | PNG / SVG / Share Card | explorer Map · `export-share.png` |
| [presentation.md](presentation.md) | Present + Style | `F` / `#presetBtn` · `present.png` |
| [route.md](route.md) | PATH probe | Sequence snap · `R` · `route.png` |
| [lens.md](lens.md) | Role compare | Sequence snap · `L` · `lens.png` |
| [ego.md](ego.md) | k-hop neighborhood | explorer enter / Slice · `ego.png` |
| [search.md](search.md) | Find FQN / file / flow / hop | `#graphSearch` · `search.png` |
| [kind-filters.md](kind-filters.md) | Find kind pills | `#kindFilters` · `kind-filters.png` |
| [ask.md](ask.md) | Graph-only Ask pane | explorer · `#llmBtn` · `ask.png` |
| [keys.md](keys.md) | Shortcut sheet | explorer · `?` / `#keysBtn` · `keys.png` |
| [path-walk.md](path-walk.md) | Map start → features → end Play | explorer Map · `P` · `path-walk.png` |
| [appearance.md](appearance.md) | Day / Night | explorer Map · `#themeNight` / `D` · `night.png` |
| [overview.md](overview.md) | Default landing + CFG stage | explorer · `overview.png` |
| [decisions.md](decisions.md) | Stamp / skip / broken list | explorer · `decisions.png` |
| [registry.md](registry.md) | Snapshot audit table | explorer · `registry.png` |
| [timeline.md](timeline.md) | Parent cut / coverage / scars | explorer · `timeline.png` |
| [map.md](map.md) | Community Map | explorer + self-review |
| [open-evidence.md](open-evidence.md) | Evidence pane | Slice · `evidence.png` |
| [hop-card.md](hop-card.md) | Evidence hop card / incident edges | explorer Slice · `hop-card.png` |
| [coverage-mark.md](coverage-mark.md) | Evidence `#inspMeta` mark | explorer Slice · `coverage-mark.png` |
| [fit-reorg.md](fit-reorg.md) | Map Fit / Reorganize | explorer Map · `#zoomFit` / `#reorgBtn` · `fit-reorg.png` |
| [zoom.md](zoom.md) | Map zoom in / out | explorer Map · `#zoomIn` / `#zoomOut` · `zoom.png` |
| [program-chips.md](program-chips.md) | Program chip switch | self-review Map · `#legend [data-prog]` · `program-chips.png` |
| [all-programs.md](all-programs.md) | All programs union | self-review Map · `#legend [data-prog="-1"]` · `all-programs.png` |
| [progress.md](progress.md) | Review derive strip | explorer · `#progress` · `progress.png` |
| [cancel-review.md](cancel-review.md) | Cancel during strip | explorer · `#cancelBtn` · `cancel-review.png` |
| [flow-hints.md](flow-hints.md) | Named `flows.toml` chip | `?dataflow=1` · `flow-hints.png` |
| [flow-tabs.md](flow-tabs.md) | Map / Review flow-tab Steiner switch | explorer `#tabs` · `flow-tabs.png` |
| [unmatched-hint.md](unmatched-hint.md) | UnmatchedHint finding | explorer · `#coverage` · `unmatched-hint.png` |
| [uncovered-node.md](uncovered-node.md) | UncoveredNode finding | explorer · `#coverage` · Timeline · `uncovered-node.png` |
| [draft-hint.md](draft-hint.md) | Copy draft `[[flow]]` hits | explorer Timeline Uncovered · `draft-hint.png` |
| [open-slice.md](open-slice.md) | Decisions → Slice jump | explorer · `data-open-slice` · `open-slice.png` |
| [stamp-skip.md](stamp-skip.md) | Human stamp / skip | host stub only · `stamp-host.png` |
| [self-review.md](self-review.md) | This checkout | `?live=1&require=1` |
| [host-adapter.md](host-adapter.md) | Webview ↔ host | `__vscodePosts` |

Regression sweep: every row above must still have a source path and a
harness drive. Drop a file only when the product surface is gone. Do not
add Archify features or a second chrome row.
