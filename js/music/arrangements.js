// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Arranjos do app. Progressões originais e melodias de domínio público.
// Cada passo: { c: cifra, n: notas MIDI do grave ao agudo, d: duração em tempos, t: legenda }.
// As vozes são distribuídas por voiceChord() (determinístico) a partir da cifra e da nota da melodia;
// tests/arrangements.test.mjs confere, passo a passo, se cada nota pertence ao acorde da cifra.

import { buildSteps, describeStep, rootPc } from './theory.js';

const arr = (id, title, key, tempo, about, spec, opts) => {
  const tonic = rootPc(key);
  const steps = buildSteps(spec, opts).map((s) => ({ ...s, t: s.t || '' }));
  steps.forEach((s) => { s.auto = describeStep(s, tonic); });
  return { id, title, key, tonic, tempo, about, steps, voices: (opts && opts.n) || 6 };
};

// ---------- progressões originais a seis vozes ----------
export const AURORA = arr('aurora', 'Aurora', 'C', 56, 'Progressão original em Dó maior. A melodia desce por semitons enquanto o miolo quase não se mexe.', [
  ['Cmaj13', 74, 2, 'Tônica com seis notas diferentes: nenhuma voz dobra a outra.'],
  ['Am11', 74, 2, 'O líder fica na mesma nota. Ela era a 9ª e agora é a 11ª.'],
  ['Dm11', 76, 2, 'Subdominante. Terça e sétima ficam no miolo.'],
  ['G13', 76, 2, 'Dominante. De novo o líder não se move: a 9ª virou 13ª.'],
  ['Em7add11', 74, 2, 'Tônica disfarçada: o iii grau no lugar do I.'],
  ['A9b13', 77, 2, 'Dominante secundário: empurra para o Dm.'],
  ['Dm11', 76, 2, 'A tensão resolve descendo um semitom.'],
  ['Db13', 75, 2, 'Substituto do trítono: o baixo desce por semitom até o Dó.'],
  ['Cmaj13', 74, 4, 'Chegada. Repare que quase todas as vozes andaram por grau conjunto.'],
]);

export const MARE = arr('mare', 'Maré', 'F', 63, 'Progressão original em Fá maior, com cor de gospel: dominantes secundários e acordes suspensos.', [
  ['Fmaj13', 69, 2], ['Dm11', 72, 2], ['Gm11', 72, 2], ['C13sus4', 69, 1], ['C13b9', 69, 1],
  ['Am7add11', 67, 2], ['D9b13', 70, 2, 'Dominante secundário do ii grau, com a 13ª menor no líder.'], ['Gm11', 69, 2], ['Gb13', 68, 2, 'Substituto do trítono do C7.'],
  ['Fmaj13', 67, 2], ['Bbmaj13', 67, 2, 'Subdominante: o líder segura a nota e a harmonia muda embaixo.'], ['Bbm6', 67, 2, 'Empréstimo modal: o iv menor vem de Fá menor.'], ['F69', 67, 4, 'Final sem sétima: sexta e nona dão brilho sem tensão.'],
]);

export const NOTURNO = arr('noturno', 'Noturno', 'C', 52, 'Progressão original em Lá menor (relativo de Dó). Meio-diminuto, dominante alterado e final em menor com nona.', [
  ['Am11', 71, 2, 'Tônica menor com 9ª e 11ª.'], ['Fmaj13', 69, 2, 'O ♭VI: mesma família, mais luz.'],
  ['Bm7b5', 69, 2, 'ii grau do tom menor: meio-diminuto.'], ['E7#9', 67, 2, 'Dominante com 9ª aumentada: a nota de cima é ao mesmo tempo a 3ª menor do tom.'],
  ['Am9', 67, 2], ['Dm11', 67, 2, 'Subdominante menor.'], ['G13', 64, 2, 'Dominante do relativo maior: por um instante parece que vamos para Dó.'], ['Cmaj13', 64, 2],
  ['Fmaj7#11', 64, 2, 'Cor lídia: a 4ª aumentada no miolo.'], ['E7b13', 60, 2, 'A 13ª menor é a tônica segurada pelo líder.'], ['Am9', 59, 4, 'Repouso em menor com a 9ª no alto.'],
]);

// ---------- melodias de domínio público ----------
// "Ode à Alegria" (Beethoven, 1824), em Fá maior.
const ODE_MEL = [[69, 1], [69, 1], [70, 1], [72, 1], [72, 1], [70, 1], [69, 1], [67, 1], [65, 1], [65, 1], [67, 1], [69, 1], [67, 1.5], [65, 0.5], [65, 2]];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
/** Transpõe uma cifra (fundamental e baixo) por semitons. */
export const transpose = (sym, st) => sym.replace(/(^|\/)([A-G][#b]?)/g, (_, pre, r) => pre + FLATS[(rootPc(r) + st + 12) % 12]);
const up = (mel, st) => mel.map(([m, d]) => [m + st, d]);
const trc = (chords, st) => chords.map(([c, t]) => [transpose(c, st), t]);
const melSteps = (mel) => mel.map(([m, d]) => ({ c: '', n: [m], d, t: '' }));
const withMel = (mel, chords) => mel.map(([m, d], i) => [chords[i][0], m, d, chords[i][1] || '']);

export const ODE = {
  id: 'ode', title: 'Ode à Alegria', author: 'Beethoven (1824), domínio público', key: 'F', tonic: 5, tempo: 84,
  levels: [
    { id: 'unissono', name: 'Uníssono', voices: 1, about: 'Só a melodia. Todo mundo canta a mesma nota.', steps: melSteps(ODE_MEL) },
    { id: 'coral', name: 'Coral a quatro', voices: 4, about: 'Tríades com a melodia no soprano, como em um hinário.', steps: buildSteps(withMel(ODE_MEL, [['F'], ['Dm'], ['Bb'], ['F/A'], ['Am'], ['Gm'], ['F'], ['C'], ['Dm'], ['Bb'], ['C'], ['F'], ['C7'], ['F'], ['F']]), { n: 4, spread: true, lo: 45 }) },
    { id: 'blocos', name: 'Blocos de jazz a cinco', voices: 5, about: 'Tétrades com nona. As quatro vozes de baixo andam em bloco sob a melodia.', steps: buildSteps(withMel(ODE_MEL, [['Fmaj9'], ['Dm9'], ['Gm9'], ['Am7'], ['D9'], ['Gm9'], ['C13'], ['C9'], ['Dm9'], ['Bbmaj9'], ['C9sus4'], ['Fmaj9'], ['C13'], ['Gbmaj9'], ['F69']]), { n: 5 }) },
    { id: 'seis', name: 'Seis vozes', voices: 6, about: 'Um acorde por nota da melodia, tensões em todo acorde e baixo independente.', steps: buildSteps(withMel(ODE_MEL, [['Fmaj13', 'A melodia é a 3ª. Embaixo, seis notas diferentes.'], ['Dm11', 'Mesma nota no líder, agora como 5ª.'], ['Gm11'], ['Am7add11'], ['D13', 'Dominante secundário: prepara o Gm.'], ['Gm11'], ['C13', 'A melodia é a 13ª do dominante.'], ['C13b9', 'A 9ª menor aperta antes de resolver.'], ['Dm11'], ['Bbmaj13'], ['C13sus4', 'Dominante suspenso: a 4ª no lugar da 3ª.'], ['Fmaj13'], ['C13'], ['Gbmaj9', 'Acorde de aproximação: meio tom acima da chegada.'], ['F69', 'Final com sexta e nona.']]), { n: 6 }) },
  ],
};

// "Amazing Grace" (melodia "New Britain", 1829, domínio público), em Si bemol maior (escrita em Fá e transposta), compasso de 3.
const GRACE_MEL = up([[60, 1], [65, 2], [69, 0.5], [65, 0.5], [69, 2], [67, 1], [65, 2], [62, 1], [60, 2], [60, 1], [65, 2], [69, 0.5], [65, 0.5], [69, 2], [67, 1], [72, 3]], 5);
export const GRACE = {
  id: 'grace', title: 'Amazing Grace', author: 'melodia “New Britain” (1829), domínio público', key: 'Bb', tonic: 10, tempo: 80,
  levels: [
    { id: 'unissono', name: 'Uníssono', voices: 1, about: 'A melodia sozinha.', steps: melSteps(GRACE_MEL) },
    { id: 'coral', name: 'Coral a quatro', voices: 4, about: 'Harmonia de hinário: I, IV e V.', steps: buildSteps(withMel(GRACE_MEL, trc([['C'], ['F'], ['F'], ['F'], ['F'], ['C'], ['Bb'], ['Bb'], ['F'], ['C'], ['F'], ['F'], ['F'], ['Dm'], ['C'], ['C']], 5)), { n: 4, spread: true, lo: 45 }) },
    { id: 'blocos', name: 'Blocos de jazz a cinco', voices: 5, about: 'Tétrades e nonas sob a melodia.', steps: buildSteps(withMel(GRACE_MEL, trc([['C9sus4'], ['Fmaj9'], ['Fmaj9'], ['Dm9'], ['F69'], ['C9'], ['Bbmaj9'], ['Gm9'], ['F69'], ['C9sus4'], ['Fmaj9'], ['Am7'], ['Dm9'], ['Dm9'], ['G9'], ['C9sus4']], 5)), { n: 5, lo: 48 }) },
    { id: 'seis', name: 'Seis vozes', voices: 6, about: 'Gospel a seis: suspensos, empréstimo modal e dominantes secundários.', steps: buildSteps(withMel(GRACE_MEL, trc([['C13sus4'], ['Fmaj13'], ['Am7add11'], ['Dm11'], ['Fmaj13/A'], ['C13'], ['Bbmaj13'], ['Gm11'], ['F69'], ['C13sus4'], ['Fmaj13'], ['A7b13', 'Dominante secundário do vi grau.'], ['Dm11'], ['Dm11'], ['G13', 'V do V: prepara o dominante.'], ['C13sus4', 'Fim de frase suspenso: pede continuação.']], 5)), { n: 6, lo: 48 }) },
  ],
};

// "Greensleeves" (tradicional inglesa, séc. XVI), primeira frase, em Lá menor.
const GREEN_MEL = [[69, 1], [72, 2], [74, 1], [76, 1.5], [77, 0.5], [76, 1], [74, 2], [71, 1], [67, 1.5], [69, 0.5], [71, 1], [72, 2], [69, 1], [69, 1.5], [68, 0.5], [69, 1], [71, 2], [68, 1], [64, 3]];
export const GREEN = {
  id: 'green', title: 'Greensleeves', author: 'tradicional inglesa (séc. XVI), domínio público', key: 'C', tonic: 0, tempo: 96,
  levels: [
    { id: 'unissono', name: 'Uníssono', voices: 1, about: 'A melodia sozinha.', steps: melSteps(GREEN_MEL) },
    { id: 'coral', name: 'Coral a quatro', voices: 4, about: 'Tríades do campo menor, com o Mi maior como dominante.', steps: buildSteps(withMel(GREEN_MEL, [['Am'], ['Am'], ['G'], ['C'], ['F'], ['C'], ['G'], ['G'], ['Em'], ['F'], ['G'], ['Am'], ['Am'], ['F'], ['E'], ['Am'], ['E'], ['E'], ['E']]), { n: 4, spread: true, lo: 45 }) },
    { id: 'blocos', name: 'Blocos de jazz a cinco', voices: 5, about: 'Tétrades com nona e dominante alterado.', steps: buildSteps(withMel(GREEN_MEL, [['Am9'], ['Am9'], ['G9'], ['Cmaj9'], ['Dm9'], ['Cmaj9'], ['G9'], ['G9'], ['Em7'], ['Fmaj9'], ['G13'], ['Am9'], ['Fmaj9'], ['Dm9'], ['E7#9'], ['Am9'], ['E9sus4'], ['E7b13'], ['E7b9']]), { n: 5 }) },
    { id: 'seis', name: 'Seis vozes', voices: 6, about: 'Seis vozes em menor: m11, maj13 e dominantes com 13ª menor.', steps: buildSteps(withMel(GREEN_MEL, [['Am11'], ['Am11'], ['G13'], ['Cmaj13'], ['Dm11'], ['Cmaj13'], ['G13'], ['G13'], ['Em7add11'], ['Fmaj13'], ['G13'], ['Am11'], ['Fmaj13'], ['Dm11'], ['E7#9'], ['Am11'], ['Bm7b5', 'ii grau menor: prepara o dominante.'], ['E7b13'], ['E7b9', 'Meia cadência: a frase para no dominante.']]), { n: 6 }) },
  ],
};

// "Swing Low, Sweet Chariot" (spiritual, séc. XIX), refrão, em Lá bemol maior (escrita em Fá e transposta).
const SWING_MEL = up([[69, 1], [65, 3], [69, 1], [65, 1.5], [65, 0.5], [62, 1], [60, 3], [65, 0.5], [65, 0.5], [65, 0.5], [65, 0.5], [69, 1], [72, 1], [72, 4]], 3);
export const SWING = {
  id: 'swing', title: 'Swing Low, Sweet Chariot', author: 'spiritual (séc. XIX), domínio público', key: 'Ab', tonic: 8, tempo: 76,
  levels: [
    { id: 'unissono', name: 'Uníssono', voices: 1, about: 'A melodia sozinha.', steps: melSteps(SWING_MEL) },
    { id: 'coral', name: 'Coral a quatro', voices: 4, about: 'I e IV, como no canto congregacional.', steps: buildSteps(withMel(SWING_MEL, trc([['F'], ['F'], ['F'], ['Bb'], ['Bb'], ['Bb'], ['F'], ['F'], ['F'], ['Dm'], ['Dm'], ['F'], ['F'], ['C']], 3)), { n: 4, spread: true, lo: 45 }) },
    { id: 'blocos', name: 'Blocos de jazz a cinco', voices: 5, about: 'Sextas e nonas em bloco.', steps: buildSteps(withMel(SWING_MEL, trc([['F69'], ['Fmaj9'], ['Dm9'], ['Bbmaj9'], ['Gm9'], ['Bbmaj9'], ['C9sus4'], ['F69'], ['Dm9'], ['Gm9'], ['Bbmaj9'], ['Fmaj9'], ['Am7'], ['C9sus4']], 3)), { n: 5, lo: 48 }) },
    { id: 'seis', name: 'Seis vozes', voices: 6, about: 'Seis vozes com cor de gospel.', steps: buildSteps(withMel(SWING_MEL, trc([['Fmaj13'], ['Dm11'], ['F13', 'O I vira dominante: empurra para o IV.'], ['Bbmaj13'], ['Gm11'], ['Bbmaj13'], ['C13sus4'], ['Fmaj13'], ['Dm11'], ['Gm11'], ['Bbm6', 'iv menor emprestado do tom menor.'], ['Fmaj13/A'], ['Am7add11'], ['C13sus4', 'Suspenso no fim: pede a resposta.']], 3)), { n: 6, lo: 48 }) },
  ],
};

export const MELODIES = [ODE, GRACE, GREEN, SWING];
for (const mel of MELODIES) for (const lv of mel.levels) for (const s of lv.steps) if (s.c) s.auto = describeStep(s, mel.tonic);

/** Arranjos a seis vozes disponíveis na Imersão, no "Cante a sua voz", na mesa e no projeto final. */
export const ARRANGEMENTS = [
  AURORA, MARE, NOTURNO,
  ...MELODIES.map((m) => ({ id: m.id, title: m.title, key: m.key, tonic: m.tonic, tempo: m.tempo, about: `${m.author}. Rearmonização a seis vozes.`, steps: m.levels[3].steps, voices: 6 })),
];
export const getArrangement = (id) => ARRANGEMENTS.find((a) => a.id === id) || AURORA;

// ---------- exemplos curtos usados nas aulas (escritos à mão) ----------
export const II_V_I_BLOCOS = [
  { c: 'Dm7', n: [50, 53, 57, 60], d: 2, t: 'Posição fundamental.' },
  { c: 'G7', n: [55, 59, 62, 65], d: 2, t: 'Todas as vozes saltam juntas uma quarta acima.' },
  { c: 'Cmaj7', n: [48, 52, 55, 59], d: 4, t: 'E saltam de novo, agora para baixo.' },
];
export const II_V_I_SUAVE = [
  { c: 'Dm7', n: [50, 53, 57, 60], d: 2, t: 'O mesmo começo.' },
  { c: 'G7/D', n: [50, 53, 55, 59], d: 2, t: 'Duas vozes ficam; as outras descem um grau.' },
  { c: 'Cmaj7', n: [48, 52, 55, 59], d: 4, t: 'De novo: duas ficam, duas descem.' },
];
