// Importar extrato do banco ou fatura do cartão (OFX ou CSV), com prévia antes de gravar.
import { dados, importarItens, apagarLancamentos } from '../core/store.js';
import { decodificar, lerExtrato, prepararImportacao, chaveDescricao } from '../core/importar.js';
import { reais } from '../core/dinheiro.js';
import { esc, aviso, navegar } from '../core/ui.js';

export const titulo = 'Importar extrato';

const BANCOS = [
  ['Nubank', 'Conta: no app, toque no saldo › ícone de compartilhar (ou “Pedir extrato”) e escolha o período; chega por e-mail em CSV ou OFX. Cartão: em “Faturas”, abra a fatura › “Exportar fatura” (CSV).'],
  ['Itaú', 'No internet banking (navegador): Extrato › escolha o período › “Salvar como” OFX ou Excel/CSV.'],
  ['Bradesco', 'Internet banking: Saldos e Extratos › Extrato › período › “Exportar” em OFX ou CSV.'],
  ['Banco do Brasil', 'Internet banking: Conta corrente › Extrato › período › “Exportar/Salvar” em OFX ou CSV.'],
  ['Caixa', 'Internet banking: Extrato › período › “Exportar” (OFX).'],
  ['Santander', 'Internet banking: Conta corrente › Extrato › período › “Exportar” OFX ou Excel (salve como CSV).'],
  ['Inter', 'App: Extrato › ícone de download › escolha o período e o formato OFX ou CSV.'],
  ['C6, PicPay, Mercado Pago e outros', 'Procure por “Extrato” › “Exportar” ou “Baixar”. Se só houver PDF, peça o extrato em OFX ou CSV pelo atendimento ou use o internet banking pelo computador.'],
];

export function render(main) {
  main.innerHTML = `<h1>Importar extrato</h1>
    <section class="cartao">
      <p>Traga os lançamentos do banco ou do cartão sem digitar nada. Baixe o extrato no app ou site do seu banco em <b>OFX</b> ou <b>CSV</b> e escolha o arquivo aqui.</p>
      <p class="sub">O arquivo é lido só neste aparelho; nada é enviado para lugar nenhum. Antes de gravar você vê tudo, ajusta as categorias e desmarca o que não quiser.</p>
      <label class="btn primario cheio" style="cursor:pointer">Escolher arquivo
        <input type="file" id="arq" accept=".ofx,.qfx,.csv,.txt,text/csv,application/x-ofx" class="oculto"></label>
    </section>
    <section class="cartao">
      <h2>Como baixar o extrato</h2>
      ${BANCOS.map(([b, t]) => `<details class="tabela"><summary>${esc(b)}</summary><p class="sub" style="margin-top:6px">${esc(t)}</p></details>`).join('')}
      <p class="sub" style="margin-top:12px">Dica: importe a cada semana ou a cada mês. Pode repetir o mesmo período sem medo: o que já entrou é reconhecido e não é duplicado.</p>
    </section>`;

  main.querySelector('#arq').addEventListener('change', async (ev) => {
    const arq = ev.target.files[0];
    if (!arq) return;
    try {
      const texto = decodificar(await arq.arrayBuffer());
      const lido = lerExtrato(texto, arq.name);
      previa(main, lido, arq.name);
    } catch (err) {
      aviso(err.message || 'Não consegui ler esse arquivo.', null, 8000);
      ev.target.value = '';
    }
  });
}

function formaDePagamento(item, cartao) {
  if (item.tipo !== 'despesa') return '';
  if (cartao) return 'Crédito';
  const d = item.descricao.toLowerCase();
  if (/pix/.test(d)) return 'Pix';
  if (/boleto|pagamento de titulo|pgto titulo/.test(d)) return 'Boleto';
  if (/\bted\b|\bdoc\b|transf/.test(d)) return 'Transferência';
  if (/saque/.test(d)) return 'Dinheiro';
  return 'Débito';
}

function previa(main, { formato, itens: brutos, cartao }, nome) {
  const e = dados();
  const itens = prepararImportacao(brutos, e).sort((a, b) => b.data.localeCompare(a.data));
  const datas = itens.map((i) => i.data).sort();
  const br = (d) => d.split('-').reverse().join('/');
  let filtro = 'todos';

  main.innerHTML = `<h1>Conferir importação</h1>
    <section class="cartao">
      <p><b>${esc(nome)}</b> <span class="etq">${formato}${cartao ? ' · cartão' : ''}</span></p>
      <p class="sub">${itens.length} lançamento${itens.length > 1 ? 's' : ''} de ${br(datas[0])} a ${br(datas[datas.length - 1])}.</p>
      <div id="avisos-imp"></div>
    </section>
    <div class="chips" role="group" aria-label="Mostrar" style="margin-bottom:10px">
      <button type="button" class="chip" data-f="todos">Todos</button>
      <button type="button" class="chip" data-f="marcados">Vão entrar</button>
      <button type="button" class="chip" data-f="fora">Ficam de fora</button>
    </div>
    <ul class="lista" id="itens"></ul>
    <div class="barra-importar"><p class="sub" id="soma"></p>
      <div class="btn-linha"><button class="btn" type="button" id="cancelar">Cancelar</button><button class="btn primario" type="button" id="confirmar"></button></div></div>`;

  const $ = (s) => main.querySelector(s);
  const ja = itens.filter((i) => i.jaImportado).length;
  const man = itens.filter((i) => i.manual).length;
  const tr = itens.filter((i) => i.transferencia && !i.jaImportado).length;
  $('#avisos-imp').innerHTML = [
    ja && `<p><b>${ja}</b> já tinha${ja > 1 ? 'm' : ''} sido importado${ja > 1 ? 's' : ''} antes e não ${ja > 1 ? 'vão' : 'vai'} se repetir.</p>`,
    man && `<p><b>${man}</b> parece${man > 1 ? 'm' : ''} com lançamento${man > 1 ? 's' : ''} que você já anotou à mão; ficaram desmarcados.</p>`,
    tr && `<p><b>${tr}</b> parece${tr > 1 ? 'm' : ''} pagamento de fatura, estorno, aplicação ou transferência entre suas contas (confira antes de marcar); ficaram desmarcados.</p>`,
  ].filter(Boolean).join('');

  const opcoes = (tipo, sel) => e.categorias.filter((c) => c.tipo === tipo).map((c) => `<option value="${esc(c.id)}"${c.id === sel ? ' selected' : ''}>${esc(c.nome)}</option>`).join('');
  const motivo = (it) => it.jaImportado ? 'Já importado'
    : it.manual ? `Parece “${esc(it.manual.descricao || 'lançamento')}” de ${br(it.manual.data)}`
    : it.transferencia ? 'Fatura, estorno ou transferência' : '';

  const pintar = () => {
    main.querySelectorAll('[data-f]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === filtro)));
    const vis = itens.map((it, i) => [it, i]).filter(([it]) => filtro === 'todos' || (filtro === 'marcados') === it.marcado);
    $('#itens').innerHTML = vis.length ? vis.map(([it, i]) => `<li class="imp ${it.marcado ? '' : 'fora'}">
      <label class="imp-sel"><input type="checkbox" data-i="${i}" ${it.marcado ? 'checked' : ''} ${it.jaImportado ? 'disabled' : ''} aria-label="Importar ${esc(it.descricao)} de ${reais(it.valor)}"></label>
      <div class="imp-txt">
        <div class="imp-l1"><span class="t1">${esc(it.descricao || '(sem descrição)')}</span><span class="val ${it.tipo}">${it.tipo === 'receita' ? '+ ' : '− '}${reais(it.valor)}</span></div>
        <div class="imp-l2"><span class="t2">${br(it.data)}${motivo(it) ? ` · <span class="etq">${motivo(it)}</span>` : ''}</span>
          <select data-cat="${i}" aria-label="Categoria de ${esc(it.descricao)}" ${it.jaImportado ? 'disabled' : ''}>${opcoes(it.tipo, it.categoria)}</select></div>
      </div></li>`).join('') : '<li class="vazio">Nada aqui.</li>';
    const marc = itens.filter((it) => it.marcado);
    const s = marc.reduce((a, it) => (it.tipo === 'receita' ? (a.r += it.valor) : (a.d += it.valor), a), { r: 0, d: 0 });
    $('#soma').textContent = `Entradas ${reais(s.r)} · saídas ${reais(s.d)}`;
    $('#confirmar').textContent = marc.length ? `Importar ${marc.length}` : 'Nada marcado';
    $('#confirmar').disabled = !marc.length;
  };

  $('#itens').addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.dataset.i !== undefined) { itens[+t.dataset.i].marcado = t.checked; t.closest('li').classList.toggle('fora', !t.checked); pintar(); }
    if (t.dataset.cat !== undefined) {
      const it = itens[+t.dataset.cat];
      it.categoria = t.value;
      it.chave = chaveDescricao(it.descricao); // o app aprende para as próximas importações
      // aplica a mesma escolha às outras linhas com a mesma descrição
      let n = 0;
      for (const o of itens) if (o !== it && !o.chave && !o.jaImportado && o.tipo === it.tipo && chaveDescricao(o.descricao) === it.chave) { o.categoria = t.value; n++; }
      if (n) { aviso(`Mudei também ${n} outro${n > 1 ? 's' : ''} com a mesma descrição.`); pintar(); }
    }
  });
  $('#cancelar').onclick = () => render(main);
  main.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { filtro = b.dataset.f; pintar(); }));
  $('#confirmar').onclick = () => {
    for (const it of itens) it.pagamento = formaDePagamento(it, cartao);
    const ids = importarItens(itens);
    const n = ids.length;
    aviso(`${n} lançamento${n > 1 ? 's' : ''} importado${n > 1 ? 's' : ''}.`, { rotulo: 'Desfazer', fazer: () => { apagarLancamentos(ids); aviso('Importação desfeita.'); navegar(location.hash); } }, 10000);
    const mes = itens.find((i) => i.marcado)?.data.slice(0, 7);
    navegar(`#/extrato${mes ? `?m=${mes}` : ''}`);
  };
  pintar();
  window.scrollTo(0, 0);
}
