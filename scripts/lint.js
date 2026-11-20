// Syntax check every .js file and forbid em dashes in tracked text. No dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', 'dist', '.git']);
const EM = String.fromCharCode(0x2014);
let bad = 0;

function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else check(p);
  }
}

function check(p) {
  const rel = path.relative(ROOT, p);
  if (/\.(js|md|json|html|css|yml|hook|svg)$/.test(p)) {
    const text = fs.readFileSync(p, 'utf8');
    if (text.includes(EM)) {
      console.error(`em dash in ${rel}`);
      bad++;
    }
  }
  if (p.endsWith('.js')) {
    try {
      execFileSync(process.execPath, ['--check', p], { stdio: 'pipe' });
    } catch (e) {
      console.error(`syntax error in ${rel}\n${e.stderr}`);
      bad++;
    }
  }
}

walk(ROOT);
if (bad) process.exit(1);
console.log('lint ok');
