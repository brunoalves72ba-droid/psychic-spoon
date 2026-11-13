// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Datas como chaves "AAAA-MM-DD" (dia local). Semana de segunda a domingo. Funções puras.

export const dayKey = (d = new Date()) => { const t = new Date(d); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
const toUTC = (key) => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const fromUTC = (ms) => { const t = new Date(ms); return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`; };
export const addDays = (key, n) => fromUTC(toUTC(key) + n * 86400000);
export const diffDays = (a, b) => Math.round((toUTC(a) - toUTC(b)) / 86400000);
/** 0 = segunda … 6 = domingo */
export const dow = (key) => (new Date(toUTC(key)).getUTCDay() + 6) % 7;
/** Chave da semana = a segunda-feira dela. */
export const weekStart = (key) => addDays(key, -dow(key));
export const weekDays = (start) => Array.from({ length: 7 }, (_, i) => addDays(start, i));
export const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/** "Hoje" do app. Os testes ponta a ponta podem viajar no tempo definindo globalThis.__FIA_HOJE. */
export const hoje = () => (typeof globalThis.__FIA_HOJE === 'string' ? globalThis.__FIA_HOJE : dayKey());
