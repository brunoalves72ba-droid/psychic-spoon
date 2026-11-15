// Aba Casal: só o que cada um escolheu compartilhar. A mesma tela nos dois celulares.
import { dados, eu, nomePessoa, nomeCategoria, categoria as catPorId, limites, definirDivisao, marcarAcertado } from '../core/store.js';
import { doMes, resumo, porCategoria, acerto, divisaoPelaRenda, orcamentos, conta, rateioDe, responsavel } from '../core/calc.js';
import { GRUPOS, grupoDaCategoria } from '../core/plano.js';
import { status as statusNuvem } from '../core/nuvem.js';
import { reais } from '../core/dinheiro.js';
import { mesAtual, nomeDia } from '../core/datas.js';
import { esc, navMes, icone, aviso } from '../core/ui.js';

export const titulo = 'Casal';

export function render(main, { m }) {
  const mes = /^\d{4}-\d{2}$/.test(m || '') && m <= mesAtual() ? m : mesAtual();
  const e = dados();
  const [A, B] = e.pessoas;
  const doMesTodo = doMes(e, mes);
  const comp = doMesTodo.filter((l) => l.compartilhado);
  // “dinheiro do casal” e metas do casal: só o que é dividido; os individuais aparecem à parte
  const gastos = comp.filter((l) => l.tipo === 'despesa' && conta(l) && rateioDe(l) === 'dividir');
  const ac = acerto(doMesTodo, e.pessoas, e.divisao);
  const sug = divisaoPelaRenda(doMesTodo, e.pessoas);
  const feito = e.acertos[mes] && !e.acertos[mes].desfeito ? e.acertos[mes] : null;
  const pessoais = Object.fromEntries(e.pessoas.map((p) => [p.id, resumo(doMesTodo.filter((l) => l.dono === p.id && !l.compartilhado)).despesas]));
  const metas = orcamentos(gastos, limites('casal'));
  const conectado = statusNuvem().ligado;

  const grupoDe = (id) => grupoDaCategoria(catPorId(id) || { id });
  const cats = porCategoria(gastos);
  const grupos = GRUPOS.map((g) => ({ g, total: cats.filter((c) => grupoDe(c.categoria) === g.id).reduce((a, c) => a + c.total, 0) })).filter((x) => x.total).sort((a, b) => b.total - a.total);
  const maior = grupos[0]?.total || 1;
  const br = (iso) => iso.slice(0, 10).split('-').reverse().join('/');

  main.innerHTML = `<p class="conta-de">Contas do casal</p>${navMes('#/casal', mes)}
    ${conectado ? '' : `<a class="cartao aviso-plano" href="#/conectar"><b>Conecte os dois celulares</b><span class="sub">Por enquanto esta aba só mostra o que foi compartilhado neste celular. Conecte o celular de ${esc(eu() === A.id ? B.nome : A.nome)} para os dois verem a mesma coisa.</span></a>`}

    <section class="cartao saldo" aria-label="Gastos divididos">
      <div class="rotulo">Gastos divididos ${mes === mesAtual() ? 'até agora' : 'no mês'}</div>
      <div class="valor">${reais(ac.total)}</div>
      <div class="duo">${e.pessoas.map((p) => `<div><div class="r">${esc(p.nome)} pagou</div><div class="v">${reais(ac.pagou[p.id])}</div></div>`).join('')}</div>
      ${ac.totalCompartilhado > ac.total ? `<div class="duo individuais">${e.pessoas.map((p) => `<div><div class="r">Só de ${esc(p.nome)}</div><div class="v">${reais(ac.individual[p.id])}</div></div>`).join('')}</div>
        <p class="sub">Individuais: compartilhados para o outro ver, mas de um só. Não são divididos.</p>` : ''}
    </section>

    <section class="cartao">
      <h2><span>Acerto do mês</span></h2>
      <p class="sub">Divisão combinada: ${e.pessoas.map((p) => `<b>${esc(p.nome)} ${e.divisao[p.id] ?? 50}%</b>`).join(' · ')} — dos gastos divididos, cada um deveria pagar ${e.pessoas.map((p) => `${esc(p.nome)} ${reais(ac.deveria[p.id])}`).join(', ')}.</p>
      ${ac.reembolsos.map((r) => `<p class="sub">${icone('repetir')} ${esc(nomePessoa(r.para))} pagou <b>${reais(r.valor)}</b> em gastos só de ${esc(nomePessoa(r.de))}: entra inteiro no acerto.</p>`).join('')}
      ${ac.transf
        ? `<p class="acerto">${icone('repetir')}<span><b>${esc(nomePessoa(ac.transf.de))}</b> transfere <b>${reais(ac.transf.valor)}</b> para <b>${esc(nomePessoa(ac.transf.para))}</b></span></p>
           ${feito ? `<p class="sub">${icone('ok')} Acertado em ${br(feito.quando)} por ${esc(nomePessoa(feito.por))}. <button class="btn mini" type="button" id="desfazer">Desfazer</button></p>`
             : `<button class="btn primario cheio" type="button" id="acertar">Marcar como acertado</button>`}`
        : `<p class="acerto">${icone('ok')}<span>${ac.total || ac.reembolsos.length ? 'Está equilibrado: ninguém precisa transferir nada.' : 'Nenhum gasto dividido neste mês.'}</span></p>`}
      <details class="tabela"><summary>Ajustar a divisão</summary>
        <form id="divisao" class="divisao">
          ${e.pessoas.map((p) => `<label class="campo"><span>${esc(p.nome)} (%)</span><input type="number" inputmode="numeric" min="0" max="100" step="1" name="${esc(p.id)}" value="${e.divisao[p.id] ?? 50}"></label>`).join('')}
          <button class="btn" type="submit">Salvar divisão</button>
        </form>
        ${sug ? `<p class="sub">Pela renda deste mês: ${e.pessoas.map((p) => `${esc(p.nome)} <b>${sug.pct[p.id]}%</b>`).join(' · ')}. <button class="btn mini" type="button" id="usar-sugestao">Usar esta sugestão</button></p>`
          : '<p class="sub">Quando os dois lançarem as entradas do mês, o app sugere a divisão pela renda de cada um.</p>'}
      </details>
    </section>

    <section class="cartao">
      <h2><span>Para onde foi o dinheiro do casal</span></h2>
      ${grupos.length ? `<ul class="barras">${grupos.map(({ g, total }) => `<li><div class="linha-barra">
          <div class="topo"><span class="nome">${esc(g.nome)}</span><b>${reais(total)}<span class="pct">${Math.round(total / ac.total * 100)}%</span></b></div>
          <div class="trilho"><i style="width:${(total / maior * 100).toFixed(1)}%"></i></div></div></li>`).join('')}</ul>`
        : '<p class="sub">Nada dividido neste mês ainda. No <b>Extrato</b>, toque no botão 🔒/👥 de um gasto e escolha “Dos dois (dividir)”.</p>'}
    </section>

    ${metas.length ? `<section class="cartao"><h2><span>Metas do casal</span></h2>${metas.map((o) => `<p class="sub"><b>${esc(nomeCategoria(o.categoria))}</b>: ${reais(o.gasto)} de ${reais(o.limite)} ${o.status === 'estourou' ? '— passou da meta' : o.status === 'atencao' ? '— perto do limite' : ''}</p>`).join('')}<a class="btn cheio" href="#/orcamento?escopo=casal">Ver metas do casal</a></section>` : ''}

    <section class="cartao">
      <h2><span>Gastos pessoais</span></h2>
      <p class="sub">O que cada um não compartilhou aparece só como total.</p>
      <div class="duo">${e.pessoas.map((p) => `<div><div class="r">${esc(p.nome)}</div><div class="v">${reais(pessoais[p.id])}</div></div>`).join('')}</div>
    </section>

    <section class="cartao">
      <h2><span>Lançamentos compartilhados</span><span class="sub">${comp.length}</span></h2>
      ${comp.length ? `<ul class="lista sem-borda">${[...comp].sort((a, b) => b.data.localeCompare(a.data)).map((l) => `<li><${l.dono === eu() ? `a class="item" href="#/lancar?id=${encodeURIComponent(l.id)}"` : 'div class="item"'}>
          <span class="ic ${l.tipo}" aria-hidden="true">${esc((nomePessoa(l.dono) || '?').slice(0, 1))}</span>
          <span class="txt"><span class="linha1"><span class="t1">${esc(l.descricao || nomeCategoria(l.categoria))}</span><span class="val ${l.tipo}">${l.tipo === 'receita' ? '+ ' : '− '}${reais(l.valor)}</span></span>
            <span class="t2">${esc(nomeDia(l.data))} · ${esc(nomeCategoria(l.categoria))} · pago por ${esc(nomePessoa(l.dono) || '—')}${l.tipo === 'despesa' ? (responsavel(l, e.pessoas) ? ` <span class="etq ind">só de ${esc(nomePessoa(responsavel(l, e.pessoas)))}</span>` : ' <span class="etq">dividido</span>') : ''}</span></span>
        </${l.dono === eu() ? 'a' : 'div'}></li>`).join('')}</ul>` : '<p class="sub">Nenhum.</p>'}
    </section>`;

  const recarregar = () => render((main.innerHTML = '', main), { m: mes });
  main.querySelector('#acertar')?.addEventListener('click', () => { marcarAcertado(mes, ac.transf); aviso('Acerto do mês marcado.'); recarregar(); });
  main.querySelector('#desfazer')?.addEventListener('click', () => { marcarAcertado(mes, null); recarregar(); });
  main.querySelector('#usar-sugestao')?.addEventListener('click', () => { definirDivisao(sug.pct); aviso('Divisão atualizada pela renda do mês.'); recarregar(); });
  main.querySelector('#divisao').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const pct = Object.fromEntries(e.pessoas.map((p) => [p.id, Math.max(0, Math.min(100, Math.round(+ev.target[p.id].value || 0)))]));
    const soma = Object.values(pct).reduce((a, b) => a + b, 0);
    if (soma !== 100) { aviso(`A soma precisa dar 100% (está em ${soma}%).`); return; }
    definirDivisao(pct);
    aviso('Divisão salva. Vale para os dois celulares.');
    recarregar();
  });
}
