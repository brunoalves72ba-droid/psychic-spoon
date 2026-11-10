// Sexteto — © Bruno Moura, único e exclusivo proprietário.
import { h, top, seg } from '../core/ui.js';
import { GLOSSARIO } from '../data/glossario.js';

export default async function glossario(el) {
  let area = 'todas', term = '';
  const list = h('section.list');
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const paint = () => {
    const items = GLOSSARIO.filter(([t, en, d, a]) => (area === 'todas' || a === area) && (!term || norm(t + ' ' + en + ' ' + d).includes(norm(term)))).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
    list.replaceChildren(...(items.length ? items.map(([t, en, d]) => h('div.card.tight', h('b', t), en ? h('span.tag', { style: { marginLeft: '8px' }, lang: 'en' }, en) : null, h('p.small.dim', { style: { marginTop: '4px' } }, d))) : [h('p.muted', 'Nenhum termo encontrado.')]));
  };
  paint();
  el.append(top('Glossário', '#/harmonia'),
    h('input', { type: 'search', placeholder: 'Buscar termo…', 'aria-label': 'Buscar termo', style: { minHeight: '46px', borderRadius: '12px', border: '1px solid var(--line2)', background: 'var(--bg3)', padding: '8px 14px', width: '100%' }, oninput: (e) => { term = e.target.value; paint(); } }),
    seg([{ v: 'todas', label: 'Todas' }, { v: 'harmonia', label: 'Harmonia' }, { v: 'voz', label: 'Voz' }, { v: 'estúdio', label: 'Estúdio' }], area, (v) => { area = v; paint(); }, { label: 'Área' }),
    h('p.small.muted', 'Os nomes em inglês são os que aparecem nos equipamentos e programas.'), list);
}
