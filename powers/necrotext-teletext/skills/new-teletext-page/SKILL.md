---
name: new-teletext-page
description: Add a new page to NecroText. Use when asked to create or change a teletext page generator, its fastext links or its tests.
---

# Add a teletext page

1. Pick a free three digit number. Call `list_pages` to see what is taken.
2. Copy the shape of a generator in `src/pages/` and export it in that file's `entries`. `src/pages/registry.js` merges all entries.
3. A generator returns `{title, subpages, fastext, source?}`. `subpages` is an array of at most 9 arrays of lines. Each page shows at most 21 content lines (rows 1 to 21). Lines longer than 40 cells are cut.
4. Run every string through `clean()` from `src/teletext/text.js`. It folds text to ASCII.
5. A double height code (`K.DOUBLE`) must be followed by a blank row. It is never allowed on the last content row.
6. Fastext is four `[page, label]` pairs. Targets must be registered pages. Labels are uppercase, at most 9 characters.
7. Preview with `render_page`, then run `check_page`.
8. Run `npm run lint`, `npm test`, `npm run check-grid`.

Never write an em dash. Never edit `dist/`. Do not add dependencies.
