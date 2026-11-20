// Minimal static file server for dist/. Usage: node scripts/serve.js [dir]   (PORT env, default 8080)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.resolve(process.argv[2] || path.join(ROOT, 'dist'));
const port = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};

if (!fs.existsSync(dir)) {
  console.error(`${dir} does not exist. Run "npm run build" first.`);
  process.exit(1);
}

const server = http
  .createServer((req, res) => {
    let rel;
    try {
      rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    } catch {
      res.writeHead(400).end('bad request');
      return;
    }
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.normalize(path.join(dir, rel));
    if (file !== dir && !file.startsWith(dir + path.sep)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404, { 'content-type': 'text/plain' }).end('404 page not found');
        return;
      }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' }).end(buf);
    });
  })
  .listen(port, () => console.log(`NecroText on http://localhost:${port}/`));
server.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `Port ${port} is busy. Try PORT=8081 npm run serve` : e.message);
  process.exit(1);
});
