// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Laboratório da janela de contexto: a mesa enche e as mensagens antigas saem.
import { h, clear, progressBar } from '../core/ui.js';
import { tokensAprox } from '../core/texto.js';
import { missao, semMissao } from './comum.js';

const JANELA = 90;    // tokens (mesa pequena, de brinquedo)
const RESPOSTA = 20;  // espaço reservado para a resposta
const FALAS = [
  ['você', 'Me ajuda a montar um plano de estudo para a semana?'],
  ['modelo', 'Claro! Quantas horas por dia você tem disponíveis?'],
  ['você', 'Umas duas horas, mas só à noite, depois do trabalho.'],
  ['modelo', 'Então sugiro blocos de 25 minutos com pausas curtas entre eles.'],
  ['você', 'E como encaixo a revisão dos cartões nesse plano?'],
  ['modelo', 'Comece cada noite com 10 minutos de cartões, antes da lição nova.'],
  ['você', 'Responda em inglês daqui para frente, por favor.'],
];

export default function ({ missao: m, feito }) {
  const mi = m ? missao(['Envie mensagens até a mesa encher.', 'Veja a **regra do início** sair da mesa.'], feito) : semMissao();
  const msgs = [['regra', 'Regra: responda sempre em português e em até 3 frases.']];
  let k = 0;
  const lista = h('div.mesa-ctx');
  const uso = h('div');
  const aviso = h('div.why.hide', { role: 'status' });
  const pintar = () => {
    // corta as mais antigas até caber (sem fixar a regra: é o que muitos apps fazem)
    let total = RESPOSTA; const dentro = new Array(msgs.length).fill(false);
    for (let i = msgs.length - 1; i >= 0; i--) { const n = tokensAprox(msgs[i][1]).length; if (total + n <= JANELA) { total += n; dentro[i] = true; } else break; }
    clear(lista);
    msgs.forEach(([q, t], i) => lista.append(h('div.msg' + (dentro[i] ? '' : '.fora'), h('span', h('b', q), ' ', t), h('span.small.muted.num', `${tokensAprox(t).length}`))));
    clear(uso).append(h('div.row.between.small', h('span', `Mesa: ${total} de ${JANELA} tokens`), h('span.muted', `${RESPOSTA} reservados para a resposta`)), progressBar(total / JANELA, total / JANELA > 0.85 ? 'var(--quase)' : 'var(--acao)'));
    if (msgs.length > 3) mi.marcar(0);
    if (!dentro[0]) { mi.marcar(1); aviso.className = 'why no'; aviso.textContent = 'A regra do início saiu da mesa. Para o modelo, ela não existe mais: é por isso que, em conversas longas, ele “esquece” instruções.'; }
  };
  const enviar = () => { if (k < FALAS.length) { msgs.push(FALAS[k++]); pintar(); } };
  pintar();
  return h('div.lab', mi.el, h('p.small.dim', `Uma mesa de brinquedo com ${JANELA} tokens. Mesas de verdade têm centenas de milhares; a lógica é a mesma.`), uso, lista, aviso,
    h('div.row', h('button.btn.primary.grow', { type: 'button', onclick: enviar }, 'Enviar a próxima mensagem'), h('button.btn', { type: 'button', onclick: () => { msgs.splice(1); k = 0; aviso.className = 'why hide'; pintar(); } }, 'Conversa nova')));
}
