// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Luz em volta do card de destaque (um por tela): uma volta de 2,4 s ao entrar na aba pela primeira vez
// na sessão; toque no card = nova volta + brilho difuso atrás; toque no botão principal = flash do contorno.
// Só transform e opacity animam. Com "reduzir movimento": sem giro, o toque só acende um pouco a borda.
import { h } from './ui.js';

const vistas = new Set(); // abas que já mostraram a volta de entrada nesta sessão
const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const VOLTA = 2400;

/**
 * Liga a luz num card. `aba`: nome da aba (a volta de entrada acontece só na primeira visita da sessão).
 * `adiar`: promessa; a volta de entrada espera por ela (ex.: o card de boas-vindas fechar).
 * Devolve { girar, flash, desligar }.
 */
export function luz(card, { aba, adiar } = {}) {
  if (!card || card.querySelector(':scope > .luz')) return null;
  const cabeca = h('i.luz-giro');
  const flashEl = h('b.luz-flash');
  const anel = h('span.luz', { 'aria-hidden': 'true' }, cabeca, flashEl);
  const brilho = h('span.luz-brilho', { 'aria-hidden': 'true' });
  card.classList.add('com-luz');
  card.prepend(brilho);
  card.append(anel);
  let anims = [];
  const parar = () => { for (const a of anims) a.cancel(); anims = []; cabeca.style.willChange = ''; };
  const anima = (el, kf, opt) => { const a = el.animate(kf, opt); anims.push(a); return a; };

  function girar() {
    parar();
    if (reduzido()) { anima(flashEl, [{ opacity: 0 }, { opacity: 0.45 }, { opacity: 0 }], { duration: 600, easing: 'ease-out' }); return; }
    cabeca.style.willChange = 'transform';
    anima(cabeca, [{ opacity: 1, transform: 'translate(-50%,-50%) rotate(0deg)' }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(360deg)', offset: 0.94 }, { opacity: 0, transform: 'translate(-50%,-50%) rotate(380deg)' }], { duration: VOLTA, easing: 'linear' })
      .finished.then(() => { cabeca.style.willChange = ''; }, () => {});
  }
  function tocarCard() {
    girar();
    anima(brilho, [{ opacity: 0.2 }, { opacity: 0.85, offset: 0.4 }, { opacity: 0 }], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  function flash() {
    parar();
    anima(flashEl, [{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)' });
    if (!reduzido()) anima(brilho, [{ opacity: 0.2 }, { opacity: 0.85, offset: 0.22 }, { opacity: 0 }], { duration: 900, easing: 'ease-out' });
  }
  const aoTocar = (e) => {
    if (e.target.closest('.btn.primary')) { flash(); return; } // o botão faz o flash e segue com a ação normal
    if (e.target.closest('a,button,input,select,textarea,label,summary')) return;
    tocarCard();
  };
  card.addEventListener('click', aoTocar);

  if (aba && !vistas.has(aba)) {
    vistas.add(aba);
    // espera o card entrar na tela (a página é montada fora e trocada depois)
    Promise.resolve(adiar).then(() => {
      let n = 0;
      const ver = () => { if (card.isConnected) girar(); else if (++n < 120) requestAnimationFrame(ver); };
      requestAnimationFrame(ver);
    });
  }
  return { girar: tocarCard, flash, desligar: () => { parar(); card.removeEventListener('click', aoTocar); } };
}

/** Só para testes: esquece quais abas já mostraram a volta de entrada. */
export const _reiniciarLuz = () => vistas.clear();
