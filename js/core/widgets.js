// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Componentes compartilhados: teclado colorido por voz, botões de voz, mapa das vozes, traço de altura.

import { h, canvas, clamp } from './ui.js';
import { VOICE_COLORS, VOICE_NAMES, pcName, noteName, pc, freqToMidi, voiceIndex } from '../music/theory.js';

const BLACK = new Set([1, 3, 6, 8, 10]);

/**
 * Teclado de piano. opts: { lo, hi, onDown(m), onUp(m), labels }
 * .show([{m, color, target}]) pinta as teclas. Multitoque por Pointer Events.
 */
export function keyboard({ lo = 48, hi = 84, onDown, onUp, labels = true, height } = {}) {
  while (BLACK.has(pc(lo))) lo--; while (BLACK.has(pc(hi))) hi++;
  const el = h('div.kbd', { role: 'group', 'aria-label': 'Teclado' });
  if (height) el.style.height = height + 'px';
  const whites = []; for (let m = lo; m <= hi; m++) if (!BLACK.has(pc(m))) whites.push(m);
  const ww = 100 / whites.length; const keys = new Map();
  whites.forEach((m, i) => { const k = h('div.w', { style: { left: i * ww + '%', width: ww + '%' }, data: { m } }, labels && pc(m) === 0 ? noteName(m) : ''); keys.set(m, k); el.append(k); });
  for (let m = lo; m <= hi; m++) if (BLACK.has(pc(m))) { const i = whites.indexOf(m - 1); const k = h('div.b', { style: { left: (i + 1) * ww - ww * 0.3 + '%', width: ww * 0.6 + '%' }, data: { m } }); keys.set(m, k); el.append(k); }
  el.show = (list) => {
    for (const k of keys.values()) { k.classList.remove('on', 'tgt'); k.style.removeProperty('--c'); if (k.classList.contains('b') || !(labels && pc(+k.dataset.m) === 0)) k.textContent = ''; }
    for (const it of list || []) { const k = keys.get(it.m); if (!k) continue; k.classList.add(it.target ? 'tgt' : 'on'); k.style.setProperty('--c', it.color || '#ffd166'); if (it.label !== false && !it.target) k.textContent = it.label || pcName(it.m); }
  };
  if (onDown) {
    const held = new Map();
    const at = (e) => { const t = document.elementFromPoint(e.clientX, e.clientY); return t && t.dataset && t.dataset.m && el.contains(t) ? +t.dataset.m : null; };
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch {} const m = at(e); if (m != null) { held.set(e.pointerId, m); onDown(m); } });
    el.addEventListener('pointermove', (e) => { if (!held.has(e.pointerId)) return; const m = at(e), prev = held.get(e.pointerId); if (m != null && m !== prev) { onUp && onUp(prev); held.set(e.pointerId, m); onDown(m); } });
    const up = (e) => { if (held.has(e.pointerId)) { onUp && onUp(held.get(e.pointerId)); held.delete(e.pointerId); } };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }
  el.range = [lo, hi];
  return el;
}

/** Intervalo de teclado que cobre as notas dadas. */
export function kbdRange(notes, pad = 2) {
  const lo = Math.min(...notes) - pad, hi = Math.max(...notes) + pad;
  return { lo: Math.min(lo, hi - 14), hi: Math.max(hi, lo + 14) };
}

/**
 * Botões das vozes: toque silencia; toque longo (ou segundo toque em "solo") isola.
 * state: { mute:[bool...], solo: índice|null }. onChange(state).
 */
export function voiceChips(n, state, onChange, { names, solo = true } = {}) {
  const box = h('div.seg.wrap', { role: 'group', 'aria-label': 'Vozes: toque para silenciar' });
  const idx = (i) => voiceIndex(i, n);
  const nm = (i) => (names && names.length === n ? names[i] : (names || VOICE_NAMES)[idx(i)]);
  const paint = () => [...box.children].forEach((b, k) => {
    if (k >= n) { b.setAttribute('aria-pressed', String(state.solo != null)); return; }
    const i = n - 1 - k; const muted = state.solo != null ? state.solo !== i : !!state.mute[i];
    b.setAttribute('aria-pressed', String(!muted)); b.classList.toggle('muted-v', muted);
    b.setAttribute('aria-label', `${nm(i)}: ${muted ? 'em silêncio' : 'soando'}`);
  });
  for (let i = n - 1; i >= 0; i--) {
    let timer = 0, long = false;
    const b = h('button.chip.v', { type: 'button', css: { '--c': VOICE_COLORS[idx(i)] } }, nm(i));
    b.addEventListener('pointerdown', () => { long = false; if (solo) timer = setTimeout(() => { long = true; state.solo = state.solo === i ? null : i; paint(); onChange(state); }, 450); });
    b.addEventListener('pointerup', () => clearTimeout(timer)); b.addEventListener('pointerleave', () => clearTimeout(timer));
    b.addEventListener('click', () => { if (long) return; if (state.solo != null) state.solo = null; else state.mute[i] = !state.mute[i]; paint(); onChange(state); });
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    box.append(b);
  }
  box.paint = paint; paint();
  return box;
}
export const isMuted = (state, i) => (state.solo != null ? state.solo !== i : !!state.mute[i]);

/**
 * Mapa das vozes no tempo: cada voz é uma linha colorida; cursor mostra o que soa.
 * steps: [{n:[...], d}]. draw(pos) com pos = {i, frac} ou null.
 */
export function voiceMap(steps, { height = 150, colors } = {}) {
  const c = canvas(height);
  const total = steps.reduce((a, s) => a + (s.d || 1), 0);
  const all = steps.flatMap((s) => s.n);
  const lo = Math.min(...all) - 2, hi = Math.max(...all) + 2;
  const starts = []; let acc = 0; for (const s of steps) { starts.push(acc); acc += s.d || 1; }
  const nV = Math.max(...steps.map((s) => s.n.length));
  const col = (v, n) => (colors || VOICE_COLORS)[voiceIndex(v, n)];
  c.draw = (pos, state, trace) => {
    const { g, w, h: hh } = c._fit();
    g.clearRect(0, 0, w, hh);
    const X = (b) => 6 + (b / total) * (w - 12), Y = (m) => hh - 8 - ((m - lo) / (hi - lo)) * (hh - 16);
    g.strokeStyle = 'rgba(244,236,220,.08)'; g.lineWidth = 1;
    starts.forEach((b) => { g.beginPath(); g.moveTo(X(b), 4); g.lineTo(X(b), hh - 4); g.stroke(); });
    for (let v = 0; v < nV; v++) {
      const muted = state ? isMuted(state, v) : false;
      g.strokeStyle = col(v, nV); g.globalAlpha = muted ? 0.22 : 1; g.lineWidth = 3.5; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); let started = false;
      steps.forEach((s, i) => {
        if (s.n[v] == null || s.rest) { started = false; return; }
        const x0 = X(starts[i]) + 3, x1 = X(starts[i] + (s.d || 1)) - 3, y = Y(s.n[v]);
        if (!started) { g.moveTo(x0, y); started = true; } else g.lineTo(x0, y);
        g.lineTo(x1, y);
      });
      g.stroke();
    }
    g.globalAlpha = 1;
    if (trace && trace.length) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); let pen = false; for (const p of trace) { if (p.m == null) { pen = false; continue; } const x = X(p.b), y = Y(clamp(p.m, lo, hi)); if (pen) g.lineTo(x, y); else { g.moveTo(x, y); pen = true; } } g.stroke(); }
    if (pos) {
      const x = X(starts[pos.i] + pos.frac * (steps[pos.i].d || 1));
      g.strokeStyle = '#f4ecdc'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 2); g.lineTo(x, hh - 2); g.stroke();
      steps[pos.i].n.forEach((m, v) => { if (m == null || (state && isMuted(state, v))) return; g.fillStyle = col(v, nV); g.beginPath(); g.arc(x, Y(m), 6, 0, 7); g.fill(); });
    }
  };
  c.beatAt = (pos) => (pos ? starts[pos.i] + pos.frac * (steps[pos.i].d || 1) : 0);
  queueMicrotask(() => requestAnimationFrame(() => c.isConnected && c.draw(null)));
  return c;
}

/**
 * Traço de altura rolando no tempo (afinador, exercícios).
 * push(midiFloat|null); alvo opcional (linha) e faixa em semitons.
 */
export function pitchTrace({ height = 180, span = 14, seconds = 6 } = {}) {
  const c = canvas(height);
  const pts = []; let center = 60, target = null, color = '#ffd166', bands = null;
  c.push = (m) => { const t = performance.now() / 1000; pts.push({ t, m }); while (pts.length && pts[0].t < t - seconds - 0.5) pts.shift(); if (m != null && target == null) center += (m - center) * 0.04; };
  c.setTarget = (m, col) => { target = m; if (m != null) center = m; if (col) color = col; };
  c.setBands = (list) => { bands = list; };
  c.clearTrace = () => { pts.length = 0; };
  c.draw = () => {
    const { g, w, h: hh } = c._fit(); const tNow = performance.now() / 1000;
    g.clearRect(0, 0, w, hh);
    const lo = center - span / 2, Y = (m) => hh - ((m - lo) / span) * hh, X = (t) => w * 0.82 - (tNow - t) / seconds * w * 0.82;
    for (let m = Math.ceil(lo); m <= lo + span; m++) {
      const y = Y(m); const nat = ![1, 3, 6, 8, 10].includes(pc(m));
      g.strokeStyle = nat ? 'rgba(244,236,220,.13)' : 'rgba(244,236,220,.05)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
      if (nat) { g.fillStyle = 'rgba(244,236,220,.45)'; g.font = '11px Figtree, sans-serif'; g.fillText(noteName(m), w - 34, y - 3); }
    }
    if (bands) for (const b of bands) { g.fillStyle = b.color; g.globalAlpha = 0.16; g.fillRect(0, Y(b.m + 0.5), w, Y(b.m - 0.5) - Y(b.m + 0.5)); g.globalAlpha = 1; }
    if (target != null) { g.fillStyle = color; g.globalAlpha = 0.2; g.fillRect(0, Y(target + 0.25), w, Y(target - 0.25) - Y(target + 0.25)); g.globalAlpha = 1; g.strokeStyle = color; g.lineWidth = 2; g.beginPath(); g.moveTo(0, Y(target)); g.lineTo(w, Y(target)); g.stroke(); }
    g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#f4ecdc'; g.beginPath(); let pen = false, last = null;
    for (const p of pts) { if (p.m == null || (last && Math.abs(p.m - last.m) > 3)) { pen = false; } if (p.m == null) { last = null; continue; } const x = X(p.t), y = Y(p.m); if (pen) g.lineTo(x, y); else { g.moveTo(x, y); pen = true; } last = p; }
    g.stroke();
    const lp = pts[pts.length - 1];
    if (lp && lp.m != null && tNow - lp.t < 0.2) { g.fillStyle = target != null && Math.abs(lp.m - target) < 0.25 ? '#58d6a0' : '#f4ecdc'; g.beginPath(); g.arc(X(lp.t), Y(lp.m), 7, 0, 7); g.fill(); }
  };
  return c;
}

/** Converte leitura do microfone em MIDI fracionário (ou null se pouco confiável). */
export const pitchToMidi = (p, a4 = 440, minC = 0.8, minRms = 0.006) => (p.f > 0 && p.c >= minC && p.rms >= minRms ? freqToMidi(p.f, a4) : null);

/** Traz m para a oitava mais próxima do alvo (quem canta pode estar uma oitava acima ou abaixo). */
export const foldToTarget = (m, target) => m - 12 * Math.round((m - target) / 12);

/** Medidor de cents: bolinha que anda da esquerda (grave) para a direita (agudo). .set(cents|null, rótulo) */
export function centsMeter({ height = 70, range = 50 } = {}) {
  const c = canvas(height); let cur = null, shown = 0, label = '';
  c.set = (v, l) => { cur = v; if (l != null) label = l; };
  c.draw = () => {
    const { g, w, h: hh } = c._fit(); g.clearRect(0, 0, w, hh);
    const X = (ct) => w / 2 + clamp(ct / range, -1, 1) * (w / 2 - 14);
    g.fillStyle = 'rgba(88,214,160,.18)'; g.fillRect(X(-10), 0, X(10) - X(-10), hh);
    g.strokeStyle = 'rgba(244,236,220,.25)'; g.lineWidth = 1;
    for (const t of [-50, -25, 0, 25, 50]) { g.beginPath(); g.moveTo(X(t), hh - (t === 0 ? hh : 12)); g.lineTo(X(t), hh); g.stroke(); }
    g.fillStyle = 'rgba(244,236,220,.5)'; g.font = '11px Figtree, sans-serif'; g.fillText('grave', 4, 12); g.fillText('agudo', w - 36, 12);
    if (cur != null) {
      shown += (cur - shown) * 0.35;
      g.fillStyle = Math.abs(shown) <= 10 ? '#58d6a0' : Math.abs(shown) <= 25 ? '#ffd166' : '#f06a98';
      g.beginPath(); g.arc(X(shown), hh / 2 + 4, 11, 0, 7); g.fill();
      g.fillStyle = '#f4ecdc'; g.font = '600 13px Figtree, sans-serif'; const txt = `${shown > 0 ? '+' : ''}${Math.round(shown)} cents${label ? ' · ' + label : ''}`; g.fillText(txt, w / 2 - g.measureText(txt).width / 2, hh - 4);
    }
  };
  return c;
}

/** Botão giratório (knob): arraste para cima/baixo; setas do teclado; toque duplo volta ao padrão. */
export function knob(label, { min, max, value, step = 1, unit = '', fmtv, def }, onInput) {
  const d0 = def ?? value; let v = value;
  const arc = s2('path', { fill: 'none', stroke: 'var(--c, #ffd166)', 'stroke-width': 4, 'stroke-linecap': 'round' }), ptr = s2('line', { stroke: '#f4ecdc', 'stroke-width': 2.5, 'stroke-linecap': 'round' });
  const svg = s2('svg', { viewBox: '0 0 48 48', 'aria-hidden': 'true' }, s2('circle', { cx: 24, cy: 24, r: 15, fill: '#1a3549', stroke: '#3a5a70' }), s2('path', { d: describeArc(-135, 135), fill: 'none', stroke: '#0a1825', 'stroke-width': 4, 'stroke-linecap': 'round' }), arc, ptr);
  const val = h('span.kv'), el = h('div.knob', { role: 'slider', tabindex: 0, 'aria-label': label, 'aria-valuemin': min, 'aria-valuemax': max }, svg, val, h('span.kl', label));
  const show = () => { const t = (v - min) / (max - min), a = -135 + t * 270, zero = min < 0 && max > 0 ? -135 + ((0 - min) / (max - min)) * 270 : -135; arc.setAttribute('d', describeArc(Math.min(a, zero), Math.max(a, zero))); const r = (a - 90) * Math.PI / 180; ptr.setAttribute('x1', 24 + Math.cos(r) * 5); ptr.setAttribute('y1', 24 + Math.sin(r) * 5); ptr.setAttribute('x2', 24 + Math.cos(r) * 14); ptr.setAttribute('y2', 24 + Math.sin(r) * 14); const txt = (fmtv ? fmtv(v) : (Math.round(v * 10) / 10).toLocaleString('pt-BR')) + (unit ? ' ' + unit : ''); val.textContent = txt; el.setAttribute('aria-valuenow', v); el.setAttribute('aria-valuetext', txt); };
  const set = (nv, fire) => { nv = clamp(Math.round(nv / step) * step, min, max); if (nv === v) return; v = nv; show(); if (fire) onInput(v); };
  let y0 = 0, v0 = 0, lastTap = 0;
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); y0 = e.clientY; v0 = v; const t = performance.now(); if (t - lastTap < 320) set(d0, true); lastTap = t; el.focus({ preventScroll: true }); });
  el.addEventListener('pointermove', (e) => { if (!el.hasPointerCapture(e.pointerId)) return; set(v0 + ((y0 - e.clientY) / 140) * (max - min), true); });
  el.addEventListener('keydown', (e) => { const k = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5 }[e.key]; if (k) { e.preventDefault(); set(v + k * step, true); } else if (e.key === 'Home') set(min, true); else if (e.key === 'End') set(max, true); });
  el.set = (nv) => { v = clamp(nv, min, max); show(); }; el.get = () => v; show();
  return el;
}
function s2(tag, attrs, ...kids) { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v); e.append(...kids); return e; }
function describeArc(a0, a1) { const p = (a) => { const r = (a - 90) * Math.PI / 180; return [24 + Math.cos(r) * 20, 24 + Math.sin(r) * 20]; }; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${x0.toFixed(2)} ${y0.toFixed(2)}A20 20 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`; }

/** Fader vertical em dB (−60 a +10), com medidor ao lado. .setMeter(dB pico, dB rms) */
export function vfader(label, value, onInput, { min = -60, max = 10, height = 180 } = {}) {
  let v = value; const thumb = h('div.fthumb'), fill = h('i'), pk = h('b');
  const track = h('div.ftrack', h('div.fmeter', fill, pk), h('div.fline'), thumb), val = h('span.kv');
  const el = h('div.vfader', { role: 'slider', tabindex: 0, 'aria-label': label, 'aria-orientation': 'vertical', 'aria-valuemin': min, 'aria-valuemax': max, style: { '--fh': height + 'px' } }, track, val);
  // escala: 0 dB a 75% do curso, como em mesas reais
  const toPos = (d) => (d >= 0 ? 0.75 + (d / max) * 0.25 : d <= -60 ? 0 : 0.75 * Math.pow((d + 60) / 60, 1.6)), toDb = (p) => (p >= 0.75 ? ((p - 0.75) / 0.25) * max : p <= 0.005 ? -60 : -60 + 60 * Math.pow(p / 0.75, 1 / 1.6));
  const show = () => { thumb.style.bottom = `calc(${toPos(v) * 100}% - 11px)`; const txt = v <= -60 ? '−∞' : `${v > 0 ? '+' : ''}${(Math.round(v * 10) / 10).toLocaleString('pt-BR')} dB`; val.textContent = txt; el.setAttribute('aria-valuenow', Math.round(v)); el.setAttribute('aria-valuetext', txt); };
  const set = (nv, fire) => { nv = clamp(Math.round(nv * 2) / 2, min, max); if (nv === v) return; v = nv; show(); if (fire) onInput(v); };
  const at = (e) => { const r = track.getBoundingClientRect(); set(toDb(clamp(1 - (e.clientY - r.top) / r.height, 0, 1)), true); };
  let lastTap = 0;
  track.addEventListener('pointerdown', (e) => { e.preventDefault(); track.setPointerCapture(e.pointerId); const t = performance.now(); if (t - lastTap < 320) set(0, true); else at(e); lastTap = t; });
  track.addEventListener('pointermove', (e) => { if (track.hasPointerCapture(e.pointerId)) at(e); });
  el.addEventListener('keydown', (e) => { const k = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 6, PageDown: -6 }[e.key]; if (k) { e.preventDefault(); set(v + k, true); } });
  el.set = (nv) => { v = clamp(nv, min, max); show(); }; el.get = () => v;
  el.setMeter = (peak, rms) => { fill.style.height = clamp((rms + 60) / 66, 0, 1) * 100 + '%'; pk.style.bottom = clamp((peak + 60) / 66, 0, 1) * 100 + '%'; pk.style.background = peak >= -0.3 ? '#f06a98' : '#f4ecdc'; };
  show(); return el;
}
