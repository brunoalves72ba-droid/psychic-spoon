// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Laboratório do nó IF: os itens chegam como texto, e a comparação muda com o tipo escolhido.
import { h, clear, seg } from '../core/ui.js';
import { missao, semMissao } from './comum.js';

// do formulário, as notas chegam como texto
export const ITENS = [{ nome: 'Ana', nota: '8' }, { nome: 'Bia', nota: '6' }, { nome: 'Caio', nota: '10' }];
const OPS = { '>=': (a, b) => a >= b, '>': (a, b) => a > b, '==': (a, b) => a === b, '<': (a, b) => a < b };

/** Divide os itens em [verdadeiros, falsos] com o tipo de comparação escolhido. */
export function dividir(itens, op, alvo, tipo) {
  const v = [], f = [];
  for (const it of itens) {
    const a = tipo === 'Number' ? Number(it.nota) : String(it.nota);
    const b = tipo === 'Number' ? Number(alvo) : String(alvo);
    (OPS[op](a, b) ? v : f).push(it.nome);
  }
  return [v, f];
}

export default function ({ missao: m, feito }) {
  const mi = m ? missao(['Monte “nota **maior ou igual a 7**”.', 'Faça **Ana e Caio** irem para true e **Bia** para false.'], feito) : semMissao();
  let op = '>=', tipo = 'String';
  const alvo = h('input.inp', { type: 'text', value: '7', inputMode: 'decimal', 'aria-label': 'Valor de comparação', style: { maxWidth: '100px' } });
  const pistas = h('div.rota');
  const obs = h('div.why', { role: 'status' });
  const pintar = () => {
    const [v, f] = dividir(ITENS, op, alvo.value, tipo);
    clear(pistas).append(h('div.v', h('h4', 'true'), ...v.map((n) => h('div', n))), h('div.f', h('h4', 'false'), ...f.map((n) => h('div', n))));
    const certo = v.join() === 'Ana,Caio' && f.join() === 'Bia';
    if (op === '>=' && alvo.value.trim() === '7') mi.marcar(0);
    if (certo && op === '>=') mi.marcar(1);
    obs.className = 'why' + (certo ? ' ok' : ' no');
    obs.textContent = certo ? 'Cada aluno na pista certa.' : tipo === 'String' && f.includes('Caio') ? 'O Caio (10) caiu na pista errada: como texto, “10” vem antes de “7”, porque se compara caractere por caractere. Troque o tipo.' : 'Ainda não é a divisão certa. Confira o operador e o valor.';
  };
  alvo.addEventListener('input', pintar); pintar();
  return h('div.lab', mi.el,
    h('div.small.muted', 'Itens que chegaram do formulário:'), h('pre.jtree', ITENS.map((x) => JSON.stringify(x)).join('\n')),
    h('div.card.flat.col', h('div.small', h('b', 'Valor: '), h('code', '{{ $json.nota }}')),
      h('label.field', h('span', 'Tipo da comparação'), seg(['String', 'Number'], tipo, (v) => { tipo = v; pintar(); }, { label: 'Tipo' })),
      h('label.field', h('span', 'Operador'), seg([{ v: '>=', label: 'maior ou igual' }, { v: '>', label: 'maior' }, { v: '==', label: 'igual' }, { v: '<', label: 'menor' }], op, (v) => { op = v; pintar(); }, { wrap: true, label: 'Operador' })),
      h('label.field', h('span', 'Comparar com'), alvo)),
    pistas, obs);
}
