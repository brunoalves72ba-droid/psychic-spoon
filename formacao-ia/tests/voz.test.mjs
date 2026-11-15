import { test } from 'node:test';
import assert from 'node:assert/strict';
import { limpar, dividir, pronunciar } from '../js/core/voz-texto.js';

test('pronúncia dos termos em inglês, sem estragar palavras em português', () => {
  assert.equal(pronunciar('O prompt gasta tokens.'), 'O prômpt gasta tôquens.');
  assert.equal(pronunciar('Uma API em JSON'), 'Uma a pê í em djêison');
  assert.equal(pronunciar('ele ia e via'), 'ele ia e via');           // "ia" minúsculo é o verbo
  assert.equal(pronunciar('A IA gera texto'), 'A i á gera texto');
  assert.equal(pronunciar('promptuário'), 'promptuário');             // só a palavra inteira
  assert.match(pronunciar('few-shot e chain-of-thought'), /fiú chót e tchêin óf thót/);
});

test('limpar tira marcações, símbolos e encurta endereços', () => {
  assert.equal(limpar('**Negrito** e `código`'), 'Negrito e código');
  assert.equal(limpar('Veja [a ficha](#/mais/ficha).'), 'Veja a ficha.');
  assert.equal(limpar('Abra https://hoppscotch.io/x?y=1 agora'), 'Abra róps cótch ponto io agora');
  assert.equal(limpar('Entrada → saída'), 'Entrada, depois, saída');
  assert.equal(limpar('80% de acerto'), '80 por cento de acerto');
  assert.equal(limpar('Expressões {{ }}'), 'Expressões chaves duplas');
  assert.equal(limpar('O nome é ⟦1:model⟧ aqui'), 'O nome é lacuna aqui');
  assert.ok(!/[*`#_]/.test(limpar('# Título _x_ *y*')));
});

test('dividir corta em frases curtas e respeita os parágrafos', () => {
  const t = 'Primeira frase. Segunda frase!\nOutro parágrafo.';
  assert.deepEqual(dividir(t, 200), ['Primeira frase. Segunda frase!', 'Outro parágrafo.']);
  const longa = ('palavra, ').repeat(60) + 'fim.';
  const partes = dividir(longa, 120);
  assert.ok(partes.length > 3 && partes.every((p) => p.length <= 121), JSON.stringify(partes.map((p) => p.length)));
  assert.equal(partes.join(' ').replace(/\s+/g, ' '), longa.trim().replace(/\s+/g, ' '));
  assert.deepEqual(dividir('...\n\n'), []);
});
