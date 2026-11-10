// Cenários do teste ponta a ponta. Cada um: { name, hash, run(api) }.
export const scenarios = [
  { name: '01-inicio', hash: '#/inicio', run: async ({ page, tap, wait, assert }) => {
    for (let i = 0; i < 6; i++) await tap(page.locator('.tower button').nth(i));
    await wait(500);
    assert(await page.getByText('Cmaj13 completo').count(), 'torre não completou o Cmaj13');
    const st = await page.evaluate(async () => { const e = await import('./js/audio/engine.js'); return e.getCtx().state; });
    assert(st === 'running', 'áudio não foi liberado: ' + st);
  } },
  { name: '02-ajustes', hash: '#/ajustes', run: async ({ page, tap, assert }) => {
    await tap('.switch input'); await page.waitForTimeout(250); assert(await page.getByText('C4 · D4').count(), 'nomes em letras não apareceram'); await tap('.switch input'); await page.waitForTimeout(250);
  } },
  { name: '03-microfone-worklet', hash: '#/inicio', run: async ({ page, assert }) => {
    const r = await page.evaluate(async () => {
      const mic = await import('./js/audio/mic.js');
      await mic.openMic();
      const got = []; const off = mic.onPitch((p) => got.push(p), { spec: true });
      await new Promise((res) => setTimeout(res, 2200)); off();
      const st = mic.micSettings(); const mode = mic.micMode(); mic.closeMic();
      const ok = got.filter((p) => p.f > 0 && p.c > 0.85);
      return { mode, n: got.length, ok: ok.length, f: ok.length ? ok[Math.floor(ok.length / 2)].f : 0, st, spec: ok.length ? ok[0].h1h2 : null };
    });
    assert(r.mode === 'worklet', 'esperava AudioWorklet, veio ' + r.mode);
    assert(r.ok > 20, `poucas leituras confiáveis: ${r.ok}/${r.n}`);
    assert(r.f > 60 && r.f < 1200, 'frequência fora da faixa: ' + r.f);
    assert(r.st.echoCancellation !== true && r.st.noiseSuppression !== true && r.st.autoGainControl !== true, 'processamento do microfone ficou ligado: ' + JSON.stringify(r.st));
    assert(typeof r.spec === 'number', 'sem medidas de espectro');
  } },
];

// ---------- Fase 2: Harmonia ----------
const playing = (page) => page.evaluate(async () => { const e = await import('./js/audio/engine.js'); return e.getCtx().state; });
scenarios.push(
  { name: '10-harmonia', hash: '#/harmonia', run: async ({ page, assert }) => { assert(await page.locator('a.item').count() === 16, 'esperava 16 aulas'); } },
  ...Array.from({ length: 16 }, (_, i) => ({ name: `11-aula-${String(i + 1).padStart(2, '0')}`, hash: `#/harmonia/aula/${i + 1}`, run: async ({ page, tap, wait, assert }) => {
    // experimento: clica nos primeiros controles e no botão principal
    const card = page.locator('section.card').first();
    const chips = card.locator('.chip, svg [role=button], .grid2 button');
    const n = Math.min(await chips.count(), 3);
    for (let k = 0; k < n; k++) { await tap(chips.nth(k)); await wait(120); }
    const pb = card.locator('button.btn.primary').first(); if (await pb.count()) { await tap(pb); await wait(700); }
    if (i === 0) await page.screenshot({ path: `tests/e2e/shots/11-aula-01-lab.png` });
    // cantar: liga o microfone falso
    const sing = page.locator('section.card').nth(1);
    await tap(sing.getByRole('button', { name: /Ligar microfone/ }));
    const fones = page.getByRole('button', { name: 'Estou de fones' }); if (await fones.count()) await tap(fones);
    await wait(900);
    assert(await sing.getByText(/Cante:/).count(), 'exercício de cantar não abriu');
    for (let k = 0; k < 4; k++) { const sk = sing.getByRole('button', { name: 'Pular' }); if (await sk.count()) { await tap(sk); await wait(150); } }
    // perguntas
    const qs = page.locator('.quiz .q');
    assert(await qs.count() === 3, 'esperava 3 perguntas');
    for (let k = 0; k < 3; k++) await tap(qs.nth(k).locator('.opt').first());
    await wait(400);
    assert(await page.getByText(/Aula concluída/).count(), 'aula não foi concluída');
  } })),
  { name: '12-acordes', hash: '#/harmonia/acordes', run: async ({ page, tap, wait, assert }) => {
    await tap(page.getByRole('button', { name: 'Tocar o acorde' })); await wait(300);
    await tap(page.getByRole('button', { name: 'G', exact: true })); await tap(page.getByRole('button', { name: '13', exact: true })); await tap(page.getByRole('button', { name: 'Drop 2' })); await wait(200);
    assert(await page.getByText('G13').count(), 'cifra não atualizou');
    await tap(page.getByRole('button', { name: 'Seis vozes' })); await tap(page.locator('.chip.v').nth(2)); await wait(200);
    assert(await page.getByText(/Falta a/).count(), 'não indicou a nota que falta');
    await tap(page.getByRole('button', { name: /Conferir com o microfone/ })); await wait(1200);
  } },
  { name: '13-imersao', hash: '#/harmonia/imersao', run: async ({ page, tap, wait, assert }) => {
    await tap(page.getByRole('button', { name: 'Tocar' })); await wait(2600);
    assert(await playing(page) === 'running', 'áudio parado');
    const chord = await page.locator('.big').first().textContent(); assert(chord && chord !== '—', 'acorde não apareceu');
    await page.screenshot({ path: 'tests/e2e/shots/13-imersao-tocando.png' });
    await tap(page.getByRole('button', { name: /Arranjo, andamento/ })); await wait(300); await tap(page.locator('.sheet .chip.v').first()); await wait(200);
    await page.screenshot({ path: 'tests/e2e/shots/13-imersao-ajustes.png' });
    await tap(page.getByRole('button', { name: 'Fechar' }));
  } },
  { name: '14-cante', hash: '#/harmonia/cante', run: async ({ page, tap, wait, assert }) => {
    await tap(page.getByRole('button', { name: 'Ligar microfone' })); await wait(800);
    await page.locator('input[type=range]').evaluate((e) => { e.value = 1.2; e.dispatchEvent(new Event('input')); });
    await tap(page.getByRole('button', { name: 'Começar' })); await wait(6000);
    await page.screenshot({ path: 'tests/e2e/shots/14-cante-meio.png' });
    await page.waitForFunction(() => document.body.textContent.includes('pontos (0 a 100)') || document.body.textContent.includes('Não ouvi'), null, { timeout: 40000 });
    assert(await page.getByText('pontos (0 a 100)').count(), 'sem pontuação (microfone falso deveria ser ouvido)');
  } },
  { name: '15-ouvido', hash: '#/harmonia/ouvido', run: async ({ page, tap, wait, assert }) => {
    for (const kind of ['Tríades', 'Tétrades', 'Tensões', 'Funções', 'Cadências', 'Qual voz mexeu?', 'Intervalos']) {
      await tap(page.getByRole('button', { name: kind, exact: true })); await wait(150);
      await tap(page.getByRole('button', { name: '▶ Ouvir' })); await tap(page.locator('.opt').first()); await wait(100);
    }
    for (let k = 0; k < 9; k++) { await tap(page.locator('button.btn.primary.block')); await wait(60); await tap(page.locator('.opt').first()); await wait(60); }
    assert(await page.getByText(/Rodada concluída/).count(), 'rodada não terminou');
  } },
  { name: '16-glossario', hash: '#/harmonia/glossario', run: async ({ page, assert }) => { await page.locator('input[type=search]').fill('trítono'); assert(await page.locator('.card.tight').count() >= 2, 'busca falhou'); } },
);
