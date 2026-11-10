import test from 'node:test';
import assert from 'node:assert/strict';
import { createRangeTracker, tessitura, classify, analyzeSustain, detectBreaks, featureMean, estimateRegister, createSoundTimer, milestones } from '../js/audio/voice-analysis.js';

const DT = 1024 / 48000;
test('extensão: só conta nota sustentada por 300 ms com confiança alta', () => {
  const tr = createRangeTracker(); let t = 0;
  const hold = (m, sec, c = 0.95) => { for (let i = 0; i < sec / DT; i++) { tr.push(t, m, c); t += DT; } };
  hold(45, 0.6); hold(null, 0.2); hold(40, 0.15); hold(null, 0.2); hold(69, 0.5); hold(76, 0.6, 0.6); hold(57, 2); hold(59, 1.5);
  const r = tr.result();
  assert.equal(r.lo, 45, 'nota de 150 ms não conta'); assert.equal(r.hi, 69, 'nota com clareza baixa não conta');
  const ts = tessitura(r.hist); assert.equal(ts.peak, 57); assert.ok(ts.lo <= 57 && ts.hi >= 59);
});

test('classificação aproximada', () => {
  assert.equal(classify(45, 69)[0].id, 'baritono'); assert.equal(classify(40, 62)[0].id, 'baixo'); assert.equal(classify(48, 72)[0].id, 'tenor');
  assert.equal(classify(60, 84)[0].id, 'soprano'); assert.equal(classify(55, 77)[0].id, 'contralto'); assert.deepEqual(classify(null, null), []);
});

test('vibrato: taxa e extensão de um sinal sintetizado; nota reta não tem vibrato', () => {
  const mk = (rate, ext, drift = 0) => Array.from({ length: 200 }, (_, i) => ({ t: i * DT, m: 60 + (ext / 100) * Math.sin(2 * Math.PI * rate * i * DT) + drift * i * DT + (Math.sin(i * 12.9898) * 43758.5453 % 1) * 0.02 }));
  for (const [rate, ext] of [[5.5, 40], [6.3, 25], [4.8, 60]]) {
    const r = analyzeSustain(mk(rate, ext));
    assert.ok(Math.abs(r.rate - rate) < 0.35, `taxa ${r.rate.toFixed(2)} x ${rate}`); assert.ok(Math.abs(r.extent - ext) < ext * 0.25, `extensão ${r.extent.toFixed(1)} x ${ext}`);
  }
  const flat = analyzeSustain(mk(5.5, 0)); assert.equal(flat.hasVibrato, false); assert.ok(flat.stability < 5);
  const drift = analyzeSustain(mk(5.5, 0, 0.1)); assert.ok(drift.stability > 8, 'nota que escorrega deve ter estabilidade pior');
});

test('passagens: acha quebra por salto, por falha e por mudança de timbre; sirene limpa não tem quebra', () => {
  const siren = (fn) => Array.from({ length: 300 }, (_, i) => fn(i, { t: i * DT, m: 48 + i * 0.08, c: 0.95, h1h2: 3 }));
  assert.deepEqual(detectBreaks(siren((i, f) => f)), []);
  const jump = detectBreaks(siren((i, f) => (i >= 180 ? { ...f, m: f.m + 2.5 } : f))); assert.equal(jump.length, 1); assert.ok(Math.abs(jump[0].m - (48 + 180 * 0.08)) <= 1.5);
  const gap = detectBreaks(siren((i, f) => (i >= 200 && i < 206 ? { ...f, m: null, c: 0.2 } : f))); assert.equal(gap.length, 1); assert.equal(gap[0].kind, 'falha');
  const tim = detectBreaks(siren((i, f) => (i >= 150 ? { ...f, h1h2: 14 } : f))); assert.equal(tim.length, 1); assert.equal(tim[0].kind, 'timbre');
});

test('registro: calibração separa peito e cabeça na mesma nota; sem calibração a confiança é menor', () => {
  const chest = featureMean(Array.from({ length: 20 }, () => ({ m: 64, h1h2: 2, tilt: -8, hf: -14 })));
  const head = featureMean(Array.from({ length: 20 }, () => ({ m: 64, h1h2: 14, tilt: -15, hf: -30 })));
  const cal = { chest, head };
  const a = estimateRegister({ m: 64, h1h2: 2.5, tilt: -8.5, hf: -15 }, cal, 64), b = estimateRegister({ m: 64, h1h2: 13, tilt: -14, hf: -29 }, cal, 64);
  assert.equal(a.reg, 'peito'); assert.equal(b.reg, 'cabeça'); assert.ok(a.conf > 0.4 && b.conf > 0.4);
  const mid = estimateRegister({ m: 64, h1h2: 8, tilt: -11.5, hf: -22 }, cal, 64); assert.equal(mid.reg, 'misto');
  const un = estimateRegister({ m: 50, h1h2: 2, tilt: -8, hf: -14 }, null, null); assert.equal(un.reg, 'peito'); assert.ok(un.conf <= 0.6);
  assert.equal(estimateRegister({ m: null }, cal, 64), null);
});

test('tempo de som contínuo tolera pausa curta e detecta o fim', () => {
  const tm = createSoundTimer(); let t = 0;
  for (; t < 5; t += DT) tm.push(t, !(t > 2 && t < 2.2));
  assert.ok(Math.abs(tm.best() - 5) < 0.1);
  for (; t < 6; t += DT) tm.push(t, false);
  assert.ok(tm.ended(t)); assert.ok(Math.abs(tm.best() - 5) < 0.1);
});

test('marcos: primeira vez com uma oitava e meia', () => {
  const ev = [{ type: 'range', ts: 1, data: { lo: 48, hi: 62 } }, { type: 'range', ts: 2, data: { lo: 47, hi: 65 } }, { type: 'range', ts: 3, data: { lo: 45, hi: 66 } }, { type: 'lesson', ts: 4, data: { id: 1 } }, { type: 'breath', ts: 5, data: { seconds: 22 } }];
  const ms = milestones(ev);
  assert.equal(ms.find((x) => x.id === 'oitava-meia').ts, 2); assert.equal(ms.find((x) => x.id === 'oitava').ts, 1);
  assert.ok(ms.some((x) => x.id === 'sss-20')); assert.ok(!ms.some((x) => x.id === 'duas-oitavas'));
});
