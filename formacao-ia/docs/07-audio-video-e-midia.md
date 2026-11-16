# 07 · Áudio, vídeo e mídia

Guia prático para gerar a voz no seu computador: [`AUDIO.md`](../AUDIO.md). Aqui está o funcionamento completo.

## Os áudios que já existem (reaproveite)

- `audio/aula-<id>.mp3` — 98 arquivos, um por lição, **237 min no total, 54 MB**, MP3 mono 24 kHz, voz
  **pt-BR-Chirp3-HD-Puck** (Google Cloud Text-to-Speech), gerados em 16/11/2026.
- `audio/indice.json` — duração, tamanho, capítulos (Começo, Ideia, Exemplo, Erro comum), voz e tipo de corte.
  Hoje os cortes são **estimados** (o app ajusta pelas pausas; ver capítulo 04).
- Para recriar o app idêntico, **copie a pasta `audio/` inteira**. Não é preciso gerar nada de novo.

## O que cada áudio diz

O gerador lê, de cada lição, nesta ordem: “Lição X ponto Y. <título>” + gancho (**Começo**) → “Ideia” + analogia + blocos
da ideia (**Ideia**) → “Exemplo resolvido” + blocos do exemplo (**Exemplo**) → “Erro comum de iniciante” + título e
explicação do erro + “Fim da leitura. Agora faça o exercício e o quiz na tela.” (**Erro comum**). Exercício e quiz não
são lidos (são interativos). Blocos de código viram “<título>. O código está na tela.”; blocos de `prompt`/`texto` são
lidos (“O texto do exemplo diz: …”).

## Gerador (`tools/audio/`, roda só no computador)

| Arquivo | Papel |
|---|---|
| `gerar-audio.mjs` | linha de comando: lê as lições, monta o SSML, divide, chama o provedor, junta o MP3, grava o índice, regenera o pré-cache |
| `ssml.mjs` | monta as peças de SSML de cada lição e converte para cada provedor |
| `falado.mjs` | forma falada do texto (sem mudar o texto da tela) e pronúncia de termos em inglês |
| `mp3.mjs` | tira etiquetas ID3 e mede a duração pelos quadros MPEG |
| `.env.exemplo` | modelo de configuração (o `.env` com a chave fica no `.gitignore`) |

Comandos: `npm run audio:simular` (não gasta nada: conta caracteres e grava o SSML em `audio/ssml/` para conferir),
`npm run audio` (gera o que falta), `-- --aula 0.1,0.2`, `-- --refazer`, `-- --limite 10`, `-- --saida pasta`.
Configuração (`tools/audio/.env` ou variáveis de ambiente): `PROVEDOR=google|elevenlabs`, `GOOGLE_TTS_API_KEY`,
`GOOGLE_VOZ` (padrão `pt-BR-Neural2-A`), `VELOCIDADE`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOZ_ID`, `ELEVENLABS_MODELO`.

### SSML (Parte “leitura natural”)
- Pausa de **600 ms** entre parágrafos, **1 s** antes de cada título e entre as partes, 450 ms entre itens de lista.
- Títulos em `<prosody rate="88%">`. Listas numeradas lidas “Primeiro: …, Segundo: …”. Tabelas lidas linha a linha.
- Marcas `<mark name="passo-0|1|2|5"/>` no começo de cada parte.
- Forma falada: moeda (“1.234 reais e 50 centavos”), porcentagem, datas `dd/mm[/aaaa]` (“5 de novembro de 2026”),
  horas (“14 horas e 30”), ordinais (1º, 2ª), unidades (min, h, km, GB…), “3x” → “3 vezes”, abreviações (ex., etc., vs.,
  aprox., obs., p/, c/…), setas e símbolos (→, ≥, ≤, ≈, ≠, &, /mês), código em linha lido devagar
  (“choices item 0 ponto message”), markdown removido, XML escapado.
- Termos em inglês com `<sub alias="…">` (prompt → “prômpt”, JSON → “djêison”, API → “a pê í”, RAG → “rági”…).

### Provedores e limites
- **Google**, endpoint `v1beta1/text:synthesize`, chave no cabeçalho `X-Goog-Api-Key`, MP3 24 kHz, limite de 4.800 bytes
  por pedido. **Neural2/WaveNet:** SSML completo e `enableTimePointing: SSML_MARK` (cortes exatos pelas marcas).
  **Chirp 3 HD:** sem `<break>`, `<prosody>` e `<mark>` (o gerador remove), e **cada parte vai em pedidos próprios**:
  o começo de cada parte é medido somando a duração dos pedaços (cortes exatos).
- **ElevenLabs:** texto puro com `<break time="1.0s" />`, modelo `eleven_multilingual_v2`, até 2.500 caracteres por pedido,
  `output_format=mp3_44100_64`.
- Novas tentativas automáticas em 429 e 5xx. Pula aulas que já têm MP3 (a não ser com `--refazer`).
- Ao terminar, mostra caracteres enviados (o que a API conta) e de fala, e roda `tools/gen-precache.mjs`.
- Custo de referência: o curso inteiro com Chirp 3 HD gastou **219.743 caracteres** (dentro da faixa/créditos gratuitos).

## Player por partes (`js/core/audio.js`, `js/core/cortes.js`)

- Carrega `audio/indice.json`; se a aula não tem entrada, a lição não mostra player (só o texto, sem erro).
- No primeiro play, baixa o MP3 inteiro (o service worker guarda no cache `fia-audio`), calcula os cortes reais se forem
  estimados, e toca da memória (`blob:`), evitando problemas de pedidos parciais.
- `parte('passo-1')` mostra e toca só a Ideia; para no fim da parte (vigiado a cada quadro); tocar de novo recomeça a parte.
- Preferências: `fia-vel` (padrão **1,25**), `fia-audio-auto` (padrão “sim”). Media Session com o título da aula e da parte.
- Ajustes › Áudio das aulas: conta os áudios, mostra quantos estão no aparelho e baixa todos de uma vez.

## Vídeo opcional

`js/data/videos.js`: `VIDEOS = { 'id da lição': 'link do YouTube' }` (aceita youtu.be, watch?v=, shorts, embed, live ou o
código de 11 letras; vídeo “não listado” funciona). Aparece no topo do passo 1 em `youtube-nocookie.com/embed/<código>`;
sem internet, mostra “Esta aula tem um vídeo, mas ele precisa de internet.” Hoje não há vídeos configurados.

## Fotos

22 fotos reais do Wikimedia Commons (licenças livres), 960×640 WebP, com texto alternativo, legenda e crédito na tela.
Ficam na capa e na ideia de 33 lições e na faixa de cada módulo. Lista e créditos: Inventário e `CREDITOS.md`.
