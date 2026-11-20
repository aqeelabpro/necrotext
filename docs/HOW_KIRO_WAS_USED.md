# How Kiro was used

NecroText is a solo student project built with Kiro. This page says what each Kiro feature produced, where it ran, and what has not been confirmed.

## Which Kiro app ran what

- **Autonomous Kiro agents in a sandboxed Kiro session built both versions.** A planner agent wrote the plan in `.agents/tasks/`, coder sub-agents implemented one feature each, and a semantic reviewer sub-agent reviewed each diff. The first version (`main`) was built the same way in an earlier session, with the specs, steering and hooks.
- **The Playwright power (headless Chromium) was used by the planner** to render `dist/` through request interception, because the sandbox browser could not reach localhost. That produced every PNG in `docs/screens/`. It also exposed bugs nobody had seen, because before this branch the app had never been opened in a browser (see "Found by looking" below).
- **The planner read the Kiro documentation on kiro.dev** to get the formats for custom agents and powers.
- **Not confirmed in the Kiro IDE:** the five hooks, the two custom agents, the MCP server wiring and the power. Their files were written and checked by unit tests (valid JSON, expected keys, permission format, a spawned MCP stdio round trip). Nobody has yet seen them run inside the IDE. See the checklist at the end.

## 1. Specs (`.kiro/specs/`)

Three specs, each with `requirements.md` (EARS), `design.md` and `tasks.md`.

| Spec | What it fixed in place before coding |
|---|---|
| `necrotext-core` | The 40x24 grid, which control codes act at their own cell and which on the next, double height rules, key handling. |
| `haunted-layer` | Page 666 must be real diagnostics. Ghost effects never touch control codes. |
| `live-data-pages` | Fetch failure behaviour (keep the old snapshot, record the error), the fallback data policy, and requirements 11 to 16 for retry, validation, seeding from the deployed site and the sample data label. |

Payoff: core requirement 5 ("a row containing double height cells is followed by a blank row") became a generator rule, a central enforcement step in `registry.js` and property test 5. One sentence became three artefacts that agree.

One task stays open on purpose: confirming the first live fetch on the deployed site.

## 2. Steering (`.kiro/steering/`)

| File | Inclusion | Effect |
|---|---|---|
| `product.md` | always | Tone, audience, no dependencies. |
| `teletext-constraints.md` | always | Hard rules: 40x24, allowed codes, reserved rows, no em dashes. |
| `tech.md` | always | Commands, never edit `dist/`, never gitignore `.kiro/`. |
| `retro-design-language.md` | file match `src/pages/**/*.js` | Colour meanings, banner and heading style. |
| `testing.md` | file match `{src,tests}/**/*.js` | Seeded randomness, property test expectations. |

The no em dash rule is stated in steering, enforced by `npm run lint` across the repo, and asserted by a property test on page content.

## 3. Hooks (`.kiro/hooks/`, five)

| Hook | Trigger | Action |
|---|---|---|
| Run tests when source changes | save in `src/` or `tests/` | `npm test` |
| Rebuild and check pages when data changes | save `data/*.json` | `npm run build && npm run check-grid` |
| Pre-commit style grid and lint check | manual | `npm run lint && npm run check-grid` |
| New page checklist | save in `src/pages/` | agent reviews the page against the steering rules |
| Check pages through the MCP server | save in `src/pages/` or `src/teletext/` | agent calls `check_page` and `render_page` |

## 4. Custom agents (`.kiro/agents/`)

- `page-designer.md`: reads steering and the core design, previews pages with the MCP `render_page` tool, runs `npm test`, `lint`, `check-grid` and `build`, and may write only to `src/pages/**` and `tests/**`.
- `broadcast-reviewer.md`: read-only (`fs_write` denied for `**`). Reviews a diff against steering, rendering each changed page through MCP. Reports in the dry broadcast tone.

Permissions use the documented `capability` / `match` / `effect` format. `tests/kiro.test.js` parses both files and fails on the older `tool` / `pattern` / `action` keys. A first draft used those, and a review caught it.

## 5. MCP server (`scripts/mcp-server.js`)

A zero dependency JSON-RPC 2.0 stdio server (`npm run mcp`). Tools:

| Tool | Does |
|---|---|
| `list_pages` | Registered pages and subpage counts. |
| `render_page` | A page as 24 lines of 40 characters, mosaics shown as `#`. |
| `check_page` | Runs the shared invariants in `src/teletext/check.js` on one page or all. |
| `data_status` | Feed health, the same data as page 666. |

`check.js` is shared with `npm run check-grid`, so the CLI and MCP agree. `tests/mcp.test.js` covers the protocol and spawns the real server for a round trip.

## 6. Power (`powers/necrotext-teletext/`)

`plugin.json`, `mcp.json` (starts the server), a README, and two skills: `new-teletext-page` (the workflow for adding a page) and `teletext-mosaics` (sixel rules and how to preview them).

## 7. Property-based testing

`fast-check` could not be installed (no registry access), so `tests/helpers/prop.js` is a small replacement:

- `forAll(gen, prop, {runs, seed})` runs 200 cases by default. Each run uses `mulberry32(seed + i * 7919)`, so any case is reproducible.
- On failure it shrinks strings and arrays by halving, then throws with the seed and the shrunk input.
- `PROP_SEED=<seed> npm test` replays a run.

Properties tested, with hostile feed data (null items, non-string titles, `NaN`, emoji, em dashes, enormous words):

1. Every page and subpage is 24 rows by 40 columns.
2. Every cell is an allowed code. No em dash or non-ASCII reaches the grid.
3. Row 0 contains the page number.
5. Double height rows are followed by a blank row and never sit on rows 0, 22 or 23.
6. Every fastext target is a registered page.
7. The ghost glitch keeps dimensions, control codes and rows 0, 22 and 23, stays deterministic for a seed and does not mutate its input.
- Any row with a conceal code has concealed visible text.
- Every fastext label is uppercase and at most 9 characters.

## Found by looking

Screenshots through the Playwright power found real defects that unit tests had missed: concealed text was never hidden (colour then conceal ordering), `fromBitmap` broke multi-colour mosaics, the sanitiser blanked `0x7F` solid blocks, and the canvas clipped at the edges with a fallback font. Each fix has a test, including a new property for conceal.

## Spec versus vibe

- **Spec-driven:** the renderer, page registry, nav state machine, data pipeline and MCP server. They have precise rules and tests.
- **Vibe coding:** mosaic art (tombstone, ghost, weather icons), whisper wording, TV listings, CRT CSS. Iterated by eye, then checked in the browser.

## Honest limits

- The build sandbox had no npm registry and no external network. The bundled data is sample text, and the first real live fetch happens on GitHub.
- Hooks, agents, MCP wiring and the power are not confirmed inside the Kiro IDE.
- The demo video is not recorded yet.

## Owner checklist: confirm in the Kiro IDE before submitting

1. Open the Hooks panel. Confirm all five hooks are listed and enabled. Save a file in `src/pages/` and watch "New page checklist" and "Check pages through the MCP server" fire. Save a file in `src/` and watch the test run.
2. Open the MCP panel and confirm the `necrotext` server starts (`node scripts/mcp-server.js`) and lists four tools.
3. Switch to the `page-designer` agent and ask: "Render page 400 through MCP." Confirm it calls `render_page`. Check that the permission rules were accepted. Fix the front matter if the IDE reports a format error.
4. Switch to `broadcast-reviewer` and confirm it cannot write files.
5. Import the power from `powers/necrotext-teletext/` and confirm both skills appear. Its `mcp.json` starts `node scripts/mcp-server.js` with a repo-relative path, so it only works when the repo is the workspace root. If the server does not start, open the repo as the workspace.
6. Change anything that fails above, and edit this page so it says only what you saw.
