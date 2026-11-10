// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Teoria musical: nomes de notas, cifras, aberturas e distribuição de vozes.

export const VOICE_COLORS = ['#58d6a0', '#5cc8e8', '#b79cf0', '#f06a98', '#ff8f66', '#ffd166'];
export const VOICE_NAMES = ['Baixo', 'Barítono', 'Tenor 2', 'Tenor 1', 'Alto', 'Líder'];

/** Cor/voz (0..5) da i-ésima de n vozes: melodia sozinha usa a cor do líder. */
export const voiceIndex = (i, n) => (n >= 6 ? Math.min(i, 5) : n <= 1 ? 5 : Math.round((i / (n - 1)) * 5));

const LETTERS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const SOLFEGE = ['Dó', 'Ré♭', 'Ré', 'Mi♭', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Lá♭', 'Lá', 'Si♭', 'Si'];
let useSolfege = true;
export const setSolfege = (v) => { useSolfege = !!v; };
export const pc = (m) => ((m % 12) + 12) % 12;
/** Nome da classe de nota conforme a preferência (Dó-Ré-Mi ou C-D-E). */
export const pcName = (m) => (useSolfege ? SOLFEGE : LETTERS)[pc(m)];
/** Nome com oitava (Dó central = C4 = MIDI 60). */
export const noteName = (m) => `${pcName(m)}${Math.floor(m / 12) - 1}`;
export const letterName = (m) => LETTERS[pc(m)];
export const midiToFreq = (m, a4 = 440) => a4 * Math.pow(2, (m - 69) / 12);
export const freqToMidi = (f, a4 = 440) => 69 + 12 * Math.log2(f / a4);
export const cents = (f, target) => 1200 * Math.log2(f / target);

const ROOTS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function rootPc(name) {
  let p = ROOTS[name[0]];
  if (name[1] === '#' || name[1] === '♯') p++;
  if (name[1] === 'b' || name[1] === '♭') p--;
  return pc(p);
}

/**
 * Interpreta uma cifra em letras (ex.: "Dm11", "G13b9", "Cmaj7#11/E").
 * Devolve fundamental, baixo, tons (intervalo em semitons + grau) e o conjunto de classes de nota.
 */
export function parseChord(sym) {
  const m = sym.replace(/♯/g, '#').replace(/♭/g, 'b').match(/^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/);
  if (!m) throw new Error('Cifra inválida: ' + sym);
  const root = rootPc(m[1]);
  let q = m[2].replace(/[()\s,]/g, '');
  const bass = m[3] ? rootPc(m[3]) : root;
  const T = new Map(); // grau -> semitons
  let third = ['3', 4], fifth = ['5', 7];
  const eat = (re) => { const r = q.match(re); if (r) { q = q.slice(0, r.index) + q.slice(r.index + r[0].length); return r; } return null; };

  if (eat(/^dim7/)) { third = ['b3', 3]; fifth = ['b5', 6]; T.set('bb7', 9); }
  else if (eat(/^dim/)) { third = ['b3', 3]; fifth = ['b5', 6]; }
  else if (eat(/^aug|^\+/)) { fifth = ['#5', 8]; }
  else if (eat(/^m7b5|^ø7?/)) { third = ['b3', 3]; fifth = ['b5', 6]; T.set('b7', 10); }
  let minor = false, major7 = false;
  if (!/^maj/i.test(q) && eat(/^m(?!aj)/)) { minor = true; third = ['b3', 3]; }
  if (eat(/^maj|^M(?=\d)|^Δ/)) major7 = true;
  if (eat(/maj7/)) { T.set('7', 11); }
  const alt = !!eat(/alt/);
  const sus = eat(/sus([24])?/);
  const adds = []; let a;
  while ((a = eat(/add(\d+)/))) adds.push(+a[1]);
  const alts = [];
  while ((a = eat(/([#b])(5|9|11|13)/))) alts.push(a[1] + a[2]);
  const six9 = !!eat(/^6\/?9|^69/);
  const ext = eat(/^(13|11|9|7|6)/);
  if (q.length) throw new Error(`Cifra não reconhecida: ${sym} (sobrou "${q}")`);

  const sev = major7 ? ['7', 11] : ['b7', 10];
  if (six9) { T.set('6', 9); T.set('9', 14); }
  if (ext) {
    const n = +ext[1];
    if (n === 6) T.set('6', 9);
    if (n >= 7) T.set(sev[0], sev[1]);
    if (n >= 9) T.set('9', 14);
    if (n === 11) T.set('11', 17);
    if (n === 13) { if (minor) T.set('11', 17); T.set('13', 21); }
  } else if (major7) T.set('7', 11);
  if (sus) { third = sus[1] === '2' ? ['2', 2] : ['4', 5]; }
  for (const n of adds) T.set(String(n), { 2: 14, 4: 17, 6: 9, 9: 14, 11: 17, 13: 21 }[n]);
  if (alt) { T.set('b7', 10); T.set('b9', 13); T.set('#9', 15); T.set('b13', 20); fifth = ['b5', 6]; }
  for (const al of alts) {
    if (al === 'b5') fifth = ['b5', 6];
    else if (al === '#5') fifth = ['#5', 8];
    else if (al === 'b9') { T.delete('9'); T.set('b9', 13); }
    else if (al === '#9') { T.delete('9'); T.set('#9', 15); }
    else if (al === '#11') { T.delete('11'); T.set('#11', 18); }
    else if (al === 'b13') { T.delete('13'); T.set('b13', 20); fifth = null; }
  }
  const tones = [{ deg: '1', iv: 0 }, { deg: third[0], iv: third[1] }];
  if (fifth) tones.push({ deg: fifth[0], iv: fifth[1] });
  for (const [deg, iv] of T) tones.push({ deg, iv });
  tones.sort((x, y) => x.iv - y.iv);
  const pcs = new Set(tones.map((t) => pc(root + t.iv)));
  pcs.add(bass);
  return { sym, root, bass, tones, pcs, minor, dominant: T.has('b7') && third[1] === 4 };
}

/** Grau (ex.: "b7", "9") que a nota ocupa no acorde, ou null. */
export function degreeOf(chord, midi) {
  const t = chord.tones.find((x) => pc(chord.root + x.iv) === pc(midi));
  return t ? t.deg : null;
}
const DEG_PT = { 1: 'fundamental', 2: '2ª', b3: '3ª menor', 3: '3ª', 4: '4ª', b5: '5ª diminuta', 5: '5ª', '#5': '5ª aumentada', 6: '6ª', bb7: '7ª diminuta', b7: '7ª menor', 7: '7ª maior', b9: '9ª menor', 9: '9ª', '#9': '9ª aumentada', 11: '11ª', '#11': '11ª aumentada', b13: '13ª menor', 13: '13ª' };
export const degName = (d) => DEG_PT[d] || d;
export const degShort = (d) => (d || '').replace('b', '♭').replace('#', '♯');

// prioridade para o miolo: terça e sétima primeiro, depois tensões, quinta e fundamental
const prio = (deg) => (/^(b?3|4|2)$/.test(deg) ? 0 : /^(b?7|bb7|6)$/.test(deg) ? 1 : /9|11|13/.test(deg) ? 2 : /5/.test(deg) ? 3 : 4);

/**
 * Distribui um acorde em n vozes (do grave ao agudo).
 * Regras: baixo independente na fundamental (ou no baixo da cifra), terça e sétima no miolo,
 * tensões em cima, notas diferentes sempre que der, vozes internas vizinhas e com pouco movimento.
 * opts: { top (nota da melodia), prev (abertura anterior), n, lo (limite grave do miolo), spread }
 */
export function voiceChord(sym, opts = {}) {
  const ch = typeof sym === 'string' ? parseChord(sym) : sym;
  const n = opts.n || 6;
  const prev = opts.prev || null;
  const tones = ch.tones.map((t) => ({ ...t, pc: pc(ch.root + t.iv), p: prio(t.deg) }));
  // topo (melodia)
  let top = opts.top;
  if (top == null) {
    const want = prev ? prev[prev.length - 1] : 69;
    let best = 1e9;
    for (let mnote = 62; mnote <= 76; mnote++) {
      const t = tones.find((x) => x.pc === pc(mnote)); if (!t) continue;
      const c = Math.abs(mnote - want) * 1.2 + [6, 5, 0, 3, 8][t.p];
      if (c < best) { best = c; top = mnote; }
    }
  }
  // baixo: perto do anterior, no centro da tessitura e com espaço para o miolo
  const bLo = opts.bassLo ?? 40, bHi = opts.bassHi ?? 53;
  const room = 4 + (n - 2) * 2.5;
  let bass = null, bestB = 1e9;
  for (let mnote = bLo; mnote <= bHi; mnote++) if (pc(mnote) === ch.bass) {
    const c = (prev ? Math.abs(mnote - prev[0]) : 0) + Math.abs(mnote - 46) * 0.7 + (top - mnote < room ? 40 : 0);
    if (c < bestB) { bestB = c; bass = mnote; }
  }
  if (bass == null) { bass = bLo; while (pc(bass) !== ch.bass) bass--; }
  const inner = n - 2;
  const lo = Math.max(opts.lo ?? 48, bass + 3);
  const cands = [];
  for (let mnote = top - 1; mnote >= lo; mnote--) { const t = tones.find((x) => x.pc === pc(mnote)); if (t) cands.push({ m: mnote, t }); }
  const need = tones.filter((t) => t.p <= 1 && t.pc !== pc(top));
  const maxGap = opts.spread ? 12 : 7;
  let best = null, bestC = 1e9;
  const pick = [];
  const prevInner = prev && prev.length === n ? prev.slice(1, n - 1).reverse() : null; // do agudo ao grave
  const score = () => {
    let c = 0;
    const used = new Map(); used.set(pc(top), 1); used.set(pc(bass), (used.get(pc(bass)) || 0) + 1);
    for (const k of pick) used.set(k.t.pc, (used.get(k.t.pc) || 0) + 1);
    for (const v of used.values()) if (v > 1) c += 14 * (v - 1);
    const distinct = used.size, possible = Math.min(n, ch.pcs.size);
    c += (possible - distinct) * 18;
    for (const t of need) if (!pick.some((k) => k.t.pc === t.pc)) c += 60;
    // tensões em cima, terça e sétima embaixo
    pick.forEach((k, i) => { if (k.t.p <= 1) c += (inner - 1 - i) * 1.5; else if (k.t.p === 2) c += i * 1.2; else if (k.t.p === 4) c += 4; });
    // intervalos
    const all = [top, ...pick.map((k) => k.m)];
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const d = all[i] - all[j];
      if (d === 13) c += 9;                 // nona menor entre vozes soa áspera
      if (d === 1) c += i === 0 ? 10 : 5;   // semitom colado na melodia atrapalha
    }
    if (pick.length && pick[pick.length - 1].m < 52 && pick[pick.length - 1].t.p > 1 && pick[pick.length - 1].t.p !== 3) c += 6;
    const span = top - pick[pick.length - 1].m;
    c += opts.spread ? Math.abs(span - 19) * 0.6 : Math.max(0, span - 15) * 1.5 + Math.max(0, 9 - span) * 0.8;
    if (prevInner) pick.forEach((k, i) => { const d = Math.abs(k.m - prevInner[i]); c += d <= 2 ? d * 0.6 : d * 1.6; });
    return c;
  };
  const rec = (start, last) => {
    if (pick.length === inner) { const c = score(); if (c < bestC) { bestC = c; best = pick.map((k) => k.m); } return; }
    for (let i = start; i < cands.length; i++) {
      const k = cands[i];
      if (last - k.m > maxGap + (pick.length === 0 ? 2 : 0)) break;
      pick.push(k); rec(i + 1, k.m); pick.pop();
    }
  };
  rec(0, top);
  if (!best) { // acorde com poucas notas ou espaço curto: relaxa os limites
    if (bass - 12 >= 36 && !opts._low) return voiceChord(ch, { ...opts, top, bassHi: bass - 1, bassLo: 36, _low: true });
    if ((opts.lo ?? 48) > 40) return voiceChord(ch, { ...opts, top, lo: (opts.lo ?? 48) - 4, spread: true });
    best = cands.slice(0, inner).map((k) => k.m);
    while (best.length < inner) best.push((best[best.length - 1] ?? top) - 12);
  }
  return [bass, ...best.reverse(), top];
}

/** Monta os passos de um arranjo a partir de [cifra, topo, tempos, legenda]. */
export function buildSteps(spec, opts = {}) {
  let prev = null;
  return spec.map(([c, top, d = 2, t = '']) => {
    const n = voiceChord(c, { ...opts, top, prev });
    prev = n;
    return { c, n, d, t };
  });
}

// ---------- tipos de acorde do Estúdio de acordes ----------
export const CHORD_TYPES = [
  { id: '', name: 'Maior', hint: 'tríade maior' },
  { id: 'm', name: 'Menor', hint: 'tríade menor' },
  { id: 'dim', name: 'Diminuto', hint: 'tríade diminuta' },
  { id: 'aug', name: 'Aumentado', hint: 'tríade aumentada' },
  { id: 'sus4', name: 'Sus4', hint: 'quarta no lugar da terça' },
  { id: '6', name: '6', hint: 'maior com sexta' },
  { id: 'm6', name: 'm6', hint: 'menor com sexta' },
  { id: '69', name: '6/9', hint: 'sexta e nona, sem sétima' },
  { id: 'maj7', name: 'maj7', hint: 'sétima maior' },
  { id: 'm7', name: 'm7', hint: 'menor com sétima' },
  { id: '7', name: '7', hint: 'dominante' },
  { id: 'm7b5', name: 'm7(♭5)', hint: 'meio-diminuto' },
  { id: 'dim7', name: 'dim7', hint: 'diminuto com sétima' },
  { id: 'm(maj7)', name: 'm(maj7)', hint: 'menor com sétima maior' },
  { id: 'maj9', name: 'maj9', hint: 'sétima maior e nona' },
  { id: 'm9', name: 'm9', hint: 'menor com nona' },
  { id: '9', name: '9', hint: 'dominante com nona' },
  { id: 'm11', name: 'm11', hint: 'menor com nona e décima primeira' },
  { id: 'maj7#11', name: 'maj7(♯11)', hint: 'cor lídia' },
  { id: '9sus4', name: '9sus4', hint: 'dominante suspenso' },
  { id: '13', name: '13', hint: 'dominante com nona e décima terceira' },
  { id: 'maj13', name: 'maj13', hint: 'seis notas, todas da escala maior' },
  { id: '7b9', name: '7(♭9)', hint: 'dominante com nona menor' },
  { id: '7#9', name: '7(♯9)', hint: 'dominante com nona aumentada' },
  { id: '7#11', name: '7(♯11)', hint: 'dominante lídio' },
  { id: '13b9', name: '13(♭9)', hint: 'dominante com 13ª e 9ª menor' },
  { id: '7alt', name: '7alt', hint: 'dominante alterado' },
];
export const ROOT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
/** Mostra a cifra com ♯ e ♭ tipográficos. */
export const prettyChord = (sym) => sym.replace(/#/g, '♯').replace(/([A-G])b/g, '$1♭').replace(/b(5|9|13)/g, '♭$1');

/** As quatro aberturas do Estúdio de acordes. */
export function voicings(sym, kind, baseOct = 4) {
  const ch = parseChord(sym);
  const base = 12 * (baseOct + 1) + ch.root; // fundamental na oitava pedida
  const up = ch.tones.map((t) => base + t.iv);
  // versão fechada: até 4 ou 5 notas dentro de uma oitava (sem fundamental se houver tensões demais)
  let close = ch.tones.map((t) => base + (t.iv % 12)).sort((a, b) => a - b);
  close = [...new Set(close)];
  if (close.length > 5) close = close.filter((mnote) => pc(mnote) !== ch.root);
  if (close.length > 5) close = close.filter((mnote) => degreeOf(ch, mnote) !== '5');
  while (close[close.length - 1] > 76) close = close.map((x) => x - 12);
  if (kind === 'fechada') return close;
  if (kind === 'drop2') {
    if (close.length < 3) return close;
    const v = [...close]; const i = v.length - 2; v[i] -= 12;
    return v.sort((a, b) => a - b);
  }
  if (kind === 'aberta') {
    // fundamental e quinta (ou sétima) embaixo, terça uma décima acima, o resto em cima
    const r = 12 * 3 + ch.root + (ch.root < 4 ? 12 : 0);
    const rest = ch.tones.filter((t) => t.iv !== 0).map((t) => ({ ...t, p: prio(t.deg) }));
    const out = [r];
    const fifthT = rest.find((t) => t.p === 3), thirdT = rest.find((t) => t.p === 0), sevT = rest.find((t) => t.p === 1);
    if (fifthT) out.push(r + fifthT.iv % 12); else if (sevT) out.push(r + sevT.iv % 12);
    if (thirdT) out.push(r + 12 + thirdT.iv % 12);
    if (sevT && fifthT) out.push(r + 12 + sevT.iv % 12);
    for (const t of rest.filter((x) => x.p === 2)) { let mnote = r + 24 + (t.iv % 12); while (mnote <= out[out.length - 1]) mnote += 12; while (mnote - out[out.length - 1] > 12) mnote -= 12; if (mnote > out[out.length - 1]) out.push(mnote); }
    return [...new Set(out)].sort((a, b) => a - b).slice(0, 6);
  }
  void up;
  return voiceChord(ch, { n: 6 });
}

// ---------- escalas, campo harmônico ----------
export const MAJOR = [0, 2, 4, 5, 7, 9, 11];
export const MODES = [
  { id: 'jonio', name: 'Jônio', iv: [0, 2, 4, 5, 7, 9, 11], cor: '4ª justa e 7ª maior: a escala maior', nota: 3 },
  { id: 'dorico', name: 'Dórico', iv: [0, 2, 3, 5, 7, 9, 10], cor: 'menor com 6ª maior', nota: 5 },
  { id: 'frigio', name: 'Frígio', iv: [0, 1, 3, 5, 7, 8, 10], cor: 'menor com 2ª menor', nota: 1 },
  { id: 'lidio', name: 'Lídio', iv: [0, 2, 4, 6, 7, 9, 11], cor: 'maior com 4ª aumentada', nota: 3 },
  { id: 'mixolidio', name: 'Mixolídio', iv: [0, 2, 4, 5, 7, 9, 10], cor: 'maior com 7ª menor', nota: 6 },
  { id: 'eolio', name: 'Eólio', iv: [0, 2, 3, 5, 7, 8, 10], cor: 'menor natural, com 6ª menor', nota: 5 },
  { id: 'locrio', name: 'Lócrio', iv: [0, 1, 3, 5, 6, 8, 10], cor: 'menor com 2ª menor e 5ª diminuta', nota: 4 },
];
const MAJ_Q = ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'];
const MAJ_T = ['', 'm', 'm', '', '', 'm', 'dim'];
const MAJ_RN = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const MAJ_FN = ['T', 'SD', 'T', 'SD', 'D', 'T', 'D'];
const MIN_IV = [0, 2, 3, 5, 7, 8, 10];
const MIN_Q = ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'];
const MIN_RN = ['i', 'ii°', '♭III', 'iv', 'v', '♭VI', '♭VII'];
const MIN_FN = ['T', 'SD', 'T', 'SD', 'D', 'SD', 'SD'];
const FLAT_KEYS = new Set([5, 10, 3, 8, 1, 6]);
const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const rootLabel = (p, flats) => (flats ? FLAT : SHARP)[pc(p)];
/** Campo harmônico maior ou menor natural: sete acordes com grau e função. */
export function field(tonic, minor = false, tetrads = true) {
  const flats = minor ? FLAT_KEYS.has(pc(tonic + 3)) || pc(tonic) === 0 || pc(tonic) === 7 || pc(tonic) === 2 : FLAT_KEYS.has(pc(tonic));
  const iv = minor ? MIN_IV : MAJOR;
  return iv.map((s, i) => {
    const q = minor ? (tetrads ? MIN_Q[i] : MIN_Q[i].replace('maj7', '').replace('m7b5', 'dim').replace('7', '')) : (tetrads ? MAJ_Q[i] : MAJ_T[i]);
    return { sym: rootLabel(tonic + s, flats) + q, rn: minor ? MIN_RN[i] : MAJ_RN[i], fn: minor ? MIN_FN[i] : MAJ_FN[i], deg: i };
  });
}
export const FN_NAME = { T: 'tônica', SD: 'subdominante', D: 'dominante' };
export const FN_COLOR = { T: '#58d6a0', SD: '#5cc8e8', D: '#ff8f66' };

/** Função e grau de um acorde dentro de um tom maior (aproximação para legendas). */
export function analyze(sym, tonic) {
  const ch = parseChord(sym);
  const iv = pc(ch.root - tonic);
  const i = MAJOR.indexOf(iv);
  const third = ch.tones.find((t) => /3/.test(t.deg));
  if (i >= 0) {
    const natMinor = [1, 2, 5, 6].includes(i);
    const isMinor = third && third.deg === 'b3';
    if (isMinor === natMinor || i === 4) return { rn: MAJ_RN[i], fn: MAJ_FN[i] };
    if (ch.dominant) { const tgt = MAJ_RN[MAJOR.indexOf(pc(iv + 5))]; return { rn: tgt ? `V/${tgt}` : 'dom.', fn: 'D', sec: true }; }
    if (i === 3 && isMinor) return { rn: 'iv', fn: 'SD', borrowed: true };
    return { rn: MAJ_RN[i], fn: MAJ_FN[i] };
  }
  if (ch.dominant) {
    if (iv === 1) return { rn: 'sub V', fn: 'D', sub: true };
    const tgtI = MAJOR.indexOf(pc(iv + 5)); if (tgtI >= 0) return { rn: `V/${MAJ_RN[tgtI]}`, fn: 'D', sec: true };
    const subI = MAJOR.indexOf(pc(iv - 1)); if (subI >= 0) return { rn: `sub V/${MAJ_RN[subI]}`, fn: 'D', sub: true };
  }
  const names = { 1: '♭II', 3: '♭III', 6: '♯IV', 8: '♭VI', 10: '♭VII' };
  if (ch.tones.some((t) => t.deg === 'bb7')) return { rn: names[iv] ? names[iv].replace('♭', '♯').replace(/II|III|VI|VII/, (x) => x) + '°' : '°', fn: 'D', dim: true };
  return { rn: names[iv] || '?', fn: 'SD', borrowed: true };
}

/** Legenda automática de um passo: grau, função e o que as vozes de cima cantam. */
export function describeStep(step, tonic) {
  const ch = parseChord(step.c);
  const a = analyze(step.c, tonic);
  const parts = [];
  let head = `${prettyChord(step.c)} · ${a.rn}`;
  if (a.sec) head += ' (dominante secundário)'; else if (a.sub) head += ' (substituto do trítono)'; else if (a.borrowed) head += ' (empréstimo modal)'; else if (a.dim) head += ' (diminuto de passagem)'; else head += ` (${FN_NAME[a.fn]})`;
  parts.push(head + '.');
  const nn = step.n;
  const top = degreeOf(ch, nn[nn.length - 1]);
  if (top) parts.push(`${nn.length > 4 ? 'O líder' : 'A voz de cima'} canta a ${degName(top)}.`);
  const tens = nn.slice(1, -1).map((mnote) => degreeOf(ch, mnote)).filter((d) => d && /9|11|13/.test(d));
  if (tens.length) parts.push(`No miolo: ${[...new Set(tens)].map(degName).join(' e ')}.`);
  return parts.join(' ');
}

/** Reconhece o acorde formado pelas notas (cifra em letras) ou devolve null. */
let chordIndex = null;
export function identifyChord(midis) {
  const pcs = [...new Set(midis.map(pc))].sort((a, b) => a - b); if (pcs.length < 3) return null;
  if (!chordIndex) { chordIndex = new Map(); for (const r of ROOT_NAMES) for (const t of CHORD_TYPES) { const ch = parseChord(r + t.id); const key = [...ch.pcs].sort((a, b) => a - b).join(','); if (!chordIndex.has(key)) chordIndex.set(key, []); chordIndex.get(key).push({ sym: r + t.id, root: ch.root, rank: CHORD_TYPES.indexOf(t) }); } }
  const list = chordIndex.get(pcs.join(',')); if (!list) return null;
  const bass = pc(Math.min(...midis)); const best = list.find((c) => c.root === bass) || list.slice().sort((a, b) => a.rank - b.rank)[0];
  return best.root === bass ? best.sym : `${best.sym}/${rootLabel(bass, /b/.test(best.sym) || [5, 10, 3, 8, 1].includes(best.root))}`;
}
