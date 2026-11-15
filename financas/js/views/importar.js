// Importar extrato do banco ou fatura do cartão (OFX, CSV ou PDF), com prévia antes de gravar.
import { dados, importarItens, apagarLancamentos } from '../core/store.js';
import { decodificar, lerExtrato, lerPDF, prepararImportacao, chaveDescricao, sugerirCategoria, idImportacao } from '../core/importar.js';
import { reais } from '../core/dinheiro.js';
import { esc, aviso, navegar } from '../core/ui.js';
import { opcoesAgrupadas } from './plano.js';

export const titulo = 'Importar extrato';

const BANCOS = [
  ['Nubank', 'Conta: no app, toque no saldo › ícone de compartilhar (ou “Pedir extrato”) e escolha o período; chega por e-mail em CSV ou OFX. Cartão: em “Faturas”, abra a fatura › “Exportar fatura” (CSV).'],
  ['Itaú', 'No internet banking (navegador): Extrato › escolha o período › “Salvar como” OFX ou Excel/CSV.'],
  ['Bradesco', 'Internet banking: Saldos e Extratos › Extrato › período › “Exportar” em OFX ou CSV.'],
  ['Banco do Brasil', 'Internet banking: Conta corrente › Extrato › período › “Exportar/Salvar” em OFX ou CSV.'],
  ['Caixa', 'Internet banking: Extrato › período › “Exportar” (OFX).'],
  ['Santander', 'Internet banking: Conta corrente › Extrato › período › “Exportar” OFX ou Excel (salve como CSV).'],
  ['Inter', 'App: Extrato › ícone de download › escolha o período e o formato OFX ou CSV.'],
  ['C6, PicPay, Mercado Pago e outros', 'Procure por “Extrato” › “Exportar” ou “Baixar”. Se só houver PDF, pode usar o PDF mesmo.'],
  ['Só tenho o PDF', 'Funciona com o PDF que o app ou o site do banco gera (extrato da conta ou fatura do cartão). Se ele tiver senha, o app pede. Foto ou PDF escaneado não dá: não há texto para ler. Como cada banco monta o PDF de um jeito, confira datas, valores e se é entrada ou saída antes de importar; OFX e CSV são mais exatos.'],
];

export function render(main) {
  main.innerHTML = `<h1>Importar extrato</h1>
    <section class="cartao">
      <p>Traga os lançamentos do banco ou do cartão sem digitar nada. Baixe o extrato no app ou site do seu banco em <b>OFX</b>, <b>CSV</b> ou <b>PDF</b> e escolha o arquivo aqui.</p>
      <p class="sub">O arquivo é lido só neste aparelho; nada é enviado para lugar nenhum. Antes de gravar você vê tudo, ajusta as categorias e desmarca o que não quiser.</p>
      <label class="btn primario cheio" style="cursor:pointer">Escolher arquivo
        <input type="file" id="arq" accept=".ofx,.qfx,.csv,.txt,.pdf,text/csv,application/x-ofx,application/pdf" class="oculto"></label>
      <div id="pdf-estado" aria-live="polite"></div>
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
      const bytes = await arq.arrayBuffer();
      const { ehPDF } = await import('../core/pdf.js');
      if (ehPDF(bytes, arq.name)) { await abrirPDF(main, bytes, arq.name); ev.target.value = ''; return; }
      const texto = decodificar(bytes);
      const lido = lerExtrato(texto, arq.name);
      previa(main, lido, arq.name);
    } catch (err) {
      aviso(err.message || 'Não consegui ler esse arquivo.', null, 8000);
      ev.target.value = '';
    }
  });
}

/** Lê o PDF no aparelho; se tiver senha, pede e tenta de novo. */
async function abrirPDF(main, bytes, nome, senha) {
  const estado = main.querySelector('#pdf-estado');
  estado.innerHTML = '<p class="sub" style="margin-top:10px">Lendo o PDF…</p>';
  try {
    const { linhasDoPDF } = await import('../core/pdf.js');
    const lido = lerPDF(await linhasDoPDF(bytes, senha));
    previa(main, { formato: 'PDF', ...lido }, nome);
  } catch (err) {
    if (err && err.name === 'SenhaPDF') {
      estado.innerHTML = `<form id="form-senha" class="senha-pdf" style="margin-top:12px">
        <label for="senha-pdf"><b>${esc(nome)}</b> tem senha.${err.errada ? ' <span class="erro">Senha incorreta.</span>' : ''}</label>
        <p class="sub">A senha costuma vir no e-mail ou no app do banco (muitas vezes, os primeiros dígitos do CPF). Ela é usada só para abrir o arquivo e não fica guardada.</p>
        <div class="btn-linha"><input id="senha-pdf" type="password" autocomplete="off" inputmode="text" required style="flex:1;min-width:0">
        <button class="btn primario" type="submit">Abrir</button></div></form>`;
      const campo = estado.querySelector('#senha-pdf'); campo.focus();
      estado.querySelector('#form-senha').onsubmit = (e) => { e.preventDefault(); abrirPDF(main, bytes, nome, campo.value); };
      return;
    }
    estado.innerHTML = '';
    aviso(err.message || 'Não consegui ler esse PDF.', null, 9000);
  }
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

function previa(main, { formato, itens: brutos, cartao, duvidas = 0 }, nome) {
  const e = dados();
  const itens = prepararImportacao(brutos, e).sort((a, b) => b.data.localeCompare(a.data));
  const datas = itens.map((i) => i.data).sort();
  const br = (d) => d.split('-').reverse().join('/');
  // o que o app não reconheceu fica pendente (amarelo); o que ele identificou sai da frente
  const pendente = (it) => !it.jaImportado && it.marcado && !it.chave && it.reconhecido?.fonte === 'padrao';
  let filtro = itens.some(pendente) ? 'pendentes' : 'identificados';

  main.innerHTML = `<h1>Conferir importação</h1>
    <section class="cartao">
      <p><b>${esc(nome)}</b> <span class="etq">${formato}${cartao ? ' · cartão' : ''}</span></p>
      <p class="sub">${itens.length} lançamento${itens.length > 1 ? 's' : ''} de ${br(datas[0])} a ${br(datas[datas.length - 1])}.</p>
      <div id="avisos-imp"></div>
    </section>
    <div class="chips" role="group" aria-label="Mostrar" style="margin-bottom:10px">
      <button type="button" class="chip" data-f="pendentes"></button>
      <button type="button" class="chip" data-f="identificados"></button>
      <button type="button" class="chip" data-f="fora"></button>
      <button type="button" class="chip" data-f="todos">Todos</button>
    </div>
    <p class="sub resumo-ident" id="resumo-ident"></p>
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
    formato === 'PDF' && `<p class="aviso-pdf"><b>Lido de um PDF.</b> Cada banco monta o PDF de um jeito: confira datas, valores e se é entrada ou saída. ${duvidas ? `<b>${duvidas}</b> ${duvidas > 1 ? 'vieram' : 'veio'} sem indicação clara de entrada ou saída (marcados com “confira”). ` : ''}Para trocar o lado de um lançamento, toque em “trocar entrada/saída”.</p>`,
  ].filter(Boolean).join('');

  const opcoes = (tipo, sel) => opcoesAgrupadas(e, tipo, sel);
  const porque = (it) => {
    if (it.chave) return 'escolhida por você';
    const r = it.reconhecido;
    if (!r) return '';
    return { regra: 'você ensinou', historico: 'como da última vez', nome: 'pelo nome da conta', palavra: `reconhecida por “${r.palavra}”`, padrao: 'a classificar: escolha a conta' }[r.fonte] || '';
  };
  const motivo = (it) => it.jaImportado ? 'Já importado'
    : it.manual ? `Parece “${esc(it.manual.descricao || 'lançamento')}” de ${br(it.manual.data)}`
    : it.transferencia ? 'Fatura, estorno ou transferência' : '';

  const pintar = () => {
    const nPend = itens.filter(pendente).length, nIdent = itens.filter((it) => it.marcado && !pendente(it)).length, nFora = itens.filter((it) => !it.marcado).length;
    const rot = { pendentes: `A classificar (${nPend})`, identificados: `Identificados (${nIdent})`, fora: `Ficam de fora (${nFora})` };
    main.querySelectorAll('[data-f]').forEach((b) => { b.setAttribute('aria-pressed', String(b.dataset.f === filtro)); if (rot[b.dataset.f]) b.textContent = rot[b.dataset.f]; });
    const vis = itens.map((it, i) => [it, i]).filter(([it]) => filtro === 'todos' || (filtro === 'pendentes' ? pendente(it) : filtro === 'identificados' ? it.marcado && !pendente(it) : !it.marcado));
    const vazio = filtro === 'pendentes'
      ? `<li class="vazio ok-tudo">✓ Nada a classificar.${nIdent ? ` Os ${nIdent} lançamentos foram identificados e vão entrar como estão.` : ''}</li>`
      : '<li class="vazio">Nada aqui.</li>';
    $('#resumo-ident').innerHTML = filtro === 'pendentes' && nPend && nIdent ? `✓ <b>${nIdent}</b> identificado${nIdent > 1 ? 's' : ''} automaticamente: ${nIdent > 1 ? 'vão' : 'vai'} entrar como ${nIdent > 1 ? 'estão' : 'está'}. <button type="button" class="link-btn" data-f2="identificados">Ver</button>` : '';
    $('#itens').innerHTML = vis.length ? vis.map(([it, i]) => `<li class="imp ${it.marcado ? '' : 'fora'} ${pendente(it) ? 'a-classificar' : ''}">
      <label class="imp-sel"><input type="checkbox" data-i="${i}" ${it.marcado ? 'checked' : ''} ${it.jaImportado ? 'disabled' : ''} aria-label="Importar ${esc(it.descricao)} de ${reais(it.valor)}"></label>
      <div class="imp-txt">
        <div class="imp-l1"><span class="t1">${esc(it.descricao || '(sem descrição)')}</span><span class="val ${it.tipo}">${it.tipo === 'receita' ? '+ ' : '− '}${reais(it.valor)}</span></div>
        <div class="t2">${br(it.data)}${motivo(it) ? ` · <span class="etq">${motivo(it)}</span>` : ''}${it.duvida ? ' · <span class="etq confira">confira: entrada ou saída?</span>' : ''}${formato === 'PDF' && !it.jaImportado ? ` · <button type="button" class="link-btn" data-inv="${i}">trocar entrada/saída</button>` : ''}</div>
        <label class="imp-conta"><span>Conta <small class="muted">${esc(porque(it))}</small></span>
          <select data-cat="${i}" aria-label="Conta de ${esc(it.descricao)}" ${it.jaImportado ? 'disabled' : ''}>${opcoes(it.tipo, it.categoria)}</select></label>
      </div></li>`).join('') : vazio;
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
      for (const o of itens) if (o !== it && !o.chave && !o.jaImportado && o.tipo === it.tipo && chaveDescricao(o.descricao) === it.chave) { o.categoria = t.value; o.chave = it.chave; n++; }
      if (n) aviso(`Mudei também ${n} outro${n > 1 ? 's' : ''} com a mesma descrição.`);
      // classificado: sai da lista de pendentes (com um instante para ver que deu certo)
      if (filtro === 'pendentes') { t.closest('li').classList.add('resolvido'); setTimeout(pintar, 600); } else pintar();
    }
  });
  // PDF: trocar entrada ⇄ saída de um lançamento (o sinal nem sempre vem claro no PDF)
  $('#itens').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-inv]');
    if (!b) return;
    const it = itens[+b.dataset.inv];
    it.tipo = it.tipo === 'despesa' ? 'receita' : 'despesa';
    const comSinal = it.tipo === 'despesa' ? -it.valor : it.valor;
    it.importId = idImportacao({ data: it.data, valor: comSinal, descricao: it.descricao, idBanco: it.idBanco });
    it.categoria = sugerirCategoria({ descricao: it.descricao, valor: comSinal }, e);
    delete it.duvida; delete it.chave;
    pintar();
  });
  $('#cancelar').onclick = () => render(main);
  main.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { filtro = b.dataset.f; pintar(); }));
  $('#resumo-ident').addEventListener('click', (ev) => { if (ev.target.closest('[data-f2]')) { filtro = 'identificados'; pintar(); } });
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
