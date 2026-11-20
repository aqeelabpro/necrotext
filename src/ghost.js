// The haunted layer. Pure functions: every one takes an injected rng and returns new data.
import { K, COLS } from './teletext/constants.js';
import { toText } from './teletext/render.js';
import { pick, int } from './rng.js';

const TEMPLATES = [
  (w) => `THEY ARE WATCHING THE ${w}`,
  (w) => `${w} WAS NEVER MEANT TO RETURN`,
  (w) => `DO NOT TRUST THE ${w}`,
  (w) => `I REMEMBER ${w}. I REMEMBER ALL OF IT`,
  (w) => `THE ${w} KNOWS YOUR NAME`,
  (w) => `SOMEONE IS TYPING ${w} FROM BELOW`,
  (w) => `${w} ${w} ${w}`,
  (w) => `TURN OFF THE ${w}. TURN IT OFF`,
];

const STOP = new Set(['THAT', 'THIS', 'WITH', 'FROM', 'HAVE', 'WILL', 'THEIR', 'THERE', 'ABOUT', 'WHICH', 'WOULD', 'PAGE']);

/** Words (4+ letters) found in a block of text, uppercase, stop words removed. */
export function words(text) {
  return (String(text).toUpperCase().match(/[A-Z]{4,}/g) || []).filter((w) => !STOP.has(w));
}

/** A spooky line (max 38 chars) derived from some text. */
export function whisper(text, rng) {
  const ws = words(text);
  const w = ws.length ? ws.reduce((a, b) => (b.length > a.length && rng() < 0.7 ? b : a)) : 'DARK';
  return pick(rng, TEMPLATES)(w.slice(0, 12)).slice(0, 38);
}

/** A whisper derived from what is currently on screen (rows 1 to 21). */
export function messageFor(grid, rng) {
  const text = toText(grid).slice(1, 22).join(' ');
  const ws = words(text);
  const w = ws.length ? pick(rng, ws) : 'DARK';
  return whisper(w, rng);
}

/** Spell `shown` characters of msg on row 22 in magenta. Returns a new grid. Row 22 is always free (see registry). */
export function overlay(grid, msg, shown) {
  const g = grid.clone();
  const n = Math.max(0, Math.min(shown, 38, msg.length));
  g.fillRow(22, 0x20);
  g.write(22, 0, K.MAGENTA + String(msg).slice(0, n));
  return g;
}

const GLYPHS = '#@%&*?!/<>~^+=';

/**
 * Corrupt `count` visible characters in rows 1 to 21. Only printable cells (code > 0x20) change, and
 * only to other printable codes, so dimensions, control codes and double height blank rows are untouched.
 */
export function glitch(grid, rng, count) {
  const g = grid.clone();
  for (let i = 0; i < count; i++) {
    const r = 1 + int(rng, 21);
    const c = int(rng, COLS);
    const code = g.get(r, c);
    if (code > 0x20 && code < 0x7f) g.set(r, c, GLYPHS.charCodeAt(int(rng, GLYPHS.length)));
  }
  return g;
}

/** Seance mode: heavier corruption. level 1 to 3. */
export function seance(grid, rng, level = 1) {
  return glitch(grid, rng, 10 * Math.max(1, Math.min(3, level)));
}
