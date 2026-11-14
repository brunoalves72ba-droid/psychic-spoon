// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Diário de bordo: uma frase por sessão. É a primeira entrega do projeto (Módulo 0).
import { h, top, clear, toast, fmtDia, textFile, confirmSheet, plural } from '../core/ui.js';
import { S, escreverDiario, apagarDiario } from '../core/estado.js';

export const diarioMarkdown = () => ['# Diário de bordo — APE-IA', '', ...[...S.diario].reverse().map((x) => `- ${x.d}: ${x.t}`), ''].join('\n');

export default async function (el) {
  const inp = h('textarea', { rows: 2, placeholder: 'O que você fez ou aprendeu hoje, em uma frase.', 'aria-label': 'Nova entrada do diário', maxLength: 400 });
  const lista = h('div.list');
  const cont = h('div.eyebrow');
  const pintar = () => {
    cont.textContent = plural(S.diario.length, 'entrada', 'entradas');
    clear(lista);
    if (!S.diario.length) { lista.append(h('p.muted', 'Nenhuma entrada ainda. A primeira pode ser bem simples: “Comecei o curso hoje.”')); return; }
    S.diario.forEach((x, i) => lista.append(h('div.card.flat.tight', h('div.row.between', h('span.small.muted', fmtDia(x.d, { weekday: 'short', day: '2-digit', month: 'short' })),
      h('button.btn.quiet.small', { type: 'button', 'aria-label': 'Apagar esta entrada', onclick: async () => { if (await confirmSheet('Apagar esta entrada do diário?', 'Apagar')) { apagarDiario(x); pintar(); } } }, 'Apagar')), h('p', x.t))));
  };
  el.append(top('Diário de bordo', '#/projeto'), cont,
    h('section.card.flat', h('label.field', h('span', 'Uma frase sobre a sessão de hoje'), inp),
      h('div.row', { style: { marginTop: '10px' } }, h('button.btn.primary.grow', { type: 'button', onclick: () => { const g = escreverDiario(inp.value); if (!g) return; inp.value = ''; toast(`Guardado. +${g} XP`); pintar(); } }, 'Guardar'),
        h('button.btn', { type: 'button', onclick: () => { if (!S.diario.length) { toast('Escreva a primeira entrada antes de exportar.'); return; } textFile(diarioMarkdown(), 'diario-de-bordo.md', 'text/markdown'); } }, 'Exportar .md'))),
    lista);
  pintar();
}
