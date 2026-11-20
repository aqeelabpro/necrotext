import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPage, pageIds, hasPage, stepPage, REGISTRY } from '../src/pages/registry.js';
import { COLS, ROWS, isAllowedCode } from '../src/teletext/constants.js';
import { forAll, genData, genDate } from './helpers/prop.js';
import { loadDataSync } from '../src/data/node-load.js';
import { toText } from '../src/teletext/render.js';
import { int } from '../src/rng.js';

const EM = '\u2014';
const genCtx = (rng) => ({ data: genData(rng), now: genDate(rng), seed: int(rng, 2 ** 31) });

/** All (id, sub) pairs for a ctx, including the 404 page. */
function* allPages(ctx) {
  for (const id of [...pageIds(), '404']) {
    const first = renderPage(id, 1, ctx);
    for (let s = 1; s <= first.subCount; s++) yield renderPage(id, s, ctx);
  }
}

const REQUIRED = ['100', '101', '400', '666', '667', '800', '888', '899'];

test('required pages are registered and render without throwing', () => {
  const ctx = { data: loadDataSync(), now: new Date(2026, 9, 31, 12), seed: 1 };
  for (const id of REQUIRED) {
    assert.ok(hasPage(id), `page ${id} missing`);
    assert.doesNotThrow(() => renderPage(id, 1, ctx));
  }
  assert.ok(hasPage('013'));
});

test('every page renders with the committed fallback data and shows real content', () => {
  const ctx = { data: loadDataSync(), now: new Date(2026, 9, 31, 12), seed: 1 };
  const news = renderPage('101', 1, ctx);
  assert.match(toText(news.grid).join('\n'), /111/);
  assert.equal(news.cached, true, 'bundled sample data is shown as CACHED');
  let n = 0;
  for (const r of allPages(ctx)) { n++; assert.equal(r.grid.cells.length, COLS * ROWS); }
  assert.ok(n > 60);
});

test('property 1: every page and subpage is exactly 24 rows x 40 columns for random data and seeds', () => {
  forAll(genCtx, (ctx) => {
    for (const r of allPages(ctx)) {
      assert.equal(r.grid.cells.length, COLS * ROWS, `page ${r.id}/${r.sub}`);
      assert.equal(r.grid.rows().length, ROWS);
      for (const row of r.grid.rows()) assert.equal(row.length, COLS);
    }
  }, { runs: 60 });
});

test('property 2: every cell is an allowed code, and no em dash or non ASCII reaches the grid', () => {
  forAll(genCtx, (ctx) => {
    for (const r of allPages(ctx)) {
      for (const code of r.grid.cells) assert.ok(isAllowedCode(code), `page ${r.id}/${r.sub}: code ${code}`);
      assert.ok(!r.grid.rows().join('').includes(EM));
    }
  }, { runs: 60 });
});

test('property 3: row 0 always contains the page number', () => {
  forAll(genCtx, (ctx) => {
    for (const r of allPages(ctx)) {
      if (r.id === '404') continue;
      assert.ok(r.grid.row(0).includes('P' + r.id), `page ${r.id}/${r.sub}: ${JSON.stringify(r.grid.row(0))}`);
    }
  }, { runs: 30 });
});

test('property 5: a double height row is followed by a blank row, and never sits on rows 0, 22 or 23', () => {
  forAll(genCtx, (ctx) => {
    for (const r of allPages(ctx)) {
      for (let row = 0; row < ROWS; row++) {
        const text = r.grid.row(row);
        if (text.includes('\x0d')) {
          assert.ok(row >= 1 && row <= 20, `page ${r.id}/${r.sub}: double height on row ${row}`);
          assert.match(r.grid.row(row + 1), /^ {40}$/, `page ${r.id}/${r.sub}: row ${row + 1} not blank`);
        }
      }
    }
  }, { runs: 40 });
});

test('property 6: every fastext target resolves to a registered page', () => {
  forAll(genCtx, (ctx) => {
    for (const r of allPages(ctx)) {
      assert.equal(r.fastext.length, 4);
      for (const [target, label] of r.fastext) {
        assert.ok(hasPage(target), `page ${r.id}: target ${target} missing`);
        assert.ok(label.length <= 9);
      }
    }
  }, { runs: 30 });
});

test('subpage numbers are clamped and capped at 9', () => {
  const ctx = { data: loadDataSync(), now: new Date(0), seed: 0 };
  const r = renderPage('600', 99, ctx);
  assert.equal(r.sub, r.subCount);
  assert.ok(renderPage('600', -5, ctx).sub === 1);
  for (const id of pageIds()) assert.ok(renderPage(id, 1, ctx).subCount <= 9);
});

test('unknown pages render the not found page under the requested number', () => {
  const ctx = { data: {}, now: new Date(0) };
  const r = renderPage('999', 1, ctx);
  assert.equal(r.found, false);
  assert.match(toText(r.grid).join('\n'), /PAGE NOT FOUND|AGE NOT FOUND/);
  assert.ok(r.grid.row(0).includes('P999'));
});

test('stepPage wraps and only visits registered pages', () => {
  const ids = pageIds();
  assert.equal(stepPage(ids[ids.length - 1], 1), ids[0]);
  assert.equal(stepPage(ids[0], -1), ids[ids.length - 1]);
  assert.ok(REGISTRY.has(stepPage('555', 1)));
});

test('page 666 reports a dead source from status data', () => {
  const data = loadDataSync();
  data.status = { sources: { news: { ok: false, error: 'HTTP 503 for feed', fetchedAt: '2026-01-01T00:00:00Z', items: 3 } } };
  const text = toText(renderPage('666', 1, { data, now: new Date('2026-02-01T00:00:00Z') }).grid).join('\n');
  assert.match(text, /News\s+DEAD/);
  assert.match(text, /HTTP 503/);
});

test('page 667 is deterministic for a given day and data', () => {
  const ctx = { data: loadDataSync(), now: new Date(2026, 9, 31, 8), seed: 5 };
  const a = toText(renderPage('667', 1, ctx).grid).slice(1).join('\n');
  const b = toText(renderPage('667', 1, { ...ctx, now: new Date(2026, 9, 31, 22) }).grid).slice(1).join('\n');
  assert.equal(a, b);
});
