# NecroText Core: Requirements

NecroText revives Teletext (Ceefax and Oracle) as a static web app. Requirements use EARS notation.

## Glossary
- **Page**: a 40 column by 24 row grid of 7 bit codes.
- **Control code**: a code from 0x00 to 0x1F that occupies a cell and changes how later cells display.
- **Fastext**: the four colour keys (red, green, yellow, cyan) that jump to linked pages.

## Requirements

1. WHEN any page is rendered, THE System SHALL produce a grid of exactly 24 rows and 40 columns.
2. THE System SHALL restrict every cell to a printable code from 0x20 to 0x7F or a defined control code.
3. WHEN a control code appears in a row, THE Renderer SHALL display it as a space (or the held mosaic) and apply its effect to the following cells, except for steady, normal height, black background, new background and hold, which apply at their own cell.
4. WHEN a new row starts, THE Renderer SHALL reset foreground to white, background to black, alpha mode and normal height.
5. WHEN a row contains double height cells, THE Renderer SHALL draw the lower half in the next row, and THE Page generator SHALL leave that row blank.
6. THE System SHALL render row 0 as a header holding the page number, the page title and the clock.
7. WHEN a page has more than one subpage, THE System SHALL show the label `Pnnn/s` in the header and turn subpages over every ten seconds.
8. THE System SHALL render row 23 as four colour key labels, and every fastext target SHALL be a registered page.
9. WHEN the user types three digits, THE UI SHALL show `P---` progressively in the header, then roll through page numbers while the page "searches".
10. WHEN the user presses R, G, Y or B (or F1 to F4), THE UI SHALL navigate to the matching fastext link.
11. WHEN the user presses Up, Down, +, or -, THE UI SHALL move to the next or previous registered page.
12. WHEN the user presses Left or Right, THE UI SHALL change subpage.
13. WHEN the URL hash is `#/nnn` or `#/nnn/s`, THE UI SHALL open that page, and THE UI SHALL keep the hash in step with navigation.
14. WHEN the user requests an unknown page, THE System SHALL show a teletext styled PAGE NOT FOUND page.
15. WHILE the user prefers reduced motion, THE UI SHALL disable flicker, flashing and the searching roll.
16. THE System SHALL ship with zero runtime dependencies and no external font or asset downloads.
17. THE System SHALL NOT use em dashes in page content, documentation or code.
18. WHEN given any input data (including malformed feeds), THE Page generators SHALL NOT throw.
