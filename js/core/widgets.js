// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Componentes compartilhados: teclado colorido por voz, botões de voz, mapa das vozes, traço de altura.

import { h, canvas, clamp } from './ui.js';
import { VOICE_COLORS, VOICE_NAMES, pcName, noteName, pc, freqToMidi } from '../music/theory.js';

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
  const idx = (i) => (n === 6 ? i : Math.round((i / Math.max(1, n - 1)) * 5));
  const paint = () => [...box.children].forEach((b, k) => {
    if (k >= n) { b.setAttribute('aria-pressed', String(state.solo != null)); return; }
    const i = n - 1 - k; const muted = state.solo != null ? state.solo !== i : !!state.mute[i];
    b.setAttribute('aria-pressed', String(!muted)); b.classList.toggle('muted-v', muted);
    b.setAttribute('aria-label', `${(names || VOICE_NAMES)[idx(i)]}: ${muted ? 'em silêncio' : 'soando'}`);
  });
  for (let i = n - 1; i >= 0; i--) {
    let timer = 0, long = false;
    const b = h('button.chip.v', { type: 'button', css: { '--c': VOICE_COLORS[idx(i)] } }, (names || VOICE_NAMES)[idx(i)]);
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
  const col = (v, n) => (colors || VOICE_COLORS)[n === 6 ? v : Math.round((v / Math.max(1, n - 1)) * 5)];
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
