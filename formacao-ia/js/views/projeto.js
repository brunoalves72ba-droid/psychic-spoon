// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Projeto: o APE-IA (Assistente Pessoal de Estudos com IA), montado módulo a módulo.
import { h, progressBar, plural, icon } from '../core/ui.js';
import { S, pendencias } from '../core/estado.js';
import { MODULOS, progressoModulo } from '../data/curso.js';
import { PROJETO, progressoProjeto } from '../data/projeto.js';
import { robo } from '../core/robo.js';

export default async function (el) {
  const feitos = PROJETO.map((p) => progressoProjeto(S.missoes, p.m).completo);
  const n = feitos.filter(Boolean).length;
  const pend = pendencias().length;
  el.append(
    h('header', h('div.eyebrow', `${n} de 7 entregas`), h('h1', 'Projeto')),
    h('section.card.flat', { style: { display: 'grid', gridTemplateColumns: '116px 1fr', gap: '12px', alignItems: 'center' } },
      robo(feitos, 116),
      h('div', h('h3', 'APE-IA'), h('p.small.dim', 'Um assistente que responde dúvidas sobre o seu material do curso. Um projeto só, do primeiro prompt até o endereço público.'))),
    h('div.list', PROJETO.map((p) => {
      const m = MODULOS[p.m];
      const pp = progressoProjeto(S.missoes, p.m);
      const pl = progressoModulo(p.m, S.licoes);
      return h('a.item' + (pp.completo ? '.done' : ''), { href: `#/projeto/m/${p.m}`, css: { '--c': m.cor } },
        h('span.n', pp.completo ? '✓' : `M${p.m}`),
        h('span.t', h('b', p.t), h('span', `${pp.feitas} de ${plural(pp.total, 'missão', 'missões')}${pl.total && pl.feitas < pl.total ? ` · lições: ${pl.feitas}/${pl.total}` : ''}`), progressBar(pp.frac, m.cor)),
        h('span.chev', '›'));
    })),
    h('h3', 'Ferramentas do projeto'),
    h('div.tools',
      h('a.tool', { href: '#/projeto/diario', css: { '--c': 'var(--m0)' } }, h('b', 'Diário de bordo'), h('span', `Uma frase por sessão. ${plural(S.diario.length, 'entrada', 'entradas')}.`)),
      h('a.tool', { href: '#/projeto/ficha', css: { '--c': 'var(--m1)' } }, h('b', 'Ficha técnica'), h('span', 'Objetivo, modelos e regras do APE-IA.')),
      h('a.tool', { href: '#/projeto/prompts', css: { '--c': 'var(--m2)' } }, h('b', 'Biblioteca de prompts'), h('span', `${plural(S.prompts.length, 'prompt', 'prompts')} com versão e rubrica.`)),
      h('a.tool', { href: '#/projeto/kits', css: { '--c': 'var(--m3)' } }, h('b', 'Kits de código'), h('span', 'Arquivos prontos para os Módulos 3, 5 e 6.')),
      h('a.tool', { href: '#/projeto/pendencias', css: { '--c': 'var(--m4)' } }, h('b', 'Práticas pendentes'), h('span', pend ? `${plural(pend, 'prática', 'práticas')} para fazer no computador.` : 'Nada pendente.')),
      h('a.tool', { href: '#/foco', css: { '--c': 'var(--m5)' } }, h('b', 'Modo foco'), h('span', 'Relógio de 10, 15 ou 25 min para as missões.'))),
  );
}
