// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// O APE-IA crescendo: cada módulo concluído acende uma parte do assistente.
import { s } from './ui.js';

export const PARTES = ['a base', 'a cabeça', 'a voz', 'a memória de consulta', 'os braços', 'o motor', 'as pernas e a antena'];

/** feitos: lista de 7 booleanos (M0…M6). */
export function robo(feitos, tamanho = 180) {
  const g = (m, ...kids) => s('g', { class: feitos[m] ? '' : 'apagado', style: { color: `var(--m${m})` } }, ...kids);
  const st = { fill: 'none', stroke: 'currentColor', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  const cheio = { fill: 'currentColor', stroke: 'none' };
  const n = feitos.filter(Boolean).length;
  return s('svg', { viewBox: '0 0 200 224', width: tamanho, height: Math.round(tamanho * 1.12), class: 'robo', role: 'img', 'aria-label': `APE-IA: ${n} de 7 partes montadas` },
    // M0 — base
    g(0, s('rect', { x: 44, y: 204, width: 112, height: 12, rx: 6, ...cheio })),
    // M6 — pernas e antena (endereço público)
    g(6, s('path', { d: 'M84 170v32M116 170v32', ...st, 'stroke-width': 12 }),
      s('path', { d: 'M100 40V22', ...st }), s('circle', { cx: 100, cy: 16, r: 6, ...cheio }),
      s('path', { d: 'M82 14a20 20 0 0 1 0-0M118 8a14 14 0 0 1 0 16M82 8a14 14 0 0 0 0 16', ...st, 'stroke-width': 4 })),
    // M4 — braços (automação)
    g(4, s('path', { d: 'M52 112v40M148 112v40', ...st, 'stroke-width': 14 }), s('circle', { cx: 52, cy: 160, r: 9, ...cheio }), s('circle', { cx: 148, cy: 160, r: 9, ...cheio })),
    // M5 — tronco (motor Python)
    g(5, s('rect', { x: 66, y: 102, width: 68, height: 70, rx: 14, ...st })),
    // M3 — memória de consulta (livro no peito)
    g(3, s('rect', { x: 84, y: 118, width: 32, height: 38, rx: 5, ...cheio }), s('path', { d: 'M91 129h18M91 138h18M91 147h11', fill: 'none', stroke: 'var(--bg2)', 'stroke-width': 3, 'stroke-linecap': 'round' })),
    // M1 — cabeça (modelo escolhido)
    g(1, s('rect', { x: 62, y: 40, width: 76, height: 54, rx: 18, ...st }), s('circle', { cx: 85, cy: 62, r: 6, ...cheio }), s('circle', { cx: 115, cy: 62, r: 6, ...cheio })),
    // M2 — voz (prompts)
    g(2, s('path', { d: 'M88 78q12 9 24 0', ...st, 'stroke-width': 4 }), s('path', { d: 'M150 48h30a6 6 0 0 1 6 6v16a6 6 0 0 1-6 6h-16l-8 8v-8h-6', ...st, 'stroke-width': 4 }), s('path', { d: 'M160 58h18M160 66h10', ...st, 'stroke-width': 3 })),
  );
}
