// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Laboratório de limites: 8 pedidos contra um limite de 3 a cada 10 segundos, com três estratégias.
import { h, clear, fmt } from '../core/ui.js';
import { missao, semMissao } from './comum.js';

export const LIMITE = 3, JANELA = 10;
export const ESTRATEGIAS = {
  tudo: { nome: 'Disparar tudo, sem repetir', espera: () => null },
  insistir: { nome: 'Repetir sem pausa', espera: (n) => (n < 6 ? 0.3 : null) },
  backoff: { nome: 'Esperar e tentar de novo (backoff)', espera: (n) => (n < 7 ? 2 ** (n - 1) : null) },
};

/** Simula os pedidos. Devolve { eventos: [{t, pedido, ok}], entregues }. */
export function simular(chave, n = 8) {
  const est = ESTRATEGIAS[chave];
  const fila = Array.from({ length: n }, (_, i) => ({ t: i * 0.1, pedido: i + 1, tent: 1 }));
  const aceitos = []; const eventos = []; let entregues = 0;
  while (fila.length) {
    fila.sort((a, b) => a.t - b.t || a.pedido - b.pedido);
    const p = fila.shift();
    while (aceitos.length && p.t - aceitos[0] >= JANELA) aceitos.shift();
    const ok = aceitos.length < LIMITE;
    eventos.push({ t: p.t, pedido: p.pedido, ok });
    if (ok) { aceitos.push(p.t); entregues++; continue; }
    const w = est.espera(p.tent);
    if (w != null) fila.push({ t: +(p.t + w).toFixed(2), pedido: p.pedido, tent: p.tent + 1 });
  }
  return { eventos, entregues };
}

export default function ({ missao: m, feito }) {
  const mi = m ? missao(['Teste pelo menos **duas** estratégias.', 'Ache a que **entrega os 8 pedidos**.'], feito) : semMissao();
  const testadas = new Set();
  const res = h('div.col');
  const rodar = (k) => {
    const r = simular(k);
    testadas.add(k);
    const ult = r.eventos[r.eventos.length - 1];
    clear(res).append(h('div.stats.two', h('div.stat', h('b', `${r.entregues} de 8`), h('span', 'pedidos entregues')), h('div.stat', h('b', String(r.eventos.length)), h('span', 'chamadas feitas'))),
      h('p.small.dim', k === 'tudo' ? 'Os 5 que tomaram 429 se perderam: ninguém tentou de novo.' : k === 'insistir' ? 'Repetir sem pausa gasta chamadas e continua batendo no limite: a janela de 10 segundos ainda não passou.' : `Esperando 1, 2, 4, 8… segundos, cada pedido acha uma vaga. Terminou em ${fmt(ult.t, 1)} s, sem desperdício.`),
      h('div.linha-t', r.eventos.slice(0, 14).map((e) => h('div.ev' + (e.ok ? '.ok' : '.no'), h('b', `${fmt(e.t, 1)} s`), h('span', `Pedido ${e.pedido}: ${e.ok ? '200' : '429'}`)))),
      r.eventos.length > 14 ? h('p.small.muted', `… e mais ${r.eventos.length - 14} chamadas.`) : null);
    if (testadas.size >= 2) mi.marcar(0);
    if (r.entregues === 8) mi.marcar(1);
  };
  return h('div.lab', mi.el, h('p.small.dim', `Limite do servidor: ${LIMITE} pedidos a cada ${JANELA} segundos. Você precisa enviar 8.`),
    h('div.col', Object.entries(ESTRATEGIAS).map(([k, e]) => h('button.btn.block', { type: 'button', onclick: () => rodar(k) }, e.nome))), res);
}
