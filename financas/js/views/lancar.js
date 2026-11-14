// Lançar (ou editar) uma entrada ou um gasto. Pensado para levar poucos segundos no celular.
import { dados, salvarLancamento, apagarLancamento, pararRecorrente, apagarRecorrente } from '../core/store.js';
import { PAGAMENTOS } from '../core/calc.js';
import { reais, digitosParaCentavos } from '../core/dinheiro.js';
import { hoje, mesDe, somarMeses } from '../core/datas.js';
import { esc, aviso, confirmar } from '../core/ui.js';

export const titulo = 'Lançar';
const ULTIMO_PAG = 'fin-ultimo-pagamento';

export function render(main, params) {
  const e = dados();
  const existente = params.id ? e.lancamentos.find((l) => l.id === params.id) : null;
  const rec = existente?.recorrente ? e.recorrentes.find((r) => r.id === existente.recorrente) : null;
  let ultimoPag = 'Pix';
  try { ultimoPag = localStorage.getItem(ULTIMO_PAG) || 'Pix'; } catch {}

  const f = existente ? { ...existente } : { tipo: params.tipo === 'receita' ? 'receita' : 'despesa', valor: 0, data: hoje(), categoria: '', descricao: '', pagamento: ultimoPag };

  main.innerHTML = `<h1>${existente ? 'Editar lançamento' : 'Novo lançamento'}</h1>
    <form class="cartao" novalidate>
      <div class="alternar" role="group" aria-label="Tipo">
        <button type="button" data-tipo="despesa">Gastei</button>
        <button type="button" data-tipo="receita">Recebi</button>
      </div>
      <label class="campo"><span>Valor</span>
        <input id="valor" type="text" inputmode="numeric" autocomplete="off" class="valor-grande" aria-describedby="valor-ajuda">
        <small id="valor-ajuda" class="sub oculto">Digite só os números; os centavos entram sozinhos.</small>
      </label>
      <div class="campo"><span class="campo-rotulo" id="cat-rot">Categoria</span><div class="chips" id="cats" role="group" aria-labelledby="cat-rot"></div></div>
      <label class="campo" style="margin-top:14px"><span>Descrição <span class="muted">(opcional)</span></span>
        <input id="descricao" type="text" maxlength="80" autocomplete="off" placeholder="Ex.: feira do sábado" list="sugestoes">
        <datalist id="sugestoes"></datalist>
      </label>
      <div class="duo" style="background:none;gap:10px">
        <label class="campo" style="background:none;padding:0"><span>Data</span><input id="data" type="date" required></label>
        <label class="campo" style="background:none;padding:0"><span>Como pagou</span>
          <select id="pagamento">${PAGAMENTOS.map((p) => `<option>${p}</option>`).join('')}</select></label>
      </div>
      ${existente ? (rec ? `<p class="sub">Esta é uma conta fixa, lançada todo dia ${rec.dia}${rec.fim ? ` até ${rec.fim.split('-').reverse().join('/')}` : ''}. Mudanças aqui valem só para este mês.</p>` : '')
        : `<label class="marcar"><input type="checkbox" id="repetir"><span><b>Repetir todo mês</b><small>Para salário, aluguel, internet, assinaturas…</small></span></label>`}
      <button class="btn primario cheio" type="submit">${existente ? 'Salvar alterações' : 'Salvar'}</button>
      ${existente ? `<div class="btn-linha" style="margin-top:10px">
          <button class="btn perigo" type="button" id="apagar">Apagar</button>
          ${rec && !rec.fim ? `<button class="btn" type="button" id="parar">Parar de repetir</button>` : ''}
        </div>` : ''}
    </form>`;

  const $ = (s) => main.querySelector(s);
  const valor = $('#valor');
  const pintarValor = () => { valor.value = f.valor ? reais(f.valor) : ''; valor.placeholder = 'R$ 0,00'; };
  valor.addEventListener('input', () => { f.valor = digitosParaCentavos(valor.value); pintarValor(); valor.setSelectionRange(valor.value.length, valor.value.length); });
  pintarValor();

  const pintarTipo = () => {
    main.querySelectorAll('[data-tipo]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tipo === f.tipo)));
    const cats = e.categorias.filter((c) => c.tipo === f.tipo);
    if (!cats.some((c) => c.id === f.categoria)) f.categoria = maisUsada(e, f.tipo) || cats[0]?.id || '';
    $('#cats').innerHTML = cats.map((c) => `<button type="button" class="chip" data-cat="${esc(c.id)}" aria-pressed="${c.id === f.categoria}">${esc(c.nome)}</button>`).join('');
    $('#pagamento').closest('label').hidden = f.tipo === 'receita';
    sugerir();
  };
  main.querySelectorAll('[data-tipo]').forEach((b) => (b.onclick = () => { f.tipo = b.dataset.tipo; pintarTipo(); }));
  $('#cats').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-cat]'); if (!b) return;
    f.categoria = b.dataset.cat;
    $('#cats').querySelectorAll('[data-cat]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    sugerir();
  });
  // descrições já usadas na categoria aparecem como sugestão
  function sugerir() {
    const usadas = [...new Set(e.lancamentos.filter((l) => l.categoria === f.categoria && l.descricao).map((l) => l.descricao).reverse())].slice(0, 12);
    $('#sugestoes').innerHTML = usadas.map((d) => `<option value="${esc(d)}">`).join('');
  }

  $('#descricao').value = f.descricao || '';
  $('#data').value = f.data;
  $('#pagamento').value = PAGAMENTOS.includes(f.pagamento) ? f.pagamento : 'Pix';
  pintarTipo();
  if (!existente) setTimeout(() => valor.focus(), 50);

  main.querySelector('form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!f.valor) { aviso('Digite o valor.'); valor.focus(); return; }
    if (!f.categoria) { aviso('Escolha uma categoria.'); return; }
    const data = $('#data').value || hoje();
    const l = { ...f, data, descricao: $('#descricao').value.trim(), pagamento: f.tipo === 'despesa' ? $('#pagamento').value : '' };
    const repetir = !!$('#repetir')?.checked;
    const salvo = salvarLancamento(l, { repetir });
    if (l.tipo === 'despesa') try { localStorage.setItem(ULTIMO_PAG, l.pagamento); } catch {}
    if (existente) { aviso('Alterações salvas.'); history.back(); return; }
    aviso(`${l.tipo === 'receita' ? 'Entrada' : 'Gasto'} de ${reais(l.valor)} salvo${repetir ? ' (todo mês)' : ''}.`, {
      rotulo: 'Desfazer', fazer: () => { apagarLancamento(salvo.id); if (salvo.recorrente) apagarRecorrente(salvo.recorrente); aviso('Lançamento desfeito.'); },
    });
    // fica na tela, pronto para o próximo
    f.valor = 0; pintarValor(); $('#descricao').value = '';
    if ($('#repetir')) $('#repetir').checked = false;
    valor.focus();
  });

  $('#apagar')?.addEventListener('click', async () => {
    const ok = await confirmar('Apagar lançamento?', `${existente.descricao || ''} ${reais(existente.valor)} em ${existente.data.split('-').reverse().join('/')}.`.trim(), { sim: 'Apagar', perigo: true });
    if (!ok) return;
    apagarLancamento(existente.id);
    aviso('Lançamento apagado.', { rotulo: 'Desfazer', fazer: () => { delete existente.id; salvarLancamento({ ...existente, id: undefined }); } });
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

function maisUsada(e, tipo) {
  const desde = somarMeses(mesDe(hoje()), -2);
  const n = {};
  for (const l of e.lancamentos) if (l.tipo === tipo && l.data >= desde) n[l.categoria] = (n[l.categoria] || 0) + 1;
  return Object.entries(n).sort((a, b) => b[1] - a[1])[0]?.[0];
}
