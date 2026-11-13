// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Missões do projeto em um módulo: passos pequenos, de 10 a 25 minutos, com lista de conferência.
import { h, top, tick, toast, rich, plural } from '../core/ui.js';
import { S, marcarMissao } from '../core/estado.js';
import { MODULOS, progressoModulo } from '../data/curso.js';
import { PROJETO, progressoProjeto } from '../data/projeto.js';
import { verificarConquistas } from '../core/conquistas.js';

const ATALHOS = { 0: [['#/projeto/diario', 'Abrir o diário de bordo']], 1: [['#/projeto/ficha', 'Abrir a ficha técnica']], 2: [['#/projeto/prompts', 'Abrir a biblioteca de prompts'], ['#/labs/x/prompt', 'Laboratório de prompts']], 3: [['#/projeto/kits', 'Baixar o kit do mini-RAG'], ['#/labs/x/api', 'Treinar no Laboratório de API']], 4: [['#/labs/x/n8n-expr', 'Treinar expressões do n8n']], 5: [['#/projeto/kits', 'Baixar o kit da fábrica'], ['#/revisar/importar', 'Importar cartões']], 6: [['#/projeto/kits', 'Baixar o kit do agente']] };

export default async function (el, [n]) {
  const p = PROJETO[+n];
  if (!p) { location.replace('#/projeto'); return; }
  const m = MODULOS[p.m];
  const pl = progressoModulo(p.m, S.licoes);
  el.style.setProperty('--c', m.cor);
  const cabeca = h('span.tag.c');
  const pintarCabeca = () => { const pp = progressoProjeto(S.missoes, p.m); cabeca.textContent = `${pp.feitas} de ${plural(pp.total, 'missão', 'missões')}`; };
  pintarCabeca();
  el.append(top(`Projeto · M${p.m}`, '#/projeto'),
    h('div', h('h2', p.t), h('p.dim', p.entrega), h('div.row.wrap', { style: { marginTop: '8px' } }, cabeca)),
    h('div.callout.dica', h('span.rot', 'Pronto quando'), p.pronto));
  if (pl.total && pl.feitas < pl.total) el.append(h('div.banner.info', h('span', `Você fez ${pl.feitas} de ${pl.total} lições deste módulo. Dá para começar as missões, mas algumas pedem as lições finais.`), h('a.btn.small', { href: `#/trilha/m/${p.m}` }, 'Lições')));

  for (const ms of p.missoes) {
    const st = S.missoes[ms.id] || { itens: {} };
    const selo = h('span.tag' + (st.feita ? '.ok' : ''), st.feita ? 'Feita' : `${ms.min} min`);
    const card = h('section.card.flat', { id: ms.id }, h('div.row.between', h('h3', { style: { margin: 0 } }, ms.t), selo),
      h('div.col.gap-s', { style: { marginTop: '10px' } }, ms.itens.map((txt, i) => tick(txt, !!st.itens[i], (on) => {
        const g = marcarMissao(ms.id, i, on, ms.itens.length);
        const agora = S.missoes[ms.id];
        selo.className = 'tag' + (agora.feita ? ' ok' : ''); selo.textContent = agora.feita ? 'Feita' : `${ms.min} min`;
        pintarCabeca();
        if (g) toast(agora.feita ? `Missão concluída. +${g} XP` : `+${g} XP`);
        for (const c of verificarConquistas()) toast(`Conquista: ${c.t}`);
      }))),
      h('a.btn.quiet.small', { href: `#/foco/${ms.id}`, style: { marginTop: '6px' } }, `Fazer agora com relógio de foco`));
    el.append(card);
  }
  const at = ATALHOS[p.m] || [];
  if (at.length) el.append(h('div.row.wrap', at.map(([href, t]) => h('a.btn.small', { href }, t))));
}
