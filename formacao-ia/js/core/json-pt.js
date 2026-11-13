// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Leitor de JSON com mensagens de erro em português, pensadas para quem está começando.
// analisar(texto) → { ok: true, valor } ou { ok: false, pos, linha, col, msg, dica }.

class Erro extends Error { constructor(pos, msg, dica) { super(msg); this.pos = pos; this.dica = dica; } }

export function analisar(texto) {
  const t = String(texto);
  let i = 0;
  const ws = () => { while (i < t.length && /\s/.test(t[i])) i++; };
  const falha = (msg, dica, pos = i) => { throw new Erro(pos, msg, dica); };

  function valor() {
    ws();
    if (i >= t.length) falha('O JSON terminou antes da hora.', 'Falta um valor aqui. Confira se todo { tem } e todo [ tem ].');
    const c = t[i];
    if (c === '{') return objeto();
    if (c === '[') return lista();
    if (c === '"') return string();
    if (c === "'") falha('JSON só aceita aspas duplas.', 'Troque as aspas simples (\') por aspas duplas (").');
    if (c === '-' || (c >= '0' && c <= '9')) return numero();
    const resto = t.slice(i);
    const lit = resto.match(/^(true|false|null)(?![A-Za-z0-9_])/);
    if (lit) { i += lit[1].length; return lit[1] === 'true' ? true : lit[1] === 'false' ? false : null; }
    const py = resto.match(/^(True|False|None|TRUE|FALSE|NULL|Null|undefined|NaN)(?![A-Za-z0-9_])/);
    if (py) falha(`“${py[1]}” não existe em JSON.`, 'Em JSON os valores especiais são true, false e null, tudo em minúsculas.');
    if (c === '/' && (t[i + 1] === '/' || t[i + 1] === '*')) falha('JSON não aceita comentários.', 'Apague o comentário (// ou /* */).');
    if (c === '}' || c === ']') falha(`Achei “${c}” onde deveria haver um valor.`, 'Provavelmente há uma vírgula sobrando logo antes.');
    if (/[A-Za-zÀ-ÿ_]/.test(c)) falha('Texto sem aspas.', 'Em JSON, todo texto fica entre aspas duplas: "assim".');
    falha(`Caractere inesperado: “${c}”.`, 'Um valor começa com {, [, aspas duplas, um número, true, false ou null.');
  }

  function string() {
    const ini = i; i++; let out = '';
    for (;;) {
      if (i >= t.length) falha('Texto sem fechar aspas.', 'Faltou a aspa dupla de fechamento (").', ini);
      const c = t[i];
      if (c === '"') { i++; return out; }
      if (c === '\n') falha('Texto sem fechar aspas.', 'A aspa precisa fechar na mesma linha. Para quebrar linha dentro do texto, use \\n.', ini);
      if (c === '\\') {
        const n = t[i + 1];
        const mapa = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
        if (n === 'u') { const hex = t.slice(i + 2, i + 6); if (!/^[0-9a-fA-F]{4}$/.test(hex)) falha('Código \\u inválido.', 'Depois de \\u vêm 4 dígitos hexadecimais, como \\u00e9.'); out += String.fromCharCode(parseInt(hex, 16)); i += 6; continue; }
        if (!(n in mapa)) falha(`Sequência “\\${n ?? ''}” inválida.`, 'Para escrever uma barra invertida dentro do texto, use duas: \\\\.');
        out += mapa[n]; i += 2; continue;
      }
      out += c; i++;
    }
  }

  function numero() {
    const m = t.slice(i).match(/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/);
    if (!m) falha('Número mal escrito.', 'Exemplos válidos: 7, -3, 8.5.');
    const depois = t[i + m[0].length];
    if (m[0] === '0' && depois >= '0' && depois <= '9') falha('Número com zero à esquerda.', 'Escreva 7, e não 07.');
    i += m[0].length;
    return Number(m[0]);
  }

  function lista() {
    const ini = i; i++; const out = [];
    ws();
    if (t[i] === ']') { i++; return out; }
    for (;;) {
      out.push(valor());
      ws();
      if (i >= t.length) falha('A lista não foi fechada.', 'Faltou ] no fim da lista.', ini);
      if (t[i] === ',') {
        const virg = i; i++; ws();
        if (t[i] === ']') falha('Vírgula sobrando no fim da lista.', 'Apague a vírgula que vem antes de ].', virg);
        continue;
      }
      if (t[i] === ']') { i++; return out; }
      falha('Faltou uma vírgula entre os itens da lista.', 'Separe os itens com vírgula: [1, 2, 3].');
    }
  }

  function objeto() {
    const ini = i; i++; const out = {};
    ws();
    if (t[i] === '}') { i++; return out; }
    for (;;) {
      ws();
      if (i >= t.length) falha('O objeto não foi fechado.', 'Faltou } no fim.', ini);
      if (t[i] === "'") falha('JSON só aceita aspas duplas.', 'Troque as aspas simples (\') do nome do campo por aspas duplas (").');
      if (t[i] !== '"') {
        if (/[A-Za-zÀ-ÿ_]/.test(t[i])) falha('Nome de campo sem aspas.', 'Em JSON o nome do campo fica entre aspas duplas: "nome": …');
        if (t[i] === '}') falha('Vírgula sobrando no fim do objeto.', 'Apague a vírgula que vem antes de }.');
        falha('Esperava o nome de um campo.', 'Cada campo começa com o nome entre aspas duplas: "nome": valor.');
      }
      const chave = string();
      ws();
      if (t[i] !== ':') falha(`Faltou : depois de "${chave}".`, 'Entre o nome do campo e o valor vai um dois-pontos: "nome": valor.');
      i++;
      out[chave] = valor();
      ws();
      if (i >= t.length) falha('O objeto não foi fechado.', 'Faltou } no fim.', ini);
      if (t[i] === ',') {
        const virg = i; i++; ws();
        if (t[i] === '}') falha('Vírgula sobrando no fim do objeto.', 'Apague a vírgula que vem antes de }.', virg);
        continue;
      }
      if (t[i] === '}') { i++; return out; }
      if (t[i] === '"' || t[i] === "'") falha('Faltou uma vírgula entre dois campos.', 'Separe os campos com vírgula: "a": 1, "b": 2.');
      falha('Faltou uma vírgula ou o fechamento }.', 'Depois de um valor vem vírgula (se houver outro campo) ou }.');
    }
  }

  try {
    ws();
    if (i >= t.length) falha('Está vazio.', 'Um JSON começa com { (objeto) ou [ (lista).');
    if (t[i] !== '{' && t[i] !== '[' && /[A-Za-zÀ-ÿ`]/.test(t[i]) && !/^(true|false|null)\s*$/.test(t.slice(i))) {
      const abre = t.search(/[{[]/);
      if (abre > 0) falha('Há texto antes do JSON.', 'Um programa só consegue ler se a resposta for apenas o JSON. Apague o texto de fora (inclusive ```).');
    }
    const v = valor();
    ws();
    if (i < t.length) {
      if (t[i] === ',' ) falha('Vírgula sobrando depois do fim.', 'O JSON já terminou; apague o que vem depois.');
      falha('Há texto depois do JSON.', 'Um programa só consegue ler se a resposta for apenas o JSON. Apague o que sobrou no fim.');
    }
    return { ok: true, valor: v };
  } catch (e) {
    if (!(e instanceof Erro)) throw e;
    const pos = Math.max(0, Math.min(t.length, e.pos));
    const antes = t.slice(0, pos);
    const linha = antes.split('\n').length;
    const col = pos - (antes.lastIndexOf('\n') + 1) + 1;
    return { ok: false, pos, linha, col, msg: e.message, dica: e.dica };
  }
}

/**
 * Confere o formato esperado por um exercício.
 * espera: { tipo: 'lista'|'objeto', n?: tamanho exato, min?: tamanho mínimo, chaves?: [..], tipos?: {chave: 'texto'|'numero'|'logico'} }
 * Devolve lista de problemas em português (vazia = passou).
 */
export function conferirFormato(valor, espera) {
  const probs = [];
  const tipoDe = (v) => (Array.isArray(v) ? 'lista' : v === null ? 'nulo' : typeof v === 'object' ? 'objeto' : typeof v === 'string' ? 'texto' : typeof v === 'number' ? 'numero' : typeof v === 'boolean' ? 'logico' : 'outro');
  const nomes = { lista: 'uma lista [ ]', objeto: 'um objeto { }', texto: 'texto', numero: 'número', logico: 'true ou false' };
  if (espera.tipo && tipoDe(valor) !== espera.tipo) { probs.push(`O JSON precisa ser ${nomes[espera.tipo]}.`); return probs; }
  const itens = espera.tipo === 'lista' ? valor : [valor];
  if (espera.tipo === 'lista') {
    if (espera.n != null && valor.length !== espera.n) probs.push(`A lista precisa ter ${espera.n} itens (tem ${valor.length}).`);
    if (espera.min != null && valor.length < espera.min) probs.push(`A lista precisa ter pelo menos ${espera.min} itens (tem ${valor.length}).`);
  }
  if (espera.chaves || espera.tipos) {
    itens.forEach((it, k) => {
      const onde = espera.tipo === 'lista' ? `Item ${k + 1}: ` : '';
      if (tipoDe(it) !== 'objeto') { probs.push(`${onde}precisa ser um objeto { }.`); return; }
      for (const c of espera.chaves || []) if (!(c in it)) probs.push(`${onde}falta o campo "${c}".`);
      for (const [c, tp] of Object.entries(espera.tipos || {})) if (c in it && tipoDe(it[c]) !== tp) probs.push(`${onde}o campo "${c}" precisa ser ${nomes[tp]}${tp === 'numero' && typeof it[c] === 'string' ? ' (sem aspas)' : ''}.`);
    });
  }
  return probs;
}
