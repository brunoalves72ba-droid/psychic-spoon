// Testes das regras dos laboratórios (partes puras, sem tela).
import test from 'node:test';
import assert from 'node:assert/strict';
import { servidor, URL_TREINO, CHAVE_TREINO } from '../js/labs/api.js';
import { simular } from '../js/labs/backoff.js';
import { avaliar, preencher, ITEM } from '../js/labs/n8n-expr.js';
import { dividir, ITENS } from '../js/labs/n8n-if.js';
import { conferir } from '../js/labs/prompt.js';
import { LABS } from '../js/data/labs.js';
import { licao } from '../js/data/curso.js';
import { existsSync } from 'node:fs';

const ok = { metodo: 'POST', url: URL_TREINO, auth: `Bearer ${CHAVE_TREINO}`, tipo: 'application/json', corpo: '{"model":"m","messages":[{"role":"user","content":"O que é um token?"}]}' };

test('API de treino: cada erro tem o status certo', () => {
  const r = servidor(ok, [], 0);
  assert.equal(r.status, 200);
  assert.match(r.corpo.choices[0].message.content, /Token/);
  assert.equal(servidor({ ...ok, url: URL_TREINO + 'x' }, [], 0).status, 404);
  assert.equal(servidor({ ...ok, metodo: 'GET' }, [], 0).status, 400);
  assert.equal(servidor({ ...ok, auth: '' }, [], 0).status, 401);
  assert.equal(servidor({ ...ok, auth: CHAVE_TREINO }, [], 0).status, 401);
  assert.equal(servidor({ ...ok, auth: 'Bearer outra' }, [], 0).status, 401);
  assert.equal(servidor({ ...ok, tipo: '' }, [], 0).status, 400);
  assert.match(servidor({ ...ok, corpo: '{"model": "m",}' }, [], 0).corpo.error.message, /JSON inválido/);
  assert.match(servidor({ ...ok, corpo: '{"messages": []}' }, [], 0).corpo.error.message, /model/);
  const h = [];
  const st = [0, 1, 2, 3, 4].map((i) => servidor(ok, h, i * 1000).status);
  assert.deepEqual(st, [200, 200, 200, 200, 429]);
  assert.equal(servidor(ok, h, 20000).status, 200);
});

test('limites: só o backoff entrega os 8 pedidos', () => {
  assert.equal(simular('tudo').entregues, 3);
  assert.equal(simular('insistir').entregues, 3);
  const b = simular('backoff');
  assert.equal(b.entregues, 8);
  // nunca mais de 3 aceitos em 10 segundos
  const aceitos = b.eventos.filter((e) => e.ok).map((e) => e.t);
  for (const t of aceitos) assert.ok(aceitos.filter((x) => x >= t && x < t + 10).length <= 3);
});

test('expressões do n8n', () => {
  assert.equal(preencher('Olá, {{ $json.nome }}!', ITEM).texto, 'Olá, Ana!');
  assert.equal(preencher('{{ $json.curso.titulo }}', ITEM).texto, 'IA Generativa');
  assert.equal(preencher('{{ $json.Nome }}', ITEM).texto, 'undefined');
  assert.equal(preencher('{{ $json.tags[1] }}', ITEM).texto, 'n8n');
  assert.equal(preencher('{{ $json.nome.toUpperCase() }}', ITEM).texto, 'ANA');
  assert.equal(avaliar('$json.tags.length', ITEM).valor, 2);
  assert.match(avaliar('json.nome', ITEM).erro, /\$/);
  assert.ok(preencher('{{ alert(1) }}', ITEM).erro);
});

test('nó IF: como texto, “10” fica antes de “7”', () => {
  assert.deepEqual(dividir(ITENS, '>=', '7', 'String'), [['Ana'], ['Bia', 'Caio']]);
  assert.deepEqual(dividir(ITENS, '>=', '7', 'Number'), [['Ana', 'Caio'], ['Bia']]);
});

test('laboratório de prompts reconhece as 6 partes', () => {
  assert.ok(conferir('Explique RAG.').filter((p) => p.ok).length <= 2);
  const bom = 'Você é um professor. O público são alunos iniciantes. Explique RAG em até 5 linhas. Não use jargão. Por exemplo: "RAG é uma prova com consulta."';
  assert.ok(conferir(bom).every((p) => p.ok));
});

test('catálogo de laboratórios aponta para arquivos e lições que existem', () => {
  for (const l of LABS) { assert.ok(existsSync(new URL(`../js/labs/${l.id}.js`, import.meta.url)), l.id); assert.ok(licao(l.licao), l.licao); }
});
