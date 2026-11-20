import { COLS, ROWS } from './constants.js';

/** A 40x24 page of raw 7 bit codes. Control codes occupy a cell like real teletext. */
export class Grid {
  constructor() {
    this.cells = new Uint8Array(COLS * ROWS).fill(0x20);
  }
  get(r, c) {
    return this.cells[r * COLS + c];
  }
  set(r, c, code) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    this.cells[r * COLS + c] = code > 0x7f ? 0x3f : code;
  }
  /** Write a string (control characters allowed) starting at (r, c). Clips at the right edge. */
  write(r, c, str) {
    for (let i = 0; i < str.length; i++) this.set(r, c + i, str.charCodeAt(i));
  }
  /** Replace a whole row with a string, padded with spaces. */
  setRow(r, str) {
    this.fillRow(r, 0x20);
    this.write(r, 0, str);
  }
  fillRow(r, code = 0x20) {
    for (let c = 0; c < COLS; c++) this.set(r, c, code);
  }
  row(r) {
    return String.fromCharCode(...this.cells.subarray(r * COLS, (r + 1) * COLS));
  }
  rows() {
    return Array.from({ length: ROWS }, (_, r) => this.row(r));
  }
  clone() {
    const g = new Grid();
    g.cells.set(this.cells);
    return g;
  }
}
