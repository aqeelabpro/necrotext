// Pure keyboard state machine, so navigation is testable without a DOM.

export const initialState = (page = '100', sub = 1) => ({
  page, sub, input: '', reveal: false, crt: true, seance: false, help: false, muted: true,
});

export function parseHash(hash) {
  const m = /^#\/?(\d{3})(?:\/(\d{1,2}))?$/.exec(String(hash || ''));
  return m ? { page: m[1], sub: m[2] ? Math.max(1, Number(m[2])) : 1 } : { page: '100', sub: 1 };
}
export const toHash = (page, sub = 1) => `#/${page}${sub > 1 ? '/' + sub : ''}`;

const FAST = { r: 0, g: 1, y: 2, b: 3, F1: 0, F2: 1, F3: 2, F4: 3 };

/**
 * @param {object} state
 * @param {string} key KeyboardEvent.key
 * @param {{subCount: number, fastext: string[][], step: (id: string, dir: number) => string}} env
 * @returns {{state: object, go?: {page: string, sub: number}}} `go` asks the app to load a page
 */
export function press(state, key, env) {
  const k = key.length === 1 ? key.toLowerCase() : key;
  const s = { ...state };
  if (/^\d$/.test(k)) {
    s.input = state.input + k;
    if (s.input.length === 3) {
      const page = s.input;
      s.input = '';
      return { state: s, go: { page, sub: 1 } };
    }
    return { state: s };
  }
  if (k === 'Backspace') return { state: { ...s, input: state.input.slice(0, -1) } };
  if (k === 'Enter') {
    if (state.input === '0') return { state: { ...s, input: '' }, go: { page: '100', sub: 1 } };
    return { state: s };
  }
  if (k === 'Escape') {
    if (state.input) return { state: { ...s, input: '' } };
    if (state.help) return { state: { ...s, help: false } };
    return { state: s, go: { page: '100', sub: 1 } };
  }
  if (k in FAST && env.fastext && env.fastext[FAST[k]]) return { state: { ...s, input: '' }, go: { page: env.fastext[FAST[k]][0], sub: 1 } };
  if (k === 'ArrowUp' || k === '+' || k === '=') return { state: { ...s, input: '' }, go: { page: env.step(state.page, 1), sub: 1 } };
  if (k === 'ArrowDown' || k === '-') return { state: { ...s, input: '' }, go: { page: env.step(state.page, -1), sub: 1 } };
  if (k === 'ArrowRight' || k === 'ArrowLeft') {
    const n = Math.max(1, env.subCount);
    const sub = ((state.sub - 1 + (k === 'ArrowRight' ? 1 : -1) + n) % n) + 1;
    return { state: { ...s, sub, reveal: false } };
  }
  if (k === 'x') return { state: { ...s, reveal: !state.reveal } };
  if (k === 's') return { state: { ...s, seance: !state.seance } };
  if (k === 'c') return { state: { ...s, crt: !state.crt } };
  if (k === 'm') return { state: { ...s, muted: !state.muted } };
  if (k === 'h' || k === '?') return { state: { ...s, help: !state.help } };
  return { state: s };
}
