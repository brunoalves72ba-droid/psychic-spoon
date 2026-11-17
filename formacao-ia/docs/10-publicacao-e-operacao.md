# 10 · Publicação e operação

## Onde está

- Repositório: `github.com/brunoalves72ba-droid/psychic-spoon` (pasta `formacao-ia/`).
- **Ramo publicado:** `claude/sexteto-vocal-harmony-app-brobms`. O GitHub Pages publica a **raiz** desse ramo
  (Settings › Pages › Deploy from a branch). Endereço do app:
  `https://brunoalves72ba-droid.github.io/psychic-spoon/formacao-ia/`.
- Mudanças chegam por pull request para o ramo publicado; o merge dispara o “pages build and deployment” (cerca de 1 min).

## Rodar no computador

```
cd formacao-ia
npm start            # http://localhost:8090 (tools/serve.mjs)
node tools/serve.mjs 8090 --raiz   # serve o repositório inteiro (Sexteto + este app), como no site
```

## Atualização no celular

- Cada mudança gera uma versão nova (hash em `sw-assets.js`). O app procura versão nova ao abrir, ao voltar para a tela e
  a cada 30 min, sem o cache de 10 minutos do GitHub Pages (`updateViaCache: 'none'`).
- Quando baixa, aparece “Nova versão do app pronta · Atualizar”. Em Ajustes › Sobre há “Procurar atualização” e a versão.
- Os dados ficam; só os arquivos do app mudam. O cache de áudio `fia-audio` também fica.
- Ícone novo no Android: o Chrome troca sozinho em até um dia (ou desinstalar e instalar de novo).

## Instalação

- Android: abrir o endereço no Chrome › ⋮ › Instalar app (ou o botão da tela Hoje / Ajustes › Instalar).
- iPhone: Safari › Compartilhar › Adicionar à Tela de Início.
- Manifesto: nome “Formação IA Generativa”, nome curto “Formação IA”, `id ./index.html?app=formacao-ia`, `scope ./`,
  `start_url ./index.html`, cor `#3138c9`, atalhos “Começar 5 min” e “Revisar cartões”.

## Publicar áudio novo

No computador: `npm run audio` (ou `-- --refazer`), depois commit da pasta `formacao-ia/audio` e de
`formacao-ia/sw-assets.js` no ramo publicado (GitHub Desktop: Commit + Push origin).

## Custos

- Hospedagem (GitHub Pages) e o app: gratuitos.
- Voz neural: Google Cloud Text-to-Speech, pago por caractere, com faixa/créditos gratuitos (o curso inteiro gastou
  ~220 mil caracteres). Recomendado: alerta de orçamento e apagar a chave depois de gerar (ver `AUDIO.md`).
- Sincronização: Gist do GitHub, gratuito.
