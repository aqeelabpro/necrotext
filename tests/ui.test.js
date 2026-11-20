import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, press, parseHash, toHash } from '../src/ui/nav.js';
import { drawScreen, SCREEN_W } from '../src/ui/draw.js';
import { renderPage, stepPage } from '../src/pages/registry.js';
import { resolve } from '../src/teletext/render.js';
import { loadDataSync } from '../src/data/node-load.js';
import { pageIds } from '../src/pages/registry.js';

const env = { subCount: 3, fastext: [['101', 'A'], ['102', 'B'], ['103', 'C'], ['104', 'D']], step: stepPage };

test('typing three digits navigates, partial input does not', () => {
  let r = press(initialState(), '4', env);
  assert.equal(r.state.input, '4');
  assert.equal(r.go, undefined);
  r = press(r.state, '0', env);
  r = press(r.state, '0', env);
  assert.deepEqual(r.go, { page: '400', sub: 1 });
  assert.equal(r.state.input, '');
});

test('0 then Enter goes to the index; Backspace and Escape clear input', () => {
  let r = press(initialState('400'), '0', env);
  r = press(r.state, 'Enter', env);
  assert.equal(r.go.page, '100');
  r = press(initialState(), '5', env);
  assert.equal(press(r.state, 'Backspace', env).state.input, '');
  assert.equal(press(r.state, 'Escape', env).state.input, '');
});

test('colour keys and function keys follow fastext', () => {
  assert.equal(press(initialState(), 'r', env).go.page, '101');
  assert.equal(press(initialState(), 'G', env).go.page, '102');
  assert.equal(press(initialState(), 'y', env).go.page, '103');
  assert.equal(press(initialState(), 'b', env).go.page, '104');
  assert.equal(press(initialState(), 'F4', env).go.page, '104');
});

test('up/down step pages, left/right cycle subpages with wrap', () => {
  const s = initialState('100');
  assert.equal(press(s, 'ArrowUp', env).go.page, stepPage('100', 1));
  assert.equal(press(s, '-', env).go.page, stepPage('100', -1));
  assert.equal(press(s, 'ArrowRight', env).state.sub, 2);
  assert.equal(press(s, 'ArrowLeft', env).state.sub, 3);
});

test('toggles: reveal, seance, crt, mute, help', () => {
  let s = initialState();
  for (const [k, f] of [['x', 'reveal'], ['s', 'seance'], ['c', 'crt'], ['m', 'muted'], ['h', 'help']]) {
    const before = s[f];
    s = press(s, k, env).state;
    assert.equal(s[f], !before, f);
  }
});

test('hash routing round trips', () => {
  assert.deepEqual(parseHash('#/101/2'), { page: '101', sub: 2 });
  assert.deepEqual(parseHash('#/400'), { page: '400', sub: 1 });
  assert.deepEqual(parseHash('#garbage'), { page: '100', sub: 1 });
  assert.equal(toHash('101', 2), '#/101/2');
  assert.equal(toHash('101', 1), '#/101');
});

test('drawScreen paints every page without throwing (recording fake canvas)', () => {
  const calls = { fillRect: 0, fillText: 0 };
  const ctx = new Proxy({}, {
    get: (t, p) => (p === 'fillRect' ? () => calls.fillRect++ : p === 'fillText' ? () => calls.fillText++ : () => {}),
    set: () => true,
  });
  const data = loadDataSync();
  for (const id of pageIds()) {
    drawScreen(ctx, resolve(renderPage(id, 1, { data, now: new Date(0) }).grid), { flashOn: id.length > 5, reveal: true });
  }
  assert.ok(calls.fillRect > 100 && calls.fillText > 100);
  assert.equal(SCREEN_W, 800);
});
