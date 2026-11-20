---
inclusion: fileMatch
fileMatchPattern: "{src,tests}/**/*.js"
---
# Testing

- Runner: `node --test` via `npm test`. No test dependencies are installable in the build sandbox.
- Property tests use `tests/helpers/prop.js`: seeded `mulberry32`, `forAll(gen, prop, {runs})`, light shrinking of strings and arrays. Failures print the seed. Replay with `PROP_SEED=<seed> npm test`.
- Any new page must pass the all-pages property tests with random hostile data (`genData`): 40x24, allowed codes, header page number, double height rule, fastext targets.
- Randomness always comes from an injected rng. Never call `Math.random` inside `src/` except where `app.js` passes it in.
- The feed parser is tested with fixture XML. The fetch script is tested with a fake `fetch`.
- Canvas drawing is tested with a recording fake context, since there is no headless browser in the sandbox.
- Run `npm run lint` too: it syntax checks and rejects em dashes.
