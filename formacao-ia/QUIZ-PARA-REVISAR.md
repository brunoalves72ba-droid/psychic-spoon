# Quiz das aulas — para revisar

Cada aula tem 3 perguntas de múltipla escolha, feitas a partir do texto da aula. ✔ marca a resposta certa. Para corrigir algo, edite a aula em `js/data/` (a primeira opção de cada pergunta é a certa) e rode `npm run precache`.

## Módulo 0 — Pré-requisitos

### 0.1 Arquivos, pastas e extensões

1. Um arquivo `.csv` guarda que tipo de conteúdo?
   - ✔ Uma tabela escrita em texto
   - Uma imagem
   - Um programa em Python
   - _Explicação:_ CSV quer dizer valores separados por vírgula. Cada linha do arquivo é uma linha da tabela.

2. No caminho `formacao-ia/modulo-2/prompts.md`, qual pasta contém o arquivo?
   - ✔ `modulo-2`
   - `formacao-ia`
   - `prompts.md`
   - _Explicação:_ O caminho se lê da esquerda para a direita: formacao-ia contém modulo-2, que contém prompts.md.

3. Para que serve a extensão no nome de um arquivo?
   - ✔ Indicar o tipo de conteúdo e qual programa abre
   - Deixar o arquivo mais leve
   - Proteger o arquivo com senha
   - _Explicação:_ A extensão é só uma etiqueta: ela diz ao computador (e a você) o que esperar lá dentro.

### 0.2 O que é a internet

1. Wi-Fi e internet são a mesma coisa?
   - ✔ Não: o Wi-Fi é só a ligação sem fio até o roteador
   - Sim: são dois nomes para a mesma rede
   - Não: o Wi-Fi é a internet mais rápida
   - _Explicação:_ Dá para ter Wi-Fi sem internet (roteador ligado, provedor fora do ar) e internet sem Wi-Fi (cabo ou dados móveis).

2. O que é um endereço IP?
   - ✔ O número que identifica uma máquina na rede
   - A senha do Wi-Fi
   - O nome de um site, como wikipedia.org
   - _Explicação:_ O nome do site é para pessoas; o IP é o endereço que as máquinas usam. O DNS liga um ao outro.

3. Quando você pergunta algo ao ChatGPT, onde a resposta é calculada?
   - ✔ Em computadores da empresa, alcançados pela internet
   - No seu próprio aparelho
   - No roteador da sua casa
   - _Explicação:_ Seu aparelho só envia a pergunta e mostra a resposta. O cálculo pesado acontece longe dali.

### 0.3 Cliente e servidor

1. Na conversa entre cliente e servidor, quem responde aos pedidos?
   - ✔ O servidor
   - O cliente
   - O roteador
   - _Explicação:_ O cliente pede, o servidor responde. O roteador só encaminha.

2. Onde roda o modelo de IA quando você usa o ChatGPT pelo navegador?
   - ✔ Nos servidores da empresa
   - No seu computador
   - Dentro do navegador
   - _Explicação:_ O navegador é só a janela. O modelo precisa de máquinas muito maiores que um PC comum.

3. O que acontece com o texto que você digita num chat de IA?
   - ✔ É enviado pela internet ao servidor da empresa
   - Fica só no seu aparelho
   - É apagado antes de sair do navegador
   - _Explicação:_ Para responder, o servidor precisa receber o texto. Por isso não se cola dado sensível num chat.

### 0.4 Algoritmo

1. Num algoritmo, a ordem dos passos importa?
   - ✔ Sim: trocar a ordem pode mudar ou estragar o resultado
   - Não: basta que todos os passos existam
   - Só importa em programas grandes
   - _Explicação:_ Despejar a água antes de pôr o pó não faz café. Ordem é parte da receita.

2. O que o computador faz quando falta um passo “óbvio” na receita?
   - ✔ Executa só o que está escrito, sem adivinhar
   - Completa o passo sozinho
   - Para e pergunta o que fazer
   - _Explicação:_ O que é óbvio para você não existe para a máquina. Uma IA até tenta adivinhar, e às vezes adivinha errado.

### 0.5 Decisões e repetições

1. Para que serve um laço (repetição)?
   - ✔ Repetir um bloco de passos sem reescrevê-lo
   - Escolher entre dois caminhos
   - Guardar um valor para usar depois
   - _Explicação:_ Escolher caminho é decisão. Guardar valor é variável. Laço é para repetir.

2. O que todo laço precisa ter para não rodar para sempre?
   - ✔ Uma condição de parada
   - Pelo menos dez passos
   - Uma decisão dentro dele
   - _Explicação:_ Sem condição de parada, o programa trava repetindo. Sempre pergunte: o que faz isso parar?

3. Em “se chover, levo guarda-chuva; senão, vou de óculos escuros”, o que é “chover”?
   - ✔ A condição que decide o caminho
   - O laço
   - O resultado
   - _Explicação:_ A condição é o teste. O resultado do teste escolhe qual caminho seguir.

### 0.6 Variáveis e tipos

1. O valor `"25"`, com aspas, é um número?
   - ✔ Não: com aspas é texto
   - Sim: as aspas não mudam nada
   - Depende do programa
   - _Explicação:_ Aspas transformam qualquer coisa em texto. Para fazer contas, o valor tem de estar sem aspas.

2. Em `idade = 25`, o que é `idade`?
   - ✔ O nome da variável, a etiqueta da caixa
   - O valor guardado
   - O tipo do dado
   - _Explicação:_ idade é a etiqueta. 25 é o valor. O tipo é número.

3. Quanto vale `"25" + "1"` quando os dois são textos?
   - ✔ `"251"`: os textos são colados
   - `26`
   - `"26"`
   - _Explicação:_ Somar textos é colar um no outro. Só números são somados de verdade.

## Módulo 1 — IA generativa e LLMs

### 1.1 IA, ML e IA generativa

1. Toda IA é generativa?
   - ✔ Não: muita IA só classifica ou prevê, sem criar conteúdo
   - Sim: IA e IA generativa são sinônimos
   - Sim, desde que o ChatGPT foi lançado
   - _Explicação:_ Filtro de spam e recomendação de filmes são IA e não geram nada novo.

2. O que define o machine learning?
   - ✔ Aprender padrões a partir de exemplos
   - Seguir regras escritas uma a uma por programadores
   - Pensar como um ser humano
   - _Explicação:_ No ML, o programa descobre as regras sozinho, olhando muitos exemplos.

3. O que uma IA generativa faz que um filtro de spam não faz?
   - ✔ Produz conteúdo novo, como texto ou imagem
   - Usa dados para aprender
   - Roda em servidores
   - _Explicação:_ Os dois aprendem com dados e rodam em servidores. Só a generativa cria conteúdo.

### 1.2 O que é um LLM

1. O que um LLM prevê a cada passo?
   - ✔ O próximo token do texto
   - A resposta inteira de uma vez
   - A página da internet onde está a resposta
   - _Explicação:_ Um token por vez. A resposta completa é a soma de muitas previsões pequenas.

2. Por que a mesma pergunta pode receber respostas diferentes de um LLM?
   - ✔ Porque há um sorteio entre as continuações prováveis
   - Porque o modelo aprende com cada conversa na hora
   - Porque a internet mudou entre as duas perguntas
   - _Explicação:_ O modelo não muda entre uma pergunta e outra. O que muda é o resultado do sorteio.

3. Um LLM responde consultando um banco de fatos?
   - ✔ Não: ele gera a continuação mais provável
   - Sim: procura a resposta num banco de dados
   - Sim: pesquisa no Google a cada pergunta
   - _Explicação:_ Alguns produtos acoplam uma busca na web ao modelo, mas o modelo em si só gera texto provável.

### 1.3 Tokens

1. Um token é sempre uma palavra inteira?
   - ✔ Nem sempre: pode ser um pedaço de palavra, um espaço ou um sinal
   - Sim: cada palavra é um token
   - Não: cada letra é um token
   - _Explicação:_ Palavras comuns costumam ser 1 token. As outras são montadas com vários pedaços.

2. Numa API de IA, quais tokens entram na conta?
   - ✔ Os de entrada e os de saída
   - Só os que você envia
   - Só os que o modelo escreve
   - _Explicação:_ Você paga pelo que envia e pelo que recebe. Em geral, o token de saída é o mais caro.

3. Por que o mesmo texto costuma gastar mais tokens em português do que em inglês?
   - ✔ Palavras com acentos e flexões se partem em mais pedaços
   - Porque o português tem menos palavras
   - Porque as empresas cobram mais por idioma
   - _Explicação:_ Os tokenizadores foram ajustados com muito texto em inglês, então o inglês “encaixa” em menos peças.

### 1.4 Janela de contexto

1. A resposta que o modelo escreve ocupa espaço na janela de contexto?
   - ✔ Sim: entrada e saída dividem a mesma janela
   - Não: só a pergunta conta
   - Só se passar de mil palavras
   - _Explicação:_ Tudo o que entra e tudo o que sai precisa caber na mesma mesa.

2. Por que um chat parece lembrar o que você disse antes?
   - ✔ O aplicativo reenvia o histórico a cada mensagem
   - O modelo guarda cada conversa na memória dele
   - O modelo é treinado de novo a cada resposta
   - _Explicação:_ O modelo não guarda nada. Quem guarda e reenvia é o aplicativo.

3. O que acontece quando a conversa não cabe mais na janela de contexto?
   - ✔ As partes mais antigas são cortadas ou resumidas
   - O modelo aumenta a janela sozinho
   - A conversa inteira é apagada
   - _Explicação:_ Por isso instruções do início podem sumir em conversas muito longas.

### 1.5 Temperatura

1. Qual temperatura combina com extrair dados de uma nota fiscal?
   - ✔ Baixa, perto de 0
   - Alta, acima de 1
   - Tanto faz
   - _Explicação:_ Em extração de dados você quer o mesmo resultado sempre. Isso é temperatura baixa.

2. O que acontece quando a temperatura de um modelo sobe?
   - ✔ Ele arrisca opções menos prováveis e varia mais
   - Ele fica mais inteligente
   - A resposta fica mais curta
   - _Explicação:_ Subir a temperatura espalha as chances entre mais candidatos.

3. Temperatura zero garante que a resposta está correta?
   - ✔ Não: só deixa a resposta mais previsível
   - Sim: zero elimina os erros
   - Sim, mas só para perguntas curtas
   - _Explicação:_ Previsível não é o mesmo que certo. O mais provável também pode estar errado.

### 1.6 Panorama de modelos em 2026

1. O Groq é um modelo de IA?
   - ✔ Não: é uma plataforma que roda modelos abertos
   - Sim: é o modelo da empresa Groq
   - Sim: é uma versão do GPT
   - _Explicação:_ No Groq você escolhe qual modelo aberto usar. Ele é a “locadora”, não o “carro”.

2. Qual é um bom motivo para escolher um modelo pequeno?
   - ✔ A tarefa é simples e repetida, e custo e velocidade importam
   - Modelos pequenos erram menos
   - Modelos pequenos têm a maior janela de contexto
   - _Explicação:_ Modelo grande em tarefa simples é pagar caminhão para levar uma caixa.

3. Quais critérios ajudam a escolher um modelo de IA?
   - ✔ Qualidade na tarefa, custo, velocidade e janela de contexto
   - Fama da empresa e data de lançamento
   - Só o preço
   - _Explicação:_ E o primeiro critério se descobre testando com a sua tarefa, não lendo propaganda.

### 1.7 Alucinações

1. O que é uma alucinação de LLM?
   - ✔ Uma afirmação falsa apresentada com aparência de verdadeira
   - Uma resposta que demora demais
   - Um erro de digitação do modelo
   - _Explicação:_ O perigo está na aparência: o texto errado vem tão bem escrito quanto o certo.

2. Como reduzir alucinações de um LLM?
   - ✔ Fornecer as fontes e conferir o que importa
   - Escrever o prompt em letras maiúsculas
   - Usar sempre o modelo mais caro
   - _Explicação:_ Fonte na mesa (RAG) e conferência humana. Modelos caros também alucinam.

3. Por que perguntar “tem certeza?” não confirma uma resposta da IA?
   - ✔ O modelo gera outro texto provável; ele não vai conferir os fatos
   - Porque o modelo se ofende
   - Porque o modelo sempre muda de resposta
   - _Explicação:_ Ele não tem como verificar. Vai só continuar a conversa de um jeito provável.

### 1.8 NotebookLM e Gamma

1. Por que o NotebookLM alucina menos que um chat comum?
   - ✔ Porque responde ancorado nas fontes que você enviou
   - Porque usa um modelo que nunca erra
   - Porque pesquisa em toda a internet
   - _Explicação:_ Com a fonte na mesa, a continuação mais provável passa a ser o que a fonte diz.

2. Para que serve o Gamma?
   - ✔ Gerar apresentações a partir de um texto
   - Conferir se uma citação existe
   - Rodar modelos abertos em alta velocidade
   - _Explicação:_ Conferir citação é com o Crossref; rodar modelos abertos é com plataformas como o Groq.

3. O que não se deve enviar a ferramentas como NotebookLM e Gamma?
   - ✔ Dados pessoais de outras pessoas
   - A ementa do curso
   - As suas próprias anotações de estudo
   - _Explicação:_ Material seu ou público, sim. Dados de terceiros, não.

### 1.9 Vieses

1. De onde vem o viés de uma IA?
   - ✔ Dos dados e das escolhas de treino
   - Da vontade do modelo
   - Do tamanho da janela de contexto
   - _Explicação:_ O modelo repete padrões do que leu e do modo como foi ajustado.

2. Como testar se um modelo trata dois grupos de forma diferente?
   - ✔ Repetindo o mesmo caso e mudando só o detalhe do grupo
   - Perguntando ao modelo se ele é neutro
   - Aumentando a temperatura
   - _Explicação:_ Mudar uma coisa só é o que permite atribuir a diferença ao viés.

3. Quando o viés de uma IA é mais grave?
   - ✔ Quando ela ajuda a decidir sobre pessoas
   - Quando ela escreve poemas
   - Quando a resposta é longa
   - _Explicação:_ Emprego, crédito, notas: decisões que mudam a vida de alguém pedem cuidado dobrado.

### 1.10 O que não colar num chat

1. Pela LGPD, um dado de saúde é que tipo de dado?
   - ✔ Dado pessoal sensível
   - Dado público
   - Dado anônimo
   - _Explicação:_ Art. 5º, II da LGPD: saúde, religião, opinião política, origem racial ou étnica, biometria, genética e vida sexual são dados sensíveis.

2. Como pedir ajuda com uma planilha de clientes sem expor ninguém?
   - ✔ Descrever as colunas e usar linhas de exemplo inventadas
   - Colar só metade da planilha
   - Colar tudo e pedir sigilo ao chat
   - _Explicação:_ O modelo precisa da estrutura, não das pessoas. Pedir sigilo ao chat não muda para onde o dado foi.

3. Apagar só o nome basta para anonimizar um dado?
   - ✔ Não: outros detalhes podem identificar a pessoa
   - Sim: sem nome ninguém é identificado
   - Sim, se o chat for pago
   - _Explicação:_ Cargo, idade, cidade e data, juntos, apontam para alguém tão bem quanto o nome.

### 1.11 LGPD e IA

1. O que o art. 20 da LGPD garante?
   - ✔ Pedir revisão de decisões tomadas só por tratamento automatizado
   - Usar IA sem restrições
   - Apagar qualquer notícia sobre você da internet
   - _Explicação:_ Vale para decisões que afetam seus interesses, como crédito e seleção.

2. Qual é o teto da multa da LGPD por infração?
   - ✔ 2% do faturamento, limitado a R$ 50 milhões
   - R$ 5 mil
   - Não há multa, só advertência
   - _Explicação:_ Art. 52: até 2% do faturamento no Brasil, com teto de R$ 50 milhões por infração.

3. Na LGPD, o que é uma “base legal”?
   - ✔ O motivo previsto em lei que autoriza usar um dado pessoal
   - O contrato com o fornecedor de IA
   - O servidor onde os dados ficam
   - _Explicação:_ Sem base legal, o uso do dado é irregular, por mais útil que seja.

### 1.12 Regulação de IA no Brasil em 2026

1. Em novembro de 2026, o PL 2338/2023 já é lei?
   - ✔ Não: foi aprovado no Senado e ainda tramita na Câmara
   - Sim: está em vigor desde 2024
   - Sim: foi sancionado em 2026
   - _Explicação:_ Passou em uma das duas casas. Falta a Câmara, e depois a sanção.

2. Qual norma já vale hoje para quem usa IA com dados pessoais no Brasil?
   - ✔ A LGPD
   - O Marco Legal da IA
   - Nenhuma
   - _Explicação:_ A LGPD vale para qualquer tratamento de dado pessoal, com ou sem IA.

3. Como o PL 2338 organiza as regras para a IA?
   - ✔ Por nível de risco do uso
   - Por tamanho da empresa
   - Por marca do modelo
   - _Explicação:_ Risco excessivo seria proibido; alto risco teria obrigações extras.

## Módulo 2 — Prompt engineering

### 2.1 Anatomia do prompt

1. Para que serve o contexto num prompt?
   - ✔ Reduzir as suposições que o modelo precisa fazer
   - Deixar o prompt mais educado
   - Aumentar a temperatura
   - _Explicação:_ Sem contexto, o modelo completa os buracos com o caso mais comum, que raramente é o seu.

2. Quais são as 6 partes de um prompt completo?
   - ✔ Papel, contexto, tarefa, formato, restrições e exemplos
   - Introdução, desenvolvimento e conclusão
   - Pergunta, resposta, correção, nota, revisão e envio
   - _Explicação:_ Quem é, onde está, o que faz, como entrega, o que evita e uma amostra.

3. A resposta da IA veio genérica demais. Qual é a causa mais provável?
   - ✔ Faltou contexto no prompt
   - O modelo está com defeito
   - O prompt estava longo demais
   - _Explicação:_ Resposta genérica é o modelo respondendo ao caso médio, por falta de detalhes do seu.

### 2.2 Especificidade

1. Mais detalhe no prompt é sempre melhor?
   - ✔ Não: só ajuda o detalhe que muda a resposta
   - Sim: quanto mais longo, melhor
   - Não: o ideal é sempre uma linha
   - _Explicação:_ Detalhe relevante ajuda. Detalhe à toa dilui o pedido.

2. Como tornar “faça um texto curto” mais específico?
   - ✔ Dizer o tamanho: “até 80 palavras”
   - Escrever “curto” em maiúsculas
   - Repetir o pedido duas vezes
   - _Explicação:_ “Curto” para você pode ser 3 linhas; para o modelo, 3 parágrafos. Número resolve.

3. Que teste ajuda a cortar o excesso de um prompt?
   - ✔ Perguntar: “se eu apagar esta frase, a resposta muda?”
   - Contar se o prompt passou de 100 palavras
   - Ver se há palavras em inglês
   - _Explicação:_ O critério é o efeito na resposta, não o tamanho.

### 2.3 Zero-shot

1. Um prompt zero-shot traz exemplos resolvidos?
   - ✔ Não: traz só a instrução e o material
   - Sim: pelo menos três
   - Sim: exatamente um
   - _Explicação:_ Zero-shot é zero exemplo. Com exemplos, vira few-shot.

2. O que mais ajuda um zero-shot de classificação a sair no formato certo?
   - ✔ Listar os rótulos possíveis e pedir só o rótulo
   - Pedir “por favor”
   - Aumentar a temperatura
   - _Explicação:_ Rótulos fechados e formato explícito. Temperatura alta só aumenta a variação.

3. O zero-shot errou ou fugiu do formato. Qual é o próximo passo natural?
   - ✔ Acrescentar exemplos ao prompt
   - Trocar de computador
   - Repetir o mesmo prompt em maiúsculas
   - _Explicação:_ Mostrar o padrão costuma resolver o que a instrução sozinha não resolveu.

### 2.4 Few-shot

1. O que é few-shot?
   - ✔ Incluir alguns exemplos resolvidos no prompt
   - Pedir uma resposta curta
   - Fazer a mesma pergunta várias vezes
   - _Explicação:_ “Few shots” são “poucas amostras”: 2 a 5 exemplos de entrada e saída.

2. Como devem ser os exemplos de um prompt few-shot?
   - ✔ Poucos, variados e todos no mesmo formato
   - Muitos e todos do mesmo tipo
   - Longos, com uma explicação diferente em cada um
   - _Explicação:_ Variedade ensina o critério; consistência ensina o formato.

3. Quando o few-shot vale mais a pena que o zero-shot?
   - ✔ Quando o formato é rígido ou o critério é difícil de explicar
   - Quando a pergunta é simples, como uma soma
   - Quando você quer gastar menos tokens
   - _Explicação:_ Exemplos custam tokens. Valem quando compram formato e critério.

### 2.5 Chain-of-thought

1. O que o chain-of-thought pede ao modelo?
   - ✔ Escrever o raciocínio passo a passo antes da resposta
   - Responder com uma palavra só
   - Consultar a internet
   - _Explicação:_ É o “mostre a conta”: primeiro os passos, depois a conclusão.

2. Modelos com modo de raciocínio embutido precisam de “pense passo a passo”?
   - ✔ Bem menos: eles já raciocinam antes de responder
   - Sim, sempre
   - Não, porque não conseguem raciocinar
   - _Explicação:_ Com esses modelos, vale mais descrever bem o objetivo e os critérios.

3. Em qual tarefa pedir o passo a passo só gasta tokens?
   - ✔ Traduzir uma frase curta
   - Resolver um problema com várias contas
   - Comparar opções por vários critérios
   - _Explicação:_ Tarefa direta não tem etapas para mostrar.

### 2.6 Persona

1. O que uma persona muda na resposta do modelo?
   - ✔ O tom e o nível da explicação
   - A quantidade de conhecimento do modelo
   - A janela de contexto
   - _Explicação:_ Persona é figurino e jeito de falar. O que o modelo sabe continua igual.

2. “Aja como um advogado” torna a resposta juridicamente correta?
   - ✔ Não: muda o estilo, não garante o conteúdo
   - Sim: o modelo passa a ter formação jurídica
   - Sim, se o prompt for em português
   - _Explicação:_ O texto ganha cara de parecer, e pode continuar errado.

3. Além do papel, o que mais calibra bem a resposta de um prompt com persona?
   - ✔ Dizer quem é o público
   - Repetir o papel três vezes
   - Escrever em letras maiúsculas
   - _Explicação:_ Quem fala e para quem fala: os dois juntos definem o nível.

### 2.7 Prompt negativo

1. Por que a instrução positiva costuma funcionar melhor que a negativa?
   - ✔ Ela diz o que fazer, em vez de deixar o modelo adivinhar
   - Porque o modelo não entende a palavra “não”
   - Porque sempre gasta menos tokens
   - _Explicação:_ O modelo entende o “não”. O problema é que a negativa não diz qual caminho seguir.

2. Como transformar “não use listas” em instrução positiva?
   - ✔ “Escreva em parágrafos corridos.”
   - “Evite tópicos.”
   - “Sem marcadores.”
   - _Explicação:_ Diga o formato que você quer ver.

3. Quando uma instrução negativa é a melhor opção num prompt?
   - ✔ Em proibições de segurança, como “nunca peça dados pessoais”
   - Sempre que o prompt for longo
   - Nunca: é proibido usar “não”
   - _Explicação:_ Limites de segurança não têm versão positiva natural. Aí o “nunca” é o certo.

### 2.8 Saída estruturada

1. Por que pedir a saída de um LLM em formato estruturado?
   - ✔ Para que programas consigam ler a resposta
   - Para a resposta ficar mais bonita
   - Para o modelo errar menos fatos
   - _Explicação:_ Estrutura não deixa o conteúdo mais correto. Deixa a resposta legível por máquina.

2. O modelo respondeu “Aqui está o JSON:” e depois o JSON. Qual é o problema?
   - ✔ O texto em volta impede um programa de ler direto
   - Nenhum: é só educação
   - O JSON fica mais lento
   - _Explicação:_ O programa espera que a resposta inteira seja JSON. Uma frase antes já quebra a leitura.

3. O que fazer com a saída estruturada antes de usá-la num programa?
   - ✔ Validar sempre
   - Confiar, se o prompt foi bem escrito
   - Converter para texto corrido
   - _Explicação:_ Mesmo com prompt bom, de vez em quando vem uma vírgula a mais ou um campo a menos.

### 2.9 Código, dados e automação

1. Como validar uma fórmula ou um código gerado por IA?
   - ✔ Rodando com casos em que você já sabe a resposta
   - Lendo para ver se parece profissional
   - Pedindo para a IA confirmar que está certo
   - _Explicação:_ Parecer certo não basta. Tem de dar o resultado certo num caso conhecido.

2. O que incluir no pedido de uma fórmula de planilha?
   - ✔ A estrutura das colunas, o resultado esperado e a ferramenta
   - Só o nome da função que você acha que é
   - O histórico da empresa
   - _Explicação:_ Com colunas, objetivo e ferramenta, a IA não precisa adivinhar nada.

3. Por que avisar que o Google Sheets está em português?
   - ✔ Os nomes das funções e o separador mudam conforme o idioma
   - Para a IA responder mais devagar
   - Porque fórmulas em inglês são proibidas
   - _Explicação:_ Em português é SOMASES com ponto e vírgula; em inglês, SUMIFS com vírgula.

### 2.10 RH, Marketing e Contábil

1. Qual é o maior risco de usar IA em relatórios contábeis?
   - ✔ Números alucinados
   - Texto longo demais
   - Linguagem informal
   - _Explicação:_ O modelo escreve um número errado com a mesma fluência de um certo.

2. Em tarefas de RH com IA, quais são os dois riscos principais?
   - ✔ Viés e tratamento de dados pessoais
   - Custo de tokens e velocidade
   - Erros de digitação e de formatação
   - _Explicação:_ Decisões sobre pessoas e dados de candidatos: viés e LGPD.

3. Como aproveitar bem a IA em anúncios de marketing?
   - ✔ Pedir variações com ângulos diferentes e escolher
   - Publicar a primeira versão sem ler
   - Pedir que prometa resultados garantidos
   - _Explicação:_ Variações dão opção. A escolha e a responsabilidade pela promessa continuam com você.

### 2.11 Avaliar a saída

1. Quais são os 4 critérios da rubrica deste curso?
   - ✔ Correção, completude, formato e tom
   - Tamanho, velocidade, preço e fama
   - Introdução, meio, fim e título
   - _Explicação:_ Certo? Completo? No formato? No tom?

2. Um LLM pode avaliar a saída de outro LLM?
   - ✔ Pode ajudar, com rubrica e checagem humana por amostragem
   - Sim, e dispensa qualquer conferência
   - Não, nunca
   - _Explicação:_ O avaliador automático dá escala. A amostra conferida por gente dá confiança.

3. Por que avaliar “no feeling” engana?
   - ✔ Respostas longas e confiantes parecem melhores mesmo quando erram
   - Porque o feeling é sempre negativo
   - Porque os modelos mudam todo dia
   - _Explicação:_ Fluência e tamanho impressionam. A régua olha o que importa.

### 2.12 Biblioteca reutilizável

1. Por que versionar um prompt?
   - ✔ Para saber o que melhorou e poder voltar atrás
   - Para o prompt ficar mais longo
   - Porque os modelos exigem número de versão
   - _Explicação:_ Versão é memória: o que mudou, por que mudou e como era antes.

2. Para que servem as variáveis entre chaves, como `{tema}`, num prompt?
   - ✔ Marcar o que muda a cada uso, mantendo o resto fixo
   - Deixar o prompt secreto
   - Aumentar a temperatura
   - _Explicação:_ A parte fixa é a receita testada. A variável é o ingrediente do dia.

3. O que guardar junto de cada prompt da biblioteca?
   - ✔ Nome, variáveis, versão e um exemplo de uso
   - Só o texto do prompt
   - A data e a hora de cada conversa
   - _Explicação:_ Com esses quatro itens, qualquer pessoa (inclusive você daqui a um mês) consegue reutilizar.

## Módulo 3 — Fundamentos técnicos

### 3.1 O que é API

1. Uma API é um site?
   - ✔ Não: é uma interface para programas conversarem entre si
   - Sim: é um site sem imagens
   - Sim: é o site oficial de uma empresa
   - _Explicação:_ Site é para gente olhar e clicar. API é para programa pedir e receber dados.

2. O que a API de um modelo de IA permite fazer?
   - ✔ Enviar prompts e receber respostas de dentro do seu próprio programa
   - Usar o chat sem internet
   - Treinar o modelo do zero
   - _Explicação:_ É a porta para colocar IA em planilhas, automações e apps.

3. Onde se descobre o que uma API aceita e o que ela devolve?
   - ✔ Na documentação da API
   - No código-fonte do navegador
   - Em nenhum lugar: é tentativa e erro
   - _Explicação:_ A documentação é o cardápio: lista os pedidos possíveis e o formato de cada um.

### 3.2 HTTP e REST

1. O que significa o código de status 429 em uma API?
   - ✔ Você passou do limite de pedidos; espere antes de tentar de novo
   - A chave está errada
   - Deu tudo certo
   - _Explicação:_ 429 é “pedidos demais”. Chave errada é 401.

2. O que significa o código de status 401 em uma API?
   - ✔ A chave de acesso está ausente ou errada
   - O endereço não existe
   - O servidor caiu
   - _Explicação:_ 401 é “não autorizado”: problema de chave. Endereço errado é 404.

3. Qual método HTTP se usa para enviar um prompt a uma API de IA?
   - ✔ POST
   - GET
   - DELETE
   - _Explicação:_ POST envia dados (o prompt) para o servidor processar.

### 3.3 JSON

1. Em JSON, aspas simples valem para textos?
   - ✔ Não: só aspas duplas
   - Sim: tanto faz
   - Sim, mas só nos nomes dos campos
   - _Explicação:_ Texto e nome de campo, sempre com aspas duplas.

2. Qual é o problema em `{"a": 1, "b": 2,}`?
   - ✔ A vírgula depois do último item
   - Faltam aspas nos números
   - As chaves deveriam ser colchetes
   - _Explicação:_ A vírgula separa itens. Depois do último, não há o que separar.

3. No JSON `{"notas": [7, 9, 8]}`, quanto vale `notas[0]`?
   - ✔ 7
   - 9
   - 8
   - _Explicação:_ Listas contam a partir do zero: o item 0 é o primeiro.

### 3.4 Chave de API

1. Uma chave de API pode ir para o GitHub?
   - ✔ Nunca: quem a encontrar usa o serviço na sua conta
   - Sim, se o repositório tiver poucos visitantes
   - Sim, se estiver num comentário do código
   - _Explicação:_ Robôs varrem repositórios públicos atrás de chaves. Poucos visitantes não protegem nada.

2. O que fazer se a sua chave de API vazar?
   - ✔ Revogar no painel do serviço e gerar outra
   - Esperar para ver se alguém usa
   - Mudar a senha do e-mail
   - _Explicação:_ Revogar mata a chave antiga na hora. É rápido e resolve.

3. Para que serve a chave de API?
   - ✔ Identificar quem faz o pedido, para cota e cobrança
   - Deixar a resposta mais rápida
   - Criptografar o prompt
   - _Explicação:_ A chave é a sua identidade perante o serviço.

### 3.5 Primeira chamada (sem código)

1. Para que serve a mensagem com papel `system` numa chamada de chat?
   - ✔ Dar as instruções gerais: papel, regras e formato
   - Guardar a chave de API
   - Mostrar a resposta do modelo
   - _Explicação:_ O system orienta a conversa inteira. A chave vai no cabeçalho, nunca nas mensagens.

2. Na resposta de uma API de chat, onde fica o texto gerado?
   - ✔ Em `choices[0].message.content`
   - No cabeçalho `Authorization`
   - No campo `model`
   - _Explicação:_ choices é uma lista; o item 0 é a primeira (e normalmente única) resposta.

3. O que vai no cabeçalho `Authorization` de uma chamada de API?
   - ✔ A palavra Bearer seguida da chave
   - O nome do modelo
   - O prompt
   - _Explicação:_ “Bearer”, um espaço e a chave. Modelo e prompt vão no corpo.

### 3.6 Limites e custos

1. Criar mais chaves de API na mesma conta aumenta a cota?
   - ✔ Não: o limite é da conta, não da chave
   - Sim: cada chave tem a sua cota
   - Sim, até o limite de 10 chaves
   - _Explicação:_ Todas as chaves da conta bebem da mesma franquia.

2. O que são “tokens por minuto” (TPM) num plano de API?
   - ✔ O total de tokens de entrada e saída permitido em um minuto
   - A velocidade com que o modelo escreve
   - O preço de cada token
   - _Explicação:_ É um teto de volume de texto por minuto, somando o que vai e o que volta.

3. Em APIs pagas, o que costuma custar mais: token de entrada ou de saída?
   - ✔ O de saída
   - O de entrada
   - Custam sempre o mesmo
   - _Explicação:_ Gerar texto custa mais que ler. Por isso vale pedir respostas enxutas.

### 3.7 Webhooks

1. Num webhook, quem recebe a chamada?
   - ✔ O seu sistema, numa URL que você forneceu
   - O servidor do outro serviço, como numa API comum
   - O navegador do usuário
   - _Explicação:_ No webhook você é o destino: o outro sistema é quem liga.

2. Qual é a diferença entre polling e webhook?
   - ✔ No polling você pergunta de tempos em tempos; no webhook você é avisado
   - Polling é sempre mais rápido
   - Webhook só funciona com IA
   - _Explicação:_ Perguntar toda hora contra ser avisado no momento do evento.

3. Por que não divulgar uma URL de webhook?
   - ✔ Quem souber o endereço pode enviar dados para o seu sistema
   - Porque ela expira em uma hora
   - Porque o endereço mostra a sua senha
   - _Explicação:_ A URL é uma porta de entrada. Trate como algo reservado.

### 3.8 Embeddings

1. Um embedding é um texto?
   - ✔ Não: é uma lista de números que representa o sentido do texto
   - Sim: é um resumo do texto
   - Sim: é o texto traduzido para o inglês
   - _Explicação:_ São coordenadas num mapa de significados. Ninguém lê um embedding; compara-se um com outro.

2. O que a busca semântica faz que a busca por palavra exata não faz?
   - ✔ Encontra textos de sentido parecido, mesmo com palavras diferentes
   - Encontra só textos idênticos
   - Funciona sem computador
   - _Explicação:_ “Cão” encontra “cachorro” porque os dois ficam perto no mapa.

3. Pode-se comparar vetores gerados por modelos de embedding diferentes?
   - ✔ Não: cada modelo tem o seu próprio mapa
   - Sim: todos usam o mesmo mapa
   - Sim, se os textos forem em inglês
   - _Explicação:_ As coordenadas de um mapa não significam nada no outro.

### 3.9 Similaridade de cosseno

1. O que uma similaridade de cosseno alta entre dois embeddings indica?
   - ✔ Que os textos têm sentido parecido
   - Que os textos têm o mesmo tamanho
   - Que os textos estão no mesmo idioma
   - _Explicação:_ Setas alinhadas, sentidos próximos. Tamanho do texto não entra na conta.

2. O que a similaridade de cosseno mede entre dois vetores?
   - ✔ O alinhamento das direções, ou seja, o ângulo
   - A diferença de comprimento
   - A soma dos números
   - _Explicação:_ Só a direção conta. Por isso um texto curto e um longo podem ter similaridade 1.

3. Um banco vetorial mostra “distância” em vez de similaridade. Como ler?
   - ✔ Quanto menor a distância, mais parecido
   - Quanto maior a distância, mais parecido
   - Distância e similaridade são o mesmo número
   - _Explicação:_ Distância pequena é vizinho próximo. É o inverso da similaridade.

### 3.10 ChromaDB

1. O que uma coleção do ChromaDB guarda para cada item?
   - ✔ O texto, o embedding, os metadados e um id
   - Só o texto
   - Só os números do embedding
   - _Explicação:_ Texto para ler, vetor para buscar, metadados para citar e id para identificar.

2. Para que servem os metadados num banco vetorial?
   - ✔ Guardar informações como a fonte do trecho
   - Deixar a busca mais lenta
   - Substituir o embedding
   - _Explicação:_ Com a fonte guardada, a resposta pode dizer de onde veio e você pode conferir.

3. Qual operação do ChromaDB busca os trechos mais parecidos com uma pergunta?
   - ✔ `query`
   - `add`
   - `print`
   - _Explicação:_ `add` guarda; `query` consulta.

### 3.11 Chunking

1. O que acontece quando os pedaços (chunks) são grandes demais?
   - ✔ Entra ruído: muito texto irrelevante junto do que interessa
   - A busca fica impossível
   - O modelo responde sempre “não sei”
   - _Explicação:_ Pedaço grande mistura assuntos: o vetor fica vago e a mesa do modelo se enche de sobra.

2. Para que serve a sobreposição entre pedaços no chunking?
   - ✔ Para não perder ideias que caem na fronteira entre dois pedaços
   - Para deixar o banco menor
   - Para aumentar a temperatura
   - _Explicação:_ O que foi cortado no fim de um pedaço reaparece inteiro no começo do seguinte.

3. Onde é melhor cortar o texto ao fazer chunking?
   - ✔ Em fim de frase ou de parágrafo
   - Sempre no caractere 500, exatamente
   - No meio das palavras
   - _Explicação:_ Um pedaço que termina em ponto final se entende sozinho.

### 3.12 RAG

1. O RAG treina o modelo com os seus documentos?
   - ✔ Não: ele só coloca trechos relevantes no prompt
   - Sim: o modelo é retreinado a cada documento
   - Sim, mas só uma vez por dia
   - _Explicação:_ O modelo continua o mesmo. O que muda é o que está na mesa dele a cada pergunta.

2. Qual é a ordem das etapas quando chega uma pergunta num sistema RAG?
   - ✔ Embedding da pergunta, busca dos trechos, prompt com contexto, resposta
   - Resposta, busca, embedding, prompt
   - Treino, teste, publicação, resposta
   - _Explicação:_ Primeiro acha o material, depois responde com ele na mesa.

3. O que acontece no RAG quando a busca traz o trecho errado?
   - ✔ A resposta sai errada ou inventada
   - O modelo percebe e corrige sozinho
   - Nada: o modelo ignora o contexto
   - _Explicação:_ O modelo confia no que recebeu. Busca ruim, resposta ruim.

### 3.13 Recuperação

1. Que tipo de busca ajuda com nomes próprios e códigos num RAG?
   - ✔ A busca híbrida, que junta sentido e palavra exata
   - Só a busca semântica
   - Só aumentar o top-k
   - _Explicação:_ Para “pedido 48213”, o que vale é o termo exato. A híbrida cobre os dois casos.

2. O que acontece quando o top-k de um RAG é alto demais?
   - ✔ Entram trechos irrelevantes, que confundem e gastam tokens
   - A busca fica mais precisa
   - O modelo responde mais rápido
   - _Explicação:_ Mais trechos não é mais qualidade. O certo se perde no meio dos errados.

3. A resposta do RAG veio ruim. O que olhar primeiro?
   - ✔ Os trechos que a busca trouxe
   - A cor da interface
   - O tamanho da resposta
   - _Explicação:_ Se o trecho certo não veio, não adianta mexer no prompt: o problema é a busca.

### 3.14 Avaliar RAG

1. A resposta não está no material indexado. O que um bom RAG deve fazer?
   - ✔ Dizer que não encontrou
   - Responder com o que o modelo lembra do treino
   - Inventar uma fonte
   - _Explicação:_ O “não encontrei” é uma resposta correta. Inventar é a pior saída.

2. O que é “fidelidade” na avaliação de um RAG?
   - ✔ Tudo o que a resposta afirma está nos trechos recuperados
   - A resposta é longa
   - O modelo respondeu rápido
   - _Explicação:_ Fiel é a resposta que não acrescenta nada além do que o contexto sustenta.

3. Por que testar um RAG com um conjunto fixo de perguntas?
   - ✔ Para comparar o antes e o depois de cada ajuste
   - Para gastar a cota da API
   - Porque uma pergunta só já basta
   - _Explicação:_ Mesmo simulado, mudanças diferentes: é o que mostra se o ajuste ajudou.

## Módulo 4 — Automação com n8n

### 4.1 Automação low-code

1. Usar uma ferramenta low-code dispensa a lógica?
   - ✔ Não: você ainda define a ordem, as decisões e o que fazer se der erro
   - Sim: a ferramenta pensa por você
   - Sim, desde que use IA
   - _Explicação:_ Os blocos poupam digitação. O desenho do processo continua sendo seu.

2. Que tipo de tarefa é boa candidata à automação?
   - ✔ Repetitiva, frequente e com regras claras
   - Rara e cheia de exceções
   - Uma decisão delicada sobre pessoas
   - _Explicação:_ Quanto mais repetida e mais clara a regra, mais vale automatizar.

3. O que acontece ao automatizar um processo confuso?
   - ✔ A confusão passa a acontecer mais rápido e em maior escala
   - O processo se organiza sozinho
   - A ferramenta recusa o fluxo
   - _Explicação:_ Automação amplia o que existe, de bom ou de ruim.

### 4.2 Interface: canvas, nós e execuções

1. No n8n, onde ver o que rodou e o que deu erro?
   - ✔ Na aba Executions
   - No canvas, pelas cores dos nós
   - No e-mail do administrador
   - _Explicação:_ Executions guarda cada rodada, com os dados que passaram por cada nó.

2. O que é um nó no n8n?
   - ✔ Um bloco que faz uma tarefa específica do fluxo
   - O fluxo inteiro
   - O histórico das execuções
   - _Explicação:_ O fluxo inteiro é o workflow. O histórico são as execuções.

3. Ao abrir um nó do n8n, o que mostram os painéis Input e Output?
   - ✔ Os dados que entraram no nó e os que saíram dele
   - A senha e a chave de API
   - O preço da execução
   - _Explicação:_ Comparar o que entrou com o que saiu é o jeito mais rápido de achar um erro.

### 4.3 Triggers

1. Um workflow do n8n sem trigger roda sozinho?
   - ✔ Não: é o trigger que dá a partida
   - Sim, a cada hora
   - Sim, quando o computador liga
   - _Explicação:_ Sem gatilho, o fluxo só roda se você mandar.

2. Qual trigger do n8n usar para “todo dia às 8h”?
   - ✔ Schedule Trigger
   - Webhook
   - Manual
   - _Explicação:_ Hora marcada é Schedule. Webhook espera alguém chamar.

3. O fluxo tem Schedule Trigger, mas não roda sozinho. Qual é a causa mais comum?
   - ✔ O workflow não foi ativado
   - O computador está sem som
   - Falta um segundo trigger
   - _Explicação:_ Executar pelo editor é teste. Só o workflow ativo obedece ao horário.

### 4.4 Itens e JSON entre nós

1. No n8n, o que cada nó recebe?
   - ✔ Os itens que saíram do nó anterior
   - Todos os dados de todos os workflows
   - Só o primeiro item da execução
   - _Explicação:_ A esteira leva a saída de um nó para a entrada do seguinte.

2. Um nó do n8n recebeu 10 itens. Quantas vezes, por padrão, ele executa a sua ação?
   - ✔ Dez: uma vez para cada item
   - Uma vez só
   - Depende do horário
   - _Explicação:_ É o laço embutido da esteira. Uma configuração, dez execuções.

3. Para que serve o nó Edit Fields (Set)?
   - ✔ Criar ou ajustar campos dos itens
   - Agendar o workflow
   - Guardar credenciais
   - _Explicação:_ É a peça para acrescentar, renomear e arrumar campos.

### 4.5 Expressões {{ }}

1. Qual é a sintaxe de uma expressão no n8n?
   - ✔ Chaves duplas: `{{ }}`
   - Colchetes: `[ ]`
   - Sinais de porcentagem: `% %`
   - _Explicação:_ Tudo o que está entre `{{` e `}}` é calculado na hora, para cada item.

2. Numa expressão do n8n, o que `$json` representa?
   - ✔ Os dados do item atual
   - A chave de API
   - O nome do workflow
   - _Explicação:_ `$json.campo` lê um campo da bandeja que está passando agora.

3. A expressão `{{ $json.Nome }}` devolveu `undefined`, e o campo se chama `nome`. Por quê?
   - ✔ Maiúsculas e minúsculas precisam ser idênticas
   - Faltou a senha
   - Expressões não leem texto
   - _Explicação:_ `Nome` e `nome` são campos diferentes para o n8n.

### 4.6 IF e Switch

1. Para que serve o nó Switch no n8n?
   - ✔ Para dividir o fluxo em vários caminhos, mais de dois
   - Para ligar e desligar o workflow
   - Para trocar de conta
   - _Explicação:_ IF tem duas saídas. Switch tem quantas você precisar.

2. Comparando como texto, por que “10” fica antes de “7”?
   - ✔ Texto se compara caractere por caractere, e “1” vem antes de “7”
   - Porque 10 é menor que 7
   - Porque o n8n arredonda os números
   - _Explicação:_ É a ordem do dicionário. Para comparar valores, use o tipo Number.

3. Quantas saídas tem o nó IF do n8n?
   - ✔ Duas: true e false
   - Uma
   - Quantas você quiser
   - _Explicação:_ Cada item sai por true ou por false, conforme a condição.

### 4.7 Webhook node

1. Qual é a diferença entre a URL de teste e a de produção do nó Webhook?
   - ✔ A de teste só funciona com o editor escutando; a de produção, com o workflow ativo
   - A de teste é paga e a de produção é gratuita
   - Não há diferença
   - _Explicação:_ Teste é para montar, com você olhando. Produção é para valer, com o workflow ativo.

2. Onde aparecem as execuções disparadas pela URL de produção de um webhook?
   - ✔ Na aba Executions
   - No canvas, em tempo real
   - Em lugar nenhum
   - _Explicação:_ Em produção, o canvas não acende. O histórico fica em Executions.

3. Onde ficam os dados enviados no corpo de um POST recebido pelo nó Webhook?
   - ✔ No campo `body` do item
   - No nome do workflow
   - Nas credenciais
   - _Explicação:_ Por isso a expressão é `{{ $json.body.campo }}`.

### 4.8 HTTP Request node

1. No nó HTTP Request, onde deve ficar a chave de API?
   - ✔ Em Credentials
   - Na URL, depois de um ponto de interrogação
   - Num campo de texto do corpo
   - _Explicação:_ Credentials é o cofre do n8n. Tudo o mais fica à vista.

2. Para que serve o nó HTTP Request do n8n?
   - ✔ Chamar qualquer API, mesmo sem nó dedicado
   - Só para baixar imagens
   - Para criar webhooks
   - _Explicação:_ É o coringa: se tem API, ele conversa.

3. Por que guardar a chave em Credentials, e não no próprio nó?
   - ✔ Ela fica cifrada e não vai junto quando o workflow é exportado
   - Porque o nó fica mais rápido
   - Porque a URL ficaria curta demais
   - _Explicação:_ O JSON exportado leva só a referência à credencial, nunca o segredo.

### 4.9 Nó de LLM

1. Por que cada serviço tem a sua própria credencial no n8n?
   - ✔ Por segurança: trocar ou revogar uma não afeta as outras
   - Para o fluxo ficar mais colorido
   - Porque o n8n cobra por credencial
   - _Explicação:_ Segredos separados limitam o estrago quando um deles vaza.

2. No nó de LLM, para que serve limitar o número máximo de tokens?
   - ✔ Controlar o tamanho e o custo da resposta
   - Aumentar a criatividade
   - Acelerar o trigger
   - _Explicação:_ Sem teto, uma resposta pode sair enorme, e mil itens dão mil respostas enormes.

3. Como o prompt de um nó de LLM recebe os dados de cada item?
   - ✔ Por expressões, como `{{ $json.campo }}`
   - O modelo adivinha
   - Por um arquivo de texto separado
   - _Explicação:_ O prompt é um molde: a parte fixa fica, as lacunas mudam a cada item.

### 4.10 Google Sheets

1. A planilha precisa de linha de cabeçalho para o nó Google Sheets?
   - ✔ Sim: é pelos nomes das colunas que o n8n sabe onde escrever
   - Não: o n8n adivinha as colunas
   - Só se a planilha tiver mais de 100 linhas
   - _Explicação:_ Sem cabeçalho, não há nomes para mapear.

2. Qual ação do nó Google Sheets acrescenta uma linha no fim da planilha?
   - ✔ Append Row
   - Get Row(s)
   - Delete Sheet
   - _Explicação:_ “Append” é acrescentar ao final. “Get” lê.

3. Cinco itens chegam a um nó Append Row. Quantas linhas são criadas?
   - ✔ Cinco, uma por item
   - Uma só, com tudo junto
   - Nenhuma, até ativar o workflow
   - _Explicação:_ Cada bandeja da esteira vira uma linha.

### 4.11 Bancos de dados

1. Quando vale trocar a planilha por um banco de dados?
   - ✔ Quando o volume cresce e a integridade dos dados passa a importar
   - Sempre, desde o primeiro dia
   - Nunca: planilha resolve tudo
   - _Explicação:_ Para protótipo, planilha. Para o que cresce e não pode quebrar, banco.

2. O que um banco de dados faz quando chega um valor do tipo errado numa coluna?
   - ✔ Recusa o valor
   - Aceita e corrige sozinho
   - Apaga a tabela
   - _Explicação:_ Recusar na entrada é o que mantém os dados confiáveis.

3. O que é o Supabase?
   - ✔ Um Postgres hospedado, com painel visual e plano gratuito
   - Um modelo de IA
   - Uma planilha do Google
   - _Explicação:_ É um banco PostgreSQL pronto para usar, sem instalar servidor.

### 4.12 Tratamento de erros

1. A API respondeu 429 no meio do fluxo. Qual é a estratégia certa?
   - ✔ Esperar e tentar de novo, aumentando a espera a cada tentativa
   - Tentar de novo imediatamente, sem parar
   - Trocar de chave na mesma conta
   - _Explicação:_ É o backoff: 1 s, 2 s, 4 s. Insistir sem pausa mantém você acima do limite.

2. Para que serve o Error Trigger no n8n?
   - ✔ Iniciar um workflow de aviso quando outro workflow falha
   - Impedir que erros aconteçam
   - Apagar as execuções com erro
   - _Explicação:_ Ele não evita o erro: garante que alguém fique sabendo.

3. Tentar de novo resolve um erro de chave inválida (401)?
   - ✔ Não: é um erro permanente, e alguém precisa corrigir
   - Sim, na terceira tentativa
   - Sim, se a espera for longa
   - _Explicação:_ Repetir só ajuda em falha passageira. Chave errada continua errada.

### 4.13 O que é um agente

1. Um agente de IA decide os próprios passos?
   - ✔ Sim, mas só com as ferramentas e as instruções que recebeu
   - Não: segue sempre a mesma sequência
   - Sim, e pode usar qualquer sistema da empresa
   - _Explicação:_ A autonomia do agente vai até onde vão as ferramentas e as regras que você deu.

2. Qual é o laço básico de um agente de IA?
   - ✔ Pensar, agir e observar, até ter a resposta
   - Ler, copiar e colar
   - Ligar, esperar e desligar
   - _Explicação:_ Decide uma ação, executa, lê o resultado e decide de novo.

3. Quando um fluxo fixo é melhor que um agente?
   - ✔ Quando o caminho é sempre o mesmo
   - Quando a tarefa muda a cada pedido
   - Nunca
   - _Explicação:_ Se dá para desenhar o caminho antes, o fluxo é mais barato e mais confiável.

### 4.14 AI Agent node

1. No nó AI Agent do n8n, onde vão as regras do agente?
   - ✔ Na System Message
   - No nome do workflow
   - Na mensagem do usuário
   - _Explicação:_ System message é o regulamento. A mensagem do usuário é o pedido de cada vez.

2. Qual encaixe do nó AI Agent é obrigatório?
   - ✔ O Chat Model
   - A Memory
   - Uma Tool
   - _Explicação:_ Sem modelo não há quem pense. Memória e ferramentas são opcionais.

3. Para que serve a opção Max Iterations do agente?
   - ✔ Limitar quantas rodadas de pensar e agir ele pode dar
   - Aumentar a temperatura
   - Escolher o idioma
   - _Explicação:_ É a trava contra laço sem fim e contra conta alta.

### 4.15 Tools

1. Como o agente sabe quando usar uma ferramenta?
   - ✔ Pela descrição da ferramenta
   - Pela ordem em que foram penduradas
   - Ele testa todas a cada pergunta
   - _Explicação:_ A descrição é a etiqueta da gaveta. É o único guia que ele tem.

2. O que uma boa descrição de ferramenta deve dizer?
   - ✔ O que ela faz, quando usar e o que precisa receber
   - Só o nome de quem criou
   - O preço da execução
   - _Explicação:_ O quê, quando e com quais dados: as três perguntas da etiqueta.

3. Por que evitar ferramentas demais num agente?
   - ✔ Muitas opções confundem a escolha e gastam tokens
   - Porque o n8n permite no máximo três
   - Porque ferramentas deixam o texto mais lento
   - _Explicação:_ Não há limite de três. O limite é a clareza: poucas e bem descritas.

### 4.16 Memória de sessão

1. O que acontece com a memória do agente quando não há session ID por conversa?
   - ✔ As conversas de pessoas diferentes se misturam
   - A memória fica infinita
   - O agente para de responder
   - _Explicação:_ Sem etiqueta, todas as conversas caem no mesmo bloco de notas.

2. O que a Simple Memory (Window Buffer) guarda?
   - ✔ As últimas trocas da conversa, até o tamanho da janela
   - Todas as conversas, para sempre
   - Só a primeira mensagem
   - _Explicação:_ É uma janela deslizante: entra troca nova, sai a mais antiga.

3. Por que uma janela de memória grande demais atrapalha o agente?
   - ✔ Tudo é reenviado a cada mensagem: custa mais e traz ruído
   - Porque o n8n proíbe
   - Porque o modelo esquece mais rápido
   - _Explicação:_ Memória não é grátis: cada troca guardada volta para a mesa em toda mensagem.

### 4.17 WhatsApp

1. Qual é o risco de usar uma API não oficial de WhatsApp?
   - ✔ O número pode ser bloqueado, sem aviso
   - As mensagens ficam mais lentas
   - O n8n deixa de funcionar
   - _Explicação:_ Automação por fora das regras é motivo de banimento do número.

2. Qual é um bom lugar para testar um agente antes de levá-lo ao WhatsApp?
   - ✔ O chat do n8n e, depois, o Telegram
   - Direto no número principal da empresa
   - Num grupo com todos os clientes
   - _Explicação:_ Primeiro acerte a lógica onde errar não custa nada.

3. Na API oficial do WhatsApp, como uma empresa inicia uma conversa?
   - ✔ Com um modelo de mensagem aprovado
   - Com qualquer texto, a qualquer hora
   - Não é possível iniciar conversas
   - _Explicação:_ Texto livre só dentro da janela de 24 horas depois que a pessoa escreveu.

### 4.18 Deploy do n8n

1. No n8n hospedado por conta própria, quem cuida das atualizações?
   - ✔ Você
   - A equipe do n8n, automaticamente
   - O provedor de internet
   - _Explicação:_ Casa própria: a manutenção é do dono.

2. O que acontece se você perder a chave de criptografia do seu n8n?
   - ✔ As credenciais guardadas não podem mais ser abertas
   - Nada: ela é só enfeite
   - O n8n gera a mesma chave de novo
   - _Explicação:_ As credenciais são cifradas com essa chave. Sem ela, viram dados ilegíveis.

3. Qual é a limitação de rodar o n8n só no seu computador?
   - ✔ Só funciona com o PC ligado, e webhooks de fora não chegam sem um túnel
   - Não dá para criar workflows
   - Não aceita credenciais
   - _Explicação:_ Para aprender, é ótimo. Para ficar no ar o dia todo, precisa de servidor.

## Módulo 5 — Python para IA

### 5.1 Python e VS Code

1. O que é o terminal?
   - ✔ Uma janela onde se digitam comandos de texto
   - O cabo que liga o computador à internet
   - Um editor de imagens
   - _Explicação:_ É conversar com o computador por escrito, em vez de clicar.

2. Por que marcar “Add python.exe to PATH” ao instalar o Python no Windows?
   - ✔ Para o terminal encontrar o comando `python`
   - Para o Python ficar mais rápido
   - Para instalar o VS Code junto
   - _Explicação:_ O PATH é a lista de lugares onde o terminal procura programas.

3. Qual é a diferença entre o Python e o VS Code?
   - ✔ O Python executa o código; o VS Code é onde você escreve
   - São dois nomes do mesmo programa
   - O VS Code executa; o Python só colore o texto
   - _Explicação:_ Dá para escrever Python até no Bloco de Notas. Quem roda é sempre o interpretador.

### 5.2 print

1. O que o `print()` faz em Python?
   - ✔ Mostra na tela o que está entre os parênteses
   - Imprime na impressora
   - Guarda um valor na memória
   - _Explicação:_ Apesar do nome, não tem nada a ver com impressora.

2. O que `print("2 + 3")` mostra?
   - ✔ O texto `2 + 3`
   - O número `5`
   - Um erro
   - _Explicação:_ Entre aspas é texto, e texto não é calculado.

3. Qual é a extensão de um arquivo de programa Python?
   - ✔ `.py`
   - `.txt`
   - `.exe`
   - _Explicação:_ É pelo `.py` que o editor e o terminal reconhecem o programa.

### 5.3 Variáveis e tipos em Python

1. Em Python, quanto vale `"3" + "3"`?
   - ✔ `"33"`: os textos são colados
   - `6`
   - Dá erro
   - _Explicação:_ Com textos, o `+` junta um no outro.

2. O que acontece em Python ao fazer `"3" + 3`?
   - ✔ Erro de tipo: não se soma texto com número
   - Resulta em `6`
   - Resulta em `"33"`
   - _Explicação:_ O Python não adivinha se você quer somar ou colar. Você converte: `int("3") + 3`.

3. Como transformar o texto `"25"` no número 25 em Python?
   - ✔ `int("25")`
   - `str("25")`
   - `print("25")`
   - _Explicação:_ `int` converte para inteiro; `str` faz o caminho contrário.

### 5.4 input e f-strings

1. O que o `input()` devolve em Python?
   - ✔ Sempre um texto
   - Um número, se a pessoa digitar número
   - Verdadeiro ou falso
   - _Explicação:_ Mesmo “25” chega como texto. Para contas, converta.

2. O que falta em `"Olá, {nome}!"` para o Python trocar `{nome}` pelo valor?
   - ✔ A letra `f` antes das aspas
   - Um ponto e vírgula no fim
   - Aspas simples no lugar das duplas
   - _Explicação:_ Sem o `f`, as chaves são só caracteres do texto.

3. Como ler um número inteiro digitado pela pessoa em Python?
   - ✔ `int(input("Idade: "))`
   - `input(int("Idade: "))`
   - `print("Idade: ")`
   - _Explicação:_ Primeiro o `input` devolve o texto; depois o `int` converte.

### 5.5 if, elif e else

1. Em Python, a indentação (o recuo) importa?
   - ✔ Sim: é ela que define o que está dentro de cada bloco
   - Não: é só para ficar bonito
   - Só em programas com mais de 100 linhas
   - _Explicação:_ Recuo errado muda o sentido do programa ou dá erro.

2. Qual é a diferença entre `=` e `==` em Python?
   - ✔ `=` guarda um valor; `==` compara
   - São a mesma coisa
   - `==` guarda; `=` compara
   - _Explicação:_ Um sinal atribui. Dois sinais perguntam “é igual?”.

3. Com `if nota >= 7`, depois `elif nota >= 5` e `else`, o que acontece com a nota 8?
   - ✔ Entra só no primeiro bloco
   - Entra nos dois primeiros blocos
   - Entra no `else`
   - _Explicação:_ O Python para no primeiro teste verdadeiro e pula o resto.

### 5.6 Listas e for

1. O que `range(3)` gera em Python?
   - ✔ 0, 1 e 2
   - 1, 2 e 3
   - 0, 1, 2 e 3
   - _Explicação:_ Começa no zero e para **antes** do 3. São três números.

2. Em `notas = [7.5, 8, 6.5]`, quanto vale `notas[0]`?
   - ✔ `7.5`
   - `8`
   - `6.5`
   - _Explicação:_ A posição 0 é o primeiro item.

3. Quando termina um laço `for` que percorre uma lista?
   - ✔ Quando passa por todos os itens
   - Nunca, sem um comando de parada
   - Depois de 10 voltas
   - _Explicação:_ A própria lista é a condição de parada. Por isso o `for` é seguro.

### 5.7 Dicionários

1. Com que formato de dados um dicionário Python se parece?
   - ✔ Com um objeto JSON
   - Com um arquivo PDF
   - Com uma imagem
   - _Explicação:_ Chaves, pares de nome e valor: é praticamente a mesma escrita.

2. O que acontece ao ler `config["idioma"]` quando essa chave não existe?
   - ✔ Dá `KeyError`
   - Devolve um texto vazio
   - A chave é criada sozinha
   - _Explicação:_ Ler chave inexistente com colchetes é erro. Atribuir é que cria.

3. Como ler uma chave de dicionário que pode não existir, sem risco de erro?
   - ✔ Com `config.get("chave", padrão)`
   - Com `config["chave"]`
   - Com `print(config)`
   - _Explicação:_ O `get` devolve o valor padrão quando a chave falta.

### 5.8 Funções

1. Qual é a diferença entre `return` e `print` numa função?
   - ✔ `return` devolve o valor para quem chamou; `print` só mostra na tela
   - São a mesma coisa
   - `print` devolve; `return` mostra
   - _Explicação:_ Valor devolvido pode ser reutilizado. Valor só impresso se perde.

2. O que uma função Python sem `return` devolve?
   - ✔ `None`, ou seja, nada
   - Zero
   - O último valor impresso
   - _Explicação:_ `None` é o “vazio” do Python. Usá-lo numa conta dá erro.

3. Em `def dobro(x):`, o que é `x`?
   - ✔ O parâmetro: o valor que a função recebe
   - O nome da função
   - O resultado
   - _Explicação:_ O nome é `dobro`. `x` é o ingrediente que muda a cada chamada.

### 5.9 Ler erros

1. Onde olhar primeiro numa mensagem de erro do Python?
   - ✔ Na última linha: ela diz o tipo do erro e a explicação
   - Na primeira palavra da primeira linha
   - No tamanho da mensagem
   - _Explicação:_ O traceback se lê de baixo para cima. O resumo está no fim.

2. O que um `NameError` costuma indicar?
   - ✔ Um nome que não existe, em geral por erro de digitação
   - Falta de internet
   - Um parêntese sem fechar
   - _Explicação:_ Parêntese aberto é SyntaxError. NameError é nome desconhecido.

3. O Python apontou um `SyntaxError` na linha 5, e ela parece certa. Onde mais olhar?
   - ✔ Na linha anterior: algo pode ter ficado aberto
   - Na última linha do arquivo
   - Em outro arquivo
   - _Explicação:_ Parêntese ou aspas abertos na linha 4 só “estouram” na 5.

### 5.10 Git e GitHub

1. O comando `git commit` envia os arquivos para o GitHub?
   - ✔ Não: quem envia é o `git push`
   - Sim, na hora
   - Sim, mas só de madrugada
   - _Explicação:_ O commit grava a versão no seu computador. O push leva para o GitHub.

2. Para que serve o arquivo `.gitignore`?
   - ✔ Listar o que o Git deve ignorar, como o `.env`
   - Guardar a senha do GitHub
   - Apagar commits antigos
   - _Explicação:_ O que está no `.gitignore` não entra em commit nenhum.

3. O que é um commit no Git?
   - ✔ Uma “foto” do projeto, com uma mensagem
   - Uma cópia do projeto em pendrive
   - Um erro do Git
   - _Explicação:_ Cada commit é um ponto do histórico ao qual dá para voltar.

### 5.11 venv e pip

1. Por que usar um ambiente virtual (venv) em cada projeto Python?
   - ✔ Para isolar as bibliotecas e as versões de cada projeto
   - Para o Python rodar mais rápido
   - Para esconder o código
   - _Explicação:_ Cada projeto com a sua marmita: um não estraga o outro.

2. Para que serve o arquivo `requirements.txt`?
   - ✔ Listar as bibliotecas de que o projeto precisa
   - Guardar as chaves de API
   - Registrar os erros do programa
   - _Explicação:_ Com ele, qualquer pessoa (ou servidor) instala as mesmas bibliotecas.

3. Como saber que o ambiente virtual está ativado?
   - ✔ O terminal mostra `(.venv)` no começo da linha
   - O computador reinicia
   - O VS Code fecha
   - _Explicação:_ Sem o `(.venv)`, o `pip install` vai para o Python geral do computador.

### 5.12 CSV e arquivos de texto

1. O `with open(...)` fecha o arquivo sozinho?
   - ✔ Sim, ao fim do bloco, mesmo se der erro
   - Não: é preciso chamar `close()`
   - Só no Linux
   - _Explicação:_ É por isso que o `with` é o jeito recomendado de abrir arquivos.

2. Por que passar `encoding="utf-8"` ao abrir um arquivo de texto?
   - ✔ Para os acentos serem lidos corretamente
   - Para o arquivo abrir mais rápido
   - Para proteger o arquivo com senha
   - _Explicação:_ Sem o encoding certo, “ç” e “ã” viram símbolos estranhos.

3. O que o `csv.DictReader` entrega a cada linha do arquivo?
   - ✔ Um dicionário, com os nomes das colunas como chaves
   - Um número
   - O arquivo inteiro num texto só
   - _Explicação:_ Por isso dá para escrever `linha["nota"]`.

### 5.13 pandas

1. O que é um DataFrame do pandas?
   - ✔ Uma tabela na memória do programa, com linhas e colunas com nome
   - Um arquivo PDF
   - Um tipo de gráfico
   - _Explicação:_ É a planilha do pandas, só que controlada por comandos.

2. O que faz `df[df["valor"] > 100]` no pandas?
   - ✔ Filtra: mantém só as linhas com valor acima de 100
   - Soma 100 a cada valor
   - Apaga a coluna valor
   - _Explicação:_ A condição dentro dos colchetes escolhe as linhas que ficam.

3. Para que serve o `groupby` do pandas?
   - ✔ Agrupar as linhas por uma coluna e calcular por grupo
   - Ordenar a tabela por data
   - Renomear colunas
   - _Explicação:_ É a tabela dinâmica do pandas: total por vendedor, média por mês.

### 5.14 PDF

1. Um PDF escaneado (a foto de um papel) tem texto para extrair?
   - ✔ Não: é imagem, e precisa de OCR
   - Sim, sempre
   - Sim, se tiver menos de 10 páginas
   - _Explicação:_ Sem OCR, o programa só enxerga uma figura.

2. Como testar rápido se um PDF tem texto de verdade?
   - ✔ Tentando selecionar uma palavra com o mouse
   - Vendo o tamanho do arquivo
   - Abrindo no celular
   - _Explicação:_ Se dá para selecionar e copiar, o `extract_text()` também consegue ler.

3. Na pypdf, o que `pagina.extract_text()` devolve?
   - ✔ O texto daquela página, ou vazio se não houver
   - A imagem da página
   - O número de páginas
   - _Explicação:_ O número de páginas vem de `len(leitor.pages)`.

### 5.15 requests

1. O que `r.json()` devolve na biblioteca requests?
   - ✔ Um dicionário ou uma lista do Python
   - Um texto sem formatação
   - O código de status
   - _Explicação:_ O JSON da resposta já chega pronto para usar com colchetes.

2. Por que conferir `r.status_code` antes de usar os dados?
   - ✔ Porque uma resposta de erro não tem os campos que o programa espera
   - Para deixar o programa mais lento
   - Porque o status muda os dados
   - _Explicação:_ Sem a conferência, o erro aparece longe da causa, como um `KeyError` misterioso.

3. Para que serve o `timeout` numa chamada do requests?
   - ✔ Limitar quanto tempo esperar pela resposta
   - Aumentar a cota da API
   - Repetir a chamada
   - _Explicação:_ Sem timeout, uma API travada trava o seu programa junto.

### 5.16 Segredos no .env

1. Num projeto Python, onde fica a chave de API durante o desenvolvimento?
   - ✔ No arquivo `.env`, fora do Git
   - Escrita no código
   - No `requirements.txt`
   - _Explicação:_ O código pede a chave pelo nome. O valor fica só no `.env`.

2. Qual arquivo impede o `.env` de ir para o GitHub?
   - ✔ O `.gitignore`
   - O `README.md`
   - O `requirements.txt`
   - _Explicação:_ O que está listado no `.gitignore` não entra nos commits.

3. Para que serve um arquivo `.env.example`?
   - ✔ Mostrar quais variáveis configurar, sem os valores
   - Guardar uma cópia da chave
   - Substituir o `.gitignore`
   - _Explicação:_ É o modelo em branco: nomes sim, segredos não.

### 5.17 SDK oficial

1. Por que usar o SDK oficial em vez de montar tudo com requests?
   - ✔ Menos código, erros mais claros e novas tentativas automáticas
   - Porque requests é proibido
   - Porque o SDK é gratuito e requests é pago
   - _Explicação:_ Os dois funcionam. O SDK só poupa trabalho e erro.

2. Por que guardar o nome do modelo numa variável no topo do arquivo?
   - ✔ Porque os nomes mudam, e assim se troca num lugar só
   - Porque o Python exige
   - Para a resposta sair mais curta
   - _Explicação:_ Quando o modelo for aposentado, você muda uma linha, e não vinte.

3. Como o SDK do Groq encontra a chave quando ela não é passada no código?
   - ✔ Lê a variável de ambiente `GROQ_API_KEY`
   - Pede a chave por e-mail
   - Usa uma chave pública padrão
   - _Explicação:_ Por isso basta carregar o `.env` antes de criar o cliente.

### 5.18 Saída estruturada em código

1. O JSON que o modelo devolveu veio inválido. O que o programa deve fazer?
   - ✔ Tentar de novo um número limitado de vezes, ou usar o modo estruturado da API
   - Usar assim mesmo
   - Tentar para sempre, até dar certo
   - _Explicação:_ Nova tentativa com limite. Laço sem limite é conta alta e programa travado.

2. O que `json.loads(texto)` faz?
   - ✔ Converte um texto JSON em dicionário ou lista do Python
   - Envia o JSON para a API
   - Salva o JSON num arquivo
   - _Explicação:_ É a ponte entre o texto que o modelo escreveu e os dados que o programa usa.

3. Para que servem o `try` e o `except` em Python?
   - ✔ Tratar um erro esperado sem o programa quebrar
   - Repetir um bloco várias vezes
   - Definir uma função
   - _Explicação:_ Repetir é com `for` e `while`. Definir função é com `def`.

### 5.19 LangChain 1.x

1. Para que serve a LangChain?
   - ✔ Padronizar o uso de modelos e ferramentas de vários provedores
   - Treinar modelos do zero
   - Substituir o Python
   - _Explicação:_ É uma camada comum por cima dos SDKs de cada empresa.

2. O que o `init_chat_model` da LangChain devolve?
   - ✔ Um modelo de chat com os mesmos comandos para qualquer provedor
   - Uma chave de API nova
   - Um arquivo `.env`
   - _Explicação:_ Por isso trocar de provedor vira trocar uma linha.

3. Um tutorial de LangChain usa `LLMChain` e `AgentExecutor`. O que isso indica?
   - ✔ Que é da geração anterior à LangChain 1.0
   - Que é a versão mais nova
   - Que não usa Python
   - _Explicação:_ Na 1.x, esses nomes só existem no pacote `langchain-classic`.

### 5.20 Automação final

1. Por que cortar o texto do PDF em pedaços antes de enviar ao modelo?
   - ✔ Para caber na janela de contexto e nos limites do plano
   - Para o PDF ficar mais leve
   - Porque o modelo só lê uma palavra por vez
   - _Explicação:_ Texto demais num pedido só estoura a janela ou o limite de tokens por minuto.

2. Qual é a vantagem de fazer uma função para cada etapa de uma automação?
   - ✔ Dá para testar e consertar cada etapa separadamente
   - O programa fica mais longo
   - O Python exige
   - _Explicação:_ Quando algo sai errado, você sabe em qual estação procurar.

3. Por que colocar uma pausa entre as chamadas ao modelo dentro de um laço?
   - ✔ Para não estourar o limite de pedidos por minuto
   - Para o modelo descansar
   - Para gastar menos disco
   - _Explicação:_ Sem pausa, o laço dispara tudo de uma vez e vem o 429.

## Módulo 6 — Agentes inteligentes

### 6.1 Arquitetura de um agente

1. O que limita o que um agente de IA consegue fazer?
   - ✔ As ferramentas e as instruções que ele recebeu
   - A velocidade da internet
   - O tamanho do nome do agente
   - _Explicação:_ Sem ferramenta para uma ação, o agente não tem como executá-la.

2. No laço de um agente, quem executa a ferramenta?
   - ✔ O seu programa; o modelo só faz o pedido
   - O próprio modelo, dentro do servidor dele
   - O usuário, manualmente
   - _Explicação:_ O modelo devolve um pedido estruturado. Rodar a função é trabalho do seu código.

3. Quais são as cinco peças de um agente de IA?
   - ✔ Modelo, instruções, ferramentas, memória e laço
   - Teclado, mouse, tela, caixa de som e câmera
   - Entrada, saída, erro, aviso e registro
   - _Explicação:_ Mudam os nomes de uma ferramenta para outra. As cinco peças são sempre essas.

### 6.2 Ferramentas com @tool

1. A docstring de uma ferramenta importa para o agente?
   - ✔ Sim: é a descrição que o modelo lê para decidir quando usar
   - Não: é só um comentário para humanos
   - Só se tiver mais de 100 palavras
   - _Explicação:_ Para o modelo, a docstring **é** a ferramenta. O código ele não vê.

2. O que o decorador `@tool` faz com uma função Python?
   - ✔ Transforma a função numa ferramenta que o agente pode pedir
   - Faz a função rodar mais rápido
   - Esconde a função do modelo
   - _Explicação:_ Ele empacota nome, descrição e parâmetros num formato que o modelo entende.

3. O que uma ferramenta deve fazer quando algo dá errado dentro dela?
   - ✔ Devolver uma mensagem de erro clara, em vez de quebrar
   - Encerrar o programa
   - Devolver um resultado inventado
   - _Explicação:_ Com a mensagem, o modelo pode explicar o problema ou tentar outro caminho.

### 6.3 create_agent

1. Na LangChain 1.x, qual função o `create_agent` substituiu?
   - ✔ O `create_react_agent`
   - O `print`
   - O `init_chat_model`
   - _Explicação:_ O `create_react_agent`, do `langgraph.prebuilt`, ficou obsoleto com a versão 1.0.

2. Depois de `agente.invoke(...)`, onde está a resposta final do agente?
   - ✔ Na última mensagem: `resultado["messages"][-1].content`
   - Na primeira mensagem da lista
   - No arquivo `.env`
   - _Explicação:_ A lista traz a conversa inteira. A resposta final é sempre a última.

3. Quais são as três entradas principais do `create_agent`?
   - ✔ O modelo, as ferramentas e o system prompt
   - A chave, a senha e o e-mail
   - O PDF, o CSV e o JSON
   - _Explicação:_ Cérebro, gavetas e regulamento. O laço vem pronto.

### 6.4 RAG como ferramenta

1. Quando o agente deve usar a ferramenta de busca nas anotações?
   - ✔ Em perguntas sobre o conteúdo do seu material
   - Em toda mensagem, inclusive “bom dia”
   - Nunca: ele já sabe tudo
   - _Explicação:_ Buscar tem custo. Vale quando a resposta depende do que está nas anotações.

2. Qual é a diferença entre o RAG fixo e o RAG como ferramenta?
   - ✔ No fixo, a busca roda sempre; como ferramenta, o agente decide quando buscar
   - O RAG fixo não usa banco vetorial
   - Não há diferença
   - _Explicação:_ A busca é a mesma. Muda quem decide a hora de usá-la.

3. Qual é o risco do RAG como ferramenta?
   - ✔ O agente pode não buscar e responder de cabeça
   - O banco vetorial é apagado a cada pergunta
   - A busca fica proibida
   - _Explicação:_ Por isso a regra no system prompt e os testes com perguntas de dentro e de fora.

### 6.5 Memória de curto prazo

1. Qual é a diferença entre memória de curto e de longo prazo num agente?
   - ✔ A de curto prazo vale para a sessão; a de longo prazo vale entre sessões
   - A de curto prazo é gratuita e a de longo prazo é paga
   - Não há diferença
   - _Explicação:_ Comanda da mesa contra ficha do cliente: uma dura a visita, a outra dura todas.

2. Na LangChain 1.x, para que serve o `thread_id`?
   - ✔ Identificar a conversa, para o histórico certo ser recarregado
   - Escolher o modelo
   - Guardar a chave de API
   - _Explicação:_ Um `thread_id` por conversa. O mesmo para todos misturaria tudo.

3. O que fazer quando a conversa do agente fica longa demais para a janela?
   - ✔ Cortar as mensagens antigas ou resumir o começo
   - Aumentar a temperatura
   - Apagar as ferramentas
   - _Explicação:_ O essencial fica num resumo, e as trocas recentes ficam inteiras.

### 6.6 Memória de longo prazo

1. O que não se deve guardar na memória de longo prazo de um agente?
   - ✔ Dado sensível ou desnecessário para o serviço
   - A preferência por respostas curtas
   - O módulo em que a pessoa está
   - _Explicação:_ Princípio da necessidade, da LGPD: só o mínimo que melhora o serviço.

2. Para que serve um store na LangChain?
   - ✔ Guardar informações que valem entre conversas diferentes
   - Guardar o histórico de uma única conversa
   - Instalar bibliotecas
   - _Explicação:_ O histórico de uma conversa é com o checkpointer. O store é a ficha permanente.

3. Como uma preferência guardada chega ao modelo numa conversa nova?
   - ✔ O programa carrega do store e coloca nas instruções
   - O modelo lembra sozinho
   - O usuário precisa repetir
   - _Explicação:_ O modelo continua sem memória própria. Quem recoloca a ficha na mesa é o seu código.

### 6.7 Avaliação e guardrails

1. Por que limitar as iterações do laço de um agente?
   - ✔ Para evitar laço sem fim e custo descontrolado
   - Para a resposta ficar mais bonita
   - Para usar menos memória RAM
   - _Explicação:_ Sem teto, um agente confuso gira, gasta e não entrega.

2. O que é um guardrail num agente de IA?
   - ✔ Uma trava que limita o que o agente pode fazer ou gastar
   - Um modelo mais inteligente
   - Um tipo de banco vetorial
   - _Explicação:_ Limites de passos, de tokens, de escopo e de poder das ferramentas.

3. Que casos um bom conjunto de testes de agente inclui, além das perguntas normais?
   - ✔ Perguntas de fora do material e tentativas de burlar as regras
   - Só as perguntas que ele já acerta
   - Perguntas em outro alfabeto
   - _Explicação:_ É nos casos difíceis que se descobre se as travas funcionam.

### 6.8 Quando (não) usar multiagentes

1. Mais agentes significam sempre um resultado melhor?
   - ✔ Não: aumentam o custo, a lentidão e os pontos de falha
   - Sim: cada agente soma qualidade
   - Sim, a partir de cinco agentes
   - _Explicação:_ Cada agente a mais é mais uma chamada, mais um prompt e mais um lugar para errar.

2. Qual é a parte mais difícil de um sistema multiagente?
   - ✔ Passar o contexto de um agente para outro sem perder informação
   - Escolher o nome dos agentes
   - Instalar o Python
   - _Explicação:_ O que um agente sabe não passa sozinho para o outro. Alguém precisa resumir e entregar.

3. Qual é a ordem recomendada ao projetar uma solução com IA?
   - ✔ Fluxo fixo, depois um agente, depois vários agentes
   - Começar com dez agentes e ir tirando
   - Sempre multiagente
   - _Explicação:_ Comece pelo mais simples que resolve. Complexidade só entra com motivo.

### 6.9 Papéis

1. O que faz o supervisor numa equipe de agentes?
   - ✔ Decide qual especialista chamar e junta os resultados
   - Escreve todo o conteúdo sozinho
   - Guarda as chaves de API
   - _Explicação:_ Ele roteia e coordena. O trabalho especializado é dos outros.

2. Qual é a diferença entre coordenar agentes em esteira e com supervisor?
   - ✔ Na esteira a ordem é fixa; o supervisor decide a ordem a cada pedido
   - A esteira usa mais agentes
   - Não há diferença
   - _Explicação:_ Esteira é previsível e barata. Supervisor é flexível e custa mais chamadas.

3. Como devem ser os papéis numa equipe de agentes?
   - ✔ Sem sobreposição, com poucas ferramentas e uma entrega clara cada um
   - Todos iguais, para garantir
   - Quanto mais ferramentas por agente, melhor
   - _Explicação:_ Cada agente faz uma coisa bem feita e sabe para quem entrega.

### 6.10 LangGraph

1. Para que serve o LangGraph?
   - ✔ Para ter controle fino do fluxo e do estado de agentes
   - Para desenhar gráficos de vendas
   - Para substituir o banco vetorial
   - _Explicação:_ Apesar do nome, não é de gráficos: é de grafos, isto é, nós ligados por arestas.

2. No LangGraph, o que é o estado?
   - ✔ O dicionário compartilhado que os nós leem e atualizam
   - A cidade onde fica o servidor
   - O nome do grafo
   - _Explicação:_ É a mochila que passa de nó em nó, ganhando campos pelo caminho.

3. O que uma aresta condicional permite num grafo do LangGraph?
   - ✔ Escolher o próximo nó conforme o resultado, como voltar se a revisão reprovar
   - Rodar o grafo sem estado
   - Apagar um nó
   - _Explicação:_ É a bifurcação do grafo: o IF do n8n, agora entre agentes.

### 6.11 Builders visuais

1. Por que não usar o Flowise em um projeto novo?
   - ✔ Foi descontinuado e não recebe mais correções de segurança
   - Porque é pago
   - Porque só funciona em inglês
   - _Explicação:_ Software sem manutenção acumula falhas que ninguém conserta.

2. Qual é a diferença entre um chatflow e um agentflow?
   - ✔ O chatflow segue uma linha reta; o agentflow tem um agente que decide
   - O chatflow não usa modelo
   - São dois nomes para a mesma coisa
   - _Explicação:_ É a mesma diferença entre o fluxo fixo e o agente, agora em blocos.

3. O que conferir antes de adotar uma ferramenta de IA?
   - ✔ Se ela está ativa, quem mantém e como exportar o seu trabalho
   - Só se o site é bonito
   - Só o número de seguidores
   - _Explicação:_ Ferramentas acabam. Quem consegue exportar, migra.

### 6.12 Gradio

1. O que faz o `share=True` no `launch()` do Gradio?
   - ✔ Cria um link público temporário que leva ao app no seu PC
   - Publica o app para sempre na internet
   - Envia o código para o GitHub
   - _Explicação:_ É um túnel provisório. O app continua rodando na sua máquina.

2. O que acontece com o link `gradio.live` quando você fecha o programa?
   - ✔ Para de funcionar
   - Continua no ar por um mês
   - Vira um site permanente
   - _Explicação:_ Sem o programa rodando, não há nada do outro lado do túnel.

3. O que recebe a função entregue ao `gr.ChatInterface`?
   - ✔ A mensagem do usuário e o histórico da conversa
   - A chave de API e a senha
   - Só o nome do modelo
   - _Explicação:_ Dois parâmetros entram e o texto da resposta sai.

### 6.13 Streamlit

1. Por que usar o `st.session_state` num app Streamlit?
   - ✔ Porque o script roda de novo a cada interação, e ele preserva os dados
   - Para o app ficar mais colorido
   - Para guardar a chave de API
   - _Explicação:_ Sem ele, tudo o que o script criou é recriado do zero a cada clique.

2. O que acontece com uma variável comum quando o usuário interage com um app Streamlit?
   - ✔ Volta ao valor inicial, porque o script inteiro reexecuta
   - Fica guardada para sempre
   - É enviada ao GitHub
   - _Explicação:_ É o quadro branco sendo apagado e redesenhado.

3. Qual comando inicia um app Streamlit no seu computador?
   - ✔ `streamlit run app.py`
   - `python streamlit`
   - `pip run app`
   - _Explicação:_ Rodar com `python app.py` não abre a página: tem de ser pelo `streamlit run`.

### 6.14 Segredos no deploy

1. No deploy, a chave de API vai no repositório?
   - ✔ Nunca: ela fica no cofre de segredos da plataforma
   - Sim, se o repositório for privado
   - Sim, num arquivo escondido
   - _Explicação:_ Arquivo escondido e repositório privado não são cofre.

2. Como o código lê um segredo no Streamlit?
   - ✔ Com `st.secrets["NOME"]`
   - Com `print("NOME")`
   - Lendo o `README.md`
   - _Explicação:_ Funciona igual no PC (secrets.toml) e na nuvem (painel Secrets).

3. Por que usar uma chave separada para um app público?
   - ✔ Para poder revogá-la sem afetar os outros projetos
   - Porque chaves separadas são mais rápidas
   - Porque o GitHub exige
   - _Explicação:_ Se algo der errado, você mata só aquela chave.

### 6.15 Streamlit Community Cloud

1. Um app no plano gratuito do Streamlit Community Cloud “dorme”?
   - ✔ Sim, depois de 12 horas sem visitas, e acorda quando alguém acessa
   - Não: fica sempre ligado
   - Sim, e precisa ser publicado de novo
   - _Explicação:_ Dormir não apaga nada: o primeiro visitante só espera alguns segundos.

2. Qual arquivo o Streamlit Cloud usa para instalar as bibliotecas do app?
   - ✔ O `requirements.txt`
   - O `.env`
   - O `README.md`
   - _Explicação:_ O servidor instala só o que está nessa lista.

3. O que acontece com os arquivos que o app grava no Streamlit Cloud?
   - ✔ Somem quando o app reinicia
   - Ficam guardados para sempre
   - Vão para o GitHub sozinhos
   - _Explicação:_ O disco do app é temporário. Dado que precisa durar vai para um banco externo.

### 6.16 Hugging Face Hub e Spaces

1. Em 2026, uma conta gratuita cria um Space Gradio comum no Hugging Face?
   - ✔ Não: criar Spaces Gradio ou Docker passou a exigir plano pago
   - Sim, sem nenhum limite
   - Sim, mas só uma vez por mês
   - _Explicação:_ Restaram os Spaces estáticos e até 2 Spaces Gradio no modo ZeroGPU.

2. O que é um model card no Hugging Face?
   - ✔ A ficha do modelo: uso, idiomas, licença e limitações
   - O cartão de crédito da conta
   - Um tipo de placa de vídeo
   - _Explicação:_ É a bula do modelo. Leia antes de usar.

3. O que os Spaces do Hugging Face hospedam?
   - ✔ Apps de demonstração, como interfaces em Gradio
   - Só arquivos PDF
   - Bancos de dados SQL
   - _Explicação:_ Modelos e dados ficam no Hub. Os Spaces são as salas de demonstração.
