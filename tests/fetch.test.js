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
