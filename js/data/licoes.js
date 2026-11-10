// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Mini curso de produção musical: quatro módulos. Cada lição tem texto curto, foto real,
// simulador que processa áudio de verdade e três perguntas. Nomes em inglês ao lado do português.

const en = (t) => `<i lang="en">${t}</i>`;

export const MODULOS = [
  { id: 1, name: 'Gravação', sub: 'Do som da voz ao arquivo', color: 'var(--v0)' },
  { id: 2, name: 'Mesa de som', sub: 'O canal, os auxiliares e o master', color: 'var(--v1)' },
  { id: 3, name: 'Mixagem', sub: 'Equilíbrio, timbre, dinâmica e espaço', color: 'var(--v3)' },
  { id: 4, name: 'Masterização', sub: 'O acabamento e a entrega', color: 'var(--v5)' },
];

export const LICOES = [
  // ---------------- 1. Gravação ----------------
  { id: '1.1', mod: 1, title: 'O caminho do sinal', fotos: ['interface', 'xlr'], sims: [['cadeia', 'Estrutura de ganho']],
    text: [
      `Gravar é transformar som em números. O caminho é sempre o mesmo: <b>voz → microfone → pré-amplificador → conversor → programa de gravação</b>.`,
      `O <b>microfone</b> transforma a vibração do ar em um sinal elétrico muito fraco. O <b>pré-amplificador</b> (${en('preamp')}) eleva esse sinal ao nível de trabalho.`,
      `O <b>conversor</b> (${en('A/D converter')}) mede o sinal milhares de vezes por segundo e anota cada medida como um número. Pré e conversor costumam morar na mesma caixa: a <b>interface de áudio</b> (${en('audio interface')}).`,
      `O <b>programa de gravação</b> (${en('DAW, digital audio workstation')}) guarda, edita e mistura as pistas. Cada elo da corrente pode estragar o som; nenhum elo conserta o que o anterior estragou.`,
    ],
    quiz: [
      { q: 'O que o pré-amplificador faz?', o: ['Transforma som em números', 'Eleva o sinal fraco do microfone', 'Grava as pistas'], a: 1, w: 'Sem ele, o sinal do microfone fica perto do ruído.' },
      { q: 'Onde o som vira número?', o: ['No microfone', 'No conversor (A/D)', 'No fone'], a: 1, w: 'A/D = de analógico para digital.' },
      { q: 'Se o sinal distorceu no pré, dá para consertar depois?', o: ['Sim, com o fader', 'Sim, com equalizador', 'Não'], a: 2, w: 'A distorção passa a fazer parte da gravação.' },
    ] },
  { id: '1.2', mod: 1, title: 'Microfones: dinâmico, condensador e fita', fotos: ['dinamico', 'condensador', 'fita'], sims: [['microfones', 'Três famílias, três timbres']],
    text: [
      `O <b>dinâmico</b> (${en('dynamic')}) é robusto e pouco sensível. Aguenta volume alto, capta pouco do ambiente e não precisa de alimentação. É o microfone de palco.`,
      `O <b>condensador</b> (${en('condenser')}) é sensível e detalhado. Capta os agudos com clareza, mas também a sala, o ventilador e o vizinho. Precisa de alimentação: o ${en('phantom power')} de 48 V.`,
      `O de <b>fita</b> (${en('ribbon')}) usa uma lâmina metálica finíssima. Tem agudos suaves e som macio. É frágil: sopro forte e queda podem danificar a fita.`,
      `Para voz em casa, um dinâmico perdoa mais a sala ruim. Em sala tratada, o condensador mostra mais detalhe.`,
    ],
    quiz: [
      { q: 'Qual microfone precisa de phantom power?', o: ['Dinâmico', 'Condensador', 'Nenhum'], a: 1, w: 'A cápsula e o circuito dele precisam de alimentação.' },
      { q: 'Em uma sala com eco e barulho, qual tende a captar menos o ambiente?', o: ['Dinâmico', 'Condensador'], a: 0, w: 'Ele é menos sensível.' },
      { q: 'O que caracteriza o microfone de fita?', o: ['Agudos suaves e fragilidade', 'Resistência a quedas', 'Brilho exagerado'], a: 0, w: 'Som macio; pede cuidado.' },
    ] },
  { id: '1.3', mod: 1, title: 'Padrões polares e efeito de proximidade', fotos: ['condensador'], sims: [['polar', 'Padrões polares'], ['proximidade', 'Efeito de proximidade']],
    text: [
      `O <b>padrão polar</b> (${en('polar pattern')}) é o mapa das direções em que o microfone capta. <b>Omnidirecional</b>: capta igual de todos os lados. <b>Cardioide</b>: capta a frente e rejeita a traseira. <b>Supercardioide</b>: frente mais estreita, com uma pequena captação atrás. <b>Figura de oito</b>: frente e trás, rejeitando os lados.`,
      `Use a rejeição a seu favor: aponte o lado “surdo” do microfone para o que você não quer gravar, como o computador ou a caixa de retorno.`,
      `Microfones direcionais têm o <b>efeito de proximidade</b> (${en('proximity effect')}): quanto mais perto da boca, mais graves. Perto demais, a voz fica pesada; longe demais, fica fina e cheia de sala.`,
      `Omnidirecionais não têm esse efeito.`,
    ],
    quiz: [
      { q: 'Qual padrão rejeita o som que vem de trás?', o: ['Omnidirecional', 'Cardioide', 'Figura de oito'], a: 1, w: 'Por isso é o mais usado para voz.' },
      { q: 'O que acontece ao cantar muito perto de um cardioide?', o: ['Somem os graves', 'Aumentam os graves', 'Nada muda'], a: 1, w: 'É o efeito de proximidade.' },
      { q: 'A caixa de retorno deve ficar…', o: ['Na direção em que o microfone rejeita', 'Na frente do microfone', 'Tanto faz'], a: 0, w: 'No cardioide, atrás do microfone.' },
    ] },
  { id: '1.4', mod: 1, title: 'Distância, pop filter e acústica', fotos: ['cabine', 'sala'], sims: [['sala', 'Sala seca e sala reverberante']],
    text: [
      `Para voz cantada, comece a um palmo do microfone (15 a 20 cm). Nas notas fortes, afaste um pouco; nas suaves, aproxime.`,
      `O <b>${en('pop filter')}</b> é a tela entre a boca e o microfone. Ele quebra o sopro dos sons “p” e “b”, que chegam à cápsula como um estouro grave.`,
      `A sala entra na gravação. Paredes paralelas e nuas devolvem o som e criam um eco curto, “de caixa”. <b>Absorção</b> (espuma, lã, cortina grossa, sofá, roupas) reduz as reflexões; <b>difusão</b> (estantes cheias, superfícies irregulares) espalha o que sobra.`,
      `Regra prática: é melhor gravar seco e somar reverb depois. O contrário não existe: reverberação gravada não sai mais.`,
    ],
    quiz: [
      { q: 'Para que serve o pop filter?', o: ['Dar brilho', 'Segurar o sopro de “p” e “b”', 'Reduzir o eco da sala'], a: 1, w: 'Ele não trata a acústica.' },
      { q: 'O que reduz as reflexões da sala?', o: ['Paredes lisas', 'Materiais que absorvem, como lã e cortina grossa', 'Mais volume'], a: 1, w: 'Absorção.' },
      { q: 'Por que gravar a voz o mais seca possível?', o: ['Porque dá para somar reverb depois, mas não tirar', 'Porque fica mais alta', 'Porque economiza espaço'], a: 0, w: 'Seco dá liberdade na mixagem.' },
    ] },
  { id: '1.5', mod: 1, title: 'Ganho, headroom e phantom power', fotos: ['interface', 'p10'], sims: [['ganho', 'Ganho com medidor e clipping']],
    text: [
      `O <b>ganho</b> (${en('gain')}) é o quanto o pré amplifica o microfone. É o ajuste mais importante da gravação.`,
      `No digital, o teto é 0 dBFS. Passou disso, as pontas da onda são cortadas: é o <b>${en('clipping')}</b>, uma distorção áspera e sem conserto.`,
      `<b>${en('Headroom')}</b> é a folga entre o seu pico e o teto. Grave com picos entre −18 e −6 dBFS. Em 24 bits há faixa de sobra: gravar mais baixo não custa nada.`,
      `<b>${en('Phantom power')}</b> (+48 V) alimenta microfones condensadores pelo próprio cabo XLR. Ligue o cabo primeiro e o +48 V depois, com o volume baixo. Dinâmicos comuns ignoram essa tensão; microfones de fita antigos podem se danificar.`,
      `Cabos: o <b>XLR</b> de três pinos é balanceado e é o padrão de microfones. O <b>P10</b> (${en('TS/TRS, 1/4 inch')}) aparece em instrumentos, fones e linhas.`,
    ],
    quiz: [
      { q: 'O que é headroom?', o: ['O volume do fone', 'A folga entre o pico e o teto', 'Um tipo de microfone'], a: 1, w: 'Folga contra o clipping.' },
      { q: 'Qual é uma boa faixa de pico ao gravar?', o: ['Entre −18 e −6 dBFS', 'Sempre em 0 dBFS', 'Abaixo de −50 dBFS'], a: 0, w: 'Forte o bastante, com folga.' },
      { q: 'Para que serve o botão +48 V?', o: ['Aumentar o volume', 'Alimentar microfones condensadores', 'Cortar graves'], a: 1, w: 'É o phantom power.' },
    ] },
  { id: '1.6', mod: 1, title: 'Amostragem, bits, latência e monitoração', fotos: ['fones', 'daw'], sims: [['bits', 'Bits, taxa de amostragem e dither'], ['latencia', 'Latência no fone']],
    text: [
      `A <b>taxa de amostragem</b> (${en('sample rate')}) é quantas medidas por segundo o conversor faz. Ela registra frequências até a metade do seu valor: 44,1 kHz alcança 22 kHz, acima do que ouvimos. 48 kHz é o padrão de vídeo. Para voz, 44,1 ou 48 kHz bastam.`,
      `Os <b>bits</b> (${en('bit depth')}) definem quantos degraus cada medida pode ter. Cada bit vale cerca de 6 dB de faixa dinâmica: 16 bits dão 96 dB; 24 bits, 144 dB. Grave em 24 bits.`,
      `<b>Latência</b> (${en('latency')}) é o atraso entre cantar e ouvir a própria voz depois de ela passar pelo computador. Acima de uns 10 a 15 ms, atrapalha.`,
      `A saída é a <b>monitoração direta</b> (${en('direct monitoring')}): a interface manda a voz para o fone antes do computador, sem atraso. Use fones <b>fechados</b> ao gravar, para a guia não vazar para o microfone.`,
    ],
    quiz: [
      { q: 'Uma gravação a 48 kHz registra frequências até…', o: ['48 kHz', '24 kHz', '12 kHz'], a: 1, w: 'A metade da taxa de amostragem.' },
      { q: 'Quantos dB de faixa dinâmica vale cada bit, aproximadamente?', o: ['1 dB', '6 dB', '20 dB'], a: 1, w: '16 bits ≈ 96 dB; 24 bits ≈ 144 dB.' },
      { q: 'Como evitar a latência ao gravar a voz?', o: ['Monitoração direta pela interface', 'Aumentar o volume', 'Usar caixas de som'], a: 0, w: 'A voz vai ao fone antes de passar pelo computador.' },
    ] },
  { id: '1.7', mod: 1, title: 'Gravação em camadas', fotos: ['daw'], sims: [['camadas', 'Empilhando tomadas']],
    text: [
      `Em harmonia vocal, raramente se grava todo mundo de uma vez. Grava-se em <b>camadas</b> (${en('overdub')}): uma voz por vez, ouvindo no fone o que já foi gravado.`,
      `Comece por uma <b>guia</b>: piano ou voz simples, com metrônomo (${en('click')}). Depois grave o baixo, que dá o chão da afinação, e suba voz por voz.`,
      `<b>Dobrar</b> (${en('double tracking')}) é cantar a mesma linha de novo em outra pista. As pequenas diferenças entre as tomadas engordam o som. Para soar como grupo, abra as dobras no estéreo.`,
      `Cuidados: mesma distância do microfone em todas as tomadas, mesmo ganho, consoantes finais juntas e respiração combinada. É o que você pratica no gravador do app.`,
    ],
    quiz: [
      { q: 'O que é overdub?', o: ['Gravar uma voz por vez sobre o que já existe', 'Gravar todos juntos', 'Apagar uma pista'], a: 0, w: 'Gravação em camadas.' },
      { q: 'Por qual voz convém começar o empilhamento, depois da guia?', o: ['Pelo baixo', 'Pela voz mais aguda', 'Tanto faz'], a: 0, w: 'Ele dá a referência de afinação.' },
      { q: 'O que a dobra (double tracking) faz?', o: ['Afina a voz', 'Engorda o som com pequenas diferenças entre tomadas', 'Aumenta a taxa de amostragem'], a: 1, w: 'Duas tomadas nunca são idênticas.' },
    ] },

  // ---------------- 2. Mesa de som ----------------
  { id: '2.1', mod: 2, title: 'O canal, de cima a baixo', fotos: ['canal'], sims: [['canal', 'Um canal completo']],
    text: [
      `Toda mesa repete a mesma tira vertical: o <b>canal</b> (${en('channel strip')}). O som entra em cima e desce.`,
      `<b>Entrada</b> (${en('input')}): XLR para microfone, P10 para linha. <b>Ganho</b> (${en('gain / trim')}): quanto o pré amplifica. <b>+48 V</b>: phantom power. <b>${en('Pad')}</b>: atenua sinais fortes demais. <b>Corte de graves</b> (${en('HPF / low cut')}): tira o ronco abaixo de 80 a 100 Hz.`,
      `<b>Equalizador</b> (${en('EQ')}): agudos, médios e graves. No médio <b>semiparamétrico</b> você escolhe também a frequência. <b>Auxiliares</b> (${en('aux sends')}): cópias do som para retornos e efeitos.`,
      `<b>${en('Pan')}</b>: esquerda ou direita. <b>${en('Mute')}</b>: silencia. <b>${en('Solo')}</b> e <b>${en('PFL')}</b> (escuta pré-fader): ouvir só aquele canal. <b>${en('Fader')}</b>: o volume do canal na mixagem.`,
    ],
    quiz: [
      { q: 'Qual é o primeiro controle no caminho do sinal?', o: ['Fader', 'Ganho', 'Pan'], a: 1, w: 'O ganho fica no topo, logo depois da entrada.' },
      { q: 'O que o HPF (low cut) remove?', o: ['Agudos', 'Graves abaixo de uma frequência', 'O canal da mixagem'], a: 1, w: 'Passa-altas = corta graves.' },
      { q: 'Para que serve o PFL?', o: ['Ouvir o canal antes do fader, para conferir o ganho', 'Gravar', 'Ligar o phantom'], a: 0, w: 'Pre-fader listen.' },
    ] },
  { id: '2.2', mod: 2, title: 'Auxiliares, subgrupos e master', fotos: ['mesa'], sims: [['aux', 'Auxiliar pré e pós-fader']],
    text: [
      `Um <b>auxiliar</b> (${en('aux')}) é uma saída extra. Cada canal tem um botão de envio que decide quanto dele vai para lá.`,
      `<b>Pré-fader</b> (${en('pre')}): o envio não depende do fader. Serve para o <b>retorno</b> dos cantores: você mexe no som da plateia sem bagunçar o que eles ouvem. <b>Pós-fader</b> (${en('post')}): o envio acompanha o fader. Serve para <b>efeitos</b>, como o reverb.`,
      `<b>Subgrupo</b> (${en('subgroup / bus')}): vários canais somados em um fader só. Mande as seis vozes para um subgrupo e controle o grupo inteiro com um dedo.`,
      `<b>${en('Master')}</b>: a soma final, com o fader principal e os medidores de saída.`,
    ],
    quiz: [
      { q: 'Qual auxiliar usar para o retorno de palco?', o: ['Pré-fader', 'Pós-fader'], a: 0, w: 'O retorno não deve mudar quando você mexe no fader.' },
      { q: 'E para mandar a voz a um reverb?', o: ['Pré-fader', 'Pós-fader'], a: 1, w: 'O efeito deve acompanhar o volume do canal.' },
      { q: 'O que é um subgrupo?', o: ['Um microfone extra', 'Vários canais somados sob um fader', 'Um tipo de cabo'], a: 1, w: 'Controla um conjunto de uma vez.' },
    ] },
  { id: '2.3', mod: 2, title: 'Medidores e estrutura de ganho', fotos: ['vu'], sims: [['medidores', 'Pico e VU'], ['cadeia', 'Estrutura de ganho']],
    text: [
      `O <b>medidor de pico</b> (${en('peak meter')}) é rápido: mostra os instantes mais fortes, os que podem clipar. O <b>VU</b> é lento: mostra o volume médio, mais parecido com o que o ouvido sente.`,
      `Em mesas analógicas, o <b>0 VU</b> é o nível nominal de trabalho, com folga acima dele. No digital, o <b>0 dBFS</b> é o teto absoluto. Uma equivalência comum é 0 VU = −18 dBFS.`,
      `<b>Estrutura de ganho</b> (${en('gain staging')}) é manter um nível saudável em cada etapa: ganho, equalizador, fader, subgrupo, master.`,
      `O método: fader em 0 dB (posição “U”), ajuste o ganho até o medidor de entrada marcar bem, sem clip. Depois mixe com os faders. Ganho baixo com master alto traz chiado; ganho alto demais distorce logo na entrada.`,
    ],
    quiz: [
      { q: 'Qual medidor mostra os instantes que podem clipar?', o: ['VU', 'Pico'], a: 1, w: 'O VU é lento demais para isso.' },
      { q: 'O que é 0 dBFS?', o: ['O nível médio ideal', 'O teto absoluto do áudio digital', 'O silêncio'], a: 1, w: 'Acima dele, só distorção.' },
      { q: 'Ganho baixo e master muito alto resultam em…', o: ['Mais chiado', 'Mais graves', 'Menos latência'], a: 0, w: 'Você amplifica o ruído junto.' },
    ] },
  { id: '2.4', mod: 2, title: 'Microfonia e retorno de palco', fotos: ['dinamico', 'mesa'], sims: [['microfonia', 'O laço da microfonia']],
    text: [
      `<b>Microfonia</b> (${en('feedback')}) é um laço: o microfone capta a caixa, a mesa amplifica, a caixa toca mais alto, o microfone capta de novo. Quando o laço devolve mais do que recebeu, apita.`,
      `Como evitar: caixas <b>à frente</b> dos microfones, apontadas para o público. Retornos no ponto em que o microfone rejeita (atrás do cardioide). <b>Cante perto</b> do microfone, para precisar de menos ganho. Feche os canais que não estão em uso.`,
      `Se uma frequência insiste em apitar, um corte estreito no equalizador naquela frequência resolve sem destruir o timbre.`,
      `Para grupo vocal, o retorno é metade da afinação. Cada cantor precisa ouvir a si mesmo e as vozes vizinhas. Com <b>fones de retorno</b> (${en('in-ear monitors')}) não há caixa no palco: a microfonia quase desaparece e a mixagem de cada um pode ser diferente.`,
    ],
    quiz: [
      { q: 'O que causa a microfonia?', o: ['Cabo ruim', 'O microfone captando a própria caixa, em laço', 'Falta de phantom'], a: 1, w: 'É realimentação.' },
      { q: 'Onde colocar o retorno em relação a um cardioide?', o: ['Atrás do microfone', 'Na frente', 'Ao lado, encostado'], a: 0, w: 'É onde ele rejeita mais.' },
      { q: 'Por que cantar perto do microfone ajuda?', o: ['Precisa de menos ganho', 'Dá mais agudos', 'Muda o padrão polar'], a: 0, w: 'Menos ganho, laço mais fraco.' },
    ] },
  { id: '2.5', mod: 2, title: 'Mesa analógica e mesa digital', fotos: ['mesa', 'digital'], sims: [['cenas', 'Cenas na mesa digital']],
    text: [
      `Na <b>mesa analógica</b>, cada função tem o seu botão. O que você vê é o que está acontecendo. É rápida de entender e não tem menus.`,
      `Na <b>mesa digital</b>, o som vira número na entrada. Um mesmo conjunto de botões controla o canal selecionado, e uma tela mostra o resto. Em troca, cada canal ganha equalizador completo, compressor e efeitos.`,
      `A digital também guarda <b>cenas</b> (${en('scenes')}): a posição de todos os controles, chamada de volta em um toque. Muitas gravam todas as pistas por USB e podem ser controladas por tablet.`,
      `O raciocínio é o mesmo nas duas: ganho, timbre, auxiliares, pan, fader. Quem entende um canal entende qualquer mesa.`,
    ],
    quiz: [
      { q: 'O que é uma cena na mesa digital?', o: ['Um efeito', 'A posição de todos os controles, salva', 'Um tipo de entrada'], a: 1, w: 'Dá para voltar a ela depois.' },
      { q: 'Na mesa analógica…', o: ['Cada função tem um botão físico', 'Tudo fica em menus', 'Não existe equalizador'], a: 0, w: 'O painel mostra tudo.' },
      { q: 'O caminho do sinal muda da analógica para a digital?', o: ['Muda tudo', 'O raciocínio é o mesmo'], a: 1, w: 'Ganho, EQ, auxiliares, pan, fader.' },
    ] },

  // ---------------- 3. Mixagem ----------------
  { id: '3.1', mod: 3, title: 'Equilíbrio, panorama e mono', fotos: ['monitores'], sims: [['pan', 'Faders, pan e checagem em mono']],
    text: [
      `<b>Mixar</b> é fazer as pistas soarem como uma música só. O primeiro passo usa só os <b>faders</b>: achar o volume de cada voz. Uma boa mixagem começa aqui, antes de qualquer efeito.`,
      `O <b>panorama</b> (${en('pan')}) distribui as vozes entre a esquerda e a direita. Graves e voz principal no centro; as outras, espalhadas em pares, para os dois lados pesarem igual.`,
      `Cheque sempre em <b>mono</b>. Muita gente vai ouvir em uma caixinha só. Se uma voz some ou o timbre muda muito em mono, há problema de fase ou abertura exagerada.`,
      `Mixe em volume moderado e descanse o ouvido. Alto demais, tudo parece bom.`,
    ],
    quiz: [
      { q: 'Qual é o primeiro passo de uma mixagem?', o: ['Reverb', 'Equilíbrio de volumes com os faders', 'Limiter'], a: 1, w: 'Antes de qualquer efeito.' },
      { q: 'Onde costumam ficar o baixo e a voz principal?', o: ['No centro', 'Totalmente à esquerda', 'Um em cada lado'], a: 0, w: 'O centro é o lugar mais forte.' },
      { q: 'Por que checar em mono?', o: ['Para ficar mais alto', 'Porque muita gente ouve em um alto-falante só', 'Para economizar pistas'], a: 1, w: 'E para achar problemas de fase.' },
    ] },
  { id: '3.2', mod: 3, title: 'Equalização por faixas de frequência', fotos: ['rack'], sims: [['eq', 'Equalizador com analisador'], ['jogo-eq', 'Jogo: qual faixa foi realçada?']],
    text: [
      `O <b>equalizador</b> (${en('EQ')}) aumenta ou reduz faixas de frequência. Pense em um controle de volume para cada região do som.`,
      `Mapa da voz: <b>abaixo de 100 Hz</b>, ronco e batidas (corte). <b>100 a 300 Hz</b>, corpo; em excesso, embola. <b>300 Hz a 2 kHz</b>, o miolo da voz; perto de 1 kHz, som “de telefone”. <b>2 a 6 kHz</b>, clareza e consoantes. <b>6 a 10 kHz</b>, os “s”. <b>Acima de 10 kHz</b>, o “ar”.`,
      `Tipos de filtro: <b>${en('shelf')}</b> (prateleira) mexe em tudo acima ou abaixo de um ponto. <b>${en('Bell / peaking')}</b> (sino) mexe ao redor de uma frequência; o <b>Q</b> é a largura do sino. <b>${en('HPF')}</b> corta os graves.`,
      `Regra de bolso: <b>corte antes de realçar</b>. Tirar o que sobra costuma soar mais natural do que empurrar o que falta.`,
    ],
    quiz: [
      { q: 'Em que faixa as vozes somadas costumam embolar?', o: ['100 a 300 Hz', '6 a 10 kHz', 'Acima de 15 kHz'], a: 0, w: 'É o médio-grave.' },
      { q: 'O que o Q controla em um filtro sino?', o: ['A largura da faixa afetada', 'O volume geral', 'O pan'], a: 0, w: 'Q alto = faixa estreita.' },
      { q: 'Onde mora a clareza das consoantes?', o: ['Abaixo de 100 Hz', 'Entre 2 e 6 kHz', 'Em 250 Hz'], a: 1, w: 'A região da presença.' },
    ] },
  { id: '3.3', mod: 3, title: 'Compressão', fotos: ['rack'], sims: [['compressor', 'Compressor com curva e medidor'], ['jogo-comp', 'Jogo: quanta compressão?']],
    text: [
      `O <b>compressor</b> reduz a distância entre os trechos fortes e fracos. É um fader automático que abaixa o volume quando o som passa de um ponto.`,
      `<b>Limiar</b> (${en('threshold')}): o nível a partir do qual ele age. <b>Razão</b> (${en('ratio')}): com 4:1, a cada 4 dB que passam do limiar, só 1 dB sai.`,
      `<b>Ataque</b> (${en('attack')}): quanto tempo ele leva para agir. Ataque lento deixa passar o começo das notas. <b>Liberação</b> (${en('release')}): quanto tempo leva para soltar.`,
      `Como ele abaixa os picos, o som fica mais baixo. O <b>ganho de compensação</b> (${en('makeup gain')}) devolve o volume. O medidor de <b>redução</b> (${en('gain reduction')}) mostra o trabalho: em voz, 3 a 6 dB costumam bastar.`,
    ],
    quiz: [
      { q: 'O que o limiar (threshold) define?', o: ['O nível a partir do qual o compressor age', 'O volume final', 'A frequência'], a: 0, w: 'Abaixo dele, nada muda.' },
      { q: 'Com razão 4:1, 8 dB acima do limiar viram…', o: ['8 dB', '4 dB', '2 dB'], a: 2, w: '8 ÷ 4 = 2.' },
      { q: 'Para que serve o makeup gain?', o: ['Devolver o volume perdido na compressão', 'Cortar graves', 'Mudar o ataque'], a: 0, w: 'Ganho de compensação.' },
    ] },
  { id: '3.4', mod: 3, title: 'De-esser', fotos: ['condensador'], sims: [['deesser', 'Domando a sibilância']],
    text: [
      `<b>Sibilância</b> é o excesso de energia nos sons “s”, “ch” e “z”. Ela fica entre 5 e 9 kHz e fura o ouvido, principalmente depois de comprimir e dar brilho.`,
      `O <b>${en('de-esser')}</b> é um compressor que só reage a essa faixa. Quando o “s” passa do limiar, ele abaixa os agudos por um instante e solta em seguida.`,
      `Ajuste: ouça só a faixa dos “s”, desça o limiar até a redução aparecer apenas nas sibilantes e volte um pouco. Se a voz ficar com língua presa, foi demais.`,
      `Em vozes empilhadas, seis “s” juntos somam muito. Trate cada voz com leveza e combine com o grupo onde as consoantes entram.`,
    ],
    quiz: [
      { q: 'Em que faixa fica a sibilância?', o: ['50 a 100 Hz', '5 a 9 kHz', '200 a 400 Hz'], a: 1, w: 'A região dos “s”.' },
      { q: 'O de-esser é, na prática…', o: ['Um reverb', 'Um compressor que só olha para os agudos dos “s”', 'Um equalizador fixo'], a: 1, w: 'Ele age só quando o “s” aparece.' },
      { q: 'Sinal de de-esser em excesso:', o: ['Voz com língua presa', 'Mais graves', 'Mais eco'], a: 0, w: 'Os “s” viram “th”.' },
    ] },
  { id: '3.5', mod: 3, title: 'Reverb e delay por envio', fotos: ['rack'], sims: [['envio', 'Envio para reverb e delay']],
    text: [
      `<b>Reverb</b> imita as reflexões de um ambiente. <b>Delay</b> é o eco: repetições do som depois de um tempo.`,
      `O jeito clássico de usar é <b>por envio</b> (${en('send / return')}): o efeito fica em um canal próprio, 100% molhado. Cada voz manda uma cópia para lá por um auxiliar pós-fader.`,
      `Vantagem: todas as vozes passam pelo <b>mesmo ambiente</b> e parecem estar na mesma sala. E você controla a quantidade de cada uma.`,
      `Ajustes úteis: <b>pré-atraso</b> (${en('pre-delay')}) de 20 a 40 ms separa a voz do reverb e mantém a clareza. Corte os graves do retorno do reverb para não embolar. No delay, acerte o tempo com o andamento da música.`,
    ],
    quiz: [
      { q: 'No uso por envio, de que tipo é o auxiliar?', o: ['Pós-fader', 'Pré-fader'], a: 0, w: 'O efeito acompanha o volume do canal.' },
      { q: 'Por que usar um só reverb para todas as vozes?', o: ['Para elas parecerem na mesma sala', 'Para economizar cabos', 'Para aumentar o volume'], a: 0, w: 'O ambiente comum “cola” o grupo.' },
      { q: 'O que o pré-atraso faz?', o: ['Separa a voz do início do reverb', 'Afina a voz', 'Corta agudos'], a: 0, w: 'A voz fica na frente.' },
    ] },
  { id: '3.6', mod: 3, title: 'Automação e faixa de referência', fotos: ['daw'], sims: [['automacao', 'Desenhe a automação'], ['ab', 'A/B com volume igualado']],
    text: [
      `<b>Automação</b> (${en('automation')}) é gravar o movimento dos controles ao longo da música. O fader sobe no verso suave e desce no refrão forte, sozinho.`,
      `Antes de comprimir mais, automatize o volume: levante as sílabas que somem, abaixe as que saltam. Soa mais natural.`,
      `<b>Faixa de referência</b> (${en('reference track')}) é uma gravação de que você gosta, no mesmo estilo, colocada no projeto para comparar.`,
      `Compare com o <b>volume igualado</b> (${en('level matching')}). O ouvido acha melhor o que está mais alto. Sem igualar, você não julga o timbre: só confirma que mais alto parece melhor.`,
    ],
    quiz: [
      { q: 'O que a automação grava?', o: ['O movimento dos controles no tempo', 'O som da sala', 'A latência'], a: 0, w: 'Volume, pan, envios…' },
      { q: 'Para que serve a faixa de referência?', o: ['Para copiar a melodia', 'Para comparar timbre e equilíbrio com uma mixagem pronta', 'Para afinar'], a: 1, w: 'É uma régua.' },
      { q: 'Por que igualar o volume antes de comparar?', o: ['Porque o mais alto sempre parece melhor', 'Para economizar tempo', 'Para reduzir a latência'], a: 0, w: 'Senão, o volume decide por você.' },
    ] },
  { id: '3.7', mod: 3, title: 'Mixagem de vozes empilhadas', fotos: ['mesa'], sims: [['empilhadas', 'Limpar, colar e ambientar']],
    text: [
      `Seis vozes somadas não são seis vezes mais bonitas: são seis vezes mais graves acumulados. O primeiro gesto é o <b>corte de graves</b> em todas, menos no baixo.`,
      `Depois, trate o conjunto como um instrumento. Mande todas as vozes para um <b>subgrupo</b> e use ali uma compressão leve (${en('bus compression')}): ela faz o grupo respirar junto.`,
      `Panorama: baixo e líder no centro, pares de vozes abertos para os lados. Dobras da mesma linha, uma em cada lado.`,
      `Um só reverb para todas. E automação para o líder ficar um passo à frente quando tem a melodia, e voltar para dentro do acorde quando não tem.`,
    ],
    quiz: [
      { q: 'Qual o primeiro gesto ao mixar muitas vozes?', o: ['Somar graves', 'Cortar graves de todas, menos do baixo', 'Aumentar o reverb'], a: 1, w: 'Os graves se acumulam.' },
      { q: 'O que a compressão no subgrupo faz?', o: ['Faz o grupo se mover junto', 'Aumenta a sibilância', 'Abre o estéreo'], a: 0, w: 'Ela “cola” as vozes.' },
      { q: 'Onde ficam as dobras de uma mesma linha?', o: ['As duas no centro', 'Uma em cada lado', 'As duas à esquerda'], a: 1, w: 'Isso alarga o som.' },
    ] },

  // ---------------- 4. Masterização ----------------
  { id: '4.1', mod: 4, title: 'O que é masterizar', fotos: ['monitores', 'sala'], sims: [['ab', 'Mais alto parece melhor?']],
    text: [
      `<b>Masterização</b> (${en('mastering')}) é o acabamento. Trabalha-se sobre a mixagem pronta, em um arquivo estéreo, para ajustar o tom geral, a dinâmica e o volume, e preparar os arquivos de entrega.`,
      `Ela também dá unidade a um álbum: as faixas ficam com volume e timbre coerentes entre si, e soam bem em fone, carro e caixinha.`,
      `O que ela <b>não resolve</b>: voz baixa demais, desafinação, pista distorcida, reverb em excesso. Na master só existe o conjunto. Problema de mixagem se conserta na mixagem.`,
      `<b>Remasterização</b> é fazer uma master nova a partir da <b>mesma mixagem</b> antiga, para outro formato ou outra época. <b>Remixar</b> é diferente: é voltar às pistas separadas e misturar de novo.`,
    ],
    quiz: [
      { q: 'Sobre o que a masterização trabalha?', o: ['Pistas separadas', 'A mixagem pronta, em estéreo', 'O microfone'], a: 1, w: 'Só o conjunto.' },
      { q: 'A master conserta uma voz baixa demais na mixagem?', o: ['Sim', 'Não: isso se resolve na mixagem'], a: 1, w: 'Na master não há pistas separadas.' },
      { q: 'O que é remasterizar?', o: ['Regravar as vozes', 'Fazer nova master da mesma mixagem', 'Mixar de novo as pistas'], a: 1, w: 'Mixar de novo é remixar.' },
    ] },
  { id: '4.2', mod: 4, title: 'A cadeia de masterização', fotos: ['rack', 'vu'], sims: [['eq-mix', 'Equalização corretiva'], ['saturacao', 'Saturação'], ['estereo', 'Imagem estéreo']],
    text: [
      `A cadeia típica, em ordem: <b>equalização corretiva</b>, <b>compressão</b>, <b>saturação</b>, <b>imagem estéreo</b> e <b>${en('limiter')}</b>. Nem toda música precisa de todos.`,
      `<b>Equalização corretiva</b>: ajustes pequenos e largos, de 1 ou 2 dB. Se precisar de mais, o problema está na mixagem. <b>Compressão</b> de master: razão baixa (1,5:1 a 2:1) e 1 a 2 dB de redução, só para dar liga.`,
      `<b>Saturação</b>: distorção suave que acrescenta harmônicos e densidade. <b>Imagem estéreo</b>: controla a largura. Mantenha os graves no centro e confira em mono.`,
      `O <b>${en('limiter')}</b> fecha a cadeia: é um compressor de razão altíssima que impede o sinal de passar do teto, permitindo subir o volume médio.`,
    ],
    quiz: [
      { q: 'O que fecha a cadeia de masterização?', o: ['O limiter', 'O reverb', 'O pop filter'], a: 0, w: 'Ele garante o teto.' },
      { q: 'Como são os ajustes de EQ na master?', o: ['Grandes e estreitos', 'Pequenos e largos', 'Não existem'], a: 1, w: '1 ou 2 dB.' },
      { q: 'O que a saturação acrescenta?', o: ['Harmônicos', 'Latência', 'Phantom power'], a: 0, w: 'Calor e densidade, em dose pequena.' },
    ] },
  { id: '4.3', mod: 4, title: 'LUFS, true peak e faixa dinâmica', fotos: ['vu'], sims: [['limiter', 'Limiter com LUFS e true peak']],
    text: [
      `<b>LUFS</b> (${en('loudness units relative to full scale')}) mede o volume como o ouvido percebe, pela norma ITU-R BS.1770. O valor <b>integrado</b> é a média da música inteira.`,
      `<b>${en('True peak')}</b> (dBTP) é o pico real da onda, inclusive entre uma amostra e outra. Ele pode passar do que o medidor comum mostra, e distorcer na conversão para MP3, AAC ou Ogg. Por isso se deixa uma folga no teto.`,
      `<b>Faixa dinâmica</b> é a distância entre os trechos fracos e fortes. Cada dB que o limiter esmaga é dinâmica que não volta.`,
      `As plataformas <b>normalizam</b> o volume: tocam tudo perto de um mesmo alvo. Master esmagada para ficar alta é simplesmente abaixada, e soa pior que uma master com dinâmica.`,
      `<b>Alvos consultados em 10/11/2026.</b> <b>Spotify</b>: normaliza para −14 LUFS integrados e recomenda true peak abaixo de −1 dBTP (ou −2 dBTP se a master for mais alta que −14 LUFS). Fonte: página oficial “Loudness normalization”, Spotify for Artists (support.spotify.com/us/artists/article/loudness-normalization).`,
      `<b>Apple</b>: a documentação oficial de Apple Podcasts recomenda cerca de −16 LKFS (±1) e true peak até −1 dBFS, e cita o ${en('Sound Check')}. Para o Apple Music não encontrei um alvo numérico publicado pela Apple; o programa Apple Digital Masters define formato (24 bits), não volume. <b>YouTube</b>: não encontrei página oficial de ajuda com o número; a referência de −14 LUFS circula em fontes não oficiais. Confira sempre a página da plataforma antes de entregar.`,
    ],
    quiz: [
      { q: 'O que o LUFS mede?', o: ['O pico do sinal', 'O volume percebido', 'A latência'], a: 1, w: 'Pela norma ITU-R BS.1770.' },
      { q: 'Por que deixar folga de true peak?', o: ['Porque picos entre amostras podem distorcer na conversão', 'Para gastar menos espaço', 'Para ter mais graves'], a: 0, w: 'Formatos com perda podem estourar esses picos.' },
      { q: 'O que as plataformas fazem com uma master muito alta?', o: ['Tocam mais alto que as outras', 'Abaixam o volume até o alvo', 'Recusam o arquivo'], a: 1, w: 'A normalização iguala o volume.' },
    ] },
  { id: '4.4', mod: 4, title: 'Dither e formatos de exportação', fotos: ['daw'], sims: [['bits', 'Dither ao reduzir bits']],
    text: [
      `Ao reduzir de 24 para 16 bits, sobram menos degraus. Os sons muito baixos passam a “pular” entre eles: é o <b>erro de quantização</b>, uma distorção áspera nos finais de nota e nos reverbs.`,
      `O <b>${en('dither')}</b> é um ruído muito baixo somado antes da redução. Ele troca a distorção por um chiado suave e constante, bem menos incômodo. Use dither <b>uma vez só</b>, na última etapa, e apenas ao reduzir bits.`,
      `Formatos: <b>WAV</b> e <b>AIFF</b> guardam tudo, sem compressão. <b>FLAC</b> comprime sem perda. <b>MP3</b>, <b>AAC</b> e <b>Ogg</b> jogam fora parte do som para ficarem pequenos.`,
      `Entregue à distribuidora um WAV de 24 bits, na taxa de amostragem do projeto (44,1 ou 48 kHz). Guarde sempre a master sem perdas; versões com perda se geram a partir dela, nunca o contrário.`,
    ],
    quiz: [
      { q: 'Quando usar dither?', o: ['Em toda pista', 'Uma vez, na etapa final, ao reduzir bits', 'Nunca'], a: 1, w: 'Só na redução de bits.' },
      { q: 'Qual formato guarda o áudio sem perdas e sem compressão?', o: ['MP3', 'WAV', 'AAC'], a: 1, w: 'AIFF também.' },
      { q: 'O que o dither troca?', o: ['Distorção de quantização por um chiado suave', 'Graves por agudos', 'Mono por estéreo'], a: 0, w: 'Ruído constante incomoda menos que distorção.' },
    ] },
];

export const licao = (id) => LICOES.find((l) => l.id === id);
