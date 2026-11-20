import { K } from '../teletext/constants.js';
import { clean, wrap, truncate } from '../teletext/text.js';
import { banner } from '../teletext/layout.js';
import { itemsOf } from '../data/store.js';
import { HOME_FT, MAX_SUBS, chunk, normItem, para } from './util.js';

const SECTIONS = [
  { key: 'news', indexId: '101', base: 111, title: 'NEWS HEADLINES', short: 'NEWS', colour: 'BLUE' },
  { key: 'tech', indexId: '102', base: 121, title: 'TECH NEWS', short: 'TECH', colour: 'MAGENTA' },
  { key: 'hn', indexId: '103', base: 131, title: 'HACKER NEWS', short: 'HN', colour: 'RED' },
  { key: 'sport', indexId: '300', base: 301, title: 'SPORT', short: 'SPORT', colour: 'GREEN' },
];

const emptyRows = (s) => [
  banner(s.title, 'WHITE', s.colour), '', K.YELLOW + 'No stories available.', '',
  K.WHITE + 'The feed is silent. The Dead Letter', K.WHITE + 'Office (page 666) may know why.',
];

function indexPage(s) {
  return (ctx) => {
    const items = itemsOf(ctx.data, s.key).slice(0, 9).map(normItem);
    let subpages;
    if (!items.length) subpages = [emptyRows(s)];
    else {
      subpages = chunk(items.map((it, i) => ({ it, i })), 5).map((grp) => {
        const rows = [banner(s.title, 'WHITE', s.colour), ''];
        for (const { it, i } of grp) {
          const lines = wrap(it.title, 34).slice(0, 3);
          lines.forEach((l, j) => rows.push(j === 0 ? K.YELLOW + String(s.base + i) + K.WHITE + ' ' + l : '     ' + l));
          if (s.key === 'hn' && it.score !== null && lines.length < 3) rows.push(K.CYAN + '     ' + it.score + ' points');
          rows.push('');
        }
        return rows;
      });
    }
    return {
      title: s.short,
      source: s.key,
      fastext: [['100', 'INDEX'], [s.base + '', 'TOP STORY'], ['666', 'DEAD LTR'], ['899', 'HELP']],
      subpages: subpages.slice(0, MAX_SUBS),
    };
  };
}

function storyPage(s, i) {
  return (ctx) => {
    const raw = itemsOf(ctx.data, s.key)[i];
    const id = String(s.base + i);
    const next = String(s.base + ((i + 1) % 9));
    const prev = String(s.base + ((i + 8) % 9));
    const fastext = [[s.indexId, 'BACK'], [next, 'NEXT'], [prev, 'PREV'], ['100', 'HOME']];
    if (!raw) {
      return { title: s.short, source: s.key, fastext, subpages: [[banner(s.title, 'WHITE', s.colour), '', K.YELLOW + 'STORY NOT AVAILABLE', '', K.WHITE + 'Nothing is filed under ' + id + '.']] };
    }
    const it = normItem(raw);
    const lines = [...wrap(it.title, 38).map((l) => K.YELLOW + l), ''];
    if (it.pubDate) lines.push(K.CYAN + truncate(it.pubDate, 38), '');
    if (it.by) lines.push(K.GREEN + 'by ' + truncate(it.by, 34));
    if (it.score !== null) lines.push(K.GREEN + it.score + ' points');
    if (it.comments !== null) lines.push(K.GREEN + it.comments + ' comments');
    if (it.score !== null || it.comments !== null) lines.push('');
    if (it.description) lines.push(...para(it.description, 38, 'WHITE'));
    else if (s.key !== 'hn') lines.push(K.WHITE + '(no summary supplied)');
    if (it.link) lines.push('', ...wrap(it.link, 38).slice(0, 3).map((l) => K.CYAN + l));
    const subpages = chunk(lines, 19).slice(0, MAX_SUBS).map((c) => [banner(s.title, 'WHITE', s.colour), ...c]);
    return { title: s.short + ' ' + id, source: s.key, fastext, subpages };
  };
}

export const entries = SECTIONS.flatMap((s) => [
  [s.indexId, indexPage(s)],
  ...Array.from({ length: 9 }, (_, i) => [String(s.base + i), storyPage(s, i)]),
]);
export { HOME_FT, clean };
