# Limpa Fotos

App web instalável (PWA) para fazer faxina nas fotos: elas aparecem uma por vez e você **arrasta para a esquerda para apagar** ou **para a direita para manter**.

**© Bruno Moura.** Todos os direitos reservados.

- Nada sai do aparelho: sem conta, sem servidor e sem internet. HTML, CSS e JavaScript puros, sem build.
- Nada é apagado na hora do arraste. No fim (ou quando quiser, em **Revisar**) você vê a grade das fotos marcadas, toca nas que quer salvar e só então confirma.

## Como usar

| Gesto | O que faz |
|---|---|
| Arrastar para a **esquerda** (ou botão ✕, ou tecla ←) | Marca para apagar |
| Arrastar para a **direita** (ou botão ♥, ou tecla →) | Mantém |
| **↶ Desfazer** (ou Ctrl+Z / Backspace) | Volta uma foto |
| **Revisar** | Grade das fotos marcadas; toque numa para mantê-la; **Apagar N** confirma |

As fotos aparecem das mais novas para as mais antigas. Subpastas entram também.

## O que cada aparelho deixa fazer

Um site só consegue apagar arquivos onde o navegador oferece acesso a pastas (File System Access API):

| Onde | Apaga de verdade? |
|---|---|
| **Chrome ou Edge no computador** (Windows, Mac, Linux, Chromebook) | **Sim.** Escolha a pasta (ex.: as fotos do celular copiadas para o PC, ou a pasta do Google Fotos/OneDrive sincronizada). Os arquivos são apagados de vez, **sem passar pela lixeira**. |
| Chrome no Android | Depende da versão: se aparecer o botão “Escolher pasta de fotos”, apaga. Se não, funciona como abaixo. |
| iPhone (Safari) e Firefox | **Não.** Você escolhe as fotos e faz a triagem, e o app baixa `fotos-para-apagar.txt` com os nomes para apagar na Galeria. |

Para apagar direto da Galeria do celular (Android ou iPhone) seria preciso um app nativo; os navegadores não dão esse acesso a sites.

## Rodar

```bash
cd fotos
npm start        # http://localhost:8092
npm test         # testes da lógica + confere o pré-cache
npm run e2e      # percorre o app no Chromium com uma pasta de fotos de mentira (capturas em tests/e2e/shots/)
```

**Depois de mudar qualquer arquivo do app, rode `npm run precache`**, para quem já instalou receber a versão nova.

## Estrutura

```
index.html, manifest.webmanifest, sw.js, sw-assets.js
css/app.css
js/app.js            telas, arraste, revisão e exclusão
js/core/fila.js      lógica da triagem (decidir, desfazer, revisar, resumo) — testada em tests/fila.test.mjs
assets/icons/        ícones
tools/               servidor local e gerador do pré-cache
```
