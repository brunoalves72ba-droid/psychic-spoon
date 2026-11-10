// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Teclado: toque na tela (multitoque) ou ligue um teclado MIDI. O app mostra o acorde que você formou.
import { h, top, seg, toggle } from '../core/ui.js';
import { keyboard } from '../core/widgets.js';
import { pianoNote, choirNote, unlock, now } from '../audio/engine.js';
import { identifyChord, prettyChord, noteName, VOICE_COLORS } from '../music/theory.js';

export default async function teclado(el) {
  let timbre = 'piano', oct = 48, hold = false, access = null; const down = new Map(), held = new Set();
  const chord = h('div.big', '—'), notes = h('p.dim', 'Toque duas ou mais teclas ao mesmo tempo.'), midiMsg = h('p.small'), kbBox = h('div');
  let kb = null;
  const paint = () => { const ms = [...new Set([...down.keys(), ...held])].sort((a, b) => a - b); kb.show(ms.map((m, i) => ({ m, color: VOICE_COLORS[Math.min(5, i)] }))); const c = identifyChord(ms); chord.textContent = c ? prettyChord(c) : ms.length ? '…' : '—'; notes.textContent = ms.length ? ms.map(noteName).join(' · ') + (c || ms.length < 3 ? '' : ' (não reconheci este acorde)') : 'Toque duas ou mais teclas ao mesmo tempo.'; };
  const on = async (m, vel = 0.8) => { await unlock(); if (down.has(m)) return; if (held.has(m)) { held.delete(m); } const n = timbre === 'piano' ? pianoNote(m, now(), 4, { gain: 0.34 * vel }) : choirNote(m, now(), Infinity, { gain: 0.16 * vel, voice: 3, vowel: 'u' }); down.set(m, n); paint(); };
  const off = (m) => { const n = down.get(m); if (!n) return; if (hold) { held.add(m); down.delete(m); n._held = true; heldNotes.set(m, n); } else { n.stop(); down.delete(m); } paint(); };
  const heldNotes = new Map();
  const release = () => { heldNotes.forEach((n) => n.stop()); heldNotes.clear(); held.clear(); paint(); };
  const build = () => { kb = keyboard({ lo: oct, hi: oct + 24, height: 150, onDown: (m) => on(m), onUp: off }); kbBox.replaceChildren(kb); paint(); };
  const onMidi = (e) => { const [st, d1, d2] = e.data; const cmd = st & 0xf0; if (cmd === 0x90 && d2 > 0) on(d1, d2 / 127); else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) off(d1); };
  const connect = async () => {
    if (!('requestMIDIAccess' in navigator)) { midiMsg.textContent = 'Este navegador não tem Web MIDI (é o caso do Safari no iPhone). O teclado na tela funciona normalmente.'; return; }
    try { access = await navigator.requestMIDIAccess(); const hook = () => { const ins = [...access.inputs.values()]; ins.forEach((i) => { i.onmidimessage = onMidi; }); midiMsg.textContent = ins.length ? `Teclado MIDI ligado: ${ins.map((i) => i.name).join(', ')}.` : 'Nenhum teclado MIDI encontrado. Conecte por cabo USB (com adaptador OTG) ou Bluetooth e toque de novo.'; }; access.onstatechange = hook; hook(); }
    catch { midiMsg.textContent = 'O acesso ao MIDI foi negado. Libere a permissão nas configurações do site.'; }
  };
  build();
  el.append(top('Teclado', '#/harmonia'), h('section.card.col', h('div.row.between', chord, h('span.small.muted', 'acorde')), notes), kbBox,
    h('div.row.wrap', seg([{ v: 'piano', label: 'Piano' }, { v: 'coro', label: 'Coro' }], timbre, (v) => { timbre = v; down.forEach((n) => n.stop()); down.clear(); release(); }, { label: 'Timbre' }), h('button.btn.small', { 'aria-label': 'Oitava abaixo', onclick: () => { oct = Math.max(24, oct - 12); build(); } }, '◀ 8ª'), h('button.btn.small', { 'aria-label': 'Oitava acima', onclick: () => { oct = Math.min(72, oct + 12); build(); } }, '8ª ▶')),
    toggle('Segurar as notas (para montar acordes com um dedo)', hold, (v) => { hold = v; if (!v) release(); }),
    h('section.card.col', h('h3', 'Teclado MIDI'), h('p.small.dim', 'Com um teclado MIDI ligado ao celular, as teclas tocam aqui e o app mostra a cifra do acorde.'), h('button.btn', { onclick: connect }, 'Ligar teclado MIDI'), midiMsg));
  return () => { down.forEach((n) => n.stop()); heldNotes.forEach((n) => n.stop()); if (access) [...access.inputs.values()].forEach((i) => { i.onmidimessage = null; }); };
}
