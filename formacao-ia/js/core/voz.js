// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Leitura em voz alta com as vozes do próprio aparelho (Web Speech API): grátis, sem servidor e,
// com uma voz instalada no aparelho, sem internet. As preferências ficam só neste aparelho (cada um tem vozes diferentes).
import { L, salvarLocal } from './estado.js';
import { h, icon } from './ui.js';
import { limpar, dividir } from './voz-texto.js';

export const suportado = () => typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
const PADRAO = { ligada: false, auto: false, nome: '', vel: 1 };
export const cfg = () => ({ ...PADRAO, ...(L.voz || {}) });
export const ligada = () => suportado() && cfg().ligada;
export const autoLigada = () => ligada() && cfg().auto;

const ouvintes = new Set();
export const aoMudar = (fn) => { ouvintes.add(fn); return () => ouvintes.delete(fn); };
const avisar = () => { for (const fn of ouvintes) { try { fn(); } catch (e) { console.error(e); } } };

export async function ajustar(mudanca) {
  L.voz = { ...cfg(), ...mudanca };
  if (!L.voz.ligada) parar();
  avisar();
  await salvarLocal();
}

// ---------- vozes ----------
const nota = (v) => (/pt[-_]BR/i.test(v.lang) ? 20 : 0) + (/natural|neural|online|enhanced|aprimorad|premium|wavenet/i.test(v.name) ? 6 : 0)
  + (/google/i.test(v.name) ? 3 : 0) + (typeof navigator !== 'undefined' && !navigator.onLine && v.localService ? 30 : 0);
export function vozes() {
  if (!suportado()) return [];
  return speechSynthesis.getVoices().filter((v) => /^pt/i.test(v.lang)).sort((a, b) => nota(b) - nota(a) || a.name.localeCompare(b.name));
}
/** No Android e no Chrome, a lista de vozes chega um pouco depois de a página abrir. */
export const esperarVozes = () => new Promise((res) => {
  if (!suportado()) { res([]); return; }
  const v = vozes(); if (v.length) { res(v); return; }
  const fn = () => { speechSynthesis.removeEventListener('voiceschanged', fn); res(vozes()); };
  speechSynthesis.addEventListener('voiceschanged', fn);
  setTimeout(() => res(vozes()), 2000);
});
function vozEscolhida() {
  const vs = vozes(), nome = cfg().nome;
  const v = vs.find((x) => x.name === nome);
  // sem internet, a voz escolhida pode ser "online": cai para uma voz do aparelho
  if (v && (v.localService || navigator.onLine)) return v;
  return vs[0] || null;
}

// ---------- fala ----------
let geracao = 0;          // cada nova fala invalida as anteriores
let fila = null;          // { id, partes, i }: o que está sendo lido (ou pausado)
let tocando = false;

/** 'falando' | 'pausado' | 'parado' para um trecho identificado por `id`. */
export function estado(id) {
  if (!fila || fila.id !== id) return 'parado';
  return tocando ? 'falando' : fila.i < fila.partes.length ? 'pausado' : 'parado';
}
export function parar() {
  geracao++; const tinha = !!fila; fila = null; tocando = false;
  if (suportado()) speechSynthesis.cancel();
  if (tinha) avisar();
}
export function pausar() {
  if (!tocando) return;
  geracao++; tocando = false;
  speechSynthesis.cancel();   // pause() falha no Android: aqui a pausa guarda a frase e recomeça dela
  avisar();
}
export function falar(texto, { id = 'avulso', aoFim } = {}) {
  if (!suportado()) return false;
  const partes = dividir(limpar(texto));
  parar();
  if (!partes.length) return false;
  fila = { id, partes, i: 0, aoFim };
  return tocar();
}
export function continuar() { return fila ? tocar() : false; }

function tocar() {
  const f = fila; if (!f) return false;
  const minha = ++geracao;
  speechSynthesis.cancel();
  tocando = true; avisar();
  const v = vozEscolhida(), c = cfg();
  const prox = () => {
    if (minha !== geracao || fila !== f) return;
    if (f.i >= f.partes.length) { tocando = false; fila = null; avisar(); if (f.aoFim) f.aoFim(); return; }
    const u = new SpeechSynthesisUtterance(f.partes[f.i]);
    u.lang = v ? v.lang : 'pt-BR'; if (v) u.voice = v;
    u.rate = c.vel; u.pitch = 1;
    u.onend = () => { if (minha === geracao) { f.i++; prox(); } };
    u.onerror = (e) => { if (minha === geracao && !/interrupted|canceled/.test(e && e.error)) { f.i++; prox(); } };
    speechSynthesis.speak(u);
  };
  setTimeout(prox, 80);   // o Chrome no Android engole a fala pedida logo depois de um cancel
  return true;
}

if (typeof document !== 'undefined') {
  // ao sair do app ou trocar de aba, a voz para (e pode continuar depois do mesmo ponto)
  document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); });
}

// ---------- texto do que está na tela ----------
// Lê o que a pessoa vê, na ordem da tela (o quiz embaralha as opções). Pula código, botões de ação,
// campos, fotos e o que está escondido (como a explicação do quiz antes da resposta).
const PULAR = 'pre, figure, img, svg, .credito, .voz-linha, .acao-bar, nav, input, select, textarea, script, style, .hide, [aria-hidden="true"], .tag, .xp, .atalho, .consulta, a.btn, button:not(.opt):not(.peca), .chip, .seg';
const BLOCO = /^(P|DIV|LI|H1|H2|H3|H4|SECTION|ARTICLE|UL|OL|TR|BLOCKQUOTE|BUTTON|LABEL|FIGCAPTION)$/;
export function textoDe(raiz) {
  if (!raiz) return '';
  const partes = []; let nOpt = 0;
  const andar = (n) => {
    if (n.nodeType === 3) { partes.push(n.nodeValue); return; }
    if (n.nodeType !== 1) return;
    if (n.tagName === 'PRE') { partes.push('\nO código está na tela.\n'); return; }
    if (n.matches(PULAR)) return;
    if (n.matches('.q')) nOpt = 0;
    const bloco = BLOCO.test(n.tagName) || !!(n.parentElement && n.parentElement.matches('.verso'));
    if (bloco) partes.push('\n');
    if (n.matches('.opt')) partes.push(`Opção ${++nOpt}: `);
    for (const c of n.childNodes) andar(c);
    if (bloco) partes.push('\n');
  };
  andar(raiz);
  return partes.join('').split('\n').map((x) => x.replace(/\s+/g, ' ').trim()).filter((x) => /[\p{L}\p{N}]/u.test(x))
    .map((x) => (/[.!?:;…]$/.test(x) ? x : x + '.')).join('\n');
}

// ---------- controles ----------
/**
 * Linha com o botão Ouvir/Pausar/Continuar e o liga-desliga. Some quando o navegador não tem voz.
 * `obter` devolve o texto (lido na hora do toque); `sinal` (AbortSignal) solta os ouvintes ao sair da tela.
 */
export function linhaVoz(obter, { id, sinal } = {}) {
  const el = h('div.voz-linha');
  if (!suportado()) { el.classList.add('hide'); return el; }
  const pintar = () => {
    el.textContent = '';
    if (!ligada()) {
      el.append(h('button.btn.small.quiet.ouvir', { type: 'button', onclick: async () => { await ajustar({ ligada: true }); falar(obter(), { id }); } }, icon('som'), 'Ouvir em voz alta'));
      return;
    }
    const e = estado(id);
    el.append(
      h('button.btn.small.ouvir', { type: 'button', 'aria-pressed': String(e === 'falando'), onclick: () => {
        const agora = estado(id);
        if (agora === 'falando') pausar(); else if (agora === 'pausado') continuar(); else falar(obter(), { id });
      } }, icon(e === 'falando' ? 'pausa' : 'som'), e === 'falando' ? 'Pausar' : e === 'pausado' ? 'Continuar' : 'Ouvir'),
      e !== 'parado' ? h('button.btn.small.quiet', { type: 'button', onclick: () => falar(obter(), { id }) }, 'Do início') : null,
      h('button.btn.small.quiet.mudo', { type: 'button', 'aria-label': 'Desligar a leitura em voz alta', title: 'Desligar a voz', onclick: () => ajustar({ ligada: false }) }, icon('mudo')));
  };
  const solta = aoMudar(pintar);
  if (sinal) sinal.addEventListener('abort', solta);
  pintar();
  return el;
}
