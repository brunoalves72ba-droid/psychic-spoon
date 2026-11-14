// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Mesclagem de dois estados (celular e PC) sem perder progresso. Funções puras, testadas.
// Regra geral: progresso só avança (lição concluída, cartão revisto, missão marcada nunca “desfazem”),
// e o que foi editado por inteiro (perfil, ficha técnica, prompt) fica com a versão mais recente.
// Apagados viajam como “lápides” em `apagados`, para não ressuscitar no outro aparelho.

const min = (a, b) => (a == null ? b : b == null ? a : a < b ? a : b);
const max = (a, b) => (a == null ? b : b == null ? a : a > b ? a : b);
const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const lista = (x) => (Array.isArray(x) ? x : []);
const recente = (a, b) => (((b && b._t) || 0) > ((a && a._t) || 0) ? b : a);

/** Identificador de uma entrada de diário (as antigas não tinham id). */
export const idDiario = (x) => x.id || `${x.d}|${x.t}`;
/** Identificador estável de um evento do histórico. */
export const idEvento = (e) => e.uid || [e.t, e.cid || e.lid || '', e.d, e.int ?? '', e.ok ?? '', e.nota || '', e.acertos ?? ''].join('|');

function licao(a0, b0) {
  const a = obj(a0), b = obj(b0);
  const feita = min(a.feita, b.feita);
  const qa = lista(a.quiz), qb = lista(b.quiz);
  // acertou em qualquer aparelho conta como acerto (assim a ordem dos aparelhos não importa)
  const quiz = Array.from({ length: Math.max(qa.length, qb.length) }, (_, i) => (qa[i] === true || qb[i] === true ? true : qa[i] !== undefined ? qa[i] : qb[i]));
  const ex = a.ex && a.ex.ok ? (b.ex && b.ex.ok && (b.ex.tent || 1) < (a.ex.tent || 1) ? b.ex : a.ex) : b.ex || a.ex;
  const mao = a.mao === 'feito' || b.mao === 'feito' ? 'feito' : a.mao || b.mao;
  const out = { ...a, ...b, p: feita ? 0 : Math.max(a.p || 0, b.p || 0), ini: min(a.ini, b.ini), quiz };
  if (feita) out.feita = feita; else delete out.feita;
  if (ex) out.ex = ex; else delete out.ex;
  if (mao) { out.mao = mao; out.maoQuando = max(a.maoQuando, b.maoQuando); } else delete out.mao;
  if (!quiz.length) delete out.quiz;
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  return out;
}
function cartao(a, b) {
  if (!a) return b; if (!b) return a;
  const ua = a.u || '', ub = b.u || '';
  if (ub !== ua) return ub > ua ? b : a;
  return (b.n || 0) > (a.n || 0) ? b : a;
}
const porId = (as, bs, chave, junta) => {
  const m = new Map();
  for (const x of lista(as)) m.set(chave(x), x);
  for (const x of lista(bs)) { const k = chave(x); m.set(k, m.has(k) ? junta(m.get(k), x) : x); }
  return [...m.values()];
};
const datasMin = (a, b) => { const o = { ...obj(a) }; for (const [k, v] of Object.entries(obj(b))) o[k] = min(o[k], v); return o; };

/**
 * Junta dois estados `kv` (o que fica gravado por chave) e devolve o estado mesclado.
 * A chave `local` (token, aparelho, tema) nunca entra: é de cada aparelho.
 */
export function mesclarKv(A, B) {
  const a = obj(A), b = obj(B);
  const apagados = { ...obj(a.apagados) };
  for (const [k, v] of Object.entries(obj(b.apagados))) apagados[k] = max(apagados[k], v);
  const vivo = (tipo, id) => !apagados[`${tipo}:${id}`];
  const o = {};

  o.apagados = apagados;
  o.perfil = recente(obj(a.perfil), obj(b.perfil));
  o.ficha = recente(obj(a.ficha), obj(b.ficha));
  o.sessao = recente(obj(a.sessao), obj(b.sessao));
  o.andaime = recente(obj(a.andaime), obj(b.andaime));
  o.mistura = (obj(b.mistura).n || 0) > (obj(a.mistura).n || 0) ? b.mistura : a.mistura || b.mistura || {};

  o.licoes = {};
  for (const id of new Set([...Object.keys(obj(a.licoes)), ...Object.keys(obj(b.licoes))])) o.licoes[id] = licao(obj(a.licoes)[id], obj(b.licoes)[id]);

  // cartões importados: ids antigos (u1, u2…) podem coincidir entre aparelhos com conteúdo diferente
  const meusA = lista(a.meus), meusB = lista(b.meus);
  const cartoesB = { ...obj(b.cartoes) };
  const idsA = new Map(meusA.map((c) => [c.id, c]));
  const meusB2 = meusB.map((c) => {
    const x = idsA.get(c.id);
    if (x && (x.f !== c.f || x.v !== c.v)) { const novo = `${c.id}-${Math.abs(hash(c.f + c.v)).toString(36)}`; if (cartoesB[c.id]) { cartoesB[novo] = cartoesB[c.id]; delete cartoesB[c.id]; } return { ...c, id: novo }; }
    return c;
  });
  o.meus = porId(meusA, meusB2, (c) => c.id, (x) => x).filter((c) => vivo('meus', c.id));
  o.cartoes = {};
  for (const id of new Set([...Object.keys(obj(a.cartoes)), ...Object.keys(cartoesB)])) {
    if (id[0] === 'u' && !o.meus.some((c) => c.id === id)) continue;
    o.cartoes[id] = cartao(obj(a.cartoes)[id], cartoesB[id]);
  }

  o.dias = {};
  for (const d of new Set([...Object.keys(obj(a.dias)), ...Object.keys(obj(b.dias))])) {
    const x = obj(obj(a.dias)[d]), y = obj(obj(b.dias)[d]); const z = {};
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) z[k] = Math.max(x[k] || 0, y[k] || 0);
    o.dias[d] = z;
  }
  o.xpPor = {};
  for (const k of new Set([...Object.keys(obj(a.xpPor)), ...Object.keys(obj(b.xpPor))])) o.xpPor[k] = Math.max(obj(a.xpPor)[k] || 0, obj(b.xpPor)[k] || 0);

  o.conquistas = datasMin(a.conquistas, b.conquistas);
  o.marcos = datasMin(a.marcos, b.marcos);
  o.desafios = datasMin(a.desafios, b.desafios);

  o.diario = porId(a.diario, b.diario, idDiario, (x) => x).filter((x) => vivo('diario', idDiario(x))).sort((x, y) => (x.d < y.d ? 1 : x.d > y.d ? -1 : 0));
  o.pensamentos = porId(a.pensamentos, b.pensamentos, (x) => x.id, (x, y) => recente(x, y)).filter((x) => vivo('pensamentos', x.id)).sort((x, y) => y.id - x.id);
  o.prompts = porId(a.prompts, b.prompts, (x) => x.id, (x, y) => ((y.versao || 1) !== (x.versao || 1) ? ((y.versao || 1) > (x.versao || 1) ? y : x) : recente(x, y))).filter((x) => vivo('prompts', x.id));
  o.semanais = porId(a.semanais, b.semanais, (x) => x.semana, (x, y) => ((y.dia || '') > (x.dia || '') ? y : x)).sort((x, y) => (x.semana < y.semana ? 1 : -1));

  o.missoes = {};
  for (const id of new Set([...Object.keys(obj(a.missoes)), ...Object.keys(obj(b.missoes))])) {
    const x = obj(obj(a.missoes)[id]), y = obj(obj(b.missoes)[id]);
    o.missoes[id] = { itens: { ...obj(x.itens), ...obj(y.itens) } };
    const f = min(x.feita, y.feita); if (f) o.missoes[id].feita = f;
  }
  o.fichaViva = {};
  for (const id of new Set([...Object.keys(obj(a.fichaViva)), ...Object.keys(obj(b.fichaViva))])) {
    const x = obj(a.fichaViva)[id], y = obj(b.fichaViva)[id];
    o.fichaViva[id] = !x ? y : !y ? x : (y.conferido || '') > (x.conferido || '') ? y : x;
  }
  // a sequência semanal é recalculada a partir dos dias (quem chama faz isso); guarda a mais avançada por ora
  o.semana = (obj(b.semana).ult || '') > (obj(a.semana).ult || '') ? b.semana : a.semana || b.semana;
  return o;
}

/** Junta dois históricos de eventos, sem repetir. */
export function mesclarLog(A, B) {
  const m = new Map();
  for (const e of [...lista(A), ...lista(B)]) { const { id, ...resto } = e; const k = idEvento(resto); if (!m.has(k)) m.set(k, { ...resto, uid: k }); }
  return [...m.values()].sort((x, y) => (x.d < y.d ? -1 : x.d > y.d ? 1 : 0));
}

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
