// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Gráficos da Evolução, desenhados em Canvas.
import { canvas, fmt } from './ui.js';
import { noteName, pc } from '../music/theory.js';

const INK = '#f4ecdc', DIM = 'rgba(244,236,220,.45)', GRID = 'rgba(244,236,220,.1)';
const dShort = (ts) => new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
function frame(c, draw) { c.draw = () => { const { g, w, h } = c._fit(); g.clearRect(0, 0, w, h); g.font = '11px Figtree, sans-serif'; draw(g, w, h); }; const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => c.isConnected && c.draw()) : null; ro && ro.observe(c); requestAnimationFrame(() => requestAnimationFrame(() => c.isConnected && c.draw())); return c; }
const empty = (g, w, h, msg) => { g.fillStyle = DIM; g.font = '13px Figtree, sans-serif'; const lines = msg.split('\n'); lines.forEach((l, i) => g.fillText(l, 12, h / 2 + i * 18 - (lines.length - 1) * 9)); };

/** Linhas no tempo. series: [{label, color, points:[{ts, v}]}]. */
export function lineChart(series, { height = 170, unit = '', emptyMsg = 'Ainda sem dados.', min0 = true, digits = 0 } = {}) {
  return frame(canvas(height), (g, w, h) => {
    const all = series.flatMap((s) => s.points); if (!all.length) return empty(g, w, h, emptyMsg);
    const L = 34, R = 12, T = 12 + 15 * series.length, B = 22; const t0 = Math.min(...all.map((p) => p.ts)), t1 = Math.max(...all.map((p) => p.ts));
    let v1 = Math.max(...all.map((p) => p.v)) * 1.12 || 1, v0 = min0 ? 0 : Math.min(...all.map((p) => p.v)) * 0.9;
    const X = (ts) => (t1 === t0 ? (L + w - R) / 2 : L + ((ts - t0) / (t1 - t0)) * (w - L - R)), Y = (v) => h - B - ((v - v0) / (v1 - v0)) * (h - T - B);
    for (let k = 0; k <= 3; k++) { const v = v0 + ((v1 - v0) * k) / 3; g.strokeStyle = GRID; g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(w - R, Y(v)); g.stroke(); g.fillStyle = DIM; g.fillText(fmt(v, digits), 2, Y(v) + 4); }
    g.fillStyle = DIM; g.fillText(dShort(t0), L, h - 6); if (t1 !== t0) { const s = dShort(t1); g.fillText(s, w - R - g.measureText(s).width, h - 6); }
    series.forEach((s, si) => { if (!s.points.length) { g.fillStyle = DIM; g.fillText(`${s.label}: sem dados`, L + 4, 12 + si * 15); return; } g.strokeStyle = s.color; g.fillStyle = s.color; g.lineWidth = 2; g.lineJoin = 'round'; g.beginPath(); s.points.forEach((p, i) => (i ? g.lineTo(X(p.ts), Y(p.v)) : g.moveTo(X(p.ts), Y(p.v)))); g.stroke();
      for (const p of s.points) { g.beginPath(); g.arc(X(p.ts), Y(p.v), 3.5, 0, 7); g.fill(); }
      const lp = s.points[s.points.length - 1]; g.font = '600 11px Figtree, sans-serif'; const txt = `${s.label}: ${fmt(lp.v, digits)}${unit ? ' ' + unit : ''}`; g.fillText(txt, L + 4, 12 + si * 15); g.font = '11px Figtree, sans-serif'; });
  });
}

/** Extensão ao longo do tempo sobre um eixo de piano. items: [{ts, lo, hi, tess?:[lo,hi]}]. */
export function rangeChart(items, { height = 230 } = {}) {
  return frame(canvas(height), (g, w, h) => {
    if (!items.length) return empty(g, w, h, 'Meça a sua extensão no Medidor de registro\nou faça o Retrato vocal.');
    const L = 40, R = 10, T = 8, B = 22; const lo = Math.min(36, ...items.map((i) => i.lo)) - 1, hi = Math.max(72, ...items.map((i) => i.hi)) + 1;
    const Y = (m) => h - B - ((m - lo) / (hi - lo)) * (h - T - B), rh = (h - T - B) / (hi - lo);
    for (let m = Math.ceil(lo); m <= hi; m++) { const black = [1, 3, 6, 8, 10].includes(pc(m)); g.fillStyle = black ? '#10202e' : '#e9dfcb'; g.fillRect(0, Y(m) - rh / 2 + 0.5, black ? 16 : 24, rh - 1); if (pc(m) === 0) { g.strokeStyle = GRID; g.beginPath(); g.moveTo(26, Y(m)); g.lineTo(w - R, Y(m)); g.stroke(); g.fillStyle = DIM; g.fillText(noteName(m), 27, Y(m) - 2); } }
    const n = items.length, bw = Math.min(34, (w - L - R) / n - 6);
    items.forEach((it, i) => { const x = L + 16 + (n === 1 ? (w - L - R) / 2 - 16 : (i / (n - 1)) * (w - L - R - 32 - bw)); g.fillStyle = 'rgba(92,200,232,.55)'; g.fillRect(x, Y(it.hi) - rh / 2, bw, Y(it.lo) - Y(it.hi) + rh); if (it.tess) { g.fillStyle = '#ffd166'; g.fillRect(x, Y(it.tess[1]) - rh / 2, bw, Y(it.tess[0]) - Y(it.tess[1]) + rh); }
      if (i === 0 || i === n - 1) { g.fillStyle = INK; g.fillText(noteName(it.hi), x, Y(it.hi) - rh / 2 - 3); g.fillText(noteName(it.lo), x, Y(it.lo) + rh / 2 + 11 > h - B + 10 ? Y(it.lo) : Y(it.lo) + rh / 2 + 11); g.fillStyle = DIM; g.fillText(dShort(it.ts), Math.min(x, w - 34), h - 6); } });
  });
}

/** Barras horizontais. items: [{label, v (0..1), text, color}] */
export function barChart(items, { emptyMsg = 'Ainda sem dados.' } = {}) {
  return frame(canvas(Math.max(60, items.length * 30 + 8)), (g, w, h) => {
    if (!items.length) return empty(g, w, h, emptyMsg);
    items.forEach((it, i) => { const y = 6 + i * 30; g.fillStyle = 'rgba(244,236,220,.08)'; g.fillRect(118, y, w - 118 - 8, 18); g.fillStyle = it.color || '#5cc8e8'; g.fillRect(118, y, (w - 126) * Math.max(0.02, Math.min(1, it.v)), 18); g.fillStyle = INK; g.font = '12px Figtree, sans-serif'; g.fillText(it.label, 2, y + 13); g.fillStyle = '#0e2030'; g.font = '600 11px Figtree, sans-serif'; if (it.v > 0.25) g.fillText(it.text, 124, y + 13); else { g.fillStyle = INK; g.fillText(it.text, 124 + (w - 126) * Math.max(0.02, it.v), y + 13); } });
  });
}

/** Calendário de prática: 15 semanas, uma coluna por semana. practice: { 'AAAA-MM-DD': {secao: segundos} } */
export function calendar(practice, { weeks = 15 } = {}) {
  return frame(canvas(172), (g, w, h) => {
    const today = new Date(); today.setHours(12, 0, 0, 0); const end = new Date(today); end.setDate(end.getDate() + (6 - end.getDay()));
    const cell = Math.min(18, (w - 30) / weeks - 3), key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].forEach((l, r) => { if (r % 2) { g.fillStyle = DIM; g.fillText(l, 4, 14 + r * (cell + 3) + cell - 4); } });
    for (let c = 0; c < weeks; c++) for (let r = 0; r < 7; r++) {
      const d = new Date(end); d.setDate(end.getDate() - (weeks - 1 - c) * 7 - (6 - r)); if (d > today) continue;
      const o = practice[key(d)], min = o ? Object.values(o).reduce((a, b) => a + b, 0) / 60 : 0;
      g.fillStyle = min <= 0 ? 'rgba(244,236,220,.07)' : `rgba(88,214,160,${Math.min(1, 0.3 + min / 30)})`;
      const x = 22 + c * (cell + 3), y = 12 + r * (cell + 3); g.beginPath(); if (g.roundRect) g.roundRect(x, y, cell, cell, 4); else g.rect(x, y, cell, cell); g.fill();
      if (key(d) === key(today)) { g.strokeStyle = INK; g.lineWidth = 1.5; g.stroke(); }
    }
  });
}
