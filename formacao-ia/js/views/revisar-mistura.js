// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Revisão misturada: perguntas de módulos diferentes, embaralhadas (intercalação).
import { h, clear, top, icon, toast } from '../core/ui.js';
import { S, ganhar, tocarDia, salvar, XP } from '../core/estado.js';
import { TODAS, modulo, moduloDe } from '../data/curso.js';
import { pergunta, embaralhar } from '../core/exercicios.js';
import { hoje } from '../core/dia.js';

/** Escolhe até n perguntas de lições concluídas, alternando módulos. */
export function sortear(licoes, n = 8) {
  const feitas = TODAS.filter((L) => licoes[L.id] && licoes[L.id].feita);
  const porMod = new Map();
  for (const L of feitas) for (let i = 0; i < L.quiz.length; i++) { const m = moduloDe(L.id); if (!porMod.has(m)) porMod.set(m, []); porMod.get(m).push({ L, i }); }
  const filas = [...porMod.values()].map((x) => embaralhar(x));
  const out = [];
  while (out.length < n && filas.some((f) => f.length)) for (const f of embaralhar(filas)) if (f.length && out.length < n) out.push(f.pop());
  return embaralhar(out);
}

export default async function (el) {
  const qs = sortear(S.licoes);
  if (qs.length < 4) { el.append(top('Revisão misturada', '#/revisar'), h('p.dim', 'Ela abre depois de 4 lições concluídas. Misturar só faz sentido quando há o que misturar.'), h('a.btn.primary', { href: '#/hoje/comecar' }, 'Fazer a próxima lição')); return; }
  let i = 0, certas = 0;
  const corpo = h('div');
  const barra = h('div.segs', qs.map(() => h('i')));
  el.append(h('div.ptop', h('a.x', { href: '#/revisar', 'aria-label': 'Sair' }, icon('fecha')), barra), h('p.small.dim', 'Perguntas de módulos diferentes, fora de ordem. Antes de responder, pense: de que assunto é isto?'), corpo);
  const prox = () => {
    [...barra.children].forEach((x, k) => { x.className = k < i ? 'on' : k === i ? 'now' : ''; });
    if (i >= qs.length) {
      S.mistura = { ult: hoje(), n: (S.mistura.n || 0) + 1 }; salvar('mistura'); tocarDia('p');
      const g = ganhar(certas * XP.mistura);
      clear(corpo).append(h('div.festa', h('div.selo', icon('check')), h('h1', `${certas} de ${qs.length}`), h('p.dim', 'Errou alguma? Ótimo sinal de onde revisar. O cartão daquela lição continua na sua revisão espaçada.'), g ? h('span.xp', `+${g} XP`) : null, h('a.btn.primary.block', { href: '#/revisar' }, 'Voltar')));
      return;
    }
    const { L, i: qi } = qs[i]; const m = modulo(moduloDe(L.id));
    const tag = h('span.tag.c.hide', { css: { '--c': m.cor } }, `Módulo ${m.n} · ${L.t}`);
    const seguir = h('button.btn.primary.block.hide', { type: 'button', onclick: () => { i++; prox(); } }, i + 1 < qs.length ? 'Próxima' : 'Ver o resultado');
    clear(corpo).append(h('div.col.gap-l', pergunta(L.quiz[qi], (ok) => { if (ok) certas++; tag.classList.remove('hide'); seguir.classList.remove('hide'); }), tag, seguir));
  };
  prox();
}
