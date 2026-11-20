# NecroText: Devpost text

**Category:** Resurrection
**Tagline:** Teletext rises from the grave.

**Try it:** https://aqeelabpro.github.io/necrotext/ (type 666, or press H for help)
**Repo:** https://github.com/aqeelabpro/necrotext (MIT licence)
**Kiro write-up:** [docs/HOW_KIRO_WAS_USED.md](HOW_KIRO_WAS_USED.md)

## Inspiration
Ceefax and Oracle taught a generation to type three digits and wait for a page to appear. Both died when analogue TV was switched off in 2012. I wanted to know what a service built on a 40 by 24 grid feels like on today's web, and to treat the original constraints as the design.

## What it does
NecroText is a Teletext service in your browser. Type a page number, press the colour keys, and watch the header search before the page loads. It has news, tech and Hacker News headlines, weather with mosaic icons, TV listings, a quiz that hides its answers behind the Reveal key, and a haunted house you play with the four colour keys. A bundled sample keeps it working offline, and a workflow refreshes live data every 30 minutes.

The haunted layer is useful. Page 666, The Dead Letter Office, is a real health report of every data feed (alive, stale or dead, with errors and stories missing summaries). Page 667, The Oracle, quotes today's headlines. Ghost whispers spell themselves on the bottom row using words from the page you are reading, and Seance mode (S) tints the screen red and corrupts the text.

## How we built it (Kiro)
Pages are 40 by 24 grids of 7 bit codes resolved with real serial attributes. The renderer is separate from the DOM, so most of the app is tested in Node. There are zero dependencies, and the site is static on GitHub Pages.

Kiro shaped the work at every level:
- **Specs:** three specs with EARS requirements. One sentence about double height rows became a generator rule, a registry check and a property test.
- **Steering:** five files, three always on and two that load only for matching files. They hold the hard 40x24 and no em dash rules.
- **Hooks:** five, for tests on save, data rebuilds, page checklists, a manual lint and grid check, and a check through the MCP server.
- **MCP server:** a zero dependency stdio server with `list_pages`, `render_page`, `check_page` and `data_status`, so an agent can see a page the way a viewer does.
- **Custom agents and a power:** a `page-designer` agent, a read-only `broadcast-reviewer`, and a power that bundles the MCP config with two skills.
- **Property tests:** a hand-rolled seeded `forAll` with shrinking pushes hostile feed data through every page.
- **Agents in a sandboxed Kiro session** built it: a planner, coder sub-agents and a reviewer. The planner used the Playwright power to take real browser screenshots, which found display bugs the unit tests could not.

Honest note: the hooks, agents, MCP wiring and power are covered by tests but they have not yet been confirmed running inside the Kiro IDE. The owner checklist in the write-up lists what to check. See `docs/HOW_KIRO_WAS_USED.md`.

## Challenges
- Serial attributes: some codes act at their own cell and others on the next.
- Bugs only a browser shows: concealed text that was visible, clipped edges, wrong glyphs. Fixed with a hand-drawn pixel font, an overscan safe area and new tests.
- Building without network access: no npm, no live feeds. I wrote a small RSS parser, a seeded property helper, and a script that seeds data from the last deployed site.

## Accomplishments
- Authentic control code behaviour, not a CSS imitation.
- Every page proven 40 by 24 across random hostile data.
- A spooky feature that doubles as a monitoring page.
- 92 passing tests and no runtime dependencies.

## What we learned
Strict constraints make design easier. Writing rules once in steering and specs let me turn them into tests, hooks and an MCP check, and look at the real output instead of trusting it.

## What's next
More feeds, a subtitles page driven by real captions, and a page showing hook activity.

## Built with
JavaScript (ES modules), HTML canvas, Node test runner, GitHub Actions, GitHub Pages, Kiro (specs, steering, hooks, custom agents, MCP, powers).

---

# Demo video script (2:45, under the 3 minute limit)

| Time | Shot | Say |
|---|---|---|
| 0:00-0:12 | Black screen, flicker, page 100 appears. | "Teletext died in 2012. This is NecroText, and it is alive." |
| 0:12-0:30 | Type 1 0 1. Header shows P1-- and searches. Turn a subpage. | "Three digits, then the wait. Just like the real thing." |
| 0:30-0:50 | Colour keys to 400 weather. | "Colour keys follow Fastext links. Weather icons are real 2 by 3 mosaic sixels." |
| 0:50-1:05 | Press C for CRT off and on. | "Scanlines and glow, off for reduced motion." |
| 1:05-1:25 | Page 701, press X. Then 710 for a few moves. | "Quiz answers are concealed text. X reveals them. The house is a text adventure for four coloured keys." |
| 1:25-1:50 | Page 666, then 667, then 888 with a ghost whisper. Press S. | "The haunted layer is useful. 666 is a real feed health report. The Oracle quotes today's headlines. Seance mode corrupts the screen on purpose." |
| 1:50-2:25 | Kiro IDE: specs, steering, hooks panel. Save a page file and show a hook firing. Switch to page-designer and ask it to render page 400 through MCP. | "Three specs, five steering files, five hooks, a custom agent and an MCP server that lets the agent look at a page." |
| 2:25-2:38 | Terminal: `npm test`, then the passing count. | "Property tests throw hostile data at every page. Ninety-two tests, zero dependencies." |
| 2:38-2:45 | Page 100 with the URL visible. | "Static on GitHub Pages. NecroText." |

Record the IDE segment only after the owner checklist in `HOW_KIRO_WAS_USED.md` passes. Do not show anything that did not run.

---

# Submission checklist

- [ ] Repo is public: https://github.com/aqeelabpro/necrotext
- [ ] MIT licence is visible in the repo (`LICENSE`), and in `package.json` (page 800 About does not mention it)
- [ ] `.kiro/` is at the repo root and is not gitignored
- [ ] Live URL works and page 100 does not say SAMPLE DATA: https://aqeelabpro.github.io/necrotext/
- [ ] Page 666 shows live feeds ALIVE after the first scheduled run
- [ ] Hooks, agents, MCP server and power confirmed in the Kiro IDE (checklist in `HOW_KIRO_WAS_USED.md`)
- [ ] Demo video under 3 minutes recorded, uploaded to YouTube, set to public, link added to the Devpost form
- [ ] Category Resurrection selected
- [ ] Best Student Project eligibility ticked (solo student project)
- [ ] Kiro write-up linked (`docs/HOW_KIRO_WAS_USED.md`)
- [ ] Text description pasted from this file, screenshots uploaded from `docs/screens/`
