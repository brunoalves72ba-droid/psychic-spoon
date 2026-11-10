// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Simuladores do curso de produção (parte 1: base, gravação e mesa). Todos processam áudio de verdade.

import { h, canvas, loop, slider, seg, toggle, clamp, fmt } from './ui.js';
import { getCtx, unlock, dryOut, onStopAll, makeImpulse, click, now } from '../audio/engine.js';
import { voiceBuffer, stems, pinkBuffer, bufferFrom } from '../audio/sources.js';
import { crush } from '../audio/loudness.js';
import { VOICE_COLORS, VOICE_NAMES } from '../music/theory.js';

export const db2g = (d) => Math.pow(10, d / 20);
export const g2db = (g) => 20 * Math.log10(Math.max(1e-9, g));

/**
 * Base dos simuladores: carrega a fonte, toca em laço e entrega os nós para o simulador ligar.
 * load(): Promise<AudioBuffer | AudioBuffer[]>; wire(ctx, entradas, saída, buffers) monta o grafo uma vez.
 */
export function rig({ load, wire, label = 'Tocar' }) {
  let bufs = null, inputs = null, srcs = [], playing = false, t0 = 0, off = null, wired = false;
  const btn = h('button.btn.primary', { type: 'button' }, label), st = h('span.small.muted');
  const stop = () => { srcs.forEach((s) => { try { s.stop(); } catch {} }); srcs = []; playing = false; btn.textContent = label; off && off(); off = null; };
  const spawn = (offset = 0) => { const c = getCtx(); srcs = bufs.map((b, i) => { const s = c.createBufferSource(); s.buffer = b; s.loop = true; s.connect(inputs[i]); s.start(c.currentTime + 0.03, offset % b.duration); return s; }); t0 = c.currentTime + 0.03 - offset; };
  const start = async () => {
    await unlock(); const c = getCtx();
    if (!bufs) { st.textContent = 'Preparando o áudio…'; btn.disabled = true; try { const r = await load(); bufs = Array.isArray(r) ? r : [r]; } finally { btn.disabled = false; st.textContent = ''; } }
    if (!wired) { inputs = bufs.map(() => c.createGain()); wire(c, bufs.length === 1 ? inputs[0] : inputs, dryOut(), bufs); wired = true; }
    if (playing) return; spawn(0); playing = true; btn.textContent = 'Parar'; off = onStopAll(stop);
  };
  btn.onclick = () => (playing ? stop() : start());
  return {
    btn, status: st, start, stop, playing: () => playing,
    /** Troca o áudio (processado fora do tempo real) sem perder a posição. */
    swap(newBufs) { bufs = Array.isArray(newBufs) ? newBufs : [newBufs]; if (playing) { const pos = getCtx().currentTime - t0; srcs.forEach((s) => { try { s.stop(); } catch {} }); spawn(Math.max(0, pos)); } },
    buffers: () => bufs, row: () => h('div.row', btn, st),
  };
}

const tmp = new Float32Array(2048);
/** Pico e RMS (dB) de um AnalyserNode. */
export function levelOf(an) { const n = Math.min(tmp.length, an.fftSize); const a = tmp.subarray(0, n); an.getFloatTimeDomainData(a); let p = 0, s = 0; for (let i = 0; i < n; i++) { const v = Math.abs(a[i]); if (v > p) p = v; s += a[i] * a[i]; } return { peak: g2db(p), rms: 10 * Math.log10(s / n + 1e-12) }; }
export const analyser = (c, size = 2048) => { const a = c.createAnalyser(); a.fftSize = size; a.smoothingTimeConstant = 0.75; return a; };
/** Barra de medidor horizontal com escala em dB. */
export function drawMeter(g, x, y, w, hh, db, { min = -48, max = 6, label, hold } = {}) {
  const X = (d) => x + clamp((d - min) / (max - min), 0, 1) * w;
  g.fillStyle = '#0a1825'; g.fillRect(x, y, w, hh);
  const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, '#58d6a0'); gr.addColorStop((-12 - min) / (max - min), '#58d6a0'); gr.addColorStop((-3 - min) / (max - min), '#ffd166'); gr.addColorStop((0 - min) / (max - min), '#f06a98'); gr.addColorStop(1, '#f06a98');
  g.fillStyle = gr; g.fillRect(x, y, X(db) - x, hh);
  g.fillStyle = 'rgba(244,236,220,.5)'; g.font = '10px Figtree, sans-serif';
  for (const d of [-36, -24, -12, 0]) { g.fillRect(X(d), y + hh, 1, 4); g.fillText(String(d), X(d) - 6, y + hh + 14); }
  if (hold != null) { g.fillStyle = '#f4ecdc'; g.fillRect(X(hold) - 1, y, 2, hh); }
  if (label) { g.fillStyle = '#f4ecdc'; g.font = '600 11px Figtree, sans-serif'; g.fillText(label, x + 4, y - 4); }
}
export function drawSpectrum(g, an, x, y, w, hh, color = '#5cc8e8', buf) {
  const d = buf || new Float32Array(an.frequencyBinCount); an.getFloatFrequencyData(d); const sr = an.context.sampleRate;
  g.beginPath(); g.moveTo(x, y + hh);
  for (let px = 0; px <= w; px += 2) { const f = 30 * Math.pow(18000 / 30, px / w), k = Math.min(d.length - 1, Math.round(f / (sr / 2) * d.length)); const v = clamp((d[k] + 95) / 85, 0, 1); g.lineTo(x + px, y + hh - v * hh); }
  g.lineTo(x + w, y + hh); g.closePath(); g.fillStyle = color; g.globalAlpha = 0.35; g.fill(); g.globalAlpha = 1;
  g.fillStyle = 'rgba(244,236,220,.4)'; g.font = '10px Figtree, sans-serif';
  for (const f of [100, 1000, 10000]) { const px = x + (Math.log(f / 30) / Math.log(18000 / 30)) * w; g.fillRect(px, y, 1, hh); g.fillText(f >= 1000 ? `${f / 1000}k` : String(f), px + 3, y + 10); }
}
export const fx = (hz) => Math.log(hz / 30) / Math.log(18000 / 30);
const wrap = (...kids) => { const el = h('div.col', ...kids); return el; };
const stage = (cv) => h('div.stage', cv);
const hint = (t) => h('p.small.muted', t);

// ---------- 1. caminho do sinal / estrutura de ganho ----------
function cadeia() {
  let pre = 20, fader = 0, master = 0; const A = {};
  const r = rig({ load: voiceBuffer, wire: (c, inp, out) => {
    A.src = c.createGain(); A.src.gain.value = db2g(-34); // sinal fraco de microfone
    A.pre = c.createGain(); A.noise = c.createBufferSource(); A.fad = c.createGain(); A.mas = c.createGain(); A.clip = c.createWaveShaper(); A.clip.curve = new Float32Array([-1, 1]);
    A.m1 = analyser(c); A.m2 = analyser(c); A.m3 = analyser(c);
    inp.connect(A.src); A.src.connect(A.pre); A.pre.connect(A.clip); A.clip.connect(A.m1);
    pinkBuffer().then((nb) => { const n = c.createBufferSource(); n.buffer = nb; n.loop = true; const ng = c.createGain(); ng.gain.value = db2g(-50); n.connect(ng); ng.connect(A.fad); n.start(); A.noiseSrc = n; A.ng = ng; ng.gain.value = 0; });
    A.clip.connect(A.fad); A.fad.connect(A.m2); A.fad.connect(A.mas); A.mas.connect(A.m3); const safe = c.createGain(); safe.gain.value = 0.7; A.mas.connect(safe); safe.connect(out); upd();
  } });
  const upd = () => { if (!A.pre) return; A.pre.gain.value = db2g(pre); A.fad.gain.value = db2g(fader); A.mas.gain.value = db2g(master); if (A.ng) A.ng.gain.value = r.playing() ? db2g(-52) : 0; };
  const cv = canvas(150), msg = h('p.small', { 'aria-live': 'polite' });
  loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); if (!A.m1) return; if (A.ng) A.ng.gain.value = r.playing() ? db2g(-52) : 0;
    const l1 = levelOf(A.m1), l2 = levelOf(A.m2), l3 = levelOf(A.m3);
    drawMeter(g, 8, 16, w - 16, 14, l1.peak, { label: '1 · depois do pré (preamp)' }); drawMeter(g, 8, 64, w - 16, 14, l2.peak, { label: '2 · depois do fader' }); drawMeter(g, 8, 112, w - 16, 14, l3.peak, { label: '3 · master' });
    if (r.playing()) msg.textContent = l1.peak > -0.5 ? 'O pré está clipando: a distorção já entrou e nenhum fader conserta depois.' : pre < 12 && master + fader > 14 ? 'Pré baixo e master alto: você está amplificando o chiado junto com a voz.' : l1.peak > -18 && l1.peak < -4 ? 'Bom nível no pré: picos entre −18 e −6 dBFS, com folga (headroom).' : 'Ajuste o pré até os picos ficarem entre −18 e −6 dBFS.'; });
  return wrap(hint('A voz chega fraca do microfone. O pré dá o ganho; o chiado dos circuitos entra depois dele. Onde você põe o ganho muda tudo.'), stage(cv), msg,
    slider('Ganho do pré (gain)', { min: 0, max: 50, value: pre, unit: 'dB' }, (v) => { pre = v; upd(); }), slider('Fader do canal', { min: -30, max: 10, value: fader, unit: 'dB' }, (v) => { fader = v; upd(); }), slider('Master', { min: -30, max: 30, value: master, unit: 'dB' }, (v) => { master = v; upd(); }), r.row());
}

// ---------- 2. tipos de microfone (resposta de frequência) ----------
function microfones() {
  let kind = 'dinamico'; const N = {};
  const MODELS = { dinamico: { name: 'Dinâmico', hp: 90, mid: [5000, 4.5, 1.2], hs: [10000, -4], txt: 'Realce de presença perto de 5 kHz e menos agudos extremos. Aguenta volume e rejeita bem o palco.' }, condensador: { name: 'Condensador', hp: 30, mid: [9000, 2.5, 0.8], hs: [12000, 2], txt: 'Resposta ampla e detalhada, com “ar” nos agudos. Capta também a sala e os ruídos.' }, fita: { name: 'Fita', hp: 40, mid: [300, 1.5, 0.7], hs: [6000, -8], txt: 'Agudos suaves e graves cheios. Som macio, “antigo”. É frágil e, em geral, bidirecional.' } };
  const r = rig({ load: voiceBuffer, wire: (c, inp, out) => { N.hp = c.createBiquadFilter(); N.hp.type = 'highpass'; N.mid = c.createBiquadFilter(); N.mid.type = 'peaking'; N.hs = c.createBiquadFilter(); N.hs.type = 'highshelf'; N.an = analyser(c, 4096); inp.connect(N.hp); N.hp.connect(N.mid); N.mid.connect(N.hs); N.hs.connect(N.an); N.hs.connect(out); set(kind); } });
  const txt = h('p.dim'), cv = canvas(150);
  const set = (k) => { kind = k; const m = MODELS[k]; txt.textContent = m.txt; if (!N.hp) return; const t = getCtx().currentTime; N.hp.frequency.setTargetAtTime(m.hp, t, 0.02); N.mid.frequency.setTargetAtTime(m.mid[0], t, 0.02); N.mid.gain.setTargetAtTime(m.mid[1], t, 0.02); N.mid.Q.value = m.mid[2]; N.hs.frequency.setTargetAtTime(m.hs[0], t, 0.02); N.hs.gain.setTargetAtTime(m.hs[1], t, 0.02); };
  const fr = new Float32Array(120), mag = [new Float32Array(120), new Float32Array(120), new Float32Array(120)], phs = new Float32Array(120); for (let i = 0; i < 120; i++) fr[i] = 30 * Math.pow(18000 / 30, i / 119);
  loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); if (!N.an) { g.fillStyle = 'rgba(244,236,220,.4)'; g.fillText('Toque em “Tocar” para ver a curva de cada microfone.', 10, hh / 2); return; }
    drawSpectrum(g, N.an, 0, 0, w, hh); N.hp.getFrequencyResponse(fr, mag[0], phs); N.mid.getFrequencyResponse(fr, mag[1], phs); N.hs.getFrequencyResponse(fr, mag[2], phs);
    g.strokeStyle = '#ffd166'; g.lineWidth = 2.5; g.beginPath(); for (let i = 0; i < 120; i++) { const d = g2db(mag[0][i] * mag[1][i] * mag[2][i]); const y = hh / 2 - d * (hh / 30); i ? g.lineTo((i / 119) * w, y) : g.moveTo(0, y); } g.stroke(); });
  set(kind);
  return wrap(seg(Object.entries(MODELS).map(([v, m]) => ({ v, label: m.name })), kind, set, { label: 'Tipo de microfone' }), stage(cv), txt, hint('Curvas típicas e simplificadas de cada família, aplicadas à mesma voz. Cada modelo real tem a sua.'), r.row());
}

// ---------- 3. padrões polares ----------
const PATTERNS = { omni: ['Omnidirecional', (c) => 1], cardioide: ['Cardioide', (c) => 0.5 + 0.5 * c], super: ['Supercardioide', (c) => Math.abs(0.37 + 0.63 * c)], oito: ['Figura de oito', (c) => Math.abs(c)] };
function polar() {
  let pat = 'cardioide', ang = 0, noise = true; const N = {};
  const r = rig({ load: voiceBuffer, wire: (c, inp, out) => { N.v = c.createGain(); N.lp = c.createBiquadFilter(); N.lp.type = 'lowpass'; N.n = c.createGain(); N.n.gain.value = 0; inp.connect(N.lp); N.lp.connect(N.v); N.v.connect(out); pinkBuffer().then((b) => { const s = c.createBufferSource(); s.buffer = b; s.loop = true; s.connect(N.n); N.n.connect(out); s.start(); upd(); }); upd(); } });
  const info = h('p.small', { 'aria-live': 'polite' }), cv = canvas(250);
  const upd = () => { const f = PATTERNS[pat][1], gv = f(Math.cos(ang)), gn = f(Math.cos(Math.PI)); info.textContent = `Voz a ${Math.round((ang * 180) / Math.PI)}° do eixo: ${fmt(g2db(Math.max(gv, 0.001)), 1)} dB. Caixa de retorno atrás (180°): ${gn < 0.002 ? 'rejeição total' : fmt(g2db(gn), 1) + ' dB'}.`; if (!N.v) return; const t = getCtx().currentTime; N.v.gain.setTargetAtTime(Math.max(0.02, gv), t, 0.03); N.lp.frequency.setTargetAtTime(2500 + 15000 * gv, t, 0.03); N.n.gain.setTargetAtTime(noise && r.playing() ? 0.5 * gn : 0, t, 0.05); };
  const pt = (e) => { const b = cv.getBoundingClientRect(); ang = Math.atan2(e.clientX - b.left - b.width / 2, -(e.clientY - b.top - b.height / 2)); upd(); };
  cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); pt(e); }); cv.addEventListener('pointermove', (e) => { if (e.buttons || e.pressure > 0) pt(e); });
  loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); const cx = w / 2, cy = hh / 2, R = Math.min(w, hh) / 2 - 22, f = PATTERNS[pat][1];
    g.strokeStyle = 'rgba(244,236,220,.12)'; for (const k of [0.33, 0.66, 1]) { g.beginPath(); g.arc(cx, cy, R * k, 0, 7); g.stroke(); }
    g.beginPath(); for (let a = 0; a <= 360; a += 3) { const th = (a * Math.PI) / 180, rr = f(Math.cos(th)) * R; const x = cx + Math.sin(th) * rr, y = cy - Math.cos(th) * rr; a ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.fillStyle = 'rgba(92,200,232,.25)'; g.fill(); g.strokeStyle = '#5cc8e8'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#f4ecdc'; g.fillRect(cx - 5, cy - 10, 10, 20); g.font = '11px Figtree, sans-serif'; g.fillText('frente (0°)', cx - 26, 12); g.fillText(noise ? 'caixa de retorno' : '', cx - 40, hh - 4);
    const vx = cx + Math.sin(ang) * (R + 8), vy = cy - Math.cos(ang) * (R + 8); g.fillStyle = '#ffd166'; g.beginPath(); g.arc(vx, vy, 11, 0, 7); g.fill(); g.fillStyle = '#0e2030'; g.font = '700 10px Figtree, sans-serif'; g.fillText('voz', vx - 9, vy + 3); if (r.playing() && N.n) upd(); });
  upd();
  return wrap(seg(Object.entries(PATTERNS).map(([v, p]) => ({ v, label: p[0] })), pat, (v) => { pat = v; upd(); }, { label: 'Padrão polar' }), h('div.stage', { role: 'img', 'aria-label': 'Diagrama polar: arraste a voz ao redor do microfone' }, cv), info,
    slider('Posição da voz', { min: -180, max: 180, value: 0, unit: '°' }, (v) => { ang = (v * Math.PI) / 180; upd(); }), toggle('Ruído de uma caixa de retorno atrás do microfone', noise, (v) => { noise = v; upd(); }), hint('Arraste a bolinha amarela ou use o controle. O desenho azul mostra de onde o microfone capta mais.'), r.row());
}

// ---------- 4. efeito de proximidade ----------
function proximidade() {
  let dist = 15, dir = true; const N = {};
  const r = rig({ load: voiceBuffer, wire: (c, inp, out) => { N.ls = c.createBiquadFilter(); N.ls.type = 'lowshelf'; N.ls.frequency.value = 220; N.g = c.createGain(); N.rev = c.createConvolver(); N.rev.buffer = makeImpulse(c, 0.9, 3, 3); N.wet = c.createGain(); N.an = analyser(c, 4096); inp.connect(N.ls); N.ls.connect(N.g); N.g.connect(N.an); N.g.connect(out); inp.connect(N.rev); N.rev.connect(N.wet); N.wet.connect(out); upd(); } });
  const info = h('p.small'), cv = canvas(130);
  const boost = () => (dir ? clamp(14 * (1 - Math.log(dist / 2) / Math.log(20)), 0, 14) : 0);
  const upd = () => { info.textContent = `A ${dist} cm: ${dir ? `graves reforçados em ${fmt(boost(), 1)} dB` : 'sem reforço de graves (omni não tem efeito de proximidade)'}. ${dist > 30 ? 'A sala começa a aparecer no som.' : dist < 6 ? 'Muito perto: som “de locutor”, e os “p” estouram sem pop filter.' : ''}`; if (!N.ls) return; const t = getCtx().currentTime; N.ls.gain.setTargetAtTime(boost(), t, 0.03); N.g.gain.setTargetAtTime(clamp(Math.pow(12 / dist, 0.5), 0.5, 1.6) * 0.8, t, 0.03); N.wet.gain.setTargetAtTime(clamp((dist - 8) / 60, 0, 0.8), t, 0.03); };
  loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); if (N.an) drawSpectrum(g, N.an, 0, 0, w, hh, '#ff8f66'); g.strokeStyle = '#ffd166'; g.lineWidth = 2.5; g.beginPath(); for (let px = 0; px <= w; px += 4) { const f = 30 * Math.pow(18000 / 30, px / w), d = boost() / (1 + Math.pow(f / 220, 2)); const y = hh * 0.6 - d * (hh / 30); px ? g.lineTo(px, y) : g.moveTo(px, y); } g.stroke(); });
  upd();
  return wrap(stage(cv), info, slider('Distância da boca ao microfone', { min: 2, max: 60, value: dist, unit: 'cm' }, (v) => { dist = v; upd(); }), seg([{ v: true, label: 'Cardioide (direcional)' }, { v: false, label: 'Omnidirecional' }], dir, (v) => { dir = v; upd(); }, { label: 'Padrão' }), hint('A linha amarela é o reforço de graves. O volume foi compensado em parte para você ouvir a mudança de timbre.'), r.row());
}

// ---------- 5. sala seca x reverberante ----------
function sala() {
  let size = 'media', mix = 0.35; const N = {}, IR = {};
  const SIZES = { cabine: ['Cabine tratada', 0.25, 4], media: ['Quarto comum', 0.8, 3], igreja: ['Salão vazio', 2.8, 2.2] };
  const r = rig({ load: voiceBuffer, wire: (c, inp, out) => { N.dry = c.createGain(); N.wet = c.createGain(); N.conv = c.createConvolver(); inp.connect(N.dry); N.dry.connect(out); inp.connect(N.conv); N.conv.connect(N.wet); N.wet.connect(out); upd(); } });
  const info = h('p.dim');
  const upd = () => { const [nm, sec] = SIZES[size]; info.textContent = `${nm}: as reflexões duram cerca de ${fmt(sec, 1)} s. ${size === 'cabine' ? 'Som seco e próximo: fácil de mixar, e o reverb pode ser somado depois.' : size === 'igreja' ? 'Bonito para ouvir, mas a reverberação gravada não sai mais da pista.' : 'Reflexões curtas de parede e teto dão som “de caixa”.'}`; if (!N.conv) return; const c = getCtx(); if (!IR[size]) IR[size] = makeImpulse(c, SIZES[size][1], SIZES[size][2], 11); N.conv.buffer = IR[size]; N.wet.gain.setTargetAtTime(mix * 1.6, c.currentTime, 0.03); N.dry.gain.setTargetAtTime(1 - mix * 0.5, c.currentTime, 0.03); };
  upd();
  return wrap(seg(Object.entries(SIZES).map(([v, s]) => ({ v, label: s[0] })), size, (v) => { size = v; upd(); }, { label: 'Ambiente' }), info, slider('Distância do microfone (mais longe = mais sala)', { min: 0, max: 1, step: 0.05, value: mix, fmtv: (v) => `${Math.round(v * 100)}%` }, (v) => { mix = v; upd(); }), r.row());
}

// ---------- 6. ganho com medidor e clipping audível ----------
function ganho() {
  let gain = 0, comp = true; const N = {}; let hold = -60, clipAt = 0;
  const r = rig({ load: voiceBuffer, wire: (c, inp, out) => { N.g = c.createGain(); N.an = analyser(c); N.clip = c.createWaveShaper(); N.clip.curve = new Float32Array([-1, 1]); N.post = c.createGain(); inp.connect(N.g); N.g.connect(N.an); N.g.connect(N.clip); N.clip.connect(N.post); N.post.connect(out); upd(); } });
  const upd = () => { if (!N.g) return; N.g.gain.value = db2g(gain); N.post.gain.value = comp ? db2g(-Math.max(0, gain) * 0.85) : 1; };
  const cv = canvas(110), msg = h('p.small', { 'aria-live': 'polite' });
  loop(cv, (t) => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); if (!N.an) return; const l = levelOf(N.an); hold = Math.max(hold - 0.25, l.peak); if (l.peak >= 0) clipAt = t;
    drawMeter(g, 8, 20, w - 60, 22, l.peak, { label: 'Nível depois do ganho (dBFS)', hold, max: 12 }); const on = t - clipAt < 1.2; g.fillStyle = on ? '#f06a98' : '#3a1e2c'; g.beginPath(); g.arc(w - 26, 31, 13, 0, 7); g.fill(); g.fillStyle = on ? '#0e2030' : '#8fa1ad'; g.font = '700 9px Figtree, sans-serif'; g.fillText('CLIP', w - 37, 34);
    g.fillStyle = 'rgba(244,236,220,.6)'; g.font = '11px Figtree, sans-serif'; g.fillText(`pico: ${fmt(Math.min(hold, 20), 1)} dBFS · headroom: ${hold < 0 ? fmt(-hold, 1) + ' dB' : 'nenhum'}`, 8, 84);
    if (r.playing()) msg.textContent = hold >= 0 ? 'Clipou: as pontas da onda foram cortadas. Esse chiado áspero não tem conserto depois de gravado.' : hold > -6 ? 'Quase no limite. Um trecho mais forte vai clipar.' : hold > -18 ? 'Bom: picos entre −18 e −6 dBFS.' : 'Baixo demais: o sinal fica perto do ruído.'; });
  return wrap(stage(cv), msg, slider('Ganho (gain)', { min: -20, max: 30, value: gain, unit: 'dB' }, (v) => { gain = v; hold = -60; upd(); }), toggle('Compensar o volume na saída (para ouvir só a distorção)', comp, (v) => { comp = v; upd(); }), r.row());
}

// ---------- 7. taxa de amostragem, bits e dither ----------
function bits() {
  let nb = 16, hold = 1, dither = false, quiet = false, orig = null;
  const r = rig({ load: voiceBuffer, wire: (c, inp, out) => { const g = c.createGain(); g.gain.value = 0.9; inp.connect(g); g.connect(out); orig = r.buffers()[0]; } });
  const info = h('p.small');
  const apply = () => { info.textContent = `${nb} bits: cerca de ${Math.round(6.02 * nb)} dB de faixa dinâmica. Taxa de ${fmt(getCtx().sampleRate / hold / 1000, 1)} kHz: registra até ${fmt(getCtx().sampleRate / hold / 2000, 1)} kHz. ${quiet && nb <= 8 ? (dither ? 'Com dither, o som baixo continua lá, debaixo de um chiado suave.' : 'Sem dither, o som baixo vira degraus: distorção áspera que some e volta.') : ''}`; if (!orig) return; let x = orig.getChannelData(0); if (quiet) { const y = new Float32Array(x.length); const k = db2g(-36); for (let i = 0; i < x.length; i++) y[i] = x[i] * k; x = y; } let y = crush(x, { bits: nb, dither, hold }); if (quiet) { const k = db2g(34); for (let i = 0; i < y.length; i++) y[i] *= k; } r.swap(bufferFrom([y], orig.sampleRate)); };
  const start = r.btn.onclick; r.btn.onclick = async () => { const was = r.playing(); await start(); if (!was) apply(); };
  return wrap(h('div.eyebrow', 'Bits'), seg([16, 12, 8, 6, 4].map((v) => ({ v, label: `${v} bits` })), nb, (v) => { nb = v; apply(); }, { label: 'Bits' }), h('div.eyebrow', 'Taxa de amostragem'), seg([1, 2, 4, 8].map((v) => ({ v, label: `÷${v}` })), hold, (v) => { hold = v; apply(); }, { label: 'Divisor da taxa de amostragem' }),
    toggle('Trecho bem baixo (36 dB abaixo), amplificado para ouvir', quiet, (v) => { quiet = v; apply(); }), toggle('Dither (ruído TPDF antes de reduzir os bits)', dither, (v) => { dither = v; apply(); }), info, hint('A redução de taxa aqui é feita sem filtro, para você ouvir o aliasing: frequências falsas que aparecem quando a taxa é baixa demais.'), r.row());
}

// ---------- 8. latência ----------
function latencia() {
  let ms = 0, timer = null; const N = {};
  const cv = canvas(70), info = h('p.small');
  const btn = h('button.btn.primary', 'Tocar'); let on = false, next = 0, off = null;
  const tick = () => { const c = getCtx(); while (next < c.currentTime + 0.15) { click(next, true, { gain: 0.22 }); const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = 330; g.gain.setValueAtTime(0, next + ms / 1000); g.gain.linearRampToValueAtTime(0.3, next + ms / 1000 + 0.005); g.gain.exponentialRampToValueAtTime(0.001, next + ms / 1000 + 0.18); o.connect(g); g.connect(dryOut()); o.start(next + ms / 1000); o.stop(next + ms / 1000 + 0.2); N.last = next; next += 0.6; } };
  const stop = () => { on = false; clearInterval(timer); btn.textContent = 'Tocar'; off && off(); };
  btn.onclick = async () => { await unlock(); if (on) return stop(); on = true; next = now() + 0.1; timer = setInterval(tick, 50); tick(); btn.textContent = 'Parar'; off = onStopAll(stop); };
  const upd = () => { info.textContent = ms <= 10 ? `${ms} ms: imperceptível. É como cantar a 3 metros da caixa.` : ms <= 25 ? `${ms} ms: dá para sentir um leve “eco colado”. Ainda cantável.` : ms <= 60 ? `${ms} ms: atrapalha a afinação e o tempo. Use monitoração direta.` : `${ms} ms: impossível cantar ouvindo isso.`; };
  loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); const x0 = 20, sc = (w - 40) / 200; g.fillStyle = '#ffd166'; g.fillRect(x0, 10, 3, hh - 30); g.fillStyle = '#5cc8e8'; g.fillRect(x0 + ms * sc, 10, 3, hh - 30); g.fillStyle = 'rgba(244,236,220,.6)'; g.font = '11px Figtree, sans-serif'; g.fillText('clique (guia)', x0 + 6, 20); g.fillText('sua voz no fone', x0 + ms * sc + 6, 36); g.fillText('0 ms', x0, hh - 4); g.fillText('200 ms', w - 50, hh - 4); });
  upd();
  return wrap(hint('O clique é a guia. O som grave é a “sua voz” voltando pelo fone depois de passar pelo computador.'), stage(cv), info, slider('Latência', { min: 0, max: 200, step: 5, value: ms, unit: 'ms' }, (v) => { ms = v; upd(); }), h('div.row', btn));
}

// ---------- 9. gravação em camadas ----------
function camadas() {
  let n = 1, width = 0.8, tight = false; const N = { g: [], p: [], d: [] };
  const r = rig({ load: async () => { const b = await voiceBuffer(); return [b, b, b, b, b, b]; }, wire: (c, inps, out) => { const bus = c.createGain(); bus.gain.value = 0.55; bus.connect(out); inps.forEach((inp, i) => { const d = c.createDelay(0.2), g = c.createGain(), p = c.createStereoPanner ? c.createStereoPanner() : c.createGain(); inp.connect(d); d.connect(g); g.connect(p); p.connect(bus); N.g.push(g); N.p.push(p); N.d.push(d); }); upd(); } });
  const info = h('p.dim');
  const upd = () => { info.textContent = n === 1 ? 'Uma tomada: voz sozinha, no centro.' : `${n} tomadas da mesma linha. ${tight ? 'Bem juntas: som quase de uma voz só, mais gorda.' : 'Com as pequenas diferenças naturais de tempo e afinação: som de grupo.'}`; if (!N.g.length) return; const c = getCtx(); N.g.forEach((g, i) => { g.gain.setTargetAtTime(i < n ? 1 / Math.sqrt(n) : 0, c.currentTime, 0.03); N.d[i].delayTime.setTargetAtTime(i === 0 ? 0 : (tight ? 0.004 : 0.022) * ((i * 37) % 7) / 3, c.currentTime, 0.05); if (N.p[i].pan) N.p[i].pan.setTargetAtTime(n === 1 ? 0 : ((i % 2 ? 1 : -1) * Math.ceil(i / 2)) / Math.max(1, Math.floor(n / 2)) * width, c.currentTime, 0.03); }); };
  const start = r.btn.onclick; r.btn.onclick = async () => { const was = r.playing(); await start(); if (!was) upd(); };
  upd();
  return wrap(slider('Número de tomadas empilhadas', { min: 1, max: 6, value: n }, (v) => { n = v; upd(); }), slider('Abertura no estéreo', { min: 0, max: 1, step: 0.05, value: width, fmtv: (v) => `${Math.round(v * 100)}%` }, (v) => { width = v; upd(); }), toggle('Tomadas bem sincronizadas', tight, (v) => { tight = v; upd(); }), info, hint('Em estúdio, cada tomada é cantada de novo. Aqui, cópias com pequenos atrasos imitam essa diferença.'), r.row());
}

// ---------- 10. auxiliares pré e pós-fader ----------
function aux() {
  let fader = 0, send = -6, pre = true, listen = 'pa'; const N = {};
  const r = rig({ load: voiceBuffer, wire: (c, inp, out) => { N.f = c.createGain(); N.sPre = c.createGain(); N.sPost = c.createGain(); N.pa = c.createGain(); N.mon = c.createGain(); N.aPa = analyser(c); N.aMon = analyser(c); inp.connect(N.f); N.f.connect(N.aPa); N.f.connect(N.pa); N.pa.connect(out); inp.connect(N.sPre); N.f.connect(N.sPost); N.sPre.connect(N.aMon); N.sPost.connect(N.aMon); N.sPre.connect(N.mon); N.sPost.connect(N.mon); N.mon.connect(out); upd(); } });
  const upd = () => { if (!N.f) return; N.f.gain.value = fader <= -60 ? 0 : db2g(fader); N.sPre.gain.value = pre ? db2g(send) : 0; N.sPost.gain.value = pre ? 0 : db2g(send); N.pa.gain.value = listen === 'pa' ? 1 : 0; N.mon.gain.value = listen === 'mon' ? 1 : 0; };
  const cv = canvas(100), info = h('p.dim');
  loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); if (!N.aPa) return; drawMeter(g, 8, 16, w - 16, 14, levelOf(N.aPa).peak, { label: 'Saída principal (PA)' }); drawMeter(g, 8, 64, w - 16, 14, levelOf(N.aMon).peak, { label: `Auxiliar (${pre ? 'pré' : 'pós'}-fader)` }); });
  const txt = () => { info.textContent = pre ? 'Pré-fader (PRE): o auxiliar pega o som antes do fader. Baixe o fader até o fim e o retorno continua igual. É o que se usa para o monitor do cantor.' : 'Pós-fader (POST): o auxiliar acompanha o fader. Baixou o canal, baixou o envio. É o que se usa para reverb e outros efeitos.'; };
  txt();
  return wrap(stage(cv), slider('Fader do canal', { min: -60, max: 6, value: fader, unit: 'dB' }, (v) => { fader = v; upd(); }), slider('Envio do auxiliar (aux send)', { min: -40, max: 6, value: send, unit: 'dB' }, (v) => { send = v; upd(); }),
    seg([{ v: true, label: 'Pré-fader (PRE)' }, { v: false, label: 'Pós-fader (POST)' }], pre, (v) => { pre = v; upd(); txt(); }, { label: 'Tipo de auxiliar' }), info, h('div.eyebrow', 'Ouvir'), seg([{ v: 'pa', label: 'Saída principal' }, { v: 'mon', label: 'Saída do auxiliar' }], listen, (v) => { listen = v; upd(); }, { label: 'O que ouvir' }), r.row());
}

// ---------- 11. medidores: pico x VU ----------
function medidores() {
  const N = {}; let vu = -40, pk = -60, hold = -60;
  const r = rig({ load: voiceBuffer, wire: (c, inp, out) => { N.an = analyser(c); N.g = c.createGain(); N.g.gain.value = 1.6; inp.connect(N.g); N.g.connect(N.an); N.g.connect(out); } });
  const cv = canvas(190);
  loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); const l = N.an && r.playing() ? levelOf(N.an) : { peak: -60, rms: -60 };
    vu += (l.rms - vu) * 0.06; pk = Math.max(pk - 0.8, l.peak); hold = Math.max(hold - 0.12, l.peak);
    // VU analógico: 0 VU ≈ −18 dBFS (referência comum)
    const cx = w / 2, cy = 118, R = 92, vuVal = clamp(vu + 18, -20, 3), ang = (-50 + ((vuVal + 20) / 23) * 100) * Math.PI / 180;
    g.strokeStyle = 'rgba(244,236,220,.5)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R, (-140 * Math.PI) / 180, (-40 * Math.PI) / 180); g.stroke();
    g.strokeStyle = '#f06a98'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, R, ((-90 + (-50 + (20 / 23) * 100)) * Math.PI) / 180, (-40 * Math.PI) / 180); g.stroke();
    g.font = '10px Figtree, sans-serif'; g.fillStyle = 'rgba(244,236,220,.7)'; for (const v of [-20, -10, -5, 0, 3]) { const a = (-50 + ((v + 20) / 23) * 100) * Math.PI / 180; g.fillText(String(v), cx + Math.sin(a) * (R + 12) - 6, cy - Math.cos(a) * (R + 12) + 3); }
    g.strokeStyle = '#f4ecdc'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(ang) * (R - 6), cy - Math.cos(ang) * (R - 6)); g.stroke(); g.fillStyle = '#f4ecdc'; g.font = '600 12px Figtree, sans-serif'; g.fillText('VU', cx - 8, cy - 30);
    drawMeter(g, 8, 150, w - 16, 14, pk, { label: `Medidor de pico: ${fmt(Math.max(-60, hold), 1)} dBFS · VU: ${fmt(vuVal, 1)} VU`, hold }); });
  return wrap(stage(cv), hint('O ponteiro do VU é lento (cerca de 300 ms): mostra o volume médio, parecido com o que o ouvido sente. O medidor de pico é rápido: mostra os instantes que podem clipar. Aqui, 0 VU equivale a −18 dBFS.'), r.row());
}

// ---------- 12. microfonia (simulada, com volume seguro) ----------
function microfonia() {
  let gain = -12, dist = 3, front = false, notch = false; const N = {}; let lvl = -60;
  const r = rig({ load: voiceBuffer, wire: (c, inp, out) => {
    N.mic = c.createGain(); N.loop = c.createGain(); N.del = c.createDelay(0.1); N.del.delayTime.value = 0.011; N.bp = c.createBiquadFilter(); N.bp.type = 'peaking'; N.bp.frequency.value = 2400; N.bp.Q.value = 9; N.bp.gain.value = 9;
    N.nt = c.createBiquadFilter(); N.nt.type = 'peaking'; N.nt.frequency.value = 2400; N.nt.Q.value = 8; N.nt.gain.value = 0; N.sat = c.createWaveShaper(); const cv2 = new Float32Array(257); for (let i = 0; i < 257; i++) cv2[i] = Math.tanh((i / 128 - 1) * 2.2) * 0.9; N.sat.curve = cv2;
    N.an = analyser(c); N.outG = c.createGain(); N.outG.gain.value = 0.28;
    inp.connect(N.mic); N.mic.connect(N.nt); N.nt.connect(N.sat); N.sat.connect(N.an); N.sat.connect(N.outG); N.outG.connect(out); N.sat.connect(N.del); N.del.connect(N.bp); N.bp.connect(N.loop); N.loop.connect(N.nt); upd(); } });
  const loopGain = () => db2g(gain) * (1.9 / dist) * (front ? 1.25 : 0.42) * 0.62;
  const info = h('p.small', { 'aria-live': 'polite' }), cv = canvas(120);
  const upd = () => { if (!N.mic) return; N.mic.gain.value = db2g(gain + 8) * 0.5; N.loop.gain.value = Math.min(1.25, loopGain()); N.nt.gain.value = notch ? -12 : 0; };
  loop(cv, () => { const { g, w, h: hh } = cv._fit(); g.clearRect(0, 0, w, hh); if (N.an) { drawSpectrum(g, N.an, 0, 0, w, hh - 34, '#f06a98'); lvl = levelOf(N.an).rms; }
    const lg = loopGain() * (notch ? 0.3 : 1) * 2.8; g.fillStyle = '#0a1825'; g.fillRect(8, hh - 22, w - 16, 12); g.fillStyle = lg >= 1 ? '#f06a98' : lg > 0.7 ? '#ffd166' : '#58d6a0'; g.fillRect(8, hh - 22, clamp(lg, 0, 1.3) / 1.3 * (w - 16), 12); g.fillStyle = '#f4ecdc'; g.fillRect(8 + (w - 16) / 1.3, hh - 26, 2, 20); g.font = '11px Figtree, sans-serif'; g.fillText('ganho do laço microfone → caixa → microfone', 8, hh - 28);
    if (r.playing()) info.textContent = lg >= 1 ? 'Microfonia! O laço passou de 1: o som da caixa volta ao microfone mais forte do que saiu, e apita.' : lg > 0.7 ? 'No limite: o som fica “tubular”, com um anel que demora a morrer. Um pouco mais e apita.' : 'Estável. O que volta da caixa é mais fraco do que o que saiu.'; });
  return wrap(hint('Simulação com volume limitado: nada aqui vai apitar no seu alto-falante de verdade.'), stage(cv), info, slider('Ganho do microfone', { min: -24, max: 12, value: gain, unit: 'dB' }, (v) => { gain = v; upd(); }), slider('Distância entre a caixa e o microfone', { min: 0.5, max: 6, step: 0.1, value: dist, unit: 'm' }, (v) => { dist = v; upd(); }),
    toggle('Caixa apontada para a frente do microfone', front, (v) => { front = v; upd(); }), toggle('Corte estreito no equalizador, na frequência que apita', notch, (v) => { notch = v; upd(); }), r.row());
}

// ---------- 13. cenas (mesa digital) ----------
function cenas() {
  const lv = [0, 0, 0, 0, 0, 0]; const scenes = { Ensaio: [0, 0, 0, 0, 0, 0], 'Solo do líder': [-4, -10, -10, -10, -10, 3], 'Só o miolo': [-60, -2, 0, 0, -2, -60] }; const N = { g: [] };
  const r = rig({ load: () => stems('aurora'), wire: (c, inps, out) => { const bus = c.createGain(); bus.gain.value = 0.5; bus.connect(out); inps.forEach((inp, i) => { const g = c.createGain(), p = c.createStereoPanner ? c.createStereoPanner() : c.createGain(); if (p.pan) p.pan.value = (i / 5 - 0.5) * 1.2; inp.connect(g); g.connect(p); p.connect(bus); N.g.push(g); }); apply(); } });
  const sl = lv.map((_, i) => slider(VOICE_NAMES[i], { min: -60, max: 6, value: 0, unit: 'dB' }, (v) => { lv[i] = v; apply(); }));
  const apply = (ramp) => N.g.forEach((g, i) => g.gain.setTargetAtTime(lv[i] <= -60 ? 0 : db2g(lv[i]), getCtx().currentTime, ramp ? 0.15 : 0.02));
  const box = h('div.seg.wrap'); const paint = () => box.replaceChildren(...Object.keys(scenes).map((k) => h('button.chip', { onclick: () => { scenes[k].forEach((v, i) => { lv[i] = v; sl[i].set(v); }); apply(true); } }, `Chamar “${k}”`)), h('button.chip', { onclick: () => { scenes[`Minha cena ${Object.keys(scenes).length - 2}`] = [...lv]; paint(); } }, '+ Salvar cena atual'));
  paint(); sl.forEach((s, i) => { s.style.setProperty('--c', VOICE_COLORS[i]); });
  return wrap(hint('Na mesa digital, uma “cena” (scene) guarda a posição de todos os controles. Chamar a cena traz tudo de volta em um toque.'), box, ...sl.slice().reverse(), r.row());
}

export const SIMS = { cadeia, microfones, polar, proximidade, sala, ganho, bits, latencia, camadas, aux, medidores, microfonia, cenas };
