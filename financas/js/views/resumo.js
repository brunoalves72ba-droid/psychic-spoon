// Minhas contas: o mês de quem usa este celular (privadas e compartilhadas que eu paguei).
import { dados, nomeCategoria, categoria as catPorId, pendentesAtivos, eu, nomePessoa, limites } from '../core/store.js';
import { GRUPOS, grupoDaCategoria, sugestoesPlano } from '../core/plano.js';
import { saldoTickets, aClassificar, recorrencias, doMes, resumo, porCategoria, historico, previsao, orcamentos, daVisao } from '../core/calc.js';
import { reais, reaisCurto } from '../core/dinheiro.js';
import { mesAtual, somarMeses, nomeMes, nomeMesCurto } from '../core/datas.js';
import { esc, navMes, icone } from '../core/ui.js';

export const titulo = 'Minhas contas';

let visao = 'grupos';
try { visao = localStorage.getItem('fin-visao') || 'grupos'; } catch {}

export function render(main, { m }) {
  const mes = /^\d{4}-\d{2}$/.test(m || '') && m <= mesAtual() ? m : mesAtual();
  const tudo = dados();
  // só o que é meu (as contas da outra pessoa ficam na aba Casal, e só as compartilhadas)
  const e = { ...tudo, lancamentos: daVisao(tudo.lancamentos, 'eu', eu()), recorrentes: tudo.recorrentes.filter((r) => !r.dono || r.dono === eu()) };
  const lancs = doMes(e, mes);
  const r = resumo(lancs);
  const ant = resumo(doMes(e, somarMeses(mes, -1)));
  const cats = porCategoria(lancs);
  const prev = previsao(e, mes);
  const orc = orcamentos(lancs, limites(eu())).filter((o) => o.status !== 'ok');
  const nPend = lancs.filter(aClassificar).length;
  const tickets = saldoTickets(lancs);

  if (!e.lancamentos.length) {
    main.innerHTML = `<p class="conta-de">Conta ${esc(nomePessoa(eu()))}</p>${navMes('#/resumo', mes)}
      <div class="cartao vazio">${icone('carteira')}
        <h2>Comece anotando um gasto</h2>
        <p>Cada vez que pagar algo, toque em <b>Lançar</b>. Leva uns 5 segundos. Em poucos dias você já vê para onde vai o seu dinheiro.</p>
        <p class="sub">Dica: lance primeiro o salário e as contas fixas (aluguel, internet…) marcando “repetir todo mês”.</p>
        <div class="btn-linha"><a class="btn primario" href="#/lancar">Fazer o primeiro lançamento</a><a class="btn" href="#/importar">Importar extrato do banco</a></div>
      </div>`;
    return;
  }

  const dicas = [];
  if (prev) {
    dicas.push([`ritmo`, `Você está gastando em média <b>${reais(prev.mediaDia)}</b> por dia (fora as contas fixas).`]);
    if (prev.diasRestantes > 0) dicas.push(['calendario', `Nesse ritmo, o mês fecha com uns <b>${reais(prev.gastoPrevisto)}</b> de gastos${r.receitas ? ` — ${prev.gastoPrevisto > r.receitas ? `<b>${reais(prev.gastoPrevisto - r.receitas)} a mais</b> do que entrou` : `sobrando cerca de <b>${reais(r.receitas - prev.gastoPrevisto)}</b>`}` : ''}.`]);
    if (prev.fixasAVencer) dicas.push(['repetir', `Ainda vencem <b>${reais(prev.fixasAVencer)}</b> em contas fixas este mês.`]);
    const aReceber = recorrencias(e, mes).aReceber;
    if (aReceber) dicas.push(['repetir', `Ainda vão entrar <b>${reais(aReceber)}</b> em entradas recorrentes este mês. <a href="#/recorrentes">Ver recorrências</a>`]);
  }
  if (ant.despesas && r.despesas) {
    const dif = r.despesas - ant.despesas;
    const base = prev ? `até agora` : `no mês`;
    if (Math.abs(dif) >= 100) dicas.push([dif > 0 ? 'subiu' : 'desceu', `Gastou <b>${reais(Math.abs(dif))} ${dif > 0 ? 'a mais' : 'a menos'}</b> ${base} do que em todo o mês de ${nomeMes(somarMeses(mes, -1), false)}.`]);
  }
  for (const o of orc.slice(0, 3)) {
    dicas.push(['alerta', o.status === 'estourou'
      ? `<b>${esc(nomeCategoria(o.categoria))}</b> passou da meta em ${reais(-o.resta)}.`
      : `<b>${esc(nomeCategoria(o.categoria))}</b> já usou ${Math.round(o.pct * 100)}% da meta. Restam ${reais(o.resta)}.`]);
  }

  const sug = sugestoesPlano(e);
  const comp = lancs.filter((l) => l.compartilhado && l.tipo === 'despesa').reduce((a, l) => a + l.valor, 0);
  // linhas do gráfico de barras: por grupo (com as contas de cada um) ou por conta
  const grupoDe = (id) => grupoDaCategoria(catPorId(id) || { id });
  const linhas = visao === 'grupos'
    ? GRUPOS.map((g) => {
        const dentro = cats.filter((c) => grupoDe(c.categoria) === g.id);
        return { id: 'g:' + g.id, nome: g.nome, total: dentro.reduce((a, c) => a + c.total, 0), detalhe: dentro.length > 1 ? dentro.slice(0, 3).map((c) => nomeCategoria(c.categoria)).join(', ') + (dentro.length > 3 ? '…' : '') : '' };
      }).filter((g) => g.total).sort((a, b) => b.total - a.total)
    : cats.map((c) => ({ id: c.categoria, nome: nomeCategoria(c.categoria), total: c.total, detalhe: '' }));
  const maiorLinha = linhas[0]?.total || 1;
  const hist = historico(e, mes, 6);

  main.innerHTML = `<p class="conta-de">Conta ${esc(nomePessoa(eu()))}</p>${navMes('#/resumo', mes)}
    <section class="cartao saldo" aria-label="Saldo do mês">
      <div class="rotulo">${r.saldo >= 0 ? 'Sobrou' : 'Faltou'} ${prev ? 'até agora' : 'no mês'}</div>
      <div class="valor ${r.saldo < 0 ? 'neg' : ''}">${reais(Math.abs(r.saldo))}</div>
      <div class="duo">
        <div><div class="r"><span class="ponto entrada"></span>Entrou</div><div class="v">${reais(r.receitas)}</div></div>
        <div><div class="r"><span class="ponto saida"></span>Saiu</div><div class="v">${reais(r.despesas)}</div></div>
      </div>
    </section>

    ${dicas.length ? `<section class="cartao dicas" aria-label="Como está o mês">${dicas.map(([ic, t]) => `<div class="dica">${icone(ic)}<div>${t}</div></div>`).join('')}</section>` : ''}

    ${pendentesAtivos().length ? `<a class="cartao aviso-plano aviso-caixa" href="#/caixa"><b>${pendentesAtivos().length} lançamento${pendentesAtivos().length > 1 ? 's' : ''} a confirmar</b><span class="sub">Lidos das notificações do banco. Toque para conferir.</span></a>` : ''}
    ${comp ? `<a class="cartao aviso-plano aviso-caixa" href="#/casal?m=${mes}"><b>${reais(comp)} compartilhados com o casal</b><span class="sub">Dos seus gastos do mês, estes aparecem também para ${esc(nomePessoa(dados().pessoas.find((p) => p.id !== eu())?.id))}. Veja o acerto na aba Casal.</span></a>` : ''}
    ${tickets.length ? `<section class="cartao tickets"><h2><span>Tickets do mês</span></h2>${tickets.map((t) => `<div class="ticket-linha"><b>${esc(t.nome)}</b>
        <span class="sub">entrou ${reais(t.recebido)} · gasto ${reais(t.gasto)}</span>
        <span class="ticket-saldo ${t.saldo < 0 ? 'neg' : ''}">${t.saldo < 0 ? 'passou ' + reais(-t.saldo) : 'sobra ' + reais(t.saldo)}</span></div>`).join('')}
        <p class="sub">Conta o crédito do benefício lançado como entrada (Ticket Alimentação ou Ticket Refeição) e os gastos pagos com ele.</p></section>` : ''}
    ${nPend ? `<a class="cartao aviso-classificar" href="#/extrato?m=${mes}&pend=1"><b>${nPend} lançamento${nPend > 1 ? 's' : ''} a classificar</b><span class="sub">O app não reconheceu a conta. Toque para classificar: o que você classificar sai da lista, e o app aprende.</span></a>` : ''}
    ${sug.total ? `<a class="cartao aviso-plano" href="#/plano"><b>${sug.total} sugest${sug.total > 1 ? 'ões' : 'ão'} para o seu plano de contas</b><span class="sub">Contas novas, gastos para classificar e contas fixas que o app encontrou.</span></a>` : ''}

    <section class="cartao">
      <h2><span>Para onde foi o dinheiro</span></h2>
      ${cats.length ? `<div class="chips" role="group" aria-label="Agrupar por" style="margin-bottom:10px">
        <button type="button" class="chip" data-visao="grupos" aria-pressed="${visao === 'grupos'}">Por grupo</button>
        <button type="button" class="chip" data-visao="contas" aria-pressed="${visao === 'contas'}">Por conta</button></div>
        <ul class="barras">${linhas.map((c) => `<li><button type="button" data-cat="${esc(c.id)}" aria-label="${esc(c.nome)}: ${reais(c.total)}, ${Math.round(c.total / r.despesas * 100)}% dos gastos. Ver no extrato.">
          <div class="topo"><span class="nome">${esc(c.nome)}${c.detalhe ? `<small>${esc(c.detalhe)}</small>` : ''}</span><b>${reais(c.total)}<span class="pct">${Math.round(c.total / r.despesas * 100)}%</span></b></div>
          <div class="trilho"><i style="width:${(c.total / maiorLinha * 100).toFixed(1)}%"></i></div></button></li>`).join('')}</ul>`
        : '<p class="sub">Nenhum gasto neste mês.</p>'}
    </section>

    <section class="cartao">
      <h2>Últimos 6 meses</h2>
      <div class="legenda" aria-hidden="true"><span><i class="ponto entrada"></i>Entrou</span><span><i class="ponto saida"></i>Saiu</span></div>
      <div class="grafico">${grafico(hist, mes)}</div>
      <details class="tabela"><summary>Ver em tabela</summary>
        <table><thead><tr><th>Mês</th><th>Entrou</th><th>Saiu</th><th>Sobrou</th></tr></thead>
        <tbody>${hist.map((h) => `<tr><td>${nomeMesCurto(h.mes)}/${h.mes.slice(2, 4)}</td><td>${reais(h.receitas)}</td><td>${reais(h.despesas)}</td><td>${reais(h.receitas - h.despesas)}</td></tr>`).join('')}</tbody></table>
      </details>
    </section>`;

  main.querySelectorAll('[data-visao]').forEach((b) => (b.onclick = () => {
    visao = b.dataset.visao;
    try { localStorage.setItem('fin-visao', visao); } catch {}
    render((main.innerHTML = '', main), { m: mes });
  }));
  main.querySelectorAll('[data-cat]').forEach((b) => (b.onclick = () => { location.hash = `#/extrato?m=${mes}&cat=${encodeURIComponent(b.dataset.cat)}`; }));
  ligarDica(main.querySelector('.grafico'), hist);
}

/** Barras agrupadas (entrou × saiu) num único eixo em reais. */
function grafico(hist, mesSel) {
  const W = 340, H = 180, esq = 44, dir = 4, topo = 8, baixo = 22;
  const max = Math.max(1, ...hist.flatMap((h) => [h.receitas, h.despesas]));
  const passo = escalaBonita(max);
  const teto = Math.ceil(max / passo) * passo;
  const y = (v) => topo + (H - topo - baixo) * (1 - v / teto);
  const col = (W - esq - dir) / hist.length;
  const bw = Math.min(16, (col - 14) / 2);
  const barra = (x, v, cls) => {
    if (!v) return '';
    const h = Math.max(2, y(0) - y(v)), r = Math.min(4, h / 2), top = y(0) - h;
    return `<path class="${cls}" d="M${x},${y(0)}V${top + r}q0,-${r} ${r},-${r}h${bw - 2 * r}q${r},0 ${r},${r}V${y(0)}z"/>`;
  };
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Entradas e saídas dos últimos 6 meses. Veja a tabela abaixo para os valores.">`;
  for (let v = 0; v <= teto; v += passo) s += `<line class="${v ? 'grade' : 'base'}" x1="${esq}" x2="${W - dir}" y1="${y(v)}" y2="${y(v)}"/><text class="eixo" x="${esq - 6}" y="${y(v) + 4}" text-anchor="end">${v ? reaisCurto(v).replace('R$ ', '') : '0'}</text>`;
  hist.forEach((h, i) => {
    const cx = esq + col * i + col / 2;
    s += barra(cx - bw - 1, h.receitas, 'b-entrada') + barra(cx + 1, h.despesas, 'b-saida');
    s += `<text class="eixo" x="${cx}" y="${H - 6}" text-anchor="middle" ${h.mes === mesSel ? 'font-weight="700"' : ''}>${nomeMesCurto(h.mes)}</text>`;
    s += `<rect class="alvo" data-i="${i}" x="${esq + col * i}" y="${topo}" width="${col}" height="${H - topo - baixo}" rx="6"/>`;
  });
  return s + '</svg>';
}

function escalaBonita(max) {
  const bruto = max / 4;
  const p = 10 ** Math.floor(Math.log10(bruto));
  return [1, 2, 2.5, 5, 10].map((k) => k * p).find((k) => k >= bruto);
}

function ligarDica(box, hist) {
  const tip = document.createElement('div');
  tip.className = 'dica-flutuante'; tip.hidden = true;
  box.append(tip);
  const svg = box.querySelector('svg');
  const mostrar = (alvo) => {
    box.querySelectorAll('.alvo.ativo').forEach((a) => a.classList.remove('ativo'));
    alvo.classList.add('ativo');
    const h = hist[+alvo.dataset.i];
    tip.innerHTML = `<b>${nomeMes(h.mes)}</b><div><span><i class="ponto entrada"></i>Entrou</span>${reais(h.receitas)}</div><div><span><i class="ponto saida"></i>Saiu</span>${reais(h.despesas)}</div><div><span>Sobrou</span>${reais(h.receitas - h.despesas)}</div>`;
    tip.hidden = false;
    const ra = alvo.getBoundingClientRect(), rb = box.getBoundingClientRect();
    const x = Math.min(Math.max(ra.left - rb.left + ra.width / 2, 85), rb.width - 85);
    tip.style.left = x + 'px';
    tip.style.top = '-8px';
  };
  svg.addEventListener('pointerover', (ev) => { if (ev.target.classList.contains('alvo')) mostrar(ev.target); });
  svg.addEventListener('pointerdown', (ev) => { if (ev.target.classList.contains('alvo')) mostrar(ev.target); });
  svg.addEventListener('pointerleave', () => { tip.hidden = true; box.querySelectorAll('.alvo.ativo').forEach((a) => a.classList.remove('ativo')); });
}
