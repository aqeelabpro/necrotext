# NecroText Core: Design

## Architecture
```
data/*.json --> pages/*.js (generators) --> registry.renderPage --> Grid (40x24 codes)
                                                                       |
                                       render.resolve (serial attributes)
                                                                       |
                                  ui/draw.js (canvas) or scripts/snapshot.js (SVG)
```
The renderer never touches the DOM, so Node tests cover everything except the canvas glue in `public/app.js`.

## Modules
- `src/teletext/constants.js`: size, palette, control code table, allowed code check.
- `grid.js`: `Grid` of 960 bytes, `write` clips at the edge.
- `mosaic.js`: sixel encoding, bitmap to cells, bars, charts, boxes.
- `text.js`: `fold` (any string to printable ASCII, em dashes become hyphens), `wrap`, `truncate`, `dbl`.
- `layout.js`: header, footer and banner rows, each exactly 40 cells.
- `render.js`: `resolve(grid)` turns serial attributes into per cell state.
- `pages/registry.js`: page number to generator, `renderPage(id, sub, ctx)`, sanitising and the double height rule.
- `ui/nav.js`: pure key handler. `ui/draw.js`: canvas drawing. `public/app.js`: glue.

## Key decisions
- Serial attributes like the real hardware, not CSS spans, so control codes cost a cell and layouts feel authentic.
- Generators return `{title, source, fastext, subpages: string[][]}`; the registry enforces invariants centrally so one bad generator cannot break the grid.
- The ghost row is row 22, so content gets rows 1 to 21.
- Sub page cap of 9 keeps the header label at 6 cells.
- Property tests drive random, hostile feed data through every page.

## Error handling
Generators are wrapped in `try/catch`; a crash renders an ERROR page instead of throwing.
