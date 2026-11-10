// Sexteto — © Bruno Moura, único e exclusivo proprietário.
import { h, top, seg } from '../core/ui.js';

const DICAS = [
  { id: 'postura', name: 'Postura', items: [
    ['Pés e joelhos', 'Pés na largura do quadril, peso dividido, joelhos soltos (não travados).'],
    ['Coluna comprida', 'Imagine um fio puxando o alto da cabeça. Peito aberto sem estufar, ombros para baixo e para trás.'],
    ['Pescoço livre', 'Queixo paralelo ao chão. Subir o queixo no agudo aperta a garganta: mantenha a cabeça onde está.'],
    ['Sentado', 'Sente na ponta da cadeira, com os dois pés no chão e as costas longe do encosto.'],
  ] },
  { id: 'apoio', name: 'Apoio', items: [
    ['O que é', '<b>Apoio</b> é o controle da saída do ar. Quem trabalha são os músculos do abdômen e das costelas, não a garganta.'],
    ['Inspire baixo', 'Ao inspirar, a barriga e as costelas de baixo se abrem para os lados e para trás. Ombros quietos.'],
    ['Segure a abertura', 'Ao cantar, tente manter as costelas abertas por mais tempo. O ar sai devagar e firme.'],
    ['Teste', 'Faça “sss” por 15 segundos com som igual do começo ao fim. Se o som falha ou sai em jatos, o apoio oscilou.'],
  ] },
  { id: 'ressonancia', name: 'Ressonância', items: [
    ['O que é', '<b>Ressonância</b> é o reforço do som nos espaços da garganta, da boca e do nariz. É ela que dá volume sem esforço.'],
    ['Espaço', 'Pense em um começo de bocejo: o fundo da boca sobe e a garganta abre. Sem exagerar, para o som não ficar “de batata quente”.'],
    ['Foco na frente', 'Zumbir “mmm” e sentir cócegas nos lábios e no nariz ajuda a projetar o som com pouco ar.'],
    ['Vogais', 'Cada vogal muda a forma da boca e, com ela, o timbre. No agudo, arredonde um pouco as vogais abertas.'],
  ] },
  { id: 'registros', name: 'Registros e passagem', items: [
    ['Peito', '<b>Voz de peito</b>: a da fala. Cheia, com vibração sentida no peito. Domina o grave.'],
    ['Cabeça e falsete', '<b>Voz de cabeça</b>: leve, com sensação de vibração na cabeça. O <b>falsete</b> é ainda mais leve e soproso.'],
    ['Mista', '<b>Voz mista</b>: equilíbrio entre as duas. É o que permite atravessar a região do meio sem quebra.'],
    ['Passagem', 'A <b>passagem</b> é a região em que a voz quer trocar de registro. Não empurre o peito para cima: diminua o volume, estreite a vogal e deixe a voz afinar.'],
    ['Treino', 'Sirenes e “nei-nei” em volume baixo, todos os dias, costuram os registros com o tempo.'],
  ] },
  { id: 'blend', name: 'Liga de grupo', items: [
    ['O que é', '<b>Liga de grupo</b> (<i lang="en">blend</i>): as vozes se fundem e soam como um instrumento só.'],
    ['Mesma vogal', 'Combinem a forma de cada vogal. Um “a” aberto ao lado de um “a” fechado nunca funde.'],
    ['Vibrato contido', 'Em acordes fechados, vibrato largo borra a afinação. Use pouco, ou nota reta.'],
    ['Volume', 'Cante de modo a ouvir as vozes vizinhas. Se você só ouve a si mesmo, está alto demais.'],
    ['Ataque e corte', 'Comecem e terminem juntos. Combinem onde respirar e onde entram as consoantes finais.'],
    ['Afine por dentro', 'Terças maiores soam melhor um pouquinho baixas e quintas, bem puras. Ouça o acorde, não só a sua nota.'],
  ] },
  { id: 'saude', name: 'Saúde vocal', items: [
    ['Água', 'Beba água ao longo do dia. As pregas vocais precisam de hidratação, e ela vem de dentro.'],
    ['Aqueça e desaqueça', 'Cinco a dez minutos de aquecimento leve antes de cantar. No fim, sirenes descendentes em volume baixo.'],
    ['Descanso', 'Sono e pausas de silêncio fazem parte do treino. Voz cansada precisa de repouso, não de mais força.'],
    ['Evite', 'Gritar, pigarrear com força e cochichar por muito tempo. Fumaça e álcool em excesso ressecam.'],
    ['Dor é sinal de parada', 'Cantar não deve doer. Se doer, arder ou apertar, pare.'],
    ['Quando procurar ajuda', 'Rouquidão por mais de duas semanas, perda de notas ou cansaço vocal frequente pedem avaliação de um otorrinolaringologista ou de um fonoaudiólogo. Este app não faz diagnóstico.'],
  ] },
];
export default async function dicas(el, [idArg]) {
  let cur = DICAS.find((d) => d.id === idArg) || DICAS[0];
  const box = h('section.list');
  const paint = () => box.replaceChildren(...cur.items.map(([t, d]) => h('div.card.tight', h('h3', t), h('p.dim', { html: d }))));
  paint();
  el.append(top('Dicas', '#/voz'), seg(DICAS.map((d) => ({ v: d.id, label: d.name })), cur.id, (v) => { cur = DICAS.find((d) => d.id === v); paint(); }, { label: 'Tema' }), box);
}
