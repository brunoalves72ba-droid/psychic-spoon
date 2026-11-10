// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// As 16 aulas de harmonia: texto curto, experimento, exercício de cantar e três perguntas.

import { buildSteps } from '../music/theory.js';
import { AURORA, MARE, ODE, II_V_I_BLOCOS, II_V_I_SUAVE } from '../music/arrangements.js';

const P = (spec, n = 5, opts = {}) => buildSteps(spec.map((x) => (typeof x === 'string' ? [x, null, 2] : x)), { n, ...opts });
const shift = (notes, st) => notes.map((m) => m + st);

// aula 9
const DIATONICO = P(['Cmaj9', 'Am9', 'Dm9', 'G13', ['Cmaj9', null, 4]]);
const SECUNDARIO = P(['Cmaj9', ['A7b9', null, 2, 'A7 não é do tom de Dó. Ele é o V do Dm: um dominante secundário.'], 'Dm9', 'G13', ['Cmaj9', null, 4]]);
const SUBV = P(['Cmaj9', 'Am9', 'Dm9', ['Db9', null, 2, 'Db7 no lugar do G7. Os dois têm o mesmo trítono (Fá e Si). O baixo desce por semitom.'], ['Cmaj9', null, 4]]);
const DIMPASS = P(['Cmaj7', ['C#dim7', null, 2, 'Diminuto de passagem: o baixo sobe um semitom e liga o I ao ii.'], 'Dm7', 'G7', ['Cmaj7', null, 4]], 4, { lo: 50 });

// aula 10: harmonia em bloco (escala de sexta com diminuto) e acordes de aproximação
const BLOCO = [
  { c: 'C6/E', n: [64, 67, 69, 72], d: 1, t: 'Nota do acorde: C6 fechado sob a melodia.' },
  { c: 'Ddim7/F', n: [65, 68, 71, 74], d: 1, t: 'Nota de passagem: recebe um acorde diminuto.' },
  { c: 'C6/G', n: [67, 69, 72, 76], d: 1, t: 'De volta ao C6, uma inversão acima.' },
  { c: 'Fdim7/Ab', n: [68, 71, 74, 77], d: 1, t: 'Outra nota de passagem, outro diminuto.' },
  { c: 'C6/A', n: [69, 72, 76, 79], d: 2, t: 'As quatro vozes subiram juntas, no ritmo da melodia.' },
];
const CM7 = [48, 55, 59, 64], DM7 = [50, 57, 60, 65], G7 = [43, 53, 59, 62];
const SEM_APROX = [{ c: 'Cmaj7', n: CM7, d: 2 }, { c: 'Dm7', n: DM7, d: 2 }, { c: 'G7', n: G7, d: 2 }, { c: 'Cmaj7', n: CM7, d: 4 }];
const COM_APROX = [
  { c: 'Cmaj7', n: CM7, d: 1.5 }, { c: 'Ebm7', n: shift(DM7, 1), d: 0.5, t: 'Aproximação: o mesmo acorde do alvo, meio tom acima.' },
  { c: 'Dm7', n: DM7, d: 1.5, t: 'Alvo.' }, { c: 'Ab7', n: shift(G7, 1), d: 0.5, t: 'Meio tom acima do G7.' },
  { c: 'G7', n: G7, d: 1.5, t: 'Alvo.' }, { c: 'Dbmaj7', n: shift(CM7, 1), d: 0.5, t: 'Meio tom acima do Cmaj7.' }, { c: 'Cmaj7', n: CM7, d: 4, t: 'Chegada.' },
];

// aula 12
const MOD_PIVO = P(['Cmaj9', ['Am9', null, 2, 'Acorde pivô: é o vi de Dó e também o ii de Sol.'], ['D13', null, 2, 'Dominante do novo tom. O Fá sustenido é a nota nova.'], ['Gmaj9', null, 4, 'Chegamos a Sol maior.']]);
const MOD_DOM = P(['Cmaj9', ['Gm9', null, 2, 'O Si bemol avisa: estamos saindo de Dó.'], ['C13', null, 2, 'O I vira dominante do IV.'], ['Fmaj9', null, 4, 'Novo tom: Fá maior.']]);
const MOD_DIRETA = P(['Cmaj9', 'G13', 'Cmaj9', ['Ab13', null, 2, 'Sem preparação longa: só o dominante do novo tom.'], ['Dbmaj9', null, 4, 'Tudo meio tom acima. Muito usado no gospel para levantar a música.']]);

// aula 14
const T6_DOBRAS = P(['C', 'Am', 'Dm', 'G', ['C', null, 4]], 6, { spread: true, lo: 45 }).map((s) => ({ ...s, loose: true, t: 'Seis vozes, mas só três notas diferentes: muita dobra.' }));
const T6_SEIS = P([['Cmaj13', 74], ['Am11', 74], ['Dm11', 76], ['G13', 76], ['Cmaj13', 74, 4]], 6).map((s) => ({ ...s, t: 'Mesma progressão, agora com seis notas diferentes em cada acorde.' }));

// aula 15
const E_CORAL = P(['C', 'Am', 'F', 'G', ['C', null, 4]], 4, { spread: true, lo: 45 });
const E_BARBER = P([['C', 72], ['E7', 71], ['A7', 73], ['D7', 72], ['G7', 71], ['C', 72, 4]], 4, { lo: 50 });
const E_GOSPEL = P(['Cmaj9', ['C13', null, 2, 'O I vira dominante.'], 'Fmaj9', ['Fm6', null, 2, 'iv menor: empréstimo modal.'], 'Cmaj9/G', 'A7b13', 'Dm11', 'G13sus4', ['C69', null, 4]], 6);
const E_BOSSA = P([['Dm9', null, 1.5], ['G13', null, 2.5], ['Cmaj9', null, 1.5], ['A7b13', null, 2.5], ['Dm9', null, 1.5], ['Db9', null, 2.5], ['C69', null, 4]], 5);
const E_QUARTAL = [
  { c: 'Dm11', n: [50, 55, 60, 65], d: 2, t: 'Ré, Sol, Dó, Fá: só quartas.' }, { c: 'Em7add11', n: [52, 57, 62, 67], d: 2, t: 'O mesmo desenho um grau acima.' },
  { c: 'Fmaj7#11', n: [53, 59, 64, 69], d: 2, t: 'Quartas sobre o Fá. A primeira é aumentada: cor lídia.' }, { c: 'Em7add11', n: [52, 57, 62, 67], d: 2 }, { c: 'Dm11', n: [50, 55, 60, 65], d: 4, t: 'Harmonia modal: o acorde não “pede” resolução.' },
];

export const AULAS = [
  {
    id: 1, title: 'Intervalos', sub: 'Consonância, dissonância e as ondas',
    text: [
      'Som é vibração. Uma nota aguda vibra mais vezes por segundo que uma grave. Esse número é a <em class="t">frequência</em>, medida em hertz (Hz).',
      '<b>Intervalo</b> é a distância entre duas notas. Quando as duas frequências formam uma razão simples, como 2:1 ou 3:2, as ondas se reencontram logo e o ouvido sente repouso: é a <b>consonância</b>.',
      'Quando a razão é complicada, como 16:15, as ondas demoram a se reencontrar e o som fica áspero: é a <b>dissonância</b>. Ela não é erro. É a tensão que dá movimento à música.',
      'Contamos intervalos em <em class="t">semitons</em>, a menor distância do teclado. A 3ª maior tem 4 semitons, a 5ª justa tem 7 e a oitava tem 12.',
    ],
    lab: { type: 'ondas' },
    sing: { intro: 'O app sustenta um Dó. Cante por cima a quinta justa e depois a terça maior. Sinta a quinta “travar” no lugar.', backing: [48, 60], targets: [{ m: 67, label: 'a 5ª justa' }, { m: 64, label: 'a 3ª maior' }, { m: 72, label: 'a oitava' }] },
    quiz: [
      { q: 'Qual razão de frequências forma a oitava?', o: ['3:2', '2:1', '16:15'], a: 1, w: 'A nota de cima vibra exatamente o dobro.' },
      { q: 'Por que a 5ª justa soa estável?', o: ['Porque as notas estão longe', 'Porque a razão 3:2 é simples e as ondas se reencontram logo', 'Porque tem poucos semitons'], a: 1, w: 'Padrão curto, sensação de repouso.' },
      { q: 'Quantos semitons tem a 3ª maior?', o: ['3', '4', '5'], a: 1, w: 'A 3ª menor tem 3; a maior tem 4.' },
    ],
  },
  {
    id: 2, title: 'Tríades', sub: 'Três notas empilhadas em terças',
    text: [
      '<b>Tríade</b> é o acorde de três notas: <em class="t">fundamental</em> (a nota que dá nome), terça e quinta.',
      'O tipo depende das terças empilhadas. <b>Maior</b>: 3ª maior + 3ª menor. <b>Menor</b>: 3ª menor + 3ª maior. <b>Diminuta</b>: duas terças menores. <b>Aumentada</b>: duas terças maiores.',
      'A terça é a nota que decide se o acorde é maior ou menor. Um semitom muda tudo.',
      '<b>Inversão</b> é quando outra nota do acorde vai para o baixo. O acorde é o mesmo, mas a cor muda. Na cifra, aparece depois da barra: C/E é Dó maior com Mi no baixo.',
    ],
    lab: { type: 'acordes', options: [
      { label: 'Maior', sym: 'C', cap: '3ª maior + 3ª menor. Som aberto, estável.' }, { label: 'Menor', sym: 'Cm', cap: 'A terça desceu um semitom. Som mais escuro.' },
      { label: 'Diminuta', sym: 'Cdim', cap: 'Duas terças menores. A quinta diminuta deixa o acorde instável.' }, { label: 'Aumentada', sym: 'Caug', cap: 'Duas terças maiores. Som suspenso, sem direção clara.' },
      { label: '1ª inversão', sym: 'C/E', notes: [52, 55, 60], cap: 'Mi no baixo (C/E). Mais leve que a posição fundamental.' }, { label: '2ª inversão', sym: 'C/G', notes: [55, 60, 64], cap: 'Sol no baixo (C/G). Pede movimento.' },
    ] },
    sing: { intro: 'O app sustenta Dó e Sol: a fundamental e a quinta. Falta a terça, e é você quem decide o acorde. Cante a terça maior; depois desça um semitom e ouça virar menor.', backing: [48, 55], targets: [{ m: 64, label: 'a 3ª maior (acorde maior)' }, { m: 63, label: 'a 3ª menor (acorde menor)' }] },
    quiz: [
      { q: 'De que é feita a tríade maior?', o: ['3ª maior + 3ª menor', '3ª menor + 3ª maior', 'Duas terças maiores'], a: 0, w: 'A terça maior fica embaixo.' },
      { q: 'Qual tríade tem duas terças menores?', o: ['Aumentada', 'Menor', 'Diminuta'], a: 2, w: 'Por isso a quinta dela é diminuta.' },
      { q: 'O que a inversão muda?', o: ['As notas do acorde', 'A nota que fica no baixo', 'O tom da música'], a: 1, w: 'As notas são as mesmas; muda a ordem.' },
    ],
  },
  {
    id: 3, title: 'Tétrades', sub: 'A sétima entra no acorde',
    text: [
      '<b>Tétrade</b> é a tríade com mais uma terça em cima: a <b>sétima</b>. São quatro notas.',
      'As mais usadas: <b>maj7</b> (tríade maior + 7ª maior), <b>7</b> ou dominante (tríade maior + 7ª menor), <b>m7</b> (tríade menor + 7ª menor) e <b>m7(♭5)</b>, o meio-diminuto.',
      'O acorde <b>7</b> guarda um <em class="t">trítono</em> entre a terça e a sétima: seis semitons, o intervalo mais instável. É ele que faz o dominante pedir resolução.',
      'O <b>6</b> troca a sétima pela sexta: som de repouso, sem a doçura do maj7.',
    ],
    lab: { type: 'acordes', options: [
      { label: 'maj7', sym: 'Cmaj7', cap: '7ª maior: um semitom abaixo da oitava. Som doce, de repouso.' }, { label: '7', sym: 'C7', cap: 'Dominante. Mi e Si bemol formam um trítono: tensão.' },
      { label: 'm7', sym: 'Cm7', cap: 'Menor com 7ª menor. Macio, muito usado no ii grau.' }, { label: 'm7(♭5)', sym: 'Cm7b5', cap: 'Meio-diminuto: m7 com a quinta abaixada.' },
      { label: 'dim7', sym: 'Cdim7', cap: 'Só terças menores. Simétrico: divide a oitava em quatro partes iguais.' }, { label: 'm(maj7)', sym: 'Cm(maj7)', cap: 'Menor com 7ª maior. Cor de suspense.' }, { label: '6', sym: 'C6', cap: 'Sexta no lugar da sétima.' },
    ] },
    sing: { intro: 'O app sustenta a tríade de Dó maior. Cante a sétima maior (acorde maj7) e depois a sétima menor (acorde 7). Sinta a segunda “pedir” resolução.', backing: [48, 52, 55], targets: [{ m: 59, label: 'a 7ª maior (Cmaj7)' }, { m: 58, label: 'a 7ª menor (C7)' }] },
    quiz: [
      { q: 'Onde fica o trítono no acorde C7?', o: ['Entre a fundamental e a quinta', 'Entre a terça e a sétima', 'Entre a quinta e a sétima'], a: 1, w: 'Mi e Si bemol: seis semitons.' },
      { q: 'O que diferencia Cmaj7 de C7?', o: ['A terça', 'A quinta', 'A sétima'], a: 2, w: 'Maior no maj7, menor no 7.' },
      { q: 'Como também se chama o m7(♭5)?', o: ['Meio-diminuto', 'Aumentado', 'Suspenso'], a: 0, w: 'É um m7 com a quinta diminuta.' },
    ],
  },
  {
    id: 4, title: 'Campo harmônico maior', sub: 'Tônica, subdominante e dominante',
    text: [
      'Monte um acorde sobre cada nota da escala maior, usando só notas da escala. Você terá sete acordes: o <b>campo harmônico</b>.',
      'Usamos algarismos romanos para os graus: I, ii, iii, IV, V, vi, vii°. Maiúsculo é acorde maior; minúsculo é menor.',
      'Cada grau tem uma <b>função</b>. <b>Tônica</b> (I, iii, vi) é repouso. <b>Subdominante</b> (ii, IV) afasta. <b>Dominante</b> (V, vii°) cria tensão e pede a volta.',
      'O <b>círculo das quintas</b> organiza os doze tons. Tons vizinhos no círculo têm quase as mesmas notas. Toque em um tom e ouça seu campo.',
    ],
    lab: { type: 'campo' },
    sing: { intro: 'Cante as fundamentais da cadência mais comum: I, IV, V e volta ao I. É a linha do baixo.', backing: [], targets: [{ m: 60, label: 'o I' }, { m: 65, label: 'o IV' }, { m: 67, label: 'o V' }, { m: 60, label: 'o I de novo' }] },
    quiz: [
      { q: 'Quais graus têm função de tônica?', o: ['I, iii e vi', 'ii e IV', 'V e vii°'], a: 0, w: 'Eles compartilham notas com o I.' },
      { q: 'Qual função cria tensão e pede a volta ao I?', o: ['Tônica', 'Subdominante', 'Dominante'], a: 2, w: 'O V7 tem o trítono.' },
      { q: 'No tom de Dó maior, qual é o acorde do ii grau?', o: ['Dm7', 'Em7', 'Fmaj7'], a: 0, w: 'Ré é a segunda nota da escala.' },
    ],
  },
  {
    id: 5, title: 'Campo menor e empréstimo modal', sub: 'Cores do tom menor dentro do maior',
    text: [
      'A escala <b>menor natural</b> usa as mesmas notas da maior, começando no sexto grau. Lá menor é o <em class="t">relativo</em> de Dó maior.',
      'No campo menor, o i é menor, o ♭III, o ♭VI e o ♭VII são maiores e o ii é meio-diminuto. Para ter um dominante forte, a música costuma trocar o v menor por V7.',
      '<b>Empréstimo modal</b> é usar, em um tom maior, acordes do tom menor de mesmo nome (o <em class="t">homônimo</em>). Em Dó maior, eles vêm de Dó menor.',
      'O mais famoso é o <b>iv menor</b>: Fm no lugar de F. A terça desce um semitom e o acorde ganha saudade. Outros: ♭VI, ♭VII e ♭III.',
    ],
    lab: { type: 'campo', minor: true, borrowed: true },
    sing: { intro: 'O app sustenta Fá e Dó. Cante o Lá (acorde de Fá maior, o IV). Depois desça um semitom: o acorde vira Fá menor, o iv emprestado.', backing: [53, 60], targets: [{ m: 69, label: 'a 3ª maior do IV' }, { m: 68, label: 'a 3ª menor do iv (empréstimo)' }] },
    quiz: [
      { q: 'Qual é o relativo menor de Dó maior?', o: ['Dó menor', 'Lá menor', 'Mi menor'], a: 1, w: 'Mesmas notas, começando no sexto grau.' },
      { q: 'De onde vêm os acordes de empréstimo modal?', o: ['Do tom vizinho no círculo', 'Do tom menor de mesmo nome', 'De qualquer escala'], a: 1, w: 'Em Dó maior, vêm de Dó menor.' },
      { q: 'Em Dó maior, qual é o iv menor emprestado?', o: ['Fm', 'Gm', 'Dm'], a: 0, w: 'O IV é F; com a terça menor, vira Fm.' },
    ],
  },
  {
    id: 6, title: 'Condução de vozes', sub: 'Cada voz é uma melodia',
    text: [
      'Um acorde cantado é feito de pessoas. Cada uma canta uma linha. <b>Condução de vozes</b> é a arte de ligar um acorde ao outro com o menor movimento possível.',
      'Três regras simples: a <b>nota comum fica</b>; as outras andam para a nota mais próxima, de preferência por <em class="t">grau conjunto</em> (um tom ou um semitom); e a <b>sétima resolve descendo</b>.',
      'Linha que anda pouco é mais fácil de afinar e de decorar. E o acorde soa ligado, não aos saltos.',
      'Compare o mesmo ii–V–I de dois jeitos. Em blocos, todas as vozes saltam juntas. Com condução suave, duas ficam e duas descem um grau.',
    ],
    lab: { type: 'prog', options: [
      { label: 'Em blocos', steps: II_V_I_BLOCOS, tempo: 60, cap: 'Posição fundamental em todos os acordes: as quatro vozes saltam em paralelo.' },
      { label: 'Condução suave', steps: II_V_I_SUAVE, tempo: 60, cap: 'As mesmas cifras. Agora cada voz anda o mínimo.' },
    ] },
    sing: { intro: 'Cante a linha mais bonita do ii–V: o Dó (sétima do Dm7) desce para o Si (terça do G7). O app sustenta Sol e Fá.', backing: [43, 53], targets: [{ m: 60, label: 'a 7ª do Dm7' }, { m: 59, label: 'a 3ª do G7 (um semitom abaixo)' }] },
    quiz: [
      { q: 'O que fazer com uma nota que existe nos dois acordes?', o: ['Trocar de voz', 'Manter na mesma voz', 'Subir uma oitava'], a: 1, w: 'Nota comum fica.' },
      { q: 'Para onde a sétima do acorde costuma ir?', o: ['Desce por grau conjunto', 'Sobe uma quarta', 'Fica parada sempre'], a: 0, w: 'A 7ª do ii vira a 3ª do V.' },
      { q: 'Por que linhas com pouco movimento ajudam o grupo?', o: ['Ficam mais agudas', 'São mais fáceis de afinar', 'Soam mais alto'], a: 1, w: 'Menos salto, menos erro.' },
    ],
  },
  {
    id: 7, title: 'Tensões', sub: '9ª, 11ª, 13ª e alterações',
    text: [
      'Continue empilhando terças acima da sétima e você chega à <b>9ª</b>, à <b>11ª</b> e à <b>13ª</b>. São as <b>tensões</b>: notas que colorem o acorde sem mudar sua função.',
      'Elas são as mesmas notas da 2ª, da 4ª e da 6ª, uma oitava acima.',
      'Nem toda tensão serve em todo acorde. No acorde maior, a 11ª justa fica a um semitom (mais uma oitava) da terça e briga com ela; por isso se usa a <b>♯11</b>.',
      'No dominante vale quase tudo: ♭9, ♯9, ♯11 e ♭13 são as <b>alterações</b>. Elas aumentam a tensão antes da resolução.',
    ],
    lab: { type: 'tensoes', sets: [
      { label: 'Cmaj7', base: 'Cmaj7', cap: 'Acorde de tônica. Ligue as tensões uma a uma.', toggles: [{ label: '9', iv: 14, cap: '9ª: brilho, sem conflito. Quase sempre funciona.' }, { label: '♯11', iv: 18, cap: '♯11: cor lídia, flutuante.' }, { label: '13', iv: 21, cap: '13ª: é a sexta lá em cima. Doce.' }, { label: '11', iv: 17, cap: '11ª justa: ouça o choque com a terça (Mi). É a nota a evitar no acorde maior.' }] },
      { label: 'Cm7', base: 'Cm7', cap: 'Acorde menor: 9ª e 11ª soam muito bem.', toggles: [{ label: '9', iv: 14, cap: '9ª no menor: melancolia elegante.' }, { label: '11', iv: 17, cap: '11ª: no menor ela não briga com a terça.' }, { label: '13', iv: 21, cap: '13ª maior no menor: cor dórica.' }] },
      { label: 'C7', base: 'C7', cap: 'Dominante: aceita tensões naturais e alteradas.', toggles: [{ label: '9', iv: 14, cap: '9ª natural.' }, { label: '13', iv: 21, cap: '13ª natural: dominante “cheio”.' }, { label: '♭9', iv: 13, cap: '♭9: tensão forte, resolve descendo.' }, { label: '♯9', iv: 15, cap: '♯9: soa como terça menor por cima da maior. Blues.' }, { label: '♯11', iv: 18, cap: '♯11: dominante lídio.' }, { label: '♭13', iv: 20, cap: '♭13: escura, resolve descendo.' }] },
    ] },
    sing: { intro: 'O app sustenta um Cmaj7. Cante a 9ª e depois a 13ª. São notas que “flutuam” sobre o acorde: afine com calma.', backing: [48, 55, 59, 64], targets: [{ m: 62, label: 'a 9ª' }, { m: 69, label: 'a 13ª' }] },
    quiz: [
      { q: 'A 9ª é a mesma nota de qual grau, uma oitava acima?', o: ['2ª', '4ª', '6ª'], a: 0, w: '9 − 7 = 2.' },
      { q: 'Por que se evita a 11ª justa no acorde maior?', o: ['Porque é aguda demais', 'Porque choca com a terça', 'Porque muda o tom'], a: 1, w: 'Fica a um semitom (mais oitava) da terça.' },
      { q: 'Em que tipo de acorde as tensões alteradas (♭9, ♯9, ♭13) são mais usadas?', o: ['Maior com sétima maior', 'Dominante', 'Menor'], a: 1, w: 'Aumentam a tensão antes de resolver.' },
    ],
  },
  {
    id: 8, title: 'Aberturas', sub: 'Fechada, drop 2, aberta e seis vozes',
    text: [
      '<b>Abertura</b> (em inglês, <em class="t">voicing</em>) é o jeito de distribuir as notas do acorde entre as vozes. As notas são as mesmas; a ordem e a distância mudam.',
      '<b>Fechada</b>: todas as notas dentro de uma oitava, o mais juntas possível.',
      '<b>Drop 2</b>: pegue a abertura fechada e desça a segunda voz de cima uma oitava. O acorde respira e fica mais fácil de cantar.',
      '<b>Aberta</b>: mais de uma oitava entre as pontas, com intervalos largos embaixo. No grave, notas muito juntas embolam. Com <b>seis vozes</b>, o baixo fica na fundamental e as outras cinco formam um bloco acima.',
    ],
    lab: { type: 'acordes', options: [
      { label: 'Fechada', sym: 'Cmaj9', kind: 'fechada', cap: 'Tudo dentro de uma oitava. Compacto e denso.' }, { label: 'Drop 2', sym: 'Cmaj9', kind: 'drop2', cap: 'A segunda voz de cima desceu uma oitava.' },
      { label: 'Aberta', sym: 'Cmaj9', kind: 'aberta', cap: 'Fundamental e quinta embaixo, terça longe do baixo, tensões no alto.' }, { label: 'Seis vozes', sym: 'Cmaj13', kind: 'seis', title: 'Cmaj13', cap: 'Seis notas diferentes: o baixo sozinho embaixo e cinco vozes vizinhas em cima.' },
    ] },
    sing: { intro: 'O app sustenta Dó e Sol no grave. Cante a terça bem acima do baixo e depois a sétima maior. Longe do grave, elas soam limpas.', backing: [48, 55], targets: [{ m: 64, label: 'a 3ª, acima do baixo' }, { m: 71, label: 'a 7ª maior' }] },
    quiz: [
      { q: 'Como se faz um drop 2?', o: ['Desce a segunda voz de cima uma oitava', 'Desce o baixo uma oitava', 'Tira duas notas'], a: 0, w: 'Parte-se da abertura fechada.' },
      { q: 'Por que usar intervalos largos no grave?', o: ['Para cantar mais alto', 'Porque notas juntas no grave embolam', 'Para mudar o acorde'], a: 1, w: 'O grave pede espaço.' },
      { q: 'A abertura muda quais notas pertencem ao acorde?', o: ['Sim', 'Não, só a distribuição'], a: 1, w: 'Mesmas notas, outra ordem.' },
    ],
  },
  {
    id: 9, title: 'Substituto do trítono e dominantes secundários', sub: 'Mais caminhos até o mesmo lugar',
    text: [
      '<b>Dominante secundário</b> é o V7 de um grau que não é o I. Em Dó maior, o A7 é o V do Dm (escreve-se V/ii). Ele traz uma nota de fora do tom e empurra para o acorde seguinte.',
      'O <b>substituto do trítono</b> (sub V) troca um dominante por outro que está a um trítono de distância. G7 e D♭7 têm o mesmo trítono: Si e Fá. Com o D♭7, o baixo desce por semitom até o Dó.',
      'O <b>diminuto de passagem</b> liga dois graus vizinhos. Entre C e Dm, entra o C♯dim7: o baixo sobe por semitom.',
      'Os três fazem a mesma coisa: aumentam a vontade de chegar ao próximo acorde.',
    ],
    lab: { type: 'prog', options: [
      { label: 'Do tom', steps: DIATONICO, cap: 'Só acordes do campo de Dó maior: I, vi, ii, V, I.' }, { label: 'Dominante secundário', steps: SECUNDARIO, cap: 'O vi vira A7, o V do ii.' },
      { label: 'Sub V', steps: SUBV, cap: 'D♭7 no lugar do G7.' }, { label: 'Diminuto de passagem', steps: DIMPASS, cap: 'C♯dim7 entre o I e o ii.' },
    ] },
    sing: { intro: 'O app sustenta um Sol. Cante as duas notas do trítono do G7: primeiro o Si (terça), depois o Fá (sétima). São as mesmas notas que importam no D♭7.', backing: [43, 50], targets: [{ m: 59, label: 'a 3ª do G7' }, { m: 65, label: 'a 7ª do G7' }] },
    quiz: [
      { q: 'Qual acorde é o substituto do trítono do G7?', o: ['D♭7', 'D7', 'C7'], a: 0, w: 'Fica a um trítono de distância e tem o mesmo trítono interno.' },
      { q: 'Em Dó maior, o A7 é dominante de qual grau?', o: ['Do IV', 'Do ii', 'Do V'], a: 1, w: 'A7 resolve em Dm: V/ii.' },
      { q: 'O que o diminuto de passagem faz com o baixo?', o: ['Salta uma quinta', 'Liga dois graus por semitom', 'Fica parado'], a: 1, w: 'C, C♯, D.' },
    ],
  },
  {
    id: 10, title: 'Acordes de aproximação e harmonia em bloco', sub: 'Um acorde para cada nota',
    text: [
      'Na <b>harmonia em bloco</b>, todas as vozes andam juntas, no ritmo da melodia. Cada nota da melodia ganha seu próprio acorde.',
      'As notas que pertencem ao acorde do momento recebem esse acorde. E as <em class="t">notas de passagem</em>, que ficam entre elas? Uma solução clássica é dar a elas um acorde <b>diminuto</b>, que escorrega para o acorde seguinte.',
      '<b>Acorde de aproximação</b> é um acorde curto que chega ao alvo por semitom, de cima ou de baixo. Ele quase sempre é a cópia do acorde alvo, deslocada meio tom.',
      'A aproximação dura pouco e cai em tempo fraco. O ouvido aceita a dissonância porque ela resolve logo.',
    ],
    lab: { type: 'prog', options: [
      { label: 'Em bloco', steps: BLOCO, tempo: 76, cap: 'Melodia subindo de Dó a Sol. Notas do acorde recebem C6; notas de passagem recebem diminuto.' },
      { label: 'Sem aproximação', steps: SEM_APROX, tempo: 76, cap: 'I, ii, V, I, direto.' }, { label: 'Com aproximação', steps: COM_APROX, tempo: 76, cap: 'Antes de cada alvo, o mesmo acorde meio tom acima.' },
    ] },
    sing: { intro: 'O app sustenta um C6. Cante Dó, Ré e Mi. O Ré é nota de passagem: sinta que ele quer andar.', backing: [48, 52, 55, 57], targets: [{ m: 72, label: 'a nota do acorde' }, { m: 74, label: 'a nota de passagem' }, { m: 76, label: 'a nota do acorde' }] },
    quiz: [
      { q: 'Na harmonia em bloco, como as vozes se movem?', o: ['Cada uma no seu ritmo', 'Juntas, no ritmo da melodia', 'Só o baixo se move'], a: 1, w: 'Um acorde por nota.' },
      { q: 'Que acorde costuma harmonizar uma nota de passagem no estilo em bloco?', o: ['Diminuto', 'Aumentado', 'Suspenso'], a: 0, w: 'Ele escorrega para o acorde seguinte.' },
      { q: 'Como um acorde de aproximação chega ao alvo?', o: ['Por quinta', 'Por semitom', 'Por oitava'], a: 1, w: 'De cima ou de baixo.' },
    ],
  },
  {
    id: 11, title: 'Modos e harmonia quartal', sub: 'Sete cores da mesma escala',
    text: [
      'Toque a escala maior começando em cada uma das suas sete notas e você tem os sete <b>modos</b>: jônio, dórico, frígio, lídio, mixolídio, eólio e lócrio.',
      'Cada modo tem uma <b>nota característica</b>, a que o diferencia do maior ou do menor comum. No dórico é a 6ª maior; no lídio, a 4ª aumentada; no mixolídio, a 7ª menor.',
      'Na <b>harmonia modal</b> não há a corrida dominante–tônica. O acorde fica parado e a cor do modo é o assunto.',
      '<b>Harmonia quartal</b> empilha quartas em vez de terças. Sem terça embaixo, o acorde fica aberto, nem maior nem menor. Combina muito com música modal.',
    ],
    lab: { type: 'modos' },
    sing: { intro: 'O app sustenta Ré e Lá. Cante o Si natural (a 6ª maior, cor do dórico). Depois desça para o Si bemol (6ª menor, eólio). Ouça a diferença de luz.', backing: [50, 57], targets: [{ m: 71, label: 'a 6ª maior (dórico)' }, { m: 70, label: 'a 6ª menor (eólio)' }] },
    quiz: [
      { q: 'Qual é a nota característica do dórico?', o: ['6ª maior', '2ª menor', '4ª aumentada'], a: 0, w: 'É um menor com a sexta maior.' },
      { q: 'Qual modo é um maior com 4ª aumentada?', o: ['Mixolídio', 'Lídio', 'Frígio'], a: 1, w: 'A ♯4 dá a cor flutuante.' },
      { q: 'O que a harmonia quartal empilha?', o: ['Terças', 'Quartas', 'Oitavas'], a: 1, w: 'Por isso soa aberta.' },
    ],
  },
  {
    id: 12, title: 'Modulação', sub: 'Mudar de tom no meio da música',
    text: [
      '<b>Modulação</b> é a mudança de tom. A música passa a ter outra tônica e o ouvido aceita o novo centro.',
      '<b>Por acorde pivô</b>: usa-se um acorde que pertence aos dois tons. Ele entra com uma função e sai com outra.',
      '<b>Por dominante</b>: toca-se o V7 do novo tom. Ele traz a nota que faltava e aponta a chegada.',
      '<b>Direta</b>: muda-se sem preparação longa, muitas vezes meio tom ou um tom acima. É o recurso de levantar o último refrão.',
    ],
    lab: { type: 'prog', options: [
      { label: 'Acorde pivô', steps: MOD_PIVO, cap: 'De Dó para Sol. O Am pertence aos dois tons.' }, { label: 'Por dominante', steps: MOD_DOM, cap: 'De Dó para Fá. O C vira C7 e aponta o novo tom.' },
      { label: 'Direta', steps: MOD_DIRETA, cap: 'De Dó para Ré bemol: meio tom acima.' },
    ] },
    sing: { intro: 'O app sustenta Ré e Dó (um D7 sem terça). Cante o Fá sustenido: é a nota nova, a que anuncia Sol maior. Depois resolva no Sol.', backing: [50, 60], targets: [{ m: 66, label: 'a nota nova (sensível do novo tom)' }, { m: 67, label: 'a nova tônica' }] },
    quiz: [
      { q: 'O que é um acorde pivô?', o: ['Um acorde que pertence aos dois tons', 'O primeiro acorde da música', 'Um acorde sem terça'], a: 0, w: 'Ele muda de função no caminho.' },
      { q: 'Que nota Sol maior tem e Dó maior não tem?', o: ['Si bemol', 'Fá sustenido', 'Dó sustenido'], a: 1, w: 'É a sensível de Sol.' },
      { q: 'Na modulação direta…', o: ['Há uma longa preparação', 'O tom muda quase sem aviso', 'O tom não muda'], a: 1, w: 'No máximo, um dominante rápido.' },
    ],
  },
  {
    id: 13, title: 'Rearmonização', sub: 'A mesma melodia em quatro níveis',
    text: [
      '<b>Rearmonizar</b> é trocar os acordes de uma melodia sem mexer nela. A regra de ouro: a nota da melodia precisa ser nota do acorde ou uma tensão que ele aceita.',
      'Vamos ouvir a “Ode à Alegria”, de Beethoven (domínio público), em quatro níveis.',
      '<b>Uníssono</b>: só a melodia. <b>Coral a quatro</b>: tríades, como em um hinário. <b>Blocos de jazz a cinco</b>: tétrades com nona. <b>Seis vozes</b>: um acorde por nota, com tensões e baixo independente.',
      'Repare que a melodia é sempre a mesma. O que muda é o chão em que ela pisa.',
    ],
    lab: { type: 'prog', options: ODE.levels.map((lv) => ({ label: lv.name, steps: lv.steps, tempo: ODE.tempo, cap: lv.about })) },
    sing: { intro: 'Cante as quatro primeiras notas da melodia. O app sustenta Fá e Dó.', backing: [53, 60], targets: [{ m: 69, label: 'a 1ª nota' }, { m: 70, label: 'a 3ª nota (sobe meio tom)' }, { m: 72, label: 'a 4ª nota' }] },
    quiz: [
      { q: 'O que muda em uma rearmonização?', o: ['A melodia', 'Os acordes', 'A letra'], a: 1, w: 'A melodia fica.' },
      { q: 'Que relação a nota da melodia precisa ter com o novo acorde?', o: ['Ser nota do acorde ou tensão aceita', 'Ser sempre a fundamental', 'Nenhuma'], a: 0, w: 'Senão, ela briga com a harmonia.' },
      { q: 'O que diferencia o nível “coral a quatro” do nível “seis vozes”?', o: ['A melodia', 'O número de notas diferentes e as tensões', 'O tom'], a: 1, w: 'Tríades de um lado; acordes de seis notas do outro.' },
    ],
  },
  {
    id: 14, title: 'A linguagem de seis vozes', sub: 'O que se aprende ouvindo o Take 6',
    text: [
      'O sexteto vocal Take 6 é a grande referência de harmonia a seis vozes. Aqui não há transcrição de nenhum arranjo deles: estudamos os <b>princípios</b>, com progressões originais.',
      '<b>1. Seis notas diferentes.</b> Ninguém dobra ninguém. <b>2. Baixo independente.</b> Ele canta a fundamental e tem linha própria. <b>3. Tensões em todo acorde:</b> 9ª, 11ª e 13ª são regra, não enfeite.',
      '<b>4. Vozes vizinhas no miolo.</b> As vozes do meio cantam coladas, a um tom ou semitom umas das outras. <b>5. Um acorde por nota da melodia.</b> A harmonia anda junto com o líder.',
      '<b>6. Condução por grau conjunto.</b> Cada voz interna anda o mínimo. <b>7. Liga de grupo</b> (em inglês, <em class="t">blend</em>): mesma vogal, vibrato contido e volume equilibrado, para que seis pessoas soem como um só instrumento.',
    ],
    lab: { type: 'prog', options: [
      { label: 'Com dobras', steps: T6_DOBRAS, tempo: 60, cap: 'Tríades a seis vozes: várias pessoas cantam a mesma nota.' }, { label: 'Seis notas', steps: T6_SEIS, tempo: 60, cap: 'Mesmo caminho harmônico, sem dobras e com tensões.' },
      { label: 'Um acorde por nota', steps: MARE.steps, tempo: MARE.tempo, cap: 'A harmonia muda a cada nota do líder (arranjo “Maré”).' }, { label: 'Tudo junto', steps: AURORA.steps, tempo: AURORA.tempo, cap: 'O arranjo “Aurora”. Silencie vozes para ouvir o miolo.' },
    ] },
    sing: { intro: 'O app sustenta um Cmaj7 no grave. Ache o seu lugar no acorde: cante a 5ª, depois a 13ª e a 9ª. Pouco vibrato, vogal “u”.', backing: [48, 59, 64], targets: [{ m: 67, label: 'a 5ª' }, { m: 69, label: 'a 13ª' }, { m: 74, label: 'a 9ª' }] },
    quiz: [
      { q: 'O que significa “seis notas diferentes”?', o: ['Seis oitavas', 'Nenhuma voz dobra a nota de outra', 'Seis acordes por compasso'], a: 1, w: 'Cada voz tem a sua nota.' },
      { q: 'O que o baixo faz nessa linguagem?', o: ['Dobra o líder', 'Canta a fundamental com linha própria', 'Fica em silêncio'], a: 1, w: 'Baixo independente.' },
      { q: 'O que ajuda a liga de grupo (blend)?', o: ['Cada um com sua vogal', 'Vibrato largo em todas as vozes', 'Mesma vogal, vibrato contido e volume equilibrado'], a: 2, w: 'Seis vozes, um instrumento.' },
    ],
  },
  {
    id: 15, title: 'Estilos', sub: 'Coral, barbershop, gospel, bossa e quartal',
    text: [
      '<b>Coral SATB</b>: soprano, contralto, tenor e baixo. Tríades, melodia no soprano, condução cuidadosa. É a base dos hinários.',
      '<b>Barbershop</b>: quarteto em que a melodia fica na segunda voz de cima (o <em class="t">lead</em>), com o tenor harmonizando acima. Adora acordes de sétima dominante em sequência pelo círculo das quintas.',
      '<b>Gospel</b>: acordes cheios, dominantes secundários, empréstimo modal e suspensões. <b>Bossa</b>: tétrades com tensões e ritmo sincopado, que antecipa os acordes.',
      '<b>Quartal</b>: acordes por quartas, som moderno e aberto, sem pressa de resolver.',
    ],
    lab: { type: 'prog', options: [
      { label: 'Coral SATB', steps: E_CORAL, tempo: 66, cap: 'Tríades a quatro vozes.' }, { label: 'Barbershop', steps: E_BARBER, tempo: 72, cap: 'Dominantes em cadeia: E7, A7, D7, G7.' },
      { label: 'Gospel', steps: E_GOSPEL, tempo: 60, cap: 'Seis vozes, com iv menor e dominante suspenso.' }, { label: 'Bossa', steps: E_BOSSA, tempo: 120, cap: 'Acordes antecipados, fora do tempo forte.' }, { label: 'Quartal', steps: E_QUARTAL, tempo: 66, cap: 'Quartas empilhadas, em movimento paralelo.' },
    ] },
    sing: { intro: 'O app sustenta Dó e Si bemol: a casca de um C7, o acorde favorito do barbershop. Cante a terça e depois a quinta para completar.', backing: [48, 58], targets: [{ m: 64, label: 'a 3ª do C7' }, { m: 67, label: 'a 5ª do C7' }] },
    quiz: [
      { q: 'No barbershop, quem canta a melodia?', o: ['A voz mais aguda', 'A segunda voz de cima (lead)', 'O baixo'], a: 1, w: 'O tenor harmoniza acima dela.' },
      { q: 'O que significa SATB?', o: ['Soprano, contralto, tenor e baixo', 'Um tipo de acorde', 'Um ritmo'], a: 0, w: 'As quatro vozes do coral.' },
      { q: 'O que marca o ritmo harmônico da bossa?', o: ['Acordes sempre no tempo forte', 'Síncope: acordes antecipados', 'Ausência de acordes'], a: 1, w: 'O acorde chega antes do tempo.' },
    ],
  },
  {
    id: 16, title: 'Escrita a cappella', sub: 'Baixo, percussão, sílabas e texturas',
    text: [
      '<em class="t">A cappella</em> é música só com vozes. Sem instrumentos, as vozes fazem tudo: baixo, ritmo, harmonia e melodia.',
      'O <b>baixo vocal</b> dá a fundamental e o pulso. Sílabas com consoante firme, como “dum” e “bom”, definem o ataque.',
      'A <b>percussão vocal</b> imita a bateria: “b” ou “p” para o bumbo, “k” ou “pf” para a caixa, “t” ou “ts” para o chimbal.',
      'As <b>sílabas</b> mudam o timbre da cama de vozes: “uu” é escuro e some atrás do solo; “aa” é aberto e ocupa espaço. <b>Textura</b> é como as camadas se combinam: notas longas, acordes rítmicos, eco da melodia.',
    ],
    lab: { type: 'acappella' },
    sing: { intro: 'Faça o baixo vocal: cante “dum” em cada nota, curto e firme. Dó, Sol e Lá.', backing: [], targets: [{ m: 48, label: '“dum” na tônica' }, { m: 43, label: '“dum” na quinta' }, { m: 45, label: '“dum” no sexto grau' }], hold: 0.6 },
    quiz: [
      { q: 'Qual é o papel do baixo vocal?', o: ['Cantar a melodia', 'Dar a fundamental e o pulso', 'Fazer os agudos'], a: 1, w: 'Ele é o chão do arranjo.' },
      { q: 'O que a vogal da sílaba define?', o: ['O timbre', 'A altura', 'O andamento'], a: 0, w: '“uu” escuro, “aa” aberto.' },
      { q: 'Que som a percussão vocal costuma usar para o chimbal?', o: ['“dum”', '“ts”', '“aa”'], a: 1, w: 'Curto e agudo.' },
    ],
  },
];

/** Todas as progressões usadas nas aulas, para o teste automatizado. */
export function aulaProgressions() {
  const out = [];
  for (const a of AULAS) if (a.lab.type === 'prog') for (const o of a.lab.options) out.push([`aula ${a.id} · ${o.label}`, o.steps]);
  return out;
}
