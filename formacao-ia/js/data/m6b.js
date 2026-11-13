// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Módulo 6, Aula 2 — Multiagentes (6.8 a 6.11).
// A ementa cita o Flowise, descontinuado em 2026: a lição 6.11 ensina o conceito e indica alternativas ativas.

export const M6B = [
  {
    id: '6.8', t: 'Quando (não) usar multiagentes', min: 7,
    gancho: '“Se um agente é bom, cinco devem ser ótimos.” É uma das frases mais caras da IA.',
    analogia: 'Multiagentes é montar uma **equipe**. Equipe faz sentido quando o trabalho é grande e tem especialidades. Para trocar uma lâmpada, uma pessoa basta: chamar cinco só cria reunião.',
    ideia: [
      'Um sistema **multiagente** divide o trabalho entre vários agentes, cada um com o seu papel, as suas instruções e as suas ferramentas, e com alguma forma de coordenação.',
      '**Os custos são reais**: mais chamadas ao modelo (mais tokens e mais tempo), mais pontos de falha e a parte mais difícil, que é **passar o contexto** de um agente para outro sem perder informação. Depurar também fica mais difícil.',
      '**Quando vale:**',
      { ul: ['a tarefa tem **etapas com especialidades diferentes**: pesquisar não é escrever, que não é revisar;', 'as instruções de um agente só ficaram **longas e contraditórias**;', 'as ferramentas passaram do número que um agente escolhe bem;', 'partes do trabalho podem rodar **em paralelo**;', 'convém ter um **revisor independente**.'] },
      '**Quando não vale:** a tarefa é simples, um agente com 3 ferramentas resolve, ou você ainda não tem testes do agente único.',
      'A ordem certa: **fluxo fixo, depois um agente, depois vários agentes**. Só suba um degrau quando o de baixo não deu conta e você sabe dizer por quê.',
    ],
    exemplo: [
      'Gerar uma aula sobre tokens:',
      { passos: ['**Um agente**: recebe “crie uma aula sobre tokens com 3 perguntas de revisão” e faz tudo num prompt só. Rápido e barato. Para uma aula curta, resolve.', '**Dois agentes**: o Professor escreve a aula; o Examinador, que não viu o rascunho nascer, cria as perguntas e aponta o que ficou confuso. Custa o dobro de chamadas, e a revisão independente pega erros que o autor não vê.', '**A decisão**: para uma aula por semana, um agente. Para 200 aulas publicadas para alunos, a revisão compensa.'] },
    ],
    ex: { tipo: 'classificar', enun: 'Um agente ou uma equipe?', baldes: ['Um agente basta', 'Vale uma equipe'],
      itens: [
        { t: 'Responder dúvidas do curso consultando as anotações', b: 0 }, { t: 'Pesquisar em várias fontes, escrever um relatório e revisá-lo de forma independente', b: 1 }, { t: 'Fazer contas e dizer a data', b: 0 },
        { t: 'Um agente cujas instruções viraram 3 páginas de regras que se contradizem', b: 1 }, { t: 'Resumir um texto', b: 0 }, { t: 'Tarefas independentes que podem rodar em paralelo, cada uma com as suas ferramentas', b: 1 },
      ] },
    mao: { t: 'Um contra dois', onde: 'qualquer',
      passos: ['Num chat, peça: “Crie uma aula de 10 linhas sobre tokens, com 3 perguntas.”', 'Em outra conversa, peça só a aula.', 'Numa terceira, cole a aula e peça: “Você é um examinador exigente: crie 3 perguntas e aponte 1 trecho confuso.”', 'Compare os dois caminhos.'],
      criterio: 'Você escreveu no diário uma vantagem e um custo de dividir o trabalho.' },
    quiz: [
      { q: 'Mais agentes significam sempre um resultado melhor?', o: ['Não: aumentam o custo, a lentidão e os pontos de falha', 'Sim: cada agente soma qualidade', 'Sim, a partir de cinco agentes'], w: 'Cada agente a mais é mais uma chamada, mais um prompt e mais um lugar para errar.' },
      { q: 'Qual é a parte mais difícil de um sistema multiagente?', o: ['Passar o contexto de um agente para outro sem perder informação', 'Escolher o nome dos agentes', 'Instalar o Python'], w: 'O que um agente sabe não passa sozinho para o outro. Alguém precisa resumir e entregar.' },
      { q: 'Qual é a ordem recomendada ao projetar uma solução com IA?', o: ['Fluxo fixo, depois um agente, depois vários agentes', 'Começar com dez agentes e ir tirando', 'Sempre multiagente'], w: 'Comece pelo mais simples que resolve. Complexidade só entra com motivo.' },
    ],
    erro: { t: 'Multiagente em tarefa simples', d: 'Cinco agentes para responder a uma dúvida gastam cinco vezes mais e erram em cinco lugares. Se um agente com boas instruções resolve, o trabalho está pronto.' },
  },
  {
    id: '6.9', t: 'Papéis', min: 7,
    gancho: 'Numa equipe ruim, todo mundo faz um pouco de tudo e ninguém responde por nada. Com agentes é igual.',
    analogia: 'Uma equipe de agentes é uma **redação de jornal**: o repórter apura, o redator escreve, o revisor confere, e o editor-chefe, que é o **supervisor**, decide quem pega cada tarefa.',
    ideia: [
      'Num sistema multiagente, cada agente tem um **papel**: um system prompt enxuto, poucas ferramentas e uma entrega clara.',
      'Uma equipe para o APE-IA criar material de estudo:',
      { ul: ['**Pesquisador**: busca nas anotações e devolve os trechos com a fonte. Ferramenta: `buscar_anotacoes`.', '**Professor**: escreve a explicação com o que o Pesquisador trouxe. Não busca nada.', '**Examinador**: cria as perguntas e confere se a explicação responde a elas.'] },
      'Duas formas de coordenar:',
      { ul: ['**Esteira** (*pipeline*): a ordem é fixa. Pesquisador, Professor, Examinador. Simples e previsível.', '**Supervisor**: um agente coordenador recebe o pedido, **decide** qual especialista chamar, junta os resultados e responde. É flexível, e mais caro.'] },
      'Na LangChain 1.x, um jeito direto de fazer o supervisor é transformar cada especialista numa **ferramenta** do agente principal: ele “chama” o Professor como chamaria a calculadora.',
      'As regras de ouro: papéis **sem sobreposição**; cada agente recebe **só o contexto de que precisa**; e a entrega de um é escrita para ser a entrada do outro.',
    ],
    exemplo: [
      'O pedido é “crie uma aula sobre chunking”:',
      { passos: ['O **supervisor** lê o pedido e chama o Pesquisador.', 'O **Pesquisador** busca “chunking” nas anotações e devolve 3 trechos com a fonte.', 'O supervisor passa os trechos ao **Professor**, que escreve 10 linhas com uma analogia.', 'O **Examinador** recebe a aula, cria 3 perguntas e avisa: “a aula não explica a sobreposição”.', 'O supervisor devolve a aula ao Professor com o aviso e entrega a versão final.'] },
    ],
    ex: { tipo: 'classificar', enun: 'De quem é cada tarefa?', baldes: ['Pesquisador', 'Professor', 'Examinador', 'Supervisor'],
      itens: [
        { t: 'Buscar trechos nas anotações e devolver com a fonte', b: 0 }, { t: 'Escrever a explicação com uma analogia', b: 1 }, { t: 'Criar 3 perguntas sobre a aula', b: 2 },
        { t: 'Decidir qual especialista chamar a seguir', b: 3 }, { t: 'Apontar que a explicação deixou um ponto confuso', b: 2 }, { t: 'Juntar os resultados e responder ao usuário', b: 3 },
      ] },
    quiz: [
      { q: 'O que faz o supervisor numa equipe de agentes?', o: ['Decide qual especialista chamar e junta os resultados', 'Escreve todo o conteúdo sozinho', 'Guarda as chaves de API'], w: 'Ele roteia e coordena. O trabalho especializado é dos outros.' },
      { q: 'Qual é a diferença entre coordenar agentes em esteira e com supervisor?', o: ['Na esteira a ordem é fixa; o supervisor decide a ordem a cada pedido', 'A esteira usa mais agentes', 'Não há diferença'], w: 'Esteira é previsível e barata. Supervisor é flexível e custa mais chamadas.' },
      { q: 'Como devem ser os papéis numa equipe de agentes?', o: ['Sem sobreposição, com poucas ferramentas e uma entrega clara cada um', 'Todos iguais, para garantir', 'Quanto mais ferramentas por agente, melhor'], w: 'Cada agente faz uma coisa bem feita e sabe para quem entrega.' },
    ],
    erro: { t: 'Papéis sobrepostos', d: 'Dois agentes que “pesquisam e escrevem” disputam a mesma tarefa, repetem trabalho e se contradizem. Se você não consegue dizer em uma frase o que **só** aquele agente faz, o papel está mal definido.' },
  },
  {
    id: '6.10', t: 'LangGraph', min: 8,
    gancho: 'O `create_agent` decide o caminho sozinho. E quando você quer mandar no caminho: primeiro pesquisa, depois escreve, depois revisa, e só volta se o revisor reprovar?',
    analogia: 'O LangGraph é um **mapa de metrô** para os seus agentes: as estações são os **nós**, os trilhos são as **arestas** e o **estado** é a mochila que o passageiro carrega de estação em estação.',
    ideia: [
      '**LangGraph** é a biblioteca que fica por baixo do `create_agent`. Com ela, você desenha o fluxo como um **grafo**:',
      { ul: ['**Estado**: um dicionário compartilhado. Cada nó lê o estado e devolve o que quer atualizar.', '**Nós**: funções Python. Podem chamar um LLM, uma ferramenta ou só transformar dados.', '**Arestas**: as ligações. “Depois do pesquisador, vá ao professor.” Podem ser **condicionais**: “se o examinador reprovou, volte ao professor”.'] },
      'Serve para ter **controle fino do fluxo e do estado**: ordem garantida, laços com limite, pausas para aprovação humana e retomada depois de uma falha.',
      'Use quando o `create_agent` não basta porque você precisa **impor** o caminho. Não use no começo: um agente simples com boas ferramentas resolve a maioria dos casos, e o grafo acrescenta código e conceitos.',
      'O exemplo abaixo roda **sem modelo nenhum**: os nós só montam textos. É de propósito, para você enxergar o estado passando de mão em mão.',
    ],
    exemplo: [
      { c: 'from typing import TypedDict\nfrom langgraph.graph import StateGraph, START, END\n\nclass Estado(TypedDict):\n    tema: str\n    pesquisa: str\n    aula: str\n    quiz: str\n\ndef pesquisador(estado: Estado):\n    return {"pesquisa": f"Fatos sobre {estado[\'tema\']}"}\n\ndef professor(estado: Estado):\n    return {"aula": f"Aula baseada em: {estado[\'pesquisa\']}"}\n\ndef examinador(estado: Estado):\n    return {"quiz": f"3 perguntas sobre: {estado[\'aula\']}"}\n\ngrafo = StateGraph(Estado)\ngrafo.add_node("pesquisador", pesquisador)\ngrafo.add_node("professor", professor)\ngrafo.add_node("examinador", examinador)\ngrafo.add_edge(START, "pesquisador")\ngrafo.add_edge("pesquisador", "professor")\ngrafo.add_edge("professor", "examinador")\ngrafo.add_edge("examinador", END)\n\napp = grafo.compile()\nresultado = app.invoke({"tema": "tokens"})\nprint(resultado["quiz"])', l: 'python', t: 'grafo.py' },
      { passos: ['`Estado` declara os campos da mochila.', 'Cada função recebe o estado e devolve **só o que mudou**.', '`add_edge` liga as estações: início, pesquisador, professor, examinador, fim.', '`invoke` começa só com o tema e devolve o estado final, com os quatro campos preenchidos.'] },
    ],
    ex: { tipo: 'ordenar', enun: 'Ponha em ordem a montagem de um grafo.',
      itens: ['Definir o estado: os campos compartilhados', 'Escrever as funções que serão os nós', 'Adicionar os nós ao grafo', 'Ligar os nós com arestas, do início ao fim', 'Compilar o grafo e chamar invoke'] },
    mao: { t: 'Leia a mochila', onde: 'pc',
      passos: ['No venv, rode `pip install langgraph`.', 'Salve o exemplo como `grafo.py` e rode.', 'Troque o tema e acrescente `print(resultado)` para ver o estado inteiro.'],
      criterio: 'Você viu o estado final com os quatro campos e explica o que cada nó acrescentou.' },
    quiz: [
      { q: 'Para que serve o LangGraph?', o: ['Para ter controle fino do fluxo e do estado de agentes', 'Para desenhar gráficos de vendas', 'Para substituir o banco vetorial'], w: 'Apesar do nome, não é de gráficos: é de grafos, isto é, nós ligados por arestas.' },
      { q: 'No LangGraph, o que é o estado?', o: ['O dicionário compartilhado que os nós leem e atualizam', 'A cidade onde fica o servidor', 'O nome do grafo'], w: 'É a mochila que passa de nó em nó, ganhando campos pelo caminho.' },
      { q: 'O que uma aresta condicional permite num grafo do LangGraph?', o: ['Escolher o próximo nó conforme o resultado, como voltar se a revisão reprovar', 'Rodar o grafo sem estado', 'Apagar um nó'], w: 'É a bifurcação do grafo: o IF do n8n, agora entre agentes.' },
    ],
    erro: { t: 'Começar por ele', d: 'Desenhar grafos antes de ter um agente simples funcionando é construir o metrô antes de saber aonde as pessoas querem ir. Faça o agente, teste, e só leve para o LangGraph o que pedir controle de fluxo.' },
  },
  {
    id: '6.11', t: 'Builders visuais', min: 7,
    gancho: 'A ementa manda usar o Flowise. Em 2026, o Flowise foi encerrado. O que fazer quando a ferramenta do tutorial morre?',
    analogia: 'Builders visuais são o **Lego dos agentes**: os conceitos que você escreveu em Python (modelo, prompt, ferramenta, memória, RAG) viram blocos na tela. Trocar de marca de Lego é fácil quando você sabe o que cada peça faz.',
    ideia: [
      '**Builders visuais** montam fluxos de IA com blocos e setas, como o n8n, só que voltados para LLMs. Dois desenhos aparecem em quase todos:',
      { ul: ['**chatflow**: uma conversa em linha reta. Entrada, prompt, modelo e resposta, com RAG ou memória no caminho.', '**agentflow**: um agente no centro, com ferramentas, decisões e ramificações.'] },
      { nota: 'O Flowise foi descontinuado. A Workday comprou o projeto em agosto de 2025. Em 29/7/2026 a equipe anunciou o encerramento e congelou o código na versão 3.1.4; o repositório foi arquivado em agosto, e o fim de vida foi em 31/8/2026. O código continua aberto, mas há falhas de segurança conhecidas que **não serão corrigidas**. Não use em projeto novo.', tipo: 'aviso' },
      'Para praticar hoje:',
      { ul: ['**Langflow**: código aberto, visual, feito sobre o ecossistema Python. Roda no seu computador.', '**Dify**: plataforma aberta com chatflows, workflows, agentes e base de conhecimento (RAG) embutida. Tem versão em nuvem.', '**n8n**: você já conhece. O nó AI Agent cobre o agentflow.'] },
      'A lição que fica: ferramentas **mudam e morrem**; os conceitos ficam. Antes de adotar uma, confira o último lançamento, a atividade do repositório, quem mantém e como **exportar** o seu trabalho.',
    ],
    exemplo: [
      'O mesmo APE-IA em três builders:',
      { passos: ['**n8n**: Chat Trigger → AI Agent, com Chat Model, Simple Memory e uma tool de busca.', '**Langflow**: Chat Input → Agent, com o componente do modelo e uma ferramenta de busca no banco vetorial → Chat Output.', '**Dify**: um app do tipo Chatflow, com a base de conhecimento ligada a um nó de LLM.', 'Mudam os nomes dos blocos. As cinco peças do agente são as mesmas.'] },
    ],
    ex: { tipo: 'classificar', enun: 'Bom caminho em 2026?', baldes: ['Bom caminho', 'Evite'],
      itens: [
        { t: 'Langflow', b: 0 }, { t: 'Dify', b: 0 }, { t: 'n8n', b: 0 }, { t: 'Flowise', b: 1, w: 'Descontinuado em agosto de 2026, com falhas de segurança que não serão corrigidas.' },
        { t: 'Um tutorial de 2024 que manda instalar o Flowise', b: 1 }, { t: 'Uma ferramenta com lançamentos recentes e repositório ativo', b: 0 },
      ] },
    mao: { t: 'O mesmo chat em outro Lego', onde: 'qualquer',
      passos: ['Escolha o Langflow ou o Dify. A versão em nuvem do Dify dispensa instalação.', 'Monte um chatflow simples: entrada, modelo com o seu prompt de Tutor e saída.', 'Compare com o que você fez no n8n.'],
      criterio: 'O chat respondeu, e você aponta no builder onde ficam o modelo, o prompt e a memória.' },
    quiz: [
      { q: 'Por que não usar o Flowise em um projeto novo?', o: ['Foi descontinuado e não recebe mais correções de segurança', 'Porque é pago', 'Porque só funciona em inglês'], w: 'Software sem manutenção acumula falhas que ninguém conserta.' },
      { q: 'Qual é a diferença entre um chatflow e um agentflow?', o: ['O chatflow segue uma linha reta; o agentflow tem um agente que decide', 'O chatflow não usa modelo', 'São dois nomes para a mesma coisa'], w: 'É a mesma diferença entre o fluxo fixo e o agente, agora em blocos.' },
      { q: 'O que conferir antes de adotar uma ferramenta de IA?', o: ['Se ela está ativa, quem mantém e como exportar o seu trabalho', 'Só se o site é bonito', 'Só o número de seguidores'], w: 'Ferramentas acabam. Quem consegue exportar, migra.' },
    ],
    erro: { t: 'Seguir tutorial antigo', d: 'O vídeo é de 2024, a ferramenta mudou ou acabou, e você perde uma tarde brigando com telas que não existem mais. Confira a data do tutorial e o estado atual do projeto antes de começar.' },
  },
];
