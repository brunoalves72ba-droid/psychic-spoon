# Documentação da Formação IA — como o app é e como recriá-lo exatamente

Esta pasta descreve o app **Formação IA Generativa** exatamente como ele está publicado em
`https://brunoalves72ba-droid.github.io/psychic-spoon/formacao-ia/` (estado de 16/11/2026, depois do pull request #16).
Com ela e o repositório, qualquer pessoa ou IA consegue reconstruir o app idêntico, entender cada regra e mudar
uma parte sem quebrar as outras.

**Proprietário único e exclusivo:** Bruno Moura. Uso pessoal; código sem licença de distribuição (`UNLICENSED`).

## A regra de ouro para recriar “exatamente”

1. **O conteúdo e os arquivos de mídia não se reescrevem: copiam-se.** As 98 lições (`js/data/m*.js`), as fotos
   (`assets/fotos`), as fontes (`assets/fonts`), o Python embutido (`assets/micropython`), os ícones (`assets/icons`)
   e os **98 áudios já gerados** (`audio/aula-*.mp3` + `audio/indice.json`) são a matéria-prima. Reaproveite-os como estão.
2. **O comportamento está descrito nestes documentos e conferido pelos testes.** Um app recriado só é igual quando
   `npm test` e os testes ponta a ponta passam (veja [09 · Testes](09-testes-e-qualidade.md)).
3. **Os números exatos vêm do código**, no [Inventário](INVENTARIO.md), gerado automaticamente (`npm run docs`).
   Se um documento escrito à mão e o inventário divergirem, vale o inventário (e o código).

## Ordem de leitura

| # | Documento | Para quê |
|---|---|---|
| 01 | [Visão geral](01-visao-geral.md) | O que o app é, para quem, princípios e estrutura de pastas |
| 02 | [Arquitetura](02-arquitetura.md) | Como o app inicia, roteador, estado, armazenamento, service worker, convivência com o Sexteto |
| 03 | [Conteúdo e dados](03-conteudo-e-dados.md) | Formato exato de lição, exercício, cartão, projeto, laboratório, foto, vídeo e áudio |
| 04 | [Regras e algoritmos](04-regras-e-algoritmos.md) | Revisão espaçada, semana que perdoa, andaime, XP, cronograma, conquistas, mesclagem |
| 05 | [Telas e fluxos](05-telas-e-fluxos.md) | O que cada tela mostra e faz, passo a passo |
| 06 | [Design e acessibilidade](06-design-e-acessibilidade.md) | Cores, fontes, componentes, modo PC/celular, regras de toque e de movimento |
| 07 | [Áudio, vídeo e mídia](07-audio-video-e-midia.md) | Gerador de voz neural, SSML, player por partes, vídeos, fotos, ícones |
| 08 | [Sincronização, backup e privacidade](08-sincronizacao-backup-e-privacidade.md) | Gist cifrado, mesclagem, backup em arquivo, o que nunca sai do aparelho |
| 09 | [Testes e qualidade](09-testes-e-qualidade.md) | Testes unitários e ponta a ponta, critérios de aceite |
| 10 | [Publicação e operação](10-publicacao-e-operacao.md) | GitHub Pages, ramos, pull requests, atualização no celular, custos |
| 11 | [Recriar do zero](11-recriar-do-zero.md) | Passo a passo completo, na ordem certa, com a checklist final |
| — | [Inventário (gerado)](INVENTARIO.md) | Cada arquivo, rota, lição, áudio, foto, cor, constante e script |

Documentos irmãos, na pasta `formacao-ia/`: [`AUDIO.md`](../AUDIO.md) (gerar a voz no seu computador),
[`CREDITOS.md`](../CREDITOS.md) (fontes, fotos, licenças), [`PROGRESSO.md`](../PROGRESSO.md) (decisões e pendências),
[`QUIZ-PARA-REVISAR.md`](../QUIZ-PARA-REVISAR.md) (as 293 perguntas).

## Manter a documentação em dia

- Mudou código ou conteúdo: rode `npm run docs` (regera o inventário) e `npm run precache`.
- `npm test` falha se o inventário ou a lista de pré-cache estiverem desatualizados — de propósito.
- Mudou uma regra (ex.: a escada de revisão): atualize também o documento escrito à mão correspondente.
