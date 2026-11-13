// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Captura de distração: anotar o pensamento intruso sem sair de onde está.
import { h, sheet, toast } from './ui.js';
import { anotarPensamento } from './estado.js';

export function capturar() {
  const ta = h('textarea', { rows: 3, placeholder: 'Ex.: pagar o boleto, responder a mensagem, pesquisar aquela ideia…', 'aria-label': 'Pensamento para guardar', maxLength: 500 });
  const close = sheet([
    h('h3', 'Anotar e voltar'),
    h('p.small.muted', 'Tire da cabeça e siga em frente. Fica guardado em Progresso › Pensamentos.'),
    ta,
    h('button.btn.primary.block', { type: 'button', onclick: () => { const ok = anotarPensamento(ta.value); close(); if (ok) toast('Anotado. De volta ao que importa agora.'); } }, 'Guardar e voltar'),
  ]);
}
