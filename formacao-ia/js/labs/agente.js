// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Laboratório do laço do agente: você decide cada rodada (pensar, agir, observar) até a resposta final.
import { h, clear } from '../core/ui.js';
import { marco } from '../core/estado.js';
import { hoje } from '../core/dia.js';
import { missao, semMissao } from './comum.js';

const MAX = 6;

export default function ({ missao: m, feito }) {
  const mi = m ? missao(['Use a **calculadora** para a conta.', 'Use **data_de_hoje** para a data.', 'Dê a **resposta final** só quando tiver as duas informações.'], feito) : semMissao();
  let rodada = 0, conta = null, data = null, fim = false;
  const traco = h('div.traco');
  const acoes = h('div.col');
  const p = (rot, cor, txt) => traco.append(h('div.p', { css: { '--c': cor } }, h('b', rot), txt));
  const passo = (tipo) => {
    if (fim) return;
    rodada++;
    if (tipo === 'calc') { p(`Rodada ${rodada} · agir`, 'var(--m3)', 'calculadora("240 * 0.15")'); conta = '36.0'; p('observar', 'var(--m4)', '36.0'); mi.marcar(0); }
    else if (tipo === 'data') { const d = hoje(); data = d.split('-').reverse().join('/'); p(`Rodada ${rodada} · agir`, 'var(--m3)', 'data_de_hoje()'); p('observar', 'var(--m4)', d); mi.marcar(1); }
    else if (tipo === 'busca') { p(`Rodada ${rodada} · agir`, 'var(--m3)', 'buscar_anotacoes("15% de 240")'); p('observar', 'var(--m4)', 'Nada encontrado nas anotações.'); p('pensar', 'var(--m1)', 'Essa ferramenta não serve para contas nem datas. Rodada gasta.'); }
    else {
      if (conta && data) {
        p(`Rodada ${rodada} · resposta final`, 'var(--ok)', `15% de 240 é 36, e hoje é ${data}.`); fim = true; mi.marcar(2); marco('agente');
      } else {
        p(`Rodada ${rodada} · resposta final`, 'var(--quase)', conta ? '15% de 240 é 36, e hoje é… (o modelo chutou uma data qualquer)' : data ? `Hoje é ${data}, e 15% de 240 é… uns 40? (conta de cabeça)` : 'Uns 40, e hoje deve ser segunda. (chute completo)');
        p('pensar', 'var(--m1)', 'Respondeu sem as observações: é assim que um agente alucina. Recomece e use as ferramentas antes.'); fim = true;
      }
    }
    if (!fim && rodada >= MAX) { p('limite', 'var(--quase)', `Teto de ${MAX} rodadas atingido. O laço parou: é o guardrail contra voltas sem fim.`); fim = true; }
    pintarAcoes();
  };
  const pintarAcoes = () => {
    clear(acoes);
    if (fim) { acoes.append(h('button.btn.block', { type: 'button', onclick: () => { rodada = 0; conta = data = null; fim = false; clear(traco); p('pergunta', 'var(--acao)', 'Quanto é 15% de 240, e que dia é hoje?'); pintarAcoes(); } }, 'Recomeçar')); return; }
    acoes.append(h('div.small.muted', `Rodada ${rodada + 1} de no máximo ${MAX}. O que o agente faz agora?`),
      h('button.btn.block', { type: 'button', onclick: () => passo('calc') }, 'Chamar calculadora("240 * 0.15")'),
      h('button.btn.block', { type: 'button', onclick: () => passo('data') }, 'Chamar data_de_hoje()'),
      h('button.btn.block', { type: 'button', onclick: () => passo('busca') }, 'Chamar buscar_anotacoes(…)'),
      h('button.btn.primary.block', { type: 'button', onclick: () => passo('final') }, 'Escrever a resposta final'));
  };
  p('pergunta', 'var(--acao)', 'Quanto é 15% de 240, e que dia é hoje?');
  pintarAcoes();
  return h('div.lab', mi.el, h('p.small.dim', 'Ferramentas disponíveis: calculadora, data_de_hoje e buscar_anotacoes. Você faz o papel do modelo: escolha a ação de cada rodada.'), traco, acoes);
}
