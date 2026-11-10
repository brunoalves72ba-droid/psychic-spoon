// Gera sw-assets.js: lista de arquivos para o pré-cache e versão (hash do conteúdo).
// Uso: node tools/gen-precache.mjs        (escreve)
//      node tools/gen-precache.mjs --check (falha se estiver desatualizado)
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const INCLUDE = ['index.html', 'manifest.webmanifest', 'css', 'js', 'assets'];
const SKIP = [/\.DS_Store$/, /^assets\/img\/minhas\/(?!minhas\.json$)/, /\.txt$/, /\.md$/];
const files = [];
const walk = (p) => { const st = statSync(p); if (st.isDirectory()) for (const f of readdirSync(p).sort()) walk(join(p, f)); else files.push(relative(root, p).split('\\').join('/')); };
for (const i of INCLUDE) if (existsSync(join(root, i))) walk(join(root, i));
// lista das fotos do dono (assets/img/minhas), lida pelo app para dar prioridade a elas
const minhasDir = join(root, 'assets/img/minhas');
const minhas = existsSync(minhasDir) ? readdirSync(minhasDir).filter((f) => /\.(webp|jpe?g|png|avif)$/i.test(f)).sort() : [];
const minhasJson = JSON.stringify(minhas) + '\n';
if (!process.argv.includes('--check')) writeFileSync(join(minhasDir, 'minhas.json'), minhasJson);
const list = files.filter((f) => !SKIP.some((re) => re.test(f)));
const hash = createHash('sha256');
for (const f of list) { hash.update(f); hash.update(readFileSync(join(root, f))); }
hash.update(readFileSync(join(root, 'sw.js')));
const version = hash.digest('hex').slice(0, 12);
const out = `// Gerado por tools/gen-precache.mjs — não edite à mão.\nself.SEXTETO_VERSION = '${version}';\nself.SEXTETO_ASSETS = ${JSON.stringify(['./', ...list], null, 0)};\n`;
const target = join(root, 'sw-assets.js');
if (process.argv.includes('--check')) {
  const cur = existsSync(target) ? readFileSync(target, 'utf8') : '';
  if (cur !== out) { console.error('sw-assets.js está desatualizado. Rode: npm run precache'); process.exit(1); }
  console.log(`sw-assets.js em dia (${list.length} arquivos, versão ${version}).`);
} else { writeFileSync(target, out); console.log(`sw-assets.js: ${list.length} arquivos, versão ${version}.`); }
