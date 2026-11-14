// Servidor estático mínimo para rodar o app localmente: node tools/serve.mjs [porta] [--raiz]
// Com --raiz, serve a pasta de cima (o repositório inteiro), para testar a convivência com os outros apps.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const root = fileURLToPath(new URL(args.includes('--raiz') ? '../..' : '..', import.meta.url));
const port = +(args.find((a) => /^\d+$/.test(a)) || process.env.PORT || 8091);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2',
  '.wasm': 'application/wasm', '.md': 'text/markdown; charset=utf-8', '.py': 'text/x-python; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
};
createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = normalize(join(root, p));
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    await stat(file);
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Não encontrado'); }
}).listen(port, () => console.log(`Finanças em http://localhost:${port}`));
