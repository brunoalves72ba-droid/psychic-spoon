// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Primeira abertura: pergunta como a pessoa quer ser chamada. Depois vem as boas-vindas e a tela Hoje.
import { h } from './ui.js';
import { nomeUsuario, definirNome } from './estado.js';

/** Testes automáticos podem pular a abertura (window.__FIA_SEM_ABERTURA = true antes do app carregar). */
export const pularAbertura = () => typeof window !== 'undefined' && window.__FIA_SEM_ABERTURA === true;

/** Mostra a pergunta do nome se ainda não há nome. Resolve quando a pessoa confirma. */
export function pedirNome() {
  if (nomeUsuario() || pularAbertura()) return Promise.resolve(false);
  return new Promise((ok) => {
    const erro = h('p.campo-erro', { id: 'nome-erro', 'aria-live': 'polite' });
    const campo = h('input', { type: 'text', id: 'nome-campo', autocomplete: 'given-name', autocapitalize: 'words', maxLength: 40, enterkeyhint: 'done', 'aria-describedby': 'nome-erro' });
    const form = h('form.abertura-caixa.col', { novalidate: true },
      h('h1', { id: 'nome-tit' }, 'Como você quer ser chamado?'),
      h('label.field', { for: 'nome-campo' }, h('span', 'Seu nome ou apelido'), campo),
      erro,
      h('button.btn.primary.big.block', { type: 'submit' }, 'Continuar'));
    const tela = h('div.abertura', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'nome-tit' }, form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!definirNome(campo.value)) { erro.textContent = 'Escreva um nome para continuar.'; campo.setAttribute('aria-invalid', 'true'); campo.focus(); return; }
      tela.classList.add('saindo');
      setTimeout(() => { tela.remove(); ok(true); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280);
    });
    campo.addEventListener('input', () => { if (erro.textContent) { erro.textContent = ''; campo.removeAttribute('aria-invalid'); } });
    document.body.append(tela);
    setTimeout(() => campo.focus(), 50);
  });
}
