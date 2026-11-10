import test from 'node:test';
import assert from 'node:assert/strict';
import { KINDS, pool, answers, answerOf, newState, nextItem, grade, buildSound } from '../js/music/ear.js';

test('ouvido: sete tipos, todos geram som e resposta válida em todos os níveis', () => {
  assert.deepEqual(KINDS.map((k) => k.id), ['intervalos', 'triades', 'tetrades', 'tensoes', 'funcoes', 'cadencias', 'voz']);
  for (const k of KINDS) for (let lv = 1; lv <= 3; lv++) for (const item of pool(k, lv)) {
    const ev = buildSound(k, item, lv);
    assert.ok(ev.length >= 2, `${k.id}/${item}`);
    for (const e of ev) for (const m of e.notes) assert.ok(m >= 30 && m <= 90, `${k.id}/${item}: nota ${m}`);
    assert.ok(answers(k, lv).includes(answerOf(k, item)), `${k.id}/${item}: resposta fora das opções`);
  }
});

test('ouvido: sobe de nível com acertos, desce com erros e repete o que foi errado', () => {
  const k = KINDS[0], st = newState();
  for (let i = 0; i < 5; i++) { const { item } = nextItem(k, st); grade(k, st, item, true); }
  assert.equal(st.level, 2);
  const wrong = nextItem(k, st).item; grade(k, st, wrong, false);
  const seen = []; for (let i = 0; i < 4; i++) { const q = nextItem(k, st); seen.push(q); grade(k, st, q.item, true); }
  assert.ok(seen.some((q) => q.review && q.item === wrong), 'o item errado deveria voltar');
  for (let i = 0; i < 3; i++) { const { item } = nextItem(k, st); grade(k, st, item, false); }
  assert.equal(st.level, 1);
});

test('ouvido: "qual voz mexeu" altera exatamente uma voz', () => {
  const k = KINDS[6];
  for (const item of ['Baixo', 'Tenor', 'Contralto', 'Soprano']) { const [a, b] = buildSound(k, item, 2); const diff = a.notes.map((m, i) => m !== b.notes[i]); assert.equal(diff.filter(Boolean).length, 1); assert.equal(diff.indexOf(true), ['Baixo', 'Tenor', 'Contralto', 'Soprano'].indexOf(item)); }
});
