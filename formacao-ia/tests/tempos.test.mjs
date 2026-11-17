// Texto grifado: as unidades faladas são exatamente o texto narrado; os tempos do M1 existem, crescem e
// apontam para trechos que existem na tela; o cálculo puxa o começo para as pausas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ORDEM, licao, moduloDe } from '../js/data/curso.js';
import { pecasDaAula, unidadesDaAula, textoPuro } from '../tools/audio/ssml.mjs';
import { temposDaParte } from '../tools/audio/tempos.mjs';
import { trechoEm } from '../js/core/grifo.js';

const tempos = JSON.parse(readFileSync(new URL('../audio/tempos.json', import.meta.url), 'utf8'));
const sem = (x) => x.replace(/\s+/g, '');

test('unidades = texto narrado, nas 98 aulas', () => {
  for (const id of ORDEM) {
    const L = licao(id);
    assert.equal(sem(textoPuro(unidadesDaAula(L).map((u) => u.ssml).join(''))), sem(textoPuro(pecasDaAula(L).join(''))), id);
  }
});

test('chaves das unidades batem com os blocos da tela', () => {
  for (const id of ORDEM) {
    const L = licao(id);
    for (const u of unidadesDaAula(L)) {
      const m = /^b(\d+)(?:\.(\d+))?$/.exec(u.chave);
      if (!m) { assert.ok(['tit', 'gancho', 'analogia', 'erro-t', 'erro-d', 'fim'].includes(u.chave), `${id} ${u.chave}`); continue; }
      const b = (u.parte === 'passo-1' ? L.ideia : L.exemplo)[+m[1]];
      const itens = b && (b.ul || b.ol || b.passos || (b.tab && b.tab.r));
      if (m[2] == null) assert.ok(b && !itens, `${id} ${u.chave}`);
      else assert.ok(itens && +m[2] < itens.length, `${id} ${u.chave}`);
    }
  }
});

test('tempos das 98 aulas: todas as partes, em ordem crescente', () => {
  const m1 = ORDEM;
  for (const id of m1) {
    assert.ok(tempos[id], id);
    const uni = unidadesDaAula(licao(id));
    let ant = -1;
    for (const parte of ['passo-0', 'passo-1', 'passo-2', 'passo-5']) {
      const lin = tempos[id][parte];
      assert.deepEqual(lin.map((x) => x[0]), uni.filter((u) => u.parte === parte).map((u) => u.chave), `${id} ${parte}`);
      for (const [, t] of lin) { assert.ok(t > ant || (t === 0 && ant === -1), `${id} ${parte} ${t}`); ant = t; }
    }
  }
});

test('cálculo: proporcional aos caracteres e puxado para a pausa mais próxima', () => {
  const u = [{ chave: 'a', ssml: '<p>' + 'x'.repeat(100) + '</p>' }, { chave: 'b', ssml: '<p>' + 'x'.repeat(100) + '</p>' }];
  assert.deepEqual(temposDaParte(u, 10, 30, []), [['a', 10], ['b', 20]]);
  assert.deepEqual(temposDaParte(u, 10, 30, [{ ini: 20.4, fim: 21, dur: 0.6 }]), [['a', 10], ['b', 20.88]]);
  assert.deepEqual(temposDaParte(u, 10, 30, [{ ini: 23, fim: 23.6, dur: 0.6 }]), [['a', 10], ['b', 20]], 'pausa longe demais (> 1,5 s) não puxa');
});

test('trecho no tempo t', () => {
  const a = { 'passo-1': [['tit', 3], ['analogia', 3.8], ['b0', 4.6]] };
  assert.equal(trechoEm(a, 3.5).chave, 'tit');
  assert.equal(trechoEm(a, 4.0).chave, 'analogia');
  assert.equal(trechoEm(a, 9).chave, 'b0');
  assert.equal(trechoEm(a, 1), null);
  assert.equal(trechoEm({ 'passo-2': undefined }, 1), null);
});
