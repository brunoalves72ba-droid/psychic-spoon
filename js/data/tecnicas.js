// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Técnicas para tirar a voz da garganta: conteúdo, autodiagnóstico e funções puras (testadas no Node).

export const TRILHAS = [
  { id: 'soltar', name: 'Soltar', cor: 'var(--v0)', about: 'Desfaz o aperto antes de cantar.' },
  { id: 'ar', name: 'Ar', cor: 'var(--v1)', about: 'Quem sustenta o som é o ar, não a garganta.' },
  { id: 'frente', name: 'Som na frente', cor: 'var(--v2)', about: 'Leva a vibração para o rosto.' },
  { id: 'musica', name: 'Na música', cor: 'var(--v4)', about: 'Passa a sensação para as canções.' },
];

/**
 * demo: o que o botão “Ouvir o exemplo” toca.
 *  kind 'notes': melodia-guia (pat = semitons a partir da nota inicial, d = segundos por nota)
 *  kind 'glide': uma nota que desliza por path (semitons), em d segundos
 *  kind 'hold': uma nota sustentada, em d segundos
 */
export const TECNICAS = [
  {
    id: 'bocejo', trilha: 'soltar', name: 'Bocejo e suspiro', tempo: '1 minuto',
    resumo: 'Abre o espaço no fundo da garganta sem forçar.',
    porque: 'No bocejo, o céu da boca sobe e a garganta se alarga sozinha. O suspiro que vem depois solta o ar sem apertar. É o contrário de cantar “prendendo” o som.',
    passos: [
      'Em pé, com os ombros soltos, faça um bocejo de verdade, com a boca bem aberta. Sinta o fundo da boca subir.',
      'No fim do bocejo, solte o ar num “haaa” descendente, só soprado, de um tom agudo confortável até o grave.',
      'Repita agora com voz: o mesmo suspiro descendo, bem macio e em volume baixo.',
      'Cante uma frase curta e guarde só uma pitada dessa sensação de começo de bocejo.',
    ],
    sinais: ['O som sai sem você empurrar.', 'Dá para sentir espaço atrás da língua e o pescoço fica mole.', 'Não há dor nem arranhão.'],
    evite: 'Escancarar a boca e escurecer a voz, como se tivesse uma batata quente na boca.',
    faca: 'Use só uma sugestão de bocejo. A boca fica relaxada, não aberta ao máximo.',
    exemplos: [
      'Suspiro: um “haaa” descendo de uma nota média até uma grave, como quem suspira de alívio.',
      'Frase: fale “Eu vou cantar bem leve” com a sensação de bocejo e só então cante a mesma frase.',
    ],
    demo: { kind: 'glide', path: [12, 0], d: 3.2, vowel: 'a', syl: '“haaa” descendo' },
  },
  {
    id: 'mandibula', trilha: 'soltar', name: 'Mandíbula e língua soltas', tempo: '2 minutos',
    resumo: 'Quando a mandíbula e a língua travam, a garganta trava junto.',
    porque: 'A raiz da língua e a mandíbula são vizinhas da garganta. Se elas endurecem, o aperto se espalha. Soltá-las costuma aliviar a voz logo nos primeiros minutos.',
    passos: [
      'Coloque os dedos nas bochechas, perto das orelhas, onde a mandíbula dobra. Massageie em círculos pequenos por 20 segundos.',
      'Deixe a mandíbula cair solta, como quem cochila sentado. A boca fica entreaberta, sem abrir à força.',
      'Apoie a ponta da língua atrás dos dentes de baixo, com a língua mole e larga.',
      'Teste: ponha o polegar sob o queixo, entre a mandíbula e o pescoço, e cante “a”. Se sentir algo duro empurrando para baixo, é a língua apertando. Solte e tente de novo.',
      'Cante “lá-lá-lá-lá-lá” em cinco notas, com a língua batendo leve, sem pressionar.',
    ],
    sinais: ['Sob o queixo, o polegar sente algo mole que quase não se mexe.', 'A mandíbula desce sem puxar para a frente.', 'A frase fica mais fácil do meio para o fim.'],
    evite: 'Puxar o queixo para a frente ou travar os dentes para “segurar” a nota aguda.',
    faca: 'Deixe a mandíbula descer um pouco a cada nota mais aguda. Nunca morda a nota.',
    exemplos: [
      '“Lá, lá, lá, lá, lá” subindo cinco notas e descendo, olhando no espelho: a mandíbula acompanha sem tremer.',
      'Fale uma frase exagerando a mastigação das palavras e depois cante a mesma frase com a mesma soltura.',
    ],
    demo: { kind: 'notes', pat: [0, 2, 4, 2, 0], d: 0.6, vowel: 'a', syl: '“lá-lá-lá-lá-lá”' },
  },
  {
    id: 'pescoco', trilha: 'soltar', name: 'Pescoço livre no agudo', tempo: '2 minutos',
    resumo: 'Subir o queixo no agudo encurta o espaço e aperta a voz.',
    porque: 'Quando a nota sobe, muita gente levanta o queixo e estica o pescoço, achando que ajuda. Em geral isso encurta o espaço da garganta e deixa a voz apertada.',
    passos: [
      'Fique diante de um espelho, ou da câmera frontal do celular, e cante uma escala de cinco notas subindo.',
      'Observe três coisas: o queixo sobe? As veias do pescoço aparecem? Os ombros levantam?',
      'Repita com o queixo paralelo ao chão, a nuca comprida e os ombros caídos.',
      'Imagine que o agudo sobe por dentro do corpo, a partir dos pés, e não é puxado para cima pela cabeça.',
      'Se a nota só sai com o queixo para cima, volte meio tom e diminua o volume. Depois suba de novo.',
    ],
    sinais: ['O queixo fica no mesmo lugar do grave ao agudo.', 'O pescoço não mostra veias nem tendões saltando.', 'Os ombros continuam baixos.'],
    evite: 'Jogar a cabeça para trás para alcançar a nota alta.',
    faca: 'Mantenha a cabeça onde está e diminua o volume. O agudo pede menos força, não mais.',
    exemplos: [
      '“Ê” em 1-2-3-4-5, com a mão leve sobre o pescoço: ele deve ficar macio o tempo todo.',
      'Cante a mesma escala duas vezes diante do espelho, uma com o queixo para cima e outra com o queixo neutro, e compare o esforço.',
    ],
    demo: { kind: 'notes', pat: [0, 2, 4, 5, 7, 5, 4, 2, 0], d: 0.55, vowel: 'e', syl: '“ê” em escala de cinco notas' },
  },
  {
    id: 'ar', trilha: 'ar', name: 'Ar constante', tempo: '3 minutos',
    resumo: 'Se o ar não sustenta, a garganta segura o som no lugar dele.',
    porque: 'Voz de garganta muitas vezes é voz com pouco apoio de ar. Quem controla a saída do ar são as costelas e o abdômen. A garganta só deixa o ar passar.',
    passos: [
      'Inspire baixo, pelo nariz: a barriga e as costelas de baixo se abrem e os ombros ficam parados.',
      'Solte o ar em “sss” por uns 10 segundos, com a saída igual do começo ao fim, sem jatos.',
      'Troque o “sss” por “zzz”, agora com voz, mantendo o mesmo fluxo de ar.',
      'Troque o “zzz” por “a” em uma nota confortável. A sensação tem de ser a mesma: o ar sai e a garganta não segura.',
      'Cante uma frase inteira em um fôlego, como quem sopra sobre uma vela sem apagar a chama.',
    ],
    sinais: ['O “sss” sai parelho e o “zzz” não tem solavancos.', 'Você termina a frase ainda com ar sobrando.', 'As costelas fecham devagar, não de uma vez.'],
    evite: 'Encher o peito, levantar os ombros e depois trancar o ar na garganta.',
    faca: 'Inspire baixo e deixe o ar sair. Se a garganta aperta, é ali que você está segurando o ar.',
    exemplos: [
      '“Sss” por 10 segundos, depois “zzz” por 10, depois “aaa” por 10, sempre com a mesma saída de ar.',
      'Frase em um fôlego: “Eu vou cantar bem leve, sem apertar, até o fim da frase”.',
    ],
    link: { href: '#/voz/respiracao', label: 'Treinar em Respiração' },
    demo: { kind: 'hold', d: 6, vowel: 'a', syl: '“aaa” parelho, do começo ao fim' },
  },
  {
    id: 'canudo', trilha: 'frente', name: 'Lábios e canudo', tempo: '2 minutos',
    resumo: 'Fecha um pouco a saída do som e a voz vibra com menos esforço.',
    porque: 'Lábios vibrando ou um canudo fecham parcialmente a saída do som. Isso devolve um pouco de pressão às pregas vocais, e elas vibram com bem menos esforço. Fonoaudiólogos usam esse tipo de exercício para aquecer e para soltar a voz.',
    passos: [
      'Com os lábios soltos e as bochechas relaxadas, faça “brrr” com ar contínuo. Se os lábios param, apoie as bochechas com os dedos.',
      'Faça uma sirene suave com o “brrr”: sobe e desce, sem apertar.',
      'Com um canudo, sopre e depois emita “uuu” em uma nota confortável por 5 a 10 segundos. Se quiser, use um copo com um pouco de água: as bolhas devem sair regulares.',
      'Tire o canudo, ou pare o “brrr”, e cante logo em seguida a mesma nota com “a”. Procure a mesma facilidade.',
    ],
    sinais: ['As bolhas saem parelhas.', 'A voz sai macia e sem esforço.', 'Ao cantar “a” logo depois, a nota parece mais fácil.'],
    evite: 'Soprar com força ou inflar as bochechas.',
    faca: 'Pouco ar, constante, em volume baixo. Se as bochechas incharem, segure-as com os dedos. Se ficar tonto, pare.',
    exemplos: [
      'Sirene: “uuu” sobe e desce com o canudo, como uma ambulância ao longe.',
      'Música: cante só a melodia do refrão que você quer treinar em “brrr” ou com o canudo, no ritmo certo.',
    ],
    demo: { kind: 'glide', path: [0, 10, 0], d: 4, vowel: 'u', syl: 'sirene “uuu”' },
  },
  {
    id: 'zumbido', trilha: 'frente', name: 'Zumbido “mmm” e “ng”', tempo: '2 minutos',
    resumo: 'Sente a voz na frente do rosto, e a garganta trabalha menos.',
    porque: 'Quando o som vibra nos lábios e no nariz, você sente a voz na frente do rosto. Esse é o chamado foco na frente, ou máscara. Com ele, a garganta deixa de ser o lugar onde o esforço acontece.',
    passos: [
      'Lábios juntos e dentes afastados: faça “mmm” numa nota confortável. Procure cócegas nos lábios e no nariz.',
      'Troque para “ng”, como no fim de “ring”: o fundo da língua encosta no céu da boca e a vibração sobe para o nariz.',
      'Faça uma sirene em “ng”, subindo e descendo devagar.',
      'Abra do zumbido para a vogal sem perder a sensação: “mmm-á”, “ng-á”. A vibração continua na frente.',
      'Teste do nariz: cante “á” e aperte o nariz com os dedos. Se o som muda muito, está nasal demais. Se quase não muda, está certo.',
    ],
    sinais: ['Dá para sentir a vibração nos lábios, no nariz e no rosto.', 'O “á” depois do zumbido soa claro, não nasal.', 'A garganta fica quieta.'],
    evite: 'Apertar a garganta no “ng” ou deixar o “á” nasal de verdade.',
    faca: 'Deixe o “ng” leve e abra a vogal sem fechar o fundo da garganta. Use o teste do nariz.',
    exemplos: [
      '“Mi-má-mó-má-mi” em cinco notas: o “m” prepara a frente e a vogal herda a sensação.',
      'Frase: “mmm… meu abraço vai com você”, começando em zumbido e abrindo na palavra “abraço”.',
    ],
    demo: { kind: 'notes', pat: [0, 2, 4, 5, 7, 5, 4, 2, 0], d: 0.5, vowel: 'u', syl: '“mmm” ou “ng” em escala' },
  },
  {
    id: 'brilho', trilha: 'frente', name: 'Brilho com “nhé”', tempo: '2 minutos',
    resumo: 'Um som fino e brilhante soa bem mesmo em volume baixo.',
    porque: 'Um timbre brilhante, como voz de bruxa ou de criança implicante, é ouvido bem longe com pouco volume. Assim você não precisa gritar para se destacar. Na técnica vocal, isso se chama twang.',
    passos: [
      'Imite uma bruxa, “nhéé-hé-hé”, ou uma criança implicante, “nhé, nhé, nhé”. O som fica fino e brilhante e sai quase sem esforço.',
      'Faça “nhé” numa nota confortável, em volume baixo. O brilho aparece mesmo sem volume.',
      'Suba e desça cinco notas com “nhé”. Se apertar, diminua o volume.',
      'Troque para palavras normais, como “neve” e “nenê”, e guarde um pouco desse brilho.',
      'Se arder ou arranhar, pare.',
    ],
    sinais: ['O som é fino e brilhante, mas sem aperto.', 'Dá para ouvir bem mesmo em volume baixo.', 'Não arde nem arranha.'],
    evite: 'Transformar o brilho em grito.',
    faca: 'Mantenha o volume baixo. Brilho é qualidade do timbre, não força.',
    exemplos: [
      '“Nhé, nhé, nhé” subindo e descendo cinco notas.',
      'Frase: “Nenê navega na nuvem”, primeiro com brilho e depois no tom normal. Compare o esforço.',
    ],
    demo: { kind: 'notes', pat: [0, 2, 4, 5, 7, 5, 4, 2, 0], d: 0.5, vowel: 'e', syl: '“nhé” em escala' },
  },
  {
    id: 'comeco', trilha: 'musica', name: 'Começo suave da nota', tempo: '2 minutos',
    resumo: 'Atacar a nota com pancada aperta a garganta logo no início.',
    porque: 'Atacar a nota com um golpe faz as pregas vocais baterem uma na outra, e a garganta se aperta logo no começo. Um início suave deixa a voz entrar junto com o ar, aos poucos.',
    passos: [
      'Diga “ha-ha-ha” sussurrado, com um sopro leve antes de cada vogal.',
      'Agora com voz: “haaa” numa nota confortável. O som entra junto com o ar, sem pancada.',
      'Tire o “h” aos poucos. Comece a vogal como quem começa um bocejo, sem estalo.',
      'Pratique frases que começam com vogal, imaginando um “h” escondido antes de cada uma.',
    ],
    sinais: ['Nenhum estalo no começo da nota.', 'A voz entra junto com o ar.', 'A garganta não aperta no ataque.'],
    evite: 'Bater a vogal como uma tosse leve, o chamado golpe de glote.',
    faca: 'Imagine o “h” escondido antes da vogal e deixe a nota nascer junto com o ar.',
    exemplos: [
      '“Ana ama a água azul.” Cante em uma nota só, com o “h” escondido antes de cada vogal.',
      '“Eu olho o outro lado e amo o ar.” A mesma coisa, subindo uma nota a cada vez.',
    ],
    demo: { kind: 'notes', pat: [0, 2, 4, 2, 0], d: 0.8, vowel: 'a', syl: '“haaa” com começo suave' },
  },
  {
    id: 'musica', trilha: 'musica', name: 'Da técnica para a música', tempo: '5 minutos',
    resumo: 'A ponte entre o exercício e a canção: volume em degraus.',
    porque: 'Os exercícios só valem se a sensação chegar às músicas. A ponte é cantar baixo, com a facilidade do exercício, e subir o volume aos poucos, até onde a garganta aguentar sem apertar.',
    passos: [
      'Escolha um trecho curto da música em que a garganta aperta, de dois a quatro compassos.',
      'Fale o trecho em voz de conversa, com o ritmo da música.',
      'Cante só a melodia em “brrr” ou em “mmm” e depois em “nhé”, mantendo a facilidade.',
      'Cante com a letra a 50% do volume. O som tem de parecer pequeno e fácil.',
      'Suba em três degraus: 50%, 70% e 100%. Pare no degrau em que a garganta começar a apertar.',
      'Treine nesse degrau por alguns dias antes de subir para o próximo.',
    ],
    sinais: ['A 50% a frase sai fácil.', 'Você sobe os degraus sem a garganta apertar.', 'A voz não fica rouca no fim do treino.'],
    evite: 'Pular direto para o volume total do trecho difícil.',
    faca: 'Suba em degraus. Parar a tempo faz parte do treino.',
    exemplos: [
      '50% é a voz de quem canta no quarto. 70% é cantar para uma pessoa na sala. 100% é cantar para uma plateia pequena.',
      'Se o trecho tem um agudo no fim, treine só os dois últimos compassos em “nhé” antes de juntar com o resto.',
    ],
    demo: null,
  },
];

/** Autodiagnóstico: cada sinal aponta técnicas, da mais importante para a menos. */
export const SINAIS = [
  { id: 'aperta', text: 'A garganta aperta quando a nota sobe', tecnicas: ['pescoco', 'ar', 'canudo'] },
  { id: 'queixo', text: 'O queixo sobe no agudo', tecnicas: ['pescoco', 'mandibula'] },
  { id: 'lingua', text: 'A língua endurece ou recua', tecnicas: ['mandibula', 'bocejo'] },
  { id: 'empurra', text: 'Preciso empurrar para a nota sair', tecnicas: ['ar', 'canudo', 'brilho'] },
  { id: 'cansa', text: 'A voz cansa ou fica rouca depois de cantar', tecnicas: ['canudo', 'bocejo', 'musica'] },
  { id: 'estalo', text: 'A nota começa com um estalo ou pancada', tecnicas: ['comeco', 'bocejo'] },
  { id: 'sem-ar', text: 'Fico sem ar no meio da frase', tecnicas: ['ar', 'canudo'] },
  { id: 'preso', text: 'O som fica preso e sem brilho, mesmo alto', tecnicas: ['zumbido', 'brilho', 'bocejo'] },
];

export const tecnica = (id) => TECNICAS.find((t) => t.id === id) || null;

/** Até `max` técnicas para os sinais marcados. O primeiro da lista de cada sinal pesa mais. */
export function recomendar(marcados, max = 3) {
  const pontos = new Map();
  for (const s of SINAIS) {
    if (!marcados.includes(s.id)) continue;
    s.tecnicas.forEach((id, i) => pontos.set(id, (pontos.get(id) || 0) + (3 - Math.min(i, 2))));
  }
  const ordem = (id) => TECNICAS.findIndex((t) => t.id === id);
  return [...pontos].sort((a, b) => b[1] - a[1] || ordem(a[0]) - ordem(b[0])).slice(0, max).map(([id]) => id);
}

/** Maior deslocamento, em semitons, que o exemplo toca acima da nota inicial. */
export function demoSpan(demo) {
  if (!demo) return 0;
  return Math.max(0, ...(demo.path || demo.pat || [0]));
}

const INICIO = { grave: 45, media: 50, aguda: 57 };
/** Nota inicial do exemplo: dentro da extensão medida, se houver; senão pela faixa escolhida. */
export function pickRoot(span, voice, faixa = 'media') {
  if (voice && Number.isFinite(voice.lo) && Number.isFinite(voice.hi)) {
    const first = voice.lo + 2, last = voice.hi - 1 - span;
    if (last >= first) return Math.round(first + (last - first) * 0.25);
    return Math.max(voice.lo, Math.round((voice.lo + voice.hi - span) / 2));
  }
  return INICIO[faixa] ?? INICIO.media;
}
