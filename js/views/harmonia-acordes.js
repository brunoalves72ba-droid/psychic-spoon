// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Estúdio de acordes: fundamental, tipo, abertura, teclado colorido por voz, silenciar, sustentar e cantar a nota que falta.
import { h, top, seg, loop, toggle } from '../core/ui.js';
import { keyboard, voiceChips, isMuted, centsMeter, pitchToMidi, foldToTarget } from '../core/widgets.js';
import { prefs } from '../core/store.js';
import { choirNote, pianoNote, unlock, now } from '../audio/engine.js';
import { micGate, onPitch } from '../audio/mic.js';
import { CHORD_TYPES, ROOT_NAMES, voicings, parseChord, degreeOf, degName, prettyChord, VOICE_COLORS, voiceIndex, noteName } from '../music/theory.js';

export default async function acordes(el) {
  let root = 'C', type = 'maj9', kind = 'seis', sustain = false, sounding = [], notes = [];
  const state = { mute: [], solo: null };
  const kb = keyboard({ lo: 36, hi: 84, height: 96 });
  const name = h('div.big'), hint = h('p.dim'), list = h('div.legend'), chipsBox = h('div'), miss = h('p.small', { 'aria-live': 'polite' });
  const meter = centsMeter(); const meterBox = h('div.stage.hide', meter);
  const sym = () => root + type;
  const stop = () => { sounding.forEach((n) => n && n.stop()); sounding = []; };
  const play = () => {
    stop(); const t = now();
    sounding = notes.map((m, i) => (isMuted(state, i) ? null : choirNote(m, t, sustain ? Infinity : 2.6, { voice: voiceIndex(i, notes.length), gain: 0.13, vowel: i === 0 ? 'o' : 'u', pan: (i / Math.max(1, notes.length - 1) - 0.5) * 0.8 })));
  };
  const target = () => { const i = notes.findIndex((_, k) => isMuted(state, k)); return i < 0 ? null : { i, m: notes[i] }; };
  const paint = () => {
    const ch = parseChord(sym());
    kb.show(notes.map((m, i) => ({ m, color: VOICE_COLORS[voiceIndex(i, notes.length)], target: isMuted(state, i) })));
    list.replaceChildren(...notes.map((m, i) => h('span', { style: { opacity: isMuted(state, i) ? 0.45 : 1 } }, h('i', { css: { '--c': VOICE_COLORS[voiceIndex(i, notes.length)] } }), `${noteName(m)} · ${degName(degreeOf(ch, m))}`)));
    const tg = target();
    miss.textContent = tg ? `Falta a ${degName(degreeOf(ch, tg.m))} (${noteName(tg.m)}). Sustente o acorde e cante essa nota, em qualquer oitava.` : 'Toque em uma voz para silenciá-la e cantar no lugar dela.';
  };
  const rebuild = (sound) => {
    notes = voicings(sym(), kind); state.mute = new Array(notes.length).fill(false); state.solo = null;
    name.textContent = prettyChord(sym()); hint.textContent = CHORD_TYPES.find((t) => t.id === type).hint + ` · ${notes.length} vozes`;
    chipsBox.replaceChildren(voiceChips(notes.length, state, () => { paint(); if (sounding.length) play(); }, { solo: false, names: notes.length === 6 ? undefined : notes.map((_, k) => `Voz ${k + 1}`) }));
    paint(); if (sound) play();
  };
  const typeSel = h('select', { 'aria-label': 'Tipo de acorde', onchange: async () => { await unlock(); type = typeSel.value; rebuild(true); } }, CHORD_TYPES.map((t) => h('option', { value: t.id, selected: t.id === type }, `${t.name} — ${t.hint}`)));
  const quick = seg(['', 'm', '7', 'maj7', 'm7', 'm7b5', 'dim7', '9', 'm9', 'maj9', '13', 'maj13', 'm11', '7alt'].map((id) => ({ v: id, label: CHORD_TYPES.find((t) => t.id === id).name })), type, async (v) => { await unlock(); type = v; typeSel.value = v; rebuild(true); }, { label: 'Tipos mais usados' });
  typeSel.addEventListener('change', () => quick.set(type));
  const off = [];
  const gate = micGate(() => {
    meterBox.classList.remove('hide');
    off.push(onPitch((p) => { const tg = target(); const m = pitchToMidi(p, prefs.get('a4') || 440); if (!tg || m == null) { meter.set(null); return; } meter.set((foldToTarget(m, tg.m) - tg.m) * 100, noteName(tg.m)); }));
  }, { playsToo: true, label: 'Conferir com o microfone' });
  loop(meterBox, () => meter.draw());
  rebuild(false);
  el.append(
    top('Estúdio de acordes', '#/harmonia'),
    h('section.card.col', h('div.row.between', h('div', name, hint), h('button.btn.primary.round', { 'aria-label': 'Tocar o acorde', onclick: async () => { await unlock(); play(); } }, '▶')), kb, list),
    h('section.col',
      h('div.eyebrow', 'Fundamental'), seg(ROOT_NAMES.map((r) => ({ v: r, label: prettyChord(r) })), root, async (v) => { await unlock(); root = v; rebuild(true); }, { label: 'Fundamental' }),
      h('div.eyebrow', 'Tipo'), quick, typeSel,
      h('div.eyebrow', 'Abertura'), seg([{ v: 'fechada', label: 'Fechada' }, { v: 'drop2', label: 'Drop 2' }, { v: 'aberta', label: 'Aberta' }, { v: 'seis', label: 'Seis vozes' }], kind, async (v) => { await unlock(); kind = v; rebuild(true); }, { label: 'Abertura' }),
    ),
    h('section.card.col', h('h3', 'Cante a nota que falta'), chipsBox, miss,
      toggle('Sustentar o acorde', sustain, async (v) => { await unlock(); sustain = v; if (v) play(); else stop(); }),
      h('button.btn.small', { onclick: async () => { await unlock(); const tg = target(); if (tg) pianoNote(tg.m, now(), 1.4); } }, 'Ouvir a nota que falta'),
      meterBox, gate),
  );
  return () => { stop(); off.forEach((f) => f()); };
}
