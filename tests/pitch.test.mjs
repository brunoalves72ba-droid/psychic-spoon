// Critério: erro abaixo de 10 cents em sinais sintetizados com ruído, de 60 a 1200 Hz.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createPitchDetector, createOctaveGuard, createSpectral, createMicCore } from '../js/audio/pitch-core.js';

let seed = 42;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x3fffffff - 1; };
/** Sinal harmônico: amps[k] = amplitude do harmônico k+1. snr em dB. */
function synth(sr, f, n, amps, snr, phase = 0) {
  const x = new Float32Array(n); let p = 0;
  for (let i = 0; i < n; i++) { let v = 0; for (let k = 0; k < amps.length; k++) if ((k + 1) * f < sr / 2) v += amps[k] * Math.sin(2 * Math.PI * (k + 1) * f * i / sr + phase * (k + 1)); x[i] = v; p += v * v; }
  const na = Math.sqrt(p / n) / Math.pow(10, snr / 20) * Math.sqrt(3);
  for (let i = 0; i < n; i++) x[i] += rnd() * na;
  return x;
}
const TIMBRES = {
  senoide: [1],
  serra: Array.from({ length: 20 }, (_, k) => 1 / (k + 1)),
  'voz (2º harmônico forte)': [0.5, 1, 0.6, 0.3, 0.2, 0.1, 0.08, 0.05],
  'fundamental fraca': [0.15, 0.8, 1, 0.5, 0.3, 0.2],
};
const cents = (a, b) => 1200 * Math.log2(a / b);

for (const sr of [44100, 48000]) {
  test(`altura: erro < 10 cents de 60 a 1200 Hz com ruído (SNR 20 dB) a ${sr} Hz`, () => {
    const det = createPitchDetector(sr, 2048);
    let worst = 0, count = 0;
    for (const [name, amps] of Object.entries(TIMBRES)) {
      for (let m = 35.2; m <= 86.2; m += 0.73) { // ~60 Hz a ~1200 Hz, fora da grade temperada
        const f = 440 * Math.pow(2, (m - 69) / 12);
        if (f < 60 || f > 1200) continue;
        const r = det.detect(synth(sr, f, 2048, amps, 20, m));
        assert.ok(r.freq > 0, `${name} ${f.toFixed(1)} Hz: sem leitura`);
        const e = Math.abs(cents(r.freq, f));
        assert.ok(e < 10, `${name} ${f.toFixed(1)} Hz: leu ${r.freq.toFixed(2)} (erro ${e.toFixed(1)} cents)`);
        assert.ok(r.clarity > 0.8, `${name} ${f.toFixed(1)} Hz: clareza baixa ${r.clarity.toFixed(2)}`);
        worst = Math.max(worst, e); count++;
      }
    }
    console.log(`    ${count} sinais, pior erro ${worst.toFixed(2)} cents`);
  });
}

test('altura: ruído puro e silêncio não geram nota confiável', () => {
  const det = createPitchDetector(48000, 2048);
  assert.equal(det.detect(new Float32Array(2048)).freq, 0);
  let conf = 0;
  for (let k = 0; k < 40; k++) { const x = new Float32Array(2048); for (let i = 0; i < 2048; i++) x[i] = rnd() * 0.3; const r = det.detect(x); if (r.freq && r.clarity > 0.85) conf++; }
  assert.equal(conf, 0);
});

test('proteção de oitava: um quadro isolado uma oitava acima é trazido de volta', () => {
  const g = createOctaveGuard();
  for (let i = 0; i < 6; i++) assert.equal(g.push(220, 0.95), 220);
  const fixed = g.push(441, 0.9);
  assert.ok(Math.abs(cents(fixed, 220.5)) < 1, 'corrige o salto isolado');
  assert.equal(g.push(220, 0.95), 220);
  // salto verdadeiro: persiste e passa a valer
  g.push(440, 0.95); g.push(440, 0.95); const ok = g.push(440, 0.95);
  assert.equal(ok, 440);
});

test('medidas do espectro: H1−H2 e inclinação distinguem timbre cheio de timbre flautado', () => {
  const sr = 48000, sp = createSpectral(sr, 2048), f = 330;
  const cheio = sp(synth(sr, f, 2048, Array.from({ length: 14 }, (_, k) => 1 / Math.pow(k + 1, 0.8)), 40), f);
  const flauta = sp(synth(sr, f, 2048, [1, 0.12, 0.03, 0.01], 40), f);
  assert.ok(flauta.h1h2 > cheio.h1h2 + 8, `H1−H2 ${flauta.h1h2.toFixed(1)} x ${cheio.h1h2.toFixed(1)}`);
  assert.ok(flauta.tilt < cheio.tilt - 4, `inclinação ${flauta.tilt.toFixed(1)} x ${cheio.tilt.toFixed(1)}`);
  assert.ok(flauta.hf < cheio.hf, 'menos energia acima de 2 kHz');
  assert.ok(Math.abs(sp(synth(sr, f, 2048, [1, 0.5], 60), f).h1h2 - 6.02) < 0.7, 'H1−H2 de 2:1 ≈ 6 dB');
});

test('núcleo do microfone: emite altura e PCM contínuo em blocos de 128', () => {
  const sr = 48000, msgs = [];
  const core = createMicCore(sr, (m) => msgs.push(m));
  core.config({ pitch: true, pcm: true, spec: true });
  const x = synth(sr, 196, sr, TIMBRES.serra, 30);
  for (let i = 0; i + 128 <= x.length; i += 128) core.process(x.subarray(i, i + 128), i / sr);
  core.flush();
  const pit = msgs.filter((m) => m.type === 'pitch' && m.f > 0);
  assert.ok(pit.length > 30);
  for (const p of pit.slice(2)) assert.ok(Math.abs(cents(p.f, 196)) < 10);
  assert.ok('h1h2' in pit[5]);
  const pcm = msgs.filter((m) => m.type === 'pcm');
  const total = pcm.reduce((a, m) => a + m.data.length, 0);
  assert.equal(total, Math.floor(sr / 128) * 128);
  assert.equal(pcm[1].at, 2048);
  assert.ok(Math.abs(pcm[1].data[0] - x[2048]) < 1e-6);
});
