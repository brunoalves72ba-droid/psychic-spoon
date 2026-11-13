// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Sessão de cartões: tentar lembrar, ver a resposta, dizer como foi. Quem errou revê no fim da sessão.
import { h, clear, put, rich, icon, toast, plural } from '../core/ui.js';
import { S, filaDeHoje, vencidosHoje, responderCartao } from '../core/estado.js';
import { cartao, modulo } from '../data/curso.js';
import { ESCADA } from '../core/srs.js';
import { verificarConquistas } from '../core/conquistas.js';
import { capturar } from '../core/pensamento.js';
import { redesenhar } from '../app.js';

export default async function (el, [modo]) {
  let fila = filaDeHoje(modo === 'mais' ? 5 : 0).map((id) => ({ id, segunda: false }));
  const total = fila.length;
  let feitos = 0, dePrimeira = 0, erradas = 0;
  const cont = h('span.small.muted.num');
  const barraTopo = h('div.segs', { role: 'progressbar', 'aria-label': 'Cartões da sessão' });
  const corpo = h('div');
  const acoes = h('div');
  el.append(h('div.ptop', h('a.x', { href: '#/revisar', 'aria-label': 'Sair da revisão' }, icon('fecha')), barraTopo, cont), corpo, h('div.acao-bar', acoes));

  if (!total) {
    clear(acoes);
    corpo.append(h('div.festa', h('div.selo', icon('check')), h('h1', 'Nada para revisar agora'), h('p.dim', 'Os cartões voltam na hora certa. Enquanto isso, que tal uma lição?'), h('a.btn.primary.block', { href: '#/hoje' }, 'Voltar para Hoje')));
    return;
  }

  function pintarTopo() {
    clear(barraTopo);
    for (let i = 0; i < total; i++) barraTopo.append(h('i' + (i < feitos ? '.on' : i === feitos ? '.now' : '')));
    barraTopo.setAttribute('aria-valuenow', feitos); barraTopo.setAttribute('aria-valuemax', total);
    cont.textContent = `${Math.min(feitos + 1, total)}/${total}`;
  }

  function proximo() {
    pintarTopo();
    if (!fila.length) return fim();
    const item = fila[0];
    const c = cartao(item.id, S.meus);
    if (!c) { fila.shift(); feitos++; return proximo(); }
    const est = S.cartoes[item.id];
    const m = c.m != null ? modulo(c.m) : null;
    const verso = h('div.verso.hide', h('b', rich(c.v)), c.w ? h('span', rich(c.w)) : null, c.lid ? h('a.small', { href: `#/licao/${c.lid}`, style: { display: 'inline-block', marginTop: '10px' } }, `Rever a lição ${c.lid}`) : null);
    clear(corpo).append(h('article.cartao', { css: m ? { '--c': m.cor } : null },
      h('div.row.between', h('span.tag' + (m ? '.c' : ''), c.meu ? 'Seu cartão' : `${c.lid} · ${c.licao}`), item.segunda ? h('span.tag', 'de novo') : h('span.small.muted', `degrau de ${ESCADA[est.s]} ${ESCADA[est.s] === 1 ? 'dia' : 'dias'}`)),
      h('div.frente', rich(c.f)), verso));
    const mostrar = h('button.btn.primary.big', { type: 'button', onclick: () => { verso.classList.remove('hide'); pintarNotas(item); } }, 'Mostrar a resposta');
    put(clear(acoes), h('button.btn.big.pens', { type: 'button', 'aria-label': 'Anotar um pensamento e voltar', onclick: capturar }, icon('nota')), mostrar);
    window.scrollTo(0, 0);
  }

  function pintarNotas(item) {
    const notas = h('div.notas3');
    if (item.segunda) {
      notas.style.gridTemplateColumns = '1fr 1fr';
      notas.append(
        h('button.btn', { type: 'button', data: { nota: 'ainda' }, onclick: () => { fila.push(fila.shift()); proximo(); } }, 'Ainda não', h('small', 'volta no fim')),
        h('button.btn.primary', { type: 'button', data: { nota: 'agora' }, onclick: () => { fila.shift(); proximo(); } }, 'Agora lembrei', h('small', 'segue')));
    } else {
      const dar = (nota) => () => {
        responderCartao(item.id, nota);
        feitos++;
        if (nota === 'errei') { erradas++; fila.push({ id: item.id, segunda: true }); } else if (nota === 'lembrei') dePrimeira++;
        fila.shift();
        proximo();
      };
      notas.append(
        h('button.btn', { type: 'button', data: { nota: 'errei' }, onclick: dar('errei') }, 'Errei', h('small', 'volta amanhã')),
        h('button.btn', { type: 'button', data: { nota: 'dificil' }, onclick: dar('dificil') }, 'Difícil', h('small', 'repete o prazo')),
        h('button.btn.primary', { type: 'button', data: { nota: 'lembrei' }, onclick: dar('lembrei') }, 'Lembrei', h('small', 'sobe um degrau')));
    }
    clear(acoes).append(notas);
  }

  function fim() {
    clear(acoes);
    const resta = vencidosHoje().length;
    put(clear(corpo), h('div.festa',
      h('div.selo', icon('check')), h('h1', 'Revisão feita'),
      h('div.row.wrap', { style: { justifyContent: 'center' } }, h('span.xp', `+${total * 2} XP`), h('span.tag', plural(total, 'cartão', 'cartões'))),
      h('p.dim', erradas ? `${dePrimeira} lembrados de primeira. ${plural(erradas, 'cartão volta', 'cartões voltam')} amanhã: errar agora é o que faz lembrar depois.` : `${dePrimeira} lembrados de primeira. Cada acerto empurra o cartão para mais longe.`),
      resta ? h('a.btn.block', { href: '#/revisar/cartoes/mais', onclick: (e) => { if (location.hash === '#/revisar/cartoes/mais') { e.preventDefault(); redesenhar(); } } }, `Estou no embalo: mais ${Math.min(5, resta)}`) : null,
      h('a.btn.primary.block', { href: '#/hoje' }, 'Voltar para Hoje')));
    for (const c of verificarConquistas()) toast(`Conquista: ${c.t}`);
  }

  proximo();
}
