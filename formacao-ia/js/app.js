// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Ponto de entrada: roteador por hash, cinco abas e service worker.

import { h, clear, toast } from './core/ui.js';
import { S, carregar } from './core/estado.js';
import { persistir } from './core/store.js';

export const OWNER = 'Bruno Moura';
const APP = 'Formação IA';

// rota "#/secao/pagina/arg" → módulo views/secao-pagina.js (ou views/secao.js recebendo [pagina, arg])
const VIEWS = new Set([
  'hoje',
  'trilha', 'trilha-m', 'licao',
  'revisar', 'revisar-cartoes', 'revisar-mistura', 'revisar-importar',
  'projeto', 'projeto-m', 'projeto-diario', 'projeto-ficha', 'projeto-prompts', 'projeto-kits', 'projeto-pendencias',
  'progresso', 'progresso-semana', 'progresso-cronograma', 'progresso-conquistas',
  'labs', 'labs-x',
  'mais-ficha', 'mais-porque', 'mais-ajustes', 'mais-backup', 'mais-pensamentos', 'mais-lembretes',
  'foco',
]);
const ABA = { hoje: 'hoje', foco: 'hoje', trilha: 'trilha', licao: 'trilha', labs: 'trilha', revisar: 'revisar', projeto: 'projeto', progresso: 'progresso', mais: 'progresso' };
const IMERSIVO = new Set(['licao', 'revisar-cartoes', 'revisar-mistura', 'foco']);

const view = document.getElementById('view');
let cleanup = null, token = 0;

function parse() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [sec = 'hoje', page, ...rest] = parts;
  if (page && VIEWS.has(`${sec}-${page}`)) return { sec, name: `${sec}-${page}`, args: rest };
  if (VIEWS.has(sec)) return { sec, name: sec, args: page ? [page, ...rest] : [] };
  return { sec: 'hoje', name: 'hoje', args: [] };
}

function leave() {
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  document.querySelectorAll('.sheet-bg').forEach((x) => x.remove());
}

async function render() {
  const my = ++token;
  const r = parse();
  leave();
  document.body.classList.toggle('imersivo', IMERSIVO.has(r.name));
  document.querySelectorAll('.tabs a').forEach((a) => { if (a.dataset.tab === ABA[r.sec]) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  let mod;
  try { mod = await import(`./views/${r.name}.js`); }
  catch (e) {
    console.error(e);
    if (my !== token) return;
    document.body.classList.remove('imersivo');
    clear(view).append(h('div.page', h('h1', 'Não deu para abrir esta tela'), h('p', 'Se você está sem internet e esta é a primeira visita, conecte-se uma vez para o app baixar tudo.'), h('a.btn', { href: '#/hoje' }, 'Voltar para Hoje')));
    return;
  }
  if (my !== token) return;
  const page = h('div.page');
  // append nativo escreveria "null": aqui, filhos nulos são ignorados
  page.append = (...kids) => Element.prototype.append.apply(page, kids.flat(3).filter((k) => k != null && k !== false));
  const swap = () => { clear(view).append(page); window.scrollTo(0, 0); };
  let ret;
  try { ret = await mod.default(page, r.args); } catch (e) { console.error(e); page.append(h('div.card', h('h3', 'Algo deu errado nesta tela'), h('p.small.muted', String(e && e.message || e)), h('a.btn', { href: '#/hoje' }, 'Voltar para Hoje'))); }
  if (my !== token) { if (typeof ret === 'function') ret(); return; }
  cleanup = typeof ret === 'function' ? ret : null;
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) { try { await document.startViewTransition(swap).updateCallbackDone; } catch { swap(); } }
  else swap();
  document.title = (page.querySelector('h1')?.textContent || APP) + ' · ' + APP;
}

/** Redesenha a tela atual (depois de uma mudança grande de estado, como restaurar um backup). */
export const redesenhar = () => render();

window.addEventListener('hashchange', render);
window.addEventListener('unhandledrejection', (e) => console.error('Promessa rejeitada:', e.reason));

export function aplicarTema(tema) {
  const el = document.documentElement;
  if (tema === 'claro' || tema === 'escuro') { el.dataset.theme = tema; try { localStorage.setItem('fia-tema', tema); } catch {} }
  else { delete el.dataset.theme; try { localStorage.removeItem('fia-tema'); } catch {} }
}

// Se o Sexteto (na raiz do mesmo site) já estava instalado, o service worker antigo dele pode entregar
// a página dele neste endereço. Aqui o app percebe, instala o próprio service worker e recarrega.
const ativo = (reg, ms) => new Promise((res, rej) => {
  const w = reg.installing || reg.waiting || reg.active;
  if (!w) { rej(new Error('sem worker')); return; }
  if (w.state === 'activated') { res(); return; }
  w.addEventListener('statechange', () => { if (w.state === 'activated') res(); else if (w.state === 'redundant') rej(new Error('instalação falhou')); });
  setTimeout(() => rej(new Error('tempo esgotado')), ms);
});
async function paginaErrada() {
  if (document.querySelector('meta[name="app-id"][content="formacao-ia"]')) return false;
  const aviso = (t) => { document.body.textContent = ''; document.body.append(h('p', { style: { padding: '24px', font: '16px system-ui' } }, t)); };
  aviso('Preparando o app…');
  try {
    const n = +(sessionStorage.getItem('fia-cura') || 0);
    if (n >= 2 || !('serviceWorker' in navigator)) throw new Error('sem conserto automático');
    sessionStorage.setItem('fia-cura', String(n + 1));
    const reg = await navigator.serviceWorker.register('sw.js');
    await ativo(reg, 30000);
    location.reload();
  } catch (e) { console.error(e); aviso('Não deu para abrir o app agora. Confira a internet e recarregue a página.'); }
  return true;
}

async function boot() {
  if (await paginaErrada()) return;
  try { sessionStorage.removeItem('fia-cura'); } catch {}
  await carregar().catch((e) => console.error(e));
  aplicarTema(S.perfil.tema);
  if (!location.hash) history.replaceState(null, '', '#/hoje');
  await render();
  registerSW();
  persistir();
}

function registerSW() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    const offer = (w) => toast('Nova versão do app pronta.', { label: 'Atualizar', fn: () => w.postMessage('skipWaiting') });
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
