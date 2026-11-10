// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Metrônomo com vibração: o ritmo vem do relógio do AudioContext; a tela e a vibração seguem o som.
import { h, top, slider, seg, toggle, canvas, loop, vib, wake } from '../core/ui.js';
import { kv } from '../core/store.js';
import { Metronome, unlock, getCtx } from '../audio/engine.js';

export default async function metronomo(el) {
  const S = { tempo: 80, beats: 4, sub: 1, vibra: true, ...(await kv.get('metronomo', {})) };
  let met = null, taps = [];
  const big = h('div.big.center', String(S.tempo)), name = h('p.center.dim'), btn = h('button.btn.primary.block', 'Começar'), cv = canvas(90);
  const NAMES = [[40, 'Largo'], [60, 'Adágio'], [76, 'Andante'], [108, 'Moderato'], [120, 'Allegretto'], [156, 'Allegro'], [200, 'Presto']];
  const save = () => kv.set('metronomo', S);
  const show = () => { big.textContent = String(S.tempo); name.textContent = `${(NAMES.find(([t]) => S.tempo <= t) || NAMES[NAMES.length - 1])[1]} · ${S.beats} tempos${S.sub > 1 ? ` · subdivisão em ${S.sub}` : ''}`; if (met) { met.tempo = S.tempo; } };
  const stop = () => { if (met) met.stop(); met = null; btn.textContent = 'Começar'; wake.off(); };
  const start = async () => { await unlock(); met = new Metronome({ tempo: S.tempo, beats: S.beats, sub: S.sub, onBeat: (n, t, strong, onbeat) => { if (S.vibra && onbeat) setTimeout(() => met && vib(strong ? 45 : 18), Math.max(0, (t - getCtx().currentTime) * 1000)); } }); met.start(); btn.textContent = 'Parar'; wake.on(); };
  btn.onclick = () => (met ? stop() : start());
  const restart = () => { if (met) { stop(); start(); } };
  loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); const c = met ? getCtx().currentTime : 0; let cur = -1, frac = 0;
    if (met) for (let k = met.times.length - 1; k >= 0; k--) { const e = met.times[k]; if (e.onbeat && c >= e.t) { cur = Math.floor((e.n / S.sub) % S.beats); frac = (c - e.t) / (60 / S.tempo); break; } }
    const gap = Math.min(64, (w - 20) / S.beats); const x0 = (w - gap * S.beats) / 2 + gap / 2;
    for (let b = 0; b < S.beats; b++) { const on = b === cur, r = on ? 18 - 8 * Math.min(1, frac) + 6 : 10; g.fillStyle = on ? (b === 0 ? '#ffd166' : '#5cc8e8') : 'rgba(244,236,220,.18)'; g.beginPath(); g.arc(x0 + b * gap, hh / 2, r, 0, 7); g.fill(); } });
  show();
  el.append(top('Metrônomo', '#/harmonia'),
    h('section.card.col', big, h('p.center.small.muted', 'batidas por minuto'), name, h('div.stage', { style: { background: 'transparent', border: 0 } }, cv), btn),
    slider('Andamento', { min: 30, max: 220, value: S.tempo, unit: 'bpm' }, (v) => { S.tempo = v; show(); save(); }),
    h('div.row', h('button.btn.grow', { onclick: () => { S.tempo = Math.max(30, S.tempo - 1); show(); save(); } }, '− 1'), h('button.btn.grow', { onclick: () => { const t = performance.now(); taps = taps.filter((x) => t - x < 2500); taps.push(t); if (taps.length >= 3) { const d = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); S.tempo = Math.round(Math.min(220, Math.max(30, 60000 / d))); show(); save(); } } }, 'Toque o tempo'), h('button.btn.grow', { onclick: () => { S.tempo = Math.min(220, S.tempo + 1); show(); save(); } }, '+ 1')),
    h('div.eyebrow', 'Compasso'), seg([2, 3, 4, 6].map((v) => ({ v, label: `${v} tempos` })), S.beats, (v) => { S.beats = v; show(); save(); restart(); }, { label: 'Tempos por compasso' }),
    h('div.eyebrow', 'Subdivisão'), seg([{ v: 1, label: 'Sem' }, { v: 2, label: 'Colcheias' }, { v: 3, label: 'Tercinas' }, { v: 4, label: 'Semicolcheias' }], S.sub, (v) => { S.sub = v; show(); save(); restart(); }, { label: 'Subdivisão' }),
    toggle('Vibrar a cada tempo' + ('vibrate' in navigator ? '' : ' (este aparelho não vibra pelo navegador)'), S.vibra, (v) => { S.vibra = v; save(); }));
  return () => stop();
}
