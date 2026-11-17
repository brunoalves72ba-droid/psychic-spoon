# Inventário do app Formação IA (gerado do código)

> Gerado por `tools/gerar-inventario.mjs`. **Não edite à mão**: mude o código e rode `npm run docs`. O `npm test` avisa se este arquivo ficar desatualizado.

## Números

| Item | Quantidade |
|---|---:|
| Módulos | 7 |
| Aulas (agrupamentos) | 16 |
| Micro-lições | 98 |
| Perguntas de quiz (= cartões de revisão) | 293 |
| Práticas “mão na massa” | 73 (43 no computador) |
| Missões do projeto APE-IA | 32 em 7 etapas |
| Laboratórios | 14 |
| Desafios surpresa | 14 |
| Itens da Ficha viva | 14 (verificada em 2026-11-13) |
| Recursos externos | 32 |
| Fotos | 22 (em 33 lições e 7 módulos) |
| Vídeos configurados | 0 |
| Áudios das aulas | 98 (237 min, 54.2 MB) |
| Arquivos no pré-cache do app | 157 (versão 7513bde69288) |

## Telas (rotas)

Rota `#/secao/pagina/arg` → arquivo `js/views/secao-pagina.js` (ou `secao.js`, recebendo `[pagina, arg]`). Telas imersivas escondem as abas.

| Rota | Arquivo | Imersiva | O que é |
|---|---|---|---|
| `#/hoje` | `js/views/hoje.js` |  | Hoje: um botão grande para começar, uma pergunta-relâmpago e a semana. O resto fica quieto. |
| `#/trilha` | `js/views/trilha.js` |  | Mapa da trilha: 7 ilhas (M0 a M6) e o APE-IA crescendo a cada módulo concluído. |
| `#/trilha/m` | `js/views/trilha-m.js` |  | Página de um módulo: aulas, micro-lições, missão do projeto e recursos externos. |
| `#/licao` | `js/views/licao.js` | sim | Player da micro-lição: sempre os mesmos 7 passos, um conceito, uma tela por vez. Gancho → ideia com analogia → exemplo resolvido → exercício → quiz → erro comum → fim com o próximo passo pronto. Dá para voltar a qualquer passo já visto (tocando nos passos do topo, no botão Voltar ou na seta ←) |
| `#/revisar` | `js/views/revisar.js` |  | Revisar: cartões espaçados (1, 3, 7 e 21 dias, com teto de 15 por dia) e revisão misturada. |
| `#/revisar/cartoes` | `js/views/revisar-cartoes.js` | sim | Sessão de cartões: tentar lembrar, ver a resposta, dizer como foi. Quem errou revê no fim da sessão. |
| `#/revisar/mistura` | `js/views/revisar-mistura.js` | sim | Revisão misturada: perguntas de módulos diferentes, embaralhadas (intercalação). |
| `#/revisar/importar` | `js/views/revisar-importar.js` |  | Importar cartões: JSON [{frente, verso}] ou CSV (frente;verso), inclusive os gerados pela Fábrica de flashcards. |
| `#/projeto` | `js/views/projeto.js` |  | Projeto: o APE-IA (Assistente Pessoal de Estudos com IA), montado módulo a módulo. |
| `#/projeto/m` | `js/views/projeto-m.js` |  | Missões do projeto em um módulo: passos pequenos, de 10 a 25 minutos, com lista de conferência. |
| `#/projeto/diario` | `js/views/projeto-diario.js` |  | Diário de bordo: uma frase por sessão. É a primeira entrega do projeto (Módulo 0). |
| `#/projeto/ficha` | `js/views/projeto-ficha.js` |  | Ficha técnica do APE-IA (entrega do Módulo 1): objetivo, 2 modelos, 5 regras e um teste de alucinação. |
| `#/projeto/prompts` | `js/views/projeto-prompts.js` |  | Biblioteca de prompts (entrega do Módulo 2): variáveis {assim}, versões, exemplo e rubrica de 4 pontos. |
| `#/projeto/kits` | `js/views/projeto-kits.js` |  | Kits de código do projeto: arquivos prontos para baixar e rodar no computador. |
| `#/projeto/pendencias` | `js/views/projeto-pendencias.js` |  | Práticas “mão na massa” guardadas para quando você estiver no computador. |
| `#/progresso` | `js/views/progresso.js` |  | Progresso: o que foi aprendido e o que ficou na memória. Minutos de tela não entram na conta. |
| `#/progresso/semana` | `js/views/progresso-semana.js` |  | Revisão da semana: 3 vitórias, 1 dificuldade e o plano em 3 linhas. E o desafio surpresa da quinzena. |
| `#/progresso/cronograma` | `js/views/progresso-cronograma.js` |  | Cronograma: Plano A (≈26 semanas) ou B (≈48 semanas). Se uma semana for ruim, as datas são recalculadas, sem cobrança. |
| `#/progresso/conquistas` | `js/views/progresso-conquistas.js` |  | Conquistas: cada uma marca uma habilidade, não tempo de tela. |
| `#/labs` | `js/views/labs.js` |  | Laboratórios: simuladores para mexer e ver acontecer. |
| `#/labs/x` | `js/views/labs-x.js` |  | Um laboratório aberto em modo livre (sem missão). |
| `#/mais/ficha` | `js/views/mais-ficha.js` |  | Ficha viva: modelos, cotas, preços e regras que mudam rápido, com a data da última conferência. |
| `#/mais/porque` | `js/views/mais-porque.js` |  | Por que o app é assim: cada escolha de desenho, com o grau de evidência e a leitura honesta. |
| `#/mais/ajustes` | `js/views/mais-ajustes.js` |  | Ajustes: nome, celular e PC, áudio, meta de minutos, plano e dados. "Sobre o app" fica no menu lateral. |
| `#/mais/backup` | `js/views/mais-backup.js` |  | Backup: exportar tudo num arquivo JSON e restaurar em outro aparelho. |
| `#/mais/pensamentos` | `js/views/mais-pensamentos.js` |  | Pensamentos guardados durante o estudo, para resolver depois. |
| `#/mais/lembretes` | `js/views/mais-lembretes.js` |  | Lembretes: eventos semanais no calendário do celular (.ics), com a próxima ação concreta escrita no aviso. Um app web não consegue avisar de forma confiável com o navegador fechado; o calendário consegue. |
| `#/mais/sync` | `js/views/mais-sync.js` |  | Sincronização entre celular e PC: configuração passo a passo e situação atual. |
| `#/mais/instalar` | `js/views/mais-instalar.js` |  | Instalar como app próprio e guardar tudo no aparelho: lições, fotos, laboratórios, Python e kits. |
| `#/mais/sobre` | `js/views/mais-sobre.js` |  | Sobre o app: o que é, de quem é, versão e a busca de atualização. |
| `#/foco` | `js/views/foco.js` | sim | Modo foco: tela limpa, relógio visível de 10, 15 ou 25 min e a opção de continuar no fluxo. O relógio avisa, mas nunca interrompe: quem está em hiperfoco decide se segue. |

Abas: **Hoje** (`hoje`) · **Trilha** (`trilha`) · **Revisar** (`revisar`) · **Projeto** (`projeto`) · **Progresso** (`progresso`).

## Arquivos do app

### Núcleo (`js/core`)

| Arquivo | Linhas | O que é | Exporta |
|---|---:|---|---|
| `js/core/abertura.js` | 32 | Primeira abertura: pergunta como a pessoa quer ser chamada. Depois vem as boas-vindas e a tela Hoje. | `pularAbertura`, `pedirNome` |
| `js/core/andaime.js` | 48 | Exemplos "desbotados": o mesmo gabarito vira exemplo completo → falta 1 passo → faltam vários → do zero. O andaime sobe quando você acerta de primeira 80% das vezes e volta quando está difícil. Funções puras. | `parseMolde`, `solucao`, `aplicarNivel`, `maiorNivel`, `confere`, `novoAndaime`, `registrar` |
| `js/core/audio.js` | 161 | Áudio das aulas: MP3 gerado uma vez com voz neural (tools/audio/gerar-audio.mjs) e tocado aqui. audio/indice.json diz quais aulas têm áudio (sem áudio, a aula aparece só com o texto, sem erro). O MP3 é baixado na primeira vez que a aula é tocada e fica guardado no aparelho (funciona sem internet). | `carregarIndice`, `infoAudio`, `baixados`, `baixarTodos`, `playerAula` |
| `js/core/biblioteca.js` | 60 | Biblioteca de prompts do APE-IA (projeto do Módulo 2): prompts com variáveis, versão, exemplo e rubrica. | `RUBRICA`, `variaveis`, `nota`, `novoPrompt`, `atualizarPrompt`, `removerPrompt`, `exportarMarkdown`, `botaoSalvar` |
| `js/core/boasvindas.js` | 80 | Boas-vindas ao abrir o app a frio: card de vidro no centro com a mascote, uma linha sobre o curso e uma frase do banco de 150 (sem repetir as últimas 10). Não some sozinho; "Pular" e Esc fecham na hora. Voltar do segundo plano em menos de 30 min não mostra de novo. | `boasVindasFechadas`, `aberturaAFrio`, `mostrarBoasVindas` |
| `js/core/cartao-checkin.js` | 108 | Card do check-in na tela Hoje: círculo que pisca, três carinhas, o check desenhado (leve, como o de carteira digital), a carinha indo para o canto ao lado da saudação, as pílulas de tempo, as sugestões e a curiosidade do dia. Sem pop-up, sem som. | `rostoNoCanto`, `cartaoCheckin` |
| `js/core/checkin.js` | 73 | Check-in do dia: uma carinha (feliz, neutra, triste) e o tempo disponível (5, 15 ou 30 min). Um por dia (dia local). A carinha não muda no mesmo dia; o tempo muda. Sincroniza entre aparelhos. | `HUMORES`, `ENERGIA`, `ROTULO`, `TEMPOS`, `checkinHoje`, `registrarCheckin`, `mudarTempo`, `podarHistorico`, `curiosidadeDoDia`, `curiosidadeDispensada`, `dispensarCuriosidade`, `rosto` |
| `js/core/conquistas.js` | 46 | Conquistas por habilidade: marcam coisas que você passou a saber fazer, não tempo de tela. | `CONQUISTAS`, `verificarConquistas` |
| `js/core/cortes.js` | 55 | Pontos de corte entre as partes do áudio de uma aula (Começo, Ideia, Exemplo, Erro comum). Com vozes que não devolvem o tempo exato de cada parte (Chirp 3 HD, ElevenLabs), o gerador só estima onde cada parte começa. Aqui o app procura, perto de cada estimativa, a pausa de silêncio mais longa: | `energia`, `silencios`, `ajustarCortes` |
| `js/core/dia.js` | 18 | Datas como chaves "AAAA-MM-DD" (dia local). Semana de segunda a domingo. Funções puras. | `dayKey`, `addDays`, `diffDays`, `dow`, `weekStart`, `weekDays`, `DIAS`, `hoje` |
| `js/core/estado.js` | 266 | Estado do app em memória (carregado uma vez, gravado a cada mudança) e as ações de estudo. | `XP`, `XP_NIVEL`, `nivel`, `L`, `salvarLocal`, `uid`, `aoSalvar`, `S`, `revs`, `eventosSemana`, `salvar`, `gravado`, `nomeUsuario`, `definirNome`, `carregar`, `fecharSemanas`, `apagar`, `registrar`, `tocarDia`, `ganhar`, `marco`, `prog`, `irPasso`, `registrarQuiz`, `registrarExercicio`, `concluirLicao`, `marcarMao`, `pendencias`, `responderCartao`, `filaDeHoje`, `vencidosHoje`, `adicionarMeus`, `removerMeu`, `apagarDiario`, `apagarPensamento`, `anotarPensamento`, `escreverDiario`, `marcarMissao`, `exportar`, `importar`, `aplicar`, `lerTudo`, `apagarTudo` |
| `js/core/exercicios.js` | 286 | Exercícios das micro-lições, todos com resposta imediata. Cada um chama feito({ dePrimeira, tent, ajuda }) ao terminar. | `embaralhar`, `pergunta`, `TIPOS_EX`, `montarExercicio`, `gabarito` |
| `js/core/fotos.js` | 27 | Fotos reais (Wikimedia Commons, licenças livres) com crédito visível em cada uma. | `foto`, `fotoDaLicao`, `fotoDoModulo`, `credito`, `figura`, `faixa` |
| `js/core/grifo.js` | 87 | Texto grifado durante o áudio: o parágrafo que a voz está lendo fica em destaque (barra cinza-clara de 2 px à esquerda, texto claro) e os outros ficam em cinza. Sem violeta e sem rolar a tela sozinho: se o trecho sair da tela, aparece o botão "Voltar ao trecho". Os tempos vêm de audio/tempos.json (gerado | `carregarTempos`, `grifoLigado`, `trechoEm`, `grifador` |
| `js/core/instalar.js` | 63 | Instalação como app próprio (ícone separado do Sexteto) e tudo guardado no aparelho para usar sem internet. | `aoMudar`, `instalado`, `podeInstalar`, `ehIOS`, `instalar`, `situacaoOffline`, `guardarTudo` |
| `js/core/json-pt.js` | 158 | Leitor de JSON com mensagens de erro em português, pensadas para quem está começando. analisar(texto) → { ok: true, valor } ou { ok: false, pos, linha, col, msg, dica }. | `analisar`, `conferirFormato` |
| `js/core/luz.js` | 66 | Luz em volta do card de destaque (um por tela): uma volta de 2,4 s ao entrar na aba pela primeira vez na sessão; toque no card = nova volta + brilho difuso atrás; toque no botão principal = flash do contorno. Só transform e opacity animam. Com "reduzir movimento": sem giro, o toque só acende um pouco a borda. | `luz`, `_reiniciarLuz` |
| `js/core/mascote.js` | 95 | A mascote: personagem original e simples (uma gotinha com antena de faísca), em SVG inline. Um acessório por aba (camadas que entram e saem por opacidade e transform), pisca a cada 6–10 s e coloca os óculos ao entrar numa lição. Decorativa: aria-hidden. | `ACESSORIO`, `mascote`, `pular`, `_ultimoAcessorio` |
| `js/core/menu.js` | 132 | Saudação ("Oi, nome") e menu lateral: no celular, uma gaveta que abre da esquerda; no PC, os mesmos itens numa seção do menu fixo, abaixo das cinco abas. | `itensMenu`, `saudacao`, `menuAberto`, `abrirMenu`, `fechar`, `montarMenuPC` |
| `js/core/mesclar.js` | 149 | Mesclagem de dois estados (celular e PC) sem perder progresso. Funções puras, testadas. Regra geral: progresso só avança (lição concluída, cartão revisto, missão marcada nunca “desfazem”), e o que foi editado por inteiro (perfil, ficha técnica, prompt) fica com a versão mais recente. | `idDiario`, `idEvento`, `mesclarKv`, `mesclarLog` |
| `js/core/nuvem.js` | 142 | Sincronização entre aparelhos por um Gist secreto do GitHub, com o conteúdo cifrado. - O token (permissão só de “gist”) fica apenas neste aparelho; o mesmo token no outro aparelho acha o mesmo Gist. - O conteúdo é cifrado (AES-GCM) com uma chave derivada do token: quem só tiver o link do Gist não consegue ler. | `API`, `ARQUIVO`, `LINK_TOKEN`, `estavel`, `cifrar`, `decifrar`, `status`, `aoMudar`, `quandoReceber`, `sincronizar`, `agendar`, `conectar`, `desconectar`, `recomecarNuvem`, `iniciar` |
| `js/core/pensamento.js` | 15 | Captura de distração: anotar o pensamento intruso sem sair de onde está. | `capturar` |
| `js/core/plano.js` | 39 | Cronograma: Plano A (4–5 h/semana, ≈26 semanas) e Plano B (2–3 h/semana, ≈48 semanas). Se uma semana for ruim, as datas são recalculadas a partir de hoje, sem cobrança. Funções puras. | `PLANOS`, `calendario`, `situacao`, `recalcular` |
| `js/core/plataforma.js` | 36 | Reconhece se o app está num computador ou num celular e adapta a tela. Automático: mouse/trackpad (ponteiro fino com hover) e tela larga = PC. Dá para forçar nos Ajustes. | `detectar`, `plataforma`, `ehPC`, `aoTrocar`, `aplicarPlataforma`, `escolher` |
| `js/core/robo.js` | 32 | O APE-IA crescendo: cada módulo concluído acende uma parte do assistente. | `PARTES`, `robo` |
| `js/core/sequencia.js` | 61 | Sequência que perdoa: meta semanal de 4 dias em 7, dois congelamentos automáticos, zero culpa. Um dia conta quando houve qualquer estudo (o "dia mínimo" é 1 cartão). Funções puras. | `META`, `GELOS_MAX`, `novaSequencia`, `diasAtivos`, `fechar`, `semanaAtual`, `diasSeguidos`, `diasEstudados` |
| `js/core/sorteio.js` | 13 | Sorteio das frases de boas-vindas (puro, testável). | `sortear` |
| `js/core/srs.js` | 56 | Revisão espaçada em escada fixa: o conceito volta em 1, 3, 7 e 21 dias (depois 60 e 120). A escada fixa é previsível e deixa medir a retenção de 7 e de 21 dias diretamente. Funções puras. | `ESCADA`, `TETO`, `NOTAS`, `novoCartao`, `responder`, `vencidos`, `fila`, `previsao`, `retencao`, `resumo` |
| `js/core/store.js` | 71 | Armazenamento local (IndexedDB) com esquema versionado. Tudo fica só no aparelho: sem servidor, sem login, sem analytics. Sem IndexedDB (ou nos testes), usa memória. | `DB_NAME`, `SCHEMA`, `kv`, `log`, `persistir`, `_resetMem` |
| `js/core/texto.js` | 139 | Algoritmos dos laboratórios: tokens (aproximação didática), softmax com temperatura, cosseno, chunking e busca por palavras (TF-IDF). Tudo puro e testado. | `tokensAprox`, `contarPalavras`, `softmax`, `amostrar`, `cosseno`, `chunk`, `semAcento`, `termos`, `criarIndice`, `buscar` |
| `js/core/ui.js` | 280 | Utilitários de interface: criação de DOM, texto rico das lições, avisos, folhas e controles. | `h`, `s`, `clear`, `put`, `reducedMotion`, `clamp`, `fmt`, `fmtDur`, `fmtDia`, `plural`, `icon`, `top`, `rich`, `blocks`, `codeBlock`, `copyText`, `toast`, `sheet`, `confirmSheet`, `seg`, `slider`, `toggle`, `tick`, `progressBar`, `vib`, `wake`, `shareOrDownload`, `download`, `textFile` |

### Telas (`js/views`)

| Arquivo | Linhas | O que é | Exporta |
|---|---:|---|---|
| `js/views/foco.js` | 56 | Modo foco: tela limpa, relógio visível de 10, 15 ou 25 min e a opção de continuar no fluxo. O relógio avisa, mas nunca interrompe: quem está em hiperfoco decide se segue. | `default` |
| `js/views/hoje.js` | 157 | Hoje: um botão grande para começar, uma pergunta-relâmpago e a semana. O resto fica quieto. | `default` |
| `js/views/labs-x.js` | 15 | Um laboratório aberto em modo livre (sem missão). | `default` |
| `js/views/labs.js` | 11 | Laboratórios: simuladores para mexer e ver acontecer. | `default` |
| `js/views/licao.js` | 263 | Player da micro-lição: sempre os mesmos 7 passos, um conceito, uma tela por vez. Gancho → ideia com analogia → exemplo resolvido → exercício → quiz → erro comum → fim com o próximo passo pronto. Dá para voltar a qualquer passo já visto (tocando nos passos do topo, no botão Voltar ou na seta ←) | `default` |
| `js/views/mais-ajustes.js` | 62 | Ajustes: nome, celular e PC, áudio, meta de minutos, plano e dados. "Sobre o app" fica no menu lateral. | `default` |
| `js/views/mais-backup.js` | 25 | Backup: exportar tudo num arquivo JSON e restaurar em outro aparelho. | `default` |
| `js/views/mais-ficha.js` | 34 | Ficha viva: modelos, cotas, preços e regras que mudam rápido, com a data da última conferência. | `default` |
| `js/views/mais-instalar.js` | 52 | Instalar como app próprio e guardar tudo no aparelho: lições, fotos, laboratórios, Python e kits. | `default` |
| `js/views/mais-lembretes.js` | 49 | Lembretes: eventos semanais no calendário do celular (.ics), com a próxima ação concreta escrita no aviso. Um app web não consegue avisar de forma confiável com o navegador fechado; o calendário consegue. | `default`, `gerarIcs` |
| `js/views/mais-pensamentos.js` | 20 | Pensamentos guardados durante o estudo, para resolver depois. | `default` |
| `js/views/mais-porque.js` | 36 | Por que o app é assim: cada escolha de desenho, com o grau de evidência e a leitura honesta. | `default` |
| `js/views/mais-sobre.js` | 24 | Sobre o app: o que é, de quem é, versão e a busca de atualização. | `default` |
| `js/views/mais-sync.js` | 51 | Sincronização entre celular e PC: configuração passo a passo e situação atual. | `default` |
| `js/views/progresso-conquistas.js` | 14 | Conquistas: cada uma marca uma habilidade, não tempo de tela. | `default` |
| `js/views/progresso-cronograma.js` | 38 | Cronograma: Plano A (≈26 semanas) ou B (≈48 semanas). Se uma semana for ruim, as datas são recalculadas, sem cobrança. | `default` |
| `js/views/progresso-semana.js` | 47 | Revisão da semana: 3 vitórias, 1 dificuldade e o plano em 3 linhas. E o desafio surpresa da quinzena. | `default` |
| `js/views/progresso.js` | 60 | Progresso: o que foi aprendido e o que ficou na memória. Minutos de tela não entram na conta. | `default` |
| `js/views/projeto-diario.js` | 26 | Diário de bordo: uma frase por sessão. É a primeira entrega do projeto (Módulo 0). | `default`, `diarioMarkdown` |
| `js/views/projeto-ficha.js` | 55 | Ficha técnica do APE-IA (entrega do Módulo 1): objetivo, 2 modelos, 5 regras e um teste de alucinação. | `default`, `fichaMarkdown` |
| `js/views/projeto-kits.js` | 30 | Kits de código do projeto: arquivos prontos para baixar e rodar no computador. | `default` |
| `js/views/projeto-m.js` | 43 | Missões do projeto em um módulo: passos pequenos, de 10 a 25 minutos, com lista de conferência. | `default` |
| `js/views/projeto-pendencias.js` | 27 | Práticas “mão na massa” guardadas para quando você estiver no computador. | `default` |
| `js/views/projeto-prompts.js` | 60 | Biblioteca de prompts (entrega do Módulo 2): variáveis {assim}, versões, exemplo e rubrica de 4 pontos. | `default` |
| `js/views/projeto.js` | 41 | Projeto: o APE-IA (Assistente Pessoal de Estudos com IA), montado módulo a módulo. | `default` |
| `js/views/revisar-cartoes.js` | 97 | Sessão de cartões: tentar lembrar, ver a resposta, dizer como foi. Quem errou revê no fim da sessão. | `default` |
| `js/views/revisar-importar.js` | 54 | Importar cartões: JSON [{frente, verso}] ou CSV (frente;verso), inclusive os gerados pela Fábrica de flashcards. | `default`, `lerCartoes` |
| `js/views/revisar-mistura.js` | 42 | Revisão misturada: perguntas de módulos diferentes, embaralhadas (intercalação). | `default`, `sortear` |
| `js/views/revisar.js` | 59 | Revisar: cartões espaçados (1, 3, 7 e 21 dias, com teto de 15 por dia) e revisão misturada. | `default` |
| `js/views/trilha-m.js` | 39 | Página de um módulo: aulas, micro-lições, missão do projeto e recursos externos. | `default` |
| `js/views/trilha.js` | 33 | Mapa da trilha: 7 ilhas (M0 a M6) e o APE-IA crescendo a cada módulo concluído. | `default` |

### Laboratórios (`js/labs`)

| Arquivo | Linhas | O que é | Exporta |
|---|---:|---|---|
| `js/labs/agente.js` | 46 | Laboratório do laço do agente: você decide cada rodada (pensar, agir, observar) até a resposta final. | `default` |
| `js/labs/api.js` | 67 | Laboratório de API: um servidor de treino, dentro do app, que responde como uma API de chat de verdade. Nenhum pedido sai do aparelho. A chave de treino é pública de propósito. | `default`, `URL_TREINO`, `CHAVE_TREINO`, `servidor` |
| `js/labs/backoff.js` | 49 | Laboratório de limites: 8 pedidos contra um limite de 3 a cada 10 segundos, com três estratégias. | `default`, `LIMITE`, `ESTRATEGIAS`, `simular` |
| `js/labs/chunks.js` | 36 | Laboratório de chunking: tamanho, sobreposição e corte em fim de frase. | `default`, `TEXTO` |
| `js/labs/comum.js` | 55 | Peças comuns dos laboratórios: a caixa de missão e a árvore clicável de JSON. | `missao`, `semMissao`, `arvore`, `limpar` |
| `js/labs/contexto.js` | 41 | Laboratório da janela de contexto: a mesa enche e as mensagens antigas saem. | `default` |
| `js/labs/cosseno.js` | 32 | Laboratório de similaridade de cosseno: duas setas num plano; só o ângulo importa. | `default` |
| `js/labs/json.js` | 26 | Laboratório de JSON: validador com erros em português e árvore clicável que mostra o caminho de cada campo. | `default` |
| `js/labs/n8n-expr.js` | 50 | Laboratório de expressões do n8n: {{ $json.campo }} calculado sobre um item, como no editor. | `default`, `ITEM`, `avaliar`, `preencher` |
| `js/labs/n8n-if.js` | 45 | Laboratório do nó IF: os itens chegam como texto, e a comparação muda com o tipo escolhido. | `default`, `ITENS`, `dividir` |
| `js/labs/prompt.js` | 41 | Laboratório de prompts: confere as 6 partes, conta tokens, compara com uma versão melhorada e guarda na biblioteca. | `default`, `PARTES`, `conferir` |
| `js/labs/proximo.js` | 51 | Laboratório “próximo pedaço”: um modelo de brinquedo que escolhe um pedaço por vez, com temperatura. | `default` |
| `js/labs/py-harness.js` | 27 | Roda o código num espaço de nomes novo. input() lê da lista de entradas; com eco, mostra a pergunta e a resposta. | `HARNESS` |
| `js/labs/py-worker.js` | 23 | Python de bolso: MicroPython (WebAssembly) rodando num Web Worker, para um laço infinito não travar a tela. | — |
| `js/labs/python-texto.js` | 10 | Traceback do MicroPython, sem as linhas internas do app e com “linha N do seu código”. | `limparErro` |
| `js/labs/python.js` | 121 | Python de bolso: rodar código, conferir com testes e o exercício de editor com dicas. | `default`, `rodar`, `rodarTestes`, `relatorio`, `exercicioPython` |
| `js/labs/rag.js` | 49 | Laboratório de RAG: buscar trechos nas anotações (com fonte), variar o top-k e ver o prompt montado. Para caber no aparelho e funcionar sem internet, a busca aqui é por palavras (TF-IDF), não por embeddings. | `default`, `ANOTACOES` |
| `js/labs/tokens.js` | 29 | Laboratório de tokens: o texto partido em peças (aproximação didática) e a contagem. | `default` |

### Dados (`js/data`)

| Arquivo | Linhas | O que é | Exporta |
|---|---:|---|---|
| `js/data/curiosidades.js` | 8 | Frases curtas que aparecem depois do check-in, uma por dia, em rodízio. Para ampliar, é só acrescentar. | `CURIOSIDADES` |
| `js/data/curso.js` | 82 | Estrutura da trilha: 7 módulos (M0 a M6), aulas e a ordem das 98 micro-lições. | `MODULOS`, `TODAS`, `ORDEM`, `PASSOS`, `licao`, `moduloDe`, `modulo`, `idsDoModulo`, `aulaDe`, `proxima`, `seguinte`, `progressoModulo`, `progressoGeral`, `moduloAtual`, `cartao` |
| `js/data/desafios.js` | 44 | Desafio surpresa: a cada 2 semanas, uma tarefa curta e diferente. A novidade ajuda a manter o interesse. | `DESAFIOS`, `desafioDaVez` |
| `js/data/ficha.js` | 24 | Ficha viva: o que muda rápido (modelos, cotas, preços, regras de hospedagem, regulação). Verificado em novembro de 2026, a partir do documento de currículo. Revise a cada trimestre. | `VERIFICADO`, `REVISAR_DIAS`, `FICHA` |
| `js/data/fotos.js` | 249 | Fotos reais do Wikimedia Commons (licenças livres), conferidas uma a uma. Créditos completos em CREDITOS.md. | `FOTOS`, `POR_LICAO`, `POR_MODULO` |
| `js/data/labs.js` | 20 | Catálogo dos laboratórios (Trilha › Laboratórios). | `LABS`, `lab` |
| `js/data/m0.js` | 172 | Módulo 0 — Pré-requisitos (fora da ementa; obrigatório para iniciante absoluto). Convenção de todas as lições: em quiz e casos, a PRIMEIRA opção é a correta (o app embaralha na tela). | `M0` |
| `js/data/m1.js` | 337 | Módulo 1 — IA generativa e LLMs. Aula 1 (1.1 a 1.8) e Aula 2 (1.9 a 1.12). Nomes de modelos, cotas e o andamento do PL 2338 mudam rápido: os detalhes datados ficam na Ficha viva. | `M1` |
| `js/data/m2.js` | 372 | Módulo 2 — Prompt engineering. Aula 1 (2.1 a 2.8) e Aula 2 (2.9 a 2.12). | `M2` |
| `js/data/m3a.js` | 215 | Módulo 3, Aula 1 — APIs de modelos de linguagem (3.1 a 3.7). Cotas e nomes de modelos mudam rápido: os números datados ficam na Ficha viva. | `M3A` |
| `js/data/m3b.js` | 205 | Módulo 3, Aula 2 — Embeddings, bancos vetoriais e RAG (3.8 a 3.14). | `M3B` |
| `js/data/m4a.js` | 176 | Módulo 4, Aula 1 — n8n: fundamentos e fluxos (4.1 a 4.6). A interface do n8n é em inglês e muda com frequência: os nomes dos botões podem variar um pouco. | `M4A` |
| `js/data/m4b.js` | 182 | Módulo 4, Aula 2 — n8n: APIs, ferramentas e bancos de dados (4.7 a 4.12). | `M4B` |
| `js/data/m4c.js` | 188 | Módulo 4, Aula 3 — Agentes de IA no n8n (4.13 a 4.18). | `M4C` |
| `js/data/m5a.js` | 294 | Módulo 5, Aula 1 — Python: fundamentos (5.1 a 5.10). Os exercícios rodam no "Python de bolso" do app (MicroPython no navegador). Os comandos de terminal são para o seu PC. | `M5A` |
| `js/data/m5b.js` | 193 | Módulo 5, Aula 2 — Python: automação de processos (5.11 a 5.16). Estas lições usam bibliotecas e arquivos do seu PC; os exercícios do app conferem a leitura do código. | `M5B` |
| `js/data/m5c.js` | 126 | Módulo 5, Aula 3 — Python com LLMs (5.17 a 5.20). Nomes de modelos mudam: os exemplos usam uma variável MODELO, e a Ficha viva guarda a referência do momento. | `M5C` |
| `js/data/m6a.js` | 212 | Módulo 6, Aula 1 — Agentes com RAG (6.1 a 6.7). Código no estilo da LangChain 1.x (create_agent). | `M6A` |
| `js/data/m6b.js` | 125 | Módulo 6, Aula 2 — Multiagentes (6.8 a 6.11). A ementa cita o Flowise, descontinuado em 2026: a lição 6.11 ensina o conceito e indica alternativas ativas. | `M6B` |
| `js/data/m6c.js` | 159 | Módulo 6, Aula 3 — Interfaces e deploy público (6.12 a 6.16). Na ementa, esta aula repete o título "Integração de Python com LLMs"; pelos tópicos, é tratada como "Interfaces e deploy". Regras e limites de hospedagem mudam: os números datados ficam na Ficha viva. | `M6C` |
| `js/data/projeto.js` | 80 | Projeto único e acumulativo: o “Assistente Pessoal de Estudos com IA” (APE-IA). Cada módulo acrescenta uma parte. Missões de 10 a 25 minutos, com lista de conferência. | `PROJETO`, `missao`, `feitaMissao`, `progressoProjeto`, `proximaMissao` |
| `js/data/recursos.js` | 51 | Recursos externos por módulo (links abrem fora do app). Se algum endereço mudar, procure pelo nome. | `RECURSOS` |
| `js/data/videos.js` | 16 | Formação IA Generativa — vídeos opcionais das aulas (YouTube; pode ser "não listado"). Para pôr um vídeo numa aula, acrescente uma linha: 'ID da aula': 'link do YouTube'. Aceita youtu.be/…, youtube.com/watch?v=…, /shorts/…, /embed/… ou só o código de 11 letras. | `VIDEOS`, `idYoutube`, `videoDaAula` |

### Raiz, ferramentas e testes

| Arquivo | Linhas | O que é | Exporta |
|---|---:|---|---|
| `index.html` | 45 | — | — |
| `sw.js` | 52 | Service worker: pré-cache de tudo na primeira visita; depois, o app funciona offline. | — |
| `js/app.js` | 183 | Ponto de entrada: roteador por hash, cinco abas e service worker. | `OWNER`, `redesenhar`, `procurarAtualizacao`, `versaoAtual` |
| `tools/audio/falado.mjs` | 76 | Formação IA — gerador de áudio (roda só no computador, fora do app). Converte o texto das aulas para a forma FALADA em português, sem mexer no texto exibido na tela: abreviações, símbolos, números, moeda, datas, código em linha e termos em inglês (com <sub alias>). | `escXml`, `codigoFalado`, `falado` |
| `tools/audio/gerar-audio.mjs` | 161 | !/usr/bin/env node Formação IA — gera o áudio de cada aula com voz neural (rode no SEU computador, nunca no app). node tools/audio/gerar-audio.mjs --simular mostra quantos caracteres vai gastar (não chama a API) node tools/audio/gerar-audio.mjs gera o que falta (pula aulas que já têm áudio) | — |
| `tools/audio/mp3.mjs` | 26 | Utilidades de MP3 sem dependências: tirar etiquetas ID3 (para juntar pedaços) e medir a duração pelos quadros. | `semId3`, `duracaoMp3` |
| `tools/audio/ssml.mjs` | 104 | Monta a fala de cada aula em SSML: pausas de ~600 ms entre parágrafos, ~1 s antes de títulos e entre tópicos, títulos um pouco mais devagar, listas item por item, e marcas (<mark>) no começo de cada passo para o app mostrar os capítulos. Também converte para os formatos da Chirp 3 HD e do ElevenLabs. | `CAPITULOS`, `pecasDaAula`, `unidadesDaAula`, `converter`, `textoPuro`, `dividir` |
| `tools/audio/tempos.mjs` | 100 | Tempos de cada parágrafo do áudio das aulas (para grifar o texto enquanto a voz lê). Roda uma vez no computador, sobre os MP3 que já existem: não gera áudio nem gasta créditos. 1. acha o começo de cada parte (as mesmas regras do app: a pausa mais longa perto da estimativa); | `temposDaParte`, `temposDaAula` |
| `tools/exportar-quiz.mjs` | 20 | Gera QUIZ-PARA-REVISAR.md com todas as perguntas do quiz de cada aula (resposta certa, alternativas e explicação), para revisar fora do app. As perguntas ficam nos arquivos das aulas (js/data/m*.js): a PRIMEIRA opção é a certa (a tela embaralha). Uso: node tools/exportar-quiz.mjs | — |
| `tools/gen-precache.mjs` | 27 | Gera sw-assets.js: lista de arquivos para o pré-cache e versão (hash do conteúdo). Uso: node tools/gen-precache.mjs (escreve) node tools/gen-precache.mjs --check (falha se estiver desatualizado) | — |
| `tools/gerar-icones.mjs` | 26 | Gera os ícones PNG a partir de assets/icons/icon.svg (o desenho-fonte): icon-192/512 (cantos arredondados), maskable-192/512 (fundo inteiro, desenho a 80% para o recorte redondo do Android), apple-touch-icon (180, desenho a 86%) e favicon-32. Uso: node tools/gerar-icones.mjs (precisa do Playwright/Chromium). Depois: npm run precache. | — |
| `tools/gerar-inventario.mjs` | 156 | Gera docs/INVENTARIO.md a partir do código: arquivos (com propósito e funções exportadas), rotas, módulos, lições, exercícios, laboratórios, projeto, fotos, áudios, cores e scripts. Rode depois de qualquer mudança: node tools/gerar-inventario.mjs (ou: npm run docs) | — |
| `tools/serve.mjs` | 29 | Servidor estático mínimo para rodar o app localmente: node tools/serve.mjs [porta] [--raiz] Com --raiz, serve a pasta de cima (o repositório inteiro), para testar a convivência com o Sexteto. | — |
| `tests/abertura.test.mjs` | 33 | Boas-vindas: o banco tem as 150 frases sem numeração, e o sorteio não repete as últimas 10. | — |
| `tests/audio.test.mjs` | 157 | Gerador de áudio (tools/audio): forma falada, SSML, divisão no limite da API, MP3 e o gerador inteiro contra uma API do Google de mentira (nenhuma chave real, nenhum caractere gasto). | — |
| `tests/conteudo.test.mjs` | 147 | Valida o conteúdo: as 98 micro-lições do documento, cada uma com os 7 passos completos. | — |
| `tests/e2e/audio.mjs` | 118 | Player do áudio das aulas (voz neural), vídeo opcional e recompensas. Um MP3 de teste (feito com ffmpeg) faz o papel do áudio gerado; o índice e o arquivo de vídeos são trocados só neste teste. Uso: node tests/e2e/audio.mjs | — |
| `tests/e2e/capturas.mjs` | 53 | Capturas de tela das telas principais, no celular (390×844) e no PC (1440×900), com um pouco de progresso já feito (para as telas não ficarem vazias). Uso: node tests/e2e/capturas.mjs <nome-da-pasta> Salva em docs/capturas/<nome>/ — usado para comparar o antes e o depois de uma mudança visual. | — |
| `tests/e2e/contraste.mjs` | 104 | Contraste medido nos pixels reais: esconde o texto, fotografa a tela, mede o fundo atrás de cada trecho de texto e compara com a cor do texto (WCAG: 4,5:1 normal; 3:1 para texto grande). Repete em várias posições de rolagem, porque o fundo é fixo e um card pode passar por cima da parte violeta da tela. Uso: node tests/e2e/contraste.mjs [--pc] | — |
| `tests/e2e/navegacao.mjs` | 237 | Teste ponta a ponta da navegação: pergunta do nome na primeira abertura, saudação, menu lateral (abrir, foco, Esc, véu, arrastar, "voltar" do Android, itens) e a seção do menu no PC. Uso: node tests/e2e/navegacao.mjs | — |
| `tests/e2e/offline.mjs` | 74 | Teste offline e de convivência: serve o repositório inteiro (Sexteto na raiz, este app em /formacao-ia/), instala primeiro o service worker do Sexteto, depois abre este app, corta a rede e confere que tudo abre, inclusive o Python embutido e os kits. Uso: node tests/e2e/offline.mjs | — |
| `tests/e2e/run.mjs` | 156 | Teste ponta a ponta: abre o app a 390×844 no Chromium, conclui lições com cada tipo de exercício, percorre todas as telas e falha em erro de console, requisição externa, rolagem horizontal ou alvo de toque < 44 px. Uso: node tests/e2e/run.mjs [--dark] [--w=360] | — |
| `tests/e2e/sync.mjs` | 138 | Sincronização de ponta a ponta com dois aparelhos simulados (celular e PC) e uma API de Gist falsa. Confere: ligar com o mesmo token, levar progresso de um para o outro, estudar nos dois sem perder nada, exclusões chegarem ao outro lado, dados cifrados na nuvem e o layout de PC/celular. | — |
| `tests/labs.test.mjs` | 68 | Testes das regras dos laboratórios (partes puras, sem tela). | — |
| `tests/motores.test.mjs` | 254 | Testes dos motores puros: datas, revisão espaçada, sequência semanal, andaime, plano, JSON e texto. | — |
| `tests/python.test.mjs` | 45 | Roda a solução de cada exercício de Python no mesmo MicroPython do app e confere com os testes da lição. | — |
| `tests/sync.test.mjs` | 161 | Sincronização: a mesclagem não perde progresso, e a cifra só abre com o mesmo token. | — |
| `tests/tempos.test.mjs` | 64 | Texto grifado: as unidades faladas são exatamente o texto narrado; os tempos do M1 existem, crescem e apontam para trechos que existem na tela; o cálculo puxa o começo para as pausas. | — |

### Recursos estáticos

| Pasta | Arquivos | Tamanho |
|---|---|---:|
| `assets/fonts` | `OFL-AtkinsonHyperlegibleMono.txt`, `OFL-Inter.txt`, `OFL-Manrope.txt`, `atkinson-hyperlegible-mono-latin-wght-normal.woff2`, `inter-latin-ext-wght-normal.woff2`, `inter-latin-wght-normal.woff2`, `manrope-latin-ext-wght-normal.woff2`, `manrope-latin-wght-normal.woff2` | 200 KB |
| `assets/icons` | `apple-touch-icon.png`, `favicon-32.png`, `icon-192.png`, `icon-512.png`, `icon.svg`, `maskable-192.png`, `maskable-512.png` | 298 KB |
| `assets/fotos` | 22 arquivos | 1.6 MB |
| `assets/micropython` | `micropython.mjs`, `micropython.wasm` | 547 KB |
| `kits` | `env.example.txt`, `gitignore.txt`, `m3/mini_rag.py`, `m3/requirements.txt`, `m5/fabrica_flashcards.py`, `m5/requirements.txt`, `m6/agente.py`, `m6/app.py`, `m6/requirements.txt`, `m6/secrets.toml.txt` | 16 KB |
| `audio` | 101 arquivos | 54.3 MB |

## Trilha: módulos, aulas e lições

### M0 · Pré-requisitos

Computador, internet e lógica. 6 h · Fora da ementa. Obrigatório para quem começa do zero. · Marco: Pastas e diário de bordo · O projeto ganha: A casa do projeto: pastas e diário de bordo. Cor: `var(--acento)`. Foto do módulo: `notebook`.

| Lição | Título | Min | Exercício | Quiz | Mão na massa | Foto | Áudio |
|---|---|---:|---|---:|---|---|---|
| | **Base digital e lógica** | | | | | | |
| 0.1 | Arquivos, pastas e extensões | 6 | classificar | 3 | PC: Monte a casa do curso | gaveteiro | 138 s |
| 0.2 | O que é a internet | 6 | ordenar | 3 | fora: Descubra o seu IP público | fibra | 145 s |
| 0.3 | Cliente e servidor | 6 | classificar | 3 | — | cozinha | 127 s |
| 0.4 | Algoritmo | 6 | ordenar | 2 | fora: Escreva a receita de outra tarefa | — | 95 s |
| 0.5 | Decisões e repetições | 7 | lacunas | 3 | — | — | 128 s |
| 0.6 | Variáveis e tipos | 7 | classificar | 3 | — | notebook | 123 s |

### M1 · IA generativa e LLMs

Como os modelos funcionam e como usar com responsabilidade. 10 h · 8 h na ementa · Marco: Ficha técnica de 1 página · O projeto ganha: Modelos escolhidos e regras de ética e LGPD. Cor: `var(--acento)`. Foto do módulo: `datacenter`.

| Lição | Título | Min | Exercício | Quiz | Mão na massa | Foto | Áudio |
|---|---|---:|---|---:|---|---|---|
| | **Aula 1 — Introdução à IA generativa e LLMs** | | | | | | |
| 1.1 | IA, ML e IA generativa | 6 | classificar | 3 | — | datacenter | 158 s |
| 1.2 | O que é um LLM | 7 | lab (proximo) | 3 | fora: “O céu é…” em dois chats | racks | 127 s |
| 1.3 | Tokens | 7 | lab (tokens) | 3 | fora: Um contador de verdade | lego | 125 s |
| 1.4 | Janela de contexto | 6 | lab (contexto) | 3 | fora: Mesa cheia e mesa vazia | — | 126 s |
| 1.5 | Temperatura | 6 | lab (proximo) | 3 | fora: O mesmo prompt em 0 e em 1,5 | — | 115 s |
| 1.6 | Panorama de modelos em 2026 | 7 | classificar | 3 | fora: Mesma pergunta, três modelos | racks | 165 s |
| 1.7 | Alucinações | 7 | escolha | 3 | fora: Cace uma referência inventada | — | 148 s |
| 1.8 | NotebookLM e Gamma | 6 | classificar | 3 | fora: Seu primeiro caderno | leitura | 147 s |
| | **Aula 2 — Ética, segurança e uso responsável** | | | | | | |
| 1.9 | Vieses | 6 | escolha | 3 | fora: CEO e enfermeira | — | 127 s |
| 1.10 | O que não colar num chat | 6 | classificar | 3 | — | — | 140 s |
| 1.11 | LGPD e IA | 7 | escolha | 3 | — | — | 173 s |
| 1.12 | Regulação de IA no Brasil em 2026 | 6 | ordenar | 3 | — | — | 150 s |

### M2 · Prompt engineering

Pedir bem para receber bem. 10 h · 8 h na ementa · Marco: Biblioteca de 10 prompts · O projeto ganha: A voz: biblioteca de prompts testados. Cor: `var(--acento)`. Foto do módulo: `escrita`.

| Lição | Título | Min | Exercício | Quiz | Mão na massa | Foto | Áudio |
|---|---|---:|---|---:|---|---|---|
| | **Aula 1 — Fundamentos e técnicas** | | | | | | |
| 2.1 | Anatomia do prompt | 8 | texto | 3 | fora: Antes e depois | caderno | 151 s |
| 2.2 | Especificidade | 6 | escolha | 3 | fora: Vago contra específico | escrita | 132 s |
| 2.3 | Zero-shot | 6 | lacunas | 3 | fora: Classifique 5 avaliações | — | 119 s |
| 2.4 | Few-shot | 7 | escolha | 3 | fora: O mesmo exercício, agora com exemplos | — | 131 s |
| 2.5 | Chain-of-thought | 6 | classificar | 3 | fora: Com e sem os passos | — | 155 s |
| 2.6 | Persona | 6 | classificar | 3 | fora: API para uma criança e para um engenheiro | — | 115 s |
| 2.7 | Prompt negativo | 6 | escolha | 3 | — | — | 127 s |
| 2.8 | Saída estruturada | 8 | json | 3 | fora: A IA preenchendo o formulário | — | 146 s |
| | **Aula 2 — Casos de negócio** | | | | | | |
| 2.9 | Código, dados e automação | 7 | escolha | 3 | PC: Fórmula testada | — | 159 s |
| 2.10 | RH, Marketing e Contábil | 7 | classificar | 3 | fora: Um caso da sua área | — | 147 s |
| 2.11 | Avaliar a saída | 7 | escolha | 3 | fora: Rubrica na prática | — | 140 s |
| 2.12 | Biblioteca reutilizável | 7 | texto | 3 | fora: Primeiros prompts na biblioteca | caderno | 150 s |

### M3 · Fundamentos técnicos

APIs, embeddings e RAG. O salto mais difícil. 12 h · 8 h na ementa · Marco: Mini-RAG que cita a fonte · O projeto ganha: A memória de consulta: primeira chamada de API e mini-RAG. Cor: `var(--acento)`. Foto do módulo: `racks`.

| Lição | Título | Min | Exercício | Quiz | Mão na massa | Foto | Áudio |
|---|---|---:|---|---:|---|---|---|
| | **Aula 1 — APIs de modelos de linguagem** | | | | | | |
| 3.1 | O que é API | 6 | classificar | 3 | fora: Ache a API | cozinha | 129 s |
| 3.2 | HTTP e REST | 8 | classificar | 3 | fora: Seu primeiro GET | — | 175 s |
| 3.3 | JSON | 8 | json | 3 | — | — | 138 s |
| 3.4 | Chave de API | 6 | classificar | 3 | fora: Sua chave do Groq | cofre | 133 s |
| 3.5 | Primeira chamada (sem código) | 9 | lab (api) | 3 | PC: A chamada de verdade | — | 161 s |
| 3.6 | Limites e custos | 7 | escolha | 3 | — | — | 161 s |
| 3.7 | Webhooks | 6 | classificar | 3 | fora: Receba um POST | — | 169 s |
| | **Aula 2 — Embeddings, bancos vetoriais e RAG** | | | | | | |
| 3.8 | Embeddings | 7 | ordenar | 3 | — | — | 146 s |
| 3.9 | Similaridade de cosseno | 6 | lab (cosseno) | 3 | — | — | 134 s |
| 3.10 | ChromaDB | 8 | lacunas | 3 | PC: Rode a receita | catalogo | 136 s |
| 3.11 | Chunking | 7 | lab (chunks) | 3 | — | fichas | 138 s |
| 3.12 | RAG | 8 | ordenar | 3 | fora: Desenhe o RAG | leitura | 151 s |
| 3.13 | Recuperação | 8 | lab (rag) | 3 | — | — | 138 s |
| 3.14 | Avaliar RAG | 7 | classificar | 3 | fora: Seu simulado | — | 130 s |

### M4 · Automação com n8n

Fluxos que trabalham por você. 22 h · 20 h na ementa · Marco: Fluxo conversacional no n8n · O projeto ganha: Os braços: pergunta → IA → registro na planilha. Cor: `var(--acento)`. Foto do módulo: `montagem`.

| Lição | Título | Min | Exercício | Quiz | Mão na massa | Foto | Áudio |
|---|---|---:|---|---:|---|---|---|
| | **Aula 1 — Fundamentos e fluxos** | | | | | | |
| 4.1 | Automação low-code | 6 | classificar | 3 | fora: Suas 3 tarefas repetitivas | montagem | 134 s |
| 4.2 | Interface: canvas, nós e execuções | 7 | classificar | 3 | PC: Crie e salve um workflow | — | 138 s |
| 4.3 | Triggers | 6 | classificar | 3 | PC: Um fluxo com hora marcada | despertador | 116 s |
| 4.4 | Itens e JSON entre nós | 7 | json | 3 | PC: Edit Fields na prática | — | 120 s |
| 4.5 | Expressões {{ }} | 7 | lab (n8n-expr) | 3 | PC: Mala direta no n8n | — | 142 s |
| 4.6 | IF e Switch | 7 | lab (n8n-if) | 3 | PC: Bifurcação de verdade | — | 149 s |
| | **Aula 2 — APIs, ferramentas e bancos de dados** | | | | | | |
| 4.7 | Webhook node | 7 | classificar | 3 | PC: Chame o seu webhook | — | 151 s |
| 4.8 | HTTP Request node | 7 | lacunas | 3 | PC: Extraia um campo | — | 146 s |
| 4.9 | Nó de LLM | 7 | escolha | 3 | PC: Resumidor automático | — | 151 s |
| 4.10 | Google Sheets | 7 | ordenar | 3 | PC: Livro de registro | — | 144 s |
| 4.11 | Bancos de dados | 7 | classificar | 3 | PC: Planilha e banco, lado a lado | — | 152 s |
| 4.12 | Tratamento de erros | 7 | lab (backoff) | 3 | PC: Estepe e triângulo | — | 163 s |
| | **Aula 3 — Agentes de IA no n8n** | | | | | | |
| 4.13 | O que é um agente | 7 | classificar | 3 | — | ferramentas | 132 s |
| 4.14 | AI Agent node | 8 | texto | 3 | PC: Agente no ar | — | 160 s |
| 4.15 | Tools | 7 | escolha | 3 | PC: A primeira ferramenta | ferramentas | 131 s |
| 4.16 | Memória de sessão | 7 | escolha | 3 | PC: Memória ligada | — | 151 s |
| 4.17 | WhatsApp | 7 | ordenar | 3 | PC: Seu bot no Telegram | — | 179 s |
| 4.18 | Deploy do n8n | 8 | classificar | 3 | PC: n8n na sua máquina | datacenter | 199 s |

### M5 · Python para IA

Do print à fábrica de flashcards. 28 h · 24 h na ementa · Marco: Repositório “Fábrica de flashcards” · O projeto ganha: O motor: Python lê seus arquivos e gera cartões. Cor: `var(--acento)`. Foto do módulo: `codigo`.

| Lição | Título | Min | Exercício | Quiz | Mão na massa | Foto | Áudio |
|---|---|---:|---|---:|---|---|---|
| | **Aula 1 — Fundamentos** | | | | | | |
| 5.1 | Python e VS Code | 8 | classificar | 3 | PC: Monte a bancada | bancada | 186 s |
| 5.2 | print | 5 | lacunas | 3 | PC: Seu primeiro arquivo .py | codigo | 112 s |
| 5.3 | Variáveis e tipos em Python | 7 | lacunas | 3 | — | — | 142 s |
| 5.4 | input e f-strings | 7 | lacunas | 3 | — | — | 109 s |
| 5.5 | if, elif e else | 7 | lacunas | 3 | — | — | 138 s |
| 5.6 | Listas e for | 8 | lacunas | 3 | — | — | 124 s |
| 5.7 | Dicionários | 7 | lacunas | 3 | — | — | 130 s |
| 5.8 | Funções | 7 | lacunas | 3 | — | — | 109 s |
| 5.9 | Ler erros | 8 | python | 3 | — | — | 176 s |
| 5.10 | Git e GitHub | 8 | ordenar | 3 | PC: Primeiro repositório | — | 152 s |
| | **Aula 2 — Automação de processos** | | | | | | |
| 5.11 | venv e pip | 7 | ordenar | 3 | PC: Ambiente do projeto | bancada | 195 s |
| 5.12 | CSV e arquivos de texto | 7 | lacunas | 3 | PC: Média de um CSV | — | 160 s |
| 5.13 | pandas | 7 | lacunas | 3 | PC: Três perguntas, três linhas | — | 162 s |
| 5.14 | PDF | 6 | lacunas | 3 | PC: Leia um PDF seu | — | 145 s |
| 5.15 | requests | 7 | lacunas | 3 | PC: API em poucas linhas | — | 140 s |
| 5.16 | Segredos no .env | 7 | classificar | 3 | PC: Cofre do projeto | cofres | 145 s |
| | **Aula 3 — Python com LLMs** | | | | | | |
| 5.17 | SDK oficial | 8 | lacunas | 3 | PC: Primeira chamada em Python | codigo | 153 s |
| 5.18 | Saída estruturada em código | 8 | lacunas | 3 | PC: JSON à prova de conversa fiada | — | 156 s |
| 5.19 | LangChain 1.x | 8 | lacunas | 3 | PC: Uma linha, dois provedores | — | 154 s |
| 5.20 | Automação final | 8 | ordenar | 3 | PC: Rode a fábrica | — | 183 s |

### M6 · Agentes inteligentes

RAG, memória, ferramentas e endereço público. 28 h · 24 h na ementa · Marco: APE-IA v1.0 com URL pública · O projeto ganha: O corpo inteiro: agente com RAG, memória e endereço público. Cor: `var(--acento)`. Foto do módulo: `biblioteca`.

| Lição | Título | Min | Exercício | Quiz | Mão na massa | Foto | Áudio |
|---|---|---:|---|---:|---|---|---|
| | **Aula 1 — Agentes com RAG** | | | | | | |
| 6.1 | Arquitetura de um agente | 8 | lab (agente) | 3 | — | — | 181 s |
| 6.2 | Ferramentas com @tool | 7 | lacunas | 3 | PC: Duas ferramentas | ferramentas | 123 s |
| 6.3 | create_agent | 8 | lacunas | 3 | PC: Seu primeiro agente em Python | — | 152 s |
| 6.4 | RAG como ferramenta | 8 | classificar | 3 | PC: Busca na gaveta | biblioteca | 150 s |
| 6.5 | Memória de curto prazo | 7 | lacunas | 3 | PC: Comanda da mesa | — | 124 s |
| 6.6 | Memória de longo prazo | 7 | classificar | 3 | PC: Ficha do cliente | — | 137 s |
| 6.7 | Avaliação e guardrails | 8 | escolha | 3 | PC: Vistoria | — | 149 s |
| | **Aula 2 — Multiagentes** | | | | | | |
| 6.8 | Quando (não) usar multiagentes | 7 | classificar | 3 | fora: Um contra dois | redacao | 150 s |
| 6.9 | Papéis | 7 | classificar | 3 | — | redacao | 156 s |
| 6.10 | LangGraph | 8 | ordenar | 3 | PC: Leia a mochila | — | 136 s |
| 6.11 | Builders visuais | 7 | classificar | 3 | fora: O mesmo chat em outro Lego | — | 183 s |
| | **Aula 3 — Interfaces e deploy público** | | | | | | |
| 6.12 | Gradio | 7 | lacunas | 3 | PC: Vitrine em 5 linhas | vitrine | 130 s |
| 6.13 | Streamlit | 8 | lacunas | 3 | PC: Chat que não esquece | — | 143 s |
| 6.14 | Segredos no deploy | 6 | classificar | 3 | — | cofres | 145 s |
| 6.15 | Streamlit Community Cloud | 8 | ordenar | 3 | PC: No ar | — | 192 s |
| 6.16 | Hugging Face Hub e Spaces | 7 | escolha | 3 | fora: Passeio pelo Hub | — | 162 s |

### Exercícios por tipo

`classificar`: 30 · `lacunas`: 23 · `escolha`: 14 · `ordenar`: 12 · `lab`: 12 · `texto`: 3 · `json`: 3 · `python`: 1

## Constantes das regras

- Revisão espaçada: escada `[1,3,7,21,60,120]` dias, teto de **15** cartões por dia, notas `errei, dificil, lembrei`.
- Semana: meta de **4** dias em 7, até **2** congelamentos.
- XP por ação: `quiz` 5 · `ex` 10 · `licao` 20 · `revisita` 5 · `cartao` 2 · `mistura` 3 · `mao` 15 · `missaoItem` 10 · `missao` 50 · `semanal` 20 · `diario` 5 · `desafio` 30. Nível = 1 + ⌊XP / 250⌋.

| Plano | Ritmo | Semanas | Semanas de cada módulo (M0…M6) |
|---|---|---:|---|
| Plano A | 4 a 5 horas por semana | 26 | M0: 1–2 · M1: 3–4 · M2: 5–6 · M3: 7–9 · M4: 10–14 · M5: 15–20 · M6: 21–26 |
| Plano B | 2 a 3 horas por semana | 48 | M0: 1–3 · M1: 4–7 · M2: 8–11 · M3: 12–16 · M4: 17–25 · M5: 26–36 · M6: 37–48 |

### Conquistas

| id | Nome | Como ganha |
|---|---|---|
| `primeira` | Primeiro passo | Concluiu a primeira micro-lição. |
| `dez` | Dez lições | Dez micro-lições concluídas. |
| `m0` | Módulo 0 completo | Todas as lições de “Pré-requisitos”. |
| `m1` | Módulo 1 completo | Todas as lições de “IA generativa e LLMs”. |
| `m2` | Módulo 2 completo | Todas as lições de “Prompt engineering”. |
| `m3` | Módulo 3 completo | Todas as lições de “Fundamentos técnicos”. |
| `m4` | Módulo 4 completo | Todas as lições de “Automação com n8n”. |
| `m5` | Módulo 5 completo | Todas as lições de “Python para IA”. |
| `m6` | Módulo 6 completo | Todas as lições de “Agentes inteligentes”. |
| `json` | JSON sem erro | Fez um JSON passar no validador. |
| `api200` | Primeira chamada de API | Recebeu um 200 no laboratório de API. |
| `rag` | Busca com fonte | Fez o mini-RAG achar o trecho certo. |
| `n8n` | Primeira expressão no n8n | Montou uma expressão {{ }} que funciona. |
| `python` | Olá, Python | Seu primeiro programa passou nos testes. |
| `agente` | Dentro do agente | Conduziu o laço pensar, agir e observar até a resposta. |
| `mao5` | Mão na massa | Cinco práticas feitas fora do app. |
| `rev50` | Cinquenta revisões | Cinquenta cartões respondidos. |
| `ret7` | Memória de 7 dias | 80% ou mais de acerto nas revisões de 7 dias (mínimo de 10). |
| `ret21` | Memória de 21 dias | 80% ou mais de acerto nas revisões de 21 dias (mínimo de 10). |
| `semana` | Semana 4 de 7 | Bateu a meta semanal pela primeira vez. |
| `seq3` | Três semanas seguidas | Três semanas batendo a meta. |
| `volta` | Voltou depois de uma pausa | Recomeçar também é habilidade. |
| `diario7` | Diário de bordo | Sete entradas no diário. |
| `prompts10` | Biblioteca de 10 prompts | Dez prompts guardados e versionados. |
| `apeia` | APE-IA v1.0 no ar | Concluiu a missão final do projeto. |

## Projeto APE-IA

| Etapa | Entrega | Missões (id · minutos) |
|---|---|---|
| M0 · A casa do projeto | Estrutura de pastas do APE-IA e um diário de bordo com 1 frase por sessão. | `m0-pastas` Monte a estrutura de pastas (10 min, 4 itens)<br>`m0-diario` Comece o diário de bordo (10 min, 3 itens) |
| M1 · Ficha técnica | Ficha técnica do APE-IA: objetivo, 2 modelos escolhidos com justificativa, 5 regras de uso responsável e um teste de alucinação documentado. | `m1-modelos` Compare e escolha 2 modelos (20 min, 3 itens)<br>`m1-regras` Escreva as regras do assistente (15 min, 3 itens)<br>`m1-alucinacao` Documente um teste de alucinação (20 min, 3 itens)<br>`m1-ficha` Feche a ficha em 1 página (10 min, 3 itens) |
| M2 · Biblioteca de prompts | Dez prompts testados e versionados: Tutor Socrático, Gerador de Quiz em JSON, Explicador com Analogia, Revisor de Código, Resumidor com Citações e mais cinco. | `m2-tutor` Tutor Socrático (20 min, 4 itens)<br>`m2-quiz` Gerador de Quiz em JSON (20 min, 4 itens)<br>`m2-explicador` Explicador com Analogia (15 min, 3 itens)<br>`m2-dois` Revisor de Código e Resumidor com Citações (25 min, 4 itens)<br>`m2-cinco` Mais cinco prompts seus (25 min, 3 itens)<br>`m2-exportar` Exporte a biblioteca (10 min, 3 itens) |
| M3 · Mini-RAG com fonte | Um script que responde perguntas sobre as suas anotações dos Módulos 1 e 2 e cita o trecho de origem. O código vem pronto em Projeto › Kits. | `m3-chave` Chave e primeira chamada (20 min, 3 itens)<br>`m3-anotacoes` Junte o material (20 min, 3 itens)<br>`m3-rodar` Rode o mini-RAG (25 min, 3 itens)<br>`m3-teste` Teste de verdade (20 min, 4 itens) |
| M4 · APE-IA conversacional | Fluxo no n8n: chat ou webhook → agente de IA com os prompts do Módulo 2 → consulta à planilha de dúvidas → registro → alerta de erro. | `m4-conta` Seu n8n funcionando (15 min, 3 itens)<br>`m4-agente` Chat com agente (25 min, 4 itens)<br>`m4-planilha` Planilha de dúvidas e registro (25 min, 3 itens)<br>`m4-erros` Quando algo falhar (15 min, 3 itens)<br>`m4-entrega` Cinco conversas e exportação (15 min, 3 itens) |
| M5 · Fábrica de flashcards | Repositório no GitHub com um programa que lê PDFs e CSVs, chama o LLM com a chave no `.env` e gera quizzes em JSON. | `m5-ambiente` Bancada pronta (20 min, 3 itens)<br>`m5-ler` Ler os arquivos (25 min, 3 itens)<br>`m5-gerar` Gerar os flashcards (25 min, 3 itens)<br>`m5-csv` Do JSON para o app (15 min, 3 itens)<br>`m5-repo` Publicar no GitHub (20 min, 4 itens) |
| M6 · APE-IA v1.0 | Agente com RAG sobre todas as anotações, ferramenta “gerar quiz”, memória de preferências, interface Streamlit, URL pública, README com arquitetura, limitações e política de LGPD, e vídeo de 2 minutos. | `m6-agente` Agente com busca nas anotações (25 min, 3 itens)<br>`m6-quiz` Ferramenta “gerar quiz” (20 min, 3 itens)<br>`m6-memoria` Memória (20 min, 3 itens)<br>`m6-streamlit` Interface no Streamlit (25 min, 3 itens)<br>`m6-deploy` Endereço público (25 min, 4 itens)<br>`m6-final` Entrega final (25 min, 4 itens) |

## Laboratórios

| id | Nome | Módulo | Lição | Descrição |
|---|---|---|---|---|
| `proximo` | Próximo pedaço | M1 | 1.2 | Um modelo de brinquedo escolhendo palavra por palavra, com temperatura. |
| `tokens` | Tokens | M1 | 1.3 | O texto partido em peças, palavras contra tokens. |
| `contexto` | Janela de contexto | M1 | 1.4 | A mesa enche e a primeira regra sai. |
| `prompt` | Laboratório de prompts | M2 | 2.1 | As 6 partes, contagem de tokens e versão melhorada. |
| `json` | JSON | M2 | 3.3 | Validador com erros em português e caminho de cada campo. |
| `api` | API de treino | M3 | 3.5 | Monte um pedido de chat até receber 200, sem sair do app. |
| `cosseno` | Similaridade de cosseno | M3 | 3.9 | Duas setas: só a direção importa. |
| `chunks` | Chunking | M3 | 3.11 | Tamanho, sobreposição e corte em fim de frase. |
| `rag` | Mini-RAG | M3 | 3.13 | Busca com fonte, top-k e o prompt montado. |
| `n8n-expr` | Expressões do n8n | M4 | 4.5 | {{ $json.campo }} calculado sobre um item. |
| `n8n-if` | Nó IF | M4 | 4.6 | Texto contra número: por que “10” vem antes de “7”. |
| `backoff` | Limites e backoff | M4 | 4.12 | 8 pedidos, limite de 3 a cada 10 segundos. |
| `python` | Python de bolso | M5 | 5.2 | Rode Python no aparelho, mesmo sem internet. |
| `agente` | Laço do agente | M6 | 6.1 | Pensar, agir e observar, uma rodada por vez. |

## Fotos

| id | Arquivo | Autor | Licença | Lições |
|---|---|---|---|---|
| `notebook` | `assets/fotos/notebook.webp` (960×640) | Freddie Marriage | CC0 | 0.6 |
| `datacenter` | `assets/fotos/datacenter.webp` (960×640) | PiDatacenters | CC BY-SA 4.0 | 1.1, 4.18 |
| `racks` | `assets/fotos/racks.webp` (960×640) | Carl Lender | CC BY 2.0 | 1.2, 1.6 |
| `escrita` | `assets/fotos/escrita.webp` (960×640) | Kristin Hardwick | CC0 | 2.2 |
| `caderno` | `assets/fotos/caderno.webp` (960×640) | Phil Slattery | CC BY-SA 4.0 | 2.1, 2.12 |
| `fibra` | `assets/fotos/fibra.webp` (960×640) | Syced | CC0 | 0.2 |
| `montagem` | `assets/fotos/montagem.webp` (960×640) | autor desconhecido (Ford Motor Company) | Public domain | 4.1 |
| `codigo` | `assets/fotos/codigo.webp` (960×640) | Markus Spiske | CC0 | 5.2, 5.17 |
| `biblioteca` | `assets/fotos/biblioteca.webp` (960×640) | Carol M. Highsmith | Public domain | 6.4 |
| `leitura` | `assets/fotos/leitura.webp` (960×640) | Guywelch2000 | CC BY 4.0 | 3.12, 1.8 |
| `gaveteiro` | `assets/fotos/gaveteiro.webp` (960×640) | The Metropolitan Museum of Art | CC0 | 0.1 |
| `cozinha` | `assets/fotos/cozinha.webp` (960×640) | Peachyeung316 | CC BY-SA 4.0 | 0.3, 3.1 |
| `lego` | `assets/fotos/lego.webp` (960×640) | Benjamin D. Esham (bdesham) | CC BY-SA 4.0 | 1.3 |
| `catalogo` | `assets/fotos/catalogo.webp` (960×640) | Marie-Lan Nguyen | CC BY 2.0 fr | 3.10 |
| `fichas` | `assets/fotos/fichas.webp` (960×640) | TBurmeister (WMF) | CC BY-SA 4.0 | 3.11 |
| `despertador` | `assets/fotos/despertador.webp` (960×640) | Santeri Viinamäki | CC BY-SA 4.0 | 4.3 |
| `ferramentas` | `assets/fotos/ferramentas.webp` (960×640) | Jim Griffin | CC0 | 4.13, 4.15, 6.2 |
| `bancada` | `assets/fotos/bancada.webp` (960×640) | Shixart1985 | CC BY 2.0 | 5.1, 5.11 |
| `cofres` | `assets/fotos/cofres.webp` (960×640) | CEphoto, Uwe Aranas | CC BY-SA 3.0 | 6.14, 5.16 |
| `cofre` | `assets/fotos/cofre.webp` (960×640) | ArnoldReinhold | CC BY-SA 4.0 | 3.4 |
| `redacao` | `assets/fotos/redacao.webp` (960×640) | New York-air | CC BY-SA 4.0 | 6.9, 6.8 |
| `vitrine` | `assets/fotos/vitrine.webp` (960×640) | autor desconhecido | Public domain | 6.12 |

## Ficha viva

- **Anthropic (Claude)** (Modelos)
- **OpenAI (GPT)** (Modelos)
- **Google (Gemini)** (Modelos)
- **Groq (plataforma)** (Modelos)
- **Groq: plano gratuito** (Cotas gratuitas)
- **Gemini: plano gratuito** (Cotas gratuitas)
- **n8n** (Ferramentas)
- **LangChain e LangGraph** (Ferramentas)
- **Flowise (descontinuado)** (Ferramentas)
- **Streamlit Community Cloud** (Hospedagem)
- **Hugging Face Spaces** (Hospedagem)
- **Gradio share=True** (Hospedagem)
- **PL 2338/2023 (Marco Legal da IA)** (Regulação)
- **ANPD e LGPD** (Regulação)

## Desafios surpresa

- `d-cliente` (a partir do M0)
- `d-downloads` (a partir do M0)
- `d-haicai` (a partir do M1)
- `d-alucinacao` (a partir do M1)
- `d-cpf` (a partir do M1)
- `d-duelo` (a partir do M2)
- `d-publicos` (a partir do M2)
- `d-rag-papel` (a partir do M3)
- `d-erros-api` (a partir do M3)
- `d-automacao` (a partir do M4)
- `d-n8n-seu` (a partir do M4)
- `d-sorteio` (a partir do M5)
- `d-erro-diario` (a partir do M5)
- `d-mostrar` (a partir do M6)

## Áudios das aulas (`audio/indice.json`)

Vozes: `pt-BR-Chirp3-HD-Puck` (98). Cortes entre partes: estimados (98). Gerados em: 2026-11-16.

Formato de cada entrada: `{ arquivo, duracao (s), bytes, capitulos: [{ id: "passo-0|1|2|5", nome, t (s) }], cortes?: "exatos"|"estimados", voz, gerado }`.

## Design: variáveis de CSS (`css/app.css`)

Um tema só (escuro). Os nomes antigos (`--bg`, `--ink`, `--acao`…) apontam para a paleta nova.

| Variável | Valor |
|---|---|
| `--bg-base` | `#0B0B0D` |
| `--bg-violeta-meio` | `#1E1238` |
| `--bg-violeta-base` | `#4A2A85` |
| `--texto-primario` | `#F1F0F5` |
| `--texto-secundario` | `#A7A5B3` |
| `--texto-apagado` | `#6E6C7A` |
| `--divisor` | `#2A2A31` |
| `--acento` | `#8B6CF2` |
| `--acento-claro` | `#C4B5FD` |
| `--acento-texto-ativo` | `#D9CCFF` |
| `--acento-fundo-ativo` | `rgba(139,108,242,.22)` |
| `--botao-topo` | `#7656DC` |
| `--botao-base` | `#3A2470` |
| `--vidro-fundo` | `rgba(22,22,26,.20)` |
| `--vidro-borda` | `rgba(255,255,255,.08)` |
| `--vidro-blur` | `14px` |
| `--raio-card` | `12px` |
| `--raio-botao` | `10px` |
| `--certo` | `#5BD68A` |
| `--certo-bg` | `rgba(91,214,138,.16)` |
| `--errado` | `#FF8A80` |
| `--errado-bg` | `rgba(255,138,128,.16)` |
| `--cat1` | `#8B6CF2` |
| `--cat2` | `#C4B5FD` |
| `--cat3` | `#A7A5B3` |
| `--cat4` | `#6F58C9` |
| `--cat5` | `#E2DAFF` |
| `--curva-ios` | `cubic-bezier(.32,.72,0,1)` |
| `--curva-ok` | `cubic-bezier(.2,.8,.2,1)` |
| `--t-toque` | `120ms` |
| `--t-painel` | `300ms` |
| `--bg` | `var(--bg-base)` |
| `--bg2` | `rgba(22,22,26,.55)` |
| `--bg3` | `rgba(255,255,255,.06)` |
| `--line` | `var(--divisor)` |
| `--line2` | `#3B3A45` |
| `--ink` | `var(--texto-primario)` |
| `--ink2` | `#BDBBC8` |
| `--ink3` | `var(--texto-secundario)` |
| `--acao` | `var(--acento)` |
| `--acao-ink` | `#0B0B0D` |
| `--acao-tint` | `var(--acento-fundo-ativo)` |
| `--ok` | `var(--acento-claro)` |
| `--ok-bg` | `rgba(139,108,242,.18)` |
| `--quase` | `#F2B35E` |
| `--quase-bg` | `rgba(242,179,94,.14)` |
| `--ouro` | `var(--acento-claro)` |
| `--ouro-bg` | `rgba(139,108,242,.18)` |
| `--info-bg` | `rgba(139,108,242,.12)` |
| `--code-bg` | `#0E0E12` |
| `--code-ink` | `#edeff7` |
| `--code-dim` | `#9aa3bd` |
| `--code-ac` | `#C4B5FD` |
| `--c` | `var(--acento)` |
| `--on-c` | `#0B0B0D` |
| `--shadow` | `0 8px 24px -12px rgba(0,0,0,.7)` |
| `--r` | `var(--raio-card)` |
| `--r2` | `10px` |
| `--tab-h` | `62px` |
| `--sat` | `env(safe-area-inset-top,0px)` |
| `--sab` | `env(safe-area-inset-bottom,0px)` |
| `--sal` | `env(safe-area-inset-left,0px)` |
| `--sar` | `env(safe-area-inset-right,0px)` |
| `--font` | `"Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif` |
| `--display` | `"Manrope","Inter",system-ui,-apple-system,sans-serif` |
| `--mono` | `"Atkinson Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace` |

Fontes: **Manrope** (`assets/fonts/manrope-latin-wght-normal.woff2`), **Manrope** (`assets/fonts/manrope-latin-ext-wght-normal.woff2`), **Inter** (`assets/fonts/inter-latin-wght-normal.woff2`), **Inter** (`assets/fonts/inter-latin-ext-wght-normal.woff2`), **Atkinson Mono** (`assets/fonts/atkinson-hyperlegible-mono-latin-wght-normal.woff2`).

## Manifesto (PWA)

```json
{
  "name": "Formação IA Generativa",
  "short_name": "Formação IA",
  "description": "Trilha de IA generativa em micro-lições de 5 a 10 minutos, com revisão espaçada e um projeto de portfólio.",
  "lang": "pt-BR",
  "dir": "ltr",
  "id": "./index.html?app=formacao-ia",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#0B0B0D",
  "theme_color": "#0B0B0D",
  "categories": [
    "education",
    "productivity"
  ],
  "icons": [
    {
      "src": "assets/icons/icon-192.png?v=3",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "assets/icons/icon-512.png?v=3",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "assets/icons/maskable-192.png?v=3",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "assets/icons/maskable-512.png?v=3",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Começar 5 min",
      "url": "./index.html#/hoje/comecar",
      "icons": [
        {
          "src": "assets/icons/icon-192.png?v=3",
          "sizes": "192x192"
        }
      ]
    },
    {
      "name": "Revisar cartões",
      "url": "./index.html#/revisar/cartoes",
      "icons": [
        {
          "src": "assets/icons/icon-192.png?v=3",
          "sizes": "192x192"
        }
      ]
    }
  ]
}
```

## Scripts (`package.json`)

| Comando | Faz |
|---|---|
| `npm run start` | `node tools/serve.mjs` |
| `npm run test` | `node tools/gen-precache.mjs --check && node tools/gerar-inventario.mjs --check && node --test tests/*.test.mjs` |
| `npm run precache` | `node tools/gen-precache.mjs` |
| `npm run e2e` | `node tests/e2e/run.mjs` |
| `npm run e2e:offline` | `node tests/e2e/offline.mjs` |
| `npm run e2e:sync` | `node tests/e2e/sync.mjs` |
| `npm run e2e:pc` | `node tests/e2e/run.mjs --pc` |
| `npm run audio` | `node tools/audio/gerar-audio.mjs` |
| `npm run audio:simular` | `node tools/audio/gerar-audio.mjs --simular` |
| `npm run quiz:revisar` | `node tools/exportar-quiz.mjs` |
| `npm run e2e:audio` | `node tests/e2e/audio.mjs` |
| `npm run docs` | `node tools/gerar-inventario.mjs` |
| `npm run icones` | `node tools/gerar-icones.mjs` |
| `npm run e2e:contraste` | `node tests/e2e/contraste.mjs && node tests/e2e/contraste.mjs --pc` |
| `npm run capturas` | `node tests/e2e/capturas.mjs` |
| `npm run e2e:navegacao` | `node tests/e2e/navegacao.mjs` |
| `npm run audio:tempos` | `node tools/audio/tempos.mjs` |
