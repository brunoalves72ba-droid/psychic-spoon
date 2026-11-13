// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Catálogo dos laboratórios (Trilha › Laboratórios).
export const LABS = [
  { id: 'proximo', t: 'Próximo pedaço', d: 'Um modelo de brinquedo escolhendo palavra por palavra, com temperatura.', m: 1, licao: '1.2' },
  { id: 'tokens', t: 'Tokens', d: 'O texto partido em peças, palavras contra tokens.', m: 1, licao: '1.3' },
  { id: 'contexto', t: 'Janela de contexto', d: 'A mesa enche e a primeira regra sai.', m: 1, licao: '1.4' },
  { id: 'prompt', t: 'Laboratório de prompts', d: 'As 6 partes, contagem de tokens e versão melhorada.', m: 2, licao: '2.1' },
  { id: 'json', t: 'JSON', d: 'Validador com erros em português e caminho de cada campo.', m: 2, licao: '3.3' },
  { id: 'api', t: 'API de treino', d: 'Monte um pedido de chat até receber 200, sem sair do app.', m: 3, licao: '3.5' },
  { id: 'cosseno', t: 'Similaridade de cosseno', d: 'Duas setas: só a direção importa.', m: 3, licao: '3.9' },
  { id: 'chunks', t: 'Chunking', d: 'Tamanho, sobreposição e corte em fim de frase.', m: 3, licao: '3.11' },
  { id: 'rag', t: 'Mini-RAG', d: 'Busca com fonte, top-k e o prompt montado.', m: 3, licao: '3.13' },
  { id: 'n8n-expr', t: 'Expressões do n8n', d: '{{ $json.campo }} calculado sobre um item.', m: 4, licao: '4.5' },
  { id: 'n8n-if', t: 'Nó IF', d: 'Texto contra número: por que “10” vem antes de “7”.', m: 4, licao: '4.6' },
  { id: 'backoff', t: 'Limites e backoff', d: '8 pedidos, limite de 3 a cada 10 segundos.', m: 4, licao: '4.12' },
  { id: 'python', t: 'Python de bolso', d: 'Rode Python no aparelho, mesmo sem internet.', m: 5, licao: '5.2' },
  { id: 'agente', t: 'Laço do agente', d: 'Pensar, agir e observar, uma rodada por vez.', m: 6, licao: '6.1' },
];
export const lab = (id) => LABS.find((x) => x.id === id) || null;
