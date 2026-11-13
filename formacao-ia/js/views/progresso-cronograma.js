// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Cronograma: Plano A (≈26 semanas) ou B (≈48 semanas). Se uma semana for ruim, as datas são recalculadas, sem cobrança.
import { h, top, toast, fmtDia, clear } from '../core/ui.js';
import { S, salvar } from '../core/estado.js';
import { hoje } from '../core/dia.js';
import { PLANOS, calendario, situacao, recalcular } from '../core/plano.js';
import { MODULOS, moduloAtual, progressoModulo } from '../data/curso.js';

export default async function (el) {
  const corpo = h('div.col.gap-l');
  el.append(top('Cronograma', '#/progresso'), corpo);
  const pintar = () => {
    clear(corpo);
    const d = hoje();
    if (!S.perfil.plano) {
      corpo.append(h('p.dim', 'Escolha o ritmo. Dá para trocar depois, e as datas se ajustam sozinhas.'),
        ...Object.entries(PLANOS).map(([k, p]) => h('button.item', { type: 'button', onclick: () => { S.perfil.plano = k; S.perfil.inicio = S.perfil.inicio || d; salvar('perfil'); pintar(); } },
          h('span.n', k), h('span.t', h('b', `${p.nome}: ${p.ritmo}`), h('span', `Cerca de ${p.total} semanas. ${p.tipo}`)), h('span.chev', '›'))));
      return;
    }
    const k = S.perfil.plano, p = PLANOS[k];
    const ma = moduloAtual(S.licoes);
    const si = situacao(k, S.perfil.inicio, d, ma);
    const cal = calendario(k, S.perfil.inicio);
    corpo.append(h('div.card.flat', h('div.eyebrow', `${p.nome} · ${p.ritmo}`), h('h2', { style: { margin: '6px 0' } }, `Semana ${Math.max(1, si.semana)} de ${p.total}`),
      h('p.small.dim', `Previsão de término: ${fmtDia(si.fim, { day: '2-digit', month: 'long', year: 'numeric' })}.`), h('p.small', p.tipo)));
    if (si.atraso > 0) corpo.append(h('div.banner.info', h('div', h('p', `O calendário esperava o Módulo ${si.esperado}, e você está no ${ma}. Acontece com todo mundo.`),
      h('button.btn.small', { type: 'button', onclick: () => { S.perfil.inicio = recalcular(k, d, ma, progressoModulo(ma, S.licoes).frac); salvar('perfil'); toast('Datas recalculadas a partir de hoje.'); pintar(); } }, 'Recalcular as datas a partir de hoje'))));
    else if (si.adiantado) corpo.append(h('div.banner.ok', 'Você está adiantado em relação ao plano.'));
    corpo.append(h('div.tblwrap', h('table.tbl', h('thead', h('tr', h('th', 'Módulo'), h('th', 'Semanas'), h('th', 'Datas'))),
      h('tbody', cal.map((c) => { const m = MODULOS[c.m]; const pm = progressoModulo(c.m, S.licoes); return h('tr', { style: c.m === ma ? { background: 'var(--acao-tint)' } : null },
        h('td', h('b', `M${c.m}`), ' ', m.t, h('div.small.muted', pm.feitas === pm.total && pm.total ? 'concluído' : `${pm.feitas}/${pm.total} lições · marco: ${m.marco}`)), h('td.num', `${c.semIni}–${c.semFim}`), h('td.small', `${fmtDia(c.de)} a ${fmtDia(c.ate)}`)); })))),
      h('p.small.muted', 'A última semana de cada módulo é de respiro, para a revisão misturada. As horas são estimativas: ajuste depois de 4 semanas.'),
      h('div.row.wrap', ...Object.keys(PLANOS).filter((x) => x !== k).map((x) => h('button.btn.small', { type: 'button', onclick: () => { S.perfil.plano = x; S.perfil.inicio = recalcular(x, d, ma, progressoModulo(ma, S.licoes).frac); salvar('perfil'); toast(`Agora no ${PLANOS[x].nome}.`); pintar(); } }, `Trocar para o ${PLANOS[x].nome} (${PLANOS[x].ritmo})`))));
  };
  pintar();
}
