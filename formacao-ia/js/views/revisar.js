// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Revisar: cartões espaçados (1, 3, 7 e 21 dias, com teto de 15 por dia) e revisão misturada.
import { h, icon, plural, fmt } from '../core/ui.js';
import { S, revs, filaDeHoje, vencidosHoje } from '../core/estado.js';
import { hoje, addDays, dow, DIAS } from '../core/dia.js';
import { ESCADA, TETO, previsao, retencao, resumo } from '../core/srs.js';
import { progressoGeral } from '../data/curso.js';

const pct = (r) => (r.taxa == null ? '—' : `${Math.round(r.taxa * 100)}%`);

export default async function (el) {
  const d = hoje();
  const fila = filaDeHoje();
  const venc = vencidosHoje().length;
  const res = resumo(S.cartoes);
  const feitosHoje = (S.dias[d] && S.dias[d].c) || 0;
  el.append(h('header', h('div.eyebrow', `${fmt(res.total)} cartões no baralho`), h('h1', 'Revisar')));

  if (!res.total) {
    el.append(h('section.card.flat', h('h3', 'Ainda não há cartões'), h('p.dim', 'Eles nascem sozinhos: cada lição concluída vira 2 ou 3 cartões, que voltam amanhã, depois em 3, 7 e 21 dias.'), h('a.btn.primary.block', { href: '#/hoje/comecar', style: { marginTop: '10px' } }, 'Fazer a primeira lição')));
  } else if (fila.length) {
    el.append(h('section.card.dest',
      h('div.eyebrow', 'Para hoje'), h('div.big', { style: { margin: '6px 0' } }, String(fila.length)),
      h('p.small.dim', `${fila.length === 1 ? 'cartão' : 'cartões'}, cerca de ${Math.max(1, Math.round(fila.length * 0.4))} min.${venc > fila.length ? ` Os outros ${venc - fila.length} ficam para os próximos dias: o teto diário é ${TETO}.` : ''}`),
      h('a.btn.primary.big.block', { href: '#/revisar/cartoes' }, icon('play'), 'Revisar agora')));
  } else {
    const prox = previsao(S.cartoes, d, 7);
    const k = prox.findIndex((n) => n > 0);
    el.append(h('section.card.flat', h('div.row', icon('check'), h('h3', { style: { margin: 0 } }, feitosHoje >= TETO && venc ? 'Teto de hoje atingido' : 'Revisão em dia')),
      h('p.dim', { style: { marginTop: '6px' } }, feitosHoje >= TETO && venc ? `Você respondeu ${feitosHoje} cartões hoje. Os ${venc} restantes esperam sem problema.` : k < 0 ? 'Nenhum cartão vence nos próximos 7 dias.' : `Os próximos ${plural(prox[k], 'cartão vence', 'cartões vencem')} ${k === 0 ? 'amanhã' : `em ${k + 1} dias`}.`),
      venc ? h('a.btn.small', { href: '#/revisar/cartoes/mais', style: { marginTop: '8px' } }, 'Estou no embalo: mais 5') : null));
  }

  if (res.total) {
    const r7 = retencao(revs, 7), r21 = retencao(revs, 21);
    el.append(h('section.card.flat', h('div.eyebrow', 'Quanto fica na memória'),
      h('div.stats.two', { style: { marginTop: '10px' } },
        h('div.stat', h('b', pct(r7)), h('span', `depois de 7 dias${r7.n ? ` (${plural(r7.n, 'revisão', 'revisões')})` : ''}`)),
        h('div.stat', h('b', pct(r21)), h('span', `depois de 21 dias${r21.n ? ` (${plural(r21.n, 'revisão', 'revisões')})` : ''}`))),
      h('p.small.muted', { style: { marginTop: '10px' } }, r7.n ? 'É esta a medida que importa: quanto você lembra dias depois, e não quantos minutos passou no app.' : 'Estes números aparecem quando os primeiros cartões chegarem ao degrau de 7 dias.')));

    const prox = previsao(S.cartoes, d, 7);
    const max = Math.max(1, ...prox);
    el.append(h('section.card.flat', h('div.eyebrow', 'Próximos 7 dias'),
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '6px', alignItems: 'end', height: '84px', marginTop: '10px' }, role: 'img', 'aria-label': 'Cartões que vencem em cada um dos próximos 7 dias: ' + prox.join(', ') },
        prox.map((n, i) => h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', height: '100%', justifyContent: 'flex-end' } },
          h('span.small.num', n ? String(n) : ''), h('i', { style: { display: 'block', width: '100%', height: `${Math.max(4, Math.round((n / max) * 48))}px`, borderRadius: '5px', background: n ? 'var(--acao)' : 'var(--bg3)' } }), h('span.small.muted', DIAS[dow(addDays(d, i + 1))])))),
      h('p.small.muted', { style: { marginTop: '8px' } }, `Escada: ${ESCADA.join(' → ')} dias. Errou? O cartão volta amanhã, sem perder nada. ${res.firmes ? `${plural(res.firmes, 'cartão já está', 'cartões já estão')} no degrau de 21 dias ou acima.` : ''}`)));
  }

  const lic = progressoGeral(S.licoes).feitas;
  el.append(h('div.list',
    h('a.item', { href: '#/revisar/mistura' }, h('span.n', '⇄'), h('span.t', h('b', 'Revisão misturada'), h('span', lic >= 4 ? 'Perguntas de módulos diferentes, embaralhadas. Uma vez por semana basta.' : 'Abre depois de 4 lições concluídas.')), h('span.chev', '›')),
    h('a.item', { href: '#/revisar/importar' }, h('span.n', '+'), h('span.t', h('b', 'Importar cartões'), h('span', `JSON ou CSV, inclusive os que o seu APE-IA gerar.${S.meus.length ? ` ${plural(S.meus.length, 'importado', 'importados')}.` : ''}`)), h('span.chev', '›'))));
}
