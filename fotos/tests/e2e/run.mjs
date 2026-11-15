// Percorre o app no Chromium em tela de celular (390×844) com uma pasta de fotos de mentira:
// arrasta para os dois lados, usa os botões e o teclado, desfaz, revisa e apaga.
// Uso: npm run e2e   (precisa do Playwright)
import { createRequire } from 'node:module';
import { spawn, execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const shots = fileURLToPath(new URL('./shots/', import.meta.url));
mkdirSync(shots, { recursive: true });
const PORTA = 8192;
const srv = spawn(process.execPath, ['tools/serve.mjs', String(PORTA)], { cwd: raiz, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));

const falhar = (msg) => { throw new Error(msg); };
const erros = [];

// Pasta falsa com 6 fotos coloridas e uma subpasta; guarda em window.__apagadas o que o app apagar.
function pastaFalsa() {
  const cores = ['#e63946', '#f4a261', '#2a9d8f', '#264653', '#8e44ad', '#e9c46a'];
  const foto = (i) => new Promise((ok) => {
    const c = document.createElement('canvas'); c.width = 600; c.height = 800;
    const g = c.getContext('2d'); g.fillStyle = cores[i]; g.fillRect(0, 0, 600, 800);
    g.fillStyle = '#fff'; g.font = 'bold 200px sans-serif'; g.fillText(String(i + 1), 230, 470);
    c.toBlob((b) => ok(new File([b], `IMG_${i + 1}.png`, { type: 'image/png', lastModified: Date.UTC(2026, 0, 10 - i) })), 'image/png');
  });
  window.__apagadas = [];
  const pasta = (nome, itens) => ({
    kind: 'directory', name: nome,
    async *entries() { for (const it of itens) yield [it.name, it]; },
    async removeEntry(n) { const i = itens.findIndex((x) => x.name === n); if (i < 0) throw new Error('não existe'); itens.splice(i, 1); window.__apagadas.push(n); },
  });
  const arq = (f) => ({ kind: 'file', name: f.name, getFile: async () => f });
  window.showDirectoryPicker = async () => {
    const fs = await Promise.all([0, 1, 2, 3, 4, 5].map(foto));
    const notas = { kind: 'file', name: 'notas.txt', getFile: async () => new File(['x'], 'notas.txt') };
    return pasta('Fotos', [...fs.slice(0, 5).map(arq), notas, pasta('Viagem', [arq(fs[5])])]);
  };
}

const browser = await pw.chromium.launch();
try {
  for (const tema of ['dark', 'light']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: tema, hasTouch: false });
    await ctx.addInitScript(pastaFalsa);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => erros.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
    await p.goto(`http://localhost:${PORTA}/`);
    await p.getByRole('heading', { name: 'Limpa Fotos' }).waitFor();
    await p.screenshot({ path: `${shots}inicio-${tema}.png` });

    await p.getByRole('button', { name: 'Escolher pasta de fotos' }).click();
    await p.locator('#contador', { hasText: '1 de 6' }).waitFor();
    // mais novas primeiro: IMG_1 (10/jan) é a primeira
    if (!(await p.locator('#info-foto').textContent()).startsWith('IMG_1.png')) falhar('ordem: ' + await p.locator('#info-foto').textContent());

    const caixa = await p.locator('#carta').boundingBox();
    const cx = caixa.x + caixa.width / 2, cy = caixa.y + caixa.height / 2;
    const arrastar = async (dx, passos = 12) => {
      await p.mouse.move(cx, cy); await p.mouse.down();
      for (let i = 1; i <= passos; i++) await p.mouse.move(cx + dx * i / passos, cy + 5 * i / passos);
      return async () => { await p.mouse.up(); await p.waitForTimeout(350); };
    };

    // 1: arrasta para a esquerda (foto da tela no meio do gesto) → apagar
    let solta = await arrastar(-200);
    await p.screenshot({ path: `${shots}arrastando-${tema}.png` });
    await solta();
    // 2: arraste curto volta ao lugar
    solta = await arrastar(60, 3); await p.waitForTimeout(200); await solta();
    if ((await p.locator('#contador').textContent()) !== '2 de 6') falhar('arraste curto não devia decidir');
    // 2: arrasta para a direita → manter
    solta = await arrastar(220); await solta();
    // 3: botão apagar; 4: teclado ← ; desfaz a 4; 4: → manter
    await p.getByRole('button', { name: 'Apagar' }).click(); await p.waitForTimeout(350);
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(350);
    if ((await p.locator('#cont-apagar').textContent()) !== '3') falhar('contagem apagar');
    await p.getByRole('button', { name: 'Desfazer' }).click();
    await p.locator('#contador', { hasText: '4 de 6' }).waitFor();
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(350);
    // 5: apagar; 6 (da subpasta): apagar → abre a revisão sozinho
    await p.getByRole('button', { name: 'Manter' }).click(); await p.waitForTimeout(350);
    if (!(await p.locator('#info-foto').textContent()).startsWith('Viagem/IMG_6.png')) falhar('subpasta');
    await p.getByRole('button', { name: 'Apagar' }).click();
    await p.getByRole('heading', { name: 'Revisar' }).waitFor();
    await p.locator('#resumo', { hasText: '3 fotos para apagar' }).waitFor();
    await p.screenshot({ path: `${shots}revisao-${tema}.png` });

    // tira a IMG_3 da lista
    await p.locator('.miniatura').nth(1).click();
    await p.locator('#resumo', { hasText: '2 fotos para apagar' }).waitFor();
    await p.getByRole('button', { name: 'Apagar 2' }).click();
    await p.getByText('isso não pode ser desfeito').waitFor();
    await p.screenshot({ path: `${shots}confirmar-${tema}.png` });
    await p.locator('#dlg-sim').click();
    await p.getByText(/2 fotos apagadas/).waitFor();
    const apagadas = await p.evaluate(() => window.__apagadas);
    if (JSON.stringify(apagadas) !== '["IMG_1.png","IMG_6.png"]') falhar('apagadas: ' + JSON.stringify(apagadas));
    await p.getByRole('button', { name: 'Escolher pasta de fotos' }).waitFor();
    await ctx.close();
  }

  // navegador sem acesso a arquivos (iPhone, Firefox): tria e baixa a lista
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  await ctx.addInitScript(() => { delete window.showDirectoryPicker; delete window.showOpenFilePicker; });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(`http://localhost:${PORTA}/`);
  await p.getByText('não deixa nenhum site apagar').waitFor();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  await p.locator('#input-fotos').setInputFiles([1, 2].map((n) => ({ name: `foto${n}.png`, mimeType: 'image/png', buffer: png })));
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(350);
  await p.keyboard.press('ArrowRight');
  await p.getByRole('heading', { name: 'Revisar' }).waitFor();
  const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Baixar lista' }).click()]);
  if (dl.suggestedFilename() !== 'fotos-para-apagar.txt') falhar('download');
  await ctx.close();

  if (erros.length) falhar('erros no console:\n' + erros.join('\n'));
  console.log('e2e ok — capturas em tests/e2e/shots/');
} finally {
  await browser.close();
  srv.kill();
}
