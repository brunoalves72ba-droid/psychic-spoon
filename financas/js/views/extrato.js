// Extrato do mês, agrupado por dia: Minhas (com o botão de compartilhar) ou Casal (o que os dois compartilharam).
import { dados, nomeCategoria } from '../core/store.js';
import { doMes, filtrar, agruparPorDia, resumo, daVisao } from '../core/calc.js';
import { reais } from '../core/dinheiro.js';
import { mesAtual, nomeDia } from '../core/datas.js';
import { esc, navMes, icone } from '../core/ui.js';
import { GRUPOS, grupoDaCategoria } from '../core/plano.js';
import { categoria as catPorId, nomeCartao, eu, nomePessoa, outra, compartilhar } from '../core/store.js';
import { aviso } from '../core/ui.js';

export const titulo = 'Extrato';

export function render(main, { m, cat = '', tipo = '', ver = 'minhas' }) {
  const mes = /^\d{4}-\d{2}$/.test(m || '') && m <= mesAtual() ? m : mesAtual();
  const e = dados();
  const visao = ver === 'casal' ? 'casal' : 'minhas';
  const doMesTodo = daVisao(doMes(e, mes), visao === 'casal' ? 'casal' : 'eu', eu());
  const parceira = outra()?.nome || '';
  let selecionando = false;
  const sel = new Set();
  const usadas = [...new Set(doMesTodo.map((l) => l.categoria))].sort((a, b) => nomeCategoria(a).localeCompare(nomeCategoria(b)));
  const grupoDe = (id) => grupoDaCategoria(catPorId(id) || { id });
  const gruposUsados = GRUPOS.filter((g) => usadas.some((c) => grupoDe(c) === g.id));
  const filtro = { texto: '', tipo, categoria: cat };

  main.innerHTML = `${navMes('#/extrato', mes)}
    <div class="alternar" role="group" aria-label="Ver">
      <button type="button" data-ver="minhas" aria-pressed="${visao === 'minhas'}">Minhas</button>
      <button type="button" data-ver="casal" aria-pressed="${visao === 'casal'}">Casal</button>
    </div>
    <div class="filtros">
      <input type="search" id="busca" placeholder="Buscar" aria-label="Buscar no extrato">
      <select id="cat" aria-label="Filtrar por grupo ou conta"><option value="">Todas as contas</option>
        <optgroup label="Grupos">${gruposUsados.map((g) => `<option value="g:${g.id}">${esc(g.nome)} (grupo)</option>`).join('')}</optgroup>
        <optgroup label="Contas">${usadas.map((c) => `<option value="${esc(c)}">${esc(nomeCategoria(c))}</option>`).join('')}</optgroup></select>
      <div class="chips" role="group" aria-label="Tipo">
        <button type="button" class="chip" data-tipo="">Tudo</button>
        <button type="button" class="chip" data-tipo="despesa">Saídas</button>
        <button type="button" class="chip" data-tipo="receita">Entradas</button>
      </div>
    </div>
    <p class="sub" id="total" aria-live="polite"></p>
    ${visao === 'minhas' ? `<div class="btn-linha" style="margin-bottom:4px"><button class="btn" type="button" id="selecionar">Selecionar para compartilhar</button><a class="btn" href="#/importar">Importar extrato</a></div>
    <div class="barra-importar" id="barra-sel" hidden><p class="sub" id="n-sel"></p>
      <div class="btn-linha"><button class="btn" type="button" id="sel-privado">Deixar privado</button><button class="btn primario" type="button" id="sel-compartilhar">Compartilhar com ${esc(parceira)}</button></div></div>`
    : `<p class="sub">Os lançamentos que você e ${esc(parceira)} escolheram compartilhar. Os privados de cada um não aparecem aqui.</p>`}
    <div id="lista"></div>`;

  const $ = (s) => main.querySelector(s);
  $('#cat').value = usadas.includes(cat) || gruposUsados.some((g) => 'g:' + g.id === cat) ? cat : '';
  filtro.categoria = $('#cat').value;

  const pintar = () => {
    // filtros ficam na URL: ao editar um lançamento e voltar, a tela volta igual
    const qs = new URLSearchParams({ m: mes, ...(visao === 'casal' && { ver: 'casal' }), ...(filtro.categoria && { cat: filtro.categoria }), ...(filtro.tipo && { tipo: filtro.tipo }) });
    history.replaceState(null, '', `#/extrato?${qs}`);
    main.querySelectorAll('[data-tipo]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tipo === filtro.tipo)));
    const doGrupo = filtro.categoria.startsWith('g:') ? doMesTodo.filter((l) => 'g:' + grupoDe(l.categoria) === filtro.categoria) : doMesTodo;
    const lancs = filtrar(doGrupo, { ...filtro, categoria: filtro.categoria.startsWith('g:') ? '' : filtro.categoria }, nomeCategoria);
    const r = resumo(lancs);
    $('#total').textContent = lancs.length
      ? `${lancs.length} lançamento${lancs.length > 1 ? 's' : ''} · entrou ${reais(r.receitas)} · saiu ${reais(r.despesas)}`
      : '';
    if (!lancs.length) {
      $('#lista').innerHTML = `<div class="cartao vazio">${icone('carteira')}<p>${doMesTodo.length ? 'Nada encontrado com esses filtros.' : 'Nenhum lançamento neste mês.'}</p>${doMesTodo.length ? '' : '<div class="btn-linha"><a class="btn primario" href="#/lancar">Lançar</a><a class="btn" href="#/importar">Importar extrato</a></div>'}</div>`;
      return;
    }
    $('#lista').innerHTML = agruparPorDia(lancs).map((g) => `
      <div class="dia-cab"><span>${esc(nomeDia(g.data))}</span><span>${g.saldo >= 0 ? '+' : '−'} ${reais(Math.abs(g.saldo))}</span></div>
      <ul class="lista">${g.itens.map((l) => {
        const meu = !l.dono || l.dono === eu();
        const tag = meu && !selecionando ? `a class="item" href="#/lancar?id=${encodeURIComponent(l.id)}"` : `div class="item"`;
        return `<li class="${l.compartilhado ? 'comp' : ''}">${selecionando && meu ? `<label class="sel"><input type="checkbox" data-sel="${esc(l.id)}" ${sel.has(l.id) ? 'checked' : ''} aria-label="Selecionar ${esc(l.descricao || '')}"></label>` : ''}<${tag}>
        <span class="ic ${l.tipo}" aria-hidden="true">${esc(visao === 'casal' ? (nomePessoa(l.dono) || '?').slice(0, 1) : nomeCategoria(l.categoria).slice(0, 1))}</span>
        <span class="txt">
          <span class="linha1"><span class="t1">${esc(l.descricao || nomeCategoria(l.categoria))}</span><span class="val ${l.tipo}">${l.tipo === 'receita' ? '+ ' : '− '}${reais(l.valor)}</span></span>
          <span class="t2">${esc(nomeCategoria(l.categoria))}${visao === 'casal' ? ` · pago por ${esc(nomePessoa(l.dono) || '—')}` : ''}${l.pagamento ? ` · ${esc(l.pagamento)}` : ''}${l.cartao ? ` · ${esc(nomeCartao(l.cartao))}` : ''}${l.origem === 'notificacao' ? ' <span class="etq">notificação</span>' : ''}${l.recorrente ? ' <span class="etq">fixa</span>' : ''}${l.importId ? ' <span class="etq">banco</span>' : ''}</span>
        </span>
      </${meu && !selecionando ? 'a' : 'div'}>${visao === 'minhas' && !selecionando ? `<button type="button" class="btn-comp" data-comp="${esc(l.id)}" aria-pressed="${!!l.compartilhado}" aria-label="${l.compartilhado ? 'Compartilhado com ' + esc(parceira) + '. Tocar para deixar privado' : 'Privado. Tocar para compartilhar com ' + esc(parceira)}">${l.compartilhado ? '👥 Compartilhado' : '🔒 Privado'}</button>` : ''}</li>`;
      }).join('')}</ul>`).join('');
  };

  main.querySelectorAll('[data-ver]').forEach((b) => (b.onclick = () => { location.hash = `#/extrato?m=${mes}${b.dataset.ver === 'casal' ? '&ver=casal' : ''}`; }));
  $('#lista').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-comp]');
    if (!b) return;
    const l = dados().lancamentos.find((x) => x.id === b.dataset.comp);
    compartilhar([l.id], !l.compartilhado);
    aviso(l.compartilhado ? `Compartilhado com ${parceira}.` : 'Agora é privado.');
    pintar();
  });
  $('#lista').addEventListener('change', (ev) => {
    const c = ev.target.closest('[data-sel]');
    if (!c) return;
    c.checked ? sel.add(c.dataset.sel) : sel.delete(c.dataset.sel);
    $('#n-sel').textContent = `${sel.size} selecionado${sel.size === 1 ? '' : 's'}`;
  });
  const modoSel = (on) => {
    selecionando = on; sel.clear();
    $('#barra-sel').hidden = !on;
    $('#selecionar').textContent = on ? 'Cancelar seleção' : 'Selecionar para compartilhar';
    $('#n-sel').textContent = '0 selecionados';
    pintar();
  };
  $('#selecionar')?.addEventListener('click', () => modoSel(!selecionando));
  const aplicarSel = (sim) => {
    if (!sel.size) { aviso('Marque os lançamentos primeiro.'); return; }
    const n = sel.size;
    compartilhar([...sel], sim);
    aviso(sim ? `${n} compartilhado${n > 1 ? 's' : ''} com ${parceira}.` : `${n} agora ${n > 1 ? 'são privados' : 'é privado'}.`);
    modoSel(false);
  };
  $('#sel-compartilhar')?.addEventListener('click', () => aplicarSel(true));
  $('#sel-privado')?.addEventListener('click', () => aplicarSel(false));
  $('#busca').addEventListener('input', (ev) => { filtro.texto = ev.target.value; pintar(); });
  $('#cat').addEventListener('change', (ev) => { filtro.categoria = ev.target.value; pintar(); });
  main.querySelectorAll('[data-tipo]').forEach((b) => (b.onclick = () => { filtro.tipo = b.dataset.tipo; pintar(); }));
  pintar();
}
