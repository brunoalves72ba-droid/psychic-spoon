// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Projeto único e acumulativo: o “Assistente Pessoal de Estudos com IA” (APE-IA).
// Cada módulo acrescenta uma parte. Missões de 10 a 25 minutos, com lista de conferência.

export const PROJETO = [
  { m: 0, t: 'A casa do projeto', entrega: 'Estrutura de pastas do APE-IA e um diário de bordo com 1 frase por sessão.',
    pronto: 'As pastas existem e o diário tem pelo menos 3 entradas.',
    missoes: [
      { id: 'm0-pastas', t: 'Monte a estrutura de pastas', min: 10, itens: ['Crie a pasta `formacao-ia` em Documentos.', 'Dentro dela, crie `modulo-0` até `modulo-6`.', 'Crie também a pasta `ape-ia`: é a casa do projeto.', 'Guarde nela um arquivo `LEIA-ME.txt` com uma frase: o que o APE-IA vai fazer.'] },
      { id: 'm0-diario', t: 'Comece o diário de bordo', min: 10, itens: ['Escreva 3 entradas no diário (uma frase por sessão de estudo).', 'Em Projeto › Diário de bordo, toque em Exportar.', 'Salve o arquivo `diario-de-bordo.md` dentro de `ape-ia`.'] },
    ] },
  { m: 1, t: 'Ficha técnica', entrega: 'Ficha técnica do APE-IA: objetivo, 2 modelos escolhidos com justificativa, 5 regras de uso responsável e um teste de alucinação documentado.',
    pronto: 'Cabe em 1 página e responde: “o que nunca entra no prompt?”.',
    missoes: [
      { id: 'm1-modelos', t: 'Compare e escolha 2 modelos', min: 20, itens: ['Faça a mesma pergunta de estudo em 2 ou 3 chats (Claude, ChatGPT, Gemini).', 'Anote: qual foi mais claro? Qual foi mais rápido? Algum errou?', 'Na ficha técnica, registre os 2 modelos escolhidos e o motivo de cada um.'] },
      { id: 'm1-regras', t: 'Escreva as regras do assistente', min: 15, itens: ['Escreva o objetivo do APE-IA em uma frase.', 'Liste 5 regras de uso responsável.', 'Responda na ficha: o que nunca entra no prompt?'] },
      { id: 'm1-alucinacao', t: 'Documente um teste de alucinação', min: 20, itens: ['Peça a um chat 3 artigos científicos com DOI sobre um tema que você conhece.', 'Confira cada DOI em search.crossref.org.', 'Registre na ficha quantos existiam de verdade e o que você aprendeu.'] },
      { id: 'm1-ficha', t: 'Feche a ficha em 1 página', min: 10, itens: ['Revise a ficha: está curta e clara?', 'Exporte em Projeto › Ficha técnica.', 'Salve `ficha-tecnica.md` em `ape-ia`.'] },
    ] },
  { m: 2, t: 'Biblioteca de prompts', entrega: 'Dez prompts testados e versionados: Tutor Socrático, Gerador de Quiz em JSON, Explicador com Analogia, Revisor de Código, Resumidor com Citações e mais cinco.',
    pronto: 'Cada prompt foi testado em 2 modelos e tirou pelo menos 3 de 4 na rubrica.',
    missoes: [
      { id: 'm2-tutor', t: 'Tutor Socrático', min: 20, itens: ['Escreva o prompt com as 6 partes (papel, contexto, tarefa, formato, restrições, exemplos).', 'Regra obrigatória: ele faz perguntas antes de entregar a resposta.', 'Teste em 2 modelos e marque a rubrica.', 'Guarde na biblioteca com a variável `{tema}`.'] },
      { id: 'm2-quiz', t: 'Gerador de Quiz em JSON', min: 20, itens: ['Peça 3 perguntas com 3 opções e o gabarito, só em JSON.', 'Cole a resposta no Laboratório de JSON: passou?', 'Ajuste o prompt até passar em 2 modelos.', 'Guarde na biblioteca.'] },
      { id: 'm2-explicador', t: 'Explicador com Analogia', min: 15, itens: ['Variáveis: `{conceito}` e `{publico}`.', 'Teste com um conceito do Módulo 1.', 'Marque a rubrica e guarde.'] },
      { id: 'm2-dois', t: 'Revisor de Código e Resumidor com Citações', min: 25, itens: ['Revisor: aponta o erro, explica e só então mostra a correção.', 'Resumidor: cada afirmação indica de que trecho veio.', 'Teste os dois em 2 modelos.', 'Guarde os dois na biblioteca.'] },
      { id: 'm2-cinco', t: 'Mais cinco prompts seus', min: 25, itens: ['Ideias: plano de estudo da semana, gerador de flashcards, tradutor de jargão, corretor de texto, simulador de entrevista.', 'Escreva, teste e marque a rubrica de cada um.', 'A biblioteca chegou a 10 prompts.'] },
      { id: 'm2-exportar', t: 'Exporte a biblioteca', min: 10, itens: ['Todos os prompts têm nota 3 ou 4 na rubrica.', 'Exporte em Projeto › Biblioteca de prompts.', 'Salve `prompts.md` em `ape-ia`.'] },
    ] },
  { m: 3, t: 'Mini-RAG com fonte', entrega: 'Um script que responde perguntas sobre as suas anotações dos Módulos 1 e 2 e cita o trecho de origem. O código vem pronto em Projeto › Kits.',
    pronto: 'Acerta pelo menos 7 de 10 perguntas e diz “não encontrei” em 2 perguntas de fora do material.',
    missoes: [
      { id: 'm3-chave', t: 'Chave e primeira chamada', min: 20, itens: ['Crie a conta gratuita no Groq e gere uma chave de API.', 'Guarde a chave num gerenciador de senhas.', 'Faça uma chamada de chat pelo Hoppscotch e receba status 200.'] },
      { id: 'm3-anotacoes', t: 'Junte o material', min: 20, itens: ['Crie a pasta `ape-ia/anotacoes`.', 'Salve lá as suas anotações dos Módulos 1 e 2 em arquivos `.md` ou `.txt` (a ficha técnica e a biblioteca de prompts também valem).', 'Confira: nada de dado pessoal de terceiros.'] },
      { id: 'm3-rodar', t: 'Rode o mini-RAG', min: 25, itens: ['Baixe o kit `mini_rag.py` em Projeto › Kits.', 'Siga o passo a passo do kit (Google Colab, sem instalar nada, ou Python no seu PC).', 'Faça uma pergunta e veja a resposta com a fonte.'] },
      { id: 'm3-teste', t: 'Teste de verdade', min: 20, itens: ['Escreva 10 perguntas com a resposta esperada.', 'Rode todas: pelo menos 7 certas, sempre com fonte.', 'Faça 2 perguntas de fora do material: ele disse “não encontrei”?', 'Anote os resultados no diário.'] },
    ] },
  { m: 4, t: 'APE-IA conversacional', entrega: 'Fluxo no n8n: chat ou webhook → agente de IA com os prompts do Módulo 2 → consulta à planilha de dúvidas → registro → alerta de erro.',
    pronto: 'Cinco conversas rodam sem erro e o workflow está exportado em JSON.',
    missoes: [
      { id: 'm4-conta', t: 'Seu n8n funcionando', min: 15, itens: ['Crie a conta de teste no n8n Cloud (14 dias) ou rode local com `npx n8n`.', 'Crie um workflow vazio chamado “APE-IA”.', 'Salve.'] },
      { id: 'm4-agente', t: 'Chat com agente', min: 25, itens: ['Adicione o Chat Trigger e o nó AI Agent.', 'Ligue um Chat Model (Groq ou Gemini) com a sua credencial.', 'Cole o prompt do Tutor Socrático na System Message.', 'Converse no chat de teste.'] },
      { id: 'm4-planilha', t: 'Planilha de dúvidas e registro', min: 25, itens: ['Crie uma planilha no Google Sheets com cabeçalhos: data, pergunta, resposta.', 'Dê ao agente a ferramenta de consultar a planilha de dúvidas frequentes.', 'Depois do agente, acrescente uma linha de registro a cada conversa.'] },
      { id: 'm4-erros', t: 'Quando algo falhar', min: 15, itens: ['Ligue Retry On Fail no nó do modelo.', 'Crie um workflow com Error Trigger que avisa você.', 'Force um erro (chave errada) e veja o alerta chegar.'] },
      { id: 'm4-entrega', t: 'Cinco conversas e exportação', min: 15, itens: ['Rode 5 conversas seguidas sem erro.', 'Confira as 5 linhas na planilha.', 'Baixe o workflow em JSON e salve em `ape-ia/n8n`.'] },
    ] },
  { m: 5, t: 'Fábrica de flashcards', entrega: 'Repositório no GitHub com um programa que lê PDFs e CSVs, chama o LLM com a chave no `.env` e gera quizzes em JSON.',
    pronto: 'O repositório tem README, `.gitignore`, `requirements.txt` e roda com um comando.',
    missoes: [
      { id: 'm5-ambiente', t: 'Bancada pronta', min: 20, itens: ['Python 3.10 ou mais novo instalado (`python --version`).', 'VS Code instalado com a extensão Python.', 'Pasta `ape-ia/fabrica` com um `.venv` criado e ativado.'] },
      { id: 'm5-ler', t: 'Ler os arquivos', min: 25, itens: ['O script lê um PDF com `pypdf` e mostra o texto.', 'O script lê um CSV e mostra as linhas.', 'PDF escaneado não tem texto: escolha um PDF com texto de verdade.'] },
      { id: 'm5-gerar', t: 'Gerar os flashcards', min: 25, itens: ['A chave fica no `.env` e o `.env` está no `.gitignore`.', 'O script pede 10 flashcards em JSON e valida com `json.loads`.', 'Se o JSON vier inválido, ele tenta de novo.'] },
      { id: 'm5-csv', t: 'Do JSON para o app', min: 15, itens: ['O script salva `flashcards.csv` com as colunas `frente;verso`.', 'Em Revisar › Importar cartões, importe o arquivo.', 'Os cartões que você gerou apareceram na sua revisão.'] },
      { id: 'm5-repo', t: 'Publicar no GitHub', min: 20, itens: ['README explica o que é e como rodar.', '`requirements.txt` lista as bibliotecas.', '`git status` não mostra o `.env`.', 'Repositório publicado e rodando com um comando.'] },
    ] },
  { m: 6, t: 'APE-IA v1.0', entrega: 'Agente com RAG sobre todas as anotações, ferramenta “gerar quiz”, memória de preferências, interface Streamlit, URL pública, README com arquitetura, limitações e política de LGPD, e vídeo de 2 minutos.',
    pronto: 'Um amigo faz 3 perguntas pela URL e recebe respostas com fonte, e o agente diz “não sei” fora do material.',
    missoes: [
      { id: 'm6-agente', t: 'Agente com busca nas anotações', min: 25, itens: ['Agente criado com `create_agent`.', 'Ferramenta `buscar_anotacoes` consulta o ChromaDB.', 'A resposta cita de que arquivo veio cada trecho.'] },
      { id: 'm6-quiz', t: 'Ferramenta “gerar quiz”', min: 20, itens: ['Nova ferramenta com docstring clara.', 'Ela usa o seu prompt Gerador de Quiz em JSON.', 'O agente escolhe sozinho quando usar cada ferramenta.'] },
      { id: 'm6-memoria', t: 'Memória', min: 20, itens: ['A conversa lembra o que foi dito (memória de curto prazo, por `thread_id`).', 'Uma preferência sua fica guardada entre sessões (por exemplo: “explique com analogias”).', 'Nada de dado sensível na memória.'] },
      { id: 'm6-streamlit', t: 'Interface no Streamlit', min: 25, itens: ['`streamlit run app.py` abre o chat no navegador.', 'O histórico usa `st.session_state` e não some.', 'As fontes aparecem junto da resposta.'] },
      { id: 'm6-deploy', t: 'Endereço público', min: 25, itens: ['Repositório no GitHub com `requirements.txt`.', 'App publicado no Streamlit Community Cloud.', 'A chave está nos Secrets do Streamlit, fora do repositório.', 'A URL abre em outro aparelho.'] },
      { id: 'm6-final', t: 'Entrega final', min: 25, itens: ['README com arquitetura, limitações e política de LGPD.', 'Vídeo de 2 minutos mostrando o APE-IA.', 'Um amigo fez 3 perguntas pela URL e recebeu respostas com fonte.', 'Fora do material, o agente respondeu “não sei”.'] },
    ] },
];

export const missao = (id) => { for (const p of PROJETO) { const x = p.missoes.find((q) => q.id === id); if (x) return { ...x, m: p.m }; } return null; };
export const feitaMissao = (missoes, id) => !!(missoes[id] && missoes[id].feita);
export function progressoProjeto(missoes, m) {
  const lista = PROJETO[m].missoes;
  const feitas = lista.filter((x) => feitaMissao(missoes, x.id)).length;
  return { feitas, total: lista.length, frac: feitas / lista.length, completo: feitas === lista.length };
}
/** Próxima missão em aberto, olhando só os módulos até `ateModulo` (inclusive). */
export function proximaMissao(missoes, ateModulo) {
  for (const p of PROJETO) { if (p.m > ateModulo) break; const x = p.missoes.find((q) => !feitaMissao(missoes, q.id)); if (x) return { ...x, m: p.m }; }
  return null;
}
