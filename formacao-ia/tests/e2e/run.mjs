// Teste ponta a ponta: abre o app a 390×844 no Chromium, conclui lições com cada tipo de exercício,
// percorre todas as telas e falha em erro de console, requisição externa, rolagem horizontal ou alvo de toque < 44 px.
// Uso: node tests/e2e/run.mjs [--dark] [--w=360]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { licao } from '../../js/data/curso.js';
import { parseMolde } from '../../js/core/andaime.js';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const root = fileURLToPath(new URL('../..', import.meta.url));
const shots = fileURLToPath(new URL('./shots/', import.meta.url));
mkdirSync(shots, { recursive: true });
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? +a.split('=')[1] : d; };
const W = arg('w', 390), H = arg('h', 844), PORT = arg('port', 8124);
const dark = process.argv.includes('--dark');
const sufixo = dark ? '-escuro' : '';

const server = spawn(process.execPath, [root + 'tools/serve.mjs', String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 500));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, locale: 'pt-BR', colorScheme: dark ? 'dark' : 'light', acceptDownloads: true });
const page = await ctx.newPage();
const errors = []; let atual = '';
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${atual}] console.${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`[${atual}] erro: ${e.message}`));
page.on('request', (r) => { const u = r.url(); if (!u.startsWith(`http://localhost:${PORT}/`) && !/^(blob|data):/.test(u)) errors.push(`[${atual}] requisição externa: ${u}`); });
const base = `http://localhost:${PORT}/index.html`;
const ir = async (hash, espera = 350) => { await page.evaluate((x) => { location.hash = x; }, hash); await page.waitForTimeout(espera); };
const primario = () => page.locator('.acao-bar .btn.primary');
let n = 0, falhas = 0;

async function conferirTela(nome) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (over > 1) throw new Error(`rolagem horizontal de ${over}px`);
  const pequenos = await page.evaluate(() => [...document.querySelectorAll('#view button, #view a.btn, #view a.item, #view .chip, .tabs a, #view input[type=range], #view select, .acao-bar button')]
    .filter((e) => !e.closest('.jtree') && !e.closest('.hide')).filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 43.5 || r.width < 43.5); })
    .map((e) => `${e.tagName}.${e.className} "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 20)}" ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`));
  if (pequenos.length) throw new Error(`alvos de toque menores que 44 px: ${pequenos.slice(0, 3).join(' | ')}`);
  const texto = await page.evaluate(() => document.getElementById('view').innerText);
  const m = texto.match(/.{0,25}\b(null|undefined|NaN)\b.{0,25}|\[object Object\]/);
  if (m && !(atual === 'lab-n8n-expr' && /Olá, undefined/.test(m[0]))) throw new Error(`texto suspeito: “${m[0]}”`);
  if (/Não deu para abrir esta tela|Algo deu errado/.test(texto)) throw new Error('a tela não abriu');
  await page.screenshot({ path: `${shots}${nome}${sufixo}.png`, fullPage: true });
}
async function cenario(nome, fn) {
  atual = nome; n++;
  try { await fn(); await conferirTela(nome); console.log(`ok  ${nome}`); }
  catch (e) { falhas++; console.log(`FALHOU  ${nome}: ${String(e.message).split('\n')[0]}`); try { await page.screenshot({ path: `${shots}${nome}-FALHA${sufixo}.png`, fullPage: true }); } catch {} }
}

// ---------- resolver o exercício de cada tipo ----------
const RESPOSTAS_TEXTO = { papel: 'Você é redator de uma padaria de bairro.', contexto: 'Nossos clientes são famílias da vizinhança.', tarefa: 'Escreva um post sobre o pão novo.', formato: 'Até 3 frases, 1 emoji e 2 hashtags.', restricoes: 'Não cite preço.', exemplo: 'Saiu fornada! Vem que está quentinho.' };
async function resolver(L) {
  const ex = L.ex;
  if (ex.tipo === 'classificar') { for (const c of await page.locator('.cls .it').all()) { const b = await c.getAttribute('data-b'); await c.locator(`.chip[data-b="${b}"]`).click(); } }
  else if (ex.tipo === 'ordenar') { for (let i = 0; i < ex.itens.length; i++) await page.locator(`.ord .pool .peca[data-i="${i}"]`).click(); await page.locator('.passo .btn.primary.block').click(); }
  else if (ex.tipo === 'escolha') { for (const q of await page.locator('.passo .q').all()) await q.locator('.opt[data-k="0"]').click(); }
  else if (ex.tipo === 'lacunas' && ex.modo !== 'python') {
    const lacs = parseMolde(ex.molde).filter((p) => p.t === 'lac');
    const campos = page.locator('.lac input, .lac select');
    const k = await campos.count();
    // com andaime no nível 1 só aparecem as lacunas de prioridade 1
    const visiveis = lacs.filter((p) => k === lacs.length || p.n === 1);
    for (let i = 0; i < k; i++) { const c = campos.nth(i); if ((await c.evaluate((e) => e.tagName)) === 'SELECT') await c.selectOption(visiveis[i].v); else await c.fill(visiveis[i].v); }
    await page.locator('.passo .btn.primary.block').first().click();
  } else if (ex.tipo === 'lacunas') {
    const lacs = parseMolde(ex.molde).filter((p) => p.t === 'lac');
    const campos = page.locator('.lac input'); const k = await campos.count();
    const visiveis = lacs.filter((p) => k === lacs.length || p.n === 1);
    for (let i = 0; i < k; i++) await campos.nth(i).fill(visiveis[i].v);
    await page.locator('.passo .btn.primary.block').first().click();
    await page.waitForSelector('.passo .why.ok', { timeout: 20000 });
  } else if (ex.tipo === 'python') {
    await page.locator('.editor').fill(ex.solucao);
    await page.getByRole('button', { name: 'Conferir com os testes' }).click();
    await page.waitForSelector('.passo .why.ok', { timeout: 20000 });
  } else if (ex.tipo === 'json') {
    await page.locator('.passo textarea.mono').fill(JSON.stringify(ex.espera.tipo === 'lista' ? Array.from({ length: ex.espera.n || 1 }, (_, i) => ({ titulo: `Livro ${i + 1}`, autor: 'Autor', ano: 1900 + i })) : { nome: 'Ana', data: '2026-11-13', idade: 25, cursos: ['IA'], ativa: true }));
    await page.locator('.passo .btn.primary.block').click();
  } else if (ex.tipo === 'texto') {
    const tas = page.locator('.passo textarea');
    for (let i = 0; i < await tas.count(); i++) await tas.nth(i).fill(ex.campos ? RESPOSTAS_TEXTO[ex.campos[i].id] : (ex.modelo || 'Você é um tutor. Explique {tema} em até 5 linhas. Se não souber, diga que não encontrou.'));
    await page.locator('.passo .btn.primary.block').click();
  } else { await page.getByRole('button', { name: 'Pular o exercício por agora' }).click(); }
}
async function concluir(id) {
  const L = licao(id);
  await ir(`#/licao/${id}`);
  for (let i = 0; i < 3; i++) { await primario().click(); await page.waitForTimeout(120); }
  await resolver(L);
  await page.waitForTimeout(250);
  if (await primario().isDisabled()) throw new Error(`exercício ${L.ex.tipo} não liberou o Continuar`);
  await primario().click(); await page.waitForTimeout(150);
  for (let q = 0; q < L.quiz.length; q++) { await page.locator('.passo .opt[data-k="0"]').click(); await primario().click(); await page.waitForTimeout(120); }
  await primario().click(); await page.waitForTimeout(350);
  const t = await page.locator('.festa h1').textContent();
  if (!/concluída/.test(t)) throw new Error('a lição não chegou ao fim');
}

await page.goto(base); await page.waitForTimeout(600);
await cenario('01-hoje-primeira-vez', async () => { await ir('#/hoje'); });
for (const id of ['0.1', '0.2', '0.5', '1.2', '1.7', '2.1', '2.8', '3.3', '5.3', '5.9', '6.3']) await cenario(`licao-${id}`, () => concluir(id));
await cenario('licao-passo-ideia', async () => { await ir('#/licao/3.12'); await primario().click(); await page.waitForTimeout(150); });
await cenario('licao-exemplo-python', async () => { await ir('#/licao/5.4'); await primario().click(); await primario().click(); await page.locator('.code .bar button', { hasText: 'Rodar' }).first().click(); await page.waitForFunction(() => /Olá, Ana/.test(document.querySelector('.code .out')?.textContent || ''), null, { timeout: 20000 }); });
await cenario('02-hoje-com-progresso', async () => { await ir('#/hoje'); await page.getByRole('button', { name: 'Média' }).click(); await page.waitForTimeout(150); });
await cenario('trilha', () => ir('#/trilha'));
for (const m of [0, 3, 6]) await cenario(`trilha-m${m}`, () => ir(`#/trilha/m/${m}`));
await cenario('revisar', async () => { await page.evaluate(async () => { const e = await import('./js/core/estado.js'); const d = await import('./js/core/dia.js'); for (const k of Object.keys(e.S.cartoes)) e.S.cartoes[k].due = d.hoje(); }); await ir('#/revisar'); });
await cenario('revisar-cartoes', async () => {
  await ir('#/revisar/cartoes');
  for (let i = 0; i < 40; i++) {
    if (await page.locator('.festa').count()) break;
    await primario().click(); await page.waitForTimeout(60);
    const nota = i % 4 === 1 ? 'errei' : i % 4 === 2 ? 'dificil' : 'lembrei';
    const b = page.locator(`[data-nota="${nota}"]`); if (await b.count()) await b.click(); else await page.locator('[data-nota="agora"]').click();
    await page.waitForTimeout(60);
  }
  if (!(await page.locator('.festa').count())) throw new Error('a sessão de cartões não terminou');
});
await cenario('revisar-mistura', async () => { await ir('#/revisar/mistura'); for (let i = 0; i < 8; i++) { if (await page.locator('.festa').count()) break; await page.locator('.opt').first().click(); await page.locator('#view .btn.primary.block').click(); await page.waitForTimeout(80); } });
await cenario('revisar-importar', async () => { await ir('#/revisar/importar'); await page.locator('textarea').fill('frente;verso\nO que é RAG?;Busca + geração.\n"Com; ponto e vírgula";Funciona'); await page.getByRole('button', { name: 'Importar' }).click(); await page.waitForTimeout(200); });
await cenario('projeto', () => ir('#/projeto'));
await cenario('projeto-m0', async () => { await ir('#/projeto/m/0'); for (const t of (await page.locator('.tick').all()).slice(0, 4)) await t.click(); });
await cenario('projeto-diario', async () => { await ir('#/projeto/diario'); await page.locator('textarea').fill('Terminei o Módulo 0.'); await page.getByRole('button', { name: 'Guardar' }).click(); });
await cenario('projeto-ficha', async () => { await ir('#/projeto/ficha'); await page.locator('textarea').first().fill('Responde dúvidas sobre as minhas anotações e cita a fonte.'); });
await cenario('projeto-prompts-novo', async () => { await ir('#/projeto/prompts/novo'); await page.locator('input.inp').first().fill('Tutor Socrático'); await page.locator('textarea.mono').fill('Você é um tutor paciente. Faça 3 perguntas sobre {tema} antes de explicar.'); await page.locator('.tick').first().click(); await page.getByRole('button', { name: 'Guardar na biblioteca' }).click(); await page.waitForTimeout(250); });
await cenario('projeto-prompts', () => ir('#/projeto/prompts'));
await cenario('projeto-kits', () => ir('#/projeto/kits'));
await cenario('projeto-pendencias', () => ir('#/projeto/pendencias'));
await cenario('progresso', () => ir('#/progresso'));
await cenario('progresso-semana', async () => { await ir('#/progresso/semana'); await page.locator('input.inp').nth(0).fill('Fiz 10 lições'); await page.locator('input.inp').nth(4).fill('Terça, lição 3.4'); });
await cenario('progresso-cronograma', async () => { await ir('#/progresso/cronograma'); await page.locator('button.item').first().click(); await page.waitForTimeout(150); });
await cenario('progresso-conquistas', () => ir('#/progresso/conquistas'));
for (const p of ['ficha', 'porque', 'ajustes', 'backup', 'pensamentos', 'lembretes']) await cenario(`mais-${p}`, () => ir(`#/mais/${p}`));
await cenario('foco', async () => { await ir('#/foco/m0-pastas'); await page.getByRole('button', { name: 'Começar' }).click(); await page.waitForTimeout(300); });
await cenario('foco-fim', async () => { await page.getByRole('button', { name: 'Terminei' }).click(); await page.waitForTimeout(200); });
await cenario('labs', () => ir('#/labs'));
for (const l of ['proximo', 'tokens', 'contexto', 'prompt', 'json', 'api', 'cosseno', 'chunks', 'rag', 'n8n-expr', 'n8n-if', 'backoff', 'python', 'agente']) await cenario(`lab-${l}`, () => ir(`#/labs/x/${l}`));
await cenario('rota-inexistente', async () => { await ir('#/nao/existe'); if (!(await page.locator('h1', { hasText: 'Hoje' }).count())) throw new Error('não caiu em Hoje'); });
await cenario('dados-persistem', async () => {
  await page.reload(); await page.waitForTimeout(700);
  const st = await page.evaluate(async () => { const e = await import('./js/core/estado.js'); return { lic: Object.values(e.S.licoes).filter((x) => x.feita).length, prompts: e.S.prompts.length, diario: e.S.diario.length, meus: e.S.meus.length, revs: e.revs.length }; });
  if (st.lic < 11 || st.prompts < 1 || st.diario < 1 || st.meus < 2 || st.revs < 5) throw new Error('dados não persistiram: ' + JSON.stringify(st));
});

await browser.close(); server.kill();
if (errors.length) { console.log('\nErros:'); for (const e of [...new Set(errors)].slice(0, 30)) console.log('  ' + e); }
console.log(`\n${n} cenários, ${falhas} falhas, ${errors.length} erros (${W}×${H}${dark ? ', tema escuro' : ''}).`);
process.exit(falhas || errors.length ? 1 : 0);
