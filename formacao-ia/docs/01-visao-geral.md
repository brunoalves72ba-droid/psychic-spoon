# 01 · Visão geral

## O que é

**Formação IA Generativa** é um app de estudo (PWA: site que se instala como app) que leva uma pessoa **do zero absoluto**
a construir e publicar um assistente com IA. Foi desenhado para quem tem **TDAH**: uma ideia por vez, passos sempre iguais,
nada de culpa, recompensa imediata e muita variedade (texto, áudio, vídeo, exercícios, laboratórios, projeto).

A trilha vem de um documento de currículo (“Formação IA Generativa: trilha completa para iniciante absoluto com TDAH”):
**7 módulos (M0 a M6), 98 micro-lições**, um projeto acumulativo (o **APE-IA**, Assistente Pessoal de Estudos com IA),
laboratórios interativos e revisão espaçada.

| Módulo | Tema | Marco |
|---|---|---|
| M0 | Pré-requisitos: computador, internet e lógica | Pastas e diário de bordo |
| M1 | IA generativa e LLMs (inclui ética e LGPD) | Ficha técnica de 1 página |
| M2 | Prompt engineering | Biblioteca de 10 prompts |
| M3 | Fundamentos técnicos: APIs, embeddings e RAG | Mini-RAG que cita a fonte |
| M4 | Automação com n8n | Fluxo conversacional no n8n |
| M5 | Python para IA | Repositório “Fábrica de flashcards” |
| M6 | Agentes inteligentes e publicação | APE-IA v1.0 com endereço público |

Lista completa de lições, minutos, exercícios, fotos e duração dos áudios: [Inventário › Trilha](INVENTARIO.md).

## Princípios (o “porquê” de cada escolha)

| Princípio | Como aparece no app |
|---|---|
| Uma ideia por vez | Cada lição tem **um** conceito, 5 a 10 minutos, sempre **os mesmos 7 passos**: gancho → ideia (com analogia) → exemplo resolvido → exercício → quiz → erro comum → fim |
| Não decidir o que vem depois | A tela Hoje mostra **um** botão grande com o próximo passo; a próxima lição já vem “carregada” no fim de cada uma |
| Lembrar é praticar | Cada pergunta de quiz vira um **cartão** que volta em 1, 3, 7, 21, 60 e 120 dias (teto de 15 por dia) |
| Sem culpa | Meta de **4 dias em 7**, com 2 “congelamentos”; parou no meio, o lugar fica guardado; o relógio só avisa, nunca interrompe |
| Ajuda que some aos poucos | Exemplos “desbotados” (andaime): primeiro completo, depois com 1 lacuna, depois várias, depois do zero |
| Escolher pelo estado | Check-in de **energia** (baixa/média/alta) e **tempo** (5/15/30 min) sugere 1 a 3 tarefas que cabem |
| Pensamento intruso não derruba a sessão | Botão de **anotar um pensamento** em qualquer passo; ele fica guardado para depois |
| Variedade | Texto, **áudio com voz neural**, vídeo opcional, 14 laboratórios, Python no próprio aparelho, projeto fora do app, desafio surpresa a cada 2 semanas |
| Recompensa imediata, sem punição | XP, conquistas por **habilidade** (não por tempo de tela), dias seguidos, animação curta ao concluir um bloco e ao acertar |
| Privacidade | Sem servidor, sem login, sem analytics. Tudo fica no aparelho; a sincronização é opcional e cifrada |

A tela **Progresso › Por que o app é assim** (`#/mais/porque`) explica isso ao usuário, com o grau de evidência de cada técnica.

## O que o app não faz (de propósito)

- Não tem servidor próprio nem conta: não há onde “logar”.
- Não chama modelos de IA de dentro do app (não guarda chave de API no navegador). O tutor conversacional do currículo
  foi substituído pelo APE-IA do projeto e por respostas-modelo.
- Não envia notificações com o app fechado (lembretes vão para o calendário, em arquivo `.ics`).

## Tecnologia em uma frase

HTML + CSS + JavaScript puros (módulos ES), **sem framework, sem etapa de build e sem dependências** no app.
Node.js (18 ou mais novo) só para as ferramentas e os testes. Playwright (Chromium) para os testes ponta a ponta.
Publicado no GitHub Pages. Funciona offline (service worker). Dados no IndexedDB do aparelho.

## Estrutura de pastas

```
psychic-spoon/                 repositório (o app Sexteto fica na raiz; outros apps em pastas)
└── formacao-ia/               ESTE APP (tudo o que ele precisa está aqui dentro)
    ├── index.html             casca: barra de abas, área da tela, tema inicial
    ├── manifest.webmanifest   instalação (nome, ícones, atalhos)
    ├── sw.js · sw-assets.js   service worker e a lista de arquivos guardados no aparelho (gerada)
    ├── css/app.css            todo o visual
    ├── js/app.js              início, roteador, atualização
    ├── js/core/               regras e serviços (estado, revisão, sequência, áudio, sincronização…)
    ├── js/views/              uma tela por arquivo
    ├── js/labs/               os 14 laboratórios e o Python embutido
    ├── js/data/               conteúdo: lições, projeto, laboratórios, fotos, ficha viva, vídeos…
    ├── assets/                fontes, ícones, fotos, MicroPython (WebAssembly)
    ├── audio/                 98 MP3 das aulas + indice.json (gerados uma vez com voz neural)
    ├── kits/                  código Python pronto para o projeto (mini-RAG, flashcards, agente)
    ├── tools/                 servidor local, pré-cache, gerador de áudio, exportar quiz, inventário
    ├── tests/                 testes unitários (*.test.mjs) e ponta a ponta (tests/e2e)
    └── docs/                  esta documentação
```
