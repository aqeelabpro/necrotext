import test from 'node:test';
import assert from 'node:assert/strict';
import { fromBitmap } from '../src/teletext/mosaic.js';
import { Grid } from '../src/teletext/grid.js';
import { resolve } from '../src/teletext/render.js';
import { TOMB, GHOST } from '../src/pages/haunted.js';
import { ICONS } from '../src/pages/weather.js';
import { renderPage } from '../src/pages/registry.js';

const ART = { TOMB, GHOST, ...Object.fromEntries(Object.entries(ICONS).map(([k, v]) => [k, v])) };

/** Set pixels of a bitmap as "x,y" keys. */
function litPixels(lines) {
  const s = new Set();
  lines.forEach((l, y) => [...l].forEach((c, x) => c !== '.' && c !== ' ' && s.add(`${x},${y}`)));
  return s;
}

test('every art bitmap fits the icon size rules', () => {
  for (const [name, bmp] of Object.entries(ART)) {
    const rows = fromBitmap(bmp);
    assert.ok(rows.length <= 3, name);
    for (const r of rows) assert.ok(r.length <= 8, `${name} row too wide: ${r.length}`);
  }
});

test('resolve() of fromBitmap rows reproduces the bitmap sixels for all page art', () => {
  const pts = [[0, 0, 1], [1, 0, 2], [0, 1, 4], [1, 1, 8], [0, 2, 16], [1, 2, 32]];
  for (const [name, bmp] of Object.entries(ART)) {
    const rows = fromBitmap(bmp);
    const g = new Grid();
    rows.forEach((r, i) => g.write(1 + i, 0, r));
    const cells = resolve(g);
    const want = litPixels(bmp);
    const got = new Set();
    rows.forEach((_, cy) => {
      // A row whose first cell is lit gets one extra leading colour code cell.
      const firstLit = [0, 1].some((x) => [0, 1, 2].some((y) => want.has(`${x},${cy * 3 + y}`)));
      const lead = firstLit ? 1 : 0;
      cells[1 + cy].forEach((cell, c) => {
        if (!cell.mosaic || cell.ctrl) return;
        const cx = c - lead;
        for (const [dx, dy, bit] of pts) if (cell.bits & bit) got.add(`${cx * 2 + dx},${cy * 3 + dy}`);
      });
    });
    assert.deepEqual([...got].sort(), [...want].sort(), name);
  }
});

test('page 666 keeps full block mosaics (0x7F) through line sanitising', () => {
  const ctx = { data: {}, now: new Date(0), seed: 1 };
  const cells = resolve(renderPage('666', 1, ctx).grid);
  assert.ok(cells.flat().some((c) => c.mosaic && c.bits === 63), 'tombstone has solid cells');
});
