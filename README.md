# Sexteto

App web instalável (PWA) para aprender **harmonia vocal**, **técnica vocal** e **produção musical** cantando. Todo o texto é em português do Brasil e todo o som é sintetizado no aparelho.

**© Bruno Moura.** O único e exclusivo proprietário deste app é o usuário que o idealizou, Bruno Moura. Todos os direitos reservados.

- Sem framework, sem etapa de build e sem bibliotecas externas em tempo de execução: HTML, CSS e JavaScript em módulos ES.
- Funciona offline depois da primeira visita. Nenhuma requisição externa: fontes e fotos ficam na pasta do projeto.
- Seus dados e gravações ficam só no aparelho (IndexedDB). Sem login e sem analytics.

## O que tem

| Aba | Conteúdo |
|---|---|
| **Início** | Torre das seis vozes (Cmaj13), roteiro do dia e dias seguidos. |
| **Harmonia** | 16 aulas (texto, experimento, cantar, perguntas), estúdio de acordes, imersão em tela cheia, “cante a sua voz”, treino de ouvido adaptativo, metrônomo, ritmo, partitura, teclado MIDI e glossário. |
| **Voz** | Respiração guiada, aquecimento na sua extensão, afinação, dicas, **técnicas para tirar a voz da garganta** (nove técnicas com autodiagnóstico, passo a passo, erro comum, exemplos e melodia-guia para ouvir), medidor de registro vocal e retrato vocal. |
| **Estúdio** | Curso de 23 lições com fotos reais e 27 simuladores, mesa virtual de seis canais com missões, gravador multipista e o projeto “Do zero ao master”. |
| **Evolução** | Histórico com gráficos, calendário de prática, marcos, comparação de retratos e backup. |

## Outro app neste repositório

A pasta [`formacao-ia/`](formacao-ia/README.md) tem um segundo app, independente: **Formação IA Generativa**, a trilha de estudo de IA generativa em micro-lições. Ele tem service worker e dados próprios; o service worker do Sexteto ignora essa pasta.

## Rodar localmente

Precisa só do [Node.js](https://nodejs.org) 18 ou mais novo (ou de qualquer servidor de arquivos estáticos).

```bash
npm start            # serve em http://localhost:8080
# ou, sem Node:
python3 -m http.server 8080
```

Abra `http://localhost:8080` no navegador.

> **O microfone só funciona em `https://` ou em `localhost`.** Abrir o arquivo direto (`file://`) ou acessar pelo IP da rede local em `http://` não libera o microfone nem o modo offline. Para testar no celular antes de publicar, use um túnel https ou publique em um dos serviços abaixo.

## Testes

```bash
npm install          # só ferramentas de teste
npm test             # testes unitários (altura, teoria, arranjos, LUFS, gravador…)
npm run e2e          # percorre o app no Chromium a 390×844 com microfone falso
npm run e2e:offline  # instala o service worker, corta a rede e confere tudo offline
```

O teste ponta a ponta usa o Playwright (instale com `npm i -D playwright && npx playwright install chromium` se a sua máquina não tiver). As capturas ficam em `tests/e2e/shots/`.

**Depois de mudar qualquer arquivo do app, rode `npm run precache`.** Esse comando regera `sw-assets.js` (a lista do pré-cache e a versão). Sem isso, quem já instalou o app não recebe a mudança, e o `npm test` falha de propósito para lembrar.

## Publicar

O app é uma pasta de arquivos estáticos. Publique a **raiz do repositório**, sem comando de build. Todos os serviços abaixo entregam em https, que é o que o microfone e a instalação exigem.

### GitHub Pages
1. No repositório: **Settings › Pages**.
2. Em *Build and deployment*, escolha **Deploy from a branch**, a branch desejada e a pasta **/ (root)**.
3. Salve. O endereço será `https://<usuário>.github.io/<repositório>/`.

Os caminhos do app são relativos, então ele funciona dentro da subpasta do repositório.

### Netlify
1. *Add new site › Import an existing project* e escolha o repositório.
2. *Build command*: vazio. *Publish directory*: `.`
3. *Deploy*.

### Cloudflare Pages
1. *Workers & Pages › Create › Pages › Connect to Git*.
2. *Framework preset*: None. *Build command*: vazio. *Build output directory*: `/`
3. *Save and Deploy*.

## Instalar no celular

### Android (Chrome)
1. Abra o endereço https do app.
2. Toque no menu **⋮** e em **Instalar app** (ou **Adicionar à tela inicial**).
3. Abra pelo ícone. Na primeira vez em que usar o microfone, toque em **Permitir**.

### iPhone (Safari)
1. Abra o endereço https do app **no Safari**.
2. Toque em **Compartilhar** (quadrado com seta) e em **Adicionar à Tela de Início**.
3. Abra pelo ícone e permita o microfone quando o app pedir.

No iPhone não existem Web MIDI, vibração nem tela sempre acesa pelo navegador em todas as versões; o app detecta e segue sem eles. A tela **Ajustes** mostra o que o seu aparelho oferece.

## Suas fotos no curso

Coloque fotos suas em `assets/img/minhas/` com o nome da foto que quer substituir (`mesa.jpg`, `canal.webp`, `dinamico.jpg`…) e rode `npm run precache`. Elas passam a ter prioridade. A lista de nomes está em `assets/img/minhas/LEIA-ME.txt`.

## Estrutura

```
index.html, manifest.webmanifest, sw.js, sw-assets.js
css/app.css
js/app.js                roteador (#/secao/pagina → js/views/secao-pagina.js)
js/core/                 interface, armazenamento, widgets, laboratórios, simuladores, mesa
js/audio/                motor de áudio, detecção de altura, microfone, LUFS, mesa, gravador
js/music/                teoria, arranjos, treino de ouvido
js/data/                 aulas, lições, glossário, fotos
js/views/                uma tela por arquivo
assets/                  fontes (OFL), ícones e fotos (WebP)
tests/                   testes unitários e ponta a ponta
tools/                   servidor local, pré-cache, gerador da voz falsa de teste
```

## Documentos

- `PROGRESSO.md` — o que foi feito, decisões e como continuar.
- `TESTES-NO-CELULAR.md` — roteiro do que conferir no aparelho de verdade.
- `CREDITOS.md` — fotos, fontes, músicas e normas.
- `IMAGENS-PENDENTES.md` — fotos que podem ser melhoradas.
