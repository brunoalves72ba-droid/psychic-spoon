// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Tirar a voz da garganta: autodiagnóstico, trilhas de técnicas e, em cada uma, passo a passo, erro comum e exemplo para ouvir.
import { h, top, seg, toggle, toast } from '../core/ui.js';
import { kv, log, events } from '../core/store.js';
import { unlock, now, stopAll, choirNote, pianoNote, pianoChord } from '../audio/engine.js';
import { noteName } from '../music/theory.js';
import { TRILHAS, TECNICAS, SINAIS, tecnica, recomendar, demoSpan, pickRoot } from '../data/tecnicas.js';

export default async function tecnicas(el, [id]) {
  const t = id ? tecnica(id) : null;
  return t ? detalhe(el, t) : lista(el);
}

const dotted = (cor, txt) => h('span.pill', h('span.dot', { css: { '--c': cor } }), txt);

async function lista(el) {
  const feitas = new Set((await events('tecnica')).map((e) => e.data.id));
  const marcados = new Set();
  const linha = (t) => h('a.item' + (feitas.has(t.id) ? '.done' : ''), { href: `#/voz/tecnicas/${t.id}` },
    h('span.n', feitas.has(t.id) ? '✓' : String(TECNICAS.indexOf(t) + 1)),
    h('span.t', h('b', t.name), h('span', `${t.tempo} · ${t.resumo}`)),
    h('span.chev', '›'));
  const out = h('div.col', { 'aria-live': 'polite' });
  const mostrar = () => {
    const ids = recomendar([...marcados]);
    out.replaceChildren(...(ids.length
      ? [h('p.small.muted', 'Comece por estas, nesta ordem:'), h('div.list', ids.map((i) => linha(tecnica(i))))]
      : [h('p.small.muted', 'Marque o que acontece com você e o app sugere por onde começar.')]));
  };
  mostrar();
  el.append(
    top('Tirar a voz da garganta', '#/voz'),
    h('section.card.col',
      h('h3', 'O que é cantar na garganta'),
      h('p.dim', 'É deixar a garganta fazer o trabalho que é do ar e do corpo. O som sai apertado, a voz cansa e, no agudo, quase sempre piora.'),
      h('p.dim', 'O caminho tem quatro passos: soltar o que aperta, deixar o ar sustentar, levar o som para a frente do rosto e passar isso para as músicas.'),
      h('p.small.muted', 'Faça os exercícios em volume baixo, uns 10 minutos por dia. Cada técnica mostra o passo a passo, o que você deve sentir, o erro mais comum e exemplos.')),
    h('section.card.col',
      h('h3', 'Você canta na garganta?'),
      h('p.small.muted', 'Marque o que acontece com você.'),
      SINAIS.map((s) => toggle(s.text, false, (on) => { on ? marcados.add(s.id) : marcados.delete(s.id); mostrar(); })),
      out),
    TRILHAS.map((tr) => h('section.col',
      h('div.row', h('span.dot', { css: { '--c': tr.cor } }), h('h2', tr.name)),
      h('p.small.muted', tr.about),
      h('div.list', TECNICAS.filter((t) => t.trilha === tr.id).map(linha)))),
    h('div.banner', h('span', '♥'), h('span', h('b', 'Dor é sinal de parada. '), 'Se arder, apertar ou doer, pare. Rouquidão por mais de duas semanas pede otorrinolaringologista ou fonoaudiólogo: este app não faz diagnóstico.')),
  );
}

async function detalhe(el, t) {
  const voice = await kv.get('voice', null);
  let vezes = (await events('tecnica')).filter((e) => e.data.id === t.id).length;
  const tr = TRILHAS.find((x) => x.id === t.trilha);
  const prox = TECNICAS[TECNICAS.indexOf(t) + 1];
  const feita = h('span.pill', vezes ? `Praticada ${vezes}×` : 'Ainda não praticada');
  const marcar = h('button.btn.block', { type: 'button', onclick: async () => {
    await log('tecnica', { id: t.id }); vezes++; feita.textContent = `Praticada ${vezes}×`; toast('Prática registrada.');
  } }, 'Marcar como praticada hoje');
  const demo = t.demo ? demoCard(t.demo, voice) : null;
  el.append(
    top(t.name, '#/voz/tecnicas'),
    h('div.row.wrap', dotted(tr.cor, tr.name), h('span.pill', `Tempo: ${t.tempo}`), feita),
    h('section.card', h('h3', 'Por que ajuda'), h('p.dim', t.porque)),
    h('section.card', h('h3', 'Passo a passo'),
      h('ol.steps', t.passos.map((p, i) => h('li', h('span', String(i + 1)), h('p', p))))),
    demo ? demo.el : null,
    h('section.card', h('h3', 'Como saber que deu certo'), h('ul.checks', t.sinais.map((s) => h('li.ok', s)))),
    h('section.cmp',
      h('div', { css: { '--c': 'var(--bad)' } }, h('b', 'Evite'), h('p.dim', t.evite)),
      h('div', { css: { '--c': 'var(--ok)' } }, h('b', 'Faça assim'), h('p.dim', t.faca))),
    h('section.card', h('h3', 'Exemplos para treinar'), h('ul.ex', t.exemplos.map((x) => h('li', x)))),
    t.link ? h('a.btn.block', { href: t.link.href }, t.link.label) : null,
    marcar,
    prox ? h('a.btn.primary.block', { href: `#/voz/tecnicas/${prox.id}` }, `Próxima: ${prox.name}`) : h('a.btn.primary.block', { href: '#/voz/tecnicas' }, 'Voltar à lista'),
    h('p.small.muted', 'Se arder, apertar ou doer, pare. Rouquidão por mais de duas semanas pede avaliação de um otorrinolaringologista ou de um fonoaudiólogo.'),
  );
  return () => demo && demo.stop();
}

/** Cartão “Ouvir o exemplo”: toca uma nota-guia e a melodia do exercício. A sílaba, quem canta é você. */
function demoCard(d, voice) {
  let faixa = 'media', timer = 0, on = false;
  const span = demoSpan(d);
  const btn = h('button.btn.primary.block', { type: 'button' }, 'Ouvir o exemplo');
  const info = h('p.small.muted');
  const root = () => pickRoot(span, voice, faixa);
  const label = () => { info.textContent = `Começa em ${noteName(root())}${voice ? ', dentro da sua extensão medida' : ''}. Toca só a melodia-guia: a sílaba ${d.syl}, quem canta é você.`; };
  const stop = () => { clearTimeout(timer); if (on) stopAll(); on = false; btn.textContent = 'Ouvir o exemplo'; };
  const play = async () => {
    await unlock(); stopAll();
    const r = root(), t0 = now() + 0.08, s = t0 + 1.25;
    pianoChord([r, r + 4, r + 7], t0, 1, { gain: 0.14 });
    let len = d.d;
    if (d.kind === 'notes') {
      d.pat.forEach((iv, i) => { const at = s + i * d.d; pianoNote(r + iv, at, d.d * 0.95, { gain: 0.26 }); choirNote(r + iv, at, d.d * 0.92, { voice: 3, vowel: d.vowel, gain: 0.09, vib: 0 }); });
      len = d.pat.length * d.d;
    } else if (d.kind === 'glide') {
      const n = choirNote(r + d.path[0], s, d.d, { voice: 3, vowel: d.vowel, gain: 0.15, vib: 0 });
      const parte = d.d / (d.path.length - 1);
      d.path.slice(1).forEach((p, i) => n.setMidi(r + p, s + i * parte + parte * 0.1, parte * 0.22));
      pianoNote(r + d.path[0], s, 0.8, { gain: 0.18 });
    } else choirNote(r, s, d.d, { voice: 3, vowel: d.vowel, gain: 0.14, vib: 0.4 });
    on = true; btn.textContent = 'Parar';
    timer = setTimeout(stop, (1.25 + len) * 1000 + 400);
  };
  btn.onclick = () => (on ? stop() : play());
  label();
  const faixas = voice ? null : seg([{ v: 'grave', label: 'Voz grave' }, { v: 'media', label: 'Voz média' }, { v: 'aguda', label: 'Voz aguda' }], faixa, (v) => { faixa = v; stop(); label(); }, { label: 'Faixa da voz' });
  return { stop, el: h('section.card.col', h('h3', 'Ouça o exemplo'), faixas, info, btn) };
}
