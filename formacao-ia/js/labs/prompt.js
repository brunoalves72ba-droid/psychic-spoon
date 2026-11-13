// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Laboratório de prompts: confere as 6 partes, conta tokens, compara com uma versão melhorada e guarda na biblioteca.
import { h, clear, codeBlock, copyText, toast } from '../core/ui.js';
import { tokensAprox } from '../core/texto.js';
import { variaveis, botaoSalvar } from '../core/biblioteca.js';
import { missao, semMissao } from './comum.js';

// heurísticas simples: cada parte do briefing deixa marcas típicas no texto
export const PARTES = [
  { id: 'papel', t: 'Papel', re: /(você é|voce e|aja como|atue como|seu papel)/i, dica: 'Comece com “Você é…”.' },
  { id: 'contexto', t: 'Contexto', re: /(público|publico|clientes?|alunos?|para quem|situação|situacao|contexto|nosso|nossa|meu |minha )/i, dica: 'Diga a situação e quem vai ler.' },
  { id: 'tarefa', t: 'Tarefa', re: /\b(escreva|crie|liste|explique|resuma|classifique|traduza|gere|sugira|revise|compare|responda|faça|monte)\b/i, dica: 'Use um verbo claro: escreva, resuma, liste…' },
  { id: 'formato', t: 'Formato', re: /(\d+\s*(frases?|linhas?|tópicos?|topicos?|palavras?|itens|parágrafos?)|json|tabela|lista|tópicos|em até|no máximo)/i, dica: 'Diga o tamanho ou a estrutura: “até 3 frases”, “em JSON”.' },
  { id: 'restricoes', t: 'Restrições', re: /(não |nao |nunca|evite|sem |apenas|somente|só )/i, dica: 'O que evitar ou garantir.' },
  { id: 'exemplos', t: 'Exemplos', re: /(exemplo|por exemplo|como este|assim:|ex\.:)/i, dica: 'Mostre uma amostra do que você quer.' },
];
export const conferir = (texto) => PARTES.map((p) => ({ ...p, ok: p.re.test(texto) }));

const MELHOR = 'Você é um professor paciente de um curso de IA para iniciantes.\nO público nunca programou e estuda em sessões curtas.\nExplique {conceito} em até 5 linhas, com uma analogia do dia a dia.\nNão use termos em inglês sem explicar.\nTermine com uma pergunta para conferir se a pessoa entendeu.\nExemplo de tom: "Token é como uma peça de Lego do texto."';

export default function ({ missao: m, feito }) {
  const mi = m ? missao(['Escreva um prompt com **as 6 partes**.'], feito) : semMissao();
  const ta = h('textarea', { rows: 8, value: 'Explique o que é RAG.', 'aria-label': 'Seu prompt', maxLength: 4000 });
  const lista = h('ul.checks');
  const info = h('div.small.muted');
  const salvar = h('div');
  const pintar = () => {
    const r = conferir(ta.value);
    clear(lista); r.forEach((p) => lista.append(h('li' + (p.ok ? '.ok' : ''), h('b', p.t), p.ok ? '' : ` — ${p.dica}`)));
    const vs = variaveis(ta.value);
    info.textContent = `Cerca de ${tokensAprox(ta.value).length} tokens.${vs.length ? ` Variáveis: ${vs.map((v) => `{${v}}`).join(' ')}` : ''}`;
    if (r.every((p) => p.ok)) mi.marcar(0);
  };
  ta.addEventListener('input', pintar); pintar();
  return h('div.lab', mi.el, ta, info, h('div.small.muted', 'Partes que o seu prompt já tem (uma conferência aproximada):'), lista,
    h('div.row.wrap', h('button.btn.small', { type: 'button', onclick: async () => toast((await copyText(ta.value)) ? 'Prompt copiado. Cole num chat para testar.' : 'Selecione e copie.') }, 'Copiar'),
      h('button.btn.small', { type: 'button', onclick: () => { clear(salvar).append(botaoSalvar(ta.value, 'Prompt do laboratório')); } }, 'Guardar na biblioteca…')), salvar,
    h('details.card.flat', h('summary', { style: { fontWeight: '700', minHeight: '44px', display: 'flex', alignItems: 'center', cursor: 'pointer' } }, 'Ver uma versão melhorada de “Explique o que é RAG”'), codeBlock(MELHOR, 'prompt'),
      h('p.small.muted', 'Compare: papel, público, tamanho, analogia, restrição e exemplo. Cada linha responde a uma pergunta que o modelo teria de adivinhar.')));
}
