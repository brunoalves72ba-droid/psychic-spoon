// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Laboratório de similaridade de cosseno: duas setas num plano; só o ângulo importa.
import { h, s, clear, slider, fmt } from '../core/ui.js';
import { cosseno } from '../core/texto.js';
import { missao, semMissao } from './comum.js';

export default function ({ missao: m, feito }) {
  const mi = m ? missao(['Gire B até a similaridade passar de **0,95**.', 'Agora deixe a similaridade **perto de 0** (entre −0,05 e 0,05).'], feito) : semMissao();
  const A = [3, 1];
  let ang = 120, comp = 2.5, alinhou = false;
  const svg = s('svg', { viewBox: '-5 -5 10 10', role: 'img', 'aria-label': 'Duas setas no plano' });
  const val = h('div.big', { style: { textAlign: 'center' } });
  const leg = h('p.small.dim', { style: { textAlign: 'center' } });
  const seta = (x, y, cor) => [s('line', { x1: 0, y1: 0, x2: x, y2: -y, stroke: cor, 'stroke-width': 0.18, 'stroke-linecap': 'round' }), s('circle', { cx: x, cy: -y, r: 0.28, fill: cor })];
  const pintar = () => {
    const B = [comp * Math.cos(ang * Math.PI / 180), comp * Math.sin(ang * Math.PI / 180)];
    const c = cosseno(A, B);
    clear(svg).append(s('line', { x1: -5, y1: 0, x2: 5, y2: 0, stroke: 'var(--line2)', 'stroke-width': 0.04 }), s('line', { x1: 0, y1: -5, x2: 0, y2: 5, stroke: 'var(--line2)', 'stroke-width': 0.04 }),
      ...seta(A[0], A[1], 'var(--acao)'), ...seta(B[0], B[1], 'var(--m3)'),
      s('text', { x: A[0] + 0.3, y: -A[1], 'font-size': 0.7, fill: 'var(--acao)' }, 'A'), s('text', { x: B[0] + 0.3, y: -B[1], 'font-size': 0.7, fill: 'var(--m3)' }, 'B'));
    val.textContent = fmt(c, 2);
    leg.textContent = c > 0.95 ? 'Quase o mesmo sentido.' : Math.abs(c) < 0.05 ? 'Sem relação: setas perpendiculares.' : c < -0.9 ? 'Sentidos opostos (raro com texto).' : 'Alguma semelhança.';
    if (c > 0.95) { mi.marcar(0); alinhou = true; }
    if (alinhou && Math.abs(c) < 0.05) mi.marcar(1);
  };
  pintar();
  return h('div.lab', mi.el, h('div.plano', svg), val, leg,
    slider('Ângulo de B', { min: 0, max: 360, step: 1, value: ang, unit: '°' }, (v) => { ang = v; pintar(); }),
    slider('Comprimento de B', { min: 0.5, max: 4.5, step: 0.1, value: comp, fmtv: (v) => fmt(v, 1) }, (v) => { comp = v; pintar(); }),
    h('p.small.muted', 'Mude o comprimento: a similaridade não muda. O cosseno só olha a direção.'));
}
