import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fetchAll, normaliseWeather } from '../scripts/fetch-data.js';

const RSS = `<rss><channel>${[1, 2, 3].map((i) => `<item><title>Story ${i}</title><description>Desc ${i}</description><link>https://x.test/${i}</link></item>`).join('')}</channel></rss>`;
const METEO = {
  latitude: 51.5, longitude: -0.1,
  current: { time: '2026-10-20T09:00', temperature_2m: 12.3, weather_code: 3, wind_speed_10m: 9 },
  hourly: { time: Array.from({ length: 48 }, (_, i) => `2026-10-${20 + Math.floor(i / 24)}T${String(i % 24).padStart(2, '0')}:00`), temperature_2m: Array.from({ length: 48 }, (_, i) => i) },
  daily: { time: ['2026-10-20', '2026-10-21'], weather_code: [3, 61], temperature_2m_max: [14, 13], temperature_2m_min: [8, 7], precipitation_sum: [0, 2.5] },
};

function fakeFetch(failHost) {
  return async (url) => {
    if (failHost && String(url).includes(failHost)) return { ok: false, status: 403 };
    const u = String(url);
    if (u.includes('feeds.bbci')) return { ok: true, text: async () => RSS };
    if (u.includes('topstories')) return { ok: true, json: async () => [11, 12] };
    if (u.includes('/item/')) return { ok: true, json: async () => ({ title: 'HN ' + u, score: 5, by: 'me', descendants: 2, time: 1 }) };
    if (u.includes('open-meteo')) return { ok: true, json: async () => METEO };
    throw new Error('unexpected ' + u);
  };
}

test('fetchAll writes data files and an all ok status', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nt-'));
  const status = await fetchAll({ fetchImpl: fakeFetch(), dir, now: new Date('2026-10-20T10:00:00Z') });
  for (const k of ['news', 'tech', 'sport', 'hn', 'weather']) assert.equal(status.sources[k].ok, true, k);
  const news = JSON.parse(fs.readFileSync(path.join(dir, 'news.json'), 'utf8'));
  assert.equal(news.items.length, 3);
  const weather = JSON.parse(fs.readFileSync(path.join(dir, 'weather.json'), 'utf8'));
  assert.equal(weather.cities.length, 5);
  assert.equal(weather.cities[0].hourly.length, 24);
  assert.equal(weather.cities[0].hourly[0], 9);
});

test('a failing source keeps the old file and is recorded as dead', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nt-'));
  await fetchAll({ fetchImpl: fakeFetch(), dir, now: new Date('2026-10-20T10:00:00Z') });
  const status = await fetchAll({ fetchImpl: fakeFetch('open-meteo'), dir, now: new Date('2026-10-20T12:00:00Z') });
  assert.equal(status.sources.weather.ok, false);
  assert.match(status.sources.weather.error, /HTTP 403/);
  assert.equal(status.sources.weather.fetchedAt, '2026-10-20T10:00:00.000Z');
  assert.equal(status.sources.news.ok, true);
  assert.ok(fs.existsSync(path.join(dir, 'weather.json')));
});

test('normaliseWeather picks the current hour onward', () => {
  const w = normaliseWeather('London', METEO);
  assert.equal(w.current.temperature, 12.3);
  assert.equal(w.daily[1].precip, 2.5);
  assert.equal(w.hourly[0], 9);
});

import { seedFromLive } from '../scripts/seed-from-live.js';
import { renderPage } from '../src/pages/registry.js';

const T0 = new Date('2026-10-20T10:00:00Z');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'nt-'));
const run = (fetchImpl, dir, now = T0) => fetchAll({ fetchImpl, dir, now, retryDelayMs: 0 });

test('a request that fails once is retried and succeeds', async () => {
  const dir = tmp();
  const calls = {};
  const base = fakeFetch();
  const flaky = async (url, o) => {
    calls[url] = (calls[url] || 0) + 1;
    if (String(url).includes('bbci.co.uk/news/rss') && calls[url] === 1) throw new Error('reset');
    return base(url, o);
  };
  const status = await run(flaky, dir);
  assert.equal(status.sources.news.ok, true);
  assert.equal(calls['https://feeds.bbci.co.uk/news/rss.xml'], 2);
});

test('an invalid payload does not overwrite a good file and is reported failed', async () => {
  const dir = tmp();
  await run(fakeFetch(), dir);
  const before = fs.readFileSync(path.join(dir, 'weather.json'), 'utf8');
  const bad = async (url, o) => {
    if (String(url).includes('open-meteo')) return { ok: true, json: async () => ({ ...METEO, current: { ...METEO.current, temperature_2m: 'warm' } }) };
    return fakeFetch()(url, o);
  };
  const status = await run(bad, dir, new Date('2026-10-20T12:00:00Z'));
  assert.equal(status.sources.weather.ok, false);
  assert.match(status.sources.weather.error, /invalid weather/);
  assert.equal(fs.readFileSync(path.join(dir, 'weather.json'), 'utf8'), before);
});

test('a feed with no titled item is rejected', async () => {
  const dir = tmp();
  const empty = async (url, o) => String(url).includes('bbci.co.uk/sport') ? { ok: true, text: async () => '<rss><channel><item><description>x</description></item></channel></rss>' } : fakeFetch()(url, o);
  const status = await run(empty, dir);
  assert.equal(status.sources.sport.ok, false);
  assert.equal(fs.existsSync(path.join(dir, 'sport.json')), false);
});

test('success clears the fallback flag', async () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'status.json'), JSON.stringify({ sources: { news: { ok: true, fallback: true } } }));
  const status = await run(fakeFetch(), dir);
  assert.equal(status.sources.news.fallback, undefined);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'status.json'), 'utf8')).sources.news.fallback, undefined);
});

test('seedFromLive copies valid live files and skips invalid or failed ones', async () => {
  const live = tmp();
  await run(fakeFetch(), live);
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'status.json'), JSON.stringify({ sources: { news: { ok: true, fallback: true }, tech: { ok: true, fallback: true }, sport: { ok: true, fallback: true } } }));
  for (const k of ['news', 'tech', 'sport', 'hn', 'weather']) fs.writeFileSync(path.join(dir, k + '.json'), '{"sample":true}');
  const serve = async (url) => {
    const name = String(url).split('/').pop();
    if (name === 'tech.json') return { ok: false, status: 404 };
    if (name === 'sport.json') return { ok: true, json: async () => ({ items: [] }) };
    return { ok: true, json: async () => JSON.parse(fs.readFileSync(path.join(live, name), 'utf8')) };
  };
  const r = await seedFromLive({ fetchImpl: serve, dir, base: 'https://x.test/data' });
  assert.deepEqual(r.seeded, ['news', 'hn', 'weather']);
  assert.deepEqual(r.skipped, ['tech', 'sport']);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'news.json'), 'utf8')).items.length, 3);
  assert.equal(fs.readFileSync(path.join(dir, 'tech.json'), 'utf8'), '{"sample":true}');
  const st = JSON.parse(fs.readFileSync(path.join(dir, 'status.json'), 'utf8'));
  assert.equal(st.sources.news.fallback, undefined);
  assert.equal(st.sources.tech.fallback, true);
});

test('seedFromLive skips sources whose live status entry is not ok', async () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'news.json'), '{"sample":true}');
  const serve = async (url) => {
    const name = String(url).split('/').pop();
    if (name === 'status.json') return { ok: true, json: async () => ({ sources: { news: 'bogus', tech: { ok: false } } }) };
    return { ok: true, json: async () => ({ items: [{ title: 'x' }] }) };
  };
  const r = await seedFromLive({ fetchImpl: serve, dir, base: 'https://x.test/data/' });
  assert.equal(r.seeded.length, 0);
  assert.equal(fs.readFileSync(path.join(dir, 'news.json'), 'utf8'), '{"sample":true}');
});

test('seedFromLive leaves everything alone when the site is unreachable', async () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'news.json'), '{"sample":true}');
  const r = await seedFromLive({ fetchImpl: async () => { throw new Error('offline'); }, dir, base: 'https://x.test/data/' });
  assert.equal(r.seeded.length, 0);
  assert.equal(fs.readFileSync(path.join(dir, 'news.json'), 'utf8'), '{"sample":true}');
});

test('page 100 labels sample data only when every source is fallback', () => {
  const src = (fb) => ({ ok: true, fallback: fb });
  const mk = (fb) => ({ status: { sources: { news: src(true), tech: src(true), sport: src(true), hn: src(true), weather: src(fb) } } });
  const text = (data) => Object.values(renderPage('100', 1, { data, now: T0, seed: 1 }).grid.cells).map((c) => String.fromCharCode(c)).join('');
  assert.match(text(mk(true)), /SAMPLE DATA/);
  assert.doesNotMatch(text(mk(false)), /SAMPLE DATA/);
});
