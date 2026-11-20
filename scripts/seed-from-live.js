// Seed data/ with the last deployed live data so a failed fetch keeps good data, not the sample.
// Never throws: any problem leaves the bundled sample in place.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validatePayload } from './fetch-data.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = ['news', 'tech', 'sport', 'hn', 'weather'];
const DEFAULT_BASE = 'https://aqeelabpro.github.io/necrotext/data/';

async function getJson(fetchImpl, url) {
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Copy each valid live source file and its status entry into `dir`.
 * @returns {Promise<{seeded: string[], skipped: string[]}>}
 */
export async function seedFromLive({ fetchImpl = fetch, dir = path.join(ROOT, 'data'), base = DEFAULT_BASE } = {}) {
  const seeded = [];
  const skipped = [];
  const root = base.endsWith('/') ? base : base + '/';
  let liveStatus;
  try {
    liveStatus = validatePayload('status', await getJson(fetchImpl, root + 'status.json'));
    if (!liveStatus.sources || typeof liveStatus.sources !== 'object') throw new Error('no sources');
  } catch {
    return { seeded, skipped: [...SOURCES] };
  }
  const statusPath = path.join(dir, 'status.json');
  let status = { sources: {} };
  try { status = JSON.parse(fs.readFileSync(statusPath, 'utf8')); } catch { /* keep default */ }
  status.sources = status.sources || {};
  for (const key of SOURCES) {
    try {
      const entry = liveStatus.sources[key];
      if (!entry || entry.fallback) throw new Error('no live entry');
      const payload = validatePayload(key, await getJson(fetchImpl, `${root}${key}.json`));
      fs.writeFileSync(path.join(dir, key + '.json'), JSON.stringify(payload, null, 2) + '\n');
      status.sources[key] = entry;
      seeded.push(key);
    } catch {
      skipped.push(key);
    }
  }
  if (seeded.length) {
    if (liveStatus.generatedAt) status.generatedAt = liveStatus.generatedAt;
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2) + '\n');
  }
  return { seeded, skipped };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const r = await seedFromLive({ base: process.env.SEED_BASE_URL || DEFAULT_BASE });
    console.log(`seeded: ${r.seeded.join(', ') || 'none'}; skipped: ${r.skipped.join(', ') || 'none'}`);
  } catch (e) {
    console.log('seeding skipped: ' + (e && e.message));
  }
}
