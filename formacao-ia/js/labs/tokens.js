// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Laboratório de tokens: o texto partido em peças (aproximação didática) e a contagem.
import { h, clear, fmt } from '../core/ui.js';
import { tokensAprox, contarPalavras } from '../core/texto.js';
import { missao, semMissao } from './comum.js';

const CORES = ['var(--m1)', 'var(--m3)', 'var(--m4)', 'var(--m5)', 'var(--m2)'];
const EX = {
  pt: 'A compreensão automática de documentação técnica exige atenção.',
  en: 'Automatic understanding of technical documentation requires attention.',
};

export default function ({ missao: m, feito }) {
  const mi = m ? missao(['Escreva uma frase com **8 palavras ou mais**.', 'Compare: há mais tokens do que palavras?'], feito) : semMissao();
  const ta = h('textarea', { rows: 3, value: 'O céu é azul hoje.', 'aria-label': 'Texto para contar tokens', maxLength: 2000 });
  const vis = h('div.toks', { 'aria-hidden': 'true' });
  const nums = h('div.stats');
  const pintar = () => {
    const t = tokensAprox(ta.value); const w = contarPalavras(ta.value);
    clear(vis); t.forEach((x, i) => vis.append(h('span', { css: { '--c': CORES[i % CORES.length] } }, x === '\n' ? '⏎' : x)));
    clear(nums).append(h('div.stat', h('b', fmt(w)), h('span', 'palavras')), h('div.stat', h('b', fmt(t.length)), h('span', 'tokens (aprox.)')), h('div.stat', h('b', fmt(ta.value.length)), h('span', 'caracteres')));
    if (w >= 8) { mi.marcar(0); if (t.length > w) mi.marcar(1); }
  };
  ta.addEventListener('input', pintar); pintar();
  return h('div.lab', mi.el, ta, nums, vis,
    h('div.row.wrap', h('button.btn.small', { type: 'button', onclick: () => { ta.value = EX.pt; pintar(); } }, 'Exemplo em português'), h('button.btn.small', { type: 'button', onclick: () => { ta.value = EX.en; pintar(); } }, 'Mesmo exemplo em inglês')),
    h('p.small.muted', 'Aproximação didática: os tokenizadores de verdade usam tabelas aprendidas e dão números diferentes para cada modelo. Para a contagem real, use o tokenizer do próprio fornecedor.'));
}
