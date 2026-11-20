---
name: teletext-mosaics
description: Draw mosaic (block graphic) art on a NecroText page. Use when asked for logos, borders, banners or pictures made of teletext sixels.
---

# Mosaics

- A page is 40 columns by 24 rows. Content uses rows 1 to 21.
- A mosaic cell is a 2 by 3 grid of sixels. Codes 0x20 to 0x3F and 0x60 to 0x7F draw mosaics once a mosaic colour code is active. Codes 0x40 to 0x5F stay letters.
- Colour, flash, double height, conceal and contiguous or separated codes take effect on the next cell. Steady, normal height, black background, new background and hold take effect at their own cell.
- A control code occupies a cell. A row of art with a colour code at the start has 39 usable cells.
- Attributes reset at the start of every row, so set the colour again on each row.
- The palette is black, red, green, yellow, blue, magenta, cyan, white.
- Helpers live in `src/teletext/mosaic.js`. Constants and control codes are in `src/teletext/constants.js`.
- `render_page` shows mosaic cells as `#`. It is a shape check only. Look at `docs/screens/` or run `npm run snapshot` for colour.

Run `check_page` after any change. Never write an em dash.
