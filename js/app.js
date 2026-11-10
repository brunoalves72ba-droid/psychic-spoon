// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Ponto de entrada: roteador por hash, cinco abas, tempo de prática e service worker.

import { h, clear, toast, wake, fullscreen } from './core/ui.js';
import { prefs, addPractice } from './core/store.js';
import { stopAll, setA4 } from './audio/engine.js';
import { closeMic } from './audio/mic.js';
import { setSolfege } from './music/theory.js';

export const OWNER = 'Bruno Moura';

// rota "#/secao/pagina/arg" → módulo views/secao-pagina.js
const VIEWS = new Set([
  'inicio', 'ajustes',
  'harmonia', 'harmonia-aula', 'harmonia-acordes', 'harmonia-imersao', 'harmonia-cante', 'harmonia-ouvido', 'harmonia-glossario',
  'harmonia-metronomo', 'harmonia-ritmo', 'harmonia-partitura', 'harmonia-teclado',
  'voz', 'voz-respiracao', 'voz-aquecimento', 'voz-afinacao', 'voz-dicas', 'voz-registro', 'voz-retrato',
  'estudio', 'estudio-licao', 'estudio-mesa', 'estudio-gravador', 'estudio-projeto', 'estudio-creditos',
  'evolucao', 'evolucao-comparar', 'evolucao-backup',
]);
const TABS = ['inicio', 'harmonia', 'voz', 'estudio', 'evolucao'];

const view = document.getElementById('view');
let cleanup = null, current = null, enteredAt = 0, token = 0;

function parse() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  let [sec = 'inicio', page, ...args] = parts;
  let name = page ? `${sec}-${page}` : sec;
  if (!VIEWS.has(name)) { name = VIEWS.has(sec) ? sec : 'inicio'; if (name === 'inicio') sec = 'inicio'; page = undefined; args = []; }
  return { sec, page, name, args };
}

function flushPractice() {
  if (current && current.page && enteredAt) {
    const secs = Math.min(1800, (performance.now() - enteredAt) / 1000);
    if (secs >= 5) addPractice(current.sec, Math.round(secs)).catch(() => {});
  }
  enteredAt = performance.now();
}

async function leave() {
  flushPractice();
  stopAll(); closeMic(); wake.off();
  document.body.classList.remove('immersive');
  fullscreen(document.documentElement, false);
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
}

async function render() {
  const my = ++token;
  const r = parse();
  await leave();
  current = r; enteredAt = performance.now();
  document.querySelectorAll('.tabs a').forEach((a) => { if (a.dataset.tab === r.sec) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  let mod;
  try { mod = await import(`./views/${r.name}.js`); }
  catch (e) {
    console.error(e);
    if (my !== token) return;
    clear(view).append(h('div.page', h('h1', 'Não deu para abrir esta tela'), h('p', 'Se você está sem internet e é a primeira visita, conecte-se uma vez para o app baixar tudo.'), h('a.btn', { href: '#/inicio' }, 'Voltar ao início')));
    return;
  }
  if (my !== token) return;
  const page = h('div.page');
  const swap = () => { clear(view).append(page); window.scrollTo(0, 0); };
  let ret;
  try { ret = await mod.default(page, r.args); } catch (e) { console.error(e); page.append(h('div.card', h('h3', 'Algo deu errado nesta tela'), h('p.small.muted', String(e && e.message || e)))); }
  if (my !== token) { if (typeof ret === 'function') ret(); return; }
  cleanup = typeof ret === 'function' ? ret : null;
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) { try { await document.startViewTransition(swap).updateCallbackDone; } catch { swap(); } }
  else swap();
  document.title = (page.querySelector('h1')?.textContent || 'Sexteto') + ' · Sexteto';
}

window.addEventListener('hashchange', render);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushPractice(); else enteredAt = performance.now(); });
window.addEventListener('pagehide', flushPractice);
window.addEventListener('unhandledrejection', (e) => console.error('Promessa rejeitada:', e.reason));

async function boot() {
  await prefs.load().catch(() => {});
  setSolfege(prefs.get('solfege')); setA4(prefs.get('a4') || 440);
  if (!location.hash) history.replaceState(null, '', '#/inicio');
  await render();
  registerSW();
}

function registerSW() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    const offer = (w) => toast('Nova versão do Sexteto pronta.', { label: 'Atualizar', fn: () => w.postMessage('skipWaiting') });
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing; if (!w) return;
      w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w); });
    });
  }).catch((e) => console.warn('Service worker não registrado:', e));
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloaded) return; reloaded = true; if (window.__swHadController) location.reload(); });
  window.__swHadController = !!navigator.serviceWorker.controller;
}

boot();
