// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Player da micro-lição: sempre os mesmos 7 passos, um conceito, uma tela por vez.
// Gancho → ideia com analogia → exemplo resolvido → exercício → quiz → erro comum → fim com o próximo passo pronto.
// Dá para voltar a qualquer passo já visto (tocando nos passos do topo, no botão Voltar ou na seta ←)
// sem perder o que foi respondido, e consultar a ideia e o exemplo durante o exercício e o quiz.
import { h, clear, put, rich, blocks, icon, toast, fmtDur, sheet, seg, top } from '../core/ui.js';
import { licao, modulo, moduloDe, seguinte, ORDEM, PASSOS, progressoModulo } from '../data/curso.js';
import { S, prog, irPasso, registrarQuiz, registrarExercicio, concluirLicao, marcarMao, escreverDiario, salvar } from '../core/estado.js';
import { montarExercicio, pergunta } from '../core/exercicios.js';
import { capturar } from '../core/pensamento.js';
import { verificarConquistas } from '../core/conquistas.js';
import { ehPC } from '../core/plataforma.js';
import { figura } from '../core/fotos.js';

export default async function (el, [id]) {
  const L = licao(id);
  if (!L) { el.append(top('Lição não encontrada', '#/trilha'), h('p', 'Esta lição não existe (ou ainda não foi escrita).'), h('a.btn.primary', { href: '#/trilha' }, 'Ver a trilha')); return; }
  const m = modulo(moduloDe(id));
  const st = prog(id);
  const revisita = !!st.feita;
  let p = revisita ? 0 : Math.min(5, st.p || 0);
  let alcancado = revisita ? 5 : p;          // passo mais avançado já visto
  let ganho = 0, qi = 0, concluida = false;
  const respondida = [];                      // perguntas do quiz já respondidas nesta sessão
  let exLiberado = !!(st.ex && st.ex.ok);
  const cache = new Map();                    // passos já montados: voltar não apaga as respostas
  const t0 = Date.now();
  let avisado = false, fluxo = false;
  const anterior = ORDEM[ORDEM.indexOf(id) - 1];

  // ---- topo: fechar, 7 passos tocáveis, relógio ----
  const segs = h('nav.segs.passos', { 'aria-label': 'Passos da lição', css: { '--c': m.cor } });
  const relogio = h('button.relogio', { type: 'button', 'aria-label': 'Tempo desta sessão. Toque para mudar a meta.', onclick: metaSheet }, '0:00');
  const corpo = h('div');
  const btn = h('button.btn.primary.big', { type: 'button', onclick: avancar }, 'Começar');
  const bVoltar = h('button.btn.big.voltar', { type: 'button', 'aria-label': 'Voltar ao passo anterior', title: 'Voltar (←)', onclick: voltar }, icon('volta'));
  const barra = h('div.acao-bar', h('div',
    bVoltar,
    h('button.btn.big.pens', { type: 'button', 'aria-label': 'Anotar um pensamento e voltar', title: 'Anotar um pensamento (N)', onclick: capturar }, icon('nota')),
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
    clear(segs);
    PASSOS.forEach((nome, i) => {
      const pode = !concluida && i <= Math.max(alcancado, p) && i < 6;
      segs.append(h('button.pp' + (i < p ? '.on' : i === p ? '.now' : '') + (pode ? '' : '.trava'), {
        type: 'button', disabled: !pode, 'aria-current': i === p ? 'step' : null,
        'aria-label': `Passo ${i + 1}: ${nome}${pode && i !== p ? ' (voltar a este passo)' : ''}`, title: nome,
        onclick: () => { if (pode && i !== p) ir(i); },
      }, h('i'), h('span', nome)));
    });
  }
  const rotulo = (txt) => h('div.eyebrow', `Passo ${p + 1} de 7 · ${txt}`);
  const rodarPython = async (codigo, ent) => (await import('../labs/python.js')).rodar(codigo, ent);

  /** Consulta rápida: a analogia, a ideia e o exemplo, sem sair do exercício ou do quiz. */
  function consultar() {
    const close = sheet([
      h('div.row.between', h('h3', 'Rever o conteúdo'), h('button.btn.quiet.small', { type: 'button', onclick: () => close() }, 'Fechar')),
      h('div.callout.analogia', h('span.rot', 'Analogia'), rich(L.analogia)),
      blocks(L.ideia, { run: rodarPython }),
      h('h3', 'Exemplo resolvido'), blocks(L.exemplo, { run: rodarPython }),
      h('button.btn.primary.block', { type: 'button', onclick: () => close() }, 'Voltar ao que eu estava fazendo'),
    ]);
  }
  const botaoConsulta = () => h('button.btn.small.consulta', { type: 'button', onclick: consultar }, icon('lampada'), 'Rever a ideia e o exemplo');

  function montar() {
    const box = h('section.passo', { css: { '--c': m.cor }, tabIndex: -1 });
    if (p === 0) {
      box.append(h('div.eyebrow', `Lição ${L.id} · ${m.t}`), h('h1', L.t), figura(L.id, { capa: true }) || null, h('p.gancho', rich(L.gancho)),
        h('div.row.wrap', h('span.tag', `${L.min} min`), h('span.tag', '7 passos'), revisita ? h('span.tag.ok', 'Já concluída: revisão livre') : null));
      if (anterior) box.append(h('a.btn.quiet.small', { href: `#/licao/${anterior}`, style: { alignSelf: 'flex-start' } }, `‹ Lição anterior: ${anterior} ${licao(anterior).t}`));
    } else if (p === 1) {
      box.append(rotulo('Ideia'), h('h2', L.t), h('div.callout.analogia', h('span.rot', 'Analogia'), rich(L.analogia)), figura(L.id) || null, blocks(L.ideia, { run: rodarPython }));
    } else if (p === 2) {
      box.append(rotulo('Exemplo resolvido'), h('h2', 'Veja um exemplo pronto'), blocks(L.exemplo, { run: rodarPython }));
    } else if (p === 3) {
      const status = h('div.banner.ok.hide', { role: 'status' });
      box.append(rotulo('Sua vez'), h('div.row.between.wrap', h('h2', 'Exercício'), botaoConsulta()), montarExercicio(L.ex, (r) => {
        const g = registrarExercicio(id, { dePrimeira: !!r.dePrimeira && !r.ajuda, tent: r.tent, andaime: !!r.andaime });
        ganho += g; exLiberado = true;
        put(clear(status), g ? h('span.xp', `+${g} XP`) : null, h('span', r.ajuda ? 'Feito com ajuda. Tudo certo: é assim que se aprende.' : 'Exercício feito.'));
        status.classList.remove('hide');
        if (p === 3) pintarBotao();
      }, { licao: L }), status);
      if (!exLiberado) {
        const pular = h('button.btn.quiet.small', { type: 'button', style: { alignSelf: 'center' }, onclick: () => { exLiberado = true; pular.remove(); pintarBotao(); toast('Tudo bem. Ele continua aqui se você quiser voltar.'); } }, 'Pular o exercício por agora');
        box.append(pular);
      }
    } else if (p === 4) {
      const n = L.quiz.length, i = qi;
      box.append(h('div.row.between.wrap', h('div.eyebrow', `Passo 5 de 7 · Quiz · pergunta ${i + 1} de ${n}`), botaoConsulta()));
      box.append(pergunta(L.quiz[i], (ok) => {
        respondida[i] = true;
        const g = registrarQuiz(id, i, ok);
        ganho += g;
        if (g) box.append(h('div', h('span.xp', `+${g} XP`)));
        if (p === 4 && qi === i) pintarBotao();
      }));
      if (ehPC()) box.append(h('p.small.muted.atalho', 'Atalho: teclas 1, 2 e 3 escolhem a opção.'));
    } else if (p === 5) {
      box.append(rotulo('Erro comum de iniciante'), h('div.callout.erro', h('span.rot', 'Erro comum'), h('h2', { style: { marginBottom: '6px' } }, L.erro.t), h('div.prose', h('p', rich(L.erro.d)))), botaoConsulta());
    }
    return box;
  }

  function pintarBotao() {
    btn.classList.remove('hide'); btn.disabled = false;
    if (p === 0) btn.textContent = st.p > 0 && !revisita && alcancado > 0 ? 'Continuar de onde parei' : 'Começar';
    else if (p === 3) { btn.textContent = 'Continuar'; btn.disabled = !exLiberado; }
    else if (p === 4) { btn.textContent = qi + 1 < L.quiz.length ? 'Próxima pergunta' : 'Continuar'; btn.disabled = !respondida[qi] && !(revisita && st.quiz && st.quiz[qi] !== undefined); }
    else if (p === 5) btn.textContent = revisita ? 'Concluir a revisão' : 'Concluir a lição';
    else btn.textContent = 'Continuar';
    bVoltar.disabled = p === 0 || concluida;
    bVoltar.classList.toggle('hide', p === 0 || concluida);
  }

  function desenhar() {
    pintarSegs();
    let box;
    if (p === 6) { box = h('section.passo', { css: { '--c': m.cor } }); fim(box); }
    else {
      const k = p === 4 ? `4.${qi}` : String(p);
      box = cache.get(k);
      if (!box) { box = montar(); cache.set(k, box); }
    }
    barra.classList.toggle('hide', p === 6);
    if (p < 6) pintarBotao();
    clear(corpo).append(box);
    window.scrollTo(0, 0);
    try { box.focus({ preventScroll: true }); } catch {}
  }

  function ir(n) { p = n; qi = n === 4 ? 0 : qi; desenhar(); }
  function voltar() {
    if (concluida || p === 0) return;
    if (p === 4 && qi > 0) { qi -= 1; desenhar(); return; }
    p -= 1;
    if (p === 4) qi = L.quiz.length - 1;
    desenhar();
  }
  function avancar() {
    if (btn.disabled || btn.classList.contains('hide')) return;
    if (p === 4 && qi + 1 < L.quiz.length) { qi += 1; desenhar(); return; }
    if (p >= 6) return;
    p += 1; qi = 0;
    if (p > alcancado) alcancado = p;
    if (p < 6 && !revisita) irPasso(id, p);
    desenhar();
    const seg5 = (Date.now() - t0) / 1000 >= S.perfil.alvo * 60;
    if (seg5 && !avisado && !fluxo && p < 6) {
      avisado = true;
      toast(`${S.perfil.alvo} min feitos. Pode parar aqui, seu lugar fica guardado.`, { label: 'Continuar no fluxo', fn: () => { fluxo = true; } });
    }
  }

  // ---- teclado (útil no PC): → ou Enter avança, ← volta, 1-3 respondem, N anota ----
  const teclas = (e) => {
    const alvo = e.target;
    if (document.querySelector('.sheet-bg') || e.altKey || e.ctrlKey || e.metaKey) return;
    if (alvo && (alvo.matches('textarea, input, select, [contenteditable]'))) return;
    if (e.key === 'ArrowRight' || (e.key === 'Enter' && !(alvo && alvo.matches('button, a')))) { e.preventDefault(); avancar(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); voltar(); }
    else if (/^[1-4]$/.test(e.key) && p === 4) { const b = corpo.querySelectorAll('.opt')[+e.key - 1]; if (b && !b.disabled) b.click(); }
    else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); capturar(); }
  };
  document.addEventListener('keydown', teclas);

  function fim(box) {
    const r = concluirLicao(id, L.quiz.length);
    concluida = true;
    ganho += r.xp;
    const acertos = (prog(id).quiz || []).filter(Boolean).length;
    const prox = seguinte(id);
    const proxL = prox && licao(prox);
    const pm = progressoModulo(m.n, S.licoes);
    box.append(h('div.festa',
      h('div.selo', icon('check')),
      h('h1', r.primeira ? 'Lição concluída' : 'Revisão concluída'),
      h('div.row.wrap', { style: { justifyContent: 'center' } }, h('span.xp', `+${ganho} XP`), h('span.tag', `${acertos} de ${L.quiz.length} no quiz`)),
      r.novos.length ? h('p.dim', `${r.novos.length === 1 ? '1 cartão entrou' : `${r.novos.length} cartões entraram`} na sua revisão. ${r.novos.length === 1 ? 'Ele volta' : 'Eles voltam'} amanhã, depois em 3, 7 e 21 dias.`) : null));

    if (L.mao) {
      const st2 = prog(id);
      if (st2.mao !== 'feito') marcarMao(id, 'depois');
      const feito = st2.mao === 'feito';
      const noPC = L.mao.onde === 'pc';
      const cardMao = h('div.card.flat' + (noPC && ehPC() ? '.dest' : ''), h('div.eyebrow', noPC ? (ehPC() ? 'Mão na massa · você está no computador: dá para fazer agora' : 'Mão na massa · no computador') : 'Mão na massa · fora do app'), h('h3', L.mao.t),
        h('ol.steps', L.mao.passos.map((x, i) => h('li', h('span', String(i + 1)), h('div', rich(x))))),
        h('p.small', { style: { marginTop: '10px' } }, h('b', 'Pronto quando: '), rich(L.mao.criterio)));
      const linha = h('div.row.wrap', { style: { marginTop: '10px' } });
      const bFeito = h('button.btn.small', { type: 'button', onclick: () => { const g = marcarMao(id, 'feito'); bFeito.textContent = 'Feito ✓'; bFeito.disabled = true; if (g) toast(`Prática registrada. +${g} XP`); avisarConquistas(); } }, feito ? 'Feito ✓' : 'Já fiz');
      bFeito.disabled = feito;
      put(linha, bFeito, feito ? null : h('span.small.muted.grow', noPC && !ehPC() ? 'Ela fica guardada e aparece em destaque quando você abrir o app no computador.' : 'Se não der agora, ela fica guardada em Projeto › Práticas pendentes.'));
      cardMao.append(linha);
      box.append(cardMao);
    }

    const diario = h('input.inp', { type: 'text', placeholder: 'Uma frase sobre esta sessão (opcional)', 'aria-label': 'Diário de bordo: uma frase sobre esta sessão', maxLength: 240 });
    const bDiario = h('button.btn.small', { type: 'button', onclick: () => { const g = escreverDiario(diario.value); if (g) { diario.value = ''; diario.placeholder = 'Guardado no diário de bordo'; bDiario.disabled = true; toast(`Diário atualizado. +${g} XP`); } } }, 'Guardar');
    box.append(h('div.row', diario, bDiario));

    if (pm.feitas === pm.total) box.append(h('div.banner.ouro', h('div', h('b', `Módulo ${m.n} completo. `), `Agora o projeto ganha: ${m.ganha.toLowerCase()}.`, h('div', { style: { marginTop: '8px' } }, h('a.btn.small', { href: `#/projeto/m/${m.n}` }, 'Ver a missão do projeto')))));
    if (proxL) box.append(h('a.btn.primary.big.block', { href: `#/licao/${prox}` }, h('span', h('span.small', { style: { display: 'block', fontWeight: '600', opacity: '.85' } }, 'Próxima, já carregada'), `${proxL.id} ${proxL.t} · ${proxL.min} min`)));
    else box.append(h('div.banner.ok', h('b', 'Você concluiu todas as lições da trilha. '), 'O que falta agora é o projeto final.'));
    box.append(h('div.row.wrap', h('a.btn.quiet.grow', { href: `#/licao/${id}`, onclick: (e) => { e.preventDefault(); location.hash = '#/trilha'; setTimeout(() => { location.hash = `#/licao/${id}`; }, 0); } }, 'Rever esta lição'), h('a.btn.quiet.grow', { href: '#/hoje' }, 'Parar por hoje')));
    avisarConquistas();
  }

  function avisarConquistas() { for (const c of verificarConquistas()) toast(`Conquista: ${c.t}`); }

  desenhar();
  return () => { clearInterval(tick); document.removeEventListener('keydown', teclas); };
}
