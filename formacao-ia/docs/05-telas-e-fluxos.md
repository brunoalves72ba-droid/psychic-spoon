# 05 · Telas e fluxos

Seis abas: **Hoje · Trilha · Revisar · Projeto · Progresso · Ajustes** (no celular, barra embaixo; no PC, menu lateral
com “Ajustes” no pé). Rotas, arquivos e o propósito de cada tela: [Inventário › Telas](INVENTARIO.md#telas-rotas).

## Hoje (`#/hoje`)
- Um cartão grande com o **próximo passo** (“Próximo passo” ou “Você parou aqui · passo X de 7”), foto do módulo e o botão
  **Começar N min** / **Continuar**. Trilha terminada → “Ir para o projeto”.
- “Como funciona” (só até tocar “Entendi”).
- **Pergunta-relâmpago:** o primeiro cartão do dia, com “Mostrar a resposta” e Errei/Difícil/Lembrei; link para os outros.
- **Escolher pelo meu estado:** energia e tempo → sugestões (regras no capítulo 04).
- **Sua semana:** 🔥 dias seguidos e dias estudados, os 7 dias com marcação, congelamentos e o quanto falta para a meta.
- No PC: práticas que esperavam pelo computador; status da sincronização; atalho “Instalar como app próprio” enquanto não
  estiver instalado; desafio surpresa e revisão semanal quando chegam.

## Trilha (`#/trilha`, `#/trilha/m/<n>`)
- **Módulos:** as 7 “ilhas” (M0–M6) com o progresso de cada uma; **O seu APE-IA**: as partes do projeto montadas e a próxima;
  **Laboratórios** (`#/labs`, cada um em `#/labs/x/<id>`).
- Página do módulo: foto, aulas com as micro-lições (feita / em andamento / próxima), missão do projeto e recursos externos.

## Lição (`#/licao/<id>`, imersiva)
- Topo: fechar (o lugar fica guardado), os 7 passos **tocáveis** (dá para voltar a qualquer passo já visto sem perder
  respostas) e o relógio da sessão (toque muda a meta de minutos).
- **Player de áudio** (se a aula tem MP3): toca **só a parte do passo aberto** — Começo (passo 1), Ideia (2), Exemplo (3),
  Erro comum (6) — e para no fim dela; começa sozinho ao abrir o passo (“Tocar ao abrir: sim/não”); play/pausa, barra
  da parte, tempo, velocidade **1x · 1,25x (padrão) · 1,5x**. Nos passos de exercício, quiz e fim, o player some.
- Passo 1: título, **vídeo** (se houver) ou foto de capa, gancho, link para a lição anterior.
- Passo 2: analogia em destaque, foto, blocos da ideia. Passo 3: exemplo resolvido (código com copiar/rodar).
- Passo 4: exercício (com “Rever a ideia e o exemplo” numa folha) e “Pular o exercício por agora”.
- Passo 5: quiz, uma pergunta por tela, resposta imediata (certo/errado + explicação), XP e animação curta no acerto.
- Passo 6: erro comum de iniciante. Fim: festa, XP, acertos, cartões criados, prática “mão na massa”, uma frase para o
  diário, módulo completo (se for o caso) e a **próxima lição já carregada**; “Rever esta lição” e “Parar por hoje”.
- Barra de ação embaixo: Voltar · anotar um pensamento · Começar/Continuar/Próxima pergunta/Concluir.
- Ao concluir cada passo, o segmento do passo pulsa (feedback visual). Teclado no PC: Enter/→ avança, ← volta,
  1–3 respondem o quiz, N anota um pensamento.

## Revisar (`#/revisar`, `#/revisar/cartoes`, `#/revisar/mistura`, `#/revisar/importar`)
- **Para hoje** (Revisar agora / Revisão em dia / Teto de hoje atingido), **Próximos 7 dias** (quantos cartões vencem em cada dia),
  **Quanto fica na memória** (retenção de 7 e 21 dias), **Revisão misturada** (abre depois de 4 lições concluídas) e **Importar cartões**.
- Sessão de cartões (imersiva): frente → “Mostrar a resposta” → Errei/Difícil/Lembrei (no PC: Espaço, 1, 2, 3);
  quem errou volta no fim; ao terminar, “Estou no embalo: mais 5”.
- Misturada: perguntas de módulos diferentes. Importar: JSON ou CSV (inclusive da Fábrica de flashcards do M5).

## Projeto (`#/projeto/...`)
- Etapas do APE-IA por módulo; missões com lista de conferência; **modo foco** (`#/foco/<missão>`, imersivo, um item por vez).
- Diário de bordo, Ficha técnica (M1), Biblioteca de prompts (M2, com versões e rubrica), Kits de código, Práticas pendentes.
  Diário, ficha e prompts exportam em Markdown.

## Progresso (`#/progresso/...`)
- Nível e XP, **Últimas 12 semanas**, **Memória**, **Módulos**, conquistas, revisão da semana (com desafio surpresa), cronograma (Plano A/B, recalcular),
  pensamentos guardados, Ficha viva (data da conferência, itens a rever), lembretes no calendário (`.ics`),
  “Por que o app é assim”.

## Ajustes (`#/mais/ajustes` e subtelas)
- **Celular e PC:** ligar a sincronização (`#/mais/sync`), instalar e salvar no celular (`#/mais/instalar`), tipo de
  aparelho (detectar / computador / celular).
- **Áudio das aulas:** quantas aulas têm áudio, quantas já estão no aparelho, “Baixar todos os áudios”.
- **Aparência:** tema automático/claro/escuro. **Sessão:** meta de minutos (5/10/15/25) e plano.
- **Seus dados:** backup (exportar/importar), lembretes, apagar tudo. **Sobre:** versão em uso e “Procurar atualização”.

## Instalar (`#/mais/instalar`)
Botão de instalar (quando o navegador oferece), passo a passo para Android (Chrome › ⋮ › Instalar app) e iPhone
(Safari › Compartilhar › Adicionar à Tela de Início), aviso de quando o link abre dentro do Sexteto, conferência de que
todos os arquivos estão no aparelho e pedido de armazenamento permanente.

## Mudanças da versão 2

- **Primeira abertura:** "Como você quer ser chamado?" (não aceita vazio) → boas-vindas → Hoje. O nome muda em Ajustes.
- **Hoje:** saudação com a mascote; check-in do dia logo acima do Próximo passo; a semana, a pergunta-relâmpago e o desafio continuam.
- **Módulo (`#/trilha/m/<n>`):** duas pílulas ("X de Y lições" e "~N h com prática"; as horas da ementa saíram da tela, os dados ficam); título da aula só quando difere do módulo; a lição da vez vira um card com o único botão principal ("Continuar aqui" ou "Começar aqui").
- **Lição:** mascote de óculos no topo; texto grifado durante o áudio; `#/licao/<id>/conferir` mostra o tempo e o trecho calculado.
- **Menu lateral:** ver "Sistema visual" no doc 06. **Sobre o app** (`#/mais/sobre`): descrição, créditos, versão e "Procurar atualização" (saíram de Ajustes).
