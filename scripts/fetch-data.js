// Fetch live feeds into data/*.json and write data/status.json for page 666.
// Needs network access. A failing source keeps its previous snapshot and is recorded as failed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseRss } from '../src/data/rss.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TIMEOUT_MS = 10000;
const RETRY_DELAY_MS = 1500;

export const CITIES = [
  ['London', 51.5072, -0.1276], ['Manchester', 53.4808, -2.2426], ['Edinburgh', 55.9533, -3.1883],
  ['Cardiff', 51.4816, -3.1791], ['Belfast', 54.5973, -5.9301],
];

export const FEEDS = {
  news: 'https://feeds.bbci.co.uk/news/rss.xml',
  tech: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
  sport: 'https://feeds.bbci.co.uk/sport/rss.xml',
};
const HN = 'https://hacker-news.firebaseio.com/v0';
const meteo = (lat, lon) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=7&timezone=auto`;

async function get(fetchImpl, url, as) {
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'user-agent': 'necrotext/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return as === 'text' ? res.text() : res.json();
}

async function fetchFeed(fetchImpl, url) {
  const { items, dropped } = parseRss(await get(fetchImpl, url, 'text'));
  if (!items.length) throw new Error('feed parsed to zero items');
  return { items: items.slice(0, 10), dropped };
}

/** Wrap a fetch so a throw or a non-ok response is tried once more after a short pause. */
export function withRetry(fetchImpl, delayMs = RETRY_DELAY_MS) {
  return async (url, opts) => {
    try {
      const res = await fetchImpl(url, opts);
      if (res.ok) return res;
    } catch { /* retry below */ }
    await new Promise((r) => setTimeout(r, delayMs));
    return fetchImpl(url, opts);
  };
}

/** Throws unless a payload has the shape the pages rely on. */
export function validatePayload(key, p) {
  if (!p || typeof p !== 'object') throw new Error('payload is not an object');
  if (key === 'weather') {
    const ok = Array.isArray(p.cities) && p.cities.length > 0 &&
      p.cities.every((c) => c && c.current && Number.isFinite(c.current.temperature) && Array.isArray(c.daily));
    if (!ok) throw new Error('invalid weather payload');
  } else if (key !== 'status') {
    const ok = Array.isArray(p.items) && p.items.some((i) => i && typeof i.title === 'string' && i.title.trim());
    if (!ok) throw new Error('invalid feed payload');
  }
  return p;
}

async function fetchHn(fetchImpl) {
  const ids = (await get(fetchImpl, `${HN}/topstories.json`, 'json')).slice(0, 10);
  const items = [];
  let dropped = 0;
  const fetched = await Promise.all(ids.map((id) => get(fetchImpl, `${HN}/item/${id}.json`, 'json')));
  for (const [n, it] of fetched.entries()) {
    const id = ids[n];
    if (!it || !it.title) { dropped++; continue; }
    items.push({ title: it.title, url: it.url || `https://news.ycombinator.com/item?id=${id}`, score: it.score, by: it.by, descendants: it.descendants ?? 0, time: it.time });
  }
  if (!items.length) throw new Error('no usable HN items');
  return { items, dropped };
}

/** Convert an Open-Meteo response to the compact shape used by page 400. */
export function normaliseWeather(name, j) {
  const idx = Math.max(0, (j.hourly.time || []).indexOf((j.current && j.current.time || '').slice(0, 13) + ':00'));
  return {
    name, latitude: j.latitude, longitude: j.longitude,
    current: { temperature: j.current.temperature_2m, code: j.current.weather_code, wind: j.current.wind_speed_10m },
    hourly: j.hourly.temperature_2m.slice(idx, idx + 24),
    daily: j.daily.time.map((date, i) => ({ date, code: j.daily.weather_code[i], max: j.daily.temperature_2m_max[i], min: j.daily.temperature_2m_min[i], precip: j.daily.precipitation_sum[i] })),
  };
}

async function fetchWeather(fetchImpl) {
  const cities = [];
  for (const [name, lat, lon] of CITIES) cities.push(normaliseWeather(name, await get(fetchImpl, meteo(lat, lon), 'json')));
  return { cities, dropped: 0 };
}

/**
 * Run every fetch. Returns the status object. `dir` and `fetchImpl` are injectable for tests.
 */
export async function fetchAll({ fetchImpl = fetch, dir = path.join(ROOT, 'data'), now = new Date(), retryDelayMs = RETRY_DELAY_MS } = {}) {
  fetchImpl = withRetry(fetchImpl, retryDelayMs);
  const jobs = {
    news: () => fetchFeed(fetchImpl, FEEDS.news),
    tech: () => fetchFeed(fetchImpl, FEEDS.tech),
    sport: () => fetchFeed(fetchImpl, FEEDS.sport),
    hn: () => fetchHn(fetchImpl),
    weather: () => fetchWeather(fetchImpl),
  };
  const urls = { ...FEEDS, hn: `${HN}/topstories.json`, weather: 'https://api.open-meteo.com/v1/forecast' };
  let previous = {};
  try { previous = JSON.parse(fs.readFileSync(path.join(dir, 'status.json'), 'utf8')).sources || {}; } catch { /* first run */ }
  const sources = {};
  for (const [key, job] of Object.entries(jobs)) {
    try {
      const { items, cities, dropped } = await job();
      const payload = validatePayload(key, { fetchedAt: now.toISOString(), source: urls[key], ...(cities ? { cities } : { items }) });
      fs.writeFileSync(path.join(dir, key + '.json'), JSON.stringify(payload, null, 2) + '\n');
      sources[key] = { ok: true, fetchedAt: payload.fetchedAt, items: (items || cities).length, dropped, url: urls[key] };
    } catch (e) {
      const prev = previous[key] || {};
      sources[key] = { ...prev, ok: false, error: String(e && e.message || e).slice(0, 120), lastAttempt: now.toISOString(), url: urls[key] };
    }
  }
  const status = { generatedAt: now.toISOString(), sources };
  fs.writeFileSync(path.join(dir, 'status.json'), JSON.stringify(status, null, 2) + '\n');
  return status;
}

/** Markdown table for the Actions run summary. */
export function summaryMarkdown(status) {
  const rows = Object.entries(status.sources).map(([k, s]) => `| ${k} | ${s.ok ? 'ok' : 'FAILED'} | ${s.ok ? s.items : String(s.error || '').replace(/\|/g, '/')} |`);
  return ['### Live data fetch', '', '| Source | Result | Items or error |', '| --- | --- | --- |', ...rows, ''].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const status = await fetchAll();
  for (const [k, s] of Object.entries(status.sources)) console.log(`${k.padEnd(8)} ${s.ok ? 'ok' : 'FAILED ' + s.error}`);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryMarkdown(status));
  // Exit 0 even on partial failure: stale data is a feature (page 666 reports it).
}
