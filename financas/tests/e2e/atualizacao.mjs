// Simula a atualização do app instalado: instala, "publica" uma versão nova numa cópia
// e confere que aparece "Atualizar", que a versão nova carrega e que os dados continuam.
// Uso: npm run e2e:atualizacao
import { createRequire } from 'node:module';
import { spawn, execSync } from 'node:child_process';
import { mkdtempSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const copia = mkdtempSync(join(tmpdir(), 'financas-'));
for (const f of ['index.html', 'manifest.webmanifest', 'sw.js', 'sw-assets.js', 'css', 'js', 'assets', 'tools']) cpSync(join(raiz, f), join(copia, f), { recursive: true });
const PORTA = 8293;
const srv = spawn(process.execPath, ['tools/serve.mjs', String(PORTA)], { cwd: copia, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));
const b = await pw.chromium.launch();
try {
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p.goto(`http://localhost:${PORTA}/`);
  await p.waitForFunction(() => !!navigator.serviceWorker.controller);
  await p.reload();
  await p.evaluate(() => localStorage.setItem('fin-dados', JSON.stringify({ lancamentos: [{ id: 'x', tipo: 'despesa', valor: 1234, data: '2026-11-10', categoria: 'mercado', descricao: 'Teste antigo' }] })));
  execSync(`sed -i 's/Para onde foi o dinheiro/Para onde foi o seu dinheiro/' js/views/resumo.js && node tools/gen-precache.mjs`, { cwd: copia, stdio: 'ignore' });
  await p.waitForTimeout(300); // deixa o app terminar de registrar o service worker
  await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await p.getByText('Nova versão do app disponível.').waitFor({ timeout: 15000 });
  await Promise.all([p.waitForEvent('load'), p.getByRole('button', { name: 'Atualizar' }).click()]);
  await p.getByText('Para onde foi o seu dinheiro').waitFor({ timeout: 10000 });
  if (!(await p.evaluate(() => localStorage.getItem('fin-dados').includes('Teste antigo')))) throw new Error('dados perdidos na atualização');
  console.log('Atualização ok: aviso, versão nova e dados preservados.');
} finally { await b.close(); srv.kill(); rmSync(copia, { recursive: true, force: true }); }
