// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Página de um módulo: aulas, micro-lições, missão do projeto e recursos externos.
import { h, top, progressBar } from '../core/ui.js';
import { S } from '../core/estado.js';
import { MODULOS, licao, progressoModulo, proxima } from '../data/curso.js';
import { PROJETO, progressoProjeto } from '../data/projeto.js';
import { RECURSOS } from '../data/recursos.js';
import { faixa, fotoDoModulo } from '../core/fotos.js';

export default async function (el, [n]) {
  const m = MODULOS[+n];
  if (!m) { location.replace('#/trilha'); return; }
  const p = progressoModulo(m.n, S.licoes);
  const prox = proxima(S.licoes, S.sessao.licao);
  const pj = PROJETO[m.n];
  const pp = progressoProjeto(S.missoes, m.n);
  el.style.setProperty('--c', m.cor);
  el.append(
    top(`Módulo ${m.n}`, '#/trilha'),
    faixa(fotoDoModulo(m.n), h('div.eyebrow', `Módulo ${m.n}`), h('h2', m.t), h('p', m.sub)),
    // duas pílulas só; as horas da ementa (m.ementa) continuam nos dados, fora desta tela
    h('div', h('div.row.wrap', { style: { margin: '0 0 8px' } }, h('span.tag.c', `${p.feitas} de ${p.total} lições`), h('span.tag', `~${m.horas} h com prática`)), progressBar(p.frac, m.cor)),
  );
  if (!p.total) el.append(h('div.banner', 'As lições deste módulo ainda estão sendo escritas.'));
  for (const a of m.aulas) {
    if (!a.ids.length) continue;
    // o título da aula só aparece quando é diferente do título do módulo
    el.append(a.t && a.t !== m.t ? h('h3', { style: { marginTop: '6px' } }, a.t) : null, h('div.list', a.ids.map((id) => {
      const L = licao(id); const st = S.licoes[id] || {};
      const andando = !st.feita && st.p > 0;
      // a lição da vez: card com o único botão principal da tela
      if (id === prox) return h('section.card.licao-atual', h('a.item.now', { href: `#/licao/${id}` }, h('span.n', id), h('span.t', h('b', L.t), h('span', `${L.min} min${andando ? ` · parou no passo ${st.p + 1}` : ''}`)), h('span.chev', '›')),
        h('a.btn.primary.block', { href: `#/licao/${id}` }, andando ? 'Continuar aqui' : 'Começar aqui'));
      return h('a.item' + (st.feita ? '.done' : '') + (id === prox ? '.now' : ''), { href: `#/licao/${id}` },
        h('span.n', st.feita ? '✓' : id), h('span.t', h('b', L.t), h('span', `${st.feita ? id + ' · ' : ''}${L.min} min${andando ? ` · parou no passo ${st.p + 1}` : ''}${st.mao === 'depois' ? ' · prática pendente' : ''}`)), h('span.chev', '›'));
    })));
  }
  el.append(h('section.card.flat', { style: { borderLeft: '4px solid var(--c)' } },
    h('div.eyebrow', 'Projeto deste módulo'), h('h3', pj.t), h('p.small.dim', pj.entrega),
    h('div.row.between', { style: { marginTop: '10px' } }, h('span.small.muted', `${pp.feitas} de ${pp.total} missões`), h('a.btn.small', { href: `#/projeto/m/${m.n}` }, 'Ver missões'))));
  const rec = RECURSOS[m.n] || [];
  if (rec.length) el.append(h('h3', 'Para ir além'), h('div.list', rec.map((r) => h('a.item', { href: r.u, target: '_blank', rel: 'noopener noreferrer' }, h('span.t', h('b', r.t), h('span', r.de)), h('span.chev', '↗')))));
}
