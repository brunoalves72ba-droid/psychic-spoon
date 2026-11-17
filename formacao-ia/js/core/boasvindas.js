// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Boas-vindas ao abrir o app a frio: card de vidro no centro com a mascote, uma linha sobre o curso e uma
// frase do banco de 150 (sem repetir as últimas 10). Não some sozinho; "Pular" e Esc fecham na hora.
// Voltar do segundo plano em menos de 30 min não mostra de novo.
import { h } from './ui.js';
import { L, salvarLocal, nomeUsuario } from './estado.js';
import { mascote, pular } from './mascote.js';
import { luz } from './luz.js';
import { pularAbertura } from './abertura.js';
import { sortear } from './sorteio.js';

const MEIA_HORA = 30 * 60 * 1000;
const CHAVE_SAIDA = 'fia-saiu-em';
const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let avisarFechou;
const fechouP = new Promise((r) => { avisarFechou = r; });
/** Resolve quando as boas-vindas fecham (ou na hora, se não aparecerem). */
export const boasVindasFechadas = () => fechouP;

// guarda a hora em que o app foi para o segundo plano (para a regra dos 30 min)
if (typeof document !== 'undefined') {
  const marcar = () => { try { localStorage.setItem(CHAVE_SAIDA, String(Date.now())); } catch {} };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') marcar(); });
  addEventListener('pagehide', marcar);
}

/** Abertura a frio de verdade: não é volta do segundo plano em menos de 30 min. */
export function aberturaAFrio(agora = Date.now()) {
  let saiu = 0;
  try { saiu = +localStorage.getItem(CHAVE_SAIDA) || 0; } catch {}
  return !saiu || agora - saiu >= MEIA_HORA;
}

async function frases() {
  try { const r = await fetch('js/data/mensagens.json'); if (r.ok) return await r.json(); } catch {}
  return [];
}

/** Mostra as boas-vindas se for a hora. A tela Hoje já fica carregada por trás. */
export async function mostrarBoasVindas({ forcar = false, naoMostrar = false } = {}) {
  if (naoMostrar || (!forcar && (pularAbertura() || !aberturaAFrio()))) { avisarFechou(); return false; }
  const lista = await frases();
  if (!lista.length) { avisarFechou(); return false; }
  const [i, ultimas] = sortear(lista.length, L['v2.boasvindas.ultimas'] || []);
  L['v2.boasvindas.ultimas'] = ultimas; salvarLocal();
  const nome = nomeUsuario();
  const m = mascote('cafe', 56);
  const pularBtn = h('button.btn.quiet.bv-pular', { type: 'button' }, 'Pular');
  const card = h('div.card.bv-card', { tabindex: '-1' },
    h('div.bv-mascote', m),
    h('h2', { id: 'bv-tit' }, nome ? `Bem-vindo, ${nome}` : 'Bem-vindo à Formação IA Generativa'),
    h('p.small.dim', nome ? 'Formação IA Generativa: IA generativa do zero, em lições de 5 a 10 minutos.' : 'IA generativa do zero, em lições de 5 a 10 minutos.'),
    h('p.bv-frase', lista[i]),
    pularBtn);
  const tela = h('div.boasvindas', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'bv-tit' }, card);
  const antes = document.activeElement;
  document.body.append(tela);
  const l = luz(card, { aba: 'boasvindas' });
  let fechando = false;
  const fechar = (rapido) => {
    if (fechando) return; fechando = true;
    document.removeEventListener('keydown', aoTeclar);
    const fim = () => { tela.remove(); if (antes && antes.isConnected) antes.focus({ preventScroll: true }); avisarFechou(); };
    if (rapido || reduzido()) { tela.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150 }).finished.then(fim, fim); return; }
    pular(m); if (l) l.girar();
    card.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(.96)', opacity: 0 }], { duration: 280, delay: 300, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'forwards' });
    tela.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, delay: 300, fill: 'forwards' }).finished.then(fim, fim);
  };
  const aoTeclar = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); fechar(true); }
    else if (e.key === 'Tab') { e.preventDefault(); pularBtn.focus(); } // só há um controle: o foco fica nele
  };
  document.addEventListener('keydown', aoTeclar);
  pularBtn.addEventListener('click', (e) => { e.stopPropagation(); fechar(true); });
  tela.addEventListener('click', () => fechar(false));
  pularBtn.focus({ preventScroll: true });
  return true;
}
