// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Desafio surpresa: a cada 2 semanas, uma tarefa curta e diferente. A novidade ajuda a manter o interesse.
import { diffDays } from '../core/dia.js';
import { moduloAtual } from './curso.js';

// m = módulo mínimo em que o desafio faz sentido
export const DESAFIOS = [
  { id: 'd-cliente', m: 0, t: 'Explique em voz alta, em 1 minuto, a diferença entre cliente e servidor para alguém da sua casa (ou para o espelho).' },
  { id: 'd-downloads', m: 0, t: 'Arrume a pasta Downloads: mova 10 arquivos para o lugar certo.' },
  { id: 'd-haicai', m: 1, t: 'Peça a dois modelos um haicai sobre tokens. Qual ficou melhor, e por quê?' },
  { id: 'd-alucinacao', m: 1, t: 'Cace uma alucinação: pergunte algo sobre o seu bairro ou a sua cidade e confira a resposta numa fonte confiável.' },
  { id: 'd-cpf', m: 1, t: 'Explique para alguém, sem jargão, por que não se cola CPF num chat de IA.' },
  { id: 'd-duelo', m: 2, t: 'Duelo de prompts: a mesma tarefa com um prompt de uma linha e com as 6 partes. Compare e guarde o vencedor na biblioteca.' },
  { id: 'd-publicos', m: 2, t: 'Faça um modelo explicar “janela de contexto” para uma criança de 8 anos e depois para um engenheiro. O que mudou?' },
  { id: 'd-rag-papel', m: 3, t: 'Desenhe o caminho do RAG num papel, sem olhar a lição. Depois confira o que faltou.' },
  { id: 'd-erros-api', m: 3, t: 'No Laboratório de API, provoque de propósito um 401 e um 429. Explique cada um em uma frase.' },
  { id: 'd-automacao', m: 4, t: 'Ache uma tarefa repetitiva da sua semana e escreva o algoritmo dela em 6 passos. Dá para virar um fluxo no n8n?' },
  { id: 'd-n8n-seu', m: 4, t: 'Monte no n8n algo pequeno e só seu. Exemplo: todo dia de manhã, uma mensagem com a frase mais recente do seu diário.' },
  { id: 'd-sorteio', m: 5, t: 'Escreva um programa Python de até 10 linhas que sorteia o que estudar hoje entre 3 opções.' },
  { id: 'd-erro-diario', m: 5, t: 'Pegue um erro que apareceu no terminal nesta semana e explique-o no diário com as suas palavras.' },
  { id: 'd-mostrar', m: 6, t: 'Mostre o APE-IA para alguém e anote a primeira pergunta que a pessoa fez.' },
];

/**
 * Desafio em aberto na quinzena atual (ou null). A primeira quinzena fica sem desafio: é hora de pegar o ritmo.
 * A escolha é fixa dentro da quinzena e pula os desafios já feitos.
 */
export function desafioDaVez(S, hoje) {
  if (!S.perfil.criado) return null;
  const dias = diffDays(hoje, S.perfil.criado);
  const quinzena = Math.floor(dias / 14);
  if (quinzena < 1) return null;
  const inicio = dias - (dias % 14); // dias desde a criação até o começo desta quinzena
  const feitoNesta = Object.values(S.desafios).some((d) => diffDays(d, S.perfil.criado) >= inicio);
  if (feitoNesta) return null;
  const ma = moduloAtual(S.licoes);
  const abertos = DESAFIOS.filter((x) => x.m <= ma && !S.desafios[x.id]);
  if (!abertos.length) return null;
  // prefere os do módulo mais recente
  const max = Math.max(...abertos.map((x) => x.m));
  const pool = abertos.filter((x) => x.m >= max - 1);
  return pool[quinzena % pool.length];
}
