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
