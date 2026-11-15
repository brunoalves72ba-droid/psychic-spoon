# Finanças do casal — plano e ideias

Plano combinado com Bruno e Rita (os dois usam Android, bancos tradicionais e digitais). Cada etapa é testada, mostrada com capturas de tela e só entra no app depois de aprovada em pull request.

## Situação
- Etapa 1 (captura automática): **entregue** (PR #6).
- Etapas 2 e 3 (Conta Bruno / Conta Rita, compartilhar, aba Casal, sincronização): **entregues juntas**, com o plano de contas pessoal.
- Etapa 4 (fechamento do mês): parte já está na aba Casal (acerto e “Marcar como acertado”); falta o relatório de fechamento.

## Etapas

### Etapa 1 — Captura automática pelas notificações (Android)
- MacroDroid (versão gratuita) lê a notificação do banco e entrega o texto ao Finanças.
- Leitor de notificações de bancos tradicionais (Itaú, Bradesco, BB, Caixa, Santander) e digitais (Nubank, Inter, C6, PicPay, Mercado Pago): compra no crédito (inclusive parcelada), débito, Pix enviado/recebido, boleto pago.
- Compra recusada e estorno não viram gasto; pagamento de fatura fica de fora; notificação repetida não duplica.
- Cartões identificados pelo final (ex.: "Nubank •1234"), com apelido.
- Caixa **“A confirmar”**: ✔ / editar / descartar, e confirmar vários de uma vez.
- “Compartilhar com o Finanças” (Web Share Target) como plano B e para textos avulsos.
- Fatura importada depois reconhece o que já entrou pela notificação.
- Guia de configuração do MacroDroid dentro do app.

### Etapa 2 — Contas de cada um e o que é compartilhado
- Cada celular é uma conta: **Conta Bruno** e **Conta Rita** (escolhida na primeira abertura).
- Tudo nasce **privado** na conta de quem lançou; cada um **escolhe o que compartilhar** (no lançamento, na caixa A confirmar, no extrato um a um ou vários de uma vez) e pode marcar contas que já nascem compartilhadas (ex.: Aluguel).
- Divisão das contas da casa e **acerto do mês** (“Bruno transfere R$ 230 para a Rita”).
- Seletor **Casa · Bruno · Rita**; metas da casa e individuais.

### Etapa 3 — Sincronização entre os celulares
- Gist do GitHub com dados cifrados (mesma técnica do app Formação IA), numa conta do GitHub só da família.
- Conexão por QR code; mesclagem sem perder nada quando os dois lançam sem internet.
- Privacidade dos individuais escolhida por cada um.

### Etapa 4 — Avaliação conjunta
- Fechamento do mês da casa: comparação, metas, maiores gastos, gastos por cartão, faturas a vencer e acerto (“Marcar como acertado”).

## Decisões (aprovadas)
1. Sincronização: **Gist do GitHub**, com os dados cifrados.
2. Divisão da casa: **proporcional à renda, definida manualmente** — o app calcula e sugere o percentual de cada um pela renda do mês, mas o percentual usado é o que vocês definirem à mão.
3. Privacidade dos individuais: **só totais** (o outro vê o total de gastos pessoais, sem detalhes); cada um pode mudar para si.
4. Compras parceladas: **cada parcela no seu mês**.

## Ideias para depois

### DDA e contas a pagar
O DDA (Débito Direto Autorizado) só é acessível pelos bancos; não há acesso público para outros apps e ele não faz parte do Open Finance. Caminho possível sem esse acesso:
- **Aviso de DDA**: ler pelo mesmo leitor de notificações o aviso de “novo boleto disponível” e criar uma *conta a pagar* (valor, empresa, vencimento).
- **Linha digitável / código de barras**: colar a linha ou ler o código com a câmera; valor, vencimento e banco saem do próprio código (atenção ao fator de vencimento, que recomeçou em 1000 em 22/02/2025; contas de consumo, iniciadas por 8, não trazem vencimento).
- **Tela “Contas a pagar”**: lista por vencimento (hoje, próximos dias, atrasadas), baixa automática quando chega “boleto pago” ou o extrato é importado, “Adicionar à agenda” com alarme e entrada na previsão do mês.
