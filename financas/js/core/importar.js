// Leitura de extratos de banco e faturas de cartão (OFX e CSV) — tudo no aparelho, nada sai dele.
// Saída comum: [{ data: 'AAAA-MM-DD', valor: centavos com sinal (negativo = saiu), descricao, idBanco? }]
import { lerValor } from './dinheiro.js';
import { reconhecer, chaveDescricao } from './plano.js';

/** Lê os bytes do arquivo respeitando a codificação (muitos bancos ainda usam Windows-1252). */
export function decodificar(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(u8).replace(/^﻿/, ''); }
  catch { return new TextDecoder('windows-1252').decode(u8); }
}

export function lerExtrato(texto, nomeArquivo = '') {
  const t = texto.trim();
  if (/<OFX>|OFXHEADER|<STMTTRN>/i.test(t) || /\.(ofx|qfx)$/i.test(nomeArquivo)) return { formato: 'OFX', ...lerOFX(t) };
  return { formato: 'CSV', ...lerCSV(t) };
}

// ---------- OFX ----------
export function lerOFX(texto) {
  const itens = [];
  const cartao = /<CREDITCARDMSGSRSV1>|<CCSTMTRS>/i.test(texto);
  for (const bloco of texto.split(/<STMTTRN>/i).slice(1)) {
    const corpo = bloco.split(/<\/STMTTRN>/i)[0];
    const campo = (n) => { const m = corpo.match(new RegExp(`<${n}>([^<\\r\\n]*)`, 'i')); return m ? m[1].trim() : ''; };
    const d = campo('DTPOSTED').match(/^(\d{4})(\d{2})(\d{2})/);
    const v = lerValor(campo('TRNAMT').replace(',', '.'));
    if (!d || v === null || v === 0) continue;
    const descricao = limparTexto(campo('MEMO') || campo('NAME') || campo('TRNTYPE'));
    itens.push({ data: `${d[1]}-${d[2]}-${d[3]}`, valor: v, descricao, idBanco: campo('FITID') || '' });
  }
  if (!itens.length) throw new Error('Não encontrei lançamentos nesse arquivo OFX.');
  return { itens, cartao };
}

// ---------- CSV ----------
const COLS = {
  data: ['data', 'date', 'data lancamento', 'data do lancamento', 'data movimento', 'data da transacao', 'dt lancamento'],
  descricao: ['descricao', 'historico', 'title', 'titulo', 'lancamento', 'estabelecimento', 'description', 'detalhes', 'memo'],
  valor: ['valor', 'amount', 'valor (r$)', 'valor r$', 'valor em r$', 'quantia'],
  entrada: ['entrada', 'entradas', 'credito', 'creditos', 'valor credito'],
  saida: ['saida', 'saidas', 'debito', 'debitos', 'valor debito'],
  id: ['identificador', 'id', 'documento', 'n documento', 'numero documento'],
};
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();

// "Débito (R$)" → "debito"
const normCab = (s) => norm(s).replace(/\(?r\$\)?/g, '').replace(/[.:]/g, '').replace(/\s+/g, ' ').trim();

export function separarCSV(linha, sep) {
  const out = []; let cur = '', aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (aspas) { if (c === '"' && linha[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') aspas = false; else cur += c; }
    else if (c === '"') aspas = true;
    else if (c === sep) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out.map((x) => x.trim());
}

export function lerCSV(texto) {
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim());
  // acha a linha de cabeçalho (alguns bancos põem título e saldo antes)
  let iCab = -1, sep = ',', mapa = null;
  for (let i = 0; i < Math.min(linhas.length, 15) && iCab < 0; i++) {
    for (const s of [';', ',', '\t']) {
      const cols = separarCSV(linhas[i], s).map(normCab);
      const achar = (lista) => cols.findIndex((c) => lista.includes(c));
      const m = { data: achar(COLS.data), descricao: achar(COLS.descricao), valor: achar(COLS.valor), entrada: achar(COLS.entrada), saida: achar(COLS.saida), id: achar(COLS.id) };
      if (m.data >= 0 && (m.valor >= 0 || m.entrada >= 0 || m.saida >= 0)) { iCab = i; sep = s; mapa = m; break; }
    }
  }
  if (iCab < 0) throw new Error('Não reconheci as colunas do CSV. Ele precisa ter pelo menos “Data” e “Valor”.');
  const cab = separarCSV(linhas[iCab], sep).map(normCab);
  // fatura de cartão (ex.: Nubank "date,title,amount"): valor positivo é compra
  const cartao = cab.includes('title') && cab.includes('amount');
  const itens = [];
  for (const l of linhas.slice(iCab + 1)) {
    const c = separarCSV(l, sep);
    const data = lerData(c[mapa.data]);
    if (!data) continue;
    let v = null;
    if (mapa.valor >= 0) v = lerValorCSV(c[mapa.valor], sep);
    else {
      const e = mapa.entrada >= 0 ? lerValorCSV(c[mapa.entrada], sep) : null;
      const s = mapa.saida >= 0 ? lerValorCSV(c[mapa.saida], sep) : null;
      if (e) v = Math.abs(e); else if (s) v = -Math.abs(s);
    }
    if (v === null || v === 0) continue;
    if (cartao) v = -v;
    const descricao = limparTexto(mapa.descricao >= 0 ? c[mapa.descricao] : '');
    if (/^saldo\b/i.test(descricao)) continue; // linhas de saldo não são lançamentos
    itens.push({ data, valor: v, descricao, idBanco: mapa.id >= 0 ? c[mapa.id] || '' : '' });
  }
  if (!itens.length) throw new Error('O CSV não tem lançamentos com data e valor.');
  return { itens, cartao };
}

function lerValorCSV(txt, sep) {
  let s = String(txt ?? '').trim();
  if (!s) return null;
  let neg = /^\(.*\)$/.test(s) || /\s?D$/i.test(s); // (12,00) ou "12,00 D"
  s = s.replace(/[()]/g, '').replace(/\s?[DC]$/i, '');
  // em CSV com vírgula como separador, "12.50" usa ponto decimal
  if (sep === ',' && /^-?\d+\.\d{1,2}$/.test(s.replace(/[R$\s]/g, ''))) s = s.replace('.', ',');
  const v = lerValor(s);
  return v === null ? null : neg ? -Math.abs(v) : v;
}

export function lerData(txt) {
  const s = String(txt || '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) {
    const a = m[3].length === 2 ? '20' + m[3] : m[3];
    const mes = +m[2], dia = +m[1];
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
    return `${a}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }
  return null;
}

const limparTexto = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 80);

// ---------- categorias automáticas (motor em plano.js) ----------
/** Movimentos que normalmente NÃO são gasto nem renda (vêm desmarcados). */
export const PARECE_TRANSFERENCIA = /pagamento (de )?fatura|pgto fatura|fatura do cartao|pagamento recebido|aplicacao|resgate|rdb|cdb|poupanca|transferencia entre contas|mesma titularidade|estorno/;

export { chaveDescricao };

/** Sugere a categoria de um item do extrato (veja reconhecer() em plano.js). */
export const sugerirCategoria = (item, estado) => reconhecer(item.descricao, item.valor < 0 ? 'despesa' : 'receita', estado).categoria;

/** Identificador estável de uma linha do extrato, para não importar a mesma coisa duas vezes. */
export function idImportacao(item) {
  if (item.idBanco) return 'b:' + item.idBanco + ':' + item.data;
  return 'h:' + item.data + ':' + item.valor + ':' + chaveDescricao(item.descricao);
}

/**
 * Prepara a prévia: categoria sugerida, se já foi importado antes, se parece um lançamento
 * que você já anotou à mão (mesmo valor, até 3 dias de diferença) e se parece transferência.
 */
export function prepararImportacao(itens, estado) {
  const importados = new Set(estado.lancamentos.map((l) => l.importId).filter(Boolean));
  const manuais = estado.lancamentos.filter((l) => !l.importId);
  const usados = new Set();
  const vistos = new Map();
  return itens.map((it) => {
    let importId = idImportacao(it);
    // duas compras iguais no mesmo dia são legítimas: numera as repetições dentro do arquivo
    const n = vistos.get(importId) || 0; vistos.set(importId, n + 1);
    if (n) importId += '#' + n;
    const tipo = it.valor < 0 ? 'despesa' : 'receita';
    const valor = Math.abs(it.valor);
    const jaImportado = importados.has(importId);
    const dt = Date.parse(it.data);
    const manual = jaImportado ? null : manuais.find((l) => !usados.has(l.id) && l.tipo === tipo && l.valor === valor
      // contas fixas caem no dia que você escolheu, não no dia em que o banco registrou: vale o mês todo
      && (Math.abs(Date.parse(l.data) - dt) <= 3 * 864e5 || (l.recorrente && l.data.slice(0, 7) === it.data.slice(0, 7))));
    if (manual) usados.add(manual.id);
    const transferencia = PARECE_TRANSFERENCIA.test(' ' + norm(it.descricao) + ' ');
    return {
      ...it, tipo, valor, importId, jaImportado, manual: manual || null, transferencia,
      ...(() => { const r = reconhecer(it.descricao, tipo, estado); return { categoria: r.categoria, reconhecido: r }; })(),
      marcado: !jaImportado && !manual && !transferencia,
    };
  });
}

// ---------- PDF ----------
// Os bancos não seguem um padrão em PDF. A leitura procura, linha a linha, uma data no começo e um valor
// em reais; usa a posição das colunas (Valor, Crédito, Débito, Saldo) quando o cabeçalho aparece; aceita
// a data só na primeira linha do dia e os cabeçalhos de dia com “Total de entradas/saídas” (Nubank);
// e deduz o ano das datas curtas (dd/mm, “15 OUT”) pela data completa mais recente do documento.
// O que fica em dúvida (entrada ou saída) vem marcado na prévia para conferir.
const MESES = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };
const IGNORAR_PDF = /\bsaldo\b|\btotal\b|subtotal|\blimite\b|pagamento minimo|valor minimo|taxa de juros|\bcet\b|vencimento|fechamento|melhor dia|^data\b|pagina \d|\bpag\.? \d/;
const RECEITA_PDF = /receb|credito|deposito|salario|rendimento|estorno|devolu|reembolso|resgate|cashback/;
const ESTRANGEIRA = /(US\$|U\$|USD|EUR|€)\s*$/i;

const iso = (a, m, d) => `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** Junta os pedaços de texto em células (pedaços colados) e monta o texto da linha com a posição de cada letra. */
function montarLinha(l) {
  const celulas = [];
  for (const it of l.itens) {
    const ult = celulas[celulas.length - 1];
    const vao = ult ? it.x - (ult.x + ult.w) : Infinity;
    if (ult && vao < Math.max(1.5, it.h * 0.3)) { ult.t += (vao > it.h * 0.08 ? ' ' : '') + it.t; ult.w = it.x + it.w - ult.x; }
    else celulas.push({ t: it.t, x: it.x, w: it.w });
  }
  let texto = ''; const pos = [];
  for (const c of celulas) {
    if (texto) { texto += '  '; pos.push(null, null); }
    const t = c.t.replace(/\s+/g, ' ');
    for (let k = 0; k < t.length; k++) pos.push(c.x + (c.w * (k + 1)) / Math.max(1, t.length));
    texto += t;
  }
  return { texto, pos, celulas };
}

/** Valores em reais da linha, com sinal (se houver marca), posição da borda direita e trecho ocupado. */
function valoresDaLinha(texto, pos) {
  const out = [];
  for (const m of texto.matchAll(/\d{1,3}(?:\.\d{3})*,\d{2}(?!\d)/g)) {
    const i = m.index, j = i + m[0].length;
    if (i > 0 && /[\d.,]/.test(texto[i - 1])) continue;
    const antes = texto.slice(Math.max(0, i - 8), i), depois = texto.slice(j, j + 3);
    let ini = i, fim = j, sinal = 0;
    if (ESTRANGEIRA.test(antes)) { out.push({ estrangeira: true, ini: i - antes.match(ESTRANGEIRA)[0].length, fim }); continue; }
    let mm;
    if ((mm = antes.match(/([-−+])\s?R\$\s?$|([-−+])$|R\$\s?([-−+])$/))) { sinal = (mm[1] || mm[2] || mm[3]) === '+' ? 1 : -1; ini = i - mm[0].length; }
    else if ((mm = antes.match(/R\$\s?$/))) ini = i - mm[0].length;
    if ((mm = depois.match(/^\s?([-−])(?![\d\w])/))) { sinal = -1; fim = j + mm[0].length; }
    else if ((mm = depois.match(/^\s?([DC])\b/))) { sinal = mm[1] === 'D' ? -1 : 1; fim = j + mm[0].length; }
    const centavos = Math.round(Number(m[0].replace(/\./g, '').replace(',', '.')) * 100);
    out.push({ centavos, sinal, ini, fim, direita: pos[j - 1] ?? 0 });
  }
  return out;
}

/** Data no começo da linha: { dia, mes, ano|null, fim }. */
function dataNoInicio(texto) {
  const t = texto.trimStart(), off = texto.length - t.length;
  let m = t.match(/^(\d{2})[/.-](\d{2})[/.-](\d{4}|\d{2})(?![\d/])/);
  if (m) return valida(+m[1], +m[2], m[3].length === 2 ? 2000 + +m[3] : +m[3], off + m[0].length);
  m = t.match(/^(\d{2})\/(\d{2})(?![\d/])/);
  if (m) return valida(+m[1], +m[2], null, off + m[0].length);
  m = norm(t).match(/^(\d{1,2})\s*(?:de\s+)?(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-z]*\.?(?:\s*(?:de\s+)?(\d{4}))?(?![a-z])/);
  if (m) return valida(+m[1], MESES[m[2]], m[3] ? +m[3] : null, off + m[0].length);
  return null;
}
function valida(dia, mes, ano, fim) { return dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 ? { dia, mes, ano, fim } : null; }

/** Datas completas do documento: a mais recente vira referência para as datas sem ano. */
function dataReferencia(textos, hojeIso) {
  let ref = '';
  for (const t of textos) {
    for (const m of t.matchAll(/(?<!\d)(\d{2})\/(\d{2})\/(\d{4})(?!\d)/g)) { const d = valida(+m[1], +m[2], +m[3], 0); if (d) { const s = iso(d.ano, d.mes, d.dia); if (s > ref) ref = s; } }
    for (const m of norm(t).matchAll(/(?<!\d)(\d{1,2})\s*(?:de\s+)?(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-z]*\.?\s*(?:de\s+)?(\d{4})/g)) { const d = valida(+m[1], MESES[m[2]], +m[3], 0); if (d) { const s = iso(d.ano, d.mes, d.dia); if (s > ref) ref = s; } }
  }
  return ref || hojeIso;
}
function completarAno(d, ref) {
  if (d.ano) return iso(d.ano, d.mes, d.dia);
  const a = +ref.slice(0, 4);
  const s = iso(a, d.mes, d.dia);
  // fatura que vence em janeiro com compras de dezembro: a data passaria da referência
  return Date.parse(s) - Date.parse(ref) > 45 * 864e5 ? iso(a - 1, d.mes, d.dia) : s;
}

/** Cabeçalho de tabela: guarda a borda direita de cada coluna de valor. */
function colunas(celulas) {
  const c = {}; let achou = 0, temData = false;
  for (const cel of celulas) {
    const n = norm(cel.t);
    const tipo = /^saldo/.test(n) ? 'saldo' : /^(credito|creditos|entrada|entradas)\b/.test(n) ? 'credito' : /^(debito|debitos|saida|saidas)\b/.test(n) ? 'debito' : /^(valor|montante|quantia)\b/.test(n) ? 'valor' : null;
    if (/^data\b/.test(n)) temData = true;
    if (tipo && c[tipo] === undefined) { c[tipo] = cel.x + cel.w; achou++; }
  }
  return achou && (temData || achou >= 2) && (c.valor !== undefined || c.credito !== undefined || c.debito !== undefined) ? c : null;
}

/**
 * Extrato ou fatura em PDF → { itens, cartao, duvidas }.
 * `linhas`: [{ pagina, y, h, itens: [{ t, x, w, h }] }] (veja linhasDoPDF em pdf.js).
 */
export function lerPDF(linhas, { hoje: hojeIso = new Date().toISOString().slice(0, 10) } = {}) {
  const montadas = linhas.map((l) => ({ ...montarLinha(l), pagina: l.pagina, y: l.y, h: l.h || 8 }));
  const tudo = norm(montadas.map((l) => l.texto).join(' \n '));
  if (tudo.replace(/\s/g, '').length < 30) throw new Error('Esse PDF parece ser uma imagem (escaneado ou foto): não há texto para ler. Use o PDF gerado pelo app ou site do banco, ou baixe o extrato em OFX ou CSV.');
  const cartao = /fatura/.test(tudo) && /(cartao|vencimento)/.test(tudo) && !/conta corrente|extrato de conta/.test(tudo);
  const ref = dataReferencia(montadas.map((l) => l.texto), hojeIso);
  const itens = [];
  let cols = null, dataAtual = null, secao = 0, ultimo = null, orfa = null, marcaSaida = false, marcaEntrada = false;

  for (const l of montadas) {
    const n = norm(l.texto);
    const valores = valoresDaLinha(l.texto, l.pos);
    const reais = valores.filter((v) => !v.estrangeira && v.centavos > 0);
    const cab = !reais.length && colunas(l.celulas);
    if (cab) { cols = cab; ultimo = null; orfa = null; continue; }
    const d = dataNoInicio(l.texto);
    // Nubank: "01 OUT 2026   Total de entradas   + 1.000,00" abre o dia e diz o sinal do que vem abaixo
    if (/total de entradas/.test(n)) { if (d) dataAtual = completarAno(d, ref); secao = 1; ultimo = null; continue; }
    if (/total de saidas/.test(n)) { if (d) dataAtual = completarAno(d, ref); secao = -1; ultimo = null; continue; }
    if (d && !reais.length && !/[a-z]{3}/i.test(norm(l.texto.slice(d.fim)).replace(/\b(de|seg|ter|qua|qui|sex|sab|dom)\w*\b/g, ''))) { dataAtual = completarAno(d, ref); secao = 0; ultimo = null; continue; }
    if (IGNORAR_PDF.test(n)) { ultimo = null; continue; }
    if (!reais.length) {
      // continuação da descrição (nome de quem recebeu, detalhe do Pix) logo abaixo do lançamento
      if (ultimo && ultimo.pagina === l.pagina && ultimo.y - l.y <= ultimo.h * 2.2 && ultimo.extra < 1 && /[a-z]{2}/i.test(l.texto) && !d) {
        ultimo.item.descricao = limparTexto(ultimo.item.descricao + ' · ' + l.texto); ultimo.extra++; ultimo.y = l.y;
      } else if (!d && /[a-z]{2}/i.test(l.texto)) orfa = { texto: l.texto, pagina: l.pagina, y: l.y };
      continue;
    }
    if (d) dataAtual = completarAno(d, ref);
    if (!dataAtual) continue;

    // qual valor é o lançamento (e não o saldo) e para que lado vai
    let escolhido = null, sinal = 0, fonte = '';
    if (cols) {
      const nomes = Object.keys(cols);
      for (const v of reais) {
        const col = nomes.reduce((a, b) => (Math.abs(cols[b] - v.direita) < Math.abs(cols[a] - v.direita) ? b : a));
        if (col === 'saldo') continue;
        escolhido = v; sinal = col === 'debito' ? -1 : col === 'credito' ? 1 : 0; fonte = sinal ? 'coluna' : '';
        break;
      }
      if (!escolhido) continue;      // só saldo nesta linha
    } else escolhido = reais[0];
    if (!sinal && escolhido.sinal) { sinal = cartao ? -escolhido.sinal : escolhido.sinal; fonte = 'marca'; }
    let descricao = l.texto.slice(d ? d.fim : 0);
    for (const v of [...valores].sort((a, b) => b.ini - a.ini)) descricao = descricao.slice(0, Math.max(0, v.ini - (d ? d.fim : 0))) + ' ' + descricao.slice(Math.max(0, v.fim - (d ? d.fim : 0)));
    descricao = limparTexto(descricao.replace(/\bR\$/g, ' ').replace(/(^|\s)\d{6,}(?=\s|$)/g, ' ').replace(/\s[-−·]\s*$/, ''));
    // descrição em duas linhas com a data e o valor centralizados: o nome ficou na linha de cima
    if (!/[a-z]/i.test(descricao) && orfa && orfa.pagina === l.pagina && orfa.y - l.y <= l.h * 1.8) descricao = limparTexto(orfa.texto);
    orfa = null;
    if (!/[a-z]/i.test(descricao)) continue;
    const nd = norm(descricao);
    let duvida = false;
    if (!sinal && secao) { sinal = secao; fonte = 'secao'; }
    if (!sinal && cartao) sinal = /pagamento|estorno|credito|devolu|reembolso/.test(nd) ? 1 : -1;
    if (!sinal) { sinal = RECEITA_PDF.test(nd) ? 1 : -1; duvida = true; }
    if (fonte === 'marca' && !cartao) { if (escolhido.sinal < 0) marcaSaida = true; else marcaEntrada = true; }
    const item = { data: dataAtual, valor: sinal * escolhido.centavos, descricao, idBanco: '', ...(duvida ? { duvida: true } : {}) };
    itens.push(item);
    ultimo = { item, pagina: l.pagina, y: l.y, h: l.h, extra: 0 };
  }
  // extrato que só marca as saídas (com “−” ou D): o que vem sem marca é entrada
  if (marcaSaida && !marcaEntrada) for (const it of itens) if (it.duvida) { it.valor = Math.abs(it.valor); delete it.duvida; }
  const duvidas = itens.filter((i) => i.duvida).length;
  if (!itens.length) throw new Error('Não encontrei lançamentos com data e valor neste PDF. Se for o extrato de um banco com outro formato, baixe em OFX ou CSV (veja “Como baixar o extrato”).');
  return { itens, cartao, duvidas };
}
