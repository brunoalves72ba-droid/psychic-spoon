// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Evolução: painel com tudo o que foi medido, gráficos, calendário e marcos.
import { h, fmt, fmtDate } from '../core/ui.js';
import { events, practice, streak, listRecordings } from '../core/store.js';
import { lineChart, rangeChart, barChart, calendar } from '../core/charts.js';
import { milestones } from '../audio/voice-analysis.js';
import { KINDS } from '../music/ear.js';
import { VOICE_COLORS, noteName } from '../music/theory.js';

export default async function evolucao(el) {
  const [all, prac, recs] = await Promise.all([events(), practice(), listRecordings()]);
  const by = (t) => all.filter((e) => e.type === t);
  const weekAgo = Date.now() - 7 * 86400000; const dk = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const secs = { harmonia: 0, voz: 0, estudio: 0 }; let total = 0;
  for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate() - i); const o = prac[dk(d)] || {}; for (const k of Object.keys(o)) { if (k in secs) secs[k] += o[k]; total += o[k]; } }
  const lessons = new Set(by('lesson').map((e) => e.data.id)).size;
  const tessBy = new Map(by('tessitura').map((e) => [e.ts, e.data]));
  const ranges = by('range').map((e) => { let t = null; for (const [ts, d] of tessBy) if (Math.abs(ts - e.ts) < 5000) t = [d.lo, d.hi]; return { ts: e.ts, lo: e.data.lo, hi: e.data.hi, tess: t }; }).slice(-10);
  const pitchPts = (src) => all.filter((e) => (e.type === 'pitch' || e.type === 'sing') && e.data.cents != null && src(e)).map((e) => ({ ts: e.ts, v: e.data.cents }));
  const ear = KINDS.map((k, i) => { const l = by('ear').filter((e) => e.data.kind === k.id).slice(-5); if (!l.length) return null; const ok = l.reduce((a, e) => a + e.data.ok, 0), tot = l.reduce((a, e) => a + e.data.total, 0); return { label: k.name, v: ok / tot, text: `${Math.round(100 * ok / tot)}% · nível ${l[l.length - 1].data.level}`, color: VOICE_COLORS[i % 6] }; }).filter(Boolean);
  const ms = milestones(all).reverse();
  const lastPortrait = by('portrait').pop(); const pDays = lastPortrait ? Math.floor((Date.now() - lastPortrait.ts) / 86400000) : null;
  const lastVib = by('vibrato').pop(), lastPas = by('passaggio').pop(), lastSing = all.filter((e) => e.type === 'sing' && e.data.points != null).pop();
  const card = (title, sub, chart, extra) => h('section.card.col', h('h3', title), sub ? h('p.small.muted', sub) : null, chart, extra || null);
  void weekAgo;
  el.append(
    h('header', h('div.eyebrow', 'Evolução'), h('h1', 'O que mudou na sua voz')),
    h('section.stats', h('div.stat', h('b', String(streak(prac))), h('span', 'dias seguidos')), h('div.stat', h('b', fmt(total / 60)), h('span', 'minutos em 7 dias')), h('div.stat', h('b', `${lessons}/16`), h('span', 'aulas concluídas'))),
    pDays == null || pDays >= 30 ? h('a.banner', { href: '#/voz/retrato', style: { textDecoration: 'none', color: 'inherit' } }, h('span', '◎'), h('span', h('b', pDays == null ? 'Faça o seu primeiro Retrato vocal. ' : `Faz ${pDays} dias desde o último retrato. `), 'Três minutos, e você passa a ter um antes e depois.')) : null,
    card('Calendário de prática', `Últimas 15 semanas. Esta semana: harmonia ${fmt(secs.harmonia / 60)} min, voz ${fmt(secs.voz / 60)} min, estúdio ${fmt(secs.estudio / 60)} min.`, calendar(prac)),
    card('Extensão', 'Cada barra é uma medida: azul é a extensão, amarelo é a tessitura.', rangeChart(ranges), lastPas && lastPas.data.points.length ? h('p.small', `Passagem medida: ${lastPas.data.points.map((p) => noteName(p.m)).join(', ')}.`) : null),
    card('Afinação', 'Desvio médio em cents. Quanto mais baixo, melhor.', lineChart([{ label: 'Afinação', color: VOICE_COLORS[1], points: pitchPts((e) => e.type === 'pitch') }, { label: 'Cantando harmonia', color: VOICE_COLORS[3], points: pitchPts((e) => e.type === 'sing') }], { unit: 'cents', emptyMsg: 'Faça “Cante a nota”, uma aula ou\n“Cante a sua voz” para começar.' }), lastSing ? h('p.small', `Última pontuação no “Cante a sua voz”: ${lastSing.data.points} pontos.`) : null),
    card('Fôlego', 'Tempo máximo de “sss” e de fonação, em segundos.', lineChart([{ label: '“sss”', color: VOICE_COLORS[0], points: by('breath').filter((e) => e.data.seconds).map((e) => ({ ts: e.ts, v: e.data.seconds })) }, { label: 'Fonação', color: VOICE_COLORS[4], points: by('mpt').map((e) => ({ ts: e.ts, v: e.data.seconds })) }], { unit: 's', digits: 1, emptyMsg: 'Faça o teste de “sss” em Voz › Respiração.' })),
    card('Ouvido', 'Acertos nas últimas cinco rodadas de cada tipo.', barChart(ear, { emptyMsg: 'Jogue uma rodada de Ouvido.' })),
    lastVib ? card('Vibrato e estabilidade', null, h('div.stats', h('div.stat', h('b', lastVib.data.has ? `${fmt(lastVib.data.rate, 1)} Hz` : 'reta'), h('span', 'taxa')), h('div.stat', h('b', lastVib.data.has ? `±${lastVib.data.extent}` : '—'), h('span', 'cents')), h('div.stat', h('b', fmt(lastVib.data.stability, 1)), h('span', 'estabilidade')))) : null,
    card('Marcos', ms.length ? null : 'Os marcos aparecem aqui quando acontecem de verdade.', h('div.list', ms.map((m) => h('div.row', h('span.dot', { css: { '--c': 'var(--v5)' } }), h('span.grow', m.title), h('span.small.muted', fmtDate(m.ts)))))),
    h('section.tools', h('a.tool', { href: '#/evolucao/comparar', css: { '--c': 'var(--v2)' } }, h('b', 'Comparar retratos'), h('span', 'Lado a lado, com A/B das gravações')), h('a.tool', { href: '#/evolucao/backup', css: { '--c': 'var(--v0)' } }, h('b', 'Dados e backup'), h('span', `${recs.length} ${recs.length === 1 ? 'gravação' : 'gravações'} · exportar e importar`))),
  );
}
