// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Check-in do dia: uma carinha (feliz, neutra, triste) e o tempo disponível (5, 15 ou 30 min).
// Um por dia (dia local). A carinha não muda no mesmo dia; o tempo muda. Sincroniza entre aparelhos.
import { S, L, salvar, salvarLocal } from './estado.js';
import { hoje, addDays } from './dia.js';
import { CURIOSIDADES } from '../data/curiosidades.js';

export const HUMORES = ['feliz', 'neutro', 'triste'];
/** Mapeamento com o check-in antigo de energia: baixa → triste, média → neutra, alta → feliz. */
export const ENERGIA = { feliz: 'alta', neutro: 'media', triste: 'baixa' };
export const ROTULO = { feliz: 'Feliz, energia alta', neutro: 'Neutra, energia média', triste: 'Triste, energia baixa' };
export const TEMPOS = [5, 15, 30];
const DIAS_HISTORICO = 120;

/** O check-in de hoje, ou null. */
export function checkinHoje(d = hoje()) {
  const c = S['v2.checkin.dia'];
  return c && c.data === d && HUMORES.includes(c.humor) ? c : null;
}

/** Registra a carinha de hoje (só se ainda não houver). Também anota no histórico (data e humor). */
export function registrarCheckin(humor, tempo = 15, d = hoje()) {
  if (!HUMORES.includes(humor) || checkinHoje(d)) return checkinHoje(d);
  const em = Date.now();
  S['v2.checkin.dia'] = { data: d, humor, tempo: TEMPOS.includes(tempo) ? tempo : 15, em };
  const hist = { ...(S['v2.checkin.historico'] || {}) };
  hist[d] = { h: humor, em };
  S['v2.checkin.historico'] = podarHistorico(hist, d);
  salvar('v2.checkin.dia', 'v2.checkin.historico');
  return S['v2.checkin.dia'];
}

/** Troca o tempo disponível de hoje (a carinha fica). */
export function mudarTempo(tempo, d = hoje()) {
  const c = checkinHoje(d);
  if (!c || !TEMPOS.includes(tempo) || c.tempo === tempo) return;
  S['v2.checkin.dia'] = { ...c, tempo };
  salvar('v2.checkin.dia');
}

/** Mantém só os últimos 120 dias. */
export function podarHistorico(hist, d = hoje()) {
  const corte = addDays(d, -(DIAS_HISTORICO - 1));
  const o = {};
  for (const [k, v] of Object.entries(hist || {})) if (k >= corte && k <= d) o[k] = v;
  return o;
}

// ---- curiosidade do dia (aparelho só: dispensar não viaja para o outro aparelho) ----
/** Índice do dia: rodízio que nunca repete a frase de ontem. */
export function curiosidadeDoDia(d = hoje(), lista = CURIOSIDADES) {
  if (!lista.length) return null;
  const n = Math.floor(Date.parse(d + 'T12:00:00Z') / 864e5);
  return lista[((n % lista.length) + lista.length) % lista.length];
}
export const curiosidadeDispensada = (d = hoje()) => L['v2.curiosidade.dispensada'] === d;
export function dispensarCuriosidade(d = hoje()) { L['v2.curiosidade.dispensada'] = d; return salvarLocal(); }

// ---- desenho das carinhas (SVG inline, traço fino) ----
const NS = 'http://www.w3.org/2000/svg';
const BOCA = { feliz: 'M8.5 14.2q3.5 3.2 7 0', neutro: 'M8.8 15h6.4', triste: 'M8.5 16.4q3.5-3.2 7 0' };
export function rosto(humor, tam = 40) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('width', tam); svg.setAttribute('height', tam);
  svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('class', 'rosto');
  const add = (tag, at) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(at)) e.setAttribute(k, v); svg.append(e); };
  add('circle', { cx: 12, cy: 12, r: 9.2 });
  add('circle', { cx: 9.2, cy: 10, r: 0.9, class: 'olho' });
  add('circle', { cx: 14.8, cy: 10, r: 0.9, class: 'olho' });
  add('path', { d: BOCA[humor] || BOCA.neutro });
  return svg;
}
