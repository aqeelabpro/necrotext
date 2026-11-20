---
inclusion: always
---
# Tech stack

- JavaScript ES modules, Node 20 or newer for tooling. `"type": "module"`.
- No bundler, no npm dependencies. Browser loads `src/` modules directly from `dist/`.
- Build: `npm run build` copies `public/`, `src/`, `data/` into `dist/` and generates `dist/src/data/snapshot.js`.
- Tests: `npm test`. Lint: `npm run lint`. Grid check: `npm run check-grid`. Serve: `npm start` (port 8080, or `PORT=...`).
- Never edit `dist/` or `dist/src/data/snapshot.js`. They are generated.
- `data/*.json` is written by `scripts/fetch-data.js`. Hand edits are only for the bundled sample.
- Commit messages use a type prefix: feat, fix, chore, docs, test, refactor.
- `.kiro/` is part of the submission and must never be added to `.gitignore`.
