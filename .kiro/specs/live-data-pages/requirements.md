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
