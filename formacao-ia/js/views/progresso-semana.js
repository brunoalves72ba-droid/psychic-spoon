// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Revisão da semana: 3 vitórias, 1 dificuldade e o plano em 3 linhas. E o desafio surpresa da quinzena.
import { h, top, toast, fmtDia, plural } from '../core/ui.js';
import { S, salvar, ganhar, tocarDia, XP } from '../core/estado.js';
import { hoje, weekStart } from '../core/dia.js';
import { semanaAtual, META } from '../core/sequencia.js';
import { desafioDaVez } from '../data/desafios.js';
import { verificarConquistas } from '../core/conquistas.js';

export default async function (el) {
  const d = hoje(); const sem = weekStart(d);
  const ja = S.semanais.find((x) => x.semana === sem);
  const s = semanaAtual(S.dias, d);
  const lic = Object.values(S.licoes).filter((x) => x.feita && weekStart(x.feita) === sem).length;
  const campo = (rot, ph, v) => { const t = h('input.inp', { type: 'text', placeholder: ph, value: v || '', maxLength: 200, 'aria-label': rot }); return t; };
  const vit = [0, 1, 2].map((i) => campo(`Vitória ${i + 1}`, ['Ex.: terminei o Módulo 1', 'Ex.: fiz a primeira chamada de API', 'Ex.: estudei 4 dias'][i], ja && ja.v[i]));
  const dif = campo('Dificuldade', 'Ex.: travei no JSON', ja && ja.d);
  const plano = [0, 1, 2].map((i) => campo(`Plano ${i + 1}`, ['Ex.: terça, lição 3.4', 'Ex.: quinta, missão da chave de API', 'Ex.: domingo, revisão misturada'][i], ja && ja.p[i]));
  el.append(top('Revisão da semana', '#/progresso'),
    h('div.card.flat', h('div.stats', h('div.stat', h('b', `${s.feitos}/${META}`), h('span', 'dias de estudo')), h('div.stat', h('b', String(lic)), h('span', 'lições novas')), h('div.stat', h('b', String(S.semana.gelos)), h('span', 'congelamentos guardados')))),
    h('p.small.dim', 'Dez minutos, de preferência no domingo. Olhar para trás e planejar à frente é o que transforma estudo em hábito.'),
    h('section.card.flat.col', h('h3', '3 vitórias da semana'), ...vit),
    h('section.card.flat.col', h('h3', '1 dificuldade'), dif),
    h('section.card.flat.col', h('h3', 'Plano da próxima semana, em 3 linhas'), ...plano),
    h('button.btn.primary.block', { type: 'button', onclick: () => {
      const v = vit.map((x) => x.value.trim()); const p = plano.map((x) => x.value.trim());
      if (v.filter(Boolean).length < 1 || p.filter(Boolean).length < 1) { toast('Escreva pelo menos uma vitória e uma linha de plano.'); return; }
      const reg = { semana: sem, dia: d, v, d: dif.value.trim(), p };
      const i = S.semanais.findIndex((x) => x.semana === sem);
      let g = 0;
      if (i >= 0) S.semanais[i] = reg; else { S.semanais.unshift(reg); g = ganhar(XP.semanal); tocarDia('p'); }
      salvar('semanais'); toast(g ? `Revisão guardada. +${g} XP` : 'Revisão atualizada.');
      for (const c of verificarConquistas()) toast(`Conquista: ${c.t}`);
      location.hash = '#/progresso';
    } }, ja ? 'Atualizar a revisão' : 'Guardar a revisão'));

  const des = desafioDaVez(S, d);
  if (des) el.append(h('section.card.dest', h('div.eyebrow', 'Desafio surpresa da quinzena'), h('p', { style: { margin: '6px 0 10px', fontWeight: '650' } }, des.t),
    h('button.btn.small', { type: 'button', onclick: (e) => { S.desafios[des.id] = d; salvar('desafios'); const g = ganhar(XP.desafio); tocarDia('p'); e.currentTarget.disabled = true; e.currentTarget.textContent = 'Feito ✓'; toast(`Desafio feito. +${g} XP`); } }, 'Fiz o desafio')));

  const antigas = S.semanais.filter((x) => x.semana !== sem);
  if (antigas.length) el.append(h('h3', `Semanas anteriores (${antigas.length})`), h('div.list', antigas.slice(0, 12).map((x) => h('details.card.flat.tight',
    h('summary', { style: { minHeight: '44px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: '650' } }, `Semana de ${fmtDia(x.semana)}`),
    h('div.small', h('b', 'Vitórias: '), x.v.filter(Boolean).join(' · ')), x.d ? h('div.small', h('b', 'Dificuldade: '), x.d) : null, h('div.small', h('b', 'Plano: '), x.p.filter(Boolean).join(' · '))))));
  if (Object.keys(S.desafios).length) el.append(h('p.small.muted', `${plural(Object.keys(S.desafios).length, 'desafio surpresa feito', 'desafios surpresa feitos')}.`));
}
