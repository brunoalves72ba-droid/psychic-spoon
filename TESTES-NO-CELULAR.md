# Testes no celular

O app foi testado em um navegador automatizado (Chromium a 390×844 e 360×740) com um **microfone falso** alimentado por um arquivo WAV. Isso confere a lógica, mas **não confere o som saindo do alto-falante nem um microfone de verdade**. Este roteiro lista o que só você consegue verificar no aparelho.

Marque cada item. Onde algo falhar, anote o aparelho, o navegador e o que aconteceu.

## Antes de começar

- [ ] O app está em um endereço **https** (ou `localhost`). Sem isso, o microfone não abre.
- [ ] Fones com fio à mão. Fones Bluetooth têm atraso grande: use só para ouvir, não para gravar.
- [ ] Volume do aparelho na metade.

## 1. Instalação e offline

- [ ] **Android/Chrome**: menu ⋮ › *Instalar app*. O ícone aparece com as seis barras coloridas, sem borda branca.
- [ ] **iPhone/Safari**: Compartilhar › *Adicionar à Tela de Início*. O app abre sem a barra do Safari.
- [ ] Com o app instalado, ligue o **modo avião** e abra de novo. Navegue pelas cinco abas, abra uma aula, uma lição com foto e a mesa.
- [ ] A barra de abas não fica escondida atrás da barra de gestos do sistema; o topo não fica sob o entalhe da câmera.
- [ ] Deite o celular: nada corta, e a mesa virtual mostra a visão geral dos seis canais.
- [ ] *Ajustes › Este aparelho*: anote o que aparece como “—” (recurso ausente).

## 2. Som (o que eu não consegui ouvir)

- [ ] **Início**: toque nas seis barras. O som começa no primeiro toque, sem estalo. Com as seis ligadas, soa um acorde cheio e agradável, não estridente.
- [ ] O timbre de **coro** parece voz (“uu”), com vibrato leve. O **piano** das guias é claro.
- [ ] Há **reverb** audível, sem embolar.
- [ ] Nada distorce com o volume do celular no máximo.
- [ ] Troque de tela ou bloqueie o aparelho com som tocando: **o som para**.
- [ ] **Imersão** (Aurora): os acordes trocam no tempo, sem atropelo nem buracos. Silenciar e isolar vozes funciona enquanto toca.
- [ ] **Metrônomo** a 60, 120 e 200 bpm: firme, sem falhar batida. No Android, a vibração acompanha o clique.
- [ ] Alto-falante do celular: o **baixo** é audível? (Em alto-falante pequeno ele some; com fones deve aparecer.)

## 3. Microfone e afinação

- [ ] Ao tocar em “Ligar microfone”, o sistema pede permissão. Negue uma vez: a mensagem explica o que fazer.
- [ ] **Voz › Afinação › Afinador**: cante uma nota firme. O nome da nota está certo (confira com um instrumento ou outro afinador) e o rastro é estável.
- [ ] Cante bem grave e bem agudo, e faça uma sirene: o rastro acompanha **sem pular de oitava**.
- [ ] Fique em silêncio: o afinador mostra “—”, não notas aleatórias.
- [ ] Com som ambiente (ventilador, TV baixa): ainda lê a sua voz?
- [ ] **Sem fones**, em “Cante a harmonia”: o app capta o próprio bordão? (É esperado; por isso ele pede fones.) **Com fones**, a leitura é só da sua voz.
- [ ] **iPhone**: depois de abrir o microfone, o volume do som do app cai ou muda de alto-falante? Anote.

## 4. Harmonia

- [ ] **Aula 1**: troque os intervalos e ouça. A 5ª justa soa estável e a 2ª menor, áspera.
- [ ] **Exercício de cantar** de uma aula: a barra enche quando você segura a nota certa, em qualquer oitava.
- [ ] **Estúdio de acordes**: silencie uma voz, ligue “Sustentar” e cante a nota que falta. O medidor de cents responde.
- [ ] **Cante a sua voz**: escolha a sua voz, 80% do andamento. A linha branca cai sobre a linha colorida quando você acerta. A pontuação parece justa?
- [ ] **Ouvido**: faça uma rodada de cada tipo. Os sons são claros o bastante para distinguir.
- [ ] **Teclado**: toque três teclas ao mesmo tempo (multitoque). Com teclado MIDI no Android, as teclas tocam e a cifra aparece.
- [ ] **Ritmo**: toque junto. O erro médio fica abaixo de uns 40 ms quando você sente que acertou? Se o app sempre disser que você atrasa ou adianta muito, anote o valor.

## 5. Voz

- [ ] **Respiração**: o círculo cresce e encolhe junto com as instruções.
- [ ] **Teste de “sss”**: o relógio começa quando você começa e para quando o ar acaba (tolerando até 0,3 s de falha).
- [ ] **Aquecimento**: as notas ficam dentro da sua extensão e sobem de meio em meio tom.
- [ ] **Medidor › Extensão**: a nota mais grave e a mais aguda batem com o que você conhece da sua voz. Uma nota “de raspão” (menos de 0,3 s) não conta.
- [ ] **Medidor › Registro**: grave as duas amostras (peito e cabeça na mesma nota). Depois, cante alternando: o indicador muda de lado? A confiança sobe depois da calibração?
- [ ] **Medidor › Passagens**: faça três sirenes. A marca aparece perto da mesma nota e coincide com onde você sente a voz virar?
- [ ] **Vibrato**: com vibrato natural, a taxa fica entre 4 e 8 Hz? Em nota reta, o app diz “nota reta”?
- [ ] **Retrato vocal** completo (uns 3 minutos, com fones). No fim, a gravação da escala toca em *Evolução › Dados e backup*.
- [ ] **Tirar a voz da garganta**: a tela rola com **um dedo só**, inclusive passando por cima dos botões e das caixas. Marque um sinal no autodiagnóstico e confira se aparecem as técnicas sugeridas.
- [ ] **Técnicas › Ouvir o exemplo** (abra pelo menos Bocejo, Lábios e canudo e Zumbido): o som toca, o botão vira *Parar* e para ao tocar nele. Com a extensão medida, a nota inicial fica dentro dela; sem medir, as três faixas (grave, média, aguda) soam em alturas diferentes.
- [ ] **Técnicas, na prática**: faça uma técnica de cada trilha seguindo o passo a passo. Alguma instrução ficou confusa? Alguma pediu algo que dói ou aperta? Anote qual.

> O medidor de registro é uma estimativa acústica. Ele não substitui a avaliação de um professor de canto, fonoaudiólogo ou otorrinolaringologista.

## 6. Estúdio

- [ ] **Lição 1.5 (ganho)**: suba o ganho até a luz CLIP acender. A distorção é audível.
- [ ] **Lição 1.3 (padrões polares)**: arraste a bolinha com o dedo. O volume muda conforme a posição.
- [ ] **Lição 2.4 (microfonia)**: o apito aparece quando o laço passa de 1 e **não machuca o ouvido** (o volume é limitado).
- [ ] **Lição 3.2 (equalizador)**: o espectro se mexe com o som e a curva amarela acompanha os controles.
- [ ] **Lição 4.3 (limiter)**: depois de mexer, os números de LUFS e true peak atualizam em um ou dois segundos.
- [ ] **Mesa virtual**: os botões giratórios respondem bem ao dedo (arrastar para cima e para baixo). Toque duplo volta ao padrão. Deslizar para o lado troca de canal sem mexer em botão por engano.
- [ ] Faça as quatro **missões**. A verificação automática concorda com o seu ouvido?
- [ ] As **fotos** das lições aparecem nítidas, e os números sobre a foto do canal (lição 2.1) apontam os controles certos.

## 7. Gravador e projeto final

- [ ] **Com fones com fio.** Crie um projeto com “Aurora” e toque em **Calibrar latência** com um lado do fone encostado no microfone. Anote o valor (comum: 20 a 150 ms; Bluetooth: bem mais).
- [ ] Grave a voz do **baixo** junto com a guia. Ouça tudo: a sua voz está **no tempo** com as vozes do app? Se estiver sempre adiantada ou atrasada, calibre de novo.
- [ ] Grave uma segunda pista ouvindo a primeira. As duas ficam sincronizadas.
- [ ] A guia e o metrônomo **não aparecem** na sua gravação (ouça a pista sozinha). Se aparecerem, o fone está vazando.
- [ ] A forma de onda aparece, e o aviso de clip surge se você gritar perto do microfone.
- [ ] **Exportar WAV**: o arquivo abre em outro app (ou é compartilhado por WhatsApp/Arquivos).
- [ ] **Do zero ao master**: grave ao menos duas vozes, abra a mesa, renderize a master (pode levar alguns segundos) e exporte. O resultado aparece em *Evolução*.
- [ ] Grave seis pistas de uns 40 s e confira em *Dados e backup* o espaço usado.

## 8. Dados

- [ ] *Evolução › Dados e backup › Exportar tudo*: o arquivo `.json` é salvo ou compartilhado.
- [ ] Apague uma gravação. Depois **importe** o backup: tudo volta.
- [ ] Feche o app por um dia e reabra: histórico, sequência de dias e gravações continuam lá.
- [ ] **iPhone**: o Safari pode apagar dados de sites pouco usados. Com o app instalado na Tela de Início isso é mais raro; ainda assim, faça backup de vez em quando.

## 9. Acessibilidade e conforto

- [ ] Com **“Reduzir movimento”** ligado no sistema, as animações param ou ficam mínimas, e tudo continua utilizável.
- [ ] Com a **fonte do sistema aumentada**, os textos não cortam botões.
- [ ] **TalkBack/VoiceOver**: as cinco abas, os botões das vozes e os controles da mesa são anunciados com nome.
- [ ] Usar o app por 15 minutos seguidos: o aparelho esquenta demais ou a bateria cai rápido? Em qual tela?

## O que eu sei que depende do aparelho

- **Latência do áudio**: varia de 10 ms a mais de 200 ms entre aparelhos. A calibração resolve o alinhamento das gravações, mas não o atraso ao se ouvir.
- **Processamento do microfone**: o app pede eco, redução de ruído e ganho automático **desligados**. Alguns aparelhos ignoram o pedido; nesses, a leitura de notas longas pode oscilar.
- **Media Session** (controles na tela de bloqueio): como o som é sintetizado, alguns navegadores não mostram os controles.
- **iPhone**: sem Web MIDI e sem vibração; tela sempre acesa e armazenamento persistente dependem da versão do iOS.
