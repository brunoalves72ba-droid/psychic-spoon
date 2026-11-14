// Leitura de extratos de banco e faturas de cartão (OFX e CSV) — tudo no aparelho, nada sai dele.
// Saída comum: [{ data: 'AAAA-MM-DD', valor: centavos com sinal (negativo = saiu), descricao, idBanco? }]
import { lerValor } from './dinheiro.js';

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

// ---------- categorias automáticas ----------
const REGRAS = [
  [/ifood|rappi|restaurante|lanchonete|padaria|pizza|burger|mcdonald|\bbk\b|subway|cafe|\bbar\b|churrasc|delivery|ze delivery/, 'restaurante'],
  [/uber|\b99 ?(app|pop|taxi)\b|\b99\b|cabify|posto|combust|shell|ipiranga|petrobras|br mania|estacion|pedagio|sem parar|conectcar|veloe|metro|onibus|bilhete unico|recarga.*transporte/, 'transporte'],
  [/supermerc|mercado|atacad|assai|carrefour|pao de acucar|\bextra\b|\bbig\b|hortifruti|sacolao|acougue|mambo|zaffari|condor|savegnago/, 'mercado'],
  [/farmac|drogaria|droga ?raia|drogasil|pague menos|panvel|hospital|clinica|laborat|odonto|unimed|amil|hapvida|sulamerica|bradesco saude|medic/, 'saude'],
  [/netflix|spotify|amazon prime|prime video|disney|hbo|hbo ?max|globoplay|youtube|apple\.com|icloud|google (one|storage)|deezer|paramount|crunchyroll|chatgpt|openai|claude/, 'assinaturas'],
  [/enel|\blight\b|cemig|copel|celesc|coelba|neoenergia|energisa|equatorial|cpfl|sabesp|cedae|copasa|sanepar|embasa|compesa|caesb|comgas|naturgy|claro|vivo|\btim\b|\boi\b|\bnet\b|\bsky\b|internet|telefon|conta de (luz|agua|gas)/, 'contas'],
  [/aluguel|condominio|iptu|imobiliaria|quintoandar|quinto andar/, 'casa'],
  [/escola|faculdade|universidade|curso|udemy|alura|livraria|mensalidade/, 'educacao'],
  [/cinema|ingresso|\bshow\b|teatro|steam|playstation|xbox|nintendo|viagem|hotel|airbnb|booking|decolar|latam|\bgol\b|\bazul\b/, 'lazer'],
  [/amazon|mercado ?livre|mercadolivre|magalu|magazine|shopee|shein|aliexpress|americanas|casas bahia|renner|riachuelo|c&a|zara|centauro|netshoes|kabum/, 'compras'],
];
const REGRAS_RECEITA = [
  [/salario|folha|pagamento de salario|proventos|vencimentos/, 'salario'],
];
/** Movimentos que normalmente NÃO são gasto nem renda (vêm desmarcados). */
export const PARECE_TRANSFERENCIA = /pagamento (de )?fatura|pgto fatura|fatura do cartao|pagamento recebido|aplicacao|resgate|rdb|cdb|poupanca|transferencia entre contas|mesma titularidade|estorno/;

export const chaveDescricao = (s) => norm(s).replace(/\d+/g, '').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Sugere a categoria: primeiro o que você já usou para uma descrição igual,
 * depois palavras conhecidas (iFood → Restaurante, Uber → Transporte…).
 */
export function sugerirCategoria(item, estado) {
  const tipo = item.valor < 0 ? 'despesa' : 'receita';
  const existe = (id) => estado.categorias.some((c) => c.id === id && c.tipo === tipo);
  const chave = chaveDescricao(item.descricao);
  if (chave) {
    const aprendida = estado.regras?.[tipo + ':' + chave];
    if (aprendida && existe(aprendida)) return aprendida;
    for (let i = estado.lancamentos.length - 1; i >= 0; i--) {
      const l = estado.lancamentos[i];
      if (l.tipo === tipo && l.descricao && chaveDescricao(l.descricao) === chave && existe(l.categoria)) return l.categoria;
    }
  }
  const d = ' ' + norm(item.descricao) + ' ';
  for (const [re, cat] of tipo === 'despesa' ? REGRAS : REGRAS_RECEITA) if (re.test(d) && existe(cat)) return cat;
  const padrao = tipo === 'despesa' ? 'outros' : 'outras-receitas';
  return existe(padrao) ? padrao : estado.categorias.find((c) => c.tipo === tipo)?.id || '';
}

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
      categoria: sugerirCategoria(it, estado),
      marcado: !jaImportado && !manual && !transferencia,
    };
  });
}
