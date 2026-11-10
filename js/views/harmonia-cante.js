// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Cante a sua voz: uma voz fica em silêncio, o microfone desenha a sua altura sobre a linha dela e pontua cada nota em cents.
import { h, top, seg, slider, toggle, loop, wake, fmt } from '../core/ui.js';
import { voiceMap, pitchToMidi, foldToTarget } from '../core/widgets.js';
import { prefs, log, kv } from '../core/store.js';
import { choirChord, pianoNote, click, Sequencer, unlock } from '../audio/engine.js';
import { micGate, onPitch } from '../audio/mic.js';
import { ARRANGEMENTS, getArrangement } from '../music/arrangements.js';
import { VOICE_COLORS, VOICE_NAMES, noteName, prettyChord } from '../music/theory.js';

/** Pontuação de uma nota a partir das leituras (em semitons de desvio já dobrados para a oitava do alvo). */
export function scoreNote(devs) {
  if (devs.length < 3) return null;
  const s = [...devs].sort((a, b) => a - b); const med = s[Math.floor(s.length / 2)] * 100;
  return { cents: med, abs: Math.abs(med), n: devs.length };
}
export const centsToPoints = (abs) => Math.max(0, Math.min(100, Math.round(100 - Math.max(0, abs - 8) * 2.2)));

export default async function cante(el, [idArg]) {
  const saved = await kv.get('cante', {});
  let arr = getArrangement(idArg || saved.arr), voice = saved.voice ?? 3, speed = 0.8, guide = true, seq = null, map = null, trace = [], per = [], off = null, micOn = false;
  const mapBox = h('div.stage'), now_ = h('div.big', '—'), sub = h('p.dim', 'Escolha o arranjo e a voz. Ela fica em silêncio para você cantar.'), result = h('div');
  const btn = h('button.btn.primary.block', { disabled: true }, 'Começar');
  const state = () => ({ mute: arr.steps[0].n.map((_, v) => v === voice), solo: null });
  const setup = () => { map = voiceMap(arr.steps, { height: 190 }); mapBox.replaceChildren(map); trace = []; result.replaceChildren(); kv.set('cante', { arr: arr.id, voice }); now_.textContent = '—'; };
  const stop = () => { if (seq) seq.stop(); seq = null; btn.textContent = 'Começar'; wake.off(); };
  const finish = async () => {
    stop();
    const scored = per.map((d, i) => ({ i, r: scoreNote(d) }));
    const ok = scored.filter((x) => x.r);
    if (!ok.length) { result.replaceChildren(h('div.card', h('h3', 'Não ouvi a sua voz'), h('p.small.muted', 'Confira se o microfone está liberado e cante mais perto dele. Com fones, o som do app não atrapalha.'))); return; }
    const avg = ok.reduce((a, x) => a + x.r.abs, 0) / ok.length, pts = Math.round(ok.reduce((a, x) => a + centsToPoints(x.r.abs), 0) / per.length);
    await log('sing', { source: 'cante', arr: arr.id, voice, cents: Math.round(avg), points: pts, sung: ok.length, total: per.length });
    result.replaceChildren(h('div.card.col',
      h('div.stats', h('div.stat', h('b', `${pts}`), h('span', 'pontos (0 a 100)')), h('div.stat', h('b', `${fmt(avg)}`), h('span', 'cents de desvio médio')), h('div.stat', h('b', `${ok.length}/${per.length}`), h('span', 'notas cantadas'))),
      h('div.list', scored.map(({ i, r }) => h('div.row.between.small', h('span', `${i + 1}. ${noteName(arr.steps[i].n[voice])} em ${prettyChord(arr.steps[i].c)}`), h('span.num', { style: { color: !r ? 'var(--ink3)' : r.abs <= 15 ? 'var(--ok)' : r.abs <= 35 ? 'var(--warn)' : 'var(--bad)' } }, r ? `${r.cents > 0 ? '+' : ''}${Math.round(r.cents)} cents` : 'sem leitura')))),
      h('p.small.muted', 'Positivo é agudo demais; negativo é grave demais. Até 15 cents, o ouvido aceita como afinado.')));
  };
  const start = () => {
    trace = []; per = arr.steps.map(() => []); result.replaceChildren();
    const st0 = state(); const count = [{ count: true, d: 1 }, { count: true, d: 1 }, { count: true, d: 1 }, { count: true, d: 1 }];
    const steps = [...count, ...arr.steps];
    seq = new Sequencer({ steps, tempo: arr.tempo * speed,
      play: (st, i, t, d) => {
        if (st.count) { click(t, i === 0); if (i === 0) pianoNote(arr.steps[0].n[voice], t, 1.6, { gain: 0.3 }); return; }
        choirChord(st.n, t, d * 0.97, { gain: 0.12, mute: st0.mute });
        if (guide) pianoNote(st.n[voice], t, Math.min(d, 1.2), { gain: 0.1 });
      },
      onStep: (i) => { if (i < 4) { now_.textContent = String(4 - i); sub.textContent = 'Ouça a sua primeira nota…'; } else { const st = arr.steps[i - 4]; now_.textContent = noteName(st.n[voice]); sub.textContent = `${prettyChord(st.c)} · você é ${VOICE_NAMES[voice].toLowerCase()}`; } },
      onEnd: finish });
    seq.start(); btn.textContent = 'Parar'; wake.on();
  };
  btn.onclick = async () => { await unlock(); seq ? stop() : start(); };
  const gate = micGate(() => {
    micOn = true; btn.disabled = false;
    off = onPitch((p) => {
      if (!seq) return; const pos = seq.position(); if (!pos || pos.i < 4) return;
      const i = pos.i - 4, tgt = arr.steps[i].n[voice], m = pitchToMidi(p, prefs.get('a4') || 440);
      const b = map.beatAt({ i, frac: pos.frac });
      if (m == null) { trace.push({ b, m: null }); return; }
      const f = foldToTarget(m, tgt); trace.push({ b, m: f });
      if (pos.frac > 0.22 && Math.abs(f - tgt) < 3) per[i].push(f - tgt);
    });
  }, { playsToo: true, label: 'Ligar microfone' });
  loop(mapBox, () => { if (!map) return; const pos = seq ? seq.position() : null; const st = { mute: arr.steps[0].n.map(() => false), solo: null }; map.draw(pos && pos.i >= 4 ? { i: pos.i - 4, frac: pos.frac } : null, st, trace); });
  setup();
  el.append(
    top('Cante a sua voz', '#/harmonia'),
    h('label.field', 'Arranjo', h('select', { onchange: (e) => { stop(); arr = getArrangement(e.target.value); setup(); } }, ARRANGEMENTS.map((a) => h('option', { value: a.id, selected: a.id === arr.id }, a.title)))),
    h('div.eyebrow', 'Sua voz'),
    (() => { const sg = h('div.seg', { role: 'group', 'aria-label': 'Sua voz' }); const paint = () => [...sg.children].forEach((b, k) => b.setAttribute('aria-pressed', String(5 - k === voice))); for (let v = 5; v >= 0; v--) sg.append(h('button.chip.v', { css: { '--c': VOICE_COLORS[v] }, onclick: () => { stop(); voice = v; paint(); setup(); } }, VOICE_NAMES[v])); paint(); return sg; })(),
    h('section.card.col', h('div.row.between', now_, h('span.legend', h('span', h('i', { css: { '--c': '#fff' } }), 'sua voz'))), sub, mapBox),
    slider('Andamento', { min: 0.5, max: 1.2, step: 0.05, value: speed, fmtv: (v) => `${Math.round(v * 100)}%` }, (v) => { speed = v; }),
    toggle('Piano dobrando a minha nota', guide, (v) => { guide = v; }),
    gate, btn, result,
  );
  void seg; void micOn;
  return () => { stop(); off && off(); };
}
