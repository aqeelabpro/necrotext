# NecroText: Devpost draft

**Category:** Resurrection
**Tagline:** Teletext rises from the grave.

## Inspiration
Ceefax and Oracle taught a generation to type three digits and wait for a page to appear. Both died when analogue TV was switched off in 2012. I wanted to know what a service built on a 40 by 24 grid would feel like on today's web, and to treat the real constraints as the design.

## What it does
NecroText is a Teletext service in your browser. Type a page number, press the colour keys, watch the header roll through page numbers while it "searches". It has news, tech and Hacker News headlines, weather with mosaic icons and a temperature graph, TV listings, a quiz that hides its answers behind the Reveal key, and a haunted house you play with the red, green, yellow and cyan keys.

The haunted layer is useful. Page 666, The Dead Letter Office, is a real health report of every data feed (alive, stale or dead, with errors and stories missing summaries). Page 667, The Oracle, reads your fortune from today's headlines. Ghost whispers spell themselves on the bottom row using words from the page you are reading, and Seance mode (S) tints the screen red and corrupts text.

## How I built it
Pages are 40 by 24 grids of 7 bit codes, resolved with real serial attributes (a colour code takes up a cell and affects the cells after it). The renderer is separate from the DOM, so most of the app is tested in Node. There are zero dependencies. The site is static on GitHub Pages and a workflow refreshes the data every 30 minutes.

Kiro shaped the process: three specs with EARS requirements, five steering files (including the hard "40x24, no em dashes" rules), and four hooks that run tests and page checks automatically. Property tests drive random hostile feed data through every page. Details in `docs/HOW_KIRO_WAS_USED.md`.

## Challenges
- Getting serial attributes right: some codes act at their own cell and others on the next.
- Double height, which needs a blank row below and a clipped 2x canvas scale.
- Building without network access: no npm, no live feeds. I wrote a tiny RSS parser, a seeded property test helper, and hand-authored sample data.

## Accomplishments
- Authentic control code behaviour, not a CSS imitation.
- Every page proven 40 by 24 across random data.
- A spooky feature that doubles as a monitoring page.

## What I learned
Strict constraints make design easier. Writing the rules in steering and specs meant I could turn them into tests and hooks.

## What's next
More feeds, sound, and a page showing Kiro hook activity.

## Built with
JavaScript, HTML canvas, Node test runner, GitHub Actions, GitHub Pages, Kiro.

---

# 3 minute demo video script

| Time | Shot | Say |
|---|---|---|
| 0:00 | Black screen, flicker, page 100 rolls in. | "Teletext died in 2012. This is NecroText." |
| 0:10 | Type 1 0 1. Header shows P1-- then searches. | "Three digits, then the wait. Just like the real thing." |
| 0:25 | Press Right for subpage 2. Press green for a story. | "Subpages turn over on their own. Colour keys follow Fastext links." |
| 0:45 | Page 400 weather, then 401 with the graph. | "Mosaic graphics are drawn with real 2 by 3 sixels." |
| 1:05 | Press C to toggle CRT. | "Scanlines, glow, flicker. Off for reduced motion." |
| 1:15 | Page 701, press X. | "Quiz answers are concealed text. X reveals." |
| 1:30 | Page 710, play the house with colour keys. | "A text adventure for a remote control." |
| 1:50 | Page 666. | "The haunted layer is useful. This is a real feed health report." |
| 2:05 | Page 667, then 888. Wait for a ghost whisper on the bottom row. | "The ghost reads the page and whispers back." |
| 2:20 | Press S for Seance. | "Seance mode: red, flickering, corrupted." |
| 2:30 | Split: `.kiro/` specs, steering, hooks, then terminal `npm test`. | "Built with Kiro: three specs, five steering files, four hooks, and property tests over every page." |
| 2:50 | Page 100 again, URL visible. | "Static, zero dependencies, on GitHub Pages. NecroText." |
