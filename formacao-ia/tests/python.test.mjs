// Roda a solução de cada exercício de Python no mesmo MicroPython do app e confere com os testes da lição.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadMicroPython } from '../assets/micropython/micropython.mjs';
import { HARNESS } from '../js/labs/py-harness.js';
import { TODAS } from '../js/data/curso.js';
import { limparErro } from '../js/labs/python-texto.js';

const saida = [];
const mp = await loadMicroPython({ stdout: (l) => saida.push(l), stderr: (l) => saida.push(l), linebuffer: true });
function rodar(codigo, entradas = [], depois = '') {
  saida.length = 0;
  mp.globals.set('_src', codigo); mp.globals.set('_ent', JSON.stringify(entradas)); mp.globals.set('_dep', depois); mp.globals.set('_eco', false);
  mp.runPython(HARNESS);
  return { texto: saida.join('\n'), erro: mp.globals.get('_res') === 'erro', dep: mp.globals.get('_depr') };
}
const norm = (s) => s.split('\n').map((l) => l.trimEnd()).join('\n').trim();
const solucao = (ex) => ex.solucao || ex.molde.replace(/⟦\d:([^⟧¦]*)(¦[^⟧]*)?⟧/g, '$1');

const exs = TODAS.filter((L) => (L.ex.tipo === 'lacunas' && L.ex.modo === 'python') || L.ex.tipo === 'python');
test('há exercícios de Python', () => assert.ok(exs.length >= 9));
for (const L of exs) test(`Python ${L.id}: a solução passa nos testes`, () => {
  for (const t of L.ex.testes) {
    const r = rodar(solucao(L.ex), t.entradas || [], t.depois || '');
    assert.equal(r.erro, false, r.texto);
    if (t.saida != null) assert.equal(norm(r.texto), norm(t.saida));
    if (t.re) assert.match(norm(r.texto), new RegExp(t.re));
    if (t.depois) assert.equal(r.dep, 'sim');
  }
  if (L.ex.inicio) assert.equal(rodar(L.ex.inicio).erro, true, 'o código inicial do exercício de erros deveria falhar');
});
test('exemplos executáveis das lições rodam sem erro', () => {
  let n = 0;
  for (const L of TODAS) for (const b of [...L.ideia, ...L.exemplo]) if (b && b.run) { n++; const r = rodar(b.c, b.ent || []); assert.equal(r.erro, false, `${L.id}: ${r.texto}`); }
  assert.ok(n >= 6);
});
test('mensagens de erro ficam legíveis', () => {
  const r = rodar('x = 1\nprint(nme)');
  assert.equal(r.erro, true);
  const t = limparErro(r.texto);
  assert.match(t, /linha 2 do seu código/); assert.match(t, /NameError/); assert.doesNotMatch(t, /stdin/);
  assert.match(rodar('print("oi"').texto, /SyntaxError/);
  assert.equal(rodar('print(input())', []).erro, true);
});
