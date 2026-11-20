import { K } from './constants.js';

// Sixel bits: 1=top-left 2=top-right 4=mid-left 8=mid-right 16=bottom-left 32=bottom-right.
export const TL = 1, TR = 2, ML = 4, MR = 8, BL = 16, BR = 32;

/** bits (0-63) to a teletext code in mosaic mode. */
export const sixel = (bits) => 0x20 | (bits & 0x1f) | ((bits & 0x20) << 1);
/** teletext code (0x20-0x3F, 0x60-0x7F) to bits. */
export const unsixel = (code) => (code & 0x1f) | ((code & 0x40) >> 1);
/** In mosaic mode, codes 0x40-0x5F remain letters. */
export const isMosaicCode = (code) => (code >= 0x20 && code <= 0x3f) || (code >= 0x60 && code <= 0x7f);

const LETTER_COLOUR = { R: 1, G: 2, Y: 3, B: 4, M: 5, C: 6, W: 7 };
const MCOL = (n) => String.fromCharCode(0x10 + n);

/**
 * Turn a pixel bitmap into rows of cells. Each cell covers 2x3 pixels.
 * Pixel characters: '.' empty, R G Y B M C W colours. A cell takes the first colour found in it.
 * Rows begin in alpha mode, so a mosaic colour code is emitted before the first lit cell
 * and whenever the colour changes.
 */
export function fromBitmap(lines) {
  const h = Math.ceil(lines.length / 3) * 3;
  const w = Math.ceil(Math.max(0, ...lines.map((l) => l.length)) / 2) * 2;
  const px = (x, y) => (lines[y] && lines[y][x]) || '.';
  const out = [];
  for (let cy = 0; cy < h / 3; cy++) {
    let row = '';
    let cur = 0;
    for (let cx = 0; cx < w / 2; cx++) {
      let bits = 0;
      let col = 0;
      const pts = [[0, 0, TL], [1, 0, TR], [0, 1, ML], [1, 1, MR], [0, 2, BL], [1, 2, BR]];
      for (const [dx, dy, b] of pts) {
        const ch = px(cx * 2 + dx, cy * 3 + dy);
        if (ch !== '.' && ch !== ' ') {
          bits |= b;
          if (!col) col = LETTER_COLOUR[ch] || 7;
        }
      }
      if (!bits) {
        row += String.fromCharCode(0x20);
        continue;
      }
      if (col !== cur) {
        row += MCOL(col);
        cur = col;
      }
      row += String.fromCharCode(sixel(bits));
    }
    out.push(row);
  }
  return out;
}

/** Horizontal bar of width cells (excluding the one colour cell). value/max in 0..1 range. */
export function bar(value, max, width, colour = 2) {
  const f = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const half = Math.round(f * width * 2);
  const full = Math.floor(half / 2);
  let s = MCOL(colour) + String.fromCharCode(sixel(63)).repeat(full);
  if (half % 2 === 1) s += String.fromCharCode(sixel(TL | ML | BL));
  return s.padEnd(width + 1, ' ');
}

/** Sparkline chart: rows*3 pixel levels, 2 pixel columns per cell. Returns `rows` strings. */
export function chart(values, width, rows = 3, colourLetter = 'Y') {
  const vals = values.filter((v) => Number.isFinite(v));
  const lines = Array.from({ length: rows * 3 }, () => '');
  if (!vals.length) return fromBitmap(lines.map(() => '.'.repeat(width * 2)));
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const totalH = rows * 3;
  for (let x = 0; x < width * 2; x++) {
    const v = vals[Math.min(vals.length - 1, Math.floor((x * vals.length) / (width * 2)))];
    const level = 1 + Math.round(((v - min) / span) * (totalH - 1));
    for (let y = 0; y < totalH; y++) lines[y] += y >= totalH - level ? colourLetter : '.';
  }
  return fromBitmap(lines);
}

/** A framed box in mosaic. Each content line must have length <= innerWidth (control codes count). */
export function box(inner, innerWidth, colour = 6) {
  const m = MCOL(colour);
  const c = (bits) => String.fromCharCode(sixel(bits));
  const bar2 = c(TL | TR);
  const barB = c(BL | BR);
  const top = m + c(TL | TR | ML | BL) + bar2.repeat(innerWidth + 2) + c(TL | TR | MR | BR);
  const bot = m + c(TL | ML | BL | BR) + barB.repeat(innerWidth + 2) + c(TR | MR | BR | BL);
  const mid = inner.map(
    (l) => m + c(TL | ML | BL) + K.WHITE + l.padEnd(innerWidth, ' ').slice(0, innerWidth) + m + c(TR | MR | BR),
  );
  return [top, ...mid, bot];
}

/** Rainbow bar of full blocks, 5 cells per colour. */
export const rainbow = () =>
  [1, 3, 2, 6, 4, 5, 7].map((n) => MCOL(n) + String.fromCharCode(sixel(63)).repeat(4)).join('');
