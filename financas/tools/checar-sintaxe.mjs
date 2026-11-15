// Confere a sintaxe de todos os arquivos .js do app (as telas não são carregadas pelos testes unitários).
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const raiz = fileURLToPath(new URL('../js/', import.meta.url));
const arquivos = [];
const andar = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (f !== 'vendor') andar(p); } else if (f.endsWith('.js')) arquivos.push(p); } };
andar(raiz);
let erros = 0;
for (const f of arquivos) { try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch (e) { erros++; console.error(String(e.stderr).split('\n').slice(0, 4).join('\n')); } }
if (erros) { console.error(`${erros} arquivo(s) com erro de sintaxe.`); process.exit(1); }
console.log(`Sintaxe ok em ${arquivos.length} arquivos.`);
