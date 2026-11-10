import test from 'node:test';
import assert from 'node:assert/strict';
import { assemble, estimateLatency, peaksOf, quickMix } from '../js/audio/recorder.js';
import { encodeWav, decodeWav } from '../js/audio/wav.js';
import { defaultState, MISSIONS } from '../js/audio/mixer.js';

const SR = 48000;
test('gravador: tomada alinhada ao relógio de áudio, com compensação de latência', () => {
  // microfone começou em t=10,000 s; a música começa em t0=10,500 s; latência de 40 ms
  const sig = new Float32Array(SR * 2); const mark = Math.round((0.5 + 0.04 + 0.25) * SR); sig[mark] = 1; // evento a 250 ms do início da música
  const chunks = []; for (let i = 0; i < sig.length; i += 2048) chunks.push({ data: sig.subarray(i, Math.min(sig.length, i + 2048)), t: 10 + i / SR });
  const take = assemble(chunks, 10.5, SR, 0.04);
  assert.equal(take.indexOf(1), Math.round(0.25 * SR));
  assert.equal(assemble([], 0, SR).length, 0);
  const late = assemble(chunks, 9.9, SR, 0); assert.equal(late.indexOf(1) - mark, Math.round(0.1 * SR), 'se o microfone abriu depois de t0, o começo é preenchido com silêncio');
});

test('gravador: calibração de latência encontra os cliques no áudio gravado', () => {
  let seed = 9; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x3fffffff - 1; };
  for (const ms of [18, 72, 145]) {
    const pcm = new Float32Array(SR * 4); for (let i = 0; i < pcm.length; i++) pcm[i] = rnd() * 0.002;
    const times = [0.5, 1, 1.5, 2, 2.5, 3];
    for (const t of times) { const a = Math.round((t + ms / 1000) * SR); for (let k = 0; k < 400; k++) pcm[a + k] += Math.sin(k * 0.23) * 0.3 * Math.exp(-k / 90); }
    const r = estimateLatency(pcm, SR, times); assert.ok(r && Math.abs(r.ms - ms) <= 3, `latência ${ms} ms: achou ${r && r.ms}`); assert.equal(r.found, 6);
  }
  assert.equal(estimateLatency(new Float32Array(SR), SR, [0.2, 0.4]), null, 'sem cliques audíveis não há estimativa');
});

test('forma de onda, mixagem rápida e WAV vão e voltam', () => {
  const x = new Float32Array(SR); for (let i = 0; i < SR; i++) x[i] = Math.sin(i / 20) * 0.5;
  const pk = peaksOf(x, 100); assert.equal(pk.length, 200); assert.ok(pk[1] > 0.45 && pk[0] < -0.45);
  const [L, R] = quickMix([x, x], [-1, 1]); assert.ok(Math.abs(L[100]) > 0.1 && Math.abs(L[100] - R[100]) < 1e-6);
  const blob = encodeWav([L, R], SR, { bits: 16 });
  return blob.arrayBuffer().then((ab) => { const w = decodeWav(ab); assert.equal(w.sampleRate, SR); assert.equal(w.channels.length, 2); assert.ok(Math.abs(w.channels[0][100] - L[100]) < 1e-3); return encodeWav([x], SR, { bits: 24, dither: false }).arrayBuffer(); })
    .then((ab) => { const w = decodeWav(ab); assert.ok(Math.abs(w.channels[0][777] - x[777]) < 1e-5, '24 bits'); });
});

test('missões da mesa: estado inicial falha, estado corrigido passa', () => {
  const m = { prePeak: [-12, -12, -12, -12, -12, -12], clipAgo: [9, 9, 9, 9, 9, 9], postRms: [-20, -20, -20, -20, -20, -20], L: -18, R: -18 };
  for (const ms of MISSIONS) { const s = defaultState(6); ms.init(s); assert.ok(ms.id === 'ganho' || ms.id === 'equilibrio' || !ms.checks(s, m).every((c) => c.ok), `${ms.id}: o estado inicial não pode passar`); }
  const s = defaultState(6); s.ch.forEach((x, i) => { x.hpf = i > 0; }); assert.ok(MISSIONS[1].checks(s, m).every((c) => c.ok));
  s.ch.forEach((x, i) => { x.pan = [0, -0.6, 0.6, -0.3, 0.3, 0][i]; }); assert.ok(MISSIONS[3].checks(s, m).every((c) => c.ok));
  assert.ok(MISSIONS[0].checks(s, m).every((c) => c.ok)); assert.ok(!MISSIONS[0].checks(s, { ...m, prePeak: [-12, -2, -12, -12, -12, -30] }).every((c) => c.ok));
  assert.ok(MISSIONS[2].checks(s, m).every((c) => c.ok)); assert.ok(!MISSIONS[2].checks(s, { ...m, postRms: [-20, -20, -30, -20, -20, -20] }).every((c) => c.ok));
});
