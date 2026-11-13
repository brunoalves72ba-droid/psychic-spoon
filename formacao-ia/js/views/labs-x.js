// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Um laboratório aberto em modo livre (sem missão).
import { h, top } from '../core/ui.js';
import { lab } from '../data/labs.js';
import { licao } from '../data/curso.js';

export default async function (el, [id]) {
  const L = lab(id);
  if (!L) { location.replace('#/labs'); return; }
  const mod = await import(`../labs/${id}.js`);
  const li = licao(L.licao);
  el.append(top(L.t, '#/labs'), mod.default({ missao: false, feito: () => {} }),
    li ? h('a.btn.quiet.block', { href: `#/licao/${li.id}` }, `Lição ${li.id}: ${li.t}`) : null);
}
