// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Fotos do curso: legenda, texto alternativo e crédito. Fotos do dono em assets/img/minhas têm prioridade.
// Sem foto disponível, entra um diagrama em SVG marcado como ilustração (nunca uma foto inventada).
import { h } from './ui.js';
import { IMAGENS, ILUSTRACOES } from '../data/imagens.js';

let minhas = null;
/** Lista de fotos do dono (gerada por `npm run precache` a partir de assets/img/minhas). */
async function loadMinhas() {
  if (minhas) return minhas;
  try { const r = await fetch('assets/img/minhas/minhas.json', { cache: 'no-cache' }); minhas = r.ok ? await r.json() : []; } catch { minhas = []; }
  return minhas;
}

/** Figura com foto, legenda e crédito. opts.marks: [{x, y (0..1), n}] marcadores numerados; opts.legend: textos dos marcadores. */
export function photo(key) {
  const im = IMAGENS[key]; const fig = h('figure.photo');
  const build = (src, mine) => {
    if (!im && !mine) {
      const il = ILUSTRACOES[key];
      fig.replaceChildren(h('div.ph', { html: il ? il.svg : '', role: 'img', 'aria-label': il ? il.alt : 'Ilustração' }), h('figcaption', h('span.tag', 'Ilustração'), ' ', il ? il.cap : 'Foto pendente.', h('span.credit', 'Diagrama feito para o app. A foto real está listada em IMAGENS-PENDENTES.md.')));
      return;
    }
    const img = h('img', { src, alt: mine ? `Foto do dono do app: ${im ? im.alt : key}` : im.alt, loading: 'lazy', decoding: 'async', width: im ? im.w : undefined, height: im ? im.h : undefined });
    const ph = h('div.ph', img);
    if (!mine && im.marks) for (const m of im.marks) ph.append(h('span.marker', { style: { left: m.x * 100 + '%', top: m.y * 100 + '%' }, 'aria-hidden': 'true' }, String(m.n)));
    fig.replaceChildren(ph, h('figcaption', h('span', im ? im.cap : ''),
      !mine && im.legend ? h('ol.marks', im.legend.map((t) => h('li', t))) : null,
      mine ? h('span.credit', 'Foto sua, da pasta assets/img/minhas.') : h('span.credit', `Foto: ${im.author} · `, h('a', { href: im.licenseUrl, rel: 'noopener', target: '_blank' }, im.license), ' · ', h('a', { href: im.source, rel: 'noopener', target: '_blank' }, 'Wikimedia Commons'), im.changes ? ` · ${im.changes}` : '')));
  };
  build(im ? `assets/img/${im.file}` : null, false);
  loadMinhas().then((list) => { const f = list.find((n) => n.replace(/\.[a-z0-9]+$/i, '') === key); if (f) build(`assets/img/minhas/${f}`, true); });
  return fig;
}
