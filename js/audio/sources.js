// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Fontes de áudio dos simuladores e da mesa: tudo sintetizado e renderizado fora do tempo real.

import { getCtx, choirNote, renderOffline, noiseBuffer } from './engine.js';
import { getArrangement, ODE } from '../music/arrangements.js';

const cache = new Map();
const once = (key, fn) => { if (!cache.has(key)) { const p = fn(); cache.set(key, p); p.catch(() => cache.delete(key)); } return cache.get(key); };
const SR = () => getCtx().sampleRate;

/** "Voz" solo: melodia com vogais variadas e sibilantes ("s") entre as notas. Mono, ~11 s. */
export function voiceBuffer() {
  return once('voz', () => {
    const mel = ODE.levels[0].steps, beat = 60 / 88, vowels = ['a', 'e', 'i', 'o', 'u', 'a', 'e'];
    const total = mel.reduce((a, s) => a + s.d, 0) * beat + 0.8;
    return renderOffline(total, (oc, dest) => {
      let t = 0.1;
      mel.forEach((s, i) => {
        const d = s.d * beat;
        choirNote(s.n[0] - 12, t, d * 0.9, { ctx: oc, dest, voice: 3, vowel: vowels[i % vowels.length], gain: 0.5 + 0.25 * Math.sin(i * 1.7), att: 0.03, rel: 0.08 });
        if (i % 2 === 0) { // sibilante antes da nota
          const n = oc.createBufferSource(); n.buffer = noiseBuffer(oc); const f = oc.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 6800; f.Q.value = 1.2; const g = oc.createGain();
          g.gain.setValueAtTime(0, Math.max(0, t - 0.09)); g.gain.linearRampToValueAtTime(0.5, Math.max(0.01, t - 0.04)); g.gain.linearRampToValueAtTime(0, t + 0.02);
          n.connect(f); f.connect(g); g.connect(dest); n.start(Math.max(0, t - 0.1), i * 0.13); n.stop(t + 0.05);
        }
        t += d;
      });
    }, { sampleRate: SR(), channels: 1 });
  });
}

/** Seis pistas mono (uma por voz) de um arranjo do app. */
export function stems(arrId = 'aurora') {
  return once('stems:' + arrId, async () => {
    const arr = getArrangement(arrId), beat = 60 / arr.tempo, total = arr.steps.reduce((a, s) => a + s.d, 0) * beat + 0.6;
    const out = [];
    for (let v = 0; v < 6; v++) {
      out.push(await renderOffline(total, (oc, dest) => { let t = 0.05; for (const s of arr.steps) { const d = s.d * beat; choirNote(s.n[v], t, d * 0.97, { ctx: oc, dest, voice: v, vowel: v === 0 ? 'o' : 'u', gain: v === 0 ? 0.5 : 0.4 }); t += d; } }, { sampleRate: SR(), channels: 1 }));
    }
    return out;
  });
}

/** Mixagem estéreo simples das seis vozes (para os simuladores de master). */
export function mixBuffer(arrId = 'aurora') {
  return once('mix:' + arrId, async () => {
    const st = await stems(arrId), c = getCtx(), n = st[0].length, buf = c.createBuffer(2, n, st[0].sampleRate), L = buf.getChannelData(0), R = buf.getChannelData(1);
    st.forEach((b, v) => { const x = b.getChannelData(0), pan = (v / 5 - 0.5) * 1.2, gl = Math.cos((pan + 1) * Math.PI / 4) * 0.5, gr = Math.sin((pan + 1) * Math.PI / 4) * 0.5; for (let i = 0; i < n; i++) { L[i] += x[i] * gl; R[i] += x[i] * gr; } });
    return buf;
  });
}

/** Ruído rosa (aprox.) em laço, mono. */
export function pinkBuffer() {
  return once('pink', async () => {
    const c = getCtx(), n = c.sampleRate * 3, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0, s = 99;
    for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; const w = s / 0x3fffffff - 1; b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12; }
    return buf;
  });
}

/** AudioBuffer mono a partir de Float32Array. */
export function bufferFrom(channels, sampleRate) {
  const c = getCtx(), buf = c.createBuffer(channels.length, channels[0].length, sampleRate);
  channels.forEach((x, i) => buf.getChannelData(i).set(x));
  return buf;
}
