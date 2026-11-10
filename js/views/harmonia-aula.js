// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Uma aula: texto, experimento, exercício de cantar junto e três perguntas.
import { h, top, quiz, toast } from '../core/ui.js';
import { log, events, roteiro } from '../core/store.js';
import { AULAS } from '../data/aulas.js';
import { LABS, singLab } from '../core/lab.js';

export default async function aula(el, [idArg]) {
  const a = AULAS.find((x) => x.id === +idArg) || AULAS[0];
  const { type, ...cfg } = a.lab;
  const lab = LABS[type](cfg);
  let sung = false, sungCents = null;
  const sing = singLab({ ...a.sing, onDone: (c) => { sung = true; sungCents = c; if (c != null) log('sing', { source: 'aula', lesson: a.id, cents: Math.round(c) }); } });
  const doneBox = h('div');
  const already = (await events('lesson')).some((e) => e.data.id === a.id);
  const finish = async (right, total) => {
    await log('lesson', { id: a.id, score: right, total, sung, cents: sungCents != null ? Math.round(sungCents) : null });
    await roteiro.mark('aula');
    const next = AULAS.find((x) => x.id === a.id + 1);
    doneBox.replaceChildren(h('div.card.col', h('h3', right === total ? 'Aula concluída: tudo certo!' : `Aula concluída: ${right} de ${total}.`), sung ? null : h('p.small.muted', 'Você ainda pode fazer o exercício de cantar acima.'), next ? h('a.btn.primary', { href: `#/harmonia/aula/${next.id}` }, `Próxima: ${next.title}`) : h('a.btn.primary', { href: '#/harmonia/imersao' }, 'Trilha completa! Ir para a Imersão')));
    toast('Aula registrada na Evolução.');
  };
  const sec = (n, t) => h('div.step-h', h('span', String(n)), h('h2', t));
  el.append(
    top(`${a.id}. ${a.title}`, '#/harmonia'),
    already ? h('p.small.muted', '✓ Você já concluiu esta aula. Pode refazer quando quiser.') : null,
    h('section.prose', a.text.map((p) => h('p', { html: p }))),
    sec(1, 'Experimente'), h('section.card', lab),
    sec(2, 'Cante'), h('section.card', sing),
    sec(3, 'Perguntas'), h('section.card', quiz(a.quiz, finish)),
    doneBox,
  );
  return () => sing.stop();
}
