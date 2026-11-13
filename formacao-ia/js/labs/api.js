// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Laboratório de API: um servidor de treino, dentro do app, que responde como uma API de chat de verdade.
// Nenhum pedido sai do aparelho. A chave de treino é pública de propósito.
import { h, clear, put, seg } from '../core/ui.js';
import { analisar } from '../core/json-pt.js';
import { marco } from '../core/estado.js';
import { missao, semMissao, arvore } from './comum.js';

export const URL_TREINO = 'https://api.treino.local/v1/chat/completions';
export const CHAVE_TREINO = 'treino-123';
const CORPO = '{\n  "model": "modelo-de-treino",\n  "messages": [\n    { "role": "system", "content": "Responda em uma frase." },\n    { "role": "user", "content": "O que é um token?" }\n  ]\n}';

/** O servidor de treino (puro): devolve { status, corpo }. agora = ms; hist = horários dos últimos pedidos. */
export function servidor({ metodo, url, auth, tipo, corpo }, hist, agora) {
  const erro = (status, mensagem) => ({ status, corpo: { error: { message: mensagem } } });
  hist.push(agora);
  while (hist.length && agora - hist[0] > 10000) hist.shift();
  if (hist.length > 4) return erro(429, 'Limite de 4 pedidos a cada 10 segundos atingido. Espere um pouco e tente de novo.');
  if (url.trim() !== URL_TREINO) return erro(404, 'Endereço não encontrado. Confira a URL, letra por letra.');
  if (metodo !== 'POST') return erro(400, 'Este endereço recebe pedidos com o método POST.');
  const a = auth.trim();
  if (!a) return erro(401, 'Faltou o cabeçalho Authorization.');
  if (!/^Bearer /.test(a)) return erro(401, 'O cabeçalho Authorization começa com a palavra Bearer e um espaço.');
  if (a.slice(7).trim() !== CHAVE_TREINO) return erro(401, 'Chave inválida.');
  if (!/application\/json/i.test(tipo)) return erro(400, 'Faltou o cabeçalho Content-Type: application/json.');
  const j = analisar(corpo);
  if (!j.ok) return erro(400, `JSON inválido na linha ${j.linha}: ${j.msg}`);
  const b = j.valor;
  if (!b || typeof b !== 'object' || Array.isArray(b)) return erro(400, 'O corpo precisa ser um objeto JSON.');
  if (!b.model) return erro(400, 'Faltou o campo "model".');
  if (!Array.isArray(b.messages) || !b.messages.length) return erro(400, 'Faltou a lista "messages".');
  const user = [...b.messages].reverse().find((x) => x && x.role === 'user');
  if (!user || typeof user.content !== 'string') return erro(400, 'Nenhuma mensagem com "role": "user" e "content".');
  const texto = /token/i.test(user.content) ? 'Token é um pedaço de texto que o modelo lê e escreve.' : `Recebi a sua pergunta: “${user.content.slice(0, 60)}”. Sou só um servidor de treino.`;
  const pt = 12 + Math.round(user.content.length / 4), ct = Math.round(texto.length / 4);
  return { status: 200, corpo: { id: 'resp-treino-1', model: b.model, choices: [{ index: 0, message: { role: 'assistant', content: texto }, finish_reason: 'stop' }], usage: { prompt_tokens: pt, completion_tokens: ct, total_tokens: pt + ct } } };
}

export default function ({ missao: m, feito }) {
  const mi = m ? missao(['Receba **status 200** do servidor de treino.', 'Na resposta, toque no **texto que o modelo escreveu**.'], feito) : semMissao();
  const hist = [];
  let metodo = 'GET';
  const url = h('input.inp.mono', { type: 'url', value: URL_TREINO, 'aria-label': 'URL', spellcheck: false });
  const auth = h('input.inp.mono', { type: 'text', value: '', placeholder: 'Bearer …', 'aria-label': 'Cabeçalho Authorization', spellcheck: false, autocapitalize: 'off' });
  const tipo = h('input.inp.mono', { type: 'text', value: '', placeholder: 'application/json', 'aria-label': 'Cabeçalho Content-Type', spellcheck: false, autocapitalize: 'off' });
  const corpo = h('textarea.mono', { rows: 8, value: CORPO, spellcheck: false, 'aria-label': 'Corpo do pedido (JSON)' });
  const resp = h('div');
  const enviar = () => {
    const r = servidor({ metodo, url: url.value, auth: auth.value, tipo: tipo.value, corpo: corpo.value }, hist, Date.now());
    const caminho = h('div.small');
    put(clear(resp), h('div.resp', h('div.st.s' + String(r.status)[0], h('span', `Status ${r.status}`), h('span', { style: { fontWeight: '600' } }, { 200: 'Deu certo', 400: 'Pedido mal formado', 401: 'Não autorizado', 404: 'Não encontrado', 429: 'Pedidos demais' }[r.status])),
      arvore(r.corpo, (c, v) => {
        clear(caminho).append('Caminho: ', h('code', c));
        if (r.status === 200 && c === 'choices[0].message.content') { mi.marcar(1); caminho.append(h('div', h('b', 'Isso: '), 'é aqui que fica o texto da resposta.')); }
      })), caminho);
    if (r.status === 200) { mi.marcar(0); marco('api200'); }
  };
  return h('div.lab', mi.el,
    h('div.banner', h('span', 'Servidor de treino: nada sai do seu aparelho. A chave de treino é ', h('code', CHAVE_TREINO), '.')),
    h('label.field', h('span', 'Método'), seg(['GET', 'POST'], metodo, (v) => { metodo = v; }, { label: 'Método' })),
    h('label.field', h('span', 'URL'), url),
    h('label.field', h('span', 'Authorization'), auth),
    h('label.field', h('span', 'Content-Type'), tipo),
    h('label.field', h('span', 'Corpo (JSON)'), corpo),
    h('button.btn.primary.block', { type: 'button', onclick: enviar }, 'Enviar pedido'), resp);
}
