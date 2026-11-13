// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Estado do app em memória (carregado uma vez, gravado a cada mudança) e as ações de estudo.
import { kv, log as logdb } from './store.js';
import { hoje } from './dia.js';
import * as srs from './srs.js';
import { novaSequencia, fechar } from './sequencia.js';
import { novoAndaime, registrar as regAndaime } from './andaime.js';

export const XP = { quiz: 5, ex: 10, licao: 20, revisita: 5, cartao: 2, mistura: 3, mao: 15, missaoItem: 10, missao: 50, semanal: 20, diario: 5, desafio: 30 };
export const XP_NIVEL = 250;
export const nivel = (xp) => 1 + Math.floor(xp / XP_NIVEL);

const PADRAO = () => ({
  perfil: { criado: null, plano: null, inicio: null, alvo: 5, tema: 'auto', boasVindas: false },
  licoes: {},      // id → { p: passo atual, feita: dia, quiz: [bool], ex: {ok, tent}, mao: 'feito'|'depois', ini: dia }
  cartoes: {},     // id → { s, due, n, l, u }
  meus: [],        // cartões importados: { id, f, v }
  dias: {},        // dia → { l: lições, c: cartões, m: missões, p: passos, s: segundos }
  semana: novaSequencia(),
  xp: 0,
  conquistas: {},  // id → dia
  marcos: {},      // primeira vez de cada habilidade: json, api200, python, rag… → dia
  diario: [],      // { d, t }
  pensamentos: [], // { id, d, t, ok }
  missoes: {},     // id da missão → { itens: {i: true}, feita: dia }
  ficha: {},       // ficha técnica do APE-IA (M1)
  prompts: [],     // biblioteca de prompts (M2)
  fichaViva: {},   // id → { conferido: dia, nota }
  semanais: [],    // revisões semanais
  andaime: novoAndaime(),
  desafios: {},    // id → dia
  mistura: {},     // { ult: dia, n: quantas }
  sessao: {},      // { licao: id em andamento }
});

export const S = PADRAO();
export let revs = [];             // histórico de revisões (para medir retenção)
export let eventosSemana = [];    // semanas fechadas nesta abertura do app (para avisar com gentileza)

const pend = new Set();
let fila = Promise.resolve();
/** Grava as chaves informadas (agrupa chamadas seguidas). */
export function salvar(...chaves) {
  for (const k of chaves) pend.add(k);
  fila = fila.then(async () => {
    if (!pend.size) return;
    const ks = [...pend]; pend.clear();
    await Promise.all(ks.map((k) => kv.set(k, S[k])));
  }).catch((e) => console.error('Falha ao gravar:', e));
  return fila;
}
export const gravado = () => fila;

export async function carregar() {
  const all = await kv.all();
  const def = PADRAO();
  for (const k of Object.keys(def)) {
    const v = all[k];
    S[k] = v === undefined ? def[k] : (k === 'perfil' || k === 'semana' || k === 'andaime' ? { ...def[k], ...v } : v);
  }
  revs = (await logdb.all()).filter((x) => x.t === 'rev');
  if (!S.perfil.criado) { S.perfil.criado = hoje(); salvar('perfil'); }
  eventosSemana = fecharSemanas();
  return S;
}

export function fecharSemanas() {
  const { estado, eventos } = fechar(S.semana, S.dias, hoje());
  if (eventos.length) { S.semana = estado; salvar('semana'); }
  return eventos;
}

// ---------- ações ----------
export function tocarDia(campo = 'p', n = 1) {
  const d = hoje();
  const x = S.dias[d] || (S.dias[d] = {});
  x[campo] = (x[campo] || 0) + n;
  salvar('dias');
}
export function ganhar(n) { S.xp += n; salvar('xp'); return n; }
export function marco(id) { if (!S.marcos[id]) { S.marcos[id] = hoje(); salvar('marcos'); return true; } return false; }

export function prog(id) { return S.licoes[id] || (S.licoes[id] = { p: 0 }); }
export function irPasso(id, p) {
  const x = prog(id);
  if (!x.ini) x.ini = hoje();
  x.p = p;
  S.sessao.licao = id;
  tocarDia('p');
  salvar('licoes', 'sessao');
}
export function registrarQuiz(id, i, ok) {
  const x = prog(id);
  x.quiz = x.quiz || [];
  if (x.quiz[i] === undefined) { x.quiz[i] = !!ok; salvar('licoes'); return ok ? ganhar(XP.quiz) : 0; }
  return 0;
}
export function registrarExercicio(id, { dePrimeira, tent, andaime: usaAndaime }) {
  const x = prog(id);
  let g = 0;
  if (!x.ex || !x.ex.ok) { x.ex = { ok: true, tent: tent || 1 }; g = ganhar(XP.ex); if (usaAndaime) { S.andaime = regAndaime(S.andaime, dePrimeira); salvar('andaime'); } }
  salvar('licoes');
  return g;
}
/** Conclui a lição: cria os cartões (voltam amanhã), dá XP e marca o dia. quizN = nº de perguntas da lição. */
export function concluirLicao(id, quizN) {
  const x = prog(id);
  const d = hoje();
  const primeira = !x.feita;
  if (primeira) x.feita = d;
  x.p = 0;
  if (S.sessao.licao === id) delete S.sessao.licao;
  const novos = [];
  for (let i = 0; i < quizN; i++) { const cid = `${id}#${i}`; if (!S.cartoes[cid]) { S.cartoes[cid] = srs.novoCartao(d); novos.push(cid); } }
  const g = ganhar(primeira ? XP.licao : XP.revisita);
  if (primeira) tocarDia('l');
  logdb.add({ t: 'licao', lid: id, d, acertos: (x.quiz || []).filter(Boolean).length, total: quizN }).catch(() => {});
  salvar('licoes', 'cartoes', 'sessao');
  return { xp: g, novos, primeira };
}
export function marcarMao(id, estado) { // 'feito' | 'depois'
  const x = prog(id);
  const antes = x.mao;
  x.mao = estado; x.maoQuando = hoje();
  salvar('licoes');
  if (estado === 'feito' && antes !== 'feito') { tocarDia('m'); return ganhar(XP.mao); }
  return 0;
}
export const pendencias = () => Object.keys(S.licoes).filter((id) => S.licoes[id].mao === 'depois');

export function responderCartao(id, nota) {
  const c = S.cartoes[id];
  if (!c) return null;
  const d = hoje();
  const { cartao, log } = srs.responder(c, nota, d);
  S.cartoes[id] = cartao;
  const ev = { t: 'rev', cid: id, d, ...log };
  revs.push(ev);
  logdb.add(ev).catch(() => {});
  tocarDia('c');
  ganhar(XP.cartao);
  salvar('cartoes');
  return cartao;
}
/** Cartões de hoje respeitando o teto diário (o que já foi respondido hoje desconta). extra = "mais alguns" pedidos na hora. */
export function filaDeHoje(extra = 0) {
  const d = hoje();
  const feitos = (S.dias[d] && S.dias[d].c) || 0;
  return srs.fila(S.cartoes, d, Math.max(0, srs.TETO - feitos) + extra);
}
export const vencidosHoje = () => srs.vencidos(S.cartoes, hoje());

export function adicionarMeus(lista) { // [{f, v}]
  const d = hoje(); let n = 0;
  const base = S.meus.reduce((m, c) => Math.max(m, +String(c.id).slice(1) || 0), 0);
  for (const c of lista) {
    const f = String(c.f || '').trim(), v = String(c.v || '').trim();
    if (!f || !v) continue;
    const id = 'u' + (base + ++n);
    S.meus.push({ id, f, v });
    S.cartoes[id] = srs.novoCartao(d);
  }
  if (n) salvar('meus', 'cartoes');
  return n;
}
export function removerMeu(id) { S.meus = S.meus.filter((c) => c.id !== id); delete S.cartoes[id]; salvar('meus', 'cartoes'); }

export function anotarPensamento(texto) {
  const t = String(texto || '').trim();
  if (!t) return false;
  S.pensamentos.unshift({ id: Date.now(), d: hoje(), t, ok: false });
  salvar('pensamentos');
  return true;
}
export function escreverDiario(texto) {
  const t = String(texto || '').trim();
  if (!t) return 0;
  S.diario.unshift({ d: hoje(), t });
  salvar('diario');
  tocarDia('p');
  return ganhar(XP.diario);
}
export function marcarMissao(mid, i, on, total) {
  const m = S.missoes[mid] || (S.missoes[mid] = { itens: {} });
  let g = 0;
  if (on && !m.itens[i]) { m.itens[i] = true; g += ganhar(XP.missaoItem); tocarDia('m'); } else if (!on) delete m.itens[i];
  const feitos = Object.keys(m.itens).length;
  if (feitos >= total && !m.feita) { m.feita = hoje(); g += ganhar(XP.missao); } else if (feitos < total) delete m.feita;
  salvar('missoes');
  return g;
}

// ---------- backup ----------
export async function exportar() {
  await gravado();
  return { app: 'formacao-ia', esquema: 1, quando: new Date().toISOString(), kv: await kv.all(), log: await logdb.all() };
}
export async function importar(obj) {
  if (!obj || obj.app !== 'formacao-ia' || typeof obj.kv !== 'object') throw new Error('Este arquivo não é um backup do Formação IA.');
  if (obj.esquema > 1) throw new Error('Backup feito por uma versão mais nova do app.');
  await gravado();
  await kv.clear();
  for (const [k, v] of Object.entries(obj.kv)) await kv.set(k, v);
  await logdb.replace(Array.isArray(obj.log) ? obj.log : []);
  await carregar();
}
export async function apagarTudo() { await gravado(); await kv.clear(); await logdb.clear(); await carregar(); }
