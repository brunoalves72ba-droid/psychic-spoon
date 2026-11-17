// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Texto grifado durante o áudio: o parágrafo que a voz está lendo fica em destaque (barra cinza-clara de
// 2 px à esquerda, texto claro) e os outros ficam em cinza. Sem violeta e sem rolar a tela sozinho: se o
// trecho sair da tela, aparece o botão "Voltar ao trecho". Os tempos vêm de audio/tempos.json (gerado
// uma vez no computador por tools/audio/tempos.mjs); o app só lê. Funciona em qualquer velocidade.
import { h } from './ui.js';
import { S } from './estado.js';

let tempos = null;
export async function carregarTempos() {
  if (tempos) return tempos;
  try { const r = await fetch('audio/tempos.json'); tempos = r.ok ? await r.json() : {}; } catch { tempos = {}; }
  return tempos;
}

/** Ajuste "Texto grifado durante o áudio" (ligado por padrão; sincroniza entre aparelhos). */
export const grifoLigado = () => !(S['v2.leitura.grifado'] && S['v2.leitura.grifado'].ligado === false);

/** Trecho (parte e chave) que está sendo lido no tempo `t`, a partir da lista de tempos da aula. Puro. */
export function trechoEm(daAula, t) {
  let achado = null;
  for (const [parte, linhas] of Object.entries(daAula || {})) {
    if (!Array.isArray(linhas)) continue;
    for (let i = 0; i < linhas.length; i++) {
      const [chave, ini] = linhas[i];
      if (ini <= t + 0.05 && (!achado || ini >= achado.ini)) achado = { parte, chave, ini, i };
    }
  }
  return achado;
}

const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Liga o grifo numa aula. `audio`: o elemento de áudio do player; `passoAtual()`: a seção do passo na
 * tela; `parteAtual()`: id da parte do áudio daquele passo ('passo-1'…) ou null. `conferir`: mostra o tempo
 * e o trecho calculado (modo de conferência). Devolve { parar, atualizar }.
 */
export function grifador(id, audio, { passoAtual, parteAtual, conferir = false }) {
  let daAula = null, alvo = null, marcado = null, visivel = true;
  const barra = h('span.grifo-barra', { 'aria-hidden': 'true' });
  const voltar = h('button.btn.grifo-voltar.hide', { type: 'button', onclick: () => { if (marcado) marcado.scrollIntoView({ block: 'center', behavior: reduzido() ? 'auto' : 'smooth' }); } }, 'Voltar ao trecho');
  const painel = conferir ? h('div.grifo-conferir', { 'aria-live': 'off' }) : null;
  document.body.append(voltar);
  if (painel) document.body.append(painel);
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => { for (const e of es) if (e.target === marcado) { visivel = e.isIntersecting; pintarVoltar(); } }) : null;
  carregarTempos().then((t) => { daAula = t[id] || null; atualizar(); });

  function limpar() {
    const box = marcado && marcado.closest('.passo');
    if (marcado) { marcado.classList.remove('lendo'); if (io) io.unobserve(marcado); }
    if (box) box.classList.remove('grifando');
    marcado = null; barra.remove(); visivel = true; pintarVoltar();
  }
  function pintarVoltar() { voltar.classList.toggle('hide', !(marcado && !visivel && !audio.paused)); }
  function posicionar() {
    if (!marcado) return;
    const box = marcado.closest('.passo'); if (!box) return;
    if (barra.parentNode !== box) box.append(barra);
    const r = marcado.getBoundingClientRect(), b = box.getBoundingClientRect();
    barra.style.transform = `translateY(${(r.top - b.top).toFixed(1)}px) scaleY(${(r.height / 100).toFixed(3)})`;
  }
  function atualizar() {
    const t = audio.currentTime || 0;
    const parte = parteAtual();
    const tr = daAula && parte ? trechoEm({ [parte]: daAula[parte] }, t) : null;
    if (painel) painel.textContent = `${t.toFixed(2)} s · ${tr ? `${tr.parte}:${tr.chave} (desde ${tr.ini.toFixed(2)} s)` : 'sem trecho'}`;
    const box = passoAtual();
    const ligado = grifoLigado() && !audio.paused && box && tr;
    const el = ligado ? box.querySelector(`[data-trecho="${CSS.escape(tr.chave)}"]`) : null;
    if (!el) { if (!ligado) limpar(); else if (marcado) { /* trecho sem lugar na tela (frase final): mantém o último */ } return; }
    if (el !== marcado) {
      limpar();
      marcado = el; el.classList.add('lendo'); box.classList.add('grifando');
      if (io) io.observe(el);
    }
    posicionar();
  }
  const evs = ['timeupdate', 'play', 'pause', 'seeked', 'ended', 'ratechange'];
  for (const e of evs) audio.addEventListener(e, atualizar);
  addEventListener('resize', posicionar, { passive: true });
  return {
    atualizar,
    parar() { for (const e of evs) audio.removeEventListener(e, atualizar); removeEventListener('resize', posicionar); limpar(); if (io) io.disconnect(); voltar.remove(); if (painel) painel.remove(); },
  };
}
