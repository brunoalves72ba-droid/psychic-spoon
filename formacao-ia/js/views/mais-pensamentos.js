// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Pensamentos guardados durante o estudo, para resolver depois.
import { h, top, clear, fmtDia } from '../core/ui.js';
import { S, salvar, apagarPensamento } from '../core/estado.js';
import { capturar } from '../core/pensamento.js';

export default async function (el) {
  const lista = h('div.list');
  const pintar = () => {
    clear(lista);
    if (!S.pensamentos.length) { lista.append(h('p.muted', 'Nada guardado. Durante uma lição, o botão de anotar tira o pensamento da cabeça sem você sair do lugar.')); return; }
    for (const p of S.pensamentos) lista.append(h('div.card.flat.tight.row', { style: p.ok ? { opacity: '.55' } : null },
      h('button.tick', { type: 'button', 'aria-pressed': String(p.ok), style: { border: '0', background: 'none', padding: '0', width: 'auto', flex: '1' }, onclick: () => { p.ok = !p.ok; p._t = Date.now(); salvar('pensamentos'); pintar(); } }, h('span.box', '✓'), h('span.grow', h('span', { style: p.ok ? { textDecoration: 'line-through' } : null }, p.t), h('span.small.muted', { style: { display: 'block' } }, fmtDia(p.d)))),
      h('button.btn.quiet.small', { type: 'button', 'aria-label': 'Apagar', onclick: () => { apagarPensamento(p); pintar(); } }, 'Apagar')));
  };
  el.append(top('Pensamentos', '#/progresso'), h('p.dim', 'Marque quando resolver. Sem prazo, sem cobrança.'),
    h('button.btn.block', { type: 'button', onclick: () => { capturar(); setTimeout(() => { const b = document.querySelector('.sheet .btn.primary'); if (b) b.addEventListener('click', () => setTimeout(pintar, 50)); }, 0); } }, 'Anotar um pensamento'), lista);
  pintar();
}
