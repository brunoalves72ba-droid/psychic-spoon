// Finanças — © Bruno Moura, único e exclusivo proprietário.
// Valores são guardados sempre em CENTAVOS (inteiros) para não haver erro de arredondamento.

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtCurto = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/** 123456 → "R$ 1.234,56" */
export const reais = (centavos) => fmt.format((centavos || 0) / 100).replace(/ /g, ' ');
/** 123456 → "R$ 1.235" (para eixos e rótulos curtos) */
export const reaisCurto = (centavos) => fmtCurto.format(Math.round((centavos || 0) / 100)).replace(/ /g, ' ');

/** Lê o que a pessoa digitou ("12,5", "1.234,56", "R$ 30", "30.5") e devolve centavos, ou null. */
export function lerValor(texto) {
  if (typeof texto === 'number') return Number.isFinite(texto) ? Math.round(texto * 100) : null;
  let s = String(texto ?? '').replace(/[R$\s ]/g, '');
  if (!s) return null;
  const neg = s.startsWith('-');
  s = s.replace(/^[-+]/, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); // "1.234" = mil duzentos e trinta e quatro
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const c = Math.round(parseFloat(s) * 100);
  return neg ? -c : c;
}

/** Só os dígitos digitados viram centavos, como em caixa eletrônico: "1234" → 1234 (R$ 12,34). */
export const digitosParaCentavos = (texto) => {
  const d = String(texto ?? '').replace(/\D/g, '').replace(/^0+/, '').slice(0, 11);
  return d ? parseInt(d, 10) : 0;
};

/** Centavos para o formato de campo editável: 123456 → "1.234,56" */
export const centavosParaCampo = (c) => reais(c).replace(/^-?R\$\s?/, '');
