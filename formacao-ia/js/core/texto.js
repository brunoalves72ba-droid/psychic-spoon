// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Algoritmos dos laboratórios: tokens (aproximação didática), softmax com temperatura,
// cosseno, chunking e busca por palavras (TF-IDF). Tudo puro e testado.

// ---------- tokens (aproximação didática) ----------
// Tokenizadores de verdade usam uma tabela aprendida (BPE) com dezenas de milhares de peças.
// Aqui a divisão é uma aproximação: palavras muito comuns valem 1 peça; as outras se partem a cada
// 3–4 letras; pontuação e acentos raros custam peças extras. Serve para sentir a ideia, não para cobrar.
const COMUNS = new Set(('a o e de da do das dos em um uma que para com por se no na nos nas os as ao aos à é não mais mas foi ser tem como ou seu sua ' +
  'eu ele ela você isso este esta esse essa muito já está são era quando também só até sem sobre entre depois bem ' +
  'the of and to in is it for on with as was that this be are at by an or from not you we i have has can will your ' +
  'me te lhe meu minha tudo todo toda hoje aqui onde quem qual cada pode faz ter há vai dia casa vida tempo anos ano').split(' '));
export function tokensAprox(texto) {
  const out = [];
  const re = /(\s+)|([A-Za-zÀ-ÖØ-öø-ÿ]+)|(\d+)|([^\sA-Za-zÀ-ÖØ-öø-ÿ\d])/g;
  let m, espaco = '';
  while ((m = re.exec(String(texto)))) {
    if (m[1]) { // espaço gruda no token seguinte; quebras de linha são tokens próprios
      const nl = m[1].split('\n').length - 1;
      for (let k = 0; k < nl; k++) out.push('\n');
      espaco = nl ? '' : ' ';
      continue;
    }
    if (m[2]) {
      const w = m[2], low = w.toLowerCase();
      const ascii = /^[A-Za-z]+$/.test(w);
      let pecas;
      if (COMUNS.has(low) || w.length <= 3) pecas = [w];
      else {
        const passo = ascii ? 4 : 3; // palavras com acento costumam se partir em mais peças
        const primeiro = Math.min(w.length, ascii ? 5 : 4);
        pecas = [w.slice(0, primeiro)];
        for (let k = primeiro; k < w.length; k += passo) pecas.push(w.slice(k, k + passo));
        if (pecas.length > 1 && pecas[pecas.length - 1].length === 1) { const u = pecas.pop(); pecas[pecas.length - 1] += u; }
      }
      pecas[0] = espaco + pecas[0];
      out.push(...pecas);
    } else if (m[3]) { // números: grupos de até 3 dígitos
      const d = m[3]; const pecas = [];
      for (let k = 0; k < d.length; k += 3) pecas.push(d.slice(k, k + 3));
      pecas[0] = espaco + pecas[0];
      out.push(...pecas);
    } else out.push(espaco + m[4]);
    espaco = '';
  }
  return out;
}
export const contarPalavras = (texto) => (String(texto).match(/[A-Za-zÀ-ÖØ-öø-ÿ\d]+/g) || []).length;

// ---------- softmax com temperatura ----------
/** Probabilidades a partir de notas (logits). T = 0 escolhe sempre a maior. */
export function softmax(logits, T = 1) {
  if (T <= 0.0001) { const mx = Math.max(...logits); const k = logits.indexOf(mx); return logits.map((_, i) => (i === k ? 1 : 0)); }
  const mx = Math.max(...logits);
  const ex = logits.map((x) => Math.exp((x - mx) / T));
  const z = ex.reduce((a, b) => a + b, 0);
  return ex.map((x) => x / z);
}
/** Sorteia um índice conforme as probabilidades. rnd ∈ [0,1). */
export function amostrar(probs, rnd = Math.random()) {
  let acc = 0;
  for (let i = 0; i < probs.length; i++) { acc += probs[i]; if (rnd < acc) return i; }
  return probs.length - 1;
}

// ---------- vetores ----------
export function cosseno(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

// ---------- chunking ----------
/**
 * Divide o texto em pedaços de até `tamanho` caracteres com `sobre` caracteres de sobreposição.
 * porFrase = true: só corta em fim de frase (uma frase maior que o tamanho vira um pedaço sozinha).
 * Devolve [{ ini, fim, texto }] com posições no texto original.
 */
export function chunk(texto, tamanho, sobre = 0, porFrase = false) {
  const t = String(texto);
  tamanho = Math.max(20, Math.floor(tamanho)); sobre = Math.max(0, Math.min(Math.floor(sobre), tamanho - 10));
  const out = [];
  if (!porFrase) {
    for (let ini = 0; ini < t.length; ini += tamanho - sobre) {
      const fim = Math.min(t.length, ini + tamanho);
      out.push({ ini, fim, texto: t.slice(ini, fim) });
      if (fim >= t.length) break;
    }
    return out;
  }
  // limites de frase: depois de . ! ? ou quebra de linha
  const frases = []; const re = /[^.!?\n]+[.!?]*\s*|\n+/g; let m;
  while ((m = re.exec(t))) if (m[0].length) frases.push({ ini: m.index, fim: m.index + m[0].length });
  let i = 0;
  while (i < frases.length) {
    let j = i, ini = frases[i].ini, fim = frases[i].fim;
    while (j + 1 < frases.length && frases[j + 1].fim - ini <= tamanho) { j++; fim = frases[j].fim; }
    out.push({ ini, fim, texto: t.slice(ini, fim) });
    if (j + 1 >= frases.length) break;
    // sobreposição: recua frases inteiras enquanto couberem em `sobre`
    let k = j + 1;
    while (k - 1 > i && frases[j].fim - frases[k - 1].ini <= sobre) k--;
    i = k;
  }
  return out;
}

// ---------- busca por palavras (TF-IDF) ----------
const STOP = new Set(('a o e de da do das dos em um uma que para com por se no na nos nas os as ao aos à é são foi ser como ou seu sua ' +
  'isso este esta esse essa mais mas não sim já só também muito quando onde qual quais quem sobre entre até sem ter tem há eu você ele ela').split(' '));
export const semAcento = (x) => String(x).normalize('NFD').replace(/[̀-ͯ]/g, '');
export function termos(texto) {
  // radical bem simples: plural → singular (ações → acao, canais → canal, tokens → token)
  const singular = (w) => (w.length <= 3 ? w : w.replace(/(oes|aes)$/, 'ao').replace(/ais$/, 'al').replace(/s$/, ''));
  return (semAcento(texto).toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 1 && !STOP.has(w)).map(singular);
}
export function criarIndice(docs) {
  const tfs = docs.map((d) => { const tf = new Map(); for (const w of termos(d)) tf.set(w, (tf.get(w) || 0) + 1); return tf; });
  const df = new Map();
  for (const tf of tfs) for (const w of tf.keys()) df.set(w, (df.get(w) || 0) + 1);
  const N = docs.length;
  const idf = (w) => Math.log(1 + N / (df.get(w) || N + 1));
  const vet = tfs.map((tf) => { const v = new Map(); let n = 0; for (const [w, f] of tf) { const x = (1 + Math.log(f)) * idf(w); v.set(w, x); n += x * x; } return { v, norma: Math.sqrt(n) }; });
  return { vet, idf, df, N };
}
/** Devolve os k documentos mais parecidos: [{ i, score, comuns: [termos em comum] }]. */
export function buscar(indice, consulta, k = 3) {
  const tf = new Map(); for (const w of termos(consulta)) tf.set(w, (tf.get(w) || 0) + 1);
  const q = new Map(); let nq = 0;
  for (const [w, f] of tf) { if (!indice.df.has(w)) continue; const x = (1 + Math.log(f)) * indice.idf(w); q.set(w, x); nq += x * x; }
  nq = Math.sqrt(nq);
  const res = indice.vet.map((d, i) => {
    let dot = 0; const comuns = [];
    for (const [w, x] of q) { const y = d.v.get(w); if (y) { dot += x * y; comuns.push(w); } }
    return { i, score: nq && d.norma ? dot / (nq * d.norma) : 0, comuns };
  });
  return res.sort((a, b) => b.score - a.score || a.i - b.i).slice(0, k);
}
