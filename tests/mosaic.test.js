import test from 'node:test';
import assert from 'node:assert/strict';
import { sixel, unsixel, isMosaicCode, fromBitmap, bar, chart, box, TL, BR } from '../src/teletext/mosaic.js';
import { forAll } from './helpers/prop.js';
import { int } from '../src/rng.js';

test('sixel codes skip the letter range 0x40-0x5F', () => {
  assert.equal(sixel(0), 0x20);
  assert.equal(sixel(31), 0x3f);
  assert.equal(sixel(32), 0x60);
  assert.equal(sixel(63), 0x7f);
});

test('property: sixel and unsixel round trip and always give a mosaic code', () => {
  forAll((rng) => int(rng, 64), (bits) => {
    assert.equal(unsixel(sixel(bits)), bits);
    assert.ok(isMosaicCode(sixel(bits)));
  });
});

test('fromBitmap encodes a 2x3 cell with colour code', () => {
  const rows = fromBitmap(['Y.', '..', '.Y']);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].charCodeAt(0), 0x13); // mosaic yellow
  assert.equal(rows[0].charCodeAt(1), sixel(TL | BR));
});

test('fromBitmap: blank cells carry no colour code', () => {
  assert.equal(fromBitmap(['..', '..', '..'])[0], ' ');
});

test('bar and chart sizes', () => {
  assert.equal(bar(5, 10, 10).length, 11);
  assert.equal(bar(99, 10, 10, 2).length, 11);
  const c = chart([1, 5, 3, 9, 2], 10, 3);
  assert.equal(c.length, 3);
  assert.deepEqual(chart([], 4, 3).length, 3);
});

test('box rows share one width', () => {
  const b = box(['hi', 'there'], 10);
  assert.equal(b.length, 4);
  for (const r of b) assert.equal(r.length, 15);
});
