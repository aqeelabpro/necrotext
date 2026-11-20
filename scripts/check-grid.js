// Render every page and subpage against the committed data and assert the grid invariants.
import { loadDataSync } from '../src/data/node-load.js';
import { checkPages } from '../src/teletext/check.js';

const ctx = { data: loadDataSync(), now: new Date(2026, 9, 31, 12, 0), seed: 1 };
const { pages, problems } = checkPages(ctx);
for (const p of problems) console.error(p);
if (problems.length) process.exit(1);
console.log(`grid check ok: ${pages} pages`);
