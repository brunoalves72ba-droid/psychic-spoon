// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Volume percebido (LUFS) conforme ITU-R BS.1770-4, true peak com superamostragem de 4×,
// limiter com antecipação (lookahead) e utilitários de dinâmica. Lógica pura, testada com
// os sinais sintéticos do EBU Tech 3341 em tests/loudness.test.mjs.

/** Coeficientes do filtro K (pré-filtro shelving + passa-altas RLB) para qualquer taxa de amostragem. */
export function kWeightCoeffs(fs) {
  const f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196;
  let K = Math.tan(Math.PI * f0 / fs); const Vh = Math.pow(10, G / 20), Vb = Math.pow(Vh, 0.4996667741545416);
  let a0 = 1 + K / Q + K * K;
  const s1 = { b: [(Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0], a: [2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0] };
  const f1 = 38.13547087602444, Q1 = 0.5003270373238773; K = Math.tan(Math.PI * f1 / fs); a0 = 1 + K / Q1 + K * K;
  const s2 = { b: [1, -2, 1], a: [2 * (K * K - 1) / a0, (1 - K / Q1 + K * K) / a0] };
  return [s1, s2];
}
function biquad(x, { b, a }) {
  const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const v = b[0] * x[i] + b[1] * x1 + b[2] * x2 - a[0] * y1 - a[1] * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
  return y;
}
const toLufs = (ms) => -0.691 + 10 * Math.log10(ms + 1e-20);

/**
 * Mede o volume de um programa. channels: [Float32Array] (mono, ou estéreo E/D).
 * Devolve { integrated, momentaryMax, shortMax, range (LRA simplificado), blocks }.
 */
export function measureLoudness(channels, fs) {
  const k = kWeightCoeffs(fs); const filt = channels.map((c) => biquad(biquad(c, k[0]), k[1]));
  const n = filt[0].length, win = Math.round(0.4 * fs), hop = Math.round(0.1 * fs);
  // soma acumulada dos quadrados (todos os canais com peso 1: E, D ou mono)
  const cum = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) { let s = 0; for (const c of filt) s += c[i] * c[i]; cum[i + 1] = cum[i] + s; }
  const blocks = []; for (let st = 0; st + win <= n; st += hop) blocks.push((cum[st + win] - cum[st]) / win);
  if (!blocks.length) return { integrated: -Infinity, momentaryMax: -Infinity, shortMax: -Infinity, range: 0, blocks: [] };
  const abs = blocks.filter((b) => toLufs(b) > -70);
  let integrated = -Infinity;
  if (abs.length) { const rel = toLufs(abs.reduce((a, b) => a + b, 0) / abs.length) - 10; const g = abs.filter((b) => toLufs(b) > rel); if (g.length) integrated = toLufs(g.reduce((a, b) => a + b, 0) / g.length); }
  const momentaryMax = toLufs(Math.max(...blocks));
  const sWin = Math.round(3 * fs); const short = []; for (let st = 0; st + sWin <= n; st += hop) short.push((cum[st + sWin] - cum[st]) / sWin);
  const shortMax = short.length ? toLufs(Math.max(...short)) : momentaryMax;
  // faixa de volume (LRA, EBU Tech 3342): percentis 10 e 95 dos blocos de 3 s com porta relativa de −20 LU
  let range = 0; const sAbs = short.filter((b) => toLufs(b) > -70);
  if (sAbs.length > 1) { const rel = toLufs(sAbs.reduce((a, b) => a + b, 0) / sAbs.length) - 20; const g = sAbs.map(toLufs).filter((v) => v > rel).sort((a, b) => a - b); if (g.length > 1) range = g[Math.min(g.length - 1, Math.round(0.95 * (g.length - 1)))] - g[Math.round(0.1 * (g.length - 1))]; }
  return { integrated, momentaryMax, shortMax, range, blocks: blocks.map(toLufs) };
}

// interpolador polifásico de 4× (sinc com janela de Kaiser, 24 taps por fase)
let TP = null;
function tpFilter() {
  if (TP) return TP; const L = 4, taps = 24, N = L * taps, beta = 9, h = new Float64Array(N);
  const i0 = (x) => { let s = 1, t = 1; for (let k = 1; k < 30; k++) { t *= (x / (2 * k)) * (x / (2 * k)); s += t; } return s; };
  let sum = 0;
  for (let n = 0; n < N; n++) { const m = n - (N - 1) / 2, x = m / L; const sinc = Math.abs(x) < 1e-9 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x); const r = (2 * n) / (N - 1) - 1; h[n] = sinc * i0(beta * Math.sqrt(Math.max(0, 1 - r * r))) / i0(beta); sum += h[n]; }
  const phases = []; for (let p = 0; p < L; p++) { const c = new Float64Array(taps); for (let t = 0; t < taps; t++) c[t] = h[t * L + p] * L / sum; phases.push(c); }
  TP = { phases, taps }; return TP;
}
/** Para cada amostra, o maior valor absoluto entre ela e os pontos interpolados (4×) ao redor. */
export function interPeaks(x) {
  const { phases, taps } = tpFilter(), n = x.length, out = new Float32Array(n), half = taps >> 1;
  for (let i = 0; i < n; i++) {
    let pk = Math.abs(x[i]);
    for (let p = 0; p < 4; p++) { const c = phases[p]; let s = 0; const j0 = i - half + 1; for (let t = 0; t < taps; t++) { const j = j0 + t; if (j >= 0 && j < n) s += x[j] * c[taps - 1 - t]; } const v = s < 0 ? -s : s; if (v > pk) pk = v; }
    out[i] = pk;
  }
  return out;
}
/** True peak em dBTP (maior valor absoluto do sinal superamostrado 4×, em todos os canais). */
export function truePeak(channels) {
  let peak = 0; for (const x of channels) { const p = interPeaks(x); for (let i = 0; i < p.length; i++) if (p[i] > peak) peak = p[i]; }
  return 20 * Math.log10(peak + 1e-20);
}
export const samplePeak = (channels) => { let p = 0; for (const x of channels) for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > p) p = a; } return 20 * Math.log10(p + 1e-20); };

/**
 * Limiter com antecipação: ganho de entrada (dB), teto (dBFS) e release (s).
 * Devolve { channels, reduction (Float32Array em dB por amostra, reduzida a 1 valor a cada 256), maxReduction }.
 */
export function limit(channels, fs, { gainDb = 0, ceilingDb = -1, release = 0.12, lookahead = 0.004, truePeakMode = true } = {}) {
  const g = Math.pow(10, gainDb / 20), ceil = Math.pow(10, ceilingDb / 20), n = channels[0].length, la = Math.max(1, Math.round(lookahead * fs));
  // ganho necessário por amostra, usando o maior pico entre os canais
  const need = new Float32Array(n); const pk = channels.map((c) => (truePeakMode ? interPeaks(c) : null));
  for (let i = 0; i < n; i++) { let p = 0; for (let c = 0; c < channels.length; c++) { let a = (pk[c] ? pk[c][i] : Math.abs(channels[c][i])) * g; if (pk[c]) { if (i > 0 && pk[c][i - 1] * g > a) a = pk[c][i - 1] * g; if (i + 1 < n && pk[c][i + 1] * g > a) a = pk[c][i + 1] * g; } if (a > p) p = a; } need[i] = p > ceil ? ceil / p : 1; }
  // mínimo deslizante para trás (antecipa a redução) + suavização de ataque e release
  const env = new Float32Array(n); const dq = new Int32Array(n); let hd = 0, tl = 0;
  for (let i = 0; i < n + la; i++) {
    if (i < n) { while (tl > hd && need[dq[tl - 1]] >= need[i]) tl--; dq[tl++] = i; }
    const out = i - la; if (out < 0) continue;
    while (dq[hd] < out) hd++;
    env[out] = need[dq[hd]];
  }
  const rel = Math.exp(-1 / (release * fs)), att = Math.exp(-1 / (la * 0.3)); let cur = 1, maxRed = 0;
  const outCh = channels.map(() => new Float32Array(n)), red = new Float32Array(Math.ceil(n / 256));
  // segunda passagem de mínimo para garantir o teto depois da suavização
  for (let i = 0; i < n; i++) {
    const target = env[i]; cur = target < cur ? Math.max(target, cur * att + target * (1 - att)) : cur * rel + target * (1 - rel);
    const gg = Math.min(cur, need[i]);
    for (let c = 0; c < channels.length; c++) outCh[c][i] = channels[c][i] * g * gg;
    const db = -20 * Math.log10(gg); if (db > maxRed) maxRed = db; if (db > red[i >> 8]) red[i >> 8] = db;
  }
  return { channels: outCh, reduction: red, maxReduction: maxRed };
}

/** Curva estática do compressor: nível de saída (dB) para um nível de entrada (dB). */
export function compCurve(inDb, { threshold, ratio, knee = 0, makeup = 0 }) {
  const over = inDb - threshold; let out;
  if (knee > 0 && Math.abs(over) <= knee / 2) out = inDb + ((1 / ratio - 1) * Math.pow(over + knee / 2, 2)) / (2 * knee);
  else out = over > 0 ? threshold + over / ratio : inDb;
  return out + makeup;
}

/** Reduz bits (com ou sem dither TPDF) e taxa de amostragem (sem filtro, para ouvir o aliasing). */
export function crush(x, { bits = 16, dither = false, hold = 1, seed = 1 } = {}) {
  const y = new Float32Array(x.length), q = Math.pow(2, bits - 1); let s = seed * 7919 + 13, last = 0;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (let i = 0; i < x.length; i++) {
    if (i % hold === 0) { let v = x[i] * q; if (dither) v += rnd() - rnd(); last = Math.max(-q, Math.min(q - 1, Math.round(v))) / q; }
    y[i] = last;
  }
  return y;
}
export const rmsDb = (x) => { let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i]; return 10 * Math.log10(s / (x.length || 1) + 1e-20); };
export const applyGain = (x, db) => { const g = Math.pow(10, db / 20), y = new Float32Array(x.length); for (let i = 0; i < x.length; i++) y[i] = x[i] * g; return y; };
