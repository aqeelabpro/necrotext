import test from 'node:test';
import assert from 'node:assert/strict';
import { glitch, seance, overlay, whisper, messageFor, words } from '../src/ghost.js';
import { renderPage, pageIds } from '../src/pages/registry.js';
import { loadDataSync } from '../src/data/node-load.js';
import { mulberry32, int } from '../src/rng.js';
import { forAll } from './helpers/prop.js';
import { COLS, ROWS, isAllowedCode } from '../src/teletext/constants.js';

const ctx = { data: loadDataSync(), now: new Date(2026, 9, 31, 12), seed: 3 };
const genPage = (rng) => renderPage(pageIds()[int(rng, pageIds().length)], 1, ctx).grid;

test('property 7: glitch never changes dimensions, control codes, rows 0, 22 or 23, and keeps codes valid', () => {
  forAll((rng) => ({ grid: genPage(rng), seed: int(rng, 1e9), n: int(rng, 60) }), ({ grid, seed, n }) => {
    const g = glitch(grid, mulberry32(seed), n);
    assert.equal(g.cells.length, COLS * ROWS);
    for (let i = 0; i < g.cells.length; i++) {
      assert.ok(isAllowedCode(g.cells[i]));
      if (grid.cells[i] < 0x20) assert.equal(g.cells[i], grid.cells[i]);
    }
    for (const r of [0, 22, 23]) assert.equal(g.row(r), grid.row(r));
    for (let r = 1; r < ROWS - 1; r++) if (grid.row(r - 1).includes('\x0d')) assert.equal(g.row(r), grid.row(r));
  });
});

test('property 7: glitch is deterministic for a seed and does not mutate its input', () => {
  forAll((rng) => ({ grid: genPage(rng), seed: int(rng, 1e9) }), ({ grid, seed }) => {
    const before = grid.rows().join('|');
    const a = glitch(grid, mulberry32(seed), 12);
    const b = glitch(grid, mulberry32(seed), 12);
    assert.deepEqual([...a.cells], [...b.cells]);
    assert.equal(grid.rows().join('|'), before);
  });
});

test('seance corrupts more than a plain glitch and stays valid', () => {
  const grid = renderPage('101', 1, ctx).grid;
  const s = seance(grid, mulberry32(1), 3);
  let diff = 0;
  for (let i = 0; i < s.cells.length; i++) if (s.cells[i] !== grid.cells[i]) diff++;
  assert.ok(diff > 5);
  for (const c of s.cells) assert.ok(isAllowedCode(c));
});

test('overlay spells a message on row 22 only', () => {
  const grid = renderPage('100', 1, ctx).grid;
  const o = overlay(grid, 'THEY ARE HERE', 4);
  assert.ok(o.row(22).includes('THEY'));
  assert.ok(!o.row(22).includes('THEY A'));
  for (let r = 0; r < ROWS; r++) if (r !== 22) assert.equal(o.row(r), grid.row(r));
  assert.equal(o.cells.length, COLS * ROWS);
});

test('whisper and messageFor are deterministic, short and uppercase ASCII', () => {
  const grid = renderPage('101', 1, ctx).grid;
  const m1 = messageFor(grid, mulberry32(9));
  const m2 = messageFor(grid, mulberry32(9));
  assert.equal(m1, m2);
  assert.ok(m1.length <= 38 && /^[ -~]+$/.test(m1));
  assert.equal(whisper('', mulberry32(1)).length > 0, true);
  assert.deepEqual(words('The Haunted house of 42 cats'), ['HAUNTED', 'HOUSE', 'CATS']);
});
