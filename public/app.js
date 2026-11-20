import { renderPage, stepPage } from './src/pages/registry.js';
import { resolve } from './src/teletext/render.js';
import { header } from './src/teletext/layout.js';
import { drawScreen } from './src/ui/draw.js';
import { initialState, press, parseHash, toHash } from './src/ui/nav.js';
import { loadData } from './src/data/store.js';
import { mulberry32, hashString } from './src/rng.js';
import { messageFor, overlay, glitch, seance } from './src/ghost.js';
import { applyClasses, beep } from './crt.js';

const canvas = document.getElementById('teletext');
const ctx2d = canvas.getContext('2d');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let data = {};
const start = parseHash(location.hash);
let st = initialState(start.page, start.sub);
let current = null;
let searching = null; // {label}
let ghost = null; // {msg, shown, until}
let flashOn = true;
let rollTimer = null; // only one page roll runs at a time
let pending = null; // {page, sub} requested but not yet shown
let lastSubTurn = Date.now();
const day = (() => { const d = new Date(); return d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate(); })();

const pageCtx = () => ({ data, now: new Date(), seed: day });

function load() {
  current = renderPage(st.page, st.sub, pageCtx());
  st = { ...st, sub: current.sub };
  history.replaceState(null, '', toHash(st.page, st.sub));
  lastSubTurn = Date.now();
  ghost = null;
}

function go(page, sub = 1) {
  clearInterval(rollTimer);
  pending = { page, sub };
  if (reduceMotion) {
    pending = null;
    st = { ...st, page, sub, reveal: false };
    load();
    return;
  }
  // "searching" roll: header counts up through page numbers like a real set
  const from = Number(st.page) || 100;
  const to = Number(page);
  const steps = 8;
  let i = 0;
  rollTimer = setInterval(() => {
    i++;
    const n = i >= steps ? to : Math.round(from + ((to - from) * i) / steps);
    searching = { label: 'P' + String(n).padStart(3, '0') };
    if (i >= steps) {
      clearInterval(rollTimer);
      pending = null;
      searching = null;
      st = { ...st, page, sub, reveal: false };
      load();
    }
  }, 45);
}

function handle(key) {
  const env = { subCount: current ? current.subCount : 1, fastext: current ? current.fastext : [], step: stepPage };
  // step from the requested page while a roll is still running
  const base = pending ? { ...st, page: pending.page, sub: pending.sub } : st;
  const result = press(base, key, env);
  st = pending && result.go ? { ...result.state, page: st.page, sub: st.sub } : result.state;
  if (key !== 'm' && !st.muted) beep(key.length === 1 && /\d/.test(key) ? 660 : 880);
  if (result.go) go(result.go.page, result.go.sub);
  else if (current && current.sub !== st.sub) {
    current = renderPage(st.page, st.sub, pageCtx());
    history.replaceState(null, '', toHash(st.page, st.sub));
    lastSubTurn = Date.now();
  }
  document.getElementById('help').hidden = !st.help;
  applyClasses(document.body, st);
}

const APP_KEYS = /^[0-9rgybxscmh?+\-=]$/i;
addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const fk = /^F[1-4]$/.test(e.key) ? e.key : null;
  if (fk || APP_KEYS.test(e.key) || e.key.startsWith('Arrow') || ['Enter', 'Escape', 'Backspace'].includes(e.key)) {
    e.preventDefault();
    handle(e.key);
  }
});
document.getElementById('remote').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-key]');
  if (b) handle(b.dataset.key);
});
addEventListener('hashchange', () => {
  const h = parseHash(location.hash);
  if (h.page !== st.page || h.sub !== st.sub) go(h.page, h.sub);
});

function frame() {
  if (!current) return requestAnimationFrame(frame);
  const now = Date.now();
  // subpage auto-turn every 10 seconds
  if (current.subCount > 1 && now - lastSubTurn > 10000 && !st.input) {
    st = { ...st, sub: (st.sub % current.subCount) + 1, reveal: false };
    current = renderPage(st.page, st.sub, pageCtx());
    history.replaceState(null, '', toHash(st.page, st.sub));
    lastSubTurn = now;
  }
  let grid = current.grid;
  // ghost whisper on row 22: starts at random, spells out, then fades
  if (!ghost && Math.random() < 1 / 1800) {
    ghost = { msg: messageFor(grid, Math.random), start: now };
  }
  if (ghost) {
    const shown = Math.floor((now - ghost.start) / 90);
    if (shown > ghost.msg.length + 40) ghost = null;
    else grid = overlay(grid, ghost.msg, Math.min(shown, ghost.msg.length));
  }
  const rng = mulberry32(hashString(String(Math.floor(now / 150))));
  if (st.seance) grid = seance(grid, rng, 2);
  else if (Math.random() < 1 / 900) grid = glitch(grid, Math.random, 4);
  // header override while typing or searching
  if (searching || st.input) {
    grid = grid.clone();
    const label = searching ? searching.label : 'P' + st.input.padEnd(3, '-');
    grid.setRow(0, header({ label, title: searching ? 'SEARCHING' : current.title, now: new Date(), cached: false }));
  }
  flashOn = reduceMotion ? true : Math.floor(now / 500) % 2 === 0;
  drawScreen(ctx2d, resolve(grid), { flashOn, reveal: st.reveal });
  requestAnimationFrame(frame);
}

applyClasses(document.body, st);
load();
requestAnimationFrame(frame);
loadData(fetch.bind(window)).then((d) => {
  data = d;
  current = renderPage(st.page, st.sub, pageCtx());
});
