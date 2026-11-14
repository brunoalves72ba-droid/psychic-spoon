// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Sincronização entre aparelhos por um Gist secreto do GitHub, com o conteúdo cifrado.
// - O token (permissão só de “gist”) fica apenas neste aparelho; o mesmo token no outro aparelho acha o mesmo Gist.
// - O conteúdo é cifrado (AES-GCM) com uma chave derivada do token: quem só tiver o link do Gist não consegue ler.
// - Ler → mesclar → gravar: nada se perde quando os dois aparelhos estudam sem internet.
import { L, salvarLocal, lerTudo, aplicar, aoSalvar } from './estado.js';
import { mesclarKv, mesclarLog } from './mesclar.js';

export const API = 'https://api.github.com';
export const ARQUIVO = 'formacao-ia-sync.json';
export const LINK_TOKEN = 'https://github.com/settings/tokens/new?scopes=gist&description=Forma%C3%A7%C3%A3o%20IA%20(sincroniza%C3%A7%C3%A3o)';

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function chave(token, sal) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(token), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: sal, iterations: 150000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function cifrar(dados, token) {
  const sal = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const k = await chave(token, sal);
  const c = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(JSON.stringify(dados)));
  return JSON.stringify({ app: 'formacao-ia', v: 1, sal: b64(sal), iv: b64(iv), dados: b64(c) });
}
export async function decifrar(texto, token) {
  const o = JSON.parse(texto);
  if (o.app !== 'formacao-ia' || !o.dados) throw new Error('O arquivo da nuvem não é deste app.');
  const k = await chave(token, deB64(o.sal));
  try { return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(o.iv) }, k, deB64(o.dados)))); }
  catch { const e = new Error('Os dados da nuvem foram gravados com outro token.'); e.outroToken = true; throw e; }
}

async function gh(caminho, { metodo = 'GET', corpo, token } = {}) {
  let r;
  try {
    r = await fetch(API + caminho, { method: metodo, cache: 'no-store', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', ...(corpo ? { 'Content-Type': 'application/json' } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined });
  } catch { const e = new Error('Sem conexão. Sincroniza quando a internet voltar.'); e.offline = true; throw e; }
  if (r.status === 401) throw new Error('Token inválido ou expirado. Gere outro e cole aqui.');
  if (r.status === 403 || r.status === 404) throw new Error(r.status === 404 ? 'Gist não encontrado. Ele pode ter sido apagado.' : 'O token não tem permissão de gist, ou o GitHub limitou os pedidos. Tente de novo em alguns minutos.');
  if (!r.ok) throw new Error(`O GitHub respondeu ${r.status}.`);
  return r.json();
}
async function conteudo(gist, token) {
  const f = gist.files && gist.files[ARQUIVO];
  if (!f) return null;
  if (!f.truncated) return f.content;
  const r = await fetch(f.raw_url, { cache: 'no-store' }); return r.text();
}
/** Procura nos gists da conta o arquivo deste app. */
async function acharGist(token) {
  for (let pag = 1; pag <= 5; pag++) {
    const lista = await gh(`/gists?per_page=100&page=${pag}`, { token });
    const g = lista.find((x) => x.files && x.files[ARQUIVO]);
    if (g) return g.id;
    if (lista.length < 100) return null;
  }
  return null;
}

// ---------- estado da sincronização ----------
let rodando = null, timer = 0, pendente = false;
const ouvintes = new Set();
export const status = () => ({ ligado: !!(L.nuvem && L.nuvem.token), ...L.nuvem, token: undefined, rodando: !!rodando });
export const aoMudar = (fn) => { ouvintes.add(fn); return () => ouvintes.delete(fn); };
const avisar = () => { for (const fn of ouvintes) { try { fn(status()); } catch {} } };
let aoAplicar = () => {};
/** Quem chama (o app) decide como redesenhar a tela depois de receber dados do outro aparelho. */
export const quandoReceber = (fn) => { aoAplicar = fn; };

/**
 * Sincroniza agora: lê a nuvem, mescla com o que está aqui, grava os dois lados.
 * Devolve { recebeu: true } quando chegou algo novo do outro aparelho.
 */
export function sincronizar() {
  if (!L.nuvem || !L.nuvem.token) return Promise.resolve({ recebeu: false });
  if (rodando) { pendente = true; return rodando; }
  rodando = (async () => {
    const token = L.nuvem.token;
    let recebeu = false;
    try {
      if (!L.nuvem.gist) { L.nuvem.gist = await acharGist(token); await salvarLocal(); }
      const local = await lerTudo();
      let remoto = null;
      if (L.nuvem.gist) {
        const g = await gh(`/gists/${L.nuvem.gist}`, { token });
        const txt = await conteudo(g, token);
        if (txt) remoto = await decifrar(txt, token);
      }
      const kv = remoto ? mesclarKv(local.kv, remoto.kv) : local.kv;
      const log = remoto ? mesclarLog(local.log, remoto.log) : local.log;
      recebeu = !!remoto && (JSON.stringify(kv) !== JSON.stringify(mesclarKv(local.kv, local.kv)) || log.length !== local.log.length);
      if (recebeu) { await aplicar(kv, log); }
      const pacote = await cifrar({ kv, log, dispositivo: L.dispositivo, quando: new Date().toISOString() }, token);
      const files = { [ARQUIVO]: { content: pacote } };
      if (L.nuvem.gist) await gh(`/gists/${L.nuvem.gist}`, { metodo: 'PATCH', corpo: { files }, token });
      else { const g = await gh('/gists', { metodo: 'POST', corpo: { description: 'Formação IA: sincronização entre aparelhos (conteúdo cifrado)', public: false, files }, token }); L.nuvem.gist = g.id; }
      L.nuvem.ult = new Date().toISOString(); L.nuvem.erro = '';
      await salvarLocal();
      if (recebeu) aoAplicar();
    } catch (e) {
      L.nuvem.erro = e.message; L.nuvem.offline = !!e.offline; L.nuvem.outroToken = !!e.outroToken;
      await salvarLocal();
    } finally {
      rodando = null; avisar();
      if (pendente) { pendente = false; agendar(1000); }
    }
    return { recebeu };
  })();
  avisar();
  return rodando;
}

/** Agenda um envio depois de alguns segundos sem mudanças (junta várias gravações num pedido só). */
export function agendar(ms = 6000) {
  if (!L.nuvem || !L.nuvem.token) return;
  clearTimeout(timer); timer = setTimeout(() => sincronizar(), ms);
}

export async function conectar(token) {
  L.nuvem = { token: token.trim(), gist: null, ult: null, erro: '' };
  await salvarLocal();
  return sincronizar();
}
export async function desconectar() { L.nuvem = {}; await salvarLocal(); avisar(); }
/** Quando o Gist tem dados de outro token: recomeça a nuvem a partir deste aparelho. */
export async function recomecarNuvem() { L.nuvem.gist = null; L.nuvem.erro = ''; L.nuvem.outroToken = false; await salvarLocal(); return sincronizar(); }

let iniciado = false;
/** Liga a sincronização automática: ao abrir, ao gravar, ao voltar para o app e a cada 5 minutos. */
export function iniciar() {
  if (iniciado) return; iniciado = true;
  aoSalvar(() => agendar());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') agendar(500); else if (timer) { clearTimeout(timer); sincronizar(); } });
  window.addEventListener('online', () => agendar(500));
  setInterval(() => { if (document.visibilityState === 'visible') sincronizar(); }, 5 * 60 * 1000);
  agendar(300);
}
