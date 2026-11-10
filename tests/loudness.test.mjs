// Valida o medidor com os sinais sintéticos do EBU Tech 3341 (casos 1 a 5) e os casos de true peak (15 a 19).
// Os casos 7 e 8 usam arquivos de programa do EBU e não podem ser sintetizados aqui.
import test from 'node:test';
import assert from 'node:assert/strict';
import { kWeightCoeffs, measureLoudness, truePeak, samplePeak, limit, compCurve, crush, rmsDb } from '../js/audio/loudness.js';

const FS = 48000;
const sine = (db, sec, f = 1000, ph = 0) => { const a = Math.pow(10, db / 20), n = Math.round(sec * FS), x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = a * Math.sin(2 * Math.PI * f * i / FS + ph); return x; };
const cat = (...p) => { const o = new Float32Array(p.reduce((a, x) => a + x.length, 0)); let k = 0; for (const x of p) { o.set(x, k); k += x.length; } return o; };
const st = (x) => [x, x];
const near = (v, t, tol, msg) => assert.ok(Math.abs(v - t) <= tol, `${msg}: ${v.toFixed(2)} (esperado ${t} ± ${tol})`);

test('filtro K: coeficientes a 48 kHz iguais aos da ITU-R BS.1770', () => {
  const [s1, s2] = kWeightCoeffs(48000);
  near(s1.b[0], 1.53512485958697, 1e-6, 'b0'); near(s1.b[1], -2.69169618940638, 1e-6, 'b1'); near(s1.b[2], 1.19839281085285, 1e-6, 'b2');
  near(s1.a[0], -1.69065929318241, 1e-6, 'a1'); near(s1.a[1], 0.73248077421585, 1e-6, 'a2');
  near(s2.a[0], -1.99004745483398, 1e-6, 'a1 RLB'); near(s2.a[1], 0.99007225036621, 1e-6, 'a2 RLB');
});

test('EBU Tech 3341, caso 1: seno estéreo de 1 kHz a −23 dBFS por 20 s → −23,0 LUFS (M, S e I)', () => {
  const r = measureLoudness(st(sine(-23, 20)), FS); near(r.integrated, -23, 0.1, 'I'); near(r.momentaryMax, -23, 0.1, 'M'); near(r.shortMax, -23, 0.1, 'S');
});
test('EBU Tech 3341, caso 2: −33 dBFS → −33,0 LUFS', () => { near(measureLoudness(st(sine(-33, 20)), FS).integrated, -33, 0.1, 'I'); });
test('EBU Tech 3341, caso 3: 10 s a −36, 60 s a −23, 10 s a −36 → −23,0 LUFS (porta relativa)', () => { near(measureLoudness(st(cat(sine(-36, 10), sine(-23, 60), sine(-36, 10))), FS).integrated, -23, 0.1, 'I'); });
test('EBU Tech 3341, caso 4: com trechos a −72 dBFS → −23,0 LUFS (porta absoluta)', () => { near(measureLoudness(st(cat(sine(-72, 10), sine(-36, 10), sine(-23, 60), sine(-36, 10), sine(-72, 10))), FS).integrated, -23, 0.1, 'I'); });
test('EBU Tech 3341, caso 5: 20 s a −26, 20,1 s a −20, 20 s a −26 → −23,0 LUFS', () => { near(measureLoudness(st(cat(sine(-26, 20), sine(-20, 20.1), sine(-26, 20))), FS).integrated, -23, 0.1, 'I'); });
test('medidor funciona a 44,1 kHz e em mono (mono fica 3 LU abaixo do estéreo)', () => {
  const n = 44100 * 10, x = new Float32Array(n), a = Math.pow(10, -23 / 20); for (let i = 0; i < n; i++) x[i] = a * Math.sin(2 * Math.PI * 1000 * i / 44100);
  near(measureLoudness([x, x], 44100).integrated, -23, 0.1, 'estéreo 44,1k'); near(measureLoudness([x], 44100).integrated, -26.01, 0.1, 'mono');
});

test('EBU Tech 3341, casos 15 a 19: true peak dentro de +0,2/−0,4 dB', () => {
  const tp = (f, deg, amp) => { const x = new Float32Array(FS); for (let i = 0; i < FS; i++) x[i] = amp * Math.min(1, i / 960, (FS - 1 - i) / 960) * Math.sin(2 * Math.PI * f * i / FS + (deg * Math.PI) / 180); return truePeak([x]); }; // rampas de 20 ms: sem o estalo de início, que tem pico próprio
  const chk = (v, t, name) => assert.ok(v <= t + 0.2 && v >= t - 0.4, `${name}: ${v.toFixed(2)} dBTP (esperado ${t} +0,2/−0,4)`);
  chk(tp(FS / 4, 0, 0.5), -6, 'caso 15 (fs/4, 0°)'); chk(tp(FS / 4, 45, 0.5), -6, 'caso 16 (fs/4, 45°)'); chk(tp(FS / 6, 60, 0.5), -6, 'caso 17 (fs/6, 60°)'); chk(tp(FS / 8, 67.5, 0.5), -6, 'caso 18 (fs/8, 67,5°)');
  chk(tp(FS / 4, 45, 1.41), 3, 'caso 19 (fs/4, 45°, +3 dBTP)');
  const x = new Float32Array(FS); for (let i = 0; i < FS; i++) x[i] = 0.5 * Math.sin(2 * Math.PI * (FS / 4) * i / FS + Math.PI / 4);
  near(samplePeak([x]), -9.03, 0.05, 'o pico de amostra subestima em 3 dB');
});

test('limiter: respeita o teto, aumenta o volume e reduz a faixa dinâmica', () => {
  let seed = 3; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x3fffffff - 1; };
  const n = FS * 6, x = new Float32Array(n); for (let i = 0; i < n; i++) { const env = 0.15 + 0.85 * Math.pow(Math.max(0, Math.sin(2 * Math.PI * 2 * i / FS)), 8); x[i] = env * 0.5 * (Math.sin(2 * Math.PI * 220 * i / FS) + 0.3 * rnd()); }
  const before = measureLoudness(st(x), FS);
  const r = limit(st(x), FS, { gainDb: 12, ceilingDb: -1 });
  assert.ok(samplePeak(r.channels) <= -1 + 0.01, `pico ${samplePeak(r.channels).toFixed(2)} acima do teto`);
  assert.ok(truePeak(r.channels) <= -1 + 0.3, `true peak ${truePeak(r.channels).toFixed(2)} dBTP acima do teto de −1`);
  const after = measureLoudness(r.channels, FS);
  assert.ok(after.integrated > before.integrated + 5, `volume subiu só ${(after.integrated - before.integrated).toFixed(1)} LU`);
  assert.ok(r.maxReduction > 3); const quiet = limit(st(x), FS, { gainDb: 0, ceilingDb: -1 }); assert.ok(quiet.maxReduction < 0.01, 'sem excesso, o limiter não age');
  const plr0 = samplePeak(st(x)) - before.integrated, plr1 = samplePeak(r.channels) - after.integrated; assert.ok(plr1 < plr0 - 3, 'a distância pico–volume diminui');
});

test('curva do compressor e redução de bits', () => {
  assert.equal(compCurve(-30, { threshold: -20, ratio: 4 }), -30); near(compCurve(-8, { threshold: -20, ratio: 4 }), -17, 1e-9, '4:1'); near(compCurve(0, { threshold: -20, ratio: 4, makeup: 6 }), -9, 1e-9, 'compensação');
  const x = sine(-20, 1, 440), q8 = crush(x, { bits: 8 }), d8 = crush(x, { bits: 8, dither: true });
  const err = (y) => { const e = new Float32Array(x.length); for (let i = 0; i < x.length; i++) e[i] = y[i] - x[i]; return rmsDb(e); };
  assert.ok(err(q8) < -45 && err(q8) > -60, `ruído de quantização a 8 bits: ${err(q8).toFixed(1)} dB`); assert.ok(err(d8) > err(q8), 'dither soma um pouco de ruído'); assert.ok(err(crush(x, { bits: 16 })) < -95);
});
