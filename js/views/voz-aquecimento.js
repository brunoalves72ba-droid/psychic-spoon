// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Aquecimento: sete exercícios que sobem de meio em meio tom dentro da extensão medida.
import { h, top, seg, slider, loop, wake, toast } from '../core/ui.js';
import { keyboard, pitchTrace, pitchToMidi, foldToTarget } from '../core/widgets.js';
import { kv, roteiro, prefs } from '../core/store.js';
import { pianoNote, pianoChord, choirNote, Sequencer, unlock } from '../audio/engine.js';
import { micGate, onPitch } from '../audio/mic.js';
import { noteName, VOICE_COLORS } from '../music/theory.js';

export const WARMUPS = [
  { id: 'labios', name: 'Vibração de lábios', syl: '“brrr”', pat: [0, 2, 4, 5, 7, 5, 4, 2, 0], d: 0.5, how: 'Lábios soltos vibrando, bochechas relaxadas. O ar faz o trabalho: se os lábios param, falta fluxo de ar.' },
  { id: 'boca', name: 'Boca fechada', syl: '“mmm”', pat: [0, 2, 4, 2, 0], d: 1, how: 'Lábios juntos, dentes afastados. Procure a vibração nos lábios e no nariz, com pouco volume.' },
  { id: 'sirene', name: 'Sirene', syl: '“uuu”', glide: true, pat: [0, 12, 0], d: 3, how: 'Deslize do grave ao agudo e volte, como uma sirene, sem parar em nota nenhuma. Leve, sem empurrar.' },
  { id: 'vogais', name: 'Arpejo de vogais', syl: '“a-e-i-o-u-o-a”', pat: [0, 4, 7, 12, 7, 4, 0], d: 0.75, how: 'Uma vogal por nota. Mantenha a mesma sensação de espaço na boca em todas elas.' },
  { id: 'nei', name: 'Nei-nei', syl: '“nei”', pat: [0, 4, 7, 12, 12, 12, 12, 7, 4, 0], d: 0.5, how: 'Som frontal, quase de criança implicante. Ajuda a passar pela região da passagem sem pesar.' },
  { id: 'staccato', name: 'Staccato', syl: '“ha”', pat: [0, 4, 7, 12, 7, 4, 0], d: 0.5, short: true, how: 'Notas curtas e leves, cada uma com um pequeno impulso do abdômen. Nada de golpe na garganta.' },
  { id: 'oitava', name: 'Oitava', syl: '“ô”', pat: [0, 12, 0], d: 1.5, how: 'Salte uma oitava e volte. Pense a nota aguda antes de cantar e chegue nela por cima.' },
];
const PRESETS = { grave: [43, 64], media: [48, 69], aguda: [55, 77] };

/** Monta os passos do exercício para todos os tons possíveis dentro da extensão. */
export function buildWarmup(ex, lo, hi) {
  const span = Math.max(...ex.pat); let first = lo + 2, last = hi - 1 - span;
  if (last < first) { first = Math.max(lo, Math.round((lo + hi - span) / 2)); last = first; }
  const steps = []; let k = 0;
  for (let root = first; root <= last; root++, k++) {
    steps.push({ kind: 'cue', root, d: 1, key: k });
    if (ex.glide) steps.push({ kind: 'glide', root, m: root, d: ex.d * 2, key: k });
    else ex.pat.forEach((iv) => steps.push({ kind: 'note', root, m: root + iv, d: ex.d, key: k }));
    steps.push({ kind: 'rest', root, d: 1, key: k });
  }
  return { steps, keys: k };
}

export default async function aquecimento(el) {
  const voice = await kv.get('voice', null);
  let preset = 'media', range = voice ? [voice.lo, voice.hi] : PRESETS[preset], ex = WARMUPS[0], tempo = 84, seq = null, plan = null, off = null;
  const kbBox = h('div'), how = h('p.dim'), big = h('div.big', '—'), sub = h('p.small.muted'), btn = h('button.btn.primary.block', 'Começar');
  const trace = pitchTrace({ height: 150, span: 16 }), traceBox = h('div.stage.hide', trace);
  let kb = null, curM = null;
  const setup = () => { stop(); plan = buildWarmup(ex, range[0], range[1]); kb = keyboard({ lo: range[0] - 1, hi: range[1] + 1 }); kbBox.replaceChildren(kb); how.textContent = `${ex.syl}: ${ex.how}`; sub.textContent = `${plan.keys} ${plan.keys === 1 ? 'tom' : 'tons'}, de ${noteName(plan.steps[0].root)} para cima, de meio em meio tom.`; big.textContent = ex.name; };
  function stop(finished) { if (seq) seq.stop(); seq = null; btn.textContent = 'Começar'; wake.off(); curM = null; trace.setTarget(null); if (kb) kb.show([]); if (finished) { roteiro.mark('aquecer'); toast('Aquecimento registrado no roteiro de hoje.'); } }
  const start = () => {
    seq = new Sequencer({ steps: plan.steps, tempo,
      play: (st, i, t, d) => {
        if (st.kind === 'cue') pianoChord([st.root, st.root + 4, st.root + 7], t, d * 0.9, { gain: 0.16 });
        else if (st.kind === 'note') pianoNote(st.m, t, ex.short ? d * 0.35 : d * 0.95, { gain: 0.28 });
        else if (st.kind === 'glide') { const n = choirNote(st.root, t, d, { voice: 3, vowel: 'u', gain: 0.14, vib: 0 }); n.setMidi(st.root + 12, t + 0.2, d * 0.14); n.setMidi(st.root, t + d * 0.52, d * 0.14); pianoNote(st.root, t, 0.8, { gain: 0.2 }); }
      },
      onStep: (i) => { const st = plan.steps[i]; big.textContent = st.kind === 'cue' ? `Tom de ${noteName(st.root)}` : st.kind === 'rest' ? 'Respire' : st.kind === 'glide' ? 'Sirene' : noteName(st.m); sub.textContent = `Tom ${st.key + 1} de ${plan.keys}`; curM = st.kind === 'note' ? st.m : null; trace.setTarget(curM, VOICE_COLORS[4]); kb.show(st.kind === 'note' ? [{ m: st.m, color: VOICE_COLORS[4] }] : st.kind === 'cue' ? [st.root, st.root + 4, st.root + 7].map((m) => ({ m, color: '#8fa1ad' })) : st.kind === 'glide' ? [{ m: st.root, color: VOICE_COLORS[4] }, { m: st.root + 12, color: VOICE_COLORS[4] }] : []); },
      onEnd: () => stop(true) });
    seq.start(); btn.textContent = 'Parar'; wake.on();
  };
  btn.onclick = async () => { await unlock(); seq ? stop(false) : start(); };
  const gate = micGate(() => { traceBox.classList.remove('hide'); off = onPitch((p) => { const m = pitchToMidi(p, prefs.get('a4') || 440); trace.push(m == null ? null : curM != null ? foldToTarget(m, curM) : m); }); }, { playsToo: true, label: 'Ver minha voz no traço (opcional)' });
  loop(traceBox, () => trace.draw());
  setup();
  el.append(
    top('Aquecimento', '#/voz'),
    voice ? h('p.small.muted', `Usando a sua extensão medida: ${noteName(voice.lo)} a ${noteName(voice.hi)}.`) : h('div.col', h('p.small.muted', 'Você ainda não mediu a extensão. Escolha uma faixa aproximada, ou faça o Retrato vocal.'), seg([{ v: 'grave', label: 'Voz grave' }, { v: 'media', label: 'Voz média' }, { v: 'aguda', label: 'Voz aguda' }], preset, (v) => { preset = v; range = PRESETS[v]; setup(); }, { label: 'Faixa' })),
    seg(WARMUPS.map((w) => ({ v: w.id, label: w.name })), ex.id, (v) => { ex = WARMUPS.find((w) => w.id === v); setup(); }, { label: 'Exercício' }),
    h('section.card.col', big, sub, how, kbBox, btn),
    slider('Andamento', { min: 60, max: 120, value: tempo, unit: 'bpm' }, (v) => { tempo = v; if (seq) seq.tempo = v; }),
    traceBox, gate,
    h('p.small.muted', 'Aqueça sempre com volume baixo. Se a garganta apertar ou doer, pare: dor é sinal de parada.'),
  );
  return () => { stop(false); off && off(); };
}
