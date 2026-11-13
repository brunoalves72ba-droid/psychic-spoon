# Formação IA Generativa

App web instalável (PWA) para estudar a trilha de IA generativa (96 h de ementa, cerca de 120 h no app), pensado para **quem começa do zero** e para **quem tem TDAH**. Todo o texto é em português do Brasil.

**© Bruno Moura.** App pessoal e não oficial: não é afiliado à escola que oferece o curso nem às empresas citadas nas lições.

- Sem framework, sem etapa de build e sem bibliotecas externas em tempo de execução: HTML, CSS e JavaScript em módulos ES.
- Funciona offline depois da primeira visita, inclusive o Python embutido (MicroPython em WebAssembly).
- Os dados ficam só no aparelho (IndexedDB). Sem conta, sem servidor, sem analytics. Backup em arquivo JSON.

## O que tem

| Aba | Conteúdo |
|---|---|
| **Hoje** | Botão “Começar 5 min” com a próxima lição já carregada, retomada de onde parou, pergunta-relâmpago, escolha pela energia e pelo tempo, a semana (meta de 4 dias em 7, com 2 congelamentos) e avisos discretos. |
| **Trilha** | Mapa dos 7 módulos (M0 a M6) com o APE-IA crescendo; **98 micro-lições** de 5 a 10 min, sempre nos mesmos 7 passos; 14 laboratórios. |
| **Revisar** | Cartões que voltam em 1, 3, 7 e 21 dias (até 15 por dia), revisão misturada entre módulos, importação de cartões (CSV ou JSON) e a taxa de acerto medida aos 7 e aos 21 dias. |
| **Projeto** | O APE-IA (Assistente Pessoal de Estudos com IA): missões de 10 a 25 min por módulo, diário de bordo, ficha técnica, biblioteca de prompts com versões e rubrica, práticas pendentes, kits de código e modo foco. |
| **Progresso** | Lições, entregas, memória, calendário de 12 semanas, revisão da semana, desafio surpresa, conquistas, cronograma (Plano A ou B, recalculável), ficha viva, lembretes no calendário (.ics), “por que o app é assim”, ajustes e backup. |

Cada micro-lição: **gancho → ideia com analogia → exemplo resolvido → exercício → quiz → erro comum de iniciante → fim**, com o próximo passo já carregado. Os exercícios são de 9 tipos (classificar, ordenar, lacunas com andaime que diminui, escolha, JSON, texto com critérios, laboratório, Python com testes, reflexão), sempre com resposta na hora.

## Rodar localmente

Precisa só do [Node.js](https://nodejs.org) 18 ou mais novo (ou de qualquer servidor de arquivos estáticos).

```bash
cd formacao-ia
npm start            # serve em http://localhost:8090
```

## Testes

```bash
npm test             # 141 testes: motores, conteúdo (98 lições), Python das lições, laboratórios
npm run e2e          # 60 cenários no Chromium a 390×844 (use --dark para o tema escuro)
npm run e2e:offline  # instala os service workers, corta a rede e confere tudo, convivendo com o Sexteto
```

O teste ponta a ponta usa o Playwright. **Depois de mudar qualquer arquivo do app, rode `npm run precache`**: ele regera `sw-assets.js` (a lista do pré-cache e a versão). O `npm test` falha de propósito se ela estiver desatualizada.

## Publicar

O app é uma pasta de arquivos estáticos e pode morar na mesma publicação do Sexteto: no GitHub Pages, o endereço fica `https://<usuário>.github.io/<repositório>/formacao-ia/`. Cada app tem o seu service worker; o do Sexteto ignora a pasta `formacao-ia/`. Se alguém abrir este app com um Sexteto antigo instalado, o próprio app instala o seu service worker e recarrega.

Os caminhos são relativos: também funciona publicado sozinho (Netlify, Cloudflare Pages), apontando para a pasta `formacao-ia`.

## Estrutura

```
index.html, manifest.webmanifest, sw.js, sw-assets.js
css/app.css              tokens claro/escuro, fontes Atkinson Hyperlegible (legibilidade)
js/app.js                roteador (#/secao/pagina → js/views/secao-pagina.js)
js/core/                 estado, armazenamento, revisão espaçada, sequência semanal, andaime, plano,
                         JSON em português, algoritmos de texto (tokens, softmax, chunking, TF-IDF), exercícios
js/data/                 as 98 lições (m0 … m6c), projeto, recursos, ficha viva, desafios, laboratórios
js/labs/                 14 laboratórios e o Python de bolso (MicroPython num Web Worker)
js/views/                uma tela por arquivo
kits/                    código Python dos projetos dos Módulos 3, 5 e 6
assets/                  fontes (OFL), ícones, MicroPython (MIT)
tests/                   unitários e ponta a ponta
```

## Documentos

- `PROGRESSO.md`: o que foi feito, decisões e como continuar.
- `CREDITOS.md`: fontes, MicroPython e as bases científicas.
