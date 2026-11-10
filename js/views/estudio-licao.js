// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Uma lição do curso de produção: texto, foto real, simulador(es) e perguntas.
import { h, top, quiz, toast } from '../core/ui.js';
import { log, events } from '../core/store.js';
import { LICOES, licao, MODULOS } from '../data/licoes.js';
import { photo } from '../core/photo.js';
import { SIMS } from '../core/sim.js';
import { SIMS2 } from '../core/sim2.js';
import { mesaUI } from '../core/mesa-ui.js';
import { voiceBuffer } from '../audio/sources.js';
import { stopAll } from '../audio/engine.js';

/** Simulador "canal": um canal completo da mesa virtual, com a voz de exemplo. */
function canal() {
  const box = h('div.col', h('p.small.muted', 'Preparando o canal…')); let ui = null;
  voiceBuffer().then((b) => { ui = mesaUI({ buffers: [b], names: ['Voz'], missions: false }); box.replaceChildren(h('p.small.muted', 'Um canal de verdade, de cima a baixo. Gire o ganho até a luz de clip acender, ligue o HPF, mexa no médio e ouça. Deslize para ver o master.'), ui.el); });
  box.stop = () => ui && ui.stop();
  return box;
}
const ALL = { ...SIMS, ...SIMS2, canal };

export default async function licaoView(el, [idArg]) {
  const l = licao(idArg) || LICOES[0]; const mod = MODULOS.find((m) => m.id === l.mod);
  const already = (await events('studio')).some((e) => e.data.lesson === l.id);
  const doneBox = h('div'); const sims = l.sims.map(([id, name]) => ({ name, el: ALL[id]() }));
  const idx = LICOES.indexOf(l), next = LICOES[idx + 1];
  const finish = async (right, total) => { await log('studio', { lesson: l.id, score: right, total }); doneBox.replaceChildren(h('div.card.col', h('h3', right === total ? 'Lição concluída: tudo certo!' : `Lição concluída: ${right} de ${total}.`), next ? h('a.btn.primary', { href: `#/estudio/licao/${next.id}` }, `Próxima: ${next.title}`) : h('a.btn.primary', { href: '#/estudio/projeto' }, 'Curso completo! Fazer o projeto final'))); toast('Lição registrada.'); };
  const sec = (n, t) => h('div.step-h', h('span', String(n)), h('h2', t));
  el.append(top(l.title, '#/estudio'), h('div.eyebrow', `Módulo ${mod.id} · ${mod.name} · lição ${l.id}`), already ? h('p.small.muted', '✓ Você já concluiu esta lição.') : null,
    photo(l.fotos[0]), h('section.prose', l.text.map((p) => h('p', { html: p }))), l.fotos.slice(1).map((k) => photo(k)),
    sec(1, sims.length > 1 ? 'Simuladores' : 'Simulador'), sims.map((s) => h('section.card.col', h('h3', s.name), s.el)),
    sec(2, 'Perguntas'), h('section.card', quiz(l.quiz, finish)), doneBox);
  return () => { stopAll(); sims.forEach((s) => s.el.stop && s.el.stop()); };
}
