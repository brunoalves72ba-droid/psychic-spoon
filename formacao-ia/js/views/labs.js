// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Laboratórios: simuladores para mexer e ver acontecer.
import { h, top } from '../core/ui.js';
import { LABS } from '../data/labs.js';

export default async function (el) {
  el.append(top('Laboratórios', '#/trilha'),
    h('p.dim', 'Mexa à vontade: nada aqui é avaliado, nada sai do aparelho e tudo funciona sem internet.'),
    h('div.tools', LABS.map((l) => h('a.tool', { href: `#/labs/x/${l.id}`, css: { '--c': `var(--m${l.m})` } }, h('b', l.t), h('span', l.d)))));
}
