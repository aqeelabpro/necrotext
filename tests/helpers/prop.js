// Hand rolled property based testing. fast-check cannot be installed in this sandbox (npm registry blocked),
// so this is a small seeded replacement. forAll(gen, prop) can be swapped for fc.assert(fc.property(...)).
import { mulberry32, int, pick } from '../../src/rng.js';

export const SEED = Number(process.env.PROP_SEED) || 20261031;

/** Shrink strings and arrays by halving, keeping any smaller value that still fails. */
function shrink(value, fails) {
  let cur = value;
  for (let guard = 0; guard < 40; guard++) {
    let next = null;
    if (typeof cur === 'string' && cur.length > 1) {
      for (const cand of [cur.slice(0, Math.ceil(cur.length / 2)), cur.slice(Math.floor(cur.length / 2))]) if (fails(cand)) { next = cand; break; }
    } else if (Array.isArray(cur) && cur.length > 1) {
      for (const cand of [cur.slice(0, Math.ceil(cur.length / 2)), cur.slice(Math.floor(cur.length / 2))]) if (fails(cand)) { next = cand; break; }
    }
    if (next === null) break;
    cur = next;
  }
  return cur;
}

/**
 * @template T
 * @param {(rng: () => number) => T} gen
 * @param {(value: T) => void} prop throws (assert) when violated
 * @param {{runs?: number, seed?: number}} [opts]
 */
export function forAll(gen, prop, { runs = 200, seed = SEED } = {}) {
  for (let i = 0; i < runs; i++) {
    const rng = mulberry32(seed + i * 7919);
    const value = gen(rng);
    try {
      prop(value);
    } catch (err) {
      const fails = (v) => { try { prop(v); return false; } catch { return true; } };
      const small = shrink(value, fails);
      let shown;
      try { shown = JSON.stringify(small); } catch { shown = String(small); }
      throw new Error(`Property failed on run ${i} (seed ${seed + i * 7919}): ${err.message}\nShrunk input: ${String(shown).slice(0, 400)}`);
    }
  }
}

// ---- generators ----
const ALPHABET = [
  'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '0123456789', ' ', ' ',
  '.,;:!?\'"-()[]{}#@&%', '\u2014\u2013\u2018\u2019\u201c\u201d\u2026\u00a3\u20ac', '\u00e9\u00e8\u00fc\u00f1\u00e7\u00df\u00f8\u0142',
  '\u{1F47B}\u{1F480}\u4e2d\u6587\u0416', '\n\t\r\u0007\u001b', '<b>&amp;</b>',
];

export function genString(rng, maxLen = 120) {
  const len = int(rng, maxLen + 1);
  let s = '';
  for (let i = 0; i < len; i++) {
    const set = Array.from(pick(rng, ALPHABET));
    s += pick(rng, set);
  }
  if (rng() < 0.1) s += 'x'.repeat(int(rng, 80)); // very long word
  return s;
}

/** Any value, including junk, to prove pages never throw on odd feeds. */
function genJunk(rng) {
  const r = rng();
  if (r < 0.1) return null;
  if (r < 0.15) return undefined;
  if (r < 0.25) return int(rng, 1000) - 300;
  if (r < 0.3) return NaN;
  if (r < 0.35) return { nested: true };
  return genString(rng, 200);
}

const genItem = (rng) => ({
  title: genString(rng, 150), description: genString(rng, 600), link: genString(rng, 100), pubDate: genString(rng, 40),
  url: genString(rng, 60), score: genJunk(rng), by: genString(rng, 15), descendants: genJunk(rng),
  ...(rng() < 0.2 ? { title: genJunk(rng) } : {}),
  ...(rng() < 0.2 ? { description: genJunk(rng) } : {}),
});
const genItems = (rng) => Array.from({ length: int(rng, 12) }, () => (rng() < 0.05 ? genJunk(rng) : genItem(rng)));

const genCity = (rng) => ({
  name: genString(rng, 40),
  current: rng() < 0.9 ? { temperature: genJunk(rng), code: genJunk(rng), wind: genJunk(rng) } : genJunk(rng),
  hourly: rng() < 0.9 ? Array.from({ length: int(rng, 30) }, () => genJunk(rng)) : genJunk(rng),
  daily: rng() < 0.9 ? Array.from({ length: int(rng, 9) }, () => ({ date: genString(rng, 12), code: genJunk(rng), max: genJunk(rng), min: genJunk(rng), precip: genJunk(rng) })) : genJunk(rng),
});

export function genData(rng) {
  const feed = () => (rng() < 0.1 ? genJunk(rng) : { fetchedAt: genString(rng, 25), items: rng() < 0.9 ? genItems(rng) : genJunk(rng) });
  const src = () => ({ ok: rng() < 0.7, fallback: rng() < 0.3, fetchedAt: rng() < 0.7 ? new Date(1.7e12 + int(rng, 1e10)).toISOString() : genJunk(rng), items: genJunk(rng), dropped: genJunk(rng), error: rng() < 0.5 ? genString(rng, 300) : undefined });
  return {
    news: feed(), tech: feed(), sport: feed(), hn: feed(),
    weather: rng() < 0.1 ? genJunk(rng) : { cities: Array.from({ length: int(rng, 7) }, () => (rng() < 0.05 ? genJunk(rng) : genCity(rng))) },
    status: rng() < 0.1 ? genJunk(rng) : { sources: Object.fromEntries(['news', 'tech', 'sport', 'hn', 'weather'].filter(() => rng() < 0.85).map((k) => [k, src()])) },
  };
}

export const genDate = (rng) => new Date(1.6e12 + int(rng, 3e11));
