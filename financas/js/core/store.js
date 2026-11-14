// Armazenamento local: tudo fica no aparelho (localStorage). Sem conta, sem servidor.
import { estadoVazio, normalizar, gerarRecorrentes, novoId } from './calc.js';

const CHAVE = 'fin-dados';
let estado = null;
const ouvintes = new Set();

export function carregar(armazem = globalThis.localStorage) {
  try {
    const txt = armazem?.getItem(CHAVE);
    estado = txt ? normalizar(JSON.parse(txt)) : estadoVazio();
  } catch { estado = estadoVazio(); }
  if (gerarRecorrentes(estado)) salvar(armazem);
  return estado;
}

export const dados = () => estado || carregar();

/** Lança as contas fixas que venceram desde a última vez; devolve quantas entraram. */
export function atualizarRecorrentes() {
  const n = gerarRecorrentes(dados());
  if (n) salvar();
  return n;
}

export function salvar(armazem = globalThis.localStorage) {
  try { armazem?.setItem(CHAVE, JSON.stringify(estado)); } catch { /* armazenamento cheio ou bloqueado */ }
  for (const f of ouvintes) f(estado);
}
export const aoMudar = (f) => { ouvintes.add(f); return () => ouvintes.delete(f); };

export const categoria = (id) => dados().categorias.find((c) => c.id === id);
export const nomeCategoria = (id) => categoria(id)?.nome || 'Sem categoria';

/** Salva um lançamento novo ou editado. Se `repetir`, cria também a conta fixa mensal. */
export function salvarLancamento(l, { repetir = false } = {}) {
  const e = dados();
  if (l.id) {
    const i = e.lancamentos.findIndex((x) => x.id === l.id);
    if (i >= 0) e.lancamentos[i] = { ...e.lancamentos[i], ...l };
  } else {
    l = { ...l, id: novoId() };
    if (repetir) {
      const r = { id: novoId(), tipo: l.tipo, valor: l.valor, dia: +l.data.slice(8, 10), categoria: l.categoria, descricao: l.descricao, pagamento: l.pagamento, inicio: l.data.slice(0, 7), fim: null, gerados: [l.data.slice(0, 7)] };
      e.recorrentes.push(r);
      l.recorrente = r.id;
    }
    e.lancamentos.push(l);
  }
  salvar();
  return l;
}

export function apagarLancamento(id) {
  const e = dados();
  e.lancamentos = e.lancamentos.filter((l) => l.id !== id);
  salvar();
}

export function salvarRecorrente(r) {
  const e = dados();
  const i = e.recorrentes.findIndex((x) => x.id === r.id);
  if (i >= 0) e.recorrentes[i] = { ...e.recorrentes[i], ...r };
  salvar();
}

/** Para de repetir a partir do mês seguinte; o que já foi lançado continua no extrato. */
export function pararRecorrente(id, ultimoMes) {
  const r = dados().recorrentes.find((x) => x.id === id);
  if (r) { r.fim = ultimoMes; salvar(); }
}
export function apagarRecorrente(id) {
  const e = dados();
  e.recorrentes = e.recorrentes.filter((r) => r.id !== id);
  salvar();
}

export function definirOrcamento(categoriaId, centavos) {
  const e = dados();
  if (centavos > 0) e.orcamentos[categoriaId] = centavos; else delete e.orcamentos[categoriaId];
  salvar();
}

export function salvarCategoria(c) {
  const e = dados();
  const i = e.categorias.findIndex((x) => x.id === c.id);
  if (i >= 0) e.categorias[i] = { ...e.categorias[i], ...c };
  else e.categorias.push({ ...c, id: c.id || novoId() });
  salvar();
}

/** Só apaga categoria sem uso; com uso, a pessoa precisa escolher para onde mover os lançamentos. */
export function apagarCategoria(id, moverPara = null) {
  const e = dados();
  const usados = e.lancamentos.filter((l) => l.categoria === id).length + e.recorrentes.filter((r) => r.categoria === id).length;
  if (usados && !moverPara) return false;
  for (const l of e.lancamentos) if (l.categoria === id) l.categoria = moverPara;
  for (const r of e.recorrentes) if (r.categoria === id) r.categoria = moverPara;
  if (e.orcamentos[id] && moverPara) e.orcamentos[moverPara] = (e.orcamentos[moverPara] || 0) + e.orcamentos[id];
  delete e.orcamentos[id];
  e.categorias = e.categorias.filter((c) => c.id !== id);
  salvar();
  return true;
}

/**
 * Grava os itens marcados da prévia de importação e aprende a categoria de cada descrição.
 * Devolve os ids dos lançamentos criados.
 */
export function importarItens(itens) {
  const e = dados();
  const ja = new Set(e.lancamentos.map((l) => l.importId).filter(Boolean));
  const ids = [];
  for (const it of itens) {
    if (!it.marcado || ja.has(it.importId)) continue;
    const id = novoId();
    e.lancamentos.push({ id, tipo: it.tipo, valor: it.valor, data: it.data, categoria: it.categoria, descricao: it.descricao, pagamento: it.tipo === 'despesa' ? it.pagamento || '' : '', importId: it.importId });
    if (it.chave) e.regras[it.tipo + ':' + it.chave] = it.categoria;
    ja.add(it.importId);
    ids.push(id);
  }
  salvar();
  return ids;
}

export function apagarLancamentos(ids) {
  const fora = new Set(ids);
  const e = dados();
  e.lancamentos = e.lancamentos.filter((l) => !fora.has(l.id));
  salvar();
}

export const exportar = () => JSON.stringify({ app: 'financas', exportadoEm: new Date().toISOString(), ...dados() }, null, 1);

export function importar(texto) {
  estado = normalizar(JSON.parse(texto));
  gerarRecorrentes(estado);
  salvar();
  return estado;
}

export function apagarTudo() { estado = estadoVazio(); salvar(); }
