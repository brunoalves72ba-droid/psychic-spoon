// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Análise vocal a partir das leituras do microfone. Lógica pura, testada em tests/voice.test.mjs.
// Tudo aqui é estimativa acústica para estudo: não é exame nem diagnóstico.

const sig = (x) => 1 / (1 + Math.exp(-x));
const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
const std = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) * (x - m)))); };

/**
 * Extensão e tessitura. push(t, midi|null, clareza): só contam notas sustentadas
 * por pelo menos minHold segundos com clareza alta.
 */
export function createRangeTracker({ minHold = 0.3, minClarity = 0.9 } = {}) {
  let run = null, lo = null, hi = null, lastT = null; const hist = {};
  const close = () => { run = null; };
  return {
    push(t, m, c) {
      const dt = lastT == null ? 0 : Math.min(0.1, Math.max(0, t - lastT)); lastT = t;
      if (m == null || c < minClarity) { close(); return; }
      if (run && Math.abs(m - run.mean) <= 0.7) {
        run.n++; run.mean += (m - run.mean) / Math.min(run.n, 12); run.dur += dt;
        if (run.dur >= minHold) {
          const k = Math.round(run.mean);
          if (!run.counted) { run.counted = true; hist[k] = (hist[k] || 0) + run.dur; } else hist[k] = (hist[k] || 0) + dt;
          if (lo == null || k < lo) lo = k; if (hi == null || k > hi) hi = k;
        }
      } else run = { mean: m, n: 1, dur: 0, counted: false };
    },
    result() { return { lo, hi, hist: { ...hist } }; },
  };
}

/** Faixa confortável: semitons vizinhos ao pico com pelo menos 35% do tempo do pico. */
export function tessitura(hist) {
  const keys = Object.keys(hist).map(Number).sort((a, b) => a - b);
  if (!keys.length) return null;
  let peak = keys[0]; for (const k of keys) if (hist[k] > hist[peak]) peak = k;
  const thr = hist[peak] * 0.35; let lo = peak, hi = peak;
  while ((hist[lo - 1] || 0) >= thr || (hist[lo - 2] || 0) >= thr) lo -= (hist[lo - 1] || 0) >= thr ? 1 : 2;
  while ((hist[hi + 1] || 0) >= thr || (hist[hi + 2] || 0) >= thr) hi += (hist[hi + 1] || 0) >= thr ? 1 : 2;
  let tot = 0, acc = 0; for (const k of keys) { tot += hist[k]; acc += hist[k] * k; }
  return { lo, hi, peak, center: acc / tot };
}

export const VOICE_TYPES = [
  { id: 'baixo', name: 'Baixo', lo: 40, hi: 64 }, { id: 'baritono', name: 'Barítono', lo: 45, hi: 69 }, { id: 'tenor', name: 'Tenor', lo: 48, hi: 72 },
  { id: 'contralto', name: 'Contralto', lo: 53, hi: 77 }, { id: 'mezzo', name: 'Mezzo-soprano', lo: 57, hi: 81 }, { id: 'soprano', name: 'Soprano', lo: 60, hi: 84 },
];
/** Classificação aproximada pela extensão e pelo centro da tessitura. Devolve as duas mais próximas. */
export function classify(lo, hi, center) {
  if (lo == null || hi == null) return [];
  const c = center ?? (lo + hi) / 2;
  return VOICE_TYPES.map((v) => ({ ...v, d: Math.abs(c - (v.lo + v.hi) / 2) * 1.0 + Math.abs(lo - v.lo) * 0.35 + Math.abs(hi - v.hi) * 0.2 })).sort((a, b) => a.d - b.d).slice(0, 2);
}

/**
 * Vibrato e estabilidade de uma nota sustentada.
 * frames: [{t, m}] (m em MIDI fracionário, sem nulos). Devolve taxa (Hz), extensão (± cents) e estabilidade (desvio em cents da linha média).
 */
export function analyzeSustain(frames) {
  if (frames.length < 24) return null;
  const dur = frames[frames.length - 1].t - frames[0].t; if (dur < 0.8) return null;
  const dt = dur / (frames.length - 1), fs = 1 / dt;
  const c = frames.map((f) => f.m * 100); const base = mean(c);
  const win = Math.max(3, Math.round(0.36 * fs) | 1), half = win >> 1;
  const trend = c.map((_, i) => mean(c.slice(Math.max(0, i - half), Math.min(c.length, i + half + 1))));
  const res = c.map((x, i) => x - trend[i]).slice(half, c.length - half);
  const stability = std(trend.slice(half, c.length - half));
  let best = 0, bestLag = 0; const e0 = res.reduce((s, x) => s + x * x, 0);
  const lagMin = Math.max(2, Math.floor(fs / 9)), lagMax = Math.min(res.length - 4, Math.ceil(fs / 3.5));
  const ac = (lag) => { let s = 0, e1 = 0, e2 = 0; for (let i = 0; i + lag < res.length; i++) { s += res[i] * res[i + lag]; e1 += res[i] * res[i]; e2 += res[i + lag] * res[i + lag]; } return s / (Math.sqrt(e1 * e2) + 1e-9); };
  const vals = []; for (let lag = lagMin - 1; lag <= lagMax + 1; lag++) vals[lag] = ac(lag);
  for (let lag = lagMin; lag <= lagMax; lag++) if (vals[lag] > best && vals[lag] >= vals[lag - 1] && vals[lag] >= vals[lag + 1]) { best = vals[lag]; bestLag = lag; }
  const amp = Math.sqrt(2 * e0 / (res.length || 1));
  let rate = 0;
  if (best > 0.45 && amp >= 8 && bestLag) { const y0 = vals[bestLag - 1], y1 = vals[bestLag], y2 = vals[bestLag + 1]; const den = y0 - 2 * y1 + y2; rate = fs / (bestLag + (Math.abs(den) > 1e-9 ? 0.5 * (y0 - y2) / den : 0)); }
  return { rate, extent: rate ? amp : 0, stability, jitter: rate ? 0 : amp, mean: base / 100, hasVibrato: rate > 0, seconds: dur };
}

/**
 * Passagens em uma sirene lenta: marca onde a voz quebra (salto de altura ou falha curta)
 * ou muda de timbre de repente (salto de H1−H2).
 * frames: [{t, m|null, c, h1h2?}]. Devolve [{m, kind}] em ordem de altura.
 */
export function detectBreaks(frames) {
  const ev = []; const voiced = (f) => f && f.m != null && f.c >= 0.8;
  for (let i = 3; i < frames.length - 3; i++) {
    const a = frames[i - 1], b = frames[i];
    if (voiced(a) && voiced(b) && b.t - a.t < 0.09) {
      const slope = voiced(frames[i - 3]) ? Math.abs(a.m - frames[i - 3].m) / 2 : 0;
      if (Math.abs(b.m - a.m) > Math.max(1.2, slope * 4)) ev.push({ m: a.m, kind: 'salto' });
    }
    if (voiced(a) && !voiced(b)) {
      let j = i; while (j < frames.length && !voiced(frames[j])) j++;
      const gap = j < frames.length ? frames[j].t - a.t : 9;
      if (gap > 0.04 && gap < 0.45 && j < frames.length && Math.abs(frames[j].m - a.m) < 5) ev.push({ m: a.m, kind: 'falha' });
    }
    if (i >= 6 && i < frames.length - 6) {
      const pre = frames.slice(i - 6, i), post = frames.slice(i, i + 6);
      if (pre.every((f) => voiced(f) && f.h1h2 != null) && post.every((f) => voiced(f) && f.h1h2 != null)) {
        const d = mean(post.map((f) => f.h1h2)) - mean(pre.map((f) => f.h1h2));
        if (Math.abs(d) > 7 && Math.abs(post[0].m - pre[5].m) < 1) ev.push({ m: b.m, kind: 'timbre' });
      }
    }
  }
  // junta eventos vizinhos (até 2 semitons)
  ev.sort((x, y) => x.m - y.m); const out = [];
  for (const e of ev) { const last = out[out.length - 1]; if (last && e.m - last.m <= 2) { last.n++; last.sum += e.m; last.m = last.sum / last.n; if (e.kind !== 'timbre') last.kind = e.kind; } else out.push({ m: e.m, kind: e.kind, n: 1, sum: e.m }); }
  return out.sort((x, y) => y.n - x.n).slice(0, 3).sort((x, y) => x.m - y.m).map(({ m, kind, n }) => ({ m: Math.round(m), kind, n }));
}

/** Média das medidas de espectro de uma amostra (para calibrar peito e cabeça). */
export function featureMean(frames) {
  const ok = frames.filter((f) => f.m != null && f.h1h2 != null);
  if (ok.length < 8) return null;
  return { m: mean(ok.map((f) => f.m)), h1h2: mean(ok.map((f) => f.h1h2)), tilt: mean(ok.map((f) => f.tilt)), hf: mean(ok.map((f) => f.hf)), n: ok.length };
}

/**
 * Estimativa de registro: 0 = peito, 1 = cabeça/falsete.
 * Combina o espectro (H1−H2, inclinação, energia acima de 2 kHz) com a altura em relação à passagem.
 * cal: { chest, head } vindos de featureMean (opcional). passaggio: MIDI da primeira passagem (opcional).
 */
export function estimateRegister(f, cal, passaggio) {
  if (f.m == null || f.h1h2 == null) return null;
  let s;
  const calibrated = !!(cal && cal.chest && cal.head);
  if (calibrated) {
    const w = { h1h2: 1, tilt: 1, hf: 0.5 }; let num = 0, den = 0;
    for (const k of Object.keys(w)) { const d = (cal.head[k] - cal.chest[k]) * w[k]; num += (f[k] - cal.chest[k]) * w[k] * d; den += d * d; }
    s = den > 1 ? Math.min(1.2, Math.max(-0.2, num / den)) : 0.5;
    s = Math.min(1, Math.max(0, s));
  } else s = 0.6 * sig((f.h1h2 - 6) / 3) + 0.4 * sig((-22 - f.hf) / 4);
  const p1 = passaggio ?? (calibrated ? (cal.chest.m + cal.head.m) / 2 : 64);
  const pp = sig((f.m - p1) / 2.2);
  const p = calibrated ? 0.72 * s + 0.28 * pp : 0.55 * s + 0.45 * pp;
  const reg = p < 0.36 ? 'peito' : p < 0.64 ? 'misto' : 'cabeça';
  const edge = reg === 'misto' ? 1 - Math.abs(p - 0.5) / 0.14 : Math.min(1, Math.abs(p - 0.5) / 0.4);
  const conf = Math.max(0.05, Math.min(1, edge * (1 - Math.abs(s - pp) * 0.5) * (calibrated ? 1 : 0.6)));
  return { p, reg, conf, spectral: s, pitch: pp, calibrated };
}

/** Maior trecho contínuo de som (para tempo máximo de fonação e de "sss"). gapMax: pausa tolerada. */
export function createSoundTimer({ gapMax = 0.35 } = {}) {
  let start = null, last = null, best = 0, active = false;
  return {
    push(t, on) {
      if (on) { if (start == null || t - last > gapMax) start = t; last = t; active = true; best = Math.max(best, t - start); }
      else if (active && last != null && t - last > gapMax) active = false;
    },
    current: (t) => (active && start != null && t - last <= gapMax ? last - start : 0),
    ended: (t) => best > 0.5 && !active && last != null && t - last > gapMax,
    best: () => best,
  };
}

/** Marcos reais a partir do histórico. events: lista completa. Devolve [{id, title, ts}]. */
export function milestones(events) {
  const out = []; const first = (id, title, pred) => { const e = events.find(pred); if (e) out.push({ id, title, ts: e.ts }); };
  const span = (e) => (e.data.hi != null && e.data.lo != null ? e.data.hi - e.data.lo : 0);
  const ranges = events.filter((e) => e.type === 'range' || e.type === 'portrait').map((e) => (e.type === 'portrait' ? { ts: e.ts, data: e.data.range || {} } : e));
  const fr = (id, title, st) => { const e = ranges.find((x) => span(x) >= st); if (e) out.push({ id, title, ts: e.ts }); };
  fr('oitava', 'Primeira vez com uma oitava de extensão', 12); fr('oitava-meia', 'Primeira vez com uma oitava e meia', 18); fr('duas-oitavas', 'Primeira vez com duas oitavas', 24); fr('duas-meia', 'Duas oitavas e meia de extensão', 30);
  first('aula-1', 'Primeira aula concluída', (e) => e.type === 'lesson');
  const lessons = new Set(); for (const e of events) if (e.type === 'lesson') { lessons.add(e.data.id); if (lessons.size === 8 && !out.some((o) => o.id === 'aulas-8')) out.push({ id: 'aulas-8', title: 'Metade da trilha de harmonia', ts: e.ts }); if (lessons.size === 16 && !out.some((o) => o.id === 'aulas-16')) out.push({ id: 'aulas-16', title: 'Trilha de harmonia completa', ts: e.ts }); }
  first('sss-20', 'Primeiro “sss” de 20 segundos', (e) => e.type === 'breath' && e.data.seconds >= 20);
  first('sss-30', 'Primeiro “sss” de 30 segundos', (e) => e.type === 'breath' && e.data.seconds >= 30);
  first('mpt-15', 'Fonação de 15 segundos em uma nota', (e) => e.type === 'mpt' && e.data.seconds >= 15);
  first('afinado-15', 'Afinação média abaixo de 15 cents', (e) => (e.type === 'pitch' || e.type === 'sing') && e.data.cents != null && e.data.cents <= 15);
  first('ouvido-10', 'Primeira rodada de ouvido com 10 de 10', (e) => e.type === 'ear' && e.data.ok === e.data.total);
  first('ouvido-n3', 'Nível 3 em um treino de ouvido', (e) => e.type === 'ear' && e.data.level >= 3);
  first('cante-80', '80 pontos no “Cante a sua voz”', (e) => e.type === 'sing' && e.data.points >= 80);
  first('retrato', 'Primeiro retrato vocal', (e) => e.type === 'portrait');
  first('gravacao', 'Primeira gravação', (e) => e.type === 'recording');
  first('projeto', 'Primeiro projeto do zero ao master', (e) => e.type === 'project');
  return out.sort((a, b) => a.ts - b.ts);
}
