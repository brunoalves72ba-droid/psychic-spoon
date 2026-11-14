# Formação IA Generativa — progresso

Proprietário único e exclusivo do app: **Bruno Moura**.

## Como continuar (leia primeiro)

- Sem build. `npm start` serve em http://localhost:8090. `npm test` roda os testes unitários. `npm run e2e` percorre o app no Chromium.
- **Sempre que criar, apagar ou editar arquivo do app, rode `npm run precache`.**
- Cada lição é um objeto em `js/data/m*.js`. Convenção: em quiz e casos de escolha, **a primeira opção é a correta** (a tela embaralha). O teste `tests/conteudo.test.mjs` valida formato, tamanho e marcações de todas as lições; `tests/python.test.mjs` roda a solução de cada exercício de Python no mesmo MicroPython do app.
- Lacunas usam `⟦n:resposta⟧` (n = prioridade no andaime; alternativas com `¦`).

## Arquitetura

- `js/core/estado.js`: estado único `S`, gravado por chave no IndexedDB (`js/core/store.js`); histórico de revisões no store `log` (para a retenção de 7 e 21 dias).
- `js/core/srs.js`: escada fixa 1-3-7-21-60-120 dias, teto de 15 por dia; “errei” volta para amanhã, “difícil” repete o intervalo, “lembrei” sobe.
- `js/core/sequencia.js`: meta de 4 dias em 7, 2 congelamentos automáticos que recarregam, primeira semana nunca conta como falha.
- `js/core/andaime.js`: exemplos desbotados em 3 níveis; sobe com ≥80% de acerto de primeira e desce com ≤34%.
- `js/core/plano.js`: Planos A e B do documento; `recalcular()` move as datas sem apagar nada.
- `js/labs/python.js` + `py-worker.js` + `py-harness.js`: MicroPython num Worker, com limite de 4 s (laço infinito não trava a tela).
- `js/labs/api.js`: servidor de treino local, com 200/400/401/404/429 (chave de treino `treino-123`).
- O tempo do app vem de `hoje()` em `js/core/dia.js`; os testes podem definir `globalThis.__FIA_HOJE`.

## Feito

- [x] Base: PWA, offline, tema claro/escuro, fontes legíveis, armazenamento, backup, roteador.
- [x] 98 micro-lições (M0 a M6) com 293 cartões, 73 práticas “mão na massa” e 30 missões de projeto.
- [x] 14 laboratórios e Python no navegador.
- [x] Camadas de apoio: check-in de energia, modo foco, captura de pensamento, revisão semanal, desafio surpresa, conquistas por habilidade, cronograma recalculável, ficha viva, lembretes .ics, “por que o app é assim”.
- [x] Kits de código: mini-RAG (M3), fábrica de flashcards (M5), agente com Streamlit (M6).
- [x] Testes: 141 unitários; 60 cenários ponta a ponta em tema claro e escuro; teste offline e de convivência com o Sexteto.

## Sincronização, PC e navegação (novembro de 2026)

- `js/core/mesclar.js`: junta dois estados sem perder progresso (lição concluída e cartão revisto só avançam; perfil, ficha e prompts ficam com a versão mais recente; exclusões viajam como “lápides” em `apagados`). XP é contado por aparelho (`xpPor`) e somado. A sequência semanal é recalculada a partir dos dias.
- `js/core/nuvem.js`: lê, mescla e grava um Gist secreto (`formacao-ia-sync.json`), cifrado com AES-GCM derivado do token (PBKDF2). Sincroniza ao abrir, alguns segundos depois de cada gravação, ao sair e a cada 5 min. O token fica em `local` (só no aparelho; fora do backup).
- `js/core/plataforma.js`: PC = ponteiro fino com hover e tela ≥ 900 px; dá para forçar nos Ajustes. Classe `pc`/`celular` no `body`.
- Lição: passos tocáveis, passos guardados em memória (voltar não apaga respostas), “Rever a ideia e o exemplo” no exercício, quiz e erro comum, botão Voltar e teclado (Enter/→, ←, 1–3, N).
- Fotos: `assets/fotos/` (22 fotos, 33 lições e 7 módulos); registro em `js/data/fotos.js`, créditos em `CREDITOS.md`.
- **Não testado contra o GitHub de verdade** (este ambiente não alcança a API): o teste `tests/e2e/sync.mjs` usa uma API de Gist falsa com o mesmo formato.

## Instalação separada do Sexteto

- O manifesto do Sexteto passou a ter `"scope": "./index.html"`: antes, a área dele (`/psychic-spoon/`) incluía `/formacao-ia/`, e o Android abria este app dentro do Sexteto instalado. O `id` do Sexteto não mudou (o app instalado continua o mesmo); a mudança chega aos celulares quando o Chrome atualiza o Sexteto instalado, o que pode levar um ou dois dias.
- `id` próprio no manifesto deste app, ícone novo (“IA” com faísca) e tela `#/mais/instalar`: botão de instalar (quando o navegador oferece), passo a passo para Android e iPhone, conferência de que os arquivos do app estão guardados e pedido de armazenamento permanente.

## Pendências e limites conhecidos

- **Testar em aparelho real** (iPhone e Android): instalação, Python de bolso, download do .ics.
- **Os kits Python não foram executados** contra as APIs reais neste ambiente (sem acesso à rede do Groq). Passam na checagem de sintaxe; confira na primeira execução e ajuste o nome do modelo pela Ficha viva.
- O tutor de IA conversacional e a avaliação automática de “explique com suas palavras” (seção 10 do documento) **não foram feitos**: exigiriam uma chave de API no navegador. No lugar, as explicações são comparadas com um modelo de resposta, e o APE-IA do projeto cumpre o papel de tutor.
- Notificações: um app web não avisa de forma confiável com o navegador fechado; por isso os lembretes vão para o calendário (.ics). A “pausa automática depois de 3 lembretes ignorados” virou orientação na tela.
- Recompensas variadas (“baús”) ficaram para a versão 2, como recomenda o próprio documento.
- A Ficha viva foi verificada em novembro de 2026; revise a cada trimestre.

## Decisões

- O app fica em `formacao-ia/`, separado do Sexteto, com service worker e IndexedDB próprios. O `sw.js` do Sexteto ganhou uma linha para ignorar essa pasta.
- Revisão espaçada em escada fixa (e não FSRS): é previsível para a pessoa e mede a retenção de 7 e 21 dias diretamente, como pede o documento.
- Busca do laboratório de RAG por palavras (TF-IDF), para caber no app e rodar offline; as lições e o kit usam embeddings.
- Cada pergunta de quiz vira um cartão; por isso as perguntas foram escritas para funcionar sem as opções.
