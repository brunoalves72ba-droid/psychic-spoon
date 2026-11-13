// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Exemplos "desbotados": o mesmo gabarito vira exemplo completo → falta 1 passo → faltam vários → do zero.
// O andaime sobe quando você acerta de primeira 80% das vezes e volta quando está difícil. Funções puras.

// Molde: texto com lacunas ⟦n:resposta⟧ (n = 1 some primeiro; alternativas separadas por ¦).
const RE = /⟦(\d):([^⟧]*)⟧/g;

export function parseMolde(molde) {
  const partes = []; let i = 0, m;
  RE.lastIndex = 0;
  while ((m = RE.exec(molde))) {
    if (m.index > i) partes.push({ t: 'txt', v: molde.slice(i, m.index) });
    const alts = m[2].split('¦');
    partes.push({ t: 'lac', n: +m[1], v: alts[0], alts });
    i = m.index + m[0].length;
  }
  if (i < molde.length) partes.push({ t: 'txt', v: molde.slice(i) });
  return partes;
}
export const solucao = (molde) => parseMolde(molde).map((p) => p.v).join('');

/** Nível 1 esconde só as lacunas de prioridade 1; nível 2, as de prioridade ≤ 2; nível 3 esconde todas. */
export function aplicarNivel(partes, nivel) {
  const max = nivel >= 3 ? 9 : nivel;
  return partes.map((p) => (p.t === 'lac' && p.n > max ? { t: 'txt', v: p.v } : p));
}
export const maiorNivel = (partes) => Math.max(0, ...partes.filter((p) => p.t === 'lac').map((p) => p.n));

const norm = (x, exato) => { let v = String(x).trim().replace(/\s+/g, ' '); if (!exato) v = v.toLowerCase().replace(/'/g, '"'); return v; };
/** Confere uma lacuna digitada (ignora maiúsculas, espaços repetidos e o tipo de aspas, salvo `exato`). */
export const confere = (parte, valor, exato = false) => parte.alts.some((a) => norm(a, exato) === norm(valor, exato));

export const novoAndaime = () => ({ nivel: 1, janela: [] });
/**
 * Registra o resultado de um exercício com andaime (acertou de primeira?).
 * Com 3+ resultados na janela: taxa ≥ 80% sobe o nível (menos ajuda); taxa ≤ 34% desce (mais ajuda).
 */
export function registrar(a, dePrimeira) {
  const janela = [...a.janela, !!dePrimeira].slice(-5);
  let nivel = a.nivel;
  if (janela.length >= 3) {
    const taxa = janela.filter(Boolean).length / janela.length;
    if (taxa >= 0.8 && nivel < 3) return { nivel: nivel + 1, janela: [] };
    if (taxa <= 0.34 && nivel > 1) return { nivel: nivel - 1, janela: [] };
  }
  return { nivel, janela };
}
