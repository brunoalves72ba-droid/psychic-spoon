# 03 · Conteúdo e dados

Todo o conteúdo fica em `js/data/`, como módulos JavaScript (objetos literais). **Para recriar o app, copie esses arquivos
sem mudar nada**: as lições, as perguntas e as respostas são o coração do produto. Este capítulo descreve o formato, para
você conseguir ler, conferir e acrescentar conteúdo.

## Índice da trilha (`js/data/curso.js`)

- Junta `m0.js` … `m6c.js` (cada um exporta uma lista de lições: `M0`, `M1`, `M2`, `M3A`, `M3B`, `M4A`, `M4B`, `M4C`,
  `M5A`, `M5B`, `M5C`, `M6A`, `M6B`, `M6C`).
- `MODULOS`: `[{ n, cor: 'var(--mN)', t, sub, horas, ementa, ganha, marco, aulas: [{ t, ids: [...] }] }]`.
- `TODAS` (as 98 lições em ordem), `ORDEM` (os ids em ordem), `PASSOS` (nomes dos 7 passos),
  `licao(id)`, `modulo(n)`, `moduloDe(id)`, `aulaDe(id)`, `idsDoModulo(n)`, `proxima(licoes)` (primeira não concluída),
  `seguinte(id)`, `progressoModulo(n, licoes)` → `{ feitas, total, frac }`, `progressoGeral`, `moduloAtual`,
  `cartao(id, meus)`.

## Uma micro-lição

```js
{
  id: '3.5',                     // módulo.número — também é o nome do áudio (audio/aula-3.5.mp3)
  t: 'Primeira chamada (sem código)',
  min: 9,                        // minutos estimados
  gancho: 'Hoje você conversa com um modelo sem chat nenhum…',          // passo 1
  analogia: 'É **preencher e postar a carta** você mesmo…',             // passo 2 (destaque)
  ideia: [ /* blocos */ ],       // passo 2
  exemplo: [ /* blocos */ ],     // passo 3: exemplo resolvido
  ex: { tipo: 'lab', … },        // passo 4: exercício (um tipo, abaixo)
  quiz: [ { q, o: [certa, errada, errada], w } ],   // passo 5: 3 perguntas
  erro: { t: 'título do erro comum', d: 'explicação' },               // passo 6
  mao: { t, onde: 'pc'|'fora', passos: [...], criterio },             // opcional: prática fora do app
}
```

**Convenção obrigatória:** em todo quiz e em todo caso de `escolha`, **a primeira opção é a correta**. A tela embaralha.
Cada pergunta deve fazer sentido **sem** as opções, porque ela vira cartão de revisão (frente = `q`, verso = `o[0]`,
complemento = `w`).

### Blocos (em `ideia` e `exemplo`)

| Bloco | Formato | Como aparece / é lido |
|---|---|---|
| Parágrafo | `'texto com **negrito**, *itálico*, \`código\` e [link](url ou #/rota)'` | parágrafo |
| Código | `{ c: 'código', l: 'python'|'json'|'prompt'|'bash'|'http'|'n8n'|'texto'|'saida'|'toml'|'md', t?: 'título', run?: true, ent?: ['entrada'], wrap?: true }` | caixa escura com “copiar”; `run` + Python mostra “▶ Rodar” (com `ent` como entradas do `input()`) |
| Lista | `{ ul: [...] }` ou `{ ol: [...] }` | lista |
| Passos | `{ passos: [...] }` | lista numerada em cartões |
| Nota | `{ nota: 'texto', tipo: 'dica'|'aviso'|'analogia'|'erro', rot?: 'rótulo próprio' }` | caixa colorida |
| Subtítulo | `{ h: 'texto' }` | título menor |
| Tabela | `{ tab: { h: ['col', …], r: [['célula', …], …] } }` | tabela rolável |

### Exercícios (`ex.tipo`) — `js/core/exercicios.js`

| Tipo | Campos | Comportamento |
|---|---|---|
| `escolha` | `enun?`, `casos: [{ q, o, w }]` | várias perguntas de múltipla escolha (1ª opção certa) |
| `classificar` | `enun?`, `baldes: ['A', 'B']`, `itens: [{ t, b: índice do balde, w? }]` | tocar no balde certo de cada item |
| `ordenar` | `enun`, `itens: [...]` na ordem certa | peças embaralhadas para pôr em ordem |
| `lacunas` | `enun`, `molde` com `⟦n:resposta¦alternativa⟧`, `opcoes?` (vira lista), `modo?: 'texto'|'python'`, `nivel?`, `testes?`, `exato?`, `dica?`, `w?` | completar lacunas; com andaime, o nível decide quantas lacunas aparecem; `modo: 'python'` no nível 3 vira editor com testes |
| `texto` | `enun`, `campos?: [{ id, rot, min, ph }]` (ou `rot/min/ph` de um campo só), `checks?`, `juntar?`, `lingua?`, `modelo?`, `salvarPrompt?` | escrever; mostra o texto montado, um modelo para comparar e (se pedido) “salvar na biblioteca de prompts” |
| `json` | `enun`, `inicial`, `espera?` (formato esperado), `apoio?`, `w?` | editor com validador em português (`js/core/json-pt.js`) |
| `refletir` | `enun`, `modelo`, `pontos?` | escrever com as próprias palavras e comparar com a resposta-modelo, marcando os pontos cobertos |
| `lab` | `lab: 'id do laboratório'`, `missao`, `enun`, `opts?` | abre o laboratório dentro da lição; a missão cumprida libera o passo |
| `python` | `enun`, `inicio` (código inicial), `testes: [{ saida, entrada?, depois? }]`, `dicas`, `solucao`, `molde?`, `doZero?` | editor + MicroPython no aparelho; passa quando a saída bate com os testes |

Contagem de tipos e o exercício de cada lição: [Inventário › Trilha](INVENTARIO.md).

### Lacunas e andaime

Marcação `⟦n:resposta⟧`: `n` é a prioridade (1 some primeiro). Alternativas aceitas separadas por `¦`.
Nível 1 esconde só as de prioridade 1, nível 2 as ≤ 2, nível 3 todas. A conferência ignora maiúsculas, espaços repetidos
e o tipo de aspas (salvo `exato: true`). Regras do nível: [04 · Regras › Andaime](04-regras-e-algoritmos.md).

## Cartões de revisão

- Criados ao **concluir** uma lição: um por pergunta do quiz, id `"<lição>#<índice>"` (ex.: `3.5#0`).
- `cartao(id, meus)` monta `{ id, f: pergunta, v: resposta certa, w: explicação, lid, licao, m }`.
- Cartões próprios (`#/revisar/importar`): JSON `[{ "frente": "...", "verso": "..." }]` ou CSV `frente;verso`; id começa com `u`.

## Projeto APE-IA (`js/data/projeto.js`)

`PROJETO = [{ m, t, entrega, pronto, missoes: [{ id, t, min, itens: [...] }] }]` — uma etapa por módulo, missões de 10 a
25 minutos com lista de conferência. A missão final tem id `m6-final`. `proximaMissao`, `progressoProjeto`, `feitaMissao`.
Lista completa: [Inventário › Projeto](INVENTARIO.md#projeto-ape-ia).

Kits de código prontos (`kits/`): `m3/mini_rag.py`, `m5/fabrica_flashcards.py`, `m6/agente.py`, `m6/app.py`, com
`requirements.txt`, `env.example.txt`, `gitignore.txt` e `m6/secrets.toml.txt` (extensão `.txt` para o GitHub Pages servir).
A tela `#/projeto/kits` oferece cada um para baixar.

## Laboratórios (`js/data/labs.js` + `js/labs/*.js`)

`LABS = [{ id, t, d, m, licao }]`. Cada `js/labs/<id>.js` exporta `default({ missao, opts, feito, ctx })` → elemento.
`js/labs/comum.js` tem peças compartilhadas. O Python roda com **MicroPython (WebAssembly)** em `assets/micropython/`,
num Web Worker (`py-worker.js`), com limite de **4 s** por execução (mais 12 s na primeira, para carregar); o harness
(`py-harness.js`) executa cada teste num espaço novo, com `input()` simulado. A API de treino (`js/labs/api.js`) responde
200/400/401/404/429 sem internet; chave de treino `treino-123`.

## Fotos (`js/data/fotos.js`)

`FOTOS = { id: { arq, w: 960, h: 640, alt, legenda, autor, licenca, titulo, fonte } }` — 22 fotos do Wikimedia Commons,
WebP 960×640, todas com licença livre e crédito exibido. `POR_LICAO = { idLição: idFoto }` e `POR_MODULO = { n: idFoto }`.
Créditos completos em `CREDITOS.md`.

## Outros dados

| Arquivo | Formato | Uso |
|---|---|---|
| `ficha.js` | `FICHA = [{ id, g: grupo, t, d, u?: link }]`, `VERIFICADO`, `REVISAR_DIAS = 90` | Ficha viva: o que muda rápido (modelos, cotas, preços, regras) |
| `recursos.js` | `RECURSOS = { n: [{ t, de, u }] }` | links externos por módulo |
| `desafios.js` | `DESAFIOS = [{ id, m, t }]` | desafio surpresa a cada 2 semanas |
| `videos.js` | `VIDEOS = { idLição: 'link do YouTube' }` (vazio hoje) | vídeo opcional no topo da aula |

## Áudio (`audio/`)

`aula-<id>.mp3` (98 arquivos) e `indice.json`:
`{ "<id>": { arquivo, duracao, bytes, capitulos: [{ id: 'passo-0'|'passo-1'|'passo-2'|'passo-5', nome, t }], cortes?, voz, gerado } }`.
Os áudios publicados hoje usam a voz **pt-BR-Chirp3-HD-Puck** com cortes **estimados** (o app ajusta pelas pausas).
Detalhes em [07 · Áudio](07-audio-video-e-midia.md).

## Acrescentar ou corrigir conteúdo

1. Edite a lição em `js/data/m*.js` (mantenha a 1ª opção como certa).
2. `npm test` — `tests/conteudo.test.mjs` confere o formato de todas as lições, tamanhos, marcações e ids;
   `tests/python.test.mjs` roda a solução de cada exercício de Python no mesmo MicroPython do app.
3. Se mudou o texto falado, gere de novo o áudio daquela aula: `npm run audio -- --aula 3.5 --refazer`.
4. `npm run precache` e `npm run docs`.
