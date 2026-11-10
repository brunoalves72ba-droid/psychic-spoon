// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Ouvido: intervalos, tríades, tétrades, tensões, funções, cadências e "qual voz mexeu?".
import { h, top, seg, vib } from '../core/ui.js';
import { kv, log, roteiro } from '../core/store.js';
import { pianoNote, choirChord, unlock, now, stopAll } from '../audio/engine.js';
import { KINDS, kindById, answers, answerOf, newState, nextItem, grade, buildSound } from '../music/ear.js';

const ROUND = 10;
export default async function ouvido(el, [kindArg]) {
  let kind = kindById(kindArg || (await kv.get('ear:last', 'intervalos')));
  let st, q = null, sound = null, n = 0, ok = 0, locked = false;
  const head = h('div.row.between'), ask = h('h2'), opts = h('div.quiz'), fb = h('p', { 'aria-live': 'polite', style: { minHeight: '3em' } }), nextBtn = h('button.btn.primary.block.hide', 'Próxima');
  const play = () => { stopAll(); const t = now() + 0.05; for (const e of sound) { if (e.coro) choirChord(e.notes, t + e.at, e.dur, { gain: 0.14 }); else e.notes.forEach((m) => pianoNote(m, t + e.at, e.dur, { gain: e.notes.length > 2 ? 0.17 : 0.26 })); } };
  const paintHead = () => head.replaceChildren(h('span.pill', `Pergunta ${Math.min(n + 1, ROUND)} de ${ROUND}`), h('span.pill', `Nível ${st.level} de 3`), h('span.pill', `${ok} ${ok === 1 ? 'acerto' : 'acertos'}`));
  const load = async () => { st = { ...newState(), ...(await kv.get('ear:' + kind.id, {})), queue: [], asked: 0 }; n = 0; ok = 0; await kv.set('ear:last', kind.id); question(false); };
  const question = (sounds = true) => {
    locked = false; q = nextItem(kind, st); sound = buildSound(kind, q.item, st.level);
    ask.textContent = kind.ask; fb.textContent = q.review ? 'Revisão: este você errou há pouco.' : ''; nextBtn.classList.add('hide'); paintHead();
    const list = h('div.opts', answers(kind, st.level).map((a) => h('button.opt', { type: 'button', onclick: (e) => answer(a, e.currentTarget) }, a)));
    opts.replaceChildren(list); if (sounds) play();
  };
  const answer = async (a, b) => {
    if (locked) return; locked = true; n++;
    const right = answerOf(kind, q.item), good = a === right; if (good) ok++;
    b.classList.add(good ? 'ok' : 'no'); [...b.parentNode.children].find((x) => x.textContent === right).classList.add('ok');
    vib(good ? 25 : [40, 60, 40]);
    const ch = grade(kind, st, q.item, good);
    fb.textContent = (good ? 'Certo. ' : `Era ${right}${kind.id === 'funcoes' ? ` (grau ${q.item})` : ''}. Ouça de novo antes de seguir. `) + (ch > 0 ? 'Subiu de nível: entram itens novos.' : ch < 0 ? 'Voltamos um nível para firmar a base.' : '');
    await kv.set('ear:' + kind.id, { level: st.level, streak: st.streak, misses: st.misses });
    paintHead();
    if (n >= ROUND) { await log('ear', { kind: kind.id, ok, total: ROUND, level: st.level }); await roteiro.mark('ouvido'); nextBtn.textContent = `Rodada concluída: ${ok} de ${ROUND}. Jogar outra`; }
    else nextBtn.textContent = 'Próxima';
    nextBtn.classList.remove('hide');
  };
  nextBtn.onclick = async () => { await unlock(); if (n >= ROUND) { n = 0; ok = 0; } question(); };
  el.append(
    top('Ouvido', '#/harmonia'),
    seg(KINDS.map((k) => ({ v: k.id, label: k.name })), kind.id, (v) => { kind = kindById(v); load(); }, { label: 'Tipo de exercício' }),
    head,
    h('section.card.col', ask, h('button.btn.block', { onclick: async () => { await unlock(); play(); } }, '▶ Ouvir'), opts, fb, nextBtn),
    h('p.small.muted', 'A dificuldade se ajusta sozinha: cinco acertos seguidos abrem itens novos, e o que você erra volta logo depois.'),
  );
  await load();
}
