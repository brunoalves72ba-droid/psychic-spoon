// Sincronização entre os celulares do casal por um Gist secreto do GitHub, com o conteúdo cifrado.
// (Mesma técnica do app Formação IA.)
// - A chave de acesso (token, permissão só de "gist") fica só nos celulares; nunca vai para o Gist.
// - O conteúdo é cifrado (AES-GCM, chave derivada do token): quem tiver só o link do Gist não lê nada.
// - Ler → juntar → gravar: nada se perde quando os dois lançam sem internet.
import { dados, aparelho, salvarAparelho, aplicarMesclado, registrarAparelho, salvar, aoMudar as aoMudarDados } from './store.js';
import { mesclar, paraNuvem } from './mesclar.js';

export const API = 'https://api.github.com';
export const ARQUIVO = 'financas-casal.json';
export const LINK_TOKEN = 'https://github.com/settings/tokens/new?scopes=gist&description=Finan%C3%A7as%20do%20casal%20(sincroniza%C3%A7%C3%A3o)';

export const estavel = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((c) => [c, x[c]])) : x));
const b64 = (buf) => { let s = ''; for (const c of new Uint8Array(buf)) s += String.fromCharCode(c); return btoa(s); };
const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function chave(token, sal) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(token), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: sal, iterations: 150000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function cifrar(conteudo, token) {
  const sal = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const k = await chave(token, sal);
  const c = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(JSON.stringify(conteudo)));
  return JSON.stringify({ app: 'financas', v: 1, sal: b64(sal), iv: b64(iv), dados: b64(c) });
}
export async function decifrar(texto, token) {
  const o = JSON.parse(texto);
  if (o.app !== 'financas' || !o.dados) throw new Error('O arquivo da nuvem não é deste app.');
  const k = await chave(token, deB64(o.sal));
  try { return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(o.iv) }, k, deB64(o.dados)))); }
  catch { const e = new Error('Os dados da nuvem foram gravados com outra chave de acesso.'); e.outraChave = true; throw e; }
}

async function gh(caminho, { metodo = 'GET', corpo, token } = {}) {
  let r;
  try {
    r = await fetch(API + caminho, { method: metodo, cache: 'no-store', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', ...(corpo ? { 'Content-Type': 'application/json' } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined });
  } catch { const e = new Error('Sem conexão. Sincroniza quando a internet voltar.'); e.offline = true; throw e; }
  if (r.status === 401) throw new Error('Chave de acesso inválida ou vencida. Gere outra no GitHub.');
  if (r.status === 404) throw new Error('Arquivo da nuvem não encontrado. Ele pode ter sido apagado.');
  if (r.status === 403) throw new Error('A chave não tem permissão de gist, ou o GitHub limitou os pedidos. Tente de novo em alguns minutos.');
  if (!r.ok) throw new Error(`O GitHub respondeu ${r.status}.`);
  return r.json();
}
async function conteudo(gist) {
  const f = gist.files && gist.files[ARQUIVO];
  if (!f) return null;
  if (!f.truncated) return f.content;
  const r = await fetch(f.raw_url, { cache: 'no-store' }); return r.text();
}
async function acharGist(token) {
  for (let pag = 1; pag <= 5; pag++) {
    const lista = await gh(`/gists?per_page=100&page=${pag}`, { token });
    const g = lista.find((x) => x.files && x.files[ARQUIVO]);
    if (g) return g.id;
    if (lista.length < 100) return null;
  }
  return null;
}

// ---------- estado da sincronização (fica em aparelho().nuvem) ----------
let rodando = null, timer = 0, pendente = false, aplicando = false;
const ouvintes = new Set();
const nuvem = () => aparelho().nuvem || {};
const gravar = (muda) => salvarAparelho({ nuvem: { ...nuvem(), ...muda } });
export const status = () => ({ ligado: !!nuvem().token, gist: nuvem().gist, ult: nuvem().ult, erro: nuvem().erro, outraChave: !!nuvem().outraChave, rodando: !!rodando });
export const aoMudar = (fn) => { ouvintes.add(fn); return () => ouvintes.delete(fn); };
const avisar = () => { for (const fn of ouvintes) { try { fn(status()); } catch {} } };
let aoReceber = () => {};
/** O app decide como redesenhar a tela quando chegam dados do outro celular. */
export const quandoReceber = (fn) => { aoReceber = fn; };

/** Modelo do celular (ex.: "SM-A546E"), quando o navegador informa. */
export async function lerModelo() {
  try { const v = await navigator.userAgentData?.getHighEntropyValues?.(['model']); if (v?.model) return v.model; } catch {}
  const m = (navigator.userAgent || '').match(/Android [\d.]+; ([^;)]+)\)/);
  return m && m[1] !== 'K' ? m[1].trim() : 'Android';
}

/** Lê a nuvem, junta com o que está aqui e grava dos dois lados. */
export function sincronizar() {
  const token = nuvem().token;
  if (!token) return Promise.resolve({ recebeu: false });
  if (rodando) { pendente = true; return rodando; }
  rodando = (async () => {
    let recebeu = false;
    try {
      if (!nuvem().gist) gravar({ gist: await acharGist(token) });
      let remoto = null;
      if (nuvem().gist) {
        const txt = await conteudo(await gh(`/gists/${nuvem().gist}`, { token }));
        if (txt) remoto = (await decifrar(txt, token)).estado;
      }
      registrarAparelho({ ult: new Date().toISOString() });
      const local = dados();
      const junto = remoto ? mesclar(local, remoto) : local;
      recebeu = !!remoto && estavel(paraNuvem(junto)) !== estavel(paraNuvem(local));
      if (recebeu) { aplicando = true; aplicarMesclado(junto); aplicando = false; } else salvar(undefined, { quieto: true });
      const pacote = await cifrar({ estado: paraNuvem(dados()), aparelho: aparelho().id, quando: new Date().toISOString() }, token);
      const files = { [ARQUIVO]: { content: pacote } };
      if (nuvem().gist) await gh(`/gists/${nuvem().gist}`, { metodo: 'PATCH', corpo: { files }, token });
      else { const g = await gh('/gists', { metodo: 'POST', corpo: { description: 'Finanças do casal: sincronização (conteúdo cifrado)', public: false, files }, token }); gravar({ gist: g.id }); }
      gravar({ ult: new Date().toISOString(), erro: '', offline: false, outraChave: false });
      if (recebeu) aoReceber();
    } catch (e) {
      aplicando = false;
      gravar({ erro: e.message, offline: !!e.offline, outraChave: !!e.outraChave });
    } finally {
      rodando = null; avisar();
      if (pendente) { pendente = false; agendar(1000); }
    }
    return { recebeu };
  })();
  avisar();
  return rodando;
}

/** Junta várias gravações seguidas num envio só. */
export function agendar(ms = 4000) {
  if (!nuvem().token) return;
  clearTimeout(timer); timer = setTimeout(() => sincronizar(), ms);
}

export async function conectar(token, gist = null) {
  gravar({ token: token.trim(), gist: gist || null, ult: null, erro: '' });
  salvarAparelho({ modelo: aparelho().modelo || await lerModelo() });
  return sincronizar();
}
export function desconectar() { salvarAparelho({ nuvem: {} }); avisar(); }

/** Link de convite: abre o Finanças no outro celular já com a chave (vai depois do #, não passa por servidor). */
export function linkConvite(base = location.origin + location.pathname) {
  const { token, gist } = nuvem();
  if (!token) return '';
  const c = btoa(JSON.stringify({ t: token, g: gist || '' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${base}#/conectar?c=${c}`;
}
export function lerConvite(c) {
  try {
    const o = JSON.parse(atob(String(c).replace(/-/g, '+').replace(/_/g, '/')));
    return o && o.t ? { token: o.t, gist: o.g || null } : null;
  } catch { return null; }
}

let iniciado = false;
/** Liga a sincronização automática: ao abrir, ao gravar, ao voltar para o app e a cada 5 minutos. */
export function iniciar() {
  if (iniciado) return; iniciado = true;
  aoMudarDados(() => { if (!aplicando) agendar(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') agendar(500); else if (timer) { clearTimeout(timer); sincronizar(); } });
  addEventListener('online', () => agendar(500));
  setInterval(() => { if (document.visibilityState === 'visible') sincronizar(); }, 5 * 60 * 1000);
  agendar(300);
}
