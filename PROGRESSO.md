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
- Tipos de evento no histórico: `lesson`, `ear`, `sing`, `pitch`, `breath`, `mpt`, `range`, `tessitura`, `passaggio`, `register`, `vibrato`, `portrait`, `recording`, `project`, `studio`.

## Fases

- [x] **1. Base** — PWA (manifest, ícones, service worker com pré-cache), navegação por 5 abas, identidade visual, fontes locais (OFL), motor de áudio, detecção de altura (pior erro 8,3 cents nos testes), armazenamento, testes, tela Início e Ajustes.
- [x] **2. Harmonia** — 16 aulas (`js/data/aulas.js`, laboratórios em `js/core/lab.js`), estúdio de acordes (27 tipos, 4 aberturas), imersão, cante a sua voz, ouvido adaptativo (`js/music/ear.js`), glossário, 7 arranjos (`js/music/arrangements.js`). Teste confere cada nota contra a cifra.
- [ ] 3. Voz e Evolução
- [ ] 4. Estúdio (curso, imagens, simuladores, mesa)
- [ ] 5. Gravador multipista e projeto final
- [ ] 6. Extras
- [ ] 7. Polimento

## Pendências conhecidas

- `git push` recusado pelo GitHub (app do Claude sem acesso de escrita ao repositório). Commits estão locais; tentar de novo a cada fase.
- Rotas extras (`harmonia-metronomo`, `-ritmo`, `-partitura`, `-teclado`) já têm link no hub e serão criadas na Fase 6.

## Decisões

- Rede: o ambiente bloqueava o Wikimedia Commons; foi criado o ambiente "psychic-spoon" liberando `commons.wikimedia.org` e `upload.wikimedia.org`.
- Fontes vêm dos pacotes npm `@fontsource-variable/*` (SIL OFL 1.1), só o subconjunto latino, copiadas para `assets/fonts` com as licenças.
- Arranjos são gerados por `voiceChord()` a partir de cifra + nota da melodia (determinístico), e um teste confere cada nota contra a cifra.
- Worklet sem `import`: o código do núcleo é concatenado em um Blob, o que funciona em todos os navegadores e offline.
