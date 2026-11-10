import test from 'node:test';
import assert from 'node:assert/strict';
import { parseChord, voiceChord, voicings, CHORD_TYPES, ROOT_NAMES, pc, field, analyze, degreeOf } from '../js/music/theory.js';

const set = (sym) => [...parseChord(sym).pcs].sort((a, b) => a - b);
test('cifras: notas corretas', () => {
  assert.deepEqual(set('C'), [0, 4, 7]);
  assert.deepEqual(set('Cm'), [0, 3, 7]);
  assert.deepEqual(set('Cdim'), [0, 3, 6]);
  assert.deepEqual(set('Caug'), [0, 4, 8]);
  assert.deepEqual(set('Cmaj7'), [0, 4, 7, 11]);
  assert.deepEqual(set('Dm7'), [0, 2, 5, 9]);
  assert.deepEqual(set('G7'), [2, 5, 7, 11]);
  assert.deepEqual(set('Bm7b5'), [2, 5, 9, 11]);
  assert.deepEqual(set('Bdim7'), [2, 5, 8, 11]);
  assert.deepEqual(set('Cmaj13'), [0, 2, 4, 7, 9, 11]);
  assert.deepEqual(set('Dm11'), [0, 2, 4, 5, 7, 9]);
  assert.deepEqual(set('G13'), [2, 4, 5, 7, 9, 11]);
  assert.deepEqual(set('G13b9'), [2, 4, 5, 7, 8, 11]);
  assert.deepEqual(set('G7#9'), [2, 5, 7, 10, 11]);
  assert.deepEqual(set('G7b13'), [3, 5, 7, 11]);
  assert.deepEqual(set('G9sus4'), [0, 2, 5, 7, 9]);
  assert.deepEqual(set('C69'), [0, 2, 4, 7, 9]);
  assert.deepEqual(set('Cm(maj7)'), [0, 3, 7, 11]);
  assert.deepEqual(set('Cmaj7#11'), [0, 4, 6, 7, 11]);
  assert.deepEqual(set('Db7#11'), [1, 5, 7, 8, 11]);
  assert.deepEqual(set('C/E'), [0, 4, 7]);
  assert.equal(parseChord('C/E').bass, 4);
  assert.deepEqual(set('Fm6'), [0, 2, 5, 8]);
  assert.deepEqual(set('Cadd9'), [0, 2, 4, 7]);
  assert.deepEqual(set('G7alt'), [1, 3, 5, 7, 8, 10, 11].filter((x) => [7, 11, 5, 8, 10, 1, 3].includes(x)).sort((a, b) => a - b));
  assert.throws(() => parseChord('Cxyz'));
});

test('estúdio de acordes: pelo menos 20 tipos, todos interpretáveis nas 12 fundamentais e nas 4 aberturas', () => {
  assert.ok(CHORD_TYPES.length >= 20);
  for (const r of ROOT_NAMES) for (const t of CHORD_TYPES) {
    const ch = parseChord(r + t.id);
    for (const kind of ['fechada', 'drop2', 'aberta', 'seis']) {
      const v = voicings(r + t.id, kind);
      assert.ok(v.length >= 3, `${r}${t.id} ${kind}: poucas notas`);
      for (let i = 1; i < v.length; i++) assert.ok(v[i] > v[i - 1], `${r}${t.id} ${kind}: fora de ordem ${v}`);
      for (const m of v) assert.ok(ch.pcs.has(pc(m)), `${r}${t.id} ${kind}: nota ${m} fora do acorde`);
      assert.ok(v[0] >= 33 && v[v.length - 1] <= 84, `${r}${t.id} ${kind}: fora da faixa ${v}`);
    }
  }
});

test('seis vozes: notas diferentes, terça e sétima no miolo, baixo na fundamental', () => {
  for (const sym of ['Cmaj13', 'Dm11', 'G13', 'Fmaj13', 'Am11', 'Bb13', 'Ebmaj13', 'G13b9', 'Abmaj7#11', 'D9sus4']) {
    const ch = parseChord(sym), v = voiceChord(sym);
    assert.equal(v.length, 6);
    assert.equal(pc(v[0]), ch.bass, `${sym}: baixo`);
    const pcs = new Set(v.map(pc));
    assert.equal(pcs.size, Math.min(6, ch.pcs.size), `${sym}: ${v} deveria ter notas diferentes`);
    const inner = v.slice(1, 5).map((m) => degreeOf(ch, m));
    const topDeg = degreeOf(ch, v[5]);
    for (const t of ch.tones) if (/^(b?3|4)$/.test(t.deg) || /^(b?7)$/.test(t.deg)) assert.ok(inner.includes(t.deg) || topDeg === t.deg, `${sym}: falta ${t.deg} em ${v}`);
    for (let i = 2; i < 6; i++) assert.ok(v[i] - v[i - 1] <= 9, `${sym}: miolo espalhado ${v}`);
  }
});

test('condução: vozes internas andam pouco em um ii–V–I', () => {
  const a = voiceChord('Dm11', { top: 67 }), b = voiceChord('G13', { top: 64, prev: a }), c = voiceChord('Cmaj13', { top: 62, prev: b });
  for (const [x, y] of [[a, b], [b, c]]) for (let i = 1; i < 5; i++) assert.ok(Math.abs(x[i] - y[i]) <= 4, `voz ${i}: ${x} → ${y}`);
});

test('campo harmônico e funções', () => {
  assert.deepEqual(field(0).map((x) => x.sym), ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5']);
  assert.deepEqual(field(0).map((x) => x.fn), ['T', 'SD', 'T', 'SD', 'D', 'T', 'D']);
  assert.deepEqual(field(9, true).map((x) => x.sym), ['Am7', 'Bm7b5', 'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7']);
  assert.deepEqual(field(5, false, false).map((x) => x.sym), ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim']);
  assert.equal(analyze('A7', 0).rn, 'V/ii');
  assert.equal(analyze('Db7', 0).rn, 'sub V');
  assert.equal(analyze('Fm6', 0).rn, 'iv');
  assert.equal(analyze('G13', 0).fn, 'D');
});
