// Recorrências: o que entra e o que sai todo mês sozinho (salário, aluguel, internet, assinaturas…).
// Separa entradas e despesas recorrentes, mostra o que já entrou/saiu neste mês, a sobra fixa,
// e permite mudar valor, dia, descrição e conta, encerrar ou apagar.
import { dados, eu, nomeCategoria, editarRecorrente, pararRecorrente, apagarRecorrente } from '../core/store.js';
import { recorrencias, PAGAMENTOS } from '../core/calc.js';
import { sugestoesPlano } from '../core/plano.js';
import { reais, digitosParaCentavos } from '../core/dinheiro.js';
import { mesAtual } from '../core/datas.js';
import { esc, aviso, confirmar } from '../core/ui.js';
import { opcoesAgrupadas } from './plano.js';

export const titulo = 'Recorrências';

const nomeMes = (m) => new Date(+m.slice(0, 4), +m.slice(5, 7) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export function render(main) {
  const tudo = dados();
  const mes = mesAtual();
  // as minhas: as que eu lancei (as compartilhadas do outro aparecem no celular dele)
  const e = { ...tudo, recorrentes: tudo.recorrentes.filter((r) => !r.dono || r.dono === eu()) };
  const rc = recorrencias(e, mes);
  const sug = sugestoesPlano(tudo).fixas.length;

  const item = (r) => `<li><button type="button" class="item rec" data-rec="${esc(r.id)}">
      <span class="ic ${r.tipo}" aria-hidden="true">${r.dia}</span>
      <span class="txt"><span class="linha1"><span class="t1">${esc(r.descricao || nomeCategoria(r.categoria))}</span><span class="val ${r.tipo}">${r.tipo === 'receita' ? '+ ' : '− '}${reais(r.valor)}</span></span>
        <span class="t2">${esc(nomeCategoria(r.categoria))} · ${r.feito ? `<span class="etq ok">${r.tipo === 'receita' ? 'já entrou' : 'já saiu'} este mês</span>` : `${r.tipo === 'receita' ? 'entra' : 'vence'} dia ${r.dia}`}${r.compartilhado ? ' · 👥' : ''}</span></span>
    </button></li>`;
  const secao = (tit, lista, total, falta, tipo) => `<section class="cartao">
      <h2><span>${tit}</span><span class="sub">${reais(total)}/mês</span></h2>
      ${lista.length ? `<ul class="lista">${lista.map(item).join('')}</ul>${falta ? `<p class="sub" style="margin-top:8px">${tipo === 'receita' ? 'Ainda vão entrar' : 'Ainda vão sair'} <b>${reais(falta)}</b> este mês.</p>` : ''}`
        : `<p class="sub">${tipo === 'receita' ? 'Nenhuma ainda. Ex.: salário, pró-labore, aluguel que você recebe, complemento de receita.' : 'Nenhuma ainda. Ex.: aluguel, condomínio, internet, plano de saúde, assinaturas.'}</p>`}
      <a class="btn cheio" href="#/lancar?${tipo === 'receita' ? 'tipo=receita&' : ''}repetir=1" style="margin-top:10px">+ ${tipo === 'receita' ? 'Nova entrada recorrente' : 'Nova despesa recorrente'}</a>
    </section>`;

  main.innerHTML = `<h1>Recorrências</h1>
    <p class="sub">O que entra e o que sai todo mês. Cada uma é lançada sozinha no dia certo; aqui você confere, muda o valor ou encerra.</p>
    <section class="cartao saldo" aria-label="Resumo das recorrências">
      <div class="rotulo">Sobra fixa por mês</div>
      <div class="valor ${rc.sobra < 0 ? 'neg' : ''}">${rc.sobra < 0 ? '− ' : ''}${reais(Math.abs(rc.sobra))}</div>
      <div class="duo"><div><div class="r">Entradas recorrentes</div><div class="v entrada">${reais(rc.totalEntradas)}</div></div>
        <div><div class="r">Despesas recorrentes</div><div class="v saida">${reais(rc.totalDespesas)}</div></div></div>
      <p class="sub">${rc.sobra < 0 ? 'As despesas fixas passam das entradas fixas: o resto do mês depende de outras entradas.' : 'É o que sobra das entradas fixas depois das despesas fixas, antes dos gastos do dia a dia.'}</p>
    </section>
    ${sug ? `<a class="cartao aviso-plano" href="#/plano"><b>${sug} possíve${sug > 1 ? 'is' : 'l'} recorrência${sug > 1 ? 's' : ''} encontrada${sug > 1 ? 's' : ''}</b><span class="sub">Lançamentos com o mesmo valor há 3 meses seguidos. Veja em Plano de contas › Sugestões.</span></a>` : ''}
    ${secao('Entradas recorrentes', rc.entradas, rc.totalEntradas, rc.aReceber, 'receita')}
    ${secao('Despesas recorrentes', rc.despesas, rc.totalDespesas, rc.aPagar, 'despesa')}
    ${rc.encerradas.length ? `<details class="cartao tabela"><summary>Encerradas (${rc.encerradas.length})</summary><ul class="lista sem-borda">${rc.encerradas.map((r) => `<li><div class="item"><span class="ic ${r.tipo}" aria-hidden="true">${r.dia}</span>
        <span class="txt"><span class="linha1"><span class="t1">${esc(r.descricao || nomeCategoria(r.categoria))}</span><span class="val ${r.tipo}">${reais(r.valor)}</span></span>
        <span class="t2">${r.tipo === 'receita' ? 'Entrada' : 'Despesa'} · última em ${esc(nomeMes(r.fim))}</span></span></div></li>`).join('')}</ul></details>` : ''}`;

  main.querySelectorAll('[data-rec]').forEach((b) => (b.onclick = () => editar(main, b.dataset.rec)));
}

function editar(main, id) {
  const e = dados();
  const r = e.recorrentes.find((x) => x.id === id);
  if (!r) return;
  let valor = r.valor;
  const d = document.createElement('dialog');
  d.className = 'rec-editar';
  d.innerHTML = `<h2>${r.tipo === 'receita' ? 'Entrada recorrente' : 'Despesa recorrente'}</h2>
    <form method="dialog" class="form-rec">
      <label class="campo"><span>Valor por mês</span><input id="rv" type="text" inputmode="numeric" value="${reais(r.valor)}"></label>
      <label class="campo"><span>Dia do mês</span><input id="rd" type="number" inputmode="numeric" min="1" max="31" value="${r.dia}"></label>
      <label class="campo"><span>Descrição</span><input id="rdesc" type="text" maxlength="120" value="${esc(r.descricao || '')}"></label>
      <label class="campo"><span>Conta</span><select id="rcat">${opcoesAgrupadas(e, r.tipo, r.categoria)}</select></label>
      ${r.tipo === 'despesa' ? `<label class="campo"><span>Como paga</span><select id="rpag">${PAGAMENTOS.map((p) => `<option${p === r.pagamento ? ' selected' : ''}>${p}</option>`).join('')}</select></label>` : ''}
      <p class="sub">Vale dos próximos meses em diante. O lançamento deste mês muda junto se você ainda não o alterou.</p>
      <div class="btn-linha"><button class="btn" type="button" value="cancelar">Cancelar</button><button class="btn primario" type="submit" value="salvar">Salvar</button></div>
      <div class="btn-linha" style="margin-top:10px">${!r.fim ? '<button class="btn" type="button" value="encerrar">Encerrar</button>' : ''}<button class="btn perigo" type="button" value="apagar">Apagar</button></div>
    </form>`;
  document.body.append(d);
  const $ = (s) => d.querySelector(s);
  $('#rv').addEventListener('input', (ev) => { valor = digitosParaCentavos(ev.target.value); ev.target.value = valor ? reais(valor) : ''; });
  d.querySelectorAll('button[type=button]').forEach((b) => (b.onclick = () => d.close(b.value)));
  $('form').onsubmit = (ev) => { ev.preventDefault(); d.close('salvar'); };
  d.addEventListener('close', async () => {
    const acao = d.returnValue;
    const campos = { valor, dia: Math.round(+$('#rd').value), descricao: $('#rdesc').value, categoria: $('#rcat').value, pagamento: $('#rpag')?.value };
    d.remove();
    if (acao === 'salvar') {
      if (!(valor > 0)) { aviso('Digite o valor.'); return; }
      if (!(campos.dia >= 1 && campos.dia <= 31)) { aviso('O dia precisa ser de 1 a 31.'); return; }
      editarRecorrente(id, campos);
      aviso('Recorrência atualizada.');
    } else if (acao === 'encerrar') {
      const ok = await confirmar('Encerrar esta recorrência?', 'Os meses já lançados continuam no extrato. A partir do próximo mês, ela não entra mais sozinha.', { sim: 'Encerrar' });
      if (!ok) return;
      pararRecorrente(id, mesAtual());
      aviso('Recorrência encerrada. Este mês continua lançado.');
    } else if (acao === 'apagar') {
      const ok = await confirmar('Apagar esta recorrência?', 'Ela some desta lista e não entra mais. Os lançamentos já feitos continuam no extrato.', { sim: 'Apagar', perigo: true });
      if (!ok) return;
      apagarRecorrente(id);
      aviso('Recorrência apagada.');
    } else return;
    render((main.innerHTML = '', main));
  });
  d.showModal();
}

