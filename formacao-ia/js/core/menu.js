// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Saudação ("Oi, nome") e menu lateral: no celular, uma gaveta que abre da esquerda;
// no PC, os mesmos itens numa seção do menu fixo, abaixo das cinco abas.
import { h, icon } from './ui.js';
import { capturar } from './pensamento.js';
import { instalado } from './instalar.js';
import { nomeUsuario } from './estado.js';
import { ehPC } from './plataforma.js';
import { checkinHoje, rosto, ROTULO } from './checkin.js';
import { mascote, ACESSORIO } from './mascote.js';

/** Os seis itens, na ordem combinada. "Instalar" some quando o app já está instalado. */
export const itensMenu = () => [
  { id: 'capturar', rotulo: 'Capturar pensamento', icone: 'lampada', acao: capturar },
  { id: 'pensamentos', rotulo: 'Pensamentos guardados', icone: 'nota', href: '#/mais/pensamentos' },
  { id: 'ajustes', rotulo: 'Ajustes', icone: 'engrenagem', href: '#/mais/ajustes' },
  { id: 'sync', rotulo: 'Sincronizar celular e PC', icone: 'sync', href: '#/mais/sync' },
  instalado() ? null : { id: 'instalar', rotulo: 'Instalar no celular', icone: 'baixa', href: '#/mais/instalar' },
  { id: 'sobre', rotulo: 'Sobre o app', icone: 'info', href: '#/mais/sobre' },
].filter(Boolean);

const textoOi = () => { const n = nomeUsuario(); return n ? `Oi, ${n}` : 'Oi'; };

/** Saudação do topo das cinco abas, com a mascote. No celular é o botão que abre o menu; no PC, só o nome. */
export function saudacao(aba) {
  let s;
  const m = mascote(ACESSORIO[aba] || 'cafe');
  if (ehPC()) s = h('div.saudacao', m, h('span.oi', textoOi()));
  else {
    s = h('button.saudacao', { type: 'button', id: 'saudacao', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-controls': 'menu-lateral' }, m, h('span.oi', textoOi()));
    s.addEventListener('click', () => abrirMenu(s));
  }
  // canto direito: a carinha do check-in de hoje (some na virada do dia)
  const c = checkinHoje();
  const canto = h('span.topo-rosto', c ? { role: 'img', 'aria-label': `Check-in de hoje: ${ROTULO[c.humor].toLowerCase()}`, title: `Check-in de hoje: ${ROTULO[c.humor].toLowerCase()}` } : null, c ? rosto(c.humor, 20) : null);
  return h('div.topo-linha', s, canto);
}

// ---------------- gaveta (celular) ----------------
let aberto = null;
const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const FOCAVEIS = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

export const menuAberto = () => !!aberto;

export function abrirMenu(gatilho) {
  if (aberto) return;
  const veu = h('div.gaveta-veu', { 'aria-hidden': 'true' });
  const lista = h('ul.gaveta-lista', { role: 'list' });
  const gaveta = h('aside.gaveta', { id: 'menu-lateral', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'menu-lateral-tit' },
    h('p.gaveta-tit', { id: 'menu-lateral-tit' }, textoOi()), lista);
  for (const it of itensMenu()) {
    const conteudo = [icon(it.icone), h('span', it.rotulo)];
    lista.append(h('li', it.href
      ? h('a.gaveta-item', { href: it.href, onclick: (e) => { e.preventDefault(); fechar({ ir: it.href }); } }, conteudo)
      : h('button.gaveta-item', { type: 'button', onclick: () => fechar({ depois: it.acao }) }, conteudo)));
  }
  document.body.append(veu, gaveta);
  document.body.classList.add('com-gaveta');
  gatilho?.setAttribute('aria-expanded', 'true');
  // o "voltar" do Android fecha o menu: uma entrada no histórico com a mesma URL
  history.pushState({ fiaMenu: 1 }, '');

  const aoTeclar = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); fechar(); return; }
    if (e.key !== 'Tab') return;
    const f = [...gaveta.querySelectorAll(FOCAVEIS)];
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  };
  const aoVoltar = () => { if (aberto) fechar({ pelaHistoria: true }); };
  document.addEventListener('keydown', aoTeclar);
  window.addEventListener('popstate', aoVoltar);
  veu.addEventListener('click', () => fechar());

  // arrastar para a esquerda fecha (30% da largura ou um movimento rápido)
  let x0 = null, t0 = 0, dx = 0, id = null;
  gaveta.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; x0 = e.clientX; t0 = performance.now(); dx = 0; id = e.pointerId; }, { passive: true });
  gaveta.addEventListener('pointermove', (e) => {
    if (x0 == null || e.pointerId !== id) return;
    dx = Math.min(0, e.clientX - x0);
    if (dx < -6) { gaveta.style.transition = 'none'; gaveta.style.transform = `translateX(${dx}px)`; veu.style.opacity = String(1 + dx / gaveta.offsetWidth); }
  }, { passive: true });
  const soltar = () => {
    if (x0 == null) return;
    const v = dx / Math.max(1, performance.now() - t0);
    x0 = null; gaveta.style.transition = ''; veu.style.opacity = '';
    if (dx < -gaveta.offsetWidth * 0.3 || (dx < -20 && v < -0.5)) fechar();
    else gaveta.style.transform = '';
  };
  gaveta.addEventListener('pointerup', soltar, { passive: true });
  gaveta.addEventListener('pointercancel', soltar, { passive: true });

  aberto = { veu, gaveta, gatilho, aoTeclar, aoVoltar };
  gaveta.style.willChange = 'transform';
  requestAnimationFrame(() => requestAnimationFrame(() => { veu.classList.add('on'); gaveta.classList.add('on'); }));
  setTimeout(() => { gaveta.style.willChange = ''; }, 320);
  (gaveta.querySelector('.gaveta-item') || gaveta).focus({ preventScroll: true });
}

/** Fecha a gaveta. `ir`: rota para abrir em seguida (substitui a entrada do menu no histórico). */
export function fechar({ ir, depois, pelaHistoria } = {}) {
  if (!aberto) return;
  const { veu, gaveta, gatilho, aoTeclar, aoVoltar } = aberto;
  aberto = null;
  document.removeEventListener('keydown', aoTeclar);
  window.removeEventListener('popstate', aoVoltar);
  document.body.classList.remove('com-gaveta');
  gatilho?.setAttribute('aria-expanded', 'false');
  gaveta.style.transform = '';
  veu.classList.remove('on'); gaveta.classList.remove('on');
  const tirar = () => { veu.remove(); gaveta.remove(); };
  if (reduzido()) tirar(); else setTimeout(tirar, 300);
  if (ir) { location.replace(ir); return; }
  if (!pelaHistoria && history.state && history.state.fiaMenu) history.back();
  if (gatilho && gatilho.isConnected) gatilho.focus({ preventScroll: true });
  if (depois) depois();
}

// ---------------- menu fixo (PC) ----------------
/** Monta os itens do menu na seção de baixo do menu lateral do PC (abaixo das cinco abas). */
export function montarMenuPC(nav) {
  let sec = nav.querySelector('.menu-pc');
  if (!sec) { sec = h('div.menu-pc', { role: 'group', 'aria-label': 'Mais opções' }); nav.append(sec); }
  sec.replaceChildren(...itensMenu().map((it) => it.href
    ? h('a', { href: it.href, 'data-menu': it.id }, icon(it.icone), h('span', it.rotulo))
    : h('button', { type: 'button', 'data-menu': it.id, onclick: it.acao }, icon(it.icone), h('span', it.rotulo))));
  return sec;
}
