// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Service worker: pré-cache de tudo na primeira visita; depois, o app funciona offline.
importScripts('sw-assets.js'); // define self.SEXTETO_VERSION e self.SEXTETO_ASSETS

const CACHE = 'sexteto-' + self.SEXTETO_VERSION;
const ESCOPO = new URL(self.registration.scope).pathname;
const OUTROS_APPS = /^(formacao-ia|financas|fotos)\//; // apps no mesmo site, com service worker próprio
const ehDoSexteto = (caminho) => caminho.startsWith(ESCOPO) && !OUTROS_APPS.test(caminho.slice(ESCOPO.length));

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(self.SEXTETO_ASSETS.map(async (u) => {
      const res = await fetch(new Request(u, { cache: 'reload' }));
      if (!res.ok) throw new Error('pré-cache falhou: ' + u);
      await c.put(u, res);
    }));
    // Sem nenhuma tela do Sexteto aberta (só os outros apps do site), a versão nova assume na hora:
    // uma versão antiga não sabe das pastas novas e responderia por elas com a tela do Sexteto.
    const abertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (!abertas.some((c) => ehDoSexteto(new URL(c.url).pathname))) self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('sexteto-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // o app não faz requisições externas
  if (!ehDoSexteto(url.pathname)) return; // outros apps no mesmo site, com service worker próprio
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' && /^(index\.html)?$/.test(url.pathname.slice(ESCOPO.length)) ? await c.match('index.html') || await c.match('./') : null);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      // fotos que o dono colocar em assets/img/minhas entram no cache ao serem vistas
      if (res.ok && url.pathname.includes('/assets/img/minhas/')) c.put(req, res.clone());
      return res;
    } catch {
      return new Response('Sem conexão.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
