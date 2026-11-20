import { COLS, ROWS } from './constants.js';
import { unsixel, isMosaicCode } from './mosaic.js';

/**
 * Resolve serial attributes into per cell display state.
 * Rules follow World System Teletext level 1:
 *  - a control code occupies a cell and displays as a space (or the held mosaic)
 *  - colours, flash, double height, conceal, contiguous/separated and release take effect from the NEXT cell
 *  - steady, normal height, black bg, new bg and hold take effect AT their own cell
 *  - state resets at the start of every row
 *  - a row containing double height is followed by a row showing the lower half
 *
 * Cell: { ch, mosaic, bits, sep, fg, bg, flash, conceal, dbl (0 none,1 top,2 bottom), ctrl }
 * @returns {Array<Array<object>>} 24 rows of 40 cells
 */
export function resolve(grid) {
  const out = [];
  let lowerOf = -1;
  for (let r = 0; r < ROWS; r++) {
    if (lowerOf === r - 1 && r > 0) {
      out.push(
        out[r - 1].map((c) =>
          c.dbl === 1 ? { ...c, dbl: 2 } : { ...c, ch: ' ', mosaic: false, bits: 0, dbl: 0, flash: false },
        ),
      );
      continue;
    }
    const st = { fg: 7, bg: 0, mosaic: false, sep: false, flash: false, conceal: false, dbl: false, hold: false, held: null };
    let rowDouble = false;
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const code = grid.get(r, c);
      let cell;
      if (code < 0x20) {
        if (code === 0x09) st.flash = false;
        else if (code === 0x0c) st.dbl = false;
        else if (code === 0x1c) st.bg = 0;
        else if (code === 0x1d) st.bg = st.fg;
        else if (code === 0x1e) st.hold = true;
        cell = { ch: ' ', mosaic: false, bits: 0, sep: st.sep, fg: st.fg, bg: st.bg, flash: st.flash, conceal: st.conceal, dbl: st.dbl ? 1 : 0, ctrl: true };
        if (st.hold && st.held) {
          cell.mosaic = true;
          cell.bits = st.held.bits;
          cell.sep = st.held.sep;
        }
        if (code >= 0x01 && code <= 0x07) {
          st.mosaic = false; st.fg = code; st.conceal = false; st.held = null;
        } else if (code >= 0x11 && code <= 0x17) {
          st.mosaic = true; st.fg = code - 0x10; st.conceal = false;
        } else if (code === 0x08) st.flash = true;
        else if (code === 0x0d) { st.dbl = true; rowDouble = true; }
        else if (code === 0x18) st.conceal = true;
        else if (code === 0x19) st.sep = false;
        else if (code === 0x1a) st.sep = true;
        else if (code === 0x1f) st.hold = false;
      } else if (st.mosaic && isMosaicCode(code)) {
        const bits = unsixel(code);
        cell = { ch: ' ', mosaic: true, bits, sep: st.sep, fg: st.fg, bg: st.bg, flash: st.flash, conceal: st.conceal, dbl: st.dbl ? 1 : 0, ctrl: false };
        st.held = { bits, sep: st.sep };
      } else {
        cell = { ch: String.fromCharCode(code), mosaic: false, bits: 0, sep: false, fg: st.fg, bg: st.bg, flash: st.flash, conceal: st.conceal, dbl: st.dbl ? 1 : 0, ctrl: false };
      }
      row.push(cell);
    }
    out.push(row);
    if (rowDouble && r < ROWS - 1) lowerOf = r;
  }
  return out;
}

/** Plain text view of a grid (mosaic cells become '#', controls become spaces). */
export function toText(grid) {
  return resolve(grid).map((row) => row.map((c) => (c.mosaic ? (c.bits ? '#' : ' ') : c.ch)).join(''));
}
