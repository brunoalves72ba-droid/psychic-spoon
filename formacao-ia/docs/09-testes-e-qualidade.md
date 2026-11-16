# 09 · Testes e qualidade

Requisitos: Node.js 18+; para os testes ponta a ponta, Playwright com Chromium; para alguns testes de áudio, `ffmpeg`
(são pulados se não houver).

| Comando | O que confere |
|---|---|
| `npm test` | lista de pré-cache em dia + inventário da documentação em dia + **todos os testes unitários** (`tests/*.test.mjs`) |
| `npm run e2e` | percorre o app no Chromium em tela de celular (390×844): ~62 cenários (todas as telas, lição inteira, quiz, revisão, laboratórios, Python, temas, alvos de toque ≥ 44 px, nenhum “null/undefined/NaN”, nenhum pedido externo) |
| `npm run e2e:pc` | o mesmo em 1366×900 (modo PC) |
| `npm run e2e:offline` | instala junto com o Sexteto, corta a rede e confere 17 telas, o Python e os kits sem internet |
| `npm run e2e:sync` | dois aparelhos simulados contra uma API de Gist falsa: sincronizam, mesclam e não perdem nada |
| `npm run e2e:audio` | player por partes (começa sozinho, para no fim da parte, 1,25x padrão, tocar ao abrir, some no exercício), vídeo, dias seguidos |

Testes unitários:
- `motores.test.mjs` — revisão espaçada, semana que perdoa, cronograma, andaime, JSON em português, textos e busca.
- `conteudo.test.mjs` — formato das 98 lições (campos, tamanhos, marcações, ids, 1ª opção certa).
- `python.test.mjs` — roda a solução de cada exercício de Python no MicroPython do app.
- `labs.test.mjs` — motores dos laboratórios. `sync.test.mjs` — mesclagem e cifra.
- `audio.test.mjs` — forma falada, SSML de todas as aulas (bem formado e dentro do limite), MP3, gerador inteiro contra
  uma API de mentira (inclusive Chirp com uma parte por pedido), cortes pelas pausas, dias seguidos.

## Critério de “igual ao original”

Um app recriado está fiel quando: `npm test` passa; os cinco testes ponta a ponta passam; e o
[Inventário](INVENTARIO.md) gerado no app novo bate com o deste repositório nas seções Números, Telas, Trilha,
Constantes, Design e Manifesto.

## Regras de casa

- Depois de mudar qualquer arquivo do app: `npm run precache` e `npm run docs`.
- Em quiz e casos de escolha, a 1ª opção é a certa. Nunca escrever “null” na tela (use `put()` ou o `append` da página).
- Toda tecla/toque precisa de alvo de 44 px; todo texto novo em português do Brasil, frases curtas.
