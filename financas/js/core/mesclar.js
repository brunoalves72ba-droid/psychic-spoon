// Junta os dados de dois celulares (o daqui e o da nuvem) sem perder nada. Funções puras, testadas.
// Regras:
//  - cada item (lançamento, conta, conta fixa) tem `_t` (quando foi mexido pela última vez): fica a versão mais nova;
//  - apagar deixa uma "lápide" em `apagados` ({ id: quando }), para o item não voltar pelo outro celular;
//  - o que é deste aparelho (caixa A confirmar, notificações vistas) não viaja.

const t = (x) => (x && x._t) || 0;

/** Junta duas listas de objetos com `id`, ficando com o mais novo de cada. */
export function porId(a = [], b = [], apagados = {}) {
  const m = new Map();
  for (const x of [...a, ...b]) {
    if (!x || !x.id) continue;
    const y = m.get(x.id);
    if (!y || t(x) > t(y)) m.set(x.id, x);
  }
  return [...m.values()].filter((x) => !(apagados[x.id] && apagados[x.id] >= t(x)));
}

const maior = (a = {}, b = {}) => {
  const r = { ...a };
  for (const [k, v] of Object.entries(b)) if (!(k in r) || v > r[k]) r[k] = v;
  return r;
};
/** Objeto inteiro com `_t`: fica o mais novo. */
const recente = (a, b) => (t(b) > t(a) ? b : a) || a || b;
/** Objeto de objetos com `_t` (ex.: metas por pessoa): o mais novo de cada chave. */
const porChave = (a = {}, b = {}) => {
  const r = { ...a };
  for (const [k, v] of Object.entries(b)) r[k] = recente(r[k], v);
  return r;
};

export function mesclar(local, remoto) {
  if (!remoto) return local;
  const A = local, B = remoto;
  const apagados = maior(A.apagados, B.apagados);
  const recorrentes = porId(A.recorrentes, B.recorrentes, apagados).map((r) => {
    const outro = [...(A.recorrentes || []), ...(B.recorrentes || [])].filter((x) => x.id === r.id);
    return { ...r, gerados: [...new Set(outro.flatMap((x) => x.gerados || []))].sort() };
  });
  return {
    ...A,
    planoVersao: Math.max(A.planoVersao || 1, B.planoVersao || 1),
    lancamentos: porId(A.lancamentos, B.lancamentos, apagados),
    categorias: porId(A.categorias, B.categorias, apagados),
    recorrentes,
    apagados,
    regras: { ...(B.regras || {}), ...(A.regras || {}) },
    orcamentos: porChave(A.orcamentos, B.orcamentos),
    compartilharSempre: porChave(A.compartilharSempre, B.compartilharSempre),
    divisao: recente(A.divisao, B.divisao),
    acertos: porChave(A.acertos, B.acertos),
    cartoes: { ...(B.cartoes || {}), ...(A.cartoes || {}) },
    aparelhos: porChave(A.aparelhos, B.aparelhos),
    dispensadas: [...new Set([...(A.dispensadas || []), ...(B.dispensadas || [])])],
    // ficam como estão aqui: são deste aparelho
    pendentes: A.pendentes, notifVistas: A.notifVistas,
  };
}

/** O que vai para a nuvem: tudo, menos o que é só deste aparelho. */
export const paraNuvem = ({ pendentes, notifVistas, ...resto }) => resto;
