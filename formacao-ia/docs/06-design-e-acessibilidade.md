# 06 · Design e acessibilidade

O visual inteiro está em `css/app.css` (um arquivo, sem pré-processador). As **cores exatas de cada variável, nos temas
claro e escuro**, estão no [Inventário › Design](INVENTARIO.md#design-variáveis-de-css-cssappcss).

## Identidade

- **Fundo claro “papel”** (`--bg #f6f2e9`), texto quase preto azulado (`--ink #1c2130`), ação em azul-índigo
  (`--acao #3138c9`). Tema escuro com fundo `#12141b` e ação `#9aa0ff`.
- **Uma cor por módulo** (`--m0` … `--m6`): verde-petróleo, violeta, magenta, laranja, verde, azul, dourado — usadas em
  faixas, passos e cartões daquele módulo (`css: { '--c': m.cor }`).
- **Fontes** (todas SIL OFL 1.1, em `assets/fonts`, variáveis 200–800):
  Atkinson Hyperlegible Next (texto, feita para baixa visão), Atkinson Hyperlegible Mono (código),
  Bricolage Grotesque (títulos). Título `h1` 1,8 rem, `h2` 1,3 rem, `h3` 1,06 rem; corpo 16 px, entrelinha 1,5.
- **Ícone do app:** quadrado arredondado em degradê índigo→violeta (`#4f46e5` → `#6d3be8` → `#9333ea`), brilho suave no
  canto, balão de fala branco com a faísca dourada de IA (`#ffe08a` → `#ffb627`) e duas ondas de som violeta.
  Fonte: `assets/icons/icon.svg`; PNGs gerados por `node tools/gerar-icones.mjs`.

## Componentes (classes principais)

| Classe | Uso |
|---|---|
| `.page` | conteúdo de uma tela |
| `.card`, `.card.dest`, `.card.flat` | cartões (destaque com borda/brilho; simples) |
| `.btn` + `.primary` `.big` `.block` `.small` `.quiet` `.danger` | botões (altura mínima 48 px; `.small` 44 px) |
| `.tag`, `.xp`, `.eyebrow` | etiquetas, XP ganho, sobretítulo em maiúsculas |
| `.callout` (`.dica`, `.aviso`, `.analogia`, `.erro`) e `.banner` (`.ok`, `.quase`, `.ouro`) | caixas de destaque e avisos |
| `.segs.passos .pp` | os 7 passos da lição, tocáveis (`.on` feito, `.now` atual, `.celebra` pulso ao concluir) |
| `.acao-bar` | barra de ação fixa embaixo da lição/revisão |
| `.tabs` | abas (embaixo no celular; menu lateral de 228 px no PC) |
| `.sheet` / `.sheet-bg` | folha que sobe de baixo (consultas, escolhas) |
| `.festa`, `.selo` | tela de conclusão |
| `.player-aula`, `.vels`, `.vel`, `.prog-audio`, `.parte-nome` | player de áudio por partes |
| `.video` | vídeo 16:9 com cantos arredondados |
| `figure.foto`, `.faixa`, `.credito` | fotos com crédito |

## Regras de acessibilidade (conferidas pelos testes)

- **Alvo de toque mínimo de 44 px** em todo botão, link de ação, chip, campo e seletor (o teste ponta a ponta falha se
  algum ficar menor).
- Nada de texto “null”, “undefined” ou “NaN” na tela (o teste procura).
- Contraste adequado nos dois temas; foco visível; link “Pular para o conteúdo”; `aria-label` em botões só com ícone;
  `aria-current` no passo e na aba atuais; `role="status"` nos retornos do quiz.
- **Menos movimento:** com `prefers-reduced-motion`, sem transição de tela nem animações de recompensa.
- Áreas seguras do celular (`env(safe-area-inset-*)`); em paisagem baixa, as abas escondem os rótulos.
- Tema: automático (segue o aparelho), claro ou escuro — aplicado antes da primeira pintura (sem piscar).

## Modo PC × celular

| | Celular | PC |
|---|---|---|
| Navegação | abas embaixo | menu lateral fixo (228 px), “Formação IA” no topo e Ajustes no pé |
| Hoje | uma coluna | duas colunas (`.grade-pc`) |
| Lição | botões grandes, toque | também teclado: Enter/→, ←, 1–3, N |
| Revisão | toque | também Espaço, 1, 2, 3 |
| Sugestões | sem missões nem práticas de PC | missões do projeto e práticas pendentes em destaque |

## Sistema visual (versão 2, fases 1 a 9)

Vale por cima do que estiver diferente acima. Tudo vem dos tokens em `:root` de `css/app.css` (nenhuma cor escrita direto em componente).

- **Um tema só, escuro.** `color-scheme: dark`, `theme-color` e `background_color` `#0B0B0D`. A preferência de tema antiga é ignorada (a chave não é apagada).
- **Tokens:** `--bg-base #0B0B0D`, `--bg-violeta-meio #1E1238`, `--bg-violeta-base #4A2A85`, `--texto-primario #F1F0F5`, `--texto-secundario #A7A5B3`, `--texto-apagado #6E6C7A`, `--divisor #2A2A31`, `--acento #8B6CF2`, `--acento-claro #C4B5FD`, `--acento-texto-ativo #D9CCFF`, `--acento-fundo-ativo rgba(139,108,242,.22)`, `--botao-topo #7656DC`, `--botao-base #3A2470`, vidro `rgba(22,22,26,.20)` + blur 14px saturate 140% + borda .5px `rgba(255,255,255,.08)`, raio 12 (card) e 10 (botão). Curvas: `--curva-ios cubic-bezier(.32,.72,0,1)` e `--curva-ok cubic-bezier(.2,.8,.2,1)`.
- **Papel das cores:** violeta = ação, progresso, concluído, passo, XP, item ativo. Verde e vermelho só no certo/errado de resposta, sempre com ✓/✕. Os módulos não têm cor própria: o número (M0–M6) aparece escrito.
- **Fundo:** camada fixa `.fundo` (degradê preto→violeta, brilho interno nas bordas, 3 manchas desfocadas estáticas).
- **Fontes:** Manrope 500 (títulos), Inter 400/500 (texto), Atkinson Hyperlegible Mono (código). woff2 locais, latin + latin-ext, licenças OFL em `assets/fonts/`.
- **Leitura:** corpo da lição 16px no celular, linha 1,6, máx. 68 caracteres por linha no PC.
- **Botões:** principal em degradê `#7656DC→#3A2470`, texto branco, **no máximo um por tela** (conferido pelo teste de acessibilidade). Secundário quase preto. Toque: `scale(.97)` em 120 ms.
- **Navegação:** barra de baixo em pílula de vidro flutuante com 5 abas (Hoje, Trilha, Revisar, Projeto, Progresso). "Oi, {nome}" no topo das 5 abas abre o menu lateral (gaveta, 76% da largura, máx. 320 px) com: Capturar pensamento, Pensamentos guardados, Ajustes, Sincronizar celular e PC, Instalar no celular (só se não instalado), Sobre o app. No PC os mesmos itens ficam no menu fixo, abaixo das abas.
- **Luz do card de destaque** (`js/core/luz.js`): um card por tela (Hoje: Próximo passo; Trilha: módulo atual; Revisar: Para hoje; Projeto: etapa atual; Progresso: nível). Uma volta de 2,4 s na primeira visita da aba na sessão; toque = volta + brilho; botão principal = flash.
- **Check-in** (`js/core/cartao-checkin.js`): três carinhas, check desenhado, carinha no canto da saudação, pílulas 5/15/30 min, até 3 sugestões e a curiosidade do dia (`js/data/curiosidades.js`).
- **Mascote** (`js/core/mascote.js`): gotinha com antena de faísca, SVG original. Acessórios: café, óculos (na testa na Trilha, nos olhos na lição), cartão, chave de fenda, troféu. Pisca a cada 6–10 s.
- **Boas-vindas** (`js/core/boasvindas.js`): ao abrir a frio (não se o app saiu há menos de 30 min), com uma das 150 frases de `js/data/mensagens.json` sem repetir as últimas 10.
- **Movimento:** só `transform` e `opacity` animam (exceções: o check desenhado do check-in). Laços infinitos só no círculo do check-in e no piscar da mascote. Com "reduzir movimento": sem giro, sem pulo, sem piscar; os estados finais continuam aparecendo.
- **Medido (CPU 4x mais lenta, Chromium headless):** rolar a lista do Módulo 1 e abrir/fechar o menu a 60 fps, 0 quadros longos.

### Fase 10: paleta aurora e imagem de fundo (vale por cima das cores acima)

- **Fundo:** imagem `assets/fundo-aurora.webp` (720×1290, ~10 KB; índigo → azul → turquesa sobre preto), fixa, `cover`, com véu preto por cima (66% no alto, ~50% no meio, 72% embaixo; 72% inteiro na lição). Fundo base `#000000`; `theme-color` e manifest `#000000`.
- **Cores:** acento `#6E8FE8` (azul), acento claro `#A9BEF5`, texto da aba ativa `#C9D6FF`, fundo ativo `rgba(83,127,224,.22)`, botão principal `#4A6FD0 → #3E3B9F`, texto secundário `#A3AEC7`, apagado `#6E7385`, divisor `#2C2D31`. Superfícies em grafite `rgba(28,29,32,.80)`; cards de destaque com brilho petróleo/índigo saindo da borda de baixo. Verde e vermelho das respostas não mudam.
- Contraste medido de novo em pixel sobre a imagem: 0 falhas no celular e no PC.
