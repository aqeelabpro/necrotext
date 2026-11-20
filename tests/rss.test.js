import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRss, decodeEntities } from '../src/data/rss.js';

const XML = `<?xml version="1.0"?>
<rss version="2.0"><channel><title>Feed</title>
<item><title><![CDATA[Cats &amp; dogs: a "story"]]></title><description><![CDATA[<p>Hello <b>world</b></p>]]></description><link>https://example.com/1</link><pubDate>Tue, 20 Oct 2026 08:00:00 GMT</pubDate></item>
<item><title>Plain &amp; simple &#8211; with entity &#x41;</title><description>Desc &lt;3</description><link>https://example.com/2</link></item>
<item><description>No title here</description></item>
</channel></rss>`;

test('parseRss extracts items, strips CDATA and tags', () => {
  const { items, dropped } = parseRss(XML);
  assert.equal(items.length, 2);
  assert.equal(dropped, 1);
  assert.equal(items[0].title, 'Cats & dogs: a "story"');
  assert.equal(items[0].description, 'Hello world');
  assert.equal(items[0].link, 'https://example.com/1');
  assert.equal(items[0].pubDate, 'Tue, 20 Oct 2026 08:00:00 GMT');
});

test('parseRss decodes entities in plain text', () => {
  const { items } = parseRss(XML);
  assert.equal(items[1].title, 'Plain & simple \u2013 with entity A');
  assert.equal(items[1].description, 'Desc <3');
});

test('parseRss handles Atom entries and garbage', () => {
  const atom = '<feed><entry><title>A</title><link href="https://x.test/a"/><updated>2026</updated></entry></feed>';
  const r = parseRss(atom);
  assert.equal(r.items[0].link, 'https://x.test/a');
  assert.deepEqual(parseRss('not xml at all').items, []);
  assert.deepEqual(parseRss(null).items, []);
});

test('decodeEntities ignores invalid code points', () => {
  assert.equal(decodeEntities('&#99999999999;ok'), 'ok');
  assert.equal(decodeEntities('&unknown;'), '&unknown;');
});
