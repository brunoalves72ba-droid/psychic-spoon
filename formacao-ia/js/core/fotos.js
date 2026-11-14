// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Fotos reais (Wikimedia Commons, licenças livres) com crédito visível em cada uma.
import { h } from './ui.js';
import { FOTOS, POR_LICAO, POR_MODULO } from '../data/fotos.js';

export const foto = (chave) => FOTOS[chave] || null;
export const fotoDaLicao = (id) => foto(POR_LICAO[id]);
export const fotoDoModulo = (n) => foto(POR_MODULO[n]);

/** Crédito curto: autor, licença e link para a página original. */
export function credito(f) {
  return h('span.credito', 'Foto: ', f.autor || 'autor desconhecido', ' · ', h('a', { href: f.fonte, target: '_blank', rel: 'noopener noreferrer' }, `${f.licenca}, Wikimedia Commons`));
}
/** <figure> com a foto, a legenda e o crédito. capa = versão larga e baixa, para o topo da lição. */
export function figura(idLicao, { capa = false } = {}) {
  const f = fotoDaLicao(idLicao);
  if (!f) return null;
  return h('figure.foto' + (capa ? '.capa' : ''),
    h('img', { src: f.arq, alt: f.alt, loading: 'lazy', decoding: 'async', width: f.w, height: f.h }),
    h('figcaption', capa ? null : h('span', f.legenda), credito(f)));
}
/** Faixa com foto de fundo (cabeçalho de módulo e cartões de destaque). */
export function faixa(f, ...conteudo) {
  if (!f) return h('div.faixa.sem-foto', ...conteudo);
  return h('div.faixa', { style: { backgroundImage: `url("${f.arq}")` }, role: 'img', 'aria-label': f.alt }, h('div.faixa-txt', ...conteudo), h('span.credito.sobre', 'Foto: ', f.autor || 'autor desconhecido', ` · ${f.licenca}`));
}
