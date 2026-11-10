// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Projeto final "Do zero ao master": escolher um arranjo, gravar cada voz com guia, mixar na mesa virtual,
// masterizar e exportar. O resultado entra no histórico.
import { h, top, slider, toggle, toast, fmt, shareOrDownload, seg } from '../core/ui.js';
import { kv, saveProject, getProject, saveRecording, log } from '../core/store.js';
import { newProject, projectArr, projectBuffers } from '../core/project.js';
import { renderMix, defaultState } from '../audio/mixer.js';
import { measureLoudness, truePeak, limit } from '../audio/loudness.js';
import { encodeWav } from '../audio/wav.js';
import { playPcm, unlock, stopAll } from '../audio/engine.js';
import { bufferFrom } from '../audio/sources.js';
import { ARRANGEMENTS } from '../music/arrangements.js';
import { VOICE_COLORS } from '../music/theory.js';

export default async function projeto(el) {
  let p = null; const pid = await kv.get('projeto:id', null); if (pid) p = await getProject(pid);
  const body = h('div.col'); let mixBuf = null, master = null, bits = 16;
  const step = (n, title, done, ...kids) => h('section.card.col', { style: { borderLeft: `4px solid ${done ? 'var(--v0)' : 'var(--line2)'}` } }, h('div.step-h', h('span', { style: done ? { background: 'var(--v0)' } : null }, done ? '✓' : String(n)), h('h3', title)), ...kids);
  const start = async (arrId) => { p = newProject(arrId); p.name = `Do zero ao master · ${projectArr(p).title}`; p.id = await saveProject(p); await kv.set('projeto:id', p.id); mixBuf = null; master = null; paint(); };
  async function paint() {
    stopAll();
    if (!p) { let arrId = 'aurora'; body.replaceChildren(step(1, 'Escolha um arranjo', false, h('p.small.dim', 'Você vai gravar as vozes dele, uma por uma, mixar e masterizar.'), h('select', { onchange: (e) => { arrId = e.target.value; } }, ARRANGEMENTS.map((a) => h('option', { value: a.id }, `${a.title} · ${a.key} · ${a.tempo} bpm`))), h('button.btn.primary', { onclick: () => start(arrId) }, 'Começar o projeto')),
      h('p.small.muted', 'Depois: 2. gravar · 3. mixar · 4. masterizar · 5. exportar.')); return; }
    const arr = projectArr(p), nRec = p.tracks.filter((t) => t.recId).length, mst = h('div.col'), exp = h('div.col');
    const prepare = async (btn) => {
      btn.disabled = true; btn.textContent = 'Renderizando a mixagem…';
      try { const { buffers } = await projectBuffers(p); if (!buffers.length) { toast('Nenhuma pista para mixar: grave ao menos uma ou ligue as vozes do app.'); return; } const st = p.mix && p.mix.ch.length === buffers.length ? p.mix : autoMix(buffers.length); mixBuf = await renderMix(buffers, st); process(); }
      catch (e) { toast('Falha ao renderizar: ' + (e.message || e)); } finally { btn.disabled = false; btn.textContent = 'Renderizar de novo'; }
    };
    const process = () => {
      if (!mixBuf) return; const ch = [mixBuf.getChannelData(0), mixBuf.getChannelData(1)], fs = mixBuf.sampleRate;
      const before = measureLoudness(ch, fs), lim = limit(ch, fs, { gainDb: p.master.gain, ceilingDb: p.master.ceiling }), l = measureLoudness(lim.channels, fs), tp = truePeak(lim.channels);
      master = { channels: lim.channels, fs, lufs: l.integrated, tp, before: before.integrated, red: lim.maxReduction };
      const st = (v, t) => h('div.stat', h('b', v), h('span', t)); let play = null;
      const listen = (which) => async () => { await unlock(); stopAll(); if (play === which) { play = null; return; } play = which; const src = which === 'antes' ? mixBuf : bufferFrom(master.channels, fs); playPcm(src, fs, { onEnd: () => { play = null; } }); };
      mst.replaceChildren(h('div.stats', st(fmt(master.lufs, 1), 'LUFS integrado'), st(fmt(master.tp, 1), 'dBTP (true peak)'), st(`${fmt(master.red, 1)} dB`, 'redução máxima')),
        h('p.small', master.lufs > -9 ? 'Muito alto: a dinâmica foi esmagada e as plataformas vão abaixar o volume.' : master.lufs < -18 ? 'Ainda baixo em relação ao alvo comum de −14 LUFS: há espaço para mais ganho.' : `Perto do alvo de −14 LUFS do Spotify (antes da master: ${fmt(master.before, 1)} LUFS).`),
        h('div.row', h('button.btn.grow', { onclick: listen('antes') }, '▶ Mixagem'), h('button.btn.grow', { onclick: listen('depois') }, '▶ Master')));
      exp.replaceChildren(seg([{ v: 16, label: 'WAV 16 bits (com dither)' }, { v: 24, label: 'WAV 24 bits' }], bits, (v) => { bits = v; }, { label: 'Formato', wrap: true }),
        h('button.btn.primary', { onclick: async () => {
          const blob = encodeWav(master.channels, master.fs, { bits, dither: bits === 16 }); const name = `${p.name.replace(/[^\w\-À-ú ]+/g, '').trim()} (master).wav`;
          const how = await shareOrDownload(blob, name, p.name); if (how === 'cancel') return;
          const mono = new Float32Array(master.channels[0].length); for (let i = 0; i < mono.length; i++) mono[i] = (master.channels[0][i] + master.channels[1][i]) * 0.5;
          const recId = await saveRecording({ name: `${p.name} (master, prévia mono)`, kind: 'master', sampleRate: master.fs, pcm: mono, extra: { project: p.id } });
          await log('project', { project: p.id, arr: p.arrId, tracks: nRec, lufs: Math.round(master.lufs * 10) / 10, truePeak: Math.round(master.tp * 10) / 10, bits, recId }); await log('recording', { recId, kind: 'master' });
          p.done = Date.now(); await saveProject(p); toast('Master exportada. O projeto entrou no seu histórico.'); paint();
        } }, 'Exportar e compartilhar'));
    };
    let timer = 0; const later = () => { clearTimeout(timer); timer = setTimeout(() => { saveProject(p); process(); }, 200); };
    const renderBtn = h('button.btn.primary', 'Renderizar a mixagem e masterizar'); renderBtn.onclick = () => prepare(renderBtn);
    body.replaceChildren(
      step(1, `Arranjo: ${arr.title}`, true, h('p.small.dim', arr.about), h('button.btn.small.ghost', { onclick: async () => { await kv.del('projeto:id'); p = null; paint(); } }, 'Trocar de arranjo (novo projeto)')),
      step(2, 'Gravar cada voz com guia', nRec > 0, h('div.seg.wrap', p.tracks.map((t) => h('span.pill', { style: { background: t.recId ? VOICE_COLORS[t.v] : '', color: t.recId ? '#0e2030' : '' } }, `${t.recId ? '✓ ' : ''}${t.name}`))), h('p.small.dim', `${nRec} de 6 vozes gravadas.`),
        h('a.btn.primary', { href: `#/estudio/gravador/${p.id}` }, nRec ? 'Continuar gravando' : 'Abrir o gravador'), toggle('Usar as vozes do app nas pistas que eu não gravar', p.fill, async (v) => { p.fill = v; await saveProject(p); mixBuf = null; })),
      step(3, 'Mixar na mesa virtual', !!p.mix, h('p.small.dim', p.mix ? 'Mixagem salva. Você pode voltar à mesa quando quiser.' : 'Acerte ganho, corte de graves, equilíbrio, pan e reverb. Se pular esta etapa, o app usa uma mixagem básica.'), h('a.btn', { href: `#/estudio/mesa/projeto/${p.id}` }, 'Abrir a mesa')),
      step(4, 'Masterizar', !!master, h('p.small.dim', 'O limiter sobe o volume até o teto. Mire perto de −14 LUFS, com true peak abaixo de −1 dBTP.'), renderBtn,
        slider('Ganho de entrada do limiter', { min: 0, max: 18, step: 0.5, value: p.master.gain, unit: 'dB' }, (v) => { p.master.gain = v; later(); }), slider('Teto (ceiling)', { min: -3, max: -0.1, step: 0.1, value: p.master.ceiling, unit: 'dBTP' }, (v) => { p.master.ceiling = v; later(); }), mst),
      step(5, 'Exportar', !!p.done, p.done ? h('p.small', `Exportado em ${new Date(p.done).toLocaleDateString('pt-BR')}.`) : h('p.small.dim', 'Depois de masterizar, escolha o formato e exporte.'), exp));
    if (mixBuf) process();
  }
  await paint();
  el.append(top('Do zero ao master', '#/estudio'), h('p.dim', 'O projeto final do curso: do microfone ao arquivo pronto.'), body);
  return () => stopAll();
}
/** Mixagem básica para quem pulou a mesa: corte de graves nas vozes de cima, pan aberto e um pouco de reverb. */
function autoMix(n) { const s = defaultState(n); s.ch.forEach((x, i) => { x.hpf = i > 0; x.pan = i === 0 ? 0 : (((i % 2 ? -1 : 1) * Math.ceil(i / 2)) / 3) * 0.7; x.rev = -14; }); return s; }
