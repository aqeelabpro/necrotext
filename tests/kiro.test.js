import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const list = (dir, test) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(test).map((f) => path.join(dir, f)) : [];

/** Tiny front matter reader: returns the text between the first two --- lines. */
const frontMatter = (text) => {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(m, 'front matter missing');
  return m[1];
};

/** Reads the permission rules as lists of "key: value" pairs, one object per "- " item. */
function rulesOf(fm) {
  const start = fm.indexOf('permissions:');
  assert.ok(start >= 0, 'permissions block missing');
  const rules = [];
  for (const line of fm.slice(start).split('\n').slice(1)) {
    if (/^\S/.test(line)) break;
    const item = line.match(/^\s+-\s+(\w+):\s*(.*)$/);
    const more = line.match(/^\s{5,}(\w+):\s*(.*)$/);
    if (item) rules.push({ [item[1]]: item[2] });
    else if (more && rules.length) rules[rules.length - 1][more[1]] = more[2];
  }
  return rules;
}

test('custom agents use the capability/match/effect permission format', () => {
  const files = list(path.join(ROOT, '.kiro/agents'), (f) => f.endsWith('.md'));
  assert.ok(files.length >= 2);
  for (const file of files) {
    const fm = frontMatter(fs.readFileSync(file, 'utf8'));
    assert.match(fm, /^name: \S+/m, file);
    assert.match(fm, /^description: /m, file);
    const rules = rulesOf(fm);
    assert.ok(rules.length > 0, `${file} has no rules`);
    for (const r of rules) {
      assert.ok(['fs_read', 'fs_write', 'shell', 'mcp'].includes(r.capability), `${file}: capability ${r.capability}`);
      assert.match(r.match ?? '', /^\[.+\]$/, `${file}: match must be a list`);
      assert.ok(['allow', 'ask', 'deny'].includes(r.effect), `${file}: effect ${r.effect}`);
      assert.equal(r.tool, undefined, `${file}: old "tool" key`);
    }
  }
});

test('every hook file is JSON with name, when and then', () => {
  const files = list(path.join(ROOT, '.kiro/hooks'), (f) => f.endsWith('.kiro.hook'));
  assert.equal(files.length, 5);
  for (const file of files) {
    const h = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const k of ['enabled', 'name', 'description', 'when', 'then']) assert.ok(k in h, `${file}: ${k}`);
    assert.ok(h.when.type && h.then.type, file);
  }
});

test('power files are valid JSON with the expected keys', () => {
  const dir = path.join(ROOT, 'powers/necrotext-teletext');
  const plugin = JSON.parse(fs.readFileSync(path.join(dir, 'plugin.json'), 'utf8'));
  for (const k of ['name', 'version', 'description', 'license']) assert.ok(k in plugin, k);
  const mcp = JSON.parse(fs.readFileSync(path.join(dir, 'mcp.json'), 'utf8'));
  assert.ok(mcp.mcpServers.necrotext.command);
  assert.ok(Array.isArray(mcp.mcpServers.necrotext.args));
});
