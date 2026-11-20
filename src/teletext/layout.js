import { K, COLS } from './constants.js';
import { truncate } from './text.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const p2 = (n) => String(n).padStart(2, '0');

/** "Fri 31 Oct 12:34" (16 cells) */
export function clockText(now) {
  const d = now instanceof Date && !isNaN(now) ? now : new Date(0);
  return `${DAYS[d.getDay()]} ${p2(d.getDate())} ${MONTHS[d.getMonth()]} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

/** Row 0: 7 cell label, 16 cell title/cached area, 17 cell clock. Always exactly 40 cells. */
export function header({ label, title, now, cached = false }) {
  const lab = truncate(label, 6).padEnd(6, ' ');
  let mid;
  if (cached) mid = String(title).slice(0, 7).padEnd(7, ' ') + K.RED + 'CACHED';
  else mid = truncate(title, 14).padEnd(14, ' ');
  return K.WHITE + lab + ' ' + K.YELLOW + mid + K.CYAN + clockText(now);
}

const FAST_CODES = [K.RED, K.GREEN, K.YELLOW, K.CYAN];

/** Row 23: four 10 cell colour key labels. `fastext` is [[page, label] x4]. */
export function footer(fastext) {
  let s = '';
  for (let i = 0; i < 4; i++) {
    const label = (fastext[i] && fastext[i][1]) || '';
    s += FAST_CODES[i] + String(label).slice(0, 9).padEnd(9, ' ');
  }
  return s;
}

/** Coloured banner row, 40 cells: [bg colour][new bg][fg colour] text. */
export function banner(text, fg = 'WHITE', bg = 'BLUE') {
  return (K[bg] + K.NEWBG + K[fg] + ' ' + truncate(text, 35)).padEnd(COLS, ' ');
}
