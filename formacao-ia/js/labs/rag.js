// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Laboratório de RAG: buscar trechos nas anotações (com fonte), variar o top-k e ver o prompt montado.
// Para caber no aparelho e funcionar sem internet, a busca aqui é por palavras (TF-IDF), não por embeddings.
import { h, clear, put, seg, codeBlock, fmt } from '../core/ui.js';
import { criarIndice, buscar } from '../core/texto.js';
import { marco } from '../core/estado.js';
import { missao, semMissao } from './comum.js';

export const ANOTACOES = [
  ['m3-limites.md', 'Limite por minuto: no plano gratuito, um dos modelos aceita 30 requisições por minuto.'],
  ['m3-limites.md', 'Limite diário: o plano gratuito tem um teto de requisições e de tokens por dia, que varia por modelo.'],
  ['m3-limites.md', 'Os limites do plano gratuito valem para a conta inteira: criar mais chaves não aumenta a cota.'],
  ['m3-limites.md', 'Quando passa do limite, a API responde 429. O certo é esperar e tentar de novo, aumentando a espera.'],
  ['m1-tokens.md', 'Token é um pedaço de texto. As APIs cobram por token de entrada e de saída.'],
  ['m1-contexto.md', 'A janela de contexto é o limite de tokens por vez; entrada e saída dividem a mesma janela.'],
  ['m1-temperatura.md', 'Temperatura baixa deixa as respostas previsíveis; temperatura alta, variadas.'],
  ['m3-rag.md', 'O RAG busca trechos relevantes e coloca no prompt antes da pergunta. Ele não treina o modelo.'],
  ['m3-rag.md', 'O top-k define quantos trechos a busca traz. Comece com 3 a 5.'],
  ['m2-prompt.md', 'Um bom prompt tem papel, contexto, tarefa, formato, restrições e exemplos.'],
  ['m1-lgpd.md', 'O artigo 20 da LGPD garante pedir revisão de decisões tomadas só por tratamento automatizado.'],
  ['m4-n8n.md', 'No n8n, a URL de teste do webhook só funciona com o editor escutando; a de produção, com o workflow ativo.'],
];

export default function ({ missao: m, feito }) {
  const mi = m ? missao(['Busque com **k = 1**.', 'Busque com **k = 3**.', 'Busque com **k = 8**.'], feito) : semMissao();
  const idx = criarIndice(ANOTACOES.map((x) => x[1]));
  let k = 3;
  const q = h('input.inp', { type: 'text', value: 'Quais são os limites do plano gratuito?', 'aria-label': 'Pergunta', maxLength: 200 });
  const res = h('div.col', { style: { gap: '8px' } });
  const prompt = h('div');
  const ir = () => {
    const r = buscar(idx, q.value, k).filter((x) => x.score > 0);
    clear(res); clear(prompt);
    if (!r.length) { res.append(h('div.why.no', 'Nenhum trecho com palavras em comum. Um bom RAG, aqui, responde: “Não encontrei isso no material.” (Embeddings achariam sinônimos; esta busca de bolso, não.)')); }
    r.forEach((x, i) => res.append(h('div.achado' + (i === 0 ? '.top' : ''), h('div.meta', h('span', `[${ANOTACOES[x.i][0]}]`), h('span', `pontuação ${fmt(x.score, 2)}`)), h('span', ANOTACOES[x.i][1]), h('span.small.muted', `palavras em comum: ${x.comuns.join(', ')}`))));
    if (r.length) {
      const ctx = r.map((x) => `[${ANOTACOES[x.i][0]}] ${ANOTACOES[x.i][1]}`).join('\n');
      put(prompt, h('div.small.muted', 'O prompt que vai para o modelo:'), codeBlock(`Responda usando SOMENTE o contexto abaixo.\nSe a resposta não estiver no contexto, diga "não encontrei".\nCite a fonte entre colchetes.\n\nContexto:\n${ctx}\n\nPergunta: ${q.value}`, 'prompt'));
      marco('rag');
    }
    mi.marcar({ 1: 0, 3: 1, 8: 2 }[k] ?? -1);
  };
  return h('div.lab', mi.el,
    h('p.small.dim', `Anotações indexadas: ${ANOTACOES.length} trechos. Esta busca é por palavras, para caber no app; o seu projeto usa embeddings.`),
    h('label.field', h('span', 'Pergunta'), q),
    h('label.field', h('span', 'top-k: quantos trechos trazer'), seg([1, 3, 5, 8].map((v) => ({ v, label: `k = ${v}` })), k, (v) => { k = v; }, { label: 'top-k' })),
    h('button.btn.primary.block', { type: 'button', onclick: ir }, 'Buscar'), res, prompt);
}
