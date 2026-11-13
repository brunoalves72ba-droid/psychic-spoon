// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Laboratório “próximo pedaço”: um modelo de brinquedo que escolhe um pedaço por vez, com temperatura.
import { h, clear, slider, fmt } from '../core/ui.js';
import { softmax, amostrar } from '../core/texto.js';
import { missao, semMissao } from './comum.js';

// notas (logits) inventadas para cada passo — um modelo de verdade teria dezenas de milhares de candidatos
const PASSOS = [
  [['azul', 3.2], ['lindo', 2.3], ['imenso', 1.9], ['cinza', 1.7], ['estrelado', 1.2], ['verde', 0.1], ['pizza', -1.6]],
  [['hoje', 2.4], ['à noite', 1.9], ['no verão', 1.7], ['e calmo', 1.4], ['de manhã', 1.2], ['para sempre', 0.3], ['de queijo', -1.5]],
  [['.', 3.0], ['!', 1.8], ['…', 1.0], [', disse ela.', 0.4]],
];

export default function ({ missao: m, feito }) {
  let T = 1, passo = 0, frase = ['O céu é'], frases0 = 0, frasesAlta = 0, total = 0;
  const mi = m === 'temperatura' ? missao(['Gere **2 frases com temperatura 0**.', 'Gere **2 frases com temperatura 1,2 ou mais**.'], feito)
    : m ? missao(['Gere **3 frases inteiras** e repare: cada pedaço foi sorteado.'], feito) : semMissao();
  const fraseEl = h('div.frase', { 'aria-live': 'polite' });
  const probs = h('div.probs');
  const hist = h('ol.small.dim', { style: { margin: 0, paddingLeft: '1.2em' } });
  const pintar = (escolhido) => {
    clear(fraseEl).append(frase.slice(0, -1).join(' ') + (frase.length > 1 ? ' ' : ''), h('mark', frase[frase.length - 1]));
    clear(probs);
    if (passo >= PASSOS.length) { probs.append(h('p.small.muted', 'Fim da frase. Toque em “Nova frase”.')); return; }
    const c = PASSOS[passo]; const p = softmax(c.map((x) => x[1]), T);
    c.forEach(([nm], i) => probs.append(h('div.prob', h('span.nm', { title: nm }, nm), h('div.bar', { css: { '--c': i === escolhido ? 'var(--ouro)' : 'var(--acao)' } }, h('i', { style: { width: Math.max(1, p[i] * 100) + '%' } })), h('span.pc', `${fmt(p[i] * 100, p[i] < 0.1 ? 1 : 0)}%`))));
  };
  const um = () => {
    if (passo >= PASSOS.length) return;
    const c = PASSOS[passo]; const p = softmax(c.map((x) => x[1]), T);
    const i = amostrar(p);
    frase.push(c[i][0]); passo++;
    if (passo >= PASSOS.length) {
      total++;
      const txt = frase.join(' ').replace(/ ([.!…,])/g, '$1');
      hist.prepend(h('li', `${txt} (temperatura ${fmt(T, 1)})`));
      if (T === 0) frases0++; if (T >= 1.2) frasesAlta++;
      if (m === 'temperatura') { if (frases0 >= 2) mi.marcar(0); if (frasesAlta >= 2) mi.marcar(1); } else if (total >= 3) mi.marcar(0);
    }
    pintar(i);
  };
  const nova = () => { frase = ['O céu é']; passo = 0; pintar(); };
  const sl = slider('Temperatura', { min: 0, max: 2, step: 0.1, value: T, fmtv: (v) => fmt(v, 1) }, (v) => { T = v; pintar(); });
  pintar();
  return h('div.lab', mi.el,
    h('div.card.flat', fraseEl, h('div.small.muted', { style: { margin: '10px 0 6px' } }, 'Chances do próximo pedaço:'), probs), sl,
    h('div.row', h('button.btn.primary.grow', { type: 'button', onclick: um }, 'Próximo pedaço'), h('button.btn.grow', { type: 'button', onclick: () => { while (passo < PASSOS.length) um(); } }, 'Até o fim')),
    h('button.btn.quiet.block', { type: 'button', onclick: nova }, 'Nova frase'),
    h('p.small.muted', 'Com temperatura 0, sai sempre o pedaço mais provável. Subindo, os improváveis (até “pizza”) ganham chance.'), hist);
}
