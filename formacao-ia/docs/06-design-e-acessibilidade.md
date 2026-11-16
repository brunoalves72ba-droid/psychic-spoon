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
