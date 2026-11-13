// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Progresso: o que foi aprendido e o que ficou na memória. Minutos de tela não entram na conta.
import { h, progressBar, plural, fmt } from '../core/ui.js';
import { S, revs, nivel, XP_NIVEL } from '../core/estado.js';
import { hoje, addDays, weekStart } from '../core/dia.js';
import { retencao } from '../core/srs.js';
import { MODULOS, progressoModulo, progressoGeral } from '../data/curso.js';
import { PROJETO, progressoProjeto } from '../data/projeto.js';
import { CONQUISTAS } from '../core/conquistas.js';

const pct = (r) => (r.taxa == null ? '—' : `${Math.round(r.taxa * 100)}%`);

export default async function (el) {
  const d = hoje();
  const g = progressoGeral(S.licoes);
  const entregas = PROJETO.filter((p) => progressoProjeto(S.missoes, p.m).completo).length;
  const r7 = retencao(revs, 7), r21 = retencao(revs, 21);
  const nv = nivel(S.xp); const dentro = S.xp % XP_NIVEL;
  const ganhas = CONQUISTAS.filter((c) => S.conquistas[c.id]).length;

  // calendário das últimas 12 semanas (colunas = semanas, linhas = seg…dom)
  const ini = addDays(weekStart(d), -7 * 11);
  const celulas = [];
  for (let i = 0; i < 84; i++) {
    const dia = addDays(ini, i); const x = S.dias[dia];
    const n = x ? (x.l || 0) * 3 + (x.c || 0) + (x.m || 0) * 2 + ((x.p || 0) > 0 ? 1 : 0) : 0;
    celulas.push(h('i' + (dia > d ? '.fut' : n >= 12 ? '.a3' : n >= 4 ? '.a2' : n > 0 ? '.a1' : ''), { title: dia }));
  }
  const diasAtivos = Object.keys(S.dias).length;

  el.append(
    h('header', h('div.eyebrow', `Nível ${nv} · ${fmt(S.xp)} XP`), h('h1', 'Progresso')),
    h('section.card.flat',
      h('div.stats', h('div.stat', h('b', `${g.feitas}/${g.total}`), h('span', 'lições concluídas')), h('div.stat', h('b', `${entregas}/7`), h('span', 'entregas do projeto')), h('div.stat', h('b', String(S.semana.seq)), h('span', S.semana.seq === 1 ? 'semana na meta' : 'semanas seguidas na meta'))),
      h('div', { style: { marginTop: '12px' } }, progressBar(dentro / XP_NIVEL, 'var(--ouro)'), h('div.small.muted', { style: { marginTop: '4px' } }, `${XP_NIVEL - dentro} XP para o nível ${nv + 1}`))),
    h('section.card.flat', h('div.eyebrow', 'Memória'),
      h('div.stats.two', { style: { marginTop: '10px' } },
        h('div.stat', h('b', pct(r7)), h('span', `de acerto depois de 7 dias${r7.n ? ` (${r7.n})` : ''}`)),
        h('div.stat', h('b', pct(r21)), h('span', `de acerto depois de 21 dias${r21.n ? ` (${r21.n})` : ''}`))),
      h('p.small.muted', { style: { marginTop: '8px' } }, `${plural(revs.length, 'revisão feita', 'revisões feitas')} em ${plural(Object.keys(S.cartoes).length, 'cartão', 'cartões')}.`)),
    h('section.card.flat', h('div.row.between', h('div.eyebrow', 'Últimas 12 semanas'), h('span.small.muted', plural(diasAtivos, 'dia de estudo', 'dias de estudo'))),
      h('div.heat', { style: { marginTop: '10px' }, role: 'img', 'aria-label': `Calendário de estudo: ${diasAtivos} dias com atividade` }, celulas)),
    h('section.card.flat', h('div.eyebrow', 'Módulos'), h('div.col', { style: { marginTop: '10px' } }, MODULOS.map((m) => {
      const p = progressoModulo(m.n, S.licoes);
      return h('a', { href: `#/trilha/m/${m.n}`, style: { textDecoration: 'none', color: 'inherit', display: 'block', minHeight: '44px' } }, h('div.row.between.small', h('b', `M${m.n} · ${m.t}`), h('span.muted.num', `${p.feitas}/${p.total}`)), progressBar(p.frac, m.cor));
    }))),
    h('div.list',
      h('a.item', { href: '#/progresso/semana' }, h('span.n', '7'), h('span.t', h('b', 'Revisão da semana'), h('span', `3 vitórias, 1 dificuldade, plano em 3 linhas.${S.semanais.length ? ` ${plural(S.semanais.length, 'feita', 'feitas')}.` : ''}`)), h('span.chev', '›')),
      h('a.item', { href: '#/progresso/conquistas' }, h('span.n', '★'), h('span.t', h('b', 'Conquistas'), h('span', `${ganhas} de ${CONQUISTAS.length}, todas por habilidade.`)), h('span.chev', '›')),
      h('a.item', { href: '#/progresso/cronograma' }, h('span.n', '▦'), h('span.t', h('b', 'Cronograma'), h('span', S.perfil.plano ? `Plano ${S.perfil.plano}. Datas que se ajustam sem cobrança.` : 'Escolha entre 6 meses e 11 meses.')), h('span.chev', '›')),
      h('a.item', { href: '#/mais/pensamentos' }, h('span.n', '✎'), h('span.t', h('b', 'Pensamentos guardados'), h('span', `${plural(S.pensamentos.filter((x) => !x.ok).length, 'em aberto', 'em aberto')}.`)), h('span.chev', '›')),
      h('a.item', { href: '#/mais/ficha' }, h('span.n', '↻'), h('span.t', h('b', 'Ficha viva'), h('span', 'Modelos, cotas e regras que mudam rápido, com a data da última conferência.')), h('span.chev', '›')),
      h('a.item', { href: '#/mais/lembretes' }, h('span.n', '⏰'), h('span.t', h('b', 'Lembretes'), h('span', 'Horários de estudo no calendário do seu celular.')), h('span.chev', '›')),
      h('a.item', { href: '#/mais/porque' }, h('span.n', '?'), h('span.t', h('b', 'Por que o app é assim'), h('span', 'A ciência por trás de cada escolha, com o grau de evidência.')), h('span.chev', '›')),
      h('a.item', { href: '#/mais/ajustes' }, h('span.n', '⚙'), h('span.t', h('b', 'Ajustes e backup'), h('span', 'Tema, meta de minutos e cópia dos seus dados.')), h('span.chev', '›'))),
  );
}
