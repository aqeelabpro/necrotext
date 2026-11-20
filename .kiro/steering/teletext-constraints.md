---
inclusion: always
---
# Teletext constraints

These are hard rules. Tests enforce them.

- A page is 40 columns by 24 rows. Row 0 is the header, row 23 the fastext footer, row 22 is reserved for ghost whispers, content uses rows 1 to 21.
- Cell codes are 0x20 to 0x7F, plus control codes 0x01-0x09, 0x0C, 0x0D, 0x11-0x18, 0x19, 0x1A, 0x1C-0x1F.
- A control code occupies a cell. Colours, flash, double height, conceal, contiguous/separated apply to the NEXT cell. Steady, normal height, black bg, new bg and hold apply at their own cell.
- Attributes reset at the start of every row.
- Palette is the eight teletext colours: black, red, green, yellow, blue, magenta, cyan, white.
- A double height row must be followed by a blank row. Never on rows 0, 22, 23.
- Mosaic characters are 2x3 sixels: codes 0x20-0x3F and 0x60-0x7F. 0x40-0x5F stay letters.
- All text is folded to ASCII with `clean()` from `src/teletext/text.js` before it reaches a grid.
- Never write an em dash (U+2014) anywhere: pages, docs, code, commit messages. Use a hyphen or rewrite the sentence.
- Max 9 subpages per page, so the label `P101/9` fits 6 cells.
