import { COLS, ROWS, HEX } from '../teletext/constants.js';
import { glyph, GLYPH_W, GLYPH_H, BOX_W, BOX_H } from '../teletext/font.js';

// The 40x24 grid (800x600) sits inside a black overscan border so the rounded tube never clips it.
export const GRID_W = 800;
export const GRID_H = 600;
export const MARGIN_X = 40;
export const MARGIN_Y = 30;
export const SCREEN_W = GRID_W + 2 * MARGIN_X;
export const SCREEN_H = GRID_H + 2 * MARGIN_Y;
const CW = GRID_W / COLS;
const CH = GRID_H / ROWS;
const PX = CW / BOX_W;
const PY = CH / BOX_H;

// Paint one glyph as filled rectangles, merging horizontal runs. Glyph rows start one box row down.
function drawGlyph(ctx, ch, ox, oy) {
  const rows = glyph(ch);
  for (let r = 0; r < GLYPH_H; r++) {
    const bits = rows[r];
    for (let x = 0; x < GLYPH_W; x++) {
      if (!(bits & (1 << (GLYPH_W - 1 - x)))) continue;
      let end = x + 1;
      while (end < GLYPH_W && bits & (1 << (GLYPH_W - 1 - end))) end++;
      ctx.fillRect(ox + x * PX, oy + (r + 1) * PY, (end - x) * PX, PY);
      x = end;
    }
  }
}

/**
 * Draw resolved cells onto a 2D canvas context. Mosaics and text are exact rectangles (text uses the built-in
 * pixel font), double height is a clipped 2x vertical scale.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<Array<object>>} cells output of resolve()
 * @param {{flashOn?: boolean, reveal?: boolean}} opts
 */
export function drawScreen(ctx, cells, { flashOn = true, reveal = false } = {}) {
  ctx.fillStyle = HEX[0];
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = cells[r][c];
      const x = MARGIN_X + c * CW;
      const y = MARGIN_Y + r * CH;
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
        drawGlyph(ctx, cell.ch, ox, oy); // the font draws 0x23 as the UK pound sign
      }
      if (cell.dbl) ctx.restore();
    }
  }
}
