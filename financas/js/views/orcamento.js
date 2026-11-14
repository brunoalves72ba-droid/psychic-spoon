// Metas de gasto por categoria (orçamento mensal) e lista das contas fixas.
import { dados, nomeCategoria, definirOrcamento } from '../core/store.js';
import { orcamentos, porCategoria, doMes, recorrentesDoMes } from '../core/calc.js';
import { reais, lerValor, centavosParaCampo } from '../core/dinheiro.js';
import { mesAtual, somarMeses, diasNoMes, hoje } from '../core/datas.js';
import { esc, icone, aviso, navegar } from '../core/ui.js';

export const titulo = 'Metas';

const STATUS = {
  ok: ['ok', 'Dentro da meta'],
  atencao: ['alerta', 'Perto do limite'],
  estourou: ['x', 'Passou da meta'],
};

export function render(main, { editar }) {
  const e = dados();
  const mes = mesAtual();
  if (editar !== undefined || !Object.keys(e.orcamentos).length) return renderEditar(main, !Object.keys(e.orcamentos).length && editar === undefined);

  const lista = orcamentos(e, mes);
  const diasRest = diasNoMes(mes) - +hoje().slice(8, 10) + 1;
  const tot = lista.reduce((a, o) => ({ limite: a.limite + o.limite, gasto: a.gasto + o.gasto }), { limite: 0, gasto: 0 });
  const fixas = recorrentesDoMes(e, mes).sort((a, b) => a.dia - b.dia);

  main.innerHTML = `<h1>Metas do mês</h1>
    <section class="cartao">
      <h2><span>Gasto × meta</span><span class="sub">${reais(tot.gasto)} de ${reais(tot.limite)}</span></h2>
      ${lista.map((o) => {
        const [ic, rot] = STATUS[o.status];
        return `<div class="orc" data-status="${o.status}">
          <div class="topo"><b>${esc(nomeCategoria(o.categoria))}</b><span>${reais(o.gasto)} <span class="muted">/ ${reais(o.limite)}</span></span></div>
          <div class="trilho" role="progressbar" aria-label="${esc(nomeCategoria(o.categoria))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100, Math.round(o.pct * 100))}"><i style="width:${Math.min(100, o.pct * 100).toFixed(1)}%"></i></div>
          <div class="rodape"><span class="status ${o.status}">${icone(ic)}${rot}</span>
            <span>${o.resta >= 0 ? `Restam ${reais(o.resta)}${diasRest > 1 ? ` · ${reais(Math.floor(o.resta / diasRest))}/dia` : ''}` : `${reais(-o.resta)} acima`}</span></div>
        </div>`;
      }).join('')}
      <a class="btn cheio" href="#/orcamento?editar" style="margin-top:12px">Ajustar metas</a>
    </section>
    <section class="cartao">
      <h2><span>Contas fixas</span><span class="sub">gastos fixos: ${reais(fixas.filter((r) => r.tipo === 'despesa').reduce((s, r) => s + r.valor, 0))}/mês</span></h2>
      ${fixas.length ? `<ul class="lista">${fixas.map((r) => {
        const lanc = e.lancamentos.find((l) => l.recorrente === r.id && l.data.startsWith(mes));
        return `<li><${lanc ? `a class="item" href="#/lancar?id=${encodeURIComponent(lanc.id)}"` : 'div class="item"'}>
          <span class="ic ${r.tipo}" aria-hidden="true">${r.dia}</span>
          <span class="txt"><span class="t1">${esc(r.descricao || nomeCategoria(r.categoria))}</span><span class="t2">${lanc ? 'Lançada' : `Vence dia ${r.dia}`} · ${esc(nomeCategoria(r.categoria))}</span></span>
          <span class="val ${r.tipo}">${r.tipo === 'receita' ? '+ ' : '− '}${reais(r.valor)}</span>
        </${lanc ? 'a' : 'div'}></li>`;
      }).join('')}</ul>` : '<p class="sub">Nenhuma ainda. Ao lançar salário, aluguel ou internet, marque “Repetir todo mês”.</p>'}
    </section>`;
}

function renderEditar(main, primeiraVez) {
  const e = dados();
  const cats = e.categorias.filter((c) => c.tipo === 'despesa');
  // sugestão: média dos últimos 3 meses fechados, arredondada para cima em R$ 10
  const media = {};
  for (let i = 1; i <= 3; i++) for (const c of porCategoria(doMes(e, somarMeses(mesAtual(), -i)))) media[c.categoria] = (media[c.categoria] || 0) + c.total / 3;

  main.innerHTML = `<h1>${primeiraVez ? 'Defina suas metas' : 'Ajustar metas'}</h1>
    <p class="sub">Quanto você quer gastar, no máximo, em cada categoria por mês? Deixe em branco o que não quer acompanhar.${Object.keys(media).length ? ' A sugestão em cinza é a sua média dos últimos 3 meses.' : ''}</p>
    <form class="cartao">
      ${cats.map((c) => {
        const sug = media[c.id] ? Math.ceil(media[c.id] / 1000) * 1000 : 0;
        return `<label class="orc-editar"><span>${esc(c.nome)}</span>
          <input type="text" inputmode="decimal" name="${esc(c.id)}" value="${e.orcamentos[c.id] ? centavosParaCampo(e.orcamentos[c.id]) : ''}" placeholder="${sug ? centavosParaCampo(sug) : 'R$'}" aria-label="Meta para ${esc(c.nome)}"></label>`;
      }).join('')}
      <button class="btn primario cheio" type="submit" style="margin-top:14px">Salvar metas</button>
    </form>`;

  main.querySelector('form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    let erro = null;
    for (const inp of ev.target.querySelectorAll('input')) {
      const v = inp.value.trim() ? lerValor(inp.value) : 0;
      if (v === null || v < 0) { erro = inp; break; }
      definirOrcamento(inp.name, v);
    }
    if (erro) { aviso('Valor inválido. Use números, como 450 ou 450,00.'); erro.focus(); return; }
    aviso('Metas salvas.');
    navegar('#/orcamento');
  });
}
