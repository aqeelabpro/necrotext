import { K } from '../teletext/constants.js';
import { banner } from '../teletext/layout.js';
import { mulberry32, hashString, pick, int } from '../rng.js';

const CHANNELS = ['NECRO ONE', 'SPECTRE 2', 'WRAITH 3', 'CRYPT 4'];
const TITLES = [
  'Antiques Roadshow of the Dead', 'The Late Late Seance', 'Blue Peter: Haunted Edition',
  'Newsround at Midnight', 'Test Card F: The Return', 'Fawlty Crypts', 'Gravedigger Gardening',
  'Ceefax Spy Hour', 'The Weather With Banshee', 'Snooker From Beyond', 'Panel Show of Doom',
  'Late Night Poltergeist', 'Wuthering Heights Reloaded', 'Phantom Bake Off', 'The Haunting of Teletext',
  'Question Time (Undead)', 'Match of the Wake', 'Dad\'s Ghost Army',
];
const BLURBS = [
  'Strange things are found in attics.', 'A guest list that never ends.', 'Tonight the lights stay off.',
  'Subtitles available on page 888.', 'Repeat. Some say it never aired.', 'Includes flashing images.',
  'The studio audience is unseen.', 'Not suitable for the living.',
];

const p2 = (n) => String(n).padStart(2, '0');
const hhmm = (mins) => `${p2(Math.floor(mins / 60) % 24)}:${p2(mins % 60)}`;

function channelPage(ci) {
  return (ctx, id) => {
    const rng = mulberry32(hashString('tv' + ci) ^ (ctx.seed >>> 0));
    const now = ctx.now instanceof Date && !isNaN(ctx.now) ? ctx.now : new Date(0);
    let t = now.getHours() * 60 + Math.floor(now.getMinutes() / 30) * 30;
    const rows = [banner(`TV  ${CHANNELS[ci]}`, 'WHITE', 'BLUE'), ''];
    for (let i = 0; i < 8; i++) {
      rows.push((i === 0 ? K.GREEN : K.YELLOW) + hhmm(t) + K.WHITE + ' ' + pick(rng, TITLES).slice(0, 33));
      rows.push(K.CYAN + '      ' + pick(rng, BLURBS));
      t += [30, 45, 60][int(rng, 3)];
    }
    return rows;
  };
}

export const entries = [
  ['600', (ctx, id) => ({
    title: 'TV LISTINGS',
    fastext: [['100', 'INDEX'], ['700', 'GAMES'], ['888', 'GHOST SUB'], ['899', 'HELP']],
    subpages: CHANNELS.map((_, i) => channelPage(i)(ctx, id)),
  })],
];
