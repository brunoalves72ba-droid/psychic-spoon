// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Aulas de ritmo com toque na tela: ouça o padrão, toque junto e veja o quanto adiantou ou atrasou.
import { h, top, seg, canvas, loop, vib, fmt, wake } from '../core/ui.js';
import { log } from '../core/store.js';
import { click, pianoNote, unlock, getCtx, onStopAll, stopAll } from '../audio/engine.js';

// padrão em colcheias (8 por compasso de 4): 1 = toque
export const RITMOS = [
  { id: 'pulso', name: 'Pulso', pat: [1, 0, 1, 0, 1, 0, 1, 0], tempo: 72, text: 'O pulso é a batida regular da música, o “pé batendo”. Toque junto com cada clique: quatro toques por compasso. Essas notas de um tempo se chamam semínimas.' },
  { id: 'minimas', name: 'Notas longas', pat: [1, 0, 0, 0, 1, 0, 0, 0], tempo: 76, text: 'A mínima dura dois tempos. Toque no 1 e no 3 e deixe o som durar. Contar por dentro (“um, dois, três, quatro”) é o que segura a nota longa no lugar.' },
  { id: 'colcheias', name: 'Colcheias', pat: [1, 1, 1, 1, 1, 1, 1, 1], tempo: 66, text: 'A colcheia divide o tempo em dois: “um-e, dois-e, três-e, quatro-e”. Toque no número e também no “e”, bem iguais.' },
  { id: 'pausa', name: 'Pausa e contratempo', pat: [0, 1, 0, 1, 0, 1, 0, 1], tempo: 66, text: 'Agora o silêncio cai no tempo e o toque cai no “e”: é o contratempo. Sinta o clique como chão e toque exatamente no meio entre dois cliques.' },
  { id: 'sincope', name: 'Síncope', pat: [1, 0, 0, 1, 0, 0, 1, 0], tempo: 72, text: 'Síncope é acentuar onde não se espera. Este padrão (3 + 3 + 2 colcheias) aparece na bossa, no baião e em muita música brasileira. O segundo toque vem antes do tempo 3: ele antecipa.' },
  { id: 'misto', name: 'Semínima e duas colcheias', pat: [1, 0, 1, 1, 1, 0, 1, 1], tempo: 72, text: '“Tá, ti-ti, tá, ti-ti”: uma nota de um tempo seguida de duas de meio tempo. É o desenho rítmico de inúmeras melodias.' },
];
/** Compara os toques com os instantes esperados. Devolve acertos, erro médio (ms) e tendência. */
export function scoreTaps(expected, taps, windowS = 0.14) {
  const used = new Set(); const errs = [];
  for (const e of expected) { let best = -1, bd = windowS; taps.forEach((t, i) => { const d = Math.abs(t - e); if (!used.has(i) && d <= bd) { bd = d; best = i; } }); if (best >= 0) { used.add(best); errs.push(taps[best] - e); } }
  const hits = errs.length, extra = taps.length - used.size; const mean = hits ? errs.reduce((a, b) => a + b, 0) / hits : 0, abs = hits ? errs.reduce((a, b) => a + Math.abs(b), 0) / hits : 0;
  return { hits, total: expected.length, extra, ms: Math.round(abs * 1000), bias: Math.round(mean * 1000) };
}

export default async function ritmo(el) {
  let cur = RITMOS[0], run = null, timer = 0;
  const cv = canvas(110), text = h('p'), msg = h('p', { 'aria-live': 'polite', style: { minHeight: '3em' } }), btn = h('button.btn.primary.grow', 'Ouvir e tocar');
  const pad = h('button.btn.block', { style: { minHeight: '120px', borderRadius: '24px', fontSize: '1.2rem', touchAction: 'none' }, 'aria-label': 'Toque aqui no ritmo' }, 'Toque aqui');
  const stop = () => { clearInterval(timer); if (run && run.off) run.off(); run = null; btn.textContent = 'Ouvir e tocar'; wake.off(); };
  const finish = () => { const r = scoreTaps(run.expected, run.taps); const res = r; stop();
    msg.textContent = `${res.hits} de ${res.total} toques no lugar${res.extra ? `, ${res.extra} a mais` : ''}. Erro médio: ${res.ms} ms. ${res.hits < res.total * 0.6 ? 'Ouça o padrão mais uma vez e conte em voz alta.' : Math.abs(res.bias) < 20 ? 'Bem no tempo!' : res.bias < 0 ? `Você tende a adiantar (${fmt(-res.bias)} ms). Espere o clique.` : `Você tende a atrasar (${fmt(res.bias)} ms). Antecipe um pouco.`}`;
    log('rhythm', { lesson: cur.id, hits: res.hits, total: res.total, ms: res.ms, bias: res.bias }); };
  const start = async () => {
    await unlock(); stopAll(); const c = getCtx(), e8 = 60 / cur.tempo / 2, t0 = c.currentTime + 0.3; // 4 compassos: 1 de contagem, 1 de exemplo, 2 para tocar
    const expected = []; run = { t0, e8, expected, taps: [], sched: 0, end: t0 + 32 * e8 + 0.3 };
    const tick = () => { while (run && run.sched < 32 && t0 + run.sched * e8 < c.currentTime + 0.2) { const i = run.sched, t = t0 + i * e8, bar = Math.floor(i / 8), k = i % 8; if (k % 2 === 0) click(t, k === 0, { gain: bar === 0 ? 0.25 : 0.14 }); if (bar === 1 && cur.pat[k]) pianoNote(72, t, 0.25, { gain: 0.3 }); if (bar >= 2 && cur.pat[k]) expected.push(t); run.sched++; } if (run && c.currentTime > run.end) finish(); };
    timer = setInterval(tick, 40); tick(); run.off = onStopAll(() => { clearInterval(timer); run = null; btn.textContent = 'Ouvir e tocar'; }); btn.textContent = 'Parar'; msg.textContent = 'Contagem, depois o exemplo. Toque junto nos dois últimos compassos.'; wake.on();
  };
  btn.onclick = () => (run ? stop() : start());
  pad.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!run) return; const c = getCtx(); run.taps.push(c.currentTime - (c.outputLatency || 0)); vib(12); pad.style.background = 'var(--v5)'; setTimeout(() => { pad.style.background = ''; }, 80); });
  loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); const cw = (w - 16) / 8;
    for (let k = 0; k < 8; k++) { const x = 8 + k * cw; g.fillStyle = cur.pat[k] ? '#5cc8e8' : 'rgba(244,236,220,.1)'; g.beginPath(); if (g.roundRect) g.roundRect(x + 3, 26, cw - 6, 44, 8); else g.rect(x + 3, 26, cw - 6, 44); g.fill(); g.fillStyle = 'rgba(244,236,220,.6)'; g.font = '600 12px Figtree, sans-serif'; g.fillText(k % 2 ? 'e' : String(k / 2 + 1), x + cw / 2 - 4, 18); }
    if (run) { const c = getCtx().currentTime, pos = (c - run.t0) / run.e8; if (pos >= 0) { const bar = Math.floor(pos / 8); g.fillStyle = '#f4ecdc'; g.fillRect(8 + (pos % 8) * cw, 22, 2, 52); g.font = '12px Figtree, sans-serif'; g.fillText(['Contagem', 'Ouça o exemplo', 'Sua vez', 'Sua vez'][Math.min(3, bar)], 8, hh - 8); for (const t of run.taps) { const p = (t - run.t0) / run.e8; if (Math.floor(p / 8) === bar) { g.fillStyle = '#ffd166'; g.beginPath(); g.arc(8 + (p % 8) * cw, 82, 5, 0, 7); g.fill(); } } } } });
  const set = (id) => { stop(); cur = RITMOS.find((r) => r.id === id); text.textContent = cur.text; msg.textContent = ''; };
  set(cur.id);
  el.append(top('Ritmo', '#/harmonia'), seg(RITMOS.map((r) => ({ v: r.id, label: r.name })), cur.id, set, { label: 'Aula' }), h('section.prose', text), h('section.card.col', h('div.stage', cv), h('div.row', btn), pad, msg),
    h('p.small.muted', 'Os quadrados azuis são os toques; os números são os tempos e o “e” é a metade de cada tempo. As bolinhas amarelas mostram onde você tocou.'));
  return () => stop();
}
