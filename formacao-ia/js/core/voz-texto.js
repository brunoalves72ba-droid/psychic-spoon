// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Prepara o texto para a voz do aparelho: tira símbolos, ajusta a pronúncia dos termos em inglês
// e corta em frases curtas (frases longas demais travam ou são cortadas em alguns navegadores).

// [termo, como falar, diferencia maiúsculas]. Grafia "à brasileira" para a voz em pt-BR.
const PRONUNCIA = [
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
  ['REST', 'rést', true], ['IF', 'íf', true], ['Switch', 'suítch'], ['XP', 'xís pê', true], ['TDAH', 'tê dê á agá', true],
].map(([t, f, caso]) => [new RegExp(`(?<![\\p{L}\\p{N}_])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}_])`, caso ? 'gu' : 'giu'), f]);

export function pronunciar(t) {
  for (const [re, f] of PRONUNCIA) t = t.replace(re, f);
  return t;
}

/** Texto pronto para falar: sem marcações, sem emoji, com endereços curtos e pronúncia ajustada. */
export function limpar(t) {
  return pronunciar(String(t || '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')                       // [texto](link) → texto
    .replace(/https?:\/\/([^\s/)]+)[^\s)]*/g, '$1')                 // URL → só o domínio
    .replace(/\b([a-z0-9-]+)\.(io|com|ai|org|br|dev|app|co)\b/gi, '$1 ponto $2')
    .replace(/⟦[^⟧]*⟧/g, ' lacuna ')
    .replace(/\{\{\s*\}\}/g, 'chaves duplas')
    .replace(/[\p{Extended_Pictographic}️‍]/gu, '')
    .replace(/\s*[→⇒]\s*/g, ', depois, ').replace(/≥/g, ' maior ou igual a ').replace(/≤/g, ' menor ou igual a ')
    .replace(/(\d)\s*%/g, '$1 por cento').replace(/(\d)\s*×/g, '$1 vezes').replace(/&/g, ' e ')
    .replace(/\s*[·—–]\s*/g, ', ').replace(/\s\/\s|(?<=\p{L})\/(?=\p{L})/gu, ' ou ')
    .replace(/[`*_#|{}<>[\]\\^~]/g, ' ')
    .replace(/[ \t]+/g, ' ').replace(/ ([,.;:!?])/g, '$1').trim());
}

/** Divide em frases de até `max` caracteres, juntando as curtas (fala mais natural e menos pausas). */
export function dividir(texto, max = 200) {
  const frases = [];
  for (const linha of String(texto || '').split(/\n+/)) {
    for (let f of linha.split(/(?<=[.!?…;:])\s+/)) {
      f = f.trim(); if (!f) continue;
      while (f.length > max) {                                     // frase enorme: corta numa vírgula ou espaço
        let k = f.lastIndexOf(', ', max); if (k < max / 3) k = f.lastIndexOf(' ', max); if (k < 1) k = max;
        frases.push(f.slice(0, k + 1).trim()); f = f.slice(k + 1).trim();
      }
      if (f) frases.push(f);
    }
    frases.push('\n');
  }
  const out = []; let cur = '';
  for (const f of frases) {
    if (f === '\n') { if (cur) out.push(cur); cur = ''; continue; }
    if (cur && cur.length + f.length + 1 > max) { out.push(cur); cur = f; } else cur = cur ? cur + ' ' + f : f;
  }
  if (cur) out.push(cur);
  return out.filter((x) => /[\p{L}\p{N}]/u.test(x));
}
