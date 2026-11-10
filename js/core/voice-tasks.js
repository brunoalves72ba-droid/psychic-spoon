// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Tarefas de medição da voz, usadas no Medidor de registro e no Retrato vocal.

import { h, canvas, loop, wake, fmt, clamp, vib } from './ui.js';
import { prefs } from './store.js';
import { pitchToMidi } from './widgets.js';
import { openMic, onPitch, onPcm, flushPcm, micSampleRate } from '../audio/mic.js';
import { pianoNote, unlock, now } from '../audio/engine.js';
import { createRangeTracker, tessitura, classify, analyzeSustain, detectBreaks, featureMean, createSoundTimer } from '../audio/voice-analysis.js';
import { noteName, pc, VOICE_COLORS } from '../music/theory.js';

const BLACK = new Set([1, 3, 6, 8, 10]);
/** Piano vertical com mapa de calor. opts: { hist, lo, hi, tess, marks:[{m,color,label}], live } */
export function drawPianoHeat(g, w, hh, o = {}) {
  const LO = o.from ?? 36, HI = o.to ?? 84, n = HI - LO + 1, rh = hh / n, kw = 46;
  const max = Math.max(0.001, ...Object.values(o.hist || {}));
  for (let m = LO; m <= HI; m++) {
    const y = hh - (m - LO + 1) * rh; const black = BLACK.has(pc(m));
    g.fillStyle = black ? '#10202e' : '#e9dfcb'; g.fillRect(0, y + 0.5, black ? kw * 0.62 : kw, rh - 1);
    const v = (o.hist && o.hist[m]) || 0;
    if (v > 0) { const a = Math.sqrt(v / max); g.fillStyle = `rgba(${Math.round(92 + 163 * a)},${Math.round(200 - 60 * a)},${Math.round(232 - 130 * a)},${0.25 + 0.75 * a})`; g.fillRect(kw + 6, y + 0.5, (w - kw - 12) * (0.15 + 0.85 * a), rh - 1); }
    if (pc(m) === 0) { g.fillStyle = '#0e2030'; g.font = '10px Figtree, sans-serif'; g.fillText(noteName(m), 4, y + rh - 1); }
  }
  const Y = (m) => hh - (m - LO + 0.5) * rh;
  if (o.tess) { g.strokeStyle = '#ffd166'; g.lineWidth = 2; g.strokeRect(kw + 3, Y(o.tess.hi) - rh / 2, w - kw - 6, (o.tess.hi - o.tess.lo + 1) * rh); }
  if (o.lo != null && o.hi != null) { g.strokeStyle = '#f4ecdc'; g.lineWidth = 2; g.beginPath(); g.moveTo(kw + 6, Y(o.lo) + rh / 2); g.lineTo(w - 6, Y(o.lo) + rh / 2); g.moveTo(kw + 6, Y(o.hi) - rh / 2); g.lineTo(w - 6, Y(o.hi) - rh / 2); g.stroke(); g.fillStyle = '#f4ecdc'; g.font = '600 11px Figtree, sans-serif'; g.fillText(noteName(o.hi), w - 40, Y(o.hi) - rh / 2 - 3); g.fillText(noteName(o.lo), w - 40, Y(o.lo) + rh / 2 + 11); }
  for (const mk of o.marks || []) { g.strokeStyle = mk.color || '#f06a98'; g.setLineDash([5, 4]); g.lineWidth = 2; g.beginPath(); g.moveTo(kw, Y(mk.m)); g.lineTo(w, Y(mk.m)); g.stroke(); g.setLineDash([]); if (mk.label) { g.fillStyle = mk.color || '#f06a98'; g.font = '600 11px Figtree, sans-serif'; g.fillText(mk.label, kw + 10, Y(mk.m) - 3); } }
  if (o.live != null) { g.fillStyle = '#58d6a0'; g.beginPath(); g.arc(kw + 14, Y(clamp(o.live, LO, HI)), 6, 0, 7); g.fill(); }
}

function drawTrace(g, w, hh, pts, { marks = [] } = {}) {
  const vals = pts.filter((p) => p.m != null).map((p) => p.m); if (!vals.length) { g.fillStyle = 'rgba(244,236,220,.4)'; g.font = '13px Figtree, sans-serif'; g.fillText('Aguardando a sua voz…', 12, hh / 2); return; }
  const lo = Math.min(...vals) - 2, hi = Math.max(...vals, lo + 10) + 2, t0 = pts[0].t, t1 = Math.max(pts[pts.length - 1].t, t0 + 4);
  const X = (t) => ((t - t0) / (t1 - t0)) * w, Y = (m) => hh - ((m - lo) / (hi - lo)) * hh;
  g.font = '10px Figtree, sans-serif';
  for (let m = Math.ceil(lo); m <= hi; m++) if (pc(m) === 0 || pc(m) === 7) { g.strokeStyle = 'rgba(244,236,220,.1)'; g.beginPath(); g.moveTo(0, Y(m)); g.lineTo(w, Y(m)); g.stroke(); g.fillStyle = 'rgba(244,236,220,.4)'; g.fillText(noteName(m), 3, Y(m) - 2); }
  g.strokeStyle = '#f4ecdc'; g.lineWidth = 2.5; g.lineJoin = 'round'; g.beginPath(); let pen = false;
  for (const p of pts) { if (p.m == null) { pen = false; continue; } pen ? g.lineTo(X(p.t), Y(p.m)) : g.moveTo(X(p.t), Y(p.m)); pen = true; }
  g.stroke();
  for (const mk of marks) { g.strokeStyle = '#f06a98'; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(0, Y(mk.m)); g.lineTo(w, Y(mk.m)); g.stroke(); g.setLineDash([]); g.fillStyle = '#f06a98'; g.fillText(`passagem · ${noteName(mk.m)}`, w - 110, Y(mk.m) - 3); }
}

const A4 = () => prefs.get('a4') || 440;

/** Definições das tarefas. Cada create() devolve { push(p), draw(g,w,h), auto?(t), result() }. */
export const TASKS = {
  extensao: () => ({
    id: 'extensao', title: 'Extensão e tessitura', seconds: 45, height: 320,
    instr: 'Comece em uma nota confortável e desça, nota por nota, até a mais grave que você consegue segurar. Depois suba até a mais aguda, sem forçar. Segure cada nota por meio segundo. Só vale nota sustentada por 300 ms com leitura firme.',
    create() { const tr = createRangeTracker(); let live = null; return {
      push(p) { const m = pitchToMidi(p, A4(), 0.5, 0.004); live = m; tr.push(p.t, m, p.c); },
      draw(g, w, hh) { const r = tr.result(); drawPianoHeat(g, w, hh, { ...r, tess: tessitura(r.hist), live }); },
      result() { const r = tr.result(); if (r.lo == null) return null; const ts = tessitura(r.hist); return { ...r, tess: ts, types: classify(r.lo, r.hi, ts && ts.center).map((t) => t.name) }; },
    }; },
    summary: (r) => `Extensão: ${noteName(r.lo)} a ${noteName(r.hi)} (${r.hi - r.lo} semitons). Tessitura: ${noteName(r.tess.lo)} a ${noteName(r.tess.hi)}.`,
  }),
  sirene: () => ({
    id: 'sirene', title: 'Passagens (sirene lenta)', seconds: 24, height: 200,
    instr: 'Faça uma sirene lenta em “u”: deslize do grave ao agudo e volte, sem parar em nota nenhuma. Não corrija as quebras: são elas que queremos achar.',
    create() { const fr = []; return {
      push(p) { fr.push({ t: p.t, m: pitchToMidi(p, A4(), 0.6, 0.004), c: p.c, h1h2: p.h1h2 }); },
      draw(g, w, hh) { drawTrace(g, w, hh, fr, { marks: fr.length % 12 === 0 || true ? detectBreaks(fr.slice(-1200)) : [] }); },
      result() { const v = fr.filter((f) => f.m != null); if (v.length < 30) return null; return { points: detectBreaks(fr), lo: Math.round(Math.min(...v.map((f) => f.m))), hi: Math.round(Math.max(...v.map((f) => f.m))) }; },
    }; },
    summary: (r) => (r.points.length ? `Passagem perto de ${r.points.map((p) => noteName(p.m)).join(' e ')} (${r.points.map((p) => ({ salto: 'salto de altura', falha: 'falha curta', timbre: 'mudança de timbre' })[p.kind]).join(', ')}).` : 'Não encontrei quebra nem mudança brusca de timbre nesta sirene. Pode ser passagem suave ou sirene curta: repita indo mais ao agudo.'),
  }),
  sustentada: (note) => ({
    id: 'sustentada', title: 'Vibrato e estabilidade', seconds: 8, height: 160, guide: note,
    instr: `Cante um “a” em uma nota confortável${note ? ` (sugestão: ${noteName(note)})` : ''} e segure por uns 6 segundos, do seu jeito natural.`,
    create() { const fr = []; return {
      push(p) { const m = pitchToMidi(p, A4(), 0.85, 0.006); fr.push({ t: p.t, m }); },
      draw(g, w, hh) { drawTrace(g, w, hh, fr.slice(-400)); },
      result() { let best = [], cur = []; for (const f of fr) { if (f.m != null && (!cur.length || Math.abs(f.m - cur[cur.length - 1].m) < 1.5)) cur.push(f); else { if (cur.length > best.length) best = cur; cur = f.m != null ? [f] : []; } } if (cur.length > best.length) best = cur; return analyzeSustain(best.slice(6, -3)); },
    }; },
    summary: (r) => `${r.hasVibrato ? `Vibrato de ${fmt(r.rate, 1)} Hz, com ±${fmt(r.extent)} cents.` : 'Nota reta, sem vibrato regular.'} Estabilidade: ${fmt(r.stability, 1)} cents de variação na linha média (quanto menor, mais firme).`,
  }),
  calibra: (which, note) => ({
    id: 'calibra-' + which, title: which === 'chest' ? 'Amostra em voz de peito' : 'Amostra em voz de cabeça', seconds: 5, height: 120, guide: note, spec: true,
    instr: which === 'chest' ? `Cante “a” em voz de peito (cheia, como na fala)${note ? ` na nota ${noteName(note)}` : ''} por 4 segundos.` : `Agora a mesma nota${note ? ` (${noteName(note)})` : ''} em voz de cabeça ou falsete (leve, flautada) por 4 segundos.`,
    create() { const fr = []; return {
      push(p) { fr.push({ t: p.t, m: pitchToMidi(p, A4(), 0.85, 0.006), h1h2: p.h1h2, tilt: p.tilt, hf: p.hf }); },
      draw(g, w, hh) { const l = fr[fr.length - 1]; g.fillStyle = '#f4ecdc'; g.font = '13px Figtree, sans-serif'; if (l && l.m != null) { g.fillText(`${noteName(Math.round(l.m))} · H1−H2 ${fmt(l.h1h2, 1)} dB · inclinação ${fmt(l.tilt, 1)} dB/8ª · agudos ${fmt(l.hf, 1)} dB`, 10, hh / 2); const x = clamp((l.h1h2 + 5) / 30, 0, 1) * (w - 20); g.fillStyle = VOICE_COLORS[which === 'chest' ? 4 : 1]; g.fillRect(10, hh / 2 + 14, x, 8); } else g.fillText('Aguardando a sua voz…', 10, hh / 2); },
      result() { return featureMean(fr.slice(8)); },
    }; },
    summary: (r) => `Média: nota ${noteName(Math.round(r.m))}, H1−H2 ${fmt(r.h1h2, 1)} dB, inclinação ${fmt(r.tilt, 1)} dB por oitava.`,
  }),
  fonacao: () => ({
    id: 'fonacao', title: 'Tempo máximo de fonação', seconds: 60, height: 120,
    instr: 'Respire fundo e sustente um “a” em nota e volume confortáveis pelo maior tempo que conseguir. O relógio começa e para sozinho.',
    create() { const tm = createSoundTimer(); let t = 0; return {
      push(p) { t = p.t; tm.push(p.t, p.f > 0 && p.c >= 0.75 && p.rms > 0.005); },
      draw(g, w, hh) { g.fillStyle = '#f4ecdc'; g.font = '700 44px "Bricolage Grotesque", sans-serif'; g.fillText(`${fmt(tm.current(t) || tm.best(), 1)} s`, 12, hh / 2 + 14); },
      auto: () => tm.ended(t), result() { return tm.best() > 0.5 ? { seconds: Math.round(tm.best() * 10) / 10 } : null; },
    }; },
    summary: (r) => `${fmt(r.seconds, 1)} segundos em uma só emissão.`,
  }),
  sss: () => ({
    id: 'sss', title: 'Tempo máximo de “sss”', seconds: 70, height: 120,
    instr: 'Respire fundo e solte o ar em um “sss” contínuo e fino, pelo maior tempo que conseguir. O relógio começa e para sozinho.',
    create() { const tm = createSoundTimer(); let t = 0, floor = null, n = 0, lvl = 0; return {
      push(p) { t = p.t; n++; if (n <= 12) { floor = floor == null ? p.rms : Math.min(floor, p.rms); return; } lvl = p.rms; tm.push(p.t, p.rms > Math.max(0.006, floor * 4)); },
      draw(g, w, hh) { g.fillStyle = '#f4ecdc'; g.font = '700 44px "Bricolage Grotesque", sans-serif'; g.fillText(`${fmt(tm.current(t) || tm.best(), 1)} s`, 12, hh / 2 + 14); g.fillStyle = VOICE_COLORS[0]; g.fillRect(12, hh - 14, clamp(lvl * 8, 0, 1) * (w - 24), 6); },
      auto: () => tm.ended(t), result() { return tm.best() > 0.5 ? { seconds: Math.round(tm.best() * 10) / 10 } : null; },
    }; },
    summary: (r) => `${fmt(r.seconds, 1)} segundos de “sss”.`,
  }),
  escala: (root) => ({
    id: 'escala', title: 'Escala curta (gravada)', seconds: 12, height: 160, record: true,
    instr: `Cante “lá” junto com o piano: cinco notas subindo e descendo a partir de ${noteName(root)}. Esta escala fica gravada para você comparar daqui a um mês.`,
    schedule(t0) { const seq = [0, 2, 4, 5, 7, 5, 4, 2, 0]; pianoNote(root, t0, 0.8, { gain: 0.3 }); seq.forEach((s, i) => pianoNote(root + s, t0 + 1.2 + i * 0.8, 0.7, { gain: 0.22 })); return { seq: seq.map((s, i) => ({ m: root + s, t: t0 + 1.2 + i * 0.8, d: 0.8 })), end: t0 + 1.2 + seq.length * 0.8 + 0.4 }; },
    create(plan) { const fr = [], devs = []; return {
      push(p) { const m = pitchToMidi(p, A4(), 0.85, 0.006); fr.push({ t: p.t, m }); if (m == null || !plan) return; const st = plan.seq.find((s) => p.t >= s.t + s.d * 0.3 && p.t < s.t + s.d); if (st) { const f = m - 12 * Math.round((m - st.m) / 12); if (Math.abs(f - st.m) < 2) devs.push(Math.abs(f - st.m) * 100); } },
      draw(g, w, hh) { drawTrace(g, w, hh, fr.slice(-500)); },
      auto: () => plan && now() > plan.end, result() { return { cents: devs.length >= 8 ? Math.round(devs.reduce((a, b) => a + b, 0) / devs.length) : null, frames: devs.length }; },
    }; },
    summary: (r) => (r.cents != null ? `Desvio médio na escala: ${r.cents} cents.` : 'Escala gravada (poucas leituras para medir a afinação).'),
  }),
};

/**
 * Monta a interface de uma tarefa e a executa.
 * Devolve { el, start(), cancel(), done: Promise<resultado|null> }.
 */
export function taskUI(def, { autoStart = false, onResult } = {}) {
  let inst = null, off = null, offPcm = null, t0 = 0, running = false, resolve, chunks = [], plan = null, timer = 0;
  const done = new Promise((r) => { resolve = r; });
  const cv = canvas(def.height || 160), bar = h('div.meter', h('i')), msg = h('p.small', { 'aria-live': 'polite' });
  const btn = h('button.btn.primary.grow', 'Começar'), endBtn = h('button.btn.grow.hide', 'Concluir');
  const el = h('div.col', h('h3', def.title), h('p.dim', def.instr), h('div.stage', cv), bar, msg, h('div.row', btn, endBtn));
  loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); if (inst) inst.draw(g, w, hh); else { g.fillStyle = 'rgba(244,236,220,.4)'; g.font = '13px Figtree, sans-serif'; g.fillText('Toque em “Começar”.', 12, hh / 2); }
    if (running) { const e = (performance.now() - t0) / 1000; bar.firstChild.style.width = clamp(e / def.seconds * 100, 0, 100) + '%'; if (e >= def.seconds || (inst.auto && e > 1.5 && inst.auto())) finish(); } });
  async function finish() {
    if (!running) return; running = false; off && off(); off = null; wake.off(); clearTimeout(timer);
    let rec = null;
    if (def.record) { await flushPcm(); offPcm && offPcm(); const n = chunks.reduce((a, c) => a + c.length, 0); const pcm = new Float32Array(n); let o = 0; for (const c of chunks) { pcm.set(c, o); o += c.length; } rec = { pcm, sampleRate: micSampleRate() }; }
    const r = inst.result();
    btn.classList.remove('hide'); btn.textContent = 'Repetir'; endBtn.classList.add('hide'); bar.firstChild.style.width = '100%';
    if (!r) { msg.textContent = 'Não consegui medir: a voz ficou baixa ou curta demais. Chegue mais perto do microfone e repita.'; onResult && onResult(null); return; }
    if (rec) r.rec = rec;
    msg.textContent = def.summary(r); vib(30); onResult && onResult(r); resolve(r);
  }
  async function start() {
    if (running) return; btn.disabled = true; msg.textContent = 'Abrindo o microfone…';
    try { await unlock(); await openMic(); } catch (e) { msg.textContent = e.message; btn.disabled = false; return; }
    btn.disabled = false; btn.classList.add('hide'); endBtn.classList.remove('hide'); msg.textContent = 'Ouvindo…'; wake.on();
    chunks = []; plan = null;
    if (def.guide) pianoNote(def.guide, now(), 1.2, { gain: 0.3 });
    if (def.schedule) plan = def.schedule(now() + 0.3);
    inst = def.create(plan); t0 = performance.now(); running = true;
    if (def.record) offPcm = onPcm((d) => chunks.push(d));
    off = onPitch((p) => { if (running) inst.push(p); }, { spec: true });
  }
  btn.onclick = start; endBtn.onclick = finish;
  if (autoStart) queueMicrotask(start);
  return { el, start, done, cancel() { running = false; off && off(); offPcm && offPcm(); wake.off(); resolve(null); } };
}
