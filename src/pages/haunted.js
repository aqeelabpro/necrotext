import { K } from '../teletext/constants.js';
import { clean, dbl, truncate, wrap } from '../teletext/text.js';
import { banner } from '../teletext/layout.js';
import { fromBitmap, box } from '../teletext/mosaic.js';
import { itemsOf, sourceState, ageMs, ageText, SOURCES } from '../data/store.js';
import { mulberry32, hashString, pick, int } from '../rng.js';
import { whisper } from '../ghost.js';
import { para } from './util.js';

const NAMES = { news: 'News', tech: 'Tech', sport: 'Sport', hn: 'HackerNews', weather: 'Weather' };
const STATE_COL = { alive: K.GREEN, stale: K.YELLOW, dead: K.RED };
const STATE_TXT = { alive: 'ALIVE', stale: 'STALE', dead: 'DEAD' };

// Art is 14x9 pixels, 7 cells by 3 rows, one colour. fromBitmap keeps the colour in force across
// touching lit cells, so inner details are unlit holes ('.') cut out of the stone.
export const TOMB = [
  '....WWWWWW....', '..WWWWWWWWWW..', '.WWWWW..WWWWW.', '.WWW......WWW.', '.WWW......WWW.', '.WWWWW..WWWWW.',
  '.WWWWW..WWWWW.', '.WWWWW..WWWWW.', '.WWWWWWWWWWWW.',
];
export const GHOST = [
  '....WWWWWW....', '..WWWWWWWWWW..', '.WWWWWWWWWWWW.', '.WWW..WW..WWW.', '.WWW..WW..WWW.', '.WWWWWWWWWWWW.',
  '.WWWWWWWWWWWW.', '.WWWWWWWWWWWW.', '.WW.WWWWWW.WW.',
];

/** Page 666: real diagnostics from data/status.json. */
function deadLetters(ctx) {
  const now = ctx.now instanceof Date && !isNaN(ctx.now) ? ctx.now : new Date(0);
  const src = (ctx.data && ctx.data.status && ctx.data.status.sources) || {};
  const rows = [banner('THE DEAD LETTER OFFICE', 'WHITE', 'RED'), ''];
  const tomb = fromBitmap(TOMB);
  const dead = [];
  for (const key of SOURCES) {
    const st = sourceState(ctx.data, key, now);
    const s = src[key] || {};
    if (st === 'dead') dead.push(key);
    const age = ageText(ageMs(s.fetchedAt, now));
    rows.push(K.WHITE + NAMES[key].padEnd(11) + STATE_COL[st] + STATE_TXT[st].padEnd(6) + K.WHITE + age.padEnd(9) + K.CYAN + (Number.isFinite(s.items) ? s.items + ' items' : ''));
    const note = s.error ? 'ERR ' + clean(s.error) : s.fallback ? 'Bundled sample, not live' : s.dropped ? s.dropped + ' item(s) dropped by parser' : '';
    rows.push(K.RED + '  ' + truncate(note, 36));
  }
  rows.push('');
  const verdict = dead.length ? `${dead.length} source(s) dead: ${dead.join(', ')}` : 'No source is dead right now.';
  rows.push(...para(verdict, 38, 'YELLOW'));
  const tombRows = tomb.slice(0, 3).map((t) => '   ' + t);
  rows.push(...tombRows.map((t, i) => t + (i === 1 ? K.WHITE + '  R.I.P.' : '')));

  // page 2: unquiet items (no summary or no link)
  const quiet = [banner('UNQUIET STORIES', 'WHITE', 'RED'), ''];
  let found = 0;
  for (const key of ['news', 'tech', 'sport', 'hn']) {
    for (const it of itemsOf(ctx.data, key)) {
      const missing = [];
      if (!clean(it.title)) missing.push('title');
      if (key !== 'hn' && !clean(it.description)) missing.push('summary');
      if (!clean(it.link) && !clean(it.url)) missing.push('link');
      if (!missing.length || found >= 8) continue;
      found++;
      quiet.push(K.YELLOW + NAMES[key] + K.WHITE + ' ' + truncate(clean(it.title) || '(untitled)', 28), K.RED + '  missing: ' + missing.join(', '));
    }
  }
  if (!found) quiet.push(...para('Every story on file has a title, a summary and a link. For now.', 38, 'GREEN'));
  return {
    title: 'DEAD LETTERS',
    fastext: [['100', 'INDEX'], ['101', 'NEWS'], ['667', 'ORACLE'], ['888', 'GHOST SUB']],
    subpages: [rows, quiet],
  };
}

/** Page 667: a fortune built from today's headlines. Seeded by the calendar day. */
function oracle(ctx) {
  const now = ctx.now instanceof Date && !isNaN(ctx.now) ? ctx.now : new Date(0);
  const day = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const rng = mulberry32(hashString('oracle' + day) ^ (ctx.seed >>> 0));
  const heads = ['news', 'tech', 'sport', 'hn'].flatMap((k) => itemsOf(ctx.data, k).map((i) => clean(i.title)));
  const usable = heads.filter((h) => h.length >= 8);
  const lucky = pick(rng, ['101', '400', '600', '701', '710', '800', '888']);
  const quote = usable.length ? '"' + truncate(pick(rng, usable), 56) + '"' : '';
  const fortunes = quote
    ? [
        `The spirits have read today's news. They say: ${quote}. They are not reassured.`,
        `A voice on the cable reads out ${quote}. Nobody in the house has the heart to tell it.`,
        `The oracle has seen ${quote}. It has seen worse, and it remembers all of it.`,
      ]
    : ['The spirits found no news on file today. They find that more worrying than any headline.'];
  const text = fortunes[int(rng, fortunes.length)];
  const rows = [
    ...dbl('THE ORACLE', 'MAGENTA'),
    ...box(wrap(text.toUpperCase(), 30).slice(0, 6), 30, 5),
    '', K.CYAN + 'Your lucky page today is ' + K.YELLOW + lucky, '',
    ...para(`Drawn from ${heads.length} headline(s) on file. The same fortune returns all day. A new one rises at midnight.`, 38, 'WHITE'),
  ];
  return {
    title: 'ORACLE',
    fastext: [['100', 'INDEX'], [lucky, 'LUCKY PG'], ['888', 'GHOST SUB'], ['666', 'DEAD LTR']],
    subpages: [rows],
  };
}

/** Page 888: ghost subtitles. Whispers derived from the headlines. */
function ghostSubs(ctx) {
  const rng = mulberry32(hashString('ghost') ^ (ctx.seed >>> 0));
  const heads = ['news', 'tech', 'sport', 'hn'].flatMap((k) => itemsOf(ctx.data, k).map((i) => clean(i.title))).filter(Boolean);
  const src = heads.length ? heads : ['the signal', 'the cable', 'the dark'];
  const ic = fromBitmap(GHOST);
  const subs = [];
  for (let s = 0; s < 3; s++) {
    const rows = [banner('GHOST SUBTITLES', 'WHITE', 'MAGENTA'), ''];
    if (s === 0) rows.push(...ic.slice(0, 3).map((l) => '      ' + l), '');
    for (let i = 0; i < (s === 0 ? 3 : 5); i++) {
      const h = pick(rng, src);
      rows.push(K.CYAN + truncate(h, 38).toUpperCase().slice(0, 38));
      rows.push(K.BLACKBG + K.WHITE + ' ' + whisper(h, rng), '');
    }
    subs.push(rows);
  }
  return {
    title: 'GHOST SUBS',
    fastext: [['100', 'INDEX'], ['667', 'ORACLE'], ['666', 'DEAD LTR'], ['899', 'HELP']],
    subpages: subs,
  };
}

const unlucky = () => ({
  title: 'UNLUCKY',
  fastext: [['100', 'INDEX'], ['666', 'DEAD LTR'], ['667', 'ORACLE'], ['888', 'GHOST SUB']],
  subpages: [[
    ...dbl('UNLUCKY', 'RED'), K.FLASH + K.RED + 'THIRTEEN', '',
    ...para('Nobody ever finds page 13. Engineers say it was skipped on purpose, and the pages around it hold their breath.', 38, 'WHITE'), '',
    K.GREEN + 'Press X', K.YELLOW + K.CONCEAL + 'IT HAS ALWAYS BEEN HERE. KEEP WATCHING.',
  ]],
});

export const entries = [['666', deadLetters], ['667', oracle], ['888', ghostSubs], ['013', unlucky]];
