// Formação IA — gerador de áudio (roda só no computador, fora do app).
// Converte o texto das aulas para a forma FALADA em português, sem mexer no texto exibido na tela:
// abreviações, símbolos, números, moeda, datas, código em linha e termos em inglês (com <sub alias>).

// [termo, como falar, diferencia maiúsculas]
const TERMOS = [
  ['chain-of-thought', 'tchêin óf thót'], ['few-shot', 'fiú chót'], ['zero-shot', 'zíro chót'],
  ['Hugging Face', 'râguin feis'], ['Community Cloud', 'comiúniti cláud'], ['VS Code', 'vê ésse côud'],
  ['NotebookLM', 'nôutbuk éle ême'], ['LangChain', 'lêng tchêin'], ['LangGraph', 'lêng gráf'], ['ChromaDB', 'crôma dê bê'],
  ['OpenAI', 'ôupen êi ai'], ['Streamlit', 'strímlit'], ['Hoppscotch', 'róps cótch'], ['WhatsApp', 'uótsap'], ['GitHub', 'guít rábi'],
  ['webhooks', 'uébi ruques'], ['webhook', 'uébi ruque'], ['embeddings', 'embédings'], ['embedding', 'embéding'],
  ['chunking', 'tchânquin'], ['chunks', 'tchânks'], ['chunk', 'tchânk'], ['prompts', 'prômpts'], ['prompt', 'prômpt'],
  ['tokens', 'tôquens'], ['token', 'tôquen'], ['deploy', 'diplói'], ['Python', 'páiton'], ['pandas', 'pândas'],
  ['Groq', 'gróqui'], ['Gradio', 'grádio'], ['Gamma', 'guêma'], ['Postman', 'póustman'], ['Spaces', 'spêicis'],
  ['Google Sheets', 'gúgol xíts'], ['low-code', 'lôu côud'], ['guardrails', 'gárd rêils'], ['backoff', 'bécóf'],
  ['Git', 'guít'], ['venv', 'vê énv'], ['.env', 'ponto énv'], ['@tool', 'arroba tul'], ['create_agent', 'criêit êidjent'],
  ['JSON', 'djêison', true], ['APIs', 'a pê is', true], ['API', 'a pê í', true], ['LLMs', 'éle éle êmes', true], ['LLM', 'éle éle ême', true],
  ['RAG', 'rági', true], ['IA', 'i á', true], ['n8n', 'ene oito ene'], ['SDK', 'ésse dê cá', true], ['CSV', 'cê ésse vê', true],
  ['PDF', 'pê dê éfe', true], ['URL', 'u érre éle', true], ['LGPD', 'éle gê pê dê', true], ['HTTP', 'agá tê tê pê', true],
  ['REST', 'rést', true], ['IF', 'íf', true], ['Switch', 'suítch'], ['TDAH', 'tê dê á agá', true],
].map(([t, f, caso]) => [new RegExp(`(?<![\\p{L}\\p{N}_])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}_])`, caso ? 'gu' : 'giu'), f]);

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const ORD = { 'º': ['primeiro', 'segundo', 'terceiro', 'quarto', 'quinto', 'sexto', 'sétimo', 'oitavo', 'nono', 'décimo'], 'ª': ['primeira', 'segunda', 'terceira', 'quarta', 'quinta', 'sexta', 'sétima', 'oitava', 'nona', 'décima'] };
const UNID = { h: ['hora', 'horas'], min: ['minuto', 'minutos'], km: ['quilômetro', 'quilômetros'], kg: ['quilo', 'quilos'], KB: ['kilobyte', 'kilobytes'], MB: ['megabyte', 'megabytes'], GB: ['gigabyte', 'gigabytes'], TB: ['terabyte', 'terabytes'], ms: ['milissegundo', 'milissegundos'] };

export const escXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Código em linha (`choices[0].message.content`) dito de um jeito que dá para entender ouvindo. */
export function codigoFalado(c) {
  return c.replace(/\{\{\s*\}\}/g, ' chaves duplas ').replace(/\(\)/g, '').replace(/([\w\]\)])\.(?=\w)/g, '$1 ponto ')
    .replace(/\[(\d+)\]/g, ' item $1 ').replace(/[_]/g, ' ').replace(/\//g, ' barra ').replace(/=/g, ' igual a ')
    .replace(/[{}[\]()"'`<>;]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Texto da aula (markdown simples) → texto falado. `modo`: 'ssml' e 'chirp' devolvem XML seguro com
 * <sub alias> nos termos em inglês; 'texto' devolve texto puro com a pronúncia já escrita.
 */
export function falado(md, modo = 'ssml') {
  let t = String(md || '');
  t = t.replace(/`([^`]+)`/g, (_, c) => ' ' + codigoFalado(c) + ' ');
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*|__/g, '').replace(/\*/g, '').replace(/(^|[\s(])_([^_]+)_(?=[\s).,;:!?]|$)/g, '$1$2');
  t = t.replace(/https?:\/\/([^\s/)]+)[^\s)]*/g, '$1').replace(/\b([a-z0-9-]+)\.(io|com|ai|org|br|dev|app|co|net)\b/gi, '$1 ponto $2');
  // moeda
  t = t.replace(/US\$\s?(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{2}))?/g, (_, i, c) => `${i} ${i === '1' ? 'dólar' : 'dólares'}${c && c !== '00' ? ` e ${+c} centavos` : ''}`);
  t = t.replace(/R\$\s?(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{2}))?/g, (_, i, c) => `${i} ${i === '1' ? 'real' : 'reais'}${c && c !== '00' ? ` e ${+c} centavos` : ''}`);
  // datas (dd/mm/aaaa e dd/mm) e horas (14h30)
  t = t.replace(/\b(\d{2})\/(\d{2})\/(\d{4})\b/g, (m, d, mm, a) => (+mm >= 1 && +mm <= 12 ? `${+d} de ${MESES[+mm - 1]} de ${a}` : m));
  t = t.replace(/\b(\d{2})\/(\d{2})\b(?!\/)/g, (m, d, mm) => (+mm >= 1 && +mm <= 12 && +d <= 31 ? `${+d} de ${MESES[+mm - 1]}` : m));
  t = t.replace(/\b(\d{1,2})h(\d{2})\b/g, '$1 horas e $2');
  // números com símbolo e unidade
  t = t.replace(/(\d+(?:,\d+)?)\s?%/g, '$1 por cento');
  t = t.replace(/\b(\d{1,2})([ºª])/g, (m, n, s) => ORD[s][+n - 1] || `${n}${s === 'º' ? ' o' : ' a'}`);
  t = t.replace(/\bn[º°.]\s?(?=\d)/gi, 'número ');
  t = t.replace(/\b(\d+(?:,\d+)?)\s?(h|min|km|kg|KB|MB|GB|TB|ms)\b/g, (_, n, u) => `${n} ${n === '1' ? UNID[u][0] : UNID[u][1]}`);
  t = t.replace(/\b(\d+)\s?x\b/g, '$1 vezes').replace(/\b(\d+)\s?k\b/g, '$1 mil').replace(/(\d)\s?°C\b/g, '$1 graus Celsius');
  t = t.replace(/(\d)\s?\+\s?(\d)/g, '$1 mais $2').replace(/(\d)\s?[×*]\s?(\d)/g, '$1 vezes $2').replace(/(\d)\s?=\s?(\d)/g, '$1 igual a $2');
  // abreviações
  t = t.replace(/\b[Ee]x\.:?/g, 'por exemplo').replace(/\betc\./g, 'etcétera').replace(/\bvs\.?(?=\s)/g, 'versus')
    .replace(/\baprox\./g, 'aproximadamente').replace(/\b[Oo]bs\.:?/g, 'observação:').replace(/\bpág\./g, 'página')
    .replace(/\bp\/(?=\s)/g, 'para').replace(/\bc\/(?=\s)/g, 'com').replace(/\bSr\.(?=\s)/g, 'senhor').replace(/\bSra\.(?=\s)/g, 'senhora')
    .replace(/\btel\.(?=\s)/g, 'telefone').replace(/\bq\.?b\.(?=\s)/g, 'quanto baste');
  // símbolos
  t = t.replace(/\s*[→⇒]\s*/g, ', depois, ').replace(/≥/g, ' maior ou igual a ').replace(/≤/g, ' menor ou igual a ')
    .replace(/≈|~(?=\s?\d)/g, ' aproximadamente ').replace(/≠/g, ' diferente de ').replace(/&/g, ' e ')
    .replace(/\/(mês|dia|ano|hora|semana)\b/g, ' por $1').replace(/(?<=\p{L})\/(?=\p{L})/gu, ' ou ')
    .replace(/\s*[·—–]\s*/g, ', ').replace(/…/g, '...').replace(/\{\{\s*\}\}/g, 'chaves duplas')
    .replace(/[\p{Extended_Pictographic}️‍]/gu, '').replace(/[#|^~\\]/g, ' ').replace(/[“”«»]/g, '"');
  t = t.replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\s+([,.;:!?])/g, '$1').trim();
  if (modo === 'texto') { for (const [re, f] of TERMOS) t = t.replace(re, f); return t; }
  t = escXml(t);
  for (const [re, f] of TERMOS) t = t.replace(re, (m) => `<sub alias="${f}">${m}</sub>`);
  return t;
}
