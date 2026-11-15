// Gera sw-assets.js: lista de arquivos para o pré-cache e versão (hash do conteúdo).
// Uso: node tools/gen-precache.mjs        (escreve)
//      node tools/gen-precache.mjs --check (falha se estiver desatualizado)
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const INCLUDE = ['index.html', 'manifest.webmanifest', 'css', 'js', 'assets'];
const SKIP = [/\.DS_Store$/, /\.md$/];
const files = [];
const walk = (p) => { const st = statSync(p); if (st.isDirectory()) for (const f of readdirSync(p).sort()) walk(join(p, f)); else files.push(relative(root, p).split('\\').join('/')); };
for (const i of INCLUDE) if (existsSync(join(root, i))) walk(join(root, i));
const list = files.filter((f) => !SKIP.some((re) => re.test(f)));
const hash = createHash('sha256');
for (const f of list) { hash.update(f); hash.update(readFileSync(join(root, f))); }
const swPath = join(root, 'sw.js');
const swAtual = readFileSync(swPath, 'utf8');
const LINHA = /^\/\/ versao: .*$/m; // a própria linha da versão fica fora do cálculo
hash.update(swAtual.replace(LINHA, ''));
const version = hash.digest('hex').slice(0, 12);
const out = `// Gerado por tools/gen-precache.mjs — não edite à mão.\nself.LF_VERSION = '${version}';\nself.LF_ASSETS = ${JSON.stringify(['./', ...list], null, 0)};\n`;
const target = join(root, 'sw-assets.js');
const swNovo = swAtual.replace(LINHA, `// versao: ${version}`);
if (process.argv.includes('--check')) {
  const cur = existsSync(target) ? readFileSync(target, 'utf8') : '';
  if (cur !== out || swAtual !== swNovo) { console.error('sw-assets.js está desatualizado. Rode: npm run precache'); process.exit(1); }
  console.log(`sw-assets.js em dia (${list.length} arquivos, versão ${version}).`);
} else { writeFileSync(target, out); writeFileSync(swPath, swNovo); console.log(`sw-assets.js: ${list.length} arquivos, versão ${version}.`); }
