# How Kiro was used

NecroText was built with Kiro as a solo student project. This page lists what Kiro produced and how it shaped the code, including the limits.

## 1. Spec-driven development (`.kiro/specs/`)

Three specs, each with `requirements.md` (EARS), `design.md` and `tasks.md`:

| Spec | What it fixed in place before coding |
|---|---|
| `necrotext-core` | The 40x24 grid, which control codes act at their own cell and which act on the next cell, double height rules, key handling. |
| `haunted-layer` | That page 666 must be real diagnostics, and that ghost effects never touch control codes. |
| `live-data-pages` | Fetch failure behaviour (keep the old snapshot, record the error) and the fallback data policy. |

Concrete payoff: requirement 5 of the core spec ("a row containing double height cells is followed by a blank row") became a generator rule, a central enforcement step in `registry.js`, and property test 5. One sentence in a spec turned into three artefacts that agree with each other.

One task in `tasks.md` is left open on purpose: the first live fetch, which needs network access the build environment did not have.

## 2. Steering (`.kiro/steering/`)

| File | Inclusion | Effect |
|---|---|---|
| `product.md` | always | Tone, audience, "no dependencies". |
| `teletext-constraints.md` | always | The hard rules: 40x24, allowed codes, no em dashes, reserved rows. |
| `tech.md` | always | Commands, "never edit dist". |
| `retro-design-language.md` | when editing `src/pages/**` | Colour meanings, banner and heading style. |
| `testing.md` | when editing `src/**` or `tests/**` | Seeded randomness, property test expectations. |

The "no em dashes" rule is stated in steering, checked by `npm run lint`, and asserted by a property test over page content.

## 3. Hooks (`.kiro/hooks/`)

| Hook | Trigger | Action |
|---|---|---|
| Run tests when source changes | save in `src/` or `tests/` | `npm test` |
| Rebuild and check pages when data changes | save `data/*.json` | `npm run build && npm run check-grid` |
| Pre-commit style grid and lint check | manual | `npm run lint && npm run check-grid` |
| New page checklist | save in `src/pages/` | agent reviews the page against the steering rules |

The data hook matters because a scheduled workflow rewrites the data every 30 minutes, and a long headline can break a layout. Every data change is followed by a full page render check.

## 4. Property tests

Hostile generated feed data goes through every page (see `tests/pages.property.test.js`): `null` items, non-string titles, `NaN` numbers, enormous unbroken words. Generators use defensive accessors (`itemsOf`, `num`, `clean`) because of this.

## 5. Spec versus vibe

- **Spec-driven:** the rendering core, page registry, nav state machine, data pipeline. These have precise rules and tests.
- **Vibe coding:** mosaic icon art, the wording of ghost whispers and TV listings, the CRT CSS. These were iterated by eye and have little test coverage beyond "does not throw".

## Honest limits

- The build sandbox blocked npm and every external host. So there is no `fast-check` (a small seeded `forAll` replaces it), the fetch script is tested against fake responses only, and the bundled data is hand-authored sample text, not real news.
- No headless browser was available, so the canvas UI was checked with a recording fake canvas and SVG snapshots, not in a real browser. Expect small visual tweaks on first real run.
- The hook files were not triggered inside the Kiro IDE during the build.
