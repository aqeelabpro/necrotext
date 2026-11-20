// Data access shared by Node (tests, scripts) and the browser.

export const STALE_AFTER_MS = 6 * 60 * 60 * 1000;
export const SOURCES = ['news', 'tech', 'sport', 'hn', 'weather'];

/** Defensive accessors: pages must never throw on odd data. */
export const itemsOf = (data, key) => {
  const v = data && data[key] && data[key].items;
  return Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : [];
};
export const citiesOf = (data) => {
  const v = data && data.weather && data.weather.cities;
  return Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : [];
};

export const num = (v, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

export function ageMs(iso, now) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return Infinity;
  return Math.max(0, now.getTime() - t);
}

export function ageText(ms) {
  if (!Number.isFinite(ms)) return 'never';
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * @returns {'alive'|'stale'|'dead'}
 *  dead: last fetch failed or no record. stale: bundled sample or older than 6 hours.
 */
export function sourceState(data, key, now) {
  const s = data && data.status && data.status.sources && data.status.sources[key];
  if (!s || typeof s !== 'object') return 'dead';
  if (s.ok === false) return 'dead';
  if (s.fallback) return 'stale';
  return ageMs(s.fetchedAt, now) > STALE_AFTER_MS ? 'stale' : 'alive';
}

/** Browser loader: fetch data/*.json relative to the page, fall back to the embedded snapshot. */
export async function loadData(fetchImpl, base = 'data/') {
  const out = {};
  let failed = false;
  for (const key of [...SOURCES, 'status']) {
    try {
      const res = await fetchImpl(`${base}${key}.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      out[key] = await res.json();
    } catch {
      failed = true;
    }
  }
  if (failed) {
    try {
      const snap = (await import('./snapshot.js')).default;
      for (const key of Object.keys(snap)) if (!(key in out)) out[key] = snap[key];
    } catch {
      /* no snapshot available */
    }
  }
  return out;
}
