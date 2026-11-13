// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Módulo 3, Aula 2 — Embeddings, bancos vetoriais e RAG (3.8 a 3.14).

export const M3B = [
  {
    id: '3.8', t: 'Embeddings', min: 7,
    gancho: '“Cachorro late” e “cão ladra” não têm nenhuma palavra em comum. Como um computador saberia que dizem a mesma coisa?',
    analogia: 'Embedding é um **GPS de significados**: cada texto ganha coordenadas num mapa. Textos que querem dizer coisas parecidas ficam em pontos vizinhos.',
    ideia: [
      'Um **embedding** é uma lista de números (um *vetor*) que representa o **sentido** de um texto. Quem calcula é um **modelo de embedding**, primo dos LLMs, treinado só para isso.',
      'O mapa de verdade não tem 2 dimensões: tem centenas ou milhares. Mas a ideia é a do GPS: perto quer dizer parecido.',
      'Isso permite a **busca semântica**: procurar por significado, e não por palavra exata. A pergunta “como cancelo minha assinatura?” encontra o trecho “para encerrar o plano…”, mesmo sem palavras iguais.',
      'Usos: buscar trechos relevantes (é o coração do RAG), agrupar textos parecidos, achar duplicados, recomendar conteúdo.',
      'Três cuidados:',
      { ul: ['embedding **não é texto**: não dá para “ler” os números;', 'cada modelo define o seu mapa: vetores de **modelos diferentes não se misturam**;', 'modelos pequenos treinados em inglês buscam pior em português. Para o seu material, prefira um modelo **multilíngue**.'] },
    ],
    exemplo: [
      'Três frases no mapa:',
      { passos: ['“O cachorro late” vira um vetor, digamos `[0.81, 0.12, …]`.', '“O cão ladra” vira `[0.79, 0.15, …]`: números quase iguais, pontos vizinhos.', '“Imposto de renda” vira `[0.05, 0.92, …]`: outro canto do mapa.', 'Para a pergunta “por que meu cão faz barulho?”, o sistema calcula o vetor dela e pega os vizinhos mais próximos: as duas primeiras frases.'] },
    ],
    ex: { tipo: 'ordenar', enun: 'Ordene da frase mais parecida com “O cachorro late” até a menos parecida.',
      itens: ['O cão ladra', 'O gato mia', 'O carro buzina', 'Imposto de renda'] },
    quiz: [
      { q: 'Um embedding é um texto?', o: ['Não: é uma lista de números que representa o sentido do texto', 'Sim: é um resumo do texto', 'Sim: é o texto traduzido para o inglês'], w: 'São coordenadas num mapa de significados. Ninguém lê um embedding; compara-se um com outro.' },
      { q: 'O que a busca semântica faz que a busca por palavra exata não faz?', o: ['Encontra textos de sentido parecido, mesmo com palavras diferentes', 'Encontra só textos idênticos', 'Funciona sem computador'], w: '“Cão” encontra “cachorro” porque os dois ficam perto no mapa.' },
      { q: 'Pode-se comparar vetores gerados por modelos de embedding diferentes?', o: ['Não: cada modelo tem o seu próprio mapa', 'Sim: todos usam o mesmo mapa', 'Sim, se os textos forem em inglês'], w: 'As coordenadas de um mapa não significam nada no outro.' },
    ],
    erro: { t: 'Achar que é busca por palavra exata', d: 'Na busca semântica, “cão” encontra “cachorro”. Em compensação, ela pode escorregar em **códigos e nomes próprios**, como “pedido 48213”, em que a palavra exata é o que importa. Por isso existe a busca híbrida (lição 3.13).' },
  },
  {
    id: '3.9', t: 'Similaridade de cosseno', min: 6,
    gancho: '“Perto”, no mapa dos significados, não se mede com régua. Mede-se com um ângulo.',
    analogia: 'Cada vetor é uma **seta** saindo do mesmo ponto. Setas que apontam para o mesmo lado têm sentido parecido. O cosseno mede o quanto elas se alinham.',
    ideia: [
      'Para comparar dois embeddings, a medida mais usada é a **similaridade de cosseno**: um número que depende só do **ângulo** entre as duas setas, e não do comprimento delas.',
      { ul: ['**1**: mesma direção. Sentido praticamente igual.', '**0**: perpendiculares. Assuntos sem relação.', '**−1**: direções opostas. É raro em texto.'] },
      'Na prática, você quase nunca calcula isso à mão: o banco vetorial calcula e devolve os trechos em ordem, do mais parecido para o menos.',
      'Dois avisos:',
      { ul: ['O valor **não é porcentagem de certeza**. Um 0,62 pode ser ótimo num modelo e fraco em outro. Olhe a **ordem** dos resultados e teste com perguntas reais.', 'Alguns bancos mostram **distância** em vez de similaridade. Aí é o contrário: **menor** quer dizer mais parecido.'] },
    ],
    exemplo: [
      'Dois pares de setas num plano:',
      { passos: ['A = (3, 1) e B = (6, 2). B é A “esticada”: apontam para o mesmo lado. Cosseno = **1**.', 'A = (3, 1) e C = (−1, 3). Formam um ângulo reto. Cosseno = **0**.', 'Repare: B tem o dobro do tamanho de A e a similaridade continua 1. O tamanho não importa; só a direção.'] },
    ],
    ex: { tipo: 'lab', lab: 'cosseno', missao: 'alinhar', enun: 'Gire a seta B até a similaridade passar de 0,95. Depois, deixe a similaridade perto de 0.' },
    quiz: [
      { q: 'O que uma similaridade de cosseno alta entre dois embeddings indica?', o: ['Que os textos têm sentido parecido', 'Que os textos têm o mesmo tamanho', 'Que os textos estão no mesmo idioma'], w: 'Setas alinhadas, sentidos próximos. Tamanho do texto não entra na conta.' },
      { q: 'O que a similaridade de cosseno mede entre dois vetores?', o: ['O alinhamento das direções, ou seja, o ângulo', 'A diferença de comprimento', 'A soma dos números'], w: 'Só a direção conta. Por isso um texto curto e um longo podem ter similaridade 1.' },
      { q: 'Um banco vetorial mostra “distância” em vez de similaridade. Como ler?', o: ['Quanto menor a distância, mais parecido', 'Quanto maior a distância, mais parecido', 'Distância e similaridade são o mesmo número'], w: 'Distância pequena é vizinho próximo. É o inverso da similaridade.' },
    ],
    erro: { t: 'Misturar modelos de embedding diferentes', d: 'Se os documentos foram indexados com o modelo A, a pergunta precisa ser convertida pelo **mesmo** modelo A. Trocar no meio do caminho é comparar endereços de cidades diferentes. Trocou o modelo? Reindexe tudo.' },
  },
  {
    id: '3.10', t: 'ChromaDB', min: 8,
    gancho: 'Você tem 300 trechos de anotações virados em vetores. Onde guardar, e como achar os 3 mais parecidos com uma pergunta em milésimos de segundo?',
    analogia: 'Um banco vetorial é uma **biblioteca organizada por assunto**, e não por ordem alfabética: você chega com uma pergunta e o bibliotecário aponta a estante dos livros mais próximos do tema.',
    ideia: [
      'Um **banco de dados vetorial** guarda textos junto com os embeddings e responde rápido à pergunta “quais são os mais parecidos com isto?”.',
      'O **ChromaDB** é um banco vetorial de código aberto, simples de começar: roda no seu computador ou no Google Colab, sem servidor e sem conta.',
      'Em cada item de uma **coleção**, ele guarda quatro coisas:',
      { ul: ['`ids`: um identificador único;', '`documents`: o texto do trecho;', '`embeddings`: o vetor. Se você não fornecer, o Chroma calcula com um modelo padrão;', '`metadatas`: informações extras, como **de que arquivo o trecho veio**.'] },
      'Duas operações bastam para começar: `add` (guardar) e `query` (buscar os mais parecidos).',
      { nota: 'O modelo de embedding padrão do Chroma é pequeno e treinado sobretudo em inglês. Serve para começar. Para buscar melhor em português, troque por um modelo multilíngue: o kit do projeto mostra onde.', tipo: 'aviso' },
    ],
    exemplo: [
      'O código abaixo vem pronto. Você ainda não precisa saber Python: leia como uma receita.',
      { c: `import chromadb

cliente = chromadb.PersistentClient(path="./banco")
colecao = cliente.get_or_create_collection("anotacoes")

colecao.add(
    ids=["n1", "n2", "n3"],
    documents=[
        "Token é um pedaço de texto que o modelo processa.",
        "A janela de contexto é o limite de tokens por vez.",
        "Temperatura controla a aleatoriedade da resposta.",
    ],
    metadatas=[{"fonte": "m1.md"}, {"fonte": "m1.md"}, {"fonte": "m1.md"}],
)

r = colecao.query(query_texts=["o que limita o tamanho da conversa?"], n_results=2)
print(r["documents"][0])
print(r["metadatas"][0])`, l: 'python' },
      { passos: ['`PersistentClient` cria o banco numa pasta.', '`add` guarda 3 trechos, cada um com id e fonte.', '`query` busca os 2 trechos mais parecidos com a pergunta.', 'O resultado traz os textos **e** os metadados. É assim que a resposta final consegue citar a fonte.'] },
    ],
    ex: { tipo: 'lacunas', enun: 'Complete a receita: guardar um trecho e depois buscar.',
      molde: 'colecao.⟦1:add⟧(\n    ids=["n1"],\n    documents=["Token é um pedaço de texto."],\n    ⟦1:metadatas⟧=[{"fonte": "m1.md"}],\n)\nr = colecao.⟦1:query⟧(query_texts=["o que é token?"], ⟦1:n_results⟧=2)',
      opcoes: ['add', 'query', 'metadatas', 'n_results', 'delete', 'tokens'],
      w: '`add` guarda, `metadatas` leva a fonte, `query` busca e `n_results` diz quantos trechos trazer.' },
    mao: { t: 'Rode a receita', onde: 'pc',
      passos: ['Abra o Google Colab (colab.research.google.com) e crie um notebook.', 'Numa célula, rode `!pip install chromadb`.', 'Em outra célula, cole o código do exemplo e rode.', 'Troque a pergunta e rode de novo.'],
      criterio: 'A busca devolveu os trechos e a fonte de cada um.' },
    quiz: [
      { q: 'O que uma coleção do ChromaDB guarda para cada item?', o: ['O texto, o embedding, os metadados e um id', 'Só o texto', 'Só os números do embedding'], w: 'Texto para ler, vetor para buscar, metadados para citar e id para identificar.' },
      { q: 'Para que servem os metadados num banco vetorial?', o: ['Guardar informações como a fonte do trecho', 'Deixar a busca mais lenta', 'Substituir o embedding'], w: 'Com a fonte guardada, a resposta pode dizer de onde veio e você pode conferir.' },
      { q: 'Qual operação do ChromaDB busca os trechos mais parecidos com uma pergunta?', o: ['`query`', '`add`', '`print`'], w: '`add` guarda; `query` consulta.' },
    ],
    erro: { t: 'Não guardar a fonte', d: 'Sem o metadado de origem, o sistema acha o trecho mas não sabe dizer de onde ele veio. E resposta sem fonte não dá para conferir. Guarde sempre o arquivo e, se puder, a página ou a seção.' },
  },
  {
    id: '3.11', t: 'Chunking', min: 7,
    gancho: 'Ninguém estuda um livro inteiro de uma vez: você faz fichas. Para o RAG funcionar, os seus documentos também precisam virar fichas, do tamanho certo.',
    analogia: 'Chunking é **fazer fichas de estudo**: cortar o material em pedaços que façam sentido sozinhos. Ficha grande demais mistura assuntos; pequena demais perde o contexto.',
    ideia: [
      '**Chunking** é dividir os documentos em **pedaços** (*chunks*) antes de gerar os embeddings. Cada pedaço vira um vetor e pode ser encontrado separadamente.',
      'Por que não indexar o documento inteiro? Um vetor só para 30 páginas vira a média de todos os assuntos e não fica perto de nenhuma pergunta específica. E o trecho encontrado iria inteiro para a mesa do modelo, gastando janela com ruído.',
      'Três decisões:',
      { ul: ['**Tamanho**: um bom começo é em torno de **500 caracteres**, mais ou menos um parágrafo. Grande demais traz ruído; pequeno demais vira frase solta.', '**Sobreposição** (*overlap*): repetir um pouco do fim de um pedaço no começo do próximo (de 10 a 20%), para a ideia que caiu na fronteira não se perder.', '**Onde cortar**: de preferência em **fim de frase ou de parágrafo**.'] },
      'Não existe número mágico. Ajusta-se testando com perguntas de verdade (lição 3.14).',
    ],
    exemplo: [
      'Um texto de 1.200 caracteres, cortado de três jeitos:',
      { passos: ['**Tamanho 500, sem sobreposição**: 3 pedaços (500 + 500 + 200). Uma frase ficou cortada ao meio na fronteira.', '**Tamanho 500, sobreposição 80**: os pedaços começam em 0, 420 e 840. A frase da fronteira aparece inteira em pelo menos um deles.', '**Cortando só em fim de frase**: os tamanhos variam um pouco, mas cada pedaço se lê sozinho.'] },
    ],
    ex: { tipo: 'lab', lab: 'chunks', missao: 'afinar', enun: 'Ajuste até ter pedaços de 400 a 600 caracteres, com sobreposição e cortando em fim de frase.' },
    quiz: [
      { q: 'O que acontece quando os pedaços (chunks) são grandes demais?', o: ['Entra ruído: muito texto irrelevante junto do que interessa', 'A busca fica impossível', 'O modelo responde sempre “não sei”'], w: 'Pedaço grande mistura assuntos: o vetor fica vago e a mesa do modelo se enche de sobra.' },
      { q: 'Para que serve a sobreposição entre pedaços no chunking?', o: ['Para não perder ideias que caem na fronteira entre dois pedaços', 'Para deixar o banco menor', 'Para aumentar a temperatura'], w: 'O que foi cortado no fim de um pedaço reaparece inteiro no começo do seguinte.' },
      { q: 'Onde é melhor cortar o texto ao fazer chunking?', o: ['Em fim de frase ou de parágrafo', 'Sempre no caractere 500, exatamente', 'No meio das palavras'], w: 'Um pedaço que termina em ponto final se entende sozinho.' },
    ],
    erro: { t: 'Cortar no meio da frase', d: '“…o limite é de 30” num pedaço e “requisições por minuto” no outro: nenhum dos dois responde à pergunta. Corte em fim de frase e use sobreposição.' },
  },
  {
    id: '3.12', t: 'RAG', min: 8,
    gancho: 'Você não precisa treinar um modelo para ele responder sobre as suas anotações. Basta deixá-lo consultar o material na hora da prova.',
    analogia: 'RAG é **prova com consulta**: antes de responder, o sistema busca os trechos certos do seu material e os coloca na mesa do modelo.',
    ideia: [
      '**RAG** (*Retrieval-Augmented Generation*, geração aumentada por recuperação) junta tudo o que você viu neste módulo, em duas fases:',
      { ol: ['**Preparação**, uma vez: documentos → pedaços (chunking) → embeddings → banco vetorial.', '**Pergunta**, toda vez: pergunta → embedding da pergunta → busca dos pedaços mais parecidos → prompt com **contexto + pergunta** → resposta do LLM, citando as fontes.'] },
      'O modelo **não é treinado** com os seus documentos. Ele só lê os trechos que chegaram à mesa naquele pedido. Atualizou o documento? Reindexe, e a próxima resposta já usa o texto novo.',
      'Por que é tão usado: responde sobre material **privado** ou **recente**, reduz alucinação e permite **conferir** a fonte.',
      'O que o RAG **não** faz: milagre. Se a busca trouxer o trecho errado, o modelo responde com base no trecho errado, ou inventa. A qualidade do RAG é a qualidade da busca somada à do prompt.',
    ],
    exemplo: [
      'O prompt que o RAG monta:',
      { c: 'Responda usando SOMENTE o contexto abaixo.\nSe a resposta não estiver no contexto, diga "não encontrei".\nCite a fonte entre colchetes.\n\nContexto:\n[m1.md] A janela de contexto é o limite de tokens por vez.\n[m1.md] Entrada e saída dividem a mesma janela.\n\nPergunta: a resposta do modelo ocupa espaço na janela?', l: 'prompt' },
      'Resposta esperada: “Sim. Entrada e saída dividem a mesma janela [m1.md].” O modelo não sabia isso do seu material: leu na hora.',
    ],
    ex: { tipo: 'ordenar', enun: 'Ponha em ordem o caminho de uma pergunta no RAG.',
      itens: ['A pessoa faz a pergunta', 'A pergunta vira um embedding', 'O banco vetorial devolve os pedaços mais parecidos', 'Os pedaços entram no prompt como contexto', 'O LLM responde com base no contexto e cita a fonte'] },
    mao: { t: 'Desenhe o RAG', onde: 'qualquer',
      passos: ['Num papel, desenhe as duas fases: preparação e pergunta.', 'Marque onde entram chunking, embeddings, banco vetorial e LLM.', 'Compare com a lição e corrija o que faltou.'],
      criterio: 'O desenho tem as duas fases e você explica cada seta em voz alta.' },
    quiz: [
      { q: 'O RAG treina o modelo com os seus documentos?', o: ['Não: ele só coloca trechos relevantes no prompt', 'Sim: o modelo é retreinado a cada documento', 'Sim, mas só uma vez por dia'], w: 'O modelo continua o mesmo. O que muda é o que está na mesa dele a cada pergunta.' },
      { q: 'Qual é a ordem das etapas quando chega uma pergunta num sistema RAG?', o: ['Embedding da pergunta, busca dos trechos, prompt com contexto, resposta', 'Resposta, busca, embedding, prompt', 'Treino, teste, publicação, resposta'], w: 'Primeiro acha o material, depois responde com ele na mesa.' },
      { q: 'O que acontece no RAG quando a busca traz o trecho errado?', o: ['A resposta sai errada ou inventada', 'O modelo percebe e corrige sozinho', 'Nada: o modelo ignora o contexto'], w: 'O modelo confia no que recebeu. Busca ruim, resposta ruim.' },
    ],
    erro: { t: 'Achar que RAG elimina alucinação', d: 'Ele **reduz**. Se o trecho não foi encontrado, ou se o prompt não autoriza o “não encontrei”, o modelo ainda pode inventar. Por isso se testa (lição 3.14).' },
  },
  {
    id: '3.13', t: 'Recuperação', min: 8,
    gancho: 'O usuário perguntou sobre o “pedido 48213” e a busca semântica trouxe trechos sobre “encomendas em geral”. O sentido estava certo. A resposta, não.',
    analogia: 'Recuperar é como **pescar**: rede pequena demais perde o peixe; rede grande demais traz lixo junto. E há peixe que só sai com anzol específico.',
    ideia: [
      'A etapa de busca do RAG tem alguns botões:',
      { ul: ['**top-k**: quantos pedaços trazer. Com `k=1` você pode perder metade da resposta; com `k` alto demais, a mesa se enche de ruído e de tokens. Comece com **3 a 5**.', '**Filtro por metadados**: buscar só em certo arquivo, módulo ou data. “Só nas anotações do Módulo 3.”', '**Busca híbrida**: combinar a busca **semântica** (por sentido) com a busca por **palavra-chave** (termo exato). Essencial para **nomes próprios, siglas e códigos**.', '**Reranking**: buscar bastante, digamos 20, e usar um segundo modelo para reordenar e ficar com os 3 melhores.'] },
      'Como saber o que ajustar? Olhe os pedaços que vieram **antes** de olhar a resposta. Se o trecho certo **não veio**, o problema é de recuperação. Se veio e a resposta saiu ruim, o problema é de prompt ou de modelo.',
    ],
    exemplo: [
      'A pergunta “quais são os limites do plano gratuito?” com três valores de k:',
      { passos: ['**k=1**: veio só o trecho sobre requisições por minuto. Resposta incompleta: faltou o limite diário.', '**k=3**: vieram o limite por minuto, o limite por dia e a regra das chaves. Resposta completa.', '**k=8**: vieram os 3 certos e mais 5 de outros assuntos. A resposta ficou longa e misturou coisas.'] },
    ],
    ex: { tipo: 'lab', lab: 'rag', missao: 'k', enun: 'Faça a pergunta de exemplo com k=1, k=3 e k=8 e veja o que muda nos trechos trazidos.' },
    quiz: [
      { q: 'Que tipo de busca ajuda com nomes próprios e códigos num RAG?', o: ['A busca híbrida, que junta sentido e palavra exata', 'Só a busca semântica', 'Só aumentar o top-k'], w: 'Para “pedido 48213”, o que vale é o termo exato. A híbrida cobre os dois casos.' },
      { q: 'O que acontece quando o top-k de um RAG é alto demais?', o: ['Entram trechos irrelevantes, que confundem e gastam tokens', 'A busca fica mais precisa', 'O modelo responde mais rápido'], w: 'Mais trechos não é mais qualidade. O certo se perde no meio dos errados.' },
      { q: 'A resposta do RAG veio ruim. O que olhar primeiro?', o: ['Os trechos que a busca trouxe', 'A cor da interface', 'O tamanho da resposta'], w: 'Se o trecho certo não veio, não adianta mexer no prompt: o problema é a busca.' },
    ],
    erro: { t: 'k alto demais', d: '“Na dúvida, manda tudo” parece seguro e piora a resposta: o trecho certo se perde entre dez errados. Comece com 3 a 5 e só aumente se os testes mostrarem que falta contexto.' },
  },
  {
    id: '3.14', t: 'Avaliar RAG', min: 7,
    gancho: '“Testei com uma pergunta e funcionou!” Ótimo. E as outras 99 que os usuários vão fazer?',
    analogia: 'Avaliar um RAG é aplicar um **simulado** antes da prova: uma lista fixa de perguntas com gabarito, repetida a cada mudança.',
    ideia: [
      'Monte um **conjunto de teste**: 10 perguntas, para começar, com a **resposta esperada** e o **trecho de origem**. Inclua 2 perguntas cuja resposta **não está** no material.',
      'Para cada resposta, três verificações:',
      { ul: ['**Relevância da busca**: o trecho certo estava entre os recuperados?', '**Fidelidade**: tudo o que a resposta afirma está **no contexto**? Se afirma algo que não veio dos trechos, alucinou.', '**“Não sei” honesto**: nas perguntas de fora do material, ele disse que não encontrou?'] },
      'Anote o placar: por exemplo, 7 de 10 certas e 2 de 2 “não encontrei”. Mudou o tamanho do pedaço, o k ou o prompt? Rode o simulado de novo e compare. Sem isso, você ajusta no escuro.',
      'A meta do projeto do Módulo 3 é exatamente esta: **7 de 10** certas, com fonte, e **“não encontrei” nas 2** de fora.',
    ],
    exemplo: [
      'Três respostas no simulado:',
      { passos: ['“O que é top-k?” O trecho certo foi recuperado, a resposta é fiel e cita a fonte. **Passou.**', '“Qual é o limite diário do plano?” O trecho certo não veio, e o modelo respondeu um número mesmo assim. **Falha dupla**: de busca e de fidelidade.', '“Qual é a capital da Austrália?” Não está nas anotações. Resposta: “Não encontrei essa informação no material.” **Passou**: é o comportamento que você quer.'] },
    ],
    ex: { tipo: 'classificar', enun: 'Corrija o simulado.', baldes: ['Passou', 'Falhou na busca', 'Falhou na fidelidade'],
      itens: [
        { t: 'O trecho certo veio; a resposta repete o que ele diz, com fonte', b: 0 }, { t: 'O trecho certo não apareceu entre os recuperados', b: 1 },
        { t: 'O trecho veio, mas a resposta acrescentou um número que não está nele', b: 2, w: 'Afirmou algo que não veio do contexto: é alucinação.' }, { t: 'Pergunta de fora do material; resposta: “não encontrei”', b: 0 },
        { t: 'Vieram só trechos de outro assunto', b: 1 }, { t: 'Pergunta de fora do material; o modelo respondeu de cabeça, sem avisar', b: 2, w: 'Num RAG, a resposta tem de vir do material. De cabeça, sem aviso, é infidelidade.' },
      ] },
    mao: { t: 'Seu simulado', onde: 'qualquer',
      passos: ['Escreva 10 perguntas sobre as suas anotações dos Módulos 1 e 2, cada uma com a resposta esperada.', 'Acrescente 2 perguntas de fora do material.', 'Guarde a lista: ela é usada na missão “Teste de verdade”.'],
      criterio: 'Doze perguntas escritas, dez delas com gabarito.' },
    quiz: [
      { q: 'A resposta não está no material indexado. O que um bom RAG deve fazer?', o: ['Dizer que não encontrou', 'Responder com o que o modelo lembra do treino', 'Inventar uma fonte'], w: 'O “não encontrei” é uma resposta correta. Inventar é a pior saída.' },
      { q: 'O que é “fidelidade” na avaliação de um RAG?', o: ['Tudo o que a resposta afirma está nos trechos recuperados', 'A resposta é longa', 'O modelo respondeu rápido'], w: 'Fiel é a resposta que não acrescenta nada além do que o contexto sustenta.' },
      { q: 'Por que testar um RAG com um conjunto fixo de perguntas?', o: ['Para comparar o antes e o depois de cada ajuste', 'Para gastar a cota da API', 'Porque uma pergunta só já basta'], w: 'Mesmo simulado, mudanças diferentes: é o que mostra se o ajuste ajudou.' },
    ],
    erro: { t: 'Testar com 1 pergunta só', d: 'Uma pergunta que dá certo não prova nada. Dez perguntas com gabarito, mais duas de fora, mostram onde o sistema falha antes que os usuários descubram.' },
  },
];
