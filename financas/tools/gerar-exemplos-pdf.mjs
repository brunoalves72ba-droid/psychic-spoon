// Gera os PDFs de exemplo de tests/exemplos/ (extratos fictícios em formatos comuns de banco).
// Uso: node tools/gerar-exemplos-pdf.mjs   (precisa do Playwright; o PDF com senha usa o pikepdf do Python)
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const dir = fileURLToPath(new URL('../tests/exemplos/', import.meta.url));

const css = `body{font:10pt Arial,sans-serif;margin:28px;color:#111} h1{font-size:14pt;margin:0 0 6px} p{margin:2px 0}
table{border-collapse:collapse;width:100%;margin-top:12px} th,td{padding:4px 6px;text-align:left;border-bottom:1px solid #ddd} .n{text-align:right;white-space:nowrap}
.dia{margin-top:14px;font-weight:bold} .linha{display:flex;justify-content:space-between;padding:3px 0} .sub{color:#555;font-size:9pt}`;
const tabela = (cab, linhas, num) => `<table><tr>${cab.map((c, i) => `<th class="${num.includes(i) ? 'n' : ''}">${c}</th>`).join('')}</tr>${linhas.map((l) => `<tr>${l.map((c, i) => `<td class="${num.includes(i) ? 'n' : ''}">${c}</td>`).join('')}</tr>`).join('')}</table>`;

const EXEMPLOS = {
  // Itaú, BB, Santander: data em cada linha, coluna Valor com sinal e coluna Saldo
  'extrato-colunas.pdf': `<h1>Extrato de conta corrente</h1><p>Agência 0000 · Conta 00000-0</p><p>Período: 01/10/2026 a 31/10/2026</p>` + tabela(['Data', 'Lançamento', 'Valor (R$)', 'Saldo (R$)'], [
    ['30/09/2026', 'SALDO ANTERIOR', '', '1.000,00'],
    ['01/10/2026', 'PIX ENVIADO JOAO SILVA', '-150,00', '850,00'],
    ['02/10/2026', 'SALARIO EMPRESA X', '5.000,00', ''],
    ['03/10/2026', 'PAG BOLETO CONDOMINIO', '-890,50', '4.959,50'],
    ['05/10/2026', 'IFOOD *RESTAURANTE', '-62,90', '4.896,60'],
    ['31/10/2026', 'SALDO DO DIA', '', '4.896,60'],
  ], [2, 3]),
  // Bradesco: colunas Crédito e Débito, data só na primeira linha do dia, descrição em duas linhas
  'extrato-credito-debito.pdf': `<h1>Extrato mensal</h1><p>Movimentação de 01/10/2026 a 31/10/2026</p>` + tabela(['Data', 'Histórico', 'Docto.', 'Crédito (R$)', 'Débito (R$)', 'Saldo (R$)'], [
    ['05/10/2026', 'TRANSFERENCIA PIX<br><span class="sub">DES: MARIA SOUZA 05/10</span>', '1234567', '', '200,00', ''],
    ['', 'RECEBIMENTO PIX', '7654321', '1.200,00', '', '3.000,00'],
    ['06/10/2026', 'TARIFA BANCARIA', '', '', '29,90', '2.970,10'],
  ], [3, 4, 5]),
  // Nubank: cabeçalho de dia com "Total de entradas/saídas" e nome na linha de baixo
  'extrato-nubank.pdf': `<h1>Extrato</h1><p>01 OUT 2026 a 31 OUT 2026</p>` +
    `<div class="dia linha"><span>01 OUT 2026</span><span>Total de entradas</span><span>+ 3.000,00</span></div>` +
    `<div class="linha"><span>Transferência recebida pelo Pix</span><span>3.000,00</span></div><div class="sub">EMPRESA X LTDA - 12.345.678/0001-90</div>` +
    `<div class="linha"><span></span><span>Total de saídas</span><span>- 95,40</span></div>` +
    `<div class="linha"><span>Compra no débito PADARIA PAO BOM</span><span>95,40</span></div>` +
    `<div class="dia linha"><span>02 OUT 2026</span><span>Total de saídas</span><span>- 50,00</span></div>` +
    `<div class="linha"><span>Transferência enviada pelo Pix</span><span>50,00</span></div><div class="sub">JOSE DA SILVA - •••.123.456-••</div>` +
    `<p style="margin-top:16px">Saldo final do período R$ 2.854,60</p>`,
  // fatura de cartão: dd/mm sem ano, virada de ano, compra em dólar
  'fatura-cartao.pdf': `<h1>Fatura do cartão de crédito</h1><p>Vencimento: 10/01/2027</p><p>Total da fatura: R$ 1.371,00</p>` + tabela(['Data', 'Descrição', 'US$', 'R$'], [
    ['15/12', 'MERCADO LIVRE 3/6', '', '120,00'],
    ['28/12', 'NETFLIX.COM', 'US$ 10,00', '55,00'],
    ['02/01', 'PAGAMENTO RECEBIDO', '', '-980,00'],
    ['03/01', 'POSTO SHELL', '', '216,00'],
  ], [2, 3]),
};

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [nome, corpo] of Object.entries(EXEMPLOS)) {
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>${css}</style>${corpo}`);
  await page.pdf({ path: dir + nome, format: 'A4', printBackground: true });
  console.log('gerado', nome);
}
// "escaneado": só uma imagem, sem texto
await page.setContent(`<!doctype html><meta charset="utf-8"><canvas id="c" width="600" height="200"></canvas><script>const x=document.getElementById('c').getContext('2d');x.font='24px Arial';x.fillText('01/10/2026  PIX ENVIADO  -150,00',20,80);</script>`);
const png = await page.locator('#c').screenshot();
await page.setContent(`<!doctype html><img src="data:image/png;base64,${png.toString('base64')}">`);
await page.pdf({ path: dir + 'extrato-imagem.pdf', format: 'A4' });
console.log('gerado extrato-imagem.pdf');
await browser.close();
// com senha (1234): a mesma fatura, cifrada
execFileSync('python3', ['-c', `import pikepdf; p=pikepdf.open(${JSON.stringify(dir + 'fatura-cartao.pdf')}); p.save(${JSON.stringify(dir + 'fatura-com-senha.pdf')}, encryption=pikepdf.Encryption(user='1234', owner='dono-1234', R=6))`]);
console.log('gerado fatura-com-senha.pdf (senha 1234)');
