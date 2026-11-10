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

// ---------- Fase 3: Voz e Evolução ----------
const runTask = async ({ page, tap, wait }, scope, ms, { finish = true } = {}) => {
  await tap(scope.getByRole('button', { name: /Começar|Repetir/ }).first()); await wait(ms);
  if (finish) { const c = scope.getByRole('button', { name: 'Concluir' }).first(); if (await c.isVisible().catch(() => false)) await tap(c); }
  await wait(350);
};
scenarios.push(
  { name: '20-voz', hash: '#/voz' },
  { name: '21-respiracao', hash: '#/voz/respiracao', run: async (api) => { const { page, tap, wait, assert } = api;
    await tap(page.getByRole('button', { name: 'Começar' }).first()); await wait(1500); assert(await page.getByText('Inspire pelo nariz').count(), 'respiração não começou'); await page.screenshot({ path: 'tests/e2e/shots/21-respiracao-rodando.png' }); await tap(page.getByRole('button', { name: 'Parar' }));
    await tap(page.getByRole('button', { name: 'Golpes de apoio' })); await tap(page.getByRole('button', { name: 'Começar' }).first()); await wait(1500); await tap(page.getByRole('button', { name: 'Parar' }));
    // teste de sss com o microfone falso: espera o trecho de chiado do arquivo (aos ~17 s do laço de 25 s)
    const card = page.locator('section.card').nth(1); await tap(card.getByRole('button', { name: 'Começar' })); await wait(9000); const c = card.getByRole('button', { name: 'Concluir' }); if (await c.isVisible().catch(() => false)) await tap(c); await wait(400);
    assert(await page.getByText(/Registrado:|Não consegui medir/).count(), 'teste de sss não terminou');
  } },
  { name: '22-aquecimento', hash: '#/voz/aquecimento', run: async ({ page, tap, wait, assert }) => {
    for (const n of ['Sirene', 'Staccato', 'Vibração de lábios']) { await tap(page.getByRole('button', { name: n })); await wait(80); }
    await tap(page.getByRole('button', { name: 'Começar' })); await wait(2500); assert(await page.getByText(/Tom 1 de/).count(), 'aquecimento não andou'); await page.screenshot({ path: 'tests/e2e/shots/22-aquecimento-rodando.png' }); await tap(page.getByRole('button', { name: 'Parar' }));
  } },
  { name: '23-afinacao', hash: '#/voz/afinacao', run: async ({ page, tap, wait, assert }) => {
    await tap(page.getByRole('button', { name: 'Ligar microfone' })); await wait(2500);
    const note = await page.locator('.big').first().textContent(); assert(note && note !== '—', 'afinador não leu a voz falsa'); await page.screenshot({ path: 'tests/e2e/shots/23-afinador.png' });
    await tap(page.getByRole('button', { name: 'Cante a nota' })); await wait(700); await tap(page.getByRole('button', { name: 'Cante a harmonia' })); await wait(900); assert(await page.getByText(/O bordão segura/).count(), 'harmonia não abriu'); await tap(page.getByRole('button', { name: '5ª justa' })); await wait(500);
  } },
  { name: '24-dicas', hash: '#/voz/dicas', run: async ({ page, tap, assert }) => { await tap(page.getByRole('button', { name: 'Saúde vocal' })); assert(await page.getByText(/duas semanas/).count(), 'aviso de saúde ausente'); } },
  { name: '25-registro', hash: '#/voz/registro', run: async (api) => { const { page, tap, wait, assert } = api; const card = page.locator('section.card').first();
    await runTask(api, card, 9000); assert(await page.getByText(/Extensão:/).count(), 'extensão não medida'); await page.screenshot({ path: 'tests/e2e/shots/25-registro-extensao.png' }); await tap(page.getByRole('button', { name: 'Salvar esta medida' })); await wait(300);
    await tap(page.getByRole('button', { name: 'Registro', exact: true })); await wait(300); { const lm = page.getByRole('button', { name: 'Ligar microfone' }); if (await lm.isVisible().catch(() => false)) await tap(lm); } await wait(2500); await page.screenshot({ path: 'tests/e2e/shots/25-registro-tempo-real.png' });
    assert(await page.getByText(/não é exame/i).count(), 'aviso de estimativa ausente');
    await tap(page.getByRole('button', { name: 'Passagens' })); await runTask(api, card, 5000); assert(await page.getByText(/Passagem perto|Não encontrei quebra|Não consegui/).count(), 'passagens sem resultado');
    await tap(page.getByRole('button', { name: 'Vibrato' })); await runTask(api, card, 6000, { finish: false }); await wait(2500);
    await tap(page.getByRole('button', { name: 'Fonação' })); await runTask(api, card, 5000);
  } },
  { name: '26-retrato', hash: '#/voz/retrato', run: async (api) => { const { page, tap, wait, assert } = api;
    await tap(page.getByRole('button', { name: 'Começar o retrato' })); const card = page.locator('section.card').first();
    const times = [9000, 7000, 8600, 5400, 5400, 6000, 6000, 10500];
    for (let k = 0; k < 8; k++) { await runTask(api, card, times[k], { finish: k < 2 || k === 5 || k === 6 }); await wait(400); const nx = page.getByRole('button', { name: /Próxima etapa|Ver o retrato/ }); if (await nx.isVisible().catch(() => false)) await tap(nx); else await tap(page.getByRole('button', { name: 'Pular esta etapa' })); await wait(300); }
    await wait(600); assert(await page.getByText('Seu retrato vocal').count(), 'retrato não foi concluído'); assert(await page.getByText(/semitons\)/).count(), 'retrato sem extensão');
  } },
  { name: '27-retrato-2', hash: '#/voz/retrato', run: async (api) => { const { page, tap, wait, assert } = api; // segundo retrato, curto, para a comparação
    await tap(page.getByRole('button', { name: 'Começar o retrato' })); const card = page.locator('section.card').first();
    await runTask(api, card, 7000); await tap(page.getByRole('button', { name: 'Próxima etapa' }));
    for (let k = 0; k < 6; k++) { await tap(page.getByRole('button', { name: 'Pular esta etapa' })); await wait(150); }
    await runTask(api, card, 10500, { finish: false }); await wait(500); await tap(page.getByRole('button', { name: 'Ver o retrato' })); await wait(700);
    assert(await page.getByText('escala salva').count(), 'escala não foi gravada');
  } },
  { name: '30-evolucao', hash: '#/evolucao', wait: 900, run: async ({ page, assert }) => { assert(await page.getByText('Primeiro retrato vocal').count(), 'marco do retrato ausente'); assert(await page.getByText('Primeira aula concluída').count(), 'marco da aula ausente'); await page.screenshot({ path: 'tests/e2e/shots/30-evolucao-full.png', fullPage: true }); } },
  { name: '31-comparar', hash: '#/evolucao/comparar', wait: 900, run: async ({ page, tap, wait, assert }) => { assert(await page.getByText('Tessitura lado a lado').count(), 'comparação não abriu'); await tap(page.getByRole('button', { name: /▶ B/ })); await wait(600); await tap(page.getByRole('button', { name: /▶ A|A: sem/ })); await page.screenshot({ path: 'tests/e2e/shots/31-comparar-full.png', fullPage: true }); } },
  { name: '32-backup', hash: '#/evolucao/backup', wait: 700, run: async ({ page, tap, wait, assert }) => {
    assert(await page.getByText(/Retrato vocal ·/).count() >= 1, 'gravação do retrato não aparece');
    const r = await page.evaluate(async () => { const s = await import('./js/core/store.js'); const d = JSON.parse(JSON.stringify(await s.exportAll())); const before = (await s.events()).length; const res = await s.importAll(d); return { before, after: res.events, recs: res.recordings, schema: d.schema, size: JSON.stringify(d).length }; });
    assert(r.before === r.after && r.recs >= 1, `backup não fechou: ${JSON.stringify(r)}`);
    const dl = page.waitForEvent('download', { timeout: 5000 }).catch(() => null); await tap(page.getByRole('button', { name: 'Exportar tudo' })); const d = await dl; assert(d && /sexteto-backup/.test(d.suggestedFilename()), 'download do backup não aconteceu');
    await tap(page.getByRole('button', { name: '▶ Ouvir' }).first()); await wait(300);
  } },
);

// ---------- Fase 4: Estúdio ----------
const LIC = ['1.1','1.2','1.3','1.4','1.5','1.6','1.7','2.1','2.2','2.3','2.4','2.5','3.1','3.2','3.3','3.4','3.5','3.6','3.7','4.1','4.2','4.3','4.4'];
scenarios.push(
  { name: '40-estudio', hash: '#/estudio', run: async ({ page, assert }) => { assert(await page.locator('a.item').count() === 23, 'esperava 23 lições'); } },
  ...LIC.map((id) => ({ name: `41-licao-${id}`, hash: `#/estudio/licao/${id}`, wait: 700, run: async ({ page, tap, wait, assert }) => {
    assert(await page.locator('figure.photo').count() >= 1, 'lição sem foto');
    const cards = page.locator('section.card');
    const nSims = (await cards.count()) - 1;
    for (let k = 0; k < nSims; k++) {
      const card = cards.nth(k); const play = card.getByRole('button', { name: 'Tocar' }).first();
      const hnd = await play.elementHandle(); await tap(play); await page.waitForFunction((el) => !el.disabled && el.textContent === 'Parar', hnd, { timeout: 25000 }).catch(() => {});
      await wait(500);
      // mexe nos controles do simulador
      const ranges = card.locator('input[type=range]'); const nr = Math.min(await ranges.count(), 4);
      for (let j = 0; j < nr; j++) await ranges.nth(j).evaluate((e) => { e.value = +e.min + (+e.max - +e.min) * 0.8; e.dispatchEvent(new Event('input')); });
      const chips = card.locator('.chip'); const nc = Math.min(await chips.count(), 3); for (let j = 0; j < nc; j++) { await tap(chips.nth(j)); await wait(60); }
      const sw = card.locator('.switch input'); const ns = Math.min(await sw.count(), 3); for (let j = 0; j < ns; j++) { await sw.nth(j).scrollIntoViewIfNeeded(); await sw.nth(j).click(); await wait(60); }
      const op = card.locator('.opt').first(); if (await op.count()) { await tap(op); await wait(100); }
      await wait(700);
      if (k === 0) await card.screenshot({ path: `tests/e2e/shots/41-sim-${id}.png` }).catch(() => {});
      const stop = card.getByRole('button', { name: 'Parar' }).first(); if (await stop.count()) await tap(stop);
    }
    const qs = page.locator('.quiz .q'); const nq = await qs.count(); assert(nq >= 3, 'esperava 3 perguntas');
    const last3 = [nq - 3, nq - 2, nq - 1]; for (const k of last3) await tap(qs.nth(k).locator('.opt').first());
    await wait(300); assert(await page.getByText(/Lição concluída/).count(), 'lição não concluída');
  } })),
  { name: '42-mesa', hash: '#/estudio/mesa', wait: 1500, run: async ({ page, tap, wait, assert }) => {
    await page.waitForSelector('.mesa', { timeout: 30000 });
    await tap(page.getByRole('button', { name: 'Tocar' })); await wait(1500);
    // gira o ganho do canal 1 até clipar
    const k = page.getByRole('slider', { name: 'Ganho' }).first(); await k.focus(); for (let i = 0; i < 30; i++) await page.keyboard.press('ArrowUp'); await wait(900);
    assert(await page.locator('.strip .clip.on').count() >= 1, 'luz de clip não acendeu com ganho alto');
    await page.screenshot({ path: 'tests/e2e/shots/42-mesa-clip.png' });
    await page.keyboard.press('Home'); for (let i = 0; i < 20; i++) await page.keyboard.press('ArrowUp');
    // missão "limpar o grave": resolve pelos botões e confere a verificação automática
    await tap(page.getByRole('button', { name: 'Limpar o grave' })); await wait(500);
    await page.evaluate(() => { const strips = [...document.querySelectorAll('.pager .strip')].slice(0, 6); strips.forEach((s, i) => { const b = [...s.querySelectorAll('.sq')].find((x) => x.textContent === 'HPF 100'); const on = b.getAttribute('aria-pressed') === 'true'; if ((i === 0 && on) || (i > 0 && !on)) b.click(); }); });
    for (let ch = 1; ch < 6; ch++) { const g = page.getByRole('slider', { name: 'Graves' }).nth(ch); await g.focus(); for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowDown'); }
    await page.waitForFunction(() => document.body.textContent.includes('Missão cumprida'), null, { timeout: 15000 });
    await page.screenshot({ path: 'tests/e2e/shots/42-mesa-missao.png', fullPage: true });
  } },
  { name: '43-mesa-paisagem', hash: '#/estudio/mesa', wait: 1500, run: async ({ page, tap, wait, assert }) => {
    await page.setViewportSize({ width: 844, height: 390 }); await page.waitForSelector('.mesa', { timeout: 30000 }); await wait(400);
    assert(await page.locator('.overview .ov').count() === 7, 'visão geral deveria ter 6 canais + master');
    assert(await page.locator('.overview').isVisible(), 'visão geral não aparece em paisagem');
    await tap(page.getByRole('button', { name: 'Tocar' })); await wait(1200); await page.screenshot({ path: 'tests/e2e/shots/43-paisagem-lado.png' });
    await tap(page.getByRole('button', { name: 'Parar' })); await page.setViewportSize({ width: 390, height: 844 });
  } },
  { name: '44-creditos', hash: '#/estudio/creditos', run: async ({ page, assert }) => { assert(await page.getByText('Bruno Moura').count() >= 1, 'proprietário ausente'); } },
);

// ---------- Fase 5: gravador e projeto final ----------
scenarios.push(
  { name: '50-gravador', hash: '#/estudio/gravador', run: async ({ page, tap, wait, assert }) => {
    await tap(page.getByRole('button', { name: 'Criar e abrir' })); await wait(900);
    await tap(page.getByRole('button', { name: 'Calibrar latência' })); await wait(4200);
    assert(await page.getByText(/Latência medida|Não ouvi os cliques/).count(), 'calibração não terminou');
    // grava a pista do líder com o microfone falso e para depois de alguns segundos
    await tap(page.getByRole('button', { name: 'Gravar Líder' })); await wait(9000);
    await page.screenshot({ path: 'tests/e2e/shots/50-gravando.png' });
    assert(await page.getByText(/Gravando “Líder”/).count(), 'não entrou em gravação');
    await tap(page.getByRole('button', { name: 'Parar a gravação de Líder' })); await wait(1200);
    assert(await page.getByText(/Pista “Líder” gravada/).count(), 'pista não foi salva');
    const info = await page.evaluate(async () => { const s = await import('./js/core/store.js'); const ps = await s.listProjects(); const t = ps[0].tracks.find((x) => x.recId); const m = await s.getRecordingMeta(t.recId); const pcm = await s.getRecordingPcm(t.recId); let pk = 0; for (const v of pcm) pk = Math.max(pk, Math.abs(v)); return { sec: m.length / m.sampleRate, sr: m.sampleRate, pk }; });
    assert(info.sec > 3 && info.pk > 0.05, `gravação vazia ou curta: ${JSON.stringify(info)}`);
    await tap(page.getByRole('button', { name: 'Gravar Baixo' })); await wait(6500); await tap(page.getByRole('button', { name: 'Parar a gravação de Baixo' })); await wait(1000);
    await tap(page.getByRole('button', { name: '▶ Ouvir tudo' })); await wait(1500); await tap(page.getByRole('button', { name: '■ Parar' }));
    const dl = page.waitForEvent('download', { timeout: 8000 }).catch(() => null); await tap(page.getByRole('button', { name: 'Exportar mixagem rápida em WAV' })); const d = await dl; assert(d && /\.wav$/.test(d.suggestedFilename()), 'WAV não foi exportado');
    await tap(page.getByRole('button', { name: 'Mais opções de Baixo' })); await tap(page.getByRole('button', { name: 'Apagar pista' })); await tap(page.getByRole('button', { name: 'Apagar', exact: true })); await wait(500);
    assert(await page.getByText('Baixo · vazia').count(), 'pista não foi apagada');
  } },
  { name: '51-mesa-projeto', hash: '#/estudio/gravador', wait: 600, run: async ({ page, tap, wait, assert }) => {
    await tap(page.locator('a.item').first()); await wait(600); await tap(page.getByRole('link', { name: 'Mixar na mesa virtual' })); await page.waitForSelector('.mesa', { timeout: 40000 });
    assert(await page.locator('.pager .strip').count() === 7, 'mesa do projeto deveria ter 6 canais + master');
    assert(await page.getByText('Baixo (app)').count() >= 1, 'pista vazia deveria usar a voz do app'); await tap(page.getByRole('button', { name: 'Tocar' })); await wait(1200);
  } },
  { name: '52-projeto', hash: '#/estudio/projeto', wait: 600, run: async ({ page, tap, wait, assert }) => {
    await tap(page.getByRole('button', { name: 'Começar o projeto' })); await wait(600);
    await tap(page.getByRole('link', { name: 'Abrir o gravador' })); await wait(800); await tap(page.getByRole('button', { name: 'Gravar Tenor 1' })); await wait(7000); await tap(page.getByRole('button', { name: 'Parar a gravação de Tenor 1' })); await wait(1000);
    await page.evaluate(() => { location.hash = '#/estudio/projeto'; }); await wait(800);
    assert(await page.getByText('1 de 6 vozes gravadas').count(), 'projeto não viu a pista gravada');
    await tap(page.getByRole('button', { name: 'Renderizar a mixagem e masterizar' }));
    await page.waitForFunction(() => document.body.textContent.includes('LUFS integrado'), null, { timeout: 90000 });
    const lufs = parseFloat((await page.locator('.stat b').first().textContent()).replace(',', '.').replace('−', '-')); assert(lufs < -5 && lufs > -40, 'LUFS fora do esperado: ' + lufs);
    await page.screenshot({ path: 'tests/e2e/shots/52-master.png', fullPage: true });
    const dl = page.waitForEvent('download', { timeout: 15000 }).catch(() => null); await tap(page.getByRole('button', { name: 'Exportar e compartilhar' })); const d = await dl; assert(d && /master/.test(d.suggestedFilename()), 'master não exportada');
    await wait(800); const ev = await page.evaluate(async () => { const s = await import('./js/core/store.js'); return (await s.events('project')).length; }); assert(ev === 1, 'projeto não entrou no histórico');
  } },
);

// ---------- Fase 6: extras ----------
scenarios.push(
  { name: '60-metronomo', hash: '#/harmonia/metronomo', run: async ({ page, tap, wait, assert }) => { await tap(page.getByRole('button', { name: 'Começar' })); await wait(1500); await tap(page.getByRole('button', { name: '3 tempos' })); await tap(page.getByRole('button', { name: 'Colcheias', exact: true })); await wait(900); await tap(page.getByRole('button', { name: '+ 1' })); assert(await page.getByText('81', { exact: true }).count(), 'andamento não mudou'); await page.screenshot({ path: 'tests/e2e/shots/60-metronomo-rodando.png' }); await tap(page.getByRole('button', { name: 'Parar' })); } },
  { name: '61-ritmo', hash: '#/harmonia/ritmo', run: async ({ page, tap, wait, assert }) => {
    await tap(page.getByRole('button', { name: 'Colcheias', exact: true })); await tap(page.getByRole('button', { name: 'Pulso' })); await tap(page.getByRole('button', { name: 'Ouvir e tocar' }));
    // toca junto com o clique nos dois últimos compassos, usando o relógio de áudio da página
    const res = await page.evaluate(async () => { const e = await import('./js/audio/engine.js'); const c = e.getCtx(); const pad = document.querySelector('[aria-label="Toque aqui no ritmo"]'); const beat = 60 / 72; const t0 = c.currentTime + 0.3 - 0.02; let k = 0;
      await new Promise((res) => { const iv = setInterval(() => { const target = t0 + (8 + k) * beat; if (c.currentTime >= target) { pad.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); k++; if (k >= 8) { clearInterval(iv); res(); } } }, 4); }); return k; });
    await page.waitForFunction(() => /toques no lugar/.test(document.body.textContent), null, { timeout: 15000 });
    const txt = await page.locator('p[aria-live]').last().textContent(); const hits = +txt.match(/(\d+) de 8/)[1]; assert(hits >= 6, 'toques não foram reconhecidos: ' + txt);
  } },
  { name: '62-partitura', hash: '#/harmonia/partitura', run: async ({ page, tap, wait, assert }) => { assert(await page.locator('svg ellipse').count() === 1, 'nota não desenhada'); for (let i = 0; i < 3; i++) { await tap(page.locator('.card .btn').nth(i)); await wait(2500); } await page.locator('select').selectOption('fa2'); await wait(200); assert(await page.getByText(/de 0|de 3/).count(), 'placar'); } },
  { name: '63-teclado', hash: '#/harmonia/teclado', run: async ({ page, tap, wait, assert }) => {
    await tap(page.locator('.switch input')); for (const m of [48, 52, 55, 59]) { const k = page.locator(`.kbd [data-m="${m}"]`); const b = await k.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height - 12); await page.mouse.down(); await page.mouse.up(); await wait(80); }
    await wait(200); assert(await page.getByText('Cmaj7').count(), 'acorde não reconhecido'); await tap(page.getByRole('button', { name: 'Ligar teclado MIDI' })); await wait(500);
  } },
);
