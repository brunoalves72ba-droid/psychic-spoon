// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Leitura de partitura: a nota aparece na pauta, você diz o nome e ouve o som.
import { h, s, top, seg, vib } from '../core/ui.js';
import { log, kv } from '../core/store.js';
import { pianoNote, unlock, now } from '../audio/engine.js';
import { pcName, noteName } from '../music/theory.js';

const NAT = [0, 2, 4, 5, 7, 9, 11];
/** Posição diatônica (passos de linha/espaço) de uma nota natural: Dó4 = 0. */
export const diaStep = (m) => (Math.floor(m / 12) - 5) * 7 + NAT.indexOf(((m % 12) + 12) % 12);
const fromStep = (st) => (Math.floor(st / 7) + 5) * 12 + NAT[((st % 7) + 7) % 7];
const LEVELS = [
  { id: 'sol1', name: 'Clave de Sol: linhas e espaços', clef: 'sol', lo: 2, hi: 10 },   // Mi4 a Fá5
  { id: 'sol2', name: 'Clave de Sol: com linhas suplementares', clef: 'sol', lo: -2, hi: 14 },
  { id: 'fa1', name: 'Clave de Fá: linhas e espaços', clef: 'fa', lo: -10, hi: -2 },      // Sol2 a Lá3
  { id: 'fa2', name: 'Clave de Fá: com linhas suplementares', clef: 'fa', lo: -14, hi: 2 },
];

/** Desenha a pauta com a clave e uma nota. bottom: passo diatônico da linha de baixo. */
function staff(clef, step) {
  const W = 320, H = 190, gap = 14, y0 = 123, bottom = clef === 'sol' ? 2 : -10; // linha de baixo: Mi4 (Sol) ou Sol2 (Fá)
  const Y = (st) => y0 - (st - bottom) * (gap / 2);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Pauta com clave de ${clef === 'sol' ? 'Sol' : 'Fá'} e uma nota`, style: { width: '100%', maxWidth: '420px', display: 'block', margin: '0 auto' } });
  for (let i = 0; i < 5; i++) svg.append(s('line', { x1: 14, x2: W - 14, y1: y0 - i * gap, y2: y0 - i * gap, stroke: '#f4ecdc', 'stroke-width': 1.4 }));
  if (clef === 'sol') svg.append(s('path', { d: `M62 ${y0 + 30} c-9 3 -15 -3 -12 -10 c2 -5 9 -6 12 -1 M62 ${y0 + 30} L56 ${y0 - 72} c-1 -14 12 -22 14 -8 c1 12 -24 24 -24 44 c0 15 12 22 24 20 c13 -3 14 -22 0 -24 c-10 -1 -15 9 -9 16`, fill: 'none', stroke: '#f4ecdc', 'stroke-width': 3, 'stroke-linecap': 'round' }));
  else svg.append(s('path', { d: `M40 ${y0 - 42} c4 -14 30 -14 30 6 c0 18 -14 30 -32 38`, fill: 'none', stroke: '#f4ecdc', 'stroke-width': 3.4, 'stroke-linecap': 'round' }), s('circle', { cx: 43, cy: y0 - 40, r: 5, fill: '#f4ecdc' }), s('circle', { cx: 80, cy: y0 - 49, r: 3.2, fill: '#f4ecdc' }), s('circle', { cx: 80, cy: y0 - 35, r: 3.2, fill: '#f4ecdc' }));
  const x = 190, y = Y(step);
  for (let st = bottom - 2; st >= step; st -= 2) svg.append(s('line', { x1: x - 18, x2: x + 18, y1: Y(st), y2: Y(st), stroke: '#f4ecdc', 'stroke-width': 1.4 }));
  for (let st = bottom + 10; st <= step; st += 2) svg.append(s('line', { x1: x - 18, x2: x + 18, y1: Y(st), y2: Y(st), stroke: '#f4ecdc', 'stroke-width': 1.4 }));
  svg.append(s('ellipse', { cx: x, cy: y, rx: 9.5, ry: 6.8, fill: '#ffd166', transform: `rotate(-20 ${x} ${y})` }));
  const up = step < bottom + 4; svg.append(s('line', { x1: up ? x + 8.6 : x - 8.6, x2: up ? x + 8.6 : x - 8.6, y1: y, y2: up ? y - 46 : y + 46, stroke: '#ffd166', 'stroke-width': 2 }));
  return svg;
}

export default async function partitura(el) {
  const savedLv = await kv.get('partitura:nivel', 'sol1');
  let lv = LEVELS.find((l) => l.id === savedLv) || LEVELS[0], cur = null, ok = 0, n = 0, locked = false;
  const box = h('div.stage', { style: { padding: '8px' } }), opts = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' } }), msg = h('p', { 'aria-live': 'polite', style: { minHeight: '3em' } }), stat = h('span.pill', '0 de 0');
  const next = () => { locked = false; let st; do { st = lv.lo + Math.floor(Math.random() * (lv.hi - lv.lo + 1)); } while (cur != null && st === cur); cur = st; box.replaceChildren(staff(lv.clef, st)); [...opts.children].forEach((b) => b.classList.remove('on')); };
  const answer = async (pcv, b) => {
    if (locked) return; locked = true; await unlock(); const m = fromStep(cur), good = ((m % 12) + 12) % 12 === pcv; n++; if (good) ok++;
    pianoNote(m, now(), 1.2, { gain: 0.3 }); vib(good ? 20 : [30, 40, 30]); b.classList.add('on');
    msg.textContent = good ? `Certo: ${noteName(m)}.` : `Era ${noteName(m)}. ${lv.clef === 'sol' ? 'Na clave de Sol, a segunda linha de baixo para cima é o Sol.' : 'Na clave de Fá, a quarta linha de baixo para cima é o Fá.'} Conte linha, espaço, linha a partir dela.`;
    stat.textContent = `${ok} de ${n}`; if (n % 10 === 0) await log('reading', { level: lv.id, ok, total: n });
    setTimeout(next, good ? 700 : 2400);
  };
  NAT.forEach((p) => opts.append(h('button.btn', { style: { borderRadius: '12px', padding: '6px' }, onclick: (e) => answer(p, e.currentTarget) }, pcName(p))));
  next();
  el.append(top('Partitura', '#/harmonia'), h('label.field', 'Nível', h('select', { onchange: (e) => { lv = LEVELS.find((l) => l.id === e.target.value); kv.set('partitura:nivel', lv.id); ok = 0; n = 0; stat.textContent = '0 de 0'; next(); } }, LEVELS.map((l) => h('option', { value: l.id, selected: l === lv }, l.name)))),
    h('section.card.col', h('div.row.between', h('h3', 'Que nota é esta?'), stat), box, opts, msg),
    h('section.prose', h('p', { html: 'A pauta tem cinco linhas e quatro espaços. Cada linha e cada espaço é uma nota; subir um passo é ir para a nota seguinte. A <b>clave</b> diz qual nota mora em qual linha.' }), h('p', { html: 'A <b>clave de Sol</b> marca o Sol na segunda linha e serve às vozes agudas. A <b>clave de Fá</b> marca o Fá na quarta linha e serve às vozes graves. O <b>Dó central</b> fica em uma linha suplementar: logo abaixo da pauta na clave de Sol, logo acima na clave de Fá.' })));
  void seg;
}
