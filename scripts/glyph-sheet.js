// Dev tool: prints every glyph of the built-in font as ASCII art for review in a terminal.
// Usage: node scripts/glyph-sheet.js [characters]   e.g. node scripts/glyph-sheet.js "iVj,."
import { glyph, GLYPH_W, GLYPH_H } from '../src/teletext/font.js';

const chars = process.argv[2] ? [...process.argv[2]] : Array.from({ length: 0x7f - 0x21 }, (_, i) => String.fromCharCode(0x21 + i));
const perLine = 8;
for (let i = 0; i < chars.length; i += perLine) {
  const group = chars.slice(i, i + perLine);
  console.log(group.map((c) => c.padEnd(GLYPH_W + 2)).join(''));
  for (let y = 0; y < GLYPH_H; y++) {
    console.log(group.map((c) => [...Array(GLYPH_W).keys()].map((x) => (glyph(c)[y] & (1 << (GLYPH_W - 1 - x)) ? '#' : '.')).join('').padEnd(GLYPH_W + 2)).join(''));
  }
  console.log('');
}
