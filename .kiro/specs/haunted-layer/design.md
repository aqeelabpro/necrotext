# Haunted Layer: Design

- `src/ghost.js` holds pure functions with an injected rng: `whisper`, `messageFor`, `overlay`, `glitch`, `seance`.
- `overlay` writes row 22 only. The registry keeps row 22 blank, so overlay never collides with content.
- `glitch` swaps printable cells (code above 0x20) for other printable glyphs. Control codes and spaces are never touched, which keeps serial attributes and double height rows intact.
- Page 666 derives everything from `data.status.sources` via `sourceState()` in `src/data/store.js`. The same function drives the CACHED header marker, so the diagnostics and the marker cannot disagree.
- Page 667 seeds its rng from the calendar day plus the injected seed.
- In the browser, `app.js` supplies `Math.random`; in tests we supply `mulberry32(seed)`.
