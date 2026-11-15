// "Este celular é de quem?" — aparece uma vez em cada celular (e ao aceitar o convite).
import { dados, definirPessoa, eu } from '../core/store.js';
import { esc, aviso, navegar } from '../core/ui.js';

export const titulo = 'Conta deste celular';

export function render(main, params = {}) {
  const e = dados();
  const ocupados = new Set(Object.values(e.aparelhos || {}).map((a) => a.pessoa));
  const temDados = e.lancamentos.some((l) => !l.dono);
  main.innerHTML = `<h1>Este celular é de quem?</h1>
    <p class="sub">O Finanças agora separa as contas de cada um. Tudo o que for lançado ou capturado neste celular fica na conta escolhida, e você decide o que compartilhar com o casal.</p>
    ${temDados ? `<p class="cartao sub">Os ${e.lancamentos.filter((l) => !l.dono).length} lançamentos que já estão neste celular passam a ser da conta escolhida, como <b>privados</b>. Depois você escolhe quais compartilhar.</p>` : ''}
    <div class="quem">${e.pessoas.map((p) => `<button type="button" class="btn quem-btn" data-p="${esc(p.id)}">
        <span class="avatar" aria-hidden="true">${esc(p.nome.slice(0, 1))}</span>
        <span><b>Conta ${esc(p.nome)}</b>${ocupados.has(p.id) && p.id !== eu() ? '<small>já tem um celular conectado</small>' : ''}</span>
      </button>`).join('')}</div>
    <p class="sub">Dá para trocar depois em Mais › Ajustes.</p>`;
  main.querySelectorAll('[data-p]').forEach((b) => (b.onclick = () => {
    definirPessoa(b.dataset.p);
    aviso(`Este celular agora é a Conta ${e.pessoas.find((p) => p.id === b.dataset.p).nome}.`);
    navegar(params.depois ? decodeURIComponent(params.depois) : '#/resumo');
  }));
}
