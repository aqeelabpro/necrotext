import test from 'node:test';
import assert from 'node:assert/strict';
import { wrap, truncate, center, fold, clean, upper, dbl } from '../src/teletext/text.js';
import { forAll, genString } from './helpers/prop.js';
import { int } from '../src/rng.js';

test('wrap: simple example', () => {
  assert.deepEqual(wrap('the quick brown fox', 10), ['the quick', 'brown fox']);
});

test('wrap: splits words longer than the width', () => {
  assert.deepEqual(wrap('abcdefghij', 4), ['abcd', 'efgh', 'ij']);
});

test('property: wrap never exceeds width and preserves non-space characters', () => {
  forAll(
    (rng) => ({ text: genString(rng, 300), w: 1 + int(rng, 40) }),
    ({ text, w }) => {
      const lines = wrap(text, w);
      for (const l of lines) assert.ok(l.length <= w, `line too long: ${l.length} > ${w}`);
      assert.equal(lines.join('').replace(/\s/g, ''), text.replace(/\s/g, ''));
    },
  );
});

test('truncate and center', () => {
  assert.equal(truncate('hello world', 8), 'hello...');
  assert.equal(truncate('hi', 8), 'hi');
  assert.equal(center('ab', 6), '  ab');
});

test('fold: accents, dashes and symbols become printable ASCII', () => {
  assert.equal(fold('caf\u00e9 \u2014 na\u00efve'), 'cafe - naive');
  assert.equal(fold('\u201cquote\u201d'), '"quote"');
  assert.equal(upper('  \u00fcber  cool '), 'UBER COOL');
});

test('property: clean output is always printable ASCII without an em dash', () => {
  forAll(
    (rng) => genString(rng, 200),
    (s) => {
      const out = clean(s);
      assert.match(out, /^[\x20-\x7e]*$/);
      assert.ok(!out.includes('\u2014'));
    },
  );
});

test('dbl returns a doubled row and a blank row', () => {
  const [a, b] = dbl('HI');
  assert.equal(a.charCodeAt(0), 0x0d);
  assert.equal(b, '');
});
