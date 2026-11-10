# Sexteto — progresso

Proprietário único e exclusivo do app: **Bruno Moura**.

## Como continuar (leia primeiro)

- Sem build. `npm start` serve a pasta em http://localhost:8080. `npm test` roda os testes unitários. `npm run e2e` abre o Chromium a 390×844 com microfone falso e percorre as telas (capturas em `tests/e2e/shots/`).
- **Sempre que criar, apagar ou editar arquivo do app, rode `npm run precache`** (regera `sw-assets.js`; o `npm test` falha se estiver desatualizado).
- Ao terminar cada fase: testes, e2e, olhar capturas, commit, atualizar este arquivo.

## Arquitetura

- `index.html` + `css/app.css` + módulos ES em `js/`. Rota `#/secao/pagina/arg` carrega `js/views/secao-pagina.js` (lista `VIEWS` em `js/app.js`). Cada view exporta `default async (el, args) => cleanup?`.
- `js/core/ui.js`: `h()` (DOM), `canvas()`, `loop()`, `seg()`, `slider()`, `toggle()`, `quiz()`, `sheet()`, `toast()`, `wake`, `shareOrDownload()`.
- `js/core/store.js`: IndexedDB `sexteto` (esquema 2, migrações em `MIGRATIONS`), `kv`, `prefs`, `log(type,data)`/`events(type)`, `addPractice`, `roteiro`, gravações em PCM de 16 bits, projetos, `exportAll`/`importAll`/`migrateBackup`.
- `js/core/widgets.js`: `keyboard()`, `voiceChips()`, `voiceMap()`, `pitchTrace()`.
- `js/music/theory.js`: nomes de notas, `parseChord()` (cifra → notas), `voiceChord()` (distribuição em n vozes), `voicings()`, campo harmônico, `analyze()`.
- `js/audio/engine.js`: contexto, coro (`choirNote`), piano (`pianoNote`), reverb por convolução, `Sequencer`/`Metronome` com lookahead pelo relógio do AudioContext (temporizador em Web Worker só acorda o agendador), `renderOffline`, `stopAll`.
- `js/audio/pitch-core.js`: MPM via FFT + guarda de oitava + medidas de espectro + núcleo do microfone (puro, testado no Node). `mic-worklet.js` é concatenado a ele em `mic.js` (Blob) para rodar no AudioWorklet; alternativa em ScriptProcessor.
- Tipos de evento no histórico: `lesson`, `ear`, `sing`, `pitch`, `breath`, `mpt`, `range`, `tessitura`, `passaggio`, `register`, `vibrato`, `portrait`, `recording`, `project`, `studio`, `tecnica`.
- `js/data/tecnicas.js`: conteúdo das técnicas vocais, autodiagnóstico (`SINAIS`), `recomendar()` e `pickRoot()` (puros, testados em `tests/tecnicas.test.mjs`). `js/views/voz-tecnicas.js`: rota `#/voz/tecnicas` (lista) e `#/voz/tecnicas/<id>` (detalhe).

## Fases

- [x] **1. Base** — PWA (manifest, ícones, service worker com pré-cache), navegação por 5 abas, identidade visual, fontes locais (OFL), motor de áudio, detecção de altura (pior erro 8,3 cents nos testes), armazenamento, testes, tela Início e Ajustes.
- [x] **2. Harmonia** — 16 aulas (`js/data/aulas.js`, laboratórios em `js/core/lab.js`), estúdio de acordes (27 tipos, 4 aberturas), imersão, cante a sua voz, ouvido adaptativo (`js/music/ear.js`), glossário, 7 arranjos (`js/music/arrangements.js`). Teste confere cada nota contra a cifra.
- [x] **3. Voz e Evolução** — respiração (4 padrões + teste de “sss”), aquecimento (7 exercícios na extensão medida), afinação (afinador, nota, harmonia), dicas, medidor de registro (`js/audio/voice-analysis.js` + `js/core/voice-tasks.js`), retrato vocal (8 etapas, grava escala), painel com gráficos (`js/core/charts.js`), comparação A/B de retratos, marcos, backup e gravações.
- [x] **4. Estúdio** — 23 lições em 4 módulos (`js/data/licoes.js`), 27 simuladores (`js/core/sim.js`, `sim2.js`), LUFS/true peak/limiter validados com EBU Tech 3341 (`js/audio/loudness.js`), mesa virtual com 4 missões (`js/audio/mixer.js`, `js/core/mesa-ui.js`), 16 fotos reais do Commons conferidas (`js/data/imagens.js`, `CREDITOS.md`), marcadores numerados na foto do canal.
- [x] **5. Gravador e projeto final** — gravador de 6 pistas com PCM cru do worklet alinhado ao relógio de áudio, guia, metrônomo, calibração de latência, forma de onda, exportação WAV (`js/views/estudio-gravador.js`, `js/audio/recorder.js`); projeto “Do zero ao master” (`js/views/estudio-projeto.js`).
- [x] **6. Extras** — metrônomo com vibração, 6 aulas de ritmo com toque na tela, leitura de partitura (claves de Sol e Fá), teclado na tela e por Web MIDI com reconhecimento de acordes, 4 melodias de domínio público rearmonizadas em quatro níveis.
- [x] **7. Polimento (parcial)** — teste offline completo (87 arquivos em cache, 29 telas, fotos e fontes), fluidez ≥ 55 quadros/s com CPU 4× mais lenta na Imersão e na Mesa, alvos de toque de 44 px e ausência de rolagem horizontal conferidos em cada cenário, README, TESTES-NO-CELULAR, CREDITOS, LICENCA.
- [x] **8. Técnicas vocais** — seção “Tirar a voz da garganta” na aba Voz: autodiagnóstico, quatro trilhas (soltar, ar, som na frente, na música) e nove técnicas, cada uma com por que ajuda, passo a passo, como saber que deu certo, erro comum, exemplos e melodia-guia para ouvir (`js/data/tecnicas.js`, `js/views/voz-tecnicas.js`). Teste offline passou a cobrir 90 arquivos e 30 telas.
  - Falta: testar em aparelho real se as instruções ficam claras e se o som do exemplo agrada (ver TESTES-NO-CELULAR.md, seção 5). O conteúdo é pedagógico geral e não substitui um professor de canto ou fonoaudiólogo.
  - Falta (Fase 7): revisão visual das capturas das telas da Fase 6 (partitura, ritmo), passada com `--reduced`, revisão final dos textos e teste em aparelho real (ver TESTES-NO-CELULAR.md).

## Pendências conhecidas

- Publicação: a pasta `Downloads\sexteto-app` do Bruno não é um clone. O push funciona a partir de um clone de `brunoalves72ba-droid/psychic-spoon`; o site (GitHub Pages) publica da branch `claude/sexteto-vocal-harmony-app-brobms`.
- Rotas extras (`harmonia-metronomo`, `-ritmo`, `-partitura`, `-teclado`) já têm link no hub e serão criadas na Fase 6.

## Decisões

- Fotos: a API do Commons passou a responder 429 (política de robôs) e as miniaturas mudaram para `thumb.wikimedia.org` (não liberado). Solução: baixar do `upload.wikimedia.org/.../thumb/<hash>/...` calculando o hash MD5 do nome do arquivo. Autor e licença vieram das buscas feitas antes do bloqueio.
- Alvos de streaming: só o Spotify tem número oficial confirmado; Apple Music e YouTube estão descritos na lição 4.3 como não confirmados em página oficial.

- Rede: o ambiente bloqueava o Wikimedia Commons; foi criado o ambiente "psychic-spoon" liberando `commons.wikimedia.org` e `upload.wikimedia.org`.
- Fontes vêm dos pacotes npm `@fontsource-variable/*` (SIL OFL 1.1), só o subconjunto latino, copiadas para `assets/fonts` com as licenças.
- Arranjos são gerados por `voiceChord()` a partir de cifra + nota da melodia (determinístico), e um teste confere cada nota contra a cifra.
- Worklet sem `import`: o código do núcleo é concatenado em um Blob, o que funciona em todos os navegadores e offline.
