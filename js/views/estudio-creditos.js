// Sexteto — © Bruno Moura, único e exclusivo proprietário.
import { h, top } from '../core/ui.js';
import { IMAGENS, ILUSTRACOES } from '../data/imagens.js';

export default async function creditos(el) {
  const imgs = Object.entries(IMAGENS);
  el.append(top('Créditos', '#/estudio'),
    h('section.card.col', h('h3', 'Propriedade'), h('p', h('b', '© Bruno Moura. '), 'O único e exclusivo proprietário deste app é o usuário que o idealizou, Bruno Moura.')),
    h('section.card.col', h('h3', 'Fotos do curso'), h('p.small.dim', 'Fotografias reais do Wikimedia Commons, com licença livre. Todas foram redimensionadas para no máximo 1280 px de largura e convertidas para WebP; recortes estão indicados. As licenças CC BY-SA pedem que versões derivadas das fotos mantenham a mesma licença.'),
      h('div.list', imgs.map(([k, im]) => h('div.row', { style: { alignItems: 'flex-start' } }, h('img', { src: `assets/img/${im.file}`, alt: '', loading: 'lazy', width: 72, height: 54, style: { width: '72px', height: '54px', objectFit: 'cover', borderRadius: '8px', flex: 'none' } }),
        h('div.small', h('b', im.title), h('br'), `${im.author} · `, h('a', { href: im.licenseUrl, target: '_blank', rel: 'noopener' }, im.license), ' · ', h('a', { href: im.source, target: '_blank', rel: 'noopener' }, 'fonte'), h('br'), h('span.muted', im.changes || 'Redimensionada e convertida para WebP.'))))),
      Object.keys(ILUSTRACOES).length ? h('p.small.muted', `Ilustrações no lugar de fotos pendentes: ${Object.keys(ILUSTRACOES).join(', ')}.`) : null),
    h('section.card.col', h('h3', 'Fontes tipográficas'), h('p.small', 'Bricolage Grotesque (© The Bricolage Grotesque Project Authors) e Figtree (© The Figtree Project Authors), ambas sob a SIL Open Font License 1.1. Os textos das licenças estão em assets/fonts.')),
    h('section.card.col', h('h3', 'Música'), h('p.small', 'Progressões “Aurora”, “Maré” e “Noturno”: originais do app. Melodias de domínio público: “Ode à Alegria” (Beethoven, 1824), “Amazing Grace” (melodia “New Britain”, 1829), “Greensleeves” (tradicional inglesa, séc. XVI) e “Swing Low, Sweet Chariot” (spiritual, séc. XIX). As rearmonizações foram escritas para o app.'), h('p.small', 'O Take 6 é citado como referência de linguagem. Não há transcrição de arranjos, letras ou gravações de terceiros. Todo o som é sintetizado no aparelho.')),
    h('section.card.col', h('h3', 'Normas e referências'), h('p.small', 'Medição de volume: ITU-R BS.1770-4. Sinais de teste: EBU Tech 3341. Alvos de streaming: páginas oficiais citadas na lição 4.3, consultadas em 10/11/2026.')),
  );
}
