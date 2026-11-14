// Resumo do mês: quanto entrou, quanto saiu, para onde foi e como está o ritmo.
import { dados, nomeCategoria } from '../core/store.js';
import { doMes, resumo, porCategoria, historico, previsao, orcamentos } from '../core/calc.js';
import { reais, reaisCurto } from '../core/dinheiro.js';
import { mesAtual, somarMeses, nomeMes, nomeMesCurto } from '../core/datas.js';
import { esc, navMes, icone } from '../core/ui.js';

export const titulo = 'Resumo';

export function render(main, { m }) {
  const mes = /^\d{4}-\d{2}$/.test(m || '') && m <= mesAtual() ? m : mesAtual();
  const e = dados();
  const lancs = doMes(e, mes);
  const r = resumo(lancs);
  const ant = resumo(doMes(e, somarMeses(mes, -1)));
  const cats = porCategoria(lancs);
  const prev = previsao(e, mes);
  const orc = orcamentos(e, mes).filter((o) => o.status !== 'ok');

  if (!e.lancamentos.length) {
    main.innerHTML = `${navMes('#/resumo', mes)}
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

  const maior = cats[0]?.total || 1;
  const hist = historico(e, mes, 6);

  main.innerHTML = `${navMes('#/resumo', mes)}
    <section class="cartao saldo" aria-label="Saldo do mês">
      <div class="rotulo">${r.saldo >= 0 ? 'Sobrou' : 'Faltou'} ${prev ? 'até agora' : 'no mês'}</div>
      <div class="valor ${r.saldo < 0 ? 'neg' : ''}">${reais(Math.abs(r.saldo))}</div>
      <div class="duo">
        <div><div class="r"><span class="ponto entrada"></span>Entrou</div><div class="v">${reais(r.receitas)}</div></div>
        <div><div class="r"><span class="ponto saida"></span>Saiu</div><div class="v">${reais(r.despesas)}</div></div>
      </div>
    </section>

    ${dicas.length ? `<section class="cartao dicas" aria-label="Como está o mês">${dicas.map(([ic, t]) => `<div class="dica">${icone(ic)}<div>${t}</div></div>`).join('')}</section>` : ''}

    <section class="cartao">
      <h2><span>Para onde foi o dinheiro</span><span class="sub">${cats.length ? `${cats.length} categoria${cats.length > 1 ? 's' : ''}` : ''}</span></h2>
      ${cats.length ? `<ul class="barras">${cats.map((c) => `<li><button type="button" data-cat="${esc(c.categoria)}" aria-label="${esc(nomeCategoria(c.categoria))}: ${reais(c.total)}, ${Math.round(c.total / r.despesas * 100)}% dos gastos. Ver no extrato.">
          <div class="topo"><span class="nome">${esc(nomeCategoria(c.categoria))}</span><b>${reais(c.total)}<span class="pct">${Math.round(c.total / r.despesas * 100)}%</span></b></div>
          <div class="trilho"><i style="width:${(c.total / maior * 100).toFixed(1)}%"></i></div></button></li>`).join('')}</ul>`
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
