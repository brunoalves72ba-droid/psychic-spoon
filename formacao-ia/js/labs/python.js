// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Python de bolso: rodar código, conferir com testes e o exercício de editor com dicas.
import { h, clear, put, rich, codeBlock, toast } from '../core/ui.js';
import { marco } from '../core/estado.js';
import { limparErro } from './python-texto.js';
export { limparErro };

const LIMITE_MS = 4000;
let worker = null, seq = 0, carregado = false;
const espera = new Map();

function iniciar() {
  worker = new Worker(new URL('./py-worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = (e) => { carregado = true; const p = espera.get(e.data.id); if (p) { espera.delete(e.data.id); p(e.data); } };
  worker.onerror = (e) => { console.error('Python:', e.message); };
}

/** Roda o código. Devolve { texto, erro, dep }. */
export function rodar(codigo, entradas = [], { depois = '', eco = true } = {}) {
  if (!worker) iniciar();
  const id = ++seq;
  return new Promise((res) => {
    const t = setTimeout(() => {
      espera.delete(id); worker.terminate(); worker = null; carregado = false;
      res({ texto: 'O programa demorou demais (mais de 4 segundos) e foi interrompido. Há um laço que não termina?', erro: true, dep: '' });
    }, carregado ? LIMITE_MS : LIMITE_MS + 12000); // a primeira execução também carrega o Python
    espera.set(id, (r) => { clearTimeout(t); res({ ...r, texto: r.erro ? limparErro(r.texto) : r.texto }); });
    worker.postMessage({ id, codigo, entradas, depois, eco });
  });
}

const norm = (s) => String(s).replace(/\r/g, '').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').trim();

/** Testes: { saida } (saída exata), { re, msg }, { entradas }, { depois: 'expressão', msg }. */
export async function rodarTestes(codigo, testes) {
  const itens = [];
  for (const t of testes) {
    const r = await rodar(codigo, t.entradas || [], { depois: t.depois || '', eco: false });
    let ok = !r.erro, msg = '';
    if (r.erro) msg = 'O programa parou com erro.';
    else if (t.saida != null && norm(r.texto) !== norm(t.saida)) { ok = false; msg = `Era para mostrar: ${t.saida.replace(/\n/g, ' ⏎ ')}`; }
    else if (t.re && !new RegExp(t.re).test(norm(r.texto))) { ok = false; msg = t.msg || 'A saída não está no formato pedido.'; }
    else if (t.depois && r.dep !== 'sim') { ok = false; msg = t.msg || `O teste ${t.depois} não passou.`; }
    itens.push({ ok, msg, texto: r.texto, entradas: t.entradas || [] });
    if (r.erro) break; // um erro de sintaxe falharia em todos: mostra um só
  }
  return { ok: itens.every((x) => x.ok) && itens.length === testes.length, itens };
}

export function relatorio(r) {
  const box = h('div.col', { style: { gap: '6px' } });
  if (r.ok) { box.append(h('div', h('b', 'Passou em todos os testes. '), `${r.itens.length === 1 ? 'O teste conferiu' : `Os ${r.itens.length} testes conferiram`} a saída do seu programa.`)); return box; }
  const f = r.itens.find((x) => !x.ok);
  put(box, h('b', 'Ainda não. '), f.entradas.length ? h('div.small', `Teste com as entradas: ${f.entradas.join(', ')}`) : null, h('div', f.msg),
    f.texto ? h('pre', { style: { whiteSpace: 'pre-wrap', margin: '4px 0 0', fontSize: '.86rem', fontFamily: 'var(--mono)' } }, 'Seu programa mostrou:\n' + f.texto) : null);
  return box;
}

/** Editor com Rodar, testes e dicas em degraus (dica 1, dica 2, solução). */
export function exercicioPython(ex, feito, ctx = {}) {
  const inicio = ex.inicio != null ? ex.inicio : ex.molde ? ex.molde.replace(/⟦\d:([^⟧]*)⟧/g, '___') : '';
  const ed = h('textarea.editor', { value: inicio, spellcheck: false, autocapitalize: 'off', autocomplete: 'off', 'aria-label': 'Editor de código Python', rows: Math.max(6, inicio.split('\n').length + 2) });
  ed.setAttribute('autocorrect', 'off');
  ed.addEventListener('keydown', (e) => { if (e.key === 'Tab') { e.preventDefault(); const s = ed.selectionStart; ed.setRangeText('    ', s, ed.selectionEnd, 'end'); } });
  const saida = h('div.saida', { role: 'status' }, h('span.dim', 'A saída aparece aqui.'));
  const msg = h('div.why.hide', { role: 'status' });
  let tent = 0, dicaN = 0, fim = false;
  const dicas = ex.dicas || [];
  const solucao = ex.solucao || (ex.molde ? ex.molde.replace(/⟦\d:([^⟧¦]*)(¦[^⟧]*)?⟧/g, '$1') : '');
  const caixaDicas = h('div.dicas');
  const bDica = h('button.btn.quiet.small', { type: 'button', onclick: () => {
    if (dicaN < dicas.length) { caixaDicas.append(h('div.callout.dica', h('span.rot', `Dica ${dicaN + 1}`), rich(dicas[dicaN]))); dicaN++; }
    else if (solucao) { caixaDicas.append(h('div.small.muted', 'Uma solução possível:'), codeBlock(solucao, 'python')); bDica.classList.add('hide'); if (!fim) { fim = true; feito({ dePrimeira: false, tent, ajuda: true }); } return; }
    bDica.textContent = dicaN < dicas.length ? `Dica ${dicaN + 1}` : 'Ver uma solução';
  } }, dicas.length ? 'Dica 1' : 'Ver uma solução');
  const bRodar = h('button.btn.small', { type: 'button', onclick: async () => {
    bRodar.disabled = true; clear(saida).append(h('span.dim', 'Rodando…'));
    const ent = (ex.testes && ex.testes[0] && ex.testes[0].entradas) || [];
    const r = await rodar(ed.value, ent);
    saida.textContent = r.texto || '(o programa não mostrou nada)'; saida.classList.toggle('err', r.erro);
    bRodar.disabled = false;
  } }, '▶ Rodar');
  const bTestar = h('button.btn.primary.small', { type: 'button', onclick: async () => {
    tent++; bTestar.disabled = true;
    const r = await rodarTestes(ed.value, ex.testes || []);
    bTestar.disabled = false;
    clear(msg).append(relatorio(r)); msg.className = 'why ' + (r.ok ? 'ok' : 'no');
    if (r.ok) { marco('python'); bTestar.classList.add('hide'); if (!fim) { fim = true; feito({ dePrimeira: tent === 1 && dicaN === 0, tent }); } }
  } }, 'Conferir com os testes');
  return h('div.col',
    ex.enun ? h('div.enun', rich(ex.enun)) : null,
    ex.doZero ? h('div.small.muted', 'Sem andaime: escreva o programa inteiro. Os ___ marcam o que falta.') : null,
    h('div', ed, saida),
    h('div.row.wrap', bRodar, bTestar, bDica), msg, caixaDicas);
}

/** Laboratório livre (Trilha › Laboratórios › Python de bolso). */
export default function lab() {
  const EXEMPLOS = {
    'Olá': 'nome = input("Seu nome: ")\nprint(f"Olá, {nome}!")',
    'Média': 'notas = [7.5, 8, 6.5]\nprint(sum(notas) / len(notas))',
    'Aprovação': 'for nota in [8, 5.5, 3]:\n    if nota >= 7:\n        print(nota, "Aprovado")\n    elif nota >= 5:\n        print(nota, "Recuperação")\n    else:\n        print(nota, "Reprovado")',
    'JSON': 'import json\ncartao = json.loads(\'{"frente": "O que é token?", "verso": "Um pedaço de texto."}\')\nprint(cartao["frente"])',
  };
  const ed = h('textarea.editor', { value: EXEMPLOS['Olá'], spellcheck: false, rows: 9, 'aria-label': 'Editor de código Python' });
  ed.addEventListener('keydown', (e) => { if (e.key === 'Tab') { e.preventDefault(); ed.setRangeText('    ', ed.selectionStart, ed.selectionEnd, 'end'); } });
  const ent = h('input.inp', { type: 'text', value: 'Ana', placeholder: 'Entradas do input(), separadas por vírgula', 'aria-label': 'Entradas para o input()' });
  const saida = h('div.saida', h('span.dim', 'A saída aparece aqui.'));
  const sel = h('select', { 'aria-label': 'Exemplos', onchange: () => { ed.value = EXEMPLOS[sel.value]; } }, Object.keys(EXEMPLOS).map((k) => h('option', { value: k }, k)));
  const b = h('button.btn.primary', { type: 'button', onclick: async () => {
    b.disabled = true; clear(saida).append(h('span.dim', 'Rodando… (a primeira vez carrega o Python)'));
    const r = await rodar(ed.value, ent.value ? ent.value.split(',').map((x) => x.trim()) : []);
    saida.textContent = r.texto || '(o programa não mostrou nada)'; saida.classList.toggle('err', r.erro); b.disabled = false;
    if (!r.erro) marco('python');
  } }, '▶ Rodar');
  return h('div.lab',
    h('p.small.dim', 'MicroPython, uma versão compacta do Python, rodando aqui no aparelho e funcionando sem internet. Serve para os fundamentos. Bibliotecas como requests, pandas e langchain só no Python do computador.'),
    h('div.row', h('span.small.muted', 'Exemplo:'), sel), h('div', ed, saida),
    h('label.field', h('span', 'Entradas do input()'), ent), b);
}
