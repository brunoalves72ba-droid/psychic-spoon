// Extrato do mês, agrupado por dia, com busca e filtros.
import { dados, nomeCategoria } from '../core/store.js';
import { doMes, filtrar, agruparPorDia, resumo } from '../core/calc.js';
import { reais } from '../core/dinheiro.js';
import { mesAtual, nomeDia } from '../core/datas.js';
import { esc, navMes, icone } from '../core/ui.js';

export const titulo = 'Extrato';

export function render(main, { m, cat = '', tipo = '' }) {
  const mes = /^\d{4}-\d{2}$/.test(m || '') && m <= mesAtual() ? m : mesAtual();
  const e = dados();
  const doMesTodo = doMes(e, mes);
  const usadas = [...new Set(doMesTodo.map((l) => l.categoria))].sort((a, b) => nomeCategoria(a).localeCompare(nomeCategoria(b)));
  const filtro = { texto: '', tipo, categoria: cat };

  main.innerHTML = `${navMes('#/extrato', mes)}
    <div class="filtros">
      <input type="search" id="busca" placeholder="Buscar" aria-label="Buscar no extrato">
      <select id="cat" aria-label="Filtrar por categoria"><option value="">Todas</option>${usadas.map((c) => `<option value="${esc(c)}">${esc(nomeCategoria(c))}</option>`).join('')}</select>
      <div class="chips" role="group" aria-label="Tipo">
        <button type="button" class="chip" data-tipo="">Tudo</button>
        <button type="button" class="chip" data-tipo="despesa">Saídas</button>
        <button type="button" class="chip" data-tipo="receita">Entradas</button>
      </div>
    </div>
    <p class="sub" id="total" aria-live="polite"></p>
    <div id="lista"></div>`;

  const $ = (s) => main.querySelector(s);
  $('#cat').value = usadas.includes(cat) ? cat : '';
  filtro.categoria = $('#cat').value;

  const pintar = () => {
    // filtros ficam na URL: ao editar um lançamento e voltar, a tela volta igual
    const qs = new URLSearchParams({ m: mes, ...(filtro.categoria && { cat: filtro.categoria }), ...(filtro.tipo && { tipo: filtro.tipo }) });
    history.replaceState(null, '', `#/extrato?${qs}`);
    main.querySelectorAll('[data-tipo]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tipo === filtro.tipo)));
    const lancs = filtrar(doMesTodo, filtro, nomeCategoria);
    const r = resumo(lancs);
    $('#total').textContent = lancs.length
      ? `${lancs.length} lançamento${lancs.length > 1 ? 's' : ''} · entrou ${reais(r.receitas)} · saiu ${reais(r.despesas)}`
      : '';
    if (!lancs.length) {
      $('#lista').innerHTML = `<div class="cartao vazio">${icone('carteira')}<p>${doMesTodo.length ? 'Nada encontrado com esses filtros.' : 'Nenhum lançamento neste mês.'}</p>${doMesTodo.length ? '' : '<a class="btn primario" href="#/lancar">Lançar</a>'}</div>`;
      return;
    }
    $('#lista').innerHTML = agruparPorDia(lancs).map((g) => `
      <div class="dia-cab"><span>${esc(nomeDia(g.data))}</span><span>${g.saldo >= 0 ? '+' : '−'} ${reais(Math.abs(g.saldo))}</span></div>
      <ul class="lista">${g.itens.map((l) => `<li><a class="item" href="#/lancar?id=${encodeURIComponent(l.id)}">
        <span class="ic ${l.tipo}" aria-hidden="true">${esc(nomeCategoria(l.categoria).slice(0, 1))}</span>
        <span class="txt"><span class="t1">${esc(l.descricao || nomeCategoria(l.categoria))}${l.recorrente ? '<span class="etq">fixa</span>' : ''}</span>
          <span class="t2">${esc(nomeCategoria(l.categoria))}${l.pagamento ? ` · ${esc(l.pagamento)}` : ''}</span></span>
        <span class="val ${l.tipo}">${l.tipo === 'receita' ? '+ ' : '− '}${reais(l.valor)}</span>
      </a></li>`).join('')}</ul>`).join('');
  };

  $('#busca').addEventListener('input', (ev) => { filtro.texto = ev.target.value; pintar(); });
  $('#cat').addEventListener('change', (ev) => { filtro.categoria = ev.target.value; pintar(); });
  main.querySelectorAll('[data-tipo]').forEach((b) => (b.onclick = () => { filtro.tipo = b.dataset.tipo; pintar(); }));
  pintar();
}
