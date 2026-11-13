// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Conquistas: cada uma marca uma habilidade, não tempo de tela.
import { h, top, icon, fmtDia } from '../core/ui.js';
import { S } from '../core/estado.js';
import { CONQUISTAS, verificarConquistas } from '../core/conquistas.js';

export default async function (el) {
  verificarConquistas();
  const n = CONQUISTAS.filter((c) => S.conquistas[c.id]).length;
  el.append(top('Conquistas', '#/progresso'), h('p.dim', `${n} de ${CONQUISTAS.length}. Nenhuma depende de sequência sem falhas, e nenhuma se perde.`),
    h('div.list', CONQUISTAS.map((c) => { const d = S.conquistas[c.id]; return h('div.item' + (d ? '.done' : ''), { style: d ? null : { opacity: '.6' } },
      h('span.n', d ? icon('estrela') : '·'), h('span.t', h('b', c.t), h('span', d ? `${c.d} Em ${fmtDia(d)}.` : c.d))); })));
}
