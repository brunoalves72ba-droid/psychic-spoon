// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Por que o app é assim: cada escolha de desenho, com o grau de evidência e a leitura honesta.
import { h, top } from '../core/ui.js';

const APRENDER = [
  ['Prática de recuperação', 'Alta', 'Dunlosky et al. (2013) deram “alta utilidade” à prática de testes.', 'Toda lição termina com quiz; Hoje começa com uma pergunta-relâmpago.'],
  ['Prática distribuída', 'Alta', 'Espalhar o estudo no tempo supera concentrar (mesmo estudo).', 'Cartões que voltam em 1, 3, 7 e 21 dias.'],
  ['Intercalação', 'Moderada', '“Utilidade moderada” em Dunlosky et al.', 'Revisão misturada, com perguntas de vários módulos.'],
  ['Autoexplicação', 'Moderada', 'Também “moderada”.', 'Exercícios de explicar com as próprias palavras e comparar.'],
  ['Exemplos resolvidos e “desbotados”', 'Forte para novatos', 'Um dos efeitos mais replicados da Teoria da Carga Cognitiva; remover passos aos poucos teve o maior efeito na meta-análise de Crissman (2006).', 'Exemplo resolvido em toda lição; lacunas que crescem de 1 passo até “do zero”.'],
  ['Reversão da expertise', 'Forte', 'Exemplos detalhados ajudam novatos e atrapalham quem já domina.', 'O andaime diminui quando você acerta de primeira 80% das vezes.'],
  ['Microlearning e carga cognitiva', 'Coerente com a teoria', 'A memória de trabalho do novato é limitada.', 'Um conceito por lição, de 5 a 10 minutos.'],
  ['Projetos com andaime', 'Moderada', 'Descoberta livre sobrecarrega novatos.', 'Um projeto só, em missões de 10 a 25 minutos com lista de conferência.'],
  ['Reler e grifar', 'Baixa', 'Baixa utilidade.', 'Não existe “modo leitura” como atividade principal.'],
];
const TDAH = [
  ['Externalizar no “ponto de desempenho” (Barkley)', 'Base teórica e clínica forte', 'Para Barkley, o TDAH é um transtorno de desempenho, não de conhecimento; consequências devem ser mais externas, frequentes e marcantes.', 'Próximo passo e relógio sempre visíveis; instruções na tela.'],
  ['Recompensa e feedback imediatos', 'Forte (laboratório)', 'Modelo de aversão à espera (Sonuga-Barke); meta-análise de Marx et al. (2021): recompensas concretas e próximas pesam mais.', 'Resposta na hora em cada pergunta; XP ao fim de cada passo.'],
  ['Metas pequenas e visíveis', 'Consenso clínico', 'Projetos longos têm consequências distantes demais.', 'Missões curtas; o APE-IA aparece crescendo.'],
  ['Apps e intervenções digitais', 'Inconclusiva', 'Revisão de 26 revisões sistemáticas (BMC Psychiatry, 2025): benefícios potenciais, evidência de baixa qualidade.', 'O app é andaime, não tratamento.'],
  ['Gamificação', 'Mista', 'Em apps de saúde mental, sem efeito na adesão (JMIR, 2021); dados da Duolingo são da própria empresa.', 'XP e conquistas por habilidade, sem ranking e com sequência que perdoa.'],
  ['Pomodoro', 'Fraca para TDAH', 'Sem ensaio clínico em TDAH; resultados mistos com universitários.', 'Relógio ajustável (10/15/25) que avisa e não interrompe.'],
  ['Body doubling', 'Fraca', 'A CHADD diz que não há pesquisa significativa; estudos pequenos e um levantamento.', '“Estudar junto” como opção no modo foco.'],
  ['Hiperfoco', 'Descritivo', 'Adultos com mais sintomas relatam hiperfoco com mais frequência.', '“Continuar no fluxo”: o app nunca corta quem está no embalo.'],
];
const tabela = (linhas) => h('div.list', linhas.map(([t, ev, pesq, app]) => h('section.card.flat.tight', h('div.row.between.top-al', h('b', t), h('span.tag' + (/Alta|Forte/.test(ev) ? '.ok' : /Fraca|Baixa|Inconclusiva/.test(ev) ? '.ouro' : ''), ev)), h('p.small.dim', { style: { margin: '6px 0' } }, pesq), h('p.small', h('b', 'No app: '), app))));

export default async function (el) {
  el.append(top('Por que o app é assim', '#/progresso'),
    h('p.dim', 'Os pilares são estrutura externa, passos minúsculos, resposta imediata, revisão espaçada e quase nenhum esforço para começar. Gamificação, Pomodoro e “estudar junto” são camadas opcionais.'),
    h('h3', 'Ciência da aprendizagem'), tabela(APRENDER),
    h('h3', 'TDAH: o que tem evidência e o que é só popular'), tabela(TDAH),
    h('div.callout.aviso', h('span.rot', 'Ressalvas'), 'A pesquisa de aversão à espera e de “ponto de desempenho” vem sobretudo de crianças e de laboratório; aplicá-la a um app para adultos é extrapolação razoável, não prova. Este app complementa, e não substitui, o acompanhamento clínico do TDAH.'),
    h('p.small.muted', 'Fontes completas no documento de currículo que originou o app (seções 1.1, 1.2 e 13).'));
}
