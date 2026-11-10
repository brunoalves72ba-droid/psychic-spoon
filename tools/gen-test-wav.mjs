// Gera tests/e2e/voz-falsa.wav: "voz" sintetizada para o microfone falso do Chromium.
// Sequência: Lá2 sustentado com vibrato, sirene subindo até Lá4 e descendo, escala, "sss".
import { writeFileSync } from 'node:fs';
const sr = 48000, out = [];
let ph = 0, seed = 5;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x3fffffff - 1; };
function tone(dur, f0, f1 = f0, { vib = 0, amp = 0.35, bright = 1 } = {}) {
  const n = Math.floor(dur * sr);
  for (let i = 0; i < n; i++) {
    const t = i / n, f = f0 * Math.pow(f1 / f0, t) * (1 + vib * 0.006 * Math.sin(2 * Math.PI * 5.5 * i / sr));
    ph += 2 * Math.PI * f / sr;
    let v = 0; for (let k = 1; k <= 12 && k * f < 6000; k++) v += Math.sin(ph * k) / Math.pow(k, bright);
    const env = Math.min(1, i / 2400, (n - i) / 2400);
    out.push(v * amp * env + rnd() * 0.003);
  }
}
const sil = (d) => { for (let i = 0; i < d * sr; i++) out.push(rnd() * 0.002); };
const hiss = (d) => { let lp = 0; for (let i = 0; i < d * sr; i++) { const x = rnd(); lp = lp * 0.6 + x * 0.4; out.push((x - lp) * 0.25 * Math.min(1, i / 2000)); } };
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
tone(3, hz(57), hz(57), { vib: 1 }); sil(0.4);
tone(4, hz(45), hz(69)); tone(4, hz(69), hz(45)); sil(0.4);
for (const m of [57, 59, 61, 62, 64, 62, 61, 59, 57]) tone(0.6, hz(m));
sil(0.4); hiss(4); sil(0.5);
tone(2.5, hz(64), hz(64), { vib: 1, bright: 2.2, amp: 0.3 }); sil(0.5);
const n = out.length, buf = Buffer.alloc(44 + n * 2);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, out[i])) * 32767), 44 + i * 2);
writeFileSync(new URL('../tests/e2e/voz-falsa.wav', import.meta.url), buf);
console.log('voz-falsa.wav:', (n / sr).toFixed(1), 's');
