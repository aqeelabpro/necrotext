import { K } from '../teletext/constants.js';
import { dbl, center } from '../teletext/text.js';
import { rainbow } from '../teletext/mosaic.js';
import { para } from './util.js';
import { SOURCES } from '../data/store.js';

const LEFT = [['101', 'News headlines'], ['102', 'Tech news'], ['103', 'Hacker News'], ['300', 'Sport'], ['400', 'Weather'], ['600', 'TV listings'], ['700', 'Games'], ['710', 'Haunted house']];
const RIGHT = [['666', 'Dead Letters'], ['667', 'The Oracle'], ['888', 'Ghost subs'], ['800', 'About'], ['899', 'Help'], ['701', 'Quiz'], ['', ''], ['', '']];

const cell = ([n, l]) => (n ? K.YELLOW + n + K.WHITE + ' ' + l.padEnd(15).slice(0, 15) : ' '.repeat(20));

/** True when every source is still the bundled hand-written sample. */
function isSample(ctx) {
  const data = ctx && ctx.data;
  const src = data && data.status && data.status.sources;
  return !!src && SOURCES.every((k) => src[k] && src[k].fallback === true);
}

export const entries = [['100', (ctx) => ({
  title: 'NECROTEXT',
  fastext: [['101', 'NEWS'], ['400', 'WEATHER'], ['666', 'DEAD LTR'], ['899', 'HELP']],
  subpages: [[
    ...dbl('NECROTEXT', 'YELLOW'),
    K.CYAN + center('Teletext rises from the grave', 38),
    rainbow(), '',
    ...LEFT.map((l, i) => cell(l) + cell(RIGHT[i])),
    '', ...para('Type a page number, or use the colour keys. Press H for help.', 38, 'GREEN'),
    ...(isSample(ctx) ? ['', K.CYAN + center('SAMPLE DATA: live feeds not fetched', 38)] : []),
  ]],
})]];
