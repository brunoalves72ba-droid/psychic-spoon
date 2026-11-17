# 11 · Recriar do zero

Há dois caminhos. Escolha conforme o objetivo.

## Caminho A — cópia idêntica (minutos)

O app é o conteúdo da pasta `formacao-ia/`. Para ter **exatamente** o mesmo app em outro lugar:

1. Copie a pasta `formacao-ia/` inteira (com `audio/`, `assets/`, `kits/`, `js/`, `css/`, `tools/`, `tests/`, `docs/`).
2. Publique a pasta num site estático com HTTPS (GitHub Pages, Netlify, Cloudflare Pages). Endereço próprio
   (ex.: `…/formacao-ia/`); se houver outros apps no mesmo domínio, respeite as regras de convivência do capítulo 02.
3. Confira com a checklist do fim desta página.

## Caminho B — reconstrução (outra pessoa, outra IA ou outra tecnologia)

Siga a ordem abaixo. Cada etapa tem a referência do que copiar e do que reescrever, e termina com um teste.

### 0. Ferramentas
Node.js 18+, Git, um editor; Playwright + Chromium para os testes de tela; `ffmpeg` (opcional, testes de áudio).

### 1. Matéria-prima (copiar, não reescrever)
- `js/data/` inteiro (lições `m0.js`…`m6c.js`, `curso.js`, `projeto.js`, `labs.js`, `fotos.js`, `ficha.js`, `recursos.js`,
  `desafios.js`, `videos.js`).
- `assets/` (fontes com licenças OFL, ícones, 22 fotos, MicroPython `micropython.mjs` + `.wasm`).
- `audio/` (98 MP3 + `indice.json`) e `kits/`.
- `CREDITOS.md` (créditos obrigatórios das fotos e fontes).

### 2. Casca do app
- `index.html` (capítulo 02), `manifest.webmanifest` (Inventário › Manifesto), `css/app.css` (capítulo 06 + Inventário › Design).
- Teste: abrir `npm start` e ver as 6 abas, nos temas claro e escuro.

### 3. Núcleo sem tela (funções puras primeiro)
`dia.js` → `store.js` → `srs.js` → `sequencia.js` → `andaime.js` → `plano.js` → `json-pt.js` → `texto.js` →
`mesclar.js` → `cortes.js` → `estado.js` → `conquistas.js` → `plataforma.js` → `nuvem.js` → `instalar.js` → `audio.js`
→ `ui.js` → `exercicios.js` → `biblioteca.js`, `pensamento.js`, `fotos.js`, `robo.js`.
Regras exatas: capítulo 04. Teste: `node --test tests/motores.test.mjs tests/sync.test.mjs tests/audio.test.mjs`.

### 4. Roteador e telas
`js/app.js` (capítulo 02) e as telas de `js/views/` (capítulo 05; lista no Inventário). Comece por Hoje, Trilha, Lição,
Revisar; depois Projeto, Progresso, Ajustes e subtelas. Teste: `npm run e2e`.

### 5. Laboratórios e Python
`js/labs/*.js` (um por laboratório) e o Python em Worker com limite de 4 s (capítulo 03). Teste:
`node --test tests/labs.test.mjs tests/python.test.mjs`.

### 6. Funcionar sem internet
`sw.js` + `tools/gen-precache.mjs` (`sw-assets.js`), cache `fia-audio` para os MP3. Teste: `npm run e2e:offline`.

### 7. Áudio e vídeo
Player por partes e cortes (capítulo 07). Gerador de voz em `tools/audio/` (só se for gerar áudio novo). Teste:
`npm run e2e:audio`.

### 8. Sincronização e backup
Capítulo 08. Teste: `npm run e2e:sync`.

### 9. Documentação e publicação
`npm run docs` (inventário), `npm run precache`, `npm test`; publicar (capítulo 10).

## Checklist final (o app está igual quando tudo isto é verdade)

**Conteúdo e números**
- [ ] 7 módulos, 16 aulas, **98 lições**, 293 perguntas/cartões, 73 práticas (43 no PC), 32 missões, 14 laboratórios,
      14 desafios, 22 fotos, 98 áudios — conferir no Inventário gerado.
- [ ] Em todo quiz, a 1ª opção do arquivo é a certa e a tela embaralha.

**Comportamento**
- [ ] Lição com 7 passos tocáveis; voltar não apaga respostas; relógio só avisa; fim mostra a próxima lição pronta.
- [ ] Cartões voltam em 1, 3, 7, 21, 60, 120 dias; teto 15/dia; errei → amanhã; difícil → repete; lembrei → sobe.
- [ ] Meta 4 dias em 7, 2 congelamentos, primeira semana nunca falha; dias seguidos e dias estudados na tela Hoje.
- [ ] Andaime sobe com ≥ 80% de acerto de primeira e desce com ≤ 34% (mínimo 3, janela 5).
- [ ] XP: quiz 5, exercício 10, lição 20 (revisita 5), cartão 2, mistura 3, mão na massa 15, item de missão 10,
      missão 50, revisão semanal 20, diário 5, desafio 30; nível a cada 250.
- [ ] Check-in de energia sugere até 3 tarefas; no celular, nada que precise de PC.
- [ ] Áudio: toca só a parte do passo aberto, começa sozinho, para no fim da parte, 1,25x padrão; some no exercício,
      no quiz e no fim; aula sem MP3 mostra só o texto.
- [ ] Vídeo do YouTube aparece no topo quando configurado em `videos.js`.
- [ ] Sincronização por Gist secreto cifrado (AES-GCM, PBKDF2 150.000) e mesclagem sem perdas; backup sem o token.
- [ ] Modo PC (menu lateral, duas colunas, teclado) e celular (abas embaixo).
- [ ] Funciona sem internet depois da primeira visita; atualização com o aviso “Nova versão do app pronta”.
- [ ] Instala como app próprio, separado do Sexteto, com o ícone do balão de fala.

**Qualidade**
- [ ] `npm test` passa; `npm run e2e`, `e2e:pc`, `e2e:offline`, `e2e:sync` e `e2e:audio` passam.
- [ ] Nenhum alvo de toque menor que 44 px; nenhum “null/undefined/NaN” na tela; nenhuma chamada externa sem pedido.
