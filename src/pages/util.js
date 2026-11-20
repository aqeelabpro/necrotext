import { K } from '../teletext/constants.js';
import { clean, wrap, truncate } from '../teletext/text.js';

/** Cap on subpages per page so the header label "P101/9" always fits. */
export const MAX_SUBS = 9;
/** Content rows available between header (row 0) and the ghost row (22). */
export const CONTENT_ROWS = 21;

export const HOME_FT = [['100', 'INDEX'], ['101', 'NEWS'], ['400', 'WEATHER'], ['899', 'HELP']];

/** Split an array into chunks. */
export function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Clean a feed item into safe strings. */
export function normItem(it) {
  const o = it && typeof it === 'object' ? it : {};
  return {
    title: clean(o.title) || '(untitled)',
    description: clean(o.description),
    link: clean(o.link),
    pubDate: clean(o.pubDate),
    score: Number.isFinite(o.score) ? o.score : null,
    by: clean(o.by),
    comments: Number.isFinite(o.descendants) ? o.descendants : null,
  };
}

/** Coloured wrapped paragraph rows. */
export function para(text, width = 38, colour = 'WHITE', indent = 0) {
  return wrap(clean(text), width - indent).map((l) => K[colour] + ' '.repeat(indent) + l);
}

export const ellipsis = truncate;
