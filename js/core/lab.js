// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Laboratórios das aulas: experimentos interativos com som e animação, e o exercício de cantar junto.

import { h, s, canvas, loop, seg, clamp, reducedMotion, wake, vib } from './ui.js';
import { keyboard, kbdRange, voiceChips, voiceMap, isMuted, foldToTarget, pitchToMidi } from './widgets.js';
import { prefs } from './store.js';
import { choirNote, choirChord, pianoNote, pianoChord, vocalPerc, Sequencer, unlock, now, stopAll, getCtx } from '../audio/engine.js';
import { micGate, onPitch, micSupported } from '../audio/mic.js';
import { VOICE_COLORS, voiceIndex, noteName, pcName, parseChord, degreeOf, degShort, prettyChord, voicings, field, FN_NAME, FN_COLOR, rootLabel, MODES, pc, midiToFreq, voiceChord } from '../music/theory.js';

const colorsFor = (notes) => notes.map((m, i) => ({ m, color: VOICE_COLORS[voiceIndex(i, notes.length)] }));
const playBtn = (label, fn) => h('button.btn.primary', { type: 'button', onclick: async () => { await unlock(); fn(); } }, label);

// ---------- 1. ondas e razões de frequência ----------
const INTERVALS = [
  ['Uníssono', 0, 1, 1, 'consonância perfeita'], ['2ª menor', 1, 16, 15, 'dissonância forte'], ['2ª maior', 2, 9, 8, 'dissonância suave'],
  ['3ª menor', 3, 6, 5, 'consonância imperfeita'], ['3ª maior', 4, 5, 4, 'consonância imperfeita'], ['4ª justa', 5, 4, 3, 'consonância perfeita'],
  ['Trítono', 6, 45, 32, 'dissonância'], ['5ª justa', 7, 3, 2, 'consonância perfeita'], ['6ª menor', 8, 8, 5, 'consonância imperfeita'],
  ['6ª maior', 9, 5, 3, 'consonância imperfeita'], ['7ª menor', 10, 9, 5, 'dissonância suave'], ['7ª maior', 11, 15, 8, 'dissonância forte'], ['8ª', 12, 2, 1, 'consonância perfeita'],
];
export function waveLab() {
  let cur = INTERVALS[7], until = 0, notes = [];
  const cv = canvas(210);
  const info = h('div.center');
  const show = () => { info.replaceChildren(h('div.big', `${cur[2]}:${cur[3]}`), h('p.dim', `${cur[0]} · ${cur[1]} ${cur[1] === 1 ? 'semitom' : 'semitons'} · ${cur[4]}`), h('p.small.muted', cur[3] <= 5 ? `A cada ${cur[3]} ${cur[3] === 1 ? 'ciclo' : 'ciclos'} da nota grave, as ondas se reencontram. O ouvido percebe esse padrão curto como repouso.` : `As ondas só se reencontram depois de ${cur[3]} ciclos da nota grave. O padrão longo soa áspero: é a dissonância.`)); };
  const play = () => {
    notes.forEach((n) => n.stop()); const t = now();
    notes = [choirNote(57, t, 2.8, { voice: 1, vowel: 'a', gain: 0.16, vib: 0 }), choirNote(57 + cur[1], t + 0.5, 2.3, { voice: 4, vowel: 'a', gain: 0.16, vib: 0 })];
    until = performance.now() + 2800;
  };
  const sel = seg(INTERVALS.map((i) => ({ v: i[1], label: i[0] })), 7, (v) => { cur = INTERVALS.find((i) => i[1] === v); show(); play(); }, { label: 'Intervalo' });
  show();
  const still = reducedMotion(); let ph = 0;
  loop(cv, () => {
    const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh);
    const sounding = performance.now() < until; if (sounding && !still) ph += 0.035;
    const ratio = cur[2] / cur[3], cyc = 4; const rows = [[VOICE_COLORS[1], (x) => Math.sin(x)], [VOICE_COLORS[4], (x) => Math.sin(x * ratio)], ['#f4ecdc', (x) => (Math.sin(x) + Math.sin(x * ratio)) / 2]];
    rows.forEach(([col, f], r) => {
      const y0 = (hh / 3) * (r + 0.5), amp = hh / 3 * 0.38;
      g.strokeStyle = col; g.lineWidth = r === 2 ? 2.5 : 2; g.globalAlpha = sounding ? 1 : 0.55; g.beginPath();
      for (let x = 0; x <= w; x += 2) { const y = y0 - f((x / w) * cyc * 2 * Math.PI + ph * 2 * Math.PI) * amp; x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    });
    g.globalAlpha = 1; g.fillStyle = 'rgba(244,236,220,.5)'; g.font = '11px Figtree, sans-serif';
    g.fillText('nota grave', 6, 12); g.fillText('nota aguda', 6, hh / 3 + 12); g.fillText('soma (o que chega ao ouvido)', 6, (hh / 3) * 2 + 12);
  });
  return h('div.col', sel, h('div.stage', cv), info, playBtn('Ouvir de novo', play));
}

// ---------- 2. explorador de acordes ----------
/** options: [{label, sym?, kind?, notes?, cap}] */
export function chordLab({ options, arp = true }) {
  let cur = options[0];
  const notesOf = (o) => o.notes || voicings(o.sym, o.kind || 'fechada');
  const allNotes = options.flatMap(notesOf);
  const kb = keyboard(kbdRange(allNotes, 1));
  const name = h('div.big'), cap = h('p.dim'), chips = h('div.legend');
  const show = () => {
    const n = notesOf(cur); kb.show(colorsFor(n));
    name.textContent = cur.title || (cur.sym ? prettyChord(cur.sym) : cur.label); cap.textContent = cur.cap || '';
    const ch = cur.sym ? parseChord(cur.sym) : null;
    chips.replaceChildren(...n.map((m, i) => h('span', h('i', { css: { '--c': VOICE_COLORS[voiceIndex(i, n.length)] } }), `${pcName(m)}${ch && degreeOf(ch, m) ? ' · ' + degShort(degreeOf(ch, m)) : ''}`)));
  };
  const play = () => { stopAll(); const n = notesOf(cur), t = now(); if (arp) n.forEach((m, i) => pianoNote(m, t + i * 0.22, 0.5, { gain: 0.22 })); choirChord(n, t + (arp ? n.length * 0.22 + 0.1 : 0), 2.2, { gain: 0.13 }); };
  const sel = seg(options.map((o, i) => ({ v: i, label: o.label })), 0, (i) => { cur = options[i]; show(); play(); }, { wrap: options.length <= 6, label: 'Acorde' });
  show();
  return h('div.col', sel, h('div.center', name), kb, chips, cap, playBtn('Ouvir', play));
}

// ---------- 7. tensões sobre um acorde-base ----------
export function tensionLab({ sets }) {
  let set = sets[0], on = new Set(), sus = [];
  const kb = keyboard({ lo: 48, hi: 84 });
  const name = h('div.big'), cap = h('p.dim'), tg = h('div.seg.wrap');
  const base = () => voicings(set.base, 'aberta').slice(0, 4);
  const notes = () => [...base(), ...set.toggles.filter((t) => on.has(t.label)).map((t) => 60 + parseChord(set.base).root + t.iv)].sort((a, b) => a - b);
  const play = () => { sus.forEach((n) => n && n.stop()); sus = choirChord(notes(), now(), 2.6, { gain: 0.12 }); };
  const show = () => {
    const b = base(); const ext = set.toggles.filter((t) => on.has(t.label));
    kb.show([...b.map((m) => ({ m, color: '#8fa1ad' })), ...ext.map((t, i) => ({ m: 60 + parseChord(set.base).root + t.iv, color: VOICE_COLORS[3 + (i % 3)], label: t.label }))]);
    name.textContent = prettyChord(set.base) + (ext.length ? ` + ${ext.map((t) => t.label).join(', ')}` : '');
    const last = ext[ext.length - 1]; cap.textContent = last ? last.cap : set.cap;
  };
  const build = () => { tg.replaceChildren(...set.toggles.map((t) => { const b = h('button.chip', { type: 'button', 'aria-pressed': 'false', onclick: async () => { await unlock(); on.has(t.label) ? on.delete(t.label) : on.add(t.label); b.setAttribute('aria-pressed', String(on.has(t.label))); show(); play(); } }, t.label); return b; })); };
  const sel = seg(sets.map((x, i) => ({ v: i, label: x.label })), 0, (i) => { set = sets[i]; on = new Set(); build(); show(); play(); }, { label: 'Acorde-base' });
  build(); show();
  return h('div.col', sel, h('div.center', name), kb, h('p.small.muted', 'Ligue as tensões e ouça a cor mudar:'), tg, cap, playBtn('Ouvir', play));
}

// ---------- 3. tocador de progressões com mapa das vozes ----------
/** options: [{label, steps, cap, tempo}] */
export function progLab({ options, loopPlay = false }) {
  let cur = options[0], seq = null, map = null;
  const state = { mute: [], solo: null };
  const name = h('div.big', '—'), cap = h('p.dim'), stepCap = h('p.small', { style: { minHeight: '2.6em' } });
  const mapBox = h('div.stage'), kbBox = h('div'), chipsBox = h('div');
  const btn = h('button.btn.primary', { type: 'button' }, 'Tocar');
  let kb = null;
  const stop = () => { if (seq) seq.stop(); seq = null; btn.textContent = 'Tocar'; kb && kb.show([]); };
  const setup = () => {
    stop(); const steps = cur.steps; const nV = Math.max(...steps.map((x) => x.n.length));
    state.mute = new Array(nV).fill(false); state.solo = null;
    map = voiceMap(steps, { height: 140 }); mapBox.replaceChildren(map);
    kb = keyboard(kbdRange(steps.flatMap((x) => x.n), 1)); kbBox.replaceChildren(kb);
    chipsBox.replaceChildren(nV > 1 ? voiceChips(nV, state, () => {}, { names: nV === 4 ? ['Baixo', 'Tenor', 'Contralto', 'Soprano'] : undefined }) : '');
    cap.textContent = cur.cap || ''; name.textContent = '—'; stepCap.textContent = 'Toque em “Tocar” e acompanhe as linhas: cada cor é uma voz.';
  };
  const start = () => {
    const steps = cur.steps;
    seq = new Sequencer({ steps, tempo: cur.tempo || 66, loop: loopPlay,
      play: (st, i, t, d) => { if (st.rest) return; const nV = st.n.length; choirChord(st.n, t, d * 0.96, { gain: nV === 1 ? 0.2 : 0.13, mute: st.n.map((_, v) => isMuted(state, v)) }); },
      onStep: (i) => { const st = steps[i]; name.textContent = st.c ? prettyChord(st.c) : noteName(st.n[st.n.length - 1]); stepCap.textContent = st.t || st.auto || ''; kb.show(st.n.map((m, v) => ({ m, color: VOICE_COLORS[voiceIndex(v, st.n.length)] })).filter((_, v) => !isMuted(state, v))); },
      onEnd: () => stop() });
    seq.start(); btn.textContent = 'Parar';
  };
  btn.onclick = async () => { await unlock(); seq ? stop() : start(); };
  const sel = options.length > 1 ? seg(options.map((o, i) => ({ v: i, label: o.label })), 0, (i) => { cur = options[i]; setup(); start(); }, { label: 'Versão' }) : null;
  setup();
  loop(mapBox, () => { if (map) map.draw(seq ? seq.position() : null, state); });
  return h('div.col', sel, cap, h('div.row.between', name, btn), stepCap, mapBox, kbBox, chipsBox);
}

// ---------- 4/5. campo harmônico com círculo das quintas ----------
export function fieldLab({ minor = false, borrowed = false }) {
  let tonic = 0, isMinor = minor, last = [];
  const circle = s('svg', { viewBox: '-150 -150 300 300', style: { width: '100%', maxWidth: '320px', margin: '0 auto', display: 'block' }, role: 'group', 'aria-label': 'Círculo das quintas' });
  const center = s('text', { x: 0, y: 6, 'text-anchor': 'middle', fill: '#f4ecdc', 'font-size': 22, 'font-family': 'Bricolage Grotesque, sans-serif', 'font-weight': 700 });
  const sub = s('text', { x: 0, y: 28, 'text-anchor': 'middle', fill: '#8fa1ad', 'font-size': 11 });
  const dots = [];
  for (let k = 0; k < 12; k++) {
    const p = (k * 7) % 12, a = (k / 12) * 2 * Math.PI - Math.PI / 2, x = Math.cos(a) * 118, y = Math.sin(a) * 118;
    const g = s('g', { tabindex: 0, role: 'button', 'aria-label': `Tom de ${rootLabel(p, [5, 10, 3, 8, 1].includes(p))}`, style: { cursor: 'pointer' } },
      s('circle', { cx: x, cy: y, r: 24, fill: '#132a3d', stroke: '#3a5a70', 'stroke-width': 1.5 }),
      s('text', { x, y: y + 5, 'text-anchor': 'middle', fill: '#f4ecdc', 'font-size': 14, 'font-weight': 700 }, rootLabel(p, [5, 10, 3, 8, 1].includes(p)).replace('b', '♭').replace('#', '♯')));
    const pick = async () => { await unlock(); tonic = p; build(); play(0); };
    g.addEventListener('click', pick); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    dots[p] = g.firstChild; circle.append(g);
  }
  circle.append(center, sub);
  const degs = h('div.grid2', { style: { gridTemplateColumns: 'repeat(4,1fr)', gap: '6px' } });
  const extra = h('div.seg.wrap'), cap = h('p.dim', { style: { minHeight: '3em' } });
  let chords = [];
  const sound = (sym) => { last.forEach((n) => n && n.stop()); const n = voiceChord(sym, { n: 4, spread: true, lo: 47 }); last = [...pianoChord(n, now(), 1.6, { gain: 0.14 }), ...choirChord(n, now(), 1.8, { gain: 0.1 })]; };
  const paint = (sym, fn) => { const r = parseChord(sym).root; dots.forEach((d, p) => { d.setAttribute('fill', p === pc(tonic) ? '#1a3549' : '#132a3d'); d.setAttribute('stroke', p === r ? FN_COLOR[fn] : p === pc(tonic) ? '#f4ecdc' : '#3a5a70'); d.setAttribute('stroke-width', p === r ? 4 : 1.5); }); };
  const play = (i) => { const c = chords[i]; sound(c.sym); paint(c.sym, c.fn); cap.textContent = `${prettyChord(c.sym)} é o ${c.rn}: função de ${FN_NAME[c.fn]}. ${c.fn === 'T' ? 'Repouso.' : c.fn === 'SD' ? 'Afasta do repouso.' : 'Tensão que pede a volta à tônica.'}`; [...degs.children].forEach((b, k) => b.classList.toggle('on', k === i)); };
  function build() {
    chords = field(tonic, isMinor);
    center.textContent = `${rootLabel(tonic, isMinor ? [0, 5, 7, 2, 10, 3].includes(pc(tonic)) : [5, 10, 3, 8, 1].includes(pc(tonic))).replace('b', '♭').replace('#', '♯')} ${isMinor ? 'menor' : 'maior'}`;
    sub.textContent = 'vizinhos no círculo = tons próximos';
    degs.replaceChildren(...chords.map((c, i) => h('button.btn.small', { type: 'button', style: { borderColor: FN_COLOR[c.fn], flexDirection: 'column', gap: '0', padding: '4px', borderRadius: '12px', minHeight: '54px' }, onclick: async () => { await unlock(); play(i); } }, h('b', c.rn), h('span.small', prettyChord(c.sym)))));
    degs.append(h('button.btn.small', { type: 'button', style: { borderRadius: '12px', minHeight: '54px', padding: '4px' }, onclick: async () => { await unlock(); const order = isMinor ? [0, 3, 4, 0] : [0, 3, 4, 0]; const t0 = now(); order.forEach((d, k) => { const n = voiceChord(chords[d].sym, { n: 4, spread: true, lo: 47 }); choirChord(n, t0 + k * 1.1, 1.05, { gain: 0.12 }); }); cap.textContent = `${order.map((d) => chords[d].rn).join(' – ')}: tônica, subdominante, dominante e volta. A história mais contada da música tonal.`; } }, 'T–SD–D–T'));
    if (borrowed) {
      const fl = true, R = (st) => rootLabel(tonic + st, fl);
      const list = [[R(5) + 'm6', 'iv', 'o IV vira menor: a 3ª desce um semitom'], [R(8) + 'maj7', '♭VI', 'traz a 6ª menor do tom'], [R(10) + '7', '♭VII', 'dominante suave, um tom abaixo da tônica'], [R(2) + 'm7b5', 'ii°', 'o ii com a 5ª diminuta, cor do tom menor'], [R(3) + 'maj7', '♭III', 'a 3ª menor do tom como fundamental']];
      extra.replaceChildren(...list.map(([sym, rn, why]) => h('button.chip', { type: 'button', onclick: async () => { await unlock(); sound(sym); paint(sym, 'SD'); cap.textContent = `${prettyChord(sym)} (${rn}) vem de ${center.textContent.replace('maior', 'menor')}: ${why}. Depois dele, volte ao I e ouça o contraste.`; } }, `${rn} · ${prettyChord(sym)}`)));
    }
    paint(chords[0].sym, 'T'); cap.textContent = 'Toque em um grau para ouvir. A cor mostra a função: verde é tônica, azul é subdominante, laranja é dominante.';
  }
  build();
  return h('div.col', circle,
    borrowed || minor ? null : null,
    minor && !borrowed ? seg([{ v: false, label: 'Maior' }, { v: true, label: 'Menor natural' }], isMinor, (v) => { isMinor = v; build(); }, { label: 'Modo' }) : null,
    degs, borrowed ? h('p.small.muted', 'Acordes emprestados do tom menor de mesmo nome:') : null, borrowed ? extra : null, cap,
    h('div.legend', Object.keys(FN_NAME).map((k) => h('span', h('i', { css: { '--c': FN_COLOR[k] } }), FN_NAME[k]))));
}

// ---------- 11. modos e harmonia quartal ----------
export function modeLab() {
  let mode = MODES[1];
  const kb = keyboard({ lo: 60, hi: 84 }); const cap = h('p.dim'), name = h('div.big');
  const scale = () => [...mode.iv.map((i) => 62 + i), 74];
  const show = (hl) => { kb.show(scale().map((m, i) => ({ m, color: i === mode.nota ? VOICE_COLORS[3] : VOICE_COLORS[1], label: i === mode.nota ? '★' : undefined })).concat(hl || [])); name.textContent = `Ré ${mode.name.toLowerCase()}`; cap.textContent = `${mode.name}: ${mode.cor}. A nota marcada com ★ é a que dá a cor do modo.`; };
  const playScale = () => { stopAll(); const t = now(); scale().forEach((m, i) => pianoNote(m, t + i * 0.28, 0.4, { gain: 0.24 })); choirNote(50, t, scale().length * 0.28 + 0.6, { voice: 0, vowel: 'o', gain: 0.1 }); };
  const dia4 = (start, count) => { const out = []; let d = start; for (let k = 0; k < count; k++) { out.push(62 + mode.iv[d % 7] + 12 * Math.floor(d / 7) - 12); d += 3; } return out; };
  const playQuartal = () => { stopAll(); const n = dia4(0, 4); show(n.map((m) => ({ m: m < 60 ? m + 12 : m, color: VOICE_COLORS[5], target: true }))); choirChord(n, now(), 2.6, { gain: 0.13 }); cap.textContent = 'Acorde por quartas: as notas se empilham de quatro em quatro graus. Sem terça embaixo, o acorde fica aberto, nem maior nem menor.'; };
  const playTertian = () => { stopAll(); const n = [0, 2, 4, 6].map((d) => 50 + mode.iv[d]); choirChord(n, now(), 2.6, { gain: 0.13 }); cap.textContent = 'Acorde por terças sobre a mesma nota, para comparar: mais “definido”, com cara de maior ou menor.'; };
  const sel = seg(MODES.map((m) => ({ v: m.id, label: m.name })), mode.id, (v) => { mode = MODES.find((m) => m.id === v); show(); playScale(); }, { label: 'Modo' });
  show();
  return h('div.col', sel, h('div.center', name), kb, cap, h('div.row.wrap', playBtn('Escala', playScale), h('button.btn', { onclick: async () => { await unlock(); playQuartal(); } }, 'Por quartas'), h('button.btn', { onclick: async () => { await unlock(); playTertian(); } }, 'Por terças')));
}

// ---------- 16. escrita a cappella em camadas ----------
export function acappellaLab() {
  const layers = { baixo: true, perc: false, cama: false, melodia: false };
  let vowel = 'u', seq = null;
  const CH = [['Cmaj9', [52, 55, 59, 62]], ['Am9', [52, 55, 59, 60]], ['Dm9', [53, 57, 60, 64]], ['G13', [53, 57, 59, 64]]];
  const BASS = [[36, 0], [36, 3], [43, 6], [45, 8], [45, 11], [40, 14], [38, 16], [38, 19], [45, 22], [43, 24], [43, 27], [47, 30]];
  const MEL = [[76, 2, 2], [74, 4, 2], [72, 6, 2], [72, 10, 3], [69, 13, 3], [77, 18, 2], [76, 20, 2], [74, 22, 3], [74, 26, 2], [71, 28, 4]];
  const steps = Array.from({ length: 32 }, (_, i) => ({ d: 0.5, i }));
  const cv = canvas(120);
  const btn = h('button.btn.primary', { type: 'button' }, 'Tocar');
  const stop = () => { seq && seq.stop(); seq = null; btn.textContent = 'Tocar'; };
  const start = () => {
    seq = new Sequencer({ steps, tempo: 92, loop: true, play: (st, i, t, d) => {
      const bar = Math.floor(i / 8);
      if (layers.baixo) for (const [m, at] of BASS) if (at === i) choirNote(m + 12, t, d * 2.2, { voice: 0, vowel: 'o', gain: 0.24, att: 0.015, rel: 0.1, vib: 0 });
      if (layers.perc) { if (i % 8 === 0 || i % 8 === 5) vocalPerc('bumbo', t); if (i % 8 === 4) vocalPerc('caixa', t); vocalPerc('chimbal', t, { gain: i % 2 ? 0.3 : 0.5 }); }
      if (layers.cama && i % 8 === 0) choirChord(CH[bar][1], t, d * 7.6, { gain: 0.085, vowel, voices: [1, 2, 3, 4] });
      if (layers.melodia) for (const [m, at, len] of MEL) if (at === i) choirNote(m, t, d * len * 0.9, { voice: 5, vowel: 'a', gain: 0.17, att: 0.02 });
    } });
    seq.start(); btn.textContent = 'Parar';
  };
  btn.onclick = async () => { await unlock(); seq ? stop() : start(); };
  loop(cv, () => {
    const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); const pos = seq ? seq.position() : null; const cw = w / 32, rh = hh / 4;
    const rows = [['melodia', VOICE_COLORS[5], (i) => MEL.some(([, at, len]) => i >= at && i < at + len)], ['cama', VOICE_COLORS[2], () => true], ['perc', VOICE_COLORS[4], (i) => i % 8 === 0 || i % 8 === 4 || i % 8 === 5], ['baixo', VOICE_COLORS[0], (i) => BASS.some(([, at]) => i >= at && i < at + 2)]];
    rows.forEach(([k, col, hit], r) => { for (let i = 0; i < 32; i++) { if (!hit(i)) continue; const nowOn = pos && pos.i === i && layers[k]; g.globalAlpha = layers[k] ? (nowOn ? 1 : 0.6) : 0.12; g.fillStyle = col; g.fillRect(i * cw + 1, r * rh + 4, cw - 2, rh - 8); } });
    g.globalAlpha = 1; if (pos) { g.fillStyle = '#f4ecdc'; g.fillRect((pos.i + pos.frac) * cw, 0, 2, hh); }
    g.fillStyle = 'rgba(244,236,220,.25)'; for (let b = 1; b < 4; b++) g.fillRect(b * 8 * cw, 0, 1, hh);
  });
  const names = { baixo: 'Baixo vocal “dum”', perc: 'Percussão vocal', cama: 'Cama de vozes', melodia: 'Melodia “da”' };
  const tg = h('div.seg.wrap', Object.keys(layers).map((k, i) => { const b = h('button.chip.v', { type: 'button', css: { '--c': [VOICE_COLORS[0], VOICE_COLORS[4], VOICE_COLORS[2], VOICE_COLORS[5]][i] }, 'aria-pressed': String(layers[k]), onclick: () => { layers[k] = !layers[k]; b.setAttribute('aria-pressed', String(layers[k])); } }, names[k]); return b; }));
  return h('div.col', h('p.small.muted', 'Ligue uma camada de cada vez e ouça o arranjo crescer.'), tg, h('div.stage', cv), h('div.row.between', h('span.small.dim', 'Sílaba da cama:'), seg([{ v: 'u', label: 'uu' }, { v: 'o', label: 'oo' }, { v: 'a', label: 'aa' }, { v: 'i', label: 'ii' }], vowel, (v) => { vowel = v; }, { label: 'Sílaba' })), btn);
}

// ---------- exercício de cantar junto ----------
/**
 * cfg: { intro, backing: [midi] (acorde de apoio), targets: [{m, label}], hold (s), onDone(mediaCents|null) }
 * A oitava é livre: a leitura é trazida para a oitava mais próxima do alvo.
 */
export function singLab(cfg) {
  const hold = cfg.hold || 1.2, tol = 0.4; // tolerância de 40 cents para contar o tempo
  let idx = 0, held = 0, devs = [], all = [], sus = [], off = null, lastT = 0, done = false;
  const box = h('div.col');
  const title = h('h3'), sub = h('p.dim'), needle = canvas(64), bar = h('div.meter', h('i')), msg = h('p.small', { 'aria-live': 'polite' });
  const body = h('div.col.hide', title, sub, h('div.stage', needle), bar, msg,
    h('div.row.wrap', h('button.btn.small', { onclick: () => guide() }, 'Ouvir a nota'), h('button.btn.small', { onclick: () => backing() }, 'Ouvir o apoio'), h('button.btn.small.ghost', { onclick: () => advance(true) }, 'Pular')));
  let cur = null;
  const tgt = () => cfg.targets[idx];
  const backing = () => { sus.forEach((n) => n && n.stop()); sus = cfg.backing && cfg.backing.length ? choirChord(cfg.backing, now(), 6, { gain: 0.07 }) : []; };
  const guide = () => pianoNote(tgt().m, now(), 1.4, { gain: 0.3 });
  const present = () => { const t = tgt(); title.textContent = `Cante: ${t.label}`; sub.textContent = `Nota ${noteName(t.m)} (pode ser em outra oitava). Segure afinado por ${hold.toLocaleString('pt-BR')} s.`; held = 0; devs = []; bar.firstChild.style.width = '0%'; msg.textContent = ''; backing(); pianoNote(t.m, now() + 0.4, 1.4, { gain: 0.3 }); };
  const finish = () => {
    done = true; off && off(); off = null; sus.forEach((n) => n && n.stop()); wake.off();
    const avg = all.length ? all.reduce((a, b) => a + b, 0) / all.length : null;
    body.replaceChildren(h('h3', 'Feito!'), h('p', avg != null ? `Desvio médio: ${Math.round(avg)} cents. ${avg < 15 ? 'Muito afinado.' : avg < 30 ? 'Bom: continue ouvindo o apoio enquanto canta.' : 'Vale repetir devagar, ouvindo a nota antes de cantar.'}` : 'Exercício concluído.'));
    cfg.onDone && cfg.onDone(avg);
  };
  const advance = (skipped) => { if (!skipped && devs.length) all.push(devs.reduce((a, b) => a + b, 0) / devs.length); idx++; if (idx >= cfg.targets.length) finish(); else present(); };
  const draw = () => {
    const { g, w, h: hh } = needle._fit(); g.clearRect(0, 0, w, hh);
    g.fillStyle = 'rgba(88,214,160,.18)'; g.fillRect(w / 2 - w * 0.1, 0, w * 0.2, hh);
    g.strokeStyle = 'rgba(244,236,220,.3)'; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, hh); g.stroke();
    g.fillStyle = 'rgba(244,236,220,.5)'; g.font = '11px Figtree, sans-serif'; g.fillText('grave', 6, hh - 6); g.fillText('agudo', w - 38, hh - 6);
    if (cur != null) { const x = w / 2 + clamp(cur, -1, 1) * w * 0.5 * 0.5 * 2 * 0.5; g.fillStyle = Math.abs(cur) <= tol ? '#58d6a0' : '#f4ecdc'; g.beginPath(); g.arc(clamp(w / 2 + cur * w * 0.25, 8, w - 8), hh / 2, 10, 0, 7); g.fill(); void x; g.fillStyle = '#f4ecdc'; g.fillText(`${cur > 0 ? '+' : ''}${Math.round(cur * 100)} cents`, w / 2 - 24, 14); }
  };
  loop(needle, draw);
  const startMic = () => {
    body.classList.remove('hide'); wake.on(); present();
    off = onPitch((p) => {
      if (done) return; const m = pitchToMidi(p, prefs.get('a4') || 440); const dt = lastT ? Math.min(0.1, p.t - lastT) : 0.02; lastT = p.t;
      if (m == null) { cur = null; return; }
      cur = foldToTarget(m, tgt().m) - tgt().m;
      if (Math.abs(cur) <= tol) { held += dt; devs.push(Math.abs(cur) * 100); bar.firstChild.style.width = clamp(held / hold * 100, 0, 100) + '%'; if (held >= hold) { vib(40); msg.textContent = 'Boa!'; advance(false); } }
      else held = Math.max(0, held - dt * 0.5);
    });
  };
  const noMic = h('button.btn.ghost.block', { type: 'button', onclick: async () => { await unlock(); gate.remove(); noMic.remove(); body.classList.remove('hide'); body.replaceChildren(h('p', 'Sem microfone: ouça cada nota, cante junto e marque quando terminar.'), h('div.seg.wrap', cfg.targets.map((t) => h('button.chip', { onclick: () => { cfg.backing && choirChord(cfg.backing, now(), 3, { gain: 0.07 }); pianoNote(t.m, now() + 0.3, 1.5); } }, t.label))), h('button.btn.primary', { onclick: () => { all = []; finish(); } }, 'Cantei todas')); } }, micSupported() ? 'Fazer sem microfone' : 'Fazer sem microfone (este navegador não tem)');
  const gate = micGate(() => { noMic.remove(); startMic(); }, { playsToo: true, label: 'Ligar microfone e cantar' });
  box.append(h('p', cfg.intro), gate, noMic, body);
  box.stop = () => { done = true; off && off(); sus.forEach((n) => n && n.stop()); };
  void getCtx; void midiToFreq;
  return box;
}

export const LABS = { ondas: waveLab, acordes: chordLab, tensoes: tensionLab, prog: progLab, campo: fieldLab, modos: modeLab, acappella: acappellaLab };
