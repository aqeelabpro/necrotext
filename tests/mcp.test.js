import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { handle, handleLine } from '../scripts/mcp-server.js';

const call = (name, args, id = 9) => handle({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } });
const textOf = (res) => res.result.content[0].text;

test('initialize echoes the protocol version and names the server', () => {
  const res = handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
  assert.equal(res.result.protocolVersion, '2024-11-05');
  assert.equal(res.result.serverInfo.name, 'necrotext');
  assert.deepEqual(res.result.capabilities, { tools: {} });
  assert.equal(handle({ jsonrpc: '2.0', id: 2, method: 'initialize' }).result.protocolVersion, '2025-06-18');
});

test('notifications get no reply and ping works', () => {
  assert.equal(handle({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
  assert.deepEqual(handle({ jsonrpc: '2.0', id: 3, method: 'ping' }).result, {});
});

test('tools/list names every tool with an input schema', () => {
  const tools = handle({ jsonrpc: '2.0', id: 4, method: 'tools/list' }).result.tools;
  assert.deepEqual(tools.map((t) => t.name).sort(), ['check_page', 'data_status', 'list_pages', 'render_page']);
  for (const t of tools) assert.equal(t.inputSchema.type, 'object');
});

test('render_page 100 gives 24 lines of 40 characters', () => {
  const lines = textOf(call('render_page', { page: '100' })).split('\n');
  const grid = lines.slice(1, 25);
  assert.equal(grid.length, 24);
  for (const l of grid) assert.equal(l.length, 40);
  assert.match(grid.join('\n'), /NECROTEXT/);
  assert.match(lines[25], /^fastext /);
});

test('render_page for an unknown page reports it and shows the 404 page', () => {
  const text = textOf(call('render_page', { page: '999' }));
  assert.match(text, /not found/);
  assert.match(text, /AGE NOT FOUND|PAGE NOT FOUND/);
});

test('bad tool input is an isError result, unknown tool is a JSON-RPC error', () => {
  assert.equal(call('render_page', { page: 'abc' }).result.isError, true);
  assert.equal(call('render_page', { page: '100', sub: 12 }).result.isError, true);
  assert.equal(call('check_page', { page: '1' }).result.isError, true);
  assert.equal(call('nope', {}).error.code, -32602);
});

test('check_page rejects a well formed page number that is not registered', () => {
  const res = call('check_page', { page: '999' });
  assert.equal(res.result.isError, true);
  assert.match(textOf(res), /not registered/);
});

test('check_page passes for all pages and for one page', () => {
  assert.match(textOf(call('check_page', {})), /^PASS: \d+ pages/);
  assert.match(textOf(call('check_page', { page: '666' })), /^PASS/);
});

test('list_pages and data_status report content', () => {
  assert.match(textOf(call('list_pages', {})), /^013 .*\n100 NECROTEXT/s);
  assert.match(textOf(call('data_status', {})), /news: (alive|stale|dead)/);
});

test('unknown method is -32601 and bad JSON is -32700', () => {
  assert.equal(handle({ jsonrpc: '2.0', id: 5, method: 'nope' }).error.code, -32601);
  assert.equal(JSON.parse(handleLine('{not json')).error.code, -32700);
  assert.equal(handle({ id: 6 }).error.code, -32600);
});

test('spawned server answers over stdio', async () => {
  const child = spawn(process.execPath, ['scripts/mcp-server.js'], { stdio: ['pipe', 'pipe', 'pipe'] });
  const lines = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '0' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'render_page', arguments: { page: '100' } } },
  ];
  child.stdin.end(lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  await new Promise((resolve) => child.on('close', resolve));
  const replies = out.trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(replies.length, 2);
  assert.equal(replies[0].result.serverInfo.name, 'necrotext');
  assert.match(replies[1].result.content[0].text, /NECROTEXT/);
});
