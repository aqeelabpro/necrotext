// Grid invariants shared by scripts/check-grid.js and the MCP server.
import { renderPage, pageIds, hasPage } from '../pages/registry.js';
import { COLS, ROWS, isAllowedCode } from './constants.js';

const DOUBLE = '\x0d';

/** Check one rendered page. Returns a list of problem strings (empty when fine). */
export function checkRendered(r) {
  const tag = `${r.id}/${r.sub}`;
  const problems = [];
  if (r.grid.cells.length !== COLS * ROWS) problems.push(`${tag}: wrong size ${r.grid.cells.length}`);
  for (const c of r.grid.cells) {
    if (!isAllowedCode(c)) { problems.push(`${tag}: bad code ${c}`); break; }
  }
  for (let row = 0; row < ROWS; row++) {
    if (!r.grid.row(row).includes(DOUBLE)) continue;
    if (row < 1 || row > 20) problems.push(`${tag}: double height on row ${row}`);
    else if (!/^ {40}$/.test(r.grid.row(row + 1))) problems.push(`${tag}: row ${row + 1} below double height is not blank`);
  }
  for (const [target] of r.fastext) {
    if (!hasPage(target)) problems.push(`${tag}: fastext target ${target} is not a page`);
  }
  return problems;
}

/**
 * Check one page (all subpages) or every page including 404.
 * @returns {{pages: number, problems: string[]}}
 */
export function checkPages(ctx, id) {
  const ids = id ? [String(id)] : [...pageIds(), '404'];
  const problems = [];
  let pages = 0;
  for (const pid of ids) {
    const first = renderPage(pid, 1, ctx);
    for (let s = 1; s <= first.subCount; s++) {
      pages++;
      problems.push(...checkRendered(renderPage(pid, s, ctx)));
    }
  }
  return { pages, problems };
}
