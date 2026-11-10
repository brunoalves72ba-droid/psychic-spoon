// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Lógica do gravador multipista (pura, testada em tests/recorder.test.mjs):
// montagem das tomadas alinhadas ao relógio de áudio, calibração de latência e forma de onda.

/**
 * Junta os blocos de PCM capturados e corta a partir do instante t0 (relógio do AudioContext),
 * compensando a latência (s). chunks: [{data: Float32Array, t: instante da 1ª amostra}].
 */
export function assemble(chunks, t0, sampleRate, latency = 0, maxSeconds = Infinity) {
  if (!chunks.length) return new Float32Array(0);
  const start = chunks[0].t; const total = chunks.reduce((a, c) => a + c.data.length, 0);
  const all = new Float32Array(total); let o = 0; for (const c of chunks) { all.set(c.data, o); o += c.data.length; }
  const skip = Math.round((t0 + latency - start) * sampleRate);
  const len = Math.min(Math.max(0, total - Math.max(0, skip)), Math.round(maxSeconds * sampleRate));
  const out = new Float32Array(len + Math.max(0, -skip));
  if (skip >= 0) out.set(all.subarray(skip, skip + len)); else out.set(all.subarray(0, len), -skip); // começou depois de t0: preenche com silêncio
  return out;
}

/**
 * Estima a latência de ida e volta: procura no áudio gravado os cliques tocados em clickTimes
 * (segundos a partir do início de pcm). Devolve { ms, found } ou null.
 */
export function estimateLatency(pcm, sampleRate, clickTimes, maxMs = 400) {
  const win = Math.round(sampleRate * 0.002), env = new Float32Array(Math.floor(pcm.length / win));
  for (let i = 0; i < env.length; i++) { let s = 0; for (let k = 0; k < win; k++) { const v = pcm[i * win + k]; s += v * v; } env[i] = Math.sqrt(s / win); }
  const sorted = Array.from(env).sort((a, b) => a - b), floor = sorted[Math.floor(sorted.length * 0.5)], peak = sorted[sorted.length - 1];
  if (peak < floor * 4 || peak < 0.004) return null;
  const thr = floor + (peak - floor) * 0.35; const delays = [];
  for (const ct of clickTimes) {
    const a = Math.floor((ct * sampleRate) / win), b = Math.min(env.length, a + Math.ceil((maxMs / 1000) * sampleRate / win));
    for (let i = Math.max(0, a); i < b; i++) if (env[i] >= thr) { delays.push((i * win) / sampleRate - ct); break; }
  }
  if (delays.length < Math.max(2, clickTimes.length / 2)) return null;
  delays.sort((x, y) => x - y); const med = delays[Math.floor(delays.length / 2)];
  const close = delays.filter((d) => Math.abs(d - med) < 0.012);
  return { ms: Math.round((close.reduce((x, y) => x + y, 0) / close.length) * 1000), found: close.length };
}

/** Picos para desenhar a forma de onda: n colunas com [mín, máx]. */
export function peaksOf(pcm, n) {
  const out = new Float32Array(n * 2), step = pcm.length / n;
  for (let i = 0; i < n; i++) { let lo = 0, hi = 0; const a = Math.floor(i * step), b = Math.min(pcm.length, Math.floor((i + 1) * step)); for (let k = a; k < b; k++) { const v = pcm[k]; if (v < lo) lo = v; if (v > hi) hi = v; } out[i * 2] = lo; out[i * 2 + 1] = hi; }
  return out;
}

/** Soma simples de pistas mono em estéreo (para ouvir e exportar sem a mesa). pans: −1..1. */
export function quickMix(tracks, pans) {
  const n = Math.max(0, ...tracks.map((t) => t.length)), L = new Float32Array(n), R = new Float32Array(n), g = 1 / Math.sqrt(Math.max(1, tracks.length));
  tracks.forEach((x, k) => { const p = pans ? pans[k] : 0, gl = Math.cos(((p + 1) * Math.PI) / 4) * g * 1.2, gr = Math.sin(((p + 1) * Math.PI) / 4) * g * 1.2; for (let i = 0; i < x.length; i++) { L[i] += x[i] * gl; R[i] += x[i] * gr; } });
  let pk = 0; for (let i = 0; i < n; i++) { const a = Math.max(Math.abs(L[i]), Math.abs(R[i])); if (a > pk) pk = a; }
  if (pk > 0.98) { const k = 0.98 / pk; for (let i = 0; i < n; i++) { L[i] *= k; R[i] *= k; } }
  return [L, R];
}
