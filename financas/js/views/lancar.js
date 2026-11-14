// Lançar (ou editar) uma entrada ou um gasto, com lançamento rápido por frase e reconhecimento da conta.
import { dados, salvarLancamento, apagarLancamento, pararRecorrente, apagarRecorrente, nomeCategoria, ensinar } from '../core/store.js';
import { PAGAMENTOS } from '../core/calc.js';
import { reconhecer, interpretarFrase, chaveDescricao, CONTAS, nomeGrupo, grupoDaCategoria } from '../core/plano.js';
import { reais, digitosParaCentavos } from '../core/dinheiro.js';
import { hoje, mesDe, somarMeses, nomeDia } from '../core/datas.js';
import { esc, aviso, confirmar } from '../core/ui.js';
import { opcoesAgrupadas } from './plano.js';

export const titulo = 'Lançar';
const ULTIMO_PAG = 'fin-ultimo-pagamento';

export function render(main, params) {
  const e = dados();
  const existente = params.id ? e.lancamentos.find((l) => l.id === params.id) : null;
  const rec = existente?.recorrente ? e.recorrentes.find((r) => r.id === existente.recorrente) : null;
  let ultimoPag = 'Pix';
  try { ultimoPag = localStorage.getItem(ULTIMO_PAG) || 'Pix'; } catch {}

  const f = existente ? { ...existente } : { tipo: params.tipo === 'receita' ? 'receita' : 'despesa', valor: 0, data: hoje(), categoria: '', descricao: '', pagamento: ultimoPag };
  let catEscolhida = !!existente; // depois que você escolhe a conta, o reconhecimento não troca mais
  const catOriginal = existente?.categoria;

  main.innerHTML = `<h1>${existente ? 'Editar lançamento' : 'Novo lançamento'}</h1>
    ${existente ? '' : `<section class="cartao rapido">
      <label class="campo" style="margin:0"><span>Lançamento rápido</span>
        <input id="frase" type="text" autocomplete="off" enterkeyhint="done" placeholder="Ex.: uber 23,50 ontem no pix">
      </label>
      <p class="sub" id="entendi" aria-live="polite" style="margin:8px 0 0">Escreva como falaria: o app preenche valor, conta, data e forma de pagamento.</p>
    </section>`}
    <form class="cartao" novalidate>
      <div class="alternar" role="group" aria-label="Tipo">
        <button type="button" data-tipo="despesa">Gastei</button>
        <button type="button" data-tipo="receita">Recebi</button>
      </div>
      <label class="campo"><span>Valor</span>
        <input id="valor" type="text" inputmode="numeric" autocomplete="off" class="valor-grande">
      </label>
      <label class="campo"><span>Descrição</span>
        <textarea id="descricao" rows="1" maxlength="120" placeholder="Ex.: feira do sábado, iFood, Netflix"></textarea>
      </label>
      <p class="reconhecido" id="reconhecido" aria-live="polite" hidden></p>
      <div class="campo"><span class="campo-rotulo" id="cat-rot">Conta</span>
        <div class="chips" id="cats" role="group" aria-labelledby="cat-rot"></div>
        <select id="cat-todas" aria-label="Todas as contas" style="margin-top:10px"></select>
      </div>
      <div class="duo" style="background:none;gap:10px">
        <label class="campo" style="background:none;padding:0"><span>Data</span><input id="data" type="date" required></label>
        <label class="campo" style="background:none;padding:0"><span>Como pagou</span>
          <select id="pagamento">${PAGAMENTOS.map((p) => `<option>${p}</option>`).join('')}</select></label>
      </div>
      ${existente ? (rec ? `<p class="sub">Esta é uma conta fixa, lançada todo dia ${rec.dia}${rec.fim ? ` até ${rec.fim.split('-').reverse().join('/')}` : ''}. Mudanças aqui valem só para este mês.</p>` : '')
        : `<label class="marcar"><input type="checkbox" id="repetir"><span><b>Repetir todo mês</b><small>Para salário, aluguel, internet, assinaturas…</small></span></label>`}
      ${existente && existente.descricao ? `<label class="marcar"><input type="checkbox" id="ensinar"><span><b>Usar esta conta sempre</b><small>Lançamentos e importações com esta descrição vão para a conta escolhida.</small></span></label>` : ''}
      <button class="btn primario cheio" type="submit">${existente ? 'Salvar alterações' : 'Salvar'}</button>
      ${existente ? `<div class="btn-linha" style="margin-top:10px">
          <button class="btn perigo" type="button" id="apagar">Apagar</button>
          ${rec && !rec.fim ? `<button class="btn" type="button" id="parar">Parar de repetir</button>` : ''}
        </div>` : ''}
    </form>`;

  const $ = (s) => main.querySelector(s);
  const valor = $('#valor'), desc = $('#descricao');
  const pintarValor = () => { valor.value = f.valor ? reais(f.valor) : ''; valor.placeholder = 'R$ 0,00'; };
  valor.addEventListener('input', () => { f.valor = digitosParaCentavos(valor.value); pintarValor(); valor.setSelectionRange(valor.value.length, valor.value.length); });

  // a descrição cresce para mostrar o texto inteiro
  const ajustarAltura = () => { desc.style.height = 'auto'; desc.style.height = desc.scrollHeight + 2 + 'px'; };
  desc.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') ev.preventDefault(); });

  // chips: a conta reconhecida, as mais usadas e as padrão; o resto fica no seletor completo
  const pintarContas = () => {
    const cats = e.categorias.filter((c) => c.tipo === f.tipo);
    if (!cats.some((c) => c.id === f.categoria)) f.categoria = maisUsadas(e, f.tipo)[0] || cats[0]?.id || '';
    const ids = [...new Set([f.categoria, ...maisUsadas(e, f.tipo), ...cats.filter((c) => CONTAS.find((x) => x.id === c.id)?.padrao).map((c) => c.id)])].filter((id) => cats.some((c) => c.id === id)).slice(0, 8);
    $('#cats').innerHTML = ids.map((id) => `<button type="button" class="chip" data-cat="${esc(id)}" aria-pressed="${id === f.categoria}">${esc(nomeCategoria(id))}</button>`).join('');
    $('#cat-todas').innerHTML = `<option value="">Outra conta…</option>${opcoesAgrupadas(e, f.tipo, ids.includes(f.categoria) ? '' : f.categoria)}`;
    $('#pagamento').closest('label').hidden = f.tipo === 'receita';
  };
  const pintarTipo = () => {
    main.querySelectorAll('[data-tipo]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tipo === f.tipo)));
    pintarContas();
  };

  /** Reconhece a conta pela descrição e explica o porquê. */
  const reconhecerDescricao = () => {
    const box = $('#reconhecido');
    if (catEscolhida || !f.descricao.trim()) { box.hidden = true; return; }
    const r = reconhecer(f.descricao, f.tipo, e);
    if (r.fonte === 'padrao') { box.hidden = true; return; }
    f.categoria = r.categoria;
    pintarContas();
    const porque = { regra: 'você ensinou o app', historico: 'igual a um lançamento anterior', nome: `pelo nome da conta`, palavra: `pela palavra “${r.palavra}”` }[r.fonte];
    const modelo = r.sugerida && CONTAS.find((c) => c.id === r.sugerida);
    const grupo = nomeGrupo(grupoDaCategoria(e.categorias.find((c) => c.id === r.categoria)));
    const nome = nomeCategoria(r.categoria);
    box.innerHTML = `Reconhecido: <b>${esc(nome)}</b>${grupo !== nome ? ` <span class="muted">em ${esc(grupo)}</span>` : ''} <span class="muted">(${esc(porque)})</span>${modelo ? `<br><span class="muted">Dica: crie a conta “${esc(modelo.nome)}” no plano de contas para separar estes gastos.</span>` : ''}`;
    box.hidden = false;
  };

  main.querySelectorAll('[data-tipo]').forEach((b) => (b.onclick = () => { f.tipo = b.dataset.tipo; pintarTipo(); reconhecerDescricao(); }));
  $('#cats').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-cat]'); if (!b) return;
    f.categoria = b.dataset.cat; catEscolhida = true;
    $('#cats').querySelectorAll('[data-cat]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $('#cat-todas').value = '';
    $('#reconhecido').hidden = true;
  });
  $('#cat-todas').addEventListener('change', (ev) => {
    if (!ev.target.value) return;
    f.categoria = ev.target.value; catEscolhida = true;
    pintarContas();
    $('#reconhecido').hidden = true;
  });
  desc.addEventListener('input', () => { f.descricao = desc.value.replace(/\n/g, ' '); ajustarAltura(); reconhecerDescricao(); });

  // lançamento rápido
  $('#frase')?.addEventListener('input', (ev) => {
    const r = interpretarFrase(ev.target.value);
    const partes = [];
    if (r.tipo && r.tipo !== f.tipo) f.tipo = r.tipo;
    if (r.valor) { f.valor = r.valor; partes.push(`<b>${reais(r.valor)}</b>`); }
    f.descricao = r.descricao || '';
    desc.value = f.descricao; ajustarAltura();
    f.data = r.data || hoje(); $('#data').value = f.data;
    if (r.pagamento) { f.pagamento = r.pagamento; $('#pagamento').value = r.pagamento; }
    pintarValor(); catEscolhida = false; pintarTipo(); reconhecerDescricao();
    if (f.descricao) partes.push(esc(f.descricao));
    partes.push(`em <b>${esc(nomeCategoria(f.categoria))}</b>`);
    if (r.data) partes.push(esc(nomeDia(r.data).toLowerCase()));
    if (r.pagamento && f.tipo === 'despesa') partes.push(esc(r.pagamento));
    $('#entendi').innerHTML = ev.target.value.trim() ? `Entendi: ${f.tipo === 'receita' ? 'entrada' : 'gasto'} de ${partes.join(' · ')}. Confira abaixo e salve.` : 'Escreva como falaria: o app preenche valor, conta, data e forma de pagamento.';
  });
  $('#frase')?.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); main.querySelector('form').requestSubmit(); } });

  desc.value = f.descricao || '';
  $('#data').value = f.data;
  $('#pagamento').value = PAGAMENTOS.includes(f.pagamento) ? f.pagamento : 'Pix';
  pintarValor(); pintarTipo();
  requestAnimationFrame(ajustarAltura);
  if (!existente) setTimeout(() => $('#frase').focus(), 50);

  main.querySelector('form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!f.valor) { aviso('Digite o valor.'); valor.focus(); return; }
    if (!f.categoria) { aviso('Escolha uma conta.'); return; }
    const data = $('#data').value || hoje();
    const l = { ...f, data, descricao: desc.value.replace(/\s+/g, ' ').trim(), pagamento: f.tipo === 'despesa' ? $('#pagamento').value : '' };
    const repetir = !!$('#repetir')?.checked;
    if ($('#ensinar')?.checked && l.descricao) {
      const iguais = e.lancamentos.filter((x) => x.tipo === l.tipo && chaveDescricao(x.descricao) === chaveDescricao(l.descricao)).map((x) => x.id);
      ensinar(l.tipo, l.descricao, l.categoria, iguais);
    }
    const salvo = salvarLancamento(l, { repetir });
    if (l.tipo === 'despesa') try { localStorage.setItem(ULTIMO_PAG, l.pagamento); } catch {}
    if (existente) { aviso(catOriginal !== l.categoria && $('#ensinar')?.checked ? 'Salvo. O app vai lembrar desta conta.' : 'Alterações salvas.'); history.back(); return; }
    aviso(`${l.tipo === 'receita' ? 'Entrada' : 'Gasto'} de ${reais(l.valor)} salvo em ${nomeCategoria(l.categoria)}${repetir ? ' (todo mês)' : ''}.`, {
      rotulo: 'Desfazer', fazer: () => { apagarLancamento(salvo.id); if (salvo.recorrente) apagarRecorrente(salvo.recorrente); aviso('Lançamento desfeito.'); },
    });
    // fica na tela, pronto para o próximo
    f.valor = 0; f.descricao = ''; catEscolhida = false;
    pintarValor(); desc.value = ''; ajustarAltura(); $('#reconhecido').hidden = true;
    if ($('#repetir')) $('#repetir').checked = false;
    if ($('#frase')) { $('#frase').value = ''; $('#entendi').textContent = 'Pronto para o próximo.'; $('#frase').focus(); } else valor.focus();
  });

  $('#apagar')?.addEventListener('click', async () => {
    const ok = await confirmar('Apagar lançamento?', `${existente.descricao || ''} ${reais(existente.valor)} em ${existente.data.split('-').reverse().join('/')}.`.trim(), { sim: 'Apagar', perigo: true });
    if (!ok) return;
    apagarLancamento(existente.id);
    aviso('Lançamento apagado.', { rotulo: 'Desfazer', fazer: () => salvarLancamento({ ...existente, id: undefined }) });
    history.back();
  });
  $('#parar')?.addEventListener('click', async () => {
    const ok = await confirmar('Parar de repetir?', 'Os meses já lançados continuam no extrato. A partir do próximo mês, esta conta não entra mais sozinha.', { sim: 'Parar' });
    if (!ok) return;
    pararRecorrente(rec.id, mesDe(existente.data) < mesDe(hoje()) ? mesDe(hoje()) : mesDe(existente.data));
    aviso('Conta fixa encerrada.');
    history.back();
  });
}

function maisUsadas(e, tipo) {
  const desde = somarMeses(mesDe(hoje()), -2);
  const n = {};
  for (const l of e.lancamentos) if (l.tipo === tipo && l.data >= desde) n[l.categoria] = (n[l.categoria] || 0) + 1;
  return Object.entries(n).sort((a, b) => b[1] - a[1]).map(([id]) => id).slice(0, 5);
}
