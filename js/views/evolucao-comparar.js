// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Comparação lado a lado de dois retratos vocais, com A/B das gravações.
import { h, top, canvas, fmt, fmtDate } from '../core/ui.js';
import { events, getRecordingPcm, getRecordingMeta } from '../core/store.js';
import { drawPianoHeat } from '../core/voice-tasks.js';
import { playPcm, unlock, stopAll } from '../audio/engine.js';
import { noteName } from '../music/theory.js';

export default async function comparar(el) {
  const ps = await events('portrait');
  el.append(top('Comparar retratos', '#/evolucao'));
  if (ps.length < 2) { el.append(h('div.card.col', h('h3', ps.length ? 'Você tem um retrato' : 'Nenhum retrato ainda'), h('p', 'A comparação precisa de dois retratos vocais. Faça um agora e outro daqui a 30 dias.'), h('a.btn.primary', { href: '#/voz/retrato' }, 'Fazer o Retrato vocal'))); return; }
  let a = ps[0], b = ps[ps.length - 1];
  const body = h('div.col');
  const sel = (cur, on) => h('select', { onchange: (e) => on(ps.find((p) => p.id === +e.target.value)) }, ps.map((p) => h('option', { value: p.id, selected: p === cur }, fmtDate(p.ts))));
  const heat = (p) => { const c = canvas(260); const draw = () => { const { g, w, h: hh } = c._fit(); g.clearRect(0, 0, w, hh); if (p.data.range) drawPianoHeat(g, w, hh, { hist: p.data.tess.hist, lo: p.data.range.lo, hi: p.data.range.hi, tess: p.data.tess, marks: (p.data.passaggi || []).map((x) => ({ m: x.m })) }); }; requestAnimationFrame(() => requestAnimationFrame(draw)); return h('div.stage', c); };
  const paint = () => {
    const A = a.data, B = b.data;
    const row = (label, fa, fb, delta) => h('div', { style: { display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '6px', alignItems: 'baseline', padding: '6px 0', borderBottom: '1px solid var(--line)' } }, h('span.small.dim', label), h('span.num', fa), h('span.num', fb, delta ? h('span.small', { style: { color: delta.good ? 'var(--ok)' : 'var(--ink3)', marginLeft: '6px' } }, delta.text) : null));
    const d = (x, y, unit, higherBetter = true, dig = 0) => (x == null || y == null ? null : { text: `${y - x > 0 ? '+' : ''}${fmt(y - x, dig)}${unit}`, good: higherBetter ? y > x : y < x });
    const span = (r) => (r ? r.hi - r.lo : null), rng = (r) => (r ? `${noteName(r.lo)}–${noteName(r.hi)}` : '—');
    let playing = null;
    const ab = (p, tag) => h('button.btn.grow', { disabled: !p.data.recId, onclick: async (e) => { await unlock(); stopAll(); if (playing === tag) { playing = null; return; } const pcm = await getRecordingPcm(p.data.recId), meta = await getRecordingMeta(p.data.recId); if (!pcm) { e.target.textContent = `${tag}: gravação apagada`; return; } playing = tag; playPcm(pcm, meta.sampleRate, { onEnd: () => { if (playing === tag) playing = null; } }); } }, p.data.recId ? `▶ ${tag} · ${fmtDate(p.ts)}` : `${tag}: sem gravação`);
    body.replaceChildren(
      h('section.card', row('', h('b', 'A'), h('b', 'B')),
        row('Extensão', rng(A.range), rng(B.range), d(span(A.range), span(B.range), ' st')),
        row('Tessitura', rng(A.tess), rng(B.tess), d(span(A.tess), span(B.tess), ' st')),
        row('Classificação', (A.types || [])[0] || '—', (B.types || [])[0] || '—'),
        row('Passagens', (A.passaggi || []).map((p) => noteName(p.m)).join(', ') || '—', (B.passaggi || []).map((p) => noteName(p.m)).join(', ') || '—'),
        row('Vibrato', A.vibrato && A.vibrato.has ? `${fmt(A.vibrato.rate, 1)} Hz` : 'reta/—', B.vibrato && B.vibrato.has ? `${fmt(B.vibrato.rate, 1)} Hz` : 'reta/—'),
        row('Estabilidade', A.vibrato ? `${fmt(A.vibrato.stability, 1)} c` : '—', B.vibrato ? `${fmt(B.vibrato.stability, 1)} c` : '—', d(A.vibrato && A.vibrato.stability, B.vibrato && B.vibrato.stability, ' c', false, 1)),
        row('Fonação', A.mpt ? `${fmt(A.mpt, 1)} s` : '—', B.mpt ? `${fmt(B.mpt, 1)} s` : '—', d(A.mpt, B.mpt, ' s', true, 1)),
        row('“sss”', A.sss ? `${fmt(A.sss, 1)} s` : '—', B.sss ? `${fmt(B.sss, 1)} s` : '—', d(A.sss, B.sss, ' s', true, 1)),
        row('Afinação na escala', A.scaleCents != null ? `${A.scaleCents} c` : '—', B.scaleCents != null ? `${B.scaleCents} c` : '—', d(A.scaleCents, B.scaleCents, ' c', false))),
      h('h3', 'Tessitura lado a lado'), h('div.grid2', heat(a), heat(b)),
      h('h3', 'A/B das gravações'), h('p.small.muted', 'A mesma escala curta, gravada nos dois retratos. Alterne e ouça a diferença.'), h('div.row', ab(a, 'A'), ab(b, 'B')),
      h('p.small.muted', 'st = semitons; c = cents. Verde indica melhora. São estimativas acústicas, não um exame.'));
  };
  paint();
  el.append(h('div.grid2', h('label.field', 'Retrato A', sel(a, (p) => { a = p; paint(); })), h('label.field', 'Retrato B', sel(b, (p) => { b = p; paint(); }))), body);
  return () => stopAll();
}
