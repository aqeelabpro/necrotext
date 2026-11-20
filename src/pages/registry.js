import { Grid } from '../teletext/grid.js';
import { COLS, DEFINED_CONTROL, K } from '../teletext/constants.js';
import { header, footer } from '../teletext/layout.js';
import { clean } from '../teletext/text.js';
import { sourceState } from '../data/store.js';
import { MAX_SUBS, CONTENT_ROWS } from './util.js';
import { entries as indexEntries } from './index.js';
import { entries as newsEntries } from './news.js';
import { entries as weatherEntries } from './weather.js';
import { entries as tvEntries } from './tv.js';
import { entries as gameEntries } from './games.js';
import { entries as aboutEntries } from './about.js';
import { entries as hauntedEntries } from './haunted.js';

/** @type {Map<string, (ctx: object, id: string) => object>} */
export const REGISTRY = new Map([
  ...indexEntries, ...newsEntries, ...weatherEntries, ...tvEntries, ...gameEntries, ...aboutEntries, ...hauntedEntries,
]);

/** Every real page number, ascending. 404 is the fallback page and is not part of navigation. */
export const pageIds = () => [...REGISTRY.keys()].filter((k) => k !== '404').sort();

export const hasPage = (id) => REGISTRY.has(String(id));

/** Next or previous registered page, wrapping. dir is +1 or -1. */
export function stepPage(id, dir) {
  const ids = pageIds();
  const i = ids.indexOf(String(id));
  if (i < 0) return dir > 0 ? ids[0] : ids[ids.length - 1];
  return ids[(i + dir + ids.length) % ids.length];
}

/** Make a content line safe: only allowed codes, at most 40 cells. */
function sanitizeLine(line) {
  let out = '';
  for (const ch of String(line ?? '').slice(0, COLS)) {
    const c = ch.charCodeAt(0);
    if (c >= 0x20 && c <= 0x7f) out += ch;
    else if (DEFINED_CONTROL.has(c)) out += ch;
    else out += c > 0x7f ? '?' : ' ';
  }
  return out;
}

/**
 * Render a page to a Grid.
 * @param {string} id three digit page number
 * @param {number} sub 1 based subpage
 * @param {{data: object, now: Date, seed?: number}} ctx
 * @returns {{grid: Grid, id: string, sub: number, subCount: number, title: string, fastext: string[][], cached: boolean, found: boolean}}
 */
export function renderPage(id, sub, ctx) {
  const key = String(id);
  const found = REGISTRY.has(key);
  const gen = REGISTRY.get(found ? key : '404');
  const c = { seed: 0, ...ctx, now: ctx && ctx.now instanceof Date && !isNaN(ctx.now) ? ctx.now : new Date(0) };
  let def;
  try {
    def = gen(c, key);
  } catch (e) {
    def = { title: 'ERROR', subpages: [[K.RED + 'This page crashed: ' + clean(e && e.message).slice(0, 20)]], fastext: [] };
  }
  const subpages = (def.subpages && def.subpages.length ? def.subpages : [[]]).slice(0, MAX_SUBS);
  const subCount = subpages.length;
  const s = Math.max(1, Math.min(subCount, Math.floor(Number(sub)) || 1));
  const lines = subpages[s - 1].slice(0, CONTENT_ROWS).map(sanitizeLine);

  // double height rule: row 21 may not be double (row 22 is the ghost row), a double row blanks the row below.
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(K.DOUBLE)) {
      if (i === CONTENT_ROWS - 1) lines[i] = lines[i].split(K.DOUBLE).join(' ');
      else if (i + 1 < lines.length) lines[i + 1] = '';
    }
  }

  const fastext = [0, 1, 2, 3].map((i) => {
    const f = def.fastext && def.fastext[i];
    return f && hasPage(f[0]) ? [f[0], clean(f[1])] : ['100', 'INDEX'];
  });
  const cached = def.source ? sourceState(c.data, def.source, c.now) !== 'alive' : false;
  const label = 'P' + (/^\d{3}$/.test(key) ? key : '---') + (subCount > 1 ? '/' + s : '');
  const grid = new Grid();
  grid.setRow(0, header({ label, title: def.title || '', now: c.now, cached }));
  lines.forEach((l, i) => grid.setRow(i + 1, l));
  grid.setRow(23, footer(fastext));
  return { grid, id: key, sub: s, subCount, title: def.title || '', fastext, cached, found, label };
}
