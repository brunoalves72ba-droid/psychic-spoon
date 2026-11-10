// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Início: torre das seis vozes (Cmaj13), roteiro do dia e dias seguidos.

import { h, s, loop, vib, reducedMotion } from '../core/ui.js';
import { practice, streak, roteiro, events } from '../core/store.js';
import { choirNote, unlock, now } from '../audio/engine.js';
import { VOICE_COLORS, VOICE_NAMES, noteName, midiToFreq } from '../music/theory.js';

// Cmaj13 do baixo ao líder: fundamental, 5ª, 7ª maior, 3ª, 13ª, 9ª
const TOWER = [48, 55, 59, 64, 69, 74];
const DEG = ['fundamental', '5ª', '7ª maior', '3ª', '13ª', '9ª'];
const WIDTH = [100, 90, 80, 70, 60, 50];

export default async function inicio(el) {
  const voices = new Array(6).fill(null);
  const status = h('p.center.dim', { 'aria-live': 'polite' }, 'Toque nas barras para ligar cada voz.');
  const tower = h('div.tower', { role: 'group', 'aria-label': 'Torre das seis vozes' });
  const waves = [];
  TOWER.forEach((m, i) => {
    const cv = h('canvas');
    const b = h('button', { type: 'button', 'aria-pressed': 'false', css: { '--c': VOICE_COLORS[i] }, style: { width: WIDTH[i] + '%' }, onclick: async () => {
      await unlock();
      if (voices[i]) { voices[i].stop(); voices[i] = null; }
      else voices[i] = choirNote(m, now(), Infinity, { voice: i, gain: i === 0 ? 0.17 : 0.12, vowel: i === 0 ? 'o' : 'u', pan: (i / 5 - 0.5) * 0.8 });
      b.setAttribute('aria-pressed', String(!!voices[i]));
      const on = voices.filter(Boolean).length;
      status.textContent = on === 0 ? 'Toque nas barras para ligar cada voz.' : on < 6 ? `${on} de 6 vozes. Ouça como cada nota muda a cor do acorde.` : 'Cmaj13 completo: seis vozes, seis notas diferentes.';
      if (on === 6) vib([30, 40, 30]);
    } }, h('span', VOICE_NAMES[i]), h('span.small', `${noteName(m)} · ${DEG[i]}`), cv);
    waves.push(cv); tower.append(b);
  });
  // onda dentro de cada barra ligada: o comprimento acompanha a altura da nota
  const still = reducedMotion();
  loop(tower, (t) => {
    waves.forEach((cv, i) => {
      const on = !!voices[i];
      if (!on) { if (cv.width) { cv.width = 0; } return; }
      const r = cv.getBoundingClientRect(); if (cv.width !== Math.round(r.width)) { cv.width = Math.round(r.width); cv.height = Math.round(r.height); }
      const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
      const cycles = midiToFreq(TOWER[i]) / 55; g.strokeStyle = '#0e2030'; g.lineWidth = 2; g.beginPath();
      for (let x = 0; x <= cv.width; x += 3) { const y = cv.height / 2 + Math.sin((x / cv.width) * cycles * Math.PI * 2 - (still ? 0 : t * 7)) * cv.height * 0.3; x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    });
  });

  const [p, done, lessons] = await Promise.all([practice(), roteiro.today(), events('lesson')]);
  const days = streak(p);
  const doneIds = new Set(lessons.map((e) => e.data.id));
  let next = 1; while (doneIds.has(next) && next < 16) next++;
  const STEPS = [
    ['respirar', 'Respirar', 'Dois minutos de 4-4-8', '#/voz/respiracao'],
    ['aquecer', 'Aquecer', 'Vibração de lábios e sirene', '#/voz/aquecimento'],
    ['aula', 'Aula', `Harmonia · aula ${next}`, `#/harmonia/aula/${next}`],
    ['imersao', 'Imersão', 'Ouça e cante dentro do acorde', '#/harmonia/imersao'],
    ['ouvido', 'Ouvido', 'Dez perguntas rápidas', '#/harmonia/ouvido'],
  ];
  const nDone = STEPS.filter(([k]) => done[k]).length;

  el.append(
    h('header.row.between',
      h('div', h('div.eyebrow', 'Sexteto'), h('h1', 'Seis vozes, um acorde')),
      h('a.back', { href: '#/ajustes', 'aria-label': 'Ajustes', style: { marginRight: '-10px', marginLeft: '0' } }, s('svg', { viewBox: '0 0 24 24' }, s('circle', { cx: 12, cy: 12, r: 3 }), s('path', { d: 'M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8' })))),
    h('section.card', tower, status),
    h('section.col',
      h('div.row.between', h('h2', 'Roteiro do dia'), h('span.pill', { 'aria-label': `${days} dias seguidos` }, h('span.dot', { css: { '--c': days ? 'var(--v5)' : 'var(--ink3)' } }), `${days} ${days === 1 ? 'dia seguido' : 'dias seguidos'}`)),
      h('p.small.muted', nDone === 5 ? 'Roteiro completo hoje. Bom descanso para a voz.' : `${nDone} de 5 etapas feitas hoje.`),
      h('div.road', STEPS.map(([k, title, sub, href], i) => h('a.item' + (done[k] ? '.done' : ''), { href }, h('span.n', done[k] ? '✓' : String(i + 1)), h('span.t', h('b', title), h('span', sub)), h('span.chev', '›')))),
    ),
    h('section.tools',
      h('a.tool', { href: '#/harmonia/glossario', css: { '--c': 'var(--v2)' } }, h('b', 'Glossário'), h('span', 'Os termos, em uma frase')),
      h('a.tool', { href: '#/harmonia/metronomo', css: { '--c': 'var(--v4)' } }, h('b', 'Metrônomo'), h('span', 'Com vibração')),
    ),
  );
  return () => voices.forEach((v) => v && v.stop());
}
