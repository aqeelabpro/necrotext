# Live Data Pages: Design

- `src/data/rss.js`: regex based RSS/Atom parser with no dependencies. It returns `{items, dropped}`.
- `scripts/fetch-data.js`: `fetchAll({fetchImpl, dir, now})` takes injected fetch and directory so tests run it against fakes, with no network.
- Weather is normalised at fetch time to `{name, current, hourly[24], daily[7]}` so pages never see raw Open-Meteo output.
- `src/data/store.js` offers defensive accessors (`itemsOf`, `citiesOf`, `num`) used by every generator, plus `sourceState` and `loadData`.
- `scripts/build.js` writes `dist/src/data/snapshot.js` from `data/*.json` as the embedded fallback.
- `.github/workflows/pages.yml` runs the fetch (allowed to fail), builds, and deploys with `actions/deploy-pages`.

## Limits
The sandbox that built this project could not reach any feed, so the fetch script is verified against fixtures only. First live run happens in GitHub Actions.
