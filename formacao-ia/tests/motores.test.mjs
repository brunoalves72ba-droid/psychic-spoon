// Testes dos motores puros: datas, revisão espaçada, sequência semanal, andaime, plano, JSON e texto.
import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, diffDays, dow, weekStart, weekDays } from '../js/core/dia.js';
import { ESCADA, TETO, novoCartao, responder, vencidos, fila, previsao, retencao, resumo } from '../js/core/srs.js';
import { novaSequencia, fechar, semanaAtual, diasAtivos } from '../js/core/sequencia.js';
import { parseMolde, solucao, aplicarNivel, confere, novoAndaime, registrar, maiorNivel } from '../js/core/andaime.js';
import { PLANOS, calendario, situacao, recalcular } from '../js/core/plano.js';
import { analisar, conferirFormato } from '../js/core/json-pt.js';
import { tokensAprox, contarPalavras, softmax, amostrar, cosseno, chunk, criarIndice, buscar, termos } from '../js/core/texto.js';

test('datas: soma, diferença e semana começando na segunda', () => {
  assert.equal(addDays('2026-11-13', 1), '2026-11-14');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(diffDays('2026-11-20', '2026-11-13'), 7);
  assert.equal(dow('2026-11-13'), 4); // sexta
  assert.equal(dow('2026-11-15'), 6); // domingo
  assert.equal(weekStart('2026-11-13'), '2026-11-09');
  assert.equal(weekStart('2026-11-09'), '2026-11-09');
  assert.equal(weekStart('2026-11-15'), '2026-11-09');
  assert.deepEqual(weekDays('2026-11-09').slice(-1), ['2026-11-15']);
});

test('revisão espaçada: o conceito volta em 1, 3, 7 e 21 dias', () => {
  assert.deepEqual(ESCADA.slice(0, 4), [1, 3, 7, 21]);
  let c = novoCartao('2026-01-01');
  assert.equal(c.due, '2026-01-02');
  const datas = [];
  let dia = c.due;
  for (let i = 0; i < 4; i++) { const r = responder(c, 'lembrei', dia); c = r.cartao; datas.push(diffDays(c.due, dia)); dia = c.due; }
  assert.deepEqual(datas, [3, 7, 21, 60]);
});

test('revisão espaçada: errar volta para amanhã; difícil repete o intervalo; nada é perdido', () => {
  let c = { s: 3, due: '2026-02-01', n: 5, l: 0 };
  const dif = responder(c, 'dificil', '2026-02-01');
  assert.equal(dif.cartao.s, 3); assert.equal(dif.cartao.due, '2026-02-22'); assert.equal(dif.log.ok, true); assert.equal(dif.log.int, 21);
  const err = responder(c, 'errei', '2026-02-03');
  assert.equal(err.cartao.s, 0); assert.equal(err.cartao.due, '2026-02-04'); assert.equal(err.cartao.l, 1); assert.equal(err.log.ok, false); assert.equal(err.log.atraso, 2);
  assert.equal(err.cartao.n, 6);
  const topo = responder({ s: 5, due: '2026-02-01', n: 9, l: 0 }, 'lembrei', '2026-02-01');
  assert.equal(topo.cartao.s, 5); assert.equal(topo.cartao.due, addDays('2026-02-01', 120));
  assert.throws(() => responder(c, 'facil', '2026-02-01'));
});

test('revisão espaçada: fila respeita o teto de 15 e prioriza os mais atrasados', () => {
  const cartoes = {};
  for (let i = 0; i < 40; i++) cartoes['c' + String(i).padStart(2, '0')] = { s: 0, due: addDays('2026-03-01', -i), n: 0, l: 0 };
  cartoes.futuro = { s: 1, due: '2026-03-05', n: 1, l: 0 };
  assert.equal(TETO, 15);
  const f = fila(cartoes, '2026-03-01');
  assert.equal(f.length, 15);
  assert.equal(f[0], 'c39');
  assert.equal(vencidos(cartoes, '2026-03-01').length, 40);
  assert.equal(previsao(cartoes, '2026-03-01', 7)[3], 1);
  assert.equal(resumo(cartoes).total, 41);
});

test('retenção medida aos 7 e aos 21 dias', () => {
  const logs = [{ int: 7, ok: true }, { int: 7, ok: true }, { int: 7, ok: false }, { int: 7, ok: true }, { int: 21, ok: true }, { int: 1, ok: false }];
  assert.deepEqual(retencao(logs, 7), { n: 4, taxa: 0.75 });
  assert.deepEqual(retencao(logs, 21), { n: 1, taxa: 1 });
  assert.deepEqual(retencao(logs, 60), { n: 0, taxa: null });
});

const dias = (lista) => Object.fromEntries(lista.map((d) => [d, { c: 1 }]));
test('sequência que perdoa: 4 de 7 conta, a primeira semana nunca é falha', () => {
  // começou numa sexta (13/11/2026): 2 dias na primeira semana
  const d = dias(['2026-11-13', '2026-11-14', '2026-11-16', '2026-11-17', '2026-11-19', '2026-11-21']);
  const r = fechar(novaSequencia(), d, '2026-11-23');
  assert.deepEqual(r.eventos.map((e) => e.tipo), ['inicio', 'ok']);
  assert.equal(r.estado.seq, 1); assert.equal(r.estado.gelos, 2);
  assert.equal(diasAtivos(d, '2026-11-16'), 4);
});

test('sequência que perdoa: dois congelamentos automáticos antes de zerar, e eles recarregam', () => {
  const boa = (seg) => [0, 1, 2, 3].map((i) => addDays(seg, i));
  const d = dias([...boa('2026-01-05'), ...boa('2026-01-12'), /* 19/01 e 26/01 fracas */ '2026-01-20', /* 02/02 vazia */ ...boa('2026-02-09')]);
  let r = fechar(novaSequencia(), d, '2026-02-16');
  assert.deepEqual(r.eventos.map((e) => e.tipo), ['ok', 'ok', 'gelo', 'gelo', 'pausa', 'ok']);
  assert.equal(r.estado.seq, 1); assert.equal(r.estado.gelos, 1);
  // idempotente: fechar de novo no mesmo dia não muda nada
  const r2 = fechar(r.estado, d, '2026-02-16');
  assert.equal(r2.eventos.length, 0); assert.deepEqual(r2.estado, r.estado);
  // não altera o objeto de entrada
  const antes = novaSequencia(); fechar(antes, d, '2026-02-16'); assert.deepEqual(antes, novaSequencia());
});

test('sequência: ausência longa não trava nem pune além de zerar', () => {
  const d = dias(['2025-01-06', '2025-01-07', '2025-01-08', '2025-01-09']);
  const r = fechar(novaSequencia(), d, '2026-11-13');
  assert.equal(r.estado.seq, 0);
  assert.ok(r.eventos.length < 120, 'recalcular do zero percorre as semanas sem travar');
  // com histórico já fechado, uma ausência longa percorre no máximo 12 semanas
  const r2 = fechar({ ...r.estado, ult: '2025-01-06' }, d, '2026-11-13');
  assert.ok(r2.eventos.length <= 13);
});

test('semana atual: mostra o que falta sem cobrança', () => {
  const s = semanaAtual(dias(['2026-11-09', '2026-11-11']), '2026-11-13');
  assert.equal(s.feitos, 2); assert.equal(s.falta, 2); assert.equal(s.possivel, true); assert.equal(s.batida, false);
  assert.equal(s.lista[4].hoje, true); assert.equal(s.lista[5].futuro, true);
  const tarde = semanaAtual(dias(['2026-11-09']), '2026-11-15');
  assert.equal(tarde.possivel, false);
});

test('andaime: molde com lacunas, níveis e conferência tolerante', () => {
  const molde = 'if nota ⟦1:>=⟧ 7:\n    print(⟦2:"Aprovado"¦\'Aprovado\'⟧)\n⟦2:else⟧:\n    print("Revisar")';
  const p = parseMolde(molde);
  assert.equal(solucao(molde), 'if nota >= 7:\n    print("Aprovado")\nelse:\n    print("Revisar")');
  assert.equal(maiorNivel(p), 2);
  assert.equal(aplicarNivel(p, 1).filter((x) => x.t === 'lac').length, 1);
  assert.equal(aplicarNivel(p, 2).filter((x) => x.t === 'lac').length, 3);
  assert.equal(aplicarNivel(p, 3).filter((x) => x.t === 'lac').length, 3);
  const lac = p.find((x) => x.t === 'lac' && x.n === 2);
  assert.ok(confere(lac, '"Aprovado"')); assert.ok(confere(lac, " 'aprovado' ")); assert.ok(!confere(lac, 'Aprovado'));
  assert.ok(!confere(lac, '"aprovado"', true));
});

test('andaime: some com 80% de acerto de primeira e volta quando está difícil', () => {
  let a = novoAndaime();
  for (const ok of [true, true]) a = registrar(a, ok);
  assert.equal(a.nivel, 1);
  a = registrar(a, true);
  assert.equal(a.nivel, 2); assert.deepEqual(a.janela, []);
  for (const ok of [true, false, true, true, true]) a = registrar(a, ok);
  assert.equal(a.nivel, 3);
  for (const ok of [false, false, true]) a = registrar(a, ok);
  assert.equal(a.nivel, 2);
  let b = novoAndaime();
  for (const ok of [false, false, false]) b = registrar(b, ok);
  assert.equal(b.nivel, 1);
});

test('plano: semanas do documento e recálculo sem culpa', () => {
  assert.equal(PLANOS.A.total, 26); assert.equal(PLANOS.B.total, 48);
  for (const p of Object.values(PLANOS)) { assert.equal(p.sem.length, 7); assert.equal(p.sem[6][1], p.total); for (let i = 1; i < 7; i++) assert.equal(p.sem[i][0], p.sem[i - 1][1] + 1); }
  const cal = calendario('A', '2026-11-13');
  assert.equal(cal[0].de, '2026-11-09'); assert.equal(cal[0].ate, '2026-11-22'); assert.equal(cal[1].de, '2026-11-23');
  assert.equal(cal[6].ate, addDays('2026-11-09', 26 * 7 - 1));
  const s = situacao('A', '2026-11-13', '2026-12-10', 0); // semana 5, ainda no M0
  assert.equal(s.semana, 5); assert.equal(s.esperado, 2); assert.equal(s.atraso, 3);
  const novo = recalcular('A', '2026-12-10', 0, 0.5);
  const s2 = situacao('A', novo, '2026-12-10', 0);
  assert.equal(s2.atraso, 0); assert.equal(s2.esperado, 0);
  const novo3 = recalcular('B', '2026-12-10', 3, 0);
  assert.equal(situacao('B', novo3, '2026-12-10', 3).semana, 12);
});

test('JSON em português: aceita o válido', () => {
  const r = analisar(' [{"titulo": "Dom Casmurro", "ano": 1899, "lido": true, "nota": null, "tags": ["a", "b"], "x": -1.5e2, "s": "a\\n\\u00e9\\"b"}] ');
  assert.ok(r.ok);
  assert.deepEqual(r.valor, [{ titulo: 'Dom Casmurro', ano: 1899, lido: true, nota: null, tags: ['a', 'b'], x: -150, s: 'a\né"b' }]);
  assert.ok(analisar('{}').ok); assert.ok(analisar('[]').ok); assert.ok(analisar('"x"').ok); assert.ok(analisar('true').ok);
});

test('JSON em português: explica os erros de iniciante', () => {
  const casos = [
    ["{'nome': 'Ana'}", /aspas duplas/],
    ['{"nome": "Ana",}', /Vírgula sobrando/],
    ['[1, 2, 3,]', /Vírgula sobrando/],
    ['{"nome": "Ana" "idade": 3}', /Faltou uma vírgula/],
    ['{nome: "Ana"}', /sem aspas/],
    ['{"nome" "Ana"}', /Faltou :/],
    ['{"ok": True}', /não existe em JSON/],
    ['{"nome": "Ana}', /sem fechar aspas/],
    ['{"a": 1', /não foi fechado/],
    ['[1, 2', /não foi fechada/],
    ['Aqui está o JSON:\n{"a": 1}', /texto antes/],
    ['{"a": 1}\nEspero ter ajudado!', /texto depois/],
    ['{"a": 1} // comentário', /texto depois/],
    ['{"a": // x\n 1}', /comentários/],
    ['{"a": 07}', /zero à esquerda/],
    ['{"a": ola}', /Texto sem aspas/],
    ['', /vazio/],
    ['[1 2]', /Faltou uma vírgula entre os itens/],
  ];
  for (const [txt, re] of casos) { const r = analisar(txt); assert.equal(r.ok, false, txt); assert.match(r.msg, re, txt); assert.ok(r.dica, txt); assert.ok(r.linha >= 1 && r.col >= 1); }
  const r = analisar('{\n  "a": 1,\n  "b": 2,\n}');
  assert.equal(r.linha, 3); assert.equal(r.col, 9);
  // tudo o que o JSON.parse aceita, este leitor aceita com o mesmo resultado
  for (const txt of ['{"a":[1,{"b":null}],"c":"\\u0041\\t"}', '[[],{},"",0,-0.5,1e3]', ' \n {"x" : false } \n']) assert.deepEqual(analisar(txt).valor, JSON.parse(txt));
});

test('JSON: conferência de formato dos exercícios', () => {
  const esp = { tipo: 'lista', n: 3, chaves: ['titulo', 'autor', 'ano'], tipos: { ano: 'numero' } };
  assert.deepEqual(conferirFormato([{ titulo: 'a', autor: 'b', ano: 1 }, { titulo: 'a', autor: 'b', ano: 2 }, { titulo: 'a', autor: 'b', ano: 3 }], esp), []);
  const p = conferirFormato([{ titulo: 'a', ano: '1899' }], esp);
  assert.equal(p.length, 3);
  assert.match(p.join(' '), /3 itens/); assert.match(p.join(' '), /falta o campo "autor"/); assert.match(p.join(' '), /sem aspas/);
  assert.match(conferirFormato({ a: 1 }, { tipo: 'lista' })[0], /lista/);
  assert.deepEqual(conferirFormato({ nome: 'x', data: 'y' }, { tipo: 'objeto', chaves: ['nome', 'data'] }), []);
});

test('tokens aproximados: token não é palavra, e nada do texto se perde', () => {
  const frase = 'A inteligência artificial generativa escreve textos, imagens e código.';
  const toks = tokensAprox(frase);
  assert.equal(toks.join(''), frase);
  assert.ok(toks.length > contarPalavras(frase));
  assert.equal(contarPalavras(frase), 9);
  assert.equal(tokensAprox('o céu é azul').length, 4);
  assert.deepEqual(tokensAprox('a\nb'), ['a', '\n', 'b']);
  assert.equal(tokensAprox('').length, 0);
  // português (com acentos) tende a gastar mais peças que o inglês equivalente
  assert.ok(tokensAprox('compreensão automática de documentação').length > tokensAprox('automatic understanding of documentation').length);
});

test('softmax com temperatura: T baixa concentra, T alta espalha', () => {
  const logits = [5, 3, 1, 0];
  const p0 = softmax(logits, 0); assert.deepEqual(p0, [1, 0, 0, 0]);
  const p1 = softmax(logits, 1), p2 = softmax(logits, 2), pb = softmax(logits, 0.3);
  for (const p of [p1, p2, pb]) assert.ok(Math.abs(p.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  assert.ok(pb[0] > p1[0] && p1[0] > p2[0]);
  assert.ok(p2[3] > p1[3]);
  assert.equal(amostrar([0.5, 0.3, 0.2], 0.1), 0); assert.equal(amostrar([0.5, 0.3, 0.2], 0.79), 1); assert.equal(amostrar([0.5, 0.3, 0.2], 0.99), 2);
});

test('cosseno: mesma direção 1, perpendicular 0, oposta -1', () => {
  assert.ok(Math.abs(cosseno([1, 0], [3, 0]) - 1) < 1e-9);
  assert.ok(Math.abs(cosseno([1, 0], [0, 2])) < 1e-9);
  assert.ok(Math.abs(cosseno([1, 1], [-1, -1]) + 1) < 1e-9);
  assert.equal(cosseno([0, 0], [1, 1]), 0);
});

test('chunking: tamanho, sobreposição e corte em fim de frase', () => {
  const t = 'Token é um pedaço de texto. A janela de contexto é a mesa de trabalho. Temperatura controla a aleatoriedade! RAG busca trechos antes de responder? Sim.';
  const fixo = chunk(t, 50, 10);
  assert.ok(fixo.every((c) => c.texto.length <= 50));
  assert.equal(fixo[0].ini, 0); assert.equal(fixo[1].ini, 40); assert.equal(fixo[fixo.length - 1].fim, t.length);
  for (let i = 1; i < fixo.length; i++) assert.equal(fixo[i - 1].fim - fixo[i].ini, 10);
  const frase = chunk(t, 80, 0, true);
  assert.equal(frase.map((c) => c.texto).join(''), t);
  assert.ok(frase.every((c) => /[.!?]\s*$/.test(c.texto)));
  const sobre = chunk(t, 80, 45, true);
  assert.ok(sobre.length >= frase.length);
  assert.ok(sobre.every((c) => /[.!?]\s*$/.test(c.texto)));
  assert.ok(sobre[1].ini < sobre[0].fim, 'há sobreposição de frases inteiras');
  assert.equal(chunk('curto', 500, 50).length, 1);
  assert.equal(chunk('', 500, 50, true).length, 0);
});

test('busca por palavras: acha por termos em comum e falha em sinônimos (motivo dos embeddings)', () => {
  const docs = ['O cachorro late para o carteiro todos os dias.', 'Imposto de renda: prazo de entrega da declaração.', 'Tokens são pedaços de texto usados pelos modelos.', 'A temperatura controla a aleatoriedade das respostas.'];
  const idx = criarIndice(docs);
  assert.equal(buscar(idx, 'o que são tokens?', 1)[0].i, 2);
  assert.equal(buscar(idx, 'qual o prazo do imposto', 2)[0].i, 1);
  const sin = buscar(idx, 'cão ladra', 4);
  assert.ok(sin.every((r) => r.score === 0), 'sem palavra em comum, a busca lexical não encontra');
  assert.equal(buscar(idx, 'cachorros', 1)[0].i, 0);
  assert.deepEqual(termos('Os Tokens e as Ações nos canais'), ['token', 'acao', 'canal']);
  assert.equal(buscar(idx, 'tokens', 10).length, 4);
});
