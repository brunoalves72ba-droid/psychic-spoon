import test from 'node:test';
import assert from 'node:assert/strict';
import { TRILHAS, TECNICAS, SINAIS, tecnica, recomendar, demoSpan, pickRoot } from '../js/data/tecnicas.js';

test('técnicas: campos obrigatórios e ids únicos', () => {
  const ids = new Set();
  for (const t of TECNICAS) {
    assert.ok(!ids.has(t.id), `id repetido: ${t.id}`); ids.add(t.id);
    assert.ok(TRILHAS.some((x) => x.id === t.trilha), `trilha inexistente em ${t.id}`);
    for (const k of ['name', 'resumo', 'porque', 'evite', 'faca']) assert.ok(typeof t[k] === 'string' && t[k].length > 8, `${t.id}.${k} vazio`);
    assert.match(t.tempo, /^\d+ minutos?$/, `${t.id}.tempo fora do formato`);
    assert.ok(t.passos.length >= 4 && t.passos.every((p) => p.length > 15), `${t.id}: passo a passo curto demais`);
    assert.ok(t.sinais.length >= 3, `${t.id}: faltam sinais de que deu certo`);
    assert.ok(t.exemplos.length >= 2, `${t.id}: faltam exemplos`);
  }
  assert.equal(TECNICAS.length, 9);
  assert.ok(TRILHAS.every((tr) => TECNICAS.some((t) => t.trilha === tr.id)), 'trilha sem técnicas');
});

test('técnicas: exemplos sonoros bem formados', () => {
  for (const t of TECNICAS) {
    if (!t.demo) continue;
    const d = t.demo;
    assert.ok(['notes', 'glide', 'hold'].includes(d.kind), `${t.id}: tipo de exemplo inválido`);
    assert.ok(d.d > 0 && d.d < 12, `${t.id}: duração fora da faixa`);
    assert.ok('aeiou'.includes(d.vowel), `${t.id}: vogal inválida`);
    if (d.kind === 'notes') assert.ok(d.pat.length >= 2 && d.pat.every(Number.isInteger), `${t.id}: padrão inválido`);
    if (d.kind === 'glide') assert.ok(d.path.length >= 2 && d.path.every(Number.isInteger), `${t.id}: caminho inválido`);
    assert.ok(demoSpan(d) <= 12, `${t.id}: exemplo sobe mais que uma oitava`);
  }
  assert.equal(demoSpan(null), 0);
  assert.equal(demoSpan({ kind: 'hold', d: 6, vowel: 'a' }), 0);
});

test('autodiagnóstico: só aponta técnicas que existem', () => {
  for (const s of SINAIS) { assert.ok(s.tecnicas.length >= 2); for (const id of s.tecnicas) assert.ok(tecnica(id), `${s.id} aponta ${id}`); }
  assert.equal(new Set(SINAIS.map((s) => s.id)).size, SINAIS.length);
  for (const t of TECNICAS) assert.ok(SINAIS.some((s) => s.tecnicas.includes(t.id)) || t.id === 'musica' || t.id === 'comeco', `${t.id} nunca é sugerida`);
});

test('recomendar: ordem, limite e vazio', () => {
  assert.deepEqual(recomendar([]), []);
  assert.deepEqual(recomendar(['aperta']), ['pescoco', 'ar', 'canudo']);
  // dois sinais que apontam a mesma técnica somam pontos
  assert.equal(recomendar(['aperta', 'queixo'])[0], 'pescoco');
  assert.equal(recomendar(['aperta', 'queixo', 'lingua', 'empurra', 'cansa'], 2).length, 2);
  assert.deepEqual(recomendar(['estalo'])[0], 'comeco');
  assert.deepEqual(recomendar(['inexistente']), []);
});

test('pickRoot: nota inicial cabe na extensão medida', () => {
  for (const [lo, hi] of [[40, 64], [48, 72], [55, 79], [52, 70]]) {
    for (const span of [0, 10, 12]) {
      const r = pickRoot(span, { lo, hi });
      assert.ok(r >= lo && r + span <= hi, `${lo}-${hi} span ${span}: raiz ${r}`);
    }
  }
  // extensão pequena: centraliza, sem sair do piso
  assert.ok(pickRoot(12, { lo: 55, hi: 62 }) >= 55);
  assert.equal(pickRoot(12, null, 'grave'), 45);
  assert.equal(pickRoot(12, null, 'media'), 50);
  assert.equal(pickRoot(12, null, 'aguda'), 57);
  assert.equal(pickRoot(12, null, 'qualquer'), 50);
});
