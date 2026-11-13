// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Service worker: pré-cache de tudo na primeira visita; depois, o app funciona offline.
importScripts('sw-assets.js'); // define self.FIA_VERSION e self.FIA_ASSETS

const CACHE = 'formacao-ia-' + self.FIA_VERSION;

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(self.FIA_ASSETS.map(async (u) => {
      const res = await fetch(new Request(u, { cache: 'reload' }));
      if (!res.ok) throw new Error('pré-cache falhou: ' + u);
      await c.put(u, res);
    }));
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('formacao-ia-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // chamadas externas (só o tutor opcional) passam direto
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await c.match('index.html') || await c.match('./') : null);
    if (hit) return hit;
    try { return await fetch(req); }
    catch { return new Response('Sem conexão.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
  })());
});
