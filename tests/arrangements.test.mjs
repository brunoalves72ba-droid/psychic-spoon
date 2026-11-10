// Confere, em cada passo de cada progressão, se as notas pertencem ao acorde da cifra.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseChord, pc } from '../js/music/theory.js';
import { ARRANGEMENTS, MELODIES, II_V_I_BLOCOS, II_V_I_SUAVE } from '../js/music/arrangements.js';
import { AULAS, aulaProgressions } from '../js/data/aulas.js';

function check(name, steps, { voices } = {}) {
  steps.forEach((s, i) => {
    const where = `${name}, passo ${i + 1} (${s.c || 'melodia'})`;
    assert.ok(s.d > 0, `${where}: duração`);
    for (let k = 1; k < s.n.length; k++) assert.ok(s.n[k] > s.n[k - 1], `${where}: vozes cruzadas ou repetidas ${s.n}`);
    for (const m of s.n) assert.ok(m >= 33 && m <= 84, `${where}: nota ${m} fora da faixa cantável`);
    if (!s.c) return;
    const ch = parseChord(s.c);
    for (const m of s.n) assert.ok(ch.pcs.has(pc(m)), `${where}: nota ${m} não pertence ao acorde`);
    if (s.n.length > 1) assert.equal(pc(s.n[0]), ch.bass, `${where}: o baixo deveria cantar a fundamental (ou o baixo da cifra)`);
    if (voices) assert.equal(s.n.length, voices, `${where}: número de vozes`);
    if (s.n.length === 6) {
      const distinct = new Set(s.n.map(pc)).size, possible = Math.min(ch.pcs.size, 6 - (pc(s.n[5]) === ch.bass ? 1 : 0));
      assert.ok(distinct >= possible - (s.loose ? 1 : 0), `${where}: ${distinct} notas diferentes, daria para ter ${possible} (${s.n})`);
      const has = (re) => ch.tones.filter((t) => re.test(t.deg)).every((t) => s.n.slice(1).some((m) => pc(m) === pc(ch.root + t.iv)));
      assert.ok(has(/^(b?3|4|2)$/), `${where}: falta a terça`);
      assert.ok(has(/^(b?7|bb7)$/), `${where}: falta a sétima`);
    }
  });
}

test('arranjos a seis vozes: notas da cifra, seis notas diferentes, terça e sétima presentes', () => {
  assert.ok(ARRANGEMENTS.length >= 5);
  for (const a of ARRANGEMENTS) check(a.title, a.steps, { voices: 6 });
});

test('arranjos a seis vozes: vozes internas por grau conjunto na maior parte do tempo', () => {
  for (const a of ARRANGEMENTS) {
    let moves = 0, steps = 0;
    for (let i = 1; i < a.steps.length; i++) for (let v = 1; v < 5; v++) { moves++; if (Math.abs(a.steps[i].n[v] - a.steps[i - 1].n[v]) <= 2) steps++; }
    assert.ok(steps / moves >= 0.6, `${a.title}: só ${(100 * steps / moves).toFixed(0)}% dos movimentos internos são por grau conjunto`);
  }
});

test('melodias de domínio público: quatro níveis, mesma melodia no topo', () => {
  for (const mel of MELODIES) {
    assert.equal(mel.levels.length, 4);
    const top = mel.levels[0].steps.map((s) => s.n[0]);
    for (const lv of mel.levels) {
      check(`${mel.title} · ${lv.name}`, lv.steps, { voices: lv.voices });
      assert.deepEqual(lv.steps.map((s) => s.n[s.n.length - 1]), top, `${mel.title} · ${lv.name}: a melodia mudou`);
    }
  }
});

test('exemplos das aulas: todas as progressões conferem com as cifras', () => {
  check('ii–V–I em blocos', II_V_I_BLOCOS); check('ii–V–I suave', II_V_I_SUAVE);
  assert.equal(AULAS.length, 16);
  let n = 0;
  for (const [name, steps] of aulaProgressions()) { check(name, steps); n++; }
  assert.ok(n >= 20, 'poucas progressões nas aulas: ' + n);
  for (const a of AULAS) { assert.equal(a.quiz.length, 3, `aula ${a.id}: três perguntas`); for (const q of a.quiz) assert.ok(q.a >= 0 && q.a < q.o.length); assert.ok(a.lab && a.sing && a.text.length >= 2, `aula ${a.id} incompleta`); }
});
