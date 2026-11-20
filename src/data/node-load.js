// Node only: read data/*.json from disk.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCES } from './store.js';

export const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');

export function loadDataSync(dir = DATA_DIR) {
  const out = {};
  for (const key of [...SOURCES, 'status']) {
    try {
      out[key] = JSON.parse(fs.readFileSync(path.join(dir, key + '.json'), 'utf8'));
    } catch {
      /* missing file: leave undefined, pages must cope */
    }
  }
  return out;
}
