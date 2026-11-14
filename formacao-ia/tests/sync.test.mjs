// Sincronização: a mesclagem não perde progresso, e a cifra só abre com o mesmo token.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mesclarKv, mesclarLog, idDiario } from '../js/core/mesclar.js';
import { cifrar, decifrar } from '../js/core/nuvem.js';
import { detectar } from '../js/core/plataforma.js';
import { fechar, novaSequencia } from '../js/core/sequencia.js';

const celular = {
  perfil: { criado: '2026-11-01', plano: 'A', alvo: 5, _t: 100 },
  licoes: { '0.1': { p: 0, feita: '2026-11-02', quiz: [true, false, true], ex: { ok: true, tent: 2 }, mao: 'depois' }, '0.2': { p: 3, ini: '2026-11-03' } },
  cartoes: { '0.1#0': { s: 2, due: '2026-11-12', n: 3, l: 0, u: '2026-11-05' }, '0.1#1': { s: 0, due: '2026-11-04', n: 1, l: 1, u: '2026-11-03' } },
  dias: { '2026-11-02': { l: 1, c: 0, p: 5 }, '2026-11-03': { p: 3 } },
  xpPor: { cel: 120 },
  diario: [{ id: 'a1', d: '2026-11-02', t: 'Comecei.' }, { d: '2026-10-30', t: 'Entrada antiga sem id.' }],
  pensamentos: [{ id: 1, d: '2026-11-02', t: 'boleto', ok: false, _t: 10 }],
  prompts: [{ id: 7, nome: 'Tutor', texto: 'v1', versao: 1, _t: 10 }],
  missoes: { 'm0-pastas': { itens: { 0: true, 1: true } } },
  conquistas: { primeira: '2026-11-02' },
  meus: [{ id: 'u1', f: 'O que é RAG?', v: 'Busca + geração' }],
  apagados: {},
  sessao: { licao: '0.2', _t: 50 },
};
const pc = {
  perfil: { criado: '2026-11-01', plano: 'B', alvo: 15, _t: 200 },
  licoes: { '0.1': { p: 0, feita: '2026-11-04', quiz: [true, true, true], mao: 'feito', maoQuando: '2026-11-04' }, '0.2': { p: 5 }, '0.3': { p: 0, feita: '2026-11-04' } },
  cartoes: { '0.1#1': { s: 1, due: '2026-11-08', n: 2, l: 1, u: '2026-11-05' }, '0.3#0': { s: 0, due: '2026-11-05', n: 0, l: 0 } },
  dias: { '2026-11-03': { p: 1, m: 2 }, '2026-11-04': { l: 1 } },
  xpPor: { pc: 80, cel: 100 },
  diario: [{ id: 'b1', d: '2026-11-04', t: 'No PC.' }, { d: '2026-10-30', t: 'Entrada antiga sem id.' }],
  pensamentos: [{ id: 1, d: '2026-11-02', t: 'boleto', ok: true, _t: 20 }],
  prompts: [{ id: 7, nome: 'Tutor', texto: 'v2', versao: 2, _t: 5 }],
  missoes: { 'm0-pastas': { itens: { 2: true, 3: true }, feita: '2026-11-04' } },
  conquistas: { primeira: '2026-11-04', dez: '2026-11-04' },
  meus: [{ id: 'u1', f: 'Outro cartão', v: 'Outro verso' }],
  apagados: { 'diario:a1': '2026-11-05T10:00:00Z' },
  sessao: { _t: 10 },
};

test('mesclagem: progresso de lição só avança', () => {
  const m = mesclarKv(celular, pc);
  assert.equal(m.licoes['0.1'].feita, '2026-11-02');
  assert.deepEqual(m.licoes['0.1'].quiz, [true, true, true], 'acerto em qualquer aparelho conta');
  assert.equal(m.licoes['0.1'].mao, 'feito');
  assert.deepEqual(m.licoes['0.1'].ex, { ok: true, tent: 2 });
  assert.equal(m.licoes['0.2'].p, 5);
  assert.equal(m.licoes['0.3'].feita, '2026-11-04');
});

test('mesclagem: cartões ficam com a revisão mais recente e nada some', () => {
  const m = mesclarKv(celular, pc);
  assert.equal(m.cartoes['0.1#0'].s, 2);
  assert.equal(m.cartoes['0.1#1'].n, 2, 'mesmo dia: vale a que revisou mais vezes');
  assert.ok(m.cartoes['0.3#0']);
});

test('mesclagem: dias, XP por aparelho, missões e conquistas', () => {
  const m = mesclarKv(celular, pc);
  assert.deepEqual(m.dias['2026-11-03'], { p: 3, m: 2 });
  assert.deepEqual(m.xpPor, { cel: 120, pc: 80 });
  assert.equal(Object.values(m.xpPor).reduce((a, b) => a + b), 200, 'XP não é contado duas vezes');
  assert.deepEqual(m.missoes['m0-pastas'], { itens: { 0: true, 1: true, 2: true, 3: true }, feita: '2026-11-04' });
  assert.deepEqual(m.conquistas, { primeira: '2026-11-02', dez: '2026-11-04' });
});

test('mesclagem: o que foi editado por inteiro fica com a versão mais recente', () => {
  const m = mesclarKv(celular, pc);
  assert.equal(m.perfil.plano, 'B');
  assert.equal(m.sessao.licao, '0.2');
  assert.equal(m.pensamentos[0].ok, true);
  assert.equal(m.prompts[0].texto, 'v2', 'versão maior do prompt vence');
});

test('mesclagem: exclusões chegam ao outro aparelho e diário sem id não duplica', () => {
  const m = mesclarKv(celular, pc);
  assert.deepEqual(m.diario.map(idDiario), ['b1', '2026-10-30|Entrada antiga sem id.']);
  const m2 = mesclarKv({ pensamentos: [{ id: 5, t: 'x' }], apagados: {} }, { pensamentos: [], apagados: { 'pensamentos:5': 'z' } });
  assert.equal(m2.pensamentos.length, 0);
});

test('mesclagem: cartões importados com o mesmo id antigo não se sobrescrevem', () => {
  const m = mesclarKv({ ...celular, cartoes: { ...celular.cartoes, u1: { s: 1, due: 'x', n: 1 } } }, { ...pc, cartoes: { ...pc.cartoes, u1: { s: 0, due: 'y', n: 0 } } });
  assert.equal(m.meus.length, 2);
  assert.deepEqual(m.meus.map((c) => c.f).sort(), ['O que é RAG?', 'Outro cartão']);
  for (const c of m.meus) assert.ok(m.cartoes[c.id], `cartão ${c.id} mantém o agendamento`);
});

test('mesclagem: é idempotente e comutativa no essencial', () => {
  const ab = mesclarKv(celular, pc), ba = mesclarKv(pc, celular);
  assert.deepEqual(mesclarKv(ab, ab).licoes, ab.licoes);
  assert.deepEqual(ab.licoes, ba.licoes);
  assert.deepEqual(ab.cartoes, ba.cartoes);
  assert.deepEqual(ab.dias, ba.dias);
  assert.deepEqual(ab.xpPor, ba.xpPor);
  assert.deepEqual(mesclarKv(ab, {}).licoes, ab.licoes);
  assert.deepEqual(mesclarKv({}, {}).licoes, {});
});

test('histórico: junta sem repetir', () => {
  const a = [{ id: 1, t: 'rev', cid: 'x', d: '2026-11-02', int: 1, ok: true, uid: 'k1' }, { id: 2, t: 'rev', cid: 'y', d: '2026-11-03', int: 1, ok: false }];
  const b = [{ id: 9, t: 'rev', cid: 'x', d: '2026-11-02', int: 1, ok: true, uid: 'k1' }, { id: 3, t: 'rev', cid: 'z', d: '2026-11-04', int: 3, ok: true, uid: 'k3' }, { id: 4, t: 'rev', cid: 'y', d: '2026-11-03', int: 1, ok: false }];
  const m = mesclarLog(a, b);
  assert.equal(m.length, 3);
  assert.ok(m.every((e) => e.uid && e.id === undefined));
  assert.equal(mesclarLog(m, m).length, 3);
});

test('sequência semanal recalculada dá o mesmo resultado nos dois aparelhos', () => {
  const m = mesclarKv(celular, pc);
  const r1 = fechar(novaSequencia(), m.dias, '2026-11-20'), r2 = fechar(novaSequencia(), mesclarKv(pc, celular).dias, '2026-11-20');
  assert.deepEqual(r1.estado, r2.estado);
});

test('cifra: abre com o mesmo token e falha com outro', async () => {
  const dados = { kv: { diario: [{ t: 'segredo' }] }, log: [] };
  const txt = await cifrar(dados, 'ghp_tokenDeTeste1234567890');
  assert.ok(!txt.includes('segredo'));
  assert.deepEqual(await decifrar(txt, 'ghp_tokenDeTeste1234567890'), dados);
  await assert.rejects(decifrar(txt, 'ghp_outroToken0000000000000'), (e) => e.outroToken === true);
  await assert.rejects(decifrar('{"app":"outro"}', 'x'));
});

test('plataforma: PC com mouse e tela larga; celular com toque', () => {
  assert.equal(detectar({ ponteiroFino: true, hover: true, largura: 1366, toque: false }), 'pc');
  assert.equal(detectar({ ponteiroFino: false, hover: false, largura: 390, toque: true }), 'celular');
  assert.equal(detectar({ ponteiroFino: false, hover: false, largura: 1024, toque: true }), 'celular', 'tablet com toque');
  assert.equal(detectar({ ponteiroFino: true, hover: true, largura: 700, toque: false }), 'celular', 'janela estreita');
});
