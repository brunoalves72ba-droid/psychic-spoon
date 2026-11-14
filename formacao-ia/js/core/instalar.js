// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Instalação como app próprio (ícone separado do Sexteto) e tudo guardado no aparelho para usar sem internet.

let pedido = null;
const ouvintes = new Set();
export const aoMudar = (fn) => { ouvintes.add(fn); return () => ouvintes.delete(fn); };
const avisar = () => { for (const fn of ouvintes) { try { fn(); } catch {} } };

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); pedido = e; avisar(); });
  window.addEventListener('appinstalled', () => { pedido = null; avisar(); });
}

/** Aberto como app instalado (janela própria), e não numa aba do navegador. */
export const instalado = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
/** O navegador ofereceu o botão de instalar (Chrome e Edge no Android e no PC). */
export const podeInstalar = () => !!pedido;
export const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export async function instalar() {
  if (!pedido) return false;
  pedido.prompt();
  const r = await pedido.userChoice.catch(() => ({ outcome: 'dismissed' }));
  pedido = null; avisar();
  return r.outcome === 'accepted';
}

/** Lista oficial de arquivos do app (a mesma que o service worker guarda). */
async function lista() {
  const t = await (await fetch('sw-assets.js', { cache: 'no-store' })).text();
  return { versao: t.match(/FIA_VERSION = '([^']+)'/)[1], arquivos: JSON.parse(t.match(/FIA_ASSETS = (\[.*\])/)[1]) };
}

/** Quantos arquivos do app já estão guardados no aparelho. */
export async function situacaoOffline() {
  if (!('caches' in window)) return { suportado: false };
  try {
    const { versao, arquivos } = await lista();
    const c = await caches.open('formacao-ia-' + versao);
    const tem = await c.keys();
    const nomes = new Set(tem.map((r) => new URL(r.url).pathname.replace(/^.*\/formacao-ia\//, '')));
    const faltam = arquivos.filter((a) => !nomes.has(a === './' ? '' : a));
    const persistente = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : null;
    const uso = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null;
    return { suportado: true, total: arquivos.length, guardados: arquivos.length - faltam.length, faltam, persistente, usoMB: uso ? uso.usage / 1048576 : null };
  } catch (e) { return { suportado: true, erro: String(e.message || e) }; }
}

/** Baixa o que faltar e pede ao navegador para não apagar os dados do app. */
export async function guardarTudo(progresso) {
  const { versao, arquivos } = await lista();
  const c = await caches.open('formacao-ia-' + versao);
  let n = 0, falhas = 0;
  for (const a of arquivos) {
    try { if (!(await c.match(a))) { const r = await fetch(a, { cache: 'reload' }); if (r.ok) await c.put(a, r); else falhas++; } }
    catch { falhas++; }
    n++; if (progresso) progresso(n, arquivos.length);
  }
  let persistente = false;
  try { if (navigator.storage && navigator.storage.persist) persistente = await navigator.storage.persist(); } catch {}
  return { falhas, persistente };
}
