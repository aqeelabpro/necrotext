// Tiny dependency free RSS/Atom parser. Good enough for BBC style feeds.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decodeEntities(s) {
  return String(s).replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (m, e) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try {
        return String.fromCodePoint(code);
      } catch {
        return '';
      }
    }
    return ENTITIES[e] ?? m;
  });
}

function tagText(block, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i');
  const m = re.exec(block);
  if (!m) return '';
  let v = m[1];
  const cdata = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(v);
  if (cdata) v = cdata[1];
  else v = decodeEntities(v);
  return v;
}

const stripTags = (s) => decodeEntities(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

/**
 * @param {string} xml
 * @returns {{items: Array<{title:string, description:string, link:string, pubDate:string}>, dropped:number}}
 *  `dropped` counts items discarded because they had no title (used by page 666).
 */
export function parseRss(xml) {
  const src = String(xml ?? '');
  const blocks = [...src.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)].map((m) => m[2]);
  const items = [];
  let dropped = 0;
  for (const b of blocks) {
    const title = stripTags(tagText(b, 'title'));
    if (!title) {
      dropped++;
      continue;
    }
    let link = stripTags(tagText(b, 'link'));
    if (!link) {
      const m = /<link[^>]*href="([^"]+)"/i.exec(b);
      link = m ? decodeEntities(m[1]) : '';
    }
    items.push({
      title,
      description: stripTags(tagText(b, 'description') || tagText(b, 'summary')),
      link,
      pubDate: stripTags(tagText(b, 'pubDate') || tagText(b, 'updated') || tagText(b, 'published')),
    });
  }
  return { items, dropped };
}
