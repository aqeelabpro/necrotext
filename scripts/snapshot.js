// Render pages to SVG files in docs/screens/ so the README has screenshots without a browser.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from '../src/pages/registry.js';
import { resolve } from '../src/teletext/render.js';
import { loadDataSync } from '../src/data/node-load.js';
import { HEX } from '../src/teletext/constants.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CW = 16, CH = 20;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function toSvg(grid) {
  const rows = resolve(grid);
  let body = '';
  rows.forEach((row, r) => {
    row.forEach((c, x) => {
      const px = x * CW, py = r * CH;
      if (c.bg) body += `<rect x="${px}" y="${py}" width="${CW}" height="${CH}" fill="${HEX[c.bg]}"/>`;
      if (c.conceal) return;
      if (c.mosaic) {
        for (let b = 0; b < 6; b++) {
          if (!(c.bits & (1 << b))) continue;
          const bx = px + (b % 2) * (CW / 2), by = py + Math.floor(b / 2) * (CH / 3);
          body += `<rect x="${bx}" y="${by}" width="${CW / 2}" height="${CH / 3}" fill="${HEX[c.fg]}"/>`;
        }
      } else if (c.ch !== ' ') {
        const ch = c.ch === '#' ? '\u00a3' : c.ch;
        if (c.dbl) {
          const y0 = c.dbl === 1 ? py + CH : py;
          body += `<text transform="translate(${px + CW / 2} ${y0}) scale(1 2)" dominant-baseline="middle" text-anchor="middle" fill="${HEX[c.fg]}" font-size="17">${esc(ch)}</text>`;
        } else body += `<text x="${px + CW / 2}" y="${py + CH / 2}" dominant-baseline="middle" text-anchor="middle" fill="${HEX[c.fg]}">${esc(ch)}</text>`;
      }
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${40 * CW} ${24 * CH}" width="${40 * CW}" height="${24 * CH}" font-family="Courier New, monospace" font-weight="bold" font-size="17"><rect width="100%" height="100%" fill="#000"/>${body}</svg>\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const ctx = { data: loadDataSync(), now: new Date(2026, 9, 31, 12, 0), seed: 1 };
  const out = path.join(ROOT, 'docs', 'screens');
  fs.mkdirSync(out, { recursive: true });
  for (const id of ['100', '101', '400', '666', '667', '701', '710']) {
    fs.writeFileSync(path.join(out, `page-${id}.svg`), toSvg(renderPage(id, 1, ctx).grid));
  }
  console.log('wrote docs/screens/*.svg');
}
