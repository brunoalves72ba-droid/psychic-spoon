// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Retrato vocal: teste guiado de uns três minutos que junta todas as medidas e grava uma escala curta.
import { h, top, fmt, toast } from '../core/ui.js';
import { kv, log, saveRecording, lastEvent } from '../core/store.js';
import { TASKS, taskUI } from '../core/voice-tasks.js';
import { DISCLAIMER } from './voz-registro.js';
import { noteName } from '../music/theory.js';

export default async function retrato(el) {
  const R = {}; let i = -1, cur = null;
  const last = await lastEvent('portrait');
  const body = h('section.card.col'), stepsEl = h('div.seg'), nextBtn = h('button.btn.primary.block.hide', 'Próxima etapa'), skipBtn = h('button.btn.ghost.block.hide', 'Pular esta etapa');
  const mid = () => (R.extensao ? Math.round(R.extensao.lo + (R.extensao.hi - R.extensao.lo) * 0.6) : 60);
  const PLAN = [
    ['Extensão', () => TASKS.extensao()], ['Sirene', () => TASKS.sirene()], ['Nota longa', () => TASKS.sustentada(R.extensao ? Math.round(R.extensao.tess.center) : null)],
    ['Peito', () => TASKS.calibra('chest', mid())], ['Cabeça', () => TASKS.calibra('head', mid())], ['Fonação', () => TASKS.fonacao()], ['“sss”', () => TASKS.sss()],
    ['Escala', () => TASKS.escala(R.extensao ? Math.max(R.extensao.lo + 3, Math.round(R.extensao.tess.center) - 4) : 55)],
  ];
  const paintSteps = () => stepsEl.replaceChildren(...PLAN.map(([n], k) => h('span.pill', { style: { opacity: k === i ? 1 : 0.5, background: k < i ? 'var(--v0)' : '', color: k < i ? '#0e2030' : '' } }, `${k + 1}. ${n}`)));
  const step = () => {
    i++; if (cur) cur.cancel(); nextBtn.classList.add('hide');
    if (i >= PLAN.length) return finish();
    paintSteps(); const def = PLAN[i][1](); skipBtn.classList.remove('hide');
    cur = taskUI(def, { onResult: (r) => { if (r) { R[def.id] = r; nextBtn.textContent = i === PLAN.length - 1 ? 'Ver o retrato' : 'Próxima etapa'; nextBtn.classList.remove('hide'); } } });
    body.replaceChildren(h('div.eyebrow', `Etapa ${i + 1} de ${PLAN.length}`), cur.el);
  };
  const finish = async () => {
    skipBtn.classList.add('hide'); paintSteps();
    const x = R.extensao, data = { range: x ? { lo: x.lo, hi: x.hi } : null, tess: x ? { lo: x.tess.lo, hi: x.tess.hi, center: Math.round(x.tess.center * 10) / 10, hist: x.hist } : null, types: x ? x.types : [],
      passaggi: R.sirene ? R.sirene.points : [], vibrato: R.sustentada ? { rate: Math.round(R.sustentada.rate * 10) / 10, extent: Math.round(R.sustentada.extent), stability: Math.round(R.sustentada.stability * 10) / 10, has: R.sustentada.hasVibrato } : null,
      cal: R['calibra-chest'] && R['calibra-head'] ? { chest: R['calibra-chest'], head: R['calibra-head'] } : null, mpt: R.fonacao ? R.fonacao.seconds : null, sss: R.sss ? R.sss.seconds : null, scaleCents: R.escala ? R.escala.cents : null, recId: null };
    if (R.escala && R.escala.rec && R.escala.rec.pcm.length > 1000) data.recId = await saveRecording({ name: `Retrato vocal · ${new Date().toLocaleDateString('pt-BR')}`, kind: 'retrato', sampleRate: R.escala.rec.sampleRate, pcm: R.escala.rec.pcm });
    const done = Object.values(data).filter((v) => v != null && !(Array.isArray(v) && !v.length)).length;
    if (done < 2) { body.replaceChildren(h('h3', 'Retrato incompleto'), h('p', 'Quase todas as etapas foram puladas, então não há o que salvar.'), h('button.btn.primary', { onclick: () => { i = -1; step(); } }, 'Recomeçar')); return; }
    await log('portrait', data);
    if (data.range) { await log('range', data.range); await log('tessitura', data.tess); await kv.set('voice', { lo: data.range.lo, hi: data.range.hi, tess: [data.tess.lo, data.tess.hi], types: data.types }); }
    if (data.passaggi.length) await log('passaggio', { points: data.passaggi });
    if (data.vibrato) await log('vibrato', data.vibrato);
    if (data.cal) { await kv.set('regcal', data.cal); await log('register', data.cal); }
    if (data.mpt) await log('mpt', { seconds: data.mpt });
    if (data.sss) await log('breath', { kind: 'sss', seconds: data.sss });
    if (data.scaleCents != null) await log('pitch', { source: 'retrato', cents: data.scaleCents });
    if (data.recId) await log('recording', { recId: data.recId, kind: 'retrato' });
    toast('Retrato vocal salvo na Evolução.');
    const row = (k, v) => h('div.row.between', h('span.dim', k), h('b.num', v));
    body.replaceChildren(h('h2', 'Seu retrato vocal'), h('div.col',
      row('Extensão', data.range ? `${noteName(data.range.lo)} a ${noteName(data.range.hi)} (${data.range.hi - data.range.lo} semitons)` : '—'),
      row('Tessitura', data.tess ? `${noteName(data.tess.lo)} a ${noteName(data.tess.hi)}` : '—'),
      row('Classificação aproximada', data.types.length ? data.types.join(' ou ') : '—'),
      row('Passagens', data.passaggi.length ? data.passaggi.map((p) => noteName(p.m)).join(', ') : 'sem quebra detectada'),
      row('Vibrato', data.vibrato ? (data.vibrato.has ? `${fmt(data.vibrato.rate, 1)} Hz, ±${data.vibrato.extent} cents` : 'nota reta') : '—'),
      row('Estabilidade', data.vibrato ? `${fmt(data.vibrato.stability, 1)} cents` : '—'),
      row('Registro', data.cal ? 'calibrado com peito e cabeça' : 'sem calibração'),
      row('Fonação máxima', data.mpt ? `${fmt(data.mpt, 1)} s` : '—'), row('“sss”', data.sss ? `${fmt(data.sss, 1)} s` : '—'),
      row('Afinação na escala', data.scaleCents != null ? `${data.scaleCents} cents` : '—'), row('Gravação', data.recId ? 'escala salva' : '—')),
      h('p.small.muted', 'A classificação é aproximada: timbre e passagem também contam. ' + DISCLAIMER),
      h('p', 'Repita daqui a 30 dias e compare os dois retratos lado a lado.'),
      h('div.row.wrap', h('a.btn.primary', { href: '#/evolucao/comparar' }, 'Comparar retratos'), h('a.btn', { href: '#/evolucao' }, 'Ver a Evolução')));
  };
  nextBtn.onclick = step; skipBtn.onclick = step;
  body.append(h('h2', 'Como funciona'), h('p', 'São oito etapas curtas, uns três minutos no total. Fique em um lugar silencioso, de pé, com o celular a um palmo da boca.'),
    h('div.banner', h('span', '🎧'), h('span', h('b', 'Use fones. '), 'Em algumas etapas o piano toca uma nota de referência enquanto o microfone escuta.')),
    last ? h('p.small.muted', `Seu último retrato foi em ${new Date(last.ts).toLocaleDateString('pt-BR')}.`) : null,
    h('p.small.muted', DISCLAIMER), h('button.btn.primary.block', { onclick: step }, 'Começar o retrato'));
  el.append(top('Retrato vocal', '#/voz'), stepsEl, body, nextBtn, skipBtn);
  return () => { cur && cur.cancel(); };
}
