import { K } from '../teletext/constants.js';
import { banner } from '../teletext/layout.js';
import { dbl } from '../teletext/text.js';
import { para } from './util.js';

const QUIZ = [
  ['In which year did BBC Ceefax launch to the public?', ['1969', '1974', '1981', '1990'], 'B', '1974'],
  ['How many columns and rows is a teletext page?', ['32 x 16', '80 x 25', '40 x 24', '64 x 32'], 'C', '40 x 24'],
  ['Which UK commercial teletext service was called Oracle?', ['ITV and Channel 4', 'BBC Two', 'Sky', 'Ceefax'], 'A', 'ITV and Channel 4'],
  ['The name Ceefax is a pun on which phrase?', ['Sea facts', 'See facts', 'Seek facts', 'Sees fax'], 'B', 'See facts'],
  ['What are the 2x3 block graphics of teletext called?', ['Pixels', 'Voxels', 'Sixels', 'Glyphs'], 'C', 'Sixels'],
  ['How many Fastext colour keys are on the remote?', ['Two', 'Three', 'Four', 'Five'], 'C', 'Four'],
  ['On UK teletext, which page carried subtitles?', ['100', '888', '404', '666'], 'B', '888'],
  ['A control code in a teletext row takes up how many cells?', ['None', 'One', 'Two', 'Eight'], 'B', 'One'],
];

const quiz = () => ({
  title: 'QUIZ',
  fastext: [['700', 'GAMES'], ['710', 'MANSION'], ['899', 'HELP'], ['100', 'HOME']],
  subpages: QUIZ.map(([q, opts, letter, text], i) => [
    banner(`TELETEXT QUIZ  ${i + 1}/${QUIZ.length}`, 'WHITE', 'MAGENTA'), '',
    ...para(q, 38, 'YELLOW'), '',
    ...opts.map((o, j) => K.CYAN + 'ABCD'[j] + K.WHITE + ' ' + o), '',
    K.GREEN + 'Press X to reveal the answer', '',
    K.WHITE + K.CONCEAL + 'ANSWER: ' + letter + ' - ' + text,
  ]),
});

const R = [['R', 'RED'], ['G', 'GREEN'], ['Y', 'YELLOW'], ['C', 'CYAN']];

const ROOMS = {
  710: ['THE HALL', 'A cold hall. Portraits watch you. Doors lead everywhere and a staircase climbs into the dark.', [['711', 'Enter the library', 'LIBRARY'], ['712', 'Go down to the cellar', 'CELLAR'], ['713', 'Visit the kitchen', 'KITCHEN'], ['714', 'Climb to the attic', 'ATTIC']]],
  711: ['THE LIBRARY', 'Dust and ink. One black book hums softly on the shelf. A curtain hides something.', [['710', 'Back to the hall', 'HALL'], ['715', 'Read the black book', 'READ BOOK'], ['716', 'Open the curtain', 'CURTAIN']]],
  712: ['THE CELLAR', 'Wet stone. Something whispers your name from behind the wine racks.', [['710', 'Back upstairs', 'HALL'], ['716', 'Follow the whisper', 'WHISPER']]],
  713: ['THE KITCHEN', 'A table is laid for one. The soup is still warm. Nobody has lived here for a century.', [['710', 'Back to the hall', 'HALL'], ['716', 'Eat the soup', 'SOUP']]],
  714: ['THE ATTIC', 'Trunks, a cracked mirror, and a window that opens onto the garden roof.', [['710', 'Back downstairs', 'HALL'], ['716', 'Touch the mirror', 'MIRROR'], ['715', 'Climb out of the window', 'WINDOW']]],
  715: ['YOU ESCAPED', 'Fresh air. The house sighs and settles. Somewhere a television flickers: page 100 still glows.', [['710', 'Play again', 'AGAIN'], ['700', 'Games menu', 'GAMES']]],
  716: ['YOU ARE A GHOST', 'The house is quiet again. You hover in the hall, waiting for the next visitor.', [['710', 'Play again', 'AGAIN'], ['700', 'Games menu', 'GAMES']]],
};

const room = (n) => () => {
  const [name, text, opts] = ROOMS[n];
  const rows = [...dbl(name, 'YELLOW'), ...para(text, 38, 'WHITE'), ''];
  opts.forEach(([, label], i) => rows.push(K[R[i][1]] + R[i][0] + K.WHITE + ' ' + label));
  const fastext = opts.slice(0, 4).map(([p, , short]) => [p, short]);
  while (fastext.length < 4) fastext.push(['100', 'HOME']);
  return { title: 'HAUNTED HOUSE', fastext, subpages: [rows] };
};

export const entries = [
  ['700', () => ({
    title: 'GAMES',
    fastext: [['701', 'QUIZ'], ['710', 'MANSION'], ['100', 'INDEX'], ['899', 'HELP']],
    subpages: [[
      banner('GAMES', 'WHITE', 'MAGENTA'), '', K.YELLOW + '701 ' + K.WHITE + 'Teletext quiz (X reveals answers)',
      K.YELLOW + '710 ' + K.WHITE + 'The Haunted House', '', ...para('Use the colour keys, like the old days. Red, green, yellow and cyan pick your next move in the house.', 38, 'CYAN'),
    ]],
  })],
  ['701', quiz],
  ...Object.keys(ROOMS).map((n) => [n, room(n)]),
];
