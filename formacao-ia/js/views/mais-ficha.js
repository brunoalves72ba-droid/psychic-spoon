// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Ficha viva: modelos, cotas, preços e regras que mudam rápido, com a data da última conferência.
import { h, top, clear, fmtDia, toast } from '../core/ui.js';
import { S, salvar } from '../core/estado.js';
import { hoje, diffDays } from '../core/dia.js';
import { FICHA, VERIFICADO, REVISAR_DIAS } from '../data/ficha.js';

export default async function (el) {
  const d = hoje();
  const corpo = h('div.col.gap-l');
  el.append(top('Ficha viva', '#/progresso'), h('p.dim', 'O que mais envelhece no curso. Os textos foram conferidos em novembro de 2026; confira de novo a cada trimestre, antes de usar um número num trabalho.'), corpo);
  const pintar = () => {
    clear(corpo);
    const datas = FICHA.map((f) => (S.fichaViva[f.id] && S.fichaViva[f.id].conferido) || VERIFICADO);
    const velhos = datas.filter((x) => diffDays(d, x) > REVISAR_DIAS).length;
    if (velhos) corpo.append(h('div.banner.quase', `${velhos} ${velhos === 1 ? 'item passou' : 'itens passaram'} de 3 meses sem conferência. Abra o link oficial e confira.`));
    const grupos = [...new Set(FICHA.map((f) => f.g))];
    for (const g of grupos) {
      corpo.append(h('h3', g));
      for (const f of FICHA.filter((x) => x.g === g)) {
        const st = S.fichaViva[f.id] || {};
        const data = st.conferido || VERIFICADO;
        const nota = h('textarea', { rows: 2, placeholder: 'O que mudou? (opcional)', value: st.nota || '', maxLength: 600, 'aria-label': `Nota sobre ${f.t}` });
        corpo.append(h('section.card.flat.col', h('div.row.between.top-al', h('b', f.t), h('span.tag' + (diffDays(d, data) > REVISAR_DIAS ? '' : '.ok'), `conferido em ${fmtDia(data)}`)),
          h('p.small', f.d), st.nota ? h('div.callout.aviso', h('span.rot', 'Sua nota'), st.nota) : null,
          h('div.row.wrap', h('a.btn.small', { href: f.u, target: '_blank', rel: 'noopener noreferrer' }, 'Fonte oficial ↗'),
            h('button.btn.small', { type: 'button', onclick: () => { S.fichaViva[f.id] = { conferido: d, nota: nota.value.trim() }; salvar('fichaViva'); toast('Marcado como conferido hoje.'); pintar(); } }, 'Conferi hoje')),
          h('details', h('summary', { style: { minHeight: '44px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '.9rem' } }, 'Anotar uma mudança'), nota)));
      }
    }
  };
  pintar();
}
