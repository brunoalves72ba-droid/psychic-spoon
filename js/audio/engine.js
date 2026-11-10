// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Motor de áudio: tudo sintetizado. Coro (dente de serra + formantes + vibrato), piano,
// reverb por convolução com impulso gerado em código e agendamento pelo relógio do AudioContext.

import { midiToFreq, voiceIndex } from '../music/theory.js';

let ctx = null, out = null, bus = null, wet = null, pre = null;
const active = new Set();      // notas soando (para parar tudo)
const stoppers = new Set();    // sequenciadores e afins
let a4 = 440;
export const setA4 = (v) => { a4 = v; };

export const hasAudio = () => typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);

export function getCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  ctx = new AC({ latencyHint: 'interactive' });
  out = ctx.createGain(); out.gain.value = 0.9;
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -8; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.2;
  out.connect(lim); lim.connect(ctx.destination);
  bus = ctx.createGain(); bus.connect(out);
  pre = ctx.createGain(); pre.gain.value = 0.22;
  wet = ctx.createConvolver(); wet.buffer = makeImpulse(ctx, 2.4, 2.6);
  bus.connect(pre); pre.connect(wet); wet.connect(out);
  return ctx;
}
export const now = () => getCtx().currentTime;
export const mainBus = () => { getCtx(); return bus; };
export const dryOut = () => { getCtx(); return out; };

/** Libera o áudio (precisa de um toque do usuário em navegadores móveis). */
export async function unlock() {
  if (!hasAudio()) return false;
  const c = getCtx();
  if (c.state !== 'running') { try { await c.resume(); } catch {} }
  return c.state === 'running';
}
if (typeof window !== 'undefined') {
  const first = () => { unlock(); };
  window.addEventListener('pointerdown', first, { capture: true, passive: true });
  window.addEventListener('keydown', first, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { stopAll(); if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {}); }
    else if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  });
}

/** Impulso de reverb: ruído estéreo com decaimento exponencial e agudos que morrem antes. */
export function makeImpulse(c, seconds = 2.4, decay = 2.6, seed = 7) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  let s = seed * 9301 + 49297;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x3fffffff - 1; };
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch); let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const env = Math.pow(1 - t, decay) * (i < 400 ? i / 400 : 1);
      const k = 0.25 + 0.7 * t;           // filtro passa-baixas que fecha com o tempo
      lp = lp * k + rnd() * (1 - k);
      d[i] = lp * env * 0.9;
    }
  }
  return buf;
}

const VOWELS = {
  a: [[700, 1], [1150, 0.5], [2700, 0.28]],
  e: [[430, 1], [1750, 0.42], [2600, 0.25]],
  i: [[300, 1], [2000, 0.3], [2850, 0.22]],
  o: [[430, 1], [830, 0.5], [2650, 0.2]],
  u: [[340, 1], [650, 0.4], [2500, 0.14]],
};

function panner(c, pan) {
  if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; return p; }
  const g = c.createGain(); return g;
}
function track(handle) { active.add(handle); return handle; }

/**
 * Uma nota de coro. Funciona em AudioContext ao vivo e em OfflineAudioContext.
 * opts: { gain, vowel, voice (0..5), pan, att, rel, dest, vib }
 */
export function choirNote(midi, t0, dur, opts = {}) {
  const c = opts.ctx || getCtx();
  const dest = opts.dest || bus;
  const { gain = 0.16, vowel = 'u', voice = 3, pan = 0, att = 0.07, rel = 0.18, vib = 1 } = opts;
  const f = midiToFreq(midi, a4);
  const t = Math.max(t0, c.currentTime);
  const env = c.createGain(); env.gain.value = 0;
  const p = panner(c, pan);
  const mix = c.createGain(); mix.gain.value = 1;
  const oscs = [-5, 6].map((det, i) => {
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det + (voice - 2.5) * 0.8;
    const g = c.createGain(); g.gain.value = i ? 0.42 : 0.58; o.connect(g); g.connect(mix); return o;
  });
  // vibrato leve, que entra depois do ataque
  const lfo = c.createOscillator(); lfo.frequency.value = 5 + ((voice * 37) % 10) / 12;
  const lg = c.createGain(); lg.gain.value = 0;
  lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.0045 * vib, t + 0.5);
  lfo.connect(lg); oscs.forEach((o) => lg.connect(o.frequency));
  // formantes em paralelo + corpo grave
  const fm = VOWELS[vowel] || VOWELS.u;
  const shift = 1 + (midi - 57) * 0.004; // vozes agudas têm formantes um pouco mais altos
  const sum = c.createGain(); sum.gain.value = 1;
  for (const [ff, gg] of fm) {
    const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = ff * shift; b.Q.value = 5.5;
    const g = c.createGain(); g.gain.value = gg * 1.6; mix.connect(b); b.connect(g); g.connect(sum);
  }
  const body = c.createBiquadFilter(); body.type = 'lowpass'; body.frequency.value = Math.min(1400, f * 2.2); body.Q.value = 0.5;
  const bg = c.createGain(); bg.gain.value = 0.5; mix.connect(body); body.connect(bg); bg.connect(sum);
  const air = c.createBiquadFilter(); air.type = 'lowpass'; air.frequency.value = 5200;
  sum.connect(air); air.connect(env); env.connect(p); p.connect(dest);
  env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(gain, t + att);
  const all = [...oscs, lfo];
  all.forEach((o) => o.start(t));
  let ended = false;
  const handle = {
    midi, voice, t0: t,
    stop(when) {
      if (ended) return; ended = true;
      const w = Math.max(when ?? c.currentTime, c.currentTime);
      try { env.gain.cancelScheduledValues(w); env.gain.setTargetAtTime(0, w, rel / 3); } catch {}
      all.forEach((o) => { try { o.stop(w + rel * 2.2); } catch {} });
      oscs[0].onended = () => { try { p.disconnect(); } catch {} active.delete(handle); };
    },
    setGain(g, when) { if (!ended) env.gain.setTargetAtTime(g, when ?? c.currentTime, 0.04); },
    setMidi(m2, when, glide = 0.05) { const f2 = midiToFreq(m2, a4); oscs.forEach((o) => o.frequency.setTargetAtTime(f2, when ?? c.currentTime, glide)); handle.midi = m2; },
  };
  if (isFinite(dur)) {
    const end = t + dur;
    env.gain.setValueAtTime(gain, Math.max(t + att, end - 0.02)); env.gain.setTargetAtTime(0, end, rel / 3);
    all.forEach((o) => o.stop(end + rel * 2.2));
    oscs[0].onended = () => { try { p.disconnect(); } catch {} active.delete(handle); };
    handle.stop = (when) => { if (ended) return; ended = true; const w = Math.max(when ?? c.currentTime, c.currentTime); try { env.gain.cancelScheduledValues(w); env.gain.setTargetAtTime(0, w, 0.03); all.forEach((o) => o.stop(w + 0.25)); } catch {} };
  }
  return opts.ctx ? handle : track(handle);
}

/** Nota de piano para as guias: parciais com decaimento e filtro que fecha. */
export function pianoNote(midi, t0, dur = 1.2, opts = {}) {
  const c = opts.ctx || getCtx();
  const dest = opts.dest || bus;
  const { gain = 0.3, pan = 0 } = opts;
  const f = midiToFreq(midi, a4);
  const t = Math.max(t0, c.currentTime);
  const env = c.createGain(); env.gain.value = 0;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.7;
  lp.frequency.setValueAtTime(Math.min(9000, f * 7), t); lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.6), t + 1.2);
  const parts = [[1, 1, 'triangle'], [2, 0.42, 'sine'], [3, 0.2, 'sine'], [4.02, 0.09, 'sine']];
  const oscs = parts.map(([mul, g, type]) => { const o = c.createOscillator(); o.type = type; o.frequency.value = f * mul; const gg = c.createGain(); gg.gain.value = g; o.connect(gg); gg.connect(lp); return o; });
  const p = panner(c, pan);
  lp.connect(env); env.connect(p); p.connect(dest);
  const decay = Math.max(0.5, 2.6 - (midi - 36) * 0.03);
  env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(gain, t + 0.006);
  env.gain.setTargetAtTime(gain * 0.0001, t + 0.02, decay / 3);
  const end = t + dur;
  env.gain.setTargetAtTime(0, end, 0.06);
  oscs.forEach((o) => { o.start(t); o.stop(end + 0.4); });
  let ended = false;
  const handle = { midi, stop(when) { if (ended) return; ended = true; const w = Math.max(when ?? c.currentTime, c.currentTime); try { env.gain.cancelScheduledValues(w); env.gain.setTargetAtTime(0, w, 0.02); oscs.forEach((o) => o.stop(w + 0.15)); } catch {} } };
  oscs[0].onended = () => { try { p.disconnect(); } catch {} active.delete(handle); };
  return opts.ctx ? handle : track(handle);
}

/** Clique de metrônomo. */
export function click(t0, accent = false, opts = {}) {
  const c = opts.ctx || getCtx();
  const dest = opts.dest || out;
  const t = Math.max(t0, c.currentTime);
  const o = c.createOscillator(); o.type = 'square'; o.frequency.value = accent ? 1760 : 1175;
  const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(opts.gain ?? 0.22, t + 0.001); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = accent ? 1760 : 1175; f.Q.value = 3;
  o.connect(f); f.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.07);
}

let noiseBuf = null;
export function noiseBuffer(c) {
  if (c === ctx && noiseBuf) return noiseBuf;
  const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = b.getChannelData(0);
  let s = 1234567;
  for (let i = 0; i < d.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = s / 0x3fffffff - 1; }
  if (c === ctx) noiseBuf = b;
  return b;
}
/** Percussão vocal sintetizada: 'bumbo' (b), 'caixa' (k), 'chimbal' (t). */
export function vocalPerc(kind, t0, opts = {}) {
  const c = opts.ctx || getCtx();
  const dest = opts.dest || bus;
  const t = Math.max(t0, c.currentTime); const g = c.createGain(); g.connect(dest);
  const gain = opts.gain ?? 0.5;
  if (kind === 'bumbo') {
    const o = c.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22); o.connect(g); o.start(t); o.stop(t + 0.25);
  } else {
    const n = c.createBufferSource(); n.buffer = noiseBuffer(c);
    const f = c.createBiquadFilter();
    if (kind === 'caixa') { f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.8; g.gain.setValueAtTime(gain * 0.8, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14); }
    else { f.type = 'highpass'; f.frequency.value = 6500; g.gain.setValueAtTime(gain * 0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05); }
    n.connect(f); f.connect(g); n.start(t, (t * 0.37) % 1); n.stop(t + 0.2);
  }
}

/** Toca um acorde de coro (cada nota com a cor/voz correspondente). Retorna as notas. */
export function choirChord(notes, t0, dur, opts = {}) {
  const n = notes.length;
  return notes.map((m, i) => {
    if (opts.mute && opts.mute[i]) return null;
    const voice = opts.voices ? opts.voices[i] : voiceIndex(i, n);
    return choirNote(m, t0 + (opts.strum || 0) * i, dur, { gain: (opts.gain ?? 0.15) * (i === 0 && n > 1 ? 1.25 : 1), vowel: opts.vowel || (i === 0 && n > 1 ? 'o' : 'u'), voice, pan: n > 1 ? (i / (n - 1) - 0.5) * (opts.width ?? 0.9) : 0, ctx: opts.ctx, dest: opts.dest });
  });
}
export function pianoChord(notes, t0, dur, opts = {}) { return notes.map((m, i) => pianoNote(m, t0 + (opts.strum || 0) * i, dur, opts)); }

/** Para todo som imediatamente. */
export function stopAll() {
  for (const st of [...stoppers]) { try { st(); } catch {} }
  for (const hnd of [...active]) { try { hnd.stop(); } catch {} }
  active.clear();
}
export const onStopAll = (fn) => { stoppers.add(fn); return () => stoppers.delete(fn); };

// ---------- relógio de agendamento ----------
// O temporizador só acorda o agendador; quem define o ritmo é ctx.currentTime (lookahead).
let tickWorker = null; const tickSubs = new Set();
function ensureTicker() {
  if (tickWorker) return;
  try {
    const src = 'let id=null;onmessage=e=>{if(e.data==="start"){if(!id)id=setInterval(()=>postMessage(0),25)}else{clearInterval(id);id=null}}';
    tickWorker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    tickWorker.onmessage = () => tickSubs.forEach((f) => f());
    tickWorker.onerror = () => { tickWorker = { fake: setInterval(() => tickSubs.forEach((f) => f()), 25), postMessage() {} }; };
  } catch {
    tickWorker = { fake: setInterval(() => tickSubs.forEach((f) => f()), 25), postMessage() {} };
  }
}
function subscribeTick(fn) {
  ensureTicker(); tickSubs.add(fn); tickWorker.postMessage('start');
  return () => { tickSubs.delete(fn); if (!tickSubs.size) tickWorker.postMessage('stop'); };
}

export const LOOKAHEAD = 0.14;

/**
 * Sequenciador de passos. steps: [{d: duração em tempos, ...}].
 * play(step, índice, quando, duraçãoEmSegundos) agenda o som de cada passo.
 */
export class Sequencer {
  constructor({ steps, tempo = 72, loop = false, play, onEnd, onStep }) {
    Object.assign(this, { steps, tempo, loop, play, onEnd, onStep });
    this.playing = false; this.timeline = []; this.i = 0; this.next = 0; this._un = null; this._off = null; this._last = -1;
  }
  start(from = 0) {
    if (this.playing) this.stop();
    const c = getCtx(); unlock();
    this.playing = true; this.i = from; this.next = c.currentTime + 0.08; this.timeline = []; this._last = -1;
    this._un = subscribeTick(() => this._tick());
    this._off = onStopAll(() => this.stop(true));
    this._tick();
  }
  _tick() {
    if (!this.playing) return;
    const c = getCtx();
    while (this.playing && this.next < c.currentTime + LOOKAHEAD) {
      if (this.i >= this.steps.length) {
        if (this.loop && this.steps.length) this.i = 0;
        else { const endAt = this.next; this._finish(endAt); return; }
      }
      const st = this.steps[this.i];
      const dur = (st.d || 1) * 60 / this.tempo;
      this.play(st, this.i, this.next, dur);
      this.timeline.push({ i: this.i, t: this.next, d: dur });
      if (this.timeline.length > 64) this.timeline.shift();
      this.next += dur; this.i++;
    }
    if (this.onStep) { const p = this.position(); if (p && p.i !== this._last) { this._last = p.i; this.onStep(p.i); } }
  }
  _finish(endAt) {
    const c = getCtx();
    const check = () => { if (!this.playing) return; if (c.currentTime >= endAt) { this.stop(true); this.onEnd && this.onEnd(); } };
    this._un && this._un(); this._un = subscribeTick(check);
  }
  /** Passo que está soando agora: {i, frac} ou null. */
  position() {
    if (!this.playing) return null;
    const t = getCtx().currentTime;
    for (let k = this.timeline.length - 1; k >= 0; k--) { const e = this.timeline[k]; if (t >= e.t) return t < e.t + e.d ? { i: e.i, frac: (t - e.t) / e.d, t: e.t, d: e.d } : null; }
    return null;
  }
  stop(fromStopAll) {
    if (!this.playing) return;
    this.playing = false; this._un && this._un(); this._un = null; this._off && this._off(); this._off = null;
    if (!fromStopAll) { for (const hnd of [...active]) { try { hnd.stop(); } catch {} } active.clear(); }
  }
}

/** Metrônomo simples sobre o mesmo relógio. onBeat(nº do tempo, quando). */
export class Metronome {
  constructor({ tempo = 80, beats = 4, onBeat, sound = true, sub = 1 }) { Object.assign(this, { tempo, beats, onBeat, sound, sub }); this.playing = false; this.n = 0; this.next = 0; this.times = []; }
  start(delay = 0.1) {
    if (this.playing) this.stop();
    const c = getCtx(); unlock(); this.playing = true; this.n = 0; this.next = c.currentTime + delay; this.times = []; this.t0 = this.next;
    this._un = subscribeTick(() => this._tick()); this._off = onStopAll(() => this.stop()); this._tick();
  }
  _tick() {
    const c = getCtx();
    while (this.playing && this.next < c.currentTime + LOOKAHEAD) {
      const total = this.beats * this.sub; const k = this.n % total; const strong = k === 0; const onbeat = k % this.sub === 0;
      if (this.sound) click(this.next, strong, { gain: onbeat ? 0.24 : 0.1 });
      this.times.push({ n: this.n, t: this.next, strong, onbeat }); if (this.times.length > 256) this.times.shift();
      this.onBeat && this.onBeat(this.n, this.next, strong, onbeat);
      this.next += 60 / this.tempo / this.sub; this.n++;
    }
  }
  stop() { if (!this.playing) return; this.playing = false; this._un && this._un(); this._off && this._off(); }
}

/** Renderiza áudio fora do tempo real. build(ctxOffline, destino) agenda as notas. */
export async function renderOffline(seconds, build, { sampleRate = 44100, channels = 1 } = {}) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const oc = new OAC(channels, Math.ceil(seconds * sampleRate), sampleRate);
  await build(oc, oc.destination);
  return await new Promise((res, rej) => { const p = oc.startRendering(); if (p && p.then) p.then(res, rej); else oc.oncomplete = (e) => res(e.renderedBuffer); });
}

/** Media Session: mostra o que está tocando e liga os botões do sistema (quando houver suporte). */
export function mediaSession(title, { play, pause } = {}) {
  try {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title, artist: 'Sexteto', album: 'Harmonia vocal', artwork: [{ src: 'assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' }] });
    navigator.mediaSession.setActionHandler('play', play || null);
    navigator.mediaSession.setActionHandler('pause', pause || null);
    navigator.mediaSession.setActionHandler('stop', pause || null);
  } catch {}
}
export const mediaState = (s) => { try { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = s; } catch {} };
