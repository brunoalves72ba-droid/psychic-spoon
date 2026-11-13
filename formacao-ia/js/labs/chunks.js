// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Laboratório de chunking: tamanho, sobreposição e corte em fim de frase.
import { h, clear, slider, toggle, fmt } from '../core/ui.js';
import { chunk } from '../core/texto.js';
import { missao, semMissao } from './comum.js';

export const TEXTO = 'Um LLM prevê o próximo token a partir do texto que recebe. Token é um pedaço de texto: pode ser uma palavra inteira, parte de uma palavra ou um sinal. As APIs cobram por token, tanto na entrada quanto na saída. A janela de contexto é o limite de tokens que o modelo considera de uma vez. Nela cabem as instruções, o histórico, os documentos colados e também a resposta. Quando a conversa passa do limite, as partes mais antigas são cortadas ou resumidas. A temperatura controla o sorteio entre os pedaços prováveis. Com temperatura baixa, as respostas ficam previsíveis; com temperatura alta, ficam variadas. Alucinação é uma afirmação falsa com aparência de verdadeira. Ela aparece mais em citações, números, datas e leis. Para reduzir, dê a fonte ao modelo, autorize o “não sei” e confira o que importa. O RAG busca trechos relevantes do seu material e os coloca no prompt antes da pergunta. Assim o modelo responde com base no que leu naquele momento, e pode citar a fonte.';

export default function ({ missao: m, feito }) {
  const mi = m ? missao(['Pedaços de **400 a 600** caracteres.', 'Com **sobreposição** maior que zero.', 'Cortando só em **fim de frase**.'], feito) : semMissao();
  let tam = 200, sob = 0, frase = false;
  const resumo = h('div.small.dim');
  const lista = h('div.col', { style: { gap: '8px' } });
  const pintar = () => {
    const cs = chunk(TEXTO, tam, sob, frase);
    const tamanhos = cs.map((c) => c.texto.length);
    resumo.textContent = `${cs.length} pedaços · de ${Math.min(...tamanhos)} a ${Math.max(...tamanhos)} caracteres · texto com ${fmt(TEXTO.length)} caracteres`;
    clear(lista);
    cs.forEach((c, i) => {
      const prox = cs[i + 1];
      const corte = prox && prox.ini < c.fim ? prox.ini - c.ini : c.texto.length;
      lista.append(h('div.card.flat.tight', h('div.row.between.small.muted', h('b', `Pedaço ${i + 1}`), h('span', `${c.texto.length} caracteres`)),
        h('div.pedacos', h('span', { css: { '--c': 'var(--acao)' } }, c.texto.slice(0, corte)), corte < c.texto.length ? h('span.sob', { title: 'Repete no próximo pedaço' }, c.texto.slice(corte)) : null)));
    });
    if (tam >= 400 && tam <= 600) mi.marcar(0);
    if (sob > 0) mi.marcar(1);
    if (frase) mi.marcar(2);
  };
  pintar();
  return h('div.lab', mi.el,
    slider('Tamanho máximo do pedaço', { min: 100, max: 1000, step: 20, value: tam, unit: 'caracteres' }, (v) => { tam = v; pintar(); }),
    slider('Sobreposição', { min: 0, max: 200, step: 10, value: sob, unit: 'caracteres' }, (v) => { sob = v; pintar(); }),
    toggle('Cortar só em fim de frase', frase, (v) => { frase = v; pintar(); }),
    resumo, h('p.small.muted', 'O trecho em amarelo se repete no começo do pedaço seguinte.'), lista);
}
