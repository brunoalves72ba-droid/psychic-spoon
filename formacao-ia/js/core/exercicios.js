// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Exercícios das micro-lições, todos com resposta imediata. Cada um chama feito({ dePrimeira, tent, ajuda }) ao terminar.
import { h, put, rich, clear, codeBlock, tick } from './ui.js';
import { parseMolde, aplicarNivel, maiorNivel, confere, solucao } from './andaime.js';
import { analisar, conferirFormato } from './json-pt.js';
import { S, marco } from './estado.js';

export function embaralhar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function embaralharDiferente(n) {
  const base = Array.from({ length: n }, (_, i) => i);
  if (n < 2) return base;
  for (let k = 0; k < 20; k++) { const e = embaralhar(base); if (e.some((v, i) => v !== i)) return e; }
  return base.reverse();
}

/** Uma pergunta de múltipla escolha. A opção 0 dos dados é a correta; a ordem na tela é sorteada. */
export function pergunta(q, onAnswer) {
  const ordem = embaralhar(q.o.map((_, i) => i));
  const why = h('div.why.hide', { role: 'status' });
  const opts = h('div.opts');
  let travado = false;
  ordem.forEach((oi) => {
    const b = h('button.opt', { type: 'button', data: { k: oi }, onclick: () => {
      if (travado) return; travado = true;
      const ok = oi === 0;
      b.classList.add(ok ? 'ok' : 'no');
      [...opts.children].forEach((x, k) => { x.disabled = true; if (ordem[k] === 0) x.classList.add('ok'); });
      why.classList.remove('hide'); why.classList.add(ok ? 'ok' : 'no');
      why.append(h('b', ok ? 'Isso. ' : 'Ainda não. '), rich(q.w || ''));
      onAnswer && onAnswer(ok);
    } }, rich(q.o[oi]));
    opts.append(b);
  });
  return h('div.q', h('b', rich(q.q)), opts, why);
}

function escolha(ex, feito) {
  let resp = 0, certas = 0;
  const box = h('div.col.gap-l');
  ex.casos.forEach((c) => box.append(pergunta(c, (ok) => { resp++; if (ok) certas++; if (resp === ex.casos.length) feito({ dePrimeira: certas === resp, tent: 1 }); })));
  return h('div.col', ex.enun ? h('div.enun', rich(ex.enun)) : null, box);
}

function classificar(ex, feito) {
  const itens = embaralhar(ex.itens);
  let erros = 0, certos = 0;
  const box = h('div.cls');
  for (const it of itens) {
    const w = h('div.w.hide', { role: 'status' });
    const chips = h('div.seg.wrap', { role: 'group', 'aria-label': 'Categorias' });
    const card = h('div.it', { data: { b: it.b } }, h('div.nome', rich(it.t)), chips, w);
    ex.baldes.forEach((nome, bi) => chips.append(h('button.chip', { type: 'button', data: { b: bi }, onclick: (e) => {
      if (card.classList.contains('ok')) return;
      const bt = e.currentTarget;
      if (bi === it.b) {
        card.classList.add('ok'); bt.classList.add('ok'); certos++;
        [...chips.children].forEach((c) => { c.disabled = true; });
        clear(w); if (it.w) { w.append(rich(it.w)); w.classList.remove('hide'); } else w.classList.add('hide');
        if (certos === itens.length) feito({ dePrimeira: erros === 0, tent: erros + 1 });
      } else { erros++; bt.classList.add('no'); bt.disabled = true; clear(w).append('Ainda não. Tente outra.'); w.classList.remove('hide'); }
    } }, nome)));
    box.append(card);
  }
  return h('div.col', h('div.enun', rich(ex.enun)), box);
}

function ordenar(ex, feito) {
  const n = ex.itens.length;
  let pool = embaralharDiferente(n), seq = [], tent = 0, fim = false;
  const slot = h('div.slot'), poolEl = h('div.pool'), msg = h('div.why.hide', { role: 'status' });
  const conferir = h('button.btn.primary.block', { type: 'button', disabled: true, onclick: () => {
    tent++;
    const errado = seq.findIndex((v, k) => v !== k);
    if (errado < 0) { fim = true; draw(); msg.className = 'why ok'; clear(msg).append(h('b', 'Isso. '), 'A ordem está certa.'); conferir.classList.add('hide'); feito({ dePrimeira: tent === 1, tent }); return; }
    pool = pool.concat(seq.slice(errado)); seq = seq.slice(0, errado);
    msg.className = 'why no';
    clear(msg).append(h('b', 'Ainda não. '), errado === 0 ? 'O primeiro passo é outro. Tente de novo.' : `${errado === 1 ? 'O primeiro passo está certo' : `Os ${errado} primeiros passos estão certos`}. Continue a partir daí.`);
    draw();
  } }, 'Conferir a ordem');
  function draw() {
    clear(slot); clear(poolEl);
    seq.forEach((v, k) => slot.append(h('button.peca' + (fim ? '.ok' : ''), { type: 'button', disabled: fim, data: { i: v }, 'aria-label': `Passo ${k + 1}: ${ex.itens[v]}. Toque para tirar.`, onclick: () => { seq = seq.filter((x) => x !== v); pool.push(v); draw(); } }, h('span.k', String(k + 1)), h('span', rich(ex.itens[v])))));
    pool.forEach((v) => poolEl.append(h('button.peca', { type: 'button', data: { i: v }, onclick: () => { pool = pool.filter((x) => x !== v); seq.push(v); msg.classList.add('hide'); draw(); } }, h('span', rich(ex.itens[v])))));
    conferir.disabled = pool.length > 0;
  }
  draw();
  return h('div.col', h('div.enun', rich(ex.enun)), h('div.ord', slot, poolEl), msg, conferir);
}

function lacunas(ex, feito, ctx) {
  const partes0 = parseMolde(ex.molde);
  const gradual = maiorNivel(partes0) > 1;
  let nivel = gradual ? (ex.nivel || S.andaime.nivel) : 3;
  const box = h('div.col');
  let tent = 0;
  const montar = () => {
    clear(box);
    if (ex.modo === 'python' && nivel >= 3) { // do zero: editor completo com testes
      import('../labs/python.js').then((m) => box.append(m.exercicioPython({ ...ex, doZero: true }, (r) => feito({ ...r, andaime: gradual }), ctx)));
      if (gradual) box.append(ajudaNivel());
      return;
    }
    const partes = aplicarNivel(partes0, nivel);
    const campos = [];
    const tela = h('div.lac' + (ex.modo === 'texto' ? '.texto' : ''));
    for (const p of partes) {
      if (p.t === 'txt') { tela.append(p.v); continue; }
      let inp;
      if (ex.opcoes) {
        inp = h('select', { 'aria-label': 'Escolha o que falta' }, h('option', { value: '' }, '…'), embaralhar(ex.opcoes).map((o) => h('option', { value: o }, o)));
      } else {
        inp = h('input', { type: 'text', size: Math.max(3, p.v.length + 1), autocomplete: 'off', autocapitalize: 'off', spellcheck: false, 'aria-label': 'Complete o que falta' });
        inp.setAttribute('autocorrect', 'off');
      }
      campos.push({ p, inp });
      tela.append(inp);
    }
    const msg = h('div.why.hide', { role: 'status' });
    const acoes = h('div.col');
    const ver = h('button.btn.quiet.small.hide', { type: 'button', onclick: () => {
      for (const c of campos) { c.inp.value = c.p.v; c.inp.classList.remove('no'); c.inp.classList.add('ok'); c.inp.disabled = true; }
      msg.className = 'why'; clear(msg).append('Resposta preenchida. Leia com calma: o que cada peça faz?');
      conferir.classList.add('hide'); ver.classList.add('hide');
      feito({ dePrimeira: false, tent, ajuda: true, andaime: gradual });
    } }, 'Ver a resposta');
    const conferir = h('button.btn.primary.block', { type: 'button', onclick: async () => {
      tent++;
      if (ex.modo === 'python') {
        const codigo = partes.map((p) => (p.t === 'txt' ? p.v : campos.find((c) => c.p === p).inp.value)).join('');
        conferir.disabled = true;
        const m = await import('../labs/python.js');
        const r = await m.rodarTestes(codigo, ex.testes || []);
        conferir.disabled = false;
        clear(msg).append(m.relatorio(r)); msg.className = 'why ' + (r.ok ? 'ok' : 'no');
        if (r.ok) { for (const c of campos) { c.inp.classList.add('ok'); c.inp.disabled = true; } conferir.classList.add('hide'); ver.classList.add('hide'); marco('python'); feito({ dePrimeira: tent === 1, tent, andaime: gradual }); }
        else if (tent >= 2) ver.classList.remove('hide');
        return;
      }
      let ok = true;
      for (const c of campos) { const certo = confere(c.p, c.inp.value, ex.exato); c.inp.classList.toggle('ok', certo); c.inp.classList.toggle('no', !certo); if (!certo) ok = false; }
      if (ok) {
        for (const c of campos) c.inp.disabled = true;
        msg.className = 'why ok'; clear(msg).append(h('b', 'Isso. '), rich(ex.w || 'Tudo no lugar.'));
        conferir.classList.add('hide'); ver.classList.add('hide');
        feito({ dePrimeira: tent === 1, tent, andaime: gradual });
      } else {
        msg.className = 'why no'; put(clear(msg), h('b', 'Ainda não. '), 'Reveja os campos marcados.', ex.dica ? [' Dica: ', rich(ex.dica)] : null);
        if (tent >= 2) ver.classList.remove('hide');
      }
    } }, ex.modo === 'python' ? 'Rodar os testes' : 'Conferir');
    acoes.append(conferir, ver);
    box.append(h('div.enun', rich(ex.enun)), tela, msg, acoes);
    if (gradual) box.append(ajudaNivel());
  };
  const ajudaNivel = () => {
    const nomes = { 1: 'falta 1 passo', 2: 'faltam vários passos', 3: 'do zero' };
    const linha = h('div.row.wrap', h('span.small.muted.grow', `Andaime: ${nomes[Math.min(3, nivel)]}.`));
    if (nivel > 1) linha.append(h('button.btn.quiet.small', { type: 'button', onclick: () => { nivel -= 1; tent = 0; montar(); } }, 'Quero mais ajuda'));
    if (nivel < 3) linha.append(h('button.btn.quiet.small', { type: 'button', onclick: () => { nivel += 1; tent = 0; montar(); } }, 'Quero menos ajuda'));
    return linha;
  };
  montar();
  return box;
}

function texto(ex, feito) {
  const campos = ex.campos || [{ id: 'unico', rot: ex.rot || 'Sua resposta', min: ex.min || 20, ph: ex.ph }];
  const entradas = campos.map((c) => {
    const ta = h('textarea', { rows: c.linhas || 2, placeholder: c.ph || '', 'aria-label': c.rot, maxLength: 2000 });
    return { c, ta, li: h('li', c.rot) };
  });
  const lista = h('ul.checks');
  const extra = (ex.checks || []).map((ck) => ({ ck, li: h('li', ck.rot) }));
  for (const e of entradas) if (campos.length > 1 || (ex.checks || []).length === 0) lista.append(e.li);
  for (const x of extra) lista.append(x.li);
  const fim = h('div.col.hide');
  let tent = 0;
  const juntar = () => entradas.map((e) => e.ta.value.trim()).filter(Boolean).join(ex.juntar || '\n');
  const conferir = h('button.btn.primary.block', { type: 'button', onclick: () => {
    tent++;
    let ok = true;
    for (const e of entradas) {
      const v = e.ta.value.trim();
      const certo = v.length >= (e.c.min || 10) && (!e.c.re || new RegExp(e.c.re, 'i').test(v));
      e.li.className = certo ? 'ok' : 'no';
      e.li.textContent = certo ? e.c.rot : `${e.c.rot}: ${v.length < (e.c.min || 10) ? 'escreva um pouco mais' : (e.c.falta || 'falta um detalhe')}`;
      if (!certo) ok = false;
    }
    const tudo = juntar();
    for (const x of extra) {
      let certo = true;
      if (x.ck.re) certo = new RegExp(x.ck.re, x.ck.flags || 'i').test(tudo);
      if (x.ck.min) certo = certo && tudo.length >= x.ck.min;
      if (x.ck.linhas) certo = certo && tudo.split('\n').filter((l) => l.trim()).length >= x.ck.linhas;
      x.li.className = certo ? 'ok' : 'no';
      if (!certo) ok = false;
    }
    if (!ok) return;
    conferir.classList.add('hide');
    for (const e of entradas) e.ta.readOnly = true;
    fim.classList.remove('hide');
    if (campos.length > 1) fim.append(h('div.small.muted', 'O seu texto montado:'), codeBlock(tudo, ex.lingua || 'prompt'));
    if (ex.modelo) fim.append(h('div.small.muted', 'Um exemplo possível, para comparar:'), codeBlock(ex.modelo, ex.lingua || 'prompt'));
    if (ex.salvarPrompt) import('./biblioteca.js').then((m) => fim.append(m.botaoSalvar(tudo, ex.salvarPrompt)));
    feito({ dePrimeira: tent === 1, tent });
  } }, 'Conferir');
  const box = h('div.col', h('div.enun', rich(ex.enun)));
  for (const e of entradas) box.append(h('label.field', campos.length > 1 ? h('span', e.c.rot) : null, e.c.dica ? h('span.small.muted', { style: { fontWeight: '400' } }, rich(e.c.dica)) : null, e.ta));
  box.append(lista, conferir, fim);
  return box;
}

function json(ex, feito) {
  const ta = h('textarea.mono', { rows: Math.min(12, Math.max(5, (ex.inicial || '').split('\n').length + 1)), spellcheck: false, autocapitalize: 'off', autocomplete: 'off', 'aria-label': 'JSON', value: ex.inicial || '' });
  ta.setAttribute('autocorrect', 'off');
  const msg = h('div.why.hide', { role: 'status' });
  let tent = 0;
  const conferir = h('button.btn.primary.block', { type: 'button', onclick: () => {
    tent++;
    const r = analisar(ta.value);
    clear(msg);
    if (!r.ok) {
      msg.className = 'why no';
      msg.append(h('b', `Linha ${r.linha}, coluna ${r.col}: `), r.msg + ' ', h('span', r.dica));
      try { ta.focus(); ta.setSelectionRange(r.pos, Math.min(ta.value.length, r.pos + 1)); } catch {}
      return;
    }
    const probs = ex.espera ? conferirFormato(r.valor, ex.espera) : [];
    if (probs.length) { msg.className = 'why no'; msg.append(h('b', 'O JSON é válido, mas ainda falta: '), h('ul', { style: { margin: '4px 0 0', paddingLeft: '1.1em' } }, probs.slice(0, 5).map((p) => h('li', p)))); return; }
    msg.className = 'why ok'; msg.append(h('b', 'JSON válido. '), rich(ex.w || 'Um programa conseguiria ler isto sem tropeçar.'));
    ta.readOnly = true; conferir.classList.add('hide');
    marco('json');
    feito({ dePrimeira: tent === 1, tent });
  } }, 'Validar');
  return h('div.col', h('div.enun', rich(ex.enun)), ex.apoio ? h('div.small.muted', rich(ex.apoio)) : null, ta, msg, conferir);
}

function refletir(ex, feito) {
  const ta = h('textarea', { rows: 4, placeholder: 'Escreva do seu jeito, como se explicasse para um amigo.', 'aria-label': 'Sua explicação', maxLength: 2000 });
  const fim = h('div.col.hide');
  const aviso = h('div.small.muted.hide', 'Escreva pelo menos uma frase inteira antes de comparar. Tentar lembrar é o que fixa.');
  const comparar = h('button.btn.primary.block', { type: 'button', onclick: () => {
    if (ta.value.trim().length < 20) { aviso.classList.remove('hide'); return; }
    aviso.classList.add('hide'); comparar.classList.add('hide'); ta.readOnly = true;
    fim.classList.remove('hide');
    fim.append(h('div.callout.dica', h('span.rot', 'Uma boa explicação'), rich(ex.modelo)));
    if (ex.pontos) { fim.append(h('div.small.muted', 'Marque o que a sua explicação cobriu:')); for (const p of ex.pontos) fim.append(tick(p, false)); }
    feito({ dePrimeira: true, tent: 1 });
  } }, 'Comparar com uma boa explicação');
  return h('div.col', h('div.enun', rich(ex.enun)), ta, aviso, comparar, fim);
}

function lab(ex, feito, ctx) {
  const box = h('div.col', ex.enun ? h('div.enun', rich(ex.enun)) : null);
  const alvo = h('div', h('p.muted', 'Abrindo o laboratório…'));
  box.append(alvo);
  import(`../labs/${ex.lab}.js`).then((m) => { clear(alvo).append(m.default({ missao: ex.missao || true, opts: ex.opts || {}, feito: (r) => feito({ dePrimeira: true, tent: 1, ...(r || {}) }), ctx })); })
    .catch((e) => { console.error(e); clear(alvo).append(h('p', 'Não deu para abrir o laboratório agora.'), h('button.btn', { type: 'button', onclick: () => feito({ dePrimeira: false, tent: 1, ajuda: true }) }, 'Seguir sem ele')); });
  return box;
}

function python(ex, feito, ctx) {
  const box = h('div.col');
  import('../labs/python.js').then((m) => box.append(m.exercicioPython(ex, feito, ctx)));
  return box;
}

const TIPOS = { escolha, classificar, ordenar, lacunas, texto, json, refletir, lab, python };
export const TIPOS_EX = Object.keys(TIPOS);

/** Monta o exercício. feito() é chamado uma única vez. */
export function montarExercicio(ex, feito, ctx = {}) {
  let chamado = false;
  const uma = (r) => { if (chamado) return; chamado = true; feito(r || {}); };
  const fn = TIPOS[ex.tipo];
  if (!fn) return h('p.muted', 'Exercício indisponível.');
  return fn(ex, uma, ctx);
}

/** Gabarito em texto de um molde (para mostrar a solução completa). */
export const gabarito = (ex) => (ex.molde ? solucao(ex.molde) : '');
