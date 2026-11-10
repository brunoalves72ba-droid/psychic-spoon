// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Gravador multipista: até seis pistas, PCM cru capturado em AudioWorklet, guia e metrônomo no fone,
// calibração de latência, forma de onda, regravar e apagar pista, exportar WAV e compartilhar.
import { h, top, canvas, loop, toggle, toast, confirmSheet, shareOrDownload, fmtDur, fmtDate, wake, clamp, sheet } from '../core/ui.js';
import { prefs, saveProject, listProjects, getProject, deleteProject, saveRecording, deleteRecording, getRecordingPcm, getRecordingMeta, log } from '../core/store.js';
import { newProject, projectArr, projectSeconds, latencySeconds, projectBuffers } from '../core/project.js';
import { choirNote, pianoNote, click, playPcm, unlock, now, stopAll, getCtx, dryOut, mainBus } from '../audio/engine.js';
import { openMic, onPcm, onLevel, flushPcm, micSampleRate, micOpen } from '../audio/mic.js';
import { assemble, estimateLatency, peaksOf, quickMix } from '../audio/recorder.js';
import { encodeWav } from '../audio/wav.js';
import { ARRANGEMENTS } from '../music/arrangements.js';
import { VOICE_COLORS } from '../music/theory.js';

export default async function gravador(el, [idArg]) {
  if (!idArg) return list(el);
  const p = await getProject(+idArg); if (!p) return list(el);
  const arr = projectArr(p), dur = projectSeconds(p), beat = 60 / p.tempo;
  let metro = true, guide = true, piano = true, rec = null, playing = null, level = 0, offLevel = null;
  const peaks = p.tracks.map(() => null), rows = [];
  const status = h('p.small', { 'aria-live': 'polite' }, 'Toque em ● para gravar uma pista. Use fones: a guia não pode vazar para o microfone.');
  const latEl = h('span.small.muted');
  const showLat = () => { latEl.textContent = `Latência compensada: ${Math.round(latencySeconds() * 1000)} ms ${prefs.get('latencyMs') != null ? '(calibrada)' : '(estimativa do navegador)'}`; };
  const loadPeaks = async (i) => { const t = p.tracks[i]; peaks[i] = null; if (t.recId) { const pcm = await getRecordingPcm(t.recId); if (pcm) peaks[i] = { pk: peaksOf(pcm, 300), len: pcm.length / ((await getRecordingMeta(t.recId)).sampleRate) }; } };
  await Promise.all(p.tracks.map((_, i) => loadPeaks(i)));

  /** Agenda guia, metrônomo e pistas já gravadas a partir de t0. skip: pista que está sendo gravada. */
  const schedule = async (t0, skip, { countIn = 0 } = {}) => {
    const handles = [];
    for (let b = 0; b < countIn; b++) click(t0 - (countIn - b) * beat, b === 0, { gain: 0.25 });
    if (metro) for (let b = 0; b * beat < dur; b++) click(t0 + b * beat, b % 4 === 0, { gain: 0.12 });
    for (const t of p.tracks) {
      if (t.v === skip) continue;
      if (t.recId) { const pcm = await getRecordingPcm(t.recId), meta = await getRecordingMeta(t.recId); if (pcm) handles.push(playPcm(pcm, meta.sampleRate, { when: t0, gain: 0.8 })); }
      else if (guide && arr) { let tt = t0; for (const s of arr.steps) { const d = s.d * beat; choirNote(s.n[t.v], tt, d * 0.97, { voice: t.v, gain: 0.05, vowel: 'u', dest: dryOut() }); tt += d; } }
    }
    if (skip != null && piano && arr) { let tt = t0; pianoNote(arr.steps[0].n[skip], t0 - countIn * beat, beat * 2, { gain: 0.3, dest: dryOut() }); for (const s of arr.steps) { pianoNote(s.n[skip], tt, Math.min(1.2, s.d * beat), { gain: 0.16, dest: dryOut() }); tt += s.d * beat; } }
    return handles;
  };
  const stopAllPlay = () => { stopAll(); playing = null; rows.forEach((r) => r.paint()); transport.textContent = '▶ Ouvir tudo'; };
  const startRec = async (i) => {
    if (rec || playing) return;
    try { await unlock(); await openMic(); } catch (e) { status.textContent = e.message; return; }
    if (!offLevel) offLevel = onLevel((pk) => { level = Math.max(level * 0.9, pk); });
    const chunks = []; const off = onPcm((data, at, t) => chunks.push({ data, t }));
    const t0 = now() + 0.35 + 4 * beat; await schedule(t0, p.tracks[i].v, { countIn: 4 });
    rec = { i, t0, chunks, off, end: t0 + dur + 0.25 }; wake.on(); rows.forEach((r) => r.paint()); status.textContent = 'Contagem: 4 tempos…';
  };
  const stopRec = async (save = true) => {
    if (!rec) return; const r = rec; rec = null; stopAll(); await flushPcm(); r.off(); wake.off();
    const sr = micSampleRate(); const take = assemble(r.chunks, r.t0, sr, latencySeconds(), dur + 0.2);
    if (!save || take.length < sr * 0.5) { status.textContent = 'Gravação descartada (curta demais).'; rows.forEach((x) => x.paint()); return; }
    const t = p.tracks[r.i]; if (t.recId) await deleteRecording(t.recId);
    t.recId = await saveRecording({ name: `${p.name} · ${t.name}`, kind: 'pista', sampleRate: sr, pcm: take, extra: { project: p.id, track: r.i } });
    p.sampleRate = sr; await saveProject(p); await log('recording', { recId: t.recId, kind: 'pista', project: p.id, seconds: Math.round(take.length / sr) }); await loadPeaks(r.i);
    let pk = 0; for (let k = 0; k < take.length; k += 7) { const a = Math.abs(take[k]); if (a > pk) pk = a; }
    status.textContent = pk >= 0.99 ? `Pista “${t.name}” gravada, mas clipou. Afaste-se do microfone ou cante mais suave e regrave.` : pk < 0.03 ? `Pista “${t.name}” gravada, mas ficou muito baixa. Chegue mais perto do microfone.` : `Pista “${t.name}” gravada (pico em ${(20 * Math.log10(pk)).toFixed(1)} dBFS).`;
    rows.forEach((x) => x.paint());
  };
  const playAll = async (only) => {
    if (rec) return; if (playing) return stopAllPlay(); await unlock(); const t0 = now() + 0.15;
    if (only != null) { const t = p.tracks[only]; const pcm = await getRecordingPcm(t.recId), meta = await getRecordingMeta(t.recId); playPcm(pcm, meta.sampleRate, { when: t0 }); } else await schedule(t0, null);
    playing = { t0, only }; transport.textContent = '■ Parar'; rows.forEach((r) => r.paint());
  };
  const transport = h('button.btn.primary.grow', { onclick: () => playAll(null) }, '▶ Ouvir tudo');

  p.tracks.forEach((t, i) => {
    const cv = canvas(54), recB = h('button.sq', { 'aria-label': `Gravar ${t.name}`, css: { '--on': 'var(--bad)' } }, '●'), playB = h('button.sq', { 'aria-label': `Ouvir ${t.name}` }, '▶'), moreB = h('button.sq', { 'aria-label': `Mais opções de ${t.name}` }, '⋯');
    recB.onclick = () => (rec && rec.i === i ? stopRec(true) : startRec(i));
    playB.onclick = () => (playing ? stopAllPlay() : playAll(i));
    moreB.onclick = () => { const close = sheet([h('h2', t.name), h('button.btn', { onclick: async () => { close(); const pcm = await getRecordingPcm(t.recId), meta = await getRecordingMeta(t.recId); await shareOrDownload(encodeWav([pcm], meta.sampleRate), `${t.name}.wav`, t.name); } }, 'Exportar esta pista em WAV'), h('button.btn.danger', { onclick: async () => { close(); if (await confirmSheet(`Apagar a pista “${t.name}”? Isso não pode ser desfeito.`, 'Apagar')) { await deleteRecording(t.recId); t.recId = null; peaks[i] = null; await saveProject(p); paint(); toast('Pista apagada.'); } } }, 'Apagar pista'), h('button.btn.ghost', { onclick: () => close() }, 'Fechar')]); };
    const paint = () => { const on = rec && rec.i === i; recB.setAttribute('aria-pressed', String(!!on)); recB.textContent = on ? '■' : '●'; recB.setAttribute('aria-label', on ? `Parar a gravação de ${t.name}` : t.recId ? `Regravar ${t.name}` : `Gravar ${t.name}`); playB.disabled = !t.recId; moreB.disabled = !t.recId; recB.disabled = !!(rec && !on); lab.textContent = t.recId ? `${t.name} · ${fmtDur(peaks[i] ? peaks[i].len : 0)}` : `${t.name} · vazia`; };
    const lab = h('b.small');
    loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); const col = VOICE_COLORS[t.v];
      if (peaks[i]) { g.fillStyle = col; const pk = peaks[i].pk, n = pk.length / 2, wd = Math.min(1, peaks[i].len / dur) * w; for (let k = 0; k < n; k++) { const x = (k / n) * wd; g.fillRect(x, hh / 2 - pk[k * 2 + 1] * hh / 2, Math.max(1, wd / n), Math.max(1, (pk[k * 2 + 1] - pk[k * 2]) * hh / 2)); } }
      else { g.fillStyle = 'rgba(244,236,220,.25)'; g.fillRect(0, hh / 2, w, 1); }
      const c = getCtx().currentTime;
      if (rec && rec.i === i) { const e = c - rec.t0; g.fillStyle = 'rgba(240,106,152,.25)'; g.fillRect(0, 0, clamp(e / dur, 0, 1) * w, hh); g.fillStyle = '#f06a98'; g.fillRect(4, hh - 8, clamp(level, 0, 1) * (w - 8), 4); }
      if (playing && (playing.only == null || playing.only === i)) { const e = c - playing.t0; if (e >= 0) { g.fillStyle = '#f4ecdc'; g.fillRect(clamp(e / dur, 0, 1) * w, 0, 2, hh); } }
    });
    const row = h('div.card.tight', { style: { borderLeft: `4px solid ${VOICE_COLORS[t.v]}`, display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px 8px', alignItems: 'center' } }, h('div.col', { style: { gap: '4px', minWidth: 0 } }, lab, h('div.stage', cv)), h('div.row', { style: { gap: '4px' } }, recB, playB, moreB));
    rows.push({ el: row, paint }); paint();
  });
  // relógio da gravação e da reprodução
  loop(status, () => { const c = getCtx().currentTime; if (rec) { const e = c - rec.t0; if (e >= 0) status.textContent = `Gravando “${p.tracks[rec.i].name}”: ${fmtDur(e)} de ${fmtDur(dur)}`; if (c >= rec.end) stopRec(true); } if (playing && c > playing.t0 + dur + 0.5) stopAllPlay(); });

  const calibrate = async () => {
    try { await unlock(); await openMic(); } catch (e) { toast(e.message); return; }
    status.textContent = 'Calibrando: encoste o fone no microfone (ou use o alto-falante por um instante) e fique em silêncio…';
    const chunks = []; const off = onPcm((data, at, t) => chunks.push({ data, t })); const t0 = now() + 0.6, times = [0, 0.4, 0.8, 1.2, 1.6, 2.0];
    times.forEach((t) => click(t0 + t, true, { gain: 0.6 }));
    const wait = () => new Promise((res) => { const chk = () => (now() > t0 + 2.6 ? res() : requestAnimationFrame(chk)); chk(); });
    await wait(); await flushPcm(); off();
    const pcm = assemble(chunks, t0, micSampleRate(), 0), r = estimateLatency(pcm, micSampleRate(), times);
    if (r && r.ms >= 0 && r.ms < 400) { await prefs.set('latencyMs', r.ms); status.textContent = `Latência medida: ${r.ms} ms (${r.found} de 6 cliques). As próximas gravações já saem alinhadas.`; }
    else status.textContent = 'Não ouvi os cliques. Encoste um lado do fone no microfone, aumente o volume e tente de novo.';
    showLat();
  };
  const exportMix = async () => {
    const { buffers, index } = await projectBuffers(p, { fill: false }); if (!buffers.length) return toast('Grave pelo menos uma pista.');
    const pans = index.map((v) => (v === 0 ? 0 : ((v % 2 ? -1 : 1) * Math.ceil(v / 2)) / 3 * 0.7)); const sr = buffers[0].sampleRate;
    const mix = quickMix(buffers.map((b) => b.getChannelData(0)), pans); await shareOrDownload(encodeWav(mix, sr, { bits: 16, dither: true }), `${p.name.replace(/[^\w\-À-ú ]+/g, '').trim()}.wav`, p.name); toast('Mixagem exportada em WAV.');
  };
  showLat();
  el.append(top(p.name, '#/estudio/gravador'),
    h('div.banner', h('span', '🎧'), h('span', h('b', 'Use fones. '), arr ? `Guia: “${arr.title}” a ${p.tempo} bpm, ${fmtDur(dur)}.` : `Projeto livre a ${p.tempo} bpm, ${p.bars} compassos (${fmtDur(dur)}).`)),
    h('div.row', transport), status,
    h('section.col', rows.map((r) => r.el)),
    h('section.card.col', h('h3', 'Guia e metrônomo'), toggle('Metrônomo no fone', metro, (v) => { metro = v; }), arr ? toggle('Vozes do app nas pistas vazias', guide, (v) => { guide = v; }) : null, arr ? toggle('Piano dobrando a voz que estou gravando', piano, (v) => { piano = v; }) : null),
    h('section.card.col', h('h3', 'Latência'), h('p.small.dim', 'O som leva um tempo para sair do fone e voltar pelo microfone. O app desconta esse atraso para a sua voz cair no lugar certo.'), latEl, h('button.btn.small', { onclick: calibrate }, 'Calibrar latência')),
    h('section.card.col', h('h3', 'Depois de gravar'), h('a.btn', { href: `#/estudio/mesa/projeto/${p.id}` }, 'Mixar na mesa virtual'), h('button.btn', { onclick: exportMix }, 'Exportar mixagem rápida em WAV'), h('a.btn.ghost', { href: '#/estudio/projeto' }, 'Ir para “Do zero ao master”')),
  );
  void mainBus; void micOpen;
  return () => { if (rec) { rec.off(); rec = null; } offLevel && offLevel(); stopAll(); wake.off(); };
}

async function list(el) {
  const projects = await listProjects(); let arrId = 'aurora';
  const sel = h('select', { onchange: (e) => { arrId = e.target.value; } }, ARRANGEMENTS.map((a) => h('option', { value: a.id }, `Guia: ${a.title}`)), h('option', { value: '' }, 'Livre (só metrônomo, 80 bpm, 8 compassos)'));
  el.append(top('Gravador multipista', '#/estudio'),
    h('section.card.col', h('h3', 'Novo projeto'), h('p.small.dim', 'Até seis pistas. Com um arranjo como guia, cada pista é uma das seis vozes.'), sel, h('button.btn.primary', { onclick: async () => { const id = await saveProject(newProject(arrId || null)); location.hash = `#/estudio/gravador/${id}`; } }, 'Criar e abrir')),
    h('h2', 'Meus projetos'),
    projects.length ? h('section.list', projects.map((p) => h('div.row', h('a.item.grow', { href: `#/estudio/gravador/${p.id}` }, h('span.n', String(p.tracks.filter((t) => t.recId).length)), h('span.t', h('b', p.name), h('span', `${p.tracks.filter((t) => t.recId).length} de 6 pistas · ${fmtDate(p.updated || p.created)}`)), h('span.chev', '›')),
      h('button.sq', { 'aria-label': `Apagar o projeto ${p.name}`, onclick: async () => { if (await confirmSheet(`Apagar o projeto “${p.name}” e as suas gravações?`, 'Apagar')) { for (const t of p.tracks) if (t.recId) await deleteRecording(t.recId); await deleteProject(p.id); location.hash = '#/estudio'; setTimeout(() => { location.hash = '#/estudio/gravador'; }, 30); } } }, '🗑')))) : h('p.muted', 'Nenhum projeto ainda.'));
}
