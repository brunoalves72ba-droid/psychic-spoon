// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Importar cartões: JSON [{frente, verso}] ou CSV (frente;verso), inclusive os gerados pela Fábrica de flashcards.
import { h, clear, top, toast, confirmSheet, plural } from '../core/ui.js';
import { S, adicionarMeus, removerMeu } from '../core/estado.js';
import { analisar } from '../core/json-pt.js';

/** Lê o texto e devolve { cartoes: [{f, v}], erro }. Aceita JSON (lista ou {cartoes|flashcards: [...]}) e CSV com ; , ou tab. */
export function lerCartoes(texto) {
  const t = String(texto).replace(/^﻿/, '').trim();
  if (!t) return { cartoes: [], erro: 'Está vazio.' };
  const pega = (o) => ({ f: o.frente ?? o.front ?? o.pergunta ?? o.question ?? o.f, v: o.verso ?? o.back ?? o.resposta ?? o.answer ?? o.v });
  if (t[0] === '[' || t[0] === '{') {
    const r = analisar(t);
    if (!r.ok) return { cartoes: [], erro: `JSON inválido (linha ${r.linha}): ${r.msg}` };
    const lista = Array.isArray(r.valor) ? r.valor : r.valor.cartoes || r.valor.flashcards || [];
    return { cartoes: lista.map(pega).filter((c) => c.f && c.v).map((c) => ({ f: String(c.f), v: String(c.v) })), erro: null };
  }
  const linhas = t.split(/\r?\n/).filter((l) => l.trim());
  const sep = [';', '\t', ','].find((s) => linhas[0].includes(s));
  if (!sep) return { cartoes: [], erro: 'Não achei o separador. Use frente;verso em cada linha.' };
  const campos = (l) => { const out = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const c = l[i]; if (c === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (c === sep && !q) { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out.map((x) => x.trim()); };
  let rows = linhas.map(campos);
  if (/^(frente|front|pergunta|question)$/i.test(rows[0][0])) rows = rows.slice(1);
  return { cartoes: rows.filter((r) => r.length >= 2 && r[0] && r[1]).map((r) => ({ f: r[0], v: r[1] })), erro: null };
}

export default async function (el) {
  const ta = h('textarea.mono', { rows: 6, placeholder: 'frente;verso\nO que é um token?;Um pedaço de texto.', 'aria-label': 'Cartões em CSV ou JSON' });
  const arquivo = h('input', { type: 'file', accept: '.csv,.json,.txt,text/csv,application/json', 'aria-label': 'Escolher arquivo', class: 'inp', onchange: async () => { const f = arquivo.files[0]; if (f) { ta.value = await f.text(); previa(); } } });
  const msg = h('div.why.hide', { role: 'status' });
  const lista = h('div.list');
  let pendentes = [];
  const bImp = h('button.btn.primary.block', { type: 'button', disabled: true, onclick: () => { const n = adicionarMeus(pendentes); toast(`${plural(n, 'cartão importado', 'cartões importados')}. Eles voltam amanhã na revisão.`); ta.value = ''; pendentes = []; bImp.disabled = true; msg.className = 'why hide'; pintar(); } }, 'Importar');
  function previa() {
    const r = lerCartoes(ta.value);
    pendentes = r.cartoes;
    msg.className = 'why ' + (r.erro || !r.cartoes.length ? 'no' : 'ok');
    msg.textContent = r.erro || (r.cartoes.length ? `${plural(r.cartoes.length, 'cartão pronto', 'cartões prontos')}. Primeiro: “${r.cartoes[0].f}”.` : 'Nenhum cartão encontrado. Cada linha precisa de frente e verso.');
    bImp.disabled = !r.cartoes.length;
  }
  ta.addEventListener('input', previa);
  function pintar() {
    clear(lista);
    if (!S.meus.length) return;
    lista.append(h('h3', `Seus cartões importados (${S.meus.length})`));
    for (const c of S.meus.slice(-50).reverse()) lista.append(h('div.card.flat.tight.row.top-al', h('div.grow', h('b', c.f), h('div.small.dim', c.v)),
      h('button.btn.quiet.small', { type: 'button', 'aria-label': 'Apagar cartão', onclick: async () => { if (await confirmSheet('Apagar este cartão?', 'Apagar')) { removerMeu(c.id); pintar(); } } }, 'Apagar')));
  }
  el.append(top('Importar cartões', '#/revisar'),
    h('p.dim', 'Cole ou escolha um arquivo CSV (frente;verso, uma linha por cartão) ou JSON (uma lista com frente e verso). O CSV da Fábrica de flashcards entra direto.'),
    arquivo, ta, msg, bImp, lista);
  pintar();
}
