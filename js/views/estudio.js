// Sexteto — © Bruno Moura, único e exclusivo proprietário.
import { h } from '../core/ui.js';
import { events } from '../core/store.js';
import { MODULOS, LICOES } from '../data/licoes.js';

export default async function estudio(el) {
  const done = new Set((await events('studio')).filter((e) => e.data.lesson).map((e) => e.data.lesson));
  const tool = (href, c, t, d) => h('a.tool', { href, css: { '--c': c } }, h('b', t), h('span', d));
  el.append(
    h('header', h('div.eyebrow', 'Estúdio'), h('h1', 'Da voz ao arquivo final')),
    h('section.tools',
      tool('#/estudio/mesa', 'var(--v1)', 'Mesa virtual', 'Seis canais, master e missões'),
      tool('#/estudio/gravador', 'var(--v3)', 'Gravador multipista', 'Até seis pistas, com guia'),
      tool('#/estudio/projeto', 'var(--v5)', 'Do zero ao master', 'Gravar, mixar, masterizar, exportar'),
      tool('#/estudio/creditos', 'var(--v2)', 'Créditos', 'Fotos, fontes e licenças'),
    ),
    h('p.small.muted', `${done.size} de ${LICOES.length} lições concluídas. Os nomes em inglês aparecem ao lado do português, como nos equipamentos.`),
    MODULOS.map((m) => h('section.col', h('div', h('div.eyebrow', `Módulo ${m.id}`), h('h2', m.name), h('p.small.muted', m.sub)),
      h('div.list', LICOES.filter((l) => l.mod === m.id).map((l) => h('a.item' + (done.has(l.id) ? '.done' : ''), { href: `#/estudio/licao/${l.id}` }, h('span.n', { style: done.has(l.id) ? null : { borderLeft: `3px solid ${m.color}` } }, done.has(l.id) ? '✓' : l.id), h('span.t', h('b', l.title), h('span', l.sims.map((s) => s[1]).join(' · '))), h('span.chev', '›')))))),
  );
}
