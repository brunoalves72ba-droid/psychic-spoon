# Finanças

App web instalável (PWA) para controlar o dinheiro do dia a dia: anote o que entra e o que sai em poucos segundos e veja **quanto está gastando e com o quê**.

**© Bruno Moura.** Todos os direitos reservados.

- Sem conta, sem servidor e sem internet: os dados ficam só no aparelho (`localStorage`).
- Funciona offline depois da primeira visita. HTML, CSS e JavaScript puros, sem build.

## O que tem

| Aba | O que faz |
|---|---|
| **Minhas** | As contas de quem usa este celular (Conta Bruno ou Conta Rita), privadas e compartilhadas. Quanto entrou, saiu e sobrou no mês; gasto médio por dia e previsão para o fim do mês; comparação com o mês anterior; gastos por categoria (toque para ver no extrato); gráfico dos últimos 6 meses (com tabela). |
| **Casal** | Só o que cada um compartilhou, igual nos dois celulares: total, quem pagou, para onde foi, divisão proporcional à renda (definida à mão), acerto do mês com “Marcar como acertado”, metas do casal e o total (sem detalhes) dos gastos pessoais de cada um. Cada gasto compartilhado diz **de quem é**: **dos dois** (dividido no acerto), **só meu** (o outro vê, mas fica fora do acerto) ou **só do outro** (quem pagou recebe tudo de volta). O app reconhece pela descrição o que foi escolhido da última vez. |
| **Importar** | Lê o extrato da conta ou a fatura do cartão em **OFX, CSV ou PDF** (Nubank, Itaú, Bradesco, BB, Caixa, Santander, Inter…). PDF com senha: o app pede a senha. PDF escaneado (imagem) não dá para ler. Mostra uma prévia: sugere a categoria (iFood → Restaurante, Uber → Transporte… e aprende com as suas escolhas), não duplica o que já foi importado, reconhece o que você já anotou à mão e deixa de fora pagamento de fatura, aplicações e transferências entre contas. Dá para desfazer. |
| **A classificar** | O que o app não reconhece (cai em “Outras despesas” ou “Outras entradas” sem você escolher) fica **pendente, em amarelo**: na prévia da importação, que abre só com esses (os identificados ficam num resumo e entram como estão), no Extrato (filtro **A classificar**, com a escolha da conta ali mesmo), na caixa A confirmar e num aviso no Resumo. Ao classificar, o lançamento sai da lista, os outros com a mesma descrição vão junto e o app aprende para as próximas vezes. |
| **Ticket Alimentação / Refeição** | O crédito do benefício entra como **entrada** nas contas **Ticket Alimentação** ou **Ticket Refeição** (pode ser recorrente) e as compras usam as formas de pagamento de mesmo nome. A frase rápida entende “caiu o VA 800”, “mercado 120 no ticket” (sem dizer qual: refeição para comida pronta, alimentação para o resto) e “almoço 42 no VR”; as notificações de Alelo, Ticket, Pluxee/Sodexo, VR, Flash, Caju e Swile saem com o ticket certo. O Resumo mostra o saldo de cada ticket no mês (entrou, gasto e sobra). |
| **Extrato** | Lançamentos agrupados por dia, com busca (sem acento, aceita valor), filtro por categoria e por entrada/saída. Toque num item para editar ou apagar. |
| **Lançar** | **Lançamento rápido**: escreva “uber 23,50 ontem no pix” e o app preenche valor, conta, data e forma de pagamento. A conta é **reconhecida pela descrição** (o que você ensinou → lançamentos anteriores → palavras conhecidas) e o app mostra por quê. Valor estilo caixa eletrônico (só digitar os números), categoria em um toque, descrição com sugestões, data, forma de pagamento e **repetir todo mês** para contas fixas. Dá para desfazer. |
| **Metas** | Limite mensal por categoria, com aviso perto do limite (80%) e quando passa; quanto ainda dá para gastar por dia; lista das contas fixas do mês. |
| **Recorrências** | Em Mais › Recorrências: **entradas recorrentes** (salário, pró-labore, aluguel recebido, complemento de receita…) e **despesas recorrentes** (aluguel, internet, assinaturas…) separadas, com o total de cada lado, a **sobra fixa** do mês, o que já entrou ou saiu neste mês e o que ainda falta. Toque numa recorrência para mudar valor, dia, descrição, conta e forma de pagamento (vale dos próximos meses em diante e, se você não mexeu, também no lançamento deste mês), encerrar ou apagar. O app sugere tornar recorrente o que se repete há 3 meses com o mesmo valor, seja gasto ou entrada. |
| **Plano de contas** | Contas organizadas em grupos (Moradia, Alimentação, Transporte, Saúde…). **Sugestões de preenchimento** a partir dos seus gastos: criar contas mais específicas (ex.: “Academia”, “Combustível”, “Streaming”) movendo os lançamentos, classificar descrições repetidas que o app não reconhece (e ele aprende), e transformar gastos que se repetem todo mês em conta fixa. Fica em Ajustes › Plano de contas, e o Resumo avisa quando há sugestões. |
| **Ajustes** | Tema claro/escuro, cópia de segurança (salvar e restaurar `.json`), planilha `.csv` para Excel/Google Planilhas e apagar tudo. |

### Dois celulares (Conta Bruno e Conta Rita)

Em **Mais › Conectar celulares**: no primeiro celular, cole uma chave do GitHub (permissão só de “gist”); no segundo, aponte a câmera para o QR code. Os dados vão **cifrados** (AES-GCM, chave derivada da chave de acesso) para um Gist secreto e são juntados sem perder nada (`js/core/mesclar.js`: a versão mais nova de cada item vence e o que foi apagado deixa uma lápide). A caixa A confirmar é de cada celular e não viaja. `npm run e2e:casal` simula os dois celulares com um GitHub de mentira.

### Plano de contas pessoal

Adaptado da lista de validação do Bruno (`js/core/plano.js`): grupos de moradia, reforma (hidráulica, elétrica, teto…), empregados domésticos (DAE/eSocial), impostos e taxas, financeiro e seguros, patrimônio e transferências. Pagamento de fatura, transferência entre contas e aplicação/resgate ficam **fora dos totais**, para nada ser contado duas vezes. Nas entradas, **Devoluções** (devolução, estorno, compra cancelada) fica separada de **Reembolsos e cashback**, e há **Complemento de receita** (complemento, ajuda de custo, auxílio). Quem já usava o app recebe essas contas sozinho (plano de contas versão 3).

### Extratos em PDF

O PDF é lido no próprio aparelho com o **pdf.js** (Mozilla, Apache 2.0, em `js/vendor/pdfjs/`, carregado só quando você escolhe um PDF). Cada banco monta o PDF de um jeito; o leitor (`lerPDF` em `js/core/importar.js`):

- procura, linha a linha, uma data no começo e um valor em reais;
- usa a posição das colunas **Valor**, **Crédito**, **Débito** e **Saldo** quando o cabeçalho aparece, e ignora o saldo;
- aceita a data só na primeira linha do dia, cabeçalhos de dia com “Total de entradas/saídas” (Nubank) e descrição em duas linhas;
- deduz o ano das datas curtas (`15/12`, `15 DEZ`) pela data completa mais recente do documento (fatura que vence em janeiro);
- ignora valores em dólar e linhas de saldo, total, limite e vencimento.

O que vem sem indicação clara de entrada ou saída aparece marcado com “confira”, e todo lançamento lido de PDF tem o botão **trocar entrada/saída** na prévia. OFX e CSV continuam mais exatos. Os PDFs de exemplo (`tests/exemplos/*.pdf`, fictícios) são gerados por `npm run exemplos-pdf`; `npm run e2e:pdf` importa todos pela tela, inclusive com senha e sem internet. **Testado só com esses exemplos**: os PDFs reais de cada banco podem trazer surpresas.

### Por que importar arquivo e não Open Finance?

Para a pessoa, o Open Finance é gratuito. Mas um app só acessa o Open Finance sendo instituição autorizada pelo Banco Central ou por meio de um agregador (Pluggy, Belvo…), que cobra de quem desenvolve (na casa de milhares de reais por mês) e exige um servidor guardando a chave de acesso, com os dados bancários passando por terceiros. A importação de OFX/CSV é gratuita, funciona com praticamente todos os bancos e mantém tudo só no aparelho.

Contas fixas (salário, aluguel, internet…) entram sozinhas no dia do vencimento de cada mês. Apagar um mês não faz ele voltar; “Parar de repetir” encerra a conta sem mexer no que já foi lançado.

## Rodar

```bash
cd financas
npm start            # http://localhost:8091
npm test             # testes dos cálculos
npm run e2e          # percorre o app no Chromium em tela de celular (capturas em tests/e2e/shots/)
npm run e2e:pdf      # importa os extratos em PDF de exemplo pela tela
```

Depois de mudar qualquer arquivo do app, rode `npm run precache` (regera `sw-assets.js` e a linha de versão do `sw.js`; sem isso, quem já instalou não recebe a mudança e o `npm test` falha de propósito).

### Atualização no celular

O app instalado procura versão nova sempre que é aberto ou volta para a tela. Quando termina de baixar, aparece o aviso **“Nova versão do app disponível — Atualizar”**. Os dados ficam no aparelho e não mudam com a atualização. `npm run e2e:atualizacao` simula esse caminho no Chromium.

## Publicar e instalar

Publicando a raiz do repositório (GitHub Pages, Netlify ou Cloudflare Pages, como no README principal), o app fica em `…/financas/`. No celular, abra esse endereço e use **Instalar app** (Android/Chrome) ou **Compartilhar › Adicionar à Tela de Início** (iPhone/Safari).

**Faça uma cópia de segurança de vez em quando** (Ajustes › Salvar cópia): se os dados do navegador forem apagados ou você trocar de aparelho, é ela que traz tudo de volta.

## Estrutura

```
index.html, manifest.webmanifest, sw.js, sw-assets.js
css/app.css
js/app.js              roteador (#/secao → js/views/secao.js)
js/core/plano.js       grupos, contas sugeridas, reconhecimento, lançamento rápido e sugestões do plano
js/core/importar.js    leitura de OFX/CSV/PDF, categorias automáticas, deduplicação
js/core/pdf.js         texto e posição das linhas do PDF (pdf.js), PDF com senha
js/vendor/pdfjs/       pdf.js 5.4.624 (Mozilla, Apache 2.0)
js/core/calc.js        cálculos puros (resumo, categorias, previsão, metas, recorrentes, CSV)
js/core/store.js       armazenamento local
js/core/dinheiro.js    valores em centavos e formatação em reais
js/core/datas.js       datas e meses sem fuso
js/core/ui.js          avisos, diálogos, navegação de mês
js/views/              uma tela por arquivo
tests/                 unitários e ponta a ponta (tests/exemplos: extratos de exemplo)
tools/                 servidor local e gerador do pré-cache
```
