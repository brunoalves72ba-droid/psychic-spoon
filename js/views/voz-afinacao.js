// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Afinação: afinador com rastro, "cante a nota" e "cante a harmonia" sobre um bordão.
import { h, top, seg, loop, wake, vib, fmt } from '../core/ui.js';
import { pitchTrace, centsMeter, pitchToMidi, foldToTarget } from '../core/widgets.js';
import { kv, prefs, log } from '../core/store.js';
import { pianoNote, choirNote, unlock, now } from '../audio/engine.js';
import { micGate, onPitch } from '../audio/mic.js';
import { noteName, VOICE_COLORS } from '../music/theory.js';

const HARM = [{ v: 4, label: '3ª maior' }, { v: 3, label: '3ª menor' }, { v: 7, label: '5ª justa' }, { v: 9, label: '6ª maior' }, { v: 10, label: '7ª menor' }, { v: 11, label: '7ª maior' }];
export default async function afinacao(el) {
  const voice = await kv.get('voice', { lo: 48, hi: 67 });
  let mode = 'afinador', target = null, drone = [], held = 0, devs = [], rounds = [], lastT = 0, interval = 4, base = Math.round((voice.lo + voice.hi) / 2) - 4, micOn = false;
  const trace = pitchTrace({ height: 200, span: 14 }), meter = centsMeter();
  const big = h('div.big', '—'), sub = h('p.dim', 'Ligue o microfone e cante qualquer nota.'), bar = h('div.meter', h('i')), panel = h('div.col'), out = h('p.small', { 'aria-live': 'polite' });
  const HOLD = 1.5, N = 6;
  const stopDrone = () => { drone.forEach((n) => n.stop()); drone = []; };
  const pick = () => { const lo = voice.lo + 2, hi = voice.hi - 2; let m; do { m = lo + Math.floor(Math.random() * (hi - lo + 1)); } while (m === target && hi > lo); return m; };
  const newTarget = async (play = true) => {
    held = 0; devs = []; bar.firstChild.style.width = '0%';
    if (mode === 'nota') { target = pick(); if (play) pianoNote(target, now(), 1.5, { gain: 0.3 }); sub.textContent = `Cante ${noteName(target)} e segure por ${fmt(HOLD, 1)} s dentro de 20 cents. Rodada ${rounds.length + 1} de ${N}.`; }
    else if (mode === 'harmonia') { target = base + interval; stopDrone(); if (play) { drone = [choirNote(base, now(), Infinity, { voice: 1, vowel: 'o', gain: 0.13, vib: 0.4 }), choirNote(base - 12, now(), Infinity, { voice: 0, vowel: 'o', gain: 0.09, vib: 0.3 })]; } sub.textContent = `O bordão segura ${noteName(base)}. Cante a ${HARM.find((x) => x.v === interval).label} acima: ${noteName(target)}. Rodada ${rounds.length + 1} de ${N}.`; }
    trace.setTarget(target, VOICE_COLORS[5]);
  };
  const finishRound = async () => {
    rounds.push(devs.reduce((a, b) => a + b, 0) / devs.length); vib(40);
    if (rounds.length >= N) {
      const avg = rounds.reduce((a, b) => a + b, 0) / rounds.length; stopDrone();
      await log('pitch', { source: mode, cents: Math.round(avg), interval: mode === 'harmonia' ? interval : undefined, rounds: N });
      out.textContent = `Série concluída: desvio médio de ${Math.round(avg)} cents. ${avg <= 10 ? 'Excelente.' : avg <= 20 ? 'Bem afinado.' : 'Continue: ouça a nota por dentro antes de cantar.'}`; rounds = [];
      if (mode === 'harmonia') { base += 1; if (base + 11 > voice.hi) base = voice.lo + 1; }
    }
    newTarget();
  };
  const setMode = async (m) => {
    mode = m; rounds = []; target = null; stopDrone(); trace.setTarget(null); out.textContent = ''; bar.classList.toggle('hide', m === 'afinador');
    panel.replaceChildren(
      m === 'nota' ? h('button.btn.small', { onclick: async () => { await unlock(); if (target != null) pianoNote(target, now(), 1.5, { gain: 0.3 }); } }, 'Ouvir a nota de novo') : null,
      m === 'harmonia' ? seg(HARM, interval, async (v) => { interval = v; rounds = []; await unlock(); newTarget(micOn); }, { label: 'Intervalo sobre o bordão' }) : null,
      m === 'harmonia' ? h('button.btn.small', { onclick: async () => { await unlock(); pianoNote(target, now(), 1.4, { gain: 0.28 }); } }, 'Dica: ouvir a nota da harmonia') : null);
    if (m === 'afinador') sub.textContent = micOn ? 'Cante qualquer nota: o rastro mostra para onde a voz vai.' : 'Ligue o microfone e cante qualquer nota.';
    else { await unlock(); newTarget(micOn); }
  };
  const off = [];
  const gate = micGate(() => {
    micOn = true; wake.on(); if (mode !== 'afinador') newTarget(true); else sub.textContent = 'Cante qualquer nota: o rastro mostra para onde a voz vai.';
    off.push(onPitch((p) => {
      const m = pitchToMidi(p, prefs.get('a4') || 440); const dt = lastT ? Math.min(0.1, p.t - lastT) : 0.02; lastT = p.t;
      if (m == null) { trace.push(null); meter.set(null); if (mode === 'afinador') big.textContent = '—'; return; }
      if (target == null) { const near = Math.round(m); trace.push(m); meter.set((m - near) * 100); big.textContent = noteName(near); return; }
      const f = foldToTarget(m, target), c = (f - target) * 100; trace.push(f); meter.set(c, noteName(target)); big.textContent = noteName(Math.round(m));
      if (Math.abs(c) <= 20) { held += dt; devs.push(Math.abs(c)); bar.firstChild.style.width = Math.min(100, held / HOLD * 100) + '%'; if (held >= HOLD) finishRound(); } else held = Math.max(0, held - dt);
    }));
  }, { playsToo: true });
  loop(trace, () => { trace.draw(); meter.draw(); });
  await setMode('afinador');
  el.append(top('Afinação', '#/voz'),
    seg([{ v: 'afinador', label: 'Afinador' }, { v: 'nota', label: 'Cante a nota' }, { v: 'harmonia', label: 'Cante a harmonia' }], mode, setMode, { label: 'Modo' }),
    h('section.card.col', h('div.row.between', big, h('span.small.muted', 'você')), sub, h('div.stage', trace), h('div.stage', meter), bar, panel, out),
    gate,
    h('p.small.muted', 'A faixa verde vale ±10 cents. Abaixo de 15 cents o ouvido já aceita como afinado.'));
  return () => { stopDrone(); off.forEach((f) => f()); wake.off(); };
}
