// Boas-vindas: o banco tem as 150 frases sem numeração, e o sorteio não repete as últimas 10.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sortear } from '../js/core/sorteio.js';
import { CURIOSIDADES } from '../js/data/curiosidades.js';

const frases = JSON.parse(readFileSync(new URL('../js/data/mensagens.json', import.meta.url), 'utf8'));

test('banco de mensagens: 150 frases, sem numeração, sem espaços sobrando, sem repetidas', () => {
  assert.equal(frases.length, 150);
  for (const f of frases) { assert.ok(!/^\d+\.\s/.test(f), f); assert.equal(f, f.trim()); assert.ok(f.length > 5); }
  assert.equal(new Set(frases).size, 150);
  assert.equal(frases[0], 'Já pegou o cafezinho? Hoje o estudo não sai sem ele.');
});

test('sorteio: nunca repete uma das últimas 10 e guarda só 10', () => {
  let ult = [];
  const vistas = [];
  for (let k = 0; k < 500; k++) {
    const [i, nova] = sortear(150, ult);
    assert.ok(!ult.includes(i));
    assert.ok(nova.length <= 10);
    vistas.push(i); ult = nova;
  }
  assert.ok(new Set(vistas).size > 100, 'sorteia de todo o banco');
  assert.equal(sortear(3, [0, 1])[0], 2);
});

test('curiosidades: as 3 frases do pedido, em arquivo separado', () => {
  assert.equal(CURIOSIDADES.length, 3);
});
