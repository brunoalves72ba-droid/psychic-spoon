# 04 · Regras e algoritmos

Todas as regras abaixo são **funções puras** (sem tela), testadas em `tests/motores.test.mjs`, `tests/sync.test.mjs` e
`tests/audio.test.mjs`. Os valores exatos (escada, metas, XP, planos, conquistas) também estão no
[Inventário › Constantes](INVENTARIO.md#constantes-das-regras).

## Lição (passos e progresso) — `js/core/estado.js`, `js/views/licao.js`

- 7 passos fixos (`PASSOS`): 0 gancho · 1 ideia · 2 exemplo · 3 exercício · 4 quiz · 5 erro comum · 6 fim.
- Ao avançar, grava o passo (`irPasso`) e marca o dia (`dias[d].p`); a lição em andamento fica em `sessao.licao`.
  Voltar a uma lição não concluída retoma no passo salvo (no máximo o 5).
- Exercício: libera o “Continuar” ao acertar **ou** ao tocar “Pular o exercício por agora”. XP do exercício só na 1ª vez.
- Quiz: 3 perguntas, uma por tela; cada uma vale XP só na **primeira** resposta (certa). As alternativas são embaralhadas.
- Concluir: `feita = dia` (só na 1ª vez), cria os cartões que faltam (`<id>#0..2`), XP `licao` (20) na 1ª vez ou
  `revisita` (5) depois, conta `dias[d].l`, registra evento `licao` no histórico, verifica conquistas.
- Prática “mão na massa”: na tela final, “Já fiz” (XP 15, conta `dias[d].m`) ou fica **pendente** (`mao: 'depois'`),
  aparecendo em Projeto › Práticas pendentes e em destaque quando o app abre no PC (se `onde: 'pc'`).
- Relógio da sessão: começa em 0; ao passar da meta (`perfil.alvo`, padrão 5 min) só **avisa** uma vez
  (“Pode parar aqui… · Continuar no fluxo”), nunca interrompe.

## Revisão espaçada — `js/core/srs.js`

- Escada fixa de intervalos: **1, 3, 7, 21, 60, 120 dias** (degraus 0 a 5). Cartão novo: degrau 0, volta amanhã.
- Notas: **errei** → degrau 0 (amanhã) e +1 lapso · **difícil** → repete o mesmo intervalo · **lembrei** → sobe um degrau.
- Fila do dia: vencidos (`due ≤ hoje`) do mais atrasado ao mais recente, até o **teto de 15** menos o que já foi
  respondido hoje. “Estou no embalo” pede mais 5.
- Na sessão, quem errou volta **no fim da mesma sessão** (“Ainda não” / “Agora lembrei”, sem mudar o agendamento).
- Cada resposta grava um evento `{ t: 'rev', cid, d, int, atraso, ok, nota }`; a **retenção** de 7 e de 21 dias é a
  fração de acertos nas revisões feitas depois de um intervalo de 7 (ou 21) dias. XP `cartao` (2) por resposta.
- Revisão misturada (`#/revisar/mistura`): perguntas de módulos diferentes embaralhadas; XP `mistura` (3) por acerto.

## Semana que perdoa — `js/core/sequencia.js`

- Um **dia conta** se houve qualquer estudo: lição, cartão, missão/prática ou passo (`dias[d].l + c + m + p > 0`).
- Meta: **4 dias em 7** (semana de segunda a domingo). Ao abrir o app, fecha as semanas que já terminaram:
  - 4+ dias → sequência +1 e recarrega 1 congelamento (máximo 2);
  - abaixo da meta → gasta 1 congelamento e mantém a sequência; sem congelamento, a sequência zera (“pausa”);
  - a **primeira semana de uso nunca conta como falha**; ausências longas olham só as últimas 12 semanas.
- O aviso da semana fechada é gentil, uma vez por abertura (ex.: “Um congelamento entrou em ação…”).
- **Dias seguidos:** conta para trás a partir de hoje (ou de ontem, se hoje ainda não estudou — a sequência não quebra
  antes do fim do dia). **Dias estudados:** total de dias com estudo. Os dois aparecem na tela Hoje.

## Andaime (exemplos desbotados) — `js/core/andaime.js`

- Nível 1 a 3 (começa no 1). Cada exercício com andaime registra se acertou **de primeira**; janela dos últimos 5.
- Com pelo menos 3 resultados: taxa ≥ **80%** sobe um nível (menos ajuda); taxa ≤ **34%** desce (mais ajuda). Ao mudar
  de nível, a janela recomeça.

## XP e nível

Por ação: quiz 5 · exercício 10 · lição 20 (revisita 5) · cartão 2 · acerto na mistura 3 · mão na massa 15 ·
item de missão 10 · missão completa 50 · revisão semanal 20 · entrada de diário 5 · desafio surpresa 30.
**Nível = 1 + ⌊XP ÷ 250⌋.** O XP é guardado **por aparelho** (`xpPor`) e somado, para dois aparelhos não contarem em dobro.

## Cronograma — `js/core/plano.js`

- **Plano A:** 4 a 5 h/semana, 26 semanas. **Plano B:** 2 a 3 h/semana, 48 semanas. Cada módulo tem um intervalo de
  semanas (a última de cada bloco é de respiro e revisão) — tabela no Inventário.
- A semana 1 começa na segunda-feira da semana de início. `situacao()` diz a semana atual, o módulo esperado e o atraso.
- **Recalcular** (sem culpa): escolhe um novo dia de início para o plano “encaixar” no ponto atual
  (módulo atual + fração feita), sem apagar nada.

## Conquistas — `js/core/conquistas.js`

Marcam **habilidades** (primeira chamada de API com 200, JSON válido, Python que passou, busca com fonte…), módulos
completos, constância (meta semanal, 3 semanas seguidas, voltar depois de uma pausa), memória (≥ 80% nas revisões de
7 e de 21 dias, com no mínimo 10) e o projeto final. Nunca dependem de sequência perfeita e nunca se perdem.
Lista completa no Inventário.

## Check-in de energia (tela Hoje)

Energia **baixa / média / alta** × tempo **5 / 15 / 30 min** → até 3 sugestões, a primeira em destaque:
- **baixa:** cartões do dia (ou “só os 2 primeiros passos da próxima lição”); com 15+ min, também a lição;
- **média:** a próxima lição (ou cartões); com 15+ min, cartões; com 30 min, a lição seguinte também;
- **alta:** missão do projeto (só no PC) ou prática pendente de PC; senão a lição; com 15+ min, a lição; com 30, cartões.

No celular, missões e práticas de computador **não** são sugeridas.

## Mesclagem entre aparelhos — `js/core/mesclar.js`

Regra geral: **progresso só avança** e o que foi editado por inteiro fica com a versão mais recente.
- Lição: `feita` = a data mais antiga; passo = o maior (0 se feita); quiz = acerto em qualquer aparelho vale acerto;
  exercício = o feito com menos tentativas; prática feita em qualquer aparelho = feita.
- Cartão: o revisto por último (`u`); empate → o com mais revisões (`n`).
- Dias: o maior valor de cada campo. XP: o maior de cada aparelho. Conquistas, marcos e desafios: a data mais antiga.
- Perfil, ficha, sessão, andaime: o de `_t` mais recente. Prompts: maior `versao`, depois o mais recente.
- Diário, pensamentos, prompts, cartões próprios: união por id, menos os que têm **lápide** em `apagados`.
- Missões: união dos itens marcados; `feita` = a data mais antiga.
- Cartões próprios com o mesmo id e conteúdo diferente ganham um id novo (não se sobrescrevem).
- Histórico (`log`): união sem repetir (id estável por evento).
- A sequência semanal **não** viaja: é recalculada em cada aparelho a partir dos dias.

## Cortes do áudio por parte — `js/core/cortes.js`

Quando o índice traz cortes **estimados** (vozes sem marcas de tempo), o app decodifica o MP3 no aparelho e:
1. mede a energia em janelas de 20 ms; acha trechos de silêncio de pelo menos 0,25 s (limiar entre o piso de ruído e
   o nível da fala);
2. para cada corte estimado, olha as pausas até 8 s em volta e escolhe a de maior nota:
   `duração + 0,8 (se depois dela vem uma fala curta de 0,3–2,2 s seguida de outra pausa — o “título” da parte) − 0,04 × distância`;
3. começa a parte 0,12 s antes de a voz voltar; guarda o resultado em `localStorage['fia-cortes:<aula>:<bytes>']`.
Com cortes **exatos** (`"cortes": "exatos"` ou vozes Neural2/WaveNet), usa os tempos do índice como estão.
