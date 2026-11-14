// Datas como texto local "AAAA-MM-DD" e meses como "AAAA-MM": sem fuso horário para atrapalhar.

const z = (n) => String(n).padStart(2, '0');
export const hoje = (d = new Date()) => `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
export const mesDe = (data) => data.slice(0, 7);
export const mesAtual = (d = new Date()) => hoje(d).slice(0, 7);

export function somarMeses(mes, n) {
  const [a, m] = mes.split('-').map(Number);
  const t = a * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${z((t % 12) + 1)}`;
}
export const diasNoMes = (mes) => { const [a, m] = mes.split('-').map(Number); return new Date(a, m, 0).getDate(); };

/** Dia do mês ajustado ao tamanho do mês: dia 31 em fevereiro vira 28 (ou 29). */
export const dataNoMes = (mes, dia) => `${mes}-${z(Math.min(dia, diasNoMes(mes)))}`;

/** Lista de meses de `de` até `ate`, inclusive. */
export function mesesEntre(de, ate) {
  const r = [];
  for (let m = de; m <= ate && r.length < 600; m = somarMeses(m, 1)) r.push(m);
  return r;
}

const NOMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const nomeMes = (mes, comAno = true) => { const [a, m] = mes.split('-').map(Number); return NOMES[m - 1] + (comAno ? ` de ${a}` : ''); };
export const nomeMesCurto = (mes) => NOMES[+mes.slice(5, 7) - 1].slice(0, 3);

const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
export function nomeDia(data, ref = hoje()) {
  if (data === ref) return 'Hoje';
  const [a, m, d] = data.split('-').map(Number);
  const dt = new Date(a, m - 1, d);
  const [ra, rm, rd] = ref.split('-').map(Number);
  const diff = Math.round((new Date(ra, rm - 1, rd) - dt) / 864e5);
  if (diff === 1) return 'Ontem';
  return `${SEMANA[dt.getDay()]}, ${d} de ${NOMES[m - 1].slice(0, 3)}`;
}
