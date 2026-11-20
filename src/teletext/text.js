import { K } from './constants.js';

const MAP = {
  '\u2014': '-', '\u2013': '-', '\u2015': '-', '\u2012': '-', '\u2212': '-',
  '\u2018': "'", '\u2019': "'", '\u201a': ',', '\u201c': '"', '\u201d': '"', '\u201e': '"',
  '\u2026': '...', '\u00a3': '#', '\u00a0': ' ', '\u2022': '*', '\u00d7': 'x', '\u20ac': 'EUR ',
  '\u00df': 'ss', '\u00e6': 'ae', '\u00c6': 'AE', '\u00f8': 'o', '\u00d8': 'O', '\u0111': 'd',
  '\u0142': 'l', '\u0141': 'L', '\u0153': 'oe', '\u0152': 'OE', '\u00b0': 'deg ',
};

/** Fold any string to printable 7 bit ASCII (0x20-0x7E). Never returns control characters. */
export function fold(input) {
  const s = String(input ?? '');
  let out = '';
  for (const ch of s.normalize('NFKD')) {
    if (MAP[ch] !== undefined) {
      out += MAP[ch];
      continue;
    }
    const c = ch.codePointAt(0);
    if (c >= 0x300 && c <= 0x36f) continue; // combining accents
    if (c < 0x20 || c === 0x7f) out += ' ';
    else if (c < 0x7f) out += ch;
    else if (c >= 0x2000) continue; // symbols and emoji are dropped
    else out += '?';
  }
  return out;
}

/** fold, collapse whitespace and trim. */
export const clean = (s) => fold(s).replace(/\s+/g, ' ').trim();
export const upper = (s) => clean(s).toUpperCase();

/** Word wrap. Lines never exceed width; every non-space character is preserved in order. */
export function wrap(text, width) {
  const w = Math.max(1, Math.floor(width));
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (let word of words) {
    while (word.length > w) {
      if (cur) {
        lines.push(cur);
        cur = '';
      }
      lines.push(word.slice(0, w));
      word = word.slice(w);
    }
    if (!cur) cur = word;
    else if (cur.length + 1 + word.length <= w) cur += ' ' + word;
    else {
      lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function truncate(text, width) {
  const s = String(text ?? '');
  if (s.length <= width) return s;
  if (width <= 3) return s.slice(0, Math.max(0, width));
  return s.slice(0, width - 3) + '...';
}

export function center(text, width) {
  const s = truncate(text, width);
  const left = Math.floor((width - s.length) / 2);
  return ' '.repeat(left) + s;
}

/** Double height line. Returns two rows: the doubled text row and the blank row it covers. */
export function dbl(text, colour = 'YELLOW') {
  return [K.DOUBLE + K[colour] + truncate(text, 38), ''];
}

/** Right aligned: pads the left side so the result is exactly width cells. */
export const padLeft = (s, width) => String(s).padStart(width, ' ').slice(-width);
