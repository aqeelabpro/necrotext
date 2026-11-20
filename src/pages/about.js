import { K } from '../teletext/constants.js';
import { banner } from '../teletext/layout.js';
import { dbl } from '../teletext/text.js';
import { box } from '../teletext/mosaic.js';
import { para } from './util.js';

const about = () => ({
  title: 'ABOUT',
  fastext: [['100', 'INDEX'], ['899', 'HELP'], ['888', 'GHOST SUB'], ['666', 'DEAD LTR']],
  subpages: [
    [
      ...dbl('ABOUT NECROTEXT', 'YELLOW'),
      ...para('A revival of Ceefax and Oracle, 1974 to 2012, rebuilt with no dependencies. Every page is a 40 by 24 grid of 7 bit codes, drawn the way the old sets did it.', 38, 'WHITE'),
      '', banner('HOW KIRO BUILT THIS', 'WHITE', 'RED'), '',
      ...para('Specs first: requirements in EARS form, a design, then tasks. Steering files hold the rules: 40x24, the palette, no em dashes.', 38, 'CYAN'),
    ],
    [
      banner('HOW KIRO BUILT THIS', 'WHITE', 'RED'), '',
      ...box(['Specs   .kiro/specs', 'Steering   .kiro/steering', 'Hooks   .kiro/hooks'], 26, 6), '',
      ...para('Hooks run the tests when src changes and rebuild when data changes. Property tests check that every page is exactly 40 by 24 across random data.', 38, 'WHITE'),
      '', K.YELLOW + 'Full story: docs/HOW_KIRO_WAS_USED.md',
    ],
  ],
});

const KEYS = [
  ['0-9', 'Type a three digit page number'], ['R G Y B', 'Red green yellow cyan keys'], ['F1-F4', 'Same as the colour keys'],
  ['UP DOWN', 'Next and previous page (+ and -)'], ['LEFT RIGHT', 'Previous and next subpage'], ['0 ENTER', 'Go to the index'],
  ['X', 'Reveal hidden answers'], ['S', 'Seance mode (corrupts text)'], ['C', 'CRT effect on and off'],
  ['M', 'Sound on and off'], ['H', 'Help overlay'], ['ESC', 'Clear digits, or go home'],
];

const help = () => ({
  title: 'HELP',
  fastext: [['100', 'INDEX'], ['800', 'ABOUT'], ['888', 'GHOST SUB'], ['700', 'GAMES']],
  subpages: [
    [banner('HELP  KEYBOARD', 'WHITE', 'BLUE'), '', ...KEYS.map(([k, d]) => K.YELLOW + k.padEnd(10) + K.WHITE + d.slice(0, 29))],
    [
      banner('HELP  TIPS', 'WHITE', 'BLUE'), '',
      ...para('Pages with a /2 after the number have subpages. They turn over by themselves every ten seconds.', 38, 'WHITE'), '',
      ...para('Pages share by URL: add #/101/2 to the address.', 38, 'CYAN'), '',
      ...para('CACHED in red means the feed behind the page is old or a bundled sample.', 38, 'WHITE'), '',
      ...para('Rumour says some pages are unlucky.', 38, 'MAGENTA'),
    ],
  ],
});

const notFound = () => ({
  title: 'NOT FOUND',
  fastext: [['100', 'INDEX'], ['101', 'NEWS'], ['400', 'WEATHER'], ['899', 'HELP']],
  subpages: [[...dbl('PAGE NOT FOUND', 'RED'), '', ...para('This page does not exist, or it has not risen yet.', 38, 'WHITE'), '', ...para('Press 100 for the index.', 38, 'YELLOW')]],
});

export const entries = [['800', about], ['899', help], ['404', notFound]];
