# Áudio das aulas com voz neural — guia

O app não usa mais a voz do aparelho. Cada aula ganha um **MP3 gerado uma única vez** no seu computador, com voz neural do Google (ou do ElevenLabs), e o app só toca esse arquivo. A aula sem MP3 continua aparecendo normalmente, só com o texto.

## 1. Criar a conta no Google Cloud e a chave (uma vez só)

1. Entre em **https://console.cloud.google.com** com a sua conta Google e aceite os termos.
2. No topo, clique no seletor de projeto › **Novo projeto**. Nome: `formacao-ia-audio` › **Criar**. Confira se ele ficou selecionado.
3. **Faturamento:** menu ☰ › **Faturamento** › **Vincular uma conta de faturamento** (ou criar uma). O Google pede um cartão mesmo para usar a parte gratuita. Conta nova costuma ganhar créditos de avaliação: veja o valor e o prazo na tela de cadastro.
4. **Ativar a API:** menu ☰ › **APIs e serviços** › **Biblioteca** › procure **Cloud Text-to-Speech API** › **Ativar**.
5. **Criar a chave:** **APIs e serviços** › **Credenciais** › **Criar credenciais** › **Chave de API**. Copie a chave.
6. **Proteger a chave** (importante): na mesma tela, clique na chave › **Restrições de API** › **Restringir chave** › marque só **Cloud Text-to-Speech API** › **Salvar**. Assim, mesmo que alguém veja a chave, ela não serve para mais nada.

## 2. Quanto custa e como não ser cobrado

- O Google cobra por **caractere enviado** (as marcações SSML entram na conta). O curso inteiro dá cerca de **300 mil caracteres com SSML** (180 mil de fala), uma vez só. Rode `npm run audio:simular` para ver o número exato antes de gastar.
- **Faixa gratuita por mês** (confira na página oficial, porque muda: https://cloud.google.com/text-to-speech/pricing). Pelo que encontrei em novembro de 2026: vozes **Standard e WaveNet**, 4 milhões de caracteres grátis por mês; **Chirp 3 HD**, 1 milhão grátis por mês; para a **Neural2** as fontes não batem (há quem diga 1 milhão grátis, e o preço depois disso é de cerca de US$ 16 por milhão). Em qualquer caso, o curso inteiro cabe com folga numa faixa de 1 milhão. Se por acaso tudo fosse cobrado, daria uns US$ 5.
- **Alerta de orçamento** (faça antes de gerar): menu ☰ › **Faturamento** › **Orçamentos e alertas** › **Criar orçamento** › escopo: o projeto `formacao-ia-audio` › valor: **R$ 5** (ou US$ 1) › alertas em **50%, 90% e 100%** › marque “enviar alertas por e-mail aos administradores” › **Concluir**.
- O alerta **avisa, mas não bloqueia**. Para ter certeza de que nada mais será cobrado depois de gerar o áudio: **APIs e serviços › Credenciais › apague a chave** (ou desative a API em **APIs e serviços › Cloud Text-to-Speech API › Desativar**). Para gerar de novo no futuro, é só criar outra chave.
- O gerador **pula as aulas que já têm áudio**, então rodar de novo não gasta nada à toa.

## 3. Gerar o áudio no seu computador

Precisa do **Node.js 18 ou mais novo** (https://nodejs.org, versão LTS) e do repositório no computador (pelo GitHub Desktop: **File › Clone repository**).

1. Na pasta `formacao-ia/tools/audio/`, copie `.env.exemplo` para um arquivo chamado **`.env`** e cole a chave em `GOOGLE_TTS_API_KEY=`. O `.env` está no `.gitignore`: ele nunca vai para o GitHub nem para o app.
2. Abra o terminal na pasta `formacao-ia` e rode:
   - `npm run audio:simular` — não gasta nada: mostra quantos caracteres vão ser enviados e grava em `audio/ssml/` como cada aula vai ser lida (para conferir).
   - `npm run audio -- --aula 0.1` — gera só a primeira aula, para ouvir e aprovar a voz (`audio/aula-0.1.mp3`).
   - `npm run audio` — gera todas as que faltam. No fim mostra quantos caracteres foram usados e atualiza a lista de arquivos do app.
3. Publique: no GitHub Desktop, faça o commit da pasta `formacao-ia/audio` (mensagem: “Áudio das aulas”) e **Push**. Em 2 ou 3 minutos o player aparece nas aulas.

**Trocar a voz:** em `.env`, mude `GOOGLE_VOZ` (ex.: `pt-BR-Neural2-B`, voz masculina) e rode `npm run audio -- --refazer`. As vozes **Neural2** e **WaveNet** aceitam todas as pausas e marcações. As **Chirp 3 HD** (ex.: `pt-BR-Chirp3-HD-Aoede`) soam ainda mais naturais, mas o Google não aceita nelas as pausas com tempo exato nem os títulos mais lentos: o gerador tira essas marcações sozinho e calcula os capítulos pela posição no texto.

**Trocar para o ElevenLabs:** em `.env`, `PROVEDOR=elevenlabs`, `ELEVENLABS_API_KEY=` e `ELEVENLABS_VOZ_ID=` (o ID da voz aparece na biblioteca de vozes do ElevenLabs). As pausas viram `<break time="1.0s" />`, que o ElevenLabs entende.

## Como a leitura é montada (SSML)

`tools/audio/ssml.mjs` e `tools/audio/falado.mjs`, sem mudar nada do texto da tela:
- pausa de ~600 ms entre parágrafos, ~1 s antes de cada título e entre os tópicos (Ideia, Exemplo, Erro comum);
- títulos um pouco mais devagar (88%); listas lidas item por item (“Primeiro: …”, “Segundo: …”) com pausa entre eles;
- dinheiro (R$ 1.234,50 → “1.234 reais e 50 centavos”), porcentagem, datas, horas, ordinais (1º), unidades (GB, min), abreviações (ex., etc., vs.), setas e símbolos viram a forma falada;
- termos em inglês com a pronúncia ajustada (prompt, token, JSON, API…) e código em linha lido devagar (“choices item 0 ponto message”). Blocos de código não são lidos: a voz diz “o código está na tela”;
- marcas no começo de cada parte: o app mostra os capítulos **Começo · Ideia · Exemplo · Erro comum** no player.

## No app

- Player no topo da aula: play/pausa, barra de progresso (dá para arrastar), tempo, velocidades **1x, 1,25x e 1,5x** (a escolha fica guardada) e capítulos.
- O MP3 é baixado na primeira vez que você toca a aula e fica no aparelho. Em **Progresso › Ajustes › Áudio das aulas** dá para baixar todos de uma vez, para estudar sem internet.
- **Vídeo opcional:** em `js/data/videos.js`, acrescente `'0.1': 'https://youtu.be/…',` (pode ser vídeo “não listado”). O vídeo aparece no topo da aula; sem vídeo, nada muda.
