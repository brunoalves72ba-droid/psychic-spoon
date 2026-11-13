// Valida o conteúdo: as 98 micro-lições do documento, cada uma com os 7 passos completos.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MODULOS, TODAS, ORDEM, licao, cartao, proxima, seguinte, idsDoModulo, moduloDe } from '../js/data/curso.js';
import { PROJETO, missao, proximaMissao } from '../js/data/projeto.js';
import { RECURSOS } from '../js/data/recursos.js';
import { parseMolde } from '../js/core/andaime.js';
import { TIPOS_EX } from '../js/core/exercicios.js';

const ESPERADO = { 0: 6, 1: 12, 2: 12, 3: 14, 4: 18, 5: 20, 6: 16 }; // total: 98
const LABS = ['proximo', 'tokens', 'contexto', 'json', 'api', 'cosseno', 'chunks', 'rag', 'n8n-expr', 'n8n-if', 'backoff', 'agente', 'prompt', 'python'];
const ROTAS = /^#\/(hoje|trilha|licao|revisar|projeto|progresso|labs|mais|foco)(\/[\w.\-/]*)?$/;

const textos = (v, out = []) => { if (typeof v === 'string') out.push(v); else if (Array.isArray(v)) v.forEach((x) => textos(x, out)); else if (v && typeof v === 'object') Object.values(v).forEach((x) => textos(x, out)); return out; };

test('trilha: 7 módulos e a numeração do documento', () => {
  assert.equal(MODULOS.length, 7);
  for (const m of MODULOS) {
    const ids = idsDoModulo(m.n);
    assert.equal(ids.length, ESPERADO[m.n], `M${m.n} deveria ter ${ESPERADO[m.n]} lições (tem ${ids.length})`);
    ids.forEach((id, i) => assert.equal(id, `${m.n}.${i + 1}`, `ordem das lições do M${m.n}`));
  }
  assert.equal(ORDEM.length, 98);
  assert.equal(new Set(ORDEM).size, ORDEM.length, 'ids repetidos');
  assert.equal(MODULOS.reduce((a, m) => a + m.horas, 0), 116); // ≈120 h do documento: 6+10+10+12+22+28+28
});

for (const L of TODAS) {
  test(`lição ${L.id}: ${L.t}`, () => {
    assert.match(L.id, /^\d\.\d{1,2}$/);
    assert.ok(L.t && L.t.length <= 60, 'título');
    assert.ok(Number.isInteger(L.min) && L.min >= 5 && L.min <= 10, 'micro-lição de 5 a 10 min');
    assert.ok(L.gancho && L.gancho.length >= 30 && L.gancho.length <= 280, `gancho curto (${L.gancho && L.gancho.length})`);
    assert.ok(L.analogia && L.analogia.length >= 30, 'analogia');
    assert.ok(Array.isArray(L.ideia) && L.ideia.length >= 3, 'ideia com pelo menos 3 blocos');
    assert.ok(Array.isArray(L.exemplo) && L.exemplo.length >= 1, 'exemplo resolvido');
    assert.ok(L.erro && L.erro.t && L.erro.d && L.erro.d.length >= 40, 'erro comum');

    // quiz: 2 a 3 perguntas, 3 opções, a primeira é a correta, com explicação
    assert.ok(Array.isArray(L.quiz) && L.quiz.length >= 2 && L.quiz.length <= 3, 'quiz de 2 a 3 perguntas');
    for (const q of L.quiz) {
      assert.ok(q.q && q.q.length >= 12, 'pergunta');
      assert.ok(Array.isArray(q.o) && q.o.length === 3, `3 opções em “${q.q}”`);
      assert.equal(new Set(q.o).size, q.o.length, `opções repetidas em “${q.q}”`);
      assert.ok(q.w && q.w.length >= 20, `explicação em “${q.q}”`);
    }

    // exercício
    const ex = L.ex;
    assert.ok(ex && TIPOS_EX.includes(ex.tipo), `tipo de exercício: ${ex && ex.tipo}`);
    if (ex.tipo === 'classificar') {
      assert.ok(ex.baldes.length >= 2 && ex.itens.length >= 4);
      for (const it of ex.itens) assert.ok(Number.isInteger(it.b) && it.b >= 0 && it.b < ex.baldes.length && it.t, 'item de classificação');
      assert.equal(new Set(ex.itens.map((i) => i.b)).size, ex.baldes.length, 'toda categoria precisa de pelo menos um item');
      assert.equal(new Set(ex.itens.map((i) => i.t)).size, ex.itens.length, 'itens repetidos');
    } else if (ex.tipo === 'ordenar') {
      assert.ok(ex.itens.length >= 4 && ex.itens.length <= 7 && new Set(ex.itens).size === ex.itens.length);
    } else if (ex.tipo === 'lacunas') {
      const lac = parseMolde(ex.molde).filter((p) => p.t === 'lac');
      assert.ok(lac.length >= 1, 'molde sem lacunas');
      assert.ok(!/[⟦⟧]/.test(parseMolde(ex.molde).filter((p) => p.t === 'txt').map((p) => p.v).join('')), 'lacuna mal formada');
      if (ex.opcoes) for (const p of lac) assert.ok(ex.opcoes.includes(p.v), `opção ausente para a lacuna “${p.v}”`);
      if (ex.modo === 'python') assert.ok(Array.isArray(ex.testes) && ex.testes.length >= 1, 'exercício Python sem testes');
    } else if (ex.tipo === 'python') {
      assert.ok(Array.isArray(ex.testes) && ex.testes.length >= 1 && ex.solucao && ex.enun, 'exercício Python precisa de enunciado, solução e testes');
    } else if (ex.tipo === 'texto') {
      assert.ok(ex.campos || ex.checks || ex.min, 'exercício de texto sem critérios');
      for (const c of ex.campos || []) { assert.ok(c.rot); if (c.re) new RegExp(c.re, 'i'); }
      for (const c of ex.checks || []) { assert.ok(c.rot); if (c.re) new RegExp(c.re, c.flags || 'i'); }
    } else if (ex.tipo === 'json') {
      assert.ok(ex.inicial != null || ex.espera, 'exercício de JSON');
    } else if (ex.tipo === 'escolha') {
      assert.ok(ex.casos.length >= 2);
      for (const c of ex.casos) { assert.ok(c.q && c.o.length === 3 && c.w && new Set(c.o).size === 3, `caso “${c.q}”`); }
    } else if (ex.tipo === 'lab') {
      assert.ok(LABS.includes(ex.lab), `laboratório desconhecido: ${ex.lab}`);
      assert.ok(typeof ex.missao === 'string', 'laboratório sem missão');
    } else if (ex.tipo === 'refletir') {
      assert.ok(ex.modelo && ex.modelo.length >= 40);
    }
    assert.ok(ex.enun || ex.tipo === 'python', 'enunciado do exercício');

    // mão na massa (opcional)
    if (L.mao) {
      assert.ok(L.mao.t && ['pc', 'qualquer'].includes(L.mao.onde));
      assert.ok(L.mao.passos.length >= 2 && L.mao.passos.length <= 6 && L.mao.criterio && L.mao.criterio.length >= 20, 'mão na massa');
    }

    // texto: marcações equilibradas, links internos válidos, tamanho de micro-lição
    const ts = textos(L);
    for (const s of ts) {
      if (/⟦/.test(s)) continue; // moldes têm sintaxe própria
      const semCodigo = s.split('\n').length > 1 ? null : s; // blocos de código (multilinha) não usam marcação
      if (semCodigo != null) {
        assert.equal((semCodigo.match(/`/g) || []).length % 2, 0, `crase sem par: ${s.slice(0, 60)}`);
        assert.equal((semCodigo.replace(/`[^`]*`/g, '').match(/\*\*/g) || []).length % 2, 0, `negrito sem par: ${s.slice(0, 60)}`);
      }
      for (const m of s.matchAll(/\]\((#\/[^)\s]*)\)/g)) assert.match(m[1], ROTAS, `link interno: ${m[1]}`);
      assert.ok(!/\b(TODO|FIXME)\b|lorem ipsum/.test(s), 'resto de rascunho');
    }
    const prosa = [L.gancho, L.analogia, ...textos(L.ideia), ...textos(L.exemplo), L.erro.d].join(' ');
    const palavras = prosa.split(/\s+/).length;
    assert.ok(palavras >= 150 && palavras <= 620, `tamanho da leitura: ${palavras} palavras (5 a 10 min com exercício e quiz)`);
  });
}

test('cartões: cada pergunta do quiz vira um cartão que funciona sem as opções', () => {
  const frentes = new Set();
  for (const L of TODAS) L.quiz.forEach((q, i) => {
    const c = cartao(`${L.id}#${i}`);
    assert.equal(c.f, q.q); assert.equal(c.v, q.o[0]); assert.equal(c.lid, L.id); assert.equal(c.m, moduloDe(L.id));
    assert.ok(!frentes.has(q.q), `pergunta repetida no curso: ${q.q}`); frentes.add(q.q);
    assert.ok(!/qual das (opções|alternativas)|todas as (anteriores|acima)|nenhuma das/i.test(q.q + q.o.join(' ')), `pergunta depende das opções: ${q.q}`);
  });
  assert.ok(frentes.size >= 98 * 2);
  assert.equal(cartao('9.9#0'), null);
  assert.deepEqual(cartao('u1', [{ id: 'u1', f: 'a', v: 'b' }]), { id: 'u1', f: 'a', v: 'b', w: '', meu: true });
});

test('navegação da trilha: próxima lição, retomada e fim', () => {
  assert.equal(proxima({}, null), '0.1');
  assert.equal(proxima({ '0.1': { feita: 'x' } }, null), '0.2');
  assert.equal(proxima({ '0.1': { feita: 'x' } }, '1.3'), '1.3');
  assert.equal(proxima({ '1.3': { feita: 'x' } }, '1.3'), '0.1');
  assert.equal(proxima(Object.fromEntries(ORDEM.map((id) => [id, { feita: 'x' }])), null), null);
  assert.equal(seguinte('0.6'), '1.1'); assert.equal(seguinte(ORDEM[ORDEM.length - 1]), null);
  assert.equal(licao('1.1').t, 'IA, ML e IA generativa'); assert.equal(licao('x'), null);
});

test('projeto: 7 entregas com missões de 10 a 25 minutos', () => {
  assert.equal(PROJETO.length, 7);
  const ids = new Set();
  PROJETO.forEach((p, i) => {
    assert.equal(p.m, i); assert.ok(p.t && p.entrega && p.pronto);
    assert.ok(p.missoes.length >= 2);
    for (const ms of p.missoes) { assert.ok(!ids.has(ms.id)); ids.add(ms.id); assert.ok(ms.min >= 10 && ms.min <= 25, `${ms.id}: ${ms.min} min`); assert.ok(ms.itens.length >= 2 && ms.itens.length <= 5, ms.id); }
  });
  assert.ok(missao('m6-final')); assert.equal(missao('nao-existe'), null);
  assert.equal(proximaMissao({}, 0).id, 'm0-pastas');
  assert.equal(proximaMissao({ 'm0-pastas': { feita: 'x' }, 'm0-diario': { feita: 'x' } }, 0), null);
  assert.equal(proximaMissao({ 'm0-pastas': { feita: 'x' }, 'm0-diario': { feita: 'x' } }, 1).id, 'm1-modelos');
});

test('recursos externos: links https por módulo', () => {
  for (let m = 1; m <= 6; m++) { assert.ok(RECURSOS[m].length >= 3, `M${m}`); for (const r of RECURSOS[m]) { assert.ok(r.t && r.de); assert.match(r.u, /^https:\/\//); } }
});
