// Armazenamento local: tudo fica no aparelho (localStorage). Sem conta, sem servidor.
import { estadoVazio, normalizar, gerarRecorrentes, novoId } from './calc.js';
import { CONTAS, chaveDescricao, reconhecer } from './plano.js';
import { lerNotificacao, chaveNotificacao, dividirParcelas } from './notificacoes.js';
import { mesAtual } from './datas.js';

const CHAVE = 'fin-dados';
const CHAVE_APARELHO = 'fin-aparelho';
let estado = null;
const ouvintes = new Set();

/** Marca um item como mexido agora (a sincronização fica com a versão mais nova). */
export const tocar = (x) => { if (x) x._t = Date.now(); return x; };
const lapide = (e, id) => { e.apagados[id] = Date.now(); };

// ---------- este celular (não sincroniza) ----------
let ap = null;
export function aparelho() {
  if (ap) return ap;
  try { ap = JSON.parse(globalThis.localStorage?.getItem(CHAVE_APARELHO) || 'null'); } catch { ap = null; }
  if (!ap || !ap.id) ap = { id: novoId(), pessoa: '', modelo: '', nuvem: {} };
  ap.nuvem ||= {};
  return ap;
}
export function salvarAparelho(muda = {}) {
  ap = { ...aparelho(), ...muda };
  try { globalThis.localStorage?.setItem(CHAVE_APARELHO, JSON.stringify(ap)); } catch {}
  return ap;
}
/** Quem usa este celular: 'bruno' | 'rita' (ou '' antes de escolher). */
export const eu = () => aparelho().pessoa;
export const pessoa = (id) => dados().pessoas.find((p) => p.id === id);
export const nomePessoa = (id) => pessoa(id)?.nome || '';
export const outra = () => dados().pessoas.find((p) => p.id !== eu());

/**
 * Define de quem é este celular. Lançamentos, contas fixas e metas antigas (de antes de
 * existir "Conta Bruno / Conta Rita") passam a ser dessa pessoa.
 */
export function definirPessoa(id) {
  const e = dados();
  salvarAparelho({ pessoa: id });
  for (const l of e.lancamentos) if (!l.dono) { l.dono = id; tocar(l); }
  for (const r of e.recorrentes) if (!r.dono) { r.dono = id; tocar(r); }
  if (e.orcamentos._semDono) {
    if (!e.orcamentos[id]) e.orcamentos[id] = { ...e.orcamentos._semDono, _t: Date.now() };
    delete e.orcamentos._semDono;
  }
  registrarAparelho();
  salvar();
}
export function registrarAparelho(extra = {}) {
  const e = dados(), a = aparelho();
  if (!a.pessoa) return;
  e.aparelhos[a.id] = { ...(e.aparelhos[a.id] || {}), pessoa: a.pessoa, modelo: a.modelo || '', ...extra, _t: Date.now() };
}

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

export function salvar(armazem = globalThis.localStorage, { quieto = false } = {}) {
  try { armazem?.setItem(CHAVE, JSON.stringify(estado)); } catch { /* armazenamento cheio ou bloqueado */ }
  if (!quieto) for (const f of ouvintes) f(estado);
}
export const aoMudar = (f) => { ouvintes.add(f); return () => ouvintes.delete(f); };

export const categoria = (id) => dados().categorias.find((c) => c.id === id);
export const nomeCategoria = (id) => categoria(id)?.nome || 'Sem categoria';

/** Salva um lançamento novo ou editado. Se `repetir`, cria também a conta fixa mensal. */
export function salvarLancamento(l, { repetir = false } = {}) {
  const e = dados();
  if (l.id) {
    const i = e.lancamentos.findIndex((x) => x.id === l.id);
    if (i >= 0) { const n = { ...e.lancamentos[i], ...l }; if (!n.compartilhado || n.tipo !== 'despesa' || n.rateio === 'dividir') delete n.rateio; if (n.categoria !== 'outros' && n.categoria !== 'outras-receitas') delete n.classificado; e.lancamentos[i] = tocar(n); }
  } else {
    l = tocar({ dono: eu() || undefined, compartilhado: compartilhaPorPadrao(l.categoria), ...l, id: novoId() });
    if (!l.compartilhado || l.tipo !== 'despesa' || !l.rateio || l.rateio === 'dividir') delete l.rateio;
    if (repetir) {
      const r = tocar({ id: novoId(), tipo: l.tipo, valor: l.valor, dia: +l.data.slice(8, 10), categoria: l.categoria, descricao: l.descricao, pagamento: l.pagamento, inicio: l.data.slice(0, 7), fim: null, gerados: [l.data.slice(0, 7)], dono: l.dono, compartilhado: !!l.compartilhado, ...(l.rateio && { rateio: l.rateio }) });
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
  lapide(e, id);
  salvar();
}

export function salvarRecorrente(r) {
  const e = dados();
  const i = e.recorrentes.findIndex((x) => x.id === r.id);
  if (i >= 0) e.recorrentes[i] = tocar({ ...e.recorrentes[i], ...r });
  salvar();
}

/** Para de repetir a partir do mês seguinte; o que já foi lançado continua no extrato. */
export function pararRecorrente(id, ultimoMes) {
  const r = dados().recorrentes.find((x) => x.id === id);
  if (r) { r.fim = ultimoMes; tocar(r); salvar(); }
}
/**
 * Muda uma recorrência (valor, dia, descrição, conta, forma de pagamento). Vale dos próximos meses em diante;
 * o lançamento deste mês também muda se ainda não tiver sido mexido à mão (mesmo valor e descrição de antes).
 */
export function editarRecorrente(id, campos) {
  const e = dados();
  const r = e.recorrentes.find((x) => x.id === id);
  if (!r) return false;
  const antes = { valor: r.valor, descricao: r.descricao };
  const ok = {};
  if (Number.isInteger(campos.valor) && campos.valor > 0) ok.valor = campos.valor;
  if (Number.isInteger(campos.dia) && campos.dia >= 1 && campos.dia <= 31) ok.dia = campos.dia;
  if (typeof campos.descricao === 'string') ok.descricao = campos.descricao.replace(/\s+/g, ' ').trim().slice(0, 120);
  if (campos.categoria) ok.categoria = campos.categoria;
  if (typeof campos.pagamento === 'string') ok.pagamento = r.tipo === 'despesa' ? campos.pagamento : '';
  Object.assign(r, ok); tocar(r);
  const mes = mesAtual();
  const l = e.lancamentos.find((x) => x.recorrente === id && x.data.startsWith(mes));
  if (l && l.valor === antes.valor && (l.descricao || '') === (antes.descricao || '')) {
    Object.assign(l, { valor: r.valor, descricao: r.descricao, categoria: r.categoria, ...(r.tipo === 'despesa' && { pagamento: r.pagamento }) });
    if (ok.dia) { const d = String(Math.min(r.dia, new Date(+mes.slice(0, 4), +mes.slice(5, 7), 0).getDate())).padStart(2, '0'); l.data = `${mes}-${d}`; }
    tocar(l);
  }
  salvar();
  return true;
}
export function apagarRecorrente(id) {
  const e = dados();
  e.recorrentes = e.recorrentes.filter((r) => r.id !== id);
  lapide(e, id);
  salvar();
}

/** Metas de um escopo: a pessoa ('bruno', 'rita') ou 'casal'. */
export const limites = (escopo) => dados().orcamentos[escopo]?.cats || {};
export function definirOrcamento(escopo, categoriaId, centavos) {
  const e = dados();
  const o = e.orcamentos[escopo] = { cats: {}, ...(e.orcamentos[escopo] || {}) };
  o.cats = { ...o.cats };
  if (centavos > 0) o.cats[categoriaId] = centavos; else delete o.cats[categoriaId];
  tocar(o);
  salvar();
}

export function salvarCategoria(c) {
  const e = dados();
  const i = e.categorias.findIndex((x) => x.id === c.id);
  if (i >= 0) e.categorias[i] = tocar({ ...e.categorias[i], ...c });
  else e.categorias.push(tocar({ ...c, id: c.id || novoId() }));
  salvar();
}

/** Só apaga categoria sem uso; com uso, a pessoa precisa escolher para onde mover os lançamentos. */
export function apagarCategoria(id, moverPara = null) {
  const e = dados();
  const usados = e.lancamentos.filter((l) => l.categoria === id).length + e.recorrentes.filter((r) => r.categoria === id).length;
  if (usados && !moverPara) return false;
  for (const l of e.lancamentos) if (l.categoria === id) { l.categoria = moverPara; tocar(l); }
  for (const r of e.recorrentes) if (r.categoria === id) { r.categoria = moverPara; tocar(r); }
  for (const o of Object.values(e.orcamentos)) {
    if (!o?.cats?.[id]) continue;
    if (moverPara) o.cats[moverPara] = (o.cats[moverPara] || 0) + o.cats[id];
    delete o.cats[id]; tocar(o);
  }
  e.categorias = e.categorias.filter((c) => c.id !== id);
  lapide(e, id);
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
    e.lancamentos.push(tocar({ id, tipo: it.tipo, valor: it.valor, data: it.data, categoria: it.categoria, descricao: it.descricao, pagamento: it.tipo === 'despesa' ? it.pagamento || '' : '', importId: it.importId, dono: eu() || undefined, compartilhado: compartilhaPorPadrao(it.categoria), ...rateioSeCompartilhar(it.tipo, it.descricao, compartilhaPorPadrao(it.categoria)) }));
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
  for (const id of ids) lapide(e, id);
  salvar();
}

// ---------- plano de contas ----------
/**
 * Classifica um lançamento pendente e aprende: os outros pendentes com a mesma descrição vão para a mesma
 * conta, e as próximas importações e notificações já chegam classificadas. Devolve quantos outros mudaram.
 */
export function classificar(id, categoria) {
  const e = dados();
  const l = e.lancamentos.find((x) => x.id === id);
  if (!l) return 0;
  const generica = categoria === 'outros' || categoria === 'outras-receitas';
  l.categoria = categoria;
  if (generica) l.classificado = true; else delete l.classificado;   // escolheu "Outras" de propósito: sai dos pendentes
  tocar(l);
  let n = 0;
  const k = chaveDescricao(l.descricao || '');
  if (k && !generica) {
    e.regras[l.tipo + ':' + k] = categoria;
    for (const o of e.lancamentos) {
      if (o === l || o.tipo !== l.tipo || o.classificado || (o.categoria !== 'outros' && o.categoria !== 'outras-receitas')) continue;
      if ((o.dono && o.dono !== eu()) || chaveDescricao(o.descricao || '') !== k) continue;
      o.categoria = categoria; tocar(o); n++;
    }
  }
  salvar();
  return n;
}

export function moverLancamentos(ids, categoria) {
  const alvo = new Set(ids);
  for (const l of dados().lancamentos) if (alvo.has(l.id)) { l.categoria = categoria; tocar(l); }
  salvar();
}

/** Cria uma conta do plano sugerido (ex.: "Academia") e move os lançamentos indicados para ela. */
export function criarContaDoPlano(contaId, ids = []) {
  const e = dados();
  const modelo = CONTAS.find((c) => c.id === contaId);
  if (!modelo) return null;
  if (!e.categorias.some((c) => c.id === contaId)) e.categorias.push(tocar({ id: modelo.id, nome: modelo.nome, tipo: modelo.tipo, grupo: modelo.grupo }));
  moverLancamentos(ids, contaId);
  return contaId;
}

/** Classifica todos os lançamentos de uma descrição e ensina o app para as próximas vezes. */
export function ensinar(tipo, descricao, categoria, ids = []) {
  const e = dados();
  const chave = chaveDescricao(descricao);
  if (chave) e.regras[tipo + ':' + chave] = categoria;
  moverLancamentos(ids, categoria);
}

/** Transforma um gasto que se repete todo mês em conta fixa. */
export function virarContaFixa(f) {
  const e = dados();
  const mes = mesAtual();
  const r = tocar({ id: novoId(), tipo: f.tipo === 'receita' ? 'receita' : 'despesa', valor: f.valor, dia: f.dia, categoria: f.categoria, descricao: f.descricao, pagamento: f.pagamento || '', inicio: mes, fim: null, gerados: f.temNesteMes ? [mes] : [], dono: eu() || undefined, compartilhado: compartilhaPorPadrao(f.categoria) });
  e.recorrentes.push(r);
  // o lançamento deste mês, se já existe, passa a ser a conta fixa do mês
  const k = chaveDescricao(f.descricao);
  const l = e.lancamentos.find((x) => x.tipo === r.tipo && !x.recorrente && x.data.startsWith(mes) && chaveDescricao(x.descricao) === k);
  if (l) { l.recorrente = r.id; tocar(l); }
  gerarRecorrentes(e);
  salvar();
  return r;
}

export function dispensarSugestao(chave) {
  const e = dados();
  if (!e.dispensadas.includes(chave)) e.dispensadas.push(chave);
  salvar();
}

// ---------- caixa "A confirmar" (notificações) ----------
/**
 * Recebe o texto de uma notificação (MacroDroid ou Compartilhar) e põe na caixa "A confirmar".
 * Devolve { status: 'novo' | 'repetido' | 'sem-valor', pendente? }.
 */
export function receberNotificacao(texto, { app = '', titulo = '', agora = Date.now() } = {}) {
  const e = dados();
  const lido = lerNotificacao(texto, { app, titulo });
  if (!lido) return { status: 'sem-valor' };
  const k = chaveNotificacao([titulo, texto].join(' '));
  // o mesmo texto em menos de 10 minutos é a mesma notificação disparada de novo
  if (e.notifVistas.some((x) => x.k === k && agora - x.t < 10 * 60 * 1000)) return { status: 'repetido' };
  e.notifVistas.push({ k, t: agora });
  e.notifVistas = e.notifVistas.slice(-300);
  const r = reconhecer(lido.descricao, lido.tipo, e);
  if (lido.cartao && !e.cartoes[lido.cartao]) e.cartoes[lido.cartao] = { apelido: '', banco: lido.banco, dono: eu() || undefined };
  const pendente = { id: novoId(), recebidoEm: new Date(agora).toISOString(), texto: String(texto).slice(0, 500), titulo: String(titulo).slice(0, 120), app: String(app).slice(0, 60), lido, categoria: r.categoria, reconhecido: r };
  e.pendentes.push(pendente);
  // ignoradas (recusada, estorno…) ficam guardadas por 30 dias, para conferência
  const limite = new Date(agora - 30 * 864e5).toISOString();
  e.pendentes = e.pendentes.filter((p) => !p.lido.ignorar || p.recebidoEm >= limite);
  salvar();
  return { status: 'novo', pendente };
}

export const pendentesAtivos = () => dados().pendentes.filter((p) => !p.lido.ignorar);

/** Confirma um item da caixa: vira lançamento (ou um por parcela, mês a mês). */
export function confirmarPendente(id, ajustes = {}) {
  const e = dados();
  const p = e.pendentes.find((x) => x.id === id);
  if (!p) return [];
  const l = { ...p.lido, categoria: p.categoria, ...ajustes };
  const partes = dividirParcelas(l);
  const grupo = partes.length > 1 ? novoId() : null;
  const ids = [];
  for (const parte of partes) {
    const id2 = novoId();
    e.lancamentos.push(tocar({
      id: id2, tipo: l.tipo, valor: parte.valor, data: parte.data, categoria: l.categoria, descricao: parte.descricao,
      pagamento: l.tipo === 'despesa' ? l.pagamento || '' : '', origem: 'notificacao',
      dono: eu() || undefined, compartilhado: 'compartilhado' in ajustes ? !!ajustes.compartilhado : compartilhaPorPadrao(l.categoria),
      ...(() => { const comp = 'compartilhado' in ajustes ? !!ajustes.compartilhado : compartilhaPorPadrao(l.categoria); return ajustes.rateio && comp && l.tipo === 'despesa' && ajustes.rateio !== 'dividir' ? { rateio: ajustes.rateio } : rateioSeCompartilhar(l.tipo, l.descricao, comp); })(),
      ...(l.cartao && { cartao: l.cartao }), ...(grupo && { parcelamento: grupo, parcela: parte.parcela }),
    }));
    ids.push(id2);
  }
  if (ajustes.categoria && ajustes.categoria !== p.reconhecido?.categoria && l.descricao) {
    e.regras[l.tipo + ':' + chaveDescricao(l.descricao)] = ajustes.categoria; // aprende com a correção
  }
  e.pendentes = e.pendentes.filter((x) => x.id !== id);
  salvar();
  return ids;
}

export function descartarPendente(id) {
  const e = dados();
  e.pendentes = e.pendentes.filter((x) => x.id !== id);
  salvar();
}

/** Volta um item ignorado (ex.: "estorno" lido errado) para a caixa como compra normal. */
export function reconsiderarPendente(id) {
  const p = dados().pendentes.find((x) => x.id === id);
  if (p) { p.lido = { ...p.lido, ignorar: '' }; salvar(); }
}

export function apelidarCartao(final, apelido) {
  const e = dados();
  e.cartoes[final] = { ...(e.cartoes[final] || {}), apelido: String(apelido || '').trim().slice(0, 30), dono: e.cartoes[final]?.dono || eu() || undefined };
  salvar();
}
export const nomeCartao = (final) => {
  if (!final) return '';
  const c = dados().cartoes[final] || {};
  return c.apelido || `${c.banco ? c.banco + ' ' : ''}•${final}`;
};

// ---------- compartilhar com o casal ----------
/** Se lançamentos desta conta já nascem compartilhados (escolha de cada pessoa). */
export const compartilhaPorPadrao = (categoria) => !!dados().compartilharSempre[eu()]?.cats?.[categoria];
export function compartilharSempre(categoria, sim) {
  const e = dados(), p = eu();
  const o = e.compartilharSempre[p] = { cats: {}, ...(e.compartilharSempre[p] || {}) };
  o.cats = { ...o.cats };
  if (sim) o.cats[categoria] = true; else delete o.cats[categoria];
  tocar(o);
  salvar();
}
/** Compartilha (ou volta a deixar privado) lançamentos meus. Ao compartilhar, reconhece o rateio pela descrição. */
export function compartilhar(ids, sim = true) {
  const alvo = new Set(ids);
  for (const l of dados().lancamentos) if (alvo.has(l.id) && (!l.dono || l.dono === eu())) {
    l.compartilhado = !!sim;
    if (!sim) delete l.rateio;
    else if (!l.rateio && l.tipo === 'despesa') { const r = rateioPadrao(l.descricao, l.id); if (r.rateio !== 'dividir') l.rateio = r.rateio; }
    tocar(l);
  }
  salvar();
}

/**
 * De quem é um gasto compartilhado: reconhece pela descrição (o que você escolheu da última vez
 * para um gasto com a mesma descrição) e, sem histórico, é dividido. Devolve { rateio, fonte }.
 */
export function rateioPadrao(descricao, ignorarId) {
  const k = chaveDescricao(descricao || '');
  if (k) {
    const ant = dados().lancamentos
      .filter((x) => x.id !== ignorarId && x.tipo === 'despesa' && x.compartilhado && (!x.dono || x.dono === eu()) && chaveDescricao(x.descricao) === k)
      .sort((a, b) => (b._t || 0) - (a._t || 0) || b.data.localeCompare(a.data))[0];
    if (ant) return { rateio: ant.rateio === 'meu' || ant.rateio === 'outro' ? ant.rateio : 'dividir', fonte: 'historico' };
  }
  return { rateio: 'dividir', fonte: 'padrao' };
}
const rateioSeCompartilhar = (tipo, descricao, comp) => { if (!comp || tipo !== 'despesa') return {}; const r = rateioPadrao(descricao).rateio; return r !== 'dividir' ? { rateio: r } : {}; };

/** Define de quem é: 'privado' (deixa de compartilhar), 'dividir', 'meu' ou 'outro'. */
export function definirRateio(ids, escolha) {
  const alvo = new Set(ids);
  for (const l of dados().lancamentos) if (alvo.has(l.id) && (!l.dono || l.dono === eu())) {
    if (escolha === 'privado') { l.compartilhado = false; delete l.rateio; }
    else { l.compartilhado = true; if (l.tipo === 'despesa' && escolha !== 'dividir') l.rateio = escolha; else delete l.rateio; }
    tocar(l);
  }
  salvar();
}
export function definirDivisao(pct) {
  const e = dados();
  e.divisao = tocar({ ...e.divisao, ...pct });
  salvar();
}
export function marcarAcertado(mes, transf) {
  const e = dados();
  e.acertos[mes] = transf ? tocar({ ...transf, quando: new Date().toISOString(), por: eu() }) : tocar({ desfeito: true });
  salvar();
}

/** Troca os dados pelos já juntados com a nuvem, mantendo o que é só deste celular. */
export function aplicarMesclado(novo) {
  const e = dados();
  estado = normalizar({ ...novo, pendentes: e.pendentes, notifVistas: e.notifVistas });
  gerarRecorrentes(estado);
  salvar();
}

export const exportar = () => JSON.stringify({ app: 'financas', exportadoEm: new Date().toISOString(), ...dados() }, null, 1);

export function importar(texto) {
  estado = normalizar(JSON.parse(texto));
  for (const l of estado.lancamentos) tocar(l);
  gerarRecorrentes(estado);
  salvar();
  return estado;
}

export function apagarTudo() { estado = estadoVazio(); salvar(); }
