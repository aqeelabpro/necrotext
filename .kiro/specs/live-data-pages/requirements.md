# Live Data Pages: Requirements

1. THE fetch script SHALL fetch BBC News, BBC Technology and BBC Sport RSS, the Hacker News top stories and Open-Meteo forecasts for five cities.
2. EACH request SHALL time out after ten seconds.
3. WHEN a source fails, THE script SHALL keep that source's previous snapshot and record `ok: false` and the error in `data/status.json`.
4. THE script SHALL write `data/status.json` with `fetchedAt`, item counts and dropped item counts per source.
5. THE repository SHALL include hand-authored fallback snapshots in `data/`, flagged `fallback: true`, so the app works offline.
6. THE app SHALL load `data/*.json` relative to the page and fall back to an embedded snapshot when loading fails.
7. THE RSS parser SHALL handle CDATA, HTML entities, numeric entities, tags inside descriptions and Atom entries, and SHALL count items without a title as dropped.
8. THE news pages SHALL show up to nine headlines per feed with story pages, word wrapped, with subpages for long text.
9. THE weather pages SHALL show a mosaic icon, current temperature, a 24 hour sparkline and a seven day table.
10. A GitHub Actions workflow SHALL refresh the data every 30 minutes, build and deploy to GitHub Pages.
11. WHEN a request fails or returns a non-ok status, THE fetch script SHALL retry it once after a short delay.
12. BEFORE writing a payload, THE fetch script SHALL validate it (a feed needs at least one item with a title, weather needs cities with a numeric temperature and a daily array) and SHALL keep the existing file and record `ok: false` when validation fails.
13. WHEN a source is fetched successfully, THE script SHALL record its status entry without `fallback`.
14. BEFORE fetching, THE workflow SHALL seed `data/` from the last deployed site, copying only files that download and validate, and a seeding failure SHALL NOT fail the job.
15. WHEN every source is still flagged `fallback: true`, THE index page SHALL show a SAMPLE DATA note.
16. THE workflow SHALL NOT cancel an in-progress Pages deployment and SHALL write the per-source fetch result to the run summary.
