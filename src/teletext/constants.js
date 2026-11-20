// World System Teletext level 1 constants.
export const COLS = 40;
export const ROWS = 24;

export const COLOR_NAMES = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
export const HEX = ['#000000', '#ff2a1a', '#1aff3c', '#ffee1a', '#2a3cff', '#ff2aff', '#1affff', '#ffffff'];

/** Control code values (0x00-0x1F). Colours 1-7 and mosaic colours 0x11-0x17. */
export const CTRL = {
  RED: 0x01, GREEN: 0x02, YELLOW: 0x03, BLUE: 0x04, MAGENTA: 0x05, CYAN: 0x06, WHITE: 0x07,
  FLASH: 0x08, STEADY: 0x09, NORMAL: 0x0c, DOUBLE: 0x0d,
  M_RED: 0x11, M_GREEN: 0x12, M_YELLOW: 0x13, M_BLUE: 0x14, M_MAGENTA: 0x15, M_CYAN: 0x16, M_WHITE: 0x17,
  CONCEAL: 0x18, CONTIG: 0x19, SEP: 0x1a, BLACKBG: 0x1c, NEWBG: 0x1d, HOLD: 0x1e, RELEASE: 0x1f,
};

/** Control codes as one-character strings, for building rows in template strings. */
export const K = Object.fromEntries(Object.entries(CTRL).map(([k, v]) => [k, String.fromCharCode(v)]));

export const DEFINED_CONTROL = new Set(Object.values(CTRL));

/** Is this code allowed in a page grid? */
export const isAllowedCode = (c) => (c >= 0x20 && c <= 0x7f) || DEFINED_CONTROL.has(c);
