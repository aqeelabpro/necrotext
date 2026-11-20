// Render every page and subpage against the committed data and assert the grid invariants.
import { renderPage, pageIds } from '../src/pages/registry.js';
import { loadDataSync } from '../src/data/node-load.js';
import { COLS, ROWS, isAllowedCode } from '../src/teletext/constants.js';

const ctx = { data: loadDataSync(), now: new Date(2026, 9, 31, 12, 0), seed: 1 };
let bad = 0;
let n = 0;
for (const id of [...pageIds(), '404']) {
  const first = renderPage(id, 1, ctx);
  for (let s = 1; s <= first.subCount; s++) {
    const { grid } = renderPage(id, s, ctx);
    n++;
    if (grid.cells.length !== COLS * ROWS) { console.error(`${id}/${s}: wrong size`); bad++; }
    for (const c of grid.cells) if (!isAllowedCode(c)) { console.error(`${id}/${s}: bad code ${c}`); bad++; break; }
  }
}
if (bad) process.exit(1);
console.log(`grid check ok: ${n} pages`);
