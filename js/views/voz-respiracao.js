// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Respiração guiada com círculo animado e teste de tempo máximo de "sss".
import { h, top, seg, canvas, loop, vib, wake, reducedMotion, fmt, toast } from '../core/ui.js';
import { log, roteiro, events } from '../core/store.js';
import { click, unlock, now, Metronome } from '../audio/engine.js';
import { TASKS, taskUI } from '../core/voice-tasks.js';

// fases: [rótulo, segundos, tipo: 'in' | 'hold' | 'out']
const EX = {
  '448': { name: '4-4-8', about: 'Inspire em 4, segure em 4 e solte em 8. Acalma e alonga a saída do ar.', cycles: () => Array.from({ length: 6 }, () => [['Inspire pelo nariz', 4, 'in'], ['Segure, sem travar a garganta', 4, 'hold'], ['Solte devagar pela boca', 8, 'out']]) },
  longo: { name: 'Fôlego longo', about: 'Inspire em 4 e solte em “sss”, cada vez por mais tempo: 8, 12, 16, 20 e 24 segundos.', cycles: () => [8, 12, 16, 20, 24].map((s) => [['Inspire baixo, costelas abrindo', 4, 'in'], [`Solte em “sss” por ${s} s`, s, 'out']]) },
  quadrada: { name: 'Quadrada', about: 'Quatro tempos iguais: inspire, segure, solte, segure. Boa para foco antes de cantar.', cycles: () => Array.from({ length: 6 }, () => [['Inspire', 4, 'in'], ['Segure cheio', 4, 'hold'], ['Solte', 4, 'out'], ['Segure vazio', 4, 'hold']]) },
  apoio: { name: 'Golpes de apoio', about: 'Solte “ss!” curtos e firmes, um por batida, sentindo o abdômen saltar. Oito golpes, respire, repita.', pulses: true },
};

export default async function respiracao(el) {
  let kind = '448', run = null, met = null;
  const cv = canvas(260), label = h('h2.center', 'Pronto?'), count = h('div.big.center', '—'), about = h('p.dim.center'), btn = h('button.btn.primary.block', 'Começar'), prog = h('p.small.muted.center');
  let scale = 0.35, target = 0.35, pulse = 0;
  const still = reducedMotion();
  loop(cv, () => {
    const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh);
    if (run) { const ph = run.phase(); if (ph) { const k = ph.elapsed / ph.dur; target = ph.type === 'in' ? 0.35 + 0.65 * k : ph.type === 'out' ? 1 - 0.65 * k : ph.prev === 'in' ? 1 : 0.35; count.textContent = String(Math.max(1, Math.ceil(ph.dur - ph.elapsed))); } }
    scale += (target - scale) * (still ? 1 : 0.2); pulse *= 0.86;
    const R = Math.min(w, hh) * 0.44 * (scale + pulse * 0.15);
    g.strokeStyle = 'rgba(244,236,220,.15)'; g.lineWidth = 1.5; g.beginPath(); g.arc(w / 2, hh / 2, Math.min(w, hh) * 0.44, 0, 7); g.stroke();
    const gr = g.createRadialGradient(w / 2, hh / 2, R * 0.2, w / 2, hh / 2, R); gr.addColorStop(0, 'rgba(88,214,160,.9)'); gr.addColorStop(1, 'rgba(92,200,232,.35)');
    g.fillStyle = gr; g.beginPath(); g.arc(w / 2, hh / 2, Math.max(4, R), 0, 7); g.fill();
  });
  const stop = (finished) => {
    if (run) { run.stop(); run = null; } if (met) { met.stop(); met = null; }
    wake.off(); btn.textContent = 'Começar'; target = 0.35; count.textContent = '—'; label.textContent = finished ? 'Muito bem.' : 'Pronto?'; prog.textContent = '';
    if (finished) { roteiro.mark('respirar'); log('breath', { kind, done: true }); toast('Respiração registrada.'); }
  };
  const startPhases = () => {
    const cycles = EX[kind].cycles(); let ci = 0, pi = 0, t0 = performance.now(), prev = 'out', alive = true, raf = 0;
    const enter = () => { const [txt, , type] = cycles[ci][pi]; label.textContent = txt; prog.textContent = `Ciclo ${ci + 1} de ${cycles.length}`; vib(type === 'hold' ? 20 : 40); try { click(now(), type === 'in', { gain: 0.08 }); } catch {} };
    const tick = () => { if (!alive) return; const [, dur, type] = cycles[ci][pi]; if ((performance.now() - t0) / 1000 >= dur) { prev = type; pi++; if (pi >= cycles[ci].length) { pi = 0; ci++; } if (ci >= cycles.length) { stop(true); return; } t0 = performance.now(); enter(); } raf = requestAnimationFrame(tick); };
    enter(); raf = requestAnimationFrame(tick);
    return { phase: () => { const [, dur, type] = cycles[ci][pi]; return { dur, type, prev, elapsed: (performance.now() - t0) / 1000 }; }, stop: () => { alive = false; cancelAnimationFrame(raf); } };
  };
  const startPulses = () => {
    let n = 0; const total = 40; label.textContent = '“ss!” em cada batida';
    met = new Metronome({ tempo: 66, beats: 10, onBeat: (k, t) => { const inBar = k % 10; const rest = inBar >= 8; setTimeout(() => { if (!met) return; if (rest) { label.textContent = 'Respire'; target = 1; } else { label.textContent = '“ss!”'; pulse = 1; target = 0.5; vib(30); } count.textContent = rest ? '…' : String(inBar + 1); prog.textContent = `Série ${Math.floor(k / 10) + 1} de 4`; if (k >= total - 1) setTimeout(() => stop(true), 900); }, Math.max(0, (t - now()) * 1000)); n = k; } });
    met.start(); void n;
    return { phase: () => null, stop: () => {} };
  };
  btn.onclick = async () => { await unlock(); if (run) { stop(false); return; } wake.on(); btn.textContent = 'Parar'; run = EX[kind].pulses ? startPulses() : startPhases(); };
  const setKind = (k) => { stop(false); kind = k; about.textContent = EX[k].about; };
  setKind(kind);

  // teste de "sss"
  const best = (await events('breath')).filter((e) => e.data.seconds).reduce((a, e) => Math.max(a, e.data.seconds), 0);
  const bestEl = h('p.small.muted', best ? `Seu melhor até agora: ${fmt(best, 1)} s.` : 'Ainda sem medida registrada.');
  const mkTask = () => taskUI(TASKS.sss(), { onResult: async (r) => { if (!r) return; await log('breath', { kind: 'sss', seconds: r.seconds }); await roteiro.mark('respirar'); bestEl.textContent = `Registrado: ${fmt(r.seconds, 1)} s.${r.seconds > best ? ' Novo recorde!' : ''}`; } });
  const task = mkTask();
  // sem microfone: cronômetro manual
  let manT0 = 0; const manBtn = h('button.btn.small.ghost', 'Sem microfone: cronometrar à mão');
  manBtn.onclick = async () => { if (!manT0) { manT0 = performance.now(); manBtn.textContent = 'Parar o cronômetro'; } else { const s = Math.round((performance.now() - manT0) / 100) / 10; manT0 = 0; manBtn.textContent = 'Sem microfone: cronometrar à mão'; await log('breath', { kind: 'sss', seconds: s, manual: true }); bestEl.textContent = `Registrado: ${fmt(s, 1)} s (manual).`; } };

  el.append(
    top('Respiração', '#/voz'),
    seg(Object.entries(EX).map(([v, e]) => ({ v, label: e.name })), kind, setKind, { label: 'Exercício' }),
    about, h('section.card.col', label, h('div.stage', { style: { background: 'transparent', border: 0 } }, cv), count, prog, btn),
    h('section.card.col', task.el, bestEl, manBtn),
    h('p.small.muted', 'Respire sem levantar os ombros. Se ficar tonto, pare e respire normalmente.'),
  );
  return () => { stop(false); task.cancel(); };
}
