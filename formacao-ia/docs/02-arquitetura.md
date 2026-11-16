# 02 · Arquitetura

## Visão de cima

```
index.html ──► js/app.js (boot + roteador)
                 │
                 ├─ js/core/estado.js  ◄──► js/core/store.js (IndexedDB "formacao-ia")
                 │      ▲                        kv: uma chave por parte do estado
                 │      │                        log: histórico de revisões e lições
                 │      └── js/core/nuvem.js ──► GitHub Gist secreto (opcional, cifrado)
                 │
                 ├─ js/views/<tela>.js   (uma tela por arquivo, carregada sob demanda)
                 │      └─ usa js/core/ui.js (criar DOM), js/data/* (conteúdo), js/labs/* (laboratórios)
                 │
                 └─ sw.js (service worker) ── guarda tudo de sw-assets.js; áudio no cache "fia-audio"
```

## O documento `index.html`

- `<html lang="pt-BR">`, `viewport-fit=cover`, `<meta name="app-id" content="formacao-ia">` (usado para detectar
  quando outro app do mesmo site responde no lugar deste, ver “Convivência” abaixo).
- `theme-color` claro `#f6f2e9` e escuro `#12141b`; `apple-mobile-web-app-title` “Formação IA”.
- Ícones com `?v=3` (força o celular a perceber a troca de ícone). Pré-carrega as fontes Atkinson Next e Bricolage.
- Um script inline aplica o tema salvo em `localStorage['fia-tema']` (`claro`/`escuro`) **antes da primeira pintura**.
- Corpo: link “Pular para o conteúdo”, `<main id="view">` (onde as telas são desenhadas), a barra de abas
  `<nav class="tabs">` com 6 links (Hoje, Trilha, Revisar, Projeto, Progresso, Ajustes; cada um com `data-tab` e um SVG)
  e o contêiner de avisos. Por fim `<script type="module" src="js/app.js">`.

## Inicialização (`js/app.js › boot`)

1. `paginaErrada()`: se a página carregada não tem a meta `app-id=formacao-ia` (um service worker antigo de outro app
   do mesmo site respondeu), registra o próprio service worker, espera ativar e recarrega — no máximo 2 vezes
   (`sessionStorage['fia-cura']`). Senão mostra “Não deu para abrir o app agora…”.
2. `carregar()` lê todo o IndexedDB para o estado `S` (ver abaixo) e os dados do aparelho `L`.
3. `aplicarTema(S.perfil.tema)` e `aplicarPlataforma()` (classe `pc` ou `celular` no `<body>`).
4. Sem hash, vai para `#/hoje`. Desenha a tela (`render()`).
5. `registerSW()`: registra `sw.js` com `updateViaCache: 'none'`; oferece “Nova versão do app pronta · Atualizar”
   quando um worker novo instala; procura atualização ao voltar para a tela e a cada 30 min.
6. `persistir()` pede armazenamento persistente. `nuvem.iniciar()` liga a sincronização (se houver token).
   Quando chegam dados do outro aparelho, redesenha (menos no meio de uma lição/revisão: aí só avisa).

## Roteador

- Hash `#/secao/pagina/arg…`. Se existe a tela `secao-pagina` no conjunto `VIEWS`, carrega `js/views/secao-pagina.js`
  com `args = [arg…]`; senão, se existe `secao`, carrega `js/views/secao.js` com `args = [pagina, arg…]`; senão, Hoje.
- **Contrato de uma tela:** `export default async function (el, args)` desenha dentro de `el` (uma `div.page` cujo
  `append` ignora `null`/`false`) e pode **devolver uma função de limpeza** (chamada ao sair: tira ouvintes, para áudio).
- Telas **imersivas** (escondem as abas): `licao`, `revisar-cartoes`, `revisar-mistura`, `foco`.
- A aba acesa vem do mapa `ABA` (por seção) e de `ABA_AJUSTES` (`mais-ajustes`, `mais-sync`, `mais-instalar`,
  `mais-backup` acendem “Ajustes”).
- Troca de tela com `document.startViewTransition` quando existe e o usuário não pediu menos movimento.
- O título da aba do navegador vira “<h1 da tela> · Formação IA”.
- Lista completa de rotas: [Inventário › Telas](INVENTARIO.md#telas-rotas).

## Criação de interface (`js/core/ui.js`)

Sem framework: `h('tag.classe#id', {props}, ...filhos)` cria elementos (props: `onclick` vira ouvinte, `data` vira
`dataset`, `css` define variáveis CSS, `style` objeto, `null/false` são ignorados). `s()` faz o mesmo para SVG.
Também ficam lá: `rich()` (negrito `**`, itálico `*`, código `` ` ``, links, inclusive `#/rota` interna), `blocks()`
(desenha os blocos de conteúdo de uma lição), `codeBlock()` (com botão copiar e, quando é Python, “▶ Rodar”), `toast()`,
`sheet()` (folha que sobe de baixo), `confirmSheet()`, `seg()` (botões segmentados), `toggle()` (interruptor),
`tick()`, `progressBar()`, `icon()` (ícones de traço), `top()` (cabeçalho com voltar) e formatadores (`fmt`, `fmtDur`,
`fmtDia`, `plural`).

## Estado e armazenamento

- **`S` (estado do estudo)** — um objeto único em memória, gravado por chave no IndexedDB a cada mudança
  (`salvar('chave'…)` agrupa gravações seguidas). Chaves e significado:

| Chave | Conteúdo |
|---|---|
| `perfil` | `{ criado, plano: 'A'|'B'|null, inicio, alvo: minutos (5/10/15/25), tema: 'auto'|'claro'|'escuro', boasVindas }` |
| `licoes` | `id → { p: passo atual 0–5, feita: dia, quiz: [bool], ex: { ok, tent }, mao: 'feito'|'depois', maoQuando, ini }` |
| `cartoes` | `id → { s: degrau 0–5, due: dia, n: revisões, l: lapsos, u: último dia }` — id `"<lição>#<pergunta>"` ou `"u…"` (cartão próprio) |
| `meus` | cartões importados `{ id, f, v }` |
| `dias` | `dia → { l: lições, c: cartões, m: missões/práticas, p: passos, s: segundos }` (o que conta como “dia de estudo”) |
| `semana` | sequência semanal `{ seq, gelos, ult, hist }` (recalculada a cada abertura) |
| `xpPor` | `aparelho → XP` (o XP total `xp` é derivado e não é gravado) |
| `apagados` | “lápides” `'tipo:id' → quando` (para a sincronização não ressuscitar o que foi apagado) |
| `conquistas`, `marcos` | `id → dia` (marcos: primeira vez de json, api200, python, rag, n8n, agente…) |
| `diario`, `pensamentos` | listas `{ d, t }` / `{ id, d, t, ok }` |
| `missoes` | `id → { itens: { i: true }, feita: dia }` |
| `ficha`, `prompts`, `fichaViva`, `semanais` | ficha técnica do APE-IA, biblioteca de prompts, conferências da Ficha viva, revisões semanais |
| `andaime` | `{ nivel 1–3, janela: [bool…] }` |
| `desafios`, `mistura`, `sessao` | desafios feitos, última revisão misturada, lição em andamento |

  `perfil`, `ficha`, `sessao`, `andaime` e `mistura` são “inteiras”: ganham `_t` (hora) ao gravar e, na sincronização,
  vence a mais recente.
- **`L` (dados só deste aparelho)** — chave `local`: `{ dispositivo: id, nuvem: { token, gist, ult, erro… }, plataforma: 'auto'|'pc'|'celular', voz? }`.
  Nunca vai para o backup nem para a nuvem.
- **IndexedDB** `formacao-ia`, versão de esquema 1: store `kv` (chave → valor) e store `log` (auto-incremento, índice `t`),
  onde ficam os eventos `{ t: 'rev'|'licao', … }` usados para medir retenção. Sem IndexedDB (testes, modo privado), usa memória.
- **Datas** são texto `AAAA-MM-DD` no fuso do aparelho; semana de segunda a domingo (`js/core/dia.js`). Os testes podem
  “viajar no tempo” com `globalThis.__FIA_HOJE`.
- **Outras chaves do navegador:** `localStorage` `fia-tema`, `fia-vel` (velocidade do áudio), `fia-audio-auto`
  (tocar ao abrir), `fia-cortes:<aula>:<bytes>` (cortes do áudio já calculados); `sessionStorage` `fia-cura`.

## Service worker e uso sem internet

- `tools/gen-precache.mjs` lista **todos** os arquivos do app (`index.html`, `manifest.webmanifest`, `css`, `js`,
  `assets`, `kits`, `audio/indice.json`) em `sw-assets.js`, com uma versão = hash do conteúdo. **Rode `npm run precache`
  depois de qualquer mudança**; `npm test` falha se a lista estiver velha.
- `sw.js`: na instalação baixa tudo para o cache `formacao-ia-<versão>`; na ativação apaga caches `formacao-ia-*` antigos;
  responde primeiro do cache (ignorando `?v=`), com `index.html` para navegações; `skipWaiting` quando o app pede.
- **Áudio** (`/audio/*.mp3`) não entra no pré-cache (são 54 MB): fica no cache **`fia-audio`**, preenchido na primeira vez
  que cada aula toca (ou pelo botão “Baixar todos os áudios”). Esse cache tem outro prefixo para sobreviver às atualizações.

## Convivência com o Sexteto (mesmo site)

O site `…/psychic-spoon/` tem o app **Sexteto** na raiz e este app em `/formacao-ia/` (e outros, como `/financas/`).
Para não se atrapalharem:
- cada app tem o **seu** service worker, cache e banco IndexedDB;
- o `sw.js` do Sexteto ignora pedidos com `/formacao-ia/`;
- o manifesto do Sexteto tem `scope: "./index.html"` (antes, `./` capturava os links deste app no Android);
- o manifesto deste app tem `id: "./index.html?app=formacao-ia"`, `scope: "./"` e ícone próprio;
- `paginaErrada()` (acima) conserta sozinho o caso de um service worker antigo responder no lugar.

## Plataforma (celular × PC)

`js/core/plataforma.js`: é **PC** quando o ponteiro é fino, há hover e a tela tem 900 px ou mais (ou não há toque e a
tela tem 1024 px ou mais). Dá para forçar em Ajustes. O `<body>` recebe `pc` ou `celular`; o CSS troca a barra de abas
de baixo por um menu lateral, usa duas colunas e mostra atalhos de teclado.
