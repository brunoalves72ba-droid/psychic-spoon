// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Núcleo de análise do microfone, sem dependência de DOM (roda em AudioWorklet, na página e no Node).
// Altura por MPM (McLeod Pitch Method) com autocorrelação via FFT, de 60 a 1200 Hz,
// medida de confiança ("clareza") e proteção contra erro de oitava.
// Este arquivo é concatenado ao processador do worklet: mantenha-o sem imports.

export function makeFFT(n) {
  const levels = Math.log2(n) | 0;
  const cos = new Float32Array(n / 2), sin = new Float32Array(n / 2), rev = new Uint32Array(n);
  for (let i = 0; i < n / 2; i++) { cos[i] = Math.cos(2 * Math.PI * i / n); sin[i] = Math.sin(2 * Math.PI * i / n); }
  for (let i = 0; i < n; i++) { let r = 0; for (let b = 0; b < levels; b++) r |= ((i >> b) & 1) << (levels - 1 - b); rev[i] = r; }
  /** FFT no lugar. re e im: Float32Array(n). */
  return function fft(re, im) {
    for (let i = 0; i < n; i++) { const j = rev[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1, step = n / size;
      for (let i = 0; i < n; i += size) {
        for (let j = i, k = 0; j < i + half; j++, k += step) {
          const l = j + half;
          const tr = re[l] * cos[k] + im[l] * sin[k];
          const ti = im[l] * cos[k] - re[l] * sin[k];
          re[l] = re[j] - tr; im[l] = im[j] - ti; re[j] += tr; im[j] += ti;
        }
      }
    }
  };
}

/**
 * Detector de altura. detect(amostras) → { freq (Hz ou 0), clarity (0..1), rms }.
 * size: tamanho da janela (2048 a 44,1/48 kHz cobre de 60 Hz para cima).
 */
export function createPitchDetector(sampleRate, size = 2048, opts = {}) {
  const fmin = opts.fmin || 60, fmax = opts.fmax || 1200, K = opts.k || 0.93;
  const N = size * 2;
  const fft = makeFFT(N);
  const re = new Float32Array(N), im = new Float32Array(N), nsdf = new Float32Array(size), x0 = new Float32Array(size);
  const tauMin = Math.max(2, Math.floor(sampleRate / (fmax * 1.06)));
  const tauMax = Math.min(size - 2, Math.ceil(sampleRate / (fmin / 1.06)));
  function detect(x) {
    let sumsq = 0, mean = 0;
    for (let i = 0; i < size; i++) mean += x[i];
    mean /= size;
    for (let i = 0; i < size; i++) { const v = x[i] - mean; re[i] = v; sumsq += v * v; }
    const rms = Math.sqrt(sumsq / size);
    if (rms < 1e-4) return { freq: 0, clarity: 0, rms };
    re.fill(0, size); im.fill(0);
    // autocorrelação: IFFT(|FFT(x)|²)
    x0.set(re.subarray(0, size));
    fft(re, im);
    for (let i = 0; i < N; i++) { re[i] = re[i] * re[i] + im[i] * im[i]; im[i] = 0; }
    fft(re, im); // para entrada real e par, FFT direta = inversa (a menos da escala)
    let m = 2 * sumsq;
    const limit = tauMax + 2;
    for (let tau = 0; tau < limit; tau++) {
      nsdf[tau] = m > 1e-12 ? 2 * (re[tau] / N) / m : 0;
      const a = x0[tau], b = x0[size - 1 - tau];
      m -= a * a + b * b;
    }
    // máximos-chave: maior pico de cada região positiva depois do primeiro cruzamento por zero
    let tau = 1;
    while (tau < limit && nsdf[tau] > 0) tau++;
    const peaks = []; let best = -1, bestV = 0, top = 0;
    for (; tau < limit - 1; tau++) {
      const v = nsdf[tau];
      if (v > 0) { if (v > bestV && v >= nsdf[tau - 1] && v >= nsdf[tau + 1]) { bestV = v; best = tau; } }
      else if (best >= 0) { peaks.push(best); if (bestV > top) top = bestV; best = -1; bestV = 0; }
    }
    if (best >= 0) { peaks.push(best); if (bestV > top) top = bestV; }
    let pick = -1;
    for (const p of peaks) { if (p >= tauMin && p <= tauMax && nsdf[p] >= K * top) { pick = p; break; } }
    if (pick < 0) return { freq: 0, clarity: 0, rms };
    // interpolação parabólica
    const y0 = nsdf[pick - 1], y1 = nsdf[pick], y2 = nsdf[pick + 1];
    const den = y0 - 2 * y1 + y2;
    const sh = Math.abs(den) > 1e-12 ? 0.5 * (y0 - y2) / den : 0;
    const clarity = Math.min(1, y1 - 0.25 * (y0 - y2) * sh);
    const freq = sampleRate / (pick + sh);
    if (freq < fmin * 0.97 || freq > fmax * 1.03) return { freq: 0, clarity: 0, rms };
    return { freq, clarity, rms };
  }
  return { detect, size };
}

/**
 * Filtro temporal contra saltos de oitava: um salto de ~1 oitava só é aceito
 * depois de se manter por alguns quadros; antes disso a leitura é trazida de volta.
 */
export function createOctaveGuard(hold = 3) {
  let last = 0, stable = 0, pend = 0, pendN = 0;
  return {
    push(freq, clarity) {
      if (!freq || clarity < 0.5) { if (++pendN > 6) { last = 0; stable = 0; pendN = 0; } return 0; }
      if (!last) { last = freq; stable = 1; pendN = 0; return freq; }
      const r = Math.log2(freq / last);
      const nearOct = Math.abs(Math.abs(r) - 1) < 0.08 || Math.abs(Math.abs(r) - 1.585) < 0.08;
      if (nearOct && stable >= 3) {
        if (pend && Math.abs(Math.log2(freq / pend)) < 0.04) pendN++; else { pend = freq; pendN = 1; }
        if (pendN >= hold) { last = freq; stable = 1; pend = 0; pendN = 0; return freq; }
        const k = Math.round(r * 1000) / 1000;
        return freq / Math.pow(2, Math.abs(Math.abs(r) - 1) < 0.08 ? Math.sign(k) : Math.sign(k) * 1.585);
      }
      pend = 0; pendN = 0;
      stable = Math.abs(r) < 0.06 ? stable + 1 : 1;
      last = freq; return freq;
    },
    reset() { last = 0; stable = 0; pend = 0; pendN = 0; },
  };
}

/**
 * Medidas do espectro usadas na estimativa de registro vocal:
 * h1h2 (dB entre 1º e 2º harmônicos), tilt (inclinação em dB/oitava) e hf (energia acima de 2 kHz, em dB relativos ao total).
 */
export function createSpectral(sampleRate, size = 2048) {
  const N = size * 2, fft = makeFFT(N);
  const re = new Float32Array(N), im = new Float32Array(N), win = new Float32Array(size);
  for (let i = 0; i < size; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (size - 1));
  const binHz = sampleRate / N;
  return function features(x, f0) {
    for (let i = 0; i < size; i++) re[i] = x[i] * win[i];
    re.fill(0, size); im.fill(0);
    fft(re, im);
    const half = N / 2;
    let tot = 0, hi = 0; const k2 = Math.floor(2000 / binHz), k8 = Math.min(half, Math.floor(8000 / binHz));
    for (let k = 2; k < k8; k++) { const p = re[k] * re[k] + im[k] * im[k]; re[k] = p; tot += p; if (k >= k2) hi += p; }
    const hf = 10 * Math.log10((hi + 1e-12) / (tot + 1e-12));
    if (!f0) return { h1h2: 0, tilt: 0, hf, ok: false };
    const hmag = (h) => { const c = h * f0 / binHz, w = Math.max(2, Math.round(0.25 * f0 / binHz)); let e = 0; for (let k = Math.max(2, Math.round(c - w)); k <= Math.min(k8 - 1, Math.round(c + w)); k++) e += re[k]; return 10 * Math.log10(e + 1e-12); };
    const h1 = hmag(1), h2 = hmag(2);
    let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (let hN = 1; hN * f0 < Math.min(5000, k8 * binHz - f0) && hN <= 40; hN++) { const xx = Math.log2(hN), yy = hmag(hN); n++; sx += xx; sy += yy; sxx += xx * xx; sxy += xx * yy; }
    const tilt = n >= 3 ? (n * sxy - sx * sy) / (n * sxx - sx * sx) : 0;
    return { h1h2: h1 - h2, tilt, hf, ok: true };
  };
}

/**
 * Núcleo do processador do microfone: recebe blocos de áudio e emite análises e/ou PCM cru.
 * emit(msg, transferíveis). Mensagens: {type:'pitch', f, c, rms, peak, h1h2, tilt, hf, t} e {type:'pcm', data, t}.
 */
export function createMicCore(sampleRate, emit) {
  const size = sampleRate > 60000 ? 4096 : 2048, hop = size / 2;
  const det = createPitchDetector(sampleRate, size);
  const spec = createSpectral(sampleRate, size);
  const guard = createOctaveGuard();
  const ring = new Float32Array(size), frame = new Float32Array(size);
  let w = 0, since = 0, total = 0, peak = 0;
  let wantPitch = false, wantPcm = false, wantSpec = false;
  let pcm = new Float32Array(2048), pw = 0, pcmStart = 0, pcmTime = 0;
  return {
    config(o) { if ('pitch' in o) { wantPitch = !!o.pitch; if (!wantPitch) guard.reset(); } if ('pcm' in o) { wantPcm = !!o.pcm; pw = 0; } if ('spec' in o) wantSpec = !!o.spec; },
    process(inp, time) {
      const n = inp.length;
      for (let i = 0; i < n; i++) {
        const v = inp[i];
        const a = v < 0 ? -v : v; if (a > peak) peak = a;
        ring[w] = v; w = (w + 1) % size; since++;
        if (wantPcm) { if (pw === 0) { pcmStart = total + i; pcmTime = time + i / sampleRate; } pcm[pw++] = v; if (pw === pcm.length) { emit({ type: 'pcm', data: pcm, at: pcmStart, t: pcmTime }, [pcm.buffer]); pcm = new Float32Array(2048); pw = 0; } }
        if (since >= hop) {
          since = 0;
          if (wantPitch) {
            for (let k = 0; k < size; k++) frame[k] = ring[(w + k) % size];
            const r = det.detect(frame);
            const f = guard.push(r.freq, r.clarity);
            const msg = { type: 'pitch', f, raw: r.freq, c: r.clarity, rms: r.rms, peak, t: time + i / sampleRate };
            if (wantSpec) { const s = spec(frame, f); msg.h1h2 = s.h1h2; msg.tilt = s.tilt; msg.hf = s.hf; }
            emit(msg);
          } else emit({ type: 'level', peak, t: time });
          peak = 0;
        }
      }
      total += n;
    },
    flush() { if (wantPcm && pw > 0) { const d = pcm.slice(0, pw); emit({ type: 'pcm', data: d, at: pcmStart, t: pcmTime }, [d.buffer]); pw = 0; } },
  };
}
