// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Player da micro-lição: sempre os mesmos 7 passos, um conceito, uma tela por vez.
// Gancho → ideia com analogia → exemplo resolvido → exercício → quiz → erro comum → fim com o próximo passo pronto.
import { h, clear, put, rich, blocks, icon, toast, fmtDur, sheet, seg, top } from '../core/ui.js';
import { licao, modulo, moduloDe, seguinte, PASSOS, progressoModulo } from '../data/curso.js';
import { S, prog, irPasso, registrarQuiz, registrarExercicio, concluirLicao, marcarMao, escreverDiario, salvar, XP } from '../core/estado.js';
import { montarExercicio, pergunta } from '../core/exercicios.js';
import { capturar } from '../core/pensamento.js';
import { verificarConquistas } from '../core/conquistas.js';

export default async function (el, [id]) {
  const L = licao(id);
  if (!L) { el.append(top('Lição não encontrada', '#/trilha'), h('p', 'Esta lição não existe (ou ainda não foi escrita).'), h('a.btn.primary', { href: '#/trilha' }, 'Ver a trilha')); return; }
  const m = modulo(moduloDe(id));
  const st = prog(id);
  const revisita = !!st.feita;
  let p = revisita ? 0 : Math.min(5, st.p || 0);
  let ganho = 0;
  let qi = 0;                      // pergunta atual do quiz
  const t0 = Date.now();
  let avisado = false, fluxo = false;

  // ---- topo: fechar, 7 segmentos, relógio ----
  const segs = h('div.segs', { role: 'progressbar', 'aria-valuemin': 1, 'aria-valuemax': 7, 'aria-label': 'Passo da lição', css: { '--c': m.cor } }, PASSOS.map(() => h('i')));
  const relogio = h('button.relogio', { type: 'button', 'aria-label': 'Tempo desta sessão. Toque para mudar a meta.', onclick: metaSheet }, '0:00');
  const corpo = h('div');
  const btn = h('button.btn.primary.big', { type: 'button', onclick: avancar }, 'Começar');
  const barra = h('div.acao-bar', h('div',
    h('button.btn.big.pens', { type: 'button', 'aria-label': 'Anotar um pensamento e voltar', title: 'Anotar um pensamento e voltar', onclick: capturar }, icon('nota')),
    btn));
  el.append(h('div.ptop', h('a.x', { href: `#/trilha/m/${m.n}`, 'aria-label': 'Sair da lição (seu lugar fica guardado)' }, icon('fecha')), segs, relogio), corpo, barra);

  const tick = setInterval(() => {
    const s = (Date.now() - t0) / 1000;
    relogio.textContent = fmtDur(s);
    if (s >= S.perfil.alvo * 60) relogio.classList.add('fim');
  }, 1000);

  function metaSheet() {
    const close = sheet([
      h('h3', 'Meta desta sessão'),
      h('p.small.muted', 'O relógio só avisa; ele nunca interrompe. Se você estiver no embalo, continue.'),
      seg([5, 10, 15, 25].map((v) => ({ v, label: `${v} min` })), S.perfil.alvo, (v) => { S.perfil.alvo = v; salvar('perfil'); relogio.classList.toggle('fim', (Date.now() - t0) / 1000 >= v * 60); }, { wrap: true, label: 'Minutos' }),
      h('button.btn.primary.block', { type: 'button', onclick: () => close() }, 'Pronto'),
    ]);
  }

  function pintarSegs() {
    [...segs.children].forEach((x, i) => { x.className = i < p ? 'on' : i === p ? 'now' : ''; });
    segs.setAttribute('aria-valuenow', p + 1);
    segs.setAttribute('aria-valuetext', `Passo ${p + 1} de 7: ${PASSOS[p]}`);
  }
  const rotulo = (txt) => h('div.eyebrow', `Passo ${p + 1} de 7 · ${txt}`);
  const voltar = () => (p > 0 && p < 6 ? h('button.btn.quiet.small', { type: 'button', style: { alignSelf: 'flex-start' }, onclick: () => { p -= 1; qi = 0; desenhar(); } }, '‹ Passo anterior') : null);
  const rodarPython = async (codigo) => (await import('../labs/python.js')).rodar(codigo);

  function desenhar() {
    pintarSegs();
    const box = h('section.passo', { css: { '--c': m.cor }, tabIndex: -1 });
    btn.disabled = false; btn.textContent = 'Continuar'; btn.classList.remove('hide');
    if (p === 0) {
      box.append(h('div.eyebrow', `Lição ${L.id} · ${m.t}`), h('h1', L.t), h('p.gancho', rich(L.gancho)),
        h('div.row.wrap', h('span.tag', `${L.min} min`), h('span.tag', '7 passos'), revisita ? h('span.tag.ok', 'Já concluída: revisão') : null));
      btn.textContent = st.p > 0 && !revisita ? 'Continuar de onde parei' : 'Começar';
    } else if (p === 1) {
      box.append(rotulo('Ideia'), h('h2', L.t), h('div.callout.analogia', h('span.rot', 'Analogia'), rich(L.analogia)), blocks(L.ideia, { run: rodarPython }));
    } else if (p === 2) {
      box.append(rotulo('Exemplo resolvido'), h('h2', 'Veja um exemplo pronto'), blocks(L.exemplo, { run: rodarPython }));
    } else if (p === 3) {
      const jaFez = !!(st.ex && st.ex.ok);
      const status = h('div.banner.ok.hide', { role: 'status' });
      box.append(rotulo('Sua vez'), h('h2', 'Exercício'), montarExercicio(L.ex, (r) => {
        const g = registrarExercicio(id, { dePrimeira: !!r.dePrimeira && !r.ajuda, tent: r.tent, andaime: !!r.andaime });
        ganho += g;
        put(clear(status), g ? h('span.xp', `+${g} XP`) : null, h('span', r.ajuda ? 'Feito com ajuda. Tudo certo: é assim que se aprende.' : 'Exercício feito.'));
        status.classList.remove('hide');
        btn.disabled = false;
      }, { licao: L }), status);
      btn.disabled = !jaFez;
      if (!jaFez) box.append(h('button.btn.quiet.small', { type: 'button', style: { alignSelf: 'center' }, onclick: () => { btn.disabled = false; toast('Tudo bem. Ele continua aqui se você quiser voltar.'); } }, 'Pular o exercício por agora'));
    } else if (p === 4) {
      const n = L.quiz.length;
      box.append(h('div.eyebrow', `Passo 5 de 7 · Quiz · pergunta ${qi + 1} de ${n}`));
      btn.disabled = true;
      box.append(pergunta(L.quiz[qi], (ok) => {
        const g = registrarQuiz(id, qi, ok);
        ganho += g;
        if (g) box.append(h('div', h('span.xp', `+${g} XP`)));
        btn.disabled = false;
        btn.textContent = qi + 1 < n ? 'Próxima pergunta' : 'Continuar';
      }));
    } else if (p === 5) {
      box.append(rotulo('Erro comum de iniciante'), h('div.callout.erro', h('span.rot', 'Erro comum'), h('h2', { style: { marginBottom: '6px' } }, L.erro.t), h('div.prose', h('p', rich(L.erro.d)))));
      btn.textContent = 'Concluir a lição';
    } else fim(box);
    put(box, voltar());
    barra.classList.toggle('hide', p === 6);
    clear(corpo).append(box);
    window.scrollTo(0, 0);
    try { box.focus({ preventScroll: true }); } catch {}
  }

  function avancar() {
    if (p === 4 && qi + 1 < L.quiz.length) { qi += 1; desenhar(); return; }
    if (p >= 6) return;
    p += 1; qi = 0;
    if (p < 6) irPasso(id, p);
    desenhar();
    const seg5 = (Date.now() - t0) / 1000 >= S.perfil.alvo * 60;
    if (seg5 && !avisado && !fluxo && p < 6) {
      avisado = true;
      toast(`${S.perfil.alvo} min feitos. Pode parar aqui, seu lugar fica guardado.`, { label: 'Continuar no fluxo', fn: () => { fluxo = true; } });
    }
  }

  function fim(box) {
    const r = concluirLicao(id, L.quiz.length);
    ganho += r.xp;
    btn.classList.add('hide');
    const acertos = (st.quiz || []).filter(Boolean).length;
    const prox = seguinte(id);
    const proxL = prox && licao(prox);
    const pm = progressoModulo(m.n, S.licoes);
    box.append(h('div.festa',
      h('div.selo', icon('check')),
      h('h1', r.primeira ? 'Lição concluída' : 'Revisão concluída'),
      h('div.row.wrap', { style: { justifyContent: 'center' } }, h('span.xp', `+${ganho} XP`), h('span.tag', `${acertos} de ${L.quiz.length} no quiz`)),
      r.novos.length ? h('p.dim', `${r.novos.length === 1 ? '1 cartão entrou' : `${r.novos.length} cartões entraram`} na sua revisão. ${r.novos.length === 1 ? 'Ele volta' : 'Eles voltam'} amanhã, depois em 3, 7 e 21 dias.`) : null));

    if (L.mao) {
      if (st.mao !== 'feito') marcarMao(id, 'depois');
      const feito = st.mao === 'feito';
      const cardMao = h('div.card.flat', h('div.eyebrow', L.mao.onde === 'pc' ? 'Mão na massa · no computador' : 'Mão na massa · fora do app'), h('h3', L.mao.t),
        h('ol.steps', L.mao.passos.map((x, i) => h('li', h('span', String(i + 1)), h('div', rich(x))))),
        h('p.small', { style: { marginTop: '10px' } }, h('b', 'Pronto quando: '), rich(L.mao.criterio)));
      const linha = h('div.row.wrap', { style: { marginTop: '10px' } });
      const bFeito = h('button.btn.small', { type: 'button', onclick: () => { const g = marcarMao(id, 'feito'); bFeito.textContent = 'Feito ✓'; bFeito.disabled = true; if (g) toast(`Prática registrada. +${g} XP`); avisarConquistas(); } }, feito ? 'Feito ✓' : 'Já fiz');
      bFeito.disabled = feito;
      put(linha, bFeito, feito ? null : h('span.small.muted.grow', 'Se não der agora, ela já está guardada em Projeto › Práticas pendentes.'));
      cardMao.append(linha);
      box.append(cardMao);
    }

    const diario = h('input.inp', { type: 'text', placeholder: 'Uma frase sobre esta sessão (opcional)', 'aria-label': 'Diário de bordo: uma frase sobre esta sessão', maxLength: 240 });
    const bDiario = h('button.btn.small', { type: 'button', onclick: () => { const g = escreverDiario(diario.value); if (g) { diario.value = ''; diario.placeholder = 'Guardado no diário de bordo'; bDiario.disabled = true; toast(`Diário atualizado. +${g} XP`); } } }, 'Guardar');
    box.append(h('div.row', diario, bDiario));

    if (pm.feitas === pm.total) box.append(h('div.banner.ouro', h('div', h('b', `Módulo ${m.n} completo. `), `Agora o projeto ganha: ${m.ganha.toLowerCase()}.`, h('div', { style: { marginTop: '8px' } }, h('a.btn.small', { href: `#/projeto/m/${m.n}` }, 'Ver a missão do projeto')))));
    if (proxL) box.append(h('a.btn.primary.big.block', { href: `#/licao/${prox}` }, h('span', h('span.small', { style: { display: 'block', fontWeight: '600', opacity: '.85' } }, 'Próxima, já carregada'), `${proxL.id} ${proxL.t} · ${proxL.min} min`)));
    else box.append(h('div.banner.ok', h('b', 'Você concluiu todas as lições da trilha. '), 'O que falta agora é o projeto final.'));
    box.append(h('a.btn.quiet.block', { href: '#/hoje' }, 'Parar por hoje'));
    avisarConquistas();
  }

  function avisarConquistas() { for (const c of verificarConquistas()) toast(`Conquista: ${c.t}`); }

  desenhar();
  return () => clearInterval(tick);
}
