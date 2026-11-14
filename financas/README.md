# Finanças

App web instalável (PWA) para controlar o dinheiro do dia a dia: anote o que entra e o que sai em poucos segundos e veja **quanto está gastando e com o quê**.

**© Bruno Moura.** Todos os direitos reservados.

- Sem conta, sem servidor e sem internet: os dados ficam só no aparelho (`localStorage`).
- Funciona offline depois da primeira visita. HTML, CSS e JavaScript puros, sem build.

## O que tem

| Aba | O que faz |
|---|---|
| **Resumo** | Quanto entrou, saiu e sobrou no mês; gasto médio por dia e previsão para o fim do mês; comparação com o mês anterior; gastos por categoria (toque para ver no extrato); gráfico dos últimos 6 meses (com tabela). |
| **Importar** | Lê o extrato da conta ou a fatura do cartão em **OFX ou CSV** (Nubank, Itaú, Bradesco, BB, Caixa, Santander, Inter…). Mostra uma prévia: sugere a categoria (iFood → Restaurante, Uber → Transporte… e aprende com as suas escolhas), não duplica o que já foi importado, reconhece o que você já anotou à mão e deixa de fora pagamento de fatura, aplicações e transferências entre contas. Dá para desfazer. |
| **Extrato** | Lançamentos agrupados por dia, com busca (sem acento, aceita valor), filtro por categoria e por entrada/saída. Toque num item para editar ou apagar. |
| **Lançar** | Valor estilo caixa eletrônico (só digitar os números), categoria em um toque, descrição com sugestões, data, forma de pagamento e **repetir todo mês** para contas fixas. Dá para desfazer. |
| **Metas** | Limite mensal por categoria, com aviso perto do limite (80%) e quando passa; quanto ainda dá para gastar por dia; lista das contas fixas do mês. |
| **Ajustes** | Tema claro/escuro, criar/renomear/apagar categorias, cópia de segurança (salvar e restaurar `.json`), planilha `.csv` para Excel/Google Planilhas e apagar tudo. |

### Por que importar arquivo e não Open Finance?

Para a pessoa, o Open Finance é gratuito. Mas um app só acessa o Open Finance sendo instituição autorizada pelo Banco Central ou por meio de um agregador (Pluggy, Belvo…), que cobra de quem desenvolve (na casa de milhares de reais por mês) e exige um servidor guardando a chave de acesso, com os dados bancários passando por terceiros. A importação de OFX/CSV é gratuita, funciona com praticamente todos os bancos e mantém tudo só no aparelho.

Contas fixas (salário, aluguel, internet…) entram sozinhas no dia do vencimento de cada mês. Apagar um mês não faz ele voltar; “Parar de repetir” encerra a conta sem mexer no que já foi lançado.

## Rodar

```bash
cd financas
npm start            # http://localhost:8091
npm test             # testes dos cálculos
npm run e2e          # percorre o app no Chromium em tela de celular (capturas em tests/e2e/shots/)
```

Depois de mudar qualquer arquivo do app, rode `npm run precache` (regera `sw-assets.js`; sem isso, quem já instalou não recebe a mudança e o `npm test` falha de propósito).

## Publicar e instalar

Publicando a raiz do repositório (GitHub Pages, Netlify ou Cloudflare Pages, como no README principal), o app fica em `…/financas/`. No celular, abra esse endereço e use **Instalar app** (Android/Chrome) ou **Compartilhar › Adicionar à Tela de Início** (iPhone/Safari).

**Faça uma cópia de segurança de vez em quando** (Ajustes › Salvar cópia): se os dados do navegador forem apagados ou você trocar de aparelho, é ela que traz tudo de volta.

## Estrutura

```
index.html, manifest.webmanifest, sw.js, sw-assets.js
css/app.css
js/app.js              roteador (#/secao → js/views/secao.js)
js/core/importar.js    leitura de OFX/CSV, categorias automáticas, deduplicação
js/core/calc.js        cálculos puros (resumo, categorias, previsão, metas, recorrentes, CSV)
js/core/store.js       armazenamento local
js/core/dinheiro.js    valores em centavos e formatação em reais
js/core/datas.js       datas e meses sem fuso
js/core/ui.js          avisos, diálogos, navegação de mês
js/views/              uma tela por arquivo
tests/                 unitários e ponta a ponta (tests/exemplos: extratos de exemplo)
tools/                 servidor local e gerador do pré-cache
```
