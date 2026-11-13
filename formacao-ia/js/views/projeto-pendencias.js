// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Práticas “mão na massa” guardadas para quando você estiver no computador.
import { h, top, rich, toast, clear } from '../core/ui.js';
import { S, pendencias, marcarMao } from '../core/estado.js';
import { licao, ORDEM } from '../data/curso.js';
import { verificarConquistas } from '../core/conquistas.js';

export default async function (el) {
  const lista = h('div.col.gap-l');
  const pintar = () => {
    clear(lista);
    const ids = pendencias().sort((a, b) => ORDEM.indexOf(a) - ORDEM.indexOf(b));
    const feitas = Object.values(S.licoes).filter((x) => x.mao === 'feito').length;
    if (!ids.length) { lista.append(h('div.banner.ok', feitas ? `Nada pendente. ${feitas} práticas feitas até aqui.` : 'Nada pendente. As práticas aparecem aqui quando você conclui uma lição que tem tarefa fora do app.')); return; }
    for (const id of ids) {
      const L = licao(id); if (!L || !L.mao) continue;
      lista.append(h('section.card.flat', h('div.eyebrow', `Lição ${id} · ${L.mao.onde === 'pc' ? 'no computador' : 'em qualquer aparelho'}`), h('h3', L.mao.t),
        h('ol.steps', L.mao.passos.map((x, i) => h('li', h('span', String(i + 1)), h('div', rich(x))))),
        h('p.small', { style: { marginTop: '10px' } }, h('b', 'Pronto quando: '), rich(L.mao.criterio)),
        h('div.row', { style: { marginTop: '10px' } }, h('button.btn.primary.grow', { type: 'button', onclick: () => { const g = marcarMao(id, 'feito'); toast(g ? `Prática feita. +${g} XP` : 'Prática feita.'); for (const c of verificarConquistas()) toast(`Conquista: ${c.t}`); pintar(); } }, 'Fiz'),
          h('a.btn', { href: `#/licao/${id}` }, 'Rever a lição'))));
    }
  };
  el.append(top('Práticas pendentes', '#/projeto'), h('p.small.dim', 'Você pode concluir as lições pelo celular. O que precisa de computador fica esperando aqui, sem prazo.'), lista);
  pintar();
}
