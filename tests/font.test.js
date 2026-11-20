import test from 'node:test';
import assert from 'node:assert/strict';
import { glyph, GLYPH_W, GLYPH_H } from '../src/teletext/font.js';

const codes = Array.from({ length: 0x7f - 0x20 }, (_, i) => String.fromCharCode(0x20 + i));

test('every printable code has a glyph of the declared size', () => {
  assert.equal(codes.length, 95);
  for (const ch of codes) {
    const g = glyph(ch);
    assert.equal(g.length, GLYPH_H, ch);
    for (const row of g) assert.ok(Number.isInteger(row) && row >= 0 && row < 1 << GLYPH_W, `${ch} row ${row}`);
  }
});

test('space is empty and every other glyph has pixels', () => {
  assert.ok(glyph(' ').every((r) => r === 0));
  for (const ch of codes.slice(1)) assert.ok(glyph(ch).some((r) => r), ch);
});

test('letters are all distinct', () => {
  for (const set of ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789']) {
    const seen = new Set(set.split('').map((c) => glyph(c).join(',')));
    assert.equal(seen.size, set.length, set);
  }
});
