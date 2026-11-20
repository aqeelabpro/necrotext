import { K } from '../teletext/constants.js';
import { clean, dbl, truncate, padLeft } from '../teletext/text.js';
import { banner } from '../teletext/layout.js';
import { fromBitmap, chart } from '../teletext/mosaic.js';
import { citiesOf, num } from '../data/store.js';

const SUN = [
  '....YYYY....', '..YYYYYYYY..', '.YYYYYYYYYY.', '.YYYYYYYYYY.', '.YYYYYYYYYY.',
  '.YYYYYYYYYY.', '..YYYYYYYY..', '....YYYY....', '............',
];
const SMALL_SUN = [
  '..YYYY......', '.YYYYYY.....', '.YYYYYY.....', '..YYYY......', '............',
  '............', '............', '............', '............',
];
const CLOUD = [
  '............', '....WWWW....', '..WWWWWWWW..', '.WWWWWWWWWW.', 'WWWWWWWWWWWW',
  'WWWWWWWWWWWW', '.WWWWWWWWWW.', '............', '............',
];
const shift = (layer, dx, dy) =>
  layer.map((_, y) => {
    const src = layer[y - dy] || '.'.repeat(12);
    return (dx >= 0 ? '.'.repeat(dx) + src : src.slice(-dx) + '.'.repeat(-dx)).slice(0, 12).padEnd(12, '.');
  });
const overlay = (base, top) => base.map((row, y) => [...row].map((c, x) => (top[y][x] !== '.' ? top[y][x] : c)).join(''));
const withRows = (layer, rows) => layer.map((r, y) => (rows[y] !== undefined ? rows[y] : r));

export const ICONS = {
  clear: SUN,
  partly: overlay(SMALL_SUN, shift(CLOUD, 1, 2)),
  cloud: CLOUD,
  fog: withRows(CLOUD, { 6: 'WWWWWWWWWWWW', 7: '............', 8: '.WWWWWWWWWW.' }),
  rain: withRows(CLOUD, { 7: '..C..C..C..C', 8: '.C..C..C..C.' }),
  snow: withRows(CLOUD, { 7: '..W..W..W..W', 8: '.W..W..W..W.' }),
  storm: withRows(CLOUD, { 6: '.WWWWYYWWWW.', 7: '....YY......', 8: '...YY.......' }),
};

/** WMO weather code to text and icon key. */
export function describe(code) {
  const c = num(code, -1);
  if (c === 0) return ['Clear sky', 'clear'];
  if (c === 1 || c === 2) return ['Partly cloudy', 'partly'];
  if (c === 3) return ['Overcast', 'cloud'];
  if (c === 45 || c === 48) return ['Fog', 'fog'];
  if (c >= 51 && c <= 57) return ['Drizzle', 'rain'];
  if ((c >= 61 && c <= 67) || (c >= 80 && c <= 82)) return ['Rain', 'rain'];
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return ['Snow', 'snow'];
  if (c >= 95) return ['Thunderstorm', 'storm'];
  return ['Unknown', 'cloud'];
}

export const iconRows = (code) => fromBitmap(ICONS[describe(code)[1]]);
const temp = (t) => `${Math.round(num(t, 0))}C`;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function dayName(iso) {
  const d = new Date(String(iso) + 'T12:00:00Z');
  return isNaN(d) ? '???' : DAYS[d.getUTCDay()];
}

function indexPage(ctx) {
  const cities = citiesOf(ctx.data).slice(0, 5);
  const rows = [banner('WEATHER', 'WHITE', 'BLUE'), ''];
  if (!cities.length) rows.push(K.YELLOW + 'No forecast available.', K.WHITE + 'See page 666 for the post mortem.');
  cities.forEach((c, i) => {
    const cur = c.current || {};
    const ic = iconRows(cur.code);
    const [desc] = describe(cur.code);
    rows.push(ic[0].padEnd(12) + K.YELLOW + (401 + i) + K.WHITE + ' ' + truncate(clean(c.name) || 'Unknown', 22));
    rows.push(ic[1].padEnd(12) + K.WHITE + `${temp(cur.temperature)}  wind ${Math.round(num(cur.wind))} km/h`);
    rows.push(ic[2].padEnd(12) + K.CYAN + desc);
    rows.push('');
  });
  return { title: 'WEATHER', source: 'weather', fastext: [['100', 'INDEX'], ['401', 'CITY 1'], ['666', 'DEAD LTR'], ['899', 'HELP']], subpages: [rows] };
}

function cityPage(i) {
  return (ctx) => {
    const fastext = [['400', 'BACK'], [String(401 + ((i + 1) % 5)), 'NEXT'], [String(401 + ((i + 4) % 5)), 'PREV'], ['100', 'HOME']];
    const c = citiesOf(ctx.data)[i];
    if (!c) return { title: 'WEATHER', source: 'weather', fastext, subpages: [[banner('WEATHER', 'WHITE', 'BLUE'), '', K.YELLOW + 'CITY NOT AVAILABLE']] };
    const cur = c.current || {};
    const ic = iconRows(cur.code);
    const [desc] = describe(cur.code);
    const hourly = (Array.isArray(c.hourly) ? c.hourly : []).map((v) => num(v, NaN)).filter(Number.isFinite).slice(0, 24);
    const rows = [...dbl((clean(c.name) || 'UNKNOWN').toUpperCase(), 'YELLOW')];
    rows.push(ic[0].padEnd(12) + K.WHITE + 'NOW ' + temp(cur.temperature));
    rows.push(ic[1].padEnd(12) + K.WHITE + `WIND ${Math.round(num(cur.wind))} KM/H`);
    rows.push(ic[2].padEnd(12) + K.CYAN + desc);
    rows.push('');
    if (hourly.length) {
      rows.push(K.CYAN + `NEXT 24 HOURS  LOW ${temp(Math.min(...hourly))} HIGH ${temp(Math.max(...hourly))}`);
      for (const l of chart(hourly, 24, 3, 'Y')) rows.push('  ' + l);
    } else rows.push(K.CYAN + 'NO HOURLY DATA', '', '', '');
    rows.push('', banner('SEVEN DAY FORECAST', 'WHITE', 'BLUE'));
    for (const d of (Array.isArray(c.daily) ? c.daily : []).slice(0, 7)) {
      const [dd] = describe(d && d.code);
      rows.push(
        K.YELLOW + dayName(d && d.date) + K.WHITE + ' ' + dd.padEnd(14).slice(0, 14) + K.RED + padLeft(temp(d && d.max), 3) +
          K.WHITE + '/' + K.CYAN + padLeft(temp(d && d.min), 3) + K.WHITE + ' ' + num(d && d.precip).toFixed(1) + 'mm',
      );
    }
    return { title: 'WEATHER', source: 'weather', fastext, subpages: [rows] };
  };
}

export const entries = [['400', indexPage], ...Array.from({ length: 5 }, (_, i) => [String(401 + i), cityPage(i)])];
