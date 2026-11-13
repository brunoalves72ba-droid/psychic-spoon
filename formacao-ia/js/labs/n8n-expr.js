// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Laboratório de expressões do n8n: {{ $json.campo }} calculado sobre um item, como no editor.
import { h, clear } from '../core/ui.js';
import { marco } from '../core/estado.js';
import { missao, semMissao } from './comum.js';

export const ITEM = { nome: 'Ana', nota: 8.5, curso: { titulo: 'IA Generativa', horas: 96 }, tags: ['iniciante', 'n8n'] };

/** Avalia o subconjunto de expressões que o laboratório entende. Devolve { ok, valor } ou { ok:false, erro }. */
export function avaliar(expr, item, agora = new Date()) {
  const e = expr.trim();
  if (e === '$now') return { ok: true, valor: agora.toISOString().slice(0, 19) };
  const m = e.match(/^\$json((?:\.[A-Za-z_À-ÿ][\wÀ-ÿ]*|\[\d+\])*)(\.(toUpperCase|toLowerCase|trim)\(\)|\.length)?$/);
  if (!m) return { ok: false, erro: e.startsWith('json') ? 'Faltou o $ antes de json.' : 'Este simulador entende $json.campo, $json.a.b, $json.lista[0], .toUpperCase(), .length e $now.' };
  let v = item;
  for (const p of m[1].match(/\.[^.[]+|\[\d+\]/g) || []) { if (v == null) { v = undefined; break; } v = p[0] === '[' ? v[+p.slice(1, -1)] : v[p.slice(1)]; }
  if (m[2] && v != null) v = m[3] ? (typeof v === 'string' ? v[m[3]]() : undefined) : v.length;
  return { ok: true, valor: v };
}
/** Troca cada {{ … }} do modelo pelo valor calculado. */
export function preencher(modelo, item) {
  let erro = null;
  const texto = modelo.replace(/\{\{([^}]*)\}\}/g, (_, ex) => { const r = avaliar(ex, item); if (!r.ok) { erro = r.erro; return '[erro]'; } return r.valor === undefined ? 'undefined' : typeof r.valor === 'object' ? JSON.stringify(r.valor) : String(r.valor); });
  return { texto, erro };
}

export default function ({ missao: m, feito }) {
  const mi = m ? missao(['Produza exatamente **Olá, Ana!**', 'Produza o **título do curso**: IA Generativa.'], feito) : semMissao();
  const inp = h('input.inp.mono', { type: 'text', value: 'Olá, {{ $json.Nome }}!', spellcheck: false, autocapitalize: 'off', 'aria-label': 'Valor do campo, no modo Expression' });
  inp.setAttribute('autocorrect', 'off');
  const out = h('div.why', { role: 'status' });
  const pintar = () => {
    const r = preencher(inp.value, ITEM);
    clear(out);
    if (r.erro) { out.className = 'why no'; out.append(h('b', 'Expressão não reconhecida. '), r.erro); return; }
    out.className = 'why' + (/undefined/.test(r.texto) ? ' no' : ' ok');
    out.append(h('b', 'Resultado: '), r.texto);
    if (/undefined/.test(r.texto)) out.append(h('div.small', 'undefined = caminho errado. Confira maiúsculas e o nome exato do campo no item.'));
    if (/\{\{/.test(inp.value)) {
      if (r.texto === 'Olá, Ana!') { mi.marcar(0); marco('n8n'); }
      if (r.texto.trim() === 'IA Generativa') mi.marcar(1);
    }
  };
  inp.addEventListener('input', pintar); pintar();
  return h('div.lab', mi.el,
    h('div.small.muted', 'Item que chegou ao nó (painel Input):'), h('pre.jtree', JSON.stringify(ITEM, null, 2)),
    h('label.field', h('span', 'Campo no modo Expression'), inp), out,
    h('p.small.muted', 'Dica: o texto fora das chaves é fixo; o que está dentro de {{ }} é calculado para cada item.'));
}
