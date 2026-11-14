// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Reconhece se o app está num computador ou num celular e adapta a tela.
// Automático: mouse/trackpad (ponteiro fino com hover) e tela larga = PC. Dá para forçar nos Ajustes.
import { L, salvarLocal } from './estado.js';

/** 'pc' ou 'celular', a partir de sinais do navegador (puro: recebe os sinais). */
export function detectar({ ponteiroFino, hover, largura, toque }) {
  if (ponteiroFino && hover && largura >= 900) return 'pc';
  if (!toque && largura >= 1024) return 'pc';
  return 'celular';
}
const sinais = () => ({
  ponteiroFino: matchMedia('(pointer: fine)').matches,
  hover: matchMedia('(hover: hover)').matches,
  largura: window.innerWidth,
  toque: navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches,
});
export const plataforma = () => (L.plataforma === 'pc' || L.plataforma === 'celular' ? L.plataforma : detectar(sinais()));
export const ehPC = () => plataforma() === 'pc';

const ouvintes = new Set();
export const aoTrocar = (fn) => { ouvintes.add(fn); return () => ouvintes.delete(fn); };
let atual = null;
export function aplicarPlataforma() {
  const p = plataforma();
  document.body.classList.toggle('pc', p === 'pc');
  document.body.classList.toggle('celular', p !== 'pc');
  if (atual && atual !== p) for (const fn of ouvintes) fn(p);
  atual = p;
}
export async function escolher(v) { L.plataforma = v; await salvarLocal(); aplicarPlataforma(); }
if (typeof window !== 'undefined') {
  let t = 0;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(aplicarPlataforma, 200); });
}
