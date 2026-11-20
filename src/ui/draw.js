import { COLS, ROWS, HEX } from '../teletext/constants.js';

export const SCREEN_W = 800;
export const SCREEN_H = 600;
const CW = SCREEN_W / COLS;
const CH = SCREEN_H / ROWS;

/**
 * Draw resolved cells onto a 2D canvas context. Mosaics are exact rectangles, text is a monospace font
 * squeezed into the cell, double height is a clipped 2x vertical scale.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<Array<object>>} cells output of resolve()
 * @param {{flashOn?: boolean, reveal?: boolean}} opts
 */
export function drawScreen(ctx, cells, { flashOn = true, reveal = false } = {}) {
  ctx.fillStyle = HEX[0];
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(CH * 0.86)}px "Courier New", ui-monospace, Menlo, Consolas, monospace`;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = cells[r][c];
      const x = c * CW;
      const y = r * CH;
      if (cell.bg) {
        ctx.fillStyle = HEX[cell.bg];
        ctx.fillRect(x, y, CW, CH);
      }
      if ((cell.conceal && !reveal) || (cell.flash && !flashOn)) continue;
      const isBlock = !cell.mosaic && cell.ch === '\x7f';
      if (!cell.mosaic && !isBlock && cell.ch === ' ') continue;
      ctx.fillStyle = HEX[cell.fg];
      let ox = x;
      let oy = y;
      if (cell.dbl) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, CW, CH);
        ctx.clip();
        ctx.translate(x, cell.dbl === 1 ? y : y - CH);
        ctx.scale(1, 2);
        ox = 0;
        oy = 0;
      }
      if (cell.mosaic || isBlock) {
        const bits = isBlock ? 63 : cell.bits;
        const gap = cell.sep && !isBlock ? 1 : 0;
        for (let b = 0; b < 6; b++) {
          if (!(bits & (1 << b))) continue;
          const bx = ox + (b % 2) * (CW / 2);
          const by = oy + Math.floor(b / 2) * (CH / 3);
          ctx.fillRect(bx + gap, by + gap, CW / 2 - gap, CH / 3 - gap);
        }
      } else {
        const ch = cell.ch === '#' ? '\u00a3' : cell.ch; // UK teletext set: 0x23 is the pound sign
        ctx.fillText(ch, ox + CW / 2, oy + CH / 2 + 1, CW);
      }
      if (cell.dbl) ctx.restore();
    }
  }
}
