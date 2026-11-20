// Minimal MCP server for NecroText. No dependencies.
// Newline-delimited JSON-RPC 2.0 over stdin/stdout. Logs go to stderr only.
import fs from 'node:fs';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { renderPage, pageIds } from '../src/pages/registry.js';
import { loadDataSync } from '../src/data/node-load.js';
import { SOURCES, sourceState } from '../src/data/store.js';
import { toText } from '../src/teletext/render.js';
import { checkPages } from '../src/teletext/check.js';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const DEFAULT_PROTOCOL = '2025-06-18';

const ctx = () => ({ data: loadDataSync(), now: new Date(), seed: 1 });

const pageProp = { type: 'string', description: 'Three digit page number, for example "100".' };
const TOOLS = [
  {
    name: 'list_pages',
    description: 'List every registered teletext page number with its title.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'render_page',
    description: 'Render a page as 24 lines of 40 characters. Control codes are spaces, mosaics are "#".',
    inputSchema: {
      type: 'object',
      properties: { page: pageProp, sub: { type: 'integer', minimum: 1, maximum: 9, description: 'Subpage, default 1.' } },
      required: ['page'],
      additionalProperties: false,
    },
  },
  {
    name: 'check_page',
    description: 'Check the grid invariants (40x24, allowed codes, double height, fastext targets) on one page or all pages.',
    inputSchema: { type: 'object', properties: { page: pageProp }, additionalProperties: false },
  },
  {
    name: 'data_status',
    description: 'Report alive, stale or dead for each data source, from the committed data/*.json.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
];

const ok = (text) => ({ content: [{ type: 'text', text }] });
const fail = (text) => ({ content: [{ type: 'text', text }], isError: true });
const validPage = (v) => typeof v === 'string' && /^\d{3}$/.test(v);

const IMPL = {
  list_pages() {
    const c = ctx();
    return ok(pageIds().map((id) => `${id} ${renderPage(id, 1, c).title}`).join('\n'));
  },
  render_page({ page, sub } = {}) {
    if (!validPage(page)) return fail('page must be a three digit string such as "100"');
    if (sub !== undefined && !(Number.isInteger(sub) && sub >= 1 && sub <= 9)) return fail('sub must be an integer from 1 to 9');
    const r = renderPage(page, sub ?? 1, ctx());
    const head = `page ${r.id}${r.found ? '' : ' (not found)'} sub ${r.sub}/${r.subCount} title ${r.title}`;
    const fast = 'fastext ' + r.fastext.map(([t, l]) => `${t} ${l}`).join(' | ');
    return ok([head, ...toText(r.grid), fast].join('\n'));
  },
  check_page({ page } = {}) {
    if (page !== undefined && !validPage(page)) return fail('page must be a three digit string such as "100"');
    const { pages, problems } = checkPages(ctx(), page);
    if (problems.length) return fail(`FAIL: ${problems.length} problems in ${pages} pages\n${problems.join('\n')}`);
    return ok(`PASS: ${pages} pages checked`);
  },
  data_status() {
    const c = ctx();
    return ok(SOURCES.map((k) => `${k}: ${sourceState(c.data, k, c.now)}`).join('\n'));
  },
};

const reply = (id, result) => ({ jsonrpc: '2.0', id, result });
const error = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

/** Handle one parsed JSON-RPC message. Returns a response object, or null for notifications. */
export function handle(msg) {
  if (!msg || typeof msg !== 'object' || Array.isArray(msg) || typeof msg.method !== 'string') {
    return error(msg && msg.id !== undefined ? msg.id : null, -32600, 'Invalid Request');
  }
  const { id, method, params } = msg;
  if (id === undefined) return null; // notification, never answered
  switch (method) {
    case 'initialize':
      return reply(id, {
        protocolVersion: (params && typeof params.protocolVersion === 'string' && params.protocolVersion) || DEFAULT_PROTOCOL,
        capabilities: { tools: {} },
        serverInfo: { name: 'necrotext', version: pkg.version },
      });
    case 'ping':
      return reply(id, {});
    case 'tools/list':
      return reply(id, { tools: TOOLS });
    case 'tools/call': {
      const name = params && params.name;
      if (!Object.hasOwn(IMPL, name)) return error(id, -32602, `Unknown tool: ${name}`);
      try {
        return reply(id, IMPL[name](params.arguments || {}));
      } catch (e) {
        return reply(id, fail(`tool crashed: ${e && e.message}`));
      }
    }
    default:
      return error(id, -32601, `Method not found: ${method}`);
  }
}

/** Handle one raw line of input. Returns a response string or null. */
export function handleLine(line) {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return JSON.stringify(error(null, -32700, 'Parse error'));
  }
  const res = handle(msg);
  return res ? JSON.stringify(res) : null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rl = readline.createInterface({ input: process.stdin });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    const out = handleLine(line);
    if (out) process.stdout.write(out + '\n');
  });
  console.error('necrotext MCP server ready on stdio');
}
