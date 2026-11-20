import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../src/teletext/grid.js';
import { resolve, toText } from '../src/teletext/render.js';
import { K, COLS, ROWS } from '../src/teletext/constants.js';
import { sixel, TL } from '../src/teletext/mosaic.js';
import { header, footer, banner } from '../src/teletext/layout.js';

const row = (str) => {
  const g = new Grid();
  g.write(0, 0, str);
  return resolve(g)[0];
};

test('grid is 40x24 and starts blank', () => {
  const g = new Grid();
  assert.equal(g.cells.length, COLS * ROWS);
  assert.equal(g.row(0), ' '.repeat(40));
});

test('colour code takes a cell, shows as space, and applies to following cells', () => {
  const r = row('A' + K.RED + 'B');
  assert.equal(r[0].fg, 7);
  assert.equal(r[1].ctrl, true);
  assert.equal(r[1].ch, ' ');
  assert.equal(r[2].fg, 1);
});

test('state resets at the start of each row', () => {
  const g = new Grid();
  g.write(0, 0, K.RED + 'x');
  g.write(1, 0, 'y');
  assert.equal(resolve(g)[1][0].fg, 7);
});

test('new background uses the current foreground and applies at its own cell', () => {
  const r = row(K.BLUE + K.NEWBG + K.YELLOW + 'x');
  assert.equal(r[0].bg, 0);
  assert.equal(r[1].bg, 4);
  assert.equal(r[2].bg, 4);
  assert.equal(r[3].fg, 3);
  assert.equal(r[3].bg, 4);
});

test('black background resets bg', () => {
  const r = row(K.BLUE + K.NEWBG + K.WHITE + 'a' + K.BLACKBG + 'b');
  assert.equal(r[4].bg, 0);
});

test('mosaic mode decodes sixels, letters 0x40-0x5F stay letters', () => {
  const r = row(K.M_GREEN + String.fromCharCode(sixel(TL)) + 'A');
  assert.equal(r[1].mosaic, true);
  assert.equal(r[1].bits, TL);
  assert.equal(r[1].fg, 2);
  assert.equal(r[2].mosaic, false);
  assert.equal(r[2].ch, 'A');
});

test('alpha colour after mosaic returns to text', () => {
  const r = row(K.M_RED + K.WHITE + String.fromCharCode(0x41));
  assert.equal(r[2].mosaic, false);
});

test('separated mosaics flag', () => {
  const r = row(K.M_RED + K.SEP + String.fromCharCode(sixel(63)));
  assert.equal(r[2].sep, true);
});

test('hold mosaic repeats the last mosaic in control cells', () => {
  const r = row(K.M_RED + String.fromCharCode(sixel(21)) + K.HOLD + K.YELLOW);
  assert.equal(r[2].mosaic, true);
  assert.equal(r[2].bits, 21);
});

test('flash and conceal are tracked, alpha colour clears conceal', () => {
  const r = row(K.FLASH + 'a' + K.STEADY + 'b' + K.CONCEAL + 'c' + K.CYAN + 'd');
  assert.equal(r[1].flash, true);
  assert.equal(r[3].flash, false);
  assert.equal(r[5].conceal, true);
  assert.equal(r[7].conceal, false);
});

test('double height: top row marks cells, next row mirrors the lower half', () => {
  const g = new Grid();
  g.write(2, 0, K.DOUBLE + K.YELLOW + 'HI');
  const cells = resolve(g);
  assert.equal(cells[2][2].dbl, 1);
  assert.equal(cells[3][2].dbl, 2);
  assert.equal(cells[3][2].ch, 'H');
  assert.equal(cells[3][0].dbl, 0);
});

test('normal height code (set-at) ends double height at its own cell', () => {
  const r = row(K.DOUBLE + 'a' + K.NORMAL + 'b');
  assert.equal(r[1].dbl, 1);
  assert.equal(r[3].dbl, 0);
});

test('header is exactly 40 cells and contains the page label and CACHED marker', () => {
  const now = new Date(2026, 9, 31, 12, 34);
  const h = header({ label: 'P101/2', title: 'NEWS HEADLINES', now, cached: false });
  assert.equal(h.length, 40);
  assert.ok(h.includes('P101/2'));
  const c = header({ label: 'P400', title: 'WEATHER', now, cached: true });
  assert.equal(c.length, 40);
  assert.ok(c.includes('CACHED'));
});

test('footer is 40 cells with colour keys in order', () => {
  const f = footer([['100', 'A'], ['101', 'B'], ['102', 'C'], ['103', 'D']]);
  assert.equal(f.length, 40);
  assert.equal(f.charCodeAt(0), 1);
  assert.equal(f.charCodeAt(10), 2);
  assert.equal(f.charCodeAt(20), 3);
  assert.equal(f.charCodeAt(30), 6);
});

test('banner is 40 cells', () => {
  assert.equal(banner('HELLO').length, 40);
  assert.equal(toText(new Grid())[0].length, 40);
});
