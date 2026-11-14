// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Hoje: um botão grande para começar, uma pergunta-relâmpago e a semana. O resto fica quieto.
import { h, put, rich, icon, seg, clear, plural, toast } from '../core/ui.js';
import { S, eventosSemana, pendencias, responderCartao, salvar, filaDeHoje } from '../core/estado.js';
import { hoje, DIAS, dow } from '../core/dia.js';
import { proxima, seguinte, licao, modulo, moduloDe, PASSOS, cartao, moduloAtual, progressoModulo } from '../data/curso.js';
import { semanaAtual, META, GELOS_MAX } from '../core/sequencia.js';
import { proximaMissao } from '../data/projeto.js';
import { verificarConquistas } from '../core/conquistas.js';
import { desafioDaVez } from '../data/desafios.js';
import { ehPC } from '../core/plataforma.js';
import { faixa, fotoDoModulo } from '../core/fotos.js';
import * as nuvem from '../core/nuvem.js';
import { instalado } from '../core/instalar.js';
import { licao as licaoDe } from '../data/curso.js';

let avisouSemana = false;

export default async function (el, args) {
  const d = hoje();
  const proxId = proxima(S.licoes, S.sessao.licao);
  if (args[0] === 'comecar') { location.replace(proxId ? `#/licao/${proxId}` : '#/projeto'); return; }

  const data = new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const pc = ehPC();
  el.append(h('header', h('div.eyebrow', data), h('h1', pc ? 'Hoje, no computador' : 'Hoje')));
  const esq = h('div.col'), dir = h('div.col');

  // ---- semana que fechou (aviso gentil, uma vez por abertura do app) ----
  if (eventosSemana.length && !avisouSemana) {
    avisouSemana = true;
    const ult = eventosSemana[eventosSemana.length - 1];
    const seq = S.semana.seq;
    const txt = ult.tipo === 'ok' ? `Semana passada: meta batida. ${seq > 1 ? `São ${seq} semanas seguidas.` : 'Começou uma sequência.'}`
      : ult.tipo === 'gelo' ? `A semana passada foi mais curta de estudo. Um congelamento entrou em ação e a sua sequência continua${seq ? ` em ${plural(seq, 'semana', 'semanas')}` : ''}.`
        : ult.tipo === 'pausa' ? 'Bom te ver de volta. A contagem de semanas recomeça; tudo o que você aprendeu continua aqui.' : '';
    if (txt) el.append(h('div.banner.' + (ult.tipo === 'ok' ? 'ok' : 'info'), ult.tipo === 'gelo' ? icon('gelo') : null, h('span', txt)));
  }

  // ---- o próximo passo ----
  const L = proxId && licao(proxId);
  if (L) {
    const st = S.licoes[proxId] || {};
    const andando = st.p > 0 && !st.feita;
    const m = modulo(moduloDe(proxId));
    esq.append(h('section.card.dest.proximo', { css: { '--c': m.cor } },
      faixa(fotoDoModulo(m.n), h('div.eyebrow', andando ? 'Você parou aqui' : 'Próximo passo'),
        h('h2', `${L.id} ${L.t}`),
        h('p.small', `Módulo ${m.n} · ${m.t} · ${L.min} min${andando ? ` · passo ${st.p + 1} de 7 (${PASSOS[st.p]})` : ''}`)),
      h('a.btn.primary.big.block', { href: `#/licao/${proxId}`, id: 'comecar', style: { marginTop: '12px' } }, icon('play'), andando ? 'Continuar' : `Começar ${S.perfil.alvo} min`),
      pc ? h('p.small.muted.atalho', 'No computador: Enter avança, ← volta, 1 a 3 respondem o quiz, N anota um pensamento.') : null));
  } else {
    esq.append(h('section.card.dest', h('div.eyebrow', 'Trilha concluída'), h('h2', { style: { margin: '4px 0' } }, 'Todas as lições feitas'),
      h('p.small.dim', 'Agora é manter a revisão em dia e fechar o projeto.'), h('a.btn.primary.big.block', { href: '#/projeto' }, 'Ir para o projeto')));
  }

  // ---- boas-vindas (só na primeira vez) ----
  if (!S.perfil.boasVindas) {
    const card = h('div.card.flat', h('h3', 'Como funciona'),
      h('ul', { style: { margin: '0 0 12px', paddingLeft: '1.2em' } },
        h('li', 'Cada lição tem um conceito só e leva de 5 a 10 minutos.'),
        h('li', 'São sempre os mesmos 7 passos. Você nunca precisa decidir o que vem depois.'),
        h('li', 'O que você aprende volta em cartões: amanhã, em 3, 7 e 21 dias.'),
        h('li', 'Parou no meio? Seu lugar fica guardado. Sem culpa.')),
      h('button.btn.small', { type: 'button', onclick: () => { S.perfil.boasVindas = true; salvar('perfil'); card.remove(); } }, 'Entendi'));
    esq.append(card);
  }

  // ---- pergunta-relâmpago ----
  const f = filaDeHoje();
  const relampago = h('section.card.flat');
  const pintarRelampago = () => {
    clear(relampago);
    const fl = filaDeHoje();
    const c = fl.length ? cartao(fl[0], S.meus) : null;
    if (!c) { relampago.append(h('div.row', icon('check'), h('span', 'Revisão de hoje em dia.'))); return; }
    const verso = h('div.hide', h('p', h('b', rich(c.v)), c.w ? [' ', rich(c.w)] : null));
    const notas = h('div.notas3.hide',
      ...[['errei', 'Errei', 'volta amanhã'], ['dificil', 'Difícil', 'repete o prazo'], ['lembrei', 'Lembrei', 'sobe um degrau']].map(([n, t, sub]) =>
        h('button.btn', { type: 'button', data: { nota: n }, onclick: () => { responderCartao(c.id, n); for (const q of verificarConquistas()) toast(`Conquista: ${q.t}`); pintarRelampago(); pintarSemana(); } }, t, h('small', sub))));
    const mostrar = h('button.btn.block', { type: 'button', onclick: () => { verso.classList.remove('hide'); notas.classList.remove('hide'); mostrar.classList.add('hide'); } }, 'Mostrar a resposta');
    const resto = fl.length - 1;
    put(relampago, h('div.row.between', h('div.eyebrow', 'Pergunta-relâmpago'), icon('raio')),
      h('p', { style: { fontWeight: '650', fontSize: '1.08rem', margin: '6px 0 10px' } }, rich(c.f)), verso, mostrar, notas,
      resto > 0 ? h('a.btn.quiet.small.block', { href: '#/revisar/cartoes', style: { marginTop: '6px' } }, `Revisar os outros ${plural(resto, 'cartão', 'cartões')} de hoje`) : null);
  };
  if (f.length) { pintarRelampago(); esq.append(relampago); }

  // ---- check-in de energia ----
  const ate = (() => { const ma = moduloAtual(S.licoes); return progressoModulo(ma, S.licoes).frac >= 0.5 ? ma : ma - 1; })();
  const mis = ate >= 0 ? proximaMissao(S.missoes, ate) : null;
  const nCards = f.length;
  const itemCards = nCards ? { t: `Revisar ${plural(nCards, 'cartão', 'cartões')}`, sub: `cerca de ${Math.max(1, Math.round(nCards * 0.4))} min`, href: '#/revisar/cartoes' } : null;
  const itemLic = L ? { t: `Lição ${L.id}: ${L.t}`, sub: `${L.min} min`, href: `#/licao/${proxId}` } : null;
  const seg2 = proxId && seguinte(proxId) && licao(seguinte(proxId));
  // missões e práticas pedem computador: no celular elas saem das sugestões
  const pendPC = pendencias().filter((x) => { const l = licaoDe(x); return l && l.mao && l.mao.onde === 'pc'; });
  const itemMis = !pc ? null : mis ? { t: `Missão do projeto: ${mis.t}`, sub: `${mis.min} min · você está no computador`, href: `#/foco/${mis.id}` }
    : pendPC.length ? { t: `Prática: ${licaoDe(pendPC[0]).mao.t}`, sub: 'pendente, para fazer no computador', href: '#/projeto/pendencias' } : null;
  const planoPara = (e, t) => {
    const out = [];
    if (e === 'baixa') { out.push(itemCards || (L ? { t: 'Só os 2 primeiros passos da próxima lição', sub: 'gancho e ideia: uns 2 min. Já conta para a semana.', href: `#/licao/${proxId}` } : null)); if (t >= 15 && itemCards) out.push(itemLic); }
    else if (e === 'media') { out.push(itemLic || itemCards); if (t >= 15 && itemLic) out.push(itemCards); if (t >= 30 && seg2) out.push({ t: `Lição ${seg2.id}: ${seg2.t}`, sub: `${seg2.min} min`, href: `#/licao/${seg2.id}` }); }
    else { out.push(itemMis || itemLic || itemCards); if (t >= 15 && itemMis) out.push(itemLic); if (t >= 30) out.push(itemCards); }
    return out.filter(Boolean).slice(0, 3);
  };
  let en = null, tp = 5;
  const sug = h('div.col.hide');
  const pintarSug = () => {
    if (!en) return;
    const itens = planoPara(en, tp);
    clear(sug); sug.classList.remove('hide');
    if (!itens.length) { sug.append(h('p.small.muted', 'Nada pendente agora. Aproveite o descanso.')); return; }
    sug.append(h('div.small.muted', en === 'baixa' ? 'Energia baixa pede tarefa leve:' : en === 'media' ? 'Energia média combina com uma lição:' : 'Energia alta é hora de construir:'));
    itens.forEach((it, i) => sug.append(h('a.item' + (i === 0 ? '.now' : ''), { href: it.href }, h('span.n', String(i + 1)), h('span.t', h('b', it.t), h('span', it.sub)), h('span.chev', '›'))));
  };
  esq.append(h('section.card.flat', h('div.eyebrow', 'Escolher pelo meu estado'),
    h('label.field', { style: { marginTop: '8px' } }, h('span', 'Como está a energia?'), seg([{ v: 'baixa', label: 'Baixa' }, { v: 'media', label: 'Média' }, { v: 'alta', label: 'Alta' }], null, (v) => { en = v; pintarSug(); }, { label: 'Energia' })),
    h('label.field', h('span', 'Quanto tempo você tem?'), seg([5, 15, 30].map((v) => ({ v, label: `${v} min` })), tp, (v) => { tp = v; pintarSug(); }, { label: 'Tempo' })),
    sug));

  // ---- a semana ----
  const semana = h('section.card.flat');
  function pintarSemana() {
    const s = semanaAtual(S.dias, d);
    clear(semana).append(
      h('div.row.between', h('div.eyebrow', 'Sua semana'), h('span.small.muted', { title: 'Congelamentos: protegem a sequência numa semana ruim' }, `${S.semana.gelos} de ${GELOS_MAX} congelamentos`)),
      h('div.semana', { style: { margin: '10px 0' }, role: 'img', 'aria-label': `${s.feitos} de ${META} dias de estudo nesta semana` }, s.lista.map((x) => h('div.d' + (x.on ? '.on' : '') + (x.hoje ? '.hoje' : ''), h('i', '✓'), DIAS[dow(x.d)]))),
      h('p.small.dim', s.batida ? `Meta da semana batida: ${s.feitos} dias.${S.semana.seq ? ` Sequência: ${plural(S.semana.seq, 'semana', 'semanas')}.` : ''}`
        : s.possivel ? `${s.feitos} de ${META} dias. ${s.falta === 1 ? 'Falta 1 dia' : `Faltam ${s.falta} dias`} para a meta. Um cartão já conta.`
          : `${s.feitos} de ${META} dias. Esta semana não fecha a meta, e tudo bem: ${S.semana.gelos > 0 ? 'há um congelamento guardando a sua sequência.' : 'semana que vem é uma página nova.'}`));
  }
  pintarSemana();
  // ---- no computador: as práticas que esperavam por ele ----
  if (pc && pendPC.length) {
    const l0 = licaoDe(pendPC[0]);
    dir.append(h('section.card.dest', { css: { '--c': 'var(--m4)' } }, h('div.row', icon('pc'), h('div.eyebrow', 'Você está no computador')),
      h('h3', { style: { margin: '6px 0' } }, `${plural(pendPC.length, 'prática esperava', 'práticas esperavam')} por este momento`),
      h('p.small.dim', `A primeira: ${l0.mao.t} (lição ${l0.id}).`),
      h('a.btn.primary.block', { href: '#/projeto/pendencias' }, 'Fazer agora')));
  }
  dir.append(semana);
  if (!instalado()) dir.append(h('a.item', { href: '#/mais/instalar' }, h('img', { src: 'assets/icons/icon-192.png', alt: '', width: 38, height: 38, style: { borderRadius: '10px', flex: 'none' } }), h('span.t', h('b', 'Instalar como app próprio'), h('span', 'Ícone separado do Sexteto, tudo salvo para usar sem internet.')), h('span.chev', '›')));
  // ---- sincronização ----
  const ns = nuvem.status();
  dir.append(ns.ligado
    ? h('a.item', { href: '#/mais/sync' }, icon('relogio'), h('span.t', h('b', ns.erro ? 'Sincronização com problema' : 'Celular e PC sincronizados'), h('span', ns.erro || (ns.ult ? `Última vez: ${new Date(ns.ult).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Sincronizando…'))), h('span.chev', '›'))
    : h('a.item', { href: '#/mais/sync' }, icon('relogio'), h('span.t', h('b', `Estudar no celular e no PC`), h('span', `O progresso fica só ${pc ? 'neste computador' : 'neste celular'}. Ligue a sincronização em 2 minutos.`)), h('span.chev', '›')));

  // ---- lembretes discretos ----
  const extras = h('div.list');
  const pend = pendencias().length;
  if (pend && !(pc && pendPC.length)) extras.append(h('a.item', { href: '#/projeto/pendencias' }, icon('pc'), h('span.t', h('b', `${plural(pend, 'prática esperando', 'práticas esperando')}`), h('span', pc ? 'Dá para fazer agora.' : 'Ficam guardadas para quando você estiver no PC.')), h('span.chev', '›')));
  const pens = S.pensamentos.filter((x) => !x.ok).length;
  if (pens) extras.append(h('a.item', { href: '#/mais/pensamentos' }, icon('nota'), h('span.t', h('b', `${plural(pens, 'pensamento guardado', 'pensamentos guardados')}`), h('span', 'Anotados durante o estudo.')), h('span.chev', '›')));
  const des = desafioDaVez(S, d);
  if (des) extras.append(h('a.item', { href: '#/progresso/semana' }, icon('estrela'), h('span.t', h('b', 'Desafio surpresa da quinzena'), h('span', des.t)), h('span.chev', '›')));
  if (dow(d) >= 5 && !S.semanais.some((x) => x.semana === semanaAtual(S.dias, d).start)) extras.append(h('a.item', { href: '#/progresso/semana' }, icon('lampada'), h('span.t', h('b', 'Revisão da semana'), h('span', '3 vitórias, 1 dificuldade e o plano em 3 linhas.')), h('span.chev', '›')));
  if (extras.children.length) dir.append(extras);
  el.append(h('div.grade-pc', esq, dir));
}
