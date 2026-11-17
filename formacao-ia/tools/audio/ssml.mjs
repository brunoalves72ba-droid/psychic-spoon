// Monta a fala de cada aula em SSML: pausas de ~600 ms entre parágrafos, ~1 s antes de títulos e entre
// tópicos, títulos um pouco mais devagar, listas item por item, e marcas (<mark>) no começo de cada passo
// para o app mostrar os capítulos. Também converte para os formatos da Chirp 3 HD e do ElevenLabs.
import { falado } from './falado.mjs';

const PAUSA_PAR = '600ms', PAUSA_TITULO = '1s', PAUSA_ITEM = '450ms';
const ORDINAIS = ['Primeiro', 'Segundo', 'Terceiro', 'Quarto', 'Quinto', 'Sexto', 'Sétimo', 'Oitavo', 'Nono', 'Décimo'];
const ROTULOS = { dica: 'Dica', aviso: 'Atenção', erro: 'Cuidado', info: 'Saiba mais', ok: 'Pronto', exemplo: 'Exemplo' };
export const CAPITULOS = { 'passo-0': 'Começo', 'passo-1': 'Ideia', 'passo-2': 'Exemplo', 'passo-5': 'Erro comum' };

const f = (x) => falado(x, 'ssml');
const titulo = (t, inicio = false) => `${inicio ? '' : `<break time="${PAUSA_TITULO}"/>`}<p><prosody rate="88%">${t}</prosody></p><break time="500ms"/>`;
const paragrafo = (x) => `<p>${x}</p><break time="${PAUSA_PAR}"/>`;
const frases = (x) => x.split(/\n+/).map((l) => l.trim()).filter(Boolean);
const lista = (itens, ordenada) => `<p>${itens.map((it, i) => `<s>${ordenada ? `${ORDINAIS[i] || `Item ${i + 1}`}: ` : ''}${f(it)}</s><break time="${PAUSA_ITEM}"/>`).join('')}</p><break time="${PAUSA_PAR}"/>`;
const marca = (n) => `<mark name="${n}"/>`;

function bloco(b) {
  if (typeof b === 'string') return paragrafo(f(b));
  if (b.c !== undefined) {
    if (b.l === 'prompt' || b.l === 'texto') return paragrafo(`${b.t ? f(b.t) + '. ' : ''}O texto do exemplo diz:`) + `<p>${frases(b.c).map((l) => `<s>${f(l)}</s><break time="300ms"/>`).join('')}</p><break time="${PAUSA_PAR}"/>`;
    return paragrafo(`${b.t ? f(b.t) + '. ' : ''}O código está na tela.`);
  }
  if (b.ul) return lista(b.ul, false);
  if (b.ol) return lista(b.ol, true);
  if (b.passos) return lista(b.passos, true);
  if (b.nota) return paragrafo(`${f(b.rot || ROTULOS[b.tipo] || 'Nota')}: ${f(b.nota)}`);
  if (b.h) return titulo(f(b.h));
  if (b.tab) return `<p>${b.tab.r.map((r) => `<s>${f(r[0])}: ${r.slice(1).map(f).join('; ')}</s><break time="${PAUSA_ITEM}"/>`).join('')}</p><break time="${PAUSA_PAR}"/>`;
  return '';
}

/** Peças de SSML da aula, na ordem da fala (cada peça é um trecho que pode ir sozinho num pedido). */
export function pecasDaAula(L) {
  const id = L.id.replace('.', ' ponto ');
  const p = [marca('passo-0') + titulo(`Lição ${id}. ${f(L.t)}`, true), paragrafo(f(L.gancho))];
  p.push(marca('passo-1') + titulo('Ideia'), paragrafo(`Analogia: ${f(L.analogia)}`), ...(L.ideia || []).map(bloco));
  p.push(marca('passo-2') + titulo('Exemplo resolvido'), ...(L.exemplo || []).map(bloco));
  p.push(marca('passo-5') + titulo('Erro comum de iniciante'), paragrafo(f(L.erro.t) + '.'), paragrafo(f(L.erro.d)));
  p.push(`<break time="${PAUSA_TITULO}"/>` + paragrafo('Fim da leitura. Agora faça o exercício e o quiz na tela.'));
  return p.filter(Boolean);
}

/**
 * A mesma fala de pecasDaAula, quebrada em unidades (parágrafo, item de lista, linha de tabela), cada uma com
 * a chave do trecho na tela (data-trecho) e a parte do áudio. Serve para calcular o tempo de cada parágrafo.
 * Chaves: 'tit' (título falado da parte), 'gancho', 'analogia', 'b3' (bloco 3), 'b3.1' (item 1 do bloco 3),
 * 'erro-t', 'erro-d' e 'fim' (frase final, sem trecho na tela).
 */
export function unidadesDaAula(L) {
  const id = L.id.replace('.', ' ponto ');
  const u = [];
  const add = (parte, chave, ssml) => { if (ssml) u.push({ parte, chave, ssml }); };
  const blocos = (parte, arr) => (arr || []).forEach((b, i) => {
    const itens = typeof b === 'object' && b && (b.ul || b.ol || b.passos);
    if (itens) { const ord = !b.ul; itens.forEach((it, k) => add(parte, `b${i}.${k}`, `<s>${ord ? `${ORDINAIS[k] || `Item ${k + 1}`}: ` : ''}${f(it)}</s>`)); return; }
    if (typeof b === 'object' && b && b.tab) { b.tab.r.forEach((r, k) => add(parte, `b${i}.${k}`, `<s>${f(r[0])}: ${r.slice(1).map(f).join('; ')}</s>`)); return; }
    add(parte, `b${i}`, bloco(b));
  });
  add('passo-0', 'tit', titulo(`Lição ${id}. ${f(L.t)}`, true)); add('passo-0', 'gancho', paragrafo(f(L.gancho)));
  add('passo-1', 'tit', titulo('Ideia')); add('passo-1', 'analogia', paragrafo(`Analogia: ${f(L.analogia)}`)); blocos('passo-1', L.ideia);
  add('passo-2', 'tit', titulo('Exemplo resolvido')); blocos('passo-2', L.exemplo);
  add('passo-5', 'tit', titulo('Erro comum de iniciante')); add('passo-5', 'erro-t', paragrafo(f(L.erro.t) + '.')); add('passo-5', 'erro-d', paragrafo(f(L.erro.d)));
  add('passo-5', 'fim', paragrafo('Fim da leitura. Agora faça o exercício e o quiz na tela.'));
  return u;
}

/** SSML → formato aceito pela voz: 'ssml' (Neural2/WaveNet: tudo), 'chirp' (sem break/prosody/mark), 'texto' (ElevenLabs). */
export function converter(ssml, modo) {
  if (modo === 'ssml') return ssml;
  if (modo === 'chirp') return ssml.replace(/<break[^>]*\/>|<mark[^>]*\/>|<\/?prosody[^>]*>/g, '');
  return ssml.replace(/<break time="(\d+)(ms|s)"\/>/g, (_, n, u) => ` <break time="${(u === 'ms' ? n / 1000 : +n).toFixed(1)}s" /> `)
    .replace(/<sub alias="([^"]*)">[^<]*<\/sub>/g, '$1').replace(/<mark[^>]*\/>/g, '').replace(/<\/?(p|s|prosody)[^>]*>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

/** Só o que é falado (sem marcações): para contar caracteres e calcular capítulos aproximados. */
export const textoPuro = (ssml) => converter(ssml, 'texto').replace(/<break[^>]*\/>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Agrupa as peças em pedidos dentro do limite da API (bytes no Google, caracteres no ElevenLabs).
 * Peça grande demais é quebrada no fim de uma frase.
 */
export function dividir(pecas, { modo = 'ssml', limite = 4800 } = {}) {
  const medir = (s) => (modo === 'texto' ? s.length : Buffer.byteLength(`<speak>${s}</speak>`));
  const partes = [];
  for (const p of pecas) {
    if (medir(converter(p, modo)) <= limite) { partes.push(p); continue; }
    let atual = '';
    for (const fr of p.split(/(?<=[.!?]\s|<\/s>)/)) {
      if (atual && medir(converter(atual + fr, modo)) > limite) { partes.push(atual); atual = ''; }
      atual += fr;
    }
    if (atual) partes.push(atual);
  }
  const pedidos = []; let cur = '';
  for (const p of partes) {
    if (cur && medir(converter(cur + p, modo)) > limite) { pedidos.push(cur); cur = ''; }
    cur += p;
  }
  if (cur) pedidos.push(cur);
  return pedidos.map((s) => (modo === 'texto' ? converter(s, 'texto') : `<speak>${converter(s, modo)}</speak>`));
}
