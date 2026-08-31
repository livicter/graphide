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
| [sequence.md](sequence.md) | Sequence workspace | `?sequence=1` · `verification/sequence.png` |
| [dataflow.md](dataflow.md) | Data-flow workspace | `?dataflow=1` · `verification/dataflow.png` |
| [lifecycle.md](lifecycle.md) | Lifecycle workspace | `?lifecycle=1` · `verification/lifecycle.png` |
| [export.md](export.md) | PNG / SVG / Share Card | explorer Map · `export-share.png` |
| [presentation.md](presentation.md) | Present + Style | `F` / `#presetBtn` · `present.png` |
| [route.md](route.md) | PATH probe | Sequence snap · `R` · `route.png` |
| [lens.md](lens.md) | Role compare | Sequence snap · `L` · `lens.png` |
| [map.md](map.md) | Community Map | explorer + self-review |
| [open-evidence.md](open-evidence.md) | Evidence pane | Slice · `evidence.png` |
| [stamp-skip.md](stamp-skip.md) | Human stamp / skip | host stub only · `stamp-host.png` |
| [self-review.md](self-review.md) | This checkout | `?live=1&require=1` |
| [host-adapter.md](host-adapter.md) | Webview ↔ host | `__vscodePosts` |

Regression sweep: every row above must still have a source path and a
harness drive. Drop a file only when the product surface is gone. Do not
add Archify features or a second chrome row.
