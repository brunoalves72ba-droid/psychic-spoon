import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarFila, decidir, desfazer, alternar, remover, resumo, atual, terminou, ehImagem, formatarBytes, escolhaDoArraste } from '../js/core/fila.js';

const fotos = () => [1, 2, 3, 4].map((n) => ({ id: 'f' + n, nome: `IMG_${n}.jpg`, tamanho: n * 1000 }));

test('decidir avança e conta', () => {
  const f = criarFila(fotos());
  decidir(f, 'apagar'); decidir(f, 'manter'); decidir(f, 'apagar');
  assert.equal(atual(f).id, 'f4');
  const r = resumo(f);
  assert.deepEqual(r.apagar.map((x) => x.id), ['f1', 'f3']);
  assert.equal(r.manter, 1);
  assert.equal(r.bytes, 4000);
  assert.equal(r.faltam, 1);
  decidir(f, 'manter');
  assert.ok(terminou(f));
  assert.equal(decidir(f, 'apagar'), null);
});

test('ação inválida', () => assert.throws(() => decidir(criarFila(fotos()), 'x')));

test('desfazer volta a foto e apaga a decisão', () => {
  const f = criarFila(fotos());
  assert.equal(desfazer(f), null);
  decidir(f, 'apagar'); decidir(f, 'manter');
  assert.equal(desfazer(f).id, 'f2');
  assert.equal(atual(f).id, 'f2');
  assert.equal(f.decisoes.has('f2'), false);
  assert.equal(desfazer(f).id, 'f1');
  assert.equal(resumo(f).apagar.length, 0);
});

test('alternar na revisão', () => {
  const f = criarFila(fotos());
  decidir(f, 'apagar');
  assert.equal(alternar(f, 'f1'), 'manter');
  assert.equal(alternar(f, 'f1'), 'apagar');
  assert.equal(alternar(f, 'f2'), null);
});

test('remover fotos apagadas ajusta a posição', () => {
  const f = criarFila(fotos());
  decidir(f, 'apagar'); decidir(f, 'manter'); decidir(f, 'apagar');
  remover(f, ['f1', 'f3']);
  assert.deepEqual(f.fotos.map((x) => x.id), ['f2', 'f4']);
  assert.equal(atual(f).id, 'f4');
  assert.deepEqual(f.historico, ['f2']);
  assert.equal(desfazer(f).id, 'f2');
});

test('reconhece imagens', () => {
  assert.ok(ehImagem('a.JPG'));
  assert.ok(ehImagem('IMG_1.heic'));
  assert.ok(ehImagem('sem-ext', 'image/png'));
  assert.ok(!ehImagem('video.mp4', 'video/mp4'));
  assert.ok(!ehImagem('jpg'));
});

test('formata tamanhos', () => {
  assert.equal(formatarBytes(500), '500 B');
  assert.equal(formatarBytes(1536), '1,5 KB');
  assert.equal(formatarBytes(250 * 1024 * 1024), '250 MB');
});

test('arraste decide pelo limite ou pela velocidade', () => {
  assert.equal(escolhaDoArraste(-150, 400), 'apagar');
  assert.equal(escolhaDoArraste(150, 400), 'manter');
  assert.equal(escolhaDoArraste(60, 400), null);
  assert.equal(escolhaDoArraste(60, 400, 1), 'manter');
  assert.equal(escolhaDoArraste(-60, 400, -1), 'apagar');
});
